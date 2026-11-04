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

// Runtime Markdown/revision regression: independent of retired course generators.
{
const owner='00000000-0000-4000-8000-000000000001',learner='00000000-0000-4000-8000-000000000002';
const schema=(await readFile(new URL('../docs/DB-schema.sql',import.meta.url),'utf8')).replace('create extension if not exists "uuid-ossp";',()=> 'create function uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;');
async function setup(){
 const db=new PGlite();
 await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$; alter default privileges in schema public grant all on tables to service_role;");
 await db.exec(schema);await db.query('insert into auth.users values($1),($2)',[owner,learner]);
 return db;
}


test('optional SQL course seeds require an installation owner and preserve courses and learner activity',async()=>{
 const db=await setup();
 try{
  await db.exec('alter table auth.users add column email text; alter table auth.users add column email_confirmed_at timestamptz;');
  await db.query("update auth.users set email='installation@example.com',email_confirmed_at=now() where id=$1",[owner]);
  for(const [file,id,phaseCount,dayCount,confirmation] of [
   ['ai101','ab832bcc-b30c-59cf-a3c2-fecf069bd475',7,7,'ai101-production-approved'],
   ['python-foundations','5f2daeac-e73f-5d25-adb5-e0f16ca78335',8,40,'python-foundations-production-approved'],
  ]){
   const sql=await readFile(new URL(`../supabase/seeds/${file}.sql`,import.meta.url),'utf8');
   await db.exec("reset odu.allow_production_seed");
   await assert.rejects(db.exec(sql),/explicit.*confirmation/);await db.exec('rollback');
   await db.query("select set_config('odu.allow_production_seed',$1,false)",[confirmation]);
   await db.query("select set_config('odu.course_owner_id',$1,false),set_config('odu.course_owner_email','wrong@example.com',false)",[owner]);
   await assert.rejects(db.exec(sql),/verified email/);await db.exec('rollback');
   await db.exec("set odu.course_owner_email='installation@example.com'");
   await db.exec(sql);
   const first=(await db.query('select read_learning_plan($1) plan',[id])).rows[0].plan;
   assert.equal(first.phases.length,phaseCount);
   const days=first.phases.flatMap(p=>p.days);assert.equal(days.length,dayCount);
   assert.ok(days.every(d=>d.items.length===1&&d.contentMarkdown.includes('## Understand')&&d.contentMarkdown.includes('## Practice activity')));
   assert.deepEqual((await db.query('select visibility,wall_status from learning_paths where id=$1',[id])).rows[0],{visibility:'private',wall_status:'pending_review'});
   await db.query("insert into path_memberships(user_id,path_id,role,status) values($1,$2,'learner','approved')",[learner,id]);
   await db.query('insert into progress(user_id,path_id,item_key,done) values($1,$2,$3,true)',[learner,id,days[0].items[0].id]);
   await db.query("insert into notes(user_id,path_id,item_key,note_text) values($1,$2,$3,'Seed retention')",[learner,id,days[0].items[0].id]);
   await db.exec(sql);
   assert.deepEqual((await db.query('select read_learning_plan($1) plan',[id])).rows[0].plan,first);
   assert.equal((await db.query('select done from progress where path_id=$1',[id])).rows[0].done,true);
   assert.equal((await db.query('select note_text from notes where path_id=$1',[id])).rows[0].note_text,'Seed retention');
  }
  assert.equal((await db.query('select count(*)::int n from learning_paths')).rows[0].n,2);
 }finally{await db.close();}
});

test('leaderboard counts stay path-scoped and retain activity across curriculum saves',async()=>{
 const db=await setup();
 try{
  const paths=[];
  for(const title of ['First path','Second path']){
   const path=(await db.query('insert into learning_paths(title,created_by) values($1,$2) returning id',[title,owner])).rows[0].id;
   const plan=(await db.query('select save_learning_plan($1,$2,$3,null,false) plan',[path,owner,JSON.stringify([{title:'Phase',days:[{dayLabel:'Lesson 1',title:'Study',items:[{title:'Complete activity',url:'https://example.com/read',tag:'hands'}]}]}])])).rows[0].plan;
   await db.query("insert into path_memberships(user_id,path_id,role,status) values($1,$2,'learner','pending')",[learner,path]);
   paths.push({path,plan,item:plan.phases[0].days[0].items[0].id});
  }
  const counts=async(path)=>(await db.query(`select pm.user_id,count(distinct pr.item_key)::int done_count from path_memberships pm left join progress pr on pr.user_id=pm.user_id and pr.path_id=pm.path_id and pr.done=true and exists(select 1 from lesson_items i join days d on d.id=i.day_id join phases p on p.id=d.phase_id where i.id=pr.item_key and p.path_id=$1) where pm.path_id=$1 and pm.status='approved' group by pm.user_id order by done_count desc`,[path])).rows;
  assert.equal((await counts(paths[0].path)).some(r=>r.user_id===learner),false);
  await db.query("update path_memberships set status='approved' where user_id=$1",[learner]);
  const {path,plan,item}=paths[0];
  for(let i=0;i<2;i++)await db.query('insert into progress(user_id,path_id,item_key,done) values($1,$2,$3,true) on conflict(user_id,item_key) do update set done=excluded.done',[learner,path,item]);
  await db.query("insert into notes(user_id,path_id,item_key,note_text) values($1,$2,$3,'Private reflection')",[learner,path,item]);
  await db.query('select save_learning_plan($1,$2,$3,$4,false)',[path,owner,JSON.stringify(plan.phases),plan.revision]);
  assert.equal((await counts(path)).find(r=>r.user_id===learner).done_count,1);
  assert.equal((await counts(paths[1].path)).find(r=>r.user_id===learner).done_count,0);
  assert.equal((await db.query('select note_text from notes where user_id=$1 and path_id=$2',[learner,path])).rows[0].note_text,'Private reflection');
 }finally{await db.close();}
});

test('day Markdown survives older clients, supports explicit clearing and validates atomically',async()=>{
 const db=await setup();
 try{
  const path=(await db.query("insert into learning_paths(title,created_by,overview_markdown) values('Markdown regression',$1,'Overview material') returning id",[owner])).rows[0].id;
  const fixture=[{title:'Phase one',days:[{dayLabel:'Day 1',title:'Lesson',contentMarkdown:'## Understand\nOriginal teaching\n\n## Practice activity\nTry it',items:[{title:'Complete lesson',url:'https://example.com/read',tag:'hands'}]}]},{title:'Phase two',days:[{dayLabel:'Day 2',title:'Next lesson',contentMarkdown:'Next teaching',items:[{title:'Complete next lesson',url:'https://example.com/next',tag:'hands'}]}]}];
  await db.query('select save_learning_plan($1,$2,$3,null,false)',[path,owner,JSON.stringify(fixture)]);
  const read=async()=>(await db.query('select read_learning_plan($1) as plan',[path])).rows[0].plan;
  let plan=await read();
  const content=plan.phases[0].days[0].contentMarkdown;
  assert.ok(content.includes('Original teaching'));
  const firstPhaseId=plan.phases[0].id;
  assert.equal((await db.query('select overview_markdown from learning_paths where id=$1',[path])).rows[0].overview_markdown,'Overview material');
  const oldClient=structuredClone(plan.phases);
  for(const phase of oldClient)for(const day of phase.days)delete day.contentMarkdown;
  oldClient.reverse();
  await db.query('select save_learning_plan($1,$2,$3,$4,false)',[path,owner,JSON.stringify(oldClient),plan.revision]);
  plan=await read();
  assert.equal(plan.phases.find(p=>p.id===firstPhaseId).days[0].contentMarkdown,content);
  for(const invalid of [123,{},'x'.repeat(100001)]){
   const bad=structuredClone(plan.phases);bad[0].days[0].contentMarkdown=invalid;
   await assert.rejects(db.query('select save_learning_plan($1,$2,$3,$4,false)',[path,owner,JSON.stringify(bad),plan.revision]),/Day content must/);
   assert.deepEqual(await read(),plan);
  }
  plan.phases[0].days[0].contentMarkdown=null;
  await db.query('select save_learning_plan($1,$2,$3,$4,false)',[path,owner,JSON.stringify(plan.phases),plan.revision]);
  assert.equal((await read()).phases[0].days[0].contentMarkdown,null);
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
