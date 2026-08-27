import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createSingaporePostalContextRuntimeTestPack } from './postalContextSingaporeRuntimeFixture';

export const LIBERIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 6.3,
  longitude: -10.8,
} as const;

export const LIBERIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function liberiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^sg-/, 'lr-'),
    sourceVersion: source.sourceVersion?.replace(/^sg-/, 'lr-'),
  };
}

export function createLiberiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createSingaporePostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-sg-syn-000001', 'postal-lr-syn-9999'],
    ['country-sg', 'country-lr'],
    ['planning-area-synthetic', 'county-lr-synthetic'],
    ['district-synthetic', 'locality-lr-synthetic'],
    ['agid-sg-synthetic-cover', 'agid-lr-synthetic-cover'],
    ['address-point-sg-synthetic', 'address-point-lr-synthetic'],
    ['premise-sg-synthetic', 'premise-lr-synthetic'],
    ['building-sg-synthetic', 'building-lr-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'LR';
    if (node.id === 'postal-lr-syn-9999') {
      node.postalCode = '9999';
      node.label = 'Synthetic Liberia four-digit locality or post-office context';
      node.geometryType = 'none';
    } else if (node.id === 'country-lr') node.label = 'Liberia';
    else if (node.id === 'county-lr-synthetic') node.label = 'Synthetic County';
    else if (node.id === 'locality-lr-synthetic') node.label = 'Synthetic Locality';
    else if (node.id === 'agid-lr-synthetic-cover') {
      node.agidCellId = 'LR0000000000';
      node.label = 'Synthetic Liberia AGID cover';
    } else if (node.id === 'premise-lr-synthetic') node.label = '123 Synthetic Street';
    else if (node.id === 'building-lr-synthetic') node.label = 'Synthetic explicitly address-linked Liberia building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^sg-/, 'lr-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = liberiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-lr-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-lr-synthetic',
    countryCode: 'LR',
    releaseId: 'lr-synthetic-2026.01.1',
    policyVersion: 'liberia-four-digit-assignment-geometry-separation-v0.1',
  };

  pack.geometry.countryCode = 'LR';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features
    .filter(feature => feature.role !== 'postal_area')
    .map(feature => {
      feature.id = feature.id.replace(/^sg-/, 'lr-');
      feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
      feature.source = liberiaSource(feature.source);
      if (feature.role === 'address_point') {
        feature.geometry = {
          type: 'Point',
          coordinates: [LIBERIA_POSTAL_CONTEXT_TEST_POINT.longitude, LIBERIA_POSTAL_CONTEXT_TEST_POINT.latitude],
        };
        feature.source = { ...feature.source, sourceId: 'lr-synthetic-explicit-civic-address-point' };
      } else if (feature.role === 'building_footprint') {
        feature.geometry = {
          type: 'Polygon',
          coordinates: [[
            [-10.80006, 6.29994],
            [-10.79994, 6.29994],
            [-10.79994, 6.30006],
            [-10.80006, 6.30006],
            [-10.80006, 6.29994],
          ]],
        };
        feature.source = { ...feature.source, sourceId: 'lr-synthetic-explicit-address-building-link' };
      }
      return feature;
    });

  return pack;
}
