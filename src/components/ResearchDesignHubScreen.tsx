import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSearch,
  FileText,
  GitBranch,
  Grid3X3,
  Layers,
  LockKeyhole,
  Rocket,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Workflow,
} from 'lucide-react';
import React from 'react';

import {
  getAppSurfaceCopy,
  getAppSurfaceGroupLabel,
  getAppSurfaces,
  type AppSurfaceDefinition,
  type AppSurfaceId,
} from '../lib/appNavigation';
import { getLanguageDirection } from '../lib/i18n';
import { APP_LANGUAGE_STORAGE_KEY, normalizeAppLanguage } from '../lib/languageSettings';
import { cn } from '../lib/utils';

type ResearchMode = 'all' | 'evidence' | 'design' | 'simulation' | 'release';

type ResearchSurfaceMeta = {
  mode: Exclude<ResearchMode, 'all'>;
  phase: string;
  phaseJa: string;
  owner: string;
  ownerJa: string;
  artifact: string;
  artifactJa: string;
  gate: string;
  gateJa: string;
  signal: string;
  signalJa: string;
  action: string;
  actionJa: string;
};

const RESEARCH_SURFACE_IDS = [
  'evidence-vault',
  'postal-zone-designer',
  'open-locker-pudo-simulator',
  'drone-locker-ops',
  'developer-console',
  'agid-address-element',
] as const satisfies readonly AppSurfaceId[];

const SURFACE_META: Record<(typeof RESEARCH_SURFACE_IDS)[number], ResearchSurfaceMeta> = {
  'evidence-vault': {
    mode: 'evidence',
    phase: '01 Evidence',
    phaseJa: '01 証跡',
    owner: 'Research / Legal',
    ownerJa: '研究 / 法務',
    artifact: 'Redacted evidence pack',
    artifactJa: '秘匿済み証跡パック',
    gate: 'OCR, redaction, local encryption',
    gateJa: 'OCR、秘匿化、ローカル暗号化',
    signal: 'Source material can be reviewed without exposing raw address text.',
    signalJa: '実住所テキストを出さずに、元資料を確認できます。',
    action: 'Open evidence review',
    actionJa: '証跡レビューを開く',
  },
  'postal-zone-designer': {
    mode: 'design',
    phase: '02 Design',
    phaseJa: '02 設計',
    owner: 'GIS / Postal',
    ownerJa: 'GIS / 郵便設計',
    artifact: 'Postal zone draft',
    artifactJa: '郵便区画ドラフト',
    gate: 'Math, GIS, privacy, governance',
    gateJa: '数理、GIS、プライバシー、承認',
    signal: 'A country or region can be modeled before it is presented as official.',
    signalJa: '公式表示の前に、国・地域のモデルを検証できます。',
    action: 'Design postal zones',
    actionJa: '郵便区画を設計',
  },
  'open-locker-pudo-simulator': {
    mode: 'simulation',
    phase: '03 Simulation',
    phaseJa: '03 実験',
    owner: 'Hardware / Field',
    ownerJa: 'ハードウェア / 現場',
    artifact: 'Locker and PUDO runbook',
    artifactJa: 'ロッカー/PUDO手順',
    gate: 'QR/NFC intake, handoff, local protocol',
    gateJa: 'QR/NFC受付、引き渡し、ローカル通信',
    signal: 'Counter and locker workflows can be rehearsed before hardware rollout.',
    signalJa: '端末導入前に、カウンターとロッカーの流れを試せます。',
    action: 'Run locker simulation',
    actionJa: 'ロッカー実験を開く',
  },
  'drone-locker-ops': {
    mode: 'simulation',
    phase: '03 Simulation',
    phaseJa: '03 実験',
    owner: 'Ops / Safety',
    ownerJa: '運用 / 安全',
    artifact: 'Reachability evidence',
    artifactJa: '到達可能性の証跡',
    gate: 'Drone, locker, route, and safety evidence',
    gateJa: 'ドローン、ロッカー、経路、安全証跡',
    signal: 'Air/ground handoff assumptions are visible before production use.',
    signalJa: '空と地上の引き渡し条件を、本番前に確認できます。',
    action: 'Open ops console',
    actionJa: '運用コンソールを開く',
  },
  'developer-console': {
    mode: 'release',
    phase: '04 Release',
    phaseJa: '04 公開準備',
    owner: 'SDK / API',
    ownerJa: 'SDK / API',
    artifact: 'Conformance bundle',
    artifactJa: '互換性テスト一式',
    gate: 'SDK, OpenAPI, test vectors, launch checks',
    gateJa: 'SDK、OpenAPI、テストベクトル、公開チェック',
    signal: 'Research output can move into a developer-ready integration path.',
    signalJa: '研究成果を、開発者が使える連携ルートへ移せます。',
    action: 'Prepare developer release',
    actionJa: '開発者向け公開を準備',
  },
  'agid-address-element': {
    mode: 'release',
    phase: '04 Release',
    phaseJa: '04 公開準備',
    owner: 'Product / Embed',
    ownerJa: 'プロダクト / 埋め込み',
    artifact: 'Address Element prototype',
    artifactJa: 'Address Element試作',
    gate: 'Country forms, language tabs, host events',
    gateJa: '国別フォーム、言語タブ、ホストイベント',
    signal: 'Design decisions can be tested as an embeddable address input.',
    signalJa: '設計判断を、埋め込み住所入力として試せます。',
    action: 'Test Address Element',
    actionJa: 'Address Elementを試す',
  },
};

