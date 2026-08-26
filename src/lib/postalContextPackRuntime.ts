import {
  POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
  POSTAL_CONTEXT_PURPOSES,
  isPostalContextAssertionEffectiveAt,
  postalContextResolutionLevelRank,
  validatePostalContextGraph,
  type PostalContextAssertion,
  type PostalContextCapabilities,
  type PostalContextGraph,
  type PostalContextNode,
  type PostalContextPurpose,
  type PostalContextResolutionLevel,
  type PostalContextResolutionStatus,
} from './postalContextGraph';
import {
  hasDefinitivePostalContextAssertionQuality,
  postalContextAssertionAllowedForUse,
} from './postalContextAssertionPolicy';
import { classifyMoroccoPostalCode, normalizePostalContextPostalCode } from './postalContextCountryPolicy';
import {
  resolvePostalContext,
  type PostalContextResolutionCandidate,
  type PostalContextResolutionComponent,
  type PostalContextResolutionResult,
} from './postalContextResolver';
import {
  POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,
  geometryIsPoint,
  haversineDistanceMeters,
  isPostalContextGeometryEffectiveAt,
  locatePointInGeometry,
  validatePostalContextGeometryCollection,
  type PostalContextGeometryCollection,
  type PostalContextGeometryFeature,
  type PostalContextPointGeometry,
  type PostalContextPosition,
  type PostalContextSpatialRelation,
} from './postalContextSpatial';
import {
  postalContextGeometryBounds,
  postalContextGeometryIntersectsBbox,
  validPostalContextBbox,
  type PostalContextBbox,
} from './postalContextTopology';

export const POSTAL_CONTEXT_RUNTIME_PACK_SCHEMA_VERSION = 'postal-context-runtime-pack/v0.1' as const;

export type PostalContextRuntimePack = {
  schemaVersion: typeof POSTAL_CONTEXT_RUNTIME_PACK_SCHEMA_VERSION;
  graph: PostalContextGraph;
  geometry: PostalContextGeometryCollection;
};

export type PostalContextRuntimePackValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type PostalContextRuntimeMaturity =
  | 'M2_experimental'
  | 'M3_candidate'
  | 'M4_stable';

export type PostalContextRuntimeAttestation = {
  descriptorDigest: string;
  sequence: number;
  maturity: PostalContextRuntimeMaturity;
  synthetic: boolean;
  promotionEligible: boolean;
  servingMode: 'experimental' | 'candidate' | 'stable' | 'test';
  integrity: 'externally_pinned' | 'in_memory_unpinned';
};

export type PostalContextRuntimeRelease = {
  countryCode: string;
  repositoryId: string;
  releaseId: string;
  manifestDigest: string;
  policyVersion: string;
  releasedAt: string;
  validTime: PostalContextGraph['release']['validTime'];
};

export type PostalContextPublicComponent = Pick<
  PostalContextNode,
  'id' | 'kind' | 'featureKind' | 'label' | 'postalCode' | 'geometryType'
>;

export type PostalContextPostalLookupAlternative = {
  postalFeature: PostalContextPublicComponent;
  contexts: PostalContextPublicComponent[];
  assertionIds: string[];
};

export type PostalContextPostalLookupResult = {
  status: 'unique' | 'ambiguous' | 'no_match' | 'invalid';
  countryCode: string;
  normalizedPostalCode?: string;
  release: PostalContextRuntimeRelease;
  postalFeatures: PostalContextPublicComponent[];
  contexts: PostalContextPublicComponent[];
  assertionIds: string[];
  alternatives: PostalContextPostalLookupAlternative[];
  geometries: PostalContextPostalGeometryResult[];
  errors: string[];
  warnings: string[];
};

type PostalContextSpatialPostalMatch = {
  geometryFeatureId: string;
  nodeId: string;
  postalCode?: string;
  relation: Exclude<PostalContextSpatialRelation, 'outside'>;
};

type PostalContextAddressPointMatch = {
  geometryFeatureId: string;
  nodeId: string;
  distanceMeters: number;
  matchRadiusMeters: number;
};

type PostalContextCoordinateResolution = {
  status: PostalContextResolutionStatus;
  purpose: PostalContextPurpose;
  release: PostalContextRuntimeRelease;
  selectedResolutionIndex?: number;
  postalMatches: PostalContextSpatialPostalMatch[];
  addressPointMatches: PostalContextAddressPointMatch[];
  resolutions: PostalContextResolutionResult[];
  errors: string[];
  warnings: string[];
};

export type PostalContextCoordinateRequest = {
  latitude: number;
  longitude: number;
  purpose: PostalContextPurpose;
  validAt: string;
  knownAt?: string;
};

export type PostalContextRuntimeOptions = {
  countryCode?: string;
  maxAddressPointCandidates?: number;
  attestation?: PostalContextRuntimeAttestation;
};

export type PostalContextPublicResolutionComponent = Omit<
  PostalContextResolutionComponent,
  'nodeId'
>;

export type PostalContextPublicResolutionCandidate = {
  resolvedLevel: PostalContextResolutionLevel;
  capabilities: PostalContextCapabilities;
  components: PostalContextPublicResolutionComponent[];
  evidenceTiers: PostalContextResolutionCandidate['evidenceTiers'];
  weakestEvidenceTier?: PostalContextResolutionCandidate['weakestEvidenceTier'];
  ambiguities: PostalContextResolutionCandidate['ambiguities'];
};

export type PostalContextPublicCoordinateResolution = {
  status: PostalContextResolutionStatus;
  purpose: PostalContextPurpose;
  countryCode: string;
  release: PostalContextRuntimeRelease;
  resolvedLevel: PostalContextResolutionLevel;
  capabilities: PostalContextCapabilities;
  selected?: PostalContextPublicResolutionCandidate;
  alternatives: PostalContextPublicResolutionCandidate[];
  postalEvidence: Array<{
    postalCode?: string;
    relation: Exclude<PostalContextSpatialRelation, 'outside'>;
  }>;
  addressPointEvidence: {
    matched: boolean;
    candidateCount: number;
  };
  ambiguities: PostalContextResolutionResult['ambiguities'];
  errors: string[];
  warnings: string[];
};

export type PostalContextPostalGeometryResult = {
  node: PostalContextPublicComponent;
  geometry: PostalContextGeometryFeature['geometry'];
  source: Pick<PostalContextGeometryFeature['source'], 'sourceId' | 'licenseId' | 'digest'>;
};

export type PostalContextBboxIntersectionResult = {
  status: 'unique' | 'no_match' | 'invalid';
  countryCode: string;
  release: PostalContextRuntimeRelease;
  bbox?: PostalContextBbox;
  matches: PostalContextPostalGeometryResult[];
  truncated: boolean;
  errors: string[];
  warnings: string[];
};

const POSTAL_GEOMETRY_QUALITY = new Set<PostalContextGeometryFeature['quality']['status']>([
  'authoritative',
  'verified',
  'derived',
]);

const ADDRESS_POINT_QUALITY = new Set<PostalContextGeometryFeature['quality']['status']>([
  'authoritative',
  'verified',
]);

const ADDRESS_POINT_SOURCE_TYPES = new Set<PostalContextGeometryFeature['source']['sourceType']>([
  'official',
  'open',
  'commercial',
  'synthetic',
]);

const ADDRESS_POINT_GEOMETRY_AUTHORITIES = new Set<
  PostalContextGeometryFeature['source']['geometryAuthority']
>([
  'official_address_registry_geometry',
  'official_municipal_civic_geometry',
  'official_cadastral_geometry',
  'official_mapping_geometry',
  'official_3d_city_model_geometry',
  'synthetic_fixture_geometry',
]);

export const POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS = {
  spatialCandidateFeatures: 2_048,
  spatialCandidatePositions: 200_000,
  postalMatches: 32,
  postalFeaturesPerCode: 64,
  lookupContextNodes: 256,
  lookupAssertionsExamined: 2_048,
  lookupAlternatives: 32,
  lookupAlternativeDepth: 32,
  geometryResponseFeatures: 16,
  geometryResponsePositions: 20_000,
  resolutionNodes: 128,
  resolutionAssertions: 256,
  resolutionAssertionsExamined: 2_048,
  resolutionAddressRoots: 8,
} as const;

