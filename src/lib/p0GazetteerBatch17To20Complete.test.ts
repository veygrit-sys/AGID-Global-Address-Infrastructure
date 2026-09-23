import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const FIRST_ORDER = {
  MM: [
    'Sagaing Region',
    'Bago Region',
    'Magway Region',
    'Mandalay Region',
    'Tanintharyi Region',
    'Yangon Region',
    'Ayeyarwady Region',
    'Kachin State',
    'Kayah State',
    'Kayin State',
    'Chin State',
    'Mon State',
    'Rakhine State',
    'Shan State',
    'Nay Pyi Taw',
  ],
  PG: [
    'Chimbu',
    'Central',
    'East New Britain',
    'Eastern Highlands',
    'Enga',
    'East Sepik',
    'Gulf',
    'Hela',
    'Jiwaka',
    'Milne Bay',
    'Morobe',
    'Madang',
    'Manus',
    'National Capital',
    'New Ireland',
    'Northern',
    'Bougainville',
    'Sandaun',
    'Southern Highlands',
    'West New Britain',
    'Western Highlands',
    'Western',
  ],
  PH: [
    'National Capital Region',
    'Cordillera Administrative Region',
    'Ilocos Region',
    'Cagayan Valley',
    'Central Luzon',
    'Calabarzon',
    'Mimaropa',
    'Bicol Region',
    'Western Visayas',
    'Negros Island Region',
    'Central Visayas',
    'Eastern Visayas',
    'Zamboanga Peninsula',
    'Northern Mindanao',
    'Davao Region',
    'Soccsksargen',
    'Caraga',
    'Bangsamoro Autonomous Region in Muslim Mindanao',
  ],
  TH: [
    'Bangkok',
    'Amnat Charoen',
    'Ang Thong',
    'Bueng Kan',
    'Buri Ram',
    'Chachoengsao',
    'Chai Nat',
    'Chaiyaphum',
    'Chanthaburi',
    'Chiang Mai',
    'Chiang Rai',
    'Chon Buri',
    'Chumphon',
    'Kalasin',
    'Kamphaeng Phet',
    'Kanchanaburi',
    'Khon Kaen',
    'Krabi',
    'Lampang',
    'Lamphun',
    'Loei',
    'Lop Buri',
    'Mae Hong Son',
    'Maha Sarakham',
    'Mukdahan',
    'Nakhon Nayok',
    'Nakhon Pathom',
    'Nakhon Phanom',
    'Nakhon Ratchasima',
    'Nakhon Sawan',
    'Nakhon Si Thammarat',
    'Nan',
    'Narathiwat',
    'Nong Bua Lam Phu',
    'Nong Khai',
    'Nonthaburi',
    'Pathum Thani',
    'Pattani',
    'Phang Nga',
    'Phatthalung',
    'Phayao',
    'Phetchabun',
    'Phetchaburi',
    'Phichit',
    'Phitsanulok',
    'Phra Nakhon Si Ayutthaya',
    'Phrae',
    'Phuket',
    'Prachin Buri',
    'Prachuap Khiri Khan',
    'Ranong',
    'Ratchaburi',
    'Rayong',
    'Roi Et',
    'Sa Kaeo',
    'Sakon Nakhon',
    'Samut Prakan',
    'Samut Sakhon',
    'Samut Songkhram',
    'Saraburi',
    'Satun',
    'Sing Buri',
    'Sisaket',
    'Songkhla',
    'Sukhothai',
    'Suphan Buri',
    'Surat Thani',
    'Surin',
    'Tak',
    'Trang',
    'Trat',
    'Ubon Ratchathani',
    'Udon Thani',
    'Uthai Thani',
    'Uttaradit',
    'Yala',
    'Yasothon',
  ],
} as const;

function gap(countryCode: keyof typeof FIRST_ORDER, countryName: string): GeoOssGapEntry {
  return {
    countryCode,
    countryName,
    continent: countryCode === 'PG' ? 'oceania' : 'asia',
    relativePath: `${countryCode}.json`,
    regionKind: 'country-or-main-region',
    priority: 'P0-critical',
    operationalClass: 'postal-code-available-weak-api',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: [`Complete P0 country slice for ${countryName}.`],
    proposedOpenSourcePackages: [`agid-open-${countryCode.toLowerCase()}-gazetteer`],
    firstActions: [`Create a complete source-linked ${countryName} first-order seed pack.`],
  };
}

