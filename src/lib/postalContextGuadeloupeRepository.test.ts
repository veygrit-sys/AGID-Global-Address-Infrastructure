import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const root = resolve('data/postal_country_packs/gp/postal-context');
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

test('GP keeps all official assignments separate from derived commune geometry', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const assignment = profile.sources.find((item: any) => item.source_id === 'gp-la-poste-hexasmal-20260808');
  const geometry = profile.sources.find((item: any) => item.source_id === 'gp-geo-api-gouv-971-communes-20260901');
  assert.equal(manifest.repository.country_code, 'GP');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_laposte_all_postcodes_derived_commune_visualization');
  assert.match(manifest.postal_system.assignment_rule, /38 GP assignment rows.*33 distinct postal codes.*32 distinct.*communes/i);
  assert.match(manifest.postal_system.geometry_rule, /postal-code contours are not supplied.*derived display geometry/i);
  assert.match(manifest.postal_system.shared_surface_rule, /97139 and 97142.*Les Abymes.*multi-Ligne-5/i);
  assert.equal(assignment.assignment_authority, 'official_postal_operator');
  assert.equal(assignment.geometry_authority, 'none');
  assert.equal(assignment.bundled_here, false);
  assert.equal(geometry.assignment_authority, 'none');
  assert.equal(geometry.geometry_authority, 'official_mapping_geometry');
  assert.equal(geometry.bundled_here, true);
  assert.match(geometry.attribution, /geo\.api\.gouv\.fr.*Open Licence 2\.0/i);
  assert.deepEqual(profile.receipt_summary, { exact_bodies: 40, exact_bytes: 3663819, all_sha256_bound: true, raw_source_bodies_in_git: 0 });
});

test('GP descriptor pins complete real graph and geometry without private or address rows', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');
  assert.equal(descriptor.countryCode, 'GP');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.length, 66);
  assert.equal(graph.assertions.length, 65);
  assert.equal(graph.nodes.filter((node: any) => node.kind === 'postal_feature').length, 33);
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization', 'person', 'recipient'].includes(node.kind)));
  assert.equal(geometry.features.length, 33);
  assert.equal(geometry.features.every((feature: any) => feature.source.sourceType === 'derived'), true);
  assert.equal(geometry.features.every((feature: any) => feature.source.assignmentAuthority === 'official_postal_operator'), true);
  assert.equal(geometry.features.every((feature: any) => feature.source.geometryAuthority === 'official_mapping_geometry'), true);
  assert.equal(geometry.features.every((feature: any) => feature.quality.status === 'derived' && feature.quality.confidence === 0.9), true);
  assert.equal(geometry.features.every((feature: any) => booleanValid({ type: 'Feature', properties: {}, geometry: feature.geometry })), true);
  const reader = new jsts.io.GeoJSONReader();
  assert.equal(geometry.features.every((feature: any) => new jsts.operation.valid.IsValidOp(reader.read(feature.geometry)).isValid()), true);
});

test('GP shared-code pairs intentionally retain equal commune surfaces and distinct postal identities', () => {
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  for (const [first, second] of [['97139', '97142']]) {
    const firstFeature = geometry.features.find((item: any) => item.nodeId === `postal-gp-${first}`);
    const secondFeature = geometry.features.find((item: any) => item.nodeId === `postal-gp-${second}`);
    assert.deepEqual(firstFeature.geometry, secondFeature.geometry);
    assert.notEqual(firstFeature.nodeId, secondFeature.nodeId);
    assert.ok(graph.nodes.some((node: any) => node.id === firstFeature.nodeId && node.postalCode === first));
    assert.ok(graph.nodes.some((node: any) => node.id === secondFeature.nodeId && node.postalCode === second));
  }
});

test('GP keeps multi-Ligne-5 rows as one area and excludes BL/MF identities', () => {
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const line5 = { '97125': ['PIGEON'], '97130': ['BANANIER', 'STE MARIE'], '97131': ['LES MANGLES'], '97180': ['DOUVILLE'] };
  for (const [postalCode, labels] of Object.entries(line5)) {
    const nodes = graph.nodes.filter((node: any) => node.postalCode === postalCode);
    const features = geometry.features.filter((feature: any) => feature.nodeId === `postal-gp-${postalCode}`);
    assert.equal(nodes.length, 1);
    assert.equal(features.length, 1);
    for (const label of labels) assert.match(nodes[0].label, new RegExp(label, 'i'));
  }
  assert.equal(graph.nodes.some((node: any) => ['97133', '97150'].includes(node.postalCode)), false);
  assert.equal(geometry.features.some((feature: any) => ['postal-gp-97133', 'postal-gp-97150'].includes(feature.nodeId)), false);
});

test('GP source notice pins evidence and refuses official postal or address claims', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22/u);
  assert.match(notice, /b307845f32aa358bad7df3b2219e3029329748598aa02e52d47656da98ab26db/u);
  assert.match(notice, /40 exact bodies, 3,663,819 bytes/u);
  assert.match(notice, /derived commune display surfaces/i);
  assert.match(notice, /Raw evidence is deliberately excluded from Git/i);
});
