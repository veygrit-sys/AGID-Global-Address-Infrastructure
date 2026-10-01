import {
  ArrowRight,
  Beaker,
  BookOpen,
  Box,
  Code2,
  Download,
  Github,
  Map,
  Plus,
  Settings,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useState } from 'react';
import { OPEN_SOURCE_ADDRESS_STACK } from '../lib/openSourceAddressStack';
import { OpenSourceHeroMap } from './OpenSourceHeroMap';

const GITHUB_REPO_URL = 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure';
const GITHUB_SOURCE_ARCHIVE_URL = `${GITHUB_REPO_URL}/archive/refs/heads/main.zip`;
const DOWNLOAD_SDK_PACK_FILE = 'agid-sdk-pack.zip';
const DOWNLOAD_SPEC_PACK_FILE = 'agid-spec-conformance.zip';
const DOWNLOAD_MANIFEST_FILE = 'agid-downloads.json';
const DOWNLOAD_SDK_PACK_HREF = `/downloads/${DOWNLOAD_SDK_PACK_FILE}`;
const DOWNLOAD_SPEC_PACK_HREF = `/downloads/${DOWNLOAD_SPEC_PACK_FILE}`;
const DOWNLOAD_MANIFEST_HREF = `/downloads/${DOWNLOAD_MANIFEST_FILE}`;

type HeroLocale = 'en' | 'ja';

const heroLocaleOptions: { value: HeroLocale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ja', label: 'JA' },
];

