import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildVeygritAppModel, validateVeygritAppModel } from '../lib/veygritApp';
import { buildVeygritTransitionMap, validateVeygritTransitionMap } from '../lib/veygritTransitionMap';
import { VeygritAppScreen } from './VeygritAppScreen';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'VeygritAppScreen.tsx'), 'utf8');
const rootSource = readFileSync(join(here, '..', 'RootApp.tsx'), 'utf8');
const navigationSource = readFileSync(join(here, '..', 'lib', 'appNavigation.ts'), 'utf8');

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('Veygrit screen exposes the address wallet OS structure', () => {
  const html = renderToStaticMarkup(React.createElement(VeygritAppScreen));

  assert.match(source, /Veygrit Address Wallet/);
  assert.match(source, /Address Wallet OS/);
  assert.match(html, /Home/);
  assert.match(html, /Friends/);
  assert.match(html, /Store/);
  assert.match(html, /Topics/);
  assert.match(html, /Discover/);
  assert.match(html, /My Stores/);
  assert.match(html, /My Page/);
  assert.match(html, /My Address/);
  assert.match(html, /Spare Address/);
  assert.match(html, /Recent Deliveries/);
  assert.match(html, /Recent Stores/);
});

test('Veygrit screen wires identity, guest commerce, wallet revoke, and carrier boundaries', () => {
  const model = buildVeygritAppModel();
  const transitionMap = buildVeygritTransitionMap();
  const transitionValidation = validateVeygritTransitionMap(transitionMap);
  const nodesById = new Map(transitionMap.nodes.map(node => [node.id, node]));
  const html = renderToStaticMarkup(React.createElement(VeygritAppScreen));

  assert.deepEqual(transitionValidation, { ok: true, errors: [] });
  assert.match(source, /buildVeygritAppModel/);
  assert.match(source, /validateVeygritAppModel/);
  assert.match(html, /Google/);
  assert.match(html, /Apple/);
  assert.match(html, /Password signup/);
  assert.match(html, /Disabled/);
  assert.match(html, /Vey ID/);
  assert.match(html, /P\/O\/BOX supported/);
  assert.match(html, /wallet_side_revoke/);
  assert.match(html, /Commerce entry points/);
  assert.match(html, /Guest browse/);
  assert.match(html, /Checkout login/);
  assert.match(html, /Guest checkout/);
  for (const edge of transitionMap.edges.filter(edge => edge.kind === 'primary_button')) {
    const destination = nodesById.get(edge.to);
    assert.ok(destination, `missing destination node for ${edge.id}`);
    assert.match(html, new RegExp(escapeRegExp(edge.label)));
    assert.match(html, new RegExp(`href="${escapeRegExp(destination.routeRef)}"`));
  }
  assert.match(html, /guestCheckoutRef/);
  assert.match(html, /walletConsentRef/);
  assert.match(html, /carrierHandoffRef/);
  assert.match(html, /Merchant-visible redaction/);
  assert.match(html, /merchant-visible-redaction/);
  assert.match(html, /create-guest-order-from-refs/);
  assert.match(html, /pairwiseSubjectAlias/);
  assert.match(html, /guestCheckoutAlias/);
  assert.match(html, /visible refs/);
  assert.match(html, /blocked classes/);
  assert.match(html, /Guest blocked/);
  assert.match(html, /persist_raw_address/);
  assert.match(html, /receive_provider_token/);
  assert.match(html, /Hidden material/);
  assert.ok(model.store.myStores.every(store => store.disconnectAction === 'wallet_side_revoke'));
  assert.equal(model.addressEntry.carrierLabelConversion, 'ups_dhl_server_side_at_label_creation');
});

test('Veygrit route is registered in RootApp and app navigation', () => {
  assert.match(rootSource, /VeygritAppScreen/);
  assert.match(rootSource, /isVeygritRoute/);
  assert.match(rootSource, /route\.veygrit/);
  assert.match(navigationSource, /id: 'veygrit-wallet'/);
  assert.match(navigationSource, /route: '\/veygrit'/);
  assert.match(navigationSource, /Veygrit Address Wallet/);
  assert.match(navigationSource, /Address Wallet OS/);
});

test('Veygrit SSR uses refs and does not render raw recipient material', () => {
  const model = buildVeygritAppModel();
  const errors = validateVeygritAppModel(model);
  const html = renderToStaticMarkup(React.createElement(VeygritAppScreen));

  assert.deepEqual(errors, []);
  assert.match(html, /Veygrit Address Wallet/);
  assert.match(html, /addr_ref_home_primary/);
  assert.match(html, /track_alias_blue/);
  assert.match(html, /32 genres/);
  assert.match(html, /wallet_side_revoke/);
  assert.match(html, /guestCheckoutRef/);
  assert.match(html, /Merchant-visible redaction/);
  assert.match(html, /consent-bound/);
  assert.doesNotMatch(html, /rawAddress/);
  assert.doesNotMatch(html, /recipientPhone/);
  assert.doesNotMatch(html, /providerAccessToken/);
  assert.doesNotMatch(html, /privateKey/);
  assert.doesNotMatch(html, /proofWitness/);
});
