import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createSingaporePostalContextRuntimeTestPack } from './postalContextSingaporeRuntimeFixture';

export const NAMIBIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: -22.6,
  longitude: 17.1,
} as const;

export const NAMIBIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function namibiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^sg-/, 'na-'),
    sourceVersion: source.sourceVersion?.replace(/^sg-/, 'na-'),
  };
}

export function createNamibiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createSingaporePostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-sg-syn-000001', 'postal-na-syn-99099'],
    ['country-sg', 'country-na'],
    ['planning-area-synthetic', 'region-na-synthetic'],
    ['district-synthetic', 'constituency-na-synthetic'],
    ['agid-sg-synthetic-cover', 'agid-na-synthetic-cover'],
    ['address-point-sg-synthetic', 'address-point-na-synthetic'],
    ['premise-sg-synthetic', 'premise-na-synthetic'],
    ['building-sg-synthetic', 'building-na-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'NA';
    if (node.id === 'postal-na-syn-99099') {
      node.postalCode = '99099';
      node.label = 'Synthetic NamPost-like Phase 1 delivery-office code';
      node.geometryType = 'none';
    } else if (node.id === 'country-na') node.label = 'Namibia';
    else if (node.id === 'region-na-synthetic') node.label = 'Synthetic Region';
    else if (node.id === 'constituency-na-synthetic') node.label = 'Synthetic Constituency';
    else if (node.id === 'agid-na-synthetic-cover') {
      node.agidCellId = 'NA0000000000';
      node.label = 'Synthetic Namibia AGID cover';
    } else if (node.id === 'premise-na-synthetic') node.label = '99 Synthetic Delivery Point Road';
    else if (node.id === 'building-na-synthetic') node.label = 'Synthetic explicitly address-linked Namibian building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^sg-/, 'na-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = namibiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-na-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-na-synthetic',
    countryCode: 'NA',
    releaseId: 'na-synthetic-2026.01.1',
    policyVersion: 'namibia-phase-1-delivery-network-separation-v0.1',
  };

  pack.geometry.countryCode = 'NA';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features
    .filter(feature => feature.role !== 'postal_area')
    .map(feature => {
      feature.id = feature.id.replace(/^sg-/, 'na-');
      feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
      feature.source = namibiaSource(feature.source);
      if (feature.role === 'address_point') {
        feature.geometry = {
          type: 'Point',
          coordinates: [NAMIBIA_POSTAL_CONTEXT_TEST_POINT.longitude, NAMIBIA_POSTAL_CONTEXT_TEST_POINT.latitude],
        };
        feature.source = { ...feature.source, sourceId: 'na-synthetic-explicit-civic-address-point' };
      } else if (feature.role === 'building_footprint') {
        feature.geometry = {
          type: 'Polygon',
          coordinates: [[
            [17.09994, -22.60006],
            [17.10006, -22.60006],
            [17.10006, -22.59994],
            [17.09994, -22.59994],
            [17.09994, -22.60006],
          ]],
        };
        feature.source = { ...feature.source, sourceId: 'na-synthetic-explicit-address-building-link' };
      }
      return feature;
    });

  return pack;
}
