import {
  POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
  type PostalContextAssertion,
  type PostalContextGraph,
  type PostalContextNode,
  type PostalContextSource,
} from '../lib/postalContextGraph';
import {
  POSTAL_CONTEXT_RUNTIME_PACK_SCHEMA_VERSION,
  type PostalContextRuntimePack,
} from '../lib/postalContextPackRuntime';
import {
  POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,
  type PostalContextGeometryCollection,
  type PostalContextGeometryFeature,
} from '../lib/postalContextSpatial';

export const POSTAL_CONTEXT_TEST_POINT = {
  latitude: 35.68,
  longitude: 139.75,
} as const;

export const POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

const RANGE = { from: '2026-01-01T00:00:00.000Z', to: null } as const;
const DIGEST = `sha256:${'a'.repeat(64)}` as const;

const assignmentSource: PostalContextSource = {
  sourceId: 'jp-synthetic-assignment',
  sourceType: 'synthetic',
  assignmentAuthority: 'synthetic_fixture_assignment',
  geometryAuthority: 'none',
  sourceVersion: 'jp-synthetic-v1',
  licenseId: 'AGID-SYNTHETIC-ONLY',
  digest: DIGEST,
};

const geometrySource: PostalContextSource = {
  sourceId: 'jp-synthetic-geometry',
  sourceType: 'synthetic',
  assignmentAuthority: 'none',
  geometryAuthority: 'synthetic_fixture_geometry',
  sourceVersion: 'jp-synthetic-v1',
  licenseId: 'AGID-SYNTHETIC-ONLY',
  digest: DIGEST,
};

const linkedSource: PostalContextSource = {
  sourceId: 'jp-synthetic-crosswalk',
  sourceType: 'synthetic',
  assignmentAuthority: 'synthetic_fixture_assignment',
  geometryAuthority: 'synthetic_fixture_geometry',
  sourceVersion: 'jp-synthetic-v1',
  licenseId: 'AGID-SYNTHETIC-ONLY',
  digest: DIGEST,
};

function node(
  id: string,
  kind: PostalContextNode['kind'],
  featureKind: PostalContextNode['featureKind'],
  extra: Partial<PostalContextNode> = {},
): PostalContextNode {
  return {
    id,
    kind,
    featureKind,
    geometryType: 'none',
    countryCode: 'JP',
    visibility: 'public',
    ...extra,
  };
}

function assertion(
  id: string,
  fromNodeId: string,
  toNodeId: string,
  relation: PostalContextAssertion['relation'],
  method: PostalContextAssertion['method'],
  source: PostalContextSource,
): PostalContextAssertion {
  return {
    id,
    fromNodeId,
    toNodeId,
    relation,
    validTime: RANGE,
    knownTime: RANGE,
    source,
    method,
    quality: { status: 'verified' },
  };
}

