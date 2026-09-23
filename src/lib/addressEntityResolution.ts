import {
  analyzeAddress,
  normalizeApiAddress,
  parseAddressText,
  type CanonicalAddressParts,
} from './addressIntelligence';
import { sha256Hex } from './sha256';

export const ADDRESS_ENTITY_RESOLUTION_VERSION = 'address-entity-resolution-v1';

export type AddressEntityResolutionStatus =
  | 'same-entity'
  | 'ambiguous'
  | 'distinct'
  | 'insufficient-evidence';

export type AddressEntityResolutionDecision =
  | 'merge'
  | 'review'
  | 'split';

export type AddressEntityResolutionCandidate = {
  candidateId?: string;
  source?: string;
  canonical?: CanonicalAddressParts & Record<string, unknown>;
  addressText?: string;
  countryCode?: string;
  agid?: string;
  aoidCommitment?: string;
  agidCommitment?: string;
  addressReferenceCommitment?: string;
  credentialCommitment?: string;
  confidence?: number;
  observedAt?: string;
  aliases?: string[];
};

export type AddressEntityResolutionInput = {
  primary?: AddressEntityResolutionCandidate;
  candidates?: AddressEntityResolutionCandidate[];
  threshold?: number;
  strictUnitSeparation?: boolean;
  now?: string;
  domain?: string;
};

export type AddressEntityResolutionCandidateSummary = {
  candidateId: string;
  source: string;
  fingerprint: string;
  countryCode?: string;
  postcodePrefix?: string;
  presentFields: string[];
  confidence: number;
  commitmentRefs: {
    addressReference?: string;
    agid?: string;
    aoid?: string;
    credential?: string;
  };
  observedAt?: string;
};

export type AddressEntityResolutionEdge = {
  leftCandidateId: string;
  rightCandidateId: string;
  score: number;
  decision: 'same' | 'review' | 'distinct';
  reasons: string[];
  conflicts: string[];
};

export type AddressEntityResolutionCluster = {
  clusterId: string;
  anchorCandidateId: string;
  candidates: AddressEntityResolutionCandidateSummary[];
  confidence: number;
  evidenceScore: number;
  needsReview: boolean;
  reasons: string[];
  conflicts: string[];
};

export type AddressEntityResolutionResult = {
  version: typeof ADDRESS_ENTITY_RESOLUTION_VERSION;
  status: AddressEntityResolutionStatus;
  decision: AddressEntityResolutionDecision;
  selectedClusterId?: string;
  clusters: AddressEntityResolutionCluster[];
  unresolved: AddressEntityResolutionCandidateSummary[];
  edges: AddressEntityResolutionEdge[];
  confidence: number;
  warnings: string[];
  errors: string[];
  evidence: {
    candidateCount: number;
    clusterCount: number;
    strongestScore: number;
    threshold: number;
    strictUnitSeparation: boolean;
  };
  privacy: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    rawCoordinatesStored: false;
    storesCommitmentsOnlyForPrivateIds: true;
  };
};

type InternalCandidate = {
  input: AddressEntityResolutionCandidate;
  summary: AddressEntityResolutionCandidateSummary;
  canonical: CanonicalAddressParts;
  normalized: Record<keyof CanonicalAddressParts, string>;
  aliases: string[];
  agidFingerprint?: string;
};

type PairScore = {
  score: number;
  decision: 'same' | 'review' | 'distinct';
  reasons: string[];
  conflicts: string[];
};

const DEFAULT_THRESHOLD = 0.78;
const REVIEW_MARGIN = 0.12;

const FIELD_WEIGHTS: Array<[keyof CanonicalAddressParts, number]> = [
  ['country_code', 0.16],
  ['country', 0.05],
  ['postcode', 0.18],
  ['state', 0.08],
  ['city', 0.11],
  ['district', 0.08],
  ['subdistrict', 0.05],
  ['suburb', 0.04],
  ['road', 0.12],
  ['house_number', 0.09],
  ['building', 0.03],
  ['poi', 0.01],
];

