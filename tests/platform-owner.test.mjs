import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isOwnerIdentity, PLATFORM_OWNER_ID, PLATFORM_OWNER_EMAIL } from '../lib/platform-owner.ts';
test('admin ownership requires both the verified owner UUID and email',()=>{
 assert.equal(isOwnerIdentity({id:PLATFORM_OWNER_ID,email:PLATFORM_OWNER_EMAIL}),true);
 assert.equal(isOwnerIdentity({id:PLATFORM_OWNER_ID,email:PLATFORM_OWNER_EMAIL.toUpperCase()}),true);
 assert.equal(isOwnerIdentity({id:'d1b0ba53-ce5f-4e18-9f32-68ccc30d8504',email:'superadmin.test@odu.local'}),false);
 assert.equal(isOwnerIdentity({id:'other',email:PLATFORM_OWNER_EMAIL}),false);
 assert.equal(isOwnerIdentity({id:PLATFORM_OWNER_ID,email:'other@example.com'}),false);
});

test('a new installation can configure its owner and partial configuration fails closed',async()=>{
 const {ownerConfiguration}=await import('../lib/platform-owner.ts');
 assert.deepEqual(ownerConfiguration(' new-owner-id ',' New.Owner@Example.com '),{id:'new-owner-id',email:'new.owner@example.com'});
 assert.equal(ownerConfiguration('new-owner-id').email,'');
 assert.equal(ownerConfiguration(undefined,'owner@example.com').id,'');
});
