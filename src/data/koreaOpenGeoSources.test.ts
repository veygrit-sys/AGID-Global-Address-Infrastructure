import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Korea registry separates postcode, National Basic District, address, building, and cadastral evidence', () => {
  const ids = getAsiaOpenSourceIds('KR');
  const system = ASIA_OPEN_GEO_SOURCES['korea-post-postcode-system'];
  const postcodeApi = ASIA_OPEN_GEO_SOURCES['korea-post-postcode-api'];
  const districts = ASIA_OPEN_GEO_SOURCES['mois-juso-basic-districts'];
  const addressApi = ASIA_OPEN_GEO_SOURCES['mois-juso-road-address-api'];
  const buildingDb = ASIA_OPEN_GEO_SOURCES['mois-juso-building-db'];
  const electronicMap = ASIA_OPEN_GEO_SOURCES['mois-juso-electronic-map'];
  const buildings = ASIA_OPEN_GEO_SOURCES['molit-korea-gis-integrated-buildings'];
  const cadastral = ASIA_OPEN_GEO_SOURCES['molit-korea-continuous-cadastral-map'];
  for (const id of [system.id, postcodeApi.id, districts.id, addressApi.id, buildingDb.id, electronicMap.id, buildings.id, cadastral.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(system.kind, 'standard');
  assert.match(system.notes, /2015.*five-digit.*National Basic District.*not.*current assignment.*geometry/i);
  assert.equal(postcodeApi.kind, 'postal-code');
  assert.match(postcodeApi.notes, /service[- ]key.*address.*not.*geometry.*bulk/i);
  assert.equal(districts.kind, 'postal-code');
  assert.match(districts.license ?? '', /KOGL Type 1.*approval.*product-specific/i);
  assert.match(districts.notes, /Polygon.*same five-digit.*canonical.*EPSG:5179.*5186.*rather than assumed/i);
  assert.equal(addressApi.kind, 'address');
  assert.match(addressApi.notes, /25-digit.*building management.*not.*footprint/i);
  assert.equal(buildingDb.kind, 'address');
  assert.match(buildingDb.notes, /building-level.*one road address.*multiple.*geometry/i);
  assert.equal(electronicMap.kind, 'building');
  assert.match(electronicMap.notes, /building.*entrance.*explicit.*approval.*not.*unrestricted/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /topographic.*building-register.*crosswalk.*overlap.*not.*crosswalk/i);
  assert.equal(cadastral.usage, 'validation');
  assert.match(cadastral.license ?? '', /KOGL Type 4.*non-commercial.*no modification/i);
  assert.match(cadastral.notes, /not survey.*parcel.*not.*building.*owner/i);
});

test('Korea official catalog exposes distinct Korea Post, MOIS Juso, and MOLIT authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('KR').map(source => [source.id, source]));
  assert.equal(sources.get('korea-post-postcode-system')?.authority, 'postal-operator');
  assert.equal(sources.get('korea-post-postcode-system')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('korea-post-postcode-api')?.availability, 'auth-required-api');
  assert.equal(sources.get('mois-juso-basic-districts')?.depth, 'postcode');
  assert.equal(sources.get('mois-juso-basic-districts')?.requiresCredential, true);
  assert.equal(sources.get('mois-juso-road-address-api')?.depth, 'address');
  assert.equal(sources.get('mois-juso-building-db')?.depth, 'building');
  assert.equal(sources.get('mois-juso-electronic-map')?.depth, 'building');
  assert.equal(sources.get('molit-korea-gis-integrated-buildings')?.depth, 'building');
  assert.equal(sources.get('molit-korea-continuous-cadastral-map')?.trustTier, 'official');
  assert.equal(sources.get('molit-korea-continuous-cadastral-map')?.validationReadiness, 'metadata-only');
});

test('Korea address metadata uses National Basic District and explicit Juso building identity', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/asia/east_asia/KR.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } };
  };
  assert.equal(format.postalCode.format, 'NNNNN');
  assert.equal(format.postalCode.regex, '^\\d{5}$');
  assert.match(format.postalCode.api, /15056971.*openapi/);
  assert.match(format.postalCode.source, /Korea Post.*MOIS Juso.*National Basic District.*road address.*building.*MOLIT.*cadastral/i);
  assert.match(format.addressRules.postalCode.label, /5 digits.*National Basic District.*official.*explicit.*building-management.*unit.*private/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'provinceOrSpecialMetropolitanCity',
    'cityCountyOrAutonomousDistrict',
    'eupMyeonDongOrLegalRi',
    'nationalBasicDistrict',
    'roadName',
    'buildingMainAndSubNumber',
    'roadAddressManagementNumber',
    'buildingManagementNumber',
    'officialRoadAddress',
    'officialEntranceOrBuildingPoint',
    'publicDetailedBuildingOrUnitWhenAuthorized',
    'exactAddressLinkedJusoBuilding',
    'explicitReviewedMolitBuildingCrosswalk',
    'exactRightsClearedBuilding',
  ]);
  for (const sourceId of [
    'korea-post-postcode-system',
    'korea-post-postcode-api',
    'mois-juso-basic-districts',
    'mois-juso-road-address-api',
    'mois-juso-building-db',
    'mois-juso-electronic-map',
    'molit-korea-gis-integrated-buildings',
    'molit-korea-continuous-cadastral-map',
  ]) assert.ok(format.openSourceIds.includes(sourceId));
});
