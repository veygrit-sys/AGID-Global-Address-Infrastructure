import type { RegisteredAddressRecord } from '../registeredAddressQr';
import { isValidAGIDFormat, normalizeAGIDInput } from '../agidSecurity';
import type {
  AOIDAccessActor,
  AOIDAccessPurpose,
  AOIDDisclosureField,
  AOIDDropOffPreference,
  AOIDPrivateBody,
  AOIDRecord,
} from './types';

const DROP_OFF_PREFERENCES = new Set<AOIDDropOffPreference>([
  'recipient-handoff',
  'front-door',
  'locker',
  'front-desk',
  'designated-place',
  'do-not-leave-unattended',
]);
const ACCESS_ACTORS = new Set<AOIDAccessActor>([
  'owner',
  'recipient',
  'carrier',
  'delegate',
  'emergency-service',
]);
const ACCESS_PURPOSES = new Set<AOIDAccessPurpose>([
  'owner-management',
  'delivery',
  'residence-verification',
  'emergency',
]);
const DISCLOSURE_FIELDS = new Set<AOIDDisclosureField>([
  'agid',
  'building',
  'floor',
  'room',
  'recipient',
  'delivery-options',
  'intercom',
  'metadata',
]);

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function preferObject(primary: unknown, fallback: unknown) {
  const preferred = asObject(primary);
  return Object.keys(preferred).length > 0 ? preferred : asObject(fallback);
}

function cleanText(value: unknown, maxLength = 240) {
  const text = typeof value === 'string' ? value.normalize('NFKC').trim() : '';
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function cleanOptionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function cleanBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function cleanEnum<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  const text = cleanText(value).toLowerCase() as T;
  return allowed.has(text) ? text : fallback;
}

function cleanEnumList<T extends string>(value: unknown, allowed: Set<T>, fallback: T[]): T[] {
  if (!Array.isArray(value)) return [...fallback];
  const values = value
    .map(item => cleanText(item).toLowerCase() as T)
    .filter(item => allowed.has(item));
  return [...new Set(values.length > 0 ? values : fallback)];
}

function compactObject<T extends Record<string, unknown>>(value: T): T | undefined {
  return Object.values(value).some(item => item !== undefined && item !== '') ? value : undefined;
}

export function buildAOIDPrivateBody(
  record: RegisteredAddressRecord | AOIDRecord | Record<string, unknown>,
): AOIDPrivateBody {
  const source = record as Record<string, unknown>;
  const existing = asObject(source.privateBody);
  const agid = normalizeAGIDInput(existing.agid ?? source.agid);
  if (!agid || !isValidAGIDFormat(agid)) {
    throw new Error('AOID private body requires a valid linked AGID.');
  }

  const buildingSource = preferObject(source.building, existing.building);
  const recipientSource = preferObject(source.recipient, existing.recipient);
  const deliverySource = preferObject(source.deliveryOptions, existing.deliveryOptions);
  const intercomSource = preferObject(source.intercom, existing.intercom);
  const policySource = preferObject(source.accessPolicy, existing.accessPolicy);
  const validitySource = preferObject(source.validity, existing.validity);
  const metadataSource = preferObject(source.metadata, existing.metadata);

  const building = compactObject({
    name: cleanText(buildingSource.name ?? source.building ?? source.organization, 160) || undefined,
    block: cleanText(buildingSource.block ?? source.block ?? source.tower, 80) || undefined,
    entrance: cleanText(buildingSource.entrance ?? source.entrance, 120) || undefined,
  });
  const recipient = compactObject({
    name: cleanText(recipientSource.name ?? source.recipient ?? source.name, 160) || undefined,
    organization: cleanText(recipientSource.organization ?? source.organization, 160) || undefined,
    phone: cleanText(recipientSource.phone ?? source.phone, 80) || undefined,
  });
  const intercom = compactObject({
    callLabel: cleanText(intercomSource.callLabel ?? source.intercomLabel, 120) || undefined,
    accessCode: cleanText(intercomSource.accessCode ?? source.intercomCode, 120) || undefined,
    instructions: cleanText(intercomSource.instructions ?? source.intercomInstructions, 500) || undefined,
  });
  const validFrom = cleanOptionalNumber(validitySource.validFrom ?? source.validFrom);
  const validUntil = cleanOptionalNumber(validitySource.validUntil ?? source.validUntil);

  return {
    schemaVersion: 'aoid-private-body-v1',
    agid,
    ...(building ? { building } : {}),
    ...(cleanText(source.floor ?? existing.floor, 80) ? {
      floor: cleanText(source.floor ?? existing.floor, 80),
    } : {}),
    ...(cleanText(source.room ?? source.unit ?? source.unitNumber ?? existing.room, 80) ? {
      room: cleanText(source.room ?? source.unit ?? source.unitNumber ?? existing.room, 80),
    } : {}),
    ...(recipient ? { recipient } : {}),
    deliveryOptions: {
      dropOffPreference: cleanEnum(
        deliverySource.dropOffPreference ?? source.dropOffPreference,
        DROP_OFF_PREFERENCES,
        'recipient-handoff',
      ),
      unattendedDeliveryAllowed: cleanBoolean(
        deliverySource.unattendedDeliveryAllowed ?? source.unattendedDeliveryAllowed,
        false,
      ),
      signatureRequired: cleanBoolean(
        deliverySource.signatureRequired ?? source.signatureRequired,
        false,
      ),
      ...(cleanText(deliverySource.instructions ?? source.deliveryInstructions, 1000) ? {
        instructions: cleanText(deliverySource.instructions ?? source.deliveryInstructions, 1000),
      } : {}),
    },
    ...(intercom ? { intercom } : {}),
    accessPolicy: {
      allowedActors: cleanEnumList(policySource.allowedActors, ACCESS_ACTORS, ['owner']),
      allowedPurposes: cleanEnumList(
        policySource.allowedPurposes,
        ACCESS_PURPOSES,
        ['owner-management'],
      ),
      disclosedFields: cleanEnumList(policySource.disclosedFields, DISCLOSURE_FIELDS, ['agid']),
      ownerConsentRequired: cleanBoolean(policySource.ownerConsentRequired, true),
    },
    validity: {
      ...(validFrom !== undefined ? { validFrom } : {}),
      ...(validUntil !== undefined ? { validUntil } : {}),
    },
    metadata: {
      ...(cleanText(metadataSource.label ?? source.label, 160) ? {
        label: cleanText(metadataSource.label ?? source.label, 160),
      } : {}),
      ...(cleanText(metadataSource.locale ?? source.locale, 40) ? {
        locale: cleanText(metadataSource.locale ?? source.locale, 40),
      } : {}),
      tags: Array.isArray(metadataSource.tags)
        ? [...new Set(metadataSource.tags.map(tag => cleanText(tag, 60)).filter(Boolean))].slice(0, 32)
        : [],
    },
  };
}

export function validateAOIDPrivateBody(value: unknown) {
  const errors: string[] = [];
  let body: AOIDPrivateBody | undefined;

  try {
    body = buildAOIDPrivateBody(asObject(value));
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Invalid AOID private body.');
    return { ok: false, errors };
  }

  if (body.validity.validFrom !== undefined
    && body.validity.validUntil !== undefined
    && body.validity.validUntil <= body.validity.validFrom) {
    errors.push('AOID validUntil must be later than validFrom.');
  }
  if (!body.accessPolicy.ownerConsentRequired) {
    errors.push('AOID private disclosure must require owner consent.');
  }

  return {
    ok: errors.length === 0,
    errors,
    body,
  };
}
