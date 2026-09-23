import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const NETHERLANDS_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 52.37,
  longitude: 4.9,
} as const;

export const NETHERLANDS_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function netherlandsSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'nl-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'nl-'),
  };
}

export function createNetherlandsPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-nl-syn-0000aa'],
    ['country-jp', 'country-nl'],
    ['prefecture-synthetic', 'province-nl-synthetic'],
    ['locality-synthetic', 'locality-nl-synthetic'],
    ['agid-synthetic-cover', 'agid-nl-synthetic-cover'],
    ['address-point-synthetic', 'address-point-nl-synthetic'],
    ['premise-synthetic', 'premise-nl-synthetic'],
    ['building-synthetic', 'building-nl-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'NL';
    if (node.id === 'postal-nl-syn-0000aa') {
      node.postalCode = '0000 AA';
      node.label = 'Synthetic PC6 derived area';
    } else if (node.id === 'country-nl') {
      node.label = 'Nederland';
    } else if (node.id === 'province-nl-synthetic') {
      node.label = 'Synthetic Province';
    } else if (node.id === 'locality-nl-synthetic') {
      node.label = 'Synthetic Stad';
    } else if (node.id === 'agid-nl-synthetic-cover') {
      node.agidCellId = 'NL0000000000';
      node.label = 'Synthetic Netherlands AGID cover';
    } else if (node.id === 'premise-nl-synthetic') {
      node.label = 'Syntheticstraat 1';
    } else if (node.id === 'building-nl-synthetic') {
      node.label = 'Synthetic BAG Building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `nl-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = netherlandsSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-nl-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-nl-synthetic',
    countryCode: 'NL',
    releaseId: 'nl-synthetic-2026.01.1',
    policyVersion: 'nl-pc6-address-range-v0.1',
  };

  pack.geometry.countryCode = 'NL';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `nl-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = netherlandsSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [4.89, 52.36],
          [4.91, 52.36],
          [4.91, 52.38],
          [4.89, 52.38],
          [4.89, 52.36],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'nl-synthetic-cbs-postcode-area',
        assignmentAuthority: 'none',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 50 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          NETHERLANDS_POSTAL_CONTEXT_TEST_POINT.longitude,
          NETHERLANDS_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [4.89998, 52.36998],
          [4.90002, 52.36998],
          [4.90002, 52.37002],
          [4.89998, 52.37002],
          [4.89998, 52.36998],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
