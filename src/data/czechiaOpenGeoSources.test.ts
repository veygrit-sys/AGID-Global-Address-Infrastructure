import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Czechia registry separates operator, RÚIAN address, building, and admin evidence', () => {
  const ids = getEuropeOpenSourceIds('CZ');
  const search = EUROPE_OPEN_GEO_SOURCES['ceska-posta-psc'];
  const outputs = EUROPE_OPEN_GEO_SOURCES['ceska-posta-customer-outputs'];
  const ruian = EUROPE_OPEN_GEO_SOURCES['cuzk-ruian'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['cuzk-ruian-addresses'];
  const vfr = EUROPE_OPEN_GEO_SOURCES['cuzk-ruian-vfr'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['cuzk-inspire-buildings'];
  const boundaries = EUROPE_OPEN_GEO_SOURCES['cuzk-ruian-boundaries'];

  for (const id of [search.id, outputs.id, ruian.id, addresses.id, vfr.id, buildings.id, boundaries.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(search.url, 'https://www.postaonline.cz/vyhledat-psc');
  assert.match(search.notes, /not.*polygon/i);
  assert.equal(outputs.kind, 'postal-code');
  assert.match(outputs.notes, /assignment.*not polygon/i);
  assert.equal(ruian.kind, 'address');
  assert.match(ruian.notes, /informational.*reference/i);
  assert.equal(addresses.kind, 'address');
  assert.match(addresses.notes, /definition points.*not building footprints/i);
  assert.equal(vfr.kind, 'building');
  assert.match(vfr.notes, /explicit.*identifier/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /proximity.*candidate/i);
  assert.equal(boundaries.kind, 'admin-boundary');
  assert.match(boundaries.notes, /never postal geometry/i);
});

test('Czechia official catalog exposes operator, address, building, and administrative sources', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('CZ').map(source => [source.id, source]));

  assert.equal(sources.get('ceska-posta-psc')?.authority, 'postal-operator');
  assert.equal(sources.get('ceska-posta-customer-outputs')?.depth, 'address');
  assert.equal(sources.get('cuzk-ruian')?.depth, 'address');
  assert.equal(sources.get('cuzk-ruian-addresses')?.depth, 'address');
  assert.equal(sources.get('cuzk-ruian-vfr')?.depth, 'building');
  assert.equal(sources.get('cuzk-inspire-buildings')?.depth, 'building');
  assert.equal(sources.get('cuzk-ruian-boundaries')?.depth, 'geo-only');
});

test('Czechia address metadata points to official and evidence-separated sources', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/central_europe/CZ.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    addressRules: { regionalHierarchy: string[] };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.api, 'https://www.postaonline.cz/vyhledat-psc');
  assert.match(profile.postalCode.source, /Česká pošta.*RÚIAN.*derived/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['region', 'district', 'municipality']);
  assert.ok(profile.openSourceIds.includes('ceska-posta-customer-outputs'));
  assert.ok(profile.openSourceIds.includes('cuzk-ruian-addresses'));
  assert.ok(profile.openSourceIds.includes('cuzk-ruian-vfr'));
  assert.ok(profile.openSourceIds.includes('cuzk-inspire-buildings'));
  assert.ok(profile.openSourceIds.includes('cuzk-ruian-boundaries'));
});
