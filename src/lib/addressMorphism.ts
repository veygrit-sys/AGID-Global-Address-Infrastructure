import type { CanonicalAddressParts } from './addressIntelligence';
import type { NaturalAddressContext } from './addressMorphismSources';
import { expandSearchQuery,normalizeSearchText,scoreSearchCandidate } from './searchQuery';
import { sha256Hex } from './sha256';

export type AddressMorphismStatus = 'verified' | 'partial' | 'ambiguous' | 'unresolved';

export type AddressMorphismHistoryEventKind =
  | 'success'
  | 'failure'
  | 'confirmation'
  | 'rejection'
  | 'correction'
  | 'delivery_success'
  | 'delivery_failure'
  | 'manual_confirmation'
  | 'manual_rejection'
  | 'data_correction';

export type AddressMorphismHistoryEvent = {
  kind: AddressMorphismHistoryEventKind;
  weight?: number;
  timestamp?: string | number | Date;
  source?: string;
};

export type AddressMorphismCandidate = {
  id?: string;
  label: string;
  canonical: CanonicalAddressParts;
  lat?: number;
  lon?: number;
  sources?: string[];
  confidence?: number;
  validationScore?: number;
  deliverySuccesses?: number;
  deliveryFailures?: number;
  historyEvents?: AddressMorphismHistoryEvent[];
  naturalContext?: NaturalAddressContext;
};

export type AddressMorphismContext = {
  lat?: number;
  lon?: number;
  countryCode?: string;
  postcode?: string;
  state?: string;
  purpose?: 'search' | 'shipping' | 'registration' | 'emergency';
  temperature?: number;
};

export type AddressMorphismClusterSupport = {
  candidateCount: number;
  sourceCount: number;
  fieldCompleteness: number;
  sourceReliability: number;
  consensus: number;
  history: number;
  conflictPenalty: number;
};

export type AddressMorphismCluster = {
  id: string;
  canonical: CanonicalAddressParts;
  label: string;
  candidates: AddressMorphismCandidate[];
  centroid?: { lat: number; lon: number };
  sources: string[];
  confidence: number;
  probability: number;
  energy: number;
  pid: string;
  support: AddressMorphismClusterSupport;
};

export type AddressMorphismDecisionThresholds = {
  minEvidence: number;
  maxUnresolvedEnergy: number;
  ambiguousMargin: number;
  ambiguousProbability: number;
  verifiedEvidence: number;
  verifiedEnergy: number;
  verifiedProbability: number;
  maxVerifiedEntropy: number;
};

export type AddressMorphismDecision = {
  evidence: number;
  margin: number | null;
  probability: number;
  risk: number;
  thresholds: AddressMorphismDecisionThresholds;
  reason?: string;
};

export type AddressMorphismResult = {
  status: AddressMorphismStatus;
  pid: string | null;
  selected: AddressMorphismCluster | null;
  clusters: AddressMorphismCluster[];
  confidence: number;
  entropy: number;
  energySummary: {
    best: number;
    secondBest: number | null;
    min: number;
    max: number;
    average: number;
  };
  decision: AddressMorphismDecision;
  unresolvedReason?: string;
};

const SOURCE_RELIABILITY: Record<string, number> = {
  'official-regional-api': 0.98,
  'regional-open-data': 0.95,
  'openaddresses': 0.94,
  'jp-open-data': 0.95,
  'google-libaddressinput': 0.96,
  'google-open-location-code': 0.9,
  'zipcloud-jp': 0.96,
  'geonames-gazetteer': 0.9,
  'geonames-postal': 0.88,
  'zippopotam': 0.86,
  'osm-overpass': 0.84,
  'marine-regions': 0.82,
  'libpostal': 0.84,
  'osm-nominatim': 0.8,
  'osm_nominatim': 0.8,
  'nominatim': 0.8,
  'photon': 0.76,
  'parser': 0.62,
  'local_db': 0.74,
};

const FIELD_WEIGHTS: Array<[keyof CanonicalAddressParts, number]> = [
  ['country_code', 0.14],
  ['postcode', 0.18],
  ['state', 0.12],
  ['city', 0.14],
  ['district', 0.08],
  ['subdistrict', 0.08],
  ['road', 0.16],
  ['house_number', 0.1],
];

const CANONICAL_MERGE_FIELDS: Array<keyof CanonicalAddressParts> = [
  'country_code',
  'country',
  'postcode',
  'state',
  'city',
  'district',
  'subdistrict',
  'suburb',
  'road',
  'house_number',
  'building',
  'poi',
  'plus_code',
];

