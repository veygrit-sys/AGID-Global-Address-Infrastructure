import type { DhlShipmentRouter, UnifiedDhlShipmentInput } from './dhl/dhlShipmentRouter';
import type { DhlSuccess } from './dhl/dhlHttp';
import type { UpsConnector } from './ups/upsConnector';
import type { AmazonShippingConnector, AmazonShippingSuccess } from './americas/amazonShippingConnector';
import type { LoggiConnector, LoggiSuccess } from './americas/loggiConnector';
import type { RoyalMailConnector, RoyalMailSuccess } from './europe/royalMailConnector';
import type { InPostConnector, InPostSuccess } from './europe/inPostConnector';
import type { NinjaVanConnector, NinjaVanSuccess } from './asia/ninjaVanConnector';
import type { DelhiveryConnector, DelhiverySuccess } from './asia/delhiveryConnector';
import type { PargoConnector, PargoSuccess } from './africa/pargoConnector';
import type { CourierGuyConnector, CourierGuySuccess } from './africa/courierGuyConnector';
import type { SfExpressConnector, SfExpressSuccess } from './greaterChina/sfExpressConnector';
import type { FourPxConnector, FourPxSuccess } from './greaterChina/fourPxConnector';
import type {
  ExpandedAmericasCarrierId,
  ExpandedAmericasConnector,
} from './americas/expandedAmericasConnector';
import type {
  ExpandedEuropeCarrierId,
  ExpandedEuropeConnector,
} from './europe/expandedEuropeConnector';
import type {
  ExpandedAsiaPacificCarrierId,
  ExpandedAsiaPacificConnector,
} from './asia/expandedAsiaPacificConnector';
import type {
  ExpandedAfricaCarrierId,
  ExpandedAfricaConnector,
} from './africa/expandedAfricaConnector';
import type {
  ExpandedMenaCarrierId,
  ExpandedMenaConnector,
} from './mena/expandedMenaConnector';
import type {
  ExpandedPrivateAsiaCarrierId,
  ExpandedPrivateAsiaConnector,
} from './asia/expandedPrivateAsiaConnector';
import type {
  ExpandedPrivateEuropeCarrierId,
  ExpandedPrivateEuropeConnector,
} from './europe/expandedPrivateEuropeConnector';
import type {
  ExpandedPrivateGreaterChinaCarrierId,
  ExpandedPrivateGreaterChinaConnector,
} from './greaterChina/expandedPrivateGreaterChinaConnector';

/**
 * The server-side seam shared by official carrier connectors.
 *
 * It intentionally carries a secret reference, never credentials, tokens, raw
 * labels, or a browser-supplied carrier payload.  Carrier-specific request
 * mappers stay in their own connector modules.
 */
export const CARRIER_ADAPTER_CORE_VERSION = 'veygrit-ship-carrier-adapter-core-v1' as const;

export type OfficialCarrierId =
  | 'ups'
  | 'dhl'
  | 'fedex'
  | 'amazon_shipping'
  | 'loggi'
  | 'royal_mail'
  | 'inpost'
  | 'ninja_van'
  | 'delhivery'
  | 'pargo'
  | 'courier_guy'
  | 'sf_express'
  | 'four_px'
  | ExpandedAmericasCarrierId
  | ExpandedEuropeCarrierId
  | ExpandedAsiaPacificCarrierId
  | ExpandedAfricaCarrierId
  | ExpandedMenaCarrierId
  | ExpandedPrivateAsiaCarrierId
  | ExpandedPrivateEuropeCarrierId
  | ExpandedPrivateGreaterChinaCarrierId;
export type CarrierAdapterStatus = 'available' | 'planned';
export type CarrierAdapterOperation =
  | 'address_validation'
  | 'rate'
  | 'shipment'
  | 'shipment_update'
  | 'label'
  | 'return'
  | 'void'
  | 'tracking'
  | 'pickup'
  | 'manifest'
  | 'pickup_point'
  | 'webhook'
  | 'document'
  | 'warehouse'
  | 'notification'
  | 'ndr'
  | 'eta';

export type CarrierCapabilitySet = Readonly<Record<CarrierAdapterOperation, boolean>>;

export type CarrierConnectionRef = {
  id: string;
  carrier: OfficialCarrierId;
  environment: 'sandbox' | 'production';
  secretRef: string;
};

export type CarrierAdapterRequest = {
  operation: CarrierAdapterOperation;
  connection: CarrierConnectionRef;
  requestId: string;
  idempotencyKey?: string;
  /** A server-created, carrier-specific document. Never accept this from a browser route. */
  serverPayload: unknown;
};

export type CarrierAdapterResult = {
  carrier: OfficialCarrierId;
  operation: CarrierAdapterOperation;
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  data: unknown;
};

export interface CarrierAdapter {
  readonly id: OfficialCarrierId;
  readonly status: CarrierAdapterStatus;
  readonly capabilities: CarrierCapabilitySet;
  execute(request: CarrierAdapterRequest): Promise<CarrierAdapterResult>;
}

export class CarrierAdapterCoreError extends Error {
  constructor(
    readonly code: 'unknown_carrier' | 'adapter_not_configured' | 'operation_not_supported' | 'connection_mismatch' | 'invalid_connection' | 'idempotency_key_required' | 'unsafe_input_rejected',
    message: string,
  ) {
    super(message);
    this.name = 'CarrierAdapterCoreError';
  }
}

const OPERATION_NAMES: CarrierAdapterOperation[] = [
  'address_validation', 'rate', 'shipment', 'shipment_update', 'label', 'return', 'void', 'tracking',
  'pickup', 'manifest', 'pickup_point', 'webhook', 'document', 'warehouse',
  'notification', 'ndr', 'eta',
];

const CREDENTIAL_KEY = /(?:client[_-]?secret|app[_-]?(?:key|secret)|password|pass[_-]?key|api[_-]?(?:key|secret|token)|authorization|access[_-]?token|bearer|account[_-]?number|partner[_-]?id|checkword|private[_-]?key)/i;

function capabilities(enabled: Partial<CarrierCapabilitySet>): CarrierCapabilitySet {
  return Object.freeze(Object.fromEntries(OPERATION_NAMES.map(operation => [operation, enabled[operation] === true])) as CarrierCapabilitySet);
}

function assertConnection(carrier: OfficialCarrierId, connection: CarrierConnectionRef): void {
  if (!connection || connection.carrier !== carrier) {
    throw new CarrierAdapterCoreError('connection_mismatch', 'Carrier connection does not match the selected adapter.');
  }
  if (!connection.id || !connection.secretRef || !['sandbox', 'production'].includes(connection.environment)) {
    throw new CarrierAdapterCoreError('invalid_connection', 'Carrier connection must contain server-side references only.');
  }
}

