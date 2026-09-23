import { sha256Hex } from './sha256';
import type { HexashipCarrier, HexashipGatewayMethod } from './hexashipDeliveryGateway';

export const CARRIER_CONNECTOR_LAYER_VERSION = 'carrier-connector-layer-v0.1';

export type CarrierConnectorId =
  | 'dhl'
  | 'ups'
  | 'fedex'
  | 'yamato'
  | 'japan-post'
  | 'sf-express';

export type CarrierConnectorStatus = 'active-mvp' | 'planned';

export type CarrierConnectorAuthModel =
  | 'oauth-client-credentials'
  | 'basic-auth-account'
  | 'api-key-secret'
  | 'contract-account-token'
  | 'manual-contract-pending';

export type CarrierConnectorDialect = {
  rateOperation: string;
  labelOperation: string;
  trackingOperation: string;
  returnOperation: string;
  shipmentIdentifierName: string;
  trackingIdentifierName: string;
  labelArtifactName: string;
};

export type CarrierConnectorMapping = {
  commonMethod: HexashipGatewayMethod;
  connectorOperation: string;
  requiredRefs: string[];
  normalizedOutputs: string[];
  blockedInputs: string[];
};

export type CarrierConnectorProfile = {
  id: CarrierConnectorId;
  displayName: string;
  status: CarrierConnectorStatus;
  adapterRef: string;
  authModel: CarrierConnectorAuthModel;
  serverSideOnly: true;
  publicClientAllowed: false;
  supportedMethods: HexashipGatewayMethod[];
  dialect: CarrierConnectorDialect;
  mappings: CarrierConnectorMapping[];
  countryScope: 'runtime-capability-check' | 'domestic-first' | 'cross-border-first';
  notes: string[];
};

export type CarrierConnectorLayerPlan = {
  version: typeof CARRIER_CONNECTOR_LAYER_VERSION;
  productName: 'Carrier Connector Layer';
  thesis: string;
  activeConnectors: CarrierConnectorId[];
  plannedConnectors: CarrierConnectorId[];
  connectors: CarrierConnectorProfile[];
  normalizedMethods: HexashipGatewayMethod[];
  invariants: string[];
  nonClaims: string[];
};

export type CarrierConnectorSandboxInput = {
  connectorId: CarrierConnectorId;
  method: HexashipGatewayMethod;
  shipmentRef?: string;
  recipientId?: string;
  parcelProfileRef?: string;
  walletConsentRef?: string;
  rateRef?: string;
  trackingAlias?: string;
  reasonCode?: string;
};

export type CarrierCapabilityPreflightInput = {
  connectorId: CarrierConnectorId;
  countryCode?: string;
  recipientId?: string;
  parcelProfileRef?: string;
  walletConsentRef?: string;
  servicePreference?: 'fastest' | 'cheapest' | 'balanced';
  [key: string]: unknown;
};

export type CarrierCapabilityPreflightResult = {
  version: typeof CARRIER_CONNECTOR_LAYER_VERSION;
  connectorId: CarrierConnectorId;
  connectorStatus: CarrierConnectorStatus;
  countryCode: string;
  carrierCapabilityRef: string;
  requiredBeforeGetRates: string[];
  safeRefs: {
    recipientId: string;
    parcelProfileRef: string;
    walletConsentRef: string;
  };
  requiredNextAction: 'ready_for_getRates' | 'connector_not_active' | 'collect_required_refs';
  serverSideOnly: true;
  publicClientAllowed: false;
  localOnly: true;
  productionTraffic: false;
  blockedMaterial: string[];
  nonClaims: string[];
};

export type CarrierConnectorSandboxResult = {
  version: typeof CARRIER_CONNECTOR_LAYER_VERSION;
  connectorId: CarrierConnectorId;
  connectorStatus: CarrierConnectorStatus;
  commonMethod: HexashipGatewayMethod;
  connectorOperation: string;
  normalizedRef: string;
  carrierRefs: Record<string, string>;
  requiredRefs: string[];
  serverSideOnly: true;
  publicClientAllowed: false;
  localOnly: true;
  productionTraffic: false;
  blockedMaterial: string[];
  nonClaims: string[];
};

export type CarrierConnectorSandboxResponse =
  | {
      ok: true;
      status: 200;
      body: CarrierConnectorSandboxResult;
    }
  | {
      ok: false;
      status: 400;
      error: 'unknown_connector' | 'unsupported_method' | 'private_material_rejected' | 'bad_request';
      rejectedKeys?: string[];
      missingKeys?: string[];
    };

