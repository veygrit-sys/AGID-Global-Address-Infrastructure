/**
 * AGID Address Fusion Engine.
 *
 * This module joins evidence without bundling any source dataset. Every value keeps
 * provenance, redistribution status and an evidence class so public exports can be
 * separated from internal, licensed enrichment.
 */

export type AddressSourceKind =
  | "official_address"
  | "postal"
  | "building"
  | "road"
  | "cadastre"
  | "administrative"
  | "coordinates"
  | "statistics"
  | "osm";

export type EvidenceClass = "verified" | "observed" | "derived" | "inferred";
export type Redistribution = "open" | "attribution" | "restricted" | "unknown";

export const ADDRESS_FIELDS = [
  "admin1",
  "admin2",
  "admin3",
  "locality",
  "sublocality",
  "street",
  "houseNumber",
  "buildingName",
  "unit",
  "postcode",
  "parcelId",
  "buildingId",
  "officialId",
] as const;

export type AddressFieldName = (typeof ADDRESS_FIELDS)[number];

export interface AddressEvidenceFields
  extends Partial<Record<AddressFieldName, string>> {
  lat?: number;
  lon?: number;
}

export interface AddressEvidenceRecord {
  sourceId: string;
  countryCode: string;
  sourceKind: AddressSourceKind;
  evidenceClass: EvidenceClass;
  authority: number;
  observedAt?: string;
  redistribution: Redistribution;
  fields: AddressEvidenceFields;
}

export interface SourcePlanEntry {
  id: string;
  label: string;
  kind: AddressSourceKind;
  status: Redistribution | "research-required";
  priority: number;
  notes?: string;
}

export interface CountryFusionAdapter {
  countryCode: string;
  countryName: string;
  languages: readonly string[];
  postcodePattern?: RegExp;
  sourcePlan: readonly SourcePlanEntry[];
  normalize?: (
    field: AddressFieldName,
    value: string,
  ) => string;
  clusterRadiusMeters?: number;
}

export interface FusedField<T = string> {
  value: T;
  confidence: number;
  evidenceClass: EvidenceClass;
  provenance: string[];
  redistributable: boolean;
}

export interface FusedAddressEntity {
  id: string;
  countryCode: string;
  fields: Partial<Record<AddressFieldName, FusedField<string>>>;
  latitude?: FusedField<number>;
  longitude?: FusedField<number>;
  sourceIds: string[];
  confidence: number;
  conflicts: string[];
  exportable: boolean;
}

const EVIDENCE_WEIGHT: Record<EvidenceClass, number> = {
  verified: 1,
  observed: 0.82,
  derived: 0.64,
  inferred: 0.35,
};

const SOURCE_WEIGHT: Record<AddressSourceKind, number> = {
  official_address: 1,
  postal: 0.94,
  cadastre: 0.9,
  administrative: 0.86,
  building: 0.82,
  road: 0.78,
  coordinates: 0.76,
  statistics: 0.62,
  osm: 0.6,
};

const REDISTRIBUTABLE = new Set<Redistribution>(["open", "attribution"]);

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeAddressText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\s,;]+/g, " ")
    .trim()
    .toLocaleLowerCase("und");
}

function fieldValue(
  record: AddressEvidenceRecord,
  field: AddressFieldName,
  adapter: CountryFusionAdapter,
): string | undefined {
  const value = record.fields[field]?.trim();
  if (!value) return undefined;
  return adapter.normalize?.(field, value) ?? normalizeAddressText(value);
}

function freshnessWeight(observedAt?: string): number {
  if (!observedAt) return 0.9;
  const timestamp = Date.parse(observedAt);
  if (!Number.isFinite(timestamp)) return 0.85;
  const ageYears = Math.max(0, (Date.now() - timestamp) / 31_557_600_000);
  return Math.max(0.55, Math.pow(0.5, ageYears / 5));
}

function evidenceWeight(record: AddressEvidenceRecord): number {
  return (
    clamp(record.authority) *
    EVIDENCE_WEIGHT[record.evidenceClass] *
    SOURCE_WEIGHT[record.sourceKind] *
    freshnessWeight(record.observedAt)
  );
}

export function validateEvidenceRecord(
  record: AddressEvidenceRecord,
): string[] {
  const errors: string[] = [];
  if (!/^[A-Z]{2}$/.test(record.countryCode)) {
    errors.push("countryCode must be ISO 3166-1 alpha-2 uppercase");
  }
  if (!record.sourceId.trim()) errors.push("sourceId is required");
  if (record.authority < 0 || record.authority > 1) {
    errors.push("authority must be between 0 and 1");
  }
  const { lat, lon } = record.fields;
  if (lat !== undefined && (lat < -90 || lat > 90)) {
    errors.push("latitude is out of range");
  }
  if (lon !== undefined && (lon < -180 || lon > 180)) {
    errors.push("longitude is out of range");
  }
  if (record.observedAt && !Number.isFinite(Date.parse(record.observedAt))) {
    errors.push("observedAt must be an ISO-compatible date");
  }
  return errors;
}

