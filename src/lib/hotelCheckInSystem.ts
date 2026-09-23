import {
  buildHotelCheckInQrPayload,
  parseAddressQrIntake,
  type HotelCheckInScope,
} from './addressQrIntake';
import { sha256Hex } from './sha256';

export const HOTEL_CHECKIN_SYSTEM_MODEL_VERSION = 'agid-hotel-checkin-system-v1';
export const HOTEL_CHECKIN_RECEIPT_VERSION = 'agid-hotel-checkin-receipt-v1';

export type HotelCheckInDeskInput = {
  propertyAlias: string;
  propertyName?: string;
  staffAlias: string;
  terminalAlias: string;
  bookingAlias?: string;
  countryCode?: string;
  city?: string;
  requestedScopes?: HotelCheckInScope[];
  highRiskMode?: boolean;
  ttlMinutes?: number;
  now?: string;
};

export type HotelCheckInDeskRequestStatus =
  | 'issued'
  | 'expired'
  | 'guest_pending'
  | 'guest_verified'
  | 'requires_review'
  | 'completed';

export type HotelCheckInDeskRequest = {
  modelVersion: typeof HOTEL_CHECKIN_SYSTEM_MODEL_VERSION;
  requestId: string;
  status: HotelCheckInDeskRequestStatus;
  issuedAt: string;
  expiresAt: string;
  qrPayload: string;
  property: {
    propertyAlias: string;
    propertyName?: string;
    countryCode?: string;
    city?: string;
  };
  staffAlias: string;
  terminalAlias: string;
  bookingAlias?: string;
  requestedScopes: HotelCheckInScope[];
  highRiskMode: boolean;
  nextAction: 'show_qr_to_guest' | 'scan_guest_qr' | 'manual_review' | 'complete_check_in' | 'expired';
  privacy: {
    hotelQrContainsGuestPrivateFields: false;
    guestPrivateFieldsPersisted: false;
    rawAgidPersisted: false;
    rawAoidPersisted: false;
    pmsExportRequiresExplicitAction: true;
  };
};

export type HotelGuestQrScanResult = {
  modelVersion: typeof HOTEL_CHECKIN_SYSTEM_MODEL_VERSION;
  requestId: string;
  scannedAt: string;
  status: Extract<HotelCheckInDeskRequestStatus, 'guest_verified' | 'requires_review' | 'expired'>;
  decision: 'accept' | 'review' | 'reject';
  source: 'registered-address-qr' | 'hotel-checkin-qr' | 'unknown-qr';
  addressSignal: {
    countryPresent: boolean;
    cityPresent: boolean;
    postcodePresent: boolean;
    streetPresent: boolean;
    buildingOrRoomPresent: boolean;
    publicAoidReferenceOnly: boolean;
  };
  safeSubjectRef: string;
  warnings: string[];
  privacy: {
    rawAddressPersisted: false;
    rawAgidPersisted: false;
    rawAoidPersisted: false;
    recipientNamePersisted: false;
    phonePersisted: false;
    roomPersisted: false;
  };
};

export type HotelCheckInReceipt = {
  receiptVersion: typeof HOTEL_CHECKIN_RECEIPT_VERSION;
  receiptId: string;
  requestId: string;
  createdAt: string;
  action: 'issue_qr' | 'guest_qr_scan' | 'complete_check_in';
  propertyAlias: string;
  bookingAlias?: string;
  staffAlias: string;
  terminalAlias: string;
  status: HotelCheckInDeskRequestStatus;
  decision: 'pending' | 'accept' | 'review' | 'reject' | 'complete';
  safeSubjectRef: string;
  requestedScopes: HotelCheckInScope[];
  highRiskMode: boolean;
  receiptRoot: string;
  warnings: string[];
  privacy: {
    containsRawGuestAddress: false;
    containsRawAgid: false;
    containsRawAoid: false;
    containsRecipientName: false;
    containsPhoneNumber: false;
    containsRoomNumber: false;
  };
};

export type HotelCheckInPayloadSafety = {
  safe: boolean;
  findings: string[];
};

