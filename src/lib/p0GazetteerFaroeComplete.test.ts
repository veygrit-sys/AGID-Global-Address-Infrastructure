import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const FAROE_MAIN_ISLANDS = [
  'Borðoy',
  'Eysturoy',
  'Fugloy',
  'Hestur',
  'Kalsoy',
  'Koltur',
  'Kunoy',
  'Lítla Dímun',
  'Mykines',
  'Nólsoy',
  'Sandoy',
  'Skúvoy',
  'Stóra Dímun',
  'Streymoy',
  'Suðuroy',
  'Svínoy',
  'Vágar',
  'Viðoy',
] as const;

function foGap(): GeoOssGapEntry {
  return {
    countryCode: 'FO',
    countryName: 'Faroe Islands',
    continent: 'europe',
    relativePath: 'FO.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Ninth complete P0 country slice with full Faroe main-island coverage.'],
    proposedOpenSourcePackages: ['agid-open-fo-gazetteer'],
    firstActions: ['Create a complete source-linked main-island seed pack.'],
  };
}

test('FO plan is a complete source-linked main-island pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(foGap(), 6, new Date('2026-07-01T00:00:00Z'));
  const islandSeeds = plan.placeSeeds.filter(place => place.featureClass === 'island');
  const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(islandSeeds.length, 18);
  assert.equal(capitalSeeds.length, 1);
  assert.equal(capitalSeeds[0]?.name, 'Tórshavn');
  assert.deepEqual(
    islandSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'fo')),
    [...FAROE_MAIN_ISLANDS].sort((left, right) => left.localeCompare(right, 'fo')),
  );
  assert.ok(plan.releaseGates.includes('complete-main-island-coverage-required'));
  assert.ok(plan.releaseGates.includes('smaller-islets-not-overclaimed'));
  assert.ok(plan.sources.some(source => source.id === 'faroe-government-about'));
  assert.ok(plan.sources.some(source => source.id === 'faroe-statistics-islands'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-fo-country'));

  for (const place of islandSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('Complete FO main-island seed')));
  }
  assert.ok(capitalSeeds[0]?.notes.some(note => note.includes('GeoNames country metadata lists Tórshavn as capital')));
});

test('generated FO repository files preserve complete island and capital coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-fo-gazetteer');
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
  assert.equal(islandSeeds.length, 18);
  assert.equal(capitalSeeds.length, 1);
  assert.equal(capitalSeeds[0]?.name, 'Tórshavn');
  assert.deepEqual(
    islandSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'fo')),
    [...FAROE_MAIN_ISLANDS].sort((left, right) => left.localeCompare(right, 'fo')),
  );
  for (const place of [...islandSeeds, ...capitalSeeds]) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
