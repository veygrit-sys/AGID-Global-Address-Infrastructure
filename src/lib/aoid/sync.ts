import type { RegisteredAddressRecord } from '../registeredAddressQr';
import {
  clean,
  cleanKeyId,
} from './helpers';
import { isValidAOIDId } from './id';
import { isOpaqueEncryptedPayload } from './privacy';
import {
  buildAOIDPublicDescriptor,
  isAOIDRecord,
  normalizeAOIDRecord,
} from './records';
import type {
  AOIDEncryptedSyncEnvelope,
  AOIDRecord,
} from './types';

export function isAOIDEncryptedSyncEnvelope(value: unknown): value is AOIDEncryptedSyncEnvelope {
  return Boolean(value)
    && typeof value === 'object'
    && (value as { type?: unknown }).type === 'AOID_SYNC_ENVELOPE'
    && isValidAOIDId((value as { id?: unknown }).id)
    && (value as { encryption?: unknown }).encryption === 'owner-device'
    && isOpaqueEncryptedPayload((value as { encryptedPayload?: unknown }).encryptedPayload)
    && cleanKeyId((value as { ownerKeyId?: unknown }).ownerKeyId).length > 0
    && cleanKeyId((value as { deviceKeyId?: unknown }).deviceKeyId).length > 0;
}

export function buildAOIDEncryptedSyncEnvelope(
  record: RegisteredAddressRecord | AOIDRecord,
  options: {
    encryptedPayload: string;
    ownerKeyId?: string;
    deviceKeyId?: string;
    now?: number;
  },
): AOIDEncryptedSyncEnvelope {
  const encryptedPayload = clean(options.encryptedPayload);
  if (!isOpaqueEncryptedPayload(encryptedPayload)) {
    throw new Error('AOID cloud sync requires an opaque owner-device encrypted payload.');
  }

  const ownerKeyId = cleanKeyId(options.ownerKeyId);
  const deviceKeyId = cleanKeyId(options.deviceKeyId);
  if (!ownerKeyId || !deviceKeyId) {
    throw new Error('AOID cloud sync requires owner and device key ids.');
  }

  const normalized = normalizeAOIDRecord(record);
  return {
    type: 'AOID_SYNC_ENVELOPE',
    id: normalized.id,
    ...(normalized.agid ? { agid: normalized.agid } : {}),
    publicHandle: normalized.publicHandle,
    version: normalized.version,
    status: normalized.status,
    encryptedPayload,
    encryption: 'owner-device',
    ownerKeyId,
    deviceKeyId,
    updatedAt: options.now ?? Date.now(),
  };
}

export function classifyAOIDSyncReadiness(options: {
  userOptedInToCloud?: boolean;
  hasEncryptedPayload?: boolean;
  hasOwnerKeyId?: boolean;
  hasDeviceKeyId?: boolean;
}) {
  if (!options.userOptedInToCloud) return 'local-only' as const;
  return options.hasEncryptedPayload && options.hasOwnerKeyId && options.hasDeviceKeyId
    ? 'encrypted-sync-ready' as const
    : 'blocked' as const;
}

export function buildAOIDSyncQueuePayload(payload: unknown) {
  if (isAOIDEncryptedSyncEnvelope(payload)) return payload;
  if (Boolean(payload) && typeof payload === 'object' && (payload as { type?: unknown }).type === 'AOID_SYNC_ENVELOPE') {
    throw new Error('Invalid AOID encrypted sync envelope.');
  }
  if (isAOIDRecord(payload) || (
    Boolean(payload)
    && typeof payload === 'object'
    && (payload as { type?: unknown }).type === 'AOID'
  )) {
    return {
      ...buildAOIDPublicDescriptor(payload as RegisteredAddressRecord),
      requiresEncryptedPayload: true,
    };
  }
  return payload;
}
