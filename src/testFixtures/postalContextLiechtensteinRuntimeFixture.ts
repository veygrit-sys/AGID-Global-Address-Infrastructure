import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const LIECHTENSTEIN_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 47.141,
  longitude: 9.5209,
} as const;

export const LIECHTENSTEIN_POSTAL_CONTEXT_TEST_INSTANT = '2026-06-01T00:00:00.000Z';

function liechtensteinSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'li-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'li-'),
  };
}

export function createLiechtensteinPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-li-syn-9400'],
    ['country-jp', 'country-li'],
    ['prefecture-synthetic', 'municipality-li-synthetic'],
    ['locality-synthetic', 'locality-li-synthetic'],
    ['agid-synthetic-cover', 'agid-li-synthetic-cover'],
    ['address-point-synthetic', 'llv-address-li-synthetic'],
    ['premise-synthetic', 'entrance-li-synthetic'],
    ['building-synthetic', 'llv-gwr-building-li-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'LI';
    if (node.id === 'postal-li-syn-9400') {
      node.postalCode = '9400';
      node.label = 'Synthetic LI-classified PLZO domicile perimeter';
    } else if (node.id === 'country-li') {
      node.label = 'Liechtenstein';
    } else if (node.id === 'municipality-li-synthetic') {
      node.label = 'Synthetic Municipality';
    } else if (node.id === 'locality-li-synthetic') {
      node.label = 'Synthetic Locality';
    } else if (node.id === 'agid-li-synthetic-cover') {
      node.agidCellId = 'LI0000000000';
      node.label = 'Synthetic Liechtenstein AGID cover';
    } else if (node.id === 'entrance-li-synthetic') {
      node.label = 'Teststrasse 1';
    } else if (node.id === 'llv-gwr-building-li-synthetic') {
      node.label = 'Synthetic explicitly linked LLV GWR building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `li-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = liechtensteinSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-li-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-li-synthetic',
    countryCode: 'LI',
    releaseId: 'li-synthetic-2026.01.1',
    policyVersion: 'li-plzo-llv-building-v0.1',
  };

  pack.geometry.countryCode = 'LI';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `li-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = liechtensteinSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [9.5109, 47.131],
          [9.5309, 47.131],
          [9.5309, 47.151],
          [9.5109, 47.151],
          [9.5109, 47.131],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'li-synthetic-swisstopo-plzo',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 10 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          LIECHTENSTEIN_POSTAL_CONTEXT_TEST_POINT.longitude,
          LIECHTENSTEIN_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [9.52086, 47.14096],
          [9.52094, 47.14096],
          [9.52094, 47.14104],
          [9.52086, 47.14104],
          [9.52086, 47.14096],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
