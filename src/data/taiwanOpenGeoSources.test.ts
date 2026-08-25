import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Taiwan registry separates 3+3 data, lookup, licence, doorplates, buildings, administration, and cadastral evidence', () => {
  const ids = getAsiaOpenSourceIds('TW');
  const data = ASIA_OPEN_GEO_SOURCES['chunghwa-post-3plus3-data'];
  const lookup = ASIA_OPEN_GEO_SOURCES['chunghwa-post-3plus3-lookup'];
  const licence = ASIA_OPEN_GEO_SOURCES['chunghwa-post-3plus3-license'];
  const doorplates = ASIA_OPEN_GEO_SOURCES['moi-taiwan-national-doorplate-location'];
  const buildings = ASIA_OPEN_GEO_SOURCES['nlsc-taiwan-emap-buildings'];
  const emapDoorplates = ASIA_OPEN_GEO_SOURCES['nlsc-taiwan-emap-doorplates'];
  const administration = ASIA_OPEN_GEO_SOURCES['nlsc-taiwan-administrative-boundaries'];
  const cadastral = ASIA_OPEN_GEO_SOURCES['nlsc-taiwan-cadastral-map'];
  for (const id of [data.id, lookup.id, licence.id, doorplates.id, buildings.id, emapDoorplates.id, administration.id, cadastral.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(data.kind, 'postal-code');
  assert.match(data.license ?? '', /Taiwan Open Government Data License.*Chunghwa Post/i);
  assert.match(data.notes, /six-digit.*range.*delivery-specific.*not.*polygon/i);
  assert.match(lookup.notes, /lane.*alley.*odd-even.*single-query.*not.*bulk/i);
  assert.equal(licence.kind, 'standard');
  assert.match(licence.notes, /legal.*not.*assignment.*geometry/i);
  assert.equal(doorplates.kind, 'address');
  assert.match(doorplates.notes, /local government.*two months.*point.*bulk.*household/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.license ?? '', /controlled.*fee.*subscription/i);
  assert.match(buildings.notes, /explicit.*identifier.*WMS.*not.*vector/i);
  assert.equal(emapDoorplates.usage, 'validation');
  assert.match(emapDoorplates.notes, /point.*not.*building.*government.*WFS/i);
  assert.equal(administration.kind, 'admin-boundary');
  assert.match(administration.notes, /TWD97.*EPSG:3824.*3826.*3825.*not.*postal.*sovereignty/i);
  assert.equal(cadastral.usage, 'validation');
  assert.match(cadastral.notes, /viewer.*not.*reusable vector.*owner/i);
});

test('Taiwan official catalog exposes distinct postal operator, MOI, and NLSC authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('TW').map(source => [source.id, source]));
  assert.equal(sources.get('chunghwa-post-3plus3-data')?.authority, 'postal-operator');
  assert.equal(sources.get('chunghwa-post-3plus3-data')?.depth, 'street');
  assert.equal(sources.get('chunghwa-post-3plus3-lookup')?.depth, 'address');
  assert.equal(sources.get('chunghwa-post-3plus3-license')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('moi-taiwan-national-doorplate-location')?.depth, 'address');
  assert.equal(sources.get('moi-taiwan-national-doorplate-location')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('nlsc-taiwan-emap-buildings')?.depth, 'building');
  assert.equal(sources.get('nlsc-taiwan-emap-buildings')?.requiresCredential, true);
  assert.equal(sources.get('nlsc-taiwan-emap-doorplates')?.depth, 'address');
  assert.equal(sources.get('nlsc-taiwan-administrative-boundaries')?.depth, 'geo-only');
  assert.equal(sources.get('nlsc-taiwan-cadastral-map')?.trustTier, 'official');
});

test('Taiwan address metadata uses official sources and an explicit doorplate-to-building hierarchy', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/asia/east_asia/TW.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } };
  };
  assert.equal(format.postalCode.format, 'NNN NNN');
  assert.equal(format.postalCode.regex, '^\\d{3}\\s?\\d{3}$');
  assert.match(format.postalCode.api, /ID=208.*list=3/);
  assert.match(format.postalCode.source, /Chunghwa Post 3\+3.*MOI.*doorplate.*NLSC.*buildings.*cadastral.*administrative/i);
  assert.match(format.addressRules.postalCode.label, /6 digits.*address-range.*derived.*doorplate.*explicit.*NLSC.*household.*private/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'countyOrSpecialMunicipality',
    'townshipCityDistrict',
    'villageOrLi',
    'neighborhoodLin',
    'postalAdministrativePrefix',
    'deliveryDistrictOrSpecificCode',
    'roadStreetOrPlace',
    'section',
    'lane',
    'alley',
    'numberAndSubnumber',
    'floorAndUnitWhenPubliclyAuthorized',
    'officialDoorplateAddressAndPoint',
    'explicitLicensedBuildingIdentifier',
    'exactRightsClearedBuilding',
  ]);
  for (const sourceId of [
    'chunghwa-post-3plus3-data',
    'chunghwa-post-3plus3-lookup',
    'chunghwa-post-3plus3-license',
    'moi-taiwan-national-doorplate-location',
    'nlsc-taiwan-emap-buildings',
    'nlsc-taiwan-emap-doorplates',
    'nlsc-taiwan-administrative-boundaries',
    'nlsc-taiwan-cadastral-map',
  ]) assert.ok(format.openSourceIds.includes(sourceId));
});
