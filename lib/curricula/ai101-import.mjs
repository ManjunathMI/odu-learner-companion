import {courseOverviewMarkdown,moduleContentMarkdown} from './content.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const literal=value=>`'${String(value).replaceAll("'","''")}'`;
export function ai101Plan(course){
 return course.modules.map(module=>({id:module.phaseId,title:module.title,goal:module.objective,days:[{id:module.dayId,dayLabel:`Day ${module.number}`,title:module.title,hours:(module.minutes/60).toFixed(2),contentMarkdown:moduleContentMarkdown(module),items:[{id:module.itemId,title:`Complete Day ${module.number}: ${module.title}`,url:module.resources.find(resource=>resource.kind==='Read'&&!resource.optional)?.url??course.references.find(resource=>resource.title.includes('AI Fluency')).url,tag:'hands'}]}]}));
}
export function ai101ImportSql(course,ownerId,{publish=false,production=false,ownerEmail}={}){
 if(!uuid.test(ownerId))throw new Error('Provide the UUID of an existing development Auth user as --owner-id.');
 if(production && (typeof ownerEmail!=='string'||!/^\S+@\S+\.\S+$/.test(ownerEmail)))throw new Error('Production import requires --owner-email to verify the Auth owner.');
 const setting=production?'odu.allow_production_seed':'odu.allow_development_seed';
 const confirmation=production?'ai101-production-approved':'ai101-local-only';
 const plan=ai101Plan(course);
 const sourceIds=[course.id,...course.modules.flatMap(module=>[module.phaseId,module.dayId,module.itemId])];
 if(sourceIds.some(id=>!uuid.test(id))||new Set(sourceIds).size!==22||course.modules.length!==7)throw new Error('AI 101 requires seven uniquely identified modules.');
 const tags=`array[${course.tags.map(literal).join(',')}]::text[]`;
 return `-- AI 101 ${production?'explicitly approved production':'development-only'} import. Generated from curricula/ai-101-beginners/course.json.
-- Review before execution. ${production?'Verify the target project before running.':'Do not run on production.'} This file does not create Auth users.
-- In the same target DB session first run:
-- set ${setting} = '${confirmation}';
begin;
set local statement_timeout = '15s';
set local lock_timeout = '5s';
do $ai101_seed$
declare
 v_owner uuid := ${literal(ownerId)};
 v_path uuid := ${literal(course.id)};
 v_plan jsonb := ${literal(JSON.stringify(plan))}::jsonb;
 v_phase jsonb; v_day jsonb; v_item jsonb;
 v_creator uuid;
 v_revision integer;
 v_limit integer;
 v_current jsonb;
begin
 if current_setting('${setting}',true) is distinct from '${confirmation}' then
  raise exception '${production?'Production':'Development'} import requires explicit ${setting} confirmation';
 end if;
 ${production?`if not exists(select 1 from auth.users where id=v_owner and lower(email)=${literal(ownerEmail.toLowerCase())} and email_confirmed_at is not null) then raise exception 'Production owner UUID and verified email do not match'; end if;`:''}
 if not exists(select 1 from auth.users where id=v_owner) then raise exception 'Selected owner does not exist in Auth'; end if;
 ${publish?"if not exists(select 1 from public.platform_admins where user_id=v_owner) then raise exception 'Publishing requires a platform administrator'; end if;":'-- A private import does not grant platform publication approval.'}
 perform pg_advisory_xact_lock(hashtextextended('odu:curated:ai-101-beginners',0));
 -- Match the existing creator RPC's per-user lock and entitlement rule.
 perform pg_advisory_xact_lock(hashtextextended(v_owner::text,0));
 if not exists(select 1 from public.learning_paths where id=v_path) then
  insert into public.user_entitlements(user_id) values(v_owner) on conflict(user_id) do nothing;
  select max_created_paths into v_limit from public.user_entitlements where user_id=v_owner for update;
  if (select count(*) from public.learning_paths where created_by=v_owner)>=v_limit then
   raise exception 'creator quota exceeded' using errcode='check_violation';
  end if;
 end if;
 insert into public.learning_paths(id,title,description,tags,created_by,visibility,wall_status,overview_markdown)
 values(v_path,${literal(course.title)},${literal(course.description)},${tags},v_owner,${literal(publish?'public':'private')},${literal(publish?'approved':'pending_review')},${literal(courseOverviewMarkdown(course))}) on conflict(id) do nothing;
 select created_by,plan_revision into v_creator,v_revision from public.learning_paths where id=v_path for update;
 if v_creator is distinct from v_owner then raise exception 'AI 101 identifier belongs to another creator; import refused'; end if;
 -- Register deterministic IDs once. The existing atomic curriculum RPC validates and updates content.
 for v_phase in select value from jsonb_array_elements(v_plan) loop
  insert into public.phases(id,path_id,title,goal,sort_order) values((v_phase->>'id')::uuid,v_path,v_phase->>'title',v_phase->>'goal',0) on conflict(id) do nothing;
  if not exists(select 1 from public.phases where id=(v_phase->>'id')::uuid and path_id=v_path) then raise exception 'Phase identifier collision'; end if;
  for v_day in select value from jsonb_array_elements(v_phase->'days') loop
   insert into public.days(id,phase_id,day_label,title,hours,sort_order) values((v_day->>'id')::uuid,(v_phase->>'id')::uuid,v_day->>'dayLabel',v_day->>'title',v_day->>'hours',0) on conflict(id) do nothing;
   if not exists(select 1 from public.days where id=(v_day->>'id')::uuid and phase_id=(v_phase->>'id')::uuid) then raise exception 'Day identifier collision'; end if;
   for v_item in select value from jsonb_array_elements(v_day->'items') loop
    insert into public.lesson_items(id,day_id,title,url,tag,sort_order) values((v_item->>'id')::uuid,(v_day->>'id')::uuid,v_item->>'title',v_item->>'url',v_item->>'tag',0) on conflict(id) do nothing;
    if not exists(select 1 from public.lesson_items where id=(v_item->>'id')::uuid and day_id=(v_day->>'id')::uuid) then raise exception 'Lesson identifier collision'; end if;
   end loop;
  end loop;
 end loop;
 v_current := public.read_learning_plan(v_path);
 if v_revision=0 or v_current->'phases' is distinct from v_plan then
  perform public.save_learning_plan(v_path,v_owner,v_plan,v_revision,false);
 end if;
 -- No memberships, progress, notes or other paths are updated by a repeat import.
 update public.learning_paths set title=${literal(course.title)},description=${literal(course.description)},tags=${tags},overview_markdown=${literal(courseOverviewMarkdown(course))},updated_at=now()
 where id=v_path and (title,description,tags,overview_markdown) is distinct from (${literal(course.title)},${literal(course.description)},${tags},${literal(courseOverviewMarkdown(course))});
 ${publish?"update public.learning_paths set visibility='public',wall_status='approved',updated_at=now() where id=v_path and (visibility<>'public' or wall_status<>'approved');":'-- Existing publication settings are preserved unless --publish was explicitly supplied.'}
end;
$ai101_seed$;
commit;
`;
}

