import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ANDORRA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 42.5063,
  longitude: 1.5218,
} as const;

export const ANDORRA_POSTAL_CONTEXT_TEST_INSTANT = '2026-07-01T00:00:00.000Z';

function andorraSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'ad-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ad-'),
  };
}

export function createAndorraPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ad-syn-ad000'],
    ['country-jp', 'country-ad'],
    ['prefecture-synthetic', 'parish-ad-synthetic'],
    ['locality-synthetic', 'settlement-ad-synthetic'],
    ['agid-synthetic-cover', 'agid-ad-synthetic-cover'],
    ['address-point-synthetic', 'urban-address-ad-synthetic'],
    ['premise-synthetic', 'premise-ad-synthetic'],
    ['building-synthetic', 'topographic-building-ad-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'AD';
    if (node.id === 'postal-ad-syn-ad000') {
      node.postalCode = 'AD000';
      node.label = 'Synthetic Andorra address-membership surface';
    } else if (node.id === 'country-ad') {
      node.label = 'Andorra';
    } else if (node.id === 'parish-ad-synthetic') {
      node.label = 'Synthetic Parish';
    } else if (node.id === 'settlement-ad-synthetic') {
      node.label = 'Synthetic Settlement';
    } else if (node.id === 'agid-ad-synthetic-cover') {
      node.agidCellId = 'AD0000000000';
      node.label = 'Synthetic Andorra AGID cover';
    } else if (node.id === 'premise-ad-synthetic') {
      node.label = 'Carrer de Prova 1';
    } else if (node.id === 'topographic-building-ad-synthetic') {
      node.label = 'Synthetic explicitly linked IDE Andorra topographic building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `ad-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = andorraSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ad-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ad-synthetic',
    countryCode: 'AD',
    releaseId: 'ad-synthetic-2026.01.1',
    policyVersion: 'correos-upu-ide-andorra-v0.1',
  };

  pack.geometry.countryCode = 'AD';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `ad-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = andorraSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [1.5118, 42.4963],
          [1.5318, 42.4963],
          [1.5318, 42.5163],
          [1.5118, 42.5163],
          [1.5118, 42.4963],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ad-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 150 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          ANDORRA_POSTAL_CONTEXT_TEST_POINT.longitude,
          ANDORRA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [1.52176, 42.50626],
          [1.52184, 42.50626],
          [1.52184, 42.50634],
          [1.52176, 42.50634],
          [1.52176, 42.50626],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
