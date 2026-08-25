import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const BULGARIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 42.6977,
  longitude: 23.3219,
} as const;

export const BULGARIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function bulgariaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'bg-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'bg-'),
  };
}

export function createBulgariaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-bg-syn-0000'],
    ['country-jp', 'country-bg'],
    ['prefecture-synthetic', 'district-bg-synthetic'],
    ['locality-synthetic', 'settlement-bg-synthetic'],
    ['agid-synthetic-cover', 'agid-bg-synthetic-cover'],
    ['address-point-synthetic', 'address-access-point-bg-synthetic'],
    ['premise-synthetic', 'address-unit-bg-synthetic'],
    ['building-synthetic', 'cadastre-building-bg-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'BG';
    if (node.id === 'postal-bg-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic derived Bulgarian postcode membership surface';
    } else if (node.id === 'country-bg') {
      node.label = 'Bulgaria';
    } else if (node.id === 'district-bg-synthetic') {
      node.label = 'Synthetic District';
    } else if (node.id === 'settlement-bg-synthetic') {
      node.label = 'Synthetic Settlement';
    } else if (node.id === 'agid-bg-synthetic-cover') {
      node.agidCellId = 'BG0000000000';
      node.label = 'Synthetic Bulgaria AGID cover';
    } else if (node.id === 'address-unit-bg-synthetic') {
      node.label = 'ул. „Примерна“ 1, вх. А, ет. 1, ап. 2';
    } else if (node.id === 'cadastre-building-bg-synthetic') {
      node.label = 'Synthetic AGCC building linked by cadastral identifier';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `bg-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = bulgariaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-bg-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-bg-synthetic',
    countryCode: 'BG',
    releaseId: 'bg-synthetic-2026.01.1',
    policyVersion: 'bulgaria-posts-grao-agcc-ekatte-v0.1',
  };

  pack.geometry.countryCode = 'BG';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `bg-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = bulgariaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [23.304, 42.686],
          [23.340, 42.686],
          [23.340, 42.710],
          [23.304, 42.710],
          [23.304, 42.686],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'bg-synthetic-derived-postcode-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 5 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          BULGARIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          BULGARIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [23.32182, 42.69764],
          [23.32198, 42.69764],
          [23.32198, 42.69776],
          [23.32182, 42.69776],
          [23.32182, 42.69764],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
