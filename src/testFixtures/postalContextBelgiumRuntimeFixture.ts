import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const BELGIUM_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 50.8466,
  longitude: 4.3528,
} as const;

export const BELGIUM_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function belgiumSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'be-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'be-'),
  };
}

export function createBelgiumPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-be-syn-0000'],
    ['country-jp', 'country-be'],
    ['prefecture-synthetic', 'region-be-synthetic'],
    ['locality-synthetic', 'municipality-be-synthetic'],
    ['agid-synthetic-cover', 'agid-be-synthetic-cover'],
    ['address-point-synthetic', 'address-point-be-synthetic'],
    ['premise-synthetic', 'address-unit-be-synthetic'],
    ['building-synthetic', 'building-be-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'BE';
    if (node.id === 'postal-be-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic bpost postal-canton polygon';
    } else if (node.id === 'country-be') {
      node.label = 'Belgium';
    } else if (node.id === 'region-be-synthetic') {
      node.label = 'Synthetic Region';
    } else if (node.id === 'municipality-be-synthetic') {
      node.label = 'Synthetic Municipality';
    } else if (node.id === 'agid-be-synthetic-cover') {
      node.agidCellId = 'BE0000000000';
      node.label = 'Synthetic Belgium AGID cover';
    } else if (node.id === 'address-unit-be-synthetic') {
      node.label = 'Voorbeeldstraat / Rue Exemple 1 bus / boîte 2';
    } else if (node.id === 'building-be-synthetic') {
      node.label = 'Synthetic regional building linked by authoritative identifier';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `be-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = belgiumSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-be-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-be-synthetic',
    countryCode: 'BE',
    releaseId: 'be-synthetic-2026.01.1',
    policyVersion: 'belgium-bpost-best-regional-buildings-v0.1',
  };

  pack.geometry.countryCode = 'BE';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `be-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = belgiumSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [4.330, 50.835],
          [4.375, 50.835],
          [4.375, 50.858],
          [4.330, 50.858],
          [4.330, 50.835],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'be-synthetic-bpost-postal-canton',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 5 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          BELGIUM_POSTAL_CONTEXT_TEST_POINT.longitude,
          BELGIUM_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [4.35270, 50.84654],
          [4.35290, 50.84654],
          [4.35290, 50.84666],
          [4.35270, 50.84666],
          [4.35270, 50.84654],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