function firstOrderSeeds(plan: ReturnType<typeof buildP0GazetteerRepositoryPlan>) {
  return plan.placeSeeds.filter(place => (
    place.featureClass === 'province' ||
    place.featureClass === 'state' ||
    place.featureClass === 'region' ||
    place.featureClass === 'special-region' ||
    place.featureClass === 'capital'
  ));
}

function generatedRepo(countryCode: keyof typeof FIRST_ORDER) {
  return join(process.cwd(), 'data', 'open_geo_repositories', `agid-open-${countryCode.toLowerCase()}-gazetteer`);
}

for (const [countryCode, countryName, expectedGate] of [
  ['MM', 'Myanmar', 'regions-states-union-territory-source-linked'],
  ['PG', 'Papua New Guinea', 'province-autonomous-region-district-counts-recorded'],
  ['PH', 'Philippines', 'complete-current-region-coverage-required'],
  ['TH', 'Thailand', 'all-76-provinces-source-linked'],
] as const) {
  test(`${countryCode} plan is a complete source-linked first-order pack`, () => {
    const plan = buildP0GazetteerRepositoryPlan(
      gap(countryCode, countryName),
      17,
      new Date('2026-07-01T00:00:00Z'),
    );
    const seeds = firstOrderSeeds(plan);

    assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
    assert.equal(seeds.length, FIRST_ORDER[countryCode].length);
    assert.deepEqual(
      seeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...FIRST_ORDER[countryCode]].sort((left, right) => left.localeCompare(right, 'en')),
    );
    assert.ok(plan.releaseGates.includes(expectedGate));
    assert.ok(plan.releaseGates.some(gate => gate.includes('conformance-covers')));

    for (const place of seeds) {
      assert.equal(place.validationState, 'source-linked');
      assert.notEqual(place.approximateCentroid.lat, 0);
      assert.notEqual(place.approximateCentroid.lon, 0);
      assert.ok(place.geodataLinks.official);
      assert.ok(place.geodataLinks.geonames);
      assert.ok(place.notes.some(note => note.includes(`Complete ${countryCode} first-order seed`)));
      assert.ok(place.notes.some(note => note.includes('first-order type:')));
      assert.ok(place.notes.some(note => note.includes('administrative division list:')));
      assert.ok(place.notes.some(note => note.includes('GeoNames subdivision listing row:')));
    }
  });

  test(`${countryCode} generated repository preserves complete first-order fixtures`, () => {
    const repoRoot = generatedRepo(countryCode);
    const placeSeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'place-seed.json'), 'utf8')) as {
      places: Array<{ agidPlaceId: string; name: string; featureClass: string; validationState: string }>;
    };
    const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8')) as {
      counts: { placeSeeds: number; sources: number };
    };
    const fixtures = JSON.parse(readFileSync(join(repoRoot, 'fixtures', 'gazetteer-conformance.json'), 'utf8')) as {
      vectors: Array<{ expected: { agidPlaceId: string; mustNotReturnRawAddress: boolean } }>;
    };

    const countrylessSeeds = placeSeed.places.filter(place => place.featureClass !== 'country');
    const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

    assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
    assert.equal(countrylessSeeds.length, FIRST_ORDER[countryCode].length);
    assert.deepEqual(
      countrylessSeeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...FIRST_ORDER[countryCode]].sort((left, right) => left.localeCompare(right, 'en')),
    );
    for (const place of countrylessSeeds) {
      assert.equal(place.validationState, 'source-linked');
      assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
    }
    assert.equal(fixtures.vectors.length, FIRST_ORDER[countryCode].length);
    assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
  });
}

test('PH complete pack treats NIR and BARMM as current regions, not stale ARMM', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('PH', 'Philippines'), 19, new Date('2026-07-01T00:00:00Z'));
  assert.ok(plan.placeSeeds.some(place => place.name === 'Negros Island Region'));
  assert.ok(plan.placeSeeds.some(place => place.name === 'Bangsamoro Autonomous Region in Muslim Mindanao'));
  assert.ok(!plan.placeSeeds.some(place => place.name === 'Autonomous Region in Muslim Mindanao'));
});

test('TH complete pack has Bangkok plus 76 province seeds', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('TH', 'Thailand'), 20, new Date('2026-07-01T00:00:00Z'));
  assert.equal(plan.placeSeeds.filter(place => place.featureClass === 'capital' && place.name === 'Bangkok').length, 1);
  assert.equal(plan.placeSeeds.filter(place => place.featureClass === 'province').length, 76);
});
