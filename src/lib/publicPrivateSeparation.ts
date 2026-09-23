import { isValidAGIDFormat, normalizeAGIDInput } from './agidSecurity';
import { sha256Hex } from './sha256';

export const PUBLIC_PRIVATE_SEPARATION_VERSION = 'public-private-separation-v1';
export const PUBLIC_PRIVATE_COMMITMENT_ALGORITHM = 'sha256-domain-separated-public-private-commitment-v1';

export type PublicPrivateSeparationMode =
  | 'local-only'
  | 'server-registry'
  | 'address-dns'
  | 'zk-proof'
  | 'ethereum-registry'
  | 'public-qr'
  | 'private-qr'
  | 'encrypted-sync'
  | 'event-stream'
  | 'openapi';

export type PublicPrivateSensitivity =
  | 'public'
  | 'private'
  | 'secret-local-only';

export type PublicPrivateClassification = {
  path: string;
  key: string;
  sensitivity: PublicPrivateSensitivity;
  reason: string;
  commitment?: string;
};

export type PublicPrivateCommitment = {
  path: string;
  key: string;
  algorithm: typeof PUBLIC_PRIVATE_COMMITMENT_ALGORITHM;
  domain: string;
  commitment: string;
};

export type PublicPrivateSeparationInput = {
  payload: unknown;
  mode: PublicPrivateSeparationMode;
  domain: string;
  salt?: string;
  now?: string;
  highRiskMode?: boolean;
  allowPublicAgid?: boolean;
};

export type PublicPrivateSeparationResult = {
  version: typeof PUBLIC_PRIVATE_SEPARATION_VERSION;
  mode: PublicPrivateSeparationMode;
  domain: string;
  createdAt: string;
  publicPayload: Record<string, unknown>;
  privatePayload: Record<string, unknown>;
  commitments: PublicPrivateCommitment[];
  classification: PublicPrivateClassification[];
  blocked: boolean;
  errors: string[];
  warnings: string[];
  auditFingerprint: string;
  privacy: {
    rawAddressPublic: false;
    rawAgidPublic: boolean;
    rawAoidPublic: false;
    rawCoordinatesPublic: false;
    recipientIdentityPublic: false;
    privatePayloadStorage: 'local-device-or-encrypted-vault';
    publicPayloadContainsCommitmentsOnlyForPrivateFields: boolean;
  };
};

export type PublicPrivateValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const PUBLIC_NETWORK_MODES = new Set<PublicPrivateSeparationMode>([
  'server-registry',
  'address-dns',
  'zk-proof',
  'ethereum-registry',
  'public-qr',
  'event-stream',
  'openapi',
]);

const PRIVATE_KEY_SET = new Set([
  'address',
  'addresstext',
  'addressline',
  'addresslines',
  'fulladdress',
  'rawaddress',
  'streetaddress',
  'physicaladdress',
  'recipient',
  'recipientname',
  'name',
  'fullname',
  'phone',
  'phonenumber',
  'telephone',
  'email',
  'building',
  'room',
  'unit',
  'unitnumber',
  'apartment',
  'flat',
  'suite',
  'floor',
  'postcode',
  'postalcode',
  'zip',
  'lat',
  'latitude',
  'lng',
  'lon',
  'longitude',
  'coordinates',
  'deliveryinstructions',
  'accessinstructions',
  'privatenote',
  'agids',
  'agidsecure',
  'ciphertext',
  'encryptedpayload',
]);

const SECRET_KEY_SET = new Set([
  'secret',
  'recipientsecret',
  'privatesecret',
  'privatekey',
  'secretkey',
  'mnemonic',
  'seed',
  'password',
  'passphrase',
  'token',
  'accesstoken',
  'refreshtoken',
  'credentialsecret',
]);

