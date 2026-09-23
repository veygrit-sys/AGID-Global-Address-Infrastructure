import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  buildUsStateRepositoryPacks,
  summarizeUsStateRepositoryPacks,
  validateUsStateRepositoryPacks,
  type UsStateRepositoryPack,
} from '../src/lib/usStateRepositoryPacks';

const OUTPUT_ROOT = join(process.cwd(), 'data', 'open_geo_repositories', 'us-state-repositories');
const DOC_PATH = join(process.cwd(), 'docs', 'us-state-repository-packs.md');

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(path: string, value: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value, 'utf8');
}

function readme(pack: UsStateRepositoryPack) {
  return `# ${pack.repository}

AGID United States state repository seed for ${pack.stateName}.

This repository pack is public-safe by design. It contains state-level geography seeds,
gazetteer starter names, source metadata, quality gates, and conformance vectors. It does
not contain raw personal addresses, recipient records, proof witnesses, USPS delivery-point
payloads, or private-key material.

## Scope

- Country: ${pack.countryName} (${pack.countryCode})
- State: ${pack.stateName} (${pack.stateCode})
- Parent repository: ${pack.parentRepository}
- Geometry seed: bbox + centroid only
- Gazetteer seed: state name, capital, and major city starters

## What This Is Not

${pack.nonClaims.map(claim => `- ${claim}`).join('\n')}

## Quality Gates

${pack.qualityGates.map(gate => `- ${gate}`).join('\n')}

## Next Import Tasks

${pack.nextImportTasks.map(task => `- ${task}`).join('\n')}
`;
}

function license() {
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

function dataLicenses(pack: UsStateRepositoryPack) {
  return `# Data Licenses and Source Boundary

This repository pack is an AGID seed package for ${pack.stateName}. The AGID-authored
metadata, tests, and documentation are released under the repository license. External
source materials remain governed by their original providers.

## Bundled Data

- State-level bbox and centroid seed
- Capital centroid seed
- Major city name seeds
- Source metadata and import policy
- Conformance vectors

## Not Bundled

- Raw personal addresses
- Recipient records
- USPS restricted API responses
- ZIP+4 delivery-point payloads
- Full TIGER/Line geometry extracts
- OSM database extracts
- Proof witnesses or private-key material

## Source Ledger

${pack.sources.map(source => `- ${source.sourceId}: ${source.name} - ${source.redistribution}; ${source.licenseStatus}`).join('\n')}

Before importing full geometry, postal, POI, or routing datasets, review the current
provider terms and store checksums, source vintage, attribution, and redistribution rules.
`;
}

function conformanceVectors(pack: UsStateRepositoryPack) {
  return {
    repository: pack.repository,
    stateCode: pack.stateCode,
    vectors: [
      {
        id: `${pack.stateCode.toLowerCase()}-manifest-public-safe`,
        expected: {
          containsPersonalData: false,
          containsRawAddresses: false,
          containsProofSecrets: false,
        },
      },
      {
        id: `${pack.stateCode.toLowerCase()}-bbox-centroid-present`,
        expected: {
          bboxPrecision: pack.geodata.boundarySeed.bbox.precision,
          centroidPrecision: pack.geodata.boundarySeed.centroid.precision,
        },
      },
      {
        id: `${pack.stateCode.toLowerCase()}-capital-seed-present`,
        input: pack.stateName,
        expected: {
          hasCapitalSeed: true,
          placeCountAtLeast: 5,
        },
      },
    ],
  };
}

function doc(packs: UsStateRepositoryPack[]) {
  const summary = summarizeUsStateRepositoryPacks(packs);
  return `# US State Repository Packs

This document records the local AGID repository packs for all 50 United States states.
Each pack can be promoted to a GitHub repository under \`dawnportinfo-design\` after
review. The packs are intentionally metadata-first: they provide geography and gazetteer
seeds without bundling raw address, USPS restricted, proof-secret, or recipient data.

## Summary

- Version: ${summary.version}
- State repositories: ${summary.stateRepositoryCount}
- Geodata seeds: ${summary.geodataSeedCount}
- Gazetteer place seeds: ${summary.placeSeedCount}
- Output root: \`data/open_geo_repositories/us-state-repositories\`

## Repository List

${packs.map(pack => `- \`${pack.repository}\` - ${pack.stateName} (${pack.stateCode})`).join('\n')}

## Shared Source Policy

${packs[0]?.sources.map(source => `- ${source.sourceId}: ${source.name} (${source.redistribution}, ${source.licenseStatus})`).join('\n') ?? ''}

## Release Boundary

These packs are suitable as open-source state repository starters only after a human
review confirms current source terms. They are not complete address datasets and do not
claim deliverability, ZIP validity, legal boundary precision, or USPS delivery-point
coverage.
`;
}

function main() {
  const packs = buildUsStateRepositoryPacks();
  const errors = validateUsStateRepositoryPacks(packs);
  if (errors.length) {
    throw new Error(`US state repository pack validation failed:\n${errors.join('\n')}`);
  }

  for (const pack of packs) {
    const repoRoot = join(OUTPUT_ROOT, pack.repository);
    writeText(join(repoRoot, 'README.md'), readme(pack));
    writeText(join(repoRoot, 'LICENSE'), license());
    writeText(join(repoRoot, 'DATA_LICENSES.md'), dataLicenses(pack));
    writeJson(join(repoRoot, 'manifest.json'), {
      schemaVersion: pack.schemaVersion,
      repository: pack.repository,
      parentRepository: pack.parentRepository,
      owner: pack.owner,
      countryCode: pack.countryCode,
      countryName: pack.countryName,
      stateCode: pack.stateCode,
      stateName: pack.stateName,
      officialStateId: pack.officialStateId,
      generatedAt: pack.generatedAt,
      purpose: pack.purpose,
      privacyBoundary: pack.privacyBoundary,
    });
    writeJson(join(repoRoot, 'sources.json'), pack.sources);
    writeJson(join(repoRoot, 'geodata', 'state-seed.json'), pack.geodata);
    writeJson(join(repoRoot, 'gazetteer', 'place-seeds.json'), pack.gazetteer.placeSeeds);
    writeJson(join(repoRoot, 'quality-gates.json'), {
      repository: pack.repository,
      qualityGates: pack.qualityGates,
      nonClaims: pack.nonClaims,
      nextImportTasks: pack.nextImportTasks,
    });
    writeJson(join(repoRoot, 'tests', 'conformance-vectors.json'), conformanceVectors(pack));
  }

  writeJson(join(OUTPUT_ROOT, 'index.json'), summarizeUsStateRepositoryPacks(packs));
  writeText(DOC_PATH, doc(packs));
  console.log(`Prepared ${packs.length} US state repository packs at ${OUTPUT_ROOT}`);
}

main();