const POSTAL_EVIDENCE_FIELDS: Array<keyof CanonicalAddressParts> = [
  'country_code',
  'postcode',
  'state',
  'city',
  'road',
  'house_number',
];

const NATURAL_EVIDENCE_FIELDS: Array<keyof CanonicalAddressParts> = [
  'country_code',
  'state',
  'city',
  'poi',
  'plus_code',
];

const PURPOSE_THRESHOLDS: Record<NonNullable<AddressMorphismContext['purpose']>, AddressMorphismDecisionThresholds> = {
  search: {
    minEvidence: 0.25,
    maxUnresolvedEnergy: 0.78,
    ambiguousMargin: 0.06,
    ambiguousProbability: 0.56,
    verifiedEvidence: 0.68,
    verifiedEnergy: 0.62,
    verifiedProbability: 0.56,
    maxVerifiedEntropy: 1.05,
  },
  shipping: {
    minEvidence: 0.34,
    maxUnresolvedEnergy: 0.68,
    ambiguousMargin: 0.1,
    ambiguousProbability: 0.66,
    verifiedEvidence: 0.78,
    verifiedEnergy: 0.54,
    verifiedProbability: 0.66,
    maxVerifiedEntropy: 0.78,
  },
  registration: {
    minEvidence: 0.36,
    maxUnresolvedEnergy: 0.66,
    ambiguousMargin: 0.12,
    ambiguousProbability: 0.68,
    verifiedEvidence: 0.8,
    verifiedEnergy: 0.52,
    verifiedProbability: 0.68,
    maxVerifiedEntropy: 0.72,
  },
  emergency: {
    minEvidence: 0.28,
    maxUnresolvedEnergy: 0.74,
    ambiguousMargin: 0.09,
    ambiguousProbability: 0.62,
    verifiedEvidence: 0.76,
    verifiedEnergy: 0.56,
    verifiedProbability: 0.62,
    maxVerifiedEntropy: 0.88,
  },
};

const HISTORY_HALF_LIFE_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function clean(value: unknown) {
  return normalizeSearchText(String(value ?? ''));
}

function fieldSimilarity(left: unknown, right: unknown) {
  const a = clean(left);
  const b = clean(right);
  if (!a && !b) return 1;
  if (!a || !b) return 0.45;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.78;
  return scoreSearchCandidate(a, [b], { openSource: false });
}

function country(value?: string) {
  return String(value ?? '').trim().toLowerCase();
}

