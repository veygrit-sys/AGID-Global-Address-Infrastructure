export const POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION = 'postal-context-graph/v0.1' as const;

export type PostalContextNodeKind =
  | 'postal_feature'
  | 'administrative_area'
  | 'locality'
  | 'thoroughfare'
  | 'address_record'
  | 'address_point'
  | 'parcel'
  | 'building'
  | 'building_part'
  | 'entrance'
  | 'unit'
  | 'organization'
  | 'delivery_endpoint'
  | 'agid_cell'
  | 'query_point'
  | 'recipient';

export type PostalContextFeatureKind =
  | 'query_point'
  | 'standard_area'
  | 'large_user'
  | 'po_box'
  | 'organization'
  | 'route'
  | 'virtual_area'
  | 'building'
  | 'building_part'
  | 'entrance'
  | 'premise'
  | 'locality'
  | 'street'
  | 'block'
  | 'cadastral'
  | 'administrative'
  | 'country'
  | 'unknown';

export type PostalContextGeometryType =
  | 'polygon'
  | 'multipolygon'
  | 'point'
  | 'linestring'
  | 'geometrycollection'
  | 'none';

export const POSTAL_CONTEXT_PURPOSES = [
  'postal_lookup',
  'display',
  'delivery',
  'navigation',
  'cadastral',
  'validation',
] as const satisfies readonly PostalContextPurpose[];

export const POSTAL_CONTEXT_RESOLUTION_STATUSES = [
  'unique',
  'partial',
  'ambiguous',
  'conflict',
  'no_match',
  'invalid',
] as const satisfies readonly PostalContextResolutionStatus[];

export type PostalContextPurpose =
  | 'postal_lookup'
  | 'display'
  | 'delivery'
  | 'navigation'
  | 'cadastral'
  | 'validation';

export type PostalContextResolutionStatus =
  | 'unique'
  | 'partial'
  | 'ambiguous'
  | 'conflict'
  | 'no_match'
  | 'invalid';

export type PostalContextResolutionLevel =
  | 'none'
  | 'country'
  | 'administrative'
  | 'locality'
  | 'postal_area'
  | 'street_or_block'
  | 'premise'
  | 'building'
  | 'entrance'
  | 'unit'
  | 'organization'
  | 'delivery_endpoint';

export type PostalContextCapabilities = {
  country: boolean;
  administrative: boolean;
  locality: boolean;
  postalArea: boolean;
  streetOrBlock: boolean;
  premise: boolean;
  building: boolean;
  entrance: boolean;
  unit: boolean;
  organization: boolean;
  deliveryEndpoint: boolean;
  publicSafe: boolean;
};

export type PostalContextVisibility = 'public' | 'restricted' | 'private';

export type PostalContextNode = {
  id: string;
  kind: PostalContextNodeKind;
  featureKind: PostalContextFeatureKind;
  geometryType: PostalContextGeometryType;
  countryCode?: string;
  postalCode?: string;
  label?: string;
  agidCellId?: string;
  visibility?: PostalContextVisibility;
};

export type PostalContextAssertionRelation =
  | 'addresses'
  | 'locates'
  | 'stands_on'
  | 'part_of'
  | 'accesses'
  | 'occupies'
  | 'receives_mail_at'
  | 'postal_assigned'
  | 'postal_contains'
  | 'delivery_served_by'
  | 'admin_within'
  | 'same_as'
  | 'probable_same_as'
  | 'supersedes'
  | 'split_into'
  | 'merged_into'
  | 'covered_by_agid';

export type PostalContextAssertionMethod =
  | 'explicit_assignment'
  | 'direct_source_link'
  | 'official_crosswalk'
  | 'source_relation'
  | 'geometry_contains'
  | 'geometry_intersects'
  | 'nearest'
  | 'derived'
  | 'virtual_grid';

export type PostalContextQualityStatus =
  | 'authoritative'
  | 'verified'
  | 'derived'
  | 'candidate'
  | 'disputed'
  | 'unknown';

export type PostalContextTimeRange = {
  from: string;
  to?: string | null;
};

export type PostalContextDigest = `sha256:${string}`;

export type PostalContextAssignmentAuthority =
  | 'official_postal_operator'
  | 'official_postal_dictionary'
  | 'official_postal_mapping_authority'
  | 'official_address_registry'
  | 'official_municipal_civic_address'
  | 'official_land_registry'
  | 'derived_spatial_assignment'
  | 'virtual_assignment'
  | 'synthetic_fixture_assignment'
  | 'none';

