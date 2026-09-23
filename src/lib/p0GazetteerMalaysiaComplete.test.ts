import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const MALAYSIA_FIRST_ORDER_DIVISIONS = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Labuan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
] as const;

const MALAYSIA_FEDERAL_TERRITORIES = [
  'Kuala Lumpur',
  'Labuan',
  'Putrajaya',
] as const;

function myGap(): GeoOssGapEntry {
  return {
    countryCode: 'MY',
    countryName: 'Malaysia',
    continent: 'asia',
    relativePath: 'MY.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'postal-code-available-weak-api',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Eleventh complete P0 country slice with first-order state and federal territory coverage.'],
    proposedOpenSourcePackages: ['agid-open-my-gazetteer'],
    firstActions: ['Create a complete source-linked first-order administrative division seed pack.'],
  };
}

test('MY plan is a complete source-linked first-order division pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(myGap(), 16, new Date('2026-07-01T00:00:00Z'));
  const firstOrderSeeds = plan.placeSeeds.filter(place => (
    place.featureClass === 'state' || place.featureClass === 'special-region'
  ));
  const stateSeeds = plan.placeSeeds.filter(place => place.featureClass === 'state');
  const federalTerritorySeeds = plan.placeSeeds.filter(place => place.featureClass === 'special-region');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(firstOrderSeeds.length, 16);
  assert.equal(stateSeeds.length, 13);
  assert.equal(federalTerritorySeeds.length, 3);
  assert.deepEqual(
    firstOrderSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...MALAYSIA_FIRST_ORDER_DIVISIONS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.deepEqual(
    federalTerritorySeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...MALAYSIA_FEDERAL_TERRITORIES].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(plan.releaseGates.includes('complete-first-order-coverage-required'));
  assert.ok(plan.releaseGates.includes('all-states-and-federal-territories-source-linked'));
  assert.ok(plan.releaseGates.includes('conformance-covers-all-first-order-divisions'));
  assert.ok(plan.sources.some(source => source.id === 'mygeoportal-upi-land-admin-codes'));
  assert.ok(plan.sources.some(source => source.id === 'dosm-my-local-stats-state-district'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-my-admin'));

  for (const place of firstOrderSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('Complete MY first-order seed')));
    assert.ok(place.notes.some(note => note.includes('first-order type:')));
    assert.ok(place.notes.some(note => note.includes('ISO 3166-2 subdivision code:')));
    assert.ok(place.notes.some(note => note.includes('GeoNames administrative code:')));
  }
  assert.ok(federalTerritorySeeds.some(place => (
    place.name === 'Kuala Lumpur' &&
    place.notes.some(note => note.includes('national capital'))
  )));
});

test('generated MY repository files preserve complete first-order coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-my-gazetteer');
  const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
    places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
  };
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
    counts: { placeSeeds: number; sources: number };
  };
  const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
    vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
  };

  const firstOrderSeeds = placeSeed.places.filter(place => (
    place.featureClass === 'state' || place.featureClass === 'special-region'
  ));
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(firstOrderSeeds.length, 16);
  assert.deepEqual(
    firstOrderSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...MALAYSIA_FIRST_ORDER_DIVISIONS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  for (const place of firstOrderSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.equal(fixtures.vectors.length, 16);
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
