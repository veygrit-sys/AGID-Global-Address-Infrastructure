import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createSingaporePostalContextRuntimeTestPack } from './postalContextSingaporeRuntimeFixture';

export const MAURITIUS_POSTAL_CONTEXT_TEST_POINT = {
  latitude: -20.2,
  longitude: 57.5,
} as const;

export const MAURITIUS_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function mauritiusSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^sg-/, 'mu-'),
    sourceVersion: source.sourceVersion?.replace(/^sg-/, 'mu-'),
  };
}

export function createMauritiusPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createSingaporePostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-sg-syn-000001', 'postal-mu-syn-99999'],
    ['country-sg', 'country-mu'],
    ['planning-area-synthetic', 'district-mu-synthetic'],
    ['district-synthetic', 'sublocality-mu-synthetic'],
    ['agid-sg-synthetic-cover', 'agid-mu-synthetic-cover'],
    ['address-point-sg-synthetic', 'address-point-mu-synthetic'],
    ['premise-sg-synthetic', 'premise-mu-synthetic'],
    ['building-sg-synthetic', 'building-mu-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'MU';
    if (node.id === 'postal-mu-syn-99999') {
      node.postalCode = '99999';
      node.label = 'Synthetic Mauritius Post-like main-island sub-locality code';
      node.geometryType = 'none';
    } else if (node.id === 'country-mu') node.label = 'Mauritius';
    else if (node.id === 'district-mu-synthetic') node.label = 'Synthetic Geographical District';
    else if (node.id === 'sublocality-mu-synthetic') node.label = 'Synthetic Sub-locality';
    else if (node.id === 'agid-mu-synthetic-cover') {
      node.agidCellId = 'MU0000000000';
      node.label = 'Synthetic Mauritius AGID cover';
    } else if (node.id === 'premise-mu-synthetic') node.label = '99 Synthetic Road';
    else if (node.id === 'building-mu-synthetic') node.label = 'Synthetic explicitly address-linked Mauritius building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^sg-/, 'mu-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = mauritiusSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-mu-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-mu-synthetic',
    countryCode: 'MU',
    releaseId: 'mu-synthetic-2026.01.1',
    policyVersion: 'mauritius-territory-assignment-geometry-separation-v0.1',
  };

  pack.geometry.countryCode = 'MU';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features
    .filter(feature => feature.role !== 'postal_area')
    .map(feature => {
      feature.id = feature.id.replace(/^sg-/, 'mu-');
      feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
      feature.source = mauritiusSource(feature.source);
      if (feature.role === 'address_point') {
        feature.geometry = {
          type: 'Point',
          coordinates: [MAURITIUS_POSTAL_CONTEXT_TEST_POINT.longitude, MAURITIUS_POSTAL_CONTEXT_TEST_POINT.latitude],
        };
        feature.source = { ...feature.source, sourceId: 'mu-synthetic-explicit-civic-address-point' };
      } else if (feature.role === 'building_footprint') {
        feature.geometry = {
          type: 'Polygon',
          coordinates: [[
            [57.49994, -20.20006],
            [57.50006, -20.20006],
            [57.50006, -20.19994],
            [57.49994, -20.19994],
            [57.49994, -20.20006],
          ]],
        };
        feature.source = { ...feature.source, sourceId: 'mu-synthetic-explicit-address-building-link' };
      }
      return feature;
    });

  return pack;
}
