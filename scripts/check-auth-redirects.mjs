// No-email diagnostic: check the actual redirect Supabase chooses for a QA link.
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { existingTestUser, localOrigin } from './lib/test-accounts.mjs';
nextEnv.loadEnvConfig(process.cwd());
const origin=localOrigin(process.argv[2] || 'http://localhost:3100');
const requested=new URL('/auth/callback',origin);
requested.searchParams.set('next','/journey');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const user=await existingTestUser(admin,'visitor');
const {data,error}=await admin.auth.admin.generateLink({type:'magiclink',email:user.email,options:{redirectTo:requested.toString()}});
if(error) throw error;
// Never log the action link, token hash, OTP, or credentials.
const actual=new URL(data.properties.action_link).searchParams.get('redirect_to') || data.properties.redirect_to;
console.log(JSON.stringify({requestedRedirect:requested.toString(),supabaseSelectedRedirect:actual,matches:actual===requested.toString(),emailSent:false},null,2));
if(actual!==requested.toString()) {
  console.error('Supabase did not accept the local callback. Verify Authentication → URL Configuration → Redirect URLs; keep Site URL on production.');
  process.exitCode=1;
}
