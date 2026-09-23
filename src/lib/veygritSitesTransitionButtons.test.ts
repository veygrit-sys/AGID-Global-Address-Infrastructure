import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { buildVeygritAppModel } from './veygritApp';
import { buildVeygritSitesBridge } from './veygritSitesBridge';
import {
  VEYGRIT_SITES_TRANSITION_BUTTONS_VERSION,
  buildVeygritSitesTransitionButtons,
  renderVeygritSitesTransitionButtonsModule,
  validateVeygritSitesTransitionButtons,
} from './veygritSitesTransitionButtons';

test('Veygrit Sites transition buttons are generated from primary transition edges', () => {
  const buttons = buildVeygritSitesTransitionButtons();
  const integrationsById = new Map(buildVeygritAppModel().integrations.map(integration => [integration.id, integration]));
  const validation = validateVeygritSitesTransitionButtons(buttons);

  assert.equal(VEYGRIT_SITES_TRANSITION_BUTTONS_VERSION, 'veygrit-sites-transition-buttons-v0.1');
  assert.deepEqual(validation, { ok: true, errors: [] });
  assert.deepEqual(buttons.map(button => button.id), [
    'playlist_commerce',
    'ec_social_login',
    'delivery_gateway',
  ]);
  assert.deepEqual(buttons.map(button => button.href), [
    '/veygrit#store',
    '/merchant-console#vey-id',
    '/merchant-console#delivery-gateway',
  ]);
  for (const button of buttons) {
    const integration = integrationsById.get(button.id as 'playlist_commerce' | 'ec_social_login' | 'delivery_gateway');
    assert.equal(button.eyebrow, integration?.label);
    assert.equal(button.description, integration?.commerceEntryDescription);
    assert.equal(button.icon, integration?.commerceEntryIcon);
  }
});

test('Veygrit Sites local transition button module matches the AGID generator', () => {
  const bridge = buildVeygritSitesBridge();
  const targetPath = join(bridge.codexThread.localRoot, 'work', 'veygrit-app', 'src', 'veygritTransitionButtons.js');

  assert.equal(existsSync(targetPath), true);

  const source = readFileSync(targetPath, 'utf8');
  assert.equal(source, renderVeygritSitesTransitionButtonsModule());
  assert.doesNotMatch(source, /rawAddress|recipientPhone|providerAccessToken|proofWitness|privateKey|proofSecret/i);
  assert.doesNotMatch(source, /sk_live_|ghp_[A-Za-z0-9_]+|github_pat_/);
});
