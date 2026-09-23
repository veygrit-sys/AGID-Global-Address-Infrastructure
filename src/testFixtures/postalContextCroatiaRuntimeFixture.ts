import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const CROATIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 45.815,
  longitude: 15.9819,
} as const;

export const CROATIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-07-01T00:00:00.000Z';

function croatiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'hr-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'hr-'),
  };
}

export function createCroatiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-hr-syn-00000'],
    ['country-jp', 'country-hr'],
    ['prefecture-synthetic', 'county-hr-synthetic'],
    ['locality-synthetic', 'settlement-hr-synthetic'],
    ['agid-synthetic-cover', 'agid-hr-synthetic-cover'],
    ['address-point-synthetic', 'address-hr-synthetic'],
    ['premise-synthetic', 'premise-hr-synthetic'],
    ['building-synthetic', 'building-hr-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'HR';
    if (node.id === 'postal-hr-syn-00000') {
      node.postalCode = '00000';
      node.label = 'Synthetic Croatia address-membership surface';
    } else if (node.id === 'country-hr') {
      node.label = 'Croatia';
    } else if (node.id === 'county-hr-synthetic') {
      node.label = 'Synthetic County';
    } else if (node.id === 'settlement-hr-synthetic') {
      node.label = 'Synthetic Settlement';
    } else if (node.id === 'agid-hr-synthetic-cover') {
      node.agidCellId = 'HR0000000000';
      node.label = 'Synthetic Croatia AGID cover';
    } else if (node.id === 'premise-hr-synthetic') {
      node.label = 'Ulica Testa 1';
    } else if (node.id === 'building-hr-synthetic') {
      node.label = 'Synthetic explicitly linked Croatian building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `hr-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = croatiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-hr-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-hr-synthetic',
    countryCode: 'HR',
    releaseId: 'hr-synthetic-2026.01.1',
    policyVersion: 'croatia-hp-dgu-address-building-v0.1',
  };

  pack.geometry.countryCode = 'HR';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `hr-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = croatiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [15.9719, 45.805],
          [15.9919, 45.805],
          [15.9919, 45.825],
          [15.9719, 45.825],
          [15.9719, 45.805],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'hr-synthetic-derived-address-membership-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 250 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          CROATIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          CROATIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [15.98186, 45.81496],
          [15.98194, 45.81496],
          [15.98194, 45.81504],
          [15.98186, 45.81504],
          [15.98186, 45.81496],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
