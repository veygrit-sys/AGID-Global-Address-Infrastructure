import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ESTONIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 59.437,
  longitude: 24.7536,
} as const;

export const ESTONIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function estoniaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'ee-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ee-'),
  };
}

export function createEstoniaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ee-syn-00000'],
    ['country-jp', 'country-ee'],
    ['prefecture-synthetic', 'county-ee-synthetic'],
    ['locality-synthetic', 'settlement-ee-synthetic'],
    ['agid-synthetic-cover', 'agid-ee-synthetic-cover'],
    ['address-point-synthetic', 'ads-address-ee-synthetic'],
    ['premise-synthetic', 'ads-building-address-ee-synthetic'],
    ['building-synthetic', 'ads-building-ee-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'EE';
    if (node.id === 'postal-ee-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Estonia postal-code area';
    } else if (node.id === 'country-ee') {
      node.label = 'Estonia';
    } else if (node.id === 'county-ee-synthetic') {
      node.label = 'Synthetic County';
    } else if (node.id === 'settlement-ee-synthetic') {
      node.label = 'Synthetic Settlement';
    } else if (node.id === 'agid-ee-synthetic-cover') {
      node.agidCellId = 'EE0000000000';
      node.label = 'Synthetic Estonia AGID cover';
    } else if (node.id === 'ads-building-address-ee-synthetic') {
      node.label = 'Synthetic Street 1';
    } else if (node.id === 'ads-building-ee-synthetic') {
      node.label = 'Synthetic ADS Building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `ee-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = estoniaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ee-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ee-synthetic',
    countryCode: 'EE',
    releaseId: 'ee-synthetic-2026.01.1',
    policyVersion: 'estonia-aks-postal-area-v0.1',
  };

  pack.geometry.countryCode = 'EE';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `ee-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = estoniaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [24.73, 59.42],
          [24.78, 59.42],
          [24.78, 59.45],
          [24.73, 59.45],
          [24.73, 59.42],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ee-synthetic-aks-postal-area',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 10 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          ESTONIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          ESTONIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [24.75352, 59.43694],
          [24.75368, 59.43694],
          [24.75368, 59.43706],
          [24.75352, 59.43706],
          [24.75352, 59.43694],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
