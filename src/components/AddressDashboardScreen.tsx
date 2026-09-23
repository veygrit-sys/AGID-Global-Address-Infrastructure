import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Copy,
  EyeOff,
  Filter,
  HardDrive,
  KeyRound,
  Link2,
  PackageCheck,
  QrCode,
  RefreshCw,
  Router,
  Search,
  ServerCog,
  ShieldCheck,
  TerminalSquare,
  TicketCheck,
  Truck,
  Webhook,
} from 'lucide-react';
import React from 'react';

import {
  ADDRESS_DASHBOARD_STATUS_FILTERS,
  ADDRESS_REVIEW_CASE_CATEGORIES,
  buildAddressDashboardConsole,
  buildAddressReviewConsole,
  type AddressDashboardCommand,
  type AddressDashboardConsole,
  type AddressDashboardSection,
  type AddressDashboardStatusFilter,
  type AddressReviewCase,
  type AddressReviewCaseCategory,
} from '../lib/addressOperations';
import { evaluateAddressLaunchCenter } from '../lib/addressLaunchCenter';
import {
  REDACTED_AUDIT_REPORT_SURFACES,
  buildRedactedAuditReportViewer,
  type RedactedAuditReport,
  type RedactedAuditReportSurface,
} from '../lib/redactedAuditReportViewer';
import {
  OFFLINE_SYNC_SURFACES,
  buildOfflineSyncCenter,
  type OfflineSyncItem,
  type OfflineSyncSurface,
  type OfflineSyncSurfaceFilter,
} from '../lib/offlineSyncCenter';
import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import { cn } from '../lib/utils';

type DashboardCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'refresh'
  | 'copyExport'
  | 'language'
  | 'search'
  | 'commandCenter'
  | 'sectionHealth'
  | 'attentionFeed'
  | 'runbook'
  | 'safeExport'
  | 'launchReadiness'
  | 'privacyBoundary'
  | 'privacyBody'
  | 'lastEvent'
  | 'events'
  | 'blocked'
  | 'attention'
  | 'ready'
  | 'reviewItems'
  | 'qrUsed'
  | 'webhookFailures'
  | 'terminalIncidents'
  | 'issuerProblems'
  | 'noAttention'
  | 'owner'
  | 'nextAction'
  | 'evidence'
  | 'filters'
  | 'allOwners'
  | 'operations'
  | 'security'
  | 'support'
  | 'compliance'
  | 'platform'
  | 'payloadSafe'
  | 'selectedSection'
  | 'reviewConsole'
  | 'reviewConsoleBody'
  | 'caseQueue'
  | 'reviewCommandMatrix'
  | 'reviewCommandBody'
  | 'needsReviewQueue'
  | 'issuerRevocations'
  | 'terminalAnomalies'
  | 'radarReasonCodeSummary'
  | 'selectedCase'
  | 'category'
  | 'severity'
  | 'decision'
  | 'subjectRef'
  | 'queueLane'
  | 'rejectedCases'
  | 'addressConflicts'
  | 'auditCases'
  | 'terminalIssues'
  | 'issuerIssues'
  | 'redactedAuditReports'
  | 'redactedAuditBody'
  | 'reportQueue'
  | 'selectedReport'
  | 'surface'
  | 'reportRef'
  | 'receiptRoot'
  | 'policyRefs'
  | 'reasonCodes'
  | 'redactionSummary'
  | 'noPersonalData'
  | 'posReports'
  | 'deliveryReports'
  | 'portalReports'
  | 'allSurfaces'
  | 'nullifier'
  | 'deviceSignature'
  | 'publicRoots'
  | 'offlineSyncCenter'
  | 'offlineSyncBody'
  | 'offlineQueue'
  | 'selectedSyncItem'
  | 'pendingSync'
  | 'syncConflicts'
  | 'usedNullifiers'
  | 'posQueues'
  | 'fieldQueues'
  | 'lockerQueues'
  | 'allSyncSurfaces'
  | 'deviceRef'
  | 'queueRef'
  | 'syncRef'
  | 'lastSynced'
  | 'updatedAt'
  | 'nullifierTails'
  | 'actionRefs'
  | 'refsAndCountsOnly'
  | 'professionalCollaboration'
  | 'professionalCollaborationBody'
  | 'reviewerDesk'
  | 'reviewerDeskBody'
  | 'reviewerDeskAction'
  | 'complianceDesk'
  | 'complianceDeskBody'
  | 'complianceDeskAction'
  | 'securityDesk'
  | 'securityDeskBody'
  | 'securityDeskAction'
  | 'platformDesk'
  | 'platformDeskBody'
  | 'platformDeskAction'
  | 'supportDesk'
  | 'supportDeskBody'
  | 'supportDeskAction'
  | 'fieldDesk'
  | 'fieldDeskBody'
  | 'fieldDeskAction'
  | 'matchedSignals'
  | 'riskSignals'
  | 'accepted'
  | 'synced';

type OwnerFilter = AddressDashboardCommand['owner'] | 'all';
type ReviewCategoryFilter = AddressReviewCaseCategory | 'all';
type AuditSurfaceFilter = RedactedAuditReportSurface | 'all';
type ProfessionalDeskId = 'reviewer' | 'compliance' | 'security' | 'platform' | 'support' | 'field';
type ProfessionalDeskTone = 'amber' | 'indigo' | 'rose' | 'blue' | 'emerald' | 'slate';
type ProfessionalDeskMetric = {
  labelKey: DashboardCopyKey;
  value: number;
  tone?: string;
};
type ProfessionalDesk = {
  id: ProfessionalDeskId;
  titleKey: DashboardCopyKey;
  bodyKey: DashboardCopyKey;
  actionKey: DashboardCopyKey;
  icon: React.ComponentType<{ className?: string }>;
  tone: ProfessionalDeskTone;
  metrics: [ProfessionalDeskMetric, ProfessionalDeskMetric];
  signalRefs: string[];
};

