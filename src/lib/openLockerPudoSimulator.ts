import {
  listLockerSystemCapabilities,
  type LockerMonitoringInput,
  type LockerSystemSnapshot,
} from './lockerSystemOs';
import {
  buildWarehouseLockerLocalSimulation,
  listWarehouseLockerLocalSimulatorCapabilities,
  type WarehouseLockerLocalSimulation,
} from './warehouseLockerLocalSimulator';
import {
  cleanText,
  hashStable,
  stableCommitment,
  stableId,
  toIsoTimestamp,
} from './redactedWorkflowCore';

export const OPEN_LOCKER_PUDO_SIMULATOR_VERSION = 'open-locker-pudo-simulator-v0.1';

export const OPEN_LOCKER_PUDO_SCENARIOS = [
  'pickup-success',
  'full-capacity',
  'reader-failure',
  'offline-sync',
  'high-risk',
] as const;

export type OpenLockerPudoScenario = typeof OPEN_LOCKER_PUDO_SCENARIOS[number];
export type OpenLockerPudoSiteKind = 'locker-bank' | 'pudo-counter' | 'hybrid';
export type OpenLockerPudoStatus = 'ready' | 'attention' | 'blocked';
export type OpenLockerPudoTimelineStatus = 'completed' | 'pending' | 'attention' | 'blocked';
export type OpenLockerPudoFieldFlowStage =
  | 'read'
  | 'select-locker'
  | 'unlock-decision'
  | 'receipt';
export type OpenLockerPudoDisplayStatus =
  | 'available'
  | 'reserved'
  | 'faulty'
  | 'offline'
  | 'needs-collection';

export type OpenLockerPudoSimulatorInput = {
  scenario?: unknown;
  generatedAt?: unknown;
  siteKind?: unknown;
  site?: LockerMonitoringInput['site'];
  reservations?: LockerMonitoringInput['reservations'];
  accessAttempts?: LockerMonitoringInput['accessAttempts'];
  devices?: unknown;
  script?: unknown;
};

export type OpenLockerPudoCounterState = {
  queueLength: number;
  manualHandoffCount: number;
  assignedLockerCount: number;
  rejectedOrUnassignedCount: number;
  staffAction:
    | 'release-parcel'
    | 'reserve-compartment'
    | 'manual-counter-handoff'
    | 'disable-reader'
    | 'sync-later'
    | 'manual-review';
  serviceWindows: Array<{
    windowId: string;
    label: string;
    status: 'open' | 'limited' | 'closed';
    reason: string;
  }>;
  counterReceipts: Array<{
    receiptId: string;
    purpose: 'dropoff' | 'pickup' | 'manual-review' | 'offline-sync';
    commitment: string;
  }>;
};

export type OpenLockerPudoFieldFlowStep = {
  stage: OpenLockerPudoFieldFlowStage;
  label: string;
  actor: 'carrier' | 'recipient' | 'operator' | 'field-admin' | 'system';
  status: OpenLockerPudoTimelineStatus;
  publicRef: string;
  detail: string;
};

export type OpenLockerPudoStatusLegendItem = {
  status: OpenLockerPudoDisplayStatus;
  labelJa: string;
  labelEn: string;
  description: string;
};

export type OpenLockerPudoStatusBoardItem = {
  lockerId: string;
  displayStatus: OpenLockerPudoDisplayStatus;
  labelJa: string;
  labelEn: string;
  size: string;
  publicRef: string;
  condition: string;
  accessMethods: string[];
};

export type OpenLockerPudoSafeIntake = {
  addressDisplayMode: 'alias-and-conditions';
  recipientAlias: string;
  pickupConditions: string[];
  publicSubjectRef: string;
  receiptPolicy: 'receipt-and-commitment-only';
  qrStored: false;
  nfcStored: false;
  qrPayloadStored: false;
  nfcPayloadStored: false;
  pinStored: false;
};

export type OpenLockerPudoTimelineStep = {
  stepId: string;
  label: string;
  actor: 'carrier' | 'recipient' | 'operator' | 'system';
  status: OpenLockerPudoTimelineStatus;
  at: string;
  evidenceCommitment: string;
  warnings: string[];
};

export type OpenLockerPudoRedactedEvent = {
  eventId: string;
  kind:
    | 'reservation'
    | 'access'
    | 'protocol-frame'
    | 'offline-sync'
    | 'health'
    | 'operator-note';
  status: string;
  at: string;
  actor: 'carrier' | 'recipient' | 'operator' | 'field-admin' | 'system';
  targetAlias: string;
  evidenceCommitment: string;
  auditHash: string;
  warnings: string[];
};

