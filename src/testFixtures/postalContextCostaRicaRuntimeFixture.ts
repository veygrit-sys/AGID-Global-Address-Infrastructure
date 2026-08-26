import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const COSTA_RICA_POSTAL_CONTEXT_TEST_POINT = { latitude: 9.7500, longitude: -84.0000 } as const;
export const COSTA_RICA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-27T00:00:00.000Z';

function costaRicaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'cr-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'cr-'),
  };
}

export function createCostaRicaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-cr-syn-79999'],
    ['country-jp', 'country-cr'],
    ['prefecture-synthetic', 'province-cr-synthetic'],
    ['locality-synthetic', 'district-cr-synthetic'],
    ['agid-synthetic-cover', 'agid-cr-synthetic-cover'],
    ['address-point-synthetic', 'civic-address-point-cr-synthetic'],
    ['premise-synthetic', 'civic-address-cr-synthetic'],
    ['building-synthetic', 'building-cr-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'CR';
    if (node.id === 'postal-cr-syn-79999') {
      node.postalCode = '79999';
      node.label = 'Synthetic Costa Rica district-postcode object 79999';
    } else if (node.id === 'country-cr') {
      node.label = 'Costa Rica';
    } else if (node.id === 'province-cr-synthetic') {
      node.label = 'Synthetic Costa Rica province context';
    } else if (node.id === 'district-cr-synthetic') {
      node.label = 'Synthetic Costa Rica district context';
    } else if (node.id === 'agid-cr-synthetic-cover') {
      node.agidCellId = 'CR0000000000';
      node.label = 'Synthetic Costa Rica AGID cover';
    } else if (node.id === 'civic-address-cr-synthetic') {
      node.label = 'Synthetic rights-cleared Costa Rica civic address CR-SYN-CIVIC-799';
    } else if (node.id === 'building-cr-synthetic') {
      node.label = 'Synthetic explicitly address-linked Costa Rica building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `cr-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = costaRicaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-cr-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-cr-synthetic',
    countryCode: 'CR',
    releaseId: 'cr-synthetic-2026.01.1',
    policyVersion: 'costa-rica-postal-context-v0.1',
  };
  pack.geometry.countryCode = 'CR';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `cr-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = costaRicaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-84.015, 9.740], [-83.985, 9.740], [-83.985, 9.760],
          [-84.015, 9.760], [-84.015, 9.740],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'cr-synthetic-district-postcode-validation-polygon',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 1000 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [COSTA_RICA_POSTAL_CONTEXT_TEST_POINT.longitude, COSTA_RICA_POSTAL_CONTEXT_TEST_POINT.latitude],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [-84.00008, 9.74994], [-83.99992, 9.74994], [-83.99992, 9.75006],
          [-84.00008, 9.75006], [-84.00008, 9.74994],
        ]],
      };
    }
    return feature;
  });
  return pack;
}
