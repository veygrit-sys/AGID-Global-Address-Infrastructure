export type PlaylistCommerceWebhookTopic =
  | 'playlist.product_saved'
  | 'playlist.shared'
  | 'checkout.alias_created'
  | 'delivery.receipt_created'
  | 'analytics.aggregate_ready';

export type PlaylistCommerceWebhookPayload = {
  eventId: string;
  topic: PlaylistCommerceWebhookTopic;
  createdAt: string;
  merchantRef: string;
  playlistRef?: string;
  productRef?: string;
  orderAlias?: string;
  receiptRef?: string;
  subjectAlias?: string;
  deliveryStatus?: 'pending' | 'handoff_ready' | 'in_transit' | 'delivered' | 'needs_review';
  aggregate?: {
    metricId: string;
    playlistCategory: string;
    window: string;
    value: number;
  };
  testVector: true;
};

export type PlaylistCommerceWebhookEnvelope = {
  version: 'playlist-commerce-webhook-v0.1';
  payload: PlaylistCommerceWebhookPayload;
  headers: {
    'x-playlist-event-id': string;
    'x-playlist-topic': PlaylistCommerceWebhookTopic;
    'x-playlist-timestamp': string;
    'x-playlist-signature': string;
    'x-playlist-key-id': string;
  };
};

const FORBIDDEN_FIELD_PATTERNS = [
  /raw[_-]?address/i,
  /recipient[_-]?phone/i,
  /recipient[_-]?identity/i,
  /provider[_-]?(id|access|refresh)?[_-]?token/i,
  /raw[_-]?provider[_-]?profile/i,
  /raw[_-]?carrier[_-]?payload/i,
  /private[_-]?key/i,
  /proof[_-]?witness/i,
  /biometric[_-]?template/i,
  /passport/i,
  /room[_-]?number/i,
  /social[_-]?graph/i,
] as const;

