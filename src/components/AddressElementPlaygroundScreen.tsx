import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Code2,
  Copy,
  EyeOff,
  FileJson,
  MonitorSmartphone,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Store,
  WandSparkles,
} from 'lucide-react';
import React from 'react';

import { AgidAddressElement } from './AgidAddressElement';
import { getAddressFormat, type AddressFormat } from '../data/address_formats';
import { formatAddressElementPublicDecision, type AddressElementSession } from '../lib/addressElement';
import {
  buildAddressElementLanguageTabs,
  describeAddressElementCountryForm,
  normalizeAddressElementCountryCode,
  pickAddressElementLanguage,
  selectAddressElementFormat,
} from '../lib/addressElementCountryForm';
import {
  type AddressElementHostSurface,
  type AddressElementPublicEvent,
} from '../lib/addressElementEvents';
import type { AddressElementReadiness } from '../lib/addressElementReadiness';
import type { AddressIntent, AddressIntentMode, AddressIntentPurpose } from '../lib/addressIntent';
import { cn } from '../lib/utils';

type PlaygroundPurpose = Extract<AddressIntentPurpose, 'delivery' | 'return' | 'aid' | 'identity' | 'customs'>;
type PlaygroundMode = Extract<AddressIntentMode, 'local' | 'server' | 'zk' | 'ethereum' | 'full'>;

const SURFACE_OPTIONS: Array<{
  id: AddressElementHostSurface;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'ec',
    label: 'EC Checkout',
    description: 'Delivery eligibility and shipping address completion.',
    icon: ShoppingCart,
  },
  {
    id: 'cms',
    label: 'CMS Form',
    description: 'No-code storefront or membership form embedding.',
    icon: Store,
  },
  {
    id: 'shopping-agent',
    label: 'Shopping Agent',
    description: 'Agent receives scoped address capability, not raw address by default.',
    icon: WandSparkles,
  },
];

const PURPOSE_OPTIONS: Array<{ id: PlaygroundPurpose; label: string }> = [
  { id: 'delivery', label: 'Delivery' },
  { id: 'return', label: 'Return' },
  { id: 'aid', label: 'Aid' },
  { id: 'identity', label: 'Identity' },
  { id: 'customs', label: 'Customs' },
];

const MODE_OPTIONS: Array<{ id: PlaygroundMode; label: string; description: string }> = [
  { id: 'local', label: 'Local', description: 'No server, no ZK, no chain.' },
  { id: 'server', label: 'Server', description: 'Registry API for freshness and used-state.' },
  { id: 'zk', label: 'ZK', description: 'Private predicates without chain anchoring.' },
  { id: 'ethereum', label: 'Ethereum', description: 'Public registry, no ZK proof generation.' },
  { id: 'full', label: 'Full', description: 'ZK + public registry for high-trust workflows.' },
];

const COUNTRY_PRESETS = ['JP', 'US', 'FR', 'BR', 'KE', 'NZ'];

function goHome() {
  window.location.href = '/';
}

function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function compactSession(session: AddressElementSession | null) {
  if (!session) return null;
  return {
    id: session.id,
    status: session.status,
    purpose: session.purpose,
    mode: session.mode,
    countryCode: session.countryCode,
    selectedLanguage: session.selectedLanguage,
    missingRequiredFields: session.missingRequiredFields,
    channels: session.autofill.channels,
    qualityDecision: formatAddressElementPublicDecision(session.quality.decision),
    intentId: session.intentPreview.id,
    intentStatus: session.intentPreview.status,
    nextActions: session.nextActions,
    privacy: session.privacy,
  };
}

function compactIntent(intent: AddressIntent | null) {
  if (!intent) return null;
  return {
    id: intent.id,
    status: intent.status,
    purpose: intent.purpose,
    mode: intent.mode,
    requiredEvidence: intent.requiredEvidence,
    safeEvidenceCount: intent.evidence.length,
    nextAction: intent.nextAction,
    errors: intent.errors,
    warnings: intent.warnings,
    privacy: intent.privacy,
  };
}

function eventLine(event: AddressElementPublicEvent) {
  return `${event.type} / ${event.status} / ${formatAddressElementPublicDecision(event.qualityDecision)} / ${event.nextAction}`;
}

function buildReactSnippet(input: {
  hostSurface: AddressElementHostSurface;
  purpose: PlaygroundPurpose;
  mode: PlaygroundMode;
  countryCode: string;
  defaultLanguage: string;
  highRiskMode: boolean;
}) {
  return `<AgidAddressElement
  hostSurface="${input.hostSurface}"
  countryCode="${input.countryCode}"
  purpose="${input.purpose}"
  mode="${input.mode}"
  defaultLanguage="${input.defaultLanguage}"
  highRiskMode={${input.highRiskMode}}
  onPublicEvent={handleAddressElementEvent}
  onIntentPreview={handleIntentPreview}
/>`;
}

