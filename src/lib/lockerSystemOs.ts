import {
  addSecondsToIso as addSeconds,
  cleanBoolean as cleanBool,
  cleanNonNegativeInteger as cleanInteger,
  cleanNumber,
  cleanText,
  cleanTextArray,
  hashStable,
  hasAnyPresentKey,
  stableCommitment,
  stableId,
  toIsoTimestamp as toIso,
} from './redactedWorkflowCore';

export const LOCKER_SYSTEM_OS_VERSION = 'agid-locker-system-os-v1';

export const LOCKER_CONNECTOR_PROTOCOLS = [
  'mqtt',
  'http',
  'modbus',
  'gpio-adapter',
  'simulated',
] as const;

export const LOCKER_COMPARTMENT_SIZES = [
  'xs',
  's',
  'm',
  'l',
  'xl',
  'oversize',
  'refrigerated',
] as const;

export const LOCKER_ACCESS_METHODS = [
  'qr',
  'nfc',
  'pin',
  'biometric',
  'passkey',
  'aoid-credential',
  'operator-override',
] as const;

export const LOCKER_READER_STATUSES = [
  'online',
  'offline',
  'maintenance',
  'degraded',
] as const;

export const LOCKER_SITE_TYPES = [
  'convenience-store',
  'station',
  'shopping-mall',
  'warehouse',
  'office',
  'campus',
  'apartment',
  'hospital',
  'humanitarian-site',
  'other',
] as const;

export type LockerConnectorProtocol = typeof LOCKER_CONNECTOR_PROTOCOLS[number];
export type LockerCompartmentSize = typeof LOCKER_COMPARTMENT_SIZES[number];
export type LockerAccessMethod = typeof LOCKER_ACCESS_METHODS[number];
export type LockerReaderStatus = typeof LOCKER_READER_STATUSES[number];
export type LockerSiteType = typeof LOCKER_SITE_TYPES[number];
export type LockerCompartmentStatus =
  | 'available'
  | 'reserved'
  | 'occupied'
  | 'disabled'
  | 'maintenance'
  | 'jammed'
  | 'expired-hold';
export type LockerHandlingClass = 'standard' | 'cold-chain' | 'high-value' | 'hazmat' | 'heavy';
export type LockerReservationStatus = 'assigned' | 'unassigned' | 'rejected';
export type LockerAccessActor = 'carrier' | 'recipient' | 'operator' | 'field-admin' | 'system';
export type LockerAccessDecisionStatus = 'accepted' | 'rejected' | 'review';
export type LockerSystemStatus = 'ready' | 'attention' | 'blocked';
export type LockerHardwareCommandAction =
  | 'reserve'
  | 'lock'
  | 'open'
  | 'release'
  | 'disable'
  | 'notify';

export type LockerCoordinate = {
  lat: number;
  lng: number;
};

export type LockerHardwareConnectorInput = {
  connectorId?: unknown;
  protocol?: unknown;
  endpointAlias?: unknown;
  endpointCommitment?: unknown;
  endpointUrl?: unknown;
  apiKey?: unknown;
  secret?: unknown;
  password?: unknown;
  online?: unknown;
  lastHeartbeatAt?: unknown;
  latencyMs?: unknown;
  commandAckRate?: unknown;
  modbusUnitId?: unknown;
  mqttTopicAlias?: unknown;
  httpPathAlias?: unknown;
  supportsOpen?: unknown;
  supportsLock?: unknown;
  supportsSensor?: unknown;
};

export type LockerHardwareConnector = {
  connectorId: string;
  protocol: LockerConnectorProtocol;
  endpointAlias: string;
  endpointCommitment: string;
  online: boolean;
  lastHeartbeatAt: string;
  latencyMs: number;
  commandAckRate: number;
  modbusUnitId?: number;
  mqttTopicAlias?: string;
  httpPathAlias?: string;
  supportsOpen: boolean;
  supportsLock: boolean;
  supportsSensor: boolean;
  warnings: string[];
};

export type LockerAccessReaderInput = {
  readerId?: unknown;
  label?: unknown;
  status?: unknown;
  supportedMethods?: unknown;
  connectorId?: unknown;
  lastSeenAt?: unknown;
  latencyMs?: unknown;
  batteryPercent?: unknown;
  tamperDetected?: unknown;
  rawQrPayload?: unknown;
  rawNfcPayload?: unknown;
  secret?: unknown;
};

export type LockerAccessReader = {
  readerId: string;
  label: string;
  status: LockerReaderStatus;
  supportedMethods: LockerAccessMethod[];
  connectorId?: string;
  lastSeenAt: string;
  latencyMs: number;
  batteryPercent: number;
  tamperDetected: boolean;
  warnings: string[];
};

export type LockerCompartmentInput = {
  compartmentId?: unknown;
  size?: unknown;
  status?: unknown;
  temperatureClass?: unknown;
  supportsColdChain?: unknown;
  compatibleHandling?: unknown;
  currentShipmentCommitment?: unknown;
  reservationId?: unknown;
  doorClosed?: unknown;
  sensorHealthy?: unknown;
  batteryPercent?: unknown;
  lastOpenedAt?: unknown;
  lastClosedAt?: unknown;
};

export type LockerCompartment = {
  compartmentId: string;
  size: LockerCompartmentSize;
  status: LockerCompartmentStatus;
  temperatureClass: string;
  supportsColdChain: boolean;
  compatibleHandling: LockerHandlingClass[];
  currentShipmentCommitment?: string;
  reservationId?: string;
  doorClosed: boolean;
  sensorHealthy: boolean;
  batteryPercent: number;
  lastOpenedAt?: string;
  lastClosedAt?: string;
  warnings: string[];
};

