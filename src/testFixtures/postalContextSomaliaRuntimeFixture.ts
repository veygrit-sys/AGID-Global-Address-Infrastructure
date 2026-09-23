import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createSenegalPostalContextRuntimeTestPack } from './postalContextSenegalRuntimeFixture';

export const SOMALIA_POSTAL_CONTEXT_TEST_POINT = { latitude: 2.046234, longitude: 45.318234 } as const;
export const SOMALIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function somaliaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^sn-/, 'so-'),
    sourceVersion: source.sourceVersion?.replace(/^sn-/, 'so-'),
  };
}

export function createSomaliaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createSenegalPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-sn-syn-09997', 'postal-so-syn-bn-99999'],
    ['country-sn', 'country-so'],
    ['region-sn-synthetic', 'region-so-synthetic'],
    ['department-sn-synthetic', 'district-so-synthetic'],
    ['agid-sn-synthetic-cover', 'agid-so-synthetic-cover'],
    ['civic-address-point-sn-synthetic', 'civic-address-point-so-synthetic'],
    ['civic-address-sn-synthetic', 'civic-address-so-synthetic'],
    ['civic-address-building-sn-synthetic', 'civic-address-building-so-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'SO';
    if (node.id === 'postal-so-syn-bn-99999') {
      node.postalCode = 'BN 99999';
      node.featureKind = 'unknown';
      node.geometryType = 'none';
      node.label = 'Synthetic Somalia AA plus five-digit structure-only observation';
    } else if (node.id === 'country-so') node.label = 'Somalia';
    else if (node.id === 'region-so-synthetic') node.label = 'Synthetic Region';
    else if (node.id === 'district-so-synthetic') node.label = 'Synthetic District';
    else if (node.id === 'agid-so-synthetic-cover') {
      node.agidCellId = 'SO0000000000';
      node.label = 'Synthetic Somalia AGID conflict-sensitive fallback cover';
    } else if (node.id === 'civic-address-so-synthetic') {
      node.label = 'Synthetic rights-cleared civic address SO-CIVIC-SYN-99999';
    } else if (node.id === 'civic-address-building-so-synthetic') {
      node.label = 'Synthetic explicitly rights-cleared civic-address-linked Somalia building';
    }
  }
  pack.graph.nodes = pack.graph.nodes.filter(node => node.id !== 'postal-so-syn-bn-99999');

  pack.graph.assertions = pack.graph.assertions.flatMap(assertion => {
    const originalId = assertion.id;
    assertion.id = assertion.id.replace(/^sn-/, 'so-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = somaliaSource(assertion.source);
    if (originalId === 'sn-a-postal-agid') {
      assertion.id = 'so-a-civic-address-agid';
      assertion.fromNodeId = 'civic-address-so-synthetic';
      assertion.toNodeId = 'agid-so-synthetic-cover';
      assertion.relation = 'covered_by_agid';
      assertion.method = 'derived';
      return [assertion];
    }
    if (assertion.fromNodeId === 'postal-so-syn-bn-99999' || assertion.toNodeId === 'postal-so-syn-bn-99999') return [];
    return [assertion];
  });

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-so-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-so-synthetic',
    countryCode: 'SO',
    releaseId: 'so-synthetic-2026.01.1',
    policyVersion: 'somalia-observed-shape-evidence-gated-address-building-v0.1',
  };

  pack.geometry.countryCode = 'SO';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.flatMap(feature => {
    if (feature.role === 'postal_area') return [];
    feature.id = feature.id.replace(/^sn-/, 'so-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = somaliaSource(feature.source);
    if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [SOMALIA_POSTAL_CONTEXT_TEST_POINT.longitude, SOMALIA_POSTAL_CONTEXT_TEST_POINT.latitude] };
      feature.source = { ...feature.source, sourceId: 'so-synthetic-explicit-civic-address-point' };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[45.31817, 2.04617], [45.31830, 2.04617], [45.31830, 2.04630], [45.31817, 2.04630], [45.31817, 2.04617]]] };
      feature.source = { ...feature.source, sourceId: 'so-synthetic-explicit-civic-address-building-link' };
    }
    return [feature];
  });
  return pack;
}
