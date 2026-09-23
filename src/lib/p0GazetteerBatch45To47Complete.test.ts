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
  'Desventuradas Islands': {
    countryCode: 'CL-DI',
    regionKind: 'territory',
    expectedGate: 'complete-desventuradas-island-group-anchor-required',
    repository: 'agid-open-cl-di-gazetteer',
    expectedNames: [
      'Desventuradas Islands Archipelago',
      'San Ambrosio Island',
      'San Félix Island',
      'González Islet',
      'Roca Catedral',
      'Nazca-Desventuradas Marine Park',
    ],
  },
  'Salas y Gomez Island': {
    countryCode: 'CL-SG',
    regionKind: 'territory',
    expectedGate: 'complete-salas-y-gomez-island-anchor-required',
    repository: 'agid-open-cl-sg-gazetteer',
    expectedNames: [
      'Salas y Gómez / Motu Motiro Hiva',
      'Salas y Gómez Twin Rocks and Isthmus',
      'Salas y Gómez Nature Sanctuary',
      'Motu Motiro Hiva Marine Park',
      'Rapa Nui Administrative Reference',
    ],
  },
  'Clipperton Island': {
    countryCode: 'CP',
    regionKind: 'territory',
    expectedGate: 'complete-clipperton-atoll-anchor-required',
    repository: 'agid-open-cp-gazetteer',
    expectedNames: [
      'Île de La Passion-Clipperton',
      'Clipperton Atoll',
      'Clipperton Inner Lagoon',
      'Rocher de Clipperton',
      'French 12 NM Clipperton Territorial Sea',
      'French Exclusive Economic Zone (Clipperton Island)',
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
    operationalClass: 'postal-code-available-weak-api',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary'],
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
  test(`${countryName} plan is a complete source-linked P0 pack`, () => {
    const pack = PACKS[countryName];
    const plan = buildP0GazetteerRepositoryPlan(
      gap(countryName),
      45,
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
    assert.ok(plan.sources.length >= 5);

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

test('CL-DI complete pack avoids settlement, facility, landing, and delivery overclaims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Desventuradas Islands'), 45, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('civilian settlement')));
  assert.ok(countrySeed?.notes.some(note => note.includes('landing permission')));
  assert.ok(countrySeed?.notes.some(note => note.includes('delivery availability')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'San Félix Island' && seed.notes.some(note => note.includes('airfield operation'))));
});

test('CL-SG complete pack avoids settlement, freshwater, access, and permit overclaims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Salas y Gomez Island'), 46, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('settlement')));
  assert.ok(countrySeed?.notes.some(note => note.includes('freshwater availability')));
  assert.ok(countrySeed?.notes.some(note => note.includes('permit status')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Salas y Gómez Twin Rocks and Isthmus' && seed.notes.some(note => note.includes('tide'))));
});

test('CP complete pack avoids habitation, postal, landing, mooring, rescue, and legal-advice overclaims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Clipperton Island'), 47, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('habitation')));
  assert.ok(countrySeed?.notes.some(note => note.includes('landing permission')));
  assert.ok(countrySeed?.notes.some(note => note.includes('rescue availability')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'French Exclusive Economic Zone (Clipperton Island)' && seed.notes.some(note => note.includes('legal advice'))));
});
