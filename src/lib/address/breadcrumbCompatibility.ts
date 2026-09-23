export type AddressBreadcrumbNodeKind =
  | 'country'
  | 'admin1'
  | 'admin2'
  | 'municipality'
  | 'district'
  | 'locality'
  | 'street'
  | 'block'
  | 'building'
  | 'unit'
  | 'poi'
  | 'natural_feature'
  | 'postal_zone'
  | 'delivery_zone';

export type AddressBreadcrumbNode = {
  id: string;
  kind: AddressBreadcrumbNodeKind;
  name: string;
  parentId?: string;
  alternateParentIds?: string[];
  countryCode?: string;
  agidId?: string;
  validFrom?: string;
  validTo?: string;
};

export type PostalAnchor = {
  code: string;
  reliability: 'strong' | 'weak' | 'none';
  coversLeaf?: boolean;
};

export type BreadcrumbReconstructionInput = {
  nodes: AddressBreadcrumbNode[];
  leafNodeId: string;
  countryCode: string;
  agidId?: string;
  requiredKinds?: AddressBreadcrumbNodeKind[];
  postalAnchor?: PostalAnchor;
  claimPolicy?: 'default' | 'japan-primary' | 'local-admin-primary' | 'neutral';
};

export type BreadcrumbReconstructionDecision =
  | 'optimal'
  | 'compatible'
  | 'manual_required'
  | 'not_compatible';

export type BreadcrumbCompatibilityInvariant = {
  key: string;
  ok: boolean;
  detail: string;
};

