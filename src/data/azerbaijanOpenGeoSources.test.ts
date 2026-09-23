import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Azerbaijan registry separates postal, address-register, cadastral, and catalog evidence', () => {
  const ids = getAsiaOpenSourceIds('AZ');
  const postal = ASIA_OPEN_GEO_SOURCES['azerpost-address-reference'];
  const address = ASIA_OPEN_GEO_SOURCES['azerbaijan-address-register'];
  const cadastre = ASIA_OPEN_GEO_SOURCES['azerbaijan-state-committee-property'];
  const catalog = ASIA_OPEN_GEO_SOURCES['azerbaijan-open-data'];

  for (const id of [postal.id, address.id, cadastre.id, catalog.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /assignment.*not.*polygon/i);
  assert.equal(address.kind, 'address');
  assert.match(address.notes, /object identifier.*not.*bulk/i);
  assert.equal(cadastre.kind, 'admin-boundary');
  assert.match(cadastre.notes, /building.*explicit.*identifier/i);
  assert.equal(catalog.usage, 'validation');
  assert.match(catalog.notes, /license.*dataset-by-dataset/i);
});

test('Azerbaijan official catalog exposes distinct national source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('AZ').map(source => [source.id, source]));

  assert.equal(sources.get('azerpost-address-reference')?.authority, 'postal-operator');
  assert.equal(sources.get('azerpost-address-reference')?.depth, 'postcode');
  assert.equal(sources.get('azerbaijan-address-register')?.authority, 'government');
  assert.equal(sources.get('azerbaijan-address-register')?.depth, 'address');
  assert.equal(sources.get('azerbaijan-state-committee-property')?.depth, 'building');
  assert.equal(sources.get('azerbaijan-open-data')?.validationReadiness, 'metadata-only');
});

test('Azerbaijan address metadata uses official sources and a source-qualified hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/asia/caucasus/AZ.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'AZNNNN');
  assert.equal(profile.postalCode.regex, '^AZ\\d{4}$');
  assert.match(profile.postalCode.api, /azerpost\.az/);
  assert.match(profile.postalCode.source, /Azərpoçt.*Address Register.*cadastre/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['regionOrAutonomousRepublic', 'districtOrCity', 'locality', 'street', 'premise']);
  assert.match(profile.addressRules.postalCode.label, /AZNNNN.*allocation requires source evidence/i);
  for (const id of [
    'azerpost-address-reference',
    'azerbaijan-address-register',
    'azerbaijan-state-committee-property',
    'azerbaijan-open-data',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
  assert.equal(profile.openSourceIds.includes('geonames-azerbaijan'), true);
});
