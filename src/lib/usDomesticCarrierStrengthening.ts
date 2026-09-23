import { sha256Hex } from './sha256';

export const US_DOMESTIC_CARRIER_STRENGTHENING_VERSION = 'us-domestic-carrier-strengthening-v0.1';

export type UsDomesticCarrier = 'ups' | 'dhl';
export type UsDomesticObjective = 'cheapest' | 'fastest' | 'balanced' | 'returns_first' | 'validation_first';
export type UsDomesticLaneId = 'us-domestic-ground' | 'us-domestic-express' | 'us-domestic-return' | 'us-domestic-validation';

export type UsDomesticLane = {
  laneId: UsDomesticLaneId;
  primaryCarrier: UsDomesticCarrier;
  runtimeCandidateCarriers: UsDomesticCarrier[];
  requiredFeatures: string[];
  requiredRefs: string[];
  merchantVisibleOutputs: string[];
  blockedMaterial: string[];
  nonClaims: string[];
};

export type UsDomesticCarrierPlan = {
  version: typeof US_DOMESTIC_CARRIER_STRENGTHENING_VERSION;
  productName: 'US Domestic Carrier Strengthening';
  countryCode: 'US';
  strategy: string;
  defaultCarrier: 'ups';
  runtimeCandidateCarriers: UsDomesticCarrier[];
  lanes: UsDomesticLane[];
  addressWalletRequirements: string[];
  selectionPolicy: Record<UsDomesticObjective, {
    firstChoice: UsDomesticCarrier;
    dhlTreatment: 'runtime_candidate_only';
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

export type UsDomesticCarrierPreflightInput = {
  originCountryCode?: string;
  destinationCountryCode?: string;
  recipientId?: string;
  walletConsentRef?: string;
  parcelProfileRef?: string;
  carrierCapabilityRef?: string;
  addressValidationRef?: string;
  objective?: UsDomesticObjective;
  [key: string]: unknown;
};

export type UsDomesticCarrierPreflight = {
  ok: boolean;
  version: typeof US_DOMESTIC_CARRIER_STRENGTHENING_VERSION;
  laneId: UsDomesticLaneId;
  objective: UsDomesticObjective;
  selectedCarrier: UsDomesticCarrier;
  candidateCarriers: UsDomesticCarrier[];
  missingRefs: string[];
  rejectedKeys: string[];
  requiredNextAction:
    | 'collect_us_wallet_refs'
    | 'run_ups_address_validation'
    | 'run_carrier_capability_check'
    | 'ready_for_us_domestic_rates';
  safeRefs: {
    recipientId?: string;
    walletConsentRef?: string;
    parcelProfileRef?: string;
    carrierCapabilityRef?: string;
    addressValidationRef?: string;
  };
  localOnly: true;
  productionTraffic: false;
  nonClaims: string[];
};

export const US_DOMESTIC_BLOCKED_MATERIAL = [
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
    if (US_DOMESTIC_BLOCKED_MATERIAL.includes(key as typeof US_DOMESTIC_BLOCKED_MATERIAL[number])) rejected.push(fullPath);
    rejected.push(...collectRejectedKeys(nested, [...path, key]));
  }
  return rejected;
}

function normalizeObjective(value: unknown): UsDomesticObjective {
  if (value === 'cheapest' || value === 'fastest' || value === 'returns_first' || value === 'validation_first') return value;
  return 'balanced';
}

function laneForObjective(objective: UsDomesticObjective): UsDomesticLaneId {
  if (objective === 'cheapest' || objective === 'balanced') return 'us-domestic-ground';
  if (objective === 'fastest') return 'us-domestic-express';
  if (objective === 'returns_first') return 'us-domestic-return';
  return 'us-domestic-validation';
}

function selectedCarrierForObjective(objective: UsDomesticObjective): UsDomesticCarrier {
  return objective === 'fastest' ? 'ups' : 'ups';
}

export function buildUsDomesticCarrierPlan(): UsDomesticCarrierPlan {
  const sharedRefs = ['recipientId', 'walletConsentRef', 'parcelProfileRef', 'carrierCapabilityRef'];
  const sharedNonClaims = [
    'US domestic strengthening is not a live UPS or DHL service guarantee.',
    'DHL is treated as a runtime candidate, not the default US domestic carrier.',
    'Rates, labels, tracking, returns, and pickup outcomes must be checked server-side at runtime.',
  ];

  return {
    version: US_DOMESTIC_CARRIER_STRENGTHENING_VERSION,
    productName: 'US Domestic Carrier Strengthening',
    countryCode: 'US',
    strategy:
      'Use UPS as the default US domestic carrier path for address validation, ground, express, labels, tracking, and returns; keep DHL as an Express/runtime candidate after capability checks.',
    defaultCarrier: 'ups',
    runtimeCandidateCarriers: ['ups', 'dhl'],
    lanes: [
      {
        laneId: 'us-domestic-ground',
        primaryCarrier: 'ups',
        runtimeCandidateCarriers: ['ups'],
        requiredFeatures: ['ups.addressValidation', 'ups.getRates', 'ups.createShipment', 'ups.createLabel', 'ups.trackShipment'],
        requiredRefs: [...sharedRefs, 'addressValidationRef'],
        merchantVisibleOutputs: ['rateRef', 'shipmentRef', 'labelRef', 'trackingAlias'],
        blockedMaterial: [...US_DOMESTIC_BLOCKED_MATERIAL],
        nonClaims: [...sharedNonClaims],
      },
      {
        laneId: 'us-domestic-express',
        primaryCarrier: 'ups',
        runtimeCandidateCarriers: ['ups', 'dhl'],
        requiredFeatures: ['ups.getRates', 'dhl.serviceAvailability', 'dhl.getRates', 'carrierAllocation'],
        requiredRefs: [...sharedRefs, 'addressValidationRef'],
        merchantVisibleOutputs: ['rateRef', 'selectedCarrier', 'etaWindowRef', 'priceEstimateRef'],
        blockedMaterial: [...US_DOMESTIC_BLOCKED_MATERIAL],
        nonClaims: [...sharedNonClaims],
      },
      {
        laneId: 'us-domestic-return',
        primaryCarrier: 'ups',
        runtimeCandidateCarriers: ['ups'],
        requiredFeatures: ['ups.createReturn', 'ups.trackShipment'],
        requiredRefs: [...sharedRefs, 'shipmentRef'],
        merchantVisibleOutputs: ['returnRef', 'returnLabelRef', 'returnTrackingAlias'],
        blockedMaterial: [...US_DOMESTIC_BLOCKED_MATERIAL],
        nonClaims: [...sharedNonClaims],
      },
      {
        laneId: 'us-domestic-validation',
        primaryCarrier: 'ups',
        runtimeCandidateCarriers: ['ups'],
        requiredFeatures: ['ups.addressValidation', 'addressWallet.countryForm', 'addressWallet.walletConsentHandoff'],
        requiredRefs: ['recipientId', 'walletConsentRef', 'addressValidationRef'],
        merchantVisibleOutputs: ['addressValidationRef', 'recipientId'],
        blockedMaterial: [...US_DOMESTIC_BLOCKED_MATERIAL],
        nonClaims: [...sharedNonClaims],
      },
    ],
    addressWalletRequirements: ['recipient', 'countryCode', 'postcode', 'state', 'city', 'street'],
    selectionPolicy: {
      cheapest: {
        firstChoice: 'ups',
        dhlTreatment: 'runtime_candidate_only',
        requiredGate: 'UPS Ground-style rating and address validation must pass before label creation.',
      },
      fastest: {
        firstChoice: 'ups',
        dhlTreatment: 'runtime_candidate_only',
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
      validation_first: {
        firstChoice: 'ups',
        dhlTreatment: 'runtime_candidate_only',
        requiredGate: 'UPS street-level validation is required before US domestic rating.',
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

export function validateUsDomesticCarrierPlan(plan: UsDomesticCarrierPlan): string[] {
  const errors: string[] = [];
  if (plan.version !== US_DOMESTIC_CARRIER_STRENGTHENING_VERSION) errors.push('version-mismatch');
  if (plan.countryCode !== 'US') errors.push('country-not-us');
  if (plan.defaultCarrier !== 'ups') errors.push('default-carrier-not-ups');
  if (plan.safety.productionTraffic !== false) errors.push('production-traffic-not-false');
  if (plan.safety.rawAddressAllowedInPublicApi !== false) errors.push('raw-address-public-api-not-false');
  for (const lane of ['us-domestic-ground', 'us-domestic-express', 'us-domestic-return', 'us-domestic-validation'] satisfies UsDomesticLaneId[]) {
    if (!plan.lanes.some(item => item.laneId === lane)) errors.push(`missing-lane:${lane}`);
  }
  const express = plan.lanes.find(lane => lane.laneId === 'us-domestic-express');
  if (!express?.runtimeCandidateCarriers.includes('dhl')) errors.push('express-lane-missing-dhl-runtime-candidate');
  for (const lane of plan.lanes) {
    if (lane.primaryCarrier !== 'ups') errors.push(`lane-primary-not-ups:${lane.laneId}`);
    if (!lane.blockedMaterial.includes('rawAddress')) errors.push(`lane-missing-raw-address-block:${lane.laneId}`);
    if (!lane.nonClaims.some(nonClaim => /not a live UPS or DHL service guarantee/i.test(nonClaim))) {
      errors.push(`lane-missing-service-non-claim:${lane.laneId}`);
    }
  }
  if (!plan.addressWalletRequirements.includes('postcode')) errors.push('missing-us-postcode-requirement');
  if (!plan.selectionPolicy.fastest.requiredGate.includes('DHL service availability')) errors.push('missing-dhl-fastest-gate');
  return errors;
}

export function preflightUsDomesticCarrier(input: UsDomesticCarrierPreflightInput): UsDomesticCarrierPreflight {
  const rejectedKeys = collectRejectedKeys(input);
  const objective = normalizeObjective(input.objective);
  const laneId = laneForObjective(objective);
  const originCountryCode = input.originCountryCode?.trim().toUpperCase() ?? 'US';
  const destinationCountryCode = input.destinationCountryCode?.trim().toUpperCase() ?? 'US';
  const requiredRefs = ['recipientId', 'walletConsentRef', 'parcelProfileRef', 'carrierCapabilityRef', 'addressValidationRef'] as const;
  const missingRefs = requiredRefs.filter(key => typeof input[key] !== 'string' || input[key]!.trim().length === 0);

  let requiredNextAction: UsDomesticCarrierPreflight['requiredNextAction'] = 'ready_for_us_domestic_rates';
  if (originCountryCode !== 'US' || destinationCountryCode !== 'US' || missingRefs.some(refName => ['recipientId', 'walletConsentRef', 'parcelProfileRef'].includes(refName))) {
    requiredNextAction = 'collect_us_wallet_refs';
  } else if (missingRefs.includes('addressValidationRef')) {
    requiredNextAction = 'run_ups_address_validation';
  } else if (missingRefs.includes('carrierCapabilityRef')) {
    requiredNextAction = 'run_carrier_capability_check';
  }
  if (rejectedKeys.length > 0) requiredNextAction = 'collect_us_wallet_refs';

  const selectedCarrier = selectedCarrierForObjective(objective);
  const safeRefs: UsDomesticCarrierPreflight['safeRefs'] = {};
  for (const key of requiredRefs) {
    if (typeof input[key] === 'string' && input[key]!.length > 0) safeRefs[key] = input[key];
  }

  return {
    ok: requiredNextAction === 'ready_for_us_domestic_rates' && rejectedKeys.length === 0,
    version: US_DOMESTIC_CARRIER_STRENGTHENING_VERSION,
    laneId,
    objective,
    selectedCarrier,
    candidateCarriers: objective === 'fastest' ? ['ups', 'dhl'] : ['ups'],
    missingRefs,
    rejectedKeys,
    requiredNextAction,
    safeRefs,
    localOnly: true,
    productionTraffic: false,
    nonClaims: [
      'US domestic preflight is not a live UPS or DHL service guarantee.',
      'UPS remains the default US domestic path; DHL is only a runtime candidate when capability checks pass.',
      'Preflight does not expose raw address values or send production carrier traffic.',
    ],
  };
}

export function buildUsDomesticReadinessSnapshot(input: UsDomesticCarrierPreflightInput) {
  const preflight = preflightUsDomesticCarrier(input);
  return {
    snapshotRef: ref('us_domestic_readiness', preflight.safeRefs),
    planVersion: US_DOMESTIC_CARRIER_STRENGTHENING_VERSION,
    countryCode: 'US' as const,
    laneId: preflight.laneId,
    selectedCarrier: preflight.selectedCarrier,
    candidateCarriers: preflight.candidateCarriers,
    requiredNextAction: preflight.requiredNextAction,
    merchantVisible: {
      selectedCarrier: preflight.selectedCarrier,
      laneId: preflight.laneId,
      candidateCarriers: preflight.candidateCarriers,
    },
    privateMaterialExposed: false as const,
    productionTraffic: false as const,
  };
}
