import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const EGYPT_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 30.0444,
  longitude: 31.2357,
} as const;

export const EGYPT_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function egyptSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'eg-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'eg-'),
  };
}

export function createEgyptPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-eg-syn-0000000'],
    ['country-jp', 'country-eg'],
    ['prefecture-synthetic', 'governorate-eg-synthetic'],
    ['locality-synthetic', 'locality-eg-synthetic'],
    ['agid-synthetic-cover', 'agid-eg-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-eg-synthetic'],
    ['premise-synthetic', 'civic-address-eg-synthetic'],
    ['building-synthetic', 'building-eg-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'EG';
    if (node.id === 'postal-eg-syn-0000000') {
      node.postalCode = '0000000';
      node.label = 'Synthetic Egypt seven-digit building-group assignment';
    } else if (node.id === 'country-eg') {
      node.label = 'Egypt';
    } else if (node.id === 'governorate-eg-synthetic') {
      node.label = 'محافظة اختبارية';
    } else if (node.id === 'locality-eg-synthetic') {
      node.label = 'منطقة اختبارية';
    } else if (node.id === 'agid-eg-synthetic-cover') {
      node.agidCellId = 'EG0000000000';
      node.label = 'Synthetic Egypt AGID cover';
    } else if (node.id === 'civic-address-eg-synthetic') {
      node.label = '١ شارع اختباري';
    } else if (node.id === 'building-eg-synthetic') {
      node.label = 'Synthetic explicitly linked Egypt building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `eg-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = egyptSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-eg-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-eg-synthetic',
    countryCode: 'EG',
    releaseId: 'eg-synthetic-2026.01.1',
    policyVersion: 'egypt-seven-digit-building-group-v0.1',
  };

  pack.geometry.countryCode = 'EG';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `eg-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = egyptSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [31.225, 30.035],
          [31.246, 30.035],
          [31.246, 30.054],
          [31.225, 30.054],
          [31.225, 30.035],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'eg-synthetic-derived-building-group-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 250 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          EGYPT_POSTAL_CONTEXT_TEST_POINT.longitude,
          EGYPT_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [31.23562, 30.04434],
          [31.23578, 30.04434],
          [31.23578, 30.04446],
          [31.23562, 30.04446],
          [31.23562, 30.04434],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