function postcode(value?: string) {
  return clean(value).replace(/\s|-/g, '');
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function geoDistancePenalty(left: AddressMorphismCandidate, right: AddressMorphismCandidate) {
  if (
    left.lat === undefined || left.lon === undefined ||
    right.lat === undefined || right.lon === undefined
  ) return 0.18;
  return Math.min(1, haversineKm(left.lat, left.lon, right.lat, right.lon) / 2);
}

function timestampDecay(timestamp?: string | number | Date) {
  if (!timestamp) return 1;
  const eventTime = new Date(timestamp).getTime();
  if (!Number.isFinite(eventTime)) return 1;
  const ageDays = Math.max(0, (Date.now() - eventTime) / MS_PER_DAY);
  return Math.pow(0.5, ageDays / HISTORY_HALF_LIFE_DAYS);
}

function historyPolarity(kind: AddressMorphismHistoryEventKind) {
  if (kind === 'success' || kind === 'confirmation' || kind === 'delivery_success' || kind === 'manual_confirmation') return 1;
  if (kind === 'failure' || kind === 'rejection' || kind === 'delivery_failure' || kind === 'manual_rejection') return -1;
  if (kind === 'correction' || kind === 'data_correction') return -0.5;
  return 0;
}

function historyStatsForCandidate(candidate: AddressMorphismCandidate) {
  let positive = Math.max(0, candidate.deliverySuccesses ?? 0);
  let negative = Math.max(0, candidate.deliveryFailures ?? 0);

  for (const event of candidate.historyEvents ?? []) {
    const weight = Math.max(0, event.weight ?? 1) * timestampDecay(event.timestamp);
    const polarity = historyPolarity(event.kind);
    if (polarity > 0) positive += weight * polarity;
    if (polarity < 0) negative += weight * Math.abs(polarity);
  }

  const mass = positive + negative;
  const confidence = mass > 0 ? (positive + 1.5) / (positive + negative + 3) : 0.5;
  return { positive, negative, mass, confidence: clamp(confidence) };
}

function historyStatsForCluster(cluster: Pick<AddressMorphismCluster, 'candidates'>) {
  const stats = cluster.candidates.map(historyStatsForCandidate);
  const positive = stats.reduce((sum, value) => sum + value.positive, 0);
  const negative = stats.reduce((sum, value) => sum + value.negative, 0);
  const mass = positive + negative;
  const confidence = mass > 0 ? (positive + 1.5) / (positive + negative + 3) : 0.5;
  return { positive, negative, mass, confidence: clamp(confidence) };
}

function historyScoreForCandidate(candidate: AddressMorphismCandidate) {
  return historyStatsForCandidate(candidate).confidence;
}

function candidateEvidenceWeight(candidate: AddressMorphismCandidate) {
  const reliability = sourceReliability(candidate.sources ?? []);
  const confidence = clamp(candidate.confidence ?? 0.5);
  const validation = clamp(candidate.validationScore ?? 0.5);
  const history = historyScoreForCandidate(candidate);
  return clamp(reliability * 0.36 + confidence * 0.28 + validation * 0.22 + history * 0.14, 0.05, 1);
}

export function structuralDistance(left: AddressMorphismCandidate, right: AddressMorphismCandidate) {
  const fieldDistance = FIELD_WEIGHTS.reduce((sum, [field, weight]) => {
    return sum + (1 - fieldSimilarity(left.canonical[field], right.canonical[field])) * weight;
  }, 0);
  const adminConflict =
    country(left.canonical.country_code) && country(right.canonical.country_code) && country(left.canonical.country_code) !== country(right.canonical.country_code)
      ? 0.5
      : postcode(left.canonical.postcode) && postcode(right.canonical.postcode) && postcode(left.canonical.postcode) !== postcode(right.canonical.postcode)
        ? 0.35
        : clean(left.canonical.state) && clean(right.canonical.state) && fieldSimilarity(left.canonical.state, right.canonical.state) < 0.6
          ? 0.3
          : 0;
  const geoPenalty = geoDistancePenalty(left, right) * 0.25;
  return Math.max(0, Math.min(1, fieldDistance + adminConflict + geoPenalty));
}

export function structuralDissimilarity(left: AddressMorphismCandidate, right: AddressMorphismCandidate) {
  return Math.max(structuralDistance(left, right), structuralDistance(right, left));
}

function chooseConsensusValue(candidates: AddressMorphismCandidate[], key: keyof CanonicalAddressParts) {
  const votes = new Map<string, { value: string; score: number; reliability: number; length: number }>();

  for (const candidate of candidates) {
    const value = candidate.canonical[key];
    const normalized = clean(value);
    if (!normalized) continue;
    const reliability = sourceReliability(candidate.sources ?? []);
    const score = candidateEvidenceWeight(candidate);
    const existing = votes.get(normalized);
    if (existing) {
      existing.score += score;
      existing.reliability = Math.max(existing.reliability, reliability);
      if (String(value).length > existing.length) {
        existing.value = String(value);
        existing.length = String(value).length;
      }
    } else {
      votes.set(normalized, {
        value: String(value),
        score,
        reliability,
        length: String(value).length,
      });
    }
  }

  return [...votes.values()]
    .sort((a, b) => b.score - a.score || b.reliability - a.reliability || b.length - a.length)[0]?.value;
}

function mergeCanonical(candidates: AddressMorphismCandidate[]) {
  const merged: CanonicalAddressParts = {};
  for (const key of CANONICAL_MERGE_FIELDS) {
    const value = chooseConsensusValue(candidates, key);
    if (value) merged[key] = value;
  }
  if (merged.country_code) merged.country_code = merged.country_code.toLowerCase();
  return merged;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function centroid(candidates: AddressMorphismCandidate[]) {
  const positioned = candidates.filter(candidate =>
    Number.isFinite(candidate.lat) && Number.isFinite(candidate.lon)
  );
  if (!positioned.length) return undefined;
  return {
    lat: average(positioned.map(candidate => Number(candidate.lat))),
    lon: average(positioned.map(candidate => Number(candidate.lon))),
  };
}

function sourceReliability(sources: string[]) {
  if (!sources.length) return 0.25;
  const reliabilities = Array.from(new Set(sources))
    .map(source => SOURCE_RELIABILITY[source] ?? 0.7)
    .sort((a, b) => b - a);
  const [base = 0.25, ...secondary] = reliabilities;
  const corroboration = secondary
    .slice(0, 4)
    .reduce((sum, reliability, index) => sum + reliability * (0.08 / (index + 1)), 0);
  return clamp(base + corroboration, 0.25, 0.99);
}

function stableHash(value: string) {
  return sha256Hex(value.normalize('NFKC')).slice(0, 32).toUpperCase();
}

function canonicalString(canonical: CanonicalAddressParts) {
  const shouldUsePlusCode = !clean(canonical.postcode) && !clean(canonical.road) && !clean(canonical.house_number);
  return [
    canonical.country_code,
    canonical.postcode,
    canonical.state,
    canonical.city,
    canonical.district,
    canonical.subdistrict || canonical.suburb,
    canonical.road,
    canonical.house_number,
    canonical.building,
    canonical.poi,
    shouldUsePlusCode ? canonical.plus_code : undefined,
  ].map(value => clean(value)).filter(Boolean).join('|');
}

function tokenOverlapScore(label: string, input: string) {
  const labelTokens = new Set(clean(label).split(/\s+/).filter(Boolean));
  const inputTokens = clean(input).split(/\s+/).filter(Boolean);
  if (!labelTokens.size || !inputTokens.length) return 0;
  const hits = inputTokens.filter(token => labelTokens.has(token)).length;
  return hits / inputTokens.length;
}

export function buildAddressPid(canonical: CanonicalAddressParts) {
  const key = canonicalString(canonical);
  return `AMT-${stableHash(key || 'unresolved')}`;
}

function clusterId(candidates: AddressMorphismCandidate[]) {
  return stableHash(candidates.map(candidate => candidate.id || candidate.label).sort().join('|')).slice(0, 10);
}

function candidateSortKey(candidate: AddressMorphismCandidate) {
  return [
    candidate.id,
    canonicalString(candidate.canonical),
    candidate.label,
  ].map(value => clean(value)).join('|');
}

function candidateDedupeKey(candidate: AddressMorphismCandidate) {
  if (candidate.id) return `id:${clean(candidate.id)}`;
  const lat = Number.isFinite(candidate.lat) ? Number(candidate.lat).toFixed(5) : '';
  const lon = Number.isFinite(candidate.lon) ? Number(candidate.lon).toFixed(5) : '';
  return [
    canonicalString(candidate.canonical),
    lat,
    lon,
    clean(candidate.label),
  ].filter(Boolean).join('|');
}

function mergeCandidateEvidence(left: AddressMorphismCandidate, right: AddressMorphismCandidate): AddressMorphismCandidate {
  const leftWeight = candidateEvidenceWeight(left);
  const rightWeight = candidateEvidenceWeight(right);
  const label = rightWeight > leftWeight ? right.label : left.label;
  const preferred = rightWeight > leftWeight ? right : left;
  const other = preferred === right ? left : right;
  const bothPositioned =
    Number.isFinite(left.lat) && Number.isFinite(left.lon) &&
    Number.isFinite(right.lat) && Number.isFinite(right.lon);

  return {
    ...other,
    ...preferred,
    id: left.id || right.id,
    label,
    canonical: mergeCanonical([left, right]),
    lat: bothPositioned ? average([Number(left.lat), Number(right.lat)]) : preferred.lat ?? other.lat,
    lon: bothPositioned ? average([Number(left.lon), Number(right.lon)]) : preferred.lon ?? other.lon,
    sources: Array.from(new Set([...(left.sources ?? []), ...(right.sources ?? [])])),
    confidence: Math.max(left.confidence ?? 0, right.confidence ?? 0),
    validationScore: Math.max(left.validationScore ?? 0, right.validationScore ?? 0),
    deliverySuccesses: (left.deliverySuccesses ?? 0) + (right.deliverySuccesses ?? 0),
    deliveryFailures: (left.deliveryFailures ?? 0) + (right.deliveryFailures ?? 0),
    historyEvents: [...(left.historyEvents ?? []), ...(right.historyEvents ?? [])],
    naturalContext: preferred.naturalContext ?? other.naturalContext,
  };
}

function dedupeAddressCandidates(candidates: AddressMorphismCandidate[]) {
  const deduped = new Map<string, AddressMorphismCandidate>();
  for (const candidate of candidates) {
    const key = candidateDedupeKey(candidate);
    const existing = deduped.get(key);
    deduped.set(key, existing ? mergeCandidateEvidence(existing, candidate) : candidate);
  }
  return [...deduped.values()];
}

function fieldCompleteness(canonical: CanonicalAddressParts, isNaturalAddress: boolean) {
  const fields = isNaturalAddress ? NATURAL_EVIDENCE_FIELDS : POSTAL_EVIDENCE_FIELDS;
  return fields.filter(key => clean(canonical[key])).length / fields.length;
}

function averagePairDistance(candidates: AddressMorphismCandidate[]) {
  if (candidates.length < 2) return 0.14;
  const distances: number[] = [];
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      distances.push(structuralDissimilarity(candidates[i], candidates[j]));
    }
  }
  return average(distances);
}

