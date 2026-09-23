import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const UNITED_STATES_POSTAL_CONTEXT_TEST_POINT = { latitude: 38.5000, longitude: -98.5000 } as const;
export const UNITED_STATES_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function unitedStatesSource(source: PostalContextSource): PostalContextSource {
  return { ...source, sourceId: source.sourceId.replace(/^jp-/, 'us-'), sourceVersion: source.sourceVersion?.replace(/^jp-/, 'us-') };
}

export function createUnitedStatesPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-us-syn-99999'], ['country-jp', 'country-us'],
    ['prefecture-synthetic', 'state-us-synthetic'], ['locality-synthetic', 'locality-us-synthetic'],
    ['agid-synthetic-cover', 'agid-us-synthetic-cover'], ['address-point-synthetic', 'civic-address-point-us-synthetic'],
    ['premise-synthetic', 'civic-address-us-synthetic'], ['building-synthetic', 'building-us-synthetic'],
  ]);
  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'US';
    if (node.id === 'postal-us-syn-99999') { node.postalCode = '99999'; node.label = 'Synthetic United States five-digit ZIP object 99999'; }
    else if (node.id === 'country-us') node.label = 'United States';
    else if (node.id === 'state-us-synthetic') node.label = 'Synthetic United States state context';
    else if (node.id === 'locality-us-synthetic') node.label = 'Synthetic United States locality context';
    else if (node.id === 'agid-us-synthetic-cover') { node.agidCellId = 'US0000000000'; node.label = 'Synthetic United States AGID cover'; }
    else if (node.id === 'civic-address-us-synthetic') node.label = 'Synthetic rights-cleared United States civic address US-SYN-CIVIC-99';
    else if (node.id === 'building-us-synthetic') node.label = 'Synthetic explicitly address-linked United States building';
  }
  for (const assertion of pack.graph.assertions) {
    assertion.id = 'us-' + assertion.id;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = unitedStatesSource(assertion.source);
  }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-us-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-us-synthetic', countryCode: 'US', releaseId: 'us-synthetic-2026.01.1', policyVersion: 'united-states-postal-context-v0.1' };
  pack.geometry.countryCode = 'US'; pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = 'us-' + feature.id; feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId; feature.source = unitedStatesSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-98.515, 38.490], [-98.485, 38.490], [-98.485, 38.510], [-98.515, 38.510], [-98.515, 38.490]]] };
      feature.source = { ...feature.source, sourceId: 'us-synthetic-derived-zcta-like-validation-surface', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = { type: 'Point', coordinates: [UNITED_STATES_POSTAL_CONTEXT_TEST_POINT.longitude, UNITED_STATES_POSTAL_CONTEXT_TEST_POINT.latitude] };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = { type: 'Polygon', coordinates: [[[-98.50008, 38.49994], [-98.49992, 38.49994], [-98.49992, 38.50006], [-98.50008, 38.50006], [-98.50008, 38.49994]]] };
    }
    return feature;
  });
  return pack;
}
