export const TRANSPORT_MODE_REQUIREMENTS_VERSION = 'transport-mode-requirements-v1';

export const TRANSPORT_MODES = ['land', 'sea', 'air'] as const;

export type TransportMode = typeof TRANSPORT_MODES[number];

export type TransportRequirementStatus = 'complete' | 'missing' | 'review';

export type TransportModeFeature =
  | 'ecmr-consignment-note'
  | 'driver-vehicle-trust'
  | 'proof-of-delivery'
  | 'pos-handoff'
  | 'recipient-proof'
  | 'offline-sync'
  | 'booking'
  | 'bill-of-lading'
  | 'container'
  | 'vessel-voyage'
  | 'port-terminal'
  | 'terminal-hold'
  | 'customs'
  | 'final-mile-handoff'
  | 'awb-eawb'
  | 'flight-leg'
  | 'cutoff'
  | 'aviation-security'
  | 'dangerous-goods'
  | 'temperature-control'
  | 'iata-one-record-compatibility';

export type TransportDocumentProfile =
  | 'ecmr'
  | 'pod-receipt'
  | 'bill-of-lading'
  | 'container-seal'
  | 'booking-confirmation'
  | 'customs-declaration'
  | 'air-waybill'
  | 'security-screening'
  | 'dangerous-goods-declaration'
  | 'temperature-log'
  | 'iata-one-record';

export type TransportEvidenceType =
  | 'address-verification'
  | 'carrier-acceptance'
  | 'driver-device-signature'
  | 'vehicle-assignment'
  | 'recipient-proof'
  | 'pod'
  | 'offline-sync-receipt'
  | 'booking-confirmed'
  | 'bill-of-lading-accepted'
  | 'container-validated'
  | 'vessel-voyage-confirmed'
  | 'port-terminal-event'
  | 'terminal-hold-review'
  | 'customs-release'
  | 'final-mile-created'
  | 'awb-accepted'
  | 'flight-leg-confirmed'
  | 'cutoff-validated'
  | 'security-screened'
  | 'dangerous-goods-cleared'
  | 'temperature-chain-ok'
  | 'one-record-compatible';

export type TransportModeProfile = {
  version: typeof TRANSPORT_MODE_REQUIREMENTS_VERSION;
  mode: TransportMode;
  label: string;
  role: string;
  requiredFeatures: TransportModeFeature[];
  requiredDocuments: TransportDocumentProfile[];
  requiredEvidence: TransportEvidenceType[];
  stateFlow: string[];
  exceptionStates: string[];
  integrationTargets: string[];
  publicFields: string[];
  closedFields: string[];
  nextImplementationSlice: string;
};

export type TransportRequirementEvidenceInput = {
  type: TransportEvidenceType | string;
  status?: TransportRequirementStatus | 'passed' | 'ok' | 'failed' | 'warning' | 'pending';
  signed?: boolean;
};

export type TransportRequirementChecklistInput = {
  mode: TransportMode | string;
  features?: (TransportModeFeature | string)[];
  documents?: (TransportDocumentProfile | string)[];
  evidence?: TransportRequirementEvidenceInput[];
  highRiskMode?: boolean;
  offlineExpected?: boolean;
  customsExpected?: boolean;
  temperatureControlled?: boolean;
  dangerousGoods?: boolean;
};

export type TransportRequirementChecklistItem = {
  key: TransportModeFeature | TransportDocumentProfile | TransportEvidenceType;
  kind: 'feature' | 'document' | 'evidence';
  status: TransportRequirementStatus;
  required: boolean;
};

export type TransportRequirementChecklist = {
  version: typeof TRANSPORT_MODE_REQUIREMENTS_VERSION;
  mode: TransportMode;
  status: 'ready' | 'requires-input' | 'requires-review';
  nextAction:
    | 'collect-land-consignment-and-handoff-evidence'
    | 'collect-ocean-booking-and-document-evidence'
    | 'collect-air-waybill-security-and-cutoff-evidence'
    | 'manual-review'
    | 'none';
  items: TransportRequirementChecklistItem[];
  blockers: string[];
  warnings: string[];
  privacy: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    rawShipmentDocumentStored: false;
    rawRecipientProofStored: false;
    publicSurface: 'mode-state-checklist-commitments-and-next-action-only';
  };
};

