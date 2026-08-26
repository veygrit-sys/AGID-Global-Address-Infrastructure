import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const COLOMBIA_POSTAL_CONTEXT_TEST_POINT = { latitude: 4.6500, longitude: -74.1000 } as const;
export const COLOMBIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function colombiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'co-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'co-'),
  };
}

export function createColombiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-co-syn-999999'],
    ['country-jp', 'country-co'],
    ['prefecture-synthetic', 'department-co-synthetic'],
    ['locality-synthetic', 'municipality-co-synthetic'],
    ['agid-synthetic-cover', 'agid-co-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-co-synthetic'],
    ['premise-synthetic', 'civic-address-co-synthetic'],
    ['building-synthetic', 'construction-co-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'CO';
    if (node.id === 'postal-co-syn-999999') {
      node.postalCode = '999999';
      node.label = 'Synthetic Colombia official-release-like postcode object 999999';
    } else if (node.id === 'country-co') {
      node.label = 'Colombia';
    } else if (node.id === 'department-co-synthetic') {
      node.label = 'Synthetic Colombia department context';
    } else if (node.id === 'municipality-co-synthetic') {
      node.label = 'Synthetic Colombia municipality context';
    } else if (node.id === 'agid-co-synthetic-cover') {
      node.agidCellId = 'CO0000000000';
      node.label = 'Synthetic Colombia AGID cover';
    } else if (node.id === 'civic-address-co-synthetic') {
      node.label = 'Synthetic rights-cleared Colombia civic address CO-SYN-CIVIC-999';
    } else if (node.id === 'construction-co-synthetic') {
      node.label = 'Synthetic explicitly address-linked Colombia construction';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `co-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = colombiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-co-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-co-synthetic',
    countryCode: 'CO',
    releaseId: 'co-synthetic-2026.01.1',
    policyVersion: 'colombia-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'CO';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `co-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = colombiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-74.115, 4.640], [-74.085, 4.640], [-74.085, 4.660],
          [-74.115, 4.660], [-74.115, 4.640],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'co-synthetic-official-release-like-validation-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [COLOMBIA_POSTAL_CONTEXT_TEST_POINT.longitude, COLOMBIA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-74.10008, 4.64994], [-74.09992, 4.64994], [-74.09992, 4.65006],
          [-74.10008, 4.65006], [-74.10008, 4.64994],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