export type CarrierCapabilityPreflightResponse =
  | {
      ok: true;
      status: 200;
      body: CarrierCapabilityPreflightResult;
    }
  | {
      ok: false;
      status: 400;
      error: 'unknown_connector' | 'private_material_rejected' | 'bad_request';
      rejectedKeys?: string[];
      missingKeys?: string[];
    }
  | {
      ok: false;
      status: 202;
      error: 'connector_not_active';
      connectorStatus: CarrierConnectorStatus;
      requiredNextAction: 'connector_not_active';
    };

export type CarrierLiveOnboardingStage = 'account' | 'credential' | 'sandbox' | 'staging' | 'limited-production';

export type CarrierLiveOnboardingChecklist = {
  version: typeof CARRIER_CONNECTOR_LAYER_VERSION;
  connectorId: Extract<CarrierConnectorId, 'dhl' | 'ups'>;
  officialDocsUrl: string;
  accountPrerequisites: string[];
  authModel: Extract<CarrierConnectorAuthModel, 'basic-auth-account' | 'oauth-client-credentials'>;
  requiredServerEnvKeys: string[];
  optionalServerEnvKeys: string[];
  sandboxBaseUrl: string;
  productionBaseUrl: string;
  defaultLiveTrafficEnabled: false;
  stages: {
    stage: CarrierLiveOnboardingStage;
    gates: string[];
  }[];
  secretHandling: string[];
  privacyBoundaries: string[];
  nonClaims: string[];
};

export type CarrierLiveOnboardingPlan = {
  version: typeof CARRIER_CONNECTOR_LAYER_VERSION;
  productName: 'Carrier Live Onboarding';
  liveTrafficDefault: false;
  checklists: CarrierLiveOnboardingChecklist[];
  sharedGates: string[];
};

export type CarrierLiveEnvironmentReadiness = {
  version: typeof CARRIER_CONNECTOR_LAYER_VERSION;
  connectorId: Extract<CarrierConnectorId, 'dhl' | 'ups'>;
  readyForSandbox: boolean;
  readyForProduction: boolean;
  liveTrafficEnabled: boolean;
  presentEnvKeys: string[];
  missingEnvKeys: string[];
  blockedReasons: string[];
  nextActions: string[];
  redactionPolicy: 'key_names_only';
};

export const CARRIER_CONNECTOR_BLOCKED_MATERIAL = [
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
  'commercialRateSecret',
  'rawLabelPayload',
  'rawTrackingPayload',
  'rawCarrierPayload',
] as const;

const ALL_METHODS: HexashipGatewayMethod[] = ['createShipment', 'getRates', 'createLabel', 'trackShipment', 'createReturn'];

function mappings(dialect: CarrierConnectorDialect): CarrierConnectorMapping[] {
  return [
    {
      commonMethod: 'createShipment',
      connectorOperation: 'shipment-or-prevalidation',
      requiredRefs: ['recipientId', 'parcelProfileRef', 'walletConsentRef'],
      normalizedOutputs: ['shipmentRef', 'carrierCapabilityRef', 'requiredNextAction'],
      blockedInputs: [...CARRIER_CONNECTOR_BLOCKED_MATERIAL],
    },
    {
      commonMethod: 'getRates',
      connectorOperation: dialect.rateOperation,
      requiredRefs: ['recipientId', 'parcelProfileRef'],
      normalizedOutputs: ['rateRef', 'carrier', 'serviceLevel', 'priceEstimateRef', 'etaWindowRef'],
      blockedInputs: [...CARRIER_CONNECTOR_BLOCKED_MATERIAL],
    },
    {
      commonMethod: 'createLabel',
      connectorOperation: dialect.labelOperation,
      requiredRefs: ['shipmentRef', 'rateRef', 'walletConsentRef'],
      normalizedOutputs: ['labelRef', 'waybillAlias', 'trackingAlias', 'labelQrCommitment'],
      blockedInputs: [...CARRIER_CONNECTOR_BLOCKED_MATERIAL],
    },
    {
      commonMethod: 'trackShipment',
      connectorOperation: dialect.trackingOperation,
      requiredRefs: ['shipmentRef', 'trackingAlias'],
      normalizedOutputs: ['trackingReceiptRef', 'status', 'eventFingerprint', 'nextAction'],
      blockedInputs: [...CARRIER_CONNECTOR_BLOCKED_MATERIAL],
    },
    {
      commonMethod: 'createReturn',
      connectorOperation: dialect.returnOperation,
      requiredRefs: ['shipmentRef', 'reasonCode', 'walletConsentRef'],
      normalizedOutputs: ['returnRef', 'returnLabelRef', 'returnTrackingAlias', 'status'],
      blockedInputs: [...CARRIER_CONNECTOR_BLOCKED_MATERIAL],
    },
  ];
}

