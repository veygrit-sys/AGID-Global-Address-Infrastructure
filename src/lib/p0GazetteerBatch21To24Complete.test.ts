import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GeoOssGapEntry } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

const EXPECTED = {
  CN: [
    'Anhui', 'Fujian', 'Gansu', 'Guangdong', 'Guizhou', 'Hainan', 'Hebei',
    'Heilongjiang', 'Henan', 'Hubei', 'Hunan', 'Jiangsu', 'Jiangxi', 'Jilin',
    'Liaoning', 'Qinghai', 'Shaanxi', 'Shandong', 'Shanxi', 'Sichuan',
    'Taiwan', 'Yunnan', 'Zhejiang', 'Guangxi', 'Inner Mongolia', 'Ningxia',
    'Xinjiang', 'Tibet', 'Beijing', 'Chongqing', 'Shanghai', 'Tianjin',
    'Hong Kong', 'Macao',
  ],
  ID: [
    'Aceh', 'North Sumatra', 'West Sumatra', 'Riau', 'Jambi', 'South Sumatra',
    'Bengkulu', 'Lampung', 'Bangka Belitung Islands', 'Riau Islands',
    'Jakarta', 'West Java', 'Central Java', 'Yogyakarta', 'East Java',
    'Banten', 'Bali', 'West Nusa Tenggara', 'East Nusa Tenggara',
    'West Kalimantan', 'Central Kalimantan', 'South Kalimantan',
    'East Kalimantan', 'North Kalimantan', 'North Sulawesi',
    'Central Sulawesi', 'South Sulawesi', 'Southeast Sulawesi', 'Gorontalo',
    'West Sulawesi', 'Maluku', 'North Maluku', 'West Papua',
    'Southwest Papua', 'Central Papua', 'Highland Papua', 'Papua',
    'South Papua',
  ],
  IE: [
    'Carlow County Council', 'Cavan County Council', 'Clare County Council',
    'Cork City Council', 'Cork County Council', 'Donegal County Council',
    'Dublin City Council', 'Dún Laoghaire-Rathdown County Council',
    'Fingal County Council', 'Galway City Council', 'Galway County Council',
    'Kerry County Council', 'Kildare County Council', 'Kilkenny County Council',
    'Laois County Council', 'Leitrim County Council',
    'Limerick City and County Council', 'Longford County Council',
    'Louth County Council', 'Mayo County Council', 'Meath County Council',
    'Monaghan County Council', 'Offaly County Council',
    'Roscommon County Council', 'Sligo County Council',
    'South Dublin County Council', 'Tipperary County Council',
    'Waterford City and County Council', 'Westmeath County Council',
    'Wexford County Council', 'Wicklow County Council',
  ],
  KH: [
    'Banteay Meanchey', 'Battambang', 'Kampong Cham', 'Kampong Chhnang',
    'Kampong Speu', 'Kampong Thom', 'Kampot', 'Kandal', 'Koh Kong',
    'Kratie', 'Mondulkiri', 'Phnom Penh', 'Preah Vihear', 'Prey Veng',
    'Pursat', 'Ratanakiri', 'Siem Reap', 'Preah Sihanouk', 'Stung Treng',
    'Svay Rieng', 'Takeo', 'Oddar Meanchey', 'Kep', 'Pailin',
    'Tboung Khmum',
  ],
} as const;

function gap(countryCode: keyof typeof EXPECTED, countryName: string): GeoOssGapEntry {
  return {
    countryCode,
    countryName,
    continent: countryCode === 'IE' ? 'europe' : 'asia',
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
    firstActions: [`Create a complete source-linked ${countryName} seed pack.`],
  };
}

function seedLayer(plan: ReturnType<typeof buildP0GazetteerRepositoryPlan>) {
  return plan.placeSeeds.filter(place => place.featureClass !== 'country');
}

