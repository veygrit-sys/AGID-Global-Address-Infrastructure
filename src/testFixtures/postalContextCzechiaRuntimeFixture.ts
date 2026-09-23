import type { PostalContextSource } from '../lib/postalContextGraph';
import type { PostalContextRuntimePack } from '../lib/postalContextPackRuntime';
import { createPostalContextRuntimeTestPack } from './postalContextRuntimeFixture';

export const CZECHIA_POSTAL_CONTEXT_TEST_POINT = {
  latitude: 50.0755,
  longitude: 14.4378,
} as const;

export const CZECHIA_POSTAL_CONTEXT_TEST_INSTANT = '2026-08-25T00:00:00.000Z';

function czechiaSource(source: PostalContextSource): PostalContextSource {
  return {
    ...source,
    sourceId: source.sourceId.replace(/^jp-/, 'cz-'),
    sourceVersion: source.sourceVersion?.replace(/^jp-/, 'cz-'),
  };
}

export function createCzechiaPostalContextRuntimeTestPack(): PostalContextRuntimePack {
  const pack = structuredClone(createPostalContextRuntimeTestPack());
  const idMap = new Map<string, string>([
    ['postal-jp-syn-0000001', 'postal-cz-syn-00000'],
    ['country-jp', 'country-cz'],
    ['prefecture-synthetic', 'region-cz-synthetic'],
    ['locality-synthetic', 'municipality-cz-synthetic'],
    ['agid-synthetic-cover', 'agid-cz-synthetic-cover'],
    ['address-point-synthetic', 'ruian-address-place-cz-synthetic'],
    ['premise-synthetic', 'civic-address-cz-synthetic'],
    ['building-synthetic', 'ruian-building-cz-synthetic'],
  ]);

  for (const node of pack.graph.nodes) {
    node.id = idMap.get(node.id) ?? node.id;
    node.countryCode = 'CZ';
    if (node.id === 'postal-cz-syn-00000') {
      node.postalCode = '000 00';
      node.label = 'Synthetic Czech PSČ routing assignment';
    } else if (node.id === 'country-cz') {
      node.label = 'Czechia';
    } else if (node.id === 'region-cz-synthetic') {
      node.label = 'Synthetic Kraj';
    } else if (node.id === 'municipality-cz-synthetic') {
      node.label = 'Synthetic Obec';
    } else if (node.id === 'agid-cz-synthetic-cover') {
      node.agidCellId = 'CZ0000000000';
      node.label = 'Synthetic Czechia AGID cover';
    } else if (node.id === 'civic-address-cz-synthetic') {
      node.label = 'Zkušební 1';
    } else if (node.id === 'ruian-building-cz-synthetic') {
      node.label = 'Synthetic explicitly linked RÚIAN building';
    }
  }

  for (const assertion of pack.graph.assertions) {
    assertion.id = `cz-${assertion.id}`;
    assertion.fromNodeId = idMap.get(assertion.fromNodeId) ?? assertion.fromNodeId;
    assertion.toNodeId = idMap.get(assertion.toNodeId) ?? assertion.toNodeId;
    assertion.source = czechiaSource(assertion.source);
  }

  pack.graph.release = {
    ...pack.graph.release,
    repositoryId: 'agid-postal-cz-synthetic',
    repositoryUrl: 'https://example.invalid/agid-postal-cz-synthetic',
    countryCode: 'CZ',
    releaseId: 'cz-synthetic-2026.01.1',
    policyVersion: 'czechia-psc-ruian-v0.1',
  };

  pack.geometry.countryCode = 'CZ';
  pack.geometry.releaseId = pack.graph.release.releaseId;
  pack.geometry.features = pack.geometry.features.map(feature => {
    feature.id = `cz-${feature.id}`;
    feature.nodeId = idMap.get(feature.nodeId) ?? feature.nodeId;
    feature.source = czechiaSource(feature.source);
    if (feature.role === 'postal_area') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [14.42, 50.065],
          [14.455, 50.065],
          [14.455, 50.086],
          [14.42, 50.086],
          [14.42, 50.065],
        ]],
      };
      feature.source = {
        ...feature.source,
        sourceId: 'cz-synthetic-derived-psc-area',
        assignmentAuthority: 'synthetic_fixture_assignment',
        geometryAuthority: 'synthetic_fixture_geometry',
      };
      feature.quality = { status: 'derived', accuracyMeters: 100 };
    } else if (feature.role === 'address_point') {
      feature.geometry = {
        type: 'Point',
        coordinates: [
          CZECHIA_POSTAL_CONTEXT_TEST_POINT.longitude,
          CZECHIA_POSTAL_CONTEXT_TEST_POINT.latitude,
        ],
      };
    } else if (feature.role === 'building_footprint') {
      feature.geometry = {
        type: 'Polygon',
        coordinates: [[
          [14.43772, 50.07544],
          [14.43788, 50.07544],
          [14.43788, 50.07556],
          [14.43772, 50.07556],
          [14.43772, 50.07544],
        ]],
      };
    }
    return feature;
  });

  return pack;
}
