import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve('data/postal_country_packs/tc/postal-context');

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
}

function digest(path: string) {
  return `sha256:${createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')}`;
}

test('TC repository separates the official whole-territory postcode from derived government land geometry', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const upu = profile.sources.find((item: any) => item.source_id === 'upu-tc-addressing-sheet-2025-10');
  const geometrySource = profile.sources.find((item: any) => item.source_id === 'tc-decr-shoreline-land-extent-2020');

  assert.equal(manifest.repository.country_code, 'TC');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_upu_single_postcode_decr_derived_visualization');
  assert.match(manifest.postal_system.assignment_rule, /TKCA 1ZZ.*single postcode.*whole territory/i);
  assert.match(manifest.postal_system.geometry_rule, /UPU source supplies no postal polygon.*derived display geometry/i);
  assert.match(manifest.postal_system.id_rule, /public runtime.*2 runtime geometry.*official country assertion/i);
  assert.match(manifest.postal_system.id_rule, /graph retains 27 stable.*derived audit assertions.*without promoting/i);
  assert.equal(upu.assignment_authority, 'official_postal_dictionary');
  assert.equal(upu.geometry_authority, 'none');
  assert.equal(upu.bundled_here, false);
  assert.equal(geometrySource.assignment_authority, 'derived_spatial_assignment');
  assert.equal(geometrySource.geometry_authority, 'official_mapping_geometry');
  assert.equal(geometrySource.bundled_here, true);
  assert.match(geometrySource.attribution, /Turks and Caicos Islands Government.*CC BY-SA/i);
});

test('TC descriptor pins one postal ID, 27 region IDs and two real derived MultiPolygon bundles without private-detail leakage', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');

  assert.equal(descriptor.countryCode, 'TC');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.filter((node: any) => node.kind === 'postal_feature').length, 1);
  assert.equal(graph.nodes.filter((node: any) => node.id.startsWith('admin-tc-decr-region-')).length, 27);
  assert.equal(graph.nodes.find((node: any) => node.kind === 'postal_feature').postalCode, 'TKCA 1ZZ');
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization'].includes(node.kind)));
  assert.equal(graph.assertions.length, 28);
  assert.equal(graph.assertions[0].source.assignmentAuthority, 'official_postal_dictionary');
  assert.equal(graph.assertions[0].source.geometryAuthority, 'none');
  assert.equal(geometry.features.length, 2);
  assert.ok(geometry.features.every((item: any) => item.nodeId === 'postal-tc-tkca-1zz'));
  assert.ok(geometry.features.every((item: any) => item.geometry.type === 'MultiPolygon'));
  assert.ok(geometry.features.every((item: any) => item.source.sourceType === 'derived'));
  assert.ok(geometry.features.every((item: any) => item.source.assignmentAuthority === 'derived_spatial_assignment'));
  assert.ok(geometry.features.every((item: any) => item.source.geometryAuthority === 'derived_geometry'));
  assert.ok(geometry.features.every((item: any) => item.quality.status === 'derived' && item.quality.confidence === 0.9));
});

test('TC source notice fixes all retrieved evidence and explicitly excludes sensitive source attributes', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /81411e006295b278736bdde53996cfcfa193ee3b27f6ea9b6764ef5f7f19cb48/u);
  assert.match(notice, /ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d/u);
  assert.match(notice, /15f214ae2c43e62f6aa514b1f94373c1a5a7e2d27d6fbfaeadeea4e03c5bd1f7/u);
  assert.match(notice, /92a1fc68840bd3bd049e10e262610db31e92cb77e693b078dd74a1824149ba94/u);
  assert.match(notice, /derived.*display/i);
  assert.match(notice, /population.*excluded/i);
  assert.match(notice, /raw.*not.*committed/i);
});
