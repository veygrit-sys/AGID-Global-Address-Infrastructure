import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const UZBEKISTAN_POSTAL_CONTEXT_TEST_POINT = { latitude: 41.0000, longitude: 64.0000 } as const;
export const UZBEKISTAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function uzbekistanSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'uz-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'uz-') };
}

export function createUzbekistanPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-uz-syn-999999'], ['country-jp', 'country-uz'],
    ['prefecture-synthetic', 'province-uz-synthetic'], ['locality-synthetic', 'locality-uz-synthetic'],
    ['agid-synthetic-cover', 'agid-uz-synthetic-cover'], ['address-point-synthetic', 'civic-address-point-uz-synthetic'],
    ['premise-synthetic', 'civic-address-uz-synthetic'], ['building-synthetic', 'building-uz-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'UZ';
    if (node.id === 'postal-uz-syn-999999') { node.postalCode = '999999'; node.label = 'Synthetic Uzbekistan six-digit postal index 999999'; }
    else if (node.id === 'country-uz') node.label = 'Uzbekistan';
    else if (node.id === 'province-uz-synthetic') node.label = 'Synthetic Uzbekistan province context';
    else if (node.id === 'locality-uz-synthetic') node.label = 'Synthetic Uzbekistan locality context';
    else if (node.id === 'agid-uz-synthetic-cover') { node.agidCellId = 'UZ0000000000'; node.label = 'Synthetic Uzbekistan AGID cover'; }
    else if (node.id === 'civic-address-uz-synthetic') node.label = 'Synthetic rights-cleared Uzbekistan civic address UZ-SYN-999999';
    else if (node.id === 'building-uz-synthetic') node.label = 'Synthetic explicitly address-linked Uzbekistan building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = 'uz-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = uzbekistanSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-uz-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-uz-synthetic', countryCode: 'UZ', releaseId: 'uz-synthetic-2026.01.1', policyVersion: 'uzbekistan-six-digit-delivery-network-v0.1' };
  pack.geometry.countryCode = 'UZ';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'uz-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = uzbekistanSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[63.985, 40.990], [64.015, 40.990], [64.015, 41.010], [63.985, 41.010], [63.985, 40.990]]] };
      feature.source = { ...feature.source, sourceId: 'uz-synthetic-derived-postal-context-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [UZBEKISTAN_POSTAL_CONTEXT_TEST_POINT.longitude, UZBEKISTAN_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[63.99992, 40.99994], [64.00008, 40.99994], [64.00008, 41.00006], [63.99992, 41.00006], [63.99992, 40.99994]]] };
    }
    return feature;
  });
  return pack;
}
