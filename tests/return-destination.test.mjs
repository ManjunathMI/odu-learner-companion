import { test } from 'node:test';
import assert from 'node:assert/strict';
import { returnDestination } from '../lib/return-destination.ts';

test('sign-in preserves valid learning spaces and rejects external or unsupported destinations', () => {
  const path='/paths/12345678-1234-4234-8234-123456789abc';
  assert.equal(returnDestination(path),path);
  assert.equal(returnDestination('/admin'),'/admin');
  for(const value of [null,'','https://example.com','//example.com','/admin/other','/paths/not-an-id','/paths/../admin',`${path}?next=https://example.com`,`${path}/settings`]) {
    assert.equal(returnDestination(value),'/journey');
  }
});
