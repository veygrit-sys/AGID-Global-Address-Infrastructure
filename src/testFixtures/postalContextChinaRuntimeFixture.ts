import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const CHINA_POSTAL_CONTEXT_TEST_POINT = { latitude: 35.0000, longitude: 104.0000 } as const;
export const CHINA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function chinaSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'cn-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'cn-') };
}

export function createChinaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-cn-syn-999999'], ['country-jp', 'country-cn'],
    ['prefecture-synthetic', 'province-cn-synthetic'], ['locality-synthetic', 'locality-cn-synthetic'],
    ['agid-synthetic-cover', 'agid-cn-synthetic-cover'], ['address-point-synthetic', 'civic-address-point-cn-synthetic'],
    ['premise-synthetic', 'civic-address-cn-synthetic'], ['building-synthetic', 'building-cn-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'CN';
    if (node.id === 'postal-cn-syn-999999') { node.postalCode = '999999'; node.label = 'Synthetic China six-digit postcode 999999'; }
    else if (node.id === 'country-cn') node.label = 'China';
    else if (node.id === 'province-cn-synthetic') node.label = 'Synthetic China province context';
    else if (node.id === 'locality-cn-synthetic') node.label = 'Synthetic China locality context';
    else if (node.id === 'agid-cn-synthetic-cover') { node.agidCellId = 'CN0000000000'; node.label = 'Synthetic China AGID cover'; }
    else if (node.id === 'civic-address-cn-synthetic') node.label = 'Synthetic rights-cleared China civic address CN-SYN-CIVIC-99';
    else if (node.id === 'building-cn-synthetic') node.label = 'Synthetic explicitly address-linked China building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = 'cn-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = chinaSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-cn-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-cn-synthetic', countryCode: 'CN', releaseId: 'cn-synthetic-2026.01.1', policyVersion: 'china-six-digit-postal-context-v0.1' };
  pack.geometry.countryCode = 'CN';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'cn-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = chinaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[103.985, 34.990], [104.015, 34.990], [104.015, 35.010], [103.985, 35.010], [103.985, 34.990]]] };
      feature.source = { ...feature.source, sourceId: 'cn-synthetic-derived-postal-context-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [CHINA_POSTAL_CONTEXT_TEST_POINT.longitude, CHINA_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[103.99992, 34.99994], [104.00008, 34.99994], [104.00008, 35.00006], [103.99992, 35.00006], [103.99992, 34.99994]]] };
    }
    return feature;
  });
  return pack;
}
