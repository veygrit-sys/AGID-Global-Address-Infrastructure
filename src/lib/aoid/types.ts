import type { RegisteredAddressRecord } from '../registeredAddressQr';

export type AOIDStorageMode = 'device-local' | 'encrypted-cloud' | 'owner-export';
export type AOIDStatus = 'active' | 'revoked' | 'rotated';
export type AOIDSyncReadiness = 'local-only' | 'encrypted-sync-ready' | 'blocked';
export type AOIDDeliveryAccessKind =
  | 'standard'
  | 'auto-lock'
  | 'po-box'
  | 'locker'
  | 'front-desk'
  | 'unknown';

export type AOIDDeliveryAccessProfile = {
  kind: AOIDDeliveryAccessKind;
  autoLock: boolean;
  poBox: boolean;
  locker: boolean;
  frontDesk: boolean;
  carrierReviewRequired: boolean;
  confirmedAt?: number;
  instructionCommitment?: string;
};

export type AOIDPrivateBodySchemaVersion = 'aoid-private-body-v1';
export type AOIDDropOffPreference =
  | 'recipient-handoff'
  | 'front-door'
  | 'locker'
  | 'front-desk'
  | 'designated-place'
  | 'do-not-leave-unattended';
export type AOIDAccessActor = 'owner' | 'recipient' | 'carrier' | 'delegate' | 'emergency-service';
export type AOIDAccessPurpose =
  | 'owner-management'
  | 'delivery'
  | 'residence-verification'
  | 'emergency';
export type AOIDDisclosureField =
  | 'agid'
  | 'building'
  | 'floor'
  | 'room'
  | 'recipient'
  | 'delivery-options'
  | 'intercom'
  | 'metadata';

export type AOIDPrivateBody = {
  schemaVersion: AOIDPrivateBodySchemaVersion;
  agid: string;
  building?: {
    name?: string;
    block?: string;
    entrance?: string;
  };
  floor?: string;
  room?: string;
  recipient?: {
    name?: string;
    organization?: string;
    phone?: string;
  };
  deliveryOptions: {
    dropOffPreference: AOIDDropOffPreference;
    unattendedDeliveryAllowed: boolean;
    signatureRequired: boolean;
    instructions?: string;
  };
  intercom?: {
    callLabel?: string;
    accessCode?: string;
    instructions?: string;
  };
  accessPolicy: {
    allowedActors: AOIDAccessActor[];
    allowedPurposes: AOIDAccessPurpose[];
    disclosedFields: AOIDDisclosureField[];
    ownerConsentRequired: boolean;
  };
  validity: {
    validFrom?: number;
    validUntil?: number;
  };
  metadata: {
    label?: string;
    locale?: string;
    tags: string[];
  };
};

export interface AOIDData {
  id: string; // 9- to 16-character AGID-anchored base32
  name: string;
  phone: string;
  address: string;
  building?: string;
  room?: string;
  agid?: string;
  lat: number;
  lng: number;
  updatedAt: number;
}

export type AOIDRecord = RegisteredAddressRecord & {
  type: 'AOID';
  isAoid: true;
  version: number;
  ownerManaged: true;
  privacy: 'private';
  storageMode: AOIDStorageMode;
  syncReadiness: AOIDSyncReadiness;
  status: AOIDStatus;
  publicHandle: string;
  deliveryAccess: AOIDDeliveryAccessProfile;
  privateBody?: AOIDPrivateBody;
  ownerKeyId?: string;
  deviceKeyId?: string;
  revokedAt?: number;
};

export type AOIDPublicDescriptor = {
  type: 'AOID';
  id: string;
  agid?: string;
  country?: string;
  version: number;
  status: AOIDStatus;
  publicHandle: string;
  privacy: 'public-reference';
};

export type AOIDEncryptedSyncEnvelope = {
  type: 'AOID_SYNC_ENVELOPE';
  id: string;
  agid?: string;
  publicHandle: string;
  version: number;
  status: AOIDStatus;
  encryptedPayload: string;
  encryption: 'owner-device';
  ownerKeyId?: string;
  deviceKeyId?: string;
  updatedAt: number;
};
