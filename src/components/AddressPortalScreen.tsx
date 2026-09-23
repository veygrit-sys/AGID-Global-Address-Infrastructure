import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  EyeOff,
  FileCheck2,
  Filter,
  Fingerprint,
  HeartHandshake,
  KeyRound,
  Link2,
  LockKeyhole,
  RotateCcw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Trash2,
  Truck,
  UserRound,
  XCircle,
} from 'lucide-react';
import React from 'react';

import { ADDRESS_LINK_SCOPES, type AddressLinkScope } from '../lib/addressLink';
import {
  buildAddressPortalActionReceipt,
  buildAddressPortalPermissionTimeline,
  buildAddressPortalSafeExport,
  buildAddressPortalSnapshot,
  narrowAddressPortalConnectionScopes,
  revokeAddressPortalConnection,
  validateAddressPortalPayloadIsSafe,
  type AddressPortalActionReceipt,
  type AddressPortalConnection,
  type AddressPortalConnectionInput,
  type AddressPortalPermissionTimelineEntry,
} from '../lib/addressPortal';
import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import { cn } from '../lib/utils';

type PortalCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'active'
  | 'needsReview'
  | 'revokedOrExpired'
  | 'totalConnections'
  | 'connections'
  | 'privacyBoundary'
  | 'privacyBody'
  | 'permittedScopes'
  | 'dataCategories'
  | 'lastVerified'
  | 'lastAccessed'
  | 'credential'
  | 'revoke'
  | 'deleteData'
  | 'refresh'
  | 'auditLog'
  | 'noConnections'
  | 'exportSafeList'
  | 'search'
  | 'all'
  | 'detail'
  | 'scopeControl'
  | 'reduceToMinimum'
  | 'requestDeletion'
  | 'safeExport'
  | 'privacyStatus'
  | 'nextAction'
  | 'issuer'
  | 'purpose'
  | 'status'
  | 'language'
  | 'copyExport'
  | 'mode'
  | 'standardMode'
  | 'highRiskMode'
  | 'highRiskBody'
  | 'connectionPolicy'
  | 'dataRelease'
  | 'blocked'
  | 'allowed'
  | 'localOnly'
  | 'ethereumOptional'
  | 'noRawAddress'
  | 'proofReceipts'
  | 'latestReceipt'
  | 'receiptId'
  | 'scopeHash'
  | 'consentEnvelope'
  | 'retention'
  | 'consentStatus'
  | 'granted'
  | 'needsSignature'
  | 'removeScope'
  | 'notGranted'
  | 'keptOnDevice'
  | 'addressItems'
  | 'addressItemListBody'
  | 'addressItemId'
  | 'itemRoot'
  | 'connectionSafety'
  | 'safetySafe'
  | 'safetyCaution'
  | 'safetyUnsafe'
  | 'safetySignals'
  | 'trustedIssuer'
  | 'credentialPresent'
  | 'leastPrivilege'
  | 'revocationReady'
  | 'freshConnection'
  | 'highRiskCompatible'
  | 'deleteAll'
  | 'scopeReductionHint'
  | 'permissionTimeline'
  | 'timelineBody'
  | 'timelineEmpty'
  | 'permissionGranted'
  | 'permissionUsed'
  | 'permissionVerified'
  | 'permissionExpires'
  | 'permissionRevoked'
  | 'revokeFromTimeline'
  | 'professionalCollaboration'
  | 'professionalCollaborationBody'
  | 'carrierOps'
  | 'carrierOpsBody'
  | 'carrierOpsAction'
  | 'frontDeskPos'
  | 'frontDeskPosBody'
  | 'frontDeskPosAction'
  | 'municipalAid'
  | 'municipalAidBody'
  | 'municipalAidAction'
  | 'securityLegal'
  | 'securityLegalBody'
  | 'securityLegalAction'
  | 'developerOps'
  | 'developerOpsBody'
  | 'developerOpsAction'
  | 'focusRole'
  | 'matchedItems'
  | 'riskItems'
  | 'commandCenter'
  | 'commandBody'
  | 'selectedConnection'
  | 'safeRefs'
  | 'localWallet'
  | 'reviewQueue'
  | 'privateExport'
  | 'safeToShare'
  | 'openInspector'
  | 'portalOverview'
  | 'activePermissions'
  | 'riskModeLabel'
  | 'myPage'
  | 'myPageSubtitle'
  | 'actionInbox'
  | 'walletHealth'
  | 'quickActions'
  | 'pendingApprovals'
  | 'credentialAlerts'
  | 'credentialStatus'
  | 'securityReview'
  | 'reviewPermissions'
  | 'safeExportAction'
  | 'openSettings'
  | 'friendsSection'
  | 'friendsSectionBody'
  | 'recipientSafeRefs';

type PortalFilter = 'all' | 'active' | 'review' | 'revoked';
type PortalProfessionRole = 'carrierOps' | 'frontDeskPos' | 'municipalAid' | 'securityLegal' | 'developerOps';
type ConnectionSafetyLevel = 'safe' | 'caution' | 'unsafe';

type ConnectionSafetySignal = {
  key: PortalCopyKey;
  passed: boolean;
};

type ConnectionSafety = {
  level: ConnectionSafetyLevel;
  labelKey: PortalCopyKey;
  signals: ConnectionSafetySignal[];
};

type PortalProfessionReview = {
  id: PortalProfessionRole;
  titleKey: PortalCopyKey;
  bodyKey: PortalCopyKey;
  actionKey: PortalCopyKey;
  icon: React.ComponentType<{ className?: string }>;
  focusQuery: string;
  focusFilter: PortalFilter;
  matchedCount: number;
  riskCount: number;
  safeCount: number;
};