const DHL_DIALECT: CarrierConnectorDialect = {
  rateOperation: 'mydhl.rates',
  labelOperation: 'mydhl.shipments.create',
  trackingOperation: 'mydhl.tracking.get',
  returnOperation: 'mydhl.returns.create-or-label',
  shipmentIdentifierName: 'shipmentTrackingNumber',
  trackingIdentifierName: 'trackingNumber',
  labelArtifactName: 'documents',
};

const UPS_DIALECT: CarrierConnectorDialect = {
  rateOperation: 'ups.rating.rate',
  labelOperation: 'ups.shipping.shipment',
  trackingOperation: 'ups.tracking.track',
  returnOperation: 'ups.returns.shipment',
  shipmentIdentifierName: 'shipmentIdentificationNumber',
  trackingIdentifierName: 'trackingNumber',
  labelArtifactName: 'labelImage',
};

export const CARRIER_CONNECTOR_PROFILES: CarrierConnectorProfile[] = [
  {
    id: 'dhl',
    displayName: 'DHL Connector',
    status: 'active-mvp',
    adapterRef: 'carrier_connector_ref_dhl_v0',
    authModel: 'basic-auth-account',
    serverSideOnly: true,
    publicClientAllowed: false,
    supportedMethods: ALL_METHODS,
    dialect: DHL_DIALECT,
    mappings: mappings(DHL_DIALECT),
    countryScope: 'cross-border-first',
    notes: ['Absorbs MyDHL rating, shipment, label document, pickup, return, and tracking shapes behind Hexaship refs.'],
  },
  {
    id: 'ups',
    displayName: 'UPS Connector',
    status: 'active-mvp',
    adapterRef: 'carrier_connector_ref_ups_v0',
    authModel: 'oauth-client-credentials',
    serverSideOnly: true,
    publicClientAllowed: false,
    supportedMethods: ALL_METHODS,
    dialect: UPS_DIALECT,
    mappings: mappings(UPS_DIALECT),
    countryScope: 'runtime-capability-check',
    notes: ['Absorbs UPS rating, shipping, label image, tracking, address validation, and return shapes behind Hexaship refs.'],
  },
  {
    id: 'fedex',
    displayName: 'FedEx Connector',
    status: 'planned',
    adapterRef: 'carrier_connector_ref_fedex_planned',
    authModel: 'oauth-client-credentials',
    serverSideOnly: true,
    publicClientAllowed: false,
    supportedMethods: ALL_METHODS,
    dialect: {
      rateOperation: 'fedex.rate.quote',
      labelOperation: 'fedex.ship.create',
      trackingOperation: 'fedex.track.get',
      returnOperation: 'fedex.return.create',
      shipmentIdentifierName: 'masterTrackingNumber',
      trackingIdentifierName: 'trackingNumber',
      labelArtifactName: 'encodedLabel',
    },
    mappings: mappings({
      rateOperation: 'fedex.rate.quote',
      labelOperation: 'fedex.ship.create',
      trackingOperation: 'fedex.track.get',
      returnOperation: 'fedex.return.create',
      shipmentIdentifierName: 'masterTrackingNumber',
      trackingIdentifierName: 'trackingNumber',
      labelArtifactName: 'encodedLabel',
    }),
    countryScope: 'runtime-capability-check',
    notes: ['Planned after DHL/UPS contract tests stabilize.'],
  },
  {
    id: 'yamato',
    displayName: 'Yamato Transport Connector',
    status: 'planned',
    adapterRef: 'carrier_connector_ref_yamato_planned',
    authModel: 'contract-account-token',
    serverSideOnly: true,
    publicClientAllowed: false,
    supportedMethods: ALL_METHODS,
    dialect: {
      rateOperation: 'yamato.rate.lookup',
      labelOperation: 'yamato.invoice.create',
      trackingOperation: 'yamato.tracking.query',
      returnOperation: 'yamato.return.request',
      shipmentIdentifierName: 'slipNumber',
      trackingIdentifierName: 'trackingSlipNumber',
      labelArtifactName: 'invoiceLabel',
    },
    mappings: mappings({
      rateOperation: 'yamato.rate.lookup',
      labelOperation: 'yamato.invoice.create',
      trackingOperation: 'yamato.tracking.query',
      returnOperation: 'yamato.return.request',
      shipmentIdentifierName: 'slipNumber',
      trackingIdentifierName: 'trackingSlipNumber',
      labelArtifactName: 'invoiceLabel',
    }),
    countryScope: 'domestic-first',
    notes: ['Japan domestic-first connector for TA-Q-BIN style workflows after local contract review.'],
  },
  {
    id: 'japan-post',
    displayName: 'Japan Post Connector',
    status: 'planned',
    adapterRef: 'carrier_connector_ref_japan_post_planned',
    authModel: 'contract-account-token',
    serverSideOnly: true,
    publicClientAllowed: false,
    supportedMethods: ALL_METHODS,
    dialect: {
      rateOperation: 'japanpost.rate.lookup',
      labelOperation: 'japanpost.label.create',
      trackingOperation: 'japanpost.track.query',
      returnOperation: 'japanpost.return.create',
      shipmentIdentifierName: 'inquiryNumber',
      trackingIdentifierName: 'inquiryNumber',
      labelArtifactName: 'shippingLabel',
    },
    mappings: mappings({
      rateOperation: 'japanpost.rate.lookup',
      labelOperation: 'japanpost.label.create',
      trackingOperation: 'japanpost.track.query',
      returnOperation: 'japanpost.return.create',
      shipmentIdentifierName: 'inquiryNumber',
      trackingIdentifierName: 'inquiryNumber',
      labelArtifactName: 'shippingLabel',
    }),
    countryScope: 'domestic-first',
    notes: ['Japan Post domestic and international postal workflows need a separate postal-service matrix.'],
  },
  {
    id: 'sf-express',
    displayName: 'SF Express Connector',
    status: 'planned',
    adapterRef: 'carrier_connector_ref_sf_express_planned',
    authModel: 'api-key-secret',
    serverSideOnly: true,
    publicClientAllowed: false,
    supportedMethods: ALL_METHODS,
    dialect: {
      rateOperation: 'sfexpress.rate.query',
      labelOperation: 'sfexpress.order.create',
      trackingOperation: 'sfexpress.route.query',
      returnOperation: 'sfexpress.reverse.create',
      shipmentIdentifierName: 'orderId',
      trackingIdentifierName: 'mailNo',
      labelArtifactName: 'waybill',
    },
    mappings: mappings({
      rateOperation: 'sfexpress.rate.query',
      labelOperation: 'sfexpress.order.create',
      trackingOperation: 'sfexpress.route.query',
      returnOperation: 'sfexpress.reverse.create',
      shipmentIdentifierName: 'orderId',
      trackingIdentifierName: 'mailNo',
      labelArtifactName: 'waybill',
    }),
    countryScope: 'runtime-capability-check',
    notes: ['Cross-border Asia connector planned after DHL/UPS and Japan domestic connector contracts.'],
  },
];

