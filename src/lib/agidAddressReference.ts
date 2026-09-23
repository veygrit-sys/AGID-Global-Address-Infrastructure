import {
  AGID_GRID_AXIS_BITS,
  getAGIDCellKey,
  matchAGIDGridNeighborhood,
  type AGIDGridNeighborhoodMatch,
} from './agid';
import {
  isValidAGIDFormat,
  normalizeAGIDInput,
} from './agidSecurity';

export const AGID_ADDRESS_REFERENCE_VERSION = 'agid-address-reference-v0.1';

export type AgidSubPremiseMetadata = {
  classification: 'private-sub-premise';
  retention: 'client-controlled';
  unit?: string;
  floor?: string;
  entrance?: string;
  internalRoute?: string;
};

export type AgidPublicBuildingReference = {
  version: typeof AGID_ADDRESS_REFERENCE_VERSION;
  agid: string;
  gridAxisBits: typeof AGID_GRID_AXIS_BITS;
  cellKey: string;
  buildingId: string;
  referenceKey: string;
  privacy: {
    privateDetailIncluded: false;
    personalDataIncluded: false;
    publicBuildingLayer: true;
  };
};

export type AgidAddressReferenceBundle = {
  publicReference: AgidPublicBuildingReference;
  privateMetadata: AgidSubPremiseMetadata | null;
};

export type AgidBuildingMatchClass =
  | 'same-public-building'
  | 'same-building-boundary'
  | 'same-grid-area'
  | 'nearby-grid-area'
  | 'separate-area'
  | 'invalid';

export type AgidBuildingReferenceMatch = {
  version: 'agid-building-reference-match-v0.1';
  matchClass: AgidBuildingMatchClass;
  grid: AGIDGridNeighborhoodMatch;
  sameOrNearArea: boolean;
  samePublicBuilding: boolean;
  reviewRequired: boolean;
  reasonCodes: string[];
  subPremiseCompared: false;
  nonClaims: string[];
};

export type AgidPublicAddressMatchComponents = {
  countryCode: string;
  adminArea?: string;
  locality?: string;
  street?: string;
  houseNumber?: string;
  buildingId: string;
};

export type AgidNormalizedPublicAddress = {
  version: 'agid-public-address-normalization-v0.1';
  countryCode: string;
  adminArea: string;
  locality: string;
  street: string;
  houseNumber: string;
  buildingId: string;
  canonicalKey: string;
  excludedFields: ['sub-premise'];
};

const BUILDING_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const COUNTRY_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_/-]{1,15}$/;
const SUB_PREMISE_FIELDS = new Set([
  'unit',
  'floor',
  'entrance',
  'internalRoute',
]);
const DECIMAL_ZERO_CODE_POINTS = [
  0x0660,
  0x06F0,
  0x0966,
  0x09E6,
  0x0A66,
  0x0AE6,
  0x0B66,
  0x0BE6,
  0x0C66,
  0x0CE6,
  0x0D66,
  0x0E50,
  0x0ED0,
  0x1040,
];

function normalizeDecimalDigits(value: string) {
  return [...value].map(character => {
    const codePoint = character.codePointAt(0)!;
    for (const zero of DECIMAL_ZERO_CODE_POINTS) {
      if (codePoint >= zero && codePoint <= zero + 9) {
        return String(codePoint - zero);
      }
    }
    return character;
  }).join('');
}

function cleanPrivateValue(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') {
    throw new TypeError(`${field} must be a string.`);
  }
  const cleaned = value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length > 64) {
    throw new RangeError(`${field} must not exceed 64 characters.`);
  }
  return cleaned;
}

export function normalizeAgidBuildingId(value: unknown) {
  if (typeof value !== 'string') {
    throw new TypeError('buildingId must be an opaque string identifier.');
  }
  const normalized = value.normalize('NFKC').trim();
  if (!BUILDING_ID_PATTERN.test(normalized)) {
    throw new TypeError(
      'buildingId must use 1-64 ASCII letters, numbers, dot, underscore, colon, or hyphen.',
    );
  }
  return normalized;
}

function normalizeAgid(value: unknown) {
  const normalized = normalizeAGIDInput(value);
  if (!normalized || !isValidAGIDFormat(normalized)) {
    throw new TypeError('agid must be a valid 12-character AGID.');
  }
  return normalized;
}

export function buildAgidAddressReference(input: {
  agid: unknown;
  buildingId: unknown;
  subPremise?: Record<string, unknown> | null;
}): AgidAddressReferenceBundle {
  const agid = normalizeAgid(input.agid);
  const buildingId = normalizeAgidBuildingId(input.buildingId);
  const cellKey = getAGIDCellKey(agid);
  if (!cellKey) throw new TypeError('agid could not be decoded to a 21-bit cell.');

  const publicReference: AgidPublicBuildingReference = {
    version: AGID_ADDRESS_REFERENCE_VERSION,
    agid,
    gridAxisBits: AGID_GRID_AXIS_BITS,
    cellKey,
    buildingId,
    referenceKey: `${agid}:${buildingId}`,
    privacy: {
      privateDetailIncluded: false,
      personalDataIncluded: false,
      publicBuildingLayer: true,
    },
  };

  if (!input.subPremise) {
    return { publicReference, privateMetadata: null };
  }
  const unknownFields = Object.keys(input.subPremise)
    .filter(field => !SUB_PREMISE_FIELDS.has(field));
  if (unknownFields.length) {
    throw new TypeError('subPremise contains unsupported fields.');
  }
  const unit = cleanPrivateValue(input.subPremise.unit, 'unit');
  const floor = cleanPrivateValue(input.subPremise.floor, 'floor');
  const entrance = cleanPrivateValue(input.subPremise.entrance, 'entrance');
  const internalRoute = cleanPrivateValue(
    input.subPremise.internalRoute,
    'internalRoute',
  );
  const hasPrivateMetadata = Boolean(unit || floor || entrance || internalRoute);

  return {
    publicReference,
    privateMetadata: hasPrivateMetadata
      ? {
        classification: 'private-sub-premise',
        retention: 'client-controlled',
        ...(unit ? { unit } : {}),
        ...(floor ? { floor } : {}),
        ...(entrance ? { entrance } : {}),
        ...(internalRoute ? { internalRoute } : {}),
      }
      : null,
  };
}

