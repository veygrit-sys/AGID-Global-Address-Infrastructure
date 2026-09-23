import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve('data/postal_country_packs/cp/postal-context');
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

test('CP keeps official assignment separate from derived administrative display geometry', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const assignment = profile.sources.find((item: any) => item.source_id === 'laposte-hexasmal-20260808-cp-98901');
  const geometry = profile.sources.find((item: any) => item.source_id === 'geo-api-gouv-fr-commune-98901-20260831');
  assert.equal(manifest.repository.country_code, 'CP');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_laposte_single_postcode_derived_territory_visualization');
  assert.match(manifest.postal_system.assignment_rule, /exactly one 98901.*exactly one 98799/i);
  assert.match(manifest.postal_system.geometry_rule, /postcode contours are not supplied.*derived display geometry/i);
  assert.match(manifest.temporal_model.history_rule, /former COG (?:code )?98799.*current COG application code 98901/i);
  assert.equal(assignment.assignment_authority, 'official_postal_dictionary');
  assert.equal(assignment.geometry_authority, 'none');
  assert.equal(assignment.bundled_here, false);
  assert.equal(geometry.assignment_authority, 'derived_spatial_assignment');
  assert.equal(geometry.geometry_authority, 'derived_geometry');
  assert.equal(geometry.bundled_here, true);
  assert.match(geometry.attribution, /geo\.api\.gouv\.fr.*Open Licence 2\.0/i);
  assert.deepEqual(profile.receipt_summary, { exact_bodies: 15, exact_bytes: 2845023, all_sha256_bound: true, raw_source_bodies_in_git: 0 });
});

test('CP descriptor pins real graph and geometry without address or building leakage', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');
  assert.equal(descriptor.countryCode, 'CP');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.find((node: any) => node.kind === 'postal_feature').postalCode, '98799');
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization'].includes(node.kind)));
  assert.equal(graph.assertions[0].source.assignmentAuthority, 'official_postal_dictionary');
  assert.equal(graph.assertions[0].source.geometryAuthority, 'none');
  assert.equal(geometry.features.length, 1);
  assert.equal(geometry.features[0].geometry.type, 'Polygon');
  assert.equal(geometry.features[0].source.sourceType, 'derived');
  assert.equal(geometry.features[0].source.geometryAuthority, 'derived_geometry');
  assert.equal(geometry.features[0].quality.status, 'derived');
  assert.equal(geometry.features[0].quality.confidence, 0.97);
});

test('CP source notice pins evidence and preserves identity/authority boundaries', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22/u);
  assert.match(notice, /7ccf2420ff6b59a73b5ff2275d83758080b288ada3b8ebadec1ef7bfc8a740c8/u);
  assert.match(notice, /5dcb3cf3c6564be2fb53cebc5319b618540c39d9747bc5d9a6eb7e925d08dacd/u);
  assert.match(notice, /derived territory display surface/i);
  assert.match(notice, /historical COG use of 98799.*current.*98901/su);
  assert.match(notice, /no inhabitants and no habitation/i);
  assert.match(notice, /Raw evidence is deliberately excluded from Git/i);
});
