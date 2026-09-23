import { sha256Hex } from './sha256.js';

export const HEXASHIP_DELIVERY_GATEWAY_VERSION = 'hexaship-delivery-gateway-v0.1';

export type HexashipCarrier = 'dhl' | 'ups';
export type HexashipServicePreference = 'fastest' | 'cheapest' | 'balanced';
export type HexashipShipmentStatus = 'created' | 'rated' | 'label_created' | 'in_transit' | 'delivered' | 'return_created';
export type HexashipMvpRoutingChoice = 'fastest' | 'cheapest';

export type HexashipGatewayMethod =
  | 'createShipment'
  | 'getRates'
  | 'createLabel'
  | 'trackShipment'
  | 'createReturn';

export type HexashipGatewayMethodSpec = {
  method: HexashipGatewayMethod;
  path: string;
  purpose: string;
  safeInputs: string[];
  safeOutputs: string[];
  blockedMaterial: string[];
};

export type HexashipCarrierAdapter = {
  carrier: HexashipCarrier;
  displayName: 'DHL' | 'UPS';
  adapterRef: string;
  serverSideOnly: true;
  publicClientAllowed: false;
  supportedMethods: HexashipGatewayMethod[];
  credentialBoundary: string;
};

export type HexashipDeliveryGatewayPlan = {
  version: typeof HEXASHIP_DELIVERY_GATEWAY_VERSION;
  productName: 'Hexaship / Delivery Gateway';
  thesis: string;
  methods: HexashipGatewayMethodSpec[];
  carrierAdapters: HexashipCarrierAdapter[];
  safety: {
    rawAddressAllowedInPublicApi: false;
    carrierCredentialsAllowedInClient: false;
    productionTrafficInSandbox: false;
    rawLabelPayloadStored: false;
  };
  webhookEvents: string[];
  nonClaims: string[];
};

export type HexashipCreateShipmentInput = {
  merchantRef: string;
  recipientId: string;
  parcelProfileRef: string;
  walletConsentRef: string;
  carrierPreference?: HexashipCarrier | 'auto';
  servicePreference?: HexashipServicePreference;
  requestedAt?: string;
};

export type HexashipMvpV01Request = {
  merchantRef: string;
  ecOrderRef: string;
  recipientId: string;
  addressFormVersion?: string;
  parcelProfileRef: string;
  walletConsentRef: string;
  carrierCapabilityRef: string;
  selectionMode: HexashipMvpRoutingChoice;
  selectedBy?: 'user' | 'ec';
  requestedAt?: string;
};

export type HexashipMvpRateCandidate = {
  carrier: HexashipCarrier;
  rateRef: string;
  serviceLevel: 'economy' | 'express';
  priceMinor: number;
  currency: 'JPY' | 'USD';
  etaMinutes: number;
  priceEstimateRef: string;
  etaWindowRef: string;
};

export type HexashipMvpWebhookLedgerEntry = {
  eventRef: string;
  eventType: 'shipment.created' | 'rates.created' | 'carrier.selected' | 'label.created' | 'shipment.in_transit';
  shipmentRef: string;
  trackingAlias?: string;
  status: HexashipShipmentStatus;
  receivedAt: string;
  rawPayloadStored: false;
};

export type HexashipMvpV01Result = {
  ok: true;
  version: typeof HEXASHIP_DELIVERY_GATEWAY_VERSION;
  flow: 'hexaship-mvp-v0.1';
  ecOrderRef: string;
  recipientResolution: {
    recipientId: string;
    addressResolutionRef: string;
    walletConsentRef: string;
    containsRawAddress: false;
  };
  capability: {
    carrierCapabilityRef: string;
    requiredNextAction: 'getRates';
    localOnly: true;
  };
  shipment: {
    shipmentRef: string;
    status: HexashipShipmentStatus;
  };
  candidates: HexashipMvpRateCandidate[];
  selection: {
    selectionMode: HexashipMvpRoutingChoice;
    selectedBy: 'user' | 'ec';
    selectedCarrier: HexashipCarrier;
    selectedRateRef: string;
    decisionRef: string;
  };
  label: {
    labelRef: string;
    waybillAlias: string;
    trackingAlias: string;
    labelQrCommitment: string;
    status: HexashipShipmentStatus;
  };
  tracking: {
    trackingAlias: string;
    trackingReceiptRef: string;
    status: HexashipShipmentStatus;
  };
  webhookLedger: HexashipMvpWebhookLedgerEntry[];
  privacy: {
    rawAddressStored: false;
    recipientContactStored: false;
    carrierCredentialsAcceptedFromClient: false;
    rawCarrierPayloadStored: false;
  };
  localOnly: true;
  productionTraffic: false;
  nonClaims: string[];
};

