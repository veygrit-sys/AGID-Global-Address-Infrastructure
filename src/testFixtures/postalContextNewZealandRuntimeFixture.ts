import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const NEW_ZEALAND_POSTAL_CONTEXT_TEST_POINT = {
  latitude: -41.3,
  longitude: 174.78,
} as const;

export const NEW_ZEALAND_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function newZealandSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'nz-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'nz-'),
  };
}

export function createNewZealandPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-nz-syn-0000'],
    ['country-jp', 'country-nz'],
    ['prefecture-synthetic', 'region-nz-synthetic'],
    ['locality-synthetic', 'locality-nz-synthetic'],
    ['agid-synthetic-cover', 'agid-nz-synthetic-cover'],
    ['address-point-synthetic', 'address-point-nz-synthetic'],
    ['premise-synthetic', 'premise-nz-synthetic'],
    ['building-synthetic', 'building-nz-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'NZ';
    if (node.id === 'postal-nz-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic NZ Post urban delivery area';
    } else if (node.id === 'country-nz') {
      node.label = 'New Zealand';
    } else if (node.id === 'region-nz-synthetic') {
      node.label = 'Synthetic Region';
    } else if (node.id === 'locality-nz-synthetic') {
      node.label = 'Synthetic Mailtown';
    } else if (node.id === 'agid-nz-synthetic-cover') {
      node.agidCellId = 'NZ0000000000';
      node.label = 'Synthetic New Zealand AGID cover';
    } else if (node.id === 'premise-nz-synthetic') {
      node.label = '1 Synthetic Road';
    } else if (node.id === 'building-nz-synthetic') {
      node.label = 'Synthetic Building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `nz-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = newZealandSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-nz-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-nz-synthetic',
    countryCode: 'NZ',
    releaseId: 'nz-synthetic-2026.01.1',
    policyVersion: 'nz-postal-delivery-network-v0.1',
  };

  pack.geometry.countryCode = 'NZ';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `nz-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = newZealandSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [174.77, -41.31],
          [174.79, -41.31],
          [174.79, -41.29],
          [174.77, -41.29],
          [174.77, -41.31],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'nz-synthetic-pnf-postcode-area',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 25 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          NEW_ZEALAND_POSTAL_CONTEXT_TEST_POINT.longitude,
          NEW_ZEALAND_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [174.77998, -41.30002],
          [174.78002, -41.30002],
          [174.78002, -41.29998],
          [174.77998, -41.29998],
          [174.77998, -41.30002],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
