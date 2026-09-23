import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ALBANIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 41.3275,
  longitude: 19.8187,
} as const;

export const ALBANIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function albaniaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'al-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'al-'),
  };
}

export function createAlbaniaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-al-syn-0000'],
    ['country-jp', 'country-al'],
    ['prefecture-synthetic', 'county-al-synthetic'],
    ['locality-synthetic', 'locality-al-synthetic'],
    ['agid-synthetic-cover', 'agid-al-synthetic-cover'],
    ['address-point-synthetic', 'address-system-al-synthetic'],
    ['premise-synthetic', 'premise-al-synthetic'],
    ['building-synthetic', 'ashk-building-al-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'AL';
    if (node.id === 'postal-al-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic Posta Shqiptare address-membership surface';
    } else if (node.id === 'country-al') {
      node.label = 'Albania';
    } else if (node.id === 'county-al-synthetic') {
      node.label = 'Synthetic County';
    } else if (node.id === 'locality-al-synthetic') {
      node.label = 'Synthetic Locality';
    } else if (node.id === 'agid-al-synthetic-cover') {
      node.agidCellId = 'AL0000000000';
      node.label = 'Synthetic Albania AGID cover';
    } else if (node.id === 'premise-al-synthetic') {
      node.label = 'Rruga e Provës 1';
    } else if (node.id === 'ashk-building-al-synthetic') {
      node.label = 'Synthetic explicitly linked ASHK cadastral building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `al-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = albaniaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-al-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-al-synthetic',
    countryCode: 'AL',
    releaseId: 'al-synthetic-2026.01.1',
    policyVersion: 'posta-shqiptare-address-system-ashk-v0.1',
  };

  pack.geometry.countryCode = 'AL';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `al-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = albaniaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [19.8087, 41.3175],
          [19.8287, 41.3175],
          [19.8287, 41.3375],
          [19.8087, 41.3375],
          [19.8087, 41.3175],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'al-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 150 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          ALBANIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          ALBANIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [19.81866, 41.32746],
          [19.81874, 41.32746],
          [19.81874, 41.32754],
          [19.81866, 41.32754],
          [19.81866, 41.32746],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
