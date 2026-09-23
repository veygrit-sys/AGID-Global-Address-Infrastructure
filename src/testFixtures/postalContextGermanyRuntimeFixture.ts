import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const GERMANY_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 52.52,
  longitude: 13.405,
} as const;

export const GERMANY_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-15T00:00:00.000Z';

function germanySource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'de-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'de-'),
  };
}

export function createGermanyPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-de-syn-00000'],
    ['country-jp', 'country-de'],
    ['prefecture-synthetic', 'land-de-synthetic'],
    ['locality-synthetic', 'municipality-de-synthetic'],
    ['agid-synthetic-cover', 'agid-de-synthetic-cover'],
    ['address-point-synthetic', 'house-coordinate-de-synthetic'],
    ['premise-synthetic', 'civic-address-de-synthetic'],
    ['building-synthetic', 'building-footprint-de-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'DE';
    if (node.id === 'postal-de-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic German delivery postcode area';
    } else if (node.id === 'country-de') {
      node.label = 'Germany';
    } else if (node.id === 'land-de-synthetic') {
      node.label = 'Synthetic Land';
    } else if (node.id === 'municipality-de-synthetic') {
      node.label = 'Synthetic Gemeinde';
    } else if (node.id === 'agid-de-synthetic-cover') {
      node.agidCellId = 'DE0000000000';
      node.label = 'Synthetic Germany AGID cover';
    } else if (node.id === 'civic-address-de-synthetic') {
      node.label = 'Prüfstraße 1';
    } else if (node.id === 'building-footprint-de-synthetic') {
      node.label = 'Synthetic explicitly linked building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `de-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = germanySource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-de-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-de-synthetic',
    countryCode: 'DE',
    releaseId: 'de-synthetic-2026.01.1',
    policyVersion: 'germany-plz-building-v0.1',
  };

  pack.geometry.countryCode = 'DE';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `de-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = germanySource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [13.39, 52.51],
          [13.42, 52.51],
          [13.42, 52.53],
          [13.39, 52.53],
          [13.39, 52.51],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'de-synthetic-licensed-delivery-area',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 10 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          GERMANY_POSTAL_CONTEXT_TEST_POINT.longitude,
          GERMANY_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [13.40492, 52.51994],
          [13.40508, 52.51994],
          [13.40508, 52.52006],
          [13.40492, 52.52006],
          [13.40492, 52.51994],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
