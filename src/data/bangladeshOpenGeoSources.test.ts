import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED = ['bangladesh-post-postcode-tables', 'upu-bangladesh-addressing', 'survey-of-bangladesh-gis-services', 'bangladesh-nsdi-geoportal', 'bangladesh-nsdi-data-catalog', 'bbs-bangladesh-census-2022', 'dlrs-bangladesh-map-portal'] as const;

test('Bangladesh registry separates postal, mapping, NSDI, census, and land evidence', () => {
  const ids = getAsiaOpenSourceIds('BD'); for (const id of EXPECTED) { const source = ASIA_OPEN_GEO_SOURCES[id]; assert.ok(ids.includes(source.id)); assert.equal(source.url.startsWith('http'), true); }
  assert.equal(ASIA_OPEN_GEO_SOURCES['bangladesh-post-postcode-tables'].usage, 'reference');
  assert.equal(ASIA_OPEN_GEO_SOURCES['bangladesh-post-postcode-tables'].coverage, 'subnational');
  assert.match(ASIA_OPEN_GEO_SOURCES['bangladesh-post-postcode-tables'].notes, /Dhaka district.*Bengali column is empty/);
  assert.match(ASIA_OPEN_GEO_SOURCES['bangladesh-post-postcode-tables'].notes, /Upazila.*Bengali.*office classes.*GPO.*EDBO.*no code.*not.*polygon.*building.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-bangladesh-addressing'].notes, /four digits.*regional head office.*thana.*secondary post office.*not.*allocation.*polygon.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['survey-of-bangladesh-gis-services'].notes, /national mapping authority.*Building and Structure.*BUTM2010.*not.*open licence.*postal.*address-building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bangladesh-nsdi-geoportal'].notes, /discovery.*free to use.*provider-specific terms.*never.*postal authority.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bangladesh-nsdi-data-catalog'].notes, /editioned.*coverage.*scale.*BUTM2010.*not the dataset.*postal-code crosswalk.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bbs-bangladesh-census-2022'].notes, /enumeration-area.*population counting.*not postcode.*delivery.*buildings.*never public/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['dlrs-bangladesh-map-portal'].notes, /sells official.*mouza maps.*not.*postcode.*building footprint.*ownership/i);
});

test('Bangladesh official catalog exposes matching authority and readiness boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('BD').map(source => [source.id, source]));
  assert.equal(sources.get('bangladesh-post-postcode-tables')?.authority, 'postal-operator'); assert.equal(sources.get('upu-bangladesh-addressing')?.authority, 'intergovernmental-postal-standard'); assert.equal(sources.get('survey-of-bangladesh-gis-services')?.depth, 'building'); assert.equal(sources.get('survey-of-bangladesh-gis-services')?.requiresCredential, true); assert.equal(sources.get('bangladesh-nsdi-geoportal')?.availability, 'public-api'); assert.equal(sources.get('bangladesh-nsdi-data-catalog')?.depth, 'geo-only'); assert.equal(sources.get('bbs-bangladesh-census-2022')?.authority, 'government'); assert.equal(sources.get('dlrs-bangladesh-map-portal')?.requiresCredential, true);
});

test('Bangladesh address metadata encodes Bengali digits, office classes, evidence separation, and building gate', () => {
  const value = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/south_asia/BD.json'), 'utf8')) as { native: { fields: Array<{ key: string; required?: boolean }> }; english: { fields: Array<{ key: string; required?: boolean }> }; postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(value.postalCode.format, 'NNNN (1000-9999)'); assert.equal(value.postalCode.regex, '^[1-9]\\d{3}$'); assert.equal(value.postalCode.api.startsWith('https://bdpost.gov.bd/'), true); assert.match(value.postalCode.source, /Bangladesh Post.*UPU.*Survey of Bangladesh.*NSDI.*BBS.*DLRS/i);
  assert.equal(value.addressRules.postalCode.label, '4 digits required'); assert.equal(value.addressRules.postalCode.required, true); assert.equal(value.addressRules.postalCode.usage, 'required');
  assert.deepEqual(value.addressRules.regionalHierarchy, ['division', 'district', 'upazilaOrThana', 'unionMunicipalityOrWard', 'villageAreaOrStreet', 'deliveryPostOffice', 'typedGpoHoTsoUpoSoEdsoOrEdbo', 'fourDigitPostcode', 'officialPostalSurfaceOrNoCanonicalGeometry', 'optionalDerivedDeliverySurface', 'explicitRightsClearedCivicAddressPoint', 'explicitAddressLinkedBuilding', 'exactRightsClearedBuildingGeometry']);
  assert.equal(value.native.fields.find(field => field.key === 'postcode')?.required, true); assert.equal(value.english.fields.find(field => field.key === 'postOffice')?.required, true); assert.equal(value.english.fields.some(field => field.key === 'buildingId'), true); for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
