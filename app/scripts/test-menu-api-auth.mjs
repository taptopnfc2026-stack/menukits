import assert from 'node:assert/strict';
import {
  clearPendingMenuDelete,
  deleteMenuFromCloud,
  flushPendingMenuDeletes,
  getPendingMenuDeleteIds,
  queuePendingMenuDelete,
} from '../src/lib/menu-api.ts';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => { storage.set(key, String(value)); },
  removeItem: (key) => { storage.delete(key); },
};

const calls = [];
const cloudId = '44bc0788-3415-4a81-bec4-bb5e2fe5190a';
const okFetch = async (url, options) => {
  calls.push({ url, options });
  return { ok: true, status: 200, text: async () => '{"success":true}' };
};

await deleteMenuFromCloud(cloudId, 'auth-token-1', okFetch);

assert.equal(calls.length, 1);
assert.equal(calls[0].url, `/api/menus?id=${cloudId}`);
assert.equal(calls[0].options.method, 'DELETE');
assert.equal(calls[0].options.headers.Authorization, 'Bearer auth-token-1');

const beforeLocalOnly = calls.length;
await deleteMenuFromCloud('1781314412485', 'auth-token-1', okFetch);
assert.equal(calls.length, beforeLocalOnly);

const missingFetch = async () => ({ ok: false, status: 404, text: async () => '{"error":"Menu not found"}' });
await deleteMenuFromCloud('44bc0788-3415-4a81-bec4-bb5e2fe5190a', 'auth-token-1', missingFetch);

queuePendingMenuDelete(cloudId);
queuePendingMenuDelete('1781314412485');
assert.deepEqual(getPendingMenuDeleteIds(), [cloudId]);

const flushedIds = await flushPendingMenuDeletes('auth-token-1', okFetch);
assert.deepEqual(flushedIds, [cloudId]);
assert.deepEqual(getPendingMenuDeleteIds(), []);

queuePendingMenuDelete(cloudId);
clearPendingMenuDelete(cloudId);
assert.deepEqual(getPendingMenuDeleteIds(), []);

await assert.rejects(
  () => deleteMenuFromCloud(cloudId, null, okFetch),
  /Missing auth token/
);

const failingFetch = async () => ({ ok: false, status: 401, text: async () => '{"error":"Unauthorized"}' });
await assert.rejects(
  () => deleteMenuFromCloud(cloudId, 'auth-token-1', failingFetch),
  /401/
);

console.log('menu api auth ok');
