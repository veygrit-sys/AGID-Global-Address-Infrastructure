import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./FieldActionBar.tsx', import.meta.url), 'utf8');
const rootSource = readFileSync(new URL('../RootApp.tsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const designRulesSource = readFileSync(new URL('../design/agidDesignRules.ts', import.meta.url), 'utf8');
const compactBlockStart = source.indexOf('if (isCompactActionSurface)');
const compactBlockEnd = source.indexOf('aria-label="Field actions"', compactBlockStart);
const compactBlock = source.slice(compactBlockStart, compactBlockEnd);

test('FieldActionBar keeps one visible next action and field controls', () => {
  assert.match(source, /次にやること/);
  assert.match(source, /現在地からIDを確認/);
  assert.match(source, /QR/);
  assert.match(source, /現在地/);
  assert.match(source, /登録/);
  assert.match(source, /同期/);
  assert.match(source, /取消/);
});

test('map surface keeps only current location after add moves to the side menu', () => {
  assert.match(source, /if \(isCompactActionSurface\)/);
  assert.match(source, /aria-label="Map quick actions"/);
  assert.match(source, /fixed right-\[max\(12px,var\(--safe-area-right\)\)\] top-\[74px\]/);
  assert.doesNotMatch(compactBlock, /aria-label="追加する"/);
  assert.doesNotMatch(compactBlock, /title="住所を追加する"/);
  assert.doesNotMatch(compactBlock, /onClick=\{openAddressRegistration\}/);
  assert.match(compactBlock, /aria-label="現在地へ移動"/);
  assert.doesNotMatch(compactBlock, /aria-label="QR読み取り"/);
  assert.match(source, /h-11 w-11/);
  assert.match(source, /sticky top-0 bg-slate-50\/80/);
});

test('postal zone designer, portal, and POS use compact actions so working screens stay visible', () => {
  assert.match(source, /isCompactActionSurface = isMapSurface \|\| surface === 'postal-zones' \|\| surface === 'portal' \|\| surface === 'pos'/);
  assert.match(source, /if \(isCompactActionSurface\)/);
});

test('FieldActionBar uses short address-quality states', () => {
  assert.match(source, /Verified/);
  assert.match(source, /Partial/);
  assert.match(source, /Manual required/);
  assert.match(source, /manual-required/);
});

test('FieldActionBar centers safe address references instead of personal address payloads', () => {
  for (const safeRef of ['AGID', 'AOID', 'alias', 'commitment', 'receipt']) {
    assert.match(source, new RegExp(safeRef));
  }
  assert.doesNotMatch(source, /recipient/i);
  assert.doesNotMatch(source, /phone/i);
  assert.doesNotMatch(source, /private key/i);
});

test('RootApp mounts the common field action bar across route surfaces', () => {
  assert.match(rootSource, /FieldActionBar/);
  assert.match(rootSource, /routeSurface/);
  assert.match(rootSource, /routeDesignKey/);
  assert.match(rootSource, /shouldShowFieldActionBar/);
  assert.match(rootSource, /shouldShowAgidFieldActionBar/);
  assert.match(rootSource, /agid:navigation/);
  assert.match(designRulesSource, /AGID_ROUTE_ACTION_BAR_POLICY/);
  assert.match(designRulesSource, /map: 'compact-current-location'/);
  assert.match(designRulesSource, /'open-source': 'hidden'/);
});

test('open-source, research, and developer pages do not show the field next-action bar', () => {
  assert.doesNotMatch(source, /Docs または SDK を開く/);
  assert.doesNotMatch(source, /'open-source': \{/);
  assert.match(rootSource, /if \(route\.openSource\) return 'open-source'/);
  assert.match(designRulesSource, /developer: 'hidden'/);
  assert.match(designRulesSource, /research: 'hidden'/);
  assert.match(designRulesSource, /'open-source': 'hidden'/);
  assert.match(designRulesSource, /shouldShowAgidFieldActionBar/);
});

test('global QR and current-location actions are connected to the map app', () => {
  assert.match(source, /agid:open-qr-reader/);
  assert.match(source, /agid:open-address-registration/);
  assert.match(source, /agid:use-current-location/);
  assert.match(source, /agid:undo-request/);
  assert.match(appSource, /addEventListener\('agid:open-qr-reader'/);
  assert.match(appSource, /addEventListener\('agid:open-address-registration'/);
  assert.match(appSource, /addEventListener\('agid:use-current-location'/);
  assert.match(appSource, /addEventListener\('agid:undo-request'/);
  assert.match(appSource, /action !== 'qr' && action !== 'current-location' && action !== 'register-address'/);
});
