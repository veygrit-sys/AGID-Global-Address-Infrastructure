import type {
  PostalContextAssertion,
  PostalContextAssertionMethod,
  PostalContextNode,
} from './postalContextGraph';

export type PostalContextAssertionUse =
  | 'lookup_context'
  | 'resolution_context'
  | 'address_record_root'
  | 'postal_assignment'
  | 'spatial_postal'
  | 'building_identity'
  | 'navigation_entrance';

export type PostalContextAssertionPolicyInput = {
  assertion: PostalContextAssertion;
  fromNode: PostalContextNode;
  toNode: PostalContextNode;
  use: PostalContextAssertionUse;
};

const DEFINITIVE_QUALITIES = new Set<PostalContextAssertion['quality']['status']>([
  'authoritative',
  'verified',
]);

const SPATIAL_POSTAL_QUALITIES = new Set<PostalContextAssertion['quality']['status']>([
  ...DEFINITIVE_QUALITIES,
  'derived',
]);

const DIRECT_METHODS = new Set<PostalContextAssertionMethod>([
  'explicit_assignment',
  'direct_source_link',
  'official_crosswalk',
  'source_relation',
]);

const LOOKUP_CONTEXT_FROM_KINDS = new Set<PostalContextNode['kind']>([
  'postal_feature',
  'administrative_area',
  'locality',
]);

function hasDefinitiveAssignmentAuthority(assertion: PostalContextAssertion) {
  return assertion.source.assignmentAuthority !== 'none'
    && assertion.source.assignmentAuthority !== 'derived_spatial_assignment'
    && assertion.source.assignmentAuthority !== 'virtual_assignment';
}

function hasNonVirtualGeometryAuthority(assertion: PostalContextAssertion) {
  return assertion.source.geometryAuthority !== 'none'
    && assertion.source.geometryAuthority !== 'virtual_geometry';
}

function hasEligibleQuality(
  assertion: PostalContextAssertion,
  use: PostalContextAssertionUse,
) {
  return (use === 'spatial_postal' ? SPATIAL_POSTAL_QUALITIES : DEFINITIVE_QUALITIES)
    .has(assertion.quality.status);
}

function methodSupportsContext(assertion: PostalContextAssertion) {
  if (DIRECT_METHODS.has(assertion.method)) {
    return hasDefinitiveAssignmentAuthority(assertion);
  }
  if (assertion.method === 'geometry_contains') {
    return (assertion.relation === 'admin_within'
      || assertion.relation === 'stands_on'
      || assertion.relation === 'covered_by_agid')
      && hasNonVirtualGeometryAuthority(assertion);
  }
  if (assertion.method === 'derived') {
    return assertion.relation === 'covered_by_agid'
      && hasNonVirtualGeometryAuthority(assertion);
  }
  return false;
}

function lookupContextKindsAreCompatible(
  assertion: PostalContextAssertion,
  fromNode: PostalContextNode,
  toNode: PostalContextNode,
) {
  if (!LOOKUP_CONTEXT_FROM_KINDS.has(fromNode.kind)) return false;
  if (assertion.relation === 'covered_by_agid') return toNode.kind === 'agid_cell';
  if (assertion.relation === 'admin_within') {
    return toNode.kind === 'administrative_area' || toNode.kind === 'locality';
  }
  if (assertion.relation === 'part_of') {
    return toNode.kind === 'administrative_area' || toNode.kind === 'locality';
  }
  return false;
}

function resolutionPartOfKindsAreCompatible(
  fromNode: PostalContextNode,
  toNode: PostalContextNode,
) {
  if (fromNode.kind === 'postal_feature' || fromNode.kind === 'query_point') {
    return toNode.kind === 'administrative_area' || toNode.kind === 'locality';
  }
  if (fromNode.kind === 'administrative_area'
    || fromNode.kind === 'locality'
    || fromNode.kind === 'thoroughfare') {
    return toNode.kind === 'administrative_area' || toNode.kind === 'locality';
  }
  if (fromNode.kind === 'address_record' || fromNode.kind === 'address_point') {
    return toNode.kind === 'administrative_area'
      || toNode.kind === 'locality'
      || toNode.kind === 'thoroughfare'
      || toNode.kind === 'parcel';
  }
  if (fromNode.kind === 'building_part' || fromNode.kind === 'entrance') {
    return toNode.kind === 'building' || toNode.kind === 'building_part';
  }
  if (fromNode.kind === 'building') {
    return toNode.kind === 'building' || toNode.kind === 'parcel';
  }
  if (fromNode.kind === 'parcel') {
    return toNode.kind === 'administrative_area' || toNode.kind === 'locality';
  }
  if (fromNode.kind === 'organization') {
    return toNode.kind === 'building' || toNode.kind === 'building_part';
  }
  return false;
}

