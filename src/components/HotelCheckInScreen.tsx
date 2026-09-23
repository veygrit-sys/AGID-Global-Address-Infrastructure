import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  Printer,
  QrCode,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  History,
  UserCheck,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import React from 'react';

import {
  buildHotelCheckInDeskRequest,
  buildHotelCheckInReceipt,
  completeHotelCheckIn,
  processHotelGuestQrScan,
  type HotelCheckInDeskRequest,
  type HotelCheckInReceipt,
  type HotelGuestQrScanResult,
} from '../lib/hotelCheckInSystem';
import {
  buildHotelCheckInReceiptPrintDocument,
  buildHotelPaymentReceiptPrintDocument,
  buildHotelTaxPaymentSummary,
  type HotelPrintableDocument,
} from '../lib/hotelReceiptPrint';
import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import { buildRegisteredAddressQrPayload, buildRegisteredAddressRecord } from '../lib/registeredAddressQr';
import { cn } from '../lib/utils';

type HotelCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'language'
  | 'issueQr'
  | 'scanGuestQr'
  | 'complete'
  | 'resetDemo'
  | 'property'
  | 'propertyAlias'
  | 'propertyName'
  | 'bookingAlias'
  | 'staffAlias'
  | 'terminalAlias'
  | 'countryCode'
  | 'city'
  | 'ttl'
  | 'scopes'
  | 'highRisk'
  | 'hotelQr'
  | 'qrPayload'
  | 'guestQrPayload'
  | 'usePublicAoidDemo'
  | 'latestScan'
  | 'latestReceipt'
  | 'privacyBoundary'
  | 'privacyBody'
  | 'issued'
  | 'expires'
  | 'nextAction'
  | 'safeSubject'
  | 'receiptRoot'
  | 'printReceipt'
  | 'printPaymentReceipt'
  | 'paymentReceipt'
  | 'receiptRecipientAlias'
  | 'amount'
  | 'taxAmount'
  | 'currency'
  | 'paymentMethod'
  | 'paymentAlias'
  | 'paidTaxes'
  | 'taxableBasis'
  | 'effectiveTaxRate'
  | 'taxStatus'
  | 'taxLedgerNote'
  | 'printBlocked'
  | 'noRequest'
  | 'noScan'
  | 'noReceipt'
  | 'copyPayload'
  | 'copied'
  | 'workflow'
  | 'workflowBody'
  | 'frontDesk'
  | 'guestDevice'
  | 'localReview'
  | 'pmsExport'
  | 'hotelQrIssue'
  | 'guestQrVerify'
  | 'pmsSafePreview'
  | 'pmsPreviewBody'
  | 'pmsPreviewOnly'
  | 'roomNumberExcluded'
  | 'phoneNumberExcluded'
  | 'guestAddressExcluded'
  | 'receiptPersonalPayloadExcluded'
  | 'receiptRawAgidExcluded'
  | 'receiptRawAoidExcluded'
  | 'receiptContactAllocationExcluded'
  | 'undo'
  | 'undoReady'
  | 'undoEmpty'
  | 'auditLog'
  | 'auditLogBody'
  | 'auditEvent'
  | 'safePmsFields'
  | 'addressSignal'
  | 'warnings';