export function haversineMeters(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const radius = 6_371_008.8;
  const dLat = radians(b.lat - a.lat);
  const dLon = radians(b.lon - a.lon);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function sameAddressBlock(
  left: AddressEvidenceRecord,
  right: AddressEvidenceRecord,
  adapter: CountryFusionAdapter,
): boolean {
  if (left.countryCode !== right.countryCode) return false;
  const l = left.fields;
  const r = right.fields;
  if (
    l.lat !== undefined &&
    l.lon !== undefined &&
    r.lat !== undefined &&
    r.lon !== undefined
  ) {
    return (
      haversineMeters({ lat: l.lat, lon: l.lon }, { lat: r.lat, lon: r.lon }) <=
      (adapter.clusterRadiusMeters ?? 35)
    );
  }

  const comparable: AddressFieldName[] = [
    "officialId",
    "buildingId",
    "parcelId",
    "postcode",
    "locality",
    "street",
    "houseNumber",
  ];
  let compared = 0;
  let matched = 0;
  for (const field of comparable) {
    const lv = fieldValue(left, field, adapter);
    const rv = fieldValue(right, field, adapter);
    if (!lv || !rv) continue;
    compared += 1;
    if (lv === rv) matched += 1;
    if (
      ["officialId", "buildingId", "parcelId"].includes(field) &&
      lv === rv
    ) {
      return true;
    }
  }
  return compared >= 2 && matched / compared >= 0.66;
}

export function clusterAddressEvidence(
  records: readonly AddressEvidenceRecord[],
  adapter: CountryFusionAdapter,
): AddressEvidenceRecord[][] {
  const remaining = [...records];
  const clusters: AddressEvidenceRecord[][] = [];
  while (remaining.length) {
    const seed = remaining.shift()!;
    const cluster = [seed];
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (cluster.some((member) => sameAddressBlock(member, remaining[index], adapter))) {
        cluster.push(remaining[index]);
        remaining.splice(index, 1);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

interface Vote {
  display: string;
  normalized: string;
  score: number;
  strongest: EvidenceClass;
  records: AddressEvidenceRecord[];
}

const EVIDENCE_RANK: Record<EvidenceClass, number> = {
  inferred: 0,
  derived: 1,
  observed: 2,
  verified: 3,
};

function fuseField(
  records: readonly AddressEvidenceRecord[],
  field: AddressFieldName,
  adapter: CountryFusionAdapter,
  conflicts: string[],
): FusedField<string> | undefined {
  const votes = new Map<string, Vote>();
  for (const record of records) {
    // House numbers are administrative/postal identifiers. Geometry may suggest
    // a location, but inferred numbers must never be promoted to an address fact.
    if (field === "houseNumber" && record.evidenceClass === "inferred") continue;
    const raw = record.fields[field]?.trim();
    const normalized = fieldValue(record, field, adapter);
    if (!raw || !normalized) continue;
    const vote = votes.get(normalized) ?? {
      display: raw,
      normalized,
      score: 0,
      strongest: record.evidenceClass,
      records: [],
    };
    vote.score += evidenceWeight(record);
    vote.records.push(record);
    if (EVIDENCE_RANK[record.evidenceClass] > EVIDENCE_RANK[vote.strongest]) {
      vote.strongest = record.evidenceClass;
      vote.display = raw;
    }
    votes.set(normalized, vote);
  }
  if (!votes.size) return undefined;

  const ranked = [...votes.values()].sort(
    (a, b) =>
      b.score - a.score ||
      EVIDENCE_RANK[b.strongest] - EVIDENCE_RANK[a.strongest] ||
      a.normalized.localeCompare(b.normalized),
  );
  const winner = ranked[0];
  const total = ranked.reduce((sum, vote) => sum + vote.score, 0);
  if (ranked.length > 1) {
    conflicts.push(
      `${field}: ${ranked.map((vote) => vote.display).join(" | ")}`,
    );
  }
  return {
    value: winner.display,
    confidence: clamp(winner.score / Math.max(total, winner.score) * 0.8 + 0.2),
    evidenceClass: winner.strongest,
    provenance: [...new Set(winner.records.map((record) => record.sourceId))].sort(),
    redistributable: winner.records.some((record) =>
      REDISTRIBUTABLE.has(record.redistribution),
    ),
  };
}

function fuseCoordinate(
  records: readonly AddressEvidenceRecord[],
  key: "lat" | "lon",
): FusedField<number> | undefined {
  const candidates = records
    .filter((record) => Number.isFinite(record.fields[key]))
    .map((record) => ({
      record,
      value: record.fields[key]!,
      weight: evidenceWeight(record),
    }));
  if (!candidates.length) return undefined;
  const total = candidates.reduce((sum, item) => sum + item.weight, 0);
  const value =
    candidates.reduce((sum, item) => sum + item.value * item.weight, 0) /
    Math.max(total, Number.EPSILON);
  const strongest = candidates.reduce((best, item) =>
    EVIDENCE_RANK[item.record.evidenceClass] >
    EVIDENCE_RANK[best.record.evidenceClass]
      ? item
      : best,
  );
  return {
    value,
    confidence: clamp(total / Math.max(1, candidates.length)),
    evidenceClass: strongest.record.evidenceClass,
    provenance: [...new Set(candidates.map((item) => item.record.sourceId))].sort(),
    redistributable: candidates.some((item) =>
      REDISTRIBUTABLE.has(item.record.redistribution),
    ),
  };
}

function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

function entityId(
  countryCode: string,
  fields: FusedAddressEntity["fields"],
  latitude?: FusedField<number>,
  longitude?: FusedField<number>,
): string {
  const identity = [
    countryCode,
    fields.officialId?.value,
    fields.buildingId?.value,
    fields.parcelId?.value,
    fields.postcode?.value,
    fields.locality?.value,
    fields.street?.value,
    fields.houseNumber?.value,
    latitude ? latitude.value.toFixed(6) : "",
    longitude ? longitude.value.toFixed(6) : "",
  ]
    .filter(Boolean)
    .map(String)
    .map(normalizeAddressText)
    .join("|");
  return `agid-${countryCode.toLowerCase()}-${stableHash(identity)}`;
}

function fuseCluster(
  records: readonly AddressEvidenceRecord[],
  adapter: CountryFusionAdapter,
): FusedAddressEntity {
  const conflicts: string[] = [];
  const fields: FusedAddressEntity["fields"] = {};
  for (const field of ADDRESS_FIELDS) {
    const fused = fuseField(records, field, adapter, conflicts);
    if (fused) fields[field] = fused;
  }
  const latitude = fuseCoordinate(records, "lat");
  const longitude = fuseCoordinate(records, "lon");
  const allValues = [
    ...Object.values(fields),
    latitude,
    longitude,
  ].filter((value): value is FusedField<string | number> => Boolean(value));
  const completeness =
    ADDRESS_FIELDS.filter((field) => fields[field]).length / ADDRESS_FIELDS.length;
  const averageConfidence =
    allValues.reduce((sum, value) => sum + value.confidence, 0) /
    Math.max(1, allValues.length);
  const sourceDiversity = new Set(records.map((record) => record.sourceKind)).size;
  const confidence = clamp(
    averageConfidence * 0.65 +
      completeness * 0.15 +
      Math.min(1, sourceDiversity / 5) * 0.2 -
      Math.min(0.2, conflicts.length * 0.025),
  );

  return {
    id: entityId(adapter.countryCode, fields, latitude, longitude),
    countryCode: adapter.countryCode,
    fields,
    latitude,
    longitude,
    sourceIds: [...new Set(records.map((record) => record.sourceId))].sort(),
    confidence,
    conflicts,
    exportable: allValues.every((value) => value.redistributable),
  };
}

export function fuseAddressEvidence(
  records: readonly AddressEvidenceRecord[],
  adapter: CountryFusionAdapter,
): FusedAddressEntity[] {
  const valid = records.filter((record) => {
    if (record.countryCode !== adapter.countryCode) return false;
    return validateEvidenceRecord(record).length === 0;
  });
  return clusterAddressEvidence(valid, adapter)
    .map((cluster) => fuseCluster(cluster, adapter))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export interface PublicAddressEntity {
  id: string;
  countryCode: string;
  fields: Partial<Record<AddressFieldName, string>>;
  lat?: number;
  lon?: number;
  confidence: number;
  attributionSourceIds: string[];
}

export function exportOpenAddressEntities(
  entities: readonly FusedAddressEntity[],
): PublicAddressEntity[] {
  return entities.map((entity) => {
    const fields: PublicAddressEntity["fields"] = {};
    const attribution = new Set<string>();
    for (const field of ADDRESS_FIELDS) {
      const value = entity.fields[field];
      if (!value?.redistributable) continue;
      fields[field] = value.value;
      value.provenance.forEach((sourceId) => attribution.add(sourceId));
    }
    const lat = entity.latitude?.redistributable
      ? entity.latitude.value
      : undefined;
    const lon = entity.longitude?.redistributable
      ? entity.longitude.value
      : undefined;
    if (entity.latitude?.redistributable) {
      entity.latitude.provenance.forEach((sourceId) => attribution.add(sourceId));
    }
    if (entity.longitude?.redistributable) {
      entity.longitude.provenance.forEach((sourceId) => attribution.add(sourceId));
    }
    return {
      id: entity.id,
      countryCode: entity.countryCode,
      fields,
      lat,
      lon,
      confidence: entity.confidence,
      attributionSourceIds: [...attribution].sort(),
    };
  });
}
