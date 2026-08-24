import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('France source registry separates postal assignment, BAN address, COG, and building evidence', () => {
  const ids = getEuropeOpenSourceIds('FR');
  const postal = EUROPE_OPEN_GEO_SOURCES['data-gouv-fr-postcodes'];
  const ban = EUROPE_OPEN_GEO_SOURCES['ban-fr'];
  const bdTopo = EUROPE_OPEN_GEO_SOURCES['ign-bd-topo'];
  const cog = EUROPE_OPEN_GEO_SOURCES['insee-cog'];

  assert.ok(ids.includes('data-gouv-fr-postcodes'));
  assert.ok(ids.includes('ban-fr'));
  assert.ok(ids.includes('ign-bd-topo'));
  assert.ok(ids.includes('insee-cog'));
  assert.match(postal.notes, /not.*postal-code boundaries/i);
  assert.equal(ban.kind, 'address');
  assert.equal(ban.license, 'Licence Ouverte 2.0');
  assert.equal(bdTopo.kind, 'building');
  assert.match(bdTopo.notes, /address-to-building/i);
  assert.equal(cog.kind, 'admin-boundary');
});

test('France address metadata points to La Poste and public address/building sources', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/western_europe/FR.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
  };

  assert.match(profile.postalCode.api, /^https:\/\/data\.laposte\.fr\//);
  assert.match(profile.postalCode.source, /La Poste.*BAN/i);
  assert.ok(profile.openSourceIds.includes('ban-fr'));
  assert.ok(profile.openSourceIds.includes('ign-bd-topo'));
  assert.ok(profile.openSourceIds.includes('insee-cog'));
});
