import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  Nfc,
  PackageCheck,
  QrCode,
  RefreshCw,
  Router,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import React from 'react';

import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import {
  buildOpenLockerPudoSimulation,
  listOpenLockerPudoSimulatorCapabilities,
  OPEN_LOCKER_PUDO_SCENARIOS,
  type OpenLockerPudoScenario,
  type OpenLockerPudoSimulation,
} from '../lib/openLockerPudoSimulator';
import { cn } from '../lib/utils';

type LockerPudoCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'language'
  | 'reset'
  | 'workspace'
  | 'switchMode'
  | 'scenario'
  | 'modeBody'
  | 'lockerConsole'
  | 'lockerConsoleBody'
  | 'pudoDesk'
  | 'pudoDeskBody'
  | 'pickupSuccess'
  | 'fullCapacity'
  | 'readerFailure'
  | 'offlineSync'
  | 'highRisk'
  | 'localOnly'
  | 'decision'
  | 'nextAction'
  | 'pudoCounter'
  | 'lockerBank'
  | 'manualHandoff'
  | 'offlineQueue'
  | 'timeline'
  | 'protocolFrames'
  | 'eventLog'
  | 'privacyBoundary'
  | 'privacyBody'
  | 'oneScreenFlow'
  | 'lockerStatusBoard'
  | 'aliasConditions'
  | 'recipientAlias'
  | 'pickupConditions'
  | 'receiptPolicy'
  | 'storageBoundary'
  | 'noStoredScanSecrets'
  | 'scanLane'
  | 'selectLane'
  | 'unlockLane'
  | 'receiptLane'
  | 'readerHealth'
  | 'selectedLocker'
  | 'unlockDecision'
  | 'openDecision'
  | 'holdDecision'
  | 'rejectDecision'
  | 'counterQueue'
  | 'safeReceipt'
  | 'publicOnly'
  | 'statusAvailable'
  | 'statusReserved'
  | 'statusFaulty'
  | 'statusOffline'
  | 'statusNeedsCollection'
  | 'pickupPoints'
  | 'siteAlias'
  | 'serviceWindow'
  | 'readers'
  | 'accessMethods'
  | 'addressHidden'
  | 'qrNfc'
  | 'qrReady'
  | 'nfcReady'
  | 'compartments'
  | 'available'
  | 'assigned'
  | 'warnings'
  | 'actions'
  | 'receipts'
  | 'capabilities'
  | 'dropoff'
  | 'reserve'
  | 'proof'
  | 'sync'
  | 'noRawAddress'
  | 'noRawAgidAoid'
  | 'noPayloads'
  | 'noSecrets';

type LockerPudoWorkspace = 'locker' | 'pudo';