export type HexashipRateInput = {
  shipmentRef?: string;
  recipientId: string;
  parcelProfileRef: string;
  carrierCapabilityRef?: string;
  carrierPreference?: HexashipCarrier | 'auto';
  servicePreference?: HexashipServicePreference;
};

export type HexashipCreateLabelInput = {
  shipmentRef: string;
  rateRef: string;
  walletConsentRef: string;
  labelFormat?: 'qr' | 'pdf' | 'zpl';
};

export type HexashipTrackShipmentInput = {
  shipmentRef: string;
  trackingAlias: string;
  carrier: HexashipCarrier;
};

export type HexashipCreateReturnInput = {
  shipmentRef: string;
  reasonCode: 'customer_return' | 'merchant_recall' | 'failed_delivery' | 'exchange';
  walletConsentRef: string;
};

export type HexashipGatewayResult<T extends Record<string, unknown>> = {
  ok: true;
  version: typeof HEXASHIP_DELIVERY_GATEWAY_VERSION;
  carrier: HexashipCarrier;
  carrierAdapterRef: string;
  developerCall: `hexaship.${HexashipGatewayMethod}`;
  body: T & {
    localOnly: true;
    productionTraffic: false;
    rawAddressFixtures: false;
    blockedMaterial: string[];
    nonClaims: string[];
  };
};

export type HexashipGatewayError = {
  ok: false;
  status: 400;
  error: 'bad_request' | 'private_material_rejected';
  missingKeys?: string[];
  rejectedKeys?: string[];
};

export type HexashipGatewayResponse<T extends Record<string, unknown>> = HexashipGatewayResult<T> | HexashipGatewayError;

export type HexashipMvpV01PreflightNextAction =
  | 'remove_private_material'
  | 'run_address_wallet_preflight'
  | 'run_carrier_capability_preflight'
  | 'call_hexaship_createShipment';

export type HexashipMvpV01Preflight = {
  ok: boolean;
  version: typeof HEXASHIP_DELIVERY_GATEWAY_VERSION;
  flow: 'hexaship-mvp-v0.1-preflight';
  missingAddressWalletRefs: string[];
  missingCarrierRefs: string[];
  rejectedKeys: string[];
  requiredNextAction: HexashipMvpV01PreflightNextAction;
  safeInputRefs: {
    merchantRef?: string;
    ecOrderRef?: string;
    recipientId?: string;
    addressFormVersion?: string;
    parcelProfileRef?: string;
    walletConsentRef?: string;
    carrierCapabilityRef?: string;
  };
  safety: {
    localOnly: true;
    productionTraffic: false;
    rawAddressStored: false;
    carrierCredentialsAcceptedFromClient: false;
    privateMaterialExposed: false;
  };
  nonClaims: string[];
};

export const HEXASHIP_GATEWAY_BLOCKED_MATERIAL = [
  'rawAddress',
  'addressLine1',
  'addressLine2',
  'recipientName',
  'recipientPhone',
  'phone',
  'privateDeliveryNotes',
  'proofWitness',
  'proofSecret',
  'privateKey',
  'carrierApiKey',
  'carrierCredential',
  'commercialRateSecret',
  'rawLabelPayload',
  'rawTrackingPayload',
  'rawQrPayload',
] as const;

