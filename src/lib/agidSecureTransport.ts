import {
  AGID_SECURE_MODEL_VERSION,
  isAgidSecureToken,
  readAgidSecureEnvelope,
} from './agidSecureShare';
import {
  unwrapPosAcceptancePayload,
  type PosAcceptanceChannel,
} from './posAcceptance';
import { sha256Hex } from './sha256';

export const AGID_SECURE_TRANSPORT_MODEL_VERSION = 'agid-secure-transport-v1';

export type AgidSecureTransportDecision =
  | 'ok'
  | 'needs-review'
  | 'rejected'
  | 'restricted';

export type AgidSecureTransportSummary = {
  modelVersion: typeof AGID_SECURE_TRANSPORT_MODEL_VERSION;
  secureShareVersion: typeof AGID_SECURE_MODEL_VERSION;
  channel: PosAcceptanceChannel;
  wrapperType: 'plain' | 'nfc-wrapper' | 'json-wrapper';
  encrypted: boolean;
  revealsAgid: false;
  highRiskMode: boolean;
  publicDecision: AgidSecureTransportDecision;
  envelopeFingerprint?: string;
  keyId?: string;
  requiredControls: string[];
  errors: string[];
  warnings: string[];
  privacy: {
    rawPayloadStored: false;
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    decryptedAgidStored: false;
    qrPayloadStored: false;
    nfcPayloadStored: false;
  };
};

function envelopeFingerprint(value: unknown) {
  return `AGIDSF-${sha256Hex(JSON.stringify(value)).slice(0, 24).toUpperCase()}`;
}

function decideTransport(input: {
  encrypted: boolean;
  channel: PosAcceptanceChannel;
  highRiskMode: boolean;
  errors: string[];
  warnings: string[];
}): AgidSecureTransportDecision {
  if (input.errors.length > 0) {
    return input.highRiskMode && input.errors.includes('high-risk-requires-agid-s-transport')
      ? 'restricted'
      : 'rejected';
  }
  if (input.highRiskMode && input.channel === 'manual') return 'needs-review';
  if (!input.encrypted) return 'needs-review';
  if (input.warnings.length > 0) return 'needs-review';
  return 'ok';
}

export function summarizeAgidSecureTransport(input: {
  payload: string;
  channel?: PosAcceptanceChannel;
  highRiskMode?: boolean;
}): AgidSecureTransportSummary {
  const highRiskMode = Boolean(input.highRiskMode);
  const unwrapped = unwrapPosAcceptancePayload({
    payload: input.payload,
    channel: input.channel ?? 'manual',
  });
  const errors: string[] = [];
  const warnings = [...unwrapped.warnings];
  const envelope = readAgidSecureEnvelope(unwrapped.payload);
  const encrypted = Boolean(envelope && isAgidSecureToken(unwrapped.payload));

  if (!unwrapped.payload) errors.push('missing-transport-payload');
  if (!encrypted) {
    errors.push(highRiskMode ? 'high-risk-requires-agid-s-transport' : 'not-agid-s-transport');
  }
  if (highRiskMode && encrypted && unwrapped.channel === 'manual') {
    warnings.push('high-risk-agid-s-should-use-qr-or-nfc-wrapper');
  }

  const requiredControls = [
    'authorized-decryption-key',
    'registry-freshness-check',
    'used-jti-or-nullifier-check',
    ...(highRiskMode ? [
      'short-ttl',
      'recipient-proof',
      'immediate-revocation-after-use',
      'no-address-history-retention',
    ] : []),
  ];

  return {
    modelVersion: AGID_SECURE_TRANSPORT_MODEL_VERSION,
    secureShareVersion: AGID_SECURE_MODEL_VERSION,
    channel: unwrapped.channel,
    wrapperType: unwrapped.wrapperType,
    encrypted,
    revealsAgid: false,
    highRiskMode,
    publicDecision: decideTransport({
      encrypted,
      channel: unwrapped.channel,
      highRiskMode,
      errors,
      warnings,
    }),
    ...(envelope ? {
      envelopeFingerprint: envelopeFingerprint(envelope),
      keyId: envelope.kid,
    } : {}),
    requiredControls,
    errors,
    warnings,
    privacy: {
      rawPayloadStored: false,
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      decryptedAgidStored: false,
      qrPayloadStored: false,
      nfcPayloadStored: false,
    },
  };
}