export function createPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const nodes: PostalContextNode[] = [
    node('postal-jp-syn-0000001', 'postal_feature', 'standard_area', {
      geometryType: 'polygon',
      postalCode: '000-0001',
      label: '架空郵便領域',
    }),
    node('country-jp', 'administrative_area', 'country', { label: '日本' }),
    node('prefecture-synthetic', 'administrative_area', 'administrative', { label: '架空都' }),
    node('locality-synthetic', 'locality', 'locality', { label: '架空検証町' }),
    node('agid-synthetic-cover', 'agid_cell', 'unknown', {
      agidCellId: 'JP0000000000',
      label: '架空AGID cover',
    }),
    node('address-point-synthetic', 'address_point', 'query_point', { geometryType: 'point' }),
    node('premise-synthetic', 'address_record', 'premise', { label: '架空検証町 1-2' }),
    node('building-synthetic', 'building', 'building', {
      geometryType: 'polygon',
      label: '架空AGIDビル',
    }),
  ];
  const assertions: PostalContextAssertion[] = [
    assertion('a-postal-locality', 'postal-jp-syn-0000001', 'locality-synthetic', 'admin_within', 'official_crosswalk', linkedSource),
    assertion('a-locality-prefecture', 'locality-synthetic', 'prefecture-synthetic', 'admin_within', 'official_crosswalk', linkedSource),
    assertion('a-prefecture-country', 'prefecture-synthetic', 'country-jp', 'admin_within', 'official_crosswalk', linkedSource),
    assertion('a-postal-agid', 'postal-jp-syn-0000001', 'agid-synthetic-cover', 'covered_by_agid', 'derived', geometrySource),
    assertion('a-address-point-premise', 'address-point-synthetic', 'premise-synthetic', 'locates', 'direct_source_link', linkedSource),
    assertion('a-premise-postal', 'premise-synthetic', 'postal-jp-syn-0000001', 'postal_assigned', 'explicit_assignment', assignmentSource),
    assertion('a-premise-building', 'premise-synthetic', 'building-synthetic', 'addresses', 'official_crosswalk', linkedSource),
    assertion('a-premise-locality', 'premise-synthetic', 'locality-synthetic', 'admin_within', 'official_crosswalk', linkedSource),
  ];
  const release = {
    schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
    repositoryId: 'agid-postal-jp-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-jp-synthetic',
    countryCode: 'JP',
    releaseId: 'jp-synthetic-2026.01.1',
    policyVersion: 'jp-display-v0.1',
    releasedAt: '2026-01-02T00:00:00.000Z',
    validTime: RANGE,
    manifestDigest: DIGEST,
    artifacts: [{
      path: 'geometry.json',
      mediaType: 'application/vnd.agid.postal-context-geometry+json',
      digest: DIGEST,
      byteLength: 1,
      recordCount: 3,
      licenseRefs: ['AGID-SYNTHETIC-ONLY'],
    }],
  } satisfies PostalContextGraph['release'];
  const graph: PostalContextGraph = {
    schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
    release,
    nodes,
    assertions,
  };

  const postalFeature: PostalContextGeometryFeature = {
    id: 'geometry-postal-synthetic',
    nodeId: 'postal-jp-syn-0000001',
    role: 'postal_area',
    publicationClass: 'public_context',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [139.74, 35.67],
        [139.76, 35.67],
        [139.76, 35.69],
        [139.74, 35.69],
        [139.74, 35.67],
      ]],
    },
    source: geometrySource,
    validTime: RANGE,
    knownTime: RANGE,
    quality: { status: 'verified', accuracyMeters: 1 },
  };
  const addressPointFeature: PostalContextGeometryFeature = {
    id: 'geometry-address-point-synthetic',
    nodeId: 'address-point-synthetic',
    role: 'address_point',
    publicationClass: 'public_civic_address',
    geometry: {
      type: 'Point',
      coordinates: [POSTAL_CONTEXT_TEST_POINT.longitude, POSTAL_CONTEXT_TEST_POINT.latitude],
    },
    source: geometrySource,
    validTime: RANGE,
    knownTime: RANGE,
    quality: { status: 'verified', accuracyMeters: 1 },
    matchRadiusMeters: 2,
  };
  const buildingFeature: PostalContextGeometryFeature = {
    id: 'geometry-building-synthetic',
    nodeId: 'building-synthetic',
    role: 'building_footprint',
    publicationClass: 'public_building',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [139.74998, 35.67998],
        [139.75002, 35.67998],
        [139.75002, 35.68002],
        [139.74998, 35.68002],
        [139.74998, 35.67998],
      ]],
    },
    source: geometrySource,
    validTime: RANGE,
    knownTime: RANGE,
    quality: { status: 'verified', accuracyMeters: 1 },
  };
  const geometry: PostalContextGeometryCollection = {
    schemaVersion: POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,
    countryCode: 'JP',
    releaseId: release.releaseId,
    features: [postalFeature, addressPointFeature, buildingFeature],
  };
  return {
    schemaVersion: POSTAL_CONTEXT_RUNTIME_PACK_SCHEMA_VERSION,
    graph,
    geometry,
  };
}
