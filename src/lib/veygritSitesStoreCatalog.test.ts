import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { buildVeygritSitesBridge } from './veygritSitesBridge';
import {
  VEYGRIT_SITES_STORE_CATALOG_VERSION,
  buildVeygritSitesStoreCatalog,
  renderVeygritSitesStoreCatalogModule,
  validateVeygritSitesStoreCatalog,
} from './veygritSitesStoreCatalog';

test('Veygrit Sites store catalog is generated from AGID Store topics, 32 Discover genres, and My Stores', () => {
  const catalog = buildVeygritSitesStoreCatalog();
  const validation = validateVeygritSitesStoreCatalog(catalog);

  assert.equal(VEYGRIT_SITES_STORE_CATALOG_VERSION, 'veygrit-sites-store-catalog-v0.7');
  assert.deepEqual(validation, { ok: true, errors: [] });
  assert.deepEqual(catalog.topics, ['New', 'Popular', 'Campaign', 'Nearby', "Editor's Picks"]);
  assert.equal(catalog.genres.length, 32);
  assert.ok(catalog.genres.includes('Fashion'));
  assert.ok(catalog.genres.includes('International Shipping'));
  assert.deepEqual(catalog.myStores.map(store => store.name), [
    'Northline Supply',
    'Everyday Market',
    'Direct Lab',
  ]);
  assert.ok(catalog.myStores.every(store => store.status === 'Connected'));
  assert.ok(catalog.myStores.every(store => /^[A-Z0-9]$/.test(store.logo)));
  assert.ok(catalog.myStores.every(store => store.addressReuseLabel === 'Address reuse on'));
  assert.ok(catalog.myStores.every(store => store.permissionSummary === 'Address ref only'));
  assert.ok(catalog.myStores.every(store => store.revokeLabel === 'Revoke in Wallet'));
  assert.ok(catalog.myStores.every(store => store.visibleRefs.includes('Connection ref')));
  assert.ok(catalog.myStores.every(store => store.hiddenLabels.includes('Address body hidden')));
  assert.ok(catalog.myStores.every(store => /Future address reuse/.test(store.revokeConfirmBody)));
  assert.ok(catalog.myStores.every(store => store.confirmRevokeLabel === 'Confirm revoke'));
  assert.ok(catalog.myStores.every(store => store.revokedStatusLabel === 'Revoked'));
  assert.ok(catalog.myStores.every(store => store.revokedNotice === 'Address reuse paused'));
  assert.ok(catalog.myStores.every(store => store.reconnectLabel === 'Reconnect'));
  assert.ok(catalog.myStores.every(store => /^store_ref_/.test(store.storeKey)));
  assert.deepEqual(catalog.connectionState, {
    revokedStoreKeysStorageKey: 'veygrit.dev.revoked-store-keys',
    storedMaterialLabel: 'Store refs only',
    repairPolicyLabel: 'Ignore unknown store refs',
    allowedStoreKeys: ['store_ref_shopify_demo', 'store_ref_woocommerce_demo', 'store_ref_custom_demo'],
  });
});

test('Veygrit Sites local store catalog module matches the AGID generator', () => {
  const bridge = buildVeygritSitesBridge();
  const targetPath = join(bridge.codexThread.localRoot, 'work', 'veygrit-app', 'src', 'veygritStoreCatalog.js');

  assert.equal(existsSync(targetPath), true);

  const source = readFileSync(targetPath, 'utf8');
  assert.equal(source, renderVeygritSitesStoreCatalogModule());
  assert.match(source, /export const storeConnectionState/);
  assert.match(source, /allowedStoreKeys/);
  assert.doesNotMatch(source, /rawAddress|recipientPhone|providerAccessToken|proofWitness|privateKey|proofSecret/i);
  assert.doesNotMatch(source, /raw_address|phone_number|provider_token|carrier_credentials|raw_carrier_payload|private_delivery_note|proof_secret/i);
  assert.doesNotMatch(source, /sk_live_|ghp_[A-Za-z0-9_]+|github_pat_/);
});
