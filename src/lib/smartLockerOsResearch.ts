import { listLockerSystemCapabilities } from './lockerSystemOs';

export const SMART_LOCKER_OS_RESEARCH_VERSION = 'agid-smart-locker-os-research-v1';

export type SmartLockerResearchMaturity =
  | 'implemented'
  | 'simulated'
  | 'adapter-ready'
  | 'research-needed'
  | 'out-of-scope';

export type SmartLockerOsPillarId =
  | 'endpoint-identity'
  | 'hardware-abstraction'
  | 'reservation-inventory'
  | 'access-control'
  | 'device-management'
  | 'sensor-observability'
  | 'offline-sync'
  | 'privacy-security'
  | 'operator-ux'
  | 'integration-apis'
  | 'compliance-governance';

export type SmartLockerOsReference = {
  id: string;
  name: string;
  sourceUrl: string;
  appliesTo: SmartLockerOsPillarId[];
  agidFit: string;
  currentMaturity: SmartLockerResearchMaturity;
  recommendation: 'adopt' | 'adapter' | 'study' | 'avoid';
  reason: string;
};

export type SmartLockerOsFinding = {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  pillar: SmartLockerOsPillarId;
  title: string;
  finding: string;
  recommendation: string;
  validationGate: string;
};

export type SmartLockerOsRoadmapPhase = {
  id: string;
  label: string;
  scope: string[];
  exitCriteria: string[];
};

export type SmartLockerOsResearchEvaluation = {
  version: string;
  implementedOrSimulatedReferences: number;
  researchNeededReferences: number;
  productionReady: boolean;
  productionBlockers: string[];
  nextActions: string[];
};

export const SMART_LOCKER_OS_REFERENCES: SmartLockerOsReference[] = [
  {
    id: 'mqtt',
    name: 'MQTT',
    sourceUrl: 'https://mqtt.org/',
    appliesTo: ['hardware-abstraction', 'sensor-observability', 'offline-sync'],
    agidFit: 'Low-bandwidth publish/subscribe channel for locker sensors, command acknowledgements, and offline-friendly telemetry.',
    currentMaturity: 'simulated',
    recommendation: 'adapter',
    reason: 'Existing simulator already emits MQTT-shaped frames; production needs a broker adapter, topic ACLs, TLS, QoS policy, retained-message controls, and idempotency.',
  },
  {
    id: 'http',
    name: 'HTTP device callbacks',
    sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP',
    appliesTo: ['hardware-abstraction', 'integration-apis'],
    agidFit: 'Simple integration path for lockers that expose local gateway webhooks or REST callbacks.',
    currentMaturity: 'simulated',
    recommendation: 'adapter',
    reason: 'Existing simulator emits HTTP-shaped frames; production needs signed callbacks, retry semantics, replay protection, and local-network allowlists.',
  },
  {
    id: 'modbus',
    name: 'Modbus via libmodbus-style adapters',
    sourceUrl: 'https://libmodbus.org/',
    appliesTo: ['hardware-abstraction', 'sensor-observability'],
    agidFit: 'Industrial gateway path for relay boards, door sensors, temperature sensors, and legacy locker controllers.',
    currentMaturity: 'simulated',
    recommendation: 'adapter',
    reason: 'Existing simulator maps locker actions to Modbus-like registers; production must isolate serial/TCP gateways and never expose raw register writes from the UI.',
  },
  {
    id: 'osdp',
    name: 'SIA Open Supervised Device Protocol',
    sourceUrl: 'https://www.securityindustry.org/industry-standards/open-supervised-device-protocol/',
    appliesTo: ['access-control', 'privacy-security', 'hardware-abstraction'],
    agidFit: 'Candidate standard for card/NFC/reader-controller access control around lockers and secured pickup rooms.',
    currentMaturity: 'research-needed',
    recommendation: 'study',
    reason: 'Useful for secure access readers, but should be a certified adapter boundary rather than a hand-rolled reader protocol.',
  },
  {
    id: 'lwm2m',
    name: 'OMA Lightweight M2M',
    sourceUrl: 'https://www.openmobilealliance.org/release/LightweightM2M/',
    appliesTo: ['device-management', 'sensor-observability', 'compliance-governance'],
    agidFit: 'Good model for provisioning, firmware update, diagnostics, connectivity, and constrained-device lifecycle management.',
    currentMaturity: 'research-needed',
    recommendation: 'study',
    reason: 'AGID currently models health snapshots, but production locker fleets need signed firmware/update windows, diagnostics, and device lifecycle APIs.',
  },
  {
    id: 'ogc-sensorthings',
    name: 'OGC SensorThings API',
    sourceUrl: 'https://docs.ogc.org/is/18-088/18-088.html',
    appliesTo: ['sensor-observability', 'integration-apis', 'compliance-governance'],
    agidFit: 'Geospatial IoT observation model for temperature, door, battery, location, and historical locker state.',
    currentMaturity: 'research-needed',
    recommendation: 'study',
    reason: 'A royalty-free geospatial IoT standard can make locker state interoperable with GIS without exposing private recipient or address data.',
  },
  {
    id: 'eclipse-ditto',
    name: 'Eclipse Ditto digital twin pattern',
    sourceUrl: 'https://projects.eclipse.org/projects/iot.ditto',
    appliesTo: ['device-management', 'sensor-observability', 'integration-apis'],
    agidFit: 'Useful pattern for reported/desired/live locker state, search over device metadata, and permissioned device APIs.',
    currentMaturity: 'research-needed',
    recommendation: 'study',
    reason: 'AGID should not require Ditto, but its digital-twin separation is the right mental model for locker desired state versus physical state.',
  },
  {
    id: 'openremote',
    name: 'OpenRemote-style open IoT manager',
    sourceUrl: 'https://openremote.io/',
    appliesTo: ['device-management', 'operator-ux', 'integration-apis'],
    agidFit: 'Reference for open-source asset management, dashboards, rules, maps, and multi-protocol IoT operations.',
    currentMaturity: 'research-needed',
    recommendation: 'study',
    reason: 'Worth studying as an integration layer, but AGID should keep its privacy and address-proof model independent from any one IoT platform.',
  },
] as const;

