import { spawnSync } from 'node:child_process';
import process from 'node:process';

const npmExecPath = process.env.npm_execpath;
const npmCommand = npmExecPath ? process.execPath : 'npm';
const npmBaseArgs = npmExecPath ? [npmExecPath] : [];
const maxAgeMinutes = process.env.AGID_BUILD_BUDGET_MAX_AGE_MINUTES ?? '30';

const checks = [
  {
    label: 'build',
    args: ['run', 'build'],
    env: process.env,
  },
  {
    label: 'verify:build-chunk-budget',
    args: ['run', 'verify:build-chunk-budget'],
    env: {
      ...process.env,
      AGID_BUILD_BUDGET_MAX_AGE_MINUTES: maxAgeMinutes,
    },
  },
  {
    label: 'verify:pwa',
    args: ['run', 'verify:pwa'],
    env: process.env,
  },
] as const;

for (const check of checks) {
  console.log(`\n[release-build-assets] ${check.label}`);
  const result = spawnSync(npmCommand, [...npmBaseArgs, ...check.args], {
    cwd: process.cwd(),
    env: check.env,
    stdio: 'inherit',
    shell: !npmExecPath && process.platform === 'win32',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`\n[release-build-assets] all checks passed with AGID_BUILD_BUDGET_MAX_AGE_MINUTES=${maxAgeMinutes}`);