export function compareAgidBuildingReferences(
  left: AgidPublicBuildingReference,
  right: AgidPublicBuildingReference,
): AgidBuildingReferenceMatch {
  const grid = matchAGIDGridNeighborhood(left.agid, right.agid);
  const valid = grid.relation !== 'invalid';
  const sameOrNearArea = valid && grid.acceptedAsSameOrNearArea;
  const sameBuildingId = left.buildingId === right.buildingId;
  const samePublicBuilding = sameOrNearArea && sameBuildingId;
  let matchClass: AgidBuildingMatchClass = 'invalid';

  if (valid) {
    if (samePublicBuilding && grid.relation === 'same-cell') {
      matchClass = 'same-public-building';
    } else if (samePublicBuilding && grid.boundaryMatch) {
      matchClass = 'same-building-boundary';
    } else if (grid.relation === 'same-cell') {
      matchClass = 'same-grid-area';
    } else if (grid.boundaryMatch) {
      matchClass = 'nearby-grid-area';
    } else {
      matchClass = 'separate-area';
    }
  }

  const reasonCodes: string[] = [];
  if (grid.boundaryMatch) reasonCodes.push('adjacent-grid-boundary-accepted');
  if (samePublicBuilding) reasonCodes.push('same-opaque-building-id');
  if (sameOrNearArea && !sameBuildingId) {
    reasonCodes.push('different-building-id-within-near-area');
  }
  if (!sameOrNearArea && sameBuildingId) {
    reasonCodes.push('building-id-location-conflict');
  }
  if (!valid) reasonCodes.push('invalid-agid-reference');

  return {
    version: 'agid-building-reference-match-v0.1',
    matchClass,
    grid,
    sameOrNearArea,
    samePublicBuilding,
    reviewRequired:
      matchClass === 'same-building-boundary'
      || matchClass === 'nearby-grid-area'
      || reasonCodes.includes('building-id-location-conflict'),
    reasonCodes,
    subPremiseCompared: false,
    nonClaims: [
      'A public building match does not prove a unit, room, recipient, entrance, or access route.',
      'Sub-premise metadata is intentionally excluded from public AGID and building comparison.',
      'A boundary match is a candidate relation and may require reviewed building geometry.',
    ],
  };
}

export function comparePrivateSubPremiseMetadata(
  left: AgidSubPremiseMetadata | null,
  right: AgidSubPremiseMetadata | null,
): 'same' | 'different' | 'unknown' {
  if (!left || !right) return 'unknown';
  const fields = ['unit', 'floor', 'entrance', 'internalRoute'] as const;
  return fields.every(field =>
    cleanPrivateValue(left[field], field)
    === cleanPrivateValue(right[field], field))
    ? 'same'
    : 'different';
}

function normalizeComparableText(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') throw new TypeError(`${field} must be a string.`);
  let normalized = normalizeDecimalDigits(value.normalize('NFKC'))
    .replace(/[‐‑‒–—―−]/g, '-')
    .replace(/[’‘`´]/g, "'")
    .toUpperCase();
  if (/^[\p{Script=Latin}\p{M}\p{N}\p{P}\p{S}\p{Zs}]+$/u.test(normalized)) {
    normalized = normalized.normalize('NFKD').replace(/\p{M}+/gu, '');
  }
  normalized = normalized
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (normalized.length > 128) {
    throw new RangeError(`${field} must not exceed 128 normalized characters.`);
  }
  return normalized;
}

function normalizeHouseNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') throw new TypeError('houseNumber must be a string.');
  const normalized = normalizeDecimalDigits(value.normalize('NFKC'))
    .replace(/[‐‑‒–—―−]/g, '-')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9/-]/g, '');
  if (normalized.length > 32) {
    throw new RangeError('houseNumber must not exceed 32 normalized characters.');
  }
  return normalized;
}

export function normalizeAgidPublicAddress(
  input: AgidPublicAddressMatchComponents,
): AgidNormalizedPublicAddress {
  const countryCode = String(input.countryCode ?? '')
    .normalize('NFKC')
    .trim()
    .toUpperCase();
  if (!COUNTRY_CODE_PATTERN.test(countryCode)) {
    throw new TypeError('countryCode must be a bounded country or neutral-scope code.');
  }
  const buildingId = normalizeAgidBuildingId(input.buildingId);
  const normalized = {
    countryCode,
    adminArea: normalizeComparableText(input.adminArea, 'adminArea'),
    locality: normalizeComparableText(input.locality, 'locality'),
    street: normalizeComparableText(input.street, 'street'),
    houseNumber: normalizeHouseNumber(input.houseNumber),
    buildingId,
  };
  return {
    version: 'agid-public-address-normalization-v0.1',
    ...normalized,
    canonicalKey: JSON.stringify([
      normalized.countryCode,
      normalized.adminArea,
      normalized.locality,
      normalized.street,
      normalized.houseNumber,
      normalized.buildingId,
    ]),
    excludedFields: ['sub-premise'],
  };
}
