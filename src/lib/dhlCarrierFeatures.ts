import { sha256Hex } from './sha256';

export const DHL_CARRIER_FEATURES_VERSION = 'dhl-carrier-features-v0.1';

export type DhlFeature =
  | 'serviceAvailability'
  | 'getRates'
  | 'createShipment'
  | 'createLabel'
  | 'trackShipment'
  | 'createReturn'
  | 'pickupRequest';

export type DhlServiceLevel = 'express_worldwide' | 'express_easy' | 'economy_select';
export type DhlShipmentStatus =
  | 'service_available'
  | 'rated'
  | 'shipment_created'
  | 'label_created'
  | 'in_transit'
  | 'delivered'
  | 'return_created'
  | 'pickup_requested';

export type DhlSafeFeatureInput = {
  countryCode: string;
  recipientId?: string;
  parcelProfileRef?: string;
  walletConsentRef?: string;
  carrierCapabilityRef?: string;
  shipmentRef?: string;
  rateRef?: string;
  trackingAlias?: string;
  pickupWindowRef?: string;
  reasonCode?: 'customer_return' | 'merchant_recall' | 'failed_delivery' | 'exchange';
  servicePreference?: 'fastest' | 'cheapest' | 'balanced';
  labelFormat?: 'qr' | 'pdf' | 'zpl';
  [key: string]: unknown;
};

export type DhlFeatureResult<T extends Record<string, unknown>> = {
  ok: true;
  version: typeof DHL_CARRIER_FEATURES_VERSION;
  carrier: 'dhl';
  feature: DhlFeature;
  operation: string;
  body: T & {
    localOnly: true;
    productionTraffic: false;
    rawAddressStored: false;
    rawCarrierPayloadStored: false;
    serverSideOnly: true;
    publicClientAllowed: false;
    blockedMaterial: string[];
    nonClaims: string[];
  };
};

export type DhlFeatureError = {
  ok: false;
  status: 400;
  error: 'bad_request' | 'private_material_rejected';
  missingKeys?: string[];
  rejectedKeys?: string[];
};

export type DhlFeatureResponse<T extends Record<string, unknown>> = DhlFeatureResult<T> | DhlFeatureError;

export type DhlFeaturePlan = {
  version: typeof DHL_CARRIER_FEATURES_VERSION;
  carrier: 'dhl';
  authBoundary: 'server-side-basic-auth-account';
  supportedFeatures: DhlFeature[];
  commonHexashipMethods: Array<'getRates' | 'createShipment' | 'createLabel' | 'trackShipment' | 'createReturn'>;
  dhlSpecificFeatures: Array<'serviceAvailability' | 'pickupRequest'>;
  requiredServerEnvKeys: string[];
  blockedMaterial: string[];
  productionTraffic: false;
  nonClaims: string[];
};

export const DHL_FEATURE_BLOCKED_MATERIAL = [
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
  'carrierSecret',
  'myDhlPassword',
  'basicAuthHeader',
  'rawLabelPayload',
  'rawTrackingPayload',
  'rawCarrierPayload',
] as const;

const REQUIRED_ENV_KEYS = [
  'HEXASHIP_DHL_MYDHL_BASE_URL',
  'HEXASHIP_DHL_MYDHL_USERNAME',
  'HEXASHIP_DHL_MYDHL_PASSWORD',
  'HEXASHIP_DHL_ACCOUNT_NUMBER',
] as const;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
}

function ref(prefix: string, value: unknown) {
  return `${prefix}_${sha256Hex(stableJson(value)).slice(0, 24)}`;
}

function collectRejectedKeys(value: unknown, path: string[] = []): string[] {
  if (value === null || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => collectRejectedKeys(item, [...path, String(index)]));
  const rejected: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    const fullPath = [...path, key].join('.');
    if (DHL_FEATURE_BLOCKED_MATERIAL.includes(key as typeof DHL_FEATURE_BLOCKED_MATERIAL[number])) rejected.push(fullPath);
    rejected.push(...collectRejectedKeys(nested, [...path, key]));
  }
  return rejected;
}

function rejectPrivateMaterial(input: Record<string, unknown>): DhlFeatureError | null {
  const rejectedKeys = collectRejectedKeys(input);
  return rejectedKeys.length > 0
    ? { ok: false, status: 400, error: 'private_material_rejected', rejectedKeys }
    : null;
}

