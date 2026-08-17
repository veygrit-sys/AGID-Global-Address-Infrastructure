import {
  normalizeAddressText,
  type AddressEvidenceRecord,
  type AddressFieldName,
  type AddressSourceKind,
  type CountryFusionAdapter,
  type FusedAddressEntity,
} from "./addressFusionEngine";

export type ValidationStageId =
  | "administrative_hierarchy"
  | "locality"
  | "road"
  | "building_position"
  | "postal_zone";

export type ValidationStatus =
  | "pass"
  | "partial"
  | "review"
  | "fail"
  | "unavailable";

export type ValidationDecision =
  | "verified"
  | "deliverable"
  | "partial"
  | "manual_review"
  | "rejected";

export interface ValidationStageResult {
  id: ValidationStageId;
  status: ValidationStatus;
  confidence: number;
  coverage: number;
  evidenceSourceIds: string[];
  reasons: string[];
  blockedBy?: ValidationStageId;
}

export interface AddressConfidenceResult {
  addressId: string;
  countryCode: string;
  confidence: number;
  coverage: number;
  decision: ValidationDecision;
  highestValidatedStage?: ValidationStageId;
  stages: ValidationStageResult[];
  requiresManualReview: boolean;
  warnings: string[];
}

export interface ConfidencePipelinePolicy {
  passThreshold: number;
  partialThreshold: number;
  reviewThreshold: number;
  strongSourceAuthority: number;
  allowRoadlessBuilding: boolean;
}

export const DEFAULT_CONFIDENCE_POLICY: ConfidencePipelinePolicy = {
  passThreshold: 0.82,
  partialThreshold: 0.64,
  reviewThreshold: 0.42,
  strongSourceAuthority: 0.78,
  allowRoadlessBuilding: true,
};

const STAGE_ORDER: readonly ValidationStageId[] = [
  "administrative_hierarchy",
  "locality",
  "road",
  "building_position",
  "postal_zone",
];

const STAGE_WEIGHT: Record<ValidationStageId, number> = {
  administrative_hierarchy: 0.25,
  locality: 0.22,
  road: 0.18,
  building_position: 0.22,
  postal_zone: 0.13,
};

const STAGE_SOURCES: Record<ValidationStageId, readonly AddressSourceKind[]> = {
  administrative_hierarchy: [
    "official_address",
    "administrative",
    "cadastre",
    "statistics",
    "osm",
  ],
  locality: [
    "official_address",
    "administrative",
    "statistics",
    "postal",
    "osm",
  ],
  road: ["official_address", "road", "postal", "cadastre", "osm"],
  building_position: [
    "official_address",
    "building",
    "cadastre",
    "coordinates",
    "osm",
  ],
  postal_zone: ["postal", "official_address", "administrative", "osm"],
};

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

function stageStatus(
  confidence: number,
  coverage: number,
  policy: ConfidencePipelinePolicy,
): ValidationStatus {
  if (coverage === 0) return "unavailable";
  if (confidence >= policy.passThreshold && coverage >= 0.7) return "pass";
  if (confidence >= policy.partialThreshold && coverage >= 0.45) return "partial";
  if (confidence >= policy.reviewThreshold) return "review";
  return "fail";
}

function supportingEvidence(
  entity: FusedAddressEntity,
  records: readonly AddressEvidenceRecord[],
  fields: readonly AddressFieldName[],
  kinds: readonly AddressSourceKind[],
): AddressEvidenceRecord[] {
  const sourceIds = new Set(entity.sourceIds);
  return records.filter((record) => {
    if (
      record.countryCode !== entity.countryCode ||
      !sourceIds.has(record.sourceId) ||
      !kinds.includes(record.sourceKind)
    ) {
      return false;
    }
    return fields.some((field) => {
      const fused = entity.fields[field]?.value;
      const candidate = record.fields[field];
      return (
        fused !== undefined &&
        candidate !== undefined &&
        normalizeAddressText(fused) === normalizeAddressText(candidate)
      );
    });
  });
}

