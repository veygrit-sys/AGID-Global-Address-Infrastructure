import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const PAKISTAN_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 33.6844,
  longitude: 73.0479,
} as const;

export const PAKISTAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function pakistanSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'pk-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'pk-'),
  };
}

export function createPakistanPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-pk-syn-00000'],
    ['country-jp', 'country-pk'],
    ['prefecture-synthetic', 'province-pk-synthetic'],
    ['locality-synthetic', 'delivery-office-pk-synthetic'],
    ['agid-synthetic-cover', 'agid-pk-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-pk-synthetic'],
    ['premise-synthetic', 'civic-address-pk-synthetic'],
    ['building-synthetic', 'building-pk-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'PK';
    if (node.id === 'postal-pk-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Pakistan delivery-post-office assignment 00000';
    } else if (node.id === 'country-pk') {
      node.label = 'Pakistan';
    } else if (node.id === 'province-pk-synthetic') {
      node.label = 'Synthetic Pakistan Province';
    } else if (node.id === 'delivery-office-pk-synthetic') {
      node.label = 'Synthetic Pakistan Delivery Post Office';
    } else if (node.id === 'agid-pk-synthetic-cover') {
      node.agidCellId = 'PK0000000000';
      node.label = 'Synthetic Pakistan AGID cover';
    } else if (node.id === 'civic-address-pk-synthetic') {
      node.label = 'Synthetic House 1, Street 1, Sector 1, explicit civic address PK-SYN-00000';
    } else if (node.id === 'building-pk-synthetic') {
      node.label = 'Synthetic explicitly linked Pakistan building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'pk-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = pakistanSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-pk-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-pk-synthetic',
    countryCode: 'PK',
    releaseId: 'pk-synthetic-2026.01.1',
    policyVersion: 'pakistan-postcode-office-v0.1',
  };

  pack.geometry.countryCode = 'PK';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'pk-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = pakistanSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [73.035, 33.675],
          [73.060, 33.675],
          [73.060, 33.695],
          [73.035, 33.695],
          [73.035, 33.675],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'pk-synthetic-derived-postal-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 300 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [PAKISTAN_POSTAL_CONTEXT_TEST_POINT.longitude, PAKISTAN_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [73.04782, 33.68434],
          [73.04798, 33.68434],
          [73.04798, 33.68446],
          [73.04782, 33.68446],
          [73.04782, 33.68434],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
