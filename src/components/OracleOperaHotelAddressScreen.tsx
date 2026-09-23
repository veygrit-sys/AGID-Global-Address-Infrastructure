import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  LockKeyhole,
  RefreshCw,
  Send,
  ShieldCheck,
  Truck,
  Undo2,
  UserRound,
} from 'lucide-react';
import React from 'react';

import {
  buildOracleOperaHotelAddressReview,
  getOracleOperaHotelRoleView,
  listOracleOperaHotelAddressSamples,
  ORACLE_OPERA_HOTEL_ADDRESS_ROLES,
  type OracleOperaHotelAddressCheck,
  type OracleOperaHotelAddressEndpointKind,
  type OracleOperaHotelAddressGate,
  type OracleOperaHotelAddressInput,
  type OracleOperaHotelAddressRole,
  type OracleOperaHotelAddressStatus,
} from '../lib/integrations/oracleOperaHotelAddress';

const samples = listOracleOperaHotelAddressSamples();

type WorkflowState = 'editing' | 'confirmed' | 'queued';

type UndoSnapshot = {
  label: string;
  draft: OracleOperaHotelAddressInput;
  workflow: WorkflowState;
  role: OracleOperaHotelAddressRole;
};

function returnToOpenSource() {
  window.location.href = '/open-source';
}

function statusLabel(status: OracleOperaHotelAddressStatus) {
  if (status === 'ready') return 'Ready';
  if (status === 'needs-review') return 'Review';
  return 'Blocked';
}

function statusTone(status: OracleOperaHotelAddressStatus) {
  if (status === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'needs-review') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-rose-200 bg-rose-50 text-rose-800';
}

function checkTone(status: OracleOperaHotelAddressCheck['status']) {
  if (status === 'pass') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'review') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-rose-200 bg-rose-50 text-rose-800';
}

function checkIcon(status: OracleOperaHotelAddressCheck['status']) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4" />;
  return <AlertTriangle className="h-4 w-4" />;
}

