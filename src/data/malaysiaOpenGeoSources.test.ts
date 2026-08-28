import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ["pos-malaysia-postcode-finder","upu-malaysia-addressing","malaysia-mygdx-postcode-catalog","malaysia-mygeo-fundamental-data-2026","malaysia-mygos-data-services","malaysia-mygeo-upi","malaysia-mygdi-licensing-2024","malaysia-mygeoname"] as const;

test('Malaysia registry separates postcode assignment, addressing, exchange approval, administration, G2G maps, parcels, licensing, and names', () => {
  const ids = getAsiaOpenSourceIds('MY'); for (const id of EXPECTED) { assert.ok(ids.includes(id)); assert.equal(ASIA_OPEN_GEO_SOURCES[id].id, id); assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'), true); }
  assert.equal(ASIA_OPEN_GEO_SOURCES['pos-malaysia-postcode-finder'].usage, 'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['pos-malaysia-postcode-finder'].notes, /five-digit.*assignment.*not a canonical polygon.*civic-address.*building.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-malaysia-addressing'].notes, /five digits.*P.O. box.*locked bag.*window-ticket.*not current allocations.*geometry.*buildings/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['malaysia-mygdx-postcode-catalog'].notes, /sourced from Pos Malaysia.*provider approval.*not bulk reuse.*geometry.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['malaysia-mygeo-fundamental-data-2026'].notes, /state.*division.*district.*jajahan.*mukim.*town.*provider agency.*not a postal boundary/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['malaysia-mygos-data-services'].notes, /G2G.*lot finding.*does not confer public reuse.*postal authority.*address-building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['malaysia-mygeo-upi'].notes, /state.*district.*lot.*grant.*do not establish postcode.*building.*owner/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['malaysia-mygdi-licensing-2024'].notes, /pricing.*copyright.*licence.*not blanket redistribution/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['malaysia-mygeoname'].notes, /geographical-name.*not legal evidence.*postcode assignments.*building/i);
});

test('Malaysia official catalog exposes matching authority and readiness boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('MY').map(source => [source.id, source]));
  assert.equal(sources.get('pos-malaysia-postcode-finder')?.authority, 'postal-operator'); assert.equal(sources.get('pos-malaysia-postcode-finder')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('upu-malaysia-addressing')?.authority, 'intergovernmental-postal-standard'); assert.equal(sources.get('malaysia-mygdx-postcode-catalog')?.availability, 'auth-required-api');
  assert.equal(sources.get('malaysia-mygeo-fundamental-data-2026')?.depth, 'geo-only'); assert.equal(sources.get('malaysia-mygos-data-services')?.requiresCredential, true); assert.equal(sources.get('malaysia-mygeo-upi')?.depth, 'locality');
  assert.equal(sources.get('malaysia-mygdi-licensing-2024')?.sourceRole, 'legal-framework-only'); assert.equal(sources.get('malaysia-mygeoname')?.validationReadiness, 'metadata-only');
  const classification = classifyPostalSourceTrust({ countryCode: 'MY', source: 'Pos Malaysia Postcode Finder' }); assert.equal(classification.strength, 'weak'); assert.equal(classification.tier, 'weak');
});

test('Malaysia address metadata encodes five digits, non-area delivery objects, UPI separation, and exact building gate', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..'); const value = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/southeast_asia/MY.json'), 'utf8')) as { native: { fields: Array<{ key: string }> }; english: { fields: Array<{ key: string }> }; postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(value.postalCode.format, 'NNNNN'); assert.equal(value.postalCode.regex, '^\\d{5}$'); assert.match(value.postalCode.api, /pos\.com\.my/i); assert.match(value.postalCode.source, /Pos Malaysia.*UPU.*MyGDX.*MyGeoportal.*MyGOS.*UPI.*MyGDI.*MyGeoName/i);
  assert.equal(value.addressRules.postalCode.label, '5 digits required'); assert.equal(value.addressRules.postalCode.required, true); assert.equal(value.addressRules.postalCode.usage, 'required');
  assert.deepEqual(value.addressRules.regionalHierarchy, ['stateOrFederalTerritory','divisionDistrictOrJajahan','mukimTownPekanOrLocality','sectionVillageNeighbourhoodOrStreet','houseLotFloorOrUnit','fiveDigitPostcode','officialPostalAssignmentWithoutCanonicalGeometry','postalServicePointOrNonAreaObject','optionalAdministrativeJoinSurface','optionalDerivedDeliverySurface','upiParcelContextWithoutAddressPromotion','explicitRightsClearedCivicAddress','explicitAddressLinkedBuilding','exactRightsClearedBuildingGeometry']);
  assert.equal(value.native.fields.some(field => field.key === 'buildingId'), true); assert.equal(value.english.fields.some(field => field.key === 'buildingId'), true); for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
