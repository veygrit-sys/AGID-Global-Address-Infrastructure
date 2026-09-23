import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { buildVeygritSitesBridge } from './veygritSitesBridge';
import {
  VEYGRIT_SITES_REF_FIXTURES_VERSION,
  buildVeygritSitesRefFixtures,
  renderVeygritSitesRefFixturesModule,
  validateVeygritSitesRefFixtures,
} from './veygritSitesRefFixtures';

test('Veygrit Sites ref fixture contract is ref-only and uniquely exportable', () => {
  const fixtures = buildVeygritSitesRefFixtures();
  const validation = validateVeygritSitesRefFixtures(fixtures);

  assert.equal(VEYGRIT_SITES_REF_FIXTURES_VERSION, 'veygrit-sites-ref-fixtures-v0.1');
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(fixtures.map(fixture => fixture.exportName), [
    'ADDRESS_REF_HOME_PRIMARY_DISPLAY',
    'PHONE_REF_WALLET_PRIMARY',
    'RECIPIENT_REF_CHECKOUT_FORM',
    'PROFILE_QR_REF_FILENAME',
  ]);
  assert.ok(fixtures.every(fixture => fixture.inlineScreenLiteralAllowed === false));
  assert.ok(fixtures.every(fixture => fixture.rawMaterialClass === 'blocked-by-policy'));
});

test('Veygrit Sites local fixture module exports every AGID ref fixture', () => {
  const bridge = buildVeygritSitesBridge();
  const fixturePath = join(bridge.codexThread.localRoot, 'work', 'veygrit-app', 'src', 'veygritRefFixtures.js');

  assert.equal(existsSync(fixturePath), true);

  const source = readFileSync(fixturePath, 'utf8');
  assert.equal(source, renderVeygritSitesRefFixturesModule());

  for (const fixture of buildVeygritSitesRefFixtures()) {
    assert.match(source, new RegExp(`export const ${fixture.exportName}\\s*=`));
    assert.match(source, new RegExp(fixture.refId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(source, /\b(?:address|phone|recipient):\s*['"][^'"]+/);
  assert.doesNotMatch(source, /veygrit-[a-z0-9-]+-qr\.png/i);
});
