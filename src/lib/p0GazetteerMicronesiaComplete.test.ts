import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const MICRONESIA_STATES = [
  'Chuuk',
  'Kosrae',
  'Pohnpei',
  'Yap',
] as const;

function fmGap(): GeoOssGapEntry {
  return {
    countryCode: 'FM',
    countryName: 'Micronesia',
    continent: 'oceania',
    relativePath: 'FM.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Fourth complete P0 country slice with state-level coverage.'],
    proposedOpenSourcePackages: ['agid-open-fm-gazetteer'],
    firstActions: ['Create a complete source-linked state seed pack.'],
  };
}

test('FM plan is a complete source-linked state pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(fmGap(), 5, new Date('2026-07-01T00:00:00Z'));
  const stateSeeds = plan.placeSeeds.filter(place => place.featureClass === 'state');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(stateSeeds.length, 4);
  assert.deepEqual(
    stateSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...MICRONESIA_STATES].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(plan.releaseGates.includes('complete-state-coverage-required'));
  assert.ok(plan.sources.some(source => source.id === 'fsm-government'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-fm-admin'));

  for (const place of stateSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('GeoNames administrative code:')));
    assert.ok(place.notes.some(note => note.includes('ISO 3166-2 subdivision code:')));
  }
});

test('generated FM repository files preserve complete state coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-fm-gazetteer');
  const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
    places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
  };
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
    counts: { placeSeeds: number; sources: number };
  };
  const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
    vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
  };

  const stateSeeds = placeSeed.places.filter(place => place.featureClass === 'state');
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(stateSeeds.length, 4);
  assert.deepEqual(
    stateSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...MICRONESIA_STATES].sort((left, right) => left.localeCompare(right, 'en')),
  );
  for (const place of stateSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
