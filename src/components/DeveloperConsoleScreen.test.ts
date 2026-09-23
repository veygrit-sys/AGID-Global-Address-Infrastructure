import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { getVeygritShipReleaseGateStatus } from '../lib/veygritShipReleaseGateStatus';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'DeveloperConsoleScreen.tsx'), 'utf8');
const css = readFileSync(join(here, '..', 'index.css'), 'utf8');

test('Developer Console exposes API keys, webhook logs, SDK, CLI, OpenAPI, test vectors, conformance, and launch checks', () => {
  assert.match(source, /buildDeveloperConsole/);
  assert.match(source, /DeveloperTab = 'overview' \| 'tutorial' \| 'features' \| 'keys' \| 'webhooks' \| 'sdk' \| 'openapi' \| 'vectors' \| 'launch' \| 'community' \| 'geo'/);
  assert.match(source, /apiKeyRefs/);
  assert.match(source, /webhookEndpoints/);
  assert.match(source, /webhookDeliveryLog/);
  assert.match(source, /model\.webhookLogs/);
  assert.match(source, /sdkTargets/);
  assert.match(source, /cliGuide/);
  assert.match(source, /model\.cliCommands/);
  assert.match(source, /openApiPaths/);
  assert.match(source, /testVectors/);
  assert.match(source, /conformanceResults/);
  assert.match(source, /model\.conformanceResults/);
  assert.match(source, /launchChecks/);
  assert.match(source, /communityLinks/);
  assert.match(source, /geoExamples/);
  assert.match(source, /buildDeveloperExperience/);
  assert.match(source, /DeveloperTutorialPanel/);
  assert.match(source, /AllFeaturesMatrixPanel/);
});

test('Developer Console renders safe export and privacy boundary controls', () => {
  assert.match(source, /safeExportText/);
  assert.match(source, /copySafeExport/);
  assert.match(source, /privacyBoundary/);
  assert.match(source, /key material/);
  assert.match(source, /raw AGID\/AOID/);
  assert.match(source, /proof codes/);
  assert.match(source, /model\.accepted/);
});

