import type { RegisteredAddressRecord } from '../registeredAddressQr';
import {
  AOID_RECORD_VERSION,
  AOID_SYNC_POLICY,
} from './constants';
import {
  cleanAgid,
  cleanKeyId,
  coerceAOIDStatus,
} from './helpers';
import {
  buildAOIDPublicHandle,
  isValidAOIDId,
  normalizeAOIDId,
} from './id';
import { buildAOIDPrivateBody } from './privateBody';
import type {
  AOIDDeliveryAccessKind,
  AOIDDeliveryAccessProfile,
  AOIDPublicDescriptor,
  AOIDRecord,
} from './types';
import { sanitizeRegisteredAddressQualitySnapshot } from '../registeredAddressQuality';

export function isAOIDRecord(record: unknown): record is AOIDRecord {
  return Boolean(record)
    && typeof record === 'object'
    && (record as { type?: unknown }).type === 'AOID'
    && isValidAOIDId((record as { id?: unknown }).id);
}

function cleanText(value: unknown, maxLength = 160) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function cleanAccessKind(value: unknown): AOIDDeliveryAccessKind | undefined {
  const text = cleanText(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (
    text === 'standard'
    || text === 'auto-lock'
    || text === 'po-box'
    || text === 'locker'
    || text === 'front-desk'
    || text === 'unknown'
  ) return text;
  return undefined;
}

function booleanField(record: Record<string, unknown>, keys: string[]) {
  return keys.some(key => {
    const value = record[key];
    if (value === true) return true;
    if (typeof value === 'string') {
      const text = value.trim().toLowerCase();
      return text === 'true' || text === 'yes' || text === '1' || text === 'auto-lock' || text === 'po-box';
    }
    return false;
  });
}

function recordSearchText(record: Record<string, unknown>) {
  return [
    record.address,
    record.street,
    record.building,
    record.room,
    record.organization,
    record.deliveryAccessKind,
    record.accessKind,
    record.accessControl,
    record.deliveryAccessType,
  ].map(value => cleanText(value)).join(' ');
}

function inferDeliveryAccessKind(record: Record<string, unknown>): AOIDDeliveryAccessKind {
  const nested = record.deliveryAccess && typeof record.deliveryAccess === 'object'
    ? record.deliveryAccess as Record<string, unknown>
    : {};
  const explicit = cleanAccessKind(record.deliveryAccessKind)
    || cleanAccessKind(record.accessKind)
    || cleanAccessKind(record.deliveryAccessType);
  if (explicit) return explicit;

  if (booleanField(record, ['autoLock', 'autolock', 'hasAutoLock'])
    || booleanField(nested, ['autoLock', 'autolock', 'hasAutoLock'])) {
    return 'auto-lock';
  }
  if (booleanField(record, ['poBox', 'pobox', 'isPoBox'])
    || booleanField(nested, ['poBox', 'pobox', 'isPoBox'])) {
    return 'po-box';
  }
  if (booleanField(record, ['locker', 'parcelLocker', 'deliveryLocker'])
    || booleanField(nested, ['locker', 'parcelLocker', 'deliveryLocker'])) {
    return 'locker';
  }
  if (booleanField(record, ['frontDesk', 'concierge', 'reception'])
    || booleanField(nested, ['frontDesk', 'concierge', 'reception'])) {
    return 'front-desk';
  }

  const text = recordSearchText(record);
  if (/\b(?:p\.?\s*o\.?\s*box|post\s*office\s*box)\b|私書箱/i.test(text)) return 'po-box';
  if (/auto[-\s]?lock|autolock|オートロック/i.test(text)) return 'auto-lock';
  if (/locker|宅配ロッカー|ロッカー/i.test(text)) return 'locker';
  if (/front\s*desk|concierge|管理人|受付/i.test(text)) return 'front-desk';

  const nestedKind = cleanAccessKind(nested.kind);
  if (nestedKind) return nestedKind;
  return 'standard';
}

function explicitDeliveryAccessMarkers(record: Record<string, unknown>) {
  const nested = record.deliveryAccess && typeof record.deliveryAccess === 'object'
    ? record.deliveryAccess as Record<string, unknown>
    : {};
  const kind = cleanAccessKind(record.deliveryAccessKind)
    || cleanAccessKind(record.accessKind)
    || cleanAccessKind(record.deliveryAccessType)
    || cleanAccessKind(nested.kind);

  return {
    kind,
    autoLock: Boolean(
      kind === 'auto-lock'
      || booleanField(record, ['autoLock', 'autolock', 'hasAutoLock'])
      || booleanField(nested, ['autoLock', 'autolock', 'hasAutoLock'])
    ),
    poBox: Boolean(
      kind === 'po-box'
      || booleanField(record, ['poBox', 'pobox', 'isPoBox'])
      || booleanField(nested, ['poBox', 'pobox', 'isPoBox'])
    ),
  };
}

export function normalizeAOIDDeliveryAccessProfile(
  record: RegisteredAddressRecord | AOIDRecord | Record<string, unknown>,
): AOIDDeliveryAccessProfile {
  const source = record as Record<string, unknown>;
  const nested = source.deliveryAccess && typeof source.deliveryAccess === 'object'
    ? source.deliveryAccess as Record<string, unknown>
    : {};
  const merged = { ...nested, ...source };
  const kind = inferDeliveryAccessKind(source);
  const autoLock = kind === 'auto-lock' || booleanField(merged, ['autoLock', 'autolock', 'hasAutoLock']);
  const poBox = kind === 'po-box' || booleanField(merged, ['poBox', 'pobox', 'isPoBox']);
  const locker = kind === 'locker' || booleanField(merged, ['locker', 'parcelLocker', 'deliveryLocker']);
  const frontDesk = kind === 'front-desk' || booleanField(merged, ['frontDesk', 'concierge', 'reception']);
  const confirmedAtSource = nested.confirmedAt ?? source.deliveryAccessConfirmedAt;
  const confirmedAt = typeof confirmedAtSource === 'number' && Number.isFinite(confirmedAtSource)
    ? confirmedAtSource
    : undefined;
  const instructionCommitment = cleanText(nested.instructionCommitment ?? source.deliveryInstructionCommitment, 120);

  return {
    kind,
    autoLock,
    poBox,
    locker,
    frontDesk,
    carrierReviewRequired: autoLock || poBox,
    ...(confirmedAt ? { confirmedAt } : {}),
    ...(instructionCommitment ? { instructionCommitment } : {}),
  };
}

export function validateAOIDRegistrationRequirements(
  record: RegisteredAddressRecord | AOIDRecord | Record<string, unknown>,
) {
  const deliveryAccess = normalizeAOIDDeliveryAccessProfile(record);
  const explicitAccess = explicitDeliveryAccessMarkers(record as Record<string, unknown>);
  const errors: string[] = [];
  const warnings: string[] = [];
  const agid = cleanAgid((record as { agid?: unknown }).agid);

  if (!agid) {
    errors.push('aoid-linked-agid-required');
  }
  if (deliveryAccess.autoLock && !explicitAccess.autoLock) {
    errors.push('aoid-delivery-access-kind-must-record-auto-lock');
  }
  if (deliveryAccess.poBox && !explicitAccess.poBox) {
    errors.push('aoid-delivery-access-kind-must-record-po-box');
  }
  if ((deliveryAccess.autoLock || deliveryAccess.poBox) && !deliveryAccess.carrierReviewRequired) {
    errors.push('aoid-delivery-access-carrier-review-required');
  }
  if ((deliveryAccess.autoLock || deliveryAccess.poBox) && !deliveryAccess.confirmedAt) {
    warnings.push('aoid-delivery-access-confirmation-timestamp-recommended');
  }

  return {
    ok: errors.length === 0,
    deliveryAccess,
    errors,
    warnings,
  };
}

export function normalizeAOIDRecord(
  record: RegisteredAddressRecord | AOIDRecord,
  options: { requireLinkedAgid?: boolean } = {},
): AOIDRecord {
  const updatedAt = typeof record.updatedAt === 'number' ? record.updatedAt : Date.now();
  const agid = cleanAgid(record.agid);
  if (options.requireLinkedAgid && !agid) {
    throw new Error('AOID registration requires a valid linked AGID.');
  }
  const id = normalizeAOIDId(record.id, agid ? { linkedAgid: agid } : {});
  const ownerKeyId = cleanKeyId((record as { ownerKeyId?: unknown }).ownerKeyId);
  const deviceKeyId = cleanKeyId((record as { deviceKeyId?: unknown }).deviceKeyId);
  const recordData = { ...record } as RegisteredAddressRecord & Partial<AOIDRecord>;
  delete recordData.agid;
  delete recordData.isAoid;
  delete recordData.ownerManaged;
  delete recordData.privacy;
  delete recordData.storageMode;
  delete recordData.syncReadiness;
  delete recordData.status;
  delete recordData.publicHandle;
  delete recordData.deliveryAccess;
  delete recordData.privateBody;
  delete recordData.ownerKeyId;
  delete recordData.deviceKeyId;
  delete recordData.version;
  const deliveryAccess = normalizeAOIDDeliveryAccessProfile(record as RegisteredAddressRecord & Partial<AOIDRecord>);
  const privateBody = agid
    ? buildAOIDPrivateBody({ ...(record as Record<string, unknown>), agid })
    : undefined;

  return {
    ...recordData,
    type: 'AOID',
    id,
    ...(agid ? { agid } : {}),
    isAoid: true,
    version: typeof (record as { version?: unknown }).version === 'number'
      ? (record as { version: number }).version
      : AOID_RECORD_VERSION,
    ownerManaged: true,
    privacy: 'private',
    storageMode: AOID_SYNC_POLICY.defaultStorageMode,
    syncReadiness: 'local-only',
    status: coerceAOIDStatus((record as { status?: unknown }).status),
    publicHandle: buildAOIDPublicHandle(id),
    deliveryAccess,
    ...(privateBody ? { privateBody } : {}),
    ...(ownerKeyId ? { ownerKeyId } : {}),
    ...(deviceKeyId ? { deviceKeyId } : {}),
    updatedAt,
  };
}

export function buildAOIDPublicDescriptor(record: RegisteredAddressRecord | AOIDRecord): AOIDPublicDescriptor {
  const normalized = normalizeAOIDRecord(record);
  return {
    type: 'AOID',
    id: normalized.id,
    ...(normalized.agid ? { agid: normalized.agid } : {}),
    ...(normalized.country ? { country: normalized.country } : {}),
    version: normalized.version,
    status: normalized.status,
    publicHandle: normalized.publicHandle,
    privacy: 'public-reference',
  };
}

export function redactAOIDForPublicUse(record: RegisteredAddressRecord | AOIDRecord): RegisteredAddressRecord {
  const descriptor = buildAOIDPublicDescriptor(record);
  const quality = sanitizeRegisteredAddressQualitySnapshot((record as RegisteredAddressRecord).quality);
  return {
    type: 'AOID',
    id: descriptor.id,
    ...(descriptor.agid ? { agid: descriptor.agid } : {}),
    ...(descriptor.country ? { country: descriptor.country } : {}),
    name: descriptor.agid || descriptor.publicHandle,
    address: descriptor.agid || descriptor.publicHandle,
    registeredAt: (record as RegisteredAddressRecord).registeredAt,
    publicHandle: descriptor.publicHandle,
    status: descriptor.status,
    version: descriptor.version,
    privacy: descriptor.privacy,
    ...(quality ? { quality } : {}),
  } as RegisteredAddressRecord;
}

export function revokeAOIDRecord(record: RegisteredAddressRecord | AOIDRecord, now = Date.now()): AOIDRecord {
  return {
    ...normalizeAOIDRecord(record),
    status: 'revoked',
    revokedAt: now,
    updatedAt: now,
  };
}