export type PostalContextGeometryAuthority =
  | 'official_postal_geometry'
  | 'official_address_registry_geometry'
  | 'official_municipal_civic_geometry'
  | 'official_cadastral_geometry'
  | 'official_mapping_geometry'
  | 'official_3d_city_model_geometry'
  | 'derived_geometry'
  | 'virtual_geometry'
  | 'synthetic_fixture_geometry'
  | 'none';

export type PostalContextSource = {
  sourceId: string;
  sourceType: 'official' | 'open' | 'commercial' | 'derived' | 'virtual' | 'synthetic';
  assignmentAuthority: PostalContextAssignmentAuthority;
  geometryAuthority: PostalContextGeometryAuthority;
  sourceVersion?: string;
  sourceDate?: string;
  licenseId?: string;
  digest?: PostalContextDigest;
};

export type PostalContextAssertionQuality = {
  status: PostalContextQualityStatus;
  /** Calibrated probability only. Resolver ordering never relies on this field. */
  confidence?: number;
  accuracyMeters?: number;
  validatedAt?: string;
};

/**
 * A directed assertion from a more specific node to a broader context node.
 * `validTime` describes the world, while `knownTime` describes when AGID knew it.
 */
export type PostalContextAssertion = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relation: PostalContextAssertionRelation;
  validTime: PostalContextTimeRange;
  knownTime: PostalContextTimeRange;
  source: PostalContextSource;
  method: PostalContextAssertionMethod;
  quality: PostalContextAssertionQuality;
  purposes?: readonly PostalContextPurpose[];
};

export type PostalContextReleaseArtifact = {
  path: string;
  downloadUrl?: string;
  mediaType: string;
  digest: PostalContextDigest;
  byteLength?: number;
  recordCount?: number;
  licenseRefs?: readonly string[];
};

export type PostalContextRepositoryReleaseManifest = {
  schemaVersion: typeof POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION;
  repositoryId: string;
  repositoryUrl?: string;
  countryCode: string;
  releaseId: string;
  policyVersion: string;
  previousReleaseId?: string;
  releasedAt: string;
  validTime: PostalContextTimeRange;
  manifestDigest: PostalContextDigest;
  artifacts: readonly PostalContextReleaseArtifact[];
};

export type PostalContextGraph = {
  schemaVersion: typeof POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION;
  release: PostalContextRepositoryReleaseManifest;
  nodes: readonly PostalContextNode[];
  assertions: readonly PostalContextAssertion[];
};

export type PostalContextValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const DIGEST_PATTERN = /^sha256:[a-f\d]{64}$/i;

const HTTPS_URL_PATTERN = /^https:\/\/[^\s]+$/;
const ARTIFACT_PATH_SCHEME_PATTERN = /^[A-Za-z][A-Za-z\d+.-]*:/;
const RESOLUTION_LEVEL_RANK: Record<PostalContextResolutionLevel, number> = {
  none: 0,
  country: 1,
  administrative: 2,
  locality: 3,
  postal_area: 4,
  street_or_block: 5,
  premise: 6,
  building: 7,
  entrance: 8,
  unit: 9,
  organization: 10,
  delivery_endpoint: 11,
};

export function postalContextResolutionLevelRank(level: PostalContextResolutionLevel) {
  return RESOLUTION_LEVEL_RANK[level];
}

export function isPrivatePostalContextKind(kind: PostalContextNodeKind) {
  return kind === 'unit' || kind === 'recipient';
}

export function postalContextResolutionLevelForNodes(
  nodes: readonly Pick<PostalContextNode, 'kind' | 'featureKind'>[],
): PostalContextResolutionLevel {
  if (nodes.some(node => node.kind === 'delivery_endpoint')) return 'delivery_endpoint';
  if (nodes.some(node => node.kind === 'organization')) return 'organization';
  if (nodes.some(node => node.kind === 'unit')) return 'unit';
  if (nodes.some(node => node.kind === 'entrance')) return 'entrance';
  if (nodes.some(node => node.kind === 'building')) return 'building';
  if (nodes.some(node => node.kind === 'address_record')) return 'premise';
  if (nodes.some(node => node.kind === 'thoroughfare')) return 'street_or_block';
  if (nodes.some(node => node.kind === 'postal_feature')) return 'postal_area';
  if (nodes.some(node => node.kind === 'locality')) return 'locality';
  if (nodes.some(node => node.kind === 'administrative_area' && node.featureKind === 'country')) return 'country';
  if (nodes.some(node => node.kind === 'administrative_area')) return 'administrative';
  return 'none';
}

