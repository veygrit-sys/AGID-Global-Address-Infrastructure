import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  VEYGRIT_SHIP_CREDENTIAL_SURFACES,
  renderVeygritShipCredentialSurfaceMatrixMarkdown,
} from './veygritShipCredentialSurfaceMatrix';

const docPath = new URL('../../docs/ops/veygrit-ship-credential-surface-matrix.md', import.meta.url);

test('Veygrit Ship credential matrix keeps Guest, Merchant, and internal surfaces separated', () => {
  assert.deepEqual(VEYGRIT_SHIP_CREDENTIAL_SURFACES.map(surface => surface.id), [
    'guest-public',
    'merchant-control-plane',
    'internal-carrier-runtime',
  ]);

  const guest = VEYGRIT_SHIP_CREDENTIAL_SURFACES.find(surface => surface.id === 'guest-public');
  assert.ok(guest);
  assert.equal(guest.credentialInput, 'none');
  assert.equal(guest.publicCredentialVisibility, 'none');
  assert.equal(guest.persistedCredentialReference, 'none');
  assert.deepEqual(guest.allowedCredentialReferenceFormats, []);
  assert.ok(guest.verificationCommands.includes('npm run verify:veygrit-ship-guest-access'));

  const merchant = VEYGRIT_SHIP_CREDENTIAL_SURFACES.find(surface => surface.id === 'merchant-control-plane');
  assert.ok(merchant);
  assert.equal(merchant.credentialInput, 'private-merchant-admin-mfa-only');
  assert.equal(merchant.publicCredentialVisibility, 'masked-status-only');
  assert.equal(merchant.persistedCredentialReference, 'merchant-row-secret-reference-only');
  assert.deepEqual(merchant.allowedCredentialReferenceFormats, [
    'secretref_*',
    'arn:aws:secretsmanager:*',
    'vault://*',
    'https://*.vault.azure.net/secrets/*',
    'projects/*/secrets/*/versions/*',
  ]);
  assert.ok(merchant.verificationCommands.includes('npm run verify:veygrit-ship-secret-management'));
  assert.ok(merchant.verificationCommands.includes('npm run verify:veygrit-ship-store'));

  const internal = VEYGRIT_SHIP_CREDENTIAL_SURFACES.find(surface => surface.id === 'internal-carrier-runtime');
  assert.ok(internal);
  assert.equal(internal.credentialInput, 'server-runtime-only');
  assert.equal(internal.publicCredentialVisibility, 'none');
  assert.ok(internal.verificationCommands.includes('npm run verify:ups-live-connector'));
  assert.ok(internal.verificationCommands.includes('npm run verify:dhl-live-connectors'));
});

test('Veygrit Ship credential matrix documentation mirrors executable contract', async () => {
  const doc = await readFile(docPath, 'utf8');
  assert.equal(doc, renderVeygritShipCredentialSurfaceMatrixMarkdown());

  for (const surface of VEYGRIT_SHIP_CREDENTIAL_SURFACES) {
    assert.match(doc, new RegExp(`\\| ${surface.id} \\|`));
    for (const command of surface.verificationCommands) assert.ok(doc.includes(command));
    for (const nonClaim of surface.nonClaims) assert.ok(doc.includes(nonClaim));
  }

  assert.doesNotMatch(doc, /production credential evidence/i);
  assert.match(doc, /not production carrier credential evidence/i);
});

test('Veygrit Ship credential matrix verification commands are wired', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8')) as {
    scripts: Record<string, string>;
  };
  for (const surface of VEYGRIT_SHIP_CREDENTIAL_SURFACES) {
    for (const command of surface.verificationCommands) {
      const scriptName = command.replace(/^npm run /, '');
      assert.ok(packageJson.scripts[scriptName], `${scriptName} must exist in package.json`);
    }
  }

  const operationsGate = await readFile(new URL('../../scripts/verify-veygrit-ship-operations.ts', import.meta.url), 'utf8');
  assert.match(operationsGate, /verify:veygrit-ship-credential-surfaces/);
});
