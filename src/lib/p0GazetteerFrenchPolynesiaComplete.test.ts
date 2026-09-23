import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const POLYNESIA_SUBDIVISIONS = [
  'Iles Australes',
  'Iles Marquises',
  'Iles Sous-le-Vent',
  'Iles Tuamotu-Gambier',
  'Iles du Vent',
] as const;

function pfGap(): GeoOssGapEntry {
  return {
    countryCode: 'PF',
    countryName: 'French Polynesia',
    continent: 'oceania',
    relativePath: 'PF.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'postal-code-available-weak-api',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Thirteenth complete P0 country slice with all five administrative subdivisions.'],
    proposedOpenSourcePackages: ['agid-open-pf-gazetteer'],
    firstActions: ['Create a complete source-linked French Polynesia administrative subdivision seed pack.'],
  };
}

test('PF plan is a complete source-linked administrative subdivision pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(pfGap(), 20, new Date('2026-07-01T00:00:00Z'));
  const subdivisionSeeds = plan.placeSeeds.filter(place => place.featureClass === 'region');
  const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(subdivisionSeeds.length, 5);
  assert.equal(capitalSeeds.length, 1);
  assert.equal(capitalSeeds[0]?.name, 'Papeete');
  assert.deepEqual(
    subdivisionSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'fr')),
    [...POLYNESIA_SUBDIVISIONS].sort((left, right) => left.localeCompare(right, 'fr')),
  );
  assert.ok(plan.releaseGates.includes('complete-administrative-subdivision-coverage-required'));
  assert.ok(plan.releaseGates.includes('commune-level-pack-deferred'));
  assert.ok(plan.releaseGates.includes('conformance-covers-all-subdivisions-and-capital'));
  assert.ok(plan.sources.some(source => source.id === 'pref-polynesia-communes-archipels'));
  assert.ok(plan.sources.some(source => source.id === 'pref-polynesia-subdivisions'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-pf-admin'));

  for (const subdivision of subdivisionSeeds) {
    assert.equal(subdivision.validationState, 'source-linked');
    assert.notEqual(subdivision.approximateCentroid.lat, 0);
    assert.notEqual(subdivision.approximateCentroid.lon, 0);
    assert.ok(subdivision.geodataLinks.official);
    assert.ok(subdivision.geodataLinks.geonames);
    assert.ok(subdivision.notes.some(note => note.includes('Complete PF administrative subdivision seed')));
    assert.ok(subdivision.notes.some(note => note.includes('GeoNames administrative code:')));
    assert.ok(subdivision.notes.some(note => note.includes('Commune coverage count in prefecture source:')));
  }
  assert.ok(capitalSeeds[0]?.notes.some(note => note.includes('GeoNames country metadata lists Papeete as capital')));
});

test('generated PF repository files preserve complete subdivision and capital coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-pf-gazetteer');
  const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
    places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
  };
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
    counts: { placeSeeds: number; sources: number };
  };
  const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
    vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
  };

  const subdivisionSeeds = placeSeed.places.filter(place => place.featureClass === 'region');
  const capitalSeeds = placeSeed.places.filter(place => place.featureClass === 'capital');
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(subdivisionSeeds.length, 5);
  assert.equal(capitalSeeds.length, 1);
  assert.deepEqual(
    subdivisionSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'fr')),
    [...POLYNESIA_SUBDIVISIONS].sort((left, right) => left.localeCompare(right, 'fr')),
  );
  for (const place of [...subdivisionSeeds, ...capitalSeeds]) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.equal(fixtures.vectors.length, 6);
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
