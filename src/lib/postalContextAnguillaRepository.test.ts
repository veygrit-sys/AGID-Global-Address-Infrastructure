import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve('data/postal_country_packs/ai/postal-context');

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
}

function digest(path: string) {
  return `sha256:${createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')}`;
}

test('AI repository keeps official postcode assignment separate from derived display geometry', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const upu = profile.sources.find((item: any) => item.source_id === 'upu-universal-postcode-database-2026-08-ai');
  const geometrySource = profile.sources.find((item: any) => item.source_id === 'geoboundaries-gbopen-aia-adm0-9469f095');

  assert.equal(manifest.repository.country_code, 'AI');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_upu_whole_territory_derived_visualization');
  assert.match(manifest.postal_system.assignment_rule, /AI-2640.*single postcode.*whole territory/i);
  assert.match(manifest.postal_system.geometry_rule, /No official postal polygon.*derived display geometry.*never presented as an official/i);
  assert.match(manifest.postal_system.delivery_zone_rule, /POCDS.*not postcodes/i);
  assert.equal(upu.assignment_authority, 'official_postal_dictionary');
  assert.equal(upu.geometry_authority, 'none');
  assert.equal(upu.bundled_here, false);
  assert.equal(geometrySource.assignment_authority, 'derived_spatial_assignment');
  assert.equal(geometrySource.geometry_authority, 'derived_geometry');
  assert.equal(geometrySource.bundled_here, true);
  assert.match(geometrySource.attribution, /geoBoundaries.*CC BY 4\.0/i);
});

test('AI descriptor pins generated graph and real derived geometry without address or building leakage', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');

  assert.equal(descriptor.countryCode, 'AI');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.filter((node: any) => node.kind === 'postal_feature').length, 1);
  assert.equal(graph.nodes.find((node: any) => node.kind === 'postal_feature').postalCode, 'AI-2640');
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization'].includes(node.kind)));
  assert.equal(graph.assertions[0].source.assignmentAuthority, 'official_postal_dictionary');
  assert.equal(graph.assertions[0].source.geometryAuthority, 'none');
  assert.equal(geometry.features.length, 2);
  assert.ok(geometry.features.every((item: any) => item.source.sourceType === 'derived'));
  assert.ok(geometry.features.every((item: any) => item.source.assignmentAuthority === 'derived_spatial_assignment'));
  assert.ok(geometry.features.every((item: any) => item.source.geometryAuthority === 'derived_geometry'));
  assert.ok(geometry.features.every((item: any) => item.quality.status === 'derived' && item.quality.confidence === 0.92));
});

test('AI source notice records fixed primary evidence without redistributing raw source bytes', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d/u);
  assert.match(notice, /6fa5dff75ac3ab9d8064c46a5b6ec1d4e307e67d033d100f0a4a6f4b3aac1237/u);
  assert.match(notice, /9469f09592ced973a3448cf66b6100b741b64c0d/u);
  assert.match(notice, /derived whole-territory display surface/i);
  assert.match(notice, /not redistributed/i);
});
