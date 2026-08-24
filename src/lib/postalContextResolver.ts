import {
  POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
  isPostalContextAssertionEffectiveAt,
  isPrivatePostalContextKind,
  postalContextCapabilitiesForNodes,
  postalContextResolutionLevelForNodes,
  postalContextResolutionLevelRank,
  validatePostalContextGraph,
  type PostalContextAssertion,
  type PostalContextAssertionMethod,
  type PostalContextCapabilities,
  type PostalContextGraph,
  type PostalContextNode,
  type PostalContextPurpose,
  type PostalContextResolutionLevel,
  type PostalContextResolutionStatus,
} from './postalContextGraph';
import { postalContextAssertionAllowedForUse } from './postalContextAssertionPolicy';

export const POSTAL_CONTEXT_RESOLVER_VERSION = 'postal-context-resolver/v0.1' as const;

export type PostalContextAmbiguity =
  | 'boundary_ambiguity'
  | 'multiple_address_records'
  | 'multiple_buildings'
  | 'multiple_postal_assignments'
  | 'multiple_entrances'
  | 'source_conflict'
  | 'campus_or_complex'
  | 'postal_assignment_conflict'
  | 'spatial_postal_only'
  | 'vertical_unresolved'
  | 'private_context_redacted'
  | 'temporal_gap'
  | 'no_spatial_geometry';

export type PostalContextEvidenceTier = 'E0' | 'E1' | 'E2' | 'E3' | 'E4' | 'E5';

export type PostalContextResolutionComponent = {
  nodeId: string;
  kind: PostalContextNode['kind'];
  featureKind: PostalContextNode['featureKind'];
  label?: string;
  postalCode?: string;
  assertionId?: string;
  relation?: PostalContextAssertion['relation'];
  method?: PostalContextAssertionMethod;
  evidenceTier?: PostalContextEvidenceTier;
};

export type PostalContextResolutionCandidate = {
  pathId: string;
  rootAddressRecordId?: string;
  nodeIds: string[];
  assertionIds: string[];
  ambiguousNodeIds: string[];
  components: PostalContextResolutionComponent[];
  resolvedLevel: PostalContextResolutionLevel;
  capabilities: PostalContextCapabilities;
  evidenceTiers: PostalContextEvidenceTier[];
  weakestEvidenceTier?: PostalContextEvidenceTier;
  ambiguities: PostalContextAmbiguity[];
};

export type PostalContextResolutionRequest = {
  graph: PostalContextGraph;
  startNodeId: string;
  purpose: PostalContextPurpose;
  validAt: string;
  knownAt?: string;
  visibility?: 'public' | 'authorized';
};

export type PostalContextResolutionResult = {
  schemaVersion: typeof POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION;
  resolverVersion: typeof POSTAL_CONTEXT_RESOLVER_VERSION;
  status: PostalContextResolutionStatus;
  purpose: PostalContextPurpose;
  validAt: string;
  knownAt: string;
  release: {
    repositoryId: string;
    releaseId: string;
    manifestDigest: string;
    policyVersion: string;
  };
  selectedCandidateId?: string;
  resolvedLevel: PostalContextResolutionLevel;
  capabilities: PostalContextCapabilities;
  candidates: PostalContextResolutionCandidate[];
  ambiguities: PostalContextAmbiguity[];
  errors: string[];
};

const METHOD_TIER: Record<PostalContextAssertionMethod, PostalContextEvidenceTier> = {
  explicit_assignment: 'E0',
  direct_source_link: 'E1',
  official_crosswalk: 'E1',
  source_relation: 'E1',
  geometry_contains: 'E2',
  geometry_intersects: 'E2',
  derived: 'E3',
  nearest: 'E4',
  virtual_grid: 'E5',
};

const EVIDENCE_TIER_RANK: Record<PostalContextEvidenceTier, number> = {
  E0: 0,
  E1: 1,
  E2: 2,
  E3: 3,
  E4: 4,
  E5: 5,
};

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function isPurposeEligible(assertion: PostalContextAssertion, purpose: PostalContextPurpose) {
  return !assertion.purposes?.length || assertion.purposes.includes(purpose);
}

function isVisible(node: PostalContextNode, visibility: 'public' | 'authorized') {
  if (node.kind === 'recipient') return false;
  if (visibility === 'authorized') return true;
  return !isPrivatePostalContextKind(node.kind)
    && node.visibility !== 'private'
    && node.visibility !== 'restricted';
}

function evidenceTier(assertion: PostalContextAssertion) {
  return METHOD_TIER[assertion.method];
}

function isValidInstant(value: string) {
  return Number.isFinite(Date.parse(value));
}

