import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PostalContextPackRuntime } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from '../testFixtures/postalContextRuntimeFixture';
import { createUnitedStatesPostalContextRuntimeTestPack } from '../testFixtures/postalContextUnitedStatesRuntimeFixture';
import { createCanadaPostalContextRuntimeTestPack } from '../testFixtures/postalContextCanadaRuntimeFixture';
import { createMexicoPostalContextRuntimeTestPack } from '../testFixtures/postalContextMexicoRuntimeFixture';
import { createCubaPostalContextRuntimeTestPack } from '../testFixtures/postalContextCubaRuntimeFixture';
import { createArgentinaPostalContextRuntimeTestPack } from '../testFixtures/postalContextArgentinaRuntimeFixture';
import { createUruguayPostalContextRuntimeTestPack } from '../testFixtures/postalContextUruguayRuntimeFixture';
import { createEcuadorPostalContextRuntimeTestPack } from '../testFixtures/postalContextEcuadorRuntimeFixture';
import { createElSalvadorPostalContextRuntimeTestPack } from '../testFixtures/postalContextElSalvadorRuntimeFixture';
import { createGuatemalaPostalContextRuntimeTestPack } from '../testFixtures/postalContextGuatemalaRuntimeFixture';
import { createCostaRicaPostalContextRuntimeTestPack } from '../testFixtures/postalContextCostaRicaRuntimeFixture';
import { createChilePostalContextRuntimeTestPack } from '../testFixtures/postalContextChileRuntimeFixture';
import { createDominicanRepublicPostalContextRuntimeTestPack } from '../testFixtures/postalContextDominicanRepublicRuntimeFixture';
import { createHaitiPostalContextRuntimeTestPack } from '../testFixtures/postalContextHaitiRuntimeFixture';
import { createPanamaPostalContextRuntimeTestPack } from '../testFixtures/postalContextPanamaRuntimeFixture';
import { createBarbadosPostalContextRuntimeTestPack } from '../testFixtures/postalContextBarbadosRuntimeFixture';
import { createNicaraguaPostalContextRuntimeTestPack } from '../testFixtures/postalContextNicaraguaRuntimeFixture';
import { createBrazilPostalContextRuntimeTestPack } from '../testFixtures/postalContextBrazilRuntimeFixture';
import { createVenezuelaPostalContextRuntimeTestPack } from '../testFixtures/postalContextVenezuelaRuntimeFixture';
import { createPeruPostalContextRuntimeTestPack } from '../testFixtures/postalContextPeruRuntimeFixture';
import { createColombiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextColombiaRuntimeFixture';
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
import { createMontenegroPostalContextRuntimeTestPack } from '../testFixtures/postalContextMontenegroRuntimeFixture';
import { createRomaniaPostalContextRuntimeTestPack } from '../testFixtures/postalContextRomaniaRuntimeFixture';
import { createTaiwanPostalContextRuntimeTestPack } from '../testFixtures/postalContextTaiwanRuntimeFixture';
import { createKoreaPostalContextRuntimeTestPack } from '../testFixtures/postalContextKoreaRuntimeFixture';
import { createSaudiArabiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextSaudiArabiaRuntimeFixture';
import { createOmanPostalContextRuntimeTestPack } from '../testFixtures/postalContextOmanRuntimeFixture';
import { createSouthAfricaPostalContextRuntimeTestPack } from '../testFixtures/postalContextSouthAfricaRuntimeFixture';
import { createEgyptPostalContextRuntimeTestPack } from '../testFixtures/postalContextEgyptRuntimeFixture';
import { createMoroccoPostalContextRuntimeTestPack } from '../testFixtures/postalContextMoroccoRuntimeFixture';
import { createAlgeriaPostalContextRuntimeTestPack } from '../testFixtures/postalContextAlgeriaRuntimeFixture';
import { createEthiopiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextEthiopiaRuntimeFixture';
import { createCaboVerdePostalContextRuntimeTestPack } from '../testFixtures/postalContextCaboVerdeRuntimeFixture';
import { createKenyaPostalContextRuntimeTestPack } from '../testFixtures/postalContextKenyaRuntimeFixture';
import { createZambiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextZambiaRuntimeFixture';
import { createSenegalPostalContextRuntimeTestPack } from '../testFixtures/postalContextSenegalRuntimeFixture';
import { createSeychellesPostalContextRuntimeTestPack } from '../testFixtures/postalContextSeychellesRuntimeFixture';
import { createSomaliaPostalContextRuntimeTestPack } from '../testFixtures/postalContextSomaliaRuntimeFixture';
import { createTanzaniaPostalContextRuntimeTestPack } from '../testFixtures/postalContextTanzaniaRuntimeFixture';
import { createTunisiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextTunisiaRuntimeFixture';
import { createNigeriaPostalContextRuntimeTestPack } from '../testFixtures/postalContextNigeriaRuntimeFixture';
import { createNamibiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextNamibiaRuntimeFixture';
import { createNigerPostalContextRuntimeTestPack } from '../testFixtures/postalContextNigerRuntimeFixture';
import { createMadagascarPostalContextRuntimeTestPack } from '../testFixtures/postalContextMadagascarRuntimeFixture';
import { createMauritiusPostalContextRuntimeTestPack } from '../testFixtures/postalContextMauritiusRuntimeFixture';
import { createMozambiquePostalContextRuntimeTestPack } from '../testFixtures/postalContextMozambiqueRuntimeFixture';
import { createLiberiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextLiberiaRuntimeFixture';
import { createIndiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextIndiaRuntimeFixture';
import { createPakistanPostalContextRuntimeTestPack } from '../testFixtures/postalContextPakistanRuntimeFixture';
import { createBangladeshPostalContextRuntimeTestPack } from '../testFixtures/postalContextBangladeshRuntimeFixture';
import { createBhutanPostalContextRuntimeTestPack } from '../testFixtures/postalContextBhutanRuntimeFixture';
import { createBruneiPostalContextRuntimeTestPack } from '../testFixtures/postalContextBruneiRuntimeFixture';
import { createVietnamPostalContextRuntimeTestPack } from '../testFixtures/postalContextVietnamRuntimeFixture';
import { createMalaysiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextMalaysiaRuntimeFixture';
import { createMyanmarPostalContextRuntimeTestPack } from '../testFixtures/postalContextMyanmarRuntimeFixture';
import { createMaldivesPostalContextRuntimeTestPack } from '../testFixtures/postalContextMaldivesRuntimeFixture';
import { createMongoliaPostalContextRuntimeTestPack } from '../testFixtures/postalContextMongoliaRuntimeFixture';
import { createJordanPostalContextRuntimeTestPack } from '../testFixtures/postalContextJordanRuntimeFixture';
import { createLaosPostalContextRuntimeTestPack } from '../testFixtures/postalContextLaosRuntimeFixture';
import { createLebanonPostalContextRuntimeTestPack } from '../testFixtures/postalContextLebanonRuntimeFixture';
import { createAfghanistanPostalContextRuntimeTestPack } from '../testFixtures/postalContextAfghanistanRuntimeFixture';
import { createIsraelPostalContextRuntimeTestPack } from '../testFixtures/postalContextIsraelRuntimeFixture';
import { createIraqPostalContextRuntimeTestPack } from '../testFixtures/postalContextIraqRuntimeFixture';
import { createIranPostalContextRuntimeTestPack } from '../testFixtures/postalContextIranRuntimeFixture';
import { createUzbekistanPostalContextRuntimeTestPack } from '../testFixtures/postalContextUzbekistanRuntimeFixture';
import { createKazakhstanPostalContextRuntimeTestPack } from '../testFixtures/postalContextKazakhstanRuntimeFixture';
import { createChinaPostalContextRuntimeTestPack } from '../testFixtures/postalContextChinaRuntimeFixture';
import { createCambodiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextCambodiaRuntimeFixture';
import { createKyrgyzstanPostalContextRuntimeTestPack } from '../testFixtures/postalContextKyrgyzstanRuntimeFixture';
import { createIndonesiaPostalContextRuntimeTestPack } from '../testFixtures/postalContextIndonesiaRuntimeFixture';
import { createPhilippinesPostalContextRuntimeTestPack } from '../testFixtures/postalContextPhilippinesRuntimeFixture';
import { createKuwaitPostalContextRuntimeTestPack } from '../testFixtures/postalContextKuwaitRuntimeFixture';
import { createBahrainPostalContextRuntimeTestPack } from '../testFixtures/postalContextBahrainRuntimeFixture';
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
    store.statuses().filter(status => status.countryCode !== 'SC').map(status => [status.countryCode, status.state]),
    [['JP', 'unconfigured'], ['US', 'unconfigured'], ['CA', 'unconfigured'], ['MX', 'unconfigured'], ['CU', 'unconfigured'], ['AR', 'unconfigured'], ['UY', 'unconfigured'], ['EC', 'unconfigured'], ['SV', 'unconfigured'], ['GT', 'unconfigured'], ['CR', 'unconfigured'], ['CL', 'unconfigured'], ['DO', 'unconfigured'], ['HT', 'unconfigured'], ['PA', 'unconfigured'], ['BB', 'unconfigured'], ['NI', 'unconfigured'], ['BR', 'unconfigured'], ['VE', 'unconfigured'], ['PE', 'unconfigured'], ['CO', 'unconfigured'], ['SG', 'unconfigured'], ['NL', 'unconfigured'], ['GB', 'unconfigured'], ['FR', 'unconfigured'], ['NZ', 'unconfigured'], ['IS', 'unconfigured'], ['IT', 'unconfigured'], ['EE', 'unconfigured'], ['CH', 'unconfigured'], ['DE', 'unconfigured'], ['CZ', 'unconfigured'], ['SK', 'unconfigured'], ['SI', 'unconfigured'], ['NO', 'unconfigured'], ['HU', 'unconfigured'], ['FI', 'unconfigured'], ['FO', 'unconfigured'], ['BG', 'unconfigured'], ['BY', 'unconfigured'], ['BE', 'unconfigured'], ['ME', 'unconfigured'], ['RO', 'unconfigured'], ['TW', 'unconfigured'], ['KR', 'unconfigured'], ['SA', 'unconfigured'], ['OM', 'unconfigured'], ['ZA', 'unconfigured'], ['EG', 'unconfigured'], ['MA', 'unconfigured'], ['DZ', 'unconfigured'], ['ET', 'unconfigured'], ['CV', 'unconfigured'], ['KE', 'unconfigured'], ['ZM', 'unconfigured'], ['SN', 'unconfigured'], ['SO', 'unconfigured'], ['TZ', 'unconfigured'], ['TN', 'unconfigured'], ['NG', 'unconfigured'], ['NA', 'unconfigured'], ['NE', 'unconfigured'], ['MG', 'unconfigured'], ['MU', 'unconfigured'], ['MZ', 'unconfigured'], ['LR', 'unconfigured'], ['IN', 'unconfigured'], ['PK', 'unconfigured'], ['BD', 'unconfigured'], ['BT', 'unconfigured'], ['ID', 'unconfigured'], ['PH', 'unconfigured'], ['BN', 'unconfigured'], ['VN', 'unconfigured'], ['MY', 'unconfigured'], ['MM', 'unconfigured'], ['MV', 'unconfigured'], ['MN', 'unconfigured'], ['JO', 'unconfigured'], ['LA', 'unconfigured'], ['LB', 'unconfigured'], ['AF', 'unconfigured'], ['IL', 'unconfigured'], ['IQ', 'unconfigured'], ['IR', 'unconfigured'], ['UZ', 'unconfigured'], ['KZ', 'unconfigured'], ['CN', 'unconfigured'], ['KH', 'unconfigured'], ['KG', 'unconfigured'], ['KW', 'unconfigured'], ['BH', 'unconfigured'], ['DK', 'unconfigured'], ['MT', 'unconfigured'], ['MC', 'unconfigured'], ['AU', 'unconfigured'], ['LV', 'unconfigured'], ['LT', 'unconfigured'], ['LI', 'unconfigured'], ['AZ', 'unconfigured'], ['AL', 'unconfigured'], ['AM', 'unconfigured'], ['AD', 'unconfigured'], ['UA', 'unconfigured'], ['AT', 'unconfigured'], ['CY', 'unconfigured'], ['GR', 'unconfigured'], ['HR', 'unconfigured'], ['RS', 'unconfigured'], ['GE', 'unconfigured']],
  );
  assert.equal(store.countryStatus('SC').state, 'unconfigured');
  assert.equal(store.countryStatus('SO').state, 'unconfigured');
  assert.equal(store.countryStatus('TZ').state, 'unconfigured');
  assert.equal(store.countryStatus('TN').state, 'unconfigured');
  assert.equal(store.countryStatus('NG').state, 'unconfigured');
  assert.equal(store.countryStatus('NA').state, 'unconfigured');
  assert.equal(store.countryStatus('NE').state, 'unconfigured');
  assert.equal(store.countryStatus('MG').state, 'unconfigured');
  assert.equal(store.countryStatus('MU').state, 'unconfigured');
  assert.equal(store.countryStatus('MZ').state, 'unconfigured');
  assert.equal(store.countryStatus('LR').state, 'unconfigured');
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'SC'),
    store.statuses().findIndex(status => status.countryCode === 'SN') + 1,
  );
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'SO'),
    store.statuses().findIndex(status => status.countryCode === 'SC') + 1,
  );
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'TZ'),
    store.statuses().findIndex(status => status.countryCode === 'SO') + 1,
  );
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'TN'),
    store.statuses().findIndex(status => status.countryCode === 'TZ') + 1,
  );
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'NG'),
    store.statuses().findIndex(status => status.countryCode === 'TN') + 1,
  );
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'NA'),
    store.statuses().findIndex(status => status.countryCode === 'NG') + 1,
  );
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'NE'),
    store.statuses().findIndex(status => status.countryCode === 'NA') + 1,
  );
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'MG'),
    store.statuses().findIndex(status => status.countryCode === 'NE') + 1,
  );
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'MU'),
    store.statuses().findIndex(status => status.countryCode === 'MG') + 1,
  );
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'MZ'),
    store.statuses().findIndex(status => status.countryCode === 'MU') + 1,
  );
  assert.equal(
    store.statuses().findIndex(status => status.countryCode === 'LR'),
    store.statuses().findIndex(status => status.countryCode === 'MZ') + 1,
  );
  assert.equal(store.countryStatus('US').state, 'unconfigured');
  assert.equal(store.countryStatus('CA').state, 'unconfigured');
  assert.equal(store.countryStatus('MX').state, 'unconfigured');
  assert.equal(store.countryStatus('CU').state, 'unconfigured');
  assert.equal(store.countryStatus('AR').state, 'unconfigured');
  assert.equal(store.countryStatus('UY').state, 'unconfigured');
  assert.equal(store.countryStatus('EC').state, 'unconfigured');
  assert.equal(store.countryStatus('SV').state, 'unconfigured');
  assert.equal(store.countryStatus('GT').state, 'unconfigured');
  assert.equal(store.countryStatus('CR').state, 'unconfigured');
  assert.equal(store.countryStatus('CL').state, 'unconfigured');
  assert.equal(store.countryStatus('DO').state, 'unconfigured');
  assert.equal(store.countryStatus('HT').state, 'unconfigured');
  assert.equal(store.countryStatus('PA').state, 'unconfigured');
  assert.equal(store.countryStatus('BB').state, 'unconfigured');
  assert.equal(store.countryStatus('NI').state, 'unconfigured');
  assert.equal(store.countryStatus('BR').state, 'unconfigured');
  assert.equal(store.countryStatus('VE').state, 'unconfigured');
  assert.equal(store.countryStatus('PE').state, 'unconfigured');
  assert.equal(store.countryStatus('CO').state, 'unconfigured');
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
  assert.equal(store.countryStatus('ME').state, 'unconfigured');
  assert.equal(store.countryStatus('RO').state, 'unconfigured');
  assert.equal(store.countryStatus('TW').state, 'unconfigured');
  assert.equal(store.countryStatus('KR').state, 'unconfigured');
  assert.equal(store.countryStatus('SA').state, 'unconfigured');
  assert.equal(store.countryStatus('OM').state, 'unconfigured');
  assert.equal(store.countryStatus('ZA').state, 'unconfigured');
  assert.equal(store.countryStatus('EG').state, 'unconfigured');
  assert.equal(store.countryStatus('MA').state, 'unconfigured');
  assert.equal(store.countryStatus('IN').state, 'unconfigured');
  assert.equal(store.countryStatus('BT').state, 'unconfigured');
  assert.equal(store.countryStatus('ID').state, 'unconfigured');
  assert.equal(store.countryStatus('BN').state, 'unconfigured');
  assert.equal(store.countryStatus('VN').state, 'unconfigured');
  assert.equal(store.countryStatus('MY').state, 'unconfigured');
  assert.equal(store.countryStatus('MM').state, 'unconfigured');
  assert.equal(store.countryStatus('MV').state, 'unconfigured');
  assert.equal(store.countryStatus('MN').state, 'unconfigured');
  assert.equal(store.countryStatus('JO').state, 'unconfigured');
  assert.equal(store.countryStatus('LA').state, 'unconfigured');
  assert.equal(store.countryStatus('LB').state, 'unconfigured');
  assert.equal(store.countryStatus('AF').state, 'unconfigured');
  assert.equal(store.countryStatus('IL').state, 'unconfigured');
  assert.equal(store.countryStatus('KW').state, 'unconfigured');
  assert.equal(store.countryStatus('BH').state, 'unconfigured');
});

