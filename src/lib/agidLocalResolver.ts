import { needsBorderConfirmation } from './indiaChinaLandBorders';
import { assessAgidGeography, type AgidGeographicAssessment } from './geographicAssessment';
import { getAddressFormat, type AddressFormat } from '../data/address_formats';
import { encodeAGID, normalizeAGIDCode, type AGIDResult } from './agid';
import { decodeAgidToResult, looksLikeAGID16 } from './agidSelection';
import {
  AGID_ADDRESS_INTELLIGENCE_ENGINE_VERSION,
  evaluateAgidAddressIntelligence,
  type AgidAddressCandidate,
  type AgidAddressIntelligenceResult,
} from './agidAddressIntelligenceEngine';
import {
  AGID_SECURE_POS_MODEL_VERSION,
  openAgidSecureForPos,
  type AgidSecurePosOpenResult,
  type AgidSecurePosRegistrySnapshot,
  type PosSecureKeyEntry,
} from './agidSecurePos';
import {
  isAgidSecureToken,
  type AgidSecurePurpose,
} from './agidSecureShare';
import { isValidAGIDFormat } from './agidSecurity';
import {
  buildAOIDPublicDescriptor,
  isAOIDRecord,
  normalizeAOIDRecord,
  type AOIDRecord,
} from './aoid';
import {
  parseRegisteredAddressQrPayload,
  type RegisteredAddressRecord,
} from './registeredAddressQr';
import type { AddressDetails } from '../types/address';

export const AGID_LOCAL_RESOLVER_VERSION = 'agid-local-resolver-v1';

export type AgidLocalResolverInputKind =
  | 'agid'
  | 'agid-s'
  | 'coordinates'
  | 'registered-address'
  | 'aoid'
  | 'address-text'
  | 'unknown';

export type AgidLocalResolverStatus =
  | 'resolved'
  | 'partial'
  | 'needs-key'
  | 'invalid';

export type AgidLocalResolverAction =
  | 'use-local-result'
  | 'request-agid-s-key'
  | 'ask-user-to-confirm'
  | 'collect-address-fields'
  | 'run-postal-autofill'
  | 'queue-server-registry-check'
  | 'do-not-send-private-fields';

export type AgidLocalResolverInput = {
  query?: string;
  coordinates?: {
    lat: number;
    lon?: number;
    lng?: number;
    accuracyMeters?: number;
  };
  record?: RegisteredAddressRecord | AOIDRecord | Record<string, unknown> | null;
  addressText?: string;
  apiAddress?: Record<string, unknown>;
  details?: AddressDetails | Record<string, unknown> | null;
  countryCode?: string | null;
  selectedLanguageTab?: string;
  languageTabs?: string[];
  displayTextByTab?: Record<string, string | undefined>;
  candidates?: AgidAddressCandidate[];
  addressFormat?: AddressFormat | null;
  addressFormatResolver?: (countryCode: string) => Promise<AddressFormat | null>;
  agidSecure?: {
    keyRing?: PosSecureKeyEntry[];
    registry?: AgidSecurePosRegistrySnapshot | null;
    expectedPurpose?: AgidSecurePurpose;
    now?: number;
  };
};

export type AgidLocalResolverResult = {
  resolverVersion: typeof AGID_LOCAL_RESOLVER_VERSION;
  mode: 'local-only';
  status: AgidLocalResolverStatus;
  inputKind: AgidLocalResolverInputKind;
  agid?: AGIDResult;
  agidId?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  geography?: AgidGeographicAssessment;
  registeredAddress?: RegisteredAddressRecord;
  aoid?: {
    record: AOIDRecord;
    publicDescriptor: ReturnType<typeof buildAOIDPublicDescriptor>;
  };
  secure?: {
    modelVersion: typeof AGID_SECURE_POS_MODEL_VERSION;
    opened: AgidSecurePosOpenResult;
  };
  addressFormat?: AddressFormat | null;
  intelligence?: AgidAddressIntelligenceResult;
  actions: AgidLocalResolverAction[];
  warnings: string[];
  audit: Array<{
    step:
      | 'detect-input'
      | 'open-agid-s'
      | 'decode-agid'
      | 'normalize-record'
      | 'load-address-format'
      | 'evaluate-address-intelligence';
    status: 'ok' | 'warning' | 'failed';
    message: string;
  }>;
};

const LOCAL_RESOLVER_SOURCE = 'agid-local-resolver';

