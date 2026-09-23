import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const base = 'data/postal_country_packs/vi/postal-context/m2';

test('VI fixed artifacts are digest-bound and expose six real Census ZCTA surfaces', () => {
  const descriptor = readJson(`${base}/descriptor.json`);
  const graph = readJson(`${base}/graph.json`);
  const geometry = readJson(`${base}/geometry.json`);
  assert.equal(descriptor.countryCode, 'VI');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, false);
  assert.equal(descriptor.artifacts[0].digest, digest(readFileSync(`${base}/graph.json`)));
  assert.equal(descriptor.artifacts[1].digest, digest(readFileSync(`${base}/geometry.json`)));
  assert.equal(geometry.features.length, 6);
  assert.deepEqual(geometry.features.map(feature => feature.nodeId.replace('postal-vi-census-zcta-', '')), ['00802', '00820', '00830', '00840', '00850', '00851']);
  assert.deepEqual(geometry.features.reduce((counts, feature) => ({ ...counts, [feature.geometry.type]: (counts[feature.geometry.type] ?? 0) + 1 }), {}), { Polygon: 4, MultiPolygon: 2 });
  assert.ok(geometry.features.every(feature => feature.source.sourceType === 'derived'));
  assert.ok(geometry.features.every(feature => feature.source.geometryAuthority === 'official_mapping_geometry'));
  assert.equal(graph.nodes.filter(node => node.kind === 'postal_feature').length, 6);
  assert.equal(graph.nodes.filter(node => node.kind === 'agid_cell').length, 5);
});

test('VI detailed IDs preserve territory identity and withhold the mismatched 00830 AGID crosswalk', () => {
  const report = readJson('reports/postal-context-m2/vi-zcta-validation-2026-09-03.json');
  assert.equal(report.geometry.structuralValidity, true);
  assert.equal(report.geometry.positions, 11767);
  assert.equal(report.idLinkage.agidCrosswalksPublished, 5);
  assert.equal(report.idLinkage.agidCrosswalksWithheld, 1);
  const mismatch = report.idLinkage.recordsDetail.find(row => row.postalCode === '00830');
  assert.equal(mismatch.computedAgidCellId, 'VG0ETQRJZKGQ');
  assert.equal(mismatch.agidCellId, null);
  assert.equal(mismatch.agidJurisdictionPrefixMatchesSource, false);
  assert.ok(report.idLinkage.recordsDetail.filter(row => row.agidCellId).every(row => row.agidCellId.startsWith('VI')));
  assert.equal(report.policy.viIdentityPreserved, true);
  assert.equal(report.policy.inventedAreaRowsPublished, 0);
  assert.equal(report.scope.m2QualifiedRecords, 0);
});

test('VI manifest keeps current USPS M2 separate from the derived validation pack', () => {
  const manifest = readJson('data/postal_country_packs/vi/postal-context/repository-manifest.json');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.promotion.data_completion_verified, false);
  assert.match(manifest.postal_system.geometry_rule, /derived display and validation context/iu);
  assert.match(manifest.postal_system.building_rule, /does not establish an address or building relation/iu);
  assert.match(manifest.postal_system.agid_rule, /withhold the 00830 crosswalk/iu);
});
