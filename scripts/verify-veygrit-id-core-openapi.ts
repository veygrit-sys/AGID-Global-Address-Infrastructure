import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const OPENAPI_PATH = join('docs', 'specs', 'veygrit-id-core.openapi.yaml');
const FIXTURE_PATH = join('docs', 'specs', 'fixtures', 'veygrit-id-core-v0.1.json');
const SCHEMA_PATH = join('docs', 'specs', 'schemas', 'veygrit-id-core-fixture-v0.1.schema.json');
const ACCOUNT_PROVIDERS = ['google', 'apple'] as const;
const MERCHANT_VISIBLE_REDACTION_SAFE_REFS = [
  'pairwiseSubjectAlias',
  'guestCheckoutAlias',
  'walletConsentRef',
  'addressCredentialRef',
  'carrierHandoffRef',
] as const;
const MERCHANT_VISIBLE_REDACTION_BLOCKED_MATERIAL = [
  'rawAddress',
  'recipientName',
  'recipientPhone',
  'privateDeliveryNotes',
  'proofWitness',
  'proofSecret',
  'privateKey',
] as const;
const MERCHANT_VISIBLE_REDACTION_NON_CLAIM = 'Merchant-visible refs are not raw address disclosure, residence proof, or reusable marketing consent.';
const MERCHANT_VISIBLE_REDACTION_SDK_PACKAGE = '@veygrit/address-login-react';
const MERCHANT_VISIBLE_REDACTION_SDK_HELPER = 'createMerchantVisibleRedactionDisplayModel';
const MERCHANT_VISIBLE_REDACTION_EXAMPLE = 'sdk/veygrit-address-login-react/examples/merchant-visible-redaction/MerchantVisibleRedactionCard.tsx';
const MERCHANT_VISIBLE_REDACTION_NEXT_ACTION = 'create-guest-order-from-refs';
const UNSAFE_MERCHANT_VISIBLE_DISPLAY_VALUE =
  /raw.?address|address.?line|recipient|phone|email|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile|carrier.?api.?key|production.?credential/i;

type JsonObject = Record<string, unknown>;

