import {
  AGID_BASE32_ALPHABET,
  AGID_HASH_LENGTH,
} from '../agidContract';

export const AOID_RECORD_VERSION = 1;
export const AOID_BASE32_ALPHABET = AGID_BASE32_ALPHABET;
export const AOID_ID_MIN_LENGTH = 9;
export const AOID_ID_MAX_LENGTH = 16;
export const AOID_LINKED_AGID_ANCHOR_LENGTH = AGID_HASH_LENGTH;
export const AOID_ID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{9,16}$/;

export const AOID_PRIVATE_FIELDS = [
  'recipient',
  'name',
  'phone',
  'room',
  'floor',
  'unit',
  'deliveryInstructions',
  'accessInstructions',
  'privateNote',
  'lat',
  'lon',
  'lng',
] as const;

export const AOID_SYNC_POLICY = {
  defaultStorageMode: 'device-local',
  cloudStorageMode: 'encrypted-cloud',
  publicQrPrivacy: 'public-reference',
  requiresOwnerConsentForCloud: true,
  requiresEncryptionForCloud: true,
  ownerCanRevoke: true,
} as const;
