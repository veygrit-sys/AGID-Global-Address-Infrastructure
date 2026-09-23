import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const AUSTRALIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: -33.8688,
  longitude: 151.2093,
} as const;

export const AUSTRALIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function australiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'au-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'au-'),
  };
}

export function createAustraliaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-au-syn-0000'],
    ['country-jp', 'country-au'],
    ['prefecture-synthetic', 'state-au-synthetic'],
    ['locality-synthetic', 'locality-au-synthetic'],
    ['agid-synthetic-cover', 'agid-au-synthetic-cover'],
    ['address-point-synthetic', 'gnaf-address-au-synthetic'],
    ['premise-synthetic', 'premise-au-synthetic'],
    ['building-synthetic', 'geoscape-building-au-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'AU';
    if (node.id === 'postal-au-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic Australia Post delivery area';
    } else if (node.id === 'country-au') {
      node.label = 'Australia';
    } else if (node.id === 'state-au-synthetic') {
      node.label = 'Synthetic State';
    } else if (node.id === 'locality-au-synthetic') {
      node.label = 'Synthetic Locality';
    } else if (node.id === 'agid-au-synthetic-cover') {
      node.agidCellId = 'AU0000000000';
      node.label = 'Synthetic Australia AGID cover';
    } else if (node.id === 'premise-au-synthetic') {
      node.label = '1 Synthetic Street';
    } else if (node.id === 'geoscape-building-au-synthetic') {
      node.label = 'Synthetic explicitly linked Geoscape building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `au-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = australiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-au-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-au-synthetic',
    countryCode: 'AU',
    releaseId: 'au-synthetic-2026.01.1',
    policyVersion: 'australia-post-gnaf-v0.1',
  };

  pack.geometry.countryCode = 'AU';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `au-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = australiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [151.1993, -33.8788],
          [151.2193, -33.8788],
          [151.2193, -33.8588],
          [151.1993, -33.8588],
          [151.1993, -33.8788],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'au-synthetic-derived-delivery-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          AUSTRALIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          AUSTRALIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [151.20928, -33.86882],
          [151.20932, -33.86882],
          [151.20932, -33.86878],
          [151.20928, -33.86878],
          [151.20928, -33.86882],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