const PRIVATE_GUEST_FIELD_KEYS = new Set([
  'guestAddress',
  'rawGuestAddress',
  'fullAddress',
  'recipientName',
  'guestName',
  'phoneNumber',
  'guestPhone',
  'roomNumber',
  'passportNumber',
  'documentNumber',
  'proofCode',
  'recipientSecret',
  'rawAgid',
  'rawAoid',
]);

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map(key => [key, (value as Record<string, unknown>)[key]] as const);
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`;
}

function cleanAlias(value: unknown, fallback: string, maxLength = 64) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim().replace(/[^\p{L}\p{N}:._/-]+/gu, '-').replace(/-+/g, '-');
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function cleanText(value: unknown, maxLength = 96) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

function normalizeCountryCode(value: unknown) {
  const text = cleanText(value, 2).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : '';
}

function clampTtlMinutes(value: unknown, highRiskMode: boolean) {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 10;
  const min = 1;
  const max = highRiskMode ? 10 : 60;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function addMinutes(value: string, minutes: number) {
  return new Date(Date.parse(value) + minutes * 60_000).toISOString();
}

function isExpired(expiresAt: string, now: string) {
  return Date.parse(expiresAt) < Date.parse(now);
}

function requestRoot(input: unknown) {
  return sha256Hex(stableJson(input));
}

function safeSubjectRef(seed: unknown) {
  return `hotel-subject:${sha256Hex(stableJson(seed)).slice(0, 24)}`;
}

function findPrivateGuestFields(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findPrivateGuestFields(item, `${prefix}[${index}]`));
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const findings = PRIVATE_GUEST_FIELD_KEYS.has(key) ? [path] : [];
    return [...findings, ...findPrivateGuestFields(nested, path)];
  });
}

export function validateHotelCheckInPayloadIsSafe(value: unknown): HotelCheckInPayloadSafety {
  const findings = findPrivateGuestFields(value);
  return {
    safe: findings.length === 0,
    findings,
  };
}

export function buildHotelCheckInDeskRequest(input: HotelCheckInDeskInput): HotelCheckInDeskRequest {
  const now = input.now || new Date().toISOString();
  const highRiskMode = Boolean(input.highRiskMode);
  const ttlMinutes = clampTtlMinutes(input.ttlMinutes, highRiskMode);
  const expiresAt = addMinutes(now, ttlMinutes);
  const propertyAlias = cleanAlias(input.propertyAlias, 'hotel:local-front-desk');
  const staffAlias = cleanAlias(input.staffAlias, 'staff:front-desk');
  const terminalAlias = cleanAlias(input.terminalAlias, 'terminal:hotel-desk');
  const bookingAlias = cleanAlias(input.bookingAlias, '', 80);
  const propertyName = cleanText(input.propertyName);
  const countryCode = normalizeCountryCode(input.countryCode);
  const city = cleanText(input.city);
  const requestedScopes: HotelCheckInScope[] = input.requestedScopes?.length
    ? input.requestedScopes
    : ['guest-address', 'recipient-proof'];
  const qrPayload = buildHotelCheckInQrPayload({
    hotelAlias: propertyAlias,
    bookingAlias,
    propertyName,
    countryCode,
    city,
    checkInStartsAt: now,
    checkInEndsAt: expiresAt,
    requestedScopes,
    highRiskMode,
    now,
  });
  const root = requestRoot({
    propertyAlias,
    bookingAlias,
    staffAlias,
    terminalAlias,
    issuedAt: now,
    expiresAt,
    requestedScopes,
    highRiskMode,
  });

  return {
    modelVersion: HOTEL_CHECKIN_SYSTEM_MODEL_VERSION,
    requestId: `HCI-${root.slice(0, 20).toUpperCase()}`,
    status: 'issued',
    issuedAt: now,
    expiresAt,
    qrPayload,
    property: {
      propertyAlias,
      ...(propertyName ? { propertyName } : {}),
      ...(countryCode ? { countryCode } : {}),
      ...(city ? { city } : {}),
    },
    staffAlias,
    terminalAlias,
    ...(bookingAlias ? { bookingAlias } : {}),
    requestedScopes,
    highRiskMode,
    nextAction: 'show_qr_to_guest',
    privacy: {
      hotelQrContainsGuestPrivateFields: false,
      guestPrivateFieldsPersisted: false,
      rawAgidPersisted: false,
      rawAoidPersisted: false,
      pmsExportRequiresExplicitAction: true,
    },
  };
}

export function buildHotelCheckInReceipt(
  request: HotelCheckInDeskRequest,
  action: HotelCheckInReceipt['action'],
  options: {
    createdAt?: string;
    status?: HotelCheckInDeskRequestStatus;
    decision?: HotelCheckInReceipt['decision'];
    safeSubjectRef?: string;
    warnings?: string[];
  } = {},
): HotelCheckInReceipt {
  const createdAt = options.createdAt || new Date().toISOString();
  const status = options.status || request.status;
  const decision = options.decision || (status === 'completed' ? 'complete' : 'pending');
  const subjectRef = options.safeSubjectRef || safeSubjectRef({
    requestId: request.requestId,
    bookingAlias: request.bookingAlias ?? null,
    action,
  });
  const receiptRoot = sha256Hex(stableJson({
    receiptVersion: HOTEL_CHECKIN_RECEIPT_VERSION,
    action,
    createdAt,
    requestId: request.requestId,
    propertyAlias: request.property.propertyAlias,
    terminalAlias: request.terminalAlias,
    status,
    decision,
    subjectRef,
    requestedScopes: request.requestedScopes,
    highRiskMode: request.highRiskMode,
  }));
  const receipt = {
    receiptVersion: HOTEL_CHECKIN_RECEIPT_VERSION,
    receiptId: `HCR-${receiptRoot.slice(0, 24).toUpperCase()}`,
    requestId: request.requestId,
    createdAt,
    action,
    propertyAlias: request.property.propertyAlias,
    ...(request.bookingAlias ? { bookingAlias: request.bookingAlias } : {}),
    staffAlias: request.staffAlias,
    terminalAlias: request.terminalAlias,
    status,
    decision,
    safeSubjectRef: subjectRef,
    requestedScopes: request.requestedScopes,
    highRiskMode: request.highRiskMode,
    receiptRoot,
    warnings: options.warnings ?? [],
    privacy: {
      containsRawGuestAddress: false,
      containsRawAgid: false,
      containsRawAoid: false,
      containsRecipientName: false,
      containsPhoneNumber: false,
      containsRoomNumber: false,
    },
  } satisfies HotelCheckInReceipt;

  const safety = validateHotelCheckInPayloadIsSafe(receipt);
  if (!safety.safe) {
    throw new Error(`hotel-checkin-receipt-contained-private-fields:${safety.findings.join(',')}`);
  }

  return receipt;
}

export function processHotelGuestQrScan(
  request: HotelCheckInDeskRequest,
  qrText: string,
  now = new Date().toISOString(),
): { request: HotelCheckInDeskRequest; scan: HotelGuestQrScanResult; receipt: HotelCheckInReceipt } {
  if (isExpired(request.expiresAt, now)) {
    const scan = {
      modelVersion: HOTEL_CHECKIN_SYSTEM_MODEL_VERSION,
      requestId: request.requestId,
      scannedAt: now,
      status: 'expired',
      decision: 'reject',
      source: 'unknown-qr',
      addressSignal: {
        countryPresent: false,
        cityPresent: false,
        postcodePresent: false,
        streetPresent: false,
        buildingOrRoomPresent: false,
        publicAoidReferenceOnly: false,
      },
      safeSubjectRef: safeSubjectRef({ requestId: request.requestId, expired: true }),
      warnings: ['hotel-checkin-request-expired'],
      privacy: {
        rawAddressPersisted: false,
        rawAgidPersisted: false,
        rawAoidPersisted: false,
        recipientNamePersisted: false,
        phonePersisted: false,
        roomPersisted: false,
      },
    } satisfies HotelGuestQrScanResult;
    const nextRequest = { ...request, status: 'expired' as const, nextAction: 'expired' as const };
    const receipt = buildHotelCheckInReceipt(nextRequest, 'guest_qr_scan', {
      createdAt: now,
      status: 'expired',
      decision: 'reject',
      safeSubjectRef: scan.safeSubjectRef,
      warnings: scan.warnings,
    });
    return { request: nextRequest, scan, receipt };
  }

  const intake = parseAddressQrIntake(qrText, now);
  const formPatch = intake.formPatch;
  const registered = intake.kind === 'registered-address';
  const publicAoidReferenceOnly = registered && intake.warnings.includes('public-aoid-reference-cannot-autofill-private-fields');
  const status: HotelGuestQrScanResult['status'] = registered && intake.status === 'ready'
    ? 'guest_verified'
    : 'requires_review';
  const decision: HotelGuestQrScanResult['decision'] = status === 'guest_verified' ? 'accept' : 'review';
  const warnings = [
    ...intake.warnings,
    ...(registered ? [] : ['hotel-checkin-guest-address-qr-required']),
    ...(publicAoidReferenceOnly ? ['hotel-checkin-public-aoid-needs-local-review'] : []),
  ];
  const scan = {
    modelVersion: HOTEL_CHECKIN_SYSTEM_MODEL_VERSION,
    requestId: request.requestId,
    scannedAt: now,
    status,
    decision,
    source: intake.source,
    addressSignal: {
      countryPresent: Boolean(formPatch.country),
      cityPresent: Boolean(formPatch.city),
      postcodePresent: Boolean(formPatch.postcode),
      streetPresent: Boolean(formPatch.street),
      buildingOrRoomPresent: Boolean(formPatch.building || formPatch.room),
      publicAoidReferenceOnly,
    },
    safeSubjectRef: safeSubjectRef({
      requestId: request.requestId,
      source: intake.source,
      kind: intake.kind,
      status: intake.status,
      countryPresent: Boolean(formPatch.country),
      cityPresent: Boolean(formPatch.city),
      postcodePresent: Boolean(formPatch.postcode),
      streetPresent: Boolean(formPatch.street),
      buildingOrRoomPresent: Boolean(formPatch.building || formPatch.room),
      publicAoidReferenceOnly,
    }),
    warnings,
    privacy: {
      rawAddressPersisted: false,
      rawAgidPersisted: false,
      rawAoidPersisted: false,
      recipientNamePersisted: false,
      phonePersisted: false,
      roomPersisted: false,
    },
  } satisfies HotelGuestQrScanResult;
  const nextRequest = {
    ...request,
    status,
    nextAction: status === 'guest_verified' ? 'complete_check_in' as const : 'manual_review' as const,
  };
  const receipt = buildHotelCheckInReceipt(nextRequest, 'guest_qr_scan', {
    createdAt: now,
    status,
    decision,
    safeSubjectRef: scan.safeSubjectRef,
    warnings,
  });

  return { request: nextRequest, scan, receipt };
}

export function completeHotelCheckIn(
  request: HotelCheckInDeskRequest,
  scan: HotelGuestQrScanResult | null,
  now = new Date().toISOString(),
): { request: HotelCheckInDeskRequest; receipt: HotelCheckInReceipt } {
  const canComplete = scan?.status === 'guest_verified' && !isExpired(request.expiresAt, now);
  const status: HotelCheckInDeskRequestStatus = canComplete ? 'completed' : 'requires_review';
  const nextRequest: HotelCheckInDeskRequest = {
    ...request,
    status,
    nextAction: canComplete ? 'complete_check_in' as const : 'manual_review' as const,
  };
  const receipt = buildHotelCheckInReceipt(nextRequest, 'complete_check_in', {
    createdAt: now,
    status,
    decision: canComplete ? 'complete' : 'review',
    safeSubjectRef: scan?.safeSubjectRef,
    warnings: canComplete ? [] : ['hotel-checkin-completion-requires-verified-guest-qr'],
  });
  return { request: nextRequest, receipt };
}
