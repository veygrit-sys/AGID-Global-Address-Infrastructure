import { sha256Hex } from './sha256';

export const DELIVERY_REACHABILITY_REPORT_VERSION = 'delivery-reachability-report-v1';
export const DELIVERY_REACHABILITY_COMMITMENT_ALGORITHM = 'sha256-delivery-reachability-commitment-v1';

export type DeliveryReachabilityReporterType =
  | 'carrier'
  | 'drone-operator'
  | 'autonomous-device'
  | 'public-user'
  | 'municipality'
  | 'ngo'
  | 'warehouse'
  | 'merchant';

export type DeliveryReachabilityProblemKind =
  | 'address-not-found'
  | 'access-blocked'
  | 'road-closed'
  | 'bridge-closed'
  | 'unsafe-area'
  | 'private-access-required'
  | 'building-entry-failed'
  | 'drone-no-fly'
  | 'drone-landing-impossible'
  | 'water-crossing'
  | 'terrain-unreachable'
  | 'weather-temporary'
  | 'geocode-wrong'
  | 'delivery-refused'
  | 'customs-or-border-hold'
  | 'other';

export type DeliveryReachabilityPublicProblemKind =
  | DeliveryReachabilityProblemKind
  | 'access-limited'
  | 'review-pending';

export type DeliveryReachabilitySeverity =
  | 'info'
  | 'minor'
  | 'major'
  | 'blocker';

export type DeliveryReachabilityStatus =
  | 'reported'
  | 'confirmed'
  | 'disputed'
  | 'resolved'
  | 'expired';

export type DeliveryReachabilityPublicationState =
  | 'public'
  | 'aggregated-only'
  | 'review-first'
  | 'restricted';

export type DeliveryReachabilityAudience =
  | 'public-map'
  | 'verified-carriers'
  | 'municipality-or-ngo'
  | 'tenant-private'
  | 'local-only';

export type DeliveryReachabilityEvidenceKind =
  | 'signed-carrier-scan'
  | 'signed-drone-telemetry'
  | 'device-attestation'
  | 'photo-redacted'
  | 'photo-original'
  | 'operator-note'
  | 'recipient-report'
  | 'municipal-notice'
  | 'weather-source'
  | 'map-correction'
  | 'sensor-reading';

export type DeliveryReachabilityTimeWindow = {
  startsAt?: string;
  endsAt?: string;
  observedAt?: string;
  expectedDuration?: 'minutes' | 'hours' | 'days' | 'seasonal' | 'unknown' | 'permanent';
};

export type DeliveryReachabilityEvidence = {
  kind: DeliveryReachabilityEvidenceKind;
  label?: string;
  signed?: boolean;
  redacted?: boolean;
  containsPersonalData?: boolean;
  containsPreciseTelemetry?: boolean;
  containsExif?: boolean;
  sourceRef?: string;
};

export type DeliveryReachabilityReportInput = {
  problemKind: DeliveryReachabilityProblemKind;
  severity?: DeliveryReachabilitySeverity;
  status?: DeliveryReachabilityStatus;
  reporterType: DeliveryReachabilityReporterType;
  reporterId?: string;
  reporterCredentialRef?: string;
  reporterTrusted?: boolean;
  carrierId?: string;
  deviceId?: string;
  terminalId?: string;
  agid?: string;
  coarseAgid?: string;
  aoid?: string;
  rawAddress?: string;
  latitude?: number;
  longitude?: number;
  regionCode?: string;
  countryCode?: string;
  routeId?: string;
  publicNote?: string;
  privateNote?: string;
  timeWindow?: DeliveryReachabilityTimeWindow;
  evidence?: DeliveryReachabilityEvidence[];
  confirmationCount?: number;
  highRiskMode?: boolean;
  sourceDomain?: string;
  now?: string;
};

