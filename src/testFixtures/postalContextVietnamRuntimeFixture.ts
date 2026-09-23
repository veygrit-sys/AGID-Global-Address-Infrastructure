import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const VIETNAM_POSTAL_CONTEXT_TEST_POINT = { latitude: 16.0000, longitude: 108.0000 } as const;
export const VIETNAM_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function vietnamSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'vn-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'vn-') };
}

export function createVietnamPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-vn-syn-99999'],
    ['country-jp', 'country-vn'],
    ['prefecture-synthetic', 'province-vn-synthetic'],
    ['locality-synthetic', 'ward-vn-synthetic'],
    ['agid-synthetic-cover', 'agid-vn-synthetic-cover'],
    ['address-point-synthetic', 'digital-address-point-vn-synthetic'],
    ['premise-synthetic', 'civic-address-vn-synthetic'],
    ['building-synthetic', 'building-vn-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'VN';
    if (node.id === 'postal-vn-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic Vietnam five-digit assignment 99999'; }
    else if (node.id === 'country-vn') node.label = 'Vietnam';
    else if (node.id === 'province-vn-synthetic') node.label = 'Synthetic Vietnam Province';
    else if (node.id === 'ward-vn-synthetic') node.label = 'Synthetic Vietnam Ward';
    else if (node.id === 'agid-vn-synthetic-cover') { node.agidCellId = 'VN0000000000'; node.label = 'Synthetic Vietnam AGID cover'; }
    else if (node.id === 'civic-address-vn-synthetic') node.label = 'Synthetic Room 1, Building 1, House 1, Lane 1, Street 1, explicit civic address VN-SYN-99999';
    else if (node.id === 'building-vn-synthetic') node.label = 'Synthetic explicitly linked Vietnam building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'vn-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = vietnamSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-vn-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-vn-synthetic', countryCode: 'VN', releaseId: 'vn-synthetic-2026.01.1', policyVersion: 'vietnam-five-digit-two-tier-v0.1' };
  pack.geometry.countryCode = 'VN';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'vn-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = vietnamSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[107.985, 15.990], [108.015, 15.990], [108.015, 16.010], [107.985, 16.010], [107.985, 15.990]]] };
      feature.source = { ...feature.source, sourceId: 'vn-synthetic-administrative-join-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [VIETNAM_POSTAL_CONTEXT_TEST_POINT.longitude, VIETNAM_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[107.99992, 15.99994], [108.00008, 15.99994], [108.00008, 16.00006], [107.99992, 16.00006], [107.99992, 15.99994]]] };
    }
    return feature;
  });
  return pack;
}
