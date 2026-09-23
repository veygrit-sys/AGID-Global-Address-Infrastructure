import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  DatabaseZap,
  KeyRound,
  Languages,
  LockKeyhole,
  MonitorCog,
  PlugZap,
  RefreshCw,
  Router,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  WifiOff,
  Zap,
} from 'lucide-react';
import React from 'react';

import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import {
  buildSettingsPolicyCenterSnapshot,
  DEFAULT_SETTINGS_POLICY_DEVICES,
  DEFAULT_SETTINGS_POLICY_PROVIDERS,
  SETTINGS_POLICY_MODE_PROFILES,
  type SettingsPolicyDeviceConnector,
  type SettingsPolicyMode,
  type SettingsPolicyProvider,
} from '../lib/settingsPolicyCenter';
import { cn } from '../lib/utils';

type PolicyCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'language'
  | 'mode'
  | 'privacyDefaults'
  | 'providerAdapters'
  | 'deviceConnectors'
  | 'policyImpact'
  | 'safeExport'
  | 'findings'
  | 'nextActions'
  | 'highRisk'
  | 'localFirst'
  | 'ethereumOptional'
  | 'noRawAddress'
  | 'noHistory'
  | 'agidSOnly'
  | 'aliasTtl'
  | 'enabled'
  | 'localOnly'
  | 'operatorApproval'
  | 'blocked'
  | 'ready'
  | 'resetDemo'
  | 'privacyBoundary'
  | 'privacyBody'
  | 'applyPolicy';

const POLICY_COPY: Record<'en' | 'ja', Record<PolicyCopyKey, string>> = {
  en: {
    returnToMap: 'Return to AGID map',
    subtitle: 'Shared policy source for language, operation mode, providers, devices, privacy defaults, and high-risk behavior.',
    language: 'Language',
    mode: 'Operation mode',
    privacyDefaults: 'Privacy defaults',
    providerAdapters: 'Provider adapters',
    deviceConnectors: 'Device connectors',
    policyImpact: 'Policy impact',
    safeExport: 'Safe export',
    findings: 'Findings',
    nextActions: 'Next actions',
    highRisk: 'High-risk mode',
    localFirst: 'Local-first',
    ethereumOptional: 'Ethereum optional',
    noRawAddress: 'No raw address by default',
    noHistory: 'No address history',
    agidSOnly: 'AGID-S only for high-risk',
    aliasTtl: 'Short alias TTL',
    enabled: 'Enabled',
    localOnly: 'Local only',
    operatorApproval: 'Operator approval',
    blocked: 'Blocked',
    ready: 'Ready',
    resetDemo: 'Reset demo',
    privacyBoundary: 'Privacy boundary',
    privacyBody: 'This Settings Center exports policy, commitments, device refs, provider refs, and redacted status only. Raw address, AOID, precise location, recipient identity, proof secrets, private keys, and proof witnesses are excluded by default.',
    applyPolicy: 'Apply local policy',
  },
  ja: {
    returnToMap: 'AGIDマップへ戻る',
    subtitle: '言語、運用モード、プロバイダー、端末、プライバシー初期値、高リスク動作をまとめる共有ポリシー源です。',
    language: '言語',
    mode: '運用モード',
    privacyDefaults: 'プライバシー初期値',
    providerAdapters: 'プロバイダー',
    deviceConnectors: '端末コネクタ',
    policyImpact: 'ポリシー影響',
    safeExport: '安全な出力',
    findings: '検出事項',
    nextActions: '次のアクション',
    highRisk: '高リスクモード',
    localFirst: 'ローカル優先',
    ethereumOptional: 'Ethereum任意',
    noRawAddress: '実住所を標準で出さない',
    noHistory: '住所履歴を残さない',
    agidSOnly: '高リスク時はAGID-Sのみ',
    aliasTtl: '短期alias TTL',
    enabled: '有効',
    localOnly: 'ローカルのみ',
    operatorApproval: '担当者承認',
    blocked: 'ブロック',
    ready: '適用可能',
    resetDemo: 'デモ初期化',
    privacyBoundary: 'プライバシー境界',
    privacyBody: 'このSettings Centerはポリシー、commitment、端末参照、provider参照、redacted状態だけを出力します。実住所、AOID、精密位置、受取人情報、proof secret、秘密鍵、proof witnessは標準で除外します。',
    applyPolicy: 'ローカル適用',
  },
};

