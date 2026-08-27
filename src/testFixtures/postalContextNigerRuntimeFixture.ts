import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createSingaporePostalContextRuntimeTestPack } from './postalContextSingaporeRuntimeFixture';

export const NIGER_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 13.5,
  longitude: 2.1,
} as const;

export const NIGER_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function nigerSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^sg-/, 'ne-'),
    sourceVersion: source.sourceVersion?.replace(/^sg-/, 'ne-'),
  };
}

export function createNigerPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createSingaporePostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-sg-syn-000001', 'postal-ne-syn-8999'],
    ['country-sg', 'country-ne'],
    ['planning-area-synthetic', 'region-ne-synthetic'],
    ['district-synthetic', 'locality-ne-synthetic'],
    ['agid-sg-synthetic-cover', 'agid-ne-synthetic-cover'],
    ['address-point-sg-synthetic', 'address-point-ne-synthetic'],
    ['premise-sg-synthetic', 'premise-ne-synthetic'],
    ['building-sg-synthetic', 'building-ne-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'NE';
    if (node.id === 'postal-ne-syn-8999') {
      node.postalCode = '8999';
      node.label = 'Synthetic Niger Poste-like locality and post-office routing code';
      node.geometryType = 'none';
    } else if (node.id === 'country-ne') node.label = 'Niger';
    else if (node.id === 'region-ne-synthetic') node.label = 'Synthetic Region';
    else if (node.id === 'locality-ne-synthetic') node.label = 'Synthetic Locality';
    else if (node.id === 'agid-ne-synthetic-cover') {
      node.agidCellId = 'NE0000000000';
      node.label = 'Synthetic Niger AGID cover';
    } else if (node.id === 'premise-ne-synthetic') node.label = '99 Synthetic Delivery Road';
    else if (node.id === 'building-ne-synthetic') node.label = 'Synthetic explicitly address-linked Niger building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^sg-/, 'ne-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = nigerSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ne-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ne-synthetic',
    countryCode: 'NE',
    releaseId: 'ne-synthetic-2026.01.1',
    policyVersion: 'niger-routing-locality-geometry-separation-v0.1',
  };

  pack.geometry.countryCode = 'NE';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features
    .filter(feature => feature.role !== 'postal_area')
    .map(feature => {
      feature.id = feature.id.replace(/^sg-/, 'ne-');
      feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
      feature.source = nigerSource(feature.source);
      if (feature.role === 'address_point') {
        feature.geometry = {
          type: 'Point',
          coordinates: [NIGER_POSTAL_CONTEXT_TEST_POINT.longitude, NIGER_POSTAL_CONTEXT_TEST_POINT.latitude],
        };
        feature.source = { ...feature.source, sourceId: 'ne-synthetic-explicit-civic-address-point' };
      } else if (feature.role === 'building_footprint') {
        feature.geometry = {
          type: 'Polygon',
          coordinates: [[
            [2.09994, 13.49994],
            [2.10006, 13.49994],
            [2.10006, 13.50006],
            [2.09994, 13.50006],
            [2.09994, 13.49994],
          ]],
        };
        feature.source = { ...feature.source, sourceId: 'ne-synthetic-explicit-address-building-link' };
      }
      return feature;
    });

  return pack;
}
