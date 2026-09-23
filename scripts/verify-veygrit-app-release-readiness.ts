import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildVeygritHandoffBundleManifest } from '../src/lib/veygritHandoffBundleManifest';

type ExpectedScript = {
  name: string;
  command: string;
};

export type VeygritAppReleaseReadinessSummary = {
  status: 'pass' | 'blocked';
  verifier: 'verify-veygrit-app-release-readiness';
  checkedPackage: string;
  checkedFiles: string[];
  expectedScripts: ExpectedScript[];
  findings: string[];
  archiveCreated: false;
  remoteMutationAllowedThisTurn: false;
  productionDeployRequiresExplicitApproval: true;
};

export type VeygritAppReleaseReadinessOptions = {
  appRoot?: string;
  packageJsonText?: string;
  existingFiles?: string[];
};

export const VEYGRIT_APP_RELEASE_READINESS_EXPECTED_SCRIPTS: ExpectedScript[] = [
  { name: 'build', command: 'node scripts/build-sites.mjs' },
  { name: 'check:agid-handoff', command: 'node scripts/check-agid-handoff.mjs' },
  { name: 'test:agid-handoff', command: 'node --test scripts/check-agid-handoff.test.mjs' },
  { name: 'check:release-readiness', command: 'node scripts/release-readiness.mjs' },
  { name: 'test:release-readiness', command: 'node --test scripts/release-readiness.test.mjs' },
  { name: 'test:store-state', command: 'node --test src/storeConnectionState.test.js' },
];

export const VEYGRIT_APP_RELEASE_READINESS_EXPECTED_FILES = [
  'AGID_HANDOFF.md',
  'README.md',
  'RELEASE_UPDATE_CHECKLIST.md',
  'scripts/check-agid-handoff.mjs',
  'scripts/check-agid-handoff.test.mjs',
  'scripts/release-readiness.mjs',
  'scripts/release-readiness.test.mjs',
];

const RemoteMutationCommandPattern =
  /\b(git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|npm\s+publish|sites\s+save|deploy\s+production|curl|Invoke-WebRequest|iwr|wget)\b/i;

function safeRelativePath(path: string) {
  return path.replace(/\\/g, '/');
}

export function buildVeygritAppReleaseReadinessSummary(
  options: VeygritAppReleaseReadinessOptions = {},
): VeygritAppReleaseReadinessSummary {
  const appRoot = options.appRoot ?? buildVeygritHandoffBundleManifest().localAppRoot;
  const packagePath = join(appRoot, 'package.json');
  const findings: string[] = [];
  let packageJson: { scripts?: Record<string, string> } = {};
  const fixtureFiles = options.existingFiles
    ? new Set(options.existingFiles.map(file => safeRelativePath(file)))
    : undefined;
  const packageText = options.packageJsonText;

  if (packageText !== undefined) {
    try {
      packageJson = JSON.parse(packageText);
    } catch {
      findings.push('invalid-veygrit-app-package-json');
    }
  } else if (!existsSync(packagePath)) {
    findings.push('missing-veygrit-app-package-json');
  } else {
    try {
      packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    } catch {
      findings.push('invalid-veygrit-app-package-json');
    }
  }

  for (const script of VEYGRIT_APP_RELEASE_READINESS_EXPECTED_SCRIPTS) {
    const actual = packageJson.scripts?.[script.name];

    if (actual !== script.command) {
      findings.push(`missing-or-changed-script:${script.name}`);
    }
    if (actual && RemoteMutationCommandPattern.test(actual)) {
      findings.push(`remote-mutation-command-present:${script.name}`);
    }
  }

  for (const file of VEYGRIT_APP_RELEASE_READINESS_EXPECTED_FILES) {
    const exists = fixtureFiles ? fixtureFiles.has(file) : existsSync(join(appRoot, file));
    if (!exists) {
      findings.push(`missing-veygrit-app-file:${safeRelativePath(file)}`);
    }
  }

  return {
    status: findings.length === 0 ? 'pass' : 'blocked',
    verifier: 'verify-veygrit-app-release-readiness',
    checkedPackage: safeRelativePath(packagePath),
    checkedFiles: VEYGRIT_APP_RELEASE_READINESS_EXPECTED_FILES,
    expectedScripts: VEYGRIT_APP_RELEASE_READINESS_EXPECTED_SCRIPTS,
    findings,
    archiveCreated: false,
    remoteMutationAllowedThisTurn: false,
    productionDeployRequiresExplicitApproval: true,
  };
}

function main() {
  const result = buildVeygritAppReleaseReadinessSummary();
  const output = JSON.stringify(result, null, 2);
  if (result.findings.length > 0) {
    console.error(output);
    process.exit(1);
  }

  console.log(output);
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedAsScript) main();
