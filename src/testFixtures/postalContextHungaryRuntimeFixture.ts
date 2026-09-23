import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const HUNGARY_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 47.4979,
  longitude: 19.0402,
} as const;

export const HUNGARY_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function hungarySource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'hu-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'hu-'),
  };
}

export function createHungaryPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-hu-syn-0000'],
    ['country-jp', 'country-hu'],
    ['prefecture-synthetic', 'county-hu-synthetic'],
    ['locality-synthetic', 'municipality-hu-synthetic'],
    ['agid-synthetic-cover', 'agid-hu-synthetic-cover'],
    ['address-point-synthetic', 'kcr-address-point-hu-synthetic'],
    ['premise-synthetic', 'kcr-unit-address-hu-synthetic'],
    ['building-synthetic', 'inspire-building-hu-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'HU';
    if (node.id === 'postal-hu-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic derived Hungarian postcode surface';
    } else if (node.id === 'country-hu') {
      node.label = 'Hungary';
    } else if (node.id === 'county-hu-synthetic') {
      node.label = 'Synthetic County';
    } else if (node.id === 'municipality-hu-synthetic') {
      node.label = 'Synthetic Municipality';
    } else if (node.id === 'agid-hu-synthetic-cover') {
      node.agidCellId = 'HU0000000000';
      node.label = 'Synthetic Hungary AGID cover';
    } else if (node.id === 'kcr-unit-address-hu-synthetic') {
      node.label = 'Minta tér 1 A épület, I lépcsőház, 1. emelet, 2. ajtó';
    } else if (node.id === 'inspire-building-hu-synthetic') {
      node.label = 'Synthetic rights-cleared building linked by KCR cadastral identifier';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `hu-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = hungarySource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-hu-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-hu-synthetic',
    countryCode: 'HU',
    releaseId: 'hu-synthetic-2026.01.1',
    policyVersion: 'hungary-posta-kcr-eha-building-v0.1',
  };

  pack.geometry.countryCode = 'HU';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `hu-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = hungarySource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [19.023, 47.486],
          [19.057, 47.486],
          [19.057, 47.510],
          [19.023, 47.510],
          [19.023, 47.486],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'hu-synthetic-derived-postcode-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 5 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          HUNGARY_POSTAL_CONTEXT_TEST_POINT.longitude,
          HUNGARY_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [19.04012, 47.49784],
          [19.04028, 47.49784],
          [19.04028, 47.49796],
          [19.04012, 47.49796],
          [19.04012, 47.49784],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
