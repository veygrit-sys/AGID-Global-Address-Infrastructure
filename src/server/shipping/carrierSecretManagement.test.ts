import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  CarrierSecretAuthorizationError,
  CarrierSecretManagementService,
  CarrierSecretOperationError,
  requireFreshAdminMfa,
  validateProviderSecretReference,
  validateProviderVersionReference,
  type AdminMfaContext,
  type CarrierCredentialMetadataStore,
  type CarrierSecretVault,
} from './carrierSecretManagement';
import { credentialBytesEndingWith } from './testCredentialFixtures';

const admin: AdminMfaContext = {
  actorRef: 'admin_merchant_1',
  merchantRef: 'merchant_1',
  sessionRef: 'mfa_session_value_must_be_hashed',
  roles: ['admin'],
  authenticationMethods: ['pwd', 'webauthn'],
  mfaVerifiedAt: '2030-01-01T00:00:00.000Z',
};

class MemoryMetadataStore implements CarrierCredentialMetadataStore {
  success?: Parameters<CarrierCredentialMetadataStore['recordSuccess']>[0];
  failure?: Parameters<CarrierCredentialMetadataStore['recordFailure']>[0];

  async recordSuccess(input: Parameters<CarrierCredentialMetadataStore['recordSuccess']>[0]) {
    this.success = input;
    return {
      connectionRef: input.connectionRef,
      provider: input.provider,
      displayLast4: input.displayLast4,
      rotatedAt: input.requestedAt,
      nextRotationAt: input.nextRotationAt,
    };
  }

  async recordFailure(input: Parameters<CarrierCredentialMetadataStore['recordFailure']>[0]) {
    this.failure = input;
  }
}

test('provider references are accepted while inline credential bodies are rejected', () => {
  assert.equal(validateProviderSecretReference('aws-secrets-manager', 'arn:aws:secretsmanager:us-east-1:123456789012:secret:veygrit/ups-AbCd'), 'arn:aws:secretsmanager:us-east-1:123456789012:secret:veygrit/ups-AbCd');
  assert.equal(validateProviderSecretReference('gcp-secret-manager', 'projects/veygrit-prod/secrets/dhl/versions/latest'), 'projects/veygrit-prod/secrets/dhl/versions/latest');
  assert.equal(validateProviderSecretReference('azure-key-vault', 'https://veygrit.vault.azure.net/secrets/ups'), 'https://veygrit.vault.azure.net/secrets/ups');
  assert.equal(validateProviderVersionReference('gcp-secret-manager', 'projects/veygrit-prod/secrets/dhl/versions/7'), 'projects/veygrit-prod/secrets/dhl/versions/7');
  assert.throws(() => validateProviderSecretReference('external', 'credential=value'), /not valid/);
  assert.throws(() => validateProviderVersionReference('aws-secrets-manager', 'credential=value'), /not valid/);
});

test('credential management requires a fresh administrator MFA context', () => {
  const verified = requireFreshAdminMfa(admin, Date.parse('2030-01-01T00:05:00Z'));
  assert.equal(verified.method, 'webauthn');
  assert.match(verified.sessionRefHash, /^[a-f0-9]{64}$/);
  assert.notEqual(verified.sessionRefHash, admin.sessionRef);
  assert.throws(
    () => requireFreshAdminMfa({ ...admin, roles: ['member'] }, Date.parse('2030-01-01T00:05:00Z')),
    (error: unknown) => error instanceof CarrierSecretAuthorizationError && error.code === 'admin_role_required',
  );
  assert.throws(
    () => requireFreshAdminMfa({ ...admin, authenticationMethods: ['pwd'] }, Date.parse('2030-01-01T00:05:00Z')),
    (error: unknown) => error instanceof CarrierSecretAuthorizationError && error.code === 'mfa_required',
  );
  assert.throws(
    () => requireFreshAdminMfa(admin, Date.parse('2030-01-01T00:11:00Z')),
    (error: unknown) => error instanceof CarrierSecretAuthorizationError && error.code === 'fresh_mfa_required',
  );
});

test('backend service writes the vault first and persists only refs, last4, MFA hash, and audit metadata', async () => {
  let vaultBuffer: Uint8Array | undefined;
  const vault: CarrierSecretVault = {
    async writeSecret(input) {
      vaultBuffer = input.secretValue;
      return {
        secretRef: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:veygrit/ups-AbCd',
        versionRef: 'version_12345678',
      };
    },
  };
  const store = new MemoryMetadataStore();
  const service = new CarrierSecretManagementService(vault, store, {
    now: () => Date.parse('2030-01-01T00:05:00Z'), defaultRotationDays: 30,
  });
  const credentialFixture = credentialBytesEndingWith('AB12');
  const result = await service.saveCredentials({
    admin, connectionRef: 'connection_ups_1', provider: 'aws-secrets-manager', secretValue: credentialFixture,
  });
  assert.deepEqual(result, {
    connectionRef: 'connection_ups_1', provider: 'aws-secrets-manager', maskedValue: '••••AB12',
    rotatedAt: '2030-01-01T00:05:00.000Z', nextRotationAt: '2030-01-31T00:05:00.000Z',
  });
  assert.ok(vaultBuffer && [...vaultBuffer].every(value => value === 0));
  assert.ok(store.success);
  assert.equal(store.success.displayLast4, 'AB12');
  assert.notEqual(store.success.mfaSessionRefHash, admin.sessionRef);
  assert.doesNotMatch(JSON.stringify(store.success), /secretValue/);
  assert.equal('secretValue' in store.success, false);
});

test('vault failures create a redacted failure audit record', async () => {
  const vault: CarrierSecretVault = { async writeSecret() { throw new Error('provider rejected request containing sensitive detail'); } };
  const store = new MemoryMetadataStore();
  const service = new CarrierSecretManagementService(vault, store, { now: () => Date.parse('2030-01-01T00:05:00Z') });
  await assert.rejects(service.rotateCredentials({
    admin, connectionRef: 'connection_dhl_1', provider: 'external',
    currentSecretRef: 'secretref_dhl_current_001', secretValue: credentialBytesEndingWith('ZX90'),
  }), (error: unknown) => error instanceof CarrierSecretOperationError && error.code === 'vault_error');
  assert.ok(store.failure);
  assert.equal(store.failure.failureCode, 'vault_error');
  assert.doesNotMatch(JSON.stringify(store.failure), /sensitive detail|secretValue/);
});

test('migration stores no secret body, keeps rotation append-only, and denies the Guest DB role', async () => {
  const sql = await readFile(new URL('../../../db/veygrit-ship-secret-management.postgres.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS veygrit_ship_credential_rotation/i);
  assert.match(sql, /credential_display_last4 char\(4\)/i);
  assert.match(sql, /credential_version_ref varchar/i);
  assert.match(sql, /append-only/i);
  assert.match(sql, /REVOKE ALL ON veygrit_ship_credential_rotation FROM veygrit_ship_guest/i);
  assert.doesNotMatch(sql, /secret_(value|body|payload)\s+(text|varchar|jsonb|bytea)/i);
});
