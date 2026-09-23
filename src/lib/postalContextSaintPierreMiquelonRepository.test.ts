import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve('data/postal_country_packs/pm/postal-context');
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

test('PM keeps official postcode assignments separate from derived administrative display geometry', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const assignment = profile.sources.find((item: any) => item.source_id === 'laposte-hexasmal-20260808-pm-97501-97502');
  const geometry = profile.sources.find((item: any) => item.source_id === 'geo-api-gouv-fr-communes-97501-97502-20260901');
  assert.equal(manifest.repository.country_code, 'PM');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_laposte_single_postcode_two_commune_visualization');
  assert.match(manifest.postal_system.assignment_rule, /exactly three PM rows.*97501.*97502.*97500/i);
  assert.match(manifest.postal_system.geometry_rule, /postal-code contours are not supplied.*derived display geometry/i);
  assert.equal(assignment.assignment_authority, 'official_postal_dictionary');
  assert.equal(assignment.geometry_authority, 'none');
  assert.equal(assignment.bundled_here, false);
  assert.equal(geometry.assignment_authority, 'derived_spatial_assignment');
  assert.equal(geometry.geometry_authority, 'derived_geometry');
  assert.equal(geometry.bundled_here, true);
  assert.match(geometry.attribution, /geo\.api\.gouv\.fr.*97501.*97502.*Open Licence 2\.0/i);
  assert.deepEqual(profile.receipt_summary, { exact_bodies: 8, exact_bytes: 2162379, all_sha256_bound: true, raw_source_bodies_in_git: 0 });
});

test('PM descriptor pins real graph, ID linkage and geometry without address or building leakage', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');
  assert.equal(descriptor.countryCode, 'PM');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.find((node: any) => node.kind === 'postal_feature').id, 'postal-pm-97500');
  assert.deepEqual(graph.nodes.filter((node: any) => node.featureKind === 'administrative').map((node: any) => node.id), [
    'admin-pm-insee-97501', 'admin-pm-insee-97502',
  ]);
  assert.ok(graph.nodes.every((node: any) => !['address_record', 'address_point', 'building', 'parcel', 'organization'].includes(node.kind)));
  assert.equal(graph.assertions.length, 2);
  assert.ok(graph.assertions.every((item: any) => item.source.assignmentAuthority === 'official_postal_dictionary'));
  assert.equal(geometry.features.length, 1);
  assert.equal(geometry.features[0].geometry.type, 'MultiPolygon');
  assert.equal(geometry.features[0].source.sourceType, 'derived');
  assert.equal(geometry.features[0].source.geometryAuthority, 'derived_geometry');
  assert.equal(geometry.features[0].quality.status, 'derived');
  assert.equal(geometry.features[0].quality.confidence, 0.95);
});

test('PM source notice pins every exact geometry response and discloses area-method difference', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /baf289ef9c951d28bb8e902b81bc0be21b23cc7c7db1377a72ed6d7974c265b1/u);
  assert.match(notice, /cdd11e84eb7dbd892a3a864540cb60327c577a162715da9df8be8e1139942902/u);
  assert.match(notice, /c32727b4d867d974a10ac19aba25e24591368f203e6a1a70013dae43a5ada790/u);
  assert.match(notice, /derived administrative display context/i);
  assert.match(notice, /219\.09697358099386 km².*219\.5875 km²/su);
  assert.match(notice, /Raw evidence is deliberately\s+excluded from Git/i);
});
