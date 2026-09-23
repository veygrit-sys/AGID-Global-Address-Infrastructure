import { buildVeygritAppModel } from './veygritApp';

export const VEYGRIT_SITES_STORE_CATALOG_VERSION = 'veygrit-sites-store-catalog-v0.7';

export type VeygritSitesStoreCatalogStore = {
  storeKey: string;
  logo: string;
  name: string;
  type: string;
  status: 'Connected';
  color: string;
  addressReuseLabel: 'Address reuse on' | 'Address reuse off';
  permissionSummary: 'Address ref only' | 'No wallet address reuse';
  revokeLabel: 'Revoke in Wallet' | 'Manage access';
  visibleRefs: string[];
  hiddenLabels: string[];
  revokeConfirmTitle: string;
  revokeConfirmBody: string;
  confirmRevokeLabel: 'Confirm revoke';
  revokedStatusLabel: 'Revoked';
  revokedNotice: 'Address reuse paused';
  reconnectLabel: 'Reconnect';
};

export type VeygritSitesStoreConnectionState = {
  revokedStoreKeysStorageKey: 'veygrit.dev.revoked-store-keys';
  storedMaterialLabel: 'Store refs only';
  repairPolicyLabel: 'Ignore unknown store refs';
  allowedStoreKeys: string[];
};

export type VeygritSitesStoreCatalog = {
  topics: string[];
  genres: string[];
  myStores: VeygritSitesStoreCatalogStore[];
  connectionState: VeygritSitesStoreConnectionState;
};

export type VeygritSitesStoreCatalogValidation = {
  ok: boolean;
  errors: string[];
};

function escapeJsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const PLATFORM_LABELS = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  'ec-cube': 'EC-CUBE',
  custom: 'Custom',
  marketplace: 'Marketplace',
} as const;

const PLATFORM_COLORS = {
  shopify: '#2f6f3e',
  woocommerce: '#7f54b3',
  'ec-cube': '#f59e0b',
  custom: '#1769e0',
  marketplace: '#111827',
} as const;

const MERCHANT_VISIBLE_REF_LABELS: Record<string, string> = {
  recipientId: 'Recipient ref',
  shipmentRef: 'Shipment ref',
  labelRef: 'Label ref',
  trackingAlias: 'Tracking alias',
  storeRef: 'Store ref',
  connectionRef: 'Connection ref',
};

const HIDDEN_MATERIAL_LABELS: Record<string, string> = {
  raw_address: 'Address body hidden',
  phone_number: 'Contact number hidden',
  provider_token: 'Provider tokens hidden',
  carrier_credentials: 'Carrier credentials hidden',
  raw_carrier_payload: 'Carrier payload hidden',
  private_delivery_note: 'Private notes hidden',
  proof_secret: 'Proof secrets hidden',
};

function formatStoreLogo(displayName: string): string {
  return displayName.match(/[A-Za-z0-9]/)?.[0].toUpperCase() ?? 'S';
}

function renderStringArray(values: string[]): string {
  return `[${values.map(value => `'${escapeJsString(value)}'`).join(', ')}]`;
}

function renderStoreObject(store: VeygritSitesStoreCatalogStore): string {
  return [
    '  {',
    `    storeKey: '${escapeJsString(store.storeKey)}',`,
    `    logo: '${escapeJsString(store.logo)}',`,
    `    name: '${escapeJsString(store.name)}',`,
    `    type: '${escapeJsString(store.type)}',`,
    `    status: '${store.status}',`,
    `    color: '${escapeJsString(store.color)}',`,
    `    addressReuseLabel: '${store.addressReuseLabel}',`,
    `    permissionSummary: '${store.permissionSummary}',`,
    `    revokeLabel: '${store.revokeLabel}',`,
    `    visibleRefs: ${renderStringArray(store.visibleRefs)},`,
    `    hiddenLabels: ${renderStringArray(store.hiddenLabels)},`,
    `    revokeConfirmTitle: '${escapeJsString(store.revokeConfirmTitle)}',`,
    `    revokeConfirmBody: '${escapeJsString(store.revokeConfirmBody)}',`,
    `    confirmRevokeLabel: '${store.confirmRevokeLabel}',`,
    `    revokedStatusLabel: '${store.revokedStatusLabel}',`,
    `    revokedNotice: '${store.revokedNotice}',`,
    `    reconnectLabel: '${store.reconnectLabel}',`,
    '  },',
  ].join('\n');
}

