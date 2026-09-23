import { addressConnectPrivateMaterialPaths } from './addressConnect';
import {
  cleanBoolean,
  cleanText,
  cleanTextArray,
  hashStable,
  stableId,
  stableJson,
  toIsoTimestamp,
} from './redactedWorkflowCore';

export const REDACTED_AUDIT_REPORT_VIEWER_VERSION = 'agid-redacted-audit-report-viewer-v1';

export const REDACTED_AUDIT_REPORT_SURFACES = ['pos', 'delivery', 'portal'] as const;
export const REDACTED_AUDIT_REPORT_STATUSES = ['verified', 'needs-review', 'blocked'] as const;
export const REDACTED_AUDIT_REPORT_DECISIONS = ['accept', 'review', 'reject', 'escalate'] as const;
export const REDACTED_AUDIT_ACTOR_ROLES = [
  'pos-staff',
  'carrier',
  'recipient',
  'portal-user',
  'admin',
  'auditor',
  'system',
] as const;

export type RedactedAuditReportSurface = (typeof REDACTED_AUDIT_REPORT_SURFACES)[number];
export type RedactedAuditReportStatus = (typeof REDACTED_AUDIT_REPORT_STATUSES)[number];
export type RedactedAuditReportDecision = (typeof REDACTED_AUDIT_REPORT_DECISIONS)[number];
export type RedactedAuditActorRole = (typeof REDACTED_AUDIT_ACTOR_ROLES)[number];
export type RedactedAuditSurfaceFilter = RedactedAuditReportSurface | 'all';

export type RedactedAuditReportInput = {
  reportId?: unknown;
  surface?: unknown;
  title?: unknown;
  status?: unknown;
  decision?: unknown;
  actorRole?: unknown;
  occurredAt?: unknown;
  reportRef?: unknown;
  subjectRef?: unknown;
  evidenceRefs?: unknown;
  policyRefs?: unknown;
  receiptRoot?: unknown;
  nullifierHash?: unknown;
  deviceSignatureRef?: unknown;
  issuerRef?: unknown;
  freshnessRoot?: unknown;
  revocationRoot?: unknown;
  redactionSummary?: unknown;
  reasonCodes?: unknown;
  containsPersonalData?: unknown;
  containsRawLocationData?: unknown;
  sourcePayload?: unknown;
};

export type RedactedAuditReport = {
  schemaVersion: typeof REDACTED_AUDIT_REPORT_VIEWER_VERSION;
  reportId: string;
  surface: RedactedAuditReportSurface;
  title: string;
  status: RedactedAuditReportStatus;
  decision: RedactedAuditReportDecision;
  actorRole: RedactedAuditActorRole;
  occurredAt: string;
  reportRef: string;
  subjectRef: string;
  evidenceRefs: string[];
  policyRefs: string[];
  reasonCodes: string[];
  receiptRoot?: string;
  nullifierHash?: string;
  deviceSignatureRef?: string;
  issuerRef?: string;
  freshnessRoot?: string;
  revocationRoot?: string;
  reportRoot: string;
  accepted: boolean;
  redaction: {
    personalDataRemoved: true;
    locationMaterialRemoved: true;
    publicRefsOnly: boolean;
    summary: string[];
  };
  privacy: {
    personalDataAccepted: false;
    preciseLocationAccepted: false;
    subjectSecretAccepted: false;
    commitmentsAndRefsOnly: true;
    forbiddenPaths: string[];
  };
  errors: string[];
  warnings: string[];
};

export type RedactedAuditReportViewerInput = {
  reports?: readonly RedactedAuditReportInput[];
  query?: unknown;
  surfaceFilter?: unknown;
  selectedReportId?: unknown;
  generatedAt?: unknown;
};

export type RedactedAuditReportViewer = {
  schemaVersion: typeof REDACTED_AUDIT_REPORT_VIEWER_VERSION;
  generatedAt: string;
  reports: RedactedAuditReport[];
  filteredReports: RedactedAuditReport[];
  selectedReport: RedactedAuditReport | null;
  totals: {
    total: number;
    accepted: number;
    blocked: number;
    needsReview: number;
    verified: number;
    pos: number;
    delivery: number;
    portal: number;
  };
  surfaceFilter: RedactedAuditSurfaceFilter;
  query: string;
  safeExport: {
    schemaVersion: typeof REDACTED_AUDIT_REPORT_VIEWER_VERSION;
    exportId: string;
    generatedAt: string;
    reportRoots: string[];
    selectedReportRoot: string | null;
    totals: RedactedAuditReportViewer['totals'];
  };
  payloadSafety: {
    safe: boolean;
    forbiddenPaths: string[];
  };
};

function cleanEnum<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  const text = cleanText(value).toLowerCase();
  return allowed.includes(text as T[number]) ? text as T[number] : fallback;
}

