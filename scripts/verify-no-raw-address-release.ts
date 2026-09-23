import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { scanNoRawAddressReleaseText } from '../src/lib/noRawAddressReleaseScan';

const DEFAULT_TARGETS = [
  'README.md',
  'SECURITY.md',
  'docs/privacy-human-rights-positioning.md',
  'docs/research-paper-volume-separation.md',
  'docs/funder-brief-en.md',
  'docs/agid-three-demos-ja.md',
  'docs/agid-spec-v0.1-rc.md',
  'docs/funding-channels-ja.md',
  'docs/external-audit-hardening-ja.md',
  'docs/address-element-radar.md',
  'docs/agid-address-element-web-components.md',
  'docs/agid-cli.md',
  'docs/offline-field-kit.md',
  'docs/agid-resolver-conformance-tests.md',
  'docs/address-privacy-threat-model-templates.md',
  'docs/product/address-morphism-repository-boundary.md',
  'data/address_privacy_threat_model_templates/README.md',
  'data/address_privacy_threat_model_templates/templates.json',
  'data/address_privacy_threat_model_templates/checklists.json',
  'data/no_raw_address_compliance_kit/README.md',
  'data/no_raw_address_compliance_kit/surface-policies.json',
  'data/no_raw_address_compliance_kit/checklists.json',
  'data/offline_field_kit/README.md',
  'data/offline_field_kit/runbooks.json',
  'data/offline_field_kit/checklists.json',
  'data/agid_resolver_conformance/README.md',
  'data/agid_resolver_conformance/checklists.json',
  '.github/FUNDING.yml',
];

function resolveTargets(argv: readonly string[]) {
  const requested = argv.filter(arg => !arg.startsWith('--'));
  return requested.length > 0 ? requested : DEFAULT_TARGETS;
}

const targets = resolveTargets(process.argv.slice(2));
const failures: string[] = [];

for (const target of targets) {
  if (!existsSync(target)) continue;

  const text = await readFile(target, 'utf8');
  const result = scanNoRawAddressReleaseText(text);
  const errors = result.findings.filter(finding => finding.severity === 'error');

  if (errors.length > 0) {
    failures.push(
      [
        `${target}: ${errors.length} no-raw-address release blocker(s)`,
        ...errors.map(finding => `  line ${finding.line}: ${finding.code} :: ${finding.excerpt}`),
      ].join('\n'),
    );
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n\n'));
  process.exit(1);
}

console.log(`No raw address release scan passed for ${targets.length} target(s).`);
for (const target of targets) {
  console.log(`- ${path.normalize(target)}`);
}
