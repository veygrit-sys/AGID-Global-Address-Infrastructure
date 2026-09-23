import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EUROPE_OPEN_GEO_SOURCES,
  getEuropeOpenSourceIds,
} from './europeOpenGeoSources';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Netherlands open source registry separates BAG and CBS postcode geometry', () => {
  const ids = getEuropeOpenSourceIds('NL');
  const bag = EUROPE_OPEN_GEO_SOURCES['pdok-bag'];
  const cbs = EUROPE_OPEN_GEO_SOURCES['cbs-nl-postcode-areas'];

  assert.ok(ids.includes('pdok-bag'));
  assert.ok(ids.includes('cbs-nl-postcode-areas'));
  assert.equal(bag.kind, 'address');
  assert.equal(bag.license, 'Public Domain Mark 1.0');
  assert.match(bag.url, /api\.pdok\.nl\/kadaster\/bag\/ogc\/v2/);
  assert.equal(cbs.kind, 'postal-code');
  assert.equal(cbs.license, 'CC BY 3.0 NL');
  assert.match(cbs.notes, /derived geometry/i);
});

test('Netherlands address metadata points validation to official PostNL documentation', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/western_europe/NL.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
  };

  assert.match(profile.postalCode.api, /^https:\/\/developer\.postnl\.nl\//);
  assert.match(profile.postalCode.source, /API key required/);
  assert.ok(profile.openSourceIds.includes('pdok-bag'));
  assert.ok(profile.openSourceIds.includes('cbs-nl-postcode-areas'));
});