const DHL_LIVE_ONBOARDING: CarrierLiveOnboardingChecklist = {
  version: CARRIER_CONNECTOR_LAYER_VERSION,
  connectorId: 'dhl',
  officialDocsUrl: 'https://developer.dhl.com/api-reference/dhl-express-mydhl-api',
  accountPrerequisites: [
    'Active DHL Express customer account.',
    'MyDHL API access credentials provided through DHL Express onboarding.',
    'Approved business, data protection, and carriage-policy review before production base URL use.',
  ],
  authModel: 'basic-auth-account',
  requiredServerEnvKeys: [
    'HEXASHIP_DHL_MYDHL_BASE_URL',
    'HEXASHIP_DHL_MYDHL_USERNAME',
    'HEXASHIP_DHL_MYDHL_PASSWORD',
    'HEXASHIP_DHL_ACCOUNT_NUMBER',
  ],
  optionalServerEnvKeys: [
    'HEXASHIP_DHL_PICKUP_ACCOUNT_NUMBER',
    'HEXASHIP_DHL_DUTY_ACCOUNT_NUMBER',
  ],
  sandboxBaseUrl: 'https://express.api.dhl.com/mydhlapi/test',
  productionBaseUrl: 'https://express.api.dhl.com/mydhlapi',
  defaultLiveTrafficEnabled: false,
  stages: [
    {
      stage: 'account',
      gates: ['DHL Express account number is issued to the operating entity.', 'DHL API access request is approved.'],
    },
    {
      stage: 'credential',
      gates: ['Credentials are stored only in server-side secret storage.', 'No credential value is committed to git, docs, fixtures, or client bundles.'],
    },
    {
      stage: 'sandbox',
      gates: ['Rating, shipment validation, label, pickup, and tracking contract tests pass against DHL test base URL.', 'Test traffic remains below the documented test quota.'],
    },
    {
      stage: 'staging',
      gates: ['Wallet consent handoff resolves only after Address Wallet approval.', 'No raw carrier payload is exposed to Merchant Console or public SDKs.'],
    },
    {
      stage: 'limited-production',
      gates: ['HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED is explicitly true in the server environment.', 'First shipments run under a monitored limited rollout with rollback owner assigned.'],
    },
  ],
  secretHandling: [
    'Use BasicAuth only from the server connector process.',
    'Log env key names and credential references, never credential values.',
    'Rotate credentials after sandbox contractor access or developer offboarding.',
  ],
  privacyBoundaries: [
    'Address Wallet recipient IDs stay outside DHL until wallet consent and shipment creation gates pass.',
    'Only the minimum carrier-required address and customs fields may be materialized for the shipment handoff.',
    'DHL product/rating results are treated as carrier-confidential operational data.',
  ],
  nonClaims: [
    'Completing this checklist does not create a DHL carriage contract.',
    'Sandbox success does not guarantee route availability, final price, duties, pickup acceptance, or delivery SLA.',
  ],
};

