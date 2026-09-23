import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assessBreadcrumbReconstruction,
  isBreadcrumbReconstructionOptimal,
} from './breadcrumbCompatibility';

test('marks breadcrumb reconstruction optimal when the chain is unique, complete, and AGID-compatible', () => {
  const assessment = assessBreadcrumbReconstruction({
    countryCode: 'JP',
    agidId: 'AGID-JP-13-SHIBUYA-JINNAN-1-19-11',
    leafNodeId: 'building-parkway-square',
    requiredKinds: ['country', 'admin1', 'municipality', 'locality', 'block', 'building'],
    nodes: [
      { id: 'jp', kind: 'country', name: 'Japan', countryCode: 'JP' },
      { id: 'tokyo', kind: 'admin1', name: 'Tokyo', parentId: 'jp', countryCode: 'JP' },
      { id: 'shibuya', kind: 'municipality', name: 'Shibuya-ku', parentId: 'tokyo', countryCode: 'JP' },
      { id: 'jinnan', kind: 'locality', name: 'Jinnan', parentId: 'shibuya', countryCode: 'JP' },
      { id: 'block-1-19-11', kind: 'block', name: '1-19-11', parentId: 'jinnan', countryCode: 'JP' },
      {
        id: 'building-parkway-square',
        kind: 'building',
        name: 'Parkway Square',
        parentId: 'block-1-19-11',
        countryCode: 'JP',
        agidId: 'AGID-JP-13-SHIBUYA-JINNAN-1-19-11',
      },
    ],
  });

  assert.equal(assessment.decision, 'optimal');
  assert.equal(assessment.agidCompatible, true);
  assert.equal(assessment.path.map(node => node.id).join('>'), 'jp>tokyo>shibuya>jinnan>block-1-19-11>building-parkway-square');
  assert.deepEqual(assessment.requiredFallbacks, []);
  assert.equal(isBreadcrumbReconstructionOptimal(assessment), true);
});

test('keeps breadcrumbs compatible but not optimal when postal anchors define delivery better than the hierarchy', () => {
  const assessment = assessBreadcrumbReconstruction({
    countryCode: 'GB',
    agidId: 'AGID-GB-LON-POSTCODE-CELL',
    leafNodeId: 'flat-12',
    requiredKinds: ['country', 'admin1', 'municipality', 'street', 'building', 'unit'],
    postalAnchor: {
      code: 'SW1A 1AA',
      reliability: 'strong',
      coversLeaf: true,
    },
    nodes: [
      { id: 'gb', kind: 'country', name: 'United Kingdom', countryCode: 'GB' },
      { id: 'england', kind: 'admin1', name: 'England', parentId: 'gb', countryCode: 'GB' },
      { id: 'westminster', kind: 'municipality', name: 'Westminster', parentId: 'england', countryCode: 'GB' },
      { id: 'downing-street', kind: 'street', name: 'Downing Street', parentId: 'westminster', countryCode: 'GB' },
      { id: 'building-10', kind: 'building', name: '10', parentId: 'downing-street', countryCode: 'GB', agidId: 'AGID-GB-LON-POSTCODE-CELL' },
      { id: 'flat-12', kind: 'unit', name: 'Flat 12', parentId: 'building-10', countryCode: 'GB' },
    ],
  });

  assert.equal(assessment.decision, 'compatible');
  assert.equal(assessment.agidCompatible, true);
  assert.ok(assessment.reasons.includes('strong-postal-anchor'));
  assert.ok(assessment.requiredFallbacks.includes('postal-anchor'));
  assert.equal(isBreadcrumbReconstructionOptimal(assessment), false);
});

test('requires manual review for disputed or overlapping parentage instead of forcing one breadcrumb', () => {
  const assessment = assessBreadcrumbReconstruction({
    countryCode: 'JP',
    agidId: 'AGID-JP-DISPUTED-SEA-CELL',
    leafNodeId: 'island-feature',
    requiredKinds: ['country', 'admin1', 'locality'],
    claimPolicy: 'japan-primary',
    nodes: [
      { id: 'jp', kind: 'country', name: 'Japan', countryCode: 'JP' },
      { id: 'jp-pref', kind: 'admin1', name: 'Japanese claimed prefecture', parentId: 'jp', countryCode: 'JP' },
      { id: 'foreign-admin', kind: 'admin1', name: 'Foreign claimed administration', countryCode: 'KR' },
      {
        id: 'island-feature',
        kind: 'natural_feature',
        name: 'Disputed island feature',
        parentId: 'jp-pref',
        alternateParentIds: ['foreign-admin'],
        countryCode: 'JP',
        agidId: 'AGID-JP-DISPUTED-SEA-CELL',
      },
    ],
  });

  assert.equal(assessment.decision, 'manual_required');
  assert.equal(assessment.agidCompatible, false);
  assert.ok(assessment.reasons.includes('multiple-parent-claims'));
  assert.ok(assessment.requiredFallbacks.includes('claim-policy-rendering'));
});

test('uses AGID as primary identifier when formal address hierarchy is incomplete', () => {
  const assessment = assessBreadcrumbReconstruction({
    countryCode: 'ML',
    agidId: 'AGID-ML-DESERT-CELL',
    leafNodeId: 'camp-area',
    requiredKinds: ['country', 'admin1', 'municipality', 'street'],
    nodes: [
      { id: 'ml', kind: 'country', name: 'Mali', countryCode: 'ML' },
      { id: 'kidal', kind: 'admin1', name: 'Kidal', parentId: 'ml', countryCode: 'ML' },
      { id: 'camp-area', kind: 'natural_feature', name: 'Camp area', parentId: 'kidal', countryCode: 'ML', agidId: 'AGID-ML-DESERT-CELL' },
    ],
  });

  assert.equal(assessment.decision, 'compatible');
  assert.equal(assessment.agidCompatible, true);
  assert.ok(assessment.missingRequiredKinds.includes('municipality'));
  assert.ok(assessment.missingRequiredKinds.includes('street'));
  assert.ok(assessment.requiredFallbacks.includes('agid-primary'));
});
