import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'AddressPortalScreen.tsx'), 'utf8');

test('Address Portal exposes consent, scope, revoke, deletion, and export controls', () => {
  assert.match(source, /consentStatus/);
  assert.match(source, /removeConnectionScope/);
  assert.match(source, /revokeConnection/);
  assert.match(source, /deleteConnection/);
  assert.match(source, /deleteAllLocalItems/);
  assert.match(source, /exportSafeList/);
  assert.match(source, /buildAddressPortalSafeExport/);
  assert.match(source, /buildAddressPortalActionReceipt/);
  assert.match(source, /buildAddressPortalPermissionTimeline/);
  assert.match(source, /narrowAddressPortalConnectionScopes/);
});

test('Address Portal now serves as Wallet My Page with action inbox and quick actions', () => {
  assert.match(source, /myPage: 'My Page'/);
  assert.match(source, /myPage: 'マイページ'/);
  assert.match(source, /myPageSubtitle/);
  assert.match(source, /actionInbox/);
  assert.match(source, /walletHealth/);
  assert.match(source, /quickActions/);
  assert.match(source, /pendingApprovals/);
  assert.match(source, /credentialAlerts/);
  assert.match(source, /credentialStatus/);
  assert.match(source, /securityReview/);
  assert.match(source, /openSettings/);
  assert.match(source, /window\.location\.href = '\/settings'/);
  assert.match(source, /<Settings className="h-4 w-4" \/>/);
  assert.match(source, /reviewPermissions/);
  assert.match(source, /myPageHealthItems/);
  assert.match(source, /quickActions\.map/);
  assert.match(source, /setHighRiskMode\(true\)/);
  assert.doesNotMatch(source, /addOrVerifyAddress/);
  assert.doesNotMatch(source, /showQrPass/);
  assert.doesNotMatch(source, /<h1[^>]*>Address Portal<\/h1>/);
});

test('Address Portal supports the Friends side-menu deep link without raw recipient data', () => {
  assert.match(source, /apc-friend-gift-alias/);
  assert.match(source, /Friend Gift Alias/);
  assert.match(source, /gift alias/);
  assert.match(source, /window\.location\.hash !== '#friends'/);
  assert.match(source, /setQuery\('recipient'\)/);
  assert.match(source, /friendsSectionRef/);
  assert.match(source, /friendConnections/);
  assert.match(source, /id="friends"/);
  assert.match(source, /scrollIntoView\(\{ block: 'start' \}\)/);
  assert.match(source, /participantType === 'shopping-agent'/);
  assert.match(source, /friendsSectionBody/);
  assert.match(source, /HeartHandshake className="h-5 w-5"/);
  assert.match(source, /Friends opened with recipient-safe refs only/);
});

test('Address Portal persists safe local refs without adding raw address fields', () => {
  assert.match(source, /PORTAL_CONNECTIONS_STORAGE_KEY/);
  assert.match(source, /readStoredConnections/);
  assert.match(source, /validateAddressPortalPayloadIsSafe\(connections\)/);
  assert.match(source, /localStorage\.setItem\(PORTAL_CONNECTIONS_STORAGE_KEY/);
  assert.doesNotMatch(source, /rawAddress\s*:/);
  assert.doesNotMatch(source, /rawAgid\s*:/);
  assert.doesNotMatch(source, /rawAoid\s*:/);
  assert.doesNotMatch(source, /phoneNumber\s*:/);
  assert.doesNotMatch(source, /recipientSecret\s*:/);
});

test('Address Portal makes high-risk and no-raw-address privacy posture visible', () => {
  assert.match(source, /highRiskMode/);
  assert.match(source, /No raw address/);
  assert.match(source, /実住所なし/);
  assert.match(source, /scopeReductionHint/);
  assert.match(source, /New scopes require a new Address Link consent/);
  assert.match(source, /再同意が必要/);
});

test('Address Portal includes a permission timeline with revoke actions per business', () => {
  assert.match(source, /permissionTimeline/);
  assert.match(source, /許可タイムライン/);
  assert.match(source, /timelineBody/);
  assert.match(source, /permissionTimeline\.slice\(0, 10\)\.map/);
  assert.match(source, /entry\.participantName/);
  assert.match(source, /entry\.scopes\.map/);
  assert.match(source, /entry\.canRevoke/);
  assert.match(source, /revokeFromTimeline/);
  assert.match(source, /revokeConnection\(connection\)/);
});

test('Address Portal shows Address Item list and connection safety without numeric user scores', () => {
  assert.match(source, /addressItems/);
  assert.match(source, /Address Item一覧/);
  assert.match(source, /addressItemId/);
  assert.match(source, /itemRoot/);
  assert.match(source, /connectionSafety/);
  assert.match(source, /buildConnectionSafety/);
  assert.match(source, /safetySignals/);
  assert.match(source, /safetySafe/);
  assert.match(source, /safetyCaution/);
  assert.match(source, /safetyUnsafe/);
  assert.doesNotMatch(source, /safetyScore/);
  assert.doesNotMatch(source, /confidenceScore/);
});

test('Address Portal adds professional collaboration reviews for cross-functional teams', () => {
  assert.match(source, /professionalCollaboration/);
  assert.match(source, /職種別連携/);
  assert.match(source, /buildProfessionReviews/);
  assert.match(source, /carrierOps/);
  assert.match(source, /frontDeskPos/);
  assert.match(source, /municipalAid/);
  assert.match(source, /securityLegal/);
  assert.match(source, /developerOps/);
  assert.match(source, /focusProfessionReview/);
  assert.match(source, /setQuery\(review\.focusQuery\)/);
  assert.match(source, /setFilter\(review\.focusFilter\)/);
  assert.doesNotMatch(source, /rawAddress\s*:/);
});

test('Address Portal uses a responsive height shell so the full screen remains reachable', () => {
  assert.match(source, /agid-viewport-shell flex flex-col/);
  assert.match(source, /shrink-0 border-b/);
  assert.match(source, /flex-nowrap items-center gap-2 overflow-x-auto/);
  assert.match(source, /grid min-h-0 w-full max-w-\[1480px\] flex-1/);
  assert.match(source, /overflow-y-auto px-3 py-3/);
  assert.match(source, /lg:grid-cols-\[300px_minmax\(0,1fr\)\]/);
  assert.match(source, /xl:grid-cols-\[300px_minmax\(0,1fr\)_390px\]/);
  assert.match(source, /xl:overflow-hidden/);
  assert.match(source, /min-h-0 space-y-4 xl:overflow-y-auto xl:pr-1/);
  assert.match(source, /min-h-0 space-y-4 lg:row-span-2 xl:row-span-1 xl:overflow-y-auto xl:px-1/);
  assert.match(source, /min-h-0 space-y-4 lg:col-span-1 lg:col-start-1 lg:row-start-2 xl:col-span-1/);
});

test('Address Portal raises the UI hierarchy with a compact command center and inspector', () => {
  assert.match(source, /commandCenter/);
  assert.match(source, /selectedConnection/);
  assert.match(source, /safeRefs/);
  assert.match(source, /safeToShare/);
  assert.match(source, /rounded-2xl border border-slate-200\/80 bg-white shadow-sm/);
  assert.match(source, /APP_LANGUAGES\.map\(language =>/);
  assert.match(source, /language\.flag/);
  assert.doesNotMatch(source, /rawAddress\s*:/);
});