function assertNoCredentialMaterial(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach(assertNoCredentialMaterial);
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (CREDENTIAL_KEY.test(key)) {
      throw new CarrierAdapterCoreError('unsafe_input_rejected', 'Carrier credentials and account material must be resolved only by the server secret provider.');
    }
    assertNoCredentialMaterial(nested);
  }
}

function assertRequest(adapter: Pick<CarrierAdapter, 'id' | 'capabilities'>, request: CarrierAdapterRequest): void {
  assertConnection(adapter.id, request.connection);
  if (!adapter.capabilities[request.operation]) {
    throw new CarrierAdapterCoreError('operation_not_supported', `${adapter.id} does not support ${request.operation} through this adapter.`);
  }
  if (['shipment', 'shipment_update', 'return', 'void', 'pickup', 'manifest', 'webhook', 'warehouse', 'notification', 'ndr'].includes(request.operation) && !request.idempotencyKey?.trim()) {
    throw new CarrierAdapterCoreError('idempotency_key_required', 'A carrier write requires an idempotency key.');
  }
  assertNoCredentialMaterial(request.serverPayload);
}

function unavailableAdapter(id: OfficialCarrierId, enabled: Partial<CarrierCapabilitySet>): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id,
    status: 'planned',
    capabilities: capabilities(enabled),
    async execute() {
      throw new CarrierAdapterCoreError('adapter_not_configured', `${id} is planned but has no configured official connector.`);
    },
  };
  return Object.freeze(adapter);
}

