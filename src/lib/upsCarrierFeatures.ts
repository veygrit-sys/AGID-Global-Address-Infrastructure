import { sha256Hex } from './sha256';

export const UPS_CARRIER_FEATURES_VERSION = 'ups-carrier-features-v0.1';

export type UpsFeature =
  | 'addressValidation'
  | 'getRates'
  | 'createShipment'
  | 'createLabel'
  | 'trackShipment'
  | 'createReturn';

export type UpsServiceLevel = 'ground' | 'standard' | 'express' | 'worldwide';
export type UpsShipmentStatus = 'validated' | 'rated' | 'shipment_created' | 'label_created' | 'in_transit' | 'delivered' | 'return_created';

export type UpsSafeFeatureInput = {
  countryCode: string;
  recipientId?: string;
  parcelProfileRef?: string;
  walletConsentRef?: string;
  carrierCapabilityRef?: string;
  shipmentRef?: string;
  rateRef?: string;
  trackingAlias?: string;
  reasonCode?: 'customer_return' | 'merchant_recall' | 'failed_delivery' | 'exchange';
  servicePreference?: 'fastest' | 'cheapest' | 'balanced';
  labelFormat?: 'qr' | 'pdf' | 'zpl';
  [key: string]: unknown;
};

export type UpsFeatureResult<T extends Record<string, unknown>> = {
  ok: true;
  version: typeof UPS_CARRIER_FEATURES_VERSION;
  carrier: 'ups';
  feature: UpsFeature;
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

export type UpsFeatureError = {
  ok: false;
  status: 400;
  error: 'bad_request' | 'private_material_rejected';
  missingKeys?: string[];
  rejectedKeys?: string[];
};

export type UpsFeatureResponse<T extends Record<string, unknown>> = UpsFeatureResult<T> | UpsFeatureError;

export type UpsFeaturePlan = {
  version: typeof UPS_CARRIER_FEATURES_VERSION;
  carrier: 'ups';
  authBoundary: 'server-side-oauth-client-credentials';
  supportedFeatures: UpsFeature[];
  commonHexashipMethods: Array<'getRates' | 'createShipment' | 'createLabel' | 'trackShipment' | 'createReturn'>;
  upsSpecificFeatures: Array<'addressValidation'>;
  requiredServerEnvKeys: string[];
  blockedMaterial: string[];
  productionTraffic: false;
  nonClaims: string[];
};

export const UPS_FEATURE_BLOCKED_MATERIAL = [
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
  'clientSecret',
  'accessToken',
  'rawLabelPayload',
  'rawTrackingPayload',
  'rawCarrierPayload',
] as const;

const REQUIRED_ENV_KEYS = [
  'HEXASHIP_UPS_BASE_URL',
  'HEXASHIP_UPS_CLIENT_ID',
  'HEXASHIP_UPS_CLIENT_SECRET',
  'HEXASHIP_UPS_ACCOUNT_NUMBER',
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
    if (UPS_FEATURE_BLOCKED_MATERIAL.includes(key as typeof UPS_FEATURE_BLOCKED_MATERIAL[number])) rejected.push(fullPath);
    rejected.push(...collectRejectedKeys(nested, [...path, key]));
  }
  return rejected;
}

function rejectPrivateMaterial(input: Record<string, unknown>): UpsFeatureError | null {
  const rejectedKeys = collectRejectedKeys(input);
  return rejectedKeys.length > 0
    ? { ok: false, status: 400, error: 'private_material_rejected', rejectedKeys }
    : null;
}

function requireKeys(input: Record<string, unknown>, keys: string[]): UpsFeatureError | null {
  const missingKeys = keys.filter(key => typeof input[key] !== 'string' || (input[key] as string).trim().length === 0);
  return missingKeys.length > 0 ? { ok: false, status: 400, error: 'bad_request', missingKeys } : null;
}

function serviceLevel(input: UpsSafeFeatureInput): UpsServiceLevel {
  if (input.countryCode.trim().toUpperCase() !== 'US') return 'worldwide';
  if (input.servicePreference === 'fastest') return 'express';
  if (input.servicePreference === 'cheapest') return 'ground';
  return 'standard';
}

function ok<T extends Record<string, unknown>>(feature: UpsFeature, operation: string, body: T): UpsFeatureResult<T> {
  return {
    ok: true,
    version: UPS_CARRIER_FEATURES_VERSION,
    carrier: 'ups',
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
      blockedMaterial: [...UPS_FEATURE_BLOCKED_MATERIAL],
      nonClaims: [
        'UPS feature results are local sandbox refs, not production UPS purchases or service guarantees.',
        'UPS OAuth client credentials and bearer tokens stay server-side only.',
        'Raw addresses and raw UPS payloads are not exposed to merchant clients.',
      ],
    },
  };
}