function assertionForNode(
  assertions: readonly PostalContextAssertion[],
  nodeId: string,
) {
  return assertions.find(assertion => assertion.toNodeId === nodeId);
}

function componentForNode(
  node: PostalContextNode,
  assertions: readonly PostalContextAssertion[],
): PostalContextResolutionComponent {
  const assertion = assertionForNode(assertions, node.id);
  return {
    nodeId: node.id,
    kind: node.kind,
    featureKind: node.featureKind,
    label: node.label,
    postalCode: node.postalCode,
    assertionId: assertion?.id,
    relation: assertion?.relation,
    method: assertion?.method,
    evidenceTier: assertion ? evidenceTier(assertion) : undefined,
  };
}

function componentSort(a: PostalContextResolutionComponent, b: PostalContextResolutionComponent) {
  const aLevel = postalContextResolutionLevelForNodes([{ kind: a.kind, featureKind: a.featureKind }]);
  const bLevel = postalContextResolutionLevelForNodes([{ kind: b.kind, featureKind: b.featureKind }]);
  return postalContextResolutionLevelRank(aLevel) - postalContextResolutionLevelRank(bLevel)
    || a.nodeId.localeCompare(b.nodeId);
}

function emptyCapabilities() {
  return postalContextCapabilitiesForNodes([]);
}

function emptyResult(
  request: PostalContextResolutionRequest,
  status: PostalContextResolutionStatus,
  errors: string[],
  ambiguities: PostalContextAmbiguity[] = [],
): PostalContextResolutionResult {
  const knownAt = request.knownAt ?? request.validAt;
  return {
    schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
    resolverVersion: POSTAL_CONTEXT_RESOLVER_VERSION,
    status,
    purpose: request.purpose,
    validAt: request.validAt,
    knownAt,
    release: {
      repositoryId: request.graph.release.repositoryId,
      releaseId: request.graph.release.releaseId,
      manifestDigest: request.graph.release.manifestDigest,
      policyVersion: request.graph.release.policyVersion,
    },
    resolvedLevel: 'none',
    capabilities: emptyCapabilities(),
    candidates: [],
    ambiguities,
    errors,
  };
}

