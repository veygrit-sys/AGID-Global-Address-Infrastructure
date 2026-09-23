import { sha256Hex } from './sha256';
import {
  buildSpecialDeliveryProfile,
  type SpecialDeliveryDestinationKind,
  type SpecialDeliveryHandoffPoint,
  type SpecialDeliveryParcelKind,
} from './specialDeliveryProfile';

export const DELIVERY_OPERATIONS_INTELLIGENCE_VERSION = 'agid-delivery-operations-intelligence-v1';

export const DELIVERY_DRIVER_SKILLS = [
  'standard-parcel',
  'cold-chain',
  'hazmat',
  'high-value',
  'cross-border',
  'drone-operator',
  'humanitarian-field',
  'nfc-pos-handoff',
  'cash-on-delivery',
  'heavy-item',
  'hotel-front-desk',
  'airport-counter',
  'golf-bag-handling',
  'ski-equipment-handling',
  'snow-route',
] as const;

export const DELIVERY_VEHICLE_MODES = [
  'walk',
  'bicycle',
  'motorbike',
  'car',
  'van',
  'truck',
  'drone',
] as const;

export type DeliveryDriverSkill = typeof DELIVERY_DRIVER_SKILLS[number];
export type DeliveryVehicleMode = typeof DELIVERY_VEHICLE_MODES[number];
export type DeliveryDriverStatus = 'active' | 'on-leave' | 'suspended' | 'expired-license' | 'inactive';
export type DeliveryDriverAvailability = 'available' | 'leave' | 'labor-limit' | 'license-blocked' | 'suspended' | 'inactive' | 'review';
export type DeliveryTrafficCondition = 'free-flow' | 'moderate' | 'heavy' | 'blocked' | 'unknown';
export type DeliveryRouteObjective = 'fastest' | 'balanced' | 'deadline-first' | 'risk-minimized';
export type DeliveryPerformanceStatus = 'completed' | 'failed' | 'attempted' | 'cancelled';

export type DeliveryCoordinate = {
  lat: number;
  lng: number;
};

export type DeliveryLicenseVerification = {
  licenseId?: string;
  licenseClass?: string;
  expiresAt?: string;
  verifiedAt?: string;
  issuer?: string;
  verified: boolean;
  documentStored: false;
  documentCommitment?: string;
};

export type DeliveryLeaveWindow = {
  start: string;
  end: string;
  reason?: string;
};

export type DeliveryDriverInput = {
  driverId?: unknown;
  displayName?: unknown;
  status?: unknown;
  skills?: unknown;
  license?: Partial<DeliveryLicenseVerification>;
  maxDutyMinutes?: unknown;
  workedMinutesToday?: unknown;
  leaveWindows?: unknown;
  assignedVehicleModes?: unknown;
  currentLocation?: Partial<DeliveryCoordinate>;
  rating?: unknown;
  highRiskEligible?: unknown;
};

export type DeliveryDriverProfile = {
  driverId: string;
  displayName: string;
  status: DeliveryDriverStatus;
  skills: DeliveryDriverSkill[];
  license: DeliveryLicenseVerification;
  maxDutyMinutes: number;
  workedMinutesToday: number;
  remainingDutyMinutes: number;
  leaveWindows: DeliveryLeaveWindow[];
  assignedVehicleModes: DeliveryVehicleMode[];
  currentLocation?: DeliveryCoordinate;
  rating: number;
  highRiskEligible: boolean;
  availability: DeliveryDriverAvailability;
  warnings: string[];
};

export type DeliveryStopInput = {
  stopId?: unknown;
  agid?: unknown;
  addressCommitment?: unknown;
  placeLabel?: unknown;
  requiredSkills?: unknown;
  requiredVehicleModes?: unknown;
  serviceMinutes?: unknown;
  timeWindowStart?: unknown;
  timeWindowEnd?: unknown;
  priority?: unknown;
  coords?: Partial<DeliveryCoordinate>;
  highRisk?: unknown;
  destinationKind?: unknown;
  parcelKind?: unknown;
  handoffPoint?: unknown;
};

export type DeliveryStop = {
  stopId: string;
  agidTail?: string;
  addressCommitment?: string;
  placeLabel: string;
  requiredSkills: DeliveryDriverSkill[];
  requiredVehicleModes: DeliveryVehicleMode[];
  serviceMinutes: number;
  timeWindowStart?: string;
  timeWindowEnd?: string;
  priority: number;
  coords?: DeliveryCoordinate;
  highRisk: boolean;
  destinationKind: SpecialDeliveryDestinationKind;
  parcelKind: SpecialDeliveryParcelKind;
  handoffPoint?: SpecialDeliveryHandoffPoint;
  handoffOptions: SpecialDeliveryHandoffPoint[];
  recipientProofRequired: boolean;
  counterAcceptanceRequired: boolean;
  specialHandlingCodes: string[];
};