function sourceStrength(records: readonly AddressEvidenceRecord[]): number {
  if (!records.length) return 0;
  const authorities = records.map((record) => {
    const classFactor =
      record.evidenceClass === "verified"
        ? 1
        : record.evidenceClass === "observed"
          ? 0.82
          : record.evidenceClass === "derived"
            ? 0.64
            : 0.35;
    return clamp(record.authority) * classFactor;
  });
  const best = Math.max(...authorities);
  const sourceKinds = new Set(records.map((record) => record.sourceKind)).size;
  const independentBonus = Math.min(0.16, Math.max(0, sourceKinds - 1) * 0.04);
  return clamp(best + independentBonus);
}

function averageFieldConfidence(
  entity: FusedAddressEntity,
  fields: readonly AddressFieldName[],
): { confidence: number; coverage: number; present: AddressFieldName[] } {
  const present = fields.filter((field) => entity.fields[field] !== undefined);
  if (!present.length) return { confidence: 0, coverage: 0, present: [] };
  const confidence =
    present.reduce(
      (sum, field) => sum + (entity.fields[field]?.confidence ?? 0),
      0,
    ) / present.length;
  return {
    confidence,
    coverage: present.length / fields.length,
    present,
  };
}

function makeStage(
  id: ValidationStageId,
  confidence: number,
  coverage: number,
  evidence: readonly AddressEvidenceRecord[],
  reasons: string[],
  policy: ConfidencePipelinePolicy,
  blockedBy?: ValidationStageId,
): ValidationStageResult {
  const adjusted = blockedBy ? Math.min(confidence, 0.55) : confidence;
  return {
    id,
    status: stageStatus(adjusted, coverage, policy),
    confidence: clamp(adjusted),
    coverage: clamp(coverage),
    evidenceSourceIds: [...new Set(evidence.map((record) => record.sourceId))].sort(),
    reasons,
    blockedBy,
  };
}

function administrativeStage(
  entity: FusedAddressEntity,
  records: readonly AddressEvidenceRecord[],
  policy: ConfidencePipelinePolicy,
): ValidationStageResult {
  const fields: AddressFieldName[] = ["admin1", "admin2", "admin3"];
  const summary = averageFieldConfidence(entity, fields);
  const evidence = supportingEvidence(
    entity,
    records,
    summary.present,
    STAGE_SOURCES.administrative_hierarchy,
  );
  const confidence = summary.confidence * 0.7 + sourceStrength(evidence) * 0.3;
  const reasons: string[] = [];
  if (!entity.fields.admin1) reasons.push("admin1 is not independently resolved");
  if (summary.present.length < 2) {
    reasons.push("administrative hierarchy has fewer than two resolved levels");
  }
  if (!evidence.length) reasons.push("no matching administrative evidence source");
  const result = makeStage(
    "administrative_hierarchy",
    confidence,
    summary.coverage,
    evidence,
    reasons,
    policy,
  );
  if (result.status === "unavailable") result.status = "fail";
  return result;
}

function localityStage(
  entity: FusedAddressEntity,
  records: readonly AddressEvidenceRecord[],
  policy: ConfidencePipelinePolicy,
  administration: ValidationStageResult,
): ValidationStageResult {
  const fields: AddressFieldName[] = ["locality", "sublocality"];
  const summary = averageFieldConfidence(entity, fields);
  const evidence = supportingEvidence(
    entity,
    records,
    summary.present,
    STAGE_SOURCES.locality,
  );
  const confidence = summary.confidence * 0.68 + sourceStrength(evidence) * 0.32;
  const reasons: string[] = [];
  if (!entity.fields.locality) reasons.push("locality is unresolved");
  if (!evidence.length) reasons.push("locality lacks matching source evidence");
  const blocked =
    administration.status === "fail" ? "administrative_hierarchy" : undefined;
  if (blocked) reasons.push("locality cannot outrank a failed hierarchy");
  const result = makeStage(
    "locality",
    confidence,
    summary.coverage,
    evidence,
    reasons,
    policy,
    blocked,
  );
  if (result.status === "unavailable") result.status = "fail";
  return result;
}