export type LockerSiteInput = {
  siteId?: unknown;
  label?: unknown;
  siteType?: unknown;
  agid?: unknown;
  agidTail?: unknown;
  addressCommitment?: unknown;
  coords?: Partial<LockerCoordinate>;
  timezone?: unknown;
  openingHours?: unknown;
  operatorAlias?: unknown;
  pudoNetworkTags?: unknown;
  connectors?: unknown;
  readers?: unknown;
  compartments?: unknown;
};

export type LockerSite = {
  siteId: string;
  label: string;
  siteType: LockerSiteType;
  agidTail?: string;
  addressCommitment?: string;
  coords?: LockerCoordinate;
  timezone: string;
  openingHours: string;
  operatorAlias: string;
  pudoNetworkTags: string[];
  connectors: LockerHardwareConnector[];
  readers: LockerAccessReader[];
  compartments: LockerCompartment[];
};

export type LockerReservationInput = {
  reservationId?: unknown;
  waybillAlias?: unknown;
  waybillCommitment?: unknown;
  recipientCommitment?: unknown;
  carrierId?: unknown;
  sizeRequired?: unknown;
  requiredAccessMethods?: unknown;
  requiredHandling?: unknown;
  reservedAt?: unknown;
  expiresAt?: unknown;
  ttlSeconds?: unknown;
  addressCommitment?: unknown;
  highRiskMode?: unknown;
  rawAddress?: unknown;
  rawAgid?: unknown;
  rawAoid?: unknown;
  recipientName?: unknown;
  phone?: unknown;
  pin?: unknown;
  accessCode?: unknown;
  qrPayload?: unknown;
  nfcPayload?: unknown;
  readerId?: unknown;
  biometricTemplate?: unknown;
};

export type LockerReservation = {
  reservationId: string;
  waybillAlias: string;
  waybillCommitment: string;
  recipientCommitment: string;
  carrierId: string;
  sizeRequired: LockerCompartmentSize;
  requiredAccessMethods: LockerAccessMethod[];
  requiredHandling: LockerHandlingClass[];
  reservedAt: string;
  expiresAt: string;
  ttlSeconds: number;
  addressCommitment?: string;
  highRiskMode: boolean;
  blocked: boolean;
  warnings: string[];
};

export type LockerAssignment = {
  reservationId: string;
  status: LockerReservationStatus;
  compartmentId?: string;
  reason?: string;
  expiresAt: string;
  highRiskMode: boolean;
};

export type LockerHardwareCommand = {
  commandId: string;
  action: LockerHardwareCommandAction;
  dispatch: 'ready' | 'queued-offline' | 'manual-required';
  connectorId?: string;
  protocol?: LockerConnectorProtocol;
  targetCompartmentId?: string;
  reservationId?: string;
  payloadCommitment: string;
  auditHash: string;
};

export type LockerNotificationPlan = {
  notificationId: string;
  event:
    | 'locker-reservation-created'
    | 'locker-reservation-rejected'
    | 'locker-access-ready'
    | 'locker-access-rejected'
    | 'locker-health-alert'
    | 'locker-handoff-complete';
  channel: 'push' | 'sms' | 'email' | 'webhook' | 'in-app';
  destinationAlias: string;
  templateId: string;
  expiresAt: string;
  payloadCommitment: string;
};

export type LockerReservationPlan = {
  modelVersion: typeof LOCKER_SYSTEM_OS_VERSION;
  generatedAt: string;
  site: LockerSite;
  reservations: LockerReservation[];
  assignments: LockerAssignment[];
  hardwareCommands: LockerHardwareCommand[];
  notifications: LockerNotificationPlan[];
  status: LockerSystemStatus;
  warnings: string[];
  privacy: LockerPrivacyBoundary;
};

export type LockerAccessAttemptInput = {
  reservationId?: unknown;
  compartmentId?: unknown;
  method?: unknown;
  presentedProofCommitment?: unknown;
  actor?: unknown;
  at?: unknown;
  operatorOverride?: unknown;
  pin?: unknown;
  qrPayload?: unknown;
  nfcPayload?: unknown;
  readerId?: unknown;
  biometricTemplate?: unknown;
};

export type LockerAccessDecision = {
  decisionId: string;
  reservationId: string;
  compartmentId: string;
  method: LockerAccessMethod;
  actor: LockerAccessActor;
  status: LockerAccessDecisionStatus;
  reason: string;
  at: string;
  readerId?: string;
  proofCommitment?: string;
  command?: LockerHardwareCommand;
  auditHash: string;
};

export type LockerMonitoringInput = {
  generatedAt?: unknown;
  site?: LockerSiteInput;
  reservations?: unknown;
  accessAttempts?: unknown;
};

export type LockerHealthAlert = {
  alertId: string;
  severity: 'info' | 'warning' | 'critical';
  code: string;
  message: string;
  targetId?: string;
};

export type LockerHealthSnapshot = {
  generatedAt: string;
  status: LockerSystemStatus;
  connectorTotals: {
    total: number;
    online: number;
    staleHeartbeat: number;
    highLatency: number;
  };
  readerTotals: {
    total: number;
    online: number;
    qrReady: number;
    nfcReady: number;
    attention: number;
  };
  compartmentTotals: {
    total: number;
    available: number;
    reserved: number;
    occupied: number;
    disabled: number;
    attention: number;
    utilization: number;
  };
  alerts: LockerHealthAlert[];
  analytics: {
    reservationFillRate: number;
    coldChainCapacity: number;
    hardwareAckRateAverage: number;
    batteryLowCount: number;
  };
};

