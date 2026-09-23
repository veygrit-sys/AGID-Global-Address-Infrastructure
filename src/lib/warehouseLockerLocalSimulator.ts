import {
  buildLockerSystemSnapshot,
  listLockerSystemCapabilities,
  type LockerHardwareCommand,
  type LockerHardwareConnector,
  type LockerMonitoringInput,
} from './lockerSystemOs';
import {
  planWarehouseExecution,
  type OperationsWarehousePlan,
  type OperationsWarehousePlanInput,
} from './operations';
import {
  cleanBoolean,
  cleanNonNegativeInteger,
  cleanNumber,
  cleanText,
  hashStable,
  stableCommitment,
  stableId,
  toIsoTimestamp,
} from './redactedWorkflowCore';

export const WAREHOUSE_LOCKER_LOCAL_SIMULATOR_VERSION = 'warehouse-locker-local-simulator-v1';

export const WAREHOUSE_LOCKER_SIMULATOR_PROTOCOLS = ['mqtt', 'http', 'modbus'] as const;
export type WarehouseLockerSimulatorProtocol = typeof WAREHOUSE_LOCKER_SIMULATOR_PROTOCOLS[number];

export type WarehouseLockerSimulatorStatus = 'ready' | 'attention' | 'blocked';
export type WarehouseLockerSimulatorFrameDirection = 'inbound' | 'outbound';
export type WarehouseLockerSimulatorFrameStatus =
  | 'acknowledged'
  | 'sent'
  | 'queued-offline'
  | 'manual-required'
  | 'rejected';

export type WarehouseLockerSimulatorDeviceInput = {
  deviceId?: unknown;
  connectorId?: unknown;
  kind?: unknown;
  protocol?: unknown;
  online?: unknown;
  endpointAlias?: unknown;
  mqttTopicAlias?: unknown;
  httpPathAlias?: unknown;
  modbusUnitId?: unknown;
  latencyMs?: unknown;
  commandAckRate?: unknown;
  clockSkewMs?: unknown;
  firmwareVersion?: unknown;
  apiKey?: unknown;
  secret?: unknown;
  password?: unknown;
  token?: unknown;
};

export type WarehouseLockerSimulatorScriptEventInput = {
  eventId?: unknown;
  protocol?: unknown;
  direction?: unknown;
  deviceId?: unknown;
  connectorId?: unknown;
  operation?: unknown;
  at?: unknown;
  topicAlias?: unknown;
  httpMethod?: unknown;
  httpPathAlias?: unknown;
  modbusUnitId?: unknown;
  modbusRegister?: unknown;
  modbusValue?: unknown;
  compartmentId?: unknown;
  reservationId?: unknown;
  payload?: unknown;
  payloadCommitment?: unknown;
  rawPayload?: unknown;
  rawAddress?: unknown;
  rawAgid?: unknown;
  rawAoid?: unknown;
  rawWaybill?: unknown;
  pin?: unknown;
  qrPayload?: unknown;
  nfcPayload?: unknown;
  biometricTemplate?: unknown;
  apiKey?: unknown;
  secret?: unknown;
  password?: unknown;
  token?: unknown;
};

export type WarehouseLockerLocalSimulatorInput = {
  generatedAt?: unknown;
  site?: LockerMonitoringInput['site'];
  reservations?: LockerMonitoringInput['reservations'];
  accessAttempts?: LockerMonitoringInput['accessAttempts'];
  warehouse?: OperationsWarehousePlanInput;
  devices?: unknown;
  script?: unknown;
};

export type WarehouseLockerSimulatorDevice = {
  deviceId: string;
  connectorId: string;
  kind: 'locker-controller' | 'warehouse-gateway' | 'sensor' | 'operator-console';
  protocol: WarehouseLockerSimulatorProtocol;
  online: boolean;
  endpointAlias: string;
  mqttTopicAlias?: string;
  httpPathAlias?: string;
  modbusUnitId?: number;
  latencyMs: number;
  commandAckRate: number;
  clockSkewMs: number;
  firmwareVersion: string;
  warnings: string[];
};