const LAND_PROFILE: TransportModeProfile = {
  version: TRANSPORT_MODE_REQUIREMENTS_VERSION,
  mode: 'land',
  label: 'Land transport',
  role: 'Final-mile, warehouse, road, rail, POS pickup, PUDO, locker, and humanitarian field handoff.',
  requiredFeatures: [
    'ecmr-consignment-note',
    'driver-vehicle-trust',
    'proof-of-delivery',
    'pos-handoff',
    'recipient-proof',
    'offline-sync',
  ],
  requiredDocuments: ['ecmr', 'pod-receipt'],
  requiredEvidence: [
    'address-verification',
    'carrier-acceptance',
    'driver-device-signature',
    'vehicle-assignment',
    'recipient-proof',
    'pod',
    'offline-sync-receipt',
  ],
  stateFlow: [
    'requires-address',
    'requires-consignment-note',
    'requires-driver-vehicle',
    'requires-pos-handoff',
    'recipient-proof-pending',
    'pod-pending',
    'completed',
  ],
  exceptionStates: [
    'road-closed',
    'access-blocked',
    'building-entry-failed',
    'recipient-unavailable',
    'offline-sync-conflict',
  ],
  integrationTargets: [
    'carrierLabelIntent',
    'deliveryOperationsIntelligence',
    'operations',
    'deliveryReachabilityReport',
    'posOfflineUsageLedger',
  ],
  publicFields: ['mode', 'status', 'nextAction', 'carrierAlias', 'vehicleClass', 'handoffState', 'proofLevel'],
  closedFields: ['rawAddress', 'preciseAgid', 'aoid', 'recipientIdentity', 'proofCode', 'driverPrivateIdentity'],
  nextImplementationSlice: 'Extend CarrierLabelIntent and POS handoff screens with land consignment, driver/device signature, POD, and offline ledger status.',
};

const SEA_PROFILE: TransportModeProfile = {
  version: TRANSPORT_MODE_REQUIREMENTS_VERSION,
  mode: 'sea',
  label: 'Sea transport',
  role: 'Ocean freight, container movement, port/terminal control tower, customs hold, and final-mile handoff.',
  requiredFeatures: [
    'booking',
    'bill-of-lading',
    'container',
    'vessel-voyage',
    'port-terminal',
    'terminal-hold',
    'customs',
    'final-mile-handoff',
  ],
  requiredDocuments: [
    'booking-confirmation',
    'bill-of-lading',
    'container-seal',
    'customs-declaration',
  ],
  requiredEvidence: [
    'booking-confirmed',
    'bill-of-lading-accepted',
    'container-validated',
    'vessel-voyage-confirmed',
    'port-terminal-event',
    'terminal-hold-review',
    'customs-release',
    'final-mile-created',
  ],
  stateFlow: [
    'requires-schedule',
    'requires-booking',
    'docs-required',
    'waiting-departure',
    'in-transit',
    'terminal-or-customs-review',
    'pickup-ready',
    'final-mile-required',
    'completed',
  ],
  exceptionStates: [
    'customs-hold',
    'terminal-hold',
    'port-hold',
    'document-rejected',
    'rollover',
    'transshipment-delayed',
  ],
  integrationTargets: [
    'coscoInspiredOceanControlTower',
    'deliveryReachabilityReport',
    'carrierLabelIntent',
    'tradeComplianceDataPlan',
    'crossBorderAuxiliaryData',
  ],
  publicFields: ['mode', 'status', 'nextAction', 'coarsePort', 'documentSummary', 'containerSummary', 'holdType'],
  closedFields: ['rawBookingNumber', 'rawBillOfLading', 'rawContainerNumber', 'sealNumber', 'preciseAgid', 'shipperConsigneeIdentity'],
  nextImplementationSlice: 'Extend Ocean Control Tower with B/L, booking, container, port-terminal hold, customs release, and final-mile intent creation.',
};

