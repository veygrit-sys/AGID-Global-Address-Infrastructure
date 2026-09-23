import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  FileWarning,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  KeyRound,
  MapPinOff,
  PackageCheck,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Truck,
  UserCheck,
  WifiOff,
} from 'lucide-react';
import React from 'react';

import {
  createFieldReachabilityReport,
  detectFieldAttachmentPrivacyWarnings,
  normalizeFieldHandoffTask,
  processFieldHandoffScan,
  syncFieldHandoffReceipt,
  type FieldAttachmentPrivacyWarning,
  type FieldHandoffReceipt,
  type FieldHandoffStatus,
  type FieldHandoffTask,
  type FieldHandoffProofMethod,
  type FieldHandoffReachabilityReason,
} from '../lib/fieldHandoff';
import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import {
  buildShippingLabelQrPayload,
  createShippingLabelRecipientChallengeSignature,
  parseShippingLabelQrPayload,
} from '../lib/shippingLabelQr';
import { cn } from '../lib/utils';

type FieldCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'language'
  | 'demoPayload'
  | 'scan'
  | 'decision'
  | 'handoff'
  | 'report'
  | 'scanTask'
  | 'recipientProof'
  | 'cannotReach'
  | 'syncAccepted'
  | 'syncConflict'
  | 'privacyBoundary'
  | 'privacyBody'
  | 'payload'
  | 'task'
  | 'route'
  | 'operator'
  | 'terminal'
  | 'stopAlias'
  | 'challenge'
  | 'secret'
  | 'reason'
  | 'safeNote'
  | 'latestReceipt'
  | 'offlineQueue'
  | 'offlineQueueRef'
  | 'proofMethod'
  | 'recordSummary'
  | 'noReceipt'
  | 'signedReceipt'
  | 'terminalSignature'
  | 'evidencePackage'
  | 'offlineEvidence'
  | 'recipientProofEvidence'
  | 'reachabilityEvidence'
  | 'proofVerified'
  | 'challengeObserved'
  | 'signatureObserved'
  | 'proofSecretsNotStored'
  | 'safeCategoryOnly'
  | 'receiptFingerprint'
  | 'syncState'
  | 'reachabilityStatus'
  | 'flowTitle'
  | 'flowBody'
  | 'decisionReady'
  | 'decisionReview'
  | 'decisionBlocked'
  | 'decisionComplete'
  | 'carrierAccepted'
  | 'recipientControlled'
  | 'highRisk'
  | 'offline'
  | 'resetDemo'
  | 'courierActionsTitle'
  | 'courierActionsBody'
  | 'arrived'
  | 'delivered'
  | 'absent'
  | 'cannotReachDriver'
  | 'handoffNotAllowed'
  | 'oneTapCannotReachReport'
  | 'queuedReceipt'
  | 'photoEvidenceRef'
  | 'fieldMemo'
  | 'attachmentPrivacyTitle'
  | 'attachmentPrivacyBody'
  | 'attachmentPrivacyOk'
  | 'attachmentPrivacyWarn'
  | 'missionControl'
  | 'nextAction'
  | 'activeStop'
  | 'safeReferences'
  | 'receiptPrivacy'
  | 'noRawAddressDefault'
  | 'localReceiptOnly'
  | 'oneHandMode'
  | 'currentDecision'
  | 'lastReceiptRef'
  | 'tapBestAction';

