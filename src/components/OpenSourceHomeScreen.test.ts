import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'OpenSourceHomeScreen.tsx'), 'utf8');
const heroPrimaryBlock = source.slice(
  source.indexOf('const heroPrimaryActions'),
  source.indexOf('const heroResourceLinks'),
);
const firstViewportBlock = source.slice(
  source.indexOf('<section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_62%,#eef6ff_100%)]">'),
  source.indexOf('<DeveloperStarterSection locale={heroLocale} />'),
);

test('Open Source hero keeps first-use navigation in the header and three hero cards', () => {
  assert.match(source, /type HeroLocale = 'en' \| 'ja'/);
  assert.match(source, /const heroLocaleOptions/);
  assert.match(source, /const heroCopy/);
  assert.match(source, /const heroMenuLinks/);
  assert.match(source, /const heroEntryLinks/);
  assert.match(source, /function HeroEntryCardGrid/);
  assert.match(source, /key: 'map', href: '\/'/);
  assert.match(source, /key: 'aoid', href: '\/\?action=aoid'/);
  assert.match(source, /key: 'posField', href: '\/pos'/);
  assert.match(source, /A Global Address ID for Every Place/);
  assert.match(source, /Open infrastructure for address IDs, private address QR, and machine-readable delivery handoff/);
  assert.match(source, /Global address layer/);
  assert.match(source, /AGID-SO-00123/);
  assert.match(source, /TO-ISL-004/);
  assert.match(source, /label: 'Register Address'/);
  assert.match(source, /label: 'AOID'/);
  assert.match(source, /private Address Owner IDs/);
  assert.match(source, /非公開のAddress Owner ID/);
  assert.doesNotMatch(source, /label: 'My Page'/);
  assert.doesNotMatch(source, /label: 'マイページ'/);
  assert.doesNotMatch(source, /label: 'Address Portal'/);
  assert.doesNotMatch(source, /label: '住所ポータル'/);
  assert.match(source, /label: 'POS & Field Ops'/);
  assert.match(source, /Scan destination QR, decide, hand off/);
  assert.match(source, /heroMenuLinks\.map/);
  assert.match(source, /heroEntryLinks\.map/);
  assert.match(source, /hero\.menu\[link\.key\]/);
  assert.match(source, /hero\.entryCards\[link\.key\]/);
  assert.doesNotMatch(source, /HeroPinnedAppsRail/);
  assert.doesNotMatch(source, /label: 'Data', href: '\/postal-zones'/);
  assert.doesNotMatch(source, /Start developing/);
});

test('Open Source hero primary CTAs are role based and limited to three', () => {
  assert.match(source, /const heroPrimaryActions/);
  assert.match(heroPrimaryBlock, /key: 'useAgid', href: '\/'/);
  assert.match(heroPrimaryBlock, /key: 'buildWithAgid', href: '\/developer'/);
  assert.match(heroPrimaryBlock, /key: 'readResearch', href: '\/research'/);
  assert.match(source, /useAgid: 'Use AGID'/);
  assert.match(source, /buildWithAgid: 'Build with AGID'/);
  assert.match(source, /readResearch: 'Read Research'/);
  assert.match(source, /useAgid: 'AGIDを使う'/);
  assert.match(source, /buildWithAgid: 'AGIDで開発'/);
  assert.match(source, /readResearch: '研究を読む'/);
  assert.doesNotMatch(heroPrimaryBlock, /downloadSdk/);
  assert.doesNotMatch(heroPrimaryBlock, /GITHUB_REPO_URL/);
});

test('Open Source first viewport is compressed to H1, definition, CTAs, and three cards', () => {
  assert.match(source, /HeroEntryCardGrid locale=\{heroLocale\} className="relative z-10 mx-auto grid w-full max-w-7xl gap-4 px-5 pb-16 sm:px-8 md:grid-cols-3"/);
  assert.match(firstViewportBlock, /\{hero\.h1\}/);
  assert.match(firstViewportBlock, /\{hero\.lead\}/);
  assert.match(firstViewportBlock, /heroPrimaryActions\.map/);
  assert.match(firstViewportBlock, /HeroGlobalVisual/);
  assert.match(firstViewportBlock, /HeroEntryCardGrid/);
  assert.doesNotMatch(firstViewportBlock, /hero\.trustItems\.map/);
  assert.doesNotMatch(firstViewportBlock, /HeroWorkspaceLaneGrid/);
  assert.doesNotMatch(firstViewportBlock, /developerInstallCommand/);
  assert.doesNotMatch(firstViewportBlock, /Protocol research/);
});

