import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const LEBANON_POSTAL_CONTEXT_TEST_POINT = { latitude: 33.6000, longitude: 35.7000 } as const;
export const LEBANON_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function lebanonSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'lb-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'lb-') };
}

export function createLebanonPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-lb-syn-9999'],
    ['country-jp', 'country-lb'],
    ['prefecture-synthetic', 'governorate-lb-synthetic'],
    ['locality-synthetic', 'district-locality-or-area-lb-synthetic'],
    ['agid-synthetic-cover', 'agid-lb-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-lb-synthetic'],
    ['premise-synthetic', 'civic-address-lb-synthetic'],
    ['building-synthetic', 'building-lb-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'LB';
    if (node.id === 'postal-lb-syn-9999') { node.postalCode = '9999'; node.label = 'Synthetic Lebanon postal context 9999'; }
    else if (node.id === 'country-lb') node.label = 'Lebanon';
    else if (node.id === 'governorate-lb-synthetic') node.label = 'Synthetic Lebanon Governorate';
    else if (node.id === 'district-locality-or-area-lb-synthetic') node.label = 'Synthetic Lebanon District, Locality or Area';
    else if (node.id === 'agid-lb-synthetic-cover') { node.agidCellId = 'LB0000000000'; node.label = 'Synthetic Lebanon AGID cover'; }
    else if (node.id === 'civic-address-lb-synthetic') node.label = 'Synthetic rights-cleared Lebanon civic address LB-SYN-9999';
    else if (node.id === 'building-lb-synthetic') node.label = 'Synthetic explicitly address-linked Lebanon building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'lb-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = lebanonSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-lb-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-lb-synthetic', countryCode: 'LB', releaseId: 'lb-synthetic-2026.01.1', policyVersion: 'lebanon-postal-nac-address-v0.1' };
  pack.geometry.countryCode = 'LB';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'lb-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = lebanonSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[35.685, 33.590], [35.715, 33.590], [35.715, 33.610], [35.685, 33.610], [35.685, 33.590]]] };
      feature.source = { ...feature.source, sourceId: 'lb-synthetic-postal-administrative-join-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [LEBANON_POSTAL_CONTEXT_TEST_POINT.longitude, LEBANON_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[35.69992, 33.59994], [35.70008, 33.59994], [35.70008, 33.60006], [35.69992, 33.60006], [35.69992, 33.59994]]] };
    }
    return feature;
  });
  return pack;
}