export type DeliveryTrafficSnapshot = {
  areaId?: string;
  fromStopId?: string;
  toStopId?: string;
  condition: DeliveryTrafficCondition;
  delayMinutes: number;
  updatedAt?: string;
};

export type DeliveryRouteOptimizationInput = {
  drivers?: DeliveryDriverInput[];
  stops?: DeliveryStopInput[];
  traffic?: DeliveryTrafficSnapshot[];
  now?: unknown;
  objective?: unknown;
  highRiskMode?: unknown;
};

export type DeliveryRouteStopAssignment = {
  stopId: string;
  placeLabel: string;
  addressCommitment?: string;
  agidTail?: string;
  eta: string;
  travelMinutes: number;
  serviceMinutes: number;
  distanceKm: number;
  trafficCondition: DeliveryTrafficCondition;
  warnings: string[];
  destinationKind: SpecialDeliveryDestinationKind;
  parcelKind: SpecialDeliveryParcelKind;
  handoffPoint?: SpecialDeliveryHandoffPoint;
  handoffOptions: SpecialDeliveryHandoffPoint[];
  recipientProofRequired: boolean;
  counterAcceptanceRequired: boolean;
  specialHandlingCodes: string[];
};

export type DeliveryOptimizedRoute = {
  driverId: string;
  displayName: string;
  vehicleModes: DeliveryVehicleMode[];
  stops: DeliveryRouteStopAssignment[];
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  routeScore: number;
  realtimeAdjustments: string[];
  warnings: string[];
};

export type DeliveryRouteOptimizationResult = {
  modelVersion: typeof DELIVERY_OPERATIONS_INTELLIGENCE_VERSION;
  optimizationKind: 'deterministic-score-baseline';
  objective: DeliveryRouteObjective;
  generatedAt: string;
  routes: DeliveryOptimizedRoute[];
  unassignedStops: Array<{
    stopId: string;
    placeLabel: string;
    reasons: string[];
  }>;
  warnings: string[];
  privacy: DeliveryOperationsPrivacyBoundary;
};

export type DeliveryWorkforceSummary = {
  modelVersion: typeof DELIVERY_OPERATIONS_INTELLIGENCE_VERSION;
  generatedAt: string;
  drivers: DeliveryDriverProfile[];
  totals: {
    drivers: number;
    available: number;
    review: number;
    blocked: number;
    activeLeave: number;
  };
  skillCoverage: Record<DeliveryDriverSkill, number>;
  warnings: string[];
  privacy: DeliveryOperationsPrivacyBoundary;
};

export type DeliveryPerformanceEventInput = {
  driverId?: unknown;
  shipmentId?: unknown;
  plannedAt?: unknown;
  completedAt?: unknown;
  onTimeDeadline?: unknown;
  status?: unknown;
  customerRating?: unknown;
  exceptionCode?: unknown;
};

export type DeliveryPerformanceSummary = {
  modelVersion: typeof DELIVERY_OPERATIONS_INTELLIGENCE_VERSION;
  generatedAt: string;
  totals: {
    events: number;
    completed: number;
    failed: number;
    attempted: number;
    cancelled: number;
    late: number;
  };
  rates: {
    completionRate: number;
    onTimeRate: number;
    averageCustomerRating: number;
    kpiScore: number;
  };
  driverKpis: Array<{
    driverId: string;
    completed: number;
    total: number;
    completionRate: number;
    onTimeRate: number;
    averageCustomerRating: number;
    kpiScore: number;
  }>;
  recommendedActions: string[];
  warnings: string[];
  privacy: DeliveryOperationsPrivacyBoundary;
};

export type DeliveryOperationsPrivacyBoundary = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawDriverLicenseDocumentStored: false;
  rawPreciseDriverTrajectoryPublic: false;
  storesOperationalMetadataOnly: true;
};

const DEFAULT_NOW = '2026-06-17T00:00:00.000Z';
const DEFAULT_MAX_DUTY_MINUTES = 480;
const DEFAULT_SERVICE_MINUTES = 6;
const DEFAULT_ROUTE_SPEED_KPH = 28;
const EARTH_RADIUS_KM = 6371;

const PRIVACY_BOUNDARY: DeliveryOperationsPrivacyBoundary = {
  rawAddressStored: false,
  rawAgidStored: false,
  rawAoidStored: false,
  rawDriverLicenseDocumentStored: false,
  rawPreciseDriverTrajectoryPublic: false,
  storesOperationalMetadataOnly: true,
};

function clean(value: unknown, maxLength = 160) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function validIsoOrDefault(value: unknown, fallback = DEFAULT_NOW) {
  const text = clean(value);
  return text && !Number.isNaN(Date.parse(text)) ? new Date(text).toISOString() : fallback;
}

function optionalIso(value: unknown) {
  const text = clean(value);
  return text && !Number.isNaN(Date.parse(text)) ? new Date(text).toISOString() : undefined;
}

