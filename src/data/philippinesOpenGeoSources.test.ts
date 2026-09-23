import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED = ["phlpost-zip-code-locator","upu-philippines-addressing","psa-philippine-standard-geographic-code","geoportal-philippines-data-inventory","geoportal-philippines-download-policy","namria-topographic-mapping","psa-popcen-cbms-geotagging","philippines-lra-land-registration"] as const;

test('Philippines registry separates postal, administrative, topographic, statistical, land, and rights evidence', () => {
  const ids = getAsiaOpenSourceIds('PH'); for (const id of EXPECTED) { const source = ASIA_OPEN_GEO_SOURCES[id]; assert.ok(ids.includes(source.id)); assert.equal(source.url.startsWith('http'), true); }
  assert.equal(ASIA_OPEN_GEO_SOURCES['phlpost-zip-code-locator'].usage, 'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['phlpost-zip-code-locator'].notes, /Region.*Province.*City\/Municipality.*four-digit.*assignment.*not barangay.*polygon.*address.*building.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-philippines-addressing'].notes, /four digits.*left.*locality.*zone.*province.*municipality.*digit hierarchy.*not.*boundaries.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['psa-philippine-standard-geographic-code'].notes, /versioned PSGC.*regions.*provinces.*cities.*municipalities.*barangays.*not.*PHLPost.*postal polygon.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['geoportal-philippines-data-inventory'].notes, /March 2025.*open.*conditional.*restricted.*not indicated.*not the dataset.*common licence.*postal authority/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['geoportal-philippines-download-policy'].notes, /identity.*agency.*purpose.*contact.*terms.*privacy.*not blanket redistribution.*postal authority/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['namria-topographic-mapping'].notes, /topographic.*map series.*varying.*coverage.*buildings.*not PHLPost.*civic-address.*exact product.*CRS/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['psa-popcen-cbms-geotagging'].notes, /service facilities.*projects.*building constructions.*statistics.*not.*civic-address.*postal geometry.*confidential/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['philippines-lra-land-registration'].notes, /titled and untitled land.*controlled.*not.*postal surface.*building footprint.*owner\/occupant/i);
});

test('Philippines official catalog exposes matching authority and readiness boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('PH').map(source => [source.id, source]));
  assert.equal(sources.get('phlpost-zip-code-locator')?.authority, 'postal-operator'); assert.equal(sources.get('upu-philippines-addressing')?.authority, 'intergovernmental-postal-standard'); assert.equal(sources.get('psa-philippine-standard-geographic-code')?.availability, 'bulk-open-data'); assert.equal(sources.get('geoportal-philippines-data-inventory')?.depth, 'geo-only'); assert.equal(sources.get('geoportal-philippines-download-policy')?.sourceRole, 'legal-framework-only'); assert.equal(sources.get('namria-topographic-mapping')?.depth, 'building'); assert.equal(sources.get('psa-popcen-cbms-geotagging')?.requiresCredential, true); assert.equal(sources.get('philippines-lra-land-registration')?.requiresCredential, true);
});

test('Philippines address metadata encodes four-digit ZIPs, evidence separation, and building gate', () => {
  const value = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/southeast_asia/PH.json'), 'utf8')) as { native: { fields: Array<{ key: string }> }; domestic: { tl: { fields: Array<{ key: string }> } }; english: { fields: Array<{ key: string }> }; postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(value.postalCode.format, 'NNNN'); assert.equal(value.postalCode.regex, '^\\d{4}$'); assert.equal(value.postalCode.api, 'https://phlpost.gov.ph/zip-code-locator/'); assert.match(value.postalCode.source, /PHLPost.*UPU.*PSA PSGC.*Geoportal.*NAMRIA.*POPCEN-CBMS.*LRA/i);
  assert.equal(value.addressRules.postalCode.label, '4 digits used'); assert.equal(value.addressRules.postalCode.required, false); assert.equal(value.addressRules.postalCode.usage, 'used');
  assert.deepEqual(value.addressRules.regionalHierarchy, ["region","provinceOrHighlyUrbanizedCity","cityOrMunicipality","districtOrSubdivision","barangay","streetOrRoad","houseBuildingOrUnit","fourDigitZipCode","officialPostalSurfaceOrNoCanonicalGeometry","optionalDerivedDeliverySurface","explicitRightsClearedCivicAddressPoint","explicitAddressLinkedBuilding","exactRightsClearedBuildingGeometry"]);
  assert.equal(value.native.fields.some(field => field.key === 'buildingId'), true); assert.equal(value.domestic.tl.fields.some(field => field.key === 'buildingId'), true); assert.equal(value.english.fields.some(field => field.key === 'buildingId'), true); for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
