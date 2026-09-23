import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Germany registry separates operator, PLZ geometry, address, building, and admin evidence', () => {
  const ids = getEuropeOpenSourceIds('DE');
  const search = EUROPE_OPEN_GEO_SOURCES['deutsche-post-plz-server'];
  const datafactory = EUROPE_OPEN_GEO_SOURCES['deutsche-post-datafactory'];
  const postcodeAreas = EUROPE_OPEN_GEO_SOURCES['bkg-postleitzahlgebiete'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['bkg-georeferenced-addresses'];
  const coordinates = EUROPE_OPEN_GEO_SOURCES['adv-hk-de'];
  const footprints = EUROPE_OPEN_GEO_SOURCES['adv-hu-de'];
  const lod2 = EUROPE_OPEN_GEO_SOURCES['bkg-lod2-de'];
  const boundaries = EUROPE_OPEN_GEO_SOURCES['bkg-vg25'];

  for (const id of [search.id, datafactory.id, postcodeAreas.id, addresses.id, coordinates.id, footprints.id, lod2.id, boundaries.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(datafactory.kind, 'postal-code');
  assert.match(datafactory.notes, /contract-partitioned/i);
  assert.equal(postcodeAreas.kind, 'postal-code');
  assert.match(postcodeAreas.notes, /multipart.*large-recipient/i);
  assert.equal(addresses.kind, 'address');
  assert.match(addresses.notes, /not building footprints/i);
  assert.equal(coordinates.kind, 'address');
  assert.match(coordinates.notes, /cadastral house coordinates/i);
  assert.equal(footprints.kind, 'building');
  assert.match(footprints.notes, /object identifier.*AGS/i);
  assert.equal(lod2.kind, 'building');
  assert.match(lod2.notes, /explicit identifier or crosswalk/i);
  assert.equal(boundaries.kind, 'admin-boundary');
  assert.match(boundaries.notes, /never postal geometry/i);
});

test('Germany official catalog exposes postcode, address, building, and administrative sources', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('DE').map(source => [source.id, source]));

  assert.equal(sources.get('deutsche-post-plz-server')?.authority, 'postal-operator');
  assert.equal(sources.get('deutsche-post-datafactory')?.depth, 'building');
  assert.equal(sources.get('bkg-postleitzahlgebiete')?.depth, 'postcode');
  assert.equal(sources.get('bkg-georeferenced-addresses')?.depth, 'address');
  assert.equal(sources.get('adv-hk-de')?.depth, 'address');
  assert.equal(sources.get('adv-hu-de')?.depth, 'building');
  assert.equal(sources.get('bkg-lod2-de')?.depth, 'building');
  assert.equal(sources.get('bkg-vg25')?.depth, 'geo-only');
});

test('Germany address metadata points to official and rights-separated sources', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/central_europe/DE.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    addressRules: { regionalHierarchy: string[] };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.api, 'https://www.postdirekt.de/plzserver/');
  assert.match(profile.postalCode.source, /Deutsche Post Direkt.*BKG PLZ.*HK-DE/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['state', 'district', 'municipality', 'city']);
  assert.ok(profile.openSourceIds.includes('deutsche-post-datafactory'));
  assert.ok(profile.openSourceIds.includes('bkg-postleitzahlgebiete'));
  assert.ok(profile.openSourceIds.includes('bkg-georeferenced-addresses'));
  assert.ok(profile.openSourceIds.includes('adv-hu-de'));
  assert.ok(profile.openSourceIds.includes('bkg-vg25'));
  assert.equal(profile.openSourceIds.includes('openplzapi'), false);
});