const PORTAL_COPY: Record<'en' | 'ja', Record<PortalCopyKey, string>> = {
  en: {
    returnToMap: 'Return to AGID map',
    subtitle: 'Manage address connections, permissions, revocation, deletion, and export.',
    active: 'Active',
    needsReview: 'Needs review',
    revokedOrExpired: 'Revoked / expired',
    totalConnections: 'Total connections',
    connections: 'Connections',
    privacyBoundary: 'Privacy boundary',
    privacyBody: 'This portal shows organizations, scopes, status, and safe credential references only. It does not display raw addresses, raw AGID, raw AOID, phone numbers, or recipient names.',
    permittedScopes: 'Permitted scopes',
    dataCategories: 'Data categories',
    lastVerified: 'Last verified',
    lastAccessed: 'Last accessed',
    credential: 'Credential ref',
    revoke: 'Revoke access',
    deleteData: 'Delete local item',
    refresh: 'Reset demo',
    auditLog: 'Audit log',
    noConnections: 'No portal items match this filter',
    exportSafeList: 'Export safe list',
    search: 'Search participant, purpose, scope',
    all: 'All',
    detail: 'Connection detail',
    scopeControl: 'Scope control',
    reduceToMinimum: 'Reduce to minimum',
    requestDeletion: 'Request deletion',
    safeExport: 'Safe export',
    privacyStatus: 'Privacy status',
    nextAction: 'Next action',
    issuer: 'Issuer',
    purpose: 'Purpose',
    status: 'Status',
    language: 'Language',
    copyExport: 'Copy export',
    mode: 'Mode',
    standardMode: 'Standard',
    highRiskMode: 'High-risk',
    highRiskBody: 'Use short-lived, coarse, local-first references for vulnerable users, disaster response, and sensitive handoffs.',
    connectionPolicy: 'Connection policy',
    dataRelease: 'Data release',
    blocked: 'Blocked',
    allowed: 'Allowed',
    localOnly: 'Local only',
    ethereumOptional: 'Ethereum optional',
    noRawAddress: 'No raw address',
    proofReceipts: 'Proof receipts',
    latestReceipt: 'Latest receipt',
    receiptId: 'Receipt ID',
    scopeHash: 'Scope hash',
    consentEnvelope: 'Consent envelope',
    retention: 'Retention',
    consentStatus: 'Consent status',
    granted: 'Granted',
    needsSignature: 'Needs signature',
    removeScope: 'Remove scope',
    notGranted: 'Not granted',
    keptOnDevice: 'Kept on this device',
    addressItems: 'Address Items',
    addressItemListBody: 'Connections are shown as Address Item references: participant, scopes, status, roots, and safe fingerprints only.',
    addressItemId: 'Address Item ID',
    itemRoot: 'Item root',
    connectionSafety: 'Connection safety',
    safetySafe: 'Safe',
    safetyCaution: 'Caution',
    safetyUnsafe: 'Unsafe',
    safetySignals: 'Safety signals',
    trustedIssuer: 'Issuer present',
    credentialPresent: 'Credential fingerprint',
    leastPrivilege: 'Least privilege',
    revocationReady: 'Revocation ready',
    freshConnection: 'Recently verified',
    highRiskCompatible: 'High-risk compatible',
    deleteAll: 'Delete all local items',
    scopeReductionHint: 'Permission changes are one-way reductions here. New scopes require a new Address Link consent.',
    permissionTimeline: 'Permission timeline',
    timelineBody: 'See which organization can use which scopes, when it was last used, and revoke access from the same row.',
    timelineEmpty: 'No permission timeline entries yet.',
    permissionGranted: 'Permission granted',
    permissionUsed: 'Permission used',
    permissionVerified: 'Permission verified',
    permissionExpires: 'Permission expires',
    permissionRevoked: 'Permission revoked',
    revokeFromTimeline: 'Revoke',
    professionalCollaboration: 'Professional collaboration',
    professionalCollaborationBody: 'Switch the portal into the view each team needs without exposing raw address material.',
    carrierOps: 'Carrier operations',
    carrierOpsBody: 'Handoff, delivery eligibility, return labels, and recipient proof.',
    carrierOpsAction: 'Review carrier permissions',
    frontDeskPos: 'Hotel / POS',
    frontDeskPosBody: 'Front desk, checkout, CMS, and merchant connections.',
    frontDeskPosAction: 'Focus checkout access',
    municipalAid: 'Municipality / NGO',
    municipalAidBody: 'Aid delivery, coarse region use, and vulnerable-user handoffs.',
    municipalAidAction: 'Check aid-safe scopes',
    securityLegal: 'Security / Legal',
    securityLegalBody: 'Revocation, deletion, consent receipts, and review queues.',
    securityLegalAction: 'Open review queue',
    developerOps: 'Developer / Ops',
    developerOpsBody: 'Safe export, integration posture, storage fallback, and audit readiness.',
    developerOpsAction: 'Inspect all refs',
    focusRole: 'Focus role',
    matchedItems: 'Matched items',
    riskItems: 'Needs review',
    commandCenter: 'Command center',
    commandBody: 'Review who can use address references, shrink scopes, revoke access, and export safe receipts without exposing private address text.',
    selectedConnection: 'Selected connection',
    safeRefs: 'Safe refs only',
    localWallet: 'Local wallet',
    reviewQueue: 'Review queue',
    privateExport: 'Private export',
    safeToShare: 'Safe to share',
    openInspector: 'Open inspector',
    portalOverview: 'Portal overview',
    activePermissions: 'Active permissions',
    riskModeLabel: 'Risk mode',
    myPage: 'My Page',
    myPageSubtitle: 'Your wallet profile for credentials, permissions, consent, security status, and safe exports.',
    actionInbox: 'Action inbox',
    walletHealth: 'Wallet health',
    quickActions: 'Quick actions',
    pendingApprovals: 'Pending approvals',
    credentialAlerts: 'Credential alerts',
    credentialStatus: 'Credential status',
    securityReview: 'Security review',
    reviewPermissions: 'Review permissions',
    safeExportAction: 'Safe export',
    openSettings: 'Open settings',
    friendsSection: 'Friends',
    friendsSectionBody: 'Recipient-safe aliases for family, friends, and gift delivery. No recipient name or raw address is displayed.',
    recipientSafeRefs: 'Recipient-safe refs',
  },
  ja: {
    returnToMap: 'AGIDマップへ戻る',
    subtitle: '住所接続、許可、失効、削除、exportを管理します。',
    active: '有効',
    needsReview: '要確認',
    revokedOrExpired: '失効 / 期限切れ',
    totalConnections: '接続数',
    connections: '接続',
    privacyBoundary: 'プライバシー境界',
    privacyBody: 'このPortalは組織、scope、状態、安全なcredential参照だけを表示します。実住所、AGID本体、AOID本体、電話番号、受取人名は表示しません。',
    permittedScopes: '許可scope',
    dataCategories: 'データ種別',
    lastVerified: '最終確認',
    lastAccessed: '最終アクセス',
    credential: 'Credential参照',
    revoke: '許可を取り消す',
    deleteData: 'ローカル項目を削除',
    refresh: 'デモ初期化',
    auditLog: '監査ログ',
    noConnections: '条件に一致するPortal項目はありません',
    exportSafeList: '安全リスト出力',
    search: '参加者・用途・scopeを検索',
    all: 'すべて',
    detail: '接続詳細',
    scopeControl: 'Scope制御',
    reduceToMinimum: '最小scopeへ削減',
    requestDeletion: '削除要求',
    safeExport: '安全export',
    privacyStatus: 'プライバシー状態',
    nextAction: '次の操作',
    issuer: 'Issuer',
    purpose: '用途',
    status: '状態',
    language: '言語',
    copyExport: 'Exportをコピー',
    mode: 'モード',
    standardMode: '通常',
    highRiskMode: '高リスク',
    highRiskBody: '被災・避難・支援・センシティブな受け渡しでは、短期・粗い粒度・local-firstの参照だけを使います。',
    connectionPolicy: '接続ポリシー',
    dataRelease: 'データ開示',
    blocked: 'ブロック',
    allowed: '許可',
    localOnly: 'ローカルのみ',
    ethereumOptional: 'Ethereum任意',
    noRawAddress: '実住所なし',
    proofReceipts: '証明receipt',
    latestReceipt: '最新receipt',
    receiptId: 'Receipt ID',
    scopeHash: 'Scope hash',
    consentEnvelope: '同意封筒',
    retention: '保持',
    consentStatus: '同意状態',
    granted: '許可中',
    needsSignature: '署名・再確認が必要',
    removeScope: 'scopeを外す',
    notGranted: '未許可',
    keptOnDevice: 'この端末に保持',
    addressItems: 'Address Item一覧',
    addressItemListBody: '接続はAddress Item参照として表示します。事業者、scope、状態、root、安全なfingerprintだけを扱います。',
    addressItemId: 'Address Item ID',
    itemRoot: 'Item root',
    connectionSafety: '接続先の安全性',
    safetySafe: '安全',
    safetyCaution: '注意',
    safetyUnsafe: '危険',
    safetySignals: '安全性の根拠',
    trustedIssuer: 'Issuerあり',
    credentialPresent: 'Credential fingerprintあり',
    leastPrivilege: '最小権限',
    revocationReady: '取消可能',
    freshConnection: '最近検証済み',
    highRiskCompatible: '高リスク対応',
    deleteAll: 'ローカル項目を全削除',
    scopeReductionHint: 'ここでの権限変更は縮小だけです。新しいscopeを増やすには、Address Linkで再同意が必要です。',
    permissionTimeline: '許可タイムライン',
    timelineBody: 'どの事業者がどのscopeを使えるか、いつ使われたかを確認し、同じ行から取消できます。',
    timelineEmpty: '許可タイムラインはまだありません。',
    permissionGranted: '許可',
    permissionUsed: '利用',
    permissionVerified: '検証',
    permissionExpires: '期限',
    permissionRevoked: '取消済み',
    revokeFromTimeline: '取消',
    professionalCollaboration: '職種別連携',
    professionalCollaborationBody: '実住所を出さずに、各チームが必要な確認だけへ切り替えます。',
    carrierOps: '配送・キャリア',
    carrierOpsBody: '受け渡し、配送可否、返品ラベル、受取人確認を見ます。',
    carrierOpsAction: '配送権限を確認',
    frontDeskPos: 'ホテル / POS',
    frontDeskPosBody: 'フロント、会計、CMS、店舗接続を確認します。',
    frontDeskPosAction: '会計接続に集中',
    municipalAid: '自治体 / NGO',
    municipalAidBody: '支援配送、粗い地域参照、要配慮者の受け渡しを確認します。',
    municipalAidAction: '支援向けscope確認',
    securityLegal: 'セキュリティ / 法務',
    securityLegalBody: '取消、削除、同意receipt、要確認queueを確認します。',
    securityLegalAction: '要確認queueを開く',
    developerOps: '開発 / 運用',
    developerOpsBody: '安全export、連携姿勢、保存fallback、監査準備を見ます。',
    developerOpsAction: '全参照を点検',
    focusRole: '職種で絞り込み',
    matchedItems: '対象項目',
    riskItems: '要確認',
    commandCenter: 'コマンドセンター',
    commandBody: '実住所を出さずに、誰が住所参照を使えるかを確認し、scope縮小、取消、安全なreceipt出力を行います。',
    selectedConnection: '選択中の接続',
    safeRefs: '安全参照のみ',
    localWallet: 'ローカルWallet',
    reviewQueue: '確認キュー',
    privateExport: '非公開export',
    safeToShare: '共有可能',
    openInspector: 'インスペクタを開く',
    portalOverview: 'Portal概要',
    activePermissions: '有効な許可',
    riskModeLabel: 'リスクモード',
    myPage: 'マイページ',
    myPageSubtitle: 'Credential、許可、同意、安全状態、安全exportを管理するWalletプロフィール。',
    actionInbox: '対応ボックス',
    walletHealth: 'Wallet状態',
    quickActions: 'クイック操作',
    pendingApprovals: '承認待ち',
    credentialAlerts: 'Credential通知',
    credentialStatus: 'Credential状態',
    securityReview: 'セキュリティ確認',
    reviewPermissions: '許可を確認',
    safeExportAction: '安全export',
    openSettings: '設定を開く',
    friendsSection: '友達',
    friendsSectionBody: '家族、友達、ギフト配送向けの受取人安全alias。受取人名や実住所は表示しません。',
    recipientSafeRefs: '受取人安全参照',
  },
};

