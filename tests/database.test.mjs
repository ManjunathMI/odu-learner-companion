import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const schema = (await readFile(new URL('../docs/DB-schema.sql', import.meta.url), 'utf8'))
  .replace('create extension if not exists "uuid-ossp";', () => 'create function uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;');
const conflictMigration = await readFile(new URL('../supabase/migrations/20261028141705_curriculum_conflict_response.sql', import.meta.url), 'utf8');
const migration = await readFile(new URL('../supabase/migrations/20261028140510_launch_data_safety.sql', import.meta.url), 'utf8');
const feedbackMigration = await readFile(new URL('../supabase/migrations/20261031123616_feedback_requests.sql', import.meta.url), 'utf8');

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
    const material = await readFile(new URL('../supabase/migrations/20261029182558_learning_material.sql',import.meta.url),'utf8');
    await db.exec(material);
    await db.exec(material);
    await db.exec(feedbackMigration);
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
  await t.test('feedback requests are service-only and cap open requests per normalized email', async () => {
    assert.equal((await db.query("select has_table_privilege('anon','public.feedback_requests','select,insert,update') as allowed")).rows[0].allowed,false);
    assert.equal((await db.query("select has_table_privilege('authenticated','public.feedback_requests','select,insert,update') as allowed")).rows[0].allowed,false);
    assert.equal((await db.query("select has_function_privilege('anon','public.submit_feedback_request(text,text,text,text,text,uuid)','execute') as allowed")).rows[0].allowed,false);
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.feedback_requests'::regclass")).rows[0].relrowsecurity,true);

    const submit = (email,message='Please help me with this request.') => as('service_role',platform,async()=>
      (await db.query('select public.submit_feedback_request($1,$2,$3,$4,$5,$6) as id',['Learner',email,null,'query',message,platform])).rows[0].id);
    const first=await submit('Learner@Example.com');
    await submit('learner@example.com','I have another question for the team.');
    await assert.rejects(submit('LEARNER@example.com'),error=>error.code==='P0001'&&/feedback_open_request_limit/.test(error.message));
    await as('service_role',platform,()=>db.query("update feedback_requests set status='answered',response_text='I sent a reply.',responded_by=$1,responded_at=now() where id=$2",[platform,first]));
    await submit('learner@example.com','A follow-up after the first reply.');
    await assert.rejects(submit('another@example.com','<script>alert(1)</script>'),error=>error.code==='22023');
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
  await t.test('new paths save overview, references, tags and day material through existing fields', async () => {
    const {pathMetadataFields}=await import('../lib/path-editor.ts');
    const fields=pathMetadataFields({title:' New path ',description:' First course ',overviewMarkdown:'## What you will learn\nBasics\n\n## Optional reference library\n[Guide](https://example.com/guide)',tagsInput:'AI, beginner, ai, ,'});
    assert.deepEqual(fields.tags,['AI','beginner']);
    const created=await as('authenticated',outsider,async()=>
      (await db.query('select * from create_learning_path_with_entitlement($1,$2,$3,$4)',[fields.title,fields.description,fields.tags,outsider])).rows[0]);
    await as('service_role',outsider,()=>db.query('update learning_paths set overview_markdown=$1 where id=$2',[fields.overviewMarkdown,created.id]));
    const material='## Understand\nLearn safely\n\n## Read\n[Read](https://example.com/read)\n\n## Practice activity\nTry one example';
    const saved=await save([{title:'Start',days:[{dayLabel:'Day 1',title:'Basics',contentMarkdown:material,items:[{title:'First activity',url:'https://example.com/read'}]}]}],null,false,outsider,created.id);
    assert.equal(saved.phases[0].days[0].contentMarkdown,material);
    const stored=(await db.query('select title,tags,overview_markdown from learning_paths where id=$1',[created.id])).rows[0];
    assert.equal(stored.title,'New path');assert.deepEqual(stored.tags,['AI','beginner']);assert.equal(stored.overview_markdown,fields.overviewMarkdown);
    assert.deepEqual(pathMetadataFields({title:'Unchanged',description:' ',overviewMarkdown:' ',tagsInput:''}),{title:'Unchanged',description:null,overviewMarkdown:null,tags:[]});
  });

  await t.test('direct clients cannot delete paths; service deletion cascades only the selected path data', async () => {
    const target=(await db.query("insert into learning_paths(title,created_by) values('Disposable deletion fixture',$1) returning id",[admin])).rows[0].id;
    const targetPlan=await save(initial,null,false,admin,target);
    const targetDay=targetPlan.phases[0].days[0].id,targetItem=targetPlan.phases[0].days[0].items[0].id;
    for(const [userId,role] of [[learner,'learner'],[moderator,'moderator']])await db.query("insert into path_memberships(user_id,path_id,role,status) values($1,$2,$3,'approved')",[userId,target,role]);
    await db.query('insert into progress(user_id,path_id,item_key,done) values($1,$2,$3,true)',[learner,target,targetItem]);
    await db.query("insert into notes(user_id,path_id,item_key,note_text) values($1,$2,$3,'Fixture note')",[learner,target,targetItem]);
    const untouched=await snapshot();
    for(const actor of [learner,moderator,other,outsider,admin,platform]){
      await assert.rejects(as('authenticated',actor,()=>db.query('delete from learning_paths where id=$1 returning id',[target])),error=>error.code==='42501');
    }
    // The existing HTTP DELETE handler checks requirePathAdmin before its service client delete.
    const deleted=await as('service_role',admin,()=>db.query('delete from learning_paths where id=$1 returning id',[target]));
    assert.equal(deleted.rows[0].id,target);
    for(const table of ['phases','path_memberships','progress','notes'])assert.equal((await db.query(`select count(*)::int n from ${table} where path_id=$1`,[target])).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from days where id=$1',[targetDay])).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from lesson_items where id=$1',[targetItem])).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from learning_paths where id=$1',[pathB])).rows[0].n,1);
    assert.equal((await db.query('select count(*)::int n from auth.users where id=$1',[learner])).rows[0].n,1);
    const after=await snapshot();assert.equal(after.rows[0].progress,untouched.rows[0].progress-1);assert.equal(after.rows[0].notes,untouched.rows[0].notes-1);
  });

});