export function buildVeygritSitesStoreCatalog(): VeygritSitesStoreCatalog {
  const model = buildVeygritAppModel();
  const visibleRefs = model.merchantVisibleRefs.map(ref => MERCHANT_VISIBLE_REF_LABELS[ref] ?? 'Scoped ref');
  const hiddenLabels = model.hiddenMaterial.map(ref => HIDDEN_MATERIAL_LABELS[ref] ?? 'Wallet material hidden');

  return {
    topics: model.store.topics.map(topic => topic.label),
    genres: model.store.discoverGenres.map(genre => genre.label),
    myStores: model.store.myStores.map(store => ({
      storeKey: store.storeRef,
      logo: formatStoreLogo(store.displayName),
      name: store.displayName,
      type: PLATFORM_LABELS[store.platform],
      status: 'Connected',
      color: PLATFORM_COLORS[store.platform],
      addressReuseLabel: store.walletAddressReuse ? 'Address reuse on' : 'Address reuse off',
      permissionSummary: store.walletAddressReuse ? 'Address ref only' : 'No wallet address reuse',
      revokeLabel: store.disconnectAction === 'wallet_side_revoke' ? 'Revoke in Wallet' : 'Manage access',
      visibleRefs,
      hiddenLabels,
      revokeConfirmTitle: `Revoke ${store.displayName}?`,
      revokeConfirmBody: 'Future address reuse will require fresh wallet consent. Existing delivery records stay as refs.',
      confirmRevokeLabel: 'Confirm revoke',
      revokedStatusLabel: 'Revoked',
      revokedNotice: 'Address reuse paused',
      reconnectLabel: 'Reconnect',
    })),
    connectionState: {
      revokedStoreKeysStorageKey: 'veygrit.dev.revoked-store-keys',
      storedMaterialLabel: 'Store refs only',
      repairPolicyLabel: 'Ignore unknown store refs',
      allowedStoreKeys: model.store.myStores.map(store => store.storeRef),
    },
  };
}

