import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Truck,
  Wifi,
} from 'lucide-react';
import React from 'react';

import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import {
  buildMachineCommunicationDemo,
  listMachineCommunicationCapabilities,
  negotiateMachineCommunication,
  type MachineCommunicationEnvelope,
  type MachineHandshakeResult,
} from '../lib/machineAgidAoidComms';
import { cn } from '../lib/utils';

type MachineCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'language'
  | 'reset'
  | 'scenario'
  | 'lockerRelease'
  | 'reachabilityReport'
  | 'capability'
  | 'envelope'
  | 'decision'
  | 'receipt'
  | 'nodes'
  | 'requested'
  | 'accepted'
  | 'missing'
  | 'payloadKeys'
  | 'publicPayload'
  | 'transcriptHash'
  | 'privacyBoundary'
  | 'privacyBody'
  | 'mode'
  | 'operation'
  | 'nextAction'
  | 'warnings'
  | 'safePayloadOnly'
  | 'noRawAddress'
  | 'noRawAgidAoid'
  | 'shortLived'
  | 'whyTitle'
  | 'whyBody';

const MACHINE_COPY: Record<'en' | 'ja', Record<MachineCopyKey, string>> = {
  en: {
    returnToMap: 'Return to AGID map',
    subtitle: 'Machine-to-machine AGID/AOID envelopes for POS, lockers, drones, hotels, carriers, and field devices.',
    language: 'Display language',
    reset: 'Reset demo',
    scenario: 'Scenario',
    lockerRelease: 'POS -> Locker release',
    reachabilityReport: 'Drone -> Field reachability',
    capability: 'Capability',
    envelope: 'Envelope',
    decision: 'Decision',
    receipt: 'Receipt',
    nodes: 'Nodes',
    requested: 'Requested',
    accepted: 'Accepted',
    missing: 'Missing',
    payloadKeys: 'Payload keys',
    publicPayload: 'Public payload',
    transcriptHash: 'Transcript hash',
    privacyBoundary: 'Privacy boundary',
    privacyBody: 'Machines exchange commitments, aliases, roots, capabilities, and signed receipts only. Raw addresses, raw AGID, raw AOID, recipient names, phone numbers, precise location, and proof secrets are rejected before negotiation.',
    mode: 'Mode',
    operation: 'Operation',
    nextAction: 'Next action',
    warnings: 'Warnings',
    safePayloadOnly: 'Safe payload only',
    noRawAddress: 'No raw address',
    noRawAgidAoid: 'No raw AGID/AOID',
    shortLived: 'Short-lived envelope',
    whyTitle: 'Why this is powerful',
    whyBody: 'AGID/AOID becomes a protocol between devices: a POS can ask a locker to open, a drone can report reachability, a hotel kiosk can verify a QR, and every step can produce a redacted receipt without leaking the address itself.',
  },
  ja: {
    returnToMap: 'AGIDマップへ戻る',
    subtitle: 'POS、ロッカー、ドローン、ホテル、配送業者、現場端末が使うAGID/AOID機械間通信です。',
    language: '表示言語',
    reset: 'デモ初期化',
    scenario: 'シナリオ',
    lockerRelease: 'POS -> ロッカー解放',
    reachabilityReport: 'ドローン -> 現場到達可否',
    capability: 'Capability',
    envelope: 'Envelope',
    decision: 'Decision',
    receipt: 'Receipt',
    nodes: '端末',
    requested: '要求',
    accepted: '承認',
    missing: '不足',
    payloadKeys: 'Payload keys',
    publicPayload: '公開payload',
    transcriptHash: 'Transcript hash',
    privacyBoundary: 'プライバシー境界',
    privacyBody: '機械同士はcommitment、alias、root、capability、署名receiptだけを交換します。実住所、AGID本体、AOID本体、受取人名、電話番号、精密位置、proof secretは交渉前に拒否します。',
    mode: 'モード',
    operation: '操作',
    nextAction: '次の操作',
    warnings: '警告',
    safePayloadOnly: '安全payloadのみ',
    noRawAddress: '実住所なし',
    noRawAgidAoid: 'AGID/AOID本体なし',
    shortLived: '短期envelope',
    whyTitle: 'なぜ強いか',
    whyBody: 'AGID/AOIDが端末同士のプロトコルになります。POSはロッカー解放を依頼し、ドローンは到達不可を報告し、ホテル端末はQRを照合できます。各段階は住所を漏らさずredacted receiptとして残せます。',
  },
};

type ScenarioId = 'locker' | 'reachability';

function readStoredLanguage() {
  try {
    return normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || 'ja');
  } catch {
    return 'ja';
  }
}