const heroCopy = {
  en: {
    brandSubtitle: 'Open Address Grid',
    openMapAria: 'Open AGID map',
    repository: 'Repository',
    languageToggleLabel: 'Hero language',
    localFirstShell: {
      label: 'Local-first',
      title: 'A local-first address workspace.',
      text: 'Saved addresses remain on this device unless the user explicitly exports a QR or another file.',
    },
    menu: {
      map: 'Map',
      aoid: 'AOID',
      research: 'Research',
      developers: 'Developers',
    },
    h1: 'Open-source tools for working with addresses',
    lead: 'Explore the AGID map and grid, country-aware address forms, postal-code search, and local address and QR workflows implemented in this repository.',
    visual: {
      label: 'Repository-backed features',
      title: 'Country data and address tools in one app',
      text: 'The current build combines country address-format files, grid display, postal search, and local saved-address flows. Coverage quality depends on available open data.',
      ariaLabel: 'AGID country data visual',
      points: {
        japan: { code: 'JP', label: 'Japan format' },
        somalia: { code: 'SO', label: 'Somalia format' },
        tuvalu: { code: 'TV', label: 'Tuvalu format' },
      },
    },
    primaryActions: {
      useAgid: 'Open Map',
      buildWithAgid: 'Developer Tools',
      readResearch: 'Research Notes',
    },
    trustItems: [
      'Public source and tests',
      'Local address storage',
      'Country-format data',
      'Postal-code tools',
      'No blockchain required',
    ],
    entryCards: {
      address: {
        label: 'Save an address locally',
        text: 'Use country-specific fields and save the address on this device. Export a QR only when you choose to share it.',
      },
      map: {
        label: 'Explore the map and grid',
        text: 'Inspect the grid, search by postal code, and view AGID details using the location data available in the app.',
      },
      source: {
        label: 'Review source and tests',
        text: 'Check the implementation, data sources, licenses, and automated tests in the public GitHub repository.',
      },
    },
    workspaceLanes: {
      operations: {
        label: 'Review tools',
        text: 'Inspect local dashboards, audit views, registry screens, and readiness checks included in the repository.',
      },
      research: {
        label: 'Research & data',
        text: 'Browse protocol notes, postal-zone tools, evidence models, and source-backed country data.',
      },
    },
    sdk: {
      github: 'GitHub',
      title: 'Run and inspect the repository.',
      text: 'Install the repository dependencies, start the local app, and run the checks included in package.json. Downloadable SDK and conformance packs are available below.',
      install: 'Local setup',
    },
    resources: {
      setup: 'Setup Guide',
      downloadSdk: 'Download SDK',
      research: 'Research',
      spec: 'Spec',
      conformance: 'Conformance Tests',
      dashboard: 'Dashboard',
      postalZones: 'Postal Zones',
    },
    downloadSetup: {
      label: 'Download & setup',
      title: 'Set up AGID from a PC, VS Code, or command line.',
      text: 'Keep the first run local, verify the developer gates, and move from download to a working AGID workspace without sending production traffic or raw address data.',
      downloads: {
        sdk: {
          label: 'SDK pack',
          title: 'Download SDK pack',
          text: 'Generated AGID SDKs for language targets. Use this pack when you want the client libraries without cloning the full repository.',
          action: 'Download SDK pack',
        },
        spec: {
          label: 'Spec / conformance',
          title: 'Download spec & conformance',
          text: 'AGID spec, SDK targets, parity vectors, and resolver conformance fixtures for local compatibility checks.',
          action: 'Download spec pack',
        },
        source: {
          label: 'Source archive',
          title: 'Download source from GitHub',
          text: 'Full source stays on GitHub so the app bundle does not ship a heavy repository zip.',
          action: 'Download source',
        },
      },
      manifest: {
        label: 'Checksums manifest',
        text: 'Verify file size, SHA-256, generation time, and the no-raw-address exclusion policy before using a downloaded pack.',
        action: 'Open agid-downloads.json',
      },
      modes: {
        pc: {
          label: 'PC setup',
          title: 'Download and run locally',
          text: 'Use the GitHub repository as the source of truth, install Node.js LTS, then run AGID in local-only mode before any connector is configured.',
          action: 'Open GitHub',
        },
        vscode: {
          label: 'VS Code setup',
          title: 'Open the workspace for development',
          text: 'Open the repo folder, use the integrated terminal, and keep the developer gates visible while editing UI, SDK, and protocol files.',
          action: 'Open tutorial',
        },
        command: {
          label: 'Command setup',
          title: 'Use scripts for repeatable checks',
          text: 'Run the same commands from PowerShell, Terminal, CI, or a backend-only environment without exposing raw address fixtures.',
          action: 'Open release gates',
        },
      },
    },
    build: {
      title: 'Build from the protocol outward.',
      text: 'The public stack keeps AGID generation, address rendering, SDK parity, security checks, and country data reviewable.',
      workstreams: {
        resolver: {
          title: 'Resolver',
          text: 'AGID decode, grid conformance, local address rendering.',
        },
        element: {
          title: 'Address Element',
          text: 'Embeddable registration UI with country rules and language tabs.',
        },
        security: {
          title: 'Security Gates',
          text: 'No raw address release checks, dependency audit, secret scan.',
        },
        packs: {
          title: 'Country Packs',
          text: 'Address formats, postal metadata, source checks, and lazy-loaded region data.',
        },
      },
    },
    footer: {
      description: 'The application code is MIT-licensed. Individual data sources keep their own licenses. Demo and research screens are not production services.',
      subtext: 'Use the map and local tools, inspect the source, or review the project information.',
      navigationLabel: 'Open-source page links',
      groups: {
        apps: 'Available tools',
        developers: 'Build & source',
        research: 'Data & research',
        settings: 'Settings',
      },
      links: {
        aoid: 'AOID (local)',
        hotel: 'Hotel demo',
        opera: 'OPERA demo',
        field: 'Field demo',
        locker: 'Locker demo',
        drone: 'Drone demo',
        dashboard: 'Review dashboard',
        developer: 'Developer tools',
        sdk: 'SDK & downloads',
        github: 'GitHub',
        research: 'Research notes',
        postalZones: 'Postal-zone tools',
        evidence: 'Evidence models',
        settings: 'App settings',
      },
    },
  },
  ja: {
    brandSubtitle: 'オープン住所グリッド',
    openMapAria: 'AGIDマップを開く',
    repository: 'リポジトリ',
    languageToggleLabel: 'ヒーローの表示言語',
    localFirstShell: {
      label: 'ローカルファースト',
      title: 'ローカルファーストの住所ワークスペース。',
      text: '保存した住所は、利用者がQRやファイルとして明示的に出力しない限り、この端末内に残ります。',
    },
    menu: {
      map: '地図',
      aoid: 'AOID',
      research: '研究',
      developers: '開発',
    },
    h1: '住所を扱うためのオープンソースツール',
    lead: 'このリポジトリで実装されているAGIDの地図とグリッド、国別住所フォーム、郵便番号検索、端末内の住所保存とQR機能を試せます。',
    visual: {
      label: 'リポジトリで確認できる機能',
      title: '国別データと住所ツールを1つのアプリに',
      text: '現在のビルドには、国別住所形式データ、グリッド表示、郵便番号検索、端末内の保存住所機能が含まれます。対応品質は利用できるオープンデータに依存します。',
      ariaLabel: 'AGIDの国別データビジュアル',
      points: {
        japan: { code: 'JP', label: '日本の住所形式' },
        somalia: { code: 'SO', label: 'ソマリアの住所形式' },
        tuvalu: { code: 'TV', label: 'ツバルの住所形式' },
      },
    },
    primaryActions: {
      useAgid: '地図を開く',
      buildWithAgid: '開発ツール',
      readResearch: '研究ノート',
    },
    trustItems: [
      '公開ソースとテスト',
      '端末内の住所保存',
      '国別住所形式データ',
      '郵便番号ツール',
      'ブロックチェーン不要',
    ],
    entryCards: {
      address: {
        label: '住所を端末に保存',
        text: '国別の入力欄で住所を保存できます。共有するときだけ利用者がQRを書き出します。',
      },
      map: {
        label: '地図とグリッドを確認',
        text: 'グリッドを確認し、郵便番号で検索して、アプリで利用できる位置データからAGID詳細を表示します。',
      },
      source: {
        label: 'ソースとテストを確認',
        text: '公開GitHubリポジトリで、実装、データ出典、ライセンス、自動テストを確認できます。',
      },
    },
    workspaceLanes: {
      operations: {
        label: '確認ツール',
        text: 'リポジトリに含まれるローカルダッシュボード、監査表示、レジストリ画面、準備チェックを確認できます。',
      },
      research: {
        label: '研究・データ',
        text: 'プロトコルノート、郵便区画ツール、証跡モデル、出典付きの国別データを確認できます。',
      },
    },
    sdk: {
      github: 'GitHub',
      title: 'リポジトリを実行・確認する。',
      text: 'リポジトリの依存関係を入れ、ローカルアプリを起動し、package.jsonに含まれるチェックを実行できます。SDK・適合パックは下からダウンロードできます。',
      install: 'ローカル設定',
    },
    resources: {
      setup: '設定ガイド',
      downloadSdk: 'SDKをダウンロード',
      research: '研究',
      spec: '仕様',
      conformance: '適合テスト',
      dashboard: 'ダッシュボード',
      postalZones: '郵便区画',
    },
    downloadSetup: {
      label: 'ダウンロードと設定',
      title: 'PC、VS Code、コマンドラインからAGIDをセットアップ。',
      text: '最初の実行はローカルに限定し、開発者ゲートを確認してから、商用通信や生住所データを送らずにAGIDワークスペースを動かします。',
      downloads: {
        sdk: {
          label: 'SDKパック',
          title: 'SDKパックをダウンロード',
          text: '全言語ターゲットの生成済みAGID SDKです。リポジトリ全体をcloneせずにクライアントライブラリを確認できます。',
          action: 'SDKパックをダウンロード',
        },
        spec: {
          label: '仕様・適合',
          title: '仕様・適合パックをダウンロード',
          text: 'AGID仕様、SDKターゲット、parity vector、resolver適合fixtureをまとめたローカル互換チェック用パックです。',
          action: '仕様パックをダウンロード',
        },
        source: {
          label: 'ソースアーカイブ',
          title: 'GitHubからソースをダウンロード',
          text: '重い全ソースzipはアプリ本体に入れず、GitHub archiveを正として案内します。',
          action: 'ソースをダウンロード',
        },
      },
      manifest: {
        label: 'チェックサムmanifest',
        text: 'ダウンロードしたpackを使う前に、ファイルサイズ、SHA-256、生成時刻、生住所除外ポリシーを確認できます。',
        action: 'agid-downloads.jsonを開く',
      },
      modes: {
        pc: {
          label: 'PC設定',
          title: 'ダウンロードしてローカル実行',
          text: 'GitHubリポジトリを正とし、Node.js LTSを入れて、外部連携を設定する前にローカル限定モードでAGIDを動かします。',
          action: 'GitHubを開く',
        },
        vscode: {
          label: 'VS Code設定',
          title: '開発用ワークスペースを開く',
          text: 'リポジトリのフォルダを開き、統合ターミナルを使い、UI、SDK、プロトコルを編集しながら開発者ゲートを確認します。',
          action: 'チュートリアルを開く',
        },
        command: {
          label: 'コマンド設定',
          title: '再現できるチェックをスクリプトで実行',
          text: 'PowerShell、Terminal、CI、バックエンド専用環境から同じコマンドを実行し、生住所fixtureを公開しない状態を保ちます。',
          action: 'リリースゲートを開く',
        },
      },
    },
    build: {
      title: 'プロトコルから順に開発する。',
      text: '公開スタックでは、AGID生成、住所表示、SDK互換、セキュリティチェック、国別データをレビュー可能な形で扱います。',
      workstreams: {
        resolver: {
          title: 'リゾルバー',
          text: 'AGIDデコード、グリッド適合、ローカル住所表示。',
        },
        element: {
          title: '住所入力エレメント',
          text: '国別ルールと言語タブを持つ、埋め込み可能な住所登録UI。',
        },
        security: {
          title: 'セキュリティゲート',
          text: '生住所非公開リリースチェック、依存監査、シークレット検査。',
        },
        packs: {
          title: '国別パック',
          text: '住所形式、郵便メタデータ、ソース確認、遅延読み込みの地域データ。',
        },
      },
    },
    footer: {
      description: 'アプリ本体はMITライセンスです。各データには個別のライセンスが適用されます。デモ・研究画面は実運用サービスではありません。',
      subtext: '地図とローカル機能を使う、ソースを確認する、またはプロジェクト情報を確認できます。',
      navigationLabel: 'オープンソースページのリンク',
      groups: {
        apps: '利用できるツール',
        developers: '開発・ソース',
        research: 'データ・研究',
        settings: '設定',
      },
      links: {
        aoid: 'AOID（ローカル）',
        hotel: 'ホテルデモ',
        opera: 'OPERAデモ',
        field: '現場デモ',
        locker: 'ロッカーデモ',
        drone: 'ドローンデモ',
        dashboard: '確認ダッシュボード',
        developer: '開発ツール',
        sdk: 'SDK・ダウンロード',
        github: 'GitHub',
        research: '研究ノート',
        postalZones: '郵便区画ツール',
        evidence: '証跡モデル',
        settings: 'アプリ設定',
      },
    },
  },
} as const;

