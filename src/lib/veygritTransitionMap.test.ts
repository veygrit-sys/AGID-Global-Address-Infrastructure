import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  VEYGRIT_TRANSITION_MAP_VERSION,
  buildVeygritTransitionMap,
  validateVeygritTransitionMap,
} from './veygritTransitionMap';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

test('Veygrit transition map keeps the address wallet side menu and store submenu explicit', () => {
  const map = buildVeygritTransitionMap();
  const validation = validateVeygritTransitionMap(map);

  assert.equal(map.version, VEYGRIT_TRANSITION_MAP_VERSION);
  assert.equal(map.entryNodeId, 'home');
  assert.deepEqual(validation, { ok: true, errors: [] });
  assert.deepEqual(
    map.edges.filter(edge => edge.kind === 'side_menu').map(edge => edge.to),
    ['home', 'friends', 'store', 'my-page'],
  );
  assert.deepEqual(
    map.edges.filter(edge => edge.kind === 'store_submenu').map(edge => edge.to),
    ['topics', 'discover', 'my-stores'],
  );
});

test('Veygrit transition map separates Playlist Commerce, EC Social Login, and Delivery Gateway buttons', () => {
  const map = buildVeygritTransitionMap();
  const edgeById = new Map(map.edges.map(edge => [edge.id, edge]));

  assert.equal(edgeById.get('integration-button-playlist_commerce')?.label, 'Open Store');
  assert.equal(edgeById.get('integration-button-playlist_commerce')?.to, 'store');
  assert.equal(edgeById.get('integration-button-playlist_commerce')?.loginRequiredBeforeAction, false);

  assert.equal(edgeById.get('integration-button-ec_social_login')?.label, 'Install Vey ID');
  assert.equal(edgeById.get('integration-button-ec_social_login')?.to, 'merchant-console-vey-id');
  assert.equal(edgeById.get('integration-button-ec_social_login')?.loginRequiredBeforeAction, true);

  assert.equal(edgeById.get('integration-button-delivery_gateway')?.label, 'Configure gateway');
  assert.equal(edgeById.get('integration-button-delivery_gateway')?.to, 'merchant-console-delivery-gateway');
  assert.equal(edgeById.get('integration-button-delivery_gateway')?.loginRequiredBeforeAction, true);
});

test('Veygrit transition map keeps QR and commerce actions reference-only', () => {
  const map = buildVeygritTransitionMap();
  const qrEdges = map.edges.filter(edge => edge.kind === 'safe_qr_action');
  const serialized = JSON.stringify(map);

  assert.deepEqual(qrEdges.map(edge => edge.to), ['store-counter', 'ec-login', 'parcel-receipt', 'address-share']);
  assert.ok(map.edges.every(edge => edge.merchantVisibleOnlyRefs));
  assert.ok(map.blockedTransitions.includes('qr_address_share_to_raw_address_export'));
  assert.ok(map.blockedTransitions.includes('friend_selection_to_friend_address_view'));
  assert.doesNotMatch(serialized, /addressText/);
  assert.doesNotMatch(serialized, /recipientPhone/);
  assert.doesNotMatch(serialized, /providerAccessToken/);
  assert.doesNotMatch(serialized, /proofWitness/);
  assert.doesNotMatch(serialized, /privateKey/);
});

test('Veygrit transition map has a package verification script and product doc gate', () => {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const doc = readFileSync(join(root, 'docs', 'product', 'veygrit-transition-map.md'), 'utf8');

  assert.equal(
    packageJson.scripts?.['verify:veygrit-transition-map'],
    'tsx --test src/lib/veygritTransitionMap.test.ts',
  );
  assert.match(packageJson.scripts?.['verify:veygrit-app'] ?? '', /src\/lib\/veygritTransitionMap\.test\.ts/);
  assert.match(doc, /# Veygrit Screen Transition Map/);
  assert.match(doc, /npm run verify:veygrit-transition-map/);
  assert.match(doc, /npm run verify:veygrit-app/);
  assert.match(doc, /Playlist Commerce must not become EC Social Login without user action/);
});
