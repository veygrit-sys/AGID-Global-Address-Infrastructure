import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const SWITZERLAND_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 46.948,
  longitude: 7.4474,
} as const;

export const SWITZERLAND_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-15T00:00:00.000Z';

function switzerlandSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'ch-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ch-'),
  };
}

export function createSwitzerlandPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ch-syn-0000'],
    ['country-jp', 'country-ch'],
    ['prefecture-synthetic', 'canton-ch-synthetic'],
    ['locality-synthetic', 'locality-ch-synthetic'],
    ['agid-synthetic-cover', 'agid-ch-synthetic-cover'],
    ['address-point-synthetic', 'building-address-ch-synthetic'],
    ['premise-synthetic', 'entrance-ch-synthetic'],
    ['building-synthetic', 'gwr-building-ch-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'CH';
    if (node.id === 'postal-ch-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic Swiss PLZO locality';
    } else if (node.id === 'country-ch') {
      node.label = 'Switzerland';
    } else if (node.id === 'canton-ch-synthetic') {
      node.label = 'Synthetic Canton';
    } else if (node.id === 'locality-ch-synthetic') {
      node.label = 'Synthetic Locality';
    } else if (node.id === 'agid-ch-synthetic-cover') {
      node.agidCellId = 'CH0000000000';
      node.label = 'Synthetic Switzerland AGID cover';
    } else if (node.id === 'entrance-ch-synthetic') {
      node.label = 'Syntheticstrasse 1';
    } else if (node.id === 'gwr-building-ch-synthetic') {
      node.label = 'Synthetic EGID Building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `ch-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = switzerlandSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ch-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ch-synthetic',
    countryCode: 'CH',
    releaseId: 'ch-synthetic-2026.01.1',
    policyVersion: 'switzerland-plzo-egid-v0.1',
  };

  pack.geometry.countryCode = 'CH';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `ch-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = switzerlandSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [7.43, 46.94],
          [7.46, 46.94],
          [7.46, 46.96],
          [7.43, 46.96],
          [7.43, 46.94],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ch-synthetic-swisstopo-plzo',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 10 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          SWITZERLAND_POSTAL_CONTEXT_TEST_POINT.longitude,
          SWITZERLAND_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [7.44732, 46.94794],
          [7.44748, 46.94794],
          [7.44748, 46.94806],
          [7.44732, 46.94806],
          [7.44732, 46.94794],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
