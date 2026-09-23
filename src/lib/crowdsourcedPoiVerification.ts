import { sha256Hex } from './sha256';
import type { PoiDeliverabilityGraph, PoiGraphNode, PoiSourceRef } from './poiDeliverabilityGraph';

export type CrowdPoiReporterClass =
  | 'public-user'
  | 'verified-local'
  | 'carrier'
  | 'municipality'
  | 'ngo'
  | 'hotel-operator'
  | 'merchant';

export type CrowdPoiEvidenceKind =
  | 'redacted-photo'
  | 'coarse-location'
  | 'arrival-history'
  | 'operator-confirmation'
  | 'public-record-link'
  | 'map-edit'
  | 'delivery-success-aggregate'
  | 'negative-report';

export type CrowdPoiVerificationStatus =
  | 'community-verified'
  | 'source-confidence'
  | 'manual-review-required'
  | 'rejected';

export type CrowdPoiEvidenceSubmission = {
  submissionId: string;
  poiId: string;
  agidCellId?: string;
  reporterClass: CrowdPoiReporterClass;
  reporterBucket: string;
  evidenceKind: CrowdPoiEvidenceKind;
  observedAt: string;
  sourceRef?: string;
  redacted?: boolean;
  signed?: boolean;
  coarseDistanceMeters?: number;
  arrivalCount?: number;
  successCount?: number;
  failureCount?: number;
  contradictsPoi?: boolean;
  containsPersonalData?: boolean;
  containsExif?: boolean;
  containsPreciseCoordinates?: boolean;
  containsRawPhoto?: boolean;
  containsRawAddress?: boolean;
};

export type CrowdPoiVerificationSubject = {
  poiId: string;
  agidCellId?: string;
  countryCode: string;
  featureName: string;
};

export type CrowdPoiVerificationPolicy = {
  communityVerifiedThreshold: number;
  sourceConfidenceThreshold: number;
  minCommunityReporters: number;
  minEvidenceKinds: number;
  maxFailureRatioForAutoTrust: number;
  staleAfterDays: number;
};

export type CrowdPoiVerificationResult = {
  subject: CrowdPoiVerificationSubject;
  status: CrowdPoiVerificationStatus;
  sourceConfidence: number;
  communityVerified: boolean;
  manualReviewRequired: boolean;
  positiveEvidenceCount: number;
  negativeEvidenceCount: number;
  uniqueReporterCount: number;
  evidenceKinds: CrowdPoiEvidenceKind[];
  safeEvidenceRefs: string[];
  reasons: string[];
  warnings: string[];
  privacy: {
    publicContainsRawPhoto: false;
    publicContainsRawAddress: false;
    publicContainsPersonalData: false;
    publicContainsPreciseCoordinates: false;
  };
};

export const DEFAULT_CROWD_POI_VERIFICATION_POLICY: CrowdPoiVerificationPolicy = {
  communityVerifiedThreshold: 0.74,
  sourceConfidenceThreshold: 0.52,
  minCommunityReporters: 3,
  minEvidenceKinds: 2,
  maxFailureRatioForAutoTrust: 0.25,
  staleAfterDays: 180,
};

const REPORTER_WEIGHT: Record<CrowdPoiReporterClass, number> = {
  'public-user': 0.35,
  'verified-local': 0.58,
  carrier: 0.74,
  municipality: 0.86,
  ngo: 0.66,
  'hotel-operator': 0.62,
  merchant: 0.56,
};

