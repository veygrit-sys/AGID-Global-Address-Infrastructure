import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const HUNGARY_SOURCE_IDS = [
  'magyar-posta-partner-extra-postcodes',
  'magyar-posta-addressing-database',
  'hungary-central-address-register-kcr',
  'lechner-hungary-eha',
  'lechner-hungary-inspire-buildings',
  'lechner-hungary-nta-buildings',
  'hungary-land-registry-cadastral-map',
  'ksh-hungary-administrative-units',
] as const;

test('Hungary registry separates assignment, address identity, address location, buildings, cadastre, and administration', () => {
  const ids = getEuropeOpenSourceIds('HU');
  const sources = HUNGARY_SOURCE_IDS.map(id => EUROPE_OPEN_GEO_SOURCES[id]);

  for (const source of sources) assert.ok(ids.includes(source.id));

  const [postcodes, addressing, kcr, eha, inspire, nta, cadastre, administration] = sources;
  assert.equal(postcodes.kind, 'postal-code');
  assert.match(postcodes.notes, /four-digit.*XML.*application background.*terms.*no postcode polygon/i);
  assert.equal(addressing.kind, 'address');
  assert.match(addressing.notes, /addressing.*post-office-box.*dedicated.*not.*bulk.*polygon/i);
  assert.equal(kcr.kind, 'address');
  assert.match(kcr.license ?? '', /controlled.*statutory/i);
  assert.match(kcr.notes, /unique address ID.*building.*staircase.*floor.*door.*coordinate.*cadastral.*not.*public mirror/i);
  assert.equal(eha.kind, 'geocoding');
  assert.match(eha.notes, /inside.*parcel.*entrance.*geometric centre.*not.*footprint/i);
  assert.equal(inspire.kind, 'building');
  assert.match(inspire.notes, /exact distribution.*coverage.*licence.*sample.*not nationwide/i);
  assert.equal(nta.kind, 'building');
  assert.match(nta.notes, /generalized.*WMTS.*not.*editable.*exact.*footprint/i);
  assert.equal(cadastre.kind, 'building');
  assert.match(cadastre.license ?? '', /controlled.*paid/i);
  assert.match(cadastre.notes, /parcel.*building.*house[- ]number.*owner.*title.*excluded/i);
  assert.equal(administration.kind, 'admin-boundary');
  assert.match(administration.notes, /region.*county.*district.*municipality.*not.*postcode/i);
});

test('Hungary official catalog exposes operator, controlled KCR, and building access boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('HU').map(source => [source.id, source]));

  assert.equal(sources.get('magyar-posta-partner-extra-postcodes')?.authority, 'postal-operator');
  assert.equal(sources.get('magyar-posta-partner-extra-postcodes')?.availability, 'bulk-open-data');
  assert.equal(sources.get('magyar-posta-addressing-database')?.depth, 'address');
  assert.equal(sources.get('hungary-central-address-register-kcr')?.authority, 'government');
  assert.equal(sources.get('hungary-central-address-register-kcr')?.availability, 'licensed-bulk-data');
  assert.equal(sources.get('hungary-central-address-register-kcr')?.requiresCredential, true);
  assert.equal(sources.get('lechner-hungary-eha')?.depth, 'address');
  assert.equal(sources.get('lechner-hungary-inspire-buildings')?.depth, 'building');
  assert.equal(sources.get('lechner-hungary-nta-buildings')?.availability, 'auth-required-api');
  assert.equal(sources.get('hungary-land-registry-cadastral-map')?.requiresCredential, true);
  assert.equal(sources.get('ksh-hungary-administrative-units')?.depth, 'geo-only');
});

test('Hungary address metadata uses official evidence and an explicit unit-to-building hierarchy', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/central_europe/HU.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
  };

  assert.equal(format.postalCode.api, 'https://www.posta.hu/partnerextra');
  assert.match(format.postalCode.source, /Magyar Posta Partner Extra.*KCR.*EHA.*INSPIRE.*NTA.*KSH/i);
  assert.match(format.addressRules.postalCode.label, /4 digits.*operator assignment.*special non-area.*derived surface.*KCR.*building/i);
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'region',
    'county',
    'districtOrBudapestDistrict',
    'municipality',
    'postalAssignmentOrSpecialEndpoint',
    'publicPlaceNameAndType',
    'houseNumber',
    'buildingAndStaircase',
    'floorAndDoor',
    'kcrAddressId',
    'addressCoordinateAndCadastralId',
    'explicitRightsClearedBuilding',
  ]);
  for (const sourceId of HUNGARY_SOURCE_IDS) assert.ok(format.openSourceIds.includes(sourceId));
});