test('Developer Console owns vertical scrolling because the app shell locks body scroll for the map', () => {
  assert.match(source, /agid-page-scroll bg-\[#f6f8fb\]/);
  assert.match(css, /\.agid-page-scroll/);
  assert.match(css, /min-height: 100dvh/);
  assert.match(css, /padding-bottom: max\(24px, var\(--safe-area-bottom\)\)/);
  assert.match(css, /overscroll-behavior-y: contain/);
});

test('Developer Console launch tab renders Launch Center template, no-raw-address, and pre-audit controls', () => {
  assert.match(source, /evaluateAddressLaunchCenter/);
  assert.match(source, /ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES/);
  assert.match(source, /buildNoRawAddressComplianceKit/);
  assert.match(source, /evaluateNoRawAddressCompliancePayload/);
  assert.match(source, /LaunchCenterPanel/);
  assert.match(source, /threatModelTemplate/);
  assert.match(source, /noRawAddressGate/);
  assert.match(source, /preAuditChecks/);
  assert.match(source, /externalAuditReady/);
  assert.match(source, /deadLetterQueueReady/);
});

test('Developer Console launch tab surfaces Veygrit Ship public-safe release gate status', () => {
  const status = getVeygritShipReleaseGateStatus();

  assert.equal(status.gateCount, 13);
  assert.equal(status.exposure, 'public-safe-no-identifiers');
  assert.equal(status.remoteActionsAuthorized, false);
  assert.equal(status.productionTraffic, false);
  assert.match(source, /getVeygritShipReleaseGateStatus/);
  assert.match(source, /VEYGRIT_SHIP_RELEASE_GATE_STATUS/);
  assert.match(source, /VeygritShipReleaseGateStatusPanel/);
  assert.match(source, /data-veygrit-ship-release-gate-status/);
  assert.match(source, /Veygrit Ship release gates/);
  assert.match(source, /Public-safe local status/);
  assert.match(source, /status\.gates\.slice\(0, 6\)/);
  assert.match(source, /status\.nonClaims\.map/);
  assert.match(source, /remoteActionsAuthorized/);
  assert.match(source, /productionTraffic/);
  assert.doesNotMatch(source, /tenantId|requestId|addressId|recipientId|credentialSecretRef|credentialVersionRef|secretRef|versionRef/);
});

test('Developer Console launch tab maps threat templates to no-raw-address surface policies', () => {
  assert.match(source, /THREAT_TEMPLATE_SURFACE_MAP/);
  assert.match(source, /address-element-registration/);
  assert.match(source, /pos-terminal-handoff/);
  assert.match(source, /hosted-registry-webhooks/);
  assert.match(source, /zk-address-predicate/);
  assert.match(source, /developer-console-fixtures/);
  assert.match(source, /surfacePolicies\.find/);
});

test('Developer Console adds a reference-driven launchpad for API Workbench, SDK, deploy, community, and geo examples', () => {
  assert.match(source, /DeveloperLaunchpad/);
  assert.match(source, /guidedTutorial/);
  assert.match(source, /allFeaturesMatrix/);
  assert.match(source, /apiWorkbench/);
  assert.match(source, /API Workbench/);
  assert.match(source, /sandbox/);
  assert.match(source, /errorCatalog/);
  assert.match(source, /startWithSdk/);
  assert.match(source, /selfHosting/);
  assert.match(source, /deployStatus/);
  assert.match(source, /communityResearch/);
  assert.match(source, /geoExamples/);
  assert.match(source, /environmentGuard/);
  assert.match(source, /productionLocked/);
  assert.match(source, /sampleRequest/);
  assert.match(source, /responsePreview/);
  assert.match(source, /safeSampleRequest/);
  assert.match(source, /safeSampleResponse/);
  assert.match(source, /onTabSelect\(card\.tab\)/);
  assert.match(source, /rawAddressReturned/);
});

test('Developer Console renders all-feature coverage and hands-on tutorials', () => {
  assert.match(source, /Guided Tutorial Player/);
  assert.match(source, /All Features Matrix/);
  assert.match(source, /Scenario Recipes/);
  assert.match(source, /coverageRows/);
  assert.match(source, /tutorialSteps/);
  assert.match(source, /scenarioRecipes/);
  assert.match(source, /CoverageCheck/);
  assert.match(source, /TutorialStepCard/);
  assert.match(source, /commitment/);
  assert.match(source, /receipt/);
  assert.match(source, /failureRecovery/);
  assert.match(source, /Failure recovery/);
  assert.match(source, /失敗時の復旧/);
  assert.match(source, /REDACTED_COMMITMENT_REF/);
});

test('Developer Console presents a release-level API workbench instead of a passive catalog', () => {
  assert.match(source, /releaseBlocked/);
  assert.match(source, /Release blocked until gates pass/);
  assert.match(source, /safeSampleRequest\.path/);
  assert.match(source, /safeSampleRequest\.method/);
  assert.match(source, /Parameter/);
  assert.match(source, /Rate limit/);
  assert.match(source, /Idempotent/);
  assert.match(source, /responseRedacted/);
  assert.match(source, /launchItems/);
  assert.match(source, /Show redacted export/);
  assert.match(source, /Local/);
  assert.match(source, /Sandbox/);
  assert.match(source, /Production/);
});

test('Developer Console surfaces the Veygrit Address Login callback contract', () => {
  assert.match(source, /VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION/);
  assert.match(source, /VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS/);
  assert.match(source, /VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES/);
  assert.match(source, /VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES/);
  assert.match(source, /VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS/);
  assert.match(source, /ADDRESS_LOGIN_CALLBACK_ALIAS_ROWS/);
  assert.match(source, /ADDRESS_LOGIN_CALLBACK_CONTRACT_SUMMARY/);
  assert.match(source, /Address Login callback contract/);
  assert.match(source, /canonicalParams/);
  assert.match(source, /compatibilityAliases/);
  assert.match(source, /forbiddenCallbackParams/);
  assert.match(source, /nonClaims/);
  assert.match(source, /callback handling stays compatible/);
});

test('Developer Console has a modern developer command center across all tabs', () => {
  assert.match(source, /DeveloperCommandCenter/);
  assert.match(source, /data-developer-command-center/);
  assert.match(source, /Developer Console/);
  assert.match(source, /API Workbench/);
  assert.match(source, /Quickstart/);
  assert.match(source, /Release gate/);
  assert.match(source, /Run conformance/);
  assert.match(source, /Open workbench/);
  assert.match(source, /Deploy review/);
  assert.match(source, /activePath/);
  assert.match(source, /quickstartCommand/);
  assert.match(source, /releaseReady/);
  assert.match(source, /workflowCards/);
  assert.match(source, /onTabSelect\(card\.tab\)/);
  assert.match(source, /tabNav\.scrollTo\(\{ left: targetLeft, behavior: 'smooth' \}\)/);
  assert.doesNotMatch(source, /scrollIntoView\(\{ block: 'nearest'/);
});

test('Developer Console is oriented like a usable developer admin dashboard', () => {
  assert.match(source, /DeveloperAdminSidebar/);
  assert.match(source, /data-developer-admin-sidebar/);
  assert.match(source, /DeveloperAdminOverview/);
  assert.match(source, /data-developer-admin-dashboard/);
  assert.match(source, /API request fixtures/);
  assert.match(source, /Verified surfaces/);
  assert.match(source, /Webhook success/);
  assert.match(source, /Usage snapshot/);
  assert.match(source, /Recent activity/);
  assert.match(source, /Support & resources/);
  assert.match(source, /grid gap-5 lg:grid-cols-\[250px_minmax\(0,1fr\)\]/);
  assert.match(source, /lg:hidden" aria-label="Developer Console"/);
});

test('Developer Console keeps Vey integration access without re-exposing Store', () => {
  assert.doesNotMatch(source, /Commercial\/private demo \/ not OSS/);
  assert.doesNotMatch(source, /href: '\/playlist-commerce'/);
  assert.match(source, /Vey Ecosystem/);
  assert.match(source, /Wallet \+ Delivery Gateway \+ Carrier API Stripe/);
  assert.match(source, /\/merchant-console/);
  assert.match(source, /window\.location\.href = card\.href/);
  assert.match(source, /href\?: string/);
});

test('Developer Console API keys tab behaves like a secure key management screen', () => {
  assert.match(source, /DeveloperApiKeysAdminPanel/);
  assert.match(source, /data-developer-api-key-admin/);
  assert.match(source, /Create new API key/);
  assert.match(source, /API key list/);
  assert.match(source, /Permissions/);
  assert.match(source, /Access logs/);
  assert.match(source, /IP allowlist/);
  assert.match(source, /Security settings/);
  assert.match(source, /Recent access/);
  assert.match(source, /fingerprint/);
  assert.match(source, /Create, scope, rotate, and audit AGID API key references without exposing key material/);
});

test('Developer Console exposes a GitHub-ready Developer Console and App Shell slice', () => {
  assert.match(source, /PrReadinessPanel/);
  assert.match(source, /data-developer-pr-readiness/);
  assert.match(source, /developer-console-app-shell/);
  assert.match(source, /GitHub-ready slice/);
  assert.match(source, /sourceFiles/);
  assert.match(source, /compatibilityGates/);
  assert.match(source, /slice\.files\.map/);
  assert.match(source, /slice\.gates\.map/);
});

test('Developer Console uses a sober docs-grade layout instead of a dark AI-style hero shell', () => {
  assert.match(source, /data-developer-command-center/);
  assert.match(source, /mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm/);
  assert.match(source, /rounded-lg border border-slate-200 bg-slate-50/);
  assert.match(source, /border-b border-slate-200 bg-white p-5/);
  assert.doesNotMatch(source, /rounded-\[28px\]/);
  assert.doesNotMatch(source, /bg-slate-950 p-5 text-white/);
  assert.doesNotMatch(source, /border-b border-slate-200 bg-slate-950 p-5 text-white/);
});

test('Developer Console supports deep links for tutorial, features, API, sandbox, SDK, deploy, community, and geo examples', () => {
  assert.match(source, /DEVELOPER_HASH_TO_TAB/);
  assert.match(source, /'#tutorial': 'tutorial'/);
  assert.match(source, /'#features': 'features'/);
  assert.match(source, /'#api': 'openapi'/);
  assert.match(source, /'#sandbox': 'openapi'/);
  assert.match(source, /'#sdk': 'sdk'/);
  assert.match(source, /'#deploy': 'launch'/);
  assert.match(source, /'#community': 'community'/);
  assert.match(source, /'#geo-examples': 'geo'/);
  assert.match(source, /hashchange/);
  assert.match(source, /tabNavRef/);
  assert.match(source, /data-developer-tab=\{tab\.id\}/);
  assert.match(source, /activeButton\.offsetLeft/);
  assert.match(source, /tabNav\.scrollTo\(\{ left: targetLeft, behavior: 'smooth' \}\)/);
});

test('Developer Console avoids private field storage in the UI source', () => {
  assert.doesNotMatch(source, /rawAddress\s*:/);
  assert.doesNotMatch(source, /rawAgid\s*:/);
  assert.doesNotMatch(source, /rawAoid\s*:/);
  assert.doesNotMatch(source, /proofCode\s*:/);
  assert.doesNotMatch(source, /privateKey\s*:/);
  assert.doesNotMatch(source, /apiKey\s*:/);
  assert.doesNotMatch(source, /secret\s*:/);
});