function requireKeys(input: Record<string, unknown>, keys: string[]): DhlFeatureError | null {
  const missingKeys = keys.filter(key => typeof input[key] !== 'string' || (input[key] as string).trim().length === 0);
  return missingKeys.length > 0 ? { ok: false, status: 400, error: 'bad_request', missingKeys } : null;
}

function serviceLevel(input: DhlSafeFeatureInput): DhlServiceLevel {
  if (input.servicePreference === 'cheapest') return 'economy_select';
  if (input.servicePreference === 'balanced') return 'express_easy';
  return 'express_worldwide';
}

function ok<T extends Record<string, unknown>>(feature: DhlFeature, operation: string, body: T): DhlFeatureResult<T> {
  return {
    ok: true,
    version: DHL_CARRIER_FEATURES_VERSION,
    carrier: 'dhl',
    feature,
    operation,
    body: {
      ...body,
      localOnly: true,
      productionTraffic: false,
      rawAddressStored: false,
      rawCarrierPayloadStored: false,
      serverSideOnly: true,
      publicClientAllowed: false,
      blockedMaterial: [...DHL_FEATURE_BLOCKED_MATERIAL],
      nonClaims: [
        'DHL feature results are local sandbox refs, not production DHL purchases or service guarantees.',
        'DHL BasicAuth credentials and account numbers stay server-side only.',
        'Raw addresses, raw DHL documents, and raw carrier payloads are not exposed to merchant clients.',
      ],
    },
  };
}

export function buildDhlFeaturePlan(): DhlFeaturePlan {
  return {
    version: DHL_CARRIER_FEATURES_VERSION,
    carrier: 'dhl',
    authBoundary: 'server-side-basic-auth-account',
    supportedFeatures: ['serviceAvailability', 'getRates', 'createShipment', 'createLabel', 'trackShipment', 'createReturn', 'pickupRequest'],
    commonHexashipMethods: ['getRates', 'createShipment', 'createLabel', 'trackShipment', 'createReturn'],
    dhlSpecificFeatures: ['serviceAvailability', 'pickupRequest'],
    requiredServerEnvKeys: [...REQUIRED_ENV_KEYS],
    blockedMaterial: [...DHL_FEATURE_BLOCKED_MATERIAL],
    productionTraffic: false,
    nonClaims: [
      'Feature presence is not a live DHL contract.',
      'Country, postal-code, customs, and service availability must be checked at runtime.',
      'Sandbox refs do not create labels, pickups, tracking events, returns, or carriage contracts at DHL.',
    ],
  };
}

export function validateDhlFeaturePlan(plan: DhlFeaturePlan): string[] {
  const errors: string[] = [];
  if (plan.version !== DHL_CARRIER_FEATURES_VERSION) errors.push('version-mismatch');
  if (plan.carrier !== 'dhl') errors.push('carrier-mismatch');
  if (plan.authBoundary !== 'server-side-basic-auth-account') errors.push('auth-boundary-mismatch');
  for (const feature of ['serviceAvailability', 'getRates', 'createShipment', 'createLabel', 'trackShipment', 'createReturn', 'pickupRequest'] satisfies DhlFeature[]) {
    if (!plan.supportedFeatures.includes(feature)) errors.push(`missing-feature:${feature}`);
  }
  for (const key of REQUIRED_ENV_KEYS) {
    if (!plan.requiredServerEnvKeys.includes(key)) errors.push(`missing-env-key:${key}`);
  }
  for (const blocked of ['rawAddress', 'carrierApiKey', 'myDhlPassword', 'basicAuthHeader', 'rawCarrierPayload']) {
    if (!plan.blockedMaterial.includes(blocked)) errors.push(`missing-blocked-material:${blocked}`);
  }
  if (plan.productionTraffic !== false) errors.push('production-traffic-not-false');
  if (!plan.nonClaims.some(nonClaim => /not a live DHL contract/i.test(nonClaim))) errors.push('missing-contract-non-claim');
  return errors;
}

