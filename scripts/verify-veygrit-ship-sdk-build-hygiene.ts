import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const jsRoot = 'sdk/veygrit-ship-js';
const generatedOutputs = ['dist/index.js', 'dist/index.d.ts'] as const;
const inspectedPackageFiles = ['package.json', 'README.md', ...generatedOutputs] as const;

const remoteOrPublishCommandPattern =
  /\b(npm\s+publish|git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|sites\s+save|deploy\s+production|curl|Invoke-WebRequest|iwr|wget)\b/i;
const generatedCredentialBoundaryPattern =
  /\b(carrierCredential|carrierCredentials|carrierApiKey|commercialRateSecret|credentialSecretRef|credentialVersionRef|clientSecret|client_secret|privateKey|proofSecret|proofWitness)\b/i;

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

async function runSdkScript(scriptName: 'typecheck' | 'build'): Promise<void> {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('Run this build hygiene gate through npm so npm_execpath is available.');

  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [npmCli, 'run', scriptName], {
      cwd: jsRoot,
      stdio: 'inherit',
      windowsHide: true,
    });
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });

  assert.equal(exitCode, 0, `@veygrit/ship ${scriptName} must pass locally`);
}

const rootPackage = readJson<{ scripts?: Record<string, string> }>('package.json');
assert.equal(
  rootPackage.scripts?.['verify:veygrit-ship-sdk-build-hygiene'],
  'tsx scripts/verify-veygrit-ship-sdk-build-hygiene.ts',
);

const jsPackage = readJson<{ scripts?: Record<string, string> }>(join(jsRoot, 'package.json'));
assert.equal(jsPackage.scripts?.typecheck, 'tsc --noEmit -p tsconfig.json');
assert.equal(jsPackage.scripts?.build, 'tsc -p tsconfig.json');

await runSdkScript('typecheck');
await runSdkScript('build');

for (const output of generatedOutputs) {
  const outputPath = join(jsRoot, output);
  assert.ok(existsSync(outputPath), `@veygrit/ship generated output must exist: ${output}`);
}

for (const file of inspectedPackageFiles) {
  const filePath = join(jsRoot, file);
  const source = readFileSync(filePath, 'utf8');
  assert.doesNotMatch(
    source,
    remoteOrPublishCommandPattern,
    `@veygrit/ship ${file} must not contain publish, deploy, remote mutation, or network-fetch commands`,
  );
}

for (const output of generatedOutputs) {
  const outputPath = join(jsRoot, output);
  const source = readFileSync(outputPath, 'utf8');
  assert.doesNotMatch(
    source,
    generatedCredentialBoundaryPattern,
    `@veygrit/ship ${output} must not expose carrier credential, proof secret, witness, or private-key fields`,
  );
}

console.log('Veygrit Ship SDK build hygiene checks passed (JS).');
