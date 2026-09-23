import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const TAIWAN_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 25.0478,
  longitude: 121.5319,
} as const;

export const TAIWAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function taiwanSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'tw-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'tw-'),
  };
}

export function createTaiwanPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-tw-syn-000000'],
    ['country-jp', 'country-tw'],
    ['prefecture-synthetic', 'county-tw-synthetic'],
    ['locality-synthetic', 'district-tw-synthetic'],
    ['agid-synthetic-cover', 'agid-tw-synthetic-cover'],
    ['address-point-synthetic', 'moi-doorplate-point-tw-synthetic'],
    ['premise-synthetic', 'moi-doorplate-address-tw-synthetic'],
    ['building-synthetic', 'nlsc-building-tw-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'TW';
    if (node.id === 'postal-tw-syn-000000') {
      node.postalCode = '000000';
      node.label = 'Synthetic Taiwan 3+3 delivery-range assignment';
    } else if (node.id === 'country-tw') {
      node.label = 'Taiwan';
    } else if (node.id === 'county-tw-synthetic') {
      node.label = '測試市';
    } else if (node.id === 'district-tw-synthetic') {
      node.label = '測試區';
    } else if (node.id === 'agid-tw-synthetic-cover') {
      node.agidCellId = 'TW0000000000';
      node.label = 'Synthetic Taiwan AGID cover';
    } else if (node.id === 'moi-doorplate-address-tw-synthetic') {
      node.label = '示例路一段1號';
    } else if (node.id === 'nlsc-building-tw-synthetic') {
      node.label = 'Synthetic explicitly linked NLSC building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `tw-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = taiwanSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-tw-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-tw-synthetic',
    countryCode: 'TW',
    releaseId: 'tw-synthetic-2026.01.1',
    policyVersion: 'taiwan-chunghwa-post-moi-nlsc-building-v0.1',
  };

  pack.geometry.countryCode = 'TW';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `tw-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = taiwanSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [121.516, 25.037],
          [121.547, 25.037],
          [121.547, 25.059],
          [121.516, 25.059],
          [121.516, 25.037],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'tw-synthetic-derived-doorplate-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 200 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          TAIWAN_POSTAL_CONTEXT_TEST_POINT.longitude,
          TAIWAN_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [121.53182, 25.04774],
          [121.53198, 25.04774],
          [121.53198, 25.04786],
          [121.53182, 25.04786],
          [121.53182, 25.04774],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
