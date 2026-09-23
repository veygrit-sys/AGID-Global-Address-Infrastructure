import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ARGENTINA_POSTAL_CONTEXT_TEST_POINT = { latitude: -38.5000, longitude: -64.0000 } as const;
export const ARGENTINA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function argentinaSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'ar-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'ar-') };
}

export function createArgentinaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-ar-syn-z9999zzz'], ['country-jp', 'country-ar'],
    ['prefecture-synthetic', 'province-ar-synthetic'], ['locality-synthetic', 'locality-ar-synthetic'],
    ['agid-synthetic-cover', 'agid-ar-synthetic-cover'], ['address-point-synthetic', 'civic-address-point-ar-synthetic'],
    ['premise-synthetic', 'civic-address-ar-synthetic'], ['building-synthetic', 'building-ar-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'AR';
    if (node.id === 'postal-ar-syn-z9999zzz') { node.postalCode = 'Z9999ZZZ'; node.label = 'Synthetic Argentina CPA object Z9999ZZZ'; }
    else if (node.id === 'country-ar') node.label = 'Argentina';
    else if (node.id === 'province-ar-synthetic') node.label = 'Synthetic Argentina province context';
    else if (node.id === 'locality-ar-synthetic') node.label = 'Synthetic Argentina locality context';
    else if (node.id === 'agid-ar-synthetic-cover') { node.agidCellId = 'AR0000000000'; node.label = 'Synthetic Argentina AGID cover'; }
    else if (node.id === 'civic-address-ar-synthetic') node.label = 'Synthetic rights-cleared Argentina civic address AR-SYN-CIVIC-99';
    else if (node.id === 'building-ar-synthetic') node.label = 'Synthetic explicitly address-linked Argentina building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = 'ar-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = argentinaSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-ar-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-ar-synthetic', countryCode: 'AR', releaseId: 'ar-synthetic-2026.01.1', policyVersion: 'argentina-postal-context-v0.1' };
  pack.geometry.countryCode = 'AR'; pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'ar-' + feature.id; feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId; feature.source = argentinaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-64.015, -38.510], [-63.985, -38.510], [-63.985, -38.490], [-64.015, -38.490], [-64.015, -38.510]]] };
      feature.source = { ...feature.source, sourceId: 'ar-synthetic-derived-street-face-like-validation-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [ARGENTINA_POSTAL_CONTEXT_TEST_POINT.longitude, ARGENTINA_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-64.00008, -38.50006], [-63.99992, -38.50006], [-63.99992, -38.49994], [-64.00008, -38.49994], [-64.00008, -38.50006]]] };
    }
    return feature;
  });
  return pack;
}
