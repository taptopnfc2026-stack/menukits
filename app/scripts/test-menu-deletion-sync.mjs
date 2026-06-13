import assert from 'node:assert/strict';
import { getDeletedCloudMenuIds, isCloudMenuId } from '../src/lib/menu-sync.ts';

const keepId = '44bc0788-3415-4a81-bec4-bb5e2fe5190a';
const deletedId = '89ae7f66-2cea-4c3f-b660-f1ae17463999';

assert.equal(isCloudMenuId(keepId), true);
assert.equal(isCloudMenuId('1781314412485'), false);

assert.deepEqual(
  getDeletedCloudMenuIds([keepId, deletedId, 'local-temp-id'], [
    { id: keepId },
    { id: '1781314412485' },
  ]),
  [deletedId]
);

assert.deepEqual(
  getDeletedCloudMenuIds([keepId], [{ id: keepId }]),
  []
);

console.log('menu deletion sync detection ok');
