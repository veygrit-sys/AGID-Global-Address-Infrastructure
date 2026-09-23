import type { DroneLandingAssessment } from './droneAssessment';
import type { DroneCorridorReport } from './droneCorridor';
import {
  buildDroneMissionPlan,
  droneDistanceMeters,
  type DroneMissionPlan,
  type DroneMissionPoint,
  type DroneMissionStatus,
} from './droneMissionPlan';
import type { DroneSafetyLevel } from './droneNavigation';
import {
  cleanBoolean,
  cleanNonNegativeInteger,
  cleanNumber,
  cleanText,
  cleanTextArray,
  stableCommitment,
  stableId,
  stableJson,
  toIsoTimestamp,
} from './redactedWorkflowCore';

export const DRONE_OS_VERSION = 'drone-os-v1';

export const DRONE_OS_AIRCRAFT_STATUSES = [
  'ready',
  'attention',
  'blocked',
] as const;

export const DRONE_OS_MISSION_DECISIONS = [
  'release-to-field-check',
  'hold-for-review',
  'block-mission',
] as const;

export const DRONE_OS_LINK_STATUSES = [
  'online',
  'degraded',
  'offline',
] as const;

export const DRONE_OS_FLIGHT_MODES = [
  'manual',
  'assisted',
  'supervised-autonomy',
] as const;

export const DRONE_OS_FAILSAFE_ACTIONS = [
  'continue-monitoring',
  'abort-before-launch',
  'return-to-home',
  'land-now',
  'hold-position',
] as const;

export type DroneOsAircraftStatus = typeof DRONE_OS_AIRCRAFT_STATUSES[number];
export type DroneOsMissionDecision = typeof DRONE_OS_MISSION_DECISIONS[number];
export type DroneOsLinkStatus = typeof DRONE_OS_LINK_STATUSES[number];
export type DroneOsFlightMode = typeof DRONE_OS_FLIGHT_MODES[number];
export type DroneOsFailsafeAction = typeof DRONE_OS_FAILSAFE_ACTIONS[number];

export type DroneOsPrivacyBoundary = {
  publicSurface: 'operational-readiness-mission-decision-commitments-and-audit-reasons-only';
  rawPilotIdentityStored: false;
  rawRecipientIdentityStored: false;
  rawAddressStored: false;
  autopilotCommandsEmitted: false;
};

export type DroneOsCoordinate = {
  lat: number;
  lon: number;
};

export type DroneOsAircraftInput = {
  aircraftId?: unknown;
  model?: unknown;
  firmwareVersion?: unknown;
  batteryPercent?: unknown;
  batteryCycleCount?: unknown;
  maxRangeMeters?: unknown;
  maxPayloadGrams?: unknown;
  payloadGrams?: unknown;
  gnssSatellites?: unknown;
  horizontalAccuracyM?: unknown;
  telemetryLink?: unknown;
  controlLink?: unknown;
  remoteIdBroadcasting?: unknown;
  maintenanceDue?: unknown;
  sensors?: unknown;
  homePoint?: Partial<DroneOsCoordinate>;
  currentPoint?: Partial<DroneOsCoordinate>;
  available?: unknown;
};

export type DroneOsAircraft = {
  aircraftId: string;
  model: string;
  firmwareVersion?: string;
  status: DroneOsAircraftStatus;
  available: boolean;
  batteryPercent: number;
  batteryCycleCount: number;
  maxRangeMeters: number;
  maxPayloadGrams: number;
  payloadGrams: number;
  gnssSatellites: number;
  horizontalAccuracyM: number;
  telemetryLink: DroneOsLinkStatus;
  controlLink: DroneOsLinkStatus;
  remoteIdBroadcasting: boolean;
  maintenanceDue: boolean;
  sensors: string[];
  homePoint?: DroneOsCoordinate;
  currentPoint?: DroneOsCoordinate;
  warnings: string[];
  blockers: string[];
  score: number;
};

export type DroneOsWeatherInput = {
  windSpeedMs?: unknown;
  gustSpeedMs?: unknown;
  precipitationMmH?: unknown;
  visibilityMeters?: unknown;
};

