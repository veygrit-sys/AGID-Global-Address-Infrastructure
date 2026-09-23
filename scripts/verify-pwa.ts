import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { verifyPwaBuild } from './verify-pwa-build.ts';

const pwaTestFiles = [
  'src/lib/pwaConfig.test.ts',
  'src/lib/pwaLifecycle.test.ts',
  'src/components/PwaStatusBar.test.ts',
  'scripts/verify-pwa-build.test.ts',
];

const testRun = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...pwaTestFiles], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});

if (testRun.error) {
  throw testRun.error;
}

if (testRun.status !== 0) {
  process.exit(testRun.status ?? 1);
}

const distPath = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
const result = await verifyPwaBuild(distPath);

console.log(
  JSON.stringify(
    {
      distPath: result.distPath,
      manifestName: result.manifest.name,
      hasServiceWorker: result.hasServiceWorker,
      hasRegistrationScript: result.hasRegistrationScript,
      precacheBudget: result.precacheBudget,
      chunkBudget: result.chunkBudget,
    },
    null,
    2,
  ),
);