function translate(language: string, key: MachineCopyKey) {
  return MACHINE_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function returnToMap() {
  window.location.href = '/';
}

function statusTone(decision: MachineHandshakeResult['decision']) {
  if (decision === 'accept') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (decision === 'review') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-rose-200 bg-rose-50 text-rose-800';
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function StepTile(props: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  const Icon = props.icon;
  return (
    <div className={cn(
      'min-h-[92px] rounded-lg border p-4 shadow-sm',
      props.active ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white',
    )}>
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">{props.title}</p>
      </div>
      <p className="mt-3 truncate text-lg font-black text-slate-950">{props.value}</p>
    </div>
  );
}

function NodeCard(props: { envelope: MachineCommunicationEnvelope }) {
  const nodeRows = [
    ['From', props.envelope.from],
    ['To', props.envelope.to],
  ] as const;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {nodeRows.map(([label, node]) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <h3 className="mt-2 break-all font-mono text-sm font-black text-slate-950">{node.nodeId}</h3>
          <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600">
            <span>role: {node.role}</span>
            <span>trust: {node.trustLevel}</span>
            <span>key: {node.deviceKeyId}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export const MachineCommsScreen: React.FC = () => {
  const [appLanguage, setAppLanguage] = React.useState(readStoredLanguage);
  const [scenario, setScenario] = React.useState<ScenarioId>('locker');
  const [demoNonce, setDemoNonce] = React.useState(0);
  const demo = React.useMemo(
    () => buildMachineCommunicationDemo(new Date(Date.UTC(2026, 5, 20, 9, demoNonce, 0)).toISOString()),
    [demoNonce],
  );
  const capabilities = React.useMemo(() => listMachineCommunicationCapabilities(), []);
  const selectedIndex = scenario === 'locker' ? 0 : 1;
  const envelope = demo.envelopes[selectedIndex]!;
  const handshake = React.useMemo(() => negotiateMachineCommunication({
    request: envelope,
    now: envelope.createdAt,
  }), [envelope]);
  const t = React.useCallback((key: MachineCopyKey) => translate(appLanguage, key), [appLanguage]);

  React.useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = getLanguageDirection(appLanguage);
    try {
      localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage);
    } catch {
      // The screen remains usable without local storage.
    }
  }, [appLanguage]);

  const scenarioButtons: Array<{ id: ScenarioId; label: string }> = [
    { id: 'locker', label: t('lockerRelease') },
    { id: 'reachability', label: t('reachabilityReport') },
  ];

  return (
    <div className="agid-fixed-page-scroll fixed inset-0 z-[210] bg-[#f4f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/60 md:px-6">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
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
              <h1 className="truncate text-lg font-black text-slate-950 md:text-xl">AGID/AOID Machine Link</h1>
              <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-500">{t('subtitle')}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
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
              onClick={() => setDemoNonce(value => value + 1)}
              className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-900 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{t('reset')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-3 py-4 md:px-5">
        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('whyTitle')}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{t('whyBody')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {scenarioButtons.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScenario(item.id)}
                  className={cn(
                    'h-10 rounded-md px-4 text-xs font-black uppercase tracking-wider transition',
                    scenario === item.id
                      ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {item.label}
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
              {[t('safePayloadOnly'), t('noRawAddress'), t('noRawAgidAoid'), t('shortLived')].map(item => (
                <div key={item} className="flex items-center gap-2 rounded-md bg-white/75 px-3 py-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-4">
          <StepTile title={t('capability')} value={`${envelope.requestedCapabilities.length} requested`} icon={Wifi} active />
          <StepTile title={t('envelope')} value={envelope.messageId} icon={QrCode} active />
          <StepTile title={t('decision')} value={handshake.decision} icon={ShieldCheck} active={handshake.decision === 'accept'} />
          <StepTile title={t('receipt')} value={handshake.receipt.receiptId} icon={FileCheck2} active />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <NodeCard envelope={envelope} />

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('nodes')}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('mode')}</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{envelope.mode}</p>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('operation')}</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{envelope.operation}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {envelope.requestedCapabilities.map(capability => (
                  <span key={capability} className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('payloadKeys')}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {envelope.payloadKeys.map(key => (
                  <span key={key} className="rounded-md bg-slate-950 px-2 py-1 text-[10px] font-black text-white">
                    {key}
                  </span>
                ))}
              </div>
              <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-slate-950 p-3 text-[11px] font-bold leading-5 text-slate-100">
                {formatJson(envelope.publicPayload)}
              </pre>
            </div>
          </div>

          <div className="space-y-4">
            <div className={cn('rounded-lg border p-4 shadow-sm', statusTone(handshake.decision))}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-75">{t('decision')}</p>
                  <h2 className="mt-1 text-2xl font-black">{handshake.decision.toUpperCase()}</h2>
                </div>
                {handshake.decision === 'accept'
                  ? <CheckCircle2 className="h-10 w-10" />
                  : <AlertTriangle className="h-10 w-10" />}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md bg-white/70 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{t('nextAction')}</p>
                  <p className="mt-1 text-sm font-black">{handshake.nextAction}</p>
                </div>
                <div className="rounded-md bg-white/70 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{t('accepted')}</p>
                  <p className="mt-1 text-sm font-black">{handshake.acceptedCapabilities.length}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('accepted')}</p>
                <div className="mt-3 grid gap-2">
                  {handshake.acceptedCapabilities.map(capability => (
                    <div key={capability} className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                      {capability}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('missing')}</p>
                <div className="mt-3 grid gap-2">
                  {handshake.requiredCapabilities
                    .filter(capability => !handshake.acceptedCapabilities.includes(capability))
                    .map(capability => (
                      <div key={capability} className="rounded-md bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                        {capability}
                      </div>
                    ))}
                  {handshake.requiredCapabilities.every(capability => handshake.acceptedCapabilities.includes(capability)) && (
                    <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
                      none
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('receipt')}</p>
              <div className="mt-3 grid gap-2">
                {[
                  ['receiptId', handshake.receipt.receiptId],
                  [t('transcriptHash'), handshake.receipt.transcriptHash],
                  ['from', handshake.receipt.fromNodeId],
                  ['to', handshake.receipt.toNodeId],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('warnings')}</p>
              <div className="mt-3 grid gap-2">
                {handshake.warnings.length === 0 && (
                  <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">none</div>
                )}
                {handshake.warnings.map(warning => (
                  <div key={warning} className="rounded-md bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                    {warning}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supported machine surface</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                  roles: {capabilities.roles.length}
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                  operations: {capabilities.operations.length}
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                  payload keys: {capabilities.publicPayloadKeys.length}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
