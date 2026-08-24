import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const SLOVENIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 46.0569,
  longitude: 14.5058,
} as const;

export const SLOVENIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function sloveniaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'si-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'si-'),
  };
}

export function createSloveniaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-si-syn-0000'],
    ['country-jp', 'country-si'],
    ['prefecture-synthetic', 'statistical-region-si-synthetic'],
    ['locality-synthetic', 'settlement-si-synthetic'],
    ['agid-synthetic-cover', 'agid-si-synthetic-cover'],
    ['address-point-synthetic', 'gurs-address-centroid-si-synthetic'],
    ['premise-synthetic', 'gurs-address-si-synthetic'],
    ['building-synthetic', 'gurs-building-si-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'SI';
    if (node.id === 'postal-si-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic Slovenian postal assignment';
    } else if (node.id === 'country-si') {
      node.label = 'Slovenia';
    } else if (node.id === 'statistical-region-si-synthetic') {
      node.label = 'Synthetic Statistical Region';
    } else if (node.id === 'settlement-si-synthetic') {
      node.label = 'Preizkusno naselje';
    } else if (node.id === 'agid-si-synthetic-cover') {
      node.agidCellId = 'SI0000000000';
      node.label = 'Synthetic Slovenia AGID cover';
    } else if (node.id === 'gurs-address-si-synthetic') {
      node.label = 'Preizkusna ulica 1A';
    } else if (node.id === 'gurs-building-si-synthetic') {
      node.label = 'Synthetic explicitly linked GURS cadastral building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `si-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = sloveniaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-si-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-si-synthetic',
    countryCode: 'SI',
    releaseId: 'si-synthetic-2026.01.1',
    policyVersion: 'slovenia-posta-gurs-postal-district-address-v0.1',
  };

  pack.geometry.countryCode = 'SI';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `si-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = sloveniaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [14.493, 46.048],
          [14.519, 46.048],
          [14.519, 46.066],
          [14.493, 46.066],
          [14.493, 46.048],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'si-synthetic-crosswalk-qualified-postal-district',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          SLOVENIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          SLOVENIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [14.50572, 46.05684],
          [14.50588, 46.05684],
          [14.50588, 46.05696],
          [14.50572, 46.05696],
          [14.50572, 46.05684],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