export function createUpsCarrierAdapter(connector: UpsConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'ups',
    status: 'available',
    capabilities: capabilities({ address_validation: true, rate: true, shipment: true, return: true, void: true, tracking: true, pickup: true }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'address_validation': return fromUps(await connector.validateAddress(payload), request);
        case 'rate': return fromUps(await connector.getRates(payload), request);
        case 'shipment': return fromUps(await connector.createShipment(payload), request);
        case 'tracking': return fromUps(await connector.track(String(payload.trackingNumber || '')), request);
        case 'void': return fromUps(await connector.voidShipment(String(payload.shipmentIdentificationNumber || ''), Array.isArray(payload.trackingNumbers) ? { trackingNumbers: payload.trackingNumbers.map(String) } : {}), request);
        // UPS returns are represented by the official shipment API with return-service data in its server-created payload.
        case 'return': return fromUps(await connector.createShipment(payload), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `UPS ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

function fromUps(result: Awaited<ReturnType<UpsConnector['getRates']>>, request: CarrierAdapterRequest): CarrierAdapterResult {
  return {
    carrier: 'ups', operation: request.operation, requestId: result.requestId, status: result.status,
    retryable: false, outcomeUnknown: false, data: result.data,
  };
}

export function createDhlCarrierAdapter(router: DhlShipmentRouter): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'dhl',
    status: 'available',
    capabilities: capabilities({ shipment: true, return: true, void: true, tracking: true, pickup: true, manifest: true }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'shipment': return fromUnifiedDhl(await router.createShipment(payload as unknown as UnifiedDhlShipmentInput), request);
        case 'return': return fromUnifiedDhl(await router.createReturnLabel(payload as unknown as UnifiedDhlShipmentInput), request);
        case 'void': return fromDhl(await router.voidShipment(String(payload.shipmentRef || ''), String(payload.packageId || ''), payload.dhlPackageId ? String(payload.dhlPackageId) : undefined), request);
        case 'manifest': return fromDhl(await router.createManifest(payload), request);
        // Tracking and pickup each need the selected DHL adapter and product contract; do not silently route them.
        default: throw new CarrierAdapterCoreError('operation_not_supported', `DHL ${request.operation} requires its dedicated DHL route and product selection.`);
      }
    },
  };
  return Object.freeze(adapter);
}

/**
 * Amazon Shipping V2 is the direct, first-party Amazon carrier API for the
 * Americas. The connector resolves LWA/IAM material server-side; the adapter
 * only receives a connection secret reference and an internally created body.
 */
export function createAmazonShippingCarrierAdapter(connector: AmazonShippingConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'amazon_shipping',
    status: 'available',
    capabilities: capabilities({ rate: true, shipment: true, void: true, tracking: true }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'rate': return fromAmazon(await connector.getRates(payload), request);
        case 'shipment': return fromAmazon(await connector.purchaseShipment(payload), request);
        case 'void': return fromAmazon(await connector.cancelShipment(String(payload.shipmentId || '')), request);
        case 'tracking': return fromAmazon(await connector.getTracking(String(payload.trackingId || ''), String(payload.carrierId || '')), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `Amazon Shipping ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

/** Official Loggi Brazil connector. Labels remain server-side documents. */
export function createLoggiCarrierAdapter(connector: LoggiConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'loggi',
    status: 'available',
    capabilities: capabilities({
      rate: true,
      shipment: true,
      shipment_update: true,
      label: true,
      void: true,
      tracking: true,
      pickup_point: true,
      webhook: true,
    }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'rate': return fromLoggi(await connector.getRates(payload), request);
        case 'shipment': return fromLoggi(await connector.createShipment(payload), request);
        case 'shipment_update': return fromLoggi(await connector.updateShipment(payload), request);
        case 'label': return fromLoggi(await connector.createLabels(payload as Parameters<LoggiConnector['createLabels']>[0]), request);
        case 'void': return fromLoggi(await connector.cancelShipment({ trackingCode: typeof payload.trackingCode === 'string' ? payload.trackingCode : undefined, loggiKey: typeof payload.loggiKey === 'string' ? payload.loggiKey : undefined }), request);
        case 'tracking': return fromLoggi(await connector.track(String(payload.trackingCode || '')), request);
        case 'pickup_point': return fromLoggi(await connector.listDropoffLocations(payload), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `Loggi ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

/** Direct Royal Mail Shipping V2 and Tracking V2 adapter. */
export function createRoyalMailCarrierAdapter(connector: RoyalMailConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'royal_mail',
    status: 'available',
    capabilities: capabilities({ shipment: true, label: true, void: true, tracking: true, manifest: true }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'shipment': return fromRoyalMail(await connector.createShipment(payload), request);
        case 'label': return fromRoyalMail(await connector.getLabel(String(payload.shipmentNumber || ''), typeof payload.options === 'object' && payload.options ? payload.options as Record<string, unknown> : {}), request);
        case 'void': return fromRoyalMail(await connector.cancelShipment(String(payload.shipmentNumber || '')), request);
        case 'tracking': return fromRoyalMail(await connector.track(String(payload.mailPieceId || '')), request);
        case 'manifest': return fromRoyalMail(await connector.createManifest(payload), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `Royal Mail ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

/** Direct InPost Shipping V2 adapter using OAuth 2.1. */
export function createInPostCarrierAdapter(connector: InPostConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'inpost',
    status: 'available',
    capabilities: capabilities({ shipment: true, label: true, tracking: true, pickup_point: true, return: true }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'shipment': return fromInPost(await connector.createShipment(payload), request);
        case 'label': return fromInPost(await connector.getLabel(String(payload.trackingNumber || ''), typeof payload.accept === 'string' ? payload.accept : undefined), request);
        case 'tracking': return fromInPost(await connector.getShipment(String(payload.trackingNumber || '')), request);
        case 'pickup_point': return fromInPost(await connector.listPickupPoints(payload as Record<string, string | number | boolean | undefined>), request);
        case 'return': return fromInPost(await connector.createReturn(payload), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `InPost ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

/** Direct Ninja Van OAuth and Order API adapter for Southeast Asia. */
export function createNinjaVanCarrierAdapter(connector: NinjaVanConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'ninja_van',
    status: 'available',
    capabilities: capabilities({ rate: true, shipment: true, label: true, void: true, pickup_point: true, webhook: true }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'shipment': return fromNinjaVan(await connector.createOrder(payload), request);
        case 'void': return fromNinjaVan(await connector.cancelOrder(String(payload.trackingNumber || '')), request);
        case 'rate': return fromNinjaVan(await connector.getRates(payload), request);
        case 'label': return fromNinjaVan(await connector.getWaybill(payload), request);
        case 'pickup_point': return fromNinjaVan(await connector.listPickupPoints(payload), request);
        case 'webhook': return fromNinjaVan(await connector.configureWebhook(payload), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `Ninja Van ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

/** Direct Delhivery B2C adapter for India. */
export function createDelhiveryCarrierAdapter(connector: DelhiveryConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'delhivery',
    status: 'available',
    capabilities: capabilities({
      address_validation: true,
      rate: true,
      shipment: true,
      label: true,
      tracking: true,
      pickup: true,
      return: true,
      ndr: true,
      webhook: true,
      document: true,
    }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'rate': return fromDelhivery(await connector.getRates(payload as Record<string, string | number | boolean | undefined>), request);
        case 'shipment': return fromDelhivery(await connector.createShipment(payload), request);
        case 'label': return fromDelhivery(await connector.getLabel(String(payload.waybill || '')), request);
        case 'tracking': return fromDelhivery(await connector.track(String(payload.waybill || ''), typeof payload.referenceId === 'string' ? payload.referenceId : undefined), request);
        case 'address_validation': return fromDelhivery(await connector.checkServiceability(payload as Record<string, string | number | boolean | undefined>), request);
        case 'document': return fromDelhivery(await connector.fetchWaybill(payload), request);
        case 'pickup': return fromDelhivery(await connector.createPickup(payload), request);
        case 'return': return fromDelhivery(await connector.createReturn(payload), request);
        case 'ndr': return fromDelhivery(await connector.updateNdr(payload), request);
        case 'webhook': return fromDelhivery(await connector.configureWebhook(payload), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `Delhivery ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

/** Direct Pargo Simba API adapter for Southern Africa. */
export function createPargoCarrierAdapter(connector: PargoConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'pargo',
    status: 'available',
    capabilities: capabilities({
      address_validation: true, rate: true, shipment: true, return: true, void: true,
      label: true, pickup_point: true, webhook: true,
    }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'rate': return fromPargo(await connector.getQuotation(payload), request);
        case 'shipment': return fromPargo(await connector.createOrder(payload, 'shipment'), request);
        case 'return': return fromPargo(await connector.createOrder(payload, 'return'), request);
        case 'void': return fromPargo(await connector.cancelOrder(String(payload.orderReference || '')), request);
        case 'label': return fromPargo(await connector.getLabel(String(payload.orderReference || '')), request);
        case 'address_validation': return fromPargo(await connector.autocompleteAddress(String(payload.query || '')), request);
        case 'pickup_point': return fromPargo(await connector.listPickupPoints(payload as Record<string, string | number | boolean | undefined>), request);
        case 'webhook': return fromPargo(connector.ingestWebhook(payload), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `Pargo ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

/** Direct The Courier Guy V2 adapter for South Africa. */
export function createCourierGuyCarrierAdapter(connector: CourierGuyConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'courier_guy',
    status: 'available',
    capabilities: capabilities({
      rate: true, shipment: true, return: true, void: true, tracking: true,
      label: true, pickup_point: true, document: true,
    }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'rate': return fromCourierGuy(payload.serviceMode === 'locker' ? await connector.getPudoRates(payload) : await connector.getRates(payload), request);
        case 'shipment': return fromCourierGuy(payload.serviceMode === 'locker' ? await connector.createPudoShipment(payload, 'shipment') : await connector.createShipment(payload, 'shipment'), request);
        case 'return': return fromCourierGuy(payload.serviceMode === 'locker' ? await connector.createPudoShipment(payload, 'return') : await connector.createShipment(payload, 'return'), request);
        case 'void': return fromCourierGuy(await connector.cancelPudoShipment(String(payload.shipmentId || ''), typeof payload.reason === 'string' ? payload.reason : undefined), request);
        case 'tracking': return fromCourierGuy(payload.serviceMode === 'locker' ? await connector.trackPudoShipment(String(payload.shipmentId || '')) : await connector.track(String(payload.trackingReference || '')), request);
        case 'label': return fromCourierGuy(payload.serviceMode === 'locker' ? await connector.getPudoLabel(String(payload.shipmentId || ''), payload.labelKind === 'sticker' ? 'sticker' : 'waybill') : await connector.getLabel(String(payload.shipmentId || '')), request);
        case 'pickup_point': return fromCourierGuy(await connector.listPudoLockers(), request);
        case 'document': return fromCourierGuy(await connector.getPudoProofOfDelivery(String(payload.shipmentId || '')), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `The Courier Guy ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

/** Direct SF Express unified OpenAPI adapter for Greater China. */
export function createSfExpressCarrierAdapter(connector: SfExpressConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'sf_express',
    status: 'available',
    capabilities: capabilities({ rate: true, shipment: true, void: true, tracking: true }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'rate': return fromSfExpress(await connector.getFreight(payload), request);
        case 'shipment': return fromSfExpress(await connector.createOrder(payload), request);
        case 'void': return fromSfExpress(await connector.cancelOrder(payload), request);
        case 'tracking': return fromSfExpress(await connector.track(payload), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `SF Express ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

/** Direct 4PX OpenAPI adapter for Greater China cross-border shipping. */
export function createFourPxCarrierAdapter(connector: FourPxConnector): CarrierAdapter {
  const adapter: CarrierAdapter = {
    id: 'four_px',
    status: 'available',
    capabilities: capabilities({ rate: true, shipment: true, void: true, tracking: true, label: true }),
    async execute(request) {
      assertRequest(adapter, request);
      const payload = request.serverPayload as Record<string, unknown>;
      switch (request.operation) {
        case 'rate': return fromFourPx(await connector.getRates(payload), request);
        case 'shipment': return fromFourPx(await connector.createOrder(payload), request);
        case 'void': return fromFourPx(await connector.cancelOrder(payload), request);
        case 'tracking': return fromFourPx(await connector.track(payload), request);
        case 'label': return fromFourPx(await connector.getLabel(payload), request);
        default: throw new CarrierAdapterCoreError('operation_not_supported', `4PX ${request.operation} is not implemented in the core adapter.`);
      }
    },
  };
  return Object.freeze(adapter);
}

const EXPANDED_AMERICAS_CAPABILITIES: Readonly<Record<ExpandedAmericasCarrierId, Partial<CarrierCapabilitySet>>> = Object.freeze({
  chilexpress: { address_validation: true, rate: true, shipment: true, label: true, tracking: true },
  coordinadora: { shipment: true, label: true, tracking: true },
  oca: { rate: true, shipment: true, label: true, return: true, void: true, tracking: true },
  ninety_nine_minutos: { address_validation: true, rate: true, shipment: true, label: true, void: true, tracking: true },
  redpack: { shipment: true, label: true, tracking: true },
  estafeta: { shipment: true, label: true, tracking: true },
  jadlog: { rate: true, shipment: true, void: true, tracking: true },
  total_express: { rate: true, shipment: true, label: true, tracking: true, pickup: true },
  roadie: { rate: true, shipment: true, label: true, void: true, tracking: true },
  andreani: { rate: true, shipment: true, label: true, tracking: true },
  servientrega: { rate: true, shipment: true, label: true, return: true, tracking: true, pickup: true },
  blue_express: { rate: true, shipment: true, label: true, return: true, tracking: true, pickup: true, pickup_point: true },
});

type DirectConnectorResult = {
  carrier: OfficialCarrierId;
  requestId: string;
  status: number;
  retryable: boolean;
  outcomeUnknown: boolean;
  data: unknown;
};

type DirectCarrierAdapterInput<CarrierId extends OfficialCarrierId> = {
  carrier: CarrierId;
  connectorCarrier: CarrierId;
  scope: string;
  capabilitySet: Partial<CarrierCapabilitySet>;
  execute: (
    operation: CarrierAdapterOperation,
    payload: Record<string, unknown>,
  ) => Promise<DirectConnectorResult>;
  mapPayload?: (
    operation: CarrierAdapterOperation,
    payload: Record<string, unknown>,
  ) => Record<string, unknown>;
};

/**
 * Shared server-only adapter boundary for direct carrier connectors.
 *
 * Regional connectors keep their own HTTP/authentication implementation. This
 * factory centralizes connection matching, unsafe-input rejection, capability
 * publication and result normalization so every region follows one contract.
 */
function createDirectCarrierAdapter<CarrierId extends OfficialCarrierId>(
  input: DirectCarrierAdapterInput<CarrierId>,
): CarrierAdapter {
  if (input.connectorCarrier !== input.carrier) {
    throw new CarrierAdapterCoreError(
      'connection_mismatch',
      `${input.scope} connector does not match the selected carrier.`,
    );
  }
  const adapter: CarrierAdapter = {
    id: input.carrier,
    status: 'available',
    capabilities: capabilities(input.capabilitySet),
    async execute(request) {
      assertRequest(adapter, request);
      const source = request.serverPayload as Record<string, unknown>;
      const payload = input.mapPayload?.(request.operation, source) ?? source;
      const result = await input.execute(request.operation, payload);
      if (result.carrier !== input.carrier) {
        throw new CarrierAdapterCoreError(
          'connection_mismatch',
          `${input.scope} response does not match the selected carrier.`,
        );
      }
      return fromDirectConnector(result, request);
    },
  };
  return Object.freeze(adapter);
}

/**
 * Direct carrier adapter used by the nine official Americas connectors.
 * Each connector retains its own carrier ID so credentials, metrics and
 * incident controls are never mixed. Roadie is grouped under UPS operationally
 * but intentionally remains a distinct connection and adapter.
 */
export function createExpandedAmericasCarrierAdapter(
  carrier: ExpandedAmericasCarrierId,
  connector: ExpandedAmericasConnector,
): CarrierAdapter {
  return createDirectCarrierAdapter({
    carrier,
    connectorCarrier: connector.config.carrier,
    scope: 'Expanded Americas',
    capabilitySet: EXPANDED_AMERICAS_CAPABILITIES[carrier],
    execute: (operation, payload) => connector.execute(
      operation as Parameters<ExpandedAmericasConnector['execute']>[0],
      payload,
    ),
  });
}

const EXPANDED_EUROPE_CAPABILITIES: Readonly<Record<ExpandedEuropeCarrierId, Partial<CarrierCapabilitySet>>> = Object.freeze({
  gls: { shipment: true, label: true, tracking: true, webhook: true },
  dpd: { shipment: true, label: true, pickup: true, tracking: true, return: true, pickup_point: true },
  hermes_de: { shipment: true, label: true, tracking: true, return: true, pickup_point: true },
  paack: { shipment: true, label: true, tracking: true },
  mondial_relay: { shipment: true, label: true, tracking: true, pickup_point: true },
  packeta: { shipment: true, label: true, tracking: true, return: true, void: true, pickup_point: true },
  dsv: { rate: true, shipment: true, label: true, tracking: true, webhook: true, document: true },
  geodis: { shipment: true, label: true, tracking: true, warehouse: true },
});

const EXPANDED_ASIA_PACIFIC_CAPABILITIES: Readonly<Record<ExpandedAsiaPacificCarrierId, Partial<CarrierCapabilitySet>>> = Object.freeze({
  lalamove: { rate: true, shipment: true, tracking: true, webhook: true, document: true },
  aramex_anz: { rate: true, shipment: true, label: true },
  nz_couriers: { rate: true, shipment: true, label: true, void: true, pickup: true, pickup_point: true, notification: true },
  jt_express: { shipment: true, tracking: true },
  yamato: { shipment: true, label: true, pickup_point: true },
});

const EXPANDED_AFRICA_CAPABILITIES: Readonly<Record<ExpandedAfricaCarrierId, Partial<CarrierCapabilitySet>>> = Object.freeze({
  collivery: {
    rate: true, shipment: true, shipment_update: true, void: true,
    label: true, tracking: true, document: true,
  },
  ram_couriers: { rate: true, shipment: true, void: true, label: true, tracking: true },
  lilwa_delivery: { shipment: true, tracking: true, eta: true },
  fez_delivery: { shipment: true, tracking: true },
  haulstow: {
    rate: true, shipment: true, void: true, tracking: true,
  },
  kwik_delivery: { rate: true, shipment: true, void: true, tracking: true },
  gigl: { rate: true, shipment: true, tracking: true },
  dodo_tanzania: { shipment: true, tracking: true },
});

const EXPANDED_MENA_CAPABILITIES: Readonly<Record<ExpandedMenaCarrierId, Partial<CarrierCapabilitySet>>> = Object.freeze({
  aramex_mena: {
    address_validation: true, rate: true, shipment: true, void: true,
    label: true, tracking: true, pickup: true,
  },
  smsa_express: { rate: true, shipment: true, void: true, label: true, tracking: true },
  naqel_express: {
    address_validation: true, shipment: true, return: true, void: true,
    tracking: true, pickup: true,
  },
  emirates_post: { rate: true, shipment: true, void: true, label: true, tracking: true, webhook: true },
  bosta: {
    shipment: true, shipment_update: true, void: true, tracking: true,
    pickup: true, webhook: true,
  },
  mylerz: { shipment: true, shipment_update: true, label: true, tracking: true, pickup: true },
});

const EXPANDED_PRIVATE_ASIA_CAPABILITIES: Readonly<Record<ExpandedPrivateAsiaCarrierId, Partial<CarrierCapabilitySet>>> = Object.freeze({
  blue_dart: {
    rate: true, shipment: true, label: true, tracking: true, pickup: true, document: true,
  },
  dtdc: {
    address_validation: true, rate: true, shipment: true, label: true,
    return: true, tracking: true, pickup: true,
  },
  gdex: {
    rate: true, shipment: true, label: true, void: true, tracking: true, pickup: true,
  },
  jne: {
    rate: true, shipment: true, label: true, void: true, tracking: true, pickup: true,
  },
  ghn: {
    rate: true, shipment: true, return: true, void: true, tracking: true, webhook: true,
  },
  ghtk: {
    rate: true, shipment: true, label: true, void: true, tracking: true, webhook: true,
  },
  grab_express: {
    rate: true, shipment: true, void: true, tracking: true, webhook: true, document: true,
  },
  gosend: {
    rate: true, shipment: true, void: true, tracking: true, webhook: true, document: true,
  },
  flash_express: {
    rate: true, shipment: true, label: true, void: true, tracking: true, pickup: true, webhook: true,
  },
  pathao_courier: {
    rate: true, shipment: true, tracking: true, return: true,
  },
  ecourier_bd: {
    shipment: true, label: true, void: true, tracking: true, document: true,
  },
  leopards_courier: {
    shipment: true, tracking: true, manifest: true,
  },
  domex_lk: {
    rate: true, shipment: true, label: true, tracking: true, pickup: true,
  },
  nepal_can_move: {
    shipment: true, shipment_update: true, tracking: true,
    webhook: true, document: true,
  },
});

const EXPANDED_PRIVATE_EUROPE_CAPABILITIES: Readonly<Record<ExpandedPrivateEuropeCarrierId, Partial<CarrierCapabilitySet>>> = Object.freeze({
  yodel: {
    shipment: true, shipment_update: true, void: true, label: true,
    return: true, tracking: true, pickup: true,
  },
  fan_courier: {
    rate: true, shipment: true, return: true, void: true, label: true,
    tracking: true, pickup: true, pickup_point: true, document: true,
  },
  acs_courier: {
    address_validation: true, rate: true, shipment: true, void: true,
    label: true, tracking: true, pickup: true, pickup_point: true,
  },
  dachser: {
    rate: true, shipment: true, label: true, tracking: true,
    webhook: true, document: true, warehouse: true,
  },
  sameday: {
    rate: true, shipment: true, return: true, void: true, label: true,
    tracking: true, pickup: true, pickup_point: true,
  },
  dhl_parcel_de: {
    address_validation: true, shipment: true, label: true, return: true,
    void: true, tracking: true, manifest: true, document: true,
  },
  colissimo: {
    rate: true, shipment: true, label: true, return: true,
    tracking: true, pickup_point: true, document: true,
  },
  poste_italiane: {
    shipment: true, label: true, tracking: true, pickup: true, pickup_point: true,
  },
  correos: {
    address_validation: true, shipment: true, label: true,
    tracking: true, pickup: true, document: true,
  },
  postnl: {
    address_validation: true, shipment: true, label: true, return: true,
    tracking: true, pickup: true, pickup_point: true, webhook: true, manifest: true,
  },
  bpost: {
    shipment: true, label: true, return: true, tracking: true, pickup_point: true,
  },
  postnord: {
    address_validation: true, rate: true, shipment: true, label: true,
    return: true, tracking: true, pickup: true, pickup_point: true, document: true,
  },
  swiss_post: {
    label: true,
  },
  austrian_post: {
    shipment: true, label: true, return: true, tracking: true, pickup_point: true,
  },
  ppl_cz: {
    shipment: true, label: true, void: true, tracking: true,
    pickup: true, pickup_point: true,
  },
  omniva: {
    shipment: true, label: true, return: true, tracking: true, pickup_point: true,
  },
  an_post: {
    shipment: true, label: true, return: true, tracking: true,
  },
  ctt_portugal: {
    rate: true, shipment: true, label: true, tracking: true,
    pickup: true, document: true,
  },
});

const EXPANDED_PRIVATE_GREATER_CHINA_CAPABILITIES: Readonly<
  Record<ExpandedPrivateGreaterChinaCarrierId, Partial<CarrierCapabilitySet>>
> = Object.freeze({
  zto_express: {
    address_validation: true, shipment: true, label: true, return: true,
    void: true, tracking: true, pickup: true, webhook: true,
  },
  yto_express: {
    rate: true, shipment: true, label: true, void: true,
    tracking: true, pickup: true, webhook: true,
  },
  sto_express: {
    shipment: true, label: true, void: true, tracking: true, webhook: true,
  },
  deppon: {
    rate: true, shipment: true, label: true, void: true,
    tracking: true, pickup: true,
  },
  jd_logistics: {
    address_validation: true, rate: true, shipment: true, label: true,
    void: true, tracking: true, pickup: true, webhook: true,
    document: true, warehouse: true,
  },
  cainiao_express: {
    rate: true, shipment: true, shipment_update: true, label: true,
    void: true, tracking: true, pickup: true, webhook: true, document: true,
  },
});

/** Direct carrier-owned European adapters; no multi-carrier API is involved. */
export function createExpandedEuropeCarrierAdapter(
  carrier: ExpandedEuropeCarrierId,
  connector: ExpandedEuropeConnector,
): CarrierAdapter {
  return createDirectCarrierAdapter({
    carrier,
    connectorCarrier: connector.config.carrier,
    scope: 'Expanded Europe',
    capabilitySet: EXPANDED_EUROPE_CAPABILITIES[carrier],
    execute: (operation, payload) => connector.execute(
      operation as Parameters<ExpandedEuropeConnector['execute']>[0],
      payload,
    ),
  });
}

/** Direct carrier-owned Asia-Pacific adapters; no multi-carrier API is involved. */
export function createExpandedAsiaPacificCarrierAdapter(
  carrier: ExpandedAsiaPacificCarrierId,
  connector: ExpandedAsiaPacificConnector,
): CarrierAdapter {
  return createDirectCarrierAdapter({
    carrier,
    connectorCarrier: connector.config.carrier,
    scope: 'Expanded Asia-Pacific',
    capabilitySet: EXPANDED_ASIA_PACIFIC_CAPABILITIES[carrier],
    execute: (operation, payload) => connector.execute(
      operation as Parameters<ExpandedAsiaPacificConnector['execute']>[0],
      payload,
    ),
  });
}

/** Direct carrier-owned African adapters; no multi-carrier API is involved. */
export function createExpandedAfricaCarrierAdapter(
  carrier: ExpandedAfricaCarrierId,
  connector: ExpandedAfricaConnector,
): CarrierAdapter {
  return createDirectCarrierAdapter({
    carrier,
    connectorCarrier: connector.config.carrier,
    scope: 'Expanded Africa',
    capabilitySet: EXPANDED_AFRICA_CAPABILITIES[carrier],
    mapPayload: (operation, payload) => carrier === 'collivery' && operation === 'void'
      ? { ...payload, status_id: 5 }
      : payload,
    execute: (operation, payload) => connector.execute(
      operation as Parameters<ExpandedAfricaConnector['execute']>[0],
      payload,
    ),
  });
}

/** Direct carrier-owned Middle East and North Africa adapters. */
export function createExpandedMenaCarrierAdapter(
  carrier: ExpandedMenaCarrierId,
  connector: ExpandedMenaConnector,
): CarrierAdapter {
  return createDirectCarrierAdapter({
    carrier,
    connectorCarrier: connector.config.carrier,
    scope: 'Expanded MENA',
    capabilitySet: EXPANDED_MENA_CAPABILITIES[carrier],
    execute: (operation, payload) => connector.execute(
      operation as Parameters<ExpandedMenaConnector['execute']>[0],
      payload,
    ),
  });
}

/** Direct carrier-owned private Asian adapters; no aggregator API is involved. */
export function createExpandedPrivateAsiaCarrierAdapter(
  carrier: ExpandedPrivateAsiaCarrierId,
  connector: ExpandedPrivateAsiaConnector,
): CarrierAdapter {
  return createDirectCarrierAdapter({
    carrier,
    connectorCarrier: connector.config.carrier,
    scope: 'Expanded private Asia',
    capabilitySet: EXPANDED_PRIVATE_ASIA_CAPABILITIES[carrier],
    execute: (operation, payload) => connector.execute(
      operation as Parameters<ExpandedPrivateAsiaConnector['execute']>[0],
      payload,
    ),
  });
}

/** Direct carrier-owned private European adapters; no aggregator API is involved. */
export function createExpandedPrivateEuropeCarrierAdapter(
  carrier: ExpandedPrivateEuropeCarrierId,
  connector: ExpandedPrivateEuropeConnector,
): CarrierAdapter {
  return createDirectCarrierAdapter({
    carrier,
    connectorCarrier: connector.config.carrier,
    scope: 'Expanded private Europe',
    capabilitySet: EXPANDED_PRIVATE_EUROPE_CAPABILITIES[carrier],
    execute: (operation, payload) => connector.execute(
      operation as Parameters<ExpandedPrivateEuropeConnector['execute']>[0],
      payload,
    ),
  });
}

/** Direct carrier-owned Greater China adapters; no aggregator API is involved. */
export function createExpandedPrivateGreaterChinaCarrierAdapter(
  carrier: ExpandedPrivateGreaterChinaCarrierId,
  connector: ExpandedPrivateGreaterChinaConnector,
): CarrierAdapter {
  return createDirectCarrierAdapter({
    carrier,
    connectorCarrier: connector.config.carrier,
    scope: 'Expanded private Greater China',
    capabilitySet: EXPANDED_PRIVATE_GREATER_CHINA_CAPABILITIES[carrier],
    execute: (operation, payload) => connector.execute(
      operation as Parameters<ExpandedPrivateGreaterChinaConnector['execute']>[0],
      payload,
    ),
  });
}

function fromUnifiedDhl(result: { upstream: DhlSuccess }, request: CarrierAdapterRequest): CarrierAdapterResult {
  return fromDhl(result.upstream, request);
}

function fromDhl(result: DhlSuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return {
    carrier: 'dhl', operation: request.operation, requestId: result.requestId, status: result.status,
    retryable: false, outcomeUnknown: false, data: result.data,
  };
}

function fromAmazon(result: AmazonShippingSuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: 'amazon_shipping', operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

function fromLoggi(result: LoggiSuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: 'loggi', operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

function fromRoyalMail(result: RoyalMailSuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: 'royal_mail', operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

function fromInPost(result: InPostSuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: 'inpost', operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

function fromNinjaVan(result: NinjaVanSuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: 'ninja_van', operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

function fromDelhivery(result: DelhiverySuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: 'delhivery', operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

function fromPargo(result: PargoSuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: 'pargo', operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

function fromCourierGuy(result: CourierGuySuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: 'courier_guy', operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

function fromSfExpress(result: SfExpressSuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: 'sf_express', operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

function fromFourPx(result: FourPxSuccess, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: 'four_px', operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

function fromDirectConnector(result: DirectConnectorResult, request: CarrierAdapterRequest): CarrierAdapterResult {
  return { carrier: result.carrier, operation: request.operation, requestId: result.requestId, status: result.status, retryable: result.retryable, outcomeUnknown: result.outcomeUnknown, data: result.data };
}

export function createOfficialCarrierAdapterRegistry(adapters: Partial<Record<OfficialCarrierId, CarrierAdapter>> = {}) {
  const byId: Record<OfficialCarrierId, CarrierAdapter> = {
    ups: adapters.ups ?? unavailableAdapter('ups', { address_validation: true, rate: true, shipment: true, return: true, void: true, tracking: true, pickup: true }),
    dhl: adapters.dhl ?? unavailableAdapter('dhl', { shipment: true, return: true, void: true, tracking: true, pickup: true, manifest: true }),
    fedex: unavailableAdapter('fedex', { rate: true, shipment: true, return: true, void: true, tracking: true, pickup: true }),
    amazon_shipping: adapters.amazon_shipping ?? unavailableAdapter('amazon_shipping', { rate: true, shipment: true, void: true, tracking: true }),
    loggi: adapters.loggi ?? unavailableAdapter('loggi', {
      rate: true, shipment: true, shipment_update: true, label: true, void: true,
      tracking: true, pickup_point: true, webhook: true,
    }),
    royal_mail: adapters.royal_mail ?? unavailableAdapter('royal_mail', { shipment: true, label: true, void: true, tracking: true, manifest: true }),
    inpost: adapters.inpost ?? unavailableAdapter('inpost', { shipment: true, label: true, tracking: true, pickup_point: true, return: true }),
    ninja_van: adapters.ninja_van ?? unavailableAdapter('ninja_van', { rate: true, shipment: true, label: true, void: true, pickup_point: true, webhook: true }),
    delhivery: adapters.delhivery ?? unavailableAdapter('delhivery', {
      address_validation: true, rate: true, shipment: true, label: true, tracking: true,
      pickup: true, return: true, ndr: true, webhook: true, document: true,
    }),
    pargo: adapters.pargo ?? unavailableAdapter('pargo', {
      address_validation: true, rate: true, shipment: true, return: true, void: true,
      label: true, pickup_point: true, webhook: true,
    }),
    courier_guy: adapters.courier_guy ?? unavailableAdapter('courier_guy', {
      rate: true, shipment: true, return: true, void: true, tracking: true,
      label: true, pickup_point: true, document: true,
    }),
    sf_express: adapters.sf_express ?? unavailableAdapter('sf_express', { rate: true, shipment: true, void: true, tracking: true }),
    four_px: adapters.four_px ?? unavailableAdapter('four_px', { rate: true, shipment: true, void: true, tracking: true, label: true }),
    chilexpress: adapters.chilexpress ?? unavailableAdapter('chilexpress', EXPANDED_AMERICAS_CAPABILITIES.chilexpress),
    coordinadora: adapters.coordinadora ?? unavailableAdapter('coordinadora', EXPANDED_AMERICAS_CAPABILITIES.coordinadora),
    oca: adapters.oca ?? unavailableAdapter('oca', EXPANDED_AMERICAS_CAPABILITIES.oca),
    ninety_nine_minutos: adapters.ninety_nine_minutos ?? unavailableAdapter('ninety_nine_minutos', EXPANDED_AMERICAS_CAPABILITIES.ninety_nine_minutos),
    redpack: adapters.redpack ?? unavailableAdapter('redpack', EXPANDED_AMERICAS_CAPABILITIES.redpack),
    estafeta: adapters.estafeta ?? unavailableAdapter('estafeta', EXPANDED_AMERICAS_CAPABILITIES.estafeta),
    jadlog: adapters.jadlog ?? unavailableAdapter('jadlog', EXPANDED_AMERICAS_CAPABILITIES.jadlog),
    total_express: adapters.total_express ?? unavailableAdapter('total_express', EXPANDED_AMERICAS_CAPABILITIES.total_express),
    roadie: adapters.roadie ?? unavailableAdapter('roadie', EXPANDED_AMERICAS_CAPABILITIES.roadie),
    andreani: adapters.andreani ?? unavailableAdapter('andreani', EXPANDED_AMERICAS_CAPABILITIES.andreani),
    servientrega: adapters.servientrega ?? unavailableAdapter('servientrega', EXPANDED_AMERICAS_CAPABILITIES.servientrega),
    blue_express: adapters.blue_express ?? unavailableAdapter('blue_express', EXPANDED_AMERICAS_CAPABILITIES.blue_express),
    gls: adapters.gls ?? unavailableAdapter('gls', EXPANDED_EUROPE_CAPABILITIES.gls),
    dpd: adapters.dpd ?? unavailableAdapter('dpd', EXPANDED_EUROPE_CAPABILITIES.dpd),
    hermes_de: adapters.hermes_de ?? unavailableAdapter('hermes_de', EXPANDED_EUROPE_CAPABILITIES.hermes_de),
    paack: adapters.paack ?? unavailableAdapter('paack', EXPANDED_EUROPE_CAPABILITIES.paack),
    mondial_relay: adapters.mondial_relay ?? unavailableAdapter('mondial_relay', EXPANDED_EUROPE_CAPABILITIES.mondial_relay),
    packeta: adapters.packeta ?? unavailableAdapter('packeta', EXPANDED_EUROPE_CAPABILITIES.packeta),
    dsv: adapters.dsv ?? unavailableAdapter('dsv', EXPANDED_EUROPE_CAPABILITIES.dsv),
    geodis: adapters.geodis ?? unavailableAdapter('geodis', EXPANDED_EUROPE_CAPABILITIES.geodis),
    lalamove: adapters.lalamove ?? unavailableAdapter('lalamove', EXPANDED_ASIA_PACIFIC_CAPABILITIES.lalamove),
    aramex_anz: adapters.aramex_anz ?? unavailableAdapter('aramex_anz', EXPANDED_ASIA_PACIFIC_CAPABILITIES.aramex_anz),
    nz_couriers: adapters.nz_couriers ?? unavailableAdapter('nz_couriers', EXPANDED_ASIA_PACIFIC_CAPABILITIES.nz_couriers),
    jt_express: adapters.jt_express ?? unavailableAdapter('jt_express', EXPANDED_ASIA_PACIFIC_CAPABILITIES.jt_express),
    yamato: adapters.yamato ?? unavailableAdapter('yamato', EXPANDED_ASIA_PACIFIC_CAPABILITIES.yamato),
    collivery: adapters.collivery ?? unavailableAdapter('collivery', EXPANDED_AFRICA_CAPABILITIES.collivery),
    ram_couriers: adapters.ram_couriers ?? unavailableAdapter('ram_couriers', EXPANDED_AFRICA_CAPABILITIES.ram_couriers),
    lilwa_delivery: adapters.lilwa_delivery ?? unavailableAdapter('lilwa_delivery', EXPANDED_AFRICA_CAPABILITIES.lilwa_delivery),
    fez_delivery: adapters.fez_delivery ?? unavailableAdapter('fez_delivery', EXPANDED_AFRICA_CAPABILITIES.fez_delivery),
    haulstow: adapters.haulstow ?? unavailableAdapter('haulstow', EXPANDED_AFRICA_CAPABILITIES.haulstow),
    kwik_delivery: adapters.kwik_delivery ?? unavailableAdapter('kwik_delivery', EXPANDED_AFRICA_CAPABILITIES.kwik_delivery),
    gigl: adapters.gigl ?? unavailableAdapter('gigl', EXPANDED_AFRICA_CAPABILITIES.gigl),
    dodo_tanzania: adapters.dodo_tanzania ?? unavailableAdapter('dodo_tanzania', EXPANDED_AFRICA_CAPABILITIES.dodo_tanzania),
    aramex_mena: adapters.aramex_mena ?? unavailableAdapter('aramex_mena', EXPANDED_MENA_CAPABILITIES.aramex_mena),
    smsa_express: adapters.smsa_express ?? unavailableAdapter('smsa_express', EXPANDED_MENA_CAPABILITIES.smsa_express),
    naqel_express: adapters.naqel_express ?? unavailableAdapter('naqel_express', EXPANDED_MENA_CAPABILITIES.naqel_express),
    emirates_post: adapters.emirates_post ?? unavailableAdapter('emirates_post', EXPANDED_MENA_CAPABILITIES.emirates_post),
    bosta: adapters.bosta ?? unavailableAdapter('bosta', EXPANDED_MENA_CAPABILITIES.bosta),
    mylerz: adapters.mylerz ?? unavailableAdapter('mylerz', EXPANDED_MENA_CAPABILITIES.mylerz),
    blue_dart: adapters.blue_dart ?? unavailableAdapter('blue_dart', EXPANDED_PRIVATE_ASIA_CAPABILITIES.blue_dart),
    dtdc: adapters.dtdc ?? unavailableAdapter('dtdc', EXPANDED_PRIVATE_ASIA_CAPABILITIES.dtdc),
    gdex: adapters.gdex ?? unavailableAdapter('gdex', EXPANDED_PRIVATE_ASIA_CAPABILITIES.gdex),
    jne: adapters.jne ?? unavailableAdapter('jne', EXPANDED_PRIVATE_ASIA_CAPABILITIES.jne),
    ghn: adapters.ghn ?? unavailableAdapter('ghn', EXPANDED_PRIVATE_ASIA_CAPABILITIES.ghn),
    ghtk: adapters.ghtk ?? unavailableAdapter('ghtk', EXPANDED_PRIVATE_ASIA_CAPABILITIES.ghtk),
    grab_express: adapters.grab_express ?? unavailableAdapter('grab_express', EXPANDED_PRIVATE_ASIA_CAPABILITIES.grab_express),
    gosend: adapters.gosend ?? unavailableAdapter('gosend', EXPANDED_PRIVATE_ASIA_CAPABILITIES.gosend),
    flash_express: adapters.flash_express ?? unavailableAdapter('flash_express', EXPANDED_PRIVATE_ASIA_CAPABILITIES.flash_express),
    pathao_courier: adapters.pathao_courier ?? unavailableAdapter('pathao_courier', EXPANDED_PRIVATE_ASIA_CAPABILITIES.pathao_courier),
    ecourier_bd: adapters.ecourier_bd ?? unavailableAdapter('ecourier_bd', EXPANDED_PRIVATE_ASIA_CAPABILITIES.ecourier_bd),
    leopards_courier: adapters.leopards_courier ?? unavailableAdapter('leopards_courier', EXPANDED_PRIVATE_ASIA_CAPABILITIES.leopards_courier),
    domex_lk: adapters.domex_lk ?? unavailableAdapter('domex_lk', EXPANDED_PRIVATE_ASIA_CAPABILITIES.domex_lk),
    nepal_can_move: adapters.nepal_can_move ?? unavailableAdapter('nepal_can_move', EXPANDED_PRIVATE_ASIA_CAPABILITIES.nepal_can_move),
    yodel: adapters.yodel ?? unavailableAdapter('yodel', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.yodel),
    fan_courier: adapters.fan_courier ?? unavailableAdapter('fan_courier', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.fan_courier),
    acs_courier: adapters.acs_courier ?? unavailableAdapter('acs_courier', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.acs_courier),
    dachser: adapters.dachser ?? unavailableAdapter('dachser', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.dachser),
    sameday: adapters.sameday ?? unavailableAdapter('sameday', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.sameday),
    dhl_parcel_de: adapters.dhl_parcel_de ?? unavailableAdapter('dhl_parcel_de', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.dhl_parcel_de),
    colissimo: adapters.colissimo ?? unavailableAdapter('colissimo', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.colissimo),
    poste_italiane: adapters.poste_italiane ?? unavailableAdapter('poste_italiane', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.poste_italiane),
    correos: adapters.correos ?? unavailableAdapter('correos', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.correos),
    postnl: adapters.postnl ?? unavailableAdapter('postnl', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.postnl),
    bpost: adapters.bpost ?? unavailableAdapter('bpost', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.bpost),
    postnord: adapters.postnord ?? unavailableAdapter('postnord', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.postnord),
    swiss_post: adapters.swiss_post ?? unavailableAdapter('swiss_post', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.swiss_post),
    austrian_post: adapters.austrian_post ?? unavailableAdapter('austrian_post', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.austrian_post),
    ppl_cz: adapters.ppl_cz ?? unavailableAdapter('ppl_cz', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.ppl_cz),
    omniva: adapters.omniva ?? unavailableAdapter('omniva', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.omniva),
    an_post: adapters.an_post ?? unavailableAdapter('an_post', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.an_post),
    ctt_portugal: adapters.ctt_portugal ?? unavailableAdapter('ctt_portugal', EXPANDED_PRIVATE_EUROPE_CAPABILITIES.ctt_portugal),
    zto_express: adapters.zto_express ?? unavailableAdapter('zto_express', EXPANDED_PRIVATE_GREATER_CHINA_CAPABILITIES.zto_express),
    yto_express: adapters.yto_express ?? unavailableAdapter('yto_express', EXPANDED_PRIVATE_GREATER_CHINA_CAPABILITIES.yto_express),
    sto_express: adapters.sto_express ?? unavailableAdapter('sto_express', EXPANDED_PRIVATE_GREATER_CHINA_CAPABILITIES.sto_express),
    deppon: adapters.deppon ?? unavailableAdapter('deppon', EXPANDED_PRIVATE_GREATER_CHINA_CAPABILITIES.deppon),
    jd_logistics: adapters.jd_logistics ?? unavailableAdapter('jd_logistics', EXPANDED_PRIVATE_GREATER_CHINA_CAPABILITIES.jd_logistics),
    cainiao_express: adapters.cainiao_express ?? unavailableAdapter('cainiao_express', EXPANDED_PRIVATE_GREATER_CHINA_CAPABILITIES.cainiao_express),
  };
  return Object.freeze({
    version: CARRIER_ADAPTER_CORE_VERSION,
    list: () => (Object.values(byId).map(adapter => ({ id: adapter.id, status: adapter.status, capabilities: adapter.capabilities, serverSideOnly: true, productionTrafficDefault: false }))),
    get: (id: OfficialCarrierId) => {
      const adapter = byId[id];
      if (!adapter) throw new CarrierAdapterCoreError('unknown_carrier', 'Unknown official carrier adapter.');
      return adapter;
    },
  });
}
