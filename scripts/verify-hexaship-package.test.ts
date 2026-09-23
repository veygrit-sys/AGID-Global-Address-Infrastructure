import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

function writeFixtureSdk(root: string, options: { corruptReadmeRefs?: boolean; corruptFixtureRef?: boolean }) {
  const sdkDir = join(root, 'hexaship-js');
  mkdirSync(join(sdkDir, 'fixtures'), { recursive: true });
  mkdirSync(join(sdkDir, 'src'), { recursive: true });

  writeFileSync(
    join(sdkDir, 'package.json'),
    readFileSync('sdk/hexaship-js/package.json', 'utf8'),
    'utf8',
  );
  writeFileSync(
    join(sdkDir, 'src', 'index.ts'),
    readFileSync('sdk/hexaship-js/src/index.ts', 'utf8'),
    'utf8',
  );

  const corrupt = (text: string) => text.replaceAll('wallet_country_form_ref_', 'form_ref_missing_prefix_');
  const readme = readFileSync('sdk/hexaship-js/README.md', 'utf8');
  const fixture = readFileSync('sdk/hexaship-js/fixtures/hexaship-alias-migration-v0.1.json', 'utf8');
  writeFileSync(join(sdkDir, 'README.md'), options.corruptReadmeRefs ? corrupt(readme) : readme, 'utf8');
  writeFileSync(
    join(sdkDir, 'fixtures', 'hexaship-alias-migration-v0.1.json'),
    options.corruptFixtureRef ? corrupt(fixture) : fixture,
    'utf8',
  );

  return sdkDir;
}

function runStaticVerifier(sdkDir: string) {
  return spawnSync(process.execPath, [
    'node_modules/tsx/dist/cli.mjs',
    'scripts/verify-hexaship-package.ts',
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      HEXASHIP_SDK_DIR: sdkDir,
      HEXASHIP_PACKAGE_STATIC_ONLY: '1',
    },
  });
}

test('Hexaship package verifier rejects README samples without wallet country-form ref prefixes', () => {
  const sdkDir = writeFixtureSdk(join(tmpdir(), `hexaship-package-readme-${Date.now()}`), {
    corruptReadmeRefs: true,
  });

  const result = runStaticVerifier(sdkDir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /readme-samples-missing-wallet-country-form-ref-prefix/);
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddress|carrierApiKey|proofWitness|privateKey|proofSecret/);
});

test('Hexaship package verifier rejects alias fixture without wallet country-form ref prefixes', () => {
  const sdkDir = writeFixtureSdk(join(tmpdir(), `hexaship-package-fixture-${Date.now()}`), {
    corruptFixtureRef: true,
  });

  const result = runStaticVerifier(sdkDir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /fixture-missing-wallet-country-form-ref-prefix/);
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddress|carrierApiKey|proofWitness|privateKey|proofSecret/);
});