const UPS_LIVE_ONBOARDING: CarrierLiveOnboardingChecklist = {
  version: CARRIER_CONNECTOR_LAYER_VERSION,
  connectorId: 'ups',
  officialDocsUrl: 'https://developer.ups.com/tag/OAuth-Client-Credentials',
  accountPrerequisites: [
    'UPS developer application with Client ID and Client Secret.',
    'UPS shipper/account number controlled by the integration owner.',
    'Approved business, data protection, and carrier terms review before production base URL use.',
  ],
  authModel: 'oauth-client-credentials',
  requiredServerEnvKeys: [
    'HEXASHIP_UPS_BASE_URL',
    'HEXASHIP_UPS_CLIENT_ID',
    'HEXASHIP_UPS_CLIENT_SECRET',
    'HEXASHIP_UPS_ACCOUNT_NUMBER',
  ],
  optionalServerEnvKeys: [
    'HEXASHIP_UPS_BILLING_ACCOUNT_NUMBER',
    'HEXASHIP_UPS_PICKUP_ACCOUNT_NUMBER',
  ],
  sandboxBaseUrl: 'https://wwwcie.ups.com',
  productionBaseUrl: 'https://onlinetools.ups.com',
  defaultLiveTrafficEnabled: false,
  stages: [
    {
      stage: 'account',
      gates: ['UPS account number is verified for the operating entity.', 'UPS developer app is created for Hexaship server-side use.'],
    },
    {
      stage: 'credential',
      gates: ['OAuth Client ID and Client Secret are stored only in server-side secret storage.', 'Bearer tokens are short-lived and never returned to public clients.'],
    },
    {
      stage: 'sandbox',
      gates: ['Rating, shipping, label, tracking, and return contract tests pass against UPS test endpoints.', 'OAuth token refresh failure cases are covered by tests.'],
    },
    {
      stage: 'staging',
      gates: ['Address Wallet consent handoff runs before address materialization.', 'Webhook and tracking events are normalized before merchant exposure.'],
    },
    {
      stage: 'limited-production',
      gates: ['HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED is explicitly true in the server environment.', 'First shipments run under a monitored limited rollout with rollback owner assigned.'],
    },
  ],
  secretHandling: [
    'Exchange Client ID and Client Secret for OAuth bearer tokens only from the server connector process.',
    'Do not persist bearer tokens beyond the connector token cache lifetime.',
    'Log token refs and request refs, never OAuth secrets or token values.',
  ],
  privacyBoundaries: [
    'Address Wallet recipient IDs stay outside UPS until wallet consent and shipment creation gates pass.',
    'Only the minimum carrier-required address and package fields may be materialized for the shipment handoff.',
    'UPS account and rate data are kept server-side and exposed as Hexaship refs or summaries only.',
  ],
  nonClaims: [
    'Completing this checklist does not create a UPS shipping contract.',
    'Sandbox success does not guarantee route availability, final price, pickup acceptance, or delivery SLA.',
  ],
};

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

export function buildCarrierConnectorLayerPlan(): CarrierConnectorLayerPlan {
  return {
    version: CARRIER_CONNECTOR_LAYER_VERSION,
    productName: 'Carrier Connector Layer',
    thesis:
      'Carrier Connector Layer absorbs carrier-specific API dialects so Hexaship can expose one delivery API for DHL, UPS, and future carriers.',
    activeConnectors: ['dhl', 'ups'],
    plannedConnectors: ['fedex', 'yamato', 'japan-post', 'sf-express'],
    connectors: CARRIER_CONNECTOR_PROFILES,
    normalizedMethods: ALL_METHODS,
    invariants: [
      'All connector credentials stay server-side.',
      'Public API payloads carry refs, not raw address, raw label, proof witness, or carrier credential material.',
      'Connector output must normalize carrier identifiers into Hexaship refs before merchant callbacks.',
      'Carrier availability is checked at runtime and is not implied by connector presence.',
    ],
    nonClaims: [
      'Connector profile presence is not a live carrier contract or SLA.',
      'Planned connectors are design placeholders until account, legal, and sandbox gates pass.',
      'DHL/UPS active MVP connectors do not send production traffic in local tests.',
    ],
  };
}