const METHOD_SPECS: HexashipGatewayMethodSpec[] = [
  {
    method: 'createShipment',
    path: '/v1/shipments',
    purpose: 'Create a carrier-neutral shipment intent from recipient_id, parcel, wallet consent, and routing preference.',
    safeInputs: ['merchantRef', 'recipientId', 'addressFormVersion', 'parcelProfileRef', 'walletConsentRef', 'carrierPreference', 'servicePreference'],
    safeOutputs: ['shipmentRef', 'status', 'selectedCarrier', 'requiredNextAction'],
    blockedMaterial: [...HEXASHIP_GATEWAY_BLOCKED_MATERIAL],
  },
  {
    method: 'getRates',
    path: '/v1/rates',
    purpose: 'Return normalized DHL/UPS rate candidates from the same request shape.',
    safeInputs: ['shipmentRef', 'recipientId', 'addressFormVersion', 'parcelProfileRef', 'carrierCapabilityRef', 'carrierPreference', 'servicePreference'],
    safeOutputs: ['rateRef', 'carrier', 'serviceLevel', 'priceEstimateRef', 'etaWindowRef'],
    blockedMaterial: [...HEXASHIP_GATEWAY_BLOCKED_MATERIAL],
  },
  {
    method: 'createLabel',
    path: '/v1/labels',
    purpose: 'Create a label reference after rate selection and wallet consent.',
    safeInputs: ['shipmentRef', 'rateRef', 'walletConsentRef', 'labelFormat'],
    safeOutputs: ['labelRef', 'waybillAlias', 'trackingAlias', 'labelQrCommitment'],
    blockedMaterial: [...HEXASHIP_GATEWAY_BLOCKED_MATERIAL],
  },
  {
    method: 'trackShipment',
    path: '/v1/tracking/{trackingAlias}',
    purpose: 'Read a normalized tracking receipt for a DHL/UPS shipment.',
    safeInputs: ['shipmentRef', 'trackingAlias', 'carrier'],
    safeOutputs: ['trackingReceiptRef', 'status', 'eventFingerprint', 'nextAction'],
    blockedMaterial: [...HEXASHIP_GATEWAY_BLOCKED_MATERIAL],
  },
  {
    method: 'createReturn',
    path: '/v1/returns',
    purpose: 'Create a carrier-neutral return authorization and return label reference.',
    safeInputs: ['shipmentRef', 'reasonCode', 'walletConsentRef'],
    safeOutputs: ['returnRef', 'returnLabelRef', 'returnTrackingAlias', 'status'],
    blockedMaterial: [...HEXASHIP_GATEWAY_BLOCKED_MATERIAL],
  },
];

const CARRIER_ADAPTERS: HexashipCarrierAdapter[] = [
  {
    carrier: 'dhl',
    displayName: 'DHL',
    adapterRef: 'carrier_adapter_ref_dhl_sandbox_v0',
    serverSideOnly: true,
    publicClientAllowed: false,
    supportedMethods: ['createShipment', 'getRates', 'createLabel', 'trackShipment', 'createReturn'],
    credentialBoundary: 'DHL API credentials stay in the Delivery Gateway server adapter and are never accepted from browser/client payloads.',
  },
  {
    carrier: 'ups',
    displayName: 'UPS',
    adapterRef: 'carrier_adapter_ref_ups_sandbox_v0',
    serverSideOnly: true,
    publicClientAllowed: false,
    supportedMethods: ['createShipment', 'getRates', 'createLabel', 'trackShipment', 'createReturn'],
    credentialBoundary: 'UPS API credentials stay in the Delivery Gateway server adapter and are never accepted from browser/client payloads.',
  },
];

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
}

function ref(prefix: string, value: unknown) {
  return `${prefix}_${sha256Hex(stableJson(value)).slice(0, 24)}`;
}

function collectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  const record = value as Record<string, unknown>;
  return [
    ...Object.keys(record),
    ...Object.values(record).flatMap(collectKeys),
  ];
}

function rejectPrivateMaterial(input: Record<string, unknown>): HexashipGatewayError | null {
  const keys = new Set(collectKeys(input));
  const rejectedKeys = HEXASHIP_GATEWAY_BLOCKED_MATERIAL.filter(key => keys.has(key));
  return rejectedKeys.length > 0
    ? { ok: false, status: 400, error: 'private_material_rejected', rejectedKeys }
    : null;
}

function requireKeys(input: Record<string, unknown>, keys: string[]): HexashipGatewayError | null {
  const missingKeys = keys.filter(key => typeof input[key] !== 'string' || (input[key] as string).length === 0);
  return missingKeys.length > 0 ? { ok: false, status: 400, error: 'bad_request', missingKeys } : null;
}

function normalizeCarrier(value: unknown, seed: unknown): HexashipCarrier {
  if (value === 'dhl' || value === 'ups') return value;
  return Number.parseInt(sha256Hex(stableJson(seed)).slice(0, 2), 16) % 2 === 0 ? 'dhl' : 'ups';
}

