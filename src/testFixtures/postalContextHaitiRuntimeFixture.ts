import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createColombiaPostalContextRuntimeTestPack } from './postalContextColombiaRuntimeFixture';

export const HAITI_POSTAL_CONTEXT_TEST_POINT = { latitude: 18.5500, longitude: -72.3000 } as const;
export const HAITI_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function haitiSource(value: PostalContextSource): PostalContextSource { return { ...value, sourceId: value.sourceId.replace(/^co-/, 'ht-'), sourceVersion: value.sourceVersion?.replace(/^co-/, 'ht-') }; }

export function createHaitiPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createColombiaPostalContextRuntimeTestPack());
  const ids = new Map<string, string>([['postal-co-syn-999999','postal-ht-syn-ht9999'],['country-co','country-ht'],['department-co-synthetic','department-ht-synthetic'],['municipality-co-synthetic','commune-ht-synthetic'],['agid-co-synthetic-cover','agid-ht-synthetic-cover'],['civic-address-point-co-synthetic','civic-address-point-ht-synthetic'],['civic-address-co-synthetic','civic-address-ht-synthetic'],['construction-co-synthetic','building-ht-synthetic']]);
  for (const node of pack.graph.nodes) {
    node.id = ids.get(node.id) ?? node.id; node.countryCode = 'HT';
    if (node.id === 'postal-ht-syn-ht9999') { node.postalCode = 'HT9999'; node.label = 'Synthetic Haiti derived-review postal area HT9999'; }
    else if (node.id === 'country-ht') node.label = 'Haiti';
    else if (node.id === 'department-ht-synthetic') node.label = 'Synthetic Haitian department context';
    else if (node.id === 'commune-ht-synthetic') node.label = 'Synthetic Haitian commune context';
    else if (node.id === 'agid-ht-synthetic-cover') { node.agidCellId = 'HT0000000000'; node.label = 'Synthetic Haitian AGID cover'; }
    else if (node.id === 'civic-address-ht-synthetic') node.label = 'Synthetic rights-cleared Haitian civic address HT-SYN-CIVIC-999';
    else if (node.id === 'building-ht-synthetic') node.label = 'Synthetic explicitly address-linked Haitian building';
  }
  for (const assertion of pack.graph.assertions) { assertion.id = assertion.id.replace(/^co-/, 'ht-'); assertion.fromNodeId = ids.get(assertion.fromNodeId) ?? assertion.fromNodeId; assertion.toNodeId = ids.get(assertion.toNodeId) ?? assertion.toNodeId; assertion.source = haitiSource(assertion.source); }
  pack.graph.release = { ...pack.graph.release, repositoryId: 'agid-postal-ht-synthetic', repositoryUrl: 'https://example.invalid/agid-postal-ht-synthetic', countryCode: 'HT', releaseId: 'ht-synthetic-2026.01.1', policyVersion: 'haiti-postal-context-v0.1' };
  pack.geometry.countryCode = 'HT'; pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^co-/, 'ht-'); feature.nodeId = ids.get(feature.nodeId) ?? feature.nodeId; feature.source = haitiSource(feature.source);
    if (feature.role === 'postal_area') { feature.geometry = { type: 'Polygon', coordinates: [[[-72.315,18.540],[-72.285,18.540],[-72.285,18.560],[-72.315,18.560],[-72.315,18.540]]] }; feature.source = { ...feature.source, sourceId: 'ht-synthetic-derived-postal-validation-polygon', assignmentAuthority: 'synthetic_fixture_assignment', geometryAuthority: 'synthetic_fixture_geometry' }; feature.quality = { status: 'derived', accuracyMeters: 1000 }; }
    else if (feature.role === 'address_point') feature.geometry = { type: 'Point', coordinates: [HAITI_POSTAL_CONTEXT_TEST_POINT.longitude, HAITI_POSTAL_CONTEXT_TEST_POINT.latitude] };
    else if (feature.role === 'building_footprint') feature.geometry = { type: 'Polygon', coordinates: [[[-72.30008,18.54994],[-72.29992,18.54994],[-72.29992,18.55006],[-72.30008,18.55006],[-72.30008,18.54994]]] };
    return feature;
  });
  return pack;
}
