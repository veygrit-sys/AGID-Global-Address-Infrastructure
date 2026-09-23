import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Slovenia registry separates normal, special, service-area, postal-district, address, building, parcel, and administration evidence', () => {
  const ids = getEuropeOpenSourceIds('SI');
  const postal = EUROPE_OPEN_GEO_SOURCES['posta-slovenije-postcode-csv'];
  const special = EUROPE_OPEN_GEO_SOURCES['posta-slovenije-special-postcodes'];
  const serviceArea = EUROPE_OPEN_GEO_SOURCES['posta-slovenije-delivery-area-webgis'];
  const postalDistrict = EUROPE_OPEN_GEO_SOURCES['gurs-slovenia-postal-districts'];
  const address = EUROPE_OPEN_GEO_SOURCES['gurs-slovenia-address-register'];
  const api = EUROPE_OPEN_GEO_SOURCES['gurs-slovenia-public-features-api'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['gurs-slovenia-real-estate-cadastre-buildings'];
  const administration = EUROPE_OPEN_GEO_SOURCES['gurs-slovenia-spatial-unit-register'];
  const parcels = EUROPE_OPEN_GEO_SOURCES['gurs-slovenia-cadastral-parcels'];

  for (const id of [postal.id, special.id, serviceArea.id, postalDistrict.id, address.id, api.id, buildings.id, administration.id, parcels.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /official.*four-digit.*CSV.*post-office.*not.*polygon.*terms/i);
  assert.equal(special.kind, 'postal-code');
  assert.match(special.notes, /organization.*institution.*non-area.*residential/i);
  assert.equal(serviceArea.kind, 'admin-boundary');
  assert.match(serviceArea.notes, /unaddressed.*A\/B\/C.*operational.*not.*normal postcode/i);
  assert.equal(postalDistrict.kind, 'admin-boundary');
  assert.match(postalDistrict.notes, /poštni okoliš.*CC BY 4\.0.*explicit.*crosswalk.*not.*operator-authored/i);
  assert.equal(address.kind, 'address');
  assert.match(address.notes, /unique address number.*centroid.*not.*building footprint.*postal assignment.*separate/i);
  assert.equal(api.kind, 'geocoding');
  assert.match(api.notes, /WFS.*OGC API.*EPSG:3794.*CC BY 4\.0.*transform/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /address-building relation.*containment.*candidate/i);
  assert.match(parcels.notes, /not a building.*postal district.*owner.*title/i);
  assert.match(administration.notes, /municipality.*settlement.*not.*postcode.*delivery/i);
});

test('Slovenia official catalog exposes distinct source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('SI').map(source => [source.id, source]));

  assert.equal(sources.get('posta-slovenije-postcode-csv')?.authority, 'postal-operator');
  assert.equal(sources.get('posta-slovenije-postcode-csv')?.depth, 'postcode');
  assert.equal(sources.get('posta-slovenije-special-postcodes')?.depth, 'delivery-point');
  assert.equal(sources.get('posta-slovenije-delivery-area-webgis')?.depth, 'geo-only');
  assert.equal(sources.get('gurs-slovenia-postal-districts')?.depth, 'geo-only');
  assert.equal(sources.get('gurs-slovenia-address-register')?.depth, 'address');
  assert.equal(sources.get('gurs-slovenia-public-features-api')?.availability, 'public-api');
  assert.equal(sources.get('gurs-slovenia-real-estate-cadastre-buildings')?.depth, 'building');
  assert.equal(sources.get('gurs-slovenia-spatial-unit-register')?.depth, 'geo-only');
  assert.equal(sources.get('gurs-slovenia-cadastral-parcels')?.depth, 'geo-only');
});

test('Slovenia address metadata uses official sources and an explicit building hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/central_europe/SI.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'NNNN');
  assert.equal(profile.postalCode.regex, '^\\d{4}$');
  assert.equal(profile.postalCode.api, 'https://www.posta.si/naslavljanje');
  assert.match(profile.postalCode.source, /Pošta Slovenije.*GURS.*Register naslovov.*Kataster nepremičnin/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, [
    'statisticalRegion',
    'municipality',
    'settlement',
    'street',
    'houseNumberAndSuffix',
    'registeredAddressNumber',
    'addressCentroid',
    'explicitCadastralBuilding',
  ]);
  assert.match(profile.addressRules.postalCode.label, /4 digits.*normal.*special.*postal district.*crosswalk.*address centroid.*building.*separate/i);
  for (const id of [
    'posta-slovenije-postcode-csv',
    'posta-slovenije-special-postcodes',
    'posta-slovenije-delivery-area-webgis',
    'gurs-slovenia-postal-districts',
    'gurs-slovenia-address-register',
    'gurs-slovenia-public-features-api',
    'gurs-slovenia-real-estate-cadastre-buildings',
    'gurs-slovenia-spatial-unit-register',
    'gurs-slovenia-cadastral-parcels',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
});