export type WarehouseLockerSimulatorFrame = {
  frameId: string;
  protocol: WarehouseLockerSimulatorProtocol;
  direction: WarehouseLockerSimulatorFrameDirection;
  status: WarehouseLockerSimulatorFrameStatus;
  at: string;
  deviceId: string;
  connectorId?: string;
  operation: string;
  targetType: 'locker-command' | 'connector-heartbeat' | 'script-event' | 'warehouse-event';
  targetId?: string;
  topicAlias?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  httpPathAlias?: string;
  modbusUnitId?: number;
  modbusRegister?: number;
  modbusValue?: number;
  commandId?: string;
  payloadCommitment: string;
  auditHash: string;
  warnings: string[];
};

export type WarehouseLockerLocalSimulation = {
  modelVersion: typeof WAREHOUSE_LOCKER_LOCAL_SIMULATOR_VERSION;
  generatedAt: string;
  status: WarehouseLockerSimulatorStatus;
  devices: WarehouseLockerSimulatorDevice[];
  frames: WarehouseLockerSimulatorFrame[];
  protocolTotals: Record<WarehouseLockerSimulatorProtocol, {
    inbound: number;
    outbound: number;
    rejected: number;
    queuedOffline: number;
    acknowledged: number;
  }>;
  warehousePlan: OperationsWarehousePlan;
  lockerSnapshot: ReturnType<typeof buildLockerSystemSnapshot>;
  state: {
    commandFrames: number;
    heartbeatFrames: number;
    scriptFrames: number;
    offlineQueue: number;
    rejectedFrames: number;
    modbusRegisterCount: number;
    mqttTopicCount: number;
    httpEndpointCount: number;
  };
  warnings: string[];
  privacy: WarehouseLockerSimulatorPrivacyBoundary;
};

export type WarehouseLockerSimulatorPrivacyBoundary = {
  rawPayloadStored: false;
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawWaybillStored: false;
  rawPinStored: false;
  rawQrPayloadStored: false;
  rawNfcPayloadStored: false;
  hardwareSecretsStored: false;
  publicSurface: 'local-protocol-frame-metadata-commitments-health-and-audit-only';
};

const PRIVACY_BOUNDARY: WarehouseLockerSimulatorPrivacyBoundary = {
  rawPayloadStored: false,
  rawAddressStored: false,
  rawAgidStored: false,
  rawAoidStored: false,
  rawWaybillStored: false,
  rawPinStored: false,
  rawQrPayloadStored: false,
  rawNfcPayloadStored: false,
  hardwareSecretsStored: false,
  publicSurface: 'local-protocol-frame-metadata-commitments-health-and-audit-only',
};

const PRIVATE_KEYS = [
  'rawPayload',
  'rawAddress',
  'rawAgid',
  'rawAoid',
  'rawWaybill',
  'recipientName',
  'phone',
  'pin',
  'accessCode',
  'qrPayload',
  'nfcPayload',
  'biometricTemplate',
  'apiKey',
  'secret',
  'password',
  'token',
] as const;

const MODBUS_ACTION_REGISTER: Record<LockerHardwareCommand['action'] | 'heartbeat' | 'sensor' | 'command-ack' | 'inventory-adjust' | 'pick-complete', number> = {
  reserve: 40_001,
  lock: 40_002,
  open: 40_003,
  release: 40_004,
  disable: 40_005,
  notify: 40_006,
  heartbeat: 40_101,
  sensor: 40_102,
  'command-ack': 40_103,
  'inventory-adjust': 40_201,
  'pick-complete': 40_202,
};

function hasPrivateMaterial(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasPrivateMaterial);
  const record = value as Record<string, unknown>;
  return Object.keys(record).some(key => (
    (PRIVATE_KEYS as readonly string[]).includes(key)
    || hasPrivateMaterial(record[key])
  ));
}

function cleanProtocol(value: unknown): WarehouseLockerSimulatorProtocol {
  const protocol = cleanText(value).toLowerCase();
  return WAREHOUSE_LOCKER_SIMULATOR_PROTOCOLS.includes(protocol as WarehouseLockerSimulatorProtocol)
    ? protocol as WarehouseLockerSimulatorProtocol
    : 'http';
}

function cleanKind(value: unknown): WarehouseLockerSimulatorDevice['kind'] {
  const kind = cleanText(value).toLowerCase();
  return kind === 'warehouse-gateway'
    || kind === 'sensor'
    || kind === 'operator-console'
    || kind === 'locker-controller'
    ? kind
    : 'locker-controller';
}

function protocolFromConnector(connector: LockerHardwareConnector | undefined): WarehouseLockerSimulatorProtocol {
  return cleanProtocol(connector?.protocol);
}

