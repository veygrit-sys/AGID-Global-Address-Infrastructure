import {
  ArrowRight,
  Beaker,
  BookOpen,
  Box,
  Building2,
  Code2,
  Download,
  Github,
  HelpCircle,
  Map,
  Settings,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useState } from 'react';

const GITHUB_REPO_URL = 'https://github.com/dawnportinfo-design/Adreess-Grid-ID';
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
      title: 'Local-first address infrastructure.',
      text: 'No raw address by default. AGID/AOID, private QR, consent, revocation, receipts, and field handoff stay local-first before any connector is allowed.',
    },
    menu: {
      map: 'Map',
      aoid: 'AOID',
      posField: 'POS & Field',
      research: 'Research',
      developers: 'Developers',
    },
    h1: 'A Global Address ID for Every Place',
    lead: 'Open infrastructure for address IDs, private address QR, and machine-readable delivery handoff across countries, islands, rural areas, and places without reliable postal codes.',
    visual: {
      label: 'Global address layer',
      title: 'One protocol, many address systems',
      text: 'AGID links country formats, grids, aliases, and receipts without making raw address data the default public interface.',
      ariaLabel: 'AGID global coverage visual',
      points: {
        japan: { code: 'JP-13', label: 'Japan' },
        somalia: { code: 'AGID-SO-00123', label: 'Somalia' },
        tuvalu: { code: 'TO-ISL-004', label: 'Tuvalu' },
        virtualTown: { code: 'AGID-VT-00041', label: 'Virtual Town' },
      },
    },
    primaryActions: {
      useAgid: 'Use AGID',
      buildWithAgid: 'Build with AGID',
      readResearch: 'Read Research',
    },
    trustItems: [
      'No raw address by default',
      'Local-first',
      'Open data compatible',
      'ZK-ready',
      'Works without blockchain',
    ],
    entryCards: {
      register: {
        label: 'Register Address',
        text: 'Create a private address QR, alias, receipt, and country-format record without exposing raw address by default.',
      },
      aoid: {
        label: 'AOID',
        text: 'Manage private Address Owner IDs and register location identities without exposing raw address data.',
      },
      ops: {
        label: 'POS & Field Ops',
        text: 'Scan destination QR, decide, hand off, receipt, queue offline work, and report safely.',
      },
    },
    workspaceLanes: {
      field: {
        label: 'Field',
        text: 'POS, field handoff, hotel, locker, and drone flows for teams that touch the delivery handoff.',
      },
      operations: {
        label: 'Operations',
        text: 'Redacted review, audit, issuer, registry, sync, and launch readiness for operators.',
      },
      research: {
        label: 'Research & Design',
        text: 'Protocol papers, postal zones, simulations, evidence, and release design work.',
      },
    },
    sdk: {
      github: 'GitHub',
      title: 'Start with the SDK.',
      text: 'Resolve address IDs, create private QR, and verify machine handoff without putting raw address data into examples.',
      install: 'Install',
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
    research: {
      label: 'Protocol research',
      link: 'Research',
      title: 'Turn the paper trail into buildable protocol decisions.',
      signals: {
        amt: {
          label: 'Address Mapping Theory',
          text: 'Grid math, AOID, and address rendering rules stay implementation-ready.',
        },
        forge: {
          label: 'Postal Zone Models',
          text: 'Country packs, split/merge rules, and quality gates are reviewed together.',
        },
        gate: {
          label: 'Release Evidence',
          text: 'Security, privacy, SDK parity, and conformance checks are tracked before release.',
        },
      },
      papers: {
        amt: {
          title: 'Address Morphism Theory',
          label: 'Core paper',
          text: 'Address equivalence, mapping invariants, AGID/AOID relation, and multilingual rendering.',
        },
        application: {
          title: 'AGID / AOID Application Paper',
          label: 'Applied model',
          text: 'Grid generation, resolver conformance, secure QR, field handoff, and country packs.',
        },
        zk: {
          title: 'Zero-Knowledge Address Predicates',
          label: 'Privacy paper',
          text: 'No-raw-address proofs, nullifier flow, registry gates, and release safety checks.',
        },
      },
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
      description: 'MIT licensed core. Local-first resolver. No raw address release gates.',
      subtext: 'Open address infrastructure for people, field teams, operators, and developers.',
      groups: {
        apps: 'All apps',
        developers: 'Developers',
        research: 'Research',
        settings: 'Settings & Help',
      },
      links: {
        aoid: 'AOID',
        pos: 'POS',
        hotel: 'Hotel',
        opera: 'OPERA',
        field: 'Field',
        locker: 'Locker',
        drone: 'Drone',
        dashboard: 'Dashboard',
        developer: 'Developer Console',
        sdk: 'SDK',
        github: 'GitHub',
        research: 'Research',
        postalZones: 'Postal Zones',
        evidence: 'Evidence Vault',
        settings: 'Settings',
        help: 'Help',
        security: 'Security Gates',
      },
    },
  },
  ja: {
    brandSubtitle: 'オープン住所グリッド',
    openMapAria: 'AGIDマップを開く',
    repository: 'リポジトリ',
    languageToggleLabel: 'ヒーローの表示言語',
    localFirstShell: {
      title: 'ローカルファーストの住所基盤。',
      text: '生の住所は標準で出しません。AGID/AOID、非公開QR、同意、失効、受領証、現場引き渡しは、外部連携の前にローカルで扱います。',
    },
    menu: {
      map: '地図',
      aoid: 'AOID',
      posField: 'POS・現場',
      research: '研究',
      developers: '開発',
    },
    h1: 'すべての場所に使えるグローバル住所ID',
    lead: '住所ID、非公開住所QR、機械が読める配送引き渡しを、国、島しょ部、農村部、郵便番号が弱い地域まで扱うためのオープン基盤です。',
    visual: {
      label: 'グローバル住所レイヤー',
      title: '1つのプロトコルで多様な住所制度へ対応',
      text: 'AGIDは国別住所形式、グリッド、別名、受領証を接続し、生の住所を標準の公開インターフェースにしません。',
      ariaLabel: 'AGIDのグローバル対応ビジュアル',
      points: {
        japan: { code: 'JP-13', label: '日本' },
        somalia: { code: 'AGID-SO-00123', label: 'ソマリア' },
        tuvalu: { code: 'TO-ISL-004', label: 'ツバル' },
        virtualTown: { code: 'AGID-VT-00041', label: '仮想町' },
      },
    },
    primaryActions: {
      useAgid: 'AGIDを使う',
      buildWithAgid: 'AGIDで開発',
      readResearch: '研究を読む',
    },
    trustItems: [
      '生の住所は標準非表示',
      'ローカルファースト',
      'オープンデータ互換',
      'ZK対応準備',
      'ブロックチェーンなしでも動作',
    ],
    entryCards: {
      register: {
        label: '住所登録',
        text: '生の住所を標準で出さずに、非公開住所QR、別名、受領証、国別フォーマットの記録を作ります。',
      },
      aoid: {
        label: 'AOID',
        text: '生の住所を出さずに、非公開のAddress Owner IDと場所の識別情報を登録・管理します。',
      },
      ops: {
        label: 'POS・現場運用',
        text: '配送先QRを読み取り、判断、引き渡し、受領証、オフライン待ち行列、安全な報告を扱います。',
      },
    },
    workspaceLanes: {
      field: {
        label: '現場',
        text: 'POS、現場引き渡し、ホテル、ロッカー、ドローンなど、配送接点を扱うチーム向け。',
      },
      operations: {
        label: '運用',
        text: '秘匿レビュー、監査、発行者、レジストリ、同期、公開準備を運用者向けに整理します。',
      },
      research: {
        label: '研究・設計',
        text: '論文、郵便区画、シミュレーション、証跡、リリース設計をプロトコルに接続します。',
      },
    },
    sdk: {
      github: 'GitHub',
      title: 'SDKから始める。',
      text: '生の住所を例に出さず、住所IDの解決、非公開QR作成、機械引き渡し検証を試せます。',
      install: 'インストール',
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
    research: {
      label: 'プロトコル研究',
      link: '研究',
      title: '論文の内容を、実装できるプロトコル判断へ変換します。',
      signals: {
        amt: {
          label: '住所写像論',
          text: 'グリッド数理、AOID、住所表示ルールを実装可能な形で維持します。',
        },
        forge: {
          label: '郵便区画モデル',
          text: '国別パック、分割・統合ルール、品質ゲートをまとめて確認します。',
        },
        gate: {
          label: 'リリース証跡',
          text: 'セキュリティ、プライバシー、SDK互換、適合チェックを公開前に追跡します。',
        },
      },
      papers: {
        amt: {
          title: '住所写像論',
          label: '中核論文',
          text: '住所同値性、写像不変量、AGID/AOID関係、多言語表示を扱います。',
        },
        application: {
          title: 'AGID / AOID 応用論文',
          label: '応用モデル',
          text: 'グリッド生成、リゾルバー適合、安全QR、現場引き渡し、国別パックを扱います。',
        },
        zk: {
          title: 'ゼロ知識住所述語',
          label: 'プライバシー論文',
          text: '生住所非開示証明、無効化識別子、レジストリゲート、公開安全性を扱います。',
        },
      },
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
      description: 'MITライセンスの中核。ローカルファーストのリゾルバー。生住所非公開のリリースゲート。',
      subtext: '生活者、現場チーム、運用者、開発者のためのオープン住所基盤。',
      groups: {
        apps: 'アプリ一覧',
        developers: '開発者',
        research: '研究',
        settings: '設定とヘルプ',
      },
      links: {
        aoid: 'AOID',
        pos: 'POS',
        hotel: 'ホテル',
        opera: 'OPERA',
        field: '現場',
        locker: 'ロッカー',
        drone: 'ドローン',
        dashboard: 'ダッシュボード',
        developer: '開発コンソール',
        sdk: 'SDK',
        github: 'GitHub',
        research: '研究',
        postalZones: '郵便区画',
        evidence: '証跡保管庫',
        settings: '設定',
        help: 'ヘルプ',
        security: 'セキュリティゲート',
      },
    },
  },
} as const;

