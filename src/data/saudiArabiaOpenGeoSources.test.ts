import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Saudi registry separates National Address semantics, API, terms, short code, geospatial themes, and cadastre', () => {
  const ids = getAsiaOpenSourceIds('SA');
  const components = ASIA_OPEN_GEO_SOURCES['spl-national-address-components'];
  const api = ASIA_OPEN_GEO_SOURCES['spl-national-address-api-v31'];
  const terms = ASIA_OPEN_GEO_SOURCES['spl-national-address-api-terms'];
  const shortAddress = ASIA_OPEN_GEO_SOURCES['spl-national-address-short-address'];
  const geosa = ASIA_OPEN_GEO_SOURCES['geosa-saudi-geospatial-foundation-themes'];
  const portal = ASIA_OPEN_GEO_SOURCES['rega-saudi-geospatial-real-estate-portal'];
  const registration = ASIA_OPEN_GEO_SOURCES['rega-saudi-real-estate-registration-framework'];
  for (const source of [components, api, terms, shortAddress, geosa, portal, registration]) {
    assert.ok(ids.includes(source.id));
  }
  assert.equal(components.kind, 'standard');
  assert.match(components.notes, /five-digit.*Building Number.*Secondary or Additional Number.*not.*assignment.*polygon.*footprint/i);
  assert.equal(api.kind, 'address');
  assert.match(api.license ?? '', /Credentialed.*purpose-limited.*terms.*retention.*redistribution/i);
  assert.match(api.notes, /PKAddressID.*BuildingNumber.*AdditionalNumber.*UnitNumber.*point.*PolygonString.*not.*polygon.*footprint/i);
  assert.equal(terms.kind, 'standard');
  assert.match(terms.notes, /credentials.*privacy.*removal.*rate.*resale.*do not grant.*redistribution/i);
  assert.equal(shortAddress.kind, 'address');
  assert.match(shortAddress.notes, /four letters.*four numbers.*identifier.*not geometry.*footprint.*account/i);
  assert.equal(geosa.kind, 'standard');
  assert.match(geosa.notes, /Buildings.*Land Parcels.*National Address.*SANSRS.*not.*dataset.*join/i);
  assert.equal(portal.usage, 'validation');
  assert.match(portal.notes, /land plots.*viewer.*not.*reusable vector.*ownership/i);
  assert.equal(registration.kind, 'standard');
  assert.match(registration.notes, /cadastral.*Real Estate Maps.*do not publish.*owner.*rightsholder.*transaction/i);
});

test('Saudi official catalog exposes separate SPL, GEOSA, and REGA authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('SA').map(source => [source.id, source]));
  assert.equal(sources.get('spl-national-address-components')?.authority, 'postal-operator');
  assert.equal(sources.get('spl-national-address-components')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('spl-national-address-api-v31')?.availability, 'auth-required-api');
  assert.equal(sources.get('spl-national-address-api-v31')?.depth, 'building');
  assert.equal(sources.get('spl-national-address-api-v31')?.requiresCredential, true);
  assert.equal(sources.get('spl-national-address-api-terms')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('spl-national-address-short-address')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('geosa-saudi-geospatial-foundation-themes')?.depth, 'geo-only');
  assert.equal(sources.get('rega-saudi-geospatial-real-estate-portal')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('rega-saudi-real-estate-registration-framework')?.depth, 'legal-framework');
  assert.equal(sources.get('rega-saudi-real-estate-registration-framework')?.sourceRole, 'legal-framework-only');
});

test('Saudi address metadata types National Address identifiers and gates building output', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/asia/middle_east/SA.json'),
    'utf8',
  )) as {
    native: { fields: Array<{ key: string }> };
    english: { fields: Array<{ key: string }> };
    postalCode: { format: string; regex: string; api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } };
  };
  assert.equal(format.postalCode.format, 'NNNNN');
  assert.equal(format.postalCode.regex, '^\\d{5}$');
  assert.equal(format.postalCode.api, 'https://api.address.gov.sa/');
  assert.match(format.postalCode.source, /Saudi Post SPL.*National Address.*GEOSA.*Buildings.*REGA.*registration/i);
  assert.match(format.addressRules.postalCode.label, /5 digits.*point.*BuildingNumber.*not.*polygon.*footprint.*AdditionalNumber.*Short Address.*explicit licensed relation.*unit.*private/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  for (const field of ['additionalNumber', 'unitNumber', 'shortAddress']) {
    assert.ok(format.native.fields.some(candidate => candidate.key === field));
    assert.ok(format.english.fields.some(candidate => candidate.key === field));
  }
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'region',
    'city',
    'district',
    'street',
    'fiveDigitPostalCode',
    'fourDigitBuildingNumber',
    'fourDigitAdditionalNumber',
    'opaquePkAddressIdWhenReturned',
    'shortAddressFourLettersFourNumbers',
    'officialNationalAddressPoint',
    'publicUnitNumberWhenAuthorized',
    'explicitAddressLinkedBuildingFeature',
    'exactRightsClearedBuilding',
  ]);
  for (const sourceId of [
    'spl-national-address-components',
    'spl-national-address-api-v31',
    'spl-national-address-api-terms',
    'spl-national-address-short-address',
    'geosa-saudi-geospatial-foundation-themes',
    'rega-saudi-geospatial-real-estate-portal',
    'rega-saudi-real-estate-registration-framework',
  ]) assert.ok(format.openSourceIds.includes(sourceId));
});
