import { sha256Hex } from './sha256';

export const COSCO_INSPIRED_OCEAN_CONTROL_TOWER_VERSION = 'agid-cosco-inspired-ocean-control-tower-v1';
export const COSCO_INSPIRED_COMMITMENT_ALGORITHM = 'sha256-ocean-shipment-commitment-v1';

export const COSCO_INSPIRED_CAPABILITIES = [
  'cargo-tracking',
  'new-booking',
  'rates-tariffs',
  'control-tower',
  'sailing-schedule',
  'booking',
  'smart-documents',
] as const;

export const COSCO_INSPIRED_STATUSES = [
  'requires-schedule',
  'requires-booking',
  'docs-required',
  'waiting-departure',
  'in-transit',
  'port-hold',
  'customs-hold',
  'pickup-ready',
  'final-mile-required',
  'completed',
  'requires-review',
] as const;

export const COSCO_INSPIRED_ACTIONS = [
  'search-sailing-schedule',
  'request-booking',
  'request-rates-tariffs',
  'upload-smart-documents',
  'track-cargo',
  'review-control-tower',
  'customs-review',
  'confirm-port-pickup',
  'create-final-mile-label',
  'report-reachability-issue',
  'none',
] as const;

export type CoscoInspiredCapability = typeof COSCO_INSPIRED_CAPABILITIES[number];
export type CoscoInspiredStatus = typeof COSCO_INSPIRED_STATUSES[number];
export type CoscoInspiredAction = typeof COSCO_INSPIRED_ACTIONS[number];
export type CoscoInspiredMode = 'local' | 'server-registry' | 'external-carrier' | 'full';
export type CoscoInspiredDocumentStatus = 'missing' | 'pending' | 'submitted' | 'accepted' | 'rejected' | 'expired';
export type CoscoInspiredDocumentType =
  | 'bill-of-lading'
  | 'commercial-invoice'
  | 'packing-list'
  | 'customs-declaration'
  | 'certificate-of-origin'
  | 'dangerous-goods'
  | 'release-order'
  | 'delivery-order'
  | 'other';
export type CoscoInspiredMilestoneStatus =
  | 'booking-requested'
  | 'booking-confirmed'
  | 'empty-pickup'
  | 'laden-gate-in'
  | 'loaded-on-vessel'
  | 'vessel-departed'
  | 'transshipment-arrived'
  | 'transshipment-departed'
  | 'vessel-arrived'
  | 'discharged'
  | 'customs-hold'
  | 'port-hold'
  | 'cargo-pickup'
  | 'delivered'
  | 'delayed'
  | 'exception';

export type CoscoInspiredPortRef = {
  portCode?: string;
  terminalCode?: string;
  city?: string;
  countryCode?: string;
  agid?: string;
  coarseAgid?: string;
  eta?: string;
  etd?: string;
};

export type CoscoInspiredSailingLeg = {
  origin?: CoscoInspiredPortRef;
  destination?: CoscoInspiredPortRef;
  vesselName?: string;
  voyageNumber?: string;
  serviceCode?: string;
  etd?: string;
  eta?: string;
  transshipment?: boolean;
  status?: 'planned' | 'confirmed' | 'departed' | 'arrived' | 'delayed' | 'cancelled';
};

export type CoscoInspiredMilestone = {
  status: CoscoInspiredMilestoneStatus;
  observedAt?: string;
  location?: CoscoInspiredPortRef;
  source?: 'carrier' | 'port' | 'customs' | 'terminal' | 'agent' | 'system';
  signed?: boolean;
  note?: string;
};

export type CoscoInspiredSmartDocument = {
  type: CoscoInspiredDocumentType;
  status: CoscoInspiredDocumentStatus;
  documentRef?: string;
  signed?: boolean;
  expiresAt?: string;
};

export type CoscoInspiredOceanControlTowerInput = {
  shipmentId?: string;
  mode?: string;
  carrierId?: string;
  serviceCode?: string;
  bookingNumber?: string;
  billOfLadingNumber?: string;
  containerNumbers?: string[];
  trackingNumber?: string;
  vesselName?: string;
  voyageNumber?: string;
  origin?: CoscoInspiredPortRef;
  destination?: CoscoInspiredPortRef;
  scheduleLegs?: CoscoInspiredSailingLeg[];
  milestones?: CoscoInspiredMilestone[];
  smartDocuments?: CoscoInspiredSmartDocument[];
  rateTariffRef?: string;
  customsHold?: boolean;
  portHold?: boolean;
  finalMileRequired?: boolean;
  finalMileLabelIntentRef?: string;
  highRiskMode?: boolean;
  now?: string;
};

