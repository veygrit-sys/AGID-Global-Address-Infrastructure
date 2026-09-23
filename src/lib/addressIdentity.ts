export type AddressIdentityLayer = 'AGID' | 'AOID';

export type AddressIdentityVisibility = 'public' | 'private';

export type AddressIdentitySubject = 'public-geographic-entity' | 'private-delivery-destination';

export type AddressIdentityUpdateAuthority = 'operator-spec-only' | 'owner-only';

export type AddressIdentityQrAuthority = 'immutable-location' | 'owner-only';

export type AddressIdentityDistributionMode =
  | 'sdk-and-device-generated'
  | 'owner-controlled-private-sync';
export type AddressIdentityMutability = 'stable-public-reference' | 'owner-editable';
export type AddressIdentityHolder = 'system-governed' | 'user-owned';
export type AddressIdentityCardinality =
  | 'one-canonical-reference-per-geographic-entity'
  | 'multiple-per-owner-purpose-or-validity';

export type AddressIdentityPolicy = {
  layer: AddressIdentityLayer;
  label: string;
  visibility: AddressIdentityVisibility;
  subject: AddressIdentitySubject;
  represents: string;
  includesPublicAddress: boolean;
  includesBuildingName: boolean;
  includesUnitOrRoom: boolean;
  mayIncludePersonalData: boolean;
  updateAuthority: AddressIdentityUpdateAuthority;
  qrUpdateAuthority: AddressIdentityQrAuthority;
  centralRole: string;
  distributedRole: string;
  distributionMode: AddressIdentityDistributionMode;
  mutability: AddressIdentityMutability;
  holder: AddressIdentityHolder;
  cardinality: AddressIdentityCardinality;
  referencesLayer?: 'AGID';
  publicLayerSafe: boolean;
};

export type AddressIdentityComparisonRow = {
  item: string;
  agid: string;
  aoid: string;
};

export type AddressIdentityCommunicationPolicy = {
  layer: AddressIdentityLayer;
  defaultMode: string;
  publicApiSurface: string;
  sdkSurface: string;
  qrSurface: string;
  syncSurface: string;
  realtimeSurface: string;
  allowedNetworkPayloads: string[];
  forbiddenNetworkPayloads: string[];
  cachePolicy: string;
  ownershipRule: string;
};

const ADDRESS_IDENTITY_POLICIES: Record<AddressIdentityLayer, AddressIdentityPolicy> = {
  AGID: {
    layer: 'AGID',
    label: 'Address Grid ID',
    visibility: 'public',
    subject: 'public-geographic-entity',
    represents: 'public geographic location and non-personal place reference',
    includesPublicAddress: true,
    includesBuildingName: true,
    includesUnitOrRoom: false,
    mayIncludePersonalData: false,
    updateAuthority: 'operator-spec-only',
    qrUpdateAuthority: 'immutable-location',
    centralRole: 'govern grid specification, reserved ranges, deprecation rules, and public quality packs',
    distributedRole: 'encode, decode, and calculate cell bounds in SDKs and devices without central approval',
    distributionMode: 'sdk-and-device-generated',
    mutability: 'stable-public-reference',
    holder: 'system-governed',
    cardinality: 'one-canonical-reference-per-geographic-entity',
    publicLayerSafe: true,
  },
  AOID: {
    layer: 'AOID',
    label: 'Address Owner ID',
    visibility: 'private',
    subject: 'private-delivery-destination',
    represents: 'private delivery and residence destination that references an AGID',
    includesPublicAddress: true,
    includesBuildingName: true,
    includesUnitOrRoom: true,
    mayIncludePersonalData: true,
    updateAuthority: 'owner-only',
    qrUpdateAuthority: 'owner-only',
    centralRole: 'optional encrypted or private sync, recovery, and quality assistance after explicit owner consent',
    distributedRole: 'local-first owner storage, owner-generated QR, and SDK-readable private payloads',
    distributionMode: 'owner-controlled-private-sync',
    mutability: 'owner-editable',
    holder: 'user-owned',
    cardinality: 'multiple-per-owner-purpose-or-validity',
    referencesLayer: 'AGID',
    publicLayerSafe: false,
  },
};

