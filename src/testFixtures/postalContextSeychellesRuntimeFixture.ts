import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createSenegalPostalContextRuntimeTestPack } from './postalContextSenegalRuntimeFixture';

export const SEYCHELLES_POSTAL_CONTEXT_TEST_POINT = { latitude: -4.620234, longitude: 55.430234 } as const;
export const SEYCHELLES_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function seychellesSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^sn-/, 'sc-'),
    sourceVersion: source.sourceVersion?.replace(/^sn-/, 'sc-'),
  };
}

export function createSeychellesPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createSenegalPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-sn-syn-09997', 'postal-sc-rejected-placeholder-0000'],
    ['country-sn', 'country-sc'],
    ['region-sn-synthetic', 'island-sc-synthetic'],
    ['department-sn-synthetic', 'district-sc-synthetic'],
    ['agid-sn-synthetic-cover', 'agid-sc-synthetic-cover'],
    ['civic-address-point-sn-synthetic', 'national-address-point-sc-synthetic'],
    ['civic-address-sn-synthetic', 'national-address-sc-synthetic'],
    ['civic-address-building-sn-synthetic', 'national-address-building-sc-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'SC';
    if (node.id === 'country-sc') node.label = 'Seychelles';
    else if (node.id === 'island-sc-synthetic') node.label = 'Synthetic Island';
    else if (node.id === 'district-sc-synthetic') node.label = 'Synthetic District';
    else if (node.id === 'agid-sc-synthetic-cover') {
      node.agidCellId = 'SC0000000000';
      node.label = 'Synthetic Seychelles AGID fallback cover';
    } else if (node.id === 'national-address-sc-synthetic') {
      node.label = 'Synthetic National Address SC-SYN-NATIONAL-ADDRESS-99999';
    } else if (node.id === 'national-address-building-sc-synthetic') {
      node.label = 'Synthetic explicitly rights-cleared National Address-linked Seychelles building';
    }
  }
  pack.graph.nodes = pack.graph.nodes.filter(node => node.id !== 'postal-sc-rejected-placeholder-0000');

  pack.graph.assertions = pack.graph.assertions.flatMap(assertion => {
    const originalId = assertion.id;
    if (originalId === 'sn-a-postal-locality' || originalId === 'sn-a-premise-postal') return [];
    assertion.id = originalId.replace(/^sn-/, 'sc-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = seychellesSource(assertion.source);
    if (originalId === 'sn-a-postal-agid') {
      assertion.id = 'sc-a-national-address-agid';
      assertion.fromNodeId = 'national-address-sc-synthetic';
      assertion.toNodeId = 'agid-sc-synthetic-cover';
      assertion.relation = 'covered_by_agid';
      assertion.method = 'derived';
    }
    return [assertion];
  });

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-sc-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-sc-synthetic',
    countryCode: 'SC',
    releaseId: 'sc-synthetic-2026.01.1',
    policyVersion: 'seychelles-no-current-postcode-nas-transition-v0.1',
  };

  pack.geometry.countryCode = 'SC';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.flatMap(feature => {
    if (feature.role === 'postal_area') return [];
    feature.id = feature.id.replace(/^sn-/, 'sc-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = seychellesSource(feature.source);
    if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [SEYCHELLES_POSTAL_CONTEXT_TEST_POINT.longitude, SEYCHELLES_POSTAL_CONTEXT_TEST_POINT.latitude] };
      feature.source = { ...feature.source, sourceId: 'sc-synthetic-explicit-national-address-point' };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[55.43017, -4.62030], [55.43030, -4.62030], [55.43030, -4.62017], [55.43017, -4.62017], [55.43017, -4.62030]]] };
      feature.source = { ...feature.source, sourceId: 'sc-synthetic-explicit-national-address-building-link' };
    }
    return [feature];
  });
  return pack;
}