export type OpenLockerPudoPrivacyBoundary = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawWaybillStored: false;
  rawPinStored: false;
  rawQrPayloadStored: false;
  rawNfcPayloadStored: false;
  preciseLocationStored: false;
  hardwareSecretsStored: false;
  publicSurface: 'locker-pudo-alias-commitment-health-protocol-and-redacted-receipt-only';
};

export type OpenLockerPudoSimulation = {
  modelVersion: typeof OPEN_LOCKER_PUDO_SIMULATOR_VERSION;
  generatedAt: string;
  scenario: OpenLockerPudoScenario;
  siteKind: OpenLockerPudoSiteKind;
  mode: 'local-only';
  status: OpenLockerPudoStatus;
  summary: {
    headline: string;
    decision: 'accept' | 'review' | 'reject';
    nextAction: string;
  };
  lockerSnapshot: LockerSystemSnapshot;
  localProtocol: WarehouseLockerLocalSimulation;
  pudoCounter: OpenLockerPudoCounterState;
  fieldFlow: OpenLockerPudoFieldFlowStep[];
  lockerStatusLegend: OpenLockerPudoStatusLegendItem[];
  lockerStatusBoard: OpenLockerPudoStatusBoardItem[];
  pudoSafeIntake: OpenLockerPudoSafeIntake;
  timeline: OpenLockerPudoTimelineStep[];
  operatorActions: string[];
  eventLog: OpenLockerPudoRedactedEvent[];
  warnings: string[];
  privacy: OpenLockerPudoPrivacyBoundary;
};

const PRIVACY_BOUNDARY: OpenLockerPudoPrivacyBoundary = {
  rawAddressStored: false,
  rawAgidStored: false,
  rawAoidStored: false,
  rawWaybillStored: false,
  rawPinStored: false,
  rawQrPayloadStored: false,
  rawNfcPayloadStored: false,
  preciseLocationStored: false,
  hardwareSecretsStored: false,
  publicSurface: 'locker-pudo-alias-commitment-health-protocol-and-redacted-receipt-only',
};

const LOCKER_STATUS_LEGEND: OpenLockerPudoStatusLegendItem[] = [
  {
    status: 'available',
    labelJa: '空き',
    labelEn: 'Available',
    description: 'Can be selected for a new handoff when handling rules match.',
  },
  {
    status: 'reserved',
    labelJa: '予約',
    labelEn: 'Reserved',
    description: 'Already assigned or holding a parcel for a redacted recipient alias.',
  },
  {
    status: 'faulty',
    labelJa: '故障',
    labelEn: 'Faulty',
    description: 'Requires maintenance and cannot be opened by the normal flow.',
  },
  {
    status: 'offline',
    labelJa: 'オフライン',
    labelEn: 'Offline',
    description: 'Connector or controller is offline; receipt can be queued locally only.',
  },
  {
    status: 'needs-collection',
    labelJa: '要回収',
    labelEn: 'Needs collection',
    description: 'Parcel is present and should be collected or cleared by staff.',
  },
];

function cleanScenario(value: unknown): OpenLockerPudoScenario {
  const scenario = cleanText(value, 'pickup-success').toLowerCase();
  return OPEN_LOCKER_PUDO_SCENARIOS.includes(scenario as OpenLockerPudoScenario)
    ? scenario as OpenLockerPudoScenario
    : 'pickup-success';
}

function cleanSiteKind(value: unknown, scenario: OpenLockerPudoScenario): OpenLockerPudoSiteKind {
  const siteKind = cleanText(value).toLowerCase();
  if (siteKind === 'locker-bank' || siteKind === 'pudo-counter' || siteKind === 'hybrid') {
    return siteKind;
  }
  return scenario === 'full-capacity' ? 'pudo-counter' : 'hybrid';
}

function commitment(domain: string, value: unknown) {
  return stableCommitment(domain, value, { length: 28 });
}

function receiptId(seed: unknown) {
  return stableId('LPD-RCPT', seed, { length: 12 });
}