function normalizeServicePreference(value: unknown): HexashipServicePreference {
  return value === 'fastest' || value === 'cheapest' ? value : 'balanced';
}

function normalizeMvpRoutingChoice(value: unknown): HexashipMvpRoutingChoice {
  return value === 'cheapest' ? 'cheapest' : 'fastest';
}

function normalizeSelectedBy(value: unknown): 'user' | 'ec' {
  return value === 'ec' ? 'ec' : 'user';
}

function adapterFor(carrier: HexashipCarrier): HexashipCarrierAdapter {
  return CARRIER_ADAPTERS.find(adapter => adapter.carrier === carrier) ?? CARRIER_ADAPTERS[0];
}

function deterministicRateCandidate(input: {
  carrier: HexashipCarrier;
  shipmentRef: string;
  recipientId: string;
  parcelProfileRef: string;
  carrierCapabilityRef: string;
  selectionMode: HexashipMvpRoutingChoice;
}): HexashipMvpRateCandidate {
  const carrierOffset = input.carrier === 'dhl' ? 0 : 1;
  const base = Number.parseInt(sha256Hex(stableJson(input)).slice(0, 4), 16);
  const priceMinor = input.carrier === 'dhl'
    ? 1120 + (base % 260)
    : 920 + (base % 340);
  const etaMinutes = input.carrier === 'dhl'
    ? 90 + (base % 55)
    : 135 + ((base + 17) % 70);
  const serviceLevel = input.selectionMode === 'cheapest' ? 'economy' : 'express';
  const rateRef = ref('hx_rate', {
    shipmentRef: input.shipmentRef,
    carrier: input.carrier,
    serviceLevel,
    carrierCapabilityRef: input.carrierCapabilityRef,
    carrierOffset,
  });
  return {
    carrier: input.carrier,
    rateRef,
    serviceLevel,
    priceMinor,
    currency: 'JPY',
    etaMinutes,
    priceEstimateRef: ref('hx_price', { rateRef, priceMinor }),
    etaWindowRef: ref('hx_eta', { rateRef, etaMinutes }),
  };
}

function resolveAddressWalletRecipient(input: Record<string, unknown>) {
  const recipientId = input.recipientId as string;
  const walletConsentRef = input.walletConsentRef as string;
  return {
    recipientId,
    addressResolutionRef: ref('hx_address_resolution', {
      recipientId,
      walletConsentRef,
      purpose: 'shipment_creation',
    }),
    walletConsentRef,
    containsRawAddress: false as const,
  };
}

function webhookEntry(input: {
  eventType: HexashipMvpWebhookLedgerEntry['eventType'];
  shipmentRef: string;
  trackingAlias?: string;
  status: HexashipShipmentStatus;
  requestedAt?: unknown;
}): HexashipMvpWebhookLedgerEntry {
  const receivedAt = typeof input.requestedAt === 'string' && !Number.isNaN(Date.parse(input.requestedAt))
    ? new Date(input.requestedAt).toISOString()
    : '2026-07-04T00:00:00.000Z';
  return {
    eventRef: ref('hx_webhook_event', {
      eventType: input.eventType,
      shipmentRef: input.shipmentRef,
      trackingAlias: input.trackingAlias,
      status: input.status,
      receivedAt,
    }),
    eventType: input.eventType,
    shipmentRef: input.shipmentRef,
    ...(input.trackingAlias ? { trackingAlias: input.trackingAlias } : {}),
    status: input.status,
    receivedAt,
    rawPayloadStored: false,
  };
}

function ok<T extends Record<string, unknown>>(
  method: HexashipGatewayMethod,
  carrier: HexashipCarrier,
  body: T,
): HexashipGatewayResult<T> {
  return {
    ok: true,
    version: HEXASHIP_DELIVERY_GATEWAY_VERSION,
    carrier,
    carrierAdapterRef: adapterFor(carrier).adapterRef,
    developerCall: `hexaship.${method}`,
    body: {
      ...body,
      localOnly: true,
      productionTraffic: false,
      rawAddressFixtures: false,
      blockedMaterial: [...HEXASHIP_GATEWAY_BLOCKED_MATERIAL],
      nonClaims: [
        'Hexaship sandbox results are not production DHL/UPS purchases.',
        'DHL/UPS carrier credentials stay server-side and are never accepted in public client payloads.',
        'Rates, labels, tracking, and returns are normalized gateway refs, not raw carrier payloads.',
      ],
    },
  };
}