export function selectCarrierConnector(id: CarrierConnectorId): CarrierConnectorProfile | null {
  return CARRIER_CONNECTOR_PROFILES.find(connector => connector.id === id) ?? null;
}

export function runCarrierCapabilityPreflight(input: CarrierCapabilityPreflightInput): CarrierCapabilityPreflightResponse {
  const rejectedKeys = CARRIER_CONNECTOR_BLOCKED_MATERIAL.filter(key => new Set(collectKeys(input)).has(key));
  if (rejectedKeys.length > 0) {
    return { ok: false, status: 400, error: 'private_material_rejected', rejectedKeys };
  }

  const connector = selectCarrierConnector(input.connectorId);
  if (!connector) return { ok: false, status: 400, error: 'unknown_connector' };
  if (connector.status !== 'active-mvp') {
    return {
      ok: false,
      status: 202,
      error: 'connector_not_active',
      connectorStatus: connector.status,
      requiredNextAction: 'connector_not_active',
    };
  }

  const requiredKeys = ['countryCode', 'recipientId', 'parcelProfileRef', 'walletConsentRef'] as const;
  const missingKeys = requiredKeys.filter(key => typeof input[key] !== 'string' || (input[key] as string).trim().length === 0);
  if (missingKeys.length > 0) return { ok: false, status: 400, error: 'bad_request', missingKeys };

  const countryCode = (input.countryCode as string).trim().toUpperCase();
  return {
    ok: true,
    status: 200,
    body: {
      version: CARRIER_CONNECTOR_LAYER_VERSION,
      connectorId: connector.id,
      connectorStatus: connector.status,
      countryCode,
      carrierCapabilityRef: ref('carrier_capability', {
        connectorId: connector.id,
        countryCode,
        recipientId: input.recipientId,
        parcelProfileRef: input.parcelProfileRef,
        walletConsentRef: input.walletConsentRef,
        servicePreference: input.servicePreference ?? 'balanced',
      }),
      requiredBeforeGetRates: [...requiredKeys, 'carrierCapabilityRef'],
      safeRefs: {
        recipientId: input.recipientId as string,
        parcelProfileRef: input.parcelProfileRef as string,
        walletConsentRef: input.walletConsentRef as string,
      },
      requiredNextAction: 'ready_for_getRates',
      serverSideOnly: true,
      publicClientAllowed: false,
      localOnly: true,
      productionTraffic: false,
      blockedMaterial: [...CARRIER_CONNECTOR_BLOCKED_MATERIAL],
      nonClaims: [
        'Capability preflight is a local sandbox ref, not a live DHL/UPS service guarantee.',
        'Capability preflight does not create labels, buy postage, book pickup, or prove residence.',
        'Carrier credentials and scoped delivery handoff material remain server-side only.',
      ],
    },
  };
}

export function runCarrierConnectorSandbox(input: Record<string, unknown>): CarrierConnectorSandboxResponse {
  const rejectedKeys = CARRIER_CONNECTOR_BLOCKED_MATERIAL.filter(key => new Set(collectKeys(input)).has(key));
  if (rejectedKeys.length > 0) {
    return { ok: false, status: 400, error: 'private_material_rejected', rejectedKeys };
  }

  const connectorId = input.connectorId as CarrierConnectorId;
  const method = input.method as HexashipGatewayMethod;
  const connector = selectCarrierConnector(connectorId);
  if (!connector) return { ok: false, status: 400, error: 'unknown_connector' };
  if (!connector.supportedMethods.includes(method)) return { ok: false, status: 400, error: 'unsupported_method' };

  const mapping = connector.mappings.find(item => item.commonMethod === method);
  if (!mapping) return { ok: false, status: 400, error: 'unsupported_method' };
  const missingKeys = mapping.requiredRefs.filter(key => typeof input[key] !== 'string' || (input[key] as string).length === 0);
  if (missingKeys.length > 0) return { ok: false, status: 400, error: 'bad_request', missingKeys };

  const normalizedRef = ref('carrier_normalized', { connectorId, method, input });
  return {
    ok: true,
    status: 200,
    body: {
      version: CARRIER_CONNECTOR_LAYER_VERSION,
      connectorId,
      connectorStatus: connector.status,
      commonMethod: method,
      connectorOperation: mapping.connectorOperation,
      normalizedRef,
      carrierRefs: {
        [connector.dialect.shipmentIdentifierName]: ref(`${connectorId}_shipment`, input),
        [connector.dialect.trackingIdentifierName]: ref(`${connectorId}_tracking`, input),
        [connector.dialect.labelArtifactName]: ref(`${connectorId}_label`, input),
      },
      requiredRefs: mapping.requiredRefs,
      serverSideOnly: true,
      publicClientAllowed: false,
      localOnly: true,
      productionTraffic: false,
      blockedMaterial: [...CARRIER_CONNECTOR_BLOCKED_MATERIAL],
      nonClaims: [
        'Carrier connector sandbox results are normalized refs, not raw carrier payloads.',
        'Connector sandbox does not send production carrier traffic.',
        'Connector selection is not a live carrier SLA or service guarantee.',
      ],
    },
  };
}