const developerInstallCommand = 'npm install';

const developerApiExamples = [
  'npm run dev',
  'npm run lint',
  'npm run verify:app-shell',
];

const heroPrimaryActions = [
  { key: 'useAgid', href: '/', icon: Map, variant: 'primary' },
  { key: 'buildWithAgid', href: '/developer', icon: Code2 },
  { key: 'readResearch', href: '/research', icon: Beaker },
] as const;

const heroVisualPoints = [
  { key: 'japan', className: 'left-[58%] top-[15%]' },
  { key: 'somalia', className: 'left-[14%] top-[52%]' },
  { key: 'tuvalu', className: 'left-[45%] bottom-[12%]' },
] as const;

const heroResourceLinks = [
  { key: 'setup', href: '#download-setup', icon: Download },
  { key: 'downloadSdk', href: DOWNLOAD_SDK_PACK_HREF, icon: Download, download: DOWNLOAD_SDK_PACK_FILE },
  { key: 'research', href: '/research', icon: Beaker },
  { key: 'spec', href: '/developer#spec', icon: BookOpen },
  { key: 'conformance', href: '/developer#vectors', icon: ShieldCheck },
  { key: 'dashboard', href: '/dashboard', icon: BookOpen },
  { key: 'postalZones', href: '/postal-zones', icon: Box },
] as const;

