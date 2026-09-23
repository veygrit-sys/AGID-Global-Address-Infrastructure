import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  buildNoRawAddressComplianceKit,
  NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION,
  validateNoRawAddressComplianceKit,
} from '../src/lib/noRawAddressComplianceKit';

const DEFAULT_GENERATED_AT = '2026-06-20T00:00:00.000Z';

function kitReadme(generatedAt: string) {
  return `# No Raw Address Compliance Kit

Version: ${NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION}
Generated at: ${generatedAt}

This kit is the AGID/AOID no-raw-address compliance package for OSS releases,
SDK examples, POS flows, registry/webhook payloads, audit logs, and external
implementation tests.

It is designed to make the privacy rule mechanically testable:

> public surfaces must use commitments, short aliases, roots, nullifiers, and
> redacted evidence references instead of raw address, AOID, AGID-S, recipient,
> phone, proof, witness, QR/NFC payload, or private key material.

## Files

- \`manifest.json\`: kit identity, versions, file map, and counts.
- \`no-raw-address-compliance-kit.json\`: complete generated kit.
- \`surface-policies.json\`: rules for Address Element, POS, Field Handoff,
  Portal, Dashboard, Developer Console, Evidence Vault, registry/webhooks,
  Drone/Locker Ops, and optional ZK/Ethereum modes.
- \`fixtures.json\`: positive and negative fixtures for conformance tests.
- \`checklists.json\`: developer, reviewer, operator, and auditor checklists.
- \`README.md\`: this document.

## Required Gates

- no raw address scanner
- terminal signature
- short-term alias
- audit log redaction

## Regenerate

\`\`\`bash
npm run export:no-raw-address-kit
\`\`\`

## Verify

\`\`\`bash
npm run verify:no-raw-address-kit
\`\`\`

## What This Kit Does Not Prove

This kit does not prove that a real-world address is true, deliverable, or legally
owned. It only enforces the release boundary: public examples, logs, fixtures,
and operational records must not expose raw address or secret-bearing material.
`;
}

async function writeJson(outDir: string, fileName: string, value: unknown) {
  await writeFile(join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const generatedAt = process.env.NO_RAW_ADDRESS_KIT_GENERATED_AT || DEFAULT_GENERATED_AT;
  const kit = buildNoRawAddressComplianceKit({ generatedAt });
  const validation = validateNoRawAddressComplianceKit(kit);

  if (!validation.valid) {
    throw new Error(`No Raw Address Compliance Kit is invalid: ${validation.errors.join(', ')}`);
  }

  const outDir = join(process.cwd(), 'data', 'no_raw_address_compliance_kit');
  await mkdir(outDir, { recursive: true });
  await writeJson(outDir, 'manifest.json', kit.manifest);
  await writeJson(outDir, 'no-raw-address-compliance-kit.json', kit);
  await writeJson(outDir, 'surface-policies.json', kit.surfacePolicies);
  await writeJson(outDir, 'fixtures.json', kit.fixtures);
  await writeJson(outDir, 'checklists.json', kit.checklists);
  await writeFile(join(outDir, 'README.md'), kitReadme(generatedAt), 'utf8');

  console.log(`No Raw Address Compliance Kit exported to ${outDir}`);
  console.log(`surfaces=${kit.manifest.counts.surfaces}`);
  console.log(`fixtures=${kit.manifest.counts.fixtures}`);
  console.log(`checklists=${kit.manifest.counts.checklists}`);
  console.log(`forbiddenFields=${kit.manifest.counts.forbiddenFields}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