export type LockerSystemSnapshot = {
  modelVersion: typeof LOCKER_SYSTEM_OS_VERSION;
  generatedAt: string;
  status: LockerSystemStatus;
  site: LockerSite;
  reservationPlan: LockerReservationPlan;
  accessDecisions: LockerAccessDecision[];
  health: LockerHealthSnapshot;
  privacy: LockerPrivacyBoundary;
};

export type LockerPrivacyBoundary = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawWaybillStored: false;
  rawPinStored: false;
  rawQrPayloadStored: false;
  rawNfcPayloadStored: false;
  biometricTemplateStored: false;
  hardwareSecretsStored: false;
  publicSurface: 'site-alias-compartment-state-reservation-commitments-health-and-audit-only';
};

const PRIVACY_BOUNDARY: LockerPrivacyBoundary = {
  rawAddressStored: false,
  rawAgidStored: false,
  rawAoidStored: false,
  rawWaybillStored: false,
  rawPinStored: false,
  rawQrPayloadStored: false,
  rawNfcPayloadStored: false,
  biometricTemplateStored: false,
  hardwareSecretsStored: false,
  publicSurface: 'site-alias-compartment-state-reservation-commitments-health-and-audit-only',
};

const SIZE_RANK: Record<LockerCompartmentSize, number> = {
  xs: 1,
  s: 2,
  m: 3,
  refrigerated: 4,
  l: 4,
  xl: 5,
  oversize: 6,
};

const PRIVATE_MATERIAL_KEYS = [
  'rawAddress',
  'rawAgid',
  'rawAoid',
  'recipientName',
  'phone',
  'pin',
  'accessCode',
  'qrPayload',
  'nfcPayload',
  'biometricTemplate',
] as const;

const STRONG_ACCESS_METHODS: LockerAccessMethod[] = ['nfc', 'biometric', 'passkey', 'aoid-credential'];
const DEFAULT_TTL_SECONDS = 60 * 60;
const HIGH_RISK_MAX_TTL_SECONDS = 5 * 60;
const STALE_HEARTBEAT_MS = 5 * 60 * 1000;
const HIGH_LATENCY_MS = 1500;

function commitment(domain: string, value: unknown) {
  return stableCommitment(domain, value, { length: 24 });
}

function idFrom(prefix: string, value: unknown) {
  return stableId(prefix, value, { length: 12 });
}

function readStringList(value: unknown): string[] {
  return cleanTextArray(value);
}

function readConnectorProtocol(value: unknown): LockerConnectorProtocol {
  const protocol = cleanText(value);
  return LOCKER_CONNECTOR_PROTOCOLS.includes(protocol as LockerConnectorProtocol)
    ? protocol as LockerConnectorProtocol
    : 'simulated';
}

function readSiteType(value: unknown): LockerSiteType {
  const siteType = cleanText(value);
  return LOCKER_SITE_TYPES.includes(siteType as LockerSiteType)
    ? siteType as LockerSiteType
    : 'other';
}

function readCompartmentSize(value: unknown): LockerCompartmentSize {
  const size = cleanText(value);
  return LOCKER_COMPARTMENT_SIZES.includes(size as LockerCompartmentSize)
    ? size as LockerCompartmentSize
    : 'm';
}

function readCompartmentStatus(value: unknown): LockerCompartmentStatus {
  const status = cleanText(value);
  return status === 'available'
    || status === 'reserved'
    || status === 'occupied'
    || status === 'disabled'
    || status === 'maintenance'
    || status === 'jammed'
    || status === 'expired-hold'
    ? status
    : 'available';
}

function readHandling(value: unknown): LockerHandlingClass {
  const handling = cleanText(value);
  return handling === 'cold-chain'
    || handling === 'high-value'
    || handling === 'hazmat'
    || handling === 'heavy'
    ? handling
    : 'standard';
}

function readHandlingList(value: unknown): LockerHandlingClass[] {
  if (!Array.isArray(value)) return ['standard'];
  const list = [...new Set(value.map(readHandling))];
  return list.length ? list : ['standard'];
}

function readAccessMethod(value: unknown): LockerAccessMethod {
  const method = cleanText(value);
  return LOCKER_ACCESS_METHODS.includes(method as LockerAccessMethod)
    ? method as LockerAccessMethod
    : 'qr';
}

function readAccessMethods(value: unknown): LockerAccessMethod[] {
  if (!Array.isArray(value)) return ['qr'];
  const list = [...new Set(value.map(readAccessMethod))];
  return list.length ? list : ['qr'];
}

function readReaderStatus(value: unknown): LockerReaderStatus {
  const status = cleanText(value);
  return LOCKER_READER_STATUSES.includes(status as LockerReaderStatus)
    ? status as LockerReaderStatus
    : 'online';
}

function readActor(value: unknown): LockerAccessActor {
  const actor = cleanText(value);
  return actor === 'carrier'
    || actor === 'recipient'
    || actor === 'operator'
    || actor === 'field-admin'
    || actor === 'system'
    ? actor
    : 'operator';
}

function hasPrivateMaterial(input: Record<string, unknown>) {
  return hasAnyPresentKey(input, PRIVATE_MATERIAL_KEYS);
}

