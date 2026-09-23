import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const root = resolve('data/postal_country_packs/gf/postal-context');
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

test('GF keeps all official assignments separate from derived commune geometry', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const assignment = profile.sources.find((item: any) => item.source_id === 'gf-la-poste-hexasmal-20260808');
  const geometry = profile.sources.find((item: any) => item.source_id === 'gf-geo-api-gouv-973-communes-20260901');
  assert.equal(manifest.repository.country_code, 'GF');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_laposte_all_postcodes_derived_commune_visualization');
  assert.match(manifest.postal_system.assignment_rule, /25 distinct 973 postal codes.*22 distinct.*communes/i);
  assert.match(manifest.postal_system.geometry_rule, /postal-code contours are not supplied.*derived display geometry/i);
  assert.match(manifest.postal_system.shared_surface_rule, /97311 and 97352.*97318 and 97360.*97353 and 97390/i);
  assert.equal(assignment.assignment_authority, 'official_postal_operator');
  assert.equal(assignment.geometry_authority, 'none');
  assert.equal(assignment.bundled_here, false);
  assert.equal(geometry.assignment_authority, 'none');
  assert.equal(geometry.geometry_authority, 'official_mapping_geometry');
  assert.equal(geometry.bundled_here, true);
  assert.match(geometry.attribution, /geo\.api\.gouv\.fr.*Open Licence 2\.0/i);
  assert.deepEqual(profile.receipt_summary, { exact_bodies: 32, exact_bytes: 6473543, all_sha256_bound: true, raw_source_bodies_in_git: 0 });
});

test('GF descriptor pins complete real graph and geometry without private or address rows', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');
  assert.equal(descriptor.countryCode, 'GF');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.length, 48);
  assert.equal(graph.assertions.length, 47);
  assert.equal(graph.nodes.filter((node: any) => node.kind === 'postal_feature').length, 25);
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization', 'person', 'recipient'].includes(node.kind)));
  assert.equal(geometry.features.length, 25);
  assert.equal(geometry.features.every((feature: any) => feature.source.sourceType === 'derived'), true);
  assert.equal(geometry.features.every((feature: any) => feature.source.assignmentAuthority === 'official_postal_operator'), true);
  assert.equal(geometry.features.every((feature: any) => feature.source.geometryAuthority === 'official_mapping_geometry'), true);
  assert.equal(geometry.features.every((feature: any) => feature.quality.status === 'derived' && feature.quality.confidence === 0.9), true);
  assert.equal(geometry.features.every((feature: any) => booleanValid({ type: 'Feature', properties: {}, geometry: feature.geometry })), true);
  const reader = new jsts.io.GeoJSONReader();
  assert.equal(geometry.features.every((feature: any) => new jsts.operation.valid.IsValidOp(reader.read(feature.geometry)).isValid()), true);
});

test('GF shared-code pairs intentionally retain equal commune surfaces and distinct postal identities', () => {
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  for (const [first, second] of [['97311', '97352'], ['97318', '97360'], ['97353', '97390']]) {
    const firstFeature = geometry.features.find((item: any) => item.nodeId === `postal-gf-${first}`);
    const secondFeature = geometry.features.find((item: any) => item.nodeId === `postal-gf-${second}`);
    assert.deepEqual(firstFeature.geometry, secondFeature.geometry);
    assert.notEqual(firstFeature.nodeId, secondFeature.nodeId);
    assert.ok(graph.nodes.some((node: any) => node.id === firstFeature.nodeId && node.postalCode === first));
    assert.ok(graph.nodes.some((node: any) => node.id === secondFeature.nodeId && node.postalCode === second));
  }
});

test('GF source notice pins evidence and refuses official postal or address claims', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22/u);
  assert.match(notice, /d4fba56670e484cdbed767862263b959546d6aa515ea9fc5690a3c500ad9b724/u);
  assert.match(notice, /32 exact bodies, 6,473,543 bytes/u);
  assert.match(notice, /derived commune display surfaces/i);
  assert.match(notice, /Raw evidence is deliberately excluded from Git/i);
});
