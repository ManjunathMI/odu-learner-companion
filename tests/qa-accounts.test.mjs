import {test} from 'node:test';
import assert from 'node:assert/strict';
import {qaEmail,deliveryEmail} from '../lib/qa-accounts.ts';
test('QA management excludes real learners and normalizes synthetic identities',()=>{
 assert.equal(qaEmail(' Superadmin.Test@ODU.LOCAL '),'superadmin.test@odu.local');
 assert.equal(qaEmail('immanjunath@outlook.com'),null);
 assert.equal(qaEmail('x@odu.local.attacker.com'),null);
});
test('delivery recipients must be deliverable addresses without header injection',()=>{
 assert.equal(deliveryEmail(' Immanjunath@Outlook.com '),'immanjunath@outlook.com');
 for(const value of ['test@odu.local','bad','x@y.com\r\nBcc:z@y.com',null]) assert.equal(deliveryEmail(value),null);
});
