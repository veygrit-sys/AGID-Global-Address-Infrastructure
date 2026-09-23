export const ADDRESS_MORPHISM_V2_CHAPTER8_HISTORY_GRAPH_VERSION =
  'address-morphism-v2-chapter8-history-graph-v0.1';

export type Chapter8PidKind = 'rpid' | 'dpid' | 'application_id';

export type Chapter8NodeStatus = 'active' | 'deprecated' | 'split' | 'merged' | 'superseded' | 'blocked';

export type Chapter8NodeKind =
  | 'referent'
  | 'surface_expression'
  | 'delivery_state'
  | 'social_entity'
  | 'pid_state'
  | 'application_identifier';

export type Chapter8TransitionKind =
  | 'rename'
  | 'relocation'
  | 'split'
  | 'merge'
  | 'deprecation'
  | 'successor'
  | 'delivery-change'
  | 'application-alias'
  | 'social-continuity-claim';

export type Chapter8HistoryNode = {
  id: string;
  kind: Chapter8NodeKind;
  pidKind: Chapter8PidKind;
  status: Chapter8NodeStatus;
  evidenceCount: number;
  socialContinuityScore: number;
  publicProjectionSafe: boolean;
  privateContentExposed: boolean;
};

export type Chapter8HistoryEdge = {
  from: string;
  to: string;
  kind: Chapter8TransitionKind;
  effectiveTime: string;
  evidenceCount: number;
  preservesReferent: boolean;
  preservesDelivery: boolean;
};

export type Chapter8HistoryGraph = {
  nodes: Chapter8HistoryNode[];
  edges: Chapter8HistoryEdge[];
};

export type Chapter8TransitionEvaluation = {
  safe: boolean;
  rpidPreserved: boolean;
  dpidPreserved: boolean;
  requiresSuccessorEdge: boolean;
  reasons: string[];
};

export function buildChapter8HistoryGraphReport() {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER8_HISTORY_GRAPH_VERSION,
    executableModelKinds: [
      'history graph',
      'RPID/DPID/application identifier separation',
      'lineage root',
      'split transition safety',
      'merge transition safety',
      'deprecation and successor boundary',
      'social continuity evidence',
      'public history projection safety',
      'application identifier non-PID boundary',
    ],
    safetyRule:
      'PID conservation means preserving audited lineage for changes, not forcing one identifier to survive every rename, split, merge, or relocation.',
  };
}

export function validateChapter8HistoryGraph(graph: Chapter8HistoryGraph): string[] {
  const errors: string[] = [];
  const nodeIds = new Set<string>();

  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`duplicate-node:${node.id}`);
    }
    nodeIds.add(node.id);

    if (node.evidenceCount < 0) {
      errors.push(`negative-evidence:${node.id}`);
    }
    if (node.socialContinuityScore < 0 || node.socialContinuityScore > 1) {
      errors.push(`social-continuity-out-of-range:${node.id}`);
    }
    if (node.privateContentExposed || !node.publicProjectionSafe) {
      errors.push(`public-projection-unsafe:${node.id}`);
    }
    if (node.pidKind === 'application_id' && node.kind !== 'application_identifier') {
      errors.push(`application-id-kind-mismatch:${node.id}`);
    }
  }

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from)) {
      errors.push(`missing-edge-from:${edge.from}`);
    }
    if (!nodeIds.has(edge.to)) {
      errors.push(`missing-edge-to:${edge.to}`);
    }
    if (!edge.effectiveTime) {
      errors.push(`missing-effective-time:${edge.from}->${edge.to}`);
    }
    if (edge.evidenceCount <= 0) {
      errors.push(`missing-transition-evidence:${edge.from}->${edge.to}`);
    }
    if ((edge.kind === 'split' || edge.kind === 'merge') && edge.preservesReferent) {
      errors.push(`split-merge-cannot-silently-preserve-referent:${edge.from}->${edge.to}`);
    }
  }

  return errors;
}

export function evaluateChapter8Transition(edge: Chapter8HistoryEdge): Chapter8TransitionEvaluation {
  const reasons: string[] = [];
  const requiresSuccessorEdge = edge.kind === 'split' || edge.kind === 'merge' || edge.kind === 'deprecation';
  let rpidPreserved = false;
  let dpidPreserved = false;

  if (edge.kind === 'rename') {
    rpidPreserved = edge.preservesReferent;
    dpidPreserved = edge.preservesDelivery;
  }

  if (edge.kind === 'relocation') {
    rpidPreserved = edge.preservesReferent;
    dpidPreserved = false;
    if (edge.preservesDelivery) reasons.push('relocation-must-recompute-dpid');
  }

  if (edge.kind === 'split' || edge.kind === 'merge') {
    if (edge.preservesReferent) reasons.push('split-merge-cannot-silently-preserve-rpid');
    if (edge.preservesDelivery) reasons.push('split-merge-must-recompute-dpid');
  }

  if (edge.kind === 'application-alias') {
    reasons.push('application-identifier-is-not-pid');
  }

  if (edge.evidenceCount <= 0) {
    reasons.push('transition-evidence-required');
  }

  return {
    safe: reasons.length === 0,
    rpidPreserved,
    dpidPreserved,
    requiresSuccessorEdge,
    reasons,
  };
}

export function resolveChapter8SuccessorIds(graph: Chapter8HistoryGraph, nodeId: string): string[] {
  const activeNodeIds = new Set(
    graph.nodes.filter(node => node.status === 'active' || node.status === 'superseded').map(node => node.id),
  );

  return graph.edges
    .filter(edge => edge.from === nodeId && (edge.kind === 'successor' || edge.kind === 'split' || edge.kind === 'merge'))
    .map(edge => edge.to)
    .filter(id => activeNodeIds.has(id))
    .sort();
}

export function computeChapter8LineageRoot(graph: Chapter8HistoryGraph): string {
  const canonical = [
    ...graph.nodes
      .map(node => `N:${node.id}:${node.kind}:${node.pidKind}:${node.status}:${node.evidenceCount}`)
      .sort(),
    ...graph.edges
      .map(edge => `E:${edge.from}:${edge.to}:${edge.kind}:${edge.effectiveTime}:${edge.evidenceCount}`)
      .sort(),
  ].join('|');

  return `lineage:${fnv1a(canonical)}`;
}

export function scoreChapter8SocialContinuity(signals: {
  operator: number;
  usage: number;
  legal: number;
  delivery: number;
  community: number;
  history: number;
}): { score: number; nonClaim: string } {
  const weights = {
    operator: 0.2,
    usage: 0.15,
    legal: 0.25,
    delivery: 0.15,
    community: 0.1,
    history: 0.15,
  };

  const score =
    signals.operator * weights.operator +
    signals.usage * weights.usage +
    signals.legal * weights.legal +
    signals.delivery * weights.delivery +
    signals.community * weights.community +
    signals.history * weights.history;

  return {
    score: round(score),
    nonClaim: 'social continuity is evidence, not identity proof',
  };
}

export function isChapter8ApplicationIdentifierPid(node: Chapter8HistoryNode): boolean {
  return node.pidKind !== 'application_id';
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
