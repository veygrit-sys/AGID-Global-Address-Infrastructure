import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  LABEL_PRIVACY_POLICY,
  LabelManagementService,
  type LabelMetadataStore,
  type LabelObjectDescriptor,
  type PrivateLabelObjectStorage,
} from './labelManagement';

class MemoryLabelStore implements LabelMetadataStore {
  saved?: Parameters<LabelMetadataStore['saveLabel']>[0];
  accesses: Array<Parameters<LabelMetadataStore['recordAccess']>[0]> = [];
  voids: string[] = [];
  descriptor: LabelObjectDescriptor = { objectKey: 'restricted-labels/random.pdf', format: 'pdf', status: 'active' };

  async saveLabel(input: Parameters<LabelMetadataStore['saveLabel']>[0]) { this.saved = input; }
  async getDownloadDescriptor() { return this.descriptor; }
  async recordAccess(input: Parameters<LabelMetadataStore['recordAccess']>[0]) { this.accesses.push(input); }
  async requestVoid() { this.voids.push('void_pending'); }
  async finishVoid(input: Parameters<LabelMetadataStore['finishVoid']>[0]) { this.voids.push(input.outcome); }
}

const actor = { merchantRef: 'merchant_1', actorRef: 'user_1', actorType: 'merchant_user' as const };

test('PDF and ZPL bytes go only to restricted Object Storage and are zeroed after upload', async () => {
  let uploaded: Parameters<PrivateLabelObjectStorage['putRestrictedObject']>[0] | undefined;
  const storage: PrivateLabelObjectStorage = {
    provider: 'external',
    async putRestrictedObject(input) { uploaded = input; return { objectVersionRef: 'object_version_1' }; },
    async createSignedDownloadUrl() { throw new Error('not used'); },
  };
  const store = new MemoryLabelStore();
  const service = new LabelManagementService(storage, store);
  const result = await service.storeLabel({
    actor, labelRef: 'label_1', shipmentRef: 'shipment_1', packageRef: 'package_1', carrier: 'ups',
    trackingNumber: '1Z999AA10123456784', format: 'pdf', bytes: Buffer.from('%PDF-private-label'),
  });
  assert.deepEqual(result, { labelRef: 'label_1', shipmentRef: 'shipment_1', packageRef: 'package_1', format: 'pdf', status: 'active' });
  assert.ok(uploaded);
  assert.equal(uploaded.contentType, 'application/pdf');
  assert.deepEqual(uploaded.metadata, { privacy: 'restricted_pii', analytics: 'forbidden', logs: 'forbidden' });
  assert.match(uploaded.objectKey, /^restricted-labels\/[a-f0-9]{32}\.pdf$/);
  assert.ok([...uploaded.body].every(value => value === 0));
  assert.equal('analyticsExportAllowed' in (store.saved ?? {}), false);
  assert.doesNotMatch(JSON.stringify(result), /tracking|object|1Z999/);

  await service.storeLabel({
    actor, labelRef: 'label_2', shipmentRef: 'shipment_2', carrier: 'dhl', trackingNumber: 'DHL123456',
    format: 'zpl', bytes: Buffer.from('^XA^FDPRIVATE^FS^XZ'),
  });
  assert.equal(uploaded.contentType, 'application/vnd.zebra-zpl');
  assert.match(uploaded.objectKey, /\.zpl$/);
});

