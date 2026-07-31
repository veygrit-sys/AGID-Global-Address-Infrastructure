import {
  sanitizeRegisteredAddressForPublicQr,
  type RegisteredAddressQrPrivacy,
} from './privacyPolicy';
import { formatAddressDisplayText } from './addressDisplay';
import { AddressRenderer, createCanonicalAddress } from './addressRendering';
import type { AddressFormat } from '../data/address_formats';
import { normalizeAOIDRecord, redactAOIDForPublicUse } from './aoid';
import {
  AGID_SECURITY_POLICY,
  isValidAGIDFormat,
  normalizeAGIDInput,
  validatePublicAgidPayload,
} from './agidSecurity';
import {
  buildAgidAoidAuditEvent,
  evaluateAgidAoidOperation,
  type AgidAoidLayer,
  type AgidAoidSurface,
} from './agidAoidGovernance';
import {
  sanitizeRegisteredAddressQualitySnapshot,
  type RegisteredAddressQualitySnapshot,
} from './registeredAddressQuality';

export type RegisteredAddressMode = 'ADDRESS' | 'AOID';

export type RegisteredAddressFormData = {
  country?: string;
  recipient?: string;
  organization?: string;
  street?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  phone?: string;
  building?: string;
  room?: string;
  [key: string]: unknown;
};

export type RegisteredAddressRecord = RegisteredAddressFormData & {
  type: RegisteredAddressMode;
  id: string;
  agid?: string;
  name: string;
  address: string;
  registeredAt: string;
  lat?: number;
  lon?: number;
  lng?: number;
  updatedAt?: number;
  quality?: RegisteredAddressQualitySnapshot;
};

export type SavedRegisteredAddressQr = {
  id: string;
  lat?: number;
  lon?: number;
  address: string;
  regionName: string;
  savedAt: string;
  payload: string;
  source: 'registered_address';
};

const QR_PREFIX = 'agid:address:';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanAgid(value: unknown) {
  const normalized = normalizeAGIDInput(value);
  return normalized && isValidAGIDFormat(normalized) ? normalized : '';
}

function compact(parts: string[]) {
  return parts.map(part => part.trim()).filter(Boolean);
}

function layerForRecord(record: Pick<RegisteredAddressRecord, 'type'>): AgidAoidLayer {
  return record.type === 'AOID' ? 'AOID' : 'AGID';
}

function surfaceForPrivacy(privacy: RegisteredAddressQrPrivacy | undefined): AgidAoidSurface {
  return privacy === 'public' ? 'public-qr' : 'private-qr';
}

function publicHandleFromRecord(record: RegisteredAddressRecord) {
  const publicHandle = (record as Record<string, unknown>).publicHandle;
  return typeof publicHandle === 'string'
    ? publicHandle
    : undefined;
}

function withSanitizedQuality(record: RegisteredAddressRecord): RegisteredAddressRecord {
  const { quality: unsafeQuality, ...rest } = record as RegisteredAddressRecord & {
    quality?: unknown;
  };
  const quality = sanitizeRegisteredAddressQualitySnapshot(unsafeQuality);
  return {
    ...rest,
    ...(quality ? { quality } : {}),
  };
}

export function formatRegisteredAddress(formData: RegisteredAddressFormData) {
  const organization = clean(formData.organization);
  const street = clean(formData.street);
  const suburb = clean(formData.suburb);
  const city = clean(formData.city);
  const state = clean(formData.state);
  const postcode = clean(formData.postcode);
  const country = clean(formData.country);

  const parts: string[] = [];
  if (organization) parts.push(organization);
  if (street) parts.push(street);
  if (suburb) parts.push(suburb);

  if (city && state) {
    parts.push(city);
    parts.push(compact([state, postcode]).join(' '));
  } else if (city) {
    parts.push(compact([city, postcode]).join(' '));
  } else if (state) {
    parts.push(compact([state, postcode]).join(' '));
  } else if (postcode) {
    parts.push(postcode);
  }

  if (country) parts.push(country);
  return compact(parts).join(', ');
}

/**
 * Renders only the location portion of a saved record. Recipient and phone
 * fields are deliberately outside this presentation path.
 */
export function formatRegisteredAddressLocationDisplay(
  formData: RegisteredAddressFormData,
  options: { tab?: string; format?: AddressFormat | null } = {},
) {
  const countryCode = clean(formData.country).toUpperCase();
  const tab = options.tab || 'local';
  const canonical = createCanonicalAddress({
    ...formData,
    country_code: countryCode,
    building: clean(formData.building) || clean(formData.organization),
    unit: clean(formData.room),
  });
  const rendered = AddressRenderer.render(tab, canonical, options.format);
  const fallback = formatRegisteredAddress(formData);

  return formatAddressDisplayText(rendered || fallback, {
    tab,
    countryCode,
  });
}

