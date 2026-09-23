import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve('data/postal_country_packs/ac/postal-context');

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
}

function digest(path: string) {
  return `sha256:${createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')}`;
}

test('AC repository keeps official ASCN assignment, derived geometry and territory identity separate', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const upu = profile.sources.find((item: any) => item.source_id === 'upu-universal-postcode-database-2026-08-ac');
  const operator = profile.sources.find((item: any) => item.source_id === 'ascension-island-government-current-postal-use-2026');
  const geometrySource = profile.sources.find((item: any) => item.source_id === 'geoboundaries-gbopen-shn-adm0-9469f095-ac-subset');

  assert.equal(manifest.repository.country_code, 'AC');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_upu_whole_territory_derived_visualization');
  assert.match(manifest.postal_system.assignment_rule, /ASCN 1ZZ.*single postcode.*whole territory/is);
  assert.match(manifest.postal_system.geometry_rule, /No official postal polygon.*derived display geometry.*never presented as an official/is);
  assert.match(manifest.postal_system.identity_rule, /AC remains.*SHN.*no identity or territory is merged/is);
  assert.equal(upu.assignment_authority, 'official_postal_dictionary');
  assert.equal(upu.geometry_authority, 'none');
  assert.equal(upu.bundled_here, false);
  assert.match(operator.observed_release.finding, /January 2026.*ASCN 1ZZ/i);
  assert.equal(geometrySource.assignment_authority, 'derived_spatial_assignment');
  assert.equal(geometrySource.geometry_authority, 'derived_geometry');
  assert.equal(geometrySource.bundled_here, true);
  assert.deepEqual(geometrySource.observed_release.selected_part_indices, [44, 45, 46]);
  assert.match(geometrySource.attribution, /geoBoundaries.*SHN-ADM0-31036641.*CC BY 4\.0/i);
});

test('AC descriptor pins real derived geometry without address, building or SHN identity leakage', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');

  assert.equal(descriptor.countryCode, 'AC');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.filter((node: any) => node.kind === 'postal_feature').length, 1);
  assert.equal(graph.nodes.find((node: any) => node.kind === 'postal_feature').postalCode, 'ASCN 1ZZ');
  assert.ok(graph.nodes.every((node: any) => node.countryCode === 'AC'));
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization'].includes(node.kind)));
  assert.equal(graph.assertions[0].source.assignmentAuthority, 'official_postal_dictionary');
  assert.equal(graph.assertions[0].source.geometryAuthority, 'none');
  assert.equal(geometry.features.length, 2);
  assert.ok(geometry.features.every((item: any) => item.geometry.type === 'MultiPolygon'));
  assert.ok(geometry.features.every((item: any) => item.source.sourceType === 'derived'));
  assert.ok(geometry.features.every((item: any) => item.source.assignmentAuthority === 'derived_spatial_assignment'));
  assert.ok(geometry.features.every((item: any) => item.source.geometryAuthority === 'derived_geometry'));
  assert.ok(geometry.features.every((item: any) => item.quality.status === 'derived' && item.quality.confidence === 0.91));
});

test('AC source notice pins current evidence and coordinate-preserving subset without raw sources', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d/u);
  assert.match(notice, /3f0ac7d72e664817228140ed80614c8a9f2cd6c5d2e6dc2d623c4d348adc4bf1/u);
  assert.match(notice, /94c9e525d8f9c12fc1f643f8c61b5f03323587e10d01b8c3109269b4349aa27e/u);
  assert.match(notice, /parts `44`, `45` and `46`/i);
  assert.match(notice, /preserves their 1,261 positions exactly/i);
  assert.match(notice, /Raw reference and source downloads remain outside Git/i);
});
