import {
  parseRegisteredAddressQrPayload,
  type RegisteredAddressFormData,
  type RegisteredAddressRecord,
} from './registeredAddressQr';
import { sha256Hex } from './sha256';

export const HOTEL_CHECKIN_QR_PREFIX = 'agid:hotel-checkin:';
export const HOTEL_CHECKIN_MODEL_VERSION = 'agid-hotel-checkin-v1';

export const HOTEL_CHECKIN_SCOPE_VALUES = [
  'guest-address',
  'residence-region',
  'delivery-eligibility',
  'recipient-proof',
  'local-contact',
] as const;

export type HotelCheckInScope = typeof HOTEL_CHECKIN_SCOPE_VALUES[number];

export type HotelCheckInQrInput = {
  hotelAlias: string;
  bookingAlias?: string;
  propertyName?: string;
  countryCode?: string;
  city?: string;
  checkInStartsAt?: string;
  checkInEndsAt?: string;
  requestedScopes?: HotelCheckInScope[];
  highRiskMode?: boolean;
  now?: string;
};

export type HotelCheckInSessionStatus =
  | 'requires_guest_address'
  | 'ready'
  | 'requires_review'
  | 'expired'
  | 'rejected';

export type HotelCheckInSession = {
  modelVersion: typeof HOTEL_CHECKIN_MODEL_VERSION;
  status: HotelCheckInSessionStatus;
  safeCheckInRef: string;
  hotel: {
    hotelAlias: string;
    bookingAlias?: string;
    propertyName?: string;
    countryCode?: string;
    city?: string;
  };
  requestedScopes: HotelCheckInScope[];
  nextAction:
    | 'scan_guest_address_qr'
    | 'review_guest_address'
    | 'complete_check_in'
    | 'manual_review'
    | 'expired';
  highRiskMode: boolean;
  checkInStartsAt?: string;
  checkInEndsAt?: string;
  warnings: string[];
  privacy: {
    storesHotelAddressOnly: false;
    storesGuestAddressInHotelQr: false;
    guestProofMaterialStored: false;
    serverSideAutofillRequired: false;
  };
};

export type AddressQrIntakeResult =
  | {
      kind: 'registered-address';
      status: 'ready' | 'needs_review';
      record: RegisteredAddressRecord;
      formPatch: RegisteredAddressFormData;
      source: 'registered-address-qr';
      nextAction: 'review_and_register';
      warnings: string[];
    }
  | {
      kind: 'hotel-checkin';
      status: HotelCheckInSessionStatus;
      session: HotelCheckInSession;
      formPatch: RegisteredAddressFormData;
      source: 'hotel-checkin-qr';
      nextAction: HotelCheckInSession['nextAction'];
      warnings: string[];
    }
  | {
      kind: 'unsupported';
      status: 'unsupported';
      formPatch: RegisteredAddressFormData;
      source: 'unknown-qr';
      nextAction: 'manual_entry';
      warnings: string[];
    };

const HOTEL_PRIVATE_FIELD_BLOCKLIST = new Set([
  'guestName',
  'guestPhone',
  'guestAddress',
  'fullAddress',
  'passportNumber',
  'documentNumber',
  'idNumber',
  'roomNumber',
]);

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCountryCode(value: unknown) {
  const text = cleanText(value).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : '';
}

function normalizeHotelAlias(value: unknown) {
  const text = cleanText(value).toUpperCase();
  return /^[A-Z0-9][A-Z0-9._:-]{2,63}$/.test(text) ? text : '';
}

function normalizeOptionalAlias(value: unknown) {
  const text = cleanText(value).toUpperCase();
  return /^[A-Z0-9][A-Z0-9._:-]{2,96}$/.test(text) ? text : '';
}

