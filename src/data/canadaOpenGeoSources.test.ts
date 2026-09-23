import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'canada-post-postal',
  'canada-post-addresscomplete',
  'canada-post-licensed-postal-data',
  'statcan-pccf-licensed',
  'statcan-census-fsa-2021',
  'statcan-national-address-register',
  'statcan-open-database-buildings',
  'osm-canada',
] as const;
const CATALOG = EXPECTED.filter(id => id !== 'osm-canada');

test('Canada registry separates postal semantics, licensed assignment, PCCF, census FSA, civic addresses, buildings, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('CA');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id));
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['canada-post-postal'].notes, /FSA.*LDU.*block face.*single building.*not.*bulk/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['canada-post-addresscomplete'].notes, /API key.*formatted address.*not.*building footprint/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['canada-post-licensed-postal-data'].notes, /licensed.*monthly.*address range.*not.*polygon/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['statcan-pccf-licensed'].notes, /does not validate.*restricted.*not.*postal boundary/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['statcan-census-fsa-2021'].notes, /respondent-reported.*not necessarily.*Canada Post.*(?:no|not).*LDU/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['statcan-national-address-register'].notes, /non-confidential.*addressId.*locationId.*not.*delivery entitlement/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['statcan-open-database-buildings'].notes, /footprints.*incomplete.*not.*address-building relation/i);
});

test('Canada catalog keeps postal operator assignment above official-derived census and open context', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('CA').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('canada-post-postal')?.trustTier, 'authoritative');
  assert.equal(sources.get('canada-post-addresscomplete')?.requiresCredential, true);
  assert.equal(sources.get('canada-post-licensed-postal-data')?.availability, 'licensed-bulk-data');
  assert.equal(sources.get('statcan-pccf-licensed')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('statcan-census-fsa-2021')?.trustTier, 'official-derived');
  assert.equal(sources.get('statcan-national-address-register')?.depth, 'address');
  assert.equal(sources.get('statcan-open-database-buildings')?.depth, 'building');
  const classification = classifyPostalSourceTrust({ countryCode: 'CA', source: 'Canada Post AddressComplete' });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Canada address metadata encodes ANA NAN, FSA/LDU, address-building links, rights, time, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(readFileSync(resolve(here, 'address_formats/americas/north_america/CA.json'), 'utf8')) as any;
  assert.equal(value.postalCode.format, 'ANA NAN');
  assert.equal(new RegExp(value.postalCode.regex).test('H9H 9H9'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('D9D 9D9'), false);
  assert.match(value.postalCode.source, /Canada Post.*AddressComplete.*PCCF.*CFSA.*National Address Register.*Open Database of Buildings.*OpenStreetMap/i);
  assert.match(value.addressRules.postalCode.usage, /FSA.*LDU.*time-bound assignment evidence.*not automatically.*postal polygon.*building relation.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'building', 'unit', 'civicNumber', 'civicNumberSuffix',
    'streetName', 'streetType', 'streetDirection', 'deliveryInformation', 'ruralRoute', 'poBox',
    'deliveryInstallation', 'municipality', 'provinceTerritory', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
