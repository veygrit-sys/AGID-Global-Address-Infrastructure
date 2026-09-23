import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type CreationPlanRepo = {
  repository: string;
  kind: 'continent-index' | 'region-index' | 'country-parent' | 'country-child';
  region?: string;
  countryCode?: string;
  countryName?: string;
  parentRepository?: string;
  stage: string;
  githubCreateNow: boolean;
  dataReady: boolean;
  creationRationale: string;
  description: string;
};

type CreationPlan = {
  generatedAt: string;
  version: string;
  owner: string;
  policy: Record<string, string>;
  summary: Record<string, unknown>;
  repositories: CreationPlanRepo[];
};

function titleFromId(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function readPlan() {
  const planPath = path.resolve('data/global_entities/agid-asia-repository-creation-plan.json');
  return JSON.parse(readFileSync(planPath, 'utf8')) as CreationPlan;
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function scopeNote(repository: CreationPlanRepo) {
  if (repository.region === 'east_asia') {
    return 'The East Asia index tracks high-volume national systems, special administrative regions, dense megacities, multilingual scripts, and staged child repositories for China, Japan, Korea, Taiwan, Hong Kong, and Macao.';
  }
  if (repository.region === 'southeast_asia') {
    return 'The Southeast Asia index tracks archipelagic, island, postal-weak, no-postal-code, megacity, and fast-growing logistics regions without storing raw address material.';
  }
  if (repository.region === 'south_asia') {
    return 'The South Asia index tracks very large address systems, dense urban areas, rural delivery patterns, multilingual scripts, and staged physical country or child repositories.';
  }
  if (repository.region === 'central_asia') {
    return 'The Central Asia index tracks wide-area, cross-border, low-density, and multilingual address infrastructure with explicit source and data-readiness policy.';
  }
  if (repository.region === 'middle_east') {
    return 'The Middle East index tracks postal-code, postal-weak, no-postal-code, desert, urban, disputed-boundary, and multilingual address infrastructure with strict display policy.';
  }
  if (repository.region === 'caucasus') {
    return 'The Caucasus index tracks cross-continental placement, multilingual naming, disputed-boundary display policy, and country packs that remain technically organized under Asia.';
  }
  return 'The Asia index coordinates East Asia, Southeast Asia, South Asia, Central Asia, the Middle East, Caucasus, territories, special regions, and staged country packs.';
}

function readmeFor(repository: CreationPlanRepo, plan: CreationPlan, related: CreationPlanRepo[]) {
  const title = repository.kind === 'continent-index'
    ? 'AGID Asia Index'
    : `AGID ${titleFromId(repository.region ?? repository.repository)} Index`;
  const childLines = related
    .map(child => `- \`${child.repository}\`${child.countryCode ? ` - ${child.countryName} (${child.countryCode})` : ''}`)
    .join('\n');

  return `# ${title}

${repository.description}

## Status

- Owner: \`${plan.owner}\`
- Repository: \`${repository.repository}\`
- Stage: \`${repository.stage}\`
- Index readiness: \`index-ready\`
- Country data readiness: \`${repository.dataReady ? 'sample-ready' : 'plan-only'}\`
- Privacy: no raw personal address, recipient, precise private coordinate, witness, proof-secret, or private-key material.

## Scope

${scopeNote(repository)}

This repository is an AGID coordination index. It stores repository pointers,
safe source policy, postal status, quality gates, conformance status, and
special-region display policy for Asia address infrastructure.

It does not store private delivery addresses, recipient records, precise private
coordinates, witness material, proof secrets, private keys, large GIS extracts,
map tiles, search indexes, routing networks, or carrier operational datasets.

## Related Repositories

${childLines || '- No child repositories are assigned in this wave.'}

## Data Boundary

GitHub may contain synthetic fixtures, rules, manifests, source notes, postal
status, repository placement, and quality gate metadata. Large geography,
hydrographic datasets, building polygons, OSM/Overture extracts, routing
networks, map tiles, search indexes, and generated caches must stay in external
content-addressed packs.

## Country And Territory Creation Policy

Physical country repositories are created only when they have enough content to
be useful: README, manifest, postal status, source policy, quality gates,
synthetic tests, no-raw-address guardrails, and a maintainer path. Planned child
repositories stay in this index until data volume, ownership, or pull-request
pressure justifies a split.

## Postal-Weak And Multilingual Policy

Asia packs can include postal-code, postal-weak, no-postal-code, island, desert,
border, disaster, high-rise, informal-settlement, and multilingual-script modes.
Those modes must be represented as technical address infrastructure and never
as publication of personal addresses.

## Special Region Policy

AGID repository placement is a technical address-data organization rule. It does
not imply sovereignty, recognition, or territorial ownership. Disputed, de
facto, overseas, island, desert, or special regions must carry explicit source,
license, canonical region, and display policy before data publication.

## Validation

The repository includes JSON manifests and a lightweight GitHub Actions workflow
that validates JSON files. Public release content must pass AGID no-raw-address
review before data publication.
`;
}

function licenseText() {
  return `MIT License

Copyright (c) 2026 AGID contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

function workflowYaml() {
  return `name: validate

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  validate-json:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Validate JSON manifests
        run: |
          node -e "const fs=require('fs'); for (const f of fs.readdirSync('.').filter(x=>x.endsWith('.json'))) JSON.parse(fs.readFileSync(f,'utf8'));"
`;
}

function contributingText() {
  return `# Contributing

This index accepts metadata, source policy, quality gate, and repository
placement improvements only.

Do not submit raw personal addresses, recipient records, precise private
coordinates, carrier operational records, witness material, proof secrets, or
private keys. Large GIS extracts and generated indexes should be linked through
source manifests and content-addressed external packs instead of committed to
GitHub.
`;
}

function securityText() {
  return `# Security Policy

Report suspected exposure of personal address data, recipient data, witness
material, proof secrets, private keys, or precise private coordinates before
opening a public issue.

This repository is an index and should contain metadata only. Pull requests that
add raw address material or secrets must be rejected and replaced with redacted
synthetic fixtures or source manifests.
`;
}

export function prepareAsiaIndexRepositories(outputRoot = path.resolve('reports/asia-index-repositories')) {
  const plan = readPlan();
  const immediate = plan.repositories.filter(repository => repository.githubCreateNow);
  rmSync(outputRoot, { recursive: true, force: true });

  for (const repository of immediate) {
    const related = repository.kind === 'continent-index'
      ? plan.repositories.filter(candidate => candidate.parentRepository === undefined && candidate.kind === 'region-index')
      : plan.repositories.filter(candidate => candidate.parentRepository === repository.repository);
    const repoDir = path.join(outputRoot, repository.repository);
    mkdirSync(path.join(repoDir, '.github', 'workflows'), { recursive: true });

    writeFileSync(path.join(repoDir, 'README.md'), readmeFor(repository, plan, related), 'utf8');
    writeFileSync(path.join(repoDir, 'LICENSE'), licenseText(), 'utf8');
    writeFileSync(path.join(repoDir, 'CONTRIBUTING.md'), contributingText(), 'utf8');
    writeFileSync(path.join(repoDir, 'SECURITY.md'), securityText(), 'utf8');
    writeFileSync(path.join(repoDir, '.github', 'workflows', 'validate.yml'), workflowYaml(), 'utf8');
    writeFileSync(
      path.join(repoDir, 'DATA_LICENSES.md'),
      '# Data Licenses\n\nThis index stores metadata and synthetic fixtures only. External datasets must be referenced through source manifests and their upstream licenses.\n',
      'utf8',
    );
    writeJson(path.join(repoDir, 'manifest.json'), {
      schemaVersion: 'agid-index-repository-manifest-v0.1',
      repository: repository.repository,
      kind: repository.kind,
      owner: plan.owner,
      canonicalContinent: 'asia',
      region: repository.region ?? null,
      stage: repository.stage,
      indexReady: true,
      dataReady: repository.dataReady,
      sourcePlanVersion: plan.version,
      generatedAt: plan.generatedAt,
      privacy: {
        rawAddressStorage: false,
        recipientStorage: false,
        precisePrivateCoordinates: false,
        witnessMaterial: false,
        privateKeys: false,
        carrierOperationalData: false,
        proofSecrets: false,
      },
      relatedRepositories: related.map(child => ({
        repository: child.repository,
        kind: child.kind,
        countryCode: child.countryCode ?? null,
        countryName: child.countryName ?? null,
        stage: child.stage,
        dataReady: child.dataReady,
      })),
    });
    writeJson(path.join(repoDir, 'sources.json'), {
      schemaVersion: 'agid-source-policy-v0.1',
      repository: repository.repository,
      sourcePolicy: [
        'Prefer official government, postal, customs, open GIS, hydrographic, and openly licensed map sources.',
        'Keep large GIS extracts, tiles, building polygons, search indexes, routing networks, and generated caches outside GitHub.',
        'Track upstream licenses before publishing any country, territory, island, or special-region data pack.',
        'Postal-weak, no-postal-code, island, border, disputed, overseas, or special regions require explicit display and source policy before data publication.',
      ],
      noRawMaterial: [
        'raw personal address',
        'recipient record',
        'precise private coordinate',
        'witness material',
        'private key',
        'proof secret',
        'carrier operational record',
      ],
    });
    writeJson(path.join(repoDir, 'quality-gates.json'), {
      schemaVersion: 'agid-quality-gates-v0.1',
      repository: repository.repository,
      gates: [
        { id: 'json-valid', required: true },
        { id: 'no-raw-address', required: true },
        { id: 'source-license-declared', required: true },
        { id: 'breadcrumb-reconstruction-defined', required: true },
        { id: 'postal-status-declared', required: true },
        { id: 'special-region-display-policy', required: true },
        { id: 'large-gis-externalized', required: true },
        { id: 'country-child-split-justified', required: true },
      ],
    });
    writeJson(path.join(repoDir, 'repositories.json'), {
      schemaVersion: 'agid-related-repositories-v0.1',
      repository: repository.repository,
      relatedRepositories: related,
    });
  }

  return { outputRoot, repositories: immediate.map(repository => repository.repository) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputIndex = process.argv.findIndex(argument => argument === '--output');
  const outputRoot = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : undefined;
  console.log(JSON.stringify(prepareAsiaIndexRepositories(outputRoot), null, 2));
}