const HOTEL_COPY: Record<'en' | 'ja', Record<HotelCopyKey, string>> = {
  en: {
    returnToMap: 'Return to AGID map',
    subtitle: 'Hotel-side QR issue, guest address intake, and redacted check-in receipts.',
    language: 'Display language',
    issueQr: 'Issue check-in QR',
    scanGuestQr: 'Verify guest QR',
    complete: 'Complete check-in',
    resetDemo: 'Reset demo',
    property: 'Property',
    propertyAlias: 'Property alias',
    propertyName: 'Property name',
    bookingAlias: 'Booking alias',
    staffAlias: 'Staff alias',
    terminalAlias: 'Terminal alias',
    countryCode: 'Country',
    city: 'City',
    ttl: 'QR TTL minutes',
    scopes: 'Requested scopes',
    highRisk: 'High-risk mode',
    hotelQr: 'Hotel check-in QR',
    qrPayload: 'QR payload',
    guestQrPayload: 'Guest address QR payload',
    usePublicAoidDemo: 'Use public AOID demo',
    latestScan: 'Latest guest scan',
    latestReceipt: 'Latest receipt',
    privacyBoundary: 'Privacy boundary',
    privacyBody: 'The hotel QR carries no guest address. The hotel system keeps safe aliases, scope decisions, and receipts only; PMS export requires an explicit action.',
    issued: 'Issued',
    expires: 'Expires',
    nextAction: 'Next action',
    safeSubject: 'Safe subject ref',
    receiptRoot: 'Receipt root',
    printReceipt: 'Print receipt',
    printPaymentReceipt: 'Print payment receipt',
    paymentReceipt: 'Payment receipt',
    receiptRecipientAlias: 'Receipt recipient alias',
    amount: 'Amount',
    taxAmount: 'Tax / VAT',
    currency: 'Currency',
    paymentMethod: 'Payment method',
    paymentAlias: 'Payment alias',
    paidTaxes: 'Paid taxes',
    taxableBasis: 'Taxable basis',
    effectiveTaxRate: 'Effective tax rate',
    taxStatus: 'Tax status',
    taxLedgerNote: 'Tax values are local receipt evidence. Reconcile them with the PMS or accounting system for statutory filings.',
    printBlocked: 'Printing was blocked. Allow pop-ups or export the HTML from the print preview.',
    noRequest: 'Issue a check-in QR to start.',
    noScan: 'No guest QR has been verified yet.',
    noReceipt: 'No receipt yet.',
    copyPayload: 'Copy payload',
    copied: 'Copied to clipboard',
    workflow: 'Hotel flow',
    workflowBody: 'Show a short-lived QR at the front desk. The guest scans it, presents an address QR or AOID reference, and the hotel receives only a decision receipt unless staff explicitly exports to a PMS adapter.',
    frontDesk: 'Front desk',
    guestDevice: 'Guest device',
    localReview: 'Local review',
    pmsExport: 'PMS export gated',
    hotelQrIssue: 'Hotel QR issue',
    guestQrVerify: 'Guest QR verify',
    pmsSafePreview: 'Safe PMS preview',
    pmsPreviewBody: 'Preview exactly what would be sent before OPERA/OHIP or another PMS connector runs. Raw guest address, room number, and phone are excluded by default.',
    pmsPreviewOnly: 'Preview only - connector locked',
    roomNumberExcluded: 'Room number excluded',
    phoneNumberExcluded: 'Phone number excluded',
    guestAddressExcluded: 'Guest address excluded',
    receiptPersonalPayloadExcluded: 'Personal payload excluded',
    receiptRawAgidExcluded: 'Raw AGID excluded',
    receiptRawAoidExcluded: 'Raw AOID excluded',
    receiptContactAllocationExcluded: 'Contact/allocation excluded',
    undo: 'Undo last action',
    undoReady: 'Undo available',
    undoEmpty: 'No undo state',
    auditLog: 'Audit log',
    auditLogBody: 'Front-desk actions are recorded as aliases, decisions, receipt IDs, and roots only.',
    auditEvent: 'Audit event',
    safePmsFields: 'PMS fields',
    addressSignal: 'Address signal',
    warnings: 'Warnings',
  },
  ja: {
    returnToMap: 'AGIDマップへ戻る',
    subtitle: 'ホテル側のQR発行、ゲスト住所QR照合、秘匿チェックインreceipt。',
    language: '表示言語',
    issueQr: 'チェックインQR発行',
    scanGuestQr: 'ゲストQRを確認',
    complete: 'チェックイン完了',
    resetDemo: 'デモ初期化',
    property: '施設',
    propertyAlias: '施設alias',
    propertyName: '施設名',
    bookingAlias: '予約alias',
    staffAlias: 'スタッフalias',
    terminalAlias: '端末alias',
    countryCode: '国',
    city: '都市',
    ttl: 'QR有効分数',
    scopes: '要求scope',
    highRisk: '高リスクモード',
    hotelQr: 'ホテルチェックインQR',
    qrPayload: 'QR payload',
    guestQrPayload: 'ゲスト住所QR payload',
    usePublicAoidDemo: '公開AOIDデモを使う',
    latestScan: '最新ゲスト照合',
    latestReceipt: '最新receipt',
    privacyBoundary: 'プライバシー境界',
    privacyBody: 'ホテルQRにゲスト住所は入りません。ホテル側は安全なalias、scope判定、receiptだけを保持し、PMS出力は明示操作が必要です。',
    issued: '発行',
    expires: '期限',
    nextAction: '次の操作',
    safeSubject: '安全な対象参照',
    receiptRoot: 'Receipt root',
    printReceipt: 'Receipt印刷',
    printPaymentReceipt: '領収証印刷',
    paymentReceipt: '支払い領収証',
    receiptRecipientAlias: '領収証宛名alias',
    amount: '金額',
    taxAmount: '税 / VAT',
    currency: '通貨',
    paymentMethod: '支払い方法',
    paymentAlias: '支払いalias',
    paidTaxes: '支払った税金',
    taxableBasis: '税抜相当',
    effectiveTaxRate: '推定税率',
    taxStatus: '税ステータス',
    taxLedgerNote: '税額はローカル領収証の証跡です。法定申告はPMSまたは会計システムと照合してください。',
    printBlocked: '印刷画面を開けませんでした。ポップアップ許可または印刷プレビューからHTML保存を使ってください。',
    noRequest: 'チェックインQRを発行すると開始できます。',
    noScan: 'まだゲストQRは確認されていません。',
    noReceipt: 'まだreceiptはありません。',
    copyPayload: 'Payloadコピー',
    copied: 'クリップボードへコピーしました',
    workflow: 'ホテル運用フロー',
    workflowBody: 'フロントで短期QRを表示し、ゲストが読み取って住所QRまたはAOID参照を提示します。ホテル側は、スタッフが明示的にPMS連携しない限り判定receiptだけを受け取ります。',
    frontDesk: 'フロント',
    guestDevice: 'ゲスト端末',
    localReview: 'ローカル確認',
    pmsExport: 'PMS出力はゲート',
    hotelQrIssue: 'ホテルQR発行',
    guestQrVerify: 'ゲストQR確認',
    pmsSafePreview: 'PMS安全プレビュー',
    pmsPreviewBody: 'OPERA/OHIPや他のPMSコネクタを動かす前に、送信予定の内容だけを確認します。ゲスト住所、部屋番号、電話番号は標準で除外します。',
    pmsPreviewOnly: 'プレビューのみ - 連携ロック中',
    roomNumberExcluded: '部屋番号は除外',
    phoneNumberExcluded: '電話番号は除外',
    guestAddressExcluded: 'ゲスト住所は除外',
    receiptPersonalPayloadExcluded: '個人payloadは除外',
    receiptRawAgidExcluded: 'raw AGIDは除外',
    receiptRawAoidExcluded: 'raw AOIDは除外',
    receiptContactAllocationExcluded: '連絡先/割当情報は除外',
    undo: '直前操作を取り消し',
    undoReady: '取り消し可能',
    undoEmpty: '取り消し状態なし',
    auditLog: '監査ログ',
    auditLogBody: 'フロント操作はalias、判定、receipt ID、rootのみで記録します。',
    auditEvent: '監査イベント',
    safePmsFields: 'PMS項目',
    addressSignal: '住所シグナル',
    warnings: '警告',
  },
};

