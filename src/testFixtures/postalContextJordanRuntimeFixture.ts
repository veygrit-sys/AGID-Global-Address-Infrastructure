import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const JORDAN_POSTAL_CONTEXT_TEST_POINT = { latitude: 31.9500, longitude: 35.9300 } as const;
export const JORDAN_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function jordanSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'jo-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'jo-') };
}

export function createJordanPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-jo-syn-99999'],
    ['country-jp', 'country-jo'],
    ['prefecture-synthetic', 'governorate-jo-synthetic'],
    ['locality-synthetic', 'locality-or-carrier-route-jo-synthetic'],
    ['agid-synthetic-cover', 'agid-jo-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-jo-synthetic'],
    ['premise-synthetic', 'civic-address-jo-synthetic'],
    ['building-synthetic', 'building-jo-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'JO';
    if (node.id === 'postal-jo-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic Jordan five-digit routing assignment 99999'; }
    else if (node.id === 'country-jo') node.label = 'Jordan';
    else if (node.id === 'governorate-jo-synthetic') node.label = 'Synthetic Jordan Governorate';
    else if (node.id === 'locality-or-carrier-route-jo-synthetic') node.label = 'Synthetic Jordan Locality or Carrier Route';
    else if (node.id === 'agid-jo-synthetic-cover') { node.agidCellId = 'JO0000000000'; node.label = 'Synthetic Jordan AGID cover'; }
    else if (node.id === 'civic-address-jo-synthetic') node.label = 'Synthetic rights-cleared Jordan civic address JO-SYN-99999';
    else if (node.id === 'building-jo-synthetic') node.label = 'Synthetic explicitly address-linked Jordan building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'jo-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = jordanSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-jo-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-jo-synthetic', countryCode: 'JO', releaseId: 'jo-synthetic-2026.01.1', policyVersion: 'jordan-five-digit-routing-locality-v0.1' };
  pack.geometry.countryCode = 'JO';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'jo-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = jordanSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[35.915, 31.940], [35.945, 31.940], [35.945, 31.960], [35.915, 31.960], [35.915, 31.940]]] };
      feature.source = { ...feature.source, sourceId: 'jo-synthetic-routing-administrative-join-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 800 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [JORDAN_POSTAL_CONTEXT_TEST_POINT.longitude, JORDAN_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[35.92992, 31.94994], [35.93008, 31.94994], [35.93008, 31.95006], [35.92992, 31.95006], [35.92992, 31.94994]]] };
    }
    return feature;
  });
  return pack;
}
