import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const CAMBODIA_POSTAL_CONTEXT_TEST_POINT = { latitude: 12.5000, longitude: 104.9000 } as const;
export const CAMBODIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function cambodiaSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'kh-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'kh-') };
}

export function createCambodiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-kh-syn-999999'], ['country-jp', 'country-kh'],
    ['prefecture-synthetic', 'province-kh-synthetic'], ['locality-synthetic', 'commune-kh-synthetic'],
    ['agid-synthetic-cover', 'agid-kh-synthetic-cover'], ['address-point-synthetic', 'civic-address-point-kh-synthetic'],
    ['premise-synthetic', 'civic-address-kh-synthetic'], ['building-synthetic', 'building-kh-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'KH';
    if (node.id === 'postal-kh-syn-999999') { node.postalCode = '999999'; node.label = 'Synthetic Cambodia six-digit postcode 999999'; }
    else if (node.id === 'country-kh') node.label = 'Cambodia';
    else if (node.id === 'province-kh-synthetic') node.label = 'Synthetic Cambodia province context';
    else if (node.id === 'commune-kh-synthetic') node.label = 'Synthetic Cambodia commune context';
    else if (node.id === 'agid-kh-synthetic-cover') { node.agidCellId = 'KH0000000000'; node.label = 'Synthetic Cambodia AGID cover'; }
    else if (node.id === 'civic-address-kh-synthetic') node.label = 'Synthetic rights-cleared Cambodia civic address KH-SYN-CIVIC-99';
    else if (node.id === 'building-kh-synthetic') node.label = 'Synthetic explicitly address-linked Cambodia building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = 'kh-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = cambodiaSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-kh-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-kh-synthetic', countryCode: 'KH', releaseId: 'kh-synthetic-2026.01.1', policyVersion: 'cambodia-prakas-77-postal-context-v0.1' };
  pack.geometry.countryCode = 'KH';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'kh-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = cambodiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[104.885, 12.490], [104.915, 12.490], [104.915, 12.510], [104.885, 12.510], [104.885, 12.490]]] };
      feature.source = { ...feature.source, sourceId: 'kh-synthetic-derived-postal-context-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [CAMBODIA_POSTAL_CONTEXT_TEST_POINT.longitude, CAMBODIA_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[104.89992, 12.49994], [104.90008, 12.49994], [104.90008, 12.50006], [104.89992, 12.50006], [104.89992, 12.49994]]] };
    }
    return feature;
  });
  return pack;
}
