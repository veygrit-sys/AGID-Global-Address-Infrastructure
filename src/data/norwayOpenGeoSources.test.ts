import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const NORWAY_SOURCE_IDS = [
  'posten-bring-norway-postcode-register',
  'kartverket-norway-postcode-areas',
  'kartverket-norway-address-api',
  'kartverket-norway-matrikkelen-address',
  'kartverket-norway-matrikkelen-address-unit',
  'kartverket-norway-matrikkelen-building-points',
  'geovekst-norway-fkb-buildings',
  'kartverket-norway-administrative-units',
] as const;

test('Norway registry separates assignment, official area, address, unit, building point, footprint, and administration', () => {
  const ids = getEuropeOpenSourceIds('NO');
  const sources = NORWAY_SOURCE_IDS.map(id => EUROPE_OPEN_GEO_SOURCES[id]);

  for (const source of sources) assert.ok(ids.includes(source.id));

  const [posten, areas, api, address, unit, buildingPoint, fkb, administration] = sources;
  assert.equal(posten.kind, 'postal-code');
  assert.match(posten.notes, /four-digit.*G.*P.*B.*S.*no polygon.*Svalbard.*Jan Mayen.*terms/i);
  assert.equal(areas.kind, 'postal-code');
  assert.equal(areas.license, 'CC BY 4.0');
  assert.match(areas.notes, /official.*areal extent.*post-office-box.*additional.*monthly.*no invented area/i);
  assert.equal(api.kind, 'geocoding');
  assert.match(api.notes, /public.*individual.*bulk.*download.*not.*building footprint/i);
  assert.equal(address.kind, 'address');
  assert.equal(address.license, 'CC BY 4.0');
  assert.match(address.notes, /official address.*point.*postcode district.*not.*building footprint/i);
  assert.equal(unit.kind, 'address');
  assert.match(unit.notes, /addressId.*bruksenhetId.*composite.*not.*occupant/i);
  assert.equal(buildingPoint.kind, 'building');
  assert.match(buildingPoint.notes, /building number.*representation point.*address.*id.*not.*footprint/i);
  assert.equal(fkb.kind, 'building');
  assert.match(fkb.license ?? '', /Norge digitalt.*private.*purchase/i);
  assert.match(fkb.notes, /1:1.*building number.*restricted.*not.*redistributable/i);
  assert.equal(administration.kind, 'admin-boundary');
  assert.match(administration.notes, /official.*county.*municipality.*not.*postcode.*territory/i);
});

test('Norway official catalog exposes authority and access boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('NO').map(source => [source.id, source]));

  assert.equal(sources.get('posten-bring-norway-postcode-register')?.authority, 'postal-operator');
  assert.equal(sources.get('posten-bring-norway-postcode-register')?.depth, 'postcode');
  assert.equal(sources.get('kartverket-norway-postcode-areas')?.authority, 'official-open-data');
  assert.equal(sources.get('kartverket-norway-postcode-areas')?.availability, 'bulk-open-data');
  assert.equal(sources.get('kartverket-norway-address-api')?.availability, 'public-api');
  assert.equal(sources.get('kartverket-norway-matrikkelen-address')?.depth, 'address');
  assert.equal(sources.get('kartverket-norway-matrikkelen-address-unit')?.depth, 'address');
  assert.equal(sources.get('kartverket-norway-matrikkelen-building-points')?.depth, 'building');
  assert.equal(sources.get('geovekst-norway-fkb-buildings')?.availability, 'licensed-bulk-data');
  assert.equal(sources.get('geovekst-norway-fkb-buildings')?.requiresCredential, true);
  assert.equal(sources.get('kartverket-norway-administrative-units')?.depth, 'geo-only');
});

test('Norway address metadata uses official sources and an explicit unit-to-building hierarchy', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/northern_europe/NO.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
  };

  assert.equal(format.postalCode.api, 'https://www.bring.no/en/services/address-verification-services/postcodes');
  assert.match(format.postalCode.source, /Posten Bring.*Kartverket Postnummerområder.*Matrikkelen.*FKB/i);
  assert.match(format.addressRules.postalCode.label, /4 digits.*G\/P\/B\/S.*official area.*non-area.*address.*unit.*building.*NO\/SJ.*separate/i);
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'county',
    'municipality',
    'postalAreaOrNonArea',
    'postalPlace',
    'streetOrPlaceName',
    'houseNumberAndLetter',
    'addressId',
    'dwellingUnitNumberAndId',
    'buildingNumberAndPoint',
    'explicitLicensedFkbBuilding',
  ]);
  for (const sourceId of NORWAY_SOURCE_IDS) assert.ok(format.openSourceIds.includes(sourceId));
});