const ROAD_SUFFIXES: Record<string, string> = {
  st: 'street',
  street: 'street',
  rd: 'road',
  road: 'road',
  ave: 'avenue',
  av: 'avenue',
  avenue: 'avenue',
  blvd: 'boulevard',
  boulevard: 'boulevard',
  dr: 'drive',
  drive: 'drive',
  ln: 'lane',
  lane: 'lane',
  ct: 'court',
  court: 'court',
  pl: 'place',
  place: 'place',
  sq: 'square',
  square: 'square',
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function normalizeCountryCode(value: unknown) {
  const text = clean(value).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return text === 'UK' ? 'GB' : text;
}

function normalizeCommitment(value: unknown) {
  const text = clean(value);
  if (!text) return '';
  return text.startsWith('0x') ? `0x${text.slice(2).toLowerCase()}` : text.toLowerCase();
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
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

function normalizeText(value: unknown) {
  const cleaned = clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[()［］\[\]{}'"`´.,;:!?/\\|]+/g, ' ')
    .replace(/[-‐‑‒–—―]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const tokens = cleaned.split(' ').map(token => ROAD_SUFFIXES[token] || token);
  return tokens.join(' ');
}

function normalizePostcode(value: unknown) {
  return clean(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeHouseNumber(value: unknown) {
  return clean(value).toUpperCase().replace(/\s+/g, '').replace(/[‐‑‒–—―]/g, '-');
}

function tokenSet(value: string) {
  return new Set(value.split(/\s+/).map(part => part.trim()).filter(Boolean));
}

function jaccard(left: string, right: string) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size && !b.size) return 0;
  const intersection = Array.from(a).filter(item => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function fieldSimilarity(left: string, right: string) {
  if (!left || !right) return undefined;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.86;
  return clamp01(jaccard(left, right));
}

function mergeCanonical(candidate: AddressEntityResolutionCandidate): CanonicalAddressParts {
  const normalized = normalizeApiAddress(candidate.canonical || {});
  const parsed = candidate.addressText ? parseAddressText(candidate.addressText) : {};
  const analysis = candidate.addressText
    ? analyzeAddress({
        apiAddress: candidate.canonical || {},
        displayName: candidate.addressText,
        sources: [candidate.source || 'entity-resolution-candidate'],
      }).canonical
    : {};
  const countryCode = normalizeCountryCode(candidate.countryCode || candidate.canonical?.country_code);
  return {
    ...analysis,
    ...parsed,
    ...normalized,
    ...(countryCode ? { country_code: countryCode } : {}),
  };
}

function normalizedFields(canonical: CanonicalAddressParts): Record<keyof CanonicalAddressParts, string> {
  return {
    country_code: normalizeCountryCode(canonical.country_code),
    country: normalizeText(canonical.country),
    state: normalizeText(canonical.state),
    city: normalizeText(canonical.city),
    district: normalizeText(canonical.district),
    subdistrict: normalizeText(canonical.subdistrict),
    suburb: normalizeText(canonical.suburb),
    road: normalizeText(canonical.road),
    house_number: normalizeHouseNumber(canonical.house_number),
    building: normalizeText(canonical.building),
    postcode: normalizePostcode(canonical.postcode),
    poi: normalizeText(canonical.poi),
    plus_code: normalizeText(canonical.plus_code),
  };
}

function presentFields(normalized: Record<keyof CanonicalAddressParts, string>) {
  return (Object.keys(normalized) as Array<keyof CanonicalAddressParts>).filter(key => Boolean(normalized[key]));
}

function postcodePrefix(postcode: string) {
  if (!postcode) return undefined;
  return postcode.slice(0, Math.min(5, postcode.length));
}

function commitmentRefs(candidate: AddressEntityResolutionCandidate) {
  return {
    addressReference: normalizeCommitment(candidate.addressReferenceCommitment) || undefined,
    agid: normalizeCommitment(candidate.agidCommitment) || undefined,
    aoid: normalizeCommitment(candidate.aoidCommitment) || undefined,
    credential: normalizeCommitment(candidate.credentialCommitment) || undefined,
  };
}

function candidateFingerprint(input: {
  canonical: CanonicalAddressParts;
  commitments: ReturnType<typeof commitmentRefs>;
  agidFingerprint?: string;
  aliases: string[];
  domain?: string;
}) {
  return `er:${sha256Hex(stableStringify({
    domain: input.domain,
    canonical: normalizedFields(input.canonical),
    commitments: input.commitments,
    agidFingerprint: input.agidFingerprint,
    aliases: input.aliases.map(normalizeText).filter(Boolean).sort(),
  })).slice(0, 32)}`;
}

function toInternalCandidate(
  candidate: AddressEntityResolutionCandidate,
  index: number,
  domain?: string,
): InternalCandidate {
  const canonical = mergeCanonical(candidate);
  const normalized = normalizedFields(canonical);
  const refs = commitmentRefs(candidate);
  const agid = clean(candidate.agid);
  const agidFingerprint = agid ? `agid:${sha256Hex(`${domain || 'entity-resolution'}:${agid}`).slice(0, 24)}` : undefined;
  const aliases = (candidate.aliases || []).map(normalizeText).filter(Boolean);
  const fingerprint = candidateFingerprint({ canonical, commitments: refs, agidFingerprint, aliases, domain });
  return {
    input: candidate,
    canonical,
    normalized,
    aliases,
    agidFingerprint,
    summary: {
      candidateId: clean(candidate.candidateId) || `candidate-${index + 1}`,
      source: clean(candidate.source) || 'local',
      fingerprint,
      countryCode: normalized.country_code || undefined,
      postcodePrefix: postcodePrefix(normalized.postcode),
      presentFields: presentFields(normalized),
      confidence: clamp01(candidate.confidence ?? 0.5),
      commitmentRefs: refs,
      observedAt: clean(candidate.observedAt) || undefined,
    },
  };
}

function commitmentScore(left: InternalCandidate, right: InternalCandidate): PairScore | undefined {
  const l = left.summary.commitmentRefs;
  const r = right.summary.commitmentRefs;
  const reasons: string[] = [];
  let score = 0;

  if (l.addressReference && l.addressReference === r.addressReference) {
    return {
      score: 1,
      decision: 'same',
      reasons: ['matching-address-reference-commitment'],
      conflicts: [],
    };
  }
  if (l.credential && l.credential === r.credential) {
    score += 0.42;
    reasons.push('matching-credential-commitment');
  }
  if (l.agid && l.agid === r.agid) {
    score += 0.34;
    reasons.push('matching-agid-commitment');
  }
  if (l.aoid && l.aoid === r.aoid) {
    score += 0.24;
    reasons.push('matching-aoid-commitment');
  }
  if (left.agidFingerprint && left.agidFingerprint === right.agidFingerprint) {
    score += 0.26;
    reasons.push('matching-local-agid-fingerprint');
  }

  if (score <= 0) return undefined;
  return {
    score: clamp01(Math.min(0.96, score)),
    decision: score >= 0.78 ? 'same' : 'review',
    reasons,
    conflicts: [],
  };
}

function hasMeaningfulConflict(left: InternalCandidate, right: InternalCandidate, strictUnitSeparation: boolean) {
  const conflicts: string[] = [];
  const leftCountry = left.normalized.country_code;
  const rightCountry = right.normalized.country_code;
  if (leftCountry && rightCountry && leftCountry !== rightCountry) conflicts.push('country-code-conflict');

  const leftPostcode = left.normalized.postcode;
  const rightPostcode = right.normalized.postcode;
  if (leftPostcode && rightPostcode && leftPostcode !== rightPostcode) {
    const sharedPrefix = leftPostcode.slice(0, 3) === rightPostcode.slice(0, 3);
    if (!sharedPrefix) conflicts.push('postcode-conflict');
  }

  const leftHouse = left.normalized.house_number;
  const rightHouse = right.normalized.house_number;
  if (leftHouse && rightHouse && leftHouse !== rightHouse) conflicts.push('house-number-conflict');

  if (strictUnitSeparation) {
    const leftBuilding = left.normalized.building;
    const rightBuilding = right.normalized.building;
    if (leftBuilding && rightBuilding && fieldSimilarity(leftBuilding, rightBuilding)! < 0.72) {
      conflicts.push('building-or-unit-conflict');
    }
  }

  return conflicts;
}

function pairScore(
  left: InternalCandidate,
  right: InternalCandidate,
  threshold: number,
  strictUnitSeparation: boolean,
): PairScore {
  const commitment = commitmentScore(left, right);
  const conflicts = hasMeaningfulConflict(left, right, strictUnitSeparation);
  const reasons: string[] = [];

  if (commitment?.score === 1 && !conflicts.length) return commitment;

  let weighted = 0;
  let possible = 0;
  for (const [field, weight] of FIELD_WEIGHTS) {
    const similarity = fieldSimilarity(left.normalized[field], right.normalized[field]);
    if (similarity === undefined) continue;
    possible += weight;
    weighted += similarity * weight;
    if (similarity >= 0.92) reasons.push(`matching-${field}`);
  }

  const aliasScore = Math.max(
    ...left.aliases.flatMap(alias => right.aliases.map(other => fieldSimilarity(alias, other) ?? 0)),
    0,
  );
  if (aliasScore >= 0.85) {
    possible += 0.04;
    weighted += aliasScore * 0.04;
    reasons.push('matching-alias');
  }

  const structuralScore = possible ? weighted / possible : 0;
  const coveragePenalty = Math.min(1, possible / 0.72);
  const confidenceBonus = ((left.summary.confidence + right.summary.confidence) / 2) * 0.04;
  const commitmentBonus = commitment?.score ? commitment.score * 0.2 : 0;
  let score = clamp01(structuralScore * coveragePenalty + commitmentBonus + confidenceBonus);

  if (conflicts.includes('country-code-conflict')) score = Math.min(score, 0.18);
  if (conflicts.includes('postcode-conflict')) score = Math.min(score, 0.44);
  if (conflicts.includes('house-number-conflict')) score = Math.min(score, 0.56);
  if (conflicts.includes('building-or-unit-conflict')) score = Math.min(score, 0.62);

  if (commitment) reasons.push(...commitment.reasons);

  const decision = score >= threshold && !conflicts.length
    ? 'same'
    : score >= threshold - REVIEW_MARGIN
      ? 'review'
      : 'distinct';

  return {
    score,
    decision,
    reasons: Array.from(new Set(reasons)),
    conflicts,
  };
}

function edgeId(candidates: InternalCandidate[]) {
  return `cluster-${sha256Hex(candidates.map(candidate => candidate.summary.fingerprint).sort().join('|')).slice(0, 16)}`;
}

function buildClusters(candidates: InternalCandidate[], edges: AddressEntityResolutionEdge[], threshold: number) {
  const clusters: InternalCandidate[][] = [];
  const assigned = new Set<string>();

  for (const candidate of candidates) {
    if (assigned.has(candidate.summary.candidateId)) continue;
    const cluster = [candidate];
    assigned.add(candidate.summary.candidateId);

    for (const other of candidates) {
      if (assigned.has(other.summary.candidateId)) continue;
      const compatibleWithAll = cluster.every(member => {
        const edge = edges.find(item =>
          (item.leftCandidateId === member.summary.candidateId && item.rightCandidateId === other.summary.candidateId)
          || (item.rightCandidateId === member.summary.candidateId && item.leftCandidateId === other.summary.candidateId)
        );
        return Boolean(edge && edge.score >= threshold && edge.decision === 'same' && !edge.conflicts.length);
      });
      if (!compatibleWithAll) continue;
      cluster.push(other);
      assigned.add(other.summary.candidateId);
    }
    clusters.push(cluster);
  }

  return clusters.map(cluster => {
    const memberIds = new Set(cluster.map(candidate => candidate.summary.candidateId));
    const clusterEdges = edges.filter(edge =>
      memberIds.has(edge.leftCandidateId) && memberIds.has(edge.rightCandidateId)
    );
    const evidenceScore = clusterEdges.length
      ? clamp01(clusterEdges.reduce((sum, edge) => sum + edge.score, 0) / clusterEdges.length)
      : cluster[0].summary.confidence;
    const conflicts = Array.from(new Set(clusterEdges.flatMap(edge => edge.conflicts)));
    const reasons = Array.from(new Set(clusterEdges.flatMap(edge => edge.reasons)));
    return {
      clusterId: edgeId(cluster),
      anchorCandidateId: cluster[0].summary.candidateId,
      candidates: cluster.map(candidate => candidate.summary),
      confidence: clamp01(Math.max(evidenceScore, ...cluster.map(candidate => candidate.summary.confidence)) || 0),
      evidenceScore,
      needsReview: Boolean(conflicts.length || clusterEdges.some(edge => edge.decision === 'review')),
      reasons,
      conflicts,
    };
  });
}

function buildResultStatus(options: {
  candidateCount: number;
  clusters: AddressEntityResolutionCluster[];
  edges: AddressEntityResolutionEdge[];
  threshold: number;
}): { status: AddressEntityResolutionStatus; decision: AddressEntityResolutionDecision; confidence: number; selectedClusterId?: string } {
  if (options.candidateCount <= 1) {
    const cluster = options.clusters[0];
    return {
      status: 'insufficient-evidence',
      decision: 'review',
      confidence: cluster?.confidence ?? 0,
      selectedClusterId: cluster?.clusterId,
    };
  }

  const strongestScore = Math.max(...options.edges.map(edge => edge.score), 0);
  const sortedClusters = [...options.clusters].sort((left, right) => {
    const bySize = right.candidates.length - left.candidates.length;
    if (bySize) return bySize;
    return right.confidence - left.confidence;
  });
  const selected = sortedClusters[0];

  if (selected && selected.candidates.length === options.candidateCount && !selected.needsReview) {
    return {
      status: 'same-entity',
      decision: 'merge',
      confidence: selected.confidence,
      selectedClusterId: selected.clusterId,
    };
  }
  if (strongestScore >= options.threshold - REVIEW_MARGIN) {
    return {
      status: 'ambiguous',
      decision: 'review',
      confidence: clamp01(strongestScore),
      selectedClusterId: selected?.clusterId,
    };
  }
  return {
    status: 'distinct',
    decision: 'split',
    confidence: clamp01(1 - strongestScore),
    selectedClusterId: selected?.clusterId,
  };
}

export function resolveAddressEntities(input: AddressEntityResolutionInput): AddressEntityResolutionResult {
  const threshold = clamp01(input.threshold ?? DEFAULT_THRESHOLD) || DEFAULT_THRESHOLD;
  const strictUnitSeparation = input.strictUnitSeparation !== false;
  const rawCandidates = [
    input.primary,
    ...(input.candidates || []),
  ].filter(Boolean) as AddressEntityResolutionCandidate[];

  const warnings: string[] = [];
  const errors: string[] = [];
  if (!rawCandidates.length) {
    errors.push('entity-resolution-no-candidates');
  }

  const candidates = rawCandidates.map((candidate, index) =>
    toInternalCandidate(candidate, index, input.domain)
  );

  const edges: AddressEntityResolutionEdge[] = [];
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const score = pairScore(candidates[i], candidates[j], threshold, strictUnitSeparation);
      edges.push({
        leftCandidateId: candidates[i].summary.candidateId,
        rightCandidateId: candidates[j].summary.candidateId,
        score: score.score,
        decision: score.decision,
        reasons: score.reasons,
        conflicts: score.conflicts,
      });
    }
  }

  const clusters = buildClusters(candidates, edges, threshold);
  const clustered = new Set(clusters.flatMap(cluster =>
    cluster.candidates.length > 1 ? cluster.candidates.map(candidate => candidate.candidateId) : []
  ));
  const unresolved = candidates
    .filter(candidate => !clustered.has(candidate.summary.candidateId) && candidates.length > 1)
    .map(candidate => candidate.summary);
  const status = buildResultStatus({
    candidateCount: candidates.length,
    clusters,
    edges,
    threshold,
  });
  if (status.status === 'ambiguous') warnings.push('entity-resolution-needs-review');
  if (status.status === 'distinct') warnings.push('entity-resolution-distinct-candidates');
  if (status.status === 'insufficient-evidence') warnings.push('entity-resolution-insufficient-evidence');
  if (clusters.some(cluster => cluster.needsReview)) warnings.push('entity-resolution-cluster-has-conflicts');

  return {
    version: ADDRESS_ENTITY_RESOLUTION_VERSION,
    status: status.status,
    decision: status.decision,
    selectedClusterId: status.selectedClusterId,
    clusters,
    unresolved,
    edges,
    confidence: status.confidence,
    warnings: Array.from(new Set(warnings)),
    errors,
    evidence: {
      candidateCount: candidates.length,
      clusterCount: clusters.length,
      strongestScore: Math.max(...edges.map(edge => edge.score), 0),
      threshold,
      strictUnitSeparation,
    },
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawCoordinatesStored: false,
      storesCommitmentsOnlyForPrivateIds: true,
    },
  };
}