function looksLikeSecretValue(value: string): boolean {
  return /(sk_live|password=|client_secret=|bearer\s+[a-z0-9._-]{12,}|basic\s+[a-z0-9+/=]{12,})/i.test(value);
}

export function buildCarrierLiveOnboardingPlan(): CarrierLiveOnboardingPlan {
  return {
    version: CARRIER_CONNECTOR_LAYER_VERSION,
    productName: 'Carrier Live Onboarding',
    liveTrafficDefault: false,
    checklists: [DHL_LIVE_ONBOARDING, UPS_LIVE_ONBOARDING],
    sharedGates: [
      'verify:carrier-connector-layer',
      'verify:hexaship-delivery-gateway',
      'Address Wallet consent preflight passes before address materialization.',
      'Merchant Console shows shipment refs and status summaries without raw recipient address display.',
      'No production carrier traffic runs unless HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED is explicitly true server-side.',
    ],
  };
}

export function validateCarrierLiveOnboardingPlan(plan: CarrierLiveOnboardingPlan): string[] {
  const errors: string[] = [];
  const checklistIds = new Set(plan.checklists.map(checklist => checklist.connectorId));

  if (plan.version !== CARRIER_CONNECTOR_LAYER_VERSION) errors.push('version-mismatch');
  if (plan.productName !== 'Carrier Live Onboarding') errors.push('product-name-mismatch');
  if (plan.liveTrafficDefault !== false) errors.push('live-traffic-default-not-false');
  for (const required of ['dhl', 'ups'] as const) {
    if (!checklistIds.has(required)) errors.push(`missing-checklist:${required}`);
  }
  for (const checklist of plan.checklists) {
    if (checklist.defaultLiveTrafficEnabled !== false) errors.push(`checklist-live-default-not-false:${checklist.connectorId}`);
    if (!/^https:\/\/developer\.(dhl|ups)\.com\//.test(checklist.officialDocsUrl)) {
      errors.push(`unofficial-docs-url:${checklist.connectorId}`);
    }
    if (checklist.requiredServerEnvKeys.length < 4) errors.push(`missing-required-env:${checklist.connectorId}`);
    if (!checklist.requiredServerEnvKeys.every(key => key.startsWith(`HEXASHIP_${checklist.connectorId.toUpperCase()}_`))) {
      errors.push(`env-prefix-mismatch:${checklist.connectorId}`);
    }
    if (!checklist.stages.some(stage => stage.stage === 'sandbox')) errors.push(`missing-sandbox-stage:${checklist.connectorId}`);
    if (!checklist.stages.some(stage => stage.stage === 'limited-production')) {
      errors.push(`missing-limited-production-stage:${checklist.connectorId}`);
    }
    if (!checklist.secretHandling.some(item => /server/i.test(item))) errors.push(`missing-server-secret-boundary:${checklist.connectorId}`);
    if (!checklist.privacyBoundaries.some(item => /wallet consent/i.test(item))) errors.push(`missing-wallet-consent-boundary:${checklist.connectorId}`);
    if (!checklist.nonClaims.some(item => /does not create/i.test(item))) errors.push(`missing-contract-non-claim:${checklist.connectorId}`);

    const serialized = stableJson(checklist);
    if (looksLikeSecretValue(serialized)) errors.push(`secret-looking-value:${checklist.connectorId}`);
  }
  for (const gate of ['verify:carrier-connector-layer', 'verify:hexaship-delivery-gateway']) {
    if (!plan.sharedGates.includes(gate)) errors.push(`missing-shared-gate:${gate}`);
  }

  return errors;
}

