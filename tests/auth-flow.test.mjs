import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emailCallbackUrl, authCallbackInput } from '../lib/auth-flow.ts';
import { localOrigin, testAccounts, existingTestUser, testAccountLink } from '../scripts/lib/test-accounts.mjs';

test('email callback follows the current app origin and preserves a selected path',()=>{
  const path='/paths/12345678-1234-4234-8234-123456789abc';
  const local=new URL(emailCallbackUrl('http://localhost:3100',path));
  assert.equal(local.origin,'http://localhost:3100');
  assert.equal(local.pathname,'/auth/callback');
  assert.equal(local.searchParams.get('next'),path);
  assert.equal(new URL(emailCallbackUrl('https://odu.example','/journey')).origin,'https://odu.example');
  assert.throws(()=>emailCallbackUrl('file:///tmp','/journey'));
});
test('callback accepts PKCE codes or permitted email token types',()=>{
  assert.deepEqual(authCallbackInput(new URL('https://odu.example/auth/callback?code=abc')),{kind:'code',code:'abc'});
  for(const type of ['email','magiclink','signup']) assert.deepEqual(authCallbackInput(new URL(`https://odu.example/auth/callback?token_hash=abc&type=${type}`)),{kind:'token',token_hash:'abc',type});
  for(const query of ['', '?token_hash=abc&type=recovery','?type=magiclink','?token_hash=abc&type=unknown']) assert.equal(authCallbackInput(new URL(`https://odu.example/auth/callback${query}`)).kind,'invalid');
});
test('test-login tooling rejects remote origins and non-test accounts',async()=>{
  for(const origin of ['https://example.com','http://localhost.evil','http://localhost@evil.com','http://localhost/path','http://localhost?x=1','file:///tmp','http://user:password@localhost']) assert.throws(()=>localOrigin(origin));
  for(const origin of ['http://localhost:3100','http://127.0.0.1:3000','http://[::1]:3000']) assert.equal(localOrigin(origin),origin);
  await assert.rejects(existingTestUser({},'immanjunath@outlook.com'),/Choose a test persona/);
  let generated=false;
  const admin={auth:{admin:{listUsers:async()=>({data:{users:[]}}),generateLink:async()=>{generated=true;}}}};
  await assert.rejects(testAccountLink(admin,'learner','http://localhost:3100'),/No account was created/);
  assert.equal(generated,false);
  assert.equal(Object.keys(testAccounts).length,5);
});
