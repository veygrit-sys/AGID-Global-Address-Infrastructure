import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ['iran-post', 'iran-post-gnaf', 'gavahi-post-ir', 'upu-iran-addressing-2023', 'iran-nsdi', 'iran-open-data', 'osm-iran'] as const;

test('Iran registry separates operator, GNAF, format, government, independent, and community evidence', () => {
  const ids = getAsiaOpenSourceIds('IR');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id));
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(ASIA_OPEN_GEO_SOURCES['iran-post'].notes, /Official operator.*ten-digit.*No public.*bulk.*polygon.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['iran-post-gnaf'].notes, /standard-address.*geocoding.*not open bulk.*privacy/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-iran-addressing-2023'].notes, /10\/2023.*ten digits.*forwarding-code.*P\.O\. Box.*poste restante.*not current/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['iran-nsdi'].notes, /administrative.*exact layer.*jurisdiction.*not postal geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['iran-open-data'].notes, /Independent.*not Iran Post.*item.*licence/i);
});

test('Iran catalog exposes authority, operational, format, rights, privacy, and jurisdiction boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('IR').map(source => [source.id, source]));
  for (const id of EXPECTED.filter(id => id !== 'osm-iran')) assert.ok(sources.has(id));
  assert.equal(sources.get('iran-post')?.trustTier, 'authoritative');
  assert.equal(sources.get('iran-post-gnaf')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('gavahi-post-ir')?.availability, 'web-search');
  assert.equal(sources.get('upu-iran-addressing-2023')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('iran-nsdi')?.depth, 'geo-only');
  assert.equal(sources.get('iran-open-data')?.trustTier, 'community');
  const classification = classifyPostalSourceTrust({ countryCode: 'IR', source: 'Iran Post' });
  assert.equal(classification.strength, 'weak');
  assert.equal(classification.tier, 'weak');
  assert.equal(sources.get('iran-post')?.validationReadiness, 'metadata-only');
});

test('Iran address metadata encodes ten digits, P.O. exceptions, GNAF, buildings, time, jurisdiction, and AGID', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const value = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/middle_east/IR.json'), 'utf8')) as any;
  assert.equal(value.postalCode.format, 'NNNNNNNNNN');
  assert.equal(value.postalCode.regex, '^\\d{10}$');
  assert.match(value.postalCode.api, /gnaf\.post\.ir/i);
  assert.match(value.postalCode.source, /Iran Post GNAF.*certificate.*UPU.*10\/2023.*NSDI.*Open Data.*OpenStreetMap/i);
  assert.equal(value.addressRules.postalCode.required, false);
  assert.match(value.addressRules.postalCode.usage, /ten-digit.*place identifier.*P\.O\. Box.*poste restante.*not.*polygon.*GNAF.*building relation.*territorial scope/i);
  assert.equal(value.native.fields.some((item: any) => item.key === 'poBox'), true);
  assert.equal(value.english.fields.some((item: any) => item.key === 'posteRestante'), true);
  assert.equal(value.native.fields.some((item: any) => item.key === 'building'), true);
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