test('feedback form validation normalizes contact data and rejects markup and malformed input',async()=>{
 const {validateFeedbackSubmission,validateFeedbackResponse}=await import('../lib/feedback-validation.ts');
 const valid=validateFeedbackSubmission({name:' Learner ',email:' Learner@Example.com ',phone:' +1 (555) 010-2020 ',requestType:'bug',message:' The save button does not respond. '});
 assert.deepEqual(valid,{value:{name:'Learner',email:'learner@example.com',phone:'+1 (555) 010-2020',requestType:'bug',message:'The save button does not respond.'}});
 for(const input of [null,{}, {name:'<b>Bad</b>',email:'a@example.com',requestType:'query',message:'Need help with this.'},{name:'A',email:'not-an-email',requestType:'query',message:'Need help with this.'},{name:'A',email:'a@example.com',requestType:'query',message:'<script>alert(1)</script>'},{name:'A',email:'a@example.com',phone:'letters',requestType:'query',message:'Need help with this.'},{name:'A',email:'a@example.com',requestType:'invalid',message:'Need help with this.'}]) assert.ok(validateFeedbackSubmission(input).error);
 assert.equal(validateFeedbackResponse('  I sent a plain text reply.  '),'I sent a plain text reply.');
 assert.equal(validateFeedbackResponse('<script>bad</script>'),null);
 assert.equal(validateFeedbackResponse(''),null);
});