export type BreadcrumbCompatibilityAssessment = {
  decision: BreadcrumbReconstructionDecision;
  score: number;
  agidCompatible: boolean;
  path: AddressBreadcrumbNode[];
  missingRequiredKinds: AddressBreadcrumbNodeKind[];
  reasons: string[];
  requiredFallbacks: string[];
  invariants: BreadcrumbCompatibilityInvariant[];
};

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeCode(value: unknown) {
  return clean(value).toUpperCase();
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function buildPath(
  nodeById: Map<string, AddressBreadcrumbNode>,
  leafNodeId: string,
): { path: AddressBreadcrumbNode[]; cycle: boolean; missingParent: boolean } {
  const path: AddressBreadcrumbNode[] = [];
  const seen = new Set<string>();
  let current = nodeById.get(leafNodeId);
  let cycle = false;
  let missingParent = false;

  while (current) {
    if (seen.has(current.id)) {
      cycle = true;
      break;
    }
    seen.add(current.id);
    path.push(current);
    if (!current.parentId) break;
    const parent = nodeById.get(current.parentId);
    if (!parent) {
      missingParent = true;
      break;
    }
    current = parent;
  }

  return { path: path.reverse(), cycle, missingParent };
}

function hasMultipleParentClaims(path: AddressBreadcrumbNode[]) {
  return path.some(node => (node.alternateParentIds ?? []).length > 0);
}

function hasCountryMismatch(path: AddressBreadcrumbNode[], countryCode: string) {
  const expected = normalizeCode(countryCode);
  return path.some(node => {
    const nodeCountry = normalizeCode(node.countryCode);
    return nodeCountry && nodeCountry !== expected;
  });
}

function hasNaturalOrDeliveryLeaf(path: AddressBreadcrumbNode[]) {
  const leaf = path[path.length - 1];
  return leaf?.kind === 'natural_feature' || leaf?.kind === 'poi' || leaf?.kind === 'delivery_zone';
}

function agidIsAttachedToPath(path: AddressBreadcrumbNode[], agidId?: string) {
  const expected = clean(agidId);
  if (!expected) return false;
  return path.some(node => clean(node.agidId) === expected);
}

function requiredMissing(path: AddressBreadcrumbNode[], requiredKinds: AddressBreadcrumbNodeKind[] = []) {
  const present = new Set(path.map(node => node.kind));
  return requiredKinds.filter(kind => !present.has(kind));
}

function invariant(key: string, ok: boolean, detail: string): BreadcrumbCompatibilityInvariant {
  return { key, ok, detail };
}

export function assessBreadcrumbReconstruction(input: BreadcrumbReconstructionInput): BreadcrumbCompatibilityAssessment {
  const nodeById = new Map(input.nodes.map(node => [node.id, node]));
  const { path, cycle, missingParent } = buildPath(nodeById, input.leafNodeId);
  const leafExists = nodeById.has(input.leafNodeId);
  const reachesCountry = path[0]?.kind === 'country';
  const countryMismatch = hasCountryMismatch(path, input.countryCode);
  const multipleParentClaims = hasMultipleParentClaims(path);
  const agidAttached = agidIsAttachedToPath(path, input.agidId);
  const missingRequiredKinds = requiredMissing(path, input.requiredKinds);
  const strongPostalAnchor = input.postalAnchor?.reliability === 'strong' && input.postalAnchor.coversLeaf === true;
  const naturalOrDeliveryLeaf = hasNaturalOrDeliveryLeaf(path);

  const invariants = [
    invariant('leaf-exists', leafExists, 'The requested leaf node must exist in the address graph.'),
    invariant('acyclic-parent-chain', !cycle, 'Breadcrumb reconstruction must not follow a cycle.'),
    invariant('parent-chain-complete', !missingParent, 'Every parent pointer in the breadcrumb chain must resolve.'),
    invariant('country-root', reachesCountry, 'The breadcrumb should reach a country or territory root.'),
    invariant('country-compatible', !countryMismatch, 'Every country-scoped node should match the requested AGID country scope.'),
    invariant('agid-attached', agidAttached, 'The AGID must attach to at least one node in the reconstructed chain.'),
    invariant('single-parent-chain', !multipleParentClaims, 'Optimal breadcrumbs require one parent chain without unresolved claim alternatives.'),
  ];

  const reasons: string[] = [];
  const requiredFallbacks: string[] = [];

  if (!leafExists) reasons.push('leaf-not-found');
  if (cycle) reasons.push('cycle-detected');
  if (missingParent) reasons.push('missing-parent');
  if (!reachesCountry) reasons.push('missing-country-root');
  if (countryMismatch) reasons.push('country-mismatch');
  if (!agidAttached) reasons.push('agid-not-attached');
  if (multipleParentClaims) {
    reasons.push('multiple-parent-claims');
    requiredFallbacks.push('claim-policy-rendering');
  }
  if (strongPostalAnchor) {
    reasons.push('strong-postal-anchor');
    requiredFallbacks.push('postal-anchor');
  }
  if (naturalOrDeliveryLeaf) {
    reasons.push('non-standard-address-leaf');
  }
  if (missingRequiredKinds.length > 0) {
    reasons.push('missing-required-kinds');
    if (agidAttached) requiredFallbacks.push('agid-primary');
  }

  const hardFailure = !leafExists || cycle || missingParent || !reachesCountry || countryMismatch || !agidAttached;
  const manualRequired = multipleParentClaims || (!agidAttached && missingRequiredKinds.length > 0);
  const completeForPurpose = missingRequiredKinds.length === 0;
  const onlyBreadcrumbNeeded = !strongPostalAnchor && !naturalOrDeliveryLeaf;

  let decision: BreadcrumbReconstructionDecision;
  if (hardFailure) {
    decision = manualRequired ? 'manual_required' : 'not_compatible';
  } else if (manualRequired) {
    decision = 'manual_required';
  } else if (completeForPurpose && onlyBreadcrumbNeeded) {
    decision = 'optimal';
  } else {
    decision = 'compatible';
  }

  const failedInvariantCount = invariants.filter(item => !item.ok).length;
  const completenessPenalty = missingRequiredKinds.length * 0.08;
  const postalPenalty = strongPostalAnchor ? 0.08 : 0;
  const naturalPenalty = naturalOrDeliveryLeaf ? 0.1 : 0;
  const score = clamp(1 - failedInvariantCount * 0.16 - completenessPenalty - postalPenalty - naturalPenalty);

  const agidCompatible = !hardFailure && !multipleParentClaims;

  return {
    decision,
    score: Number(score.toFixed(2)),
    agidCompatible,
    path,
    missingRequiredKinds: unique(missingRequiredKinds),
    reasons: unique(reasons),
    requiredFallbacks: unique(requiredFallbacks),
    invariants,
  };
}

export function isBreadcrumbReconstructionOptimal(
  value: BreadcrumbCompatibilityAssessment | BreadcrumbReconstructionInput,
) {
  const assessment = 'decision' in value ? value : assessBreadcrumbReconstruction(value);
  return assessment.decision === 'optimal';
}
