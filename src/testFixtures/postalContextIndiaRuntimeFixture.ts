import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const INDIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 28.6139,
  longitude: 77.2090,
} as const;

export const INDIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function indiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'in-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'in-'),
  };
}

export function createIndiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-in-syn-100000'],
    ['country-jp', 'country-in'],
    ['prefecture-synthetic', 'state-in-synthetic'],
    ['locality-synthetic', 'district-in-synthetic'],
    ['agid-synthetic-cover', 'agid-in-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-in-synthetic'],
    ['premise-synthetic', 'civic-address-in-synthetic'],
    ['building-synthetic', 'building-in-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'IN';
    if (node.id === 'postal-in-syn-100000') {
      node.postalCode = '100000';
      node.label = 'Synthetic India PIN delivery-network assignment';
    } else if (node.id === 'country-in') {
      node.label = 'India';
    } else if (node.id === 'state-in-synthetic') {
      node.label = 'Synthetic State or Union Territory';
    } else if (node.id === 'district-in-synthetic') {
      node.label = 'Synthetic District';
    } else if (node.id === 'agid-in-synthetic-cover') {
      node.agidCellId = 'IN0000000000';
      node.label = 'Synthetic India AGID cover';
    } else if (node.id === 'civic-address-in-synthetic') {
      node.label = '1 Synthetic Road';
    } else if (node.id === 'building-in-synthetic') {
      node.label = 'Synthetic explicitly linked India building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `in-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = indiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-in-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-in-synthetic',
    countryCode: 'IN',
    releaseId: 'in-synthetic-2026.01.1',
    policyVersion: 'india-pin-delivery-network-and-digipin-v0.1',
  };

  pack.geometry.countryCode = 'IN';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `in-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = indiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [77.198, 28.603],
          [77.220, 28.603],
          [77.220, 28.625],
          [77.198, 28.625],
          [77.198, 28.603],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'in-synthetic-derived-pin-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 300 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [INDIA_POSTAL_CONTEXT_TEST_POINT.longitude, INDIA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [77.20892, 28.61384],
          [77.20908, 28.61384],
          [77.20908, 28.61396],
          [77.20892, 28.61396],
          [77.20892, 28.61384],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
