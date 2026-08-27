import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createSingaporePostalContextRuntimeTestPack } from './postalContextSingaporeRuntimeFixture';

export const MADAGASCAR_POSTAL_CONTEXT_TEST_POINT = {
  latitude: -18.9,
  longitude: 47.5,
} as const;

export const MADAGASCAR_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function madagascarSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^sg-/, 'mg-'),
    sourceVersion: source.sourceVersion?.replace(/^sg-/, 'mg-'),
  };
}

export function createMadagascarPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createSingaporePostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-sg-syn-000001', 'postal-mg-syn-699'],
    ['country-sg', 'country-mg'],
    ['planning-area-synthetic', 'region-mg-synthetic'],
    ['district-synthetic', 'locality-mg-synthetic'],
    ['agid-sg-synthetic-cover', 'agid-mg-synthetic-cover'],
    ['address-point-sg-synthetic', 'address-point-mg-synthetic'],
    ['premise-sg-synthetic', 'premise-mg-synthetic'],
    ['building-sg-synthetic', 'building-mg-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'MG';
    if (node.id === 'postal-mg-syn-699') {
      node.postalCode = '699';
      node.label = 'Synthetic Paositra Malagasy-like postal-town routing code';
      node.geometryType = 'none';
    } else if (node.id === 'country-mg') node.label = 'Madagascar';
    else if (node.id === 'region-mg-synthetic') node.label = 'Synthetic Current Region';
    else if (node.id === 'locality-mg-synthetic') node.label = 'Synthetic Postal Town';
    else if (node.id === 'agid-mg-synthetic-cover') {
      node.agidCellId = 'MG0000000000';
      node.label = 'Synthetic Madagascar AGID cover';
    } else if (node.id === 'premise-mg-synthetic') node.label = 'Lot 99 Synthetic Delivery Road';
    else if (node.id === 'building-mg-synthetic') node.label = 'Synthetic explicitly address-linked Madagascar building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^sg-/, 'mg-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = madagascarSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-mg-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-mg-synthetic',
    countryCode: 'MG',
    releaseId: 'mg-synthetic-2026.01.1',
    policyVersion: 'madagascar-postal-town-history-geometry-separation-v0.1',
  };

  pack.geometry.countryCode = 'MG';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features
    .filter(feature => feature.role !== 'postal_area')
    .map(feature => {
      feature.id = feature.id.replace(/^sg-/, 'mg-');
      feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
      feature.source = madagascarSource(feature.source);
      if (feature.role === 'address_point') {
        feature.geometry = {
          type: 'Point',
          coordinates: [MADAGASCAR_POSTAL_CONTEXT_TEST_POINT.longitude, MADAGASCAR_POSTAL_CONTEXT_TEST_POINT.latitude],
        };
        feature.source = { ...feature.source, sourceId: 'mg-synthetic-explicit-civic-address-point' };
      } else if (feature.role === 'building_footprint') {
        feature.geometry = {
          type: 'Polygon',
          coordinates: [[
            [47.49994, -18.90006],
            [47.50006, -18.90006],
            [47.50006, -18.89994],
            [47.49994, -18.89994],
            [47.49994, -18.90006],
          ]],
        };
        feature.source = { ...feature.source, sourceId: 'mg-synthetic-explicit-address-building-link' };
      }
      return feature;
    });

  return pack;
}
