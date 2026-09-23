import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const MARSHALL_DISTRICTS = [
  'Ailinglaplap',
  'Ailuk',
  'Arno',
  'Aur',
  'Bikini and Kili',
  'Ebon',
  'Enewetak and Ujelang',
  'Jabat',
  'Jaluit',
  'Kwajalein',
  'Lae',
  'Lib',
  'Likiep',
  'Majuro',
  'Maloelap',
  'Mejit',
  'Mili',
  'Namdrik',
  'Namu',
  'Rongelap',
  'Ujae',
  'Utrik',
  'Wotho',
  'Wotje',
] as const;

const MARSHALL_ATOLL_ISLAND_ANCHORS = [
  'Ailinglaplap Atoll',
  'Ailuk Atoll',
  'Ailinginae Atoll',
  'Arno Atoll',
  'Aur Atoll',
  'Bikar Atoll',
  'Bikini Atoll',
  'Bokak Atoll',
  'Ebon Atoll',
  'Enewetak Atoll',
  'Erikub Atoll',
  'Jabat Island',
  'Jaluit Atoll',
  'Jemo Island',
  'Kili Island',
  'Kwajalein Atoll',
  'Lae Atoll',
  'Lib Island',
  'Likiep Atoll',
  'Majuro Atoll',
  'Maloelap Atoll',
  'Mejit Island',
  'Mili Atoll',
  'Nadikdik Atoll',
  'Namdrik Atoll',
  'Namu Atoll',
  'Rongerik Atoll',
  'Rongelap Atoll',
  'Taka Atoll',
  'Ujae Atoll',
  'Ujelang Atoll',
  'Utrik Atoll',
  'Wotho Atoll',
  'Wotje Atoll',
] as const;

function mhGap(): GeoOssGapEntry {
  return {
    countryCode: 'MH',
    countryName: 'Marshall Islands',
    continent: 'oceania',
    relativePath: 'MH.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Tenth complete P0 country slice with constitutional district coverage.'],
    proposedOpenSourcePackages: ['agid-open-mh-gazetteer'],
    firstActions: ['Create a complete source-linked constitutional district seed pack.'],
  };
}

test('MH plan is a complete source-linked constitutional district pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(mhGap(), 10, new Date('2026-07-01T00:00:00Z'));
  const municipalitySeeds = plan.placeSeeds.filter(place => place.featureClass === 'municipality');
  const islandSeeds = plan.placeSeeds.filter(place => place.featureClass === 'island');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(municipalitySeeds.length, 24);
  assert.equal(islandSeeds.length, 34);
  assert.deepEqual(
    municipalitySeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...MARSHALL_DISTRICTS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.deepEqual(
    islandSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...MARSHALL_ATOLL_ISLAND_ANCHORS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(plan.releaseGates.includes('complete-constitutional-district-coverage-required'));
  assert.ok(plan.releaseGates.includes('combined-districts-not-split'));
  assert.ok(plan.releaseGates.includes('atoll-island-anchor-layer-present'));
  assert.ok(plan.releaseGates.includes('combined-district-municipality-non-splitting-preserved'));
  assert.ok(plan.releaseGates.includes('no-all-islets-overclaim'));
  assert.ok(plan.releaseGates.includes('conformance-covers-all-constitutional-districts-and-atoll-island-anchors'));
  assert.ok(plan.sources.some(source => source.id === 'marshall-constitution-electoral-districts'));
  assert.ok(plan.sources.some(source => source.id === 'marshall-local-government-constitutions'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-mh-country'));

  for (const place of municipalitySeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('Complete MH municipality seed')));
    assert.ok(place.notes.some(note => note.includes('Constitutional electoral district:')));
    assert.ok(place.notes.some(note => note.includes('chain:')));
  }
  assert.ok(municipalitySeeds.some(place => place.name === 'Bikini and Kili'));
  assert.ok(municipalitySeeds.some(place => place.name === 'Enewetak and Ujelang'));
  assert.ok(municipalitySeeds.some(place => place.name === 'Majuro'));
  for (const island of islandSeeds) {
    assert.equal(island.validationState, 'source-linked');
    assert.notEqual(island.approximateCentroid.lat, 0);
    assert.notEqual(island.approximateCentroid.lon, 0);
    assert.ok(island.geodataLinks.official);
    assert.ok(island.geodataLinks.geonames);
    assert.ok(island.notes.some(note => note.includes('MH atoll/island anchor seed')));
    assert.ok(island.notes.some(note => note.includes('not complete all-islet coverage') || note.includes('does not split governance')));
    assert.ok(island.notes.some(note => note.includes('No legal boundary')));
  }
  assert.ok(islandSeeds.some(place => place.name === 'Bikini Atoll'));
  assert.ok(islandSeeds.some(place => place.name === 'Kili Island'));
  assert.ok(islandSeeds.some(place => place.name === 'Enewetak Atoll'));
  assert.ok(islandSeeds.some(place => place.name === 'Ujelang Atoll'));
  assert.ok(islandSeeds.some(place => place.name === 'Erikub Atoll'));
  assert.ok(islandSeeds.some(place => place.name === 'Jemo Island'));
  assert.ok(islandSeeds.some(place => place.name === 'Taka Atoll'));
  assert.ok(islandSeeds.some(place => place.name === 'Bikar Atoll'));
  assert.ok(islandSeeds.some(place => place.name === 'Bokak Atoll'));
});

test('generated MH repository files preserve complete constitutional district coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-mh-gazetteer');
  const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
    places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
  };
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
    counts: { placeSeeds: number; sources: number };
  };
  const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
    vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
  };

  const municipalitySeeds = placeSeed.places.filter(place => place.featureClass === 'municipality');
  const islandSeeds = placeSeed.places.filter(place => place.featureClass === 'island');
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(municipalitySeeds.length, 24);
  assert.equal(islandSeeds.length, 34);
  assert.deepEqual(
    municipalitySeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...MARSHALL_DISTRICTS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.deepEqual(
    islandSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...MARSHALL_ATOLL_ISLAND_ANCHORS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  for (const place of [...municipalitySeeds, ...islandSeeds]) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.equal(fixtures.vectors.length, 58);
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