// Curated-course regression coverage is retained in the existing suite.
{
const {ai101Plan,ai101ImportSql}=await import('../lib/curricula/ai101-import.mjs');
const course=JSON.parse(await readFile(new URL('../curricula/ai-101-beginners/course.json',import.meta.url),'utf8'));
const owner='00000000-0000-4000-8000-000000000001',learner='00000000-0000-4000-8000-000000000002';
const schema=(await readFile(new URL('../docs/DB-schema.sql',import.meta.url),'utf8')).replace('create extension if not exists "uuid-ossp";',()=> 'create function uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;');
async function setup(){
 const db=new PGlite();
 await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$; alter default privileges in schema public grant all on tables to service_role;");
 await db.exec(schema);await db.query('insert into auth.users values($1),($2)',[owner,learner]);
 return db;
}

test('AI 101 includes seven complete, ordered modules and optional non-scoring references',()=>{
 assert.equal(course.modules.length,7);assert.deepEqual(course.modules.map(module=>module.number),[1,2,3,4,5,6,7]);
 assert.equal(course.totalMinutes,470);assert.equal(course.modules.reduce((sum,module)=>sum+module.minutes,0),470);
 for(const lesson of course.modules){for(const field of ['objective','teaching','practice','outcome'])assert.ok(lesson[field].length>40,`${lesson.key} ${field}`);}
 assert.match(course.modules[1].practice,/Written alternative/);
 assert.match(course.modules[6].teaching,/Ask the learner to answer before revealing/);
 assert.match(course.modules[6].teaching,/external AI assistant/);
 assert.equal(ai101Plan(course).flatMap(phase=>phase.days.flatMap(day=>day.items)).length,7);
 assert.equal(course.references.length,6);assert.ok(course.references.every(resource=>resource.optional));
 const resources=[...course.modules.flatMap(module=>module.resources),...course.references];
 assert.equal(new Set(resources.map(resource=>resource.url)).size,20);
 assert.throws(()=>ai101ImportSql(course,"not-a-uuid'; drop table progress;"),/UUID/);
});

test('development seed is transactional, repeatable and preserves enrollment, activity and other paths',async()=>{
 const db=await setup();
 try{
  const existing=(await db.query("insert into learning_paths(title,created_by) values('Existing path',$1) returning id",[owner])).rows[0].id;
  const oldPlan=(await db.query('select save_learning_plan($1,$2,$3,null,false) as plan',[existing,owner,JSON.stringify([{title:'Existing phase',days:[{dayLabel:'Day 1',title:'Existing lesson',items:[{title:'Existing resource',url:'https://example.com/original',tag:'hands'}]}]}])])).rows[0].plan;
  const oldItem=oldPlan.phases[0].days[0].items[0].id;
  await db.query('insert into progress(user_id,path_id,item_key,done) values($1,$2,$3,true)',[owner,existing,oldItem]);
  await db.query("insert into notes(user_id,path_id,item_key,note_text) values($1,$2,$3,'Original private note')",[owner,existing,oldItem]);
  const sql=ai101ImportSql(course,owner,{publish:true});
  await assert.rejects(db.exec(sql),/explicit.*confirmation/);await db.exec('rollback');
  assert.equal((await db.query('select count(*)::int as n from learning_paths')).rows[0].n,1);
  await db.exec("set odu.allow_development_seed='ai101-local-only'");
  await assert.rejects(db.exec(sql),/platform administrator/);await db.exec('rollback');
  await db.query('insert into platform_admins(user_id) values($1)',[owner]);
  await db.query('insert into user_entitlements(user_id,max_created_paths) values($1,1)',[owner]);
  await assert.rejects(db.exec(sql),/creator quota exceeded/);await db.exec('rollback');
  assert.equal((await db.query('select count(*)::int as n from learning_paths')).rows[0].n,1);
  await db.query('update user_entitlements set max_created_paths=3 where user_id=$1',[owner]);
  await db.exec(sql);
  const snapshot=async()=>(await db.query('select read_learning_plan($1) as plan',[course.id])).rows[0].plan;
  const initial=await snapshot();assert.deepEqual(initial.phases,ai101Plan(course));
  assert.equal((await db.query('select visibility,wall_status from learning_paths where id=$1',[course.id])).rows[0].wall_status,'approved');
  assert.equal((await db.query('select count(*)::int as n from learning_paths')).rows[0].n,2);
  await db.query("insert into path_memberships(user_id,path_id,role,status) values($1,$2,'learner','pending')",[learner,course.id]);
  await assert.rejects(db.query("insert into path_memberships(user_id,path_id) values($1,$2)",[learner,course.id]),error=>error.code==='23505');
  assert.equal((await db.query('select count(*)::int as n from progress where user_id=$1 and path_id=$2',[learner,course.id])).rows[0].n,0);
  await db.query("update path_memberships set status='approved' where user_id=$1 and path_id=$2",[learner,course.id]);
  const item=course.modules[0].itemId;
  // Same unique-key semantics used by POST /progress.
  for(let i=0;i<2;i++)await db.query('insert into progress(user_id,path_id,item_key,done) values($1,$2,$3,true) on conflict(user_id,item_key) do update set done=excluded.done',[learner,course.id,item]);
  await db.query("insert into notes(user_id,path_id,item_key,note_text) values($1,$2,$3,'My AI 101 reflection')",[learner,course.id,item]);
  await db.exec(sql);assert.deepEqual(await snapshot(),initial);
  assert.equal((await db.query('select count(*)::int as n from progress where path_id=$1',[course.id])).rows[0].n,1);
  assert.equal((await db.query('select note_text from notes where path_id=$1',[course.id])).rows[0].note_text,'My AI 101 reflection');
  assert.equal((await db.query("select status from path_memberships where user_id=$1 and path_id=$2",[learner,course.id])).rows[0].status,'approved');
  const leaders=await db.query(`select pm.user_id,count(distinct p.item_key)::int as done_count,(select count(*)::int from lesson_items i join days d on d.id=i.day_id join phases ph on ph.id=d.phase_id where ph.path_id=$1) as total from path_memberships pm left join progress p on p.user_id=pm.user_id and p.path_id=pm.path_id and p.done=true and exists(select 1 from lesson_items i join days d on d.id=i.day_id join phases ph on ph.id=d.phase_id where i.id=p.item_key and ph.path_id=$1) where pm.path_id=$1 and pm.status='approved' group by pm.user_id order by done_count desc`,[course.id]);
  assert.equal(leaders.rows[0].user_id,learner);assert.equal(leaders.rows[0].done_count,1);assert.equal(leaders.rows[0].total,7);assert.equal(leaders.rows.find(row=>row.user_id===owner).done_count,0);assert.equal(Math.round(100*leaders.rows[0].done_count/leaders.rows[0].total),14);
  const edited=structuredClone(course);edited.modules[0].objective+=' Review one everyday example.';
  await db.exec(ai101ImportSql(edited,owner));assert.equal((await snapshot()).revision,initial.revision+1);
  assert.equal((await db.query('select count(*)::int as n from progress where path_id=$1',[course.id])).rows[0].n,1);
  assert.equal((await db.query('select title from learning_paths where id=$1',[existing])).rows[0].title,'Existing path');
  assert.deepEqual((await db.query('select read_learning_plan($1) as plan',[existing])).rows[0].plan,oldPlan);
  assert.equal((await db.query('select done from progress where path_id=$1',[existing])).rows[0].done,true);
  assert.equal((await db.query('select note_text from notes where path_id=$1',[existing])).rows[0].note_text,'Original private note');
  // A manual extra lesson requires a deliberate removal decision; imports never delete it.
  await db.query("insert into lesson_items(day_id,title,url,sort_order) values($1,'Manual addition','https://example.com/manual',2)",[course.modules[0].dayId]);
  await assert.rejects(db.exec(ai101ImportSql(edited,owner)),/Confirm curriculum removals/);await db.exec('rollback');
  assert.equal((await db.query("select count(*)::int as n from lesson_items where title='Manual addition'")).rows[0].n,1);
 }finally{await db.close();}
});

test('serialized database lesson material contains teaching, practice, outcomes and every resource',async()=>{
 const {courseOverviewMarkdown,moduleContentMarkdown}=await import('../lib/curricula/content.mjs');
 const overview=courseOverviewMarkdown(course);
 for(const reference of course.references)assert.ok(overview.includes(reference.url));
 for(const lesson of course.modules){
  const content=moduleContentMarkdown(lesson);
  assert.ok(content.includes(lesson.teaching));assert.ok(content.includes(lesson.practice));assert.ok(content.includes(lesson.outcome));
  for(const resource of lesson.resources)assert.ok(content.includes(resource.url));
 }
});

test('day Markdown survives older clients, supports explicit clearing and validates atomically',async()=>{
 const db=await setup();
 try{
  await db.exec("set odu.allow_development_seed='ai101-local-only'");
  await db.exec(ai101ImportSql(course,owner));
  const read=async()=>(await db.query('select read_learning_plan($1) as plan',[course.id])).rows[0].plan;
  let plan=await read();
  const content=plan.phases[0].days[0].contentMarkdown;
  assert.ok(content.includes(course.modules[0].teaching));
  const {courseOverviewMarkdown}=await import('../lib/curricula/content.mjs');
  assert.equal((await db.query('select overview_markdown from learning_paths where id=$1',[course.id])).rows[0].overview_markdown,courseOverviewMarkdown(course));
  const oldClient=structuredClone(plan.phases);
  for(const phase of oldClient)for(const day of phase.days)delete day.contentMarkdown;
  oldClient.reverse();
  await db.query('select save_learning_plan($1,$2,$3,$4,false)',[course.id,owner,JSON.stringify(oldClient),plan.revision]);
  plan=await read();
  assert.equal(plan.phases.find(p=>p.id===course.modules[0].phaseId).days[0].contentMarkdown,content);
  for(const invalid of [123,{},'x'.repeat(100001)]){
   const bad=structuredClone(plan.phases);bad[0].days[0].contentMarkdown=invalid;
   await assert.rejects(db.query('select save_learning_plan($1,$2,$3,$4,false)',[course.id,owner,JSON.stringify(bad),plan.revision]),/Day content must/);
   assert.deepEqual(await read(),plan);
  }
  plan.phases[0].days[0].contentMarkdown=null;
  await db.query('select save_learning_plan($1,$2,$3,$4,false)',[course.id,owner,JSON.stringify(plan.phases),plan.revision]);
  assert.equal((await read()).phases[0].days[0].contentMarkdown,null);
 }finally{await db.close();}
});

test('production SQL verifies owner identity, rolls back migration on quota failure and imports repeatably',async()=>{
 const {ai101ProductionSql}=await import('../lib/curricula/ai101-import.mjs');
 const migration=await readFile(new URL('../supabase/migrations/20261029182558_learning_material.sql',import.meta.url),'utf8');
 const db=await setup();
 try{
  await db.exec('alter table auth.users add column email text; alter table auth.users add column email_confirmed_at timestamptz;');
  await db.query("update auth.users set email='owner@example.com',email_confirmed_at=now() where id=$1",[owner]);
  const sql=ai101ProductionSql(course,owner,'owner@example.com',migration);
  await assert.rejects(db.exec(sql),/platform administrator role must match/);await db.exec('rollback');
  await db.query('insert into platform_admins values($1)',[owner]);
  await assert.rejects(db.exec(ai101ProductionSql(course,owner,'wrong@example.com',migration)),/verified email/);await db.exec('rollback');
  // Start from the pre-material schema to verify DDL rollback and the combined upgrade.
  await db.exec('alter table days drop column content_markdown; alter table learning_paths drop column overview_markdown;');
  await db.query('insert into user_entitlements(user_id,max_created_paths) values($1,0)',[owner]);
  await assert.rejects(db.exec(sql),/creator quota exceeded/);await db.exec('rollback');
  assert.equal((await db.query("select count(*)::int n from information_schema.columns where table_schema='public' and table_name='days' and column_name='content_markdown'")).rows[0].n,0);
  await db.query('update user_entitlements set max_created_paths=3 where user_id=$1',[owner]);
  await db.exec(sql);
  const first=(await db.query('select read_learning_plan($1) plan',[course.id])).rows[0].plan;
  assert.deepEqual(first.phases,ai101Plan(course));
  await db.exec(sql);
  assert.deepEqual((await db.query('select read_learning_plan($1) plan',[course.id])).rows[0].plan,first);
  assert.equal((await db.query('select count(*)::int n from learning_paths')).rows[0].n,1);
  assert.throws(()=>ai101ProductionSql(course,owner,undefined,migration),/owner-email/);
 }finally{await db.close();}
});

}

