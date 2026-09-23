import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const NEW_CALEDONIA_PROVINCES = [
  'Loyalty Islands Province',
  'North Province',
  'South Province',
] as const;

function ncGap(): GeoOssGapEntry {
  return {
    countryCode: 'NC',
    countryName: 'New Caledonia',
    continent: 'oceania',
    relativePath: 'NC.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Sixth complete P0 country slice with province-level coverage.'],
    proposedOpenSourcePackages: ['agid-open-nc-gazetteer'],
    firstActions: ['Create a complete source-linked province seed pack.'],
  };
}

test('NC plan is a complete source-linked province pack without ISO over-claiming', () => {
  const plan = buildP0GazetteerRepositoryPlan(ncGap(), 18, new Date('2026-07-01T00:00:00Z'));
  const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(provinceSeeds.length, 3);
  assert.deepEqual(
    provinceSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...NEW_CALEDONIA_PROVINCES].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(plan.releaseGates.includes('complete-province-coverage-required'));
  assert.ok(plan.sources.some(source => source.id === 'new-caledonia-government-provinces'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-nc-admin'));

  for (const place of provinceSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('GeoNames administrative code:')));
    assert.ok(place.notes.some(note => note.includes('GeoNames subentity code:')));
    assert.ok(!place.notes.some(note => note.includes('ISO 3166-2 subdivision code:')));
  }
});

test('generated NC repository files preserve complete province coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-nc-gazetteer');
  const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
    places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
  };
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
    counts: { placeSeeds: number; sources: number };
  };
  const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
    vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
  };

  const provinceSeeds = placeSeed.places.filter(place => place.featureClass === 'province');
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(provinceSeeds.length, 3);
  assert.deepEqual(
    provinceSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...NEW_CALEDONIA_PROVINCES].sort((left, right) => left.localeCompare(right, 'en')),
  );
  for (const place of provinceSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