test('Open Source lower sections keep SDK, local-first, research, and setup links', () => {
  assert.match(source, /function DeveloperStarterSection\(\{ locale \}: \{ locale: HeroLocale \}\)/);
  assert.match(source, /function ProtocolResearchSection\(\{ locale \}: \{ locale: HeroLocale \}\)/);
  assert.match(source, /DOWNLOAD_SDK_PACK_HREF/);
  assert.match(source, /key: 'downloadSdk', href: DOWNLOAD_SDK_PACK_HREF/);
  assert.match(source, /download=\{downloadName\}/);
  assert.match(source, /Local-first address infrastructure/);
  assert.match(source, /No raw address by default/);
  assert.match(source, /Start with the SDK/);
  assert.match(source, /npm install @agid\/sdk/);
  assert.match(source, /resolveAGID\(\)/);
  assert.match(source, /createSecureAddressQR\(\)/);
  assert.match(source, /verifyMachineEnvelope\(\)/);
  assert.match(source, /Spec/);
  assert.match(source, /Conformance Tests/);
  assert.match(source, /Protocol research/);
  assert.match(source, /Address Mapping Theory/);
  assert.match(source, /Zero-Knowledge Address Predicates/);
});

test('Open Source hero switches English and Japanese copy across the page', () => {
  assert.match(source, /useState<HeroLocale>\('en'\)/);
  assert.match(source, /setHeroLocale/);
  assert.match(source, /aria-pressed=\{locale === option\.value\}/);
  assert.match(source, /languageToggleLabel: 'Hero language'/);
  assert.match(source, /languageToggleLabel: 'ヒーローの表示言語'/);
  assert.match(source, /h1: 'A Global Address ID for Every Place'/);
  assert.match(source, /h1: 'すべての場所に使えるグローバル住所ID'/);
  assert.match(source, /label: 'Global address layer'/);
  assert.match(source, /label: 'グローバル住所レイヤー'/);
  assert.match(source, /Download & setup/);
  assert.match(source, /ダウンロードと設定/);
  assert.match(source, /Download SDK pack/);
  assert.match(source, /SDKパックをダウンロード/);
  assert.match(source, /Download spec & conformance/);
  assert.match(source, /仕様・適合パックをダウンロード/);
  assert.match(source, /Download source from GitHub/);
  assert.match(source, /GitHubからソースをダウンロード/);
  assert.match(source, /Checksums manifest/);
  assert.match(source, /チェックサムmanifest/);
  assert.match(source, /Open agid-downloads\.json/);
  assert.match(source, /agid-downloads\.jsonを開く/);
  assert.match(source, /Build from the protocol outward/);
  assert.match(source, /プロトコルから順に開発する/);
  assert.match(source, /MIT licensed core/);
  assert.match(source, /MITライセンスの中核/);
  assert.match(source, /hero\.primaryActions\[action\.key\]/);
  assert.match(source, /hero\.resources\[link\.key\]/);
  assert.match(source, /hero\.build\.workstreams\[item\.key\]/);
  assert.match(source, /xl:grid-cols-4/);
  assert.match(source, /hero\.footer\.links\[link\.key\]/);
  assert.doesNotMatch(source, /playlistCommerce/);
  assert.doesNotMatch(source, /Playlist Commerce/);
  assert.doesNotMatch(source, /プレイリストコマース/);
});

