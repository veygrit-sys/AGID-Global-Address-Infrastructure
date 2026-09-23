import { spawnSync } from 'node:child_process';

const checks = [
  'verify:hexaship-js',
  'verify:hexaship-package-negative',
  'verify:hexaship-package',
  'verify:skipship-js',
  'verify:skipship-strategy',
  'verify:delivery-gateway-carrier-api',
] as const;

const npmExecPath = process.env.npm_execpath;

for (const check of checks) {
  console.log(`[verify-hexaship-migration] running=${check}`);
  const result = npmExecPath
    ? spawnSync(process.execPath, [npmExecPath, 'run', check], { stdio: 'inherit' })
    : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', check], { stdio: 'inherit' });
  if (result.error) {
    console.error(`[verify-hexaship-migration] spawn-error=${result.error.message}`);
  }
  if (result.status !== 0) {
    console.error(`[verify-hexaship-migration] status=fail failed=${check}`);
    process.exit(result.status ?? 1);
  }
}

console.log('[verify-hexaship-migration] status=pass');
