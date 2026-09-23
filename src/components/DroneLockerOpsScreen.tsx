import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  MapPinOff,
  PackageCheck,
  RefreshCw,
  Router,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import React from 'react';

import { apiEndpoints } from '../lib/apiEndpoints';
import {
  buildDroneOpsConstraintSet,
  createDroneOpsReceipt,
  droneFieldDecisionFor,
  listDroneOpsCapabilities,
  type DroneOpsConstraint,
  type DroneOpsFieldDecision,
} from '../lib/droneOpsScenario';
import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import { buildLockerOpsQrNfcOperations, buildLockerOpsSimulation, listLockerOpsCapabilities } from '../lib/lockerOpsScenario';
import { OPS_SCENARIOS, scenarioTime, type OpsScenario } from '../lib/opsScenario';
import { formatPublicConfidenceBand } from '../lib/publicDecisionDisplay';
import type { WarehouseLockerLocalSimulation } from '../lib/warehouseLockerLocalSimulator';
import { cn } from '../lib/utils';

type OpsCopyKey =
  | 'acceptedAccess'
  | 'returnToMap'
  | 'subtitle'
  | 'language'
  | 'reset'
  | 'workspace'
  | 'switchMode'
  | 'splitBody'
  | 'droneOps'
  | 'droneOpsBody'
  | 'lockerOps'
  | 'lockerOpsBody'
  | 'lockerCommandCenter'
  | 'lockerCommandCenterBody'
  | 'scenario'
  | 'normal'
  | 'blocked'
  | 'offline'
  | 'reachability'
  | 'locker'
  | 'protocol'
  | 'report'
  | 'runbook'
  | 'runbookBody'
  | 'privacyBoundary'
  | 'privacyBody'
  | 'droneEvidence'
  | 'lockerSnapshot'
  | 'qrNfcAccess'
  | 'qrReader'
  | 'nfcReader'
  | 'protocolFrames'
  | 'safeReport'
  | 'decision'
  | 'publication'
  | 'confidence'
  | 'nextAction'
  | 'lockerStatus'
  | 'offlineQueue'
  | 'frames'
  | 'alerts'
  | 'assignments'
  | 'commands'
  | 'access'
  | 'capabilities'
  | 'endpointCatalog'
  | 'reachabilityApi'
  | 'simulatorApi'
  | 'notDroneOs'
  | 'noRawAddress'
  | 'noRawAgidAoid'
  | 'noTelemetry'
  | 'noSecrets'
  | 'localSimulator'
  | 'recentFrames'
  | 'warnings'
  | 'publicProjection'
  | 'operatorReceipt'
  | 'qrNfcOperations'
  | 'health'
  | 'available'
  | 'disabled'
  | 'commandCenter'
  | 'commandCenterBody'
  | 'priorityAction'
  | 'fieldChecklist'
  | 'handoffReadiness'
  | 'safeHandoff'
  | 'releaseHandoff'
  | 'createCannotReach'
  | 'syncWhenOnline'
  | 'holdForReview'
  | 'routeFallback'
  | 'proofBundle'
  | 'evidenceReady'
  | 'manualReview'
  | 'readerReady'
  | 'syncPlan'
  | 'queueClear'
  | 'reviewQueue'
  | 'constraintConditions'
  | 'constraintBody'
  | 'heightConstraint'
  | 'precisionConstraint'
  | 'landingBan'
  | 'windConstraint'
  | 'obstacleConstraint'
  | 'largeDecision'
  | 'preciseTelemetryClosed';

type OpsWorkspace = 'drone' | 'locker';