const MODE_OPTIONS: Array<{ id: ResearchMode; label: string; description: string }> = [
  { id: 'all', label: 'All', description: 'All research and design apps' },
  { id: 'evidence', label: 'Evidence', description: 'Collect and redact source material' },
  { id: 'design', label: 'Design', description: 'Model postal zones and address logic' },
  { id: 'simulation', label: 'Simulation', description: 'Try locker, PUDO, drone, and field workflows' },
  { id: 'release', label: 'Release', description: 'Prepare SDK, API, and embeddable output' },
];

const WORKFLOW_STEPS = [
  {
    title: 'Gather evidence',
    titleJa: '証跡を集める',
    body: 'Start from source files, photos, PDFs, maps, and redacted proof packages.',
    bodyJa: '元資料、写真、PDF、地図、秘匿済み証明パックから始めます。',
    surfaceId: 'evidence-vault' as AppSurfaceId,
  },
  {
    title: 'Design the model',
    titleJa: 'モデルを設計する',
    body: 'Turn evidence into postal zones, AGID rules, quality gates, and governance state.',
    bodyJa: '証跡を郵便区画、AGIDルール、品質ゲート、承認状態へ変換します。',
    surfaceId: 'postal-zone-designer' as AppSurfaceId,
  },
  {
    title: 'Run field simulation',
    titleJa: '現場実験を回す',
    body: 'Check locker, PUDO, drone, handoff, and offline behavior before production.',
    bodyJa: '本番前にロッカー、PUDO、ドローン、引き渡し、オフライン動作を確認します。',
    surfaceId: 'open-locker-pudo-simulator' as AppSurfaceId,
  },
  {
    title: 'Prepare release',
    titleJa: '公開準備をする',
    body: 'Package SDK vectors, OpenAPI paths, Address Element behavior, and launch gates.',
    bodyJa: 'SDKベクトル、OpenAPI、Address Element、公開ゲートをまとめます。',
    surfaceId: 'developer-console' as AppSurfaceId,
  },
];

const QUALITY_GATES = [
  { en: 'No raw address display', ja: '実住所を表示しない' },
  { en: 'Source and license traceability', ja: '出典とライセンスを追跡できる' },
  { en: 'Math / GIS consistency', ja: '数理モデルとGISが矛盾しない' },
  { en: 'Privacy and governance gate', ja: 'プライバシーと承認ゲートを通す' },
  { en: 'SDK / API conformance path', ja: 'SDK/API互換性テストへ接続する' },
];

