import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ICELAND_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 64.1466,
  longitude: -21.9426,
} as const;

export const ICELAND_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function icelandSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'is-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'is-'),
  };
}

export function createIcelandPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-is-syn-000'],
    ['country-jp', 'country-is'],
    ['prefecture-synthetic', 'region-is-synthetic'],
    ['locality-synthetic', 'locality-is-synthetic'],
    ['agid-synthetic-cover', 'agid-is-synthetic-cover'],
    ['address-point-synthetic', 'address-point-is-synthetic'],
    ['premise-synthetic', 'premise-is-synthetic'],
    ['building-synthetic', 'building-is-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'IS';
    if (node.id === 'postal-is-syn-000') {
      node.postalCode = '000';
      node.label = 'Synthetic Iceland postcode area';
    } else if (node.id === 'country-is') {
      node.label = 'Iceland';
    } else if (node.id === 'region-is-synthetic') {
      node.label = 'Synthetic Region';
    } else if (node.id === 'locality-is-synthetic') {
      node.label = 'Synthetic Municipality';
    } else if (node.id === 'agid-is-synthetic-cover') {
      node.agidCellId = 'IS0000000000';
      node.label = 'Synthetic Iceland AGID cover';
    } else if (node.id === 'premise-is-synthetic') {
      node.label = '1 Synthetic Street';
    } else if (node.id === 'building-is-synthetic') {
      node.label = 'Synthetic Building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `is-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = icelandSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-is-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-is-synthetic',
    countryCode: 'IS',
    releaseId: 'is-synthetic-2026.01.1',
    policyVersion: 'iceland-postal-area-v0.1',
  };

  pack.geometry.countryCode = 'IS';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `is-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = icelandSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-21.96, 64.14],
          [-21.92, 64.14],
          [-21.92, 64.16],
          [-21.96, 64.16],
          [-21.96, 64.14],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'is-synthetic-byggdastofnun-postcode-area',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 50 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          ICELAND_POSTAL_CONTEXT_TEST_POINT.longitude,
          ICELAND_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-21.94264, 64.14657],
          [-21.94256, 64.14657],
          [-21.94256, 64.14663],
          [-21.94264, 64.14663],
          [-21.94264, 64.14657],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
