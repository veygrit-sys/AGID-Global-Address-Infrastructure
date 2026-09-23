import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const LUXEMBOURG_CANTONS = [
  'Capellen',
  'Clervaux',
  'Diekirch',
  'Echternach',
  'Esch-sur-Alzette',
  'Grevenmacher',
  'Luxembourg Canton',
  'Mersch',
  'Redange-sur-Attert',
  'Remich',
  'Vianden',
  'Wiltz',
] as const;

function luGap(): GeoOssGapEntry {
  return {
    countryCode: 'LU',
    countryName: 'Luxembourg',
    continent: 'europe',
    relativePath: 'LU.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Fifth complete P0 country slice with canton-level coverage.'],
    proposedOpenSourcePackages: ['agid-open-lu-gazetteer'],
    firstActions: ['Create a complete source-linked canton seed pack.'],
  };
}

test('LU plan is a complete source-linked canton pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(luGap(), 13, new Date('2026-07-01T00:00:00Z'));
  const cantonSeeds = plan.placeSeeds.filter(place => place.featureClass === 'canton');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(cantonSeeds.length, 12);
  assert.deepEqual(
    cantonSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'fr')),
    [...LUXEMBOURG_CANTONS].sort((left, right) => left.localeCompare(right, 'fr')),
  );
  assert.ok(plan.releaseGates.includes('complete-canton-coverage-required'));
  assert.ok(plan.sources.some(source => source.id === 'luxembourg-public-territory'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-lu-admin'));

  for (const place of cantonSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('GeoNames administrative code:')));
    assert.ok(place.notes.some(note => note.includes('ISO 3166-2 subdivision code:')));
  }
});

test('generated LU repository files preserve complete canton coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-lu-gazetteer');
  const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
    places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
  };
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
    counts: { placeSeeds: number; sources: number };
  };
  const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
    vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
  };

  const cantonSeeds = placeSeed.places.filter(place => place.featureClass === 'canton');
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(cantonSeeds.length, 12);
  assert.deepEqual(
    cantonSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'fr')),
    [...LUXEMBOURG_CANTONS].sort((left, right) => left.localeCompare(right, 'fr')),
  );
  for (const place of cantonSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