function resolutionContextKindsAreCompatible(
  assertion: PostalContextAssertion,
  fromNode: PostalContextNode,
  toNode: PostalContextNode,
) {
  if (assertion.relation === 'covered_by_agid') return toNode.kind === 'agid_cell';
  if (assertion.relation === 'admin_within') {
    return toNode.kind === 'administrative_area' || toNode.kind === 'locality';
  }
  if (assertion.relation === 'part_of') {
    return resolutionPartOfKindsAreCompatible(fromNode, toNode);
  }
  if (assertion.relation === 'stands_on') {
    return (fromNode.kind === 'address_record'
      || fromNode.kind === 'building'
      || fromNode.kind === 'building_part')
      && toNode.kind === 'parcel';
  }
  if (assertion.relation === 'delivery_served_by') {
    return (fromNode.kind === 'address_record'
      || fromNode.kind === 'building'
      || fromNode.kind === 'organization')
      && toNode.kind === 'delivery_endpoint';
  }
  return false;
}

export function hasDefinitivePostalContextAssertionQuality(
  assertion: PostalContextAssertion,
) {
  return DEFINITIVE_QUALITIES.has(assertion.quality.status);
}

export function postalContextAssertionAllowedForUse({
  assertion,
  fromNode,
  toNode,
  use,
}: PostalContextAssertionPolicyInput) {
  if (assertion.fromNodeId !== fromNode.id || assertion.toNodeId !== toNode.id) return false;
  if (!hasEligibleQuality(assertion, use)) return false;
  if (assertion.source.sourceType === 'virtual'
    || assertion.source.assignmentAuthority === 'virtual_assignment'
    || assertion.source.geometryAuthority === 'virtual_geometry'
    || assertion.method === 'nearest'
    || assertion.method === 'virtual_grid') return false;

  if (use === 'lookup_context') {
    return methodSupportsContext(assertion)
      && lookupContextKindsAreCompatible(assertion, fromNode, toNode);
  }
  if (use === 'resolution_context') {
    return methodSupportsContext(assertion)
      && resolutionContextKindsAreCompatible(assertion, fromNode, toNode);
  }
  if (use === 'address_record_root') {
    return assertion.relation === 'locates'
      && fromNode.kind === 'address_point'
      && toNode.kind === 'address_record'
      && DIRECT_METHODS.has(assertion.method)
      && hasDefinitiveAssignmentAuthority(assertion);
  }
  if (use === 'postal_assignment') {
    return assertion.relation === 'postal_assigned'
      && fromNode.kind === 'address_record'
      && toNode.kind === 'postal_feature'
      && DIRECT_METHODS.has(assertion.method)
      && hasDefinitiveAssignmentAuthority(assertion);
  }
  if (use === 'spatial_postal') {
    return assertion.relation === 'postal_contains'
      && (fromNode.kind === 'query_point' || fromNode.kind === 'address_point')
      && toNode.kind === 'postal_feature'
      && assertion.method === 'geometry_contains'
      && hasNonVirtualGeometryAuthority(assertion);
  }
  if (use === 'building_identity') {
    return assertion.relation === 'addresses'
      && fromNode.kind === 'address_record'
      && toNode.kind === 'building'
      && DIRECT_METHODS.has(assertion.method)
      && hasDefinitiveAssignmentAuthority(assertion);
  }
  return use === 'navigation_entrance'
    && assertion.relation === 'accesses'
    && fromNode.kind === 'entrance'
    && (toNode.kind === 'building' || toNode.kind === 'building_part')
    && DIRECT_METHODS.has(assertion.method)
    && hasDefinitiveAssignmentAuthority(assertion);
}
