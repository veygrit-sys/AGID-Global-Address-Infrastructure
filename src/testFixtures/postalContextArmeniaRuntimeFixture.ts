import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ARMENIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 40.1792,
  longitude: 44.4991,
} as const;

export const ARMENIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function armeniaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'am-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'am-'),
  };
}

export function createArmeniaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-am-syn-0000'],
    ['country-jp', 'country-am'],
    ['prefecture-synthetic', 'marz-am-synthetic'],
    ['locality-synthetic', 'settlement-am-synthetic'],
    ['agid-synthetic-cover', 'agid-am-synthetic-cover'],
    ['address-point-synthetic', 'cadastre-address-am-synthetic'],
    ['premise-synthetic', 'premise-am-synthetic'],
    ['building-synthetic', 'cadastre-building-am-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'AM';
    if (node.id === 'postal-am-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic HayPost address-membership surface';
    } else if (node.id === 'country-am') {
      node.label = 'Armenia';
    } else if (node.id === 'marz-am-synthetic') {
      node.label = 'Synthetic Marz';
    } else if (node.id === 'settlement-am-synthetic') {
      node.label = 'Synthetic Settlement';
    } else if (node.id === 'agid-am-synthetic-cover') {
      node.agidCellId = 'AM0000000000';
      node.label = 'Synthetic Armenia AGID cover';
    } else if (node.id === 'premise-am-synthetic') {
      node.label = 'Test Street 1';
    } else if (node.id === 'cadastre-building-am-synthetic') {
      node.label = 'Synthetic explicitly linked Cadastre Committee building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `am-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = armeniaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-am-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-am-synthetic',
    countryCode: 'AM',
    releaseId: 'am-synthetic-2026.01.1',
    policyVersion: 'haypost-cadastre-national-geoportal-v0.1',
  };

  pack.geometry.countryCode = 'AM';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `am-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = armeniaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [44.4891, 40.1692],
          [44.5091, 40.1692],
          [44.5091, 40.1892],
          [44.4891, 40.1892],
          [44.4891, 40.1692],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'am-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 150 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          ARMENIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          ARMENIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [44.49906, 40.17916],
          [44.49914, 40.17916],
          [44.49914, 40.17924],
          [44.49906, 40.17924],
          [44.49906, 40.17916],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