function minutesAfter(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function baseSite(generatedAt: string): NonNullable<LockerMonitoringInput['site']> {
  return {
    siteId: 'OPEN-PUDO-HUB-1',
    label: 'Open Locker / PUDO Simulator Hub',
    siteType: 'station',
    timezone: 'Asia/Tokyo',
    openingHours: '06:00-23:00',
    operatorAlias: 'pudo-operator-open',
    pudoNetworkTags: ['open-locker', 'pudo', 'local-first'],
    connectors: [
      {
        connectorId: 'OPEN-PUDO-MQTT',
        protocol: 'mqtt',
        endpointAlias: 'open-pudo-mqtt-bus',
        mqttTopicAlias: 'pudo/open/locker',
        online: true,
        lastHeartbeatAt: generatedAt,
        latencyMs: 42,
        commandAckRate: 0.99,
      },
      {
        connectorId: 'OPEN-PUDO-HTTP',
        protocol: 'http',
        endpointAlias: 'open-pudo-http-gateway',
        httpPathAlias: '/open-pudo/locker/events',
        online: true,
        lastHeartbeatAt: generatedAt,
        latencyMs: 64,
        commandAckRate: 0.98,
      },
      {
        connectorId: 'OPEN-PUDO-MODBUS',
        protocol: 'modbus',
        endpointAlias: 'open-pudo-modbus-controller',
        modbusUnitId: 11,
        online: true,
        lastHeartbeatAt: generatedAt,
        latencyMs: 28,
        commandAckRate: 0.97,
      },
    ],
    readers: [
      {
        readerId: 'OPEN-PUDO-QR',
        label: 'Front QR reader',
        supportedMethods: ['qr'],
        status: 'online',
        connectorId: 'OPEN-PUDO-HTTP',
        lastSeenAt: generatedAt,
        latencyMs: 35,
        batteryPercent: 91,
      },
      {
        readerId: 'OPEN-PUDO-NFC',
        label: 'NFC / passkey reader',
        supportedMethods: ['nfc', 'passkey', 'aoid-credential'],
        status: 'online',
        connectorId: 'OPEN-PUDO-MQTT',
        lastSeenAt: generatedAt,
        latencyMs: 30,
        batteryPercent: 88,
      },
    ],
    compartments: [
      {
        compartmentId: 'PUDO-M-01',
        size: 'm',
        status: 'available',
        compatibleHandling: ['standard', 'high-value'],
        batteryPercent: 86,
      },
      {
        compartmentId: 'PUDO-L-01',
        size: 'l',
        status: 'available',
        compatibleHandling: ['standard', 'heavy'],
        batteryPercent: 81,
      },
      {
        compartmentId: 'PUDO-COLD-01',
        size: 'refrigerated',
        status: 'available',
        supportsColdChain: true,
        compatibleHandling: ['standard', 'cold-chain', 'high-value'],
        batteryPercent: 92,
      },
    ],
  };
}

function baseReservations(): NonNullable<LockerMonitoringInput['reservations']> {
  return [
    {
      reservationId: 'PUDO-RES-PRIMARY',
      waybillAlias: 'WBA-PUDO-PRIMARY',
      waybillCommitment: 'waybill:open-pudo:primary',
      recipientCommitment: 'recipient:open-pudo:primary',
      carrierId: 'carrier:open-network',
      sizeRequired: 'm',
      requiredHandling: ['standard'],
      requiredAccessMethods: ['qr', 'nfc'],
      ttlSeconds: 1200,
    },
  ];
}

function scenarioInput(
  scenario: OpenLockerPudoScenario,
  generatedAt: string,
): Pick<OpenLockerPudoSimulatorInput, 'site' | 'reservations' | 'accessAttempts' | 'devices' | 'script'> {
  if (scenario === 'full-capacity') {
    return {
      site: {
        ...baseSite(generatedAt),
        compartments: [
          { compartmentId: 'PUDO-M-01', size: 'm', status: 'occupied', compatibleHandling: ['standard'] },
          { compartmentId: 'PUDO-L-01', size: 'l', status: 'maintenance', compatibleHandling: ['standard', 'heavy'] },
          { compartmentId: 'PUDO-COLD-01', size: 'refrigerated', status: 'occupied', supportsColdChain: true, compatibleHandling: ['cold-chain'] },
        ],
      },
      reservations: baseReservations(),
      script: [
        {
          protocol: 'http',
          operation: 'capacity-check',
          httpPathAlias: '/open-pudo/capacity',
          payload: { availability: 'commitment-only' },
        },
      ],
    };
  }

  if (scenario === 'reader-failure') {
    return {
      site: {
        ...baseSite(generatedAt),
        readers: [
          {
            readerId: 'OPEN-PUDO-QR',
            label: 'Front QR reader',
            supportedMethods: ['qr'],
            status: 'maintenance',
            connectorId: 'OPEN-PUDO-HTTP',
            lastSeenAt: generatedAt,
            latencyMs: 220,
            batteryPercent: 42,
          },
          {
            readerId: 'OPEN-PUDO-NFC',
            label: 'NFC / passkey reader',
            supportedMethods: ['nfc', 'passkey', 'aoid-credential'],
            status: 'online',
            connectorId: 'OPEN-PUDO-MQTT',
            lastSeenAt: generatedAt,
            latencyMs: 32,
            batteryPercent: 88,
          },
        ],
      },
      reservations: baseReservations(),
      accessAttempts: [
        {
          reservationId: 'PUDO-RES-PRIMARY',
          compartmentId: 'PUDO-M-01',
          method: 'qr',
          actor: 'recipient',
          readerId: 'OPEN-PUDO-QR',
          presentedProofCommitment: commitment('proof', 'reader-failure-qr'),
          at: minutesAfter(generatedAt, 3),
        },
      ],
      script: [
        {
          protocol: 'mqtt',
          operation: 'reader-alert',
          topicAlias: 'pudo/open/reader/alert',
          payload: { status: 'maintenance' },
        },
      ],
    };
  }

  if (scenario === 'offline-sync') {
    const site = baseSite(generatedAt);
    const connectors = Array.isArray(site.connectors) ? site.connectors : [];
    return {
      site: {
        ...site,
        connectors: connectors.map(connector => ({
          ...connector,
          online: false,
          commandAckRate: 0,
        })),
      },
      reservations: baseReservations(),
      accessAttempts: [
        {
          reservationId: 'PUDO-RES-PRIMARY',
          compartmentId: 'PUDO-M-01',
          method: 'qr',
          actor: 'operator',
          operatorOverride: true,
          presentedProofCommitment: commitment('proof', 'offline-local-override'),
          at: minutesAfter(generatedAt, 4),
        },
      ],
      devices: [
        { connectorId: 'OPEN-PUDO-MQTT', protocol: 'mqtt', online: false },
        { connectorId: 'OPEN-PUDO-HTTP', protocol: 'http', online: false },
        { connectorId: 'OPEN-PUDO-MODBUS', protocol: 'modbus', online: false },
      ],
      script: [
        {
          protocol: 'http',
          operation: 'deferred-sync',
          httpPathAlias: '/open-pudo/deferred-sync',
          payload: { localReceipt: 'commitment-only' },
        },
      ],
    };
  }

  if (scenario === 'high-risk') {
    return {
      site: {
        ...baseSite(generatedAt),
        siteType: 'humanitarian-site',
        openingHours: 'temporary-window',
      },
      reservations: [
        {
          reservationId: 'PUDO-RES-HIGH-RISK',
          waybillAlias: 'WBA-PUDO-HR',
          waybillCommitment: 'waybill:open-pudo:high-risk',
          recipientCommitment: 'recipient:open-pudo:high-risk',
          carrierId: 'carrier:trusted-field',
          sizeRequired: 'm',
          requiredHandling: ['high-value'],
          requiredAccessMethods: ['nfc', 'passkey', 'aoid-credential'],
          ttlSeconds: 240,
          highRiskMode: true,
        },
      ],
      accessAttempts: [
        {
          reservationId: 'PUDO-RES-HIGH-RISK',
          compartmentId: 'PUDO-M-01',
          method: 'nfc',
          actor: 'recipient',
          readerId: 'OPEN-PUDO-NFC',
          presentedProofCommitment: commitment('proof', 'high-risk-nfc-proof'),
          at: minutesAfter(generatedAt, 2),
        },
      ],
      script: [
        {
          protocol: 'modbus',
          operation: 'command-ack',
          modbusUnitId: 11,
          modbusRegister: 40103,
          modbusValue: 1,
        },
      ],
    };
  }

  return {
    site: baseSite(generatedAt),
    reservations: baseReservations(),
    accessAttempts: [
      {
        reservationId: 'PUDO-RES-PRIMARY',
        compartmentId: 'PUDO-M-01',
        method: 'qr',
        actor: 'recipient',
        readerId: 'OPEN-PUDO-QR',
        presentedProofCommitment: commitment('proof', 'pickup-success-qr'),
        at: minutesAfter(generatedAt, 2),
      },
    ],
    script: [
      {
        protocol: 'mqtt',
        operation: 'door-sensor',
        topicAlias: 'pudo/open/door',
        payload: { doorClosed: true },
      },
      {
        protocol: 'http',
        operation: 'handoff-receipt',
        httpPathAlias: '/open-pudo/handoff',
        payload: { receipt: 'commitment-only' },
      },
    ],
  };
}

function legendFor(status: OpenLockerPudoDisplayStatus) {
  return LOCKER_STATUS_LEGEND.find(item => item.status === status) ?? LOCKER_STATUS_LEGEND[0];
}

function displayStatusForCompartment(
  compartment: LockerSystemSnapshot['site']['compartments'][number],
  simulation: WarehouseLockerLocalSimulation,
): OpenLockerPudoDisplayStatus {
  const siteOffline = simulation.lockerSnapshot.site.connectors.length > 0
    && simulation.lockerSnapshot.site.connectors.every(connector => !connector.online);
  if (siteOffline && compartment.status === 'available') return 'offline';
  if (compartment.status === 'available') return 'available';
  if (compartment.status === 'reserved') return 'reserved';
  if (compartment.status === 'occupied') {
    return compartment.supportsColdChain || compartment.size === 'refrigerated'
      ? 'needs-collection'
      : 'reserved';
  }
  if (compartment.status === 'expired-hold') return 'needs-collection';
  return 'faulty';
}

function buildLockerStatusBoard(simulation: WarehouseLockerLocalSimulation): OpenLockerPudoStatusBoardItem[] {
  return simulation.lockerSnapshot.site.compartments.map(compartment => {
    const displayStatus = displayStatusForCompartment(compartment, simulation);
    const legend = legendFor(displayStatus);
    const conditions = [
      `size:${compartment.size}`,
      compartment.supportsColdChain ? 'cold-chain' : 'ambient',
      `battery:${compartment.batteryPercent}%`,
      compartment.sensorHealthy ? 'sensor-ok' : 'sensor-review',
    ];
    return {
      lockerId: compartment.compartmentId,
      displayStatus,
      labelJa: legend.labelJa,
      labelEn: legend.labelEn,
      size: compartment.size,
      publicRef: stableId('LPD-LOCKER', {
        compartmentId: compartment.compartmentId,
        displayStatus,
        generatedAt: simulation.generatedAt,
      }, { length: 10 }),
      condition: conditions.join(' / '),
      accessMethods: simulation.lockerSnapshot.site.readers
        .filter(reader => reader.status === 'online' && !reader.tamperDetected)
        .flatMap(reader => reader.supportedMethods)
        .filter((method, index, methods) => methods.indexOf(method) === index),
    };
  });
}

function buildTimeline(
  simulation: WarehouseLockerLocalSimulation,
  generatedAt: string,
): OpenLockerPudoTimelineStep[] {
  const snapshot = simulation.lockerSnapshot;
  const assigned = snapshot.reservationPlan.assignments.some(assignment => assignment.status === 'assigned');
  const accessAccepted = snapshot.accessDecisions.some(decision => decision.status === 'accepted');
  const accessRejected = snapshot.accessDecisions.some(decision => decision.status === 'rejected');
  const protocolOffline = simulation.state.offlineQueue > 0;
  const healthBlocked = snapshot.health.status === 'blocked';

  return [
    {
      stepId: 'dropoff-intake',
      label: 'Carrier dropoff intake',
      actor: 'carrier',
      status: assigned ? 'completed' : 'attention',
      at: generatedAt,
      evidenceCommitment: commitment('timeline:dropoff', snapshot.reservationPlan.assignments),
      warnings: assigned ? [] : ['locker-no-compatible-compartment'],
    },
    {
      stepId: 'compartment-reservation',
      label: 'Compartment reservation',
      actor: 'system',
      status: assigned ? 'completed' : 'attention',
      at: minutesAfter(generatedAt, 1),
      evidenceCommitment: commitment('timeline:reservation', snapshot.reservationPlan.hardwareCommands),
      warnings: snapshot.reservationPlan.warnings,
    },
    {
      stepId: 'recipient-proof',
      label: 'QR/NFC recipient proof',
      actor: 'recipient',
      status: accessRejected ? 'blocked' : accessAccepted ? 'completed' : 'pending',
      at: minutesAfter(generatedAt, 2),
      evidenceCommitment: commitment('timeline:access', snapshot.accessDecisions),
      warnings: snapshot.accessDecisions.filter(decision => decision.status !== 'accepted').map(decision => decision.reason),
    },
    {
      stepId: 'local-hardware-sync',
      label: 'MQTT/HTTP/Modbus sync',
      actor: 'system',
      status: healthBlocked ? 'blocked' : protocolOffline ? 'attention' : 'completed',
      at: minutesAfter(generatedAt, 3),
      evidenceCommitment: commitment('timeline:protocol', simulation.protocolTotals),
      warnings: protocolOffline ? ['local-sync-queued-offline'] : [],
    },
  ];
}

function counterState(
  simulation: WarehouseLockerLocalSimulation,
  scenario: OpenLockerPudoScenario,
): OpenLockerPudoCounterState {
  const assignments = simulation.lockerSnapshot.reservationPlan.assignments;
  const assignedLockerCount = assignments.filter(assignment => assignment.status === 'assigned').length;
  const rejectedOrUnassignedCount = assignments.length - assignedLockerCount;
  const accessProblems = simulation.lockerSnapshot.accessDecisions.filter(decision => decision.status !== 'accepted').length;
  const manualHandoffCount = rejectedOrUnassignedCount + accessProblems;
  const queueLength = manualHandoffCount + simulation.state.offlineQueue;
  const staffAction: OpenLockerPudoCounterState['staffAction'] = scenario === 'reader-failure'
    ? 'disable-reader'
    : simulation.state.offlineQueue > 0
      ? 'sync-later'
      : rejectedOrUnassignedCount > 0
        ? 'manual-counter-handoff'
        : accessProblems > 0
          ? 'manual-review'
          : assignedLockerCount > 0
            ? 'release-parcel'
            : 'reserve-compartment';

  return {
    queueLength,
    manualHandoffCount,
    assignedLockerCount,
    rejectedOrUnassignedCount,
    staffAction,
    serviceWindows: [
      {
        windowId: 'counter-main',
        label: 'PUDO counter',
        status: simulation.status === 'blocked' ? 'limited' : 'open',
        reason: simulation.status === 'blocked' ? 'manual-review-required' : 'normal-service',
      },
      {
        windowId: 'locker-bank',
        label: 'Locker bank',
        status: simulation.lockerSnapshot.health.compartmentTotals.available > 0 ? 'open' : 'limited',
        reason: simulation.lockerSnapshot.health.compartmentTotals.available > 0 ? 'compartments-available' : 'capacity-limited',
      },
    ],
    counterReceipts: [
      {
        receiptId: receiptId({ scenario, purpose: 'dropoff', assignments }),
        purpose: 'dropoff',
        commitment: commitment('receipt:dropoff', assignments),
      },
      {
        receiptId: receiptId({ scenario, purpose: 'pickup', access: simulation.lockerSnapshot.accessDecisions }),
        purpose: 'pickup',
        commitment: commitment('receipt:pickup', simulation.lockerSnapshot.accessDecisions),
      },
      {
        receiptId: receiptId({ scenario, purpose: 'offline-sync', state: simulation.state }),
        purpose: simulation.state.offlineQueue ? 'offline-sync' : 'manual-review',
        commitment: commitment('receipt:sync', simulation.state),
      },
    ],
  };
}

function buildPudoSafeIntake(simulation: WarehouseLockerLocalSimulation): OpenLockerPudoSafeIntake {
  const reservation = simulation.lockerSnapshot.reservationPlan.reservations[0];
  const accessMethods = reservation?.requiredAccessMethods?.length
    ? reservation.requiredAccessMethods.join('+')
    : 'counter-proof';
  const handling = reservation?.requiredHandling?.length
    ? reservation.requiredHandling.join('+')
    : 'standard';
  const pickupConditions = [
    `proof:${accessMethods}`,
    `handling:${handling}`,
    `size:${reservation?.sizeRequired ?? 'm'}`,
    reservation?.highRiskMode ? 'strong-proof-required' : 'standard-proof',
    simulation.state.offlineQueue > 0 ? 'local-receipt-sync-later' : 'online-or-local-receipt',
  ];

  return {
    addressDisplayMode: 'alias-and-conditions',
    recipientAlias: stableId('PUDO-ALIAS', {
      recipientCommitment: reservation?.recipientCommitment ?? 'anonymous-recipient',
      generatedAt: simulation.generatedAt,
    }, { length: 12 }),
    pickupConditions,
    publicSubjectRef: stableId('PUDO-SUBJECT', {
      reservationId: reservation?.reservationId ?? 'counter',
      generatedAt: simulation.generatedAt,
    }, { length: 12 }),
    receiptPolicy: 'receipt-and-commitment-only',
    qrStored: false,
    nfcStored: false,
    qrPayloadStored: false,
    nfcPayloadStored: false,
    pinStored: false,
  };
}

function buildFieldFlow(
  simulation: WarehouseLockerLocalSimulation,
  counter: OpenLockerPudoCounterState,
  safeIntake: OpenLockerPudoSafeIntake,
): OpenLockerPudoFieldFlowStep[] {
  const assignment = simulation.lockerSnapshot.reservationPlan.assignments.find(item => item.status === 'assigned');
  const firstAccess = simulation.lockerSnapshot.accessDecisions[0];
  const accessAccepted = simulation.lockerSnapshot.accessDecisions.some(decision => decision.status === 'accepted');
  const accessRejected = simulation.lockerSnapshot.accessDecisions.some(decision => decision.status === 'rejected');
  const receipt = counter.counterReceipts.find(item => item.purpose === 'pickup') ?? counter.counterReceipts[0];
  const selectionStatus: OpenLockerPudoTimelineStatus = assignment?.compartmentId ? 'completed' : 'attention';
  const unlockStatus: OpenLockerPudoTimelineStatus = accessRejected
    ? 'blocked'
    : accessAccepted
      ? 'completed'
      : selectionStatus === 'attention'
        ? 'attention'
        : 'pending';
  const receiptStatus: OpenLockerPudoTimelineStatus = receipt
    ? simulation.state.offlineQueue > 0
      ? 'attention'
      : unlockStatus === 'blocked'
        ? 'blocked'
        : 'completed'
    : 'pending';

  return [
    {
      stage: 'read',
      label: 'QR/NFC read',
      actor: firstAccess?.actor ?? 'recipient',
      status: firstAccess ? 'completed' : 'pending',
      publicRef: `read:${safeIntake.publicSubjectRef}`,
      detail: 'Use scanner result only as a proof commitment, then discard the presented secret.',
    },
    {
      stage: 'select-locker',
      label: 'Locker selection',
      actor: 'system',
      status: selectionStatus,
      publicRef: `locker:${assignment?.compartmentId ?? 'counter-review'}`,
      detail: assignment?.compartmentId
        ? 'Compatible locker is selected by size, handling, reader health, and capacity.'
        : 'No compatible locker is selected; keep the parcel at the counter review lane.',
    },
    {
      stage: 'unlock-decision',
      label: 'Unlock decision',
      actor: firstAccess?.actor === 'operator' ? 'operator' : 'system',
      status: unlockStatus,
      publicRef: `decision:${firstAccess?.decisionId ?? counter.staffAction}`,
      detail: accessAccepted
        ? 'Unlock is allowed and the visible result is a decision code, not an address.'
        : accessRejected
          ? 'Unlock is blocked; show a reason code and keep manual review available.'
          : 'Unlock is waiting for proof, compatible hardware, or operator review.',
    },
    {
      stage: 'receipt',
      label: 'Receipt',
      actor: simulation.state.offlineQueue > 0 ? 'operator' : 'system',
      status: receiptStatus,
      publicRef: `receipt:${receipt?.receiptId ?? 'pending'}`,
      detail: simulation.state.offlineQueue > 0
        ? 'Create a local receipt and sync later without storing presented secrets.'
        : 'Create a receipt commitment for the alias and selected handoff condition.',
    },
  ];
}

function eventLog(simulation: WarehouseLockerLocalSimulation): OpenLockerPudoRedactedEvent[] {
  const reservationEvents = simulation.lockerSnapshot.reservationPlan.assignments.map(assignment => ({
    eventId: stableId('LPD-EVT', assignment, { length: 12 }),
    kind: 'reservation' as const,
    status: assignment.status,
    at: simulation.generatedAt,
    actor: 'system' as const,
    targetAlias: assignment.compartmentId || assignment.reason || assignment.reservationId,
    evidenceCommitment: commitment('event:reservation', assignment),
    auditHash: hashStable(assignment).slice(0, 32),
    warnings: assignment.reason ? [assignment.reason] : [],
  }));

  const accessEvents = simulation.lockerSnapshot.accessDecisions.map(decision => ({
    eventId: stableId('LPD-EVT', decision, { length: 12 }),
    kind: 'access' as const,
    status: decision.status,
    at: decision.at,
    actor: decision.actor,
    targetAlias: decision.compartmentId,
    evidenceCommitment: commitment('event:access', {
      decisionId: decision.decisionId,
      status: decision.status,
      reason: decision.reason,
    }),
    auditHash: decision.auditHash.slice(0, 32),
    warnings: decision.status === 'accepted' ? [] : [decision.reason],
  }));

  const protocolEvents = simulation.frames.slice(-6).map(frame => ({
    eventId: stableId('LPD-EVT', frame.frameId, { length: 12 }),
    kind: frame.status === 'queued-offline' ? 'offline-sync' as const : 'protocol-frame' as const,
    status: frame.status,
    at: frame.at,
    actor: 'system' as const,
    targetAlias: frame.targetId || frame.connectorId || frame.protocol,
    evidenceCommitment: frame.payloadCommitment,
    auditHash: frame.auditHash,
    warnings: frame.warnings,
  }));

  return [...reservationEvents, ...accessEvents, ...protocolEvents];
}

function operatorActions(
  simulation: WarehouseLockerLocalSimulation,
  counter: OpenLockerPudoCounterState,
): string[] {
  const actions = new Set<string>();
  actions.add('scan-qr');
  actions.add('tap-nfc');
  actions.add('reserve-compartment');
  if (counter.staffAction === 'release-parcel') actions.add('open-door');
  if (counter.staffAction === 'manual-counter-handoff') actions.add('manual-counter-handoff');
  if (counter.staffAction === 'disable-reader') actions.add('disable-reader');
  if (counter.staffAction === 'sync-later') actions.add('sync-later');
  if (counter.manualHandoffCount > 0 || simulation.status !== 'ready') actions.add('mark-review');
  actions.add('print-receipt');
  return [...actions];
}

function summary(
  scenario: OpenLockerPudoScenario,
  status: OpenLockerPudoStatus,
  counter: OpenLockerPudoCounterState,
): OpenLockerPudoSimulation['summary'] {
  if (status === 'blocked') {
    return {
      headline: 'Operator review required before release',
      decision: 'reject',
      nextAction: counter.staffAction,
    };
  }
  if (status === 'attention') {
    return {
      headline: scenario === 'offline-sync'
        ? 'Accept locally and sync when the network returns'
        : 'Proceed with operator attention',
      decision: 'review',
      nextAction: counter.staffAction,
    };
  }
  return {
    headline: 'Locker/PUDO handoff can proceed',
    decision: 'accept',
    nextAction: counter.staffAction,
  };
}

export function listOpenLockerPudoSimulatorCapabilities() {
  const locker = listLockerSystemCapabilities();
  const local = listWarehouseLockerLocalSimulatorCapabilities();
  return {
    modelVersion: OPEN_LOCKER_PUDO_SIMULATOR_VERSION,
    scenarios: OPEN_LOCKER_PUDO_SCENARIOS,
    siteKinds: ['locker-bank', 'pudo-counter', 'hybrid'] as const,
    accessMethods: locker.accessMethods,
    protocols: local.protocols,
    simulatedSurfaces: [
      'locker-reservation',
      'pudo-counter-handoff',
      'qr-reader',
      'nfc-reader',
      'offline-sync',
      'mqtt-http-modbus-local-traffic',
      'redacted-operator-receipt',
    ],
    mode: 'local-only' as const,
    privacy: PRIVACY_BOUNDARY,
  };
}

export function buildOpenLockerPudoSimulation(input: OpenLockerPudoSimulatorInput = {}): OpenLockerPudoSimulation {
  const scenario = cleanScenario(input.scenario);
  const generatedAt = toIsoTimestamp(input.generatedAt, '2026-06-20T09:00:00.000Z');
  const defaults = scenarioInput(scenario, generatedAt);
  const siteKind = cleanSiteKind(input.siteKind, scenario);
  const localProtocol = buildWarehouseLockerLocalSimulation({
    generatedAt,
    site: input.site ?? defaults.site,
    reservations: input.reservations ?? defaults.reservations,
    accessAttempts: input.accessAttempts ?? defaults.accessAttempts,
    devices: input.devices ?? defaults.devices,
    script: input.script ?? defaults.script,
  });
  const pudoCounter = counterState(localProtocol, scenario);
  const rejectedAccess = localProtocol.lockerSnapshot.accessDecisions.some(decision => decision.status === 'rejected');
  const status: OpenLockerPudoStatus = localProtocol.status === 'blocked' || rejectedAccess
    ? 'blocked'
    : localProtocol.status === 'attention' || pudoCounter.manualHandoffCount > 0
      ? 'attention'
      : 'ready';
  const warnings = [
    ...localProtocol.warnings,
    ...(pudoCounter.manualHandoffCount ? ['pudo-manual-handoff-or-review-required'] : []),
    ...(scenario === 'high-risk' ? ['high-risk-mode-short-ttl-and-strong-proof-required'] : []),
  ];
  const pudoSafeIntake = buildPudoSafeIntake(localProtocol);

  return {
    modelVersion: OPEN_LOCKER_PUDO_SIMULATOR_VERSION,
    generatedAt,
    scenario,
    siteKind,
    mode: 'local-only',
    status,
    summary: summary(scenario, status, pudoCounter),
    lockerSnapshot: localProtocol.lockerSnapshot,
    localProtocol,
    pudoCounter,
    fieldFlow: buildFieldFlow(localProtocol, pudoCounter, pudoSafeIntake),
    lockerStatusLegend: LOCKER_STATUS_LEGEND,
    lockerStatusBoard: buildLockerStatusBoard(localProtocol),
    pudoSafeIntake,
    timeline: buildTimeline(localProtocol, generatedAt),
    operatorActions: operatorActions(localProtocol, pudoCounter),
    eventLog: eventLog(localProtocol),
    warnings: [...new Set(warnings)],
    privacy: PRIVACY_BOUNDARY,
  };
}
