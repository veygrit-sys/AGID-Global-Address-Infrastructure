import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const SAUDI_ARABIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 24.7136,
  longitude: 46.6753,
} as const;

export const SAUDI_ARABIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function saudiArabiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'sa-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'sa-'),
  };
}

export function createSaudiArabiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-sa-syn-00000'],
    ['country-jp', 'country-sa'],
    ['prefecture-synthetic', 'region-sa-synthetic'],
    ['locality-synthetic', 'city-sa-synthetic'],
    ['agid-synthetic-cover', 'agid-sa-synthetic-cover'],
    ['address-point-synthetic', 'spl-address-point-sa-synthetic'],
    ['premise-synthetic', 'spl-national-address-sa-synthetic'],
    ['building-synthetic', 'building-sa-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'SA';
    if (node.id === 'postal-sa-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Saudi five-digit assignment';
    } else if (node.id === 'country-sa') {
      node.label = 'Saudi Arabia';
    } else if (node.id === 'region-sa-synthetic') {
      node.label = 'منطقة الاختبار';
    } else if (node.id === 'city-sa-synthetic') {
      node.label = 'مدينة الاختبار';
    } else if (node.id === 'agid-sa-synthetic-cover') {
      node.agidCellId = 'SA0000000000';
      node.label = 'Synthetic Saudi AGID cover';
    } else if (node.id === 'spl-national-address-sa-synthetic') {
      node.label = '0001 شارع المثال';
    } else if (node.id === 'building-sa-synthetic') {
      node.label = 'Synthetic explicitly linked Saudi building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `sa-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = saudiArabiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-sa-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-sa-synthetic',
    countryCode: 'SA',
    releaseId: 'sa-synthetic-2026.01.1',
    policyVersion: 'saudi-spl-national-address-building-v0.1',
  };

  pack.geometry.countryCode = 'SA';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `sa-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = saudiArabiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [46.660, 24.703],
          [46.691, 24.703],
          [46.691, 24.725],
          [46.660, 24.725],
          [46.660, 24.703],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'sa-synthetic-derived-national-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 250 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          SAUDI_ARABIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          SAUDI_ARABIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [46.67522, 24.71354],
          [46.67538, 24.71354],
          [46.67538, 24.71366],
          [46.67522, 24.71366],
          [46.67522, 24.71354],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
