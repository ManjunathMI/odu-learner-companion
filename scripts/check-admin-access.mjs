// Read-only production/local admin diagnostic using an existing synthetic QA user.
// Does not send email, reset credentials, change permissions, or print auth tokens.
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { testAccountLink } from './lib/test-accounts.mjs';
nextEnv.loadEnvConfig(process.cwd());
const base=process.argv[2] || 'http://localhost:3100';
if (!['http://localhost:3100','http://localhost:3000','https://odu-learner-companion-j86o.vercel.app'].includes(base)) throw new Error('Use the known local or production application origin.');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const link=await testAccountLink(admin,'superadmin','http://localhost:3100');
const jar=new Map();
const client=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});
const {error}=await client.auth.verifyOtp({token_hash:new URL(link.url).searchParams.get('token_hash'),type:'magiclink'});
if(error) throw new Error('QA authentication failed');
const cookie=[...jar].map(([name,value])=>`${name}=${value}`).join('; ');
try {
for(const path of ['/admin','/api/admin/paths','/api/admin/quota-requests']) {
 try {
 const response=await fetch(`${base}${path}`,{headers:{Cookie:cookie},redirect:'manual',signal:AbortSignal.timeout(30000)});
 const body=await response.json().catch(()=>null);
 console.log(JSON.stringify({path,status:response.status,location:response.headers.get('location'),error:body?.error??null,rows:Array.isArray(body)?body.length:undefined}));
 } catch(error) { console.log(JSON.stringify({path,error:error.name})); }
}
} finally { await client.auth.signOut({scope:'local'}); }
console.log('Diagnostic QA session signed out.');
