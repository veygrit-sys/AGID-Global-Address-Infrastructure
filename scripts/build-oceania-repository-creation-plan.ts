import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type PlacementCountry = {
  code: string;
  name: string;
  repository: string;
  splitStrategy: string;
  recommendedChildren?: string[];
};

type PlacementRegion = {
  id: string;
  repository: string;
  countries: PlacementCountry[];
};

type PlacementContinent = {
  id: string;
  repository: string;
  regions: PlacementRegion[];
};

type CreationPlanRepo = {
  repository: string;
  kind: 'continent-index' | 'region-index' | 'country-parent' | 'country-child';
  region?: string;
  countryCode?: string;
  countryName?: string;
  parentRepository?: string;
  stage: 'wave-0-index' | 'wave-1-country-parent' | 'wave-2-child-logical-plan';
  githubCreateNow: boolean;
  dataReady: boolean;
  creationRationale: string;
  description: string;
};

function loadOceaniaPlacement() {
  const placementPath = path.resolve('data/global_entities/agid-repository-placement.json');
  const placement = JSON.parse(readFileSync(placementPath, 'utf8')) as { continents: PlacementContinent[] };
  const oceania = placement.continents.find(continent => continent.id === 'oceania');
  if (!oceania) throw new Error('Missing oceania placement in agid-repository-placement.json');
  return oceania;
}

function titleFromId(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildOceaniaRepositoryCreationPlan() {
  const oceania = loadOceaniaPlacement();
  const repositories: CreationPlanRepo[] = [
    {
      repository: oceania.repository,
      kind: 'continent-index',
      stage: 'wave-0-index',
      githubCreateNow: true,
      dataReady: true,
      creationRationale: 'The continent index can be completed with safe coordination metadata before any country dataset is published.',
      description: 'AGID Oceania index for sovereign states, Pacific territories, Australian external territories, Polynesia, and staged country packs.',
    },
  ];

  for (const region of oceania.regions) {
    repositories.push({
      repository: region.repository,
      kind: 'region-index',
      region: region.id,
      stage: 'wave-0-index',
      githubCreateNow: true,
      dataReady: true,
      creationRationale: 'Region indexes can publish repository pointers, source policy, postal status, and conformance status without raw address data.',
      description: `AGID ${titleFromId(region.id)} index for Oceania country and territory repository coordination.`,
    });

    for (const country of region.countries) {
      repositories.push({
        repository: country.repository,
        kind: 'country-parent',
        region: region.id,
        countryCode: country.code,
        countryName: country.name,
        parentRepository: region.repository,
        stage: 'wave-1-country-parent',
        githubCreateNow: false,
        dataReady: false,
        creationRationale: 'Country and territory parents wait for maintainers, source licenses, postal policy, address hierarchy rules, quality gates, and no-raw checks.',
        description: `AGID country or territory pack for ${country.name}; stores safe rules, sources, quality gates, and synthetic fixtures only.`,
      });

      for (const childRepository of country.recommendedChildren ?? []) {
        repositories.push({
          repository: childRepository,
          kind: 'country-child',
          region: region.id,
          countryCode: country.code,
          countryName: country.name,
          parentRepository: country.repository,
          stage: 'wave-2-child-logical-plan',
          githubCreateNow: false,
          dataReady: false,
          creationRationale: 'Physical child repositories are logical-only until data volume, local ownership, source boundary, or pull-request pressure justifies creation.',
          description: `Planned AGID child repository for ${country.name}; create physically only after data volume, ownership, or PR pressure justifies it.`,
        });
      }
    }
  }

  const summary = {
    continent: 'oceania',
    rootRepository: oceania.repository,
    regionRepositories: repositories.filter(repo => repo.kind === 'region-index').length,
    countryParentRepositories: repositories.filter(repo => repo.kind === 'country-parent').length,
    childLogicalRepositories: repositories.filter(repo => repo.kind === 'country-child').length,
    githubCreateNow: repositories.filter(repo => repo.githubCreateNow).length,
    dataReadyRepositories: repositories.filter(repo => repo.dataReady).length,
    totalLogicalRepositories: repositories.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    version: 'agid-oceania-repository-creation-plan-v1',
    owner: 'dawnportinfo-design',
    policy: {
      physicalCreation: 'Create the Oceania continent and region indexes first. Country parents and Australia child repositories remain planned until maintainers and datasets are ready.',
      ownerRequirement: 'Create repositories only while authenticated as the target owner or an organization admin. Do not let GitHub CLI fall back to the current personal account.',
      noRawAddress: 'Do not store raw personal addresses, recipient records, private coordinates, witness data, or private keys in public repositories.',
      islandAndMarineBoundary: 'Oceania packs may store island, reef, atoll, port, shore-handoff, and coarse marine area references, but precise private coordinates and large GIS extracts stay outside GitHub.',
      heavyData: 'Keep building polygons, coordinates, search indexes, tiles, OSM/Overture extracts, hydrographic data, and generated caches in external content-addressed packs.',
    },
    summary,
    repositories,
  };
}

export function writeOceaniaRepositoryCreationPlan() {
  const plan = buildOceaniaRepositoryCreationPlan();
  const outputPath = path.resolve('data/global_entities/agid-oceania-repository-creation-plan.json');
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return { outputPath, plan };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { outputPath, plan } = writeOceaniaRepositoryCreationPlan();
  console.log(JSON.stringify({ outputPath, summary: plan.summary }, null, 2));
}