const developerInstallCommand = 'npm install @agid/sdk';

const developerApiExamples = [
  'resolveAGID()',
  'createSecureAddressQR()',
  'verifyMachineEnvelope()',
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
  { key: 'virtualTown', className: 'right-[4%] top-[46%]' },
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
  { key: 'posField', href: '/pos' },
  { key: 'research', href: '/research' },
  { key: 'developers', href: '/developer' },
] as const;

const heroEntryLinks = [
  {
    key: 'register',
    href: '/?register=1',
    icon: ShieldCheck,
  },
  {
    key: 'aoid',
    href: '/?action=aoid',
    icon: ShieldCheck,
  },
  {
    key: 'ops',
    href: '/pos',
    icon: Terminal,
  },
] as const;

const heroWorkspaceLanes = [
  {
    key: 'field',
    href: '/pos',
    icon: Terminal,
  },
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
      { key: 'pos', href: '/pos', icon: Terminal },
      { key: 'hotel', href: '/hotel', icon: Building2 },
      { key: 'opera', href: '/opera', icon: Building2 },
      { key: 'field', href: '/field', icon: ArrowRight },
      { key: 'locker', href: '/locker', icon: Box },
      { key: 'drone', href: '/ops', icon: Box },
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
      { key: 'help', href: '/settings#help', icon: HelpCircle },
      { key: 'security', href: '/settings#security', icon: ShieldCheck },
    ],
  },
] as const;