export function validateVeygritSitesStoreCatalog(
  catalog = buildVeygritSitesStoreCatalog(),
): VeygritSitesStoreCatalogValidation {
  const errors: string[] = [];

  if (catalog.topics.length !== 5) errors.push(`topic-count:${catalog.topics.length}`);
  if (catalog.genres.length !== 32) errors.push(`genre-count:${catalog.genres.length}`);
  if (catalog.myStores.length !== 3) errors.push(`my-store-count:${catalog.myStores.length}`);
  if (new Set(catalog.topics).size !== catalog.topics.length) errors.push('duplicate-topic-label');
  if (new Set(catalog.genres).size !== catalog.genres.length) errors.push('duplicate-genre-label');
  if (new Set(catalog.myStores.map(store => store.name)).size !== catalog.myStores.length) {
    errors.push('duplicate-my-store-name');
  }
  if (new Set(catalog.myStores.map(store => store.storeKey)).size !== catalog.myStores.length) {
    errors.push('duplicate-my-store-key');
  }
  if (catalog.connectionState.revokedStoreKeysStorageKey !== 'veygrit.dev.revoked-store-keys') {
    errors.push(`invalid-store-state-storage-key:${catalog.connectionState.revokedStoreKeysStorageKey}`);
  }
  if (catalog.connectionState.storedMaterialLabel !== 'Store refs only') {
    errors.push(`invalid-store-state-material-label:${catalog.connectionState.storedMaterialLabel}`);
  }
  if (catalog.connectionState.repairPolicyLabel !== 'Ignore unknown store refs') {
    errors.push(`invalid-store-state-repair-policy:${catalog.connectionState.repairPolicyLabel}`);
  }
  if (catalog.connectionState.allowedStoreKeys.join('>') !== catalog.myStores.map(store => store.storeKey).join('>')) {
    errors.push('allowed-store-key-mismatch');
  }

  for (const label of [...catalog.topics, ...catalog.genres]) {
    if (!label || label.length > 48) errors.push(`invalid-store-catalog-label:${label}`);
    if (/rawAddress|recipientPhone|providerAccessToken|proofWitness|privateKey|proofSecret|sk_live_|ghp_/i.test(label)) {
      errors.push(`unsafe-store-catalog-label:${label}`);
    }
  }

  for (const store of catalog.myStores) {
    if (!/^store_ref_[a-z0-9_]+$/.test(store.storeKey)) errors.push(`invalid-my-store-key:${store.name}`);
    if (!/^[A-Z0-9]$/.test(store.logo)) errors.push(`invalid-my-store-logo:${store.name}`);
    if (!/^[A-Za-z0-9 &'().-]{1,64}$/.test(store.name)) errors.push(`invalid-my-store-name:${store.name}`);
    if (!/^[A-Za-z0-9 -]{1,32}$/.test(store.type)) errors.push(`invalid-my-store-type:${store.type}`);
    if (store.status !== 'Connected') errors.push(`invalid-my-store-status:${store.name}`);
    if (!/^#[0-9a-f]{6}$/i.test(store.color)) errors.push(`invalid-my-store-color:${store.name}`);
    if (!['Address reuse on', 'Address reuse off'].includes(store.addressReuseLabel)) {
      errors.push(`invalid-my-store-address-reuse:${store.name}`);
    }
    if (!['Address ref only', 'No wallet address reuse'].includes(store.permissionSummary)) {
      errors.push(`invalid-my-store-permission-summary:${store.name}`);
    }
    if (!['Revoke in Wallet', 'Manage access'].includes(store.revokeLabel)) {
      errors.push(`invalid-my-store-revoke-label:${store.name}`);
    }
    if (store.confirmRevokeLabel !== 'Confirm revoke') errors.push(`invalid-my-store-confirm-revoke-label:${store.name}`);
    if (store.revokedStatusLabel !== 'Revoked') errors.push(`invalid-my-store-revoked-status-label:${store.name}`);
    if (store.revokedNotice !== 'Address reuse paused') errors.push(`invalid-my-store-revoked-notice:${store.name}`);
    if (store.reconnectLabel !== 'Reconnect') errors.push(`invalid-my-store-reconnect-label:${store.name}`);
    if (store.visibleRefs.length !== 6) errors.push(`invalid-my-store-visible-ref-count:${store.name}`);
    if (store.hiddenLabels.length !== 7) errors.push(`invalid-my-store-hidden-label-count:${store.name}`);
    for (const label of [
      ...store.visibleRefs,
      ...store.hiddenLabels,
      store.revokeConfirmTitle,
      store.revokeConfirmBody,
      store.confirmRevokeLabel,
      store.revokedStatusLabel,
      store.revokedNotice,
      store.reconnectLabel,
    ]) {
      if (!/^[A-Za-z0-9 &'().,?-]{1,128}$/.test(label)) {
        errors.push(`invalid-my-store-detail-label:${store.name}`);
      }
    }
    if (/rawAddress|recipientPhone|providerAccessToken|proofWitness|privateKey|proofSecret|sk_live_|ghp_/i.test(JSON.stringify(store))) {
      errors.push(`unsafe-my-store-row:${store.name}`);
    }
    if (/raw_address|phone_number|provider_token|carrier_credentials|raw_carrier_payload|private_delivery_note|proof_secret/i.test(JSON.stringify(store))) {
      errors.push(`unsafe-my-store-boundary-row:${store.name}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function renderVeygritSitesStoreCatalogModule(
  catalog = buildVeygritSitesStoreCatalog(),
): string {
  const validation = validateVeygritSitesStoreCatalog(catalog);
  if (!validation.ok) {
    throw new Error(`invalid-veygrit-sites-store-catalog:${validation.errors.join(',')}`);
  }

  return [
    '// Generated from AGID src/lib/veygritSitesStoreCatalog.ts.',
    '// Run `npm run sync:veygrit-sites-store-catalog` from AGID to refresh.',
    '',
    'export const storeTopics = [',
    ...catalog.topics.map(label => `  '${escapeJsString(label)}',`),
    '];',
    '',
    'export const storeGenres = [',
    ...catalog.genres.map(label => `  '${escapeJsString(label)}',`),
    '];',
    '',
    'export const storeConnectionState = {',
    `  revokedStoreKeysStorageKey: '${catalog.connectionState.revokedStoreKeysStorageKey}',`,
    `  storedMaterialLabel: '${catalog.connectionState.storedMaterialLabel}',`,
    `  repairPolicyLabel: '${catalog.connectionState.repairPolicyLabel}',`,
    `  allowedStoreKeys: ${renderStringArray(catalog.connectionState.allowedStoreKeys)},`,
    '};',
    '',
    'export const storeMyStores = [',
    ...catalog.myStores.map(renderStoreObject),
    '];',
    '',
  ].join('\n');
}
