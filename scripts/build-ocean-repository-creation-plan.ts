import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  naturalFeaturePolicy: Record<string, {
    independentRepository: false;
    storage: string;
    minimumFields: string[];
    fallbackReference: string;
  }>;
};

type CreationPlanRepo = {
  repository: string;
  kind: 'ocean-root-index' | 'ocean-index' | 'sea-child';
  ocean?: OceanId;
  seaId?: string;
  seaName?: string;
  parentRepository?: string;
  boundary?: { n: number; s: number; w: number; e: number };
  stage: 'wave-0-index' | 'wave-1-sea-logical-plan';
  githubCreateNow: boolean;
  dataReady: boolean;
  creationRationale: string;
  description: string;
};

function loadOceanPlacement() {
  const placementPath = path.resolve('data/global_entities/agid-ocean-repository-placement.json');
  return JSON.parse(readFileSync(placementPath, 'utf8')) as OceanRepositoryPlacement;
}

export function buildOceanRepositoryCreationPlan() {
  const placement = loadOceanPlacement();
  const repositories: CreationPlanRepo[] = [
    {
      repository: placement.root.repository,
      kind: 'ocean-root-index',
      stage: 'wave-0-index',
      githubCreateNow: true,
      dataReady: true,
      creationRationale: 'The ocean root can be completed as a safe coordination index before child sea datasets are published.',
      description: 'AGID ocean root index for marine addressable geography, ocean packs, sea-area logical repositories, and source policy.',
    },
  ];

  for (const ocean of placement.oceanRepositories) {
    repositories.push({
      repository: ocean.repository,
      kind: 'ocean-index',
      ocean: ocean.id,
      parentRepository: placement.root.repository,
      stage: 'wave-0-index',
      githubCreateNow: true,
      dataReady: true,
      creationRationale: 'Ocean indexes can publish repository pointers, coarse boundary policy, multilingual name policy, source policy, and quality gates without storing private address material.',
      description: `AGID ${ocean.name} index for sea-area logical repositories, marine names, coarse boundaries, adjacency, and source policy.`,
    });

    for (const sea of ocean.childSeaRepositories) {
      repositories.push({
        repository: sea.repository,
        kind: 'sea-child',
        ocean: ocean.id,
        seaId: sea.id,
        seaName: sea.name,
        parentRepository: ocean.repository,
        boundary: sea.boundary,
        stage: 'wave-1-sea-logical-plan',
        githubCreateNow: false,
        dataReady: false,
        creationRationale: 'Physical sea-area repositories stay logical until source licensing, boundary precision, maintainers, and pull-request pressure justify creation.',
        description: `Planned AGID marine pack for ${sea.name}; stores names, coarse boundary or bbox, adjacency, source metadata, and quality gates only.`,
      });
    }
  }

  const seaLogicalRepositories = repositories.filter(repository => repository.kind === 'sea-child').length;
  const summary = {
    domain: 'ocean',
    rootRepository: placement.root.repository,
    oceanRepositories: repositories.filter(repository => repository.kind === 'ocean-index').length,
    seaLogicalRepositories,
    githubCreateNow: repositories.filter(repository => repository.githubCreateNow).length,
    dataReadyRepositories: repositories.filter(repository => repository.dataReady).length,
    totalLogicalRepositories: repositories.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    version: 'agid-ocean-repository-creation-plan-v1',
    owner: 'dawnportinfo-design',
    policy: {
      physicalCreation: 'Create agid-ocean and the five ocean index repositories first. Sea, gulf, bay, strait, and inlet repositories remain logical until source licensing, maintainers, and data volume justify physical repos.',
      ownerRequirement: 'Create repositories only while authenticated as dawnportinfo-design or an organization admin. Do not let GitHub CLI fall back to another account.',
      noRawAddress: 'Do not store raw personal addresses, recipient records, private delivery coordinates, witness data, proof secrets, or private keys in public ocean repositories.',
      marineBoundary: 'Ocean and sea repositories may store multilingual names, coarse boundaries or bounding boxes, adjacency, source metadata, and optional EEZ relation metadata.',
      eezAndDisputedPolicy: 'AGID marine identifiers are technical addressing and navigation references, not sovereignty claims; disputed names and EEZ relations must be source-attributed and policy-switchable.',
      naturalFeatureBoundary: 'Mountains, deserts, rivers, and lakes stay in country-or-region natural-feature packs by default; create independent repositories only after evidence of scale, maintenance ownership, and source boundaries.',
      heavyData: 'Keep precise hydrographic geometry, tiles, bathymetry, AIS/telemetry, search indexes, generated caches, and large GIS extracts in external content-addressed packs.',
    },
    naturalFeaturePolicy: placement.naturalFeaturePolicy,
    summary,
    repositories,
  };
}

export function writeOceanRepositoryCreationPlan() {
  const plan = buildOceanRepositoryCreationPlan();
  const outputPath = path.resolve('data/global_entities/agid-ocean-repository-creation-plan.json');
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return { outputPath, plan };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { outputPath, plan } = writeOceanRepositoryCreationPlan();
  console.log(JSON.stringify({ outputPath, summary: plan.summary }, null, 2));
}
