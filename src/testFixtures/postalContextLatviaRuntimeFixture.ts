import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const LATVIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 56.9496,
  longitude: 24.1052,
} as const;

export const LATVIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function latviaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'lv-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'lv-'),
  };
}

export function createLatviaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-lv-syn-0000'],
    ['country-jp', 'country-lv'],
    ['prefecture-synthetic', 'municipality-lv-synthetic'],
    ['locality-synthetic', 'locality-lv-synthetic'],
    ['agid-synthetic-cover', 'agid-lv-synthetic-cover'],
    ['address-point-synthetic', 'vzd-address-lv-synthetic'],
    ['premise-synthetic', 'premise-lv-synthetic'],
    ['building-synthetic', 'vzd-building-lv-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'LV';
    if (node.id === 'postal-lv-syn-0000') {
      node.postalCode = 'LV-0000';
      node.label = 'Synthetic Latvijas Pasts address range';
    } else if (node.id === 'country-lv') {
      node.label = 'Latvia';
    } else if (node.id === 'municipality-lv-synthetic') {
      node.label = 'Synthetic Municipality';
    } else if (node.id === 'locality-lv-synthetic') {
      node.label = 'Synthetic Locality';
    } else if (node.id === 'agid-lv-synthetic-cover') {
      node.agidCellId = 'LV0000000000';
      node.label = 'Synthetic Latvia AGID cover';
    } else if (node.id === 'premise-lv-synthetic') {
      node.label = 'Testa iela 1';
    } else if (node.id === 'vzd-building-lv-synthetic') {
      node.label = 'Synthetic explicitly linked VZD cadastral building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `lv-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = latviaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-lv-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-lv-synthetic',
    countryCode: 'LV',
    releaseId: 'lv-synthetic-2026.01.1',
    policyVersion: 'latvijas-pasts-vzd-v0.1',
  };

  pack.geometry.countryCode = 'LV';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `lv-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = latviaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [24.0952, 56.9396],
          [24.1152, 56.9396],
          [24.1152, 56.9596],
          [24.0952, 56.9596],
          [24.0952, 56.9396],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'lv-synthetic-derived-address-range-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          LATVIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          LATVIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [24.10518, 56.94958],
          [24.10522, 56.94958],
          [24.10522, 56.94962],
          [24.10518, 56.94962],
          [24.10518, 56.94958],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