const EVIDENCE_WEIGHT: Record<CrowdPoiEvidenceKind, number> = {
  'redacted-photo': 0.18,
  'coarse-location': 0.16,
  'arrival-history': 0.24,
  'operator-confirmation': 0.25,
  'public-record-link': 0.22,
  'map-edit': 0.12,
  'delivery-success-aggregate': 0.24,
  'negative-report': -0.25,
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function daysBetween(now: Date, then: Date) {
  return Math.max(0, (now.getTime() - then.getTime()) / 86_400_000);
}

function freshnessFactor(observedAt: string, now: Date, staleAfterDays: number) {
  const observed = new Date(observedAt);
  if (Number.isNaN(observed.getTime())) return 0.35;
  const age = daysBetween(now, observed);
  if (age <= staleAfterDays) return 1;
  if (age >= staleAfterDays * 3) return 0.35;
  return clamp(1 - (age - staleAfterDays) / (staleAfterDays * 2) * 0.65, 0.35, 1);
}

function hasPrivacyBlocker(submission: CrowdPoiEvidenceSubmission) {
  return Boolean(
    submission.containsPersonalData ||
    submission.containsExif ||
    submission.containsPreciseCoordinates ||
    submission.containsRawPhoto ||
    submission.containsRawAddress,
  );
}

function validateSubmission(submission: CrowdPoiEvidenceSubmission) {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!submission.submissionId) errors.push('submission-id-required');
  if (!submission.poiId) errors.push('poi-id-required');
  if (!submission.reporterBucket) errors.push('reporter-bucket-required');
  if (hasPrivacyBlocker(submission)) errors.push('privacy-blocker');
  if (submission.evidenceKind === 'redacted-photo' && !submission.redacted) errors.push('photo-must-be-redacted');
  if (submission.evidenceKind === 'coarse-location' && (submission.coarseDistanceMeters ?? 0) <= 0) {
    warnings.push('coarse-location-distance-missing');
  }
  if (submission.evidenceKind === 'arrival-history' && (submission.arrivalCount ?? 0) <= 0) {
    warnings.push('arrival-count-missing');
  }

  return { valid: errors.length === 0, errors, warnings };
}

function safeEvidenceRef(submission: CrowdPoiEvidenceSubmission) {
  return `crowd:${sha256Hex([
    submission.submissionId,
    submission.poiId,
    submission.reporterBucket,
    submission.evidenceKind,
    submission.observedAt,
  ].join('|')).slice(0, 20)}`;
}

function evidenceScore(
  submission: CrowdPoiEvidenceSubmission,
  now: Date,
  policy: CrowdPoiVerificationPolicy,
) {
  const base = REPORTER_WEIGHT[submission.reporterClass] ?? 0.25;
  const evidence = EVIDENCE_WEIGHT[submission.evidenceKind] ?? 0;
  const signedBoost = submission.signed ? 0.05 : 0;
  const redactionBoost = submission.redacted ? 0.03 : 0;
  const freshness = freshnessFactor(submission.observedAt, now, policy.staleAfterDays);
  const aggregateBoost = submission.successCount && submission.arrivalCount
    ? clamp((submission.successCount - (submission.failureCount ?? 0)) / submission.arrivalCount, -0.2, 0.2)
    : 0;
  const contradictionPenalty = submission.contradictsPoi ? -0.35 : 0;

  return (base + evidence + signedBoost + redactionBoost + aggregateBoost + contradictionPenalty) * freshness;
}

