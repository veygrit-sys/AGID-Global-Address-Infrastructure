import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const BAHRAIN_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 26.2235,
  longitude: 50.5876,
} as const;

export const BAHRAIN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function bahrainSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'bh-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'bh-'),
  };
}

export function createBahrainPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-bh-syn-100'],
    ['country-jp', 'country-bh'],
    ['prefecture-synthetic', 'governorate-bh-synthetic'],
    ['locality-synthetic', 'block-bh-synthetic'],
    ['agid-synthetic-cover', 'agid-bh-synthetic-cover'],
    ['address-point-synthetic', 'iga-address-point-bh-synthetic'],
    ['premise-synthetic', 'civic-address-bh-synthetic'],
    ['building-synthetic', 'building-bh-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'BH';
    if (node.id === 'postal-bh-syn-100') {
      node.postalCode = '100';
      node.label = 'Synthetic Bahrain postcode and block 100 relation';
    } else if (node.id === 'country-bh') {
      node.label = 'Bahrain';
    } else if (node.id === 'governorate-bh-synthetic') {
      node.label = 'Synthetic Bahrain Governorate';
    } else if (node.id === 'block-bh-synthetic') {
      node.label = 'Synthetic Bahrain Block 100';
    } else if (node.id === 'agid-bh-synthetic-cover') {
      node.agidCellId = 'BH0000000000';
      node.label = 'Synthetic Bahrain AGID cover';
    } else if (node.id === 'civic-address-bh-synthetic') {
      node.label = 'Synthetic Building 100, Road 1000, Block 100, iGA certificate BH-SYN-100';
    } else if (node.id === 'building-bh-synthetic') {
      node.label = 'Synthetic explicitly linked Bahrain building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'bh-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = bahrainSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-bh-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-bh-synthetic',
    countryCode: 'BH',
    releaseId: 'bh-synthetic-2026.01.1',
    policyVersion: 'bahrain-postcode-block-v0.1',
  };

  pack.geometry.countryCode = 'BH';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'bh-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = bahrainSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [50.576, 26.215],
          [50.599, 26.215],
          [50.599, 26.234],
          [50.576, 26.234],
          [50.576, 26.215],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'bh-synthetic-derived-block-postal-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 200 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [BAHRAIN_POSTAL_CONTEXT_TEST_POINT.longitude, BAHRAIN_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [50.58752, 26.22344],
          [50.58768, 26.22344],
          [50.58768, 26.22356],
          [50.58752, 26.22356],
          [50.58752, 26.22344],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