const DASHBOARD_COPY: Record<'en' | 'ja', Record<DashboardCopyKey, string>> = {
  en: {
    returnToMap: 'Return to AGID map',
    subtitle: 'Operations console for API logs, webhooks, terminals, issuers, reviews, disputes, QR usage, and launch readiness.',
    refresh: 'Refresh',
    copyExport: 'Copy safe export',
    language: 'Language',
    search: 'Search sections, focus areas, or actions',
    commandCenter: 'Command Center',
    sectionHealth: 'Section health',
    attentionFeed: 'Attention feed',
    runbook: 'Operator runbook',
    safeExport: 'Safe export',
    launchReadiness: 'Launch readiness',
    privacyBoundary: 'Privacy boundary',
    privacyBody: 'The dashboard accepts operational metrics, commitments, references, and status metadata only. Raw address, raw AGID, raw AOID, recipient names, phone numbers, proof codes, and private keys stay out of this console.',
    lastEvent: 'Last event',
    events: 'Events',
    blocked: 'Blocked',
    attention: 'Attention',
    ready: 'Ready',
    reviewItems: 'Review items',
    qrUsed: 'QR used',
    webhookFailures: 'Webhook failures',
    terminalIncidents: 'Terminal incidents',
    issuerProblems: 'Issuer problems',
    noAttention: 'No blocking or review signals.',
    owner: 'Owner',
    nextAction: 'Next action',
    evidence: 'Evidence refs',
    filters: 'Filters',
    allOwners: 'All owners',
    operations: 'Operations',
    security: 'Security',
    support: 'Support',
    compliance: 'Compliance',
    platform: 'Platform',
    payloadSafe: 'Payload safe',
    selectedSection: 'Selected section',
    reviewConsole: 'Review Console',
    reviewConsoleBody: 'Resolve review-required, rejected, address-conflict, audit, terminal, and issuer cases from redacted refs only.',
    caseQueue: 'Case queue',
    reviewCommandMatrix: 'Review command matrix',
    reviewCommandBody: 'Queue operator work by attention, address conflict, issuer revocation, terminal anomaly, and Radar reason code without exposing private address material.',
    needsReviewQueue: 'Needs review queue',
    issuerRevocations: 'Issuer revocations',
    terminalAnomalies: 'Terminal anomalies',
    radarReasonCodeSummary: 'Radar reason codes',
    selectedCase: 'Selected case',
    category: 'Category',
    severity: 'Severity',
    decision: 'Decision',
    subjectRef: 'Subject ref',
    queueLane: 'Queue lane',
    rejectedCases: 'Rejected',
    addressConflicts: 'Address conflicts',
    auditCases: 'Audit',
    terminalIssues: 'Terminal',
    issuerIssues: 'Issuer',
    redactedAuditReports: 'Redacted Audit Report Viewer',
    redactedAuditBody: 'Review POS, delivery, and Portal audit reports from references, roots, aliases, and device signatures only. Personal data never appears in the viewer.',
    reportQueue: 'Report queue',
    selectedReport: 'Selected report',
    surface: 'Surface',
    reportRef: 'Report ref',
    receiptRoot: 'Receipt root',
    policyRefs: 'Policy refs',
    reasonCodes: 'Reason codes',
    redactionSummary: 'Redaction summary',
    noPersonalData: 'No personal data',
    posReports: 'POS',
    deliveryReports: 'Delivery',
    portalReports: 'Portal',
    allSurfaces: 'All surfaces',
    nullifier: 'Nullifier',
    deviceSignature: 'Device signature',
    publicRoots: 'Public roots',
    offlineSyncCenter: 'Offline Sync Center',
    offlineSyncBody: 'Monitor POS, Field, and Locker deferred queues, conflicts, and used nullifier state from references and counts only.',
    offlineQueue: 'Offline queue',
    selectedSyncItem: 'Selected sync item',
    pendingSync: 'Pending sync',
    syncConflicts: 'Conflicts',
    usedNullifiers: 'Used nullifiers',
    posQueues: 'POS',
    fieldQueues: 'Field',
    lockerQueues: 'Locker',
    allSyncSurfaces: 'All sync surfaces',
    deviceRef: 'Device ref',
    queueRef: 'Queue ref',
    syncRef: 'Sync ref',
    lastSynced: 'Last synced',
    updatedAt: 'Updated',
    nullifierTails: 'Nullifier tails',
    actionRefs: 'Action refs',
    refsAndCountsOnly: 'Refs and counts only',
    professionalCollaboration: 'Professional collaboration',
    professionalCollaborationBody: 'Role-based shortcuts for review, compliance, security, platform, support, and field teams. Each desk uses refs, counts, roots, and reason codes only.',
    reviewerDesk: 'Review desk',
    reviewerDeskBody: 'Triage review-required, rejected, and conflicting address cases before approval.',
    reviewerDeskAction: 'Open review queue',
    complianceDesk: 'Compliance desk',
    complianceDeskBody: 'Check redacted POS, delivery, and Portal reports against policy references.',
    complianceDeskAction: 'Open audit reports',
    securityDesk: 'Security desk',
    securityDeskBody: 'Focus issuer revocations, terminal anomalies, and replay-risk signals.',
    securityDeskAction: 'Open issuer cases',
    platformDesk: 'Platform desk',
    platformDeskBody: 'Track webhook failures, terminal incidents, and offline sync conflicts.',
    platformDeskAction: 'Open sync queues',
    supportDesk: 'Support desk',
    supportDeskBody: 'Resolve customer-facing rejected and address-conflict cases without exposing raw address data.',
    supportDeskAction: 'Open conflict cases',
    fieldDesk: 'Field desk',
    fieldDeskBody: 'Review delivery, field, and locker queues for pending sync and handoff readiness.',
    fieldDeskAction: 'Open field queues',
    matchedSignals: 'Matched signals',
    riskSignals: 'Risk signals',
    accepted: 'Accepted',
    synced: 'Synced',
  },
  ja: {
    returnToMap: 'AGIDマップへ戻る',
    subtitle: 'APIログ、Webhook、端末、issuer、レビュー、異議申し立て、QR使用済み、ローンチ準備を統合する運用コンソールです。',
    refresh: '更新',
    copyExport: '安全Exportをコピー',
    language: '言語',
    search: 'セクション、重点領域、対応を検索',
    commandCenter: 'Command Center',
    sectionHealth: 'セクション状態',
    attentionFeed: '要対応フィード',
    runbook: 'オペレーターRunbook',
    safeExport: '安全Export',
    launchReadiness: 'ローンチ準備',
    privacyBoundary: 'プライバシー境界',
    privacyBody: 'Dashboardは運用メトリクス、commitment、参照、状態メタデータだけを扱います。実住所、AGID本体、AOID本体、受取人名、電話番号、proof code、秘密鍵はこの画面に入れません。',
    lastEvent: '最終イベント',
    events: 'イベント',
    blocked: 'ブロック',
    attention: '要対応',
    ready: '正常',
    reviewItems: 'レビュー項目',
    qrUsed: 'QR使用済み',
    webhookFailures: 'Webhook失敗',
    terminalIncidents: '端末インシデント',
    issuerProblems: 'Issuer問題',
    noAttention: 'ブロックまたは要確認シグナルはありません。',
    owner: '担当',
    nextAction: '次の対応',
    evidence: '証跡参照',
    filters: 'フィルタ',
    allOwners: '全担当',
    operations: '運用',
    security: 'セキュリティ',
    support: 'サポート',
    compliance: 'コンプライアンス',
    platform: '基盤',
    payloadSafe: 'Payload安全',
    selectedSection: '選択中',
    reviewConsole: 'Review Console',
    reviewConsoleBody: '要確認、拒否、住所衝突、監査、端末、issuerのケースをredacted参照だけで処理します。',
    caseQueue: 'ケースキュー',
    reviewCommandMatrix: 'Review指揮マトリクス',
    reviewCommandBody: '要確認、住所衝突、issuer失効、端末異常、Radar理由コードを、実住所なしで運用キュー化します。',
    needsReviewQueue: '要確認queue',
    issuerRevocations: 'Issuer失効',
    terminalAnomalies: '端末異常',
    radarReasonCodeSummary: 'Radar理由コード',
    selectedCase: '選択中ケース',
    category: 'カテゴリ',
    severity: '重要度',
    decision: '判定',
    subjectRef: '対象参照',
    queueLane: 'キュー種別',
    rejectedCases: '拒否',
    addressConflicts: '住所衝突',
    auditCases: '監査',
    terminalIssues: '端末',
    issuerIssues: 'Issuer',
    redactedAuditReports: 'Redacted Audit Report Viewer',
    redactedAuditBody: 'POS、配送、Portalの監査レポートを参照、root、alias、端末署名だけで確認します。個人情報はViewerに表示しません。',
    reportQueue: 'レポートキュー',
    selectedReport: '選択中レポート',
    surface: '対象画面',
    reportRef: 'レポート参照',
    receiptRoot: 'Receipt root',
    policyRefs: 'Policy参照',
    reasonCodes: '理由コード',
    redactionSummary: 'Redaction概要',
    noPersonalData: '個人情報なし',
    posReports: 'POS',
    deliveryReports: '配送',
    portalReports: 'Portal',
    allSurfaces: '全画面',
    nullifier: 'Nullifier',
    deviceSignature: '端末署名',
    publicRoots: '公開root',
    offlineSyncCenter: 'Offline Sync Center',
    offlineSyncBody: 'POS、Field、Lockerの未同期キュー、衝突、使用済みnullifier状態を参照と件数だけで監視します。',
    offlineQueue: 'オフラインキュー',
    selectedSyncItem: '選択中の同期項目',
    pendingSync: '未同期',
    syncConflicts: '衝突',
    usedNullifiers: '使用済みnullifier',
    posQueues: 'POS',
    fieldQueues: 'Field',
    lockerQueues: 'Locker',
    allSyncSurfaces: '全同期面',
    deviceRef: '端末参照',
    queueRef: 'キュー参照',
    syncRef: '同期参照',
    lastSynced: '最終同期',
    updatedAt: '更新',
    nullifierTails: 'Nullifier tail',
    actionRefs: '対応参照',
    refsAndCountsOnly: '参照と件数のみ',
    professionalCollaboration: '職種別連携',
    professionalCollaborationBody: '審査、コンプライアンス、セキュリティ、基盤、サポート、現場の入口を分けます。各職種は参照、件数、root、理由コードだけで判断します。',
    reviewerDesk: '審査デスク',
    reviewerDeskBody: '承認前の要確認、拒否、住所衝突ケースを優先処理します。',
    reviewerDeskAction: 'レビューキューを開く',
    complianceDesk: 'コンプライアンスデスク',
    complianceDeskBody: 'POS、配送、Portalのredacted監査レポートをpolicy参照で確認します。',
    complianceDeskAction: '監査レポートを開く',
    securityDesk: 'セキュリティデスク',
    securityDeskBody: 'Issuer失効、端末異常、リプレイリスクのシグナルを確認します。',
    securityDeskAction: 'Issuerケースを開く',
    platformDesk: '基盤デスク',
    platformDeskBody: 'Webhook失敗、端末インシデント、オフライン同期衝突を追跡します。',
    platformDeskAction: '同期キューを開く',
    supportDesk: 'サポートデスク',
    supportDeskBody: '実住所を出さずに、ユーザー影響のある拒否・住所衝突ケースを解決します。',
    supportDeskAction: '衝突ケースを開く',
    fieldDesk: '現場デスク',
    fieldDeskBody: '配送、Field、Lockerの未同期と受け渡し準備を確認します。',
    fieldDeskAction: '現場キューを開く',
    matchedSignals: '一致シグナル',
    riskSignals: 'リスクシグナル',
    accepted: '受理',
    synced: '同期済み',
  },
};

const SECTION_ICONS = {
  logs: ServerCog,
  'link-events': Link2,
  audit: ShieldCheck,
  'api-keys': KeyRound,
  terminals: TerminalSquare,
  issuers: TicketCheck,
  webhooks: Webhook,
  'review-queue': BellRing,
  disputes: AlertTriangle,
  'qr-usage': QrCode,
  'tax-customs': Router,
} satisfies Record<AddressDashboardSection, React.ComponentType<{ className?: string }>>;

const OWNER_LABEL_KEYS = {
  all: 'allOwners',
  ops: 'operations',
  security: 'security',
  support: 'support',
  compliance: 'compliance',
  platform: 'platform',
} satisfies Record<OwnerFilter, DashboardCopyKey>;