const MODE_ICONS = {
  'local-only': WifiOff,
  'server-registry': ServerCog,
  'zk-only': LockKeyhole,
  'ethereum-registry': Router,
  'full-zk-ethereum': Zap,
} satisfies Record<SettingsPolicyMode, React.ComponentType<{ className?: string }>>;

function readStoredLanguage() {
  try {
    return normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || 'ja');
  } catch {
    return 'ja';
  }
}

function translate(language: string, key: PolicyCopyKey) {
  return POLICY_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function returnToMap() {
  window.location.href = '/';
}

function cloneProviders() {
  return DEFAULT_SETTINGS_POLICY_PROVIDERS.map(provider => ({
    ...provider,
    outboundData: [...provider.outboundData],
  }));
}

function cloneDevices() {
  return DEFAULT_SETTINGS_POLICY_DEVICES.map(device => ({ ...device }));
}

function statusTone(blocked: boolean) {
  return blocked
    ? 'border-rose-200 bg-rose-50 text-rose-800'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800';
}

function findingTone(severity: string) {
  if (severity === 'error') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function ToggleRow(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex min-h-[68px] cursor-pointer items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/40">
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-900">{props.label}</span>
        {props.description && (
          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{props.description}</span>
        )}
      </span>
      <span className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition',
        props.checked ? 'bg-blue-600' : 'bg-slate-300',
      )}>
        <input
          type="checkbox"
          checked={props.checked}
          onChange={event => props.onChange(event.target.checked)}
          className="sr-only"
        />
        <span className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition',
          props.checked ? 'left-6' : 'left-1',
        )} />
      </span>
    </label>
  );
}

function SummaryMetric(props: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: string;
}) {
  const Icon = props.icon;
  return (
    <div className={cn('min-h-[92px] rounded-lg border bg-white p-4 shadow-sm', props.tone ?? 'border-slate-200')}>
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">{props.label}</p>
      </div>
      <div className="mt-3 text-xl font-black text-slate-950">{props.value}</div>
    </div>
  );
}