export const ADDRESS_IDENTITY_COMPARISON: AddressIdentityComparisonRow[] = [
  { item: '目的', agid: '公開可能な地理識別子', aoid: '配送・居住先の私的識別子' },
  { item: '編集', agid: '不可（安定した公開参照）', aoid: '可（ユーザー管理）' },
  { item: '範囲', agid: '地域・街区・建物など公開可能な地理実体', aoid: '建物・階・部屋・受取人・受取方法などを含む配送先' },
  { item: 'プライバシー', agid: '公開前提・個人情報なし', aoid: '非公開前提・暗号化または端末内保存' },
  { item: '保持者', agid: 'システムが仕様と公開参照を管理', aoid: 'ユーザーが所有・管理' },
  { item: '数', agid: '地理実体ごとに基本1つ', aoid: '用途・有効期間に応じて複数作成可能' },
  { item: '参照関係', agid: 'AOIDから参照される', aoid: '必ずAGIDを参照する' },
  { item: '更新時', agid: '対象地理実体が変わる場合は新しい参照へ切替', aoid: '引越し・部屋・受取条件の変更時に本文を更新' },
];

export const ADDRESS_IDENTITY_COMMUNICATION: Record<AddressIdentityLayer, AddressIdentityCommunicationPolicy> = {
  AGID: {
    layer: 'AGID',
    defaultMode: 'public-or-local',
    publicApiSurface: 'public REST/OpenAPI endpoints for grid, address evidence, postal, geocoding, building, public map features, terrain, and quality checks',
    sdkSurface: 'offline encode/decode/cellBounds and optional public source-pack reads',
    qrSurface: 'public AGID cards and public registered-address references',
    syncSurface: 'saved public grid references and public descriptors only',
    realtimeSurface: 'job status and public-quality progress events only',
    allowedNetworkPayloads: [
      'AGID',
      'coordinates when needed for public evidence lookup',
      'country or sea code',
      'public address label',
      'public building or place name',
      'public map feature name',
      'source and confidence metadata',
    ],
    forbiddenNetworkPayloads: [
      'recipient',
      'phone',
      'unit or room',
      'private delivery instruction',
      'private ownership proof',
    ],
    cachePolicy: 'public evidence may use read-through cache or versioned data packs; dynamic API responses still use privacy-safe no-store headers',
    ownershipRule: 'no owner proof is required to generate, decode, share, or cache AGID',
  },
  AOID: {
    layer: 'AOID',
    defaultMode: 'local-first-private',
    publicApiSurface: 'public surfaces expose only an opaque commitment or scoped reference plus linked public AGID when policy permits',
    sdkSurface: 'owner apps may create/read private payloads locally; SDK use does not grant ownership',
    qrSurface: 'public QR is reference-only; full QR is private trusted-device transfer',
    syncSurface: 'owner-consented owner-device encrypted envelope only',
    realtimeSurface: 'sync status only; no plaintext private AOID fields in events',
    allowedNetworkPayloads: [
      'AOID commitment or scoped reference',
      'linked public AGID when policy permits',
      'status or version',
      'opaque encrypted payload',
      'owner key id',
      'device key id',
    ],
    forbiddenNetworkPayloads: [
      'raw AOID private body',
      'plaintext recipient',
      'plaintext phone',
      'plaintext unit or room',
      'plaintext delivery instruction',
      'exact private coordinates in public payloads',
      'update timestamp in public payloads',
    ],
    cachePolicy: 'no public cache, no public data-pack export, and no plaintext server persistence',
    ownershipRule: 'only explicit owner consent plus owner/device keys can authorize private sync or update',
  },
};

export function getAddressIdentityPolicy(layer: AddressIdentityLayer): AddressIdentityPolicy {
  return ADDRESS_IDENTITY_POLICIES[layer];
}

export function getAddressIdentityCommunicationPolicy(layer: AddressIdentityLayer): AddressIdentityCommunicationPolicy {
  return ADDRESS_IDENTITY_COMMUNICATION[layer];
}

export function listAddressIdentityPolicies(): AddressIdentityPolicy[] {
  return Object.values(ADDRESS_IDENTITY_POLICIES);
}

export function listAddressIdentityCommunicationPolicies(): AddressIdentityCommunicationPolicy[] {
  return Object.values(ADDRESS_IDENTITY_COMMUNICATION);
}

export function canPublishIdentityLayer(layer: AddressIdentityLayer): boolean {
  return getAddressIdentityPolicy(layer).publicLayerSafe;
}

export function canOwnerUpdateIdentityLayer(layer: AddressIdentityLayer): boolean {
  return getAddressIdentityPolicy(layer).updateAuthority === 'owner-only';
}

export function getAddressIdentitySummary(layer: AddressIdentityLayer): string {
  const policy = getAddressIdentityPolicy(layer);
  return `${policy.layer}: ${policy.represents}; ${policy.visibility}; ${policy.distributionMode}`;
}
