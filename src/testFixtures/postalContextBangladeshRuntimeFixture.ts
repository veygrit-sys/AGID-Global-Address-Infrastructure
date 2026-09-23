import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const BANGLADESH_POSTAL_CONTEXT_TEST_POINT = { latitude: 23.8103, longitude: 90.4125 } as const;
export const BANGLADESH_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function bangladeshSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'bd-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'bd-') };
}

export function createBangladeshPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-bd-syn-9999'],
    ['country-jp', 'country-bd'],
    ['prefecture-synthetic', 'division-bd-synthetic'],
    ['locality-synthetic', 'post-office-bd-synthetic'],
    ['agid-synthetic-cover', 'agid-bd-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-bd-synthetic'],
    ['premise-synthetic', 'civic-address-bd-synthetic'],
    ['building-synthetic', 'building-bd-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'BD';
    if (node.id === 'postal-bd-syn-9999') { node.postalCode = '9999'; node.label = 'Synthetic Bangladesh delivery-post-office assignment 9999'; }
    else if (node.id === 'country-bd') node.label = 'Bangladesh';
    else if (node.id === 'division-bd-synthetic') node.label = 'Synthetic Bangladesh Division';
    else if (node.id === 'post-office-bd-synthetic') node.label = 'Synthetic Bangladesh Post Office';
    else if (node.id === 'agid-bd-synthetic-cover') { node.agidCellId = 'BD0000000000'; node.label = 'Synthetic Bangladesh AGID cover'; }
    else if (node.id === 'civic-address-bd-synthetic') node.label = 'Synthetic House 1, Road 1, Delivery Post Office, explicit civic address BD-SYN-9999';
    else if (node.id === 'building-bd-synthetic') node.label = 'Synthetic explicitly linked Bangladesh building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'bd-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = bangladeshSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-bd-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-bd-synthetic', countryCode: 'BD', releaseId: 'bd-synthetic-2026.01.1', policyVersion: 'bangladesh-postcode-office-v0.1' };
  pack.geometry.countryCode = 'BD';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'bd-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = bangladeshSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[90.400, 23.800], [90.425, 23.800], [90.425, 23.821], [90.400, 23.821], [90.400, 23.800]]] };
      feature.source = { ...feature.source, sourceId: 'bd-synthetic-derived-delivery-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 300 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [BANGLADESH_POSTAL_CONTEXT_TEST_POINT.longitude, BANGLADESH_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[90.41242, 23.81024], [90.41258, 23.81024], [90.41258, 23.81036], [90.41242, 23.81036], [90.41242, 23.81024]]] };
    }
    return feature;
  });
  return pack;
}