const OPS_COPY: Record<'en' | 'ja', Record<OpsCopyKey, string>> = {
  en: {
    acceptedAccess: 'Accepted access',
    returnToMap: 'Return to AGID map',
    subtitle: 'Reachability evidence, locker handoff, and local MQTT/HTTP/Modbus simulation.',
    language: 'Display language',
    reset: 'Reset run',
    workspace: 'Workspace',
    switchMode: 'Split operations',
    splitBody: 'Drone reachability and locker/PUDO hardware work are separated so each team sees only the constraints, decisions, and receipts they need.',
    droneOps: 'Drone Ops',
    droneOpsBody: 'Reachability, constraints, safe handoff, cannot-reach report, and redacted evidence receipt.',
    lockerOps: 'Locker Ops',
    lockerOpsBody: 'QR/NFC access, locker health, protocol queue, release decision, and local hardware receipt.',
    lockerCommandCenter: 'Locker command center',
    lockerCommandCenterBody: 'One screen for QR/NFC proof, locker readiness, local protocol state, and safe release without raw address or payloads.',
    scenario: 'Scenario',
    normal: 'Normal handoff',
    blocked: 'Blocked access',
    offline: 'Offline site',
    reachability: 'Reachability',
    locker: 'Locker',
    protocol: 'Protocol',
    report: 'Report',
    runbook: 'Ops runbook',
    runbookBody: 'This is not a drone autopilot. It records drone reachability evidence, tests locker/PUDO readiness, simulates local hardware traffic, and produces redacted receipts for the POS and Review Console.',
    privacyBoundary: 'Privacy boundary',
    privacyBody: 'The surface shows commitments, aliases, coarse regions, protocol metadata, health, and audit hashes only. It does not expose raw addresses, raw AGID, raw AOID, precise telemetry, QR/NFC payloads, PINs, or hardware secrets.',
    droneEvidence: 'Drone reachability evidence',
    lockerSnapshot: 'Locker/PUDO snapshot',
    qrNfcAccess: 'QR / NFC access',
    qrReader: 'QR reader',
    nfcReader: 'NFC reader',
    protocolFrames: 'Local protocol frames',
    safeReport: 'Safe report',
    decision: 'Decision',
    publication: 'Publication',
    confidence: 'Proof status',
    nextAction: 'Next action',
    lockerStatus: 'Locker status',
    offlineQueue: 'Offline queue',
    frames: 'Frames',
    alerts: 'Alerts',
    assignments: 'Assignments',
    commands: 'Commands',
    access: 'Access',
    capabilities: 'Capabilities',
    endpointCatalog: 'API endpoints',
    reachabilityApi: 'Reachability API',
    simulatorApi: 'Locker simulator API',
    notDroneOs: 'Reachability API only',
    noRawAddress: 'No raw address',
    noRawAgidAoid: 'No raw AGID/AOID',
    noTelemetry: 'No precise telemetry',
    noSecrets: 'No device secrets',
    localSimulator: 'Local simulator',
    recentFrames: 'Recent frames',
    warnings: 'Warnings',
    publicProjection: 'Public projection',
    operatorReceipt: 'Operator receipt',
    qrNfcOperations: 'QR / NFC locker operations',
    health: 'Health',
    available: 'Available',
    disabled: 'Disabled',
    commandCenter: 'Ops command center',
    commandCenterBody: 'One screen for the next safe field action: handoff, cannot-reach report, offline sync, or manual review.',
    priorityAction: 'Priority action',
    fieldChecklist: 'Field checklist',
    handoffReadiness: 'Handoff readiness',
    safeHandoff: 'Safe handoff',
    releaseHandoff: 'Release locker handoff and attach the redacted proof receipt.',
    createCannotReach: 'Create a cannot-reach report and move the package to manual handoff.',
    syncWhenOnline: 'Keep protocol frames queued locally and sync when the gateway is online.',
    holdForReview: 'Hold for review',
    routeFallback: 'Route fallback',
    proofBundle: 'Proof bundle',
    evidenceReady: 'Evidence ready',
    manualReview: 'Manual review',
    readerReady: 'Reader ready',
    syncPlan: 'Sync plan',
    queueClear: 'Queue clear',
    reviewQueue: 'Review queue',
    constraintConditions: 'Constraint conditions',
    constraintBody: 'Height, 10cm unit, landing bans, wind, and obstacles are treated as reachability constraints, not aircraft controls.',
    heightConstraint: 'Height',
    precisionConstraint: '10cm unit',
    landingBan: 'Landing ban',
    windConstraint: 'Wind',
    obstacleConstraint: 'Obstacle',
    largeDecision: 'Field decision',
    preciseTelemetryClosed: 'Precise telemetry closed',
  },
  ja: {
    acceptedAccess: '承認済みアクセス',
    returnToMap: 'AGIDマップへ戻る',
    subtitle: '到達証跡、ロッカー引き渡し、MQTT/HTTP/Modbusローカルシミュレーション。',
    language: '表示言語',
    reset: '実行を更新',
    workspace: 'ワークスペース',
    switchMode: '画面を分ける',
    splitBody: 'ドローン到達可否とロッカー/PUDO機器操作を分け、各チームが必要な制約、判定、receiptだけを見られるようにします。',
    droneOps: 'Drone Ops',
    droneOpsBody: '到達可否、制約条件、安全な引き渡し、到達不可レポート、redacted evidence receiptを扱います。',
    lockerOps: 'Locker Ops',
    lockerOpsBody: 'QR/NFCアクセス、ロッカー状態、通信キュー、解放判定、ローカル機器receiptを扱います。',
    lockerCommandCenter: 'ロッカーコマンドセンター',
    lockerCommandCenterBody: 'QR/NFC証明、ロッカー準備状態、ローカル通信、解放可否を1画面で判断し、実住所やpayloadは表示しません。',
    scenario: 'シナリオ',
    normal: '通常引き渡し',
    blocked: 'アクセス不可',
    offline: 'オフライン拠点',
    reachability: '到達可否',
    locker: 'ロッカー',
    protocol: 'プロトコル',
    report: 'レポート',
    runbook: '運用Runbook',
    runbookBody: 'これはドローン自動操縦OSではありません。ドローンの到達証跡、ロッカー/PUDOの準備状態、ローカル機器通信、POSとReview Console向けのredacted receiptを扱います。',
    privacyBoundary: 'プライバシー境界',
    privacyBody: '画面に出すのはcommitment、alias、粗い地域、プロトコルメタデータ、ヘルス、監査hashだけです。実住所、AGID本体、AOID本体、精密テレメトリ、QR/NFC payload、PIN、機器secretは表示しません。',
    droneEvidence: 'ドローン到達証跡',
    lockerSnapshot: 'ロッカー/PUDO状態',
    qrNfcAccess: 'QR / NFCアクセス',
    qrReader: 'QRリーダー',
    nfcReader: 'NFCリーダー',
    protocolFrames: 'ローカル通信フレーム',
    safeReport: '安全レポート',
    decision: '判定',
    publication: '公開状態',
    confidence: '証明状態',
    nextAction: '次の操作',
    lockerStatus: 'ロッカー状態',
    offlineQueue: 'オフラインキュー',
    frames: 'フレーム',
    alerts: 'アラート',
    assignments: '割当',
    commands: 'コマンド',
    access: 'アクセス',
    capabilities: 'Capability',
    endpointCatalog: 'APIエンドポイント',
    reachabilityApi: '到達可否API',
    simulatorApi: 'ロッカーシミュレータAPI',
    notDroneOs: '到達可否APIのみ',
    noRawAddress: '実住所なし',
    noRawAgidAoid: 'AGID/AOID本体なし',
    noTelemetry: '精密テレメトリなし',
    noSecrets: '機器secretなし',
    localSimulator: 'ローカルシミュレータ',
    recentFrames: '最近のフレーム',
    warnings: '警告',
    publicProjection: '公開projection',
    operatorReceipt: 'Operator receipt',
    qrNfcOperations: 'QR / NFCロッカー操作',
    health: 'ヘルス',
    available: '利用可能',
    disabled: '停止中',
    commandCenter: '運用コマンドセンター',
    commandCenterBody: '次に安全に行う現場操作を1画面で判断します。引き渡し、到達不可レポート、オフライン同期、手動確認を分けます。',
    priorityAction: '優先アクション',
    fieldChecklist: '現場チェックリスト',
    handoffReadiness: '引き渡し準備',
    safeHandoff: '安全な引き渡し',
    releaseHandoff: 'ロッカー引き渡しを実行し、redacted proof receiptを添付します。',
    createCannotReach: '到達不可レポートを作成し、荷物を手動引き渡しへ回します。',
    syncWhenOnline: 'プロトコルフレームをローカルに保持し、ゲートウェイ復帰後に同期します。',
    holdForReview: '確認待ち',
    routeFallback: '代替ルート',
    proofBundle: '証跡バンドル',
    evidenceReady: '証跡準備済み',
    manualReview: '手動確認',
    readerReady: 'リーダー準備',
    syncPlan: '同期計画',
    queueClear: 'キューなし',
    reviewQueue: '確認キュー',
    constraintConditions: '制約条件',
    constraintBody: '高さ、10cm単位、着陸禁止、風、障害物は操縦入力ではなく、到達可能性と安全な引き渡しの制約条件として扱います。',
    heightConstraint: '高さ',
    precisionConstraint: '10cm単位',
    landingBan: '着陸禁止',
    windConstraint: '風',
    obstacleConstraint: '障害物',
    largeDecision: '現場判定',
    preciseTelemetryClosed: '精密テレメトリ非表示',
  },
};

