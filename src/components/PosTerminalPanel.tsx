import type { Html5QrcodeScanner } from 'html5-qrcode';
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Keyboard,
  QrCode,
  RadioReceiver,
  ShieldAlert,
  ShieldCheck,
  Truck,
  WifiOff,
  Wrench,
} from 'lucide-react';
import React from 'react';

import {
  LatestReceiptPanel,
  LocalPreviewPanel,
  PosModeSelector,
  PosDecisionBanner,
  PosDeviceDiagnosticsPanel,
  PosDesignReviewPanel,
  PosExceptionAuditPanel,
  PosHandoffBoardPanel,
  PosHandoffReverificationPanel,
  PosManagementConsolePanel,
  PosMeasurementInstrumentPanel,
  PosNetworkAssurancePanel,
  PosOfflineQueueSummary,
  PosOperatorActionPanel,
  PosReaderShell,
  PosRegistryOperationsPanel,
  PosStaffPermissionPanel,
  SecureAgidKeyPanel,
  PosTerminalSettingsForm,
  PosTrustStatePanel,
  PosWorkflowRail,
  ReceiptLogPanel,
  type PosModeOption,
  type PosMeasurementInstrumentKind,
  type PosMeasurementReading,
  type PosWorkspaceId,
} from './pos/PosTerminalSections';
import { apiEndpoints } from '../lib/apiEndpoints';
import {
  buildPosRecipientKeyPlan,
  isPosSecureKeyEntry,
  openAgidSecureForPos,
  rotatePosSecureKeyEntry,
  type AgidSecurePosRegistryDecision,
  type PosSecureKeyEntry,
} from '../lib/agidSecurePos';
import {
  buildPosNfcPayload,
  previewPosAcceptanceInput,
  type PosAcceptanceChannel,
  type PosAcceptanceReceipt,
} from '../lib/posAcceptance';
import {
  buildPosDestinationQrSummary,
  type PosDestinationQrStatus,
  type PosDestinationQrSummary,
} from '../lib/pos/destinationQr';
import type {
  PosEthereumPaymentKind,
  PosEthereumPaymentStatus,
  PosEthereumSettlementMode,
} from '../lib/posEthereumPayment';
import {
  buildShippingLabelQrPayload,
  createShippingLabelRecipientChallenge,
  createShippingLabelRecipientChallengeSignature,
  parseShippingLabelQrPayload,
  SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS,
  SHIPPING_LABEL_STANDARD_TTL_SECONDS,
  type ShippingLabelHighRiskUseCase,
  type ShippingLabelRecipientProofMethod,
  type ShippingLabelRiskLevel,
  type ShippingLabelScanRole,
} from '../lib/shippingLabelQr';
import {
  buildPosDeviceDiagnostics,
  buildPosExceptionAuditCases,
  buildPosHandoffReverificationReport,
  buildPosManagementSnapshot,
  getPosStaffProfile,
  hasPosStaffPermission,
  type PosHardwareCapabilitySnapshot,
  type PosStaffRole,
} from '../lib/posOperationalControls';
import {
  buildAddressTerminalFleetSnapshot,
  type AddressTerminalSyncState,
} from '../lib/addressTerminal';
import { buildPosDesignReview } from '../lib/posDesignReview';
import {
  buildDeviceDiagnosticsPrintDocument,
  buildExceptionAuditPrintDocument,
  buildHandoffReverificationPrintDocument,
  buildManagementSummaryPrintDocument,
  buildOfflineQueuePrintDocument,
  buildRedactedReceiptPrintDocument,
  buildShippingLabelSlipPrintDocument,
  type PosPrintableDocument,
} from '../lib/posPrint';
import type { PosRuntimePolicy } from '../lib/posRuntimePolicy';
import { buildCiscoInspiredNetworkAssurance } from '../lib/ciscoInspiredNetworkAssurance';
import type {
  CarrierLabelAddressRisk,
  CarrierLabelRejectionReason,
} from '../lib/carrierLabelIntent';
import { cn } from '../lib/utils';

type AgidResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
};

type PosCapabilities = {
  runtimePolicy?: PosRuntimePolicy;
};

type PosRecentReceipts = {
  receipts?: PosAcceptanceReceipt[];
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

function deriveHighRiskUseCases(purpose: string): ShippingLabelHighRiskUseCase[] {
  const normalized = purpose.toLowerCase();
  const useCases = new Set<ShippingLabelHighRiskUseCase>();
  if (/\bdv\b|domestic|violence|abuse|shelter/.test(normalized)) useCases.add('domestic-violence');
  if (/evacuation|evacuee|shelter|避難/.test(normalized)) useCases.add('evacuation');
  if (/refugee|asylum|難民/.test(normalized)) useCases.add('refugee');
  if (/humanitarian|relief|aid|support|災害|支援/.test(normalized)) useCases.add('humanitarian');
  if (useCases.size === 0) useCases.add('field-protection');
  return Array.from(useCases);
}

type PosAgidSecureRegistryVerify = {
  decision?: AgidSecurePosRegistryDecision;
  registry?: PosAgidSecureRegistryStatus;
};

type SecureOpenPreview = {
  status: 'idle' | 'ok' | 'error';
  message: string;
  keyId?: string;
  agidTail?: string;
  errors?: string[];
  warnings?: string[];
};

type NdefRecordLike = {
  data?: DataView | ArrayBuffer | Uint8Array | string;
  encoding?: string;
};

type NdefReaderLike = {
  scan: () => Promise<void>;
  write?: (message: unknown) => Promise<void>;
  onreading: ((event: { message: { records: NdefRecordLike[] } }) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
};

type NdefReaderConstructor = new () => NdefReaderLike;

type PosTerminalPanelProps = {
  appLanguage: string;
  appLanguageLabel: string;
  onAppLanguageChange: (value: string) => void;
  showAlert: (title: string, message: string) => void;
};

function cleanText(value: string) {
  return value.trim();
}

function readStoredSecureKeys() {
  try {
    const saved = localStorage.getItem('agid_pos_agid_s_keys');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isPosSecureKeyEntry) : [];
  } catch {
    return [];
  }
}

function decodeNdefRecord(record: NdefRecordLike) {
  if (typeof record.data === 'string') return record.data;
  if (!record.data) return '';
  const encoding = record.encoding || 'utf-8';
  const decoder = new TextDecoder(encoding);
  if (record.data instanceof DataView) return decoder.decode(record.data);
  return decoder.decode(record.data);
}

function readBrowserNfcConstructor() {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { NDEFReader?: NdefReaderConstructor }).NDEFReader;
}

function isPosStaffRole(value: unknown): value is PosStaffRole {
  return value === 'cashier'
    || value === 'pickup-operator'
    || value === 'delivery-supervisor'
    || value === 'field-admin';
}

function isPaymentKind(value: unknown): value is PosEthereumPaymentKind {
  return value === 'prepaid' || value === 'collect-on-delivery';
}

function readStoredPaymentKind(): PosEthereumPaymentKind {
  const saved = localStorage.getItem('agid_pos_payment_kind');
  return isPaymentKind(saved) ? saved : 'prepaid';
}

function isSettlementMode(value: unknown): value is PosEthereumSettlementMode {
  return value === 'offchain-observed' || value === 'ethereum-registry' || value === 'ethereum-escrow';
}

function readStoredSettlementMode(): PosEthereumSettlementMode {
  const saved = localStorage.getItem('agid_pos_settlement_mode');
  return isSettlementMode(saved) ? saved : 'ethereum-registry';
}

function isPaymentStatus(value: unknown): value is PosEthereumPaymentStatus {
  return value === 'requires-payment'
    || value === 'authorized'
    || value === 'escrowed'
    || value === 'paid'
    || value === 'released'
    || value === 'refunded'
    || value === 'cancelled'
    || value === 'rejected'
    || value === 'review';
}

function readStoredPaymentStatus(): PosEthereumPaymentStatus {
  const saved = localStorage.getItem('agid_pos_payment_status');
  return isPaymentStatus(saved) ? saved : 'requires-payment';
}

function readStoredBoolean(key: string, fallback = false) {
  const saved = localStorage.getItem(key);
  if (saved === 'true') return true;
  if (saved === 'false') return false;
  return fallback;
}

function readStoredStaffRole(): PosStaffRole {
  const saved = localStorage.getItem('agid_pos_staff_role');
  return isPosStaffRole(saved) ? saved : 'pickup-operator';
}

function isMeasurementKind(value: unknown): value is PosMeasurementInstrumentKind {
  return value === 'weight-scale'
    || value === 'dimensioner'
    || value === 'temperature-probe'
    || value === 'multimeter'
    || value === 'custom-meter';
}

function isPosMeasurementReading(value: unknown): value is PosMeasurementReading {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PosMeasurementReading>;
  return typeof item.id === 'string'
    && isMeasurementKind(item.kind)
    && typeof item.value === 'string'
    && typeof item.unit === 'string'
    && typeof item.capturedAt === 'string';
}

function readStoredMeasurementReadings(): PosMeasurementReading[] {
  try {
    const saved = localStorage.getItem('agid_pos_measurement_readings');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.filter(isPosMeasurementReading).slice(0, 20)
      : [];
  } catch {
    return [];
  }
}

function defaultMeasurementUnit(kind: PosMeasurementInstrumentKind) {
  if (kind === 'weight-scale') return 'kg';
  if (kind === 'dimensioner') return 'cm';
  if (kind === 'temperature-probe') return 'C';
  if (kind === 'multimeter') return 'V';
  return 'unit';
}

function buildDemoMeasurement(kind: PosMeasurementInstrumentKind) {
  const seed = Date.now() % 997;
  if (kind === 'weight-scale') return { value: (0.5 + (seed % 850) / 100).toFixed(2), unit: 'kg' };
  if (kind === 'dimensioner') return { value: `${20 + (seed % 50)} x ${15 + (seed % 30)} x ${8 + (seed % 20)}`, unit: 'cm' };
  if (kind === 'temperature-probe') return { value: (2 + (seed % 120) / 10).toFixed(1), unit: 'C' };
  if (kind === 'multimeter') return { value: (3 + (seed % 900) / 100).toFixed(2), unit: 'V' };
  return { value: String(100 + (seed % 900)), unit: 'unit' };
}

function buildMeasurementReadingId(seed: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `PMR-${hash.toString(36).toUpperCase().padStart(7, '0').slice(-7)}`;
}

type PosPanelCopyKey =
  | 'workspaceAdmin'
  | 'workspaceScan'
  | 'workspaceDecision'
  | 'workspaceHandoff'
  | 'workspaceStaff'
  | 'workspaceDevices'
  | 'workspaceAudit'
  | 'workspaceReport'
  | 'workspaceRegistry'
  | 'workspaceNetwork'
  | 'workspaceKeys'
  | 'workspaceQueue'
  | 'workspaceDesign'
  | 'settingsWorkspace'
  | 'primaryFlow'
  | 'operations'
  | 'settingsKicker'
  | 'settingsTitle'
  | 'settingsSummary'
  | 'professionalCollaboration'
  | 'professionalCollaborationSummary'
  | 'terminalCommand'
  | 'terminalCommandSummary'
  | 'safeEnvelope'
  | 'readDestinationQr'
  | 'openDecision'
  | 'continueHandoff'
  | 'openOfflineQueue'
  | 'currentStep'
  | 'privacyPosture'
  | 'queueTotal'
  | 'operator'
  | 'cashierReview'
  | 'cashierReviewBody'
  | 'cashierReviewAction'
  | 'handoffReview'
  | 'handoffReviewBody'
  | 'handoffReviewAction'
  | 'supervisorReview'
  | 'supervisorReviewBody'
  | 'supervisorReviewAction'
  | 'technicalOpsReview'
  | 'technicalOpsReviewBody'
  | 'technicalOpsReviewAction'
  | 'securityReview'
  | 'securityReviewBody'
  | 'securityReviewAction'
  | 'matchedSignals'
  | 'riskSignals';

type PosProfessionReview = {
  id: 'cashier' | 'handoff' | 'supervisor' | 'technical' | 'security';
  titleKey: PosPanelCopyKey;
  bodyKey: PosPanelCopyKey;
  actionKey: PosPanelCopyKey;
  icon: React.ComponentType<{ className?: string }>;
  workspace: PosWorkspaceId;
  matchedSignals: number;
  riskSignals: number;
};

const POS_PANEL_COPY: Record<'en' | 'ja', Record<PosPanelCopyKey, string>> = {
  en: {
    workspaceAdmin: 'Admin',
    workspaceScan: 'Scan',
    workspaceDecision: 'Decision',
    workspaceHandoff: 'Handoff',
    workspaceStaff: 'Staff',
    workspaceDevices: 'Devices',
    workspaceAudit: 'Audit',
    workspaceReport: 'Receipt',
    workspaceRegistry: 'Registry',
    workspaceNetwork: 'Network',
    workspaceKeys: 'Keys',
    workspaceQueue: 'Queue',
    workspaceDesign: 'Design',
    settingsWorkspace: 'Settings',
    primaryFlow: 'Primary flow',
    operations: 'Operations',
    settingsKicker: 'Terminal Settings',
    settingsTitle: 'Operator, language, and transaction context',
    settingsSummary: 'Configure the local terminal values that appear in receipts, audits, QR/NFC acceptance, and registry checks.',
    professionalCollaboration: 'Professional collaboration',
    professionalCollaborationSummary: 'Coordinate the POS flow by role: counter, carrier, supervisor, technical ops, and security without exposing raw address material.',
    terminalCommand: 'Counter command center',
    terminalCommandSummary: 'Decide what the staff can do now, then move through the fixed POS flow without exposing raw address text.',
    safeEnvelope: 'Safe envelope',
    readDestinationQr: 'Read destination QR',
    openDecision: 'Open decision',
    continueHandoff: 'Continue handoff',
    openOfflineQueue: 'Open offline queue',
    currentStep: 'Current step',
    privacyPosture: 'Privacy posture',
    queueTotal: 'Queue total',
    operator: 'Operator',
    cashierReview: 'Counter / Cashier',
    cashierReviewBody: 'Scan readiness, decision status, payment posture, and redacted receipt actions.',
    cashierReviewAction: 'Operate counter flow',
    handoffReview: 'Carrier handoff',
    handoffReviewBody: 'Recipient proof, carrier terminal signature, package receipt, and release controls.',
    handoffReviewAction: 'Review handoff',
    supervisorReview: 'Supervisor / Manager',
    supervisorReviewBody: 'Exception cases, management risks, staff authority, and reporting.',
    supervisorReviewAction: 'Open supervision',
    technicalOpsReview: 'Technical operations',
    technicalOpsReviewBody: 'Devices, network assurance, registry freshness, and offline queue.',
    technicalOpsReviewAction: 'Check operations',
    securityReview: 'Security / Audit',
    securityReviewBody: 'AGID-S keys, proof receipts, rejection reasons, and compliance gates.',
    securityReviewAction: 'Inspect security',
    matchedSignals: 'Signals',
    riskSignals: 'Needs attention',
  },
  ja: {
    workspaceAdmin: '管理',
    workspaceScan: '受付',
    workspaceDecision: '判定',
    workspaceHandoff: '引渡',
    workspaceStaff: 'スタッフ',
    workspaceDevices: '端末',
    workspaceAudit: '監査',
    workspaceReport: 'レシート',
    workspaceRegistry: 'レジストリ',
    workspaceNetwork: 'ネットワーク',
    workspaceKeys: '鍵',
    workspaceQueue: 'キュー',
    workspaceDesign: 'デザイン',
    settingsWorkspace: '設定',
    primaryFlow: '主導線',
    operations: '運用',
    settingsKicker: '端末設定',
    settingsTitle: '担当者・言語・取引コンテキスト',
    settingsSummary: 'レシート、監査、QR/NFC受付、レジストリ照合に使うローカル端末値を設定します。',
    professionalCollaboration: '職種別連携',
    professionalCollaborationSummary: '実住所を出さずに、レジ・配送・監督・技術運用・セキュリティが見るべきPOS状態へ切り替えます。',
    terminalCommand: 'カウンター司令室',
    terminalCommandSummary: 'スタッフが今できることを判断し、実住所を出さずに固定POSフローを進めます。',
    safeEnvelope: '安全エンベロープ',
    readDestinationQr: '配送先QRを読む',
    openDecision: '判定を開く',
    continueHandoff: '引渡を続ける',
    openOfflineQueue: 'オフラインキュー',
    currentStep: '現在の工程',
    privacyPosture: '秘匿姿勢',
    queueTotal: 'キュー合計',
    operator: '担当者',
    cashierReview: 'レジ / カウンター',
    cashierReviewBody: '受付準備、判定状態、支払い姿勢、秘匿レシート操作を確認します。',
    cashierReviewAction: 'カウンターを操作',
    handoffReview: '配送引き渡し',
    handoffReviewBody: '受取人証明、配送端末署名、荷物受領、release制御を確認します。',
    handoffReviewAction: '引き渡し確認',
    supervisorReview: '監督 / 店長',
    supervisorReviewBody: '例外ケース、管理リスク、スタッフ権限、レポートを確認します。',
    supervisorReviewAction: '監督画面を開く',
    technicalOpsReview: '技術運用',
    technicalOpsReviewBody: '端末、ネットワーク、レジストリ鮮度、オフラインキューを確認します。',
    technicalOpsReviewAction: '運用を点検',
    securityReview: 'セキュリティ / 監査',
    securityReviewBody: 'AGID-S鍵、証明receipt、拒否理由、compliance gateを確認します。',
    securityReviewAction: 'セキュリティ確認',
    matchedSignals: '確認項目',
    riskSignals: '要注意',
  },
};