function generatedRepo(countryCode: keyof typeof EXPECTED) {
  return join(process.cwd(), 'data', 'open_geo_repositories', `agid-open-${countryCode.toLowerCase()}-gazetteer`);
}

for (const [countryCode, countryName, expectedGate] of [
  ['CN', 'China', 'neutral-disputed-boundary-note-required'],
  ['ID', 'Indonesia', 'all-38-first-order-divisions-source-linked'],
  ['IE', 'Ireland', 'all-31-local-authorities-source-linked'],
  ['KH', 'Cambodia', 'complete-adm1-coverage-required'],
] as const) {
  test(`${countryCode} plan is a complete source-linked P0 seed pack`, () => {
    const plan = buildP0GazetteerRepositoryPlan(
      gap(countryCode, countryName),
      21,
      new Date('2026-07-01T00:00:00Z'),
    );
    const seeds = seedLayer(plan);

    assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
    assert.equal(seeds.length, EXPECTED[countryCode].length);
    assert.deepEqual(
      seeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...EXPECTED[countryCode]].sort((left, right) => left.localeCompare(right, 'en')),
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

  test(`${countryCode} generated repository preserves complete conformance fixtures`, () => {
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

    const seeds = placeSeed.places.filter(place => place.featureClass !== 'country');
    const fixtureIds = new Set(fixtures.vectors.map(vector => vector.expected.agidPlaceId));

    assert.equal(manifest.counts.placeSeeds, placeSeed.places.length);
    assert.equal(seeds.length, EXPECTED[countryCode].length);
    assert.deepEqual(
      seeds.map(place => place.name).sort((left, right) => left.localeCompare(right, 'en')),
      [...EXPECTED[countryCode]].sort((left, right) => left.localeCompare(right, 'en')),
    );
    for (const place of seeds) {
      assert.equal(place.validationState, 'source-linked');
      assert.ok(fixtureIds.has(place.agidPlaceId), `${place.name} must have a conformance vector`);
    }
    assert.equal(fixtures.vectors.length, EXPECTED[countryCode].length);
    assert.ok(fixtures.vectors.every(vector => vector.expected.mustNotReturnRawAddress));
  });
}

test('CN complete pack keeps sensitive-region compatibility notes', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('CN', 'China'), 21, new Date('2026-07-01T00:00:00Z'));
  for (const name of ['Taiwan', 'Hong Kong', 'Macao']) {
    const place = plan.placeSeeds.find(seed => seed.name === name);
    assert.ok(place, `${name} seed should exist`);
    assert.ok(place.notes.some(note => (
      note.includes('does not assert sovereignty') ||
      note.includes('compatibility reference only')
    )));
  }
});

test('ID complete pack has Jakarta, two special regions, and 35 provinces', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('ID', 'Indonesia'), 22, new Date('2026-07-01T00:00:00Z'));
  assert.equal(plan.placeSeeds.filter(place => place.featureClass === 'capital' && place.name === 'Jakarta').length, 1);
  assert.equal(plan.placeSeeds.filter(place => place.featureClass === 'special-region').length, 2);
  assert.equal(plan.placeSeeds.filter(place => place.featureClass === 'province').length, 35);
});

test('IE complete pack uses local authorities, not the historic province layer', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('IE', 'Ireland'), 23, new Date('2026-07-01T00:00:00Z'));
  assert.equal(plan.placeSeeds.filter(place => place.featureClass === 'municipality').length, 31);
  assert.ok(!plan.placeSeeds.some(place => ['Connaught', 'Leinster', 'Munster', 'Ulster'].includes(place.name)));
});

test('KH complete pack has Phnom Penh plus 24 provinces', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('KH', 'Cambodia'), 24, new Date('2026-07-01T00:00:00Z'));
  assert.equal(plan.placeSeeds.filter(place => place.featureClass === 'capital' && place.name === 'Phnom Penh').length, 1);
  assert.equal(plan.placeSeeds.filter(place => place.featureClass === 'province').length, 24);
});