const AIR_PROFILE: TransportModeProfile = {
  version: TRANSPORT_MODE_REQUIREMENTS_VERSION,
  mode: 'air',
  label: 'Air transport',
  role: 'Air cargo, express shipments, time-critical freight, regulated cargo, temperature chain, and airport-to-final-mile handoff.',
  requiredFeatures: [
    'awb-eawb',
    'flight-leg',
    'cutoff',
    'aviation-security',
    'dangerous-goods',
    'temperature-control',
    'iata-one-record-compatibility',
  ],
  requiredDocuments: [
    'air-waybill',
    'security-screening',
    'dangerous-goods-declaration',
    'temperature-log',
    'iata-one-record',
    'customs-declaration',
  ],
  requiredEvidence: [
    'awb-accepted',
    'flight-leg-confirmed',
    'cutoff-validated',
    'security-screened',
    'dangerous-goods-cleared',
    'temperature-chain-ok',
    'one-record-compatible',
    'customs-release',
    'final-mile-created',
  ],
  stateFlow: [
    'requires-awb',
    'requires-security-screening',
    'requires-dangerous-goods-check',
    'requires-cutoff-validation',
    'accepted-by-airline',
    'loaded',
    'departed',
    'arrived',
    'customs-release',
    'final-mile-required',
    'completed',
  ],
  exceptionStates: [
    'cutoff-missed',
    'security-hold',
    'dangerous-goods-rejected',
    'temperature-excursion',
    'flight-disrupted',
    'customs-hold',
  ],
  integrationTargets: [
    'transportModeRequirements',
    'tradeComplianceDataPlan',
    'deliveryReachabilityReport',
    'carrierLabelIntent',
    'addressRadar',
  ],
  publicFields: ['mode', 'status', 'nextAction', 'airportPair', 'cutoffState', 'screeningState', 'temperatureState'],
  closedFields: ['rawAirWaybill', 'rawFlightNumberWhenSensitive', 'shipperConsigneeIdentity', 'preciseAgid', 'cargoSecurityDetails', 'temperatureSensorRawStream'],
  nextImplementationSlice: 'Add an Air Cargo adapter with AWB/e-AWB, flight leg, cut-off, security, DG, temperature, and ONE Record-compatible projection.',
};

const PROFILES: Record<TransportMode, TransportModeProfile> = {
  land: LAND_PROFILE,
  sea: SEA_PROFILE,
  air: AIR_PROFILE,
};

function normalizeMode(value: unknown): TransportMode {
  const text = String(value ?? '').trim().toLowerCase().replace(/_/g, '-');
  if (text === 'road' || text === 'rail' || text === 'truck' || text === 'last-mile') return 'land';
  if (text === 'ocean' || text === 'maritime' || text === 'ship') return 'sea';
  if (text === 'air-cargo' || text === 'airfreight' || text === 'airport') return 'air';
  if ((TRANSPORT_MODES as readonly string[]).includes(text)) return text as TransportMode;
  return 'land';
}

function normalizeStatus(value: unknown): TransportRequirementStatus {
  const text = String(value ?? '').trim().toLowerCase();
  if (text === 'complete' || text === 'passed' || text === 'ok') return 'complete';
  if (text === 'review' || text === 'warning' || text === 'pending') return 'review';
  return 'missing';
}

function hasValue(values: readonly string[] | undefined, key: string) {
  return Boolean(values?.map(value => String(value).trim().toLowerCase()).includes(key));
}

function evidenceStatus(
  evidence: readonly TransportRequirementEvidenceInput[] | undefined,
  type: TransportEvidenceType,
): TransportRequirementStatus {
  const match = evidence?.find(item => String(item.type).trim().toLowerCase() === type);
  if (!match) return 'missing';
  const status = normalizeStatus(match.status);
  if (status !== 'complete') return status;
  if (
    [
      'driver-device-signature',
      'pod',
      'port-terminal-event',
      'customs-release',
      'awb-accepted',
      'security-screened',
    ].includes(type)
    && !match.signed
  ) {
    return 'review';
  }
  return 'complete';
}

