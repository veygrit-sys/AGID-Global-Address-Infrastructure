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
  Kashmir: {
    countryCode: 'KASH',
    expectedGate: 'complete-kashmir-nonclaim-anchor-required',
    repository: 'agid-open-kash-gazetteer',
    expectedNames: [
      'Kashmir Region',
      'Jammu and Kashmir',
      'Ladakh',
      'Azad Jammu and Kashmir',
      'Gilgit-Baltistan',
      'Aksai Chin',
      'Line of Control',
    ],
  },
  Transnistria: {
    countryCode: 'PMR',
    expectedGate: 'complete-transnistria-nonclaim-anchor-required',
    repository: 'agid-open-pmr-gazetteer',
    expectedNames: [
      'Transnistrian Region of the Republic of Moldova',
      'Tiraspol',
      'Bender',
      'Camenca District',
      'Ribnita District',
      'Dubasari District',
      'Grigoriopol District',
      'Slobozia District',
    ],
  },
  'South China Sea Islands': {
    countryCode: 'SCSD',
    expectedGate: 'complete-south-china-sea-island-group-anchor-required',
    repository: 'agid-open-scsd-gazetteer',
    expectedNames: [
      'Spratly Islands',
      'Paracel Islands',
      'Pratas Islands',
      'Macclesfield Bank',
      'Scarborough Shoal',
    ],
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
      38,
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

test('KASH complete pack avoids sovereignty, control, and crossing/access claims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Kashmir'), 38, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('does not assert sovereignty')));
  assert.ok(countrySeed?.notes.some(note => note.includes('current control')));
  assert.ok(countrySeed?.notes.some(note => note.includes('administrative validity')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Line of Control' && seed.notes.some(note => note.includes('crossing permission'))));
});

test('PMR complete pack follows Transnistrian-region terminology boundaries', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Transnistria'), 39, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('statehood')));
  assert.ok(countrySeed?.notes.some(note => note.includes('recognition')));
  assert.ok(countrySeed?.notes.some(note => note.includes('current control')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Transnistrian Region of the Republic of Moldova' && seed.notes.some(note => note.includes('legal parity'))));
});

test('SCSD complete pack is a maritime feature-group seed, not a sovereignty or navigation product', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('South China Sea Islands'), 40, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('maritime entitlement')));
  assert.ok(countrySeed?.notes.some(note => note.includes('military/facility status')));
  assert.ok(countrySeed?.notes.some(note => note.includes('safe navigation')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Macclesfield Bank' && seed.notes.some(note => note.includes('Submerged'))));
});