const HOTEL_REQUESTS_STORAGE_KEY = 'agid:hotel-checkin:requests:v1';
const HOTEL_RECEIPTS_STORAGE_KEY = 'agid:hotel-checkin:receipts:v1';
const HOTEL_LAST_SCAN_STORAGE_KEY = 'agid:hotel-checkin:last-scan:v1';

const SCOPES = [
  'guest-address',
  'recipient-proof',
  'residence-region',
  'delivery-eligibility',
  'local-contact',
] as const;

function t(language: string, key: HotelCopyKey) {
  return HOTEL_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function readStoredLanguage() {
  try {
    return normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || 'ja');
  } catch {
    return 'ja';
  }
}

function returnToMap() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.href = '/';
}

function formatTime(value: string | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function readStoredRequests(): HotelCheckInDeskRequest[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HOTEL_REQUESTS_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 8) as HotelCheckInDeskRequest[] : [];
  } catch {
    return [];
  }
}

function readStoredReceipts(): HotelCheckInReceipt[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HOTEL_RECEIPTS_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 12) as HotelCheckInReceipt[] : [];
  } catch {
    return [];
  }
}

function readStoredScan(): HotelGuestQrScanResult | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(HOTEL_LAST_SCAN_STORAGE_KEY) || 'null');
    return parsed && typeof parsed === 'object' ? parsed as HotelGuestQrScanResult : null;
  } catch {
    return null;
  }
}

function buildPublicAoidDemoPayload() {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'redacted',
      city: 'redacted',
      phone: 'redacted',
    },
    {
      mode: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      agid: 'JP05AV8TJGH8',
      now: new Date().toISOString(),
    },
  );
  return buildRegisteredAddressQrPayload(record, { privacy: 'public' });
}

function openPrintableDocument(document: HotelPrintableDocument) {
  const popup = window.open('', '_blank', 'width=860,height=920');
  if (!popup) return false;

  popup.document.open();
  popup.document.write(document.html);
  popup.document.close();
  popup.document.title = document.title;
  popup.focus();
  window.setTimeout(() => popup.print(), 150);
  return true;
}

function StatusBadge(props: { label: string; tone?: 'ok' | 'warn' | 'danger' | 'neutral' }) {
  const tone = props.tone ?? 'neutral';
  return (
    <span className={cn(
      'inline-flex min-h-[28px] items-center rounded-md border px-2 text-[10px] font-black uppercase tracking-wider',
      tone === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
      tone === 'warn' && 'border-amber-200 bg-amber-50 text-amber-800',
      tone === 'danger' && 'border-rose-200 bg-rose-50 text-rose-800',
      tone === 'neutral' && 'border-slate-200 bg-slate-50 text-slate-600',
    )}>
      {props.label}
    </span>
  );
}

function SignalRow(props: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
      <span className="text-xs font-black text-slate-600">{props.label}</span>
      <span className={cn(
        'rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider',
        props.value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
      )}>
        {String(props.value)}
      </span>
    </div>
  );
}

type HotelAuditEvent = {
  eventId: string;
  action: 'issue_qr' | 'verify_guest_qr' | 'complete_check_in' | 'reset_demo' | 'undo';
  createdAt: string;
  actorAlias: string;
  requestId?: string;
  receiptId?: string;
  summary: string;
};

type HotelUndoSnapshot = {
  requests: HotelCheckInDeskRequest[];
  latestScan: HotelGuestQrScanResult | null;
  receipts: HotelCheckInReceipt[];
  guestQrPayload: string;
  notice: string;
  label: string;
};

