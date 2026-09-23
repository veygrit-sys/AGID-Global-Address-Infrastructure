import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const AFGHANISTAN_POSTAL_CONTEXT_TEST_POINT = { latitude: 34.0000, longitude: 66.0000 } as const;
export const AFGHANISTAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function afghanistanSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'af-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'af-') };
}

export function createAfghanistanPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-af-syn-999999'],
    ['country-jp', 'country-af'],
    ['prefecture-synthetic', 'province-af-synthetic'],
    ['locality-synthetic', 'district-delivery-zone-af-synthetic'],
    ['agid-synthetic-cover', 'agid-af-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-af-synthetic'],
    ['premise-synthetic', 'civic-address-af-synthetic'],
    ['building-synthetic', 'building-af-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'AF';
    if (node.id === 'postal-af-syn-999999') { node.postalCode = '999999'; node.label = 'Synthetic Afghanistan six-digit postal zone 999999'; }
    else if (node.id === 'country-af') node.label = 'Afghanistan';
    else if (node.id === 'province-af-synthetic') node.label = 'Synthetic Afghanistan Province';
    else if (node.id === 'district-delivery-zone-af-synthetic') node.label = 'Synthetic Afghanistan District and Delivery Zone';
    else if (node.id === 'agid-af-synthetic-cover') { node.agidCellId = 'AF0000000000'; node.label = 'Synthetic Afghanistan AGID cover'; }
    else if (node.id === 'civic-address-af-synthetic') node.label = 'Synthetic rights-cleared Afghanistan civic address AF-SYN-999999';
    else if (node.id === 'building-af-synthetic') node.label = 'Synthetic explicitly address-linked Afghanistan building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'af-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = afghanistanSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-af-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-af-synthetic', countryCode: 'AF', releaseId: 'af-synthetic-2026.01.1', policyVersion: 'afghanistan-six-digit-postal-zone-v0.1' };
  pack.geometry.countryCode = 'AF';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'af-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = afghanistanSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[65.985, 33.990], [66.015, 33.990], [66.015, 34.010], [65.985, 34.010], [65.985, 33.990]]] };
      feature.source = { ...feature.source, sourceId: 'af-synthetic-postal-delivery-zone-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [AFGHANISTAN_POSTAL_CONTEXT_TEST_POINT.longitude, AFGHANISTAN_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[65.99992, 33.99994], [66.00008, 33.99994], [66.00008, 34.00006], [65.99992, 34.00006], [65.99992, 33.99994]]] };
    }
    return feature;
  });
  return pack;
}
