import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ['myanmar-post-postcode-lookup','myanmar-national-portal-post-services','upu-myanmar-addressing-2022','myanmar-survey-department','myanmar-one-map-geodatabase-2024','mimu-place-codes-v9-6-2025','mimu-geospatial-data','mimu-terms-and-conditions','ycdc-land-building-services'] as const;

test('Myanmar registry separates postal assignment, UPU syntax, administration, PCodes, geospatial rights, and controlled buildings', () => {
  const ids = getAsiaOpenSourceIds('MM');
  for (const id of EXPECTED) { assert.ok(ids.includes(id)); assert.equal(ASIA_OPEN_GEO_SOURCES[id].id, id); assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'), true); }
  assert.equal(ASIA_OPEN_GEO_SOURCES['myanmar-post-postcode-lookup'].usage, 'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['myanmar-post-postcode-lookup'].notes, /seven-digit.*assignment.*not a canonical polygon.*civic-address.*building.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-myanmar-addressing-2022'].notes, /seven digits.*Quarter.*Village Tract.*P.O. Box.*building.*not current allocations.*geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['myanmar-survey-department'].notes, /topographic.*aerial.*permission.*scale.*CRS.*do not create postcode boundaries/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['myanmar-one-map-geodatabase-2024'].notes, /inter-agency.*not public data.*reuse licence.*postal authority.*building relation/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['mimu-place-codes-v9-6-2025'].notes, /administrative.*MIMU PCodes are not Myanmar Post postcodes.*postal boundaries/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['mimu-geospatial-data'].notes, /1:250,000.*WGS84.*permission.*not postal boundaries.*building links/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['mimu-terms-and-conditions'].notes, /non-sale.*non-commercial.*written permission.*not blanket redistribution/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['ycdc-land-building-services'].notes, /local controlled.*private.*not a national public address registry.*address-building/i);
});

test('Myanmar official catalog exposes matching authority, readiness, and restricted-use boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('MM').map(source => [source.id, source]));
  assert.equal(sources.get('myanmar-post-postcode-lookup')?.authority, 'postal-operator'); assert.equal(sources.get('myanmar-post-postcode-lookup')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('upu-myanmar-addressing-2022')?.authority, 'intergovernmental-postal-standard'); assert.equal(sources.get('myanmar-survey-department')?.depth, 'geo-only');
  assert.equal(sources.get('myanmar-one-map-geodatabase-2024')?.requiresCredential, true); assert.equal(sources.get('mimu-place-codes-v9-6-2025')?.depth, 'locality');
  assert.equal(sources.get('mimu-geospatial-data')?.availability, 'commercial-or-restricted'); assert.equal(sources.get('mimu-terms-and-conditions')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('ycdc-land-building-services')?.depth, 'building'); assert.equal(sources.get('ycdc-land-building-services')?.requiresCredential, true);
  const classification = classifyPostalSourceTrust({ countryCode: 'MM', source: 'Myanmar Post Postcode Lookup' }); assert.equal(classification.strength, 'weak'); assert.equal(classification.tier, 'weak');
});

test('Myanmar address metadata encodes seven digits, PCode separation, rural and postal objects, and exact building gate', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const value = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/southeast_asia/MM.json'), 'utf8')) as { native: { fields: Array<{ key: string; required: boolean }> }; english: { fields: Array<{ key: string; required: boolean }> }; postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(value.postalCode.format, 'NNNNNNN'); assert.equal(value.postalCode.regex, '^\\d{7}$'); assert.match(value.postalCode.api, /myanmarpost\.com\.mm\/postcode/i); assert.match(value.postalCode.source, /Myanmar Post.*UPU Myanmar 2022.*Survey Department.*One Map Myanmar.*MIMU.*YCDC/i);
  assert.equal(value.addressRules.postalCode.label, '7 digits required'); assert.equal(value.addressRules.postalCode.required, true); assert.equal(value.addressRules.postalCode.usage, 'required');
  assert.deepEqual(value.addressRules.regionalHierarchy, ['stateRegionOrUnionTerritory','district','townOrTownship','quarterOrVillageTract','villageStreetHouseRoomOrUnit','sevenDigitPostcodeForQuarterOrVillageTract','officialPostalAssignmentWithoutCanonicalGeometry','postalServicePointOrNonAreaObject','optionalAdministrativeJoinSurface','optionalDerivedDeliverySurface','mimuPlaceCodeWithoutPostalPromotion','explicitRightsClearedCivicAddress','explicitAddressLinkedBuilding','exactRightsClearedBuildingGeometry']);
  assert.equal(value.native.fields.find(field => field.key === 'street')?.required, false); assert.equal(value.english.fields.find(field => field.key === 'quarterOrVillageTract')?.required, false);
  assert.equal(value.native.fields.some(field => field.key === 'buildingId'), true); assert.equal(value.english.fields.some(field => field.key === 'buildingId'), true); for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