function posPanelCopy(language: string, key: PosPanelCopyKey) {
  return POS_PANEL_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function posPanelInlineCopy(language: string, en: string, ja: string) {
  return language.startsWith('ja') ? ja : en;
}

function posScannerMessage(language: string, message: string) {
  if (!language.startsWith('ja')) return message;
  const fixed: Record<string, string> = {
    Ready: '準備完了',
    Verifying: '検証中',
    Rejected: '拒否',
    Accepted: '受付完了',
    'Accepted with review': '要確認で受付',
    'Shipping label QR prepared': '送り状QRを準備しました',
    'Recipient challenge issued and locally signed': '受取人チャレンジを発行しローカル署名しました',
    'Recipient challenge issued': '受取人チャレンジを発行しました',
    'Opening AGID-S': 'AGID-Sを復号中',
    'Registry rejected': 'レジストリが拒否しました',
    'Loading camera': 'カメラ読込中',
    'QR scanner unavailable': 'QRスキャナーを利用できません',
    'Camera active': 'カメラ起動中',
    'Web NFC unavailable': 'Web NFCを利用できません',
    'NFC read error': 'NFC読み取りエラー',
    'Waiting for NFC tag': 'NFCタグ待機中',
    'NFC wrapper prepared': 'NFCラッパーを準備しました',
    'Measurement captured from demo adapter': 'デモアダプターから計測値を取得しました',
    'Measurement saved to local POS log': '計測値をローカルPOSログに保存しました',
    'Measurement log cleared': '計測ログを消去しました',
    'Management report exported': '管理レポートを出力しました',
    'Printer diagnostics ready': 'プリンタ診断準備完了',
    'Cash drawer test logged': 'キャッシュドロワー確認を記録しました',
    'Barcode reader pairing checked': 'バーコードリーダー連携を確認しました',
    'Measuring instrument pairing checked': '電子計測器連携を確認しました',
    idle: '待機',
    waiting: '待機中',
    unsupported: '未対応',
    error: 'エラー',
  };
  if (message.startsWith('Print ready: ')) {
    return `印刷準備完了: ${message.slice('Print ready: '.length)}`;
  }
  return fixed[message] || message;
}

function posDestinationQrStatusLabel(language: string, status: PosDestinationQrStatus) {
  if (!usesJapanesePosCopy(language)) return status;
  if (status === 'ready') return '読取可能';
  if (status === 'needs-review') return '要確認';
  if (status === 'expired') return '期限切れ';
  if (status === 'unsupported') return '未対応';
  return '未読取';
}

function posDestinationQrNextActionLabel(language: string, action: PosDestinationQrSummary['nextAction']) {
  if (!usesJapanesePosCopy(language)) return action.replace(/_/g, ' ');
  if (action === 'accept_at_pos') return 'POSで受付';
  if (action === 'review_before_acceptance') return '受付前に確認';
  if (action === 'scan_guest_address_qr') return 'ゲスト住所QRを追加読取';
  if (action === 'reject_or_refresh') return '更新QRを依頼';
  return '手入力';
}

function posDestinationQrStatusClass(status: PosDestinationQrStatus) {
  if (status === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'needs-review') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'expired' || status === 'unsupported') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-slate-200 bg-slate-50 text-slate-500';
}

type PosPrimaryFlowItem = {
  id: PosWorkspaceId;
  label: string;
  detail: string;
  count?: number;
  countLabel?: string;
  tone?: 'normal' | 'warning' | 'danger' | 'ok';
  primary?: boolean;
  step?: number;
};

type PosStaffDecision = 'accept' | 'review' | 'reject';

function posDestinationQrEligibilityLabel(language: string, summary: PosDestinationQrSummary) {
  if (summary.deliveryEligibility === 'can-accept') {
    return posPanelInlineCopy(language, 'Can accept', '受け取れる');
  }
  if (summary.deliveryEligibility === 'reject') {
    return posPanelInlineCopy(language, 'Reject', '拒否');
  }
  return posPanelInlineCopy(language, 'Review', '要確認');
}

function posStaffDecisionFromState(
  receipt: PosAcceptanceReceipt | null,
  preview: { status: PosAcceptanceReceipt['status'] } | null,
  destination: PosDestinationQrSummary,
): PosStaffDecision {
  const status = receipt?.status ?? preview?.status;
  if (status === 'accepted') return 'accept';
  if (status === 'rejected') return 'reject';
  if (status === 'review') return 'review';
  if (destination.deliveryEligibility === 'can-accept') return 'accept';
  if (destination.deliveryEligibility === 'reject') return 'reject';
  return 'review';
}

function posStaffDecisionClasses(decision: PosStaffDecision, active: boolean) {
  if (decision === 'accept') {
    return active
      ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-900/10'
      : 'border-emerald-100 bg-emerald-50 text-emerald-800';
  }
  if (decision === 'reject') {
    return active
      ? 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-900/10'
      : 'border-rose-100 bg-rose-50 text-rose-800';
  }
  return active
    ? 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-900/10'
    : 'border-amber-100 bg-amber-50 text-amber-900';
}

