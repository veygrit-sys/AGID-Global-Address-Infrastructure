import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const FRANCE_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 48.85,
  longitude: 2.35,
} as const;

export const FRANCE_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function franceSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'fr-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'fr-'),
  };
}

export function createFrancePostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-fr-syn-00000'],
    ['country-jp', 'country-fr'],
    ['prefecture-synthetic', 'region-fr-synthetic'],
    ['locality-synthetic', 'commune-fr-synthetic'],
    ['agid-synthetic-cover', 'agid-fr-synthetic-cover'],
    ['address-point-synthetic', 'address-point-fr-synthetic'],
    ['premise-synthetic', 'premise-fr-synthetic'],
    ['building-synthetic', 'building-fr-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'FR';
    if (node.id === 'postal-fr-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic French postal-code derived area';
    } else if (node.id === 'country-fr') {
      node.label = 'France';
    } else if (node.id === 'region-fr-synthetic') {
      node.label = 'Région Synthétique';
    } else if (node.id === 'commune-fr-synthetic') {
      node.label = 'Commune Synthétique';
    } else if (node.id === 'agid-fr-synthetic-cover') {
      node.agidCellId = 'FR0000000000';
      node.label = 'Synthetic France AGID cover';
    } else if (node.id === 'premise-fr-synthetic') {
      node.label = '1 rue Synthétique';
    } else if (node.id === 'building-fr-synthetic') {
      node.label = 'Bâtiment Synthétique';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `fr-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = franceSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-fr-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-fr-synthetic',
    countryCode: 'FR',
    releaseId: 'fr-synthetic-2026.01.1',
    policyVersion: 'fr-postal-routing-locality-v0.1',
  };

  pack.geometry.countryCode = 'FR';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `fr-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = franceSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [2.34, 48.84],
          [2.36, 48.84],
          [2.36, 48.86],
          [2.34, 48.86],
          [2.34, 48.84],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'fr-synthetic-derived-postcode-area',
        assignmentAuthority: 'none',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          FRANCE_POSTAL_CONTEXT_TEST_POINT.longitude,
          FRANCE_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [2.34998, 48.84998],
          [2.35002, 48.84998],
          [2.35002, 48.85002],
          [2.34998, 48.85002],
          [2.34998, 48.84998],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
