import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Languages, Link2, LockKeyhole, MapPin, Nfc, QrCode, ShieldCheck, Sparkles } from 'lucide-react';

import {
  buildAddressElementSession,
  formatAddressElementPublicDecision,
  type AddressElementFieldInput,
  type AddressElementSession,
} from '../lib/addressElement';
import {
  buildAddressLinkSession,
  type AddressLinkCapability,
} from '../lib/addressLink';
import {
  assessAddressElementReadiness,
  type AddressElementReadiness,
} from '../lib/addressElementReadiness';
import {
  buildAddressElementPublicEvents,
  type AddressElementHostSurface,
  type AddressElementPublicEvent,
} from '../lib/addressElementEvents';
import type { AddressIntent } from '../lib/addressIntent';
import { getAddressFormat, type AddressFormat } from '../data/address_formats';
import {
  buildAddressElementFormFields,
  buildAddressElementLanguageTabs,
  describeAddressElementCountryForm,
  normalizeAddressElementCountryCode,
  pickAddressElementLanguage,
  selectAddressElementFormat,
} from '../lib/addressElementCountryForm';
import { cn } from '../lib/utils';

type AgidAddressElementProps = {
  hostSurface?: AddressElementHostSurface;
  countryCode?: string;
  purpose?: 'delivery' | 'return' | 'aid' | 'identity' | 'customs';
  mode?: 'local' | 'server' | 'zk' | 'ethereum' | 'full';
  defaultLanguage?: string;
  highRiskMode?: boolean;
  onSessionChange?: (session: AddressElementSession) => void;
  onIntentPreview?: (intent: AddressIntent) => void;
  onPublicEvent?: (event: AddressElementPublicEvent) => void;
  onReadinessChange?: (readiness: AddressElementReadiness['publicMetadata']) => void;
};

const LINK_PERMISSION_OPTIONS: Array<{ capability: AddressLinkCapability; label: string }> = [
  { capability: 'delivery-eligibility', label: 'Delivery' },
  { capability: 'recipient-confirmation', label: 'Recipient' },
  { capability: 'coarse-region', label: 'Region' },
];

function emptyFields(countryCode?: string): AddressElementFieldInput {
  return {
    countryCode: normalizeAddressElementCountryCode(countryCode) || '',
  };
}

