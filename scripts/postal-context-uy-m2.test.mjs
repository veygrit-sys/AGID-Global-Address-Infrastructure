import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const directory = 'data/postal_country_packs/uy/postal-context/m2';
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const digest = path => `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;

test('UY fixed official release preserves denominators, repaired geometry, source IDs and AGID reference IDs', () => {
  const descriptor = readJson(`${directory}/descriptor.json`);
  const graph = readJson(`${directory}/graph.json`);
  const geometry = readJson(`${directory}/geometry.json`);
  const report = readJson('reports/postal-context-m2/uy-fixed-official-release-2026-09-02.json');
  const byRole = Object.fromEntries(descriptor.artifacts.map(item => [item.role, item]));

  assert.equal(descriptor.countryCode, 'UY');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, false);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(digest(`${directory}/graph.json`), byRole.graph.digest);
  assert.equal(digest(`${directory}/geometry.json`), byRole.geometry.digest);
  assert.deepEqual(byRole.graph.recordCounts, { assertions: 242, nodes: 243 });
  assert.deepEqual(byRole.geometry.recordCounts, { features: 121, positions: 251680 });

  const postalNodes = graph.nodes.filter(node => node.kind === 'postal_feature');
  const agidNodes = graph.nodes.filter(node => node.kind === 'agid_cell');
  assert.equal(postalNodes.length, 121);
  assert.equal(new Set(postalNodes.map(node => node.postalCode)).size, 121);
  assert.ok(postalNodes.every(node => /^\d{5}$/u.test(node.postalCode)));
  assert.equal(agidNodes.length, 121);
  assert.equal(new Set(agidNodes.map(node => node.agidCellId)).size, 121);
  assert.ok(agidNodes.every(node => /^UY[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{10}$/u.test(node.agidCellId)));
  assert.deepEqual(new Set(graph.assertions.map(item => item.relation)), new Set(['admin_within', 'covered_by_agid']));
  assert.equal(graph.assertions.filter(item => item.source.sourceType === 'official').length, 121);
  assert.equal(graph.assertions.filter(item => item.source.sourceType === 'derived').length, 121);

  assert.equal(geometry.features.length, 121);
  assert.equal(geometry.features.reduce((sum, feature) => sum + feature.geometry.coordinates.flat(3).filter(Number.isFinite).length / 2, 0), 251680);
  assert.ok(geometry.features.every(feature => feature.geometry.type === 'Polygon'));
  assert.ok(geometry.features.every(feature => feature.geometry.coordinates.every(ring => {
    assert.deepEqual(ring[0], ring.at(-1));
    return true;
  })));
  assert.ok(geometry.features.every(feature => feature.source.geometryAuthority === 'official_postal_geometry'));
  assert.equal(geometry.features.find(feature => feature.nodeId.endsWith('-15400')).geometry.coordinates.length, 1);

  const sample = report.idLinkage.sample;
  assert.equal(sample.postalCode, '11000');
  assert.equal(sample.officialCpId, 1);
  assert.equal(sample.postalContextId, 'postal-uy-correo-2023-11000');
  assert.equal(sample.geometryId, 'correo-uy-postal-2023-11000');
  assert.equal(sample.agidCellId, 'UY0FZ5D9368V');
  assert.equal(report.scope.officialFixedPostalAreas, 121);
  assert.equal(report.scope.completeForAugust2023Release, true);
  assert.equal(report.scope.current2026AssignmentAndSupersessionEstablished, false);
  assert.equal(report.scope.m2QualifiedCurrentRecords, 0);
  assert.equal(report.geometry.shapefileCrossCheck.dbfKmlMatch, true);
  assert.equal(report.geometry.sourcePositions, 251684);
  assert.equal(report.geometry.positions, 251680);
  assert.equal(report.geometry.removedDegeneratePositions, 4);
  assert.equal(report.geometry.topologyRepair, true);
  assert.equal(report.policy.reservedDetailedCpaRowsPublished, 0);
  assert.equal(report.policy.addressesBuildingsParcelsRecipientsCustomersPeopleOrLandRightsPublished, 0);
  assert.ok(report.input.exactReceipts.every(item => /^sha256:[a-f0-9]{64}$/u.test(item.digest)));
});
