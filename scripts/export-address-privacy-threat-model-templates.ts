import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES_VERSION,
  buildAddressPrivacyThreatModelTemplatePack,
  renderAddressPrivacyThreatModelTemplateMarkdown,
  validateAddressPrivacyThreatModelTemplatePack,
} from '../src/lib/addressPrivacyThreatModelTemplates';

const DEFAULT_GENERATED_AT = '2026-06-20T00:00:00.000Z';

function kitReadme(generatedAt: string) {
  return `# Address Privacy Threat Model Templates

Version: ${ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES_VERSION}
Generated at: ${generatedAt}

Address Privacy Threat Model Templates are reusable review templates for AGID,
AOID, AGID-S, Address Element, Portal, POS, Field Handoff, Evidence Vault,
registry/webhook, ZK predicate, locker/PUDO, and developer-console surfaces.

The templates keep one privacy boundary explicit:

> Public and shared surfaces must be local-first where possible, Ethereum-optional,
> no-raw-address-by-default, and safe for high-risk contexts.

## Files

- \`manifest.json\`: template pack identity, version, file map, and counts.
- \`templates.json\`: structured threat model templates.
- \`checklists.json\`: role-based review checklists.
- \`markdown/*.md\`: human-readable template files for design and security review.
- \`README.md\`: this document.

## How to Use

1. Pick the closest surface template before adding or changing a feature.
2. Fill in owner, assets, trust boundaries, attacker-controlled inputs, and misuse cases.
3. Keep outputs to commitments, aliases, roots, nullifiers, redacted references, and public proof signals.
4. Run the verification commands listed by the template.
5. Escalate high-risk mode, evidence, humanitarian, and offline-sync changes for privacy review.

## Regenerate

\`\`\`bash
npm run export:privacy-threat-templates
\`\`\`

## Verify

\`\`\`bash
npm run verify:privacy-threat-templates
\`\`\`

## What This Pack Does Not Prove

This pack does not prove that an implementation is secure, that a real address is
true, or that a ZK circuit is production-audited. It makes the expected privacy
review shape explicit and mechanically checks that the public template pack does
not include raw address material.
`;
}

async function writeJson(outDir: string, fileName: string, value: unknown) {
  await writeFile(join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const generatedAt = process.env.ADDRESS_PRIVACY_THREAT_TEMPLATES_GENERATED_AT || DEFAULT_GENERATED_AT;
  const pack = buildAddressPrivacyThreatModelTemplatePack({ generatedAt });
  const validation = validateAddressPrivacyThreatModelTemplatePack(pack);

  if (!validation.valid) {
    throw new Error(`Address Privacy Threat Model Templates are invalid: ${validation.errors.join(', ')}`);
  }

  const outDir = join(process.cwd(), 'data', 'address_privacy_threat_model_templates');
  const markdownDir = join(outDir, 'markdown');
  await mkdir(markdownDir, { recursive: true });
  await writeJson(outDir, 'manifest.json', pack.manifest);
  await writeJson(outDir, 'templates.json', pack.templates);
  await writeJson(outDir, 'checklists.json', pack.checklists);
  await writeFile(join(outDir, 'README.md'), kitReadme(generatedAt), 'utf8');

  for (const template of pack.templates) {
    await writeFile(
      join(markdownDir, `${template.id}.md`),
      renderAddressPrivacyThreatModelTemplateMarkdown(template),
      'utf8',
    );
  }

  console.log(`Address Privacy Threat Model Templates exported to ${outDir}`);
  console.log(`templates=${pack.manifest.counts.templates}`);
  console.log(`misuseCases=${pack.manifest.counts.misuseCases}`);
  console.log(`checklists=${pack.manifest.counts.checklists}`);
  console.log(`markdown=${pack.templates.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