function FieldInput({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        disabled={disabled}
        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function CheckRow({ item }: { item: OracleOperaHotelAddressCheck | OracleOperaHotelAddressGate }) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${checkTone(item.status)}`}>
        {checkIcon(item.status)}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-black text-slate-950">{item.label}</span>
        <span className="mt-1 block text-[12px] font-semibold leading-5 text-slate-600">{item.detail}</span>
        {'category' in item && (
          <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">
            {item.category}
          </span>
        )}
      </span>
    </div>
  );
}

function SafePreviewTable({
  preview,
  compact = false,
}: {
  preview: ReturnType<typeof buildOracleOperaHotelAddressReview>['safeIntegrationPreview'];
  compact?: boolean;
}) {
  const rows = compact ? [
    ['requestRef', preview.requestRef],
    ['countryCode', preview.countryCode],
    ['postalCodePresent', preview.postalCodePresent ? 'true' : 'false'],
    ['language', preview.language || 'unset'],
    ['confidence', `${Math.round(preview.confidence * 100)}%`],
  ] : [
    ['requestRef', preview.requestRef],
    ['hotelId', preview.hotelId],
    ['tenantId', preview.tenantId],
    ['profileRef', preview.profileRef],
    ['reservationRef', preview.reservationRef],
    ['endpointKind', preview.endpointKind],
    ['mapperId', preview.mapperId],
    ['addressLineCount', String(preview.addressLineCount)],
    ['postalCodePresent', preview.postalCodePresent ? 'true' : 'false'],
    ['language', preview.language || 'unset'],
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {rows.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[145px_minmax(0,1fr)] border-b border-slate-100 last:border-b-0">
          <span className="bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-500">{key}</span>
          <span className="truncate px-3 py-2 text-[12px] font-bold text-slate-800">{value}</span>
        </div>
      ))}
    </div>
  );
}

function syncStateTone(code: string) {
  if (code.includes('FAILED') || code.includes('FORBIDDEN') || code.includes('BLOCKED')) {
    return 'border-rose-200 bg-rose-50 text-rose-800';
  }
  if (code.includes('REVIEW') || code.includes('WAITING')) {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }
  return 'border-emerald-200 bg-emerald-50 text-emerald-800';
}

function SyncStateCard({
  title,
  code,
  label,
  detail,
}: {
  title: string;
  code: string;
  label: string;
  detail: string;
}) {
  return (
    <div className={`rounded-lg border p-3 ${syncStateTone(code)}`}>
      <span className="block text-[10px] font-black uppercase tracking-[0.16em] opacity-75">{title}</span>
      <span className="mt-2 block text-[15px] font-black">{label}</span>
      <span className="mt-1 block break-all font-mono text-[11px] font-black">{code}</span>
      <span className="mt-2 block text-[12px] font-semibold leading-5">{detail}</span>
    </div>
  );
}

export function OracleOperaHotelAddressScreen() {
  const [draft, setDraft] = React.useState<OracleOperaHotelAddressInput>(samples[0]);
  const [workflow, setWorkflow] = React.useState<WorkflowState>('editing');
  const [role, setRole] = React.useState<OracleOperaHotelAddressRole>('frontDesk');
  const [undoStack, setUndoStack] = React.useState<UndoSnapshot[]>([]);
  const [fieldAuditLog, setFieldAuditLog] = React.useState<string[]>([
    'field-screen-opened:frontDesk',
  ]);
  const review = React.useMemo(() => buildOracleOperaHotelAddressReview(draft), [draft]);
  const roleView = React.useMemo(() => getOracleOperaHotelRoleView(role), [role]);

  const pushHistory = React.useCallback((label: string) => {
    setUndoStack(previous => [{ label, draft, workflow, role }, ...previous].slice(0, 12));
    setFieldAuditLog(previous => [`${role}:${label}`, ...previous].slice(0, 16));
  }, [draft, role, workflow]);

  const setSample = React.useCallback((id: string) => {
    const next = samples.find(sample => sample.id === id) ?? samples[0];
    pushHistory(`sample-change:${next.propertyCode}`);
    setDraft(next);
    setWorkflow('editing');
  }, [pushHistory]);

  const changeRole = React.useCallback((nextRole: OracleOperaHotelAddressRole) => {
    if (nextRole === role) return;
    pushHistory(`role-change:${nextRole}`);
    setRole(nextRole);
  }, [pushHistory, role]);

  const updateField = React.useCallback(<K extends keyof OracleOperaHotelAddressInput,>(
    key: K,
    value: OracleOperaHotelAddressInput[K],
    label: string,
  ) => {
    if (draft[key] === value) return;
    pushHistory(`edit:${label}`);
    setDraft(previous => ({ ...previous, [key]: value }));
    setWorkflow('editing');
  }, [draft, pushHistory]);

  const confirmAddress = React.useCallback(() => {
    if (review.status === 'ready' && roleView.canConfirmAddress) {
      pushHistory('confirm-address');
      setWorkflow('confirmed');
    }
  }, [pushHistory, review.status, roleView.canConfirmAddress]);

  const queueSync = React.useCallback(() => {
    if (review.status === 'ready' && roleView.canQueueOperaSync) {
      pushHistory('queue-opera-sync');
      setWorkflow('queued');
    }
  }, [pushHistory, review.status, roleView.canQueueOperaSync]);

  const undoLastAction = React.useCallback(() => {
    const [latest, ...rest] = undoStack;
    if (!latest) return;
    setDraft(latest.draft);
    setWorkflow(latest.workflow);
    setRole(latest.role);
    setUndoStack(rest);
    setFieldAuditLog(previous => [`undo:${latest.label}`, ...previous].slice(0, 16));
  }, [undoStack]);

  const roleCanUseAddressFields = roleView.canSeeRawStaffAddress;
  const addressFieldsDisabled = !roleView.canEditAddress;

  return (
    <div className="agid-fixed-page-scroll fixed inset-0 z-[220] bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={returnToOpenSource}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-950 hover:text-white"
              aria-label="Return to open source home"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black md:text-xl">Oracle OPERA Hotel Address Review</h1>
              <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                OHIP mapper / no raw address / hotel queue
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={undoLastAction}
              disabled={!undoStack.length}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </button>
            <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[11px] font-black uppercase ${statusTone(review.status)}`}>
              {statusLabel(review.status)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-black uppercase text-sky-800">
              <Database className="h-4 w-4" />
              Dry-run first
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Redacted preview
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-4 px-3 py-4 md:px-5 lg:grid-cols-[minmax(360px,0.9fr)_minmax(460px,1.1fr)]">
        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Role view</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">役割別UI</h2>
                <p className="mt-1 text-[13px] font-semibold leading-6 text-slate-600">{roleView.description}</p>
              </div>
              <button
                type="button"
                onClick={undoLastAction}
                disabled={!undoStack.length}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-[12px] font-black text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400 md:hidden"
              >
                <Undo2 className="h-4 w-4" />
                直前の操作を取り消す
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {ORACLE_OPERA_HOTEL_ADDRESS_ROLES.map(item => {
                const selected = item.role === role;
                const Icon = item.role === 'delivery' ? Truck : item.role === 'customer' ? UserRound : item.role === 'admin' ? ShieldCheck : Building2;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => changeRole(item.role)}
                    className={`min-h-24 rounded-lg border p-3 text-left transition ${
                      selected
                        ? 'border-blue-300 bg-blue-50 shadow-sm shadow-blue-100'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[13px] font-black text-slate-950">
                      <Icon className={`h-4 w-4 ${selected ? 'text-blue-700' : 'text-slate-500'}`} />
                      {item.label}
                    </span>
                    <span className="mt-2 block text-[11px] font-semibold leading-5 text-slate-600">{item.description}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <span className="rounded-md bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">
                Edit: {roleView.canEditAddress ? 'allowed' : 'read-only'}
              </span>
              <span className="rounded-md bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">
                OPERA queue: {roleView.canQueueOperaSync ? 'allowed' : 'hidden'}
              </span>
              <span className="rounded-md bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">
                Audit: {roleView.auditLogScope}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Hotel address confirmation</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">OPERAへ送る前にホテル住所を確認</h2>
                <p className="mt-2 max-w-2xl text-[13px] font-semibold leading-6 text-slate-600">
                  現場は住所フィールドを確認し、外部連携側はraw住所ではなくalias、件数、国、郵便番号有無、mapperだけを見る構成です。
                </p>
              </div>
              <div className={`shrink-0 rounded-lg border px-4 py-3 text-center ${statusTone(review.status)}`}>
                <span className="block text-[24px] font-black leading-none">{review.readinessScore}</span>
                <span className="mt-1 block text-[10px] font-black uppercase">score</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Sample property</span>
                <select
                  value={draft.id}
                  onChange={event => setSample(event.target.value)}
                  disabled={!roleView.canEditAddress}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  {samples.map(sample => (
                    <option key={sample.id} value={sample.id}>{sample.propertyCode} / {sample.propertyName}</option>
                  ))}
                </select>
              </label>
              <FieldInput label="Property name" value={draft.propertyName} disabled={addressFieldsDisabled} onChange={value => updateField('propertyName', value, 'property-name')} />
              <FieldInput label="Property code" value={draft.propertyCode} disabled={addressFieldsDisabled} onChange={value => updateField('propertyCode', value, 'property-code')} />
              {roleView.canSeeOperaMapper ? (
                <>
                  <FieldInput label="Hotel ID" value={draft.hotelId} disabled={!roleView.canQueueOperaSync} onChange={value => updateField('hotelId', value, 'hotel-id')} />
                  <FieldInput label="Tenant ID" value={draft.tenantId} disabled={!roleView.canQueueOperaSync} onChange={value => updateField('tenantId', value, 'tenant-id')} />
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">OHIP endpoint</span>
                    <select
                      value={draft.endpointKind}
                      onChange={event => updateField('endpointKind', event.target.value as OracleOperaHotelAddressEndpointKind, 'ohip-endpoint')}
                      disabled={!roleView.canQueueOperaSync}
                      className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <option value="profile-address">Profile address</option>
                      <option value="reservation-profile-address">Reservation profile address</option>
                      <option value="custom-address">Custom address</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">OPERA LOV address type</span>
                    <select
                      value={draft.addressType}
                      onChange={event => updateField('addressType', event.target.value, 'opera-lov-address-type')}
                      disabled={!roleView.canQueueOperaSync}
                      className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <option value="BUSINESS">BUSINESS</option>
                      <option value="HOME">HOME</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </label>
                </>
              ) : (
                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Restricted OPERA fields</p>
                  <p className="mt-2 text-[12px] font-semibold leading-5 text-slate-600">
                    {roleView.label}画面では hotelId、tenantId、OHIP endpoint、LOVコードを表示しません。必要な場合は管理者または受付に切り替えてください。
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-black text-slate-950">Confirmed address fields</h2>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                {roleCanUseAddressFields ? 'Staff-visible' : 'Redacted field view'}
              </span>
            </div>
            {roleCanUseAddressFields ? (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <FieldInput label="Address line 1" value={draft.addressLine1 || ''} disabled={addressFieldsDisabled} onChange={value => updateField('addressLine1', value, 'address-line-1')} />
                  <FieldInput label="Address line 2" value={draft.addressLine2 || ''} disabled={addressFieldsDisabled} onChange={value => updateField('addressLine2', value, 'address-line-2')} />
                  <FieldInput label="City / locality" value={draft.city || ''} disabled={addressFieldsDisabled} onChange={value => updateField('city', value, 'city-locality')} />
                  <FieldInput label="State / province" value={draft.stateProvince || ''} disabled={addressFieldsDisabled} onChange={value => updateField('stateProvince', value, 'state-province')} />
                  <FieldInput label="Postal code" value={draft.postalCode || ''} disabled={addressFieldsDisabled} onChange={value => updateField('postalCode', value, 'postal-code')} />
                  <FieldInput label="Country code" value={draft.countryCode} disabled={addressFieldsDisabled} onChange={value => updateField('countryCode', value.toUpperCase(), 'country-code')} />
                  <FieldInput label="Language tag" value={draft.language} disabled={addressFieldsDisabled} onChange={value => updateField('language', value, 'language-tag')} />
                  <FieldInput label="AGID ref" value={draft.agid || ''} disabled={addressFieldsDisabled} onChange={value => updateField('agid', value, 'agid-ref')} />
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Address rendering preview</p>
                  <div className="mt-2 space-y-1 font-mono text-[13px] font-bold text-slate-800">
                    {review.displayAddressLines.map(line => <p key={line}>{line}</p>)}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Safe subject</p>
                  <p className="mt-2 break-all font-mono text-[13px] font-black text-slate-800">{review.safeSubject}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Country / postal</p>
                  <p className="mt-2 text-[13px] font-black text-slate-800">
                    {review.safeIntegrationPreview.countryCode} / {review.safeIntegrationPreview.postalCodePresent ? 'postal present' : 'postal missing'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Delivery confidence</p>
                  <p className="mt-2 text-[13px] font-black text-slate-800">{Math.round(review.safeIntegrationPreview.confidence * 100)}%</p>
                </div>
              </div>
            )}
          </div>

          <div className={`grid gap-3 ${roleView.role === 'customer' ? 'hidden' : ''}`}>
            {review.fieldChecks.map(item => <CheckRow key={item.id} item={item} />)}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Safe OPERA preview</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">raw住所を出さない連携確認</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase text-emerald-800">
                <LockKeyhole className="h-4 w-4" />
                No raw address response
              </span>
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                {roleView.canSeeOperaMapper ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">OHIP mapper</p>
                    <p className="mt-2 text-[15px] font-black text-slate-950">{review.mapper.mapperId}</p>
                    <p className="mt-2 break-all font-mono text-[12px] font-bold leading-6 text-slate-600">{review.mapper.pathTemplate}</p>
                    <p className="mt-3 text-[12px] font-semibold leading-5 text-slate-600">
                      Method {review.mapper.method}. Address line limit {review.mapper.addressLineLimit}. OPERA本番送信はこの画面では実行せず、確認済みキューへ送ります。
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Role-safe shared preview</p>
                    <p className="mt-2 text-[15px] font-black text-slate-950">OPERA内部mapperは非表示</p>
                    <p className="mt-3 text-[12px] font-semibold leading-5 text-slate-600">
                      {roleView.label}画面では、配送・確認に必要な国、郵便番号有無、信頼度、requestRefだけを表示します。
                    </p>
                  </>
                )}
              </div>
              <SafePreviewTable preview={review.safeIntegrationPreview} compact={!roleView.canSeeOperaMapper} />
            </div>
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">OHIP mapper lanes</p>
                  <h3 className="mt-1 text-[16px] font-black text-blue-950">Profile / Reservation / Address / Notes</h3>
                </div>
                <span className="rounded-md border border-blue-200 bg-white px-2 py-1 text-[10px] font-black uppercase text-blue-700">
                  no-cache / no unsafe retry / RBAC / audit
                </span>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {review.ohipMapperLanes.map(lane => (
                  <div key={lane.domain} className="rounded-lg border border-blue-100 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{lane.domain}</p>
                        <p className="mt-1 break-all font-mono text-[12px] font-black text-slate-950">{lane.mapperId}</p>
                      </div>
                      <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase ${lane.state === 'ready' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : lane.state === 'review' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                        {lane.state}
                      </span>
                    </div>
                    <p className="mt-2 break-all font-mono text-[11px] font-bold leading-5 text-slate-600">{lane.pathTemplate}</p>
                    <p className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                      {lane.method} / {lane.redaction}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {lane.safeFields.map(field => (
                        <span key={field} className="rounded bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{field}</span>
                      ))}
                    </div>
                    {lane.causeCodes.length > 0 && (
                      <div className="mt-2 rounded-md border border-amber-100 bg-amber-50 px-2 py-1 font-mono text-[10px] font-black text-amber-800">
                        {lane.causeCodes.join(' / ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {roleView.canSeeReleaseGates && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-black text-slate-950">Release gates</h2>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                connectorFetchNoCache / no unsafe retry
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {review.releaseGates.map(item => <CheckRow key={item.id} item={item} />)}
            </div>
          </div>
          )}

          {(roleView.canConfirmAddress || roleView.canQueueOperaSync) && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Sync queue</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{review.queue.label}</h2>
                <p className="mt-2 text-[13px] font-semibold leading-6 text-slate-600">{review.queue.nextAction}</p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[11px] font-black uppercase ${statusTone(review.status)}`}>
                {workflow === 'queued' ? 'Queued' : workflow === 'confirmed' ? 'Confirmed' : statusLabel(review.status)}
              </span>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 lg:col-span-2">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Sync state</p>
                    <h3 className="mt-1 text-[16px] font-black text-slate-950">同期待ち・失敗・再送禁止</h3>
                  </div>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-600">
                    {review.syncState.deadLetterPolicy}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <SyncStateCard title="waiting" {...review.syncState.waiting} />
                  <SyncStateCard title="failure" {...review.syncState.failure} />
                  <SyncStateCard title="resend" {...review.syncState.resend} />
                </div>
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">原因コードだけ表示</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {review.syncState.causeCodes.length ? review.syncState.causeCodes.map(code => (
                      <span key={code} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-black text-slate-600">{code}</span>
                    )) : (
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">NO_CAUSE_CODE</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Queue steps</p>
                <div className="mt-3 space-y-2">
                  {review.queue.steps.map(step => (
                    <div key={step} className="flex gap-2 text-[12px] font-bold leading-5 text-slate-700">
                      <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Redacted audit events</p>
                <div className="mt-3 space-y-2 font-mono text-[11px] font-bold text-slate-700">
                  {review.auditEvents.map(event => <p key={event}>{event}</p>)}
                </div>
              </div>
            </div>
            {review.warnings.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] font-bold leading-5 text-amber-900">
                {review.warnings.map(warning => <p key={warning}>{warning}</p>)}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={confirmAddress}
                disabled={review.status !== 'ready' || !roleView.canConfirmAddress}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-[13px] font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <CheckCircle2 className="h-4 w-4" />
                住所確認済みにする
              </button>
              <button
                type="button"
                onClick={queueSync}
                disabled={review.status !== 'ready' || !roleView.canQueueOperaSync}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-[13px] font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Send className="h-4 w-4" />
                OPERA送信キューへ
              </button>
              <button
                type="button"
                onClick={() => {
                  pushHistory('return-to-review');
                  setWorkflow('editing');
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-black text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                再確認
              </button>
            </div>
          </div>
          )}

          {roleView.canSeeFieldAuditLog && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Field audit log</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">現場画面の監査ログ</h2>
                  <p className="mt-2 text-[13px] font-semibold leading-6 text-slate-600">
                    scope: {roleView.auditLogScope}. 住所値、郵便番号値、Oracle raw errorはここにも表示しません。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={undoLastAction}
                  disabled={!undoStack.length}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-[12px] font-black text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  <Undo2 className="h-4 w-4" />
                  直前の操作を取り消す
                </button>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Current action trail</p>
                  <div className="mt-3 space-y-2 font-mono text-[11px] font-bold text-slate-700">
                    {fieldAuditLog.map((event, index) => <p key={`${event}-${index}`}>{event}</p>)}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Review audit refs</p>
                  <div className="mt-3 space-y-2 font-mono text-[11px] font-bold text-slate-700">
                    {review.auditEvents.map(event => <p key={event}>{event}</p>)}
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Undo buffer</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {undoStack.length ? undoStack.slice(0, 6).map(item => (
                    <span key={`${item.label}-${item.workflow}-${item.role}`} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-600">
                      {item.label}
                    </span>
                  )) : (
                    <span className="text-[12px] font-semibold text-slate-500">取り消し可能な操作はありません。</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