export function buildHexashipDeliveryGatewayPlan(): HexashipDeliveryGatewayPlan {
  return {
    version: HEXASHIP_DELIVERY_GATEWAY_VERSION,
    productName: 'Hexaship / Delivery Gateway',
    thesis:
      'Hexaship is the Stripe-like delivery gateway: developers call one API while DHL and UPS differences stay behind server-side adapters.',
    methods: METHOD_SPECS,
    carrierAdapters: CARRIER_ADAPTERS,
    safety: {
      rawAddressAllowedInPublicApi: false,
      carrierCredentialsAllowedInClient: false,
      productionTrafficInSandbox: false,
      rawLabelPayloadStored: false,
    },
    webhookEvents: [
      'shipment.created',
      'rates.created',
      'label.created',
      'shipment.in_transit',
      'shipment.delivered',
      'return.created',
    ],
    nonClaims: [
      'Hexaship is not a claim that DHL and UPS support every service in every country or postal code.',
      'Sandbox adapters do not send production carrier traffic.',
      'A label ref is not final proof of delivery.',
    ],
  };
}

export function createShipment(input: Record<string, unknown>): HexashipGatewayResponse<{
  shipmentRef: string;
  status: HexashipShipmentStatus;
  selectedCarrier: HexashipCarrier;
  recipientId: string;
  parcelProfileRef: string;
  walletConsentRef: string;
  servicePreference: HexashipServicePreference;
  requiredNextAction: 'getRates';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['merchantRef', 'recipientId', 'parcelProfileRef', 'walletConsentRef']);
  if (missing) return missing;

  const servicePreference = normalizeServicePreference(input.servicePreference);
  const selectedCarrier = normalizeCarrier(input.carrierPreference, input);
  const shipmentRef = ref('hx_ship', {
    merchantRef: input.merchantRef,
    recipientId: input.recipientId,
    parcelProfileRef: input.parcelProfileRef,
    walletConsentRef: input.walletConsentRef,
    selectedCarrier,
    servicePreference,
  });

  return ok('createShipment', selectedCarrier, {
    shipmentRef,
    status: 'created',
    selectedCarrier,
    recipientId: input.recipientId as string,
    parcelProfileRef: input.parcelProfileRef as string,
    walletConsentRef: input.walletConsentRef as string,
    servicePreference,
    requiredNextAction: 'getRates',
  });
}

export function getRates(input: Record<string, unknown>): HexashipGatewayResponse<{
  rateRef: string;
  shipmentRef: string;
  carrier: HexashipCarrier;
  carrierCapabilityRef: string;
  serviceLevel: 'economy' | 'standard' | 'express';
  priceEstimateRef: string;
  etaWindowRef: string;
  requiredNextAction: 'createLabel';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['recipientId', 'parcelProfileRef', 'carrierCapabilityRef']);
  if (missing) return missing;

  const carrier = normalizeCarrier(input.carrierPreference, input);
  const servicePreference = normalizeServicePreference(input.servicePreference);
  const serviceLevel = servicePreference === 'cheapest' ? 'economy' : servicePreference === 'fastest' ? 'express' : 'standard';
  const shipmentRef = typeof input.shipmentRef === 'string' && input.shipmentRef.length > 0
    ? input.shipmentRef
    : ref('hx_ship', { recipientId: input.recipientId, parcelProfileRef: input.parcelProfileRef, carrier });
  const rateRef = ref('hx_rate', { shipmentRef, carrier, serviceLevel });

  return ok('getRates', carrier, {
    rateRef,
    shipmentRef,
    carrier,
    carrierCapabilityRef: input.carrierCapabilityRef as string,
    serviceLevel,
    priceEstimateRef: ref('hx_price', { rateRef, servicePreference }),
    etaWindowRef: ref('hx_eta', { rateRef, serviceLevel }),
    requiredNextAction: 'createLabel',
  });
}

