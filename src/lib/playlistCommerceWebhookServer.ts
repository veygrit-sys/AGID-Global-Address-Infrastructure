import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  canonicalizePlaylistCommerceWebhookPayload,
  validatePlaylistCommerceWebhookEnvelopeShape,
  type PlaylistCommerceWebhookEnvelope,
  type PlaylistCommerceWebhookPayload,
  type PlaylistCommerceWebhookTopic,
} from './playlistCommerceWebhook';
import { PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT } from './playlistCommerceSpec';

export type PlaylistCommerceWebhookSigningKeyStatus = 'active' | 'next' | 'retired';

export type PlaylistCommerceWebhookSigningKey = {
  keyId: string;
  secret: string;
  status: PlaylistCommerceWebhookSigningKeyStatus;
  notBefore?: string;
  notAfter?: string;
};

export type PlaylistCommerceWebhookServerVerificationOptions = {
  signingKeys: PlaylistCommerceWebhookSigningKey[] | Record<string, PlaylistCommerceWebhookSigningKey>;
  now?: string | Date;
  maxTimestampSkewSeconds?: number;
  usedEventIds?: ReadonlySet<string>;
  markEventIdUsed?: (eventId: string) => void;
};

export type PlaylistCommerceWebhookServerVerificationResult = {
  ok: boolean;
  keyId: string;
  keyStatus?: PlaylistCommerceWebhookSigningKeyStatus;
  errors: string[];
};

export type PlaylistCommerceWebhookRouteRequest = {
  method: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: PlaylistCommerceWebhookEnvelope;
};

export type PlaylistCommerceWebhookRouteResponse = {
  status: 202 | 400 | 401 | 404 | 405;
  body: {
    ok: boolean;
    eventId?: string;
    topic?: PlaylistCommerceWebhookTopic;
    keyId?: string;
    keyStatus?: PlaylistCommerceWebhookSigningKeyStatus;
    resultRef?: string;
    errors: string[];
    nonClaims: string[];
  };
};

export type PlaylistCommerceWebhookRouteHandlerOptions = Omit<
  PlaylistCommerceWebhookServerVerificationOptions,
  'usedEventIds' | 'markEventIdUsed'
> & {
  path?: string;
  acceptedTopics?: PlaylistCommerceWebhookTopic[];
  eventIdStore?: Set<string>;
};

export type PlaylistCommerceWebhookSyntheticSignedPingFixture = {
  version: 'playlist-commerce-synthetic-signed-ping-v0.1';
  localOnly: true;
  routeId: string;
  signingKeyRef: {
    keyId: string;
    status: PlaylistCommerceWebhookSigningKeyStatus;
    notBefore: string;
    notAfter: string;
    secretMaterial: 'synthetic-only-not-returned';
  };
  request: PlaylistCommerceWebhookRouteRequest;
  acceptedResponse: PlaylistCommerceWebhookRouteResponse;
  replayResponse: PlaylistCommerceWebhookRouteResponse;
  safeCommand: string;
  blockedMaterial: string[];
  nonClaims: string[];
};

export type PlaylistCommerceWebhookPreflightCheck = {
  id: string;
  label: string;
  status: 'pass' | 'fail';
  detail: string;
};

export type PlaylistCommerceWebhookActivationBlockNegativeCase = {
  id: 'provider-token-raw-carrier-payload-negative';
  expectedStatus: 401;
  actualStatus: PlaylistCommerceWebhookRouteResponse['status'];
  blockedKeys: string[];
  errors: string[];
  nonClaims: string[];
};

export type PlaylistCommerceWebhookPreflightReport = {
  version: 'playlist-commerce-webhook-preflight-report-v0.1';
  localOnly: true;
  routeId: string;
  generatedAt: string;
  safeCommand: string;
  eventId: string;
  topic: PlaylistCommerceWebhookTopic;
  keyId: string;
  expectedStatuses: {
    accepted: 202;
    replay: 401;
  };
  responseSummary: {
    acceptedStatus: PlaylistCommerceWebhookRouteResponse['status'];
    acceptedResultRef?: string;
    replayStatus: PlaylistCommerceWebhookRouteResponse['status'];
    replayErrors: string[];
  };
  activationBlockNegativeCase: PlaylistCommerceWebhookActivationBlockNegativeCase;
  checks: PlaylistCommerceWebhookPreflightCheck[];
  passed: boolean;
  blockedMaterial: string[];
  nonClaims: string[];
};

const WEBHOOK_ROUTE_NON_CLAIMS = [
  'not-payment-settlement',
  'not-raw-address-intake',
  'not-proof-witness-intake',
  'not-provider-token-intake',
  'not-raw-carrier-payload-intake',
  'not-merchant-identity-verification',
] as const;

