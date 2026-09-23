import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const UKRAINE_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 50.4501,
  longitude: 30.5234,
} as const;

export const UKRAINE_POSTAL_CONTEXT_TEST_INSTANT = '2026-07-01T00:00:00.000Z';

function ukraineSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'ua-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ua-'),
  };
}

export function createUkrainePostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ua-syn-00000'],
    ['country-jp', 'country-ua'],
    ['prefecture-synthetic', 'oblast-ua-synthetic'],
    ['locality-synthetic', 'settlement-ua-synthetic'],
    ['agid-synthetic-cover', 'agid-ua-synthetic-cover'],
    ['address-point-synthetic', 'address-ua-synthetic'],
    ['premise-synthetic', 'premise-ua-synthetic'],
    ['building-synthetic', 'building-ua-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'UA';
    if (node.id === 'postal-ua-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Ukraine address-membership surface';
    } else if (node.id === 'country-ua') {
      node.label = 'Ukraine';
    } else if (node.id === 'oblast-ua-synthetic') {
      node.label = 'Synthetic Oblast';
    } else if (node.id === 'settlement-ua-synthetic') {
      node.label = 'Synthetic Settlement';
    } else if (node.id === 'agid-ua-synthetic-cover') {
      node.agidCellId = 'UA0000000000';
      node.label = 'Synthetic Ukraine AGID cover';
    } else if (node.id === 'premise-ua-synthetic') {
      node.label = 'Тестова вулиця, 1';
    } else if (node.id === 'building-ua-synthetic') {
      node.label = 'Synthetic explicitly linked Ukraine building-register object';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `ua-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = ukraineSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ua-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ua-synthetic',
    countryCode: 'UA',
    releaseId: 'ua-synthetic-2026.01.1',
    policyVersion: 'ukrposhta-edra-nsdi-v0.1',
  };

  pack.geometry.countryCode = 'UA';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `ua-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = ukraineSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [30.5134, 50.4401],
          [30.5334, 50.4401],
          [30.5334, 50.4601],
          [30.5134, 50.4601],
          [30.5134, 50.4401],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ua-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 200 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          UKRAINE_POSTAL_CONTEXT_TEST_POINT.longitude,
          UKRAINE_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [30.52336, 50.45006],
          [30.52344, 50.45006],
          [30.52344, 50.45014],
          [30.52336, 50.45014],
          [30.52336, 50.45006],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
