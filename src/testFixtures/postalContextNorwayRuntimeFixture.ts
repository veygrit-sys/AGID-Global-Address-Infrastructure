import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const NORWAY_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 59.9139,
  longitude: 10.7522,
} as const;

export const NORWAY_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function norwaySource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'no-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'no-'),
  };
}

export function createNorwayPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-no-syn-0000'],
    ['country-jp', 'country-no'],
    ['prefecture-synthetic', 'county-no-synthetic'],
    ['locality-synthetic', 'municipality-no-synthetic'],
    ['agid-synthetic-cover', 'agid-no-synthetic-cover'],
    ['address-point-synthetic', 'matrikkelen-address-point-no-synthetic'],
    ['premise-synthetic', 'matrikkelen-unit-address-no-synthetic'],
    ['building-synthetic', 'fkb-building-no-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'NO';
    if (node.id === 'postal-no-syn-0000') {
      node.postalCode = '0000';
      node.label = 'Synthetic Kartverket-style postcode area';
    } else if (node.id === 'country-no') {
      node.label = 'Norway';
    } else if (node.id === 'county-no-synthetic') {
      node.label = 'Synthetic County';
    } else if (node.id === 'municipality-no-synthetic') {
      node.label = 'Synthetic Kommune';
    } else if (node.id === 'agid-no-synthetic-cover') {
      node.agidCellId = 'NO0000000000';
      node.label = 'Synthetic Norway AGID cover';
    } else if (node.id === 'matrikkelen-unit-address-no-synthetic') {
      node.label = 'Prøvegata 1A, H0101';
    } else if (node.id === 'fkb-building-no-synthetic') {
      node.label = 'Synthetic FKB building linked by Matrikkelen building number';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `no-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = norwaySource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-no-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-no-synthetic',
    countryCode: 'NO',
    releaseId: 'no-synthetic-2026.01.1',
    policyVersion: 'norway-posten-kartverket-matrikkelen-fkb-v0.1',
  };

  pack.geometry.countryCode = 'NO';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `no-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = norwaySource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [10.735, 59.902],
          [10.769, 59.902],
          [10.769, 59.926],
          [10.735, 59.926],
          [10.735, 59.902],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'no-synthetic-kartverket-postcode-area',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'verified', accuracyMeters: 5 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          NORWAY_POSTAL_CONTEXT_TEST_POINT.longitude,
          NORWAY_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [10.75212, 59.91384],
          [10.75228, 59.91384],
          [10.75228, 59.91396],
          [10.75212, 59.91396],
          [10.75212, 59.91384],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
