import {
  POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
  POSTAL_CONTEXT_PURPOSES,
  validatePostalContextGraph,
} from './postalContextGraph';
import {
  POSTAL_CONTEXT_RUNTIME_PACK_SCHEMA_VERSION,
  validatePostalContextRuntimePack,
  type PostalContextRuntimePack,
} from './postalContextPackRuntime';
import {
  POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,
  validatePostalContextGeometryCollection,
  type PostalContextGeometryCollection,
} from './postalContextSpatial';
import {
  POSTAL_CONTEXT_PACK_LIMITS,
  validatePostalContextGeometryTopology,
} from './postalContextTopology';

export type PostalContextPackParseResult = {
  ok: boolean;
  pack?: PostalContextRuntimePack;
  errors: string[];
  warnings: string[];
  counts?: {
    nodes: number;
    assertions: number;
    features: number;
    positions: number;
  };
};

type JsonRecord = Record<string, unknown>;

const SHA256 = /^sha256:[a-f0-9]{64}$/;
const UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const MAX_ERRORS = 200;

const NODE_KINDS = new Set([
  'postal_feature', 'administrative_area', 'locality', 'thoroughfare', 'address_record',
  'address_point', 'parcel', 'building', 'building_part', 'entrance', 'unit',
  'organization', 'delivery_endpoint', 'agid_cell', 'query_point', 'recipient',
]);
const FEATURE_KINDS = new Set([
  'query_point', 'standard_area', 'large_user', 'po_box', 'organization', 'route',
  'virtual_area', 'building', 'building_part', 'entrance', 'premise', 'locality',
  'street', 'block', 'cadastral', 'administrative', 'country', 'unknown',
]);
const GEOMETRY_TYPES = new Set([
  'polygon', 'multipolygon', 'point', 'linestring', 'geometrycollection', 'none',
]);
const RELATIONS = new Set([
  'addresses', 'locates', 'stands_on', 'part_of', 'accesses', 'occupies',
  'receives_mail_at', 'postal_assigned', 'postal_contains', 'delivery_served_by',
  'admin_within', 'same_as', 'probable_same_as', 'supersedes', 'split_into',
  'merged_into', 'covered_by_agid',
]);
const METHODS = new Set([
  'explicit_assignment', 'direct_source_link', 'official_crosswalk', 'source_relation',
  'geometry_contains', 'geometry_intersects', 'nearest', 'derived', 'virtual_grid',
]);
const SOURCE_TYPES = new Set(['official', 'open', 'commercial', 'derived', 'virtual', 'synthetic']);
const ASSIGNMENT_AUTHORITIES = new Set([
  'official_postal_operator', 'official_address_registry',
  'official_municipal_civic_address', 'official_land_registry',
  'derived_spatial_assignment', 'virtual_assignment', 'synthetic_fixture_assignment', 'none',
]);
const GEOMETRY_AUTHORITIES = new Set([
  'official_postal_geometry', 'official_address_registry_geometry',
  'official_municipal_civic_geometry', 'official_cadastral_geometry',
  'official_mapping_geometry', 'official_3d_city_model_geometry', 'derived_geometry',
  'virtual_geometry', 'synthetic_fixture_geometry', 'none',
]);
const QUALITY_STATUSES = new Set([
  'authoritative', 'verified', 'derived', 'candidate', 'disputed', 'unknown',
]);
const GEOMETRY_ROLES = new Set([
  'postal_area', 'address_point', 'building_footprint', 'entrance_point',
]);
const PUBLICATION_CLASSES = new Set([
  'public_context', 'public_civic_address', 'public_building', 'public_facility',
]);

