import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type SeaRecord = {
  id: string;
  name: string;
  n: number;
  s: number;
  w: number;
  e: number;
  polygon?: number[][];
  gridSize?: number;
};

type OceanId = 'pacific' | 'atlantic' | 'indian' | 'arctic' | 'southern';

type SeaRepositoryPlacement = {
  id: string;
  name: string;
  repository: string;
  parentOcean: OceanId;
  sourceIds: string[];
  boundary: { n: number; s: number; w: number; e: number };
  recordCount: number;
  storesPreciseAddress: false;
  requiredFields: string[];
};

type OceanRepositoryPlacement = {
  generatedAt: string;
  version: string;
  root: {
    id: 'ocean';
    repository: 'agid-ocean';
    purpose: string;
  };
  oceanRepositories: Array<{
    id: OceanId;
    name: string;
    repository: string;
    childSeaRepositoryCount: number;
    childSeaRepositories: SeaRepositoryPlacement[];
  }>;
  naturalFeaturePolicy: {
    mountains: NaturalFeaturePolicy;
    deserts: NaturalFeaturePolicy;
    rivers: NaturalFeaturePolicy;
    lakes: NaturalFeaturePolicy;
  };
};

type NaturalFeaturePolicy = {
  independentRepository: false;
  storage: string;
  minimumFields: string[];
  fallbackReference: string;
};

const OCEANS: Array<{ id: OceanId; name: string; repository: string }> = [
  { id: 'pacific', name: 'Pacific Ocean', repository: 'agid-pacific' },
  { id: 'atlantic', name: 'Atlantic Ocean', repository: 'agid-atlantic' },
  { id: 'indian', name: 'Indian Ocean', repository: 'agid-indian' },
  { id: 'arctic', name: 'Arctic Ocean', repository: 'agid-arctic' },
  { id: 'southern', name: 'Southern Ocean', repository: 'agid-southern' },
];

const southernNames = [
  'southern ocean',
  'weddell sea',
  'lazarev sea',
  'riiser-larsen sea',
  'davis sea',
  "dumont d'urville sea",
  'mawson sea',
  'ross sea',
  'amundsen sea',
  'bellingshausen sea',
];

const arcticNames = [
  'arctic ocean',
  'barents sea',
  'kara sea',
  'laptev sea',
  'east siberian sea',
  'chukchi sea',
  'beaufort sea',
  'greenland sea',
  'norwegian sea',
  'white sea',
  'hudson bay',
  'baffin bay',
  'lincoln sea',
  'hudson strait',
  'davis strait',
  'denmark strait',
];

const indianNames = [
  'north indian ocean',
  'south indian ocean',
  'bay of bengal',
  'arabian sea',
  'andaman sea',
  'laccadive sea',
  'red sea',
  'gulf of aden',
  'gulf of oman',
  'persian gulf',
  'mozambique channel',
  'strait of malacca',
  'singapore strait',
  'gulf of kutch',
  'gulf of khambhat',
  'timor sea',
  'great australian bight',
];

const pacificNames = [
  'north pacific ocean',
  'south pacific ocean',
  'coral sea',
  'tasman sea',
  'solomon sea',
  'bismarck sea',
  'arafura sea',
  'flores sea',
  'molucca sea',
  'ceram sea',
  'halmahera sea',
  'sulu sea',
  'sibuyan sea',
  'visayan sea',
  'camotes sea',
  'bohol sea',
  'mindanao sea',
  'savu sea',
  'gulf of california',
  'gulf of alaska',
  'bering sea',
  'sea of okhotsk',
  'east china sea',
  'south china sea',
  'yellow sea',
  'bohai sea',
  'java sea',
  'celebes sea',
  'banda sea',
  'philippine sea',
  'gulf of thailand',
  'taiwan strait',
  'seto inland sea',
  'sea of japan',
  'tokyo bay',
  'osaka bay',
  'ise bay',
  'sagami bay',
  'suruga bay',
  'tsugaru strait',
  'tsushima strait',
  'cook strait',
  'bass strait',
  'makassar strait',
  'lombok strait',
  'bali sea',
];

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalName(value: string) {
  const normalized = normalizeName(value);
  if (normalized === 'mediterranean') return 'Mediterranean Sea';
  return normalized.replace(/\b\w/g, letter => letter.toUpperCase());
}