export function createLabel(input: Record<string, unknown>): HexashipGatewayResponse<{
  labelRef: string;
  shipmentRef: string;
  rateRef: string;
  waybillAlias: string;
  trackingAlias: string;
  labelQrCommitment: string;
  status: HexashipShipmentStatus;
  requiredNextAction: 'trackShipment';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['shipmentRef', 'rateRef', 'walletConsentRef']);
  if (missing) return missing;

  const carrier = normalizeCarrier(input.carrierPreference, input.rateRef);
  const labelFormat = input.labelFormat === 'pdf' || input.labelFormat === 'zpl' ? input.labelFormat : 'qr';
  const labelRef = ref('hx_label', { shipmentRef: input.shipmentRef, rateRef: input.rateRef, labelFormat });
  const trackingAlias = ref('hx_track', { labelRef, carrier });

  return ok('createLabel', carrier, {
    labelRef,
    shipmentRef: input.shipmentRef as string,
    rateRef: input.rateRef as string,
    waybillAlias: ref('hx_waybill', { labelRef }),
    trackingAlias,
    labelQrCommitment: ref('hx_labelqr_cmt', { labelRef, labelFormat }),
    status: 'label_created',
    requiredNextAction: 'trackShipment',
  });
}

export function trackShipment(input: Record<string, unknown>): HexashipGatewayResponse<{
  trackingReceiptRef: string;
  shipmentRef: string;
  trackingAlias: string;
  status: HexashipShipmentStatus;
  eventFingerprint: string;
  nextAction: 'wait_for_carrier_event' | 'createReturn';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['shipmentRef', 'trackingAlias', 'carrier']);
  if (missing) return missing;
  const carrier = normalizeCarrier(input.carrier, input);
  const status: HexashipShipmentStatus = input.status === 'delivered' ? 'delivered' : 'in_transit';

  return ok('trackShipment', carrier, {
    trackingReceiptRef: ref('hx_tracking_receipt', { shipmentRef: input.shipmentRef, trackingAlias: input.trackingAlias, status }),
    shipmentRef: input.shipmentRef as string,
    trackingAlias: input.trackingAlias as string,
    status,
    eventFingerprint: ref('hx_event', { trackingAlias: input.trackingAlias, status }),
    nextAction: status === 'delivered' ? 'createReturn' : 'wait_for_carrier_event',
  });
}

export function createReturn(input: Record<string, unknown>): HexashipGatewayResponse<{
  returnRef: string;
  shipmentRef: string;
  reasonCode: string;
  returnLabelRef: string;
  returnTrackingAlias: string;
  status: HexashipShipmentStatus;
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['shipmentRef', 'reasonCode', 'walletConsentRef']);
  if (missing) return missing;
  const carrier = normalizeCarrier(input.carrierPreference, input);
  const returnRef = ref('hx_return', { shipmentRef: input.shipmentRef, reasonCode: input.reasonCode, carrier });

  return ok('createReturn', carrier, {
    returnRef,
    shipmentRef: input.shipmentRef as string,
    reasonCode: input.reasonCode as string,
    returnLabelRef: ref('hx_return_label', { returnRef }),
    returnTrackingAlias: ref('hx_return_track', { returnRef }),
    status: 'return_created',
  });
}

export function preflightHexashipMvpV01Shipment(input: Record<string, unknown>): HexashipMvpV01Preflight {
  const privateRejection = rejectPrivateMaterial(input);
  const rejectedKeys = privateRejection?.rejectedKeys ?? [];
  const missingAddressWalletRefs = ['merchantRef', 'ecOrderRef', 'recipientId', 'parcelProfileRef', 'walletConsentRef']
    .filter(key => typeof input[key] !== 'string' || (input[key] as string).length === 0);
  const missingCarrierRefs = ['carrierCapabilityRef']
    .filter(key => typeof input[key] !== 'string' || (input[key] as string).length === 0);

  let requiredNextAction: HexashipMvpV01PreflightNextAction = 'call_hexaship_createShipment';
  if (rejectedKeys.length > 0) {
    requiredNextAction = 'remove_private_material';
  } else if (missingAddressWalletRefs.length > 0) {
    requiredNextAction = 'run_address_wallet_preflight';
  } else if (missingCarrierRefs.length > 0) {
    requiredNextAction = 'run_carrier_capability_preflight';
  }

  const safeInputRefs: HexashipMvpV01Preflight['safeInputRefs'] = {};
  for (const key of ['merchantRef', 'ecOrderRef', 'recipientId', 'addressFormVersion', 'parcelProfileRef', 'walletConsentRef', 'carrierCapabilityRef'] as const) {
    if (typeof input[key] === 'string' && input[key].length > 0) safeInputRefs[key] = input[key];
  }

  return {
    ok: requiredNextAction === 'call_hexaship_createShipment',
    version: HEXASHIP_DELIVERY_GATEWAY_VERSION,
    flow: 'hexaship-mvp-v0.1-preflight',
    missingAddressWalletRefs,
    missingCarrierRefs,
    rejectedKeys,
    requiredNextAction,
    safeInputRefs,
    safety: {
      localOnly: true,
      productionTraffic: false,
      rawAddressStored: false,
      carrierCredentialsAcceptedFromClient: false,
      privateMaterialExposed: false,
    },
    nonClaims: [
      'Preflight returns only refs and next actions; it does not resolve or expose recipient address material.',
      'Preflight does not call DHL, UPS, or production carrier endpoints.',
      'A ready preflight is permission to call the local Hexaship sandbox, not a production shipment guarantee.',
    ],
  };
}

