import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  assertHostedCallbackNormalizedParamsAreRedacted,
  expectedCallbackErrorPattern,
  loadHostedCallbackValidationVectors,
} from '../sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors';
import {
  createVeyIdCoreMerchantVisibleRedactionAdapterFixture,
  displayRefsFromMerchantVisibleRedactionContract,
  loadHostedAddressLoginMerchantVisibleRedactionDisplayContract,
} from '../sdk/veygrit-address-login-test-helpers/merchantVisibleRedactionFixtures';

const GATE = 'verify-veygrit-address-login-test-helpers';
const ROOT = process.cwd();
const FORBIDDEN_PUBLIC_MATERIAL =
  /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile|carrier.?api.?key|production.?credential/i;
const REQUIRED_README_ANCHORS = [
  'not a published runtime package',
  'React and Next.js SDK tests',
  'hostedCallbackValidationVectors.ts',
  'merchantVisibleRedactionFixtures.ts',
  'callbackValidationVectors',
  'merchant-visible redaction',
  'raw address, recipient, witness, private-key, proof-secret',
  'npm run verify:veygrit-address-login-test-helpers',
  'npm run verify:veygrit-address-login-packages',
  'local OSS-prep evidence only',
] as const;
const TRACEABILITY_PATHS = [
  'scripts/verify-veygrit-address-login-test-helpers.ts',
  'sdk/veygrit-address-login-test-helpers/README.md',
  'sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts',
  'sdk/veygrit-address-login-test-helpers/merchantVisibleRedactionFixtures.ts',
] as const;

function readWorkspaceFile(path: string): string {
  const absolutePath = join(ROOT, path);
  assert.ok(existsSync(absolutePath), `${path} is required`);
  return readFileSync(absolutePath, 'utf8');
}

function assertNoForbiddenPublicMaterial(value: unknown, label: string) {
  assert.doesNotMatch(JSON.stringify(value), FORBIDDEN_PUBLIC_MATERIAL, label);
}

function assertVerifierRunsHelperBeforePackageSafety(source: string, label: 'react' | 'nextjs') {
  const helperIndex = source.indexOf('scripts/verify-veygrit-address-login-test-helpers.ts');
  const packageSafetyIndex = source.indexOf(`scripts/verify-veygrit-address-login-${label}-package.ts`);

  assert.ok(helperIndex >= 0, `${label} verifier must run the shared helper boundary`);
  assert.ok(packageSafetyIndex >= 0, `${label} verifier must run package safety`);
  assert.ok(helperIndex < packageSafetyIndex, `${label} verifier must run helper boundary before package safety`);
}

function verifyReadme() {
  const readme = readWorkspaceFile('sdk/veygrit-address-login-test-helpers/README.md').replace(/\s+/g, ' ');
  for (const anchor of REQUIRED_README_ANCHORS) {
    assert.ok(readme.includes(anchor), `README must include ${anchor}`);
  }
}

function verifyCallbackVectors() {
  const vectors = loadHostedCallbackValidationVectors();
  const accepted = vectors.filter(vector => vector.expectedResult === 'accepted');
  const rejected = vectors.filter(vector => vector.expectedResult === 'rejected');
  const rejectedErrors = new Set(rejected.map(vector => vector.expectedError));

  assert.ok(vectors.length >= 4, 'shared callback vectors should cover positive and negative cases');
  assert.ok(accepted.length > 0, 'shared callback vectors need at least one accepted vector');
  assert.ok(rejected.length > 0, 'shared callback vectors need at least one rejected vector');
  assert.ok(rejectedErrors.has('state_mismatch'), 'shared callback vectors must cover state mismatch');
  assert.ok(rejectedErrors.has('forbidden_callback_param'), 'shared callback vectors must cover forbidden params');
  assert.ok(rejectedErrors.has('missing_code'), 'shared callback vectors must cover missing code');

  assertHostedCallbackNormalizedParamsAreRedacted(vectors);
  for (const vector of accepted) {
    assertNoForbiddenPublicMaterial(vector.expectedNormalizedParams, `${vector.id}:expectedNormalizedParams`);
  }
  for (const vector of rejected) {
    assert.ok(expectedCallbackErrorPattern(vector) instanceof RegExp, `${vector.id}:expected error pattern`);
  }
}

