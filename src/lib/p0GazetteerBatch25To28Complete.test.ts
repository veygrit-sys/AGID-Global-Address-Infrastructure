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
  'Svalbard and Jan Mayen': {
    countryCode: 'SJ',
    continent: 'europe',
    expectedGate: 'complete-sj-component-coverage-required',
    repository: 'agid-open-sj-svalbard-and-jan-mayen-gazetteer',
    expectedNames: ['Svalbard', 'Jan Mayen', 'Longyearbyen', 'Olonkinbyen'],
  },
  'Jan Mayen': {
    countryCode: 'SJ',
    continent: 'europe',
    expectedGate: 'complete-jan-mayen-operational-seed-required',
    repository: 'agid-open-sj-jan-mayen-gazetteer',
    expectedNames: ['Olonkinbyen', 'Beerenberg'],
  },
  Svalbard: {
    countryCode: 'SJ',
    continent: 'europe',
    expectedGate: 'complete-svalbard-planning-area-seed-required',
    repository: 'agid-open-sj-svalbard-gazetteer',
    expectedNames: ['Longyearbyen', 'Ny-Alesund', 'Barentsburg', 'Pyramiden', 'Colesbukta'],
  },
  Vietnam: {
    countryCode: 'VN',
    continent: 'asia',
    expectedGate: 'complete-2025-provincial-coverage-required',
    repository: 'agid-open-vn-gazetteer',
    expectedNames: [
      'Ha Noi', 'Hue', 'Hai Phong', 'Da Nang', 'Ho Chi Minh City', 'Can Tho',
      'Lao Cai', 'Thai Nguyen', 'Phu Tho', 'Bac Ninh', 'Hung Yen',
      'Ninh Binh', 'Quang Tri', 'Quang Ngai', 'Gia Lai', 'Khanh Hoa',
      'Lam Dong', 'Dak Lak', 'Dong Nai', 'Tay Ninh', 'Vinh Long',
      'Dong Thap', 'Ca Mau', 'An Giang', 'Tuyen Quang', 'Cao Bang',
      'Dien Bien', 'Ha Tinh', 'Lai Chau', 'Lang Son', 'Nghe An',
      'Quang Ninh', 'Son La', 'Thanh Hoa',
    ],
  },
} as const;

type PackName = keyof typeof PACKS;

function gap(countryName: PackName): GeoOssGapEntry {
  const pack = PACKS[countryName];
  return {
    countryCode: pack.countryCode,
    countryName,
    continent: pack.continent,
    relativePath: `${pack.countryCode}.json`,
    regionKind: 'country-or-main-region',
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

function seedLayer(plan: ReturnType<typeof buildP0GazetteerRepositoryPlan>) {
  return plan.placeSeeds.filter(place => place.featureClass !== 'country');
}

function generatedRepo(countryName: PackName) {
  return join(process.cwd(), 'data', 'open_geo_repositories', PACKS[countryName].repository);
}

for (const countryName of Object.keys(PACKS) as PackName[]) {
  test(`${countryName} plan is a complete source-linked P0 seed pack`, () => {
    const pack = PACKS[countryName];
    const plan = buildP0GazetteerRepositoryPlan(
      gap(countryName),
      25,
      new Date('2026-07-01T00:00:00Z'),
    );
    const seeds = seedLayer(plan);

    assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
    assert.equal(seeds.length, pack.expectedNames.length);
    assert.deepEqual(
      seeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...pack.expectedNames].sort((left, right) => left.localeCompare(right, 'en')),
    );
    assert.ok(plan.releaseGates.includes(pack.expectedGate));
    assert.ok(plan.releaseGates.some(gate => gate.includes('conformance-covers')));

    for (const place of seeds) {
      assert.equal(place.validationState, 'source-linked');
      assert.notEqual(place.approximateCentroid.lat, 0);
      assert.notEqual(place.approximateCentroid.lon, 0);
      assert.ok(place.geodataLinks.official);
      assert.ok(place.geodataLinks.geonames);
      assert.ok(place.notes.some(note => note.includes(`Complete ${pack.countryCode} first-order seed`)));
      assert.ok(place.notes.some(note => note.includes('first-order type:')));
      assert.ok(place.notes.some(note => note.includes('administrative division list:')));
      assert.ok(place.notes.some(note => note.includes('GeoNames subdivision listing row:')));
    }
  });

  test(`${countryName} generated repository preserves complete conformance fixtures`, () => {
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

    const seeds = placeSeed.places.filter(place => place.featureClass !== 'country');
    const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

    assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
    assert.equal(seeds.length, pack.expectedNames.length);
    assert.deepEqual(
      seeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...pack.expectedNames].sort((left, right) => left.localeCompare(right, 'en')),
    );
    for (const place of seeds) {
      assert.equal(place.validationState, 'source-linked');
      assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
    }
    assert.equal(fixtures.vectors.length, pack.expectedNames.length);
    assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
  });
}

test('SJ combined pack separates components from local administration', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Svalbard and Jan Mayen'), 25, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('not treated as a single local administrative system')));
  assert.equal(plan.placeSeeds.filter(seed => seed.name === 'Longyearbyen' && seed.featureClass === 'capital').length, 1);
  assert.equal(plan.placeSeeds.filter(seed => seed.name === 'Olonkinbyen' && seed.featureClass === 'settlement').length, 1);
});

test('Jan Mayen pack does not overclaim permanent address coverage', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Jan Mayen'), 26, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.ok(countrySeed?.notes.some(note => note.includes('No permanent settlement')));
  assert.equal(plan.placeSeeds.filter(seed => seed.name === 'Olonkinbyen' && seed.featureClass === 'settlement').length, 1);
  assert.equal(plan.placeSeeds.filter(seed => seed.name === 'Beerenberg' && seed.featureClass === 'special-region').length, 1);
});

test('Svalbard pack is the Governor planning-area layer', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Svalbard'), 27, new Date('2026-07-01T00:00:00Z'));
  assert.equal(plan.placeSeeds.filter(seed => seed.featureClass !== 'country').length, 5);
  assert.ok(plan.placeSeeds.every(seed => (
    seed.featureClass === 'country' || seed.notes.some(note => note.includes('planning area'))
  )));
});

test('VN complete pack uses the current 34-unit 2025 layer', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('Vietnam'), 28, new Date('2026-07-01T00:00:00Z'));
  const countrySeed = plan.placeSeeds.find(seed => seed.featureClass === 'country');
  assert.equal(plan.placeSeeds.filter(seed => seed.featureClass === 'province').length, 28);
  assert.equal(plan.placeSeeds.filter(seed => seed.featureClass === 'city' || seed.featureClass === 'capital').length, 6);
  assert.ok(countrySeed?.notes.some(note => note.includes('legacy 63-unit layer')));
  assert.ok(countrySeed?.notes.some(note => note.includes('two-tier reform dissolves district/township')));
});