function cleanMethod(value: unknown): WarehouseLockerSimulatorFrame['httpMethod'] {
  const method = cleanText(value).toUpperCase();
  return method === 'GET' || method === 'PUT' || method === 'PATCH' ? method : 'POST';
}

function cleanOperation(value: unknown) {
  return cleanText(value, 'heartbeat', 80).toLowerCase().replace(/_/g, '-');
}

function frameCommitment(domain: string, value: unknown) {
  return stableCommitment(domain, value, { length: 28 });
}

function frameAuditHash(value: unknown) {
  return hashStable(value).slice(0, 32);
}

function defaultSite(generatedAt: string): LockerMonitoringInput['site'] {
  return {
    siteId: 'local-locker-sim',
    label: 'Local Warehouse / Locker Simulator',
    siteType: 'warehouse',
    timezone: 'Asia/Tokyo',
    openingHours: '24/7',
    operatorAlias: 'operator-local-sim',
    connectors: [
      {
        connectorId: 'SIM-MQTT-1',
        protocol: 'mqtt',
        endpointAlias: 'local-mqtt-bus',
        mqttTopicAlias: 'local/locker/commands',
        online: true,
        lastHeartbeatAt: generatedAt,
        latencyMs: 35,
        commandAckRate: 1,
      },
      {
        connectorId: 'SIM-HTTP-1',
        protocol: 'http',
        endpointAlias: 'local-http-gateway',
        httpPathAlias: '/local/locker/commands',
        online: true,
        lastHeartbeatAt: generatedAt,
        latencyMs: 45,
        commandAckRate: 0.98,
      },
      {
        connectorId: 'SIM-MODBUS-1',
        protocol: 'modbus',
        endpointAlias: 'local-modbus-rtu',
        modbusUnitId: 7,
        online: true,
        lastHeartbeatAt: generatedAt,
        latencyMs: 25,
        commandAckRate: 0.97,
      },
    ],
    compartments: [
      {
        compartmentId: 'SIM-COLD-01',
        size: 'refrigerated',
        status: 'available',
        supportsColdChain: true,
        compatibleHandling: ['standard', 'cold-chain', 'high-value'],
        batteryPercent: 92,
      },
      {
        compartmentId: 'SIM-MID-01',
        size: 'm',
        status: 'available',
        compatibleHandling: ['standard', 'high-value'],
        batteryPercent: 84,
      },
      {
        compartmentId: 'SIM-LARGE-01',
        size: 'l',
        status: 'available',
        compatibleHandling: ['standard', 'heavy'],
        batteryPercent: 88,
      },
    ],
  };
}

function defaultReservations(): LockerMonitoringInput['reservations'] {
  return [
    {
      reservationId: 'SIM-RES-COLD',
      waybillAlias: 'WBA-SIM-COLD',
      waybillCommitment: 'waybill:sim:cold',
      recipientCommitment: 'recipient:sim:cold',
      carrierId: 'carrier:local',
      sizeRequired: 'm',
      requiredHandling: ['cold-chain'],
      requiredAccessMethods: ['nfc', 'aoid-credential'],
      ttlSeconds: 300,
      highRiskMode: true,
    },
    {
      reservationId: 'SIM-RES-STD',
      waybillAlias: 'WBA-SIM-STD',
      waybillCommitment: 'waybill:sim:std',
      recipientCommitment: 'recipient:sim:std',
      carrierId: 'carrier:local',
      sizeRequired: 'm',
      requiredHandling: ['standard'],
      requiredAccessMethods: ['qr'],
      ttlSeconds: 1800,
    },
  ];
}