const heroMenuLinks = [
  { key: 'map', href: '/' },
  { key: 'aoid', href: '/?action=aoid' },
  { key: 'research', href: '/research' },
  { key: 'developers', href: '/developer' },
] as const;

const heroEntryLinks = [
  {
    key: 'address',
    href: '/?register=1',
    icon: ShieldCheck,
  },
  {
    key: 'map',
    href: '/',
    icon: Map,
  },
  {
    key: 'source',
    href: GITHUB_REPO_URL,
    icon: Github,
  },
] as const;

const heroWorkspaceLanes = [
  {
    key: 'operations',
    href: '/dashboard',
    icon: BookOpen,
  },
  {
    key: 'research',
    href: '/research',
    icon: Beaker,
  },
] as const;

const footerMenuGroups = [
  {
    key: 'apps',
    links: [
      { key: 'aoid', href: '/?action=aoid', icon: ShieldCheck },
      { key: 'dashboard', href: '/dashboard', icon: BookOpen },
    ],
  },
  {
    key: 'developers',
    links: [
      { key: 'developer', href: '/developer', icon: Code2 },
      { key: 'sdk', href: '/developer#sdk', icon: BookOpen },
      { key: 'github', href: GITHUB_REPO_URL, icon: Github },
    ],
  },
  {
    key: 'research',
    links: [
      { key: 'research', href: '/research', icon: Beaker },
      { key: 'postalZones', href: '/postal-zones', icon: Box },
      { key: 'evidence', href: '/evidence', icon: BookOpen },
    ],
  },
  {
    key: 'settings',
    links: [
      { key: 'settings', href: '/settings', icon: Settings },
    ],
  },
] as const;

const downloadSetupModes = [
  {
    key: 'pc',
    command: ['git clone https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure.git', 'cd AGID-Global-Address-Infrastructure', 'npm install', 'npm run dev'],
    href: GITHUB_REPO_URL,
    icon: Download,
  },
  {
    key: 'vscode',
    command: ['code AGID-Global-Address-Infrastructure', 'npm run verify:developer-console', 'npm run verify:app-shell', 'npm run lint'],
    href: '/developer#tutorial',
    icon: Code2,
  },
  {
    key: 'command',
    command: ['npm run improve:loop', 'npm run verify:no-raw-address-kit', 'npm run build'],
    href: '/developer#deploy',
    icon: Terminal,
  },
] as const;

const downloadSetupLinks = [
  {
    key: 'sdk',
    href: DOWNLOAD_SDK_PACK_HREF,
    fileName: DOWNLOAD_SDK_PACK_FILE,
    icon: Download,
  },
  {
    key: 'spec',
    href: DOWNLOAD_SPEC_PACK_HREF,
    fileName: DOWNLOAD_SPEC_PACK_FILE,
    icon: ShieldCheck,
  },
  {
    key: 'source',
    href: GITHUB_SOURCE_ARCHIVE_URL,
    icon: Github,
  },
] as const;

