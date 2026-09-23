import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'correos-cuba-postal',
  'upu-cuba-addressing-2004',
  'upu-cuba-postcode-data',
  'mincom-cuba-postal-law',
  'iderc-cuba-geoportal',
  'onei-cuba-dpa',
  'geocuba-cartography',
  'osm-cuba',
] as const;
const CATALOG = EXPECTED.filter(id => id !== 'osm-cuba');

test('Cuba registry separates operator, UPU, law, spatial, statistical, cartographic, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('CU');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id));
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correos-cuba-postal'].notes, /designated operator.*not reusable.*assignments.*polygons/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-cuba-addressing-2004'].notes, /five digits.*CP.*postal-zone.*s\/n.*does not provide current assignments/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-cuba-postcode-data'].notes, /licensed.*validate.*contract.*not postal geometry/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['iderc-cuba-geoportal'].notes, /OGC.*producer.*CRS.*reuse terms.*not postal assignment/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['onei-cuba-dpa'].notes, /province.*municipality.*statistical.*not a Correos postal assignment/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['geocuba-cartography'].notes, /product.*contract.*not.*open licence.*exact address-building/i);
});

test('Cuba catalog keeps the operator above dated, licensed, legal, spatial, statistical, and cartographic references', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('CU').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('correos-cuba-postal')?.trustTier, 'authoritative');
  assert.equal(sources.get('correos-cuba-postal')?.availability, 'web-search');
  assert.equal(sources.get('upu-cuba-addressing-2004')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('upu-cuba-postcode-data')?.availability, 'licensed-bulk-data');
  assert.equal(sources.get('upu-cuba-postcode-data')?.requiresCredential, true);
  assert.equal(sources.get('iderc-cuba-geoportal')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('onei-cuba-dpa')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('geocuba-cartography')?.availability, 'commercial-or-restricted');
  const classification = classifyPostalSourceTrust({
    countryCode: 'CU',
    source: 'Grupo Empresarial Correos de Cuba',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Cuba address metadata encodes five digits, Cuban layout, explicit building links, rights, time, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(
    readFileSync(resolve(here, 'address_formats/americas/caribbean/CU.json'), 'utf8'),
  ) as any;
  assert.equal(value.postalCode.format, 'NNNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('99999'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('CU-99999'), false);
  assert.match(value.postalCode.source, /Correos de Cuba.*UPU.*MINCOM/i);
  assert.match(value.addressRules.postalCode.usage, /five-digit.*time-bound evidence.*not automatically.*full-code polygon.*building relation.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'building', 'apartment', 'street', 'houseNumber',
    'betweenStreets', 'neighborhood', 'postalZone', 'poBox', 'locality', 'municipality',
    'province', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
