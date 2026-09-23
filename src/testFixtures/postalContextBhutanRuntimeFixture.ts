import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const BHUTAN_POSTAL_CONTEXT_TEST_POINT = { latitude: 27.4728, longitude: 89.6390 } as const;
export const BHUTAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function bhutanSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'bt-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'bt-') };
}

export function createBhutanPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-bt-syn-99999'],
    ['country-jp', 'country-bt'],
    ['prefecture-synthetic', 'dzongkhag-bt-synthetic'],
    ['locality-synthetic', 'gewog-bt-synthetic'],
    ['agid-synthetic-cover', 'agid-bt-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-bt-synthetic'],
    ['premise-synthetic', 'civic-address-bt-synthetic'],
    ['building-synthetic', 'building-bt-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'BT';
    if (node.id === 'postal-bt-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic Bhutan Post routing assignment 99999'; }
    else if (node.id === 'country-bt') node.label = 'Bhutan';
    else if (node.id === 'dzongkhag-bt-synthetic') node.label = 'Synthetic Bhutan Dzongkhag';
    else if (node.id === 'gewog-bt-synthetic') node.label = 'Synthetic Bhutan Gewog';
    else if (node.id === 'agid-bt-synthetic-cover') { node.agidCellId = 'BT0000000000'; node.label = 'Synthetic Bhutan AGID cover'; }
    else if (node.id === 'civic-address-bt-synthetic') node.label = 'Synthetic Unit 1, House 1, Lam 1, Gewog, explicit civic address BT-SYN-99999';
    else if (node.id === 'building-bt-synthetic') node.label = 'Synthetic explicitly linked Bhutan building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'bt-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = bhutanSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-bt-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-bt-synthetic', countryCode: 'BT', releaseId: 'bt-synthetic-2026.01.1', policyVersion: 'bhutan-postcode-routing-v0.1' };
  pack.geometry.countryCode = 'BT';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'bt-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = bhutanSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[89.625, 27.463], [89.653, 27.463], [89.653, 27.483], [89.625, 27.483], [89.625, 27.463]]] };
      feature.source = { ...feature.source, sourceId: 'bt-synthetic-derived-delivery-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [BHUTAN_POSTAL_CONTEXT_TEST_POINT.longitude, BHUTAN_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[89.63892, 27.47274], [89.63908, 27.47274], [89.63908, 27.47286], [89.63892, 27.47286], [89.63892, 27.47274]]] };
    }
    return feature;
  });
  return pack;
}