export type DroneOsWeather = {
  windSpeedMs: number | null;
  gustSpeedMs: number | null;
  precipitationMmH: number | null;
  visibilityMeters: number | null;
  warnings: string[];
  blockers: string[];
};

export type DroneOsPolicyInput = {
  requireRemoteId?: unknown;
  requireVisualLineOfSight?: unknown;
  allowSupervisedAutonomy?: unknown;
  maxDistanceMeters?: unknown;
  maxAltitudeAglM?: unknown;
  maxWindSpeedMs?: unknown;
  maxGustSpeedMs?: unknown;
  minVisibilityMeters?: unknown;
  minBatteryPercent?: unknown;
  minBatteryReservePercent?: unknown;
  highRiskMode?: unknown;
};

export type DroneOsPolicy = {
  requireRemoteId: boolean;
  requireVisualLineOfSight: boolean;
  allowSupervisedAutonomy: boolean;
  maxDistanceMeters: number;
  maxAltitudeAglM: number;
  maxWindSpeedMs: number;
  maxGustSpeedMs: number;
  minVisibilityMeters: number;
  minBatteryPercent: number;
  minBatteryReservePercent: number;
  highRiskMode: boolean;
};

export type DroneOsMissionInput = {
  missionId?: unknown;
  purpose?: unknown;
  origin?: Partial<DroneMissionPoint> | null;
  target?: Partial<DroneMissionPoint>;
  aircraft?: DroneOsAircraft | DroneOsAircraftInput;
  policy?: DroneOsPolicyInput;
  weather?: DroneOsWeatherInput;
  landingAssessment?: DroneLandingAssessment | null;
  navigationPoint?: {
    altitudeAglM?: number | null;
    altitudeMslM?: number | null;
    safety?: DroneSafetyLevel;
    confidence?: number;
    warnings?: string[];
    sources?: string[];
    candidates?: Array<{ distanceMeters: number; heightM?: number }>;
  } | null;
  corridorReport?: DroneCorridorReport | null;
  plan?: DroneMissionPlan | null;
  requestedFlightMode?: unknown;
  createdAt?: unknown;
};

export type DroneOsFlightEnvelope = {
  requestedFlightMode: DroneOsFlightMode;
  maxDistanceMeters: number;
  distanceMeters: number;
  maxAltitudeAglM: number;
  recommendedAltitudeAglM: number;
  visualLineOfSightRequired: boolean;
  supervisedAutonomyAllowed: boolean;
};

export type DroneOsFailsafePlan = {
  primaryAction: DroneOsFailsafeAction;
  triggers: string[];
  checklist: string[];
};

export type DroneOsMission = {
  modelVersion: typeof DRONE_OS_VERSION;
  missionId: string;
  purpose: string;
  createdAt: string;
  aircraft: DroneOsAircraft;
  policy: DroneOsPolicy;
  weather: DroneOsWeather;
  origin: DroneMissionPoint | null;
  target: DroneMissionPoint;
  plan: DroneMissionPlan;
  corridorReport: DroneCorridorReport | null;
  decision: DroneOsMissionDecision;
  decisionReasons: string[];
  flightEnvelope: DroneOsFlightEnvelope;
  failsafe: DroneOsFailsafePlan;
  checklist: string[];
  auditCommitment: string;
  privacy: DroneOsPrivacyBoundary;
};

export type DroneOsFleetInput = {
  generatedAt?: unknown;
  aircraft?: unknown;
  mission?: DroneOsMissionInput;
};

export type DroneOsFleetSnapshot = {
  modelVersion: typeof DRONE_OS_VERSION;
  generatedAt: string;
  aircraft: DroneOsAircraft[];
  selectedAircraftId?: string;
  readiness: DroneOsAircraftStatus;
  warnings: string[];
  blockers: string[];
  privacy: DroneOsPrivacyBoundary;
};

export type DroneOsAuditReceipt = {
  modelVersion: typeof DRONE_OS_VERSION;
  receiptId: string;
  missionId: string;
  aircraftId: string;
  generatedAt: string;
  decision: DroneOsMissionDecision;
  decisionReasons: string[];
  missionCommitment: string;
  aircraftCommitment: string;
  targetCommitment: string;
  rawCoordinatesIncluded: false;
  privacy: DroneOsPrivacyBoundary;
};

