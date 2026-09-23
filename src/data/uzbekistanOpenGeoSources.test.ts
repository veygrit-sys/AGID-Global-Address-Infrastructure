import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ['pochta-uz', 'uzpost-index-map', 'upu-uzbekistan-addressing-2019', 'uzbekistan-postal-index-open-data-2019', 'uzbekistan-open-data-terms', 'uzbekistan-open-data-registry-2026', 'uzbekistan-cadastre-agency', 'uzbekistan-state-real-estate-register', 'osm-uzbekistan'] as const;

test('Uzbekistan registry separates operator, lookup, format, dated open data, rights, cadastre, property, and community evidence', () => {
  const ids = getAsiaOpenSourceIds('UZ');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id));
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(ASIA_OPEN_GEO_SOURCES['pochta-uz'].notes, /Official operator.*No public.*bulk.*polygon.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['uzpost-index-map'].notes, /address and index search.*office.*not.*harvest.*polygon/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-uzbekistan-addressing-2019'].notes, /07\/2019.*six digits.*delivery.?post.?office.*Tashkent.*not current/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['uzbekistan-postal-index-open-data-2019'].notes, /branch.*post.?office.*2019.*no geometry.*current.*validation/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['uzbekistan-open-data-terms'].notes, /reus.*commercial.*no distortion.*attribution/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['uzbekistan-open-data-registry-2026'].notes, /Zip Code Addresses.*catalog.*not.*assignment/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['uzbekistan-cadastre-agency'].notes, /cadastral.*exact resource.*not postal geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['uzbekistan-state-real-estate-register'].notes, /rights holders.*personal.*not.*open address/i);
});

test('Uzbekistan catalog exposes authority, operational, dated open-data, rights, privacy, and jurisdiction boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('UZ').map(source => [source.id, source]));
  for (const id of EXPECTED.filter(id => id !== 'osm-uzbekistan')) assert.ok(sources.has(id));
  assert.equal(sources.get('pochta-uz')?.trustTier, 'authoritative');
  assert.equal(sources.get('uzpost-index-map')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('upu-uzbekistan-addressing-2019')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('uzbekistan-postal-index-open-data-2019')?.availability, 'bulk-open-data');
  assert.equal(sources.get('uzbekistan-open-data-terms')?.depth, 'legal-framework');
  assert.equal(sources.get('uzbekistan-cadastre-agency')?.depth, 'geo-only');
  assert.equal(sources.get('uzbekistan-state-real-estate-register')?.sourceRole, 'legal-framework-only');
  const classification = classifyPostalSourceTrust({ countryCode: 'UZ', source: 'UzPost' });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Uzbekistan address metadata encodes delivery indices, office context, buildings, time, jurisdiction, privacy, and AGID', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const value = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/central_asia/UZ.json'), 'utf8')) as any;
  assert.equal(value.postalCode.format, 'NNNNNN');
  assert.equal(value.postalCode.regex, '^\\d{6}$');
  assert.match(value.postalCode.api, /uz\.post\/map/i);
  assert.match(value.postalCode.source, /UzPost.*UPU.*07\/2019.*2019.*reuse terms.*2026.*Cadastre.*real-estate.*OpenStreetMap/i);
  assert.equal(value.addressRules.postalCode.required, true);
  assert.match(value.addressRules.postalCode.usage, /six-digit.*delivery.*post.?office.*not.*polygon.*2019.*current.*building relation.*territorial scope/i);
  assert.equal(value.native.fields.some((item: any) => item.key === 'postOffice'), true);
  assert.equal(value.english.fields.some((item: any) => item.key === 'building'), true);
  assert.equal(value.native.fields.some((item: any) => item.key === 'poBox'), true);
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
