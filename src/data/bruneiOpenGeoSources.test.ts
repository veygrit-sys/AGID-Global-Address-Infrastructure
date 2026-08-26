import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ['brunei-post-postcode-booklet', 'upu-brunei-addressing', 'brunei-survey-house-numbering', 'brunei-survey-digital-map-products', 'brunei-survey-geoportal', 'brunei-survey-geoportal-user-guide', 'brunei-deps-bpp-2021', 'brunei-land-registration-framework'] as const;

test('Brunei registry separates booklet, routing semantics, house numbering, maps, portal, census, and land', () => {
  const ids = getAsiaOpenSourceIds('BN');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id));
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.equal(ASIA_OPEN_GEO_SOURCES['brunei-post-postcode-booklet'].usage, 'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['brunei-post-postcode-booklet'].notes, /dated booklet.*Mukim.*Kampong.*six-character.*assignment.*not a polygon.*house.*building.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-brunei-addressing'].notes, /six alphanumeric.*district.*Mukim.*village.*delivery-point.*Simpang.*Jalan.*P\.O\. box.*not geographic boundaries.*building identities/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['brunei-survey-house-numbering'].notes, /house.*building.*unit.*site plan.*land title.*TOL.*identity.*fee.*not a public address register.*building geometry.*owner.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['brunei-survey-digital-map-products'].notes, /paid products.*roads.*administrative boundaries.*cadastral lots.*buildings.*scale.*coverage.*not postcode geometry.*civic-address link/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['brunei-survey-geoportal'].notes, /public and registered.*LOT.*TOL.*Gazette.*purchase.*not.*postal authority.*address-building.*redistribution rights/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['brunei-survey-geoportal-user-guide'].notes, /restriction-of-use.*GDBD2009.*Brunei BRSO.*parcel.*not reusable geometry.*postcode.*building evidence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['brunei-deps-bpp-2021'].notes, /population.*households.*housing units.*district.*Mukim.*village.*not postcode boundaries.*public household.*building identities/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['brunei-land-registration-framework'].notes, /titles.*registers.*ownership.*leases.*mortgages.*strata.*certified survey plans.*not public postcode polygons.*building footprints.*personal data/i);
});

test('Brunei official catalog exposes matching authority and readiness boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('BN').map(source => [source.id, source]));
  assert.equal(sources.get('brunei-post-postcode-booklet')?.authority, 'postal-operator');
  assert.equal(sources.get('brunei-post-postcode-booklet')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('upu-brunei-addressing')?.authority, 'intergovernmental-postal-standard');
  assert.equal(sources.get('brunei-survey-house-numbering')?.depth, 'address');
  assert.equal(sources.get('brunei-survey-digital-map-products')?.depth, 'building');
  assert.equal(sources.get('brunei-survey-geoportal')?.availability, 'auth-required-api');
  assert.equal(sources.get('brunei-survey-geoportal-user-guide')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('brunei-deps-bpp-2021')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('brunei-land-registration-framework')?.sourceRole, 'legal-framework-only');
  const classification = classifyPostalSourceTrust({ countryCode: 'BN', source: 'Brunei Postal Services Postcode Booklet' });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Brunei address metadata encodes compact six-character routing and exact building gate', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const value = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/southeast_asia/BN.json'), 'utf8')) as { native: { fields: Array<{ key: string }> }; english: { fields: Array<{ key: string }> }; postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(value.postalCode.format, 'AANNNN'); assert.equal(value.postalCode.regex, '^[BKPT][A-Z]\\d{4}$'); assert.match(value.postalCode.api, /post\.gov\.bn.*Buku.*Poskod/i); assert.match(value.postalCode.source, /Postal Services.*UPU Brunei.*Survey Department.*House Numbering.*Geoportal.*DEPS BPP 2021.*Land Department/i);
  assert.equal(value.addressRules.postalCode.label, '2 letters plus 4 digits required'); assert.equal(value.addressRules.postalCode.required, true); assert.equal(value.addressRules.postalCode.usage, 'required');
  assert.deepEqual(value.addressRules.regionalHierarchy, ['district', 'mukim', 'kampongOrVillage', 'townOrDistrictName', 'streetOrJalan', 'simpangOrJunctionNumber', 'houseBuildingFloorOrUnit', 'postOfficeOrPoBox', 'sixCharacterPostcode', 'officialPostalSurfaceOrNoCanonicalGeometry', 'optionalDerivedDeliverySurface', 'explicitSurveyHouseNumberingAddress', 'explicitAddressLinkedBuilding', 'exactRightsClearedBuildingGeometry']);
  assert.equal(value.native.fields.some(field => field.key === 'buildingId'), true); assert.equal(value.english.fields.some(field => field.key === 'buildingId'), true); for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