const FIELD_COPY: Record<'en' | 'ja', Record<FieldCopyKey, string>> = {
  en: {
    returnToMap: 'Return to AGID map',
    subtitle: 'Field handoff for Scan -> Decision -> Handoff -> Report.',
    language: 'Display language',
    demoPayload: 'Demo waybill',
    scan: 'Scan',
    decision: 'Decision',
    handoff: 'Handoff',
    report: 'Report',
    scanTask: 'Scan task',
    recipientProof: 'Verify recipient proof',
    cannotReach: 'Cannot reach',
    syncAccepted: 'Sync accepted',
    syncConflict: 'Sync conflict',
    privacyBoundary: 'Privacy boundary',
    privacyBody: 'This field app stores receipts, commitments, safe categories, and short aliases only. It does not persist raw address, raw AGID, raw AOID, precise location, recipient name, phone number, or proof secrets.',
    payload: 'QR/NFC payload',
    task: 'Task',
    route: 'Route',
    operator: 'Operator',
    terminal: 'Terminal',
    stopAlias: 'Stop alias',
    challenge: 'POS challenge',
    secret: 'Recipient local secret',
    reason: 'Safe reason',
    safeNote: 'Safe note',
    latestReceipt: 'Latest receipt',
    offlineQueue: 'Offline queue',
    offlineQueueRef: 'Offline queue ref',
    proofMethod: 'Proof method',
    recordSummary: 'Safe record summary',
    noReceipt: 'No receipt yet',
    signedReceipt: 'Signed receipt',
    terminalSignature: 'Terminal signature',
    evidencePackage: 'Evidence package',
    offlineEvidence: 'Offline evidence',
    recipientProofEvidence: 'Recipient proof evidence',
    reachabilityEvidence: 'Reachability evidence',
    proofVerified: 'Proof verified',
    challengeObserved: 'Challenge observed',
    signatureObserved: 'Signature observed',
    proofSecretsNotStored: 'Proof secrets not stored',
    safeCategoryOnly: 'Safe category only',
    receiptFingerprint: 'Receipt fingerprint',
    syncState: 'Sync state',
    reachabilityStatus: 'Reachability',
    flowTitle: 'Field-first flow',
    flowBody: 'Scan safely, decide without raw address exposure, verify recipient control, then produce a redacted signed receipt for offline or server review.',
    decisionReady: 'Ready',
    decisionReview: 'Review',
    decisionBlocked: 'Blocked',
    decisionComplete: 'Complete',
    carrierAccepted: 'Carrier accepted',
    recipientControlled: 'Recipient controlled',
    highRisk: 'High-risk mode',
    offline: 'Offline mode',
    resetDemo: 'Reset demo',
    courierActionsTitle: 'Courier action buttons',
    courierActionsBody: 'Create a redacted receipt even when offline. The queue syncs later from receipt IDs, aliases, safe categories, and signatures only.',
    arrived: 'Arrived',
    delivered: 'Delivered',
    absent: 'Absent',
    cannotReachDriver: 'Cannot reach',
    handoffNotAllowed: 'Handoff not allowed',
    oneTapCannotReachReport: 'One-tap cannot-reach report',
    queuedReceipt: 'Queued receipt',
    photoEvidenceRef: 'Photo evidence ref',
    fieldMemo: 'Field memo',
    attachmentPrivacyTitle: 'Photo / memo privacy guard',
    attachmentPrivacyBody: 'Photos and notes can accidentally include names, phone numbers, raw addresses, GPS, or private documents. Store only a redacted evidence ref and safe-category memo.',
    attachmentPrivacyOk: 'No obvious personal data pattern detected.',
    attachmentPrivacyWarn: 'Possible personal data detected. Do not sync this text or photo until it is redacted.',
    missionControl: 'Mission command',
    nextAction: 'Next action',
    activeStop: 'Active stop',
    safeReferences: 'Safe references',
    receiptPrivacy: 'Receipt & privacy',
    noRawAddressDefault: 'No raw address by default',
    localReceiptOnly: 'Local receipt only',
    oneHandMode: 'One-hand field mode',
    currentDecision: 'Current decision',
    lastReceiptRef: 'Last receipt ref',
    tapBestAction: 'Tap the closest outcome. The app creates only redacted receipt evidence.',
  },
  ja: {
    returnToMap: 'AGIDマップへ戻る',
    subtitle: '現場引き渡しを Scan -> Decision -> Handoff -> Report に絞って処理します。',
    language: '表示言語',
    demoPayload: 'デモ送り状',
    scan: 'スキャン',
    decision: '判定',
    handoff: '引き渡し',
    report: 'レポート',
    scanTask: 'タスクをスキャン',
    recipientProof: '受取人proof確認',
    cannotReach: '到達不可',
    syncAccepted: '同期承認',
    syncConflict: '同期衝突',
    privacyBoundary: 'プライバシー境界',
    privacyBody: 'このFieldアプリはreceipt、commitment、安全カテゴリ、短期aliasだけを保存します。実住所、AGID本体、AOID本体、精密位置、受取人名、電話番号、proof secretは永続保存しません。',
    payload: 'QR/NFC payload',
    task: 'タスク',
    route: 'ルート',
    operator: '担当者',
    terminal: '端末',
    stopAlias: '停止地点alias',
    challenge: 'POSチャレンジ',
    secret: '受取人ローカルsecret',
    reason: '安全カテゴリ',
    safeNote: '安全メモ',
    latestReceipt: '最新レシート',
    offlineQueue: 'オフラインキュー',
    offlineQueueRef: 'オフラインキュー参照',
    proofMethod: 'Proof方式',
    recordSummary: '安全なレコード概要',
    noReceipt: 'まだレシートはありません',
    signedReceipt: '署名receipt',
    terminalSignature: '端末署名',
    evidencePackage: '証跡パッケージ',
    offlineEvidence: 'オフライン証跡',
    recipientProofEvidence: '受取人proof証跡',
    reachabilityEvidence: '到達不可証跡',
    proofVerified: 'Proof確認済み',
    challengeObserved: 'チャレンジ検出',
    signatureObserved: '署名検出',
    proofSecretsNotStored: 'proof secret非保存',
    safeCategoryOnly: '安全カテゴリのみ',
    receiptFingerprint: 'Receipt fingerprint',
    syncState: '同期状態',
    reachabilityStatus: '到達可否',
    flowTitle: '現場優先フロー',
    flowBody: '安全にスキャンし、実住所を出さずに判定し、受取人の支配性を確認して、オフラインまたはサーバー再照合用のredacted署名receiptを残します。',
    decisionReady: '準備完了',
    decisionReview: '要確認',
    decisionBlocked: 'ブロック',
    decisionComplete: '完了',
    carrierAccepted: '配送側受付済み',
    recipientControlled: '受取人確認済み',
    highRisk: '高リスクモード',
    offline: 'オフラインモード',
    resetDemo: 'デモを初期化',
    courierActionsTitle: '配達員アクション',
    courierActionsBody: '圏外でもredacted receiptを作成し、後でreceipt ID、alias、安全カテゴリ、署名だけで同期します。',
    arrived: '到着',
    delivered: '渡した',
    absent: '不在',
    cannotReachDriver: 'たどり着けない',
    handoffNotAllowed: '手渡し不可',
    oneTapCannotReachReport: 'cannot-reach reportをワンタップ生成',
    queuedReceipt: '同期待ちreceipt',
    photoEvidenceRef: '写真証跡ref',
    fieldMemo: '現場メモ',
    attachmentPrivacyTitle: '写真 / メモの個人情報ガード',
    attachmentPrivacyBody: '写真やメモには氏名、電話番号、実住所、GPS、私的書類が混入しやすいです。保存するのはredacted evidence refと安全カテゴリメモだけにしてください。',
    attachmentPrivacyOk: '明らかな個人情報パターンは検出していません。',
    attachmentPrivacyWarn: '個人情報の可能性があります。redactするまで、この本文や写真を同期しないでください。',
    missionControl: 'ミッション管制',
    nextAction: '次の操作',
    activeStop: '現在の停止地点',
    safeReferences: '安全な参照',
    receiptPrivacy: 'receipt と privacy',
    noRawAddressDefault: '実住所は標準非表示',
    localReceiptOnly: 'ローカルreceiptのみ',
    oneHandMode: '片手操作モード',
    currentDecision: '現在の判定',
    lastReceiptRef: '最新receipt ref',
    tapBestAction: 'いま一番近い結果を押してください。保存するのはredacted receipt証跡だけです。',
  },
};

