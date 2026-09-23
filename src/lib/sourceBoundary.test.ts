import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildSourceBoundaryMovePlan,
  getSourceBoundaryEntriesByKind,
  getSourceBoundaryEntry,
  getSourceBoundaryManifest,
  summarizeSourceBoundary,
  validateSourceBoundaryManifest,
} from './sourceBoundary';

test('summarizes the OSS, commercial, and dual-contract source split', () => {
  const summary = summarizeSourceBoundary();

  assert.equal(summary.totalEntries, 20);
  assert.equal(summary.openSourceEntries, 8);
  assert.equal(summary.commercialEntries, 8);
  assert.equal(summary.dualContractEntries, 4);
  assert.equal(summary.stableCurrentPaths, 20);
  assert.equal(summary.publicApiEntries, 12);
});

test('validates the source boundary manifest', () => {
  const validation = validateSourceBoundaryManifest();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});

test('keeps non-negotiable local capabilities in open-source entries', () => {
  const openSourceIds = getSourceBoundaryEntriesByKind('open-source').map(entry => entry.id);

  for (const id of [
    'agid-aoid-public-standards',
    'local-resolver-address-display',
    'address-registration-and-element',
    'basic-pos-terminal',
    'address-portal-user-control',
    'privacy-security-release-gates',
    'zk-baseline-open-proof-relations',
  ]) {
    assert.ok(openSourceIds.includes(id), id);
  }

  for (const entry of getSourceBoundaryEntriesByKind('open-source')) {
    assert.notEqual(entry.license, 'Commercial', entry.id);
    assert.ok(entry.recommendedPaths.every(path => !path.includes('/commercial/')), entry.id);
  }
});

test('treats Address Morphism Theory as an independent canonical research repository', () => {
  const docs = getSourceBoundaryEntry('developer-docs-research-and-test-vectors');

  assert.ok(docs);
  assert.equal(docs.boundary, 'open-source');
  assert.ok(docs.currentPaths.includes('docs/address-morphism-theory-*.md'));
  assert.ok(docs.recommendedPaths.includes('external/address-morphism-theory/**'));
  assert.ok(docs.compatibility.keepCurrentPath);
  assert.ok(docs.compatibility.notes.some(note => /independent address-morphism-theory repository/i.test(note)));
  assert.ok(docs.guardrails.some(rule => /Do not edit AMT papers as AGID runtime/i.test(rule)));
});

test('requires commercial entries to expose an OSS fallback and open dependency boundary', () => {
  for (const entry of getSourceBoundaryEntriesByKind('commercial')) {
    assert.ok(entry.ossFallback && entry.ossFallback.length > 0, entry.id);
    assert.ok(entry.commercialDependsOn && entry.commercialDependsOn.length > 0, entry.id);
    assert.ok(
      entry.recommendedPaths.some(path => path.includes('/commercial/') || path.includes('enterprise/')),
      entry.id,
    );
  }
});

test('keeps dual-contract products as public models with commercial operations separated', () => {
  const dualEntries = getSourceBoundaryEntriesByKind('dual-contract');

  assert.deepEqual(dualEntries.map(entry => entry.id), [
    'veygrit-id-address-login',
    'postal-zone-designer-governance',
    'operations-workspace-trading-models',
    'drone-locker-ops-simulator-and-fleet',
  ]);

  for (const entry of dualEntries) {
    assert.equal(entry.compatibility.publicApiMustRemain, true, entry.id);
    assert.ok(entry.ossFallback && entry.ossFallback.length > 0, entry.id);
    assert.ok(entry.recommendedPaths.some(path => path.includes('/commercial/')), entry.id);
  }
});

test('does not move files immediately and marks shim work as the first step', () => {
  const movePlan = buildSourceBoundaryMovePlan();

  assert.equal(movePlan.length, summarizeSourceBoundary().totalEntries);
  for (const item of movePlan) {
    assert.equal(item.moveNow, false, item.id);
    assert.ok(
      item.firstStep.includes('shim') || item.firstStep.includes('redirect'),
      `${item.id}:${item.firstStep}`,
    );
  }
});

test('documents the Veygrit ID and finance/trading/workspace compatibility boundary', () => {
  const veygrit = getSourceBoundaryEntry('veygrit-id-address-login');
  const tradeOps = getSourceBoundaryEntry('operations-workspace-trading-models');

  assert.ok(veygrit);
  assert.equal(veygrit.boundary, 'dual-contract');
  assert.equal(veygrit.compatibility.stableImport, 'src/lib/veygritId.ts');
  assert.ok(veygrit.guardrails.some(rule => /reviewed organizations/i.test(rule)));

  assert.ok(tradeOps);
  assert.equal(tradeOps.boundary, 'dual-contract');
  assert.ok(tradeOps.currentPaths.includes('src/lib/veyFinance.ts'));
  assert.ok(tradeOps.guardrails.some(rule => /regulated financial services/i.test(rule)));
});

test('keeps hard rules focused on compatibility, local-first operation, and raw-address separation', () => {
  const hardRules = getSourceBoundaryManifest().hardRules.join('\n');

  assert.match(hardRules, /Do not move existing source paths/);
  assert.match(hardRules, /Mode 0 Local Only/);
  assert.match(hardRules, /No raw address/);
  assert.match(hardRules, /OSS core must not import commercial modules/);
});