const DEFAULT_POLICY: DroneOsPolicy = {
  requireRemoteId: true,
  requireVisualLineOfSight: true,
  allowSupervisedAutonomy: false,
  maxDistanceMeters: 5000,
  maxAltitudeAglM: 120,
  maxWindSpeedMs: 10,
  maxGustSpeedMs: 14,
  minVisibilityMeters: 1000,
  minBatteryPercent: 35,
  minBatteryReservePercent: 20,
  highRiskMode: false,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value: number, places = 1) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(value => value.trim()).filter(Boolean)));
}

function oneOf<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]): T[number] {
  const text = cleanText(value).toLowerCase();
  return values.includes(text) ? text as T[number] : fallback;
}

function publicRef(prefix: string, value: unknown, fallbackSeed: unknown) {
  const text = cleanText(value, '', 96);
  return text || stableId(prefix, { fallbackSeed, version: DRONE_OS_VERSION }, { length: 12 });
}

function normalizeCoordinate(input?: Partial<DroneOsCoordinate> | Partial<DroneMissionPoint> | null): DroneOsCoordinate | undefined {
  const lat = cleanNumber(input?.lat, Number.NaN);
  const lon = cleanNumber(input?.lon, Number.NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return undefined;
  return { lat: roundTo(lat, 6), lon: roundTo(lon, 6) };
}

function normalizeMissionPoint(input?: Partial<DroneMissionPoint> | null): DroneMissionPoint | null {
  const point = normalizeCoordinate(input);
  if (!point) return null;
  return {
    lat: point.lat,
    lon: point.lon,
    label: cleanText(input?.label, '', 96) || undefined,
  };
}

function normalizeNullableNumber(value: unknown) {
  const number = cleanNumber(value, Number.NaN);
  return Number.isFinite(number) ? number : null;
}

function linkStatus(value: unknown) {
  return oneOf(value, DRONE_OS_LINK_STATUSES, 'online');
}

function privacyBoundary(): DroneOsPrivacyBoundary {
  return {
    publicSurface: 'operational-readiness-mission-decision-commitments-and-audit-reasons-only',
    rawPilotIdentityStored: false,
    rawRecipientIdentityStored: false,
    rawAddressStored: false,
    autopilotCommandsEmitted: false,
  };
}

export function normalizeDroneOsPolicy(input: DroneOsPolicyInput = {}): DroneOsPolicy {
  const highRiskMode = cleanBoolean(input.highRiskMode, DEFAULT_POLICY.highRiskMode);
  return {
    requireRemoteId: cleanBoolean(input.requireRemoteId, DEFAULT_POLICY.requireRemoteId),
    requireVisualLineOfSight: cleanBoolean(input.requireVisualLineOfSight, DEFAULT_POLICY.requireVisualLineOfSight),
    allowSupervisedAutonomy: cleanBoolean(input.allowSupervisedAutonomy, DEFAULT_POLICY.allowSupervisedAutonomy) && !highRiskMode,
    maxDistanceMeters: Math.max(50, cleanNonNegativeInteger(input.maxDistanceMeters, highRiskMode ? 1500 : DEFAULT_POLICY.maxDistanceMeters)),
    maxAltitudeAglM: clamp(cleanNumber(input.maxAltitudeAglM, DEFAULT_POLICY.maxAltitudeAglM), 10, 120),
    maxWindSpeedMs: clamp(cleanNumber(input.maxWindSpeedMs, highRiskMode ? 7 : DEFAULT_POLICY.maxWindSpeedMs), 1, 20),
    maxGustSpeedMs: clamp(cleanNumber(input.maxGustSpeedMs, highRiskMode ? 10 : DEFAULT_POLICY.maxGustSpeedMs), 1, 30),
    minVisibilityMeters: Math.max(100, cleanNonNegativeInteger(input.minVisibilityMeters, DEFAULT_POLICY.minVisibilityMeters)),
    minBatteryPercent: clamp(cleanNumber(input.minBatteryPercent, highRiskMode ? 50 : DEFAULT_POLICY.minBatteryPercent), 1, 100),
    minBatteryReservePercent: clamp(cleanNumber(input.minBatteryReservePercent, highRiskMode ? 30 : DEFAULT_POLICY.minBatteryReservePercent), 1, 100),
    highRiskMode,
  };
}

export function normalizeDroneOsWeather(input: DroneOsWeatherInput = {}, policy: DroneOsPolicy = DEFAULT_POLICY): DroneOsWeather {
  const windSpeedMs = normalizeNullableNumber(input.windSpeedMs);
  const gustSpeedMs = normalizeNullableNumber(input.gustSpeedMs);
  const precipitationMmH = normalizeNullableNumber(input.precipitationMmH);
  const visibilityMeters = normalizeNullableNumber(input.visibilityMeters);
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (windSpeedMs === null) warnings.push('wind-data-missing');
  else if (windSpeedMs > policy.maxWindSpeedMs) blockers.push('wind-speed-above-policy');
  else if (windSpeedMs > policy.maxWindSpeedMs * 0.8) warnings.push('wind-near-policy-limit');

  if (gustSpeedMs !== null && gustSpeedMs > policy.maxGustSpeedMs) blockers.push('gust-speed-above-policy');
  if (precipitationMmH !== null && precipitationMmH > 2) blockers.push('precipitation-too-heavy');
  else if (precipitationMmH !== null && precipitationMmH > 0) warnings.push('precipitation-present');
  if (visibilityMeters !== null && visibilityMeters < policy.minVisibilityMeters) blockers.push('visibility-below-policy');

  return {
    windSpeedMs,
    gustSpeedMs,
    precipitationMmH,
    visibilityMeters,
    warnings: unique(warnings),
    blockers: unique(blockers),
  };
}

export function assessDroneOsAircraft(input: DroneOsAircraftInput = {}, policy: DroneOsPolicy = DEFAULT_POLICY): DroneOsAircraft {
  const aircraftId = publicRef('UAV', input.aircraftId, input);
  const batteryPercent = clamp(cleanNumber(input.batteryPercent, 0), 0, 100);
  const maxPayloadGrams = cleanNonNegativeInteger(input.maxPayloadGrams, 0);
  const payloadGrams = cleanNonNegativeInteger(input.payloadGrams, 0);
  const maxRangeMeters = cleanNonNegativeInteger(input.maxRangeMeters, 0);
  const gnssSatellites = cleanNonNegativeInteger(input.gnssSatellites, 0);
  const horizontalAccuracyM = cleanNumber(input.horizontalAccuracyM, 99);
  const telemetryLink = linkStatus(input.telemetryLink);
  const controlLink = linkStatus(input.controlLink);
  const remoteIdBroadcasting = cleanBoolean(input.remoteIdBroadcasting, false);
  const maintenanceDue = cleanBoolean(input.maintenanceDue, false);
  const warnings: string[] = [];
  const blockers: string[] = [];
  let score = 100;

  if (!cleanBoolean(input.available, true)) {
    blockers.push('aircraft-unavailable');
    score -= 40;
  }
  if (batteryPercent < policy.minBatteryReservePercent) {
    blockers.push('battery-below-reserve');
    score -= 45;
  } else if (batteryPercent < policy.minBatteryPercent) {
    warnings.push('battery-below-dispatch-minimum');
    score -= 22;
  }
  if (maxRangeMeters <= 0) {
    warnings.push('range-data-missing');
    score -= 12;
  }
  if (maxPayloadGrams > 0 && payloadGrams > maxPayloadGrams) {
    blockers.push('payload-exceeds-aircraft-limit');
    score -= 35;
  }
  if (gnssSatellites < 6) {
    blockers.push('gnss-signal-insufficient');
    score -= 35;
  } else if (gnssSatellites < 10) {
    warnings.push('gnss-satellite-count-low');
    score -= 12;
  }
  if (horizontalAccuracyM > 25) {
    blockers.push('horizontal-accuracy-too-low');
    score -= 25;
  } else if (horizontalAccuracyM > 10) {
    warnings.push('horizontal-accuracy-needs-review');
    score -= 10;
  }
  if (telemetryLink === 'offline' || controlLink === 'offline') {
    blockers.push('command-or-telemetry-link-offline');
    score -= 35;
  } else if (telemetryLink === 'degraded' || controlLink === 'degraded') {
    warnings.push('command-or-telemetry-link-degraded');
    score -= 15;
  }
  if (policy.requireRemoteId && !remoteIdBroadcasting) {
    blockers.push('remote-id-required');
    score -= 25;
  }
  if (maintenanceDue) {
    blockers.push('maintenance-due');
    score -= 30;
  }

  const status: DroneOsAircraftStatus = blockers.length ? 'blocked' : warnings.length ? 'attention' : 'ready';
  return {
    aircraftId,
    model: cleanText(input.model, 'generic-uav', 96),
    firmwareVersion: cleanText(input.firmwareVersion, '', 64) || undefined,
    status,
    available: cleanBoolean(input.available, true),
    batteryPercent: roundTo(batteryPercent, 1),
    batteryCycleCount: cleanNonNegativeInteger(input.batteryCycleCount, 0),
    maxRangeMeters,
    maxPayloadGrams,
    payloadGrams,
    gnssSatellites,
    horizontalAccuracyM: roundTo(horizontalAccuracyM, 1),
    telemetryLink,
    controlLink,
    remoteIdBroadcasting,
    maintenanceDue,
    sensors: cleanTextArray(input.sensors).map(sensor => sensor.toLowerCase()),
    homePoint: normalizeCoordinate(input.homePoint),
    currentPoint: normalizeCoordinate(input.currentPoint),
    warnings: unique(warnings),
    blockers: unique(blockers),
    score: clamp(Math.round(score), 0, 100),
  };
}

function statusRank(status: DroneMissionStatus | undefined | null) {
  if (status === 'avoid') return 2;
  if (status === 'hold') return 1;
  if (status === 'field-check') return 0;
  return 1;
}

function decisionFromSignals(input: {
  aircraft: DroneOsAircraft;
  plan: DroneMissionPlan;
  corridorReport: DroneCorridorReport | null;
  weather: DroneOsWeather;
  policy: DroneOsPolicy;
}): { decision: DroneOsMissionDecision; reasons: string[] } {
  const reasons = unique([
    ...input.aircraft.blockers,
    ...input.weather.blockers,
    ...(input.plan.status === 'avoid' ? ['mission-plan-avoid'] : []),
    ...(input.corridorReport?.status === 'avoid' ? ['corridor-avoid'] : []),
    ...(input.plan.distanceMeters > input.policy.maxDistanceMeters ? ['mission-distance-above-policy'] : []),
    ...(input.plan.recommendedAltitudeAglM > input.policy.maxAltitudeAglM ? ['recommended-altitude-above-policy'] : []),
  ]);
  if (reasons.length) return { decision: 'block-mission', reasons };

  const holdReasons = unique([
    ...input.aircraft.warnings,
    ...input.weather.warnings,
    ...(input.plan.status === 'hold' ? ['mission-plan-hold'] : []),
    ...(input.corridorReport?.status === 'hold' ? ['corridor-hold'] : []),
    ...((input.plan.risks.length > 0 && input.policy.highRiskMode) ? ['high-risk-mode-requires-review'] : []),
  ]);
  if (holdReasons.length) return { decision: 'hold-for-review', reasons: holdReasons };
  return { decision: 'release-to-field-check', reasons: ['no-blocking-signal-detected'] };
}

export function chooseDroneOsFailsafe(input: {
  decision: DroneOsMissionDecision;
  aircraft: DroneOsAircraft;
  weather?: DroneOsWeather;
}): DroneOsFailsafePlan {
  const triggers = unique([
    ...input.aircraft.blockers,
    ...input.aircraft.warnings,
    ...(input.weather?.blockers || []),
    ...(input.weather?.warnings || []),
  ]);
  let primaryAction: DroneOsFailsafeAction = 'continue-monitoring';

  if (input.decision === 'block-mission') primaryAction = 'abort-before-launch';
  else if (input.aircraft.batteryPercent < 15) primaryAction = 'land-now';
  else if (input.aircraft.batteryPercent < 30 || input.aircraft.telemetryLink === 'offline') primaryAction = 'return-to-home';
  else if (input.aircraft.controlLink === 'degraded' || input.aircraft.gnssSatellites < 10) primaryAction = 'hold-position';

  return {
    primaryAction,
    triggers,
    checklist: [
      'Do not treat Drone OS output as legal flight authorization.',
      'Confirm pilot, site, airspace, weather, people, roads, wires, and landing zone before launch.',
      'Keep human override available for every mission state.',
      'Record decision receipts without raw recipient identity or address data.',
    ],
  };
}

export function buildDroneOsMission(input: DroneOsMissionInput): DroneOsMission {
  const createdAt = toIsoTimestamp(input.createdAt);
  const policy = normalizeDroneOsPolicy(input.policy);
  const aircraft = asRecord(input.aircraft).modelVersion === DRONE_OS_VERSION
    ? input.aircraft as DroneOsAircraft
    : assessDroneOsAircraft(input.aircraft as DroneOsAircraftInput, policy);
  const weather = normalizeDroneOsWeather(input.weather, policy);
  const target = normalizeMissionPoint(input.target) ?? normalizeMissionPoint(input.origin) ?? { lat: 0, lon: 0, label: 'unknown-target' };
  const origin = normalizeMissionPoint(input.origin) ?? aircraft.currentPoint ?? aircraft.homePoint ?? null;
  const navigationPoint = input.navigationPoint
    ? {
        altitudeAglM: typeof input.navigationPoint.altitudeAglM === 'number' ? input.navigationPoint.altitudeAglM : null,
        altitudeMslM: typeof input.navigationPoint.altitudeMslM === 'number' ? input.navigationPoint.altitudeMslM : null,
        safety: input.navigationPoint.safety ?? 'unknown',
        confidence: typeof input.navigationPoint.confidence === 'number' ? input.navigationPoint.confidence : 0.35,
        warnings: input.navigationPoint.warnings || [],
        sources: input.navigationPoint.sources || [],
        candidates: (input.navigationPoint.candidates || []).map((candidate, index) => ({
          id: `drone-os-input/${index}`,
          lat: target.lat,
          lon: target.lon,
          kind: 'unknown' as const,
          source: 'drone-os-input',
          distanceMeters: cleanNumber(candidate.distanceMeters, 999),
          ...(typeof candidate.heightM === 'number' ? { heightM: candidate.heightM } : {}),
        })),
      }
    : null;
  const plan = input.plan ?? buildDroneMissionPlan({
    origin,
    target,
    landingAssessment: input.landingAssessment || null,
    navigationPoint,
  });
  const corridorReport = input.corridorReport || null;
  const { decision, reasons } = decisionFromSignals({ aircraft, plan, corridorReport, weather, policy });
  const requestedFlightMode = oneOf(input.requestedFlightMode, DRONE_OS_FLIGHT_MODES, policy.allowSupervisedAutonomy ? 'assisted' : 'manual');
  const flightEnvelope: DroneOsFlightEnvelope = {
    requestedFlightMode,
    maxDistanceMeters: policy.maxDistanceMeters,
    distanceMeters: plan.distanceMeters,
    maxAltitudeAglM: policy.maxAltitudeAglM,
    recommendedAltitudeAglM: Math.min(plan.recommendedAltitudeAglM, policy.maxAltitudeAglM),
    visualLineOfSightRequired: policy.requireVisualLineOfSight,
    supervisedAutonomyAllowed: policy.allowSupervisedAutonomy,
  };
  const missionId = publicRef('DRONEMSN', input.missionId, {
    aircraftId: aircraft.aircraftId,
    target,
    createdAt,
  });
  const failsafe = chooseDroneOsFailsafe({ decision, aircraft, weather });

  return {
    modelVersion: DRONE_OS_VERSION,
    missionId,
    purpose: cleanText(input.purpose, 'field-operation', 96),
    createdAt,
    aircraft,
    policy,
    weather,
    origin,
    target,
    plan,
    corridorReport,
    decision,
    decisionReasons: unique(reasons),
    flightEnvelope,
    failsafe,
    checklist: unique([
      ...plan.checklist,
      ...failsafe.checklist,
      ...(policy.highRiskMode ? ['Use shortened retention and avoid publishing precise target coordinates in high-risk operations.'] : []),
    ]),
    auditCommitment: stableCommitment('drone.os.mission', {
      missionId,
      decision,
      reasons,
      aircraftId: aircraft.aircraftId,
      target,
      createdAt,
      planStatus: plan.status,
      corridorStatus: corridorReport?.status,
    }, { length: 32 }),
    privacy: privacyBoundary(),
  };
}

export function buildDroneOsFleetSnapshot(input: DroneOsFleetInput = {}): DroneOsFleetSnapshot {
  const generatedAt = toIsoTimestamp(input.generatedAt);
  const policy = normalizeDroneOsPolicy(input.mission?.policy);
  const aircraft = asArray(input.aircraft).map(item => assessDroneOsAircraft(item as DroneOsAircraftInput, policy));
  const target = normalizeMissionPoint(input.mission?.target);
  const origin = normalizeMissionPoint(input.mission?.origin);
  const missionDistance = origin && target ? droneDistanceMeters(origin, target) : 0;
  const candidates = aircraft
    .filter(item => item.available && item.status !== 'blocked')
    .filter(item => !missionDistance || item.maxRangeMeters === 0 || item.maxRangeMeters >= missionDistance * 2)
    .sort((a, b) => b.score - a.score || b.batteryPercent - a.batteryPercent);
  const selectedAircraftId = candidates[0]?.aircraftId;
  const blockers = unique(aircraft.flatMap(item => item.blockers));
  const warnings = unique(aircraft.flatMap(item => item.warnings));
  const readiness: DroneOsAircraftStatus = candidates.length
    ? warnings.length ? 'attention' : 'ready'
    : 'blocked';

  return {
    modelVersion: DRONE_OS_VERSION,
    generatedAt,
    aircraft,
    selectedAircraftId,
    readiness,
    warnings,
    blockers: candidates.length ? blockers : unique([...blockers, 'no-aircraft-ready-for-mission']),
    privacy: privacyBoundary(),
  };
}

export function buildDroneOsAuditReceipt(mission: DroneOsMission, generatedAt = new Date().toISOString()): DroneOsAuditReceipt {
  const time = toIsoTimestamp(generatedAt);
  return {
    modelVersion: DRONE_OS_VERSION,
    receiptId: stableId('DRONEOSRCP', {
      missionId: mission.missionId,
      aircraftId: mission.aircraft.aircraftId,
      decision: mission.decision,
      time,
    }, { length: 14 }),
    missionId: mission.missionId,
    aircraftId: mission.aircraft.aircraftId,
    generatedAt: time,
    decision: mission.decision,
    decisionReasons: mission.decisionReasons,
    missionCommitment: mission.auditCommitment,
    aircraftCommitment: stableCommitment('drone.os.aircraft', {
      aircraftId: mission.aircraft.aircraftId,
      status: mission.aircraft.status,
      score: mission.aircraft.score,
      firmwareVersion: mission.aircraft.firmwareVersion,
    }, { length: 32 }),
    targetCommitment: stableCommitment('drone.os.target', {
      target: mission.target,
      purpose: mission.purpose,
      createdAt: mission.createdAt,
    }, { length: 32 }),
    rawCoordinatesIncluded: false,
    privacy: privacyBoundary(),
  };
}

export function summarizeDroneOsMission(mission: DroneOsMission) {
  return {
    id: mission.missionId,
    decision: mission.decision,
    aircraft: mission.aircraft.aircraftId,
    distanceMeters: mission.plan.distanceMeters,
    altitudeAglM: mission.flightEnvelope.recommendedAltitudeAglM,
    failsafe: mission.failsafe.primaryAction,
    reasons: mission.decisionReasons,
    warningCount: mission.aircraft.warnings.length + mission.weather.warnings.length + mission.plan.risks.length,
    rawAutopilotCommands: false,
  };
}
