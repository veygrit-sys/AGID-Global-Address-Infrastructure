import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const MYANMAR_POSTAL_CONTEXT_TEST_POINT = { latitude: 19.7500, longitude: 96.1000 } as const;
export const MYANMAR_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function myanmarSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'mm-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'mm-') };
}

export function createMyanmarPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-mm-syn-9999999'],
    ['country-jp', 'country-mm'],
    ['prefecture-synthetic', 'state-region-mm-synthetic'],
    ['locality-synthetic', 'quarter-village-tract-mm-synthetic'],
    ['agid-synthetic-cover', 'agid-mm-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-mm-synthetic'],
    ['premise-synthetic', 'civic-address-mm-synthetic'],
    ['building-synthetic', 'building-mm-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'MM';
    if (node.id === 'postal-mm-syn-9999999') { node.postalCode = '9999999'; node.label = 'Synthetic Myanmar seven-digit Quarter or Village Tract assignment 9999999'; }
    else if (node.id === 'country-mm') node.label = 'Myanmar';
    else if (node.id === 'state-region-mm-synthetic') node.label = 'Synthetic Myanmar State or Region';
    else if (node.id === 'quarter-village-tract-mm-synthetic') node.label = 'Synthetic Myanmar Quarter or Village Tract';
    else if (node.id === 'agid-mm-synthetic-cover') { node.agidCellId = 'MM0000000000'; node.label = 'Synthetic Myanmar AGID cover'; }
    else if (node.id === 'civic-address-mm-synthetic') node.label = 'Synthetic Room 1, Building 1, House 1, Street 1, explicit civic address MM-SYN-9999999';
    else if (node.id === 'building-mm-synthetic') node.label = 'Synthetic explicitly linked Myanmar building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'mm-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = myanmarSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-mm-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-mm-synthetic', countryCode: 'MM', releaseId: 'mm-synthetic-2026.01.1', policyVersion: 'myanmar-seven-digit-quarter-village-tract-v0.1' };
  pack.geometry.countryCode = 'MM';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'mm-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = myanmarSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[96.085, 19.740], [96.115, 19.740], [96.115, 19.760], [96.085, 19.760], [96.085, 19.740]]] };
      feature.source = { ...feature.source, sourceId: 'mm-synthetic-administrative-join-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [MYANMAR_POSTAL_CONTEXT_TEST_POINT.longitude, MYANMAR_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[96.09992, 19.74994], [96.10008, 19.74994], [96.10008, 19.75006], [96.09992, 19.75006], [96.09992, 19.74994]]] };
    }
    return feature;
  });
  return pack;
}
