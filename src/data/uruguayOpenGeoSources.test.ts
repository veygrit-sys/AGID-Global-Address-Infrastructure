import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'correo-uruguayo-postal-polygons',
  'correo-uruguayo-address-services',
  'ide-uy-addresses',
  'ide-uy',
  'dnc-uy-parcels',
  'osm-uruguay',
] as const;
const CATALOG = EXPECTED.filter(id => id !== 'osm-uruguay');

test('Uruguay registry separates postal polygons, service observations, addresses, catalog, parcels, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('UY');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id));
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correo-uruguayo-postal-polygons'].notes, /five-digit.*SHP.*EPSG:4326.*resource UUID.*timeless/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correo-uruguayo-address-services'].notes, /door number.*block.*lot.*point.*not.*building/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ide-uy-addresses'].notes, /address points.*identifiers.*department.*not.*postal-area.*building/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['dnc-uy-parcels'].notes, /parcel.*not.*postal.*building.*owner\/occupant/i);
});

test('Uruguay catalog keeps operator postal geometry above address and cadastral context', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('UY').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('correo-uruguayo-postal-polygons')?.trustTier, 'authoritative');
  assert.equal(sources.get('correo-uruguayo-postal-polygons')?.availability, 'bulk-open-data');
  assert.equal(sources.get('correo-uruguayo-address-services')?.depth, 'address');
  assert.equal(sources.get('ide-uy-addresses')?.trustTier, 'official');
  assert.equal(sources.get('dnc-uy-parcels')?.depth, 'geo-only');
  assert.equal(sources.get('ide-uy')?.sourceRole, 'legal-framework-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'UY',
    source: 'Correo Uruguayo official postal-code polygons',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Uruguay address metadata encodes five digits, release geometry, address IDs, buildings, time, licence, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(
    readFileSync(resolve(here, 'address_formats/americas/south_america/UY.json'), 'utf8'),
  ) as any;
  assert.equal(value.postalCode.format, 'NNNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('99999'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('UY-99999'), false);
  assert.match(value.postalCode.source, /Correo Uruguayo.*SHP\/KML.*IDE Uruguay.*Catastro.*OpenStreetMap/i);
  assert.match(value.addressRules.postalCode.usage, /five-digit.*release-pinned.*official postal geometry.*not automatically.*building relation.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'building', 'street', 'houseNumber', 'block', 'lot',
    'floor', 'unit', 'poBox', 'neighborhood', 'city', 'municipality', 'department', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
