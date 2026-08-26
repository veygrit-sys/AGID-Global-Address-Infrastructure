import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const EL_SALVADOR_POSTAL_CONTEXT_TEST_POINT = { latitude: 13.7000, longitude: -89.2000 } as const;
export const EL_SALVADOR_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-26T00:00:00.000Z';

function elSalvadorSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'sv-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'sv-'),
  };
}

export function createElSalvadorPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-sv-syn-9999'],
    ['country-jp', 'country-sv'],
    ['prefecture-synthetic', 'department-sv-synthetic'],
    ['locality-synthetic', 'locality-sv-synthetic'],
    ['agid-synthetic-cover', 'agid-sv-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-sv-synthetic'],
    ['premise-synthetic', 'civic-address-sv-synthetic'],
    ['building-synthetic', 'building-sv-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'SV';
    if (node.id === 'postal-sv-syn-9999') {
      node.postalCode = '9999';
      node.label = 'Synthetic El Salvador routing-locality object 9999';
    } else if (node.id === 'country-sv') {
      node.label = 'El Salvador';
    } else if (node.id === 'department-sv-synthetic') {
      node.label = 'Synthetic El Salvador department context';
    } else if (node.id === 'locality-sv-synthetic') {
      node.label = 'Synthetic El Salvador locality context';
    } else if (node.id === 'agid-sv-synthetic-cover') {
      node.agidCellId = 'SV0000000000';
      node.label = 'Synthetic El Salvador AGID cover';
    } else if (node.id === 'civic-address-sv-synthetic') {
      node.label = 'Synthetic rights-cleared El Salvador civic address SV-SYN-CIVIC-999';
    } else if (node.id === 'building-sv-synthetic') {
      node.label = 'Synthetic explicitly address-linked El Salvador building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `sv-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = elSalvadorSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-sv-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-sv-synthetic',
    countryCode: 'SV',
    releaseId: 'sv-synthetic-2026.01.1',
    policyVersion: 'el-salvador-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'SV';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `sv-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = elSalvadorSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-89.215, 13.690], [-89.185, 13.690], [-89.185, 13.710],
          [-89.215, 13.710], [-89.215, 13.690],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'sv-synthetic-routing-locality-validation-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [EL_SALVADOR_POSTAL_CONTEXT_TEST_POINT.longitude, EL_SALVADOR_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-89.20008, 13.69994], [-89.19992, 13.69994], [-89.19992, 13.70006],
          [-89.20008, 13.70006], [-89.20008, 13.69994],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
