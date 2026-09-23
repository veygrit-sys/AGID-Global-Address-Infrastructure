import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'correos-cr-postal',
  'upu-costa-rica-addressing-2009',
  'upu-costa-rica-address-policy-case-study',
  'inec-cr-geographic-classification',
  'inec-cr-uged-2024',
  'snit-cr',
  'snit-cr-terms',
  'osm-costa-rica',
] as const;
const CATALOG = [
  'correos-costa-rica-postal',
  'upu-costa-rica-addressing-2009',
  'upu-costa-rica-address-policy-case-study',
  'inec-cr-geographic-classification',
  'inec-cr-uged-2024',
  'snit-cr',
  'snit-cr-terms',
] as const;

test('Costa Rica registry separates operator, UPU, INEC, SNIT rights, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('CR');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id), id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correos-cr-postal'].notes, /time-bound assignment.*not a reusable.*address corpus.*polygon.*building/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-costa-rica-addressing-2009'].notes, /five digits.*province-canton-district.*not a current.*assignment.*geometry/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-costa-rica-address-policy-case-study'].notes, /each district.*postcode.*19-digit.*does not release/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['inec-cr-uged-2024'].notes, /geostatistical.*imaginary DTA.*official-derived.*not operator-issued/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['snit-cr'].license ?? '', /prohibit.*commercial.*derived/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['snit-cr-terms'].notes, /rights gate.*commercial.*not assignment/i);
});

test('Costa Rica catalog makes operator observations reference-eligible and every geometry source contextual', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('CR').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('correos-costa-rica-postal')?.trustTier, 'authoritative');
  assert.equal(sources.get('correos-costa-rica-postal')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('correos-costa-rica-postal')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('upu-costa-rica-addressing-2009')?.sourceRole, 'context-only');
  assert.equal(sources.get('inec-cr-uged-2024')?.sourceRole, 'context-only');
  assert.equal(sources.get('inec-cr-uged-2024')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('snit-cr-terms')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('snit-cr-terms')?.validationReadiness, 'metadata-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'CR',
    sourceIds: ['correos-costa-rica-postal'],
    source: 'Correos de Costa Rica Código Postal',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Costa Rica address metadata encodes five digits, district hierarchy, explicit building links, rights, time, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(
    readFileSync(resolve(here, 'address_formats/americas/central_america/CR.json'), 'utf8'),
  ) as any;
  assert.equal(value.postalCode.format, 'NNNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('10102'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('99999'), false);
  assert.equal(new RegExp(value.postalCode.regex).test('CR-10102'), false);
  assert.match(value.postalCode.source, /Correos de Costa Rica.*UPU.*04\/2009.*case study/i);
  assert.match(value.addressRules.postalCode.usage, /province digit.*canton digits.*district digits.*one-to-one.*SNIT.*exact address.*building display.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'street', 'houseNumber', 'neighborhood',
    'exactDirections', 'landmark', 'premises', 'floor', 'unit', 'poBox',
    'province', 'canton', 'district', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id), id);
});
