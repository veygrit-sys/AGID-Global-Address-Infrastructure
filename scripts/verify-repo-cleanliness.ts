import { spawnSync } from 'node:child_process';
import process from 'node:process';

const checks: Array<{ id: string; args: string[] }> = [
  {
    id: 'repo-cleanliness-contract-test',
    args: ['node_modules/tsx/dist/cli.mjs', '--test', 'scripts/report-agid-worktree-cleanliness.test.ts'],
  },
  {
    id: 'repo-cleanliness-report',
    args: ['node_modules/tsx/dist/cli.mjs', 'scripts/report-agid-worktree-cleanliness.ts', '--fail-on-critical'],
  },
];

for (const check of checks) {
  const result = spawnSync(process.execPath, check.args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    break;
  }
}
