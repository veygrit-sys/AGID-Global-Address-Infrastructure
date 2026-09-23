import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ISRAEL_POSTAL_CONTEXT_TEST_POINT = { latitude: 31.5000, longitude: 34.8000 } as const;
export const ISRAEL_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function israelSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'il-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'il-') };
}

export function createIsraelPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-il-syn-9999999'],
    ['country-jp', 'country-il'],
    ['prefecture-synthetic', 'district-il-synthetic'],
    ['locality-synthetic', 'locality-il-synthetic'],
    ['agid-synthetic-cover', 'agid-il-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-il-synthetic'],
    ['premise-synthetic', 'civic-address-il-synthetic'],
    ['building-synthetic', 'building-il-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'IL';
    if (node.id === 'postal-il-syn-9999999') { node.postalCode = '9999999'; node.label = 'Synthetic Israel seven-digit postal object 9999999'; }
    else if (node.id === 'country-il') node.label = 'Israel';
    else if (node.id === 'district-il-synthetic') node.label = 'Synthetic Israel administrative context';
    else if (node.id === 'locality-il-synthetic') node.label = 'Synthetic Israel locality context';
    else if (node.id === 'agid-il-synthetic-cover') { node.agidCellId = 'IL0000000000'; node.label = 'Synthetic Israel AGID cover'; }
    else if (node.id === 'civic-address-il-synthetic') node.label = 'Synthetic rights-cleared Israel civic address IL-SYN-9999999';
    else if (node.id === 'building-il-synthetic') node.label = 'Synthetic explicitly address-linked Israel building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'il-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = israelSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-il-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-il-synthetic', countryCode: 'IL', releaseId: 'il-synthetic-2026.01.1', policyVersion: 'israel-seven-digit-postal-object-v0.1' };
  pack.geometry.countryCode = 'IL';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'il-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = israelSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[34.785, 31.490], [34.815, 31.490], [34.815, 31.510], [34.785, 31.510], [34.785, 31.490]]] };
      feature.source = { ...feature.source, sourceId: 'il-synthetic-derived-postal-context-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [ISRAEL_POSTAL_CONTEXT_TEST_POINT.longitude, ISRAEL_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[34.79992, 31.49994], [34.80008, 31.49994], [34.80008, 31.50006], [34.79992, 31.50006], [34.79992, 31.49994]]] };
    }
    return feature;
  });
  return pack;
}
