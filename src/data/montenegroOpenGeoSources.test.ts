import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Montenegro registry separates postcode, PAK, address, cadastral building, viewer, spatial-unit, and statistical evidence', () => {
  const ids = getEuropeOpenSourceIds('ME');
  const offices = EUROPE_OPEN_GEO_SOURCES['posta-crne-gore-postcode-office-directory'];
  const pak = EUROPE_OPEN_GEO_SOURCES['posta-crne-gore-pak-addressing'];
  const address = EUROPE_OPEN_GEO_SOURCES['uzn-montenegro-address-register'];
  const cadastre = EUROPE_OPEN_GEO_SOURCES['uzn-montenegro-real-estate-cadastre'];
  const geoportal = EUROPE_OPEN_GEO_SOURCES['uzn-montenegro-geoportal'];
  const spatial = EUROPE_OPEN_GEO_SOURCES['uzn-montenegro-spatial-unit-record'];
  const monstat = EUROPE_OPEN_GEO_SOURCES['monstat-montenegro-spatial-register'];
  for (const id of [offices.id, pak.id, address.id, cadastre.id, geoportal.id, spatial.id, monstat.id]) assert.ok(ids.includes(id));
  assert.equal(offices.kind, 'postal-code');
  assert.match(offices.notes, /five-digit.*unique.*post office.*point.*not.*perimeter.*terms/i);
  assert.equal(pak.kind, 'postal-code');
  assert.match(pak.notes, /six-digit.*part of a street.*route.*not.*polygon.*building/i);
  assert.equal(address.kind, 'address');
  assert.match(address.notes, /house numbers.*street.*cadastral.*point.*not.*building footprint.*coverage/i);
  assert.equal(cadastre.kind, 'building');
  assert.match(cadastre.notes, /fee.*exact.*relationship.*parcel.*not.*building.*owner/i);
  assert.equal(geoportal.usage, 'reference');
  assert.match(geoportal.notes, /viewer.*not.*bulk.*vector.*redistribution/i);
  assert.equal(spatial.kind, 'admin-boundary');
  assert.match(spatial.notes, /administrative.*statistical.*not.*postal.*sovereignty/i);
  assert.equal(monstat.kind, 'gazetteer');
  assert.match(monstat.notes, /names.*codes.*hierarchy.*UZN.*not.*postal/i);
});

test('Montenegro official catalog exposes distinct operator, UZN, and MONSTAT authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('ME').map(source => [source.id, source]));
  assert.equal(sources.get('posta-crne-gore-postcode-office-directory')?.authority, 'postal-operator');
  assert.equal(sources.get('posta-crne-gore-postcode-office-directory')?.depth, 'postcode');
  assert.equal(sources.get('posta-crne-gore-pak-addressing')?.depth, 'street');
  assert.equal(sources.get('uzn-montenegro-address-register')?.authority, 'government');
  assert.equal(sources.get('uzn-montenegro-address-register')?.depth, 'address');
  assert.equal(sources.get('uzn-montenegro-address-register')?.requiresCredential, true);
  assert.equal(sources.get('uzn-montenegro-real-estate-cadastre')?.depth, 'building');
  assert.equal(sources.get('uzn-montenegro-geoportal')?.depth, 'geo-only');
  assert.equal(sources.get('uzn-montenegro-spatial-unit-record')?.requiresCredential, true);
  assert.equal(sources.get('monstat-montenegro-spatial-register')?.authority, 'government');
});

test('Montenegro address metadata uses official sources and an explicit address-to-building hierarchy', () => {
  const format = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/europe/southern_europe/ME.json'), 'utf8')) as { postalCode: { api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string } } };
  assert.equal(format.postalCode.api, 'https://www.postacg.me/centar-za-korisnike/lokacije-poslovnica/');
  assert.match(format.postalCode.source, /Pošta Crne Gore.*PAK.*UZN Address Register.*cadastre.*MONSTAT/i);
  assert.match(format.addressRules.postalCode.label, /5 digits.*six-digit PAK.*routing.*derived.*address point.*building.*explicit UZN link.*property.*private/i);
  assert.deepEqual(format.addressRules.regionalHierarchy, ['municipalityOrCapital', 'settlement', 'localCommunity', 'statisticalOrCensusCircle', 'cadastralMunicipality', 'postalOfficeAssignment', 'postalAddressCodePak', 'streetOrSquare', 'houseNumber', 'authoritativeAddressRegisterId', 'cadastralParcelAndBuildingIdentifier', 'explicitRightsClearedBuilding']);
  for (const sourceId of ["posta-crne-gore-postcode-office-directory","posta-crne-gore-pak-addressing","uzn-montenegro-address-register","uzn-montenegro-real-estate-cadastre","uzn-montenegro-geoportal","uzn-montenegro-spatial-unit-record","monstat-montenegro-spatial-register"]) assert.ok(format.openSourceIds.includes(sourceId));
});
