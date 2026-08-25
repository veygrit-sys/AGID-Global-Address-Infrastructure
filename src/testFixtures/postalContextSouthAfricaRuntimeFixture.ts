import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const SOUTH_AFRICA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: -25.7461,
  longitude: 28.1881,
} as const;

export const SOUTH_AFRICA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function southAfricaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'za-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'za-'),
  };
}

export function createSouthAfricaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-za-syn-0000'],
    ['country-jp', 'country-za'],
    ['prefecture-synthetic', 'province-za-synthetic'],
    ['locality-synthetic', 'delivery-locality-za-synthetic'],
    ['agid-synthetic-cover', 'agid-za-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-za-synthetic'],
    ['premise-synthetic', 'civic-address-za-synthetic'],
    ['building-synthetic', 'building-za-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'ZA';
    if (node.id === 'postal-za-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic South Africa postal-delivery office code';
      node.featureKind = 'po_box';
      node.geometryType = 'point';
    } else if (node.id === 'country-za') {
      node.label = 'South Africa';
    } else if (node.id === 'province-za-synthetic') {
      node.label = 'Synthetic Province';
    } else if (node.id === 'delivery-locality-za-synthetic') {
      node.label = 'SYNTHETIC LOCALITY';
    } else if (node.id === 'agid-za-synthetic-cover') {
      node.agidCellId = 'ZA0000000000';
      node.label = 'Synthetic South Africa AGID cover';
    } else if (node.id === 'civic-address-za-synthetic') {
      node.label = '1 Synthetic Street';
    } else if (node.id === 'building-za-synthetic') {
      node.label = 'Synthetic explicitly linked South Africa building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `za-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = southAfricaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-za-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-za-synthetic',
    countryCode: 'ZA',
    releaseId: 'za-synthetic-2026.01.1',
    policyVersion: 'south-africa-delivery-type-building-v0.1',
  };

  pack.geometry.countryCode = 'ZA';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `za-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = southAfricaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Point', coordinates: [28.1868, -25.7448] };
      feature.source = {
        ...feature.source,
        sourceId: 'za-synthetic-post-office-point',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 5 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          SOUTH_AFRICA_POSTAL_CONTEXT_TEST_POINT.longitude,
          SOUTH_AFRICA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [28.18802, -25.74616],
          [28.18818, -25.74616],
          [28.18818, -25.74604],
          [28.18802, -25.74604],
          [28.18802, -25.74616],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