const CLAIM_MATURITY = [
  {
    label: 'Research',
    labelJa: '研究',
    tone: 'border-slate-200 bg-white text-slate-700',
    detail: 'Claim is defined and bounded.',
    detailJa: '主張と境界を定義済み。',
  },
  {
    label: 'Prototype',
    labelJa: '試作',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    detail: 'Executable model or UI exists.',
    detailJa: '実行可能なモデルまたはUIあり。',
  },
  {
    label: 'Validated',
    labelJa: '検証済み',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    detail: 'Tests and evidence are linked.',
    detailJa: 'テストと証跡を接続済み。',
  },
  {
    label: 'Limited',
    labelJa: '限定公開',
    tone: 'border-amber-200 bg-amber-50 text-amber-800',
    detail: 'Use only inside the stated boundary.',
    detailJa: '明示した境界内でのみ利用。',
  },
];

const RESEARCH_CLAIMS = [
  {
    title: 'Address Morphism Theory',
    titleJa: '住所写像論',
    status: 'Validated',
    statusJa: '検証済み',
    evidence: 'Executable expectations, Lean/GIS notes, address-quality fixtures.',
    evidenceJa: '実行可能期待、Lean/GISノート、住所品質fixture。',
    boundary: 'Does not claim universal correctness for every address system.',
    boundaryJa: '全世界すべての住所制度で常に正しいとは主張しない。',
    route: '/developer#community',
  },
  {
    title: 'AGID / AOID Spec',
    titleJa: 'AGID / AOID仕様',
    status: 'Prototype',
    statusJa: '試作',
    evidence: 'Resolver, parity vectors, SDK generation, conformance tests.',
    evidenceJa: 'Resolver、parity vector、SDK生成、互換性テスト。',
    boundary: 'Identifier and resolution protocol, not a replacement for official postal systems.',
    boundaryJa: '識別子と解決プロトコルであり、公的郵便制度の置換ではない。',
    route: '/developer#api',
  },
  {
    title: 'Secure Address QR',
    titleJa: 'Secure Address QR',
    status: 'Validated',
    statusJa: '検証済み',
    evidence: 'Commitment, alias, receipt, scope, and no-raw-address release gates.',
    evidenceJa: 'commitment、alias、receipt、scope、実住所なし公開ゲート。',
    boundary: 'QR payloads must avoid recipient data and raw address fields by default.',
    boundaryJa: 'QR payloadは標準で受取人情報と実住所フィールドを避ける。',
    route: '/?action=aoid',
  },
  {
    title: 'ZK Address Predicates',
    titleJa: 'ZK住所述語',
    status: 'Limited',
    statusJa: '限定公開',
    evidence: 'Proof-ready envelopes, nullifier policy, scope, freshness, and bundle compatibility.',
    evidenceJa: 'proof-ready envelope、nullifier方針、scope、freshness、bundle互換性。',
    boundary: 'ZK-ready envelope only; production cryptographic ZK needs audited circuits.',
    boundaryJa: 'ZK-ready envelope段階。production暗号ZKには監査済み回路が必要。',
    route: '/developer#deploy',
  },
] as const;

const PAPER_TO_IMPLEMENTATION = [
  {
    step: 'Paper claim',
    stepJa: '論文主張',
    output: 'Bounded theorem or hypothesis',
    outputJa: '境界付き定理または仮説',
    gate: 'Claim maturity label',
    gateJa: '主張成熟度ラベル',
  },
  {
    step: 'Executable model',
    stepJa: '実行モデル',
    output: 'Fixture, parser, resolver, or policy object',
    outputJa: 'fixture、parser、resolver、policy object',
    gate: 'No raw/private material',
    gateJa: '実住所/秘密素材なし',
  },
  {
    step: 'Conformance',
    stepJa: '互換性',
    output: 'SDK parity vectors and OpenAPI path',
    outputJa: 'SDK parity vectorとOpenAPI path',
    gate: 'Repeatable tests',
    gateJa: '再現可能テスト',
  },
  {
    step: 'Field pilot',
    stepJa: '現場実験',
    output: 'Receipt, audit log, cannot-reach report',
    outputJa: 'receipt、監査ログ、到達不可レポート',
    gate: 'Human review before production',
    gateJa: '本番前の人間レビュー',
  },
];

