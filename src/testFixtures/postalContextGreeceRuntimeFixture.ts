import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const GREECE_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 37.9838,
  longitude: 23.7275,
} as const;

export const GREECE_POSTAL_CONTEXT_TEST_INSTANT = '2026-07-01T00:00:00.000Z';

function greeceSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'gr-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'gr-'),
  };
}

export function createGreecePostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-gr-syn-000-00'],
    ['country-jp', 'country-gr'],
    ['prefecture-synthetic', 'region-gr-synthetic'],
    ['locality-synthetic', 'municipality-gr-synthetic'],
    ['agid-synthetic-cover', 'agid-gr-synthetic-cover'],
    ['address-point-synthetic', 'address-gr-synthetic'],
    ['premise-synthetic', 'premise-gr-synthetic'],
    ['building-synthetic', 'building-gr-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'GR';
    if (node.id === 'postal-gr-syn-000-00') {
      node.postalCode = '000 00';
      node.label = 'Synthetic Greece address-membership surface';
    } else if (node.id === 'country-gr') {
      node.label = 'Greece';
    } else if (node.id === 'region-gr-synthetic') {
      node.label = 'Synthetic Region';
    } else if (node.id === 'municipality-gr-synthetic') {
      node.label = 'Synthetic Municipality';
    } else if (node.id === 'agid-gr-synthetic-cover') {
      node.agidCellId = 'GR0000000000';
      node.label = 'Synthetic Greece AGID cover';
    } else if (node.id === 'premise-gr-synthetic') {
      node.label = 'Οδός Δοκιμής 1';
    } else if (node.id === 'building-gr-synthetic') {
      node.label = 'Synthetic explicitly linked Greek building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `gr-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = greeceSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-gr-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-gr-synthetic',
    countryCode: 'GR',
    releaseId: 'gr-synthetic-2026.01.1',
    policyVersion: 'greece-elta-gisco-address-building-v0.1',
  };

  pack.geometry.countryCode = 'GR';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `gr-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = greeceSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [23.7175, 37.9738],
          [23.7375, 37.9738],
          [23.7375, 37.9938],
          [23.7175, 37.9938],
          [23.7175, 37.9738],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'gr-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 250 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          GREECE_POSTAL_CONTEXT_TEST_POINT.longitude,
          GREECE_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [23.72746, 37.98376],
          [23.72754, 37.98376],
          [23.72754, 37.98384],
          [23.72746, 37.98384],
          [23.72746, 37.98376],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