const PUBLIC_KEY_PATTERN = /(commitment|hash|root|nullifier|issuerid|issuerstatus|scope|recordid|recordhash|ownername|zone|ttl|priority|weight|serviceendpoint|policy|evidence|freshness|revocation|status|version|algorithm|keyid|jti|alias|confidence|quality|country|region|language|locale|createdat|issuedat|expiresat)/i;

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function normalizeDomain(value: string) {
  return clean(value).toLowerCase().replace(/[^a-z0-9:._-]+/g, '-');
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseDate(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, nested]) => nested !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    .join(',')}}`;
}

function looksLikeCoordinatePair(value: string) {
  return /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/.test(value.trim());
}

function looksLikeRawAoid(value: string) {
  const compact = value.toUpperCase().replace(/[\s-]+/g, '');
  return /^[0-9A-HJKMNP-TV-Z]{9,16}$/.test(compact);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function setNested(target: Record<string, unknown>, path: string[], value: unknown) {
  if (path.length === 0) return;
  let cursor = target;
  path.slice(0, -1).forEach(part => {
    const existing = cursor[part];
    if (!isPlainRecord(existing)) cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  });
  cursor[path[path.length - 1]] = value;
}

function commitmentFor(input: {
  domain: string;
  salt: string;
  path: string;
  value: unknown;
}) {
  const digest = sha256Hex(stableStringify({
    algorithm: PUBLIC_PRIVATE_COMMITMENT_ALGORITHM,
    domain: input.domain,
    path: input.path,
    salt: input.salt,
    value: input.value,
  }));
  return `ppc:${input.domain}:${digest}`;
}

function canExposeAgid(input: PublicPrivateSeparationInput) {
  if (input.highRiskMode) return false;
  if (PUBLIC_NETWORK_MODES.has(input.mode) && !input.allowPublicAgid) return false;
  return Boolean(input.allowPublicAgid || input.mode === 'local-only' || input.mode === 'private-qr');
}

function classifyLeaf(
  key: string,
  value: unknown,
  input: PublicPrivateSeparationInput,
): Pick<PublicPrivateClassification, 'sensitivity' | 'reason'> {
  const normalizedKey = normalizeKey(key);
  const text = clean(value);

  if (SECRET_KEY_SET.has(normalizedKey)) {
    return {
      sensitivity: 'secret-local-only',
      reason: 'secret material must never be placed in public payloads',
    };
  }

  if (normalizedKey === 'aoid' || normalizedKey === 'rawaoid') {
    return {
      sensitivity: 'private',
      reason: 'AOID is a private ownership/control identifier',
    };
  }

  if (normalizedKey === 'agid' || normalizedKey === 'rawagid') {
    return canExposeAgid(input)
      ? {
          sensitivity: 'public',
          reason: 'AGID exposure explicitly allowed for this trusted mode',
        }
      : {
          sensitivity: 'private',
          reason: 'raw AGID is commitment-only for this public or high-risk mode',
        };
  }

  if (PRIVATE_KEY_SET.has(normalizedKey)) {
    return {
      sensitivity: 'private',
      reason: 'field is private address, recipient, coordinate, or delivery material',
    };
  }

  if (text && looksLikeCoordinatePair(text)) {
    return {
      sensitivity: 'private',
      reason: 'string value looks like precise coordinates',
    };
  }

  if (text && looksLikeRawAoid(text) && !isValidAGIDFormat(normalizeAGIDInput(text))) {
    return {
      sensitivity: 'private',
      reason: 'string value looks like raw AOID material',
    };
  }

  if (PUBLIC_KEY_PATTERN.test(key)) {
    return {
      sensitivity: 'public',
      reason: 'field is public metadata, commitment, hash, root, nullifier, issuer, or policy material',
    };
  }

  return {
    sensitivity: 'public',
    reason: 'field is not classified as private by the separation policy',
  };
}

function cloneJson(value: unknown) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value)) as unknown;
}

export function separatePublicPrivatePayload(input: PublicPrivateSeparationInput): PublicPrivateSeparationResult {
  const domain = normalizeDomain(input.domain || input.mode);
  const createdAt = (parseDate(input.now) ?? new Date()).toISOString();
  const publicPayload: Record<string, unknown> = {
    version: PUBLIC_PRIVATE_SEPARATION_VERSION,
    mode: input.mode,
    domain,
  };
  const privatePayload: Record<string, unknown> = {
    version: PUBLIC_PRIVATE_SEPARATION_VERSION,
    mode: input.mode,
    domain,
    storage: 'local-device-or-encrypted-vault',
  };
  const commitments: PublicPrivateCommitment[] = [];
  const classification: PublicPrivateClassification[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const visit = (value: unknown, path: string[], key = 'payload') => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, String(index)], String(index)));
      return;
    }

    if (isPlainRecord(value)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        visit(nestedValue, [...path, nestedKey], nestedKey);
      });
      return;
    }

    const fieldPath = path.join('.');
    const decision = classifyLeaf(key, value, input);
    const entry: PublicPrivateClassification = {
      path: fieldPath,
      key,
      sensitivity: decision.sensitivity,
      reason: decision.reason,
    };

    if (decision.sensitivity === 'public') {
      setNested(publicPayload, ['data', ...path], cloneJson(value));
    } else {
      setNested(privatePayload, ['data', ...path], cloneJson(value));
      if (!input.salt) {
        if (input.mode === 'local-only') {
          warnings.push(`${fieldPath} is private and kept local without a public commitment.`);
        } else {
          errors.push(`salt is required to commit private field ${fieldPath}`);
        }
      } else {
        const commitment = commitmentFor({
          domain,
          salt: input.salt,
          path: fieldPath,
          value,
        });
        entry.commitment = commitment;
        commitments.push({
          path: fieldPath,
          key,
          algorithm: PUBLIC_PRIVATE_COMMITMENT_ALGORITHM,
          domain,
          commitment,
        });
      }
      if (decision.sensitivity === 'secret-local-only') {
        warnings.push(`${fieldPath} is secret-local-only and must be stored in a device vault, not a sync payload.`);
      }
    }

    classification.push(entry);
  };

  visit(input.payload, ['payload']);

  const rawAgidPublic = classification.some(item => {
    const normalizedKey = normalizeKey(item.key);
    return item.sensitivity === 'public' && (normalizedKey === 'agid' || normalizedKey === 'rawagid');
  });

  if (commitments.length > 0) {
    publicPayload.privateCommitments = commitments;
  }
  publicPayload.privacy = {
    rawAddressStored: false,
    rawAgidStored: rawAgidPublic,
    rawAoidStored: false,
    rawCoordinatesStored: false,
    recipientIdentityStored: false,
  };

  const auditFingerprint = sha256Hex(stableStringify({
    version: PUBLIC_PRIVATE_SEPARATION_VERSION,
    mode: input.mode,
    domain,
    publicPayload,
    commitments: commitments.map(item => item.commitment),
    errors,
    warnings,
  })).slice(0, 32);

  return {
    version: PUBLIC_PRIVATE_SEPARATION_VERSION,
    mode: input.mode,
    domain,
    createdAt,
    publicPayload,
    privatePayload,
    commitments,
    classification,
    blocked: errors.length > 0,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    auditFingerprint,
    privacy: {
      rawAddressPublic: false,
      rawAgidPublic,
      rawAoidPublic: false,
      rawCoordinatesPublic: false,
      recipientIdentityPublic: false,
      privatePayloadStorage: 'local-device-or-encrypted-vault',
      publicPayloadContainsCommitmentsOnlyForPrivateFields: commitments.length > 0,
    },
  };
}

export function validatePublicPayloadSeparation(publicPayload: unknown): PublicPrivateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const visit = (value: unknown, path: string[], key = '') => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, String(index)], String(index)));
      return;
    }
    if (isPlainRecord(value)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => visit(nestedValue, [...path, nestedKey], nestedKey));
      return;
    }

    const normalizedKey = normalizeKey(key);
    const fieldPath = path.join('.');
    const text = clean(value);
    if (PRIVATE_KEY_SET.has(normalizedKey) || normalizedKey === 'aoid' || normalizedKey === 'rawaoid') {
      errors.push(`${fieldPath} contains private material in a public payload`);
    }
    if (text && looksLikeCoordinatePair(text)) {
      errors.push(`${fieldPath} contains precise coordinates in a public payload`);
    }
    if (normalizedKey === 'agid' || normalizedKey === 'rawagid') {
      warnings.push(`${fieldPath} exposes raw AGID; ensure this is not a high-risk or Address DNS surface`);
    }
  };

  visit(publicPayload, ['publicPayload']);
  return {
    valid: errors.length === 0,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
  };
}