const PosPrimaryFlowStepper: React.FC<{
  active: PosWorkspaceId;
  items: PosPrimaryFlowItem[];
  language: string;
  onChange: (id: PosWorkspaceId) => void;
}> = ({ active, items, language, onChange }) => {
  const primaryFlowItems = items
    .filter(item => item.primary)
    .sort((a, b) => (a.step ?? 0) - (b.step ?? 0));

  return (
    <section
      className="sticky top-[76px] z-10 rounded-lg border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur"
      aria-label="Scan -> Decision -> Handoff -> Receipt"
    >
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
          {posPanelInlineCopy(language, 'Fixed POS flow', '固定POSフロー')}
        </p>
        <p className="truncate text-[10px] font-black tracking-widest text-blue-600">
          {'Scan -> Decision -> Handoff -> Receipt'}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {primaryFlowItems.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                'min-w-0 rounded-md border px-2 py-2 text-left transition active:scale-[0.98]',
                isActive
                  ? 'border-slate-950 bg-slate-950 text-white shadow-md'
                  : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-black tabular-nums',
                  isActive ? 'bg-white/10 text-white' : 'bg-white text-blue-700 shadow-sm',
                )}>
                  {item.step}
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className={cn(
                    'h-5 min-w-5 rounded px-1 text-center text-[10px] font-black tabular-nums',
                    isActive ? 'bg-white/15 text-white' : 'bg-amber-100 text-amber-800',
                  )}>
                    {item.count}
                  </span>
                )}
              </span>
              <span className="mt-2 block truncate text-xs font-black">{item.label}</span>
              <span className={cn(
                'mt-0.5 block truncate text-[9px] font-black uppercase tracking-widest',
                isActive ? 'text-white/50' : 'text-slate-400',
              )}>
                {item.detail}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const PosStaffDecisionPanel: React.FC<{
  receipt: PosAcceptanceReceipt | null;
  preview: { status: PosAcceptanceReceipt['status']; errors?: string[]; warnings?: string[] } | null;
  destination: PosDestinationQrSummary;
  language: string;
}> = ({ receipt, preview, destination, language }) => {
  const activeDecision = posStaffDecisionFromState(receipt, preview, destination);
  const cards: Array<{
    id: PosStaffDecision;
    label: string;
    detail: string;
  }> = [
    {
      id: 'accept',
      label: posPanelInlineCopy(language, 'Can accept', '受け取れる'),
      detail: posPanelInlineCopy(language, 'Delivery may continue to handoff.', '引き渡しへ進めます。'),
    },
    {
      id: 'review',
      label: posPanelInlineCopy(language, 'Review', '要確認'),
      detail: posPanelInlineCopy(language, 'Check QR, alias, payment, or carrier policy.', 'QR、alias、決済、配送ポリシーを確認。'),
    },
    {
      id: 'reject',
      label: posPanelInlineCopy(language, 'Reject', '拒否'),
      detail: posPanelInlineCopy(language, 'Do not accept until refreshed or corrected.', '更新または修正まで受け付けません。'),
    },
  ];
  const issueCount = (receipt?.errors.length ?? 0)
    + (receipt?.warnings.length ?? 0)
    + (preview?.errors?.length ?? 0)
    + (preview?.warnings?.length ?? 0)
    + destination.warnings.length;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {posPanelInlineCopy(language, 'POS staff decision', 'POSスタッフ判定')}
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950">
            {posPanelInlineCopy(language, 'Show only acceptability, alias, and receipt state', '配送可否・alias・receiptだけを表示')}
          </h3>
        </div>
        <span className="w-fit rounded-md bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
          {issueCount} {posPanelInlineCopy(language, 'signals', 'シグナル')}
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {cards.map(card => {
          const active = activeDecision === card.id;
          return (
            <div
              key={card.id}
              className={cn('min-h-[112px] rounded-lg border p-4', posStaffDecisionClasses(card.id, active))}
              aria-current={active ? 'step' : undefined}
            >
              <p className="text-2xl font-black tracking-tight md:text-3xl">{card.label}</p>
              <p className={cn('mt-2 text-sm font-bold leading-5', active ? 'text-white/80' : 'opacity-75')}>
                {card.detail}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-black text-slate-700 md:grid-cols-3">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-400">
            {posPanelInlineCopy(language, 'Delivery eligibility', '配送可否')}
          </p>
          <p className="mt-1 text-sm text-slate-950">{posDestinationQrEligibilityLabel(language, destination)}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-400">Alias</p>
          <p className="mt-1 break-all font-mono text-sm text-slate-950">{destination.alias}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-400">
            {posPanelInlineCopy(language, 'Receipt', 'Receipt')}
          </p>
          <p className="mt-1 break-all font-mono text-sm text-slate-950">{receipt?.receiptId ?? destination.receiptHint}</p>
        </div>
      </div>
    </section>
  );
};

const PosOfflineQueueVisibilityPanel: React.FC<{
  paymentQueueCount: number;
  deliveryQueueCount: number;
  syncState: 'idle' | 'loading' | 'error';
  language: string;
  onOpenQueue: () => void;
}> = ({ paymentQueueCount, deliveryQueueCount, syncState, language, onOpenQueue }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-stretch">
      <div className="rounded-md bg-amber-50 px-4 py-3 text-amber-900">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
          {posPanelInlineCopy(language, 'Offline payment queue', 'オフライン決済キュー')}
        </p>
        <p className="mt-1 text-2xl font-black tabular-nums">{paymentQueueCount}</p>
      </div>
      <div className="rounded-md bg-sky-50 px-4 py-3 text-sky-950">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
          {posPanelInlineCopy(language, 'Offline delivery acceptance queue', 'オフライン配送受付キュー')}
        </p>
        <p className="mt-1 text-2xl font-black tabular-nums">{deliveryQueueCount}</p>
      </div>
      <button
        type="button"
        onClick={onOpenQueue}
        className="inline-flex min-h-14 items-center justify-center rounded-md bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-600"
      >
        {syncState === 'loading'
          ? posPanelInlineCopy(language, 'Syncing', '同期中')
          : posPanelInlineCopy(language, 'Open queue', 'キューを開く')}
      </button>
    </div>
  </section>
);

const PosTerminalCommandCenter: React.FC<{
  activeWorkspaceLabel: string;
  activeWorkspaceDetail: string;
  terminalId: string;
  mode: PosAcceptanceChannel;
  scannerMessage: string;
  receipt: PosAcceptanceReceipt | null;
  preview: { status: PosAcceptanceReceipt['status']; errors?: string[]; warnings?: string[] } | null;
  destination: PosDestinationQrSummary;
  syncState: 'idle' | 'loading' | 'error';
  registryFresh: boolean;
  activeSecureKeyCount: number;
  queueTotal: number;
  operatorId: string;
  language: string;
  onReadQr: () => void;
  onOpenDecision: () => void;
  onContinueHandoff: () => void;
  onOpenQueue: () => void;
}> = ({
  activeWorkspaceLabel,
  activeWorkspaceDetail,
  terminalId,
  mode,
  scannerMessage,
  receipt,
  preview,
  destination,
  syncState,
  registryFresh,
  activeSecureKeyCount,
  queueTotal,
  operatorId,
  language,
  onReadQr,
  onOpenDecision,
  onContinueHandoff,
  onOpenQueue,
}) => {
  const activeDecision = posStaffDecisionFromState(receipt, preview, destination);
  const decisionCards: Array<{
    id: PosStaffDecision;
    label: string;
    detail: string;
    action: () => void;
  }> = [
    {
      id: 'accept',
      label: posPanelInlineCopy(language, 'Can accept', '受け取れる'),
      detail: posPanelInlineCopy(language, 'Safe to continue to handoff.', '引き渡しへ進めます。'),
      action: onContinueHandoff,
    },
    {
      id: 'review',
      label: posPanelInlineCopy(language, 'Review', '要確認'),
      detail: posPanelInlineCopy(language, 'Open reasons before release.', '引渡前に理由を確認。'),
      action: onOpenDecision,
    },
    {
      id: 'reject',
      label: posPanelInlineCopy(language, 'Reject', '拒否'),
      detail: posPanelInlineCopy(language, 'Stop until refreshed or corrected.', '更新または修正まで停止。'),
      action: onOpenDecision,
    },
  ];
  const posture = [
    posPanelInlineCopy(language, 'No raw address', '実住所なし'),
    posPanelInlineCopy(language, 'No recipient name', '受取人名なし'),
    posPanelInlineCopy(language, 'Receipt only', 'receiptのみ'),
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)]">
        <div className="bg-slate-950 p-4 text-white sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300">
                {posPanelCopy(language, 'terminalCommand')}
              </p>
              <h2 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-white sm:text-3xl">
                {posPanelCopy(language, 'terminalCommandSummary')}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {posture.map(item => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid min-w-[240px] gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={onReadQr}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-400 active:scale-[0.98]"
              >
                <QrCode className="h-5 w-5" />
                {posPanelCopy(language, 'readDestinationQr')}
              </button>
              <button
                type="button"
                onClick={onOpenQueue}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white hover:text-slate-950 active:scale-[0.98]"
              >
                <WifiOff className="h-5 w-5" />
                {posPanelCopy(language, 'openOfflineQueue')}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {decisionCards.map(card => {
              const active = activeDecision === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={card.action}
                  className={cn(
                    'min-h-[132px] rounded-xl border p-4 text-left transition hover:-translate-y-0.5 active:scale-[0.98]',
                    posStaffDecisionClasses(card.id, active),
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  <p className="text-2xl font-black tracking-tight">{card.label}</p>
                  <p className={cn('mt-2 text-sm font-bold leading-5', active ? 'text-white/80' : 'opacity-75')}>
                    {card.detail}
                  </p>
                  <span className={cn(
                    'mt-4 inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest',
                    active ? 'bg-white/15 text-white' : 'bg-white/80 text-slate-700',
                  )}>
                    {card.id === 'accept' ? posPanelCopy(language, 'continueHandoff') : posPanelCopy(language, 'openDecision')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 bg-white p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{posPanelCopy(language, 'currentStep')}</p>
              <p className="mt-1 text-lg font-black text-slate-950">{activeWorkspaceLabel}</p>
              <p className="mt-1 truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{activeWorkspaceDetail}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{posPanelCopy(language, 'queueTotal')}</p>
              <p className="mt-1 text-lg font-black text-slate-950">{queueTotal}</p>
              <p className="mt-1 truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
                {posSyncStateDetail(language, syncState)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{posPanelCopy(language, 'operator')}</p>
              <p className="mt-1 truncate text-lg font-black text-slate-950">{operatorId || posPanelInlineCopy(language, 'Unassigned', '未設定')}</p>
              <p className="mt-1 truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{terminalId} / {mode.toUpperCase()}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{posPanelCopy(language, 'privacyPosture')}</p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {registryFresh ? posPanelInlineCopy(language, 'Registry fresh', '鮮度OK') : posPanelInlineCopy(language, 'Local fallback', 'ローカル代替')}
              </p>
              <p className="mt-1 truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
                {activeSecureKeyCount} {posPanelInlineCopy(language, 'active keys', '有効鍵')}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posPanelCopy(language, 'safeEnvelope')}</p>
              <span className={cn('rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-wider', posDestinationQrStatusClass(destination.status))}>
                {posDestinationQrStatusLabel(language, destination.status)}
              </span>
            </div>
            <p className="mt-3 line-clamp-2 text-lg font-black leading-6 text-slate-950">{destination.safeDestination}</p>
            <div className="mt-3 grid gap-2 text-xs font-black text-slate-700">
              <div className="flex min-w-0 justify-between gap-3 rounded-lg bg-white px-3 py-2">
                <span className="text-slate-400">Alias</span>
                <span className="truncate font-mono text-slate-900">{destination.alias}</span>
              </div>
              <div className="flex min-w-0 justify-between gap-3 rounded-lg bg-white px-3 py-2">
                <span className="text-slate-400">Reference</span>
                <span className="truncate font-mono text-slate-900">{destination.primaryReference}</span>
              </div>
              <div className="flex min-w-0 justify-between gap-3 rounded-lg bg-white px-3 py-2">
                <span className="text-slate-400">Receipt</span>
                <span className="truncate font-mono text-slate-900">{receipt?.receiptId ?? destination.receiptHint}</span>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
              {scannerMessage}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const PosDestinationQrPanel: React.FC<{
  summary: PosDestinationQrSummary;
  language: string;
  qrRunning: boolean;
  receiptId?: string;
  onReadQr: () => void;
}> = ({ summary, language, qrRunning, receiptId, onReadQr }) => (
  <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm md:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {posPanelInlineCopy(language, 'Delivery Destination QR', '配送先QR')}
          </p>
          <h5 className="mt-1 text-lg font-black text-slate-900">{summary.title}</h5>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            {posPanelInlineCopy(
              language,
              'POS can read registered address, shipping label, hotel delivery, and public AGID QR without showing raw address material.',
              'POSから登録住所、送り状、ホテル配送、公開AGIDのQRを読み取り、住所本文を出さずに確認します。',
            )}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReadQr}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-blue-600"
      >
        <QrCode className="h-4 w-4" />
        {qrRunning
          ? posPanelInlineCopy(language, 'Camera active', 'カメラ起動中')
          : posPanelInlineCopy(language, 'Read QR', 'QRを読む')}
      </button>
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <div className={cn('rounded-md border p-3', posDestinationQrStatusClass(summary.status))}>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{posPanelInlineCopy(language, 'Delivery eligibility', '配送可否')}</p>
        <p className="mt-2 text-xl font-black">{posDestinationQrEligibilityLabel(language, summary)}</p>
      </div>
      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{posPanelInlineCopy(language, 'Alias', 'Alias')}</p>
        <p className="mt-2 break-all font-mono text-sm font-black text-slate-800">{summary.alias}</p>
      </div>
      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{posPanelInlineCopy(language, 'Receipt', 'Receipt')}</p>
        <p className="mt-2 break-all font-mono text-sm font-black text-slate-800">{receiptId || summary.receiptHint}</p>
      </div>
    </div>

    <div className="mt-3 grid gap-3 md:grid-cols-3">
      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{posPanelInlineCopy(language, 'Status', '状態')}</p>
        <span className={cn('mt-2 inline-flex rounded border px-2 py-1 text-[10px] font-black uppercase tracking-wider', posDestinationQrStatusClass(summary.status))}>
          {posDestinationQrStatusLabel(language, summary.status)}
        </span>
      </div>
      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{posPanelInlineCopy(language, 'Source', 'ソース')}</p>
        <p className="mt-2 break-words text-xs font-black text-slate-700">{summary.source}</p>
      </div>
      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{posPanelInlineCopy(language, 'Next action', '次の操作')}</p>
        <p className="mt-2 text-xs font-black text-slate-700">{posDestinationQrNextActionLabel(language, summary.nextAction)}</p>
      </div>
    </div>

    <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{posPanelInlineCopy(language, 'Address body hidden', '住所本文は非表示')}</p>
      <p className="mt-2 text-sm font-black leading-6 text-slate-800">
        {posPanelInlineCopy(
          language,
          'Counter view uses delivery eligibility, alias, receipt, and redacted evidence only.',
          'カウンター表示は配送可否、alias、receipt、秘匿証拠だけを使います。',
        )}
      </p>
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      {summary.evidence.map(item => (
        <span key={item} className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
          {item}
        </span>
      ))}
      {summary.warnings.map(item => (
        <span key={item} className="rounded-md bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">
          {item}
        </span>
      ))}
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
        <ShieldCheck className="h-3.5 w-3.5" />
        {posPanelInlineCopy(language, 'No raw address', '住所本文なし')}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
        <ShieldCheck className="h-3.5 w-3.5" />
        {posPanelInlineCopy(language, 'No recipient name', '受取人名なし')}
      </span>
    </div>
  </div>
);

function usesJapanesePosCopy(language: string) {
  return language.startsWith('ja');
}

function posGradeDetail(language: string, grade: string) {
  if (!usesJapanesePosCopy(language)) return grade;
  if (grade === 'ready') return '準備完了';
  if (grade === 'attention') return '要確認';
  if (grade === 'blocked') return '停止';
  if (grade === 'cleared') return '照合済み';
  return grade;
}

function posDecisionDetail(language: string, status?: string) {
  if (!usesJapanesePosCopy(language)) return status || 'waiting';
  if (status === 'accepted') return '承認';
  if (status === 'review') return '要確認';
  if (status === 'rejected') return '拒否';
  return '待機';
}

function posStaffRoleDetail(language: string, role: PosStaffRole, fallback: string) {
  if (!usesJapanesePosCopy(language)) return fallback;
  if (role === 'cashier') return 'レジ担当';
  if (role === 'pickup-operator') return '受取担当';
  if (role === 'delivery-supervisor') return '配送責任者';
  return '現地管理者';
}

function posReadyCountDetail(language: string, count: number) {
  return usesJapanesePosCopy(language) ? `${count}件準備完了` : `${count} ready`;
}

function posCaseCountDetail(language: string, count: number) {
  return usesJapanesePosCopy(language) ? `${count}件` : `${count} cases`;
}

function posActiveCountDetail(language: string, count: number) {
  return usesJapanesePosCopy(language) ? `${count}件有効` : `${count} active`;
}

function posRegistryDetail(language: string, fresh: boolean) {
  if (!usesJapanesePosCopy(language)) return fresh ? 'fresh' : 'check';
  return fresh ? '最新' : '確認';
}

function posNetworkPostureDetail(language: string, posture: string) {
  if (!usesJapanesePosCopy(language)) return posture;
  if (posture === 'ready') return '準備完了';
  if (posture === 'monitor') return '監視';
  if (posture === 'restricted') return '制限';
  if (posture === 'blocked') return '停止';
  return posture;
}

function posSyncStateDetail(language: string, state: 'idle' | 'loading' | 'error') {
  if (!usesJapanesePosCopy(language)) return state;
  if (state === 'loading') return '同期中';
  if (state === 'error') return '再試行';
  return '待機';
}

function buildPosProfessionReviews(options: {
  needsDecisionAttention: boolean;
  handoffNeedsWork: boolean;
  handoffComplete: boolean;
  carrierTerminalCaptured: boolean;
  blockedAuditCases: number;
  managementRiskCount: number;
  deviceAttention: number;
  networkIssueCount: number;
  registryStale: boolean;
  queueIssue: boolean;
  activeSecureKeyCount: number;
  latestReceiptCount: number;
  paymentNeedsAttention: boolean;
}): PosProfessionReview[] {
  const counterRisk = Number(options.needsDecisionAttention) + Number(options.paymentNeedsAttention);
  const handoffRisk = Number(options.handoffNeedsWork) + Number(!options.carrierTerminalCaptured);
  const supervisorRisk = options.blockedAuditCases + options.managementRiskCount;
  const technicalRisk = options.deviceAttention
    + options.networkIssueCount
    + Number(options.registryStale)
    + Number(options.queueIssue);
  const securityRisk = options.blockedAuditCases
    + Number(options.activeSecureKeyCount === 0)
    + Number(options.needsDecisionAttention);

  return [
    {
      id: 'cashier',
      titleKey: 'cashierReview',
      bodyKey: 'cashierReviewBody',
      actionKey: 'cashierReviewAction',
      icon: Building2,
      workspace: options.needsDecisionAttention ? 'decision' : 'scan',
      matchedSignals: 4,
      riskSignals: counterRisk,
    },
    {
      id: 'handoff',
      titleKey: 'handoffReview',
      bodyKey: 'handoffReviewBody',
      actionKey: 'handoffReviewAction',
      icon: Truck,
      workspace: options.handoffComplete ? 'report' : 'handoff',
      matchedSignals: 4,
      riskSignals: handoffRisk,
    },
    {
      id: 'supervisor',
      titleKey: 'supervisorReview',
      bodyKey: 'supervisorReviewBody',
      actionKey: 'supervisorReviewAction',
      icon: BriefcaseBusiness,
      workspace: options.blockedAuditCases > 0 ? 'audit' : 'admin',
      matchedSignals: 4,
      riskSignals: supervisorRisk,
    },
    {
      id: 'technical',
      titleKey: 'technicalOpsReview',
      bodyKey: 'technicalOpsReviewBody',
      actionKey: 'technicalOpsReviewAction',
      icon: Wrench,
      workspace: options.deviceAttention > 0
        ? 'devices'
        : options.networkIssueCount > 0
          ? 'network'
          : options.registryStale
            ? 'registry'
            : options.queueIssue
              ? 'queue'
              : 'devices',
      matchedSignals: 4,
      riskSignals: technicalRisk,
    },
    {
      id: 'security',
      titleKey: 'securityReview',
      bodyKey: 'securityReviewBody',
      actionKey: 'securityReviewAction',
      icon: ShieldAlert,
      workspace: options.activeSecureKeyCount === 0 ? 'keys' : options.blockedAuditCases > 0 ? 'audit' : 'report',
      matchedSignals: Math.max(3, options.latestReceiptCount + options.activeSecureKeyCount),
      riskSignals: securityRisk,
    },
  ];
}

function shippingRecipientProofHint(method: ShippingLabelRecipientProofMethod) {
  return method === 'passkey-webauthn'
    ? 'Ask the recipient to present a Passkey/WebAuthn assertion at handoff.'
    : method === 'aoid-credential'
      ? 'Ask the recipient to present the AOID credential secret or holder proof at handoff.'
      : method === 'nfc-card'
        ? 'Ask the recipient to tap the registered NFC card at handoff.'
        : 'Ask the recipient for the one-time proof secret at handoff.';
}

function readHardwareCapabilities(
  checkedAt: string,
): PosHardwareCapabilitySnapshot {
  if (typeof navigator === 'undefined') {
    return {
      checkedAt,
      keyboardWedge: true,
    };
  }
  const nav = navigator as Navigator & {
    hid?: unknown;
    serial?: unknown;
    usb?: unknown;
  };
  return {
    checkedAt,
    webHid: Boolean(nav.hid),
    webSerial: Boolean(nav.serial),
    webUsb: Boolean(nav.usb),
    keyboardWedge: true,
  };
}

function mapTerminalSyncState(
  state: 'idle' | 'loading' | 'error',
  registryFresh: boolean,
): AddressTerminalSyncState {
  if (state === 'loading') return 'pending';
  if (state === 'error') return 'error';
  return registryFresh ? 'fresh' : 'offline';
}

function mergeReceipts(
  current: PosAcceptanceReceipt[],
  incoming: PosAcceptanceReceipt[],
) {
  const byId = new Map<string, PosAcceptanceReceipt>();
  for (const receipt of [...incoming, ...current]) {
    byId.set(receipt.receiptId, receipt);
  }
  return Array.from(byId.values())
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 20);
}

export const PosTerminalPanel: React.FC<PosTerminalPanelProps> = ({
  appLanguage,
  appLanguageLabel,
  onAppLanguageChange,
  showAlert,
}) => {
  const [activeWorkspace, setActiveWorkspace] = React.useState<PosWorkspaceId>('scan');
  const [mode, setMode] = React.useState<PosAcceptanceChannel>('qr');
  const [payloadText, setPayloadText] = React.useState('');
  const [shippingScanRole, setShippingScanRole] = React.useState<ShippingLabelScanRole>('carrier');
  const [shippingRiskLevel, setShippingRiskLevel] = React.useState<ShippingLabelRiskLevel>('standard');
  const [shippingRecipientProofMethod, setShippingRecipientProofMethod] = React.useState<ShippingLabelRecipientProofMethod>('recipient-secret-commitment');
  const [shippingRecipientProofCode, setShippingRecipientProofCode] = React.useState('');
  const [shippingRecipientChallenge, setShippingRecipientChallenge] = React.useState('');
  const [shippingRecipientChallengeSignature, setShippingRecipientChallengeSignature] = React.useState('');
  const [terminalId, setTerminalId] = React.useState(() => localStorage.getItem('agid_pos_terminal_id') || 'AGID-POS-001');
  const [storePosId, setStorePosId] = React.useState(() => localStorage.getItem('agid_pos_store_pos_id') || localStorage.getItem('agid_pos_terminal_id') || 'AGID-POS-001');
  const [carrierTerminalId, setCarrierTerminalId] = React.useState(() => localStorage.getItem('agid_pos_carrier_terminal_id') || '');
  const [carrierTerminalSignature, setCarrierTerminalSignature] = React.useState('');
  const [carrierTerminalSignedAt, setCarrierTerminalSignedAt] = React.useState('');
  const [carrierLocationLat, setCarrierLocationLat] = React.useState('');
  const [carrierLocationLon, setCarrierLocationLon] = React.useState('');
  const [carrierLocationAccuracyMeters, setCarrierLocationAccuracyMeters] = React.useState('');
  const [carrierLocationLabel, setCarrierLocationLabel] = React.useState('');
  const [operatorId, setOperatorId] = React.useState(() => localStorage.getItem('agid_pos_operator_id') || '');
  const [staffRole, setStaffRole] = React.useState<PosStaffRole>(readStoredStaffRole);
  const [purpose, setPurpose] = React.useState(() => localStorage.getItem('agid_pos_purpose') || 'retail-pickup');
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState(() => localStorage.getItem('agid_pos_currency') || 'JPY');
  const [ethereumPaymentEnabled, setEthereumPaymentEnabled] = React.useState(() => readStoredBoolean('agid_pos_ethereum_payment_enabled'));
  const [paymentKind, setPaymentKind] = React.useState<PosEthereumPaymentKind>(readStoredPaymentKind);
  const [settlementMode, setSettlementMode] = React.useState<PosEthereumSettlementMode>(readStoredSettlementMode);
  const [paymentStatus, setPaymentStatus] = React.useState<PosEthereumPaymentStatus>(readStoredPaymentStatus);
  const [tokenSymbol, setTokenSymbol] = React.useState(() => localStorage.getItem('agid_pos_token_symbol') || 'USDC');
  const [paymentNetworkId, setPaymentNetworkId] = React.useState(() => localStorage.getItem('agid_pos_payment_network_id') || 'base-sepolia');
  const [observedPaymentTxHash, setObservedPaymentTxHash] = React.useState('');
  const [releaseAfterHandoff, setReleaseAfterHandoff] = React.useState(true);
  const [highRiskPaymentMode, setHighRiskPaymentMode] = React.useState(false);
  const [carrierRejectAddressDefect, setCarrierRejectAddressDefect] = React.useState(() => readStoredBoolean('agid_pos_carrier_reject_address_defect', true));
  const [carrierRejectUndeliverableRegion, setCarrierRejectUndeliverableRegion] = React.useState(() => readStoredBoolean('agid_pos_carrier_reject_undeliverable_region', true));
  const [carrierRejectPoBox, setCarrierRejectPoBox] = React.useState(() => readStoredBoolean('agid_pos_carrier_reject_po_box'));
  const [carrierRejectAutoLock, setCarrierRejectAutoLock] = React.useState(() => readStoredBoolean('agid_pos_carrier_reject_auto_lock'));
  const [carrierRequireAoidAccessProfile, setCarrierRequireAoidAccessProfile] = React.useState(() => readStoredBoolean('agid_pos_carrier_require_aoid_access_profile', true));
  const [carrierAddressDefect, setCarrierAddressDefect] = React.useState(false);
  const [carrierUndeliverableRegion, setCarrierUndeliverableRegion] = React.useState(false);
  const [carrierPoBox, setCarrierPoBox] = React.useState(false);
  const [carrierAutoLock, setCarrierAutoLock] = React.useState(false);
  const [carrierAoidAccessProfileConfirmed, setCarrierAoidAccessProfileConfirmed] = React.useState(false);
  const [latestReceipt, setLatestReceipt] = React.useState<PosAcceptanceReceipt | null>(null);
  const [secureKeys, setSecureKeys] = React.useState<PosSecureKeyEntry[]>(readStoredSecureKeys);
  const [secureRegistry, setSecureRegistry] = React.useState<PosAgidSecureRegistryStatus | null>(null);
  const [secureOpenPreview, setSecureOpenPreview] = React.useState<SecureOpenPreview>({
    status: 'idle',
    message: 'AGID-S ready',
  });
  const [isSecureDecrypting, setIsSecureDecrypting] = React.useState(false);
  const [receiptHistory, setReceiptHistory] = React.useState<PosAcceptanceReceipt[]>(() => {
    try {
      const saved = localStorage.getItem('agid_pos_receipts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [capabilities, setCapabilities] = React.useState<PosCapabilities | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [recentSyncState, setRecentSyncState] = React.useState<'idle' | 'loading' | 'error'>('idle');
  const [qrRunning, setQrRunning] = React.useState(false);
  const [nfcState, setNfcState] = React.useState<'idle' | 'waiting' | 'unsupported' | 'error'>('idle');
  const [scannerMessage, setScannerMessage] = React.useState('Ready');
  const [diagnosticRunAt, setDiagnosticRunAt] = React.useState(() => new Date().toISOString());
  const [networkRunAt, setNetworkRunAt] = React.useState(() => new Date().toISOString());
  const [reverificationRunAt, setReverificationRunAt] = React.useState(() => new Date().toISOString());
  const [measurementDeviceId, setMeasurementDeviceId] = React.useState(() => localStorage.getItem('agid_pos_measurement_device_id') || 'scale-01');
  const [measurementKind, setMeasurementKind] = React.useState<PosMeasurementInstrumentKind>('weight-scale');
  const [measurementValue, setMeasurementValue] = React.useState('');
  const [measurementUnit, setMeasurementUnit] = React.useState('kg');
  const [measurementSampleId, setMeasurementSampleId] = React.useState('');
  const [measurementSource, setMeasurementSource] = React.useState<PosMeasurementReading['source']>('manual');
  const [measurementReadings, setMeasurementReadings] = React.useState<PosMeasurementReading[]>(readStoredMeasurementReadings);
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);
  const qrReaderId = React.useMemo(() => `pos-qr-reader-${Math.random().toString(36).slice(2, 10)}`, []);
  const nfcSupported = Boolean(readBrowserNfcConstructor());
  const panelT = React.useCallback((key: PosPanelCopyKey) => posPanelCopy(appLanguage, key), [appLanguage]);
  const showLocalizedAlert = React.useCallback((enTitle: string, enMessage: string, jaTitle: string, jaMessage: string) => {
    showAlert(
      posPanelInlineCopy(appLanguage, enTitle, jaTitle),
      posPanelInlineCopy(appLanguage, enMessage, jaMessage),
    );
  }, [appLanguage, showAlert]);

  React.useEffect(() => {
    let cancelled = false;
    void fetch(apiEndpoints.posCapabilities())
      .then(async (response) => response.json() as Promise<AgidResult<PosCapabilities>>)
      .then((result) => {
        if (!cancelled && result.ok && result.data) setCapabilities(result.data);
      })
      .catch(() => {
        if (!cancelled) setCapabilities(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshAgidSecureRegistry = React.useCallback(async () => {
    try {
      const response = await fetch(apiEndpoints.posAgidSecureRegistry());
      const result = await response.json() as AgidResult<PosAgidSecureRegistryStatus>;
      if (result.ok && result.data) setSecureRegistry(result.data);
    } catch {
      setSecureRegistry(null);
    }
  }, []);

  const syncRecentReceipts = React.useCallback(async () => {
    setRecentSyncState('loading');
    try {
      const response = await fetch(apiEndpoints.posAcceptanceRecent());
      const result = await response.json() as AgidResult<PosRecentReceipts>;
      const receipts = result.ok && result.data?.receipts ? result.data.receipts : [];
      setReceiptHistory((current) => {
        const next = mergeReceipts(current, receipts);
        localStorage.setItem('agid_pos_receipts', JSON.stringify(next));
        return next;
      });
      setLatestReceipt((current) => current ?? receipts[0] ?? null);
      setRecentSyncState('idle');
    } catch {
      setRecentSyncState('error');
    }
  }, []);

  React.useEffect(() => {
    void syncRecentReceipts();
  }, [syncRecentReceipts]);

  React.useEffect(() => {
    void refreshAgidSecureRegistry();
  }, [refreshAgidSecureRegistry]);

  const currentAddressRisk = React.useMemo<Partial<CarrierLabelAddressRisk>>(() => {
    const reasonCodes: CarrierLabelRejectionReason[] = [];
    if (carrierAddressDefect) reasonCodes.push('address-defect');
    if (carrierUndeliverableRegion) reasonCodes.push('undeliverable-region');
    if (carrierPoBox) reasonCodes.push('po-box');
    if (carrierAutoLock) reasonCodes.push('auto-lock');
    return {
      addressDefect: carrierAddressDefect,
      undeliverableRegion: carrierUndeliverableRegion,
      poBox: carrierPoBox,
      autoLock: carrierAutoLock,
      aoidAccessProfileConfirmed: carrierAoidAccessProfileConfirmed,
      reasonCodes,
    };
  }, [
    carrierAddressDefect,
    carrierAoidAccessProfileConfirmed,
    carrierAutoLock,
    carrierPoBox,
    carrierUndeliverableRegion,
  ]);

  const preview = React.useMemo(() => {
    if (!cleanText(payloadText)) return null;
    return previewPosAcceptanceInput({
      payload: payloadText,
      channel: mode,
      scanRole: shippingScanRole,
      recipientProofCode: shippingRecipientProofCode,
      recipientProofSecret: shippingRecipientProofCode,
      recipientProofMethod: shippingRecipientProofMethod,
      recipientChallenge: shippingRecipientChallenge,
      recipientChallengeSignature: shippingRecipientChallengeSignature,
      carrierTerminalId,
      carrierTerminalSignature,
      carrierTerminalSignedAt,
      storePosId,
      carrierLocationLat: carrierLocationLat ? Number(carrierLocationLat) : undefined,
      carrierLocationLon: carrierLocationLon ? Number(carrierLocationLon) : undefined,
      carrierLocationAccuracyMeters: carrierLocationAccuracyMeters ? Number(carrierLocationAccuracyMeters) : undefined,
      carrierLocationLabel: carrierLocationLabel || undefined,
      carrierPolicy: {
        rejectAddressDefect: carrierRejectAddressDefect,
        rejectUndeliverableRegion: carrierRejectUndeliverableRegion,
        rejectPoBox: carrierRejectPoBox,
        rejectAutoLock: carrierRejectAutoLock,
        requireAoidAccessProfileForPoBoxOrAutoLock: carrierRequireAoidAccessProfile,
        policyRef: `${terminalId}:label-intake`,
      },
      addressRisk: currentAddressRisk,
      ...(ethereumPaymentEnabled ? {
        paymentKind,
        settlementMode,
        paymentStatus,
        tokenSymbol,
        paymentNetworkId,
        observedPaymentTxHash: observedPaymentTxHash || undefined,
        releaseAfterHandoff,
        highRiskPaymentMode,
      } : {}),
      amount: amount ? Number(amount) : undefined,
      currency,
    });
  }, [amount, carrierLocationAccuracyMeters, carrierLocationLabel, carrierLocationLat, carrierLocationLon, carrierRejectAddressDefect, carrierRejectAutoLock, carrierRejectPoBox, carrierRejectUndeliverableRegion, carrierRequireAoidAccessProfile, carrierTerminalId, carrierTerminalSignature, carrierTerminalSignedAt, currency, currentAddressRisk, ethereumPaymentEnabled, highRiskPaymentMode, mode, observedPaymentTxHash, payloadText, paymentKind, paymentNetworkId, paymentStatus, releaseAfterHandoff, settlementMode, shippingRecipientChallenge, shippingRecipientChallengeSignature, shippingRecipientProofCode, shippingRecipientProofMethod, shippingScanRole, storePosId, terminalId, tokenSymbol]);

  const destinationQrSummary = React.useMemo(
    () => buildPosDestinationQrSummary(payloadText),
    [payloadText],
  );

  React.useEffect(() => {
    localStorage.setItem('agid_pos_terminal_id', terminalId);
  }, [terminalId]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_store_pos_id', storePosId);
  }, [storePosId]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_carrier_terminal_id', carrierTerminalId);
  }, [carrierTerminalId]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_operator_id', operatorId);
  }, [operatorId]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_staff_role', staffRole);
  }, [staffRole]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_purpose', purpose);
  }, [purpose]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_currency', currency);
  }, [currency]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_ethereum_payment_enabled', String(ethereumPaymentEnabled));
  }, [ethereumPaymentEnabled]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_payment_kind', paymentKind);
  }, [paymentKind]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_settlement_mode', settlementMode);
  }, [settlementMode]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_payment_status', paymentStatus);
  }, [paymentStatus]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_token_symbol', tokenSymbol);
  }, [tokenSymbol]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_payment_network_id', paymentNetworkId);
  }, [paymentNetworkId]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_carrier_reject_address_defect', String(carrierRejectAddressDefect));
  }, [carrierRejectAddressDefect]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_carrier_reject_undeliverable_region', String(carrierRejectUndeliverableRegion));
  }, [carrierRejectUndeliverableRegion]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_carrier_reject_po_box', String(carrierRejectPoBox));
  }, [carrierRejectPoBox]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_carrier_reject_auto_lock', String(carrierRejectAutoLock));
  }, [carrierRejectAutoLock]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_carrier_require_aoid_access_profile', String(carrierRequireAoidAccessProfile));
  }, [carrierRequireAoidAccessProfile]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_agid_s_keys', JSON.stringify(secureKeys));
  }, [secureKeys]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_measurement_device_id', measurementDeviceId);
  }, [measurementDeviceId]);

  React.useEffect(() => {
    localStorage.setItem('agid_pos_measurement_readings', JSON.stringify(measurementReadings.slice(0, 20)));
  }, [measurementReadings]);

  React.useEffect(() => {
    if (!measurementSampleId && latestReceipt?.receiptId) {
      setMeasurementSampleId(latestReceipt.shippingLabel?.waybillId ?? latestReceipt.receiptId);
    }
  }, [latestReceipt, measurementSampleId]);

  const stopQrCamera = React.useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setQrRunning(false);
    if (!scanner) return;
    try {
      await scanner.clear();
    } catch {
      // html5-qrcode can throw if the camera was already stopped by the browser.
    }
  }, []);

  React.useEffect(() => {
    if (mode !== 'qr') void stopQrCamera();
  }, [mode, stopQrCamera]);

  React.useEffect(() => () => {
    void stopQrCamera();
  }, [stopQrCamera]);

  const rememberReceipt = React.useCallback((receipt: PosAcceptanceReceipt) => {
    setLatestReceipt(receipt);
    setReceiptHistory((current) => {
      const next = [receipt, ...current.filter((item) => item.receiptId !== receipt.receiptId)].slice(0, 20);
      localStorage.setItem('agid_pos_receipts', JSON.stringify(next));
      return next;
    });
  }, []);

  const submitPayload = React.useCallback(async (payload: string, channel: PosAcceptanceChannel) => {
    const cleaned = cleanText(payload);
    if (!cleaned) {
      showLocalizedAlert('POS payload missing', 'QR, NFC, or manual payload is required.', 'POSペイロード未入力', 'QR、NFC、または手入力ペイロードが必要です。');
      return false;
    }

    let accepted = false;
    setIsSubmitting(true);
    setScannerMessage('Verifying');
    try {
      const response = await fetch(apiEndpoints.posAcceptance(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: cleaned,
          channel,
          scanRole: shippingScanRole,
          recipientProofCode: shippingRecipientProofCode || undefined,
          recipientProofSecret: shippingRecipientProofCode || undefined,
          recipientProofMethod: shippingRecipientProofMethod,
          recipientChallenge: shippingRecipientChallenge || undefined,
          recipientChallengeSignature: shippingRecipientChallengeSignature || undefined,
          terminalId,
          storePosId,
          carrierTerminalId: carrierTerminalId || undefined,
          carrierTerminalSignature: carrierTerminalSignature || undefined,
          carrierTerminalSignedAt: carrierTerminalSignedAt || undefined,
          carrierLocationLat: carrierLocationLat ? Number(carrierLocationLat) : undefined,
          carrierLocationLon: carrierLocationLon ? Number(carrierLocationLon) : undefined,
          carrierLocationAccuracyMeters: carrierLocationAccuracyMeters ? Number(carrierLocationAccuracyMeters) : undefined,
          carrierLocationLabel: carrierLocationLabel || undefined,
          carrierPolicy: {
            rejectAddressDefect: carrierRejectAddressDefect,
            rejectUndeliverableRegion: carrierRejectUndeliverableRegion,
            rejectPoBox: carrierRejectPoBox,
            rejectAutoLock: carrierRejectAutoLock,
            requireAoidAccessProfileForPoBoxOrAutoLock: carrierRequireAoidAccessProfile,
            policyRef: `${terminalId}:label-intake`,
          },
          addressRisk: currentAddressRisk,
          operatorId,
          purpose,
          amount: amount ? Number(amount) : undefined,
          currency,
          ...(ethereumPaymentEnabled ? {
            paymentKind,
            settlementMode,
            paymentStatus,
            tokenSymbol,
            paymentNetworkId,
            observedPaymentTxHash: observedPaymentTxHash || undefined,
            releaseAfterHandoff,
            highRiskPaymentMode,
          } : {}),
        }),
      });
      const result = await response.json() as AgidResult<PosAcceptanceReceipt>;
      if (result.data) {
        rememberReceipt(result.data);
      }
      if (!response.ok || !result.ok) {
        setScannerMessage(result.error || 'Rejected');
      } else {
        accepted = true;
        setScannerMessage(result.data?.status === 'review' ? 'Accepted with review' : 'Accepted');
        if (result.data?.shippingLabel?.packageReceiptVerified) {
          setActiveWorkspace('report');
        } else if (activeWorkspace !== 'handoff') {
          setActiveWorkspace('decision');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'POS API request failed';
      setScannerMessage(message);
      showAlert(posPanelInlineCopy(appLanguage, 'POS API error', 'POS APIエラー'), message);
    } finally {
      setIsSubmitting(false);
    }
    return accepted;
  }, [
    amount,
    activeWorkspace,
    carrierLocationAccuracyMeters,
    carrierLocationLabel,
    carrierLocationLat,
    carrierLocationLon,
    carrierRejectAddressDefect,
    carrierRejectAutoLock,
    carrierRejectPoBox,
    carrierRejectUndeliverableRegion,
    carrierRequireAoidAccessProfile,
    carrierTerminalId,
    carrierTerminalSignature,
    carrierTerminalSignedAt,
    currency,
    currentAddressRisk,
    ethereumPaymentEnabled,
    highRiskPaymentMode,
    observedPaymentTxHash,
    operatorId,
    paymentKind,
    paymentNetworkId,
    paymentStatus,
    purpose,
    rememberReceipt,
    shippingRecipientChallenge,
    shippingRecipientChallengeSignature,
    shippingRecipientProofCode,
    shippingRecipientProofMethod,
    shippingScanRole,
    releaseAfterHandoff,
    settlementMode,
    appLanguage,
    showAlert,
    showLocalizedAlert,
    storePosId,
    terminalId,
    tokenSymbol,
  ]);

  const buildWaybillQr = React.useCallback(() => {
    const sourcePayload = cleanText(payloadText);
    const recipientProofCode = cleanText(shippingRecipientProofCode);
    if (!sourcePayload) {
      showLocalizedAlert('Shipping label source missing', 'Paste a registered address QR payload or direct public AGID before building a waybill QR.', '送り状ソース未入力', '送り状QRを作る前に、登録済み住所QRペイロードまたは公開AGIDを貼り付けてください。');
      return;
    }
    if (!recipientProofCode) {
      showLocalizedAlert('Recipient proof missing', 'Enter the recipient proof secret, Passkey/WebAuthn evidence, AOID credential material, or NFC card handle. The QR will store only its commitment.', '受取人証明未入力', '受取人証明秘密、Passkey/WebAuthn証跡、AOID credential材料、またはNFCカードハンドルを入力してください。QRにはcommitmentのみ保存します。');
      return;
    }

    try {
      const now = new Date();
      const ttlSeconds = shippingRiskLevel === 'high'
        ? SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS
        : SHIPPING_LABEL_STANDARD_TTL_SECONDS;
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
      const payload = buildShippingLabelQrPayload({
        addressPayload: sourcePayload,
        carrierId: terminalId,
        serviceLevel: purpose || 'delivery-handoff',
        issuedAt: now.toISOString(),
        expiresAt,
        riskLevel: shippingRiskLevel,
        ...(shippingRiskLevel === 'high'
          ? { highRiskUseCases: deriveHighRiskUseCases(purpose || 'field-protection') }
          : {}),
        recipientProofSecret: recipientProofCode,
        recipientProofMethod: shippingRecipientProofMethod,
        recipientProofHint: shippingRecipientProofHint(shippingRecipientProofMethod),
      });
      setPayloadText(payload);
      setMode('qr');
      setShippingScanRole('carrier');
      setShippingRecipientChallenge('');
      setShippingRecipientChallengeSignature('');
      setScannerMessage('Shipping label QR prepared');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Shipping label QR could not be built';
      showAlert(posPanelInlineCopy(appLanguage, 'Shipping label QR error', '送り状QRエラー'), message);
    }
  }, [appLanguage, payloadText, purpose, shippingRecipientProofCode, shippingRecipientProofMethod, shippingRiskLevel, showAlert, showLocalizedAlert, terminalId]);

  const issueRecipientChallenge = React.useCallback(() => {
    const challenge = createShippingLabelRecipientChallenge({
      terminalId,
      now: new Date().toISOString(),
    });
    setShippingRecipientChallenge(challenge);

    const record = parseShippingLabelQrPayload(payloadText);
    const recipientProofCode = cleanText(shippingRecipientProofCode);
    if (record && recipientProofCode) {
      setShippingRecipientChallengeSignature(createShippingLabelRecipientChallengeSignature({
        waybillId: record.waybillId,
        jti: record.jti,
        recipientSecret: recipientProofCode,
        recipientProofMethod: record.recipientProof.method,
        recipientProofDomain: record.recipientProof.domain,
        recipientProofNonce: record.recipientProof.nonce,
        challenge,
      }));
      setScannerMessage('Recipient challenge issued and locally signed');
      return;
    }

    setShippingRecipientChallengeSignature('');
    setScannerMessage('Recipient challenge issued');
  }, [payloadText, shippingRecipientProofCode, terminalId]);

  const generateSecureKey = React.useCallback(() => {
    setSecureKeys((current) => {
      const index = current.length + 1;
      const plan = buildPosRecipientKeyPlan({
        recipients: [{
          recipientId: `recipient-${index}`,
          label: `Recipient ${index}`,
        }],
      });
      setSecureOpenPreview({
        status: 'idle',
        message: `Generated ${plan.keys[0]?.keyId ?? 'recipient key'}`,
      });
      return [...plan.keys, ...current].slice(0, 30);
    });
  }, []);

  const rotateSecureKey = React.useCallback((keyId: string) => {
    setSecureKeys((current) => {
      const target = current.find((key) => key.keyId === keyId);
      if (!target) return current;
      const rotation = rotatePosSecureKeyEntry(target);
      setSecureOpenPreview({
        status: 'idle',
        message: `Rotated ${keyId}`,
      });
      return [
        rotation.next,
        ...current.map((key) => key.keyId === keyId ? rotation.previous : key),
      ].slice(0, 30);
    });
  }, []);

  const decryptAgidSecurePayload = React.useCallback(async () => {
    const cleaned = cleanText(payloadText);
    if (!cleaned) {
      showLocalizedAlert('AGID-S payload missing', 'Paste or scan an AGID-S QR/NFC payload first.', 'AGID-S未入力', '先にAGID-S QR/NFCペイロードを貼り付けるかスキャンしてください。');
      return;
    }
    if (secureKeys.length === 0) {
      showLocalizedAlert('AGID-S key missing', 'Generate or import a recipient key before opening AGID-S.', 'AGID-S鍵なし', 'AGID-Sを開く前に受取人鍵を生成またはインポートしてください。');
      return;
    }

    setIsSecureDecrypting(true);
    setScannerMessage('Opening AGID-S');
    try {
      const opened = await openAgidSecureForPos({
        token: cleaned,
        keyRing: secureKeys,
        channel: mode,
      });
      if (opened.ok === false) {
        setSecureOpenPreview({
          status: 'error',
          message: opened.error,
          keyId: opened.envelope?.kid,
          errors: opened.registryDecision?.errors,
          warnings: opened.warnings,
        });
        setScannerMessage(opened.error);
        return;
      }

      const verifyResponse = await fetch(apiEndpoints.posAgidSecureRegistryVerify(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: opened.envelope.kid,
          jti: opened.payload.jti,
          exp: opened.payload.exp,
          terminalId,
        }),
      });
      const verifyResult = await verifyResponse.json() as AgidResult<PosAgidSecureRegistryVerify>;
      if (verifyResult.data?.registry) setSecureRegistry(verifyResult.data.registry);
      const decision = verifyResult.data?.decision;
      if (!verifyResponse.ok || !verifyResult.ok || !decision?.valid) {
        setSecureOpenPreview({
          status: 'error',
          message: verifyResult.error || decision?.errors[0] || 'registry-rejected',
          keyId: opened.envelope.kid,
          agidTail: opened.payload.agid.slice(-6),
          errors: decision?.errors,
          warnings: decision?.warnings,
        });
        setScannerMessage(verifyResult.error || 'Registry rejected');
        return;
      }

      setPayloadText(opened.payload.agid);
      setSecureOpenPreview({
        status: 'ok',
        message: 'AGID-S decrypted and registry verified',
        keyId: opened.envelope.kid,
        agidTail: opened.payload.agid.slice(-6),
        warnings: opened.warnings,
      });
      const accepted = await submitPayload(opened.payload.agid, mode);
      if (accepted) {
        const markResponse = await fetch(apiEndpoints.posAgidSecureMarkUsed(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyId: opened.envelope.kid,
            jti: opened.payload.jti,
            terminalId,
          }),
        });
        const markResult = await markResponse.json() as AgidResult<{ registry?: PosAgidSecureRegistryStatus }>;
        if (markResult.data?.registry) setSecureRegistry(markResult.data.registry);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AGID-S decrypt flow failed';
      setSecureOpenPreview({
        status: 'error',
        message,
      });
      setScannerMessage(message);
      showAlert(posPanelInlineCopy(appLanguage, 'AGID-S error', 'AGID-Sエラー'), message);
    } finally {
      setIsSecureDecrypting(false);
    }
  }, [appLanguage, mode, payloadText, secureKeys, showAlert, showLocalizedAlert, submitPayload, terminalId]);

  const startQrCamera = React.useCallback(async () => {
    await stopQrCamera();
    setMode('qr');
    setScannerMessage('Loading camera');
    let Html5QrcodeScanner: typeof import('html5-qrcode').Html5QrcodeScanner;
    try {
      ({ Html5QrcodeScanner } = await import('html5-qrcode'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load QR scanner';
      setQrRunning(false);
      setScannerMessage('QR scanner unavailable');
      showAlert(posPanelInlineCopy(appLanguage, 'QR scanner unavailable', 'QRスキャナーを利用できません'), message);
      return;
    }
    const scanner = new Html5QrcodeScanner(
      qrReaderId,
      {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        rememberLastUsedCamera: true,
      },
      false,
    );
    scannerRef.current = scanner;
    setQrRunning(true);
    setScannerMessage('Camera active');
    scanner.render(
      async (decodedText) => {
        setPayloadText(decodedText);
        await stopQrCamera();
        await submitPayload(decodedText, 'qr');
      },
      () => undefined,
    );
  }, [appLanguage, qrReaderId, showAlert, stopQrCamera, submitPayload]);

  const startNfcScan = React.useCallback(async () => {
    setMode('nfc');
    const Reader = readBrowserNfcConstructor();
    if (!Reader) {
      setNfcState('unsupported');
      setScannerMessage('Web NFC unavailable');
      return;
    }
    try {
      const reader = new Reader();
      reader.onreading = (event) => {
        const records = event.message.records.map(decodeNdefRecord).filter(Boolean);
        const payload = records.find((record) => record.includes('agid:nfc:') || record.includes('agid:address:') || record.includes('agid:waybill:') || record.includes('AGIDS1-')) || records[0] || '';
        setPayloadText(payload);
        void submitPayload(payload, 'nfc');
      };
      reader.onreadingerror = () => {
        setNfcState('error');
        setScannerMessage('NFC read error');
      };
      await reader.scan();
      setNfcState('waiting');
      setScannerMessage('Waiting for NFC tag');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'NFC permission failed';
      setNfcState('error');
      setScannerMessage(message);
    }
  }, [submitPayload]);

  const wrapManualPayloadForNfc = React.useCallback(() => {
    if (!cleanText(payloadText)) {
      showLocalizedAlert('NFC payload missing', 'Paste or scan an AGID address, waybill, AGID-S, or public AGID payload first.', 'NFCペイロード未入力', '先にAGID住所、送り状、AGID-S、または公開AGIDペイロードを貼り付けるかスキャンしてください。');
      return;
    }
    const wrapped = buildPosNfcPayload(payloadText, { terminalId });
    setPayloadText(wrapped);
    setMode('nfc');
    setScannerMessage('NFC wrapper prepared');
  }, [payloadText, showLocalizedAlert, terminalId]);

  const changeMeasurementKind = React.useCallback((nextKind: PosMeasurementInstrumentKind) => {
    setMeasurementKind(nextKind);
    setMeasurementUnit(defaultMeasurementUnit(nextKind));
    setMeasurementValue('');
    setMeasurementSource('manual');
  }, []);

  const readDemoMeasurement = React.useCallback(() => {
    const reading = buildDemoMeasurement(measurementKind);
    setMeasurementValue(reading.value);
    setMeasurementUnit(reading.unit);
    setMeasurementSource('demo');
    if (!cleanText(measurementSampleId)) {
      setMeasurementSampleId(latestReceipt?.shippingLabel?.waybillId ?? latestReceipt?.receiptId ?? '');
    }
    setScannerMessage('Measurement captured from demo adapter');
  }, [latestReceipt, measurementKind, measurementSampleId]);

  const saveMeasurementReading = React.useCallback(() => {
    const value = cleanText(measurementValue);
    const unit = cleanText(measurementUnit);
    if (!value || !unit) {
      showLocalizedAlert('Measurement missing', 'Enter or read a measurement value and unit before saving.', '計測値未入力', '保存前に計測値と単位を入力または読み取ってください。');
      return;
    }
    const capturedAt = new Date().toISOString();
    const sampleId = cleanText(measurementSampleId)
      || latestReceipt?.shippingLabel?.waybillId
      || latestReceipt?.receiptId
      || 'unassigned-package';
    const reading: PosMeasurementReading = {
      id: buildMeasurementReadingId(`${measurementKind}|${value}|${unit}|${sampleId}|${capturedAt}`),
      kind: measurementKind,
      value,
      unit,
      sampleId,
      deviceId: cleanText(measurementDeviceId) || 'manual-device',
      source: measurementSource,
      capturedAt,
    };
    setMeasurementReadings((current) => [reading, ...current].slice(0, 20));
    setMeasurementSampleId(sampleId);
    setScannerMessage('Measurement saved to local POS log');
  }, [
    latestReceipt,
    measurementDeviceId,
    measurementKind,
    measurementSampleId,
    measurementSource,
    measurementUnit,
    measurementValue,
    showLocalizedAlert,
  ]);

  const clearMeasurementReadings = React.useCallback(() => {
    setMeasurementReadings([]);
    setScannerMessage('Measurement log cleared');
  }, []);

  const runTerminalDiagnosticCommand = React.useCallback((
    permission: Parameters<typeof hasPosStaffPermission>[1],
    message: string,
    enDetail: string,
    jaMessage: string,
    jaDetail: string,
  ) => {
    if (!hasPosStaffPermission(staffRole, permission)) {
      showLocalizedAlert(
        'Permission required',
        'Current staff role cannot run this terminal command.',
        '権限が必要です',
        '現在のスタッフ権限ではこの端末コマンドを実行できません。',
      );
      return;
    }
    setDiagnosticRunAt(new Date().toISOString());
    setScannerMessage(message);
    showLocalizedAlert(message, enDetail, jaMessage, jaDetail);
  }, [showLocalizedAlert, staffRole]);

  const runPrinterSelfTest = React.useCallback(() => {
    runTerminalDiagnosticCommand(
      'print-redacted-receipt',
      'Printer diagnostics ready',
      'A redacted printer diagnostic slip is ready. Use the browser print dialog or a native connector for physical printers.',
      'プリンタ診断準備完了',
      '秘匿化されたプリンタ診断票を準備しました。物理プリンタはブラウザ印刷またはネイティブコネクタで確認してください。',
    );
  }, [runTerminalDiagnosticCommand]);

  const runCashDrawerTest = React.useCallback(() => {
    runTerminalDiagnosticCommand(
      'open-cash-drawer',
      'Cash drawer test logged',
      'Cash drawer readiness was logged without forcing a relay action from the browser.',
      'キャッシュドロワー確認を記録しました',
      'ブラウザからリレーを強制操作せず、キャッシュドロワーの準備確認を記録しました。',
    );
  }, [runTerminalDiagnosticCommand]);

  const runBarcodeReaderPairingTest = React.useCallback(() => {
    runTerminalDiagnosticCommand(
      'pair-barcode-reader',
      'Barcode reader pairing checked',
      'Barcode reader readiness was checked through keyboard wedge, HID, USB, and scanner fallback signals.',
      'バーコードリーダー連携を確認しました',
      'キーボード入力、HID、USB、スキャナー代替信号からバーコードリーダー準備状態を確認しました。',
    );
  }, [runTerminalDiagnosticCommand]);

  const runMeasurementPairingTest = React.useCallback(() => {
    runTerminalDiagnosticCommand(
      'pair-measuring-instrument',
      'Measuring instrument pairing checked',
      'Electronic measuring instrument readiness was checked through serial, HID, USB, and calibration-profile signals.',
      '電子計測器連携を確認しました',
      'Serial、HID、USB、校正プロファイル信号から電子計測器の準備状態を確認しました。',
    );
  }, [runTerminalDiagnosticCommand]);

  const modes: PosModeOption[] = [
    {
      id: 'qr',
      label: 'QR',
      detail: qrRunning ? posPanelInlineCopy(appLanguage, 'Camera active', 'カメラ起動中') : posPanelInlineCopy(appLanguage, 'Camera or paste', 'カメラ/貼り付け'),
      icon: <QrCode className="h-5 w-5" />,
    },
    {
      id: 'nfc',
      label: 'NFC',
      detail: nfcSupported ? posScannerMessage(appLanguage, nfcState) : posPanelInlineCopy(appLanguage, 'Fallback', '代替'),
      icon: <RadioReceiver className="h-5 w-5" />,
    },
    {
      id: 'manual',
      label: posPanelInlineCopy(appLanguage, 'Manual', '手入力'),
      detail: posPanelInlineCopy(appLanguage, 'Payload input', 'ペイロード入力'),
      icon: <Keyboard className="h-5 w-5" />,
    },
  ];

  const deviceDiagnostics = React.useMemo(() => buildPosDeviceDiagnostics(
    readHardwareCapabilities(diagnosticRunAt),
  ), [diagnosticRunAt]);
  const auditCases = React.useMemo(
    () => buildPosExceptionAuditCases(receiptHistory),
    [receiptHistory],
  );
  const registryFresh = secureRegistry?.freshUntil
    ? Date.parse(secureRegistry.freshUntil) > Date.now()
    : false;
  const reverificationReport = React.useMemo(() => buildPosHandoffReverificationReport({
    receipt: latestReceipt,
    receipts: receiptHistory,
    staffRole,
    registryFresh,
    diagnostics: deviceDiagnostics,
    generatedAt: reverificationRunAt,
  }), [deviceDiagnostics, latestReceipt, receiptHistory, registryFresh, reverificationRunAt, staffRole]);
  const activeSecureKeyCount = React.useMemo(
    () => secureKeys.filter((key) => key.status === 'active').length,
    [secureKeys],
  );
  const terminalFleetSnapshot = React.useMemo(() => buildAddressTerminalFleetSnapshot({
    generatedAt: diagnosticRunAt,
    terminals: [
      {
        terminalId,
        label: storePosId === terminalId ? 'Primary AGID POS terminal' : storePosId,
        siteId: purpose || 'local-site',
        staffRole,
        registryFresh,
        syncState: mapTerminalSyncState(recentSyncState, registryFresh),
        pendingOfflineItems: recentSyncState === 'idle' ? 0 : receiptHistory.length,
        scanHistoryCount: receiptHistory.length,
        activeSecureKeys: activeSecureKeyCount,
        totalSecureKeys: secureKeys.length,
        lastSeenAt: diagnosticRunAt,
        hardware: readHardwareCapabilities(diagnosticRunAt),
      },
    ],
  }), [
    activeSecureKeyCount,
    diagnosticRunAt,
    purpose,
    receiptHistory.length,
    recentSyncState,
    registryFresh,
    secureKeys.length,
    staffRole,
    storePosId,
    terminalId,
  ]);
  const managementSnapshot = React.useMemo(() => buildPosManagementSnapshot({
    terminalId,
    operatorId,
    staffRole,
    receipts: receiptHistory,
    latestReceipt,
    registryFresh,
    diagnostics: deviceDiagnostics,
    activeSecureKeys: activeSecureKeyCount,
    totalSecureKeys: secureKeys.length,
    syncState: recentSyncState,
  }), [
    activeSecureKeyCount,
    deviceDiagnostics,
    latestReceipt,
    operatorId,
    receiptHistory,
    recentSyncState,
    registryFresh,
    secureKeys.length,
    staffRole,
    terminalId,
  ]);
  const designReview = React.useMemo(() => buildPosDesignReview({
    terminalId,
    operatorId,
    latestReceipt,
    preview,
    management: managementSnapshot,
    handoffReport: reverificationReport,
    registryFresh,
    diagnostics: deviceDiagnostics,
    activeSecureKeys: activeSecureKeyCount,
    totalSecureKeys: secureKeys.length,
    syncState: recentSyncState,
  }), [
    activeSecureKeyCount,
    deviceDiagnostics,
    latestReceipt,
    managementSnapshot,
    operatorId,
    preview,
    recentSyncState,
    registryFresh,
    reverificationReport,
    secureKeys.length,
    terminalId,
  ]);

  const networkAssurance = React.useMemo(() => {
    const browserLocation = typeof window !== 'undefined' ? window.location : undefined;
    const hostname = browserLocation?.hostname || '';
    const localHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const https = browserLocation?.protocol === 'https:';
    const online = typeof navigator === 'undefined' ? true : navigator.onLine;
    const highRiskNetworkMode = shippingRiskLevel === 'high' || highRiskPaymentMode;
    const registryEndpointCount = secureRegistry ? 1 : 0;
    const staleRegistry = !registryFresh;
    const networkError = recentSyncState === 'error';
    const networkLoading = recentSyncState === 'loading';
    const blockedAuditCases = auditCases.filter((item) => item.severity === 'block').length;

    return buildCiscoInspiredNetworkAssurance({
      mode: secureRegistry ? 'server-registry' : localHost ? 'local-only' : 'server-registry',
      terminalId,
      siteId: purpose || storePosId,
      operatorRole: staffRole,
      highRiskMode: highRiskNetworkMode,
      now: networkRunAt,
      network: {
        online,
        latencyMs: networkError ? 1200 : networkLoading ? 420 : localHost ? 18 : 120,
        packetLossPercent: networkError ? 8 : 0,
        jitterMs: networkError ? 220 : networkLoading ? 95 : 20,
        dnsSecure: localHost || https,
        tlsVersion: localHost ? 'local-dev' : https ? 'TLS1.3-or-browser-managed' : 'none',
        vpnOrSecureTunnel: localHost || https,
        captivePortalDetected: false,
        proxyInspectionDetected: false,
      },
      device: {
        attested: false,
        managed: false,
        osPatchAgeDays: 0,
        keyAgeHours: activeSecureKeyCount > 0 ? 24 : 999,
        jailbreakOrRootDetected: false,
        clockSkewSeconds: 0,
      },
      resolver: {
        endpointCount: registryEndpointCount,
        signedRouteAds: registryFresh || localHost,
        staleRouteAds: staleRegistry && !localHost,
        fallbackAvailable: true,
        anycastHealthy: !networkError,
      },
      identity: {
        staffRoleVerified: Boolean(operatorId),
        mfaPresent: staffRole === 'delivery-supervisor' || staffRole === 'field-admin',
        scopeBound: true,
        apiKeyScoped: true,
      },
      privacy: {
        rawAddressInTelemetry: false,
        rawAgidInTelemetry: false,
        rawAoidInTelemetry: false,
        preciseLocationTelemetry: false,
      },
      incident: {
        recentFailedProofs: auditCases.length,
        suspiciousLookupRate: payloadText.length > 800,
        malwareSignal: false,
        policyViolationCount: blockedAuditCases,
      },
    });
  }, [
    activeSecureKeyCount,
    auditCases,
    highRiskPaymentMode,
    networkRunAt,
    operatorId,
    payloadText.length,
    purpose,
    recentSyncState,
    registryFresh,
    secureRegistry,
    shippingRiskLevel,
    staffRole,
    storePosId,
    terminalId,
  ]);

  const offlinePaymentQueueCount = React.useMemo(() => {
    const queuedReceipts = receiptHistory.filter(receipt => (
      receipt.ethereumPayment && !receipt.ethereumPayment.handoffGate.canReleasePackage
    )).length;
    const activePaymentNeedsQueue = ethereumPaymentEnabled
      && ['requires-payment', 'review', 'rejected', 'cancelled'].includes(paymentStatus);
    return queuedReceipts + Number(activePaymentNeedsQueue);
  }, [ethereumPaymentEnabled, paymentStatus, receiptHistory]);

  const offlineDeliveryQueueCount = React.useMemo(() => {
    const queuedReceipts = receiptHistory.filter(receipt => (
      receipt.status === 'review'
      || receipt.status === 'rejected'
      || receipt.warnings.length > 0
    )).length;
    if (recentSyncState === 'error') {
      return Math.max(queuedReceipts, receiptHistory.length, latestReceipt ? 1 : 0);
    }
    return queuedReceipts;
  }, [latestReceipt, receiptHistory, recentSyncState]);

  const clearReceiptHistory = React.useCallback(() => {
    setReceiptHistory([]);
    localStorage.removeItem('agid_pos_receipts');
  }, []);

  const exportManagementSnapshot = React.useCallback(() => {
    if (typeof document === 'undefined') return;
    const payload = {
      snapshot: managementSnapshot,
      latestReceipt,
      registry: secureRegistry,
      reverificationReport,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${managementSnapshot.snapshotId}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setScannerMessage('Management report exported');
  }, [latestReceipt, managementSnapshot, reverificationReport, secureRegistry]);

  const openPrintableDocument = React.useCallback((printable: PosPrintableDocument) => {
    if (typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank', 'width=760,height=920');
    if (!printWindow) {
      showLocalizedAlert('Print window blocked', 'Allow pop-ups for this POS terminal, then try printing again.', '印刷ウィンドウがブロックされました', 'このPOS端末のポップアップを許可してから、もう一度印刷してください。');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printable.html);
    printWindow.document.close();
    printWindow.focus();
    setScannerMessage(`Print ready: ${printable.kind}`);
    window.setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        showLocalizedAlert('Print unavailable', 'The browser could not open the print dialog for this artifact.', '印刷できません', 'ブラウザがこの出力物の印刷ダイアログを開けませんでした。');
      }
    }, 150);
  }, [showLocalizedAlert]);

  const printRedactedReceipt = React.useCallback(() => {
    if (!latestReceipt) {
      showLocalizedAlert('No receipt to print', 'Scan or accept a QR/NFC/manual payload before printing a redacted receipt.', '印刷するレシートがありません', '秘匿レシートを印刷する前に、QR/NFC/手入力ペイロードをスキャンまたは受付してください。');
      return;
    }
    if (!hasPosStaffPermission(staffRole, 'print-redacted-receipt')) {
      showLocalizedAlert('Print permission required', 'Switch to a role with redacted receipt printing permission.', '印刷権限が必要です', '秘匿レシート印刷権限を持つロールに切り替えてください。');
      return;
    }
    openPrintableDocument(buildRedactedReceiptPrintDocument(latestReceipt));
  }, [latestReceipt, openPrintableDocument, showLocalizedAlert, staffRole]);

  const printShippingSlip = React.useCallback(() => {
    if (!latestReceipt) {
      showLocalizedAlert('No waybill to print', 'Accept a waybill receipt before printing a handoff slip.', '印刷する送り状がありません', '引き渡し控えを印刷する前に送り状レシートを受付してください。');
      return;
    }
    if (!hasPosStaffPermission(staffRole, 'print-redacted-receipt')) {
      showLocalizedAlert('Print permission required', 'Switch to a role with redacted receipt printing permission.', '印刷権限が必要です', '秘匿レシート印刷権限を持つロールに切り替えてください。');
      return;
    }
    openPrintableDocument(buildShippingLabelSlipPrintDocument(latestReceipt));
  }, [latestReceipt, openPrintableDocument, showLocalizedAlert, staffRole]);

  const printDeviceDiagnostics = React.useCallback(() => {
    openPrintableDocument(buildDeviceDiagnosticsPrintDocument(deviceDiagnostics, terminalId, staffRole));
  }, [deviceDiagnostics, openPrintableDocument, staffRole, terminalId]);

  const printExceptionAudit = React.useCallback(() => {
    openPrintableDocument(buildExceptionAuditPrintDocument(auditCases, staffRole));
  }, [auditCases, openPrintableDocument, staffRole]);

  const printHandoffReport = React.useCallback(() => {
    if (!hasPosStaffPermission(staffRole, 'export-reverification-report')) {
      showLocalizedAlert('Report print restricted', 'Switch to supervisor or field admin to print the reverification report.', 'レポート印刷が制限されています', '再照合レポートを印刷するには監督者または現場管理者に切り替えてください。');
      return;
    }
    openPrintableDocument(buildHandoffReverificationPrintDocument(reverificationReport));
  }, [openPrintableDocument, reverificationReport, showLocalizedAlert, staffRole]);

  const printOfflineQueue = React.useCallback(() => {
    openPrintableDocument(buildOfflineQueuePrintDocument(receiptHistory, recentSyncState, terminalId));
  }, [openPrintableDocument, receiptHistory, recentSyncState, terminalId]);

  const printManagementSummary = React.useCallback(() => {
    openPrintableDocument(buildManagementSummaryPrintDocument(managementSnapshot, latestReceipt, reverificationReport));
  }, [latestReceipt, managementSnapshot, openPrintableDocument, reverificationReport]);

  const workspaceItems = React.useMemo(() => {
    const needsDecisionAttention = latestReceipt?.status === 'review'
      || latestReceipt?.status === 'rejected'
      || preview?.status === 'review'
      || preview?.status === 'rejected';
    const staffProfile = getPosStaffProfile(staffRole);
    const deviceAttention = deviceDiagnostics.filter((item) => item.status !== 'ready').length;
    const blockedAuditCases = auditCases.filter((item) => item.severity === 'block').length;
    const registryStale = secureRegistry?.freshUntil
      ? Date.parse(secureRegistry.freshUntil) <= Date.now()
      : true;
    const handoffComplete = reverificationReport.status === 'cleared'
      || latestReceipt?.shippingLabel?.packageReceiptVerified;
    const handoffNeedsWork = Boolean(latestReceipt || preview) && !handoffComplete;
    return [
      { id: 'scan' as const, label: panelT('workspaceScan'), detail: mode.toUpperCase(), count: payloadText ? 1 : 0, countLabel: posCaseCountDetail(appLanguage, payloadText ? 1 : 0), tone: 'normal' as const, primary: true, step: 1 },
      { id: 'decision' as const, label: panelT('workspaceDecision'), detail: posDecisionDetail(appLanguage, latestReceipt?.status || preview?.status), count: needsDecisionAttention ? 1 : 0, countLabel: posCaseCountDetail(appLanguage, needsDecisionAttention ? 1 : 0), tone: latestReceipt?.status === 'rejected' || preview?.status === 'rejected' ? 'danger' as const : 'warning' as const, primary: true, step: 2 },
      { id: 'handoff' as const, label: panelT('workspaceHandoff'), detail: handoffComplete ? posGradeDetail(appLanguage, 'cleared') : posPanelInlineCopy(appLanguage, 'Pending', '保留'), count: handoffNeedsWork ? 1 : 0, countLabel: posCaseCountDetail(appLanguage, handoffNeedsWork ? 1 : 0), tone: handoffComplete ? 'ok' as const : handoffNeedsWork ? 'warning' as const : 'normal' as const, primary: true, step: 3 },
      { id: 'report' as const, label: panelT('workspaceReport'), detail: posGradeDetail(appLanguage, reverificationReport.status), count: reverificationReport.status === 'cleared' ? 0 : 1, countLabel: posCaseCountDetail(appLanguage, reverificationReport.status === 'cleared' ? 0 : 1), tone: reverificationReport.status === 'blocked' ? 'danger' as const : reverificationReport.status === 'attention' ? 'warning' as const : 'ok' as const, primary: true, step: 4 },
      {
        id: 'admin' as const,
        label: panelT('workspaceAdmin'),
        detail: posGradeDetail(appLanguage, managementSnapshot.grade),
        count: managementSnapshot.risks.length,
        tone: managementSnapshot.grade === 'blocked'
          ? 'danger' as const
          : managementSnapshot.grade === 'attention'
            ? 'warning' as const
            : 'ok' as const,
      },
      { id: 'staff' as const, label: panelT('workspaceStaff'), detail: posStaffRoleDetail(appLanguage, staffRole, staffProfile.label), tone: operatorId ? 'ok' as const : 'warning' as const },
      { id: 'devices' as const, label: panelT('workspaceDevices'), detail: posReadyCountDetail(appLanguage, deviceDiagnostics.length - deviceAttention), count: deviceAttention, tone: deviceAttention ? 'warning' as const : 'ok' as const },
      { id: 'audit' as const, label: panelT('workspaceAudit'), detail: posCaseCountDetail(appLanguage, auditCases.length), count: auditCases.length, tone: blockedAuditCases ? 'danger' as const : auditCases.length ? 'warning' as const : 'ok' as const },
      { id: 'registry' as const, label: panelT('workspaceRegistry'), detail: posRegistryDetail(appLanguage, !registryStale), count: registryStale ? 1 : 0, tone: registryStale ? 'warning' as const : 'ok' as const },
      {
        id: 'network' as const,
        label: panelT('workspaceNetwork'),
        detail: posNetworkPostureDetail(appLanguage, networkAssurance.posture),
        count: networkAssurance.publicProjection.failingChecks + networkAssurance.publicProjection.warningChecks,
        tone: networkAssurance.posture === 'blocked'
          ? 'danger' as const
          : networkAssurance.posture === 'restricted' || networkAssurance.posture === 'monitor'
            ? 'warning' as const
            : 'ok' as const,
      },
      { id: 'keys' as const, label: panelT('workspaceKeys'), detail: posActiveCountDetail(appLanguage, activeSecureKeyCount), count: secureKeys.length, tone: activeSecureKeyCount ? 'ok' as const : 'warning' as const },
      { id: 'queue' as const, label: panelT('workspaceQueue'), detail: posSyncStateDetail(appLanguage, recentSyncState), count: receiptHistory.length, tone: recentSyncState === 'error' ? 'warning' as const : 'normal' as const },
      { id: 'design' as const, label: panelT('workspaceDesign'), detail: `${designReview.highestPriority} / ${designReview.score}`, count: designReview.items.length, tone: designReview.grade === 'blocked' ? 'danger' as const : designReview.grade === 'attention' ? 'warning' as const : 'ok' as const },
      { id: 'settings' as const, label: panelT('settingsWorkspace'), detail: appLanguageLabel, tone: 'normal' as const },
    ];
  }, [activeSecureKeyCount, appLanguage, appLanguageLabel, auditCases, designReview.grade, designReview.highestPriority, designReview.items.length, designReview.score, deviceDiagnostics, latestReceipt, latestReceipt?.status, managementSnapshot.grade, managementSnapshot.risks.length, mode, networkAssurance.posture, networkAssurance.publicProjection.failingChecks, networkAssurance.publicProjection.warningChecks, operatorId, panelT, payloadText, preview, preview?.status, receiptHistory.length, recentSyncState, reverificationReport.status, secureKeys.length, secureRegistry?.freshUntil, staffRole]);

  const primaryFlowItems = React.useMemo(
    () => workspaceItems.filter(item => item.primary),
    [workspaceItems],
  );
  const activeWorkspaceItem = workspaceItems.find(item => item.id === activeWorkspace) ?? workspaceItems[0];
  const commandRegistryFresh = secureRegistry?.freshUntil
    ? Date.parse(secureRegistry.freshUntil) > Date.now()
    : false;
  const offlineQueueTotal = offlinePaymentQueueCount + offlineDeliveryQueueCount;

  const professionReviews = React.useMemo(() => {
    const needsDecisionAttention = latestReceipt?.status === 'review'
      || latestReceipt?.status === 'rejected'
      || preview?.status === 'review'
      || preview?.status === 'rejected';
    const handoffComplete = reverificationReport.status === 'cleared'
      || latestReceipt?.shippingLabel?.packageReceiptVerified;
    const carrierTerminalCaptured = Boolean(
      (carrierTerminalId && carrierTerminalSignature)
      || (
        latestReceipt?.shippingLabel?.carrierTerminalId
        && latestReceipt.shippingLabel.carrierTerminalSignature
      ),
    );
    const paymentNeedsAttention = ethereumPaymentEnabled
      && ['requires-payment', 'rejected', 'review', 'cancelled'].includes(paymentStatus);

    return buildPosProfessionReviews({
      needsDecisionAttention: Boolean(needsDecisionAttention),
      handoffNeedsWork: Boolean(latestReceipt || preview) && !handoffComplete,
      handoffComplete: Boolean(handoffComplete),
      carrierTerminalCaptured,
      blockedAuditCases: auditCases.filter((item) => item.severity === 'block').length,
      managementRiskCount: managementSnapshot.risks.length,
      deviceAttention: deviceDiagnostics.filter((item) => item.status !== 'ready').length,
      networkIssueCount: networkAssurance.publicProjection.failingChecks
        + networkAssurance.publicProjection.warningChecks,
      registryStale: secureRegistry?.freshUntil
        ? Date.parse(secureRegistry.freshUntil) <= Date.now()
        : true,
      queueIssue: recentSyncState === 'error',
      activeSecureKeyCount,
      latestReceiptCount: receiptHistory.length + (latestReceipt ? 1 : 0),
      paymentNeedsAttention,
    });
  }, [
    activeSecureKeyCount,
    auditCases,
    carrierTerminalId,
    carrierTerminalSignature,
    deviceDiagnostics,
    ethereumPaymentEnabled,
    latestReceipt,
    latestReceipt?.status,
    managementSnapshot.risks.length,
    networkAssurance.publicProjection.failingChecks,
    networkAssurance.publicProjection.warningChecks,
    paymentStatus,
    preview,
    preview?.status,
    receiptHistory.length,
    recentSyncState,
    reverificationReport.status,
    secureRegistry?.freshUntil,
  ]);

  const focusProfessionReview = React.useCallback((review: PosProfessionReview) => {
    setActiveWorkspace(review.workspace);
    setScannerMessage(`${panelT('professionalCollaboration')}: ${panelT(review.titleKey)}`);
  }, [panelT]);

  return (
    <div className="space-y-4 p-3 md:p-5">
      <PosTerminalCommandCenter
        activeWorkspaceLabel={activeWorkspaceItem?.label ?? panelT('workspaceScan')}
        activeWorkspaceDetail={activeWorkspaceItem?.detail ?? mode.toUpperCase()}
        terminalId={terminalId}
        mode={mode}
        scannerMessage={posScannerMessage(appLanguage, scannerMessage)}
        receipt={latestReceipt}
        preview={preview}
        destination={destinationQrSummary}
        syncState={recentSyncState}
        registryFresh={commandRegistryFresh}
        activeSecureKeyCount={activeSecureKeyCount}
        queueTotal={offlineQueueTotal}
        operatorId={operatorId}
        language={appLanguage}
        onReadQr={() => { void startQrCamera(); }}
        onOpenDecision={() => setActiveWorkspace('decision')}
        onContinueHandoff={() => setActiveWorkspace('handoff')}
        onOpenQueue={() => setActiveWorkspace('queue')}
      />

      <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_390px] xl:grid-cols-[240px_minmax(0,1fr)_410px]">
        <PosWorkflowRail
          active={activeWorkspace}
          items={workspaceItems}
          primaryLabel={panelT('primaryFlow')}
          supportLabel={panelT('operations')}
          onChange={setActiveWorkspace}
        />

        <main className="min-w-0 space-y-4">
          <PosPrimaryFlowStepper
            active={activeWorkspace}
            items={primaryFlowItems}
            language={appLanguage}
            onChange={setActiveWorkspace}
          />

          <PosDecisionBanner
            terminalId={terminalId}
            scannerMessage={posScannerMessage(appLanguage, scannerMessage)}
            mode={mode}
            latestReceipt={latestReceipt}
            preview={preview}
            handoffReport={reverificationReport}
            registry={secureRegistry}
            syncState={recentSyncState}
            language={appLanguage}
          />

          <PosStaffDecisionPanel
            receipt={latestReceipt}
            preview={preview}
            destination={destinationQrSummary}
            language={appLanguage}
          />

          <PosOfflineQueueVisibilityPanel
            paymentQueueCount={offlinePaymentQueueCount}
            deliveryQueueCount={offlineDeliveryQueueCount}
            syncState={recentSyncState}
            language={appLanguage}
            onOpenQueue={() => setActiveWorkspace('queue')}
          />

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-slate-700" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
                    {panelT('professionalCollaboration')}
                  </h2>
                </div>
                <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                  {panelT('professionalCollaborationSummary')}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {posPanelInlineCopy(appLanguage, 'No raw address', '実住所なし')}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
              {professionReviews.map((review) => {
                const Icon = review.icon;
                const hasRisk = review.riskSignals > 0;
                return (
                  <button
                    key={review.id}
                    type="button"
                    onClick={() => focusProfessionReview(review)}
                    className={cn(
                      'flex h-full flex-col rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                      hasRisk
                        ? 'border-amber-200 bg-amber-50/70 hover:bg-amber-50'
                        : 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white',
                        hasRisk ? 'bg-amber-500' : 'bg-emerald-600',
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-950">{panelT(review.titleKey)}</h3>
                        <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{panelT(review.bodyKey)}</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-white/80 px-2 py-2">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {panelT('matchedSignals')}
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-950">{review.matchedSignals}</p>
                      </div>
                      <div className="rounded-md bg-white/80 px-2 py-2">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {panelT('riskSignals')}
                        </p>
                        <p className={cn('mt-1 text-lg font-black', hasRisk ? 'text-amber-700' : 'text-emerald-700')}>
                          {review.riskSignals}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-[10px] font-black uppercase tracking-wider text-white">
                      {hasRisk ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      {panelT(review.actionKey)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {activeWorkspace === 'admin' && (
            <PosManagementConsolePanel
              snapshot={managementSnapshot}
              designReview={designReview}
              fleetSnapshot={terminalFleetSnapshot}
              language={appLanguage}
              onGoWorkspace={setActiveWorkspace}
              onRefreshRegistry={() => { void refreshAgidSecureRegistry(); }}
              onRunDiagnostics={() => setDiagnosticRunAt(new Date().toISOString())}
              onSyncQueue={() => { void syncRecentReceipts(); }}
              onExportSnapshot={exportManagementSnapshot}
              onPrintSnapshot={printManagementSummary}
            />
          )}

          {activeWorkspace === 'design' && (
            <PosDesignReviewPanel
              review={designReview}
              language={appLanguage}
              onGoWorkspace={setActiveWorkspace}
            />
          )}

          {activeWorkspace === 'scan' && (
            <section className="space-y-4">
              <PosModeSelector mode={mode} modes={modes} onChange={setMode} />
              <PosReaderShell
                mode={mode}
                language={appLanguage}
                qrReaderId={qrReaderId}
                qrRunning={qrRunning}
                nfcSupported={nfcSupported}
                nfcState={nfcState}
                payloadText={payloadText}
                shippingScanRole={shippingScanRole}
                shippingRiskLevel={shippingRiskLevel}
                recipientProofMethod={shippingRecipientProofMethod}
                recipientProofCode={shippingRecipientProofCode}
                recipientChallenge={shippingRecipientChallenge}
                recipientChallengeSignature={shippingRecipientChallengeSignature}
                storePosId={storePosId}
                carrierTerminalId={carrierTerminalId}
                carrierTerminalSignature={carrierTerminalSignature}
                carrierTerminalSignedAt={carrierTerminalSignedAt}
                carrierLocationLat={carrierLocationLat}
                carrierLocationLon={carrierLocationLon}
                carrierLocationAccuracyMeters={carrierLocationAccuracyMeters}
                carrierLocationLabel={carrierLocationLabel}
                addressRiskAddressDefect={carrierAddressDefect}
                addressRiskUndeliverableRegion={carrierUndeliverableRegion}
                addressRiskPoBox={carrierPoBox}
                addressRiskAutoLock={carrierAutoLock}
                addressRiskAoidAccessProfileConfirmed={carrierAoidAccessProfileConfirmed}
                isSubmitting={isSubmitting}
                onPayloadChange={setPayloadText}
                onShippingScanRoleChange={setShippingScanRole}
                onShippingRiskLevelChange={setShippingRiskLevel}
                onRecipientProofMethodChange={setShippingRecipientProofMethod}
                onRecipientProofCodeChange={setShippingRecipientProofCode}
                onRecipientChallengeChange={setShippingRecipientChallenge}
                onRecipientChallengeSignatureChange={setShippingRecipientChallengeSignature}
                onStorePosIdChange={setStorePosId}
                onCarrierTerminalIdChange={setCarrierTerminalId}
                onCarrierTerminalSignatureChange={setCarrierTerminalSignature}
                onCarrierTerminalSignedAtChange={setCarrierTerminalSignedAt}
                onCarrierLocationLatChange={setCarrierLocationLat}
                onCarrierLocationLonChange={setCarrierLocationLon}
                onCarrierLocationAccuracyMetersChange={setCarrierLocationAccuracyMeters}
                onCarrierLocationLabelChange={setCarrierLocationLabel}
                onAddressRiskAddressDefectChange={setCarrierAddressDefect}
                onAddressRiskUndeliverableRegionChange={setCarrierUndeliverableRegion}
                onAddressRiskPoBoxChange={setCarrierPoBox}
                onAddressRiskAutoLockChange={setCarrierAutoLock}
                onAddressRiskAoidAccessProfileConfirmedChange={setCarrierAoidAccessProfileConfirmed}
                onIssueRecipientChallenge={issueRecipientChallenge}
                onStartQr={startQrCamera}
                onStopQr={() => { void stopQrCamera(); }}
                onStartNfc={startNfcScan}
                onSubmit={() => { void submitPayload(payloadText, mode); }}
                onWrapNfc={wrapManualPayloadForNfc}
                onDecryptAgidSecure={() => { void decryptAgidSecurePayload(); }}
                onBuildWaybillQr={buildWaybillQr}
              />
              <PosDestinationQrPanel
                summary={destinationQrSummary}
                language={appLanguage}
                qrRunning={qrRunning}
                receiptId={latestReceipt?.receiptId}
                onReadQr={() => { void startQrCamera(); }}
              />
            </section>
          )}

          {activeWorkspace === 'decision' && (
            <PosOperatorActionPanel
              receipt={latestReceipt}
              preview={preview}
              language={appLanguage}
              onGoScan={() => setActiveWorkspace('scan')}
              onGoHandoff={() => setActiveWorkspace('handoff')}
              onGoRegistry={() => setActiveWorkspace('registry')}
            />
          )}

          {activeWorkspace === 'handoff' && (
            <PosHandoffBoardPanel
              receipt={latestReceipt}
              preview={preview}
              report={reverificationReport}
              language={appLanguage}
              shippingScanRole={shippingScanRole}
              recipientProofMethod={shippingRecipientProofMethod}
              recipientChallenge={shippingRecipientChallenge}
              recipientChallengeSignature={shippingRecipientChallengeSignature}
              isSubmitting={isSubmitting}
              onShippingScanRoleChange={setShippingScanRole}
              onIssueRecipientChallenge={issueRecipientChallenge}
              onGoScan={() => setActiveWorkspace('scan')}
              onGoDecision={() => setActiveWorkspace('decision')}
              onGoReport={() => setActiveWorkspace('report')}
              onSubmit={() => { void submitPayload(payloadText, mode); }}
            />
          )}

          {activeWorkspace === 'staff' && (
            <PosStaffPermissionPanel
              role={staffRole}
              operatorId={operatorId}
              language={appLanguage}
              onRoleChange={setStaffRole}
            />
          )}

          {activeWorkspace === 'devices' && (
            <div className="space-y-4">
              <PosDeviceDiagnosticsPanel
                diagnostics={deviceDiagnostics}
                staffRole={staffRole}
                language={appLanguage}
                onRefresh={() => setDiagnosticRunAt(new Date().toISOString())}
                onPrint={printDeviceDiagnostics}
                onPrinterTest={runPrinterSelfTest}
                onCashDrawerTest={runCashDrawerTest}
                onBarcodeReaderTest={runBarcodeReaderPairingTest}
                onMeasurementPairTest={runMeasurementPairingTest}
              />
              <PosMeasurementInstrumentPanel
                diagnostic={deviceDiagnostics.find((device) => device.kind === 'measurement-instrument')}
                staffRole={staffRole}
                language={appLanguage}
                deviceId={measurementDeviceId}
                kind={measurementKind}
                value={measurementValue}
                unit={measurementUnit}
                sampleId={measurementSampleId}
                readings={measurementReadings}
                onDeviceIdChange={setMeasurementDeviceId}
                onKindChange={changeMeasurementKind}
                onValueChange={(value) => {
                  setMeasurementValue(value);
                  setMeasurementSource('manual');
                }}
                onUnitChange={(value) => {
                  setMeasurementUnit(value);
                  setMeasurementSource('manual');
                }}
                onSampleIdChange={setMeasurementSampleId}
                onReadDemo={readDemoMeasurement}
                onSave={saveMeasurementReading}
                onClear={clearMeasurementReadings}
              />
            </div>
          )}

          {activeWorkspace === 'audit' && (
            <PosExceptionAuditPanel
              cases={auditCases}
              staffRole={staffRole}
              language={appLanguage}
              onGoScan={() => setActiveWorkspace('scan')}
              onGoReport={() => setActiveWorkspace('report')}
              onPrint={printExceptionAudit}
            />
          )}

          {activeWorkspace === 'report' && (
            <PosHandoffReverificationPanel
              report={reverificationReport}
              staffRole={staffRole}
              language={appLanguage}
              onRefresh={() => setReverificationRunAt(new Date().toISOString())}
              onPrint={printHandoffReport}
            />
          )}

          {activeWorkspace === 'registry' && (
            <PosRegistryOperationsPanel
              registry={secureRegistry}
              syncState={recentSyncState}
              language={appLanguage}
              onRefreshRegistry={() => { void refreshAgidSecureRegistry(); }}
            />
          )}

          {activeWorkspace === 'network' && (
            <PosNetworkAssurancePanel
              assurance={networkAssurance}
              language={appLanguage}
              onRefresh={() => setNetworkRunAt(new Date().toISOString())}
              onGoWorkspace={setActiveWorkspace}
            />
          )}

          {activeWorkspace === 'keys' && (
            <SecureAgidKeyPanel
              keys={secureKeys}
              registry={secureRegistry}
              openPreview={secureOpenPreview}
              isDecrypting={isSecureDecrypting}
              language={appLanguage}
              onGenerateKey={generateSecureKey}
              onRotateKey={rotateSecureKey}
              onDecrypt={() => { void decryptAgidSecurePayload(); }}
              onRefreshRegistry={() => { void refreshAgidSecureRegistry(); }}
            />
          )}

          {activeWorkspace === 'queue' && (
            <section className="space-y-4">
              <PosOfflineQueueSummary
                receipts={receiptHistory}
                syncState={recentSyncState}
                language={appLanguage}
                onRefresh={() => { void syncRecentReceipts(); }}
                onClear={clearReceiptHistory}
                onPrint={printOfflineQueue}
              />
              <ReceiptLogPanel
                receipts={receiptHistory}
                syncState={recentSyncState}
                language={appLanguage}
                onRefresh={() => { void syncRecentReceipts(); }}
                onClear={clearReceiptHistory}
              />
            </section>
          )}

          {activeWorkspace === 'settings' && (
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{panelT('settingsKicker')}</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">{panelT('settingsTitle')}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500">{panelT('settingsSummary')}</p>
              </div>
              <PosTerminalSettingsForm
                terminalId={terminalId}
                operatorId={operatorId}
                purpose={purpose}
                amount={amount}
                appLanguage={appLanguage}
                currency={currency}
                ethereumPaymentEnabled={ethereumPaymentEnabled}
                paymentKind={paymentKind}
                settlementMode={settlementMode}
                paymentStatus={paymentStatus}
                tokenSymbol={tokenSymbol}
                paymentNetworkId={paymentNetworkId}
                observedPaymentTxHash={observedPaymentTxHash}
                releaseAfterHandoff={releaseAfterHandoff}
                highRiskPaymentMode={highRiskPaymentMode}
                carrierRejectAddressDefect={carrierRejectAddressDefect}
                carrierRejectUndeliverableRegion={carrierRejectUndeliverableRegion}
                carrierRejectPoBox={carrierRejectPoBox}
                carrierRejectAutoLock={carrierRejectAutoLock}
                carrierRequireAoidAccessProfile={carrierRequireAoidAccessProfile}
                onAppLanguageChange={onAppLanguageChange}
                onTerminalIdChange={setTerminalId}
                onOperatorIdChange={setOperatorId}
                onPurposeChange={setPurpose}
                onAmountChange={setAmount}
                onCurrencyChange={setCurrency}
                onEthereumPaymentEnabledChange={setEthereumPaymentEnabled}
                onPaymentKindChange={setPaymentKind}
                onSettlementModeChange={setSettlementMode}
                onPaymentStatusChange={setPaymentStatus}
                onTokenSymbolChange={setTokenSymbol}
                onPaymentNetworkIdChange={setPaymentNetworkId}
                onObservedPaymentTxHashChange={setObservedPaymentTxHash}
                onReleaseAfterHandoffChange={setReleaseAfterHandoff}
                onHighRiskPaymentModeChange={setHighRiskPaymentMode}
                onCarrierRejectAddressDefectChange={setCarrierRejectAddressDefect}
                onCarrierRejectUndeliverableRegionChange={setCarrierRejectUndeliverableRegion}
                onCarrierRejectPoBoxChange={setCarrierRejectPoBox}
                onCarrierRejectAutoLockChange={setCarrierRejectAutoLock}
                onCarrierRequireAoidAccessProfileChange={setCarrierRequireAoidAccessProfile}
              />
            </section>
          )}
        </main>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
          <PosTrustStatePanel
            registry={secureRegistry}
            runtimePolicy={capabilities?.runtimePolicy}
            receipt={latestReceipt}
            preview={preview}
            syncState={recentSyncState}
            language={appLanguage}
            onRefreshRegistry={() => { void refreshAgidSecureRegistry(); }}
          />
          {activeWorkspace !== 'keys' && (
            <SecureAgidKeyPanel
              keys={secureKeys}
              registry={secureRegistry}
              openPreview={secureOpenPreview}
              isDecrypting={isSecureDecrypting}
              language={appLanguage}
              onGenerateKey={generateSecureKey}
              onRotateKey={rotateSecureKey}
              onDecrypt={() => { void decryptAgidSecurePayload(); }}
              onRefreshRegistry={() => { void refreshAgidSecureRegistry(); }}
            />
          )}
          <LatestReceiptPanel
            receipt={latestReceipt}
            language={appLanguage}
            onPrintReceipt={printRedactedReceipt}
            onPrintShippingSlip={printShippingSlip}
          />
          <LocalPreviewPanel preview={preview} language={appLanguage} />
        </aside>
      </div>
    </div>
  );
};
