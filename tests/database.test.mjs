import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const schema = (await readFile(new URL('../docs/DB-schema.sql', import.meta.url), 'utf8'))
  .replace('create extension if not exists "uuid-ossp";', () => 'create function uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;');
const conflictMigration = await readFile(new URL('../supabase/migrations/20261028141705_curriculum_conflict_response.sql', import.meta.url), 'utf8');
const migration = await readFile(new URL('../supabase/migrations/20261028140510_launch_data_safety.sql', import.meta.url), 'utf8');

for (const mode of ['fresh installation','upgrade from baseline']) test(`${mode} protects learner data and direct database boundaries`, async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on all functions in schema auth to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  `);
  if(mode==='fresh installation') {
    // Test the installer as-is: no upgrade is allowed to mask a missing fix.
    await db.exec(schema);
  } else {
    await db.exec(schema.split('-- LAUNCH DATA SAFETY')[0]);
    await db.exec(migration);
    await db.exec(migration); // Existing-database safety migration is idempotent.
    await db.exec(conflictMigration);
    await db.exec(await readFile(new URL('../supabase/migrations/20261029121526_document_catalog.sql',import.meta.url),'utf8'));
  }
  const [admin, learner, other, moderator, outsider, platform] = Array.from({length:6}, (_, i) => `00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
  for (const id of [admin,learner,other,moderator,outsider,platform]) await db.query('insert into auth.users values ($1)',[id]);
  await db.query('insert into public.platform_admins values ($1)', [platform]);
  const path = (await db.query("insert into learning_paths(title,created_by) values ('Path A',$1) returning id",[admin])).rows[0].id;
  const pathB = (await db.query("insert into learning_paths(title,created_by) values ('Path B',$1) returning id",[other])).rows[0].id;
  for (const [id,role] of [[learner,'learner'],[other,'learner'],[moderator,'moderator']]) await db.query("insert into path_memberships(user_id,path_id,role,status) values ($1,$2,$3,'approved')",[id,path,role]);
  const initial = [{title:'Foundations',goal:'Learn',days:[{dayLabel:'Day 1',title:'Start',hours:'1',items:[{title:'Read',url:'https://example.com/read',tag:'hands'},{title:'Practice',url:'https://example.com/practice',tag:'exam'}]}]}];
  async function as(role, id, callback) {
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claim.role',$2,false)",[id,role]);
    try { return await callback(); } finally { await db.exec('reset role'); }
  }
  const save = (phases,revision,confirmed=false,actor=admin,target=path) => as('service_role',actor,async () =>
    (await db.query('select save_learning_plan($1,$2,$3,$4,$5) as plan',[target,actor,JSON.stringify(phases),revision,confirmed])).rows[0].plan);
  let plan = await save(initial,null);
  const lesson = plan.phases[0].days[0].items[0].id;
  await db.query('insert into progress(user_id,path_id,item_key) values ($1,$2,$3)',[learner,path,lesson]);
  await db.query("insert into notes(user_id,path_id,item_key,note_text) values ($1,$2,$3,'Private thought')",[learner,path,lesson]);
  const snapshot = () => db.query('select (select count(*)::int from progress) as progress, (select count(*)::int from notes) as notes');

  await t.test('editing and reordering preserve IDs, progress and notes', async () => {
    const phases=structuredClone(plan.phases);
    phases[0].title='Updated'; phases[0].days[0].items.reverse();
    const saved=await save(phases,plan.revision);
    assert.equal(saved.phases[0].id,plan.phases[0].id);
    assert.equal(saved.phases[0].days[0].items[1].id,lesson);
    assert.deepEqual((await snapshot()).rows[0],{progress:1,notes:1});
    plan=saved;
  });
  await t.test('stale edits, invalid late fields, and cross-path IDs roll back', async () => {
    await assert.rejects(save(plan.phases,plan.revision-1), error=>error.code==='PT409'&&/curriculum changed/.test(error.message));
    const invalid=structuredClone(plan.phases); invalid[0].title='Should roll back'; invalid[0].days[0].items.at(-1).url='javascript:alert(1)';
    await assert.rejects(save(invalid,plan.revision), /HTTP/);
    await assert.rejects(save(plan.phases,0,false,other,pathB), /Invalid or duplicate phase/);
    const current=(await db.query('select read_learning_plan($1) as plan',[path])).rows[0].plan;
    assert.deepEqual(current,plan);
    assert.deepEqual((await snapshot()).rows[0],{progress:1,notes:1});
  });
  await t.test('removals require confirmation and only delete removed learner activity', async () => {
    const removed=plan.phases[0].days[0].items.find(i=>i.id!==lesson).id;
    await db.query('insert into progress(user_id,path_id,item_key) values ($1,$2,$3)',[learner,path,removed]);
    await db.query("insert into notes(user_id,path_id,item_key,note_text) values ($1,$2,$3,'Removed lesson note')",[learner,path,removed]);
    const phases=structuredClone(plan.phases); phases[0].days[0].items=phases[0].days[0].items.filter(i=>i.id===lesson);
    await assert.rejects(save(phases,plan.revision), /Confirm curriculum removals/);
    assert.deepEqual((await snapshot()).rows[0],{progress:2,notes:2});
    plan=await save(phases,plan.revision,true);
    assert.deepEqual((await snapshot()).rows[0],{progress:1,notes:1});
  });
  await t.test('direct clients cannot bypass quota, publication, membership roles or plan safety', async () => {
    await as('authenticated',moderator,async () => {
      await assert.rejects(db.query("update path_memberships set role='admin' where user_id=$1",[moderator]), /permission denied/);
      await assert.rejects(db.query("insert into path_memberships(user_id,path_id,role,status) values ($1,$2,'admin','pending')",[moderator,pathB]), /permission denied/);
    });
    await as('authenticated',admin,async () => {
      await assert.rejects(db.query("insert into learning_paths(title,created_by,wall_status) values ('Bypass',$1,'approved')",[admin]), /permission denied/);
      await assert.rejects(db.query("update learning_paths set wall_status='approved' where id=$1",[path]), /permission denied/);
      await assert.rejects(db.query('delete from phases where path_id=$1',[path]), /permission denied/);
      await assert.rejects(db.query('select save_learning_plan($1,$2,$3,0,false)',[path,admin,JSON.stringify(initial)]), /permission denied/);
      await db.query('select create_learning_path_with_entitlement($1,null,null,$2)', ['Second',admin]);
      await db.query('select create_learning_path_with_entitlement($1,null,null,$2)', ['Third',admin]);
      await assert.rejects(db.query('select create_learning_path_with_entitlement($1,null,null,$2)', ['Fourth',admin]), /quota exceeded/);
    });
    await as('anon','',async () => {
      await assert.rejects(db.query('select create_learning_path_with_entitlement($1,null,null,$2)', ['Anonymous',admin]), /permission denied/);
    });
  });
  await t.test('notes are visible only to their owner, including against path and platform admins', async () => {
    for (const id of [admin,other,moderator,outsider,platform]) {
      const rows=await as('authenticated',id,async () => (await db.query('select * from notes')).rows);
      assert.equal(rows.length,0);
    }
    const rows=await as('authenticated',learner,async () => (await db.query('select note_text from notes')).rows);
    assert.equal(rows[0].note_text,'Private thought');
  });
  await t.test('learners and unrelated path admins cannot invoke privileged saves through the service wrapper', async () => {
    for (const actor of [learner,other,moderator,outsider]) await assert.rejects(save(plan.phases,plan.revision,false,actor), /Admin access required/);
  });
});
