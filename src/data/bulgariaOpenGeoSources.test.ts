import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const BULGARIA_SOURCE_IDS = [
  'bulgarian-posts-postcode-reference',
  'bulgarian-posts-post-office-directory',
  'grao-bulgaria-address-classifier',
  'agcc-bulgaria-cadastral-map',
  'agcc-bulgaria-inspire-buildings',
  'nsi-bulgaria-ekatte',
  'nsi-bulgaria-administrative-spatial-data',
] as const;

test('Bulgaria registry separates routing, service point, address, building, and EKATTE evidence', () => {
  const ids = getEuropeOpenSourceIds('BG');
  const sources = BULGARIA_SOURCE_IDS.map(id => EUROPE_OPEN_GEO_SOURCES[id]);
  for (const source of sources) assert.ok(ids.includes(source.id));

  const [postcodes, offices, address, cadastre, buildings, ekatte, administration] = sources;
  assert.equal(postcodes.kind, 'postal-code');
  assert.match(postcodes.notes, /four-digit.*reference.*no.*operator-authored.*polygon.*deliverability/i);
  assert.equal(offices.kind, 'geocoding');
  assert.match(offices.notes, /service[- ]point.*not.*postcode area.*delivery/i);
  assert.equal(address.kind, 'address');
  assert.match(address.license ?? '', /controlled/i);
  assert.match(address.notes, /actual.*authorized.*roadmap.*not.*production.*person.*residence/i);
  assert.equal(cadastre.kind, 'building');
  assert.match(cadastre.license ?? '', /registered.*paid.*terms/i);
  assert.match(cadastre.notes, /building identifier.*parcel.*independent object.*owner.*excluded/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /exact distribution.*licence.*INSPIRE.*not.*production.*common identifier/i);
  assert.equal(ekatte.kind, 'gazetteer');
  assert.match(ekatte.license ?? '', /NSI Licence 2.0.*review/i);
  assert.match(ekatte.notes, /district.*municipality.*settlement.*not.*postcode/i);
  assert.equal(administration.kind, 'admin-boundary');
  assert.match(administration.notes, /EPSG:4326.*EPSG:9391.*context.*not.*postal/i);
});

test('Bulgaria official catalog exposes operator reference and controlled address/building boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('BG').map(source => [source.id, source]));

  assert.equal(sources.get('bulgarian-posts-postcode-reference')?.authority, 'postal-operator');
  assert.equal(sources.get('bulgarian-posts-postcode-reference')?.availability, 'web-search');
  assert.equal(sources.get('bulgarian-posts-post-office-directory')?.depth, 'delivery-point');
  assert.equal(sources.get('grao-bulgaria-address-classifier')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('grao-bulgaria-address-classifier')?.requiresCredential, true);
  assert.equal(sources.get('agcc-bulgaria-cadastral-map')?.depth, 'building');
  assert.equal(sources.get('agcc-bulgaria-cadastral-map')?.requiresCredential, true);
  assert.equal(sources.get('agcc-bulgaria-inspire-buildings')?.depth, 'building');
  assert.equal(sources.get('nsi-bulgaria-ekatte')?.depth, 'locality');
  assert.equal(sources.get('nsi-bulgaria-administrative-spatial-data')?.depth, 'geo-only');
});

test('Bulgaria address metadata uses official evidence and an explicit address-to-building hierarchy', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/eastern_europe/BG.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
  };

  assert.equal(format.postalCode.api, 'https://www.bgpost.bg/en/');
  assert.match(format.postalCode.source, /Bulgarian Posts.*GRAO.*AGCC.*NSI EKATTE/i);
  assert.match(format.addressRules.postalCode.label, /4 digits.*routing.*EKATTE.*address.*cadastral building.*non-area/i);
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'districtOblast',
    'municipality',
    'settlementEkatte',
    'postalAssignmentOrSpecialEndpoint',
    'streetBoulevardSquareOrQuarter',
    'houseOrBlockNumber',
    'entranceFloorApartment',
    'authorizedAddressIdentifierAndAccessPoint',
    'cadastralBuildingIdentifier',
    'explicitRightsClearedBuilding',
  ]);
  for (const sourceId of BULGARIA_SOURCE_IDS) assert.ok(format.openSourceIds.includes(sourceId));
});