function buildHotelAuditEvent(input: {
  action: HotelAuditEvent['action'];
  actorAlias: string;
  requestId?: string;
  receiptId?: string;
  summary: string;
}): HotelAuditEvent {
  return {
    eventId: `HAE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    action: input.action,
    actorAlias: input.actorAlias,
    ...(input.requestId ? { requestId: input.requestId } : {}),
    ...(input.receiptId ? { receiptId: input.receiptId } : {}),
    summary: input.summary,
  };
}

function buildSafePmsPreview(input: {
  request: HotelCheckInDeskRequest | null;
  scan: HotelGuestQrScanResult | null;
  receipt: HotelCheckInReceipt | null;
}) {
  return [
    ['operation', 'hotel-checkin-safe-preview'],
    ['requestId', input.request?.requestId ?? 'not-issued'],
    ['propertyAlias', input.request?.property.propertyAlias ?? 'not-issued'],
    ['bookingAlias', input.request?.bookingAlias ?? 'none'],
    ['decision', input.receipt?.decision ?? input.scan?.decision ?? 'pending'],
    ['safeSubjectRef', input.receipt?.safeSubjectRef ?? input.scan?.safeSubjectRef ?? 'pending'],
    ['receiptId', input.receipt?.receiptId ?? 'pending'],
    ['receiptRoot', input.receipt?.receiptRoot?.slice(0, 32) ?? 'pending'],
    ['requestedScopes', input.request?.requestedScopes.join(', ') ?? 'none'],
    ['guestAddress', 'excluded-by-default'],
    ['roomNumber', 'excluded-by-default'],
    ['phoneNumber', 'excluded-by-default'],
  ] as const;
}

export const HotelCheckInScreen: React.FC = () => {
  const [appLanguage, setAppLanguageState] = React.useState(readStoredLanguage);
  const [propertyAlias, setPropertyAlias] = React.useState('hotel:front-desk-demo');
  const [propertyName, setPropertyName] = React.useState('AGID Demo Hotel');
  const [bookingAlias, setBookingAlias] = React.useState('booking:local-demo-001');
  const [staffAlias, setStaffAlias] = React.useState('staff:front-desk-01');
  const [terminalAlias, setTerminalAlias] = React.useState('terminal:hotel-desk-01');
  const [countryCode, setCountryCode] = React.useState('JP');
  const [city, setCity] = React.useState('Tokyo');
  const [ttlMinutes, setTtlMinutes] = React.useState(10);
  const [highRiskMode, setHighRiskMode] = React.useState(false);
  const [selectedScopes, setSelectedScopes] = React.useState<string[]>(['guest-address', 'recipient-proof']);
  const [requests, setRequests] = React.useState<HotelCheckInDeskRequest[]>(readStoredRequests);
  const [latestScan, setLatestScan] = React.useState<HotelGuestQrScanResult | null>(readStoredScan);
  const [receipts, setReceipts] = React.useState<HotelCheckInReceipt[]>(readStoredReceipts);
  const [guestQrPayload, setGuestQrPayload] = React.useState('');
  const [receiptRecipientAlias, setReceiptRecipientAlias] = React.useState('guest:local-alias');
  const [receiptAmount, setReceiptAmount] = React.useState('12800');
  const [receiptTaxAmount, setReceiptTaxAmount] = React.useState('1164');
  const [receiptCurrency, setReceiptCurrency] = React.useState('JPY');
  const [paymentMethod, setPaymentMethod] = React.useState('card-present');
  const [paymentAlias, setPaymentAlias] = React.useState('payment:local-demo');
  const [notice, setNotice] = React.useState('');
  const [auditLog, setAuditLog] = React.useState<HotelAuditEvent[]>([]);
  const [undoSnapshot, setUndoSnapshot] = React.useState<HotelUndoSnapshot | null>(null);
  const currentRequest = requests[0] ?? null;
  const latestReceipt = receipts[0] ?? null;
  const copy = React.useCallback((key: HotelCopyKey) => t(appLanguage, key), [appLanguage]);
  const safePmsPreview = React.useMemo(() => buildSafePmsPreview({
    request: currentRequest,
    scan: latestScan,
    receipt: latestReceipt,
  }), [currentRequest, latestReceipt, latestScan]);
  const taxSummary = React.useMemo(() => latestReceipt
    ? buildHotelTaxPaymentSummary({
      receipt: latestReceipt,
      propertyName,
      receiptRecipientAlias,
      amount: receiptAmount,
      taxAmount: receiptTaxAmount,
      currency: receiptCurrency,
      paymentMethod,
      paymentAlias,
      issuedByAlias: staffAlias,
    })
    : null,
  [
    latestReceipt,
    paymentAlias,
    paymentMethod,
    propertyName,
    receiptAmount,
    receiptCurrency,
    receiptRecipientAlias,
    receiptTaxAmount,
    staffAlias,
  ]);

  React.useEffect(() => {
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage);
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = getLanguageDirection(appLanguage);
  }, [appLanguage]);

  React.useEffect(() => {
    localStorage.setItem(HOTEL_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  React.useEffect(() => {
    localStorage.setItem(HOTEL_RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
  }, [receipts]);

  React.useEffect(() => {
    if (latestScan) localStorage.setItem(HOTEL_LAST_SCAN_STORAGE_KEY, JSON.stringify(latestScan));
    else localStorage.removeItem(HOTEL_LAST_SCAN_STORAGE_KEY);
  }, [latestScan]);

  const setAppLanguage = React.useCallback((language: string) => {
    setAppLanguageState(normalizeAppLanguage(language));
  }, []);

  const pushReceipt = React.useCallback((receipt: HotelCheckInReceipt) => {
    setReceipts(previous => [receipt, ...previous].slice(0, 12));
  }, []);

  const captureUndoSnapshot = React.useCallback((label: string): HotelUndoSnapshot => ({
    requests,
    latestScan,
    receipts,
    guestQrPayload,
    notice,
    label,
  }), [guestQrPayload, latestScan, notice, receipts, requests]);

  const recordAudit = React.useCallback((event: Omit<Parameters<typeof buildHotelAuditEvent>[0], 'actorAlias'>) => {
    setAuditLog(previous => [
      buildHotelAuditEvent({
        actorAlias: staffAlias,
        ...event,
      }),
      ...previous,
    ].slice(0, 12));
  }, [staffAlias]);

  const issueQr = React.useCallback(() => {
    setUndoSnapshot(captureUndoSnapshot(copy('issueQr')));
    const request = buildHotelCheckInDeskRequest({
      propertyAlias,
      propertyName,
      staffAlias,
      terminalAlias,
      bookingAlias,
      countryCode,
      city,
      requestedScopes: selectedScopes as Parameters<typeof buildHotelCheckInDeskRequest>[0]['requestedScopes'],
      highRiskMode,
      ttlMinutes,
      now: new Date().toISOString(),
    });
    setRequests(previous => [request, ...previous].slice(0, 8));
    setLatestScan(null);
    const receipt = buildHotelCheckInReceipt(request, 'issue_qr');
    pushReceipt(receipt);
    recordAudit({
      action: 'issue_qr',
      requestId: request.requestId,
      receiptId: receipt.receiptId,
      summary: 'hotel-qr-issued-no-guest-address',
    });
  }, [bookingAlias, captureUndoSnapshot, city, copy, countryCode, highRiskMode, propertyAlias, propertyName, pushReceipt, recordAudit, selectedScopes, staffAlias, terminalAlias, ttlMinutes]);

  const verifyGuestQr = React.useCallback(() => {
    if (!currentRequest) return;
    setUndoSnapshot(captureUndoSnapshot(copy('scanGuestQr')));
    const result = processHotelGuestQrScan(currentRequest, guestQrPayload, new Date().toISOString());
    setRequests(previous => [result.request, ...previous.filter(item => item.requestId !== currentRequest.requestId)].slice(0, 8));
    setLatestScan(result.scan);
    pushReceipt(result.receipt);
    recordAudit({
      action: 'verify_guest_qr',
      requestId: result.request.requestId,
      receiptId: result.receipt.receiptId,
      summary: `guest-qr-${result.scan.decision}-safe-subject-only`,
    });
  }, [captureUndoSnapshot, copy, currentRequest, guestQrPayload, pushReceipt, recordAudit]);

  const completeCheckIn = React.useCallback(() => {
    if (!currentRequest) return;
    setUndoSnapshot(captureUndoSnapshot(copy('complete')));
    const result = completeHotelCheckIn(currentRequest, latestScan, new Date().toISOString());
    setRequests(previous => [result.request, ...previous.filter(item => item.requestId !== currentRequest.requestId)].slice(0, 8));
    pushReceipt(result.receipt);
    recordAudit({
      action: 'complete_check_in',
      requestId: result.request.requestId,
      receiptId: result.receipt.receiptId,
      summary: `check-in-${result.receipt.decision}-pms-preview-required`,
    });
  }, [captureUndoSnapshot, copy, currentRequest, latestScan, pushReceipt, recordAudit]);

  const printCheckInReceipt = React.useCallback(() => {
    if (!latestReceipt) return;
    const document = buildHotelCheckInReceiptPrintDocument(latestReceipt, { propertyName });
    if (!openPrintableDocument(document)) setNotice(copy('printBlocked'));
  }, [copy, latestReceipt, propertyName]);

  const printPaymentReceipt = React.useCallback(() => {
    if (!latestReceipt) return;
    const document = buildHotelPaymentReceiptPrintDocument({
      receipt: latestReceipt,
      propertyName,
      receiptRecipientAlias,
      amount: receiptAmount,
      taxAmount: receiptTaxAmount,
      currency: receiptCurrency,
      paymentMethod,
      paymentAlias,
      issuedByAlias: staffAlias,
    });
    if (!openPrintableDocument(document)) setNotice(copy('printBlocked'));
  }, [
    copy,
    latestReceipt,
    paymentAlias,
    paymentMethod,
    propertyName,
    receiptAmount,
    receiptCurrency,
    receiptRecipientAlias,
    receiptTaxAmount,
    staffAlias,
  ]);

  const copyPayload = React.useCallback(async () => {
    if (!currentRequest) return;
    await navigator.clipboard?.writeText(currentRequest.qrPayload);
    setNotice(copy('copied'));
    window.setTimeout(() => setNotice(''), 1600);
  }, [copy, currentRequest]);

  const resetDemo = React.useCallback(() => {
    setUndoSnapshot(captureUndoSnapshot(copy('resetDemo')));
    setRequests([]);
    setLatestScan(null);
    setReceipts([]);
    setGuestQrPayload('');
    localStorage.removeItem(HOTEL_REQUESTS_STORAGE_KEY);
    localStorage.removeItem(HOTEL_RECEIPTS_STORAGE_KEY);
    localStorage.removeItem(HOTEL_LAST_SCAN_STORAGE_KEY);
    recordAudit({
      action: 'reset_demo',
      summary: 'local-demo-reset',
    });
  }, [captureUndoSnapshot, copy, recordAudit]);

  const undoLastAction = React.useCallback(() => {
    if (!undoSnapshot) return;
    setRequests(undoSnapshot.requests);
    setLatestScan(undoSnapshot.latestScan);
    setReceipts(undoSnapshot.receipts);
    setGuestQrPayload(undoSnapshot.guestQrPayload);
    setNotice(undoSnapshot.notice);
    recordAudit({
      action: 'undo',
      requestId: undoSnapshot.requests[0]?.requestId,
      receiptId: undoSnapshot.receipts[0]?.receiptId,
      summary: `undo:${undoSnapshot.label}`,
    });
    setUndoSnapshot(null);
  }, [recordAudit, undoSnapshot]);

  const activeStep = !currentRequest
    ? 1
    : currentRequest.status === 'completed'
      ? 4
      : latestScan
        ? 3
        : 2;

  return (
    <div className="agid-fixed-page-scroll fixed inset-0 z-[210] bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/60 md:px-6">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={returnToMap}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-900 hover:text-white active:scale-95"
              aria-label={copy('returnToMap')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white sm:flex">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black text-slate-950 md:text-xl">AGID Hotel Check-in</h1>
              <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-500">{copy('subtitle')}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {notice && (
              <span className="hidden rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-800 md:inline-flex">
                {notice}
              </span>
            )}
            <select
              value={appLanguage}
              onChange={event => setAppLanguage(event.target.value)}
              className="h-10 max-w-[190px] rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              aria-label={copy('language')}
            >
              {APP_LANGUAGES.map(language => (
                <option key={language.code} value={language.code}>{language.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={undoLastAction}
              disabled={!undoSnapshot}
              className="flex h-10 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              title={undoSnapshot ? `${copy('undoReady')}: ${undoSnapshot.label}` : copy('undoEmpty')}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden lg:inline">{copy('undo')}</span>
            </button>
            <button
              type="button"
              onClick={resetDemo}
              className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-900 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{copy('resetDemo')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-3 py-4 md:px-5">
        <section className="grid gap-3 lg:grid-cols-4">
          {[
            { step: 1, label: copy('hotelQrIssue'), icon: Building2 },
            { step: 2, label: copy('guestQrVerify'), icon: QrCode },
            { step: 3, label: copy('localReview'), icon: UserCheck },
            { step: 4, label: copy('pmsSafePreview'), icon: FileCheck2 },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className={cn(
                  'flex min-h-[76px] items-center gap-3 rounded-lg border px-4 py-3',
                  activeStep === item.step ? 'border-blue-300 bg-blue-50 text-blue-900 shadow-sm' : 'border-slate-200 bg-white text-slate-500',
                )}
              >
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                  activeStep === item.step ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500',
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">0{item.step}</p>
                  <p className="text-sm font-black">{item.label}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-950">
          <p className="text-[10px] font-black uppercase tracking-widest">{copy('workflow')}</p>
          <p className="mt-1 text-sm font-bold leading-6">{copy('workflowBody')}</p>
          <div className="mt-3 grid gap-2 text-xs font-black text-blue-950 md:grid-cols-3">
            {[copy('hotelQrIssue'), copy('guestQrVerify'), copy('pmsSafePreview')].map((label, index) => (
              <div key={label} className="rounded-md bg-white/70 px-3 py-2">
                {index + 1}. {label}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy('property')}</p>
                  <h2 className="text-lg font-black text-slate-950">{copy('issueQr')}</h2>
                </div>
                <StatusBadge label={currentRequest?.status ?? 'not issued'} tone={currentRequest ? 'ok' : 'neutral'} />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  [copy('propertyAlias'), propertyAlias, setPropertyAlias],
                  [copy('propertyName'), propertyName, setPropertyName],
                  [copy('bookingAlias'), bookingAlias, setBookingAlias],
                  [copy('staffAlias'), staffAlias, setStaffAlias],
                  [copy('terminalAlias'), terminalAlias, setTerminalAlias],
                  [copy('countryCode'), countryCode, setCountryCode],
                  [copy('city'), city, setCity],
                ].map(([label, value, setter]) => (
                  <label key={label as string} className="block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label as string}</span>
                    <input
                      value={value as string}
                      onChange={event => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                      className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ))}

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy('ttl')}</span>
                  <input
                    type="number"
                    min={1}
                    max={highRiskMode ? 10 : 60}
                    value={ttlMinutes}
                    onChange={event => setTtlMinutes(Number(event.target.value))}
                    className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="flex min-h-[68px] items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-black text-amber-900">
                  <input
                    type="checkbox"
                    checked={highRiskMode}
                    onChange={event => {
                      setHighRiskMode(event.target.checked);
                      if (event.target.checked) setTtlMinutes(value => Math.min(value, 10));
                    }}
                    className="h-4 w-4"
                  />
                  {copy('highRisk')}
                </label>
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy('scopes')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SCOPES.map(scope => {
                    const selected = selectedScopes.includes(scope);
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setSelectedScopes(previous =>
                          selected ? previous.filter(item => item !== scope) : [...previous, scope],
                        )}
                        className={cn(
                          'h-9 rounded-md px-3 text-[10px] font-black uppercase tracking-wider transition-all',
                          selected ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                        )}
                      >
                        {scope}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={issueQr}
                  className="flex h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                >
                  <QrCode className="h-4 w-4" />
                  {copy('issueQr')}
                </button>
                <button
                  type="button"
                  onClick={copyPayload}
                  disabled={!currentRequest}
                  className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <Copy className="h-4 w-4" />
                  {copy('copyPayload')}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy('scanGuestQr')}</p>
                  <h2 className="text-lg font-black text-slate-950">{copy('guestQrPayload')}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setGuestQrPayload(buildPublicAoidDemoPayload())}
                  className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-900 hover:text-white"
                >
                  <KeyRound className="h-4 w-4" />
                  {copy('usePublicAoidDemo')}
                </button>
              </div>

              <textarea
                value={guestQrPayload}
                onChange={event => setGuestQrPayload(event.target.value)}
                className="h-36 w-full resize-none rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Paste or scan a guest address QR payload..."
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={verifyGuestQr}
                  disabled={!currentRequest || !guestQrPayload.trim()}
                  className="flex h-11 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <ScanLine className="h-4 w-4" />
                  {copy('scanGuestQr')}
                </button>
                <button
                  type="button"
                  onClick={completeCheckIn}
                  disabled={!currentRequest}
                  className="flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {copy('complete')}
                </button>
              </div>
            </div>

            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-900">
                <LockKeyhole className="h-5 w-5" />
                <h2 className="text-sm font-black uppercase tracking-widest">{copy('privacyBoundary')}</h2>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-emerald-900/80">{copy('privacyBody')}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {['hotel QR: no guest fields', 'receipt: redacted', 'PMS: explicit', 'local-first'].map(item => (
                  <div key={item} className="rounded-md bg-white/80 px-3 py-2 text-center shadow-sm">
                    <ShieldCheck className="mx-auto h-4 w-4 text-emerald-600" />
                    <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-emerald-900/70">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{copy('hotelQr')}</h2>
              </div>
              {currentRequest ? (
                <div className="grid gap-3">
                  <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-4">
                    <QRCodeCanvas value={currentRequest.qrPayload} size={180} level="H" includeMargin={false} />
                  </div>
                  <div className="grid gap-2">
                    <div className="rounded-md bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Request ID</p>
                      <p className="mt-1 break-all font-mono text-xs font-black text-slate-800">{currentRequest.requestId}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy('issued')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{formatTime(currentRequest.issuedAt)}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy('expires')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{formatTime(currentRequest.expiresAt)}</p>
                      </div>
                    </div>
                    <div className="rounded-md bg-blue-50 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">{copy('nextAction')}</p>
                      <p className="mt-1 text-sm font-black text-blue-950">{currentRequest.nextAction}</p>
                    </div>
                    <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {copy('qrPayload')}
                      </summary>
                      <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] font-bold text-slate-600">
                        {currentRequest.qrPayload}
                      </pre>
                    </details>
                  </div>
                </div>
              ) : (
                <p className="rounded-md bg-slate-50 px-3 py-4 text-sm font-bold text-slate-500">{copy('noRequest')}</p>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{copy('latestScan')}</h2>
              </div>
              {latestScan ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={latestScan.status.replace(/_/g, ' ')} tone={latestScan.decision === 'accept' ? 'ok' : latestScan.decision === 'reject' ? 'danger' : 'warn'} />
                    <StatusBadge label={latestScan.source} />
                  </div>
                  <div className="grid gap-2">
                    <SignalRow label="country" value={latestScan.addressSignal.countryPresent} />
                    <SignalRow label="city" value={latestScan.addressSignal.cityPresent} />
                    <SignalRow label="postcode" value={latestScan.addressSignal.postcodePresent} />
                    <SignalRow label="street" value={latestScan.addressSignal.streetPresent} />
                    <SignalRow label="building / room" value={latestScan.addressSignal.buildingOrRoomPresent} />
                    <SignalRow label="public AOID only" value={latestScan.addressSignal.publicAoidReferenceOnly} />
                  </div>
                  <div className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy('safeSubject')}</p>
                    <p className="mt-1 break-all font-mono text-xs font-black text-slate-800">{latestScan.safeSubjectRef}</p>
                  </div>
                  {latestScan.warnings.length > 0 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">{copy('warnings')}</p>
                      <div className="mt-2 space-y-1">
                        {latestScan.warnings.map(warning => (
                          <p key={warning} className="text-xs font-bold text-amber-900">{warning}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-md bg-slate-50 px-3 py-4 text-sm font-bold text-slate-500">{copy('noScan')}</p>
              )}
            </section>

            <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-blue-700" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-blue-950">{copy('pmsSafePreview')}</h2>
                </div>
                <StatusBadge label={copy('pmsPreviewOnly')} tone="warn" />
              </div>
              <p className="text-sm font-bold leading-6 text-blue-950/80">{copy('pmsPreviewBody')}</p>
              <div className="mt-3 grid gap-2">
                {safePmsPreview.map(([label, value]) => (
                  <div key={label} className="grid gap-1 rounded-md bg-white/80 px-3 py-2 md:grid-cols-[150px_1fr]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">{label}</span>
                    <span className="break-all font-mono text-xs font-black text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[copy('roomNumberExcluded'), copy('phoneNumberExcluded'), copy('guestAddressExcluded')].map(item => (
                  <div key={item} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{copy('latestReceipt')}</h2>
              </div>
              {latestReceipt ? (
                <div className="space-y-3">
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge label={latestReceipt.action} tone={latestReceipt.decision === 'complete' ? 'ok' : latestReceipt.decision === 'reject' ? 'danger' : latestReceipt.decision === 'review' ? 'warn' : 'neutral'} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {formatTime(latestReceipt.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 break-all font-mono text-xs font-black text-slate-900">{latestReceipt.receiptId}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy('receiptRoot')}</p>
                    <p className="mt-1 break-all font-mono text-[10px] font-bold text-slate-700">{latestReceipt.receiptRoot}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <SignalRow label={copy('receiptPersonalPayloadExcluded')} value={!latestReceipt.privacy.containsRawGuestAddress} />
                    <SignalRow label={copy('receiptRawAgidExcluded')} value={!latestReceipt.privacy.containsRawAgid} />
                    <SignalRow label={copy('receiptRawAoidExcluded')} value={!latestReceipt.privacy.containsRawAoid} />
                    <SignalRow label={copy('receiptContactAllocationExcluded')} value={!latestReceipt.privacy.containsPhoneNumber && !latestReceipt.privacy.containsRoomNumber} />
                  </div>
                </div>
              ) : (
                <p className="rounded-md bg-slate-50 px-3 py-4 text-sm font-bold text-slate-500">{copy('noReceipt')}</p>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{copy('paymentReceipt')}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy('receiptRecipientAlias')}</span>
                  <input
                    value={receiptRecipientAlias}
                    onChange={event => setReceiptRecipientAlias(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy('currency')}</span>
                  <input
                    value={receiptCurrency}
                    onChange={event => setReceiptCurrency(event.target.value.toUpperCase())}
                    className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy('amount')}</span>
                  <input
                    value={receiptAmount}
                    onChange={event => setReceiptAmount(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy('taxAmount')}</span>
                  <input
                    value={receiptTaxAmount}
                    onChange={event => setReceiptTaxAmount(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy('paymentMethod')}</span>
                  <input
                    value={paymentMethod}
                    onChange={event => setPaymentMethod(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy('paymentAlias')}</span>
                  <input
                    value={paymentAlias}
                    onChange={event => setPaymentAlias(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              {taxSummary && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">{copy('paidTaxes')}</p>
                      <p className="mt-1 text-2xl font-black tracking-tight text-amber-950">{taxSummary.taxPaidFormatted}</p>
                    </div>
                    <StatusBadge
                      label={`${copy('taxStatus')}: ${taxSummary.status}`}
                      tone={taxSummary.status === 'paid' ? 'ok' : taxSummary.status === 'needs-review' ? 'warn' : 'neutral'}
                    />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-md bg-white/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy('amount')}</p>
                      <p className="mt-1 text-xs font-black text-slate-800">{taxSummary.grossAmountFormatted}</p>
                    </div>
                    <div className="rounded-md bg-white/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy('taxableBasis')}</p>
                      <p className="mt-1 text-xs font-black text-slate-800">{taxSummary.taxableBasisFormatted}</p>
                    </div>
                    <div className="rounded-md bg-white/80 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{copy('effectiveTaxRate')}</p>
                      <p className="mt-1 text-xs font-black text-slate-800">{taxSummary.effectiveTaxRateFormatted}</p>
                    </div>
                  </div>
                  {taxSummary.warnings.length > 0 && (
                    <div className="mt-3 rounded-md border border-amber-300 bg-white/70 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">{copy('warnings')}</p>
                      {taxSummary.warnings.slice(0, 3).map(warning => (
                        <p key={warning} className="mt-1 text-[11px] font-bold text-amber-900">{warning}</p>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-[11px] font-bold leading-5 text-amber-900">{copy('taxLedgerNote')}</p>
                </div>
              )}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={printCheckInReceipt}
                  disabled={!latestReceipt}
                  className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <Printer className="h-4 w-4" />
                  {copy('printReceipt')}
                </button>
                <button
                  type="button"
                  onClick={printPaymentReceipt}
                  disabled={!latestReceipt}
                  className="flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <ReceiptText className="h-4 w-4" />
                  {copy('printPaymentReceipt')}
                </button>
              </div>
              <p className="mt-3 rounded-md bg-sky-50 px-3 py-2 text-[11px] font-bold leading-5 text-sky-900">
                {appLanguage.startsWith('ja')
                  ? '領収証はalias・金額・receipt rootのみを印刷します。個人情報や宿泊割当情報は入れないでください。'
                  : 'Payment receipts print aliases, amount, and receipt root only. Do not enter personal identity, contact, or allocation details.'}
              </p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Recent</h2>
              </div>
              <div className="space-y-2">
                {requests.slice(0, 4).map(request => (
                  <div key={request.requestId} className="rounded-md bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-black text-slate-700">{request.bookingAlias || request.property.propertyAlias}</p>
                      <StatusBadge label={request.status} tone={request.status === 'completed' ? 'ok' : request.status === 'expired' ? 'danger' : request.status === 'requires_review' ? 'warn' : 'neutral'} />
                    </div>
                    <p className="mt-1 break-all font-mono text-[10px] font-bold text-slate-500">{request.requestId}</p>
                  </div>
                ))}
                {requests.length === 0 && (
                  <div className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center">
                    <AlertTriangle className="mx-auto h-4 w-4 text-slate-400" />
                    <p className="mt-2 text-xs font-bold text-slate-500">{copy('noRequest')}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start gap-2">
                <History className="h-5 w-5 text-slate-700" />
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{copy('auditLog')}</h2>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{copy('auditLogBody')}</p>
                </div>
              </div>
              <div className="space-y-2">
                {auditLog.slice(0, 6).map(event => (
                  <div key={event.eventId} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{copy('auditEvent')}: {event.action}</p>
                      <span className="text-[10px] font-bold text-slate-400">{formatTime(event.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs font-black text-slate-800">{event.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black text-slate-500">
                      <span className="rounded bg-white px-2 py-1">actor {event.actorAlias}</span>
                      {event.requestId && <span className="rounded bg-white px-2 py-1">request {event.requestId}</span>}
                      {event.receiptId && <span className="rounded bg-white px-2 py-1">receipt {event.receiptId}</span>}
                    </div>
                  </div>
                ))}
                {auditLog.length === 0 && (
                  <div className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center">
                    <History className="mx-auto h-4 w-4 text-slate-400" />
                    <p className="mt-2 text-xs font-bold text-slate-500">{copy('auditLogBody')}</p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};