export const SettingsPolicyCenterScreen: React.FC = () => {
  const [language, setLanguage] = React.useState(readStoredLanguage);
  const [mode, setMode] = React.useState<SettingsPolicyMode>('local-only');
  const [highRiskMode, setHighRiskMode] = React.useState(false);
  const [localFirst, setLocalFirst] = React.useState(true);
  const [ethereumOptional, setEthereumOptional] = React.useState(true);
  const [noRawAddressByDefault, setNoRawAddressByDefault] = React.useState(true);
  const [noAddressHistory, setNoAddressHistory] = React.useState(false);
  const [agidSOnlyForHighRisk, setAgidSOnlyForHighRisk] = React.useState(false);
  const [shortAliasTtlSeconds, setShortAliasTtlSeconds] = React.useState(600);
  const [providers, setProviders] = React.useState<SettingsPolicyProvider[]>(cloneProviders);
  const [devices, setDevices] = React.useState<SettingsPolicyDeviceConnector[]>(cloneDevices);
  const [appliedFingerprint, setAppliedFingerprint] = React.useState<string | null>(null);

  const t = React.useCallback((key: PolicyCopyKey) => translate(language, key), [language]);
  const snapshot = React.useMemo(() => buildSettingsPolicyCenterSnapshot({
    mode,
    language,
    highRiskMode,
    localFirst,
    ethereumOptional,
    noRawAddressByDefault,
    noAddressHistory,
    agidSOnlyForHighRisk,
    shortAliasTtlSeconds,
    providers,
    devices,
  }), [
    agidSOnlyForHighRisk,
    devices,
    ethereumOptional,
    highRiskMode,
    language,
    localFirst,
    mode,
    noAddressHistory,
    noRawAddressByDefault,
    providers,
    shortAliasTtlSeconds,
  ]);

  React.useEffect(() => {
    const nextLanguage = normalizeAppLanguage(language);
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.documentElement.dir = getLanguageDirection(nextLanguage);
  }, [language]);

  React.useEffect(() => {
    if (highRiskMode) {
      setNoAddressHistory(true);
      setAgidSOnlyForHighRisk(true);
      setShortAliasTtlSeconds(value => Math.min(value, 300));
    }
  }, [highRiskMode]);

  const toggleProvider = React.useCallback((id: SettingsPolicyProvider['id'], enabled: boolean) => {
    setProviders(previous => previous.map(provider => (
      provider.id === id ? { ...provider, enabled } : provider
    )));
  }, []);

  const toggleDevice = React.useCallback((id: SettingsPolicyDeviceConnector['id'], key: 'enabled' | 'localOnly' | 'requiresOperatorApproval', checked: boolean) => {
    setDevices(previous => previous.map(device => (
      device.id === id ? { ...device, [key]: checked } : device
    )));
  }, []);

  const resetDemo = React.useCallback(() => {
    setMode('local-only');
    setHighRiskMode(false);
    setLocalFirst(true);
    setEthereumOptional(true);
    setNoRawAddressByDefault(true);
    setNoAddressHistory(false);
    setAgidSOnlyForHighRisk(false);
    setShortAliasTtlSeconds(600);
    setProviders(cloneProviders());
    setDevices(cloneDevices());
    setAppliedFingerprint(null);
  }, []);

  const applyPolicy = React.useCallback(() => {
    setAppliedFingerprint(snapshot.policyFingerprint);
  }, [snapshot.policyFingerprint]);

  return (
    <div className="agid-fixed-page-scroll fixed inset-0 z-[210] bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/60 md:px-6">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={returnToMap}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-900 hover:text-white active:scale-95"
              aria-label={t('returnToMap')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white sm:flex">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black text-slate-950 md:text-xl">Settings and Policy Center</h1>
              <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <select
              value={language}
              onChange={event => setLanguage(normalizeAppLanguage(event.target.value))}
              className="h-10 max-w-[190px] rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              aria-label={t('language')}
            >
              {APP_LANGUAGES.map(option => (
                <option key={option.code} value={option.code}>{option.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetDemo}
              className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-900 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{t('resetDemo')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-3 py-4 md:px-5">
        <section className="grid gap-3 md:grid-cols-4">
          <SummaryMetric
            label="Policy"
            value={snapshot.blocked ? t('blocked') : t('ready')}
            icon={snapshot.blocked ? AlertTriangle : CheckCircle2}
            tone={statusTone(snapshot.blocked)}
          />
          <SummaryMetric label="Mode" value={snapshot.profile.label.replace(/^Mode \d: /, '')} icon={Router} />
          <SummaryMetric label="Providers" value={`${snapshot.impact.enabledProviderCount} enabled`} icon={PlugZap} />
          <SummaryMetric label="Devices" value={`${snapshot.impact.enabledDeviceCount} enabled`} icon={MonitorCog} />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Router className="h-5 w-5 text-blue-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('mode')}</h2>
              </div>
              <div className="grid gap-3 lg:grid-cols-5">
                {(Object.keys(SETTINGS_POLICY_MODE_PROFILES) as SettingsPolicyMode[]).map(option => {
                  const profile = SETTINGS_POLICY_MODE_PROFILES[option];
                  const Icon = MODE_ICONS[option];
                  const selected = option === mode;
                  return (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setMode(option)}
                      className={cn(
                        'min-h-[150px] rounded-lg border p-3 text-left transition',
                        selected
                          ? 'border-blue-400 bg-blue-50 shadow-sm ring-2 ring-blue-100'
                          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40',
                      )}
                    >
                      <div className={cn(
                        'mb-3 flex h-9 w-9 items-center justify-center rounded-md',
                        selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500',
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-black text-slate-950">{profile.label}</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{profile.operatorSummary}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('privacyDefaults')}</h2>
                </div>
                <div className="grid gap-2">
                  <ToggleRow label={t('highRisk')} checked={highRiskMode} onChange={setHighRiskMode} description="AGID-S, short alias, no history, coarse reports." />
                  <ToggleRow label={t('localFirst')} checked={localFirst} onChange={setLocalFirst} description="Keep Mode 0 alive even when other modes are configured." />
                  <ToggleRow label={t('ethereumOptional')} checked={ethereumOptional} onChange={setEthereumOptional} description="Do not require chain access for ordinary POS and field work." />
                  <ToggleRow label={t('noRawAddress')} checked={noRawAddressByDefault} onChange={setNoRawAddressByDefault} description="Default shared payloads to commitments and references." />
                  <ToggleRow label={t('noHistory')} checked={noAddressHistory} onChange={setNoAddressHistory} description="Avoid retained address history in high-risk operation." />
                  <ToggleRow label={t('agidSOnly')} checked={agidSOnlyForHighRisk} onChange={setAgidSOnlyForHighRisk} description="Use encrypted AGID sharing in high-risk contexts." />
                  <label className="block rounded-md border border-slate-200 bg-white px-4 py-3">
                    <span className="text-sm font-black text-slate-900">{t('aliasTtl')}</span>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="range"
                        min={60}
                        max={highRiskMode ? 300 : 900}
                        step={60}
                        value={shortAliasTtlSeconds}
                        onChange={event => setShortAliasTtlSeconds(Number(event.target.value))}
                        className="w-full"
                      />
                      <span className="w-16 rounded-md bg-slate-100 px-2 py-1 text-center text-xs font-black text-slate-700">
                        {shortAliasTtlSeconds}s
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <PlugZap className="h-5 w-5 text-blue-700" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('providerAdapters')}</h2>
                </div>
                <div className="space-y-2">
                  {providers.map(provider => (
                    <div key={provider.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">{provider.displayName ?? provider.id}</p>
                          <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{provider.endpointRef}</p>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                          <input
                            type="checkbox"
                            checked={provider.enabled}
                            onChange={event => toggleProvider(provider.id, event.target.checked)}
                          />
                          {t('enabled')}
                        </label>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {provider.outboundData.map(category => (
                          <span
                            key={`${provider.id}-${category}`}
                            className={cn(
                              'rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider',
                              category.startsWith('raw') || category === 'precise-location' || category === 'recipient-identity' || category === 'proof-secret'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-white text-slate-600',
                            )}
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <MonitorCog className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('deviceConnectors')}</h2>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {devices.map(device => (
                  <div key={device.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{device.id}</p>
                    <div className="mt-3 space-y-2">
                      <label className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wider text-slate-600">
                        {t('enabled')}
                        <input
                          type="checkbox"
                          checked={device.enabled}
                          onChange={event => toggleDevice(device.id, 'enabled', event.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wider text-slate-600">
                        {t('localOnly')}
                        <input
                          type="checkbox"
                          checked={device.localOnly}
                          onChange={event => toggleDevice(device.id, 'localOnly', event.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wider text-slate-600">
                        {t('operatorApproval')}
                        <input
                          type="checkbox"
                          checked={Boolean(device.requiresOperatorApproval)}
                          onChange={event => toggleDevice(device.id, 'requiresOperatorApproval', event.target.checked)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className={cn('rounded-lg border p-4 shadow-sm', statusTone(snapshot.blocked))}>
              <div className="flex items-center gap-3">
                {snapshot.blocked ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{t('policyImpact')}</p>
                  <h2 className="text-2xl font-black uppercase">{snapshot.blocked ? t('blocked') : t('ready')}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={applyPolicy}
                disabled={snapshot.blocked}
                className={cn(
                  'mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-black uppercase tracking-widest transition',
                  snapshot.blocked
                    ? 'cursor-not-allowed bg-white/50 text-slate-400'
                    : 'bg-slate-950 text-white hover:bg-blue-700',
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                {t('applyPolicy')}
              </button>
              {appliedFingerprint && (
                <p className="mt-3 rounded-md bg-white/70 px-3 py-2 font-mono text-xs font-black">
                  applied {appliedFingerprint}
                </p>
              )}
            </section>

            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-900">
                <ShieldCheck className="h-5 w-5" />
                <h2 className="text-sm font-black uppercase tracking-widest">{t('privacyBoundary')}</h2>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-emerald-900/80">{t('privacyBody')}</p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <DatabaseZap className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('policyImpact')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(snapshot.impact).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="break-words text-[10px] font-black uppercase tracking-widest text-slate-400">{key}</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{String(value)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('findings')}</h2>
              </div>
              <div className="space-y-2">
                {snapshot.findings.length === 0 ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-800">
                    No blocking findings.
                  </div>
                ) : snapshot.findings.map(finding => (
                  <div key={`${finding.code}-${finding.detail}`} className={cn('rounded-md border px-3 py-3', findingTone(finding.severity))}>
                    <p className="text-xs font-black uppercase tracking-wider">{finding.severity} / {finding.code}</p>
                    <p className="mt-1 text-sm font-bold leading-5">{finding.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('nextActions')}</h2>
              </div>
              <div className="space-y-2">
                {snapshot.recommendedNextActions.map(action => (
                  <div key={action} className="rounded-md bg-slate-50 px-3 py-2 text-sm font-bold leading-5 text-slate-600">
                    {action}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Languages className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('safeExport')}</h2>
              </div>
              <pre className="max-h-[360px] overflow-auto rounded-md bg-slate-950 p-3 text-xs font-bold leading-5 text-slate-100">
                {JSON.stringify(snapshot.safeExport, null, 2)}
              </pre>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};
