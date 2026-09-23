import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ITALY_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 41.9028,
  longitude: 12.4964,
} as const;

export const ITALY_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function italySource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'it-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'it-'),
  };
}

export function createItalyPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-it-syn-00000'],
    ['country-jp', 'country-it'],
    ['prefecture-synthetic', 'region-it-synthetic'],
    ['locality-synthetic', 'municipality-it-synthetic'],
    ['agid-synthetic-cover', 'agid-it-synthetic-cover'],
    ['address-point-synthetic', 'anncsu-address-it-synthetic'],
    ['premise-synthetic', 'civic-it-synthetic'],
    ['building-synthetic', 'building-it-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'IT';
    if (node.id === 'postal-it-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Italian CAP assignment';
    } else if (node.id === 'country-it') {
      node.label = 'Italy';
    } else if (node.id === 'region-it-synthetic') {
      node.label = 'Synthetic Region';
    } else if (node.id === 'municipality-it-synthetic') {
      node.label = 'Synthetic Comune';
    } else if (node.id === 'agid-it-synthetic-cover') {
      node.agidCellId = 'IT0000000000';
      node.label = 'Synthetic Italy AGID cover';
    } else if (node.id === 'civic-it-synthetic') {
      node.label = 'Via Sintetica 1';
    } else if (node.id === 'building-it-synthetic') {
      node.label = 'Edificio Sintetico';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `it-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = italySource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-it-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-it-synthetic',
    countryCode: 'IT',
    releaseId: 'it-synthetic-2026.01.1',
    policyVersion: 'italy-cap-routing-v0.1',
  };

  pack.geometry.countryCode = 'IT';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `it-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = italySource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [12.48, 41.89],
          [12.51, 41.89],
          [12.51, 41.92],
          [12.48, 41.92],
          [12.48, 41.89],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'it-synthetic-derived-cap-area',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          ITALY_POSTAL_CONTEXT_TEST_POINT.longitude,
          ITALY_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [12.49635, 41.90275],
          [12.49645, 41.90275],
          [12.49645, 41.90285],
          [12.49635, 41.90285],
          [12.49635, 41.90275],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
