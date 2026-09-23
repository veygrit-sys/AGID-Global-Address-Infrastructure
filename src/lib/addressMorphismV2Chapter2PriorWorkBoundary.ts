export const ADDRESS_MORPHISM_V2_CHAPTER2_PRIOR_WORK_BOUNDARY_VERSION =
  'address-morphism-v2-chapter2-prior-work-boundary-v0.1';

export type Chapter2PriorWorkKind =
  | 'normalization'
  | 'geocoding'
  | 'postal_code'
  | 'gis_boundary'
  | 'place_or_poi_id'
  | 'did'
  | 'verifiable_credential'
  | 'zk_proof'
  | 'commercial_validator';

export type Chapter2PriorWorkRole =
  | 'expression_alignment'
  | 'spatial_evidence'
  | 'compression'
  | 'boundary_evidence'
  | 'local_entity_evidence'
  | 'identifier_or_trust_layer'
  | 'credential_layer'
  | 'privacy_predicate_layer'
  | 'operational_baseline';

export type Chapter2BoundaryState =
  | 'compatible_evidence_layer'
  | 'safe_referent_ready'
  | 'comparison_plan_only'
  | 'unsafe_replacement_claim'
  | 'blocked';

export type Chapter2PriorWorkMethod = {
  kind: Chapter2PriorWorkKind;
  hasReferentDerivationRule: boolean;
  purposeScoped: boolean;
  evidenceTransparent: boolean;
  supportsSafeAbstention: boolean;
  privacyBoundaryDefined: boolean;
  claimsToReplaceAmt?: boolean;
  containsRawAddressOrSecret?: boolean;
};

export type Chapter2BoundaryEvaluation = {
  state: Chapter2BoundaryState;
  role: Chapter2PriorWorkRole;
  reasons: string[];
  nonClaims: string[];
};

export type Chapter2FairComparison = {
  sameDataset: boolean;
  samePurpose: boolean;
  sameMetric: boolean;
  sameFailureTaxonomy: boolean;
  sameDisclosureBoundary: boolean;
};

const roleByKind: Record<Chapter2PriorWorkKind, Chapter2PriorWorkRole> = {
  normalization: 'expression_alignment',
  geocoding: 'spatial_evidence',
  postal_code: 'compression',
  gis_boundary: 'boundary_evidence',
  place_or_poi_id: 'local_entity_evidence',
  did: 'identifier_or_trust_layer',
  verifiable_credential: 'credential_layer',
  zk_proof: 'privacy_predicate_layer',
  commercial_validator: 'operational_baseline',
};

export function buildChapter2PriorWorkBoundaryReport(): {
  version: string;
  executableModelKinds: string[];
  boundaryRule: string;
  nonClaims: string[];
} {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER2_PRIOR_WORK_BOUNDARY_VERSION,
    executableModelKinds: [
      'prior work output classification',
      'evidence layer boundary',
      'safe referent readiness gate',
      'replacement-claim blocker',
      'fair comparison gate',
      'normalization non-identity fixture',
      'coordinate non-identity fixture',
      'postal-code non-identifier fixture',
      'ZK non-repair fixture',
    ],
    boundaryRule:
      'Normalization, geocoding, postal codes, GIS, Place IDs, DID, VC, ZK, and commercial APIs are usable evidence or compatibility layers, not AMT safe referents by themselves.',
    nonClaims: [
      'AMT does not replace GIS, postal standards, DID, VC, ZK, or commercial address APIs by assertion.',
      'A normalized address is not referent identity.',
      'A coordinate is not a complete address reference.',
      'A postal code is compression, not a universal identifier.',
      'A ZK proof cannot repair a bad or unresolved AMT referent.',
      'A commercial comparison requires the same dataset, purpose, metric, failure taxonomy, and disclosure boundary.',
    ],
  };
}

export function classifyChapter2PriorWorkRole(kind: Chapter2PriorWorkKind): Chapter2PriorWorkRole {
  return roleByKind[kind];
}

export function evaluateChapter2PriorWorkBoundary(method: Chapter2PriorWorkMethod): Chapter2BoundaryEvaluation {
  const reasons: string[] = [];
  const role = classifyChapter2PriorWorkRole(method.kind);

  if (method.containsRawAddressOrSecret) {
    reasons.push('raw-address-or-secret-in-comparison-artifact');
  }
  if (method.claimsToReplaceAmt) {
    reasons.push('unsafe-replacement-claim');
  }
  if (!method.hasReferentDerivationRule) {
    reasons.push('missing-referent-derivation-rule');
  }
  if (!method.purposeScoped) {
    reasons.push('missing-purpose-scope');
  }
  if (!method.evidenceTransparent) {
    reasons.push('missing-evidence-transparency');
  }
  if (!method.supportsSafeAbstention) {
    reasons.push('missing-safe-abstention');
  }
  if (!method.privacyBoundaryDefined) {
    reasons.push('missing-privacy-boundary');
  }

  const nonClaims = buildChapter2PriorWorkBoundaryReport().nonClaims;

  if (method.containsRawAddressOrSecret) {
    return { state: 'blocked', role, reasons, nonClaims };
  }
  if (method.claimsToReplaceAmt) {
    return { state: 'unsafe_replacement_claim', role, reasons, nonClaims };
  }
  if (
    method.hasReferentDerivationRule &&
    method.purposeScoped &&
    method.evidenceTransparent &&
    method.supportsSafeAbstention &&
    method.privacyBoundaryDefined
  ) {
    return { state: 'safe_referent_ready', role, reasons, nonClaims };
  }
  if (method.evidenceTransparent || method.kind === 'commercial_validator') {
    return { state: 'compatible_evidence_layer', role, reasons, nonClaims };
  }

  return { state: 'comparison_plan_only', role, reasons, nonClaims };
}

export function isChapter2FairComparison(comparison: Chapter2FairComparison): boolean {
  return (
    comparison.sameDataset &&
    comparison.samePurpose &&
    comparison.sameMetric &&
    comparison.sameFailureTaxonomy &&
    comparison.sameDisclosureBoundary
  );
}

export function chapter2PriorWorkOutputEqualsAmtSafeReferent(kind: Chapter2PriorWorkKind): false {
  void kind;
  return false;
}