function readCoordinate(value: Partial<LockerCoordinate> | undefined): LockerCoordinate | undefined {
  if (!value) return undefined;
  const lat = cleanNumber(value.lat, Number.NaN);
  const lng = cleanNumber(value.lng, Number.NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
  return { lat, lng };
}

function agidTail(value: unknown) {
  const agid = cleanText(value).replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  return agid ? agid.slice(-8) : undefined;
}

function normalizeConnector(input: LockerHardwareConnectorInput, index: number, generatedAt: string): LockerHardwareConnector {
  const connectorId = cleanText(input.connectorId, `locker-connector-${index + 1}`);
  const warnings: string[] = [];
  const hasSecret = input.endpointUrl !== undefined
    || input.apiKey !== undefined
    || input.secret !== undefined
    || input.password !== undefined;

  if (hasSecret) warnings.push('locker-hardware-secret-redacted');

  const endpointAlias = cleanText(input.endpointAlias, `${connectorId}-endpoint`);
  const endpointCommitment = cleanText(input.endpointCommitment)
    || commitment('locker-endpoint', {
      connectorId,
      endpointAlias,
      endpointUrl: input.endpointUrl ? 'redacted' : undefined,
    });

  return {
    connectorId,
    protocol: readConnectorProtocol(input.protocol),
    endpointAlias,
    endpointCommitment,
    online: cleanBool(input.online, true),
    lastHeartbeatAt: toIso(input.lastHeartbeatAt, generatedAt),
    latencyMs: Math.max(0, cleanInteger(input.latencyMs, 0)),
    commandAckRate: Math.min(1, Math.max(0, cleanNumber(input.commandAckRate, 1))),
    modbusUnitId: input.modbusUnitId === undefined ? undefined : cleanInteger(input.modbusUnitId, 0),
    mqttTopicAlias: cleanText(input.mqttTopicAlias) || undefined,
    httpPathAlias: cleanText(input.httpPathAlias) || undefined,
    supportsOpen: cleanBool(input.supportsOpen, true),
    supportsLock: cleanBool(input.supportsLock, true),
    supportsSensor: cleanBool(input.supportsSensor, true),
    warnings,
  };
}

function normalizeReader(input: LockerAccessReaderInput, index: number, generatedAt: string): LockerAccessReader {
  const readerId = cleanText(input.readerId, `locker-reader-${index + 1}`);
  const supportedMethods = readAccessMethods(input.supportedMethods).filter(method => method !== 'operator-override');
  const status = readReaderStatus(input.status);
  const warnings: string[] = [];
  const hasPrivateMaterial = input.rawQrPayload !== undefined
    || input.rawNfcPayload !== undefined
    || input.secret !== undefined;
  const tamperDetected = cleanBool(input.tamperDetected, false);
  const batteryPercent = Math.min(100, Math.max(0, cleanInteger(input.batteryPercent, 100)));

  if (hasPrivateMaterial) warnings.push('locker-reader-private-material-redacted');
  if (supportedMethods.length === 0) warnings.push('locker-reader-no-supported-access-method');
  if (status !== 'online') warnings.push(`locker-reader-${status}`);
  if (tamperDetected) warnings.push('locker-reader-tamper-detected');
  if (batteryPercent < 20) warnings.push('locker-reader-low-battery');

  return {
    readerId,
    label: cleanText(input.label, readerId),
    status,
    supportedMethods: supportedMethods.length ? supportedMethods : ['qr'],
    connectorId: cleanText(input.connectorId) || undefined,
    lastSeenAt: toIso(input.lastSeenAt, generatedAt),
    latencyMs: Math.max(0, cleanInteger(input.latencyMs, 0)),
    batteryPercent,
    tamperDetected,
    warnings,
  };
}

function defaultReaders(siteId: string, generatedAt: string): LockerAccessReader[] {
  return [
    normalizeReader({
      readerId: `${siteId}-qr-reader`,
      label: 'QR reader',
      supportedMethods: ['qr'],
      status: 'online',
      lastSeenAt: generatedAt,
    }, 0, generatedAt),
    normalizeReader({
      readerId: `${siteId}-nfc-reader`,
      label: 'NFC reader',
      supportedMethods: ['nfc', 'passkey', 'aoid-credential'],
      status: 'online',
      lastSeenAt: generatedAt,
    }, 1, generatedAt),
  ];
}

function normalizeCompartment(input: LockerCompartmentInput, index: number): LockerCompartment {
  const size = readCompartmentSize(input.size);
  const warnings: string[] = [];
  const sensorHealthy = cleanBool(input.sensorHealthy, true);
  const doorClosed = cleanBool(input.doorClosed, true);
  const batteryPercent = Math.min(100, Math.max(0, cleanInteger(input.batteryPercent, 100)));
  if (!sensorHealthy) warnings.push('locker-compartment-sensor-unhealthy');
  if (!doorClosed) warnings.push('locker-compartment-door-open');
  if (batteryPercent < 20) warnings.push('locker-compartment-low-battery');

  const compatibleHandling = readHandlingList(input.compatibleHandling);
  const supportsColdChain = cleanBool(input.supportsColdChain, size === 'refrigerated');
  const handling = supportsColdChain && !compatibleHandling.includes('cold-chain')
    ? [...compatibleHandling, 'cold-chain' as const]
    : compatibleHandling;

  return {
    compartmentId: cleanText(input.compartmentId, `locker-${String(index + 1).padStart(3, '0')}`),
    size,
    status: readCompartmentStatus(input.status),
    temperatureClass: cleanText(input.temperatureClass, supportsColdChain ? 'cold' : 'ambient'),
    supportsColdChain,
    compatibleHandling: handling,
    currentShipmentCommitment: cleanText(input.currentShipmentCommitment) || undefined,
    reservationId: cleanText(input.reservationId) || undefined,
    doorClosed,
    sensorHealthy,
    batteryPercent,
    lastOpenedAt: input.lastOpenedAt === undefined ? undefined : toIso(input.lastOpenedAt),
    lastClosedAt: input.lastClosedAt === undefined ? undefined : toIso(input.lastClosedAt),
    warnings,
  };
}

function normalizeSite(input: LockerSiteInput | undefined, generatedAt: string): LockerSite {
  const site = input || {};
  const siteId = cleanText(site.siteId, 'locker-site-local');
  const connectors = Array.isArray(site.connectors)
    ? site.connectors.map((connector, index) => normalizeConnector(connector as LockerHardwareConnectorInput, index, generatedAt))
    : [normalizeConnector({ connectorId: `${siteId}-sim`, protocol: 'simulated', online: true }, 0, generatedAt)];
  const readers = Array.isArray(site.readers)
    ? site.readers.map((reader, index) => normalizeReader(reader as LockerAccessReaderInput, index, generatedAt))
    : defaultReaders(siteId, generatedAt);
  const compartments = Array.isArray(site.compartments)
    ? site.compartments.map((compartment, index) => normalizeCompartment(compartment as LockerCompartmentInput, index))
    : [];

  return {
    siteId,
    label: cleanText(site.label, siteId),
    siteType: readSiteType(site.siteType),
    agidTail: agidTail(site.agidTail) || agidTail(site.agid),
    addressCommitment: cleanText(site.addressCommitment) || undefined,
    coords: readCoordinate(site.coords),
    timezone: cleanText(site.timezone, 'UTC'),
    openingHours: cleanText(site.openingHours, '24/7'),
    operatorAlias: cleanText(site.operatorAlias, 'operator-local'),
    pudoNetworkTags: readStringList(site.pudoNetworkTags),
    connectors,
    readers,
    compartments,
  };
}

function normalizeReservation(input: LockerReservationInput, index: number, generatedAt: string): LockerReservation {
  const reservationId = cleanText(input.reservationId, `locker-reservation-${index + 1}`);
  const reservedAt = toIso(input.reservedAt, generatedAt);
  const highRiskMode = cleanBool(input.highRiskMode, false);
  const requestedTtl = cleanInteger(input.ttlSeconds, highRiskMode ? HIGH_RISK_MAX_TTL_SECONDS : DEFAULT_TTL_SECONDS);
  const expiresAt = input.expiresAt === undefined
    ? addSeconds(reservedAt, requestedTtl)
    : toIso(input.expiresAt, addSeconds(reservedAt, requestedTtl));
  const ttlSeconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - new Date(reservedAt).getTime()) / 1000));
  const warnings: string[] = [];

  if (hasPrivateMaterial(input as Record<string, unknown>)) warnings.push('locker-reservation-private-material-rejected');
  if (highRiskMode && ttlSeconds > HIGH_RISK_MAX_TTL_SECONDS) warnings.push('locker-high-risk-ttl-too-long');

  const requiredAccessMethods = readAccessMethods(input.requiredAccessMethods);
  if (highRiskMode && !requiredAccessMethods.some(method => STRONG_ACCESS_METHODS.includes(method))) {
    warnings.push('locker-high-risk-strong-recipient-proof-required');
  }

  const requiredHandling = readHandlingList(input.requiredHandling);
  const blocked = warnings.includes('locker-reservation-private-material-rejected')
    || warnings.includes('locker-high-risk-ttl-too-long')
    || warnings.includes('locker-high-risk-strong-recipient-proof-required');

  return {
    reservationId,
    waybillAlias: cleanText(input.waybillAlias, idFrom('WBA', reservationId)),
    waybillCommitment: cleanText(input.waybillCommitment) || commitment('locker-waybill', reservationId),
    recipientCommitment: cleanText(input.recipientCommitment) || commitment('locker-recipient', reservationId),
    carrierId: cleanText(input.carrierId, 'carrier-local'),
    sizeRequired: readCompartmentSize(input.sizeRequired),
    requiredAccessMethods,
    requiredHandling,
    reservedAt,
    expiresAt,
    ttlSeconds,
    addressCommitment: cleanText(input.addressCommitment) || undefined,
    highRiskMode,
    blocked,
    warnings,
  };
}

