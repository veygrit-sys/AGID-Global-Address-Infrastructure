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
import { createDenmarkPostalContextRuntimeTestPack } from '../testFixtures/postalContextDenmarkRuntimeFixture';
import { createMaltaPostalContextRuntimeTestPack } from '../testFixtures/postalContextMaltaRuntimeFixture';
import { createMonacoPostalContextRuntimeTestPack } from '../testFixtures/postalContextMonacoRuntimeFixture';
import { createAustraliaPostalContextRuntimeTestPack } from '../testFixtures/postalContextAustraliaRuntimeFixture';
import { createLatviaPostalContextRuntimeTestPack } from '../testFixtures/postalContextLatviaRuntimeFixture';
import { createLithuaniaPostalContextRuntimeTestPack } from '../testFixtures/postalContextLithuaniaRuntimeFixture';
import { createLiechtensteinPostalContextRuntimeTestPack } from '../testFixtures/postalContextLiechtensteinRuntimeFixture';
import { createAzerbaijanPostalContextRuntimeTestPack } from '../testFixtures/postalContextAzerbaijanRuntimeFixture';
import { createAlbaniaPostalContextRuntimeTestPack } from '../testFixtures/postalContextAlbaniaRuntimeFixture';
import { createArmeniaPostalContextRuntimeTestPack } from '../testFixtures/postalContextArmeniaRuntimeFixture';
import { createAndorraPostalContextRuntimeTestPack } from '../testFixtures/postalContextAndorraRuntimeFixture';
import { createUkrainePostalContextRuntimeTestPack } from '../testFixtures/postalContextUkraineRuntimeFixture';
import { createAustriaPostalContextRuntimeTestPack } from '../testFixtures/postalContextAustriaRuntimeFixture';
import { createCyprusPostalContextRuntimeTestPack } from '../testFixtures/postalContextCyprusRuntimeFixture';
import { createGreecePostalContextRuntimeTestPack } from '../testFixtures/postalContextGreeceRuntimeFixture';
import { createCroatiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextCroatiaRuntimeFixture';
import { createGeorgiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextGeorgiaRuntimeFixture';
import { createSlovakiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextSlovakiaRuntimeFixture';
import { createSloveniaPostalContextRuntimeTestPack } from '../testFixtures/postalContextSloveniaRuntimeFixture';
import { createNorwayPostalContextRuntimeTestPack } from '../testFixtures/postalContextNorwayRuntimeFixture';
import { createHungaryPostalContextRuntimeTestPack } from '../testFixtures/postalContextHungaryRuntimeFixture';
import { createFinlandPostalContextRuntimeTestPack } from '../testFixtures/postalContextFinlandRuntimeFixture';
import { createBulgariaPostalContextRuntimeTestPack } from '../testFixtures/postalContextBulgariaRuntimeFixture';
import { createBelarusPostalContextRuntimeTestPack } from '../testFixtures/postalContextBelarusRuntimeFixture';
import { createBelgiumPostalContextRuntimeTestPack } from '../testFixtures/postalContextBelgiumRuntimeFixture';
import { createSerbiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextSerbiaRuntimeFixture';
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
    [['JP', 'unconfigured'], ['SG', 'unconfigured'], ['NL', 'unconfigured'], ['GB', 'unconfigured'], ['FR', 'unconfigured'], ['NZ', 'unconfigured'], ['IS', 'unconfigured'], ['IT', 'unconfigured'], ['EE', 'unconfigured'], ['CH', 'unconfigured'], ['DE', 'unconfigured'], ['CZ', 'unconfigured'], ['SK', 'unconfigured'], ['SI', 'unconfigured'], ['NO', 'unconfigured'], ['HU', 'unconfigured'], ['FI', 'unconfigured'], ['BG', 'unconfigured'], ['BY', 'unconfigured'], ['BE', 'unconfigured'], ['DK', 'unconfigured'], ['MT', 'unconfigured'], ['MC', 'unconfigured'], ['AU', 'unconfigured'], ['LV', 'unconfigured'], ['LT', 'unconfigured'], ['LI', 'unconfigured'], ['AZ', 'unconfigured'], ['AL', 'unconfigured'], ['AM', 'unconfigured'], ['AD', 'unconfigured'], ['UA', 'unconfigured'], ['AT', 'unconfigured'], ['CY', 'unconfigured'], ['GR', 'unconfigured'], ['HR', 'unconfigured'], ['RS', 'unconfigured'], ['GE', 'unconfigured']],
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
  assert.equal(store.countryStatus('DK').state, 'unconfigured');
  assert.equal(store.countryStatus('MT').state, 'unconfigured');
  assert.equal(store.countryStatus('LI').state, 'unconfigured');
  assert.equal(store.countryStatus('MC').state, 'unconfigured');
  assert.equal(store.countryStatus('LT').state, 'unconfigured');
  assert.equal(store.countryStatus('AU').state, 'unconfigured');
  assert.equal(store.countryStatus('LV').state, 'unconfigured');
  assert.equal(store.countryStatus('AZ').state, 'unconfigured');
  assert.equal(store.countryStatus('AL').state, 'unconfigured');
  assert.equal(store.countryStatus('AM').state, 'unconfigured');
  assert.equal(store.countryStatus('AD').state, 'unconfigured');
  assert.equal(store.countryStatus('UA').state, 'unconfigured');
  assert.equal(store.countryStatus('AT').state, 'unconfigured');
  assert.equal(store.countryStatus('CY').state, 'unconfigured');
  assert.equal(store.countryStatus('GR').state, 'unconfigured');
  assert.equal(store.countryStatus('HR').state, 'unconfigured');
  assert.equal(store.countryStatus('GE').state, 'unconfigured');
  assert.equal(store.countryStatus('RS').state, 'unconfigured');
  assert.equal(store.countryStatus('SK').state, 'unconfigured');
  assert.equal(store.countryStatus('SI').state, 'unconfigured');
  assert.equal(store.countryStatus('NO').state, 'unconfigured');
  assert.equal(store.countryStatus('HU').state, 'unconfigured');
  assert.equal(store.countryStatus('FI').state, 'unconfigured');
  assert.equal(store.countryStatus('BG').state, 'unconfigured');
  assert.equal(store.countryStatus('BY').state, 'unconfigured');
  assert.equal(store.countryStatus('BE').state, 'unconfigured');
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
  const denmark = new PostalContextPackRuntime(createDenmarkPostalContextRuntimeTestPack());
  const malta = new PostalContextPackRuntime(createMaltaPostalContextRuntimeTestPack());
  const monaco = new PostalContextPackRuntime(createMonacoPostalContextRuntimeTestPack());
  const australia = new PostalContextPackRuntime(createAustraliaPostalContextRuntimeTestPack());
  const latvia = new PostalContextPackRuntime(createLatviaPostalContextRuntimeTestPack());
  const lithuania = new PostalContextPackRuntime(createLithuaniaPostalContextRuntimeTestPack());
  const liechtenstein = new PostalContextPackRuntime(createLiechtensteinPostalContextRuntimeTestPack());
  const azerbaijan = new PostalContextPackRuntime(createAzerbaijanPostalContextRuntimeTestPack());
  const albania = new PostalContextPackRuntime(createAlbaniaPostalContextRuntimeTestPack());
  const armenia = new PostalContextPackRuntime(createArmeniaPostalContextRuntimeTestPack());
  const andorra = new PostalContextPackRuntime(createAndorraPostalContextRuntimeTestPack());
  const ukraine = new PostalContextPackRuntime(createUkrainePostalContextRuntimeTestPack());
  const austria = new PostalContextPackRuntime(createAustriaPostalContextRuntimeTestPack());
  const cyprus = new PostalContextPackRuntime(createCyprusPostalContextRuntimeTestPack());
  const greece = new PostalContextPackRuntime(createGreecePostalContextRuntimeTestPack());
  const croatia = new PostalContextPackRuntime(createCroatiaPostalContextRuntimeTestPack());
  const serbia = new PostalContextPackRuntime(createSerbiaPostalContextRuntimeTestPack());
  const georgia = new PostalContextPackRuntime(createGeorgiaPostalContextRuntimeTestPack());
  const slovakia = new PostalContextPackRuntime(createSlovakiaPostalContextRuntimeTestPack());
  const slovenia = new PostalContextPackRuntime(createSloveniaPostalContextRuntimeTestPack());
  const norway = new PostalContextPackRuntime(createNorwayPostalContextRuntimeTestPack());
  const hungary = new PostalContextPackRuntime(createHungaryPostalContextRuntimeTestPack());
  const finland = new PostalContextPackRuntime(createFinlandPostalContextRuntimeTestPack());
  const bulgaria = new PostalContextPackRuntime(createBulgariaPostalContextRuntimeTestPack());
  const belarus = new PostalContextPackRuntime(createBelarusPostalContextRuntimeTestPack());
  const belgium = new PostalContextPackRuntime(createBelgiumPostalContextRuntimeTestPack());
  const store = createInMemoryPostalContextPackStore([japan, singapore, netherlands, unitedKingdom, france, newZealand, iceland, italy, estonia, switzerland, germany, czechia, slovakia, slovenia, norway, hungary, finland, bulgaria, belarus, belgium, denmark, malta, monaco, australia, latvia, lithuania, liechtenstein, azerbaijan, albania, armenia, andorra, ukraine, austria, cyprus, greece, croatia, serbia, georgia]);

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
  assert.equal(store.getRuntime('dk'), denmark);
  assert.equal(store.getRuntime('mt'), malta);
  assert.equal(store.getRuntime('mc'), monaco);
  assert.equal(store.getRuntime('au'), australia);
  assert.equal(store.getRuntime('lv'), latvia);
  assert.equal(store.getRuntime('lt'), lithuania);
  assert.equal(store.getRuntime('li'), liechtenstein);
  assert.equal(store.getRuntime('az'), azerbaijan);
  assert.equal(store.getRuntime('al'), albania);
  assert.equal(store.getRuntime('am'), armenia);
  assert.equal(store.getRuntime('ad'), andorra);
  assert.equal(store.getRuntime('ua'), ukraine);
  assert.equal(store.getRuntime('at'), austria);
  assert.equal(store.getRuntime('cy'), cyprus);
  assert.equal(store.getRuntime('gr'), greece);
  assert.equal(store.getRuntime('hr'), croatia);
  assert.equal(store.getRuntime('rs'), serbia);
  assert.equal(store.getRuntime('ge'), georgia);
  assert.equal(store.getRuntime('sk'), slovakia);
  assert.equal(store.getRuntime('si'), slovenia);
  assert.equal(store.getRuntime('no'), norway);
  assert.equal(store.getRuntime('hu'), hungary);
  assert.equal(store.getRuntime('fi'), finland);
  assert.equal(store.getRuntime('bg'), bulgaria);
  assert.equal(store.getRuntime('by'), belarus);
  assert.equal(store.getRuntime('be'), belgium);
  assert.deepEqual(store.statuses().map(status => status.countryCode), ['JP', 'SG', 'NL', 'GB', 'FR', 'NZ', 'IS', 'IT', 'EE', 'CH', 'DE', 'CZ', 'SK', 'SI', 'NO', 'HU', 'FI', 'BG', 'BY', 'BE', 'DK', 'MT', 'MC', 'AU', 'LV', 'LT', 'LI', 'AZ', 'AL', 'AM', 'AD', 'UA', 'AT', 'CY', 'GR', 'HR', 'RS', 'GE']);
  assert.throws(
    () => createInMemoryPostalContextPackStore([singapore, singapore]),
    /duplicate-postal-context-runtime:SG/,
  );
});
