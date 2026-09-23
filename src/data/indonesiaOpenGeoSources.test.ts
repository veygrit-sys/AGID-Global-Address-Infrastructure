import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED = ['indonesia-post-law-2009', 'indonesia-post-regulation-2025', 'pos-indonesia', 'upu-indonesia-addressing', 'sdi-indonesia-village-postcode', 'kemendagri-indonesia-admin-codes', 'bps-indonesia-statistical-area-codes', 'big-indonesia-village-boundaries', 'big-indonesia-rbi-buildings'] as const;

test('Indonesia registry separates legal semantics, current operator lookup, addressing, crosswalks, boundaries, and buildings', () => {
  const ids = getAsiaOpenSourceIds('ID');
  for (const id of EXPECTED) {
    const source = ASIA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }
  assert.match(ASIA_OPEN_GEO_SOURCES['indonesia-post-law-2009'].notes, /numbers.*letters.*combination.*address or area.*not.*directory.*polygon/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['indonesia-post-regulation-2025'].notes, /2025.*numeric.*alphabetic.*combined.*smallest area.*not.*assignment.*geometry/i);
  assert.equal(ASIA_OPEN_GEO_SOURCES['pos-indonesia'].usage, 'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['pos-indonesia'].notes, /official.*capture time.*not.*bulk API.*geometry.*redistribution/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-indonesia-addressing'].notes, /five digits.*RT\/RW.*not.*assignment.*geometry/i);
  assert.equal(ASIA_OPEN_GEO_SOURCES['sdi-indonesia-village-postcode'].usage, 'validation');
  assert.match(ASIA_OPEN_GEO_SOURCES['sdi-indonesia-village-postcode'].notes, /provincial.*BPS.*Kemendagri.*Satu Data.*not.*national.*geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['big-indonesia-village-boundaries'].notes, /non-definitive.*not.*official reference.*equal-distance.*not.*postal/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['big-indonesia-rbi-buildings'].notes, /regional.*scale.*edition.*licence.*explicit.*address/i);
});

test('Indonesia official catalog exposes matching authority and readiness boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('ID').map(source => [source.id, source]));
  assert.equal(sources.get('indonesia-post-law-2009')?.authority, 'government');
  assert.equal(sources.get('indonesia-post-regulation-2025')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('pos-indonesia')?.authority, 'postal-operator');
  assert.equal(sources.get('pos-indonesia')?.availability, 'web-search');
  assert.equal(sources.get('upu-indonesia-addressing')?.authority, 'intergovernmental-postal-standard');
  assert.equal(sources.get('sdi-indonesia-village-postcode')?.authority, 'official-open-data');
  assert.equal(sources.get('kemendagri-indonesia-admin-codes')?.depth, 'locality');
  assert.equal(sources.get('bps-indonesia-statistical-area-codes')?.depth, 'locality');
  assert.equal(sources.get('big-indonesia-village-boundaries')?.depth, 'geo-only');
  assert.equal(sources.get('big-indonesia-rbi-buildings')?.depth, 'building');
});

test('Indonesia address metadata encodes current five-digit routing localities, RT/RW, derived geometry, and explicit buildings', () => {
  const format = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/southeast_asia/ID.json'), 'utf8')) as { postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(format.postalCode.format, 'NNNNN');
  assert.equal(format.postalCode.regex, '^[1-9]\\d{4}$');
  assert.equal(format.postalCode.api, 'https://kodepos.posindonesia.co.id/');
  assert.match(format.postalCode.source, /Law 38\/2009.*Regulation 8\/2025.*Pos Indonesia.*UPU.*Satu Data.*Kemendagri.*BPS.*BIG/i);
  assert.match(format.addressRules.postalCode.label, /current 5 digits.*1–9.*future.*letters.*province.*city(?:\/|-| or )regency.*district.*village.*RT\/RW.*derived.*building.*explicit/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, ['province', 'cityOrRegency', 'districtOrKecamatan', 'villageOrUrbanVillage', 'rtRwNeighbourhoodContext', 'currentFiveDigitPostcode', 'officialPostalSurfaceOrNoCanonicalGeometry', 'optionalDerivedLocalitySurface', 'explicitCivicAddressPoint', 'explicitAddressLinkedBuildingFeature', 'exactRightsClearedBuilding']);
  for (const id of EXPECTED) assert.ok(format.openSourceIds.includes(id));
});