function consensusScore(candidates: AddressMorphismCandidate[]) {
  if (candidates.length < 2) return 0.72;
  return clamp(1 - averagePairDistance(candidates) / 0.34);
}

function fieldConflictPenalty(candidates: AddressMorphismCandidate[]) {
  let penalty = 0;
  for (const [field, weight] of FIELD_WEIGHTS) {
    const values = candidates
      .map(candidate => candidate.canonical[field])
      .filter(value => clean(value));
    if (values.length < 2) continue;
    for (let i = 0; i < values.length; i += 1) {
      for (let j = i + 1; j < values.length; j += 1) {
        const similarity = fieldSimilarity(values[i], values[j]);
        if (similarity < 0.66) penalty += weight * (1 - similarity);
      }
    }
  }
  return clamp(penalty, 0, 0.35);
}

function clusterSupport(
  candidates: AddressMorphismCandidate[],
  sources: string[],
  canonical: CanonicalAddressParts,
): AddressMorphismClusterSupport {
  const isNaturalAddress = candidates.some(candidate => candidate.naturalContext);
  return {
    candidateCount: candidates.length,
    sourceCount: sources.length,
    fieldCompleteness: fieldCompleteness(canonical, isNaturalAddress),
    sourceReliability: sourceReliability(sources),
    consensus: consensusScore(candidates),
    history: historyStatsForCluster({ candidates }).confidence,
    conflictPenalty: fieldConflictPenalty(candidates),
  };
}