function privateMaterialErrors(input: unknown) {
  return addressConnectPrivateMaterialPaths(input)
    .map(path => `private-material-not-accepted:${path}`);
}

function compactRefs(value: unknown, limit = 16) {
  return Array.from(new Set(cleanTextArray(value).map(ref => ref.slice(0, 128)))).slice(0, limit);
}

function buildReportRoot(report: Omit<RedactedAuditReport, 'reportRoot'>) {
  return hashStable({
    schemaVersion: report.schemaVersion,
    reportId: report.reportId,
    surface: report.surface,
    status: report.status,
    decision: report.decision,
    reportRef: report.reportRef,
    subjectRef: report.subjectRef,
    evidenceRefs: report.evidenceRefs,
    policyRefs: report.policyRefs,
    receiptRoot: report.receiptRoot,
    nullifierHash: report.nullifierHash,
    deviceSignatureRef: report.deviceSignatureRef,
    issuerRef: report.issuerRef,
    freshnessRoot: report.freshnessRoot,
    revocationRoot: report.revocationRoot,
    reasonCodes: report.reasonCodes,
  });
}

export function buildRedactedAuditReport(input: RedactedAuditReportInput = {}): RedactedAuditReport {
  const errors = privateMaterialErrors(input);
  const warnings: string[] = [];
  const containsPersonalData = cleanBoolean(input.containsPersonalData, false);
  const containsRawLocationData = cleanBoolean(input.containsRawLocationData, false);

  if (containsPersonalData) errors.push('personal-data-not-accepted');
  if (containsRawLocationData) errors.push('precise-location-material-not-accepted');

  const surface = cleanEnum(input.surface, REDACTED_AUDIT_REPORT_SURFACES, 'pos');
  const actorRole = cleanEnum(input.actorRole, REDACTED_AUDIT_ACTOR_ROLES, surface === 'portal' ? 'portal-user' : 'system');
  const evidenceRefs = compactRefs(input.evidenceRefs);
  const policyRefs = compactRefs(input.policyRefs);
  const reasonCodes = compactRefs(input.reasonCodes, 10);
  const reportRef = cleanText(input.reportRef, '', 96);
  const subjectRef = cleanText(input.subjectRef, '', 96);

  if (!reportRef) warnings.push('missing-report-ref');
  if (!subjectRef) warnings.push('missing-subject-ref');
  if (evidenceRefs.length === 0) warnings.push('missing-evidence-ref');
  if (policyRefs.length === 0) warnings.push('missing-policy-ref');

  const accepted = errors.length === 0;
  const fallbackStatus: RedactedAuditReportStatus = accepted && warnings.length === 0 ? 'verified' : accepted ? 'needs-review' : 'blocked';
  const status = cleanEnum(input.status, REDACTED_AUDIT_REPORT_STATUSES, fallbackStatus);
  const decision = cleanEnum(
    input.decision,
    REDACTED_AUDIT_REPORT_DECISIONS,
    status === 'verified' ? 'accept' : status === 'blocked' ? 'reject' : 'review',
  );
  const redactionSummary = compactRefs(input.redactionSummary, 8);
  const title = cleanText(input.title, `${surface.toUpperCase()} redacted audit report`, 96);
  const occurredAt = toIsoTimestamp(input.occurredAt);
  const reportId = cleanText(input.reportId, '', 48) || stableId('RAR', {
    surface,
    title,
    occurredAt,
    reportRef,
    subjectRef,
  });

  const reportWithoutRoot: Omit<RedactedAuditReport, 'reportRoot'> = {
    schemaVersion: REDACTED_AUDIT_REPORT_VIEWER_VERSION,
    reportId,
    surface,
    title,
    status,
    decision,
    actorRole,
    occurredAt,
    reportRef: reportRef || stableId('report-ref', { surface, reportId }, { length: 16, uppercase: false }),
    subjectRef: subjectRef || stableId('subject-ref', { surface, reportId }, { length: 16, uppercase: false }),
    evidenceRefs,
    policyRefs,
    reasonCodes,
    receiptRoot: cleanText(input.receiptRoot, '', 96) || undefined,
    nullifierHash: cleanText(input.nullifierHash, '', 96) || undefined,
    deviceSignatureRef: cleanText(input.deviceSignatureRef, '', 96) || undefined,
    issuerRef: cleanText(input.issuerRef, '', 96) || undefined,
    freshnessRoot: cleanText(input.freshnessRoot, '', 96) || undefined,
    revocationRoot: cleanText(input.revocationRoot, '', 96) || undefined,
    accepted,
    redaction: {
      personalDataRemoved: true,
      locationMaterialRemoved: true,
      publicRefsOnly: accepted,
      summary: redactionSummary.length > 0
        ? redactionSummary
        : ['direct identifiers removed', 'only commitments, roots, aliases, and receipt refs retained'],
    },
    privacy: {
      personalDataAccepted: false,
      preciseLocationAccepted: false,
      subjectSecretAccepted: false,
      commitmentsAndRefsOnly: true,
      forbiddenPaths: addressConnectPrivateMaterialPaths(input),
    },
    errors,
    warnings,
  };

  return {
    ...reportWithoutRoot,
    reportRoot: buildReportRoot(reportWithoutRoot),
  };
}