export const SMART_LOCKER_OS_FINDINGS: SmartLockerOsFinding[] = [
  {
    id: 'not-a-device-os',
    severity: 'critical',
    pillar: 'compliance-governance',
    title: 'Do not claim to be the embedded locker operating system yet',
    finding: 'The current code is a safe orchestration, reservation, access-decision, and simulation layer. It does not boot hardware, own firmware, or certify physical safety.',
    recommendation: 'Call it Smart Locker Operations OS or Locker Endpoint OS until hardware adapters, firmware update, device attestation, and vendor conformance are implemented.',
    validationGate: 'docs and UI must state no direct hardware control, no raw register writes, and no safety-certified unlock claim.',
  },
  {
    id: 'privacy-boundary-good',
    severity: 'high',
    pillar: 'privacy-security',
    title: 'Privacy boundary is stronger than typical locker software',
    finding: 'The existing locker model rejects raw address, raw AGID/AOID, raw waybill, PIN, QR, NFC, biometric template, and hardware secrets.',
    recommendation: 'Keep this as a mandatory no-raw-address release gate and mirror it in simulator, POS, Field Handoff, Dashboard, and Review Console exports.',
    validationGate: 'no-raw-address tests must cover reservation, access attempt, simulator frames, reports, and exported receipts.',
  },
  {
    id: 'access-control-standard-gap',
    severity: 'high',
    pillar: 'access-control',
    title: 'Access reader integration needs a standard boundary',
    finding: 'QR/NFC/passkey/AOID credential are modeled, but physical reader-controller integration is not standardized.',
    recommendation: 'Research OSDP as an adapter for readers and secured pickup rooms. Do not implement custom reader crypto in the app layer.',
    validationGate: 'adapter design must keep raw card/NFC/PIN material outside AGID and only pass proof commitments or signed reader receipts.',
  },
  {
    id: 'device-lifecycle-gap',
    severity: 'high',
    pillar: 'device-management',
    title: 'Fleet lifecycle is missing',
    finding: 'Health snapshots exist, but production fleets need provisioning, deprovisioning, firmware update windows, configuration drift detection, and diagnostics.',
    recommendation: 'Study LwM2M-style lifecycle concepts and add a device twin contract before real hardware pilots.',
    validationGate: 'every device must have identity, firmware ref, config version, update state, and decommission state.',
  },
  {
    id: 'digital-twin-gap',
    severity: 'medium',
    pillar: 'sensor-observability',
    title: 'Reported state and desired state should be separated',
    finding: 'The simulator has current frames and snapshots, but production needs explicit desired, reported, and live perspectives.',
    recommendation: 'Adopt a Ditto-like state model without importing a hard dependency: desired command, reported sensor state, live operator session.',
    validationGate: 'command dispatch must never assume desired state equals physical state until an acknowledged sensor/reader receipt arrives.',
  },
  {
    id: 'geospatial-iot-gap',
    severity: 'medium',
    pillar: 'sensor-observability',
    title: 'Locker observations need geospatial semantics',
    finding: 'Locker sites have AGID and coordinates, but temperature, door, battery, access, and fault observations are not modeled as portable geospatial IoT observations.',
    recommendation: 'Study OGC SensorThings for optional exports where a city, carrier, or campus wants interoperable geospatial IoT data.',
    validationGate: 'Sensor export must redact recipient/address fields and publish only site/device observation data.',
  },
  {
    id: 'local-first-strength',
    severity: 'medium',
    pillar: 'offline-sync',
    title: 'Local-first simulation is the right first milestone',
    finding: 'The existing simulator avoids live brokers, ports, and hardware secrets while letting POS and field flows rehearse ACK, offline, and jam scenarios.',
    recommendation: 'Keep local simulator as Phase 0 and add deterministic fixtures for door jam, low ACK, stale heartbeat, offline queue, and duplicate events.',
    validationGate: 'hardware adapter tests must pass the same simulator fixtures before reaching real devices.',
  },
  {
    id: 'operator-ux-gap',
    severity: 'medium',
    pillar: 'operator-ux',
    title: 'Operator actions need state-machine clarity',
    finding: 'Locker assignment, access, and health are modeled, but a real locker operator needs stable buttons: reserve, disable, open with proof, release, quarantine, sync, report.',
    recommendation: 'Use POS-style Scan -> Decision -> Handoff -> Report, plus Locker-specific Device -> Reservation -> Access -> Maintenance.',
    validationGate: 'a rejected or review state must not expose open/release buttons without scoped override receipt.',
  },
] as const;