export function clusterAddressCandidates(
  candidates: AddressMorphismCandidate[],
  threshold = 0.34,
): AddressMorphismCluster[] {
  const clusters: AddressMorphismCandidate[][] = [];
  const orderedCandidates = dedupeAddressCandidates(candidates)
    .sort((a, b) => candidateSortKey(a).localeCompare(candidateSortKey(b)));

  for (const candidate of orderedCandidates) {
    const cluster = clusters.find(existing =>
      existing.every(member => structuralDissimilarity(member, candidate) <= threshold)
    );
    if (cluster) cluster.push(candidate);
    else clusters.push([candidate]);
  }

  return clusters.map(group => {
    const canonical = mergeCanonical(group);
    const center = centroid(group);
    const sources = Array.from(new Set(group.flatMap(candidate => candidate.sources || [])));
    const confidence = Math.max(...group.map(candidate => candidate.confidence ?? 0), 0);
    const support = clusterSupport(group, sources, canonical);
    return {
      id: clusterId(group),
      canonical,
      label: group[0].label,
      candidates: group,
      centroid: center,
      sources,
      confidence,
      probability: 0,
      energy: Number.POSITIVE_INFINITY,
      pid: buildAddressPid(canonical),
      support,
    };
  });
}

function contextPenalty(cluster: AddressMorphismCluster, context: AddressMorphismContext) {
  let penalty = 0;
  if (context.countryCode && country(cluster.canonical.country_code) && country(context.countryCode) !== country(cluster.canonical.country_code)) {
    penalty += 0.35;
  }
  if (context.postcode && postcode(cluster.canonical.postcode) && postcode(context.postcode) !== postcode(cluster.canonical.postcode)) {
    penalty += 0.22;
  }
  if (context.state && clean(cluster.canonical.state) && clean(context.state) !== clean(cluster.canonical.state)) {
    penalty += 0.16;
  }
  if (context.lat !== undefined && context.lon !== undefined && cluster.centroid) {
    penalty += Math.min(0.45, haversineKm(context.lat, context.lon, cluster.centroid.lat, cluster.centroid.lon) / 20);
  }
  return penalty;
}

