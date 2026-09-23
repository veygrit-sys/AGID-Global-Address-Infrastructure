import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'correos-chile-postcode-lookup',
  'correos-chile-normalization-api',
  'upu-chile-addressing-2017',
  'ide-chile-dpa-2023',
  'subdere-chile-cut',
  'ine-chile-open-geodata',
  'sii-chile-digital-cadastre',
  'geoportal-cl',
  'osm-chile',
] as const;
const CATALOG = [
  'correos-chile-postcode',
  'correos-chile-normalization-api',
  'upu-chile-addressing-2017',
  'ide-chile-dpa-2023',
  'subdere-chile-cut',
  'ine-chile-open-geodata',
  'sii-chile-digital-cadastre',
] as const;

test('Chile registry separates CorreosChile observations, block-face semantics, administration, statistics, cadastre, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('CL');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id), id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correos-chile-postcode-lookup'].notes, /seven-digit.*address-dependent.*side of a block.*not.*building.*polygon/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correos-chile-normalization-api'].notes, /Credentialed.*street.*municipal number.*postcode.*not coordinates.*building ID/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-chile-addressing-2017'].notes, /three.*distribution area.*four.*block face.*commune fallback.*not production/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ide-chile-dpa-2023'].notes, /SUBDERE.*IGM.*DIFROL.*INE.*not CorreosChile/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ine-chile-open-geodata'].notes, /census block.*building-count.*not CorreosChile/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['sii-chile-digital-cadastre'].notes, /property.*owner RUT.*restricted.*not postal geometry/i);
});

test('Chile catalog treats CorreosChile observations as authoritative but keeps contextual geometry metadata-only', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('CL').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('correos-chile-postcode')?.trustTier, 'authoritative');
  assert.equal(sources.get('correos-chile-postcode')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('correos-chile-postcode')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('correos-chile-normalization-api')?.requiresCredential, true);
  assert.equal(sources.get('correos-chile-normalization-api')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('upu-chile-addressing-2017')?.sourceRole, 'context-only');
  assert.equal(sources.get('ide-chile-dpa-2023')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('ine-chile-open-geodata')?.sourceRole, 'context-only');
  assert.equal(sources.get('sii-chile-digital-cadastre')?.availability, 'commercial-or-restricted');
  const classification = classifyPostalSourceTrust({
    countryCode: 'CL',
    sourceIds: ['correos-chile-postcode'],
    source: 'CorreosChile postcode lookup',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Chile address metadata encodes seven digits, block-face semantics, rural and post-office variants, building boundaries, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(
    readFileSync(resolve(here, 'address_formats/americas/south_america/CL.json'), 'utf8'),
  ) as any;
  assert.equal(value.postalCode.format, 'NNNNNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('9999999'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('999999'), false);
  assert.equal(new RegExp(value.postalCode.regex).test('CL-9999999'), false);
  assert.match(value.postalCode.source, /CorreosChile.*UPU.*03\/2017.*IDE Chile.*SUBDERE.*INE.*SII/i);
  assert.match(value.addressRules.postalCode.usage, /first three.*distribution area.*last four.*block-face.*not automatically a polygon.*SII.*building display.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'street', 'houseNumber', 'addressRemainder',
    'villageOrSettlement', 'premises', 'floor', 'unit', 'poBox', 'postOffice',
    'commune', 'region', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id), id);
});