export function runHexashipMvpV01Sandbox(input: Record<string, unknown>): HexashipMvpV01Result | HexashipGatewayError {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['merchantRef', 'ecOrderRef', 'recipientId', 'parcelProfileRef', 'walletConsentRef', 'carrierCapabilityRef']);
  if (missing) return missing;

  const selectionMode = normalizeMvpRoutingChoice(input.selectionMode);
  const selectedBy = normalizeSelectedBy(input.selectedBy);
  const recipientResolution = resolveAddressWalletRecipient(input);
  const shipment = createShipment({
    merchantRef: input.merchantRef,
    recipientId: input.recipientId,
    parcelProfileRef: input.parcelProfileRef,
    walletConsentRef: input.walletConsentRef,
    carrierPreference: 'auto',
    servicePreference: selectionMode,
    requestedAt: input.requestedAt,
  });
  if (shipment.ok === false) return shipment;

  const candidates = (['dhl', 'ups'] satisfies HexashipCarrier[])
    .map(carrier => deterministicRateCandidate({
      carrier,
      shipmentRef: shipment.body.shipmentRef,
      recipientId: input.recipientId as string,
      parcelProfileRef: input.parcelProfileRef as string,
      carrierCapabilityRef: input.carrierCapabilityRef as string,
      selectionMode,
    }));
  const selectedCandidate = [...candidates].sort((a, b) => (
    selectionMode === 'cheapest'
      ? a.priceMinor - b.priceMinor || a.etaMinutes - b.etaMinutes
      : a.etaMinutes - b.etaMinutes || a.priceMinor - b.priceMinor
  ))[0];
  const label = createLabel({
    shipmentRef: shipment.body.shipmentRef,
    rateRef: selectedCandidate.rateRef,
    walletConsentRef: input.walletConsentRef,
    carrierPreference: selectedCandidate.carrier,
    labelFormat: 'qr',
  });
  if (label.ok === false) return label;
  const tracking = trackShipment({
    shipmentRef: shipment.body.shipmentRef,
    trackingAlias: label.body.trackingAlias,
    carrier: selectedCandidate.carrier,
    status: 'in_transit',
  });
  if (tracking.ok === false) return tracking;

  const webhookLedger: HexashipMvpWebhookLedgerEntry[] = [
    webhookEntry({ eventType: 'shipment.created', shipmentRef: shipment.body.shipmentRef, status: 'created', requestedAt: input.requestedAt }),
    webhookEntry({ eventType: 'rates.created', shipmentRef: shipment.body.shipmentRef, status: 'rated', requestedAt: input.requestedAt }),
    webhookEntry({ eventType: 'carrier.selected', shipmentRef: shipment.body.shipmentRef, status: 'rated', requestedAt: input.requestedAt }),
    webhookEntry({
      eventType: 'label.created',
      shipmentRef: shipment.body.shipmentRef,
      trackingAlias: label.body.trackingAlias,
      status: 'label_created',
      requestedAt: input.requestedAt,
    }),
    webhookEntry({
      eventType: 'shipment.in_transit',
      shipmentRef: shipment.body.shipmentRef,
      trackingAlias: label.body.trackingAlias,
      status: 'in_transit',
      requestedAt: input.requestedAt,
    }),
  ];

  return {
    ok: true,
    version: HEXASHIP_DELIVERY_GATEWAY_VERSION,
    flow: 'hexaship-mvp-v0.1',
    ecOrderRef: input.ecOrderRef as string,
    recipientResolution,
    capability: {
      carrierCapabilityRef: input.carrierCapabilityRef as string,
      requiredNextAction: 'getRates',
      localOnly: true,
    },
    shipment: {
      shipmentRef: shipment.body.shipmentRef,
      status: 'created',
    },
    candidates,
    selection: {
      selectionMode,
      selectedBy,
      selectedCarrier: selectedCandidate.carrier,
      selectedRateRef: selectedCandidate.rateRef,
      decisionRef: ref('hx_carrier_decision', {
        shipmentRef: shipment.body.shipmentRef,
        selectionMode,
        selectedBy,
        selectedCarrier: selectedCandidate.carrier,
        selectedRateRef: selectedCandidate.rateRef,
      }),
    },
    label: {
      labelRef: label.body.labelRef,
      waybillAlias: label.body.waybillAlias,
      trackingAlias: label.body.trackingAlias,
      labelQrCommitment: label.body.labelQrCommitment,
      status: label.body.status,
    },
    tracking: {
      trackingAlias: tracking.body.trackingAlias,
      trackingReceiptRef: tracking.body.trackingReceiptRef,
      status: tracking.body.status,
    },
    webhookLedger,
    privacy: {
      rawAddressStored: false,
      recipientContactStored: false,
      carrierCredentialsAcceptedFromClient: false,
      rawCarrierPayloadStored: false,
    },
    localOnly: true,
    productionTraffic: false,
    nonClaims: [
      'MVP v0.1 is a local sandbox orchestration and does not purchase production DHL/UPS labels.',
      'Address Wallet recipient resolution returns a scoped reference, not raw address material.',
      'Carrier selection uses sandbox candidates and is not a real carrier SLA guarantee.',
    ],
  };
}

