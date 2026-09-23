import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve('data/postal_country_packs/fk/postal-context');

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
}

function digest(path: string) {
  return `sha256:${createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')}`;
}

test('FK repository separates official FIQQ assignment from derived display geometry and records the F1QQ exception', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const upu = profile.sources.find((item: any) => item.source_id === 'upu-universal-postcode-database-2026-08-fk');
  const sheet = profile.sources.find((item: any) => item.source_id === 'upu-falkland-islands-addressing-sheet-2005-08');
  const geometrySource = profile.sources.find((item: any) => item.source_id === 'geoboundaries-gbopen-flk-adm0-9469f095-simplified');

  assert.equal(manifest.repository.country_code, 'FK');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_upu_fiqq_whole_territory_derived_visualization');
  assert.match(manifest.postal_system.assignment_rule, /FIQQ 1ZZ.*single postcode.*whole territory.*F1QQ 1ZZ.*exception/is);
  assert.match(manifest.postal_system.geometry_rule, /No reusable official postal polygon.*derived display geometry.*never presented as an official/is);
  assert.match(manifest.postal_system.agid_rule, /FK remains a distinct source identity.*not merged/i);
  assert.equal(upu.assignment_authority, 'official_postal_dictionary');
  assert.equal(upu.geometry_authority, 'none');
  assert.match(upu.observed_release.finding, /F1QQ 1ZZ.*FIQQ 1ZZ.*rejected/is);
  assert.match(sheet.observed_release.finding, /FIQQ 1ZZ/i);
  assert.equal(geometrySource.assignment_authority, 'derived_spatial_assignment');
  assert.equal(geometrySource.geometry_authority, 'derived_geometry');
  assert.equal(geometrySource.bundled_here, true);
  assert.match(geometrySource.attribution, /geoBoundaries.*CC BY 4\.0/i);
});

test('FK descriptor pins graph and real derived geometry without address, building or identity leakage', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');

  assert.equal(descriptor.countryCode, 'FK');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.filter((node: any) => node.kind === 'postal_feature').length, 1);
  assert.equal(graph.nodes.find((node: any) => node.kind === 'postal_feature').postalCode, 'FIQQ 1ZZ');
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization'].includes(node.kind)));
  assert.equal(graph.assertions[0].source.assignmentAuthority, 'official_postal_dictionary');
  assert.equal(graph.assertions[0].source.geometryAuthority, 'none');
  assert.equal(geometry.features.length, 2);
  assert.ok(geometry.features.every((item: any) => item.source.sourceType === 'derived'));
  assert.ok(geometry.features.every((item: any) => item.source.assignmentAuthority === 'derived_spatial_assignment'));
  assert.ok(geometry.features.every((item: any) => item.source.geometryAuthority === 'derived_geometry'));
  assert.ok(geometry.features.every((item: any) => item.quality.status === 'derived' && item.quality.confidence === 0.9));
});

test('FK source notice pins primary evidence and records coordinate-preserving partition without raw source bytes', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /315549e7306f606adf348c33bc2abaf3e474001e9a4146138b5e829f7d353a5d/u);
  assert.match(notice, /4f584a9a08910fe7b3dd3fd7f279f84928646c37045ec3d199c184093b3c231b/u);
  assert.match(notice, /9469f09592ced973a3448cf66b6100b741b64c0d/u);
  assert.match(notice, /F1QQ 1ZZ.*exception.*reject/is);
  assert.match(notice, /derived whole-territory display surface/i);
  assert.match(notice, /not redistributed/i);
});
