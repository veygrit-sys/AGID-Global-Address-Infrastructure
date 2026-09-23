import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildHexashipBrandTransition,
  HEXASHIP_BRAND_TRANSITION_PHASES,
  validateHexashipBrandTransition,
} from './hexashipBrandTransition';

test('Hexaship brand transition validates as a non-breaking Skipship migration plan', () => {
  const plan = buildHexashipBrandTransition();

  assert.deepEqual(validateHexashipBrandTransition(plan), []);
  assert.equal(plan.primaryBrand, 'Hexaship');
  assert.equal(plan.legacyBrand, 'Skipship');
  assert.equal(plan.packageNameTarget, '@hexaship/js');
  assert.equal(plan.packageNameLegacy, '@skipship/js');
  assert.match(plan.tagline, /carrier-agnostic shipping infrastructure/);
  assert.ok(plan.phases.find(phase => phase.id === 'sdk-alias')?.verification.includes('verify:hexaship-js'));
});

test('Hexaship migration keeps existing routes, headers, and exports compatible first', () => {
  const plan = buildHexashipBrandTransition();

  assert.equal(plan.namingPolicy.codeAliasPolicy, 'keep-skipship-exports-until-v1');
  assert.equal(plan.namingPolicy.headerPolicy, 'keep-skipship-headers-until-openapi-v1');
  assert.equal(plan.namingPolicy.routePolicy, 'do-not-change-v1-routes-during-brand-migration');
  assert.ok(HEXASHIP_BRAND_TRANSITION_PHASES.slice(0, 4).every(phase => phase.nonBreaking));
  assert.equal(HEXASHIP_BRAND_TRANSITION_PHASES.at(-1)?.nonBreaking, false);
});

test('Hexaship migration blocks unsafe brand claims and private material in fixtures', () => {
  const plan = buildHexashipBrandTransition();
  const text = JSON.stringify(plan);

  assert.ok(plan.blockedMoves.some(move => /trademark clearance/i.test(move)));
  assert.ok(plan.blockedMoves.some(move => /production credentials, raw addresses, recipient contacts, proof witnesses, or carrier secrets/i.test(move)));
  assert.ok(plan.nonClaims.some(nonClaim => /not a trademark clearance result/i.test(nonClaim)));
  assert.ok(plan.nonClaims.some(nonClaim => /does not imply carrier partnerships/i.test(nonClaim)));
  assert.doesNotMatch(text, /rawAddressValue|recipient_phone_value|carrier_secret_value|proof_witness_value|private_key_value|productionCredentialValue/);
});

test('Hexaship brand transition doc and strategy gate are wired', () => {
  const doc = readFileSync('docs/product/hexaship-brand-transition.md', 'utf8');
  const aliasReadme = readFileSync('sdk/hexaship-js/README.md', 'utf8');
  const legacyReadme = readFileSync('sdk/skipship-js/README.md', 'utf8');
  const aliasFixture = readFileSync('sdk/hexaship-js/fixtures/hexaship-alias-migration-v0.1.json', 'utf8');
  const migrationVerifier = readFileSync('scripts/verify-hexaship-migration.ts', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /Hexaship is the proposed primary brand/);
  assert.match(doc, /Skipship remains the legacy developer alias/);
  assert.match(doc, /Keep `@skipship\/js` exports available while introducing `@hexaship\/js`/);
  assert.match(doc, /Do not rename `skipship-idempotency-key`/);
  assert.match(doc, /not a trademark clearance result/);
  assert.match(doc, /sdk\/hexaship-js\/fixtures\/hexaship-alias-migration-v0\.1\.json/);
  assert.match(doc, /npm run verify:hexaship-js/);
  assert.match(doc, /npm run verify:hexaship-package/);
  assert.match(doc, /npm run verify:hexaship-migration/);
  assert.match(doc, /npx tsc --noEmit -p sdk\/hexaship-js\/tsconfig\.json/);
  assert.match(doc, /createSkipshipClient\(options\)/);
  assert.match(doc, /createHexashipClient\(options\)/);
  assert.match(doc, /`addressFormVersion` uses the `wallet_country_form_ref_\.\.\.`/);
  assert.match(doc, /raw address\s+text, recipient\s+contact material, carrier credentials/i);
  assert.match(aliasReadme, /addressFormVersion: "wallet_country_form_ref_synthetic_001"/);
  assert.match(legacyReadme, /addressFormVersion: "wallet_country_form_ref_synthetic_001"/);
  assert.doesNotMatch(legacyReadme, /rawAddress:|carrierApiKey:|proofWitness:|privateKey:|proofSecret:/);
  assert.match(aliasReadme, /createHexashipClient/);
  assert.match(aliasReadme, /aliases `createSkipshipClient`/);
  assert.match(aliasReadme, /hexaship-alias-migration-v0\.1\.json/);
  assert.match(aliasReadme, /installs the generated tarball into a temporary local consumer project/);
  assert.match(aliasReadme, /import \{ createHexashipClient \} from "@hexaship\/js"/);
  assert.match(aliasReadme, /TypeScript consumer smoke test/);
  assert.match(aliasReadme, /HexashipShipmentCreateRequest/);
  assert.match(aliasReadme, /@hexaship\/js\/fixtures\/hexaship-alias-migration-v0\.1\.json/);
  assert.match(aliasReadme, /redacted fixture JSON export/);
  assert.match(aliasReadme, /primary README TypeScript sample is extracted/);
  assert.match(aliasReadme, /migration example is also\s+typechecked/);
  assert.match(aliasReadme, /verified:primary/);
  assert.match(aliasReadme, /verified:migration/);
  assert.match(aliasReadme, /example:\*/);
  assert.match(aliasFixture, /"packageName": "@hexaship\/js"/);
  assert.match(aliasFixture, /"packageName": "@skipship\/js"/);
  assert.match(aliasFixture, /"skipship-idempotency-key"/);
  assert.match(aliasReadme, /npm run verify:hexaship-js/);
  assert.match(aliasReadme, /npm run verify:hexaship-package/);
  assert.match(packageJson.scripts?.['verify:hexaship-js'] ?? '', /sdk\/hexaship-js\/test\/sdk\.test\.ts/);
  assert.equal(packageJson.scripts?.['verify:hexaship-package'], 'tsx scripts/verify-hexaship-package.ts');
  assert.equal(packageJson.scripts?.['verify:hexaship-migration'], 'tsx scripts/verify-hexaship-migration.ts');
  assert.match(migrationVerifier, /verify:hexaship-js/);
  assert.match(migrationVerifier, /verify:hexaship-package/);
  assert.match(migrationVerifier, /verify:skipship-js/);
  assert.match(migrationVerifier, /verify:skipship-strategy/);
  assert.match(migrationVerifier, /verify:delivery-gateway-carrier-api/);
  assert.match(packageJson.scripts?.['verify:skipship-strategy'] ?? '', /hexashipBrandTransition\.test\.ts/);
});
