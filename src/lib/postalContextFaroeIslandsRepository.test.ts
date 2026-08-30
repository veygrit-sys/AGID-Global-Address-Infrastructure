import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import booleanValid from '@turf/boolean-valid';

const root = resolve('data/postal_country_packs/fo/postal-context');

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
}

function digest(path: string) {
  return `sha256:${createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')}`;
}

test('FO repository publishes only the rights-reviewed postal-area partition', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const source = profile.sources.find((item: any) => item.source_id === 'umhvorvisstovan-faroe-postoki');

  assert.equal(manifest.repository.country_code, 'FO');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_umhvorvisstovan_postoki_visualization');
  assert.equal(profile.artifact_scope, 'current-umhvorvisstovan-postoki-runtime');
  assert.equal(source.assignment_authority, 'official_postal_mapping_authority');
  assert.equal(source.geometry_authority, 'official_postal_geometry');
  assert.equal(source.bundled_here, true);
  assert.match(source.attribution, /Umhvørvisstovan.*Postnummur.*2026-08-30/u);
  assert.equal(profile.artifact_partitions.find((item: any) => item.id === 'address-and-building').public_output, 'none');
});

test('FO descriptor pins graph and geometry bytes and all published surfaces are valid', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');
  const postalNodes = graph.nodes.filter((node: any) => node.kind === 'postal_feature');

  assert.equal(descriptor.countryCode, 'FO');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(postalNodes.length, 117);
  assert.equal(new Set(postalNodes.map((node: any) => node.postalCode)).size, 117);
  assert.ok(postalNodes.every((node: any) => /^\d{3}$/u.test(node.postalCode)));
  assert.equal(geometry.features.length, 117);
  assert.ok(geometry.features.every((feature: any) => booleanValid({ type: 'Feature', properties: {}, geometry: feature.geometry })));
});

test('FO code 476 preserves the source exception as derived and no address/building rows leak in', () => {
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const repaired = geometry.features.find((feature: any) => feature.nodeId === 'postal-fo-476');

  assert.equal(repaired.geometry.type, 'Polygon');
  assert.equal(repaired.source.sourceType, 'derived');
  assert.equal(repaired.source.assignmentAuthority, 'official_postal_mapping_authority');
  assert.equal(repaired.source.geometryAuthority, 'derived_geometry');
  assert.equal(repaired.quality.status, 'derived');
  assert.equal(repaired.quality.confidence, 0.999999);
  assert.ok(geometry.features.filter((feature: any) => feature.quality.status === 'authoritative').length === 116);
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel'].includes(node.kind)));
});
