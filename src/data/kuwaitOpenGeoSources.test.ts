import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED = ['kuwait-post', 'upu-kuwait-addressing', 'paci-kuwait-finder', 'paci-kuwait-address-services', 'paci-kuwait-building-register', 'kuwait-municipality-parcels', 'kuwait-csb-census-gis'] as const;

test('Kuwait registry separates block and P.O. box assignment, PACI address, buildings, parcels, and statistics', () => {
  const ids = getAsiaOpenSourceIds('KW');
  for (const id of EXPECTED) {
    const source = ASIA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.equal(source.url.startsWith('http'), true);
  }
  assert.equal(ASIA_OPEN_GEO_SOURCES['kuwait-post'].usage, 'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['kuwait-post'].notes, /official.*governorate.*area.*block.*P.O. box.*not.*polygon.*bulk API.*redistribution/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-kuwait-addressing'].notes, /five digits.*P.O. box or block.*zone.*sector.*not.*assignment.*surface.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['paci-kuwait-finder'].notes, /informational-only.*as-is.*boundary-accuracy.*not.*legal.*survey.*postal/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['paci-kuwait-address-services'].notes, /civil addresses.*automated.*Personal Civil ID.*restricted.*never/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['paci-kuwait-building-register'].notes, /buildings.*automated.*identifier.*not.*footprint.*ownership.*(?:exact geometry|explicit).*permitted.*relation/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['kuwait-municipality-parcels'].notes, /ArcGIS.*Kuwait-specific CRS.*not.*licence.*parcel.*not.*postal.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['kuwait-csb-census-gis'].notes, /2011.*historical.*governorate.*municipal-block.*not.*current postal.*canonical/i);
});

test('Kuwait official catalog exposes matching authority and readiness boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('KW').map(source => [source.id, source]));
  assert.equal(sources.get('kuwait-post')?.authority, 'government');
  assert.equal(sources.get('kuwait-post')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('upu-kuwait-addressing')?.authority, 'intergovernmental-postal-standard');
  assert.equal(sources.get('paci-kuwait-finder')?.depth, 'address');
  assert.equal(sources.get('paci-kuwait-address-services')?.requiresCredential, true);
  assert.equal(sources.get('paci-kuwait-building-register')?.depth, 'building');
  assert.equal(sources.get('kuwait-municipality-parcels')?.depth, 'geo-only');
  assert.equal(sources.get('kuwait-csb-census-gis')?.validationReadiness, 'metadata-only');
});

test('Kuwait address metadata encodes five digits, assignment classes, PACI identifiers, derived surfaces, and explicit buildings', () => {
  const format = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/middle_east/KW.json'), 'utf8')) as { native: { fields: Array<{ key: string; required?: boolean }> }; english: { fields: Array<{ key: string; required?: boolean }> }; postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(format.postalCode.format, 'NNNNN');
  assert.equal(format.postalCode.regex, '^\\d{5}$');
  assert.equal(format.postalCode.api, 'https://www.moc.gov.kw/en/important-links?tab=2');
  assert.match(format.postalCode.source, /Ministry.*UPU.*PACI.*Municipality.*CSB/i);
  assert.match(format.addressRules.postalCode.label, /current 5 digits.*block.*P.O. box.*distinct.*governorate.*area.*building.*PACI automated.*derived.*non-canonical.*exact buildings.*explicit/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, ['governorate', 'areaOrDistrict', 'block', 'streetOrLane', 'buildingNumber', 'paciAutomatedAddressNumber', 'currentFiveDigitPostcode', 'blockOrPoBoxAssignmentClass', 'officialPostalSurfaceOrNoCanonicalGeometry', 'optionalDerivedBlockSurface', 'explicitPaciAddressPoint', 'explicitAddressLinkedBuildingOrParcel', 'exactRightsClearedBuildingGeometry']);
  assert.equal(format.native.fields.find(field => field.key === 'postcode')?.required, true);
  assert.equal(format.english.fields.some(field => field.key === 'buildingId'), true);
  for (const id of EXPECTED) assert.ok(format.openSourceIds.includes(id));
});