const PROOF_METHODS: FieldHandoffProofMethod[] = [
  'recipient-secret-commitment',
  'passkey-webauthn',
  'aoid-credential',
  'nfc-card',
  'manual-witness',
];

const REACHABILITY_REASONS: FieldHandoffReachabilityReason[] = [
  'no-safe-access',
  'recipient-unavailable',
  'address-needs-review',
  'delivery-point-blocked',
  'weather-or-disaster',
  'restricted-area',
  'other-safe-category',
];

export const FIELD_HANDOFF_RECEIPTS_STORAGE_KEY = 'agid:field-handoff:redacted-receipts:v1';

function isStoredFieldHandoffReceipt(value: unknown): value is FieldHandoffReceipt {
  if (!value || typeof value !== 'object') return false;
  const receipt = value as Partial<FieldHandoffReceipt>;
  return typeof receipt.receiptId === 'string'
    && typeof receipt.taskId === 'string'
    && typeof receipt.stopAlias === 'string'
    && typeof receipt.status === 'string'
    && typeof receipt.offlineQueueRef === 'string'
    && typeof receipt.syncState === 'string'
    && Array.isArray(receipt.warnings)
    && Array.isArray(receipt.errors)
    && !!receipt.privacy
    && receipt.privacy.rawPayloadStored === false
    && receipt.privacy.rawAddressStored === false
    && receipt.privacy.rawAgidStored === false
    && receipt.privacy.rawAoidStored === false
    && receipt.privacy.rawRecipientStored === false
    && receipt.privacy.preciseLocationStored === false
    && receipt.privacy.proofSecretStored === false
    && !!receipt.signature
    && typeof receipt.signature.signatureId === 'string'
    && typeof receipt.signature.receiptFingerprint === 'string'
    && typeof receipt.signature.offlineQueueRef === 'string';
}

function readStoredReceipts(): FieldHandoffReceipt[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(FIELD_HANDOFF_RECEIPTS_STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter(isStoredFieldHandoffReceipt).slice(0, 10)
      : [];
  } catch {
    return [];
  }
}

function readStoredLanguage() {
  try {
    return normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || 'ja');
  } catch {
    return 'ja';
  }
}

function translate(language: string, key: FieldCopyKey) {
  return FIELD_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function returnToMap() {
  window.location.href = '/';
}

function buildDemoPayload() {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 5 * 60 * 1000);
  return buildShippingLabelQrPayload({
    waybillId: 'field-internal-waybill-001',
    jti: '0123456789ABCDEFGHJKMNPQ',
    carrierId: 'carrier-field-demo',
    serviceLevel: 'field-handoff',
    riskLevel: 'high',
    highRiskUseCases: ['humanitarian', 'field-protection'],
    address: {
      kind: 'aoid-reference',
      entityId: 'FIELD-DEMO-ADDRESS-REF-001',
      aoidId: 'AOID-FIELD-DEMO-001',
      referenceCommitment: 'ARC-FIELD-DEMO-001',
      country: 'JP',
      city: 'coarse-field-region',
    },
    recipientProofSecret: 'recipient-secret',
    recipientProofMethod: 'recipient-secret-commitment',
    recipientProofNonce: 'RECIPIENTNONCE001',
    recipientProofHint: 'local field secret',
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}

function initialTask(now = new Date().toISOString()) {
  return normalizeFieldHandoffTask({
    taskId: 'FHT-FIELD-DEMO-001',
    stopAlias: 'STOP-FIELD-A7K9',
    routeName: 'Field Route North',
    operatorId: 'field-op-7',
    terminalId: 'AGID-FIELD-7',
    highRiskMode: true,
    offlineMode: true,
  }, now);
}

function statusTone(status: FieldHandoffStatus) {
  if (status === 'handoff_complete') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'cannot_reach' || status === 'sync_conflict') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (status === 'offline_pending_sync') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-sky-200 bg-sky-50 text-sky-800';
}

function decisionLabel(language: string, decision: FieldHandoffReceipt['decision']) {
  if (decision === 'complete') return translate(language, 'decisionComplete');
  if (decision === 'review') return translate(language, 'decisionReview');
  if (decision === 'blocked') return translate(language, 'decisionBlocked');
  return translate(language, 'decisionReady');
}

function primaryActionForTask(status: FieldHandoffStatus): FieldCourierActionId {
  if (status === 'recipient_pending' || status === 'arrived') return 'delivered';
  if (status === 'cannot_reach' || status === 'sync_conflict') return 'cannot-reach';
  if (status === 'handoff_complete' || status === 'offline_pending_sync') return 'delivered';
  return 'arrived';
}

function actionCopyKey(action: FieldCourierActionId): FieldCopyKey {
  if (action === 'delivered') return 'delivered';
  if (action === 'absent') return 'absent';
  if (action === 'cannot-reach') return 'cannotReachDriver';
  if (action === 'handoff-not-allowed') return 'handoffNotAllowed';
  return 'arrived';
}

function missionStatusTone(receipt?: FieldHandoffReceipt) {
  if (receipt?.status === 'handoff_complete') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
  if (receipt?.status === 'cannot_reach' || receipt?.status === 'sync_conflict') return 'border-rose-400/50 bg-rose-400/10 text-rose-100';
  if (receipt?.syncState === 'queued') return 'border-amber-300/50 bg-amber-300/10 text-amber-100';
  return 'border-sky-300/40 bg-sky-300/10 text-sky-100';
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function buildSafePayloadPreview(record: ReturnType<typeof parseShippingLabelQrPayload>) {
  if (!record) return 'Invalid or unsupported redacted field envelope.';
  return JSON.stringify({
    envelope: 'redacted-local-qr-nfc',
    waybillAlias: record.waybillId,
    addressReference: record.address.kind,
    riskLevel: record.riskLevel,
    carrierId: record.carrierId,
    expiresAt: record.expiresAt,
    rawPayloadDisplayed: false,
    rawAddressDisplayed: false,
    proofSecretDisplayed: false,
  }, null, 2);
}

function SafeMetric(props: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: string;
}) {
  const Icon = props.icon;
  return (
    <div className={cn(
      'min-h-[86px] rounded-lg border bg-white p-4 shadow-sm',
      props.tone ?? 'border-slate-200',
    )}>
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">{props.label}</p>
      </div>
      <div className="mt-3 text-lg font-black text-slate-950">{props.value}</div>
    </div>
  );
}

function StepTile(props: {
  step: number;
  title: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const Icon = props.icon;
  return (
    <div className={cn(
      'flex min-h-[76px] items-center gap-3 rounded-lg border px-4 py-3',
      props.active
        ? 'border-blue-300 bg-blue-50 text-blue-900 shadow-sm'
        : 'border-slate-200 bg-white text-slate-500',
    )}>
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
        props.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500',
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest">0{props.step}</p>
        <p className="truncate text-sm font-black">{props.title}</p>
      </div>
    </div>
  );
}

type FieldCourierActionId = 'arrived' | 'delivered' | 'absent' | 'cannot-reach' | 'handoff-not-allowed';

function privacyWarningLabel(language: string, warning: FieldAttachmentPrivacyWarning) {
  const ja = language.startsWith('ja');
  if (warning === 'possible-recipient-name') return ja ? '氏名・受取人名の可能性' : 'Possible recipient name';
  if (warning === 'possible-phone-or-contact') return ja ? '電話・連絡先の可能性' : 'Possible phone or contact';
  if (warning === 'possible-raw-address') return ja ? '実住所の可能性' : 'Possible raw address';
  if (warning === 'possible-precise-location') return ja ? '精密位置の可能性' : 'Possible precise location';
  return ja ? '写真メタデータ確認が必要' : 'Photo metadata review required';
}

function proofMethodLabel(language: string, method: FieldHandoffProofMethod) {
  const ja = language.startsWith('ja');
  if (method === 'recipient-secret-commitment') return ja ? 'commitment proof' : 'Commitment proof';
  if (method === 'passkey-webauthn') return ja ? 'Passkey proof' : 'Passkey proof';
  if (method === 'aoid-credential') return ja ? 'AOID credential' : 'AOID credential';
  if (method === 'nfc-card') return ja ? 'NFC card' : 'NFC card';
  return ja ? '現場 witness' : 'Field witness';
}

function CourierActionButton(props: {
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  onClick: () => void;
}) {
  const Icon = props.icon;
  const toneClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-950 hover:bg-rose-100',
    slate: 'border-slate-200 bg-slate-50 text-slate-950 hover:bg-slate-100',
  } satisfies Record<typeof props.tone, string>;
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        'min-h-[104px] rounded-lg border p-3 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] sm:min-h-[124px] sm:p-4',
        toneClasses[props.tone],
      )}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/80 shadow-sm sm:h-11 sm:w-11">
          <Icon className="h-5 w-5" />
        </span>
        <span className="break-keep text-lg font-black leading-tight tracking-normal sm:text-xl 2xl:text-2xl">{props.label}</span>
      </span>
      <span className="mt-3 block text-xs font-bold leading-5 opacity-75 sm:text-sm">{props.detail}</span>
    </button>
  );
}

