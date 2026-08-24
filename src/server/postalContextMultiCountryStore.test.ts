import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from '../testFixtures/postalContextRuntimeFixture';
import { createNetherlandsPostalContextRuntimeTestPack } from '../testFixtures/postalContextNetherlandsRuntimeFixture';
import { createSingaporePostalContextRuntimeTestPack } from '../testFixtures/postalContextSingaporeRuntimeFixture';
import {
  createConfiguredPostalContextPackStore,
  createInMemoryPostalContextPackStore,
} from './postalContextPackStore';

test('configured store advertises Japan, Singapore, and Netherlands independently', () => {
  const store = createConfiguredPostalContextPackStore({});

  assert.deepEqual(
    store.statuses().map(status => [status.countryCode, status.state]),
    [['JP', 'unconfigured'], ['SG', 'unconfigured'], ['NL', 'unconfigured']],
  );
  assert.deepEqual(store.countryStatus('US').errors, ['unsupported-country']);
});

test('an incomplete Singapore configuration does not affect Japan status', () => {
  const store = createConfiguredPostalContextPackStore({
    AGID_POSTAL_CONTEXT_SG_DESCRIPTOR_PATH: 'sg-descriptor.json',
  });

  assert.equal(store.countryStatus('SG').state, 'invalid');
  assert.deepEqual(store.countryStatus('SG').errors, ['active-pack-configuration-incomplete']);
  assert.equal(store.countryStatus('JP').state, 'unconfigured');
  assert.equal(store.countryStatus('NL').state, 'unconfigured');
});

test('in-memory store can route independent Japan, Singapore, and Netherlands runtimes', () => {
  const japan = new PostalContextPackRuntime(createPostalContextRuntimeTestPack());
  const singapore = new PostalContextPackRuntime(createSingaporePostalContextRuntimeTestPack());
  const netherlands = new PostalContextPackRuntime(createNetherlandsPostalContextRuntimeTestPack());
  const store = createInMemoryPostalContextPackStore([japan, singapore, netherlands]);

  assert.equal(store.getRuntime('jp'), japan);
  assert.equal(store.getRuntime('sg'), singapore);
  assert.equal(store.getRuntime('nl'), netherlands);
  assert.deepEqual(store.statuses().map(status => status.countryCode), ['JP', 'SG', 'NL']);
  assert.throws(
    () => createInMemoryPostalContextPackStore([singapore, singapore]),
    /duplicate-postal-context-runtime:SG/,
  );
});
