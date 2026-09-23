import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const FINLAND_SOURCE_IDS = [
  'posti-finland-postal-code-services',
  'posti-finland-basic-address-file',
  'statistics-finland-paavo-postal-areas',
  'dvv-finland-building-dwelling-register',
  'syke-finland-ryhti-building-addresses',
  'nls-finland-topographic-road-addresses',
  'nls-finland-topographic-buildings',
  'nls-finland-municipal-division',
  'aland-post-postal-services',
] as const;

test('Finland registry separates assignment, statistical geometry, address identity, buildings, administration, and Aland', () => {
  const ids = getEuropeOpenSourceIds('FI');
  const sources = FINLAND_SOURCE_IDS.map(id => EUROPE_OPEN_GEO_SOURCES[id]);
  for (const source of sources) assert.ok(ids.includes(source.id));

  const [postcodes, basicAddress, paavo, dvv, ryhti, road, building, administration, aland] = sources;
  assert.equal(postcodes.kind, 'postal-code');
  assert.match(postcodes.notes, /five-digit.*no map data.*not.*delivery perimeter/i);
  assert.equal(basicAddress.kind, 'address');
  assert.match(basicAddress.notes, /street.*house-number.*excludes Aland.*no geometry/i);
  assert.equal(paavo.kind, 'admin-boundary');
  assert.match(paavo.license ?? '', /CC BY 4.0/i);
  assert.match(paavo.notes, /annual.*statistical.*building-address.*may differ.*not.*Posti.*delivery/i);
  assert.equal(dvv.kind, 'address');
  assert.match(dvv.license ?? '', /controlled/i);
  assert.match(dvv.notes, /building.*dwelling.*permanent.*not.*public bulk.*occupant/i);
  assert.equal(ryhti.kind, 'building');
  assert.match(ryhti.notes, /completed buildings.*permanent.*transition.*2028.*detailed.*contract/i);
  assert.equal(road.kind, 'geocoding');
  assert.match(road.notes, /calculated.*interpolated.*not.*exact entrance/i);
  assert.equal(building.kind, 'building');
  assert.match(building.notes, /independent.*common identifier.*nearest.*not.*exact/i);
  assert.equal(administration.kind, 'admin-boundary');
  assert.match(administration.notes, /region.*subregion.*municipality.*not.*postcode/i);
  assert.equal(aland.kind, 'postal-code');
  assert.match(aland.notes, /AX.*Posti.*excludes.*not.*silently merge/i);
});

test('Finland official catalog exposes Posti, Paavo, controlled DVV, and explicit building boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('FI').map(source => [source.id, source]));

  assert.equal(sources.get('posti-finland-postal-code-services')?.authority, 'postal-operator');
  assert.equal(sources.get('posti-finland-basic-address-file')?.depth, 'address');
  assert.equal(sources.get('statistics-finland-paavo-postal-areas')?.availability, 'bulk-open-data');
  assert.equal(sources.get('statistics-finland-paavo-postal-areas')?.depth, 'geo-only');
  assert.equal(sources.get('dvv-finland-building-dwelling-register')?.availability, 'licensed-bulk-data');
  assert.equal(sources.get('dvv-finland-building-dwelling-register')?.requiresCredential, true);
  assert.equal(sources.get('syke-finland-ryhti-building-addresses')?.depth, 'building');
  assert.equal(sources.get('nls-finland-topographic-road-addresses')?.depth, 'address');
  assert.equal(sources.get('nls-finland-topographic-buildings')?.depth, 'building');
  assert.equal(sources.get('nls-finland-municipal-division')?.depth, 'geo-only');
  assert.equal(sources.get('aland-post-postal-services')?.authority, 'postal-operator');
});

test('Finland address metadata uses official evidence and an explicit address-to-building hierarchy', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/northern_europe/FI.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
  };

  assert.equal(format.postalCode.api, 'https://www.posti.fi/en/for-businesses/customer-support/postal-code-services');
  assert.match(format.postalCode.source, /Posti.*Paavo.*DVV.*Ryhti.*NLS/i);
  assert.match(format.addressRules.postalCode.label, /5 digits.*Posti assignment.*Paavo statistical.*address.*building.*FI\/AX/i);
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'region',
    'subRegion',
    'municipality',
    'postalAssignmentOrSpecialEndpoint',
    'streetName',
    'houseNumberAndRange',
    'addressPointOrInterpolatedRoadLocation',
    'stairwayAndApartment',
    'permanentBuildingIdentifier',
    'explicitRyhtiOrSourceLinkedBuilding',
  ]);
  for (const sourceId of FINLAND_SOURCE_IDS) assert.ok(format.openSourceIds.includes(sourceId));
});
