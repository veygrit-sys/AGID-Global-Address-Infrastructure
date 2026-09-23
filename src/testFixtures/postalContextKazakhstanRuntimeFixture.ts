import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const KAZAKHSTAN_POSTAL_CONTEXT_TEST_POINT = { latitude: 48.0000, longitude: 67.0000 } as const;
export const KAZAKHSTAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function kazakhstanSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'kz-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'kz-') };
}

export function createKazakhstanPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-kz-syn-X99X9X9'], ['country-jp', 'country-kz'],
    ['prefecture-synthetic', 'province-kz-synthetic'], ['locality-synthetic', 'locality-kz-synthetic'],
    ['agid-synthetic-cover', 'agid-kz-synthetic-cover'], ['address-point-synthetic', 'civic-address-point-kz-synthetic'],
    ['premise-synthetic', 'civic-address-kz-synthetic'], ['building-synthetic', 'building-kz-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'KZ';
    if (node.id === 'postal-kz-syn-X99X9X9') { node.postalCode = 'X99X9X9'; node.label = 'Synthetic Kazakhstan current alphanumeric postcode X99X9X9'; }
    else if (node.id === 'country-kz') node.label = 'Kazakhstan';
    else if (node.id === 'province-kz-synthetic') node.label = 'Synthetic Kazakhstan province context';
    else if (node.id === 'locality-kz-synthetic') node.label = 'Synthetic Kazakhstan locality context';
    else if (node.id === 'agid-kz-synthetic-cover') { node.agidCellId = 'KZ0000000000'; node.label = 'Synthetic Kazakhstan AGID cover'; }
    else if (node.id === 'civic-address-kz-synthetic') node.label = 'Synthetic rights-cleared Kazakhstan civic address KZ-SYN-X99X9X9';
    else if (node.id === 'building-kz-synthetic') node.label = 'Synthetic explicitly address-linked Kazakhstan building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = 'kz-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = kazakhstanSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-kz-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-kz-synthetic', countryCode: 'KZ', releaseId: 'kz-synthetic-2026.01.1', policyVersion: 'kazakhstan-dual-postcode-transition-v0.1' };
  pack.geometry.countryCode = 'KZ';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'kz-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = kazakhstanSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[66.985, 47.990], [67.015, 47.990], [67.015, 48.010], [66.985, 48.010], [66.985, 47.990]]] };
      feature.source = { ...feature.source, sourceId: 'kz-synthetic-derived-postal-context-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [KAZAKHSTAN_POSTAL_CONTEXT_TEST_POINT.longitude, KAZAKHSTAN_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[66.99992, 47.99994], [67.00008, 47.99994], [67.00008, 48.00006], [66.99992, 48.00006], [66.99992, 47.99994]]] };
    }
    return feature;
  });
  return pack;
}
