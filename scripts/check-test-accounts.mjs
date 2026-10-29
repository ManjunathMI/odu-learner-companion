// Reusable, opt-in acceptance check. Signs into existing QA accounts; no fixtures or role changes.
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import { testAccounts, localOrigin, testAccountLink } from './lib/test-accounts.mjs';
if (process.env.ODU_RUN_EXISTING_ACCOUNT_TESTS !== '1') throw new Error('Set ODU_RUN_EXISTING_ACCOUNT_TESTS=1 to sign in with the existing synthetic QA accounts.');
nextEnv.loadEnvConfig(process.cwd());
const origin=localOrigin(process.argv[2] || 'http://localhost:3100');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
for (const persona of Object.keys(testAccounts)) {
  const link=await testAccountLink(admin,persona,origin);
  const callback=await fetch(link.url,{redirect:'manual',signal:AbortSignal.timeout(30000)});
  assert.equal(callback.status,303,`${persona}: callback response`);
  assert.equal(callback.headers.get('location'),`${origin}/journey`,`${persona}: sign-in continuation`);
  assert.match(callback.headers.get('cache-control'),/no-store/);
  const cookies=callback.headers.getSetCookie().map((value)=>value.split(';')[0]).join('; ');
  assert.ok(cookies,`${persona}: session cookies`);
  const headers={Cookie:cookies};
  const response=await fetch(`${origin}/api/account`,{headers,signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,`${persona}: cookie authentication`);
  const account=await response.json();
  assert.equal(account.identity.email,testAccounts[persona]);
  assert.equal(account.isPlatformAdmin,persona==='superadmin');
  const journey=await fetch(`${origin}/journey`,{headers,redirect:'manual',signal:AbortSignal.timeout(30000)});
  assert.equal(journey.status,200,`${persona}: Journey route`);
  const adminResponse=await fetch(`${origin}/api/admin/paths`,{headers,signal:AbortSignal.timeout(30000)});
  assert.equal(adminResponse.status,403,`${persona}: platform boundary`);
  console.log(`PASS ${persona}: session, Journey, account, platform authorization; ${account.memberships.length} approved path memberships.`);
}
// Failures never reflect credential-bearing URLs in assertion output.
const invalid=await fetch(`${origin}/auth/callback?code=invalid&next=https://example.com`,{redirect:'manual',signal:AbortSignal.timeout(30000)});
assert.equal(invalid.status,303);
assert.equal(new URL(invalid.headers.get('location')).origin,origin);
assert.match(invalid.headers.get('location'),/error=link/);
console.log('PASS invalid links fail safely without an external redirect. Existing users, memberships and learning data were not modified.');
