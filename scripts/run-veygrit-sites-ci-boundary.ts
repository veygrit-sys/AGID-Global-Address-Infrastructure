import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const tsxCli = join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');

const commands: Array<{ label: string; args: string[] }> = [
  {
    label: 'Veygrit Sites CI boundary helper tests',
    args: [tsxCli, '--test', 'scripts/verify-veygrit-sites-ci-boundary.test.ts'],
  },
  {
    label: 'Veygrit Sites CI boundary policy scan',
    args: [tsxCli, 'scripts/verify-veygrit-sites-ci-boundary.ts'],
  },
];

if (!existsSync(tsxCli)) {
  console.error(JSON.stringify({
    status: 'blocked',
    verifier: 'run-veygrit-sites-ci-boundary',
    ruleId: 'missing-local-tsx-cli',
    remediation: 'Run npm install before executing this verifier.',
  }));
  process.exit(1);
}

for (const command of commands) {
  const result = spawnSync(process.execPath, command.args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(JSON.stringify({
      status: 'blocked',
      verifier: 'run-veygrit-sites-ci-boundary',
      failedStep: command.label,
      error: result.error.message,
    }));
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(JSON.stringify({
  status: 'pass',
  verifier: 'run-veygrit-sites-ci-boundary',
  executed: commands.map(command => command.label),
}));
