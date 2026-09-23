import { sha256Hex } from './sha256';

export const CANADA_CARRIER_STRENGTHENING_VERSION = 'canada-carrier-strengthening-v0.1';

export type CanadaCarrier = 'ups' | 'dhl';
export type CanadaObjective = 'cheapest' | 'fastest' | 'balanced' | 'returns_first' | 'cross_border';
export type CanadaLaneId = 'ca-domestic-standard' | 'ca-domestic-express' | 'ca-us-cross-border' | 'ca-return' | 'ca-postal-validation';

export type CanadaLane = {
  laneId: CanadaLaneId;
  primaryCarrier: CanadaCarrier;
  runtimeCandidateCarriers: CanadaCarrier[];
  requiredFeatures: string[];
  requiredRefs: string[];
  merchantVisibleOutputs: string[];
  blockedMaterial: string[];
  nonClaims: string[];
};

export type CanadaCarrierPlan = {
  version: typeof CANADA_CARRIER_STRENGTHENING_VERSION;
  productName: 'Canada Carrier Strengthening';
  countryCode: 'CA';
  strategy: string;
  defaultCarrier: 'ups';
  runtimeCandidateCarriers: CanadaCarrier[];
  lanes: CanadaLane[];
  addressWalletRequirements: string[];
  selectionPolicy: Record<CanadaObjective, {
    firstChoice: CanadaCarrier;
    dhlTreatment: 'runtime_candidate_only' | 'express_cross_border_candidate';
    requiredGate: string;
  }>;
  safety: {
    localOnly: true;
    productionTraffic: false;
    rawAddressAllowedInPublicApi: false;
    carrierCredentialsAllowedInClient: false;
  };
  nonClaims: string[];
};

export type CanadaCarrierPreflightInput = {
  originCountryCode?: string;
  destinationCountryCode?: string;
  recipientId?: string;
  walletConsentRef?: string;
  parcelProfileRef?: string;
  carrierCapabilityRef?: string;
  postalValidationRef?: string;
  customsIntentRef?: string;
  objective?: CanadaObjective;
  [key: string]: unknown;
};

export type CanadaCarrierPreflight = {
  ok: boolean;
  version: typeof CANADA_CARRIER_STRENGTHENING_VERSION;
  laneId: CanadaLaneId;
  objective: CanadaObjective;
  selectedCarrier: CanadaCarrier;
  candidateCarriers: CanadaCarrier[];
  originCountryCode: string;
  destinationCountryCode: string;
  missingRefs: string[];
  rejectedKeys: string[];
  requiredNextAction:
    | 'collect_canada_wallet_refs'
    | 'run_canada_postal_validation'
    | 'run_carrier_capability_check'
    | 'prepare_cross_border_customs'
    | 'ready_for_canada_rates';
  safeRefs: {
    recipientId?: string;
    walletConsentRef?: string;
    parcelProfileRef?: string;
    carrierCapabilityRef?: string;
    postalValidationRef?: string;
    customsIntentRef?: string;
  };
  localOnly: true;
  productionTraffic: false;
  nonClaims: string[];
};

export const CANADA_BLOCKED_MATERIAL = [
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
  'myDhlPassword',
  'basicAuthHeader',
  'customsDescription',
  'rawCustomsPayload',
  'rawLabelPayload',
  'rawTrackingPayload',
  'rawCarrierPayload',
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
    if (CANADA_BLOCKED_MATERIAL.includes(key as typeof CANADA_BLOCKED_MATERIAL[number])) rejected.push(fullPath);
    rejected.push(...collectRejectedKeys(nested, [...path, key]));
  }
  return rejected;
}

function normalizeObjective(value: unknown): CanadaObjective {
  if (value === 'cheapest' || value === 'fastest' || value === 'returns_first' || value === 'cross_border') return value;
  return 'balanced';
}

function normalizeCountry(value: unknown, fallback: 'CA' | 'US'): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().toUpperCase() : fallback;
}

function isCanadaDomestic(origin: string, destination: string) {
  return origin === 'CA' && destination === 'CA';
}

