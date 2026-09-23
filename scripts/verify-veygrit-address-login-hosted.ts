import { existsSync, readFileSync } from 'node:fs';

import {
  checkHostedAddressLoginMerchantVisibleRedactionContractSync,
  runHostedAddressLoginSyntheticSmoke,
  type HostedAddressLoginFixtureSet,
  type HostedAddressLoginJsonSchemaSubset,
  type HostedAddressLoginMerchantVisibleRedactionSourceContract,
  validateHostedAddressLoginFixtureAgainstSchema,
} from '../src/lib/veygritHostedAddressLoginContract';
import {
  runFriendDeliveryMerchantScenarioSmoke,
  runHostedAddressLoginMockSmoke,
} from '../src/lib/veygritHostedAddressLoginMock';

const DEFAULT_FIXTURE_PATH = 'docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json';
const CORE_FIXTURE_PATH = 'docs/specs/fixtures/veygrit-id-core-v0.1.json';
const SCHEMA_PATH = 'docs/specs/schemas/veygrit-address-login-hosted-fixture-v0.1.schema.json';

type VeygritIdCoreFixture = {
  merchantVisibleRedactionDisplayContract: HostedAddressLoginMerchantVisibleRedactionSourceContract;
};

function valueAfter(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function loadFixture(path: string): HostedAddressLoginFixtureSet {
  if (!existsSync(path)) {
    throw new Error(`fixture-not-found:${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8')) as HostedAddressLoginFixtureSet;
}

function loadCoreFixture(path: string): VeygritIdCoreFixture {
  if (!existsSync(path)) {
    throw new Error(`core-fixture-not-found:${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8')) as VeygritIdCoreFixture;
}

function loadSchema(path: string): HostedAddressLoginJsonSchemaSubset {
  if (!existsSync(path)) {
    throw new Error(`schema-not-found:${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8')) as HostedAddressLoginJsonSchemaSubset;
}

function runRedactionContractSyncCheck(fixtures: HostedAddressLoginFixtureSet) {
  try {
    const coreFixture = loadCoreFixture(CORE_FIXTURE_PATH);
    const result = checkHostedAddressLoginMerchantVisibleRedactionContractSync(
      fixtures,
      coreFixture.merchantVisibleRedactionDisplayContract,
    );
    return { status: result.status, checked: [CORE_FIXTURE_PATH], errors: result.errors };
  } catch (error) {
    return {
      status: 'fail' as const,
      checked: [CORE_FIXTURE_PATH],
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

function runFixtureSchemaCheck(fixtures: HostedAddressLoginFixtureSet) {
  try {
    const schema = loadSchema(SCHEMA_PATH);
    const errors = validateHostedAddressLoginFixtureAgainstSchema(fixtures, schema);
    return {
      status: errors.length === 0 ? 'pass' as const : 'fail' as const,
      checked: [SCHEMA_PATH],
      errors,
    };
  } catch (error) {
    return {
      status: 'fail' as const,
      checked: [SCHEMA_PATH],
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

const fixturePath = valueAfter('--fixture') ?? DEFAULT_FIXTURE_PATH;
const jsonMode = process.argv.includes('--json');

try {
  const fixtures = loadFixture(fixturePath);
  const contract = runHostedAddressLoginSyntheticSmoke(fixtures);
  const mock = runHostedAddressLoginMockSmoke(fixtures);
  const friendDeliveryMerchant = runFriendDeliveryMerchantScenarioSmoke(fixtures);
  const redactionContractSync = runRedactionContractSyncCheck(fixtures);
  const fixtureSchema = runFixtureSchemaCheck(fixtures);
  const errors = [
    ...contract.errors.map(error => `contract:${error}`),
    ...mock.errors.map(error => `mock:${error}`),
    ...friendDeliveryMerchant.errors.map(error => `friend-delivery-merchant:${error}`),
    ...redactionContractSync.errors.map(error => `redaction-contract-sync:${error}`),
    ...fixtureSchema.errors.map(error => `fixture-schema:${error}`),
  ];
  const warnings = Array.from(new Set([...contract.warnings, ...mock.warnings, ...friendDeliveryMerchant.warnings]));
  const status = contract.status === 'pass' && mock.status === 'pass' && friendDeliveryMerchant.status === 'pass' && redactionContractSync.status === 'pass' && fixtureSchema.status === 'pass' ? 'pass' : 'fail';
  const payload = {
    gate: 'verify-veygrit-address-login-hosted',
    fixturePath,
    status,
    checkedFlows: contract.checkedFlows,
    mockSteps: mock.steps,
    friendDeliveryMerchantSteps: friendDeliveryMerchant.steps,
    friendDeliveryMerchantRefs: {
      scenarioId: friendDeliveryMerchant.scenarioId,
      requestRef: friendDeliveryMerchant.requestRef,
      approvalRef: friendDeliveryMerchant.approvalRef,
      carrierHandoffRef: friendDeliveryMerchant.carrierHandoffRef,
      deliveryReceiptRef: friendDeliveryMerchant.deliveryReceiptRef,
    },
    endpoints: contract.endpoints,
    proofBundleRefs: contract.proofBundleRefs,
    handoffReceiptRefs: contract.handoffReceiptRefs,
    errors,
    warnings,
    redactionContractSync,
    fixtureSchema,
    contract,
    mock,
    friendDeliveryMerchant,
  };

  if (jsonMode) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`[verify-veygrit-address-login-hosted] status=${status}`);
    console.log(`fixture=${fixturePath}`);
    console.log(`checkedFlows=${contract.checkedFlows.join(',')}`);
    console.log(`mockSteps=${mock.steps.join(',')}`);
    console.log(`friendDeliveryMerchantSteps=${friendDeliveryMerchant.steps.join(',')}`);
    console.log(`redactionContractSync=${redactionContractSync.status}`);
    console.log(`fixtureSchema=${fixtureSchema.status}`);
    console.log(`friendDeliveryMerchantRefs=${[
      friendDeliveryMerchant.scenarioId,
      friendDeliveryMerchant.requestRef,
      friendDeliveryMerchant.approvalRef,
      friendDeliveryMerchant.carrierHandoffRef,
      friendDeliveryMerchant.deliveryReceiptRef,
    ].filter(Boolean).join(',')}`);
    console.log(`endpoints=${contract.endpoints.join(',')}`);
    if (warnings.length > 0) console.log(`warnings=${warnings.join('|')}`);
    if (errors.length > 0) console.error(`errors=${errors.join('|')}`);
  }

  if (status !== 'pass') process.exitCode = 1;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (jsonMode) {
    console.log(JSON.stringify({
      gate: 'verify-veygrit-address-login-hosted',
      fixturePath,
      status: 'fail',
      errors: [message],
    }, null, 2));
  } else {
    console.error(`[verify-veygrit-address-login-hosted] status=fail`);
    console.error(message);
  }
  process.exitCode = 1;
}