export function checkDhlServiceAvailability(input: DhlSafeFeatureInput): DhlFeatureResponse<{
  serviceAvailabilityRef: string;
  countryCode: string;
  availableServiceLevel: DhlServiceLevel;
  requiredNextAction: 'getRates';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['countryCode', 'recipientId', 'walletConsentRef']);
  if (missing) return missing;
  const countryCode = input.countryCode.trim().toUpperCase();
  return ok('serviceAvailability', 'mydhl.service.availability', {
    serviceAvailabilityRef: ref('dhl_service_availability', {
      countryCode,
      recipientId: input.recipientId,
      walletConsentRef: input.walletConsentRef,
      servicePreference: input.servicePreference ?? 'fastest',
    }),
    countryCode,
    availableServiceLevel: serviceLevel({ ...input, countryCode }),
    requiredNextAction: 'getRates',
  });
}

export function getDhlRates(input: DhlSafeFeatureInput): DhlFeatureResponse<{
  rateRef: string;
  countryCode: string;
  serviceLevel: DhlServiceLevel;
  priceEstimateRef: string;
  etaWindowRef: string;
  requiredNextAction: 'createShipment';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['countryCode', 'recipientId', 'parcelProfileRef', 'carrierCapabilityRef']);
  if (missing) return missing;
  const countryCode = input.countryCode.trim().toUpperCase();
  const level = serviceLevel({ ...input, countryCode });
  const rateRef = ref('dhl_rate', {
    countryCode,
    recipientId: input.recipientId,
    parcelProfileRef: input.parcelProfileRef,
    carrierCapabilityRef: input.carrierCapabilityRef,
    serviceLevel: level,
  });
  return ok('getRates', 'mydhl.rates', {
    rateRef,
    countryCode,
    serviceLevel: level,
    priceEstimateRef: ref('dhl_price', { rateRef, level }),
    etaWindowRef: ref('dhl_eta', { rateRef, level }),
    requiredNextAction: 'createShipment',
  });
}

export function createDhlShipment(input: DhlSafeFeatureInput): DhlFeatureResponse<{
  shipmentRef: string;
  countryCode: string;
  rateRef: string;
  status: DhlShipmentStatus;
  requiredNextAction: 'createLabel';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['countryCode', 'recipientId', 'parcelProfileRef', 'walletConsentRef', 'rateRef']);
  if (missing) return missing;
  return ok('createShipment', 'mydhl.shipments.create', {
    shipmentRef: ref('dhl_ship', {
      countryCode: input.countryCode.trim().toUpperCase(),
      recipientId: input.recipientId,
      parcelProfileRef: input.parcelProfileRef,
      walletConsentRef: input.walletConsentRef,
      rateRef: input.rateRef,
    }),
    countryCode: input.countryCode.trim().toUpperCase(),
    rateRef: input.rateRef as string,
    status: 'shipment_created',
    requiredNextAction: 'createLabel',
  });
}

export function createDhlLabel(input: DhlSafeFeatureInput): DhlFeatureResponse<{
  labelRef: string;
  shipmentRef: string;
  trackingAlias: string;
  labelArtifact: 'documentsRef';
  labelFormat: 'qr' | 'pdf' | 'zpl';
  status: DhlShipmentStatus;
  requiredNextAction: 'trackShipment';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['shipmentRef', 'walletConsentRef']);
  if (missing) return missing;
  const labelFormat = input.labelFormat === 'pdf' || input.labelFormat === 'zpl' ? input.labelFormat : 'qr';
  const labelRef = ref('dhl_label', { shipmentRef: input.shipmentRef, labelFormat });
  return ok('createLabel', 'mydhl.shipments.documents', {
    labelRef,
    shipmentRef: input.shipmentRef as string,
    trackingAlias: ref('dhl_track', { labelRef }),
    labelArtifact: 'documentsRef',
    labelFormat,
    status: 'label_created',
    requiredNextAction: 'trackShipment',
  });
}

export function trackDhlShipment(input: DhlSafeFeatureInput): DhlFeatureResponse<{
  trackingReceiptRef: string;
  trackingAlias: string;
  status: DhlShipmentStatus;
  eventFingerprint: string;
  requiredNextAction: 'wait_for_carrier_event' | 'createReturn';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['trackingAlias']);
  if (missing) return missing;
  const status: DhlShipmentStatus = input.status === 'delivered' ? 'delivered' : 'in_transit';
  return ok('trackShipment', 'mydhl.tracking.get', {
    trackingReceiptRef: ref('dhl_tracking_receipt', { trackingAlias: input.trackingAlias, status }),
    trackingAlias: input.trackingAlias as string,
    status,
    eventFingerprint: ref('dhl_event', { trackingAlias: input.trackingAlias, status }),
    requiredNextAction: status === 'delivered' ? 'createReturn' : 'wait_for_carrier_event',
  });
}