export type DeliveryReachabilityPublicProjection = {
  version: typeof DELIVERY_REACHABILITY_REPORT_VERSION;
  reportId: string;
  publicationState: DeliveryReachabilityPublicationState;
  problemKind: DeliveryReachabilityPublicProblemKind;
  severity: DeliveryReachabilitySeverity;
  status: DeliveryReachabilityStatus;
  confidence: number;
  coarseAgid?: string;
  regionCode?: string;
  countryCode?: string;
  reporterClass: 'verified-operator' | 'public' | 'public-sector' | 'system';
  evidenceClasses: string[];
  timeWindow: DeliveryReachabilityTimeWindow;
  publicNote?: string;
  updatedAt: string;
  ttlSeconds: number;
};

export type DeliveryReachabilityRestrictedProjection = {
  reportId: string;
  domain: string;
  audience: DeliveryReachabilityAudience[];
  commitments: Record<string, string>;
  closedFields: string[];
  sensitiveTags: string[];
  evidenceCommitments: string[];
  rawStoragePolicy: 'local-device-or-encrypted-vault';
};

export type DeliveryReachabilitySharingPolicy = {
  publicationState: DeliveryReachabilityPublicationState;
  publicAudience: DeliveryReachabilityAudience[];
  restrictedAudience: DeliveryReachabilityAudience[];
  reasons: string[];
  warnings: string[];
  recommendedAction:
    | 'publish-public-warning'
    | 'publish-aggregate-only'
    | 'queue-manual-review'
    | 'share-restricted'
    | 'keep-local-only';
};

export type DeliveryReachabilityReport = {
  version: typeof DELIVERY_REACHABILITY_REPORT_VERSION;
  reportId: string;
  createdAt: string;
  sourceDomain: string;
  inputFingerprint: string;
  publicProjection: DeliveryReachabilityPublicProjection;
  restrictedProjection: DeliveryReachabilityRestrictedProjection;
  sharingPolicy: DeliveryReachabilitySharingPolicy;
  privacy: {
    publicContainsRawAddress: false;
    publicContainsRawAgid: false;
    publicContainsRawAoid: false;
    publicContainsReporterIdentity: false;
    publicContainsPreciseCoordinates: false;
    restrictedUsesCommitmentsOnly: true;
  };
};

export type DeliveryReachabilitySharedFeedItem = {
  feedId: string;
  publicationState: DeliveryReachabilityPublicationState;
  problemKind: DeliveryReachabilityPublicProblemKind;
  severity: DeliveryReachabilitySeverity;
  status: DeliveryReachabilityStatus;
  confidence: number;
  reportCount: number;
  coarseAgid?: string;
  regionCode?: string;
  countryCode?: string;
  reporterClasses: DeliveryReachabilityPublicProjection['reporterClass'][];
  evidenceClasses: string[];
  ttlSeconds: number;
  updatedAt: string;
};

export type DeliveryReachabilityValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const VERIFIED_REPORTERS = new Set<DeliveryReachabilityReporterType>([
  'carrier',
  'drone-operator',
  'autonomous-device',
  'municipality',
  'ngo',
  'warehouse',
  'merchant',
]);

const PUBLIC_SECTOR_REPORTERS = new Set<DeliveryReachabilityReporterType>([
  'municipality',
  'ngo',
]);

const PUBLIC_SAFE_PROBLEMS = new Set<DeliveryReachabilityProblemKind>([
  'road-closed',
  'bridge-closed',
  'water-crossing',
  'terrain-unreachable',
  'weather-temporary',
  'geocode-wrong',
]);

const SENSITIVE_PROBLEMS = new Set<DeliveryReachabilityProblemKind>([
  'unsafe-area',
  'private-access-required',
  'building-entry-failed',
  'drone-no-fly',
  'drone-landing-impossible',
  'customs-or-border-hold',
  'delivery-refused',
]);

const HIGH_RISK_PROBLEMS = new Set<DeliveryReachabilityProblemKind>([
  'unsafe-area',
  'drone-no-fly',
  'drone-landing-impossible',
  'private-access-required',
]);

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isFiniteCoordinate(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value);
}