function evidenceScore(cluster: AddressMorphismCluster) {
  const sourceSupport = Math.min(1, Math.log2(cluster.support.sourceCount + 1) / 2.5);
  const naturalSupport = cluster.candidates.some(candidate => candidate.naturalContext) ? 0.16 : 0;
  return clamp(
    cluster.support.fieldCompleteness * 0.34 +
    cluster.support.sourceReliability * 0.26 +
    cluster.confidence * 0.16 +
    cluster.support.consensus * 0.14 +
    sourceSupport * 0.08 +
    cluster.support.history * 0.08 +
    naturalSupport -
    cluster.support.conflictPenalty
  );
}

function deliveryPenalty(cluster: AddressMorphismCluster) {
  const history = historyStatsForCluster(cluster);
  if (!history.mass) return 0.08;
  const evidenceMass = 1 - Math.exp(-history.mass / 4);
  const successBonus = Math.min(0.08, history.confidence * evidenceMass * 0.1);
  return clamp((1 - history.confidence) * 0.44 - successBonus, 0, 0.45);
}

export function energyForCluster(
  cluster: AddressMorphismCluster,
  input: string,
  context: AddressMorphismContext = {},
) {
  const queryCandidates = expandSearchQuery(input);
  const textScore = Math.max(
    scoreSearchCandidate(cluster.label, queryCandidates),
    scoreSearchCandidate(canonicalString(cluster.canonical), queryCandidates),
    tokenOverlapScore(`${cluster.label} ${canonicalString(cluster.canonical)}`, input),
  );
  const validationScore = Math.max(...cluster.candidates.map(candidate => candidate.validationScore ?? 0), 0);
  const evidence = evidenceScore(cluster);

  return Math.max(0, Math.min(2,
    (1 - textScore) * 0.34 +
    contextPenalty(cluster, context) +
    (1 - evidence) * 0.28 +
    (1 - validationScore) * 0.08 +
    deliveryPenalty(cluster)
  ));
}

function thresholdsForPurpose(purpose: AddressMorphismContext['purpose']) {
  return PURPOSE_THRESHOLDS[purpose ?? 'search'];
}

function decisionRisk(
  best: AddressMorphismCluster | null,
  second: AddressMorphismCluster | null,
  evidence: number,
  entropy: number,
  thresholds: AddressMorphismDecisionThresholds,
) {
  if (!best) return 1;
  const margin = second ? second.energy - best.energy : thresholds.ambiguousMargin;
  const evidenceRisk = clamp((thresholds.verifiedEvidence - evidence) / thresholds.verifiedEvidence);
  const energyRisk = clamp(best.energy / thresholds.maxUnresolvedEnergy);
  const probabilityRisk = clamp(1 - best.probability);
  const ambiguityRisk = second ? clamp((thresholds.ambiguousMargin - margin) / thresholds.ambiguousMargin) : 0;
  const entropyRisk = clamp(entropy / Math.max(thresholds.maxVerifiedEntropy, 0.1));
  return clamp(
    evidenceRisk * 0.3 +
    energyRisk * 0.25 +
    probabilityRisk * 0.2 +
    ambiguityRisk * 0.15 +
    entropyRisk * 0.1
  );
}

function statusFor(
  best: AddressMorphismCluster | null,
  second: AddressMorphismCluster | null,
  context: AddressMorphismContext,
  entropy: number,
): { status: AddressMorphismStatus } & AddressMorphismDecision {
  const thresholds = thresholdsForPurpose(context.purpose);
  if (!best) {
    return {
      status: 'unresolved',
      reason: 'no candidates',
      evidence: 0,
      margin: null,
      probability: 0,
      risk: 1,
      thresholds,
    };
  }
  const evidence = evidenceScore(best);
  const margin = second ? second.energy - best.energy : null;
  const risk = decisionRisk(best, second, evidence, entropy, thresholds);
  const isNaturalAddress = best.candidates.some(candidate => candidate.naturalContext);
  const lacksPostalStreet = !clean(best.canonical.postcode) || (!clean(best.canonical.road) && !clean(best.canonical.house_number));
  const baseDecision = {
    evidence,
    margin,
    probability: best.probability,
    risk,
    thresholds,
  };

  if (evidence < thresholds.minEvidence) {
    return { status: 'unresolved', reason: 'best candidate evidence is too weak', ...baseDecision };
  }
  if (best.energy > thresholds.maxUnresolvedEnergy) {
    return { status: 'unresolved', reason: 'best candidate energy is too high', ...baseDecision };
  }
  if (second && (second.energy - best.energy < thresholds.ambiguousMargin || best.probability < thresholds.ambiguousProbability)) {
    return { status: 'ambiguous', reason: 'top candidates are too close', ...baseDecision };
  }
  if (isNaturalAddress && lacksPostalStreet) {
    return { status: 'partial', ...baseDecision };
  }
  if (
    best.energy < thresholds.verifiedEnergy &&
    evidence >= thresholds.verifiedEvidence &&
    best.probability >= thresholds.verifiedProbability &&
    entropy <= thresholds.maxVerifiedEntropy
  ) {
    return { status: 'verified', ...baseDecision };
  }
  return { status: 'partial', ...baseDecision };
}