const PACK_KEYS = new Set(['schemaVersion', 'graph', 'geometry']);
const GRAPH_KEYS = new Set(['schemaVersion', 'release', 'nodes', 'assertions']);
const RELEASE_KEYS = new Set([
  'schemaVersion', 'repositoryId', 'repositoryUrl', 'countryCode', 'releaseId',
  'policyVersion', 'previousReleaseId', 'releasedAt', 'validTime',
  'manifestDigest', 'artifacts',
]);
const ARTIFACT_KEYS = new Set([
  'path', 'downloadUrl', 'mediaType', 'digest', 'byteLength', 'recordCount',
  'licenseRefs',
]);
const NODE_KEYS = new Set([
  'id', 'kind', 'featureKind', 'geometryType', 'countryCode', 'postalCode',
  'label', 'agidCellId', 'visibility',
]);
const ASSERTION_KEYS = new Set([
  'id', 'fromNodeId', 'toNodeId', 'relation', 'validTime', 'knownTime',
  'source', 'method', 'quality', 'purposes',
]);
const TIME_RANGE_KEYS = new Set(['from', 'to']);
const SOURCE_KEYS = new Set([
  'sourceId', 'sourceType', 'assignmentAuthority', 'geometryAuthority',
  'sourceVersion', 'sourceDate', 'licenseId', 'digest',
]);
const QUALITY_KEYS = new Set([
  'status', 'confidence', 'accuracyMeters', 'validatedAt',
]);
const GEOMETRY_COLLECTION_KEYS = new Set([
  'schemaVersion', 'countryCode', 'releaseId', 'features',
]);
const GEOMETRY_FEATURE_KEYS = new Set([
  'id', 'nodeId', 'role', 'publicationClass', 'geometry', 'source',
  'validTime', 'knownTime', 'quality', 'matchRadiusMeters',
]);
const GEOJSON_GEOMETRY_KEYS = new Set(['type', 'coordinates']);

function rejectUnknownKeys(
  record: JsonRecord,
  path: string,
  allowed: ReadonlySet<string>,
  errors: string[],
) {
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) addError(errors, `${path}.${key}:unknown-field`);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function addError(errors: string[], error: string) {
  if (errors.length < MAX_ERRORS) errors.push(error);
}

function requireRecord(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    addError(errors, `${path}:object-required`);
    return undefined;
  }
  return value;
}

function requireArray(value: unknown, path: string, errors: string[], maximum: number) {
  if (!Array.isArray(value)) {
    addError(errors, `${path}:array-required`);
    return undefined;
  }
  if (value.length > maximum) addError(errors, `${path}:item-limit-exceeded`);
  return value;
}

function requireString(
  value: unknown,
  path: string,
  errors: string[],
  options: { maximum?: number; pattern?: RegExp; values?: Set<string> } = {},
) {
  if (typeof value !== 'string' || !value || value.length > (options.maximum ?? 512)) {
    addError(errors, `${path}:string-required`);
    return false;
  }
  if (options.pattern && !options.pattern.test(value)) addError(errors, `${path}:invalid-format`);
  if (options.values && !options.values.has(value)) addError(errors, `${path}:unsupported-value`);
  return true;
}

function optionalString(value: unknown, path: string, errors: string[], maximum = 512) {
  if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > maximum)) {
    addError(errors, `${path}:invalid-optional-string`);
  }
}

function requireId(value: unknown, path: string, errors: string[]) {
  if (requireString(value, path, errors, { maximum: 256 })
    && (value as string).startsWith('runtime:')) {
    addError(errors, `${path}:reserved-runtime-prefix`);
  }
}

function validateTimeRange(value: unknown, path: string, errors: string[]) {
  const range = requireRecord(value, path, errors);
  if (!range) return;
  rejectUnknownKeys(range, path, TIME_RANGE_KEYS, errors);
  requireString(range.from, `${path}.from`, errors, { pattern: UTC_INSTANT });
  if (range.to !== undefined && range.to !== null) {
    requireString(range.to, `${path}.to`, errors, { pattern: UTC_INSTANT });
  }
}

function validateSource(value: unknown, path: string, errors: string[]) {
  const source = requireRecord(value, path, errors);
  if (!source) return;
  requireString(source.sourceId, `${path}.sourceId`, errors, { maximum: 256 });
  requireString(source.sourceType, `${path}.sourceType`, errors, { values: SOURCE_TYPES });
  requireString(source.assignmentAuthority, `${path}.assignmentAuthority`, errors, {
    values: ASSIGNMENT_AUTHORITIES,
  });
  requireString(source.geometryAuthority, `${path}.geometryAuthority`, errors, {
    values: GEOMETRY_AUTHORITIES,
  });
  requireString(source.licenseId, `${path}.licenseId`, errors, { maximum: 256 });
  requireString(source.digest, `${path}.digest`, errors, { pattern: SHA256, maximum: 71 });
  rejectUnknownKeys(source, path, SOURCE_KEYS, errors);
  optionalString(source.sourceVersion, `${path}.sourceVersion`, errors, 256);
  optionalString(source.sourceDate, `${path}.sourceDate`, errors, 64);
}

