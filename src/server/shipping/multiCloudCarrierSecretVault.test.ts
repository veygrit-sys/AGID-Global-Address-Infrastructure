import assert from 'node:assert/strict';
import test from 'node:test';

import { MultiCloudCarrierSecretVault, createMultiCloudCarrierSecretVaultFromEnv } from './multiCloudCarrierSecretVault';
import { credentialBytesEndingWith } from './testCredentialFixtures';

test('cloud SDK adapters import under pinned dependency overrides without contacting providers', async () => {
  const [
    awsSecretsManager,
    gcpSecretManager,
    azureKeyVault,
  ] = await Promise.all([
    import('@aws-sdk/client-secrets-manager'),
    import('@google-cloud/secret-manager'),
    import('@azure/keyvault-secrets'),
  ]);
  const vault = createMultiCloudCarrierSecretVaultFromEnv({
    AWS_REGION: 'us-east-1',
    VEYGRIT_SHIP_AWS_SECRET_PREFIX: 'veygrit-ship/local-only',
    VEYGRIT_SHIP_GCP_SECRET_PROJECT: 'veygrit-local',
    VEYGRIT_SHIP_GCP_SECRET_PREFIX: 'veygrit-ship-local',
    VEYGRIT_SHIP_AZURE_KEY_VAULT_URL: 'https://local-only.vault.azure.net',
    VEYGRIT_SHIP_AZURE_SECRET_PREFIX: 'veygrit-ship-local',
  });

  assert.equal(typeof awsSecretsManager.SecretsManagerClient, 'function');
  assert.equal(typeof gcpSecretManager.SecretManagerServiceClient, 'function');
  assert.equal(typeof azureKeyVault.SecretClient, 'function');
  assert.ok(vault instanceof MultiCloudCarrierSecretVault);
  await assert.rejects(
    vault.writeSecret({
      provider: 'external',
      connectionRef: 'connection_local_only',
      secretValue: credentialBytesEndingWith('ABCD'),
    }),
    /requires an injected private-backend adapter/,
  );
});

test('AWS adapter creates a secret and adds versions without returning values', async () => {
  const commands: string[] = [];
  const awsClient = {
    async send(command: any) {
      commands.push(command.constructor.name);
      return { ARN: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:veygrit/ups-AbCd', VersionId: 'version_12345678' };
    },
  };
  const vault = new MultiCloudCarrierSecretVault({ awsClient });
  const created = await vault.writeSecret({ provider: 'aws-secrets-manager', connectionRef: 'ups_1', secretValue: credentialBytesEndingWith('AB12') });
  const rotated = await vault.writeSecret({ provider: 'aws-secrets-manager', connectionRef: 'ups_1', currentSecretRef: created.secretRef, secretValue: credentialBytesEndingWith('CD34') });
  assert.deepEqual(commands, ['CreateSecretCommand', 'PutSecretValueCommand']);
  assert.deepEqual(rotated, created);
  assert.doesNotMatch(JSON.stringify(rotated), /AB12|CD34/);
});

test('GCP adapter creates a Secret and stores only the returned version resource name', async () => {
  const calls: string[] = [];
  const gcpClient = {
    async createSecret() { calls.push('create'); return [{ name: 'projects/veygrit-prod/secrets/veygrit-ship-dhl-1' }] as [{ name: string }]; },
    async addSecretVersion() { calls.push('version'); return [{ name: 'projects/veygrit-prod/secrets/veygrit-ship-dhl-1/versions/7' }] as [{ name: string }]; },
  };
  const vault = new MultiCloudCarrierSecretVault({ gcpProject: 'veygrit-prod', gcpClient });
  const result = await vault.writeSecret({ provider: 'gcp-secret-manager', connectionRef: 'dhl_1', secretValue: credentialBytesEndingWith('EF56') });
  assert.deepEqual(calls, ['create', 'version']);
  assert.deepEqual(result, {
    secretRef: 'projects/veygrit-prod/secrets/veygrit-ship-dhl-1/versions/7',
    versionRef: 'projects/veygrit-prod/secrets/veygrit-ship-dhl-1/versions/7',
  });
});

test('Azure adapter creates a Key Vault version and exposes identifiers only', async () => {
  const writes: Array<{ name: string; value: string }> = [];
  const azureClient = {
    async setSecret(name: string, value: string) {
      writes.push({ name, value });
      return { id: `https://veygrit.vault.azure.net/secrets/${name}/azureVersion123` };
    },
  };
  const vault = new MultiCloudCarrierSecretVault({ azureVaultUrl: 'https://veygrit.vault.azure.net', azureClient });
  const credentialFixture = credentialBytesEndingWith('GH78');
  const result = await vault.writeSecret({ provider: 'azure-key-vault', connectionRef: 'ups_1', secretValue: credentialFixture });
  assert.equal(writes[0].name, 'veygrit-ship-ups-1');
  assert.equal(writes[0].value, Buffer.from(credentialFixture).toString('base64'));
  assert.deepEqual(result, {
    secretRef: 'https://veygrit.vault.azure.net/secrets/veygrit-ship-ups-1/azureVersion123',
    versionRef: 'https://veygrit.vault.azure.net/secrets/veygrit-ship-ups-1/azureVersion123',
  });
  assert.doesNotMatch(JSON.stringify(result), /GH78/);
});