function posteriorProbabilities(clusters: AddressMorphismCluster[], temperature = 0.16) {
  if (!clusters.length) return [];
  const safeTemperature = Math.max(0.04, Math.min(1, temperature));
  const minEnergy = Math.min(...clusters.map(cluster => cluster.energy));
  const weights = clusters.map(cluster => Math.exp(-(cluster.energy - minEnergy) / safeTemperature));
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  return weights.map(weight => weight / total);
}

function shannonEntropy(probabilities: number[]) {
  return probabilities.reduce((sum, probability) => (
    probability > 0 ? sum - probability * Math.log(probability) : sum
  ), 0);
}

export function resolveAddressMorphism({
  input,
  candidates,
  context = {},
}: {
  input: string;
  candidates: AddressMorphismCandidate[];
  context?: AddressMorphismContext;
}): AddressMorphismResult {
  const rankedClusters = clusterAddressCandidates(candidates)
    .map(cluster => ({
      ...cluster,
      energy: energyForCluster(cluster, input, context),
    }))
    .sort((a, b) => a.energy - b.energy || a.pid.localeCompare(b.pid));
  const probabilities = posteriorProbabilities(rankedClusters, context.temperature);
  const clusters = rankedClusters.map((cluster, index) => ({
    ...cluster,
    probability: probabilities[index] ?? 0,
  }));

  const selected = clusters[0] || null;
  const second = clusters[1] || null;
  const entropy = shannonEntropy(probabilities);
  const status = statusFor(selected, second, context, entropy);
  const energies = clusters.map(cluster => cluster.energy);
  const selectedConfidence = status.status === 'unresolved' ? 0 : selected?.probability ?? 0;

  return {
    status: status.status,
    pid: status.status === 'verified' || status.status === 'partial' ? selected?.pid ?? null : null,
    selected: status.status === 'unresolved' ? null : selected,
    clusters,
    confidence: selectedConfidence,
    entropy,
    decision: {
      evidence: status.evidence,
      margin: status.margin,
      probability: status.probability,
      risk: status.risk,
      thresholds: status.thresholds,
      reason: status.reason,
    },
    unresolvedReason: status.reason,
    energySummary: {
      best: energies[0] ?? Number.POSITIVE_INFINITY,
      secondBest: energies[1] ?? null,
      min: energies.length ? Math.min(...energies) : Number.POSITIVE_INFINITY,
      max: energies.length ? Math.max(...energies) : Number.POSITIVE_INFINITY,
      average: energies.length ? average(energies) : Number.POSITIVE_INFINITY,
    },
  };
}

export function rankAddressCandidatesByMorphism(
  input: string,
  candidates: AddressMorphismCandidate[],
  context: AddressMorphismContext = {},
) {
  const result = resolveAddressMorphism({ input, candidates, context });
  const energyByLabel = new Map<string, number>();
  const probabilityByLabel = new Map<string, number>();
  result.clusters.forEach(cluster => {
    cluster.candidates.forEach(candidate => {
      energyByLabel.set(candidate.id || candidate.label, cluster.energy);
      probabilityByLabel.set(candidate.id || candidate.label, cluster.probability);
    });
  });
  return candidates
    .map(candidate => ({
      ...candidate,
      morphism_energy: energyByLabel.get(candidate.id || candidate.label) ?? Number.POSITIVE_INFINITY,
      morphism_probability: probabilityByLabel.get(candidate.id || candidate.label) ?? 0,
      morphism_status: result.status,
      morphism_pid: result.pid,
    }))
    .sort((a, b) => a.morphism_energy - b.morphism_energy);
}
