import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import {
  buildExpectedHostedAddressLoginMerchantVisibleRedactionDisplayContract,
  checkHostedAddressLoginMerchantVisibleRedactionContractSync,
  type HostedAddressLoginFixtureSet,
  type HostedAddressLoginMerchantVisibleRedactionDisplayContract,
  type HostedAddressLoginMerchantVisibleRedactionSourceContract,
} from '../src/lib/veygritHostedAddressLoginContract';

const HOSTED_FIXTURE_PATH = 'docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json';
const CORE_FIXTURE_PATH = 'docs/specs/fixtures/veygrit-id-core-v0.1.json';
const verifier = 'sync-veygrit-address-login-hosted-redaction-contract';
const checkOnly = process.argv.includes('--check');

type VeygritIdCoreFixture = {
  merchantVisibleRedactionDisplayContract: HostedAddressLoginMerchantVisibleRedactionSourceContract;
};

function readJsonFile<T>(path: string): T {
  if (!existsSync(path)) {
    throw new Error(`Missing fixture: ${path}`);
  }

  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function buildExpectedHostedFixture(hostedFixture: HostedAddressLoginFixtureSet): HostedAddressLoginFixtureSet {
  const coreFixture = readJsonFile<VeygritIdCoreFixture>(CORE_FIXTURE_PATH);
  const syncResult = checkHostedAddressLoginMerchantVisibleRedactionContractSync(
    hostedFixture,
    coreFixture.merchantVisibleRedactionDisplayContract,
  );
  const merchantVisibleRedactionDisplayContract =
    syncResult.expectedContract ??
    buildExpectedHostedAddressLoginMerchantVisibleRedactionDisplayContract(
      hostedFixture,
      coreFixture.merchantVisibleRedactionDisplayContract,
    );

  return {
    ...hostedFixture,
    merchantVisibleRedactionDisplayContract,
    testVectorResult: {
      ...hostedFixture.testVectorResult,
      merchantVisibleRedactionDisplayContract,
    },
  };
}

try {
  const hostedFixture = readJsonFile<HostedAddressLoginFixtureSet>(HOSTED_FIXTURE_PATH);
  const expectedFixture = buildExpectedHostedFixture(hostedFixture);
  const actualNormalizedText = `${JSON.stringify(hostedFixture, null, 2)}\n`;
  const expectedText = `${JSON.stringify(expectedFixture, null, 2)}\n`;

  if (checkOnly) {
    if (actualNormalizedText !== expectedText) {
      console.error(JSON.stringify({
        status: 'blocked',
        verifier,
        mode: 'check',
        checked: [HOSTED_FIXTURE_PATH, CORE_FIXTURE_PATH],
        changedPaths: [HOSTED_FIXTURE_PATH],
        remediation: 'Run npm run sync:veygrit-address-login-hosted-redaction before verifying hosted Address Login.',
        localOnly: true,
        productionTraffic: false,
      }));
      process.exit(1);
    }

    console.log(JSON.stringify({
      status: 'pass',
      verifier,
      mode: 'check',
      checked: [HOSTED_FIXTURE_PATH, CORE_FIXTURE_PATH],
      localOnly: true,
      productionTraffic: false,
    }));
    process.exit(0);
  }

  writeFileSync(HOSTED_FIXTURE_PATH, expectedText, 'utf8');
  const contract = expectedFixture.merchantVisibleRedactionDisplayContract as HostedAddressLoginMerchantVisibleRedactionDisplayContract;
  console.log(JSON.stringify({
    status: 'pass',
    verifier,
    mode: 'write',
    wrote: [HOSTED_FIXTURE_PATH],
    displayFields: contract.displayFields,
    localOnly: true,
    productionTraffic: false,
  }));
} catch (error) {
  console.error(JSON.stringify({
    status: 'blocked',
    verifier,
    mode: checkOnly ? 'check' : 'write',
    checked: [HOSTED_FIXTURE_PATH, CORE_FIXTURE_PATH],
    error: error instanceof Error ? error.message : String(error),
    localOnly: true,
    productionTraffic: false,
  }));
  process.exit(1);
}