function defaultWarehouse(generatedAt: string): OperationsWarehousePlanInput {
  return {
    generatedAt,
    pickingStrategy: 'zone',
    locations: [
      {
        locationId: 'SIM-A-01-01',
        zone: 'A',
        aisle: '01',
        bay: '01',
        capacityUnits: 80,
        currentUnits: 40,
        compatibleHandling: ['standard', 'cold-chain'],
        temperatureClass: 'cold',
      },
      {
        locationId: 'SIM-B-02-01',
        zone: 'B',
        aisle: '02',
        bay: '01',
        capacityUnits: 100,
        currentUnits: 20,
        compatibleHandling: ['standard', 'heavy'],
        temperatureClass: 'ambient',
      },
    ],
    inventory: [
      {
        skuId: 'SIM-SKU-COLD',
        lotId: 'SIM-LOT-COLD',
        locationId: 'SIM-A-01-01',
        quantityOnHand: 18,
        allocatedQuantity: 0,
        receivedAt: generatedAt,
        reorderPoint: 5,
        handlingClass: 'cold-chain',
      },
      {
        skuId: 'SIM-SKU-BOX',
        lotId: 'SIM-LOT-BOX',
        locationId: 'SIM-B-02-01',
        quantityOnHand: 16,
        allocatedQuantity: 0,
        receivedAt: generatedAt,
        reorderPoint: 4,
        handlingClass: 'standard',
      },
    ],
    orders: [
      {
        orderId: 'SIM-ORDER-COLD',
        priority: 5,
        dueAt: new Date(new Date(generatedAt).getTime() + 60 * 60_000).toISOString(),
        destinationAddressCommitment: 'addr:sim:cold',
        lines: [
          {
            lineId: 'SIM-LINE-COLD',
            skuId: 'SIM-SKU-COLD',
            quantity: 4,
            handlingClass: 'cold-chain',
          },
        ],
      },
      {
        orderId: 'SIM-ORDER-BOX',
        priority: 2,
        dueAt: new Date(new Date(generatedAt).getTime() + 120 * 60_000).toISOString(),
        destinationAddressCommitment: 'addr:sim:box',
        lines: [
          {
            lineId: 'SIM-LINE-BOX',
            skuId: 'SIM-SKU-BOX',
            quantity: 3,
            handlingClass: 'standard',
          },
        ],
      },
    ],
  };
}

function connectorDevice(connector: LockerHardwareConnector): WarehouseLockerSimulatorDevice {
  const protocol = protocolFromConnector(connector);
  const warnings = [...connector.warnings];
  if (!connector.online) warnings.push('simulator-device-offline');
  if (connector.commandAckRate < 0.75) warnings.push('simulator-device-low-ack-rate');

  return {
    deviceId: stableId('SIMDEV', connector.connectorId, { length: 10 }),
    connectorId: connector.connectorId,
    kind: 'locker-controller',
    protocol,
    online: connector.online,
    endpointAlias: connector.endpointAlias,
    mqttTopicAlias: connector.mqttTopicAlias || `${connector.endpointAlias}/events`,
    httpPathAlias: connector.httpPathAlias || `/${connector.endpointAlias}/events`,
    modbusUnitId: connector.modbusUnitId ?? 1,
    latencyMs: connector.latencyMs,
    commandAckRate: connector.commandAckRate,
    clockSkewMs: 0,
    firmwareVersion: 'local-sim',
    warnings,
  };
}

function normalizeInputDevice(input: WarehouseLockerSimulatorDeviceInput, index: number): WarehouseLockerSimulatorDevice {
  const privateMaterial = hasPrivateMaterial(input);
  const protocol = cleanProtocol(input.protocol);
  const connectorId = cleanText(input.connectorId, `SIM-DEVICE-CONN-${index + 1}`);
  const endpointAlias = cleanText(input.endpointAlias, `${connectorId.toLowerCase()}-endpoint`);
  const warnings: string[] = [];
  if (privateMaterial) warnings.push('simulator-device-secret-redacted');
  const online = cleanBoolean(input.online, true);
  if (!online) warnings.push('simulator-device-offline');

  return {
    deviceId: cleanText(input.deviceId, stableId('SIMDEV', { connectorId, index }, { length: 10 })),
    connectorId,
    kind: cleanKind(input.kind),
    protocol,
    online,
    endpointAlias,
    mqttTopicAlias: cleanText(input.mqttTopicAlias) || `${endpointAlias}/events`,
    httpPathAlias: cleanText(input.httpPathAlias) || `/${endpointAlias}/events`,
    modbusUnitId: Math.max(1, cleanNonNegativeInteger(input.modbusUnitId, index + 1)),
    latencyMs: cleanNonNegativeInteger(input.latencyMs, 0),
    commandAckRate: Math.min(1, Math.max(0, cleanNumber(input.commandAckRate, 1))),
    clockSkewMs: cleanNumber(input.clockSkewMs, 0),
    firmwareVersion: cleanText(input.firmwareVersion, 'local-sim', 80),
    warnings,
  };
}

