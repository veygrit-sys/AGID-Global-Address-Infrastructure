export const ORACLE_OPERA_HOTEL_ADDRESS_REVIEW_VERSION = 'agid-oracle-opera-hotel-address-review-v1';

export type OracleOperaHotelAddressStatus = 'ready' | 'needs-review' | 'blocked';
export type OracleOperaHotelAddressEndpointKind = 'profile-address' | 'reservation-profile-address' | 'custom-address';
export type OracleOperaHotelAddressRole = 'admin' | 'delivery' | 'frontDesk' | 'customer';

export type OracleOperaHotelAddressInput = {
  id: string;
  propertyName: string;
  propertyCode: string;
  hotelId: string;
  tenantId: string;
  chainCode?: string;
  operatorAlias: string;
  profileAlias: string;
  reservationAlias: string;
  endpointKind: OracleOperaHotelAddressEndpointKind;
  addressType: string;
  language: string;
  countryCode: string;
  postalCode?: string;
  stateProvince?: string;
  city?: string;
  district?: string;
  locality?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  building?: string;
  agid?: string;
  confidence: number;
  sources: string[];
  adminAuthorized?: boolean;
  tenantAuthorized?: boolean;
  auditLogEnabled?: boolean;
  gatewayAllowlisted?: boolean;
  secretsEncrypted?: boolean;
  httpsOnly?: boolean;
  noCacheConnector?: boolean;
  noUnsafeRetry?: boolean;
  endpointMapperReady?: boolean;
  lovValidated?: boolean;
  rateLimitQueueEnabled?: boolean;
  rawAddressShared?: boolean;
  oracleRawErrorExposed?: boolean;
  oracleRawErrorSample?: string;
};

export type OracleOperaHotelAddressCheck = {
  id: string;
  label: string;
  status: 'pass' | 'review' | 'block';
  detail: string;
};

export type OracleOperaHotelAddressGate = OracleOperaHotelAddressCheck & {
  category: 'security' | 'privacy' | 'opera' | 'operations';
};

export type OracleOperaHotelAddressMapperPreview = {
  endpointKind: OracleOperaHotelAddressEndpointKind;
  mapperId: string;
  method: 'POST';
  pathTemplate: string;
  addressLineLimit: number;
};

export type OracleOperaOhipMapperDomain = 'Profile' | 'Reservation' | 'Address' | 'Notes';

export type OracleOperaOhipMapperLane = {
  domain: OracleOperaOhipMapperDomain;
  mapperId: string;
  method: 'POST' | 'PATCH';
  pathTemplate: string;
  state: 'ready' | 'review' | 'blocked';
  safeFields: string[];
  redaction: 'no-raw-address' | 'cause-code-only';
  causeCodes: string[];
};

export type OracleOperaSyncStateItem = {
  code: string;
  label: string;
  detail: string;
};

export type OracleOperaSyncState = {
  waiting: OracleOperaSyncStateItem;
  failure: OracleOperaSyncStateItem;
  resend: OracleOperaSyncStateItem;
  deadLetterPolicy: 'cause-code-only';
  causeCodes: string[];
};

export type OracleOperaHotelAddressSafePreview = {
  adapter: 'oracle-opera-ohip';
  reviewVersion: string;
  requestRef: string;
  propertyCode: string;
  hotelId: string;
  tenantId: string;
  endpointKind: OracleOperaHotelAddressEndpointKind;
  mapperId: string;
  method: 'POST';
  profileRef: string;
  reservationRef: string;
  addressLineCount: number;
  countryCode: string;
  postalCodePresent: boolean;
  language: string;
  confidence: number;
  sources: string[];
};