function slug(value: string) {
  return normalizeName(value)
    .replace(/^mediterranean$/, 'mediterranean sea')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function includesName(names: string[], normalized: string) {
  return names.some(name => normalized === name || normalized.includes(name));
}

function classifyOcean(name: string): OceanId {
  const normalized = normalizeName(name);
  if (includesName(southernNames, normalized)) return 'southern';
  if (includesName(arcticNames, normalized)) return 'arctic';
  if (includesName(indianNames, normalized)) return 'indian';
  if (includesName(pacificNames, normalized)) return 'pacific';
  if (normalized.includes('pacific')) return 'pacific';
  if (normalized.includes('indian')) return 'indian';
  if (normalized.includes('arctic')) return 'arctic';
  if (normalized.includes('southern')) return 'southern';
  return 'atlantic';
}

function mergeBoundary(records: SeaRecord[]) {
  return {
    n: Math.max(...records.map(record => record.n)),
    s: Math.min(...records.map(record => record.s)),
    w: Math.min(...records.map(record => record.w)),
    e: Math.max(...records.map(record => record.e)),
  };
}

function buildNaturalFeaturePolicy(storage: string): NaturalFeaturePolicy {
  return {
    independentRepository: false,
    storage,
    minimumFields: ['name', 'featureType', 'bboxOrCentroid', 'source', 'confidence'],
    fallbackReference: 'Use the feature name plus a bounded latitude/longitude region when no postal or civic address exists.',
  };
}

async function main() {
  const root = process.cwd();
  const seas = JSON.parse(await readFile(path.join(root, 'src/data/seas.json'), 'utf8')) as SeaRecord[];
  const grouped = new Map<string, SeaRecord[]>();

  for (const sea of seas) {
    const key = slug(sea.name);
    grouped.set(key, [...(grouped.get(key) || []), sea]);
  }

  const seaPlacements = Array.from(grouped.entries()).map(([id, records]): SeaRepositoryPlacement => {
    const primary = records[0];
    const parentOcean = classifyOcean(primary.name);
    return {
      id,
      name: canonicalName(primary.name),
      repository: `agid-${parentOcean}-${id}`,
      parentOcean,
      sourceIds: records.map(record => record.id),
      boundary: mergeBoundary(records),
      recordCount: records.length,
      storesPreciseAddress: false,
      requiredFields: [
        'AGID',
        'multilingualName',
        'boundaryOrBbox',
        'adjacentSeas',
        'adjacentCountriesOrIslands',
        'eezRelationOptional',
        'straitBayInletConnections',
        'sourceMetadata',
      ],
    };
  });

  const output: OceanRepositoryPlacement = {
    generatedAt: new Date().toISOString(),
    version: 'agid-ocean-repository-placement-v1',
    root: {
      id: 'ocean',
      repository: 'agid-ocean',
      purpose: 'Root index for ocean, sea, gulf, bay, strait, and marine addressable geography repositories.',
    },
    oceanRepositories: OCEANS.map(ocean => {
      const childSeaRepositories = seaPlacements
        .filter(sea => sea.parentOcean === ocean.id)
        .sort((left, right) => left.id.localeCompare(right.id));
      return {
        ...ocean,
        childSeaRepositoryCount: childSeaRepositories.length,
        childSeaRepositories,
      };
    }),
    naturalFeaturePolicy: {
      mountains: buildNaturalFeaturePolicy('country-or-region-natural-feature-pack'),
      deserts: buildNaturalFeaturePolicy('country-or-region-natural-feature-pack'),
      rivers: buildNaturalFeaturePolicy('country-or-region-natural-feature-pack'),
      lakes: buildNaturalFeaturePolicy('country-or-region-natural-feature-pack'),
    },
  };

  const outDir = path.join(root, 'data/global_entities');
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, 'agid-ocean-repository-placement.json'),
    `${JSON.stringify(output, null, 2)}\n`,
    'utf8',
  );

  console.log(JSON.stringify({
    output: 'data/global_entities/agid-ocean-repository-placement.json',
    root: output.root.repository,
    oceanRepositories: output.oceanRepositories.length,
    seaRepositories: output.oceanRepositories.reduce((sum, ocean) => sum + ocean.childSeaRepositoryCount, 0),
    sourceSeaRecords: seas.length,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
