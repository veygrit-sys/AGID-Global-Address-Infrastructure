import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type CreationPlanRepo = {
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

export type CreationPlan = {
  generatedAt: string;
  version: string;
  owner: string;
  policy: Record<string, string>;
  summary: Record<string, unknown>;
  repositories: CreationPlanRepo[];
};

export type IndexRepositoryConfig = {
  canonicalContinent: string;
  continentTitle: string;
  planPath: string;
  infrastructureLabel: string;
  scopeNote: (repository: CreationPlanRepo) => string;
  policySections: (repository: CreationPlanRepo) => string;
  sourcePolicy: string[];
  noRawMaterial?: string[];
};

function titleFromId(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readPlan(planPath: string) {
  return JSON.parse(readFileSync(path.resolve(planPath), 'utf8')) as CreationPlan;
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

function readmeFor(
  repository: CreationPlanRepo,
  plan: CreationPlan,
  related: CreationPlanRepo[],
  config: IndexRepositoryConfig,
) {
  const title = repository.kind === 'continent-index'
    ? config.continentTitle
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

${config.scopeNote(repository)}

This repository is an AGID coordination index. It stores repository pointers,
safe source policy, postal status, quality gates, conformance status, and
special-region display policy for ${config.infrastructureLabel}.

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

${config.policySections(repository)}

## Special Region Policy

AGID repository placement is a technical address-data organization rule. It does
not imply sovereignty, recognition, or territorial ownership. Disputed, de
facto, overseas, island, desert, polar, maritime, or special regions must carry
explicit source, license, canonical region, and display policy before data
publication.

## Validation

The repository includes JSON manifests and a lightweight GitHub Actions workflow
that validates JSON files. Public release content must pass AGID no-raw-address
review before data publication.
`;
}

export function prepareIndexRepositories(config: IndexRepositoryConfig, outputRoot: string) {
  const plan = readPlan(config.planPath);
  const immediate = plan.repositories.filter(repository => repository.githubCreateNow);
  rmSync(outputRoot, { recursive: true, force: true });

  for (const repository of immediate) {
    const related = repository.kind === 'continent-index'
      ? plan.repositories.filter(candidate => candidate.parentRepository === undefined && candidate.kind === 'region-index')
      : plan.repositories.filter(candidate => candidate.parentRepository === repository.repository);
    const repoDir = path.join(outputRoot, repository.repository);
    mkdirSync(path.join(repoDir, '.github', 'workflows'), { recursive: true });

    writeFileSync(path.join(repoDir, 'README.md'), readmeFor(repository, plan, related, config), 'utf8');
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
      canonicalContinent: config.canonicalContinent,
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
      sourcePolicy: config.sourcePolicy,
      noRawMaterial: config.noRawMaterial ?? [
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