test('lesson views preserve Markdown and expose resource/reference sections without duplicating teaching',async()=>{
 const {unified}=await import('unified');
 const {default:remarkParse}=await import('remark-parse');
 const {selectMaterial,studyTime}=await import('../lib/learning-material.ts');
 const markdown='Intro\n\n## Understand\nTeaching\n\n```md\n## Read\nExample, not a resource section\n```\n\n## Watch\n[Video](https://example.com/video)\n\n## Read\n[Reading][book]\n\n## Practice activity\nTry this\n\n## Expected outcome\nReflect\n\n[book]: https://example.com/book';
 const tree=unified().use(remarkParse).parse(markdown);
 const lesson=selectMaterial(tree,'lesson'),resources=selectMaterial(tree,'resources'),practice=selectMaterial(tree,'practice');
 assert.ok(JSON.stringify(lesson).includes('Example, not a resource section'));
 assert.ok(JSON.stringify(practice).includes('Try this'));
 assert.ok(!JSON.stringify(lesson).includes('Try this'));
 assert.ok(!JSON.stringify(lesson).includes('https://example.com/video'));
 assert.ok(JSON.stringify(resources).includes('https://example.com/video'));
 assert.ok(!JSON.stringify(resources).includes('Teaching'));
 assert.ok(resources.children.some(node=>node.type==='definition'&&node.identifier==='book'));
 for(const node of tree.children)assert.ok(lesson.children.includes(node)||resources.children.includes(node)||practice.children.includes(node),'No source node is lost');
 const overview=unified().use(remarkParse).parse('About\n\n## What you will learn\nLearn\n\n## Optional reference library\n[Book](https://example.com)');
 assert.ok(!JSON.stringify(selectMaterial(overview,'overview')).includes('https://example.com'));
 assert.ok(JSON.stringify(selectMaterial(overview,'library')).includes('https://example.com'));
 assert.equal(studyTime('1.08'),'1 hr 5 min');assert.equal(studyTime('1.50'),'1 hr 30 min');
});


