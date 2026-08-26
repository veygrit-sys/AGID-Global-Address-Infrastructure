import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ['post-kz', 'qazpost-open-api', 'upu-kazakhstan-addressing-2025', 'kazakhstan-postal-index-rules-2026', 'kazakhstan-post-law', 'kazakhstan-addressing-rules-2026', 'kazakhstan-address-register', 'kazakhstan-nsdi', 'kazakhstan-nsdi-use-rules-2023', 'kazakhstan-public-cadastral-map', 'kazakhstan-real-estate-rights-register', 'osm-kazakhstan'] as const;
const OFFICIAL = EXPECTED.filter(id => id !== 'osm-kazakhstan');

test('Kazakhstan registry separates operator, API, dual format, RKA, NSDI, cadastre, rights, and community evidence', () => {
  const ids = getAsiaOpenSourceIds('KZ');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id));
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.equal(ids.includes('datahub-postal-kz'), false);
  assert.match(ASIA_OPEN_GEO_SOURCES['post-kz'].notes, /Official.*operator.*No public.*bulk.*polygon.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['qazpost-open-api'].notes, /Bearer.*address.*RKA.*not.*bulk.*geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-kazakhstan-addressing-2025'].notes, /07.*2025.*seven.*six.*transition.*not.*assignment/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['kazakhstan-postal-index-rules-2026'].notes, /first Latin.*address block.*real-estate[- ]object.*not.*geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['kazakhstan-address-register'].notes, /separate.*16-digit RKA.*not.*open/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['kazakhstan-nsdi'].notes, /search.*view.*download.*exact dataset.*not postal/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['kazakhstan-nsdi-use-rules-2023'].notes, /without charge.*exact dataset.*not.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['kazakhstan-public-cadastral-map'].notes, /parcel.*not postal.*building relation/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['kazakhstan-real-estate-rights-register'].notes, /rights holders.*personal.*not.*open address/i);
});

test('Kazakhstan catalog exposes assignment, operational, legal, spatial, privacy, and jurisdiction boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('KZ').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id));
  assert.equal(sources.get('post-kz')?.trustTier, 'authoritative');
  assert.equal(sources.get('qazpost-open-api')?.requiresCredential, true);
  assert.equal(sources.get('upu-kazakhstan-addressing-2025')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('kazakhstan-postal-index-rules-2026')?.depth, 'legal-framework');
  assert.equal(sources.get('kazakhstan-address-register')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('kazakhstan-nsdi')?.depth, 'geo-only');
  assert.equal(sources.get('kazakhstan-real-estate-rights-register')?.sourceRole, 'legal-framework-only');
  const classification = classifyPostalSourceTrust({ countryCode: 'KZ', source: 'QazPost' });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Kazakhstan address metadata encodes dual codes, RKA, buildings, time, jurisdiction, privacy, and AGID', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const value = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/central_asia/KZ.json'), 'utf8')) as any;
  assert.equal(value.postalCode.format, 'LNNLNLN or NNNNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('X99X9X9'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('999999'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('X99-X9X9'), false);
  assert.match(value.postalCode.api, /open\.post\.kz.*26/i);
  assert.match(value.postalCode.source, /Kazpost.*UPU.*07.*2025.*2026.*Address Register.*RKA.*NSDI.*cadast.*OpenStreetMap/i);
  assert.equal(value.addressRules.postalCode.required, true);
  assert.match(value.addressRules.postalCode.usage, /coexisting.*seven alphanumeric.*real-estate object.*legacy six-digit.*phased out.*not.*polygon.*RKA.*16-digit.*AGID/i);
  for (const key of ['building', 'street', 'houseNumber', 'corpus', 'unit', 'postOffice', 'poBox']) {
    assert.ok(value.native.fields.some((item: any) => item.key === key));
  }
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
