import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  Store,
  Webhook,
} from 'lucide-react';
import React from 'react';

import playlistCommerceWebhookEvidenceFixture from '../../docs/specs/fixtures/playlist-commerce-webhook-evidence-v0.1.json';
import playlistCommerceWebhookPreflightHistoryFixture from '../../docs/specs/fixtures/playlist-commerce-webhook-preflight-history-v0.1.json';
import playlistCommerceWebhookPreflightFixture from '../../docs/specs/fixtures/playlist-commerce-webhook-preflight-v0.1.json';
import merchantConsoleOnboardingFixture from '../../docs/specs/fixtures/merchant-console-onboarding-v0.1.json';
import hostedAddressLoginFixtures from '../../docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json';
import {
  buildAddressLoginMerchantIntegration,
  type AddressLoginMerchantIntegration,
} from '../lib/addressLoginSpec';
import {
  type AddressWalletCarrierCode,
  type AddressWalletCarrierCoverageMatrix,
  buildAddressWalletCarrierLabelTransform,
  buildAddressWalletCarrierCoverageMatrix,
  buildAddressWalletCarrierPreflightPreview,
  normalizeAddressWalletPoBoxSpelling,
} from '../lib/addressWalletCarrierCountryForms';
import { runSandboxCarrierGatewaySmoke } from '../lib/deliveryGatewayCarrierApi';
import { runHexashipMvpV01Sandbox, type HexashipMvpV01Result } from '../lib/hexashipDeliveryGateway';
import {
  buildMerchantConsoleLocalHexashipIdempotencyLedgerRows,
  buildMerchantConsoleLocalHexashipLedgerLayoutAudit,
  buildMerchantConsoleLocalHexashipWebhookReplayFixture,
  buildMerchantConsoleLocalHexashipReplayPreview,
  buildMerchantConsoleLocalHexashipRequestFixtureCopyText,
  buildMerchantConsoleLocalHexashipRequestFixture,
  buildMerchantConsoleCarrierCapabilityPreflight,
  buildMerchantConsoleGuidedShipmentStep,
  buildMerchantConsoleCallbackPreflightNegativeFixture,
  buildMerchantConsoleCallbackPreflightNegativeFixtureCopyText,
  buildMerchantConsoleCallbackPreflightRepairActions,
  buildMerchantConsoleClipboardRedactionAudit,
  buildMerchantConsoleOnboardingOpenApiContractCopyPayload,
  buildMerchantConsoleOnboardingOpenApiContractStatus,
  buildMerchantConsoleMerchantOnboardingSdkCopyPayload,
  upsertMerchantConsoleLocalHexashipShipmentRecord,
  buildMerchantConsoleEcPluginPlan,
  evaluateMerchantShipmentCreationReadiness,
  type MerchantConsoleCarrierCapabilityPreflight,
  type MerchantConsoleLocalHexashipShipmentRecord,
  type MerchantShipmentCreationReadiness,
  type MerchantShipmentCreationReadinessInput,
  type MerchantShipmentHistoryRow,
} from '../lib/merchantConsoleEcPlugin';
import {
  PLAYLIST_COMMERCE_WEBHOOK_ROUTES,
  PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT,
} from '../lib/playlistCommerceSpec';
import { buildSkipshipMerchantConsoleWebhookLedger } from '../lib/skipshipMerchantConsoleWebhookLedger';
import {
  buildHostedAddressLoginMerchantVisibleRedactionCopyPayload,
  buildHostedAddressLoginWebhookKeyRotationRunbook,
  copyHostedAddressLoginMerchantVisibleRedactionClipboardPayload,
  type HostedAddressLoginFixtureSet,
  type HostedAddressLoginMerchantVisibleRedactionCopyPayload,
} from '../lib/veygritHostedAddressLoginContract';
import { buildVeyEcosystemResearch } from '../lib/veyEcosystemResearch';
import { cn } from '../lib/utils';

const MERCHANT_CONSOLE_FIXTURE = {
  clientId: 'merchant_demo',
  environment: 'sandbox',
  supportRef: 'support_queue_demo',
  billingRef: 'billing_ref_demo',
} as const;

const MERCHANT_CONSOLE_SETUP_AREAS = [
  { id: 'client', label: 'Client setup', icon: KeyRound },
  { id: 'callback', label: 'Callback validator', icon: ClipboardCheck },
  { id: 'webhook', label: 'Webhook operations', icon: Webhook },
  { id: 'policy', label: 'Policy gates', icon: ShieldCheck },
] as const;

const MERCHANT_SHIPMENT_READINESS_STATES = [
  'blocked_missing_address_wallet_preflight',
  'blocked_missing_carrier_capability',
  'blocked_private_material',
  'ready_for_hexaship_createShipment',
] as const;

const MERCHANT_WALLET_ONBOARDING_FIELD_IDS = [
  'addressFormVersionRef',
  'carrierSpecificAddressShapeBlocked',
] as readonly string[];

type MerchantConsoleWebhookKeyRotation = ReturnType<typeof buildHostedAddressLoginWebhookKeyRotationRunbook>;
type MerchantConsoleWebhookHmacValidator = AddressLoginMerchantIntegration['webhookHmacValidator'];
type MerchantConsoleRedactionDisplayContract = HostedAddressLoginFixtureSet['merchantVisibleRedactionDisplayContract'];

function goHome() {
  window.location.href = '/';
}

function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function StatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' | string }) {
  return (
    <span className={cn(
      'inline-flex min-h-6 items-center rounded-md px-2 text-[10px] font-black uppercase tracking-[0.12em]',
      status === 'pass' && 'bg-emerald-50 text-emerald-700',
      status === 'warn' && 'bg-amber-50 text-amber-700',
      status === 'fail' && 'bg-rose-50 text-rose-700',
      !['pass', 'warn', 'fail'].includes(status) && 'bg-slate-100 text-slate-600',
    )}>
      {status}
    </span>
  );
}

function ReplayKindBadge({ kind }: { kind: 'stored' | 'replayed' | 'conflict' }) {
  return (
    <span className={cn(
      'inline-flex min-h-6 items-center rounded-md px-2 text-[10px] font-black uppercase tracking-[0.12em]',
      kind === 'replayed' && 'bg-emerald-50 text-emerald-700',
      kind === 'conflict' && 'bg-rose-50 text-rose-700',
      kind === 'stored' && 'bg-slate-100 text-slate-600',
    )}>
      {kind}
    </span>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p key="metric-label" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p key="metric-value" className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p key="metric-note" className="mt-1 text-xs font-semibold leading-5 text-slate-500">{note}</p>
    </div>
  );
}

function ConsoleSection({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p key="section-eyebrow" className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
      <h2 key="section-title" className="mt-1 text-lg font-black text-slate-950">{title}</h2>
      <div key="section-body" className="mt-4">{children}</div>
    </section>
  );
}

function CarrierCountryPreflightSelector({
  carrierCoverageMatrix,
  selectedCarrierCode,
  selectedCountryCode,
  activeNextAction,
  activeSelectionAction,
  activeMissingRefs,
  onCarrierChange,
  onCountryChange,
}: {
  carrierCoverageMatrix: AddressWalletCarrierCoverageMatrix;
  selectedCarrierCode: AddressWalletCarrierCode;
  selectedCountryCode: string;
  activeNextAction: string;
  activeSelectionAction: string;
  activeMissingRefs: string[];
  onCarrierChange: (carrier: AddressWalletCarrierCode) => void;
  onCountryChange: (countryCode: string) => void;
}) {
  return (
    <div key="carrier-preflight-selector" className="mt-2 grid gap-2 rounded-md bg-blue-50 p-2 lg:grid-cols-[180px_180px_minmax(0,1fr)]">
      <label key="carrier-preflight-carrier-label" className="grid gap-1 text-[10px] font-black uppercase tracking-[0.08em] text-blue-700">
        <span key="carrier-preflight-carrier-label-text">Carrier</span>
        <select
          key="carrier-preflight-carrier-select"
          value={selectedCarrierCode}
          onChange={event => onCarrierChange(event.target.value as AddressWalletCarrierCode)}
          className="h-9 rounded-md border border-blue-100 bg-white px-2 font-mono text-xs font-black text-blue-950"
        >
          {carrierCoverageMatrix.carrierSummaries.map(summary => (
            <option key={summary.carrier} value={summary.carrier}>{summary.carrier.toUpperCase()}</option>
          ))}
        </select>
      </label>
      <label key="carrier-preflight-country-label" className="grid gap-1 text-[10px] font-black uppercase tracking-[0.08em] text-blue-700">
        <span key="carrier-preflight-country-label-text">Country</span>
        <select
          key="carrier-preflight-country-select"
          value={selectedCountryCode}
          onChange={event => onCountryChange(event.target.value)}
          className="h-9 rounded-md border border-blue-100 bg-white px-2 font-mono text-xs font-black text-blue-950"
        >
          {carrierCoverageMatrix.countryCodes.map(countryCode => (
            <option key={countryCode} value={countryCode}>{countryCode}</option>
          ))}
        </select>
      </label>
      <div key="carrier-preflight-active-summary" className="rounded-md bg-white px-2 py-1.5">
        <p key="carrier-preflight-active-summary-label" className="text-[10px] font-black uppercase tracking-[0.08em] text-blue-700">Active preflight next action</p>
        <p key="carrier-preflight-active-next-action" className="mt-1 break-all font-mono text-[10px] font-black text-blue-950">
          {activeNextAction}
        </p>
        <p key="carrier-preflight-active-selection" className="mt-1 break-all font-mono text-[10px] font-bold text-blue-800">
          selection: {activeSelectionAction} / missingRefs: {activeMissingRefs.join(', ') || 'none'}
        </p>
      </div>
    </div>
  );
}

function buildConsoleMetrics(integration: AddressLoginMerchantIntegration) {
  return [
    { label: 'Callback checks', value: integration.setupPreflight.checks.length, note: 'HTTPS, contract, forbidden params/values, vectors.' },
    { label: 'Gates', value: integration.requiredDashboardGates.length, note: 'Live enablement blockers.' },
    { label: 'Webhooks', value: integration.webhookEvents.length, note: 'Redacted lifecycle events.' },
    { label: 'HMAC cases', value: integration.webhookHmacValidator.cases.length, note: 'Positive and negative signature fixtures.' },
    { label: 'Features', value: integration.merchantFeatures.length, note: 'Setup, policy, testing, ops, support.' },
  ];
}

function readinessInputFromShipment(row: MerchantShipmentHistoryRow): MerchantShipmentCreationReadinessInput {
  return {
    orderRef: row.orderRef,
    recipientDisplayRef: row.recipientDisplayRef,
    recipientId: row.recipientDisplayRef.replace('_display_', '_'),
    addressFormVersion: `wallet_country_form_ref_${row.recipientDisplayRef.replace(/^aw_rec_/, '').replace(/_display_/, '_')}`,
    parcelProfileRef: `parcel_profile_ref_${row.orderRef}`,
    walletConsentRef: row.walletConsentRef,
    carrierCapabilityRef: row.carrierCapabilityRef,
    carrierAlias: row.carrierAlias,
    servicePreference: row.servicePreference,
  };
}

function readinessTone(readiness: MerchantShipmentCreationReadiness) {
  if (readiness.status === 'ready_for_hexaship_createShipment') return 'border-emerald-100 bg-emerald-50 text-emerald-900';
  if (readiness.status === 'blocked_private_material') return 'border-rose-100 bg-rose-50 text-rose-900';
  return 'border-amber-100 bg-amber-50 text-amber-900';
}

function ShipmentCreateActionButton({
  readiness,
  onCreateShipment,
}: {
  readiness: MerchantShipmentCreationReadiness;
  onCreateShipment: (readiness: MerchantShipmentCreationReadiness) => void;
}) {
  return (
    <button
      type="button"
      disabled={!readiness.canCreateShipment}
      aria-disabled={!readiness.canCreateShipment}
      aria-label={readiness.canCreateShipment ? `Create shipment for ${readiness.orderRef}` : `Shipment creation blocked for ${readiness.orderRef}`}
      onClick={() => onCreateShipment(readiness)}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-black shadow-sm transition',
        readiness.canCreateShipment
          ? 'bg-slate-950 text-white hover:bg-slate-800'
          : 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none',
      )}
    >
      <CheckCircle2 key={`${readiness.orderRef}-create-shipment-icon`} className="h-4 w-4" />
      <span key={`${readiness.orderRef}-create-shipment-label`}>{readiness.canCreateShipment ? 'Create shipment' : 'Shipment blocked'}</span>
    </button>
  );
}

function CarrierCapabilityPreflightButton({
  readiness,
  onRunCapabilityPreflight,
}: {
  readiness: MerchantShipmentCreationReadiness;
  onRunCapabilityPreflight: (readiness: MerchantShipmentCreationReadiness) => void;
}) {
  const canRun = readiness.nextStep === 'run_carrier_capability_preflight';
  return (
    <button
      type="button"
      disabled={!canRun}
      aria-disabled={!canRun}
      aria-label={canRun ? `Run carrier capability preflight for ${readiness.orderRef}` : `Carrier capability preflight unavailable for ${readiness.orderRef}`}
      onClick={() => onRunCapabilityPreflight(readiness)}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-black shadow-sm transition',
        canRun
          ? 'bg-blue-700 text-white hover:bg-blue-800'
          : 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none',
      )}
    >
      <ServerCog key={`${readiness.orderRef}-capability-preflight-icon`} className="h-4 w-4" />
      <span key={`${readiness.orderRef}-capability-preflight-label`}>Capability preflight</span>
    </button>
  );
}

function createLocalHexashipShipment(readiness: MerchantShipmentCreationReadiness): HexashipMvpV01Result | null {
  if (!readiness.canCreateShipment) return null;
  if (!readiness.gatewayPreflight.ok) return null;

  const result = runHexashipMvpV01Sandbox({
    merchantRef: MERCHANT_CONSOLE_FIXTURE.clientId,
    ecOrderRef: readiness.orderRef,
    recipientId: readiness.safeRefs.recipientId,
    parcelProfileRef: readiness.safeRefs.parcelProfileRef,
    walletConsentRef: readiness.safeRefs.walletConsentRef,
    carrierCapabilityRef: readiness.safeRefs.carrierCapabilityRef,
    selectionMode: readiness.servicePreference === 'fastest' ? 'fastest' : 'cheapest',
    selectedBy: 'ec',
    requestedAt: '2026-07-04T20:55:07.818Z',
  });

  return result.ok ? result : null;
}

