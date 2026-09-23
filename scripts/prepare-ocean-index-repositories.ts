import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type CreationPlanRepo = {
  repository: string;
  kind: 'ocean-root-index' | 'ocean-index' | 'sea-child';
  ocean?: string;
  seaId?: string;
  seaName?: string;
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
  const planPath = path.resolve('data/global_entities/agid-ocean-repository-creation-plan.json');
  return JSON.parse(readFileSync(planPath, 'utf8')) as CreationPlan;
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readmeFor(repository: CreationPlanRepo, plan: CreationPlan, related: CreationPlanRepo[]) {
  const title = repository.kind === 'ocean-root-index'
    ? 'AGID Ocean Index'
    : `AGID ${titleFromId(repository.ocean ?? repository.repository)} Ocean Index`;
  const childLines = related
    .map(child => {
      const label = child.seaName ? ` - ${child.seaName}` : child.ocean ? ` - ${titleFromId(child.ocean)}` : '';
      return `- \`${child.repository}\`${label}`;
    })
    .join('\n');

  return `# ${title}

${repository.description}

## Status

- Owner: \`${plan.owner}\`
- Repository: \`${repository.repository}\`
- Stage: \`${repository.stage}\`
- Data readiness: \`${repository.dataReady ? 'index-ready' : 'not-data-ready'}\`
- Privacy: no raw personal address, recipient, precise private coordinate, witness, proof-secret, or private-key material.

## Scope

This repository is an AGID coordination index for marine addressable geography.
It stores repository pointers, multilingual name policy, source policy, coarse
boundary or bounding-box policy, adjacency policy, quality gates, and
conformance status.

It does not store private delivery addresses, recipient records, precise private
coordinates, witness material, private keys, large hydrographic extracts, map
tiles, generated search indexes, AIS/telemetry streams, or political claims.

## Related Repositories

${childLines || '- No child repositories are assigned in this wave.'}

## Data Boundary

GitHub may contain safe manifests, source notes, repository plans, synthetic
fixtures, quality gate metadata, and coarse non-personal marine references.
Precise hydrographic geometry, bathymetry, tiles, external GIS extracts,
generated caches, and operational telemetry must stay in external
content-addressed packs.

## Disputed Names, EEZ, And Sovereignty

AGID marine identifiers are technical addressing references. They do not decide
sovereignty, EEZ rights, or geopolitical claims. Disputed names and EEZ
relations must be source-attributed and display-policy switchable.

## Natural Features

Mountains, deserts, rivers, and lakes stay in country-or-region natural-feature
packs by default. A separate repository should be created only when scale,
maintainer ownership, and source boundaries justify it.

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

export function prepareOceanIndexRepositories(outputRoot = path.resolve('reports/ocean-index-repositories')) {
  const plan = readPlan();
  const immediate = plan.repositories.filter(repository => repository.githubCreateNow);
  rmSync(outputRoot, { recursive: true, force: true });

  for (const repository of immediate) {
    const related = repository.kind === 'ocean-root-index'
      ? plan.repositories.filter(candidate => candidate.parentRepository === repository.repository)
      : plan.repositories.filter(candidate => candidate.parentRepository === repository.repository);
    const repoDir = path.join(outputRoot, repository.repository);
    mkdirSync(path.join(repoDir, '.github', 'workflows'), { recursive: true });

    writeFileSync(path.join(repoDir, 'README.md'), readmeFor(repository, plan, related), 'utf8');
    writeFileSync(path.join(repoDir, 'LICENSE'), licenseText(), 'utf8');
    writeFileSync(path.join(repoDir, '.github', 'workflows', 'validate.yml'), workflowYaml(), 'utf8');
    writeFileSync(
      path.join(repoDir, 'DATA_LICENSES.md'),
      '# Data Licenses\n\nThis index stores metadata, repository pointers, and synthetic fixtures only. External marine datasets must be referenced through source manifests and their upstream licenses.\n',
      'utf8',
    );
    writeJson(path.join(repoDir, 'manifest.json'), {
      schemaVersion: 'agid-ocean-index-repository-manifest-v0.1',
      repository: repository.repository,
      kind: repository.kind,
      owner: plan.owner,
      canonicalDomain: 'ocean',
      ocean: repository.ocean ?? null,
      stage: repository.stage,
      dataReady: repository.dataReady,
      sourcePlanVersion: plan.version,
      generatedAt: plan.generatedAt,
      privacy: {
        rawAddressStorage: false,
        recipientStorage: false,
        precisePrivateCoordinates: false,
        witnessMaterial: false,
        proofSecrets: false,
        privateKeys: false,
      },
      relatedRepositories: related.map(child => ({
        repository: child.repository,
        kind: child.kind,
        ocean: child.ocean ?? null,
        seaId: child.seaId ?? null,
        seaName: child.seaName ?? null,
        stage: child.stage,
        dataReady: child.dataReady,
      })),
    });
    writeJson(path.join(repoDir, 'sources.json'), {
      schemaVersion: 'agid-marine-source-policy-v0.1',
      repository: repository.repository,
      sourcePolicy: [
        'Prefer official hydrographic offices, IHO-aligned references, open GIS, government, academic, and openly licensed marine-name sources.',
        'Keep precise hydrographic geometry, bathymetry, map tiles, search indexes, AIS/telemetry, and generated caches outside GitHub.',
        'Track upstream licenses and source dates before publishing any marine data pack.',
        'Represent disputed naming, EEZ, and maritime boundary material as source-attributed display policy, not sovereignty determination.',
      ],
      noRawMaterial: [
        'raw personal address',
        'recipient record',
        'precise private coordinate',
        'witness material',
        'proof secret',
        'private key',
        'operational telemetry',
      ],
    });
    writeJson(path.join(repoDir, 'quality-gates.json'), {
      schemaVersion: 'agid-ocean-quality-gates-v0.1',
      repository: repository.repository,
      gates: [
        { id: 'json-valid', required: true },
        { id: 'no-raw-address', required: true },
        { id: 'source-license-declared', required: true },
        { id: 'coarse-boundary-or-bbox-declared', required: true },
        { id: 'adjacency-policy-declared', required: true },
        { id: 'eez-and-disputed-display-policy', required: true },
        { id: 'natural-feature-boundary-declared', required: true },
        { id: 'large-gis-externalized', required: true },
      ],
    });
    writeJson(path.join(repoDir, 'repositories.json'), {
      schemaVersion: 'agid-ocean-related-repositories-v0.1',
      repository: repository.repository,
      relatedRepositories: related,
    });
  }

  return { outputRoot, repositories: immediate.map(repository => repository.repository) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputIndex = process.argv.findIndex(argument => argument === '--output');
  const outputRoot = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : undefined;
  console.log(JSON.stringify(prepareOceanIndexRepositories(outputRoot), null, 2));
}
