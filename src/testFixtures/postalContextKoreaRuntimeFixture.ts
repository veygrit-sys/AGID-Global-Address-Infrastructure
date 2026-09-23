import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const KOREA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 37.5665,
  longitude: 126.9780,
} as const;

export const KOREA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function koreaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'kr-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'kr-'),
  };
}

export function createKoreaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-kr-syn-00000'],
    ['country-jp', 'country-kr'],
    ['prefecture-synthetic', 'province-kr-synthetic'],
    ['locality-synthetic', 'district-kr-synthetic'],
    ['agid-synthetic-cover', 'agid-kr-synthetic-cover'],
    ['address-point-synthetic', 'juso-entrance-point-kr-synthetic'],
    ['premise-synthetic', 'juso-road-address-kr-synthetic'],
    ['building-synthetic', 'juso-building-kr-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'KR';
    if (node.id === 'postal-kr-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Korean National Basic District';
    } else if (node.id === 'country-kr') {
      node.label = 'Republic of Korea';
    } else if (node.id === 'province-kr-synthetic') {
      node.label = '시험특별시';
    } else if (node.id === 'district-kr-synthetic') {
      node.label = '시험구';
    } else if (node.id === 'agid-kr-synthetic-cover') {
      node.agidCellId = 'KR0000000000';
      node.label = 'Synthetic Korea AGID cover';
    } else if (node.id === 'juso-road-address-kr-synthetic') {
      node.label = '예시로 1';
    } else if (node.id === 'juso-building-kr-synthetic') {
      node.label = 'Synthetic explicitly linked Juso building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `kr-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = koreaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-kr-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-kr-synthetic',
    countryCode: 'KR',
    releaseId: 'kr-synthetic-2026.01.1',
    policyVersion: 'korea-post-mois-juso-building-v0.1',
  };

  pack.geometry.countryCode = 'KR';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `kr-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = koreaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [126.965, 37.556],
          [126.991, 37.556],
          [126.991, 37.578],
          [126.965, 37.578],
          [126.965, 37.556],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'kr-synthetic-national-basic-district',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 5 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          KOREA_POSTAL_CONTEXT_TEST_POINT.longitude,
          KOREA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [126.97792, 37.56644],
          [126.97808, 37.56644],
          [126.97808, 37.56656],
          [126.97792, 37.56656],
          [126.97792, 37.56644],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