function roadStage(
  entity: FusedAddressEntity,
  records: readonly AddressEvidenceRecord[],
  policy: ConfidencePipelinePolicy,
  locality: ValidationStageResult,
): ValidationStageResult {
  const fields: AddressFieldName[] = ["street"];
  const summary = averageFieldConfidence(entity, fields);
  const evidence = supportingEvidence(
    entity,
    records,
    summary.present,
    STAGE_SOURCES.road,
  );
  const confidence = summary.confidence * 0.66 + sourceStrength(evidence) * 0.34;
  const reasons: string[] = [];
  if (!entity.fields.street) reasons.push("road/street is unavailable");
  if (!evidence.length && entity.fields.street) {
    reasons.push("road name has no matching road evidence");
  }
  const blocked = locality.status === "fail" ? "locality" : undefined;
  if (blocked) reasons.push("road cannot outrank a failed locality");
  return makeStage(
    "road",
    confidence,
    summary.coverage,
    evidence,
    reasons,
    policy,
    blocked,
  );
}

function buildingStage(
  entity: FusedAddressEntity,
  records: readonly AddressEvidenceRecord[],
  policy: ConfidencePipelinePolicy,
  road: ValidationStageResult,
): ValidationStageResult {
  const fields: AddressFieldName[] = [
    "buildingId",
    "buildingName",
    "houseNumber",
    "parcelId",
  ];
  const summary = averageFieldConfidence(entity, fields);
  const evidence = supportingEvidence(
    entity,
    records,
    summary.present,
    STAGE_SOURCES.building_position,
  );
  const hasCoordinates = Boolean(entity.latitude && entity.longitude);
  const coordinateConfidence = hasCoordinates
    ? ((entity.latitude?.confidence ?? 0) + (entity.longitude?.confidence ?? 0)) / 2
    : 0;
  const coverage = clamp(summary.coverage * 0.75 + (hasCoordinates ? 0.25 : 0));
  let confidence =
    summary.confidence * 0.5 +
    sourceStrength(evidence) * 0.28 +
    coordinateConfidence * 0.22;
  const reasons: string[] = [];
  if (!summary.present.length) reasons.push("building identifier/name is unresolved");
  if (!hasCoordinates) reasons.push("building position is unavailable");
  if (!evidence.length) reasons.push("building lacks matching source evidence");

  let blocked: ValidationStageId | undefined;
  if (road.status === "fail") {
    const strongRoadlessBuilding =
      policy.allowRoadlessBuilding &&
      hasCoordinates &&
      evidence.some(
        (record) =>
          record.authority >= policy.strongSourceAuthority &&
          ["official_address", "building", "cadastre"].includes(record.sourceKind),
      );
    if (strongRoadlessBuilding) {
      confidence = Math.min(confidence, 0.78);
      reasons.push("roadless/rural building accepted with authoritative geometry");
    } else {
      blocked = "road";
      reasons.push("building cannot outrank a failed road without strong geometry");
    }
  }
  return makeStage(
    "building_position",
    confidence,
    coverage,
    evidence,
    reasons,
    policy,
    blocked,
  );
}

function postalStage(
  entity: FusedAddressEntity,
  records: readonly AddressEvidenceRecord[],
  adapter: CountryFusionAdapter,
  policy: ConfidencePipelinePolicy,
  locality: ValidationStageResult,
): ValidationStageResult {
  if (!adapter.postcodePattern && !entity.fields.postcode) {
    return {
      id: "postal_zone",
      status: "unavailable",
      confidence: 0,
      coverage: 0,
      evidenceSourceIds: [],
      reasons: ["adapter does not assert a nationwide postcode system"],
    };
  }
  const summary = averageFieldConfidence(entity, ["postcode"]);
  const evidence = supportingEvidence(
    entity,
    records,
    summary.present,
    STAGE_SOURCES.postal_zone,
  );
  const postcode = entity.fields.postcode?.value;
  const formatValid =
    !postcode || !adapter.postcodePattern
      ? Boolean(postcode)
      : adapter.postcodePattern.test(postcode);
  let confidence = summary.confidence * 0.62 + sourceStrength(evidence) * 0.38;
  const reasons: string[] = [];
  if (!postcode) reasons.push("postcode is unresolved");
  if (postcode && !formatValid) {
    confidence = Math.min(confidence, 0.3);
    reasons.push("postcode fails the country format rule");
  }
  if (!evidence.length && postcode) reasons.push("postcode lacks matching postal evidence");
  const blocked = locality.status === "fail" ? "locality" : undefined;
  if (blocked) reasons.push("postal zone cannot outrank a failed locality");
  return makeStage(
    "postal_zone",
    confidence,
    summary.coverage,
    evidence,
    reasons,
    policy,
    blocked,
  );
}