function isCanadaUsCrossBorder(origin: string, destination: string) {
  return (origin === 'CA' && destination === 'US') || (origin === 'US' && destination === 'CA');
}

function laneFor(input: { objective: CanadaObjective; origin: string; destination: string }): CanadaLaneId {
  if (input.objective === 'returns_first') return 'ca-return';
  if (input.objective === 'cross_border' || isCanadaUsCrossBorder(input.origin, input.destination)) return 'ca-us-cross-border';
  if (input.objective === 'fastest') return 'ca-domestic-express';
  if (input.objective === 'cheapest' || input.objective === 'balanced') return 'ca-domestic-standard';
  return 'ca-postal-validation';
}

export function buildCanadaCarrierPlan(): CanadaCarrierPlan {
  const sharedRefs = ['recipientId', 'walletConsentRef', 'parcelProfileRef', 'carrierCapabilityRef'];
  const sharedNonClaims = [
    'Canada strengthening is not a live UPS or DHL service guarantee.',
    'DHL is treated as an Express and cross-border runtime candidate, not the default Canada domestic carrier.',
    'Rates, labels, tracking, returns, customs, and pickup outcomes must be checked server-side at runtime.',
  ];

  return {
    version: CANADA_CARRIER_STRENGTHENING_VERSION,
    productName: 'Canada Carrier Strengthening',
    countryCode: 'CA',
    strategy:
      'Use UPS as the default Canada domestic and North America operations path; use DHL as an Express/cross-border runtime candidate after service availability and customs intent gates pass.',
    defaultCarrier: 'ups',
    runtimeCandidateCarriers: ['ups', 'dhl'],
    lanes: [
      {
        laneId: 'ca-domestic-standard',
        primaryCarrier: 'ups',
        runtimeCandidateCarriers: ['ups'],
        requiredFeatures: ['ups.getRates', 'ups.createShipment', 'ups.createLabel', 'ups.trackShipment'],
        requiredRefs: [...sharedRefs, 'postalValidationRef'],
        merchantVisibleOutputs: ['rateRef', 'shipmentRef', 'labelRef', 'trackingAlias'],
        blockedMaterial: [...CANADA_BLOCKED_MATERIAL],
        nonClaims: [...sharedNonClaims],
      },
      {
        laneId: 'ca-domestic-express',
        primaryCarrier: 'ups',
        runtimeCandidateCarriers: ['ups', 'dhl'],
        requiredFeatures: ['ups.getRates', 'dhl.serviceAvailability', 'dhl.getRates', 'carrierAllocation'],
        requiredRefs: [...sharedRefs, 'postalValidationRef'],
        merchantVisibleOutputs: ['rateRef', 'selectedCarrier', 'etaWindowRef', 'priceEstimateRef'],
        blockedMaterial: [...CANADA_BLOCKED_MATERIAL],
        nonClaims: [...sharedNonClaims],
      },
      {
        laneId: 'ca-us-cross-border',
        primaryCarrier: 'ups',
        runtimeCandidateCarriers: ['ups', 'dhl'],
        requiredFeatures: ['ups.getRates', 'dhl.serviceAvailability', 'customsIntent', 'carrierAllocation'],
        requiredRefs: [...sharedRefs, 'postalValidationRef', 'customsIntentRef'],
        merchantVisibleOutputs: ['rateRef', 'selectedCarrier', 'customsIntentRef', 'etaWindowRef'],
        blockedMaterial: [...CANADA_BLOCKED_MATERIAL],
        nonClaims: [...sharedNonClaims],
      },
      {
        laneId: 'ca-return',
        primaryCarrier: 'ups',
        runtimeCandidateCarriers: ['ups'],
        requiredFeatures: ['ups.createReturn', 'ups.trackShipment'],
        requiredRefs: [...sharedRefs, 'shipmentRef'],
        merchantVisibleOutputs: ['returnRef', 'returnLabelRef', 'returnTrackingAlias'],
        blockedMaterial: [...CANADA_BLOCKED_MATERIAL],
        nonClaims: [...sharedNonClaims],
      },
      {
        laneId: 'ca-postal-validation',
        primaryCarrier: 'ups',
        runtimeCandidateCarriers: ['ups'],
        requiredFeatures: ['addressWallet.countryForm', 'canada.postalValidation', 'addressWallet.walletConsentHandoff'],
        requiredRefs: ['recipientId', 'walletConsentRef', 'postalValidationRef'],
        merchantVisibleOutputs: ['postalValidationRef', 'recipientId'],
        blockedMaterial: [...CANADA_BLOCKED_MATERIAL],
        nonClaims: [...sharedNonClaims],
      },
    ],
    addressWalletRequirements: ['recipient', 'countryCode', 'postalCode', 'province', 'city', 'street'],
    selectionPolicy: {
      cheapest: {
        firstChoice: 'ups',
        dhlTreatment: 'runtime_candidate_only',
        requiredGate: 'UPS Canada rating and Canada postal validation must pass before label creation.',
      },
      fastest: {
        firstChoice: 'ups',
        dhlTreatment: 'express_cross_border_candidate',
        requiredGate: 'Compare UPS express candidate with DHL Express only after DHL service availability passes.',
      },
      balanced: {
        firstChoice: 'ups',
        dhlTreatment: 'runtime_candidate_only',
        requiredGate: 'Prefer UPS unless DHL passes runtime capability and improves ETA/risk score.',
      },
      returns_first: {
        firstChoice: 'ups',
        dhlTreatment: 'runtime_candidate_only',
        requiredGate: 'UPS return flow must pass before return label exposure.',
      },
      cross_border: {
        firstChoice: 'ups',
        dhlTreatment: 'express_cross_border_candidate',
        requiredGate: 'CA-US customs intent and DHL service availability are required before DHL joins allocation.',
      },
    },
    safety: {
      localOnly: true,
      productionTraffic: false,
      rawAddressAllowedInPublicApi: false,
      carrierCredentialsAllowedInClient: false,
    },
    nonClaims: [...sharedNonClaims],
  };
}

