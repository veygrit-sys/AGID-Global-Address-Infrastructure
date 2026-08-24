import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Slovakia registry separates postal, service, address, building, parcel, and administration evidence', () => {
  const ids = getEuropeOpenSourceIds('SK');
  const postal = EUROPE_OPEN_GEO_SOURCES['slovak-post-postcode-search'];
  const accessPoints = EUROPE_OPEN_GEO_SOURCES['slovak-post-access-point-xml'];
  const registry = EUROPE_OPEN_GEO_SOURCES['slovakia-register-addresses-portal'];
  const api = EUROPE_OPEN_GEO_SOURCES['slovakia-register-addresses-openapi'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['zbgis-slovakia-inspire-buildings'];
  const administration = EUROPE_OPEN_GEO_SOURCES['zbgis-slovakia-administrative-units'];
  const parcels = EUROPE_OPEN_GEO_SOURCES['zbgis-slovakia-cadastral-parcels'];

  for (const id of [postal.id, accessPoints.id, registry.id, api.id, buildings.id, administration.id, parcels.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /five-digit.*street.*municipality.*not.*polygon.*bulk/i);
  assert.equal(accessPoints.kind, 'geocoding');
  assert.match(accessPoints.notes, /post offices.*PoštaPOINT.*BalíkoBOX.*operational.*not.*postcode area/i);
  assert.equal(registry.kind, 'address');
  assert.match(registry.notes, /central.*consistent.*reference.*physical buildings.*not.*footprint/i);
  assert.equal(api.kind, 'address');
  assert.match(api.notes, /address point.*building identifier.*explicit.*relation.*nearest.*not an exact/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /dataset-specific licence.*common authoritative identifier.*proximity.*candidate/i);
  assert.match(parcels.notes, /not a building.*address link.*postcode area.*owner|rightsholder/i);
  assert.match(administration.notes, /CC BY 4\.0.*not.*postcode membership.*delivery/i);
});

test('Slovakia official catalog exposes distinct source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('SK').map(source => [source.id, source]));

  assert.equal(sources.get('slovak-post-postcode-search')?.authority, 'postal-operator');
  assert.equal(sources.get('slovak-post-postcode-search')?.depth, 'postcode');
  assert.equal(sources.get('slovak-post-access-point-xml')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('slovakia-register-addresses-portal')?.depth, 'address');
  assert.equal(sources.get('slovakia-register-addresses-openapi')?.depth, 'building');
  assert.equal(sources.get('zbgis-slovakia-inspire-buildings')?.depth, 'building');
  assert.equal(sources.get('zbgis-slovakia-administrative-units')?.depth, 'geo-only');
  assert.equal(sources.get('zbgis-slovakia-cadastral-parcels')?.depth, 'geo-only');
});

test('Slovakia address metadata uses official sources and a building-aware hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/central_europe/SK.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'NNN NN');
  assert.equal(profile.postalCode.regex, '^\\d{3}\\s?\\d{2}$');
  assert.equal(profile.postalCode.api, 'https://www.posta.sk/psc');
  assert.match(profile.postalCode.source, /Slovenská pošta.*Register adries.*ZBGIS/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, [
    'region',
    'district',
    'municipality',
    'municipalityPart',
    'streetOrPublicSpace',
    'descriptiveAndOrientationNumber',
    'registeredAddressPoint',
    'explicitRegisterBuilding',
  ]);
  assert.match(profile.addressRules.postalCode.label, /5 digits.*operator assignment.*derived.*Register adries.*building.*parcel.*separate/i);
  for (const id of [
    'slovak-post-postcode-search',
    'slovak-post-access-point-xml',
    'slovakia-register-addresses-portal',
    'slovakia-register-addresses-openapi',
    'zbgis-slovakia-inspire-buildings',
    'zbgis-slovakia-administrative-units',
    'zbgis-slovakia-cadastral-parcels',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
});