function buildDevices(
  connectors: LockerHardwareConnector[],
  devicesInput: unknown,
): WarehouseLockerSimulatorDevice[] {
  const explicit = Array.isArray(devicesInput)
    ? devicesInput.map((device, index) => normalizeInputDevice(device as WarehouseLockerSimulatorDeviceInput, index))
    : [];
  const fromConnectors = connectors.map(connectorDevice);
  const byConnector = new Map<string, WarehouseLockerSimulatorDevice>();
  [...fromConnectors, ...explicit].forEach(device => {
    byConnector.set(device.connectorId, device);
  });
  return [...byConnector.values()];
}

function dispatchStatus(device: WarehouseLockerSimulatorDevice | undefined, command?: LockerHardwareCommand): WarehouseLockerSimulatorFrameStatus {
  if (command?.dispatch === 'manual-required') return 'manual-required';
  if (command?.dispatch === 'queued-offline') return 'queued-offline';
  if (!device?.online) return 'queued-offline';
  return device.commandAckRate >= 0.95 ? 'acknowledged' : 'sent';
}

function protocolFrameFields(
  protocol: WarehouseLockerSimulatorProtocol,
  device: WarehouseLockerSimulatorDevice,
  operation: string,
) {
  if (protocol === 'mqtt') {
    return {
      topicAlias: device.mqttTopicAlias || `${device.endpointAlias}/events`,
    };
  }
  if (protocol === 'modbus') {
    const register = MODBUS_ACTION_REGISTER[operation as keyof typeof MODBUS_ACTION_REGISTER] ?? 40_999;
    return {
      modbusUnitId: device.modbusUnitId ?? 1,
      modbusRegister: register,
      modbusValue: operation === 'disable' ? 0 : 1,
    };
  }
  return {
    httpMethod: 'POST' as const,
    httpPathAlias: device.httpPathAlias || `/${device.endpointAlias}/events`,
  };
}

function createFrame(input: Omit<WarehouseLockerSimulatorFrame, 'frameId' | 'auditHash'>): WarehouseLockerSimulatorFrame {
  const frameId = stableId('SIMFRAME', input, { length: 14 });
  const auditHash = frameAuditHash({ ...input, frameId });
  return {
    ...input,
    frameId,
    auditHash,
  };
}

function heartbeatFrame(device: WarehouseLockerSimulatorDevice, generatedAt: string): WarehouseLockerSimulatorFrame {
  const operation = 'heartbeat';
  const status: WarehouseLockerSimulatorFrameStatus = device.online
    ? device.commandAckRate >= 0.95 ? 'acknowledged' : 'sent'
    : 'queued-offline';
  return createFrame({
    protocol: device.protocol,
    direction: 'inbound',
    status,
    at: new Date(new Date(generatedAt).getTime() + device.clockSkewMs).toISOString(),
    deviceId: device.deviceId,
    connectorId: device.connectorId,
    operation,
    targetType: 'connector-heartbeat',
    targetId: device.connectorId,
    ...protocolFrameFields(device.protocol, device, operation),
    payloadCommitment: frameCommitment('sim-heartbeat', {
      connectorId: device.connectorId,
      online: device.online,
      latencyMs: device.latencyMs,
      firmwareVersion: device.firmwareVersion,
    }),
    warnings: [...device.warnings],
  });
}

function commandFrame(
  command: LockerHardwareCommand,
  devices: WarehouseLockerSimulatorDevice[],
  generatedAt: string,
): WarehouseLockerSimulatorFrame {
  const device = devices.find(item => item.connectorId === command.connectorId) ?? devices[0];
  const protocol = device?.protocol ?? 'http';
  const operation = command.action;
  const warnings = [
    ...(device?.warnings ?? []),
    ...(command.dispatch === 'queued-offline' ? ['simulator-command-queued-offline'] : []),
    ...(command.dispatch === 'manual-required' ? ['simulator-command-manual-required'] : []),
  ];

  return createFrame({
    protocol,
    direction: 'outbound',
    status: dispatchStatus(device, command),
    at: generatedAt,
    deviceId: device?.deviceId ?? 'SIMDEV-LOCAL',
    connectorId: command.connectorId,
    operation,
    targetType: 'locker-command',
    targetId: command.targetCompartmentId ?? command.reservationId,
    commandId: command.commandId,
    ...protocolFrameFields(protocol, device ?? {
      deviceId: 'SIMDEV-LOCAL',
      connectorId: 'SIM-LOCAL',
      kind: 'locker-controller',
      protocol,
      online: false,
      endpointAlias: 'local-simulator',
      latencyMs: 0,
      commandAckRate: 0,
      clockSkewMs: 0,
      firmwareVersion: 'local-sim',
      warnings: [],
    }, operation),
    payloadCommitment: command.payloadCommitment,
    warnings,
  });
}