export function validateCanadaCarrierPlan(plan: CanadaCarrierPlan): string[] {
  const errors: string[] = [];
  if (plan.version !== CANADA_CARRIER_STRENGTHENING_VERSION) errors.push('version-mismatch');
  if (plan.countryCode !== 'CA') errors.push('country-not-ca');
  if (plan.defaultCarrier !== 'ups') errors.push('default-carrier-not-ups');
  if (plan.safety.productionTraffic !== false) errors.push('production-traffic-not-false');
  if (plan.safety.rawAddressAllowedInPublicApi !== false) errors.push('raw-address-public-api-not-false');
  for (const lane of ['ca-domestic-standard', 'ca-domestic-express', 'ca-us-cross-border', 'ca-return', 'ca-postal-validation'] satisfies CanadaLaneId[]) {
    if (!plan.lanes.some(item => item.laneId === lane)) errors.push(`missing-lane:${lane}`);
  }
  const crossBorder = plan.lanes.find(lane => lane.laneId === 'ca-us-cross-border');
  if (!crossBorder?.runtimeCandidateCarriers.includes('dhl')) errors.push('cross-border-lane-missing-dhl-runtime-candidate');
  if (!crossBorder?.requiredRefs.includes('customsIntentRef')) errors.push('cross-border-lane-missing-customs-intent');
  for (const lane of plan.lanes) {
    if (lane.primaryCarrier !== 'ups') errors.push(`lane-primary-not-ups:${lane.laneId}`);
    if (!lane.blockedMaterial.includes('rawAddress')) errors.push(`lane-missing-raw-address-block:${lane.laneId}`);
    if (!lane.nonClaims.some(nonClaim => /not a live UPS or DHL service guarantee/i.test(nonClaim))) {
      errors.push(`lane-missing-service-non-claim:${lane.laneId}`);
    }
  }
  if (!plan.addressWalletRequirements.includes('postalCode')) errors.push('missing-canada-postal-code-requirement');
  if (!plan.selectionPolicy.cross_border.requiredGate.includes('customs intent')) errors.push('missing-cross-border-customs-gate');
  return errors;
}

