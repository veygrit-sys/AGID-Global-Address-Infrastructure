import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const PACKS = {
  'Northern Cyprus': {
    countryCode: 'TRNC',
    regionKind: 'disputed-region',
    expectedGate: 'complete-northern-cyprus-nonclaim-anchor-required',
    repository: 'agid-open-trnc-gazetteer',
    expectedNames: [
      'Areas of Cyprus Not Under Effective Control',
      'North Nicosia',
      'Famagusta',
      'Kyrenia',
      'Morphou',
      'Iskele',
      'Karpas Peninsula',
    ],
  },
  'Baarle Enclaves': {
    countryCode: 'BAAR',
    regionKind: 'special-region',
    expectedGate: 'complete-baarle-enclave-anchor-required',
    repository: 'agid-open-baar-gazetteer',
    expectedNames: [
      'Baarle Enclave Complex',
      'Baarle-Hertog',
      'Baarle-Nassau',
      'Belgian Enclaves H1-H22',
      'Dutch Enclaves N1-N8',
    ],
  },
  'Pheasant Island': {
    countryCode: 'PHIS',
    regionKind: 'special-region',
    expectedGate: 'complete-pheasant-island-condominium-anchor-required',
    repository: 'agid-open-phis-gazetteer',
    expectedNames: [
      'Pheasant Island Condominium',
      'Bidasoa River Setting',
      'Hendaye Shore',
      'Irun Shore',
      'Hondarribia Reference',
    ],
  },
  'Bouvet Island': {
    countryCode: 'BV',
    regionKind: 'territory',
    expectedGate: 'complete-bouvet-island-nature-reserve-anchor-required',
    repository: 'agid-open-bv-gazetteer',
    expectedNames: ['Bouvetøya Main Island', 'Nyrøysa', 'Olavtoppen', 'Norvegia Station', 'Larsøya', 'Kapp Valdivia'],
  },
} as const;

type PackName = keyof typeof PACKS;

function gap(countryName: PackName): GeoOssGapEntry {
  const pack = PACKS[countryName];
  return {
    countryCode: pack.countryCode,
    countryName,
    continent: 'special',
    relativePath: `${pack.countryCode}.json`,
    regionKind: pack.regionKind,
    priority: 'P0-critical',
    operationalClass: 'postal-code-available-weak-api',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: [`Complete P0 slice for ${countryName}.`],
    proposedOpenSourcePackages: [pack.repository],
    firstActions: [`Create a complete source-linked ${countryName} seed pack.`],
  };
}

function anchors(plan: ReturnType<typeof buildP0GazetteerRepositoryPlan>) {
  return plan.placeSeeds.filter(place => place.featureClass !== 'country');
}

function generatedRepo(countryName: PackName) {
  return join(process.cwd(), 'data', 'open_geo_repositories', PACKS[countryName].repository);
}

for (const countryName of Object.keys(PACKS) as PackName[]) {
  test(`${countryName} plan is a complete source-linked P0 pack`, () => {
    const pack = PACKS[countryName];
    const plan = buildP0GazetteerRepositoryPlan(
      gap(countryName),
      41,
      new Date('2026-07-01T00:00:00Z'),
    );
    const completed = anchors(plan);

    assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
    assert.equal(completed.length, pack.expectedNames.length);
    assert.deepEqual(
      completed.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...pack.expectedNames].sort((left, right) => left.localeCompare(right, 'en')),
    );
    assert.ok(plan.releaseGates.includes(pack.expectedGate));
    assert.ok(plan.releaseGates.some(gate => gate.includes('conformance-covers')));

    for (const place of completed) {
      assert.equal(place.validationState, 'source-linked');
      assert.notEqual(place.approximateCentroid.lat, 0);
      assert.notEqual(place.approximateCentroid.lon, 0);
      assert.ok(place.geodataLinks.official);
      assert.ok(place.geodataLinks.geonames);
      assert.ok(place.notes.some(note => note.includes('Complete')));
    }
  });

  test(`${countryName} generated repository preserves full conformance fixture coverage`, () => {
    const pack = PACKS[countryName];
    const repoRoot = generatedRepo(countryName);
    const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
      places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
    };
    const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
      counts: { placeSeeds: number; sources: number };
    };
    const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
      vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
    };

    const completed = placeSeed.places.filter(place => place.featureClass !== 'country');
    const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

    assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
    assert.equal(completed.length, pack.expectedNames.length);
    assert.deepEqual(
      completed.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...pack.expectedNames].sort((left, right) => left.localeCompare(right, 'en')),
    );
    for (const place of completed) {
      assert.equal(place.validationState, 'source-linked');
      assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
    }
    assert.equal(fixtures.vectors.length, pack.expectedNames.length);
    assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
  });
}

test('TRNC complete pack avoids recognition, border, and crossing overclaims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Northern Cyprus'), 41, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('statehood')));
  assert.ok(countrySeed?.notes.some(note => note.includes('recognition')));
  assert.ok(countrySeed?.notes.some(note => note.includes('crossing rights')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'North Nicosia' && seed.notes.some(note => note.includes('border-crossing'))));
});

test('BAAR complete pack keeps enclave counts separate from private parcel or jurisdiction decisions', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Baarle Enclaves'), 42, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('parcel boundaries')));
  assert.ok(countrySeed?.notes.some(note => note.includes('property-level addresses')));
  assert.ok(countrySeed?.notes.some(note => note.includes('front-door jurisdiction')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Belgian Enclaves H1-H22'));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Dutch Enclaves N1-N8'));
});

test('PHIS complete pack records the condominium without current-authority or public-access claims', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Pheasant Island'), 43, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('date-specific current authority')));
  assert.ok(countrySeed?.notes.some(note => note.includes('public access')));
  assert.ok(countrySeed?.notes.some(note => note.includes('delivery availability')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Pheasant Island Condominium' && seed.notes.some(note => note.includes('date-specific current authority'))));
});

test('BV complete pack is a polar place-name seed, not an access or rescue product', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Bouvet Island'), 44, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('inhabited addresses')));
  assert.ok(countrySeed?.notes.some(note => note.includes('landing permission')));
  assert.ok(countrySeed?.notes.some(note => note.includes('rescue availability')));
  assert.ok(plan.placeSeeds.some(seed => seed.name === 'Norvegia Station' && seed.notes.some(note => note.includes('permanent settlement'))));
});