export function validateHexashipDeliveryGatewayPlan(plan: HexashipDeliveryGatewayPlan): string[] {
  const errors: string[] = [];
  const methods = new Set(plan.methods.map(method => method.method));
  const carriers = new Set(plan.carrierAdapters.map(adapter => adapter.carrier));

  if (plan.version !== HEXASHIP_DELIVERY_GATEWAY_VERSION) errors.push('version-mismatch');
  for (const method of ['createShipment', 'getRates', 'createLabel', 'trackShipment', 'createReturn'] satisfies HexashipGatewayMethod[]) {
    if (!methods.has(method)) errors.push(`missing-method:${method}`);
  }
  for (const carrier of ['dhl', 'ups'] satisfies HexashipCarrier[]) {
    if (!carriers.has(carrier)) errors.push(`missing-carrier:${carrier}`);
  }
  for (const adapter of plan.carrierAdapters) {
    if (!adapter.serverSideOnly) errors.push(`adapter-not-server-side:${adapter.carrier}`);
    if (adapter.publicClientAllowed) errors.push(`adapter-public-client:${adapter.carrier}`);
    for (const method of methods) {
      if (!adapter.supportedMethods.includes(method)) errors.push(`adapter-missing-method:${adapter.carrier}:${method}`);
    }
  }
  for (const method of plan.methods) {
    if (!method.blockedMaterial.includes('rawAddress')) errors.push(`method-missing-raw-address-block:${method.method}`);
    if (!method.blockedMaterial.includes('carrierApiKey')) errors.push(`method-missing-carrier-key-block:${method.method}`);
    if (JSON.stringify(method.safeOutputs).match(/rawAddress|carrierApiKey|proofWitness|privateKey/)) errors.push(`unsafe-output:${method.method}`);
  }
  if (plan.safety.rawAddressAllowedInPublicApi !== false) errors.push('raw-address-public-api-not-blocked');
  if (plan.safety.carrierCredentialsAllowedInClient !== false) errors.push('carrier-credentials-client-not-blocked');
  if (!plan.nonClaims.some(nonClaim => /not a claim that DHL and UPS support every service/i.test(nonClaim))) {
    errors.push('missing-carrier-support-non-claim');
  }

  return errors;
}
