import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const DENMARK_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 55.6761,
  longitude: 12.5683,
} as const;

export const DENMARK_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function denmarkSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'dk-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'dk-'),
  };
}

export function createDenmarkPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-dk-syn-0000'],
    ['country-jp', 'country-dk'],
    ['prefecture-synthetic', 'region-dk-synthetic'],
    ['locality-synthetic', 'municipality-dk-synthetic'],
    ['agid-synthetic-cover', 'agid-dk-synthetic-cover'],
    ['address-point-synthetic', 'dar-house-number-dk-synthetic'],
    ['premise-synthetic', 'civic-address-dk-synthetic'],
    ['building-synthetic', 'geodanmark-building-dk-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'DK';
    if (node.id === 'postal-dk-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic Danish DAGI postcode area';
    } else if (node.id === 'country-dk') {
      node.label = 'Denmark';
    } else if (node.id === 'region-dk-synthetic') {
      node.label = 'Synthetic Region';
    } else if (node.id === 'municipality-dk-synthetic') {
      node.label = 'Synthetic Kommune';
    } else if (node.id === 'agid-dk-synthetic-cover') {
      node.agidCellId = 'DK0000000000';
      node.label = 'Synthetic Denmark AGID cover';
    } else if (node.id === 'civic-address-dk-synthetic') {
      node.label = 'Prøvegade 1';
    } else if (node.id === 'geodanmark-building-dk-synthetic') {
      node.label = 'Synthetic explicitly linked GeoDanmark building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `dk-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = denmarkSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-dk-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-dk-synthetic',
    countryCode: 'DK',
    releaseId: 'dk-synthetic-2026.01.1',
    policyVersion: 'denmark-postcode-dar-v0.1',
  };

  pack.geometry.countryCode = 'DK';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `dk-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = denmarkSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [12.55, 55.665],
          [12.585, 55.665],
          [12.585, 55.687],
          [12.55, 55.687],
          [12.55, 55.665],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'dk-synthetic-dagi-postcode-area',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 5 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          DENMARK_POSTAL_CONTEXT_TEST_POINT.longitude,
          DENMARK_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [12.56822, 55.67604],
          [12.56838, 55.67604],
          [12.56838, 55.67616],
          [12.56822, 55.67616],
          [12.56822, 55.67604],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