export type OracleOperaHotelAddressReview = {
  status: OracleOperaHotelAddressStatus;
  readinessScore: number;
  safeSubject: string;
  displayAddressLines: string[];
  fieldChecks: OracleOperaHotelAddressCheck[];
  releaseGates: OracleOperaHotelAddressGate[];
  mapper: OracleOperaHotelAddressMapperPreview;
  ohipMapperLanes: OracleOperaOhipMapperLane[];
  safeIntegrationPreview: OracleOperaHotelAddressSafePreview;
  syncState: OracleOperaSyncState;
  queue: {
    canQueue: boolean;
    label: string;
    nextAction: string;
    steps: string[];
  };
  auditEvents: string[];
  warnings: string[];
};

export type OracleOperaHotelRoleView = {
  role: OracleOperaHotelAddressRole;
  label: string;
  shortLabel: string;
  description: string;
  canEditAddress: boolean;
  canConfirmAddress: boolean;
  canQueueOperaSync: boolean;
  canSeeOperaMapper: boolean;
  canSeeReleaseGates: boolean;
  canSeeFieldAuditLog: boolean;
  canSeeRawStaffAddress: boolean;
  auditLogScope: 'full-redacted' | 'field-redacted' | 'customer-receipt';
  visiblePanels: string[];
};

const ADDRESS_LINE_LIMIT = 80;

const POSTAL_REQUIRED_COUNTRIES = new Set([
  'AD', 'AT', 'AU', 'BE', 'BR', 'CA', 'CH', 'CN', 'CZ', 'DE', 'DK', 'ES', 'FI', 'FR',
  'GB', 'GR', 'HK', 'IE', 'IN', 'IT', 'JP', 'KR', 'LU', 'MX', 'NL', 'NO', 'NZ', 'PL',
  'PT', 'SE', 'SG', 'TR', 'TW', 'US',
]);

const ALLOWED_ADDRESS_TYPES = new Set(['HOME', 'BUSINESS', 'OTHER']);

const ENDPOINT_MAPPERS: Record<OracleOperaHotelAddressEndpointKind, { mapperId: string; pathTemplate: string }> = {
  'profile-address': {
    mapperId: 'ohip-profile-address-mapper-v1',
    pathTemplate: '/ohip/v1/hotels/{hotelId}/profiles/{profileId}/addresses',
  },
  'reservation-profile-address': {
    mapperId: 'ohip-reservation-profile-address-mapper-v1',
    pathTemplate: '/ohip/v1/hotels/{hotelId}/reservations/{reservationId}/profiles/{profileId}/addresses',
  },
  'custom-address': {
    mapperId: 'ohip-custom-address-mapper-v1',
    pathTemplate: '/ohip/v1/hotels/{hotelId}/custom-addresses',
  },
};

const OHIP_PROFILE_PATH = '/ohip/v1/hotels/{hotelId}/profiles/{profileId}';
const OHIP_RESERVATION_PATH = '/ohip/v1/hotels/{hotelId}/reservations/{reservationId}';
const OHIP_NOTES_PATH = '/ohip/v1/hotels/{hotelId}/reservations/{reservationId}/notes';

