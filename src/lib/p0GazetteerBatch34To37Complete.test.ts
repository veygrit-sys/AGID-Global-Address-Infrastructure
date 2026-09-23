import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const PACKS = {
  'Ethiopia-Eritrea Border Area': {
    countryCode: 'EEBD',
    expectedGate: 'complete-ethiopia-eritrea-border-anchor-required',
    repository: 'agid-open-eebd-gazetteer',
    expectedNames: ['Badme', 'Tsorona', 'Zalambessa', 'Bure Border Area', 'Mereb River Border Sector'],
  },
  'Northern Territories': {
    countryCode: 'JP_NT',
    expectedGate: 'complete-northern-territories-four-island-anchor-required',
    repository: 'agid-open-jp-nt-gazetteer',
    expectedNames: ['Etorofu Island', 'Kunashiri Island', 'Shikotan Island', 'Habomai Islands'],
  },
  'Senkaku Islands': {
    countryCode: 'JP_SK',
    expectedGate: 'complete-senkaku-eight-island-anchor-required',
    repository: 'agid-open-jp-sk-gazetteer',
    expectedNames: [
      'Uotsuri Island',
      'Kitakojima Island',
      'Minamikojima Island',
      'Kuba Island',
      'Taisho Island',
      'Okinokitaiwa Island',
      'Okinominamiiwa Island',
      'Tobise Island',
    ],
  },
  'Takeshima / Dokdo': {
    countryCode: 'JP_TK',
    expectedGate: 'complete-takeshima-dokdo-main-islet-anchor-required',
    repository: 'agid-open-jp-tk-gazetteer',
    expectedNames: ['Liancourt Rocks', 'Dongdo', 'Seodo', 'Dokdo Minor Rock Islets'],
  },
} as const;

type PackName = keyof typeof PACKS;

function gap(countryName: PackName): GeoOssGapEntry {
  const pack = PACKS[countryName];
  return {
    countryCode: pack.countryCode,
    countryName,
    continent: 'special',
    relativePath: `${pack.countryCode}.json`,
    regionKind: 'disputed-region',
    priority: 'P0-critical',
    operationalClass: 'postal-code-available-weak-api',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: [`Complete P0 slice for ${countryName}.`],
    proposedOpenSourcePackages: [pack.repository],
    firstActions: [`Create a complete source-linked ${countryName} seed pack.`],
  };
}

function anchors(plan: ReturnType<typeof buildP0GazetteerRepositoryPlan>) {
  return plan.placeSeeds.filter(place => place.featureClass !== 'country');
}

function generatedRepo(countryName: PackName) {
  return join(process.cwd(), 'data', 'open_geo_repositories', PACKS[countryName].repository);
}

for (const countryName of Object.keys(PACKS) as PackName[]) {
  test(`${countryName} plan is a complete source-linked non-claim P0 pack`, () => {
    const pack = PACKS[countryName];
    const plan = buildP0GazetteerRepositoryPlan(
      gap(countryName),
      34,
      new Date('2026-07-01T00:00:00Z'),
    );
    const completed = anchors(plan);

    assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
    assert.equal(completed.length, pack.expectedNames.length);
    assert.deepEqual(
      completed.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...pack.expectedNames].sort((left, right) => left.localeCompare(right, 'en')),
    );
    assert.ok(plan.releaseGates.includes(pack.expectedGate));
    assert.ok(plan.releaseGates.some(gate => gate.includes('conformance-covers')));

    for (const place of completed) {
      assert.equal(place.validationState, 'source-linked');
      assert.notEqual(place.approximateCentroid.lat, 0);
      assert.notEqual(place.approximateCentroid.lon, 0);
      assert.ok(place.geodataLinks.official);
      assert.ok(place.geodataLinks.geonames);
      assert.ok(place.notes.some(note => note.includes('Complete')));
    }
  });

  test(`${countryName} generated repository preserves full conformance fixture coverage`, () => {
    const pack = PACKS[countryName];
    const repoRoot = generatedRepo(countryName);
    const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
      places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
    };
    const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
      counts: { placeSeeds: number; sources: number };
    };
    const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
      vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
    };

    const completed = placeSeed.places.filter(place => place.featureClass !== 'country');
    const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

    assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
    assert.equal(completed.length, pack.expectedNames.length);
    assert.deepEqual(
      completed.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...pack.expectedNames].sort((left, right) => left.localeCompare(right, 'en')),
    );
    for (const place of completed) {
      assert.equal(place.validationState, 'source-linked');
      assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
    }
    assert.equal(fixtures.vectors.length, pack.expectedNames.length);
    assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
  });
}

test('EEBD complete pack avoids demarcation, access, and current-control overclaims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Ethiopia-Eritrea Border Area'), 34, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('demarcation')));
  assert.ok(countrySeed?.notes.some(note => note.includes('current control')));
  assert.ok(countrySeed?.notes.some(note => note.includes('access rights')));
});

test('JP_NT complete pack records the four public island anchors without administration claims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Northern Territories'), 35, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('does not assert sovereignty')));
  assert.ok(countrySeed?.notes.some(note => note.includes('current administration')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Habomai Islands' && seed.notes.some(note => note.includes('private coordinates'))));
});

test('JP_SK complete pack covers all eight cited islands and avoids access/control claims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Senkaku Islands'), 36, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('does not assert sovereignty')));
  assert.ok(countrySeed?.notes.some(note => note.includes('access rights')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Tobise Island'));
});

test('JP_TK complete pack keeps address and resident records outside the seed layer', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Takeshima / Dokdo'), 37, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('resident records')));
  assert.ok(countrySeed?.notes.some(note => note.includes('delivery availability')));
  for (const name of ['Dongdo', 'Seodo']) {
    const islet = plan.placeSeeds.find(seed => seed.name === name);
    assert.ok(islet?.notes.some(note => note.includes('no building')));
  }
});
