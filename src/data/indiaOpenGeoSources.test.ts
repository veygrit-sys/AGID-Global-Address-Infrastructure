import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED = ['india-post-regulations-2024', 'data-gov-in-pincode', 'data-gov-in-pincode-boundary', 'data-gov-in-godl', 'india-lgd-pin-crosswalk', 'india-digipin', 'survey-of-india-abdb', 'postalpincode-in'] as const;

test('India registry separates PIN semantics, office assignments, boundary catalog, GODL, DIGIPIN, admin context, and third-party lookup', () => {
  const ids = getAsiaOpenSourceIds('IN');
  for (const id of EXPECTED) {
    const source = ASIA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }
  assert.match(ASIA_OPEN_GEO_SOURCES['india-post-regulations-2024'].notes, /six-digit.*area.*post office.*semantics.*not.*directory.*polygon/i);
  assert.equal(ASIA_OPEN_GEO_SOURCES['data-gov-in-pincode'].usage, 'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['data-gov-in-pincode'].notes, /official.*monthly.*office type.*delivery.*multiple.*not.*geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['data-gov-in-pincode-boundary'].notes, /official.*catalog.*GeoJSON.*exact resource.*licence.*CRS.*digest.*not.*geometry/i);
  assert.equal(ASIA_OPEN_GEO_SOURCES['data-gov-in-godl'].kind, 'standard');
  assert.match(ASIA_OPEN_GEO_SOURCES['data-gov-in-godl'].notes, /exact covered dataset.*not.*postal/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['india-lgd-pin-crosswalk'].notes, /administrative.*crosswalk.*not.*PIN geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['india-digipin'].notes, /ten-character.*four-metre.*parallel.*not.*PIN.*building.*person/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['survey-of-india-abdb'].notes, /state.*district.*subdistrict.*village.*not.*PIN/i);
  assert.equal(ASIA_OPEN_GEO_SOURCES['postalpincode-in'].usage, 'fallback');
  assert.match(ASIA_OPEN_GEO_SOURCES['postalpincode-in'].notes, /third-party.*not.*official.*geometry.*redistribution/i);
});

test('India official catalog exposes matching source authority boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('IN').map(source => [source.id, source]));
  assert.equal(sources.get('india-post-regulations-2024')?.authority, 'postal-operator');
  assert.equal(sources.get('india-post-regulations-2024')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('data-gov-in-pincode')?.authority, 'official-open-data');
  assert.equal(sources.get('data-gov-in-pincode')?.availability, 'web-search');
  assert.equal(sources.get('data-gov-in-pincode-boundary')?.depth, 'postcode');
  assert.equal(sources.get('data-gov-in-pincode-boundary')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('data-gov-in-godl')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('india-lgd-pin-crosswalk')?.depth, 'locality');
  assert.equal(sources.get('india-digipin')?.depth, 'delivery-point');
  assert.equal(sources.get('survey-of-india-abdb')?.depth, 'geo-only');
  assert.equal(sources.get('postalpincode-in')?.authority, 'community');
});

test('India address metadata encodes delivery-network-first PIN, official boundary gate, DIGIPIN separation, and explicit buildings', () => {
  const format = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/south_asia/IN.json'), 'utf8')) as { postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(format.postalCode.format, 'NNNNNN');
  assert.equal(format.postalCode.regex, '^[1-9]\\d{5}$');
  assert.equal(format.postalCode.api, 'https://www.data.gov.in/resource/all-india-pincode-directory-till-last-month');
  assert.match(format.postalCode.source, /India Post Regulations.*Department of Posts.*PIN Directory.*PIN Boundary.*DIGIPIN.*Survey of India/i);
  assert.match(format.addressRules.postalCode.label, /6 digits.*1–9.*region.*circle.*sorting.*delivery office.*Delivery.*Non Delivery.*official boundary.*DIGIPIN.*parallel.*building.*explicit/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, ['postalCircleOrRegion', 'stateOrUnionTerritory', 'district', 'subdistrictOrTaluk', 'villageOrUrbanLocalBody', 'locality', 'sixDigitPin', 'deliveryAndNonDeliveryPostOfficeRecords', 'officialPinBoundaryOrNoCanonicalGeometry', 'optionalDigipinCell', 'explicitCivicAddressPoint', 'explicitAddressLinkedBuildingFeature', 'exactRightsClearedBuilding']);
  for (const id of EXPECTED) assert.ok(format.openSourceIds.includes(id));
});
