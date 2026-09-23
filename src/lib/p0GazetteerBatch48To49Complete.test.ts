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
  Dhekelia: {
    countryCode: 'XD',
    regionKind: 'territory',
    expectedGate: 'complete-dhekelia-sba-anchor-required',
    repository: 'agid-open-xd-gazetteer',
    expectedNames: [
      'Eastern Sovereign Base Area',
      'Dhekelia Area Administration Office Reference',
      'Dhekelia Cantonment Reference',
      'Agios Nikolaos Special Area of Conservation',
      'Cape Pyla Special Area of Conservation',
      'Xylotymbou-Xylophagou-Ormidhia Community Cluster Reference',
    ],
  },
  Akrotiri: {
    countryCode: 'XU',
    regionKind: 'territory',
    expectedGate: 'complete-akrotiri-sba-anchor-required',
    repository: 'agid-open-xu-gazetteer',
    expectedNames: [
      'Western Sovereign Base Area',
      'Akrotiri Area Administration Office Reference',
      'Episkopi Headquarters Reference',
      'Akrotiri Peninsula Environmental Reference',
      'Akrotiri Special Area of Conservation',
      'Avdimou-Paramali Community Cluster Reference',
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
    regionKind: pack.regionKind,
    priority: 'P0-critical',
    operationalClass: 'postal-code-absent-or-nonstandard',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: [`Complete P0 slice for ${countryName}.`],
    proposedOpenSourcePackages: [pack.repository],
    firstActions: [`Create a complete source-linked ${countryName} SBA seed pack.`],
  };
}

function anchors(plan: ReturnType<typeof buildP0GazetteerRepositoryPlan>) {
  return plan.placeSeeds.filter(place => place.featureClass !== 'country');
}

function generatedRepo(countryName: PackName) {
  return join(process.cwd(), 'data', 'open_geo_repositories', PACKS[countryName].repository);
}

for (const countryName of Object.keys(PACKS) as PackName[]) {
  test(`${countryName} plan is a complete source-linked P0 SBA pack`, () => {
    const pack = PACKS[countryName];
    const plan = buildP0GazetteerRepositoryPlan(
      gap(countryName),
      countryName === 'Dhekelia' ? 48 : 49,
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
    assert.ok(plan.releaseGates.includes('sba-administration-and-geonames-source-linked'));
    assert.ok(plan.releaseGates.some(gate => gate.includes('conformance-covers')));
    assert.ok(plan.sources.length >= 7);

    for (const place of completed) {
      assert.equal(place.validationState, 'source-linked');
      assert.notEqual(place.approximateCentroid.lat, 0);
      assert.notEqual(place.approximateCentroid.lon, 0);
      assert.ok(place.geodataLinks.official);
      assert.ok(place.geodataLinks.geonames);
      assert.ok(place.notes.some(note => note.includes('Complete')));
      assert.ok(place.notes.some(note => note.includes('SBA Administration') || note.includes('SBAA')));
    }
  });

  test(`${countryName} generated repository preserves complete fixture coverage`, () => {
    const pack = PACKS[countryName];
    const repoRoot = generatedRepo(countryName);
    const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
      places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
    };
    const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
      counts: { placeSeeds: number; sources: number };
    };
    const qualityGates = JSON.parse(readFileSync(join(repoRoot, 'quality-gates.json'), 'utf8')) as {
      gates: Array<{ id: string; required: boolean }>;
    };
    const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
      vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
    };

    const completed = placeSeed.places.filter(place => place.featureClass !== 'country');
    const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));
    const gateIds = new Set(qualityGates.gates.map(gate => gate.id));

    assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
    assert.ok(gateIds.has(pack.expectedGate));
    assert.ok(qualityGates.gates.every(gate => gate.required));
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

test('XD complete pack avoids military, access, postal, delivery, and enclave-boundary overclaims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Dhekelia'), 48, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('operational status')));
  assert.ok(countrySeed?.notes.some(note => note.includes('security status')));
  assert.ok(countrySeed?.notes.some(note => note.includes('access rights')));
  assert.ok(countrySeed?.notes.some(note => note.includes('delivery availability')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Dhekelia Cantonment Reference' && seed.notes.some(note => note.includes('military unit'))));
  assert.ok(plan.placeSeeds.some(seed => seed.name.includes('Community Cluster') && seed.notes.some(note => note.includes('enclave boundary'))));
});

test('XU complete pack avoids military, access, postal, delivery, permit, and protected-boundary overclaims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Akrotiri'), 49, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('operational status')));
  assert.ok(countrySeed?.notes.some(note => note.includes('security status')));
  assert.ok(countrySeed?.notes.some(note => note.includes('access rights')));
  assert.ok(countrySeed?.notes.some(note => note.includes('delivery availability')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Episkopi Headquarters Reference' && seed.notes.some(note => note.includes('military function'))));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Akrotiri Special Area of Conservation' && seed.notes.some(note => note.includes('permit'))));
});
