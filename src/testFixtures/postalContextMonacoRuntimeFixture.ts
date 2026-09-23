import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const MONACO_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 43.7384,
  longitude: 7.4246,
} as const;

export const MONACO_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function monacoSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'mc-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'mc-'),
  };
}

export function createMonacoPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-mc-syn-98000'],
    ['country-jp', 'country-mc'],
    ['prefecture-synthetic', 'quartier-mc-synthetic'],
    ['locality-synthetic', 'locality-mc-synthetic'],
    ['agid-synthetic-cover', 'agid-mc-synthetic-cover'],
    ['address-point-synthetic', 'dpum-address-mc-synthetic'],
    ['premise-synthetic', 'premise-mc-synthetic'],
    ['building-synthetic', 'dpum-building-mc-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'MC';
    if (node.id === 'postal-mc-syn-98000') {
      node.postalCode = '98000';
      node.label = 'Synthetic Monaco ordinary routing assignment';
    } else if (node.id === 'country-mc') {
      node.label = 'Monaco';
    } else if (node.id === 'quartier-mc-synthetic') {
      node.label = 'Synthetic Quartier';
    } else if (node.id === 'locality-mc-synthetic') {
      node.label = 'Synthetic Monaco Locality';
    } else if (node.id === 'agid-mc-synthetic-cover') {
      node.agidCellId = 'MC0000000000';
      node.label = 'Synthetic Monaco AGID cover';
    } else if (node.id === 'premise-mc-synthetic') {
      node.label = '1 Voie du Test';
    } else if (node.id === 'dpum-building-mc-synthetic') {
      node.label = 'Synthetic explicitly linked DPUM building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `mc-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = monacoSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-mc-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-mc-synthetic',
    countryCode: 'MC',
    releaseId: 'mc-synthetic-2026.01.1',
    policyVersion: 'monaco-routing-dpum-v0.1',
  };

  pack.geometry.countryCode = 'MC';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `mc-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = monacoSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [7.410, 43.725],
          [7.440, 43.725],
          [7.440, 43.750],
          [7.410, 43.750],
          [7.410, 43.725],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'mc-synthetic-derived-routing-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          MONACO_POSTAL_CONTEXT_TEST_POINT.longitude,
          MONACO_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [7.42452, 43.73834],
          [7.42468, 43.73834],
          [7.42468, 43.73846],
          [7.42452, 43.73846],
          [7.42452, 43.73834],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
