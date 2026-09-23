import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve('data/postal_country_packs/gs/postal-context');

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
}

function digest(path: string) {
  return `sha256:${createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')}`;
}

test('GS repository separates the official SIQQ assignment from derived whole-territory display geometry', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const upu = profile.sources.find((item: any) => item.source_id === 'upu-universal-postcode-database-2026-08-gs');
  const sheet = profile.sources.find((item: any) => item.source_id === 'upu-gs-addressing-sheet-2005-08');
  const geometrySource = profile.sources.find((item: any) => item.source_id === 'bas-sggis-gs-edition-1.0-derived-whole-territory');

  assert.equal(manifest.repository.country_code, 'GS');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_upu_siqq_whole_territory_derived_visualization');
  assert.match(manifest.postal_system.assignment_rule, /SIQQ 1ZZ.*single postcode.*whole territory/is);
  assert.match(manifest.postal_system.geometry_rule, /No reusable official postal polygon.*derived display geometry.*never an official/is);
  assert.match(manifest.postal_system.agid_rule, /GS remains a distinct source identity.*not merged/i);
  assert.equal(upu.assignment_authority, 'official_postal_dictionary');
  assert.equal(upu.geometry_authority, 'none');
  assert.match(upu.observed_release.finding, /SIQQ 1ZZ/i);
  assert.match(sheet.observed_release.finding, /Single postcode.*SIQQ 1ZZ/i);
  assert.equal(geometrySource.assignment_authority, 'derived_spatial_assignment');
  assert.equal(geometrySource.geometry_authority, 'official_mapping_geometry');
  assert.equal(geometrySource.bundled_here, true);
  assert.match(geometrySource.attribution, /South Georgia GIS.*BAS.*CC BY 4\.0/i);
  assert.equal(profile.receipt_summary.exact_bodies, 10);
  assert.equal(profile.receipt_summary.exact_bytes, 6_655_035);
  assert.equal(profile.receipt_summary.raw_source_bodies_in_git, 0);
});

test('GS descriptor pins two real derived MultiPolygons without address, building or identity leakage', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');

  assert.equal(descriptor.countryCode, 'GS');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.filter((node: any) => node.kind === 'postal_feature').length, 1);
  assert.equal(graph.nodes.find((node: any) => node.kind === 'postal_feature').postalCode, 'SIQQ 1ZZ');
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization'].includes(node.kind)));
  assert.equal(graph.assertions[0].source.assignmentAuthority, 'official_postal_dictionary');
  assert.equal(graph.assertions[0].source.geometryAuthority, 'none');
  assert.equal(geometry.features.length, 2);
  assert.ok(geometry.features.every((item: any) => item.geometry.type === 'MultiPolygon'));
  assert.ok(geometry.features.every((item: any) => item.source.sourceType === 'derived'));
  assert.ok(geometry.features.every((item: any) => item.source.assignmentAuthority === 'derived_spatial_assignment'));
  assert.ok(geometry.features.every((item: any) => item.source.geometryAuthority === 'official_mapping_geometry'));
  assert.ok(geometry.features.every((item: any) => item.quality.status === 'derived' && item.quality.confidence === 0.9));
});

test('GS source notice pins primary evidence and coordinate-preserving partition without raw source bytes', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d/u);
  assert.match(notice, /b301ba2e6f28548adcb193cda244c07e0003ec7be209913c9acea6a02ebcd928/u);
  assert.match(notice, /27b4cd2085b9c845abf7928c336cf82f0d37492bbe2c21522ac4c670750f6cff/u);
  assert.match(notice, /357.*90,610/is);
  assert.match(notice, /without coordinate rounding or simplification/i);
  assert.match(notice, /excluded from Git/i);
});
