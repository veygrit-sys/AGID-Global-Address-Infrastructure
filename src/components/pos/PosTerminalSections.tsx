import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  DatabaseZap,
  Download,
  Gauge,
  KeyRound,
  LockOpen,
  Network,
  PackageCheck,
  Printer,
  RefreshCw,
  RadioReceiver,
  ReceiptText,
  RotateCw,
  ScanLine,
  Server,
  Settings2,
  ShieldCheck,
  StopCircle,
  Truck,
  Users,
  UserCheck,
  WifiOff,
  XCircle,
} from 'lucide-react';
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

import type {
  PosSecureKeyEntry,
} from '../../lib/agidSecurePos';
import type {
  PosAcceptanceChannel,
  PosAcceptanceReceipt,
} from '../../lib/posAcceptance';
import type {
  PosEthereumPaymentKind,
  PosEthereumPaymentStatus,
  PosEthereumSettlementMode,
} from '../../lib/posEthereumPayment';
import type {
  ShippingLabelRecipientProofMethod,
  ShippingLabelRiskLevel,
  ShippingLabelScanRole,
} from '../../lib/shippingLabelQr';
import {
  hasPosStaffPermission,
  listPosStaffProfiles,
  posOperationalStatusLabel,
  type PosDeviceDiagnostic,
  type PosExceptionAuditCase,
  type PosAdvancedAuditRisk,
  type PosHandoffReverificationReport,
  type PosManagementSnapshot,
  type PosStaffRole,
} from '../../lib/posOperationalControls';
import type { PosRuntimePolicy } from '../../lib/posRuntimePolicy';
import type { PosDesignReviewSummary } from '../../lib/posDesignReview';
import type {
  AddressTerminalCard,
  AddressTerminalFleetSnapshot,
} from '../../lib/addressTerminal';
import type { CiscoInspiredNetworkAssurance } from '../../lib/ciscoInspiredNetworkAssurance';
import { APP_LANGUAGES } from '../../lib/languageSettings';
import { getLanguageDirection } from '../../lib/i18n';
import { cn } from '../../lib/utils';

export type PosModeOption = {
  id: PosAcceptanceChannel;
  label: string;
  detail: string;
  icon: React.ReactNode;
};

export type PosMeasurementInstrumentKind =
  | 'weight-scale'
  | 'dimensioner'
  | 'temperature-probe'
  | 'multimeter'
  | 'custom-meter';

export type PosMeasurementReading = {
  id: string;
  kind: PosMeasurementInstrumentKind;
  value: string;
  unit: string;
  sampleId: string;
  deviceId: string;
  source: 'manual' | 'demo' | 'web-serial' | 'web-hid' | 'web-usb' | 'native-connector';
  capturedAt: string;
};

export type PosWorkspaceId =
  | 'admin'
  | 'scan'
  | 'decision'
  | 'handoff'
  | 'staff'
  | 'devices'
  | 'audit'
  | 'report'
  | 'registry'
  | 'network'
  | 'keys'
  | 'queue'
  | 'design'
  | 'settings';

const POS_FIXED_PRIMARY_FLOW: PosWorkspaceId[] = ['scan', 'decision', 'handoff', 'report'];

type PosPreview = {
  accepted: boolean;
  status: PosAcceptanceReceipt['status'];
  channel: PosAcceptanceChannel;
  record?: PosAcceptanceReceipt['record'];
  shippingLabel?: Pick<
    NonNullable<PosAcceptanceReceipt['shippingLabel']>,
    | 'addressAccuracyStatus'
    | 'addressAccuracyDecision'
    | 'addressAccuracySources'
    | 'proofLevel'
    | 'proofStages'
    | 'carrierScanVerified'
    | 'recipientControlVerified'
    | 'packageReceiptVerified'
    | 'carrierPolicyDecision'
  >;
  errors: string[];
  warnings: string[];
};

type PosAgidSecureRegistryStatus = {
  registryId?: string;
  version?: string;
  checkedAt?: string;
  freshUntil?: string;
  usedCount?: number;
  revokedTokenCount?: number;
  revokedKeyCount?: number;
};

type SecureOpenPreview = {
  status: 'idle' | 'ok' | 'error';
  message: string;
  keyId?: string;
  agidTail?: string;
  errors?: string[];
  warnings?: string[];
};

function receiptTone(status: PosAcceptanceReceipt['status'] | undefined) {
  if (status === 'accepted') return 'border-emerald-100 bg-emerald-50 text-emerald-900';
  if (status === 'review') return 'border-amber-100 bg-amber-50 text-amber-900';
  if (status === 'rejected') return 'border-rose-100 bg-rose-50 text-rose-900';
  return 'border-slate-100 bg-white text-slate-700';
}

function statusIcon(status: PosAcceptanceReceipt['status'] | undefined) {
  if (status === 'accepted') return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (status === 'review') return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  if (status === 'rejected') return <XCircle className="h-5 w-5 text-rose-600" />;
  return <ReceiptText className="h-5 w-5 text-slate-400" />;
}

function statusLabel(
  status: PosAcceptanceReceipt['status'] | undefined,
  preview?: PosPreview | null,
  language = 'en',
) {
  if (status === 'accepted') return posMainCopy(language, 'accepted');
  if (status === 'review') return posMainCopy(language, 'reviewRequired');
  if (status === 'rejected') return posMainCopy(language, 'rejected');
  if (preview?.status === 'accepted') return posMainCopy(language, 'readyToAccept');
  if (preview?.status === 'review') return posMainCopy(language, 'reviewBeforeAccept');
  if (preview?.status === 'rejected') return posMainCopy(language, 'payloadRejected');
  return posMainCopy(language, 'waitingForIntake');
}

function isJapanesePosLanguage(language: string) {
  return language.startsWith('ja');
}

function posInlineCopy(language: string, en: string, ja: string) {
  return isJapanesePosLanguage(language) ? ja : en;
}

function posLocale(language: string) {
  return isJapanesePosLanguage(language) ? 'ja-JP' : 'en-US';
}

function waybillProofLevelLabel(level?: string, language = 'en') {
  if (level === 'address-valid') return posInlineCopy(language, 'Address Valid', '住所有効');
  if (level === 'carrier-accepted') return posInlineCopy(language, 'Carrier Accepted', '配送業者受理');
  if (level === 'recipient-controlled') return posInlineCopy(language, 'Recipient Controlled', '受取人確認済み');
  if (level === 'delivery-completed') return posInlineCopy(language, 'Delivery Completed', '配送完了');
  return posInlineCopy(language, 'No proof', '証明なし');
}

function waybillProofLevelClasses(level?: string) {
  if (level === 'delivery-completed') return 'bg-emerald-100 text-emerald-800';
  if (level === 'recipient-controlled') return 'bg-blue-100 text-blue-800';
  if (level === 'carrier-accepted') return 'bg-sky-100 text-sky-800';
  if (level === 'address-valid') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-500';
}

function addressAccuracyLabel(status?: string, language = 'en') {
  if (status === 'verified') return posInlineCopy(language, 'Verified', '検証済み');
  if (status === 'partial') return posInlineCopy(language, 'Partial', '部分一致');
  if (status === 'needs-review') return posInlineCopy(language, 'Needs review', '要確認');
  return posInlineCopy(language, 'Not checked', '未確認');
}

function addressAccuracyClasses(status?: string) {
  if (status === 'verified') return 'bg-emerald-100 text-emerald-800';
  if (status === 'partial') return 'bg-amber-100 text-amber-800';
  if (status === 'needs-review') return 'bg-rose-100 text-rose-800';
  return 'bg-slate-100 text-slate-500';
}

type WaybillProgressSource = {
  addressAccuracyStatus?: string;
  addressAccuracyDecision?: string;
  proofLevel?: string;
  proofStages?: Array<{
    level: string;
    verified: boolean;
    detail: string;
  }>;
  carrierScanVerified?: boolean;
  recipientControlVerified?: boolean;
  packageReceiptVerified?: boolean;
};

function waybillStageVerified(source: WaybillProgressSource | null | undefined, level: string) {
  return Boolean(source?.proofStages?.some(stage => stage.level === level && stage.verified));
}

function mergeWaybillProgressSource(
  source: WaybillProgressSource | null | undefined,
  report?: PosHandoffReverificationReport,
): WaybillProgressSource | null {
  if (report && report.proofLevel !== 'none') {
    return {
      ...(source ?? {}),
      proofLevel: report.proofLevel,
      proofStages: report.proofStages,
    };
  }
  return source ?? null;
}

type PosDecisionReasonTone = 'danger' | 'warning';

type PosDecisionReasonItem = {
  code: string;
  label: string;
  detail: string;
  tone: PosDecisionReasonTone;
  source: string;
};

function carrierPolicyReasonCode(reason: string) {
  if (reason === 'address-defect') return 'carrier-policy-rejects-address-defect';
  if (reason === 'undeliverable-region') return 'carrier-policy-rejects-undeliverable-region';
  if (reason === 'po-box') return 'carrier-policy-rejects-po-box';
  if (reason === 'auto-lock') return 'carrier-policy-rejects-auto-lock';
  if (reason === 'carrier-policy') return 'carrier-policy-requires-aoid-access-profile';
  return 'carrier-policy-rejects-label';
}

function posDecisionReasonCopy(language: string, code: string) {
  const copy: Record<string, { en: [string, string]; ja: [string, string] }> = {
    'carrier-policy-rejects-address-defect': {
      en: ['Address defect', 'Carrier policy blocks labels with missing or inconsistent address fields.'],
      ja: ['住所不備', '不足または不整合のある住所は配送ポリシーで拒否します。'],
    },
    'carrier-policy-rejects-undeliverable-region': {
      en: ['Undeliverable area', 'The selected carrier cannot serve this delivery area.'],
      ja: ['配送不能地域', '選択中の配送業者ではこの地域へ配送できません。'],
    },
    'carrier-policy-rejects-po-box': {
      en: ['PO Box not accepted', 'Carrier policy does not accept PO Box destinations for this flow.'],
      ja: ['私書箱不可', 'この受付では配送ポリシー上、私書箱宛先を受け付けません。'],
    },
    'carrier-policy-rejects-auto-lock': {
      en: ['Auto-lock access blocked', 'Auto-lock access requires an accepted access profile before release.'],
      ja: ['オートロック制限', '引き渡し前に入館方法の登録確認が必要です。'],
    },
    'carrier-policy-requires-aoid-access-profile': {
      en: ['AOID access profile missing', 'PO Box or auto-lock delivery needs an AOID access profile confirmation.'],
      ja: ['AOIDアクセス情報不足', '私書箱またはオートロック配送にはAOIDのアクセス種別確認が必要です。'],
    },
    'shipping-label-address-needs-review': {
      en: ['Address needs review', 'Postal, AGID, or address-validation evidence is partial and requires operator review.'],
      ja: ['住所要確認', '郵便番号、AGID、住所検証の根拠が部分的なため担当者確認が必要です。'],
    },
    'shipping-label-address-reference-missing': {
      en: ['Address reference missing', 'The waybill does not carry a valid redacted address reference.'],
      ja: ['住所参照不足', '送り状に有効な秘匿住所参照がありません。'],
    },
    'shipping-label-expired': {
      en: ['QR expired', 'The waybill QR is outside its freshness window.'],
      ja: ['QR期限切れ', '送り状QRの鮮度期限を過ぎています。'],
    },
    'shipping-label-nullifier-already-used': {
      en: ['QR already used', 'The recipient nullifier has already been recorded as used.'],
      ja: ['QR使用済み', '受取人nullifierがすでに使用済みとして記録されています。'],
    },
    'recipient-proof-code-required': {
      en: ['Recipient proof required', 'Ask the recipient for proof before package release.'],
      ja: ['受取人証明が必要', '荷物を渡す前に受取人証明を求めてください。'],
    },
    'recipient-passkey-proof-required': {
      en: ['Passkey proof required', 'Recipient passkey evidence is required for this handoff.'],
      ja: ['Passkey証明が必要', 'この引き渡しには受取人のPasskey証跡が必要です。'],
    },
    'recipient-aoid-credential-proof-required': {
      en: ['AOID credential required', 'Recipient AOID credential proof is required for this handoff.'],
      ja: ['AOID credentialが必要', 'この引き渡しには受取人AOID credential証明が必要です。'],
    },
    'recipient-nfc-card-proof-required': {
      en: ['NFC proof required', 'Recipient NFC card evidence is required for this handoff.'],
      ja: ['NFC証明が必要', 'この引き渡しには受取人NFCカード証跡が必要です。'],
    },
    'recipient-challenge-signature-required': {
      en: ['Challenge signature missing', 'Issue a POS challenge and collect a recipient-side signature.'],
      ja: ['チャレンジ署名不足', 'POSチャレンジを発行し、受取人側署名を取得してください。'],
    },
    'carrier-terminal-id-required': {
      en: ['Carrier terminal ID missing', 'High-risk or carrier-side scans require a carrier terminal identifier.'],
      ja: ['配送端末ID不足', '高リスクまたは配送業者側スキャンには配送端末IDが必要です。'],
    },
    'carrier-terminal-signature-required': {
      en: ['Carrier terminal signature missing', 'Carrier-side evidence must include a terminal signature.'],
      ja: ['配送端末署名不足', '配送業者側証跡には端末署名が必要です。'],
    },
    'ethereum-payment-blocks-pos-acceptance': {
      en: ['Payment gate blocks release', 'The payment or settlement gate has not cleared this handoff.'],
      ja: ['支払いゲートで停止', '支払いまたは精算ゲートがこの引き渡しを許可していません。'],
    },
  };
  const entry = copy[code];
  if (entry) {
    const [label, detail] = isJapanesePosLanguage(language) ? entry.ja : entry.en;
    return { label, detail };
  }
  return {
    label: posGeneratedText(language, code),
    detail: posInlineCopy(language, 'Review the redacted receipt and resolve this reason before release.', '秘匿レシートを確認し、この理由を解消してから引き渡してください。'),
  };
}

function posDecisionReasonTone(code: string, fallback: PosDecisionReasonTone): PosDecisionReasonTone {
  if (code.includes('rejects') || code.includes('expired') || code.includes('already-used') || code.includes('blocks')) return 'danger';
  return fallback;
}

function buildPosDecisionReasonItems(
  language: string,
  receipt: PosAcceptanceReceipt | null,
  preview: PosPreview | null,
  report?: PosHandoffReverificationReport,
): PosDecisionReasonItem[] {
  const reasons = new Map<string, PosDecisionReasonItem>();
  const addReason = (code: string, fallbackTone: PosDecisionReasonTone, source: string) => {
    const normalized = code.trim();
    if (!normalized) return;
    const copy = posDecisionReasonCopy(language, normalized);
    const tone = posDecisionReasonTone(normalized, fallbackTone);
    const current = reasons.get(normalized);
    if (current && current.tone === 'danger') return;
    reasons.set(normalized, {
      code: normalized,
      label: copy.label,
      detail: copy.detail,
      tone,
      source,
    });
  };
  const addCarrierPolicyReasons = (decision: NonNullable<PosAcceptanceReceipt['shippingLabel']>['carrierPolicyDecision'] | undefined, source: string) => {
    if (!decision?.rejected) return;
    for (const reason of decision.reasons) addReason(carrierPolicyReasonCode(reason), 'danger', source);
  };

  for (const error of receipt?.errors ?? []) addReason(error, 'danger', posInlineCopy(language, 'receipt error', 'レシートエラー'));
  for (const warning of receipt?.warnings ?? []) addReason(warning, 'warning', posInlineCopy(language, 'receipt warning', 'レシート警告'));
  for (const error of preview?.errors ?? []) addReason(error, 'danger', posInlineCopy(language, 'preview error', 'プレビューエラー'));
  for (const warning of preview?.warnings ?? []) addReason(warning, 'warning', posInlineCopy(language, 'preview warning', 'プレビュー警告'));
  addCarrierPolicyReasons(receipt?.shippingLabel?.carrierPolicyDecision, posInlineCopy(language, 'carrier policy', '配送ポリシー'));
  addCarrierPolicyReasons(preview?.shippingLabel?.carrierPolicyDecision, posInlineCopy(language, 'carrier policy', '配送ポリシー'));

  const shippingLabel = receipt?.shippingLabel ?? preview?.shippingLabel;
  if (shippingLabel?.addressAccuracyDecision === 'review' || shippingLabel?.addressAccuracyStatus === 'needs-review') {
    addReason('shipping-label-address-needs-review', 'warning', posInlineCopy(language, 'address quality', '住所品質'));
  }
  for (const check of report?.checks ?? []) {
    if (check.state === 'fail' || check.state === 'attention') {
      addReason(check.label, check.state === 'fail' ? 'danger' : 'warning', posInlineCopy(language, 'handoff report', '引き渡しレポート'));
    }
  }
  return Array.from(reasons.values()).slice(0, 8);
}

function posDecisionReasonClasses(tone: PosDecisionReasonTone) {
  if (tone === 'danger') return 'border-rose-200 bg-rose-50 text-rose-900';
  return 'border-amber-200 bg-amber-50 text-amber-950';
}