function scriptFrame(
  input: WarehouseLockerSimulatorScriptEventInput,
  index: number,
  devices: WarehouseLockerSimulatorDevice[],
  generatedAt: string,
): WarehouseLockerSimulatorFrame {
  const protocol = cleanProtocol(input.protocol);
  const operation = cleanOperation(input.operation);
  const connectorId = cleanText(input.connectorId);
  const deviceId = cleanText(input.deviceId);
  const device = devices.find(item => (
    item.deviceId === deviceId
    || item.connectorId === connectorId
    || item.protocol === protocol
  )) ?? devices[0];
  const at = toIsoTimestamp(input.at, generatedAt);
  const privateMaterial = hasPrivateMaterial(input);
  const warnings = [
    ...(privateMaterial ? ['simulator-script-private-material-rejected'] : []),
    ...(!device?.online ? ['simulator-script-device-offline'] : []),
  ];
  const status: WarehouseLockerSimulatorFrameStatus = privateMaterial
    ? 'rejected'
    : device?.online === false
      ? 'queued-offline'
      : 'acknowledged';
  const payloadCommitment = cleanText(input.payloadCommitment)
    || frameCommitment('sim-script-payload', {
      index,
      protocol,
      operation,
      target: cleanText(input.compartmentId) || cleanText(input.reservationId),
      payload: input.payload === undefined ? 'none' : 'committed',
    });
  const protocolFields = protocol === 'modbus'
    ? {
        modbusUnitId: Math.max(1, cleanNonNegativeInteger(input.modbusUnitId, device?.modbusUnitId ?? 1)),
        modbusRegister: Math.max(1, cleanNonNegativeInteger(input.modbusRegister, MODBUS_ACTION_REGISTER[operation as keyof typeof MODBUS_ACTION_REGISTER] ?? 40_999)),
        modbusValue: cleanNonNegativeInteger(input.modbusValue, operation === 'disable' ? 0 : 1),
      }
    : protocol === 'mqtt'
      ? { topicAlias: cleanText(input.topicAlias, device?.mqttTopicAlias ?? 'local/sim/events') }
      : {
          httpMethod: cleanMethod(input.httpMethod),
          httpPathAlias: cleanText(input.httpPathAlias, device?.httpPathAlias ?? '/local/sim/events'),
        };

  return createFrame({
    protocol,
    direction: input.direction === 'outbound' ? 'outbound' : 'inbound',
    status,
    at,
    deviceId: device?.deviceId ?? 'SIMDEV-LOCAL',
    connectorId: connectorId || device?.connectorId,
    operation,
    targetType: 'script-event',
    targetId: cleanText(input.compartmentId) || cleanText(input.reservationId) || cleanText(input.eventId, `script-${index + 1}`),
    ...protocolFields,
    payloadCommitment,
    warnings,
  });
}

function totals(frames: WarehouseLockerSimulatorFrame[]): WarehouseLockerLocalSimulation['protocolTotals'] {
  const initial = {
    mqtt: { inbound: 0, outbound: 0, rejected: 0, queuedOffline: 0, acknowledged: 0 },
    http: { inbound: 0, outbound: 0, rejected: 0, queuedOffline: 0, acknowledged: 0 },
    modbus: { inbound: 0, outbound: 0, rejected: 0, queuedOffline: 0, acknowledged: 0 },
  } satisfies WarehouseLockerLocalSimulation['protocolTotals'];

  frames.forEach(frame => {
    initial[frame.protocol][frame.direction] += 1;
    if (frame.status === 'rejected') initial[frame.protocol].rejected += 1;
    if (frame.status === 'queued-offline') initial[frame.protocol].queuedOffline += 1;
    if (frame.status === 'acknowledged') initial[frame.protocol].acknowledged += 1;
  });

  return initial;
}

function redactLockerSnapshot(snapshot: ReturnType<typeof buildLockerSystemSnapshot>): ReturnType<typeof buildLockerSystemSnapshot> {
  return {
    ...snapshot,
    reservationPlan: {
      ...snapshot.reservationPlan,
      reservations: snapshot.reservationPlan.reservations.map(reservation => ({
        ...reservation,
        waybillAlias: stableId('WBA', reservation.waybillCommitment || reservation.reservationId, { length: 10 }),
      })),
    },
  };
}

