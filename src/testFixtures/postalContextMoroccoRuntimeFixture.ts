import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const MOROCCO_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 34.02088,
  longitude: -6.84165,
} as const;

export const MOROCCO_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function moroccoSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'ma-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ma-'),
  };
}

export function createMoroccoPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ma-syn-00000'],
    ['country-jp', 'country-ma'],
    ['prefecture-synthetic', 'province-ma-synthetic'],
    ['locality-synthetic', 'locality-ma-synthetic'],
    ['agid-synthetic-cover', 'agid-ma-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-ma-synthetic'],
    ['premise-synthetic', 'civic-address-ma-synthetic'],
    ['building-synthetic', 'building-ma-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'MA';
    if (node.id === 'postal-ma-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Morocco home-delivery sector assignment';
    } else if (node.id === 'country-ma') {
      node.label = 'Morocco';
    } else if (node.id === 'province-ma-synthetic') {
      node.label = 'عمالة اختبارية';
    } else if (node.id === 'locality-ma-synthetic') {
      node.label = 'حي اختباري';
    } else if (node.id === 'agid-ma-synthetic-cover') {
      node.agidCellId = 'MA0000000000';
      node.label = 'Synthetic Morocco AGID cover';
    } else if (node.id === 'civic-address-ma-synthetic') {
      node.label = '١ شارع اختباري';
    } else if (node.id === 'building-ma-synthetic') {
      node.label = 'Synthetic explicitly linked Morocco building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `ma-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = moroccoSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ma-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ma-synthetic',
    countryCode: 'MA',
    releaseId: 'ma-synthetic-2026.01.1',
    policyVersion: 'morocco-typed-five-digit-sector-v0.1',
  };

  pack.geometry.countryCode = 'MA';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `ma-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = moroccoSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-6.851, 34.012],
          [-6.832, 34.012],
          [-6.832, 34.030],
          [-6.851, 34.030],
          [-6.851, 34.012],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ma-synthetic-derived-home-delivery-sector-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 250 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          MOROCCO_POSTAL_CONTEXT_TEST_POINT.longitude,
          MOROCCO_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-6.84173, 34.02082],
          [-6.84157, 34.02082],
          [-6.84157, 34.02094],
          [-6.84173, 34.02094],
          [-6.84173, 34.02082],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