const PosDecisionReasonPanel: React.FC<{
  reasons: PosDecisionReasonItem[];
  language?: string;
  compact?: boolean;
}> = ({ reasons, language = 'en', compact = false }) => (
  <div className={cn('rounded-md border border-white/70 bg-white/70 shadow-sm', compact ? 'p-3' : 'p-4')}>
    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {posInlineCopy(language, 'Reject / review reasons', '拒否・要確認理由')}
      </p>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {posInlineCopy(language, 'redacted codes only', '秘匿コードのみ')}
      </p>
    </div>
    {reasons.length > 0 ? (
      <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'lg:grid-cols-2')}>
        {reasons.map((reason) => (
          <div key={`${reason.code}:${reason.source}`} className={cn('rounded-md border p-3', posDecisionReasonClasses(reason.tone))}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-black">{reason.label}</p>
                <p className="mt-1 text-xs font-bold leading-5 opacity-75">{reason.detail}</p>
              </div>
              <span className="shrink-0 rounded bg-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-widest">
                {reason.source}
              </span>
            </div>
            <p className="mt-2 truncate text-[9px] font-black uppercase tracking-widest opacity-50">{reason.code}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
        {posInlineCopy(language, 'No reject or review reason is active for the current receipt.', '現在のレシートに有効な拒否・要確認理由はありません。')}
      </p>
    )}
  </div>
);

function waybillProgressToneClasses(tone: 'ok' | 'warning' | 'pending') {
  if (tone === 'ok') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-950';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function waybillProgressIconClasses(tone: 'ok' | 'warning' | 'pending') {
  if (tone === 'ok') return 'bg-emerald-100 text-emerald-700';
  if (tone === 'warning') return 'bg-amber-100 text-amber-700';
  return 'bg-white text-slate-400';
}

function buildWaybillProgressCards(source: WaybillProgressSource | null | undefined, language = 'en') {
  const addressStageOk = waybillStageVerified(source, 'address-valid');
  const addressOk = Boolean(source && addressStageOk && source.addressAccuracyStatus !== 'needs-review');
  const addressVerified = source?.addressAccuracyStatus === 'verified';
  const addressReview = Boolean(source && source.addressAccuracyDecision === 'review');
  const carrierOk = Boolean(source?.carrierScanVerified || waybillStageVerified(source, 'carrier-accepted'));
  const recipientOk = Boolean(source?.recipientControlVerified || waybillStageVerified(source, 'recipient-controlled'));
  const handoffOk = Boolean(
    source?.packageReceiptVerified && carrierOk && recipientOk
  ) || waybillStageVerified(source, 'delivery-completed');

  return [
    {
      key: 'address',
      label: addressOk
        ? posInlineCopy(language, 'Address OK', '住所OK')
        : addressReview
          ? posInlineCopy(language, 'Address Review', '住所要確認')
          : posInlineCopy(language, 'Address Pending', '住所待機'),
      state: addressVerified
        ? posInlineCopy(language, 'verified', '検証済み')
        : addressOk
          ? posInlineCopy(language, 'usable', '利用可')
          : addressReview
            ? posInlineCopy(language, 'review', '要確認')
            : posInlineCopy(language, 'waiting', '待機'),
      detail: addressVerified
        ? posInlineCopy(language, 'Postal, country, or AGID evidence agrees.', '郵便番号、国別検証、AGID根拠が一致しています。')
        : addressOk
          ? posInlineCopy(language, 'Address reference is usable; keep review visible.', '住所参照は利用可能です。確認状態は表示したままにします。')
          : addressReview
            ? posInlineCopy(language, 'Operator should review before release.', '引き渡し前に担当者確認が必要です。')
            : posInlineCopy(language, 'Scan or build a waybill first.', '先にスキャンするか送り状QRを作成してください。'),
      tone: addressVerified || addressOk ? 'ok' as const : addressReview ? 'warning' as const : 'pending' as const,
      icon: addressVerified || addressOk ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />,
    },
    {
      key: 'carrier',
      label: carrierOk ? posInlineCopy(language, 'Carrier Scan OK', '配送業者スキャンOK') : posInlineCopy(language, 'Carrier Scan Pending', '配送業者スキャン待機'),
      state: carrierOk ? posInlineCopy(language, 'accepted', '受理済み') : posInlineCopy(language, 'waiting', '待機'),
      detail: carrierOk
        ? posInlineCopy(language, 'Carrier-side scan and terminal evidence are present.', '配送業者側スキャンと端末証跡があります。')
        : posInlineCopy(language, 'Carrier scans the waybill before handoff.', '引き渡し前に配送業者が送り状をスキャンします。'),
      tone: carrierOk ? 'ok' as const : 'pending' as const,
      icon: carrierOk ? <Truck className="h-5 w-5" /> : <ScanLine className="h-5 w-5" />,
    },
    {
      key: 'recipient',
      label: recipientOk ? posInlineCopy(language, 'Recipient OK', '受取人OK') : posInlineCopy(language, 'Recipient Pending', '受取人待機'),
      state: recipientOk ? posInlineCopy(language, 'controlled', '確認済み') : posInlineCopy(language, 'waiting', '待機'),
      detail: recipientOk
        ? posInlineCopy(language, 'Recipient proof, credential, passkey, or NFC evidence matched.', '受取人証明、credential、Passkey、NFC根拠が一致しました。')
        : posInlineCopy(language, 'Recipient proof is still required before release.', '引き渡し前に受取人証明が必要です。'),
      tone: recipientOk ? 'ok' as const : 'warning' as const,
      icon: recipientOk ? <UserCheck className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />,
    },
    {
      key: 'handoff',
      label: handoffOk ? posInlineCopy(language, 'Handoff Complete', '引き渡し完了') : posInlineCopy(language, 'Handoff Pending', '引き渡し待機'),
      state: handoffOk ? posInlineCopy(language, 'complete', '完了') : posInlineCopy(language, 'not complete', '未完了'),
      detail: handoffOk
        ? posInlineCopy(language, 'Carrier and recipient evidence reconciled.', '配送業者と受取人の証跡が照合済みです。')
        : posInlineCopy(language, 'Complete both sides, then run post-handoff review.', '両側の確認後、引き渡し後の再照合を実行します。'),
      tone: handoffOk ? 'ok' as const : 'pending' as const,
      icon: handoffOk ? <PackageCheck className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />,
    },
  ];
}

const PosWaybillProgressBoard: React.FC<{
  source?: WaybillProgressSource | null;
  compact?: boolean;
  language?: string;
}> = ({ source, compact = false, language = 'en' }) => (
  <div className={cn('grid gap-2', compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 xl:grid-cols-4')}>
    {buildWaybillProgressCards(source, language).map((card) => (
      <div
        key={card.key}
        className={cn(
          'rounded-md border p-3 shadow-sm',
          waybillProgressToneClasses(card.tone),
        )}
      >
        <div className="flex items-start gap-3">
          <span className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
            waybillProgressIconClasses(card.tone),
          )}>
            {card.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black leading-5">{card.label}</span>
            <span className="mt-1 block text-[9px] font-black uppercase tracking-widest opacity-55">
              {card.state}
            </span>
          </span>
        </div>
        {!compact && (
          <p className="mt-3 text-xs font-bold leading-5 opacity-75">{card.detail}</p>
        )}
      </div>
    ))}
  </div>
);

function decisionClasses(status: PosAcceptanceReceipt['status'] | undefined, preview?: PosPreview | null) {
  const resolvedStatus = status ?? preview?.status;
  if (resolvedStatus === 'accepted') return 'border-emerald-300 bg-emerald-50 text-emerald-950';
  if (resolvedStatus === 'review') return 'border-amber-300 bg-amber-50 text-amber-950';
  if (resolvedStatus === 'rejected') return 'border-rose-300 bg-rose-50 text-rose-950';
  return 'border-sky-200 bg-sky-50 text-sky-950';
}

function compactTime(value?: string, language = 'en') {
  if (!value) return posInlineCopy(language, 'not checked', '未確認');
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return posInlineCopy(language, 'not checked', '未確認');
  return new Intl.DateTimeFormat(posLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed);
}

const WORKSPACE_ICONS: Record<PosWorkspaceId, React.ReactNode> = {
  admin: <BarChart3 className="h-5 w-5" />,
  scan: <ScanLine className="h-5 w-5" />,
  decision: <ClipboardCheck className="h-5 w-5" />,
  handoff: <PackageCheck className="h-5 w-5" />,
  staff: <Users className="h-5 w-5" />,
  devices: <Activity className="h-5 w-5" />,
  audit: <AlertTriangle className="h-5 w-5" />,
  report: <ClipboardList className="h-5 w-5" />,
  registry: <Server className="h-5 w-5" />,
  network: <Network className="h-5 w-5" />,
  keys: <KeyRound className="h-5 w-5" />,
  queue: <ClipboardList className="h-5 w-5" />,
  design: <Gauge className="h-5 w-5" />,
  settings: <Settings2 className="h-5 w-5" />,
};

function managementGradeClasses(grade: PosManagementSnapshot['grade']) {
  if (grade === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (grade === 'attention') return 'border-amber-200 bg-amber-50 text-amber-950';
  return 'border-rose-200 bg-rose-50 text-rose-950';
}

function managementMetricClasses(tone: PosManagementSnapshot['metrics'][number]['tone']) {
  if (tone === 'ok') return 'border-emerald-100 bg-emerald-50 text-emerald-900';
  if (tone === 'warning') return 'border-amber-100 bg-amber-50 text-amber-900';
  if (tone === 'danger') return 'border-rose-100 bg-rose-50 text-rose-900';
  return 'border-slate-100 bg-slate-50 text-slate-700';
}

function managementRiskClasses(severity: PosManagementSnapshot['risks'][number]['severity']) {
  if (severity === 'critical') return 'border-rose-200 bg-rose-50 text-rose-950';
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-950';
  return 'border-sky-200 bg-sky-50 text-sky-950';
}

function designGradeClasses(grade: PosDesignReviewSummary['grade']) {
  if (grade === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (grade === 'attention') return 'border-blue-200 bg-blue-50 text-blue-950';
  return 'border-rose-200 bg-rose-50 text-rose-950';
}

function designPriorityClasses(priority: PosDesignReviewSummary['items'][number]['priority']) {
  if (priority === 'P0') return 'border-rose-200 bg-rose-50 text-rose-950';
  if (priority === 'P1') return 'border-amber-200 bg-amber-50 text-amber-950';
  if (priority === 'P2') return 'border-sky-200 bg-sky-50 text-sky-950';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function designPriorityBadgeClasses(priority: PosDesignReviewSummary['items'][number]['priority']) {
  if (priority === 'P0') return 'bg-rose-100 text-rose-700';
  if (priority === 'P1') return 'bg-amber-100 text-amber-700';
  if (priority === 'P2') return 'bg-sky-100 text-sky-700';
  return 'bg-slate-200 text-slate-700';
}

function designFocusLabel(focus: PosDesignReviewSummary['items'][number]['focus'], language = 'en') {
  if (isJapanesePosLanguage(language)) {
    return {
      'decision-clarity': '判定の明瞭性',
      'trust-state': '信頼状態',
      'operator-speed': '担当者速度',
      'handoff-flow': '引き渡し導線',
      'privacy-safety': 'プライバシー安全',
      'settings-readiness': '設定準備',
    }[focus];
  }
  return focus.replace(/-/g, ' ');
}

type PosSettingsCopyKey =
  | 'displayLanguage'
  | 'languageHelp'
  | 'activeLanguage'
  | 'textDirection'
  | 'terminalIdentity'
  | 'terminalIdentityHelp'
  | 'terminalId'
  | 'operator'
  | 'optional'
  | 'carrierAcceptancePolicy'
  | 'carrierAcceptancePolicyHelp'
  | 'rejectAddressDefect'
  | 'rejectUndeliverableRegion'
  | 'rejectPoBox'
  | 'rejectAutoLock'
  | 'requireAoidAccessProfile'
  | 'transactionContext'
  | 'transactionContextHelp'
  | 'purpose'
  | 'amount'
  | 'currency'
  | 'ethereumPayment'
  | 'ethereumPaymentHelp'
  | 'enableEthereumPayment'
  | 'paymentKind'
  | 'prepaid'
  | 'collectOnDelivery'
  | 'settlementMode'
  | 'offchainObserved'
  | 'ethereumRegistry'
  | 'ethereumEscrow'
  | 'paymentStatus'
  | 'tokenSymbol'
  | 'paymentNetworkId'
  | 'observedTxHash'
  | 'releaseAfterHandoff'
  | 'highRiskPayment'
  | 'productionChecklist'
  | 'productionChecklistHelp'
  | 'checkLanguage'
  | 'checkOperator'
  | 'checkRegistry'
  | 'checkCarrierPolicy'
  | 'checkDevices';

const POS_SETTINGS_COPY: Record<'en' | 'ja', Record<PosSettingsCopyKey, string>> = {
  en: {
    displayLanguage: 'Display language',
    languageHelp: 'Shared with the main AGID app language preference and applied immediately to this POS settings screen.',
    activeLanguage: 'Active language',
    textDirection: 'Text direction',
    terminalIdentity: 'Terminal identity',
    terminalIdentityHelp: 'Set a stable terminal id and an operator id before production acceptance.',
    terminalId: 'Terminal ID',
    operator: 'Operator',
    optional: 'optional',
    carrierAcceptancePolicy: 'Carrier acceptance policy',
    carrierAcceptancePolicyHelp: 'Local carrier rules used at label intake. They store policy flags and reason codes only, not raw addresses.',
    rejectAddressDefect: 'Reject labels with address defects',
    rejectUndeliverableRegion: 'Reject undeliverable service areas',
    rejectPoBox: 'Reject PO Box destinations',
    rejectAutoLock: 'Reject auto-lock destinations',
    requireAoidAccessProfile: 'Require AOID access profile for PO Box or auto-lock',
    transactionContext: 'Transaction context',
    transactionContextHelp: 'Used for receipt payloads, audit records, payment context, and registry checks.',
    purpose: 'Purpose',
    amount: 'Amount',
    currency: 'Currency',
    ethereumPayment: 'Ethereum payment',
    ethereumPaymentHelp: 'Optional POS gate for prepaid or collect-on-delivery flows. It stores commitments and tx references, never raw address or wallet secrets.',
    enableEthereumPayment: 'Enable Ethereum payment gate for this POS flow',
    paymentKind: 'Payment kind',
    prepaid: 'Prepaid',
    collectOnDelivery: 'Collect on delivery',
    settlementMode: 'Settlement mode',
    offchainObserved: 'Observed off-chain',
    ethereumRegistry: 'Ethereum registry',
    ethereumEscrow: 'Ethereum escrow',
    paymentStatus: 'Payment status',
    tokenSymbol: 'Token / currency',
    paymentNetworkId: 'Network',
    observedTxHash: 'Observed tx hash',
    releaseAfterHandoff: 'Release escrow after handoff',
    highRiskPayment: 'High-risk payment safeguards',
    productionChecklist: 'Production settings to confirm',
    productionChecklistHelp: 'Language, operator, registry freshness, devices, keys, and offline queue should be checked before live use.',
    checkLanguage: 'Language changes must update visible POS copy and document direction.',
    checkOperator: 'Staff role and operator id must be clear on rejected or review decisions.',
    checkRegistry: 'Revocation, used status, and freshness checks need a reachable registry or cached policy.',
    checkCarrierPolicy: 'Carrier refusal policy should cover address defects, undeliverable regions, PO Box, and auto-lock cases.',
    checkDevices: 'Printer, cash drawer, barcode reader, measuring instrument, QR camera, and NFC readiness should be diagnosed.',
  },
  ja: {
    displayLanguage: '表示言語',
    languageHelp: 'AGID本体のアプリ言語設定と共有され、このPOS設定画面へ即時反映されます。',
    activeLanguage: '現在の言語',
    textDirection: '文字方向',
    terminalIdentity: '端末識別',
    terminalIdentityHelp: '本番受付前に、固定の端末IDと担当者IDを設定してください。',
    terminalId: '端末ID',
    operator: '担当者',
    optional: '任意',
    carrierAcceptancePolicy: '配送業者受付ポリシー',
    carrierAcceptancePolicyHelp: '送り状受付で使うローカル配送ルールです。保存するのはポリシーフラグと理由コードだけで、住所本文は保存しません。',
    rejectAddressDefect: '住所不備の送り状を拒否',
    rejectUndeliverableRegion: '配送不可能地域を拒否',
    rejectPoBox: 'P.O. Box / 私書箱を拒否',
    rejectAutoLock: 'オートロックを拒否',
    requireAoidAccessProfile: 'P.O. Box / オートロックはAOIDアクセス登録を必須にする',
    transactionContext: '取引コンテキスト',
    transactionContextHelp: 'レシート、監査記録、支払い文脈、レジストリ照合に使います。',
    purpose: '用途',
    amount: '金額',
    currency: '通貨',
    ethereumPayment: 'Ethereum支払い',
    ethereumPaymentHelp: '先払い・着払いを配送POS受付のゲートにします。保存するのはcommitmentとtx参照だけで、住所本文やウォレット秘密は保存しません。',
    enableEthereumPayment: 'このPOS受付でEthereum支払いゲートを有効化',
    paymentKind: '支払い種別',
    prepaid: '先払い',
    collectOnDelivery: '着払い',
    settlementMode: '決済モード',
    offchainObserved: 'オフチェーン確認',
    ethereumRegistry: 'Ethereumレジストリ',
    ethereumEscrow: 'Ethereumエスクロー',
    paymentStatus: '支払い状態',
    tokenSymbol: 'トークン/通貨',
    paymentNetworkId: 'ネットワーク',
    observedTxHash: '確認済みtx hash',
    releaseAfterHandoff: '引き渡し後にエスクロー解放',
    highRiskPayment: '高リスク支払い安全弁',
    productionChecklist: '本番前に確認する設定',
    productionChecklistHelp: '言語、担当者、レジストリ鮮度、端末、鍵、オフラインキューを本番前に確認します。',
    checkLanguage: '言語変更がPOS文言と文書方向へ反映されること。',
    checkOperator: '拒否・要確認時にスタッフ権限と担当者IDが追えること。',
    checkRegistry: '失効、使用済み、鮮度確認にレジストリまたはキャッシュポリシーが使えること。',
    checkCarrierPolicy: '住所不備、配送不能地域、P.O. Box、オートロックの拒否ポリシーを確認すること。',
    checkDevices: 'プリンタ、キャッシュドロワー、バーコードリーダー、計測器、QRカメラ、NFCを診断できること。',
  },
};

function posSettingsCopy(language: string, key: PosSettingsCopyKey) {
  return POS_SETTINGS_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

type PosMainCopyKey =
  | 'accepted'
  | 'reviewRequired'
  | 'rejected'
  | 'readyToAccept'
  | 'reviewBeforeAccept'
  | 'payloadRejected'
  | 'waitingForIntake'
  | 'registry'
  | 'sync'
  | 'receipt'
  | 'fresh'
  | 'check'
  | 'loading'
  | 'retry'
  | 'ready'
  | 'none'
  | 'admin'
  | 'managementReady'
  | 'managementAttention'
  | 'releaseBlocked'
  | 'critical'
  | 'warnings'
  | 'generated'
  | 'designReview'
  | 'score'
  | 'designPostureReady'
  | 'riskQueue'
  | 'noManagementRisks'
  | 'managementClean'
  | 'print'
  | 'export'
  | 'adminActions'
  | 'operateTerminal'
  | 'scanIntake'
  | 'scanIntakeDetail'
  | 'refreshRegistry'
  | 'refreshRegistryDetail'
  | 'runDiagnostics'
  | 'runDiagnosticsDetail'
  | 'syncQueue'
  | 'syncQueueDetail'
  | 'reviewAudit'
  | 'reviewAuditDetail'
  | 'designReviewAction'
  | 'designReviewDetail'
  | 'keyControl'
  | 'keyControlDetail'
  | 'trustState'
  | 'registryReceiptPosture'
  | 'issuerRegistry'
  | 'localRegistry'
  | 'usedNullifier'
  | 'used'
  | 'markedAfterAccept'
  | 'pending'
  | 'freshnessWindow'
  | 'validWindow'
  | 'staleOrLocal'
  | 'payloadPrivacy'
  | 'redactedReceipt'
  | 'noRecordYet'
  | 'rawPayloadNoStore'
  | 'serverSync'
  | 'syncing'
  | 'retryNeeded'
  | 'recentSyncFailed'
  | 'receiptCache'
  | 'runtimeSplit'
  | 'decisionWorkbench'
  | 'readyForHandoff'
  | 'doNotReleaseItem'
  | 'supervisorReview'
  | 'noActiveDecision'
  | 'scan'
  | 'readPayload'
  | 'payloadParsed'
  | 'waitingForOperatorInput'
  | 'openAgidS'
  | 'terminalKeyRegistryVerify'
  | 'checkIssuerFreshnessRevocationUsedState'
  | 'mode1ServerRegistryLocalFallback'
  | 'issueRedactedReceipt'
  | 'storesTailsCoarseMetadata';

const POS_MAIN_COPY: Record<'en' | 'ja', Record<PosMainCopyKey, string>> = {
  en: {
    accepted: 'Accepted',
    reviewRequired: 'Review required',
    rejected: 'Rejected',
    readyToAccept: 'Ready to accept',
    reviewBeforeAccept: 'Review before accept',
    payloadRejected: 'Payload rejected',
    waitingForIntake: 'Waiting for intake',
    registry: 'Registry',
    sync: 'Sync',
    receipt: 'Receipt',
    fresh: 'Fresh',
    check: 'Check',
    loading: 'Loading',
    retry: 'Retry',
    ready: 'Ready',
    none: 'None',
    admin: 'Admin',
    managementReady: 'Management ready',
    managementAttention: 'Management attention',
    releaseBlocked: 'Release blocked',
    critical: 'Critical',
    warnings: 'Warnings',
    generated: 'Generated',
    designReview: 'Design Review',
    score: 'score',
    designPostureReady: 'Design posture ready',
    riskQueue: 'Risk Queue',
    noManagementRisks: 'No management risks',
    managementClean: 'Terminal, staff, registry, keys, devices, and receipt posture are clean.',
    print: 'Print',
    export: 'Export',
    adminActions: 'Admin Actions',
    operateTerminal: 'Operate the terminal',
    scanIntake: 'Scan intake',
    scanIntakeDetail: 'Open QR/NFC/manual reader',
    refreshRegistry: 'Refresh registry',
    refreshRegistryDetail: 'Issuer, revocation, used-state freshness',
    runDiagnostics: 'Run diagnostics',
    runDiagnosticsDetail: 'Printer, drawer, reader, meter',
    syncQueue: 'Sync queue',
    syncQueueDetail: 'Reconcile local receipts with server',
    reviewAudit: 'Review audit',
    reviewAuditDetail: 'Rejected and review-required receipts',
    designReviewAction: 'Design review',
    designReviewDetail: 'Weaknesses, priority, and next UI fix',
    keyControl: 'Key control',
    keyControlDetail: 'Generate, rotate, decrypt AGID-S',
    trustState: 'Trust State',
    registryReceiptPosture: 'Registry and receipt posture',
    issuerRegistry: 'Issuer / registry',
    localRegistry: 'local registry',
    usedNullifier: 'Used / nullifier',
    used: 'used',
    markedAfterAccept: 'marked after accept',
    pending: 'pending',
    freshnessWindow: 'Freshness window',
    validWindow: 'valid window',
    staleOrLocal: 'stale or local',
    payloadPrivacy: 'Payload privacy',
    redactedReceipt: 'redacted receipt',
    noRecordYet: 'no record yet',
    rawPayloadNoStore: 'raw payload no-store',
    serverSync: 'Server sync',
    syncing: 'syncing',
    retryNeeded: 'retry needed',
    recentSyncFailed: 'recent sync failed',
    receiptCache: 'receipt cache',
    runtimeSplit: 'Runtime split',
    decisionWorkbench: 'Decision Workbench',
    readyForHandoff: 'Ready for handoff',
    doNotReleaseItem: 'Do not release item',
    supervisorReview: 'Supervisor review',
    noActiveDecision: 'No active decision',
    scan: 'Scan',
    readPayload: 'Read QR / NFC / manual payload',
    payloadParsed: 'Payload parsed',
    waitingForOperatorInput: 'Waiting for operator input',
    openAgidS: 'Open AGID-S when encrypted',
    terminalKeyRegistryVerify: 'Uses terminal key ring and registry verify before acceptance',
    checkIssuerFreshnessRevocationUsedState: 'Check issuer, freshness, revocation, used state',
    mode1ServerRegistryLocalFallback: 'Mode 1 server registry or local fallback',
    issueRedactedReceipt: 'Issue redacted receipt',
    storesTailsCoarseMetadata: 'Stores tails and coarse metadata only',
  },
  ja: {
    accepted: '承認済み',
    reviewRequired: '要確認',
    rejected: '拒否',
    readyToAccept: '受付可能',
    reviewBeforeAccept: '受付前に確認',
    payloadRejected: 'ペイロード拒否',
    waitingForIntake: '受付待機',
    registry: 'レジストリ',
    sync: '同期',
    receipt: 'レシート',
    fresh: '最新',
    check: '確認',
    loading: '読込中',
    retry: '再試行',
    ready: '準備完了',
    none: 'なし',
    admin: '管理',
    managementReady: '管理状態は正常',
    managementAttention: '管理状態は要確認',
    releaseBlocked: '引き渡し停止',
    critical: '重大',
    warnings: '警告',
    generated: '生成',
    designReview: 'デザイン確認',
    score: 'スコア',
    designPostureReady: 'デザイン状態は正常',
    riskQueue: 'リスクキュー',
    noManagementRisks: '管理リスクなし',
    managementClean: '端末、スタッフ、レジストリ、鍵、周辺機器、レシート状態は正常です。',
    print: '印刷',
    export: '書き出し',
    adminActions: '管理操作',
    operateTerminal: '端末を操作',
    scanIntake: '受付スキャン',
    scanIntakeDetail: 'QR/NFC/手入力リーダーを開く',
    refreshRegistry: 'レジストリ更新',
    refreshRegistryDetail: '発行者、失効、使用済み状態の鮮度',
    runDiagnostics: '端末診断',
    runDiagnosticsDetail: 'プリンタ、ドロワー、リーダー、計測器',
    syncQueue: 'キュー同期',
    syncQueueDetail: 'ローカルレシートをサーバーと照合',
    reviewAudit: '監査確認',
    reviewAuditDetail: '拒否・要確認レシート',
    designReviewAction: 'デザイン確認',
    designReviewDetail: '弱点、優先度、次のUI修正',
    keyControl: '鍵管理',
    keyControlDetail: 'AGID-Sの生成、ローテーション、復号',
    trustState: '信頼状態',
    registryReceiptPosture: 'レジストリとレシート状態',
    issuerRegistry: '発行者 / レジストリ',
    localRegistry: 'ローカルレジストリ',
    usedNullifier: '使用済み / nullifier',
    used: '使用済み',
    markedAfterAccept: '承認後に記録',
    pending: '保留',
    freshnessWindow: '鮮度ウィンドウ',
    validWindow: '有効期間内',
    staleOrLocal: '古い/ローカル',
    payloadPrivacy: 'ペイロード秘匿',
    redactedReceipt: '秘匿レシート',
    noRecordYet: '記録なし',
    rawPayloadNoStore: '原文ペイロード非保存',
    serverSync: 'サーバー同期',
    syncing: '同期中',
    retryNeeded: '再試行が必要',
    recentSyncFailed: '直近の同期失敗',
    receiptCache: 'レシートキャッシュ',
    runtimeSplit: '実行モード',
    decisionWorkbench: '判定ワークベンチ',
    readyForHandoff: '引き渡し可能',
    doNotReleaseItem: '商品を渡さない',
    supervisorReview: '責任者確認',
    noActiveDecision: '有効な判定なし',
    scan: 'スキャン',
    readPayload: 'QR / NFC / 手入力を読む',
    payloadParsed: 'ペイロード解析済み',
    waitingForOperatorInput: '担当者入力待ち',
    openAgidS: '暗号化時はAGID-Sを開く',
    terminalKeyRegistryVerify: '端末鍵リングとレジストリ確認を受付前に使います',
    checkIssuerFreshnessRevocationUsedState: '発行者、鮮度、失効、使用済み状態を確認',
    mode1ServerRegistryLocalFallback: 'Mode 1サーバーレジストリまたはローカル代替',
    issueRedactedReceipt: '秘匿レシートを発行',
    storesTailsCoarseMetadata: '末尾と粗いメタデータのみ保存',
  },
};

function posMainCopy(language: string, key: PosMainCopyKey) {
  return POS_MAIN_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function posManagementMetricLabel(language: string, label: string) {
  if (!language.startsWith('ja')) return label;
  if (label === 'Receipts') return 'レシート';
  if (label === 'Release rate') return '引き渡し率';
  if (label === 'Devices') return '端末';
  if (label === 'Role') return '権限';
  if (label === 'Registry') return 'レジストリ';
  if (label === 'AGID-S keys') return 'AGID-S鍵';
  return label;
}

function posGeneratedText(language: string, text: string | undefined) {
  if (!text || !isJapanesePosLanguage(language)) return text || '';
  const exact: Record<string, string> = {
    'Management posture is ready for normal handoff operations.': '通常の引き渡し運用に使える管理状態です。',
    'Management posture is usable, but listed issues should be resolved before high-risk handoff.': '管理状態は利用可能ですが、高リスクの引き渡し前に表示された問題を解消してください。',
    'Management posture is blocked for release until critical issues are resolved.': '重大な問題が解消されるまで引き渡しは停止です。',
    'No receipt history yet': 'レシート履歴はまだありません',
    'Accepted receipts in local cache': 'ローカルキャッシュ内の受理済みレシート',
    'override capable': '上書き権限あり',
    'standard handoff': '標準引き渡し',
    'fresh': '鮮度OK',
    'check': '確認',
    'Freshness window valid': '鮮度ウィンドウは有効です',
    'Use refresh or deferred sync': '更新または遅延同期を使ってください',
    'Active decryption keys': '有効な復号鍵',
    'Encrypted payloads unavailable': '暗号化ペイロードは利用できません',
    'Cashier': 'レジ担当',
    'Pickup operator': '受取担当',
    'Delivery supervisor': '配送責任者',
    'Field admin': '現場管理者',
    'Registry freshness not confirmed': 'レジストリ鮮度未確認',
    'Revocation, used-state, and key status may be stale.': '失効、使用済み状態、鍵状態が古い可能性があります。',
    'Refresh the registry or keep receipts in deferred sync mode.': 'レジストリを更新するか、レシートを遅延同期モードで保持してください。',
    'Receipt sync failed': 'レシート同期失敗',
    'Local evidence exists but server reconciliation did not complete.': 'ローカル証跡はありますが、サーバー照合が完了していません。',
    'Retry sync and keep the local receipt queue intact.': '同期を再試行し、ローカルレシートキューを保持してください。',
    'Rejected cases are open': '未解決の拒否ケースあり',
    'Do not release affected packages until rescanned or supervisor-cleared.': '再スキャンまたは責任者確認が完了するまで対象荷物を渡さないでください。',
    'Review cases are open': '未解決の要確認ケースあり',
    'Open the exception audit and attach a handoff report.': '例外監査を開き、引き渡しレポートを添付してください。',
    'Terminal devices need attention': '端末機器の確認が必要',
    'Run diagnostics and pair printer, drawer, barcode reader, or measuring instrument as needed.': '診断を実行し、必要に応じてプリンタ、ドロワー、バーコードリーダー、計測器を接続してください。',
    'No active AGID-S key': '有効なAGID-S鍵がありません',
    'Encrypted AGID-S payloads cannot be opened on this terminal.': 'この端末では暗号化AGID-Sペイロードを開けません。',
    'Generate or rotate a recipient key before encrypted handoff.': '暗号化引き渡し前に受取人鍵を生成またはローテーションしてください。',
    'Current decision is rejected': '現在の判定は拒否です',
    'Rescan, verify registry state, or escalate to supervisor.': '再スキャン、レジストリ状態確認、または責任者へエスカレーションしてください。',
    'Current decision needs review': '現在の判定は要確認です',
    'Run post-handoff reverification before release.': '引き渡し前に再照合を実行してください。',
    'Release-blocking state needs strongest hierarchy': '引き渡し停止状態を最優先表示にする',
    'Rejected, blocked, or critical states can be missed when the operator is moving quickly.': '担当者が急いでいると、拒否・停止・重大状態を見落とす可能性があります。',
    'Keep the red decision banner dominant, route primary actions to Decision and Audit, and suppress release-oriented controls.': '赤い判定バナーを最も強く表示し、主要操作を判定と監査へ誘導し、引き渡し系操作を抑制してください。',
    'Review state needs a single next action': '要確認状態には次の操作を一つに絞る',
    'Review decisions should not force staff to infer whether to rescan, inspect registry, or escalate.': '再スキャン、レジストリ確認、エスカレーションのどれを行うかをスタッフに推測させないでください。',
    'Make the next action explicit: open Report for supervised review, then return to Scan only after the reason is resolved.': '次の操作を明示してください。責任者確認はレポートを開き、理由解消後だけスキャンへ戻します。',
    'Empty intake state should point to the scanner': '空の受付状態はスキャナへ誘導する',
    'A blank shift start can feel passive instead of scan-first.': 'シフト開始時に空白画面だと、スキャン開始ではなく待機状態に見えます。',
    'Keep Scan as the first operational action and show QR, NFC, and manual input as equal intake paths.': 'スキャンを最初の操作にし、QR、NFC、手入力を同等の受付経路として表示してください。',
    'Parser feedback should be closer to the reader': '解析フィードバックを読取部の近くに置く',
    'Warnings and parse failures lose urgency if they only appear in secondary preview panels.': '警告や解析失敗が副次的なプレビューだけに出ると緊急度が下がります。',
    'Surface the top warning beside the submit control and keep detailed errors in Local Preview.': '最重要警告を送信操作の横に出し、詳細エラーはローカルプレビューに残してください。',
    'Registry freshness must be visible before release': '引き渡し前にレジストリ鮮度を見える化する',
    'Operators need to know whether revocation, used-state, and issuer trust are fresh without reading a registry detail panel.': '担当者は詳細パネルを読まずに、失効、使用済み状態、発行者信頼が新しいか判断できる必要があります。',
    'Keep freshness in the main banner and provide a one-click Registry refresh path.': '鮮度をメインバナーに残し、ワンクリックのレジストリ更新経路を用意してください。',
    'Deferred sync needs an obvious recovery path': '遅延同期には明確な復旧経路が必要',
    'Local receipts can remain usable, but failed sync must not look like a normal ready state.': 'ローカルレシートは利用可能でも、同期失敗を通常の準備完了に見せてはいけません。',
    'Show Queue as the reconciliation task, not as passive history.': 'キューを受動的な履歴ではなく照合作業として表示してください。',
    'Device readiness should be solved before the rush': '混雑前に端末準備を解決する',
    'Printer, drawer, barcode, and measuring-instrument failures slow handoff and make operators improvise.': 'プリンタ、ドロワー、バーコード、計測器の不調は引き渡しを遅らせ、現場判断を増やします。',
    'Run terminal diagnostics and keep printer, barcode, drawer, and measuring-instrument state visible to supervisors.': '端末診断を実行し、プリンタ、バーコード、ドロワー、計測器状態を責任者に見えるようにしてください。',
    'Handoff report needs completion guidance': '引き渡しレポートに完了ガイドが必要',
    'Carrier scan, recipient proof, and terminal signature evidence are easy to confuse.': '配送業者スキャン、受取人証明、端末署名証跡は混同されやすいです。',
    'Use the four-stage board as the primary handoff mental model: Address OK, Carrier Scan OK, Recipient Pending, Handoff Complete.': '住所OK、配送業者スキャンOK、受取人待機、引き渡し完了の4段階ボードを主な判断モデルにしてください。',
    'High-risk safety controls must block release': '高リスク安全制御は引き渡しを止める必要があります',
    'DV, evacuation, refugee, and humanitarian flows cannot rely on ordinary POS disclosure patterns.': 'DV、避難、難民、人道支援の流れでは通常POSの開示方式に依存できません。',
    'Force AGID-S-only sharing, short expiry, immediate used-state marking, and no address-history retention before release.': '引き渡し前にAGID-S限定共有、短い期限、即時使用済み化、住所履歴非保持を強制してください。',
    'Encrypted AGID-S path has no active key': '暗号化AGID-S経路に有効鍵がありません',
    'AGID-S is a core privacy path; no active key turns secure QR intake into a manual exception.': 'AGID-Sは主要なプライバシー経路です。有効鍵がないと安全QR受付が手動例外になります。',
    'Generate or rotate a terminal recipient key before encrypted QR/NFC handoff.': '暗号化QR/NFC引き渡し前に端末受取人鍵を生成またはローテーションしてください。',
    'Operator identity is not production-ready': '担当者IDが本番準備できていません',
    'Review, reject, and override records need a staff identifier for later audit.': '要確認、拒否、上書き記録には後日の監査用スタッフIDが必要です。',
    'Set operator id in Settings before production acceptance.': '本番受付前に設定で担当者IDを設定してください。',
    'Keep design review in the operating loop': '運用ループにデザイン確認を残す',
    'Clean states can regress after new devices, languages, carriers, or high-risk policies are added.': '新しい端末、言語、配送業者、高リスクポリシー追加後に正常状態が劣化することがあります。',
    'Use this review as the first stop before adding new POS screens or external integrations.': '新しいPOS画面や外部連携を追加する前に、このレビューを最初に確認してください。',
    'POS design posture is usable; keep continuous review visible for future regressions.': 'POSデザイン状態は利用可能です。将来の劣化に備えて継続レビューを見える状態にしてください。',
    'Address Valid': '住所有効',
    'Carrier Accepted': '配送業者受理',
    'Recipient Controlled': '受取人確認済み',
    'Delivery Completed': '配送完了',
    'low': '低',
    'medium': '中',
    'high': '高',
    'critical': '重大',
    'stale': '古い',
    'complete': '完了',
    'partial': '部分',
    'Checks passed': '合格チェック',
    'Proof level': '証明レベル',
    'Terminal signatures': '端末署名',
    'Selected receipt': '選択レシート',
    'Carrier scan receipt': '配送業者スキャンレシート',
    'Recipient proof receipt': '受取人証明レシート',
    'Registry freshness check': 'レジストリ鮮度確認',
    'Advanced audit generated': '高度監査生成',
    'No raw payload storage': '原文ペイロード非保存',
    'Receipt ids and signature tails only': 'レシートIDと署名末尾のみ',
    'Domain-separated nullifier evidence': '用途分離されたnullifier証跡',
    'High-risk AGID-S-only controls': '高リスクAGID-S限定制御',
    'Standard redacted receipt controls': '標準の秘匿レシート制御',
    'No full address, proof code, or full signature in report': '完全な住所、証明コード、完全署名をレポートに含めない',
    'Report evidence is redacted to tails': 'レポート証跡は末尾に秘匿済み',
    'Carrier and recipient terminal signatures': '配送業者・受取人の端末署名',
    'Registry freshness and revocation': 'レジストリ鮮度と失効',
    'Duplicate nullifier check': 'nullifier重複確認',
    'High-risk safety controls': '高リスク安全制御',
    'Printed and exported evidence is limited to receipt ids, status values, redacted tails, and coarse operational metadata.': '印刷・書き出し証跡は、レシートID、状態値、秘匿済み末尾、粗い運用メタデータに限定されています。',
    'Review redaction or high-risk controls before releasing this report outside the terminal.': 'このレポートを端末外へ出す前に、秘匿または高リスク制御を確認してください。',
    'The report uses ids, status values, and signature/hash tails instead of raw payloads.': 'レポートは原文ペイロードではなく、ID、状態値、署名/ハッシュ末尾を使います。',
    'Redaction or high-risk controls need review.': '秘匿または高リスク制御の確認が必要です。',
    'Required terminal signature evidence is complete for the selected proof mode.': '選択された証明モードに必要な端末署名証跡は完了しています。',
    'One side of the waybill handoff is missing signed terminal evidence.': '送り状引き渡しの片側で署名済み端末証跡が不足しています。',
    'A repeated used/nullifier value was detected in local evidence.': 'ローカル証跡で使用済み/nullifier値の重複が検出されました。',
    'No repeated used/nullifier value was found in local evidence.': 'ローカル証跡で使用済み/nullifier値の重複は見つかりませんでした。',
    'Waybill handoff should end at Delivery Completed before release.': '引き渡し前に送り状ハンドオフを配送完了まで進める必要があります。',
    'No waybill evidence is selected; local receipt checks are sufficient.': '送り状証跡は選択されていません。ローカルレシート確認で十分です。',
    'Carrier and recipient receipt evidence must both carry terminal signatures.': '配送業者と受取人のレシート証跡の両方に端末署名が必要です。',
    'No waybill dual-signature requirement for this receipt.': 'このレシートには送り状双方署名要件はありません。',
    'Archive the redacted audit report and release only after local identity policy is satisfied.': '秘匿監査レポートを保管し、ローカル本人確認ポリシーを満たした後だけ引き渡してください。',
    'Handoff can be completed after final human identity check.': '最終的な本人確認後に引き渡しを完了できます。',
    'Handoff can continue only with documented operator review.': '担当者レビューを記録した場合のみ引き渡しを続行できます。',
    'Handoff must remain blocked until failed checks are resolved.': '失敗したチェックが解消されるまで引き渡しは停止のままにしてください。',
    'Receipt decision': 'レシート判定',
    'Registry freshness': 'レジストリ鮮度',
    'Staff authorization': 'スタッフ権限',
    'Redaction posture': '秘匿姿勢',
    'Waybill dual scan': '送り状双方スキャン',
    'Waybill nullifier replay': '送り状nullifier再利用',
    'High-risk safety mode': '高リスク安全モード',
    'Printer readiness': 'プリンタ準備',
    'Barcode reader readiness': 'バーコードリーダー準備',
    'Cash drawer requirement': 'キャッシュドロワー要件',
    'No handoff receipt is selected.': '引き渡しレシートが選択されていません。',
    'Registry freshness window is valid.': 'レジストリ鮮度ウィンドウは有効です。',
    'Registry is stale or unavailable; use deferred sync notes.': 'レジストリが古いか利用できません。遅延同期メモを使ってください。',
    'Receipt stores only redacted tails and coarse metadata.': 'レシートは秘匿済み末尾と粗いメタデータのみ保存しています。',
    'No redacted record summary is available.': '秘匿済み記録サマリーがありません。',
    'No waybill receipt is selected.': '送り状レシートが選択されていません。',
    'Delivery Completed: carrier scan, recipient-control scan, timestamps, and terminal evidence signatures are present.': '配送完了: 配送業者スキャン、受取人確認スキャン、時刻、端末証跡署名があります。',
    'Carrier Accepted: carrier scan is present; recipient-control scan is still required.': '配送業者受理: 配送業者スキャンはありますが、受取人確認スキャンがまだ必要です。',
    'Carrier scan is present, but terminal evidence signature is missing.': '配送業者スキャンはありますが、端末証跡署名が不足しています。',
    'Recipient Controlled: recipient-control scan is present; carrier address scan is still required.': '受取人確認済み: 受取人確認スキャンはありますが、配送業者住所スキャンがまだ必要です。',
    'Recipient-control scan is present, but terminal evidence signature is missing.': '受取人確認スキャンはありますが、端末証跡署名が不足しています。',
    'No valid carrier or recipient waybill scan evidence is available.': '有効な配送業者または受取人の送り状スキャン証跡がありません。',
    'No repeated recipient nullifier found in local receipt evidence.': 'ローカルレシート証跡に受取人nullifierの重複は見つかりません。',
    'Printer diagnostic has not run.': 'プリンタ診断が未実行です。',
    'Barcode diagnostic has not run.': 'バーコード診断が未実行です。',
    'Cash drawer diagnostic has not run.': 'キャッシュドロワー診断が未実行です。',
    'No cash drawer action required for this receipt.': 'このレシートではキャッシュドロワー操作は不要です。',
    'AGID-S-only': 'AGID-S限定',
    'no-history-retention': '履歴非保持',
    'short-expiry': '短期有効期限',
    'immediate-used-state': '即時使用済み化',
    'coarse-location-only': '粗い位置のみ',
    'high-risk': '高リスク',
  };
  if (exact[text]) return exact[text];

  let match = text.match(/^(\d+) accepted \/ (\d+) review \/ (\d+) rejected$/);
  if (match) return `受理 ${match[1]} / 要確認 ${match[2]} / 拒否 ${match[3]}`;
  match = text.match(/^(\d+) attention$/);
  if (match) return `${match[1]}件要確認`;
  match = text.match(/^(\d+) failed, (\d+) attention, (\d+) passed\.$/);
  if (match) return `失敗 ${match[1]} / 要確認 ${match[2]} / 合格 ${match[3]}。`;
  match = text.match(/^Risk ([a-z]+) \/ score (\d+)$/);
  if (match) return `リスク ${posGeneratedText(language, match[1])} / スコア ${match[2]}`;
  match = text.match(/^Resolve failed check: (.+)\. (.+)$/);
  if (match) return `失敗チェックを解消: ${posGeneratedText(language, match[1])}。${posGeneratedText(language, match[2])}`;
  match = text.match(/^Review attention check: (.+)\. (.+)$/);
  if (match) return `要確認チェックを確認: ${posGeneratedText(language, match[1])}。${posGeneratedText(language, match[2])}`;
  match = text.match(/^(\d+) blocked receipt\(s\) require escalation\.$/);
  if (match) return `${match[1]}件の停止レシートはエスカレーションが必要です。`;
  match = text.match(/^(\d+) receipt\(s\) need supervised review\.$/);
  if (match) return `${match[1]}件のレシートは責任者確認が必要です。`;
  match = text.match(/^(\d+) of (\d+) device check\(s\) are not ready\.$/);
  if (match) return `${match[2]}件中${match[1]}件の端末チェックが未準備です。`;
  match = text.match(/^(\d+) release-blocking design issue\(s\) must be made unmistakable before handoff\.$/);
  if (match) return `${match[1]}件の引き渡し停止レベルの設計問題を、引き渡し前に明確化してください。`;
  match = text.match(/^(\d+) improvement item\(s\) should be prioritized for operator speed and trust clarity\.$/);
  if (match) return `${match[1]}件の改善項目を、担当者速度と信頼状態の明瞭性のために優先してください。`;
  match = text.match(/^(\d+) preview issue\(s\)$/);
  if (match) return `${match[1]}件のプレビュー問題`;
  match = text.match(/^(\d+) device issue\(s\), (\d+) offline$/);
  if (match) return `${match[1]}件の端末問題、${match[2]}件オフライン`;
  match = text.match(/^decision=(.+?) \/ report=(.+?) \/ critical=(\d+)$/);
  if (match) return `判定=${posGeneratedText(language, match[1])} / レポート=${posGeneratedText(language, match[2])} / 重大=${match[3]}`;
  match = text.match(/^proofLevel=(.+)$/);
  if (match) return `証明レベル=${posGeneratedText(language, match[1])}`;
  match = text.match(/^management=(.+?) \/ report=(.+)$/);
  if (match) return `管理=${posGeneratedText(language, match[1])} / レポート=${posGeneratedText(language, match[2])}`;
  match = text.match(/^(.+?) (can|cannot) complete handoff\.$/);
  if (match) return `${posGeneratedText(language, match[1])}は引き渡しを${match[2] === 'can' ? '完了できます' : '完了できません'}。`;
  match = text.match(/^(.+?) \/ (accepted|review|rejected)$/);
  if (match) return `${match[1]} / ${posGeneratedText(language, match[2])}`;
  match = text.match(/^Recipient nullifier was used more than once: (.+)$/);
  if (match) return `受取人nullifierが複数回使用されました: ${match[1]}`;

  const statusWords: Record<string, string> = {
    none: 'なし',
    blocked: '停止',
    attention: '要確認',
    cleared: '解消',
    ready: '準備完了',
    review: '要確認',
    rejected: '拒否',
    accepted: '受理',
    error: 'エラー',
    admin: '管理',
    scan: 'スキャン',
    decision: '判定',
    staff: 'スタッフ',
    devices: '端末',
    measure: '計測',
    audit: '監査',
    report: 'レポート',
    registry: 'レジストリ',
    keys: '鍵',
    queue: 'キュー',
    design: 'デザイン',
    'disabled': '無効',
    'coarse-only': '粗い位置のみ',
    'no-retention': '保持しない',
  };
  return statusWords[text] || text;
}

function posReceiptStatusLabel(language: string, status?: string) {
  if (status === 'accepted') return posMainCopy(language, 'accepted');
  if (status === 'review') return posMainCopy(language, 'reviewRequired');
  if (status === 'rejected') return posMainCopy(language, 'rejected');
  return status || posMainCopy(language, 'none');
}

function posDeviceStatusLabel(language: string, status?: string) {
  if (status === 'ready') return posMainCopy(language, 'ready');
  if (status === 'warning') return posMainCopy(language, 'warnings');
  if (status === 'offline') return posInlineCopy(language, 'Offline', 'オフライン');
  return status || posMainCopy(language, 'none');
}

function posCheckStateLabel(language: string, state?: string) {
  if (state === 'pass') return posInlineCopy(language, 'pass', '合格');
  if (state === 'attention') return posInlineCopy(language, 'attention', '要確認');
  if (state === 'fail') return posInlineCopy(language, 'fail', '失敗');
  return state || posMainCopy(language, 'none');
}

function posOperationalStatusDisplay(language: string, status: string) {
  if (status === 'cleared') return posInlineCopy(language, 'Cleared', 'クリア');
  if (status === 'attention') return posInlineCopy(language, 'Attention', '要確認');
  if (status === 'blocked') return posInlineCopy(language, 'Blocked', '停止');
  if (status === 'ready' || status === 'warning' || status === 'offline') {
    return isJapanesePosLanguage(language) ? posDeviceStatusLabel(language, status) : posOperationalStatusLabel(status);
  }
  return status;
}

function posStaffRoleLabel(language: string, role: PosStaffRole, fallback?: string) {
  if (!isJapanesePosLanguage(language)) return fallback || role;
  if (role === 'cashier') return 'レジ担当';
  if (role === 'pickup-operator') return '受取・引渡担当';
  if (role === 'delivery-supervisor') return '配送責任者';
  if (role === 'field-admin') return '現地管理者';
  return fallback || role;
}

function posStaffScopeLabel(language: string, role: PosStaffRole, fallback: string) {
  if (!isJapanesePosLanguage(language)) return fallback;
  if (role === 'cashier') return '店頭スキャン、秘匿レシート印刷、通常商品の引き渡しを担当します。';
  if (role === 'pickup-operator') return 'QR/NFC受付、AGID-S復号、通常の配送引き渡しを担当します。';
  if (role === 'delivery-supervisor') return '例外確認、責任者承認、再照合レポート出力を担当します。';
  if (role === 'field-admin') return '人道支援や移動拠点向けに、端末運用全体を管理します。';
  return fallback;
}

function posPermissionLabel(language: string, permission: string) {
  if (!isJapanesePosLanguage(language)) {
    return permission.replace(/-/g, ' ');
  }
  const labels: Record<string, string> = {
    'scan-pos-payload': 'QR/NFC/バーコード読取',
    'decrypt-agid-s': 'AGID-S復号',
    'accept-handoff': '引き渡し完了',
    'reject-release': '引き渡し拒否',
    'override-review': '要確認の上書き',
    'view-exception-audit': '監査ケース閲覧',
    'run-device-diagnostics': '端末診断',
    'print-redacted-receipt': '秘匿レシート印刷',
    'open-cash-drawer': 'ドロワー開放',
    'pair-barcode-reader': 'リーダー接続',
    'pair-measuring-instrument': '計測器接続',
    'export-reverification-report': '再照合レポート出力',
  };
  return labels[permission] || permission;
}

function posDeviceLabel(language: string, device: PosDeviceDiagnostic) {
  if (!isJapanesePosLanguage(language)) return device.label;
  if (device.kind === 'receipt-printer') return 'レシートプリンタ';
  if (device.kind === 'cash-drawer') return 'キャッシュドロワー';
  if (device.kind === 'barcode-reader') return 'バーコードリーダー';
  if (device.kind === 'measurement-instrument') return '電子計測器';
  return device.label;
}

function posDeviceAction(language: string, device: PosDeviceDiagnostic) {
  if (!isJapanesePosLanguage(language)) return device.operatorAction;
  if (device.kind === 'receipt-printer') {
    return device.status === 'ready'
      ? '秘匿レシートを印刷できます。紙には実住所を出さない運用を維持してください。'
      : 'WebSerial/WebUSBプリンタまたはネイティブPOSコネクタを接続してください。';
  }
  if (device.kind === 'cash-drawer') {
    return device.status === 'ready'
      ? 'ドロワー操作をレシートID付きで監査できます。'
      : '現金取引前に責任者承認またはドロワーリレー接続を確認してください。';
  }
  if (device.kind === 'barcode-reader') {
    return device.status === 'ready'
      ? 'キーボードウェッジ型リーダーを手入力欄へ流し込めます。'
      : 'キーボードウェッジを有効化するかWebHIDリーダーを接続してください。';
  }
  if (device.kind === 'measurement-instrument') {
    return device.status === 'ready'
      ? '重量、寸法、温度、計測値を受取人の秘密を保存せずに記録できます。'
      : '手入力またはネイティブコネクタで計測値を登録してください。';
  }
  return device.operatorAction;
}

function posEvidenceToken(language: string, value: string) {
  if (!isJapanesePosLanguage(language)) return value;
  const labels: Record<string, string> = {
    'native-connector': 'ネイティブ接続',
    'browser-connector': 'ブラウザ接続',
    'web-serial': 'WebSerial',
    'serial-not-paired': 'Serial未接続',
    'web-usb': 'WebUSB',
    'usb-not-paired': 'USB未接続',
    'no-native-connector': 'ネイティブ未接続',
    'drawer-relay-configured': 'ドロワーリレー設定済み',
    'drawer-relay-missing': 'ドロワーリレー未設定',
    'keyboard-wedge-supported': 'キーボード入力対応',
    'keyboard-wedge-disabled': 'キーボード入力無効',
    'web-hid': 'WebHID',
    'web-hid-not-paired': 'WebHID未接続',
    'browser-or-manual': 'ブラウザ/手入力',
    'measurement-profile-configured': '計測プロファイル設定済み',
    'measurement-profile-missing': '計測プロファイル未設定',
    'web-serial-measurement': 'Serial計測',
    'serial-measurement-not-paired': 'Serial計測未接続',
    'web-hid-measurement': 'HID計測',
    'hid-measurement-not-paired': 'HID計測未接続',
    'web-usb-measurement': 'USB計測',
    'usb-measurement-not-paired': 'USB計測未接続',
    'manual-entry': '手入力',
  };
  return labels[value] || value;
}

function evidenceValue(value: string | boolean | undefined, language = 'en') {
  if (typeof value === 'boolean') return value ? posInlineCopy(language, 'yes', 'はい') : posInlineCopy(language, 'no', 'いいえ');
  return value && value.trim() ? value : posInlineCopy(language, 'not captured', '未取得');
}

function posSyncStateLabel(language: string, state: 'idle' | 'loading' | 'error') {
  if (!isJapanesePosLanguage(language)) return state;
  return {
    idle: '待機',
    loading: '同期中',
    error: 'エラー',
  }[state];
}

function posNfcStateLabel(language: string, state: 'idle' | 'waiting' | 'unsupported' | 'error') {
  if (!isJapanesePosLanguage(language)) return state;
  return {
    idle: '待機',
    waiting: 'タグ待機中',
    unsupported: '未対応',
    error: '読み取りエラー',
  }[state];
}

function posRiskLevelLabel(language: string, risk: ShippingLabelRiskLevel) {
  if (!isJapanesePosLanguage(language)) return risk === 'high' ? 'High' : 'Std';
  return risk === 'high' ? '高リスク' : '標準';
}

function posShippingScanRoleLabel(language: string, role: ShippingLabelScanRole) {
  if (!isJapanesePosLanguage(language)) return role === 'carrier' ? 'Carrier' : 'Recipient';
  return role === 'carrier' ? '配送業者' : '受取人';
}

function posRecipientProofMethodLabel(method: ShippingLabelRecipientProofMethod, language = 'en') {
  if (!isJapanesePosLanguage(language)) {
    return POS_RECIPIENT_PROOF_METHODS.find(item => item.id === method)?.label ?? method;
  }
  return {
    'recipient-secret-commitment': 'コード',
    'passkey-webauthn': 'Passkey',
    'aoid-credential': 'AOID',
    'nfc-card': 'NFC',
  }[method];
}

function posRecipientProofMethodDetail(method: ShippingLabelRecipientProofMethod, language = 'en') {
  if (!isJapanesePosLanguage(language)) {
    return POS_RECIPIENT_PROOF_METHODS.find(item => item.id === method)?.detail ?? method;
  }
  return {
    'recipient-secret-commitment': 'ワンタイム秘密',
    'passkey-webauthn': 'WebAuthn証跡',
    'aoid-credential': '資格証明',
    'nfc-card': 'カード秘密',
  }[method];
}

function posEvidenceStateLabel(language: string, state: string) {
  if (!isJapanesePosLanguage(language)) return state;
  const labels: Record<string, string> = {
    pass: '合格',
    warn: '注意',
    fail: '失敗',
    missing: '不足',
    ok: 'OK',
    pending: '保留',
    required: '必須',
    optional: '任意',
    present: 'あり',
    accepted: '受理',
    review: '要確認',
    rejected: '拒否',
    cleared: '解消',
    attention: '注意',
    blocked: 'ブロック',
    fresh: '鮮度OK',
    stale: '要更新',
  };
  return labels[state] || state;
}

function posKeyStatusLabel(language: string, status: PosSecureKeyEntry['status']) {
  if (!isJapanesePosLanguage(language)) return status;
  return {
    active: '有効',
    retiring: '移行中',
    revoked: '失効',
  }[status];
}

function posSecureKeyDisplayLabel(language: string, key: PosSecureKeyEntry) {
  const label = key.label || key.keyId;
  if (!isJapanesePosLanguage(language)) return label;
  const recipientMatch = label.match(/^Recipient\s+(\d+)(?:\s+rotated)?$/i);
  if (recipientMatch) {
    const suffix = /rotated$/i.test(label) ? ' ローテーション済み' : '';
    return `受取人 ${recipientMatch[1]}${suffix}`;
  }
  return label;
}

function posSecureOpenPreviewMessage(language: string, message: string) {
  if (!isJapanesePosLanguage(language)) return message;
  if (message === 'AGID-S ready') return 'AGID-S準備完了';
  const generated = message.match(/^Generated\s+(.+)$/);
  if (generated) return `${generated[1]} を生成しました`;
  const rotated = message.match(/^Rotated\s+(.+)$/);
  if (rotated) return `${rotated[1]} をローテーションしました`;
  return message;
}

function posPreviewStatusLabel(language: string, status?: PosAcceptanceReceipt['status']) {
  return posReceiptStatusLabel(language, status);
}


export const PosWorkflowRail: React.FC<{
  active: PosWorkspaceId;
  items: Array<{
    id: PosWorkspaceId;
    label: string;
    detail: string;
    count?: number;
    countLabel?: string;
    tone?: 'normal' | 'warning' | 'danger' | 'ok';
    primary?: boolean;
    step?: number;
  }>;
  primaryLabel?: string;
  supportLabel?: string;
  onChange: (id: PosWorkspaceId) => void;
}> = ({
  active,
  items,
  primaryLabel = 'Primary flow',
  supportLabel = 'Operations',
  onChange,
}) => {
  const primaryItems = POS_FIXED_PRIMARY_FLOW
    .map(id => items.find(item => item.id === id))
    .filter((item): item is typeof items[number] => Boolean(item));
  const supportItems = items.filter(item => !POS_FIXED_PRIMARY_FLOW.includes(item.id));
  const fixedFlowLabel = primaryItems.map(item => item.label).join(' -> ');
  const renderItem = (item: typeof items[number], compact = false) => {
    const countText = item.countLabel || String(item.count ?? '');
    const showCount = typeof item.count === 'number' && item.count > 0;
    const isActive = active === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onChange(item.id)}
        className={cn(
          'group grid min-w-0 items-stretch rounded-md border text-left transition-colors active:scale-[0.98]',
          compact
            ? 'h-[58px] grid-rows-[24px_minmax(0,1fr)] px-2.5 py-1.5'
            : 'h-[82px] grid-rows-[34px_minmax(0,1fr)] px-3 py-2.5',
          isActive
            ? 'border-slate-950 bg-slate-950 text-white shadow-md'
            : item.primary
              ? 'border-blue-100 bg-blue-50/70 text-slate-800 hover:border-blue-200 hover:bg-white'
              : 'border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white',
        )}
      >
        <span className={cn('flex w-full items-center justify-between gap-2', compact ? 'h-6' : 'h-8')}>
          <span className={cn(
            'flex shrink-0 items-center justify-center rounded-md font-black tabular-nums',
            compact ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
            isActive ? 'bg-white/10 text-white' : item.primary ? 'bg-white text-blue-700 shadow-sm' : 'bg-white text-slate-600 shadow-sm',
          )}>
            {item.primary && item.step ? (
              <span>{item.step}</span>
            ) : (
              WORKSPACE_ICONS[item.id]
            )}
          </span>
          <span className="min-w-0 flex-1 truncate font-black leading-tight">
            {item.label}
          </span>
          {showCount && (
            <span className={cn(
              'inline-flex max-w-[64px] shrink-0 items-center justify-center truncate rounded px-1.5 text-center font-black tabular-nums',
              compact ? 'h-5 text-[9px]' : 'h-6 text-[10px]',
              isActive && 'bg-white/15 text-white',
              !isActive && item.tone === 'danger' && 'bg-rose-100 text-rose-700',
              !isActive && item.tone === 'warning' && 'bg-amber-100 text-amber-700',
              !isActive && item.tone === 'ok' && 'bg-emerald-100 text-emerald-700',
              !isActive && (!item.tone || item.tone === 'normal') && 'bg-slate-200 text-slate-700',
            )}>
              {countText}
            </span>
          )}
        </span>
        <span className="min-w-0 self-end overflow-hidden">
          <span className={cn(
            'block h-4 truncate font-black uppercase leading-4 tracking-widest',
            compact ? 'text-[9px]' : 'text-[10px]',
            isActive ? 'text-white/55' : item.tone === 'danger' ? 'text-rose-500' : item.tone === 'warning' ? 'text-amber-600' : item.tone === 'ok' ? 'text-emerald-600' : 'text-slate-400',
          )}>
            {item.detail}
          </span>
        </span>
      </button>
    );
  };

  return (
    <nav className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-24">
      <div className="mb-2">
        <div className="mb-2 flex min-w-0 flex-col gap-1 px-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {primaryLabel}
          </p>
          <p className="truncate text-[10px] font-black uppercase tracking-widest text-blue-600" aria-label="Scan -> Decision -> Handoff -> Receipt">
            {fixedFlowLabel}
          </p>
        </div>
        <div className="grid auto-rows-[82px] grid-cols-2 gap-2 lg:grid-cols-1">
          {primaryItems.map(item => renderItem(item))}
        </div>
      </div>
      <div className="border-t border-slate-100 pt-2">
        <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
          {supportLabel}
        </p>
        <div className="grid auto-rows-[58px] grid-cols-3 gap-2 lg:grid-cols-1">
          {supportItems.map(item => renderItem(item, true))}
        </div>
      </div>
    </nav>
  );
};

export const PosDecisionBanner: React.FC<{
  terminalId: string;
  scannerMessage: string;
  mode: PosAcceptanceChannel;
  latestReceipt: PosAcceptanceReceipt | null;
  preview: PosPreview | null;
  handoffReport?: PosHandoffReverificationReport;
  registry: PosAgidSecureRegistryStatus | null;
  syncState: 'idle' | 'loading' | 'error';
  language?: string;
}> = ({ terminalId, scannerMessage, mode, latestReceipt, preview, handoffReport, registry, syncState, language = 'en' }) => {
  const registryFresh = registry?.freshUntil ? Date.parse(registry.freshUntil) > Date.now() : false;
  const currentStatus = latestReceipt?.status;
  const waybillProgress = mergeWaybillProgressSource(
    latestReceipt?.shippingLabel ?? preview?.shippingLabel,
    handoffReport,
  );
  const decisionReasons = buildPosDecisionReasonItems(language, latestReceipt, preview, handoffReport);
  const issues = [
    ...(latestReceipt?.errors ?? []),
    ...(latestReceipt?.warnings ?? []),
    ...(preview?.errors ?? []),
    ...(preview?.warnings ?? []),
  ].slice(0, 3);

  return (
    <section className={cn('rounded-lg border p-4 shadow-sm', decisionClasses(currentStatus, preview))}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/70 shadow-sm">
            {statusIcon(currentStatus ?? preview?.status)}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {terminalId} / {mode.toUpperCase()} / {scannerMessage}
            </p>
            <h2 className="mt-1 truncate text-2xl font-black tracking-tight">
              {statusLabel(currentStatus, preview, language)}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
          <div className="rounded-md bg-white/65 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{posMainCopy(language, 'registry')}</p>
            <p className="mt-1 text-xs font-black">{registryFresh ? posMainCopy(language, 'fresh') : posMainCopy(language, 'check')}</p>
          </div>
          <div className="rounded-md bg-white/65 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{posMainCopy(language, 'sync')}</p>
            <p className="mt-1 text-xs font-black">{syncState === 'loading' ? posMainCopy(language, 'loading') : syncState === 'error' ? posMainCopy(language, 'retry') : posMainCopy(language, 'ready')}</p>
          </div>
          <div className="rounded-md bg-white/65 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{posMainCopy(language, 'receipt')}</p>
            <p className="mt-1 truncate text-xs font-black">{latestReceipt?.receiptId ?? posMainCopy(language, 'none')}</p>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <PosWaybillProgressBoard source={waybillProgress} language={language} />
      </div>
      {decisionReasons.length > 0 && (
        <div className="mt-4">
          <PosDecisionReasonPanel reasons={decisionReasons} language={language} />
        </div>
      )}
      {issues.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {issues.map((issue) => (
            <span key={issue} className="rounded bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-widest opacity-75">
              {posGeneratedText(language, issue)}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

export const PosManagementConsolePanel: React.FC<{
  snapshot: PosManagementSnapshot;
  designReview: PosDesignReviewSummary;
  fleetSnapshot?: AddressTerminalFleetSnapshot;
  language?: string;
  onGoWorkspace: (workspace: PosWorkspaceId) => void;
  onRefreshRegistry: () => void;
  onRunDiagnostics: () => void;
  onSyncQueue: () => void;
  onExportSnapshot: () => void;
  onPrintSnapshot: () => void;
}> = ({
  snapshot,
  designReview,
  fleetSnapshot,
  language = 'en',
  onGoWorkspace,
  onRefreshRegistry,
  onRunDiagnostics,
  onSyncQueue,
  onExportSnapshot,
  onPrintSnapshot,
}) => {
  const primaryRisk = snapshot.risks[0];
  const criticalCount = snapshot.risks.filter((risk) => risk.severity === 'critical').length;
  const warningCount = snapshot.risks.filter((risk) => risk.severity === 'warning').length;

  return (
    <section className="space-y-4">
      <div className={cn('rounded-lg border p-4 shadow-sm', managementGradeClasses(snapshot.grade))}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/70 shadow-sm">
              {snapshot.grade === 'ready'
                ? <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                : snapshot.grade === 'attention'
                  ? <AlertTriangle className="h-6 w-6 text-amber-600" />
                  : <StopCircle className="h-6 w-6 text-rose-600" />}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {posMainCopy(language, 'admin')} / {snapshot.terminalId} / {snapshot.snapshotId}
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-tight">
                {snapshot.grade === 'ready'
                  ? posMainCopy(language, 'managementReady')
                  : snapshot.grade === 'attention'
                    ? posMainCopy(language, 'managementAttention')
                    : posMainCopy(language, 'releaseBlocked')}
              </h3>
              <p className="mt-1 max-w-2xl text-xs font-bold leading-5 opacity-75">{posGeneratedText(language, snapshot.summary)}</p>
            </div>
          </div>
          <div className="grid min-w-[260px] grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-white/65 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{posMainCopy(language, 'critical')}</p>
              <p className="mt-1 text-lg font-black">{criticalCount}</p>
            </div>
            <div className="rounded-md bg-white/65 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{posMainCopy(language, 'warnings')}</p>
              <p className="mt-1 text-lg font-black">{warningCount}</p>
            </div>
            <div className="rounded-md bg-white/65 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{posMainCopy(language, 'generated')}</p>
              <p className="mt-1 text-xs font-black">{compactTime(snapshot.generatedAt, language)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {snapshot.metrics.map((metric) => (
          <div key={metric.label} className={cn('rounded-lg border p-3 shadow-sm', managementMetricClasses(metric.tone))}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{posManagementMetricLabel(language, metric.label)}</p>
            <p className="mt-2 truncate text-2xl font-black">{posGeneratedText(language, metric.value)}</p>
            <p className="mt-1 text-xs font-bold leading-5 opacity-75">{posGeneratedText(language, metric.detail)}</p>
          </div>
        ))}
      </div>

      {fleetSnapshot && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {posInlineCopy(language, 'POS Terminal Management', 'POS端末管理')}
              </p>
              <h3 className="mt-1 text-xl font-black text-slate-950">
                {posInlineCopy(language, 'Fleet posture, staff scope, and device readiness', '端末状態・スタッフ権限・周辺機器準備')}
              </h3>
              <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-slate-500">
                {posInlineCopy(
                  language,
                  'This view stores device telemetry and redacted operational state only. Raw address, AGID, AOID, waybill, and proof payloads stay outside the fleet console.',
                  'この画面は端末テレメトリと秘匿化された運用状態だけを扱います。実住所、AGID、AOID、送り状、proof本文は端末管理画面に保存しません。',
                )}
              </p>
            </div>
            <div className="grid min-w-[260px] grid-cols-4 gap-2 text-center">
              {[
                { label: posInlineCopy(language, 'Ready', '準備完了'), value: fleetSnapshot.totals.ready, tone: 'text-emerald-700' },
                { label: posInlineCopy(language, 'Attention', '要確認'), value: fleetSnapshot.totals.attention, tone: 'text-amber-700' },
                { label: posInlineCopy(language, 'Blocked', '停止'), value: fleetSnapshot.totals.blocked, tone: 'text-rose-700' },
                { label: posInlineCopy(language, 'Queued', 'キュー'), value: fleetSnapshot.totals.pendingOfflineItems, tone: 'text-slate-700' },
              ].map((item) => (
                <div key={item.label} className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className={cn('mt-1 text-lg font-black', item.tone)}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {fleetSnapshot.terminals.map((terminal) => {
              const readyDevices = terminal.devices.filter((device) => device.status === 'ready').length;
              return (
                <div key={terminal.terminalId} className={cn('rounded-lg border p-4', terminalGradeClasses(terminal.grade))}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{terminal.siteId}</p>
                      <h4 className="mt-1 truncate text-lg font-black">{terminal.label}</h4>
                      <p className="mt-1 truncate text-xs font-bold opacity-70">{terminal.terminalId}</p>
                    </div>
                    <span className="w-fit rounded bg-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-widest">
                      {terminalGradeLabel(language, terminal.grade)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    <div className="rounded-md bg-white/70 px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{posInlineCopy(language, 'Role', '役割')}</p>
                      <p className="mt-1 truncate text-xs font-black">{posStaffRoleLabel(language, terminal.staff.role, terminal.staff.label)}</p>
                    </div>
                    <div className="rounded-md bg-white/70 px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{posInlineCopy(language, 'Devices', '機器')}</p>
                      <p className="mt-1 text-xs font-black">{readyDevices}/{terminal.devices.length}</p>
                    </div>
                    <div className="rounded-md bg-white/70 px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{posInlineCopy(language, 'Sync', '同期')}</p>
                      <p className="mt-1 truncate text-xs font-black">{terminalSyncLabel(language, terminal.syncState)}</p>
                    </div>
                    <div className="rounded-md bg-white/70 px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{posInlineCopy(language, 'Last seen', '最終確認')}</p>
                      <p className="mt-1 truncate text-xs font-black">{compactTime(terminal.lastSeenAt, language)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {terminal.attention.length === 0 ? (
                      <span className="rounded bg-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-widest opacity-70">
                        {posInlineCopy(language, 'No attention items', '要確認なし')}
                      </span>
                    ) : terminal.attention.slice(0, 6).map((item) => (
                      <span key={item} className="rounded bg-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-widest opacity-70">
                        {terminalAttentionLabel(language, item)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      { label: posInlineCopy(language, 'Diagnostics', '端末診断'), workspace: 'devices' as const, icon: <Activity className="h-4 w-4" /> },
                      { label: posInlineCopy(language, 'Staff', 'スタッフ'), workspace: 'staff' as const, icon: <Users className="h-4 w-4" /> },
                      { label: posInlineCopy(language, 'Settings', '設定'), workspace: 'settings' as const, icon: <Settings2 className="h-4 w-4" /> },
                    ].map((item) => (
                      <button
                        key={item.workspace}
                        type="button"
                        onClick={() => onGoWorkspace(item.workspace)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white/80 px-3 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-white"
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onGoWorkspace('design')}
        className={cn(
          'grid w-full gap-3 rounded-lg border p-4 text-left shadow-sm transition-all hover:scale-[1.002] lg:grid-cols-[minmax(0,1fr)_240px]',
          designGradeClasses(designReview.grade),
        )}
      >
        <span className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
            {posMainCopy(language, 'designReview')} / {designReview.highestPriority} / {posMainCopy(language, 'score')} {designReview.score}
          </span>
          <span className="mt-1 block text-xl font-black tracking-tight">
            {designReview.items[0]?.title
              ? posGeneratedText(language, designReview.items[0].title)
              : posMainCopy(language, 'designPostureReady')}
          </span>
          <span className="mt-1 block text-xs font-bold leading-5 opacity-75">
            {posGeneratedText(language, designReview.headline)}
          </span>
        </span>
        <span className="grid grid-cols-4 gap-2 text-center">
          {(['P0', 'P1', 'P2', 'P3'] as const).map((priority) => (
            <span key={priority} className="rounded-md bg-white/65 px-2 py-2">
              <span className="block text-[9px] font-black uppercase tracking-widest opacity-50">{priority}</span>
              <span className="mt-1 block text-lg font-black">{designReview.counts[priority]}</span>
            </span>
          ))}
        </span>
      </button>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posMainCopy(language, 'riskQueue')}</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">
                {primaryRisk ? posGeneratedText(language, primaryRisk.label) : posMainCopy(language, 'noManagementRisks')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onPrintSnapshot}
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-700"
              >
                <Printer className="h-4 w-4" />
                {posMainCopy(language, 'print')}
              </button>
              <button
                type="button"
                onClick={onExportSnapshot}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                {posMainCopy(language, 'export')}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {snapshot.risks.length === 0 && (
              <p className="rounded-md bg-slate-50 p-3 text-xs font-bold text-slate-500">
                {posMainCopy(language, 'managementClean')}
              </p>
            )}
            {snapshot.risks.map((risk) => (
              <button
                key={risk.id}
                type="button"
                onClick={() => onGoWorkspace(risk.workspace)}
                className={cn('block w-full rounded-md border p-3 text-left transition-all hover:scale-[1.005]', managementRiskClasses(risk.severity))}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{posGeneratedText(language, risk.label)}</p>
                    <p className="mt-1 text-xs font-bold leading-5 opacity-75">{posGeneratedText(language, risk.detail)}</p>
                  </div>
                  <span className="w-fit rounded bg-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-widest">
                    {posGeneratedText(language, risk.severity)}
                  </span>
                </div>
                <p className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                  {posGeneratedText(language, risk.action)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posMainCopy(language, 'adminActions')}</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{posMainCopy(language, 'operateTerminal')}</h3>
          </div>
          <div className="grid gap-2">
            {[
              { label: posMainCopy(language, 'scanIntake'), detail: posMainCopy(language, 'scanIntakeDetail'), icon: <ScanLine className="h-4 w-4" />, action: () => onGoWorkspace('scan') },
              { label: posMainCopy(language, 'refreshRegistry'), detail: posMainCopy(language, 'refreshRegistryDetail'), icon: <RefreshCw className="h-4 w-4" />, action: onRefreshRegistry },
              { label: posMainCopy(language, 'runDiagnostics'), detail: posMainCopy(language, 'runDiagnosticsDetail'), icon: <Activity className="h-4 w-4" />, action: onRunDiagnostics },
              { label: posMainCopy(language, 'syncQueue'), detail: posMainCopy(language, 'syncQueueDetail'), icon: <Network className="h-4 w-4" />, action: onSyncQueue },
              { label: posMainCopy(language, 'reviewAudit'), detail: posMainCopy(language, 'reviewAuditDetail'), icon: <ClipboardList className="h-4 w-4" />, action: () => onGoWorkspace('audit') },
              { label: posMainCopy(language, 'designReviewAction'), detail: posMainCopy(language, 'designReviewDetail'), icon: <Gauge className="h-4 w-4" />, action: () => onGoWorkspace('design') },
              { label: posMainCopy(language, 'keyControl'), detail: posMainCopy(language, 'keyControlDetail'), icon: <KeyRound className="h-4 w-4" />, action: () => onGoWorkspace('keys') },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="grid grid-cols-[34px_minmax(0,1fr)] items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-left transition-colors hover:border-slate-200 hover:bg-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm">
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-black text-slate-800">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-500">{item.detail}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const PosDesignReviewPanel: React.FC<{
  review: PosDesignReviewSummary;
  language?: string;
  onGoWorkspace: (workspace: PosWorkspaceId) => void;
}> = ({ review, language = 'en', onGoWorkspace }) => {
  const topItem = review.items[0];
  const focusRows = (Object.entries(review.focusCounts) as Array<[keyof PosDesignReviewSummary['focusCounts'], number]>)
    .filter(([, count]) => count > 0);

  return (
    <section className="space-y-4">
      <div className={cn('rounded-lg border p-4 shadow-sm', designGradeClasses(review.grade))}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/70 shadow-sm">
              {review.grade === 'ready'
                ? <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                : review.grade === 'attention'
                  ? <Gauge className="h-6 w-6 text-blue-700" />
                  : <StopCircle className="h-6 w-6 text-rose-600" />}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {posMainCopy(language, 'designReview')} / {posMainCopy(language, 'score')} {review.score} / {review.highestPriority}
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-tight">
                {topItem?.title ? posGeneratedText(language, topItem.title) : posMainCopy(language, 'designPostureReady')}
              </h3>
              <p className="mt-1 max-w-3xl text-xs font-bold leading-5 opacity-75">{posGeneratedText(language, review.headline)}</p>
            </div>
          </div>
          <div className="grid min-w-[280px] grid-cols-4 gap-2 text-center">
            {(['P0', 'P1', 'P2', 'P3'] as const).map((priority) => (
              <div key={priority} className="rounded-md bg-white/65 px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{priority}</p>
                <p className="mt-1 text-lg font-black">{review.counts[priority]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {posInlineCopy(language, 'Priority Queue', '優先キュー')}
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-950">
              {posInlineCopy(language, 'Weak points to improve first', '先に改善する弱点')}
            </h3>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              {posInlineCopy(
                language,
                'P0 blocks release, P1 improves scan-to-decision clarity, P2 improves speed and confidence, P3 preserves polish.',
                'P0は引き渡し停止、P1はスキャンから判定までの明瞭性、P2は速度と安心感、P3は仕上げを改善します。',
              )}
            </p>
          </div>
          <div className="space-y-3">
            {review.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onGoWorkspace(item.workspace === 'design' ? 'admin' : item.workspace)}
                className={cn('w-full rounded-lg border p-4 text-left transition-all hover:scale-[1.003]', designPriorityClasses(item.priority))}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('rounded px-2 py-1 text-[10px] font-black uppercase tracking-widest', designPriorityBadgeClasses(item.priority))}>
                        {item.priority}
                      </span>
                      <span className="rounded bg-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-widest opacity-70">
                        {designFocusLabel(item.focus, language)}
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-black">{posGeneratedText(language, item.title)}</h4>
                    <p className="mt-1 text-xs font-bold leading-5 opacity-75">{posGeneratedText(language, item.weakness)}</p>
                  </div>
                  <span className="w-fit rounded bg-white/75 px-2 py-1 text-[9px] font-black uppercase tracking-widest">
                    {posInlineCopy(language, 'Open', '開く')} {posGeneratedText(language, item.workspace)}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  <p className="rounded-md bg-white/55 p-3 text-[11px] font-bold leading-5">
                    <span className="block text-[9px] font-black uppercase tracking-widest opacity-55">
                      {posInlineCopy(language, 'Evidence', '根拠')}
                    </span>
                    {posGeneratedText(language, item.evidence)}
                  </p>
                  <p className="rounded-md bg-white/55 p-3 text-[11px] font-bold leading-5">
                    <span className="block text-[9px] font-black uppercase tracking-widest opacity-55">
                      {posInlineCopy(language, 'Next design fix', '次のデザイン修正')}
                    </span>
                    {posGeneratedText(language, item.action)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {posInlineCopy(language, 'Focus Balance', '改善領域のバランス')}
              </p>
              <h3 className="mt-1 text-xl font-black text-slate-950">
                {posInlineCopy(language, 'Where the design is weak', '弱い設計領域')}
              </h3>
            </div>
            <div className="space-y-2">
              {focusRows.map(([focus, count]) => (
                <div key={focus} className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-3 rounded-md border border-slate-100 bg-slate-50 p-3">
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black text-slate-800">{designFocusLabel(focus, language)}</span>
                    <span className="mt-0.5 block text-[10px] font-bold text-slate-500">
                      {isJapanesePosLanguage(language)
                        ? `${count}件のレビュー項目`
                        : count === 1 ? '1 review item' : `${count} review items`}
                    </span>
                  </span>
                  <span className="rounded-md bg-white px-2 py-1 text-center text-sm font-black text-slate-800">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {posInlineCopy(language, 'Design rule', 'デザイン原則')}
                </p>
                <h4 className="mt-1 text-base font-black text-slate-950">
                  {posInlineCopy(language, 'Make unsafe states louder than happy states', '安全でない状態を正常状態より強く見せる')}
                </h4>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  {posInlineCopy(
                    language,
                    'The POS surface is for repeated handoff work. Improvements should reduce ambiguity at the moment of scan, make trust state visible without hunting, and keep privacy controls active in high-risk modes.',
                    'POS画面は反復的な引き渡し作業のためのものです。改善では、スキャン時の曖昧さを減らし、信頼状態を探さず見えるようにし、高リスクモードでプライバシー制御を常時有効にします。',
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const PosTrustStatePanel: React.FC<{
  registry: PosAgidSecureRegistryStatus | null;
  runtimePolicy?: PosRuntimePolicy;
  receipt: PosAcceptanceReceipt | null;
  preview: PosPreview | null;
  syncState: 'idle' | 'loading' | 'error';
  language?: string;
  onRefreshRegistry: () => void;
}> = ({ registry, runtimePolicy, receipt, preview, syncState, language = 'en', onRefreshRegistry }) => {
  const registryFresh = registry?.freshUntil ? Date.parse(registry.freshUntil) > Date.now() : false;
  const checks = [
    {
      label: posMainCopy(language, 'issuerRegistry'),
      value: registry?.registryId || posMainCopy(language, 'localRegistry'),
      state: registryFresh ? posMainCopy(language, 'fresh') : posMainCopy(language, 'retryNeeded'),
      tone: registryFresh ? 'ok' : 'warning',
      icon: <Server className="h-4 w-4" />,
    },
    {
      label: posMainCopy(language, 'usedNullifier'),
      value: `${registry?.usedCount ?? 0} ${posMainCopy(language, 'used')}`,
      state: receipt?.accepted ? posMainCopy(language, 'markedAfterAccept') : posMainCopy(language, 'pending'),
      tone: receipt?.accepted ? 'ok' : 'normal',
      icon: <DatabaseZap className="h-4 w-4" />,
    },
    {
      label: posMainCopy(language, 'freshnessWindow'),
      value: compactTime(registry?.freshUntil, language),
      state: registryFresh ? posMainCopy(language, 'validWindow') : posMainCopy(language, 'staleOrLocal'),
      tone: registryFresh ? 'ok' : 'warning',
      icon: <Clock3 className="h-4 w-4" />,
    },
    {
      label: posMainCopy(language, 'payloadPrivacy'),
      value: preview?.record?.rawPayloadStored === false || receipt?.record?.rawPayloadStored === false ? posMainCopy(language, 'redactedReceipt') : posMainCopy(language, 'noRecordYet'),
      state: posMainCopy(language, 'rawPayloadNoStore'),
      tone: 'ok',
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      label: posMainCopy(language, 'serverSync'),
      value: syncState === 'loading' ? posMainCopy(language, 'syncing') : syncState === 'error' ? posMainCopy(language, 'retryNeeded') : posMainCopy(language, 'ready'),
      state: syncState === 'error' ? posMainCopy(language, 'recentSyncFailed') : posMainCopy(language, 'receiptCache'),
      tone: syncState === 'error' ? 'danger' : 'ok',
      icon: <Network className="h-4 w-4" />,
    },
  ] as const;

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posMainCopy(language, 'trustState')}</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">{posMainCopy(language, 'registryReceiptPosture')}</h3>
        </div>
        <button
          type="button"
          onClick={onRefreshRegistry}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-all hover:bg-slate-50"
          title={posMainCopy(language, 'refreshRegistry')}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
            <span className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              check.tone === 'ok' && 'bg-emerald-100 text-emerald-700',
              check.tone === 'warning' && 'bg-amber-100 text-amber-700',
              check.tone === 'danger' && 'bg-rose-100 text-rose-700',
              check.tone === 'normal' && 'bg-white text-slate-500',
            )}>
              {check.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-black text-slate-800">{check.label}</span>
              <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-500">{check.value}</span>
            </span>
            <span className="rounded bg-white px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
              {check.state}
            </span>
          </div>
        ))}
      </div>
      {runtimePolicy && (
        <div className="mt-3 rounded-md border border-sky-100 bg-sky-50 p-3 text-xs font-bold leading-5 text-sky-900">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-700">
            <Gauge className="h-4 w-4" />
            {posMainCopy(language, 'runtimeSplit')}
          </div>
          {runtimePolicy.rule}
        </div>
      )}
    </aside>
  );
};

export const PosOperatorActionPanel: React.FC<{
  receipt: PosAcceptanceReceipt | null;
  preview: PosPreview | null;
  language?: string;
  onGoScan: () => void;
  onGoHandoff: () => void;
  onGoRegistry: () => void;
}> = ({ receipt, preview, language = 'en', onGoScan, onGoHandoff, onGoRegistry }) => {
  const accepted = receipt?.accepted || preview?.accepted;
  const rejected = receipt?.status === 'rejected' || preview?.status === 'rejected';
  const review = receipt?.status === 'review' || preview?.status === 'review';
  const decisionReasons = buildPosDecisionReasonItems(language, receipt, preview);
  const steps = [
    {
      label: posMainCopy(language, 'readPayload'),
      detail: preview || receipt ? posMainCopy(language, 'payloadParsed') : posMainCopy(language, 'waitingForOperatorInput'),
      done: Boolean(preview || receipt),
    },
    {
      label: posMainCopy(language, 'openAgidS'),
      detail: posMainCopy(language, 'terminalKeyRegistryVerify'),
      done: Boolean(receipt?.record) || Boolean(preview?.record),
    },
    {
      label: posMainCopy(language, 'checkIssuerFreshnessRevocationUsedState'),
      detail: posMainCopy(language, 'mode1ServerRegistryLocalFallback'),
      done: Boolean(receipt),
    },
    {
      label: posMainCopy(language, 'issueRedactedReceipt'),
      detail: posMainCopy(language, 'storesTailsCoarseMetadata'),
      done: Boolean(receipt),
    },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posMainCopy(language, 'decisionWorkbench')}</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            {accepted
              ? posMainCopy(language, 'readyForHandoff')
              : rejected
                ? posMainCopy(language, 'doNotReleaseItem')
                : review
                  ? posMainCopy(language, 'supervisorReview')
                  : posMainCopy(language, 'noActiveDecision')}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onGoScan}
            className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-700"
          >
            <ScanLine className="h-4 w-4" />
            {posMainCopy(language, 'scan')}
          </button>
          <button
            type="button"
            onClick={onGoHandoff}
            disabled={!accepted}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PackageCheck className="h-4 w-4" />
            {posInlineCopy(language, 'Handoff', '引き渡し')}
          </button>
          <button
            type="button"
            onClick={onGoRegistry}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
          >
            <Server className="h-4 w-4" />
            {posMainCopy(language, 'registry')}
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {steps.map((step, index) => (
          <div key={step.label} className="rounded-md border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <span className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-black',
                step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-400',
              )}>
                {step.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </span>
              <span>
                <span className="block text-sm font-black text-slate-900">{step.label}</span>
                <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{step.detail}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
      {receipt && (
        <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-3">
          <p className="rounded-md bg-slate-50 px-3 py-2">{posInlineCopy(language, 'Receipt', 'レシート')}: <span className="font-black text-slate-900">{receipt.receiptId}</span></p>
          <p className="rounded-md bg-slate-50 px-3 py-2">{posInlineCopy(language, 'Channel', '受付経路')}: <span className="font-black uppercase text-slate-900">{receipt.channel}</span></p>
          <p className="rounded-md bg-slate-50 px-3 py-2">{posInlineCopy(language, 'Record', '記録')}: <span className="font-black text-slate-900">{receipt.record?.label ?? posMainCopy(language, 'none')}</span></p>
        </div>
      )}
      <div className="mt-3">
        <PosDecisionReasonPanel reasons={decisionReasons} language={language} compact />
      </div>
    </section>
  );
};

export const PosHandoffBoardPanel: React.FC<{
  receipt: PosAcceptanceReceipt | null;
  preview: PosPreview | null;
  report: PosHandoffReverificationReport;
  language?: string;
  shippingScanRole: ShippingLabelScanRole;
  recipientProofMethod: ShippingLabelRecipientProofMethod;
  recipientChallenge: string;
  recipientChallengeSignature: string;
  isSubmitting: boolean;
  onShippingScanRoleChange: (value: ShippingLabelScanRole) => void;
  onIssueRecipientChallenge: () => void;
  onGoScan: () => void;
  onGoDecision: () => void;
  onGoReport: () => void;
  onSubmit: () => void;
}> = ({
  receipt,
  preview,
  report,
  language = 'en',
  shippingScanRole,
  recipientProofMethod,
  recipientChallenge,
  recipientChallengeSignature,
  isSubmitting,
  onShippingScanRoleChange,
  onIssueRecipientChallenge,
  onGoScan,
  onGoDecision,
  onGoReport,
  onSubmit,
}) => {
  const source = mergeWaybillProgressSource(receipt?.shippingLabel ?? preview?.shippingLabel, report);
  const carrierOk = Boolean(source?.carrierScanVerified || waybillStageVerified(source, 'carrier-accepted'));
  const recipientOk = Boolean(source?.recipientControlVerified || waybillStageVerified(source, 'recipient-controlled'));
  const complete = Boolean(source?.packageReceiptVerified || waybillStageVerified(source, 'delivery-completed'));
  const hasActivePayload = Boolean(receipt || preview);

  const actionCards = [
    {
      id: 'carrier',
      title: carrierOk
        ? posInlineCopy(language, 'Carrier scan recorded', '配送業者スキャン記録済み')
        : posInlineCopy(language, 'Scan carrier side', '配送業者側をスキャン'),
      detail: posInlineCopy(
        language,
        'Carrier evidence verifies the address reference and terminal signature before package release.',
        '配送業者証跡で住所参照と端末署名を確認してから荷物を渡します。',
      ),
      tone: carrierOk ? 'ok' as const : 'pending' as const,
      icon: <Truck className="h-5 w-5" />,
      button: posInlineCopy(language, 'Carrier scan', '配送業者スキャン'),
      action: () => {
        onShippingScanRoleChange('carrier');
        onGoScan();
      },
    },
    {
      id: 'recipient',
      title: recipientOk
        ? posInlineCopy(language, 'Recipient proof recorded', '受取人証明記録済み')
        : posInlineCopy(language, 'Verify recipient control', '受取人管理を確認'),
      detail: posInlineCopy(
        language,
        'Use proof code, Passkey/WebAuthn, AOID credential, or NFC evidence without storing the raw secret.',
        '証明コード、Passkey/WebAuthn、AOID credential、NFC証跡を使い、秘密そのものは保存しません。',
      ),
      tone: recipientOk ? 'ok' as const : 'warning' as const,
      icon: <UserCheck className="h-5 w-5" />,
      button: posInlineCopy(language, 'Recipient scan', '受取人スキャン'),
      action: () => {
        onShippingScanRoleChange('recipient');
        onGoScan();
      },
    },
    {
      id: 'complete',
      title: complete
        ? posInlineCopy(language, 'Handoff complete', '引き渡し完了')
        : posInlineCopy(language, 'Complete handoff', '引き渡し完了処理'),
      detail: posInlineCopy(
        language,
        'Submit the current evidence after carrier and recipient sides are ready, then reconcile the report.',
        '配送業者側と受取人側の証跡が揃ったら送信し、レポートで再照合します。',
      ),
      tone: complete ? 'ok' as const : carrierOk && recipientOk ? 'warning' as const : 'pending' as const,
      icon: <PackageCheck className="h-5 w-5" />,
      button: isSubmitting
        ? posInlineCopy(language, 'Verifying', '検証中')
        : posInlineCopy(language, 'Submit handoff', '引き渡し送信'),
      action: onSubmit,
      disabled: isSubmitting || !hasActivePayload,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {posInlineCopy(language, 'Handoff Board', '引き渡しボード')}
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-950">
              {posInlineCopy(language, 'Carrier and recipient evidence before release', '引き渡し前の配送業者・受取人証跡')}
            </h3>
            <p className="mt-1 max-w-2xl text-xs font-bold leading-5 text-slate-500">
              {posInlineCopy(
                language,
                'This screen is the operational checkpoint between decision and report. It keeps carrier scan, recipient proof, terminal signature, expiry, and nullifier status visible in one place.',
                'この画面は判定とレポートの間にある現場チェックポイントです。配送業者スキャン、受取人証明、端末署名、有効期限、nullifier状態を一箇所で確認します。',
              )}
            </p>
          </div>
          <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:grid-cols-2">
            <span>{posInlineCopy(language, 'Current role', '現在の役割')}: {posShippingScanRoleLabel(language, shippingScanRole)}</span>
            <span>{posInlineCopy(language, 'Proof method', '証明方式')}: {posRecipientProofMethodLabel(recipientProofMethod, language)}</span>
            <span>{posInlineCopy(language, 'Challenge', 'チャレンジ')}: {recipientChallenge ? posInlineCopy(language, 'issued', '発行済み') : posInlineCopy(language, 'not issued', '未発行')}</span>
            <span>{posInlineCopy(language, 'Signature', '署名')}: {recipientChallengeSignature ? posInlineCopy(language, 'present', 'あり') : posInlineCopy(language, 'missing', '不足')}</span>
          </div>
        </div>

        <PosWaybillProgressBoard source={source} language={language} />

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {actionCards.map(card => (
            <div
              key={card.id}
              className={cn(
                'rounded-md border p-4',
                card.tone === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-950',
                card.tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-950',
                card.tone === 'pending' && 'border-slate-200 bg-slate-50 text-slate-800',
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                  {card.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black">{card.title}</span>
                  <span className="mt-1 block text-xs font-bold leading-5 opacity-70">{card.detail}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={card.action}
                disabled={card.disabled}
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-slate-950 px-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {card.button}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onIssueRecipientChallenge}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
          >
            <ShieldCheck className="h-4 w-4" />
            {posInlineCopy(language, 'Issue POS challenge', 'POSチャレンジ発行')}
          </button>
          <button
            type="button"
            onClick={onGoDecision}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
          >
            <ClipboardCheck className="h-4 w-4" />
            {posInlineCopy(language, 'Back to decision', '判定へ戻る')}
          </button>
          <button
            type="button"
            onClick={onGoReport}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-950"
          >
            <ClipboardList className="h-4 w-4" />
            {posInlineCopy(language, 'Open report', 'レポートを開く')}
          </button>
        </div>
      </div>
    </section>
  );
};

export const PosRegistryOperationsPanel: React.FC<{
  registry: PosAgidSecureRegistryStatus | null;
  syncState: 'idle' | 'loading' | 'error';
  language?: string;
  onRefreshRegistry: () => void;
}> = ({ registry, syncState, language = 'en', onRefreshRegistry }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {posInlineCopy(language, 'Registry Operations', 'レジストリ運用')}
        </p>
        <h3 className="mt-1 text-xl font-black text-slate-950">
          {posInlineCopy(language, 'Mode 1 server registry cockpit', 'Mode 1サーバーレジストリ操作')}
        </h3>
      </div>
      <button
        type="button"
        onClick={onRefreshRegistry}
        className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-700"
      >
        <RefreshCw className="h-4 w-4" />
        {posInlineCopy(language, 'Refresh', '更新')}
      </button>
    </div>
    <div className="grid gap-3 md:grid-cols-4">
      {[
        [posInlineCopy(language, 'Registry', 'レジストリ'), registry?.registryId || posInlineCopy(language, 'local', 'ローカル')],
        [posInlineCopy(language, 'Version', 'バージョン'), registry?.version || posInlineCopy(language, 'not loaded', '未読込')],
        [posInlineCopy(language, 'Used', '使用済み'), String(registry?.usedCount ?? 0)],
        [posInlineCopy(language, 'Revoked', '失効'), String((registry?.revokedTokenCount ?? 0) + (registry?.revokedKeyCount ?? 0))],
      ].map(([label, value]) => (
        <div key={label} className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-2 truncate text-sm font-black text-slate-900">{value}</p>
        </div>
      ))}
    </div>
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-emerald-900">
        <p className="flex items-center gap-2 text-xs font-black">
          <ShieldCheck className="h-4 w-4" /> {posInlineCopy(language, 'Verify before accept', '受付前に検証')}
        </p>
        <p className="mt-1 text-xs font-bold leading-5 opacity-75">
          {posInlineCopy(language, 'The POS validates key id, token id, expiry, revocation, and used state before accepting AGID-S.', 'POSはAGID-S受付前に鍵ID、トークンID、有効期限、失効、使用済み状態を検証します。')}
        </p>
      </div>
      <div className={cn(
        'rounded-md border p-3',
        syncState === 'error' ? 'border-amber-100 bg-amber-50 text-amber-900' : 'border-sky-100 bg-sky-50 text-sky-900',
      )}>
        <p className="flex items-center gap-2 text-xs font-black"><Activity className="h-4 w-4" /> {posInlineCopy(language, 'Receipt sync', 'レシート同期')}</p>
        <p className="mt-1 text-xs font-bold leading-5 opacity-75">
          {syncState === 'error'
            ? posInlineCopy(language, 'Recent sync failed; operator can keep working and retry.', '直近の同期に失敗しました。担当者は作業を続け、後で再試行できます。')
            : posInlineCopy(language, 'Recent receipt sync is available for audit history.', '直近レシートの同期を監査履歴に利用できます。')}
        </p>
      </div>
      <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-slate-700">
        <p className="flex items-center gap-2 text-xs font-black"><WifiOff className="h-4 w-4" /> {posInlineCopy(language, 'Offline fallback', 'オフライン代替')}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
          {posInlineCopy(language, 'If registry is unreachable, keep receipts local and reconcile used/nullifier state later.', 'レジストリに接続できない場合、レシートをローカル保持し、使用済み/nullifier状態を後で照合します。')}
        </p>
      </div>
    </div>
  </section>
);

function networkPostureClasses(posture: CiscoInspiredNetworkAssurance['posture']) {
  if (posture === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (posture === 'monitor') return 'border-sky-200 bg-sky-50 text-sky-950';
  if (posture === 'restricted') return 'border-amber-200 bg-amber-50 text-amber-950';
  return 'border-rose-200 bg-rose-50 text-rose-950';
}

function networkCheckStateClasses(state: CiscoInspiredNetworkAssurance['checks'][number]['state']) {
  if (state === 'pass') return 'bg-emerald-100 text-emerald-700';
  if (state === 'warn') return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

function networkPostureLabel(language: string, posture: CiscoInspiredNetworkAssurance['posture']) {
  if (posture === 'ready') return posInlineCopy(language, 'Ready', '準備完了');
  if (posture === 'monitor') return posInlineCopy(language, 'Monitor', '監視');
  if (posture === 'restricted') return posInlineCopy(language, 'Restricted', '制限');
  return posInlineCopy(language, 'Blocked', '停止');
}

function networkCheckStateLabel(language: string, state: CiscoInspiredNetworkAssurance['checks'][number]['state']) {
  if (state === 'pass') return posInlineCopy(language, 'Pass', '合格');
  if (state === 'warn') return posInlineCopy(language, 'Warn', '注意');
  return posInlineCopy(language, 'Fail', '失敗');
}

function networkCategoryLabel(language: string, category: CiscoInspiredNetworkAssurance['checks'][number]['category']) {
  const en: Record<CiscoInspiredNetworkAssurance['checks'][number]['category'], string> = {
    'zero-trust': 'Zero Trust',
    'device-posture': 'Device Posture',
    'secure-connect': 'Secure Connect',
    'edge-resolver': 'Edge Resolver',
    'network-assurance': 'Network Assurance',
    segmentation: 'Segmentation',
    'dns-security': 'DNS Security',
    'incident-response': 'Incident Response',
    privacy: 'Privacy',
  };
  const ja: Record<CiscoInspiredNetworkAssurance['checks'][number]['category'], string> = {
    'zero-trust': 'ゼロトラスト',
    'device-posture': '端末姿勢',
    'secure-connect': '安全接続',
    'edge-resolver': 'エッジResolver',
    'network-assurance': 'ネットワーク品質',
    segmentation: '分離',
    'dns-security': 'DNS安全性',
    'incident-response': 'インシデント',
    privacy: 'プライバシー',
  };
  return (isJapanesePosLanguage(language) ? ja : en)[category];
}

function networkGeneratedText(language: string, text: string) {
  if (!isJapanesePosLanguage(language)) return text;
  const translations: Record<string, string> = {
    'stop-handoff-and-escalate-network-posture': '引き渡しを止め、ネットワーク姿勢をエスカレーション',
    'continue-pos-operations': 'POS運用を継続',
    'use-local-fallback-and-sync-later': 'ローカル代替で継続し、後で同期',
    'restore-network-or-enable-local-fallback': 'ネットワーク復旧またはローカル代替を有効化',
    'route-to-closer-edge-or-local-cache': '近いエッジまたはローカルキャッシュへ切替',
    'prefer-offline-queue-and-retry-sync': 'オフラインキューを優先し同期を再試行',
    'defer-noncritical-registry-sync': '重要でないレジストリ同期を後回し',
    'prefer-tls-1-3-edge-endpoint': 'TLS 1.3対応エッジを優先',
    'require-tls-for-registry-and-resolver': 'レジストリ/ResolverにTLSを必須化',
    'pin-resolver-or-enable-signed-zone-discovery': 'Resolverをピン留めまたは署名付き発見を有効化',
    'enable-secure-tunnel-or-local-only-mode': '安全トンネルまたはLocal Onlyへ切替',
    'move-terminal-to-managed-network': '端末を管理ネットワークへ移動',
    'disable-address-telemetry-through-inspected-proxy': '検査プロキシ経由の住所テレメトリを無効化',
    'remove-terminal-from-service': '端末をサービスから外す',
    'pair-managed-terminal-or-require-supervisor': '管理端末をペアリング、または監督者承認',
    'update-pos-terminal-before-high-risk-work': '高リスク作業前にPOS端末を更新',
    'rotate-pos-terminal-keys': 'POS端末鍵をローテーション',
    'sync-terminal-clock-before-receipts': 'レシート発行前に端末時計を同期',
    'configure-resolver-endpoint-or-local-fallback': 'Resolver endpointまたはローカル代替を設定',
    'require-signed-address-route-ads': '署名付き住所ルート広告を必須化',
    'refresh-registry-root-and-route-ads': 'レジストリrootとルート広告を更新',
    'use-secondary-resolver-or-local-cache': '副Resolverまたはローカルキャッシュを使用',
    'require-staff-sign-in-before-sensitive-workflow': '機密ワークフロー前にスタッフサインインを必須化',
    'require-mfa-or-supervisor-approval': 'MFAまたは監督者承認を必須化',
    'enforce-domain-separated-scopes': '用途分離scopeを強制',
    'redact-telemetry-before-export': 'エクスポート前にテレメトリを秘匿化',
    'downgrade-telemetry-to-coarse-location': 'テレメトリを粗い位置へ落とす',
    'open-incident-review-case': 'インシデントレビューケースを開く',
    'rate-limit-and-review-address-lookup-pattern': '住所検索をレート制限しパターン確認',
    'isolate-terminal-and-revoke-keys': '端末を隔離し鍵を失効',
    'review-policy-violations-before-handoff': '引き渡し前にポリシー違反を確認',
  };
  return translations[text] || text;
}

export const PosNetworkAssurancePanel: React.FC<{
  assurance: CiscoInspiredNetworkAssurance;
  language?: string;
  onRefresh: () => void;
  onGoWorkspace: (workspace: PosWorkspaceId) => void;
}> = ({ assurance, language = 'en', onRefresh, onGoWorkspace }) => {
  const failingChecks = assurance.checks.filter((check) => check.state === 'fail');
  const warningChecks = assurance.checks.filter((check) => check.state === 'warn');
  const attentionChecks = [...failingChecks, ...warningChecks].slice(0, 8);
  const primaryChecks = attentionChecks.length > 0 ? attentionChecks : assurance.checks.slice(0, 8);
  return (
    <section className="space-y-4">
      <div className={cn('rounded-lg border p-4 shadow-sm', networkPostureClasses(assurance.posture))}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {posInlineCopy(language, 'Cisco-inspired Network Assurance', 'Cisco着想のネットワーク保証')}
            </p>
            <h3 className="mt-2 text-2xl font-black">
              {networkPostureLabel(language, assurance.posture)}
              <span className="ml-3 align-middle text-base font-black opacity-55">{assurance.score}/100</span>
            </h3>
            <p className="mt-2 max-w-3xl text-xs font-bold leading-5 opacity-75">
              {posInlineCopy(
                language,
                'Evaluates zero-trust access, device posture, signed resolver routing, secure transport, privacy telemetry, and incident signals before POS handoff.',
                'POS引き渡し前に、ゼロトラスト、端末姿勢、署名付きResolver経路、安全な通信、プライバシーテレメトリ、インシデント信号を評価します。',
              )}
            </p>
          </div>
          <div className="grid min-w-[220px] grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-white/65 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-55">{posInlineCopy(language, 'Fail', '失敗')}</p>
              <p className="mt-1 text-xl font-black">{failingChecks.length}</p>
            </div>
            <div className="rounded-md bg-white/65 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-55">{posInlineCopy(language, 'Warn', '注意')}</p>
              <p className="mt-1 text-xl font-black">{warningChecks.length}</p>
            </div>
            <div className="rounded-md bg-white/65 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-55">{posInlineCopy(language, 'Mode', 'モード')}</p>
              <p className="mt-1 truncate text-xs font-black uppercase">{assurance.mode}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-700"
          >
            <RefreshCw className="h-4 w-4" />
            {posInlineCopy(language, 'Refresh posture', '姿勢を更新')}
          </button>
          <button
            type="button"
            onClick={() => onGoWorkspace('devices')}
            className="inline-flex items-center gap-2 rounded-md bg-white/80 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white"
          >
            <Activity className="h-4 w-4" />
            {posInlineCopy(language, 'Device diagnostics', '端末診断')}
          </button>
          <button
            type="button"
            onClick={() => onGoWorkspace('registry')}
            className="inline-flex items-center gap-2 rounded-md bg-white/80 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white"
          >
            <Server className="h-4 w-4" />
            {posInlineCopy(language, 'Registry', 'レジストリ')}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {posInlineCopy(language, 'Attention Checks', '確認が必要な項目')}
              </p>
              <h4 className="mt-1 text-xl font-black text-slate-950">
                {posInlineCopy(language, 'What to fix before handoff', '引き渡し前に直すこと')}
              </h4>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {assurance.publicProjection.telemetryClass}
            </span>
          </div>
          <div className="space-y-2">
            {primaryChecks.map((check) => (
              <div key={check.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <div className="grid gap-3 md:grid-cols-[34px_minmax(0,1fr)_auto] md:items-start">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', networkCheckStateClasses(check.state))}>
                    {check.state === 'pass' ? <CheckCircle2 className="h-4 w-4" /> : check.state === 'warn' ? <AlertTriangle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-900">{check.label}</span>
                    <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{check.detail}</span>
                    <span className="mt-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {networkCategoryLabel(language, check.category)}
                    </span>
                  </span>
                  <span className={cn('rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-widest', networkCheckStateClasses(check.state))}>
                    {networkCheckStateLabel(language, check.state)}
                  </span>
                </div>
                {check.state !== 'pass' && (
                  <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                    {posInlineCopy(language, 'Action', '対応')}: <span className="font-black text-slate-900">{networkGeneratedText(language, check.action)}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {posInlineCopy(language, 'Next Actions', '次の操作')}
              </p>
              <h4 className="mt-1 text-lg font-black text-slate-950">
                {posInlineCopy(language, 'Operator-safe remediation', '現場向け改善手順')}
              </h4>
            </div>
            <div className="space-y-2">
              {assurance.nextActions.slice(0, 7).map((action) => (
                <p key={action} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">
                  {networkGeneratedText(language, action)}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {posInlineCopy(language, 'Required Controls', '必須制御')}
              </p>
              <h4 className="mt-1 text-lg font-black text-slate-950">
                {posInlineCopy(language, 'Policy gates for this mode', 'このモードのポリシーゲート')}
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {assurance.requiredControls.map((control) => (
                <span key={control} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  {networkGeneratedText(language, control)}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-emerald-950 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-black">
                  {posInlineCopy(language, 'No raw address telemetry', '生住所テレメトリなし')}
                </p>
                <p className="mt-1 text-xs font-bold leading-5 opacity-75">
                  {posInlineCopy(
                    language,
                    'This report stores only posture metadata. Raw address, AGID, AOID, IP address, and device fingerprint are outside the public projection.',
                    'このレポートは姿勢メタデータだけを保存します。生住所、AGID、AOID、IPアドレス、端末フィンガープリントは公開投影に含めません。',
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function toneForDevice(status: PosDeviceDiagnostic['status']) {
  if (status === 'ready') return 'border-emerald-100 bg-emerald-50 text-emerald-900';
  if (status === 'warning') return 'border-amber-100 bg-amber-50 text-amber-900';
  return 'border-rose-100 bg-rose-50 text-rose-900';
}

function terminalGradeClasses(grade: AddressTerminalCard['grade']) {
  if (grade === 'ready') return 'border-emerald-100 bg-emerald-50 text-emerald-900';
  if (grade === 'attention') return 'border-amber-100 bg-amber-50 text-amber-900';
  return 'border-rose-100 bg-rose-50 text-rose-900';
}

function terminalGradeLabel(language: string, grade: AddressTerminalCard['grade']) {
  if (grade === 'ready') return posInlineCopy(language, 'Ready', '準備完了');
  if (grade === 'attention') return posInlineCopy(language, 'Attention', '要確認');
  return posInlineCopy(language, 'Blocked', '停止');
}

function terminalSyncLabel(language: string, state: AddressTerminalCard['syncState']) {
  if (state === 'fresh') return posInlineCopy(language, 'Fresh', '最新');
  if (state === 'pending') return posInlineCopy(language, 'Pending', '保留');
  if (state === 'conflict') return posInlineCopy(language, 'Conflict', '衝突');
  if (state === 'offline') return posInlineCopy(language, 'Offline', 'オフライン');
  return posInlineCopy(language, 'Error', 'エラー');
}

function terminalAttentionLabel(language: string, value: string) {
  if (!isJapanesePosLanguage(language)) return value;
  const [domain, detail] = value.split(':');
  const domainLabel: Record<string, string> = {
    'receipt-printer': 'プリンタ',
    'cash-drawer': 'ドロワー',
    'barcode-reader': 'バーコード',
    'measurement-instrument': '計測器',
    registry: 'レジストリ',
    sync: '同期',
    'offline-queue': 'オフラインキュー',
    'agid-s-keys': 'AGID-S鍵',
  };
  const detailLabel: Record<string, string> = {
    warning: '要確認',
    offline: 'オフライン',
    stale: '古い',
    pending: '保留',
    conflict: '衝突',
    error: 'エラー',
    missing: '不足',
  };
  return `${domainLabel[domain] || domain}${detail ? `: ${detailLabel[detail] || detail}` : ''}`;
}

function toneForReport(status: PosHandoffReverificationReport['status']) {
  if (status === 'cleared') return 'border-emerald-100 bg-emerald-50 text-emerald-900';
  if (status === 'attention') return 'border-amber-100 bg-amber-50 text-amber-900';
  return 'border-rose-100 bg-rose-50 text-rose-900';
}

function checkTone(state: PosHandoffReverificationReport['checks'][number]['state']) {
  if (state === 'pass') return 'bg-emerald-100 text-emerald-700';
  if (state === 'attention') return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

function auditRiskTone(risk: PosAdvancedAuditRisk) {
  if (risk === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (risk === 'medium') return 'border-amber-200 bg-amber-50 text-amber-950';
  if (risk === 'high') return 'border-orange-200 bg-orange-50 text-orange-950';
  return 'border-rose-200 bg-rose-50 text-rose-950';
}

export const PosStaffPermissionPanel: React.FC<{
  role: PosStaffRole;
  operatorId: string;
  language?: string;
  onRoleChange: (role: PosStaffRole) => void;
}> = ({ role, operatorId, language = 'en', onRoleChange }) => {
  const profiles = listPosStaffProfiles();
  const selected = profiles.find((profile) => profile.role === role) ?? profiles[0];
  const permissionGroups: Array<{
    label: string;
    permissions: Array<{ id: Parameters<typeof hasPosStaffPermission>[1]; label: string }>;
  }> = [
    {
      label: posInlineCopy(language, 'Intake', '受付'),
      permissions: [
        { id: 'scan-pos-payload', label: posPermissionLabel(language, 'scan-pos-payload') },
        { id: 'decrypt-agid-s', label: posPermissionLabel(language, 'decrypt-agid-s') },
        { id: 'accept-handoff', label: posPermissionLabel(language, 'accept-handoff') },
      ],
    },
    {
      label: posInlineCopy(language, 'Control', '制御'),
      permissions: [
        { id: 'reject-release', label: posPermissionLabel(language, 'reject-release') },
        { id: 'override-review', label: posPermissionLabel(language, 'override-review') },
        { id: 'view-exception-audit', label: posPermissionLabel(language, 'view-exception-audit') },
      ],
    },
    {
      label: posInlineCopy(language, 'Devices', '端末'),
      permissions: [
        { id: 'run-device-diagnostics', label: posPermissionLabel(language, 'run-device-diagnostics') },
        { id: 'print-redacted-receipt', label: posPermissionLabel(language, 'print-redacted-receipt') },
        { id: 'open-cash-drawer', label: posPermissionLabel(language, 'open-cash-drawer') },
        { id: 'pair-barcode-reader', label: posPermissionLabel(language, 'pair-barcode-reader') },
        { id: 'pair-measuring-instrument', label: posPermissionLabel(language, 'pair-measuring-instrument') },
      ],
    },
  ];
  const allPermissions = permissionGroups.flatMap((group) => group.permissions);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {posInlineCopy(language, 'Staff Permissions', 'スタッフ権限')}
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            {posInlineCopy(language, 'Role-gated POS operations', '役割別POS操作')}
          </h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {operatorId
              ? `${posInlineCopy(language, 'Operator', '担当者')} ${operatorId}`
              : posInlineCopy(language, 'Set an operator id in Settings before production use.', '本番利用前に設定で担当者IDを入力してください。')}
          </p>
        </div>
        <select
          value={role}
          onChange={(event) => onRoleChange(event.target.value as PosStaffRole)}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
        >
          {profiles.map((profile) => (
            <option key={profile.role} value={profile.role}>{posStaffRoleLabel(language, profile.role, profile.label)}</option>
          ))}
        </select>
      </div>

      <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black text-slate-950">{posStaffRoleLabel(language, selected.role, selected.label)}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{posStaffScopeLabel(language, selected.role, selected.scope)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {permissionGroups.map((group) => (
          <div key={group.label} className="rounded-md border border-slate-100 bg-white p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{group.label}</p>
            <div className="space-y-2">
              {group.permissions.map((permission) => {
                const allowed = hasPosStaffPermission(role, permission.id);
                return (
                  <div key={permission.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                    <span className="text-xs font-black text-slate-700">{permission.label}</span>
                    <span className={cn(
                      'rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest',
                      allowed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500',
                    )}>
                      {allowed ? posInlineCopy(language, 'Allow', '許可') : posInlineCopy(language, 'Deny', '拒否')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {posInlineCopy(language, 'Permission Matrix', '権限マトリクス')}
            </p>
            <h4 className="mt-1 text-base font-black text-slate-950">
              {posInlineCopy(language, 'Supervisor-only actions stay explicit', '責任者専用操作を明示')}
            </h4>
          </div>
          <p className="max-w-xl text-xs font-bold leading-5 text-slate-500">
            {posInlineCopy(
              language,
              'Overrides, exception audit, export, drawer, barcode pairing, and measuring instrument pairing should stay role-gated before production.',
              '上書き、例外監査、エクスポート、ドロワー、バーコード連携、計測器連携は本番前に役割で制限してください。',
            )}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 rounded-l-md bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {posInlineCopy(language, 'Permission', '権限')}
                </th>
                {profiles.map((profile) => (
                  <th key={profile.role} className="bg-slate-100 px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {posStaffRoleLabel(language, profile.role, profile.label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPermissions.map((permission) => (
                <tr key={permission.id}>
                  <td className="sticky left-0 z-10 border-t border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">
                    {permission.label}
                  </td>
                  {profiles.map((profile) => {
                    const allowed = hasPosStaffPermission(profile.role, permission.id);
                    return (
                      <td key={`${profile.role}-${permission.id}`} className="border-t border-slate-200 bg-white px-3 py-2 text-center">
                        <span className={cn(
                          'inline-flex min-w-16 justify-center rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest',
                          allowed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500',
                        )}>
                          {allowed ? posInlineCopy(language, 'Allow', '許可') : posInlineCopy(language, 'Deny', '拒否')}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export const PosDeviceDiagnosticsPanel: React.FC<{
  diagnostics: PosDeviceDiagnostic[];
  staffRole: PosStaffRole;
  language?: string;
  onRefresh: () => void;
  onPrint: () => void;
  onPrinterTest: () => void;
  onCashDrawerTest: () => void;
  onBarcodeReaderTest: () => void;
  onMeasurementPairTest: () => void;
}> = ({
  diagnostics,
  staffRole,
  language = 'en',
  onRefresh,
  onPrint,
  onPrinterTest,
  onCashDrawerTest,
  onBarcodeReaderTest,
  onMeasurementPairTest,
}) => {
  const canRun = hasPosStaffPermission(staffRole, 'run-device-diagnostics');
  const readyCount = diagnostics.filter((item) => item.status === 'ready').length;
  const commandRows: Array<{
    label: string;
    detail: string;
    permission: Parameters<typeof hasPosStaffPermission>[1];
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      label: posInlineCopy(language, 'Printer self-test', 'プリンタ自己診断'),
      detail: posInlineCopy(language, 'Prints or previews a redacted diagnostic slip.', '秘匿化された診断票を印刷またはプレビューします。'),
      permission: 'print-redacted-receipt',
      icon: <Printer className="h-4 w-4" />,
      onClick: onPrinterTest,
    },
    {
      label: posInlineCopy(language, 'Cash drawer test', 'キャッシュドロワー確認'),
      detail: posInlineCopy(language, 'Logs a drawer relay check without forcing hardware access in the browser.', 'ブラウザから強制操作せず、ドロワーリレー確認を記録します。'),
      permission: 'open-cash-drawer',
      icon: <LockOpen className="h-4 w-4" />,
      onClick: onCashDrawerTest,
    },
    {
      label: posInlineCopy(language, 'Barcode reader pairing', 'バーコードリーダー連携'),
      detail: posInlineCopy(language, 'Checks keyboard wedge, HID, USB, and scanner readiness.', 'キーボード入力、HID、USB、スキャナー準備状態を確認します。'),
      permission: 'pair-barcode-reader',
      icon: <ScanLine className="h-4 w-4" />,
      onClick: onBarcodeReaderTest,
    },
    {
      label: posInlineCopy(language, 'Measuring instrument pairing', '電子計測器連携'),
      detail: posInlineCopy(language, 'Checks serial, HID, USB, and calibration-profile readiness.', 'Serial、HID、USB、校正プロファイルの準備状態を確認します。'),
      permission: 'pair-measuring-instrument',
      icon: <Gauge className="h-4 w-4" />,
      onClick: onMeasurementPairTest,
    },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {posInlineCopy(language, 'Terminal Diagnostics', '端末診断')}
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            {posInlineCopy(language, 'Peripheral readiness and device trust', '周辺機器の準備状態と端末信頼性')}
          </h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {isJapanesePosLanguage(language)
              ? `${diagnostics.length}台中${readyCount}台が準備完了`
              : `${readyCount} of ${diagnostics.length} devices ready`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            {posMainCopy(language, 'print')}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={!canRun}
            className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            {posInlineCopy(language, 'Run check', '診断実行')}
          </button>
        </div>
      </div>
      {!canRun && (
        <p className="mb-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          {posInlineCopy(language, 'Current role cannot run diagnostics. Switch to pickup operator, supervisor, or field admin.', '現在の役割では端末診断を実行できません。受取担当、責任者、現地管理者に切り替えてください。')}
        </p>
      )}
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {diagnostics.map((device) => (
          <div key={device.kind} className={cn('rounded-md border p-4', toneForDevice(device.status))}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{device.kind}</p>
                <h4 className="mt-1 text-lg font-black">{posDeviceLabel(language, device)}</h4>
              </div>
              <span className="rounded bg-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-widest">
                {posDeviceStatusLabel(language, device.status)}
              </span>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 opacity-80">{posDeviceAction(language, device)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {device.evidence.map((item) => (
                <span key={item} className="rounded bg-white/60 px-2 py-1 text-[9px] font-black uppercase tracking-widest opacity-70">
                  {posEvidenceToken(language, item)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest opacity-50">
              {posInlineCopy(language, 'Permission', '必要権限')}: {posPermissionLabel(language, device.requiredPermission)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {posInlineCopy(language, 'Diagnostic Commands', '診断コマンド')}
          </p>
          <h4 className="mt-1 text-base font-black text-slate-950">
            {posInlineCopy(language, 'Operator-safe peripheral checks', '担当者が安全に実行できる周辺機器確認')}
          </h4>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            {posInlineCopy(
              language,
              'Browser POS cannot guarantee every cash drawer or printer connector, so each command records readiness and prompts external connector setup when required.',
              'ブラウザPOSでは全てのドロワーやプリンタ接続を保証できないため、各コマンドは準備状態を記録し、必要に応じて外部コネクタ設定を促します。',
            )}
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {commandRows.map((command) => {
            const allowed = hasPosStaffPermission(staffRole, command.permission);
            return (
              <button
                key={command.permission}
                type="button"
                onClick={command.onClick}
                disabled={!allowed}
                className={cn(
                  'grid min-h-28 grid-rows-[auto_1fr_auto] gap-2 rounded-md border bg-white p-3 text-left shadow-sm transition-colors',
                  allowed ? 'border-slate-200 hover:border-blue-200 hover:bg-blue-50' : 'border-slate-100 opacity-55',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white">
                    {command.icon}
                  </span>
                  <span className={cn(
                    'rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest',
                    allowed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500',
                  )}>
                    {allowed ? posInlineCopy(language, 'Allowed', '実行可') : posInlineCopy(language, 'Locked', '制限')}
                  </span>
                </span>
                <span>
                  <span className="block text-xs font-black text-slate-900">{command.label}</span>
                  <span className="mt-1 block text-[10px] font-bold leading-4 text-slate-500">{command.detail}</span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {posPermissionLabel(language, command.permission)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const MEASUREMENT_KIND_OPTIONS: Array<{ value: PosMeasurementInstrumentKind; label: string; detail: string }> = [
  { value: 'weight-scale', label: 'Weight scale', detail: 'Parcel mass for shipping rules' },
  { value: 'dimensioner', label: 'Dimensioner', detail: 'Length, width, height, or volumetric values' },
  { value: 'temperature-probe', label: 'Temperature probe', detail: 'Cold-chain and field condition checks' },
  { value: 'multimeter', label: 'Multimeter', detail: 'Electrical measurement for equipment intake' },
  { value: 'custom-meter', label: 'Custom meter', detail: 'Any calibrated field reading' },
];

function measurementKindLabel(kind: PosMeasurementInstrumentKind, language = 'en') {
  if (!isJapanesePosLanguage(language)) {
    return MEASUREMENT_KIND_OPTIONS.find((item) => item.value === kind)?.label ?? 'Measurement';
  }
  if (kind === 'weight-scale') return '重量計';
  if (kind === 'dimensioner') return '寸法計測器';
  if (kind === 'temperature-probe') return '温度プローブ';
  if (kind === 'multimeter') return 'マルチメータ';
  if (kind === 'custom-meter') return 'カスタム計測器';
  return '計測';
}

export const PosMeasurementInstrumentPanel: React.FC<{
  diagnostic?: PosDeviceDiagnostic;
  staffRole: PosStaffRole;
  language?: string;
  deviceId: string;
  kind: PosMeasurementInstrumentKind;
  value: string;
  unit: string;
  sampleId: string;
  readings: PosMeasurementReading[];
  onDeviceIdChange: (value: string) => void;
  onKindChange: (value: PosMeasurementInstrumentKind) => void;
  onValueChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onSampleIdChange: (value: string) => void;
  onReadDemo: () => void;
  onSave: () => void;
  onClear: () => void;
}> = ({
  diagnostic,
  staffRole,
  language = 'en',
  deviceId,
  kind,
  value,
  unit,
  sampleId,
  readings,
  onDeviceIdChange,
  onKindChange,
  onValueChange,
  onUnitChange,
  onSampleIdChange,
  onReadDemo,
  onSave,
  onClear,
}) => {
  const canPair = hasPosStaffPermission(staffRole, 'pair-measuring-instrument');
  const status = diagnostic?.status ?? 'offline';

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {posInlineCopy(language, 'Measurement Capture', '計測値取得')}
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            {posInlineCopy(language, 'Electronic measuring instrument', '電子計測器')}
          </h3>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-slate-500">
            {posInlineCopy(
              language,
              'Capture package weight, dimensions, temperature, or calibrated field readings for shipping and audit flows. Measurements stay separate from raw AGID/AOID secrets and can be entered manually when a device is offline.',
              '配送と監査のために重量、寸法、温度、校正済み現地計測値を取得します。計測値はAGID/AOIDの秘密情報と分離し、端末がオフラインでも手入力できます。',
            )}
          </p>
        </div>
        <span className={cn(
          'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[10px] font-black uppercase tracking-widest',
          toneForDevice(status),
        )}>
          <Gauge className="h-4 w-4" />
          {posDeviceStatusLabel(language, status)}
        </span>
      </div>

      {!canPair && (
        <p className="mb-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          {posInlineCopy(language, 'Current role can view readings but cannot pair or certify a measuring instrument.', '現在の役割では計測値の閲覧のみ可能です。計測器の接続や認証はできません。')}
        </p>
      )}

      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Device ID', '端末ID')}</span>
              <input
                value={deviceId}
                onChange={(event) => onDeviceIdChange(event.target.value)}
                placeholder={posInlineCopy(language, 'scale-01 / dimensioner-a', 'scale-01 / 寸法計測器-a')}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Package / sample ID', '荷物/サンプルID')}</span>
              <input
                value={sampleId}
                onChange={(event) => onSampleIdChange(event.target.value)}
                placeholder={posInlineCopy(language, 'receipt, waybill, or package id', 'レシート、送り状、荷物ID')}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Instrument type', '計測器種別')}</span>
              <select
                value={kind}
                onChange={(event) => onKindChange(event.target.value as PosMeasurementInstrumentKind)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              >
                {MEASUREMENT_KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{measurementKindLabel(option.value, language)}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-[1fr_88px] gap-2">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Value', '値')}</span>
                <input
                  value={value}
                  onChange={(event) => onValueChange(event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-black tabular-nums text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Unit', '単位')}</span>
                <input
                  value={unit}
                  onChange={(event) => onUnitChange(event.target.value)}
                  placeholder="kg"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReadDemo}
              disabled={!canPair}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-700 disabled:opacity-50"
            >
              <Activity className="h-4 w-4" />
              {posInlineCopy(language, 'Read demo', 'デモ読取')}
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100"
            >
              <DatabaseZap className="h-4 w-4" />
              {posInlineCopy(language, 'Save reading', '計測値保存')}
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={readings.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <RotateCw className="h-4 w-4" />
              {posInlineCopy(language, 'Clear log', 'ログ消去')}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(diagnostic?.evidence ?? ['manual-entry']).map((item) => (
              <span key={item} className="rounded bg-white px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                {posEvidenceToken(language, item)}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-slate-100 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {posInlineCopy(language, 'Recent readings', '最近の計測値')}
              </p>
              <h4 className="mt-1 text-lg font-black text-slate-950">
                {isJapanesePosLanguage(language) ? `ローカル計測値 ${readings.length}件` : `${readings.length} local reading(s)`}
              </h4>
            </div>
            <Gauge className="h-5 w-5 text-slate-400" />
          </div>

          {readings.length === 0 ? (
            <p className="mt-4 rounded-md bg-slate-50 px-3 py-3 text-xs font-bold leading-5 text-slate-500">
              {posInlineCopy(language, 'No measurements captured yet. Save a manual value or use the demo read path to test the POS flow.', 'まだ計測値はありません。手入力で保存するか、デモ読取でPOSフローをテストしてください。')}
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {readings.slice(0, 5).map((reading) => (
                <div key={reading.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black tabular-nums text-slate-950">
                        {reading.value} {reading.unit}
                      </p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {measurementKindLabel(reading.kind, language)} / {reading.source}
                      </p>
                    </div>
                    <span className="rounded bg-white px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {reading.sampleId || posInlineCopy(language, 'no sample', 'サンプルなし')}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-slate-500">
                    {reading.deviceId || posInlineCopy(language, 'unassigned device', '未割当端末')} / {new Date(reading.capturedAt).toLocaleString(posLocale(language))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const PosExceptionAuditPanel: React.FC<{
  cases: PosExceptionAuditCase[];
  staffRole: PosStaffRole;
  language?: string;
  onGoScan: () => void;
  onGoReport: () => void;
  onPrint: () => void;
}> = ({ cases, staffRole, language = 'en', onGoScan, onGoReport, onPrint }) => {
  const canView = hasPosStaffPermission(staffRole, 'view-exception-audit');

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Exception Audit', '例外監査')}</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{posInlineCopy(language, 'Rejected and review-required cases', '拒否・要確認ケース')}</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {isJapanesePosLanguage(language) ? `未解決ローカルケース ${cases.length}件` : `${cases.length} open local case(s)`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            {posInlineCopy(language, 'Print', '印刷')}
          </button>
          <button
            type="button"
            onClick={onGoScan}
            className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-700"
          >
            <ScanLine className="h-4 w-4" />
            {posInlineCopy(language, 'Rescan', '再スキャン')}
          </button>
          <button
            type="button"
            onClick={onGoReport}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
          >
            <ClipboardCheck className="h-4 w-4" />
            {posInlineCopy(language, 'Report', 'レポート')}
          </button>
        </div>
      </div>

      {!canView && (
        <p className="mb-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          {posInlineCopy(language, 'Current role can see the count only. Supervisor or field admin is required for full audit detail.', '現在の権限では件数のみ表示できます。監査詳細には監督者または現場管理者の権限が必要です。')}
        </p>
      )}

      <div className="space-y-2">
        {cases.length === 0 && (
          <p className="rounded-md bg-slate-50 p-3 text-xs font-bold text-slate-400">
            {posInlineCopy(language, 'No rejected or review-required receipts in the local cache.', 'ローカルキャッシュに拒否・要確認レシートはありません。')}
          </p>
        )}
        {cases.map((item) => (
          <div key={item.caseId} className="rounded-md border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{item.caseId} / {item.receiptId}</p>
                <p className="mt-1 truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {item.channel} / {canView ? item.recordLabel : posInlineCopy(language, 'restricted', '制限中')}
                </p>
              </div>
              <span className={cn(
                'w-fit rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest',
                item.severity === 'block' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700',
              )}>
                {posReceiptStatusLabel(language, item.status as PosAcceptanceReceipt['status'])}
              </span>
            </div>
            {canView && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <p className="rounded-md bg-white px-3 py-2 text-xs font-bold text-slate-600">
                  {posInlineCopy(language, 'Reason', '理由')}: <span className="font-black text-slate-900">{item.reason}</span>
                </p>
                <p className="rounded-md bg-white px-3 py-2 text-xs font-bold text-slate-600">
                  {posInlineCopy(language, 'Action', '対応')}: <span className="font-black text-slate-900">{item.operatorAction}</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export const PosHandoffReverificationPanel: React.FC<{
  report: PosHandoffReverificationReport;
  staffRole: PosStaffRole;
  language?: string;
  onRefresh: () => void;
  onPrint: () => void;
}> = ({ report, staffRole, language = 'en', onRefresh, onPrint }) => {
  const canExport = hasPosStaffPermission(staffRole, 'export-reverification-report');
  const evidence = report.evidenceSummary;
  const carrierReceipt = evidence.carrierScanReceipt;
  const recipientReceipt = evidence.recipientProofReceipt;
  const highRiskSafety = evidence.highRiskSafety;
  const advancedAudit = report.advancedAudit;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Post-Handoff Reverification', '引き渡し後の再照合')}</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{posInlineCopy(language, 'Completion report and reconciliation checks', '完了レポートと照合チェック')}</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">{report.reportId} / {report.receiptId ?? posInlineCopy(language, 'no receipt', 'レシートなし')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPrint}
            disabled={!canExport}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            {posInlineCopy(language, 'Print', '印刷')}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-700"
          >
            <RefreshCw className="h-4 w-4" />
            {posInlineCopy(language, 'Re-run', '再実行')}
          </button>
        </div>
      </div>

      <div className={cn('mb-3 rounded-md border p-4', toneForReport(report.status))}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{posInlineCopy(language, 'Report status', 'レポート状態')}</p>
            <p className="mt-1 text-2xl font-black">{posOperationalStatusDisplay(language, report.status)}</p>
          </div>
          <p className="max-w-lg text-xs font-bold leading-5 opacity-80">{posGeneratedText(language, report.summary)}</p>
        </div>
      </div>
      <div className="mb-3">
        <PosWaybillProgressBoard source={report} language={language} />
      </div>

      <div className="mb-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <ClipboardList className="h-4 w-4" />
              {posInlineCopy(language, 'Advanced audit report', '高度監査レポート')}
            </p>
            <h4 className="mt-1 text-lg font-black text-slate-950">
              {posInlineCopy(language, 'Risk, evidence coverage, timeline, and next action', 'リスク・証拠カバレッジ・時系列・次アクション')}
            </h4>
          </div>
          <div className={cn('grid min-w-0 gap-2 rounded-md border p-3 sm:grid-cols-3', auditRiskTone(advancedAudit.risk))}>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-55">{posInlineCopy(language, 'Audit score', '監査スコア')}</p>
              <p className="mt-1 text-2xl font-black">{advancedAudit.score}/100</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-55">{posInlineCopy(language, 'Risk', 'リスク')}</p>
              <p className="mt-1 text-lg font-black uppercase">{posGeneratedText(language, advancedAudit.risk)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-55">{posInlineCopy(language, 'Coverage', 'カバレッジ')}</p>
              <p className="mt-1 text-lg font-black">
                {advancedAudit.coverage.present}/{advancedAudit.coverage.total}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-4">
          {advancedAudit.metrics.map(metric => (
            <div key={metric.label} className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-slate-900">{posGeneratedText(language, metric.label)}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{posGeneratedText(language, metric.value)}</p>
                </div>
                <span className={cn('rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest', checkTone(metric.state))}>
                  {posCheckStateLabel(language, metric.state)}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{posGeneratedText(language, metric.detail)}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1.2fr]">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {posInlineCopy(language, 'Privacy posture', 'プライバシー姿勢')}
                </p>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                  {posGeneratedText(language, advancedAudit.privacyPosture.detail)}
                </p>
              </div>
              <span className={cn('rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest', checkTone(advancedAudit.privacyPosture.state))}>
                {posCheckStateLabel(language, advancedAudit.privacyPosture.state)}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-[9px] font-black uppercase tracking-widest sm:grid-cols-2">
              {advancedAudit.privacyPosture.controls.map(control => (
                <span key={control} className="rounded bg-white px-2 py-1 text-slate-600">
                  {posGeneratedText(language, control)}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-xs font-black text-slate-900">
              <Clock3 className="h-4 w-4 text-sky-600" />
              {posInlineCopy(language, 'Evidence timeline', '証拠タイムライン')}
            </p>
            <div className="mt-3 space-y-2">
              {advancedAudit.timeline.map((event, index) => (
                <div key={`${event.label}-${event.at}-${index}`} className="grid gap-2 rounded-md bg-white p-2 text-xs font-bold sm:grid-cols-[92px_1fr_auto]">
                  <span className="text-slate-400">{compactTime(event.at, language)}</span>
                  <span className="min-w-0">
                    <span className="block font-black text-slate-900">{posGeneratedText(language, event.label)}</span>
                    <span className="mt-1 block leading-5 text-slate-500">{posGeneratedText(language, event.detail)}</span>
                  </span>
                  <span className={cn('h-fit rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest', checkTone(event.state))}>
                    {posCheckStateLabel(language, event.state)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-xs font-black text-slate-900">
              <ClipboardCheck className="h-4 w-4 text-violet-600" />
              {posInlineCopy(language, 'Integrity checks', '完全性チェック')}
            </p>
            <div className="mt-3 space-y-2">
              {advancedAudit.integrityChecks.map(item => (
                <div key={item.label} className="flex items-start justify-between gap-3 rounded-md bg-white p-2">
                  <span>
                    <span className="block text-xs font-black text-slate-900">{posGeneratedText(language, item.label)}</span>
                    <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{posGeneratedText(language, item.reason)}</span>
                  </span>
                  <span className={cn('shrink-0 rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest', checkTone(item.state))}>
                    {posCheckStateLabel(language, item.state)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-xs font-black text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              {posInlineCopy(language, 'Next actions', '次のアクション')}
            </p>
            <div className="mt-3 space-y-2">
              {advancedAudit.nextActions.map((action, index) => (
                <p key={`${action}-${index}`} className="rounded-md bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                  {posGeneratedText(language, action)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <ReceiptText className="h-4 w-4" />
              {posInlineCopy(language, 'Reconciliation evidence package', '再照合証拠パッケージ')}
            </p>
            <h4 className="mt-1 text-lg font-black text-slate-950">{posInlineCopy(language, 'Waybill, receipts, freshness, signatures', '送り状・レシート・鮮度・署名')}</h4>
          </div>
          <span className="rounded-md bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm">
            {posInlineCopy(language, 'Waybill', '送り状')} {evidence.waybillId ?? posInlineCopy(language, 'none', 'なし')}
          </span>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="flex items-center gap-2 text-xs font-black text-slate-900">
              <Truck className="h-4 w-4 text-sky-600" />
              {posInlineCopy(language, 'Carrier scan receipt', '配送業者スキャンレシート')}
            </p>
            <dl className="mt-3 space-y-2 text-xs font-bold">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Receipt', 'レシート')}</dt>
                <dd className="text-right text-slate-800">{evidenceValue(carrierReceipt?.receiptId, language)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Scan', 'スキャン')}</dt>
                <dd className="text-right text-slate-800">{evidenceValue(carrierReceipt?.scanId, language)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Carrier terminal', '配送端末')}</dt>
                <dd className="text-right text-slate-800">{evidenceValue(carrierReceipt?.carrierTerminalId, language)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Signature', '署名')}</dt>
                <dd className="text-right text-slate-800">{carrierReceipt?.terminalSignatureTail ? `...${carrierReceipt.terminalSignatureTail}` : evidenceValue(undefined, language)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="flex items-center gap-2 text-xs font-black text-slate-900">
              <UserCheck className="h-4 w-4 text-blue-600" />
              {posInlineCopy(language, 'Recipient proof receipt', '受取人証明レシート')}
            </p>
            <dl className="mt-3 space-y-2 text-xs font-bold">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Receipt', 'レシート')}</dt>
                <dd className="text-right text-slate-800">{evidenceValue(recipientReceipt?.receiptId, language)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Method', '方式')}</dt>
                <dd className="text-right text-slate-800">{evidenceValue(recipientReceipt?.proofMethod, language)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Challenge', 'チャレンジ')}</dt>
                <dd className="text-right text-slate-800">{evidenceValue(recipientReceipt?.recipientChallengeVerified, language)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Proof hash', '証明ハッシュ')}</dt>
                <dd className="text-right text-slate-800">{recipientReceipt?.recipientChallengeHashTail ? `...${recipientReceipt.recipientChallengeHashTail}` : evidenceValue(undefined, language)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="flex items-center gap-2 text-xs font-black text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {posInlineCopy(language, 'Revocation / freshness', '失効・鮮度')}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className={cn('rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest', checkTone(evidence.revocationFreshness.state))}>
                {posCheckStateLabel(language, evidence.revocationFreshness.state)}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {evidence.revocationFreshness.registryFresh ? posInlineCopy(language, 'fresh', '鮮度OK') : posInlineCopy(language, 'stale', '要更新')}
              </span>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
              {posGeneratedText(language, evidence.revocationFreshness.detail)}
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="flex items-center gap-2 text-xs font-black text-slate-900">
              <ClipboardCheck className="h-4 w-4 text-violet-600" />
              {posInlineCopy(language, 'POS terminal signature', 'POS端末署名')}
            </p>
            <dl className="mt-3 space-y-2 text-xs font-bold">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Complete', '完了')}</dt>
                <dd className="text-right text-slate-800">{evidenceValue(evidence.posTerminalSignatures.complete, language)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Carrier tail', '配送署名末尾')}</dt>
                <dd className="text-right text-slate-800">{carrierReceipt?.terminalSignatureTail ? `...${carrierReceipt.terminalSignatureTail}` : evidenceValue(undefined, language)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Recipient tail', '受取署名末尾')}</dt>
                <dd className="text-right text-slate-800">{recipientReceipt?.terminalSignatureTail ? `...${recipientReceipt.terminalSignatureTail}` : evidenceValue(undefined, language)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">{posInlineCopy(language, 'Store POS', '店舗POS')}</dt>
                <dd className="text-right text-slate-800">{evidenceValue(carrierReceipt?.storePosId ?? recipientReceipt?.storePosId, language)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {highRiskSafety.active && (
          <div className={cn('mt-3 rounded-md border p-3', checkTone(highRiskSafety.state))}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-black">
                  <AlertTriangle className="h-4 w-4" />
                  {posInlineCopy(language, 'High-risk safety mode', '高リスク安全モード')}
                </p>
                <p className="mt-1 max-w-3xl text-xs font-bold leading-5 opacity-80">
                  {posGeneratedText(language, highRiskSafety.detail)}
                </p>
              </div>
              <span className="w-fit rounded bg-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-widest">
                {posGeneratedText(language, highRiskSafety.mode)}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-[9px] font-black uppercase tracking-widest sm:grid-cols-3">
              {highRiskSafety.controls.map(control => (
                <span key={control} className="rounded bg-white/70 px-2 py-1">
                  {posGeneratedText(language, control)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Decision reasons', '判定理由')}</p>
      <div className="grid gap-2 md:grid-cols-2">
        {evidence.decisionReasons.map((reason) => (
          <div key={reason.label} className="rounded-md border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900">{posGeneratedText(language, reason.label)}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{posGeneratedText(language, reason.reason)}</p>
              </div>
              <span className={cn('rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest', checkTone(reason.state))}>
                {posCheckStateLabel(language, reason.state)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {!canExport && (
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
          {posInlineCopy(language, 'Export is restricted to supervisors and field admins. The report remains visible for local operator reconciliation.', 'エクスポートは監督者または現場管理者に制限されています。レポートはローカル照合用に表示されます。')}
        </p>
      )}
    </section>
  );
};

export const PosOfflineQueueSummary: React.FC<{
  receipts: PosAcceptanceReceipt[];
  syncState: 'idle' | 'loading' | 'error';
  language?: string;
  onRefresh: () => void;
  onClear: () => void;
  onPrint: () => void;
}> = ({ receipts, syncState, language = 'en', onRefresh, onClear, onPrint }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Offline Queue', 'オフラインキュー')}</p>
        <h3 className="mt-1 text-xl font-black text-slate-950">{posInlineCopy(language, 'Local receipts and deferred sync', 'ローカルレシートと遅延同期')}</h3>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
        >
          <Printer className="h-4 w-4" />
          {posInlineCopy(language, 'Print', '印刷')}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={syncState === 'loading'}
          className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-700 disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4', syncState === 'loading' && 'animate-spin')} />
          {posInlineCopy(language, 'Sync', '同期')}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
        >
          {posInlineCopy(language, 'Clear', '消去')}
        </button>
      </div>
    </div>
    <div className="mb-3 grid gap-3 md:grid-cols-3">
      <div className="rounded-md bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Local receipts', 'ローカルレシート')}</p>
        <p className="mt-1 text-2xl font-black text-slate-950">{receipts.length}</p>
      </div>
      <div className={cn('rounded-md p-3', syncState === 'error' ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900')}>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{posInlineCopy(language, 'Sync state', '同期状態')}</p>
        <p className="mt-1 text-2xl font-black">{posSyncStateLabel(language, syncState)}</p>
      </div>
      <div className="rounded-md bg-sky-50 p-3 text-sky-950">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{posInlineCopy(language, 'Privacy', 'プライバシー')}</p>
        <p className="mt-1 text-sm font-black">{posInlineCopy(language, 'No raw payload storage', '生ペイロードは保存しない')}</p>
      </div>
    </div>
  </section>
);

export const PosTerminalHero: React.FC<{
  terminalId: string;
  scannerMessage: string;
  language?: string;
  runtimePolicy?: PosRuntimePolicy;
}> = ({ terminalId, scannerMessage, language = 'en', runtimePolicy }) => (
  <div className="relative overflow-hidden rounded-lg bg-slate-950 p-5 text-white md:p-6">
    <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-md border border-white/15 bg-white/10">
          <CreditCard className="h-7 w-7" />
        </div>
        <div>
          <h4 className="text-2xl font-black tracking-tight">AGID POS Terminal</h4>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/55">
            <span>{terminalId}</span>
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            <span>{scannerMessage}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 md:items-end">
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
            {posInlineCopy(language, 'Raw payload: no-store', '生ペイロード: 保存なし')}
          </span>
        </div>
        {runtimePolicy && (
          <p className="max-w-md text-[10px] font-bold leading-4 text-white/45 md:text-right">
            {posInlineCopy(
              language,
              'UI/API stay TypeScript; deterministic predicates and proof work move to Rust/WASM or ZK circuits.',
              'UI/APIはTypeScript、決定的述語と証明処理はRust/WASMまたはZK回路へ分離します。',
            )}
          </p>
        )}
      </div>
    </div>
  </div>
);

export const PosModeSelector: React.FC<{
  mode: PosAcceptanceChannel;
  modes: PosModeOption[];
  onChange: (mode: PosAcceptanceChannel) => void;
}> = ({ mode, modes, onChange }) => (
  <div className="grid gap-3 md:grid-cols-3">
    {modes.map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => onChange(item.id)}
        className={cn(
          'flex items-center justify-between rounded-md border p-4 text-left transition-all active:scale-[0.98]',
          mode === item.id
            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
            : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50',
        )}
      >
        <span className="flex items-center gap-3">
          <span className={cn(
            'flex h-10 w-10 items-center justify-center rounded-md',
            mode === item.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600',
          )}>
            {item.icon}
          </span>
          <span>
            <span className="block text-sm font-black">{item.label}</span>
            <span className={cn(
              'block text-[10px] font-black uppercase tracking-widest',
              mode === item.id ? 'text-white/45' : 'text-slate-400',
            )}>
              {item.detail}
            </span>
          </span>
        </span>
      </button>
    ))}
  </div>
);

const POS_RECIPIENT_PROOF_METHODS: Array<{
  id: ShippingLabelRecipientProofMethod;
  label: string;
  detail: string;
}> = [
  {
    id: 'recipient-secret-commitment',
    label: 'Code',
    detail: 'one-time secret',
  },
  {
    id: 'passkey-webauthn',
    label: 'Passkey',
    detail: 'WebAuthn evidence',
  },
  {
    id: 'aoid-credential',
    label: 'AOID',
    detail: 'credential proof',
  },
  {
    id: 'nfc-card',
    label: 'NFC',
    detail: 'card secret',
  },
];

function recipientProofInputPlaceholder(method: ShippingLabelRecipientProofMethod) {
  return method === 'passkey-webauthn'
    ? 'passkey / WebAuthn assertion secret or handle'
    : method === 'aoid-credential'
      ? 'AOID credential holder secret or proof seed'
      : method === 'nfc-card'
        ? 'NFC card secret, tag handle, or card assertion'
        : 'one-time recipient proof secret for handoff authority';
}

function recipientProofInputPlaceholderLocalized(method: ShippingLabelRecipientProofMethod, language = 'en') {
  if (!isJapanesePosLanguage(language)) return recipientProofInputPlaceholder(method);
  return method === 'passkey-webauthn'
    ? 'Passkey / WebAuthn のアサーション秘密またはハンドル'
    : method === 'aoid-credential'
      ? 'AOID credential の保持者秘密または証明シード'
      : method === 'nfc-card'
        ? 'NFCカード秘密、タグハンドル、またはカード証跡'
        : '引き渡し権限用のワンタイム受取人秘密';
}

function recipientProofPanelDetail(method: ShippingLabelRecipientProofMethod) {
  return method === 'passkey-webauthn'
    ? 'Stores only a domain-separated commitment to Passkey/WebAuthn evidence.'
    : method === 'aoid-credential'
      ? 'Stores only a domain-separated commitment to AOID credential material.'
      : method === 'nfc-card'
        ? 'Stores only a domain-separated commitment to NFC card evidence.'
        : 'Stores only a domain-separated commitment to a one-time recipient secret.';
}

function recipientProofPanelDetailLocalized(method: ShippingLabelRecipientProofMethod, language = 'en') {
  if (!isJapanesePosLanguage(language)) return recipientProofPanelDetail(method);
  return method === 'passkey-webauthn'
    ? 'Passkey/WebAuthn証跡の用途分離commitmentだけを保存します。'
    : method === 'aoid-credential'
      ? 'AOID credential材料の用途分離commitmentだけを保存します。'
      : method === 'nfc-card'
        ? 'NFCカード証跡の用途分離commitmentだけを保存します。'
        : 'ワンタイム受取人秘密の用途分離commitmentだけを保存します。';
}

export const PosReaderShell: React.FC<{
  mode: PosAcceptanceChannel;
  language?: string;
  qrReaderId: string;
  qrRunning: boolean;
  nfcSupported: boolean;
  nfcState: 'idle' | 'waiting' | 'unsupported' | 'error';
  payloadText: string;
  shippingScanRole: ShippingLabelScanRole;
  shippingRiskLevel: ShippingLabelRiskLevel;
  recipientProofMethod: ShippingLabelRecipientProofMethod;
  recipientProofCode: string;
  recipientChallenge: string;
  recipientChallengeSignature: string;
  storePosId: string;
  carrierTerminalId: string;
  carrierTerminalSignature: string;
  carrierTerminalSignedAt: string;
  carrierLocationLat: string;
  carrierLocationLon: string;
  carrierLocationAccuracyMeters: string;
  carrierLocationLabel: string;
  addressRiskAddressDefect: boolean;
  addressRiskUndeliverableRegion: boolean;
  addressRiskPoBox: boolean;
  addressRiskAutoLock: boolean;
  addressRiskAoidAccessProfileConfirmed: boolean;
  isSubmitting: boolean;
  onPayloadChange: (value: string) => void;
  onShippingScanRoleChange: (value: ShippingLabelScanRole) => void;
  onShippingRiskLevelChange: (value: ShippingLabelRiskLevel) => void;
  onRecipientProofMethodChange: (value: ShippingLabelRecipientProofMethod) => void;
  onRecipientProofCodeChange: (value: string) => void;
  onRecipientChallengeChange: (value: string) => void;
  onRecipientChallengeSignatureChange: (value: string) => void;
  onStorePosIdChange: (value: string) => void;
  onCarrierTerminalIdChange: (value: string) => void;
  onCarrierTerminalSignatureChange: (value: string) => void;
  onCarrierTerminalSignedAtChange: (value: string) => void;
  onCarrierLocationLatChange: (value: string) => void;
  onCarrierLocationLonChange: (value: string) => void;
  onCarrierLocationAccuracyMetersChange: (value: string) => void;
  onCarrierLocationLabelChange: (value: string) => void;
  onAddressRiskAddressDefectChange: (value: boolean) => void;
  onAddressRiskUndeliverableRegionChange: (value: boolean) => void;
  onAddressRiskPoBoxChange: (value: boolean) => void;
  onAddressRiskAutoLockChange: (value: boolean) => void;
  onAddressRiskAoidAccessProfileConfirmedChange: (value: boolean) => void;
  onIssueRecipientChallenge: () => void;
  onStartQr: () => void;
  onStopQr: () => void;
  onStartNfc: () => void;
  onSubmit: () => void;
  onWrapNfc: () => void;
  onDecryptAgidSecure: () => void;
  onBuildWaybillQr: () => void;
}> = ({
  mode,
  language = 'en',
  qrReaderId,
  qrRunning,
  nfcSupported,
  nfcState,
  payloadText,
  shippingScanRole,
  shippingRiskLevel,
  recipientProofMethod,
  recipientProofCode,
  recipientChallenge,
  recipientChallengeSignature,
  storePosId,
  carrierTerminalId,
  carrierTerminalSignature,
  carrierTerminalSignedAt,
  carrierLocationLat,
  carrierLocationLon,
  carrierLocationAccuracyMeters,
  carrierLocationLabel,
  addressRiskAddressDefect,
  addressRiskUndeliverableRegion,
  addressRiskPoBox,
  addressRiskAutoLock,
  addressRiskAoidAccessProfileConfirmed,
  isSubmitting,
  onPayloadChange,
  onShippingScanRoleChange,
  onShippingRiskLevelChange,
  onRecipientProofMethodChange,
  onRecipientProofCodeChange,
  onRecipientChallengeChange,
  onRecipientChallengeSignatureChange,
  onStorePosIdChange,
  onCarrierTerminalIdChange,
  onCarrierTerminalSignatureChange,
  onCarrierTerminalSignedAtChange,
  onCarrierLocationLatChange,
  onCarrierLocationLonChange,
  onCarrierLocationAccuracyMetersChange,
  onCarrierLocationLabelChange,
  onAddressRiskAddressDefectChange,
  onAddressRiskUndeliverableRegionChange,
  onAddressRiskPoBoxChange,
  onAddressRiskAutoLockChange,
  onAddressRiskAoidAccessProfileConfirmedChange,
  onIssueRecipientChallenge,
  onStartQr,
  onStopQr,
  onStartNfc,
  onSubmit,
  onWrapNfc,
  onDecryptAgidSecure,
  onBuildWaybillQr,
}) => (
  <div className="rounded-lg border border-slate-100 bg-white p-4 md:p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Acceptance', '受付')}</p>
        <h5 className="text-lg font-black text-slate-900">
          {mode.toUpperCase()} {posInlineCopy(language, 'Reader', 'リーダー')}
        </h5>
      </div>
      {mode === 'qr' && (
        <button
          type="button"
          onClick={qrRunning ? onStopQr : onStartQr}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-60',
            qrRunning ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-blue-600',
          )}
        >
          {qrRunning ? <StopCircle className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />}
          {qrRunning ? posInlineCopy(language, 'Stop', '停止') : posInlineCopy(language, 'Start', '開始')}
        </button>
      )}
      {mode === 'nfc' && (
        <button
          type="button"
          onClick={onStartNfc}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-600"
        >
          <RadioReceiver className="h-4 w-4" />
          {posInlineCopy(language, 'Listen', '待機')}
        </button>
      )}
    </div>

    {mode === 'qr' && (
      <div className="overflow-hidden rounded-md border border-slate-100 bg-slate-50 p-3">
        <div id={qrReaderId} className="min-h-[260px]" />
      </div>
    )}

    {mode === 'nfc' && (
      <div className={cn(
        'rounded-md border p-4',
        nfcState === 'unsupported'
          ? 'border-amber-100 bg-amber-50 text-amber-900'
          : 'border-slate-100 bg-slate-50 text-slate-700',
      )}>
        <div className="flex items-center gap-3">
          <RadioReceiver className="h-5 w-5" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest">NFC {posNfcStateLabel(language, nfcState)}</p>
            <p className="text-xs font-bold text-slate-500">
              {nfcSupported ? posInlineCopy(language, 'NDEF reader available', 'NDEFリーダーを利用できます') : posInlineCopy(language, 'Use manual fallback on this browser', 'このブラウザでは手入力を使用してください')}
            </p>
          </div>
        </div>
      </div>
    )}

    <div className="mt-4 space-y-3">
      <textarea
        value={payloadText}
        onChange={(event) => onPayloadChange(event.target.value)}
        placeholder={posInlineCopy(language, 'agid:address:..., agid:waybill:..., agid:nfc:..., AGIDS1-..., or direct public AGID', 'agid:address:..., agid:waybill:..., agid:nfc:..., AGIDS1-..., または公開AGID')}
        className="min-h-[120px] w-full resize-none rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-700 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      />
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Shipping Label QR', '送り状QR')}</p>
              <p className="text-xs font-bold text-slate-600">
                {posInlineCopy(language, 'Carrier scan validates the address reference; recipient scan proves handoff authority without storing the code.', '配送業者スキャンは住所参照を検証し、受取人スキャンはコードを保存せずに引き渡し権限を証明します。')}
              </p>
            </div>
          </div>
          {payloadText.trim().startsWith('agid:waybill:') && (
            <div className="rounded-md border border-slate-200 bg-white p-2">
              <QRCodeCanvas value={payloadText} size={92} level="H" includeMargin={false} />
            </div>
          )}
        </div>
        <div className="mb-2 grid gap-1 rounded-md bg-white p-1 md:grid-cols-4">
          {POS_RECIPIENT_PROOF_METHODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onRecipientProofMethodChange(item.id)}
              className={cn(
                'inline-flex min-h-12 flex-col items-start justify-center rounded px-3 text-left transition-all',
                recipientProofMethod === item.id
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100',
              )}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">{posRecipientProofMethodLabel(item.id, language)}</span>
              <span className={cn(
                'mt-1 text-[9px] font-black uppercase tracking-widest',
                recipientProofMethod === item.id ? 'text-white/45' : 'text-slate-400',
              )}>
                {posRecipientProofMethodDetail(item.id, language)}
              </span>
            </button>
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-[180px_160px_minmax(0,1fr)_auto]">
          <div className="grid grid-cols-2 gap-1 rounded-md bg-white p-1">
            {[
              { id: 'carrier' as const, label: posShippingScanRoleLabel(language, 'carrier'), icon: <Truck className="h-4 w-4" /> },
              { id: 'recipient' as const, label: posShippingScanRoleLabel(language, 'recipient'), icon: <UserCheck className="h-4 w-4" /> },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onShippingScanRoleChange(item.id)}
                className={cn(
                  'inline-flex min-h-10 items-center justify-center gap-2 rounded px-2 text-[10px] font-black uppercase tracking-widest transition-all',
                  shippingScanRole === item.id
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-500 hover:bg-slate-100',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-md bg-white p-1">
            {[
              { id: 'standard' as const, label: posRiskLevelLabel(language, 'standard') },
              { id: 'high' as const, label: posRiskLevelLabel(language, 'high') },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onShippingRiskLevelChange(item.id)}
                className={cn(
                  'inline-flex min-h-10 items-center justify-center rounded px-2 text-[10px] font-black uppercase tracking-widest transition-all',
                  shippingRiskLevel === item.id
                    ? item.id === 'high'
                      ? 'bg-rose-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            value={recipientProofCode}
            onChange={(event) => onRecipientProofCodeChange(event.target.value)}
            placeholder={recipientProofInputPlaceholderLocalized(recipientProofMethod, language)}
            className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
          />
          <button
            type="button"
            onClick={onBuildWaybillQr}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-600"
          >
            <PackageCheck className="h-4 w-4" />
            {posInlineCopy(language, 'Build QR', 'QR作成')}
          </button>
        </div>
        {shippingRiskLevel === 'high' && (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">
                  {posInlineCopy(language, 'High-risk safety mode', '高リスク安全モード')}
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-rose-950">
                  {posInlineCopy(language, 'Use for DV, evacuation, refugee, and humanitarian handoff. Do not expose a precise AGID. Share precise location only through AGID-S, keep expiry short, mark used immediately after receipt, and do not retain address history.', 'DV、避難、難民、人道支援の引き渡しで使用します。精密AGIDは公開せず、正確な位置はAGID-Sだけで共有し、有効期限を短くし、受取後すぐ使用済みにし、住所履歴を保持しません。')}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-[9px] font-black uppercase tracking-widest text-rose-800 sm:grid-cols-4">
              {[
                posInlineCopy(language, 'No precise AGID', '精密AGIDなし'),
                'AGID-S only',
                posInlineCopy(language, 'Short expiry', '短い有効期限'),
                posInlineCopy(language, 'No history', '履歴なし'),
              ].map(item => (
                <span key={item} className="rounded bg-white/70 px-2 py-1">{item}</span>
              ))}
            </div>
          </div>
        )}
        {shippingScanRole === 'carrier' && (
          <div className={cn(
            'mt-3 rounded-md border p-3',
            shippingRiskLevel === 'high'
              ? 'border-rose-200 bg-rose-50'
              : 'border-sky-100 bg-sky-50',
          )}>
            <div className="mb-2 flex items-start gap-2">
              <ShieldCheck className={cn('mt-0.5 h-4 w-4', shippingRiskLevel === 'high' ? 'text-rose-700' : 'text-sky-700')} />
              <div>
                <p className={cn(
                  'text-[10px] font-black uppercase tracking-widest',
                  shippingRiskLevel === 'high' ? 'text-rose-700' : 'text-sky-700',
                )}>
                  {posInlineCopy(language, 'Carrier scan anti-spoofing', '配送業者スキャン偽装対策')}
                </p>
                <p className="text-xs font-bold text-slate-600">
                  {posInlineCopy(language, 'Carrier scans require delivery-terminal evidence. Location is optional and stored only as a coarse bucket; high-risk waybills are widened.', '配送業者スキャンには配送端末証跡が必要です。位置情報は任意で粗い区画としてのみ保存し、高リスク送り状ではさらに粗くします。')}
                </p>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={carrierTerminalId}
                onChange={(event) => onCarrierTerminalIdChange(event.target.value)}
                placeholder={posInlineCopy(language, 'delivery terminal ID', '配送端末ID')}
                className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
              <input
                value={carrierTerminalSignedAt}
                onChange={(event) => onCarrierTerminalSignedAtChange(event.target.value)}
                placeholder={posInlineCopy(language, 'carrier signed time / ISO', '配送業者署名時刻 / ISO')}
                className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
              <input
                value={storePosId}
                onChange={(event) => onStorePosIdChange(event.target.value)}
                placeholder={posInlineCopy(language, 'store / POS ID', '店舗 / POS ID')}
                className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
              <input
                value={carrierTerminalSignature}
                onChange={(event) => onCarrierTerminalSignatureChange(event.target.value)}
                placeholder={posInlineCopy(language, 'delivery terminal signature', '配送端末署名')}
                className="min-h-10 rounded-md border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-4">
              <input
                value={carrierLocationLat}
                onChange={(event) => onCarrierLocationLatChange(event.target.value)}
                inputMode="decimal"
                placeholder={posInlineCopy(language, 'coarse lat optional', '粗い緯度 任意')}
                className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
              <input
                value={carrierLocationLon}
                onChange={(event) => onCarrierLocationLonChange(event.target.value)}
                inputMode="decimal"
                placeholder={posInlineCopy(language, 'coarse lon optional', '粗い経度 任意')}
                className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
              <input
                value={carrierLocationAccuracyMeters}
                onChange={(event) => onCarrierLocationAccuracyMetersChange(event.target.value)}
                inputMode="numeric"
                placeholder={posInlineCopy(language, 'accuracy meters optional', '精度m 任意')}
                className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
              <input
                value={carrierLocationLabel}
                onChange={(event) => onCarrierLocationLabelChange(event.target.value)}
                placeholder={posInlineCopy(language, 'location label optional', '位置ラベル 任意')}
                className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        )}
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="mb-3 flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                {posInlineCopy(language, 'Carrier intake findings', '配送受付所見')}
              </p>
              <p className="text-xs font-bold leading-5 text-amber-950">
                {posInlineCopy(language, 'Mark operational refusal reasons before accepting the waybill. The receipt stores reason codes and policy flags only, not raw address text.', '送り状受付前に運用上の拒否理由を記録します。レシートに保存するのは理由コードとポリシーフラグだけで、住所本文は保存しません。')}
              </p>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                checked: addressRiskAddressDefect,
                onChange: onAddressRiskAddressDefectChange,
                label: posInlineCopy(language, 'Address defect', '住所不備'),
                detail: posInlineCopy(language, 'missing or inconsistent fields', '不足・不整合'),
              },
              {
                checked: addressRiskUndeliverableRegion,
                onChange: onAddressRiskUndeliverableRegionChange,
                label: posInlineCopy(language, 'Undeliverable area', '配送不能地域'),
                detail: posInlineCopy(language, 'carrier cannot serve', '配送不可'),
              },
              {
                checked: addressRiskPoBox,
                onChange: onAddressRiskPoBoxChange,
                label: 'P.O. Box',
                detail: posInlineCopy(language, 'box destination', '私書箱宛先'),
              },
              {
                checked: addressRiskAutoLock,
                onChange: onAddressRiskAutoLockChange,
                label: posInlineCopy(language, 'Auto-lock', 'オートロック'),
                detail: posInlineCopy(language, 'access restricted', '入館制限'),
              },
              {
                checked: addressRiskAoidAccessProfileConfirmed,
                onChange: onAddressRiskAoidAccessProfileConfirmedChange,
                label: posInlineCopy(language, 'AOID profile OK', 'AOID登録済み'),
                detail: posInlineCopy(language, 'access kind confirmed', 'アクセス種別確認'),
              },
            ].map((item) => (
              <label
                key={item.label}
                className={cn(
                  'flex min-h-14 items-center gap-3 rounded-md border px-3 py-2 transition-colors',
                  item.checked
                    ? 'border-amber-300 bg-white text-amber-900 shadow-sm'
                    : 'border-transparent bg-white/55 text-slate-500',
                )}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(event) => item.onChange(event.target.checked)}
                  className="h-4 w-4 rounded border-amber-300"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[9px] font-black uppercase tracking-widest opacity-55">{item.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className={cn(
          'mt-3 rounded-md border p-3',
          shippingRiskLevel === 'high'
            ? 'border-rose-200 bg-rose-50'
            : 'border-slate-200 bg-white',
        )}>
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={cn(
                'text-[10px] font-black uppercase tracking-widest',
                shippingRiskLevel === 'high' ? 'text-rose-700' : 'text-slate-400',
              )}>
                {posInlineCopy(language, 'QR Copy Protection', 'QRコピー対策')}
              </p>
              <p className="text-xs font-bold text-slate-600">
                {posInlineCopy(language, 'High risk requires a POS challenge and recipient-side signature before release.', '高リスクでは引き渡し前にPOSチャレンジと受取人側署名が必要です。')}
              </p>
            </div>
            <button
              type="button"
              onClick={onIssueRecipientChallenge}
              className={cn(
                'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-[10px] font-black uppercase tracking-widest transition-all',
                shippingRiskLevel === 'high'
                  ? 'bg-rose-600 text-white hover:bg-slate-900'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              {posInlineCopy(language, 'Issue Challenge', 'チャレンジ発行')}
            </button>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={recipientChallenge}
              onChange={(event) => onRecipientChallengeChange(event.target.value)}
              placeholder={posInlineCopy(language, 'POS challenge nonce', 'POSチャレンジnonce')}
              className="min-h-10 rounded-md border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
            <input
              value={recipientChallengeSignature}
              onChange={(event) => onRecipientChallengeSignatureChange(event.target.value)}
              placeholder={posInlineCopy(language, 'recipient signature / passkey result', '受取人署名 / Passkey結果')}
              className="min-h-10 rounded-md border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>
        <div className="mt-3 grid gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:grid-cols-4">
          {[
            ['1', posInlineCopy(language, 'Address Valid', '住所有効'), posInlineCopy(language, 'AGID/AOID/address reference', 'AGID/AOID/住所参照')],
            ['2', posInlineCopy(language, 'Carrier Accepted', '配送業者受理'), posInlineCopy(language, 'carrier accepted waybill', '配送業者が送り状を受理')],
            ['3', posInlineCopy(language, 'Recipient Controlled', '受取人管理'), posInlineCopy(language, 'proof code / credential / passkey', '証明コード / credential / passkey')],
            ['4', posInlineCopy(language, 'Delivery Completed', '配送完了'), posInlineCopy(language, 'dual scan + time + terminal signature', '双方スキャン + 時刻 + 端末署名')],
          ].map(([step, label, detail]) => (
            <div key={step} className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <span className="text-blue-600">{step}</span>
              <span className="ml-2 text-slate-700">{label}</span>
              <p className="mt-1 text-[9px] text-slate-400">{detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {recipientProofPanelDetailLocalized(recipientProofMethod, language)} {posInlineCopy(language, 'The QR stores a short-term waybill alias, jti, short expiry, nullifier, address commitment, proof domain, proof nonce, and recipient commitment. It does not store raw address text, raw AGID, raw waybill id, or proof code.', 'QRには短期送り状エイリアス、jti、短い有効期限、nullifier、住所commitment、証明domain、証明nonce、受取人commitmentだけを保存します。生住所、AGID本体、生送り状ID、証明コードは保存しません。')}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-900 disabled:opacity-60"
        >
          <ClipboardCheck className="h-4 w-4" />
          {isSubmitting ? posInlineCopy(language, 'Verifying', '検証中') : posInlineCopy(language, 'Accept', '受付')}
        </button>
        <button
          type="button"
          onClick={onWrapNfc}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
        >
          <RadioReceiver className="h-4 w-4" />
          {posInlineCopy(language, 'NFC Wrap', 'NFC化')}
        </button>
        <button
          type="button"
          onClick={onDecryptAgidSecure}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-60"
        >
          <LockOpen className="h-4 w-4" />
          {posInlineCopy(language, 'Open AGID-S', 'AGID-S復号')}
        </button>
      </div>
    </div>
  </div>
);

export const SecureAgidKeyPanel: React.FC<{
  keys: PosSecureKeyEntry[];
  registry: PosAgidSecureRegistryStatus | null;
  openPreview: SecureOpenPreview;
  isDecrypting: boolean;
  language?: string;
  onGenerateKey: () => void;
  onRotateKey: (keyId: string) => void;
  onDecrypt: () => void;
  onRefreshRegistry: () => void;
}> = ({
  keys,
  registry,
  openPreview,
  isDecrypting,
  language = 'en',
  onGenerateKey,
  onRotateKey,
  onDecrypt,
  onRefreshRegistry,
}) => {
  const counts = {
    active: keys.filter(key => key.status === 'active').length,
    retiring: keys.filter(key => key.status === 'retiring').length,
    revoked: keys.filter(key => key.status === 'revoked').length,
    recipients: new Set(keys.map(key => key.recipientId).filter(Boolean)).size,
  };
  const stale = registry?.freshUntil ? Date.parse(registry.freshUntil) <= Date.now() : true;

  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'AGID-S Keys', 'AGID-S鍵')}</p>
            <p className="text-sm font-black text-slate-900">{posInlineCopy(language, 'Terminal-only decryption', '端末内のみで復号')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefreshRegistry}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-all hover:bg-slate-50"
            title={posInlineCopy(language, 'Refresh registry', 'レジストリ更新')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onGenerateKey}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white transition-all hover:bg-blue-600"
            title={posInlineCopy(language, 'Generate recipient key', '受取人鍵を生成')}
          >
            <KeyRound className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          [posInlineCopy(language, 'active', '有効'), counts.active],
          [posInlineCopy(language, 'retiring', '移行中'), counts.retiring],
          [posInlineCopy(language, 'revoked', '失効'), counts.revoked],
          [posInlineCopy(language, 'recipients', '受取人'), counts.recipients],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md bg-slate-50 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className={cn(
        'mt-3 rounded-md border p-3 text-xs font-bold',
        stale ? 'border-amber-100 bg-amber-50 text-amber-900' : 'border-emerald-100 bg-emerald-50 text-emerald-900',
      )}>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <DatabaseZap className="h-4 w-4" />
            {posInlineCopy(language, 'Registry', 'レジストリ')} {stale ? posInlineCopy(language, 'needs refresh', '要更新') : posInlineCopy(language, 'fresh', '鮮度OK')}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
            {posInlineCopy(language, 'used', '使用済み')} {registry?.usedCount ?? 0}
          </span>
        </div>
        <p className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-60">
          {registry?.registryId || posInlineCopy(language, 'local registry', 'ローカルレジストリ')} / {posInlineCopy(language, 'revocations', '失効')} {(registry?.revokedTokenCount ?? 0) + (registry?.revokedKeyCount ?? 0)}
        </p>
      </div>

      <div className="mt-3 max-h-[188px] space-y-2 overflow-y-auto pr-1">
        {keys.length === 0 && (
          <p className="rounded-md bg-slate-50 p-3 text-xs font-bold text-slate-400">
            {posInlineCopy(language, 'Generate or import per-recipient keys before opening AGID-S.', 'AGID-Sを開く前に、受取人別鍵を生成またはインポートしてください。')}
          </p>
        )}
        {keys.slice(0, 6).map((key) => (
          <div key={key.keyId} className="rounded-md border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-slate-800">{posSecureKeyDisplayLabel(language, key)}</p>
                <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {key.keyId} / {key.recipientId || posInlineCopy(language, 'terminal', '端末')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRotateKey(key.keyId)}
                disabled={key.status === 'revoked'}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-40"
                title={posInlineCopy(language, 'Rotate key', '鍵ローテーション')}
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className={cn(
              'mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest',
              key.status === 'active' && 'bg-emerald-100 text-emerald-700',
              key.status === 'retiring' && 'bg-amber-100 text-amber-700',
              key.status === 'revoked' && 'bg-rose-100 text-rose-700',
            )}>
              {posKeyStatusLabel(language, key.status)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onDecrypt}
          disabled={isDecrypting || keys.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-900 disabled:opacity-60"
        >
          <LockOpen className="h-4 w-4" />
          {isDecrypting ? posInlineCopy(language, 'Opening', '開封中') : posInlineCopy(language, 'Decrypt', '復号')}
        </button>
        <div className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <Users className="h-4 w-4" />
          {posInlineCopy(language, 'Per-recipient', '受取人別')}
        </div>
      </div>

      {openPreview.status !== 'idle' && (
        <div className={cn(
          'mt-3 rounded-md p-3 text-xs font-bold',
          openPreview.status === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800',
        )}>
          <p>{posSecureOpenPreviewMessage(language, openPreview.message)}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-60">
            {openPreview.keyId || posInlineCopy(language, 'no key', '鍵なし')} {openPreview.agidTail ? `/ agid:${openPreview.agidTail}` : ''}
          </p>
          {[...(openPreview.errors ?? []), ...(openPreview.warnings ?? [])].slice(0, 3).map((item) => (
            <p key={item} className="mt-1 rounded-md bg-white/60 px-2 py-1 text-[10px] font-black uppercase tracking-widest">
              {item}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export const PosTerminalSettingsForm: React.FC<{
  terminalId: string;
  operatorId: string;
  purpose: string;
  amount: string;
  appLanguage: string;
  currency: string;
  ethereumPaymentEnabled: boolean;
  paymentKind: PosEthereumPaymentKind;
  settlementMode: PosEthereumSettlementMode;
  paymentStatus: PosEthereumPaymentStatus;
  tokenSymbol: string;
  paymentNetworkId: string;
  observedPaymentTxHash: string;
  releaseAfterHandoff: boolean;
  highRiskPaymentMode: boolean;
  carrierRejectAddressDefect: boolean;
  carrierRejectUndeliverableRegion: boolean;
  carrierRejectPoBox: boolean;
  carrierRejectAutoLock: boolean;
  carrierRequireAoidAccessProfile: boolean;
  onAppLanguageChange: (value: string) => void;
  onTerminalIdChange: (value: string) => void;
  onOperatorIdChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onEthereumPaymentEnabledChange: (value: boolean) => void;
  onPaymentKindChange: (value: PosEthereumPaymentKind) => void;
  onSettlementModeChange: (value: PosEthereumSettlementMode) => void;
  onPaymentStatusChange: (value: PosEthereumPaymentStatus) => void;
  onTokenSymbolChange: (value: string) => void;
  onPaymentNetworkIdChange: (value: string) => void;
  onObservedPaymentTxHashChange: (value: string) => void;
  onReleaseAfterHandoffChange: (value: boolean) => void;
  onHighRiskPaymentModeChange: (value: boolean) => void;
  onCarrierRejectAddressDefectChange: (value: boolean) => void;
  onCarrierRejectUndeliverableRegionChange: (value: boolean) => void;
  onCarrierRejectPoBoxChange: (value: boolean) => void;
  onCarrierRejectAutoLockChange: (value: boolean) => void;
  onCarrierRequireAoidAccessProfileChange: (value: boolean) => void;
}> = ({
  terminalId,
  operatorId,
  purpose,
  amount,
  appLanguage,
  currency,
  ethereumPaymentEnabled,
  paymentKind,
  settlementMode,
  paymentStatus,
  tokenSymbol,
  paymentNetworkId,
  observedPaymentTxHash,
  releaseAfterHandoff,
  highRiskPaymentMode,
  carrierRejectAddressDefect,
  carrierRejectUndeliverableRegion,
  carrierRejectPoBox,
  carrierRejectAutoLock,
  carrierRequireAoidAccessProfile,
  onAppLanguageChange,
  onTerminalIdChange,
  onOperatorIdChange,
  onPurposeChange,
  onAmountChange,
  onCurrencyChange,
  onEthereumPaymentEnabledChange,
  onPaymentKindChange,
  onSettlementModeChange,
  onPaymentStatusChange,
  onTokenSymbolChange,
  onPaymentNetworkIdChange,
  onObservedPaymentTxHashChange,
  onReleaseAfterHandoffChange,
  onHighRiskPaymentModeChange,
  onCarrierRejectAddressDefectChange,
  onCarrierRejectUndeliverableRegionChange,
  onCarrierRejectPoBoxChange,
  onCarrierRejectAutoLockChange,
  onCarrierRequireAoidAccessProfileChange,
}) => {
  const selectedLanguage = APP_LANGUAGES.find(language => language.code === appLanguage);
  const languageDirection = getLanguageDirection(appLanguage).toUpperCase();
  const t = (key: PosSettingsCopyKey) => posSettingsCopy(appLanguage, key);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('displayLanguage')}</span>
          <select
            value={appLanguage}
            onChange={(event) => onAppLanguageChange(event.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
          >
            {APP_LANGUAGES.map(language => (
              <option key={language.code} value={language.code}>
                {language.flag} {language.name} - {language.country}
              </option>
            ))}
          </select>
          <div className="grid gap-2 rounded-md bg-slate-50 px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 md:grid-cols-2">
            <p>
              {t('activeLanguage')}: {selectedLanguage ? `${selectedLanguage.flag} ${selectedLanguage.name}` : appLanguage}
            </p>
            <p>{t('textDirection')}: {languageDirection}</p>
          </div>
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t('languageHelp')}
          </p>
        </label>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('terminalIdentity')}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{t('terminalIdentityHelp')}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('terminalId')}</span>
            <input
              value={terminalId}
              onChange={(event) => onTerminalIdChange(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
          <label className="space-y-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('operator')}</span>
            <input
              value={operatorId}
              onChange={(event) => onOperatorIdChange(event.target.value)}
              placeholder={t('optional')}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('carrierAcceptancePolicy')}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{t('carrierAcceptancePolicyHelp')}</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex min-h-14 items-center gap-3 rounded-md bg-rose-50 px-3 py-3 text-xs font-black uppercase tracking-widest text-rose-800">
            <input
              type="checkbox"
              checked={carrierRejectAddressDefect}
              onChange={(event) => onCarrierRejectAddressDefectChange(event.target.checked)}
              className="h-4 w-4 rounded border-rose-300"
            />
            <span>{t('rejectAddressDefect')}</span>
          </label>
          <label className="flex min-h-14 items-center gap-3 rounded-md bg-rose-50 px-3 py-3 text-xs font-black uppercase tracking-widest text-rose-800">
            <input
              type="checkbox"
              checked={carrierRejectUndeliverableRegion}
              onChange={(event) => onCarrierRejectUndeliverableRegionChange(event.target.checked)}
              className="h-4 w-4 rounded border-rose-300"
            />
            <span>{t('rejectUndeliverableRegion')}</span>
          </label>
          <label className="flex min-h-14 items-center gap-3 rounded-md bg-amber-50 px-3 py-3 text-xs font-black uppercase tracking-widest text-amber-800">
            <input
              type="checkbox"
              checked={carrierRejectPoBox}
              onChange={(event) => onCarrierRejectPoBoxChange(event.target.checked)}
              className="h-4 w-4 rounded border-amber-300"
            />
            <span>{t('rejectPoBox')}</span>
          </label>
          <label className="flex min-h-14 items-center gap-3 rounded-md bg-amber-50 px-3 py-3 text-xs font-black uppercase tracking-widest text-amber-800">
            <input
              type="checkbox"
              checked={carrierRejectAutoLock}
              onChange={(event) => onCarrierRejectAutoLockChange(event.target.checked)}
              className="h-4 w-4 rounded border-amber-300"
            />
            <span>{t('rejectAutoLock')}</span>
          </label>
          <label className="flex min-h-14 items-center gap-3 rounded-md bg-blue-50 px-3 py-3 text-xs font-black uppercase tracking-widest text-blue-900 md:col-span-2">
            <input
              type="checkbox"
              checked={carrierRequireAoidAccessProfile}
              onChange={(event) => onCarrierRequireAoidAccessProfileChange(event.target.checked)}
              className="h-4 w-4 rounded border-blue-300"
            />
            <span>{t('requireAoidAccessProfile')}</span>
          </label>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('ethereumPayment')}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{t('ethereumPaymentHelp')}</p>
        </div>
        <label className="mb-3 flex items-center gap-3 rounded-md bg-blue-50 px-3 py-3 text-xs font-black uppercase tracking-widest text-blue-900">
          <input
            type="checkbox"
            checked={ethereumPaymentEnabled}
            onChange={(event) => onEthereumPaymentEnabledChange(event.target.checked)}
            className="h-4 w-4 rounded border-blue-300"
          />
          <span>{t('enableEthereumPayment')}</span>
        </label>
        <div className={cn('grid gap-3 md:grid-cols-2', !ethereumPaymentEnabled && 'opacity-50')}>
          <label className="space-y-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('paymentKind')}</span>
            <select
              value={paymentKind}
              disabled={!ethereumPaymentEnabled}
              onChange={(event) => onPaymentKindChange(event.target.value as PosEthereumPaymentKind)}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="prepaid">{t('prepaid')}</option>
              <option value="collect-on-delivery">{t('collectOnDelivery')}</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('settlementMode')}</span>
            <select
              value={settlementMode}
              disabled={!ethereumPaymentEnabled}
              onChange={(event) => onSettlementModeChange(event.target.value as PosEthereumSettlementMode)}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="offchain-observed">{t('offchainObserved')}</option>
              <option value="ethereum-registry">{t('ethereumRegistry')}</option>
              <option value="ethereum-escrow">{t('ethereumEscrow')}</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('paymentStatus')}</span>
            <select
              value={paymentStatus}
              disabled={!ethereumPaymentEnabled}
              onChange={(event) => onPaymentStatusChange(event.target.value as PosEthereumPaymentStatus)}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            >
              {[
                'requires-payment',
                'authorized',
                'escrowed',
                'paid',
                'released',
                'refunded',
                'cancelled',
                'rejected',
                'review',
              ].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('tokenSymbol')}</span>
            <input
              value={tokenSymbol}
              disabled={!ethereumPaymentEnabled}
              onChange={(event) => onTokenSymbolChange(event.target.value.toUpperCase())}
              maxLength={12}
              placeholder="USDC"
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
          <label className="space-y-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('paymentNetworkId')}</span>
            <input
              value={paymentNetworkId}
              disabled={!ethereumPaymentEnabled}
              onChange={(event) => onPaymentNetworkIdChange(event.target.value)}
              placeholder="base-sepolia"
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
          <label className="space-y-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('observedTxHash')}</span>
            <input
              value={observedPaymentTxHash}
              disabled={!ethereumPaymentEnabled}
              onChange={(event) => onObservedPaymentTxHashChange(event.target.value)}
              placeholder="0x..."
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 font-mono text-xs font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
          <label className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-600">
            <input
              type="checkbox"
              checked={releaseAfterHandoff}
              disabled={!ethereumPaymentEnabled}
              onChange={(event) => onReleaseAfterHandoffChange(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span>{t('releaseAfterHandoff')}</span>
          </label>
          <label className="flex items-center gap-3 rounded-md bg-amber-50 px-3 py-3 text-xs font-black uppercase tracking-widest text-amber-800">
            <input
              type="checkbox"
              checked={highRiskPaymentMode}
              disabled={!ethereumPaymentEnabled}
              onChange={(event) => onHighRiskPaymentModeChange(event.target.checked)}
              className="h-4 w-4 rounded border-amber-300"
            />
            <span>{t('highRiskPayment')}</span>
          </label>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('transactionContext')}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{t('transactionContextHelp')}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('purpose')}</span>
            <input
              value={purpose}
              onChange={(event) => onPurposeChange(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
          <label className="space-y-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('amount')}</span>
            <input
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
          <label className="space-y-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('currency')}</span>
            <input
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value.toUpperCase())}
              maxLength={3}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('productionChecklist')}</p>
        <p className="mt-1 text-xs font-bold text-slate-500">{t('productionChecklistHelp')}</p>
        <ul className="mt-3 grid gap-2 text-xs font-bold text-slate-600 md:grid-cols-2">
          {[t('checkLanguage'), t('checkOperator'), t('checkRegistry'), t('checkDevices'), t('checkCarrierPolicy')].map(item => (
            <li key={item} className="flex gap-2 rounded-md bg-slate-50 px-3 py-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const LatestReceiptPanel: React.FC<{
  receipt: PosAcceptanceReceipt | null;
  language?: string;
  onPrintReceipt?: () => void;
  onPrintShippingSlip?: () => void;
}> = ({ receipt, language = 'en', onPrintReceipt, onPrintShippingSlip }) => (
  <div className={cn('rounded-lg border p-4 md:p-5', receiptTone(receipt?.status))}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{posInlineCopy(language, 'Latest Receipt', '最新レシート')}</p>
        <p className="mt-1 text-xl font-black">{receipt?.receiptId || posInlineCopy(language, 'No receipt', 'レシートなし')}</p>
      </div>
      <div className="flex items-center gap-2">
        {receipt && onPrintReceipt && (
          <button
            type="button"
            onClick={onPrintReceipt}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/70 text-slate-600 shadow-sm transition-colors hover:bg-white"
            title={posInlineCopy(language, 'Print redacted receipt', '秘匿レシートを印刷')}
          >
            <Printer className="h-4 w-4" />
          </button>
        )}
        {statusIcon(receipt?.status)}
      </div>
    </div>
    {receipt?.shippingLabel && onPrintShippingSlip && (
      <button
        type="button"
        onClick={onPrintShippingSlip}
        className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-white/70 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm hover:bg-white"
      >
        <Printer className="h-4 w-4" />
        {posInlineCopy(language, 'Print waybill slip', '送り状控えを印刷')}
      </button>
    )}
    {receipt ? (
      <div className="space-y-3 text-xs font-bold">
        <div className="rounded-md bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{posInlineCopy(language, 'Status', '状態')}</p>
          <p className="mt-1 uppercase">{posReceiptStatusLabel(language, receipt.status)}</p>
        </div>
        {receipt.record && (
          <div className="rounded-md bg-white/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{posInlineCopy(language, 'Record', '記録')}</p>
            <p className="mt-1">{receipt.record.label}</p>
          </div>
        )}
        {receipt.ethereumPayment && (
          <div className="rounded-md bg-white/70 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{posInlineCopy(language, 'Ethereum Payment', 'Ethereum支払い')}</p>
              <span className={cn(
                'w-fit rounded px-2 py-1 text-[10px] font-black uppercase tracking-widest',
                receipt.ethereumPayment.handoffGate.canReleasePackage
                  ? 'bg-emerald-100 text-emerald-700'
                  : receipt.ethereumPayment.accepted
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700',
              )}>
                {posGeneratedText(language, receipt.ethereumPayment.status)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Kind', '種別')}: {posGeneratedText(language, receipt.ethereumPayment.paymentKind)}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Mode', 'モード')}: {posGeneratedText(language, receipt.ethereumPayment.settlementMode)}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Amount', '金額')}: {receipt.ethereumPayment.amount || posInlineCopy(language, 'none', 'なし')} {receipt.ethereumPayment.tokenSymbol || receipt.ethereumPayment.currency || ''}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Network', 'ネットワーク')}: {receipt.ethereumPayment.networkId}</span>
              <span className="rounded bg-white/70 px-2 py-1 sm:col-span-2">{posInlineCopy(language, 'Action', '必要操作')}: {posGeneratedText(language, receipt.ethereumPayment.requiredAction)}</span>
              <span className="rounded bg-white/70 px-2 py-1 sm:col-span-2">{posInlineCopy(language, 'Payment ref', '支払い参照')}: {receipt.ethereumPayment.publicPaymentRef}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Release', '引渡')}: {receipt.ethereumPayment.handoffGate.canReleasePackage ? posInlineCopy(language, 'ok', 'OK') : posInlineCopy(language, 'hold', '保留')}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Ledger', '台帳')}: {receipt.ethereumPayment.privacy.publicLedgerWriteObserved ? posInlineCopy(language, 'observed', '確認済み') : receipt.ethereumPayment.privacy.publicLedgerWritePlanned ? posInlineCopy(language, 'planned', '予定') : posInlineCopy(language, 'local', 'ローカル')}</span>
            </div>
          </div>
        )}
        {receipt.shippingLabel && (
          <div className="rounded-md bg-white/70 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{posInlineCopy(language, 'Waybill Evidence', '送り状証拠')}</p>
              <span className={cn(
                'w-fit rounded px-2 py-1 text-[10px] font-black uppercase tracking-widest',
                waybillProofLevelClasses(receipt.shippingLabel.proofLevel),
              )}>
                {waybillProofLevelLabel(receipt.shippingLabel.proofLevel, language)}
              </span>
            </div>
            <div className="mt-3">
              <PosWaybillProgressBoard source={receipt.shippingLabel} compact language={language} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Role', '役割')}: {posShippingScanRoleLabel(language, receipt.shippingLabel.scanRole)}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'WB alias', '送り状エイリアス')}: {receipt.shippingLabel.waybillId}</span>
              <span className={cn(
                'rounded px-2 py-1',
                addressAccuracyClasses(receipt.shippingLabel.addressAccuracyStatus),
              )}>
                {posInlineCopy(language, 'Address quality', '住所品質')}: {addressAccuracyLabel(receipt.shippingLabel.addressAccuracyStatus, language)}
              </span>
              <span className="rounded bg-white/70 px-2 py-1">
                {posInlineCopy(language, 'Quality action', '品質判定')}: {receipt.shippingLabel.addressAccuracyDecision === 'accept' ? posInlineCopy(language, 'continue', '続行') : posInlineCopy(language, 'review', '要確認')}
              </span>
              {receipt.shippingLabel.carrierPolicyDecision && (
                <span className={cn(
                  'rounded px-2 py-1 sm:col-span-2',
                  receipt.shippingLabel.carrierPolicyDecision.rejected
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800',
                )}>
                  {posInlineCopy(language, 'Carrier policy', '配送ポリシー')}: {receipt.shippingLabel.carrierPolicyDecision.rejected
                    ? receipt.shippingLabel.carrierPolicyDecision.reasons.join(', ')
                    : posInlineCopy(language, 'clear', '問題なし')}
                </span>
              )}
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Address commitment', '住所commitment')}: {receipt.shippingLabel.addressReferenceCommitment ? receipt.shippingLabel.addressReferenceCommitment.slice(-8) : receipt.shippingLabel.addressVerified ? posInlineCopy(language, 'ok', 'OK') : posInlineCopy(language, 'missing', '不足')}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'WB commitment', '送り状commitment')}: {receipt.shippingLabel.waybillCommitment ? receipt.shippingLabel.waybillCommitment.slice(-8) : posInlineCopy(language, 'none', 'なし')}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Recipient', '受取人')}: {receipt.shippingLabel.recipientControlVerified ? posInlineCopy(language, 'ok', 'OK') : posInlineCopy(language, 'pending', '保留')}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Terminal', '端末')}: {receipt.shippingLabel.terminalEvidenceSignature ? posInlineCopy(language, 'signed', '署名済み') : posInlineCopy(language, 'missing', '不足')}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Signed', '署名時刻')}: {compactTime(receipt.shippingLabel.terminalSignedAt, language)}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Store/POS', '店舗/POS')}: {receipt.shippingLabel.storePosId}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Carrier device', '配送端末')}: {receipt.shippingLabel.carrierTerminalId || posInlineCopy(language, 'none', 'なし')}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Carrier sig', '配送署名')}: {receipt.shippingLabel.carrierTerminalSignature ? posInlineCopy(language, 'present', 'あり') : posInlineCopy(language, 'missing', '不足')}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Carrier time', '配送業者時刻')}: {compactTime(receipt.shippingLabel.carrierTerminalSignedAt, language)}</span>
              <span className="rounded bg-white/70 px-2 py-1 sm:col-span-2">
                {posInlineCopy(language, 'Location', '位置')}: {receipt.shippingLabel.carrierLocation
                  ? `${receipt.shippingLabel.carrierLocation.precision} ${receipt.shippingLabel.carrierLocation.latBucket ?? ''},${receipt.shippingLabel.carrierLocation.lonBucket ?? ''}`
                  : posInlineCopy(language, 'none', 'なし')}
              </span>
              <span className="rounded bg-white/70 px-2 py-1">JTI: {receipt.shippingLabel.jti.slice(-6)}</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Risk', 'リスク')}: {posRiskLevelLabel(language, receipt.shippingLabel.riskLevel)}</span>
              {receipt.shippingLabel.safetyPolicy.mode === 'high-risk' && (
                <>
                  <span className="rounded bg-rose-50 px-2 py-1 text-rose-700">{posInlineCopy(language, 'AGID sharing', 'AGID共有')}: {posGeneratedText(language, receipt.shippingLabel.safetyPolicy.agidSharing)}</span>
                  <span className="rounded bg-rose-50 px-2 py-1 text-rose-700">{posInlineCopy(language, 'History', '履歴')}: {posGeneratedText(language, receipt.shippingLabel.safetyPolicy.addressHistoryPolicy)}</span>
                </>
              )}
              <span className="rounded bg-white/70 px-2 py-1">Nullifier: {receipt.shippingLabel.nullifier.slice(0, 8)}...</span>
              <span className="rounded bg-white/70 px-2 py-1">{posInlineCopy(language, 'Challenge', 'チャレンジ')}: {receipt.shippingLabel.recipientChallengeRequired ? receipt.shippingLabel.recipientChallengeVerified ? posInlineCopy(language, 'ok', 'OK') : posInlineCopy(language, 'required', '必須') : posInlineCopy(language, 'optional', '任意')}</span>
              <span className="rounded bg-white/70 px-2 py-1 sm:col-span-2">
                {posInlineCopy(language, 'Quality checks', '品質チェック')}: {receipt.shippingLabel.addressAccuracySources.length ? receipt.shippingLabel.addressAccuracySources.join(', ') : posInlineCopy(language, 'local reference only', 'ローカル参照のみ')}
              </span>
              <span className="rounded bg-white/70 px-2 py-1 sm:col-span-2">{posInlineCopy(language, 'Expires', '有効期限')}: {compactTime(receipt.shippingLabel.expiresAt, language)}</span>
            </div>
            <div className="mt-2 grid gap-1 text-[9px] font-black uppercase tracking-widest sm:grid-cols-2">
              {receipt.shippingLabel.proofStages.map(stage => (
                <span
                  key={stage.level}
                  className={cn(
                    'rounded px-2 py-1',
                    stage.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400',
                  )}
                >
                  {stage.rank}. {posGeneratedText(language, stage.label)}: {stage.verified ? posInlineCopy(language, 'ok', 'OK') : posInlineCopy(language, 'pending', '保留')}
                </span>
              ))}
            </div>
          </div>
        )}
        {[...receipt.errors, ...receipt.warnings].slice(0, 4).map((item) => (
          <p key={item} className="rounded-md bg-white/60 px-3 py-2 text-[11px] font-black uppercase tracking-widest">
            {posGeneratedText(language, item)}
          </p>
        ))}
      </div>
    ) : (
      <p className="text-xs font-bold opacity-60">{posInlineCopy(language, 'Waiting for QR or NFC acceptance.', 'QRまたはNFCの受付待ちです。')}</p>
    )}
  </div>
);

export const LocalPreviewPanel: React.FC<{
  preview: PosPreview | null;
  language?: string;
}> = ({ preview, language = 'en' }) => {
  if (!preview) return null;

  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <ScanLine className="h-4 w-4 text-blue-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Local Preview', 'ローカルプレビュー')}</p>
      </div>
      <div className="space-y-2 text-xs font-bold text-slate-600">
        <p className="rounded-md bg-slate-50 px-3 py-2 uppercase">{posPreviewStatusLabel(language, preview.status)}</p>
        {preview.record && <p className="rounded-md bg-slate-50 px-3 py-2">{preview.record.label}</p>}
        {preview.shippingLabel && (
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Waybill status', '送り状状態')}</p>
            <PosWaybillProgressBoard source={preview.shippingLabel} compact language={language} />
            {preview.shippingLabel.carrierPolicyDecision && (
              <p className={cn(
                'mt-2 rounded-md px-3 py-2 text-[10px] font-black uppercase tracking-widest',
                preview.shippingLabel.carrierPolicyDecision.rejected
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-emerald-50 text-emerald-700',
              )}>
                {posInlineCopy(language, 'Carrier policy', '配送ポリシー')}: {preview.shippingLabel.carrierPolicyDecision.rejected
                  ? preview.shippingLabel.carrierPolicyDecision.reasons.join(', ')
                  : posInlineCopy(language, 'clear', '問題なし')}
              </p>
            )}
          </div>
        )}
        {preview.errors.map((item) => (
          <p key={item} className="rounded-md bg-rose-50 px-3 py-2 text-rose-700">{posGeneratedText(language, item)}</p>
        ))}
      </div>
    </div>
  );
};

export const ReceiptLogPanel: React.FC<{
  receipts: PosAcceptanceReceipt[];
  language?: string;
  onClear: () => void;
  onRefresh?: () => void;
  syncState?: 'idle' | 'loading' | 'error';
}> = ({ receipts, language = 'en', onClear, onRefresh, syncState = 'idle' }) => (
  <div className="rounded-lg border border-slate-100 bg-white p-4 md:p-5">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ReceiptText className="h-4 w-4 text-slate-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posInlineCopy(language, 'Receipt Log', 'レシートログ')}</p>
      </div>
      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={syncState === 'loading'}
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', syncState === 'loading' && 'animate-spin')} />
            {posInlineCopy(language, 'Sync', '同期')}
          </button>
        )}
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500"
        >
          {posInlineCopy(language, 'Clear', '消去')}
        </button>
      </div>
    </div>
    {syncState === 'error' && (
      <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700">
        {posInlineCopy(language, 'Server receipt sync failed', 'サーバーレシート同期に失敗しました')}
      </p>
    )}
    <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
      {receipts.length === 0 && (
        <p className="rounded-md bg-slate-50 p-3 text-xs font-bold text-slate-400">{posInlineCopy(language, 'No receipts yet.', 'まだレシートはありません。')}</p>
      )}
      {receipts.map((receipt) => (
        <div key={receipt.receiptId} className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black text-slate-800">{receipt.receiptId}</p>
            <span className={cn(
              'rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest',
              receipt.status === 'accepted' && 'bg-emerald-100 text-emerald-700',
              receipt.status === 'review' && 'bg-amber-100 text-amber-700',
              receipt.status === 'rejected' && 'bg-rose-100 text-rose-700',
            )}>
              {posReceiptStatusLabel(language, receipt.status)}
            </span>
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {receipt.channel} / {receipt.record?.label || receipt.errors[0] || posInlineCopy(language, 'unknown', '不明')}
          </p>
        </div>
      ))}
    </div>
  </div>
);