function readStoredLanguage() {
  try {
    return normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || 'ja');
  } catch {
    return 'ja';
  }
}

function translate(language: string, key: OpsCopyKey) {
  return OPS_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function returnToMap() {
  window.location.href = '/';
}

function statusTone(status: string) {
  if (status === 'ready' || status === 'completed' || status === 'attach-to-handoff-report') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (status === 'blocked' || status === 'cannot-reach' || status === 'share-restricted-operator-receipt') {
    return 'border-rose-200 bg-rose-50 text-rose-800';
  }
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function MetricTile(props: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: string;
}) {
  const Icon = props.icon;
  return (
    <div className={cn('min-h-[88px] rounded-lg border bg-white p-4 shadow-sm', props.tone ?? 'border-slate-200')}>
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">{props.label}</p>
      </div>
      <div className="mt-3 truncate text-lg font-black text-slate-950">{props.value}</div>
    </div>
  );
}

function FlowTile(props: {
  step: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  const Icon = props.icon;
  return (
    <div className={cn(
      'flex min-h-[78px] items-center gap-3 rounded-lg border px-4 py-3',
      props.active ? 'border-blue-300 bg-blue-50 text-blue-950' : 'border-slate-200 bg-white text-slate-500',
    )}>
      <span className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
        props.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500',
      )}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-widest">0{props.step}</span>
        <span className="block truncate text-sm font-black">{props.title}</span>
      </span>
    </div>
  );
}