function clean(value: unknown) {
  return String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeCountryCode(value: unknown) {
  const code = clean(value).toUpperCase().replace(/[^A-Z_-]/g, '');
  if (!code) return '';
  if (code === 'UK') return 'GB';
  return code.split(/[_-]/)[0];
}

function coordinatesFromText(value: string) {
  const match = clean(value).match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function coordinatesFromInput(input: AgidLocalResolverInput) {
  const lat = finiteNumber(input.coordinates?.lat);
  const lon = finiteNumber(input.coordinates?.lon ?? input.coordinates?.lng);
  if (lat === null || lon === null) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function parseJsonRecord(value: string) {
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return null;
  }
}

function recordAddressText(record: RegisteredAddressRecord | AOIDRecord | null) {
  if (!record) return '';
  return clean(record.address)
    || [
      record.organization,
      record.street,
      record.suburb,
      record.city,
      record.state,
      record.postcode,
      record.country,
    ].map(clean).filter(Boolean).join(', ');
}

function recordApiAddress(record: RegisteredAddressRecord | AOIDRecord | null) {
  if (!record) return {};
  return {
    country_code: normalizeCountryCode(record.country),
    country: clean(record.country),
    postcode: clean(record.postcode),
    state: clean(record.state),
    city: clean(record.city),
    suburb: clean(record.suburb),
    road: clean(record.street),
    building: clean(record.building || record.organization),
    organization: clean(record.organization),
  };
}

function agidApiAddress(agid: AGIDResult | undefined, fallbackCountryCode?: string | null) {
  if (!agid) return {};
  if (agid.island && (agid.island.countryCodes.length !== 1 || agid.island.relation === 'boundary')) return {};
  const countryCode = normalizeCountryCode(agid.isSea ? '' : agid.regionCode || fallbackCountryCode || agid.prefix);
  if (agid.isSea) {
    return {
      country_code: countryCode.toLowerCase(),
      water: agid.regionName,
      natural_feature: agid.regionName,
    };
  }
  return {
    country_code: countryCode.toLowerCase(),
    country: agid.regionName,
  };
}

function isRegisteredAddressRecord(value: unknown): value is RegisteredAddressRecord {
  const record = asRecord(value);
  return Boolean(record)
    && (record?.type === 'ADDRESS' || record?.type === 'AOID')
    && typeof record?.id === 'string';
}

function normalizeRecord(value: unknown) {
  if (isAOIDRecord(value)) return { kind: 'aoid' as const, record: normalizeAOIDRecord(value) };
  if (isRegisteredAddressRecord(value)) {
    if (value.type === 'AOID') return { kind: 'aoid' as const, record: normalizeAOIDRecord(value) };
    return { kind: 'registered-address' as const, record: value };
  }
  return null;
}

async function resolveAddressFormat(
  countryCode: string,
  input: Pick<AgidLocalResolverInput, 'addressFormat' | 'addressFormatResolver'>,
) {
  if (input.addressFormat !== undefined) return input.addressFormat;
  if (!countryCode) return null;
  if (input.addressFormatResolver) return input.addressFormatResolver(countryCode);
  return getAddressFormat(countryCode);
}

function statusFromIntelligence(intelligence?: AgidAddressIntelligenceResult): AgidLocalResolverStatus {
  if (!intelligence) return 'partial';
  if (intelligence.decision === 'reject') return 'partial';
  if (intelligence.decision === 'warn' || intelligence.decision === 'reverify') return 'partial';
  return 'resolved';
}

function resolverActions(result: {
  status: AgidLocalResolverStatus;
  inputKind: AgidLocalResolverInputKind;
  intelligence?: AgidAddressIntelligenceResult;
}) {
  const actions: AgidLocalResolverAction[] = ['do-not-send-private-fields'];
  if (result.status === 'needs-key') actions.push('request-agid-s-key');
  if (result.status === 'resolved') actions.push('use-local-result');
  if (result.status === 'partial') actions.push('ask-user-to-confirm');
  if (result.intelligence?.actions.includes('collect-postal-code') || result.intelligence?.actions.includes('collect-street-or-house')) {
    actions.push('collect-address-fields');
  }
  if (result.intelligence?.actions.includes('run-postal-lookup')) actions.push('run-postal-autofill');
  if (result.inputKind === 'agid-s' || result.intelligence?.delivery.decision !== 'deliverable') {
    actions.push('queue-server-registry-check');
  }
  return Array.from(new Set(actions));
}

export async function resolveAgidLocal(input: AgidLocalResolverInput): Promise<AgidLocalResolverResult> {
  const audit: AgidLocalResolverResult['audit'] = [];
  const warnings: string[] = [];
  const query = clean(input.query);
  const queryRecord = query ? parseJsonRecord(query) : null;
  const registeredQrRecord = query ? parseRegisteredAddressQrPayload(query) : null;
  const explicitRecord = normalizeRecord(input.record);
  const jsonRecord = normalizeRecord(queryRecord);
  const qrRecord = normalizeRecord(registeredQrRecord);
  const textCoordinates = query ? coordinatesFromText(query) : null;
  const inputCoordinates = coordinatesFromInput(input);

  let inputKind: AgidLocalResolverInputKind = 'unknown';
  let agid: AGIDResult | undefined;
  let agidId = '';
  let coordinates: { lat: number; lon: number } | undefined;
  let registeredAddress: RegisteredAddressRecord | undefined;
  let aoidRecord: AOIDRecord | undefined;
  let secureOpened: AgidSecurePosOpenResult | undefined;
  let addressText = input.addressText || '';
  let apiAddress: Record<string, unknown> = { ...(input.apiAddress || {}) };
  let details = input.details || null;

  if (registeredQrRecord && qrRecord) {
    inputKind = qrRecord.kind;
    if (qrRecord.kind === 'aoid') aoidRecord = qrRecord.record;
    else registeredAddress = qrRecord.record;
    audit.push({ step: 'detect-input', status: 'ok', message: `Detected ${inputKind} QR payload.` });
  } else if (explicitRecord) {
    inputKind = explicitRecord.kind;
    if (explicitRecord.kind === 'aoid') aoidRecord = explicitRecord.record;
    else registeredAddress = explicitRecord.record;
    audit.push({ step: 'detect-input', status: 'ok', message: `Detected ${inputKind} record input.` });
  } else if (jsonRecord) {
    inputKind = jsonRecord.kind;
    if (jsonRecord.kind === 'aoid') aoidRecord = jsonRecord.record;
    else registeredAddress = jsonRecord.record;
    audit.push({ step: 'detect-input', status: 'ok', message: `Detected ${inputKind} JSON input.` });
  } else if (query && isAgidSecureToken(query)) {
    inputKind = 'agid-s';
    audit.push({ step: 'detect-input', status: 'ok', message: 'Detected AGID-S token.' });
    const keyRing = input.agidSecure?.keyRing || [];
    if (!keyRing.length) {
      const result: AgidLocalResolverResult = {
        resolverVersion: AGID_LOCAL_RESOLVER_VERSION,
        mode: 'local-only',
        status: 'needs-key',
        inputKind,
        actions: resolverActions({ status: 'needs-key', inputKind }),
        warnings: ['agid-s-key-required'],
        audit: [
          ...audit,
          { step: 'open-agid-s', status: 'warning', message: 'AGID-S token requires a local POS key.' },
        ],
      };
      return result;
    }
    secureOpened = await openAgidSecureForPos({
      token: query,
      keyRing,
      registry: input.agidSecure?.registry,
      expectedPurpose: input.agidSecure?.expectedPurpose,
      now: input.agidSecure?.now,
    });
    if (secureOpened.ok === false) {
      return {
        resolverVersion: AGID_LOCAL_RESOLVER_VERSION,
        mode: 'local-only',
        status: 'invalid',
        inputKind,
        secure: {
          modelVersion: AGID_SECURE_POS_MODEL_VERSION,
          opened: secureOpened,
        },
        actions: resolverActions({ status: 'invalid', inputKind }),
        warnings: [...secureOpened.warnings, secureOpened.error],
        audit: [
          ...audit,
          { step: 'open-agid-s', status: 'failed', message: `Failed to open AGID-S: ${secureOpened.error}.` },
        ],
      };
    }
    agidId = secureOpened.payload.agid;
    audit.push({ step: 'open-agid-s', status: 'ok', message: 'Opened AGID-S locally with POS key ring.' });
  } else {
    const rawAgid = typeof input.query === 'string' ? input.query.trim() : '';
    // Preserve the resolver's existing NFKC normalization for 12-character inputs.
    const idInput = rawAgid.length === 12 && query.length === 12 ? query : rawAgid;
    const normalizedAgid = normalizeAGIDCode(idInput);
    if (normalizedAgid || isValidAGIDFormat(idInput) || looksLikeAGID16(query)) {
      inputKind = 'agid';
      agidId = normalizedAgid || idInput;
      audit.push({ step: 'detect-input', status: 'ok', message: 'Detected AGID code.' });
    } else if (inputCoordinates || textCoordinates) {
      inputKind = 'coordinates';
      coordinates = inputCoordinates || textCoordinates || undefined;
      audit.push({ step: 'detect-input', status: 'ok', message: 'Detected local coordinates.' });
    } else if (query || input.addressText) {
      inputKind = 'address-text';
      addressText = input.addressText || query;
      audit.push({ step: 'detect-input', status: 'warning', message: 'Treating input as address text.' });
    } else {
      audit.push({ step: 'detect-input', status: 'failed', message: 'No usable local resolver input was supplied.' });
      return {
        resolverVersion: AGID_LOCAL_RESOLVER_VERSION,
        mode: 'local-only',
        status: 'invalid',
        inputKind,
        actions: resolverActions({ status: 'invalid', inputKind }),
        warnings: ['empty-input'],
        audit,
      };
    }
  }

  const normalizedRecord = aoidRecord || registeredAddress;
  if (normalizedRecord) {
    registeredAddress = normalizedRecord;
    addressText = addressText || recordAddressText(normalizedRecord);
    apiAddress = {
      ...recordApiAddress(normalizedRecord),
      ...apiAddress,
    };
    details = details || normalizedRecord;
    if (normalizedRecord.agid) agidId = normalizedRecord.agid;
    audit.push({ step: 'normalize-record', status: 'ok', message: `Normalized ${inputKind} record for local resolution.` });
  }

  if (!coordinates && inputCoordinates) coordinates = inputCoordinates;
  let originalPin = coordinates;
  if (agidId) {
    agid = decodeAgidToResult(agidId) || undefined;
    if (!agid) {
      return {
        resolverVersion: AGID_LOCAL_RESOLVER_VERSION,
        mode: 'local-only',
        status: 'invalid',
        inputKind,
        agidId,
        actions: resolverActions({ status: 'invalid', inputKind }),
        warnings: ['invalid-agid'],
        audit: [
          ...audit,
          { step: 'decode-agid', status: 'failed', message: `Could not decode AGID ${agidId}.` },
        ],
      };
    }
    if (coordinates) {
      const pin = encodeAGID(coordinates.lat, coordinates.lon);
      if (pin.face !== agid.face || pin.qx !== agid.qx || pin.qy !== agid.qy) {
        warnings.push('pin-outside-issued-cell');
        coordinates = undefined;
        originalPin = undefined;
      }
    }
    coordinates ??= { lat: agid.lat, lon: agid.lon };
  } else if (coordinates) {
    agid = encodeAGID(coordinates.lat, coordinates.lon);
    agidId = agid.id;
  }

  const cellGeography = agid?.coordinateSource === 'cell'
    ? assessAgidGeography({ kind: 'cell', id: agid.id }) : undefined;
  const accuracyMeters = input.coordinates?.accuracyMeters;
  const pinGeography = originalPin && (agid?.landBorder || cellGeography?.landBorder
    || accuracyMeters !== undefined || (inputCoordinates && cellGeography))
    ? assessAgidGeography({ kind: 'pin', ...originalPin, method: accuracyMeters === undefined ? 'manual' : 'device', accuracyMeters }) : undefined;
  const geography = pinGeography ?? cellGeography;
  const landBorder = geography?.landBorder;
  const uncertainBorder = Boolean(landBorder && (geography?.status !== 'mapped' || geography.regionCandidates.length !== 1
    || landBorder.relation === 'boundary' || needsBorderConfirmation(landBorder)));
  const islandPolicy = cellGeography ? cellGeography.island : agid?.island;
  const uncertainIsland = islandPolicy && (islandPolicy.countryCodes.length !== 1
    || islandPolicy.relation === 'boundary' || islandPolicy.status === 'unresolved' || islandPolicy.status === 'disputed');
  const inferredBorderCountry = uncertainBorder ? undefined : landBorder?.codes[0];
  if (agid) {
    if (uncertainBorder) {
      agid = { ...agid, regionCode: 'BORDER_UNRESOLVED', regionName: 'Border area requiring confirmation' };
    }
    if (!uncertainIsland && !uncertainBorder) {
      // A retained ID may have an older prefix or a different region at its cell centre.
      // In the border layer the polygon hit supplies the inferred country.
      const derived = landBorder
        ? { country_code: normalizeCountryCode(input.countryCode || inferredBorderCountry).toLowerCase() }
        : agidApiAddress(agid, input.countryCode);
      apiAddress = { ...derived, ...apiAddress };
    }
    if (!landBorder) addressText = addressText || agid.regionName;
    audit.push({ step: 'decode-agid', status: 'ok', message: `Resolved AGID ${agid.id} locally.` });
  }

  if (uncertainBorder) {
    // A reverse-geocoder can choose a side even when the device or AGID cell
    // straddles the line. Only an explicit or saved postal choice survives.
    const postalChoice = {
      country_code: normalizeCountryCode(input.countryCode || normalizedRecord?.country).toLowerCase(),
      country: '', countryCode: '', countrycode: '', cc: '',
    };
    apiAddress = { ...apiAddress, ...postalChoice };
    if (details) details = { ...details, ...postalChoice };
  }
  const countryCode = normalizeCountryCode(
    input.countryCode || apiAddress.country_code || normalizedRecord?.country
      || (uncertainIsland || uncertainBorder ? undefined : inferredBorderCountry || agid?.regionCode || agid?.prefix),
  );
  const needsBorderChoice = uncertainBorder && !countryCode;
  if (needsBorderChoice) warnings.push('border-country-needs-confirmation');
  let addressFormat: AddressFormat | null = input.addressFormat ?? null;
  try {
    addressFormat = await resolveAddressFormat(countryCode, input);
    audit.push({
      step: 'load-address-format',
      status: addressFormat ? 'ok' : 'warning',
      message: addressFormat
        ? `Loaded local address format for ${addressFormat.countryCode}.`
        : 'No local address format was available.',
    });
  } catch (error) {
    warnings.push('address-format-load-failed');
    audit.push({
      step: 'load-address-format',
      status: 'warning',
      message: error instanceof Error ? error.message : 'Address format lookup failed.',
    });
  }

  const languageTabs = input.languageTabs?.length
    ? input.languageTabs
    : ['local', 'en', 'intl_en'];
  const displayTextByTab = {
    ...(addressText ? { local: addressText } : {}),
    ...(input.displayTextByTab || {}),
  };
  const intelligence = evaluateAgidAddressIntelligence({
    agid: agid?.id || agidId || undefined,
    addressText,
    apiAddress,
    details,
    countryCode,
    format: addressFormat,
    sources: [
      LOCAL_RESOLVER_SOURCE,
      ...(agid ? ['agid-core'] : []),
      ...(registeredAddress ? ['registered-address-local'] : []),
      ...(aoidRecord ? ['aoid-local'] : []),
      ...(secureOpened?.ok ? ['agid-s-pos-local'] : []),
    ],
    isSea: agid?.isSea,
    selectedLanguageTab: input.selectedLanguageTab || languageTabs[0],
    languageTabs,
    displayTextByTab,
    candidates: input.candidates,
  });
  audit.push({
    step: 'evaluate-address-intelligence',
    status: intelligence.decision === 'accept' ? 'ok' : 'warning',
    message: `${AGID_ADDRESS_INTELLIGENCE_ENGINE_VERSION} returned ${intelligence.decision}.`,
  });

  const status = needsBorderChoice ? 'partial' : statusFromIntelligence(intelligence);
  const result: AgidLocalResolverResult = {
    resolverVersion: AGID_LOCAL_RESOLVER_VERSION,
    mode: 'local-only',
    status,
    inputKind,
    ...(agid ? { agid, agidId: agid.id } : agidId ? { agidId } : {}),
    ...(coordinates ? { coordinates } : {}),
    ...(landBorder && { geography }),
    ...(registeredAddress ? { registeredAddress } : {}),
    ...(aoidRecord ? {
      aoid: {
        record: aoidRecord,
        publicDescriptor: buildAOIDPublicDescriptor(aoidRecord),
      },
    } : {}),
    ...(secureOpened ? {
      secure: {
        modelVersion: AGID_SECURE_POS_MODEL_VERSION,
        opened: secureOpened,
      },
    } : {}),
    addressFormat,
    intelligence,
    actions: resolverActions({ status, inputKind, intelligence }),
    warnings,
    audit,
  };

  return result;
}