function optionalEvidenceForInput(input: TransportRequirementChecklistInput): TransportEvidenceType[] {
  const optional: TransportEvidenceType[] = [];
  if (input.customsExpected) optional.push('customs-release');
  if (input.temperatureControlled) optional.push('temperature-chain-ok');
  if (input.dangerousGoods) optional.push('dangerous-goods-cleared');
  if (input.offlineExpected) optional.push('offline-sync-receipt');
  return optional;
}

function nextActionFor(mode: TransportMode, blockers: readonly string[], warnings: readonly string[]) {
  if (warnings.length > 0 && blockers.length === 0) return 'manual-review';
  if (blockers.length === 0) return 'none';
  if (mode === 'sea') return 'collect-ocean-booking-and-document-evidence';
  if (mode === 'air') return 'collect-air-waybill-security-and-cutoff-evidence';
  return 'collect-land-consignment-and-handoff-evidence';
}

export function getTransportModeProfile(mode: TransportMode | string): TransportModeProfile {
  return PROFILES[normalizeMode(mode)];
}

export function listTransportModeProfiles(): TransportModeProfile[] {
  return TRANSPORT_MODES.map(mode => PROFILES[mode]);
}

export function buildTransportRequirementChecklist(
  input: TransportRequirementChecklistInput,
): TransportRequirementChecklist {
  const mode = normalizeMode(input.mode);
  const profile = PROFILES[mode];
  const providedFeatures = input.features?.map(value => String(value).trim().toLowerCase());
  const providedDocuments = input.documents?.map(value => String(value).trim().toLowerCase());
  const requiredEvidence = Array.from(new Set([
    ...profile.requiredEvidence,
    ...optionalEvidenceForInput(input),
  ]));

  const featureItems: TransportRequirementChecklistItem[] = profile.requiredFeatures.map(key => ({
    key,
    kind: 'feature',
    status: hasValue(providedFeatures, key) ? 'complete' : 'missing',
    required: true,
  }));
  const documentItems: TransportRequirementChecklistItem[] = profile.requiredDocuments.map(key => ({
    key,
    kind: 'document',
    status: hasValue(providedDocuments, key) ? 'complete' : 'missing',
    required: true,
  }));
  const evidenceItems: TransportRequirementChecklistItem[] = requiredEvidence.map(key => ({
    key,
    kind: 'evidence',
    status: evidenceStatus(input.evidence, key),
    required: profile.requiredEvidence.includes(key),
  }));
  const items = [...featureItems, ...documentItems, ...evidenceItems];
  const blockers = items
    .filter(item => item.required && item.status === 'missing')
    .map(item => `${item.kind}:${item.key}`);
  const warnings = items
    .filter(item => item.status === 'review')
    .map(item => `${item.kind}:${item.key}`);

  if (input.highRiskMode && mode === 'land' && !hasValue(providedFeatures, 'recipient-proof')) {
    blockers.push('feature:recipient-proof-high-risk-required');
  }
  if (mode === 'air' && input.dangerousGoods && !hasValue(providedDocuments, 'dangerous-goods-declaration')) {
    blockers.push('document:dangerous-goods-declaration-required');
  }
  if (mode === 'air' && input.temperatureControlled && !hasValue(providedDocuments, 'temperature-log')) {
    blockers.push('document:temperature-log-required');
  }

  return {
    version: TRANSPORT_MODE_REQUIREMENTS_VERSION,
    mode,
    status: blockers.length > 0 ? 'requires-input' : warnings.length > 0 ? 'requires-review' : 'ready',
    nextAction: nextActionFor(mode, blockers, warnings),
    items,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawShipmentDocumentStored: false,
      rawRecipientProofStored: false,
      publicSurface: 'mode-state-checklist-commitments-and-next-action-only',
    },
  };
}