const SEED_DASHBOARD_INPUT = {
  generatedAt: '2026-06-17T02:00:00.000Z',
  logs: { total: 1280, attention: 4, lastEventAt: '2026-06-17T01:56:00.000Z' },
  linkEvents: { sessions: 214, attention: 3, lastEventAt: '2026-06-17T01:58:00.000Z' },
  audit: { total: 92, open: 2, lastEventAt: '2026-06-17T01:42:00.000Z' },
  apiKeys: { active: 18, attention: 1, lastEventAt: '2026-06-17T00:55:00.000Z' },
  terminals: { active: 37, offlineQueued: 5, lastSeenAt: '2026-06-17T01:59:00.000Z' },
  issuers: { active: 12, revoked: 1, lastEventAt: '2026-06-17T00:40:00.000Z' },
  webhooks: { active: 9, failed: 2, signatureFailures: 1, lastEventAt: '2026-06-17T01:52:00.000Z' },
  reviewQueue: { pending: 11, lastEventAt: '2026-06-17T01:50:00.000Z' },
  disputes: { open: 3, lastEventAt: '2026-06-17T01:12:00.000Z' },
  qrUsage: { used: 416, reused: 2, expired: 4, lastEventAt: '2026-06-17T01:59:30.000Z' },
  taxCustoms: { reviewRequired: 6, lastEventAt: '2026-06-17T01:20:00.000Z' },
};

const SEED_REVIEW_CASES = [
  {
    caseId: 'ARC-NEEDS-001',
    category: 'needs-review',
    status: 'needs-evidence',
    severity: 'medium',
    owner: 'support',
    title: 'Partial address needs reviewer decision',
    subjectRef: 'intent_ref_PARTIAL_7K2',
    evidenceRefs: ['EV-address-quality-partial', 'EV-postal-ref-check'],
    reason: 'address-quality-partial-and-recipient-street-missing',
    radarReasonCodes: ['quality-partial'],
    decision: 'request-evidence',
    updatedAt: '2026-06-17T01:50:00.000Z',
  },
  {
    caseId: 'ARC-REJECT-002',
    category: 'rejected',
    status: 'rejected',
    severity: 'critical',
    owner: 'security',
    title: 'Expired QR reuse blocked',
    subjectRef: 'qr_alias_REUSED_4F9',
    evidenceRefs: ['EV-qr-jti-used', 'EV-live-challenge-missing'],
    reason: 'qr-used-before-and-high-risk-token-expired',
    radarReasonCodes: ['qr-used-before', 'high-risk-qr-age-exceeded'],
    decision: 'reject',
    updatedAt: '2026-06-17T01:59:00.000Z',
  },
  {
    caseId: 'ARC-CONFLICT-003',
    category: 'address-conflict',
    status: 'open',
    severity: 'high',
    owner: 'support',
    title: 'Same address claim conflict',
    subjectRef: 'pid_commitment_CONFLICT_29',
    evidenceRefs: ['EV-lineage-root', 'EV-issuer-credential-ref'],
    reason: 'two-aoid-commitments-claim-same-delivery-unit',
    radarReasonCodes: ['aoid-multi-registration', 'aoid-nullifier-reuse'],
    decision: 'request-evidence',
    updatedAt: '2026-06-17T01:46:00.000Z',
  },
  {
    caseId: 'ARC-AUDIT-004',
    category: 'audit',
    status: 'open',
    severity: 'high',
    owner: 'security',
    title: 'Receipt and policy log need reconciliation',
    subjectRef: 'handoff_receipt_FHR_8Q2',
    evidenceRefs: ['EV-redacted-receipt-root', 'EV-policy-event-root'],
    reason: 'handoff-complete-after-deferred-sync',
    radarReasonCodes: ['offline-conflict', 'handoff-rescan-after-complete'],
    decision: 'escalate',
    updatedAt: '2026-06-17T01:42:00.000Z',
  },
  {
    caseId: 'ARC-TERM-005',
    category: 'terminal',
    status: 'blocked',
    severity: 'high',
    owner: 'ops',
    title: 'Terminal offline queue conflict',
    subjectRef: 'terminal_AGID_POS_07',
    evidenceRefs: ['EV-terminal-diagnostics', 'EV-offline-nullifier-conflict'],
    reason: 'offline-queue-conflict-and-device-recheck-required',
    radarReasonCodes: ['device-repeated-failures', 'offline-conflict'],
    decision: 'quarantine',
    updatedAt: '2026-06-17T01:58:00.000Z',
  },
  {
    caseId: 'ARC-ISSUER-006',
    category: 'issuer',
    status: 'blocked',
    severity: 'critical',
    owner: 'compliance',
    title: 'Issuer trust root mismatch',
    subjectRef: 'issuer_ref_NGO_14',
    evidenceRefs: ['EV-issuer-root-mismatch', 'EV-revocation-root'],
    reason: 'issuer-root-mismatch-before-residence-credential-verification',
    radarReasonCodes: ['registry-revoked', 'issuer-root-mismatch'],
    decision: 'quarantine',
    updatedAt: '2026-06-17T00:40:00.000Z',
  },
] as const;

const SEED_LAUNCH_CENTER_INPUT = {
  environment: 'production',
  profile: 'regulated',
  mode: 'server',
  requiresHighRiskMode: true,
  oauth: {
    scopesDefined: true,
    consentScreenReady: true,
    leastPrivilegeScopes: true,
    tokenRotation: true,
    duplicateConnectionPrevention: true,
  },
  webhooks: {
    configured: true,
    signatureVerification: true,
    replayProtection: true,
    retryPolicy: true,
    deadLetterQueue: false,
    idempotencyKeys: true,
  },
  registry: {
    revocationCheck: true,
    freshnessCheck: true,
    issuerTrustCheck: true,
    usedStatusCheck: true,
    freshnessAgeSeconds: 240,
    maxFreshnessAgeSeconds: 900,
  },
  storageLogging: {
    redactionEnabled: true,
    retentionPolicyDays: 90,
    auditLogEnabled: true,
    rawAddressLogs: false,
    rawAgidLogs: false,
    rawAoidLogs: false,
    proofCodeLogs: false,
  },
  duplicates: {
    aoidDuplicateCheck: true,
    nullifierRequired: true,
    domainSeparation: true,
    idempotencyKeys: true,
    regionUniquenessPolicy: true,
  },
  highRiskMode: {
    enabled: true,
    agidSOnly: true,
    shortExpiry: true,
    recipientChallenge: true,
    precisionReduction: true,
    immediateRevocation: true,
    noAddressHistoryRetention: true,
  },
  errorHandling: {
    typedErrors: true,
    safeUserMessages: true,
    retryBackoff: true,
    reviewQueue: true,
    operatorRunbook: true,
  },
  terminal: {
    staffRoles: true,
    deviceDiagnostics: true,
    offlineQueue: true,
    registrySyncVisible: true,
    printerTest: true,
  },
  security: {
    rateLimits: true,
    csrfOrOriginChecks: true,
    secretsNotCommitted: true,
    reproducibleBuild: true,
    externalAuditReady: false,
  },
};

const SEED_REDACTED_AUDIT_REPORTS = [
  {
    reportId: 'RAR-POS-001',
    surface: 'pos',
    title: 'POS handoff completion receipt',
    status: 'verified',
    decision: 'accept',
    actorRole: 'pos-staff',
    occurredAt: '2026-06-17T01:57:00.000Z',
    reportRef: 'audit_pos_report_QR7K',
    subjectRef: 'waybill_alias_WB-8Q2',
    evidenceRefs: ['EV-pos-device-sig-07', 'EV-recipient-challenge-root', 'EV-registry-used-state-ok'],
    policyRefs: ['delivery:carrier', 'recipient:verify', 'high-risk:off'],
    receiptRoot: 'receipt_root_8fc6d7b2a19e40cf',
    nullifierHash: 'nullifier_hash_c4a8a1b992f0',
    deviceSignatureRef: 'device_sig_ref_POS07_20260617',
    freshnessRoot: 'freshness_root_2026_06_17',
    revocationRoot: 'revocation_root_2026_06_17',
    redactionSummary: ['recipient identifiers removed', 'exact place material removed', 'operator sees aliases and roots only'],
    reasonCodes: ['handoff-complete', 'recipient-proof-ok', 'registry-fresh'],
  },
  {
    reportId: 'RAR-DELIVERY-002',
    surface: 'delivery',
    title: 'Field delivery deferred-sync receipt',
    status: 'needs-review',
    decision: 'review',
    actorRole: 'carrier',
    occurredAt: '2026-06-17T01:44:00.000Z',
    reportRef: 'audit_delivery_report_FH4M',
    subjectRef: 'handoff_alias_FHR-8Q2',
    evidenceRefs: ['EV-carrier-device-attestation', 'EV-coarse-region-check', 'EV-deferred-sync-conflict-free'],
    policyRefs: ['delivery:recipient', 'offline:deferred-sync', 'privacy:coarse-region'],
    receiptRoot: 'receipt_root_20c55da918d1bb41',
    nullifierHash: 'nullifier_hash_f13aa05f75cc',
    deviceSignatureRef: 'device_sig_ref_FIELD12_20260617',
    issuerRef: 'carrier_issuer_ref_CXR-2',
    redactionSummary: ['field coordinates reduced to coarse region', 'recipient material replaced by proof root'],
    reasonCodes: ['offline-queue-synced', 'recipient-proof-pending-review'],
  },
  {
    reportId: 'RAR-PORTAL-003',
    surface: 'portal',
    title: 'Portal consent and export action',
    status: 'verified',
    decision: 'accept',
    actorRole: 'portal-user',
    occurredAt: '2026-06-17T01:25:00.000Z',
    reportRef: 'audit_portal_report_CNS9',
    subjectRef: 'address_item_ref_AI-29C',
    evidenceRefs: ['EV-consent-scope-event', 'EV-export-root', 'EV-revocation-state-active'],
    policyRefs: ['portal:consent', 'scope:delivery:read', 'scope:export'],
    receiptRoot: 'receipt_root_b4554715f734d0a2',
    issuerRef: 'issuer_ref_PORTAL_SELF',
    freshnessRoot: 'freshness_root_2026_06_17',
    revocationRoot: 'revocation_root_2026_06_17',
    redactionSummary: ['export contains commitments and event ids only', 'site name held as reviewed business ref'],
    reasonCodes: ['scope-consented', 'export-requested', 'revocation-active'],
  },
] as const;