function ProtocolTotals(props: { simulation: WarehouseLockerLocalSimulation }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {Object.entries(props.simulation.protocolTotals).map(([protocol, totals]) => (
        <div key={protocol} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{protocol}</p>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-bold text-slate-600">
            <span>in {totals.inbound}</span>
            <span>out {totals.outbound}</span>
            <span>ack {totals.acknowledged}</span>
            <span>queue {totals.queuedOffline}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PrivacyPill(props: { label: string }) {
  return (
    <span className="inline-flex min-h-[30px] items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-800">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {props.label}
    </span>
  );
}

type OpsActionTone = 'good' | 'work' | 'warn';

function opsActionTone(tone: OpsActionTone) {
  if (tone === 'good') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (tone === 'warn') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-blue-200 bg-blue-50 text-blue-950';
}

function OpsActionRow(props: {
  label: string;
  value: string;
  detail: string;
  tone: OpsActionTone;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const Icon = props.icon;
  return (
    <div className={cn('rounded-lg border p-3', opsActionTone(props.tone))}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/70">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{props.label}</p>
          <p className="mt-1 text-sm font-black">{props.value}</p>
          <p className="mt-1 text-xs font-bold leading-5 opacity-80">{props.detail}</p>
        </div>
      </div>
    </div>
  );
}

function decisionTone(decision: DroneOpsFieldDecision) {
  if (decision === 'safe-handoff') return 'border-emerald-300 bg-emerald-50 text-emerald-950';
  if (decision === 'cannot-reach') return 'border-rose-300 bg-rose-50 text-rose-950';
  return 'border-amber-300 bg-amber-50 text-amber-950';
}

function DecisionTriad(props: {
  decision: DroneOpsFieldDecision;
  t: (key: OpsCopyKey) => string;
}) {
  const items: Array<{ decision: DroneOpsFieldDecision; label: string; detail: string; icon: React.ComponentType<{ className?: string }> }> = [
    {
      decision: 'safe-handoff',
      label: 'safe handoff',
      detail: props.t('releaseHandoff'),
      icon: ShieldCheck,
    },
    {
      decision: 'hold-for-review',
      label: 'hold for review',
      detail: props.t('holdForReview'),
      icon: AlertTriangle,
    },
    {
      decision: 'cannot-reach',
      label: 'cannot reach',
      detail: props.t('createCannotReach'),
      icon: MapPinOff,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map(item => {
        const Icon = item.icon;
        const active = item.decision === props.decision;
        return (
          <div
            key={item.decision}
            className={cn(
              'min-h-[112px] rounded-xl border p-4 shadow-sm',
              active ? decisionTone(item.decision) : 'border-white/10 bg-white/[0.06] text-slate-300',
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-md',
                active ? 'bg-white/75' : 'bg-white/10',
              )}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{props.t('largeDecision')}</p>
                <p className="truncate text-lg font-black">{item.label}</p>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 opacity-80">{item.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

function constraintLabelKey(kind: DroneOpsConstraint['kind']): OpsCopyKey {
  if (kind === 'height') return 'heightConstraint';
  if (kind === 'precision') return 'precisionConstraint';
  if (kind === 'landing-ban') return 'landingBan';
  if (kind === 'wind') return 'windConstraint';
  return 'obstacleConstraint';
}

function constraintTone(status: DroneOpsConstraint['status']) {
  if (status === 'pass') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (status === 'blocked') return 'border-rose-200 bg-rose-50 text-rose-900';
  return 'border-amber-200 bg-amber-50 text-amber-900';
}

function ConstraintPanel(props: {
  constraints: DroneOpsConstraint[];
  t: (key: OpsCopyKey) => string;
}) {
  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{props.t('constraintConditions')}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">高さ / 10cm単位 / 着陸禁止 / 風 / 障害物</h2>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600">{props.t('constraintBody')}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          {props.t('preciseTelemetryClosed')}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {props.constraints.map(constraint => (
          <div key={constraint.constraintId} className={cn('rounded-lg border p-3 shadow-sm', constraintTone(constraint.status))}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{props.t(constraintLabelKey(constraint.kind))}</p>
                <p className="mt-1 text-sm font-black">{constraint.status}</p>
              </div>
              <span className="rounded-md bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                {constraint.publicRef}
              </span>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 opacity-80">{constraint.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OpsWorkspaceSwitch(props: {
  activeWorkspace: OpsWorkspace;
  onChange: (workspace: OpsWorkspace) => void;
  simulation: WarehouseLockerLocalSimulation;
  droneReceipt: ReturnType<typeof createDroneOpsReceipt>;
  t: (key: OpsCopyKey) => string;
}) {
  const { activeWorkspace, onChange, simulation, droneReceipt, t } = props;
  const workspaces: Array<{
    id: OpsWorkspace;
    title: string;
    body: string;
    icon: React.ComponentType<{ className?: string }>;
    stat: string;
  }> = [
    {
      id: 'drone',
      title: t('droneOps'),
      body: t('droneOpsBody'),
      icon: MapPinOff,
      stat: droneReceipt.decision,
    },
    {
      id: 'locker',
      title: t('lockerOps'),
      body: t('lockerOpsBody'),
      icon: Boxes,
      stat: `${simulation.lockerSnapshot.health.compartmentTotals.available} ${t('available')}`,
    },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('workspace')}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{t('switchMode')}</h2>
          <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-600">{t('splitBody')}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          {t('noRawAddress')}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2" role="tablist" aria-label={t('workspace')}>
        {workspaces.map(workspace => {
          const Icon = workspace.icon;
          const active = workspace.id === activeWorkspace;
          return (
            <button
              key={workspace.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(workspace.id)}
              className={cn(
                'min-h-[116px] rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                active
                  ? 'border-slate-950 bg-slate-950 text-white shadow-xl shadow-slate-950/15'
                  : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-blue-300 hover:bg-white',
              )}
            >
              <span className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <span className="flex min-w-0 items-start gap-3">
                  <span className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-md',
                    active ? 'bg-white text-slate-950' : 'bg-white text-slate-700',
                  )}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-lg font-black">{workspace.title}</span>
                    <span className={cn('mt-1 block text-sm font-bold leading-5', active ? 'text-slate-200' : 'text-slate-600')}>
                      {workspace.body}
                    </span>
                  </span>
                </span>
                <span className={cn(
                  'self-start break-words rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-widest sm:shrink-0',
                  active ? 'bg-white/12 text-white' : 'bg-white text-slate-600',
                )}>
                  {workspace.stat}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LockerDecisionTriad(props: {
  simulation: WarehouseLockerLocalSimulation;
  qrNfcOperations: ReturnType<typeof buildLockerOpsQrNfcOperations>;
  t: (key: OpsCopyKey) => string;
}) {
  const accepted = props.qrNfcOperations.filter(operation => operation.status === 'accepted').length;
  const review = props.qrNfcOperations.filter(operation => operation.status !== 'accepted').length;
  const items = [
    {
      label: props.t('qrNfcAccess'),
      value: `${accepted} ${props.t('acceptedAccess')}`,
      detail: review > 0 ? `${review} ${props.t('reviewQueue')}` : props.t('readerReady'),
      icon: LockKeyhole,
      status: review > 0 ? 'attention' : 'ready',
    },
    {
      label: props.t('lockerStatus'),
      value: props.simulation.status,
      detail: `${props.simulation.lockerSnapshot.health.compartmentTotals.available} ${props.t('available')}`,
      icon: Boxes,
      status: props.simulation.status,
    },
    {
      label: props.t('syncPlan'),
      value: props.simulation.state.offlineQueue > 0 ? props.t('syncWhenOnline') : props.t('queueClear'),
      detail: `${props.simulation.frames.length} ${props.t('frames')}`,
      icon: Router,
      status: props.simulation.state.offlineQueue > 0 ? 'attention' : 'ready',
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={cn('min-h-[112px] rounded-xl border p-4 shadow-sm', statusTone(item.status))}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/75">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{item.label}</p>
                <p className="truncate text-lg font-black">{item.value}</p>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 opacity-80">{item.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

export const DroneLockerOpsScreen: React.FC = () => {
  const [appLanguage, setAppLanguage] = React.useState(readStoredLanguage);
  const [scenario, setScenario] = React.useState<OpsScenario>('normal');
  const [activeWorkspace, setActiveWorkspace] = React.useState<OpsWorkspace>('drone');
  const [runNonce, setRunNonce] = React.useState(0);
  const t = React.useCallback((key: OpsCopyKey) => translate(appLanguage, key), [appLanguage]);

  const generatedAt = React.useMemo(() => scenarioTime(scenario, runNonce), [runNonce, scenario]);
  const simulation = React.useMemo(
    () => buildLockerOpsSimulation(scenario, generatedAt),
    [generatedAt, scenario],
  );
  const droneReceipt = React.useMemo(
    () => createDroneOpsReceipt(scenario, generatedAt),
    [generatedAt, scenario],
  );
  const fieldDecision = React.useMemo(() => droneFieldDecisionFor(scenario), [scenario]);
  const constraints = React.useMemo(() => buildDroneOpsConstraintSet(scenario), [scenario]);
  const droneCapabilities = React.useMemo(() => listDroneOpsCapabilities(), []);
  const simulatorCapabilities = React.useMemo(() => listLockerOpsCapabilities(), []);
  const qrNfcOperations = React.useMemo(
    () => buildLockerOpsQrNfcOperations(simulation),
    [simulation],
  );
  const droneApiCatalog = React.useMemo(() => [
    [t('reachabilityApi'), apiEndpoints.droneDeliveryEvidenceCapabilities()],
    [t('reachabilityApi'), apiEndpoints.droneDeliveryEvidenceReport()],
  ], [t]);
  const lockerApiCatalog = React.useMemo(() => [
    [t('simulatorApi'), apiEndpoints.warehouseLockerSimulatorCapabilities()],
    [t('simulatorApi'), apiEndpoints.warehouseLockerSimulatorRun()],
  ], [t]);
  const acceptedAccessCount = qrNfcOperations.filter(operation => operation.status === 'accepted').length;
  const reviewAccessCount = qrNfcOperations.filter(operation => (
    operation.status === 'review' ||
    operation.status === 'reader-unavailable' ||
    operation.status === 'rejected'
  )).length;
  const handoffReady = droneReceipt.validation.valid && simulation.status !== 'blocked' && simulation.state.offlineQueue === 0;
  const priorityAction = fieldDecision === 'cannot-reach'
    ? t('createCannotReach')
    : simulation.state.offlineQueue > 0
      ? t('syncWhenOnline')
      : fieldDecision === 'safe-handoff' && handoffReady
        ? t('releaseHandoff')
        : t('holdForReview');
  const fieldActions = [
    {
      label: t('proofBundle'),
      value: droneReceipt.validation.valid ? t('evidenceReady') : t('manualReview'),
      detail: droneReceipt.validation.valid ? droneReceipt.receiptId : droneReceipt.validation.errors.join(', '),
      tone: droneReceipt.validation.valid ? 'good' as const : 'warn' as const,
      icon: FileCheck2,
    },
    {
      label: t('qrNfcAccess'),
      value: `${acceptedAccessCount} ${t('acceptedAccess')}`,
      detail: reviewAccessCount > 0 ? `${reviewAccessCount} ${t('reviewQueue')}` : t('readerReady'),
      tone: reviewAccessCount > 0 ? 'warn' as const : 'good' as const,
      icon: LockKeyhole,
    },
    {
      label: t('syncPlan'),
      value: simulation.state.offlineQueue > 0 ? t('syncWhenOnline') : t('queueClear'),
      detail: `${simulation.state.offlineQueue} ${t('offlineQueue')} / ${simulation.frames.length} ${t('frames')}`,
      tone: simulation.state.offlineQueue > 0 ? 'work' as const : 'good' as const,
      icon: WifiOff,
    },
    {
      label: t('routeFallback'),
      value: fieldDecision === 'cannot-reach' ? t('createCannotReach') : t('safeHandoff'),
      detail: droneReceipt.nextAction,
      tone: scenario === 'blocked' ? 'warn' as const : 'work' as const,
      icon: MapPinOff,
    },
  ];
  const lockerPriorityAction = simulation.state.offlineQueue > 0
    ? t('syncWhenOnline')
    : reviewAccessCount > 0 || simulation.status !== 'ready'
      ? t('holdForReview')
      : t('releaseHandoff');
  const visiblePriorityAction = activeWorkspace === 'drone' ? priorityAction : lockerPriorityAction;
  const commandTitle = activeWorkspace === 'drone' ? t('priorityAction') : t('lockerCommandCenter');
  const commandBody = activeWorkspace === 'drone' ? t('commandCenterBody') : t('lockerCommandCenterBody');
  const commandBadge = activeWorkspace === 'drone'
    ? fieldDecision === 'safe-handoff'
      ? t('safeHandoff')
      : fieldDecision === 'cannot-reach'
        ? 'cannot reach'
        : 'hold for review'
    : simulation.status;
  const commandBadgeTone = activeWorkspace === 'drone'
    ? fieldDecision === 'safe-handoff'
      ? 'border-emerald-300 bg-emerald-400/15 text-emerald-100'
      : fieldDecision === 'cannot-reach'
        ? 'border-rose-300 bg-rose-400/15 text-rose-100'
        : 'border-amber-300 bg-amber-400/15 text-amber-100'
    : simulation.status === 'ready'
      ? 'border-emerald-300 bg-emerald-400/15 text-emerald-100'
      : 'border-amber-300 bg-amber-400/15 text-amber-100';
  const lockerActions = [
    {
      label: t('qrNfcAccess'),
      value: `${acceptedAccessCount} ${t('acceptedAccess')}`,
      detail: reviewAccessCount > 0 ? `${reviewAccessCount} ${t('reviewQueue')}` : t('readerReady'),
      tone: reviewAccessCount > 0 ? 'warn' as const : 'good' as const,
      icon: LockKeyhole,
    },
    {
      label: t('lockerStatus'),
      value: simulation.status,
      detail: `${simulation.lockerSnapshot.health.compartmentTotals.available} ${t('available')}`,
      tone: simulation.status === 'ready' ? 'good' as const : 'warn' as const,
      icon: Boxes,
    },
    {
      label: t('syncPlan'),
      value: simulation.state.offlineQueue > 0 ? t('syncWhenOnline') : t('queueClear'),
      detail: `${simulation.state.offlineQueue} ${t('offlineQueue')} / ${simulation.frames.length} ${t('frames')}`,
      tone: simulation.state.offlineQueue > 0 ? 'work' as const : 'good' as const,
      icon: WifiOff,
    },
    {
      label: t('protocol'),
      value: `${simulation.state.commandFrames} ${t('commands')}`,
      detail: simulatorCapabilities.protocols.join(' / '),
      tone: 'work' as const,
      icon: Router,
    },
  ];
  const activeActions = activeWorkspace === 'drone' ? fieldActions : lockerActions;
  const commandMetrics = activeWorkspace === 'drone'
    ? [
      [t('handoffReadiness'), handoffReady ? t('available') : t('manualReview')],
      [t('acceptedAccess'), acceptedAccessCount],
      [t('offlineQueue'), simulation.state.offlineQueue],
      [t('warnings'), simulation.warnings.length + droneReceipt.warnings.length],
    ]
    : [
      [t('lockerStatus'), simulation.status],
      [t('qrReader'), simulation.lockerSnapshot.health.readerTotals.qrReady],
      [t('nfcReader'), simulation.lockerSnapshot.health.readerTotals.nfcReady],
      [t('offlineQueue'), simulation.state.offlineQueue],
    ];
  const flowItems = activeWorkspace === 'drone'
    ? [
      { step: 1, title: t('reachability'), icon: MapPinOff, active: true },
      { step: 2, title: t('constraintConditions'), icon: ShieldCheck, active: fieldDecision !== 'cannot-reach' },
      { step: 3, title: t('safeHandoff'), icon: PackageCheck, active: handoffReady },
      { step: 4, title: t('report'), icon: FileCheck2, active: droneReceipt.validation.valid },
    ]
    : [
      { step: 1, title: t('qrNfcAccess'), icon: LockKeyhole, active: acceptedAccessCount > 0 },
      { step: 2, title: t('lockerStatus'), icon: Boxes, active: simulation.status !== 'blocked' },
      { step: 3, title: t('protocol'), icon: Router, active: simulation.state.offlineQueue === 0 },
      { step: 4, title: t('operatorReceipt'), icon: FileCheck2, active: simulation.frames.length > 0 },
    ];

  React.useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = getLanguageDirection(appLanguage);
    try {
      localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage);
    } catch {
      // The app remains usable without persisted preferences.
    }
  }, [appLanguage]);

  const scenarioButtons: Array<{ id: OpsScenario; label: string }> = OPS_SCENARIOS.map(id => ({
    id,
    label: t(id),
  }));
  const recentFrames = simulation.frames.slice(-7).reverse();
  const publicProjection = droneReceipt.publicApiProjection;

  return (
    <div className="agid-fixed-page-scroll fixed inset-0 z-[210] bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/60 md:px-6">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={returnToMap}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-900 hover:text-white active:scale-95"
              aria-label={t('returnToMap')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white sm:flex">
              <Boxes className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black text-slate-950 md:text-xl">AGID Drone / Locker Ops</h1>
              <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-500">{t('subtitle')}</p>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
            <select
              value={appLanguage}
              onChange={event => setAppLanguage(normalizeAppLanguage(event.target.value))}
              className="h-10 max-w-[190px] rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              aria-label={t('language')}
            >
              {APP_LANGUAGES.map(language => (
                <option key={language.code} value={language.code}>{language.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setRunNonce(value => value + 1)}
              className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-900 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{t('reset')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-3 py-4 md:px-5">
        <OpsWorkspaceSwitch
          activeWorkspace={activeWorkspace}
          onChange={setActiveWorkspace}
          simulation={simulation}
          droneReceipt={droneReceipt}
          t={t}
        />

        <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_440px]">
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/60">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">{t('commandCenter')}</p>
                <h2 className="mt-2 text-2xl font-black tracking-normal md:text-3xl">{commandTitle}</h2>
                <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-300">{commandBody}</p>
              </div>
              <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest', commandBadgeTone)}>
                {commandBadge}
              </span>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('nextAction')}</p>
              <p className="mt-2 text-lg font-black leading-7 text-white">{visiblePriorityAction}</p>
            </div>

            <div className="mt-4">
              {activeWorkspace === 'drone'
                ? <DecisionTriad decision={fieldDecision} t={t} />
                : <LockerDecisionTriad simulation={simulation} qrNfcOperations={qrNfcOperations} t={t} />}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {commandMetrics.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-2 truncate text-base font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('fieldChecklist')}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{t('runbook')}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                {t(scenario)}
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              {activeActions.map(action => (
                <OpsActionRow
                  key={action.label}
                  label={action.label}
                  value={action.value}
                  detail={action.detail}
                  tone={action.tone}
                  icon={action.icon}
                />
              ))}
            </div>
          </aside>
        </section>

        {activeWorkspace === 'drone' && <ConstraintPanel constraints={constraints} t={t} />}

        <section className="mt-4 grid gap-3 lg:grid-cols-4">
          {flowItems.map(item => (
            <FlowTile key={item.step} step={item.step} title={item.title} icon={item.icon} active={item.active} />
          ))}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_420px]">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-950">
            <p className="text-[10px] font-black uppercase tracking-widest">{t('runbook')}</p>
            <p className="mt-2 text-sm font-bold leading-6">{t('runbookBody')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {scenarioButtons.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScenario(item.id)}
                  className={cn(
                    'h-10 rounded-md px-4 text-xs font-black uppercase tracking-wider transition',
                    scenario === item.id
                      ? 'bg-blue-700 text-white shadow-lg shadow-blue-900/20'
                      : 'border border-blue-200 bg-white text-blue-800 hover:bg-blue-100',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800">
              <LockKeyhole className="h-5 w-5" />
              <p className="text-[10px] font-black uppercase tracking-widest">{t('privacyBoundary')}</p>
            </div>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{t('privacyBody')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <PrivacyPill label={t('notDroneOs')} />
              <PrivacyPill label={t('noRawAddress')} />
              <PrivacyPill label={t('noRawAgidAoid')} />
              <PrivacyPill label={t('noTelemetry')} />
              <PrivacyPill label={t('noSecrets')} />
            </div>
          </aside>
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-4">
          {activeWorkspace === 'drone' ? (
            <>
              <MetricTile
                label={t('decision')}
                value={droneReceipt.decision}
                icon={ShieldCheck}
                tone={statusTone(droneReceipt.decision)}
              />
              <MetricTile
                label={t('confidence')}
                value={formatPublicConfidenceBand(publicProjection.confidence, appLanguage)}
                icon={FileCheck2}
              />
              <MetricTile
                label={t('warnings')}
                value={droneReceipt.warnings.length}
                icon={AlertTriangle}
                tone={droneReceipt.warnings.length ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}
              />
              <MetricTile
                label={t('report')}
                value={publicProjection.reportId}
                icon={MapPinOff}
              />
            </>
          ) : (
            <>
              <MetricTile
                label={t('lockerStatus')}
                value={simulation.status}
                icon={Boxes}
                tone={statusTone(simulation.status)}
              />
              <MetricTile
                label={t('offlineQueue')}
                value={simulation.state.offlineQueue}
                icon={WifiOff}
                tone={simulation.state.offlineQueue ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}
              />
              <MetricTile label={t('frames')} value={simulation.frames.length} icon={Router} />
              <MetricTile label={t('commands')} value={simulation.state.commandFrames} icon={FileCheck2} />
            </>
          )}
        </section>

        <section className="mt-4">
          {activeWorkspace === 'drone' && (
          <div className="space-y-4" data-ops-workspace-panel="drone">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('droneEvidence')}</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{publicProjection.outcome}</h2>
                </div>
                <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest', statusTone(droneReceipt.decision))}>
                  {publicProjection.publicationState}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  [t('decision'), droneReceipt.decision],
                  [t('publication'), publicProjection.publicationState],
                  [t('confidence'), formatPublicConfidenceBand(publicProjection.confidence, appLanguage)],
                  ['TTL', `${publicProjection.ttlSeconds}s`],
                  ['receipt', droneReceipt.receiptId],
                  ['report', publicProjection.reportId],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-1 break-all text-xs font-black text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('nextAction')}</p>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-700">{droneReceipt.nextAction}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('operatorReceipt')}</p>
              <div className="mt-3 grid gap-2">
                {[
                  ['receiptCommitment', droneReceipt.restrictedOperatorReceipt.receiptCommitment],
                  ['reachabilityCommitment', droneReceipt.restrictedOperatorReceipt.reachabilityCommitment],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-1 break-all font-mono text-[11px] font-bold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {droneReceipt.restrictedOperatorReceipt.sensitiveTags.map(tag => (
                  <span key={tag} className="rounded-md bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700">
                    {tag}
                  </span>
                ))}
                {droneReceipt.restrictedOperatorReceipt.closedFields.map(field => (
                  <span key={field} className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-800">
                    closed:{field}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('capabilities')}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                  Drone API: {droneCapabilities.outcomes.length} outcomes
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                  Outcomes: {droneCapabilities.outcomes.join(' / ')}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {droneCapabilities.notInScope.slice(0, 4).map(item => (
                  <span key={item} className="rounded-md bg-slate-950 px-2 py-1 text-[10px] font-black text-white">
                  not: {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('endpointCatalog')}</p>
              <div className="mt-3 grid gap-2">
                {droneApiCatalog.map(([label, endpoint]) => (
                  <div key={endpoint} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-1 break-all font-mono text-[11px] font-black text-slate-800">{endpoint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {activeWorkspace === 'locker' && (
          <div className="space-y-4" data-ops-workspace-panel="locker">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('lockerSnapshot')}</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{simulation.lockerSnapshot.site.label}</h2>
                </div>
                <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest', statusTone(simulation.lockerSnapshot.status))}>
                  {simulation.lockerSnapshot.status}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {[
                  [t('available'), simulation.lockerSnapshot.health.compartmentTotals.available],
                  [t('disabled'), simulation.lockerSnapshot.health.compartmentTotals.disabled],
                  [t('assignments'), simulation.lockerSnapshot.reservationPlan.assignments.length],
                  [t('access'), simulation.lockerSnapshot.accessDecisions.length],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('qrNfcAccess')}</p>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {simulation.lockerSnapshot.health.readerTotals.online}/{simulation.lockerSnapshot.health.readerTotals.total} online
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {simulation.lockerSnapshot.site.readers.map(reader => (
                    <div key={reader.readerId} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-black text-slate-900">{reader.label}</span>
                        <span className={cn(
                          'rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest',
                          reader.status === 'online' && !reader.tamperDetected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
                        )}>
                          {reader.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[11px] font-bold text-slate-500">
                        {reader.supportedMethods.join(' / ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('qrNfcOperations')}</p>
                <div className="mt-3 grid gap-2">
                  {qrNfcOperations.map(operation => (
                    <div key={operation.operationId} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-slate-900">
                            {operation.channel.toUpperCase()} - {operation.publicAction}
                          </p>
                          <p className="mt-1 truncate font-mono text-[11px] font-bold text-slate-500">
                            {operation.readerId ?? 'reader-missing'} / {operation.protocol ?? 'manual'}
                          </p>
                        </div>
                        <span className={cn(
                          'rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest',
                          operation.status === 'accepted' && 'bg-emerald-100 text-emerald-800',
                          operation.status === 'awaiting-proof' && 'bg-blue-100 text-blue-800',
                          operation.status === 'queued-offline' && 'bg-amber-100 text-amber-800',
                          operation.status === 'reader-unavailable' && 'bg-rose-100 text-rose-800',
                          operation.status === 'rejected' && 'bg-rose-100 text-rose-800',
                          operation.status === 'review' && 'bg-amber-100 text-amber-800',
                        )}>
                          {operation.status}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <p className="truncate text-[11px] font-bold text-slate-600">
                          compartment: {operation.compartmentId ?? 'pending'}
                        </p>
                        <p className="truncate text-[11px] font-bold text-slate-600">
                          frame: {operation.frameId ?? 'not-dispatched'}
                        </p>
                      </div>
                      <p className="mt-2 break-all font-mono text-[10px] font-bold text-slate-500">
                        receipt {operation.receiptCommitment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {simulation.lockerSnapshot.reservationPlan.assignments.map(assignment => (
                  <div key={assignment.reservationId} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">{assignment.reservationId}</span>
                      <span className={cn(
                        'rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest',
                        assignment.status === 'assigned' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
                      )}>
                        {assignment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-600">
                      compartment: {assignment.compartmentId ?? assignment.reason ?? 'pending'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('localSimulator')}</p>
              <div className="mt-3">
                <ProtocolTotals simulation={simulation} />
              </div>
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('capabilities')}</p>
                <p className="mt-1 text-xs font-bold text-slate-600">{simulatorCapabilities.protocols.join(' / ')}</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                  MQTT topics: {simulation.state.mqttTopicCount}
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                  HTTP endpoints: {simulation.state.httpEndpointCount}
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                  Modbus registers: {simulation.state.modbusRegisterCount}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('recentFrames')}</p>
              <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
                <div className="grid grid-cols-[88px_90px_1fr_96px] bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                  <span>Protocol</span>
                  <span>Status</span>
                  <span>Operation</span>
                  <span>Target</span>
                </div>
                {recentFrames.map(frame => (
                  <div key={frame.frameId} className="grid grid-cols-[88px_90px_1fr_96px] border-t border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
                    <span className="font-black uppercase">{frame.protocol}</span>
                    <span className={cn(
                      'truncate',
                      frame.status === 'acknowledged' && 'text-emerald-700',
                      frame.status === 'queued-offline' && 'text-amber-700',
                      frame.status === 'manual-required' && 'text-rose-700',
                    )}>
                      {frame.status}
                    </span>
                    <span className="truncate">{frame.operation}</span>
                    <span className="truncate font-mono text-[11px]">{frame.targetId ?? frame.targetType}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('warnings')}</p>
              <div className="mt-3 grid gap-2">
                {simulation.warnings.slice(0, 8).map(warning => (
                  <div key={warning} className="rounded-md bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                    {warning}
                  </div>
                ))}
                {simulation.warnings.length === 0 && (
                  <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">none</div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('endpointCatalog')}</p>
              <div className="mt-3 grid gap-2">
                {lockerApiCatalog.map(([label, endpoint]) => (
                  <div key={endpoint} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-1 break-all font-mono text-[11px] font-black text-slate-800">{endpoint}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-md bg-slate-950 p-3 text-[11px] font-bold leading-5 text-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('privacyBoundary')}</p>
                <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(simulation.privacy, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          )}
        </section>
      </main>
    </div>
  );
};
