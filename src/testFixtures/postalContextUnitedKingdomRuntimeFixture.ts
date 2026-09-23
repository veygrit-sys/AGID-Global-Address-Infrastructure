import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const UNITED_KINGDOM_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 51.5,
  longitude: -0.12,
} as const;

export const UNITED_KINGDOM_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function unitedKingdomSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'gb-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'gb-'),
  };
}

export function createUnitedKingdomPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-gb-syn-zz00zz'],
    ['country-jp', 'country-gb'],
    ['prefecture-synthetic', 'nation-gb-synthetic'],
    ['locality-synthetic', 'locality-gb-synthetic'],
    ['agid-synthetic-cover', 'agid-gb-synthetic-cover'],
    ['address-point-synthetic', 'address-point-gb-synthetic'],
    ['premise-synthetic', 'premise-gb-synthetic'],
    ['building-synthetic', 'building-gb-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'GB';
    if (node.id === 'postal-gb-syn-zz00zz') {
      node.postalCode = 'ZZ0 0ZZ';
      node.label = 'Synthetic unit-postcode derived area';
    } else if (node.id === 'country-gb') {
      node.label = 'United Kingdom';
    } else if (node.id === 'nation-gb-synthetic') {
      node.label = 'Synthetic Nation';
    } else if (node.id === 'locality-gb-synthetic') {
      node.label = 'Synthetic Post Town';
    } else if (node.id === 'agid-gb-synthetic-cover') {
      node.agidCellId = 'GB0000000000';
      node.label = 'Synthetic United Kingdom AGID cover';
    } else if (node.id === 'premise-gb-synthetic') {
      node.label = '1 Synthetic Street';
    } else if (node.id === 'building-gb-synthetic') {
      node.label = 'Synthetic Addressable Building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `gb-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = unitedKingdomSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-gb-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-gb-synthetic',
    countryCode: 'GB',
    releaseId: 'gb-synthetic-2026.01.1',
    policyVersion: 'gb-unit-postcode-v0.1',
  };

  pack.geometry.countryCode = 'GB';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `gb-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = unitedKingdomSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-0.13, 51.49],
          [-0.11, 51.49],
          [-0.11, 51.51],
          [-0.13, 51.51],
          [-0.13, 51.49],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'gb-synthetic-derived-postcode-area',
        assignmentAuthority: 'none',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          UNITED_KINGDOM_POSTAL_CONTEXT_TEST_POINT.longitude,
          UNITED_KINGDOM_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-0.12002, 51.49998],
          [-0.11998, 51.49998],
          [-0.11998, 51.50002],
          [-0.12002, 51.50002],
          [-0.12002, 51.49998],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
