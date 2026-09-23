import { DefaultAzureCredential } from '@azure/identity';
import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Storage } from '@google-cloud/storage';

import type { PrivateLabelObjectStorage } from './labelManagement';

function ttl(value: number): number {
  return Math.max(1, Math.min(300, Math.trunc(value)));
}

function required(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${name} is required.`);
  return normalized;
}

function privateMetadata(input: Parameters<PrivateLabelObjectStorage['putRestrictedObject']>[0]): Record<string, string> {
  return {
    privacy: input.metadata.privacy,
    analytics: input.metadata.analytics,
    logs: input.metadata.logs,
    sha256: input.sha256,
  };
}

export class AwsS3PrivateLabelObjectStorage implements PrivateLabelObjectStorage {
  readonly provider = 'aws-s3' as const;
  private readonly client: { send(command: any): Promise<any> };
  private readonly presign: (client: any, command: any, options: { expiresIn: number }) => Promise<string>;

  constructor(private readonly options: {
    bucket: string;
    region?: string;
    kmsKeyId?: string;
    client?: { send(command: any): Promise<any> };
    presign?: (client: any, command: any, options: { expiresIn: number }) => Promise<string>;
  }) {
    this.client = options.client ?? new S3Client({ region: options.region || 'us-east-1' });
    this.presign = options.presign ?? getSignedUrl;
  }

  async putRestrictedObject(input: Parameters<PrivateLabelObjectStorage['putRestrictedObject']>[0]): Promise<{ objectVersionRef?: string }> {
    const response = await this.client.send(new PutObjectCommand({
      Bucket: required(this.options.bucket, 'VEYGRIT_SHIP_LABEL_S3_BUCKET'),
      Key: input.objectKey,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: 'private, no-store, max-age=0',
      Metadata: privateMetadata(input),
      ServerSideEncryption: this.options.kmsKeyId ? 'aws:kms' : 'AES256',
      ...(this.options.kmsKeyId ? { SSEKMSKeyId: this.options.kmsKeyId } : {}),
    }));
    return response.VersionId ? { objectVersionRef: String(response.VersionId) } : {};
  }

  createSignedDownloadUrl(input: Parameters<PrivateLabelObjectStorage['createSignedDownloadUrl']>[0]): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: required(this.options.bucket, 'VEYGRIT_SHIP_LABEL_S3_BUCKET'),
      Key: input.objectKey,
      ...(input.objectVersionRef ? { VersionId: input.objectVersionRef } : {}),
      ResponseContentType: input.contentType,
      ResponseContentDisposition: input.contentDisposition,
      ResponseCacheControl: 'private, no-store, max-age=0',
    });
    return this.presign(this.client, command, { expiresIn: ttl(input.expiresInSeconds) });
  }
}

export class GcpPrivateLabelObjectStorage implements PrivateLabelObjectStorage {
  readonly provider = 'gcp-cloud-storage' as const;
  private readonly storage: any;

  constructor(private readonly options: { bucket: string; kmsKeyName?: string; storage?: any }) {
    this.storage = options.storage ?? new Storage();
  }

  async putRestrictedObject(input: Parameters<PrivateLabelObjectStorage['putRestrictedObject']>[0]): Promise<{ objectVersionRef?: string }> {
    const file = this.storage.bucket(required(this.options.bucket, 'VEYGRIT_SHIP_LABEL_GCS_BUCKET')).file(input.objectKey);
    await file.save(input.body, {
      resumable: false,
      validation: 'crc32c',
      ...(this.options.kmsKeyName ? { kmsKeyName: this.options.kmsKeyName } : {}),
      metadata: {
        contentType: input.contentType,
        cacheControl: 'private, no-store, max-age=0',
        metadata: privateMetadata(input),
      },
    });
    const [metadata] = await file.getMetadata();
    return metadata.generation ? { objectVersionRef: String(metadata.generation) } : {};
  }

  async createSignedDownloadUrl(input: Parameters<PrivateLabelObjectStorage['createSignedDownloadUrl']>[0]): Promise<string> {
    const file = this.storage.bucket(required(this.options.bucket, 'VEYGRIT_SHIP_LABEL_GCS_BUCKET'))
      .file(input.objectKey, input.objectVersionRef ? { generation: input.objectVersionRef } : undefined);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + ttl(input.expiresInSeconds) * 1000,
      responseType: input.contentType,
      responseDisposition: input.contentDisposition,
    });
    return url;
  }
}

export class AzurePrivateLabelObjectStorage implements PrivateLabelObjectStorage {
  readonly provider = 'azure-blob' as const;
  private readonly service: any;
  private readonly accountName: string;
  private readonly signSas: typeof generateBlobSASQueryParameters;

  constructor(private readonly options: {
    accountUrl: string;
    container: string;
    service?: any;
    signSas?: typeof generateBlobSASQueryParameters;
  }) {
    const accountUrl = required(options.accountUrl, 'VEYGRIT_SHIP_LABEL_AZURE_ACCOUNT_URL');
    this.accountName = new URL(accountUrl).hostname.split('.')[0];
    this.service = options.service ?? new BlobServiceClient(accountUrl, new DefaultAzureCredential());
    this.signSas = options.signSas ?? generateBlobSASQueryParameters;
  }

  async putRestrictedObject(input: Parameters<PrivateLabelObjectStorage['putRestrictedObject']>[0]): Promise<{ objectVersionRef?: string }> {
    const blob = this.service.getContainerClient(required(this.options.container, 'VEYGRIT_SHIP_LABEL_AZURE_CONTAINER'))
      .getBlockBlobClient(input.objectKey);
    const response = await blob.uploadData(input.body, {
      blobHTTPHeaders: { blobContentType: input.contentType, blobCacheControl: 'private, no-store, max-age=0' },
      metadata: privateMetadata(input),
    });
    return response.versionId ? { objectVersionRef: String(response.versionId) } : {};
  }

  async createSignedDownloadUrl(input: Parameters<PrivateLabelObjectStorage['createSignedDownloadUrl']>[0]): Promise<string> {
    const seconds = ttl(input.expiresInSeconds);
    const startsOn = new Date(Date.now() - 30_000);
    const expiresOn = new Date(Date.now() + seconds * 1000);
    const delegationKey = await this.service.getUserDelegationKey(startsOn, expiresOn);
    const sas = this.signSas({
      containerName: required(this.options.container, 'VEYGRIT_SHIP_LABEL_AZURE_CONTAINER'),
      blobName: input.objectKey,
      permissions: BlobSASPermissions.parse('r'),
      protocol: SASProtocol.Https,
      startsOn,
      expiresOn,
      contentType: input.contentType,
      contentDisposition: input.contentDisposition,
    }, delegationKey, this.accountName).toString();
    const baseBlob = this.service.getContainerClient(this.options.container).getBlobClient(input.objectKey);
    const blob = input.objectVersionRef && typeof baseBlob.withVersion === 'function'
      ? baseBlob.withVersion(input.objectVersionRef)
      : baseBlob;
    return `${blob.url}?${sas}`;
  }
}

export function createPrivateLabelObjectStorageFromEnv(env: NodeJS.ProcessEnv = process.env): PrivateLabelObjectStorage {
  const provider = env.VEYGRIT_SHIP_LABEL_OBJECT_PROVIDER?.trim();
  if (provider === 'aws-s3') {
    return new AwsS3PrivateLabelObjectStorage({
      bucket: required(env.VEYGRIT_SHIP_LABEL_S3_BUCKET, 'VEYGRIT_SHIP_LABEL_S3_BUCKET'),
      region: env.AWS_REGION?.trim() || env.AWS_DEFAULT_REGION?.trim(),
      kmsKeyId: env.VEYGRIT_SHIP_LABEL_S3_KMS_KEY_ID?.trim(),
    });
  }
  if (provider === 'gcp-cloud-storage') {
    return new GcpPrivateLabelObjectStorage({
      bucket: required(env.VEYGRIT_SHIP_LABEL_GCS_BUCKET, 'VEYGRIT_SHIP_LABEL_GCS_BUCKET'),
      kmsKeyName: env.VEYGRIT_SHIP_LABEL_GCS_KMS_KEY_NAME?.trim(),
    });
  }
  if (provider === 'azure-blob') {
    return new AzurePrivateLabelObjectStorage({
      accountUrl: required(env.VEYGRIT_SHIP_LABEL_AZURE_ACCOUNT_URL, 'VEYGRIT_SHIP_LABEL_AZURE_ACCOUNT_URL'),
      container: required(env.VEYGRIT_SHIP_LABEL_AZURE_CONTAINER, 'VEYGRIT_SHIP_LABEL_AZURE_CONTAINER'),
    });
  }
  throw new Error('VEYGRIT_SHIP_LABEL_OBJECT_PROVIDER must be aws-s3, gcp-cloud-storage, or azure-blob.');
}