export function createDhlReturn(input: DhlSafeFeatureInput): DhlFeatureResponse<{
  returnRef: string;
  shipmentRef: string;
  reasonCode: string;
  returnLabelRef: string;
  returnTrackingAlias: string;
  status: DhlShipmentStatus;
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['shipmentRef', 'reasonCode', 'walletConsentRef']);
  if (missing) return missing;
  const returnRef = ref('dhl_return', {
    shipmentRef: input.shipmentRef,
    reasonCode: input.reasonCode,
    walletConsentRef: input.walletConsentRef,
  });
  return ok('createReturn', 'mydhl.returns.create-or-label', {
    returnRef,
    shipmentRef: input.shipmentRef as string,
    reasonCode: input.reasonCode as string,
    returnLabelRef: ref('dhl_return_label', { returnRef }),
    returnTrackingAlias: ref('dhl_return_track', { returnRef }),
    status: 'return_created',
  });
}

export function requestDhlPickup(input: DhlSafeFeatureInput): DhlFeatureResponse<{
  pickupRef: string;
  shipmentRef: string;
  pickupWindowRef: string;
  status: DhlShipmentStatus;
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['shipmentRef', 'pickupWindowRef', 'walletConsentRef']);
  if (missing) return missing;
  return ok('pickupRequest', 'mydhl.pickups.create', {
    pickupRef: ref('dhl_pickup', {
      shipmentRef: input.shipmentRef,
      pickupWindowRef: input.pickupWindowRef,
      walletConsentRef: input.walletConsentRef,
    }),
    shipmentRef: input.shipmentRef as string,
    pickupWindowRef: input.pickupWindowRef as string,
    status: 'pickup_requested',
  });
}

export function runDhlSandboxFeatureFlow(input: DhlSafeFeatureInput): DhlFeatureResponse<{
  serviceAvailabilityRef: string;
  rateRef: string;
  shipmentRef: string;
  labelRef: string;
  trackingAlias: string;
  trackingReceiptRef: string;
  returnRef: string;
  pickupRef: string;
  completedFeatures: DhlFeature[];
}> {
  const availability = checkDhlServiceAvailability(input);
  if (availability.ok === false) return availability;
  const rates = getDhlRates(input);
  if (rates.ok === false) return rates;
  const shipment = createDhlShipment({ ...input, rateRef: rates.body.rateRef });
  if (shipment.ok === false) return shipment;
  const label = createDhlLabel({ ...input, shipmentRef: shipment.body.shipmentRef });
  if (label.ok === false) return label;
  const tracking = trackDhlShipment({ ...input, trackingAlias: label.body.trackingAlias });
  if (tracking.ok === false) return tracking;
  const returnAuth = createDhlReturn({
    ...input,
    shipmentRef: shipment.body.shipmentRef,
    reasonCode: input.reasonCode ?? 'customer_return',
  });
  if (returnAuth.ok === false) return returnAuth;
  const pickup = requestDhlPickup({
    ...input,
    shipmentRef: shipment.body.shipmentRef,
    pickupWindowRef: input.pickupWindowRef ?? 'pickup_window_synthetic_dhl_next_day',
  });
  if (pickup.ok === false) return pickup;

  return ok('pickupRequest', 'dhl.sandbox.fullFeatureFlow', {
    serviceAvailabilityRef: availability.body.serviceAvailabilityRef,
    rateRef: rates.body.rateRef,
    shipmentRef: shipment.body.shipmentRef,
    labelRef: label.body.labelRef,
    trackingAlias: label.body.trackingAlias,
    trackingReceiptRef: tracking.body.trackingReceiptRef,
    returnRef: returnAuth.body.returnRef,
    pickupRef: pickup.body.pickupRef,
    completedFeatures: ['serviceAvailability', 'getRates', 'createShipment', 'createLabel', 'trackShipment', 'createReturn', 'pickupRequest'],
  });
}
