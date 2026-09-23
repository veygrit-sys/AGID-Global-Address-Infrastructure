import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  ADDRESS_TEST_VECTOR_SUITE_VERSION,
  buildAddressTestVectorSuite,
  validateAddressTestVectorSuite,
} from '../src/lib/addressTestVectorSuite';

const DEFAULT_GENERATED_AT = '2026-06-20T00:00:00.000Z';

function suiteReadme(generatedAt: string) {
  return `# Address Test Vector Suite

Version: ${ADDRESS_TEST_VECTOR_SUITE_VERSION}
Generated at: ${generatedAt}

This suite provides public conformance fixtures for AGID address-facing surfaces:

- normalization
- open-source address validation
- domestic and international rendering
- language tab selection
- no-raw-private-material privacy boundaries

All vectors are either synthetic-public or redacted-public. They are intended for SDKs,
Address Element, Local Resolver, POS, Developer Console, and external implementers.

## Files

- \`manifest.json\`: suite identity, counts, redistribution policy, and file map.
- \`address-test-vector-suite.json\`: complete generated suite.
- \`vectors.json\`: vector array only.
- \`README.md\`: this document.

## Privacy Boundary

The suite must not contain real user addresses, recipient names, phone numbers, emails,
proof codes, private AOID material, AGID-S plaintext, passkey challenges, or passport
numbers. Synthetic address strings are allowed only as deterministic fixtures.

## Regenerate

\`\`\`bash
npm run export:address-test-vectors
\`\`\`

## Verify

\`\`\`bash
npm run verify:address-test-vectors
\`\`\`
`;
}

async function writeJson(outDir: string, fileName: string, value: unknown) {
  await writeFile(join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const generatedAt = process.env.ADDRESS_TEST_VECTOR_SUITE_GENERATED_AT || DEFAULT_GENERATED_AT;
  const suite = buildAddressTestVectorSuite({ generatedAt });
  const validation = validateAddressTestVectorSuite(suite);

  if (!validation.valid) {
    throw new Error(`Address Test Vector Suite is invalid: ${validation.errors.join(', ')}`);
  }

  const outDir = join(process.cwd(), 'data', 'address_test_vectors');
  await mkdir(outDir, { recursive: true });
  await writeJson(outDir, 'manifest.json', suite.manifest);
  await writeJson(outDir, 'address-test-vector-suite.json', suite);
  await writeJson(outDir, 'vectors.json', suite.vectors);
  await writeFile(join(outDir, 'README.md'), suiteReadme(generatedAt), 'utf8');

  console.log(`Address Test Vector Suite exported to ${outDir}`);
  console.log(`vectors=${suite.manifest.counts.vectors}`);
  console.log(`countries=${suite.manifest.counts.countries}`);
  console.log(`validation=${suite.manifest.counts.surfaces.validation}`);
  console.log(`rendering=${suite.manifest.counts.surfaces.rendering}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
