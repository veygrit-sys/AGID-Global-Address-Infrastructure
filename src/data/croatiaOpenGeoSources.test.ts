import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Croatia registry separates operator, delivery-area, address, building, parcel, administration, and point evidence', () => {
  const ids = getEuropeOpenSourceIds('HR');
  const postal = EUROPE_OPEN_GEO_SOURCES['croatian-post-postcode-downloads'];
  const deliveryArea = EUROPE_OPEN_GEO_SOURCES['dgu-croatia-spatial-unit-register'];
  const address = EUROPE_OPEN_GEO_SOURCES['dgu-croatia-inspire-addresses'];
  const building = EUROPE_OPEN_GEO_SOURCES['dgu-croatia-inspire-buildings'];
  const parcel = EUROPE_OPEN_GEO_SOURCES['dgu-croatia-cadastral-parcels'];
  const administration = EUROPE_OPEN_GEO_SOURCES['dgu-croatia-inspire-administrative-units'];
  const point = EUROPE_OPEN_GEO_SOURCES['gisco-croatia-postcode-points'];

  for (const id of [postal.id, deliveryArea.id, address.id, building.id, parcel.id, administration.id, point.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /Excel\/XML.*not an open bulk licence/i);
  assert.equal(deliveryArea.kind, 'postal-code');
  assert.match(deliveryArea.notes, /delivery-office area.*postcode geometry.*crosswalk.*dataset-specific/i);
  assert.equal(address.kind, 'address');
  assert.match(address.notes, /identifier.*does not prove current postal assignment.*building link/i);
  assert.equal(building.kind, 'building');
  assert.match(building.notes, /explicit relationship.*common authoritative identifier.*proximity.*candidate-only/i);
  assert.match(parcel.notes, /not a building.*postal area.*owners.*title/i);
  assert.match(administration.notes, /never create postcode membership.*delivery coverage/i);
  assert.equal(point.license, 'CC BY-SA 4.0');
  assert.match(point.notes, /omissions.*incorrect positions.*Voronoi.*not.*delivery-area perimeter/i);
});

test('Croatia official catalog exposes distinct authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('HR').map(source => [source.id, source]));

  assert.equal(sources.get('croatian-post-postcode-downloads')?.authority, 'postal-operator');
  assert.equal(sources.get('croatian-post-postcode-downloads')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('dgu-croatia-spatial-unit-register')?.trustTier, 'authoritative');
  assert.equal(sources.get('dgu-croatia-inspire-addresses')?.depth, 'address');
  assert.equal(sources.get('dgu-croatia-inspire-buildings')?.depth, 'building');
  assert.equal(sources.get('gisco-croatia-postcode-points')?.trustTier, 'official-derived');
});

test('Croatia address metadata uses official downloads and a building-capable hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/southern_europe/HR.json'),
    'utf8',
  )) as {
    english: { addressFormat: string };
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'NNNNN');
  assert.equal(profile.postalCode.regex, '^\\d{5}$');
  assert.equal(profile.postalCode.api, 'https://www.posta.hr/preuzimanje-podataka-o-postanskim-uredima-6543/6543');
  assert.match(profile.postalCode.source, /Hrvatska pošta.*DGU Spatial Unit Register.*INSPIRE Addresses and Buildings/i);
  assert.match(profile.english.addressFormat, /HR-\{\{postcode\}\}/);
  assert.deepEqual(profile.addressRules.regionalHierarchy, [
    'countyOrCityOfZagreb',
    'cityOrMunicipality',
    'settlement',
    'postalDeliveryOffice',
    'streetOrSquare',
    'houseNumber',
    'building',
    'entrance',
    'floorOrUnit',
  ]);
  assert.match(profile.addressRules.postalCode.label, /5 domestic digits.*HR-.*operator assignment.*delivery area.*building.*parcel.*separate/i);
  for (const id of [
    'croatian-post-postcode-downloads',
    'dgu-croatia-spatial-unit-register',
    'dgu-croatia-inspire-addresses',
    'dgu-croatia-inspire-buildings',
    'dgu-croatia-inspire-administrative-units',
    'dgu-croatia-cadastral-parcels',
    'gisco-croatia-postcode-points',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
});
