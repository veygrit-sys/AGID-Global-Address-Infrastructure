import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const KYRGYZSTAN_POSTAL_CONTEXT_TEST_POINT = { latitude: 41.5000, longitude: 75.0000 } as const;
export const KYRGYZSTAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function kyrgyzstanSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'kg-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'kg-') };
}

export function createKyrgyzstanPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-kg-syn-799999'], ['country-jp', 'country-kg'],
    ['prefecture-synthetic', 'region-kg-synthetic'], ['locality-synthetic', 'locality-kg-synthetic'],
    ['agid-synthetic-cover', 'agid-kg-synthetic-cover'], ['address-point-synthetic', 'civic-address-point-kg-synthetic'],
    ['premise-synthetic', 'civic-address-kg-synthetic'], ['building-synthetic', 'building-kg-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'KG';
    if (node.id === 'postal-kg-syn-799999') { node.postalCode = '799999'; node.label = 'Synthetic Kyrgyzstan six-digit postcode 799999'; }
    else if (node.id === 'country-kg') node.label = 'Kyrgyzstan';
    else if (node.id === 'region-kg-synthetic') node.label = 'Synthetic Kyrgyzstan region context';
    else if (node.id === 'locality-kg-synthetic') node.label = 'Synthetic Kyrgyzstan locality context';
    else if (node.id === 'agid-kg-synthetic-cover') { node.agidCellId = 'KG0000000000'; node.label = 'Synthetic Kyrgyzstan AGID cover'; }
    else if (node.id === 'civic-address-kg-synthetic') node.label = 'Synthetic rights-cleared Kyrgyzstan civic address KG-SYN-CIVIC-79';
    else if (node.id === 'building-kg-synthetic') node.label = 'Synthetic explicitly address-linked Kyrgyzstan building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = 'kg-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = kyrgyzstanSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-kg-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-kg-synthetic', countryCode: 'KG', releaseId: 'kg-synthetic-2026.01.1', policyVersion: 'kyrgyzstan-postal-context-v0.1' };
  pack.geometry.countryCode = 'KG';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'kg-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = kyrgyzstanSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[74.985, 41.490], [75.015, 41.490], [75.015, 41.510], [74.985, 41.510], [74.985, 41.490]]] };
      feature.source = { ...feature.source, sourceId: 'kg-synthetic-derived-postal-context-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [KYRGYZSTAN_POSTAL_CONTEXT_TEST_POINT.longitude, KYRGYZSTAN_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[74.99992, 41.49994], [75.00008, 41.49994], [75.00008, 41.50006], [74.99992, 41.50006], [74.99992, 41.49994]]] };
    }
    return feature;
  });
  return pack;
}