function overallDecision(
  confidence: number,
  coverage: number,
  stages: readonly ValidationStageResult[],
): ValidationDecision {
  if (stages[0].status === "fail") return "rejected";
  if (confidence >= 0.86 && coverage >= 0.78 && stages.every(
    (stage) => ["pass", "partial", "unavailable"].includes(stage.status),
  )) {
    return "verified";
  }
  if (confidence >= 0.72 && stages[1].status !== "fail") return "deliverable";
  if (confidence >= 0.5) return "partial";
  return stages.some((stage) => stage.status === "review")
    ? "manual_review"
    : "rejected";
}

export function evaluateAddressConfidence(
  entity: FusedAddressEntity,
  records: readonly AddressEvidenceRecord[],
  adapter: CountryFusionAdapter,
  overrides: Partial<ConfidencePipelinePolicy> = {},
): AddressConfidenceResult {
  const policy = { ...DEFAULT_CONFIDENCE_POLICY, ...overrides };
  if (entity.countryCode !== adapter.countryCode) {
    throw new Error("entity country and adapter country must match");
  }

  const administration = administrativeStage(entity, records, policy);
  const locality = localityStage(entity, records, policy, administration);
  const road = roadStage(entity, records, policy, locality);
  const building = buildingStage(entity, records, policy, road);
  const postal = postalStage(entity, records, adapter, policy, locality);
  const stages = [administration, locality, road, building, postal];

  const available = stages.filter((stage) => stage.status !== "unavailable");
  const availableWeight = available.reduce(
    (sum, stage) => sum + STAGE_WEIGHT[stage.id],
    0,
  );
  const weighted =
    available.reduce(
      (sum, stage) => sum + stage.confidence * STAGE_WEIGHT[stage.id],
      0,
    ) / Math.max(availableWeight, Number.EPSILON);
  const coverage =
    available.reduce(
      (sum, stage) => sum + stage.coverage * STAGE_WEIGHT[stage.id],
      0,
    ) / Math.max(availableWeight, Number.EPSILON);

  let confidence = weighted * (0.72 + coverage * 0.28);
  if (administration.status === "fail") confidence = Math.min(confidence, 0.35);
  if (locality.status === "fail") confidence = Math.min(confidence, 0.5);
  if (road.status === "fail" && building.status === "fail") {
    confidence = Math.min(confidence, 0.62);
  }
  if (building.status === "fail") confidence = Math.min(confidence, 0.74);
  if (postal.status === "fail") confidence = Math.min(confidence, 0.9);
  confidence = clamp(confidence);

  const validated = stages.filter((stage) =>
    ["pass", "partial"].includes(stage.status),
  );
  const highestValidatedStage = [...STAGE_ORDER]
    .reverse()
    .find((id) => validated.some((stage) => stage.id === id));
  const warnings = stages.flatMap((stage) =>
    stage.reasons.map((reason) => `${stage.id}: ${reason}`),
  );
  const decision = overallDecision(confidence, coverage, stages);

  return {
    addressId: entity.id,
    countryCode: entity.countryCode,
    confidence,
    coverage: clamp(coverage),
    decision,
    highestValidatedStage,
    stages,
    requiresManualReview:
      decision === "manual_review" ||
      stages.some((stage) => stage.status === "review"),
    warnings,
  };
}
