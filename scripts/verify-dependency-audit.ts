import { existsSync } from 'node:fs';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

function npmCommand() {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    return { command: process.execPath, args: [npmExecPath] };
  }

  const windowsNpmCli = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
  if (process.platform === 'win32' && existsSync(windowsNpmCli)) {
    return { command: process.execPath, args: [windowsNpmCli] };
  }

  return { command: 'npm', args: [] };
}

const npm = npmCommand();
const result = spawnSync(npm.command, [...npm.args, 'audit', '--audit-level=moderate'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
