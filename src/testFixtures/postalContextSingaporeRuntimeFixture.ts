import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const SINGAPORE_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 1.3,
  longitude: 103.75,
} as const;

export const SINGAPORE_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function singaporeSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'sg-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'sg-'),
  };
}

export function createSingaporePostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-sg-syn-000001'],
    ['country-jp', 'country-sg'],
    ['prefecture-synthetic', 'planning-area-synthetic'],
    ['locality-synthetic', 'district-synthetic'],
    ['agid-synthetic-cover', 'agid-sg-synthetic-cover'],
    ['address-point-synthetic', 'address-point-sg-synthetic'],
    ['premise-synthetic', 'premise-sg-synthetic'],
    ['building-synthetic', 'building-sg-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'SG';
    if (node.id === 'postal-sg-syn-000001') {
      node.postalCode = '000001';
      node.label = 'Synthetic delivery-point postcode';
      node.geometryType = 'none';
    } else if (node.id === 'country-sg') {
      node.label = 'Singapore';
    } else if (node.id === 'planning-area-synthetic') {
      node.label = 'Synthetic Planning Area';
    } else if (node.id === 'district-synthetic') {
      node.label = 'Synthetic Meridian District';
    } else if (node.id === 'agid-sg-synthetic-cover') {
      node.agidCellId = 'SG0000000000';
      node.label = 'Synthetic Singapore AGID cover';
    } else if (node.id === 'premise-sg-synthetic') {
      node.label = '1 Synthetic Meridian Road';
    } else if (node.id === 'building-sg-synthetic') {
      node.label = 'Synthetic Meridian Centre';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `sg-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = singaporeSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-sg-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-sg-synthetic',
    countryCode: 'SG',
    releaseId: 'sg-synthetic-2026.01.1',
    policyVersion: 'sg-delivery-point-v0.1',
    artifacts: pack.graph.release.artifacts.map(artifact => ({
      ...artifact,
      recordCount: 2,
    })),
  };

  pack.geometry.countryCode = 'SG';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features
    .filter(feature => feature.role !== 'postal_area')
    .map(feature => {
      feature.id = `sg-${feature.id}`;
      feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
      feature.source = singaporeSource(feature.source);
      if (feature.role === 'address_point') {
        feature.geometry = {
          type: 'Point',
          coordinates: [
            SINGAPORE_POSTAL_CONTEXT_TEST_POINT.longitude,
            SINGAPORE_POSTAL_CONTEXT_TEST_POINT.latitude,
          ],
        };
      } else if (feature.role === 'building_footprint') {
        feature.geometry = {
          type: 'Polygon',
          coordinates: [[
            [103.74998, 1.29998],
            [103.75002, 1.29998],
            [103.75002, 1.30002],
            [103.74998, 1.30002],
            [103.74998, 1.29998],
          ]],
        };
      }
      return feature;
    });

  return pack;
}
