import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const AZERBAIJAN_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 40.4093,
  longitude: 49.8671,
} as const;

export const AZERBAIJAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function azerbaijanSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'az-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'az-'),
  };
}

export function createAzerbaijanPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-az-syn-0000'],
    ['country-jp', 'country-az'],
    ['prefecture-synthetic', 'region-az-synthetic'],
    ['locality-synthetic', 'locality-az-synthetic'],
    ['agid-synthetic-cover', 'agid-az-synthetic-cover'],
    ['address-point-synthetic', 'uris-address-az-synthetic'],
    ['premise-synthetic', 'premise-az-synthetic'],
    ['building-synthetic', 'cadastre-building-az-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'AZ';
    if (node.id === 'postal-az-syn-0000') {
      node.postalCode = 'AZ0000';
      node.label = 'Synthetic Azərpoçt address-membership surface';
    } else if (node.id === 'country-az') {
      node.label = 'Azerbaijan';
    } else if (node.id === 'region-az-synthetic') {
      node.label = 'Synthetic Region';
    } else if (node.id === 'locality-az-synthetic') {
      node.label = 'Synthetic Locality';
    } else if (node.id === 'agid-az-synthetic-cover') {
      node.agidCellId = 'AZ0000000000';
      node.label = 'Synthetic Azerbaijan AGID cover';
    } else if (node.id === 'premise-az-synthetic') {
      node.label = 'Sınaq küçəsi 1';
    } else if (node.id === 'cadastre-building-az-synthetic') {
      node.label = 'Synthetic explicitly linked URIS cadastral building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `az-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = azerbaijanSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-az-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-az-synthetic',
    countryCode: 'AZ',
    releaseId: 'az-synthetic-2026.01.1',
    policyVersion: 'azerpost-uris-cadastre-v0.1',
  };

  pack.geometry.countryCode = 'AZ';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `az-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = azerbaijanSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [49.8571, 40.3993],
          [49.8771, 40.3993],
          [49.8771, 40.4193],
          [49.8571, 40.4193],
          [49.8571, 40.3993],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'az-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 150 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          AZERBAIJAN_POSTAL_CONTEXT_TEST_POINT.longitude,
          AZERBAIJAN_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [49.86706, 40.40926],
          [49.86714, 40.40926],
          [49.86714, 40.40934],
          [49.86706, 40.40934],
          [49.86706, 40.40926],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