export function buildRegisteredAddressRecord(
  formData: RegisteredAddressFormData,
  options: {
    mode?: RegisteredAddressMode;
    id?: string;
    agid?: string;
    coords?: { lat: number; lon: number };
    now?: string;
    quality?: RegisteredAddressQualitySnapshot | null;
  } = {},
): RegisteredAddressRecord {
  const { quality: formQuality, ...recordFormData } = formData as RegisteredAddressFormData & {
    quality?: unknown;
  };
  const mode = options.mode || 'ADDRESS';
  const registeredAt = options.now || new Date().toISOString();
  const timestampId = registeredAt.replace(/\D/g, '').slice(0, 14) || Date.now().toString();
  const agid = cleanAgid(options.agid);
  const id = clean(options.id) || (mode === 'ADDRESS' && agid ? agid : `${mode}-${timestampId}`);
  const name = clean(formData.recipient) || clean(formData.organization) || id;
  const address = formatRegisteredAddress(formData);
  const lat = options.coords?.lat;
  const lon = options.coords?.lon;
  const quality = sanitizeRegisteredAddressQualitySnapshot(options.quality ?? formQuality);

  const record: RegisteredAddressRecord = {
    ...recordFormData,
    type: mode,
    id,
    ...(agid ? { agid } : {}),
    name,
    address,
    registeredAt,
    ...(typeof lat === 'number' ? { lat } : {}),
    ...(typeof lon === 'number' ? { lon, lng: lon } : {}),
    updatedAt: Date.parse(registeredAt),
    ...(quality ? { quality } : {}),
  };

  return mode === 'AOID'
    ? normalizeAOIDRecord(record, { requireLinkedAgid: true })
    : record;
}

export function buildRegisteredAddressQrPayload(
  record: RegisteredAddressRecord,
  options: { privacy?: RegisteredAddressQrPrivacy } = {},
) {
  const qrRecord = withSanitizedQuality(options.privacy === 'public'
    ? sanitizeRegisteredAddressForPublicQr(record)
    : record);
  const addressQuality = sanitizeRegisteredAddressQualitySnapshot(qrRecord.quality);
  const publicValidation = options.privacy === 'public'
    ? validatePublicAgidPayload(qrRecord)
    : { ok: true, forbiddenFields: [] };
  if (!publicValidation.ok) {
    throw new Error(`Public AGID QR contains private fields: ${publicValidation.forbiddenFields.join(', ')}`);
  }
  const surface = surfaceForPrivacy(options.privacy);
  const audit = buildAgidAoidAuditEvent({
    layer: layerForRecord(record),
    operation: 'qr-build',
    surface,
    entityId: record.id,
    agid: record.agid,
    publicHandle: publicHandleFromRecord(record),
    payload: qrRecord,
    now: record.updatedAt,
  });
  if (audit.outcome !== 'allowed') {
    throw new Error(`AGID/AOID QR policy blocked payload: ${audit.warnings.join(' ')}`);
  }

  return `${QR_PREFIX}${encodeURIComponent(JSON.stringify({
    version: 1,
    privacy: options.privacy || 'full',
    security: {
      profile: AGID_SECURITY_POLICY.id,
      publicLayer: options.privacy === 'public',
    },
    audit,
    ...(addressQuality ? { addressQuality } : {}),
    record: qrRecord,
  }))}`;
}

export function parseRegisteredAddressQrPayload(text: string): RegisteredAddressRecord | null {
  const value = text.trim();
  if (!value.startsWith(QR_PREFIX)) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value.slice(QR_PREFIX.length)));
    const record = parsed?.record || parsed;
    if (!record || (record.type !== 'ADDRESS' && record.type !== 'AOID') || !record.id) {
      return null;
    }
    if (record.agid && !isValidAGIDFormat(record.agid)) {
      return null;
    }
    const recordQuality = sanitizeRegisteredAddressQualitySnapshot(record.quality ?? parsed?.addressQuality);
    const recordWithoutQuality = { ...(record as Record<string, unknown>) };
    delete recordWithoutQuality.quality;
    const normalizedRecord = {
      ...recordWithoutQuality,
      ...(record.agid ? { agid: normalizeAGIDInput(record.agid) } : {}),
      ...(recordQuality ? { quality: recordQuality } : {}),
    } as RegisteredAddressRecord;
    if (record.type === 'AOID') {
      const isPublic = parsed?.privacy === 'public' || record.privacy === 'public-reference';
      const aoidRecord = isPublic
        ? redactAOIDForPublicUse(normalizedRecord)
        : normalizeAOIDRecord(normalizedRecord);
      const decision = evaluateAgidAoidOperation({
        layer: 'AOID',
        operation: 'qr-parse',
        surface: isPublic ? 'public-qr' : 'private-qr',
        payload: aoidRecord,
      });
      return decision.allowed ? aoidRecord : null;
    }
    if (parsed?.privacy === 'public' || record.privacy === 'public-reference') {
      const publicRecord = sanitizeRegisteredAddressForPublicQr(normalizedRecord as RegisteredAddressRecord);
      const decision = evaluateAgidAoidOperation({
        layer: 'AGID',
        operation: 'qr-parse',
        surface: 'public-qr',
        payload: publicRecord,
      });
      return validatePublicAgidPayload(publicRecord).ok && decision.allowed ? publicRecord : null;
    }
    const decision = evaluateAgidAoidOperation({
      layer: 'AGID',
      operation: 'qr-parse',
      surface: 'private-qr',
      payload: normalizedRecord,
    });
    if (!decision.allowed) return null;
    return normalizedRecord as RegisteredAddressRecord;
  } catch {
    return null;
  }
}

export function buildSavedQrFromRegisteredAddress(
  record: RegisteredAddressRecord,
  payload: string,
  savedAt = new Date().toISOString(),
  options: { privacy?: RegisteredAddressQrPrivacy } = {},
): SavedRegisteredAddressQr {
  const publicAddressLabel = `${record.agid || record.id} public address reference`;
  return {
    id: record.agid || record.id,
    lat: record.lat,
    lon: record.lon ?? record.lng,
    address: options.privacy === 'public' ? publicAddressLabel : record.address,
    regionName: `${record.country || 'AGID'} Registered Address`,
    savedAt,
    payload,
    source: 'registered_address',
  };
}