export const SMART_LOCKER_OS_ROADMAP: SmartLockerOsRoadmapPhase[] = [
  {
    id: 'phase-0-local-simulator',
    label: 'Local simulator and redacted OS contract',
    scope: ['MQTT/HTTP/Modbus-shaped frames', 'reservation planning', 'committed access proofs', 'health snapshot', 'redacted receipts'],
    exitCriteria: ['all simulator frames contain commitments', 'no raw address/proof payload leaves the boundary', 'offline and duplicate events become reviewable receipts'],
  },
  {
    id: 'phase-1-device-twin',
    label: 'Device twin and lifecycle model',
    scope: ['desired/reported/live state', 'device identity', 'firmware ref', 'configuration version', 'provision/deprovision states'],
    exitCriteria: ['desired state never implies door-open success', 'firmware/update state is auditable', 'unknown devices cannot claim trusted status'],
  },
  {
    id: 'phase-2-certified-adapters',
    label: 'Protocol adapters behind safety boundaries',
    scope: ['MQTT broker adapter', 'local HTTP gateway adapter', 'Modbus gateway adapter', 'OSDP reader study adapter'],
    exitCriteria: ['adapters pass simulator parity', 'all callbacks are signed or commitment-only', 'raw register writes and raw credential payloads are blocked'],
  },
  {
    id: 'phase-3-field-pilot',
    label: 'Pilot with carrier/PUDO/humanitarian operating model',
    scope: ['operator console', 'maintenance queue', 'offline sync', 'review console integration', 'incident report export'],
    exitCriteria: ['jammed door, expired hold, recipient proof failure, stale heartbeat, and offline duplicate are all handled without raw address disclosure'],
  },
];

export function listSmartLockerOsReferences(): SmartLockerOsReference[] {
  return SMART_LOCKER_OS_REFERENCES.map(reference => ({ ...reference, appliesTo: [...reference.appliesTo] }));
}

export function listSmartLockerOsFindings(): SmartLockerOsFinding[] {
  return SMART_LOCKER_OS_FINDINGS.map(finding => ({ ...finding }));
}

export function listSmartLockerOsRoadmap(): SmartLockerOsRoadmapPhase[] {
  return SMART_LOCKER_OS_ROADMAP.map(phase => ({
    ...phase,
    scope: [...phase.scope],
    exitCriteria: [...phase.exitCriteria],
  }));
}

