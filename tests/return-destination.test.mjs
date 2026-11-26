import { test } from 'node:test';
import assert from 'node:assert/strict';
import { returnDestination } from '../lib/return-destination.ts';

test('sign-in preserves valid learning spaces and rejects external or unsupported destinations', () => {
  const path='/paths/12345678-1234-4234-8234-123456789abc';
  assert.equal(returnDestination(path),path);
  assert.equal(returnDestination('/admin'),'/admin');
  const members = `/account/path-members?path=${path.slice('/paths/'.length)}`;
  assert.equal(returnDestination(members), members);
  assert.equal(returnDestination('/account/path-members'), '/account/path-members');
  assert.equal(returnDestination(`${members}&next=https://example.com`), '/journey');
  const invitation = `/invitations/accept/${path.slice('/paths/'.length)}.${'a'.repeat(64)}`;
  assert.equal(returnDestination(invitation), invitation);
  assert.equal(returnDestination(`${invitation}?next=https://example.com`), '/journey');
  assert.equal(returnDestination(invitation.replace('.', 'x')), '/journey');
  for(const value of [null,'','https://example.com','//example.com','/admin/other','/paths/not-an-id','/paths/../admin',`${path}?next=https://example.com`,`${path}/settings`]) {
    assert.equal(returnDestination(value),'/journey');
  }
});