const ROLE_VIEWS: Record<OracleOperaHotelAddressRole, OracleOperaHotelRoleView> = {
  admin: {
    role: 'admin',
    label: '管理者',
    shortLabel: 'Admin',
    description: 'OPERA mapper、安全ゲート、監査、送信キューまで確認できます。',
    canEditAddress: true,
    canConfirmAddress: true,
    canQueueOperaSync: true,
    canSeeOperaMapper: true,
    canSeeReleaseGates: true,
    canSeeFieldAuditLog: true,
    canSeeRawStaffAddress: true,
    auditLogScope: 'full-redacted',
    visiblePanels: ['address', 'mapper', 'release-gates', 'queue', 'audit'],
  },
  frontDesk: {
    role: 'frontDesk',
    label: '受付',
    shortLabel: 'Front desk',
    description: '住所確認とゲスト対応に集中し、OPERA送信は確認済み状態まで扱います。',
    canEditAddress: true,
    canConfirmAddress: true,
    canQueueOperaSync: false,
    canSeeOperaMapper: true,
    canSeeReleaseGates: false,
    canSeeFieldAuditLog: true,
    canSeeRawStaffAddress: true,
    auditLogScope: 'field-redacted',
    visiblePanels: ['address', 'mapper', 'audit'],
  },
  delivery: {
    role: 'delivery',
    label: '配送員',
    shortLabel: 'Delivery',
    description: '配送先確認、ステータス、監査ログだけを表示し、PMS内部項目は隠します。',
    canEditAddress: false,
    canConfirmAddress: false,
    canQueueOperaSync: false,
    canSeeOperaMapper: false,
    canSeeReleaseGates: false,
    canSeeFieldAuditLog: true,
    canSeeRawStaffAddress: false,
    auditLogScope: 'field-redacted',
    visiblePanels: ['address-summary', 'audit'],
  },
  customer: {
    role: 'customer',
    label: '顧客',
    shortLabel: 'Customer',
    description: '自分に関係する住所表示と共有される安全previewだけを確認します。',
    canEditAddress: false,
    canConfirmAddress: false,
    canQueueOperaSync: false,
    canSeeOperaMapper: false,
    canSeeReleaseGates: false,
    canSeeFieldAuditLog: true,
    canSeeRawStaffAddress: true,
    auditLogScope: 'customer-receipt',
    visiblePanels: ['address', 'safe-preview', 'audit'],
  },
};

export const ORACLE_OPERA_HOTEL_ADDRESS_ROLES = Object.values(ROLE_VIEWS);

export const ORACLE_OPERA_HOTEL_ADDRESS_SAMPLES: OracleOperaHotelAddressInput[] = [
  {
    id: 'jp-tokyo-ginza',
    propertyName: 'Ginza Tower Hotel',
    propertyCode: 'TYO-GINZA',
    hotelId: 'HOTEL-TYO-01',
    tenantId: 'tenant-jp-hospitality',
    chainCode: 'AGD',
    operatorAlias: 'frontdesk-tokyo-01',
    profileAlias: 'profile-8fe2',
    reservationAlias: 'reservation-5129',
    endpointKind: 'profile-address',
    addressType: 'BUSINESS',
    language: 'ja',
    countryCode: 'JP',
    postalCode: '104-0061',
    stateProvince: 'Tokyo',
    city: 'Chuo-ku',
    locality: 'Ginza',
    addressLine1: 'Ginza Tower Hotel',
    addressLine2: '4-8-1 Ginza',
    agid: 'JP05OPERAHOTEL',
    confidence: 0.92,
    sources: ['agid-address-quality', 'open-address-format-rules', 'operator-confirmed'],
  },
  {
    id: 'gb-london-kx',
    propertyName: 'Kings Cross Station Hotel',
    propertyCode: 'LON-KX',
    hotelId: 'HOTEL-LON-02',
    tenantId: 'tenant-uk-hospitality',
    operatorAlias: 'frontdesk-london-04',
    profileAlias: 'profile-a1c7',
    reservationAlias: 'reservation-7810',
    endpointKind: 'reservation-profile-address',
    addressType: 'BUSINESS',
    language: 'en-GB',
    countryCode: 'GB',
    postalCode: 'N1C 4TB',
    city: 'London',
    addressLine1: 'Kings Cross Station Hotel',
    addressLine2: '1 Euston Road',
    agid: 'GB05OPERAHOTEL',
    confidence: 0.89,
    sources: ['agid-address-quality', 'open-address-format-rules', 'hotel-ops-review'],
  },
  {
    id: 'sg-marina-bay',
    propertyName: 'Marina Bay Operator Hotel',
    propertyCode: 'SG-MB',
    hotelId: 'HOTEL-SG-07',
    tenantId: 'tenant-sg-hospitality',
    operatorAlias: 'frontdesk-singapore-02',
    profileAlias: 'profile-73bd',
    reservationAlias: 'reservation-3204',
    endpointKind: 'profile-address',
    addressType: 'BUSINESS',
    language: 'en',
    countryCode: 'SG',
    postalCode: '018956',
    city: 'Singapore',
    addressLine1: 'Marina Bay Operator Hotel',
    addressLine2: '10 Bayfront Avenue',
    agid: 'SG05OPERAHOTEL',
    confidence: 0.94,
    sources: ['agid-address-quality', 'postal-code-api', 'operator-confirmed'],
  },
];

