import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const OMAN_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 23.5880,
  longitude: 58.4059,
} as const;

export const OMAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function omanSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'om-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'om-'),
  };
}

export function createOmanPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-om-syn-000'],
    ['country-jp', 'country-om'],
    ['prefecture-synthetic', 'governorate-om-synthetic'],
    ['locality-synthetic', 'wilayat-om-synthetic'],
    ['agid-synthetic-cover', 'agid-om-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-om-synthetic'],
    ['premise-synthetic', 'civic-address-om-synthetic'],
    ['building-synthetic', 'building-om-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'OM';
    if (node.id === 'postal-om-syn-000') {
      node.postalCode = '000';
      node.label = 'Synthetic Oman post-office routing code';
      node.featureKind = 'po_box';
      node.geometryType = 'point';
    } else if (node.id === 'country-om') {
      node.label = 'Oman';
    } else if (node.id === 'governorate-om-synthetic') {
      node.label = 'محافظة الاختبار';
    } else if (node.id === 'wilayat-om-synthetic') {
      node.label = 'ولاية الاختبار';
    } else if (node.id === 'agid-om-synthetic-cover') {
      node.agidCellId = 'OM0000000000';
      node.label = 'Synthetic Oman AGID cover';
    } else if (node.id === 'civic-address-om-synthetic') {
      node.label = 'Synthetic Building 1, Way 2';
    } else if (node.id === 'building-om-synthetic') {
      node.label = 'Synthetic explicitly linked Oman building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `om-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = omanSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-om-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-om-synthetic',
    countryCode: 'OM',
    releaseId: 'om-synthetic-2026.01.1',
    policyVersion: 'oman-post-office-po-box-building-v0.1',
  };

  pack.geometry.countryCode = 'OM';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `om-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = omanSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          58.4045,
          23.5868,
        ],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'om-synthetic-post-office-point',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 5 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          OMAN_POSTAL_CONTEXT_TEST_POINT.longitude,
          OMAN_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [58.40582, 23.58794],
          [58.40598, 23.58794],
          [58.40598, 23.58806],
          [58.40582, 23.58806],
          [58.40582, 23.58794],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