function validateQuality(value: unknown, path: string, errors: string[]) {
  const quality = requireRecord(value, path, errors);
  if (!quality) return;
  requireString(quality.status, `${path}.status`, errors, { values: QUALITY_STATUSES });
  if (quality.confidence !== undefined
    && (typeof quality.confidence !== 'number' || !Number.isFinite(quality.confidence))) {
    addError(errors, `${path}.confidence:finite-number-required`);
  }
  if (quality.accuracyMeters !== undefined
    && (typeof quality.accuracyMeters !== 'number' || !Number.isFinite(quality.accuracyMeters))) {
    addError(errors, `${path}.accuracyMeters:finite-number-required`);
  }
  optionalString(quality.validatedAt, `${path}.validatedAt`, errors, 64);
  rejectUnknownKeys(quality, path, QUALITY_KEYS, errors);
}

function validateRelease(value: unknown, errors: string[]) {
  const release = requireRecord(value, 'graph.release', errors);
  if (!release) return;
  requireString(release.schemaVersion, 'graph.release.schemaVersion', errors, {
    values: new Set([POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION]),
  });
  requireString(release.repositoryId, 'graph.release.repositoryId', errors, { maximum: 256 });
  optionalString(release.repositoryUrl, 'graph.release.repositoryUrl', errors, 2048);
  requireString(release.countryCode, 'graph.release.countryCode', errors, { pattern: /^[A-Z]{2}$/ });
  requireString(release.releaseId, 'graph.release.releaseId', errors, { maximum: 256 });
  requireString(release.policyVersion, 'graph.release.policyVersion', errors, { maximum: 256 });
  optionalString(release.previousReleaseId, 'graph.release.previousReleaseId', errors, 256);
  requireString(release.releasedAt, 'graph.release.releasedAt', errors, { pattern: UTC_INSTANT });
  rejectUnknownKeys(release, 'graph.release', RELEASE_KEYS, errors);
  validateTimeRange(release.validTime, 'graph.release.validTime', errors);
  requireString(release.manifestDigest, 'graph.release.manifestDigest', errors, {
    pattern: SHA256,
    maximum: 71,
  });
  const artifacts = requireArray(release.artifacts, 'graph.release.artifacts', errors, 128);
  artifacts?.forEach((value, index) => {
    const artifact = requireRecord(value, `graph.release.artifacts[${index}]`, errors);
    if (!artifact) return;
    rejectUnknownKeys(artifact, `graph.release.artifacts[${index}]`, ARTIFACT_KEYS, errors);
    requireString(artifact.path, `graph.release.artifacts[${index}].path`, errors, { maximum: 256 });
    optionalString(artifact.downloadUrl, `graph.release.artifacts[${index}].downloadUrl`, errors, 2048);
    requireString(artifact.mediaType, `graph.release.artifacts[${index}].mediaType`, errors, { maximum: 256 });
    requireString(artifact.digest, `graph.release.artifacts[${index}].digest`, errors, {
      pattern: SHA256,
      maximum: 71,
    });
    for (const field of ['byteLength', 'recordCount'] as const) {
      if (artifact[field] !== undefined
        && (!Number.isSafeInteger(artifact[field]) || (artifact[field] as number) < 0)) {
        addError(errors, `graph.release.artifacts[${index}].${field}:non-negative-integer-required`);
      }
    }
    if (artifact.licenseRefs !== undefined) {
      const refs = requireArray(artifact.licenseRefs, `graph.release.artifacts[${index}].licenseRefs`, errors, 64);
      refs?.forEach((ref, refIndex) => requireString(
        ref,
        `graph.release.artifacts[${index}].licenseRefs[${refIndex}]`,
        errors,
        { maximum: 256 },
      ));
    }
  });
}

function validateNode(value: unknown, index: number, errors: string[]) {
  const path = `graph.nodes[${index}]`;
  const node = requireRecord(value, path, errors);
  if (!node) return;
  requireId(node.id, `${path}.id`, errors);
  requireString(node.kind, `${path}.kind`, errors, { values: NODE_KINDS });
  requireString(node.featureKind, `${path}.featureKind`, errors, { values: FEATURE_KINDS });
  requireString(node.geometryType, `${path}.geometryType`, errors, { values: GEOMETRY_TYPES });
  optionalString(node.countryCode, `${path}.countryCode`, errors, 2);
  optionalString(node.postalCode, `${path}.postalCode`, errors, 64);
  optionalString(node.label, `${path}.label`, errors, 512);
  optionalString(node.agidCellId, `${path}.agidCellId`, errors, 128);
  if (node.visibility !== 'public') addError(errors, `${path}.visibility:explicit-public-required`);
  if (node.kind === 'unit' || node.kind === 'recipient') addError(errors, `${path}.kind:private-kind-forbidden`);
  rejectUnknownKeys(node, path, NODE_KEYS, errors);
}

