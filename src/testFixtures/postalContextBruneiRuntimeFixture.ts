import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const BRUNEI_POSTAL_CONTEXT_TEST_POINT = { latitude: 4.9000, longitude: 114.9400 } as const;
export const BRUNEI_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function bruneiSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'bn-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'bn-') };
}

export function createBruneiPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-bn-syn-bz9999'],
    ['country-jp', 'country-bn'],
    ['prefecture-synthetic', 'district-bn-synthetic'],
    ['locality-synthetic', 'kampong-bn-synthetic'],
    ['agid-synthetic-cover', 'agid-bn-synthetic-cover'],
    ['address-point-synthetic', 'house-number-point-bn-synthetic'],
    ['premise-synthetic', 'civic-address-bn-synthetic'],
    ['building-synthetic', 'building-bn-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'BN';
    if (node.id === 'postal-bn-syn-bz9999') { node.postalCode = 'BZ9999'; node.label = 'Synthetic Brunei Postal Services routing assignment BZ9999'; }
    else if (node.id === 'country-bn') node.label = 'Brunei';
    else if (node.id === 'district-bn-synthetic') node.label = 'Synthetic Brunei District';
    else if (node.id === 'kampong-bn-synthetic') node.label = 'Synthetic Brunei Kampong';
    else if (node.id === 'agid-bn-synthetic-cover') { node.agidCellId = 'BN0000000000'; node.label = 'Synthetic Brunei AGID cover'; }
    else if (node.id === 'civic-address-bn-synthetic') node.label = 'Synthetic Unit 1, House 1, Simpang 1, Jalan 1, explicit Survey house-numbering address BN-SYN-BZ9999';
    else if (node.id === 'building-bn-synthetic') node.label = 'Synthetic explicitly linked Brunei building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'bn-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = bruneiSource(assertion.source);
  }

  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-bn-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-bn-synthetic', countryCode: 'BN', releaseId: 'bn-synthetic-2026.01.1', policyVersion: 'brunei-postcode-routing-v0.1' };
  pack.geometry.countryCode = 'BN';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'bn-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = bruneiSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[114.925, 4.890], [114.955, 4.890], [114.955, 4.910], [114.925, 4.910], [114.925, 4.890]]] };
      feature.source = { ...feature.source, sourceId: 'bn-synthetic-derived-delivery-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [BRUNEI_POSTAL_CONTEXT_TEST_POINT.longitude, BRUNEI_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[114.93992, 4.89994], [114.94008, 4.89994], [114.94008, 4.90006], [114.93992, 4.90006], [114.93992, 4.89994]]] };
    }
    return feature;
  });
  return pack;
}