function cleanCountryCode(value: unknown) {
  const text = clean(value).toUpperCase().replace(/[^A-Z]/g, '');
  return text.length >= 2 ? text.slice(0, 2) : undefined;
}

function cleanRegionCode(value: unknown) {
  const text = clean(value).toUpperCase().replace(/[^A-Z0-9._:-]+/g, '-');
  return text || undefined;
}

function cleanToken(value: unknown) {
  const text = clean(value).replace(/[^A-Za-z0-9._:-]+/g, '-');
  return text || undefined;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, nested]) => nested !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    .join(',')}}`;
}

function commitment(domain: string, field: string, value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  return `reach:${sha256Hex(stableStringify({
    algorithm: DELIVERY_REACHABILITY_COMMITMENT_ALGORITHM,
    domain,
    field,
    value,
  }))}`;
}

function reporterClass(input: DeliveryReachabilityReportInput): DeliveryReachabilityPublicProjection['reporterClass'] {
  if (input.reporterType === 'public-user') return 'public';
  if (PUBLIC_SECTOR_REPORTERS.has(input.reporterType)) return 'public-sector';
  if (input.reporterType === 'autonomous-device') return 'system';
  return 'verified-operator';
}

function reporterTrusted(input: DeliveryReachabilityReportInput) {
  return Boolean(input.reporterTrusted || input.reporterCredentialRef || VERIFIED_REPORTERS.has(input.reporterType));
}

function normalizeEvidence(input: DeliveryReachabilityReportInput) {
  return (input.evidence || []).map(item => ({
    ...item,
    label: clean(item.label),
    sourceRef: cleanToken(item.sourceRef),
  }));
}

function evidenceClasses(evidence: DeliveryReachabilityEvidence[]) {
  return Array.from(new Set(evidence.map(item => {
    if (item.kind.includes('photo')) return item.redacted ? 'redacted-photo' : 'restricted-photo';
    if (item.kind.includes('signed')) return 'signed-report';
    if (item.kind.includes('municipal')) return 'public-notice';
    if (item.kind.includes('weather')) return 'weather';
    if (item.kind.includes('sensor')) return 'sensor';
    if (item.kind.includes('telemetry')) return 'restricted-telemetry';
    return 'operator-note';
  })));
}

function hasSensitiveEvidence(evidence: DeliveryReachabilityEvidence[]) {
  return evidence.some(item => (
    item.containsPersonalData
    || item.containsPreciseTelemetry
    || item.containsExif
    || item.kind === 'photo-original'
    || item.kind === 'signed-drone-telemetry'
  ));
}

function normalizeProblemForPublic(
  input: DeliveryReachabilityReportInput,
  publicationState: DeliveryReachabilityPublicationState,
): DeliveryReachabilityPublicProblemKind {
  if (publicationState === 'review-first') return 'review-pending';
  if (publicationState === 'restricted' && SENSITIVE_PROBLEMS.has(input.problemKind)) return 'access-limited';
  if (publicationState === 'aggregated-only' && HIGH_RISK_PROBLEMS.has(input.problemKind)) return 'access-limited';
  return input.problemKind;
}

function calculateConfidence(input: DeliveryReachabilityReportInput, evidence: DeliveryReachabilityEvidence[]) {
  let confidence = reporterTrusted(input) ? 0.62 : 0.28;
  if (input.reporterType === 'municipality') confidence += 0.16;
  if (input.reporterType === 'carrier') confidence += 0.1;
  if (input.reporterType === 'drone-operator' || input.reporterType === 'autonomous-device') confidence += 0.08;
  if (input.reporterCredentialRef) confidence += 0.08;
  if (evidence.some(item => item.signed)) confidence += 0.08;
  if (evidence.some(item => item.kind === 'municipal-notice')) confidence += 0.12;
  if (evidence.some(item => item.kind === 'photo-redacted')) confidence += 0.04;
  confidence += clamp(input.confirmationCount || 0, 0, 8) * 0.035;
  if (input.highRiskMode) confidence -= 0.06;
  return Number(clamp(confidence, 0.05, 0.98).toFixed(2));
}

function chooseTtlSeconds(input: DeliveryReachabilityReportInput) {
  if (input.timeWindow?.expectedDuration === 'minutes') return 15 * 60;
  if (input.timeWindow?.expectedDuration === 'hours') return 6 * 60 * 60;
  if (input.timeWindow?.expectedDuration === 'days') return 24 * 60 * 60;
  if (input.timeWindow?.expectedDuration === 'seasonal') return 14 * 24 * 60 * 60;
  if (input.timeWindow?.expectedDuration === 'permanent') return 30 * 24 * 60 * 60;
  if (input.problemKind === 'weather-temporary') return 3 * 60 * 60;
  if (input.problemKind === 'road-closed' || input.problemKind === 'bridge-closed') return 24 * 60 * 60;
  return 12 * 60 * 60;
}

function buildSharingPolicy(
  input: DeliveryReachabilityReportInput,
  evidence: DeliveryReachabilityEvidence[],
): DeliveryReachabilitySharingPolicy {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const trusted = reporterTrusted(input);
  const sensitiveProblem = SENSITIVE_PROBLEMS.has(input.problemKind);
  const highRisk = Boolean(input.highRiskMode || HIGH_RISK_PROBLEMS.has(input.problemKind));
  const sensitiveEvidence = hasSensitiveEvidence(evidence);
  const publicSafe = PUBLIC_SAFE_PROBLEMS.has(input.problemKind);
  const confirmations = Math.max(0, input.confirmationCount || 0);

  if (!trusted) {
    reasons.push('untrusted-reporter');
    warnings.push('Public reports require aggregation or manual review before broad publication.');
  }
  if (sensitiveProblem) reasons.push('sensitive-reachability-problem');
  if (highRisk) reasons.push('high-risk-location-or-route');
  if (sensitiveEvidence) {
    reasons.push('sensitive-evidence');
    warnings.push('Original photos, telemetry, EXIF, and personal data must remain closed.');
  }

  if (highRisk || sensitiveEvidence) {
    return {
      publicationState: 'restricted',
      publicAudience: [],
      restrictedAudience: ['verified-carriers', 'municipality-or-ngo', 'tenant-private'],
      reasons,
      warnings,
      recommendedAction: 'share-restricted',
    };
  }

  if (!trusted && confirmations < 2) {
    return {
      publicationState: 'review-first',
      publicAudience: [],
      restrictedAudience: ['municipality-or-ngo', 'tenant-private'],
      reasons,
      warnings,
      recommendedAction: 'queue-manual-review',
    };
  }

  if (sensitiveProblem && confirmations < 3) {
    return {
      publicationState: 'aggregated-only',
      publicAudience: ['public-map'],
      restrictedAudience: ['verified-carriers', 'municipality-or-ngo', 'tenant-private'],
      reasons,
      warnings,
      recommendedAction: 'publish-aggregate-only',
    };
  }

  if (publicSafe || trusted || confirmations >= 2) {
    return {
      publicationState: 'public',
      publicAudience: ['public-map'],
      restrictedAudience: ['verified-carriers', 'municipality-or-ngo', 'tenant-private'],
      reasons,
      warnings,
      recommendedAction: 'publish-public-warning',
    };
  }

  return {
    publicationState: 'local-only',
    publicAudience: [],
    restrictedAudience: ['local-only'],
    reasons: [...reasons, 'insufficient-publication-evidence'],
    warnings,
    recommendedAction: 'keep-local-only',
  } as never;
}

function coarseAgidFor(input: DeliveryReachabilityReportInput) {
  const coarse = cleanToken(input.coarseAgid);
  if (coarse) return coarse.toUpperCase();
  const agid = cleanToken(input.agid);
  if (!agid) return undefined;
  const compact = agid.toUpperCase().replace(/[^0-9A-Z]/g, '');
  return compact.length > 8 ? `${compact.slice(0, 8)}*` : compact;
}

function publicNoteFor(input: DeliveryReachabilityReportInput, policy: DeliveryReachabilitySharingPolicy) {
  const note = clean(input.publicNote).slice(0, 180);
  if (policy.publicationState === 'restricted') return undefined;
  return note || undefined;
}

function closedFieldsFor(input: DeliveryReachabilityReportInput, evidence: DeliveryReachabilityEvidence[]) {
  const fields: string[] = [];
  if (clean(input.rawAddress)) fields.push('rawAddress');
  if (clean(input.aoid)) fields.push('aoid');
  if (clean(input.agid)) fields.push('preciseAgid');
  if (isFiniteCoordinate(input.latitude) || isFiniteCoordinate(input.longitude)) fields.push('preciseCoordinates');
  if (clean(input.reporterId)) fields.push('reporterId');
  if (clean(input.deviceId)) fields.push('deviceId');
  if (clean(input.terminalId)) fields.push('terminalId');
  if (clean(input.privateNote)) fields.push('privateNote');
  if (evidence.some(item => item.kind === 'photo-original')) fields.push('originalEvidence');
  if (evidence.some(item => item.containsExif)) fields.push('evidenceExif');
  if (evidence.some(item => item.containsPersonalData)) fields.push('personalEvidence');
  if (evidence.some(item => item.containsPreciseTelemetry)) fields.push('preciseTelemetry');
  return Array.from(new Set(fields));
}

function sensitiveTagsFor(input: DeliveryReachabilityReportInput, evidence: DeliveryReachabilityEvidence[]) {
  const tags: string[] = [];
  if (input.highRiskMode) tags.push('high-risk-mode');
  if (HIGH_RISK_PROBLEMS.has(input.problemKind)) tags.push('high-risk-problem');
  if (input.problemKind.includes('drone')) tags.push('drone-route-sensitive');
  if (input.problemKind === 'unsafe-area') tags.push('public-safety-sensitive');
  if (input.problemKind === 'private-access-required' || input.problemKind === 'building-entry-failed') tags.push('private-access-sensitive');
  if (hasSensitiveEvidence(evidence)) tags.push('sensitive-evidence');
  return Array.from(new Set(tags));
}

export function createDeliveryReachabilityReport(
  input: DeliveryReachabilityReportInput,
): DeliveryReachabilityReport {
  const createdAt = clean(input.now) || new Date().toISOString();
  const domain = cleanToken(input.sourceDomain) || 'delivery-reachability';
  const evidence = normalizeEvidence(input);
  const sharingPolicy = buildSharingPolicy(input, evidence);
  const inputFingerprint = sha256Hex(stableStringify({
    domain,
    problemKind: input.problemKind,
    reporterType: input.reporterType,
    agid: cleanToken(input.agid),
    coarseAgid: cleanToken(input.coarseAgid),
    rawAddress: clean(input.rawAddress),
    aoid: clean(input.aoid),
    latitude: isFiniteCoordinate(input.latitude) ? input.latitude : undefined,
    longitude: isFiniteCoordinate(input.longitude) ? input.longitude : undefined,
    observedAt: input.timeWindow?.observedAt,
    reporterId: clean(input.reporterId),
    deviceId: clean(input.deviceId),
  }));
  const reportId = `reach-${inputFingerprint.slice(0, 24)}`;
  const status = input.status || (reporterTrusted(input) ? 'confirmed' : 'reported');
  const severity = input.severity || (
    input.problemKind === 'road-closed'
    || input.problemKind === 'bridge-closed'
    || input.problemKind === 'drone-no-fly'
    || input.problemKind === 'unsafe-area'
      ? 'blocker'
      : 'major'
  );

  const commitments: Record<string, string> = {};
  const addCommitment = (field: string, value: unknown) => {
    const committed = commitment(domain, field, value);
    if (committed) commitments[field] = committed;
  };
  addCommitment('agid', cleanToken(input.agid));
  addCommitment('coarseAgid', cleanToken(input.coarseAgid));
  addCommitment('aoid', clean(input.aoid));
  addCommitment('rawAddress', clean(input.rawAddress));
  addCommitment('reporterId', clean(input.reporterId));
  addCommitment('reporterCredentialRef', clean(input.reporterCredentialRef));
  addCommitment('deviceId', clean(input.deviceId));
  addCommitment('terminalId', clean(input.terminalId));
  addCommitment('carrierId', clean(input.carrierId));
  addCommitment('routeId', clean(input.routeId));
  addCommitment('coordinates', isFiniteCoordinate(input.latitude) && isFiniteCoordinate(input.longitude)
    ? `${input.latitude},${input.longitude}`
    : undefined);
  addCommitment('privateNote', clean(input.privateNote));

  const publicationState = sharingPolicy.publicationState;
  const publicProjection: DeliveryReachabilityPublicProjection = {
    version: DELIVERY_REACHABILITY_REPORT_VERSION,
    reportId,
    publicationState,
    problemKind: normalizeProblemForPublic(input, publicationState),
    severity,
    status,
    confidence: calculateConfidence(input, evidence),
    coarseAgid: coarseAgidFor(input),
    regionCode: cleanRegionCode(input.regionCode),
    countryCode: cleanCountryCode(input.countryCode),
    reporterClass: reporterClass(input),
    evidenceClasses: evidenceClasses(evidence).filter(item => !item.startsWith('restricted')),
    timeWindow: {
      startsAt: clean(input.timeWindow?.startsAt) || undefined,
      endsAt: clean(input.timeWindow?.endsAt) || undefined,
      observedAt: clean(input.timeWindow?.observedAt) || createdAt,
      expectedDuration: input.timeWindow?.expectedDuration || 'unknown',
    },
    publicNote: publicNoteFor(input, sharingPolicy),
    updatedAt: createdAt,
    ttlSeconds: chooseTtlSeconds(input),
  };

  return {
    version: DELIVERY_REACHABILITY_REPORT_VERSION,
    reportId,
    createdAt,
    sourceDomain: domain,
    inputFingerprint,
    publicProjection,
    restrictedProjection: {
      reportId,
      domain,
      audience: sharingPolicy.restrictedAudience,
      commitments,
      closedFields: closedFieldsFor(input, evidence),
      sensitiveTags: sensitiveTagsFor(input, evidence),
      evidenceCommitments: evidence.map((item, index) => commitment(domain, `evidence.${index}`, item)!).filter(Boolean),
      rawStoragePolicy: 'local-device-or-encrypted-vault',
    },
    sharingPolicy,
    privacy: {
      publicContainsRawAddress: false,
      publicContainsRawAgid: false,
      publicContainsRawAoid: false,
      publicContainsReporterIdentity: false,
      publicContainsPreciseCoordinates: false,
      restrictedUsesCommitmentsOnly: true,
    },
  };
}

function maxSeverity(values: DeliveryReachabilitySeverity[]): DeliveryReachabilitySeverity {
  const order: DeliveryReachabilitySeverity[] = ['info', 'minor', 'major', 'blocker'];
  return values.sort((left, right) => order.indexOf(right) - order.indexOf(left))[0] || 'info';
}

function combinedPublicationState(
  reports: DeliveryReachabilityReport[],
  minReportsToPublic: number,
): DeliveryReachabilityPublicationState {
  if (reports.some(report => report.publicProjection.publicationState === 'restricted')) return 'restricted';
  if (reports.some(report => report.publicProjection.publicationState === 'review-first') && reports.length < minReportsToPublic) {
    return 'review-first';
  }
  if (reports.some(report => report.publicProjection.publicationState === 'aggregated-only')) return 'aggregated-only';
  return 'public';
}

function aggregateStatus(reports: DeliveryReachabilityReport[]): DeliveryReachabilityStatus {
  if (reports.some(report => report.publicProjection.status === 'confirmed')) return 'confirmed';
  if (reports.some(report => report.publicProjection.status === 'disputed')) return 'disputed';
  if (reports.every(report => report.publicProjection.status === 'resolved')) return 'resolved';
  return 'reported';
}

export function buildDeliveryReachabilitySharedFeed(
  reports: DeliveryReachabilityReport[],
  options: { minReportsToPublic?: number } = {},
): DeliveryReachabilitySharedFeedItem[] {
  const minReportsToPublic = Math.max(1, options.minReportsToPublic || 2);
  const groups = new Map<string, DeliveryReachabilityReport[]>();

  for (const report of reports) {
    const publicReport = report.publicProjection;
    const key = [
      publicReport.coarseAgid || 'unknown-agid',
      publicReport.regionCode || 'unknown-region',
      publicReport.countryCode || 'unknown-country',
      publicReport.problemKind,
    ].join('|');
    groups.set(key, [...(groups.get(key) || []), report]);
  }

  return Array.from(groups.entries()).map(([key, grouped]) => {
    const first = grouped[0].publicProjection;
    const confidence = grouped.reduce((sum, report) => sum + report.publicProjection.confidence, 0) / grouped.length;
    const publicationState = combinedPublicationState(grouped, minReportsToPublic);
    const problemKind = publicationState === 'restricted'
      ? 'access-limited'
      : publicationState === 'review-first'
        ? 'review-pending'
        : first.problemKind;

    return {
      feedId: `reach-feed-${sha256Hex(key).slice(0, 20)}`,
      publicationState,
      problemKind,
      severity: maxSeverity(grouped.map(report => report.publicProjection.severity)),
      status: aggregateStatus(grouped),
      confidence: Number(clamp(confidence + Math.min(grouped.length - 1, 5) * 0.03, 0.05, 0.99).toFixed(2)),
      reportCount: grouped.length,
      coarseAgid: first.coarseAgid,
      regionCode: first.regionCode,
      countryCode: first.countryCode,
      reporterClasses: Array.from(new Set(grouped.map(report => report.publicProjection.reporterClass))),
      evidenceClasses: Array.from(new Set(grouped.flatMap(report => report.publicProjection.evidenceClasses))),
      ttlSeconds: Math.min(...grouped.map(report => report.publicProjection.ttlSeconds)),
      updatedAt: grouped.map(report => report.publicProjection.updatedAt).sort().at(-1) || first.updatedAt,
    };
  }).sort((left, right) => {
    if (left.publicationState !== right.publicationState) return left.publicationState.localeCompare(right.publicationState);
    return right.confidence - left.confidence;
  });
}

export function validateDeliveryReachabilityReport(
  report: DeliveryReachabilityReport,
): DeliveryReachabilityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (report.version !== DELIVERY_REACHABILITY_REPORT_VERSION) errors.push('version-mismatch');
  if (!report.reportId.startsWith('reach-')) errors.push('invalid-report-id');
  if (report.publicProjection.reportId !== report.reportId) errors.push('public-report-id-mismatch');
  if (report.restrictedProjection.reportId !== report.reportId) errors.push('restricted-report-id-mismatch');
  if (report.publicProjection.confidence < 0 || report.publicProjection.confidence > 1) errors.push('confidence-out-of-range');
  if (!report.privacy.restrictedUsesCommitmentsOnly) errors.push('restricted-projection-must-use-commitments');

  const publicJson = stableStringify(report.publicProjection).toLowerCase();
  for (const forbidden of ['rawaddress', 'aoid', 'reporterid', 'deviceid', 'terminalid', 'privatenote']) {
    if (publicJson.includes(forbidden)) errors.push(`public-projection-leaks-${forbidden}`);
  }
  if (report.publicProjection.publicationState === 'public' && report.sharingPolicy.publicAudience.length === 0) {
    errors.push('public-report-without-public-audience');
  }
  if (report.publicProjection.publicationState === 'restricted' && report.restrictedProjection.audience.length === 0) {
    errors.push('restricted-report-without-restricted-audience');
  }
  if (report.restrictedProjection.closedFields.length === 0) {
    warnings.push('no-closed-fields');
  }
  if (report.publicProjection.publicationState === 'review-first') {
    warnings.push('manual-review-required-before-sharing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