function buildWebComponentSnippet(input: {
  hostSurface: AddressElementHostSurface;
  purpose: PlaygroundPurpose;
  mode: PlaygroundMode;
  countryCode: string;
  defaultLanguage: string;
  highRiskMode: boolean;
}) {
  return `<script type="module" src="/embed/agid-address-element.js"></script>
<agid-address-element
  host-surface="${input.hostSurface}"
  country-code="${input.countryCode}"
  purpose="${input.purpose}"
  mode="${input.mode}"
  default-language="${input.defaultLanguage}"
  qr
  ${input.highRiskMode ? 'high-risk agid-secure' : ''}
></agid-address-element>`;
}

function StatusPill({ status }: { status: string }) {
  const tone = status === 'ready' || status === 'verified'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : status === 'blocked' || status === 'rejected'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';
  return (
    <span className={cn('inline-flex min-h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-black uppercase tracking-[0.12em]', tone)}>
      {status === 'ready' || status === 'verified' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function AddressElementPlaygroundScreen() {
  const [hostSurface, setHostSurface] = React.useState<AddressElementHostSurface>('ec');
  const [purpose, setPurpose] = React.useState<PlaygroundPurpose>('delivery');
  const [mode, setMode] = React.useState<PlaygroundMode>('local');
  const [countryCode, setCountryCode] = React.useState('JP');
  const [defaultLanguage, setDefaultLanguage] = React.useState('local');
  const [highRiskMode, setHighRiskMode] = React.useState(false);
  const [session, setSession] = React.useState<AddressElementSession | null>(null);
  const [intentPreview, setIntentPreview] = React.useState<AddressIntent | null>(null);
  const [readiness, setReadiness] = React.useState<AddressElementReadiness['publicMetadata'] | null>(null);
  const [events, setEvents] = React.useState<AddressElementPublicEvent[]>([]);
  const [copied, setCopied] = React.useState<'react' | 'web-component' | null>(null);
  const [playgroundAddressFormat, setPlaygroundAddressFormat] = React.useState<AddressFormat | null>(null);
  const [countryFormStatus, setCountryFormStatus] = React.useState<'loading' | 'ready' | 'fallback'>('loading');

  React.useEffect(() => {
    let active = true;
    const normalizedCountryCode = normalizeAddressElementCountryCode(countryCode);
    if (!normalizedCountryCode) {
      setPlaygroundAddressFormat(null);
      setCountryFormStatus('fallback');
      return () => {
        active = false;
      };
    }

    setCountryFormStatus('loading');
    getAddressFormat(normalizedCountryCode).then(format => {
      if (!active) return;
      setPlaygroundAddressFormat(format);
      setCountryFormStatus(format ? 'ready' : 'fallback');
    });

    return () => {
      active = false;
    };
  }, [countryCode]);

  const languageOptions = React.useMemo(
    () => buildAddressElementLanguageTabs(playgroundAddressFormat, countryCode),
    [countryCode, playgroundAddressFormat],
  );

  React.useEffect(() => {
    setDefaultLanguage(current => pickAddressElementLanguage(current, languageOptions));
  }, [languageOptions]);

  const selectedCountryForm = React.useMemo(
    () => selectAddressElementFormat(playgroundAddressFormat, defaultLanguage),
    [defaultLanguage, playgroundAddressFormat],
  );
  const countryFormSummary = React.useMemo(
    () => describeAddressElementCountryForm(playgroundAddressFormat, defaultLanguage),
    [defaultLanguage, playgroundAddressFormat],
  );

  const elementKey = `${hostSurface}:${purpose}:${mode}:${countryCode}:${defaultLanguage}:${highRiskMode}`;
  const snippets = React.useMemo(() => {
    const input = {
      hostSurface,
      purpose,
      mode,
      countryCode,
      defaultLanguage,
      highRiskMode,
    };
    return {
      react: buildReactSnippet(input),
      webComponent: buildWebComponentSnippet(input),
    };
  }, [countryCode, defaultLanguage, highRiskMode, hostSurface, mode, purpose]);

  const handleSessionChange = React.useCallback((nextSession: AddressElementSession) => {
    setSession(nextSession);
  }, []);

  const handleIntentPreview = React.useCallback((intent: AddressIntent) => {
    setIntentPreview(intent);
  }, []);

  const handleReadinessChange = React.useCallback((metadata: AddressElementReadiness['publicMetadata']) => {
    setReadiness(metadata);
  }, []);

  const handlePublicEvent = React.useCallback((event: AddressElementPublicEvent) => {
    setEvents(current => [event, ...current].slice(0, 12));
  }, []);

  const resetPlayground = () => {
    setHostSurface('ec');
    setPurpose('delivery');
    setMode('local');
    setCountryCode('JP');
    setDefaultLanguage('local');
    setHighRiskMode(false);
    setEvents([]);
  };

  const copySnippet = async (kind: 'react' | 'web-component') => {
    const text = kind === 'react' ? snippets.react : snippets.webComponent;
    if (navigator.clipboard) await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1300);
  };

  return (
    <main className="agid-page-scroll bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={goHome}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
              aria-label="Return to map"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">Address Element Playground</p>
              <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950">Embeddable Address UI Demo</h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Try the EC, CMS, and Shopping Agent embed flow with safe events, Address Intent preview, QR/NFC channels, and no raw-address host contract.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={session?.status ?? 'collecting'} />
            <button
              type="button"
              onClick={resetPlayground}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black text-slate-950">Host surface</h2>
            </div>
            <div className="grid gap-2">
              {SURFACE_OPTIONS.map(option => {
                const Icon = option.icon;
                const active = hostSurface === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setHostSurface(option.id)}
                    className={cn(
                      'min-h-[72px] rounded-xl border p-3 text-left transition',
                      active ? 'border-blue-300 bg-blue-50 text-blue-950 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-black">
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black text-slate-950">Scenario</h2>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Purpose</span>
                <select
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value as PlaygroundPurpose)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm"
                >
                  {PURPOSE_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mode</span>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as PlaygroundMode)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm"
                >
                  {MODE_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
                <span className="text-xs font-semibold leading-5 text-slate-500">
                  {MODE_OPTIONS.find(option => option.id === mode)?.description}
                </span>
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Country preset</span>
                <select
                  value={countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm"
                >
                  {COUNTRY_PRESETS.map(country => <option key={country} value={country}>{country}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Default language</span>
                <select
                  value={defaultLanguage}
                  onChange={(event) => setDefaultLanguage(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm"
                >
                  {languageOptions.map(option => (
                    <option key={option.language} value={option.language}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Country form switch</span>
                  <span className={cn(
                    'rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]',
                    countryFormStatus === 'ready'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : countryFormStatus === 'loading'
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700',
                  )}>
                    {countryFormStatus}
                  </span>
                </div>
                <div className="mt-2 text-sm font-black text-slate-900">
                  {countryFormSummary.countryName}
                </div>
                <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {selectedCountryForm?.name || countryFormSummary.formatName} / {countryFormSummary.fieldCount} fields / Postal {countryFormSummary.postalCodeFormat}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHighRiskMode(value => !value)}
                className={cn(
                  'flex min-h-11 items-center justify-between rounded-xl border px-3 text-sm font-black',
                  highRiskMode ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-50 text-slate-700',
                )}
              >
                <span>High-risk mode</span>
                <span>{highRiskMode ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Live component</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Address Element Preview</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
                  {hostSurface}
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-blue-700">
                  {purpose}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
                  {mode}
                </span>
              </div>
            </div>
            <AgidAddressElement
              key={elementKey}
              hostSurface={hostSurface}
              countryCode={countryCode}
              purpose={purpose}
              mode={mode}
              defaultLanguage={defaultLanguage}
              highRiskMode={highRiskMode}
              onSessionChange={handleSessionChange}
              onIntentPreview={handleIntentPreview}
              onPublicEvent={handlePublicEvent}
              onReadinessChange={handleReadinessChange}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
                  <Code2 className="h-4 w-4 text-blue-600" />
                  React embed
                </h2>
                <button
                  type="button"
                  onClick={() => copySnippet('react')}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === 'react' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs font-semibold leading-5 text-slate-100">
                {snippets.react}
              </pre>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
                  <Clipboard className="h-4 w-4 text-blue-600" />
                  Web Component embed
                </h2>
                <button
                  type="button"
                  onClick={() => copySnippet('web-component')}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === 'web-component' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs font-semibold leading-5 text-slate-100">
                {snippets.webComponent}
              </pre>
            </section>
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-900">
              <EyeOff className="h-5 w-5" />
              <h2 className="text-sm font-black">Host privacy contract</h2>
            </div>
            <div className="mt-3 grid gap-2">
              {[
                'Host receives safe events only',
                'No raw AGID/AOID in event log',
                'Raw form values remain inside the element',
                'Internal quality score stays internal',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-black text-emerald-900">
                  <CheckCircle2 className="h-4 w-4" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
                <FileJson className="h-4 w-4 text-blue-600" />
                Safe event log
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                {events.length}
              </span>
            </div>
            <div className="space-y-2">
              {events.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-500">
                  Interact with the element to see public host events.
                </div>
              )}
              {events.slice(0, 6).map((event, index) => (
                <div key={`${event.timestamp}-${event.type}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-slate-950 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      {event.type}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      {new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(event.timestamp))}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{eventLine(event)}</p>
                  <p className="mt-1 break-all font-mono text-[10px] font-bold text-slate-500">
                    {event.sessionId.slice(0, 22)} / {event.privacyBoundary}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-black text-slate-950">Address Intent preview</h2>
            <pre className="max-h-[300px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs font-semibold leading-5 text-slate-100">
              {safeJson(compactIntent(intentPreview))}
            </pre>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-black text-slate-950">Session and readiness</h2>
            <pre className="max-h-[300px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs font-semibold leading-5 text-slate-100">
              {safeJson({
                session: compactSession(session),
                readiness,
              })}
            </pre>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default AddressElementPlaygroundScreen;
