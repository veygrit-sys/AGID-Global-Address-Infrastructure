import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createDominicanRepublicPostalContextRuntimeTestPack } from './postalContextDominicanRepublicRuntimeFixture';

export const NICARAGUA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 12.1140,
  longitude: -86.2362,
} as const;
export const NICARAGUA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function nicaraguaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^do-/, 'ni-'),
    sourceVersion: source.sourceVersion?.replace(/^do-/, 'ni-'),
  };
}

export function createNicaraguaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createDominicanRepublicPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-do-syn-99999', 'postal-ni-syn-99999'],
    ['country-do', 'country-ni'],
    ['province-do-synthetic', 'department-ni-synthetic'],
    ['sector-do-synthetic', 'barrio-ni-synthetic'],
    ['agid-do-synthetic-cover', 'agid-ni-synthetic-cover'],
    ['civic-address-point-do-synthetic', 'civic-address-point-ni-synthetic'],
    ['civic-address-do-synthetic', 'civic-address-ni-synthetic'],
    ['building-do-synthetic', 'building-ni-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'NI';
    if (node.id === 'postal-ni-syn-99999') {
      node.postalCode = '99999';
      node.label = 'Synthetic Nicaraguan barrio-or-comarca postal object 99999';
    } else if (node.id === 'country-ni') {
      node.label = 'Nicaragua';
    } else if (node.id === 'department-ni-synthetic') {
      node.label = 'Synthetic Nicaraguan department context';
    } else if (node.id === 'barrio-ni-synthetic') {
      node.label = 'Synthetic Nicaraguan barrio context';
    } else if (node.id === 'agid-ni-synthetic-cover') {
      node.agidCellId = 'NI0000000000';
      node.label = 'Synthetic Nicaraguan AGID cover';
    } else if (node.id === 'civic-address-ni-synthetic') {
      node.label = 'Synthetic rights-cleared Nicaraguan civic address NI-SYN-CIVIC-999';
    } else if (node.id === 'building-ni-synthetic') {
      node.label = 'Synthetic explicitly address-linked Nicaraguan building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = assertion.id.replace(/^do-/, 'ni-');
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = nicaraguaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-ni-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-ni-synthetic',
    countryCode: 'NI',
    releaseId: 'ni-synthetic-2026.01.1',
    policyVersion: 'nicaragua-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'NI';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = feature.id.replace(/^do-/, 'ni-');
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = nicaraguaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-86.2512, 12.1040], [-86.2212, 12.1040], [-86.2212, 12.1240],
          [-86.2512, 12.1240], [-86.2512, 12.1040],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'ni-synthetic-derived-postal-area-review-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [NICARAGUA_POSTAL_CONTEXT_TEST_POINT.longitude, NICARAGUA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-86.23628, 12.11394], [-86.23612, 12.11394], [-86.23612, 12.11406],
          [-86.23628, 12.11406], [-86.23628, 12.11394],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