test('Open Source download setup covers PC, VS Code, and command-line setup without extra badges', () => {
  assert.match(source, /const downloadSetupModes/);
  assert.match(source, /const downloadSetupLinks/);
  assert.match(source, /function DownloadSetupSection\(\{ locale \}: \{ locale: HeroLocale \}\)/);
  assert.match(source, /id="download-setup"/);
  assert.match(source, /Set up AGID from a PC, VS Code, or command line/);
  assert.match(source, /PC、VS Code、コマンドラインからAGIDをセットアップ/);
  assert.match(source, /const DOWNLOAD_SDK_PACK_FILE = 'agid-sdk-pack\.zip'/);
  assert.match(source, /const DOWNLOAD_SPEC_PACK_FILE = 'agid-spec-conformance\.zip'/);
  assert.match(source, /const DOWNLOAD_MANIFEST_FILE = 'agid-downloads\.json'/);
  assert.match(source, /const GITHUB_SOURCE_ARCHIVE_URL = `\$\{GITHUB_REPO_URL\}\/archive\/refs\/heads\/main\.zip`/);
  assert.match(source, /href: DOWNLOAD_SDK_PACK_HREF/);
  assert.match(source, /href: DOWNLOAD_SPEC_PACK_HREF/);
  assert.match(source, /href: GITHUB_SOURCE_ARCHIVE_URL/);
  assert.match(source, /href=\{DOWNLOAD_MANIFEST_HREF\}/);
  assert.match(source, /copy\.manifest\.label/);
  assert.match(source, /copy\.manifest\.text/);
  assert.match(source, /download=\{fileName\}/);
  assert.match(source, /target=\{isExternal \? '_blank' : undefined\}/);
  assert.match(source, /PC setup/);
  assert.match(source, /VS Code setup/);
  assert.match(source, /Command setup/);
  assert.match(source, /git clone https:\/\/github\.com\/dawnportinfo-design\/Adreess-Grid-ID\.git/);
  assert.match(source, /code Adreess-Grid-ID/);
  assert.match(source, /npm run dev/);
  assert.match(source, /npm run improve:loop/);
  assert.match(source, /npm run verify:developer-console/);
  assert.match(source, /npm run verify:app-shell/);
  assert.match(source, /npm run verify:no-raw-address-kit/);
  assert.match(source, /npm run build/);
  assert.doesNotMatch(source, /copy\.badges\.map/);
  assert.doesNotMatch(source, /Local-only first/);
});

test('Open Source footer groups the full product map by job intent', () => {
  assert.match(source, /const footerMenuGroups/);
  assert.match(source, /apps: 'All apps'/);
  assert.match(source, /developers: 'Developers'/);
  assert.match(source, /settings: 'Settings & Help'/);
  assert.match(source, /apps: 'アプリ一覧'/);
  assert.match(source, /developers: '開発者'/);
  assert.match(source, /settings: '設定とヘルプ'/);
  assert.match(source, /key: 'aoid', href: '\/\?action=aoid'/);
  assert.match(source, /key: 'pos', href: '\/pos'/);
  assert.match(source, /key: 'hotel', href: '\/hotel'/);
  assert.match(source, /key: 'opera', href: '\/opera'/);
  assert.match(source, /key: 'field', href: '\/field'/);
  assert.match(source, /key: 'locker', href: '\/locker'/);
  assert.match(source, /key: 'drone', href: '\/ops'/);
  assert.match(source, /key: 'dashboard', href: '\/dashboard'/);
  assert.doesNotMatch(source, /key: 'playlistCommerce', href: '\/playlist-commerce'/);
  assert.doesNotMatch(source, /playlistCommerce: 'Playlist Commerce'/);
  assert.doesNotMatch(source, /playlistCommerce: 'プレイリストコマース'/);
  assert.match(source, /key: 'developer', href: '\/developer'/);
  assert.match(source, /key: 'sdk', href: '\/developer#sdk'/);
  assert.match(source, /key: 'github', href: GITHUB_REPO_URL/);
  assert.match(source, /key: 'research', href: '\/research'/);
  assert.match(source, /key: 'postalZones', href: '\/postal-zones'/);
  assert.match(source, /key: 'evidence', href: '\/evidence'/);
  assert.match(source, /key: 'settings', href: '\/settings'/);
  assert.match(source, /key: 'help', href: '\/settings#help'/);
  assert.match(source, /key: 'security', href: '\/settings#security'/);
  assert.match(source, /<footer className=/);
  assert.match(source, /aria-label="Open source footer menu"/);
  assert.match(source, /footerMenuGroups\.map/);
});
