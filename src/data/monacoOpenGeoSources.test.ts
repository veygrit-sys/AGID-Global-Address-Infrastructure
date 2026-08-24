import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Monaco registry separates operator, DPUM address, building, planning, and district evidence', () => {
  const ids = getEuropeOpenSourceIds('MC');
  const postal = EUROPE_OPEN_GEO_SOURCES['la-poste-official-postal-codes-monaco'];
  const operator = EUROPE_OPEN_GEO_SOURCES['la-poste-monaco-addressing'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['monaco-dpum-address-base'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['monaco-dpum-building-topography'];
  const plans = EUROPE_OPEN_GEO_SOURCES['monaco-gouv-cartography'];
  const statistics = EUROPE_OPEN_GEO_SOURCES['monaco-imsee-geodata'];

  for (const id of [postal.id, operator.id, addresses.id, buildings.id, plans.id, statistics.id]) {
    assert.ok(ids.includes(id));
  }

  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /Monaco.*contours.*not.*provided/i);
  assert.equal(operator.kind, 'postal-code');
  assert.match(operator.notes, /CEDEX.*not.*complete allocation/i);
  assert.equal(addresses.kind, 'address');
  assert.match(addresses.notes, /internal.*requires.*licensed extract/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /internal.*not.*public.*dataset/i);
  assert.equal(plans.kind, 'admin-boundary');
  assert.match(plans.notes, /regulatory.*not.*postal or building/i);
  assert.equal(statistics.kind, 'admin-boundary');
  assert.match(statistics.notes, /statistical.*not.*postal/i);
  assert.equal(ids.includes('eu-postal-code-package'), false);
});

test('Monaco official catalog exposes postal, address, building, and administrative sources', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('MC').map(source => [source.id, source]));

  assert.equal(sources.get('la-poste-official-postal-codes-monaco')?.authority, 'postal-operator');
  assert.equal(sources.get('la-poste-monaco-addressing')?.depth, 'postcode');
  assert.equal(sources.get('monaco-dpum-address-base')?.depth, 'address');
  assert.equal(sources.get('monaco-dpum-address-base')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('monaco-dpum-building-topography')?.depth, 'building');
  assert.equal(sources.get('monaco-dpum-building-topography')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('monaco-dpum-urban-plans')?.depth, 'geo-only');
  assert.equal(sources.get('monaco-imsee-territory')?.depth, 'geo-only');
});

test('Monaco address metadata points to official and evidence-separated sources', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/western_europe/MC.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.api, 'https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux');
  assert.match(profile.postalCode.source, /La Poste.*DPUM.*IMSEE/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['quartier']);
  assert.match(profile.addressRules.postalCode.label, /98000.*CEDEX.*allocation/i);
  assert.ok(profile.openSourceIds.includes('la-poste-official-postal-codes-monaco'));
  assert.ok(profile.openSourceIds.includes('la-poste-monaco-addressing'));
  assert.ok(profile.openSourceIds.includes('monaco-dpum-address-base'));
  assert.ok(profile.openSourceIds.includes('monaco-dpum-building-topography'));
  assert.ok(profile.openSourceIds.includes('monaco-gouv-cartography'));
  assert.ok(profile.openSourceIds.includes('monaco-imsee-geodata'));
});
