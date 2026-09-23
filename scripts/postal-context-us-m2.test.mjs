import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const digest = path => `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
const directory = 'data/postal_country_packs/us/postal-context/m2';

test('US real Census ZCTA validation pack preserves source semantics, IDs and geometry quality', () => {
  const descriptor = readJson(`${directory}/descriptor.json`);
  const graph = readJson(`${directory}/graph.json`);
  const geometry = readJson(`${directory}/geometry.json`);
  const report = readJson('reports/postal-context-m2/us-zcta-validation-2026-09-02.json');
  const byRole = Object.fromEntries(descriptor.artifacts.map(item => [item.role, item]));

  assert.equal(descriptor.countryCode, 'US');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, false);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(digest(`${directory}/graph.json`), byRole.graph.digest);
  assert.equal(digest(`${directory}/geometry.json`), byRole.geometry.digest);
  assert.deepEqual(byRole.graph.recordCounts, { assertions: 2, nodes: 3 });
  assert.deepEqual(byRole.geometry.recordCounts, { features: 1, positions: 124 });

  const postal = graph.nodes.find(node => node.id === 'postal-us-census-zcta-10001');
  const cell = graph.nodes.find(node => node.kind === 'agid_cell');
  assert.equal(postal.postalCode, '10001');
  assert.match(postal.label, /population 32,612.*housing 18,926.*land 1\.62 km²/u);
  assert.equal(cell.agidCellId, 'USARPV8JCJET');
  assert.deepEqual(
    graph.assertions.map(item => item.relation).sort(),
    ['admin_within', 'covered_by_agid'],
  );
  assert.ok(graph.assertions.every(item => item.source.sourceType === 'derived'));

  const feature = geometry.features[0];
  assert.equal(feature.id, 'census-us-zcta-2020-10001');
  assert.equal(feature.geometry.type, 'Polygon');
  assert.equal(feature.geometry.coordinates.length, 3);
  assert.equal(feature.geometry.coordinates.reduce((sum, ring) => sum + ring.length, 0), 124);
  assert.ok(feature.geometry.coordinates.every(ring => assert.deepEqual(ring[0], ring.at(-1)) === undefined));
  assert.equal(feature.source.geometryAuthority, 'official_mapping_geometry');
  assert.equal(feature.quality.status, 'derived');
  assert.equal(feature.quality.confidence, 0.9);

  assert.equal(report.scope.nationalCensusObjectIdDenominator, 33791);
  assert.equal(report.scope.publishedValidationSamples, 1);
  assert.equal(report.scope.completeCurrentUspsAssignmentRecords, 0);
  assert.equal(report.scope.m2QualifiedRecords, 0);
  assert.equal(report.policy.uspsLicensedRowsPublished, 0);
  assert.equal(report.policy.inventedAreaRowsPublished, 0);
  assert.equal(report.detail.agidCellId, 'USARPV8JCJET');
  assert.equal(report.geometry.structuralValidity, true);
  assert.equal(report.geometry.geometricModification, false);
  assert.equal(report.input.exactReceipts.length, 11);
  assert.ok(report.input.exactReceipts.every(item => /^sha256:[a-f0-9]{64}$/u.test(item.digest)));
});