export type Iso6346Validation = {
  input: string;
  normalized: string;
  formatValid: boolean;
  checkDigitValid: boolean;
};

export type CoscoInspiredPublicProjection = {
  shipmentId: string;
  status: CoscoInspiredStatus;
  nextAction: CoscoInspiredAction;
  carrierId: string;
  serviceCode?: string;
  route: {
    origin?: Omit<CoscoInspiredPortRef, 'agid'>;
    destination?: Omit<CoscoInspiredPortRef, 'agid'>;
    legCount: number;
    transshipmentCount: number;
  };
  timeline: Array<{
    status: CoscoInspiredMilestoneStatus;
    observedAt?: string;
    source?: CoscoInspiredMilestone['source'];
    signed: boolean;
  }>;
  documentSummary: {
    total: number;
    accepted: number;
    pending: number;
    missing: number;
    rejected: number;
    expired: number;
  };
  containerSummary: {
    count: number;
    iso6346FormatValid: number;
    iso6346CheckDigitValid: number;
  };
  publicMode: 'state-only' | 'coarse-state-only';
};

export type CoscoInspiredOceanControlTower = {
  version: typeof COSCO_INSPIRED_OCEAN_CONTROL_TOWER_VERSION;
  shipmentId: string;
  mode: CoscoInspiredMode;
  capabilities: CoscoInspiredCapability[];
  status: CoscoInspiredStatus;
  nextAction: CoscoInspiredAction;
  actions: CoscoInspiredAction[];
  publicProjection: CoscoInspiredPublicProjection;
  commitments: Record<string, string>;
  containerValidation: Iso6346Validation[];
  warnings: string[];
  errors: string[];
  privacy: {
    rawBookingNumberStored: false;
    rawBillOfLadingStored: false;
    rawContainerNumbersStored: false;
    rawTrackingNumberStored: false;
    rawPreciseAgidStored: false;
    publicContainsRawShipmentRefs: false;
    highRiskMode: boolean;
  };
};

const ISO6346_LETTER_VALUES: Record<string, number> = {
  A: 10,
  B: 12,
  C: 13,
  D: 14,
  E: 15,
  F: 16,
  G: 17,
  H: 18,
  I: 19,
  J: 20,
  K: 21,
  L: 23,
  M: 24,
  N: 25,
  O: 26,
  P: 27,
  Q: 28,
  R: 29,
  S: 30,
  T: 31,
  U: 32,
  V: 34,
  W: 35,
  X: 36,
  Y: 37,
  Z: 38,
};

function clean(value: unknown, maxLength = 160) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function cleanToken(value: unknown, maxLength = 80) {
  return clean(value, maxLength).replace(/[^A-Za-z0-9._:-]+/g, '-');
}

function normalizeMode(value: unknown): CoscoInspiredMode {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (text === 'server-registry' || text === 'external-carrier' || text === 'full') return text;
  return 'local';
}

function normalizeCountryCode(value: unknown) {
  const text = clean(value, 8).toUpperCase().replace(/[^A-Z]/g, '');
  return /^[A-Z]{2}$/.test(text) ? text : undefined;
}