export function buildUpsFeaturePlan(): UpsFeaturePlan {
  return {
    version: UPS_CARRIER_FEATURES_VERSION,
    carrier: 'ups',
    authBoundary: 'server-side-oauth-client-credentials',
    supportedFeatures: ['addressValidation', 'getRates', 'createShipment', 'createLabel', 'trackShipment', 'createReturn'],
    commonHexashipMethods: ['getRates', 'createShipment', 'createLabel', 'trackShipment', 'createReturn'],
    upsSpecificFeatures: ['addressValidation'],
    requiredServerEnvKeys: [...REQUIRED_ENV_KEYS],
    blockedMaterial: [...UPS_FEATURE_BLOCKED_MATERIAL],
    productionTraffic: false,
    nonClaims: [
      'Feature presence is not a live UPS contract.',
      'Country and postal-code service availability must be checked at runtime.',
      'Sandbox refs do not create labels, pickups, tracking events, or returns at UPS.',
    ],
  };
}

export function validateUpsFeaturePlan(plan: UpsFeaturePlan): string[] {
  const errors: string[] = [];
  if (plan.version !== UPS_CARRIER_FEATURES_VERSION) errors.push('version-mismatch');
  if (plan.carrier !== 'ups') errors.push('carrier-mismatch');
  if (plan.authBoundary !== 'server-side-oauth-client-credentials') errors.push('auth-boundary-mismatch');
  for (const feature of ['addressValidation', 'getRates', 'createShipment', 'createLabel', 'trackShipment', 'createReturn'] satisfies UpsFeature[]) {
    if (!plan.supportedFeatures.includes(feature)) errors.push(`missing-feature:${feature}`);
  }
  for (const key of REQUIRED_ENV_KEYS) {
    if (!plan.requiredServerEnvKeys.includes(key)) errors.push(`missing-env-key:${key}`);
  }
  for (const blocked of ['rawAddress', 'carrierApiKey', 'clientSecret', 'accessToken', 'rawCarrierPayload']) {
    if (!plan.blockedMaterial.includes(blocked)) errors.push(`missing-blocked-material:${blocked}`);
  }
  if (plan.productionTraffic !== false) errors.push('production-traffic-not-false');
  if (!plan.nonClaims.some(nonClaim => /not a live UPS contract/i.test(nonClaim))) errors.push('missing-contract-non-claim');
  return errors;
}

export function validateUpsAddress(input: UpsSafeFeatureInput): UpsFeatureResponse<{
  addressValidationRef: string;
  countryCode: string;
  validationScope: 'street_level' | 'city_postcode_level';
  requiredNextAction: 'getRates';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['countryCode', 'recipientId', 'walletConsentRef']);
  if (missing) return missing;
  const countryCode = input.countryCode.trim().toUpperCase();
  return ok('addressValidation', 'ups.addressvalidation.validate', {
    addressValidationRef: ref('ups_addr_validation', {
      countryCode,
      recipientId: input.recipientId,
      walletConsentRef: input.walletConsentRef,
    }),
    countryCode,
    validationScope: countryCode === 'US' ? 'street_level' : 'city_postcode_level',
    requiredNextAction: 'getRates',
  });
}

export function getUpsRates(input: UpsSafeFeatureInput): UpsFeatureResponse<{
  rateRef: string;
  countryCode: string;
  serviceLevel: UpsServiceLevel;
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
  const rateRef = ref('ups_rate', {
    countryCode,
    recipientId: input.recipientId,
    parcelProfileRef: input.parcelProfileRef,
    carrierCapabilityRef: input.carrierCapabilityRef,
    serviceLevel: level,
  });
  return ok('getRates', 'ups.rating.rate', {
    rateRef,
    countryCode,
    serviceLevel: level,
    priceEstimateRef: ref('ups_price', { rateRef, level }),
    etaWindowRef: ref('ups_eta', { rateRef, level }),
    requiredNextAction: 'createShipment',
  });
}