function cleanText(value: unknown, max = 240) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanList(values: unknown[], max = 240) {
  return values.map(value => cleanText(value, max)).filter(Boolean);
}

function booleanGate(value: boolean | undefined) {
  return value !== false;
}

function makeRef(value: string | undefined, prefix: string) {
  const text = cleanText(value, 400);
  if (!text) return `${prefix}_missing`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(36).padStart(7, '0').slice(0, 8)}`;
}

function normalizeCountryCode(value: string) {
  return cleanText(value, 8).toUpperCase();
}

function normalizeLanguage(value: string) {
  return cleanText(value, 40);
}

function normalizeAddressType(value: string) {
  return cleanText(value, 24).toUpperCase();
}

function displayAddressLines(input: OracleOperaHotelAddressInput) {
  return cleanList([
    input.addressLine1 || input.building || input.propertyName,
    input.addressLine2,
    input.addressLine3,
    input.locality,
    input.district,
    input.city,
    input.stateProvince,
    input.postalCode,
    input.countryCode,
  ], ADDRESS_LINE_LIMIT);
}

function check(id: string, label: string, status: OracleOperaHotelAddressCheck['status'], detail: string): OracleOperaHotelAddressCheck {
  return { id, label, status, detail };
}

function gate(
  id: string,
  label: string,
  category: OracleOperaHotelAddressGate['category'],
  passed: boolean,
  detail: string,
): OracleOperaHotelAddressGate {
  return { id, label, category, status: passed ? 'pass' : 'block', detail };
}

function countByStatus(items: Array<OracleOperaHotelAddressCheck | OracleOperaHotelAddressGate>, status: OracleOperaHotelAddressCheck['status']) {
  return items.filter(item => item.status === status).length;
}

function calculateStatus(fieldChecks: OracleOperaHotelAddressCheck[], releaseGates: OracleOperaHotelAddressGate[]): OracleOperaHotelAddressStatus {
  const allChecks = [...fieldChecks, ...releaseGates];
  if (allChecks.some(item => item.status === 'block')) return 'blocked';
  if (allChecks.some(item => item.status === 'review')) return 'needs-review';
  return 'ready';
}

function calculateReadinessScore(fieldChecks: OracleOperaHotelAddressCheck[], releaseGates: OracleOperaHotelAddressGate[]) {
  const allChecks = [...fieldChecks, ...releaseGates];
  const score = 100 - countByStatus(allChecks, 'block') * 18 - countByStatus(allChecks, 'review') * 7;
  return Math.max(0, Math.min(100, score));
}

function buildCauseCodes(
  fieldChecks: OracleOperaHotelAddressCheck[],
  releaseGates: OracleOperaHotelAddressGate[],
  input: OracleOperaHotelAddressInput,
) {
  const codes = new Set<string>();
  const fieldCodeMap: Record<string, string> = {
    'hotel-id': 'HOTEL_ID_REQUIRED',
    'property-code': 'PROPERTY_CODE_REQUIRED',
    'address-lines': 'ADDRESS_LINES_REQUIRED',
    'address-line-length': 'ADDRESS_LINE_LIMIT_EXCEEDED',
    'country-code': 'COUNTRY_CODE_INVALID',
    'postal-code': 'POSTAL_REVIEW_REQUIRED',
    'language-tag': 'LANGUAGE_TAG_INVALID',
    'lov-address-type': 'LOV_ADDRESS_TYPE_INVALID',
    'city-admin': 'CITY_ADMIN_REVIEW_REQUIRED',
  };
  const gateCodeMap: Record<string, string> = {
    connectorFetchNoCache: 'NO_CACHE_CONNECTOR_REQUIRED',
    noUnsafeRetry: 'UNSAFE_RETRY_FORBIDDEN',
    'admin-rbac': 'ADMIN_AUTH_REQUIRED',
    'tenant-permission': 'TENANT_PERMISSION_REQUIRED',
    'audit-log': 'AUDIT_LOG_REQUIRED',
    'raw-address-redaction': 'RAW_ADDRESS_RESPONSE_BLOCKED',
    'oracle-raw-error-redaction': 'ORACLE_RAW_ERROR_REDACTED',
    'ohip-endpoint-mapper': 'OHIP_MAPPER_REQUIRED',
    'lov-preflight': 'LOV_PREFLIGHT_REQUIRED',
    'https-required': 'HTTPS_REQUIRED',
    'gateway-allowlist': 'GATEWAY_ALLOWLIST_REQUIRED',
    'secret-storage': 'SECRET_STORAGE_REQUIRED',
    'rate-limit-dlq': 'DLQ_REQUIRED',
  };

  fieldChecks.forEach(item => {
    if (item.status !== 'pass') codes.add(fieldCodeMap[item.id] ?? `FIELD_${item.id.toUpperCase().replace(/-/g, '_')}`);
  });
  releaseGates.forEach(item => {
    if (item.status !== 'pass') codes.add(gateCodeMap[item.id] ?? `GATE_${item.id.toUpperCase().replace(/-/g, '_')}`);
  });
  if (input.oracleRawErrorSample) codes.add('ORACLE_RAW_ERROR_REDACTED');
  return [...codes];
}

function buildOhipMapperLanes(
  input: OracleOperaHotelAddressInput,
  mapper: { mapperId: string; pathTemplate: string },
  status: OracleOperaHotelAddressStatus,
  causeCodes: string[],
): OracleOperaOhipMapperLane[] {
  const profileState = cleanText(input.profileAlias, 120) ? 'ready' : 'review';
  const reservationState = cleanText(input.reservationAlias, 120) ? 'ready' : 'review';
  const addressState = status === 'blocked' ? 'blocked' : status === 'needs-review' ? 'review' : 'ready';
  const notesState = causeCodes.length ? 'review' : 'ready';

  return [
    {
      domain: 'Profile',
      mapperId: 'ohip-profile-safe-ref-mapper-v1',
      method: 'PATCH',
      pathTemplate: OHIP_PROFILE_PATH,
      state: profileState,
      safeFields: ['profileRef', 'language', 'countryCode', 'consentScope'],
      redaction: 'no-raw-address',
      causeCodes: profileState === 'ready' ? [] : ['PROFILE_REF_REVIEW_REQUIRED'],
    },
    {
      domain: 'Reservation',
      mapperId: 'ohip-reservation-safe-ref-mapper-v1',
      method: 'PATCH',
      pathTemplate: OHIP_RESERVATION_PATH,
      state: reservationState,
      safeFields: ['reservationRef', 'propertyCode', 'syncStatus', 'auditEventRef'],
      redaction: 'no-raw-address',
      causeCodes: reservationState === 'ready' ? [] : ['RESERVATION_REF_REVIEW_REQUIRED'],
    },
    {
      domain: 'Address',
      mapperId: mapper.mapperId,
      method: 'POST',
      pathTemplate: mapper.pathTemplate,
      state: addressState,
      safeFields: ['addressLineCount', 'addressType', 'countryCode', 'postalCodePresent', 'confidence'],
      redaction: 'no-raw-address',
      causeCodes: causeCodes.filter(code => !code.includes('ORACLE_RAW_ERROR')),
    },
    {
      domain: 'Notes',
      mapperId: 'ohip-redacted-notes-cause-code-mapper-v1',
      method: 'POST',
      pathTemplate: OHIP_NOTES_PATH,
      state: notesState,
      safeFields: ['causeCodes', 'auditEventRef', 'deadLetterRef', 'retryPolicy'],
      redaction: 'cause-code-only',
      causeCodes,
    },
  ];
}

function buildSyncState(
  status: OracleOperaHotelAddressStatus,
  releaseGates: OracleOperaHotelAddressGate[],
  causeCodes: string[],
): OracleOperaSyncState {
  const gateBlocked = (id: string) => releaseGates.some(item => item.id === id && item.status === 'block');
  const redactedFailure = gateBlocked('raw-address-redaction') || gateBlocked('oracle-raw-error-redaction');
  const unsafeRetryBlocked = gateBlocked('noUnsafeRetry');
  const waitingCode = status === 'ready'
    ? 'SYNC_WAITING_APPROVAL'
    : status === 'needs-review'
      ? 'SYNC_WAITING_MANUAL_REVIEW'
      : 'SYNC_BLOCKED';

  return {
    waiting: {
      code: waitingCode,
      label: status === 'ready' ? '同期待ち' : status === 'needs-review' ? '確認待ち' : '同期停止',
      detail: status === 'ready'
        ? 'Safe preview is ready; queue only after explicit approval.'
        : status === 'needs-review'
          ? 'Manual review is required before OPERA queue.'
          : 'Blocked gates must be fixed before queueing.',
    },
    failure: {
      code: redactedFailure ? 'SYNC_FAILED_REDACTED' : 'NO_FAILURE_RECORDED',
      label: redactedFailure ? '失敗あり' : '失敗なし',
      detail: redactedFailure
        ? 'Only public cause codes and dead-letter metadata are exposed.'
        : 'No OPERA failure is recorded in this local review.',
    },
    resend: {
      code: unsafeRetryBlocked ? 'RESEND_FORBIDDEN_UNSAFE_RETRY_GATE' : 'AUTO_RETRY_DISABLED_BY_POLICY',
      label: unsafeRetryBlocked ? '再送禁止' : '自動再送なし',
      detail: unsafeRetryBlocked
        ? 'Unsafe retry gate failed; do not resend until admin review.'
        : 'POST/PATCH writes are not retried automatically; manual approval is required.',
    },
    deadLetterPolicy: 'cause-code-only',
    causeCodes,
  };
}

export function buildOracleOperaHotelAddressReview(input: OracleOperaHotelAddressInput): OracleOperaHotelAddressReview {
  const countryCode = normalizeCountryCode(input.countryCode);
  const language = normalizeLanguage(input.language);
  const addressType = normalizeAddressType(input.addressType);
  const lines = displayAddressLines(input);
  const mapper = ENDPOINT_MAPPERS[input.endpointKind] ?? ENDPOINT_MAPPERS['profile-address'];
  const postalRequired = POSTAL_REQUIRED_COUNTRIES.has(countryCode);
  const postalCode = cleanText(input.postalCode, 40);
  const sources = cleanList(input.sources, 120);
  const confidence = Math.max(0, Math.min(1, Number.isFinite(input.confidence) ? input.confidence : 0));

  const fieldChecks: OracleOperaHotelAddressCheck[] = [
    check(
      'hotel-id',
      'OPERA hotelId',
      cleanText(input.hotelId, 80) ? 'pass' : 'block',
      cleanText(input.hotelId, 80) ? 'Hotel routing id is present.' : 'hotelId is required for OHIP hotel-scoped routes.',
    ),
    check(
      'property-code',
      'Property code',
      cleanText(input.propertyCode, 80) ? 'pass' : 'block',
      cleanText(input.propertyCode, 80) ? 'Property code can be audited without exposing guest identity.' : 'Property code is missing.',
    ),
    check(
      'address-lines',
      'Address lines',
      lines.length ? 'pass' : 'block',
      lines.length ? `${lines.length} address line(s) ready for staff confirmation.` : 'At least one hotel/profile address line is required.',
    ),
    check(
      'address-line-length',
      'Address line length',
      lines.some(line => line.length > ADDRESS_LINE_LIMIT) ? 'block' : 'pass',
      `Every address line must fit the ${ADDRESS_LINE_LIMIT} character OPERA preflight limit.`,
    ),
    check(
      'country-code',
      'ISO country code',
      /^[A-Z]{2}$/.test(countryCode) ? 'pass' : 'block',
      /^[A-Z]{2}$/.test(countryCode) ? `${countryCode} is ISO alpha-2 shaped.` : 'Country must be ISO alpha-2 before OPERA export.',
    ),
    check(
      'postal-code',
      'Postal code',
      postalCode || !postalRequired ? 'pass' : 'review',
      postalCode
        ? 'Postal code is present; source-specific validation can run before live sync.'
        : 'Postal code is missing; keep manual review unless this country/territory has no postal-code system.',
    ),
    check(
      'language-tag',
      'Language tag',
      !language || /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(language) ? 'pass' : 'block',
      language ? `${language} can be mapped into OPERA language metadata.` : 'Language is optional, but should be set for multilingual hotel operations.',
    ),
    check(
      'lov-address-type',
      'OPERA LOV address type',
      ALLOWED_ADDRESS_TYPES.has(addressType) ? 'pass' : 'block',
      ALLOWED_ADDRESS_TYPES.has(addressType) ? `${addressType} is in the local OPERA LOV allowlist.` : 'Address type must be HOME, BUSINESS, or OTHER before sync.',
    ),
    check(
      'city-admin',
      'City / admin area',
      cleanText(input.city || input.locality || input.district, 120) ? 'pass' : 'review',
      'City, locality, or district should be confirmed for hotel search and downstream folio matching.',
    ),
  ];

  const releaseGates: OracleOperaHotelAddressGate[] = [
    gate('connectorFetchNoCache', 'connectorFetchNoCache', 'security', booleanGate(input.noCacheConnector), 'OPERA calls must use no-store and no-cache headers.'),
    gate('noUnsafeRetry', 'No unsafe retry', 'security', booleanGate(input.noUnsafeRetry), 'POST/PATCH/PUT writes are never retried automatically.'),
    gate('admin-rbac', 'Administrator authorization', 'operations', booleanGate(input.adminAuthorized), 'Only hotel admins or delegated operators can approve live OPERA writes.'),
    gate('tenant-permission', 'Hotel / tenant permission', 'operations', booleanGate(input.tenantAuthorized), 'Tenant and property scope must match the hotelId.'),
    gate('audit-log', 'Audit log', 'operations', booleanGate(input.auditLogEnabled), 'Approval, queueing, and sync result require redacted audit events.'),
    gate('raw-address-redaction', 'No raw address in connector response', 'privacy', !input.rawAddressShared, 'Connector result exposes hashes, aliases, counts, and status only.'),
    gate('oracle-raw-error-redaction', 'No raw Oracle error body', 'privacy', !input.oracleRawErrorExposed, 'Oracle raw errors are reduced to public error codes and dead-letter metadata.'),
    gate('ohip-endpoint-mapper', 'OHIP endpoint mapper', 'opera', booleanGate(input.endpointMapperReady), `${mapper.mapperId} is selected for ${input.endpointKind}.`),
    gate('lov-preflight', 'LOV / country / language preflight', 'opera', booleanGate(input.lovValidated), 'Address type, country, postal, and language shapes are checked before sync.'),
    gate('https-required', 'HTTPS only', 'security', booleanGate(input.httpsOnly), 'Live base URLs and OAuth URLs must use HTTPS.'),
    gate('gateway-allowlist', 'Gateway allowlist', 'security', booleanGate(input.gatewayAllowlisted), 'The OPERA host must be explicitly allowlisted.'),
    gate('secret-storage', 'Encrypted secret storage', 'security', booleanGate(input.secretsEncrypted), 'Client secrets must be stored in vault/KMS/encrypted env, not plaintext.'),
    gate('rate-limit-dlq', '429 / circuit breaker / dead-letter', 'operations', booleanGate(input.rateLimitQueueEnabled), 'Rate limits and upstream failures go to a redacted dead-letter queue.'),
  ];

  const status = calculateStatus(fieldChecks, releaseGates);
  const readinessScore = calculateReadinessScore(fieldChecks, releaseGates);
  const causeCodes = buildCauseCodes(fieldChecks, releaseGates, input);
  const ohipMapperLanes = buildOhipMapperLanes(input, mapper, status, causeCodes);
  const syncState = buildSyncState(status, releaseGates, causeCodes);
  const profileRef = makeRef(input.profileAlias, 'profile');
  const reservationRef = makeRef(input.reservationAlias, 'reservation');
  const requestRef = makeRef(`${input.hotelId}|${input.propertyCode}|${input.agid}|${profileRef}|${reservationRef}`, 'opera');
  const warnings = [
    ...fieldChecks.filter(item => item.status !== 'pass').map(item => item.detail),
    ...releaseGates.filter(item => item.status !== 'pass').map(item => item.detail),
    input.oracleRawErrorSample ? 'Oracle raw error sample was provided to the reviewer, but it is not included in the safe integration preview.' : '',
  ].filter(Boolean);

  return {
    status,
    readinessScore,
    safeSubject: `${cleanText(input.propertyCode, 80) || 'property-missing'} / ${reservationRef}`,
    displayAddressLines: lines,
    fieldChecks,
    releaseGates,
    mapper: {
      endpointKind: input.endpointKind,
      mapperId: mapper.mapperId,
      method: 'POST',
      pathTemplate: mapper.pathTemplate,
      addressLineLimit: ADDRESS_LINE_LIMIT,
    },
    ohipMapperLanes,
    safeIntegrationPreview: {
      adapter: 'oracle-opera-ohip',
      reviewVersion: ORACLE_OPERA_HOTEL_ADDRESS_REVIEW_VERSION,
      requestRef,
      propertyCode: cleanText(input.propertyCode, 80),
      hotelId: cleanText(input.hotelId, 80),
      tenantId: cleanText(input.tenantId, 120),
      endpointKind: input.endpointKind,
      mapperId: mapper.mapperId,
      method: 'POST',
      profileRef,
      reservationRef,
      addressLineCount: lines.length,
      countryCode,
      postalCodePresent: Boolean(postalCode),
      language,
      confidence,
      sources,
    },
    syncState,
    queue: {
      canQueue: status === 'ready',
      label: status === 'ready' ? 'Ready for OPERA queue' : status === 'needs-review' ? 'Manual review required' : 'Blocked before OPERA queue',
      nextAction: status === 'ready'
        ? 'Approve the hotel address and enqueue a dry-run or live OPERA sync.'
        : 'Fix blocked gates or confirm review items before queueing.',
      steps: [
        'Confirm hotel/profile address fields with staff',
        `Map with ${mapper.mapperId}`,
        'Write only through no-cache connector',
        'Store redacted audit event and dead-letter metadata',
      ],
    },
    auditEvents: [
      `review-created:${requestRef}`,
      `mapper-selected:${mapper.mapperId}`,
      `privacy-preview:${profileRef}:${reservationRef}`,
      status === 'ready' ? 'approval-ready' : `approval-held:${status}`,
    ],
    warnings,
  };
}

export function listOracleOperaHotelAddressSamples() {
  return ORACLE_OPERA_HOTEL_ADDRESS_SAMPLES.map(sample => ({ ...sample }));
}

export function getOracleOperaHotelRoleView(role: OracleOperaHotelAddressRole): OracleOperaHotelRoleView {
  return ROLE_VIEWS[role] ?? ROLE_VIEWS.frontDesk;
}