function validateAssertion(value: unknown, index: number, errors: string[]) {
  const path = `graph.assertions[${index}]`;
  const assertion = requireRecord(value, path, errors);
  if (!assertion) return;
  requireId(assertion.id, `${path}.id`, errors);
  requireId(assertion.fromNodeId, `${path}.fromNodeId`, errors);
  requireId(assertion.toNodeId, `${path}.toNodeId`, errors);
  requireString(assertion.relation, `${path}.relation`, errors, { values: RELATIONS });
  validateTimeRange(assertion.validTime, `${path}.validTime`, errors);
  validateTimeRange(assertion.knownTime, `${path}.knownTime`, errors);
  validateSource(assertion.source, `${path}.source`, errors);
  requireString(assertion.method, `${path}.method`, errors, { values: METHODS });
  validateQuality(assertion.quality, `${path}.quality`, errors);
  rejectUnknownKeys(assertion, path, ASSERTION_KEYS, errors);
  if (assertion.purposes !== undefined) {
    const purposes = requireArray(assertion.purposes, `${path}.purposes`, errors, POSTAL_CONTEXT_PURPOSES.length);
    purposes?.forEach((purpose, purposeIndex) => requireString(
      purpose,
      `${path}.purposes[${purposeIndex}]`,
      errors,
      { values: new Set(POSTAL_CONTEXT_PURPOSES) },
    ));
  }
}

function validatePosition(value: unknown, path: string, errors: string[]) {
  if (!Array.isArray(value) || value.length !== 2
    || value.some(coordinate => typeof coordinate !== 'number' || !Number.isFinite(coordinate))) {
    addError(errors, `${path}:position-required`);
  }
}

function validateLinearRing(value: unknown, path: string, errors: string[]) {
  const ring = requireArray(value, path, errors, POSTAL_CONTEXT_PACK_LIMITS.positionsPerRing);
  ring?.forEach((position, index) => validatePosition(position, `${path}[${index}]`, errors));
}

function validatePolygon(value: unknown, path: string, errors: string[]) {
  const rings = requireArray(value, path, errors, 10_000);
  rings?.forEach((ring, index) => validateLinearRing(ring, `${path}[${index}]`, errors));
}

function validateGeometry(value: unknown, path: string, errors: string[]) {
  const geometry = requireRecord(value, path, errors);
  if (!geometry) return;
  requireString(geometry.type, `${path}.type`, errors, {
    values: new Set(['Point', 'Polygon', 'MultiPolygon']),
  });
  if (geometry.type === 'Point') validatePosition(geometry.coordinates, `${path}.coordinates`, errors);
  else if (geometry.type === 'Polygon') validatePolygon(geometry.coordinates, `${path}.coordinates`, errors);
  else if (geometry.type === 'MultiPolygon') {
    const polygons = requireArray(geometry.coordinates, `${path}.coordinates`, errors, 100_000);
    polygons?.forEach((polygon, index) => validatePolygon(polygon, `${path}.coordinates[${index}]`, errors));
  }
  rejectUnknownKeys(geometry, path, GEOJSON_GEOMETRY_KEYS, errors);
}

function validateGeometryFeature(value: unknown, index: number, errors: string[]) {
  const path = `geometry.features[${index}]`;
  const feature = requireRecord(value, path, errors);
  if (!feature) return;
  requireId(feature.id, `${path}.id`, errors);
  requireId(feature.nodeId, `${path}.nodeId`, errors);
  requireString(feature.role, `${path}.role`, errors, { values: GEOMETRY_ROLES });
  requireString(feature.publicationClass, `${path}.publicationClass`, errors, {
    values: PUBLICATION_CLASSES,
  });
  validateGeometry(feature.geometry, `${path}.geometry`, errors);
  validateSource(feature.source, `${path}.source`, errors);
  validateTimeRange(feature.validTime, `${path}.validTime`, errors);
  validateTimeRange(feature.knownTime, `${path}.knownTime`, errors);
  rejectUnknownKeys(feature, path, GEOMETRY_FEATURE_KEYS, errors);
  validateQuality(feature.quality, `${path}.quality`, errors);
  if (feature.matchRadiusMeters !== undefined
    && (typeof feature.matchRadiusMeters !== 'number' || !Number.isFinite(feature.matchRadiusMeters))) {
    addError(errors, `${path}.matchRadiusMeters:finite-number-required`);
  }
}

