import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const WALLIS_FUTUNA_CHIEFDOMS = [
  'Alo',
  'Sigave',
  'Uvea',
] as const;

function wfGap(): GeoOssGapEntry {
  return {
    countryCode: 'WF',
    countryName: 'Wallis and Futuna',
    continent: 'oceania',
    relativePath: 'WF.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Seventh complete P0 country slice with chiefdom/customary-kingdom coverage.'],
    proposedOpenSourcePackages: ['agid-open-wf-gazetteer'],
    firstActions: ['Create a complete source-linked chiefdom seed pack.'],
  };
}

test('WF plan is a complete source-linked chiefdom pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(wfGap(), 19, new Date('2026-07-01T00:00:00Z'));
  const chiefdomSeeds = plan.placeSeeds.filter(place => place.featureClass === 'chiefdom');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(chiefdomSeeds.length, 3);
  assert.deepEqual(
    chiefdomSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...WALLIS_FUTUNA_CHIEFDOMS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(plan.releaseGates.includes('complete-chiefdom-coverage-required'));
  assert.ok(plan.sources.some(source => source.id === 'wallis-futuna-institutional-organization'));
  assert.ok(plan.sources.some(source => source.id === 'wallis-futuna-culture-heritage'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-wf-admin'));

  for (const place of chiefdomSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('GeoNames administrative code:')));
    assert.ok(place.notes.some(note => note.includes('GeoNames subentity code:')));
  }
});

test('generated WF repository files preserve complete chiefdom coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-wf-gazetteer');
  const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
    places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
  };
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
    counts: { placeSeeds: number; sources: number };
  };
  const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
    vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
  };

  const chiefdomSeeds = placeSeed.places.filter(place => place.featureClass === 'chiefdom');
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(chiefdomSeeds.length, 3);
  assert.deepEqual(
    chiefdomSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...WALLIS_FUTUNA_CHIEFDOMS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  for (const place of chiefdomSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
