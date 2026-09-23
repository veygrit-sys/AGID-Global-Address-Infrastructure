import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'index.css'), 'utf8');
const designRules = readFileSync(join(here, '..', 'design', 'agidDesignRules.ts'), 'utf8');
const designRulesDocPath = join(here, '..', '..', 'docs', 'product', 'design-rules.md');

const readComponent = (fileName: string) => readFileSync(join(here, fileName), 'utf8');

test('shared AGID design shell keeps full-page app surfaces scrollable inside the map-locked body', () => {
  assert.match(css, /\.agid-page-scroll/);
  assert.match(css, /\.agid-fixed-page-scroll/);
  assert.match(css, /\.agid-viewport-shell/);
  assert.match(css, /scrollbar-gutter: stable/);
  assert.match(css, /padding-bottom: max\(24px, var\(--safe-area-bottom\)\)/);

  [
    'DeveloperConsoleScreen.tsx',
    'OpenSourceHomeScreen.tsx',
    'ResearchDesignHubScreen.tsx',
    'PostalZoneDesignerScreen.tsx',
    'AddressElementPlaygroundScreen.tsx',
  ].forEach(fileName => {
    assert.match(readComponent(fileName), /agid-page-scroll/, `${fileName} should use agid-page-scroll`);
  });
});

test('operation app surfaces use the same fixed-page scroll shell', () => {
  [
    'AddressDashboardScreen.tsx',
    'SettingsPolicyCenterScreen.tsx',
    'PosAppScreen.tsx',
    'MachineCommsScreen.tsx',
    'FieldHandoffAppScreen.tsx',
    'HotelCheckInScreen.tsx',
    'OracleOperaHotelAddressScreen.tsx',
    'OpenLockerPudoSimulatorScreen.tsx',
    'DroneLockerOpsScreen.tsx',
  ].forEach(fileName => {
    assert.match(readComponent(fileName), /agid-fixed-page-scroll/, `${fileName} should use agid-fixed-page-scroll`);
  });

  assert.match(readComponent('AddressPortalScreen.tsx'), /agid-viewport-shell/);
});

test('shared AGID design rules define action-bar and hero density policy', () => {
  assert.match(designRules, /AGID_ROUTE_ACTION_BAR_POLICY/);
  assert.match(designRules, /AGID_HERO_FIRST_VIEWPORT_CONTRACT/);
  assert.match(designRules, /AGID_FIRST_VIEWPORT_PERFORMANCE_CONTRACT/);
  assert.match(designRules, /AGID_WORKFLOW_ACTION_VISIBILITY_CONTRACT/);
  assert.match(designRules, /developer: 'hidden'/);
  assert.match(designRules, /research: 'hidden'/);
  assert.match(designRules, /'open-source': 'hidden'/);
  assert.match(designRules, /maxHeroPrimaryActions: 3/);
  assert.match(designRules, /maxHeroEntryCards: 3/);
  assert.match(designRules, /maxUppercaseLabelsPerSection: 1/);
  assert.match(designRules, /requiredElements: \['h1', 'one-sentence-definition', 'role-ctas', 'three-entry-cards'\]/);
  assert.match(designRules, /moveBelowFirstViewport/);
  assert.match(designRules, /'download-setup'/);
  assert.match(designRules, /'sdk-install-panel'/);
  assert.match(designRules, /'research-detail'/);
  assert.match(designRules, /disallowedAboveFold/);
  assert.match(designRules, /'next-action-bar'/);
  assert.match(designRules, /'developer-install-command'/);
  assert.match(designRules, /maxPrimaryBitmapAssets: 1/);
  assert.match(designRules, /preferStaticPreviewOverLiveMap: true/);
  assert.match(designRules, /'live-map-instance'/);
  assert.match(designRules, /'country-pack-download'/);
  assert.match(designRules, /'release-build-assets-gate'/);
  assert.match(designRules, /homeCompactActions: \['current-location'\]/);
  assert.match(designRules, /oneTapEntryActions: \['qr-scan', 'address-registration'\]/);
  assert.match(designRules, /fieldWorkflowActions: \['primary-decision', 'sync-queue', 'undo-last-action', 'receipt-status'\]/);
  assert.match(designRules, /qualityStates: \['verified', 'partial', 'manual-required'\]/);
  assert.match(designRules, /'private-address-text'/);
  assert.match(designRules, /'qr-payload'/);
  assert.match(designRules, /agid-page-scroll/);
  assert.ok(existsSync(designRulesDocPath), 'docs/product/design-rules.md should document design policy');
});