const workstreams = [
  {
    key: 'resolver',
    href: '/developer',
    icon: Code2,
  },
  {
    key: 'element',
    href: '/element',
    icon: Box,
  },
  {
    key: 'security',
    href: '/settings',
    icon: ShieldCheck,
  },
  {
    key: 'packs',
    href: '/postal-zones',
    icon: BookOpen,
  },
] as const;

function goTo(path: string) {
  window.location.href = path;
}

function HeroLanguageToggle({
  locale,
  onChange,
  label,
}: {
  locale: HeroLocale;
  onChange: (locale: HeroLocale) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm"
    >
      {heroLocaleOptions.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={locale === option.value}
          onClick={() => onChange(option.value)}
          className={
            locale === option.value
              ? 'h-8 rounded-full bg-slate-950 px-3 text-[11px] font-black text-white shadow-sm'
              : 'h-8 rounded-full px-3 text-[11px] font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-950'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function HeroEntryCardGrid({ className = '', locale }: { className?: string; locale: HeroLocale }) {
  const hero = heroCopy[locale];

  return (
    <div className={className}>
      {heroEntryLinks.map(link => {
        const Icon = link.icon;
        const copy = hero.entryCards[link.key];
        return (
          <a
            key={link.href}
            href={link.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/60"
          >
            <span className="flex items-center gap-3 text-[15px] font-black text-slate-950">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </span>
              {copy.label}
            </span>
            <span className="mt-4 block text-[13px] font-semibold leading-6 text-slate-600">
              {copy.text}
            </span>
          </a>
        );
      })}
    </div>
  );
}

function HeroWorkspaceLaneGrid({ className = '', locale }: { className?: string; locale: HeroLocale }) {
  const hero = heroCopy[locale];

  return (
    <nav className={className} aria-label="AGID workspace lanes">
      {heroWorkspaceLanes.map(link => {
        const Icon = link.icon;
        const copy = hero.workspaceLanes[link.key];
        return (
          <a
            key={link.key}
            href={link.href}
            className="group rounded-xl border border-cyan-100/12 bg-slate-950/30 p-4 shadow-lg shadow-black/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-100/30 hover:bg-cyan-100/[0.08]"
          >
            <span className="flex items-center gap-3 text-[13px] font-black text-cyan-50">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-100/12 bg-cyan-100/[0.08] text-cyan-100">
                <Icon className="h-4 w-4" />
              </span>
              {copy.label}
            </span>
            <span className="mt-3 block text-[12px] font-semibold leading-5 text-slate-300">
              {copy.text}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

function DownloadSetupSection({ locale }: { locale: HeroLocale }) {
  const copy = heroCopy[locale].downloadSetup;

  return (
    <section id="download-setup" className="bg-slate-50 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl border-t border-slate-200 pt-10">
        <div className="grid gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:items-start lg:gap-16">
          <div className="lg:sticky lg:top-8">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
              <Download className="h-4 w-4" />
              {copy.label}
            </div>
            <h2 className="mt-3 max-w-xl text-[30px] font-black leading-tight tracking-[-0.02em] text-slate-950 sm:text-[40px]">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-xl text-[14px] font-semibold leading-7 text-slate-600">
              {copy.text}
            </p>
          </div>

          <div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {downloadSetupLinks.map(link => {
                const Icon = link.icon;
                const linkCopy = copy.downloads[link.key];
                const fileName = 'fileName' in link ? link.fileName : undefined;
                const isExternal = link.key === 'source';
                return (
                  <a
                    key={link.key}
                    href={link.href}
                    download={fileName}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noreferrer' : undefined}
                    className="group grid gap-3 py-5 transition hover:bg-white sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-3"
                  >
                    <span className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-blue-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{linkCopy.label}</span>
                      <span className="mt-1 block text-[16px] font-black text-slate-950">{linkCopy.title}</span>
                      <span className="mt-1 block text-[12px] font-semibold leading-5 text-slate-600">{linkCopy.text}</span>
                    </span>
                    <span className="inline-flex min-h-10 items-center gap-2 text-[12px] font-black text-blue-700 transition group-hover:text-blue-900">
                      {linkCopy.action}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </a>
                );
              })}
            </div>

            <a
              href={DOWNLOAD_MANIFEST_HREF}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex flex-col gap-3 border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-black text-slate-950">{copy.manifest.label}</span>
                  <span className="mt-1 block text-[12px] font-semibold leading-5 text-slate-600">{copy.manifest.text}</span>
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 text-[12px] font-black text-emerald-700">
                {copy.manifest.action}
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>

            <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {downloadSetupModes.map(mode => {
              const Icon = mode.icon;
              const modeCopy = copy.modes[mode.key];
              return (
                <details
                  key={mode.key}
                  className="group bg-transparent open:bg-white"
                >
                  <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-3 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate-200 bg-white text-slate-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{modeCopy.label}</span>
                      <span className="mt-1 block text-[15px] font-black text-slate-950">{modeCopy.title}</span>
                    </span>
                    <Plus className="h-4 w-4 text-slate-500 transition group-open:rotate-45" />
                  </summary>
                  <div className="px-3 pb-5 sm:pl-[60px]">
                    <p className="max-w-2xl text-[12px] font-semibold leading-6 text-slate-600">{modeCopy.text}</p>
                    <div className="mt-3 space-y-1.5">
                    {mode.command.map(command => (
                      <code
                        key={command}
                        className="block overflow-x-auto bg-slate-950 px-3 py-2 text-[11px] font-bold text-emerald-200"
                      >
                        {command}
                      </code>
                    ))}
                    </div>
                    <a href={mode.href} className="mt-3 inline-flex min-h-10 items-center gap-2 text-[12px] font-black text-blue-700 hover:text-blue-900">
                      {modeCopy.action}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </details>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeveloperStarterSection({ locale }: { locale: HeroLocale }) {
  const hero = heroCopy[locale];

  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.56fr_0.44fr] lg:gap-16">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            {hero.localFirstShell.label}
          </div>
          <h2 className="mt-3 max-w-2xl text-[30px] font-black leading-tight tracking-[-0.02em] text-slate-950 sm:text-[42px]">
            {hero.localFirstShell.title}
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] font-semibold leading-7 text-slate-600">
            {hero.localFirstShell.text}
          </p>
          <ul className="mt-7 grid gap-x-8 gap-y-3 border-y border-slate-200 py-5 sm:grid-cols-2">
            {hero.trustItems.map(item => (
              <li key={item} className="flex items-center gap-3 text-[13px] font-bold text-slate-700">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
          <nav className="mt-7 divide-y divide-slate-200 border-y border-slate-200" aria-label="AGID workspace lanes">
            {heroWorkspaceLanes.map(link => {
              const Icon = link.icon;
              const copy = hero.workspaceLanes[link.key];
              return (
                <a key={link.key} href={link.href} className="group grid gap-2 py-4 sm:grid-cols-[auto_150px_1fr_auto] sm:items-center">
                  <Icon className="h-4 w-4 text-blue-700" />
                  <span className="text-[13px] font-black text-slate-950">{copy.label}</span>
                  <span className="text-[12px] font-semibold leading-5 text-slate-600">{copy.text}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
                </a>
              );
            })}
          </nav>
        </div>

        <section className="border-l border-slate-200 pl-0 lg:pl-10">
          <div className="flex items-center justify-between gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-950 text-white">
              <Code2 className="h-5 w-5" />
            </span>
            <a
              href={GITHUB_REPO_URL}
              className="inline-flex min-h-10 items-center gap-2 border-b border-slate-300 px-1 text-[12px] font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700"
            >
              <Github className="h-4 w-4" />
              {hero.sdk.github}
            </a>
          </div>
          <h2 className="mt-6 text-[28px] font-black leading-tight tracking-[-0.02em] text-slate-950 sm:text-[36px]">
            {hero.sdk.title}
          </h2>
          <p className="mt-4 text-[14px] font-semibold leading-7 text-slate-600">
            {hero.sdk.text}
          </p>
          <div className="mt-6 bg-slate-950 p-4 text-emerald-200">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              <Terminal className="h-3.5 w-3.5" />
              {hero.sdk.install}
            </div>
            <code className="block overflow-x-auto text-[13px] font-bold">{developerInstallCommand}</code>
            {developerApiExamples.map(example => (
              <code key={example} className="mt-2 block overflow-x-auto border-t border-white/10 pt-2 text-[12px] font-bold text-blue-100">
                {example}
              </code>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            {heroResourceLinks.filter(link => ['setup', 'research', 'spec'].includes(link.key)).map(link => {
              const Icon = link.icon;
              const downloadName = 'download' in link ? link.download : undefined;
              return (
                <a
                  key={link.key}
                  href={link.href}
                  download={downloadName}
                  className="inline-flex min-h-10 items-center gap-2 border-b border-slate-300 text-[12px] font-black text-slate-700 transition hover:border-blue-700 hover:text-blue-700"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {hero.resources[link.key]}
                </a>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}

const addressStackCopy = {
  en: {
    label: 'Address OSS stack',
    title: 'Use open components without blurring trust boundaries.',
    text: 'AGID now records the parser, search service, full geocoder, and address corpus separately so software licenses never imply permission to redistribute imported address data.',
    statuses: {
      integrated: 'Integrated',
      optional: 'Optional',
      'license-gated': 'License review',
    },
    roles: {
      'address-parsing': 'Local parsing',
      'search-autocomplete': 'Search & autocomplete',
      'full-geocoding': 'Self-hosted geocoding',
      'address-corpus': 'Address corpus',
    },
    details: 'Review adoption notes',
  },
  ja: {
    label: '住所OSSスタック',
    title: '信頼境界を混ぜずに、オープンな部品を使う。',
    text: 'パーサー、検索サービス、完全ジオコーダー、住所コーパスを分けて記録し、ソフトウェアのライセンスを住所データ再配布の許可と誤認しない構成にしました。',
    statuses: {
      integrated: '導入済み',
      optional: '任意追加',
      'license-gated': 'ライセンス確認',
    },
    roles: {
      'address-parsing': 'ローカル解析',
      'search-autocomplete': '検索・候補表示',
      'full-geocoding': '自己ホスト検索',
      'address-corpus': '住所コーパス',
    },
    details: '採用方針を確認',
  },
} as const;

function AddressOpenSourceStackSection({ locale }: { locale: HeroLocale }) {
  const copy = addressStackCopy[locale];

  return (
    <section className="bg-slate-50 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:items-start lg:gap-16">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              {copy.label}
            </div>
            <h2 className="mt-3 max-w-xl text-[28px] font-black leading-tight tracking-[-0.02em] text-slate-950 sm:text-[36px]">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-xl text-[14px] font-semibold leading-7 text-slate-600">
              {copy.text}
            </p>
            <a
              href="https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/main/docs/open-source-address-stack.md"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex min-h-10 items-center gap-2 border-b border-slate-300 text-[12px] font-black text-blue-700 transition hover:border-blue-700 hover:text-blue-900"
            >
              {copy.details}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {OPEN_SOURCE_ADDRESS_STACK.map(entry => (
              <a
                key={entry.id}
                href={entry.projectUrl}
                target="_blank"
                rel="noreferrer"
                className="grid gap-2 py-4 transition hover:bg-white sm:grid-cols-[0.8fr_1fr_auto] sm:items-center sm:px-3"
              >
                <span>
                  <span className="block text-[15px] font-black text-slate-950">{entry.name}</span>
                  <span className="mt-1 block text-[11px] font-bold text-slate-500">
                    {entry.softwareLicense}
                  </span>
                </span>
                <span className="text-[12px] font-semibold text-slate-600">
                  {copy.roles[entry.role]}
                </span>
                <span className={
                  entry.status === 'integrated'
                    ? 'text-[11px] font-black text-emerald-700'
                    : entry.status === 'optional'
                      ? 'text-[11px] font-black text-blue-700'
                      : 'text-[11px] font-black text-amber-700'
                }>
                  {copy.statuses[entry.status]}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroGlobalVisual({ locale }: { locale: HeroLocale }) {
  const hero = heroCopy[locale];

  return (
    <section
      aria-label={hero.visual.ariaLabel}
      className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl shadow-blue-950/10 sm:min-h-[430px]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(239,246,255,0.88),rgba(255,255,255,0.75)_42%,rgba(219,234,254,0.62))]" />
      <img
        src="/agid-oss-hero-map.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] rounded-[22px] object-cover opacity-80"
      />
      <div className="absolute inset-4 rounded-[22px] bg-[linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.22)_45%,rgba(255,255,255,0.84)_100%)]" />
      <div className="absolute inset-4 rounded-[22px] bg-[radial-gradient(circle_at_58%_40%,rgba(37,99,235,0.2),transparent_24%),radial-gradient(circle_at_22%_62%,rgba(14,165,233,0.18),transparent_20%)]" />

      <div className="relative z-10 max-w-[270px] rounded-2xl border border-slate-200 bg-white/92 p-4 shadow-lg shadow-slate-300/40 backdrop-blur">
        <p className="text-[12px] font-black text-blue-600">{hero.visual.label}</p>
        <h2 className="mt-2 text-[22px] font-black leading-tight text-slate-950">{hero.visual.title}</h2>
        <p className="mt-3 text-[13px] font-semibold leading-6 text-slate-600">{hero.visual.text}</p>
      </div>

      {heroVisualPoints.map(point => {
        const pointCopy = hero.visual.points[point.key];
        return (
          <div
            key={point.key}
            className={`absolute z-10 min-w-[128px] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-300/45 backdrop-blur ${point.className}`}
          >
            <span className="block text-[13px] font-black leading-5 text-slate-950">{pointCopy.code}</span>
            <span className="block text-[11px] font-bold text-slate-500">{pointCopy.label}</span>
          </div>
        );
      })}

      <div className="absolute bottom-6 right-6 z-10 rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-[12px] font-black text-blue-700 shadow-lg shadow-blue-200/45 backdrop-blur">
        Grid / Address forms / QR
      </div>
    </section>
  );
}

export function OpenSourceHomeScreen() {
  const [heroLocale, setHeroLocale] = useState<HeroLocale>('en');
  const hero = heroCopy[heroLocale];

  return (
    <main className="agid-page-scroll bg-white text-slate-950">
      <section className="bg-white">
        <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:py-6">
          <button
            type="button"
            onClick={() => goTo('/')}
            className="flex items-center gap-3 text-left"
            aria-label={hero.openMapAria}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm">
              <Map className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[18px] font-black leading-none text-slate-950">AGID</span>
              <span className="mt-1 block text-[11px] font-bold text-slate-500">{hero.brandSubtitle}</span>
            </span>
          </button>

          <nav className="hidden items-center gap-8 text-[13px] font-bold text-slate-600 md:flex">
            {heroMenuLinks.map(link => (
              <a key={link.href} className="transition hover:text-blue-600" href={link.href}>{hero.menu[link.key]}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <HeroLanguageToggle
              locale={heroLocale}
              onChange={setHeroLocale}
              label={hero.languageToggleLabel}
            />
            <a
              href={GITHUB_REPO_URL}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-[13px] font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">{hero.repository}</span>
            </a>
          </div>
        </header>

        <OpenSourceHeroMap locale={heroLocale} />

        <div className="bg-slate-950 px-5 py-9 text-white sm:px-8 sm:py-11">
          <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.05fr_1fr_0.9fr] lg:items-start lg:gap-0">
            <div className="lg:pr-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                {hero.brandSubtitle}
              </p>
              <h1 className="mt-4 max-w-xl text-[38px] font-black leading-[1.03] tracking-[-0.025em] text-white sm:text-[48px]">
                {hero.h1}
              </h1>
            </div>
            <div className="border-white/15 lg:border-x lg:px-10">
              <p className="max-w-xl text-[16px] font-semibold leading-7 text-slate-300">
                {hero.lead}
              </p>
            </div>
            <div className="lg:pl-10">
              <a
                href="/"
                className="inline-flex min-h-12 w-full items-center justify-between gap-3 bg-blue-600 px-5 text-[14px] font-black text-white transition hover:bg-blue-500 sm:w-auto sm:min-w-[220px]"
              >
                <span className="inline-flex items-center gap-3">
                  <Map className="h-5 w-5" />
                  {hero.primaryActions.useAgid}
                </span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-bold">
                <a className="border-b border-slate-500 pb-0.5 text-slate-200 transition hover:border-white hover:text-white" href={GITHUB_REPO_URL}>
                  {hero.repository}
                </a>
                <a className="border-b border-slate-500 pb-0.5 text-slate-200 transition hover:border-white hover:text-white" href="/research">
                  {hero.primaryActions.readResearch}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DeveloperStarterSection locale={heroLocale} />
      <AddressOpenSourceStackSection locale={heroLocale} />
      <DownloadSetupSection locale={heroLocale} />

      <section className="bg-slate-950 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:gap-16">
          <div>
            <h2 className="text-[30px] font-black tracking-[-0.02em] text-white sm:text-[38px]">{hero.build.title}</h2>
            <p className="mt-4 max-w-xl text-[15px] font-semibold leading-7 text-slate-300">
              {hero.build.text}
            </p>
          </div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {workstreams.map(item => {
              const Icon = item.icon;
              const itemCopy = hero.build.workstreams[item.key];
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className="group grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-1 py-4 transition hover:bg-white/[0.04] sm:grid-cols-[auto_140px_1fr_auto] sm:items-center sm:gap-3 sm:px-3"
                >
                  <span className="row-span-2 flex h-9 w-9 items-center justify-center border border-white/10 text-blue-200 sm:row-span-1">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[14px] font-black text-white">{itemCopy.title}</span>
                  <span className="col-start-2 text-[12px] font-semibold leading-5 text-slate-400 sm:col-start-auto">{itemCopy.text}</span>
                  <ArrowRight className="col-start-3 row-span-2 row-start-1 h-4 w-4 self-center text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-200 sm:col-start-auto sm:row-span-1 sm:row-start-auto" />
                </a>
              );
            })}
          </div>
        </div>
        <footer className="mx-auto mt-12 grid max-w-7xl gap-10 border-t border-white/10 pt-8 lg:grid-cols-[0.38fr_0.62fr] lg:gap-16">
          <div className="text-[12px] font-bold leading-6 text-slate-400">
            <p className="max-w-sm">{hero.footer.description}</p>
            <p className="mt-2 text-slate-500">{hero.footer.subtext}</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-5 gap-y-7 xl:grid-cols-4" aria-label={hero.footer.navigationLabel}>
            {footerMenuGroups.map(group => (
              <section key={group.key}>
                <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{hero.footer.groups[group.key]}</h3>
                <div className="mt-3 space-y-1">
                  {group.links.map(link => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.href}
                        className="flex min-h-9 items-center gap-2 text-[12px] font-bold text-slate-300 transition hover:text-white"
                        href={link.href}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                        <span>{hero.footer.links[link.key]}</span>
                      </a>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </footer>
      </section>
    </main>
  );
}