test('signed downloads expire within five minutes and audit contains no URL or object key', async () => {
  const store = new MemoryLabelStore();
  store.descriptor = { objectKey: 'restricted-labels/internal-object.pdf', objectVersionRef: 'version-private', format: 'pdf', status: 'active' };
  const storage: PrivateLabelObjectStorage = {
    provider: 'aws-s3',
    async putRestrictedObject() { return {}; },
    async createSignedDownloadUrl(input) {
      assert.equal(input.expiresInSeconds, 300);
      assert.equal(input.contentDisposition, 'attachment; filename="label.pdf"');
      return 'https://private.example.test/object?signature=must-not-be-audited';
    },
  };
  const service = new LabelManagementService(storage, store, { now: () => Date.parse('2030-01-01T00:00:00Z') });
  const result = await service.createDownload({ actor, labelRef: 'label_1', expiresInSeconds: 3600 });
  assert.equal(result.expiresAt, '2030-01-01T00:05:00.000Z');
  assert.equal(result.downloadUrl.includes('signature='), true);
  assert.equal(store.accesses[0].signedUrlTtlSeconds, 300);
  assert.doesNotMatch(JSON.stringify(store.accesses[0]), /signature|internal-object|version-private/);
  assert.equal(LABEL_PRIVACY_POLICY.analyticsAllowed, false);
  assert.equal(LABEL_PRIVACY_POLICY.logsAllowed, false);
});

test('reprint increments the dedicated audit action and uses a fresh signed URL', async () => {
  const store = new MemoryLabelStore();
  let signatures = 0;
  const storage: PrivateLabelObjectStorage = {
    provider: 'gcp-cloud-storage',
    async putRestrictedObject() { return {}; },
    async createSignedDownloadUrl() { signatures += 1; return `https://storage.example.test/signed/${signatures}`; },
  };
  const service = new LabelManagementService(storage, store);
  const first = await service.createDownload({ actor, labelRef: 'label_1', purpose: 'print' });
  const second = await service.createReprint({ actor, labelRef: 'label_1' });
  assert.notEqual(first.downloadUrl, second.downloadUrl);
  assert.deepEqual(store.accesses.map(event => event.action), ['print', 'reprint']);
});

test('Void uses pending then terminal state and redacts carrier failures', async () => {
  const successfulStore = new MemoryLabelStore();
  const storage: PrivateLabelObjectStorage = {
    provider: 'external', async putRestrictedObject() { return {}; }, async createSignedDownloadUrl() { return 'https://example.test'; },
  };
  const service = new LabelManagementService(storage, successfulStore);
  assert.equal(await service.voidLabel({ actor, labelRef: 'label_1', voider: { async voidLabel() { return { ok: true }; } } }), 'voided');
  assert.deepEqual(successfulStore.voids, ['void_pending', 'voided']);

  const failedStore = new MemoryLabelStore();
  const failed = new LabelManagementService(storage, failedStore);
  assert.equal(await failed.voidLabel({ actor, labelRef: 'label_2', voider: { async voidLabel() { throw new Error('response included address and token'); } } }), 'void_failed');
  assert.deepEqual(failedStore.voids, ['void_pending', 'void_failed']);
});

test('migration enforces one shipment label or package labels, Void lifecycle, and PII export denial', async () => {
  const sql = await readFile(new URL('../../../db/veygrit-ship-label-management.postgres.sql', import.meta.url), 'utf8');
  assert.match(sql, /veygrit_ship_label_active_shipment_scope_uq/i);
  assert.match(sql, /veygrit_ship_label_active_package_scope_uq/i);
  assert.match(sql, /veygrit_ship_enforce_label_scope/i);
  assert.match(sql, /format IN \('pdf','zpl'\)/i);
  assert.match(sql, /status IN \('active','void_pending','voided','void_failed','superseded'\)/i);
  assert.match(sql, /privacy_classification = 'restricted_pii' AND analytics_export_allowed = false/i);
  assert.match(sql, /signed_url_ttl_seconds BETWEEN 1 AND 300/i);
  assert.match(sql, /append-only/i);
  assert.match(sql, /REVOKE ALL ON veygrit_ship_label, veygrit_ship_label_access_event FROM veygrit_ship_guest/i);
  assert.doesNotMatch(sql, /signed_url\s+(text|varchar)/i);
  assert.doesNotMatch(sql, /label_(bytes|body|payload|base64)\s+(text|varchar|jsonb|bytea)/i);
});