const LOCKER_PUDO_COPY: Record<'en' | 'ja', Record<LockerPudoCopyKey, string>> = {
  en: {
    returnToMap: 'Return to AGID map',
    subtitle: 'Open-source Locker/PUDO simulator for QR/NFC intake, local hardware protocols, offline sync, and redacted receipts.',
    language: 'Display language',
    reset: 'Reset run',
    workspace: 'Workspace',
    switchMode: 'Switch mode',
    scenario: 'Scenario',
    modeBody: 'Locker operations and PUDO counter work are separated so staff see only the decision, alias, receipt, and hardware state they need.',
    lockerConsole: 'Locker Console',
    lockerConsoleBody: 'QR/NFC read, compartment selection, unlock decision, and receipt are handled as one hardware-facing flow.',
    pudoDesk: 'PUDO Counter',
    pudoDeskBody: 'Counter staff see recipient alias, pickup conditions, receipt state, and queue status without raw address text.',
    pickupSuccess: 'Pickup success',
    fullCapacity: 'Full capacity',
    readerFailure: 'Reader failure',
    offlineSync: 'Offline sync',
    highRisk: 'High-risk handoff',
    localOnly: 'Local only',
    decision: 'Decision',
    nextAction: 'Next action',
    pudoCounter: 'PUDO counter',
    lockerBank: 'Locker bank',
    manualHandoff: 'Manual handoff',
    offlineQueue: 'Offline queue',
    timeline: 'Run timeline',
    protocolFrames: 'MQTT / HTTP / Modbus frames',
    eventLog: 'Redacted event log',
    privacyBoundary: 'Privacy boundary',
    privacyBody: 'The simulator exposes commitments, aliases, health state, protocol metadata, and audit hashes only. It never stores raw address text, raw AGID, raw AOID, QR/NFC payloads, PINs, precise location, or hardware secrets.',
    oneScreenFlow: 'QR/NFC read → locker selection → unlock decision → receipt',
    lockerStatusBoard: 'Locker status board',
    aliasConditions: 'alias and pickup conditions',
    recipientAlias: 'Recipient alias',
    pickupConditions: 'Pickup conditions',
    receiptPolicy: 'Receipt policy',
    storageBoundary: 'Storage boundary',
    noStoredScanSecrets: 'PIN and QR payload are not stored',
    scanLane: 'Scan lane',
    selectLane: 'Select locker',
    unlockLane: 'Unlock check',
    receiptLane: 'Receipt',
    readerHealth: 'Reader health',
    selectedLocker: 'Selected locker',
    unlockDecision: 'Unlock decision',
    openDecision: 'Open allowed',
    holdDecision: 'Hold for review',
    rejectDecision: 'Do not open',
    counterQueue: 'Counter queue',
    safeReceipt: 'Safe receipt',
    publicOnly: 'Public refs only',
    statusAvailable: 'Available',
    statusReserved: 'Reserved',
    statusFaulty: 'Faulty',
    statusOffline: 'Offline',
    statusNeedsCollection: 'Needs collection',
    pickupPoints: 'PUDO / locker pickup points',
    siteAlias: 'Site alias',
    serviceWindow: 'Service window',
    readers: 'Readers',
    accessMethods: 'Access methods',
    addressHidden: 'Address hidden',
    qrNfc: 'QR / NFC',
    qrReady: 'QR ready',
    nfcReady: 'NFC ready',
    compartments: 'Compartments',
    available: 'Available',
    assigned: 'Assigned',
    warnings: 'Warnings',
    actions: 'Operator actions',
    receipts: 'Receipts',
    capabilities: 'Capabilities',
    dropoff: 'Dropoff',
    reserve: 'Reserve',
    proof: 'Proof',
    sync: 'Sync',
    noRawAddress: 'No raw address',
    noRawAgidAoid: 'No raw AGID/AOID',
    noPayloads: 'No QR/NFC payloads',
    noSecrets: 'No device secrets',
  },
  ja: {
    returnToMap: 'AGIDマップへ戻る',
    subtitle: 'QR/NFC受付、ローカル機器通信、オフライン同期、redacted receiptを試せるOSSロッカー/PUDOシミュレータです。',
    language: '表示言語',
    reset: '実行を更新',
    workspace: 'ワークスペース',
    switchMode: 'モード切替',
    scenario: 'シナリオ',
    modeBody: 'Locker操作とPUDO受付を分け、現場スタッフが必要な判定、alias、receipt、機器状態だけを見られるようにします。',
    lockerConsole: 'Locker Console',
    lockerConsoleBody: 'QR/NFC読取、区画選択、開錠可否、receiptを機器向けフローとして1画面で扱います。',
    pudoDesk: 'PUDO Counter',
    pudoDeskBody: '受付スタッフには実住所ではなく、受取alias、受取条件、receipt状態、キューを中心に表示します。',
    pickupSuccess: '受取成功',
    fullCapacity: '満杯',
    readerFailure: 'リーダー故障',
    offlineSync: 'オフライン同期',
    highRisk: '高リスク引渡',
    localOnly: 'Local only',
    decision: '判定',
    nextAction: '次の操作',
    pudoCounter: 'PUDOカウンター',
    lockerBank: 'ロッカー群',
    manualHandoff: '手動引渡',
    offlineQueue: 'オフラインキュー',
    timeline: '実行タイムライン',
    protocolFrames: 'MQTT / HTTP / Modbusフレーム',
    eventLog: 'Redactedイベントログ',
    privacyBoundary: 'プライバシー境界',
    privacyBody: 'このシミュレータが表示するのはcommitment、alias、ヘルス状態、プロトコルメタデータ、監査hashだけです。実住所、AGID本体、AOID本体、QR/NFC payload、PIN、精密位置、機器secretは保存しません。',
    oneScreenFlow: 'QR/NFC読取 → ロッカー選択 → 開錠可否 → receipt',
    lockerStatusBoard: 'ロッカー状態',
    aliasConditions: 'aliasと受取条件',
    recipientAlias: '受取alias',
    pickupConditions: '受取条件',
    receiptPolicy: 'Receipt方針',
    storageBoundary: '保存境界',
    noStoredScanSecrets: 'PINやQR payloadを保存しません',
    scanLane: '読取レーン',
    selectLane: 'ロッカー選択',
    unlockLane: '開錠確認',
    receiptLane: 'Receipt',
    readerHealth: 'リーダー状態',
    selectedLocker: '選択ロッカー',
    unlockDecision: '開錠判定',
    openDecision: '開錠可',
    holdDecision: '確認待ち',
    rejectDecision: '開錠不可',
    counterQueue: '受付キュー',
    safeReceipt: '安全receipt',
    publicOnly: '公開参照のみ',
    statusAvailable: '空き',
    statusReserved: '予約',
    statusFaulty: '故障',
    statusOffline: 'オフライン',
    statusNeedsCollection: '要回収',
    pickupPoints: 'PUDO / ロッカー受取地点',
    siteAlias: '拠点alias',
    serviceWindow: '受付時間帯',
    readers: 'リーダー',
    accessMethods: '受付方法',
    addressHidden: '住所非表示',
    qrNfc: 'QR / NFC',
    qrReady: 'QR可',
    nfcReady: 'NFC可',
    compartments: '区画',
    available: '空き',
    assigned: '割当',
    warnings: '警告',
    actions: '現場操作',
    receipts: 'Receipt',
    capabilities: 'Capability',
    dropoff: '預入',
    reserve: '予約',
    proof: '証明',
    sync: '同期',
    noRawAddress: '実住所なし',
    noRawAgidAoid: 'AGID/AOID本体なし',
    noPayloads: 'QR/NFC payloadなし',
    noSecrets: '機器secretなし',
  },
};

