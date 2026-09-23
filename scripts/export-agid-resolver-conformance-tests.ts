import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  AGID_RESOLVER_CONFORMANCE_VERSION,
  buildAgidResolverConformanceSuite,
  validateAgidResolverConformanceSuite,
} from '../src/lib/agidResolverConformance';

const DEFAULT_GENERATED_AT = '2026-06-20T00:00:00.000Z';

function suiteReadme(generatedAt: string) {
  return `# AGID Resolver Conformance Tests

Version: ${AGID_RESOLVER_CONFORMANCE_VERSION}
Generated at: ${generatedAt}

This pack defines public conformance cases for AGID resolver implementations:

- local AGID encode/decode behavior
- encrypted AGID-S key-gating behavior
- standard-library local-first resolver planning
- federated resolver commitment consensus
- privacy-boundary rejection for unsafe public/server modes

All cases are synthetic fixtures. The negative case uses a synthetic sentinel only and
exists to prove that private-field input is rejected before resolver sources are called.

## Files

- \`manifest.json\`: suite identity, counts, redistribution policy, and file map.
- \`agid-resolver-conformance-suite.json\`: complete generated suite.
- \`test-cases.json\`: conformance cases only.
- \`checklists.json\`: manual implementation audit checklists.
- \`README.md\`: this document.

## Conformance Rule

A conforming resolver must pass every case in \`test-cases.json\` and must preserve the
privacy flags declared in each expected result. Implementations may add stronger local
verification, but they must not turn free-form input into strong verification without
evidence, and they must not send private fields to public or federated sources.

## Privacy Boundary

The distributable fixtures must not contain real user addresses, recipient names,
phone numbers, emails, proof codes, AOID secrets, AGID-S plaintext, passkey challenges,
or third-party address datasets.

## Regenerate

\`\`\`bash
npm run export:agid-resolver-conformance
\`\`\`

## Verify

\`\`\`bash
npm run verify:agid-resolver-conformance
\`\`\`
`;
}

async function writeJson(outDir: string, fileName: string, value: unknown) {
  await writeFile(join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const generatedAt = process.env.AGID_RESOLVER_CONFORMANCE_GENERATED_AT || DEFAULT_GENERATED_AT;
  const suite = buildAgidResolverConformanceSuite({ generatedAt });
  const validation = validateAgidResolverConformanceSuite(suite);

  if (!validation.valid) {
    throw new Error(`AGID Resolver Conformance Tests are invalid: ${validation.errors.join(', ')}`);
  }

  const outDir = join(process.cwd(), 'data', 'agid_resolver_conformance');
  await mkdir(outDir, { recursive: true });
  await writeJson(outDir, 'manifest.json', suite.manifest);
  await writeJson(outDir, 'agid-resolver-conformance-suite.json', suite);
  await writeJson(outDir, 'test-cases.json', suite.cases);
  await writeJson(outDir, 'checklists.json', suite.checklists);
  await writeFile(join(outDir, 'README.md'), suiteReadme(generatedAt), 'utf8');

  console.log(`AGID Resolver Conformance Tests exported to ${outDir}`);
  console.log(`cases=${suite.manifest.counts.cases}`);
  console.log(`negativeCases=${suite.manifest.counts.negativeCases}`);
  console.log(`local=${suite.manifest.counts.surfaces['agid-local-resolver']}`);
  console.log(`federated=${suite.manifest.counts.surfaces['federated-resolver']}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