export function assessCarrierLiveEnvironment(
  connectorId: Extract<CarrierConnectorId, 'dhl' | 'ups'>,
  env: Record<string, string | undefined>,
): CarrierLiveEnvironmentReadiness {
  const checklist = buildCarrierLiveOnboardingPlan().checklists.find(item => item.connectorId === connectorId);
  if (!checklist) {
    return {
      version: CARRIER_CONNECTOR_LAYER_VERSION,
      connectorId,
      readyForSandbox: false,
      readyForProduction: false,
      liveTrafficEnabled: false,
      presentEnvKeys: [],
      missingEnvKeys: [],
      blockedReasons: [`unknown-connector:${connectorId}`],
      nextActions: ['Use dhl or ups.'],
      redactionPolicy: 'key_names_only',
    };
  }

  const presentEnvKeys = checklist.requiredServerEnvKeys.filter(key => typeof env[key] === 'string' && env[key]!.trim().length > 0);
  const missingEnvKeys = checklist.requiredServerEnvKeys.filter(key => !presentEnvKeys.includes(key));
  const liveTrafficEnabled = env.HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED === 'true';
  const readyForSandbox = missingEnvKeys.length === 0;
  const readyForProduction = readyForSandbox && liveTrafficEnabled;
  const blockedReasons = [
    ...missingEnvKeys.map(key => `missing-env:${key}`),
    ...(liveTrafficEnabled ? [] : ['live-traffic-disabled']),
  ];

  return {
    version: CARRIER_CONNECTOR_LAYER_VERSION,
    connectorId,
    readyForSandbox,
    readyForProduction,
    liveTrafficEnabled,
    presentEnvKeys,
    missingEnvKeys,
    blockedReasons,
    nextActions: [
      ...(missingEnvKeys.length > 0 ? ['Fill missing server-side env keys in local secret storage or deployment secrets.'] : []),
      ...(readyForSandbox ? [`Run ${connectorId.toUpperCase()} sandbox-only contract tests before any production traffic.`] : []),
      ...(readyForProduction ? ['Use limited-production rollout with monitoring and rollback owner.'] : ['Keep production carrier traffic disabled until sandbox, legal, wallet-consent, and rollback gates pass.']),
    ],
    redactionPolicy: 'key_names_only',
  };
}

export function validateCarrierConnectorLayerPlan(plan: CarrierConnectorLayerPlan): string[] {
  const errors: string[] = [];
  const connectorIds = new Set(plan.connectors.map(connector => connector.id));

  if (plan.version !== CARRIER_CONNECTOR_LAYER_VERSION) errors.push('version-mismatch');
  for (const required of ['dhl', 'ups'] satisfies CarrierConnectorId[]) {
    if (!plan.activeConnectors.includes(required)) errors.push(`missing-active-connector:${required}`);
  }
  for (const required of ['fedex', 'yamato', 'japan-post', 'sf-express'] satisfies CarrierConnectorId[]) {
    if (!plan.plannedConnectors.includes(required)) errors.push(`missing-planned-connector:${required}`);
  }
  for (const method of ALL_METHODS) {
    if (!plan.normalizedMethods.includes(method)) errors.push(`missing-normalized-method:${method}`);
  }
  for (const connector of plan.connectors) {
    if (!connectorIds.has(connector.id)) errors.push(`unknown-connector:${connector.id}`);
    if (!connector.serverSideOnly) errors.push(`connector-not-server-side:${connector.id}`);
    if (connector.publicClientAllowed) errors.push(`connector-public-client:${connector.id}`);
    if (connector.mappings.length !== ALL_METHODS.length) errors.push(`connector-mapping-count:${connector.id}`);
    for (const method of ALL_METHODS) {
      if (!connector.supportedMethods.includes(method)) errors.push(`connector-missing-method:${connector.id}:${method}`);
      if (!connector.mappings.some(mapping => mapping.commonMethod === method)) errors.push(`connector-missing-mapping:${connector.id}:${method}`);
    }
    for (const blocked of ['rawAddress', 'carrierApiKey', 'proofWitness', 'rawLabelPayload']) {
      if (!connector.mappings.every(mapping => mapping.blockedInputs.includes(blocked))) {
        errors.push(`connector-missing-blocked:${connector.id}:${blocked}`);
      }
    }
  }
  if (!plan.invariants.some(invariant => /server-side/i.test(invariant))) errors.push('missing-server-side-invariant');
  if (!plan.nonClaims.some(nonClaim => /not a live carrier contract/i.test(nonClaim))) errors.push('missing-carrier-contract-non-claim');

  return errors;
}

export function isMvpHexashipCarrier(id: CarrierConnectorId): id is HexashipCarrier {
  return id === 'dhl' || id === 'ups';
}