export function evaluateSmartLockerOsResearch(): SmartLockerOsResearchEvaluation {
  const references = listSmartLockerOsReferences();
  const lockerCapabilities = listLockerSystemCapabilities();
  const productionBlockers: string[] = [];

  for (const protocol of ['mqtt', 'http', 'modbus'] as const) {
    if (!lockerCapabilities.connectorProtocols.includes(protocol)) {
      productionBlockers.push(`missing-simulator-protocol:${protocol}`);
    }
  }

  if (lockerCapabilities.privacy.rawAddressStored) productionBlockers.push('raw-address-storage-enabled');
  if (lockerCapabilities.privacy.rawPinStored) productionBlockers.push('raw-pin-storage-enabled');
  if (lockerCapabilities.privacy.rawNfcPayloadStored) productionBlockers.push('raw-nfc-payload-storage-enabled');
  if (lockerCapabilities.privacy.biometricTemplateStored) productionBlockers.push('biometric-template-storage-enabled');

  for (const required of ['osdp', 'lwm2m', 'ogc-sensorthings', 'eclipse-ditto']) {
    const reference = references.find(item => item.id === required);
    if (!reference || reference.currentMaturity === 'implemented' || reference.currentMaturity === 'simulated') continue;
    productionBlockers.push(`research-needed:${required}`);
  }

  productionBlockers.push('real-hardware-adapter-conformance-not-run');
  productionBlockers.push('firmware-update-and-device-attestation-not-modeled');
  productionBlockers.push('physical-safety-certification-not-claimed');

  return {
    version: SMART_LOCKER_OS_RESEARCH_VERSION,
    implementedOrSimulatedReferences: references.filter(reference =>
      reference.currentMaturity === 'implemented' || reference.currentMaturity === 'simulated').length,
    researchNeededReferences: references.filter(reference => reference.currentMaturity === 'research-needed').length,
    productionReady: false,
    productionBlockers: Array.from(new Set(productionBlockers)),
    nextActions: [
      'Keep current Locker System OS as a redacted orchestration layer, not an embedded hardware OS.',
      'Add a device-twin contract with desired, reported, and live state.',
      'Define certified adapter boundaries for MQTT, HTTP, Modbus, and OSDP-style access readers.',
      'Add LwM2M-inspired device lifecycle fields before any field hardware pilot.',
      'Use OGC SensorThings only for redacted site/device observations, never recipient data.',
    ],
  };
}

export function renderSmartLockerOsArchitectureMermaid(): string {
  return [
    'flowchart LR',
    '  POS["POS / Field Handoff"] --> Contract["Redacted Locker OS Contract"]',
    '  Contract --> Twin["Device Twin: desired / reported / live"]',
    '  Twin --> Sim["Local MQTT / HTTP / Modbus Simulator"]',
    '  Sim --> Adapters["Certified Protocol Adapters"]',
    '  Adapters --> Locker["Locker Controller / Reader / Sensors"]',
    '  Locker --> Receipt["Signed Redacted Receipt"]',
    '  Receipt --> Review["Dashboard / Review Console"]',
    '  Contract -. no raw address .-> Privacy["Privacy Boundary"]',
  ].join('\n');
}

export function validateSmartLockerOsResearch(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const referenceIds = new Set(SMART_LOCKER_OS_REFERENCES.map(reference => reference.id));
  for (const required of ['mqtt', 'http', 'modbus', 'osdp', 'lwm2m', 'ogc-sensorthings', 'eclipse-ditto', 'openremote']) {
    if (!referenceIds.has(required)) errors.push(`missing-reference:${required}`);
  }
  if (!SMART_LOCKER_OS_FINDINGS.some(finding => finding.id === 'not-a-device-os')) errors.push('missing-boundary-finding:not-a-device-os');
  if (!SMART_LOCKER_OS_FINDINGS.some(finding => finding.validationGate.includes('no-raw-address'))) errors.push('missing-no-raw-address-gate');
  if (SMART_LOCKER_OS_ROADMAP[0]?.id !== 'phase-0-local-simulator') errors.push('roadmap-must-start-with-local-simulator');
  const evaluation = evaluateSmartLockerOsResearch();
  if (evaluation.productionReady) errors.push('research-must-not-claim-production-ready');
  if (!evaluation.productionBlockers.includes('physical-safety-certification-not-claimed')) errors.push('missing-safety-certification-blocker');
  return { valid: errors.length === 0, errors };
}
