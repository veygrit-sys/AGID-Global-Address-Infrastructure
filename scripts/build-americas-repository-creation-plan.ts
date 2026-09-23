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
  description: string;
};

function loadAmericasPlacement() {
  const placementPath = path.resolve('data/global_entities/agid-repository-placement.json');
  const placement = JSON.parse(readFileSync(placementPath, 'utf8')) as { continents: PlacementContinent[] };
  const americas = placement.continents.find(continent => continent.id === 'americas');
  if (!americas) throw new Error('Missing americas placement in agid-repository-placement.json');
  return americas;
}

function titleFromId(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildAmericasRepositoryCreationPlan() {
  const americas = loadAmericasPlacement();
  const repositories: CreationPlanRepo[] = [
    {
      repository: americas.repository,
      kind: 'continent-index',
      stage: 'wave-0-index',
      githubCreateNow: true,
      description: 'AGID Americas index for North America, Central America, the Caribbean, South America, territories, and staged country packs.',
    },
  ];

  for (const region of americas.regions) {
    repositories.push({
      repository: region.repository,
      kind: 'region-index',
      region: region.id,
      stage: 'wave-0-index',
      githubCreateNow: true,
      description: `AGID ${titleFromId(region.id)} index for Americas country and territory repository coordination.`,
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
          description: `Planned AGID child repository for ${country.name}; create physically only after data volume, ownership, or PR pressure justifies it.`,
        });
      }
    }
  }

  const summary = {
    continent: 'americas',
    rootRepository: americas.repository,
    regionRepositories: repositories.filter(repo => repo.kind === 'region-index').length,
    countryParentRepositories: repositories.filter(repo => repo.kind === 'country-parent').length,
    childLogicalRepositories: repositories.filter(repo => repo.kind === 'country-child').length,
    githubCreateNow: repositories.filter(repo => repo.githubCreateNow).length,
    totalLogicalRepositories: repositories.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    version: 'agid-americas-repository-creation-plan-v1',
    owner: 'dawnportinfo-design',
    policy: {
      physicalCreation: 'Create continent and region indexes first. Country parents and child repositories remain planned until maintainers and datasets are ready.',
      ownerRequirement: 'Create repositories only while authenticated as the target owner or an organization admin. Do not let GitHub CLI fall back to the current personal account.',
      noRawAddress: 'Do not store raw personal addresses, recipient records, private coordinates, witness data, or private keys in public repositories.',
      heavyData: 'Keep building polygons, coordinates, search indexes, tiles, and OSM/Overture extracts in external content-addressed packs.',
    },
    summary,
    repositories,
  };
}

export function writeAmericasRepositoryCreationPlan() {
  const plan = buildAmericasRepositoryCreationPlan();
  const outputPath = path.resolve('data/global_entities/agid-americas-repository-creation-plan.json');
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return { outputPath, plan };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { outputPath, plan } = writeAmericasRepositoryCreationPlan();
  console.log(JSON.stringify({ outputPath, summary: plan.summary }, null, 2));
}
