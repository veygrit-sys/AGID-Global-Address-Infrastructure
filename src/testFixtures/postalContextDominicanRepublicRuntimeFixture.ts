import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createChilePostalContextRuntimeTestPack } from './postalContextChileRuntimeFixture';

export const DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 18.4800,
  longitude: -69.9100,
} as const;
export const DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function dominicanRepublicSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^cl-/, 'do-'),
    sourceVersion: source.sourceVersion?.replace(/^cl-/, 'do-'),
  };
}

export function createDominicanRepublicPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createChilePostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-cl-syn-9999999', 'postal-do-syn-99999'],
    ['country-cl', 'country-do'],
    ['region-cl-synthetic', 'province-do-synthetic'],
    ['commune-cl-synthetic', 'sector-do-synthetic'],
    ['agid-cl-synthetic-cover', 'agid-do-synthetic-cover'],
    ['civic-address-point-cl-synthetic', 'civic-address-point-do-synthetic'],
    ['civic-address-cl-synthetic', 'civic-address-do-synthetic'],
    ['building-cl-synthetic', 'building-do-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'DO';
    if (node.id === 'postal-do-syn-99999') {
      node.postalCode = '99999';
      node.label = 'Synthetic Dominican postal-area object 99999';
    } else if (node.id === 'country-do') {
      node.label = 'Dominican Republic';
    } else if (node.id === 'province-do-synthetic') {
      node.label = 'Synthetic Dominican province context';
    } else if (node.id === 'sector-do-synthetic') {
      node.label = 'Synthetic Dominican sector context';
    } else if (node.id === 'agid-do-synthetic-cover') {
      node.agidCellId = 'DO0000000000';
      node.label = 'Synthetic Dominican AGID cover';
    } else if (node.id === 'civic-address-do-synthetic') {
      node.label = 'Synthetic rights-cleared Dominican civic address DO-SYN-CIVIC-999';
    } else if (node.id === 'building-do-synthetic') {
      node.label = 'Synthetic explicitly address-linked Dominican building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `do-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = dominicanRepublicSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-do-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-do-synthetic',
    countryCode: 'DO',
    releaseId: 'do-synthetic-2026.01.1',
    policyVersion: 'dominican-republic-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'DO';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `do-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = dominicanRepublicSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-69.925, 18.470], [-69.895, 18.470], [-69.895, 18.490],
          [-69.925, 18.490], [-69.925, 18.470],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'do-synthetic-derived-postal-area-review-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_POINT.longitude,
          DOMINICAN_REPUBLIC_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-69.91008, 18.47994], [-69.90992, 18.47994], [-69.90992, 18.48006],
          [-69.91008, 18.48006], [-69.91008, 18.47994],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
