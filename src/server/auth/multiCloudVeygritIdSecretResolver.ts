import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

import type { VeygritIdSecretResolver } from './veygritIdRuntime';

type AwsClient = { send(command: GetSecretValueCommand): Promise<{ SecretString?: string; SecretBinary?: Uint8Array }> };
type GcpClient = { accessSecretVersion(request: { name: string }): Promise<[{ payload?: { data?: Uint8Array | string } }]> };
type AzureClient = { getSecret(name: string, options?: { version?: string }): Promise<{ value?: string }> };

function required(value: string | undefined, provider: string) {
  if (!value) throw new Error(`${provider}_secret_value_missing`);
  return value;
}

export class MultiCloudVeygritIdSecretResolver implements VeygritIdSecretResolver {
  private aws?: AwsClient; private gcp?: GcpClient; private azure = new Map<string, AzureClient>();
  constructor(private readonly options: { awsRegion?: string; awsClient?: AwsClient; gcpClient?: GcpClient; azureClientFactory?: (vaultUrl: string) => AzureClient } = {}) {
    this.aws = options.awsClient; this.gcp = options.gcpClient;
  }
  async get(secretRef: string): Promise<string> {
    if (/^arn:(?:aws|aws-us-gov|aws-cn):secretsmanager:/.test(secretRef)) {
      this.aws ??= new SecretsManagerClient({ region: this.options.awsRegion }) as AwsClient;
      const value = await this.aws.send(new GetSecretValueCommand({ SecretId: secretRef }));
      return required(value.SecretString ?? (value.SecretBinary ? Buffer.from(value.SecretBinary).toString('utf8') : undefined), 'aws');
    }
    if (/^projects\/[A-Za-z0-9._-]+\/secrets\/[A-Za-z0-9._-]+\/versions\/[A-Za-z0-9._-]+$/.test(secretRef)) {
      this.gcp ??= new SecretManagerServiceClient() as unknown as GcpClient;
      const [value] = await this.gcp.accessSecretVersion({ name: secretRef });
      const data = value.payload?.data;
      return required(typeof data === 'string' ? data : data ? Buffer.from(data).toString('utf8') : undefined, 'gcp');
    }
    const azureMatch = /^(https:\/\/[A-Za-z0-9.-]+\.vault\.azure\.net)\/secrets\/([A-Za-z0-9-]+)(?:\/([A-Za-z0-9]+))?$/.exec(secretRef);
    if (azureMatch) {
      const [, vaultUrl, name, version] = azureMatch;
      let client = this.azure.get(vaultUrl);
      if (!client) { client = this.options.azureClientFactory?.(vaultUrl) ?? new SecretClient(vaultUrl, new DefaultAzureCredential()) as unknown as AzureClient; this.azure.set(vaultUrl, client); }
      return required((await client.getSecret(name, version ? { version } : undefined)).value, 'azure');
    }
    throw new TypeError('unsupported_veygrit_id_secret_reference');
  }
}

export function createMultiCloudVeygritIdSecretResolverFromEnv() {
  return new MultiCloudVeygritIdSecretResolver({ awsRegion: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION });
}