const DEFAULT_TEST_SECRET = 'playlist-commerce-test-secret';
const SHA256_BLOCK_BYTES = 64;
const SHA256_DIGEST_BYTES = 32;
const textEncoder = new TextEncoder();

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function sha256Bytes(message: Uint8Array): Uint8Array {
  const paddedLength = Math.ceil((message.length + 9) / SHA256_BLOCK_BYTES) * SHA256_BLOCK_BYTES;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x80;

  const bitLength = message.length * 8;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += SHA256_BLOCK_BYTES) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4);
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let index = 0; index < 64; index += 1) {
      const sigma1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + sigma1 + choice + SHA256_K[index] + words[index]) >>> 0;
      const sigma0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sigma0 + majority) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const digest = new Uint8Array(SHA256_DIGEST_BYTES);
  const digestView = new DataView(digest.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((value, index) => {
    digestView.setUint32(index * 4, value);
  });
  return digest;
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function hmacSha256Hex(secret: string, message: string): string {
  const rawKey = textEncoder.encode(secret);
  const key = rawKey.length > SHA256_BLOCK_BYTES ? sha256Bytes(rawKey) : rawKey;
  const keyBlock = new Uint8Array(SHA256_BLOCK_BYTES);
  keyBlock.set(key);

  const outerPad = new Uint8Array(SHA256_BLOCK_BYTES);
  const innerPad = new Uint8Array(SHA256_BLOCK_BYTES);
  for (let index = 0; index < SHA256_BLOCK_BYTES; index += 1) {
    outerPad[index] = keyBlock[index] ^ 0x5c;
    innerPad[index] = keyBlock[index] ^ 0x36;
  }

  const innerDigest = sha256Bytes(concatBytes(innerPad, textEncoder.encode(message)));
  return bytesToHex(sha256Bytes(concatBytes(outerPad, innerDigest)));
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

export function canonicalizePlaylistCommerceWebhookPayload(payload: PlaylistCommerceWebhookPayload): string {
  return stableStringify(payload);
}

function collectForbiddenPaths(value: unknown, path = '$'): string[] {
  if (value === null || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const findings: string[] = [];

  for (const [key, child] of Object.entries(record)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_FIELD_PATTERNS.some(pattern => pattern.test(key))) findings.push(childPath);
    findings.push(...collectForbiddenPaths(child, childPath));
  }

  return findings;
}

export function signPlaylistCommerceWebhookPayload(
  payload: PlaylistCommerceWebhookPayload,
  secret = DEFAULT_TEST_SECRET,
) {
  return `sha256=${hmacSha256Hex(secret, canonicalizePlaylistCommerceWebhookPayload(payload))}`;
}

export function buildPlaylistCommerceWebhookFixtures(secret = DEFAULT_TEST_SECRET): PlaylistCommerceWebhookEnvelope[] {
  const payloads: PlaylistCommerceWebhookPayload[] = [
    {
      eventId: 'evt_pc_saved_001',
      topic: 'playlist.product_saved',
      createdAt: '2026-07-01T00:00:00.000Z',
      merchantRef: 'merchant_demo',
      playlistRef: 'pl_demo_new_life',
      productRef: 'prod_demo_lamp',
      testVector: true,
    },
    {
      eventId: 'evt_pc_shared_001',
      topic: 'playlist.shared',
      createdAt: '2026-07-01T00:01:00.000Z',
      merchantRef: 'merchant_demo',
      playlistRef: 'pl_demo_gift',
      subjectAlias: 'alias_friend_scope_demo',
      testVector: true,
    },
    {
      eventId: 'evt_pc_checkout_001',
      topic: 'checkout.alias_created',
      createdAt: '2026-07-01T00:02:00.000Z',
      merchantRef: 'merchant_demo',
      playlistRef: 'pl_demo_monthly',
      orderAlias: 'order_alias_demo_001',
      subjectAlias: 'subject_alias_demo_001',
      deliveryStatus: 'handoff_ready',
      testVector: true,
    },
    {
      eventId: 'evt_pc_delivery_001',
      topic: 'delivery.receipt_created',
      createdAt: '2026-07-01T00:03:00.000Z',
      merchantRef: 'merchant_demo',
      orderAlias: 'order_alias_demo_001',
      receiptRef: 'receipt_demo_001',
      deliveryStatus: 'delivered',
      testVector: true,
    },
    {
      eventId: 'evt_pc_analytics_001',
      topic: 'analytics.aggregate_ready',
      createdAt: '2026-07-01T00:04:00.000Z',
      merchantRef: 'merchant_demo',
      aggregate: {
        metricId: 'playlist-save-count',
        playlistCategory: 'travel-prep',
        window: 'P7D',
        value: 42,
      },
      testVector: true,
    },
  ];

  return payloads.map(payload => ({
    version: 'playlist-commerce-webhook-v0.1',
    payload,
    headers: {
      'x-playlist-event-id': payload.eventId,
      'x-playlist-topic': payload.topic,
      'x-playlist-timestamp': payload.createdAt,
      'x-playlist-signature': signPlaylistCommerceWebhookPayload(payload, secret),
      'x-playlist-key-id': 'test-key-v0',
    },
  }));
}

export function validatePlaylistCommerceWebhookEnvelope(
  envelope: PlaylistCommerceWebhookEnvelope,
  secret = DEFAULT_TEST_SECRET,
): string[] {
  const errors = validatePlaylistCommerceWebhookEnvelopeShape(envelope);
  const { payload, headers } = envelope;

  if (headers['x-playlist-signature'] !== signPlaylistCommerceWebhookPayload(payload, secret)) {
    errors.push('signature-mismatch');
  }

  return errors;
}

export function validatePlaylistCommerceWebhookEnvelopeShape(
  envelope: PlaylistCommerceWebhookEnvelope,
): string[] {
  const errors: string[] = [];
  const { payload, headers } = envelope;

  if (envelope.version !== 'playlist-commerce-webhook-v0.1') errors.push('invalid-version');
  if (headers['x-playlist-event-id'] !== payload.eventId) errors.push('event-id-header-mismatch');
  if (headers['x-playlist-topic'] !== payload.topic) errors.push('topic-header-mismatch');
  if (headers['x-playlist-timestamp'] !== payload.createdAt) errors.push('timestamp-header-mismatch');
  if (!headers['x-playlist-key-id']) errors.push('missing-key-id');

  const forbiddenPaths = collectForbiddenPaths(payload);
  for (const path of forbiddenPaths) errors.push(`forbidden-field:${path}`);

  if (payload.topic === 'checkout.alias_created' && !payload.orderAlias) errors.push('checkout-event-missing-order-alias');
  if (payload.topic === 'delivery.receipt_created' && !payload.receiptRef) errors.push('delivery-event-missing-receipt-ref');
  if (payload.topic === 'analytics.aggregate_ready' && !payload.aggregate) errors.push('analytics-event-missing-aggregate');
  if (payload.topic === 'playlist.product_saved' && (!payload.playlistRef || !payload.productRef)) {
    errors.push('saved-event-missing-playlist-or-product-ref');
  }

  return errors;
}

export function validatePlaylistCommerceWebhookFixtures(
  fixtures = buildPlaylistCommerceWebhookFixtures(),
  secret = DEFAULT_TEST_SECRET,
): string[] {
  return fixtures.flatMap(fixture =>
    validatePlaylistCommerceWebhookEnvelope(fixture, secret).map(error => `${fixture.payload.eventId}:${error}`),
  );
}