test('in-memory store can route independent supported-country runtimes', () => {
  const japan = new PostalContextPackRuntime(createPostalContextRuntimeTestPack());
  const singapore = new PostalContextPackRuntime(createSingaporePostalContextRuntimeTestPack());
  const unitedStates = new PostalContextPackRuntime(createUnitedStatesPostalContextRuntimeTestPack());
  const canada = new PostalContextPackRuntime(createCanadaPostalContextRuntimeTestPack());
  const mexico = new PostalContextPackRuntime(createMexicoPostalContextRuntimeTestPack());
  const cuba = new PostalContextPackRuntime(createCubaPostalContextRuntimeTestPack());
  const argentina = new PostalContextPackRuntime(createArgentinaPostalContextRuntimeTestPack());
  const uruguay = new PostalContextPackRuntime(createUruguayPostalContextRuntimeTestPack());
  const ecuador = new PostalContextPackRuntime(createEcuadorPostalContextRuntimeTestPack());
  const elSalvador = new PostalContextPackRuntime(createElSalvadorPostalContextRuntimeTestPack());
  const guatemala = new PostalContextPackRuntime(createGuatemalaPostalContextRuntimeTestPack());
  const costaRica = new PostalContextPackRuntime(createCostaRicaPostalContextRuntimeTestPack());
  const chile = new PostalContextPackRuntime(createChilePostalContextRuntimeTestPack());
  const dominicanRepublic = new PostalContextPackRuntime(createDominicanRepublicPostalContextRuntimeTestPack());
  const haiti = new PostalContextPackRuntime(createHaitiPostalContextRuntimeTestPack());
  const panama = new PostalContextPackRuntime(createPanamaPostalContextRuntimeTestPack());
  const barbados = new PostalContextPackRuntime(createBarbadosPostalContextRuntimeTestPack());
  const nicaragua = new PostalContextPackRuntime(createNicaraguaPostalContextRuntimeTestPack());
  const brazil = new PostalContextPackRuntime(createBrazilPostalContextRuntimeTestPack());
  const venezuela = new PostalContextPackRuntime(createVenezuelaPostalContextRuntimeTestPack());
  const peru = new PostalContextPackRuntime(createPeruPostalContextRuntimeTestPack());
  const colombia = new PostalContextPackRuntime(createColombiaPostalContextRuntimeTestPack());
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
  const montenegro = new PostalContextPackRuntime(createMontenegroPostalContextRuntimeTestPack());
  const romania = new PostalContextPackRuntime(createRomaniaPostalContextRuntimeTestPack());
  const taiwan = new PostalContextPackRuntime(createTaiwanPostalContextRuntimeTestPack());
  const korea = new PostalContextPackRuntime(createKoreaPostalContextRuntimeTestPack());
  const saudiArabia = new PostalContextPackRuntime(createSaudiArabiaPostalContextRuntimeTestPack());
  const oman = new PostalContextPackRuntime(createOmanPostalContextRuntimeTestPack());
  const southAfrica = new PostalContextPackRuntime(createSouthAfricaPostalContextRuntimeTestPack());
  const egypt = new PostalContextPackRuntime(createEgyptPostalContextRuntimeTestPack());
  const morocco = new PostalContextPackRuntime(createMoroccoPostalContextRuntimeTestPack());
  const algeria = new PostalContextPackRuntime(createAlgeriaPostalContextRuntimeTestPack());
  const ethiopia = new PostalContextPackRuntime(createEthiopiaPostalContextRuntimeTestPack());
  const caboVerde = new PostalContextPackRuntime(createCaboVerdePostalContextRuntimeTestPack());
  const kenya = new PostalContextPackRuntime(createKenyaPostalContextRuntimeTestPack());
  const zambia = new PostalContextPackRuntime(createZambiaPostalContextRuntimeTestPack());
  const senegal = new PostalContextPackRuntime(createSenegalPostalContextRuntimeTestPack());
  const seychelles = new PostalContextPackRuntime(createSeychellesPostalContextRuntimeTestPack());
  const somalia = new PostalContextPackRuntime(createSomaliaPostalContextRuntimeTestPack());
  const tanzania = new PostalContextPackRuntime(createTanzaniaPostalContextRuntimeTestPack());
  const tunisia = new PostalContextPackRuntime(createTunisiaPostalContextRuntimeTestPack());
  const nigeria = new PostalContextPackRuntime(createNigeriaPostalContextRuntimeTestPack());
  const namibia = new PostalContextPackRuntime(createNamibiaPostalContextRuntimeTestPack());
  const niger = new PostalContextPackRuntime(createNigerPostalContextRuntimeTestPack());
  const madagascar = new PostalContextPackRuntime(createMadagascarPostalContextRuntimeTestPack());
  const mauritius = new PostalContextPackRuntime(createMauritiusPostalContextRuntimeTestPack());
  const mozambique = new PostalContextPackRuntime(createMozambiquePostalContextRuntimeTestPack());
  const liberia = new PostalContextPackRuntime(createLiberiaPostalContextRuntimeTestPack());
  const india = new PostalContextPackRuntime(createIndiaPostalContextRuntimeTestPack());
  const pakistan = new PostalContextPackRuntime(createPakistanPostalContextRuntimeTestPack());
  const bangladesh = new PostalContextPackRuntime(createBangladeshPostalContextRuntimeTestPack());
  const bhutan = new PostalContextPackRuntime(createBhutanPostalContextRuntimeTestPack());
  const indonesia = new PostalContextPackRuntime(createIndonesiaPostalContextRuntimeTestPack());
  const philippines = new PostalContextPackRuntime(createPhilippinesPostalContextRuntimeTestPack());
  const brunei = new PostalContextPackRuntime(createBruneiPostalContextRuntimeTestPack());
  const vietnam = new PostalContextPackRuntime(createVietnamPostalContextRuntimeTestPack());
  const malaysia = new PostalContextPackRuntime(createMalaysiaPostalContextRuntimeTestPack());
  const myanmar = new PostalContextPackRuntime(createMyanmarPostalContextRuntimeTestPack());
  const maldives = new PostalContextPackRuntime(createMaldivesPostalContextRuntimeTestPack());
  const mongolia = new PostalContextPackRuntime(createMongoliaPostalContextRuntimeTestPack());
  const jordan = new PostalContextPackRuntime(createJordanPostalContextRuntimeTestPack());
  const laos = new PostalContextPackRuntime(createLaosPostalContextRuntimeTestPack());
  const lebanon = new PostalContextPackRuntime(createLebanonPostalContextRuntimeTestPack());
  const afghanistan = new PostalContextPackRuntime(createAfghanistanPostalContextRuntimeTestPack());
  const israel = new PostalContextPackRuntime(createIsraelPostalContextRuntimeTestPack());
  const iraq = new PostalContextPackRuntime(createIraqPostalContextRuntimeTestPack());
  const iran = new PostalContextPackRuntime(createIranPostalContextRuntimeTestPack());
  const uzbekistan = new PostalContextPackRuntime(createUzbekistanPostalContextRuntimeTestPack());
  const kazakhstan = new PostalContextPackRuntime(createKazakhstanPostalContextRuntimeTestPack());
  const china = new PostalContextPackRuntime(createChinaPostalContextRuntimeTestPack());
  const cambodia = new PostalContextPackRuntime(createCambodiaPostalContextRuntimeTestPack());
  const kyrgyzstan = new PostalContextPackRuntime(createKyrgyzstanPostalContextRuntimeTestPack());
  const kuwait = new PostalContextPackRuntime(createKuwaitPostalContextRuntimeTestPack());
  const bahrain = new PostalContextPackRuntime(createBahrainPostalContextRuntimeTestPack());
  const store = createInMemoryPostalContextPackStore([japan, unitedStates, canada, mexico, cuba, argentina, uruguay, ecuador, elSalvador, guatemala, costaRica, chile, dominicanRepublic, haiti, panama, barbados, nicaragua, brazil, venezuela, peru, colombia, singapore, netherlands, unitedKingdom, france, newZealand, iceland, italy, estonia, switzerland, germany, czechia, slovakia, slovenia, norway, hungary, finland, bulgaria, belarus, belgium, montenegro, romania, taiwan, korea, saudiArabia, oman, southAfrica, egypt, morocco, algeria, ethiopia, caboVerde, kenya, zambia, senegal, seychelles, somalia, tanzania, tunisia, nigeria, namibia, niger, madagascar, mauritius, mozambique, liberia, india, pakistan, bangladesh, bhutan, indonesia, philippines, brunei, vietnam, malaysia, myanmar, maldives, mongolia, jordan, laos, lebanon, afghanistan, israel, iraq, iran, uzbekistan, kazakhstan, china, cambodia, kyrgyzstan, kuwait, bahrain, denmark, malta, monaco, australia, latvia, lithuania, liechtenstein, azerbaijan, albania, armenia, andorra, ukraine, austria, cyprus, greece, croatia, serbia, georgia]);

  assert.equal(store.getRuntime('jp'), japan);
  assert.equal(store.getRuntime('us'), unitedStates);
  assert.equal(store.getRuntime('ca'), canada);
  assert.equal(store.getRuntime('mx'), mexico);
  assert.equal(store.getRuntime('cu'), cuba);
  assert.equal(store.getRuntime('ar'), argentina);
  assert.equal(store.getRuntime('uy'), uruguay);
  assert.equal(store.getRuntime('ec'), ecuador);
  assert.equal(store.getRuntime('sv'), elSalvador);
  assert.equal(store.getRuntime('gt'), guatemala);
  assert.equal(store.getRuntime('cr'), costaRica);
  assert.equal(store.getRuntime('ht'), haiti);
  assert.equal(store.getRuntime('pa'), panama);
  assert.equal(store.getRuntime('bb'), barbados);
  assert.equal(store.getRuntime('ni'), nicaragua);
  assert.equal(store.getRuntime('br'), brazil);
  assert.equal(store.getRuntime('ve'), venezuela);
  assert.equal(store.getRuntime('pe'), peru);
  assert.equal(store.getRuntime('co'), colombia);
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
  assert.equal(store.getRuntime('me'), montenegro);
  assert.equal(store.getRuntime('ro'), romania);
  assert.equal(store.getRuntime('tw'), taiwan);
  assert.equal(store.getRuntime('kr'), korea);
  assert.equal(store.getRuntime('sa'), saudiArabia);
  assert.equal(store.getRuntime('om'), oman);
  assert.equal(store.getRuntime('za'), southAfrica);
  assert.equal(store.getRuntime('eg'), egypt);
  assert.equal(store.getRuntime('ma'), morocco);
  assert.equal(store.getRuntime('dz'), algeria);
  assert.equal(store.getRuntime('et'), ethiopia);
  assert.equal(store.getRuntime('cv'), caboVerde);
  assert.equal(store.getRuntime('ke'), kenya);
  assert.equal(store.getRuntime('zm'), zambia);
  assert.equal(store.getRuntime('sn'), senegal);
  assert.equal(store.getRuntime('sc'), seychelles);
  assert.equal(store.getRuntime('so'), somalia);
  assert.equal(store.getRuntime('tz'), tanzania);
  assert.equal(store.getRuntime('tn'), tunisia);
  assert.equal(store.getRuntime('ng'), nigeria);
  assert.equal(store.getRuntime('na'), namibia);
  assert.equal(store.getRuntime('ne'), niger);
  assert.equal(store.getRuntime('mg'), madagascar);
  assert.equal(store.getRuntime('mu'), mauritius);
  assert.equal(store.getRuntime('mz'), mozambique);
  assert.equal(store.getRuntime('lr'), liberia);
  assert.equal(store.getRuntime('in'), india);
  assert.equal(store.getRuntime('pk'), pakistan);
  assert.equal(store.getRuntime('bd'), bangladesh);
  assert.equal(store.getRuntime('bt'), bhutan);
  assert.equal(store.getRuntime('id'), indonesia);
  assert.equal(store.getRuntime('ph'), philippines);
  assert.equal(store.getRuntime('bn'), brunei);
  assert.equal(store.getRuntime('vn'), vietnam);
  assert.equal(store.getRuntime('my'), malaysia);
  assert.equal(store.getRuntime('mm'), myanmar);
  assert.equal(store.getRuntime('mv'), maldives);
  assert.equal(store.getRuntime('mn'), mongolia);
  assert.equal(store.getRuntime('jo'), jordan);
  assert.equal(store.getRuntime('la'), laos);
  assert.equal(store.getRuntime('lb'), lebanon);
  assert.equal(store.getRuntime('af'), afghanistan);
  assert.equal(store.getRuntime('il'), israel);
  assert.equal(store.getRuntime('iq'), iraq);
  assert.equal(store.getRuntime('ir'), iran);
  assert.equal(store.getRuntime('uz'), uzbekistan);
  assert.equal(store.getRuntime('kz'), kazakhstan);
  assert.equal(store.getRuntime('cn'), china);
  assert.equal(store.getRuntime('kh'), cambodia);
  assert.equal(store.getRuntime('kg'), kyrgyzstan);
  assert.equal(store.getRuntime('kw'), kuwait);
  assert.equal(store.getRuntime('bh'), bahrain);
  assert.deepEqual(store.statuses().filter(status => status.countryCode !== 'SC').map(status => status.countryCode), ['JP', 'US', 'CA', 'MX', 'CU', 'AR', 'UY', 'EC', 'SV', 'GT', 'CR', 'CL', 'DO', 'HT', 'PA', 'BB', 'NI', 'BR', 'VE', 'PE', 'CO', 'SG', 'NL', 'GB', 'FR', 'NZ', 'IS', 'IT', 'EE', 'CH', 'DE', 'CZ', 'SK', 'SI', 'NO', 'HU', 'FI', 'BG', 'BY', 'BE', 'ME', 'RO', 'TW', 'KR', 'SA', 'OM', 'ZA', 'EG', 'MA', 'DZ', 'ET', 'CV', 'KE', 'ZM', 'SN', 'SO', 'TZ', 'TN', 'NG', 'NA', 'NE', 'MG', 'MU', 'MZ', 'LR', 'IN', 'PK', 'BD', 'BT', 'ID', 'PH', 'BN', 'VN', 'MY', 'MM', 'MV', 'MN', 'JO', 'LA', 'LB', 'AF', 'IL', 'IQ', 'IR', 'UZ', 'KZ', 'CN', 'KH', 'KG', 'KW', 'BH', 'DK', 'MT', 'MC', 'AU', 'LV', 'LT', 'LI', 'AZ', 'AL', 'AM', 'AD', 'UA', 'AT', 'CY', 'GR', 'HR', 'RS', 'GE']);
  assert.throws(
    () => createInMemoryPostalContextPackStore([singapore, singapore]),
    /duplicate-postal-context-runtime:SG/,
  );
});