const RESEARCH_ARTIFACTS = [
  { label: 'AMT paper', labelJa: 'AMT論文', route: '/developer#community', icon: BookOpen },
  { label: 'AGID/AOID Spec', labelJa: 'AGID/AOID仕様', route: '/developer#api', icon: FileText },
  { label: 'Secure QR', labelJa: 'Secure QR', route: '/?action=aoid', icon: ShieldCheck },
  { label: 'Conformance', labelJa: '互換性テスト', route: '/developer#vectors', icon: GitBranch },
  { label: 'Evidence Vault', labelJa: '証跡Vault', route: '/evidence', icon: Database },
  { label: 'Postal Zones', labelJa: '郵便区画', route: '/postal-zones', icon: Grid3X3 },
];

function goTo(route: string | null) {
  if (!route) return;
  window.location.href = route;
}

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en';
  return normalizeAppLanguage(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || window.navigator.language);
}

function modeLabel(mode: ResearchMode, language: string) {
  const ja = language.startsWith('ja');
  if (!ja) return MODE_OPTIONS.find(item => item.id === mode)?.label ?? mode;
  if (mode === 'all') return 'すべて';
  if (mode === 'evidence') return '証跡';
  if (mode === 'design') return '設計';
  if (mode === 'simulation') return '実験';
  return '公開準備';
}