export function listWarehouseLockerLocalSimulatorCapabilities() {
  const locker = listLockerSystemCapabilities();
  return {
    modelVersion: WAREHOUSE_LOCKER_LOCAL_SIMULATOR_VERSION,
    protocols: WAREHOUSE_LOCKER_SIMULATOR_PROTOCOLS,
    lockerConnectorProtocols: locker.connectorProtocols,
    simulatedSurfaces: [
      'mqtt-topic-publish',
      'http-command-request',
      'modbus-register-write',
      'connector-heartbeat',
      'locker-command-dispatch',
      'warehouse-pick-and-inventory-events',
      'offline-queue',
      'redacted-audit-hash',
    ],
    modbusRegisters: MODBUS_ACTION_REGISTER,
    privacy: PRIVACY_BOUNDARY,
  };
}

export function buildWarehouseLockerLocalSimulation(input: WarehouseLockerLocalSimulatorInput = {}): WarehouseLockerLocalSimulation {
  const generatedAt = toIsoTimestamp(input.generatedAt, '2026-06-18T00:00:00.000Z');
  const warehousePlan = planWarehouseExecution(input.warehouse ?? defaultWarehouse(generatedAt));
  const rawLockerSnapshot = buildLockerSystemSnapshot({
    generatedAt,
    site: input.site ?? defaultSite(generatedAt),
    reservations: input.reservations ?? defaultReservations(),
    accessAttempts: input.accessAttempts,
  });
  const lockerSnapshot = redactLockerSnapshot(rawLockerSnapshot);
  const devices = buildDevices(lockerSnapshot.site.connectors, input.devices);
  const heartbeatFrames = devices.map(device => heartbeatFrame(device, generatedAt));
  const commandFrames = lockerSnapshot.reservationPlan.hardwareCommands.map(command => commandFrame(command, devices, generatedAt));
  const scriptFrames = Array.isArray(input.script)
    ? input.script.map((event, index) => scriptFrame(event as WarehouseLockerSimulatorScriptEventInput, index, devices, generatedAt))
    : [];
  const frames = [...heartbeatFrames, ...commandFrames, ...scriptFrames];
  const protocolTotals = totals(frames);
  const rejectedFrames = frames.filter(frame => frame.status === 'rejected').length;
  const offlineQueue = frames.filter(frame => frame.status === 'queued-offline' || frame.status === 'manual-required').length;
  const warnings = [
    ...warehousePlan.warnings,
    ...lockerSnapshot.reservationPlan.warnings,
    ...lockerSnapshot.health.alerts.map(alert => alert.code),
    ...devices.flatMap(device => device.warnings),
    ...frames.flatMap(frame => frame.warnings),
    ...(rejectedFrames ? ['simulator-rejected-private-or-invalid-frame'] : []),
    ...(offlineQueue ? ['simulator-offline-or-manual-queue-open'] : []),
  ];
  const status: WarehouseLockerSimulatorStatus = rejectedFrames > 0
    || warehousePlan.orders.some(order => order.status === 'blocked')
    || lockerSnapshot.status === 'blocked'
      ? 'blocked'
      : warnings.length || warehousePlan.warnings.length || lockerSnapshot.status === 'attention'
        ? 'attention'
        : 'ready';

  return {
    modelVersion: WAREHOUSE_LOCKER_LOCAL_SIMULATOR_VERSION,
    generatedAt,
    status,
    devices,
    frames,
    protocolTotals,
    warehousePlan,
    lockerSnapshot,
    state: {
      commandFrames: commandFrames.length,
      heartbeatFrames: heartbeatFrames.length,
      scriptFrames: scriptFrames.length,
      offlineQueue,
      rejectedFrames,
      modbusRegisterCount: new Set(frames.map(frame => frame.modbusRegister).filter(Boolean)).size,
      mqttTopicCount: new Set(frames.map(frame => frame.topicAlias).filter(Boolean)).size,
      httpEndpointCount: new Set(frames.map(frame => frame.httpPathAlias).filter(Boolean)).size,
    },
    warnings: [...new Set(warnings)],
    privacy: PRIVACY_BOUNDARY,
  };
}