const PORTAL_CONNECTIONS_STORAGE_KEY = 'agid-address-portal-connections-v1';
const PORTAL_HIGH_RISK_STORAGE_KEY = 'agid-address-portal-high-risk-v1';

const SEED_CONNECTIONS: AddressPortalConnectionInput[] = [
  {
    connectionId: 'apc-pos-market',
    participantName: 'North Star Market',
    participantType: 'merchant',
    purpose: 'delivery',
    issuerId: 'issuer-market',
    credentialRef: { type: 'commitment', ref: 'cred-cmt-market-001' },
    scopes: ['delivery:eligible', 'region:coarse', 'address:quality'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:02:00.000Z',
    lastAccessedAt: '2026-06-17T00:12:00.000Z',
    dataCategories: ['delivery eligibility', 'coarse region', 'address quality'],
  },
  {
    connectionId: 'apc-carrier-alpha',
    participantName: 'Carrier Alpha',
    participantType: 'carrier',
    purpose: 'handoff',
    issuerId: 'issuer-carrier-alpha',
    credentialRef: { type: 'server-ref', ref: 'carrier-ref-001' },
    scopes: ['delivery:eligible', 'recipient:verify', 'return:label'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:04:00.000Z',
    lastAccessedAt: '2026-06-17T00:14:00.000Z',
    dataCategories: ['delivery eligibility', 'recipient proof', 'return label'],
  },
  {
    connectionId: 'apc-friend-gift-alias',
    participantName: 'Friend Gift Alias',
    participantType: 'shopping-agent',
    purpose: 'gift',
    issuerId: 'issuer-friend-alias',
    credentialRef: { type: 'commitment', ref: 'friend-alias-cmt-001', fingerprint: 'friend-alias-fp-001' },
    scopes: ['recipient:verify', 'region:coarse'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:08:00.000Z',
    lastAccessedAt: '2026-06-17T00:18:00.000Z',
    dataCategories: ['recipient proof', 'coarse region only', 'gift alias'],
  },
  {
    connectionId: 'apc-field-aid',
    participantName: 'Field Aid NGO',
    participantType: 'ngo',
    purpose: 'aid',
    issuerId: 'issuer-ngo-field-aid',
    credentialRef: { type: 'zk-ref', ref: 'aid-zk-credential-ref-001' },
    scopes: ['region:coarse'],
    revocationState: 'stale',
    lastAccessedAt: '2026-06-16T23:55:00.000Z',
    dataCategories: ['coarse region only'],
  },
  {
    connectionId: 'apc-city-office',
    participantName: 'City Relief Office',
    participantType: 'municipality',
    purpose: 'aid',
    issuerId: 'issuer-city-relief',
    credentialRef: { type: 'vc-ref', ref: 'city-relief-vc-ref-041' },
    scopes: ['region:coarse', 'address:quality'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-16T23:44:00.000Z',
    lastAccessedAt: '2026-06-17T00:06:00.000Z',
    expiresAt: '2026-06-17T00:30:00.000Z',
    dataCategories: ['coarse region', 'address quality'],
  },
  {
    connectionId: 'apc-cms-storefront',
    participantName: 'Storefront CMS',
    participantType: 'cms',
    purpose: 'checkout',
    issuerId: 'issuer-storefront-cms',
    scopes: ['delivery:eligible'],
    revocationState: 'not_checked',
    lastAccessedAt: '2026-06-15T22:05:00.000Z',
    dataCategories: ['delivery eligibility'],
  },
];

function readStoredLanguage() {
  try {
    return normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || 'ja');
  } catch {
    return 'ja';
  }
}

function readStoredConnections() {
  try {
    const raw = localStorage.getItem(PORTAL_CONNECTIONS_STORAGE_KEY);
    if (!raw) return SEED_CONNECTIONS;
    const parsed = JSON.parse(raw) as unknown;
    const safety = validateAddressPortalPayloadIsSafe(parsed);
    if (!safety.safe || !Array.isArray(parsed)) return SEED_CONNECTIONS;
    return parsed as AddressPortalConnectionInput[];
  } catch {
    return SEED_CONNECTIONS;
  }
}

function readStoredHighRiskMode() {
  try {
    return localStorage.getItem(PORTAL_HIGH_RISK_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function translate(language: string, key: PortalCopyKey) {
  return PORTAL_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function returnToMap() {
  window.location.href = '/';
}

function participantIcon(type: AddressPortalConnection['participantType']) {
  if (type === 'carrier') return Truck;
  if (type === 'ngo') return HeartHandshake;
  if (type === 'municipality') return Building2;
  if (type === 'shopping-agent') return ShoppingCart;
  return Store;
}

function statusTone(status: AddressPortalConnection['item']['status']) {
  if (status === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'requires_reverification' || status === 'requires_credential') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'revoked' || status === 'expired' || status === 'suspended') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

function statusIcon(status: AddressPortalConnection['item']['status']) {
  if (status === 'active') return CheckCircle2;
  if (status === 'requires_reverification' || status === 'requires_credential') return Clock3;
  return XCircle;
}

function formatTime(value: string | null | undefined) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function inputFromConnection(connection: AddressPortalConnection): AddressPortalConnectionInput {
  return {
    connectionId: connection.connectionId,
    participantName: connection.participantName,
    participantType: connection.participantType,
    purpose: connection.purpose,
    issuerId: connection.item.issuerId ?? undefined,
    credentialRef: connection.item.credentialRef ?? undefined,
    scopes: connection.item.scopes,
    revocationState: connection.item.revocationState,
    lastVerifiedAt: connection.item.lastVerifiedAt ?? undefined,
    createdAt: connection.item.createdAt,
    expiresAt: connection.item.expiresAt,
    lastAccessedAt: connection.lastAccessedAt ?? undefined,
    dataCategories: connection.dataCategories,
  };
}

function minimumScopes(scopes: AddressLinkScope[]) {
  if (scopes.includes('region:coarse')) return ['region:coarse'] satisfies AddressLinkScope[];
  if (scopes.includes('delivery:eligible')) return ['delivery:eligible'] satisfies AddressLinkScope[];
  return scopes.slice(0, 1);
}

function consentStatus(connection: AddressPortalConnection) {
  if (connection.item.status === 'active') return 'granted';
  if (connection.item.status === 'requires_reverification' || connection.item.status === 'requires_credential') return 'needs-signature';
  return 'revoked-or-expired';
}

function buildConnectionSafety(connection: AddressPortalConnection, highRiskMode: boolean): ConnectionSafety {
  const hasTrustedIssuer = Boolean(connection.item.issuerId);
  const hasCredentialFingerprint = Boolean(connection.item.credentialRef?.fingerprint);
  const canRevoke = connection.allowedActions.includes('revoke') || connection.item.revocationState === 'revoked';
  const leastPrivilege = connection.item.scopes.length <= (highRiskMode ? 2 : 3);
  const freshConnection = connection.item.status === 'active'
    && connection.item.revocationState === 'active'
    && Boolean(connection.item.lastVerifiedAt);
  const highRiskCompatible = !highRiskMode
    || (
      connection.item.status === 'active'
      && connection.item.scopes.includes('region:coarse')
      && leastPrivilege
      && canRevoke
    );
  const signals: ConnectionSafetySignal[] = [
    { key: 'trustedIssuer', passed: hasTrustedIssuer },
    { key: 'credentialPresent', passed: hasCredentialFingerprint },
    { key: 'leastPrivilege', passed: leastPrivilege },
    { key: 'revocationReady', passed: canRevoke },
    { key: 'freshConnection', passed: freshConnection },
    { key: 'highRiskCompatible', passed: highRiskCompatible },
  ];
  const terminalRisk = ['revoked', 'expired', 'suspended', 'error'].includes(connection.item.status);
  const recipientProofRisk = connection.item.scopes.includes('recipient:verify') && !hasCredentialFingerprint;
  const failedSignals = signals.filter(signal => !signal.passed).length;
  const level: ConnectionSafetyLevel = terminalRisk || recipientProofRisk
    ? 'unsafe'
    : failedSignals > 0
      ? 'caution'
      : 'safe';

  return {
    level,
    labelKey: level === 'safe' ? 'safetySafe' : level === 'caution' ? 'safetyCaution' : 'safetyUnsafe',
    signals,
  };
}

function safetyTone(level: ConnectionSafetyLevel) {
  if (level === 'safe') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (level === 'caution') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-rose-200 bg-rose-50 text-rose-800';
}

function safetyIcon(level: ConnectionSafetyLevel) {
  if (level === 'safe') return ShieldCheck;
  if (level === 'caution') return AlertTriangle;
  return ShieldAlert;
}

function buildProfessionReviews(
  connections: AddressPortalConnection[],
  highRiskMode: boolean,
): PortalProfessionReview[] {
  const definitions: Array<{
    id: PortalProfessionRole;
    titleKey: PortalCopyKey;
    bodyKey: PortalCopyKey;
    actionKey: PortalCopyKey;
    icon: React.ComponentType<{ className?: string }>;
    focusQuery: string;
    focusFilter: PortalFilter;
    matches: (connection: AddressPortalConnection, safety: ConnectionSafety) => boolean;
  }> = [
    {
      id: 'carrierOps',
      titleKey: 'carrierOps',
      bodyKey: 'carrierOpsBody',
      actionKey: 'carrierOpsAction',
      icon: Truck,
      focusQuery: 'carrier',
      focusFilter: 'all',
      matches: connection => connection.participantType === 'carrier',
    },
    {
      id: 'frontDeskPos',
      titleKey: 'frontDeskPos',
      bodyKey: 'frontDeskPosBody',
      actionKey: 'frontDeskPosAction',
      icon: Store,
      focusQuery: 'merchant',
      focusFilter: 'all',
      matches: connection => ['merchant', 'cms', 'shopping-agent'].includes(connection.participantType),
    },
    {
      id: 'municipalAid',
      titleKey: 'municipalAid',
      bodyKey: 'municipalAidBody',
      actionKey: 'municipalAidAction',
      icon: HeartHandshake,
      focusQuery: 'aid',
      focusFilter: 'all',
      matches: connection => connection.participantType === 'ngo' || connection.participantType === 'municipality',
    },
    {
      id: 'securityLegal',
      titleKey: 'securityLegal',
      bodyKey: 'securityLegalBody',
      actionKey: 'securityLegalAction',
      icon: ShieldAlert,
      focusQuery: '',
      focusFilter: 'review',
      matches: (connection, safety) => safety.level !== 'safe' || connection.item.status !== 'active',
    },
    {
      id: 'developerOps',
      titleKey: 'developerOps',
      bodyKey: 'developerOpsBody',
      actionKey: 'developerOpsAction',
      icon: FileCheck2,
      focusQuery: '',
      focusFilter: 'all',
      matches: () => true,
    },
  ];

  return definitions.map(definition => {
    const matched = connections.filter(connection => definition.matches(
      connection,
      buildConnectionSafety(connection, highRiskMode),
    ));
    const riskCount = matched.filter(connection => {
      const safety = buildConnectionSafety(connection, highRiskMode);
      return safety.level !== 'safe' || connection.item.status !== 'active';
    }).length;

    return {
      id: definition.id,
      titleKey: definition.titleKey,
      bodyKey: definition.bodyKey,
      actionKey: definition.actionKey,
      icon: definition.icon,
      focusQuery: definition.focusQuery,
      focusFilter: definition.focusFilter,
      matchedCount: matched.length,
      riskCount,
      safeCount: Math.max(0, matched.length - riskCount),
    };
  });
}

function matchesFilter(connection: AddressPortalConnection, filter: PortalFilter) {
  if (filter === 'all') return true;
  if (filter === 'active') return connection.item.status === 'active';
  if (filter === 'review') {
    return connection.item.status === 'requires_reverification'
      || connection.item.status === 'requires_credential'
      || connection.item.status === 'error';
  }
  return connection.item.status === 'revoked'
    || connection.item.status === 'expired'
    || connection.item.status === 'suspended';
}

function timelineEventLabel(t: (key: PortalCopyKey) => string, event: AddressPortalPermissionTimelineEntry['event']) {
  if (event === 'permission_granted') return t('permissionGranted');
  if (event === 'permission_used') return t('permissionUsed');
  if (event === 'permission_verified') return t('permissionVerified');
  if (event === 'permission_expires') return t('permissionExpires');
  return t('permissionRevoked');
}

function timelineEventTone(event: AddressPortalPermissionTimelineEntry['event']) {
  if (event === 'permission_used') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (event === 'permission_verified') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (event === 'permission_expires') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (event === 'permission_revoked') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-slate-200 bg-slate-50 text-slate-800';
}

export const AddressPortalScreen: React.FC = () => {
  const [appLanguage, setAppLanguage] = React.useState(readStoredLanguage);
  const [connections, setConnections] = React.useState<AddressPortalConnectionInput[]>(readStoredConnections);
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<string>(SEED_CONNECTIONS[0]?.connectionId as string);
  const [filter, setFilter] = React.useState<PortalFilter>('all');
  const [query, setQuery] = React.useState('');
  const [auditLog, setAuditLog] = React.useState<string[]>([
    'Portal opened with safe refs only.',
  ]);
  const [highRiskMode, setHighRiskMode] = React.useState(readStoredHighRiskMode);
  const [receipts, setReceipts] = React.useState<AddressPortalActionReceipt[]>([]);
  const [safeExportText, setSafeExportText] = React.useState('');
  const snapshot = React.useMemo(() => buildAddressPortalSnapshot(connections), [connections]);
  const safeExport = React.useMemo(() => buildAddressPortalSafeExport(snapshot), [snapshot]);
  const permissionTimeline = React.useMemo(() => buildAddressPortalPermissionTimeline(snapshot), [snapshot]);
  const exportSafety = React.useMemo(() => validateAddressPortalPayloadIsSafe(safeExport), [safeExport]);
  const professionReviews = React.useMemo(
    () => buildProfessionReviews(snapshot.connections, highRiskMode),
    [snapshot.connections, highRiskMode],
  );
  const t = React.useCallback((key: PortalCopyKey) => translate(appLanguage, key), [appLanguage]);
  const friendsSectionRef = React.useRef<HTMLElement | null>(null);
  const friendConnections = React.useMemo(
    () => snapshot.connections.filter(connection =>
      connection.participantType === 'shopping-agent'
      || connection.purpose === 'gift'
      || connection.dataCategories.some(category => category.toLowerCase().includes('gift alias')),
    ),
    [snapshot.connections],
  );

  React.useEffect(() => {
    if (window.location.hash !== '#friends') return;
    setFilter('all');
    setQuery('recipient');
    if (friendConnections[0]) setSelectedConnectionId(friendConnections[0].connectionId);
    window.requestAnimationFrame(() => {
      friendsSectionRef.current?.scrollIntoView({ block: 'start' });
    });
    setAuditLog(prev => ['Friends opened with recipient-safe refs only.', ...prev]);
  }, [friendConnections]);

  React.useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = getLanguageDirection(appLanguage);
    try {
      localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage);
    } catch {
      // Local storage can be unavailable in private contexts.
    }
  }, [appLanguage]);

  React.useEffect(() => {
    try {
      const safety = validateAddressPortalPayloadIsSafe(connections);
      if (safety.safe) {
        localStorage.setItem(PORTAL_CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
      }
      localStorage.setItem(PORTAL_HIGH_RISK_STORAGE_KEY, String(highRiskMode));
    } catch {
      // The portal still works as an in-memory local-first view.
    }
  }, [connections, highRiskMode]);

  React.useEffect(() => {
    if (snapshot.connections.length === 0) {
      setSelectedConnectionId('');
      return;
    }
    if (!snapshot.connections.some(connection => connection.connectionId === selectedConnectionId)) {
      setSelectedConnectionId(snapshot.connections[0]?.connectionId ?? '');
    }
  }, [selectedConnectionId, snapshot.connections]);

  const filteredConnections = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return snapshot.connections.filter(connection => {
      const searchable = [
        connection.connectionId,
        connection.participantName,
        connection.participantType,
        connection.purpose,
        connection.item.issuerId ?? '',
        ...connection.item.scopes,
        ...connection.dataCategories,
      ].join(' ').toLowerCase();
      return matchesFilter(connection, filter) && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [filter, query, snapshot.connections]);

  const selectedConnection = snapshot.connections.find(connection => connection.connectionId === selectedConnectionId)
    ?? filteredConnections[0]
    ?? snapshot.connections[0];
  const selectedConnectionSafety = selectedConnection
    ? buildConnectionSafety(selectedConnection, highRiskMode)
    : null;

  React.useEffect(() => {
    if (filteredConnections.length === 0) return;
    if (!filteredConnections.some(connection => connection.connectionId === selectedConnectionId)) {
      setSelectedConnectionId(filteredConnections[0]?.connectionId ?? '');
    }
  }, [filteredConnections, selectedConnectionId]);

  const updateConnection = (connection: AddressPortalConnection) => {
    setConnections(prev => prev.map(input => input.connectionId === connection.connectionId ? inputFromConnection(connection) : input));
  };

  const recordReceipt = (connection: AddressPortalConnection, action: AddressPortalActionReceipt['action']) => {
    const receipt = buildAddressPortalActionReceipt(connection, action);
    setReceipts(prev => [receipt, ...prev].slice(0, 8));
    return receipt;
  };

  const revokeConnection = (connection: AddressPortalConnection) => {
    const receipt = recordReceipt(connection, 'revoke');
    const revoked = revokeAddressPortalConnection(connection);
    updateConnection(revoked);
    setAuditLog(prev => [`Revoked ${connection.participantName}; receipt ${receipt.receiptId}.`, ...prev]);
  };

  const reduceConnectionScopes = (connection: AddressPortalConnection) => {
    const receipt = recordReceipt(connection, 'reduce_scope');
    const reduced = narrowAddressPortalConnectionScopes(connection, minimumScopes(connection.item.scopes));
    updateConnection(reduced);
    setAuditLog(prev => [`Reduced scopes for ${connection.participantName}: ${reduced.item.scopes.join(', ') || 'none'}; receipt ${receipt.receiptId}.`, ...prev]);
  };

  const removeConnectionScope = (connection: AddressPortalConnection, scope: AddressLinkScope) => {
    if (!connection.item.scopes.includes(scope)) {
      setAuditLog(prev => [`${scope} was not granted for ${connection.participantName}; no change made.`, ...prev]);
      return;
    }
    if (connection.item.scopes.length <= 1) {
      setAuditLog(prev => [`Cannot remove the final scope from ${connection.participantName}; revoke or delete the connection instead.`, ...prev]);
      return;
    }
    const nextScopes = connection.item.scopes.filter(item => item !== scope);
    const receipt = recordReceipt(connection, 'reduce_scope');
    const reduced = narrowAddressPortalConnectionScopes(connection, nextScopes);
    updateConnection(reduced);
    setAuditLog(prev => [`Removed ${scope} from ${connection.participantName}; receipt ${receipt.receiptId}.`, ...prev]);
  };

  const deleteConnection = (connection: AddressPortalConnection) => {
    const receipt = recordReceipt(connection, 'delete_data');
    setConnections(prev => prev.filter(input => input.connectionId !== connection.connectionId));
    setAuditLog(prev => [`Deleted local portal item for ${connection.participantName}; receipt ${receipt.receiptId}.`, ...prev]);
  };

  const requestDeletion = (connection: AddressPortalConnection) => {
    const receipt = recordReceipt(connection, 'delete_data');
    setAuditLog(prev => [`Deletion request prepared for ${connection.participantName}; only ${connection.connectionId}, credential fingerprint, and receipt ${receipt.receiptId} will be sent.`, ...prev]);
  };

  const resetDemo = () => {
    setConnections(SEED_CONNECTIONS);
    setSelectedConnectionId(SEED_CONNECTIONS[0]?.connectionId as string);
    setSafeExportText('');
    setHighRiskMode(false);
    setReceipts([]);
    setAuditLog(['Portal refreshed with seed safe references.']);
  };

  const deleteAllLocalItems = () => {
    setConnections([]);
    setSelectedConnectionId('');
    setSafeExportText('');
    setReceipts([]);
    setAuditLog(['All local portal items deleted. Safe export history was cleared from this session.']);
    try {
      localStorage.removeItem(PORTAL_CONNECTIONS_STORAGE_KEY);
    } catch {
      // Local storage can be unavailable in private contexts.
    }
  };

  const exportSafeList = async () => {
    const serialized = JSON.stringify(safeExport, null, 2);
    setSafeExportText(serialized);
    if (selectedConnection) recordReceipt(selectedConnection, 'export');
    setAuditLog(prev => [`Exported safe connection list root ${snapshot.portalRoot.slice(0, 12)}.`, ...prev]);
    try {
      await navigator.clipboard?.writeText(serialized);
      setAuditLog(prev => ['Copied safe export to clipboard.', ...prev]);
    } catch {
      // Clipboard permission may be unavailable; the text remains visible.
    }
  };

  const focusProfessionReview = (review: PortalProfessionReview) => {
    setFilter(review.focusFilter);
    setQuery(review.focusQuery);
    setAuditLog(prev => [
      `${t('professionalCollaboration')}: ${t(review.titleKey)} / ${t('matchedItems')} ${review.matchedCount} / ${t('riskItems')} ${review.riskCount}.`,
      ...prev,
    ]);
  };

  const filterItems: Array<{ id: PortalFilter; label: string; count: number }> = [
    { id: 'all', label: t('all'), count: snapshot.counts.total },
    { id: 'active', label: t('active'), count: snapshot.counts.active },
    { id: 'review', label: t('needsReview'), count: snapshot.counts.needsReview },
    { id: 'revoked', label: t('revokedOrExpired'), count: snapshot.counts.revokedOrExpired },
  ];

  const myPageHealthItems = [
    { label: t('activePermissions'), value: snapshot.counts.active, tone: 'text-emerald-700' },
    { label: t('pendingApprovals'), value: snapshot.counts.needsReview, tone: 'text-amber-700' },
    { label: t('credentialAlerts'), value: snapshot.connections.filter(connection => connection.item.status === 'requires_credential').length, tone: 'text-blue-700' },
  ];

  const quickActions = [
    {
      label: t('credentialStatus'),
      icon: FileCheck2,
      action: () => {
        setFilter('all');
        setQuery('credential');
        setAuditLog(prev => [`${t('credentialStatus')}: ${t('safeRefs')}.`, ...prev]);
      },
    },
    {
      label: t('reviewPermissions'),
      icon: ShieldCheck,
      action: () => {
        setFilter('review');
        setQuery('');
        setAuditLog(prev => [`${t('reviewPermissions')}: ${snapshot.counts.needsReview}.`, ...prev]);
      },
    },
    {
      label: t('securityReview'),
      icon: LockKeyhole,
      action: () => {
        setHighRiskMode(true);
        setAuditLog(prev => [`${t('securityReview')}: ${t('highRiskMode')}.`, ...prev]);
      },
    },
    {
      label: t('safeExportAction'),
      icon: Download,
      action: exportSafeList,
    },
  ];

  return (
    <div className="agid-viewport-shell flex flex-col bg-[#eef3f8] text-slate-950">
      <header className="z-20 shrink-0 border-b border-slate-200/80 bg-white/95 px-3 py-3 shadow-sm shadow-slate-200/70 backdrop-blur sm:px-4 md:px-6">
        <div className="mx-auto grid max-w-[1480px] gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={returnToMap}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-900 hover:text-white active:scale-95"
              aria-label={t('returnToMap')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-900/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-black text-slate-950 md:text-2xl">{t('myPage')}</h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  {t('safeRefs')}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs font-bold text-slate-500">
                {t('myPageSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 lg:justify-end lg:overflow-visible lg:pb-0">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/settings';
              }}
              aria-label={t('openSettings')}
              title={t('openSettings')}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-950 hover:text-white active:scale-95"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">{t('openSettings')}</span>
            </button>
            <label className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-600">
              <span className="hidden uppercase tracking-widest sm:inline">{t('language')}</span>
              <select
                value={appLanguage}
                onChange={event => setAppLanguage(normalizeAppLanguage(event.target.value))}
                className="max-w-[180px] bg-transparent text-xs font-black text-slate-900 outline-none"
                aria-label={t('language')}
              >
                {APP_LANGUAGES.map(language => (
                  <option key={language.code} value={language.code}>
                    {language.flag} {language.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setHighRiskMode(prev => !prev);
                setAuditLog(prev => [
                  `${highRiskMode ? 'Standard' : 'High-risk'} portal mode enabled.`,
                  ...prev,
                ]);
              }}
              className={cn(
                'inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-black uppercase tracking-wider transition-all',
                highRiskMode
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-950 hover:text-white',
              )}
            >
              <ShieldAlert className="h-4 w-4" />
              {highRiskMode ? t('highRiskMode') : t('standardMode')}
            </button>
            <button
              type="button"
              onClick={resetDemo}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition-all hover:bg-slate-950 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              {t('refresh')}
            </button>
            <button
              type="button"
              onClick={deleteAllLocalItems}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-xs font-black uppercase tracking-wider text-rose-700 transition-all hover:bg-rose-600 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
              {t('deleteAll')}
            </button>
            <button
              type="button"
              onClick={exportSafeList}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              {t('exportSafeList')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-0 w-full max-w-[1480px] flex-1 gap-4 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_390px] xl:overflow-hidden xl:py-5 2xl:grid-cols-[320px_minmax(0,1fr)_400px]">
        <aside className="min-h-0 space-y-4 xl:overflow-y-auto xl:pr-1">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{t('actionInbox')}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{t('myPage')}</h2>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{t('myPageSubtitle')}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <UserRound className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {myPageHealthItems.map(item => (
                <div key={item.label} className="min-w-0 rounded-xl bg-slate-50 px-3 py-3">
                  <p className="truncate text-[9px] font-black uppercase tracking-wider text-slate-400">{item.label}</p>
                  <p className={cn('mt-2 text-2xl font-black', item.tone)}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t('quickActions')}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {quickActions.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      className="flex min-h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-black text-slate-800 transition-all hover:border-blue-200 hover:bg-blue-50"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-blue-600" />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            id="friends"
            ref={friendsSectionRef}
            className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{t('recipientSafeRefs')}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{t('friendsSection')}</h2>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{t('friendsSectionBody')}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <HeartHandshake className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {friendConnections.map(connection => (
                <button
                  key={connection.connectionId}
                  type="button"
                  onClick={() => {
                    setFilter('all');
                    setQuery('recipient');
                    setSelectedConnectionId(connection.connectionId);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-all hover:border-blue-200 hover:bg-blue-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black text-slate-900">{connection.participantName}</span>
                    <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-500">
                      {connection.purpose} / {connection.item.scopes.join(', ')}
                    </span>
                  </span>
                  <span className={cn('shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider', statusTone(connection.item.status))}>
                    {connection.item.status.replace(/_/g, ' ')}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className={cn(
            'overflow-hidden rounded-2xl border p-0 shadow-xl shadow-slate-200/70',
            highRiskMode
              ? 'border-rose-200 bg-rose-50'
              : 'border-slate-800 bg-slate-950 text-white',
          )}>
            <div className={cn(
              'border-b p-4',
              highRiskMode ? 'border-rose-200/70' : 'border-white/10',
            )}>
              <div className="flex min-w-0 items-start gap-3">
                <div className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg',
                  highRiskMode ? 'bg-rose-600' : 'bg-blue-600',
                )}>
                  {highRiskMode ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    'text-[10px] font-black uppercase tracking-widest',
                    highRiskMode ? 'text-rose-700' : 'text-blue-200',
                  )}>{t('actionInbox')}</p>
                  <h2 className={cn(
                    'mt-1 text-xl font-black leading-tight',
                    highRiskMode ? 'text-rose-950' : 'text-white',
                  )}>
                    {highRiskMode ? t('highRiskMode') : t('standardMode')}
                  </h2>
                  <p className={cn(
                    'mt-2 text-sm font-bold leading-6',
                    highRiskMode ? 'text-rose-900/75' : 'text-slate-300',
                  )}>
                    {highRiskMode
                      ? t('highRiskBody')
                      : t('commandBody')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: t('activePermissions'), value: snapshot.counts.active, tone: highRiskMode ? 'bg-white/80 text-rose-950' : 'bg-white/10 text-white' },
                  { label: t('reviewQueue'), value: snapshot.counts.needsReview, tone: highRiskMode ? 'bg-amber-50 text-amber-800' : 'bg-amber-400/15 text-amber-200' },
                ].map(item => (
                  <div key={item.label} className={cn('rounded-xl px-3 py-3', item.tone)}>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{item.label}</p>
                    <p className="mt-2 text-2xl font-black">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                <p className={cn(
                  'text-[10px] font-black uppercase tracking-widest',
                  highRiskMode ? 'text-rose-700' : 'text-slate-300',
                )}>{t('selectedConnection')}</p>
                <p className={cn('mt-1 truncate text-sm font-black', highRiskMode ? 'text-rose-950' : 'text-white')}>
                  {selectedConnection?.participantName ?? t('noConnections')}
                </p>
                <p className={cn('mt-1 line-clamp-2 text-xs font-bold', highRiskMode ? 'text-rose-900/70' : 'text-slate-400')}>
                  {selectedConnection?.item.nextAction ?? t('timelineEmpty')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-1">
                {[t('localOnly'), t('ethereumOptional'), t('noRawAddress')].map(label => (
                  <div key={label} className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-left',
                    highRiskMode ? 'bg-white/70 text-rose-950' : 'bg-white/10 text-white',
                  )}>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
            {[
              { label: t('totalConnections'), value: snapshot.counts.total, tone: 'bg-slate-950 text-white' },
              { label: t('active'), value: snapshot.counts.active, tone: 'bg-emerald-600 text-white' },
              { label: t('needsReview'), value: snapshot.counts.needsReview, tone: 'bg-amber-500 text-white' },
              { label: t('revokedOrExpired'), value: snapshot.counts.revokedOrExpired, tone: 'bg-rose-600 text-white' },
            ].map(item => (
              <div key={item.label} className={cn('rounded-2xl p-4 shadow-sm', item.tone)}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-75">{item.label}</p>
                <p className="mt-2 text-3xl font-black">{item.value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="grid gap-3 border-b border-slate-100 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-slate-700" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{t('professionalCollaboration')}</h2>
                </div>
                <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                  {t('professionalCollaborationBody')}
                </p>
              </div>
              <div className="flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <EyeOff className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t('noRawAddress')}</span>
              </div>
            </div>

            <div className="grid gap-3 p-3">
              {professionReviews.map(review => {
                const Icon = review.icon;
                const hasRisk = review.riskCount > 0;
                return (
                  <button
                    key={review.id}
                    type="button"
                    onClick={() => focusProfessionReview(review)}
                    className={cn(
                      'flex h-full flex-col rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                      hasRisk
                        ? 'border-amber-200 bg-amber-50/70 hover:bg-amber-50'
                        : 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white',
                        hasRisk ? 'bg-amber-500' : 'bg-emerald-600',
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-950">{t(review.titleKey)}</h3>
                        <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{t(review.bodyKey)}</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white/80 px-2 py-2">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{t('matchedItems')}</p>
                        <p className="mt-1 text-lg font-black text-slate-950">{review.matchedCount}</p>
                      </div>
                      <div className="rounded-lg bg-white/80 px-2 py-2">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{t('riskItems')}</p>
                        <p className={cn('mt-1 text-lg font-black', hasRisk ? 'text-amber-700' : 'text-emerald-700')}>
                          {review.riskCount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-3 text-[10px] font-black uppercase tracking-wider text-white">
                      {t(review.actionKey)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

        </aside>

        <section className="min-h-0 space-y-4 lg:row-span-2 xl:row-span-1 xl:overflow-y-auto xl:px-1">
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-slate-700" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{t('permissionTimeline')}</h2>
                </div>
                <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                  {t('timelineBody')}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
                <EyeOff className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t('noRawAddress')}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {permissionTimeline.length === 0 && (
                <div className="p-6 text-sm font-black text-slate-500">{t('timelineEmpty')}</div>
              )}
              {permissionTimeline.slice(0, 10).map(entry => {
                const connection = snapshot.connections.find(item => item.connectionId === entry.connectionId);
                const Icon = participantIcon(entry.participantType);
                return (
                  <div key={entry.eventId} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-black text-slate-950">{entry.participantName}</h3>
                            <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider', timelineEventTone(entry.event))}>
                              {timelineEventLabel(t, entry.event)}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {formatTime(entry.occurredAt)} / {entry.purpose} / {entry.connectionId}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {entry.scopes.map(scope => (
                          <span key={`${entry.eventId}-${scope}`} className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (connection) {
                            setSelectedConnectionId(connection.connectionId);
                            revokeConnection(connection);
                          }
                        }}
                        disabled={!connection || !entry.canRevoke}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-rose-600 px-3 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-rose-500/15 transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                      >
                        <XCircle className="h-4 w-4" />
                        {t('revokeFromTimeline')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-slate-700" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{t('addressItems')}</h2>
                </div>
                <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                  {t('addressItemListBody')}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <EyeOff className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t('noRawAddress')}</span>
              </div>
            </div>

            <div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={t('search')}
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-100 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Filter className="h-4 w-4" />
                  {t('status')}
                </span>
                {filterItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      'h-11 rounded-xl px-3 text-xs font-black uppercase tracking-wider transition-all',
                      filter === item.id
                        ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    {item.label} {item.count}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 p-3">
              {filteredConnections.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm font-black text-slate-500">{t('noConnections')}</p>
                </div>
              )}

              {filteredConnections.map(connection => {
                const Icon = participantIcon(connection.participantType);
                const StatusIcon = statusIcon(connection.item.status);
                const safety = buildConnectionSafety(connection, highRiskMode);
                const SafetyIcon = safetyIcon(safety.level);
                const selected = selectedConnection?.connectionId === connection.connectionId;
                return (
                  <button
                    key={connection.connectionId}
                    type="button"
                    onClick={() => setSelectedConnectionId(connection.connectionId)}
                    className={cn(
                      'grid w-full gap-4 rounded-2xl border p-4 text-left transition-all lg:grid-cols-[minmax(0,1fr)_auto]',
                      selected
                        ? 'border-blue-200 bg-blue-50/80 shadow-sm shadow-blue-100'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-slate-950">{connection.participantName}</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {connection.participantType} / {connection.purpose} / {connection.connectionId}
                          </p>
                        </div>
                        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', statusTone(connection.item.status))}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {connection.item.status.replace(/_/g, ' ')}
                        </span>
                        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', safetyTone(safety.level))}>
                          <SafetyIcon className="h-3.5 w-3.5" />
                          {t(safety.labelKey)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {connection.item.scopes.map(scope => (
                          <span key={scope} className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-1 rounded-xl bg-white/70 p-3 text-xs font-bold text-slate-500 lg:min-w-[190px]">
                      <span>{t('connectionSafety')}: {t(safety.labelKey)}</span>
                      <span>{t('addressItemId')}: {connection.item.addressItemId}</span>
                      <span>{t('lastVerified')}: {formatTime(connection.item.lastVerifiedAt)}</span>
                      <span>{t('nextAction')}: {connection.item.nextAction}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="min-h-0 space-y-4 lg:col-span-1 lg:col-start-1 lg:row-start-2 xl:col-span-1 xl:col-start-auto xl:row-start-auto xl:overflow-y-auto xl:pl-1">
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <EyeOff className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest">{t('privacyBoundary')}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/70">{t('safeToShare')}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-bold leading-6 text-emerald-900/80">{t('privacyBody')}</p>
            <div className="mt-4 grid gap-2">
              {[
                ['plaintextAddressDisplayed', snapshot.privacy.plaintextAddressDisplayed],
                ['rawAgidDisplayed', snapshot.privacy.rawAgidDisplayed],
                ['rawAoidDisplayed', snapshot.privacy.rawAoidDisplayed],
                ['safeExport', exportSafety.safe],
              ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900/70">{label}</span>
                  <span className={cn('text-xs font-black', value ? 'text-emerald-700' : 'text-slate-500')}>
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {selectedConnection && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('detail')}</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">{selectedConnection.participantName}</h2>
                </div>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', statusTone(selectedConnection.item.status))}>
                  {selectedConnection.item.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-blue-50 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">{t('consentStatus')}</p>
                  <p className="mt-1 text-sm font-black text-blue-950">
                    {consentStatus(selectedConnection) === 'granted'
                      ? t('granted')
                      : consentStatus(selectedConnection) === 'needs-signature'
                        ? t('needsSignature')
                        : t('revokedOrExpired')}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('addressItemId')}</p>
                  <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{selectedConnection.item.addressItemId}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('itemRoot')}</p>
                  <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{selectedConnection.item.itemRoot.slice(0, 24)}</p>
                </div>
              </div>

              {selectedConnectionSafety && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {React.createElement(safetyIcon(selectedConnectionSafety.level), {
                        className: 'h-4 w-4 text-slate-700',
                      })}
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('connectionSafety')}</p>
                    </div>
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', safetyTone(selectedConnectionSafety.level))}>
                      {t(selectedConnectionSafety.labelKey)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('safetySignals')}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedConnectionSafety.signals.map(signal => (
                        <div key={signal.key} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
                          <span className="text-xs font-black text-slate-600">{t(signal.key)}</span>
                          <span className={cn(
                            'inline-flex h-6 w-6 items-center justify-center rounded-full',
                            signal.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                          )}>
                            {signal.passed ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-2">
                {[
                  [t('issuer'), selectedConnection.item.issuerId || 'none'],
                  [t('purpose'), selectedConnection.purpose],
                  [t('credential'), selectedConnection.item.credentialRef?.fingerprint || 'none'],
                  [t('lastAccessed'), formatTime(selectedConnection.lastAccessedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('scopeControl')}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ADDRESS_LINK_SCOPES.map(scope => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => removeConnectionScope(selectedConnection, scope)}
                      disabled={!selectedConnection.item.scopes.includes(scope) || selectedConnection.item.scopes.length <= 1}
                      title={selectedConnection.item.scopes.includes(scope) ? t('removeScope') : t('notGranted')}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-black transition-all',
                        selectedConnection.item.scopes.includes(scope)
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'cursor-not-allowed bg-slate-100 text-slate-400',
                        selectedConnection.item.scopes.includes(scope) && selectedConnection.item.scopes.length <= 1 && 'cursor-not-allowed opacity-70',
                      )}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                  {t('scopeReductionHint')}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-slate-700" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('dataRelease')}</p>
                </div>
                <div className="mt-3 grid gap-2">
                  {[
                    ['Raw address', t('blocked'), 'text-rose-700 bg-rose-50'],
                    ['Raw AGID / AOID', t('blocked'), 'text-rose-700 bg-rose-50'],
                    [t('permittedScopes'), t('allowed'), 'text-emerald-700 bg-emerald-50'],
                    [t('retention'), highRiskMode ? 'short-lived local refs' : 'local refs until revoke/delete', 'text-slate-700 bg-white'],
                  ].map(([label, value, tone]) => (
                    <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                      <span className="text-xs font-black text-slate-600">{label}</span>
                      <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', tone)}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <button
                  type="button"
                  onClick={() => reduceConnectionScopes(selectedConnection)}
                  disabled={!selectedConnection.allowedActions.includes('reduce_scope')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition-all hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <KeyRound className="h-4 w-4" />
                  {t('reduceToMinimum')}
                </button>
                <button
                  type="button"
                  onClick={() => revokeConnection(selectedConnection)}
                  disabled={!selectedConnection.allowedActions.includes('revoke')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-500/15 transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  <XCircle className="h-4 w-4" />
                  {t('revoke')}
                </button>
                <button
                  type="button"
                  onClick={() => requestDeletion(selectedConnection)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-amber-600"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {t('requestDeletion')}
                </button>
                <button
                  type="button"
                  onClick={() => deleteConnection(selectedConnection)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition-all hover:bg-slate-950 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('deleteData')}
                </button>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{t('safeExport')}</h2>
              </div>
              <button
                type="button"
                onClick={exportSafeList}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3 text-[10px] font-black uppercase tracking-wider text-white"
              >
                <Copy className="h-3.5 w-3.5" />
                {t('copyExport')}
              </button>
            </div>
            <div className="mt-3 rounded-2xl bg-slate-950 p-3 text-slate-100">
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-[10px] leading-5">
                {safeExportText || JSON.stringify({
                  exportId: safeExport.exportId,
                  portalRoot: safeExport.portalRoot.slice(0, 18),
                  connections: safeExport.connections.length,
                  safe: exportSafety.safe,
                }, null, 2)}
              </pre>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{t('proofReceipts')}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {receipts.length}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {receipts.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold leading-5 text-slate-500">
                    {t('latestReceipt')}: none
                  </p>
                </div>
              )}
              {receipts.map(receipt => (
                <div key={receipt.receiptId} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                      {receipt.action}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(receipt.createdAt))}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1">
                    <p className="break-all font-mono text-[10px] font-bold text-slate-700">
                      {t('receiptId')}: {receipt.receiptId}
                    </p>
                    <p className="break-all font-mono text-[10px] font-bold text-slate-500">
                      {t('scopeHash')}: {receipt.scopeHash.slice(0, 24)}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      {t('consentEnvelope')}: {t('noRawAddress')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-slate-700" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">{t('auditLog')}</h2>
            </div>
            <div className="mt-3 space-y-2">
              {auditLog.map((entry, index) => (
                <div key={`${entry}-${index}`} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold leading-5 text-slate-600">{entry}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};