export function AgidAddressElement({
  hostSurface = 'ec',
  countryCode = 'JP',
  purpose = 'delivery',
  mode = 'local',
  defaultLanguage = 'local',
  highRiskMode: highRiskDefault = false,
  onSessionChange,
  onIntentPreview,
  onPublicEvent,
  onReadinessChange,
}: AgidAddressElementProps) {
  const [fields, setFields] = useState<AddressElementFieldInput>(() => emptyFields(countryCode));
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [highRiskMode, setHighRiskMode] = useState(highRiskDefault);
  const [scanCapabilities, setScanCapabilities] = useState({ qr: true, nfc: false, agidSecure: false });
  const [linkCapabilities, setLinkCapabilities] = useState<AddressLinkCapability[]>(['delivery-eligibility', 'coarse-region']);
  const [addressFormat, setAddressFormat] = useState<AddressFormat | null>(null);
  const [countryFormStatus, setCountryFormStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    let active = true;
    const normalizedCountryCode = normalizeAddressElementCountryCode(countryCode);

    setFields(current => {
      if (current.countryCode === normalizedCountryCode) return current;
      return { ...current, countryCode: normalizedCountryCode };
    });

    if (!normalizedCountryCode) {
      setAddressFormat(null);
      setCountryFormStatus('fallback');
      return () => {
        active = false;
      };
    }

    setCountryFormStatus('loading');
    getAddressFormat(normalizedCountryCode).then(format => {
      if (!active) return;
      setAddressFormat(format);
      setCountryFormStatus(format ? 'ready' : 'fallback');
    });

    return () => {
      active = false;
    };
  }, [countryCode]);

  const languageTabs = useMemo(
    () => buildAddressElementLanguageTabs(addressFormat, fields.countryCode || countryCode),
    [addressFormat, countryCode, fields.countryCode],
  );

  useEffect(() => {
    setSelectedLanguage(pickAddressElementLanguage(defaultLanguage, languageTabs));
  }, [defaultLanguage, languageTabs]);

  const selectedAddressFormat = useMemo(
    () => selectAddressElementFormat(addressFormat, selectedLanguage),
    [addressFormat, selectedLanguage],
  );
  const formFields = useMemo(
    () => buildAddressElementFormFields(addressFormat, selectedLanguage),
    [addressFormat, selectedLanguage],
  );
  const countryFormSummary = useMemo(
    () => describeAddressElementCountryForm(addressFormat, selectedLanguage),
    [addressFormat, selectedLanguage],
  );

  const session = useMemo(() => buildAddressElementSession({
    purpose,
    mode,
    countryCode: fields.countryCode || countryCode,
    fields,
    selectedLanguage,
    languageTabs,
    format: addressFormat,
    highRiskMode,
    scanCapabilities,
    agidCandidate: scanCapabilities.agidSecure
      ? { present: true, exposure: 'agid-s', safeFingerprint: 'client-local-agid-s-ready' }
      : undefined,
  }), [addressFormat, countryCode, fields, highRiskMode, languageTabs, mode, purpose, scanCapabilities, selectedLanguage]);

  const addressLinkSession = useMemo(() => buildAddressLinkSession({
    surface: hostSurface,
    purpose,
    mode,
    requestedCapabilities: linkCapabilities,
    highRiskMode,
    evidence: {
      addressElementSession: session,
      deliveryEligible: session.status === 'ready' && session.quality.decision === 'verified',
      qualityDecision: session.quality.decision,
      coarseRegion: session.countryCode
        ? { countryCode: session.countryCode, precision: 'country' }
        : undefined,
      recipientProof: {
        passed: session.evidenceForIntent.some(item => item.source === 'recipient-proof' && item.status === 'passed'),
        method: highRiskMode ? 'passkey' : 'unknown',
      },
      commitments: {
        address: `address-element:${session.id}`,
        credential: `address-intent:${session.intentPreview.id}`,
      },
    },
  }), [highRiskMode, hostSurface, linkCapabilities, mode, purpose, session]);

  const elementReadiness = useMemo(() => assessAddressElementReadiness({
    session,
    hostSurface,
    addressLinkStatus: addressLinkSession.status,
    requestedCapabilities: linkCapabilities,
    grantedScopes: addressLinkSession.grantedScopes,
    hasHostEventCallbacks: Boolean(onPublicEvent || onReadinessChange || onSessionChange || onIntentPreview),
    hasAddressLink: true,
    hasQrNfcControls: true,
    hasHighRiskToggle: true,
    hasVisibleNextAction: true,
  }), [
    addressLinkSession.grantedScopes,
    addressLinkSession.status,
    hostSurface,
    linkCapabilities,
    onIntentPreview,
    onPublicEvent,
    onReadinessChange,
    onSessionChange,
    session,
  ]);

  useEffect(() => {
    onSessionChange?.(session);
    onIntentPreview?.(session.intentPreview);
    onReadinessChange?.(elementReadiness.publicMetadata);
    if (onPublicEvent) {
      buildAddressElementPublicEvents({ surface: hostSurface, session }).forEach(onPublicEvent);
    }
  }, [elementReadiness.publicMetadata, hostSurface, onIntentPreview, onPublicEvent, onReadinessChange, onSessionChange, session]);

  const qualityTone = session.quality.decision === 'verified'
    ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
    : session.quality.decision === 'blocked'
      ? 'border-red-400/50 bg-red-500/10 text-red-100'
      : 'border-amber-400/50 bg-amber-500/10 text-amber-100';

  const linkTone = addressLinkSession.status === 'ready'
    ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
    : addressLinkSession.status === 'requires-proof'
      ? 'border-blue-400/50 bg-blue-500/10 text-blue-100'
      : addressLinkSession.status === 'rejected' || addressLinkSession.status === 'expired'
        ? 'border-red-400/50 bg-red-500/10 text-red-100'
        : 'border-amber-400/50 bg-amber-500/10 text-amber-100';

  const readinessTone = elementReadiness.status === 'ready'
    ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
    : elementReadiness.status === 'blocked'
      ? 'border-red-400/50 bg-red-500/10 text-red-100'
      : elementReadiness.status === 'needs_review'
        ? 'border-amber-400/50 bg-amber-500/10 text-amber-100'
        : 'border-blue-400/50 bg-blue-500/10 text-blue-100';
  const scanSecurityTone = session.scanSecurity.publicDecision === 'ok'
    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
    : session.scanSecurity.publicDecision === 'restricted' || session.scanSecurity.publicDecision === 'rejected'
      ? 'border-red-400/40 bg-red-500/10 text-red-100'
      : 'border-amber-400/40 bg-amber-500/10 text-amber-100';

  const toggleLinkCapability = (capability: AddressLinkCapability) => {
    setLinkCapabilities(current => current.includes(capability)
      ? current.filter(item => item !== capability)
      : [...current, capability]);
  };
  const publicUiLanguage = typeof document !== 'undefined' ? document.documentElement.lang : 'en';
  const publicQualityLabel = formatAddressElementPublicDecision(session.quality.decision, publicUiLanguage);

  return (
    <section className="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500 text-white">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-black tracking-normal">AGID Address Element</h2>
            <p className="text-xs text-slate-400">Local-first embedded address input</p>
          </div>
        </div>
        <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold', qualityTone)}>
          {session.quality.decision === 'blocked' ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          <span>{publicQualityLabel}</span>
        </div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {session.languageTabs.map(tab => (
              <button
                key={tab.language}
                type="button"
                onClick={() => setSelectedLanguage(tab.language)}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-black transition-colors',
                  selectedLanguage === tab.language
                    ? 'border-white bg-white text-slate-950'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800',
                )}
              >
                <Languages className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-black uppercase tracking-normal text-slate-400">Country form</div>
                <div className="mt-1 text-sm font-black text-slate-100">
                  {countryFormSummary.countryName}
                </div>
              </div>
              <span className={cn(
                'rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-normal',
                countryFormStatus === 'ready'
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                  : countryFormStatus === 'loading'
                    ? 'border-blue-400/40 bg-blue-500/10 text-blue-100'
                    : 'border-amber-400/40 bg-amber-500/10 text-amber-100',
              )}>
                {countryFormStatus}
              </span>
            </div>
            <div className="mt-2 grid gap-2 text-[11px] font-bold text-slate-300 sm:grid-cols-3">
              <span className="rounded-md bg-slate-950 px-2 py-1">
                {selectedAddressFormat?.name || countryFormSummary.formatName}
              </span>
              <span className="rounded-md bg-slate-950 px-2 py-1">
                {countryFormSummary.fieldCount} fields
              </span>
              <span className="rounded-md bg-slate-950 px-2 py-1">
                Postal {countryFormSummary.postalCodeFormat}
              </span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {formFields.map(field => {
              const state = session.fields.find(item => item.key === field.key);
              return (
                <label key={field.key} className="space-y-1">
                  <span className="flex items-center justify-between text-[11px] font-bold uppercase tracking-normal text-slate-400">
                    {field.label}
                    {state?.required && <span className="text-amber-300">required</span>}
                  </span>
                  <input
                    value={field.fixedValue || fields[field.key] || ''}
                    autoComplete={field.autocomplete}
                    type={field.type || 'text'}
                    inputMode={field.inputMode}
                    pattern={field.pattern}
                    maxLength={field.maxLength}
                    readOnly={field.fixed}
                    onChange={event => {
                      if (field.fixed) return;
                      setFields(current => ({ ...current, [field.key]: event.target.value }));
                    }}
                    className={cn(
                      'h-10 w-full rounded-lg border bg-slate-900 px-3 text-sm font-semibold text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-400',
                    state?.required && !state.present ? 'border-amber-500/60' : 'border-slate-700',
                    field.private && 'bg-slate-900/70',
                    field.fixed && 'cursor-not-allowed bg-slate-800 text-slate-300',
                  )}
                    placeholder={field.fixedValue || (field.private ? 'kept local' : field.placeholder || field.label)}
                  />
                </label>
              );
            })}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-black text-slate-200">
              <Sparkles className="h-4 w-4 text-blue-300" />
              Input Channels
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScanCapabilities(current => ({ ...current, qr: !current.qr }))}
                className={cn('grid h-14 place-items-center rounded-lg border text-xs font-bold', scanCapabilities.qr ? 'border-blue-400 bg-blue-500/15 text-blue-100' : 'border-slate-700 text-slate-400')}
                title="Enable QR reading"
                aria-pressed={scanCapabilities.qr}
              >
                <QrCode className="mb-1 h-4 w-4" />
                QR
              </button>
              <button
                type="button"
                onClick={() => setScanCapabilities(current => ({ ...current, nfc: !current.nfc }))}
                className={cn('grid h-14 place-items-center rounded-lg border text-xs font-bold', scanCapabilities.nfc ? 'border-blue-400 bg-blue-500/15 text-blue-100' : 'border-slate-700 text-slate-400')}
                title="Enable NFC reading"
                aria-pressed={scanCapabilities.nfc}
              >
                <Nfc className="mb-1 h-4 w-4" />
                NFC
              </button>
              <button
                type="button"
                onClick={() => setScanCapabilities(current => ({ ...current, agidSecure: !current.agidSecure }))}
                className={cn('grid h-14 place-items-center rounded-lg border text-xs font-bold', scanCapabilities.agidSecure ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100' : 'border-slate-700 text-slate-400')}
                title="Require AGID-S or secure commitment"
                aria-pressed={scanCapabilities.agidSecure}
              >
                <ShieldCheck className="mb-1 h-4 w-4" />
                AGID-S
              </button>
            </div>
            <div className={cn('mt-2 rounded-md border px-2 py-2 text-[10px] font-black uppercase tracking-normal', scanSecurityTone)}>
              Secure intake: {session.scanSecurity.publicDecision.replace(/-/g, ' ')}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs font-black text-slate-200">
              <span className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-cyan-300" />
                Address Link
              </span>
              <span className={cn('rounded-md border px-2 py-1 text-[10px]', linkTone)}>
                {addressLinkSession.status.replace(/-/g, ' ').toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LINK_PERMISSION_OPTIONS.map(option => {
                const active = linkCapabilities.includes(option.capability);
                return (
                  <button
                    key={option.capability}
                    type="button"
                    onClick={() => toggleLinkCapability(option.capability)}
                    className={cn(
                      'grid h-14 place-items-center rounded-lg border text-xs font-bold transition-colors',
                      active
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100'
                        : 'border-slate-700 text-slate-400 hover:bg-slate-800',
                    )}
                    title={option.capability}
                  >
                    <LockKeyhole className="mb-1 h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex min-h-8 flex-wrap gap-1">
              {addressLinkSession.grantedScopes.length > 0
                ? addressLinkSession.grantedScopes.map(scope => (
                    <span key={scope} className="rounded-md bg-slate-950 px-2 py-1 text-[10px] font-bold text-slate-200">
                      {scope}
                    </span>
                  ))
                : (
                    <span className="rounded-md bg-slate-950 px-2 py-1 text-[10px] font-bold text-slate-400">
                      {addressLinkSession.nextAction.replace(/_/g, ' ')}
                    </span>
                  )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setHighRiskMode(value => !value)}
            className={cn(
              'flex min-h-11 w-full items-center justify-between rounded-lg border px-3 text-left text-xs font-black',
              highRiskMode ? 'border-red-400 bg-red-500/15 text-red-100' : 'border-slate-700 bg-slate-900 text-slate-300',
            )}
            aria-pressed={highRiskMode}
          >
            <span>High-risk mode</span>
            <span>{highRiskMode ? 'ON' : 'OFF'}</span>
          </button>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs font-black text-slate-200">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Embed readiness
              </span>
              <span className={cn('rounded-md border px-2 py-1 text-[10px]', readinessTone)}>
                {elementReadiness.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {elementReadiness.roleSummaries.map(role => (
                <span
                  key={role.role}
                  className={cn(
                    'rounded-md border px-2 py-1 text-[10px] font-bold',
                    role.status === 'ready'
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                      : role.status === 'blocked'
                        ? 'border-red-400/30 bg-red-500/10 text-red-100'
                        : 'border-amber-400/30 bg-amber-500/10 text-amber-100',
                  )}
                  title={`${role.passed} pass / ${role.warnings} warning / ${role.failures} fail`}
                >
                  {role.role.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
            <div className="mt-2 rounded-md bg-slate-950 px-2 py-1 text-[10px] font-bold text-slate-300">
              {elementReadiness.nextActions[0] || elementReadiness.publicMetadata.privacyBoundary}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="mb-2 text-xs font-black text-slate-200">Next action</div>
            <ul className="space-y-1 text-xs text-slate-300">
              {session.nextActions.map(action => (
                <li key={action} className="rounded-md bg-slate-950 px-2 py-1 font-semibold">
                  {action.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default AgidAddressElement;
