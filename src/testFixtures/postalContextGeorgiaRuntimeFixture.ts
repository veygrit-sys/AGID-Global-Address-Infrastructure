import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const GEORGIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 41.7151,
  longitude: 44.8271,
} as const;

export const GEORGIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-01T00:00:00.000Z';

function georgiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'ge-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ge-'),
  };
}

export function createGeorgiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ge-syn-0000'],
    ['country-jp', 'country-ge'],
    ['prefecture-synthetic', 'region-ge-synthetic'],
    ['locality-synthetic', 'settlement-ge-synthetic'],
    ['agid-synthetic-cover', 'agid-ge-synthetic-cover'],
    ['address-point-synthetic', 'napr-address-ge-synthetic'],
    ['premise-synthetic', 'premise-ge-synthetic'],
    ['building-synthetic', 'nsdi-building-ge-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'GE';
    if (node.id === 'postal-ge-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic Georgian Post address-membership surface';
    } else if (node.id === 'country-ge') {
      node.label = 'Georgia';
    } else if (node.id === 'region-ge-synthetic') {
      node.label = 'Synthetic Region';
    } else if (node.id === 'settlement-ge-synthetic') {
      node.label = 'Synthetic Settlement';
    } else if (node.id === 'agid-ge-synthetic-cover') {
      node.agidCellId = 'GE0000000000';
      node.label = 'Synthetic Georgia AGID cover';
    } else if (node.id === 'premise-ge-synthetic') {
      node.label = 'საცდელი ქუჩა 1';
    } else if (node.id === 'nsdi-building-ge-synthetic') {
      node.label = 'Synthetic explicitly linked NSDI registered building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `ge-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = georgiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ge-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ge-synthetic',
    countryCode: 'GE',
    releaseId: 'ge-synthetic-2026.01.1',
    policyVersion: 'georgian-post-napr-nsdi-v0.1',
  };

  pack.geometry.countryCode = 'GE';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `ge-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = georgiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [44.8171, 41.7051],
          [44.8371, 41.7051],
          [44.8371, 41.7251],
          [44.8171, 41.7251],
          [44.8171, 41.7051],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ge-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 200 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          GEORGIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          GEORGIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [44.82706, 41.71506],
          [44.82714, 41.71506],
          [44.82714, 41.71514],
          [44.82706, 41.71514],
          [44.82706, 41.71506],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
