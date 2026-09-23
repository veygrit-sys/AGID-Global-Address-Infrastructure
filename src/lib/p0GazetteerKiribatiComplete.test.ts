import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const KIRIBATI_DISTRICTS = [
  'Central Kiribati',
  'Line and Phoenix',
  'Northern Kiribati',
  'South Tarawa',
  'Southern Kiribati',
] as const;

const KIRIBATI_ISLANDS = [
  'Abaiang',
  'Abemama',
  'Aranuka',
  'Arorae',
  'Banaba',
  'Beru',
  'Birnie Island',
  'Butaritari',
  'Enderbury Island',
  'Flint Island',
  'Kanton Island',
  'Kiritimati',
  'Kuria',
  'Maiana',
  'Makin',
  'Malden Island',
  'Manra Island',
  'Marakei',
  'McKean Island',
  'Millennium Island',
  'Nikumaroro',
  'Nikunau',
  'Nonouti',
  'Onotoa',
  'Orona Island',
  'Rawaki Island',
  'Starbuck Island',
  'Tabiteuea',
  'Tabuaeran',
  'Tamana',
  'Tarawa Atoll',
  'Teraina',
  'Vostok Island',
] as const;

function kiGap(): GeoOssGapEntry {
  return {
    countryCode: 'KI',
    countryName: 'Kiribati',
    continent: 'oceania',
    relativePath: 'KI.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Fourteenth complete P0 country slice with all five Kiribati NSO district groupings and all 33 public island anchors.'],
    proposedOpenSourcePackages: ['agid-open-ki-gazetteer'],
    firstActions: ['Create a complete source-linked Kiribati district and all-island seed pack.'],
  };
}

test('KI plan is a complete source-linked National Statistics Office district and all-island pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(kiGap(), 21, new Date('2026-07-01T00:00:00Z'));
  const districtSeeds = plan.placeSeeds.filter(place => place.featureClass === 'district');
  const islandSeeds = plan.placeSeeds.filter(place => place.featureClass === 'island');
  const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(districtSeeds.length, 5);
  assert.equal(islandSeeds.length, 33);
  assert.equal(capitalSeeds.length, 1);
  assert.equal(capitalSeeds[0]?.name, 'Tarawa');
  assert.deepEqual(
    districtSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...KIRIBATI_DISTRICTS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.deepEqual(
    islandSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...KIRIBATI_ISLANDS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.ok(plan.releaseGates.includes('complete-nso-district-coverage-required'));
  assert.ok(plan.releaseGates.includes('complete-33-island-coverage-required'));
  assert.ok(plan.releaseGates.includes('all-33-islands-source-linked'));
  assert.ok(plan.releaseGates.includes('conformance-covers-all-districts-islands-and-capital'));
  assert.ok(plan.sources.some(source => source.id === 'kiribati-nso-districts'));
  assert.ok(plan.sources.some(source => source.id === 'kiribati-tourism-about'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-ki-admin'));

  for (const district of districtSeeds) {
    assert.equal(district.validationState, 'source-linked');
    assert.notEqual(district.approximateCentroid.lat, 0);
    assert.notEqual(district.approximateCentroid.lon, 0);
    assert.ok(district.geodataLinks.official);
    assert.ok(district.geodataLinks.geonames);
    assert.ok(district.notes.some(note => note.includes('Complete KI NSO district seed')));
    assert.ok(district.notes.some(note => note.includes('National Statistics Office district list:')));
    assert.ok(district.notes.some(note => note.includes('GeoNames cross-reference:')));
  }
  for (const island of islandSeeds) {
    assert.equal(island.validationState, 'source-linked');
    assert.notEqual(island.approximateCentroid.lat, 0);
    assert.notEqual(island.approximateCentroid.lon, 0);
    assert.ok(island.geodataLinks.official);
    assert.ok(island.geodataLinks.geonames);
    assert.ok(island.notes.some(note => note.includes('Complete KI all-island seed')));
    assert.ok(island.notes.some(note => note.includes('no legal boundary') || note.includes('no ward')));
  }
  assert.ok(capitalSeeds[0]?.notes.some(note => note.includes('GeoNames country metadata lists Tarawa as capital')));
});

test('generated KI repository files preserve complete district island and capital coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-ki-gazetteer');
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
  const islandSeeds = placeSeed.places.filter(place => place.featureClass === 'island');
  const capitalSeeds = placeSeed.places.filter(place => place.featureClass === 'capital');
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(districtSeeds.length, 5);
  assert.equal(islandSeeds.length, 33);
  assert.equal(capitalSeeds.length, 1);
  assert.deepEqual(
    districtSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...KIRIBATI_DISTRICTS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  assert.deepEqual(
    islandSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
    [...KIRIBATI_ISLANDS].sort((left, right) => left.localeCompare(right, 'en')),
  );
  for (const place of [...districtSeeds, ...islandSeeds, ...capitalSeeds]) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.equal(fixtures.vectors.length, 39);
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