function MerchantConsoleRightRail({ integration }: { integration: AddressLoginMerchantIntegration }) {
  return (
    <aside key="merchant-console-right-rail" className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section key="merchant-console-privacy-boundary" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div key="merchant-console-privacy-boundary-header" className="flex items-center gap-2 text-emerald-900">
          <EyeOff key="merchant-console-privacy-boundary-icon" className="h-5 w-5" />
          <h2 key="merchant-console-privacy-boundary-title" className="text-sm font-black">Privacy boundary</h2>
        </div>
        <div key="merchant-console-privacy-boundary-list" className="mt-3 grid gap-2">
          {[
            'Merchant callbacks contain refs and claims only',
            'Carrier handoff is scoped and time-bound',
            'Logs use fingerprints and event refs',
            'Support review sees reason codes, not evidence bodies',
          ].map(item => (
            <div key={item} className="flex items-start gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-black leading-5 text-emerald-900">
              <CheckCircle2 key={`${item}-icon`} className="mt-0.5 h-4 w-4 shrink-0" />
              <span key={`${item}-label`}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section key="merchant-console-callback-contract" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div key="merchant-console-callback-contract-header" className="flex items-center gap-2">
          <ServerCog key="merchant-console-callback-contract-icon" className="h-5 w-5 text-blue-600" />
          <h2 key="merchant-console-callback-contract-title" className="text-sm font-black text-slate-950">Callback contract</h2>
        </div>
        <p key="merchant-console-callback-contract-version" className="mt-2 font-mono text-[11px] font-black text-blue-700">
          {integration.callbackContract.version}
        </p>
        <div key="merchant-console-callback-contract-params" className="mt-3 flex flex-wrap gap-1.5">
          {integration.callbackContract.canonicalParams.map(param => (
            <span key={param} className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[10px] font-black text-slate-700">
              {param}
            </span>
          ))}
        </div>
      </section>

      <section key="merchant-console-callback-preview" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 key="merchant-console-callback-preview-title" className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
          <Code2 key="merchant-console-callback-preview-icon" className="h-4 w-4 text-blue-600" />
          <span key="merchant-console-callback-preview-label">Safe callback preview</span>
        </h2>
        <pre key="merchant-console-callback-preview-json" className="max-h-[420px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs font-semibold leading-5 text-slate-100">
          {safeJson(integration.safeCallbackPreview)}
        </pre>
      </section>
    </aside>
  );
}

function MerchantConsoleMainColumn({ children }: { children: React.ReactNode }) {
  return (
    <section key="merchant-console-main-column" className="min-w-0 space-y-4">
      {children}
    </section>
  );
}

function WebhookHmacSection({ webhookHmacValidator }: { webhookHmacValidator: MerchantConsoleWebhookHmacValidator }) {
  return (
    <ConsoleSection key="webhook-hmac" eyebrow="Webhook HMAC" title="Webhook HMAC validator">
      <React.Fragment key="webhook-hmac-body">
        <div key="webhook-hmac-summary-grid" className="grid gap-3 md:grid-cols-3">
          {[
            ['Algorithm', webhookHmacValidator.algorithm],
            ['Signature header', webhookHmacValidator.headerName],
            ['Replay window', `${webhookHmacValidator.replayWindowSeconds}s`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
              <p key={`${label}-value`} className="mt-1 break-all font-mono text-xs font-black text-slate-800">{value}</p>
            </div>
          ))}
        </div>
        <div key="webhook-hmac-cases-grid" className="mt-3 grid gap-3 lg:grid-cols-2">
          {webhookHmacValidator.cases.map(testCase => (
            <article key={testCase.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div key={`${testCase.id}-header`} className="flex items-start justify-between gap-3">
                <div key={`${testCase.id}-copy`}>
                  <p key={`${testCase.id}-id`} className="font-mono text-[10px] font-black text-slate-400">{testCase.id}</p>
                  <h3 key={`${testCase.id}-label`} className="mt-1 text-sm font-black text-slate-950">{testCase.label}</h3>
                </div>
                <StatusBadge key={`${testCase.id}-status`} status={testCase.expected} />
              </div>
              <div key={`${testCase.id}-refs`} className="mt-3 grid gap-2">
                <p key={`${testCase.id}-event`} className="break-all font-mono text-[11px] font-bold text-slate-600">{testCase.event}</p>
                <p key={`${testCase.id}-payload-fingerprint`} className="break-all font-mono text-[11px] font-bold text-slate-600">{testCase.payloadFingerprint}</p>
                <p key={`${testCase.id}-signature-header`} className="break-all font-mono text-[11px] font-bold text-slate-600">{testCase.signatureHeader}</p>
                <p key={`${testCase.id}-signing-key-ref`} className="break-all font-mono text-[11px] font-bold text-slate-600">{testCase.signingKeyRef}</p>
              </div>
              <p key={`${testCase.id}-reason`} className="mt-3 text-xs font-semibold leading-5 text-slate-500">{testCase.reason}</p>
              <div key={`${testCase.id}-safe-inputs`} className="mt-3 flex flex-wrap gap-1.5">
                {testCase.safeInputs.map(input => (
                  <span key={input} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-slate-600">
                    {input}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div key="webhook-hmac-negative-gate" className="mt-3 rounded-lg border border-rose-100 bg-rose-50 p-3">
          <p key="webhook-hmac-negative-gate-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-700">Negative fixture gate</p>
          <p key="webhook-hmac-negative-gate-case" className="mt-1 font-mono text-xs font-black text-rose-900">{webhookHmacValidator.negativeCaseId}</p>
          <ul key="webhook-hmac-negative-gate-non-claims" className="mt-2 grid gap-1.5">
            {webhookHmacValidator.nonClaims.map(nonClaim => (
              <li key={nonClaim} className="text-xs font-semibold leading-5 text-rose-900">{nonClaim}</li>
            ))}
          </ul>
        </div>
      </React.Fragment>
    </ConsoleSection>
  );
}

function KeyRotationSection({ webhookKeyRotation }: { webhookKeyRotation: MerchantConsoleWebhookKeyRotation }) {
  return (
    <ConsoleSection key="key-rotation" eyebrow="Key rotation" title="Webhook key rotation readiness">
      <React.Fragment key="key-rotation-body">
        <div key="key-rotation-summary-grid" className="grid gap-3 md:grid-cols-4">
          {[
            ['Runbook', webhookKeyRotation.version],
            ['Active keys', webhookKeyRotation.activeKeyIds.length],
            ['Retired keys', webhookKeyRotation.retiredKeyIds.length],
            ['Overlap', `${webhookKeyRotation.overlapSeconds}s`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
              <p key={`${label}-value`} className="mt-1 break-all font-mono text-xs font-black text-slate-800">{value}</p>
            </div>
          ))}
        </div>
        <div key="key-rotation-detail-layout" className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div key="key-rotation-phases-card" className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <p key="key-rotation-phases-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Rollout phases</p>
            <div key="key-rotation-phases-list" className="mt-3 grid gap-2">
              {webhookKeyRotation.phases.map((phase, index) => (
                <div key={phase} className="flex items-start gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-black leading-5 text-emerald-950">
                  <span key={`${phase}-index`} className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-[10px] text-white">
                    {index + 1}
                  </span>
                  <span key={`${phase}-label`}>{phase}</span>
                </div>
              ))}
            </div>
          </div>
          <div key="key-rotation-evidence-card" className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p key="key-rotation-evidence-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Evidence vectors</p>
            <div key="key-rotation-evidence-list" className="mt-3 grid gap-2">
              {webhookKeyRotation.evidenceVectorIds.map(vectorId => (
                <div key={vectorId} className="rounded-lg bg-white/80 px-3 py-2 font-mono text-[11px] font-black text-blue-900">
                  {vectorId}
                </div>
              ))}
            </div>
            <div key="key-rotation-status-card" className="mt-3 rounded-lg border border-white bg-white/70 p-2">
              <p key="key-rotation-status-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-500">Status</p>
              <StatusBadge key="key-rotation-status-badge" status={webhookKeyRotation.errors.length === 0 ? 'pass' : 'fail'} />
              {webhookKeyRotation.errors.length > 0 && (
                <div key="key-rotation-errors" className="mt-2 grid gap-1">
                  {webhookKeyRotation.errors.map(error => (
                    <p key={error} className="font-mono text-[10px] font-black text-rose-700">{error}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </React.Fragment>
    </ConsoleSection>
  );
}

function MerchantVisibleRedactionContractCard({
  contract,
  copyPayload,
  copied,
  onCopy,
}: {
  contract: MerchantConsoleRedactionDisplayContract;
  copyPayload: HostedAddressLoginMerchantVisibleRedactionCopyPayload;
  copied: boolean;
  onCopy: () => void;
}) {
  const displayRows = contract.displayFields.map(field => ({
    field,
    ref: contract.displayRefsByField[field] ?? 'missing_ref',
  }));
  const countsOnly = contract.renderedMaterialPolicy.showCountsOnly;

  return (
    <div
      key="hosted-merchant-visible-redaction-contract"
      data-merchant-visible-redaction-contract="hosted-test-vectors"
      className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3"
    >
      <div key="hosted-redaction-contract-header" className="flex flex-wrap items-start justify-between gap-3">
        <div key="hosted-redaction-contract-copy">
          <p key="hosted-redaction-contract-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Hosted /test-vectors redaction</p>
          <h3 key="hosted-redaction-contract-title" className="mt-1 text-sm font-black text-emerald-950">Merchant-visible display contract</h3>
          <p key="hosted-redaction-contract-description" className="mt-2 text-xs font-semibold leading-5 text-emerald-900">
            Fixture reader for merchant-safe refs with hidden classes and non-claims summarized as counts only.
          </p>
        </div>
        <div key="hosted-redaction-contract-actions" className="flex flex-wrap items-center gap-2">
          <StatusBadge key="hosted-redaction-contract-status" status={countsOnly ? 'pass' : 'fail'} />
          <button
            key="hosted-redaction-contract-copy-button"
            type="button"
            aria-label="Copy hosted redaction refs"
            onClick={onCopy}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-2 text-[10px] font-black text-emerald-800 shadow-sm hover:bg-emerald-50"
          >
            <ClipboardCheck key="hosted-redaction-contract-copy-button-icon" className="h-3.5 w-3.5" />
            {copied ? copyPayload.successLabel : copyPayload.buttonLabel}
          </button>
        </div>
      </div>
      <div key="hosted-redaction-contract-metrics" className="mt-3 grid gap-2 md:grid-cols-3">
        {[
          ['visible refs', displayRows.length],
          ['blocked classes', contract.blockedClassCount],
          ['non-claims', contract.nonClaimCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-emerald-100 bg-white p-3">
            <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">{label}</p>
            <p key={`${label}-value`} className="mt-1 font-mono text-sm font-black text-emerald-950">{value}</p>
          </div>
        ))}
      </div>
      <div key="hosted-redaction-contract-refs" className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {displayRows.map(row => (
          <div key={row.field} className="rounded-lg border border-emerald-100 bg-white p-3">
            <p key={`${row.field}-field`} className="break-all font-mono text-[10px] font-black text-emerald-700">{row.field}</p>
            <p key={`${row.field}-ref`} className="mt-2 break-all font-mono text-[10px] font-bold leading-4 text-slate-600">{row.ref}</p>
          </div>
        ))}
      </div>
      <div key="hosted-redaction-contract-policy" className="mt-3 flex flex-wrap gap-1.5">
        {[
          contract.boundaryGateId,
          contract.requiredNextAction,
          countsOnly ? 'counts-only' : 'review-render-policy',
          `localOnly: ${copyPayload.localOnly}`,
          `productionTraffic: ${copyPayload.productionTraffic}`,
        ].map(tag => (
          <span key={tag} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-emerald-800">
            {tag}
          </span>
        ))}
      </div>
      <pre key="hosted-redaction-contract-copy-payload" className="mt-3 max-h-52 overflow-auto rounded-md bg-white p-3 font-mono text-[10px] font-black leading-5 text-emerald-950">
        <span key="hosted-redaction-contract-copy-payload-label" className="block text-emerald-700">{copyPayload.label}</span>
        {'\n'}
        {copyPayload.clipboardText}
      </pre>
    </div>
  );
}

export function MerchantConsoleScreen() {
  const integration = React.useMemo(() => buildAddressLoginMerchantIntegration(), []);
  const merchantConsolePlan = React.useMemo(() => buildMerchantConsoleEcPluginPlan(), []);
  const veyIdAdoptionCheck = merchantConsolePlan.veyIdAdoptionCheck;
  const merchantOnboardingSdkCopyPayload = React.useMemo(() => buildMerchantConsoleMerchantOnboardingSdkCopyPayload(), []);
  const merchantOnboardingOpenApiContractStatus = React.useMemo(
    () => buildMerchantConsoleOnboardingOpenApiContractStatus(merchantConsoleOnboardingFixture),
    [],
  );
  const merchantOnboardingOpenApiContractCopyPayload = React.useMemo(
    () => buildMerchantConsoleOnboardingOpenApiContractCopyPayload(merchantOnboardingOpenApiContractStatus),
    [merchantOnboardingOpenApiContractStatus],
  );
  const callbackPreflightRepairActions = React.useMemo(
    () => buildMerchantConsoleCallbackPreflightRepairActions(integration.setupPreflight),
    [integration.setupPreflight],
  );
  const callbackPreflightNegativeFixture = React.useMemo(
    () => buildMerchantConsoleCallbackPreflightNegativeFixture(),
    [],
  );
  const playlistCommerceWebhookRoute = PLAYLIST_COMMERCE_WEBHOOK_ROUTES[0];
  const playlistCommerceSyntheticPing = PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT;
  const playlistCommerceWebhookPreflight = playlistCommerceWebhookPreflightFixture.report;
  const playlistCommerceWebhookPreflightHistory = playlistCommerceWebhookPreflightHistoryFixture;
  const playlistCommerceWebhookEvidence = playlistCommerceWebhookEvidenceFixture;
  const latestPlaylistCommerceEvidence = React.useMemo(
    () => playlistCommerceWebhookEvidence.records.find(record => (
      record.evidenceRef === playlistCommerceWebhookPreflightHistory.summary.latestEvidenceRef
    )),
    [playlistCommerceWebhookEvidence.records, playlistCommerceWebhookPreflightHistory.summary.latestEvidenceRef],
  );
  const playlistCommerceWebhookStatuses = React.useMemo(
    () => playlistCommerceWebhookRoute.responseStatuses.map(response => response.status).join(' / '),
    [playlistCommerceWebhookRoute],
  );
  const webhookKeyRotation = React.useMemo(
    () => buildHostedAddressLoginWebhookKeyRotationRunbook(hostedAddressLoginFixtures as unknown as HostedAddressLoginFixtureSet),
    [],
  );
  const hostedMerchantVisibleRedactionContract = React.useMemo(
    () => (hostedAddressLoginFixtures as unknown as HostedAddressLoginFixtureSet).merchantVisibleRedactionDisplayContract,
    [],
  );
  const hostedMerchantVisibleRedactionCopyPayload = React.useMemo(
    () => buildHostedAddressLoginMerchantVisibleRedactionCopyPayload(hostedMerchantVisibleRedactionContract),
    [hostedMerchantVisibleRedactionContract],
  );
  const veyEcosystem = React.useMemo(() => buildVeyEcosystemResearch(), []);
  const veyCommerceDeliveryUnit = React.useMemo(
    () => veyEcosystem.buildUnits.find(unit => unit.id === 'commerce-and-delivery'),
    [veyEcosystem.buildUnits],
  );
  const veyMerchantProducts = React.useMemo(
    () => veyEcosystem.products.filter(product => (
      ['address-login', 'playlist-commerce', 'delivery-gateway', 'carrier-api-stripe', 'merchant-console'].includes(product.id)
    )),
    [veyEcosystem.products],
  );
  const sandboxCarrierSmoke = React.useMemo(
    () => runSandboxCarrierGatewaySmoke({ objective: 'cheapest' }),
    [],
  );
  const [selectedCarrierCode, setSelectedCarrierCode] = React.useState<'dhl' | 'ups'>('dhl');
  const [selectedCountryCode, setSelectedCountryCode] = React.useState('JP');
  const [capabilityOverrides, setCapabilityOverrides] = React.useState<Record<string, string>>({});
  const [capabilityPreflightResults, setCapabilityPreflightResults] = React.useState<Record<string, MerchantConsoleCarrierCapabilityPreflight>>({});
  const carrierCoverageMatrix = React.useMemo(() => buildAddressWalletCarrierCoverageMatrix(), []);
  const activeCarrierPreflightPreview = React.useMemo(() => buildAddressWalletCarrierPreflightPreview({
    carrier: selectedCarrierCode,
    countryCode: selectedCountryCode,
    includeCarrierCapabilityRef: selectedCarrierCode === 'dhl',
  }), [selectedCarrierCode, selectedCountryCode]);
  const activeCarrierLabelTransform = React.useMemo(() => buildAddressWalletCarrierLabelTransform({
    carrier: selectedCarrierCode,
    countryCode: selectedCountryCode,
    submittedFields: ['recipient', 'countryCode', 'postcode', 'state', 'city', 'poBox'],
    poBoxUsed: true,
    poBoxSpelling: 'P/O/BOX',
  }), [selectedCarrierCode, selectedCountryCode]);
  const normalizedPoBoxSpelling = normalizeAddressWalletPoBoxSpelling('P/O/BOX');
  const carrierPreflightPreviews = React.useMemo(() => [
    buildAddressWalletCarrierPreflightPreview({ carrier: 'dhl', countryCode: 'JP', includeCarrierCapabilityRef: true }),
    buildAddressWalletCarrierPreflightPreview({ carrier: 'ups', countryCode: 'US' }),
  ], []);
  const shipmentCreationReadiness = React.useMemo(() => {
    const [readyShipment] = merchantConsolePlan.sampleShipmentHistory;
    const blockedOrderRef = 'order_ref_synthetic_blocked_capability_001';
    const blockedShipment: MerchantShipmentCreationReadinessInput = {
      orderRef: blockedOrderRef,
      recipientDisplayRef: 'aw_rec_friend_synthetic_display_blocked_001',
      recipientId: 'ship_recipient_synthetic_blocked_001',
      addressFormVersion: 'wallet_country_form_ref_synthetic_blocked_001',
      parcelProfileRef: 'parcel_profile_ref_synthetic_blocked_001',
      walletConsentRef: 'wallet_consent_ref_synthetic_blocked_001',
      carrierCapabilityRef: capabilityOverrides[blockedOrderRef],
      carrierAlias: 'ups',
      servicePreference: 'cheapest',
    };
    return [
      evaluateMerchantShipmentCreationReadiness(readinessInputFromShipment(readyShipment)),
      evaluateMerchantShipmentCreationReadiness(blockedShipment),
    ];
  }, [capabilityOverrides, merchantConsolePlan.sampleShipmentHistory]);
  const skipshipWebhookLedger = React.useMemo(() => buildSkipshipMerchantConsoleWebhookLedger(), []);
  const metrics = React.useMemo(() => buildConsoleMetrics(integration), [integration]);
  const [copied, setCopied] = React.useState(false);
  const [copiedFixtureRef, setCopiedFixtureRef] = React.useState<string | null>(null);
  const [copiedLedgerWebhookRef, setCopiedLedgerWebhookRef] = React.useState<string | null>(null);
  const [copiedOnboardingSdk, setCopiedOnboardingSdk] = React.useState(false);
  const [copiedOnboardingContract, setCopiedOnboardingContract] = React.useState(false);
  const [copiedCallbackNegativeFixture, setCopiedCallbackNegativeFixture] = React.useState(false);
  const [copiedHostedRedactionContract, setCopiedHostedRedactionContract] = React.useState(false);
  const [createdShipments, setCreatedShipments] = React.useState<Record<string, MerchantConsoleLocalHexashipShipmentRecord>>({});
  const localHexashipShipments = React.useMemo(() => Object.values(createdShipments), [createdShipments]);
  const merchantConsoleClipboardRedactionAudit = React.useMemo(
    () => buildMerchantConsoleClipboardRedactionAudit({
      onboardingFixture: merchantConsoleOnboardingFixture,
      callbackNegativeFixture: callbackPreflightNegativeFixture,
      localHexashipShipmentRecords: localHexashipShipments,
    }),
    [callbackPreflightNegativeFixture, localHexashipShipments],
  );
  const localHexashipWebhookRows = React.useMemo(
    () => localHexashipShipments.flatMap(record => record.result.webhookLedger.map(event => ({
      ...event,
      ecOrderRef: record.result.ecOrderRef,
      idempotencyKey: record.idempotencyKey,
      selectedCarrier: record.result.selection.selectedCarrier,
    }))),
    [localHexashipShipments],
  );
  const localHexashipIdempotencyLedgerRows = React.useMemo(
    () => buildMerchantConsoleLocalHexashipIdempotencyLedgerRows(localHexashipShipments),
    [localHexashipShipments],
  );
  const localHexashipLedgerLayoutAudit = React.useMemo(
    () => buildMerchantConsoleLocalHexashipLedgerLayoutAudit(localHexashipIdempotencyLedgerRows),
    [localHexashipIdempotencyLedgerRows],
  );
  const createShipment = React.useCallback((readiness: MerchantShipmentCreationReadiness) => {
    const result = createLocalHexashipShipment(readiness);
    if (result === null) return;
    setCreatedShipments(current => ({
      ...current,
      [readiness.orderRef]: upsertMerchantConsoleLocalHexashipShipmentRecord(current[readiness.orderRef], readiness.orderRef, result),
    }));
  }, []);
  const runCapabilityPreflight = React.useCallback((readiness: MerchantShipmentCreationReadiness) => {
    const result = buildMerchantConsoleCarrierCapabilityPreflight(readiness, selectedCountryCode, selectedCarrierCode);
    setCapabilityPreflightResults(current => ({ ...current, [readiness.orderRef]: result }));
    if (result.response.ok && result.carrierCapabilityRef) {
      setCapabilityOverrides(current => ({ ...current, [readiness.orderRef]: result.carrierCapabilityRef as string }));
    }
  }, [selectedCarrierCode, selectedCountryCode]);
  const copyCommand = async () => {
    await navigator.clipboard?.writeText(integration.setupPreflight.testVectorCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  const copyRequestFixture = async (record: MerchantConsoleLocalHexashipShipmentRecord) => {
    const fixture = buildMerchantConsoleLocalHexashipRequestFixture(record);
    await navigator.clipboard?.writeText(buildMerchantConsoleLocalHexashipRequestFixtureCopyText(fixture));
    setCopiedFixtureRef(record.result.shipment.shipmentRef);
    window.setTimeout(() => setCopiedFixtureRef(null), 1200);
  };
  const copyLedgerWebhookRef = async (eventRef: string) => {
    await navigator.clipboard?.writeText(eventRef);
    setCopiedLedgerWebhookRef(eventRef);
    window.setTimeout(() => setCopiedLedgerWebhookRef(null), 1200);
  };
  const copyMerchantOnboardingSdkSnippet = async () => {
    await navigator.clipboard?.writeText(merchantOnboardingSdkCopyPayload.clipboardText);
    setCopiedOnboardingSdk(true);
    window.setTimeout(() => setCopiedOnboardingSdk(false), 1200);
  };
  const copyMerchantOnboardingOpenApiContract = async () => {
    await navigator.clipboard?.writeText(merchantOnboardingOpenApiContractCopyPayload.clipboardText);
    setCopiedOnboardingContract(true);
    window.setTimeout(() => setCopiedOnboardingContract(false), 1200);
  };
  const copyCallbackNegativeFixture = async () => {
    await navigator.clipboard?.writeText(buildMerchantConsoleCallbackPreflightNegativeFixtureCopyText(callbackPreflightNegativeFixture));
    setCopiedCallbackNegativeFixture(true);
    window.setTimeout(() => setCopiedCallbackNegativeFixture(false), 1200);
  };
  const copyHostedRedactionContract = async () => {
    await copyHostedAddressLoginMerchantVisibleRedactionClipboardPayload(
      hostedMerchantVisibleRedactionCopyPayload,
      text => navigator.clipboard?.writeText(text),
    );
    setCopiedHostedRedactionContract(true);
    window.setTimeout(() => setCopiedHostedRedactionContract(false), 1200);
  };

  return (
    <main className="agid-page-scroll bg-[#f6f8fb] text-slate-950">
      <header key="merchant-console-header" className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div key="merchant-console-header-title-row" className="flex min-w-0 items-center gap-3">
            <button
              key="merchant-console-home-button"
              type="button"
              onClick={goHome}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Back to AGID map"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div key="merchant-console-header-copy">
              <p key="merchant-console-header-eyebrow" className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Merchant Console beta</p>
              <h1 key="merchant-console-header-title" className="text-2xl font-black text-slate-950">Address Login Merchant Console</h1>
              <p key="merchant-console-header-subtitle" className="mt-0.5 text-sm font-semibold text-slate-500">
                Configure callback, webhook, policy, and synthetic test vectors without handling address material.
              </p>
            </div>
          </div>
          <div key="merchant-console-header-badges" className="flex flex-wrap items-center gap-2">
            <span key="merchant-console-header-no-raw-address" className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
              no raw address console
            </span>
            <span key="merchant-console-header-contract-version" className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-blue-700">
              {integration.setupPreflight.callbackContractVersion}
            </span>
          </div>
        </div>
      </header>

      <div key="merchant-console-layout" className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside key="merchant-console-left-rail" className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section key="merchant-console-tenant-card" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div key="merchant-console-tenant-card-header" className="flex items-center gap-2">
              <Store key="merchant-console-tenant-card-icon" className="h-5 w-5 text-blue-600" />
              <h2 key="merchant-console-tenant-card-title" className="text-sm font-black text-slate-950">Tenant</h2>
            </div>
            <div key="merchant-console-tenant-card-fields" className="mt-3 grid gap-2">
              {[
                ['Client', MERCHANT_CONSOLE_FIXTURE.clientId],
                ['Environment', MERCHANT_CONSOLE_FIXTURE.environment],
                ['Support', MERCHANT_CONSOLE_FIXTURE.supportRef],
                ['Billing', MERCHANT_CONSOLE_FIXTURE.billingRef],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
                  <p key={`${label}-value`} className="mt-1 font-mono text-xs font-black text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section key="merchant-console-setup-card" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 key="merchant-console-setup-card-title" className="text-sm font-black text-slate-950">Setup areas</h2>
            <div key="merchant-console-setup-card-areas" className="mt-3 grid gap-2">
              {MERCHANT_CONSOLE_SETUP_AREAS.map(area => {
                const Icon = area.icon;
                return (
                  <div key={area.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                    <Icon key={`${area.id}-icon`} className="h-4 w-4 text-blue-600" />
                    <span key={`${area.id}-label`}>{area.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <MerchantConsoleMainColumn key="merchant-console-main-column">
          <div key="merchant-console-metrics-grid" className="grid gap-3 md:grid-cols-4">
            {metrics.map(metric => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} note={metric.note} />
            ))}
          </div>

          <ConsoleSection key="shipping-stripe-onboarding" eyebrow="Shipping Stripe onboarding" title="One Hexaship integration for DHL and UPS">
            <React.Fragment key="shipping-stripe-onboarding-body">
            <div key="shipping-stripe-onboarding-clipboard-audit" className="mb-3 grid gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 md:grid-cols-[minmax(0,1fr)_repeat(4,120px)]">
              <div key="shipping-stripe-onboarding-clipboard-audit-copy" className="min-w-0">
                <p key="shipping-stripe-onboarding-clipboard-audit-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Clipboard redaction audit</p>
                <p key="shipping-stripe-onboarding-clipboard-audit-status" className="mt-1 break-all font-mono text-[11px] font-black text-emerald-950">
                  {merchantConsoleClipboardRedactionAudit.validationErrors.length === 0 ? 'ready' : 'blocked'}
                </p>
              </div>
              {[
                ['candidates', String(merchantConsoleClipboardRedactionAudit.candidateCount)],
                ['localOnly', String(merchantConsoleClipboardRedactionAudit.localOnly)],
                ['productionTraffic', String(merchantConsoleClipboardRedactionAudit.productionTraffic)],
                ['privateMaterial', String(merchantConsoleClipboardRedactionAudit.privateMaterialExposed)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-white px-2 py-1.5">
                  <p key={`${label}-clipboard-audit-label`} className="text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700">{label}</p>
                  <p key={`${label}-clipboard-audit-value`} className="mt-1 break-all font-mono text-[10px] font-black text-emerald-950">{value}</p>
                </div>
              ))}
            </div>
            <div key="shipping-stripe-onboarding-layout" className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div key="shipping-stripe-onboarding-main" className="space-y-3">
                <div key="shipping-stripe-onboarding-sdk-call-card" className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p key="shipping-stripe-onboarding-sdk-call-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">EC SDK call</p>
                  <pre key="shipping-stripe-onboarding-sdk-call-code" className="mt-2 overflow-x-auto rounded-md bg-white p-3 font-mono text-[11px] font-black leading-5 text-blue-950">
                    {merchantConsolePlan.ecCreateShipmentExample.sdkCall}
                  </pre>
                  <div key="shipping-stripe-onboarding-merchant-visible-refs" className="mt-3 grid gap-2 sm:grid-cols-2">
                    {merchantConsolePlan.ecCreateShipmentExample.merchantVisibleRefs.map(ref => (
                      <div key={ref} className="rounded-md bg-white px-3 py-2">
                        <p key={`${ref}-label`} className="text-[10px] font-black uppercase tracking-[0.08em] text-blue-700">Merchant visible</p>
                        <p key={`${ref}-value`} className="mt-1 font-mono text-[11px] font-black text-blue-950">{ref}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div key="shipping-stripe-onboarding-sdk-copy-card" className="rounded-lg border border-violet-100 bg-violet-50 p-3">
                  <div key="shipping-stripe-onboarding-sdk-copy-header" className="flex items-center justify-between gap-2">
                    <p key="shipping-stripe-onboarding-sdk-copy-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">{merchantOnboardingSdkCopyPayload.label}</p>
                    <button
                      key="shipping-stripe-onboarding-sdk-copy-button"
                      type="button"
                      aria-label="Copy Merchant onboarding SDK snippet"
                      onClick={copyMerchantOnboardingSdkSnippet}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-violet-200 bg-white px-2 text-[10px] font-black text-violet-800 shadow-sm hover:bg-violet-50"
                    >
                      <ClipboardCheck key="shipping-stripe-onboarding-sdk-copy-button-icon" className="h-3.5 w-3.5" />
                      {copiedOnboardingSdk ? merchantOnboardingSdkCopyPayload.successLabel : merchantOnboardingSdkCopyPayload.buttonLabel}
                    </button>
                  </div>
                  <pre key="shipping-stripe-onboarding-sdk-copy-code" className="mt-2 max-h-72 overflow-auto rounded-md bg-white p-3 font-mono text-[10px] font-black leading-5 text-violet-950">
                    {merchantOnboardingSdkCopyPayload.clipboardText}
                  </pre>
                </div>

                <div key="shipping-stripe-onboarding-openapi-card" className="rounded-lg border border-cyan-100 bg-cyan-50 p-3">
                  <div key="shipping-stripe-onboarding-openapi-header" className="flex flex-wrap items-start justify-between gap-2">
                    <div key="shipping-stripe-onboarding-openapi-title-row" className="flex min-w-0 items-center gap-2">
                      <ShieldCheck key="shipping-stripe-onboarding-openapi-icon" className="h-4 w-4 text-cyan-700" />
                      <div key="shipping-stripe-onboarding-openapi-copy" className="min-w-0">
                        <p key="shipping-stripe-onboarding-openapi-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">{merchantOnboardingOpenApiContractCopyPayload.label}</p>
                        <p key="shipping-stripe-onboarding-openapi-path" className="mt-1 break-all font-mono text-[11px] font-black text-cyan-950">
                          {merchantOnboardingOpenApiContractStatus.path}
                        </p>
                      </div>
                    </div>
                    <button
                      key="shipping-stripe-onboarding-openapi-button"
                      type="button"
                      aria-label="Copy Merchant onboarding OpenAPI contract"
                      onClick={copyMerchantOnboardingOpenApiContract}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-cyan-200 bg-white px-2 text-[10px] font-black text-cyan-800 shadow-sm hover:bg-cyan-50"
                    >
                      <ClipboardCheck key="shipping-stripe-onboarding-openapi-button-icon" className="h-3.5 w-3.5" />
                      {copiedOnboardingContract ? merchantOnboardingOpenApiContractCopyPayload.successLabel : merchantOnboardingOpenApiContractCopyPayload.buttonLabel}
                    </button>
                  </div>
                  <div key="shipping-stripe-onboarding-openapi-status-grid" className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      ['contract', merchantOnboardingOpenApiContractStatus.contractState],
                      ['enabled carriers', merchantOnboardingOpenApiContractStatus.enabledCarriers.join(' + ')],
                      ['Vey ID client', merchantOnboardingOpenApiContractStatus.addressLoginClientRef ?? 'missing'],
                      ['Callback preflight', merchantOnboardingOpenApiContractStatus.addressLoginCallbackPreflightRef ?? 'missing'],
                      ['Callback contract', merchantOnboardingOpenApiContractStatus.callbackContractVersion ?? 'missing'],
                      ['Callback preflight passed', String(merchantOnboardingOpenApiContractStatus.callbackPreflightPassed)],
                      ['address form', merchantOnboardingOpenApiContractStatus.addressFormVersionRef ?? 'missing'],
                      ['fixture', merchantOnboardingOpenApiContractStatus.fixture],
                      ['verifier', merchantOnboardingOpenApiContractStatus.verifier],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-white px-3 py-2">
                        <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.08em] text-cyan-700">{label}</p>
                        <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-cyan-950">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div key="shipping-stripe-onboarding-openapi-safety-flags" className="mt-3 flex flex-wrap gap-1.5">
                    {merchantOnboardingOpenApiContractStatus.safetyFlags.map(flag => (
                      <span key={flag} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-cyan-900">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>

                <div key="shipping-stripe-onboarding-integration-modes" className="grid gap-2 md:grid-cols-2">
                  {merchantConsolePlan.integrationModes.map(mode => (
                    <article key={mode.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div key={`${mode.id}-row`} className="flex items-start gap-2">
                        <ServerCog key={`${mode.id}-icon`} className="mt-0.5 h-4 w-4 text-slate-500" />
                        <div key={`${mode.id}-copy`} className="min-w-0">
                          <h3 key={`${mode.id}-title`} className="text-sm font-black text-slate-950">{mode.title}</h3>
                          <p key={`${mode.id}-target`} className="mt-1 text-xs font-semibold leading-5 text-slate-600">{mode.target}</p>
                          <p key={`${mode.id}-artifact`} className="mt-2 break-all font-mono text-[10px] font-black text-slate-700">{mode.primaryInstallArtifact}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div key="shipping-stripe-onboarding-hidden-from-ec-card" className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <div key="shipping-stripe-onboarding-hidden-from-ec-header" className="flex items-center gap-2">
                  <EyeOff key="shipping-stripe-onboarding-hidden-from-ec-icon" className="h-4 w-4 text-emerald-700" />
                  <h3 key="shipping-stripe-onboarding-hidden-from-ec-title" className="text-sm font-black text-emerald-950">Hidden from EC</h3>
                </div>
                <div key="shipping-stripe-onboarding-hidden-material" className="mt-3 flex flex-wrap gap-1.5">
                  {merchantConsolePlan.ecCreateShipmentExample.merchantHiddenMaterial.map(item => (
                    <span key={item} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-emerald-900">
                      {item}
                    </span>
                  ))}
                </div>
                <div key="shipping-stripe-onboarding-hidden-pipeline" className="mt-3 grid gap-2">
                  {merchantConsolePlan.ecCreateShipmentExample.hiddenBackendPipeline.map((step, index) => (
                    <div key={step} className="flex gap-2 rounded-md bg-white/80 px-2 py-1.5">
                      <span key={`${step}-index`} className="font-mono text-[10px] font-black text-emerald-700">{String(index + 1).padStart(2, '0')}</span>
                      <p key={`${step}-label`} className="break-all font-mono text-[10px] font-bold text-emerald-950">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div key="shipping-stripe-onboarding-steps" className="mt-3 grid gap-2 lg:grid-cols-5">
              {merchantConsolePlan.onboardingSteps.map((step, index) => (
                <article key={step.id} className="rounded-lg border border-slate-100 bg-white p-3">
                  <p key={`${step.id}-index`} className="font-mono text-[10px] font-black text-blue-600">STEP {index + 1}</p>
                  <h3 key={`${step.id}-title`} className="mt-1 text-sm font-black text-slate-950">{step.title}</h3>
                  <p key={`${step.id}-purpose`} className="mt-1 text-xs font-semibold leading-5 text-slate-600">{step.purpose}</p>
                  <p key={`${step.id}-completion-gate`} className="mt-2 break-all font-mono text-[10px] font-black text-slate-700">{step.completionGate}</p>
                  <div key={`${step.id}-safe-output-refs`} className="mt-2 flex flex-wrap gap-1">
                    {step.safeOutputRefs.map(ref => (
                      <span key={ref} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-black text-slate-700">
                        {ref}
                      </span>
                    ))}
                  </div>
                  <div key={`${step.id}-required-fields`} className="mt-3 grid gap-1.5">
                    {step.fieldGroups.flatMap(group => group.fields.filter(field => field.required).slice(0, 4)).map(field => (
                      <div key={field.id} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5">
                        <p key={`${field.id}-id`} className="break-all font-mono text-[10px] font-black text-slate-800">{field.id}</p>
                        <p key={`${field.id}-label`} className="mt-0.5 text-[10px] font-bold leading-4 text-slate-500">{field.label}</p>
                      </div>
                    ))}
                  </div>
                  {step.id === 'address-wallet-settings' && (
                    <div key={`${step.id}-wallet-form-boundary`} className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5">
                      <p key={`${step.id}-wallet-form-boundary-label`} className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">Wallet form boundary</p>
                      <div key={`${step.id}-wallet-form-boundary-fields`} className="mt-1 flex flex-wrap gap-1">
                        {step.fieldGroups
                          .flatMap(group => group.fields)
                          .filter(field => MERCHANT_WALLET_ONBOARDING_FIELD_IDS.includes(field.id))
                          .map(field => (
                            <span key={field.id} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-blue-950">
                              {field.id}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div key="shipping-stripe-onboarding-ops-cards" className="mt-3 grid gap-3 lg:grid-cols-3">
              <div key="shipping-stripe-onboarding-api-keys-card" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div key="shipping-stripe-onboarding-api-keys-header" className="flex items-center gap-2">
                  <KeyRound key="shipping-stripe-onboarding-api-keys-icon" className="h-4 w-4 text-slate-500" />
                  <h3 key="shipping-stripe-onboarding-api-keys-title" className="text-sm font-black text-slate-950">API keys</h3>
                </div>
                <div key="shipping-stripe-onboarding-api-keys-list" className="mt-2 grid gap-1">
                  {merchantConsolePlan.apiKeyPolicy.keyRefs.map(ref => (
                    <p key={ref} className="break-all rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-slate-700">{ref}</p>
                  ))}
                </div>
              </div>
              <div key="shipping-stripe-onboarding-webhook-events-card" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div key="shipping-stripe-onboarding-webhook-events-header" className="flex items-center gap-2">
                  <Webhook key="shipping-stripe-onboarding-webhook-events-icon" className="h-4 w-4 text-slate-500" />
                  <h3 key="shipping-stripe-onboarding-webhook-events-title" className="text-sm font-black text-slate-950">Webhook events</h3>
                </div>
                <div key="shipping-stripe-onboarding-webhook-events-list" className="mt-2 grid gap-1">
                  {merchantConsolePlan.webhookSetup.events.map(event => (
                    <p key={event} className="break-all rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-slate-700">{event}</p>
                  ))}
                </div>
              </div>
              <div key="shipping-stripe-onboarding-production-review-card" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div key="shipping-stripe-onboarding-production-review-header" className="flex items-center gap-2">
                  <ShieldCheck key="shipping-stripe-onboarding-production-review-icon" className="h-4 w-4 text-slate-500" />
                  <h3 key="shipping-stripe-onboarding-production-review-title" className="text-sm font-black text-slate-950">Production review</h3>
                </div>
                <div key="shipping-stripe-onboarding-production-review-list" className="mt-2 grid gap-1">
                  {merchantConsolePlan.productionReviewGates.slice(0, 5).map(gate => (
                    <p key={gate.id} className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-slate-700">{gate.label}</p>
                  ))}
                </div>
              </div>
            </div>
            </React.Fragment>
          </ConsoleSection>

          <ConsoleSection key="vey-id-adoption" eyebrow="Vey ID" title="Vey ID Core adoption check">
            <React.Fragment key="vey-id-adoption-body">
              <div key="vey-id-adoption-control-grid" className="grid gap-3 lg:grid-cols-3">
                <div key="vey-id-adoption-google-apple-card" className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                  <div key="vey-id-adoption-google-apple-header" className="flex items-center justify-between gap-2">
                    <div key="vey-id-adoption-google-apple-title-row" className="flex items-center gap-2">
                      <LockKeyhole key="vey-id-adoption-google-apple-icon" className="h-4 w-4 text-indigo-700" />
                      <h3 key="vey-id-adoption-google-apple-title" className="text-sm font-black text-indigo-950">Google/Apple account creation</h3>
                    </div>
                    <StatusBadge key="vey-id-adoption-google-apple-status" status={veyIdAdoptionCheck.accountCreationProviders.join('+') === 'google+apple' ? 'pass' : 'warn'} />
                  </div>
                  <div key="vey-id-adoption-google-apple-providers" className="mt-3 flex flex-wrap gap-1.5">
                    {veyIdAdoptionCheck.accountCreationProviders.map(provider => (
                      <span key={provider} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-indigo-900">
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>

                <div key="vey-id-adoption-pkce-card" className="rounded-lg border border-sky-100 bg-sky-50 p-3">
                  <div key="vey-id-adoption-pkce-header" className="flex items-center gap-2">
                    <Code2 key="vey-id-adoption-pkce-icon" className="h-4 w-4 text-sky-700" />
                    <h3 key="vey-id-adoption-pkce-title" className="text-sm font-black text-sky-950">PKCE server exchange</h3>
                  </div>
                  <div key="vey-id-adoption-pkce-routes" className="mt-3 grid gap-1.5">
                    {veyIdAdoptionCheck.requiredRoutes.map(route => (
                      <p key={route} className="break-all rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-sky-900">
                        {route}
                      </p>
                    ))}
                  </div>
                </div>

                <div key="vey-id-adoption-revocation-card" className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <div key="vey-id-adoption-revocation-header" className="flex items-center justify-between gap-2">
                    <div key="vey-id-adoption-revocation-title-row" className="flex items-center gap-2">
                      <ShieldCheck key="vey-id-adoption-revocation-icon" className="h-4 w-4 text-emerald-700" />
                      <h3 key="vey-id-adoption-revocation-title" className="text-sm font-black text-emerald-950">Wallet-side revocation</h3>
                    </div>
                    <StatusBadge key="vey-id-adoption-revocation-status" status={veyIdAdoptionCheck.productionTraffic ? 'fail' : 'pass'} />
                  </div>
                  <div key="vey-id-adoption-revocation-refs" className="mt-3 flex flex-wrap gap-1.5">
                    {veyIdAdoptionCheck.walletRevocationRefs.map(ref => (
                      <span key={ref} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-emerald-900">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div key="vey-id-adoption-runtime-grid" className="mt-3 grid gap-3 lg:grid-cols-3">
                <div key="vey-id-adoption-sdk-packages-card" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p key="vey-id-adoption-sdk-packages-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">SDK packages</p>
                  <div key="vey-id-adoption-sdk-packages" className="mt-2 grid gap-1.5">
                    {veyIdAdoptionCheck.requiredSdkPackages.map(sdkPackage => (
                      <p key={sdkPackage} className="break-all rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-slate-800">
                        {sdkPackage}
                      </p>
                    ))}
                  </div>
                </div>

                <div key="vey-id-adoption-controls-card" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p key="vey-id-adoption-controls-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Required controls</p>
                  <div key="vey-id-adoption-controls" className="mt-2 flex flex-wrap gap-1.5">
                    {veyIdAdoptionCheck.requiredControls.map(control => (
                      <span key={control} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-slate-800">
                        {control}
                      </span>
                    ))}
                  </div>
                </div>

                <div key="vey-id-adoption-verifiers-card" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p key="vey-id-adoption-verifiers-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Verifier commands</p>
                  <div key="vey-id-adoption-verifiers" className="mt-2 grid gap-1.5">
                    {veyIdAdoptionCheck.verifierCommands.map(command => (
                      <p key={command} className="break-all rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-slate-800">
                        {command}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div key="vey-id-adoption-boundary-grid" className="mt-3 grid gap-3 xl:grid-cols-4">
                <div key="vey-id-adoption-visible-refs-card" className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p key="vey-id-adoption-visible-refs-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Merchant visible refs</p>
                  <div key="vey-id-adoption-visible-refs" className="mt-2 flex flex-wrap gap-1.5">
                    {veyIdAdoptionCheck.merchantVisibleRefs.map(ref => (
                      <span key={ref} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-blue-950">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>

                <div key="vey-id-adoption-browser-refs-card" className="rounded-lg border border-violet-100 bg-violet-50 p-3">
                  <p key="vey-id-adoption-browser-refs-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">Browser-only refs</p>
                  <div key="vey-id-adoption-browser-refs" className="mt-2 flex flex-wrap gap-1.5">
                    {veyIdAdoptionCheck.browserOnlyRefs.map(ref => (
                      <span key={ref} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-violet-950">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>

                <div key="vey-id-adoption-server-refs-card" className="rounded-lg border border-cyan-100 bg-cyan-50 p-3">
                  <p key="vey-id-adoption-server-refs-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">Server-only refs</p>
                  <div key="vey-id-adoption-server-refs" className="mt-2 flex flex-wrap gap-1.5">
                    {veyIdAdoptionCheck.serverOnlyRefs.map(ref => (
                      <span key={ref} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-cyan-950">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>

                <div key="vey-id-adoption-blocked-card" className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                  <p key="vey-id-adoption-blocked-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-700">Blocked material</p>
                  <div key="vey-id-adoption-blocked-material" className="mt-2 flex flex-wrap gap-1.5">
                    {veyIdAdoptionCheck.blockedMaterial.slice(0, 8).map(item => (
                      <span key={item} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-rose-950">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <MerchantVisibleRedactionContractCard
                key="hosted-merchant-visible-redaction-contract-card"
                contract={hostedMerchantVisibleRedactionContract}
                copyPayload={hostedMerchantVisibleRedactionCopyPayload}
                copied={copiedHostedRedactionContract}
                onCopy={copyHostedRedactionContract}
              />
            </React.Fragment>
          </ConsoleSection>

          <ConsoleSection key="vey-ecosystem" eyebrow="Vey Ecosystem" title="Vey Ecosystem operations map">
            <React.Fragment key="vey-ecosystem-body">
            <div key="vey-ecosystem-operations-layout" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div key="vey-ecosystem-strategy-card" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p key="vey-ecosystem-strategy-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Strategy</p>
                <h3 key="vey-ecosystem-strategy-title" className="mt-1 text-sm font-black text-slate-950">Wallet, Address Login, Playlist Commerce, Delivery Gateway, and Carrier API Stripe</h3>
                <p key="vey-ecosystem-strategy-copy" className="mt-2 text-xs font-semibold leading-5 text-slate-600">{veyEcosystem.thesis}</p>
                <div key="vey-ecosystem-product-tags" className="mt-3 flex flex-wrap gap-1.5">
                  {veyMerchantProducts.map(product => (
                    <span key={product.id} className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-700">
                      {product.name}
                    </span>
                  ))}
                </div>
              </div>
              <div key="vey-ecosystem-release-slice-card" className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p key="vey-ecosystem-release-slice-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Release slice</p>
                <h3 key="vey-ecosystem-release-slice-title" className="mt-1 text-sm font-black text-blue-950">{veyCommerceDeliveryUnit?.packageName ?? 'vey-commerce-delivery'}</h3>
                <p key="vey-ecosystem-release-slice-gate" className="mt-2 text-xs font-semibold leading-5 text-blue-900">{veyCommerceDeliveryUnit?.firstReleaseGate}</p>
                <p key="vey-ecosystem-release-slice-command" className="mt-3 break-all font-mono text-[11px] font-black text-blue-950">{veyCommerceDeliveryUnit?.verificationCommand}</p>
              </div>
            </div>
            <div key="vey-ecosystem-api-surfaces-grid" className="mt-3 grid gap-2 md:grid-cols-3">
              {veyEcosystem.apiSurfaces
                .filter(surface => ['address-login-drop-in', 'carrier-routing-api', 'merchant-operator-console'].includes(surface.id))
                .map(surface => (
                  <div key={surface.id} className="rounded-lg border border-slate-100 bg-white p-3">
                    <div key={`${surface.id}-header`} className="flex items-start justify-between gap-3">
                      <div key={`${surface.id}-copy`}>
                        <p key={`${surface.id}-mode`} className="font-mono text-[10px] font-black text-slate-400">{surface.integrationMode}</p>
                        <h3 key={`${surface.id}-title`} className="mt-1 text-sm font-black text-slate-950">{surface.id}</h3>
                      </div>
                      <ServerCog key={`${surface.id}-icon`} className="h-4 w-4 shrink-0 text-blue-600" />
                    </div>
                    <p key={`${surface.id}-purpose`} className="mt-2 text-xs font-semibold leading-5 text-slate-600">{surface.purpose}</p>
                  </div>
                ))}
            </div>
            <div key="vey-ecosystem-sandbox-carrier-smoke-card" className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <div key="vey-ecosystem-sandbox-carrier-smoke-header" className="flex flex-wrap items-start justify-between gap-3">
                <div key="vey-ecosystem-sandbox-carrier-smoke-copy">
                  <p key="vey-ecosystem-sandbox-carrier-smoke-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Sandbox carrier smoke</p>
                  <h3 key="vey-ecosystem-sandbox-carrier-smoke-title" className="mt-1 text-sm font-black text-emerald-950">rate -&gt; allocate -&gt; label -&gt; tracking webhook -&gt; delivery proof</h3>
                  <p key="vey-ecosystem-sandbox-carrier-smoke-description" className="mt-2 text-xs font-semibold leading-5 text-emerald-900">
                    Local synthetic carrier flow for Merchant Console readiness without carrier API keys, raw labels, or address fixtures.
                  </p>
                </div>
                <div key="vey-ecosystem-sandbox-carrier-smoke-flags" className="flex flex-wrap gap-1.5">
                  <StatusBadge key="vey-ecosystem-sandbox-carrier-smoke-status" status={sandboxCarrierSmoke.validationErrors.length === 0 ? 'pass' : 'fail'} />
                  <span key="vey-ecosystem-sandbox-carrier-smoke-local-only" className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-800">
                    localOnly: {String(sandboxCarrierSmoke.localOnly)}
                  </span>
                  <span key="vey-ecosystem-sandbox-carrier-smoke-production-traffic" className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-800">
                    productionTraffic: {String(sandboxCarrierSmoke.productionTraffic)}
                  </span>
                  <span key="vey-ecosystem-sandbox-carrier-smoke-raw-address-fixtures" className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-800">
                    rawAddressFixtures: {String(sandboxCarrierSmoke.rawAddressFixtures)}
                  </span>
                </div>
              </div>
              <div key="vey-ecosystem-sandbox-carrier-smoke-steps" className="mt-3 grid gap-2 lg:grid-cols-5">
                {sandboxCarrierSmoke.steps.map(step => (
                  <div key={step.surface} className="rounded-lg border border-emerald-100 bg-white p-3">
                    <div key={`${step.surface}-header`} className="flex items-center justify-between gap-2">
                      <p key={`${step.surface}-surface`} className="font-mono text-[10px] font-black text-emerald-600">{step.surface}</p>
                      <StatusBadge key={`${step.surface}-status`} status={step.status} />
                    </div>
                    <h4 key={`${step.surface}-label`} className="mt-2 text-xs font-black text-slate-950">{step.surface}</h4>
                    <p key={`${step.surface}-ref`} className="mt-2 break-all font-mono text-[10px] font-bold leading-4 text-slate-500">{step.ref}</p>
                  </div>
                ))}
              </div>
              <div key="vey-ecosystem-sandbox-carrier-smoke-boundaries" className="mt-3 grid gap-2 lg:grid-cols-2">
                <div key="vey-ecosystem-sandbox-carrier-smoke-merchant-visible-card" className="rounded-lg border border-emerald-100 bg-white p-3">
                  <p key="vey-ecosystem-sandbox-carrier-smoke-merchant-visible-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Merchant-visible refs</p>
                  <div key="vey-ecosystem-sandbox-carrier-smoke-merchant-visible-list" className="mt-2 grid gap-1.5">
                    {Object.entries(sandboxCarrierSmoke.merchantVisible).map(([key, value]) => (
                      <div key={key} className="flex min-w-0 items-center justify-between gap-2 rounded-md bg-emerald-50 px-2 py-1.5">
                        <span key={`${key}-label`} className="text-[10px] font-black uppercase tracking-[0.08em] text-emerald-800">{key}</span>
                        <span key={`${key}-value`} className="truncate font-mono text-[10px] font-bold text-slate-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div key="vey-ecosystem-sandbox-carrier-smoke-blocked-card" className="rounded-lg border border-emerald-100 bg-white p-3">
                  <p key="vey-ecosystem-sandbox-carrier-smoke-blocked-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Blocked material</p>
                  <div key="vey-ecosystem-sandbox-carrier-smoke-blocked-list" className="mt-2 flex flex-wrap gap-1.5">
                    {sandboxCarrierSmoke.blockedMaterial.map(item => (
                      <span key={item} className="rounded-md bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-rose-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div key="merchant-console-carrier-coverage-matrix" className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <div key="merchant-console-carrier-coverage-matrix-header" className="flex flex-wrap items-start justify-between gap-3">
                <div key="merchant-console-carrier-coverage-matrix-copy">
                  <p key="merchant-console-carrier-coverage-matrix-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Address Wallet carrier coverage matrix</p>
                  <h3 key="merchant-console-carrier-coverage-matrix-title" className="mt-1 text-sm font-black text-blue-950">DHL/UPS country forms before runtime capability checks</h3>
                  <p key="merchant-console-carrier-coverage-matrix-description" className="mt-2 text-xs font-semibold leading-5 text-blue-900">
                    Merchant Console can show supported wallet form countries while keeping carrier availability as a server-side runtime check.
                  </p>
                </div>
                <div key="merchant-console-carrier-coverage-matrix-flags" className="flex flex-wrap gap-1.5">
                  <span key="merchant-console-carrier-coverage-matrix-country-count" className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-blue-800">
                    countries: {carrierCoverageMatrix.countryCount}
                  </span>
                  <span key="merchant-console-carrier-coverage-matrix-production-traffic" className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-blue-800">
                    productionTraffic: {String(carrierCoverageMatrix.productionTraffic)}
                  </span>
                </div>
              </div>
              <div key="merchant-console-carrier-coverage-layout" className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div key="merchant-console-carrier-coverage-country-forms-card" className="rounded-lg border border-blue-100 bg-white p-3">
                  <p key="merchant-console-carrier-coverage-country-forms-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">MVP country forms</p>
                  <div key="merchant-console-carrier-coverage-country-code-tags" className="mt-2 flex flex-wrap gap-1.5">
                    {carrierCoverageMatrix.countryCodes.map(countryCode => (
                      <span key={countryCode} className="rounded-md bg-blue-50 px-2 py-1 font-mono text-[10px] font-black text-blue-950">
                        {countryCode}
                      </span>
                    ))}
                  </div>
                  <div key="merchant-console-carrier-coverage-continent-grid" className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {Object.entries(carrierCoverageMatrix.continentCoverage).map(([continent, countryCodes]) => (
                      <div key={continent} className="rounded-md bg-blue-50 px-2 py-1.5">
                        <p key={`${continent}-label`} className="text-[10px] font-black uppercase tracking-[0.08em] text-blue-700">{continent}</p>
                        <p key={`${continent}-countries`} className="mt-1 font-mono text-[10px] font-black text-blue-950">{countryCodes.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div key="merchant-console-carrier-coverage-runtime-boundary-card" className="rounded-lg border border-blue-100 bg-white p-3">
                  <p key="merchant-console-carrier-coverage-runtime-boundary-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Carrier runtime boundary</p>
                  <div key="merchant-console-carrier-coverage-runtime-boundary-list" className="mt-2 grid gap-2">
                    {carrierCoverageMatrix.carrierSummaries.map(summary => (
                      <div key={summary.carrier} className="rounded-md bg-blue-50 px-2 py-1.5">
                        <div key={`${summary.carrier}-header`} className="flex items-center justify-between gap-2">
                          <p key={`${summary.carrier}-code`} className="font-mono text-[10px] font-black uppercase text-blue-950">{summary.carrier}</p>
                          <p key={`${summary.carrier}-country-count`} className="font-mono text-[10px] font-black text-blue-700">{summary.countryCount} countries</p>
                        </div>
                        <p key={`${summary.carrier}-capability-modes`} className="mt-1 break-all font-mono text-[10px] font-bold text-blue-900">
                          capabilityModes: {summary.capabilityModes.join(', ')}
                        </p>
                        <p key={`${summary.carrier}-street-level-validation-countries`} className="mt-1 break-all font-mono text-[10px] font-bold text-blue-900">
                          streetLevelValidationCountryCodes: {summary.streetLevelValidationCountryCodes.join(', ') || 'none'}
                        </p>
                        <p key={`${summary.carrier}-runtime-checks`} className="mt-1 font-mono text-[10px] font-bold text-blue-900">
                          serverSideRuntimeChecksRequired: {String(summary.serverSideRuntimeChecksRequired)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-blue-100 bg-white p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Carrier form preflight next actions</p>
                <CarrierCountryPreflightSelector
                  carrierCoverageMatrix={carrierCoverageMatrix}
                  selectedCarrierCode={selectedCarrierCode}
                  selectedCountryCode={selectedCountryCode}
                  activeNextAction={activeCarrierPreflightPreview.activeNextAction}
                  activeSelectionAction={activeCarrierPreflightPreview.activeSelectionAction}
                  activeMissingRefs={activeCarrierPreflightPreview.activeMissingRefs}
                  onCarrierChange={setSelectedCarrierCode}
                  onCountryChange={setSelectedCountryCode}
                />
                {activeCarrierLabelTransform && (
                  <div className="mt-2 rounded-md border border-cyan-100 bg-cyan-50 px-2 py-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-cyan-700">Wallet form policy</p>
                        <p className="mt-1 text-xs font-black text-cyan-950">
                          User familiar country form - carrier label shape is generated server-side
                        </p>
                      </div>
                      <StatusBadge status={activeCarrierLabelTransform.rawAddressExposedToMerchant ? 'fail' : 'pass'} />
                    </div>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ['nativeOrder', String(activeCarrierLabelTransform.userEntryPolicy.renderCountryNativeOrder)],
                        ['carrierShapeInUI', String(!activeCarrierLabelTransform.userEntryPolicy.doNotAskForCarrierSpecificShape)],
                        ['poBoxSpellings', activeCarrierLabelTransform.userEntryPolicy.acceptedPoBoxSpellings.join(', ')],
                        ['normalizedPoBox', activeCarrierLabelTransform.poBoxPolicy.normalizedSpelling ?? normalizedPoBoxSpelling ?? 'none'],
                        ['poBoxSpellingAccepted', String(activeCarrierLabelTransform.poBoxPolicy.submittedSpellingAccepted)],
                        ['nextLabelAction', activeCarrierLabelTransform.requiredNextAction],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-md bg-white px-2 py-1.5">
                          <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.08em] text-cyan-700">{label}</p>
                          <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-cyan-950">{value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] font-bold leading-5 text-cyan-900">
                      P.O. Box / PO Box / P/O Box remain form-level input only; DHL/UPS label eligibility still requires runtime rating, service availability, address validation, or shipping checks.
                    </p>
                  </div>
                )}
                <div className="mt-2 grid gap-2 lg:grid-cols-2">
                  {carrierPreflightPreviews.map(({ selection, preflight }) => (
                    <div key={`${preflight.carrier}-${preflight.countryCode}`} className="rounded-md bg-blue-50 px-2 py-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-[10px] font-black uppercase text-blue-950">
                          {preflight.countryCode} / {preflight.carrier}
                        </p>
                        <StatusBadge status={preflight.ok ? 'pass' : 'warn'} />
                      </div>
                      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {[
                          ['selectionNextAction', selection?.requiredNextAction ?? 'unsupported_country_or_carrier'],
                          ['preflightNextAction', preflight.requiredNextAction],
                          ['missingRefs', preflight.missingRefs.join(', ') || 'none'],
                          ['missingWalletFields', preflight.missingWalletFields.join(', ') || 'none'],
                          ['capabilityMode', selection?.form.carriers[preflight.carrier].capabilityMode ?? 'none'],
                          ['productionTraffic', String(preflight.productionTraffic)],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-md bg-white px-2 py-1.5">
                            <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.08em] text-blue-700">{label}</p>
                            <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-blue-950">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </React.Fragment>
          </ConsoleSection>

          <ConsoleSection key="shipment-readiness" eyebrow="Shipment Readiness" title="Hexaship shipment creation readiness">
            <React.Fragment key="shipment-readiness-body">
            <div key="shipment-readiness-cards-grid" className="grid gap-3 lg:grid-cols-2">
              {shipmentCreationReadiness.map(readiness => {
                const createdShipment = createdShipments[readiness.orderRef];
                const capabilityPreflightResult = capabilityPreflightResults[readiness.orderRef];
                const guidedShipmentStep = buildMerchantConsoleGuidedShipmentStep(readiness, capabilityPreflightResult);
                return (
                <article key={readiness.orderRef} className={cn('rounded-lg border p-3', readinessTone(readiness))}>
                  <div key={`${readiness.orderRef}-header`} className="flex flex-wrap items-start justify-between gap-3">
                    <div key={`${readiness.orderRef}-identity`} className="min-w-0">
                      <p key={`${readiness.orderRef}-ref`} className="font-mono text-[10px] font-black opacity-70">{readiness.orderRef}</p>
                      <h3 key={`${readiness.orderRef}-status-title`} className="mt-1 break-words text-sm font-black">{readiness.status}</h3>
                    </div>
                    <div key={`${readiness.orderRef}-actions`} className="flex flex-wrap items-center justify-end gap-2">
                      <StatusBadge key={`${readiness.orderRef}-status-badge`} status={readiness.canCreateShipment ? 'pass' : 'warn'} />
                      <CarrierCapabilityPreflightButton key={`${readiness.orderRef}-capability-preflight-button`} readiness={readiness} onRunCapabilityPreflight={runCapabilityPreflight} />
                      <ShipmentCreateActionButton readiness={readiness} onCreateShipment={createShipment} key={`${readiness.orderRef}-create-button`} />
                    </div>
                  </div>
                  <div key={`${readiness.orderRef}-summary-grid`} className="mt-3 grid gap-2 md:grid-cols-2">
                    {[
                      ['Next step', readiness.nextStep],
                      ['Gateway preflight', readiness.gatewayPreflight.requiredNextAction],
                      ['Can create', String(readiness.canCreateShipment)],
                      ['Gateway can create', String(readiness.gatewayPreflight.ok)],
                      ['Missing refs', readiness.missingRefs.length === 0 ? 'none' : readiness.missingRefs.join(', ')],
                      ['Gateway missing refs', [...readiness.gatewayPreflight.missingAddressWalletRefs, ...readiness.gatewayPreflight.missingCarrierRefs].join(', ') || 'none'],
                      ['Capability preflight result', capabilityPreflightResult?.requiredNextAction ?? 'not_run'],
                      ['Capability ref override', capabilityOverrides[readiness.orderRef] ?? 'none'],
                      ['Guided step', guidedShipmentStep.currentStep],
                      ['Primary action', guidedShipmentStep.primaryAction],
                      ['Disabled actions', readiness.disabledActions.length === 0 ? 'none' : readiness.disabledActions.join(', ')],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-white/80 px-2 py-1.5">
                        <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.12em] opacity-60">{label}</p>
                        <p key={`${label}-value`} className="mt-1 break-all font-mono text-[11px] font-black">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div key={`${readiness.orderRef}-guided-step-card`} className="mt-3 rounded-lg border border-slate-100 bg-white/80 p-3">
                    <div key={`${readiness.orderRef}-guided-step-header`} className="flex flex-wrap items-start justify-between gap-2">
                      <div key={`${readiness.orderRef}-guided-step-copy`}>
                        <p key={`${readiness.orderRef}-guided-step-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Guided two-step</p>
                        <h4 key={`${readiness.orderRef}-guided-step-title`} className="mt-1 text-sm font-black text-slate-950">{guidedShipmentStep.primaryAction}</h4>
                      </div>
                      <StatusBadge key={`${readiness.orderRef}-guided-step-status`} status={guidedShipmentStep.canCreateShipment ? 'pass' : 'warn'} />
                    </div>
                    <p key={`${readiness.orderRef}-guided-step-helper`} className="mt-2 text-xs font-semibold leading-5 text-slate-600">{guidedShipmentStep.helperText}</p>
                    <div key={`${readiness.orderRef}-guided-step-grid`} className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {[
                        ['canRunCapabilityPreflight', String(guidedShipmentStep.canRunCapabilityPreflight)],
                        ['canCreateShipment', String(guidedShipmentStep.canCreateShipment)],
                        ['localOnly', String(guidedShipmentStep.localOnly)],
                        ['productionTraffic', String(guidedShipmentStep.productionTraffic)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-md bg-slate-50 px-2 py-1.5">
                          <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</p>
                          <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-slate-700">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <React.Fragment key={`${readiness.orderRef}-capability-preflight-result-slot`}>
                  {capabilityPreflightResult ? (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-white/80 p-3">
                      <p key={`${readiness.orderRef}-capability-preflight-result-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Carrier capability preflight result</p>
                      <div key={`${readiness.orderRef}-capability-preflight-result-grid`} className="mt-2 grid gap-1.5 md:grid-cols-2">
                        {[
                          ['connectorId', capabilityPreflightResult.connectorId],
                          ['countryCode', capabilityPreflightResult.countryCode],
                          ['requiredNextAction', capabilityPreflightResult.requiredNextAction],
                          ['carrierCapabilityRef', capabilityPreflightResult.carrierCapabilityRef ?? 'missing'],
                          ['deliveryGatewaySurface', capabilityPreflightResult.deliveryGatewayCarrierCapabilitySurface.path],
                          ['surfaceBoundary', capabilityPreflightResult.deliveryGatewayCarrierCapabilitySurface.boundary],
                          ['productionAvailabilityClaim', String(capabilityPreflightResult.deliveryGatewayCarrierCapabilitySurface.productionCarrierAvailabilityClaim)],
                          ['localOnly', String(capabilityPreflightResult.localOnly)],
                          ['productionTraffic', String(capabilityPreflightResult.productionTraffic)],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-md bg-blue-50 px-2 py-1.5">
                            <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-800">{label}</p>
                            <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-slate-700">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  </React.Fragment>
                  <div key={`${readiness.orderRef}-safe-refs-grid`} className="mt-3 grid gap-1.5">
                    {Object.entries(readiness.safeRefs).map(([key, value]) => (
                      <div key={key} className="flex min-w-0 items-center justify-between gap-2 rounded-md bg-white/75 px-2 py-1.5">
                        <span key={`${key}-label`} className="text-[10px] font-black uppercase tracking-[0.08em] opacity-70">{key}</span>
                        <span key={`${key}-value`} className="truncate font-mono text-[10px] font-bold">{value ?? 'missing'}</span>
                      </div>
                    ))}
                  </div>
                  <React.Fragment key={`${readiness.orderRef}-local-hexaship-result-slot`}>
                  {createdShipment ? (
                    <div className="mt-3 rounded-lg border border-emerald-100 bg-white/80 p-3">
                      <p key={`${readiness.orderRef}-local-hexaship-result-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Local Hexaship result</p>
                      <div key={`${readiness.orderRef}-local-hexaship-result-grid`} className="mt-2 grid gap-1.5 md:grid-cols-2">
                        {[
                          ['shipmentRef', createdShipment.result.shipment.shipmentRef],
                          ['selectedCarrier', createdShipment.result.selection.selectedCarrier],
                          ['labelRef', createdShipment.result.label.labelRef],
                          ['trackingAlias', createdShipment.result.tracking.trackingAlias],
                          ['localOnly', String(createdShipment.result.capability.localOnly)],
                          ['webhookEvents', String(createdShipment.result.webhookLedger.length)],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-md bg-emerald-50 px-2 py-1.5">
                            <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-800">{label}</p>
                            <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-slate-700">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  </React.Fragment>
                </article>
                );
              })}
            </div>
            <div key="shipment-readiness-order-card" className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p key="shipment-readiness-order-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Readiness order</p>
              <p key="shipment-readiness-order-flow" className="mt-1 font-mono text-xs font-black text-slate-800">
                run_address_wallet_preflight -&gt; run_carrier_capability_preflight -&gt; ready_for_hexaship_createShipment
              </p>
              <div key="shipment-readiness-order-states" className="mt-2 flex flex-wrap gap-1.5">
                {MERCHANT_SHIPMENT_READINESS_STATES.map(state => (
                  <span key={state} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-slate-700">
                    {state}
                  </span>
                ))}
              </div>
            </div>
            </React.Fragment>
          </ConsoleSection>

          <ConsoleSection key="shipment-history" eyebrow="Shipment History" title="Redacted shipment history">
            <React.Fragment key="shipment-history-body">
            <div key="shipment-history-layout" className="grid gap-3 lg:grid-cols-2">
              <div key="shipment-history-local-hexaship-card" className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <div key="shipment-history-local-hexaship-header" className="flex flex-wrap items-start justify-between gap-3">
                  <div key="shipment-history-local-hexaship-copy">
                    <p key="shipment-history-local-hexaship-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Local Hexaship shipment history</p>
                    <h3 key="shipment-history-local-hexaship-title" className="mt-1 text-sm font-black text-emerald-950">Sandbox-created refs</h3>
                  </div>
                  <StatusBadge key="shipment-history-local-hexaship-status" status={localHexashipShipments.length > 0 ? 'pass' : 'warn'} />
                </div>
                <div key="shipment-history-local-hexaship-list" className="mt-3 grid gap-2">
                  {localHexashipShipments.length > 0 ? localHexashipShipments.map(record => (
                    (() => {
                      const requestFixture = buildMerchantConsoleLocalHexashipRequestFixture(record);
                      const replayPreview = buildMerchantConsoleLocalHexashipReplayPreview(record, requestFixture);
                      return (
                        <div key={record.result.shipment.shipmentRef} className="rounded-lg bg-white/85 p-3">
                          <div key={`${record.result.shipment.shipmentRef}-header`} className="flex flex-wrap items-start justify-between gap-2">
                            <div key={`${record.result.shipment.shipmentRef}-identity`} className="min-w-0">
                              <p key={`${record.result.shipment.shipmentRef}-shipment-ref`} className="truncate font-mono text-[11px] font-black text-emerald-950">{record.result.shipment.shipmentRef}</p>
                              <p key={`${record.result.shipment.shipmentRef}-order-ref`} className="mt-0.5 font-mono text-[10px] font-bold text-emerald-700">{record.result.ecOrderRef}</p>
                            </div>
                            <span key={`${record.result.shipment.shipmentRef}-carrier`} className="rounded-md bg-emerald-100 px-2 py-1 font-mono text-[10px] font-black uppercase text-emerald-900">
                              {record.result.selection.selectedCarrier}
                            </span>
                          </div>
                          <div key={`${record.result.shipment.shipmentRef}-summary-grid`} className="mt-2 grid gap-1.5 md:grid-cols-3">
                            {[
                              ['labelRef', record.result.label.labelRef],
                              ['trackingAlias', record.result.tracking.trackingAlias],
                              ['status', record.result.tracking.status],
                              ['idempotencyKey', record.idempotencyKey],
                              ['decisionRef', record.result.selection.decisionRef],
                              ['duplicateClicks', String(record.duplicateClickCount)],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-md bg-emerald-50 px-2 py-1.5">
                                <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-800">{label}</p>
                                <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-slate-700">{value}</p>
                              </div>
                            ))}
                          </div>
                          <div key={`${record.result.shipment.shipmentRef}-sdk-fixture-card`} className="mt-2 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5">
                            <div key={`${record.result.shipment.shipmentRef}-sdk-fixture-header`} className="flex flex-wrap items-center justify-between gap-2">
                              <p key={`${record.result.shipment.shipmentRef}-sdk-fixture-label`} className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-800">SDK / route fixture</p>
                              <button
                                key={`${record.result.shipment.shipmentRef}-copy-fixture-button`}
                                type="button"
                                aria-label={`Copy SDK route fixture for ${record.result.shipment.shipmentRef}`}
                                onClick={() => copyRequestFixture(record)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-900 px-2 text-[10px] font-black text-white shadow-sm hover:bg-emerald-800"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                {copiedFixtureRef === record.result.shipment.shipmentRef ? 'Copied fixture' : 'Copy fixture'}
                              </button>
                            </div>
                            <div key={`${record.result.shipment.shipmentRef}-sdk-fixture-grid`} className="mt-2 grid gap-1.5 md:grid-cols-2">
                              {[
                                ['route', `${requestFixture.method} ${requestFixture.path}`],
                                ['sdkRequestOptions.idempotencyKey', requestFixture.sdkRequestOptions.idempotencyKey],
                                ['headers.idempotency-key', requestFixture.headers['idempotency-key']],
                                ['headers.x-hexaship-local-only', requestFixture.headers['x-hexaship-local-only']],
                                ['bodyRefs.recipientId', requestFixture.bodyRefs.recipientId],
                                ['bodyRefs.addressFormVersion', requestFixture.bodyRefs.addressFormVersion],
                                ['bodyRefs.carrierCapabilityRef', requestFixture.bodyRefs.carrierCapabilityRef],
                                ['replayPreview.replayStatus', replayPreview.replayStatus],
                                ['replayPreview.safeReplayRef', replayPreview.safeReplayRef],
                                ['replayPreview.duplicateClickCount', String(replayPreview.duplicateClickCount)],
                                ['replayPreview.productionTraffic', String(replayPreview.productionTraffic)],
                              ].map(([label, value]) => (
                                <div key={label} className="rounded-md bg-white/80 px-2 py-1.5">
                                  <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.08em] text-emerald-800">{label}</p>
                                  <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-slate-700">{value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )) : (
                    <div key="shipment-history-local-hexaship-empty" className="rounded-lg bg-white/85 px-3 py-2 font-mono text-[11px] font-black text-emerald-900">
                      No local Hexaship shipment created yet
                    </div>
                  )}
                </div>
              </div>
              <div key="shipment-history-synthetic-card" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p key="shipment-history-synthetic-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Synthetic merchant history</p>
                <div key="shipment-history-synthetic-list" className="mt-3 grid gap-2">
                  {merchantConsolePlan.sampleShipmentHistory.map(row => (
                    <div key={row.shipmentRef} className="rounded-lg bg-white px-3 py-2">
                      <div key={`${row.shipmentRef}-header`} className="flex flex-wrap items-start justify-between gap-2">
                        <div key={`${row.shipmentRef}-identity`} className="min-w-0">
                          <p key={`${row.shipmentRef}-shipment-ref`} className="truncate font-mono text-[11px] font-black text-slate-900">{row.shipmentRef}</p>
                          <p key={`${row.shipmentRef}-order-ref`} className="mt-0.5 font-mono text-[10px] font-bold text-slate-500">{row.orderRef}</p>
                        </div>
                        <StatusBadge key={`${row.shipmentRef}-status`} status={row.status === 'in_transit' || row.status === 'label_created' ? 'pass' : 'warn'} />
                      </div>
                      <div key={`${row.shipmentRef}-refs`} className="mt-2 flex flex-wrap gap-1.5">
                        {[row.carrierAlias, row.servicePreference, row.labelRef, row.trackingAlias].map(value => (
                          <span key={value} className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[10px] font-black text-slate-700">
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </React.Fragment>
          </ConsoleSection>

          <ConsoleSection key="callback-validator" eyebrow="Callback" title="Callback URL validator">
            <React.Fragment key="callback-validator-body">
            <div key="callback-validator-url-card" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p key="callback-validator-url-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Callback URL</p>
              <p key="callback-validator-url-value" className="mt-1 break-all font-mono text-xs font-black text-slate-800">{integration.setupPreflight.callbackUrl}</p>
            </div>
            <div key="callback-validator-checks-grid" className="mt-3 grid gap-2 md:grid-cols-2">
              {integration.setupPreflight.checks.map(check => (
                <div key={check.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div key={`${check.id}-header`} className="flex items-start justify-between gap-3">
                    <div key={`${check.id}-copy`}>
                      <h3 key={`${check.id}-title`} className="text-sm font-black text-slate-900">{check.label}</h3>
                      <p key={`${check.id}-detail`} className="mt-1 text-xs font-semibold leading-5 text-slate-500">{check.detail}</p>
                    </div>
                    <StatusBadge key={`${check.id}-status`} status={check.status} />
                  </div>
                  <p key={`${check.id}-safe-input-ref`} className="mt-2 font-mono text-[10px] font-black text-slate-400">{check.safeInputRef}</p>
                </div>
              ))}
            </div>
            <div key="callback-validator-repair-actions" className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p key="callback-validator-repair-actions-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">Callback preflight repair actions</p>
              <div key="callback-validator-repair-actions-grid" className="mt-2 grid gap-2 md:grid-cols-2">
                {callbackPreflightRepairActions.map(action => (
                  <div key={action.checkId} className="rounded-md bg-white px-3 py-2">
                    <div key={`${action.checkId}-repair-header`} className="flex items-start justify-between gap-2">
                      <div key={`${action.checkId}-repair-copy`} className="min-w-0">
                        <p key={`${action.checkId}-repair-label`} className="text-xs font-black text-amber-950">{action.label}</p>
                        <p key={`${action.checkId}-repair-action`} className="mt-1 break-all font-mono text-[10px] font-black text-amber-800">{action.primaryAction}</p>
                      </div>
                      <StatusBadge key={`${action.checkId}-repair-status`} status={action.status} />
                    </div>
                    <p key={`${action.checkId}-repair-helper`} className="mt-2 text-[11px] font-semibold leading-5 text-amber-900">{action.helperText}</p>
                    <p key={`${action.checkId}-repair-ref`} className="mt-2 break-all font-mono text-[10px] font-black text-amber-700">{action.safeInputRef}</p>
                  </div>
                ))}
              </div>
            </div>
            <div key="callback-validator-negative-fixture" className="mt-3 rounded-lg border border-rose-100 bg-rose-50 p-3">
              <div key="callback-validator-negative-fixture-header" className="flex flex-wrap items-start justify-between gap-2">
                <div key="callback-validator-negative-fixture-copy" className="min-w-0">
                  <p key="callback-validator-negative-fixture-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-700">Negative fixture export</p>
                  <h3 key="callback-validator-negative-fixture-title" className="mt-1 text-sm font-black text-rose-950">{callbackPreflightNegativeFixture.fixtureId}</h3>
                  <p key="callback-validator-negative-fixture-error" className="mt-1 break-all font-mono text-[10px] font-black text-rose-800">{callbackPreflightNegativeFixture.expectedError}</p>
                </div>
                <button
                  key="callback-validator-copy-negative-fixture-button"
                  type="button"
                  aria-label="Copy callback preflight negative fixture"
                  onClick={copyCallbackNegativeFixture}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2 text-[10px] font-black text-rose-800 shadow-sm hover:bg-rose-50"
                >
                  <ClipboardCheck key="callback-validator-copy-negative-fixture-button-icon" className="h-3.5 w-3.5" />
                  {copiedCallbackNegativeFixture ? 'Copied negative fixture' : 'Copy negative fixture'}
                </button>
              </div>
              <div key="callback-validator-negative-fixture-grid" className="mt-3 grid gap-2 md:grid-cols-3">
                {[
                  ['missing refs', callbackPreflightNegativeFixture.expectedMissingRefs.join(' + ')],
                  ['failing checks', callbackPreflightNegativeFixture.expectedFailingCheckIds.join(' + ')],
                  ['repair actions', callbackPreflightNegativeFixture.repairActionIds.join(' + ')],
                  ['forbidden params', callbackPreflightNegativeFixture.forbiddenParams.join(' + ')],
                  ['forbidden value params', callbackPreflightNegativeFixture.forbiddenValueParamRefs.join(' + ')],
                  ['callback vectors', callbackPreflightNegativeFixture.callbackValidationVectorIds.join(' + ')],
                  ['export command', callbackPreflightNegativeFixture.exportCommand],
                  ['localOnly', String(callbackPreflightNegativeFixture.localOnly)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-white px-3 py-2">
                    <p key={`${label}-negative-fixture-label`} className="text-[10px] font-black uppercase tracking-[0.08em] text-rose-700">{label}</p>
                    <p key={`${label}-negative-fixture-value`} className="mt-1 break-all font-mono text-[10px] font-black text-rose-950">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              key="callback-validator-copy-command-button"
              type="button"
              aria-label="Run synthetic test vectors"
              onClick={copyCommand}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black text-white shadow-sm hover:bg-slate-800"
            >
              <Code2 key="callback-validator-copy-command-button-icon" className="h-4 w-4" />
              <span key="callback-validator-copy-command-button-label">{copied ? 'Copied test command' : integration.setupPreflight.runButtonLabel}</span>
            </button>
            </React.Fragment>
          </ConsoleSection>

          <ConsoleSection key="address-login-policy" eyebrow="Policy" title="Address Login live enablement gates">
            <React.Fragment key="address-login-policy-body">
            <div key="merchant-console-webhook-events-grid" className="grid gap-2 md:grid-cols-2">
              {integration.requiredDashboardGates.map(gate => (
                <div key={gate} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                  <LockKeyhole key={`${gate}-icon`} className="h-4 w-4 text-slate-400" />
                  <span key={`${gate}-label`}>{gate}</span>
                </div>
              ))}
            </div>
            </React.Fragment>
          </ConsoleSection>

          <ConsoleSection key="webhooks" eyebrow="Webhooks" title="Redacted lifecycle operations">
            <React.Fragment key="webhooks-body">
            <div key="webhooks-event-list" className="grid gap-2 md:grid-cols-2">
              {integration.webhookEvents.map(event => (
                <div key={event} className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] font-bold text-slate-600">
                  {event}
                </div>
              ))}
            </div>
            <div key="merchant-console-local-idempotency-ledger" className="mt-3 rounded-lg border border-cyan-100 bg-cyan-50 p-3">
              <div key="merchant-console-local-idempotency-ledger-header" className="flex flex-wrap items-start justify-between gap-3">
                <div key="merchant-console-local-idempotency-ledger-copy">
                  <p key="merchant-console-local-idempotency-ledger-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">Local idempotency ledger</p>
                  <h3 key="merchant-console-local-idempotency-ledger-title" className="mt-1 text-sm font-black text-cyan-950">Create shipment and webhook replay refs</h3>
                </div>
                <div key="merchant-console-local-idempotency-ledger-flags" className="flex flex-wrap justify-end gap-1.5">
                  <StatusBadge key="merchant-console-local-idempotency-ledger-status" status={localHexashipIdempotencyLedgerRows.length > 0 ? 'pass' : 'warn'} />
                  {[
                    ['compactGrid', String(localHexashipLedgerLayoutAudit.usesCompactSummaryGrid)],
                    ['maxCols', String(localHexashipLedgerLayoutAudit.maxSummaryColumns)],
                    ['wrappedRefs', String(localHexashipLedgerLayoutAudit.requiresWrappedRefs)],
                  ].map(([label, value]) => (
                    <span key={label} className="rounded-md bg-white/80 px-2 py-1 font-mono text-[10px] font-black text-cyan-950">
                      {label}: {value}
                    </span>
                  ))}
                </div>
              </div>
              <div key="merchant-console-local-idempotency-ledger-rows" className="mt-3 grid gap-2">
                {localHexashipIdempotencyLedgerRows.length > 0 ? localHexashipIdempotencyLedgerRows.map(row => {
                  const webhookReplayFixture = buildMerchantConsoleLocalHexashipWebhookReplayFixture(row);
                  return (
                    <div key={row.shipmentRef} className="rounded-lg bg-white/85 px-3 py-2">
                      <div key={`${row.shipmentRef}-header`} className="flex flex-wrap items-start justify-between gap-2">
                        <div key={`${row.shipmentRef}-identity`} className="min-w-0">
                          <p key={`${row.shipmentRef}-shipment-ref`} className="truncate font-mono text-[11px] font-black text-cyan-950">{row.shipmentRef}</p>
                          <p key={`${row.shipmentRef}-order-ref`} className="mt-0.5 font-mono text-[10px] font-bold text-cyan-700">{row.ecOrderRef}</p>
                        </div>
                        <div key={`${row.shipmentRef}-replay-kinds`} className="flex flex-wrap gap-1.5">
                          <ReplayKindBadge kind={webhookReplayFixture.acceptedReplayKind} key={`${row.shipmentRef}-accepted-replay-kind`} />
                          <ReplayKindBadge kind={webhookReplayFixture.conflictReplayKind} key={`${row.shipmentRef}-conflict-replay-kind`} />
                        </div>
                      </div>
                      <div key={`${row.shipmentRef}-summary-grid`} className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          ['idempotency', row.idempotencyKey],
                          ['create replay', row.createReplayStatus],
                          ['webhook replay', row.webhookReplayStatus],
                          ['events', `${row.webhookEventCount} events`],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-md bg-cyan-50 px-2 py-1.5">
                            <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.08em] text-cyan-700">{label}</p>
                            <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-cyan-950">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div key={`${row.shipmentRef}-refs`} className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                        <span key={`${row.shipmentRef}-address-exposure`} className="rounded-md bg-cyan-50 px-2 py-1 font-mono text-[10px] font-black uppercase text-cyan-950">{row.addressExposure}</span>
                        <span key={`${row.shipmentRef}-body-fingerprint`} className="min-w-0 break-all rounded-md bg-cyan-50 px-2 py-1 font-mono text-[10px] font-black text-cyan-950">{webhookReplayFixture.safeBodyFingerprintRef}</span>
                        <span key={`${row.shipmentRef}-safe-webhook-replay-ref`} className="min-w-0 break-all rounded-md bg-cyan-50 px-2 py-1 font-mono text-[10px] font-black text-cyan-950">{row.safeWebhookReplayRef}</span>
                        <span key={`${row.shipmentRef}-latest-webhook-event-ref`} className="min-w-0 break-all rounded-md bg-cyan-50 px-2 py-1 font-mono text-[10px] font-black text-cyan-950">{row.latestWebhookEventRef}</span>
                        <button
                          key={`${row.shipmentRef}-copy-ledger-webhook-ref-button`}
                          type="button"
                          aria-label={`Copy latest webhook ref for ${row.shipmentRef}`}
                          onClick={() => copyLedgerWebhookRef(row.latestWebhookEventRef)}
                          className="inline-flex h-7 items-center gap-1 rounded-md bg-cyan-900 px-2 text-[10px] font-black text-white shadow-sm hover:bg-cyan-800"
                        >
                          <ClipboardCheck className="h-3 w-3" />
                          {copiedLedgerWebhookRef === row.latestWebhookEventRef ? 'Copied ref' : 'Copy ref'}
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div key="merchant-console-local-idempotency-ledger-empty" className="rounded-lg bg-white/85 px-3 py-2 font-mono text-[11px] font-black text-cyan-900">
                    No local idempotency ledger rows yet
                  </div>
                )}
              </div>
            </div>
            <div key="merchant-console-local-hexaship-webhook-replay" className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <div key="merchant-console-local-hexaship-webhook-replay-header" className="flex flex-wrap items-start justify-between gap-3">
                <div key="merchant-console-local-hexaship-webhook-replay-copy">
                  <p key="merchant-console-local-hexaship-webhook-replay-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Local Hexaship webhook replay</p>
                  <h3 key="merchant-console-local-hexaship-webhook-replay-title" className="mt-1 text-sm font-black text-emerald-950">Created shipment lifecycle refs</h3>
                </div>
                <StatusBadge key="merchant-console-local-hexaship-webhook-replay-status" status={localHexashipWebhookRows.length > 0 ? 'pass' : 'warn'} />
              </div>
              <div key="merchant-console-local-hexaship-webhook-replay-rows" className="mt-3 grid gap-2">
                {localHexashipWebhookRows.length > 0 ? localHexashipWebhookRows.map(row => (
                  <div key={row.eventRef} className="grid gap-2 rounded-lg bg-white/85 px-3 py-2 md:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)_80px_100px]">
                    <div key={`${row.eventRef}-identity`} className="min-w-0">
                      <p key={`${row.eventRef}-event-ref`} className="truncate font-mono text-[11px] font-black text-emerald-950">{row.eventRef}</p>
                      <p key={`${row.eventRef}-event-type`} className="mt-0.5 font-mono text-[10px] font-bold text-emerald-700">{row.eventType}</p>
                    </div>
                    <p key={`${row.eventRef}-order-ref`} className="font-mono text-[11px] font-black text-emerald-950">{row.ecOrderRef}</p>
                    <p key={`${row.eventRef}-idempotency-key`} className="break-all font-mono text-[11px] font-black text-emerald-950">{row.idempotencyKey}</p>
                    <p key={`${row.eventRef}-carrier`} className="font-mono text-[11px] font-black uppercase text-emerald-950">{row.selectedCarrier}</p>
                    <p key={`${row.eventRef}-status`} className="font-mono text-[11px] font-black text-emerald-950">{row.status}</p>
                  </div>
                )) : (
                  <div key="merchant-console-local-hexaship-webhook-replay-empty" className="rounded-lg bg-white/85 px-3 py-2 font-mono text-[11px] font-black text-emerald-900">
                    No local Hexaship webhook events yet
                  </div>
                )}
              </div>
            </div>
            <div key="merchant-console-skipship-webhook-ledger" className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <div key="merchant-console-skipship-webhook-ledger-header" className="flex flex-wrap items-start justify-between gap-3">
                <div key="merchant-console-skipship-webhook-ledger-copy">
                  <p key="merchant-console-skipship-webhook-ledger-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Skipship webhook ledger</p>
                  <h3 key="merchant-console-skipship-webhook-ledger-title" className="mt-1 text-sm font-black text-blue-950">Redacted event idempotency view</h3>
                </div>
                <div key="merchant-console-skipship-webhook-ledger-summary" className="grid gap-2">
                  <div key="merchant-console-skipship-webhook-ledger-totals" className="grid grid-cols-3 gap-2 text-center">
                    {[
                      ['Events', skipshipWebhookLedger.totals.events],
                      ['Retrying', skipshipWebhookLedger.totals.retrying],
                      ['Expired', skipshipWebhookLedger.totals.expired],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-white px-2 py-1.5">
                        <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-500">{label}</p>
                        <p key={`${label}-value`} className="font-mono text-sm font-black text-blue-950">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div key="merchant-console-skipship-webhook-ledger-source" className="flex flex-wrap justify-end gap-1.5">
                    <span key="merchant-console-skipship-webhook-ledger-source-mode" className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-blue-800">
                      source: {skipshipWebhookLedger.source.mode}
                    </span>
                    <span key="merchant-console-skipship-webhook-ledger-source-local-only" className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-blue-800">
                      localOnly: {String(skipshipWebhookLedger.source.localOnly)}
                    </span>
                    <span key="merchant-console-skipship-webhook-ledger-source-production-traffic" className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-blue-800">
                      productionTraffic: {String(skipshipWebhookLedger.source.productionTraffic)}
                    </span>
                  </div>
                </div>
              </div>
              <p key="merchant-console-skipship-webhook-ledger-boundary" className="mt-2 text-xs font-semibold leading-5 text-blue-800">{skipshipWebhookLedger.privacyBoundary}</p>
              <div key="merchant-console-skipship-webhook-ledger-rows" className="mt-3 grid gap-2">
                {skipshipWebhookLedger.rows.map(row => (
                  <div key={row.eventId} className="grid gap-2 rounded-lg bg-white/85 px-3 py-2 md:grid-cols-[minmax(0,1fr)_90px_80px_110px]">
                    <div key={`${row.eventId}-identity`} className="min-w-0">
                      <p key={`${row.eventId}-event-ref`} className="truncate font-mono text-[11px] font-black text-blue-950">{row.safeRefs.eventRef}</p>
                      <p key={`${row.eventId}-last-seen`} className="mt-0.5 font-mono text-[10px] font-bold text-blue-600">last {row.lastSeenAt}</p>
                    </div>
                    <StatusBadge key={`${row.eventId}-status`} status={row.status === 'ok' ? 'pass' : row.status === 'expired' ? 'fail' : 'warn'} />
                    <p key={`${row.eventId}-attempts`} className="font-mono text-[11px] font-black text-blue-950">try {row.attemptCount}</p>
                    <p key={`${row.eventId}-http`} className="font-mono text-[11px] font-black text-blue-950">HTTP {row.responseStatus}</p>
                  </div>
                ))}
              </div>
              <div key="merchant-console-skipship-webhook-ledger-blocked" className="mt-3 flex flex-wrap gap-1.5">
                {skipshipWebhookLedger.rows[0]?.blockedMaterial.map(item => (
                  <span key={item} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-rose-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            </React.Fragment>
          </ConsoleSection>

          <ConsoleSection key="playlist-commerce-webhook" eyebrow="Playlist Commerce" title="Playlist Commerce webhook OpenAPI preflight">
            <React.Fragment key="playlist-commerce-webhook-body">
            <div key="playlist-webhook-route-summary" className="grid gap-3 md:grid-cols-3">
              {[
                ['OpenAPI', 'docs/specs/playlist-commerce-webhooks.openapi.yaml'],
                ['Route', `${playlistCommerceWebhookRoute.method} ${playlistCommerceWebhookRoute.path}`],
                ['Statuses', playlistCommerceWebhookStatuses],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
                  <p key={`${label}-value`} className="mt-1 break-all font-mono text-xs font-black text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <div key="playlist-webhook-topic-controls" className="mt-3 grid gap-3 lg:grid-cols-2">
              <div key="playlist-webhook-allowed-topics" className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p key="playlist-webhook-allowed-topics-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Allowed topics</p>
                <div key="playlist-webhook-allowed-topics-list" className="mt-3 grid gap-2">
                  {playlistCommerceWebhookRoute.acceptedTopics.map(topic => (
                    <div key={topic} className="rounded-lg bg-white/80 px-3 py-2 font-mono text-[11px] font-black text-blue-900">
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
              <div key="playlist-webhook-required-controls" className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p key="playlist-webhook-required-controls-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Required controls</p>
                <div key="playlist-webhook-required-controls-list" className="mt-3 grid gap-2">
                  {playlistCommerceWebhookRoute.requiredControls.map(control => (
                    <div key={control} className="flex items-start gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-black leading-5 text-emerald-950">
                      <ShieldCheck key={`${control}-icon`} className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <span key={`${control}-label`}>{control}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div key="playlist-webhook-privacy-boundary" className="mt-3 grid gap-3 lg:grid-cols-2">
              <div key="playlist-webhook-redacted-fields" className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                <p key="playlist-webhook-redacted-fields-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-700">Never returned</p>
                <div key="playlist-webhook-redacted-fields-list" className="mt-3 flex flex-wrap gap-1.5">
                  {playlistCommerceWebhookRoute.redactedFields.map(field => (
                    <span key={field} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-rose-900">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
              <div key="playlist-webhook-non-claims" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p key="playlist-webhook-non-claims-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Non-claims</p>
                <ul key="playlist-webhook-non-claims-list" className="mt-3 grid gap-1.5">
                  {playlistCommerceWebhookRoute.nonClaims.map(nonClaim => (
                    <li key={nonClaim} className="text-xs font-semibold leading-5 text-slate-700">{nonClaim}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div key="playlist-webhook-synthetic-ping" className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <div key="playlist-webhook-synthetic-header" className="flex flex-wrap items-start justify-between gap-3">
                <div key="playlist-webhook-synthetic-title">
                  <p key="playlist-webhook-synthetic-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-700">Synthetic signed ping</p>
                  <h3 key="playlist-webhook-synthetic-name" className="mt-1 text-sm font-black text-indigo-950">{playlistCommerceSyntheticPing.label}</h3>
                </div>
                <StatusBadge key="playlist-webhook-synthetic-status" status={playlistCommerceSyntheticPing.localOnly ? 'pass' : 'fail'} />
              </div>
              <div key="playlist-webhook-synthetic-summary" className="mt-3 grid gap-2 md:grid-cols-4">
                {[
                  ['Event', playlistCommerceSyntheticPing.eventId],
                  ['Topic', playlistCommerceSyntheticPing.topic],
                  ['Key', playlistCommerceSyntheticPing.keyId],
                  ['Expected', `${playlistCommerceSyntheticPing.expectedStatus} then ${playlistCommerceSyntheticPing.replayExpectedStatus}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-white/80 px-3 py-2">
                    <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">{label}</p>
                    <p key={`${label}-value`} className="mt-1 break-all font-mono text-[11px] font-black text-indigo-950">{value}</p>
                  </div>
                ))}
              </div>
              <div key="playlist-webhook-local-command" className="mt-3 rounded-lg bg-white/80 px-3 py-2">
                <p key="playlist-webhook-local-command-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">Local command</p>
                <p key="playlist-webhook-local-command-value" className="mt-1 font-mono text-xs font-black text-indigo-950">{playlistCommerceSyntheticPing.safeCommand}</p>
              </div>
              <div key="playlist-webhook-preflight-report" className="mt-3 rounded-lg bg-white/80 px-3 py-2">
                <p key="playlist-webhook-preflight-report-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">Preflight report</p>
                <div key="playlist-webhook-preflight-summary" className="mt-2 grid gap-2 md:grid-cols-5">
                  {[
                    ['Passed', playlistCommerceWebhookPreflight.passed ? 'true' : 'false'],
                    ['Accepted', String(playlistCommerceWebhookPreflight.responseSummary.acceptedStatus)],
                    ['Replay', String(playlistCommerceWebhookPreflight.responseSummary.replayStatus)],
                    ['Blocked', String(playlistCommerceWebhookPreflight.blockedMaterial.length)],
                    ['Non-claims', String(playlistCommerceWebhookPreflight.nonClaims.length)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-indigo-50 px-2 py-1.5">
                      <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">{label}</p>
                      <p key={`${label}-value`} className="mt-1 break-all font-mono text-[11px] font-black text-indigo-950">{value}</p>
                    </div>
                  ))}
                </div>
                <div key="playlist-webhook-preflight-checks" className="mt-2 grid gap-1.5 lg:grid-cols-2">
                  {playlistCommerceWebhookPreflight.checks.map(check => (
                    <div key={check.id} className="flex items-start justify-between gap-2 rounded-md bg-indigo-50 px-2 py-1.5">
                      <div key={`${check.id}-identity`} className="min-w-0">
                        <p key={`${check.id}-id`} className="truncate font-mono text-[10px] font-black text-indigo-950">{check.id}</p>
                        <p key={`${check.id}-label`} className="mt-0.5 text-[10px] font-bold text-indigo-700">{check.label}</p>
                      </div>
                      <StatusBadge key={`${check.id}-status`} status={check.status} />
                    </div>
                  ))}
                </div>
              </div>
              <div key="playlist-webhook-preflight-history" className="mt-3 rounded-lg bg-white/80 px-3 py-2">
                <p key="playlist-webhook-preflight-history-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">Preflight history</p>
                <div key="playlist-webhook-history-summary" className="mt-2 grid gap-2 md:grid-cols-4">
                  {[
                    ['Runs', String(playlistCommerceWebhookPreflightHistory.summary.totalRuns)],
                    ['Passed', String(playlistCommerceWebhookPreflightHistory.summary.passedRuns)],
                    ['Replay blocked', String(playlistCommerceWebhookPreflightHistory.summary.replayBlockedRuns)],
                    ['Latest evidence', playlistCommerceWebhookPreflightHistory.summary.latestEvidenceRef],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-indigo-50 px-2 py-1.5">
                      <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">{label}</p>
                      <p key={`${label}-value`} className="mt-1 font-mono text-[11px] font-black text-indigo-950">{value}</p>
                    </div>
                  ))}
                </div>
                <div key="playlist-webhook-history-actions" className="mt-2 grid gap-2 md:grid-cols-3">
                  {[
                    ['Export', playlistCommerceWebhookPreflightHistory.operatorAction.exportCommand],
                    ['Check', playlistCommerceWebhookPreflightHistory.operatorAction.checkCommand],
                    ['Next safe step', playlistCommerceWebhookPreflightHistory.operatorAction.nextSafeStep],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-white px-2 py-1.5">
                      <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">{label}</p>
                      <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-indigo-950">{value}</p>
                    </div>
                  ))}
                </div>
                <div key="playlist-webhook-history-runs" className="mt-2 grid gap-1.5">
                  {playlistCommerceWebhookPreflightHistory.runs.map(run => (
                    <div key={run.runId} className="grid gap-2 rounded-md bg-indigo-50 px-2 py-1.5 md:grid-cols-[minmax(0,1fr)_90px_90px_70px]">
                      <div key={`${run.runId}-identity`} className="min-w-0">
                        <p key={`${run.runId}-id`} className="truncate font-mono text-[10px] font-black text-indigo-950">{run.runId}</p>
                        <p key={`${run.runId}-evidence`} className="mt-0.5 truncate font-mono text-[10px] font-bold text-indigo-700">{run.evidenceRef}</p>
                      </div>
                      <p key={`${run.runId}-accepted`} className="font-mono text-[10px] font-black text-indigo-950">Accepted {run.acceptedStatus}</p>
                      <p key={`${run.runId}-replay`} className="font-mono text-[10px] font-black text-indigo-950">Replay {run.replayStatus}</p>
                      <StatusBadge key={`${run.runId}-status`} status={run.passed ? 'pass' : 'fail'} />
                    </div>
                  ))}
                </div>
              </div>
              <div key="playlist-webhook-evidence-vault" className="mt-3 rounded-lg bg-white/80 px-3 py-2">
                <div key="playlist-webhook-evidence-vault-header" className="flex flex-wrap items-start justify-between gap-3">
                  <div key="playlist-webhook-evidence-vault-title">
                    <p key="playlist-webhook-evidence-vault-label" className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">Evidence Vault reference</p>
                    <h3 key="playlist-webhook-evidence-vault-ref" className="mt-1 break-all font-mono text-xs font-black text-indigo-950">
                      {latestPlaylistCommerceEvidence?.vaultRecordRef ?? 'evidence-ref-missing'}
                    </h3>
                  </div>
                  <StatusBadge key="playlist-webhook-evidence-vault-status" status={playlistCommerceWebhookEvidence.summary.allRecordsRedacted ? 'pass' : 'fail'} />
                </div>
                <div key="playlist-webhook-evidence-commitments" className="mt-2 grid gap-2 md:grid-cols-3">
                  {[
                    ['Request', latestPlaylistCommerceEvidence?.commitments.requestCommitmentRef ?? 'missing'],
                    ['Response', latestPlaylistCommerceEvidence?.commitments.responseCommitmentRef ?? 'missing'],
                    ['Checks', latestPlaylistCommerceEvidence?.commitments.checkCommitmentRef ?? 'missing'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-indigo-50 px-2 py-1.5">
                      <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">{label}</p>
                      <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-indigo-950">{value}</p>
                    </div>
                  ))}
                </div>
                <div key="playlist-webhook-evidence-summary" className="mt-2 grid gap-2 md:grid-cols-3">
                  {[
                    ['Records', String(playlistCommerceWebhookEvidence.summary.totalRecords)],
                    ['Linked runs', String(playlistCommerceWebhookEvidence.summary.linkedHistoryRuns)],
                    ['Boundary', playlistCommerceWebhookEvidence.source.managedServiceBoundary],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-white px-2 py-1.5">
                      <p key={`${label}-label`} className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">{label}</p>
                      <p key={`${label}-value`} className="mt-1 break-all font-mono text-[10px] font-black text-indigo-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </React.Fragment>
          </ConsoleSection>

          <WebhookHmacSection key="webhook-hmac" webhookHmacValidator={integration.webhookHmacValidator} />

          <KeyRotationSection key="key-rotation" webhookKeyRotation={webhookKeyRotation} />
        </MerchantConsoleMainColumn>

        <MerchantConsoleRightRail key="merchant-console-right-rail" integration={integration} />
      </div>
    </main>
  );
}

export default MerchantConsoleScreen;
