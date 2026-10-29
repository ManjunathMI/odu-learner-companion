// Opt-in read-only acceptance using existing QA identities. No email or publication changes.
import nextEnv from '@next/env';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import assert from 'node:assert/strict';
import {testAccountLink,localOrigin} from './lib/test-accounts.mjs';
if(process.env.ODU_RUN_EXISTING_ACCOUNT_TESTS!=='1')throw new Error('Set ODU_RUN_EXISTING_ACCOUNT_TESTS=1 for existing-QA authentication checks.');
nextEnv.loadEnvConfig(process.cwd());
const base=localOrigin(process.argv[2]??'http://localhost:3100');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function read(route,cookie){const response=await fetch(base+route,{headers:cookie?{Cookie:cookie}:{},redirect:'manual',signal:AbortSignal.timeout(30000)});return {status:response.status,body:await response.text(),headers:response.headers};}
for(const route of ['/docs','/docs/how-to-use','/about','/blog','/blog/learning-together'])assert.equal((await read(route)).status,200,route);
const visitor=await read('/docs/architecture');assert.equal(visitor.status,404);assert.ok(!visitor.body.includes('learning_paths is the tenant root'));
const sitemap=(await read('/sitemap.xml')).body;
assert.ok(sitemap.includes('/docs/how-to-use'));assert.ok(sitemap.includes('/about'));assert.ok(!sitemap.includes('/docs/architecture'));assert.ok(!sitemap.includes('/docs/database-operations'));
assert.equal((await read('/api/admin/documents')).status,401);
for(const persona of ['learner','superadmin']){
 const jar=new Map();const client=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});
 const link=await testAccountLink(admin,persona,base);
 const {error}=await client.auth.verifyOtp({token_hash:new URL(link.url).searchParams.get('token_hash'),type:'magiclink'});if(error)throw new Error(`QA authentication failed for ${persona}`);
 try{
  const cookie=[...jar].map(([name,value])=>`${name}=${value}`).join('; ');
  const document=await read('/docs/architecture',cookie);
  assert.equal(document.status,persona==='superadmin'?200:404);
  if(persona==='superadmin')assert.match(document.body,/noindex/);
  assert.equal((await read('/api/admin/documents',cookie)).status,403);
  const patch=await fetch(base+'/api/admin/documents',{method:'PATCH',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({source_path:'content/help/how-to-use.md',status:'draft',visibility:'public'})});
  assert.equal(patch.status,403);
  console.log(`${persona}: technical read boundary and owner-only GET/PATCH passed`);
 }finally{await client.auth.signOut({scope:'local'});}
}
console.log('Public articles, sitemap, private routes and owner-management boundaries passed. No publication settings changed.');
