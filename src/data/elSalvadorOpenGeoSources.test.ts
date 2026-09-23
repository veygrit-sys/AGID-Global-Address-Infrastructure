import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'correos-el-salvador',
  'upu-el-salvador-addressing-2019',
  'cnr-el-salvador-geographic-codes',
  'onec-el-salvador-geographic-catalog',
  'cnr-el-salvador-cadastre',
  'osm-el-salvador',
] as const;
const CATALOG = EXPECTED.filter(id => id !== 'osm-el-salvador');

test('El Salvador registry separates postal operator, UPU semantics, administration, statistics, cadastre, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('SV');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id));
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correos-el-salvador'].notes, /official postal operator.*not.*bulk assignment.*polygon/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-el-salvador-addressing-2019'].notes, /four digits.*region.*department.*locality or delivery area.*not current.*geometry/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['cnr-el-salvador-geographic-codes'].notes, /two.*four.*six-digit.*not postal codes.*not postal boundaries/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['onec-el-salvador-geographic-catalog'].notes, /statistical.*vintage.*crosswalk.*not postal/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['cnr-el-salvador-cadastre'].notes, /paid.*parcel.*owner.*not postal.*building relation/i);
});

test('El Salvador catalog keeps postal operator above dated semantics, administration, statistics, and cadastre', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('SV').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('correos-el-salvador')?.trustTier, 'authoritative');
  assert.equal(sources.get('correos-el-salvador')?.availability, 'web-search');
  assert.equal(sources.get('upu-el-salvador-addressing-2019')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('cnr-el-salvador-geographic-codes')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('onec-el-salvador-geographic-catalog')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('cnr-el-salvador-cadastre')?.availability, 'commercial-or-restricted');
  const classification = classifyPostalSourceTrust({
    countryCode: 'SV',
    source: 'Dirección General de Correos de El Salvador',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('El Salvador address metadata encodes four digits, hierarchy versions, explicit building links, rights, time, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(
    readFileSync(resolve(here, 'address_formats/americas/central_america/SV.json'), 'utf8'),
  ) as any;
  assert.equal(value.postalCode.format, 'NNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('9999'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('SV-9999'), false);
  assert.match(value.postalCode.source, /Correos de El Salvador.*UPU.*CNR.*ONEC.*OpenStreetMap/i);
  assert.match(value.addressRules.postalCode.usage, /four-digit.*time-bound assignment evidence.*not automatically.*postal polygon.*building relation.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'building', 'street', 'houseNumber', 'passage',
    'block', 'lot', 'floor', 'unit', 'poBox', 'postOffice', 'development', 'neighborhood',
    'caserio', 'canton', 'district', 'municipality', 'department', 'city', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
