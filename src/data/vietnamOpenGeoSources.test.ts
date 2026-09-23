import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ["vietnam-national-postcode-portal","vietnam-postcode-decision-2334-2025","vnpost-two-tier-postcode-notice","upu-vietnam-addressing","vnpost-vpostcode-digital-address","vietnam-nso-administrative-units","vietnam-nsdi-portal","vietnam-survey-map-data-service"] as const;

test('Vietnam registry separates current postcodes, reform law, postal transition, addressing, digital codes, administration, NSDI, and map products', () => {
  const ids = getAsiaOpenSourceIds('VN');
  for (const id of EXPECTED) { assert.ok(ids.includes(id)); assert.equal(ASIA_OPEN_GEO_SOURCES[id].id, id); assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'), true); }
  assert.equal(ASIA_OPEN_GEO_SOURCES['vietnam-national-postcode-portal'].usage, 'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['vietnam-national-postcode-portal'].notes, /five-digit.*assignment.*not a polygon.*civic address.*building.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['vietnam-postcode-decision-2334-2025'].notes, /two-tier.*five-character.*not.*postal geometry.*civic addresses.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['vnpost-two-tier-postcode-notice'].notes, /Decision 2334.*five-digit.*two-tier.*not a bulk.*polygon.*address registry.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-vietnam-addressing'].notes, /five digits.*house.*alley.*lane.*ward.*district.*province.*post-office.*predates.*not current allocation.*geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['vnpost-vpostcode-digital-address'].notes, /digital address.*location codes.*not automatically a legal civic address.*postal polygon.*building footprint.*bulk dataset/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['vietnam-nso-administrative-units'].notes, /current units.*new-to-old.*history.*not boundary geometry.*postcode assignments.*addresses.*buildings/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['vietnam-nsdi-portal'].notes, /administrative maps.*registered.*not prove reuse rights.*postal authority.*address-building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['vietnam-survey-map-data-service'].notes, /surveying.*mapping.*state-secret.*product.*CRS.*parcels.*buildings.*not become postcode surfaces.*civic-address/i);
});

test('Vietnam official catalog exposes matching authority and readiness boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('VN').map(source => [source.id, source]));
  assert.equal(sources.get('vietnam-national-postcode-portal')?.authority, 'government'); assert.equal(sources.get('vietnam-national-postcode-portal')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('vietnam-postcode-decision-2334-2025')?.sourceRole, 'legal-framework-only'); assert.equal(sources.get('vnpost-two-tier-postcode-notice')?.authority, 'postal-operator'); assert.equal(sources.get('upu-vietnam-addressing')?.authority, 'intergovernmental-postal-standard');
  assert.equal(sources.get('vnpost-vpostcode-digital-address')?.depth, 'delivery-point'); assert.equal(sources.get('vietnam-nso-administrative-units')?.depth, 'locality'); assert.equal(sources.get('vietnam-nsdi-portal')?.availability, 'auth-required-api'); assert.equal(sources.get('vietnam-survey-map-data-service')?.depth, 'building');
  const classification = classifyPostalSourceTrust({ countryCode: 'VN', source: 'Vietnam National Postcode Portal' }); assert.equal(classification.strength, 'strong'); assert.equal(classification.tier, 'authoritative');
});

test('Vietnam address metadata encodes five digits, two-tier validity, and exact building gate', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const value = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/southeast_asia/VN.json'), 'utf8')) as { native: { fields: Array<{ key: string }> }; english: { fields: Array<{ key: string }> }; postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(value.postalCode.format, 'NNNNN'); assert.equal(value.postalCode.regex, '^\\d{5}$'); assert.match(value.postalCode.api, /mabuuchinh\.vn/i); assert.match(value.postalCode.source, /Decision 2334.*Vietnam Post.*Vpostcode.*UPU.*NSO.*NSDI.*map-data service/i);
  assert.equal(value.addressRules.postalCode.label, '5 digits required'); assert.equal(value.addressRules.postalCode.required, true); assert.equal(value.addressRules.postalCode.usage, 'required');
  assert.deepEqual(value.addressRules.regionalHierarchy, ['provinceOrCentrallyGovernedCity', 'wardCommuneOrEquivalent', 'legacyDistrictContext', 'villageHamletOrResidentialGroup', 'streetLaneAlleyOrHouseNumber', 'buildingFloorApartmentOrUnit', 'postOfficePoBoxOrSpecialDelivery', 'fiveDigitPostcode', 'officialPostalAssignmentWithoutCanonicalGeometry', 'optionalAdministrativeJoinSurface', 'optionalDerivedDeliverySurface', 'vpostcodeDigitalAddressPoint', 'explicitRightsClearedCivicAddress', 'explicitAddressLinkedBuilding', 'exactRightsClearedBuildingGeometry']);
  assert.equal(value.native.fields.some(field => field.key === 'buildingId'), true); assert.equal(value.english.fields.some(field => field.key === 'buildingId'), true); for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
