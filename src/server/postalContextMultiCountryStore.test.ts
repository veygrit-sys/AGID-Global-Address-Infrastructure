import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from '../testFixtures/postalContextRuntimeFixture';
import { createFrancePostalContextRuntimeTestPack } from '../testFixtures/postalContextFranceRuntimeFixture';
import { createIcelandPostalContextRuntimeTestPack } from '../testFixtures/postalContextIcelandRuntimeFixture';
import { createItalyPostalContextRuntimeTestPack } from '../testFixtures/postalContextItalyRuntimeFixture';
import { createEstoniaPostalContextRuntimeTestPack } from '../testFixtures/postalContextEstoniaRuntimeFixture';
import { createSwitzerlandPostalContextRuntimeTestPack } from '../testFixtures/postalContextSwitzerlandRuntimeFixture';
import { createGermanyPostalContextRuntimeTestPack } from '../testFixtures/postalContextGermanyRuntimeFixture';
import { createCzechiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextCzechiaRuntimeFixture';
import { createNewZealandPostalContextRuntimeTestPack } from '../testFixtures/postalContextNewZealandRuntimeFixture';
import { createNetherlandsPostalContextRuntimeTestPack } from '../testFixtures/postalContextNetherlandsRuntimeFixture';
import { createSingaporePostalContextRuntimeTestPack } from '../testFixtures/postalContextSingaporeRuntimeFixture';
import { createUnitedKingdomPostalContextRuntimeTestPack } from '../testFixtures/postalContextUnitedKingdomRuntimeFixture';
import {
  createConfiguredPostalContextPackStore,
  createInMemoryPostalContextPackStore,
} from './postalContextPackStore';

test('configured store advertises all supported country packs independently', () => {
  const store = createConfiguredPostalContextPackStore({});

  assert.deepEqual(
    store.statuses().map(status => [status.countryCode, status.state]),
    [['JP', 'unconfigured'], ['SG', 'unconfigured'], ['NL', 'unconfigured'], ['GB', 'unconfigured'], ['FR', 'unconfigured'], ['NZ', 'unconfigured'], ['IS', 'unconfigured'], ['IT', 'unconfigured'], ['EE', 'unconfigured'], ['CH', 'unconfigured'], ['DE', 'unconfigured'], ['CZ', 'unconfigured']],
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
  assert.equal(store.countryStatus('GB').state, 'unconfigured');
  assert.equal(store.countryStatus('FR').state, 'unconfigured');
  assert.equal(store.countryStatus('NZ').state, 'unconfigured');
  assert.equal(store.countryStatus('IS').state, 'unconfigured');
  assert.equal(store.countryStatus('IT').state, 'unconfigured');
  assert.equal(store.countryStatus('EE').state, 'unconfigured');
  assert.equal(store.countryStatus('CH').state, 'unconfigured');
  assert.equal(store.countryStatus('DE').state, 'unconfigured');
  assert.equal(store.countryStatus('CZ').state, 'unconfigured');
});

test('in-memory store can route independent supported-country runtimes', () => {
  const japan = new PostalContextPackRuntime(createPostalContextRuntimeTestPack());
  const singapore = new PostalContextPackRuntime(createSingaporePostalContextRuntimeTestPack());
  const netherlands = new PostalContextPackRuntime(createNetherlandsPostalContextRuntimeTestPack());
  const unitedKingdom = new PostalContextPackRuntime(createUnitedKingdomPostalContextRuntimeTestPack());
  const france = new PostalContextPackRuntime(createFrancePostalContextRuntimeTestPack());
  const newZealand = new PostalContextPackRuntime(createNewZealandPostalContextRuntimeTestPack());
  const iceland = new PostalContextPackRuntime(createIcelandPostalContextRuntimeTestPack());
  const italy = new PostalContextPackRuntime(createItalyPostalContextRuntimeTestPack());
  const estonia = new PostalContextPackRuntime(createEstoniaPostalContextRuntimeTestPack());
  const switzerland = new PostalContextPackRuntime(createSwitzerlandPostalContextRuntimeTestPack());
  const germany = new PostalContextPackRuntime(createGermanyPostalContextRuntimeTestPack());
  const czechia = new PostalContextPackRuntime(createCzechiaPostalContextRuntimeTestPack());
  const store = createInMemoryPostalContextPackStore([japan, singapore, netherlands, unitedKingdom, france, newZealand, iceland, italy, estonia, switzerland, germany, czechia]);

  assert.equal(store.getRuntime('jp'), japan);
  assert.equal(store.getRuntime('sg'), singapore);
  assert.equal(store.getRuntime('nl'), netherlands);
  assert.equal(store.getRuntime('gb'), unitedKingdom);
  assert.equal(store.getRuntime('fr'), france);
  assert.equal(store.getRuntime('nz'), newZealand);
  assert.equal(store.getRuntime('is'), iceland);
  assert.equal(store.getRuntime('it'), italy);
  assert.equal(store.getRuntime('ee'), estonia);
  assert.equal(store.getRuntime('ch'), switzerland);
  assert.equal(store.getRuntime('de'), germany);
  assert.equal(store.getRuntime('cz'), czechia);
  assert.deepEqual(store.statuses().map(status => status.countryCode), ['JP', 'SG', 'NL', 'GB', 'FR', 'NZ', 'IS', 'IT', 'EE', 'CH', 'DE', 'CZ']);
  assert.throws(
    () => createInMemoryPostalContextPackStore([singapore, singapore]),
    /duplicate-postal-context-runtime:SG/,
  );
});
