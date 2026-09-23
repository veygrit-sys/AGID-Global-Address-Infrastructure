import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AwsS3PrivateLabelObjectStorage,
  AzurePrivateLabelObjectStorage,
  GcpPrivateLabelObjectStorage,
} from './multiCloudLabelObjectStorage';

const putInput = {
  objectKey: 'restricted-labels/random.pdf',
  body: Buffer.from('private-pdf'),
  contentType: 'application/pdf' as const,
  sha256: 'a'.repeat(64),
  metadata: { privacy: 'restricted_pii' as const, analytics: 'forbidden' as const, logs: 'forbidden' as const },
};

test('S3 adapter forces encryption, private no-store metadata, versioning, and bounded presigning', async () => {
  const commands: any[] = [];
  const client = { async send(command: any) { commands.push(command); return { VersionId: 's3-version-1' }; } };
  let expires = 0;
  const storage = new AwsS3PrivateLabelObjectStorage({
    bucket: 'private-labels', kmsKeyId: 'alias/veygrit-labels', client,
    presign: async (_client, _command, options) => { expires = options.expiresIn; return 'https://s3.example.test/signed'; },
  });
  assert.deepEqual(await storage.putRestrictedObject(putInput), { objectVersionRef: 's3-version-1' });
  assert.equal(commands[0].input.ServerSideEncryption, 'aws:kms');
  assert.equal(commands[0].input.CacheControl, 'private, no-store, max-age=0');
  assert.equal(commands[0].input.Metadata.analytics, 'forbidden');
  await storage.createSignedDownloadUrl({
    objectKey: putInput.objectKey, objectVersionRef: 's3-version-1', expiresInSeconds: 900,
    contentType: 'application/pdf', contentDisposition: 'attachment; filename="label.pdf"',
  });
  assert.equal(expires, 300);
});

test('GCP adapter uses CRC validation, optional KMS, object generation, and V4 signed URL', async () => {
  let saveOptions: any;
  let signedOptions: any;
  const file = {
    async save(_body: Uint8Array, options: any) { saveOptions = options; },
    async getMetadata() { return [{ generation: '42' }]; },
    async getSignedUrl(options: any) { signedOptions = options; return ['https://gcs.example.test/signed']; },
  };
  const storageApi = { bucket() { return { file() { return file; } }; } };
  const storage = new GcpPrivateLabelObjectStorage({ bucket: 'private-labels', kmsKeyName: 'projects/p/locations/l/keyRings/r/cryptoKeys/k', storage: storageApi });
  assert.deepEqual(await storage.putRestrictedObject(putInput), { objectVersionRef: '42' });
  assert.equal(saveOptions.validation, 'crc32c');
  assert.equal(saveOptions.kmsKeyName.includes('/cryptoKeys/'), true);
  assert.equal(saveOptions.metadata.cacheControl, 'private, no-store, max-age=0');
  await storage.createSignedDownloadUrl({
    objectKey: putInput.objectKey, objectVersionRef: '42', expiresInSeconds: 60,
    contentType: 'application/pdf', contentDisposition: 'attachment; filename="label.pdf"',
  });
  assert.equal(signedOptions.version, 'v4');
  assert.equal(signedOptions.action, 'read');
});

test('Azure adapter uses private headers and a short HTTPS user-delegation SAS', async () => {
  let uploadOptions: any;
  let sasInput: any;
  const versionBlob = { url: 'https://account.blob.core.windows.net/labels/blob?versionid=7' };
  const blob = {
    url: 'https://account.blob.core.windows.net/labels/blob',
    async uploadData(_body: Uint8Array, options: any) { uploadOptions = options; return { versionId: '7' }; },
    withVersion() { return versionBlob; },
  };
  const container = { getBlockBlobClient() { return blob; }, getBlobClient() { return blob; } };
  const service = {
    getContainerClient() { return container; },
    async getUserDelegationKey() { return { signedObjectId: 'object' }; },
  };
  const storage = new AzurePrivateLabelObjectStorage({
    accountUrl: 'https://account.blob.core.windows.net', container: 'labels', service,
    signSas: ((input: any) => { sasInput = input; return { toString: () => 'sp=r&sig=redacted' }; }) as any,
  });
  assert.deepEqual(await storage.putRestrictedObject(putInput), { objectVersionRef: '7' });
  assert.equal(uploadOptions.blobHTTPHeaders.blobCacheControl, 'private, no-store, max-age=0');
  const url = await storage.createSignedDownloadUrl({
    objectKey: putInput.objectKey, objectVersionRef: '7', expiresInSeconds: 600,
    contentType: 'application/pdf', contentDisposition: 'attachment; filename="label.pdf"',
  });
  assert.equal(url, `${versionBlob.url}?sp=r&sig=redacted`);
  assert.equal(sasInput.protocol, 'https');
  assert.ok(sasInput.expiresOn.getTime() - Date.now() <= 301_000);
});