function compatible(compartment: LockerCompartment, reservation: LockerReservation) {
  if (compartment.status !== 'available') return false;
  if (!compartment.sensorHealthy || !compartment.doorClosed) return false;
  if (SIZE_RANK[compartment.size] < SIZE_RANK[reservation.sizeRequired]) return false;
  if (reservation.requiredHandling.includes('cold-chain') && !compartment.supportsColdChain) return false;
  if (reservation.requiredHandling.includes('hazmat') && !compartment.compatibleHandling.includes('hazmat')) return false;
  if (reservation.requiredHandling.includes('heavy') && SIZE_RANK[compartment.size] < SIZE_RANK.l) return false;
  return reservation.requiredHandling.every(handling => (
    handling === 'standard' || compartment.compatibleHandling.includes(handling)
  ));
}

function compartmentScore(compartment: LockerCompartment, reservation: LockerReservation) {
  const sizeDelta = SIZE_RANK[compartment.size] - SIZE_RANK[reservation.sizeRequired];
  const coldPenalty = reservation.requiredHandling.includes('cold-chain') && compartment.size !== 'refrigerated' ? 1 : 0;
  const batteryPenalty = compartment.batteryPercent < 30 ? 1 : 0;
  return sizeDelta * 10 + coldPenalty + batteryPenalty;
}

function onlineControlConnector(site: LockerSite) {
  return site.connectors.find(connector => connector.online && connector.supportsOpen && connector.supportsLock)
    || site.connectors.find(connector => connector.online);
}

function createCommand(options: {
  action: LockerHardwareCommandAction;
  dispatch: LockerHardwareCommand['dispatch'];
  connector?: LockerHardwareConnector;
  targetCompartmentId?: string;
  reservationId?: string;
  payload: unknown;
}): LockerHardwareCommand {
  const payloadCommitment = commitment(`locker-command:${options.action}`, options.payload);
  const base = {
    action: options.action,
    dispatch: options.dispatch,
    connectorId: options.connector?.connectorId,
    targetCompartmentId: options.targetCompartmentId,
    reservationId: options.reservationId,
    payloadCommitment,
  };
  const auditHash = hashStable(base);
  return {
    commandId: idFrom('LCMD', base),
    action: options.action,
    dispatch: options.dispatch,
    connectorId: options.connector?.connectorId,
    protocol: options.connector?.protocol,
    targetCompartmentId: options.targetCompartmentId,
    reservationId: options.reservationId,
    payloadCommitment,
    auditHash,
  };
}

