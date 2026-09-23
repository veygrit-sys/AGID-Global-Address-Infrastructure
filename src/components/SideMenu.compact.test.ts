import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'SideMenu.tsx'), 'utf8');
const appSource = readFileSync(join(here, '..', 'App.tsx'), 'utf8');

test('side menu acts as an integrated app switcher with stable controls', () => {
  assert.match(source, /top-0 left-0 bottom-0 w-80 max-w-\[88vw\] md:w-\[22rem\]/);
  assert.match(source, /h-8 w-auto max-w-\[88px\]/);
  assert.match(source, /Open Address Grid/);
  assert.match(source, />AGID</);
  assert.match(source, /getAgidAppSurfaces\(\)/);
  assert.match(source, /getSideMenuPrimaryAppSurfaces\(getAgidAppSurfaces\(\)\)/);
  assert.match(source, /const openSavedLocations = \(tab: SavedTab\)/);
  assert.match(source, /setSavedTab\(tab\)/);
  assert.match(source, /openSavedLocations\('agid'\)/);
  assert.match(source, /Saved public location IDs/);
  assert.match(source, /保存した公開ロケーションID/);
  assert.match(source, /openSavedLocations\('aoid'\)/);
  assert.match(source, /setShowSaved\(true\)/);
  assert.match(source, /Private Address Owner IDs/);
  assert.match(source, /非公開のAddress Owner ID/);
  assert.match(source, /const openAddressRegistration/);
  assert.match(source, /onClick=\{openAddressRegistration\}/);
  assert.match(source, /追加する。住所を登録または修正します。/);
  assert.match(source, /住所を登録・修正/);
  assert.match(source, /メニュー/);
  assert.doesNotMatch(source, /getSideMenuStoreAppSurfaces/);
  assert.doesNotMatch(source, />Store</);
  assert.doesNotMatch(source, />Friends</);
  assert.doesNotMatch(source, />My Page</);
  assert.doesNotMatch(source, /getSideMenuSecondaryAppSurfaceGroups\(appSurfaces\)/);
  assert.doesNotMatch(source, /Local-first shell/);
  assert.doesNotMatch(source, /サイドメニューはホーム、友達、マイページだけ/);
  assert.doesNotMatch(source, /Settings opens from the gear in My Page/);
  assert.doesNotMatch(source, /showAllApps/);
  assert.doesNotMatch(source, /showTools/);
  assert.doesNotMatch(source, /More apps/);
  assert.doesNotMatch(source, /Tools & settings/);
  assert.doesNotMatch(source, /ツール・設定/);
  assert.doesNotMatch(source, /よく使うアプリ/);
  assert.doesNotMatch(source, /日常の個人・開発アプリ/);
  assert.doesNotMatch(source, /個人・現場・運用・開発・研究\/設計/);
  assert.doesNotMatch(source, /isStandaloneAppSurface\(surface\)/);
  assert.match(source, /surface\.action === 'open-address-registration'/);
  assert.match(source, /surface\.action === 'navigate' && surface\.route/);
  assert.match(source, /min-h-\[52px\]/);
  assert.match(source, /function MenuActionButton/);
  assert.match(source, /function AppSurfaceMenuButton/);
  assert.match(source, /primaryAppSurfaces\.map\(surface => \(/);
  assert.match(source, /text-\[10px\] font-black uppercase tracking-\[0\.2em\]/);
  assert.doesNotMatch(source, /personalTools\.map/);
  assert.doesNotMatch(source, /systemTools\.map/);
  assert.doesNotMatch(source, /primaryAppSurfaces\.map\(surface => renderSurfaceButton\(surface, 'secondary'\)\)/);
  assert.doesNotMatch(source, /w-72 md:w-56/);
  assert.doesNotMatch(source, /w-64 max-w-\[82vw\] md:w-52/);
  assert.doesNotMatch(source, /space-y-8/);
  assert.doesNotMatch(source, /Absolute Grid Identity/);
  assert.doesNotMatch(source, /Build 2\.4\.0/);
});

test('side menu receives only the state controls used by its current navigation surface', () => {
  assert.doesNotMatch(source, /setShowHistory/);
  assert.doesNotMatch(source, /setShowSettings/);
  assert.doesNotMatch(source, /setSettingsTab/);
  assert.doesNotMatch(source, /handleShare/);
  assert.doesNotMatch(source, /isSearchVisible/);
  assert.doesNotMatch(source, /setSearchVisible/);
  assert.doesNotMatch(source, /setAppLanguage/);
  assert.doesNotMatch(source, /t: \(key: any\)/);

  assert.doesNotMatch(appSource, /<SideMenu[\s\S]*?setShowHistory=\{setShowHistory\}/);
  assert.doesNotMatch(appSource, /<SideMenu[\s\S]*?setShowSettings=\{setShowSettings\}/);
  assert.doesNotMatch(appSource, /<SideMenu[\s\S]*?handleShare=\{handleShare\}/);
});

test('side menu code is loaded only when the drawer is open', () => {
  assert.match(appSource, /const SideMenu = React\.lazy/);
  assert.match(appSource, /showMenu && \(\s*<React\.Suspense fallback=\{null\}>/s);
  assert.doesNotMatch(appSource, /import \{ SideMenu \} from '\.\/components\/SideMenu'/);
});
