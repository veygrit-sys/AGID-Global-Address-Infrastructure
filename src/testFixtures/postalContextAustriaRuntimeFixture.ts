import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const AUSTRIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 48.2082,
  longitude: 16.3738,
} as const;

export const AUSTRIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-07-01T00:00:00.000Z';

function austriaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'at-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'at-'),
  };
}

export function createAustriaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-at-syn-0000'],
    ['country-jp', 'country-at'],
    ['prefecture-synthetic', 'federal-state-at-synthetic'],
    ['locality-synthetic', 'locality-at-synthetic'],
    ['agid-synthetic-cover', 'agid-at-synthetic-cover'],
    ['address-point-synthetic', 'address-at-synthetic'],
    ['premise-synthetic', 'premise-at-synthetic'],
    ['building-synthetic', 'building-at-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'AT';
    if (node.id === 'postal-at-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic Austria address-membership surface';
    } else if (node.id === 'country-at') {
      node.label = 'Austria';
    } else if (node.id === 'federal-state-at-synthetic') {
      node.label = 'Synthetic Bundesland';
    } else if (node.id === 'locality-at-synthetic') {
      node.label = 'Synthetic Ortschaft';
    } else if (node.id === 'agid-at-synthetic-cover') {
      node.agidCellId = 'AT0000000000';
      node.label = 'Synthetic Austria AGID cover';
    } else if (node.id === 'premise-at-synthetic') {
      node.label = 'Testgasse 1';
    } else if (node.id === 'building-at-synthetic') {
      node.label = 'Synthetic explicitly linked BEV address-register building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `at-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = austriaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-at-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-at-synthetic',
    countryCode: 'AT',
    releaseId: 'at-synthetic-2026.01.1',
    policyVersion: 'post-bev-statistik-austria-v0.1',
  };

  pack.geometry.countryCode = 'AT';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `at-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = austriaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [16.3638, 48.1982],
          [16.3838, 48.1982],
          [16.3838, 48.2182],
          [16.3638, 48.2182],
          [16.3638, 48.1982],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'at-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 200 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          AUSTRIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          AUSTRIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [16.37376, 48.20816],
          [16.37384, 48.20816],
          [16.37384, 48.20824],
          [16.37376, 48.20824],
          [16.37376, 48.20816],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