function notification(
  event: LockerNotificationPlan['event'],
  reservation: LockerReservation,
  channel: LockerNotificationPlan['channel'] = 'in-app',
): LockerNotificationPlan {
  const payload = {
    event,
    reservationId: reservation.reservationId,
    waybillAlias: reservation.waybillAlias,
    recipientCommitment: reservation.recipientCommitment,
  };
  return {
    notificationId: idFrom('LNOT', payload),
    event,
    channel,
    destinationAlias: reservation.recipientCommitment.slice(0, 24),
    templateId: `${LOCKER_SYSTEM_OS_VERSION}:${event}`,
    expiresAt: reservation.expiresAt,
    payloadCommitment: commitment('locker-notification', payload),
  };
}

export function planLockerReservations(input: LockerMonitoringInput): LockerReservationPlan {
  const generatedAt = toIso(input.generatedAt);
  const site = normalizeSite(input.site, generatedAt);
  const reservations = Array.isArray(input.reservations)
    ? input.reservations.map((reservation, index) => normalizeReservation(reservation as LockerReservationInput, index, generatedAt))
    : [];
  const mutableCompartments = site.compartments.map(compartment => ({ ...compartment }));
  const controlConnector = onlineControlConnector(site);
  const assignments: LockerAssignment[] = [];
  const hardwareCommands: LockerHardwareCommand[] = [];
  const notifications: LockerNotificationPlan[] = [];
  const warnings = [...site.connectors.flatMap(connector => connector.warnings)];

  for (const reservation of reservations) {
    warnings.push(...reservation.warnings);

    if (reservation.blocked) {
      assignments.push({
        reservationId: reservation.reservationId,
        status: 'rejected',
        reason: reservation.warnings[0] || 'reservation-rejected',
        expiresAt: reservation.expiresAt,
        highRiskMode: reservation.highRiskMode,
      });
      notifications.push(notification('locker-reservation-rejected', reservation));
      continue;
    }

    const candidates = mutableCompartments
      .filter(compartment => compatible(compartment, reservation))
      .sort((a, b) => compartmentScore(a, reservation) - compartmentScore(b, reservation));

    const selected = candidates[0];
    if (!selected) {
      assignments.push({
        reservationId: reservation.reservationId,
        status: 'unassigned',
        reason: 'no-compatible-compartment',
        expiresAt: reservation.expiresAt,
        highRiskMode: reservation.highRiskMode,
      });
      warnings.push('locker-reservation-no-compatible-compartment');
      notifications.push(notification('locker-reservation-rejected', reservation));
      continue;
    }

    selected.status = 'reserved';
    selected.reservationId = reservation.reservationId;
    selected.currentShipmentCommitment = reservation.waybillCommitment;

    assignments.push({
      reservationId: reservation.reservationId,
      status: 'assigned',
      compartmentId: selected.compartmentId,
      expiresAt: reservation.expiresAt,
      highRiskMode: reservation.highRiskMode,
    });

    const dispatch: LockerHardwareCommand['dispatch'] = controlConnector ? 'ready' : 'queued-offline';
    if (!controlConnector) warnings.push('locker-hardware-command-queued-offline');

    hardwareCommands.push(createCommand({
      action: 'reserve',
      dispatch,
      connector: controlConnector,
      targetCompartmentId: selected.compartmentId,
      reservationId: reservation.reservationId,
      payload: {
        reservationId: reservation.reservationId,
        compartmentId: selected.compartmentId,
        expiresAt: reservation.expiresAt,
        waybillCommitment: reservation.waybillCommitment,
      },
    }));
    hardwareCommands.push(createCommand({
      action: 'lock',
      dispatch,
      connector: controlConnector,
      targetCompartmentId: selected.compartmentId,
      reservationId: reservation.reservationId,
      payload: {
        reservationId: reservation.reservationId,
        compartmentId: selected.compartmentId,
      },
    }));
    notifications.push(notification('locker-reservation-created', reservation, reservation.highRiskMode ? 'push' : 'in-app'));
  }

  const status = warnings.some(warning => warning.includes('private-material') || warning.includes('ttl-too-long'))
    ? 'blocked'
    : warnings.length
      ? 'attention'
      : 'ready';

  return {
    modelVersion: LOCKER_SYSTEM_OS_VERSION,
    generatedAt,
    site: { ...site, compartments: mutableCompartments },
    reservations,
    assignments,
    hardwareCommands,
    notifications,
    status,
    warnings: [...new Set(warnings)],
    privacy: PRIVACY_BOUNDARY,
  };
}

function normalizeAccessAttempt(input: LockerAccessAttemptInput, index: number, generatedAt: string) {
  return {
    reservationId: cleanText(input.reservationId, `locker-reservation-${index + 1}`),
    compartmentId: cleanText(input.compartmentId, `locker-${String(index + 1).padStart(3, '0')}`),
    method: readAccessMethod(input.method),
    readerId: cleanText(input.readerId) || undefined,
    proofCommitment: cleanText(input.presentedProofCommitment),
    actor: readActor(input.actor),
    at: toIso(input.at, generatedAt),
    operatorOverride: cleanBool(input.operatorOverride, false),
    rawProofProvided: input.pin !== undefined
      || input.qrPayload !== undefined
      || input.nfcPayload !== undefined
      || input.biometricTemplate !== undefined,
  };
}