test('permanent path deletion requires confirmation, respects cancellation and propagates failures',async()=>{
 const {confirmPathDeletion}=await import('../lib/path-actions.ts');
 const calls=[];
 const remove=async id=>{calls.push(id);};
 assert.equal(await confirmPathDeletion('path-a','Example',message=>{assert.match(message,/cannot be undone/);assert.match(message,/personal notes for everyone/);return false;},remove),false);
 assert.deepEqual(calls,[]);
 assert.equal(await confirmPathDeletion('path-a','Example',async()=>false,remove),false);
 assert.deepEqual(calls,[]);
 assert.equal(await confirmPathDeletion('path-a','Example',async()=>true,remove),true);
 assert.deepEqual(calls,['path-a']);
 await assert.rejects(confirmPathDeletion('path-b','Example',()=>true,async()=>{throw new Error('Forbidden');}),/Forbidden/);
});


test('empty resource headings retain lesson URLs and real Markdown links are not duplicated',async()=>{
 const {unified}=await import('unified');
 const {default:remarkParse}=await import('remark-parse');
 const {selectMaterial,withLessonResources}=await import('../lib/learning-material.ts');
 const parse=markdown=>selectMaterial(unified().use(remarkParse).parse(markdown),'resources');
 const links=[{title:'Existing reading',url:'https://example.com/read'}];
 const empty=withLessonResources(parse('## Watch\n\n## Read'),links);
 assert.ok(JSON.stringify(empty).includes('Existing reading'));
 const reference=withLessonResources(parse('## Read\n[Reading][ref]\n\n[ref]: https://example.com/read'),links);
 assert.equal(reference.children.filter(node=>node.type==='list').length,0);
 const fenced=withLessonResources(parse('## Read\n```md\n[Example](https://example.com/read)\n```'),links);
 assert.equal(fenced.children.filter(node=>node.type==='list').length,1);
 const missing=withLessonResources(parse(''),[]);
 assert.ok(JSON.stringify(missing).includes('Resources have not been added yet.'));
});