function claimStatusClass(status: string) {
  if (status === 'Validated') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Prototype') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'Limited') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function SurfaceCard({
  surface,
  language,
}: {
  surface: AppSurfaceDefinition;
  language: string;
}) {
  const copy = getAppSurfaceCopy(surface, language);
  const meta = SURFACE_META[surface.id as keyof typeof SURFACE_META];
  const ready = surface.status === 'ready';
  const ja = language.startsWith('ja');

  return (
    <button
      type="button"
      onClick={() => goTo(surface.route)}
      className="group flex min-h-[260px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/8"
    >
      <span>
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
              {ja ? meta.phaseJa : meta.phase}
            </span>
            <span className="mt-2 block text-lg font-black leading-tight text-slate-950">
              {copy.label}
            </span>
          </span>
          <span className={cn(
            'shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]',
            ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
          )}>
            {ready ? (ja ? '利用可' : 'Ready') : (ja ? '一部' : 'Partial')}
          </span>
        </span>
        <span className="mt-3 block text-sm font-semibold leading-6 text-slate-600">
          {copy.description}
        </span>
        <span className="mt-4 grid gap-2 text-[12px] font-bold text-slate-600">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-slate-400" />
            {ja ? meta.ownerJa : meta.owner}
          </span>
          <span className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-slate-400" />
            {ja ? meta.artifactJa : meta.artifact}
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            {ja ? meta.gateJa : meta.gate}
          </span>
        </span>
        <span className="mt-4 block rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] font-semibold leading-5 text-slate-600">
          {ja ? meta.signalJa : meta.signal}
        </span>
      </span>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700 transition group-hover:text-blue-500">
        {ja ? meta.actionJa : meta.action}
        <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}

export function ResearchDesignHubScreen() {
  const [language] = React.useState(getInitialLanguage);
  const [query, setQuery] = React.useState('');
  const [mode, setMode] = React.useState<ResearchMode>('all');
  const direction = getLanguageDirection(language);
  const surfaces = React.useMemo(() => {
    const byId = new Map(getAppSurfaces().map(surface => [surface.id, surface]));
    return RESEARCH_SURFACE_IDS.map(id => byId.get(id)).filter(Boolean) as AppSurfaceDefinition[];
  }, []);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSurfaces = React.useMemo(() => surfaces.filter(surface => {
    const meta = SURFACE_META[surface.id as keyof typeof SURFACE_META];
    if (mode !== 'all' && meta.mode !== mode) return false;
    if (!normalizedQuery) return true;
    const copy = getAppSurfaceCopy(surface, language);
    return [
      copy.label,
      copy.shortLabel,
      copy.description,
      meta.phase,
      meta.owner,
      meta.artifact,
      meta.gate,
      meta.signal,
    ].join(' ').toLowerCase().includes(normalizedQuery);
  }), [language, mode, normalizedQuery, surfaces]);

  const ja = language.startsWith('ja');
  const readyCount = surfaces.filter(surface => surface.status === 'ready').length;
  const labsLabel = getAppSurfaceGroupLabel('labs', language);

  return (
    <main dir={direction} className="agid-page-scroll bg-slate-100 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={() => goTo('/')}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {ja ? '地図に戻る' : 'Return to map'}
            </button>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                {ja ? '実住所なし' : 'No raw address'}
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">
                {readyCount}/{surfaces.length} {ja ? '利用可' : 'Ready'}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                {labsLabel}
              </span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.24em] text-blue-600">
                AGID Research / Design
              </p>
              <h1 className="mt-3 max-w-4xl text-[42px] font-black leading-none tracking-normal text-slate-950 sm:text-[58px]">
                {ja ? '研究を、仕様と検証と現場実験へ接続する。' : 'Connect research to specs, tests, and field pilots.'}
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-600">
                {ja
                  ? '住所写像論、AGID/AOID仕様、Secure Address QR、ZK-ready envelopeを、論文だけで終わらせず、テスト、SDK、証跡、現場シミュレーションへ落とします。各画面は実住所を見せず、主張の境界と検証結果を中心にします。'
                  : 'Turn Address Morphism Theory, AGID/AOID specs, Secure Address QR, and ZK-ready envelopes into tests, SDK paths, evidence, and field simulations without exposing raw address material.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {CLAIM_MATURITY.map(item => (
                  <span
                    key={item.label}
                    className={cn('rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]', item.tone)}
                    title={ja ? item.detailJa : item.detail}
                  >
                    {ja ? item.labelJa : item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-black text-slate-950">{ja ? '論文から実装へ' : 'Paper to implementation'}</p>
              </div>
              <div className="mt-4 grid gap-2">
                {PAPER_TO_IMPLEMENTATION.map((step, index) => (
                  <div
                    key={step.step}
                    className="grid grid-cols-[32px_1fr] gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-[12px] font-black text-white">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-black text-slate-950">{ja ? step.stepJa : step.step}</span>
                      <span className="mt-1 block text-[12px] font-semibold leading-5 text-slate-500">{ja ? step.outputJa : step.output}</span>
                      <span className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                        {ja ? step.gateJa : step.gate}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
                {ja ? '検証マトリクス' : 'Executable evidence matrix'}
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {ja ? '研究主張を、境界付きで公開する。' : 'Publish research claims with explicit boundaries.'}
              </h2>
            </div>
            <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
              {ja ? 'no raw / synthetic first' : 'no raw / synthetic first'}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {RESEARCH_CLAIMS.map(claim => (
              <button
                key={claim.title}
                type="button"
                onClick={() => goTo(claim.route)}
                className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-white sm:grid-cols-[190px_1fr]"
              >
                <span>
                  <span className="block text-base font-black leading-tight text-slate-950">{ja ? claim.titleJa : claim.title}</span>
                  <span className={cn('mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]', claimStatusClass(claim.status))}>
                    {ja ? claim.statusJa : claim.status}
                  </span>
                </span>
                <span className="grid gap-2">
                  <span className="text-[12px] font-bold leading-5 text-slate-600">
                    <span className="font-black text-slate-950">{ja ? '根拠: ' : 'Evidence: '}</span>
                    {ja ? claim.evidenceJa : claim.evidence}
                  </span>
                  <span className="text-[12px] font-bold leading-5 text-slate-600">
                    <span className="font-black text-amber-700">{ja ? '境界: ' : 'Boundary: '}</span>
                    {ja ? claim.boundaryJa : claim.boundary}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-cyan-300" />
            <p className="text-sm font-black">{ja ? '研究成果の接続先' : 'Research artifact trail'}</p>
          </div>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
            {ja
              ? '論文、仕様、互換性テスト、証跡、郵便区画を同じ入口から開けるようにして、研究と実装の距離を短くします。'
              : 'Keep papers, specs, conformance, evidence, and postal-zone work reachable from the same place so research can become implementation work.'}
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {RESEARCH_ARTIFACTS.map(item => {
              const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => goTo(item.route)}
                      className="flex min-h-[54px] items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:border-cyan-300/60 hover:bg-white/10"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <Icon className="h-4 w-4 text-cyan-200" />
                      </span>
                      <span className="text-sm font-black text-white">{ja ? item.labelJa : item.label}</span>
                    </button>
                  );
                })}
            </div>
          <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-[12px] font-bold leading-6 text-cyan-50">
            {ja
              ? '未検証のものは Research または Limited として扱い、公開画面では配送保証や完全ZKのような強い表現にしません。'
              : 'Unverified work stays labeled as Research or Limited; public copy must not overclaim delivery guarantees or production cryptographic ZK.'}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-black text-slate-950">{ja ? '推奨ワークフロー' : 'Recommended workflow'}</p>
            </div>
            <div className="mt-4 grid gap-2">
              {WORKFLOW_STEPS.map((step, index) => {
                const target = surfaces.find(surface => surface.id === step.surfaceId);
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => goTo(target?.route ?? null)}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-300"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[12px] font-black text-white">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-black text-slate-950">{ja ? step.titleJa : step.title}</span>
                      <span className="mt-1 block text-[12px] font-semibold leading-5 text-slate-500">{ja ? step.bodyJa : step.body}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <label className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={ja ? '研究、設計、証跡を検索' : 'Search research, design, evidence'}
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
            <div className="mt-3 grid gap-1.5">
              {MODE_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  className={cn(
                    'flex min-h-[42px] items-center justify-between rounded-lg px-3 py-2 text-left transition',
                    mode === option.id ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 hover:bg-slate-50',
                  )}
                  title={option.description}
                >
                  <span className="text-sm font-black">{modeLabel(option.id, language)}</span>
                  <SlidersHorizontal className="h-4 w-4 opacity-65" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-black text-slate-950">{ja ? '公開前ゲート' : 'Pre-release gates'}</p>
            </div>
            <div className="mt-3 grid gap-2">
              {QUALITY_GATES.map(gate => (
                <div key={gate.en} className="flex items-start gap-2 text-[12px] font-bold leading-5 text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {ja ? gate.ja : gate.en}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Beaker className="h-5 w-5 text-blue-600" />
              <p className="mt-3 text-2xl font-black text-slate-950">{surfaces.length}</p>
              <p className="text-[12px] font-bold text-slate-500">{ja ? '研究/設計アプリ' : 'Research/design apps'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Grid3X3 className="h-5 w-5 text-blue-600" />
              <p className="mt-3 text-2xl font-black text-slate-950">{filteredSurfaces.length}</p>
              <p className="text-[12px] font-bold text-slate-500">{ja ? '現在の表示件数' : 'Visible matches'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Layers className="h-5 w-5 text-blue-600" />
              <p className="mt-3 text-2xl font-black text-slate-950">4</p>
              <p className="text-[12px] font-bold text-slate-500">{ja ? '設計段階' : 'Design phases'}</p>
            </div>
          </div>

          {filteredSurfaces.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-lg font-black text-slate-950">{ja ? '該当する研究/設計アプリがありません' : 'No research/design apps match'}</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">{ja ? '検索語かフィルタを変えてください。' : 'Adjust the search or filter.'}</p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredSurfaces.map(surface => (
                <SurfaceCard key={surface.id} surface={surface} language={language} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
