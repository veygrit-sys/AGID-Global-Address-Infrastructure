import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const ETHIOPIA_POSTAL_CONTEXT_TEST_POINT = { latitude: 9.000123, longitude: 38.000123 } as const;
export const ETHIOPIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function ethiopiaSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'et-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'et-') };
}

export function createEthiopiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-et-syn-0999'],
    ['country-jp', 'country-et'],
    ['prefecture-synthetic', 'region-et-synthetic'],
    ['locality-synthetic', 'woreda-et-synthetic'],
    ['agid-synthetic-cover', 'agid-et-synthetic-cover'],
    ['address-point-synthetic', 'edas-address-point-et-synthetic'],
    ['premise-synthetic', 'edas-address-et-synthetic'],
    ['building-synthetic', 'edas-building-et-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'ET';
    if (node.id === 'postal-et-syn-0999') {
      node.postalCode = '0999';
      node.label = 'Synthetic Ethiopia typed four-digit postal object';
    } else if (node.id === 'country-et') node.label = 'Ethiopia';
    else if (node.id === 'region-et-synthetic') node.label = 'ሰው ሰራሽ ክልል';
    else if (node.id === 'woreda-et-synthetic') node.label = 'ሰው ሰራሽ ወረዳ';
    else if (node.id === 'agid-et-synthetic-cover') {
      node.agidCellId = 'ET0000000000';
      node.label = 'Synthetic Ethiopia AGID cover';
    } else if (node.id === 'edas-address-et-synthetic') node.label = 'ሰው ሰራሽ eDAS አድራሻ';
    else if (node.id === 'edas-building-et-synthetic') node.label = 'Synthetic explicitly eDAS-address-linked Ethiopian building';
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = 'et-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = ethiopiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-et-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-et-synthetic',
    countryCode: 'ET',
    releaseId: 'et-synthetic-2026.01.1',
    policyVersion: 'ethiopia-four-digit-postal-object-and-edas-v0.1',
  };

  pack.geometry.countryCode = 'ET';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'et-' + feature.id;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = ethiopiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[37.99, 8.99], [38.02, 8.99], [38.02, 9.02], [37.99, 9.02], [37.99, 8.99]]] };
      feature.source = { ...feature.source, sourceId: 'et-synthetic-derived-postal-review-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [ETHIOPIA_POSTAL_CONTEXT_TEST_POINT.longitude, ETHIOPIA_POSTAL_CONTEXT_TEST_POINT.latitude] };
      feature.source = { ...feature.source, sourceId: 'et-synthetic-edas-address-point' };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[38.00005, 9.00005], [38.00020, 9.00005], [38.00020, 9.00020], [38.00005, 9.00020], [38.00005, 9.00005]]] };
      feature.source = { ...feature.source, sourceId: 'et-synthetic-explicit-edas-building-link' };
    }
    return feature;
  });
  return pack;
}