function buildCandidate(args: {
  graph: PostalContextGraph;
  start: PostalContextNode;
  root?: PostalContextNode;
  assertions: PostalContextAssertion[];
  spatialPostalAssertions: PostalContextAssertion[];
  purpose: PostalContextPurpose;
  visibility: 'public' | 'authorized';
}): PostalContextResolutionCandidate {
  const { graph, start, root, assertions, spatialPostalAssertions, purpose, visibility } = args;
  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const includedAssertions: PostalContextAssertion[] = [];
  const includedNodeIds = new Set<string>([start.id]);
  const ambiguousNodeIds = new Set<string>();
  const ambiguities = new Set<PostalContextAmbiguity>();

  if (root) {
    includedNodeIds.add(root.id);
    const link = assertions.find(assertion => postalContextAssertionAllowedForUse({
      assertion,
      fromNode: start,
      toNode: root,
      use: 'address_record_root',
    }));
    if (link) includedAssertions.push(link);
  }

  const anchor = root ?? start;
  const directPostal = assertions.filter(assertion => {
    const target = nodeById.get(assertion.toNodeId);
    return Boolean(target && postalContextAssertionAllowedForUse({
      assertion,
      fromNode: anchor,
      toNode: target,
      use: 'postal_assignment',
    }));
  });
  const postalKey = (assertion: PostalContextAssertion) =>
    nodeById.get(assertion.toNodeId)?.postalCode ?? assertion.toNodeId;
  const directPostalKeys = new Set(directPostal.map(postalKey));

  if (directPostalKeys.size > 1) {
    ambiguities.add('multiple_postal_assignments');
  }

  const spatialPostalKeys = new Set(spatialPostalAssertions.map(postalKey));
  if (!directPostal.length && spatialPostalKeys.size > 1) {
    ambiguities.add('boundary_ambiguity');
  }
  if (directPostal.length && [...spatialPostalKeys].some(key => !directPostalKeys.has(key))) {
    ambiguities.add('postal_assignment_conflict');
  }

  const postalAssertions = directPostal.length ? directPostal : spatialPostalAssertions;
  if (!directPostal.length && spatialPostalAssertions.length) ambiguities.add('spatial_postal_only');
  for (const assertion of postalAssertions) {
    includedAssertions.push(assertion);
    includedNodeIds.add(assertion.toNodeId);
  }

  const buildingAssertionByNodeId = new Map<string, PostalContextAssertion>();
  for (const assertion of assertions) {
    const target = nodeById.get(assertion.toNodeId);
    if (target
      && postalContextAssertionAllowedForUse({
        assertion,
        fromNode: anchor,
        toNode: target,
        use: 'building_identity',
      })
      && !buildingAssertionByNodeId.has(assertion.toNodeId)) {
      buildingAssertionByNodeId.set(assertion.toNodeId, assertion);
    }
  }
  const buildingAssertions = [...buildingAssertionByNodeId.values()];
  if (buildingAssertions.length === 1) {
    includedAssertions.push(buildingAssertions[0]);
    includedNodeIds.add(buildingAssertions[0].toNodeId);
  } else if (buildingAssertions.length > 1) {
    ambiguities.add('multiple_buildings');
    buildingAssertions.forEach(assertion => ambiguousNodeIds.add(assertion.toNodeId));
  }

  const queue = [...includedNodeIds];
  while (queue.length) {
    const fromNodeId = queue.shift()!;
    for (const assertion of assertions) {
      if (assertion.fromNodeId !== fromNodeId) continue;
      const from = nodeById.get(fromNodeId);
      const target = nodeById.get(assertion.toNodeId);
      if (!from || !target || includedNodeIds.has(target.id)
        || !postalContextAssertionAllowedForUse({
          assertion,
          fromNode: from,
          toNode: target,
          use: 'resolution_context',
        })) continue;
      includedAssertions.push(assertion);
      includedNodeIds.add(target.id);
      queue.push(target.id);
    }
  }

  if (purpose === 'navigation') {
    const buildingIds = new Set(
      [...includedNodeIds].filter(id => nodeById.get(id)?.kind === 'building'),
    );
    for (const assertion of assertions) {
      if (assertion.relation !== 'accesses' || !buildingIds.has(assertion.toNodeId)) continue;
      const entrance = nodeById.get(assertion.fromNodeId);
      const building = nodeById.get(assertion.toNodeId);
      if (!entrance || !building || !postalContextAssertionAllowedForUse({
        assertion,
        fromNode: entrance,
        toNode: building,
        use: 'navigation_entrance',
      })) continue;
      includedAssertions.push(assertion);
      includedNodeIds.add(entrance.id);
    }
  }

  const allIncludedNodes = [...includedNodeIds]
    .map(id => nodeById.get(id))
    .filter((node): node is PostalContextNode => Boolean(node));
  const visibleNodes = allIncludedNodes.filter(node => isVisible(node, visibility));
  if (visibleNodes.length !== allIncludedNodes.length) ambiguities.add('private_context_redacted');

  const resolutionNodes = visibleNodes.filter(node =>
    node.id !== start.id && node.kind !== 'address_point' && node.kind !== 'query_point');
  const components = resolutionNodes
    .map(node => componentForNode(node, includedAssertions))
    .sort(componentSort);
  const tiers = unique(includedAssertions.map(evidenceTier))
    .sort((a, b) => EVIDENCE_TIER_RANK[a] - EVIDENCE_TIER_RANK[b]);
  const weakestEvidenceTier = tiers.at(-1);

  return {
    pathId: `pcg:${graph.release.releaseId}:${root?.id ?? start.id}`,
    rootAddressRecordId: root?.id,
    nodeIds: visibleNodes.map(node => node.id),
    assertionIds: unique(includedAssertions.map(assertion => assertion.id)),
    ambiguousNodeIds: [...ambiguousNodeIds],
    components,
    resolvedLevel: postalContextResolutionLevelForNodes(resolutionNodes),
    capabilities: postalContextCapabilitiesForNodes(visibleNodes),
    evidenceTiers: tiers,
    weakestEvidenceTier,
    ambiguities: [...ambiguities],
  };
}

function resultStatus(candidates: PostalContextResolutionCandidate[]) {
  if (!candidates.length || candidates.every(candidate => candidate.resolvedLevel === 'none')) {
    return 'no_match' as const;
  }
  if (candidates.some(candidate => candidate.ambiguities.includes('postal_assignment_conflict'))) {
    return 'conflict' as const;
  }
  if (candidates.length > 1 || candidates.some(candidate =>
    candidate.ambiguities.includes('multiple_buildings')
    || candidate.ambiguities.includes('multiple_postal_assignments')
    || candidate.ambiguities.includes('boundary_ambiguity'))) {
    return 'ambiguous' as const;
  }
  if (candidates.some(candidate =>
    candidate.ambiguities.includes('spatial_postal_only')
    || candidate.ambiguities.includes('private_context_redacted'))) {
    return 'partial' as const;
  }
  return 'unique' as const;
}

