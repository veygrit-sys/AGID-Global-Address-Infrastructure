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

test('United Kingdom open source registry separates postcode, UPRN, and building evidence', () => {
  const ids = getEuropeOpenSourceIds('GB');
  const onspd = EUROPE_OPEN_GEO_SOURCES['ons-postcode-directory'];
  const uprn = EUROPE_OPEN_GEO_SOURCES['ordnance-survey-open-uprn'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['ordnance-survey-openmap-local'];

  assert.ok(ids.includes('ons-postcode-directory'));
  assert.ok(ids.includes('ordnance-survey-open-uprn'));
  assert.ok(ids.includes('ordnance-survey-openmap-local'));
  assert.equal(onspd.kind, 'postal-code');
  assert.match(onspd.notes, /not.*postal boundary/i);
  assert.equal(uprn.kind, 'address');
  assert.equal(uprn.license, 'Open Government Licence v3.0');
  assert.match(uprn.url, /os-open-uprn/);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /generalised/i);
});

test('United Kingdom address metadata exposes UPRN and generalized building sources', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/northern_europe/GB.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
  };

  assert.match(profile.postalCode.api, /^https:\/\/postcodes\.io\//);
  assert.match(profile.postalCode.source, /ONS.*Royal Mail/i);
  assert.ok(profile.openSourceIds.includes('ordnance-survey-open-uprn'));
  assert.ok(profile.openSourceIds.includes('ordnance-survey-openmap-local'));
});