const SEED_OFFLINE_SYNC_ITEMS = [
  {
    itemId: 'OSC-POS-001',
    surface: 'pos',
    title: 'POS used nullifier queue',
    status: 'pending-sync',
    deviceRef: 'terminal_ref_POS07',
    queueRef: 'queue_ref_pos_nullifier_07',
    syncRef: 'registry_sync_ref_pos_20260617',
    updatedAt: '2026-06-17T01:59:30.000Z',
    lastSyncedAt: '2026-06-17T01:44:00.000Z',
    pendingCount: 3,
    conflictCount: 0,
    usedNullifierCount: 12,
    usedNullifierTails: ['9F0A2C77', 'C4A8A1B9'],
    evidenceRefs: ['EV-pos-offline-ledger-root', 'EV-pos-local-queue-root'],
    actionRefs: ['sync-used-nullifier', 'retry-registry-upload'],
  },
  {
    itemId: 'OSC-FIELD-002',
    surface: 'field',
    title: 'Field handoff deferred queue',
    status: 'conflict',
    deviceRef: 'field_device_ref_FIELD12',
    queueRef: 'queue_ref_field_deferred',
    syncRef: 'server_sync_ref_field',
    updatedAt: '2026-06-17T01:58:00.000Z',
    lastSyncedAt: '2026-06-17T00:55:00.000Z',
    pendingCount: 2,
    conflictCount: 1,
    usedNullifierCount: 4,
    usedNullifierTails: ['F13AA05F', '77D2B4C0'],
    evidenceRefs: ['EV-field-receipt-root', 'EV-field-crdt-conflict'],
    actionRefs: ['open-review-case', 'request-operator-reconcile'],
  },
  {
    itemId: 'OSC-LOCKER-003',
    surface: 'locker',
    title: 'Locker/PUDO local protocol queue',
    status: 'synced',
    deviceRef: 'locker_node_ref_OPS-01',
    queueRef: 'queue_ref_locker_mqtt_http_modbus',
    syncRef: 'sync_ref_locker_gateway',
    updatedAt: '2026-06-17T01:56:00.000Z',
    lastSyncedAt: '2026-06-17T01:56:00.000Z',
    pendingCount: 0,
    conflictCount: 0,
    usedNullifierCount: 7,
    usedNullifierTails: ['LOCKER09', 'PUDO31'],
    evidenceRefs: ['EV-locker-frame-root', 'EV-modbus-ack-root'],
    actionRefs: ['monitor-heartbeat', 'keep-local-ledger'],
  },
] as const;

function readStoredLanguage() {
  try {
    return normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || 'ja');
  } catch {
    return 'ja';
  }
}

