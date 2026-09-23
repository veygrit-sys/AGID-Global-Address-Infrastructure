import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createSenegalPostalContextRuntimeTestPack } from './postalContextSenegalRuntimeFixture';

export const TANZANIA_POSTAL_CONTEXT_TEST_POINT = { latitude: -6.7924, longitude: 39.2083 } as const;
export const TANZANIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function tanzaniaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^sn-/, 'tz-'),
    sourceVersion: source.sourceVersion?.replace(/^sn-/, 'tz-'),
  };
}

export function createTanzaniaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createSenegalPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-sn-syn-09997', 'postal-tz-syn-19999'],
    ['country-sn', 'country-tz'],
    ['region-sn-synthetic', 'region-tz-synthetic'],
    ['department-sn-synthetic', 'district-tz-synthetic'],
    ['agid-sn-synthetic-cover', 'agid-tz-synthetic-cover'],
    ['civic-address-point-sn-synthetic', 'civic-address-point-tz-synthetic'],
    ['civic-address-sn-synthetic', 'civic-address-tz-synthetic'],
    ['civic-address-building-sn-synthetic', 'civic-address-building-tz-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'TZ';
    if (node.id === 'postal-tz-syn-19999') {
      node.postalCode = '19999';
      node.label = 'Synthetic typed Tanzania administrative-area postcode';
    } else if (node.id === 'country-tz') node.label = 'United Republic of Tanzania';
    else if (node.id === 'region-tz-synthetic') node.label = 'Synthetic Region';
    else if (node.id === 'district-tz-synthetic') node.label = 'Synthetic District / Ward context';
    else if (node.id === 'agid-tz-synthetic-cover') {
      node.agidCellId = 'TZ0000000000';
      node.label = 'Synthetic Tanzania AGID cover';
    } else if (node.id === 'civic-address-tz-synthetic') {
      node.label = 'Synthetic LGA/NaPA civic address TZ-SYN-CIVIC-ADDRESS-19999';
    } else if (node.id === 'civic-address-building-tz-synthetic') {
      node.label = 'Synthetic explicitly rights-cleared LGA/NaPA-address-linked Tanzania building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^sn-/, 'tz-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = tanzaniaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-tz-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-tz-synthetic',
    countryCode: 'TZ',
    releaseId: 'tz-synthetic-2026.01.1',
    policyVersion: 'tanzania-typed-five-digit-ward-shehia-category-address-building-separation-v0.1',
  };
  pack.geometry.countryCode = 'TZ';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^sn-/, 'tz-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = tanzaniaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[[39.198, -6.802], [39.218, -6.802], [39.218, -6.782], [39.198, -6.782], [39.198, -6.802]]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'tz-synthetic-derived-administrative-postal-review-surface',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 500 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [TANZANIA_POSTAL_CONTEXT_TEST_POINT.longitude, TANZANIA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
      feature.source = { ...feature.source, sourceId: 'tz-synthetic-explicit-lga-napa-civic-address-point' };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[[39.20823, -6.79247], [39.20837, -6.79247], [39.20837, -6.79233], [39.20823, -6.79233], [39.20823, -6.79247]]],
      };
      feature.source = { ...feature.source, sourceId: 'tz-synthetic-explicit-lga-napa-address-building-link' };
    }
    return feature;
  });
  return pack;
}