// Combine the reviewed additive migration and import in ONE transaction for SQL Editor.
// The guard runs before DDL; any identity/quota/import failure rolls back all changes.
export function ai101ProductionSql(course,ownerId,ownerEmail,migrationSql){
 const seed=ai101ImportSql(course,ownerId,{publish:true,production:true,ownerEmail});
 const guard=`do $production_guard$
 begin
  if not exists(select 1 from auth.users u join public.platform_admins a on a.user_id=u.id
    where u.id=${literal(ownerId)}::uuid and lower(u.email)=${literal(ownerEmail.toLowerCase())} and u.email_confirmed_at is not null) then
   raise exception 'Production owner UUID, verified email and platform administrator role must match';
  end if;
 end;
 $production_guard$;`;
 const body=seed.slice(seed.indexOf('do $ai101_seed$'),seed.lastIndexOf('commit;'));
 const migration=migrationSql.replace("set lock_timeout = '5s';",'').replace('reset lock_timeout;','');
 return `-- AI 101: production installation, explicitly authorized by the owner.
-- Run the WHOLE file once in the SQL Editor of the intended Supabase project.
-- Includes the additive material migration and the public AI 101 course import.
-- No Auth users, existing memberships, progress or notes are changed.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local odu.allow_production_seed = 'ai101-production-approved';
${guard}
${migration}
${body}
-- Verification runs before commit. Seven phases/days/items with lesson text are required.
do $verify_ai101$
begin
 if (select count(*) from public.phases where path_id=${literal(course.id)}::uuid)<>7
 or (select count(*) from public.days d join public.phases p on p.id=d.phase_id where p.path_id=${literal(course.id)}::uuid and length(d.content_markdown)>0)<>7
 or (select count(*) from public.lesson_items i join public.days d on d.id=i.day_id join public.phases p on p.id=d.phase_id where p.path_id=${literal(course.id)}::uuid)<>7 then
  raise exception 'AI 101 verification failed; installation rolled back';
 end if;
end;
$verify_ai101$;
commit;
select id,title,visibility,wall_status,plan_revision from public.learning_paths where id=${literal(course.id)}::uuid;
`;
}
