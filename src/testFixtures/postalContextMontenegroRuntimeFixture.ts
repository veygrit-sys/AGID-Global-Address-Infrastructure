import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const MONTENEGRO_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 42.4413,
  longitude: 19.2636,
} as const;

export const MONTENEGRO_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function montenegroSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'me-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'me-'),
  };
}

export function createMontenegroPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-me-syn-00000'],
    ['country-jp', 'country-me'],
    ['prefecture-synthetic', 'municipality-me-synthetic'],
    ['locality-synthetic', 'settlement-me-synthetic'],
    ['agid-synthetic-cover', 'agid-me-synthetic-cover'],
    ['address-point-synthetic', 'uzn-house-number-point-me-synthetic'],
    ['premise-synthetic', 'uzn-address-me-synthetic'],
    ['building-synthetic', 'uzn-building-me-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'ME';
    if (node.id === 'postal-me-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Montenegro destination-post-office assignment';
    } else if (node.id === 'country-me') {
      node.label = 'Montenegro';
    } else if (node.id === 'municipality-me-synthetic') {
      node.label = 'Probna opština';
    } else if (node.id === 'settlement-me-synthetic') {
      node.label = 'Probno naselje';
    } else if (node.id === 'agid-me-synthetic-cover') {
      node.agidCellId = 'ME0000000000';
      node.label = 'Synthetic Montenegro AGID cover';
    } else if (node.id === 'uzn-address-me-synthetic') {
      node.label = 'Probna ulica 1';
    } else if (node.id === 'uzn-building-me-synthetic') {
      node.label = 'Synthetic explicitly linked UZN cadastral building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `me-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = montenegroSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-me-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-me-synthetic',
    countryCode: 'ME',
    releaseId: 'me-synthetic-2026.01.1',
    policyVersion: 'montenegro-posta-pak-uzn-address-building-v0.1',
  };

  pack.geometry.countryCode = 'ME';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `me-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = montenegroSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [19.248, 42.431],
          [19.278, 42.431],
          [19.278, 42.452],
          [19.248, 42.452],
          [19.248, 42.431],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'me-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 300 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          MONTENEGRO_POSTAL_CONTEXT_TEST_POINT.longitude,
          MONTENEGRO_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [19.26352, 42.44124],
          [19.26368, 42.44124],
          [19.26368, 42.44136],
          [19.26352, 42.44136],
          [19.26352, 42.44124],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
