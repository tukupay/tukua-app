// Activation refusals (403 account_not_activated / school_not_activated): code read from every body shape the
// API sends, plain message, and one prompt per burst.   cd tukua-mobile && npx tsx --test scripts/activation.spec.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  activationCodeOf,
  activationMessage,
  announceActivationRequired,
  onActivationRequired,
  resetActivationForTests,
  SCHOOL_NOT_ACTIVATED_MESSAGE,
} from '../src/lib/activation.ts';

test('reads the code from the interceptor body and nested shapes', () => {
  assert.equal(activationCodeOf({ statusCode: 403, error: 'account_not_activated', code: 'account_not_activated' }), 'account_not_activated');
  assert.equal(activationCodeOf({ error: { code: 'school_not_activated' } }), 'school_not_activated');
  assert.equal(activationCodeOf({ data: { code: 'school_not_activated' } }), 'school_not_activated');
  assert.equal(activationCodeOf({ error: 'Forbidden', message: 'For school staff only' }), null);
  assert.equal(activationCodeOf(null), null);
});

test('message: the server sentence, else a plain default', () => {
  assert.equal(activationMessage('account_not_activated', { message: 'Activate your account: buy tokens to start.' }), 'Activate your account: buy tokens to start.');
  assert.equal(activationMessage('school_not_activated', {}), SCHOOL_NOT_ACTIVATED_MESSAGE);
});

test('one prompt per burst of refusals', () => {
  resetActivationForTests();
  const seen = [];
  const off = onActivationRequired((n) => seen.push(n.code));
  assert.equal(announceActivationRequired({ code: 'school_not_activated', message: 'x' }, 10_000), true);
  assert.equal(announceActivationRequired({ code: 'school_not_activated', message: 'x' }, 11_000), false);
  assert.equal(announceActivationRequired({ code: 'account_not_activated', message: 'y' }, 20_000), true);
  off();
  assert.equal(announceActivationRequired({ code: 'account_not_activated', message: 'y' }, 30_000), true);
  assert.deepEqual(seen, ['school_not_activated', 'account_not_activated']);
});