function readerForAttempt(site: LockerSite, method: LockerAccessMethod, readerId?: string) {
  const candidates = site.readers.filter(reader => (
    reader.status === 'online'
    && !reader.tamperDetected
    && reader.supportedMethods.includes(method)
  ));
  if (readerId) {
    return candidates.find(reader => reader.readerId === readerId)
      || site.readers.find(reader => reader.readerId === readerId)
      || null;
  }
  return candidates[0] || null;
}

export function evaluateLockerAccess(input: LockerMonitoringInput): LockerAccessDecision[] {
  const plan = planLockerReservations(input);
  const generatedAt = plan.generatedAt;
  const accessAttempts = Array.isArray(input.accessAttempts)
    ? input.accessAttempts.map((attempt, index) => normalizeAccessAttempt(attempt as LockerAccessAttemptInput, index, generatedAt))
    : [];
  const assignments = new Map(plan.assignments.map(assignment => [assignment.reservationId, assignment]));
  const reservations = new Map(plan.reservations.map(reservation => [reservation.reservationId, reservation]));
  const controlConnector = onlineControlConnector(plan.site);

  return accessAttempts.map((attempt) => {
    const assignment = assignments.get(attempt.reservationId);
    const reservation = reservations.get(attempt.reservationId);
    const reasons: string[] = [];
    let status: LockerAccessDecisionStatus = 'accepted';

    if (attempt.rawProofProvided) reasons.push('locker-access-raw-proof-rejected');
    if (!assignment || assignment.status !== 'assigned') reasons.push('locker-access-reservation-not-assigned');
    if (assignment?.compartmentId && assignment.compartmentId !== attempt.compartmentId) {
      reasons.push('locker-access-wrong-compartment');
    }
    if (reservation && new Date(attempt.at).getTime() > new Date(reservation.expiresAt).getTime()) {
      reasons.push('locker-access-reservation-expired');
    }
    if (reservation && !reservation.requiredAccessMethods.includes(attempt.method) && !attempt.operatorOverride) {
      reasons.push('locker-access-method-not-allowed');
    }
    const reader = attempt.operatorOverride ? null : readerForAttempt(plan.site, attempt.method, attempt.readerId);
    if (!attempt.operatorOverride && !reader) {
      reasons.push('locker-access-reader-unavailable');
    } else if (!attempt.operatorOverride && reader?.status !== 'online') {
      reasons.push('locker-access-reader-unavailable');
    } else if (!attempt.operatorOverride && reader?.tamperDetected) {
      reasons.push('locker-access-reader-tamper-detected');
    } else if (!attempt.operatorOverride && !reader?.supportedMethods.includes(attempt.method)) {
      reasons.push('locker-access-reader-method-unavailable');
    }
    if (!attempt.proofCommitment && !attempt.operatorOverride) {
      reasons.push('locker-access-proof-commitment-required');
    }
    if (attempt.operatorOverride && attempt.actor !== 'operator' && attempt.actor !== 'field-admin') {
      reasons.push('locker-access-operator-override-role-required');
    }

    if (reasons.some(reason => reason.includes('raw-proof') || reason.includes('expired') || reason.includes('wrong-compartment') || reason.includes('reader'))) {
      status = 'rejected';
    } else if (reasons.length) {
      status = 'review';
    }

    const payload = {
      reservationId: attempt.reservationId,
      compartmentId: attempt.compartmentId,
      method: attempt.method,
      actor: attempt.actor,
      status,
      reason: reasons[0] || 'locker-access-accepted',
      readerId: reader?.readerId || attempt.readerId,
      proofCommitment: attempt.proofCommitment || undefined,
    };

    const command = status === 'accepted'
      ? createCommand({
        action: 'open',
        dispatch: controlConnector ? 'ready' : 'queued-offline',
        connector: controlConnector,
        targetCompartmentId: attempt.compartmentId,
        reservationId: attempt.reservationId,
        payload,
      })
      : undefined;

    return {
      decisionId: idFrom('LACC', { ...payload, at: attempt.at }),
      reservationId: attempt.reservationId,
      compartmentId: attempt.compartmentId,
      method: attempt.method,
      actor: attempt.actor,
      status,
      reason: reasons[0] || 'locker-access-accepted',
      at: attempt.at,
      readerId: reader?.readerId || attempt.readerId,
      proofCommitment: attempt.proofCommitment || undefined,
      command,
      auditHash: hashStable(payload),
    };
  });
}

