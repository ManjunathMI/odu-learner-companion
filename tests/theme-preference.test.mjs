import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveThemePreference } from '../lib/theme-preference.ts';

test('theme preferences migrate legacy values to the current light and dark themes', () => {
  assert.equal(resolveThemePreference('light', true), 'light');
  assert.equal(resolveThemePreference('dark', false), 'dark');
  assert.equal(resolveThemePreference('neon', false), 'dark');
  assert.equal(resolveThemePreference('neon', true), 'dark');
});

test('system, missing, and unknown preferences follow the device color scheme', () => {
  assert.equal(resolveThemePreference('system', true), 'dark');
  assert.equal(resolveThemePreference('system', false), 'light');
  assert.equal(resolveThemePreference(null, true), 'dark');
  assert.equal(resolveThemePreference('unexpected', false), 'light');
});