import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const AX_MUNICIPALITIES = [
  'Brändö',
  'Eckerö',
  'Finström',
  'Föglö',
  'Geta',
  'Hammarland',
  'Jomala',
  'Kumlinge',
  'Kökar',
  'Lemland',
  'Lumparland',
  'Mariehamn',
  'Saltvik',
  'Sottunga',
  'Sund',
  'Vårdö',
] as const;

function axGap(): GeoOssGapEntry {
  return {
    countryCode: 'AX',
    countryName: 'Åland Islands',
    continent: 'europe',
    relativePath: 'AX.json',
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['P0 country slice chosen for complete municipality coverage.'],
    proposedOpenSourcePackages: ['agid-open-ax-gazetteer'],
    firstActions: ['Create a complete source-linked municipality seed pack.'],
  };
}

test('AX plan is a complete source-linked municipality pack', () => {
  const plan = buildP0GazetteerRepositoryPlan(axGap(), 1, new Date('2026-07-01T00:00:00Z'));
  const municipalitySeeds = plan.placeSeeds.filter(place => (
    place.featureClass === 'municipality' || place.featureClass === 'capital'
  ));

  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
  assert.equal(municipalitySeeds.length, 16);
  assert.deepEqual(
    municipalitySeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'sv')),
    [...AX_MUNICIPALITIES].sort((left, right) => left.localeCompare(right, 'sv')),
  );
  assert.ok(plan.releaseGates.includes('complete-municipality-coverage-required'));
  assert.ok(plan.sources.some(source => source.id === 'aland-government-municipalities'));
  assert.ok(plan.sources.some(source => source.id === 'geonames-ax-admin'));

  for (const place of municipalitySeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.notEqual(place.approximateCentroid.lat, 0);
    assert.notEqual(place.approximateCentroid.lon, 0);
    assert.ok(place.geodataLinks.official);
    assert.ok(place.geodataLinks.geonames);
    assert.ok(place.notes.some(note => note.includes('GeoNames administrative code:')));
  }
});

test('generated AX repository files preserve complete municipality coverage', () => {
  const repoRoot = join(process.cwd(), 'data', 'open_geo_repositories', 'agid-open-ax-gazetteer');
  const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
    places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
  };
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
    counts: { placeSeeds: number; sources: number };
  };
  const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
    vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
  };

  const municipalitySeeds = placeSeed.places.filter(place => (
    place.featureClass === 'municipality' || place.featureClass === 'capital'
  ));
  const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

  assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
  assert.equal(municipalitySeeds.length, 16);
  assert.deepEqual(
    municipalitySeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'sv')),
    [...AX_MUNICIPALITIES].sort((left, right) => left.localeCompare(right, 'sv')),
  );
  for (const place of municipalitySeeds) {
    assert.equal(place.validationState, 'source-linked');
    assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
  }
  assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
});
