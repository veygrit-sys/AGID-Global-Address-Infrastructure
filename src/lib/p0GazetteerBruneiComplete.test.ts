import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const BRUNEI_DISTRICTS = [
  'Belait',
  'Brunei-Muara',
  'Temburong',
  'Tutong',
] as const;

function bnGap(): GeoOssGapEntry {
  return {
    countryCode: 'BN',
    countryName: 'Brunei Darussalam',
    continent: 'asia',
    relativePath: 'BN.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Third complete P0 country slice with district-level coverage.'],
    proposedOpenSourcePackages: ['agid-open-bn-gazetteer'],
    firstActions: ['Create a complete source-linked district seed pack.'],
  };
}

test('BN plan is a complete source-linked district pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(bnGap(), 3, new Date('2026-07-01T00:00:00Z'));
  const districtSeeds = plan.placeSeeds.filter(place => place.featureClass === 'district');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(districtSeeds.length, 4);
  assert.deepEqual(
    districtSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...BRUNEI_DISTRICTS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(plan.releaseGates.includes('complete-district-coverage-required'));
  assert.ok(plan.sources.some(source => source.id === 'brunei-information-department'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-bn-admin'));

  for (const place of districtSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('GeoNames administrative code:')));
    assert.ok(place.notes.some(note => note.includes('ISO 3166-2 subdivision code:')));
  }
});

test('generated BN repository files preserve complete district coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-bn-gazetteer');
  const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
    places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
  };
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
    counts: { placeSeeds: number; sources: number };
  };
  const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
    vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
  };

  const districtSeeds = placeSeed.places.filter(place => place.featureClass === 'district');
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(districtSeeds.length, 4);
  assert.deepEqual(
    districtSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...BRUNEI_DISTRICTS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  for (const place of districtSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
