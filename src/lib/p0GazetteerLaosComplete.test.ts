import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const LAOS_FIRST_ORDER = [
  'Attapu',
  'Bokeo',
  'Bolikhamxai',
  'Champasak',
  'Houaphan',
  'Khammouan',
  'Louang Namtha',
  'Louangphabang',
  'Oudomxai',
  'Phongsali',
  'Salavan',
  'Savannakhet',
  'Vientiane Capital',
  'Vientiane Province',
  'Xaignabouli',
  'Xaisomboun',
  'Xekong',
  'Xiangkhoang',
] as const;

function laGap(): GeoOssGapEntry {
  return {
    countryCode: 'LA',
    countryName: 'Laos',
    continent: 'asia',
    relativePath: 'LA.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'postal-code-available-weak-api',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Sixteenth complete P0 country slice with all 18 Laos first-order divisions.'],
    proposedOpenSourcePackages: ['agid-open-la-gazetteer'],
    firstActions: ['Create a complete source-linked Laos first-order division seed pack.'],
  };
}

test('LA plan is a complete source-linked first-order division pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(laGap(), 12, new Date('2026-07-01T00:00:00Z'));
  const firstOrderSeeds = plan.placeSeeds.filter(place => (
    place.featureClass === 'province' || place.featureClass === 'capital'
  ));
  const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
  const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(firstOrderSeeds.length, 18);
  assert.equal(provinceSeeds.length, 17);
  assert.equal(capitalSeeds.length, 1);
  assert.equal(capitalSeeds[0]?.name, 'Vientiane Capital');
  assert.ok(provinceSeeds.some(place => place.name === 'Vientiane Province'));
  assert.ok(!plan.placeSeeds.some(place => place.name === 'Vientiane'));
  assert.deepEqual(
    firstOrderSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...LAOS_FIRST_ORDER].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(plan.releaseGates.includes('complete-first-order-coverage-required'));
  assert.ok(plan.releaseGates.includes('vientiane-capital-province-disambiguated'));
  assert.ok(plan.releaseGates.includes('second-order-pack-deferred'));
  assert.ok(plan.releaseGates.includes('conformance-covers-all-first-order-divisions'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-la-admin'));
  assert.ok(plan.sources.some(source => source.id === 'openfactbook-la'));
  assert.ok(plan.sources.some(source => source.id === 'open-development-mekong-la-boundaries'));

  for (const place of firstOrderSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('Complete LA first-order seed')));
    assert.ok(place.notes.some(note => note.includes('first-order type:')));
    assert.ok(place.notes.some(note => note.includes('OpenFactBook administrative division list:')));
    assert.ok(place.notes.some(note => note.includes('GeoNames subdivision listing row:')));
  }
  assert.ok(firstOrderSeeds.some(place => (
    place.name === 'Vientiane Province' &&
    place.notes.some(note => note.includes('avoid collision with Vientiane Capital'))
  )));
  assert.ok(capitalSeeds[0]?.notes.some(note => note.includes('GeoNames country metadata lists Vientiane as capital')));
});

test('generated LA repository files preserve complete first-order coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-la-gazetteer');
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
    place.featureClass === 'province' || place.featureClass === 'capital'
  ));
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(firstOrderSeeds.length, 18);
  assert.deepEqual(
    firstOrderSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...LAOS_FIRST_ORDER].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(qualityGates.gates.some(gate => gate.id === 'vientiane-capital-province-disambiguated' && gate.required));
  for (const place of firstOrderSeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.equal(fixtures.vectors.length, 18);
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
