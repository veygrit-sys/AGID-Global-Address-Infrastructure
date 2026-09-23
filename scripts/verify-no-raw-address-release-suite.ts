import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const tsxCli = path.join(
  process.cwd(),
  'node_modules',
  'tsx',
  'dist',
  'cli.mjs'
);

function run(label: string, args: string[]): void {
  console.log(`\n[no-raw-address] ${label}`);
  const result = spawnSync(process.execPath, [tsxCli, ...args], {
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

run('unit tests', ['--test', 'src/lib/noRawAddressReleaseScan.test.ts']);
run('mandatory release gates', ['--test', 'src/lib/securityMandatoryReleaseGate.test.ts']);
run('secure address QR privacy', ['--test', 'src/lib/secureAddressQr.test.ts']);
run('no postal code model privacy', ['--test', 'src/lib/noPostalCodePostalModelResearch.test.ts']);
run('release document scan', ['scripts/verify-no-raw-address-release.ts']);
