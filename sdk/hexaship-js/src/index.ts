export {
  createSkipshipClient as createHexashipClient,
  createSkipshipFetchTransport as createHexashipFetchTransport,
  SkipshipApiError as HexashipApiError,
} from '../../skipship-js/src/index.js';

export type {
  SkipshipApiError as HexashipApiErrorType,
  SkipshipCarrierAllocationRequest as HexashipCarrierAllocationRequest,
  SkipshipCarrierAllocationResult as HexashipCarrierAllocationResult,
  SkipshipClient as HexashipClient,
  SkipshipClientOptions as HexashipClientOptions,
  SkipshipFetchLike as HexashipFetchLike,
  SkipshipOperation as HexashipOperation,
  SkipshipRateQuoteRequest as HexashipRateQuoteRequest,
  SkipshipRateQuoteResult as HexashipRateQuoteResult,
  SkipshipRequestOptions as HexashipRequestOptions,
  SkipshipServicePreference as HexashipServicePreference,
  SkipshipShipmentCreateRequest as HexashipShipmentCreateRequest,
  SkipshipShipmentCreateResult as HexashipShipmentCreateResult,
  SkipshipShipmentIntentCreateRequest as HexashipShipmentIntentCreateRequest,
  SkipshipShipmentIntentCreateResult as HexashipShipmentIntentCreateResult,
  SkipshipShipmentRefs as HexashipShipmentRefs,
  SkipshipTransport as HexashipTransport,
  SkipshipTransportRequest as HexashipTransportRequest,
  SkipshipTransportResponse as HexashipTransportResponse,
} from '../../skipship-js/src/index.js';

export * from '../../skipship-js/src/index.js';

import {
  preflightHexashipMvpV01Shipment as preflightHexashipMvpV01ShipmentContract,
  runHexashipMvpV01Sandbox,
} from '../../../src/lib/hexashipDeliveryGateway.js';
import type {
  HexashipGatewayError,
  HexashipMvpV01Preflight,
  HexashipMvpV01Result,
  HexashipMvpV01Request,
} from '../../../src/lib/hexashipDeliveryGateway.js';
import type {
  MerchantConsoleOnboardingMockRequest,
  MerchantConsoleOnboardingMockResult,
} from '../../../src/lib/merchantConsoleEcPlugin.js';

export const HEXASHIP_JS_ALIAS = {
  packageName: '@hexaship/js',
  reexportsPackage: '@skipship/js',
  compatibility: 'non-breaking-alias',
  legacyExportsRetained: true,
  productionTraffic: false,
  rawAddressFixtures: false,
} as const;

export type HexashipMvpV01SandboxClient = {
  createShipment(input: HexashipMvpV01Request): Promise<HexashipMvpV01Result>;
};

export type HexashipMvpV01SandboxClientOptions = {
  localOnly?: true;
};

export type HexashipMvpV01FetchLike = (url: string, init: {
  method: 'POST';
  headers: Record<string, string>;
  body: string;
}) => Promise<{
  status: number;
  json(): Promise<unknown>;
}>;

export type HexashipMvpV01FetchClientOptions = {
  baseUrl: string;
  publishableKey: string;
  fetchImpl?: HexashipMvpV01FetchLike;
};

export type HexashipMvpV01RequestOptions = {
  idempotencyKey?: string;
};

export type { HexashipMvpV01Preflight };
export type {
  MerchantConsoleOnboardingMockRequest as HexashipMerchantOnboardingRequest,
  MerchantConsoleOnboardingMockResult as HexashipMerchantOnboardingResult,
};

export class HexashipMvpV01SandboxError extends Error {
  readonly name = 'HexashipMvpV01SandboxError';
  readonly response: HexashipGatewayError;

  constructor(response: HexashipGatewayError) {
    super(`Hexaship MVP v0.1 sandbox failed: ${response.error}`);
    this.response = response;
  }
}

export class HexashipMvpV01HttpError extends Error {
  readonly name = 'HexashipMvpV01HttpError';
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Hexaship MVP v0.1 HTTP request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

function hexashipMvpUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, '')}/v1/hexaship/mvp-v0.1/shipments`;
}

function hexashipMerchantOnboardingUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, '')}/v1/merchant-console/onboarding`;
}

function hexashipMvpHeaders(publishableKey: string, requestOptions?: HexashipMvpV01RequestOptions) {
  return {
    authorization: `Bearer ${publishableKey}`,
    'content-type': 'application/json',
    ...(requestOptions?.idempotencyKey ? { 'idempotency-key': requestOptions.idempotencyKey } : {}),
  };
}

function hexashipJsonHeaders(publishableKey: string, requestOptions?: HexashipMvpV01RequestOptions) {
  return hexashipMvpHeaders(publishableKey, requestOptions);
}

export function createHexashipMvpV01SandboxClient(_options: HexashipMvpV01SandboxClientOptions = {}): HexashipMvpV01SandboxClient {
  return {
    async createShipment(input) {
      const response = runHexashipMvpV01Sandbox(input as unknown as Record<string, unknown>);
      if (response.ok === false) throw new HexashipMvpV01SandboxError(response);
      return response;
    },
  };
}

export function preflightHexashipMvpV01Shipment(input: Partial<HexashipMvpV01Request>): HexashipMvpV01Preflight {
  return preflightHexashipMvpV01ShipmentContract(input as Record<string, unknown>);
}

export function createHexashipMvpV01FetchClient(options: HexashipMvpV01FetchClientOptions): {
  createShipment(input: HexashipMvpV01Request, requestOptions?: HexashipMvpV01RequestOptions): Promise<HexashipMvpV01Result>;
} {
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    async createShipment(input, requestOptions) {
      const response = await fetchImpl(hexashipMvpUrl(options.baseUrl), {
        method: 'POST',
        headers: hexashipMvpHeaders(options.publishableKey, requestOptions),
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (response.status < 200 || response.status >= 300) {
        throw new HexashipMvpV01HttpError(response.status, body);
      }
      return body as HexashipMvpV01Result;
    },
  };
}

export function createHexashipMerchantOnboardingFetchClient(options: HexashipMvpV01FetchClientOptions): {
  createOnboarding(input: MerchantConsoleOnboardingMockRequest, requestOptions?: HexashipMvpV01RequestOptions): Promise<MerchantConsoleOnboardingMockResult>;
} {
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    async createOnboarding(input, requestOptions) {
      const response = await fetchImpl(hexashipMerchantOnboardingUrl(options.baseUrl), {
        method: 'POST',
        headers: hexashipJsonHeaders(options.publishableKey, requestOptions),
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (response.status < 200 || response.status >= 300) {
        throw new HexashipMvpV01HttpError(response.status, body);
      }
      return body as MerchantConsoleOnboardingMockResult;
    },
  };
}