export function preflightCanadaCarrier(input: CanadaCarrierPreflightInput): CanadaCarrierPreflight {
  const rejectedKeys = collectRejectedKeys(input);
  const objective = normalizeObjective(input.objective);
  const originCountryCode = normalizeCountry(input.originCountryCode, 'CA');
  const destinationCountryCode = normalizeCountry(input.destinationCountryCode, 'CA');
  const laneId = laneFor({ objective, origin: originCountryCode, destination: destinationCountryCode });
  const baseRefs = ['recipientId', 'walletConsentRef', 'parcelProfileRef', 'carrierCapabilityRef', 'postalValidationRef'] as const;
  const crossBorderRefs = isCanadaUsCrossBorder(originCountryCode, destinationCountryCode) || laneId === 'ca-us-cross-border'
    ? ['customsIntentRef'] as const
    : [] as const;
  const requiredRefs = [...baseRefs, ...crossBorderRefs] as const;
  const missingRefs = requiredRefs.filter(key => typeof input[key] !== 'string' || input[key]!.trim().length === 0);

  let requiredNextAction: CanadaCarrierPreflight['requiredNextAction'] = 'ready_for_canada_rates';
  if (
    (!isCanadaDomestic(originCountryCode, destinationCountryCode) && !isCanadaUsCrossBorder(originCountryCode, destinationCountryCode))
    || missingRefs.some(refName => ['recipientId', 'walletConsentRef', 'parcelProfileRef'].includes(refName))
  ) {
    requiredNextAction = 'collect_canada_wallet_refs';
  } else if (missingRefs.includes('postalValidationRef')) {
    requiredNextAction = 'run_canada_postal_validation';
  } else if (missingRefs.includes('carrierCapabilityRef')) {
    requiredNextAction = 'run_carrier_capability_check';
  } else if (missingRefs.includes('customsIntentRef')) {
    requiredNextAction = 'prepare_cross_border_customs';
  }
  if (rejectedKeys.length > 0) requiredNextAction = 'collect_canada_wallet_refs';

  const candidateCarriers: CanadaCarrier[] = laneId === 'ca-domestic-standard' || laneId === 'ca-return' || laneId === 'ca-postal-validation'
    ? ['ups']
    : ['ups', 'dhl'];
  const safeRefs: CanadaCarrierPreflight['safeRefs'] = {};
  for (const key of requiredRefs) {
    if (typeof input[key] === 'string' && input[key]!.length > 0) safeRefs[key] = input[key];
  }

  return {
    ok: requiredNextAction === 'ready_for_canada_rates' && rejectedKeys.length === 0,
    version: CANADA_CARRIER_STRENGTHENING_VERSION,
    laneId,
    objective,
    selectedCarrier: 'ups',
    candidateCarriers,
    originCountryCode,
    destinationCountryCode,
    missingRefs,
    rejectedKeys,
    requiredNextAction,
    safeRefs,
    localOnly: true,
    productionTraffic: false,
    nonClaims: [
      'Canada preflight is not a live UPS or DHL service guarantee.',
      'UPS remains the default Canada path; DHL is an Express/cross-border runtime candidate when capability checks pass.',
      'Preflight does not expose raw address, customs descriptions, or production carrier traffic.',
    ],
  };
}

export function buildCanadaReadinessSnapshot(input: CanadaCarrierPreflightInput) {
  const preflight = preflightCanadaCarrier(input);
  return {
    snapshotRef: ref('canada_readiness', preflight.safeRefs),
    planVersion: CANADA_CARRIER_STRENGTHENING_VERSION,
    countryCode: 'CA' as const,
    laneId: preflight.laneId,
    selectedCarrier: preflight.selectedCarrier,
    candidateCarriers: preflight.candidateCarriers,
    originCountryCode: preflight.originCountryCode,
    destinationCountryCode: preflight.destinationCountryCode,
    requiredNextAction: preflight.requiredNextAction,
    merchantVisible: {
      selectedCarrier: preflight.selectedCarrier,
      laneId: preflight.laneId,
      candidateCarriers: preflight.candidateCarriers,
      originCountryCode: preflight.originCountryCode,
      destinationCountryCode: preflight.destinationCountryCode,
    },
    privateMaterialExposed: false as const,
    productionTraffic: false as const,
  };
}
