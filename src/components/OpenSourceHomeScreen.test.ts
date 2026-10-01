import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'OpenSourceHomeScreen.tsx'), 'utf8');
const mapSource = readFileSync(join(here, 'OpenSourceHeroMap.tsx'), 'utf8');
const heroPrimaryBlock = source.slice(
  source.indexOf('const heroPrimaryActions'),
  source.indexOf('const heroResourceLinks'),
);
const firstViewportBlock = source.slice(
  source.indexOf('<section className="bg-white">'),
  source.indexOf('<DeveloperStarterSection locale={heroLocale} />'),
);

test('Open Source hero keeps first-use navigation and uses the live vector grid map', () => {
  assert.match(source, /type HeroLocale = 'en' \| 'ja'/);
  assert.match(source, /const heroLocaleOptions/);
  assert.match(source, /const heroCopy/);
  assert.match(source, /const heroMenuLinks/);
  assert.match(source, /key: 'map', href: '\/'/);
  assert.match(source, /key: 'aoid', href: '\/\?action=aoid'/);
  assert.match(source, /Open-source tools for working with addresses/);
  assert.match(source, /country-aware address forms, postal-code search/);
  assert.match(source, /OpenSourceHeroMap locale=\{heroLocale\}/);
  assert.match(mapSource, /OPENFREEMAP_STYLES\.bright/);
  assert.match(mapSource, /useAgidGridLayer/);
  assert.match(mapSource, /new Worker\(new URL\('\.\.\/lib\/gridWorker\.ts'/);
  assert.match(mapSource, /fetchPhotonFeatures/);
  assert.match(mapSource, /decodeAGID\(query\)/);
  assert.match(mapSource, /Address, postal code, or AGID/);
  assert.match(mapSource, /住所・郵便番号・AGIDを検索/);
  assert.match(mapSource, /selectedResult\.id/);
  assert.match(mapSource, /navigator\.clipboard\.writeText\(selectedResult\.id\)/);
  assert.match(mapSource, /map\.on\('move'/);
  assert.match(mapSource, /gridUpdateRef\.current\?\.\([\s\S]*?false,/);
  assert.doesNotMatch(source, /AGID-SO-00123|TO-ISL-004|AGID-VT-00041/);
  assert.doesNotMatch(firstViewportBlock, /private Address Owner IDs|machine-readable delivery handoff|Scan destination QR, decide, hand off/);
  assert.doesNotMatch(source, /label: 'My Page'/);
  assert.doesNotMatch(source, /label: 'マイページ'/);
  assert.doesNotMatch(source, /label: 'Address Portal'/);
  assert.doesNotMatch(source, /label: '住所ポータル'/);
  assert.match(source, /heroMenuLinks\.map/);
  assert.match(source, /hero\.menu\[link\.key\]/);
  assert.doesNotMatch(source, /HeroPinnedAppsRail/);
  assert.doesNotMatch(source, /label: 'Data', href: '\/postal-zones'/);
  assert.doesNotMatch(source, /Start developing/);
});

test('Open Source hero primary CTAs are role based and limited to three', () => {
  assert.match(source, /const heroPrimaryActions/);
  assert.match(heroPrimaryBlock, /key: 'useAgid', href: '\/'/);
  assert.match(heroPrimaryBlock, /key: 'buildWithAgid', href: '\/developer'/);
  assert.match(heroPrimaryBlock, /key: 'readResearch', href: '\/research'/);
  assert.match(source, /useAgid: 'Open Map'/);
  assert.match(source, /buildWithAgid: 'Developer Tools'/);
  assert.match(source, /readResearch: 'Research Notes'/);
  assert.match(source, /useAgid: '地図を開く'/);
  assert.match(source, /buildWithAgid: '開発ツール'/);
  assert.match(source, /readResearch: '研究ノート'/);
  assert.doesNotMatch(heroPrimaryBlock, /downloadSdk/);
  assert.doesNotMatch(heroPrimaryBlock, /GITHUB_REPO_URL/);
});

test('Open Source first viewport renders navigation, a full-width map, then the dark information band', () => {
  assert.match(firstViewportBlock, /<OpenSourceHeroMap locale=\{heroLocale\} \/>/);
  assert.match(firstViewportBlock, /\{hero\.h1\}/);
  assert.match(firstViewportBlock, /\{hero\.lead\}/);
  assert.match(firstViewportBlock, /bg-slate-950 px-5 py-9 text-white/);
  assert.match(firstViewportBlock, /hero\.primaryActions\.useAgid/);
  assert.doesNotMatch(firstViewportBlock, /HeroGlobalVisual/);
  assert.doesNotMatch(firstViewportBlock, /HeroEntryCardGrid/);
  assert.doesNotMatch(firstViewportBlock, /agid-oss-hero-map\.png/);
  assert.doesNotMatch(firstViewportBlock, /hero\.trustItems\.map/);
  assert.doesNotMatch(firstViewportBlock, /HeroWorkspaceLaneGrid/);
  assert.doesNotMatch(firstViewportBlock, /developerInstallCommand/);
  assert.doesNotMatch(firstViewportBlock, /Protocol research/);
});

test('Open Source lower sections keep repository setup, local-first, and download links', () => {
  assert.match(source, /function DeveloperStarterSection\(\{ locale \}: \{ locale: HeroLocale \}\)/);
  assert.match(source, /DOWNLOAD_SDK_PACK_HREF/);
  assert.match(source, /key: 'downloadSdk', href: DOWNLOAD_SDK_PACK_HREF/);
  assert.match(source, /download=\{downloadName\}/);
  assert.match(source, /A local-first address workspace/);
  assert.match(source, /Saved addresses remain on this device/);
  assert.match(source, /Run and inspect the repository/);
  assert.match(source, /developerInstallCommand = 'npm install'/);
  assert.match(source, /npm run dev/);
  assert.match(source, /npm run lint/);
  assert.match(source, /npm run verify:app-shell/);
  assert.doesNotMatch(source, /npm install @agid\/sdk/);
  assert.doesNotMatch(source, /resolveAGID\(\)/);
  assert.match(source, /Spec/);
  assert.match(source, /Conformance Tests/);
  assert.match(source, /function AddressOpenSourceStackSection/);
  assert.match(source, /OPEN_SOURCE_ADDRESS_STACK\.map/);
  assert.match(source, /Address OSS stack/);
  assert.match(source, /住所OSSスタック/);
  assert.match(source, /import \{ OPEN_SOURCE_ADDRESS_STACK \} from '\.\.\/lib\/openSourceAddressStack'/);
});

test('Open Source hero exposes a bounded, retryable map loading state', () => {
  assert.match(mapSource, /const MAP_LOAD_TIMEOUT_MS = 15_000/);
  assert.match(mapSource, /aria-busy=\{!isMapReady\}/);
  assert.match(mapSource, /data-map-status=\{loadFailed \? 'failed' : isMapReady \? 'ready' : 'loading'\}/);
  assert.match(mapSource, /setLoadAttempt\(attempt => attempt \+ 1\)/);
  assert.match(mapSource, /地図データとAGID Gridを読み込んでいます/);
  assert.match(mapSource, /disabled=\{!isMapReady \|\| isSearching/);
});

test('Open Source hero switches English and Japanese copy across the page', () => {
  assert.match(source, /useState<HeroLocale>\('en'\)/);
  assert.match(source, /setHeroLocale/);
  assert.match(source, /aria-pressed=\{locale === option\.value\}/);
  assert.match(source, /languageToggleLabel: 'Hero language'/);
  assert.match(source, /languageToggleLabel: 'ヒーローの表示言語'/);
  assert.match(source, /h1: 'Open-source tools for working with addresses'/);
  assert.match(source, /h1: '住所を扱うためのオープンソースツール'/);
  assert.match(source, /label: 'Repository-backed features'/);
  assert.match(source, /label: 'リポジトリで確認できる機能'/);
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
  assert.match(source, /The application code is MIT-licensed/);
  assert.match(source, /アプリ本体はMITライセンス/);
  assert.match(source, /hero\.primaryActions\.useAgid/);
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
  assert.match(source, /git clone https:\/\/github\.com\/veygrit-sys\/AGID-Global-Address-Infrastructure\.git/);
  assert.match(source, /code AGID-Global-Address-Infrastructure/);
  assert.match(source, /npm run dev/);
  assert.match(source, /npm run improve:loop/);
  assert.match(source, /npm run verify:developer-console/);
  assert.match(source, /npm run verify:app-shell/);
  assert.match(source, /npm run verify:no-raw-address-kit/);
  assert.match(source, /npm run build/);
  assert.doesNotMatch(source, /copy\.badges\.map/);
  assert.doesNotMatch(source, /Local-only first/);
});

test('Open Source footer keeps core tools and removes duplicate demo navigation', () => {
  assert.match(source, /const footerMenuGroups/);
  assert.match(source, /apps: 'Available tools'/);
  assert.match(source, /developers: 'Build & source'/);
  assert.match(source, /settings: 'Settings'/);
  assert.match(source, /apps: '利用できるツール'/);
  assert.match(source, /developers: '開発・ソース'/);
  assert.match(source, /settings: '設定'/);
  assert.match(source, /key: 'aoid', href: '\/\?action=aoid'/);
  assert.doesNotMatch(source, /href: '\/pos'/);
  assert.doesNotMatch(source, /key: 'hotel', href: '\/hotel'/);
  assert.doesNotMatch(source, /key: 'opera', href: '\/opera'/);
  assert.doesNotMatch(source, /key: 'field', href: '\/field'/);
  assert.doesNotMatch(source, /key: 'locker', href: '\/locker'/);
  assert.doesNotMatch(source, /key: 'drone', href: '\/ops'/);
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
  assert.doesNotMatch(source, /key: 'help', href: '\/settings#help'/);
  assert.doesNotMatch(source, /key: 'security', href: '\/settings#security'/);
  assert.match(source, /<footer className=/);
  assert.match(source, /aria-label=\{hero\.footer\.navigationLabel\}/);
  assert.match(source, /footerMenuGroups\.map/);
});

test('Open Source page omits protocol-research and POS descriptions', () => {
  assert.doesNotMatch(source, /Protocol research|プロトコル研究/);
  assert.doesNotMatch(source, /ProtocolResearchSection/);
  assert.doesNotMatch(source, /POS/);
  assert.doesNotMatch(source, /href: '\/pos'/);
});
