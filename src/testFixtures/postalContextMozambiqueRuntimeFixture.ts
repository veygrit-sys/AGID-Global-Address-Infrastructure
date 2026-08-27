import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createSingaporePostalContextRuntimeTestPack } from './postalContextSingaporeRuntimeFixture';

export const MOZAMBIQUE_POSTAL_CONTEXT_TEST_POINT = {
  latitude: -25.95,
  longitude: 32.58,
} as const;

export const MOZAMBIQUE_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function mozambiqueSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^sg-/, 'mz-'),
    sourceVersion: source.sourceVersion?.replace(/^sg-/, 'mz-'),
  };
}

export function createMozambiquePostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createSingaporePostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-sg-syn-000001', 'postal-mz-syn-99999-999'],
    ['country-sg', 'country-mz'],
    ['planning-area-synthetic', 'province-mz-synthetic'],
    ['district-synthetic', 'bairro-mz-synthetic'],
    ['agid-sg-synthetic-cover', 'agid-mz-synthetic-cover'],
    ['address-point-sg-synthetic', 'address-point-mz-synthetic'],
    ['premise-sg-synthetic', 'premise-mz-synthetic'],
    ['building-sg-synthetic', 'building-mz-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'MZ';
    if (node.id === 'postal-mz-syn-99999-999') {
      node.postalCode = '99999-999';
      node.label = 'Synthetic current-shape Mozambique CEP locality or bairro';
      node.geometryType = 'none';
    } else if (node.id === 'country-mz') node.label = 'Mozambique';
    else if (node.id === 'province-mz-synthetic') node.label = 'Synthetic Province';
    else if (node.id === 'bairro-mz-synthetic') node.label = 'Synthetic Locality or Bairro';
    else if (node.id === 'agid-mz-synthetic-cover') {
      node.agidCellId = 'MZ0000000000';
      node.label = 'Synthetic Mozambique AGID cover';
    } else if (node.id === 'premise-mz-synthetic') node.label = '123 Avenida Sintética';
    else if (node.id === 'building-mz-synthetic') node.label = 'Synthetic explicitly address-linked Mozambique building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^sg-/, 'mz-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = mozambiqueSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-mz-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-mz-synthetic',
    countryCode: 'MZ',
    releaseId: 'mz-synthetic-2026.01.1',
    policyVersion: 'mozambique-current-cep-migration-geometry-separation-v0.1',
  };

  pack.geometry.countryCode = 'MZ';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features
    .filter(feature => feature.role !== 'postal_area')
    .map(feature => {
      feature.id = feature.id.replace(/^sg-/, 'mz-');
      feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
      feature.source = mozambiqueSource(feature.source);
      if (feature.role === 'address_point') {
        feature.geometry = {
          type: 'Point',
          coordinates: [MOZAMBIQUE_POSTAL_CONTEXT_TEST_POINT.longitude, MOZAMBIQUE_POSTAL_CONTEXT_TEST_POINT.latitude],
        };
        feature.source = { ...feature.source, sourceId: 'mz-synthetic-explicit-civic-address-point' };
      } else if (feature.role === 'building_footprint') {
        feature.geometry = {
          type: 'Polygon',
          coordinates: [[
            [32.57994, -25.95006],
            [32.58006, -25.95006],
            [32.58006, -25.94994],
            [32.57994, -25.94994],
            [32.57994, -25.95006],
          ]],
        };
        feature.source = { ...feature.source, sourceId: 'mz-synthetic-explicit-address-building-link' };
      }
      return feature;
    });

  return pack;
}
