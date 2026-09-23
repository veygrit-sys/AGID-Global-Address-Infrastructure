import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Greece registry separates ELTA, GISCO, ELSTAT, Cadastre, and planned-register evidence', () => {
  const ids = getEuropeOpenSourceIds('GR');
  const postal = EUROPE_OPEN_GEO_SOURCES['elta-gr'];
  const point = EUROPE_OPEN_GEO_SOURCES['gisco-greece-postcode-points'];
  const cartography = EUROPE_OPEN_GEO_SOURCES['elstat-greece-digital-cartography'];
  const cadastre = EUROPE_OPEN_GEO_SOURCES['ktimatologio-greece'];
  const registerPlan = EUROPE_OPEN_GEO_SOURCES['greece-national-streets-numbers-plan'];

  for (const id of [postal.id, point.id, cartography.id, cadastre.id, registerPlan.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /five-digit.*not.*polygon.*delivery/i);
  assert.equal(point.kind, 'postal-code');
  assert.equal(point.license, 'CC BY-SA 4.0');
  assert.match(point.notes, /omit.*mislocate.*Voronoi.*never.*ELTA perimeter/i);
  assert.equal(cartography.kind, 'building');
  assert.match(cartography.notes, /census-vintage.*request.*not.*address identity.*postal assignment/i);
  assert.equal(cadastre.kind, 'admin-boundary');
  assert.match(cadastre.notes, /layer.*licence.*parcel.*owner.*postcode membership/i);
  assert.equal(registerPlan.kind, 'standard');
  assert.match(registerPlan.notes, /project description.*not a live national address dataset/i);
});

test('Greece official catalog exposes distinct source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('GR').map(source => [source.id, source]));

  assert.equal(sources.get('elta-gr')?.authority, 'postal-operator');
  assert.equal(sources.get('elta-gr')?.availability, 'web-search');
  assert.equal(sources.get('gisco-greece-postcode-points')?.trustTier, 'official-derived');
  assert.equal(sources.get('ktimatologio-greece')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('elstat-greece-digital-cartography')?.depth, 'building');
  assert.equal(sources.get('greece-national-streets-numbers-plan')?.sourceRole, 'legal-framework-only');
});

test('Greece address metadata uses the ELTA finder and a building-capable hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/southern_europe/GR.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'NNN NN');
  assert.equal(profile.postalCode.regex, '^\\d{3}\\s?\\d{2}$');
  assert.equal(profile.postalCode.api, 'https://postalcodes.elta.gr/en/');
  assert.match(profile.postalCode.source, /ELTA.*GISCO.*Cadastre.*ELSTAT/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, [
    'region',
    'regionalUnit',
    'municipality',
    'municipalUnitOrCommunity',
    'settlementOrIsland',
    'street',
    'houseNumber',
    'building',
    'unit',
  ]);
  assert.match(profile.addressRules.postalCode.label, /5 digits.*NNN NN.*assignment.*point.*area.*building.*separate/i);
  for (const id of [
    'elta-gr',
    'gisco-greece-postcode-points',
    'elstat-greece-digital-cartography',
    'greece-national-streets-numbers-plan',
    'ktimatologio-greece',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
});