function signingKeyMap(
  keys: PlaylistCommerceWebhookServerVerificationOptions['signingKeys'],
): Map<string, PlaylistCommerceWebhookSigningKey> {
  if (Array.isArray(keys)) return new Map(keys.map(key => [key.keyId, key]));
  return new Map(Object.entries(keys));
}

export function signPlaylistCommerceWebhookPayloadServer(
  payload: PlaylistCommerceWebhookPayload,
  secret: string,
): string {
  return `sha256=${createHmac('sha256', secret).update(canonicalizePlaylistCommerceWebhookPayload(payload)).digest('hex')}`;
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

const SYNTHETIC_PING_SECRET = 'playlist-commerce-synthetic-ping-secret';

function isOutsideKeyWindow(key: PlaylistCommerceWebhookSigningKey, now: Date): boolean {
  const beforeStart = key.notBefore ? now.getTime() < Date.parse(key.notBefore) : false;
  const afterEnd = key.notAfter ? now.getTime() > Date.parse(key.notAfter) : false;
  return beforeStart || afterEnd;
}

function timestampSkewSeconds(envelope: PlaylistCommerceWebhookEnvelope, now: Date): number {
  return Math.abs(now.getTime() - Date.parse(envelope.headers['x-playlist-timestamp'])) / 1000;
}

export function verifyPlaylistCommerceWebhookEnvelopeServer(
  envelope: PlaylistCommerceWebhookEnvelope,
  options: PlaylistCommerceWebhookServerVerificationOptions,
): PlaylistCommerceWebhookServerVerificationResult {
  const now = options.now instanceof Date ? options.now : new Date(options.now ?? Date.now());
  const maxTimestampSkewSeconds = options.maxTimestampSkewSeconds ?? 300;
  const errors = validatePlaylistCommerceWebhookEnvelopeShape(envelope);
  const keyId = envelope.headers['x-playlist-key-id'];
  const key = signingKeyMap(options.signingKeys).get(keyId);

  if (!Number.isFinite(Date.parse(envelope.headers['x-playlist-timestamp']))) {
    errors.push('invalid-timestamp');
  } else if (timestampSkewSeconds(envelope, now) > maxTimestampSkewSeconds) {
    errors.push('timestamp-replay-window-exceeded');
  }

  if (options.usedEventIds?.has(envelope.payload.eventId)) errors.push('duplicate-event-id');
  if (!key) {
    errors.push('unknown-key-id');
  } else {
    if (key.status === 'retired') errors.push('retired-key');
    if (isOutsideKeyWindow(key, now)) errors.push('key-outside-validity-window');
    const expectedSignature = signPlaylistCommerceWebhookPayloadServer(envelope.payload, key.secret);
    if (!constantTimeEqual(envelope.headers['x-playlist-signature'], expectedSignature)) {
      errors.push('signature-mismatch');
    }
  }

  const ok = errors.length === 0;
  if (ok) options.markEventIdUsed?.(envelope.payload.eventId);
  return {
    ok,
    keyId,
    keyStatus: key?.status,
    errors,
  };
}

function routeResponse(
  status: PlaylistCommerceWebhookRouteResponse['status'],
  envelope: PlaylistCommerceWebhookEnvelope | undefined,
  errors: string[],
  verification?: PlaylistCommerceWebhookServerVerificationResult,
): PlaylistCommerceWebhookRouteResponse {
  const eventId = envelope?.payload.eventId;
  return {
    status,
    body: {
      ok: status === 202,
      eventId,
      topic: envelope?.payload.topic,
      keyId: verification?.keyId ?? envelope?.headers['x-playlist-key-id'],
      keyStatus: verification?.keyStatus,
      resultRef: eventId ? `pc_webhook_result_${eventId}` : undefined,
      errors,
      nonClaims: [...WEBHOOK_ROUTE_NON_CLAIMS],
    },
  };
}

export function createPlaylistCommerceWebhookRouteHandler(
  options: PlaylistCommerceWebhookRouteHandlerOptions,
) {
  const path = options.path ?? '/webhooks/playlist-commerce';
  const acceptedTopics = options.acceptedTopics ?? [
    'checkout.alias_created',
    'delivery.receipt_created',
    'analytics.aggregate_ready',
  ];
  const eventIdStore = options.eventIdStore ?? new Set<string>();

  return function handlePlaylistCommerceWebhookRoute(
    request: PlaylistCommerceWebhookRouteRequest,
  ): PlaylistCommerceWebhookRouteResponse {
    if (request.path !== path) return routeResponse(404, request.body, ['route-not-found']);
    if (request.method !== 'POST') return routeResponse(405, request.body, ['method-not-allowed']);
    if (!request.body) return routeResponse(400, undefined, ['missing-webhook-body']);

    const verification = verifyPlaylistCommerceWebhookEnvelopeServer(request.body, {
      ...options,
      usedEventIds: eventIdStore,
    });
    const errors = [...verification.errors];
    if (!acceptedTopics.includes(request.body.payload.topic)) errors.push('unsupported-topic');

    if (errors.length > 0) return routeResponse(401, request.body, errors, verification);

    eventIdStore.add(request.body.payload.eventId);
    return routeResponse(202, request.body, [], verification);
  };
}

export function buildPlaylistCommerceSyntheticSignedPingFixture(
  now = '2026-07-01T00:00:30.000Z',
): PlaylistCommerceWebhookSyntheticSignedPingFixture {
  const preflight = PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT;
  const signingKey: PlaylistCommerceWebhookSigningKey = {
    keyId: preflight.keyId,
    secret: SYNTHETIC_PING_SECRET,
    status: 'active',
    notBefore: '2026-07-01T00:00:00.000Z',
    notAfter: '2026-07-02T00:00:00.000Z',
  };
  const payload: PlaylistCommerceWebhookPayload = {
    eventId: preflight.eventId,
    topic: preflight.topic,
    createdAt: '2026-07-01T00:00:00.000Z',
    merchantRef: 'merchant_demo',
    orderAlias: 'order_alias_pc_synthetic_ping_001',
    subjectAlias: 'wallet_subject_alias_pc_ping',
    testVector: true,
  };
  const body: PlaylistCommerceWebhookEnvelope = {
    version: 'playlist-commerce-webhook-v0.1',
    payload,
    headers: {
      'x-playlist-event-id': payload.eventId,
      'x-playlist-topic': payload.topic,
      'x-playlist-timestamp': payload.createdAt,
      'x-playlist-signature': signPlaylistCommerceWebhookPayloadServer(payload, SYNTHETIC_PING_SECRET),
      'x-playlist-key-id': signingKey.keyId,
    },
  };
  const eventIdStore = new Set<string>();
  const handler = createPlaylistCommerceWebhookRouteHandler({
    signingKeys: [signingKey],
    now,
    eventIdStore,
    acceptedTopics: [preflight.topic],
  });
  const request: PlaylistCommerceWebhookRouteRequest = {
    method: preflight.method,
    path: preflight.path,
    body,
  };

  return {
    version: 'playlist-commerce-synthetic-signed-ping-v0.1',
    localOnly: true,
    routeId: preflight.routeId,
    signingKeyRef: {
      keyId: signingKey.keyId,
      status: signingKey.status,
      notBefore: signingKey.notBefore!,
      notAfter: signingKey.notAfter!,
      secretMaterial: 'synthetic-only-not-returned',
    },
    request,
    acceptedResponse: handler(request),
    replayResponse: handler(request),
    safeCommand: preflight.safeCommand,
    blockedMaterial: [...preflight.blockedMaterial],
    nonClaims: [...preflight.nonClaims],
  };
}

export function runPlaylistCommerceWebhookPreflight(
  now = '2026-07-01T00:00:30.000Z',
): PlaylistCommerceWebhookPreflightReport {
  const fixture = buildPlaylistCommerceSyntheticSignedPingFixture(now);
  const requestBody = fixture.request.body!;
  const activationBlockPayload = {
    ...requestBody.payload,
    eventId: `${requestBody.payload.eventId}_activation_block`,
    providerIdToken: 'blocked-synthetic-marker',
    rawCarrierPayload: { blockedSyntheticMarker: true },
  } as PlaylistCommerceWebhookPayload & {
    providerIdToken: string;
    rawCarrierPayload: { blockedSyntheticMarker: true };
  };
  const activationBlockRequest: PlaylistCommerceWebhookRouteRequest = {
    method: fixture.request.method,
    path: fixture.request.path,
    body: {
      version: requestBody.version,
      payload: activationBlockPayload,
      headers: {
        ...requestBody.headers,
        'x-playlist-event-id': activationBlockPayload.eventId,
        'x-playlist-signature': signPlaylistCommerceWebhookPayloadServer(
          activationBlockPayload,
          SYNTHETIC_PING_SECRET,
        ),
      },
    },
  };
  const activationBlockHandler = createPlaylistCommerceWebhookRouteHandler({
    signingKeys: [{
      keyId: fixture.signingKeyRef.keyId,
      secret: SYNTHETIC_PING_SECRET,
      status: fixture.signingKeyRef.status,
      notBefore: fixture.signingKeyRef.notBefore,
      notAfter: fixture.signingKeyRef.notAfter,
    }],
    now,
    acceptedTopics: [requestBody.payload.topic],
  });
  const activationBlockResponse = activationBlockHandler(activationBlockRequest);
  const activationBlockNegativeCase: PlaylistCommerceWebhookActivationBlockNegativeCase = {
    id: 'provider-token-raw-carrier-payload-negative',
    expectedStatus: 401,
    actualStatus: activationBlockResponse.status,
    blockedKeys: ['providerIdToken', 'rawCarrierPayload'],
    errors: [...activationBlockResponse.body.errors],
    nonClaims: [...activationBlockResponse.body.nonClaims],
  };
  const responseText = JSON.stringify([fixture.acceptedResponse.body, fixture.replayResponse.body]);
  const leakedForbiddenMaterial = fixture.blockedMaterial.filter(material => {
    const pattern = new RegExp(material, 'i');
    return pattern.test(responseText);
  });
  const secretLeaked = JSON.stringify(fixture).includes(SYNTHETIC_PING_SECRET);
  const signature = requestBody?.headers['x-playlist-signature'] ?? '';

  const checks: PlaylistCommerceWebhookPreflightCheck[] = [
    {
      id: 'local-only-boundary',
      label: 'Local-only boundary',
      status: fixture.localOnly && fixture.safeCommand === 'npm run verify:playlist-commerce' ? 'pass' : 'fail',
      detail: 'Preflight must run from the local verification command and never target production traffic.',
    },
    {
      id: 'signature-present',
      label: 'Synthetic signature present',
      status: /^sha256=[a-f0-9]{64}$/.test(signature) ? 'pass' : 'fail',
      detail: 'The fixture must exercise HMAC verification without returning signing secret material.',
    },
    {
      id: 'accepted-once',
      label: 'Accepted once',
      status: fixture.acceptedResponse.status === 202 && fixture.acceptedResponse.body.ok ? 'pass' : 'fail',
      detail: 'A valid synthetic ping should be accepted exactly once by the route handler.',
    },
    {
      id: 'replay-blocked',
      label: 'Replay blocked',
      status:
        fixture.replayResponse.status === 401 &&
        fixture.replayResponse.body.errors.includes('duplicate-event-id')
          ? 'pass'
          : 'fail',
      detail: 'Reusing the same synthetic event id must trip the idempotency gate.',
    },
    {
      id: 'activation-private-material-blocked',
      label: 'Activation private material blocked',
      status:
        activationBlockNegativeCase.actualStatus === 401 &&
        activationBlockNegativeCase.errors.includes('forbidden-field:$.providerIdToken') &&
        activationBlockNegativeCase.errors.includes('forbidden-field:$.rawCarrierPayload')
          ? 'pass'
          : 'fail',
      detail: 'A local activation negative case must reject provider token and raw carrier payload keys before webhook enablement.',
    },
    {
      id: 'redacted-response',
      label: 'Redacted response',
      status: leakedForbiddenMaterial.length === 0 && !secretLeaked ? 'pass' : 'fail',
      detail: 'Responses must not include raw address, witness, key, biometric, production secret, or synthetic secret material.',
    },
    {
      id: 'non-claims-declared',
      label: 'Non-claims declared',
      status:
        fixture.nonClaims.includes('not-payment-settlement') &&
        fixture.nonClaims.includes('not-production-delivery-attempt')
          ? 'pass'
          : 'fail',
      detail: 'The preflight is a webhook safety check, not a payment, settlement, delivery, or proof-generation claim.',
    },
  ];

  return {
    version: 'playlist-commerce-webhook-preflight-report-v0.1',
    localOnly: true,
    routeId: fixture.routeId,
    generatedAt: now,
    safeCommand: fixture.safeCommand,
    eventId: requestBody?.payload.eventId ?? '',
    topic: requestBody?.payload.topic ?? 'checkout.alias_created',
    keyId: requestBody?.headers['x-playlist-key-id'] ?? '',
    expectedStatuses: {
      accepted: 202,
      replay: 401,
    },
    responseSummary: {
      acceptedStatus: fixture.acceptedResponse.status,
      acceptedResultRef: fixture.acceptedResponse.body.resultRef,
      replayStatus: fixture.replayResponse.status,
      replayErrors: [...fixture.replayResponse.body.errors],
    },
    activationBlockNegativeCase,
    checks,
    passed: checks.every(check => check.status === 'pass'),
    blockedMaterial: [...fixture.blockedMaterial],
    nonClaims: [...fixture.nonClaims],
  };
}
