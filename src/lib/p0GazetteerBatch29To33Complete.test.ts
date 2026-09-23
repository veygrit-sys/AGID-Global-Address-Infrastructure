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
  'Wallis and Futuna': {
    countryCode: 'WF',
    continent: 'oceania',
    regionKind: 'country-or-main-region',
    expectedGate: 'complete-chiefdom-coverage-required',
    repository: 'agid-open-wf-gazetteer',
    expectedNames: ['Alo', 'Sigave', 'Uvea'],
  },
  'Bir Tawil': {
    countryCode: 'BT_T',
    continent: 'special',
    regionKind: 'disputed-region',
    expectedGate: 'complete-bir-tawil-nonclaim-anchor-required',
    repository: 'agid-open-bt-t-gazetteer',
    expectedNames: ['Bir Tawil Triangle', 'Jabal Tawil', 'Wadi Tawil', 'Gabal Hagar El Zarqa'],
  },
  Crimea: {
    countryCode: 'CRIM',
    continent: 'special',
    regionKind: 'disputed-region',
    expectedGate: 'complete-crimea-nonclaim-anchor-required',
    repository: 'agid-open-crim-gazetteer',
    expectedNames: ['Crimean Peninsula', 'Autonomous Republic of Crimea', 'Sevastopol', 'Simferopol'],
  },
  'Cyprus Green Line': {
    countryCode: 'CYGL',
    continent: 'special',
    regionKind: 'disputed-region',
    expectedGate: 'complete-cyprus-green-line-buffer-anchor-required',
    repository: 'agid-open-cygl-gazetteer',
    expectedNames: [
      'United Nations Buffer Zone in Cyprus',
      'Nicosia Green Line',
      'Ledra Palace Crossing',
      'Ledra Street Crossing',
      'Pyla',
    ],
  },
  Donbas: {
    countryCode: 'DONB',
    continent: 'special',
    regionKind: 'disputed-region',
    expectedGate: 'complete-donbas-nonclaim-anchor-required',
    repository: 'agid-open-donb-gazetteer',
    expectedNames: ['Donetsk Oblast', 'Luhansk Oblast', 'Donetsk', 'Luhansk', 'Siverskyi Donets Basin'],
  },
} as const;

type PackName = keyof typeof PACKS;

function gap(countryName: PackName): GeoOssGapEntry {
  const pack = PACKS[countryName];
  return {
    countryCode: pack.countryCode,
    countryName,
    continent: pack.continent,
    relativePath: `${pack.countryCode}.json`,
    regionKind: pack.regionKind,
    priority: 'P0-critical',
    operationalClass: pack.countryCode === 'WF' ? 'no-postal-code-weak-geo-oss' : 'postal-code-available-weak-api',
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

function completedSeeds(plan: ReturnType<typeof buildP0GazetteerRepositoryPlan>) {
  return plan.countryCode === 'WF'
    ? plan.placeSeeds.filter(place => place.featureClass === 'chiefdom')
    : plan.placeSeeds.filter(place => place.featureClass !== 'country');
}

function generatedRepo(countryName: PackName) {
  return join(process.cwd(), 'data', 'open_geo_repositories', PACKS[countryName].repository);
}

for (const countryName of Object.keys(PACKS) as PackName[]) {
  test(`${countryName} plan is a complete source-linked P0 pack`, () => {
    const pack = PACKS[countryName];
    const plan = buildP0GazetteerRepositoryPlan(
      gap(countryName),
      29,
      new Date('2026-07-01T00:00:00Z'),
    );
    const seeds = completedSeeds(plan);

    assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
    assert.equal(seeds.length, pack.expectedNames.length);
    assert.deepEqual(
      seeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...pack.expectedNames].sort((left, right) => left.localeCompare(right, 'en')),
    );
    assert.ok(plan.releaseGates.includes(pack.expectedGate));
    assert.ok(plan.releaseGates.some(gate => gate.includes('conformance-covers')));

    for (const place of seeds) {
      assert.equal(place.validationState, 'source-linked');
      assert.notEqual(place.approximateCentroid.lat, 0);
      assert.notEqual(place.approximateCentroid.lon, 0);
      assert.ok(place.geodataLinks.official);
      assert.ok(place.geodataLinks.geonames);
    }
  });

  test(`${countryName} generated repository preserves complete conformance fixtures`, () => {
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

    const seeds = pack.countryCode === 'WF'
      ? placeSeed.places.filter(place => place.featureClass === 'chiefdom')
      : placeSeed.places.filter(place => place.featureClass !== 'country');
    const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

    assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
    assert.equal(seeds.length, pack.expectedNames.length);
    assert.deepEqual(
      seeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...pack.expectedNames].sort((left, right) => left.localeCompare(right, 'en')),
    );
    for (const place of seeds) {
      assert.equal(place.validationState, 'source-linked');
      assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
    }
    assert.equal(fixtures.vectors.length, pack.expectedNames.length);
    assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
  });
}

test('BT_T complete pack is explicitly non-claim and non-addressable', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Bir Tawil'), 30, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('does not assert sovereignty')));
  assert.ok(countrySeed?.notes.some(note => note.includes('permanent population')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Wadi Tawil' && seed.notes.some(note => note.includes('private-coordinate claims are excluded'))));
});

test('CRIM complete pack keeps sovereignty and current-control outside AGID scope', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Crimea'), 31, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('does not adjudicate sovereignty')));
  assert.ok(countrySeed?.notes.some(note => note.includes('current control')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Sevastopol'));
});

test('CYGL complete pack treats crossings as references, not permissions', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Cyprus Green Line'), 32, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('does not grant crossing rights')));
  for (const name of ['Ledra Palace Crossing', 'Ledra Street Crossing']) {
    const crossing = plan.placeSeeds.find(seed => seed.name === name);
    assert.ok(crossing?.notes.some(note => note.includes('access') || note.includes('permission')));
  }
});

test('DONB complete pack avoids frontline, control, and delivery overclaims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Donbas'), 33, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('does not assert current control')));
  assert.ok(countrySeed?.notes.some(note => note.includes('frontline')));
  assert.ok(countrySeed?.notes.some(note => note.includes('delivery availability')));
});