export function buildLockerHealthSnapshot(siteInput: LockerSiteInput | undefined, generatedAtInput?: unknown): LockerHealthSnapshot {
  const generatedAt = toIso(generatedAtInput);
  const site = normalizeSite(siteInput, generatedAt);
  const nowMs = new Date(generatedAt).getTime();
  const alerts: LockerHealthAlert[] = [];

  let staleHeartbeat = 0;
  let highLatency = 0;
  for (const connector of site.connectors) {
    const heartbeatAgeMs = nowMs - new Date(connector.lastHeartbeatAt).getTime();
    if (!connector.online) {
      alerts.push({
        alertId: idFrom('LALT', `${connector.connectorId}:offline`),
        severity: 'critical',
        code: 'locker-connector-offline',
        message: 'Hardware connector is offline.',
        targetId: connector.connectorId,
      });
    }
    if (heartbeatAgeMs > STALE_HEARTBEAT_MS) {
      staleHeartbeat += 1;
      alerts.push({
        alertId: idFrom('LALT', `${connector.connectorId}:stale`),
        severity: 'warning',
        code: 'locker-connector-stale-heartbeat',
        message: 'Hardware connector heartbeat is stale.',
        targetId: connector.connectorId,
      });
    }
    if (connector.latencyMs > HIGH_LATENCY_MS) {
      highLatency += 1;
      alerts.push({
        alertId: idFrom('LALT', `${connector.connectorId}:latency`),
        severity: 'warning',
        code: 'locker-connector-high-latency',
        message: 'Hardware connector latency may delay door control.',
        targetId: connector.connectorId,
      });
    }
  }

  let readerAttention = 0;
  for (const reader of site.readers) {
    const needsAttention = reader.status !== 'online'
      || reader.tamperDetected
      || reader.batteryPercent < 20
      || reader.supportedMethods.length === 0;
    if (needsAttention) {
      readerAttention += 1;
      alerts.push({
        alertId: idFrom('LALT', `${reader.readerId}:reader`),
        severity: reader.tamperDetected ? 'critical' : 'warning',
        code: reader.tamperDetected ? 'locker-reader-tamper-detected' : 'locker-reader-attention',
        message: 'QR/NFC access reader needs operator attention.',
        targetId: reader.readerId,
      });
    }
  }

  let attention = 0;
  let batteryLowCount = 0;
  for (const compartment of site.compartments) {
    const needsAttention = compartment.status === 'disabled'
      || compartment.status === 'maintenance'
      || compartment.status === 'jammed'
      || compartment.status === 'expired-hold'
      || !compartment.sensorHealthy
      || !compartment.doorClosed
      || compartment.batteryPercent < 20;
    if (needsAttention) attention += 1;
    if (compartment.batteryPercent < 20) batteryLowCount += 1;
    if (compartment.status === 'jammed') {
      alerts.push({
        alertId: idFrom('LALT', `${compartment.compartmentId}:jammed`),
        severity: 'critical',
        code: 'locker-compartment-jammed',
        message: 'Compartment appears jammed and must not be assigned.',
        targetId: compartment.compartmentId,
      });
    } else if (needsAttention) {
      alerts.push({
        alertId: idFrom('LALT', `${compartment.compartmentId}:attention`),
        severity: 'warning',
        code: 'locker-compartment-attention',
        message: 'Compartment needs operator attention.',
        targetId: compartment.compartmentId,
      });
    }
  }

  const available = site.compartments.filter(compartment => compartment.status === 'available').length;
  const reserved = site.compartments.filter(compartment => compartment.status === 'reserved').length;
  const occupied = site.compartments.filter(compartment => compartment.status === 'occupied').length;
  const disabled = site.compartments.filter(compartment => compartment.status === 'disabled' || compartment.status === 'maintenance' || compartment.status === 'jammed').length;
  const total = site.compartments.length;
  const online = site.connectors.filter(connector => connector.online).length;
  const readersOnline = site.readers.filter(reader => reader.status === 'online' && !reader.tamperDetected).length;
  const qrReady = site.readers.filter(reader => reader.status === 'online' && !reader.tamperDetected && reader.supportedMethods.includes('qr')).length;
  const nfcReady = site.readers.filter(reader => reader.status === 'online' && !reader.tamperDetected && reader.supportedMethods.includes('nfc')).length;
  const hardwareAckRateAverage = site.connectors.length
    ? Number((site.connectors.reduce((sum, connector) => sum + connector.commandAckRate, 0) / site.connectors.length).toFixed(3))
    : 0;
  const coldChainCapacity = total
    ? Number((site.compartments.filter(compartment => compartment.supportsColdChain).length / total).toFixed(3))
    : 0;
  const status: LockerSystemStatus = alerts.some(alert => alert.severity === 'critical') || (site.connectors.length > 0 && online === 0)
    ? 'blocked'
    : alerts.length
      ? 'attention'
      : 'ready';

  return {
    generatedAt,
    status,
    connectorTotals: {
      total: site.connectors.length,
      online,
      staleHeartbeat,
      highLatency,
    },
    readerTotals: {
      total: site.readers.length,
      online: readersOnline,
      qrReady,
      nfcReady,
      attention: readerAttention,
    },
    compartmentTotals: {
      total,
      available,
      reserved,
      occupied,
      disabled,
      attention,
      utilization: total ? Number(((reserved + occupied) / total).toFixed(3)) : 0,
    },
    alerts,
    analytics: {
      reservationFillRate: total ? Number((reserved / total).toFixed(3)) : 0,
      coldChainCapacity,
      hardwareAckRateAverage,
      batteryLowCount,
    },
  };
}

export function buildLockerSystemSnapshot(input: LockerMonitoringInput): LockerSystemSnapshot {
  const reservationPlan = planLockerReservations(input);
  const accessDecisions = evaluateLockerAccess(input);
  const health = buildLockerHealthSnapshot(reservationPlan.site, reservationPlan.generatedAt);
  const status: LockerSystemStatus = [reservationPlan.status, health.status].includes('blocked')
    ? 'blocked'
    : [reservationPlan.status, health.status].includes('attention') || accessDecisions.some(decision => decision.status !== 'accepted')
      ? 'attention'
      : 'ready';

  return {
    modelVersion: LOCKER_SYSTEM_OS_VERSION,
    generatedAt: reservationPlan.generatedAt,
    status,
    site: reservationPlan.site,
    reservationPlan,
    accessDecisions,
    health,
    privacy: PRIVACY_BOUNDARY,
  };
}

export function listLockerSystemCapabilities() {
  return {
    modelVersion: LOCKER_SYSTEM_OS_VERSION,
    connectorProtocols: LOCKER_CONNECTOR_PROTOCOLS,
    compartmentSizes: LOCKER_COMPARTMENT_SIZES,
  accessMethods: LOCKER_ACCESS_METHODS,
  readerStatuses: LOCKER_READER_STATUSES,
    siteTypes: LOCKER_SITE_TYPES,
    privacy: PRIVACY_BOUNDARY,
  };
}
