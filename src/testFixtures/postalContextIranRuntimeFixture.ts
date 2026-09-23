import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const IRAN_POSTAL_CONTEXT_TEST_POINT = { latitude: 32.0000, longitude: 53.0000 } as const;
export const IRAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function iranSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'ir-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ir-') };
}

export function createIranPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ir-syn-9999999999'], ['country-jp', 'country-ir'],
    ['prefecture-synthetic', 'province-ir-synthetic'], ['locality-synthetic', 'locality-ir-synthetic'],
    ['agid-synthetic-cover', 'agid-ir-synthetic-cover'], ['address-point-synthetic', 'civic-address-point-ir-synthetic'],
    ['premise-synthetic', 'civic-address-ir-synthetic'], ['building-synthetic', 'building-ir-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id; node.countryCode = 'IR';
    if (node.id === 'postal-ir-syn-9999999999') { node.postalCode = '9999999999'; node.label = 'Synthetic Iran ten-digit place identifier 9999999999'; }
    else if (node.id === 'country-ir') node.label = 'Iran';
    else if (node.id === 'province-ir-synthetic') node.label = 'Synthetic Iran province context';
    else if (node.id === 'locality-ir-synthetic') node.label = 'Synthetic Iran locality context';
    else if (node.id === 'agid-ir-synthetic-cover') { node.agidCellId = 'IR0000000000'; node.label = 'Synthetic Iran AGID cover'; }
    else if (node.id === 'civic-address-ir-synthetic') node.label = 'Synthetic rights-cleared Iran civic address IR-SYN-9999999999';
    else if (node.id === 'building-ir-synthetic') node.label = 'Synthetic explicitly address-linked Iran building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = 'ir-' + assertion.id; assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId; assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId; assertion.source = iranSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-ir-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-ir-synthetic', countryCode: 'IR', releaseId: 'ir-synthetic-2026.01.1', policyVersion: 'iran-ten-digit-place-identifier-v0.1' };
  pack.geometry.countryCode = 'IR'; pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'ir-' + feature.id; feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId; feature.source = iranSource(feature.source);
    if (feature.role === 'postal_area') { feature.geometry = { type: 'Polygon', coordinates: [[[52.985, 31.990], [53.015, 31.990], [53.015, 32.010], [52.985, 32.010], [52.985, 31.990]]] }; feature.source = { ...feature.source, sourceId: 'ir-synthetic-derived-postal-context-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' }; feature.quality = { status: 'derived', accuracyMeters: 1000 }; }
    else if (feature.role === 'address_point') feature.geometry = { type: 'Point', coordinates: [IRAN_POSTAL_CONTEXT_TEST_POINT.longitude, IRAN_POSTAL_CONTEXT_TEST_POINT.latitude] };
    else if (feature.role === 'building_footprint') feature.geometry = { type: 'Polygon', coordinates: [[[52.99992, 31.99994], [53.00008, 31.99994], [53.00008, 32.00006], [52.99992, 32.00006], [52.99992, 31.99994]]] };
    return feature;
  });
  return pack;
}