function parseIsoMs(value: unknown) {
  const text = clean(value);
  if (!text) return undefined;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function numberInRange(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'number' ? value : Number(clean(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function booleanValue(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  const text = clean(value).toLowerCase();
  if (['true', 'yes', '1', 'on'].includes(text)) return true;
  if (['false', 'no', '0', 'off'].includes(text)) return false;
  return fallback;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(item => clean(item)).filter(Boolean);
}

function normalizeDriverSkill(value: unknown): DeliveryDriverSkill | undefined {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if ((DELIVERY_DRIVER_SKILLS as readonly string[]).includes(text)) return text as DeliveryDriverSkill;
  if (text === 'standard' || text === 'parcel') return 'standard-parcel';
  if (text === 'refrigerated' || text === 'cold') return 'cold-chain';
  if (text === 'dangerous-goods') return 'hazmat';
  if (text === 'valuable') return 'high-value';
  if (text === 'international') return 'cross-border';
  if (text === 'drone') return 'drone-operator';
  if (text === 'aid' || text === 'field') return 'humanitarian-field';
  if (text === 'nfc' || text === 'pos') return 'nfc-pos-handoff';
  if (text === 'cod') return 'cash-on-delivery';
  if (text === 'heavy') return 'heavy-item';
  if (text === 'hotel' || text === 'front-desk' || text === 'bell-desk') return 'hotel-front-desk';
  if (text === 'airport' || text === 'airport-cargo' || text === 'airport-terminal') return 'airport-counter';
  if (text === 'golf' || text === 'golf-bag' || text === 'golf-club') return 'golf-bag-handling';
  if (text === 'ski' || text === 'ski-bag' || text === 'snowboard') return 'ski-equipment-handling';
  if (text === 'snow' || text === 'snow-road' || text === 'winter-route') return 'snow-route';
  return undefined;
}

function normalizeVehicleMode(value: unknown): DeliveryVehicleMode | undefined {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if ((DELIVERY_VEHICLE_MODES as readonly string[]).includes(text)) return text as DeliveryVehicleMode;
  if (text === 'bike') return 'bicycle';
  if (text === 'motorcycle' || text === 'scooter') return 'motorbike';
  return undefined;
}

function normalizeDriverStatus(value: unknown): DeliveryDriverStatus {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (text === 'on-leave' || text === 'suspended' || text === 'expired-license' || text === 'inactive') return text;
  return 'active';
}

function normalizeTrafficCondition(value: unknown): DeliveryTrafficCondition {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (text === 'free-flow' || text === 'moderate' || text === 'heavy' || text === 'blocked') return text;
  return 'unknown';
}

function normalizeObjective(value: unknown): DeliveryRouteObjective {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (text === 'fastest' || text === 'deadline-first' || text === 'risk-minimized') return text;
  return 'balanced';
}

function coordinate(input?: Partial<DeliveryCoordinate>) {
  const lat = numberInRange(input?.lat, Number.NaN, -90, 90);
  const lng = numberInRange(input?.lng, Number.NaN, -180, 180);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
}

function idFrom(prefix: string, value: unknown, fallbackSeed: string) {
  const text = clean(value, 96);
  if (text) return text;
  return `${prefix}-${sha256Hex(`${prefix}:${fallbackSeed}`).slice(0, 10).toUpperCase()}`;
}

function agidTail(value: unknown) {
  const text = clean(value, 80).replace(/\s+/g, '');
  if (!text) return undefined;
  return text.slice(-10).toUpperCase();
}

function addressCommitment(value: unknown, fallbackSeed: string) {
  const text = clean(value, 128);
  if (text) return text;
  return `addr:${sha256Hex(`delivery-address:${fallbackSeed}`).slice(0, 24)}`;
}

function normalizeLicense(input: Partial<DeliveryLicenseVerification> | undefined): DeliveryLicenseVerification {
  return {
    licenseId: clean(input?.licenseId, 64) || undefined,
    licenseClass: clean(input?.licenseClass, 32) || undefined,
    expiresAt: optionalIso(input?.expiresAt),
    verifiedAt: optionalIso(input?.verifiedAt),
    issuer: clean(input?.issuer, 80) || undefined,
    verified: Boolean(input?.verified),
    documentStored: false,
    documentCommitment: clean(input?.documentCommitment, 128) || undefined,
  };
}

function normalizeLeaveWindows(input: unknown): DeliveryLeaveWindow[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Partial<DeliveryLeaveWindow>;
    const start = optionalIso(candidate.start);
    const end = optionalIso(candidate.end);
    if (!start || !end || Date.parse(start) >= Date.parse(end)) return [];
    return [{
      start,
      end,
      reason: clean(candidate.reason, 80) || undefined,
    }];
  });
}

function normalizeDriver(input: DeliveryDriverInput, index: number, nowMs: number): DeliveryDriverProfile {
  const driverId = idFrom('DRV', input.driverId, `${index}:${clean(input.displayName)}`);
  const license = normalizeLicense(input.license);
  const maxDutyMinutes = numberInRange(input.maxDutyMinutes, DEFAULT_MAX_DUTY_MINUTES, 60, 960);
  const workedMinutesToday = numberInRange(input.workedMinutesToday, 0, 0, 1440);
  const remainingDutyMinutes = Math.max(0, maxDutyMinutes - workedMinutesToday);
  const leaveWindows = normalizeLeaveWindows(input.leaveWindows);
  const skills = unique(readStringArray(input.skills).map(normalizeDriverSkill).filter(Boolean) as DeliveryDriverSkill[]);
  const assignedVehicleModes = unique(readStringArray(input.assignedVehicleModes).map(normalizeVehicleMode).filter(Boolean) as DeliveryVehicleMode[]);
  const status = normalizeDriverStatus(input.status);
  const warnings: string[] = [];
  const licenseExpiry = parseIsoMs(license.expiresAt);
  const licenseBlocked = !license.verified || (licenseExpiry !== undefined && licenseExpiry <= nowMs) || status === 'expired-license';
  const licenseExpiringSoon = licenseExpiry !== undefined && licenseExpiry > nowMs && licenseExpiry - nowMs <= 30 * 24 * 60 * 60 * 1000;
  const onLeave = status === 'on-leave' || leaveWindows.some(window => Date.parse(window.start) <= nowMs && nowMs < Date.parse(window.end));
  const laborBlocked = remainingDutyMinutes <= 0;

  if (!license.verified) warnings.push('license-verification-missing');
  if (licenseExpiry !== undefined && licenseExpiry <= nowMs) warnings.push('license-expired');
  if (licenseExpiringSoon) warnings.push('license-expires-within-30-days');
  if (onLeave) warnings.push('driver-on-leave');
  if (laborBlocked) warnings.push('labor-duty-limit-reached');
  if (!skills.length) warnings.push('driver-skills-missing');
  if (!assignedVehicleModes.length) warnings.push('vehicle-mode-missing');

  let availability: DeliveryDriverAvailability = 'available';
  if (status === 'inactive') availability = 'inactive';
  else if (status === 'suspended') availability = 'suspended';
  else if (licenseBlocked) availability = 'license-blocked';
  else if (onLeave) availability = 'leave';
  else if (laborBlocked) availability = 'labor-limit';
  else if (!skills.length || !assignedVehicleModes.length) availability = 'review';

  return {
    driverId,
    displayName: clean(input.displayName, 80) || `Driver ${index + 1}`,
    status,
    skills,
    license,
    maxDutyMinutes,
    workedMinutesToday,
    remainingDutyMinutes,
    leaveWindows,
    assignedVehicleModes,
    currentLocation: coordinate(input.currentLocation),
    rating: numberInRange(input.rating, 4.5, 1, 5),
    highRiskEligible: booleanValue(input.highRiskEligible, skills.includes('high-value') || skills.includes('humanitarian-field')),
    availability,
    warnings,
  };
}

function normalizeStop(input: DeliveryStopInput, index: number): DeliveryStop {
  const seed = `${index}:${clean(input.placeLabel)}:${clean(input.agid)}:${clean(input.addressCommitment)}`;
  const placeLabel = clean(input.placeLabel, 96) || `Stop ${index + 1}`;
  const specialDelivery = buildSpecialDeliveryProfile({
    destinationKind: input.destinationKind,
    parcelKind: input.parcelKind,
    handoffPoint: input.handoffPoint,
    placeLabel,
  });
  const requestedSkills = unique(readStringArray(input.requiredSkills).map(normalizeDriverSkill).filter(Boolean) as DeliveryDriverSkill[]);
  const specialSkills = specialDelivery.requiredSkills.map(normalizeDriverSkill).filter(Boolean) as DeliveryDriverSkill[];
  return {
    stopId: idFrom('STOP', input.stopId, seed),
    agidTail: agidTail(input.agid),
    addressCommitment: addressCommitment(input.addressCommitment, seed),
    placeLabel,
    requiredSkills: unique([...requestedSkills, ...specialSkills]),
    requiredVehicleModes: unique(readStringArray(input.requiredVehicleModes).map(normalizeVehicleMode).filter(Boolean) as DeliveryVehicleMode[]),
    serviceMinutes: numberInRange(input.serviceMinutes, Math.max(DEFAULT_SERVICE_MINUTES, specialDelivery.minimumServiceMinutes), 1, 180),
    timeWindowStart: optionalIso(input.timeWindowStart),
    timeWindowEnd: optionalIso(input.timeWindowEnd),
    priority: numberInRange(input.priority, 3, 1, 5),
    coords: coordinate(input.coords),
    highRisk: booleanValue(input.highRisk, specialDelivery.recipientProofRequired),
    destinationKind: specialDelivery.destinationKind,
    parcelKind: specialDelivery.parcelKind,
    handoffPoint: specialDelivery.handoffPoint,
    handoffOptions: specialDelivery.handoffOptions,
    recipientProofRequired: specialDelivery.recipientProofRequired,
    counterAcceptanceRequired: specialDelivery.counterAcceptanceRequired,
    specialHandlingCodes: specialDelivery.specialHandlingCodes,
  };
}

function radians(value: number) {
  return value * Math.PI / 180;
}

function distanceKm(a?: DeliveryCoordinate, b?: DeliveryCoordinate) {
  if (!a || !b) return 5;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function trafficDelayFor(condition: DeliveryTrafficCondition) {
  if (condition === 'free-flow') return 0;
  if (condition === 'moderate') return 5;
  if (condition === 'heavy') return 15;
  if (condition === 'blocked') return 60;
  return 8;
}

function routeTraffic(input: DeliveryRouteOptimizationInput, stop: DeliveryStop): DeliveryTrafficSnapshot {
  const exact = input.traffic?.find(item => item.toStopId === stop.stopId || item.fromStopId === stop.stopId);
  const fallback = input.traffic?.[0];
  const selected = exact ?? fallback;
  if (!selected) return { condition: 'unknown', delayMinutes: trafficDelayFor('unknown') };
  const condition = normalizeTrafficCondition(selected.condition);
  return {
    areaId: selected.areaId,
    fromStopId: selected.fromStopId,
    toStopId: selected.toStopId,
    condition,
    delayMinutes: numberInRange(selected.delayMinutes, trafficDelayFor(condition), 0, 240),
    updatedAt: optionalIso(selected.updatedAt),
  };
}

function travelMinutes(distance: number, traffic: DeliveryTrafficSnapshot, vehicleModes: DeliveryVehicleMode[]) {
  const speedFactor = vehicleModes.includes('drone') ? 1.8
    : vehicleModes.includes('motorbike') ? 1.25
      : vehicleModes.includes('truck') ? 0.75
        : vehicleModes.includes('bicycle') ? 0.55
          : vehicleModes.includes('walk') ? 0.18
            : 1;
  const base = (distance / (DEFAULT_ROUTE_SPEED_KPH * speedFactor)) * 60;
  return Math.max(1, Math.ceil(base + traffic.delayMinutes));
}

function missingSkills(driver: DeliveryDriverProfile, stop: DeliveryStop) {
  return stop.requiredSkills.filter(skill => !driver.skills.includes(skill));
}

function missingVehicleModes(driver: DeliveryDriverProfile, stop: DeliveryStop) {
  if (!stop.requiredVehicleModes.length) return [];
  return stop.requiredVehicleModes.filter(mode => !driver.assignedVehicleModes.includes(mode));
}

function scoreCandidate(options: {
  driver: DeliveryDriverProfile;
  stop: DeliveryStop;
  distanceKm: number;
  traffic: DeliveryTrafficSnapshot;
  projectedMinutes: number;
  currentTimeMs: number;
  objective: DeliveryRouteObjective;
  highRiskMode: boolean;
}) {
  const missingSkillCount = missingSkills(options.driver, options.stop).length;
  const missingVehicleCount = missingVehicleModes(options.driver, options.stop).length;
  const deadline = parseIsoMs(options.stop.timeWindowEnd);
  const lateMinutes = deadline === undefined
    ? 0
    : Math.max(0, Math.ceil((options.currentTimeMs + options.projectedMinutes * 60_000 - deadline) / 60_000));
  let score = 100;
  score -= options.distanceKm * (options.objective === 'fastest' ? 2.4 : 1.4);
  score -= options.traffic.delayMinutes * (options.objective === 'risk-minimized' ? 1.6 : 0.9);
  score -= missingSkillCount * 55;
  score -= missingVehicleCount * 35;
  score -= lateMinutes * (options.objective === 'deadline-first' ? 2.4 : 1.2);
  score += options.stop.priority * 4;
  score += options.driver.rating * 3;
  if (options.highRiskMode || options.stop.highRisk) {
    score += options.driver.highRiskEligible ? 8 : -45;
  }
  if (options.traffic.condition === 'blocked') score -= 80;
  if (options.driver.remainingDutyMinutes < options.projectedMinutes) score -= 70;
  if (options.driver.availability !== 'available') score -= 120;
  return Math.round(score * 100) / 100;
}

function addMinutesIso(ms: number, minutes: number) {
  return new Date(ms + minutes * 60_000).toISOString();
}

function availabilityBlocked(availability: DeliveryDriverAvailability) {
  return availability === 'license-blocked'
    || availability === 'suspended'
    || availability === 'inactive'
    || availability === 'leave'
    || availability === 'labor-limit';
}

function routeStopWarnings(driver: DeliveryDriverProfile, stop: DeliveryStop, traffic: DeliveryTrafficSnapshot, projectedMinutes: number) {
  const warnings: string[] = [];
  const skills = missingSkills(driver, stop);
  const vehicles = missingVehicleModes(driver, stop);
  if (skills.length) warnings.push(`missing-skills:${skills.join(',')}`);
  if (vehicles.length) warnings.push(`missing-vehicle-modes:${vehicles.join(',')}`);
  if (traffic.condition === 'heavy') warnings.push('heavy-traffic');
  if (traffic.condition === 'blocked') warnings.push('blocked-route');
  if (driver.remainingDutyMinutes < projectedMinutes) warnings.push('driver-duty-limit-risk');
  if (stop.highRisk && !driver.highRiskEligible) warnings.push('high-risk-driver-review');
  if (stop.recipientProofRequired) warnings.push('recipient-proof-required');
  if (stop.counterAcceptanceRequired) warnings.push('counter-acceptance-required');
  warnings.push(...stop.specialHandlingCodes.map(code => `special-delivery:${code}`));
  return warnings;
}

export function evaluateDriverWorkforce(input: { drivers?: DeliveryDriverInput[]; now?: unknown }): DeliveryWorkforceSummary {
  const generatedAt = validIsoOrDefault(input.now);
  const now = Date.parse(generatedAt);
  const drivers = (input.drivers ?? []).map((driver, index) => normalizeDriver(driver, index, now));
  const skillCoverage = Object.fromEntries(
    DELIVERY_DRIVER_SKILLS.map(skill => [skill, drivers.filter(driver => driver.skills.includes(skill)).length]),
  ) as Record<DeliveryDriverSkill, number>;
  const warnings = unique(drivers.flatMap(driver => driver.warnings.map(warning => `${driver.driverId}:${warning}`)));

  return {
    modelVersion: DELIVERY_OPERATIONS_INTELLIGENCE_VERSION,
    generatedAt,
    drivers,
    totals: {
      drivers: drivers.length,
      available: drivers.filter(driver => driver.availability === 'available').length,
      review: drivers.filter(driver => driver.availability === 'review').length,
      blocked: drivers.filter(driver => availabilityBlocked(driver.availability)).length,
      activeLeave: drivers.filter(driver => driver.availability === 'leave').length,
    },
    skillCoverage,
    warnings,
    privacy: PRIVACY_BOUNDARY,
  };
}

export function optimizeDeliveryRoutes(input: DeliveryRouteOptimizationInput): DeliveryRouteOptimizationResult {
  const generatedAt = validIsoOrDefault(input.now);
  const objective = normalizeObjective(input.objective);
  const highRiskMode = booleanValue(input.highRiskMode);
  const workforce = evaluateDriverWorkforce({ drivers: input.drivers, now: generatedAt });
  const stops = (input.stops ?? []).map(normalizeStop);
  const sortedStops = [...stops].sort((a, b) => {
    const aDeadline = parseIsoMs(a.timeWindowEnd) ?? Number.MAX_SAFE_INTEGER;
    const bDeadline = parseIsoMs(b.timeWindowEnd) ?? Number.MAX_SAFE_INTEGER;
    if (objective === 'deadline-first' && aDeadline !== bDeadline) return aDeadline - bDeadline;
    return b.priority - a.priority;
  });
  const mutable = new Map(workforce.drivers.map(driver => [driver.driverId, {
    driver,
    cursor: driver.currentLocation,
    timeMs: Date.parse(generatedAt),
    remainingDutyMinutes: driver.remainingDutyMinutes,
    stops: [] as DeliveryRouteStopAssignment[],
    scoreSum: 0,
    scoreCount: 0,
    warnings: [...driver.warnings],
    distance: 0,
    duration: 0,
  }]));
  const unassignedStops: DeliveryRouteOptimizationResult['unassignedStops'] = [];

  for (const stop of sortedStops) {
    const candidates = [...mutable.values()]
      .map((state) => {
        const traffic = routeTraffic(input, stop);
        const km = distanceKm(state.cursor, stop.coords);
        const travel = travelMinutes(km, traffic, state.driver.assignedVehicleModes);
        const projectedMinutes = travel + stop.serviceMinutes;
        return {
          state,
          traffic,
          km,
          travel,
          projectedMinutes,
          score: scoreCandidate({
            driver: state.driver,
            stop,
            distanceKm: km,
            traffic,
            projectedMinutes,
            currentTimeMs: state.timeMs,
            objective,
            highRiskMode,
          }),
        };
      })
      .sort((a, b) => b.score - a.score);

    const selected = candidates.find(candidate => candidate.score >= 0 && !availabilityBlocked(candidate.state.driver.availability));
    if (!selected) {
      const top = candidates[0];
      const reasons = [
        top ? `best-score:${top.score}` : 'no-driver',
        ...unique(candidates.flatMap(candidate => routeStopWarnings(
          candidate.state.driver,
          stop,
          candidate.traffic,
          candidate.projectedMinutes,
        ))),
      ];
      unassignedStops.push({ stopId: stop.stopId, placeLabel: stop.placeLabel, reasons: reasons.length ? reasons : ['no-eligible-driver'] });
      continue;
    }

    const deadline = parseIsoMs(stop.timeWindowEnd);
    const etaMs = selected.state.timeMs + selected.travel * 60_000;
    const warnings = routeStopWarnings(selected.state.driver, stop, selected.traffic, selected.projectedMinutes);
    if (deadline !== undefined && etaMs > deadline) warnings.push('eta-after-time-window');

    selected.state.stops.push({
      stopId: stop.stopId,
      placeLabel: stop.placeLabel,
      addressCommitment: stop.addressCommitment,
      agidTail: stop.agidTail,
      eta: new Date(etaMs).toISOString(),
      travelMinutes: selected.travel,
      serviceMinutes: stop.serviceMinutes,
      distanceKm: Math.round(selected.km * 100) / 100,
      trafficCondition: selected.traffic.condition,
      warnings,
      destinationKind: stop.destinationKind,
      parcelKind: stop.parcelKind,
      handoffPoint: stop.handoffPoint,
      handoffOptions: stop.handoffOptions,
      recipientProofRequired: stop.recipientProofRequired,
      counterAcceptanceRequired: stop.counterAcceptanceRequired,
      specialHandlingCodes: stop.specialHandlingCodes,
    });
    selected.state.cursor = stop.coords ?? selected.state.cursor;
    selected.state.timeMs = etaMs + stop.serviceMinutes * 60_000;
    selected.state.remainingDutyMinutes = Math.max(0, selected.state.remainingDutyMinutes - selected.projectedMinutes);
    selected.state.distance += selected.km;
    selected.state.duration += selected.projectedMinutes;
    selected.state.scoreSum += selected.score;
    selected.state.scoreCount += 1;
    selected.state.warnings.push(...warnings);
  }

  const routes = [...mutable.values()]
    .filter(state => state.stops.length > 0)
    .map((state) => {
      const realtimeAdjustments = unique(state.stops.flatMap((stop) => {
        if (stop.trafficCondition === 'blocked') return ['reroute-blocked-segment'];
        if (stop.trafficCondition === 'heavy') return ['recalculate-eta-and-notify-recipient'];
        if (stop.warnings.includes('eta-after-time-window')) return ['request-time-window-extension'];
        return [];
      }));
      return {
        driverId: state.driver.driverId,
        displayName: state.driver.displayName,
        vehicleModes: state.driver.assignedVehicleModes,
        stops: state.stops,
        estimatedDistanceKm: Math.round(state.distance * 100) / 100,
        estimatedDurationMinutes: Math.ceil(state.duration),
        routeScore: state.scoreCount ? Math.max(0, Math.min(100, Math.round(state.scoreSum / state.scoreCount))) : 0,
        realtimeAdjustments,
        warnings: unique(state.warnings),
      };
    });
  const warnings = unique([
    ...workforce.warnings,
    ...unassignedStops.map(stop => `${stop.stopId}:unassigned`),
    ...(routes.some(route => route.realtimeAdjustments.length) ? ['real-time-adjustment-required'] : []),
  ]);

  return {
    modelVersion: DELIVERY_OPERATIONS_INTELLIGENCE_VERSION,
    optimizationKind: 'deterministic-score-baseline',
    objective,
    generatedAt,
    routes,
    unassignedStops,
    warnings,
    privacy: PRIVACY_BOUNDARY,
  };
}

function normalizePerformanceStatus(value: unknown): DeliveryPerformanceStatus {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (text === 'failed' || text === 'attempted' || text === 'cancelled') return text;
  return 'completed';
}

function roundRate(value: number) {
  return Math.round(value * 1000) / 1000;
}

function kpiScore(completionRate: number, onTimeRate: number, averageRating: number) {
  const ratingScore = averageRating > 0 ? averageRating / 5 : 0;
  return Math.round((completionRate * 0.45 + onTimeRate * 0.4 + ratingScore * 0.15) * 100);
}

function performanceStats(events: DeliveryPerformanceEventInput[]) {
  const total = events.length;
  const completedEvents = events.filter(event => normalizePerformanceStatus(event.status) === 'completed');
  const rated = events
    .filter(event => clean(event.customerRating) !== '')
    .map(event => numberInRange(event.customerRating, Number.NaN, 1, 5))
    .filter(Number.isFinite);
  const late = completedEvents.filter((event) => {
    const completedAt = parseIsoMs(event.completedAt);
    const deadline = parseIsoMs(event.onTimeDeadline);
    return completedAt !== undefined && deadline !== undefined && completedAt > deadline;
  }).length;
  const onTimeDenominator = completedEvents.filter(event => parseIsoMs(event.onTimeDeadline) !== undefined).length;
  const completionRate = total ? completedEvents.length / total : 0;
  const onTimeRate = onTimeDenominator ? (onTimeDenominator - late) / onTimeDenominator : 0;
  const averageCustomerRating = rated.length ? rated.reduce((sum, value) => sum + value, 0) / rated.length : 0;
  return {
    completed: completedEvents.length,
    failed: events.filter(event => normalizePerformanceStatus(event.status) === 'failed').length,
    attempted: events.filter(event => normalizePerformanceStatus(event.status) === 'attempted').length,
    cancelled: events.filter(event => normalizePerformanceStatus(event.status) === 'cancelled').length,
    late,
    completionRate: roundRate(completionRate),
    onTimeRate: roundRate(onTimeRate),
    averageCustomerRating: Math.round(averageCustomerRating * 100) / 100,
    kpiScore: kpiScore(completionRate, onTimeRate, averageCustomerRating),
  };
}

export function summarizeDeliveryPerformance(input: {
  events?: DeliveryPerformanceEventInput[];
  generatedAt?: unknown;
}): DeliveryPerformanceSummary {
  const generatedAt = validIsoOrDefault(input.generatedAt);
  const events = input.events ?? [];
  const overall = performanceStats(events);
  const driverIds = unique(events.map(event => clean(event.driverId, 96) || 'unknown-driver'));
  const driverKpis = driverIds.map((driverId) => {
    const driverEvents = events.filter(event => (clean(event.driverId, 96) || 'unknown-driver') === driverId);
    const stats = performanceStats(driverEvents);
    return {
      driverId,
      completed: stats.completed,
      total: driverEvents.length,
      completionRate: stats.completionRate,
      onTimeRate: stats.onTimeRate,
      averageCustomerRating: stats.averageCustomerRating,
      kpiScore: stats.kpiScore,
    };
  }).sort((a, b) => b.kpiScore - a.kpiScore);
  const recommendedActions: string[] = [];
  if (overall.completionRate < 0.95) recommendedActions.push('review-failed-and-attempted-deliveries');
  if (overall.onTimeRate < 0.9) recommendedActions.push('recalibrate-route-eta-and-time-window-policy');
  if (overall.averageCustomerRating > 0 && overall.averageCustomerRating < 4.2) recommendedActions.push('inspect-customer-feedback-and-handoff-training');
  if (events.some(event => clean(event.exceptionCode))) recommendedActions.push('triage-exception-codes');
  if (!recommendedActions.length) recommendedActions.push('continue-monitoring-current-route-and-workforce-policy');

  return {
    modelVersion: DELIVERY_OPERATIONS_INTELLIGENCE_VERSION,
    generatedAt,
    totals: {
      events: events.length,
      completed: overall.completed,
      failed: overall.failed,
      attempted: overall.attempted,
      cancelled: overall.cancelled,
      late: overall.late,
    },
    rates: {
      completionRate: overall.completionRate,
      onTimeRate: overall.onTimeRate,
      averageCustomerRating: overall.averageCustomerRating,
      kpiScore: overall.kpiScore,
    },
    driverKpis,
    recommendedActions,
    warnings: events.length ? [] : ['no-performance-events'],
    privacy: PRIVACY_BOUNDARY,
  };
}

export function buildDeliveryOperationsDashboard(input: {
  drivers?: DeliveryDriverInput[];
  stops?: DeliveryStopInput[];
  traffic?: DeliveryTrafficSnapshot[];
  events?: DeliveryPerformanceEventInput[];
  now?: unknown;
  objective?: unknown;
  highRiskMode?: unknown;
}) {
  const workforce = evaluateDriverWorkforce({ drivers: input.drivers, now: input.now });
  const routes = optimizeDeliveryRoutes({
    drivers: input.drivers,
    stops: input.stops,
    traffic: input.traffic,
    now: input.now,
    objective: input.objective,
    highRiskMode: input.highRiskMode,
  });
  const performance = summarizeDeliveryPerformance({ events: input.events, generatedAt: input.now });
  const grade = routes.unassignedStops.length || workforce.totals.blocked > 0
    ? 'attention'
    : performance.rates.kpiScore >= 85 && routes.warnings.length === 0
      ? 'ready'
      : 'review';

  return {
    modelVersion: DELIVERY_OPERATIONS_INTELLIGENCE_VERSION,
    generatedAt: validIsoOrDefault(input.now),
    grade,
    summary: grade === 'ready'
      ? 'Workforce, route plan, and KPI posture are ready for normal operations.'
      : 'Review workforce blocks, route warnings, or KPI drift before scaling operations.',
    workforce,
    routes,
    performance,
    privacy: PRIVACY_BOUNDARY,
  };
}
