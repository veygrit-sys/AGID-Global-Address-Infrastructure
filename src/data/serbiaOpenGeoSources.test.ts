import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Serbia registry separates postcode, PAK, API, open address, building, parcel, administration, and territory evidence', () => {
  const ids = getEuropeOpenSourceIds('RS');
  const offices = EUROPE_OPEN_GEO_SOURCES['posta-srbije-post-office-list'];
  const pak = EUROPE_OPEN_GEO_SOURCES['posta-srbije-pak-definition'];
  const lookup = EUROPE_OPEN_GEO_SOURCES['posta-srbije-pak-lookup'];
  const api = EUROPE_OPEN_GEO_SOURCES['posta-srbije-wsp-address-api'];
  const address = EUROPE_OPEN_GEO_SOURCES['rgz-serbia-address-register-open-data'];
  const administration = EUROPE_OPEN_GEO_SOURCES['rgz-serbia-spatial-unit-register'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['rgz-serbia-geosrbija-buildings'];
  const cadastre = EUROPE_OPEN_GEO_SOURCES['rgz-serbia-real-estate-cadastre'];

  for (const id of [offices.id, pak.id, lookup.id, api.id, address.id, administration.id, buildings.id, cadastre.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(offices.kind, 'postal-code');
  assert.match(offices.notes, /five-digit.*post-office.*not.*perimeter.*terms/i);
  assert.equal(pak.kind, 'postal-code');
  assert.match(pak.notes, /six-digit.*part of a street.*range.*not.*polygon/i);
  assert.equal(lookup.kind, 'geocoding');
  assert.match(lookup.notes, /street.*house number.*postcode.*PAK.*map.*not.*bulk/i);
  assert.equal(api.kind, 'address');
  assert.match(api.notes, /registered.*postcode.*PAK.*credentials.*(?:not|never).*public/i);
  assert.equal(address.kind, 'address');
  assert.equal(address.license, 'Serbian Open Data License 1.0');
  assert.match(address.notes, /CSV.*GPKG.*unique address code.*house-number point.*not.*building footprint/i);
  assert.equal(administration.kind, 'admin-boundary');
  assert.match(administration.notes, /coverage.*territorial.*not.*postal.*sovereignty/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /dataset-specific.*licen[cs]e.*explicit.*relation.*proximity/i);
  assert.equal(cadastre.kind, 'admin-boundary');
  assert.match(cadastre.notes, /validation.*parcel.*not.*building.*owner.*title/i);
});

test('Serbia official catalog exposes distinct source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('RS').map(source => [source.id, source]));

  assert.equal(sources.get('posta-srbije-post-office-list')?.authority, 'postal-operator');
  assert.equal(sources.get('posta-srbije-post-office-list')?.depth, 'postcode');
  assert.equal(sources.get('posta-srbije-pak-definition')?.depth, 'street');
  assert.equal(sources.get('posta-srbije-pak-lookup')?.availability, 'web-search');
  assert.equal(sources.get('posta-srbije-wsp-address-api')?.availability, 'auth-required-api');
  assert.equal(sources.get('posta-srbije-wsp-address-api')?.requiresCredential, true);
  assert.equal(sources.get('rgz-serbia-address-register-open-data')?.authority, 'official-open-data');
  assert.equal(sources.get('rgz-serbia-address-register-open-data')?.depth, 'address');
  assert.equal(sources.get('rgz-serbia-spatial-unit-register')?.depth, 'geo-only');
  assert.equal(sources.get('rgz-serbia-geosrbija-buildings')?.depth, 'building');
  assert.equal(sources.get('rgz-serbia-real-estate-cadastre')?.depth, 'geo-only');
});

test('Serbia address metadata uses official sources and an explicit address-to-building hierarchy', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/southern_europe/RS.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
  };

  assert.equal(format.postalCode.api, 'https://www.posta.rs/lat/alati/pronadjite-pak.aspx');
  assert.match(format.postalCode.source, /Pošta Srbije.*RGZ Adresni registar/i);
  assert.match(format.addressRules.postalCode.label, /5 digits.*six-digit PAK.*routing.*house-number point.*building.*territorial coverage.*separate/i);
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'autonomousProvinceOrAdministrativeDistrict',
    'localGovernmentUnit',
    'cityMunicipality',
    'populatedPlace',
    'street',
    'houseNumberAndSubnumber',
    'uniqueAddressCode',
    'postalAddressCodePak',
    'destinationPostOffice',
    'explicitCadastralBuilding',
  ]);
  for (const sourceId of [
    'posta-srbije-post-office-list',
    'posta-srbije-pak-definition',
    'posta-srbije-pak-lookup',
    'posta-srbije-wsp-address-api',
    'rgz-serbia-address-register-open-data',
    'rgz-serbia-spatial-unit-register',
    'rgz-serbia-geosrbija-buildings',
    'rgz-serbia-real-estate-cadastre',
  ]) {
    assert.ok(format.openSourceIds.includes(sourceId));
  }
});