function normalizeIsoDate(value: unknown) {
  const text = clean(value, 80);
  return text && !Number.isNaN(Date.parse(text)) ? text : undefined;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
    .join(',')}}`;
}

function commitment(domain: string, field: string, value: unknown) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return undefined;
  return `ocean:${sha256Hex(stableJson({
    algorithm: COSCO_INSPIRED_COMMITMENT_ALGORITHM,
    domain,
    field,
    value,
  }))}`;
}

function normalizeContainerNumber(value: unknown) {
  return clean(value, 32).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validateIso6346ContainerNumber(value: string): Iso6346Validation {
  const normalized = normalizeContainerNumber(value);
  const formatValid = /^[A-Z]{3}[UJZ]\d{7}$/.test(normalized);
  if (!formatValid) {
    return {
      input: clean(value, 32),
      normalized,
      formatValid,
      checkDigitValid: false,
    };
  }

  const characters = normalized.slice(0, 10).split('');
  const checkDigit = Number(normalized.at(10));
  const sum = characters.reduce((total, char, index) => {
    const value = /[0-9]/.test(char) ? Number(char) : ISO6346_LETTER_VALUES[char];
    return total + value * (2 ** index);
  }, 0);
  const expected = (sum % 11) % 10;
  return {
    input: clean(value, 32),
    normalized,
    formatValid,
    checkDigitValid: expected === checkDigit,
  };
}

function normalizePort(value?: CoscoInspiredPortRef): CoscoInspiredPortRef | undefined {
  if (!value) return undefined;
  const port: CoscoInspiredPortRef = {
    ...(cleanToken(value.portCode, 16) ? { portCode: cleanToken(value.portCode, 16).toUpperCase() } : {}),
    ...(cleanToken(value.terminalCode, 24) ? { terminalCode: cleanToken(value.terminalCode, 24).toUpperCase() } : {}),
    ...(clean(value.city, 80) ? { city: clean(value.city, 80) } : {}),
    ...(normalizeCountryCode(value.countryCode) ? { countryCode: normalizeCountryCode(value.countryCode) } : {}),
    ...(cleanToken(value.agid, 80) ? { agid: cleanToken(value.agid, 80).toUpperCase() } : {}),
    ...(cleanToken(value.coarseAgid, 40) ? { coarseAgid: cleanToken(value.coarseAgid, 40).toUpperCase() } : {}),
    ...(normalizeIsoDate(value.eta) ? { eta: normalizeIsoDate(value.eta) } : {}),
    ...(normalizeIsoDate(value.etd) ? { etd: normalizeIsoDate(value.etd) } : {}),
  };
  return Object.keys(port).length ? port : undefined;
}

function publicPort(value?: CoscoInspiredPortRef): Omit<CoscoInspiredPortRef, 'agid'> | undefined {
  const port = normalizePort(value);
  if (!port) return undefined;
  const { agid, ...publicValue } = port;
  void agid;
  return publicValue;
}

function normalizeLegs(input: CoscoInspiredOceanControlTowerInput) {
  const directLeg = input.origin || input.destination
    ? [{ origin: input.origin, destination: input.destination, vesselName: input.vesselName, voyageNumber: input.voyageNumber }]
    : [];
  const legs = input.scheduleLegs?.length ? input.scheduleLegs : directLeg;
  return legs.map((leg): CoscoInspiredSailingLeg => ({
    origin: normalizePort(leg.origin),
    destination: normalizePort(leg.destination),
    ...(clean(leg.vesselName, 80) ? { vesselName: clean(leg.vesselName, 80) } : {}),
    ...(cleanToken(leg.voyageNumber, 32) ? { voyageNumber: cleanToken(leg.voyageNumber, 32).toUpperCase() } : {}),
    ...(cleanToken(leg.serviceCode, 32) ? { serviceCode: cleanToken(leg.serviceCode, 32).toUpperCase() } : {}),
    ...(normalizeIsoDate(leg.etd) ? { etd: normalizeIsoDate(leg.etd) } : {}),
    ...(normalizeIsoDate(leg.eta) ? { eta: normalizeIsoDate(leg.eta) } : {}),
    transshipment: Boolean(leg.transshipment),
    status: leg.status ?? 'planned',
  }));
}

function normalizeMilestones(input?: CoscoInspiredMilestone[]) {
  const validStatuses = new Set(COSCO_MILESTONE_STATUSES);
  return (input ?? [])
    .filter(item => validStatuses.has(item.status))
    .map((item): CoscoInspiredMilestone => ({
      status: item.status,
      ...(normalizeIsoDate(item.observedAt) ? { observedAt: normalizeIsoDate(item.observedAt) } : {}),
      location: normalizePort(item.location),
      source: item.source ?? 'system',
      signed: Boolean(item.signed),
      ...(clean(item.note, 160) ? { note: clean(item.note, 160) } : {}),
    }))
    .sort((left, right) => Date.parse(left.observedAt ?? '1970-01-01') - Date.parse(right.observedAt ?? '1970-01-01'));
}

const COSCO_MILESTONE_STATUSES: CoscoInspiredMilestoneStatus[] = [
  'booking-requested',
  'booking-confirmed',
  'empty-pickup',
  'laden-gate-in',
  'loaded-on-vessel',
  'vessel-departed',
  'transshipment-arrived',
  'transshipment-departed',
  'vessel-arrived',
  'discharged',
  'customs-hold',
  'port-hold',
  'cargo-pickup',
  'delivered',
  'delayed',
  'exception',
];

function normalizeDocuments(input?: CoscoInspiredSmartDocument[]) {
  const validTypes = new Set<CoscoInspiredDocumentType>([
    'bill-of-lading',
    'commercial-invoice',
    'packing-list',
    'customs-declaration',
    'certificate-of-origin',
    'dangerous-goods',
    'release-order',
    'delivery-order',
    'other',
  ]);
  const validStatuses = new Set<CoscoInspiredDocumentStatus>([
    'missing',
    'pending',
    'submitted',
    'accepted',
    'rejected',
    'expired',
  ]);
  return (input ?? []).map((document): CoscoInspiredSmartDocument => ({
    type: validTypes.has(document.type) ? document.type : 'other',
    status: validStatuses.has(document.status) ? document.status : 'pending',
    ...(cleanToken(document.documentRef, 80) ? { documentRef: cleanToken(document.documentRef, 80) } : {}),
    signed: Boolean(document.signed),
    ...(normalizeIsoDate(document.expiresAt) ? { expiresAt: normalizeIsoDate(document.expiresAt) } : {}),
  }));
}

function documentSummary(documents: CoscoInspiredSmartDocument[]) {
  return {
    total: documents.length,
    accepted: documents.filter(item => item.status === 'accepted').length,
    pending: documents.filter(item => item.status === 'pending' || item.status === 'submitted').length,
    missing: documents.filter(item => item.status === 'missing').length,
    rejected: documents.filter(item => item.status === 'rejected').length,
    expired: documents.filter(item => item.status === 'expired').length,
  };
}

function hasMilestone(milestones: CoscoInspiredMilestone[], ...statuses: CoscoInspiredMilestoneStatus[]) {
  return milestones.some(item => statuses.includes(item.status));
}

function determineStatus(input: {
  hasSchedule: boolean;
  hasBooking: boolean;
  documents: CoscoInspiredSmartDocument[];
  milestones: CoscoInspiredMilestone[];
  customsHold: boolean;
  portHold: boolean;
  finalMileRequired: boolean;
  finalMileLabelIntentRef?: string;
  warnings: string[];
  errors: string[];
}): CoscoInspiredStatus {
  if (input.errors.length > 0) return 'requires-review';
  if (!input.hasSchedule) return 'requires-schedule';
  if (!input.hasBooking) return 'requires-booking';
  if (input.documents.some(item => item.status === 'missing' || item.status === 'rejected' || item.status === 'expired')) {
    return 'docs-required';
  }
  if (input.customsHold || hasMilestone(input.milestones, 'customs-hold')) return 'customs-hold';
  if (input.portHold || hasMilestone(input.milestones, 'port-hold')) return 'port-hold';
  if (hasMilestone(input.milestones, 'delivered')) return 'completed';
  if (hasMilestone(input.milestones, 'cargo-pickup')) {
    return input.finalMileRequired && !input.finalMileLabelIntentRef ? 'final-mile-required' : 'pickup-ready';
  }
  if (input.finalMileRequired && hasMilestone(input.milestones, 'vessel-arrived', 'discharged')) {
    return 'final-mile-required';
  }
  if (hasMilestone(input.milestones, 'vessel-departed', 'loaded-on-vessel', 'transshipment-arrived', 'transshipment-departed')) {
    return 'in-transit';
  }
  if (hasMilestone(input.milestones, 'booking-confirmed', 'laden-gate-in', 'empty-pickup')) return 'waiting-departure';
  if (input.warnings.length > 0) return 'requires-review';
  return 'waiting-departure';
}

function nextActionFor(status: CoscoInspiredStatus): CoscoInspiredAction {
  switch (status) {
    case 'requires-schedule': return 'search-sailing-schedule';
    case 'requires-booking': return 'request-booking';
    case 'docs-required': return 'upload-smart-documents';
    case 'customs-hold': return 'customs-review';
    case 'port-hold': return 'review-control-tower';
    case 'pickup-ready': return 'confirm-port-pickup';
    case 'final-mile-required': return 'create-final-mile-label';
    case 'in-transit': return 'track-cargo';
    case 'requires-review': return 'review-control-tower';
    default: return 'none';
  }
}

function actionsFor(status: CoscoInspiredStatus, input: {
  hasRateTariffRef: boolean;
  hasSchedule: boolean;
  hasBooking: boolean;
  hasUnsignedMilestones: boolean;
  hasDelay: boolean;
}) {
  const actions = new Set<CoscoInspiredAction>([nextActionFor(status)]);
  if (!input.hasRateTariffRef && (status === 'requires-booking' || status === 'requires-schedule')) {
    actions.add('request-rates-tariffs');
  }
  if (!input.hasSchedule) actions.add('search-sailing-schedule');
  if (!input.hasBooking) actions.add('request-booking');
  if (input.hasUnsignedMilestones || input.hasDelay) actions.add('review-control-tower');
  if (status === 'port-hold') actions.add('report-reachability-issue');
  return Array.from(actions).filter(action => action !== 'none' || actions.size === 1);
}

function containerSummary(validations: Iso6346Validation[]) {
  return {
    count: validations.length,
    iso6346FormatValid: validations.filter(item => item.formatValid).length,
    iso6346CheckDigitValid: validations.filter(item => item.checkDigitValid).length,
  };
}

function buildShipmentId(input: CoscoInspiredOceanControlTowerInput, commitments: Record<string, string>) {
  const explicit = cleanToken(input.shipmentId, 80).toUpperCase();
  if (/^OCT-[A-F0-9]{16,32}$/.test(explicit)) return explicit;
  return `OCT-${sha256Hex(stableJson({
    carrierId: input.carrierId,
    serviceCode: input.serviceCode,
    commitments,
  })).slice(0, 24).toUpperCase()}`;
}

function addCommitments(
  input: CoscoInspiredOceanControlTowerInput,
  containers: string[],
  domain: string,
) {
  const commitments: Record<string, string> = {};
  const add = (field: string, value: unknown) => {
    const next = commitment(domain, field, value);
    if (next) commitments[field] = next;
  };
  add('bookingNumber', cleanToken(input.bookingNumber, 80).toUpperCase());
  add('billOfLadingNumber', cleanToken(input.billOfLadingNumber, 80).toUpperCase());
  add('trackingNumber', cleanToken(input.trackingNumber, 80).toUpperCase());
  add('containerNumbers', containers);
  add('vesselName', clean(input.vesselName, 80));
  add('voyageNumber', cleanToken(input.voyageNumber, 32).toUpperCase());
  add('rateTariffRef', cleanToken(input.rateTariffRef, 80));
  add('finalMileLabelIntentRef', cleanToken(input.finalMileLabelIntentRef, 80));
  add('originAgid', cleanToken(input.origin?.agid, 80).toUpperCase());
  add('destinationAgid', cleanToken(input.destination?.agid, 80).toUpperCase());
  return commitments;
}

export function buildCoscoInspiredOceanControlTower(
  input: CoscoInspiredOceanControlTowerInput = {},
): CoscoInspiredOceanControlTower {
  const domain = 'cosco-inspired-ocean-control-tower';
  const carrierId = cleanToken(input.carrierId, 80).toLowerCase() || 'ocean-carrier';
  const serviceCode = cleanToken(input.serviceCode, 32).toUpperCase();
  const mode = normalizeMode(input.mode);
  const highRiskMode = Boolean(input.highRiskMode);
  const containerNumbers = [...new Set((input.containerNumbers ?? []).map(normalizeContainerNumber).filter(Boolean))];
  const containerValidation = containerNumbers.map(validateIso6346ContainerNumber);
  const commitments = addCommitments(input, containerNumbers, domain);
  const scheduleLegs = normalizeLegs(input);
  const milestones = normalizeMilestones(input.milestones);
  const smartDocuments = normalizeDocuments(input.smartDocuments);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (containerValidation.some(item => item.formatValid && !item.checkDigitValid)) {
    warnings.push('container-check-digit-invalid');
  }
  if (containerValidation.some(item => !item.formatValid)) {
    warnings.push('container-format-invalid');
  }
  if (milestones.some(item => !item.signed && item.source !== 'system')) {
    warnings.push('unsigned-carrier-or-port-milestone');
  }
  if (milestones.some(item => item.status === 'delayed' || item.status === 'exception')) {
    warnings.push('control-tower-delay-or-exception');
  }
  if (highRiskMode && (input.origin?.agid || input.destination?.agid)) {
    warnings.push('high-risk-mode-uses-coarse-port-agid-publicly');
  }
  if (mode === 'external-carrier' && !input.bookingNumber && !input.billOfLadingNumber && containerNumbers.length === 0) {
    errors.push('external-carrier-mode-requires-booking-bol-or-container-reference');
  }

  const hasSchedule = scheduleLegs.length > 0 && scheduleLegs.some(leg => leg.origin || leg.destination);
  const hasBooking = Boolean(input.bookingNumber || input.billOfLadingNumber || hasMilestone(milestones, 'booking-confirmed'));
  const status = determineStatus({
    hasSchedule,
    hasBooking,
    documents: smartDocuments,
    milestones,
    customsHold: Boolean(input.customsHold),
    portHold: Boolean(input.portHold),
    finalMileRequired: Boolean(input.finalMileRequired),
    finalMileLabelIntentRef: cleanToken(input.finalMileLabelIntentRef, 80),
    warnings,
    errors,
  });
  const shipmentId = buildShipmentId(input, commitments);
  const nextAction = nextActionFor(status);
  const actions = actionsFor(status, {
    hasRateTariffRef: Boolean(input.rateTariffRef),
    hasSchedule,
    hasBooking,
    hasUnsignedMilestones: milestones.some(item => !item.signed && item.source !== 'system'),
    hasDelay: milestones.some(item => item.status === 'delayed' || item.status === 'exception'),
  });
  const firstLeg = scheduleLegs[0];
  const lastLeg = scheduleLegs.at(-1);
  const origin = publicPort(input.origin) ?? publicPort(firstLeg?.origin);
  const destination = publicPort(input.destination) ?? publicPort(lastLeg?.destination);

  return {
    version: COSCO_INSPIRED_OCEAN_CONTROL_TOWER_VERSION,
    shipmentId,
    mode,
    capabilities: [...COSCO_INSPIRED_CAPABILITIES],
    status,
    nextAction,
    actions,
    publicProjection: {
      shipmentId,
      status,
      nextAction,
      carrierId,
      ...(serviceCode ? { serviceCode } : {}),
      route: {
        origin,
        destination,
        legCount: scheduleLegs.length,
        transshipmentCount: scheduleLegs.filter(leg => leg.transshipment).length,
      },
      timeline: milestones.map(item => ({
        status: item.status,
        ...(item.observedAt ? { observedAt: item.observedAt } : {}),
        ...(item.source ? { source: item.source } : {}),
        signed: Boolean(item.signed),
      })),
      documentSummary: documentSummary(smartDocuments),
      containerSummary: containerSummary(containerValidation),
      publicMode: highRiskMode ? 'coarse-state-only' : 'state-only',
    },
    commitments,
    containerValidation,
    warnings: Array.from(new Set(warnings)),
    errors: Array.from(new Set(errors)),
    privacy: {
      rawBookingNumberStored: false,
      rawBillOfLadingStored: false,
      rawContainerNumbersStored: false,
      rawTrackingNumberStored: false,
      rawPreciseAgidStored: false,
      publicContainsRawShipmentRefs: false,
      highRiskMode,
    },
  };
}

export function validateCoscoInspiredOceanControlTower(tower: CoscoInspiredOceanControlTower) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (tower.version !== COSCO_INSPIRED_OCEAN_CONTROL_TOWER_VERSION) errors.push('version-mismatch');
  if (!tower.shipmentId.startsWith('OCT-')) errors.push('invalid-shipment-id');
  if (tower.privacy.rawBookingNumberStored !== false) errors.push('raw-booking-number-stored');
  if (tower.privacy.rawBillOfLadingStored !== false) errors.push('raw-bill-of-lading-stored');
  if (tower.privacy.rawContainerNumbersStored !== false) errors.push('raw-container-numbers-stored');
  if (tower.privacy.rawTrackingNumberStored !== false) errors.push('raw-tracking-number-stored');
  if (tower.privacy.rawPreciseAgidStored !== false) errors.push('raw-precise-agid-stored');
  if (tower.privacy.publicContainsRawShipmentRefs !== false) errors.push('public-shipment-ref-leak');

  const publicText = stableJson(tower.publicProjection);
  for (const sensitive of Object.keys(tower.commitments)) {
    if (sensitive.toLowerCase().includes('container') && /[A-Z]{3}[UJZ]\d{7}/.test(publicText)) {
      errors.push('public-container-number-leak');
    }
  }
  if (tower.publicProjection.publicMode === 'coarse-state-only' && (
    'agid' in (tower.publicProjection.route.origin ?? {})
    || 'agid' in (tower.publicProjection.route.destination ?? {})
  )) {
    errors.push('high-risk-public-projection-exposes-precise-agid');
  }
  if (tower.containerValidation.some(item => item.formatValid && !item.checkDigitValid)) {
    warnings.push('container-check-digit-invalid');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
