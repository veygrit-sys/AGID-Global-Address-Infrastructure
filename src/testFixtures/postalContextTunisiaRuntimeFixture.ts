import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createTanzaniaPostalContextRuntimeTestPack } from './postalContextTanzaniaRuntimeFixture';

export const TUNISIA_POSTAL_CONTEXT_TEST_POINT = { latitude: 36.8065, longitude: 10.1815 } as const;
export const TUNISIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function tunisiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^tz-/, 'tn-'),
    sourceVersion: source.sourceVersion?.replace(/^tz-/, 'tn-'),
  };
}

export function createTunisiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createTanzaniaPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-tz-syn-19999', 'postal-tn-syn-0996'],
    ['country-tz', 'country-tn'],
    ['region-tz-synthetic', 'governorate-tn-synthetic'],
    ['district-tz-synthetic', 'delegation-tn-synthetic'],
    ['agid-tz-synthetic-cover', 'agid-tn-synthetic-cover'],
    ['civic-address-point-tz-synthetic', 'civic-address-point-tn-synthetic'],
    ['civic-address-tz-synthetic', 'civic-address-tn-synthetic'],
    ['civic-address-building-tz-synthetic', 'civic-address-building-tn-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'TN';
    if (node.id === 'postal-tn-syn-0996') {
      node.postalCode = '0996';
      node.label = 'Synthetic current-observation-shaped La Poste delivery-office/locality assignment';
    } else if (node.id === 'country-tn') node.label = 'Tunisia';
    else if (node.id === 'governorate-tn-synthetic') node.label = 'Synthetic Governorate';
    else if (node.id === 'delegation-tn-synthetic') node.label = 'Synthetic Delegation / Locality context';
    else if (node.id === 'agid-tn-synthetic-cover') {
      node.agidCellId = 'TN0000000000';
      node.label = 'Synthetic Tunisia AGID cover';
    } else if (node.id === 'civic-address-tn-synthetic') {
      node.label = 'Synthetic rights-cleared civic address TN-SYN-CIVIC-ADDRESS-0996';
    } else if (node.id === 'civic-address-building-tn-synthetic') {
      node.label = 'Synthetic explicitly rights-cleared civic-address-linked Tunisia building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^tz-/, 'tn-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = tunisiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-tn-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-tn-synthetic',
    countryCode: 'TN',
    releaseId: 'tn-synthetic-2026.01.1',
    policyVersion: 'tunisia-four-digit-delivery-office-admin-address-building-separation-v0.1',
  };
  pack.geometry.countryCode = 'TN';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^tz-/, 'tn-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = tunisiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[[10.171, 36.796], [10.192, 36.796], [10.192, 36.817], [10.171, 36.817], [10.171, 36.796]]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'tn-synthetic-derived-administrative-postal-review-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 600 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [TUNISIA_POSTAL_CONTEXT_TEST_POINT.longitude, TUNISIA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
      feature.source = { ...feature.source, sourceId: 'tn-synthetic-explicit-civic-address-point' };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[[10.18143, 36.80643], [10.18157, 36.80643], [10.18157, 36.80657], [10.18143, 36.80657], [10.18143, 36.80643]]],
      };
      feature.source = { ...feature.source, sourceId: 'tn-synthetic-explicit-address-building-link' };
    }
    return feature;
  });
  return pack;
}