export function parsePostalContextRuntimePack(
  value: unknown,
  expectedCountryCode?: string,
): PostalContextPackParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  try {
    const pack = requireRecord(value, 'pack', errors);
    if (!pack) return { ok: false, errors, warnings };
    rejectUnknownKeys(pack, 'pack', PACK_KEYS, errors);
    requireString(pack.schemaVersion, 'pack.schemaVersion', errors, {
      values: new Set([POSTAL_CONTEXT_RUNTIME_PACK_SCHEMA_VERSION]),
    });
    const graph = requireRecord(pack.graph, 'graph', errors);
    const geometry = requireRecord(pack.geometry, 'geometry', errors);
    if (!graph || !geometry) return { ok: false, errors, warnings };
    rejectUnknownKeys(graph, 'graph', GRAPH_KEYS, errors);
    rejectUnknownKeys(geometry, 'geometry', GEOMETRY_COLLECTION_KEYS, errors);

    requireString(graph.schemaVersion, 'graph.schemaVersion', errors, {
      values: new Set([POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION]),
    });
    validateRelease(graph.release, errors);
    const nodes = requireArray(graph.nodes, 'graph.nodes', errors, POSTAL_CONTEXT_PACK_LIMITS.nodes);
    const assertions = requireArray(
      graph.assertions,
      'graph.assertions',
      errors,
      POSTAL_CONTEXT_PACK_LIMITS.assertions,
    );
    nodes?.forEach((node, index) => validateNode(node, index, errors));
    assertions?.forEach((assertion, index) => validateAssertion(assertion, index, errors));

    requireString(geometry.schemaVersion, 'geometry.schemaVersion', errors, {
      values: new Set([POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION]),
    });
    requireString(geometry.countryCode, 'geometry.countryCode', errors, { pattern: /^[A-Z]{2}$/ });
    requireString(geometry.releaseId, 'geometry.releaseId', errors, { maximum: 256 });
    const features = requireArray(
      geometry.features,
      'geometry.features',
      errors,
      POSTAL_CONTEXT_PACK_LIMITS.features,
    );
    features?.forEach((feature, index) => validateGeometryFeature(feature, index, errors));
    if (errors.length) return { ok: false, errors, warnings };

    const typedPack = value as PostalContextRuntimePack;
    const graphValidation = validatePostalContextGraph(typedPack.graph);
    const geometryValidation = validatePostalContextGeometryCollection(typedPack.geometry);
    const runtimeValidation = validatePostalContextRuntimePack(typedPack, expectedCountryCode);
    const topologyValidation = validatePostalContextGeometryTopology(typedPack.geometry);
    errors.push(...graphValidation.errors.map(error => `graph:${error}`));
    errors.push(...geometryValidation.errors.map(error => `geometry:${error}`));
    errors.push(...runtimeValidation.errors.map(error => `runtime:${error}`));
    errors.push(...topologyValidation.errors.map(error => `topology:${error}`));
    warnings.push(...graphValidation.warnings.map(warning => `graph:${warning}`));
    warnings.push(...geometryValidation.warnings.map(warning => `geometry:${warning}`));
    warnings.push(...runtimeValidation.warnings.map(warning => `runtime:${warning}`));

    return {
      ok: errors.length === 0,
      pack: errors.length === 0 ? typedPack : undefined,
      errors: [...new Set(errors)].slice(0, MAX_ERRORS),
      warnings: [...new Set(warnings)].slice(0, MAX_ERRORS),
      counts: {
        nodes: typedPack.graph.nodes.length,
        assertions: typedPack.graph.assertions.length,
        features: typedPack.geometry.features.length,
        positions: topologyValidation.positionCount,
      },
    };
  } catch (error) {
    return {
      ok: false,
      errors: [
        ...errors,
        `pack-validation-exception:${error instanceof Error ? error.name : 'unknown'}`,
      ].slice(0, MAX_ERRORS),
      warnings,
    };
  }
}
