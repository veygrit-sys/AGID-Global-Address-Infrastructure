import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { validatePlaylistCommerceSpec } from './playlistCommerceSpec';
import { validateVeygritIdAddressLoginPlan } from './veygritIdAddressLoginPlan';
import {
  buildVeyEcosystemResearch,
  validateVeyEcosystemResearch,
  VEY_ECOSYSTEM_PRODUCTS,
} from './veyEcosystemResearch';

test('Vey ecosystem research validates as an executable product map', () => {
  const research = buildVeyEcosystemResearch();

  assert.deepEqual(validateVeyEcosystemResearch(research), []);
  assert.equal(research.version, 'vey-ecosystem-research-v0.1');
  assert.ok(research.products.length >= 12);
  assert.ok(research.apiSurfaces.length >= 6);
  assert.ok(research.journeys.length >= 4);
  assert.ok(research.buildUnits.length >= 5);
});

test('Vey ecosystem keeps Wallet, Address Login, Playlist Commerce, delivery, trade, and finance connected', () => {
  const productIds = new Set(VEY_ECOSYSTEM_PRODUCTS.map(product => product.id));

  for (const required of [
    'identity-wallet',
    'address-login',
    'playlist-commerce',
    'delivery-gateway',
    'carrier-api-stripe',
    'vey-workspace',
    'vey-trading',
    'vey-finance',
    'evidence-vault',
    'managed-zk-proof-generation',
  ]) {
    assert.ok(productIds.has(required as never), `${required} should be modeled`);
  }

  const playlist = VEY_ECOSYSTEM_PRODUCTS.find(product => product.id === 'playlist-commerce');
  assert.ok(playlist?.dependsOn.includes('identity-wallet'));
  assert.ok(playlist?.dependsOn.includes('delivery-gateway'));
});

test('developer and EC adoption surfaces include Clerk-like SDK, CMS plugin, carrier API Stripe, and wallet QR/pass', () => {
  const research = buildVeyEcosystemResearch();
  const surfaces = new Map(research.apiSurfaces.map(surface => [surface.id, surface]));

  assert.equal(surfaces.get('address-login-drop-in')?.integrationMode, 'drop-in-sdk');
  assert.equal(surfaces.get('carrier-routing-api')?.owner, 'carrier-api-stripe');
  assert.equal(surfaces.get('cms-commerce-plugins')?.integrationMode, 'cms-plugin');
  assert.equal(surfaces.get('wallet-delivery-pass')?.integrationMode, 'wallet-pass');
  assert.match(surfaces.get('carrier-routing-api')?.purpose ?? '', /fastest\/cheapest/);
});

test('consumer journey supports cross-carrier ordering with fastest or cheapest choice', () => {
  const research = buildVeyEcosystemResearch();
  const journey = research.journeys.find(item => item.id === 'consumer-super-app-delivery');

  assert.ok(journey);
  assert.ok(journey.products.includes('identity-wallet'));
  assert.ok(journey.products.includes('carrier-api-stripe'));
  assert.match(journey.steps.join(' '), /fastest or cheapest/);
  assert.match(journey.riskGate, /wallet consent/);
});

test('OSS and commercial boundaries are explicit and preserve existing product gates', () => {
  const research = buildVeyEcosystemResearch();

  assert.equal(validateVeygritIdAddressLoginPlan().length, 0);
  assert.equal(validatePlaylistCommerceSpec().length, 0);
  assert.ok(research.buildUnits.some(unit => unit.boundary === 'oss'));
  assert.ok(research.buildUnits.some(unit => unit.boundary === 'commercial'));
  assert.ok(research.nonClaims.some(nonClaim => /does not replace general authentication/.test(nonClaim)));
  assert.ok(research.products.every(product => product.blockedData.length > 0));
});

test('Vey ecosystem strategy document reflects the executable research map', () => {
  const doc = readFileSync('docs/product/vey-ecosystem-strategy.md', 'utf8');

  assert.match(doc, /Vey Ecosystem Strategy/);
  assert.match(doc, /Carrier API Stripe/);
  assert.match(doc, /fastest or cheapest/);
  assert.match(doc, /CMS plugins/);
  assert.match(doc, /Apple\/Google wallet/);
  assert.match(doc, /Commercial modules must not weaken OSS privacy/);
  assert.match(doc, /verify:vey-ecosystem/);
});

test('Vey ecosystem workflow guard is present and wired to package scripts', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const workflow = readFileSync('.github/workflows/vey-ecosystem.yml', 'utf8');

  assert.equal(existsSync('scripts/verify-vey-ecosystem-workflow.ts'), true);
  assert.equal(packageJson.scripts?.['verify:vey-ecosystem-workflow'], 'tsx scripts/verify-vey-ecosystem-workflow.ts');
  assert.match(workflow, /npm run verify:vey-ecosystem/);
  assert.match(workflow, /npm run verify:vey-ecosystem-workflow/);
});
