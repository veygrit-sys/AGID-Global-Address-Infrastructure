import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const CYPRUS_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 35.1856,
  longitude: 33.3823,
} as const;

export const CYPRUS_POSTAL_CONTEXT_TEST_INSTANT = '2026-07-01T00:00:00.000Z';

function cyprusSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'cy-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'cy-'),
  };
}

export function createCyprusPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-cy-syn-0000'],
    ['country-jp', 'country-cy'],
    ['prefecture-synthetic', 'district-cy-synthetic'],
    ['locality-synthetic', 'community-cy-synthetic'],
    ['agid-synthetic-cover', 'agid-cy-synthetic-cover'],
    ['address-point-synthetic', 'address-cy-synthetic'],
    ['premise-synthetic', 'premise-cy-synthetic'],
    ['building-synthetic', 'building-cy-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'CY';
    if (node.id === 'postal-cy-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic Cyprus street-membership surface';
    } else if (node.id === 'country-cy') {
      node.label = 'Cyprus';
    } else if (node.id === 'district-cy-synthetic') {
      node.label = 'Synthetic District';
    } else if (node.id === 'community-cy-synthetic') {
      node.label = 'Synthetic Community';
    } else if (node.id === 'agid-cy-synthetic-cover') {
      node.agidCellId = 'CY0000000000';
      node.label = 'Synthetic Cyprus AGID cover';
    } else if (node.id === 'premise-cy-synthetic') {
      node.label = 'Οδός Δοκιμής 1';
    } else if (node.id === 'building-cy-synthetic') {
      node.label = 'Synthetic explicitly linked DLS INSPIRE building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `cy-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = cyprusSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-cy-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-cy-synthetic',
    countryCode: 'CY',
    releaseId: 'cy-synthetic-2026.01.1',
    policyVersion: 'cyprus-post-dls-cystat-v0.1',
  };

  pack.geometry.countryCode = 'CY';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `cy-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = cyprusSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [33.3723, 35.1756],
          [33.3923, 35.1756],
          [33.3923, 35.1956],
          [33.3723, 35.1956],
          [33.3723, 35.1756],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'cy-synthetic-derived-street-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 200 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          CYPRUS_POSTAL_CONTEXT_TEST_POINT.longitude,
          CYPRUS_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [33.38226, 35.18556],
          [33.38234, 35.18556],
          [33.38234, 35.18564],
          [33.38226, 35.18564],
          [33.38226, 35.18556],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