export function resolvePostalContext(
  request: PostalContextResolutionRequest,
): PostalContextResolutionResult {
  const graphValidation = validatePostalContextGraph(request.graph);
  if (!graphValidation.valid) {
    return emptyResult(request, 'invalid', graphValidation.errors);
  }

  const knownAt = request.knownAt ?? request.validAt;
  const invalidTimeErrors = [
    ...(!isValidInstant(request.validAt) ? ['invalid-valid-at'] : []),
    ...(!isValidInstant(knownAt) ? ['invalid-known-at'] : []),
  ];
  if (invalidTimeErrors.length) return emptyResult(request, 'invalid', invalidTimeErrors);

  const start = request.graph.nodes.find(node => node.id === request.startNodeId);
  if (!start) return emptyResult(request, 'invalid', ['start-node-not-found']);
  const visibility = request.visibility ?? 'public';
  if (visibility === 'public' && !isVisible(start, visibility)) {
    return emptyResult(request, 'no_match', [], ['private_context_redacted']);
  }

  const nodeIds = new Set(request.graph.nodes.map(node => node.id));
  const eligibleAssertions = request.graph.assertions.filter(assertion =>
    nodeIds.has(assertion.fromNodeId)
    && nodeIds.has(assertion.toNodeId)
    && isPurposeEligible(assertion, request.purpose));
  const assertions = eligibleAssertions.filter(assertion =>
    isPostalContextAssertionEffectiveAt(assertion, request.validAt, knownAt));
  const spatialPostalAssertions = assertions.filter(assertion => {
    const target = request.graph.nodes.find(node => node.id === assertion.toNodeId);
    return Boolean(target && postalContextAssertionAllowedForUse({
      assertion,
      fromNode: start,
      toNode: target,
      use: 'spatial_postal',
    }));
  });
  const addressRecordLinks = assertions.filter(assertion => {
    const target = request.graph.nodes.find(node => node.id === assertion.toNodeId);
    return Boolean(target && postalContextAssertionAllowedForUse({
      assertion,
      fromNode: start,
      toNode: target,
      use: 'address_record_root',
    }));
  });
  const visibleAddressRecordLinks = addressRecordLinks.filter(assertion => {
    const target = request.graph.nodes.find(node => node.id === assertion.toNodeId);
    return target ? isVisible(target, visibility) : false;
  });
  const roots = start.kind === 'address_record'
    ? [start]
    : unique(visibleAddressRecordLinks.map(assertion => assertion.toNodeId))
      .map(id => request.graph.nodes.find(node => node.id === id))
      .filter((node): node is PostalContextNode => Boolean(node));

  const candidates = roots.length
    ? roots.map(root => buildCandidate({
        graph: request.graph,
        start,
        root,
        assertions,
        spatialPostalAssertions,
        purpose: request.purpose,
        visibility,
      }))
    : [buildCandidate({
        graph: request.graph,
        start,
        assertions,
        spatialPostalAssertions,
        purpose: request.purpose,
        visibility,
      })];

  if (roots.length > 1) {
    candidates.forEach(candidate => {
      candidate.ambiguities = unique([...candidate.ambiguities, 'multiple_address_records']);
    });
  }

  if (visibleAddressRecordLinks.length !== addressRecordLinks.length) {
    candidates.forEach(candidate => {
      candidate.ambiguities = unique([...candidate.ambiguities, 'private_context_redacted']);
    });
  }

  const hasAnyTemporalRelation = eligibleAssertions.some(assertion =>
    assertion.fromNodeId === start.id || assertion.toNodeId === start.id);
  if (hasAnyTemporalRelation && !assertions.some(assertion =>
    assertion.fromNodeId === start.id || assertion.toNodeId === start.id)) {
    candidates.forEach(candidate => {
      candidate.ambiguities = unique([...candidate.ambiguities, 'temporal_gap']);
    });
  }

  const status = resultStatus(candidates);
  const selected = status === 'unique' || status === 'partial' ? candidates[0] : undefined;
  const ambiguities = unique(candidates.flatMap(candidate => candidate.ambiguities));

  return {
    schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
    resolverVersion: POSTAL_CONTEXT_RESOLVER_VERSION,
    status,
    purpose: request.purpose,
    validAt: request.validAt,
    knownAt,
    release: {
      repositoryId: request.graph.release.repositoryId,
      releaseId: request.graph.release.releaseId,
      manifestDigest: request.graph.release.manifestDigest,
      policyVersion: request.graph.release.policyVersion,
    },
    selectedCandidateId: selected?.pathId,
    resolvedLevel: selected?.resolvedLevel ?? 'none',
    capabilities: selected?.capabilities ?? emptyCapabilities(),
    candidates,
    ambiguities,
    errors: [],
  };
}
