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

export type CountryRepositoryCreationPlanOptions = {
  countryCode: string;
  owner?: string;
  createChildrenNow?: boolean;
};

type CountryRepositoryCreationEvidenceState =
  | 'parent-bootstrap-ready'
  | 'logical-child-awaiting-data'
  | 'explicit-child-setup-requested';

type CountryRepositoryCreationPlanRepo = {
  repository: string;
  kind: 'country-parent' | 'country-child';
  continent: string;
  region: string;
  countryCode: string;
  countryName: string;
  parentRepository?: string;
  stage: 'country-parent' | 'country-child';
  githubCreateNow: boolean;
  evidenceState: CountryRepositoryCreationEvidenceState;
  dataReady: boolean;
  creationRationale: string;
  description: string;
};

function loadPlacement() {
  const placementPath = path.resolve('data/global_entities/agid-repository-placement.json');
  return JSON.parse(readFileSync(placementPath, 'utf8')) as { continents: PlacementContinent[] };
}

function findCountry(countryCode: string) {
  const requestedCode = countryCode.trim().toUpperCase();
  const placement = loadPlacement();

  for (const continent of placement.continents) {
    for (const region of continent.regions) {
      const country = region.countries.find(candidate => candidate.code.toUpperCase() === requestedCode);
      if (country) {
        return { continent, region, country };
      }
    }
  }

  throw new Error(`Missing country code ${requestedCode} in agid-repository-placement.json`);
}

function countryLabel(country: PlacementCountry) {
  return `${country.name} (${country.code.toUpperCase()})`;
}

export function buildCountryRepositoryCreationPlan(options: CountryRepositoryCreationPlanOptions) {
  const { continent, region, country } = findCountry(options.countryCode);
  const owner = options.owner ?? 'dawnportinfo-design';
  const createChildrenNow = options.createChildrenNow ?? false;
  const repositories: CountryRepositoryCreationPlanRepo[] = [
    {
      repository: country.repository,
      kind: 'country-parent',
      continent: continent.id,
      region: region.id,
      countryCode: country.code,
      countryName: country.name,
      parentRepository: region.repository,
      stage: 'country-parent',
      githubCreateNow: true,
      evidenceState: 'parent-bootstrap-ready',
      dataReady: true,
      creationRationale: 'Parent repositories can be bootstrapped with manifest, rules, sources, quality gates, and synthetic fixtures before any real address dataset is published.',
      description: `AGID country or territory pack for ${countryLabel(country)}; stores safe rules, sources, quality gates, and synthetic fixtures only.`,
    },
  ];

  for (const childRepository of country.recommendedChildren ?? []) {
    const childEvidenceState: CountryRepositoryCreationEvidenceState = createChildrenNow
      ? 'explicit-child-setup-requested'
      : 'logical-child-awaiting-data';
    repositories.push({
      repository: childRepository,
      kind: 'country-child',
      continent: continent.id,
      region: region.id,
      countryCode: country.code,
      countryName: country.name,
      parentRepository: country.repository,
      stage: 'country-child',
      githubCreateNow: createChildrenNow,
      evidenceState: childEvidenceState,
      dataReady: false,
      creationRationale: createChildrenNow
        ? 'Physical child repository creation was explicitly requested, but data publication still requires manifest, sources, quality gates, tests, and no-raw checks.'
        : 'Logical child repository is retained in the global plan until maintainers, datasets, and review pressure justify physical creation.',
      description: `AGID child pack for ${countryLabel(country)}; create only when the target owner preflight passes.`,
    });
  }

  const summary = {
    countryCode: country.code,
    countryName: country.name,
    parentRepository: country.repository,
    childRepositories: repositories.filter(repository => repository.kind === 'country-child').length,
    githubCreateNow: repositories.filter(repository => repository.githubCreateNow).length,
    dataReadyRepositories: repositories.filter(repository => repository.dataReady).length,
    logicalOnlyRepositories: repositories.filter(repository => !repository.githubCreateNow).length,
    childRepositoriesAwaitingData: repositories.filter(repository => repository.kind === 'country-child' && !repository.dataReady).length,
    totalRepositories: repositories.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    version: 'agid-country-repository-creation-plan-v1',
    owner,
    policy: {
      ownerRequirement: 'Create repositories only while authenticated as the target owner or an organization admin. Do not let GitHub CLI fall back to the current personal account.',
      noRawAddress: 'Do not store raw personal addresses, recipient records, private coordinates, witness data, or private keys in public repositories.',
      heavyData: 'Keep building polygons, coordinates, search indexes, tiles, OSM/Overture extracts, and generated caches in external content-addressed packs.',
      childDataReadiness: 'A child repository marked for GitHub creation is not data-ready by default; it must still add manifest, sources, quality gates, tests, and no-raw checks before publication.',
      stagedCreation: createChildrenNow
        ? 'This country plan intentionally marks parent and child repositories for creation because the country was explicitly selected for full setup.'
        : 'This country plan marks only the parent repository for creation; children remain logical until maintainers and datasets are ready.',
    },
    source: {
      continent: continent.id,
      continentRepository: continent.repository,
      region: region.id,
      regionRepository: region.repository,
      splitStrategy: country.splitStrategy,
    },
    summary,
    repositories,
  };
}

export function writeCountryRepositoryCreationPlan(options: CountryRepositoryCreationPlanOptions) {
  const plan = buildCountryRepositoryCreationPlan(options);
  const countryCode = options.countryCode.trim().toLowerCase();
  const outputPath = path.resolve(`data/global_entities/agid-${countryCode}-repository-creation-plan.json`);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return { outputPath, plan };
}

function parseArgs(argv: string[]) {
  const countryIndex = argv.findIndex(argument => argument === '--country');
  const ownerIndex = argv.findIndex(argument => argument === '--owner');
  const positional = argv.filter(argument => !argument.startsWith('--'));
  return {
    countryCode: countryIndex >= 0 ? argv[countryIndex + 1] : positional[0] ?? 'CA',
    owner: ownerIndex >= 0 ? argv[ownerIndex + 1] : positional[1] ?? 'dawnportinfo-design',
    createChildrenNow: argv.includes('--create-children-now') || positional.includes('create-children-now'),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { outputPath, plan } = writeCountryRepositoryCreationPlan(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify({ outputPath, summary: plan.summary }, null, 2));
}
