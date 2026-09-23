import { distanceMeters, type PoiDeliverabilityDecision, type PoiTargetCell } from './poiDeliverabilityGraph';

export type SafeGeofenceKind =
  | 'danger-area'
  | 'private-property'
  | 'military-facility'
  | 'school-buffer'
  | 'disaster-zone'
  | 'public-health-zone'
  | 'temporary-restricted-zone'
  | 'sensitive-facility';

export type SafeGeofenceStatus = 'deliverable' | 'manual-review' | 'non-public' | 'zk-proof-only';

export type SafeGeofenceDisclosureMode = 'public-ok' | 'coarse-only' | 'non-public' | 'proof-only';

export type SafeGeofenceScope = {
  countryCode?: string;
  regionCode?: string;
  agidCellIds?: string[];
  agidCellPrefixes?: string[];
  centerLat?: number;
  centerLon?: number;
  radiusMeters?: number;
};

export type SafeGeofenceTimeWindow = {
  startsAt: string;
  endsAt: string;
};

export type SafeGeofenceZone = {
  zoneId: string;
  kind: SafeGeofenceKind;
  title: string;
  requiredStatus: SafeGeofenceStatus;
  disclosureMode: SafeGeofenceDisclosureMode;
  scope: SafeGeofenceScope;
  sourceClass: 'public-safety' | 'municipality' | 'carrier' | 'school' | 'facility-owner' | 'system' | 'community';
  sourceConfidence: number;
  publicSafe: boolean;
  timeWindow?: SafeGeofenceTimeWindow;
  containsRawAddress?: boolean;
  containsPrecisePrivateBoundary?: boolean;
  containsRecipientData?: boolean;
  requiresZkPredicate?: string;
};

export type SafeGeofenceProofState = {
  predicate: string;
  verified: boolean;
  notRevoked: boolean;
  freshnessSeconds: number;
  maxFreshnessSeconds: number;
  scopeMatches: boolean;
};

export type SafeGeofenceValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type SafeGeofenceDecision = {
  status: SafeGeofenceStatus;
  disclosureMode: SafeGeofenceDisclosureMode;
  deliveryAllowed: boolean;
  matchedZoneIds: string[];
  requiredControls: string[];
  evidence: string[];
  warnings: string[];
  privacy: {
    rawAddressUsed: false;
    preciseBoundaryPublished: false;
    recipientDataUsed: false;
    proofWitnessUsed: false;
  };
};

const statusRank: Record<SafeGeofenceStatus, number> = {
  deliverable: 0,
  'manual-review': 1,
  'non-public': 2,
  'zk-proof-only': 3,
};

const disclosureRank: Record<SafeGeofenceDisclosureMode, number> = {
  'public-ok': 0,
  'coarse-only': 1,
  'non-public': 2,
  'proof-only': 3,
};

function parseTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function normalizedCountry(value: unknown) {
  return String(value ?? '').trim().toUpperCase();
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function mostRestrictiveStatus(statuses: SafeGeofenceStatus[]) {
  return statuses.reduce<SafeGeofenceStatus>(
    (current, next) => (statusRank[next] > statusRank[current] ? next : current),
    'deliverable',
  );
}

function mostRestrictiveDisclosure(modes: SafeGeofenceDisclosureMode[]) {
  return modes.reduce<SafeGeofenceDisclosureMode>(
    (current, next) => (disclosureRank[next] > disclosureRank[current] ? next : current),
    'public-ok',
  );
}

function isFiniteRadiusScope(scope: SafeGeofenceScope) {
  return Number.isFinite(scope.centerLat) &&
    Number.isFinite(scope.centerLon) &&
    Number.isFinite(scope.radiusMeters) &&
    (scope.radiusMeters ?? 0) > 0;
}

export function validateSafeGeofenceZone(zone: SafeGeofenceZone): SafeGeofenceValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!zone.zoneId) errors.push('zone-id-required');
  if (!zone.title) errors.push('zone-title-required');
  if (!zone.publicSafe) errors.push('zone-must-be-public-safe');
  if (zone.containsRawAddress) errors.push('raw-address-not-allowed');
  if (zone.containsRecipientData) errors.push('recipient-data-not-allowed');
  if (zone.containsPrecisePrivateBoundary) errors.push('precise-private-boundary-not-allowed');
  if (zone.sourceConfidence < 0 || zone.sourceConfidence > 1) errors.push('source-confidence-out-of-range');
  if (zone.requiredStatus === 'zk-proof-only' && !zone.requiresZkPredicate) {
    errors.push('zk-predicate-required');
  }

  if (
    !zone.scope.countryCode &&
    !zone.scope.regionCode &&
    !zone.scope.agidCellIds?.length &&
    !zone.scope.agidCellPrefixes?.length &&
    !isFiniteRadiusScope(zone.scope)
  ) {
    errors.push('scope-required');
  }

  if (zone.timeWindow) {
    const startsAt = parseTime(zone.timeWindow.startsAt);
    const endsAt = parseTime(zone.timeWindow.endsAt);
    if (startsAt === null) errors.push('starts-at-invalid');
    if (endsAt === null) errors.push('ends-at-invalid');
    if (startsAt !== null && endsAt !== null && startsAt >= endsAt) errors.push('time-window-invalid');
  }

  if (zone.requiredStatus === 'deliverable' && zone.disclosureMode !== 'public-ok') {
    warnings.push('deliverable-zone-uses-restrictive-disclosure');
  }
  if (zone.requiredStatus === 'non-public' && zone.disclosureMode === 'public-ok') {
    warnings.push('non-public-zone-should-not-use-public-disclosure');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function isSafeGeofenceZoneActive(zone: SafeGeofenceZone, now = new Date()) {
  if (!zone.timeWindow) return true;
  const startsAt = parseTime(zone.timeWindow.startsAt);
  const endsAt = parseTime(zone.timeWindow.endsAt);
  if (startsAt === null || endsAt === null) return false;
  return startsAt <= now.getTime() && now.getTime() < endsAt;
}

export function safeGeofenceMatchesTarget(
  zone: SafeGeofenceZone,
  target: PoiTargetCell,
  countryCode?: string,
) {
  if (zone.scope.countryCode && normalizedCountry(zone.scope.countryCode) !== normalizedCountry(countryCode)) return false;
  if (zone.scope.agidCellIds?.length && !zone.scope.agidCellIds.includes(target.agidCellId)) return false;
  if (zone.scope.agidCellPrefixes?.length && !zone.scope.agidCellPrefixes.some(prefix => target.agidCellId.startsWith(prefix))) return false;
  if (isFiniteRadiusScope(zone.scope)) {
    const distance = distanceMeters(
      { lat: target.centroidLat, lon: target.centroidLon },
      { lat: zone.scope.centerLat!, lon: zone.scope.centerLon! },
    );
    if (distance > zone.scope.radiusMeters!) return false;
  }
  return true;
}

function proofSatisfiesZone(zone: SafeGeofenceZone, proofs: SafeGeofenceProofState[]) {
  if (zone.requiredStatus !== 'zk-proof-only') return true;
  return proofs.some(proof => (
    proof.predicate === zone.requiresZkPredicate &&
    proof.verified &&
    proof.notRevoked &&
    proof.scopeMatches &&
    proof.freshnessSeconds <= proof.maxFreshnessSeconds
  ));
}

function controlsFor(status: SafeGeofenceStatus, disclosureMode: SafeGeofenceDisclosureMode, matchedZones: SafeGeofenceZone[], proofOk: boolean) {
  const controls: string[] = [];
  const kinds = new Set(matchedZones.map(zone => zone.kind));

  if (status === 'manual-review') controls.push('queue-geofence-review');
  if (status === 'non-public' || disclosureMode === 'non-public') controls.push('suppress-public-address-and-route');
  if (status === 'zk-proof-only' || disclosureMode === 'proof-only') controls.push('require-zk-geofence-proof');
  if (status === 'zk-proof-only' && !proofOk) controls.push('block-until-geofence-proof-valid');
  if (kinds.has('school-buffer')) controls.push('school-zone-handoff-policy');
  if (kinds.has('military-facility') || kinds.has('sensitive-facility')) controls.push('sensitive-facility-minimum-disclosure');
  if (kinds.has('disaster-zone') || kinds.has('danger-area')) controls.push('public-safety-restriction-check');
  if (kinds.has('private-property')) controls.push('carrier-only-access-or-owner-consent');

  return unique(controls);
}

export function evaluateSafeGeofence(input: {
  target: PoiTargetCell;
  zones: SafeGeofenceZone[];
  countryCode?: string;
  proofs?: SafeGeofenceProofState[];
  now?: Date;
}): SafeGeofenceDecision {
  const now = input.now ?? new Date();
  const proofs = input.proofs ?? [];
  const warnings: string[] = [];

  const matchedZones = input.zones.filter(zone => {
    const validation = validateSafeGeofenceZone(zone);
    if (!validation.valid) {
      warnings.push(...validation.errors.map(error => `${zone.zoneId}:${error}`));
      return false;
    }
    warnings.push(...validation.warnings.map(warning => `${zone.zoneId}:${warning}`));
    return isSafeGeofenceZoneActive(zone, now) &&
      safeGeofenceMatchesTarget(zone, input.target, input.countryCode);
  });

  const status = mostRestrictiveStatus(matchedZones.map(zone => zone.requiredStatus));
  const disclosureMode = mostRestrictiveDisclosure(matchedZones.map(zone => zone.disclosureMode));
  const proofOk = matchedZones.every(zone => proofSatisfiesZone(zone, proofs));
  const deliveryAllowed = status !== 'zk-proof-only' ? status !== 'manual-review' : proofOk;

  return {
    status,
    disclosureMode,
    deliveryAllowed,
    matchedZoneIds: matchedZones.map(zone => zone.zoneId),
    requiredControls: controlsFor(status, disclosureMode, matchedZones, proofOk),
    evidence: [
      `matched-zones:${matchedZones.length}`,
      `status:${status}`,
      `disclosure:${disclosureMode}`,
      ...(matchedZones.length ? matchedZones.map(zone => `zone:${zone.zoneId}:${zone.kind}`) : ['zone:none']),
    ],
    warnings: unique(warnings),
    privacy: {
      rawAddressUsed: false,
      preciseBoundaryPublished: false,
      recipientDataUsed: false,
      proofWitnessUsed: false,
    },
  };
}

export function applySafeGeofenceToPoiDecision(
  delivery: PoiDeliverabilityDecision,
  geofence: SafeGeofenceDecision,
): PoiDeliverabilityDecision & {
  safeGeofenceStatus: SafeGeofenceStatus;
  disclosureMode: SafeGeofenceDisclosureMode;
  safeGeofenceZoneIds: string[];
} {
  let status = delivery.status;
  if (!geofence.deliveryAllowed && geofence.status === 'zk-proof-only') status = 'manual-review';
  if (geofence.status === 'manual-review') status = 'manual-review';

  return {
    ...delivery,
    status,
    evidence: [...delivery.evidence, ...geofence.evidence],
    warnings: [...delivery.warnings, ...geofence.warnings, ...geofence.requiredControls],
    safeGeofenceStatus: geofence.status,
    disclosureMode: geofence.disclosureMode,
    safeGeofenceZoneIds: geofence.matchedZoneIds,
  };
}
