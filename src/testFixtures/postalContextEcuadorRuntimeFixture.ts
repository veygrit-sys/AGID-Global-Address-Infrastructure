import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ECUADOR_POSTAL_CONTEXT_TEST_POINT = { latitude: -1.5000, longitude: -78.5000 } as const;
export const ECUADOR_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function ecuadorSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'ec-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ec-'),
  };
}

export function createEcuadorPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ec-syn-999999'],
    ['country-jp', 'country-ec'],
    ['prefecture-synthetic', 'province-ec-synthetic'],
    ['locality-synthetic', 'locality-ec-synthetic'],
    ['agid-synthetic-cover', 'agid-ec-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-ec-synthetic'],
    ['premise-synthetic', 'civic-address-ec-synthetic'],
    ['building-synthetic', 'building-ec-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'EC';
    if (node.id === 'postal-ec-syn-999999') {
      node.postalCode = '999999';
      node.label = 'Synthetic Ecuador postal object 999999';
    } else if (node.id === 'country-ec') {
      node.label = 'Ecuador';
    } else if (node.id === 'province-ec-synthetic') {
      node.label = 'Synthetic Ecuador province context';
    } else if (node.id === 'locality-ec-synthetic') {
      node.label = 'Synthetic Ecuador locality context';
    } else if (node.id === 'agid-ec-synthetic-cover') {
      node.agidCellId = 'EC0000000000';
      node.label = 'Synthetic Ecuador AGID cover';
    } else if (node.id === 'civic-address-ec-synthetic') {
      node.label = 'Synthetic rights-cleared Ecuador civic address EC-SYN-CIVIC-999';
    } else if (node.id === 'building-ec-synthetic') {
      node.label = 'Synthetic explicitly address-linked Ecuador building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `ec-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = ecuadorSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ec-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ec-synthetic',
    countryCode: 'EC',
    releaseId: 'ec-synthetic-2026.01.1',
    policyVersion: 'ecuador-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'EC';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `ec-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = ecuadorSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-78.515, -1.510], [-78.485, -1.510], [-78.485, -1.490],
          [-78.515, -1.490], [-78.515, -1.510],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ec-synthetic-lookup-like-validation-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [ECUADOR_POSTAL_CONTEXT_TEST_POINT.longitude, ECUADOR_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-78.50008, -1.50006], [-78.49992, -1.50006], [-78.49992, -1.49994],
          [-78.50008, -1.49994], [-78.50008, -1.50006],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
