import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const tsxCli = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');

const checks = [
  {
    label: 'verify:oss-repository',
    args: ['scripts/verify-open-source-repository-readiness.ts'],
  },
  {
    label: 'verify:repository-owner-routing',
    args: ['--test', 'src/lib/repositoryOwnerRouting.test.ts'],
  },
  {
    label: 'verify:commercial-boundary-review',
    args: ['scripts/verify-commercial-boundary-review.ts'],
  },
  {
    label: 'verify:veygrit-address-login-packages',
    args: ['scripts/verify-veygrit-address-login-packages.ts'],
  },
  {
    label: 'verify:no-raw-address',
    args: ['scripts/verify-no-raw-address-release-suite.ts'],
  },
  {
    label: 'verify:preaudit-secrets',
    args: ['scripts/verify-external-audit-secret-scan.ts'],
  },
  {
    label: 'verify:release-build-assets',
    args: ['scripts/verify-release-build-assets.ts'],
  },
  {
    label: 'verify:external-audit',
    args: [
      '--test',
      'src/lib/externalAuditHardening.test.ts',
      'src/lib/securityPrivacyDesign.test.ts',
      'src/lib/zkBaselineHardening.test.ts',
      'src/lib/accessibilityHardening.test.ts',
      'src/lib/openSourceDonationReadiness.test.ts',
    ],
  },
] as const;

for (const check of checks) {
  console.log(`\n[oss-launch] ${check.label}`);
  const result = spawnSync(process.execPath, [tsxCli, ...check.args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\n[oss-launch] all checks passed');
