import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

const REQUEST_SECRET_KEYS = [
  'issuerSecret',
  'credentialIssuerSecret',
  'issuerSecretsById',
  'privateKey',
  'signingKey',
  'secretKey',
];

export type RouteSecretOptions = {
  issuerSecrets?: Record<string, string>;
  defaultIssuerSecret?: string;
};

export type RouteAdminAuthResult =
  | { ok: true; warnings: string[] }
  | { ok: false; statusCode: 401 | 403 | 503; error: string; warnings: string[] };

export type RouteTerminalSignatureResult =
  | { ok: true; warnings: string[]; terminalId: string; nonce: string; signedAt: string }
  | { ok: false; statusCode: 400 | 401 | 409 | 503; error: string; warnings: string[] };

export function forbiddenRequestSecretKey(body: Record<string, unknown>) {
  return REQUEST_SECRET_KEYS.find(key => Object.prototype.hasOwnProperty.call(body, key)) ?? null;
}

function issuerEnvSuffix(issuerId: string) {
  return issuerId
    .normalize('NFKC')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function configuredIssuerSecret(
  issuerId: unknown,
  options: RouteSecretOptions = {},
) {
  const normalizedIssuerId = typeof issuerId === 'string' ? issuerId.normalize('NFKC').trim() : '';
  if (normalizedIssuerId && options.issuerSecrets?.[normalizedIssuerId]) {
    return options.issuerSecrets[normalizedIssuerId];
  }
  if (options.defaultIssuerSecret?.trim()) return options.defaultIssuerSecret.trim();

  const issuerSpecificKey = normalizedIssuerId
    ? process.env[`AGID_ZK_ISSUER_SECRET_${issuerEnvSuffix(normalizedIssuerId)}`]?.trim()
    : '';
  return issuerSpecificKey
    || process.env.AGID_ZK_ISSUER_SECRET?.trim()
    || process.env.AGID_PRIVATE_ADDRESS_PREDICATE_ISSUER_SECRET?.trim()
    || '';
}

export function requireConfiguredAdminToken(
  req: Request,
  options: {
    expectedToken?: string;
    headerName: string;
    missingError: string;
    invalidError: string;
    missingWarning: string;
  },
): RouteAdminAuthResult {
  const expected = options.expectedToken?.trim() ?? '';
  if (!expected) {
    return {
      ok: false,
      statusCode: 503,
      error: options.missingError,
      warnings: [options.missingWarning],
    };
  }

  const provided = req.header(options.headerName)?.trim();
  if (provided === expected) return { ok: true, warnings: [] };

  return {
    ok: false,
    statusCode: 401,
    error: options.invalidError,
    warnings: [],
  };
}

export function serverPolicyEnabled(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return /^(1|true|yes|y|on)$/i.test(value.trim());
}

export function deprecatedBodyFlags(body: Record<string, unknown>, flags: string[]) {
  return flags.filter(flag => Object.prototype.hasOwnProperty.call(body, flag));
}

function cleanSignatureText(value: unknown, maxLength = 256) {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().slice(0, maxLength)
    : '';
}

function stableSecurityJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSecurityJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSecurityJson(entryValue)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export function createTerminalHmacSignature(secret: string, payload: Record<string, unknown>) {
  return createHmac('sha256', secret)
    .update(stableSecurityJson(payload))
    .digest('hex');
}

function safeCompareSignature(left: string, right: string) {
  const normalizedLeft = left.startsWith('sha256=') ? left.slice('sha256='.length) : left;
  const normalizedRight = right.startsWith('sha256=') ? right.slice('sha256='.length) : right;
  const leftBytes = Buffer.from(normalizedLeft, 'hex');
  const rightBytes = Buffer.from(normalizedRight, 'hex');
  if (leftBytes.length === 0 || leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

export function verifyTerminalBodySignature(
  body: Record<string, unknown>,
  options: {
    expectedSecret?: string;
    replayCache: Set<string>;
    operation: string;
    payload: Record<string, unknown>;
    nowMs?: number;
    maxSkewMs?: number;
    missingSecretError: string;
  },
): RouteTerminalSignatureResult {
  const expectedSecret = options.expectedSecret?.trim() ?? '';
  if (!expectedSecret) {
    return {
      ok: false,
      statusCode: 503,
      error: options.missingSecretError,
      warnings: ['set a server-side terminal signing secret before enabling mark-used operations'],
    };
  }

  const terminalId = cleanSignatureText(body.terminalId, 96);
  const nonce = cleanSignatureText(body.signatureNonce ?? body.terminalNonce ?? body.nonce, 128);
  const signedAt = cleanSignatureText(body.signedAt ?? body.terminalSignedAt, 64);
  const signature = cleanSignatureText(body.terminalSignature, 256);
  if (!terminalId || !nonce || !signedAt || !signature) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Terminal signature, terminalId, signatureNonce, and signedAt are required.',
      warnings: ['mark-used requires device-level signing metadata and does not accept unsigned terminal use'],
    };
  }

  const signedAtMs = Date.parse(signedAt);
  if (!Number.isFinite(signedAtMs)) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Terminal signature signedAt is invalid.',
      warnings: ['signedAt must be an ISO timestamp'],
    };
  }
  const nowMs = options.nowMs ?? Date.now();
  const maxSkewMs = options.maxSkewMs ?? 5 * 60 * 1000;
  if (Math.abs(nowMs - signedAtMs) > maxSkewMs) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Terminal signature timestamp is outside the allowed replay window.',
      warnings: ['terminal signature replay window exceeded'],
    };
  }

  const replayKey = `${options.operation}:${terminalId}:${nonce}`;
  if (options.replayCache.has(replayKey)) {
    return {
      ok: false,
      statusCode: 409,
      error: 'Terminal signature nonce was already used.',
      warnings: ['terminal signature replay detected'],
    };
  }

  const expected = createTerminalHmacSignature(expectedSecret, {
    ...options.payload,
    operation: options.operation,
    terminalId,
    signatureNonce: nonce,
    signedAt,
  });
  if (!safeCompareSignature(signature, expected)) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Terminal signature is invalid.',
      warnings: [],
    };
  }

  options.replayCache.add(replayKey);
  return { ok: true, warnings: [], terminalId, nonce, signedAt };
}
