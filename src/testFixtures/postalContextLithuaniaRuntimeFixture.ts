import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const LITHUANIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 54.6872,
  longitude: 25.2797,
} as const;

export const LITHUANIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function lithuaniaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'lt-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'lt-'),
  };
}

export function createLithuaniaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-lt-syn-00000'],
    ['country-jp', 'country-lt'],
    ['prefecture-synthetic', 'municipality-lt-synthetic'],
    ['locality-synthetic', 'locality-lt-synthetic'],
    ['agid-synthetic-cover', 'agid-lt-synthetic-cover'],
    ['address-point-synthetic', 'rc-address-lt-synthetic'],
    ['premise-synthetic', 'premise-lt-synthetic'],
    ['building-synthetic', 'rc-ntr-building-lt-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'LT';
    if (node.id === 'postal-lt-syn-00000') {
      node.postalCode = 'LT-00000';
      node.label = 'Synthetic Lietuvos paštas address membership';
    } else if (node.id === 'country-lt') {
      node.label = 'Lithuania';
    } else if (node.id === 'municipality-lt-synthetic') {
      node.label = 'Synthetic Municipality';
    } else if (node.id === 'locality-lt-synthetic') {
      node.label = 'Synthetic Settlement';
    } else if (node.id === 'agid-lt-synthetic-cover') {
      node.agidCellId = 'LT0000000000';
      node.label = 'Synthetic Lithuania AGID cover';
    } else if (node.id === 'premise-lt-synthetic') {
      node.label = 'Bandymo g. 1';
    } else if (node.id === 'rc-ntr-building-lt-synthetic') {
      node.label = 'Synthetic explicitly linked Registrų centras NTR building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `lt-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = lithuaniaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-lt-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-lt-synthetic',
    countryCode: 'LT',
    releaseId: 'lt-synthetic-2026.01.1',
    policyVersion: 'lietuvos-pastas-rc-v0.1',
  };

  pack.geometry.countryCode = 'LT';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `lt-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = lithuaniaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [25.2697, 54.6772],
          [25.2897, 54.6772],
          [25.2897, 54.6972],
          [25.2697, 54.6972],
          [25.2697, 54.6772],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'lt-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          LITHUANIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          LITHUANIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [25.27968, 54.68718],
          [25.27972, 54.68718],
          [25.27972, 54.68722],
          [25.27968, 54.68722],
          [25.27968, 54.68718],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