function matchesQuery(report: RedactedAuditReport, query: string) {
  if (!query) return true;
  const haystack = [
    report.reportId,
    report.surface,
    report.title,
    report.status,
    report.decision,
    report.actorRole,
    report.reportRef,
    report.subjectRef,
    report.receiptRoot,
    report.nullifierHash,
    report.deviceSignatureRef,
    report.issuerRef,
    ...report.evidenceRefs,
    ...report.policyRefs,
    ...report.reasonCodes,
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function cleanSurfaceFilter(value: unknown): RedactedAuditSurfaceFilter {
  const text = cleanText(value).toLowerCase();
  if (text === 'all') return 'all';
  return REDACTED_AUDIT_REPORT_SURFACES.includes(text as RedactedAuditReportSurface)
    ? text as RedactedAuditReportSurface
    : 'all';
}

function countSurface(reports: RedactedAuditReport[], surface: RedactedAuditReportSurface) {
  return reports.filter(report => report.surface === surface).length;
}

export function validateRedactedAuditReportViewerPayloadIsSafe(value: unknown) {
  const forbiddenPaths = addressConnectPrivateMaterialPaths(value);
  return {
    safe: forbiddenPaths.length === 0,
    forbiddenPaths,
  };
}

export function buildRedactedAuditReportViewer(input: RedactedAuditReportViewerInput = {}): RedactedAuditReportViewer {
  const generatedAt = toIsoTimestamp(input.generatedAt);
  const query = cleanText(input.query, '', 120);
  const surfaceFilter = cleanSurfaceFilter(input.surfaceFilter);
  const reports = (input.reports ?? []).map(report => buildRedactedAuditReport(report));
  const filteredReports = reports.filter(report => (
    (surfaceFilter === 'all' || report.surface === surfaceFilter)
    && matchesQuery(report, query)
  ));
  const selectedReportId = cleanText(input.selectedReportId);
  const selectedReport = filteredReports.find(report => report.reportId === selectedReportId)
    ?? filteredReports[0]
    ?? reports[0]
    ?? null;
  const totals = {
    total: reports.length,
    accepted: reports.filter(report => report.accepted).length,
    blocked: reports.filter(report => report.status === 'blocked').length,
    needsReview: reports.filter(report => report.status === 'needs-review').length,
    verified: reports.filter(report => report.status === 'verified').length,
    pos: countSurface(reports, 'pos'),
    delivery: countSurface(reports, 'delivery'),
    portal: countSurface(reports, 'portal'),
  };
  const safeExport = {
    schemaVersion: REDACTED_AUDIT_REPORT_VIEWER_VERSION as typeof REDACTED_AUDIT_REPORT_VIEWER_VERSION,
    exportId: stableId('RAE', {
      generatedAt,
      reportRoots: reports.map(report => report.reportRoot),
      selectedReportRoot: selectedReport?.reportRoot ?? null,
    }),
    generatedAt,
    reportRoots: reports.map(report => report.reportRoot),
    selectedReportRoot: selectedReport?.reportRoot ?? null,
    totals,
  };

  return {
    schemaVersion: REDACTED_AUDIT_REPORT_VIEWER_VERSION,
    generatedAt,
    reports,
    filteredReports,
    selectedReport,
    totals,
    surfaceFilter,
    query,
    safeExport,
    payloadSafety: validateRedactedAuditReportViewerPayloadIsSafe(safeExport),
  };
}

export function listRedactedAuditReportViewerCapabilities() {
  return {
    schemaVersion: REDACTED_AUDIT_REPORT_VIEWER_VERSION,
    surfaces: [...REDACTED_AUDIT_REPORT_SURFACES],
    statuses: [...REDACTED_AUDIT_REPORT_STATUSES],
    decisions: [...REDACTED_AUDIT_REPORT_DECISIONS],
    rejectsPrivateMaterial: true,
    safeExportFields: ['reportRoots', 'selectedReportRoot', 'totals'],
    forbiddenInputDetector: 'addressConnectPrivateMaterialPaths',
    stableSerialization: stableJson({
      schemaVersion: REDACTED_AUDIT_REPORT_VIEWER_VERSION,
      surfaces: REDACTED_AUDIT_REPORT_SURFACES,
    }),
  };
}