export function postalContextCapabilitiesForNodes(
  nodes: readonly Pick<PostalContextNode, 'kind' | 'featureKind' | 'visibility'>[],
): PostalContextCapabilities {
  return {
    country: nodes.some(node => node.kind === 'administrative_area' && node.featureKind === 'country'),
    administrative: nodes.some(node => node.kind === 'administrative_area'),
    locality: nodes.some(node => node.kind === 'locality'),
    postalArea: nodes.some(node => node.kind === 'postal_feature'),
    streetOrBlock: nodes.some(node => node.kind === 'thoroughfare'),
    premise: nodes.some(node => node.kind === 'address_record'),
    building: nodes.some(node => node.kind === 'building'),
    entrance: nodes.some(node => node.kind === 'entrance'),
    unit: nodes.some(node => node.kind === 'unit'),
    organization: nodes.some(node => node.kind === 'organization'),
    deliveryEndpoint: nodes.some(node => node.kind === 'delivery_endpoint'),
    publicSafe: nodes.every(node => !isPrivatePostalContextKind(node.kind) && node.visibility !== 'private'),
  };
}

function instantValue(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidTimeRange(range: PostalContextTimeRange) {
  const from = instantValue(range.from);
  const to = range.to ? instantValue(range.to) : null;
  return from !== null && (!range.to || (to !== null && from < to));
}

function isInstantInRange(instant: string, range: PostalContextTimeRange) {
  const value = instantValue(instant);
  const from = instantValue(range.from);
  const to = range.to ? instantValue(range.to) : null;
  if (value === null || from === null || (range.to && to === null)) return false;
  return value >= from && (to === null || value < to);
}

export function isPostalContextAssertionEffectiveAt(
  assertion: PostalContextAssertion,
  validAt: string,
  knownAt: string = validAt,
) {
  return isInstantInRange(validAt, assertion.validTime) &&
    isInstantInRange(knownAt, assertion.knownTime);
}

export function validatePostalContextReleaseManifest(
  manifest: PostalContextRepositoryReleaseManifest,
): PostalContextValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (manifest.schemaVersion !== POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION) {
    errors.push(`unsupported-schema-version:${manifest.schemaVersion}`);
  }
  if (!manifest.repositoryId) errors.push('repositoryId-required');
  if (manifest.repositoryUrl && !HTTPS_URL_PATTERN.test(manifest.repositoryUrl)) errors.push('invalid-repository-url');
  if (!manifest.releaseId) errors.push('releaseId-required');
  if (!manifest.policyVersion) errors.push('policyVersion-required');
  if (!/^[A-Z]{2}$/.test(manifest.countryCode)) errors.push('invalid-release-country-code');
  if (instantValue(manifest.releasedAt) === null) errors.push('invalid-released-at');
  if (!isValidTimeRange(manifest.validTime)) errors.push('invalid-release-valid-time');
  if (!DIGEST_PATTERN.test(manifest.manifestDigest)) errors.push('invalid-manifest-digest');
  if (!manifest.artifacts.length) warnings.push('release-has-no-artifacts');

  const artifactPaths = new Set<string>();
  for (const artifact of manifest.artifacts) {
    if (!artifact.path) errors.push('artifact-path-required');
    if (artifact.path.startsWith('/')
      || artifact.path.includes('\\')
      || artifact.path.split('/').includes('..')
      || ARTIFACT_PATH_SCHEME_PATTERN.test(artifact.path)) {
      errors.push(`invalid-artifact-path:${artifact.path}`);
    }
    if (artifactPaths.has(artifact.path)) errors.push(`duplicate-artifact-path:${artifact.path}`);
    artifactPaths.add(artifact.path);
    if (!artifact.mediaType) errors.push(`artifact-media-type-required:${artifact.path}`);
    if (artifact.downloadUrl && !HTTPS_URL_PATTERN.test(artifact.downloadUrl)) errors.push(`invalid-artifact-url:${artifact.path}`);
    if (!DIGEST_PATTERN.test(artifact.digest)) errors.push(`invalid-artifact-digest:${artifact.path}`);
    if (artifact.byteLength !== undefined && (!Number.isInteger(artifact.byteLength) || artifact.byteLength < 0)) {
      errors.push(`invalid-artifact-byte-length:${artifact.path}`);
    }
    if (artifact.recordCount !== undefined && (!Number.isInteger(artifact.recordCount) || artifact.recordCount < 0)) {
      errors.push(`invalid-artifact-record-count:${artifact.path}`);
    }
    if (artifact.licenseRefs?.some(reference => !reference.trim())) {
      errors.push(`invalid-artifact-license-ref:${artifact.path}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validatePostalContextGraph(graph: PostalContextGraph): PostalContextValidationResult {
  const releaseValidation = validatePostalContextReleaseManifest(graph.release);
  const errors = [...releaseValidation.errors];
  const warnings = [...releaseValidation.warnings];
  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const nodeIds = new Set<string>();
  const assertionIds = new Set<string>();

  if (graph.schemaVersion !== POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION) {
    errors.push(`unsupported-graph-schema-version:${graph.schemaVersion}`);
  }
  if (graph.schemaVersion !== graph.release.schemaVersion) errors.push('graph-release-schema-mismatch');

  for (const node of graph.nodes) {
    if (!node.id) errors.push('node-id-required');
    if (nodeIds.has(node.id)) errors.push(`duplicate-node:${node.id}`);
    nodeIds.add(node.id);
    if (node.countryCode && !/^[A-Z]{2}$/.test(node.countryCode)) {
      errors.push(`invalid-node-country-code:${node.id}`);
    }
    if (node.countryCode && node.countryCode !== graph.release.countryCode) {
      errors.push(`node-release-country-mismatch:${node.id}`);
    }
    if (node.kind === 'postal_feature' && !node.postalCode) warnings.push(`postal-code-missing:${node.id}`);
    if (isPrivatePostalContextKind(node.kind) && node.visibility === 'public') {
      warnings.push(`private-kind-marked-public:${node.id}`);
    }
  }

  for (const assertion of graph.assertions) {
    if (!assertion.id) errors.push('assertion-id-required');
    if (assertionIds.has(assertion.id)) errors.push(`duplicate-assertion:${assertion.id}`);
    assertionIds.add(assertion.id);
    if (!nodeIds.has(assertion.fromNodeId)) errors.push(`assertion-from-missing:${assertion.id}`);
    if (!nodeIds.has(assertion.toNodeId)) errors.push(`assertion-to-missing:${assertion.id}`);
    const target = nodeById.get(assertion.toNodeId);
    if ((assertion.relation === 'postal_assigned' || assertion.relation === 'postal_contains')
      && target
      && target.kind !== 'postal_feature') {
      errors.push(`postal-target-not-postal-feature:${assertion.id}`);
    }
    if (assertion.fromNodeId === assertion.toNodeId) errors.push(`self-assertion:${assertion.id}`);
    if (!isValidTimeRange(assertion.validTime)) errors.push(`invalid-assertion-valid-time:${assertion.id}`);
    if (!isValidTimeRange(assertion.knownTime)) errors.push(`invalid-assertion-known-time:${assertion.id}`);
    if (!assertion.source.sourceId) errors.push(`assertion-source-required:${assertion.id}`);
    if (!assertion.source.assignmentAuthority) errors.push(`assertion-assignment-authority-required:${assertion.id}`);
    if (!assertion.source.geometryAuthority) errors.push(`assertion-geometry-authority-required:${assertion.id}`);
    if (assertion.relation === 'postal_assigned' && assertion.source.assignmentAuthority === 'none') errors.push(`postal-assignment-authority-required:${assertion.id}`);
    if (assertion.relation === 'postal_contains' && assertion.source.geometryAuthority === 'none') errors.push(`postal-geometry-authority-required:${assertion.id}`);
    if (assertion.source.digest && !DIGEST_PATTERN.test(assertion.source.digest)) {
      errors.push(`invalid-assertion-source-digest:${assertion.id}`);
    }
    if (assertion.quality.confidence !== undefined &&
      (!Number.isFinite(assertion.quality.confidence) ||
        assertion.quality.confidence < 0 || assertion.quality.confidence > 1)) {
      errors.push(`invalid-assertion-confidence:${assertion.id}`);
    }
    if (assertion.quality.accuracyMeters !== undefined &&
      (!Number.isFinite(assertion.quality.accuracyMeters) || assertion.quality.accuracyMeters < 0)) {
      errors.push(`invalid-assertion-accuracy:${assertion.id}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