function normalizeScopes(value: unknown): HotelCheckInScope[] {
  const scopes = Array.isArray(value) ? value : [];
  const normalized = scopes.filter((scope): scope is HotelCheckInScope =>
    HOTEL_CHECKIN_SCOPE_VALUES.includes(scope as HotelCheckInScope),
  );
  return normalized.length ? Array.from(new Set(normalized)) : ['guest-address', 'recipient-proof'];
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function safeDecodePayload(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}

function isExpired(endsAt: string | undefined, now: string) {
  if (!endsAt) return false;
  const end = Date.parse(endsAt);
  const current = Date.parse(now);
  return Number.isFinite(end) && Number.isFinite(current) && end < current;
}

function hasBlockedHotelPrivateFields(record: Record<string, unknown>) {
  return Object.keys(record).some(key => HOTEL_PRIVATE_FIELD_BLOCKLIST.has(key));
}

function makeSafeCheckInRef(input: unknown) {
  return `hotel-checkin:${sha256Hex(JSON.stringify(input)).slice(0, 24)}`;
}

export function buildAddressInputPatchFromRegisteredQr(record: RegisteredAddressRecord): RegisteredAddressFormData {
  return {
    country: cleanText(record.country).toUpperCase(),
    recipient: cleanText(record.recipient),
    organization: cleanText(record.organization),
    street: cleanText(record.street),
    suburb: cleanText(record.suburb),
    city: cleanText(record.city),
    state: cleanText(record.state),
    postcode: cleanText(record.postcode),
    phone: cleanText(record.phone),
    building: cleanText(record.building),
    room: cleanText(record.room),
  };
}

export function buildHotelCheckInQrPayload(input: HotelCheckInQrInput) {
  const now = input.now || new Date().toISOString();
  const hotelAlias = normalizeHotelAlias(input.hotelAlias);
  if (!hotelAlias) {
    throw new Error('Hotel check-in QR requires a stable hotel alias.');
  }

  const record = {
    modelVersion: HOTEL_CHECKIN_MODEL_VERSION,
    version: 1,
    issuedAt: now,
    hotelAlias,
    ...(normalizeOptionalAlias(input.bookingAlias) ? { bookingAlias: normalizeOptionalAlias(input.bookingAlias) } : {}),
    ...(cleanText(input.propertyName) ? { propertyName: cleanText(input.propertyName).slice(0, 96) } : {}),
    ...(normalizeCountryCode(input.countryCode) ? { countryCode: normalizeCountryCode(input.countryCode) } : {}),
    ...(cleanText(input.city) ? { city: cleanText(input.city).slice(0, 96) } : {}),
    ...(cleanText(input.checkInStartsAt) ? { checkInStartsAt: cleanText(input.checkInStartsAt) } : {}),
    ...(cleanText(input.checkInEndsAt) ? { checkInEndsAt: cleanText(input.checkInEndsAt) } : {}),
    requestedScopes: normalizeScopes(input.requestedScopes),
    highRiskMode: Boolean(input.highRiskMode),
    privacy: {
      storesGuestAddressInHotelQr: false,
      guestProofMaterialStored: false,
    },
  };

  return `${HOTEL_CHECKIN_QR_PREFIX}${encodeURIComponent(JSON.stringify(record))}`;
}

export function parseHotelCheckInQrPayload(text: string, now = new Date().toISOString()): HotelCheckInSession | null {
  const value = cleanText(text);
  if (!value.startsWith(HOTEL_CHECKIN_QR_PREFIX)) return null;

  const parsed = safeJson(safeDecodePayload(value.slice(HOTEL_CHECKIN_QR_PREFIX.length)));
  if (!parsed || parsed.modelVersion !== HOTEL_CHECKIN_MODEL_VERSION || parsed.version !== 1) return null;
  if (hasBlockedHotelPrivateFields(parsed)) return null;

  const hotelAlias = normalizeHotelAlias(parsed.hotelAlias);
  if (!hotelAlias) return null;

  const requestedScopes = normalizeScopes(parsed.requestedScopes);
  const expired = isExpired(cleanText(parsed.checkInEndsAt) || undefined, now);
  const highRiskMode = Boolean(parsed.highRiskMode);
  const warnings: string[] = [];
  if (!requestedScopes.includes('guest-address')) warnings.push('hotel-checkin-guest-address-scope-missing');
  if (!requestedScopes.includes('recipient-proof')) warnings.push('hotel-checkin-recipient-proof-scope-missing');
  if (highRiskMode) warnings.push('hotel-checkin-high-risk-mode-live-proof-required');

  const status: HotelCheckInSessionStatus = expired
    ? 'expired'
    : warnings.some(warning => warning.includes('missing'))
      ? 'requires_review'
      : 'requires_guest_address';

  return {
    modelVersion: HOTEL_CHECKIN_MODEL_VERSION,
    status,
    safeCheckInRef: makeSafeCheckInRef(parsed),
    hotel: {
      hotelAlias,
      ...(normalizeOptionalAlias(parsed.bookingAlias) ? { bookingAlias: normalizeOptionalAlias(parsed.bookingAlias) } : {}),
      ...(cleanText(parsed.propertyName) ? { propertyName: cleanText(parsed.propertyName) } : {}),
      ...(normalizeCountryCode(parsed.countryCode) ? { countryCode: normalizeCountryCode(parsed.countryCode) } : {}),
      ...(cleanText(parsed.city) ? { city: cleanText(parsed.city) } : {}),
    },
    requestedScopes,
    nextAction: expired
      ? 'expired'
      : status === 'requires_review'
        ? 'manual_review'
        : 'scan_guest_address_qr',
    highRiskMode,
    ...(cleanText(parsed.checkInStartsAt) ? { checkInStartsAt: cleanText(parsed.checkInStartsAt) } : {}),
    ...(cleanText(parsed.checkInEndsAt) ? { checkInEndsAt: cleanText(parsed.checkInEndsAt) } : {}),
    warnings,
    privacy: {
      storesHotelAddressOnly: false,
      storesGuestAddressInHotelQr: false,
      guestProofMaterialStored: false,
      serverSideAutofillRequired: false,
    },
  };
}

export function parseAddressQrIntake(text: string, now = new Date().toISOString()): AddressQrIntakeResult {
  const registeredAddress = parseRegisteredAddressQrPayload(text);
  if (registeredAddress) {
    const formPatch = buildAddressInputPatchFromRegisteredQr(registeredAddress);
    const warnings = registeredAddress.type === 'AOID' && (registeredAddress as { privacy?: unknown }).privacy === 'public-reference'
      ? ['public-aoid-reference-cannot-autofill-private-fields']
      : [];

    return {
      kind: 'registered-address',
      status: warnings.length ? 'needs_review' : 'ready',
      record: registeredAddress,
      formPatch,
      source: 'registered-address-qr',
      nextAction: 'review_and_register',
      warnings,
    };
  }

  const hotelSession = parseHotelCheckInQrPayload(text, now);
  if (hotelSession) {
    return {
      kind: 'hotel-checkin',
      status: hotelSession.status,
      session: hotelSession,
      formPatch: {},
      source: 'hotel-checkin-qr',
      nextAction: hotelSession.nextAction,
      warnings: hotelSession.warnings,
    };
  }

  return {
    kind: 'unsupported',
    status: 'unsupported',
    formPatch: {},
    source: 'unknown-qr',
    nextAction: 'manual_entry',
    warnings: ['qr-intake-unsupported-format'],
  };
}