export function evaluateCrowdsourcedPoiVerification(
  subject: CrowdPoiVerificationSubject,
  submissions: CrowdPoiEvidenceSubmission[],
  options: {
    now?: Date;
    policy?: CrowdPoiVerificationPolicy;
  } = {},
): CrowdPoiVerificationResult {
  const now = options.now ?? new Date();
  const policy = options.policy ?? DEFAULT_CROWD_POI_VERIFICATION_POLICY;
  const warnings: string[] = [];
  const reasons: string[] = [];
  const accepted = submissions.filter(submission => submission.poiId === subject.poiId);
  const safeSubmissions: CrowdPoiEvidenceSubmission[] = [];
  let rejectedCount = 0;

  for (const submission of accepted) {
    const validation = validateSubmission(submission);
    warnings.push(...validation.warnings.map(warning => `${submission.submissionId}:${warning}`));
    if (validation.valid) {
      safeSubmissions.push(submission);
    } else {
      rejectedCount += 1;
      warnings.push(...validation.errors.map(error => `${submission.submissionId}:${error}`));
    }
  }

  if (!safeSubmissions.length) {
    return {
      subject,
      status: rejectedCount > 0 ? 'rejected' : 'manual-review-required',
      sourceConfidence: 0,
      communityVerified: false,
      manualReviewRequired: true,
      positiveEvidenceCount: 0,
      negativeEvidenceCount: 0,
      uniqueReporterCount: 0,
      evidenceKinds: [],
      safeEvidenceRefs: [],
      reasons: rejectedCount > 0 ? ['all-submissions-rejected'] : ['no-evidence'],
      warnings,
      privacy: {
        publicContainsRawPhoto: false,
        publicContainsRawAddress: false,
        publicContainsPersonalData: false,
        publicContainsPreciseCoordinates: false,
      },
    };
  }

  const uniqueReporters = new Set(safeSubmissions.map(submission => submission.reporterBucket));
  const evidenceKinds = [...new Set(safeSubmissions.map(submission => submission.evidenceKind))].sort();
  const positive = safeSubmissions.filter(submission => !submission.contradictsPoi && submission.evidenceKind !== 'negative-report');
  const negative = safeSubmissions.filter(submission => submission.contradictsPoi || submission.evidenceKind === 'negative-report');
  const totalScore = safeSubmissions.reduce((sum, submission) => (
    sum + evidenceScore(submission, now, policy)
  ), 0);
  const corroborationBoost = Math.min(0.18, uniqueReporters.size * 0.035 + evidenceKinds.length * 0.025);
  const failureRatio = negative.length / safeSubmissions.length;
  const sourceConfidence = clamp(totalScore / Math.max(2, safeSubmissions.length) + corroborationBoost - failureRatio * 0.3);

  if (uniqueReporters.size < policy.minCommunityReporters) reasons.push('insufficient-independent-reporters');
  if (evidenceKinds.length < policy.minEvidenceKinds) reasons.push('insufficient-evidence-diversity');
  if (failureRatio > policy.maxFailureRatioForAutoTrust) reasons.push('conflicting-or-negative-evidence');
  if (rejectedCount > 0) reasons.push('some-submissions-rejected-for-privacy');

  const communityVerified = (
    sourceConfidence >= policy.communityVerifiedThreshold &&
    uniqueReporters.size >= policy.minCommunityReporters &&
    evidenceKinds.length >= policy.minEvidenceKinds &&
    failureRatio <= policy.maxFailureRatioForAutoTrust
  );
  const status: CrowdPoiVerificationStatus = communityVerified
    ? 'community-verified'
    : sourceConfidence >= policy.sourceConfidenceThreshold && failureRatio <= policy.maxFailureRatioForAutoTrust
      ? 'source-confidence'
      : 'manual-review-required';

  return {
    subject,
    status,
    sourceConfidence,
    communityVerified,
    manualReviewRequired: status === 'manual-review-required',
    positiveEvidenceCount: positive.length,
    negativeEvidenceCount: negative.length,
    uniqueReporterCount: uniqueReporters.size,
    evidenceKinds,
    safeEvidenceRefs: safeSubmissions.map(safeEvidenceRef),
    reasons,
    warnings,
    privacy: {
      publicContainsRawPhoto: false,
      publicContainsRawAddress: false,
      publicContainsPersonalData: false,
      publicContainsPreciseCoordinates: false,
    },
  };
}

function communitySourceRef(result: CrowdPoiVerificationResult): PoiSourceRef {
  return {
    sourceId: `community:${result.subject.poiId}`,
    licenseStatus: result.communityVerified ? 'approved' : 'open-review-required',
  };
}

function updateNodeTrust(node: PoiGraphNode, result: CrowdPoiVerificationResult): PoiGraphNode {
  const existingTrust = node.trustScore ?? 0.5;
  const confidenceWeight = result.communityVerified ? 0.35 : result.status === 'source-confidence' ? 0.22 : 0.08;
  const trustScore = clamp(existingTrust * (1 - confidenceWeight) + result.sourceConfidence * confidenceWeight);
  const serviceTags = new Set(node.serviceTags ?? []);
  serviceTags.add(result.status);
  if (result.manualReviewRequired) serviceTags.add('manual-review-required');

  return {
    ...node,
    trustScore,
    serviceTags: [...serviceTags].sort(),
    sourceRefs: [
      ...node.sourceRefs,
      communitySourceRef(result),
    ],
  };
}

export function applyCrowdsourcedVerificationToPoiGraph(
  graph: PoiDeliverabilityGraph,
  results: CrowdPoiVerificationResult[],
): PoiDeliverabilityGraph {
  const resultByPoi = new Map(results.map(result => [result.subject.poiId, result]));
  return {
    ...graph,
    nodes: graph.nodes.map(node => {
      const result = resultByPoi.get(node.id);
      return result ? updateNodeTrust(node, result) : node;
    }),
  };
}
