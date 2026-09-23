import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { CreateSecretCommand, PutSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

import type { CarrierSecretProvider, CarrierSecretVault, SecretWriteResult } from './carrierSecretManagement';

type AwsSecretsClient = { send(command: CreateSecretCommand | PutSecretValueCommand): Promise<Record<string, any>> };
type GcpSecretsClient = {
  createSecret(request: Record<string, any>): Promise<[Record<string, any>]>;
  addSecretVersion(request: Record<string, any>): Promise<[Record<string, any>]>;
};
type AzureSecretsClient = { setSecret(name: string, value: string, options?: Record<string, any>): Promise<Record<string, any>> };

function connectionSecretName(connectionRef: string): string {
  const normalized = connectionRef.normalize('NFKC').trim().replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 100);
  if (!normalized) throw new TypeError('connectionRef is invalid.');
  return normalized;
}

function required(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} was not returned by the Secret Manager.`);
  return value.trim();
}

function gcpSecretParent(ref: string): string {
  const match = /^(projects\/[A-Za-z0-9._-]+\/secrets\/[A-Za-z0-9._-]+)(?:\/versions\/[A-Za-z0-9._-]+)?$/.exec(ref);
  if (!match) throw new TypeError('currentSecretRef is not a GCP Secret Manager resource name.');
  return match[1];
}

function azureSecretName(ref: string): string {
  const match = /^https:\/\/[A-Za-z0-9.-]+\.vault\.azure\.net\/secrets\/([A-Za-z0-9._-]+)/.exec(ref);
  if (!match) throw new TypeError('currentSecretRef is not an Azure Key Vault secret identifier.');
  return match[1];
}

export class MultiCloudCarrierSecretVault implements CarrierSecretVault {
  private awsClient?: AwsSecretsClient;
  private gcpClient?: GcpSecretsClient;
  private azureClient?: AzureSecretsClient;

  constructor(private readonly options: {
    awsRegion?: string;
    awsNamePrefix?: string;
    gcpProject?: string;
    gcpNamePrefix?: string;
    azureVaultUrl?: string;
    azureNamePrefix?: string;
    awsClient?: AwsSecretsClient;
    gcpClient?: GcpSecretsClient;
    azureClient?: AzureSecretsClient;
  } = {}) {
    this.awsClient = options.awsClient;
    this.gcpClient = options.gcpClient;
    this.azureClient = options.azureClient;
  }

  async writeSecret(input: {
    provider: CarrierSecretProvider;
    connectionRef: string;
    currentSecretRef?: string;
    secretValue: Uint8Array;
  }): Promise<SecretWriteResult> {
    if (input.provider === 'aws-secrets-manager') return this.writeAws(input);
    if (input.provider === 'gcp-secret-manager') return this.writeGcp(input);
    if (input.provider === 'azure-key-vault') return this.writeAzure(input);
    throw new Error('The external Secret Manager provider requires an injected private-backend adapter.');
  }

  private async writeAws(input: { connectionRef: string; currentSecretRef?: string; secretValue: Uint8Array }): Promise<SecretWriteResult> {
    this.awsClient ??= new SecretsManagerClient({ region: this.options.awsRegion || 'us-east-1' }) as AwsSecretsClient;
    if (input.currentSecretRef) {
      const response = await this.awsClient.send(new PutSecretValueCommand({
        SecretId: input.currentSecretRef,
        SecretBinary: input.secretValue,
      }));
      return { secretRef: required(response.ARN, 'ARN'), versionRef: required(response.VersionId, 'VersionId') };
    }
    const prefix = (this.options.awsNamePrefix || 'veygrit-ship/carriers').replace(/\/$/, '');
    const response = await this.awsClient.send(new CreateSecretCommand({
      Name: `${prefix}/${connectionSecretName(input.connectionRef)}`,
      SecretBinary: input.secretValue,
      Description: 'Veygrit -ship carrier credential; backend managed.',
      Tags: [{ Key: 'managed-by', Value: 'veygrit-ship' }],
    }));
    return { secretRef: required(response.ARN, 'ARN'), versionRef: required(response.VersionId, 'VersionId') };
  }

  private async writeGcp(input: { connectionRef: string; currentSecretRef?: string; secretValue: Uint8Array }): Promise<SecretWriteResult> {
    this.gcpClient ??= new SecretManagerServiceClient() as unknown as GcpSecretsClient;
    let parent: string;
    if (input.currentSecretRef) {
      parent = gcpSecretParent(input.currentSecretRef);
    } else {
      const project = this.options.gcpProject?.trim();
      if (!project) throw new Error('VEYGRIT_SHIP_GCP_SECRET_PROJECT is required.');
      const prefix = (this.options.gcpNamePrefix || 'veygrit-ship').replace(/[^A-Za-z0-9_-]/g, '-');
      const secretId = `${prefix}-${connectionSecretName(input.connectionRef)}`.slice(0, 255);
      const [created] = await this.gcpClient.createSecret({
        parent: `projects/${project}`,
        secretId,
        secret: { replication: { automatic: {} }, labels: { managed_by: 'veygrit-ship' } },
      });
      parent = required(created.name, 'secret.name');
    }
    const [version] = await this.gcpClient.addSecretVersion({
      parent,
      payload: { data: input.secretValue },
    });
    const versionName = required(version.name, 'secretVersion.name');
    return { secretRef: versionName, versionRef: versionName };
  }

  private async writeAzure(input: { connectionRef: string; currentSecretRef?: string; secretValue: Uint8Array }): Promise<SecretWriteResult> {
    const vaultUrl = this.options.azureVaultUrl?.trim();
    if (!vaultUrl) throw new Error('VEYGRIT_SHIP_AZURE_KEY_VAULT_URL is required.');
    this.azureClient ??= new SecretClient(vaultUrl, new DefaultAzureCredential()) as unknown as AzureSecretsClient;
    const prefix = (this.options.azureNamePrefix || 'veygrit-ship').replace(/[^A-Za-z0-9-]/g, '-');
    const name = input.currentSecretRef
      ? azureSecretName(input.currentSecretRef)
      : `${prefix}-${connectionSecretName(input.connectionRef).replace(/_/g, '-')}`.slice(0, 127);
    const response = await this.azureClient.setSecret(name, Buffer.from(input.secretValue).toString('base64'), {
      contentType: 'application/octet-stream;base64',
      tags: { 'managed-by': 'veygrit-ship' },
    });
    const id = required(response.id, 'secret.id');
    return { secretRef: id, versionRef: id };
  }
}

export function createMultiCloudCarrierSecretVaultFromEnv(env: NodeJS.ProcessEnv = process.env): MultiCloudCarrierSecretVault {
  return new MultiCloudCarrierSecretVault({
    awsRegion: env.AWS_REGION?.trim() || env.AWS_DEFAULT_REGION?.trim(),
    awsNamePrefix: env.VEYGRIT_SHIP_AWS_SECRET_PREFIX?.trim(),
    gcpProject: env.VEYGRIT_SHIP_GCP_SECRET_PROJECT?.trim() || env.GOOGLE_CLOUD_PROJECT?.trim(),
    gcpNamePrefix: env.VEYGRIT_SHIP_GCP_SECRET_PREFIX?.trim(),
    azureVaultUrl: env.VEYGRIT_SHIP_AZURE_KEY_VAULT_URL?.trim(),
    azureNamePrefix: env.VEYGRIT_SHIP_AZURE_SECRET_PREFIX?.trim(),
  });
}

