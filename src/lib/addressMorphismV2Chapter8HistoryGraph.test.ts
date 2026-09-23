import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER8_HISTORY_GRAPH_VERSION,
  buildChapter8HistoryGraphReport,
  computeChapter8LineageRoot,
  evaluateChapter8Transition,
  isChapter8ApplicationIdentifierPid,
  resolveChapter8SuccessorIds,
  scoreChapter8SocialContinuity,
  validateChapter8HistoryGraph,
  type Chapter8HistoryGraph,
} from './addressMorphismV2Chapter8HistoryGraph';

const baseGraph: Chapter8HistoryGraph = {
  nodes: [
    {
      id: 'rpid-parent',
      kind: 'referent',
      pidKind: 'rpid',
      status: 'split',
      evidenceCount: 3,
      socialContinuityScore: 0.8,
      publicProjectionSafe: true,
      privateContentExposed: false,
    },
    {
      id: 'rpid-child-a',
      kind: 'referent',
      pidKind: 'rpid',
      status: 'active',
      evidenceCount: 2,
      socialContinuityScore: 0.7,
      publicProjectionSafe: true,
      privateContentExposed: false,
    },
    {
      id: 'rpid-child-b',
      kind: 'referent',
      pidKind: 'rpid',
      status: 'active',
      evidenceCount: 2,
      socialContinuityScore: 0.7,
      publicProjectionSafe: true,
      privateContentExposed: false,
    },
  ],
  edges: [
    {
      from: 'rpid-parent',
      to: 'rpid-child-a',
      kind: 'split',
      effectiveTime: '2026-07-02',
      evidenceCount: 2,
      preservesReferent: false,
      preservesDelivery: false,
    },
    {
      from: 'rpid-parent',
      to: 'rpid-child-b',
      kind: 'split',
      effectiveTime: '2026-07-02',
      evidenceCount: 2,
      preservesReferent: false,
      preservesDelivery: false,
    },
  ],
};

test('chapter 8 report records history, lineage, social continuity, and identifier-boundary models', () => {
  const report = buildChapter8HistoryGraphReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER8_HISTORY_GRAPH_VERSION);
  assert.ok(report.executableModelKinds.includes('history graph'));
  assert.ok(report.executableModelKinds.includes('RPID/DPID/application identifier separation'));
  assert.ok(report.executableModelKinds.includes('lineage root'));
  assert.ok(report.executableModelKinds.includes('social continuity evidence'));
  assert.match(report.safetyRule, /preserving audited lineage/);
});

test('chapter 8 validates a split graph with explicit child successors', () => {
  assert.deepEqual(validateChapter8HistoryGraph(baseGraph), []);
  assert.deepEqual(resolveChapter8SuccessorIds(baseGraph, 'rpid-parent'), ['rpid-child-a', 'rpid-child-b']);
});

test('chapter 8 lineage root is deterministic and changes with lineage edits', () => {
  const root = computeChapter8LineageRoot(baseGraph);
  const sameRoot = computeChapter8LineageRoot({ nodes: [...baseGraph.nodes].reverse(), edges: [...baseGraph.edges].reverse() });
  const changedRoot = computeChapter8LineageRoot({
    ...baseGraph,
    edges: [{ ...baseGraph.edges[0], evidenceCount: 3 }, baseGraph.edges[1]],
  });

  assert.equal(root, sameRoot);
  assert.notEqual(root, changedRoot);
});

test('chapter 8 split and merge cannot silently preserve RPID or DPID', () => {
  const evaluation = evaluateChapter8Transition({
    from: 'a',
    to: 'b',
    kind: 'split',
    effectiveTime: '2026-07-02',
    evidenceCount: 1,
    preservesReferent: true,
    preservesDelivery: true,
  });

  assert.equal(evaluation.safe, false);
  assert.equal(evaluation.requiresSuccessorEdge, true);
  assert.ok(evaluation.reasons.includes('split-merge-cannot-silently-preserve-rpid'));
  assert.ok(evaluation.reasons.includes('split-merge-must-recompute-dpid'));
});

test('chapter 8 relocation can preserve social referent while requiring DPID recomputation', () => {
  const evaluation = evaluateChapter8Transition({
    from: 'old-office',
    to: 'new-office',
    kind: 'relocation',
    effectiveTime: '2026-07-02',
    evidenceCount: 4,
    preservesReferent: true,
    preservesDelivery: false,
  });

  assert.equal(evaluation.safe, true);
  assert.equal(evaluation.rpidPreserved, true);
  assert.equal(evaluation.dpidPreserved, false);
});

test('chapter 8 public history projection blocks private leakage', () => {
  const unsafeGraph: Chapter8HistoryGraph = {
    nodes: [{ ...baseGraph.nodes[0], privateContentExposed: true }],
    edges: [],
  };

  assert.deepEqual(validateChapter8HistoryGraph(unsafeGraph), ['public-projection-unsafe:rpid-parent']);
});

test('chapter 8 social continuity is bounded evidence, not identity proof', () => {
  const continuity = scoreChapter8SocialContinuity({
    operator: 1,
    usage: 0.9,
    legal: 0.8,
    delivery: 0.7,
    community: 0.8,
    history: 1,
  });

  assert.ok(continuity.score > 0.8);
  assert.equal(continuity.nonClaim, 'social continuity is evidence, not identity proof');
});

test('chapter 8 application identifiers are not AMT PIDs', () => {
  const appNode = {
    id: 'shop-order-123',
    kind: 'application_identifier' as const,
    pidKind: 'application_id' as const,
    status: 'active' as const,
    evidenceCount: 1,
    socialContinuityScore: 0,
    publicProjectionSafe: true,
    privateContentExposed: false,
  };

  assert.equal(isChapter8ApplicationIdentifierPid(appNode), false);
});