function AttachmentPrivacyGuard(props: {
  language: string;
  photoEvidenceRef: string;
  fieldMemo: string;
  warnings: FieldAttachmentPrivacyWarning[];
  onPhotoEvidenceRefChange: (value: string) => void;
  onFieldMemoChange: (value: string) => void;
}) {
  const hasWarnings = props.warnings.length > 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
          hasWarnings ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700',
        )}>
          {hasWarnings ? <FileWarning className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {translate(props.language, 'attachmentPrivacyTitle')}
          </p>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
            {translate(props.language, 'attachmentPrivacyBody')}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{translate(props.language, 'photoEvidenceRef')}</span>
          <input
            value={props.photoEvidenceRef}
            onChange={event => props.onPhotoEvidenceRefChange(event.target.value)}
            placeholder="photo-ref-redacted-001"
            className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{translate(props.language, 'fieldMemo')}</span>
          <input
            value={props.fieldMemo}
            onChange={event => props.onFieldMemoChange(event.target.value)}
            placeholder={props.language.startsWith('ja') ? '安全カテゴリのみ' : 'safe category only'}
            className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>
      <div className={cn(
        'mt-3 rounded-md border px-3 py-3 text-sm font-black',
        hasWarnings ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800',
      )}>
        {hasWarnings ? translate(props.language, 'attachmentPrivacyWarn') : translate(props.language, 'attachmentPrivacyOk')}
        {hasWarnings && (
          <div className="mt-2 flex flex-wrap gap-2">
            {props.warnings.map(warning => (
              <span key={warning} className="rounded-md bg-white/70 px-2 py-1 text-[10px] uppercase tracking-wider">
                {privacyWarningLabel(props.language, warning)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MissionChip(props: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'light' | 'amber' | 'emerald';
}) {
  const Icon = props.icon;
  const toneClass = props.tone === 'amber'
    ? 'border-amber-300/40 bg-amber-300/10 text-amber-100'
    : props.tone === 'emerald'
      ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100'
      : 'border-white/15 bg-white/[0.08] text-slate-100';
  return (
    <span className={cn('inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black', toneClass)}>
      <Icon className="h-4 w-4" />
      {props.label}
    </span>
  );
}

function FieldMissionCommand(props: {
  language: string;
  task: FieldHandoffTask;
  latestReceipt?: FieldHandoffReceipt;
  offlineQueueCount: number;
  parsedWaybillId?: string;
  parsedAddressKind?: string;
  parsedRisk?: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onCannotReach: () => void;
}) {
  const receipt = props.latestReceipt;
  const decision = receipt ? decisionLabel(props.language, receipt.decision) : translate(props.language, 'decisionReady');
  const status = (receipt?.status ?? props.task.status).replace(/_/g, ' ');
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.75fr)]">
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4 text-white shadow-2xl shadow-slate-950/20 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
              {translate(props.language, 'missionControl')}
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-normal md:text-4xl">
              {translate(props.language, 'oneHandMode')}
            </h2>
            <p className="mt-3 hidden max-w-3xl text-sm font-bold leading-6 text-slate-300 sm:block">
              {translate(props.language, 'tapBestAction')}
            </p>
          </div>
          <div className={cn('rounded-lg border px-4 py-3 text-right shadow-lg shadow-slate-950/20', missionStatusTone(receipt))}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
              {translate(props.language, 'currentDecision')}
            </p>
            <p className="mt-1 text-2xl font-black">{decision}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-widest opacity-80">{status}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{translate(props.language, 'activeStop')}</p>
            <p className="mt-2 truncate font-mono text-xl font-black text-white">{props.task.stopAlias}</p>
            <p className="mt-1 truncate text-xs font-bold text-slate-400">{props.task.routeName}</p>
          </div>
          <div className="hidden rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{translate(props.language, 'safeReferences')}</p>
            <p className="mt-2 truncate font-mono text-sm font-black text-white">{props.parsedWaybillId ?? props.task.taskId}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">
              {props.parsedAddressKind ?? 'alias'} / {props.parsedRisk ?? 'field'}
            </p>
          </div>
          <div className="hidden rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{translate(props.language, 'lastReceiptRef')}</p>
            <p className="mt-2 truncate font-mono text-sm font-black text-white">{receipt?.receiptId ?? 'receipt pending'}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">{receipt?.syncState ?? 'local-only'}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
          <MissionChip label={translate(props.language, 'noRawAddressDefault')} icon={ShieldCheck} tone="emerald" />
          <MissionChip label={translate(props.language, 'localReceiptOnly')} icon={FileCheck2} />
          <MissionChip label={`${translate(props.language, 'offlineQueue')}: ${props.offlineQueueCount}`} icon={WifiOff} tone={props.offlineQueueCount ? 'amber' : 'light'} />
          <MissionChip label={props.task.highRiskMode ? translate(props.language, 'highRisk') : 'Standard'} icon={KeyRound} />
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <button
            type="button"
            onClick={props.onPrimaryAction}
            className="flex min-h-14 items-center justify-center gap-3 rounded-lg bg-white px-5 text-base font-black text-slate-950 shadow-lg shadow-slate-950/20 transition hover:bg-slate-100 active:scale-[0.99]"
          >
            <ClipboardCheck className="h-5 w-5" />
            {props.primaryActionLabel}
          </button>
          <button
            type="button"
            onClick={props.onCannotReach}
            className="flex min-h-14 items-center justify-center gap-2 rounded-lg border border-rose-300/40 bg-rose-400/10 px-4 text-sm font-black text-rose-100 transition hover:bg-rose-400/20 active:scale-[0.99]"
          >
            <MapPinOff className="h-5 w-5" />
            {translate(props.language, 'cannotReachDriver')}
          </button>
        </div>
      </div>

      <div className="hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/10 lg:block">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{translate(props.language, 'receiptPrivacy')}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{decision}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{translate(props.language, 'privacyBody')}</p>
          </div>
          <span className={cn('rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-widest', statusTone(receipt?.status ?? props.task.status))}>
            {status}
          </span>
        </div>

        <div className="mt-4 grid gap-2">
          {[
            ['AGID/AOID', props.parsedAddressKind ?? 'aoid-reference'],
            ['alias', props.task.stopAlias],
            ['commitment', receipt?.signature.receiptFingerprint ?? 'pending'],
            ['receipt', receipt?.receiptId ?? 'pending'],
          ].map(([label, value]) => (
            <div key={label} className="flex min-h-10 items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
              <span className="min-w-0 truncate font-mono text-xs font-black text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const FieldHandoffAppScreen: React.FC = () => {
  const [appLanguage, setAppLanguageState] = React.useState(readStoredLanguage);
  const [task, setTask] = React.useState<FieldHandoffTask>(() => initialTask());
  const [payload, setPayload] = React.useState(buildDemoPayload);
  const [recipientSecret, setRecipientSecret] = React.useState('');
  const [recipientChallenge, setRecipientChallenge] = React.useState('FIELD-CHALLENGE-001');
  const [proofMethod, setProofMethod] = React.useState<FieldHandoffProofMethod>('recipient-secret-commitment');
  const [reachabilityReason, setReachabilityReason] = React.useState<FieldHandoffReachabilityReason>('delivery-point-blocked');
  const [safeNote, setSafeNote] = React.useState('Safe category only; no private address detail stored.');
  const [photoEvidenceRef, setPhotoEvidenceRef] = React.useState('');
  const [fieldMemo, setFieldMemo] = React.useState('');
  const [receipts, setReceipts] = React.useState<FieldHandoffReceipt[]>(readStoredReceipts);

  const parsedRecord = React.useMemo(() => parseShippingLabelQrPayload(payload), [payload]);
  const latestReceipt = receipts[0];
  const attachmentWarnings = React.useMemo(() => detectFieldAttachmentPrivacyWarnings({
    note: fieldMemo,
    photoEvidenceRef,
  }), [fieldMemo, photoEvidenceRef]);
  const t = React.useCallback((key: FieldCopyKey) => translate(appLanguage, key), [appLanguage]);

  const setAppLanguage = React.useCallback((language: string) => {
    setAppLanguageState(normalizeAppLanguage(language));
  }, []);

  React.useEffect(() => {
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage);
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = getLanguageDirection(appLanguage);
  }, [appLanguage]);

  React.useEffect(() => {
    localStorage.setItem(FIELD_HANDOFF_RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
  }, [receipts]);

  const pushReceipt = React.useCallback((nextTask: FieldHandoffTask, receipt: FieldHandoffReceipt) => {
    setTask(nextTask);
    setReceipts(previous => [receipt, ...previous].slice(0, 10));
  }, []);

  const handleCarrierScan = React.useCallback(() => {
    const result = processFieldHandoffScan({
      task,
      payload,
      now: new Date().toISOString(),
    });
    pushReceipt(result.task, result.receipt);
  }, [payload, pushReceipt, task]);

  const handleRecipientProof = React.useCallback(() => {
    const record = parseShippingLabelQrPayload(payload);
    const effectiveRecipientSecret = recipientSecret || 'recipient-secret';
    const signature = record
      ? createShippingLabelRecipientChallengeSignature({
        waybillId: record.waybillId,
        jti: record.jti,
        recipientSecret: effectiveRecipientSecret,
        recipientProofMethod: record.recipientProof.method,
        recipientProofDomain: record.recipientProof.domain,
        recipientProofNonce: record.recipientProof.nonce,
        challenge: recipientChallenge,
      })
      : undefined;
    const result = processFieldHandoffScan({
      task,
      payload,
      recipientProofSecret: effectiveRecipientSecret,
      recipientProofMethod: record?.recipientProof.method ?? proofMethod,
      recipientChallenge,
      recipientChallengeSignature: signature,
      now: new Date().toISOString(),
    });
    pushReceipt(result.task, result.receipt);
  }, [payload, proofMethod, pushReceipt, recipientChallenge, recipientSecret, task]);

  const handleReachabilityReport = React.useCallback((
    reason: FieldHandoffReachabilityReason,
    note: string,
  ) => {
    setReachabilityReason(reason);
    setSafeNote(note);
    const result = createFieldReachabilityReport({
      task,
      reason,
      note,
      now: new Date().toISOString(),
    });
    pushReceipt(result.task, result.receipt);
  }, [pushReceipt, task]);

  const handleCannotReach = React.useCallback(() => {
    handleReachabilityReport(reachabilityReason, safeNote);
  }, [handleReachabilityReport, reachabilityReason, safeNote]);

  const handleCourierAction = React.useCallback((action: FieldCourierActionId) => {
    if (action === 'arrived') {
      handleCarrierScan();
      return;
    }
    if (action === 'delivered') {
      handleRecipientProof();
      return;
    }
    if (action === 'absent') {
      handleReachabilityReport('recipient-unavailable', 'Recipient unavailable; safe category only.');
      return;
    }
    if (action === 'cannot-reach') {
      handleReachabilityReport('no-safe-access', 'Cannot reach; safe access category only.');
      return;
    }
    handleReachabilityReport('restricted-area', 'Handoff not allowed; restricted handoff category only.');
  }, [handleCarrierScan, handleReachabilityReport, handleRecipientProof]);

  const handleSync = React.useCallback((serverAccepted: boolean) => {
    const result = syncFieldHandoffReceipt({
      task,
      serverAccepted,
      conflictReason: serverAccepted ? undefined : 'nullifier-or-used-state-conflict',
      now: new Date().toISOString(),
    });
    pushReceipt(result.task, result.receipt);
  }, [pushReceipt, task]);

  const handleResetDemo = React.useCallback(() => {
    setTask(initialTask());
    setPayload(buildDemoPayload());
    setRecipientSecret('');
    setRecipientChallenge('FIELD-CHALLENGE-001');
    setReachabilityReason('delivery-point-blocked');
    setSafeNote('Safe category only; no private address detail stored.');
    setPhotoEvidenceRef('');
    setFieldMemo('');
    setReceipts([]);
    localStorage.removeItem(FIELD_HANDOFF_RECEIPTS_STORAGE_KEY);
  }, []);

  const offlineQueueCount = receipts.filter(receipt => receipt.syncState === 'queued').length;
  const activeStep = latestReceipt?.status === 'handoff_complete'
    ? 4
    : latestReceipt?.status === 'cannot_reach' || latestReceipt?.status === 'sync_conflict'
      ? 4
      : latestReceipt?.status === 'offline_pending_sync'
        ? 3
        : latestReceipt?.status === 'recipient_pending'
          ? 2
            : 1;
  const missionStatus = latestReceipt?.status ?? task.status;
  const missionPrimaryAction = primaryActionForTask(missionStatus);
  const missionPrimaryLabel = missionStatus === 'offline_pending_sync'
    ? t('syncAccepted')
    : t(actionCopyKey(missionPrimaryAction));
  const handleMissionPrimaryAction = () => {
    if (missionStatus === 'offline_pending_sync') {
      handleSync(true);
      return;
    }
    handleCourierAction(missionPrimaryAction);
  };

  return (
    <div className="agid-fixed-page-scroll fixed inset-0 z-[210] bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950 px-4 py-3 text-white shadow-xl shadow-slate-950/20 md:px-6">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={returnToMap}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/[0.08] text-slate-200 transition-all hover:bg-white hover:text-slate-950 active:scale-95"
              aria-label={t('returnToMap')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cyan-400 text-slate-950 sm:flex">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black text-white md:text-xl">AGID Field Handoff</h1>
              <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{t('subtitle')}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <select
              value={appLanguage}
              onChange={event => setAppLanguage(event.target.value)}
              className="h-10 max-w-[118px] rounded-md border border-white/15 bg-white/[0.08] px-3 text-xs font-black text-white shadow-sm outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 sm:max-w-[190px]"
              aria-label={t('language')}
            >
              {APP_LANGUAGES.map(language => (
                <option key={language.code} value={language.code}>{language.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleResetDemo}
              className="flex h-10 items-center gap-2 rounded-md border border-white/15 bg-white/[0.08] px-3 text-xs font-black text-slate-100 transition hover:bg-white hover:text-slate-950"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{t('resetDemo')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-3 py-4 md:px-5">
        <FieldMissionCommand
          language={appLanguage}
          task={task}
          latestReceipt={latestReceipt}
          offlineQueueCount={offlineQueueCount}
          parsedWaybillId={parsedRecord?.waybillId}
          parsedAddressKind={parsedRecord?.address.kind}
          parsedRisk={parsedRecord?.riskLevel}
          primaryActionLabel={missionPrimaryLabel}
          onPrimaryAction={handleMissionPrimaryAction}
          onCannotReach={() => handleCourierAction('cannot-reach')}
        />

        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/10">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('courierActionsTitle')}</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{t('courierActionsBody')}</h2>
            </div>
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs font-black text-amber-900">
              {t('queuedReceipt')}: {offlineQueueCount}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
            <CourierActionButton
              label={t('arrived')}
              detail={t('scanTask')}
              icon={MapPinOff}
              tone="blue"
              onClick={() => handleCourierAction('arrived')}
            />
            <CourierActionButton
              label={t('delivered')}
              detail={t('recipientProof')}
              icon={PackageCheck}
              tone="emerald"
              onClick={() => handleCourierAction('delivered')}
            />
            <CourierActionButton
              label={t('absent')}
              detail={appLanguage.startsWith('ja') ? '不在reportを作成' : 'Create absent report'}
              icon={AlertTriangle}
              tone="amber"
              onClick={() => handleCourierAction('absent')}
            />
            <CourierActionButton
              label={t('cannotReachDriver')}
              detail={t('oneTapCannotReachReport')}
              icon={MapPinOff}
              tone="rose"
              onClick={() => handleCourierAction('cannot-reach')}
            />
            <CourierActionButton
              label={t('handoffNotAllowed')}
              detail={appLanguage.startsWith('ja') ? '手渡し不可reportを作成' : 'Create blocked handoff report'}
              icon={ShieldCheck}
              tone="slate"
              onClick={() => handleCourierAction('handoff-not-allowed')}
            />
          </div>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-4">
          <StepTile step={1} title={t('scan')} icon={ScanLine} active={activeStep === 1} />
          <StepTile step={2} title={t('decision')} icon={ClipboardCheck} active={activeStep === 2} />
          <StepTile step={3} title={t('handoff')} icon={UserCheck} active={activeStep === 3} />
          <StepTile step={4} title={t('report')} icon={FileCheck2} active={activeStep === 4} />
        </section>

        <section className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest">{t('flowTitle')}</p>
          <p className="mt-1 text-sm font-bold leading-6">{t('flowBody')}</p>
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <SafeMetric label={t('task')} value={task.status.replace(/_/g, ' ')} icon={PackageCheck} tone={statusTone(task.status)} />
          <SafeMetric label={t('offlineQueue')} value={offlineQueueCount} icon={WifiOff} tone={offlineQueueCount ? 'border-amber-200 bg-amber-50' : 'border-slate-200'} />
          <SafeMetric label={t('carrierAccepted')} value={latestReceipt?.posReceiptId ? 'receipt linked' : 'pending'} icon={ShieldCheck} />
          <SafeMetric label={t('recipientControlled')} value={latestReceipt?.proofMethod ? proofMethodLabel(appLanguage, latestReceipt.proofMethod) : 'pending'} icon={KeyRound} />
          <SafeMetric label={t('reachabilityStatus')} value={latestReceipt?.reachabilityReason ?? 'reachable'} icon={MapPinOff} tone={latestReceipt?.reachabilityReason ? 'border-rose-200 bg-rose-50' : 'border-slate-200'} />
          <SafeMetric label={t('syncState')} value={latestReceipt?.syncState ?? 'local-only'} icon={FileCheck2} tone={latestReceipt?.syncState === 'conflict' ? 'border-rose-200 bg-rose-50' : latestReceipt?.syncState === 'queued' ? 'border-amber-200 bg-amber-50' : 'border-slate-200'} />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('demoPayload')}</p>
                  <h2 className="text-lg font-black text-slate-950">{t('scanTask')}</h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <QrCode className="h-4 w-4" />
                  QR / NFC
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('payload')}</span>
                  <textarea
                    value={buildSafePayloadPreview(parsedRecord)}
                    readOnly
                    className="mt-2 h-44 w-full resize-none rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('stopAlias')}</span>
                    <input
                      value={task.stopAlias}
                      onChange={event => setTask(previous => ({ ...previous, stopAlias: event.target.value }))}
                      className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('route')}</span>
                    <input
                      value={task.routeName}
                      onChange={event => setTask(previous => ({ ...previous, routeName: event.target.value }))}
                      className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('operator')}</span>
                    <input
                      value={task.operatorId}
                      onChange={event => setTask(previous => ({ ...previous, operatorId: event.target.value }))}
                      className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('terminal')}</span>
                    <input
                      value={task.terminalId}
                      onChange={event => setTask(previous => ({ ...previous, terminalId: event.target.value }))}
                      className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black text-slate-700">
                    <input
                      type="checkbox"
                      checked={task.highRiskMode}
                      onChange={event => setTask(previous => ({ ...previous, highRiskMode: event.target.checked, priority: event.target.checked ? 'high' : previous.priority }))}
                      className="h-4 w-4"
                    />
                    {t('highRisk')}
                  </label>
                  <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black text-slate-700">
                    <input
                      type="checkbox"
                      checked={task.offlineMode}
                      onChange={event => setTask(previous => ({ ...previous, offlineMode: event.target.checked }))}
                      className="h-4 w-4"
                    />
                    {t('offline')}
                  </label>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCarrierScan}
                  className="flex h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                >
                  <ScanLine className="h-4 w-4" />
                  {t('scanTask')}
                </button>
                <button
                  type="button"
                  onClick={handleRecipientProof}
                  className="flex h-11 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                >
                  <UserCheck className="h-4 w-4" />
                  {t('recipientProof')}
                </button>
                <button
                  type="button"
                  onClick={handleCannotReach}
                  className="flex h-11 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-100 active:scale-95"
                >
                  <MapPinOff className="h-4 w-4" />
                  {t('cannotReach')}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('privacyBoundary')}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{t('privacyBody')}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {['raw address: no', 'raw AGID: no', 'proof secret: no', 'safe category: yes'].map(item => (
                  <div key={item} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <AttachmentPrivacyGuard
              language={appLanguage}
              photoEvidenceRef={photoEvidenceRef}
              fieldMemo={fieldMemo}
              warnings={attachmentWarnings}
              onPhotoEvidenceRefChange={setPhotoEvidenceRef}
              onFieldMemoChange={setFieldMemo}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('recordSummary')}</p>
              <div className="mt-3 grid gap-2">
                {parsedRecord ? (
                  <>
                    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                      <span className="text-xs font-black text-slate-500">Waybill alias</span>
                      <span className="font-mono text-xs font-black text-slate-900">{parsedRecord.waybillId}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                      <span className="text-xs font-black text-slate-500">Address ref</span>
                      <span className="text-xs font-black text-slate-900">{parsedRecord.address.kind}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                      <span className="text-xs font-black text-slate-500">Risk</span>
                      <span className="text-xs font-black text-slate-900">{parsedRecord.riskLevel}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                      <span className="text-xs font-black text-slate-500">Expires</span>
                      <span className="text-xs font-black text-slate-900">{formatTime(parsedRecord.expiresAt)}</span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-black text-amber-800">
                    Invalid or unsupported field payload.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('proofMethod')}</span>
                  <select
                    value={proofMethod}
                    onChange={event => setProofMethod(event.target.value as FieldHandoffProofMethod)}
                    className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {PROOF_METHODS.map(method => (
                      <option key={method} value={method}>{proofMethodLabel(appLanguage, method)}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('challenge')}</span>
                  <input
                    value={recipientChallenge}
                    onChange={event => setRecipientChallenge(event.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('secret')}</span>
                  <input
                    type="password"
                    value={recipientSecret}
                    onChange={event => setRecipientSecret(event.target.value)}
                    placeholder={appLanguage.startsWith('ja') ? '画面には表示しません' : 'Not displayed on screen'}
                    className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('reason')}</span>
                  <select
                    value={reachabilityReason}
                    onChange={event => setReachabilityReason(event.target.value as FieldHandoffReachabilityReason)}
                    className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {REACHABILITY_REASONS.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('safeNote')}</span>
                  <input
                    value={safeNote}
                    onChange={event => setSafeNote(event.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleSync(true)}
                  className="flex h-11 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t('syncAccepted')}
                </button>
                <button
                  type="button"
                  onClick={() => handleSync(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-800 transition hover:bg-amber-100 active:scale-95"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {t('syncConflict')}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('latestReceipt')}</p>
              {latestReceipt ? (
                <div className="mt-3 space-y-3">
                  <div className={cn('rounded-md border px-3 py-3', statusTone(latestReceipt.status))}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-widest">{latestReceipt.status.replace(/_/g, ' ')}</span>
                      <span className="rounded bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-widest">
                        {decisionLabel(appLanguage, latestReceipt.decision)}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-xs font-black">{latestReceipt.receiptId}</p>
                  </div>
                  <div className="grid gap-2">
                    <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">Action: {latestReceipt.action}</div>
                    <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">Stop: {latestReceipt.stopAlias}</div>
                    <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{t('syncState')}: {latestReceipt.syncState}</div>
                    <div className="break-all rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{t('offlineQueueRef')}: {latestReceipt.offlineQueueRef}</div>
                    <div className="break-all rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{t('receiptFingerprint')}: {latestReceipt.signature.receiptFingerprint}</div>
                    <div className="break-all rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{t('signedReceipt')}: {latestReceipt.signature.signatureId}</div>
                    <div className="break-all rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{t('terminalSignature')}: {latestReceipt.signature.terminalSignature ?? latestReceipt.signature.signatureId}</div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('evidencePackage')}</p>
                      <div className="mt-2 grid gap-2">
                        <div className="break-all rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                          {t('offlineEvidence')}: {latestReceipt.offlineEvidence?.evidenceId ?? latestReceipt.offlineQueueRef}
                        </div>
                        {latestReceipt.offlineEvidence && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                              deferred sync: {latestReceipt.offlineEvidence.deferredSyncRequired ? 'required' : 'not required'}
                            </div>
                            <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                              conflict policy: review case
                            </div>
                          </div>
                        )}
                        {latestReceipt.recipientProofEvidence && (
                          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
                            <div className="break-all font-mono">{t('recipientProofEvidence')}: {latestReceipt.recipientProofEvidence.evidenceId}</div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <span>{t('proofVerified')}: {latestReceipt.recipientProofEvidence.verified ? 'yes' : 'no'}</span>
                              <span>{t('challengeObserved')}: {latestReceipt.recipientProofEvidence.challengeObserved ? 'yes' : 'no'}</span>
                              <span>{t('signatureObserved')}: {latestReceipt.recipientProofEvidence.signatureObserved ? 'yes' : 'no'}</span>
                              <span>{t('proofSecretsNotStored')}: yes</span>
                            </div>
                          </div>
                        )}
                        {latestReceipt.reachabilityEvidence && (
                          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-900">
                            <div className="break-all font-mono">{t('reachabilityEvidence')}: {latestReceipt.reachabilityEvidence.evidenceId}</div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <span>{t('safeCategoryOnly')}: {latestReceipt.reachabilityEvidence.safeCategoryOnly ? 'yes' : 'no'}</span>
                              <span>precise location: not stored</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {latestReceipt.reviewCaseId && (
                      <div className="rounded-md bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">Review: {latestReceipt.reviewCaseId}</div>
                    )}
                    {[...latestReceipt.warnings, ...latestReceipt.errors].slice(0, 5).map(item => (
                      <div key={item} className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{item}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 rounded-md bg-slate-50 px-3 py-4 text-sm font-bold text-slate-500">{t('noReceipt')}</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