function readStoredLanguage() {
  try {
    return normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || 'ja');
  } catch {
    return 'ja';
  }
}

function translate(language: string, key: LockerPudoCopyKey) {
  return LOCKER_PUDO_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function returnToMap() {
  window.location.href = '/';
}

function statusTone(status: string) {
  if (status === 'ready' || status === 'completed' || status === 'accept') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'blocked' || status === 'reject') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function scenarioLabel(language: string, scenario: OpenLockerPudoScenario) {
  const map: Record<OpenLockerPudoScenario, LockerPudoCopyKey> = {
    'pickup-success': 'pickupSuccess',
    'full-capacity': 'fullCapacity',
    'reader-failure': 'readerFailure',
    'offline-sync': 'offlineSync',
    'high-risk': 'highRisk',
  };
  return translate(language, map[scenario]);
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

function FlowStep(props: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
}) {
  const Icon = props.icon;
  return (
    <div className={cn('min-h-[84px] rounded-lg border p-3 shadow-sm', statusTone(props.status))}>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/70">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-widest opacity-70">{props.label}</span>
          <span className="block truncate text-sm font-black">{props.value}</span>
        </span>
      </div>
    </div>
  );
}

function fieldFlowIcon(stage: OpenLockerPudoSimulation['fieldFlow'][number]['stage']) {
  if (stage === 'read') return QrCode;
  if (stage === 'select-locker') return Boxes;
  if (stage === 'unlock-decision') return LockKeyhole;
  return FileCheck2;
}

function OneScreenHandoffPanel(props: {
  simulation: OpenLockerPudoSimulation;
  t: (key: LockerPudoCopyKey) => string;
}) {
  const { simulation, t } = props;
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Locker / PUDO handoff</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{t('oneScreenFlow')}</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          {t('noStoredScanSecrets')}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {simulation.fieldFlow.map(step => {
            const Icon = fieldFlowIcon(step.stage);
            return (
              <div key={step.stage} className={cn('rounded-lg border p-3 shadow-sm', statusTone(step.status))}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/75">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{step.label}</p>
                    <p className="mt-1 truncate text-sm font-black">{step.publicRef}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-bold leading-5 opacity-80">{step.detail}</p>
              </div>
            );
          })}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('aliasConditions')}</p>
          <h3 className="mt-2 break-all font-mono text-sm font-black text-slate-950">
            {simulation.pudoSafeIntake.recipientAlias}
          </h3>
          <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-slate-500">
            {t('recipientAlias')} / {simulation.pudoSafeIntake.publicSubjectRef}
          </p>
          <div className="mt-3 grid gap-2">
            {simulation.pudoSafeIntake.pickupConditions.map(condition => (
              <span key={condition} className="rounded-md bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm">
                {condition}
              </span>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-800">
            {t('receiptPolicy')}: {simulation.pudoSafeIntake.receiptPolicy}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
            <span className="rounded-md bg-white px-2 py-2">PIN stored: {String(simulation.pudoSafeIntake.pinStored)}</span>
            <span className="rounded-md bg-white px-2 py-2">QR payload stored: {String(simulation.pudoSafeIntake.qrPayloadStored)}</span>
            <span className="rounded-md bg-white px-2 py-2">NFC stored: {String(simulation.pudoSafeIntake.nfcStored)}</span>
            <span className="rounded-md bg-white px-2 py-2">QR stored: {String(simulation.pudoSafeIntake.qrStored)}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function LockerStatusBoard(props: {
  simulation: OpenLockerPudoSimulation;
  appLanguage: string;
  t: (key: LockerPudoCopyKey) => string;
}) {
  const { simulation, appLanguage, t } = props;
  const useJa = appLanguage.startsWith('ja');
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('lockerStatusBoard')}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">空き / 予約 / 故障 / オフライン / 要回収</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {simulation.lockerStatusLegend.map(item => (
            <span key={item.status} className={cn('rounded-md border px-3 py-2 text-[10px] font-black uppercase tracking-wider', statusTone(item.status))}>
              {useJa ? item.labelJa : item.labelEn}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {simulation.lockerStatusBoard.map(locker => (
          <div key={locker.lockerId} className={cn('rounded-lg border p-4 shadow-sm', statusTone(locker.displayStatus))}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-black">{locker.lockerId}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-70">{locker.publicRef}</p>
              </div>
              <span className="rounded-md border border-current/20 bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                {useJa ? locker.labelJa : locker.labelEn}
              </span>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 opacity-80">{locker.condition}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wider">size {locker.size}</span>
              {locker.accessMethods.slice(0, 3).map(method => (
                <span key={method} className="rounded-md bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wider">{method}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkspaceSwitch(props: {
  activeWorkspace: LockerPudoWorkspace;
  onChange: (workspace: LockerPudoWorkspace) => void;
  simulation: OpenLockerPudoSimulation;
  t: (key: LockerPudoCopyKey) => string;
}) {
  const { activeWorkspace, onChange, simulation, t } = props;
  const health = simulation.lockerSnapshot.health;
  const workspaces: Array<{
    id: LockerPudoWorkspace;
    title: string;
    body: string;
    icon: React.ComponentType<{ className?: string }>;
    stat: string;
  }> = [
    {
      id: 'locker',
      title: t('lockerConsole'),
      body: t('lockerConsoleBody'),
      icon: Boxes,
      stat: `${health.compartmentTotals.available}/${health.compartmentTotals.total} ${t('available')}`,
    },
    {
      id: 'pudo',
      title: t('pudoDesk'),
      body: t('pudoDeskBody'),
      icon: PackageCheck,
      stat: `${simulation.pudoCounter.queueLength} ${t('counterQueue')}`,
    },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('workspace')}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{t('switchMode')}</h2>
          <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-600">{t('modeBody')}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          {t('publicOnly')}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2" role="tablist" aria-label={t('workspace')}>
        {workspaces.map(workspace => {
          const Icon = workspace.icon;
          const active = activeWorkspace === workspace.id;
          return (
            <button
              key={workspace.id}
              type="button"
              onClick={() => onChange(workspace.id)}
              role="tab"
              aria-selected={active}
              className={cn(
                'min-h-[116px] rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                active
                  ? 'border-slate-950 bg-slate-950 text-white shadow-xl shadow-slate-950/15'
                  : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-blue-300 hover:bg-white',
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-start gap-3">
                  <span className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-md',
                    active ? 'bg-white text-slate-950' : 'bg-white text-slate-700',
                  )}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-lg font-black">{workspace.title}</span>
                    <span className={cn(
                      'mt-1 block text-sm font-bold leading-5',
                      active ? 'text-slate-200' : 'text-slate-600',
                    )}>
                      {workspace.body}
                    </span>
                  </span>
                </span>
                <span className={cn(
                  'shrink-0 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-widest',
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

function decisionLabel(t: (key: LockerPudoCopyKey) => string, decision: OpenLockerPudoSimulation['summary']['decision']) {
  if (decision === 'accept') return t('openDecision');
  if (decision === 'review') return t('holdDecision');
  return t('rejectDecision');
}

function WorkspaceActionButton(props: {
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'primary' | 'safe' | 'warn';
}) {
  const Icon = props.icon;
  const tone = props.tone ?? 'primary';
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-[76px] items-center gap-3 rounded-lg border px-4 py-3 text-left shadow-sm transition active:scale-[0.99]',
        tone === 'safe' && 'border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100',
        tone === 'warn' && 'border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100',
        tone === 'primary' && 'border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100',
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/75">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{props.label}</span>
        <span className="mt-1 block text-xs font-bold leading-5 opacity-80">{props.detail}</span>
      </span>
    </button>
  );
}

function LockerConsolePanel(props: {
  simulation: OpenLockerPudoSimulation;
  appLanguage: string;
  t: (key: LockerPudoCopyKey) => string;
}) {
  const { simulation, appLanguage, t } = props;
  const assignment = simulation.lockerSnapshot.reservationPlan.assignments.find(item => item.status === 'assigned');
  const selectedLocker = assignment?.compartmentId ?? 'counter-review';
  const acceptedAccess = simulation.lockerSnapshot.accessDecisions.find(decision => decision.status === 'accepted');

  return (
    <div className="space-y-4" data-locker-pudo-workspace="locker-console">
      <section className="overflow-hidden rounded-lg border border-slate-900 bg-slate-950 text-white shadow-xl shadow-slate-950/15">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">{t('lockerConsole')}</p>
                <h2 className="mt-2 text-2xl font-black">{decisionLabel(t, simulation.summary.decision)}</h2>
                <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-300">{t('lockerConsoleBody')}</p>
              </div>
              <span className={cn('rounded-md border px-3 py-2 text-xs font-black uppercase tracking-wider', statusTone(simulation.summary.decision))}>
                {simulation.summary.decision}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {simulation.fieldFlow.map(step => {
                const Icon = fieldFlowIcon(step.stage);
                return (
                  <div key={step.stage} className={cn('min-h-[136px] rounded-lg border p-3', statusTone(step.status))}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/75">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{step.label}</p>
                        <p className="mt-1 truncate text-sm font-black">{step.publicRef}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-bold leading-5 opacity-80">{step.detail}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <WorkspaceActionButton
                label={t('selectLane')}
                detail={`${t('selectedLocker')}: ${selectedLocker}`}
                icon={Boxes}
                tone="primary"
              />
              <WorkspaceActionButton
                label={t('unlockLane')}
                detail={`${t('unlockDecision')}: ${decisionLabel(t, simulation.summary.decision)}`}
                icon={LockKeyhole}
                tone={simulation.summary.decision === 'accept' ? 'safe' : 'warn'}
              />
              <WorkspaceActionButton
                label={t('receiptLane')}
                detail={acceptedAccess?.decisionId ?? simulation.pudoCounter.counterReceipts[0]?.receiptId ?? 'receipt-pending'}
                icon={FileCheck2}
                tone="safe"
              />
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">{t('readerHealth')}</p>
            <div className="mt-3 grid gap-2">
              {simulation.lockerSnapshot.site.readers.map(reader => (
                <div key={reader.readerId} className="rounded-md border border-white/10 bg-white/[0.08] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-black text-white">{reader.label}</span>
                    <span className={cn(
                      'rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-widest',
                      reader.status === 'online' && !reader.tamperDetected
                        ? 'bg-emerald-300/20 text-emerald-100'
                        : 'bg-amber-300/20 text-amber-100',
                    )}>
                      {reader.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] font-bold text-slate-300">
                    {reader.supportedMethods.join(' / ')} · {reader.batteryPercent ?? 0}%
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-100">
              {t('noStoredScanSecrets')}
            </div>
          </aside>
        </div>
      </section>

      <LockerStatusBoard simulation={simulation} appLanguage={appLanguage} t={t} />
    </div>
  );
}

function PudoCounterDeskPanel(props: {
  simulation: OpenLockerPudoSimulation;
  t: (key: LockerPudoCopyKey) => string;
}) {
  const { simulation, t } = props;
  const serviceWindow = simulation.pudoCounter.serviceWindows[0];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" data-locker-pudo-workspace="pudo-counter">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('pudoDesk')}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{simulation.pudoCounter.staffAction}</h2>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600">{t('pudoDeskBody')}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          {t('addressHidden')}
        </span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.86fr]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('recipientAlias')}</p>
              <h3 className="mt-1 break-all font-mono text-lg font-black text-slate-950">
                {simulation.pudoSafeIntake.recipientAlias}
              </h3>
              <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-slate-500">
                {simulation.pudoSafeIntake.publicSubjectRef}
              </p>
            </div>
            <span className="rounded-md bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">
              {t('aliasConditions')}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {simulation.pudoSafeIntake.pickupConditions.map(condition => (
              <span key={condition} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
                {condition}
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <WorkspaceActionButton
              label={t('scanLane')}
              detail={simulation.pudoSafeIntake.publicSubjectRef}
              icon={QrCode}
              tone="primary"
            />
            <WorkspaceActionButton
              label={t('counterQueue')}
              detail={`${simulation.pudoCounter.queueLength} queue / ${serviceWindow?.reason ?? 'normal-service'}`}
              icon={PackageCheck}
              tone={simulation.pudoCounter.queueLength > 0 ? 'warn' : 'safe'}
            />
            <WorkspaceActionButton
              label={t('safeReceipt')}
              detail={simulation.pudoSafeIntake.receiptPolicy}
              icon={FileCheck2}
              tone="safe"
            />
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('counterQueue')}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricTile label={t('manualHandoff')} value={simulation.pudoCounter.manualHandoffCount} icon={AlertTriangle} />
            <MetricTile label={t('assigned')} value={simulation.pudoCounter.assignedLockerCount} icon={CheckCircle2} />
            <MetricTile label={t('receipts')} value={simulation.pudoCounter.counterReceipts.length} icon={FileCheck2} />
          </div>
          <div className="mt-3 grid gap-2">
            {simulation.pudoCounter.counterReceipts.map(receipt => (
              <div key={receipt.receiptId} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-black text-slate-900">{receipt.receiptId}</p>
                  <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    {receipt.purpose}
                  </span>
                </div>
                <p className="mt-1 break-all font-mono text-[10px] font-bold text-slate-500">{receipt.commitment}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-800">
            {t('noStoredScanSecrets')}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ProtocolGrid(props: { simulation: OpenLockerPudoSimulation }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {Object.entries(props.simulation.localProtocol.protocolTotals).map(([protocol, totals]) => (
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

function PickupPointCards(props: {
  simulation: OpenLockerPudoSimulation;
  t: (key: LockerPudoCopyKey) => string;
}) {
  const { simulation, t } = props;
  const site = simulation.lockerSnapshot.site;
  const health = simulation.lockerSnapshot.health;
  const qrReaders = site.readers.filter(reader => reader.supportedMethods.includes('qr') && reader.status === 'online').length;
  const nfcReaders = site.readers.filter(reader => reader.supportedMethods.includes('nfc') && reader.status === 'online').length;
  const accessProblems = simulation.lockerSnapshot.accessDecisions.filter(decision => decision.status !== 'accepted').length;
  const serviceWindow = simulation.pudoCounter.serviceWindows[0];
  const pickupPoints = [
    {
      id: 'locker-bank',
      icon: Boxes,
      title: t('lockerBank'),
      status: health.compartmentTotals.available > 0 ? 'open' : 'limited',
      subtitle: site.label,
      detail: `${health.compartmentTotals.available}/${health.compartmentTotals.total} ${t('available')}`,
      stats: [
        `${simulation.pudoCounter.assignedLockerCount} ${t('assigned')}`,
        `${qrReaders}/${nfcReaders} ${t('qrNfc')}`,
        site.pudoNetworkTags.join(' / '),
      ],
    },
    {
      id: 'pudo-counter',
      icon: PackageCheck,
      title: t('pudoCounter'),
      status: serviceWindow?.status ?? 'limited',
      subtitle: serviceWindow?.label ?? site.operatorAlias,
      detail: serviceWindow?.reason ?? simulation.pudoCounter.staffAction,
      stats: [
        `${simulation.pudoCounter.queueLength} queue`,
        `${simulation.pudoCounter.counterReceipts.length} ${t('receipts')}`,
        t('addressHidden'),
      ],
    },
    {
      id: 'manual-handoff',
      icon: AlertTriangle,
      title: t('manualHandoff'),
      status: simulation.pudoCounter.manualHandoffCount > 0 || accessProblems > 0 ? 'limited' : 'open',
      subtitle: simulation.pudoCounter.staffAction,
      detail: `${accessProblems} access review`,
      stats: [
        `${simulation.pudoCounter.manualHandoffCount} ${t('manualHandoff')}`,
        `${simulation.localProtocol.state.offlineQueue} ${t('offlineQueue')}`,
        t('localOnly'),
      ],
    },
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('pickupPoints')}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{site.siteId}</h2>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
          {t('siteAlias')}: {site.operatorAlias}
        </span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {pickupPoints.map(point => {
          const Icon = point.icon;
          const tone = point.status === 'open' ? statusTone('ready') : statusTone('attention');
          return (
            <div key={point.id} className={cn('rounded-lg border p-4 shadow-sm', tone)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/75">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-950">{point.title}</p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-600">{point.subtitle}</p>
                  </div>
                </div>
                <span className="rounded-md border border-current/20 bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                  {point.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-black text-slate-900">{point.detail}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {point.stats.map(stat => (
                  <span key={stat} className="rounded-md bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    {stat}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
          {t('serviceWindow')}: {site.openingHours}
        </div>
        <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
          {t('readers')}: {health.readerTotals.online}/{health.readerTotals.total}
        </div>
        <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
          {t('accessMethods')}: QR / NFC / passkey
        </div>
      </div>
    </div>
  );
}

function EventRows(props: { simulation: OpenLockerPudoSimulation }) {
  return (
    <div className="space-y-2">
      {props.simulation.eventLog.slice(-8).map(event => (
        <div key={event.eventId} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{event.kind}</p>
            <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider', statusTone(event.status))}>
              {event.status}
            </span>
          </div>
          <p className="mt-2 break-all font-mono text-xs font-bold text-slate-700">{event.evidenceCommitment}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">{event.targetAlias}</p>
        </div>
      ))}
    </div>
  );
}

export const OpenLockerPudoSimulatorScreen: React.FC = () => {
  const [appLanguage, setAppLanguage] = React.useState(readStoredLanguage);
  const [scenario, setScenario] = React.useState<OpenLockerPudoScenario>('pickup-success');
  const [activeWorkspace, setActiveWorkspace] = React.useState<LockerPudoWorkspace>('locker');
  const [runNonce, setRunNonce] = React.useState(0);
  const simulation = React.useMemo(() => buildOpenLockerPudoSimulation({
    scenario,
    generatedAt: new Date(Date.UTC(2026, 5, 20, 9, runNonce, 0)).toISOString(),
  }), [scenario, runNonce]);
  const capabilities = React.useMemo(() => listOpenLockerPudoSimulatorCapabilities(), []);
  const t = React.useCallback((key: LockerPudoCopyKey) => translate(appLanguage, key), [appLanguage]);

  React.useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = getLanguageDirection(appLanguage);
    try {
      localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage);
    } catch {
      // The simulator remains usable without local storage.
    }
  }, [appLanguage]);

  const health = simulation.lockerSnapshot.health;
  const assigned = simulation.lockerSnapshot.reservationPlan.assignments.filter(item => item.status === 'assigned').length;

  return (
    <div className="agid-fixed-page-scroll fixed inset-0 z-[210] bg-[#f4f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/60 md:px-6">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
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
              <h1 className="text-base font-black leading-tight text-slate-950 sm:truncate md:text-xl">Open Locker/PUDO Simulator</h1>
              <p className="hidden truncate text-[10px] font-black uppercase tracking-widest text-slate-500 sm:block">{t('subtitle')}</p>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
            <select
              value={appLanguage}
              onChange={event => setAppLanguage(normalizeAppLanguage(event.target.value))}
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-[190px] sm:flex-none"
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
        <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('scenario')}</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{scenarioLabel(appLanguage, scenario)}</h2>
              </div>
              <span className={cn('rounded-md border px-3 py-2 text-xs font-black uppercase tracking-wider', statusTone(simulation.summary.decision))}>
                {simulation.summary.decision}
              </span>
            </div>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-700">{simulation.summary.headline}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {OPEN_LOCKER_PUDO_SCENARIOS.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setScenario(item)}
                  className={cn(
                    'h-10 rounded-md px-4 text-xs font-black uppercase tracking-wider transition',
                    scenario === item
                      ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {scenarioLabel(appLanguage, item)}
                </button>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 shadow-sm">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5" />
              <h2 className="text-sm font-black uppercase tracking-widest">{t('privacyBoundary')}</h2>
            </div>
            <p className="mt-3 text-sm font-bold leading-6">{t('privacyBody')}</p>
            <div className="mt-4 grid gap-2">
              {[t('noRawAddress'), t('noRawAgidAoid'), t('noPayloads'), t('noSecrets')].map(item => (
                <div key={item} className="flex items-center gap-2 rounded-md bg-white/75 px-3 py-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-4">
          <MetricTile label={t('decision')} value={simulation.summary.nextAction} icon={ShieldCheck} tone={statusTone(simulation.summary.decision)} />
          <MetricTile label={t('compartments')} value={`${health.compartmentTotals.total}`} icon={Boxes} />
          <MetricTile label={t('available')} value={`${health.compartmentTotals.available}`} icon={PackageCheck} />
          <MetricTile label={t('offlineQueue')} value={`${simulation.localProtocol.state.offlineQueue}`} icon={WifiOff} tone={simulation.localProtocol.state.offlineQueue ? 'border-amber-200' : undefined} />
        </section>

        <section className="mt-4">
          <WorkspaceSwitch
            activeWorkspace={activeWorkspace}
            onChange={setActiveWorkspace}
            simulation={simulation}
            t={t}
          />
        </section>

        <section className="mt-4">
          {activeWorkspace === 'locker'
            ? <LockerConsolePanel simulation={simulation} appLanguage={appLanguage} t={t} />
            : <PudoCounterDeskPanel simulation={simulation} t={t} />}
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-4">
          <FlowStep label={t('dropoff')} value={simulation.timeline[0]?.status ?? 'pending'} icon={PackageCheck} status={simulation.timeline[0]?.status ?? 'pending'} />
          <FlowStep label={t('reserve')} value={`${assigned} ${t('assigned')}`} icon={Boxes} status={simulation.timeline[1]?.status ?? 'pending'} />
          <FlowStep label={t('proof')} value={simulation.timeline[2]?.status ?? 'pending'} icon={QrCode} status={simulation.timeline[2]?.status ?? 'pending'} />
          <FlowStep label={t('sync')} value={simulation.timeline[3]?.status ?? 'pending'} icon={Router} status={simulation.timeline[3]?.status ?? 'pending'} />
        </section>

        <section className="mt-4">
          <PickupPointCards simulation={simulation} t={t} />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('pudoCounter')}</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{simulation.pudoCounter.staffAction}</h2>
                </div>
                <span className="rounded-md bg-slate-950 px-3 py-2 text-xs font-black uppercase tracking-wider text-white">
                  {t('localOnly')}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <MetricTile label={t('manualHandoff')} value={simulation.pudoCounter.manualHandoffCount} icon={AlertTriangle} />
                <MetricTile label={t('assigned')} value={simulation.pudoCounter.assignedLockerCount} icon={CheckCircle2} />
                <MetricTile label={t('qrNfc')} value={`${health.readerTotals.qrReady}/${health.readerTotals.nfcReady}`} icon={Nfc} />
                <MetricTile label={t('receipts')} value={simulation.pudoCounter.counterReceipts.length} icon={FileCheck2} />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('protocolFrames')}</p>
              <div className="mt-3">
                <ProtocolGrid simulation={simulation} />
              </div>
              <div className="mt-3 grid gap-2">
                {simulation.localProtocol.frames.slice(-5).map(frame => (
                  <div key={frame.frameId} className="rounded-md bg-slate-50 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-xs font-black text-slate-800">{frame.protocol}:{frame.operation}</p>
                      <span className={cn('rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider', statusTone(frame.status))}>
                        {frame.status}
                      </span>
                    </div>
                    <p className="mt-1 break-all font-mono text-[11px] font-bold text-slate-500">{frame.payloadCommitment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('actions')}</p>
              <span className="sr-only">print-receipt action is included when receipt output is available</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {simulation.operatorActions.map(action => (
                  <span key={action} className="rounded-md bg-blue-50 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-blue-700">
                    {action}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('timeline')}</p>
              <div className="mt-3 grid gap-2">
                {simulation.timeline.map(step => (
                  <div key={step.stepId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-slate-950">{step.label}</p>
                        <p className="text-[11px] font-bold text-slate-500">{step.actor}</p>
                      </div>
                      <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider', statusTone(step.status))}>
                        {step.status}
                      </span>
                    </div>
                    <p className="mt-2 break-all font-mono text-[11px] font-bold text-slate-500">{step.evidenceCommitment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('eventLog')}</p>
              <div className="mt-3">
                <EventRows simulation={simulation} />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('warnings')}</p>
              <div className="mt-3 grid gap-2">
                {simulation.warnings.length === 0 && (
                  <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">none</div>
                )}
                {simulation.warnings.map(warning => (
                  <div key={warning} className="rounded-md bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                    {warning}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('capabilities')}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                  protocols: {capabilities.protocols.join(', ')}
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                  scenarios: {capabilities.scenarios.length}
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                  mode: {capabilities.mode}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