function verifyMerchantVisibleRedactionFixtures() {
  const adapter = createVeyIdCoreMerchantVisibleRedactionAdapterFixture();
  const hostedContract = loadHostedAddressLoginMerchantVisibleRedactionDisplayContract();
  const hostedDisplayRefs = displayRefsFromMerchantVisibleRedactionContract(hostedContract);

  assert.equal(adapter.boundaryGate.id, 'merchant-visible-redaction');
  assert.equal(adapter.displayContract.sdkPackage, '@veygrit/address-login-react');
  assert.equal(adapter.displayContract.sdkHelper, 'createMerchantVisibleRedactionDisplayModel');
  assert.equal(hostedContract.sdkPackage, adapter.displayContract.sdkPackage);
  assert.equal(hostedContract.sdkHelper, adapter.displayContract.sdkHelper);
  assert.equal(hostedContract.boundaryGateId, adapter.displayContract.boundaryGateId);
  assert.deepEqual(hostedContract.displayFields, adapter.displayContract.displayFields);
  assert.equal(adapter.displayRefs.length, adapter.boundaryGate.safeEvidenceRefs.length);
  assert.equal(adapter.displayContract.blockedClassCount, adapter.boundaryGate.requiredBlockedMaterial.length);
  assert.equal(adapter.displayContract.nonClaimCount, adapter.boundaryGate.nonClaims.length);
  assert.equal(hostedContract.blockedClassCount, adapter.displayContract.blockedClassCount);
  assert.equal(hostedContract.nonClaimCount, adapter.displayContract.nonClaimCount);
  assert.equal(adapter.displayContract.renderedMaterialPolicy.copyBlockedMaterialNames, false);
  assert.equal(adapter.displayContract.renderedMaterialPolicy.copyNonClaimText, false);
  assert.equal(adapter.displayContract.renderedMaterialPolicy.showCountsOnly, true);
  assert.deepEqual(hostedContract.renderedMaterialPolicy, adapter.displayContract.renderedMaterialPolicy);

  assert.ok(adapter.boundaryGate.requiredBlockedMaterial.includes('rawAddress'));
  assert.ok(adapter.boundaryGate.requiredBlockedMaterial.includes('proofSecret'));
  assert.ok(adapter.boundaryGate.requiredBlockedMaterial.includes('privateKey'));
  assertNoForbiddenPublicMaterial(adapter.boundaryGate.safeEvidenceRefs, 'safeEvidenceRefs');
  assertNoForbiddenPublicMaterial(adapter.displayRefs, 'displayRefs');
  assertNoForbiddenPublicMaterial(adapter.refs, 'displayRefsByField');
  assertNoForbiddenPublicMaterial(hostedDisplayRefs, 'hostedDisplayRefs');
  assertNoForbiddenPublicMaterial(hostedContract.displayRefsByField, 'hostedDisplayRefsByField');
}

function verifyTraceability() {
  const rootPackageJson = JSON.parse(readWorkspaceFile('package.json')) as { scripts?: Record<string, string> };
  const productPlan = readWorkspaceFile('docs/product/veygrit-id-address-login-plan.md');
  const packageVerifier = readWorkspaceFile('scripts/verify-veygrit-address-login-packages.ts');
  const reactVerifier = readWorkspaceFile('scripts/verify-veygrit-address-login-react.ts');
  const nextjsVerifier = readWorkspaceFile('scripts/verify-veygrit-address-login-nextjs.ts');
  const reactSdkTest = readWorkspaceFile('sdk/veygrit-address-login-react/test/sdk.test.ts');
  const nextjsSdkTest = readWorkspaceFile('sdk/veygrit-address-login-nextjs/test/sdk.test.ts');
  const merchantConsoleTest = readWorkspaceFile('src/components/MerchantConsoleScreen.test.ts');

  assert.equal(
    rootPackageJson.scripts?.['verify:veygrit-address-login-test-helpers'],
    'tsx scripts/verify-veygrit-address-login-test-helpers.ts',
  );

  for (const path of TRACEABILITY_PATHS) {
    assert.ok(productPlan.includes(path), `product plan must trace ${path}`);
    assert.ok(packageVerifier.includes(path), `package verifier must trace ${path}`);
  }

  assert.match(productPlan, /shared SDK test-helper README/);
  assert.match(productPlan, /merchant-visible redaction\s+fixture helper/);
  assert.match(productPlan, /npm run verify:veygrit-address-login-test-helpers/);
  assertVerifierRunsHelperBeforePackageSafety(reactVerifier, 'react');
  assertVerifierRunsHelperBeforePackageSafety(nextjsVerifier, 'nextjs');
  assert.match(reactSdkTest, /veygrit-address-login-test-helpers\/hostedCallbackValidationVectors/);
  assert.match(reactSdkTest, /veygrit-address-login-test-helpers\/merchantVisibleRedactionFixtures/);
  assert.match(nextjsSdkTest, /veygrit-address-login-test-helpers\/hostedCallbackValidationVectors/);
  assert.match(nextjsSdkTest, /veygrit-address-login-test-helpers\/merchantVisibleRedactionFixtures/);
  assert.match(merchantConsoleTest, /veygrit-address-login-test-helpers\/merchantVisibleRedactionFixtures/);
  assert.match(merchantConsoleTest, /loadHostedAddressLoginMerchantVisibleRedactionDisplayContract/);
  assert.match(merchantConsoleTest, /displayRefsFromMerchantVisibleRedactionContract/);
  assert.match(merchantConsoleTest, /createVeyIdCoreMerchantVisibleRedactionAdapterFixture/);
  assert.match(merchantConsoleTest, /extractHostedRedactionHtml/);
}

function run() {
  verifyReadme();
  verifyCallbackVectors();
  verifyMerchantVisibleRedactionFixtures();
  verifyTraceability();

  console.log(`[${GATE}] status=pass tracedFiles=${TRACEABILITY_PATHS.length}`);
}

run();
