import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const root = resolve('data/postal_country_packs/mq/postal-context');
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

test('MQ keeps all official assignments separate from derived commune geometry', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const assignment = profile.sources.find((item: any) => item.source_id === 'mq-la-poste-hexasmal-20260808');
  const geometry = profile.sources.find((item: any) => item.source_id === 'mq-geo-api-gouv-972-communes-20260901');
  assert.equal(manifest.repository.country_code, 'MQ');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_laposte_all_martinique_postcodes_derived_commune_visualization');
  assert.match(manifest.postal_system.assignment_rule, /38 MQ assignment rows.*30 distinct postal codes.*34 distinct.*communes/i);
  assert.match(manifest.postal_system.geometry_rule, /does not supply open postal-code contours.*derived display geometry/i);
  assert.match(manifest.postal_system.shared_surface_rule, /97218.*97222.*97250.*multiple.*97200.*97234/i);
  assert.equal(assignment.assignment_authority, 'official_postal_operator');
  assert.equal(assignment.geometry_authority, 'none');
  assert.equal(assignment.bundled_here, false);
  assert.equal(geometry.assignment_authority, 'none');
  assert.equal(geometry.geometry_authority, 'official_mapping_geometry');
  assert.equal(geometry.bundled_here, true);
  assert.match(geometry.attribution, /geo\.api\.gouv\.fr.*Open Licence 2\.0/i);
  assert.deepEqual(profile.receipt_summary, { exact_bodies: 37, exact_bytes: 3608319, all_sha256_bound: true, raw_source_bodies_in_git: 0 });
});

test('MQ descriptor pins complete real graph and geometry without private or address rows', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');
  assert.equal(descriptor.countryCode, 'MQ');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.length, 70);
  assert.equal(graph.assertions.length, 69);
  assert.equal(graph.nodes.filter((node: any) => node.kind === 'postal_feature').length, 35);
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization', 'person', 'recipient'].includes(node.kind)));
  assert.equal(geometry.features.length, 35);
  assert.equal(geometry.features.every((feature: any) => feature.source.sourceType === 'derived'), true);
  assert.equal(geometry.features.every((feature: any) => feature.source.assignmentAuthority === 'official_postal_operator'), true);
  assert.equal(geometry.features.every((feature: any) => feature.source.geometryAuthority === 'official_mapping_geometry'), true);
  assert.equal(geometry.features.every((feature: any) => feature.quality.status === 'derived' && feature.quality.confidence === 0.9), true);
  assert.equal(geometry.features.every((feature: any) => booleanValid({ type: 'Feature', properties: {}, geometry: feature.geometry })), true);
  const reader = new jsts.io.GeoJSONReader();
  assert.equal(geometry.features.every((feature: any) => new jsts.operation.valid.IsValidOp(reader.read(feature.geometry)).isValid()), true);
});

test('MQ same-commune pair retains equal surfaces and distinct postal identities', () => {
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  for (const [first, second] of [['97200', '97234']]) {
    const firstFeature = geometry.features.find((item: any) => item.nodeId.startsWith(`postal-mq-${first}-`));
    const secondFeature = geometry.features.find((item: any) => item.nodeId.startsWith(`postal-mq-${second}-`));
    assert.deepEqual(firstFeature.geometry, secondFeature.geometry);
    assert.notEqual(firstFeature.nodeId, secondFeature.nodeId);
    assert.ok(graph.nodes.some((node: any) => node.id === firstFeature.nodeId && node.postalCode === first));
    assert.ok(graph.nodes.some((node: any) => node.id === secondFeature.nodeId && node.postalCode === second));
  }
});

test('MQ preserves multi-commune alternatives and multi-Ligne-5 labels without invented areas', () => {
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const line5 = { '97215': ['RIVIERE SALEE PETIT BOURG'], '97230': ['STE MARIE MORNE DES ESSES'], '97231': ['ROBERT VERT PRE'] };
  for (const [postalCode, labels] of Object.entries(line5)) {
    const nodes = graph.nodes.filter((node: any) => node.postalCode === postalCode);
    const features = geometry.features.filter((feature: any) => feature.nodeId.startsWith(`postal-mq-${postalCode}-`));
    assert.equal(nodes.length, 1);
    assert.equal(features.length, 1);
    for (const label of labels) assert.match(nodes[0].label, new RegExp(label, 'i'));
  }
  assert.deepEqual(Object.fromEntries(['97218', '97222', '97250'].map(code => [code, geometry.features.filter((feature: any) => feature.nodeId.startsWith(`postal-mq-${code}-`)).length])), { '97218': 3, '97222': 2, '97250': 3 });
});

test('MQ source notice pins evidence and refuses official postal or address claims', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22/u);
  assert.match(notice, /b7a30e913a752fe828d3619095187aae1d42cbc7cf06d9aedfac77110e9e30dd/u);
  assert.match(notice, /37 exact bodies, 3,608,319 bytes/u);
  assert.match(notice, /derived commune display surfaces/i);
  assert.match(notice, /Raw evidence is deliberately excluded from Git/i);
});
