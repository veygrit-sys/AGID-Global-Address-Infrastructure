import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createTunisiaPostalContextRuntimeTestPack } from './postalContextTunisiaRuntimeFixture';

export const NIGERIA_POSTAL_CONTEXT_TEST_POINT = { latitude: 9.0765, longitude: 7.3986 } as const;
export const NIGERIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function nigeriaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^tn-/, 'ng-'),
    sourceVersion: source.sourceVersion?.replace(/^tn-/, 'ng-'),
  };
}

export function createNigeriaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createTunisiaPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-tn-syn-0996', 'postal-ng-syn-999996'],
    ['country-tn', 'country-ng'],
    ['governorate-tn-synthetic', 'state-or-fct-ng-synthetic'],
    ['delegation-tn-synthetic', 'lga-ng-synthetic'],
    ['agid-tn-synthetic-cover', 'agid-ng-synthetic-cover'],
    ['civic-address-point-tn-synthetic', 'civic-address-point-ng-synthetic'],
    ['civic-address-tn-synthetic', 'civic-address-ng-synthetic'],
    ['civic-address-building-tn-synthetic', 'civic-address-building-ng-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'NG';
    if (node.id === 'postal-ng-syn-999996') {
      node.postalCode = '999996';
      node.label = 'Synthetic current-numeric-assignment-shaped NIPOST district/delivery context';
    } else if (node.id === 'country-ng') node.label = 'Nigeria';
    else if (node.id === 'state-or-fct-ng-synthetic') node.label = 'Synthetic State / FCT';
    else if (node.id === 'lga-ng-synthetic') node.label = 'Synthetic LGA / District / Locality context';
    else if (node.id === 'agid-ng-synthetic-cover') {
      node.agidCellId = 'NG0000000000';
      node.label = 'Synthetic Nigeria AGID cover';
    } else if (node.id === 'civic-address-ng-synthetic') {
      node.label = 'Synthetic rights-cleared civic address NG-SYN-CIVIC-ADDRESS-999996';
    } else if (node.id === 'civic-address-building-ng-synthetic') {
      node.label = 'Synthetic explicitly rights-cleared civic-address-linked Nigeria building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^tn-/, 'ng-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = nigeriaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ng-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ng-synthetic',
    countryCode: 'NG',
    releaseId: 'ng-synthetic-2026.01.1',
    policyVersion: 'nigeria-current-six-digit-future-eleven-character-effective-time-admin-address-building-separation-v0.1',
  };
  pack.geometry.countryCode = 'NG';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^tn-/, 'ng-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = nigeriaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[[7.388, 9.066], [7.409, 9.066], [7.409, 9.087], [7.388, 9.087], [7.388, 9.066]]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ng-synthetic-derived-administrative-postal-review-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 800 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [NIGERIA_POSTAL_CONTEXT_TEST_POINT.longitude, NIGERIA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
      feature.source = { ...feature.source, sourceId: 'ng-synthetic-explicit-civic-address-point' };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[[7.39853, 9.07643], [7.39867, 9.07643], [7.39867, 9.07657], [7.39853, 9.07657], [7.39853, 9.07643]]],
      };
      feature.source = { ...feature.source, sourceId: 'ng-synthetic-explicit-address-building-link' };
    }
    return feature;
  });
  return pack;
}
