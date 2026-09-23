import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const INDONESIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: -6.1754,
  longitude: 106.8272,
} as const;

export const INDONESIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function indonesiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'id-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'id-'),
  };
}

export function createIndonesiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-id-syn-10000'],
    ['country-jp', 'country-id'],
    ['prefecture-synthetic', 'province-id-synthetic'],
    ['locality-synthetic', 'village-id-synthetic'],
    ['agid-synthetic-cover', 'agid-id-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-id-synthetic'],
    ['premise-synthetic', 'civic-address-id-synthetic'],
    ['building-synthetic', 'building-id-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'ID';
    if (node.id === 'postal-id-syn-10000') {
      node.postalCode = '10000';
      node.label = 'Synthetic Indonesia current postcode locality assignment';
    } else if (node.id === 'country-id') {
      node.label = 'Indonesia';
    } else if (node.id === 'province-id-synthetic') {
      node.label = 'Provinsi Sintetis';
    } else if (node.id === 'village-id-synthetic') {
      node.label = 'Kelurahan Sintetis';
    } else if (node.id === 'agid-id-synthetic-cover') {
      node.agidCellId = 'ID0000000000';
      node.label = 'Synthetic Indonesia AGID cover';
    } else if (node.id === 'civic-address-id-synthetic') {
      node.label = 'Jl. Sintetis No. 1 RT 00/000';
    } else if (node.id === 'building-id-synthetic') {
      node.label = 'Synthetic explicitly linked Indonesia building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `id-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = indonesiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-id-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-id-synthetic',
    countryCode: 'ID',
    releaseId: 'id-synthetic-2026.01.1',
    policyVersion: 'indonesia-current-five-digit-locality-v0.1',
  };

  pack.geometry.countryCode = 'ID';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `id-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = indonesiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [106.816, -6.186],
          [106.838, -6.186],
          [106.838, -6.165],
          [106.816, -6.165],
          [106.816, -6.186],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'id-synthetic-derived-locality-postal-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 300 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [INDONESIA_POSTAL_CONTEXT_TEST_POINT.longitude, INDONESIA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [106.82712, -6.17546],
          [106.82728, -6.17546],
          [106.82728, -6.17534],
          [106.82712, -6.17534],
          [106.82712, -6.17546],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
