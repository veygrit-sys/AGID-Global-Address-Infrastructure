import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const NORTH_KOREA_FIRST_ORDER = [
  'Chagang',
  'Kaesong',
  'Kangwon',
  'Nampo',
  'North Hamgyong',
  'North Hwanghae',
  'North Pyongan',
  'Pyongyang',
  'Rason',
  'Ryanggang',
  'South Hamgyong',
  'South Hwanghae',
  'South Pyongan',
] as const;

function kpGap(): GeoOssGapEntry {
  return {
    countryCode: 'KP',
    countryName: 'North Korea',
    continent: 'asia',
    relativePath: 'KP.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'postal-code-available-weak-api',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Fifteenth complete P0 country slice with all 13 North Korea first-order divisions.'],
    proposedOpenSourcePackages: ['agid-open-kp-gazetteer'],
    firstActions: ['Create a complete source-linked North Korea first-order division seed pack.'],
  };
}

test('KP plan is a complete source-linked first-order division pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(kpGap(), 11, new Date('2026-07-01T00:00:00Z'));
  const firstOrderSeeds = plan.placeSeeds.filter(place => (
    place.featureClass === 'province' || place.featureClass === 'special-region' || place.featureClass === 'capital'
  ));
  const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
  const specialCitySeeds = plan.placeSeeds.filter(place => (
    place.featureClass === 'special-region' || place.featureClass === 'capital'
  ));
  const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(firstOrderSeeds.length, 13);
  assert.equal(provinceSeeds.length, 9);
  assert.equal(specialCitySeeds.length, 4);
  assert.equal(capitalSeeds.length, 1);
  assert.equal(capitalSeeds[0]?.name, 'Pyongyang');
  assert.deepEqual(
    firstOrderSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...NORTH_KOREA_FIRST_ORDER].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(plan.releaseGates.includes('complete-first-order-coverage-required'));
  assert.ok(plan.releaseGates.includes('pcgn-status-note-required'));
  assert.ok(plan.releaseGates.includes('no-second-order-overclaim'));
  assert.ok(plan.releaseGates.includes('conformance-covers-all-first-order-divisions'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-kp-admin'));
  assert.ok(plan.sources.some(source => source.id === 'openfactbook-kp'));
  assert.ok(plan.sources.some(source => source.id === 'pcgn-kp-admin-update'));

  for (const place of firstOrderSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('Complete KP first-order seed')));
    assert.ok(place.notes.some(note => note.includes('first-order type:')));
    assert.ok(place.notes.some(note => note.includes('OpenFactBook administrative division list:')));
    assert.ok(place.notes.some(note => note.includes('GeoNames subdivision listing row:')));
  }
  assert.ok(firstOrderSeeds.some(place => (
    place.name === 'Kaesong' &&
    place.notes.some(note => note.includes('PCGN notes Kaesŏng first-order status was reinstated in 2019'))
  )));
});

test('generated KP repository files preserve complete first-order coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-kp-gazetteer');
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

  const firstOrderSeeds = placeSeed.places.filter(place => (
    place.featureClass === 'province' || place.featureClass === 'special-region' || place.featureClass === 'capital'
  ));
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(firstOrderSeeds.length, 13);
  assert.deepEqual(
    firstOrderSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...NORTH_KOREA_FIRST_ORDER].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(qualityGates.gates.some(gate => gate.id === 'no-second-order-overclaim' && gate.required));
  for (const place of firstOrderSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.equal(fixtures.vectors.length, 13);
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