export const POSTAL_CONTEXT_RUNTIME_INDEX_LIMITS = {
  cellsPerFeature: 4_096,
  postings: 500_000,
  buckets: 250_000,
  globalFeatures: 512,
} as const;

const EMPTY_CAPABILITIES: PostalContextCapabilities = {
  country: false,
  administrative: false,
  locality: false,
  postalArea: false,
  streetOrBlock: false,
  premise: false,
  building: false,
  entrance: false,
  unit: false,
  organization: false,
  deliveryEndpoint: false,
  publicSafe: true,
};

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

const CAPABILITY_KEYS = Object.keys(EMPTY_CAPABILITIES) as Array<keyof PostalContextCapabilities>;

function commonCapabilities(
  candidates: readonly PostalContextResolutionCandidate[],
): PostalContextCapabilities {
  if (!candidates.length) return { ...EMPTY_CAPABILITIES };
  const common = { ...EMPTY_CAPABILITIES };
  for (const key of CAPABILITY_KEYS) {
    common[key] = candidates.every(candidate => candidate.capabilities[key]);
  }
  return common;
}

function commonResolutionLevel(
  candidates: readonly PostalContextResolutionCandidate[],
): PostalContextResolutionLevel {
  return candidates.reduce<PostalContextResolutionLevel>(
    (lowest, candidate) => postalContextResolutionLevelRank(candidate.resolvedLevel)
      < postalContextResolutionLevelRank(lowest) ? candidate.resolvedLevel : lowest,
    candidates[0]?.resolvedLevel ?? 'none',
  );
}

function releaseSummary(graph: PostalContextGraph): PostalContextRuntimeRelease {
  return {
    countryCode: graph.release.countryCode,
    repositoryId: graph.release.repositoryId,
    releaseId: graph.release.releaseId,
    manifestDigest: graph.release.manifestDigest,
    policyVersion: graph.release.policyVersion,
    releasedAt: graph.release.releasedAt,
    validTime: graph.release.validTime,
  };
}

function publicComponent(node: PostalContextNode): PostalContextPublicComponent {
  return {
    id: node.id,
    kind: node.kind,
    featureKind: node.featureKind,
    label: node.label,
    postalCode: node.postalCode,
    geometryType: node.geometryType,
  };
}

function isPublicPackNode(node: PostalContextNode) {
  return node.kind !== 'unit'
    && node.kind !== 'recipient'
    && node.visibility === 'public';
}

function geometryTypeForFeature(feature: PostalContextGeometryFeature) {
  if (feature.geometry.type === 'Point') return 'point';
  if (feature.geometry.type === 'Polygon') return 'polygon';
  return 'multipolygon';
}

function compatibleRole(node: PostalContextNode, feature: PostalContextGeometryFeature) {
  if (feature.role === 'postal_area') return node.kind === 'postal_feature';
  if (feature.role === 'address_point') return node.kind === 'address_point';
  if (feature.role === 'building_footprint') {
    return node.kind === 'building' || node.kind === 'building_part';
  }
  return node.kind === 'entrance';
}

function validCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

