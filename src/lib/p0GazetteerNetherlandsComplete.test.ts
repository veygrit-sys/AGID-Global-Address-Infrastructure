import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const NETHERLANDS_PROVINCES = [
  'Drenthe',
  'Flevoland',
  'Friesland',
  'Gelderland',
  'Groningen',
  'Limburg',
  'Noord-Brabant',
  'Noord-Holland',
  'Overijssel',
  'Utrecht',
  'Zeeland',
  'Zuid-Holland',
] as const;

const NETHERLANDS_BES_PUBLIC_BODIES = [
  'Bonaire',
  'Saba',
  'Sint Eustatius',
] as const;

function nlGap(): GeoOssGapEntry {
  return {
    countryCode: 'NL',
    countryName: 'Netherlands',
    continent: 'europe',
    relativePath: 'NL.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'postal-code-available-weak-api',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['Twelfth complete P0 country slice with European provinces and Caribbean Netherlands public bodies.'],
    proposedOpenSourcePackages: ['agid-open-nl-gazetteer'],
    firstActions: ['Create a complete source-linked Netherlands province and BES public body seed pack.'],
  };
}

test('NL plan is a complete source-linked province and BES public body pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(nlGap(), 18, new Date('2026-07-01T00:00:00Z'));
  const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
  const specialRegionSeeds = plan.placeSeeds.filter(place => place.featureClass === 'special-region');
  const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(provinceSeeds.length, 12);
  assert.equal(specialRegionSeeds.length, 3);
  assert.equal(capitalSeeds.length, 1);
  assert.equal(capitalSeeds[0]?.name, 'Amsterdam');
  assert.deepEqual(
    provinceSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'nl')),
    [...NETHERLANDS_PROVINCES].sort((left, right) => left.localeCompare(right, 'nl')),
  );
  assert.deepEqual(
    specialRegionSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'nl')),
    [...NETHERLANDS_BES_PUBLIC_BODIES].sort((left, right) => left.localeCompare(right, 'nl')),
  );
  assert.ok(plan.releaseGates.includes('complete-province-and-bes-coverage-required'));
  assert.ok(plan.releaseGates.includes('bes-public-bodies-recorded'));
  assert.ok(plan.releaseGates.includes('no-bes-province-overclaim'));
  assert.ok(plan.releaseGates.includes('conformance-covers-provinces-bes-and-capital'));
  assert.ok(plan.sources.some(source => source.id === 'government-nl-provinces'));
  assert.ok(plan.sources.some(source => source.id === 'government-nl-bes-governance'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-nl-admin'));

  for (const province of provinceSeeds) {
    assert.equal(province.validationState, 'source-linked');
    assert.notEqual(province.approximateCentroid.lat, 0);
    assert.notEqual(province.approximateCentroid.lon, 0);
    assert.ok(province.geodataLinks.official);
    assert.ok(province.geodataLinks.geonames);
    assert.ok(province.notes.some(note => note.includes('Complete NL province seed')));
    assert.ok(province.notes.some(note => note.includes('ISO 3166-2 subdivision code: NL-')));
    assert.ok(province.notes.some(note => note.includes('GeoNames administrative code:')));
  }
  for (const specialRegion of specialRegionSeeds) {
    assert.equal(specialRegion.validationState, 'source-linked');
    assert.notEqual(specialRegion.approximateCentroid.lat, 0);
    assert.notEqual(specialRegion.approximateCentroid.lon, 0);
    assert.ok(specialRegion.geodataLinks.official);
    assert.ok(specialRegion.geodataLinks.geonames);
    assert.ok(specialRegion.notes.some(note => note.includes('Complete NL Caribbean public body seed')));
    assert.ok(specialRegion.notes.some(note => note.includes('not part of a Dutch province')));
    assert.ok(!specialRegion.notes.some(note => note.includes('ISO 3166-2 subdivision code: NL-')));
  }
  assert.ok(capitalSeeds[0]?.notes.some(note => note.includes('GeoNames country metadata lists Amsterdam as capital')));
});

test('generated NL repository files preserve complete province, BES, and capital coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-nl-gazetteer');
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
  const specialRegionSeeds = placeSeed.places.filter(place => place.featureClass === 'special-region');
  const capitalSeeds = placeSeed.places.filter(place => place.featureClass === 'capital');
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(provinceSeeds.length, 12);
  assert.equal(specialRegionSeeds.length, 3);
  assert.equal(capitalSeeds.length, 1);
  assert.deepEqual(
    provinceSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'nl')),
    [...NETHERLANDS_PROVINCES].sort((left, right) => left.localeCompare(right, 'nl')),
  );
  assert.deepEqual(
    specialRegionSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'nl')),
    [...NETHERLANDS_BES_PUBLIC_BODIES].sort((left, right) => left.localeCompare(right, 'nl')),
  );
  for (const place of [...provinceSeeds, ...specialRegionSeeds, ...capitalSeeds]) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.equal(fixtures.vectors.length, 16);
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