function translate(language: string, key: DashboardCopyKey) {
  return DASHBOARD_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function returnToMap() {
  window.location.href = '/';
}

function formatTime(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusTone(status: 'ready' | 'attention' | 'blocked') {
  if (status === 'blocked') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (status === 'attention') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-emerald-200 bg-emerald-50 text-emerald-800';
}

function statusIcon(status: 'ready' | 'attention' | 'blocked') {
  if (status === 'blocked') return AlertTriangle;
  if (status === 'attention') return Clock3;
  return CheckCircle2;
}

function ownerTone(owner: OwnerFilter) {
  if (owner === 'security') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (owner === 'compliance') return 'border-indigo-200 bg-indigo-50 text-indigo-800';
  if (owner === 'support') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (owner === 'platform') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (owner === 'ops') return 'border-slate-300 bg-slate-100 text-slate-800';
  return 'border-slate-200 bg-white text-slate-700';
}

function reviewCategoryTone(category: ReviewCategoryFilter) {
  if (category === 'rejected') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (category === 'address-conflict') return 'border-orange-200 bg-orange-50 text-orange-800';
  if (category === 'audit') return 'border-indigo-200 bg-indigo-50 text-indigo-800';
  if (category === 'terminal') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (category === 'issuer') return 'border-purple-200 bg-purple-50 text-purple-800';
  if (category === 'needs-review') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-white text-slate-700';
}

function reviewSeverityTone(severity: AddressReviewCase['severity']) {
  if (severity === 'critical') return 'border-rose-300 bg-rose-100 text-rose-900';
  if (severity === 'high') return 'border-orange-200 bg-orange-50 text-orange-800';
  if (severity === 'medium') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function reviewQueueTone(lane: AddressReviewCase['queueLane']) {
  if (lane === 'issuer-revocation-queue') return 'border-purple-200 bg-purple-50 text-purple-900';
  if (lane === 'terminal-anomaly-queue') return 'border-blue-200 bg-blue-50 text-blue-900';
  if (lane === 'address-conflict-queue') return 'border-orange-200 bg-orange-50 text-orange-900';
  if (lane === 'rejected-queue') return 'border-rose-200 bg-rose-50 text-rose-900';
  if (lane === 'audit-queue') return 'border-indigo-200 bg-indigo-50 text-indigo-900';
  if (lane === 'radar-risk-queue') return 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900';
  return 'border-amber-200 bg-amber-50 text-amber-900';
}

function auditSurfaceTone(surface: AuditSurfaceFilter) {
  if (surface === 'pos') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (surface === 'delivery') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (surface === 'portal') return 'border-indigo-200 bg-indigo-50 text-indigo-800';
  return 'border-slate-200 bg-white text-slate-700';
}

function auditSurfaceIcon(surface: RedactedAuditReport['surface']) {
  if (surface === 'delivery') return Truck;
  if (surface === 'portal') return ShieldCheck;
  return PackageCheck;
}

function offlineSurfaceTone(surface: OfflineSyncSurfaceFilter) {
  if (surface === 'pos') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (surface === 'field') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (surface === 'locker') return 'border-violet-200 bg-violet-50 text-violet-800';
  return 'border-slate-200 bg-white text-slate-700';
}

function offlineStatusTone(status: OfflineSyncItem['status']) {
  if (status === 'conflict') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (status === 'pending-sync') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-emerald-200 bg-emerald-50 text-emerald-800';
}

function professionalDeskTone(tone: ProfessionalDeskTone) {
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-900';
  if (tone === 'indigo') return 'border-indigo-200 bg-indigo-50 text-indigo-900';
  if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-900';
  if (tone === 'blue') return 'border-blue-200 bg-blue-50 text-blue-900';
  if (tone === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  return 'border-slate-200 bg-slate-50 text-slate-900';
}

function offlineSurfaceIcon(surface: OfflineSyncSurface) {
  if (surface === 'field') return Truck;
  if (surface === 'locker') return HardDrive;
  return TerminalSquare;
}

function useDashboardConsole(
  query: string,
  statusFilter: AddressDashboardStatusFilter,
  selectedSection: string,
  refreshCounter: number,
) {
  return React.useMemo(() => buildAddressDashboardConsole({
    ...SEED_DASHBOARD_INPUT,
    generatedAt: refreshCounter === 0 ? SEED_DASHBOARD_INPUT.generatedAt : new Date().toISOString(),
    query,
    statusFilter,
    selectedSection,
  }), [query, refreshCounter, selectedSection, statusFilter]);
}

function useReviewConsole(
  query: string,
  categoryFilter: ReviewCategoryFilter,
  selectedCaseId: string,
  refreshCounter: number,
) {
  return React.useMemo(() => buildAddressReviewConsole({
    generatedAt: refreshCounter === 0 ? SEED_DASHBOARD_INPUT.generatedAt : new Date().toISOString(),
    cases: SEED_REVIEW_CASES,
    query,
    categoryFilter,
    selectedCaseId,
  }), [categoryFilter, query, refreshCounter, selectedCaseId]);
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="min-h-[92px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className={cn('mt-2 text-3xl font-black tabular-nums text-slate-950', tone)}>{value.toLocaleString()}</p>
    </div>
  );
}

function StatusPill({ status }: { status: 'ready' | 'attention' | 'blocked' }) {
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', statusTone(status))}>
      {status}
    </span>
  );
}

function DashboardSectionList({
  consoleView,
  selectedSection,
  setSelectedSection,
}: {
  consoleView: AddressDashboardConsole;
  selectedSection: string;
  setSelectedSection: (section: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {consoleView.filteredSections.map((section) => {
        const Icon = SECTION_ICONS[section.id];
        const active = selectedSection === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => setSelectedSection(section.id)}
            className={cn(
              'grid w-full gap-3 border-b border-slate-100 p-4 text-left transition last:border-0 lg:grid-cols-[minmax(0,1fr)_auto]',
              active ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50',
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-black text-slate-950">{section.label}</p>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">{section.focus.join(' / ')}</p>
                <code className="mt-2 inline-flex rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                  {section.nextAction}
                </code>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:justify-end">
              <StatusPill status={section.status} />
              <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-black tabular-nums text-white">
                {section.blockedCount || section.attentionCount || section.eventCount}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export const AddressDashboardScreen: React.FC = () => {
  const [appLanguage, setAppLanguage] = React.useState(readStoredLanguage);
  const [refreshCounter, setRefreshCounter] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<AddressDashboardStatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = React.useState<OwnerFilter>('all');
  const [selectedSection, setSelectedSection] = React.useState<AddressDashboardSection>('webhooks');
  const [reviewQuery, setReviewQuery] = React.useState('');
  const [reviewCategoryFilter, setReviewCategoryFilter] = React.useState<ReviewCategoryFilter>('all');
  const [selectedReviewCaseId, setSelectedReviewCaseId] = React.useState('ARC-REJECT-002');
  const [auditReportQuery, setAuditReportQuery] = React.useState('');
  const [auditSurfaceFilter, setAuditSurfaceFilter] = React.useState<AuditSurfaceFilter>('all');
  const [selectedAuditReportId, setSelectedAuditReportId] = React.useState('RAR-POS-001');
  const [offlineSyncQuery, setOfflineSyncQuery] = React.useState('');
  const [offlineSyncSurfaceFilter, setOfflineSyncSurfaceFilter] = React.useState<OfflineSyncSurfaceFilter>('all');
  const [selectedOfflineSyncItemId, setSelectedOfflineSyncItemId] = React.useState('OSC-POS-001');
  const [safeExportText, setSafeExportText] = React.useState('');
  const consoleView = useDashboardConsole(query, statusFilter, selectedSection, refreshCounter);
  const reviewConsole = useReviewConsole(reviewQuery, reviewCategoryFilter, selectedReviewCaseId, refreshCounter);
  const redactedAuditViewer = React.useMemo(() => buildRedactedAuditReportViewer({
    generatedAt: refreshCounter === 0 ? SEED_DASHBOARD_INPUT.generatedAt : new Date().toISOString(),
    reports: SEED_REDACTED_AUDIT_REPORTS,
    query: auditReportQuery,
    surfaceFilter: auditSurfaceFilter,
    selectedReportId: selectedAuditReportId,
  }), [auditReportQuery, auditSurfaceFilter, refreshCounter, selectedAuditReportId]);
  const offlineSyncCenter = React.useMemo(() => buildOfflineSyncCenter({
    generatedAt: refreshCounter === 0 ? SEED_DASHBOARD_INPUT.generatedAt : new Date().toISOString(),
    items: SEED_OFFLINE_SYNC_ITEMS,
    query: offlineSyncQuery,
    surfaceFilter: offlineSyncSurfaceFilter,
    selectedItemId: selectedOfflineSyncItemId,
  }), [offlineSyncQuery, offlineSyncSurfaceFilter, refreshCounter, selectedOfflineSyncItemId]);
  const launchReadiness = React.useMemo(() => evaluateAddressLaunchCenter(SEED_LAUNCH_CENTER_INPUT), []);
  const t = React.useCallback((key: DashboardCopyKey) => translate(appLanguage, key), [appLanguage]);
  const launchReadinessPublicState = appLanguage.startsWith('ja')
    ? launchReadiness.status === 'ready'
      ? 'OK'
      : launchReadiness.status === 'blocked'
        ? '拒否'
        : '要確認'
    : launchReadiness.status === 'ready'
      ? 'OK'
      : launchReadiness.status === 'blocked'
        ? 'Reject'
        : 'Review';
  const OverallIcon = statusIcon(consoleView.snapshot.overallStatus);
  const selected = consoleView.selectedSection;
  const selectedReviewCase = reviewConsole.selectedCase;
  const selectedAuditReport = redactedAuditViewer.selectedReport;
  const selectedOfflineSyncItem = offlineSyncCenter.selectedItem;
  const filteredCommands = consoleView.commandQueue.filter(command => ownerFilter === 'all' || command.owner === ownerFilter);
  const professionalDesks = React.useMemo<ProfessionalDesk[]>(() => {
    const activeReviewQueues = reviewConsole.reviewQueues
      .filter(queue => queue.count > 0)
      .map(queue => queue.label);
    const topReasonCodes = reviewConsole.radarReasonCodeCounts
      .slice(0, 3)
      .map(reason => `${reason.code} x${reason.count}`);

    return [
      {
        id: 'reviewer',
        titleKey: 'reviewerDesk',
        bodyKey: 'reviewerDeskBody',
        actionKey: 'reviewerDeskAction',
        icon: ClipboardCheck,
        tone: 'amber',
        metrics: [
          { labelKey: 'caseQueue', value: reviewConsole.totals.needsReview + reviewConsole.totals.rejected + reviewConsole.totals.addressConflicts },
          { labelKey: 'riskSignals', value: reviewConsole.actionQueue.length, tone: 'text-amber-800' },
        ],
        signalRefs: activeReviewQueues.slice(0, 3),
      },
      {
        id: 'compliance',
        titleKey: 'complianceDesk',
        bodyKey: 'complianceDeskBody',
        actionKey: 'complianceDeskAction',
        icon: ShieldCheck,
        tone: 'indigo',
        metrics: [
          { labelKey: 'redactedAuditReports', value: redactedAuditViewer.totals.total },
          { labelKey: 'riskSignals', value: redactedAuditViewer.totals.blocked + redactedAuditViewer.totals.needsReview, tone: 'text-indigo-800' },
        ],
        signalRefs: redactedAuditViewer.reports.slice(0, 3).map(report => report.reportRef),
      },
      {
        id: 'security',
        titleKey: 'securityDesk',
        bodyKey: 'securityDeskBody',
        actionKey: 'securityDeskAction',
        icon: KeyRound,
        tone: 'rose',
        metrics: [
          { labelKey: 'issuerIssues', value: reviewConsole.totals.issuerIssues + consoleView.snapshot.totals.issuerProblems },
          { labelKey: 'riskSignals', value: reviewConsole.totals.issuerRevocations + reviewConsole.totals.terminalAnomalies, tone: 'text-rose-800' },
        ],
        signalRefs: topReasonCodes,
      },
      {
        id: 'platform',
        titleKey: 'platformDesk',
        bodyKey: 'platformDeskBody',
        actionKey: 'platformDeskAction',
        icon: ServerCog,
        tone: 'blue',
        metrics: [
          { labelKey: 'webhookFailures', value: consoleView.snapshot.totals.webhookFailures },
          { labelKey: 'syncConflicts', value: offlineSyncCenter.totals.conflicts, tone: 'text-blue-800' },
        ],
        signalRefs: consoleView.commandQueue
          .filter(command => command.owner === 'platform')
          .slice(0, 3)
          .map(command => command.nextAction),
      },
      {
        id: 'support',
        titleKey: 'supportDesk',
        bodyKey: 'supportDeskBody',
        actionKey: 'supportDeskAction',
        icon: BellRing,
        tone: 'slate',
        metrics: [
          { labelKey: 'addressConflicts', value: reviewConsole.totals.addressConflicts },
          { labelKey: 'rejectedCases', value: reviewConsole.totals.rejected, tone: 'text-slate-800' },
        ],
        signalRefs: reviewConsole.cases
          .filter(item => item.category === 'address-conflict' || item.category === 'rejected')
          .slice(0, 3)
          .map(item => item.caseId),
      },
      {
        id: 'field',
        titleKey: 'fieldDesk',
        bodyKey: 'fieldDeskBody',
        actionKey: 'fieldDeskAction',
        icon: Truck,
        tone: 'emerald',
        metrics: [
          { labelKey: 'deliveryReports', value: redactedAuditViewer.totals.delivery },
          { labelKey: 'pendingSync', value: offlineSyncCenter.totals.pendingSync, tone: 'text-emerald-800' },
        ],
        signalRefs: offlineSyncCenter.items
          .filter(item => item.surface === 'field' || item.surface === 'locker')
          .slice(0, 3)
          .map(item => item.queueRef),
      },
    ];
  }, [consoleView.commandQueue, consoleView.snapshot.totals.issuerProblems, consoleView.snapshot.totals.webhookFailures, offlineSyncCenter.items, offlineSyncCenter.totals.conflicts, offlineSyncCenter.totals.pendingSync, redactedAuditViewer.reports, redactedAuditViewer.totals.blocked, redactedAuditViewer.totals.delivery, redactedAuditViewer.totals.needsReview, redactedAuditViewer.totals.total, reviewConsole.actionQueue.length, reviewConsole.cases, reviewConsole.radarReasonCodeCounts, reviewConsole.reviewQueues, reviewConsole.totals.addressConflicts, reviewConsole.totals.issuerIssues, reviewConsole.totals.issuerRevocations, reviewConsole.totals.needsReview, reviewConsole.totals.rejected, reviewConsole.totals.terminalAnomalies]);

  const focusProfessionalDesk = (deskId: ProfessionalDeskId) => {
    if (deskId === 'reviewer') {
      setReviewQuery('');
      setReviewCategoryFilter('needs-review');
      setSelectedReviewCaseId(reviewConsole.cases.find(item => item.category === 'needs-review')?.caseId ?? selectedReviewCaseId);
      return;
    }

    if (deskId === 'compliance') {
      setAuditReportQuery('');
      setAuditSurfaceFilter('all');
      setReviewCategoryFilter('audit');
      setSelectedReviewCaseId(reviewConsole.cases.find(item => item.category === 'audit')?.caseId ?? selectedReviewCaseId);
      return;
    }

    if (deskId === 'security') {
      setReviewQuery('');
      setReviewCategoryFilter('issuer');
      setSelectedReviewCaseId(reviewConsole.cases.find(item => item.category === 'issuer')?.caseId ?? selectedReviewCaseId);
      setOwnerFilter('security');
      return;
    }

    if (deskId === 'platform') {
      setOfflineSyncQuery('');
      setOfflineSyncSurfaceFilter('pos');
      setSelectedSection('webhooks');
      setOwnerFilter('platform');
      return;
    }

    if (deskId === 'support') {
      setReviewQuery('');
      setReviewCategoryFilter('address-conflict');
      setSelectedReviewCaseId(reviewConsole.cases.find(item => item.category === 'address-conflict')?.caseId ?? selectedReviewCaseId);
      setOwnerFilter('support');
      return;
    }

    setAuditReportQuery('');
    setOfflineSyncQuery('');
    setAuditSurfaceFilter('delivery');
    setOfflineSyncSurfaceFilter('field');
    setSelectedOfflineSyncItemId(offlineSyncCenter.items.find(item => item.surface === 'field')?.itemId ?? selectedOfflineSyncItemId);
  };

  React.useEffect(() => {
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = getLanguageDirection(appLanguage);
    try {
      localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage);
    } catch {
      // Ignore storage failures in private browsing or test contexts.
    }
  }, [appLanguage]);

  React.useEffect(() => {
    if (consoleView.selectedSection && consoleView.selectedSection.id !== selectedSection) {
      setSelectedSection(consoleView.selectedSection.id);
    }
  }, [consoleView.selectedSection, selectedSection]);

  React.useEffect(() => {
    if (reviewConsole.selectedCase && reviewConsole.selectedCase.caseId !== selectedReviewCaseId) {
      setSelectedReviewCaseId(reviewConsole.selectedCase.caseId);
    }
  }, [reviewConsole.selectedCase, selectedReviewCaseId]);

  React.useEffect(() => {
    if (redactedAuditViewer.selectedReport && redactedAuditViewer.selectedReport.reportId !== selectedAuditReportId) {
      setSelectedAuditReportId(redactedAuditViewer.selectedReport.reportId);
    }
  }, [redactedAuditViewer.selectedReport, selectedAuditReportId]);

  React.useEffect(() => {
    if (offlineSyncCenter.selectedItem && offlineSyncCenter.selectedItem.itemId !== selectedOfflineSyncItemId) {
      setSelectedOfflineSyncItemId(offlineSyncCenter.selectedItem.itemId);
    }
  }, [offlineSyncCenter.selectedItem, selectedOfflineSyncItemId]);

  const summaryItems = [
    { label: t('events'), value: consoleView.snapshot.totals.events },
    { label: t('reviewItems'), value: consoleView.snapshot.totals.reviewItems },
    { label: t('qrUsed'), value: consoleView.snapshot.totals.qrUsed },
    { label: t('webhookFailures'), value: consoleView.snapshot.totals.webhookFailures, tone: 'text-rose-700' },
    { label: t('terminalIncidents'), value: consoleView.snapshot.totals.terminalIncidents, tone: 'text-amber-700' },
    { label: t('issuerProblems'), value: consoleView.snapshot.totals.issuerProblems, tone: 'text-rose-700' },
  ];

  const copySafeExport = async () => {
    const serialized = JSON.stringify(consoleView.safeExport, null, 2);
    setSafeExportText(serialized);
    try {
      await navigator.clipboard?.writeText(serialized);
    } catch {
      // Clipboard permission may be unavailable; the text remains visible.
    }
  };

  return (
    <div className="agid-fixed-page-scroll fixed inset-0 z-[210] bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/60 md:px-6">
        <div className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={returnToMap}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-950 hover:text-white"
              aria-label={t('returnToMap')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white sm:flex">
              <ServerCog className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black text-slate-950 md:text-xl">Address Dashboard</h1>
              <p className="max-w-[780px] truncate text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-600">
              <span className="hidden uppercase tracking-widest sm:inline">{t('language')}</span>
              <select
                value={appLanguage}
                onChange={event => setAppLanguage(normalizeAppLanguage(event.target.value))}
                className="max-w-[180px] bg-transparent text-xs font-black text-slate-900 outline-none"
                aria-label={t('language')}
              >
                {APP_LANGUAGES.map(language => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={copySafeExport}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-blue-700"
            >
              <Copy className="h-4 w-4" />
              {t('copyExport')}
            </button>
            <button
              type="button"
              onClick={() => setRefreshCounter(count => count + 1)}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-[11px] font-black uppercase tracking-widest text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              {t('refresh')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1520px] gap-4 px-3 py-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-4">
          <section className={cn('rounded-lg border p-4 shadow-sm', statusTone(consoleView.snapshot.overallStatus))}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/80">
                  <OverallIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{t('commandCenter')}</p>
                  <h2 className="truncate text-2xl font-black uppercase tracking-tight">{consoleView.snapshot.overallStatus}</h2>
                  <p className="mt-1 text-xs font-bold opacity-75">
                    {t('lastEvent')}: {formatTime(consoleView.snapshot.lastEventAt)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-white/70 px-3 py-2">
                  <p className="text-lg font-black">{consoleView.snapshot.totals.ready}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest">{t('ready')}</p>
                </div>
                <div className="rounded-md bg-white/70 px-3 py-2">
                  <p className="text-lg font-black">{consoleView.snapshot.totals.attention}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest">{t('attention')}</p>
                </div>
                <div className="rounded-md bg-white/70 px-3 py-2">
                  <p className="text-lg font-black">{consoleView.snapshot.totals.blocked}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest">{t('blocked')}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {summaryItems.map(item => (
              <SummaryMetric key={item.label} label={item.label} value={item.value} tone={item.tone} />
            ))}
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="max-w-[860px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('payloadSafe')}</p>
                <h2 className="text-lg font-black text-slate-950">{t('professionalCollaboration')}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{t('professionalCollaborationBody')}</p>
              </div>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-800">
                {t('refsAndCountsOnly')}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {professionalDesks.map((desk) => {
                const Icon = desk.icon;
                return (
                  <button
                    key={desk.id}
                    type="button"
                    onClick={() => focusProfessionalDesk(desk.id)}
                    className="group flex min-h-[220px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-md border', professionalDeskTone(desk.tone))}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="rounded-md bg-slate-950 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                          {t('matchedSignals')}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-black text-slate-950">{t(desk.titleKey)}</h3>
                      <p className="mt-1 min-h-[48px] text-sm font-semibold leading-6 text-slate-600">{t(desk.bodyKey)}</p>
                    </div>

                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-2">
                        {desk.metrics.map(metric => (
                          <div key={metric.labelKey} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="truncate text-[9px] font-black uppercase tracking-widest text-slate-400">{t(metric.labelKey)}</p>
                            <p className={cn('mt-1 text-xl font-black tabular-nums text-slate-950', metric.tone)}>
                              {metric.value.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex min-h-[28px] flex-wrap gap-1">
                        {(desk.signalRefs.length > 0 ? desk.signalRefs : [t('noAttention')]).map(signal => (
                          <code key={signal} className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{signal}</code>
                        ))}
                      </div>
                      <span className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition group-hover:bg-slate-950">
                        {t(desk.actionKey)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-[760px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('reviewConsole')}</p>
                <h2 className="text-lg font-black text-slate-950">{t('caseQueue')}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{t('reviewConsoleBody')}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-lg font-black text-amber-900">{reviewConsole.totals.needsReview}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">{t('attention')}</p>
                </div>
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
                  <p className="text-lg font-black text-rose-900">{reviewConsole.totals.rejected}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-rose-700">{t('rejectedCases')}</p>
                </div>
                <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
                  <p className="text-lg font-black text-orange-900">{reviewConsole.totals.addressConflicts}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-700">{t('addressConflicts')}</p>
                </div>
                <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
                  <p className="text-lg font-black text-indigo-900">{reviewConsole.totals.auditItems}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-700">{t('auditCases')}</p>
                </div>
                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                  <p className="text-lg font-black text-blue-900">{reviewConsole.totals.terminalIssues}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-700">{t('terminalIssues')}</p>
                </div>
                <div className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2">
                  <p className="text-lg font-black text-purple-900">{reviewConsole.totals.issuerIssues}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-purple-700">{t('issuerIssues')}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('reviewCommandMatrix')}</p>
                  <p className="mt-1 max-w-[860px] text-xs font-semibold leading-5 text-slate-600">{t('reviewCommandBody')}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border border-amber-200 bg-white px-3 py-2">
                    <p className="text-lg font-black text-amber-900">{reviewConsole.totals.needsReview}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">{t('needsReviewQueue')}</p>
                  </div>
                  <div className="rounded-md border border-purple-200 bg-white px-3 py-2">
                    <p className="text-lg font-black text-purple-900">{reviewConsole.totals.issuerRevocations}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-purple-700">{t('issuerRevocations')}</p>
                  </div>
                  <div className="rounded-md border border-blue-200 bg-white px-3 py-2">
                    <p className="text-lg font-black text-blue-900">{reviewConsole.totals.terminalAnomalies}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-700">{t('terminalAnomalies')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {reviewConsole.reviewQueues
                  .filter(queue => queue.count > 0)
                  .map(queue => (
                    <div key={queue.lane} className={cn('min-h-[104px] rounded-lg border bg-white p-3', reviewQueueTone(queue.lane))}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">{queue.label}</p>
                          <p className="mt-2 text-2xl font-black tabular-nums">{queue.count}</p>
                        </div>
                        <span className="rounded bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-widest">
                          C{queue.critical} / H{queue.high}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {queue.nextActionRefs.slice(0, 2).map(action => (
                          <code key={action} className="rounded bg-white/80 px-2 py-1 text-[10px] font-bold">{action}</code>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('radarReasonCodeSummary')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reviewConsole.radarReasonCodeCounts.slice(0, 8).map(reason => (
                    <span key={reason.code} className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', reviewSeverityTone(reason.maxSeverity))}>
                      {reason.code} x{reason.count}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="flex h-10 min-w-[260px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={reviewQuery}
                  onChange={event => setReviewQuery(event.target.value)}
                  placeholder={t('search')}
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
                />
              </label>
              <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
                {(['all', ...ADDRESS_REVIEW_CASE_CATEGORIES] as ReviewCategoryFilter[]).map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setReviewCategoryFilter(category)}
                    className={cn(
                      'h-8 rounded px-2 text-[10px] font-black uppercase tracking-widest transition',
                      reviewCategoryFilter === category ? reviewCategoryTone(category) : 'text-slate-500 hover:bg-white',
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                {reviewConsole.filteredCases.map(caseItem => (
                  <button
                    key={caseItem.caseId}
                    type="button"
                    onClick={() => setSelectedReviewCaseId(caseItem.caseId)}
                    className={cn(
                      'grid w-full gap-3 border-b border-slate-100 p-3 text-left transition last:border-0 md:grid-cols-[minmax(0,1fr)_auto]',
                      selectedReviewCaseId === caseItem.caseId ? 'bg-blue-50' : 'bg-white hover:bg-slate-50',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', reviewCategoryTone(caseItem.category))}>
                          {caseItem.category}
                        </span>
                        <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', reviewSeverityTone(caseItem.severity))}>
                          {caseItem.severity}
                        </span>
                        <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', ownerTone(caseItem.owner))}>
                          {t(OWNER_LABEL_KEYS[caseItem.owner])}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm font-black text-slate-950">{caseItem.title}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{caseItem.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 md:justify-end">
                      <code className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{caseItem.caseId}</code>
                      <StatusPill status={caseItem.status === 'blocked' || caseItem.status === 'rejected' ? 'blocked' : caseItem.status === 'approved' || caseItem.status === 'resolved' ? 'ready' : 'attention'} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('selectedCase')}</p>
                {selectedReviewCase ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{selectedReviewCase.title}</p>
                      <p className="mt-1 break-all text-xs font-bold text-slate-500">{selectedReviewCase.caseId}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('category')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{selectedReviewCase.category}</p>
                      </div>
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('severity')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{selectedReviewCase.severity}</p>
                      </div>
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('decision')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{selectedReviewCase.decision}</p>
                      </div>
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('owner')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{t(OWNER_LABEL_KEYS[selectedReviewCase.owner])}</p>
                      </div>
                      <div className="rounded-md bg-white px-3 py-2 sm:col-span-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('queueLane')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{selectedReviewCase.queueLane}</p>
                      </div>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('subjectRef')}</p>
                      <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{selectedReviewCase.subjectRef}</p>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('nextAction')}</p>
                      <p className="mt-1 text-xs font-black text-slate-800">{selectedReviewCase.nextAction}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('evidence')}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedReviewCase.evidenceRefs.map(ref => (
                          <code key={ref} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{ref}</code>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('radarReasonCodeSummary')}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedReviewCase.radarReasonCodes.map(code => (
                          <code key={code} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{code}</code>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-bold text-slate-500">{t('noAttention')}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-[780px]">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5 text-indigo-700" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('redactedAuditReports')}</p>
                </div>
                <h2 className="mt-1 text-lg font-black text-slate-950">{t('reportQueue')}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{t('redactedAuditBody')}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                  <p className="text-lg font-black text-blue-900">{redactedAuditViewer.totals.pos}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-700">{t('posReports')}</p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-lg font-black text-emerald-900">{redactedAuditViewer.totals.delivery}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">{t('deliveryReports')}</p>
                </div>
                <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
                  <p className="text-lg font-black text-indigo-900">{redactedAuditViewer.totals.portal}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-700">{t('portalReports')}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="flex h-10 min-w-[260px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={auditReportQuery}
                  onChange={event => setAuditReportQuery(event.target.value)}
                  placeholder={t('search')}
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
                />
              </label>
              <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
                {(['all', ...REDACTED_AUDIT_REPORT_SURFACES] as AuditSurfaceFilter[]).map(surface => (
                  <button
                    key={surface}
                    type="button"
                    onClick={() => setAuditSurfaceFilter(surface)}
                    className={cn(
                      'h-8 rounded px-2 text-[10px] font-black uppercase tracking-widest transition',
                      auditSurfaceFilter === surface ? auditSurfaceTone(surface) : 'text-slate-500 hover:bg-white',
                    )}
                  >
                    {surface === 'all' ? t('allSurfaces') : surface}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                {redactedAuditViewer.filteredReports.map(report => {
                  const Icon = auditSurfaceIcon(report.surface);
                  return (
                    <button
                      key={report.reportId}
                      type="button"
                      onClick={() => setSelectedAuditReportId(report.reportId)}
                      className={cn(
                        'grid w-full gap-3 border-b border-slate-100 p-3 text-left transition last:border-0 md:grid-cols-[minmax(0,1fr)_auto]',
                        selectedAuditReportId === report.reportId ? 'bg-indigo-50' : 'bg-white hover:bg-slate-50',
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md border', auditSurfaceTone(report.surface))}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', auditSurfaceTone(report.surface))}>
                              {report.surface}
                            </span>
                            <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', report.accepted ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800')}>
                              {t('noPersonalData')}: {String(report.accepted)}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-sm font-black text-slate-950">{report.title}</p>
                          <p className="mt-1 truncate font-mono text-xs font-semibold text-slate-500">{report.reportRoot}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:justify-end">
                        <code className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{report.reportId}</code>
                        <StatusPill status={report.status === 'blocked' ? 'blocked' : report.status === 'verified' ? 'ready' : 'attention'} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('selectedReport')}</p>
                {selectedAuditReport ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', auditSurfaceTone(selectedAuditReport.surface))}>
                          {t('surface')}: {selectedAuditReport.surface}
                        </span>
                        <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', selectedAuditReport.accepted ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800')}>
                          {t('noPersonalData')}: {String(selectedAuditReport.accepted)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-black text-slate-950">{selectedAuditReport.title}</p>
                      <p className="mt-1 break-all text-xs font-bold text-slate-500">{selectedAuditReport.reportId}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('decision')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{selectedAuditReport.decision}</p>
                      </div>
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('owner')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{selectedAuditReport.actorRole}</p>
                      </div>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reportRef')}</p>
                      <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{selectedAuditReport.reportRef}</p>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('subjectRef')}</p>
                      <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{selectedAuditReport.subjectRef}</p>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('publicRoots')}</p>
                      <div className="mt-2 space-y-1">
                        {[
                          [t('receiptRoot'), selectedAuditReport.receiptRoot],
                          [t('nullifier'), selectedAuditReport.nullifierHash],
                          [t('deviceSignature'), selectedAuditReport.deviceSignatureRef],
                        ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
                          <p key={label} className="break-all font-mono text-[11px] font-bold text-slate-600">
                            <span className="font-black text-slate-400">{label}: </span>{value}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('evidence')}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedAuditReport.evidenceRefs.map(ref => (
                          <code key={ref} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{ref}</code>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('policyRefs')}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedAuditReport.policyRefs.map(ref => (
                          <code key={ref} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{ref}</code>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reasonCodes')}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedAuditReport.reasonCodes.map(ref => (
                          <code key={ref} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{ref}</code>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('redactionSummary')}</p>
                      <ul className="mt-2 space-y-1">
                        {selectedAuditReport.redaction.summary.map(item => (
                          <li key={item} className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-bold text-slate-500">{t('noAttention')}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-[780px]">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-amber-700" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('offlineSyncCenter')}</p>
                </div>
                <h2 className="mt-1 text-lg font-black text-slate-950">{t('offlineQueue')}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{t('offlineSyncBody')}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-lg font-black text-amber-900">{offlineSyncCenter.totals.pendingSync}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">{t('pendingSync')}</p>
                </div>
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
                  <p className="text-lg font-black text-rose-900">{offlineSyncCenter.totals.conflicts}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-rose-700">{t('syncConflicts')}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-lg font-black text-slate-900">{offlineSyncCenter.totals.usedNullifiers}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700">{t('usedNullifiers')}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-center sm:grid-cols-4">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-lg font-black text-emerald-900">{offlineSyncCenter.totals.synced}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">{t('synced')}</p>
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                <p className="text-lg font-black text-blue-900">{offlineSyncCenter.totals.pos}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-700">{t('posQueues')}</p>
              </div>
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-lg font-black text-emerald-900">{offlineSyncCenter.totals.field}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">{t('fieldQueues')}</p>
              </div>
              <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2">
                <p className="text-lg font-black text-violet-900">{offlineSyncCenter.totals.locker}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-violet-700">{t('lockerQueues')}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="flex h-10 min-w-[260px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={offlineSyncQuery}
                  onChange={event => setOfflineSyncQuery(event.target.value)}
                  placeholder={t('search')}
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
                />
              </label>
              <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
                {(['all', ...OFFLINE_SYNC_SURFACES] as OfflineSyncSurfaceFilter[]).map(surface => (
                  <button
                    key={surface}
                    type="button"
                    onClick={() => setOfflineSyncSurfaceFilter(surface)}
                    className={cn(
                      'h-8 rounded px-2 text-[10px] font-black uppercase tracking-widest transition',
                      offlineSyncSurfaceFilter === surface ? offlineSurfaceTone(surface) : 'text-slate-500 hover:bg-white',
                    )}
                  >
                    {surface === 'all' ? t('allSyncSurfaces') : surface}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                {offlineSyncCenter.filteredItems.length === 0 ? (
                  <p className="p-4 text-sm font-bold text-slate-500">{t('noAttention')}</p>
                ) : offlineSyncCenter.filteredItems.map(item => {
                  const Icon = offlineSurfaceIcon(item.surface);
                  return (
                    <button
                      key={item.itemId}
                      type="button"
                      onClick={() => setSelectedOfflineSyncItemId(item.itemId)}
                      className={cn(
                        'grid w-full gap-3 border-b border-slate-100 p-3 text-left transition last:border-0 md:grid-cols-[minmax(0,1fr)_auto]',
                        selectedOfflineSyncItemId === item.itemId ? 'bg-amber-50' : 'bg-white hover:bg-slate-50',
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md border', offlineSurfaceTone(item.surface))}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', offlineSurfaceTone(item.surface))}>
                              {item.surface}
                            </span>
                            <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', offlineStatusTone(item.status))}>
                              {item.status}
                            </span>
                            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              {t('refsAndCountsOnly')}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-sm font-black text-slate-950">{item.title}</p>
                          <p className="mt-1 truncate font-mono text-xs font-semibold text-slate-500">{item.itemRoot}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <span className="rounded bg-amber-100 px-2 py-1 text-xs font-black tabular-nums text-amber-800">
                          {t('pendingSync')}: {item.pendingCount}
                        </span>
                        <span className="rounded bg-rose-100 px-2 py-1 text-xs font-black tabular-nums text-rose-800">
                          {t('syncConflicts')}: {item.conflictCount}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-black tabular-nums text-slate-700">
                          {t('usedNullifiers')}: {item.usedNullifierCount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('selectedSyncItem')}</p>
                {selectedOfflineSyncItem ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', offlineSurfaceTone(selectedOfflineSyncItem.surface))}>
                          {t('surface')}: {selectedOfflineSyncItem.surface}
                        </span>
                        <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', offlineStatusTone(selectedOfflineSyncItem.status))}>
                          {selectedOfflineSyncItem.status}
                        </span>
                        <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', selectedOfflineSyncItem.accepted ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800')}>
                          {t('accepted')}: {String(selectedOfflineSyncItem.accepted)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-black text-slate-950">{selectedOfflineSyncItem.title}</p>
                      <p className="mt-1 break-all text-xs font-bold text-slate-500">{selectedOfflineSyncItem.itemId}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('pendingSync')}</p>
                        <p className="mt-1 text-xs font-black text-amber-800">{selectedOfflineSyncItem.pendingCount}</p>
                      </div>
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('syncConflicts')}</p>
                        <p className="mt-1 text-xs font-black text-rose-800">{selectedOfflineSyncItem.conflictCount}</p>
                      </div>
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('usedNullifiers')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{selectedOfflineSyncItem.usedNullifierCount}</p>
                      </div>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('deviceRef')}</p>
                      <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{selectedOfflineSyncItem.deviceRef}</p>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('queueRef')}</p>
                      <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{selectedOfflineSyncItem.queueRef}</p>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('syncRef')}</p>
                      <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{selectedOfflineSyncItem.syncRef}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('updatedAt')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{formatTime(selectedOfflineSyncItem.updatedAt)}</p>
                      </div>
                      <div className="rounded-md bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('lastSynced')}</p>
                        <p className="mt-1 text-xs font-black text-slate-800">{formatTime(selectedOfflineSyncItem.lastSyncedAt ?? null)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('nullifierTails')}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedOfflineSyncItem.usedNullifierTails.map(tail => (
                          <code key={tail} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{tail}</code>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('evidence')}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedOfflineSyncItem.evidenceRefs.map(ref => (
                          <code key={ref} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{ref}</code>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('actionRefs')}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedOfflineSyncItem.actionRefs.map(ref => (
                          <code key={ref} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{ref}</code>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-bold text-slate-500">{t('noAttention')}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('filters')}</p>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('sectionHealth')}</h2>
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <label className="flex h-10 min-w-[260px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 lg:max-w-[360px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder={t('search')}
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
                  />
                </label>
                <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
                  {ADDRESS_DASHBOARD_STATUS_FILTERS.map(filter => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={cn(
                        'h-8 rounded px-2 text-[10px] font-black uppercase tracking-widest transition',
                        statusFilter === filter ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-white',
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <DashboardSectionList
                consoleView={consoleView}
                selectedSection={selectedSection}
                setSelectedSection={section => setSelectedSection(section as AddressDashboardSection)}
              />
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('attentionFeed')}</h2>
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mb-3 flex flex-wrap gap-1">
              {(Object.keys(OWNER_LABEL_KEYS) as OwnerFilter[]).map(owner => (
                <button
                  key={owner}
                  type="button"
                  onClick={() => setOwnerFilter(owner)}
                  className={cn(
                    'rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest',
                    ownerFilter === owner ? ownerTone(owner) : 'border-slate-200 bg-slate-50 text-slate-500',
                  )}
                >
                  {t(OWNER_LABEL_KEYS[owner])}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredCommands.length === 0 ? (
                <p className="rounded-md bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-800">{t('noAttention')}</p>
              ) : filteredCommands.map(item => (
                <button
                  key={`${item.section}-${item.nextAction}`}
                  type="button"
                  onClick={() => setSelectedSection(item.section)}
                  className={cn('w-full rounded-md border p-3 text-left transition hover:shadow-sm', statusTone(item.status))}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-black">{item.reason}</p>
                    <span className="rounded bg-white/70 px-2 py-1 text-xs font-black tabular-nums">{item.count}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', ownerTone(item.owner))}>
                      {t(OWNER_LABEL_KEYS[item.owner])}
                    </span>
                    <code className="rounded bg-white/70 px-2 py-1 text-xs font-bold">{item.nextAction}</code>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('selectedSection')}</p>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('runbook')}</h2>
              </div>
              {selected && <StatusPill status={selected.status} />}
            </div>
            {selected && consoleView.runbook ? (
              <div>
                <div className="rounded-md bg-slate-50 px-3 py-3">
                  <p className="font-black text-slate-950">{selected.label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{t('owner')}: {t(OWNER_LABEL_KEYS[consoleView.runbook.owner])}</p>
                  <code className="mt-2 inline-flex rounded bg-white px-2 py-1 text-xs font-bold text-slate-700">{consoleView.runbook.primaryAction}</code>
                </div>
                <ol className="mt-3 space-y-2">
                  {consoleView.runbook.steps.map((step, index) => (
                    <li key={step} className="flex gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                      <span className="font-black text-slate-400">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('evidence')}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {consoleView.runbook.evidenceRefs.map(ref => (
                      <code key={ref} className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{ref}</code>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm font-bold text-slate-500">No selected section.</p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-700" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('launchReadiness')}</h2>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-3">
              <div className={cn('flex h-16 w-16 items-center justify-center rounded-md border text-xl font-black', statusTone(launchReadiness.status))}>
                {launchReadinessPublicState}
              </div>
              <div>
                <StatusPill status={launchReadiness.status} />
                <p className="mt-2 text-xs font-bold text-slate-500">
                  {launchReadiness.environment} / {launchReadiness.profile} / {launchReadiness.mode}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  pass {launchReadiness.totals.pass} / fail {launchReadiness.totals.fail} / warn {launchReadiness.totals.warn}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {launchReadiness.nextActions.slice(0, 3).map(action => (
                <p key={action} className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{action}</p>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('privacyBoundary')}</h2>
              </div>
              <span className={cn('rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-widest', consoleView.payloadSafety.safe ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800')}>
                {t('payloadSafe')}: {String(consoleView.payloadSafety.safe)}
              </span>
            </div>
            <p className="text-sm font-semibold leading-6 text-slate-600">{t('privacyBody')}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest">
              {Object.entries(consoleView.snapshot.privacy).map(([key, value]) => (
                <div
                  key={key}
                  className={cn(
                    'rounded-md border px-2 py-2',
                    value === false ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600',
                  )}
                >
                  <p className="break-words">{key}</p>
                  <p className="mt-1 text-xs">{String(value)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{t('safeExport')}</h2>
              <code className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                {consoleView.safeExport.exportId}
              </code>
            </div>
            <div className="rounded-md bg-slate-950 p-3 text-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">dashboardRoot</p>
              <p className="mt-1 break-all font-mono text-xs font-bold">{consoleView.safeExport.dashboardRoot}</p>
            </div>
            {safeExportText && (
              <pre className="mt-3 max-h-44 overflow-auto rounded-md bg-slate-950 p-3 text-xs font-bold leading-5 text-slate-100">
                {safeExportText}
              </pre>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
};
