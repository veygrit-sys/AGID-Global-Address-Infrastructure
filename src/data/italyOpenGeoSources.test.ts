import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Italy registry separates Poste assignment, ANNCSU civic, ISTAT, and DBGT evidence', () => {
  const ids = getEuropeOpenSourceIds('IT');
  const search = EUROPE_OPEN_GEO_SOURCES['poste-italiane-cap-search'];
  const professional = EUROPE_OPEN_GEO_SOURCES['poste-italiane-cap-professional'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['anncsu-italy-addresses'];
  const administration = EUROPE_OPEN_GEO_SOURCES['istat-italy-admin-boundaries'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['italy-regional-dbgt-buildings'];

  for (const id of [search.id, professional.id, addresses.id, administration.id, buildings.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(search.kind, 'postal-code');
  assert.match(search.notes, /not.*official polygon/i);
  assert.equal(professional.kind, 'postal-code');
  assert.match(professional.license ?? '', /commercial licensed/i);
  assert.equal(addresses.kind, 'address');
  assert.match(addresses.license ?? '', /CC BY 4\.0/i);
  assert.equal(administration.kind, 'admin-boundary');
  assert.match(administration.notes, /never a CAP boundary/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /not an exact civic-to-building/i);
});

test('Italy official catalog distinguishes CAP, street-range, address, admin, and building sources', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('IT').map(source => [source.id, source]));

  assert.equal(sources.get('poste-italiane-cap-search')?.authority, 'postal-operator');
  assert.equal(sources.get('poste-italiane-cap-professional')?.depth, 'street');
  assert.equal(sources.get('anncsu-it-addresses')?.depth, 'address');
  assert.equal(sources.get('istat-it-admin-boundaries')?.depth, 'geo-only');
  assert.equal(sources.get('italy-regional-dbgt-buildings')?.depth, 'building');
});

test('Italy address metadata uses official CAP and civic sources instead of the legacy aggregate', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/southern_europe/IT.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.api, 'https://www.poste.it/cap');
  assert.match(profile.postalCode.source, /Poste Italiane.*ANNCSU.*ISTAT/i);
  assert.ok(profile.openSourceIds.includes('poste-italiane-cap-search'));
  assert.ok(profile.openSourceIds.includes('anncsu-italy-addresses'));
  assert.ok(profile.openSourceIds.includes('istat-italy-admin-boundaries'));
  assert.ok(profile.openSourceIds.includes('italy-regional-dbgt-buildings'));
  assert.equal(profile.openSourceIds.includes('datahub-postal'), false);
});