function readText(path: string, errors: string[]) {
  if (!existsSync(path)) {
    errors.push(`missing-file:${path}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function readJson(path: string, errors: string[]) {
  const text = readText(path, errors);
  if (!text) return {};
  try {
    return JSON.parse(text) as JsonObject;
  } catch (error) {
    errors.push(`invalid-json:${path}:${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

function nested(value: unknown, path: string[]) {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as JsonObject)[key];
  }, value);
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function assertIncludes(haystack: unknown[], needle: string, label: string, errors: string[]) {
  if (!haystack.includes(needle)) errors.push(`${label}-missing:${needle}`);
}

function assertFalse(value: unknown, label: string, errors: string[]) {
  if (value !== false) errors.push(`${label}-must-be-false`);
}

function assertEquals(value: unknown, expected: unknown, label: string, errors: string[]) {
  if (value !== expected) errors.push(`${label}-mismatch`);
}

const errors: string[] = [];
const openApiText = readText(OPENAPI_PATH, errors);
let openApi: JsonObject = {};
try {
  openApi = openApiText ? parseYaml(openApiText) as JsonObject : {};
} catch (error) {
  errors.push(`invalid-yaml:${OPENAPI_PATH}:${error instanceof Error ? error.message : String(error)}`);
}

const fixture = readJson(FIXTURE_PATH, errors);
const schema = readJson(SCHEMA_PATH, errors);

const paths = nested(openApi, ['paths']) as JsonObject | undefined;
for (const requiredPath of [
  '/veygrit/oauth/authorize',
  '/veygrit/oauth/token',
  '/veygrit/guest-checkout/handoff',
  '/veygrit/connections/revoke',
  '/.well-known/veygrit-client.json',
]) {
  if (!paths?.[requiredPath]) errors.push(`openapi-path-missing:${requiredPath}`);
}

const authorizeControls = asArray(nested(openApi, ['paths', '/veygrit/oauth/authorize', 'get', 'x-agid-required-controls']));
for (const control of ['google-apple-account-only', 'pkce-s256-required', 'pairwise-subject-alias', 'wallet-consent-preflight']) {
  assertIncludes(authorizeControls, control, 'authorize-control', errors);
}

const tokenControls = asArray(nested(openApi, ['paths', '/veygrit/oauth/token', 'post', 'x-agid-required-controls']));
for (const control of ['pkce-verifier-match', 'token-ref-only-response', 'no-refresh-token-in-mvp']) {
  assertIncludes(tokenControls, control, 'token-control', errors);
}

const guestCheckoutControls = asArray(nested(openApi, ['paths', '/veygrit/guest-checkout/handoff', 'post', 'x-agid-required-controls']));
for (const control of ['issued-token-exchange-required', 'address-consent-required', 'guest-checkout-ref-only', 'merchant-account-creation-not-required', 'wallet-login-required']) {
  assertIncludes(guestCheckoutControls, control, 'guest-checkout-control', errors);
}
const guestCheckoutBoundary = nested(openApi, ['paths', '/veygrit/guest-checkout/handoff', 'post', 'x-agid-privacy-boundary-gate']);
if (nested(guestCheckoutBoundary, ['id']) !== 'merchant-visible-redaction') errors.push('guest-checkout-boundary-id-mismatch');
if (nested(guestCheckoutBoundary, ['source']) !== 'src/lib/veyIdAddressWalletFoundation.ts#privacyThreatBoundaryGates') {
  errors.push('guest-checkout-boundary-source-mismatch');
}
if (nested(guestCheckoutBoundary, ['owner']) !== 'merchant-app') errors.push('guest-checkout-boundary-owner-mismatch');
for (const ref of MERCHANT_VISIBLE_REDACTION_SAFE_REFS) {
  assertIncludes(asArray(nested(guestCheckoutBoundary, ['safeEvidenceRefs'])), ref, 'guest-checkout-boundary-safe-ref', errors);
}
for (const material of MERCHANT_VISIBLE_REDACTION_BLOCKED_MATERIAL) {
  assertIncludes(asArray(nested(guestCheckoutBoundary, ['requiredBlockedMaterial'])), material, 'guest-checkout-boundary-blocked-material', errors);
}
assertIncludes(asArray(nested(guestCheckoutBoundary, ['nonClaims'])), MERCHANT_VISIBLE_REDACTION_NON_CLAIM, 'guest-checkout-boundary-non-claim', errors);

const revokeControls = asArray(nested(openApi, ['paths', '/veygrit/connections/revoke', 'post', 'x-agid-required-controls']));
for (const control of ['wallet-side-primary-revocation', 'merchant-deletion-receipt']) {
  assertIncludes(revokeControls, control, 'revocation-control', errors);
}

const fixtureProviders = asArray(nested(fixture, ['authorization', 'accountProviders']));
if (fixtureProviders.join(',') !== ACCOUNT_PROVIDERS.join(',')) errors.push('fixture-account-providers-must-be-google-apple');
if (nested(fixture, ['authorization', 'pkceRequired']) !== true) errors.push('fixture-pkce-required-must-be-true');
if (nested(fixture, ['tokenExchange', 'tokenType']) !== 'bearer-ref') errors.push('fixture-token-type-must-be-bearer-ref');
if (!String(nested(fixture, ['tokenExchange', 'claims', 'sub']) ?? '').startsWith('pairwise_')) {
  errors.push('fixture-sub-must-be-pairwise-alias');
}

if (nested(fixture, ['guestCheckoutHandoff', 'mode']) !== 'ec-guest-checkout') {
  errors.push('fixture-guest-checkout-mode-mismatch');
}
if (nested(fixture, ['guestCheckoutHandoff', 'nextAction']) !== 'create-guest-order') {
  errors.push('fixture-guest-checkout-next-action-mismatch');
}
if (!String(nested(fixture, ['guestCheckoutHandoff', 'guestCheckoutAlias']) ?? '').startsWith('vey_guest_checkout_')) {
  errors.push('fixture-guest-checkout-alias-prefix-mismatch');
}
if (!String(nested(fixture, ['guestCheckoutHandoff', 'walletConsentRef']) ?? '').startsWith('wallet_consent_')) {
  errors.push('fixture-wallet-consent-ref-prefix-mismatch');
}
if (!String(nested(fixture, ['guestCheckoutHandoff', 'carrierHandoffRef']) ?? '').startsWith('carrier_handoff_')) {
  errors.push('fixture-carrier-handoff-ref-prefix-mismatch');
}
assertFalse(nested(fixture, ['guestCheckoutHandoff', 'merchantAccountCreationRequired']), 'fixture-guest-checkout-merchant-account-creation-required', errors);
assertFalse(nested(fixture, ['guestCheckoutHandoff', 'ecPasswordRequired']), 'fixture-guest-checkout-ec-password-required', errors);
if (nested(fixture, ['guestCheckoutHandoff', 'walletLoginRequired']) !== true) {
  errors.push('fixture-guest-checkout-wallet-login-required-must-be-true');
}
for (const flag of [
  'rawAddressSharedWithMerchant',
  'rawPhoneSharedWithMerchant',
  'globalSubjectIdExposedToMerchant',
  'merchantCanCreateAccountSilently',
  'carrierCredentialsSharedWithMerchant',
]) {
  assertFalse(nested(fixture, ['guestCheckoutHandoff', 'privacy', flag]), `fixture-guest-checkout-privacy-${flag}`, errors);
}
if (nested(fixture, ['guestCheckoutHandoff', 'privacy', 'oneTimeUse']) !== true) {
  errors.push('fixture-guest-checkout-one-time-use-must-be-true');
}
if (nested(fixture, ['privacyBoundaryGate', 'id']) !== 'merchant-visible-redaction') errors.push('fixture-boundary-id-mismatch');
if (nested(fixture, ['privacyBoundaryGate', 'source']) !== 'src/lib/veyIdAddressWalletFoundation.ts#privacyThreatBoundaryGates') {
  errors.push('fixture-boundary-source-mismatch');
}
if (nested(fixture, ['privacyBoundaryGate', 'owner']) !== 'merchant-app') errors.push('fixture-boundary-owner-mismatch');
for (const ref of MERCHANT_VISIBLE_REDACTION_SAFE_REFS) {
  assertIncludes(asArray(nested(fixture, ['privacyBoundaryGate', 'safeEvidenceRefs'])), ref, 'fixture-boundary-safe-ref', errors);
}
for (const material of MERCHANT_VISIBLE_REDACTION_BLOCKED_MATERIAL) {
  assertIncludes(asArray(nested(fixture, ['privacyBoundaryGate', 'requiredBlockedMaterial'])), material, 'fixture-boundary-blocked-material', errors);
}
assertIncludes(asArray(nested(fixture, ['privacyBoundaryGate', 'nonClaims'])), MERCHANT_VISIBLE_REDACTION_NON_CLAIM, 'fixture-boundary-non-claim', errors);

const displayContractPath = ['merchantVisibleRedactionDisplayContract'];
assertEquals(nested(fixture, [...displayContractPath, 'sdkPackage']), MERCHANT_VISIBLE_REDACTION_SDK_PACKAGE, 'fixture-display-contract-sdk-package', errors);
assertEquals(nested(fixture, [...displayContractPath, 'sdkHelper']), MERCHANT_VISIBLE_REDACTION_SDK_HELPER, 'fixture-display-contract-sdk-helper', errors);
assertEquals(nested(fixture, [...displayContractPath, 'example']), MERCHANT_VISIBLE_REDACTION_EXAMPLE, 'fixture-display-contract-example', errors);
assertEquals(nested(fixture, [...displayContractPath, 'boundaryGateId']), 'merchant-visible-redaction', 'fixture-display-contract-boundary-gate-id', errors);
const displayFields = asArray(nested(fixture, [...displayContractPath, 'displayFields']));
if (displayFields.join(',') !== MERCHANT_VISIBLE_REDACTION_SAFE_REFS.join(',')) {
  errors.push('fixture-display-contract-fields-mismatch');
}
const expectedDisplayRefsByField: Record<string, unknown> = {
  pairwiseSubjectAlias: nested(fixture, ['authorization', 'pairwiseSubjectAlias']),
  guestCheckoutAlias: nested(fixture, ['guestCheckoutHandoff', 'guestCheckoutAlias']),
  walletConsentRef: nested(fixture, ['guestCheckoutHandoff', 'walletConsentRef']),
  addressCredentialRef: nested(fixture, ['guestCheckoutHandoff', 'addressCredentialRef']),
  carrierHandoffRef: nested(fixture, ['guestCheckoutHandoff', 'carrierHandoffRef']),
};
for (const field of MERCHANT_VISIBLE_REDACTION_SAFE_REFS) {
  const displayRef = nested(fixture, [...displayContractPath, 'displayRefsByField', field]);
  assertEquals(displayRef, expectedDisplayRefsByField[field], `fixture-display-contract-ref-${field}`, errors);
  if (typeof displayRef !== 'string' || UNSAFE_MERCHANT_VISIBLE_DISPLAY_VALUE.test(displayRef)) {
    errors.push(`fixture-display-contract-unsafe-ref-value:${field}`);
  }
}
assertEquals(nested(fixture, [...displayContractPath, 'requiredNextAction']), MERCHANT_VISIBLE_REDACTION_NEXT_ACTION, 'fixture-display-contract-required-next-action', errors);
assertEquals(nested(fixture, [...displayContractPath, 'blockedClassCount']), MERCHANT_VISIBLE_REDACTION_BLOCKED_MATERIAL.length, 'fixture-display-contract-blocked-class-count', errors);
assertEquals(nested(fixture, [...displayContractPath, 'nonClaimCount']), asArray(nested(fixture, ['privacyBoundaryGate', 'nonClaims'])).length, 'fixture-display-contract-non-claim-count', errors);
assertFalse(nested(fixture, [...displayContractPath, 'renderedMaterialPolicy', 'copyBlockedMaterialNames']), 'fixture-display-contract-copy-blocked-material-names', errors);
assertFalse(nested(fixture, [...displayContractPath, 'renderedMaterialPolicy', 'copyNonClaimText']), 'fixture-display-contract-copy-non-claim-text', errors);
if (nested(fixture, [...displayContractPath, 'renderedMaterialPolicy', 'showCountsOnly']) !== true) {
  errors.push('fixture-display-contract-show-counts-only-must-be-true');
}

for (const flag of [
  'rawAddressExposed',
  'providerIdTokenStored',
  'providerAccessTokenStored',
  'providerRefreshTokenStored',
  'rawProviderProfileStored',
  'proofSecretExposed',
  'refreshTokenIssued',
  'productionTraffic',
]) {
  assertFalse(nested(fixture, ['privacy', flag]), `fixture-privacy-${flag}`, errors);
}

const deletionRefs = asArray(nested(fixture, ['revocation', 'merchantDeletionRefs']));
for (const ref of ['pairwiseSubjectAlias', 'walletConsentRef', 'addressCredentialRef', 'carrierHandoffRef']) {
  assertIncludes(deletionRefs, ref, 'fixture-deletion-ref', errors);
}

for (const material of ['providerIdToken', 'providerAccessToken', 'providerRefreshToken', 'rawProviderProfile', 'proofSecret', 'privateKey']) {
  assertIncludes(asArray(fixture.forbiddenMaterial), material, 'fixture-forbidden-material', errors);
}

if (nested(schema, ['properties', 'fixtureId', 'const']) !== 'veygrit-id-core-v0.1') {
  errors.push('schema-fixture-id-const-mismatch');
}
if (nested(schema, ['properties', 'source', 'properties', 'verifier', 'const']) !== 'npm run verify:veygrit-id-core-openapi') {
  errors.push('schema-verifier-const-mismatch');
}
const schemaAccountProviders = asArray(nested(schema, ['properties', 'authorization', 'properties', 'accountProviders', 'prefixItems']))
  .map(item => nested(item, ['const']));
if (schemaAccountProviders.join(',') !== ACCOUNT_PROVIDERS.join(',')) {
  errors.push('schema-account-providers-must-be-google-apple');
}
if (nested(schema, ['properties', 'authorization', 'properties', 'accountProviders', 'minItems']) !== ACCOUNT_PROVIDERS.length) {
  errors.push('schema-account-providers-min-items-mismatch');
}
if (nested(schema, ['properties', 'authorization', 'properties', 'accountProviders', 'maxItems']) !== ACCOUNT_PROVIDERS.length) {
  errors.push('schema-account-providers-max-items-mismatch');
}
if (nested(schema, ['properties', 'guestCheckoutHandoff', 'properties', 'merchantAccountCreationRequired', 'const']) !== false) {
  errors.push('schema-guest-checkout-merchant-account-creation-required-must-be-false');
}
if (nested(schema, ['properties', 'guestCheckoutHandoff', 'properties', 'walletLoginRequired', 'const']) !== true) {
  errors.push('schema-guest-checkout-wallet-login-required-must-be-true');
}
if (nested(schema, ['properties', 'privacyBoundaryGate', 'properties', 'id', 'const']) !== 'merchant-visible-redaction') {
  errors.push('schema-boundary-id-const-mismatch');
}
if (nested(schema, ['properties', 'privacyBoundaryGate', 'properties', 'owner', 'const']) !== 'merchant-app') {
  errors.push('schema-boundary-owner-const-mismatch');
}
const schemaBoundarySafeRefs = asArray(nested(schema, ['properties', 'privacyBoundaryGate', 'properties', 'safeEvidenceRefs', 'items', 'enum']));
for (const ref of MERCHANT_VISIBLE_REDACTION_SAFE_REFS) {
  assertIncludes(schemaBoundarySafeRefs, ref, 'schema-boundary-safe-ref-enum', errors);
}
const schemaBoundaryBlockedMaterial = asArray(nested(schema, ['properties', 'privacyBoundaryGate', 'properties', 'requiredBlockedMaterial', 'items', 'enum']));
for (const material of MERCHANT_VISIBLE_REDACTION_BLOCKED_MATERIAL) {
  assertIncludes(schemaBoundaryBlockedMaterial, material, 'schema-boundary-blocked-material-enum', errors);
}
assertEquals(
  nested(schema, ['properties', 'merchantVisibleRedactionDisplayContract', 'properties', 'sdkPackage', 'const']),
  MERCHANT_VISIBLE_REDACTION_SDK_PACKAGE,
  'schema-display-contract-sdk-package',
  errors,
);
assertEquals(
  nested(schema, ['properties', 'merchantVisibleRedactionDisplayContract', 'properties', 'sdkHelper', 'const']),
  MERCHANT_VISIBLE_REDACTION_SDK_HELPER,
  'schema-display-contract-sdk-helper',
  errors,
);
assertEquals(
  nested(schema, ['properties', 'merchantVisibleRedactionDisplayContract', 'properties', 'example', 'const']),
  MERCHANT_VISIBLE_REDACTION_EXAMPLE,
  'schema-display-contract-example',
  errors,
);
const schemaDisplayFields = asArray(nested(schema, ['properties', 'merchantVisibleRedactionDisplayContract', 'properties', 'displayFields', 'prefixItems']))
  .map(item => nested(item, ['const']));
if (schemaDisplayFields.join(',') !== MERCHANT_VISIBLE_REDACTION_SAFE_REFS.join(',')) {
  errors.push('schema-display-contract-fields-mismatch');
}
assertEquals(
  nested(schema, ['properties', 'merchantVisibleRedactionDisplayContract', 'properties', 'requiredNextAction', 'const']),
  MERCHANT_VISIBLE_REDACTION_NEXT_ACTION,
  'schema-display-contract-required-next-action',
  errors,
);
assertEquals(
  nested(schema, ['properties', 'merchantVisibleRedactionDisplayContract', 'properties', 'blockedClassCount', 'const']),
  MERCHANT_VISIBLE_REDACTION_BLOCKED_MATERIAL.length,
  'schema-display-contract-blocked-class-count',
  errors,
);
assertEquals(
  nested(schema, ['properties', 'merchantVisibleRedactionDisplayContract', 'properties', 'renderedMaterialPolicy', 'properties', 'copyBlockedMaterialNames', 'const']),
  false,
  'schema-display-contract-copy-blocked-material-names',
  errors,
);
assertEquals(
  nested(schema, ['properties', 'merchantVisibleRedactionDisplayContract', 'properties', 'renderedMaterialPolicy', 'properties', 'copyNonClaimText', 'const']),
  false,
  'schema-display-contract-copy-non-claim-text',
  errors,
);
assertEquals(
  nested(schema, ['properties', 'merchantVisibleRedactionDisplayContract', 'properties', 'renderedMaterialPolicy', 'properties', 'showCountsOnly', 'const']),
  true,
  'schema-display-contract-show-counts-only',
  errors,
);
if (nested(schema, ['properties', 'privacy', 'properties', 'productionTraffic', 'const']) !== false) {
  errors.push('schema-production-traffic-const-must-be-false');
}

const openApiString = JSON.stringify(openApi);
for (const banned of ['providerIdTokenStored: true', 'providerAccessTokenStored: true', 'providerRefreshTokenStored: true']) {
  if (openApiString.includes(banned)) errors.push(`openapi-banned-token-storage-claim:${banned}`);
}

if (errors.length > 0) {
  console.error('[verify-veygrit-id-core-openapi] status=fail');
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log('[verify-veygrit-id-core-openapi] status=pass');
  console.log(`openapi=${OPENAPI_PATH}`);
  console.log(`fixture=${FIXTURE_PATH}`);
  console.log(`schema=${SCHEMA_PATH}`);
}