function instantValue(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function instantInRange(value: string, range: PostalContextGraph['release']['validTime']) {
  const instant = instantValue(value);
  const from = instantValue(range.from);
  const to = range.to ? instantValue(range.to) : null;
  return instant !== null && from !== null && (!range.to || to !== null)
    && instant >= from && (to === null || instant < to);
}

function isPurpose(value: unknown): value is PostalContextPurpose {
  return typeof value === 'string'
    && (POSTAL_CONTEXT_PURPOSES as readonly string[]).includes(value);
}

function eligiblePostalGeometry(feature: PostalContextGeometryFeature) {
  return feature.role === 'postal_area'
    && feature.publicationClass === 'public_context'
    && feature.source.sourceType !== 'virtual'
    && feature.source.assignmentAuthority !== 'virtual_assignment'
    && feature.source.geometryAuthority !== 'virtual_geometry'
    && POSTAL_GEOMETRY_QUALITY.has(feature.quality.status);
}

function eligibleAddressPointGeometry(
  feature: PostalContextGeometryFeature,
): feature is PostalContextGeometryFeature & {
  geometry: PostalContextPointGeometry;
  matchRadiusMeters: number;
} {
  return feature.role === 'address_point'
    && (feature.publicationClass === 'public_civic_address'
      || feature.publicationClass === 'public_facility')
    && ADDRESS_POINT_SOURCE_TYPES.has(feature.source.sourceType)
    && feature.source.assignmentAuthority !== 'derived_spatial_assignment'
    && feature.source.assignmentAuthority !== 'virtual_assignment'
    && ADDRESS_POINT_GEOMETRY_AUTHORITIES.has(feature.source.geometryAuthority)
    && ADDRESS_POINT_QUALITY.has(feature.quality.status)
    && geometryIsPoint(feature.geometry)
    && feature.matchRadiusMeters !== undefined;
}

function eligiblePublicAssertion(assertion: PostalContextAssertion) {
  return hasDefinitivePostalContextAssertionQuality(assertion);
}

function assertionAllowsPurpose(
  assertion: PostalContextAssertion,
  purpose: PostalContextPurpose,
) {
  return !assertion.purposes?.length || assertion.purposes.includes(purpose);
}

function geometryPositionCount(geometry: PostalContextGeometryFeature['geometry']) {
  if (geometry.type === 'Point') return 1;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.reduce((polygonTotal, polygon) => polygonTotal
    + polygon.reduce((ringTotal, ring) => ringTotal + ring.length, 0), 0);
}

export {
  normalizeSerbiaPostalCode,
  normalizeSloveniaPostalCode,
  normalizeNorwayPostalCode,
  normalizeHungaryPostalCode,
  normalizeFinlandPostalCode,
  normalizeBulgariaPostalCode,
  normalizeBelarusPostalCode,
  normalizeBelgiumPostalCode,
  normalizeMontenegroPostalCode,
  normalizeRomaniaPostalCode,
  normalizeTaiwanPostalCode,
  normalizeKoreaPostalCode,
  normalizeSaudiArabiaPostalCode,
  normalizeOmanPostalCode,
  normalizeSouthAfricaPostalCode,
  normalizeEgyptPostalCode,
  normalizeMoroccoPostalCode,
  normalizeIndiaPostalCode,
  normalizePakistanPostalCode,
  normalizeBangladeshPostalCode,
  normalizeBhutanPostalCode,
  normalizeBruneiPostalCode,
  normalizeVietnamPostalCode,
  normalizeMalaysiaPostalCode,
  normalizeMyanmarPostalCode,
  normalizeMaldivesPostalCode,
  normalizeMongoliaPostalCode,
  normalizeJordanPostalCode,
  normalizeLaosPostalCode,
  normalizeLebanonPostalCode,
  normalizeAfghanistanPostalCode,
  normalizeIsraelPostalCode,
  normalizeIraqPostalCode,
  normalizeIranPostalCode,
  normalizeUzbekistanPostalCode,
  normalizeKazakhstanPostalCode,
  normalizeChinaPostalCode,
  normalizeCambodiaPostalCode,
  normalizeKyrgyzstanPostalCode,
  normalizeUnitedStatesPostalCode,
  normalizeCanadaPostalCode,
  normalizeCubaPostalCode,
  normalizeArgentinaPostalCode,
  normalizeUruguayPostalCode,
  normalizeEcuadorPostalCode,
  normalizeElSalvadorPostalCode,
  normalizeGuatemalaPostalCode,
  normalizeCostaRicaPostalCode,
  normalizeColombiaPostalCode,
  normalizeIndonesiaPostalCode,
  normalizePhilippinesPostalCode,
  normalizeKuwaitPostalCode,
  normalizeBahrainPostalCode,
  classifyMoroccoPostalCode,
  normalizeSlovakiaPostalCode,
  normalizeGeorgiaPostalCode,
  normalizeCroatiaPostalCode,
  normalizeGreecePostalCode,
  normalizeCyprusPostalCode,
  normalizeAustriaPostalCode,
  normalizeAlbaniaPostalCode,
  normalizeAndorraPostalCode,
  normalizeUkrainePostalCode,
  normalizeArmeniaPostalCode,
  normalizeAzerbaijanPostalCode,
  normalizeAustraliaPostalCode,
  normalizeLatviaPostalCode,
  normalizeLithuaniaPostalCode,
  normalizeLiechtensteinPostalCode,
  normalizeIcelandPostalCode,
  normalizeEstoniaPostalCode,
  normalizeSwitzerlandPostalCode,
  normalizeGermanyPostalCode,
  normalizeCzechiaPostalCode,
  normalizeDenmarkPostalCode,
  normalizeMaltaPostalCode,
  normalizeMonacoPostalCode,
  normalizeItalyPostalCode,
  normalizeFrancePostalCode,
  normalizeJapanPostalCode,
  normalizeNewZealandPostalCode,
  normalizeNetherlandsPostalCode,
  normalizeSingaporePostalCode,
  normalizeUnitedKingdomPostalCode,
} from './postalContextCountryPolicy';

export function validatePostalContextRuntimePack(
  pack: PostalContextRuntimePack,
  expectedCountryCode?: string,
): PostalContextRuntimePackValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (pack.schemaVersion !== POSTAL_CONTEXT_RUNTIME_PACK_SCHEMA_VERSION) {
    errors.push(`unsupported-runtime-pack-schema:${pack.schemaVersion}`);
  }
  const graphValidation = validatePostalContextGraph(pack.graph);
  const geometryValidation = validatePostalContextGeometryCollection(pack.geometry);
  errors.push(...graphValidation.errors.map(error => `graph:${error}`));
  errors.push(...geometryValidation.errors.map(error => `geometry:${error}`));
  warnings.push(...graphValidation.warnings.map(warning => `graph:${warning}`));
  warnings.push(...geometryValidation.warnings.map(warning => `geometry:${warning}`));

  const countryCode = expectedCountryCode?.toUpperCase();
  if (countryCode && pack.graph.release.countryCode !== countryCode) {
    errors.push(`unexpected-pack-country:${pack.graph.release.countryCode}`);
  }
  if (pack.geometry.countryCode !== pack.graph.release.countryCode) {
    errors.push('graph-geometry-country-mismatch');
  }
  if (pack.geometry.releaseId !== pack.graph.release.releaseId) {
    errors.push('graph-geometry-release-mismatch');
  }
  if (pack.graph.schemaVersion !== POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION) {
    errors.push(`unexpected-graph-schema:${pack.graph.schemaVersion}`);
  }
  if (pack.geometry.schemaVersion !== POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION) {
    errors.push(`unexpected-geometry-schema:${pack.geometry.schemaVersion}`);
  }

  const nodeById = new Map(pack.graph.nodes.map(node => [node.id, node]));
  for (const node of pack.graph.nodes) {
    if (!isPublicPackNode(node)) errors.push(`non-public-node-in-public-pack:${node.id}`);
    if (node.id.startsWith('runtime:')) errors.push(`reserved-runtime-node-id:${node.id}`);
  }
  for (const assertion of pack.graph.assertions) {
    if (assertion.id.startsWith('runtime:')) errors.push(`reserved-runtime-assertion-id:${assertion.id}`);
    if (!assertion.source.digest) errors.push(`assertion-source-digest-required:${assertion.id}`);
    if (!assertion.source.licenseId) errors.push(`assertion-source-license-required:${assertion.id}`);
  }
  for (const feature of pack.geometry.features) {
    const node = nodeById.get(feature.nodeId);
    if (!node) {
      errors.push(`geometry-node-missing:${feature.id}:${feature.nodeId}`);
      continue;
    }
    if (feature.id.startsWith('runtime:')) errors.push(`reserved-runtime-geometry-id:${feature.id}`);
    if (!compatibleRole(node, feature)) errors.push(`geometry-role-node-mismatch:${feature.id}`);
    if (node.geometryType !== geometryTypeForFeature(feature)) {
      errors.push(`geometry-type-node-mismatch:${feature.id}`);
    }
    if (!feature.source.digest) errors.push(`geometry-source-digest-required:${feature.id}`);
    if (!feature.source.licenseId) errors.push(`geometry-source-license-required:${feature.id}`);
    if (pack.graph.release.countryCode === 'MA'
      && feature.role === 'postal_area'
      && node.postalCode
      && classifyMoroccoPostalCode(node.postalCode) !== 'home_delivery_sector') {
      errors.push(`morocco-non-area-postcode-has-postal-area:${feature.id}:${node.postalCode}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

type IndexedFeature = {
  feature: PostalContextGeometryFeature;
  bounds: PostalContextBbox;
  positionCount: number;
};

type GeometryBucketIndexBuildBudget = {
  postings: number;
  buckets: number;
  globalFeatures: number;
};

class GeometryBucketIndex {
  private readonly buckets = new Map<string, IndexedFeature[]>();
  private readonly global: IndexedFeature[] = [];

  constructor(
    features: readonly PostalContextGeometryFeature[],
    private readonly cellSize: number,
    private readonly buildBudget: GeometryBucketIndexBuildBudget,
  ) {
    for (const feature of features) {
      const indexed = {
        feature,
        bounds: postalContextGeometryBounds(feature.geometry),
        positionCount: geometryPositionCount(feature.geometry),
      };
      const cells = this.cellsForBbox(
        indexed.bounds,
        POSTAL_CONTEXT_RUNTIME_INDEX_LIMITS.cellsPerFeature,
      );
      if (!cells) {
        if (this.buildBudget.globalFeatures
          >= POSTAL_CONTEXT_RUNTIME_INDEX_LIMITS.globalFeatures) {
          throw new Error('spatial-index-global-feature-limit-exceeded');
        }
        this.buildBudget.globalFeatures += 1;
        this.global.push(indexed);
        continue;
      }
      if (this.buildBudget.postings + cells.length
        > POSTAL_CONTEXT_RUNTIME_INDEX_LIMITS.postings) {
        throw new Error('spatial-index-posting-limit-exceeded');
      }
      let newBucketCount = 0;
      for (const cell of cells) {
        if (!this.buckets.has(cell)) newBucketCount += 1;
      }
      if (this.buildBudget.buckets + newBucketCount
        > POSTAL_CONTEXT_RUNTIME_INDEX_LIMITS.buckets) {
        throw new Error('spatial-index-bucket-limit-exceeded');
      }
      this.buildBudget.postings += cells.length;
      this.buildBudget.buckets += newBucketCount;
      for (const cell of cells) {
        const bucket = this.buckets.get(cell) ?? [];
        bucket.push(indexed);
        this.buckets.set(cell, bucket);
      }
    }
  }

  private cellKey(longitudeIndex: number, latitudeIndex: number) {
    return `${longitudeIndex}:${latitudeIndex}`;
  }

  private cellForPoint(point: PostalContextPosition) {
    return this.cellKey(
      Math.floor((point[0] + 180) / this.cellSize),
      Math.floor((point[1] + 90) / this.cellSize),
    );
  }

  private cellsForBbox(bbox: PostalContextBbox, maximum: number) {
    const minimumLongitude = Math.floor((bbox[0] + 180) / this.cellSize);
    const maximumLongitude = Math.floor((bbox[2] + 180) / this.cellSize);
    const minimumLatitude = Math.floor((bbox[1] + 90) / this.cellSize);
    const maximumLatitude = Math.floor((bbox[3] + 90) / this.cellSize);
    const count = (maximumLongitude - minimumLongitude + 1)
      * (maximumLatitude - minimumLatitude + 1);
    if (count > maximum) return undefined;
    const cells: string[] = [];
    for (let longitude = minimumLongitude; longitude <= maximumLongitude; longitude += 1) {
      for (let latitude = minimumLatitude; latitude <= maximumLatitude; latitude += 1) {
        cells.push(this.cellKey(longitude, latitude));
      }
    }
    return cells;
  }

  private deduplicateBuckets(
    buckets: Iterable<readonly IndexedFeature[]>,
    maximumCandidates: number,
  ) {
    const byId = new Map<string, IndexedFeature>();
    for (const bucket of buckets) {
      for (const entry of bucket) {
        byId.set(entry.feature.id, entry);
        if (byId.size > maximumCandidates) return { entries: [] as IndexedFeature[], overflow: true };
      }
    }
    return { entries: [...byId.values()], overflow: false };
  }

  queryPoint(
    point: PostalContextPosition,
    maximumCandidates = POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.spatialCandidateFeatures,
  ) {
    return this.deduplicateBuckets([
      this.buckets.get(this.cellForPoint(point)) ?? [],
      this.global,
    ], maximumCandidates);
  }

  queryBbox(
    bbox: PostalContextBbox,
    maximumCandidates = POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.spatialCandidateFeatures,
  ) {
    const cells = this.cellsForBbox(bbox, 10_000);
    if (!cells) return { entries: [] as IndexedFeature[], overflow: true };
    return this.deduplicateBuckets([
      ...cells.map(cell => this.buckets.get(cell) ?? []),
      this.global,
    ], maximumCandidates);
  }
}

function overallResolutionStatus(
  resolutions: readonly PostalContextResolutionResult[],
  postalMatches: readonly PostalContextSpatialPostalMatch[],
  addressPointMatches: readonly PostalContextAddressPointMatch[],
): PostalContextResolutionStatus {
  if (resolutions.some(resolution => resolution.status === 'invalid')) return 'invalid';
  if (resolutions.some(resolution => resolution.status === 'conflict')) return 'conflict';
  if (addressPointMatches.length > 1
    || postalMatches.some(match => match.relation === 'boundary')
    || resolutions.some(resolution => resolution.status === 'ambiguous')) return 'ambiguous';
  if (!resolutions.length || resolutions.every(resolution => resolution.status === 'no_match')) return 'no_match';
  if (resolutions.some(resolution => resolution.status === 'partial')) return 'partial';
  return 'unique';
}

function publicCandidate(candidate: PostalContextResolutionCandidate): PostalContextPublicResolutionCandidate {
  return {
    resolvedLevel: candidate.resolvedLevel,
    capabilities: candidate.capabilities,
    components: candidate.components.map(({ nodeId: _nodeId, assertionId, ...component }) => ({
      ...component,
      ...(assertionId && !assertionId.startsWith('runtime:') ? { assertionId } : {}),
    })),
    evidenceTiers: candidate.evidenceTiers,
    weakestEvidenceTier: candidate.weakestEvidenceTier,
    ambiguities: candidate.ambiguities,
  };
}

export class PostalContextPackRuntime {
  readonly countryCode: string;
  private readonly pack: PostalContextRuntimePack;
  private readonly attestation: PostalContextRuntimeAttestation;
  private readonly nodeById: Map<string, PostalContextNode>;
  private readonly publicAssertions: PostalContextAssertion[];
  private readonly outgoingAssertions = new Map<string, PostalContextAssertion[]>();
  private readonly incomingAssertions = new Map<string, PostalContextAssertion[]>();
  private readonly postalByCode = new Map<string, PostalContextNode[]>();
  private readonly postalGeometryByNode = new Map<string, PostalContextGeometryFeature[]>();
  private readonly geometryPositionsById = new Map<string, number>();
  private readonly postalGeometryIndex: GeometryBucketIndex;
  private readonly addressPointIndex: GeometryBucketIndex;
  private readonly maxAddressPointCandidates: number;
  private readonly excludedGeometryCount: number;

  constructor(pack: PostalContextRuntimePack, options: PostalContextRuntimeOptions = {}) {
    const expectedCountryCode = (options.countryCode ?? pack.graph.release.countryCode).toUpperCase();
    const validation = validatePostalContextRuntimePack(pack, expectedCountryCode);
    if (!validation.valid) {
      throw new Error(`invalid-postal-context-pack:${validation.errors.join(',')}`);
    }
    if (options.maxAddressPointCandidates !== undefined
      && (!Number.isSafeInteger(options.maxAddressPointCandidates)
        || options.maxAddressPointCandidates < 1
        || options.maxAddressPointCandidates > 16)) {
      throw new Error('invalid-max-address-point-candidates');
    }
    this.pack = pack;
    this.countryCode = expectedCountryCode;
    this.attestation = options.attestation ?? {
      descriptorDigest: `sha256:${'0'.repeat(64)}`,
      sequence: 0,
      maturity: 'M2_experimental',
      synthetic: true,
      promotionEligible: false,
      servingMode: 'test',
      integrity: 'in_memory_unpinned',
    };
    this.nodeById = new Map(pack.graph.nodes.map(node => [node.id, node]));
    this.publicAssertions = pack.graph.assertions.filter(eligiblePublicAssertion);
    this.maxAddressPointCandidates = options.maxAddressPointCandidates ?? 8;

    for (const assertion of this.publicAssertions) {
      const outgoing = this.outgoingAssertions.get(assertion.fromNodeId) ?? [];
      outgoing.push(assertion);
      this.outgoingAssertions.set(assertion.fromNodeId, outgoing);
      const incoming = this.incomingAssertions.get(assertion.toNodeId) ?? [];
      incoming.push(assertion);
      this.incomingAssertions.set(assertion.toNodeId, incoming);
    }
    for (const node of pack.graph.nodes) {
      if (node.kind !== 'postal_feature' || !node.postalCode) continue;
      const normalized = this.normalizePostalCode(node.postalCode);
      if (!normalized) continue;
      const existing = this.postalByCode.get(normalized) ?? [];
      existing.push(node);
      this.postalByCode.set(normalized, existing);
    }

    const postalGeometry = pack.geometry.features.filter(eligiblePostalGeometry);
    const addressPoints = pack.geometry.features.filter(eligibleAddressPointGeometry);
    this.excludedGeometryCount = pack.geometry.features.length
      - postalGeometry.length
      - addressPoints.length
      - pack.geometry.features.filter(feature =>
        feature.role === 'building_footprint' || feature.role === 'entrance_point').length;
    for (const feature of postalGeometry) {
      this.geometryPositionsById.set(feature.id, geometryPositionCount(feature.geometry));
      const existing = this.postalGeometryByNode.get(feature.nodeId) ?? [];
      existing.push(feature);
      this.postalGeometryByNode.set(feature.nodeId, existing);
    }
    const spatialIndexBuildBudget = { postings: 0, buckets: 0, globalFeatures: 0 };
    this.postalGeometryIndex = new GeometryBucketIndex(postalGeometry, 0.1, spatialIndexBuildBudget);
    this.addressPointIndex = new GeometryBucketIndex(addressPoints, 0.01, spatialIndexBuildBudget);
  }

  release() {
    return releaseSummary(this.pack.graph);
  }

  status() {
    return {
      configured: true,
      countryCode: this.countryCode,
      release: this.release(),
      attestation: this.attestation,
      counts: {
        nodes: this.pack.graph.nodes.length,
        assertions: this.pack.graph.assertions.length,
        geometries: this.pack.geometry.features.length,
        postalCodes: this.postalByCode.size,
        excludedByQualityOrPublication: this.excludedGeometryCount,
      },
      privacy: {
        publicPack: true,
        containsPrivateNodes: false,
        coordinateEcho: false,
        internalAddressPointIdsExposed: false,
        internalAddressPointDistancesExposed: false,
      },
      fallback: 'none',
    };
  }

  normalizePostalCode(value: unknown) {
    return normalizePostalContextPostalCode(this.countryCode, value);
  }

  private releaseEffective(validAt: string) {
    return instantInRange(validAt, this.pack.graph.release.validTime);
  }

  private postalNodeEffective(
    nodeId: string,
    validAt: string,
    knownAt: string,
    budget: { examined: number; overflow: boolean },
  ) {
    const postalNode = this.nodeById.get(nodeId);
    if (!postalNode) return false;
    for (const feature of this.postalGeometryByNode.get(nodeId) ?? []) {
      if (budget.examined >= POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.lookupAssertionsExamined) {
        budget.overflow = true;
        return false;
      }
      budget.examined += 1;
      if (isPostalContextGeometryEffectiveAt(feature, validAt, knownAt)) return true;
    }
    for (const assertions of [
      this.outgoingAssertions.get(nodeId) ?? [],
      this.incomingAssertions.get(nodeId) ?? [],
    ]) {
      for (const assertion of assertions) {
        if (budget.examined >= POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.lookupAssertionsExamined) {
          budget.overflow = true;
          return false;
        }
        budget.examined += 1;
        if (!assertionAllowsPurpose(assertion, 'postal_lookup')
          || !isPostalContextAssertionEffectiveAt(assertion, validAt, knownAt)) continue;
        const from = this.nodeById.get(assertion.fromNodeId);
        const to = this.nodeById.get(assertion.toNodeId);
        if (!from || !to) continue;
        if (postalContextAssertionAllowedForUse({
          assertion,
          fromNode: from,
          toNode: to,
          use: 'lookup_context',
        }) || postalContextAssertionAllowedForUse({
          assertion,
          fromNode: from,
          toNode: to,
          use: 'postal_assignment',
        }) || postalContextAssertionAllowedForUse({
          assertion,
          fromNode: from,
          toNode: to,
          use: 'spatial_postal',
        })) return true;
      }
    }
    return false;
  }

  lookupPostalCode(
    value: unknown,
    validAt: string,
    knownAt: string = validAt,
    includeGeometry = false,
  ): PostalContextPostalLookupResult {
    const normalizedPostalCode = this.normalizePostalCode(value);
    const base = {
      countryCode: this.countryCode,
      release: this.release(),
      postalFeatures: [] as PostalContextPublicComponent[],
      contexts: [] as PostalContextPublicComponent[],
      assertionIds: [] as string[],
      alternatives: [] as PostalContextPostalLookupAlternative[],
      geometries: [] as PostalContextPostalGeometryResult[],
      errors: [] as string[],
      warnings: [] as string[],
    };
    if (!normalizedPostalCode) {
      return { ...base, status: 'invalid', errors: ['invalid-postal-code'] };
    }
    if (instantValue(validAt) === null || instantValue(knownAt) === null) {
      return { ...base, status: 'invalid', normalizedPostalCode, errors: ['invalid-resolution-time'] };
    }
    if (!this.releaseEffective(validAt)) {
      return { ...base, status: 'no_match', normalizedPostalCode, warnings: ['release-not-effective-at-request-time'] };
    }

    const postalNodes = this.postalByCode.get(normalizedPostalCode) ?? [];
    if (postalNodes.length > POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.postalFeaturesPerCode) {
      return { ...base, status: 'invalid', normalizedPostalCode, errors: ['postal-feature-limit-exceeded'] };
    }
    const postalFeatures: PostalContextNode[] = [];
    const effectivenessBudget = { examined: 0, overflow: false };
    for (const node of postalNodes) {
      if (this.postalNodeEffective(node.id, validAt, knownAt, effectivenessBudget)) {
        postalFeatures.push(node);
      }
      if (effectivenessBudget.overflow) {
        return { ...base, status: 'invalid', normalizedPostalCode, errors: ['postal-effectiveness-limit-exceeded'] };
      }
    }
    if (!postalFeatures.length) {
      return { ...base, status: 'no_match', normalizedPostalCode };
    }

    const contextIds = new Set<string>();
    const contextAssertionsByFrom = new Map<string, PostalContextAssertion[]>();
    const queue = postalFeatures.map(node => node.id);
    let queueIndex = 0;
    let assertionsExamined = 0;
    let contextLimitExceeded = false;
    while (queueIndex < queue.length && !contextLimitExceeded) {
      const fromNodeId = queue[queueIndex++];
      for (const assertion of this.outgoingAssertions.get(fromNodeId) ?? []) {
        assertionsExamined += 1;
        if (assertionsExamined > POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.lookupAssertionsExamined) {
          contextLimitExceeded = true;
          break;
        }
        if (!assertionAllowsPurpose(assertion, 'postal_lookup')
          || !isPostalContextAssertionEffectiveAt(assertion, validAt, knownAt)) continue;
        const from = this.nodeById.get(fromNodeId);
        const target = this.nodeById.get(assertion.toNodeId);
        if (!from || !target || !isPublicPackNode(target)
          || !postalContextAssertionAllowedForUse({
            assertion,
            fromNode: from,
            toNode: target,
            use: 'lookup_context',
          })) continue;
        const contextAssertions = contextAssertionsByFrom.get(fromNodeId) ?? [];
        contextAssertions.push(assertion);
        contextAssertionsByFrom.set(fromNodeId, contextAssertions);
        if (contextIds.has(target.id)) continue;
        if (contextIds.size >= POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.lookupContextNodes) {
          contextLimitExceeded = true;
          break;
        }
        contextIds.add(target.id);
        queue.push(target.id);
      }
    }
    if (contextLimitExceeded) {
      return { ...base, status: 'invalid', normalizedPostalCode, errors: ['postal-context-limit-exceeded'] };
    }

    type AlternativeIds = {
      postalFeature: PostalContextNode;
      contextIds: string[];
      assertionIds: string[];
    };
    const alternativeIds: AlternativeIds[] = [];
    const alternativeByKey = new Map<string, AlternativeIds>();
    let alternativeLimitExceeded = false;
    const addAlternative = (alternative: AlternativeIds) => {
      const uniqueContextIds = unique(alternative.contextIds);
      const keyContextIds = [...uniqueContextIds].sort();
      const key = `${alternative.postalFeature.id}\u0000${keyContextIds.join('\u0000')}`;
      const existing = alternativeByKey.get(key);
      if (existing) {
        existing.assertionIds = unique([...existing.assertionIds, ...alternative.assertionIds]);
        return;
      }
      if (alternativeIds.length >= POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.lookupAlternatives) {
        alternativeLimitExceeded = true;
        return;
      }
      const normalized = {
        ...alternative,
        contextIds: uniqueContextIds,
        assertionIds: unique(alternative.assertionIds),
      };
      alternativeIds.push(normalized);
      alternativeByKey.set(key, normalized);
    };
    const walkContextPaths = (
      postalFeature: PostalContextNode,
      nodeId: string,
      pathContextIds: string[],
      pathAssertionIds: string[],
      visited: Set<string>,
      depth: number,
    ) => {
      if (alternativeLimitExceeded) return;
      if (depth > POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.lookupAlternativeDepth) {
        alternativeLimitExceeded = true;
        return;
      }
      const outgoing = contextAssertionsByFrom.get(nodeId) ?? [];
      const overlays = outgoing.filter(assertion => assertion.relation === 'covered_by_agid');
      const overlayContextIds = unique(overlays.map(assertion => assertion.toNodeId));
      const nextContextIds = unique([...pathContextIds, ...overlayContextIds]);
      const nextAssertionIds = unique([
        ...pathAssertionIds,
        ...overlays.map(assertion => assertion.id),
      ]);
      const hierarchyByTarget = new Map<string, PostalContextAssertion[]>();
      for (const assertion of outgoing) {
        if (assertion.relation !== 'admin_within' && assertion.relation !== 'part_of') continue;
        if (visited.has(assertion.toNodeId)) {
          alternativeLimitExceeded = true;
          continue;
        }
        const targetAssertions = hierarchyByTarget.get(assertion.toNodeId) ?? [];
        targetAssertions.push(assertion);
        hierarchyByTarget.set(assertion.toNodeId, targetAssertions);
      }
      if (!hierarchyByTarget.size) {
        addAlternative({
          postalFeature,
          contextIds: nextContextIds,
          assertionIds: nextAssertionIds,
        });
        return;
      }
      for (const [targetId, targetAssertions] of hierarchyByTarget) {
        walkContextPaths(
          postalFeature,
          targetId,
          [...nextContextIds, targetId],
          [...nextAssertionIds, ...targetAssertions.map(assertion => assertion.id)],
          new Set([...visited, targetId, ...overlayContextIds]),
          depth + 1,
        );
      }
    };
    for (const postalFeature of postalFeatures) {
      walkContextPaths(postalFeature, postalFeature.id, [], [], new Set([postalFeature.id]), 0);
    }
    if (!alternativeIds.length) {
      alternativeLimitExceeded = true;
      postalFeatures.slice(0, POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.lookupAlternatives)
        .forEach(postalFeature => addAlternative({ postalFeature, contextIds: [], assertionIds: [] }));
    }
    const commonContextIds = alternativeLimitExceeded || !alternativeIds.length
      ? []
      : alternativeIds[0].contextIds.filter(id =>
          alternativeIds.every(alternative => alternative.contextIds.includes(id)));
    const commonAssertionIds = alternativeLimitExceeded || !alternativeIds.length
      ? []
      : alternativeIds[0].assertionIds.filter(id =>
          alternativeIds.every(alternative => alternative.assertionIds.includes(id)));
    const alternatives = alternativeIds.map(alternative => ({
      postalFeature: publicComponent(alternative.postalFeature),
      contexts: alternative.contextIds.map(id => publicComponent(this.nodeById.get(id)!)),
      assertionIds: alternative.assertionIds,
    }));

    const postalNodeIds = new Set(postalFeatures.map(node => node.id));
    const geometries: PostalContextPostalGeometryResult[] = [];
    let geometryPositions = 0;
    let geometryLimitExceeded = false;
    if (includeGeometry) {
      for (const nodeId of postalNodeIds) {
        for (const feature of this.postalGeometryByNode.get(nodeId) ?? []) {
          if (!isPostalContextGeometryEffectiveAt(feature, validAt, knownAt)) continue;
          geometryPositions += this.geometryPositionsById.get(feature.id) ?? 0;
          if (geometries.length >= POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.geometryResponseFeatures
            || geometryPositions > POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.geometryResponsePositions) {
            geometryLimitExceeded = true;
            break;
          }
          geometries.push({
            node: publicComponent(this.nodeById.get(feature.nodeId)!),
            geometry: feature.geometry,
            source: {
              sourceId: feature.source.sourceId,
              licenseId: feature.source.licenseId,
              digest: feature.source.digest,
            },
          });
        }
        if (geometryLimitExceeded) break;
      }
    }

    return {
      ...base,
      status: alternatives.length === 1 && !alternativeLimitExceeded ? 'unique' : 'ambiguous',
      normalizedPostalCode,
      postalFeatures: postalFeatures.map(publicComponent),
      contexts: commonContextIds.map(id => publicComponent(this.nodeById.get(id)!)),
      assertionIds: commonAssertionIds,
      alternatives,
      geometries: geometryLimitExceeded ? [] : geometries,
      warnings: [
        ...(alternativeLimitExceeded ? ['postal-context-alternatives-truncated'] : []),
        ...(geometryLimitExceeded ? ['postal-geometry-response-limit-exceeded'] : []),
      ],
    };
  }

  private graphForResolutionStart(args: {
    startNodeId: string;
    addTransientQuery: boolean;
    purpose: PostalContextPurpose;
    validAt: string;
    knownAt: string;
    postalFeatureMatches: ReadonlyArray<{
      feature: PostalContextGeometryFeature;
      relation: 'inside' | 'boundary';
    }>;
  }): { graph?: PostalContextGraph; error?: string } {
    const selectedNodes = new Map<string, PostalContextNode>();
    const selectedAssertions = new Map<string, PostalContextAssertion>();
    const examinedAssertionIds = new Set<string>();
    let overflow = false;

    const startNode: PostalContextNode | undefined = args.addTransientQuery
      ? {
          id: args.startNodeId,
          kind: 'query_point',
          featureKind: 'query_point',
          geometryType: 'point',
          countryCode: this.countryCode,
          visibility: 'public',
        }
      : this.nodeById.get(args.startNodeId);
    if (!startNode) return { error: 'resolution-start-node-not-found' };

    const addNode = (node: PostalContextNode) => {
      if (selectedNodes.has(node.id)) return true;
      if (selectedNodes.size >= POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.resolutionNodes) {
        overflow = true;
        return false;
      }
      selectedNodes.set(node.id, node);
      return true;
    };
    const addAssertion = (assertion: PostalContextAssertion) => {
      if (selectedAssertions.has(assertion.id)) return true;
      if (selectedAssertions.size >= POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.resolutionAssertions) {
        overflow = true;
        return false;
      }
      const from = selectedNodes.get(assertion.fromNodeId) ?? this.nodeById.get(assertion.fromNodeId);
      const to = selectedNodes.get(assertion.toNodeId) ?? this.nodeById.get(assertion.toNodeId);
      if (!from || !to || !addNode(from) || !addNode(to)) {
        overflow = true;
        return false;
      }
      selectedAssertions.set(assertion.id, assertion);
      return true;
    };
    const examine = (assertion: PostalContextAssertion) => {
      if (examinedAssertionIds.has(assertion.id)) return true;
      if (examinedAssertionIds.size >= POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.resolutionAssertionsExamined) {
        overflow = true;
        return false;
      }
      examinedAssertionIds.add(assertion.id);
      return true;
    };
    const effective = (assertion: PostalContextAssertion) =>
      assertionAllowsPurpose(assertion, args.purpose)
      && isPostalContextAssertionEffectiveAt(assertion, args.validAt, args.knownAt);

    addNode(startNode);
    const roots = new Set<string>();
    const effectiveSpatialTargets = new Set<string>();
    let temporalAssertion: PostalContextAssertion | undefined;
    let effectiveTemporalAssertion: PostalContextAssertion | undefined;
    const startOutgoing = this.outgoingAssertions.get(args.startNodeId) ?? [];
    const startIncoming = this.incomingAssertions.get(args.startNodeId) ?? [];

    for (const assertions of [startOutgoing, startIncoming]) {
      for (const assertion of assertions) {
        if (!examine(assertion)) break;
        if (!assertionAllowsPurpose(assertion, args.purpose)) continue;
        const from = assertion.fromNodeId === startNode.id
          ? startNode
          : this.nodeById.get(assertion.fromNodeId);
        const to = assertion.toNodeId === startNode.id
          ? startNode
          : this.nodeById.get(assertion.toNodeId);
        if (!from || !to) continue;
        const isAddressRecordRoot = postalContextAssertionAllowedForUse({
          assertion,
          fromNode: from,
          toNode: to,
          use: 'address_record_root',
        });
        const isSpatialPostal = postalContextAssertionAllowedForUse({
          assertion,
          fromNode: from,
          toNode: to,
          use: 'spatial_postal',
        });
        const isResolutionContext = postalContextAssertionAllowedForUse({
          assertion,
          fromNode: from,
          toNode: to,
          use: 'resolution_context',
        });
        const isNavigationEntrance = postalContextAssertionAllowedForUse({
          assertion,
          fromNode: from,
          toNode: to,
          use: 'navigation_entrance',
        });
        if (!isAddressRecordRoot && !isSpatialPostal
          && !isResolutionContext && !isNavigationEntrance) continue;
        temporalAssertion ??= assertion;
        const assertionEffective = isPostalContextAssertionEffectiveAt(
          assertion,
          args.validAt,
          args.knownAt,
        );
        if (assertionEffective) effectiveTemporalAssertion ??= assertion;
        if (assertion.fromNodeId !== args.startNodeId || !assertionEffective) continue;
        if (isAddressRecordRoot) {
          if (!roots.has(to.id)
            && roots.size >= POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.resolutionAddressRoots) {
            overflow = true;
            break;
          }
          roots.add(to.id);
          addAssertion(assertion);
        } else if (isSpatialPostal) {
          effectiveSpatialTargets.add(to.id);
          addAssertion(assertion);
        }
        if (overflow) break;
      }
      if (overflow) break;
    }
    if (overflow) return { error: 'resolution-subgraph-limit-exceeded' };

    const selectedTouchesStart = [...selectedAssertions.values()].some(assertion =>
      assertion.fromNodeId === args.startNodeId || assertion.toNodeId === args.startNodeId);
    if (!selectedTouchesStart && (effectiveTemporalAssertion ?? temporalAssertion)) {
      addAssertion((effectiveTemporalAssertion ?? temporalAssertion)!);
    }
    if (overflow) return { error: 'resolution-subgraph-limit-exceeded' };

    const anchorIds = startNode.kind === 'address_record'
      ? [startNode.id]
      : roots.size ? [...roots] : [startNode.id];
    const traversalSeeds = new Set<string>([
      startNode.id,
      ...anchorIds,
      ...effectiveSpatialTargets,
    ]);
    for (const anchorId of anchorIds) {
      const anchor = selectedNodes.get(anchorId) ?? this.nodeById.get(anchorId);
      if (!anchor) continue;
      for (const assertion of this.outgoingAssertions.get(anchorId) ?? []) {
        if (!examine(assertion)) break;
        if (!effective(assertion)) continue;
        const target = this.nodeById.get(assertion.toNodeId);
        if (!target) continue;
        const isDirectPostal = postalContextAssertionAllowedForUse({
          assertion,
          fromNode: anchor,
          toNode: target,
          use: 'postal_assignment',
        });
        const isDirectBuilding = postalContextAssertionAllowedForUse({
          assertion,
          fromNode: anchor,
          toNode: target,
          use: 'building_identity',
        });
        if (!isDirectPostal && !isDirectBuilding) continue;
        addAssertion(assertion);
        traversalSeeds.add(assertion.toNodeId);
        if (overflow) break;
      }
      if (overflow) break;
    }
    if (overflow) return { error: 'resolution-subgraph-limit-exceeded' };

    args.postalFeatureMatches.forEach(({ feature }, index) => {
      if (overflow || effectiveSpatialTargets.has(feature.nodeId)) return;
      const target = this.nodeById.get(feature.nodeId);
      if (!target) return;
      const assertion: PostalContextAssertion = {
        id: `runtime:pip:${index}:${args.startNodeId}:${feature.nodeId}`,
        fromNodeId: args.startNodeId,
        toNodeId: feature.nodeId,
        relation: 'postal_contains',
        validTime: feature.validTime,
        knownTime: feature.knownTime,
        source: feature.source,
        method: 'geometry_contains',
        quality: feature.quality,
        purposes: [args.purpose],
      };
      if (!postalContextAssertionAllowedForUse({
        assertion,
        fromNode: startNode,
        toNode: target,
        use: 'spatial_postal',
      })) return;
      addAssertion(assertion);
      traversalSeeds.add(feature.nodeId);
    });
    if (overflow) return { error: 'resolution-subgraph-limit-exceeded' };

    const traversalQueue = [...traversalSeeds];
    let traversalIndex = 0;
    while (traversalIndex < traversalQueue.length && !overflow) {
      const fromNodeId = traversalQueue[traversalIndex++];
      for (const assertion of this.outgoingAssertions.get(fromNodeId) ?? []) {
        if (!examine(assertion)) break;
        if (!effective(assertion)) continue;
        const from = this.nodeById.get(fromNodeId);
        const target = this.nodeById.get(assertion.toNodeId);
        if (!from || !target || !postalContextAssertionAllowedForUse({
          assertion,
          fromNode: from,
          toNode: target,
          use: 'resolution_context',
        })) continue;
        const wasKnown = selectedNodes.has(target.id);
        addAssertion(assertion);
        if (!wasKnown && !overflow) traversalQueue.push(target.id);
        if (overflow) break;
      }
    }
    if (overflow) return { error: 'resolution-subgraph-limit-exceeded' };

    if (args.purpose === 'navigation') {
      const buildingIds = [...selectedNodes.values()]
        .filter(node => node.kind === 'building')
        .map(node => node.id);
      for (const buildingId of buildingIds) {
        for (const assertion of this.incomingAssertions.get(buildingId) ?? []) {
          if (!examine(assertion)) break;
          if (!effective(assertion)) continue;
          const entrance = this.nodeById.get(assertion.fromNodeId);
          const building = this.nodeById.get(assertion.toNodeId);
          if (!entrance || !building || !postalContextAssertionAllowedForUse({
            assertion,
            fromNode: entrance,
            toNode: building,
            use: 'navigation_entrance',
          })) continue;
          addAssertion(assertion);
          if (overflow) break;
        }
        if (overflow) break;
      }
    }
    if (overflow) return { error: 'resolution-subgraph-limit-exceeded' };

    return {
      graph: {
        ...this.pack.graph,
        nodes: [...selectedNodes.values()],
        assertions: [...selectedAssertions.values()],
      },
    };
  }

  private resolveCoordinate(request: PostalContextCoordinateRequest): PostalContextCoordinateResolution {
    const knownAt = request.knownAt ?? request.validAt;
    const base = {
      purpose: request.purpose,
      release: this.release(),
      postalMatches: [] as PostalContextSpatialPostalMatch[],
      addressPointMatches: [] as PostalContextAddressPointMatch[],
      resolutions: [] as PostalContextResolutionResult[],
      errors: [] as string[],
      warnings: [] as string[],
    };
    if (!validCoordinate(request.latitude, request.longitude)) {
      return { ...base, status: 'invalid', errors: ['invalid-coordinate'] };
    }
    if (!isPurpose(request.purpose)) {
      return { ...base, status: 'invalid', errors: ['invalid-purpose'] };
    }
    if (instantValue(request.validAt) === null || instantValue(knownAt) === null) {
      return { ...base, status: 'invalid', errors: ['invalid-resolution-time'] };
    }
    if (!this.releaseEffective(request.validAt)) {
      return { ...base, status: 'no_match', warnings: ['release-not-effective-at-request-time'] };
    }

    const point: PostalContextPosition = [request.longitude, request.latitude];
    const postalCandidates = this.postalGeometryIndex.queryPoint(point);
    const addressCandidates = this.addressPointIndex.queryPoint(point);
    if (postalCandidates.overflow || addressCandidates.overflow) {
      return { ...base, status: 'invalid', errors: ['spatial-candidate-limit-exceeded'] };
    }
    const candidatePositions = [...postalCandidates.entries, ...addressCandidates.entries]
      .reduce((total, entry) => total + entry.positionCount, 0);
    if (candidatePositions > POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.spatialCandidatePositions) {
      return { ...base, status: 'invalid', errors: ['spatial-position-limit-exceeded'] };
    }

    const postalFeatureMatches: Array<{
      feature: PostalContextGeometryFeature;
      relation: 'inside' | 'boundary';
    }> = [];
    for (const { feature } of postalCandidates.entries) {
      if (!isPostalContextGeometryEffectiveAt(feature, request.validAt, knownAt)) continue;
      const relation = locatePointInGeometry(point, feature.geometry);
      if (relation === 'outside') continue;
      if (postalFeatureMatches.length >= POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.postalMatches) {
        return { ...base, status: 'invalid', errors: ['spatial-postal-match-limit-exceeded'] };
      }
      postalFeatureMatches.push({ feature, relation });
    }
    const postalMatches = postalFeatureMatches.map(({ feature, relation }) => ({
      geometryFeatureId: feature.id,
      nodeId: feature.nodeId,
      postalCode: this.nodeById.get(feature.nodeId)?.postalCode,
      relation,
    }));

    const addressPointMatches = addressCandidates.entries
      .map(({ feature }) => feature)
      .filter(eligibleAddressPointGeometry)
      .filter(feature => isPostalContextGeometryEffectiveAt(feature, request.validAt, knownAt))
      .map(feature => ({
        feature,
        matchRadiusMeters: feature.matchRadiusMeters,
        distanceMeters: haversineDistanceMeters(point, feature.geometry.coordinates),
      }))
      .filter(match => match.distanceMeters <= match.matchRadiusMeters)
      .sort((left, right) =>
        left.distanceMeters - right.distanceMeters || left.feature.id.localeCompare(right.feature.id));
    const clippedAddressPoints = addressPointMatches.slice(0, this.maxAddressPointCandidates);
    const internalAddressPointMatches = clippedAddressPoints.map(match => ({
      geometryFeatureId: match.feature.id,
      nodeId: match.feature.nodeId,
      distanceMeters: match.distanceMeters,
      matchRadiusMeters: match.matchRadiusMeters,
    }));

    const resolutionStarts = clippedAddressPoints.length
      ? clippedAddressPoints.map(({ feature }) => ({
          startNodeId: feature.nodeId,
          addTransientQuery: false,
        }))
      : [{
          startNodeId: 'runtime:query:transient-public',
          addTransientQuery: true,
        }];
    const resolutionGraphs = resolutionStarts.map(start => ({
      ...start,
      ...this.graphForResolutionStart({
        ...start,
        purpose: request.purpose,
        validAt: request.validAt,
        knownAt,
        postalFeatureMatches,
      }),
    }));
    const graphError = resolutionGraphs.find(result => result.error)?.error;
    if (graphError || resolutionGraphs.some(result => !result.graph)) {
      return {
        ...base,
        status: 'invalid',
        errors: [graphError ?? 'resolution-subgraph-limit-exceeded'],
      };
    }
    const resolutions = resolutionGraphs.map(result => resolvePostalContext({
      graph: result.graph!,
      startNodeId: result.startNodeId,
      purpose: request.purpose,
      validAt: request.validAt,
      knownAt,
      visibility: 'public',
    }));

    const status = overallResolutionStatus(resolutions, postalMatches, internalAddressPointMatches);
    const warnings = [
      ...(addressPointMatches.length > this.maxAddressPointCandidates
        ? ['address-point-candidates-truncated']
        : []),
      ...(!internalAddressPointMatches.length && postalMatches.length
        ? ['postal-area-only-no-source-address-point']
        : []),
      ...(postalMatches.some(match => match.relation === 'boundary')
        ? ['postal-boundary-requires-disambiguation']
        : []),
      ...(this.excludedGeometryCount ? ['lower-quality-or-non-address-geometry-not-promoted'] : []),
    ];

    return {
      ...base,
      status,
      selectedResolutionIndex: resolutions.length === 1
        && (status === 'unique' || status === 'partial') ? 0 : undefined,
      postalMatches,
      addressPointMatches: internalAddressPointMatches,
      resolutions,
      errors: unique(resolutions.flatMap(resolution => resolution.errors)),
      warnings: unique(warnings),
    };
  }

  resolvePublicCoordinate(request: PostalContextCoordinateRequest): PostalContextPublicCoordinateResolution {
    const internal = this.resolveCoordinate(request);
    const primary = internal.resolutions[internal.selectedResolutionIndex ?? 0];
    const selectedCandidate = internal.selectedResolutionIndex !== undefined
      && primary?.selectedCandidateId
      ? primary.candidates.find(candidate => candidate.pathId === primary.selectedCandidateId)
      : internal.selectedResolutionIndex !== undefined && primary?.candidates.length === 1
        ? primary.candidates[0]
        : undefined;
    const allCandidates = internal.resolutions.flatMap(resolution => resolution.candidates);
    const alternativeCandidates = allCandidates
      .filter(candidate => candidate !== selectedCandidate)
      .slice(0, 8)
      .map(publicCandidate);
    const postalEvidence = unique(internal.postalMatches.map(match =>
      `${match.postalCode ?? ''}\u0000${match.relation}`))
      .map(value => {
        const [postalCode, relation] = value.split('\u0000');
        return {
          postalCode: postalCode || undefined,
          relation: relation as Exclude<PostalContextSpatialRelation, 'outside'>,
        };
      });

    return {
      status: internal.status,
      purpose: internal.purpose,
      countryCode: this.countryCode,
      release: internal.release,
      resolvedLevel: selectedCandidate?.resolvedLevel ?? commonResolutionLevel(allCandidates),
      capabilities: selectedCandidate?.capabilities ?? commonCapabilities(allCandidates),
      selected: selectedCandidate ? publicCandidate(selectedCandidate) : undefined,
      alternatives: alternativeCandidates,
      postalEvidence,
      addressPointEvidence: {
        matched: internal.addressPointMatches.length > 0,
        candidateCount: internal.addressPointMatches.length,
      },
      ambiguities: unique(internal.resolutions.flatMap(resolution => resolution.ambiguities)),
      errors: internal.errors,
      warnings: internal.warnings,
    };
  }

  intersectsPostalBbox(
    bboxValue: readonly number[],
    validAt: string,
    knownAt: string = validAt,
    limit: number = POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.geometryResponseFeatures,
  ): PostalContextBboxIntersectionResult {
    const base = {
      countryCode: this.countryCode,
      release: this.release(),
      matches: [] as PostalContextPostalGeometryResult[],
      truncated: false,
      errors: [] as string[],
      warnings: [] as string[],
    };
    if (!validPostalContextBbox(bboxValue)) {
      return { ...base, status: 'invalid', errors: ['invalid-bbox'] };
    }
    if (bboxValue[2] - bboxValue[0] > 5
      || bboxValue[3] - bboxValue[1] > 5
      || (bboxValue[2] - bboxValue[0]) * (bboxValue[3] - bboxValue[1]) > 4) {
      return { ...base, status: 'invalid', errors: ['bbox-scope-limit-exceeded'] };
    }
    if (!Number.isSafeInteger(limit) || limit < 1
      || limit > POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.geometryResponseFeatures) {
      return { ...base, status: 'invalid', errors: ['invalid-limit'] };
    }
    if (instantValue(validAt) === null || instantValue(knownAt) === null) {
      return { ...base, status: 'invalid', errors: ['invalid-resolution-time'] };
    }
    if (!this.releaseEffective(validAt)) {
      return { ...base, status: 'no_match', bbox: bboxValue, warnings: ['release-not-effective-at-request-time'] };
    }

    const candidates = this.postalGeometryIndex.queryBbox(bboxValue);
    if (candidates.overflow) {
      return { ...base, status: 'invalid', bbox: bboxValue, errors: ['spatial-candidate-limit-exceeded'] };
    }
    const candidatePositions = candidates.entries
      .reduce((total, entry) => total + entry.positionCount, 0);
    if (candidatePositions > POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.spatialCandidatePositions) {
      return { ...base, status: 'invalid', bbox: bboxValue, errors: ['spatial-position-limit-exceeded'] };
    }

    const matches: PostalContextPostalGeometryResult[] = [];
    let responsePositions = 0;
    let truncated = false;
    const sortedCandidates = [...candidates.entries]
      .sort((left, right) => left.feature.id.localeCompare(right.feature.id));
    for (const { feature, positionCount } of sortedCandidates) {
      if (!isPostalContextGeometryEffectiveAt(feature, validAt, knownAt)
        || !postalContextGeometryIntersectsBbox(feature.geometry, bboxValue)) continue;
      if (matches.length >= limit) {
        truncated = true;
        break;
      }
      responsePositions += positionCount;
      if (responsePositions > POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.geometryResponsePositions) {
        return { ...base, status: 'invalid', bbox: bboxValue, errors: ['geometry-response-limit-exceeded'] };
      }
      matches.push({
        node: publicComponent(this.nodeById.get(feature.nodeId)!),
        geometry: feature.geometry,
        source: {
          sourceId: feature.source.sourceId,
          licenseId: feature.source.licenseId,
          digest: feature.source.digest,
        },
      });
    }
    return {
      ...base,
      status: matches.length ? 'unique' : 'no_match',
      bbox: bboxValue,
      matches,
      truncated,
      warnings: truncated ? ['postal-intersection-results-truncated'] : [],
    };
  }
}
