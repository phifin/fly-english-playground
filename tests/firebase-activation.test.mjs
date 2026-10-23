import test from 'node:test';
import assert from 'node:assert/strict';
import { safeFailure, rulesHash, ownerFlags } from '../scripts/verify-firebase-activation.mjs';

test('activation receipts allow only bounded failure codes and HTTP statuses, never provider data', () => {
  const secret = 'PRIVATE-TOKEN-AND-EMAIL@example.test';
  const error = Object.assign(new Error(secret), { code: secret, token: secret, status: 403,
    context: { response: { statusCode: 401, body: secret, headers: { Authorization: secret } } },
    original: Object.assign(new Error(secret), { code: 'ECONNREFUSED' }) });
  const receipt = safeFailure(error);
  assert.deepEqual(receipt, { status: 'unverified', error: 'ECONNREFUSED', httpStatus: 401 });
  assert.equal(JSON.stringify(receipt).includes(secret), false);
  error.original.original = error;
  assert.deepEqual(safeFailure(error), receipt, 'Cyclic vendor causes cannot hang the probe.');
  assert.deepEqual(safeFailure({ code: 403, statusCode: '403', message: secret }),
    { status: 'unverified', error: 'request-failed' });
});

test('owner activation requires actual Boolean Firestore values', () => {
  assert.deepEqual(ownerFlags({ approved: { booleanValue: true }, familyOwner: { booleanValue: true } }),
    { approved: true, familyOwner: true });
  assert.deepEqual(ownerFlags({ approved: { stringValue: 'true' }, familyOwner: { booleanValue: 'true' }, secret: 'excluded' }),
    { approved: false, familyOwner: false });
  assert.deepEqual(ownerFlags(), { approved: false, familyOwner: false });
});

test('rules comparison tolerates platform line endings but detects changed access rules', () => {
  const rules = "rules_version = '2';\nallow read: if false;\n";
  assert.equal(rulesHash(rules), rulesHash(rules.replaceAll('\n', '\r\n')));
  assert.notEqual(rulesHash(rules), rulesHash(rules.replace('false', 'true')));
});
