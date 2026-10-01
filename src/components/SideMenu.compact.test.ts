import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'SideMenu.tsx'), 'utf8');
const appSource = readFileSync(join(here, '..', 'App.tsx'), 'utf8');

test('side menu acts as an integrated app switcher with stable controls', () => {
  assert.match(source, /top-0 left-0 bottom-0 w-72 max-w-\[86vw\]/);
  assert.match(source, /h-8 w-auto max-w-\[88px\]/);
  assert.match(source, /Open Address Grid/);
  assert.match(source, />AGID</);
  assert.match(source, /getAgidAppSurfaces\(\)/);
  assert.doesNotMatch(source, /getSideMenuPrimaryAppSurfaces/);
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
  assert.match(source, /保存・訂正。住所をこの端末に保存または訂正します。/);
  assert.match(source, /この端末だけで住所を管理/);
  assert.match(source, /利用する/);
  assert.match(source, /オープンソース/);
  assert.match(source, /<details className="group">/);
  assert.match(source, /<summary className=/);
  assert.match(source, /group-open:rotate-180/);
  assert.match(source, /open-source-home/);
  assert.match(source, /AGID-Global-Address-Infrastructure/);
  assert.match(source, /ソースコード/);
  assert.match(source, /改善に参加/);
  assert.match(source, /ライセンスと出典/);
  assert.match(source, /openLicenses\(\)/);
  assert.match(appSource, /openLicenses=\{\(\) => \{ window\.location\.href = '\/licenses'; \}\}/);
  assert.doesNotMatch(appSource, /showLicenses/);
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
  assert.doesNotMatch(source, /primaryAppSurfaces/);
  assert.doesNotMatch(source, /利用可/);
  assert.doesNotMatch(source, />Ready</);
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

test('side menu uses a flat edge and unboxed navigation rows', () => {
  assert.doesNotMatch(source, /md:rounded-r-\[1\.5rem\]/);
  assert.doesNotMatch(source, /items-center gap-2\.5 rounded-xl border/);
  assert.doesNotMatch(source, /items-center justify-center rounded-lg border/);
  assert.match(source, /items-center gap-2\.5 px-3 py-2 text-left transition-colors/);
  assert.doesNotMatch(source, /rounded-xl border/);
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