const researchDesignSignals = [
  { key: 'amt', value: 'AMT' },
  { key: 'forge', value: 'Forge' },
  { key: 'gate', value: 'Gate' },
] as const;

const heroPapers = [
  { key: 'amt' },
  { key: 'application' },
  { key: 'zk' },
] as const;

const downloadSetupModes = [
  {
    key: 'pc',
    command: ['git clone https://github.com/dawnportinfo-design/Adreess-Grid-ID.git', 'cd Adreess-Grid-ID', 'npm install', 'npm run dev'],
    href: GITHUB_REPO_URL,
    icon: Download,
  },
  {
    key: 'vscode',
    command: ['code Adreess-Grid-ID', 'npm run verify:developer-console', 'npm run verify:app-shell', 'npm run lint'],
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
    <section id="download-setup" className="bg-slate-950 px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 border-t border-white/10 pt-10 lg:grid-cols-[0.45fr_1fr] lg:items-start">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-blue-100/70">
              <Download className="h-4 w-4" />
              {copy.label}
            </div>
            <h2 className="mt-3 max-w-xl text-[30px] font-black leading-tight tracking-normal text-white sm:text-[40px]">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-xl text-[14px] font-semibold leading-7 text-slate-300">
              {copy.text}
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-3">
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
                    className="group flex min-h-[190px] flex-col rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-lg shadow-black/15 transition hover:border-blue-200/[0.32] hover:bg-blue-200/[0.10]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100/15 bg-emerald-300/[0.11] text-emerald-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded-lg border border-white/10 bg-slate-950/48 px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">
                        {linkCopy.label}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[18px] font-black leading-snug text-white">{linkCopy.title}</h3>
                    <p className="mt-2 text-[12px] font-semibold leading-6 text-slate-300">{linkCopy.text}</p>
                    <span className="mt-auto inline-flex min-h-10 items-center gap-2 text-[12px] font-black text-blue-100 transition group-hover:text-white">
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
              className="flex flex-col gap-2 rounded-lg border border-white/10 bg-slate-950/48 p-4 text-left transition hover:border-emerald-200/30 hover:bg-emerald-200/[0.08] sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-100/15 bg-emerald-300/[0.11] text-emerald-100">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-black text-white">{copy.manifest.label}</span>
                  <span className="mt-1 block text-[12px] font-semibold leading-5 text-slate-300">{copy.manifest.text}</span>
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 text-[12px] font-black text-emerald-100">
                {copy.manifest.action}
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>

            <div className="grid gap-3 lg:grid-cols-3">
            {downloadSetupModes.map(mode => {
              const Icon = mode.icon;
              const modeCopy = copy.modes[mode.key];
              return (
                <article
                  key={mode.key}
                  className="flex min-h-[300px] flex-col rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-lg shadow-black/15"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100/15 bg-blue-300/[0.11] text-blue-100">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-lg border border-white/10 bg-slate-950/48 px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">
                      {modeCopy.label}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[18px] font-black leading-snug text-white">{modeCopy.title}</h3>
                  <p className="mt-2 text-[12px] font-semibold leading-6 text-slate-300">{modeCopy.text}</p>
                  <div className="mt-4 space-y-1.5">
                    {mode.command.map(command => (
                      <code
                        key={command}
                        className="block overflow-x-auto rounded-lg border border-white/10 bg-slate-950/72 px-3 py-2 text-[11px] font-bold text-emerald-100"
                      >
                        {command}
                      </code>
                    ))}
                  </div>
                  <a
                    href={mode.href}
                    className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 text-[12px] font-black text-white transition hover:border-blue-200/[0.35] hover:bg-blue-200/[0.12]"
                  >
                    {modeCopy.action}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
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
    <section className="bg-slate-950 px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-6 border-t border-white/10 pt-10 lg:grid-cols-[0.58fr_0.42fr] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/20 bg-emerald-300/[0.12] text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[22px] font-black leading-tight text-white sm:text-[30px]">
                  {hero.localFirstShell.title}
                </h2>
                <p className="mt-3 max-w-3xl text-[14px] font-semibold leading-7 text-slate-300">
                  {hero.localFirstShell.text}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {hero.trustItems.map(item => (
                <span
                  key={item}
                  className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-[11px] font-black text-blue-100/80"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
          <HeroWorkspaceLaneGrid locale={locale} className="grid gap-3 md:grid-cols-3" />
        </div>

        <section className="rounded-2xl border border-blue-200/[0.18] bg-slate-950/[0.72] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100/[0.18] bg-blue-300/[0.14] text-blue-100">
              <Code2 className="h-5 w-5" />
            </span>
            <a
              href={GITHUB_REPO_URL}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-2 text-[12px] font-black text-white transition hover:bg-white/[0.13]"
            >
              <Github className="h-4 w-4" />
              {hero.sdk.github}
            </a>
          </div>
          <h2 className="mt-6 text-[28px] font-black leading-tight tracking-normal text-white sm:text-[36px]">
            {hero.sdk.title}
          </h2>
          <p className="mt-4 text-[14px] font-semibold leading-7 text-slate-300">
            {hero.sdk.text}
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11px] font-black text-blue-100/70">
                <Terminal className="h-3.5 w-3.5" />
                {hero.sdk.install}
              </div>
              <code className="block overflow-x-auto rounded-xl border border-white/12 bg-slate-950/78 px-4 py-4 text-[13px] font-bold text-emerald-100 shadow-lg shadow-black/20">
                {developerInstallCommand}
              </code>
            </div>
            <div className="grid gap-2.5">
              {developerApiExamples.map(example => (
                <code
                  key={example}
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[12px] font-black text-blue-100"
                >
                  {example}
                </code>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {heroResourceLinks.map(link => {
              const Icon = link.icon;
              const downloadName = 'download' in link ? link.download : undefined;
              return (
                <a
                  key={link.key}
                  href={link.href}
                  download={downloadName}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-center text-[12px] font-black text-white transition hover:border-blue-200/[0.35] hover:bg-blue-200/[0.12]"
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

function ProtocolResearchSection({ locale }: { locale: HeroLocale }) {
  const hero = heroCopy[locale];

  return (
    <section className="bg-slate-950 px-5 pb-14 sm:px-8 sm:pb-16">
      <div className="mx-auto max-w-7xl border-t border-white/10 pt-10">
        <section className="rounded-2xl border border-cyan-200/[0.14] bg-white/[0.04] p-5 shadow-xl shadow-black/15 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px] font-black text-cyan-100/[0.82]">
              <Beaker className="h-4 w-4" />
              {hero.research.label}
            </div>
            <a href="/research" className="text-[12px] font-black text-cyan-100 transition hover:text-white">
              {hero.research.link}
            </a>
          </div>
          <h2 className="mt-4 max-w-4xl text-[28px] font-black leading-snug text-white sm:text-[38px]">
            {hero.research.title}
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {researchDesignSignals.map(item => (
              <div key={item.key} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <span className="block text-[17px] font-black text-cyan-100">{item.value}</span>
                <span className="mt-1 block text-[12px] font-black leading-5 text-slate-300">
                  {hero.research.signals[item.key].label}
                </span>
                <span className="mt-2 block text-[12px] font-semibold leading-5 text-slate-400">
                  {hero.research.signals[item.key].text}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {heroPapers.map(paper => (
              <a
                key={paper.key}
                href="/research"
                className="grid gap-2 py-3 transition hover:text-cyan-100 sm:grid-cols-[140px_minmax(0,1fr)]"
              >
                <span className="text-[12px] font-black leading-5 text-slate-400">{hero.research.papers[paper.key].label}</span>
                <span className="text-[13px] font-black text-white">{hero.research.papers[paper.key].title}</span>
              </a>
            ))}
          </div>
        </section>
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
        AGID / AOID / receipt
      </div>
    </section>
  );
}

export function OpenSourceHomeScreen() {
  const [heroLocale, setHeroLocale] = useState<HeroLocale>('en');
  const hero = heroCopy[heroLocale];

  return (
    <main className="agid-page-scroll bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_62%,#eef6ff_100%)]">
        <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.055)_1px,transparent_1px)] bg-[size:72px_72px]" />

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

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-5 pb-10 pt-10 sm:px-8 sm:pb-12 sm:pt-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
          <div className="max-w-2xl">
            <h1 className="max-w-3xl text-[44px] font-black leading-[1.03] tracking-normal text-slate-950 sm:text-[62px] sm:leading-[1.01] lg:text-[72px]">
              {hero.h1}
            </h1>
            <p className="mt-6 max-w-xl text-[17px] font-semibold leading-8 text-slate-600 sm:text-[19px]">
              {hero.lead}
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
              {heroPrimaryActions.map(action => {
                const Icon = action.icon;
                const className =
                  'variant' in action && action.variant === 'primary'
                    ? 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-[14px] font-black text-white shadow-xl shadow-blue-200 transition hover:bg-blue-500 sm:h-[52px]'
                    : 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[14px] font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-600 sm:h-[52px]';
                return (
                  <a key={action.key} href={action.href} className={className}>
                    <Icon className="h-4 w-4" />
                    {hero.primaryActions[action.key]}
                  </a>
                );
              })}
            </div>
          </div>

          <HeroGlobalVisual locale={heroLocale} />
        </div>
        <HeroEntryCardGrid locale={heroLocale} className="relative z-10 mx-auto grid w-full max-w-7xl gap-4 px-5 pb-16 sm:px-8 md:grid-cols-3" />
      </section>

      <DeveloperStarterSection locale={heroLocale} />
      <ProtocolResearchSection locale={heroLocale} />
      <DownloadSetupSection locale={heroLocale} />

      <section className="bg-slate-950 px-5 pb-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 border-t border-white/10 pt-10 lg:grid-cols-[0.62fr_1fr]">
          <div>
            <h2 className="text-[30px] font-black tracking-normal text-white sm:text-[38px]">{hero.build.title}</h2>
            <p className="mt-4 max-w-xl text-[15px] font-semibold leading-7 text-slate-300">
              {hero.build.text}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {workstreams.map(item => {
              const Icon = item.icon;
              const itemCopy = hero.build.workstreams[item.key];
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className="group flex min-h-[172px] flex-col justify-between rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-blue-300/40 hover:bg-white/[0.07]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-900 text-blue-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[16px] font-black text-white">{itemCopy.title}</span>
                    <span className="mt-2 block text-[13px] font-semibold leading-6 text-slate-300">{itemCopy.text}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
        <footer className="mx-auto mt-10 grid max-w-7xl gap-8 border-t border-white/10 pt-7 lg:grid-cols-[0.46fr_1fr]">
          <div className="text-[12px] font-bold leading-6 text-slate-400">
            <p className="max-w-sm">{hero.footer.description}</p>
            <p className="mt-2 text-slate-500">{hero.footer.subtext}</p>
          </div>
          <nav className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Open source footer menu">
            {footerMenuGroups.map(group => (
              <section key={group.key}>
                <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{hero.footer.groups[group.key]}</h3>
                <div className="mt-3 space-y-2">
                  {group.links.map(link => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.href}
                        className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-[12px] font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
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
