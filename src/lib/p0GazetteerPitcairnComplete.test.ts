import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const PITCAIRN_ISLANDS = [
  'Ducie Island',
  'Henderson Island',
  'Oeno Island',
  'Pitcairn Island',
] as const;

function pnGap(): GeoOssGapEntry {
  return {
    countryCode: 'PN',
    countryName: 'Pitcairn Islands',
    continent: 'oceania',
    relativePath: 'PN.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Eighth complete P0 country slice with full Pitcairn island-group coverage.'],
    proposedOpenSourcePackages: ['agid-open-pn-gazetteer'],
    firstActions: ['Create a complete source-linked island-group seed pack.'],
  };
}

test('PN plan is a complete source-linked island-group pack without admin-division overclaiming', () => {
  const plan = buildP0GazetteerRepositoryPlan(pnGap(), 23, new Date('2026-07-01T00:00:00Z'));
  const islandSeeds = plan.placeSeeds.filter(place => place.featureClass === 'island');
  const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(islandSeeds.length, 4);
  assert.equal(capitalSeeds.length, 1);
  assert.equal(capitalSeeds[0]?.name, 'Adamstown');
  assert.deepEqual(
    islandSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...PITCAIRN_ISLANDS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(plan.releaseGates.includes('complete-island-coverage-required'));
  assert.ok(plan.releaseGates.includes('no-admin-division-overclaim'));
  assert.ok(plan.sources.some(source => source.id === 'pitcairn-government-home'));
  assert.ok(plan.sources.some(source => source.id === 'visit-pitcairn-islands'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-pn-country'));
  assert.ok(plan.sources.some(source => source.id === 'statoids-pn'));

  for (const place of islandSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('Complete PN island seed')));
    assert.ok(place.notes.some(note => note.includes('No administrative division code claimed')));
  }
  assert.ok(capitalSeeds[0]?.notes.some(note => note.includes('GeoNames country metadata lists Adamstown as capital')));
});

test('generated PN repository files preserve complete island and capital coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-pn-gazetteer');
  const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
    places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
  };
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
    counts: { placeSeeds: number; sources: number };
  };
  const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
    vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
  };

  const islandSeeds = placeSeed.places.filter(place => place.featureClass === 'island');
  const capitalSeeds = placeSeed.places.filter(place => place.featureClass === 'capital');
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(islandSeeds.length, 4);
  assert.equal(capitalSeeds.length, 1);
  assert.equal(capitalSeeds[0]?.name, 'Adamstown');
  assert.deepEqual(
    islandSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...PITCAIRN_ISLANDS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  for (const place of [...islandSeeds, ...capitalSeeds]) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