export function createUpsShipment(input: UpsSafeFeatureInput): UpsFeatureResponse<{
  shipmentRef: string;
  countryCode: string;
  rateRef: string;
  status: UpsShipmentStatus;
  requiredNextAction: 'createLabel';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['countryCode', 'recipientId', 'parcelProfileRef', 'walletConsentRef', 'rateRef']);
  if (missing) return missing;
  return ok('createShipment', 'ups.shipping.shipment', {
    shipmentRef: ref('ups_ship', {
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

export function createUpsLabel(input: UpsSafeFeatureInput): UpsFeatureResponse<{
  labelRef: string;
  shipmentRef: string;
  trackingAlias: string;
  labelArtifact: 'labelImageRef';
  labelFormat: 'qr' | 'pdf' | 'zpl';
  status: UpsShipmentStatus;
  requiredNextAction: 'trackShipment';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['shipmentRef', 'walletConsentRef']);
  if (missing) return missing;
  const labelFormat = input.labelFormat === 'pdf' || input.labelFormat === 'zpl' ? input.labelFormat : 'qr';
  const labelRef = ref('ups_label', { shipmentRef: input.shipmentRef, labelFormat });
  return ok('createLabel', 'ups.shipping.labelImage', {
    labelRef,
    shipmentRef: input.shipmentRef as string,
    trackingAlias: ref('ups_track', { labelRef }),
    labelArtifact: 'labelImageRef',
    labelFormat,
    status: 'label_created',
    requiredNextAction: 'trackShipment',
  });
}

export function trackUpsShipment(input: UpsSafeFeatureInput): UpsFeatureResponse<{
  trackingReceiptRef: string;
  trackingAlias: string;
  status: UpsShipmentStatus;
  eventFingerprint: string;
  requiredNextAction: 'wait_for_carrier_event' | 'createReturn';
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['trackingAlias']);
  if (missing) return missing;
  const status: UpsShipmentStatus = input.status === 'delivered' ? 'delivered' : 'in_transit';
  return ok('trackShipment', 'ups.tracking.track', {
    trackingReceiptRef: ref('ups_tracking_receipt', { trackingAlias: input.trackingAlias, status }),
    trackingAlias: input.trackingAlias as string,
    status,
    eventFingerprint: ref('ups_event', { trackingAlias: input.trackingAlias, status }),
    requiredNextAction: status === 'delivered' ? 'createReturn' : 'wait_for_carrier_event',
  });
}

export function createUpsReturn(input: UpsSafeFeatureInput): UpsFeatureResponse<{
  returnRef: string;
  shipmentRef: string;
  reasonCode: string;
  returnLabelRef: string;
  returnTrackingAlias: string;
  status: UpsShipmentStatus;
}> {
  const privateRejection = rejectPrivateMaterial(input);
  if (privateRejection) return privateRejection;
  const missing = requireKeys(input, ['shipmentRef', 'reasonCode', 'walletConsentRef']);
  if (missing) return missing;
  const returnRef = ref('ups_return', {
    shipmentRef: input.shipmentRef,
    reasonCode: input.reasonCode,
    walletConsentRef: input.walletConsentRef,
  });
  return ok('createReturn', 'ups.returns.shipment', {
    returnRef,
    shipmentRef: input.shipmentRef as string,
    reasonCode: input.reasonCode as string,
    returnLabelRef: ref('ups_return_label', { returnRef }),
    returnTrackingAlias: ref('ups_return_track', { returnRef }),
    status: 'return_created',
  });
}

export function runUpsSandboxFeatureFlow(input: UpsSafeFeatureInput): UpsFeatureResponse<{
  addressValidationRef: string;
  rateRef: string;
  shipmentRef: string;
  labelRef: string;
  trackingAlias: string;
  trackingReceiptRef: string;
  returnRef: string;
  completedFeatures: UpsFeature[];
}> {
  const validation = validateUpsAddress(input);
  if (validation.ok === false) return validation;
  const rates = getUpsRates(input);
  if (rates.ok === false) return rates;
  const shipment = createUpsShipment({ ...input, rateRef: rates.body.rateRef });
  if (shipment.ok === false) return shipment;
  const label = createUpsLabel({ ...input, shipmentRef: shipment.body.shipmentRef });
  if (label.ok === false) return label;
  const tracking = trackUpsShipment({ ...input, trackingAlias: label.body.trackingAlias });
  if (tracking.ok === false) return tracking;
  const returnAuth = createUpsReturn({
    ...input,
    shipmentRef: shipment.body.shipmentRef,
    reasonCode: input.reasonCode ?? 'customer_return',
  });
  if (returnAuth.ok === false) return returnAuth;

  return ok('createReturn', 'ups.sandbox.fullFeatureFlow', {
    addressValidationRef: validation.body.addressValidationRef,
    rateRef: rates.body.rateRef,
    shipmentRef: shipment.body.shipmentRef,
    labelRef: label.body.labelRef,
    trackingAlias: label.body.trackingAlias,
    trackingReceiptRef: tracking.body.trackingReceiptRef,
    returnRef: returnAuth.body.returnRef,
    completedFeatures: ['addressValidation', 'getRates', 'createShipment', 'createLabel', 'trackShipment', 'createReturn'],
  });
}
