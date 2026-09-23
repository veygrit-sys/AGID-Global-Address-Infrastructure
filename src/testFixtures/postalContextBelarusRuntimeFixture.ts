import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const BELARUS_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 53.9006,
  longitude: 27.5590,
} as const;

export const BELARUS_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function belarusSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'by-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'by-'),
  };
}

export function createBelarusPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-by-syn-000000'],
    ['country-jp', 'country-by'],
    ['prefecture-synthetic', 'oblast-by-synthetic'],
    ['locality-synthetic', 'settlement-by-synthetic'],
    ['agid-synthetic-cover', 'agid-by-synthetic-cover'],
    ['address-point-synthetic', 'address-geocode-by-synthetic'],
    ['premise-synthetic', 'isolated-premise-by-synthetic'],
    ['building-synthetic', 'capital-structure-by-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'BY';
    if (node.id === 'postal-by-syn-000000') {
      node.postalCode = '000000';
      node.label = 'Synthetic NCA-style official-derived postal code zone';
    } else if (node.id === 'country-by') {
      node.label = 'Belarus';
    } else if (node.id === 'oblast-by-synthetic') {
      node.label = 'Synthetic Oblast';
    } else if (node.id === 'settlement-by-synthetic') {
      node.label = 'Synthetic Settlement';
    } else if (node.id === 'agid-by-synthetic-cover') {
      node.agidCellId = 'BY0000000000';
      node.label = 'Synthetic Belarus AGID cover';
    } else if (node.id === 'isolated-premise-by-synthetic') {
      node.label = 'вул. Прыкладная, 1, корп. 1, кв. 2';
    } else if (node.id === 'capital-structure-by-synthetic') {
      node.label = 'Synthetic capital structure linked by authoritative real-estate identifier';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `by-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = belarusSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-by-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-by-synthetic',
    countryCode: 'BY',
    releaseId: 'by-synthetic-2026.01.1',
    policyVersion: 'belarus-belpost-nca-address-cadastre-soato-v0.1',
  };

  pack.geometry.countryCode = 'BY';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `by-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = belarusSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [27.540, 53.890],
          [27.578, 53.890],
          [27.578, 53.912],
          [27.540, 53.912],
          [27.540, 53.890],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'by-synthetic-nca-official-derived-postal-zone',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 5 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          BELARUS_POSTAL_CONTEXT_TEST_POINT.longitude,
          BELARUS_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [27.55890, 53.90054],
          [27.55910, 53.90054],
          [27.55910, 53.90066],
          [27.55890, 53.90066],
          [27.55890, 53.90054],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
