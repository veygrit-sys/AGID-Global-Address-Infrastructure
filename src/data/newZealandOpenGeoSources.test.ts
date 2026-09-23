import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { OCEANIA_OPEN_GEO_SOURCES, getOceaniaOpenSourceIds } from './oceaniaOpenGeoSources';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('New Zealand registry separates NZ Post, LINZ address, building, and Stats NZ evidence', () => {
  const ids = getOceaniaOpenSourceIds('NZ');
  const postal = OCEANIA_OPEN_GEO_SOURCES['nz-post-postcode-network'];
  const addresses = OCEANIA_OPEN_GEO_SOURCES['linz-nz-addresses'];
  const buildings = OCEANIA_OPEN_GEO_SOURCES['linz-nz-building-outlines'];
  const boundaries = OCEANIA_OPEN_GEO_SOURCES['stats-nz-geographic-boundaries'];

  assert.ok(ids.includes('nz-post-postcode-network'));
  assert.ok(ids.includes('linz-nz-addresses'));
  assert.ok(ids.includes('linz-nz-building-outlines'));
  assert.ok(ids.includes('stats-nz-geographic-boundaries'));
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.license ?? '', /licensed/i);
  assert.equal(addresses.kind, 'address');
  assert.equal(addresses.license, 'CC BY 4.0');
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /not.*address-to-building/i);
  assert.equal(boundaries.kind, 'admin-boundary');
});

test('New Zealand address metadata points to NZ Post and LINZ public address/building sources', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/oceania/oceania/NZ.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
  };

  assert.match(profile.postalCode.api, /^https:\/\/www\.nzpost\.co\.nz\//);
  assert.match(profile.postalCode.source, /NZ Post.*LINZ/i);
  assert.ok(profile.openSourceIds.includes('nz-post-postcode-network'));
  assert.ok(profile.openSourceIds.includes('linz-nz-building-outlines'));
  assert.ok(profile.openSourceIds.includes('stats-nz-geographic-boundaries'));
});
