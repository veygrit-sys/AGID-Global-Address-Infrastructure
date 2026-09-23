import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

type PackageJson = {
  name?: string;
  private?: boolean;
  main?: string;
  types?: string;
  exports?: Record<string, unknown>;
  files?: string[];
  scripts?: Record<string, string>;
};

const sdkDir = process.env.HEXASHIP_SDK_DIR ?? join(process.cwd(), 'sdk', 'hexaship-js');
const packageJsonPath = join(sdkDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;

function fail(message: string): never {
  console.error(`[verify-hexaship-package] status=fail reason=${message}`);
  process.exit(1);
}

function requireEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    fail(`${label} expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
  }
}

function requireIncludes(values: string[] | undefined, value: string, label: string) {
  if (!values?.includes(value)) {
    fail(`${label} missing=${value}`);
  }
}

requireEqual(packageJson.name, '@hexaship/js', 'package.name');
requireEqual(packageJson.private, undefined, 'package.private');
requireEqual(packageJson.main, './dist/sdk/hexaship-js/src/index.js', 'package.main');
requireEqual(packageJson.types, './dist/sdk/hexaship-js/src/index.d.ts', 'package.types');
requireEqual((packageJson.exports?.['.'] as { types?: string } | undefined)?.types, './dist/sdk/hexaship-js/src/index.d.ts', 'package.exports.types');
requireEqual((packageJson.exports?.['.'] as { default?: string } | undefined)?.default, './dist/sdk/hexaship-js/src/index.js', 'package.exports.default');
requireEqual(packageJson.exports?.['./fixtures/hexaship-alias-migration-v0.1.json'], './fixtures/hexaship-alias-migration-v0.1.json', 'package.exports.fixture');
requireIncludes(packageJson.files, 'dist', 'package.files');
requireIncludes(packageJson.files, 'fixtures', 'package.files');
requireIncludes(packageJson.files, 'README.md', 'package.files');
requireEqual(packageJson.scripts?.build, 'tsc -p tsconfig.json', 'package.scripts.build');
requireEqual(packageJson.scripts?.typecheck, 'tsc --noEmit -p tsconfig.json', 'package.scripts.typecheck');
requireEqual(packageJson.scripts?.test, 'tsx --test test/sdk.test.ts', 'package.scripts.test');

const fixtureText = readFileSync(join(sdkDir, 'fixtures', 'hexaship-alias-migration-v0.1.json'), 'utf8');
const merchantOnboardingFixtureText = readFileSync(join(process.cwd(), 'docs', 'specs', 'fixtures', 'merchant-console-onboarding-v0.1.json'), 'utf8');
const merchantOnboardingFixture = JSON.parse(merchantOnboardingFixtureText) as {
  request?: {
    shippingPreferences?: {
      enabledCarriers?: string[];
    };
    addressWalletSettings?: {
      addressFormVersionRef?: string;
      carrierSpecificAddressShapeBlocked?: boolean;
    };
  };
  expected?: {
    requiredWalletBoundaryFields?: string[];
    forbiddenPublicMaterial?: string[];
    nonClaims?: string[];
  };
};
const sourceText = readFileSync(join(sdkDir, 'src', 'index.ts'), 'utf8');
const merchantConsoleSourceText = readFileSync(join(process.cwd(), 'src', 'lib', 'merchantConsoleEcPlugin.ts'), 'utf8');
const readmeText = readFileSync(join(sdkDir, 'README.md'), 'utf8');
const joinedText = [packageJsonPath, fixtureText, merchantOnboardingFixtureText, sourceText, readmeText].join('\n');

if (/rawAddressValue|recipient_phone_value|carrier_secret_value|proof_witness_value|private_key_value|productionCredentialValue/.test(joinedText)) {
  fail('unsafe-placeholder-material-present');
}
if (!/"productionTraffic": false/.test(fixtureText) || !/"rawAddressFixtures": false/.test(fixtureText)) {
  fail('fixture-privacy-flags-not-redacted');
}
if (!/not a trademark clearance result/i.test(fixtureText)) {
  fail('fixture-missing-trademark-non-claim');
}
const readmeTsBlocks = [...readmeText.matchAll(/```ts(?: ([^\n]+))?\n([\s\S]*?)\n```/g)].map(match => ({
  tag: match[1] ?? '',
  code: match[2],
}));
const walletCountryFormRefPattern = /wallet_country_form_ref_[a-z0-9_:-]+/;
const containsWalletCountryFormRef = (text: string | undefined) => Boolean(text && walletCountryFormRefPattern.test(text));
const allowedReadmeTsTags = new Set([
  'verified:primary',
  'verified:migration',
  'example:mvp-preflight',
  'example:merchant-onboarding',
  'example:fixture-export',
]);
for (const block of readmeTsBlocks) {
  if (!allowedReadmeTsTags.has(block.tag)) {
    fail(`readme-unclassified-typescript-block tag=${block.tag || '<none>'}`);
  }
}
const primaryReadmeSample = readmeTsBlocks.find(block => block.tag === 'verified:primary')?.code;
const migrationReadmeSample = readmeTsBlocks.find(block => block.tag === 'verified:migration')?.code;
const mvpPreflightReadmeSample = readmeTsBlocks.find(block => block.tag === 'example:mvp-preflight')?.code;
const merchantOnboardingReadmeSample = readmeTsBlocks.find(block => block.tag === 'example:merchant-onboarding')?.code;
const fixtureExportReadmeSample = readmeTsBlocks.find(block => block.tag === 'example:fixture-export')?.code;
if (!primaryReadmeSample) {
  fail('readme-missing-primary-typescript-sample');
}
if (!migrationReadmeSample) {
  fail('readme-missing-migration-typescript-sample');
}
if (!fixtureExportReadmeSample) {
  fail('readme-missing-fixture-export-typescript-sample');
}
if (!merchantOnboardingReadmeSample) {
  fail('readme-missing-merchant-onboarding-typescript-sample');
}
if (!/createHexashipClient/.test(primaryReadmeSample) || !/productionTraffic: false/.test(primaryReadmeSample)) {
  fail('readme-primary-sample-missing-safe-hexaship-flow');
}
if (!/addressFormVersion/.test(primaryReadmeSample) || !/addressFormVersion/.test(migrationReadmeSample)) {
  fail('readme-samples-missing-address-form-version-ref');
}
if (
  !containsWalletCountryFormRef(primaryReadmeSample)
  || !containsWalletCountryFormRef(migrationReadmeSample)
  || !containsWalletCountryFormRef(mvpPreflightReadmeSample)
  || !containsWalletCountryFormRef(merchantOnboardingReadmeSample)
) {
  fail('readme-samples-missing-wallet-country-form-ref-prefix');
}
if (!containsWalletCountryFormRef(fixtureText)) {
  fail('fixture-missing-wallet-country-form-ref-prefix');
}
if (/fetch\(|api\.veygrit\.example|rawAddress(?!Fixtures)|recipientPhone|carrierApiKey|proofWitness|privateKey|proofSecret/.test(primaryReadmeSample)) {
  fail('readme-primary-sample-contains-unsafe-or-network-material');
}
if (
  !/createSkipshipClient/.test(migrationReadmeSample)
  || !/createHexashipClient/.test(migrationReadmeSample)
  || !/productionTraffic: false/.test(migrationReadmeSample)
) {
  fail('readme-migration-sample-missing-compatible-safe-flow');
}
if (/fetch\(|api\.veygrit\.example|rawAddress(?!Fixtures)|recipientPhone|carrierApiKey|proofWitness|privateKey|proofSecret/.test(migrationReadmeSample)) {
  fail('readme-migration-sample-contains-unsafe-or-network-material');
}
if (
  !/@hexaship\/js\/fixtures\/hexaship-alias-migration-v0\.1\.json/.test(fixtureExportReadmeSample)
  || /rawAddressValue|recipient_phone_value|carrier_secret_value|proof_witness_value|private_key_value|productionCredentialValue/.test(fixtureExportReadmeSample)
) {
  fail('readme-fixture-export-sample-invalid');
}
const merchantOnboardingAddressFormVersionRef = merchantOnboardingFixture.request?.addressWalletSettings?.addressFormVersionRef;
const merchantOnboardingEnabledCarriers = merchantOnboardingFixture.request?.shippingPreferences?.enabledCarriers ?? [];
const merchantOnboardingWalletBoundaryFields = merchantOnboardingFixture.expected?.requiredWalletBoundaryFields ?? [];
if (!merchantOnboardingAddressFormVersionRef) {
  fail('merchant-onboarding-fixture-missing-address-form-version-ref');
}
if (!merchantOnboardingReadmeSample.includes(`addressFormVersionRef: "${merchantOnboardingAddressFormVersionRef}"`)) {
  fail('readme-merchant-onboarding-sample-address-form-ref-drift');
}
if (
  !merchantOnboardingEnabledCarriers.includes('dhl')
  || !merchantOnboardingEnabledCarriers.includes('ups')
  || !/enabledCarriers: \["dhl", "ups"\]/.test(merchantOnboardingReadmeSample)
) {
  fail('readme-merchant-onboarding-sample-carrier-drift');
}
if (
  merchantOnboardingFixture.request?.addressWalletSettings?.carrierSpecificAddressShapeBlocked !== true
  || !/carrierSpecificAddressShapeBlocked: true/.test(merchantOnboardingReadmeSample)
  || !/idempotencyKey: "idem_merchant_onboarding_demo_001"/.test(merchantOnboardingReadmeSample)
) {
  fail('readme-merchant-onboarding-sample-wallet-boundary-drift');
}
for (const forbidden of merchantOnboardingFixture.expected?.forbiddenPublicMaterial ?? []) {
  const unsafePattern = new RegExp(`${forbidden}(Value|:|\\s*=)`, 'i');
  if (unsafePattern.test(merchantOnboardingReadmeSample)) {
    fail(`readme-merchant-onboarding-sample-contains-forbidden-material key=${forbidden}`);
  }
}
if (
  !merchantOnboardingFixture.expected?.nonClaims?.includes('not-production-dhl-ups-traffic')
  || /fetch\(|api\.veygrit\.example|sk_live|DHL_API|UPS_API/.test(merchantOnboardingReadmeSample)
) {
  fail('readme-merchant-onboarding-sample-production-traffic-drift');
}
const merchantOnboardingContractCopyText = [
  'path: /v1/merchant-console/onboarding',
  'fixture: docs/specs/fixtures/merchant-console-onboarding-v0.1.json',
  'verifier: npm run verify:merchant-console-ec-plugin',
  'contractState: README / fixture / OpenAPI aligned',
  `enabledCarriers: ${merchantOnboardingEnabledCarriers.filter(carrier => carrier === 'dhl' || carrier === 'ups').join('+')}`,
  `addressFormVersionRef: ${merchantOnboardingAddressFormVersionRef}`,
  `walletBoundaryFields: ${merchantOnboardingWalletBoundaryFields.join('+')}`,
  'localOnly: true',
  'productionTraffic: false',
  'rawAddressVisibleToEc: false',
  'carrierSpecificAddressShapeCollectedByEc: false',
].join('\n');
for (const expectedLine of [
  `enabledCarriers: ${merchantOnboardingEnabledCarriers.filter(carrier => carrier === 'dhl' || carrier === 'ups').join('+')}`,
  `addressFormVersionRef: ${merchantOnboardingAddressFormVersionRef}`,
  `walletBoundaryFields: ${merchantOnboardingWalletBoundaryFields.join('+')}`,
  'productionTraffic: false',
  'rawAddressVisibleToEc: false',
]) {
  if (!merchantOnboardingContractCopyText.includes(expectedLine)) {
    fail(`merchant-onboarding-contract-copy-summary-drift line=${expectedLine}`);
  }
}
for (const helperTemplate of [
  'buildMerchantConsoleOnboardingOpenApiContractCopyPayload',
  "buttonLabel: 'Copy contract'",
  "successLabel: 'Copied contract'",
  '`path: ${status.path}`',
  '`fixture: ${status.fixture}`',
  '`verifier: ${status.verifier}`',
  '`enabledCarriers: ${status.enabledCarriers.join(\'+\')}`',
  "`addressFormVersionRef: ${status.addressFormVersionRef ?? 'missing'}`",
  '`walletBoundaryFields: ${status.requiredWalletBoundaryFields.join(\'+\')}`',
]) {
  if (!merchantConsoleSourceText.includes(helperTemplate)) {
    fail(`merchant-onboarding-contract-copy-helper-drift token=${helperTemplate}`);
  }
}
for (const forbidden of merchantOnboardingFixture.expected?.forbiddenPublicMaterial ?? []) {
  const unsafePattern = new RegExp(`${forbidden}(Value|:|\\s*=)`, 'i');
  if (unsafePattern.test(merchantOnboardingContractCopyText)) {
    fail(`merchant-onboarding-contract-copy-contains-forbidden-material key=${forbidden}`);
  }
}

if (process.env.HEXASHIP_PACKAGE_STATIC_ONLY === '1') {
  console.log('[verify-hexaship-package] status=pass staticOnly=true');
  process.exit(0);
}

const npmExecPath = process.env.npm_execpath;

function runNpm(args: string[], cwd: string, label: string) {
  console.log(`[verify-hexaship-package] running=${label}`);
  const result = npmExecPath
    ? spawnSync(process.execPath, [npmExecPath, ...args], { cwd, encoding: 'utf8' })
    : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd, encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) fail(`${label} spawn-error=${result.error.message}`);
  if (result.status !== 0) fail(`${label} exit=${result.status}`);
  return result.stdout;
}

runNpm(['run', 'build'], sdkDir, 'sdk/hexaship-js build');

const mainPath = join(sdkDir, packageJson.main.replace(/^\.\//, ''));
const typesPath = join(sdkDir, packageJson.types.replace(/^\.\//, ''));
const skipshipRuntimePath = join(sdkDir, 'dist', 'sdk', 'skipship-js', 'src', 'index.js');
const skipshipTypesPath = join(sdkDir, 'dist', 'sdk', 'skipship-js', 'src', 'index.d.ts');

for (const requiredPath of [mainPath, typesPath, skipshipRuntimePath, skipshipTypesPath]) {
  if (!existsSync(requiredPath)) {
    fail(`missing-built-file path=${requiredPath}`);
  }
}

const packJsonText = runNpm(['pack', '--dry-run', '--json'], sdkDir, 'sdk/hexaship-js npm pack dry-run');
const packEntries = JSON.parse(packJsonText) as Array<{ files?: Array<{ path: string }> }>;
const packedFiles = new Set(packEntries.flatMap(entry => entry.files?.map(file => file.path) ?? []));

for (const requiredPackedFile of [
  'package.json',
  'README.md',
  'dist/sdk/hexaship-js/src/index.js',
  'dist/sdk/hexaship-js/src/index.d.ts',
  'dist/sdk/skipship-js/src/index.js',
  'dist/sdk/skipship-js/src/index.d.ts',
  'dist/src/lib/hexashipDeliveryGateway.js',
  'dist/src/lib/hexashipDeliveryGateway.d.ts',
  'fixtures/hexaship-alias-migration-v0.1.json',
]) {
  if (!packedFiles.has(requiredPackedFile)) {
    fail(`missing-packed-file path=${requiredPackedFile}`);
  }
}

const installSmokeDir = mkdtempSync(join(tmpdir(), 'hexaship-install-smoke-'));
const packText = runNpm(['pack', '--json', '--pack-destination', installSmokeDir], sdkDir, 'sdk/hexaship-js npm pack');
const packResult = JSON.parse(packText) as Array<{ filename?: string }>;
const tarballName = packResult[0]?.filename;
if (!tarballName) {
  fail('pack-missing-filename');
}
const tarballPath = join(installSmokeDir, tarballName);
if (!existsSync(tarballPath)) {
  fail(`pack-missing-tarball path=${tarballPath}`);
}

writeFileSync(join(installSmokeDir, 'package.json'), JSON.stringify({ type: 'module', private: true }, null, 2));
runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund', tarballPath], installSmokeDir, 'install packed @hexaship/js');

const smokePath = join(installSmokeDir, 'smoke.mjs');
writeFileSync(smokePath, `
import assert from 'node:assert/strict';
import {
  createHexashipClient,
  createSkipshipClient,
  HEXASHIP_JS_ALIAS,
} from '@hexaship/js';
import aliasMigrationFixture from '@hexaship/js/fixtures/hexaship-alias-migration-v0.1.json' with { type: 'json' };

assert.equal(HEXASHIP_JS_ALIAS.packageName, '@hexaship/js');
assert.equal(HEXASHIP_JS_ALIAS.productionTraffic, false);
assert.equal(HEXASHIP_JS_ALIAS.rawAddressFixtures, false);
assert.equal(createHexashipClient, createSkipshipClient);
assert.equal(aliasMigrationFixture.fixtureId, 'hexaship-alias-migration-v0.1');
assert.equal(aliasMigrationFixture.privacy.productionTraffic, false);
assert.equal(aliasMigrationFixture.privacy.rawAddressFixtures, false);
assert.equal(aliasMigrationFixture.hexashipImport.packageName, '@hexaship/js');

const client = createHexashipClient({
  baseUrl: 'https://hexaship.local',
  publishableKey: 'pk_test_install_smoke',
  transport: async request => ({
    status: 200,
    body: {
      shipmentId: 'shipment_synthetic_install_smoke_001',
      apiVersion: 'delivery-gateway-carrier-api-v0.1',
      developerCall: 'shipping.createShipment',
      status: 'sandbox_label_ready',
      servicePreference: 'balanced',
      carrierAlias: 'sandbox-carrier',
      recipientId: request.body.recipientId,
      safeRefs: {
        rateRef: 'rate_synthetic_install_smoke_001',
        allocationRef: 'alloc_synthetic_install_smoke_001',
        labelRef: 'label_synthetic_install_smoke_001',
        trackingReceiptRef: 'track_synthetic_install_smoke_001',
        deliveryProofRef: 'proof_synthetic_install_smoke_001',
      },
      webhookEvents: ['shipment.created'],
      blockedMaterial: [],
      localOnly: true,
      productionTraffic: false,
      rawAddressFixtures: false,
      nonClaims: ['install smoke only'],
      validationErrors: [],
    },
  }),
});

const shipment = await client.createShipment({
  recipientId: 'ship_recipient_synthetic_install_smoke_001',
  addressFormVersion: 'wallet_country_form_ref_synthetic_install_smoke_001',
  parcelProfileRef: 'parcel_profile_synthetic_install_smoke_001',
  walletConsentRef: 'consent_synthetic_install_smoke_001',
});

assert.equal(shipment.status, 'sandbox_label_ready');
assert.equal(shipment.productionTraffic, false);
assert.equal(shipment.rawAddressFixtures, false);
assert.equal(shipment.recipientId, 'ship_recipient_synthetic_install_smoke_001');
console.log('[hexaship-install-smoke] status=pass');
`);

const smoke = spawnSync(process.execPath, [smokePath], { cwd: installSmokeDir, encoding: 'utf8' });
if (smoke.stdout) process.stdout.write(smoke.stdout);
if (smoke.stderr) process.stderr.write(smoke.stderr);
if (smoke.error) fail(`install-smoke spawn-error=${smoke.error.message}`);
if (smoke.status !== 0) fail(`install-smoke exit=${smoke.status}`);

writeFileSync(join(installSmokeDir, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    strict: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    noEmit: true,
  },
  include: ['smoke.ts', 'readme-sample.ts', 'readme-migration-sample.ts'],
}, null, 2));

writeFileSync(join(installSmokeDir, 'smoke.ts'), `
import assert from 'node:assert/strict';
import {
  createHexashipClient,
  createSkipshipClient,
  HEXASHIP_JS_ALIAS,
  type HexashipClient,
  type HexashipShipmentCreateRequest,
  type HexashipTransport,
  type HexashipTransportRequest,
} from '@hexaship/js';
import aliasMigrationFixture from '@hexaship/js/fixtures/hexaship-alias-migration-v0.1.json' with { type: 'json' };

const transport: HexashipTransport = async <T>(request: HexashipTransportRequest) => {
  const body = request.body as HexashipShipmentCreateRequest;
  return {
    status: 200,
    body: {
    shipmentId: 'shipment_synthetic_type_smoke_001',
    apiVersion: 'delivery-gateway-carrier-api-v0.1',
    developerCall: 'shipping.createShipment',
    status: 'sandbox_label_ready',
    servicePreference: 'balanced',
    carrierAlias: 'sandbox-carrier',
    recipientId: body.recipientId,
    safeRefs: {
      rateRef: 'rate_synthetic_type_smoke_001',
      allocationRef: 'alloc_synthetic_type_smoke_001',
      labelRef: 'label_synthetic_type_smoke_001',
      trackingReceiptRef: 'track_synthetic_type_smoke_001',
      deliveryProofRef: 'proof_synthetic_type_smoke_001',
    },
    webhookEvents: ['shipment.created'],
    blockedMaterial: [],
    localOnly: true,
    productionTraffic: false,
    rawAddressFixtures: false,
    nonClaims: ['type smoke only'],
    validationErrors: [],
    } as T,
  };
};

const client: HexashipClient = createHexashipClient({
  baseUrl: 'https://hexaship.local',
  publishableKey: 'pk_test_type_smoke',
  transport,
});

const request: HexashipShipmentCreateRequest = {
  recipientId: 'ship_recipient_synthetic_type_smoke_001',
  addressFormVersion: 'wallet_country_form_ref_synthetic_type_smoke_001',
  parcelProfileRef: 'parcel_profile_synthetic_type_smoke_001',
  walletConsentRef: 'consent_synthetic_type_smoke_001',
};

assert.equal(HEXASHIP_JS_ALIAS.packageName, '@hexaship/js');
assert.equal(createHexashipClient, createSkipshipClient);
assert.equal(aliasMigrationFixture.privacy.productionTraffic, false);
assert.equal(aliasMigrationFixture.privacy.rawAddressFixtures, false);
void client.createShipment(request);
`);
writeFileSync(join(installSmokeDir, 'readme-sample.ts'), primaryReadmeSample);
writeFileSync(join(installSmokeDir, 'readme-migration-sample.ts'), migrationReadmeSample);

const tscBin = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
const typeSmoke = spawnSync(process.execPath, [tscBin, '-p', installSmokeDir], { cwd: installSmokeDir, encoding: 'utf8' });
if (typeSmoke.stdout) process.stdout.write(typeSmoke.stdout);
if (typeSmoke.stderr) process.stderr.write(typeSmoke.stderr);
if (typeSmoke.error) fail(`type-smoke spawn-error=${typeSmoke.error.message}`);
if (typeSmoke.status !== 0) fail(`type-smoke exit=${typeSmoke.status}`);
console.log('[hexaship-type-smoke] status=pass');

console.log('[verify-hexaship-package] status=pass');
