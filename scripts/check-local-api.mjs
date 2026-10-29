// Explicit opt-in: creates disposable users/path in the configured Supabase project.
// Never changes existing learner records. Credentials stay in this process.
import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

if (process.env.ODU_RUN_LIVE_API_TESTS !== '1') throw new Error('Set ODU_RUN_LIVE_API_TESTS=1 to create and clean up disposable Supabase fixtures.');
const base = 'http://localhost:3100';
loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false, autoRefreshToken:false } });
const userIds=[]; let pathId;
async function identity() {
  const email=`odu-release-${randomUUID()}@odu.local`;
  const {data,error}=await admin.auth.admin.createUser({email,email_confirm:true});
  if(error) throw error;
  userIds.push(data.user.id);
  const client=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:link,error:linkError}=await admin.auth.admin.generateLink({type:'magiclink',email});
  if(linkError) throw linkError;
  const {data:session,error:sessionError}=await client.auth.verifyOtp({token_hash:link.properties.hashed_token,type:'magiclink'});
  if(sessionError) throw sessionError;
  return {id:data.user.id,token:session.session.access_token};
}
async function api(path,user,method='GET',body,status=200) {
  const response=await fetch(`${base}/api${path}`,{method,signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json',...(user?{Authorization:`Bearer ${user.token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const result=await response.json();
  console.log(`${method} ${path.split('/').at(-1)}: ${response.status}`);
  assert.equal(response.status,status,`${method} ${path}: ${JSON.stringify(result)}`);
  return result;
}
try {
  await api('/account',null,'GET',null,401);
  const owner=await identity(); const learner=await identity();
  await api('/account',owner); // Bearer-only authentication, no cookies.
  const path=await api('/paths',owner,'POST',{title:'Disposable release acceptance path'},201);
  pathId=path.id;
  const prefix=`/paths/${pathId}`;
  const initial=[{title:'Phase',days:[{dayLabel:'Day 1',title:'Start',items:[{title:'Read',url:'https://example.com/read',tag:'hands'}]}]}];
  let plan=await api(`${prefix}/plan`,owner,'PUT',{phases:initial});
  const lesson=plan.phases[0].days[0].items[0].id;
  await api(`${prefix}/join`,learner,'POST',{},201);
  await api(`${prefix}/plan`,learner,'GET',null,404);
  await api(`${prefix}/approvals/${learner.id}`,owner,'POST',{decision:'approved'});
  await api(`${prefix}/progress`,learner,'POST',{itemId:lesson,done:true});
  await api(`${prefix}/notes`,learner,'POST',{itemId:lesson,text:'Private acceptance-test note'},201);
  assert.equal((await api(`${prefix}/notes`,owner)).length,0);
  assert.equal((await api(`${prefix}/notes/${lesson}`,owner)).length,0);
  assert.equal((await api(`${prefix}/notes`,learner))[0].text,'Private acceptance-test note');
  await api(prefix,owner,'PUT',{title:'Metadata-only update'});
  assert.deepEqual(await api(`${prefix}/plan`,owner),plan);
  plan.phases[0].title='Safe curriculum edit';
  const saved=await api(`${prefix}/plan`,owner,'PUT',plan);
  assert.equal(saved.phases[0].days[0].items[0].id,lesson);
  assert.deepEqual((await api(`${prefix}/progress`,learner)).completedItemIds,[lesson]);
  assert.equal((await api(`${prefix}/notes`,learner)).length,1);
  await api(`${prefix}/plan`,owner,'PUT',plan,409);
  await api(`${prefix}/members/${owner.id}`,owner,'POST',{action:'remove'},400);
  await api(`${prefix}/members/${learner.id}`,learner,'POST',{action:'promote'},403);
  const invalid=structuredClone(saved); invalid.phases[0].days[0].items[0].url='javascript:alert(1)';
  await api(`${prefix}/plan`,owner,'PUT',invalid,400);
  assert.deepEqual(await api(`${prefix}/plan`,owner),saved);
  console.log('PASS: live local API acceptance (existing-password auth on .local addresses, Bearer auth, approval, role guards, private notes, stable curriculum, stale edits, rollback).');
} finally {
  if(pathId) {
    const {error}=await admin.from('learning_paths').delete().eq('id',pathId);
    if(error) throw new Error('Disposable path cleanup failed', {cause:error});
  }
  for(const id of userIds) {
    // Entitlement/profile rows do not cascade from auth.users in the current schema.
    for(const table of ['profiles','user_entitlements']) {
      const {error}=await admin.from(table).delete().eq('user_id',id);
      if(error) throw new Error(`Disposable ${table} cleanup failed`,{cause:error});
    }
    const {error}=await admin.auth.admin.deleteUser(id);
    if(error) throw new Error('Disposable user cleanup failed',{cause:error});
  }
  console.log('Disposable fixtures cleaned up.');
}
