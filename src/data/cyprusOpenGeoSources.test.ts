import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Cyprus registry separates Post, DLS, CYSTAT, and territorial-policy evidence', () => {
  const ids = getEuropeOpenSourceIds('CY');
  const postal = EUROPE_OPEN_GEO_SOURCES['cyprus-post-postcode-directory'];
  const api = EUROPE_OPEN_GEO_SOURCES['cyprus-post-postcode-api'];
  const address = EUROPE_OPEN_GEO_SOURCES['cyprus-dls-inspire-addresses'];
  const building = EUROPE_OPEN_GEO_SOURCES['cyprus-dls-inspire-buildings'];
  const admin = EUROPE_OPEN_GEO_SOURCES['cyprus-dls-administrative-units'];
  const sector = EUROPE_OPEN_GEO_SOURCES['cystat-postal-sectors'];
  const protocol = EUROPE_OPEN_GEO_SOURCES['eu-cyprus-protocol-10'];

  for (const id of [postal.id, api.id, address.id, building.id, admin.id, sector.id, protocol.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /four-digit.*text.*street.*not.*polygon/i);
  assert.equal(api.kind, 'address');
  assert.match(api.notes, /request.*operational.*not.*bulk/i);
  assert.equal(address.kind, 'address');
  assert.match(address.notes, /point.*relationship.*parcel.*distinct/i);
  assert.equal(building.kind, 'building');
  assert.match(building.notes, /footprint.*explicit.*proximity/i);
  assert.equal(admin.kind, 'admin-boundary');
  assert.match(admin.notes, /not.*postal.*effective control/i);
  assert.equal(sector.kind, 'postal-code');
  assert.match(sector.notes, /official.*statistical.*not.*Cyprus Post perimeter/i);
  assert.equal(protocol.kind, 'standard');
  assert.match(protocol.notes, /effective control.*sovereignty.*separate/i);
});

test('Cyprus official catalog exposes distinct source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('CY').map(source => [source.id, source]));

  assert.equal(sources.get('cyprus-post-postcode-directory')?.authority, 'postal-operator');
  assert.equal(sources.get('cyprus-post-postcode-directory')?.availability, 'bulk-open-data');
  assert.equal(sources.get('cyprus-post-postcode-api')?.availability, 'auth-required-api');
  assert.equal(sources.get('cyprus-dls-inspire-addresses')?.depth, 'address');
  assert.equal(sources.get('cyprus-dls-inspire-buildings')?.depth, 'building');
  assert.equal(sources.get('cyprus-dls-administrative-units')?.depth, 'geo-only');
  assert.equal(sources.get('cystat-postal-sectors')?.trustTier, 'official-derived');
  assert.equal(sources.get('eu-cyprus-protocol-10')?.depth, 'legal-framework');
});

test('Cyprus address metadata uses official sources, CY- international display, and building hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/southern_europe/CY.json'),
    'utf8',
  )) as {
    english: { addressFormat: string };
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'NNNN');
  assert.equal(profile.postalCode.regex, '^\\d{4}$');
  assert.equal(profile.postalCode.api, 'https://www.cypruspost.post/en/api-postal-codes');
  assert.match(profile.postalCode.source, /Cyprus Post.*DLS.*CYSTAT/i);
  assert.match(profile.english.addressFormat, /CY-\{\{postcode\}\}/);
  assert.deepEqual(profile.addressRules.regionalHierarchy, [
    'district',
    'municipalityOrCommunity',
    'quarterOrArea',
    'locality',
    'street',
    'houseNumber',
    'building',
    'unit',
  ]);
  assert.match(profile.addressRules.postalCode.label, /4 digits.*CY-.*assignment.*area requires source evidence/i);
  for (const id of [
    'cyprus-post-postcode-directory',
    'cyprus-post-postcode-api',
    'cyprus-dls-inspire-addresses',
    'cyprus-dls-inspire-buildings',
    'cyprus-dls-administrative-units',
    'cystat-postal-sectors',
    'eu-cyprus-protocol-10',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
  assert.equal(profile.openSourceIds.includes('postalcodes-info'), true);
});
