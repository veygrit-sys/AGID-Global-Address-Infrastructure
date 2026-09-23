import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const LAOS_POSTAL_CONTEXT_TEST_POINT = { latitude: 18.0000, longitude: 103.0000 } as const;
export const LAOS_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function laosSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'la-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'la-') };
}

export function createLaosPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-la-syn-99999'],
    ['country-jp', 'country-la'],
    ['prefecture-synthetic', 'province-la-synthetic'],
    ['locality-synthetic', 'district-village-or-route-la-synthetic'],
    ['agid-synthetic-cover', 'agid-la-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-la-synthetic'],
    ['premise-synthetic', 'civic-address-la-synthetic'],
    ['building-synthetic', 'building-la-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'LA';
    if (node.id === 'postal-la-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic Laos five-digit delivery scope 99999'; }
    else if (node.id === 'country-la') node.label = 'Laos';
    else if (node.id === 'province-la-synthetic') node.label = 'Synthetic Laos Province';
    else if (node.id === 'district-village-or-route-la-synthetic') node.label = 'Synthetic Laos District, Village or Mail Route';
    else if (node.id === 'agid-la-synthetic-cover') { node.agidCellId = 'LA0000000000'; node.label = 'Synthetic Laos AGID cover'; }
    else if (node.id === 'civic-address-la-synthetic') node.label = 'Synthetic rights-cleared Laos civic address LA-SYN-99999';
    else if (node.id === 'building-la-synthetic') node.label = 'Synthetic explicitly address-linked Laos building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'la-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = laosSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-la-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-la-synthetic', countryCode: 'LA', releaseId: 'la-synthetic-2026.01.1', policyVersion: 'laos-five-digit-delivery-scope-v0.1' };
  pack.geometry.countryCode = 'LA';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'la-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = laosSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[102.985, 17.990], [103.015, 17.990], [103.015, 18.010], [102.985, 18.010], [102.985, 17.990]]] };
      feature.source = { ...feature.source, sourceId: 'la-synthetic-delivery-administrative-join-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [LAOS_POSTAL_CONTEXT_TEST_POINT.longitude, LAOS_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[102.99992, 17.99994], [103.00008, 17.99994], [103.00008, 18.00006], [102.99992, 18.00006], [102.99992, 17.99994]]] };
    }
    return feature;
  });
  return pack;
}
