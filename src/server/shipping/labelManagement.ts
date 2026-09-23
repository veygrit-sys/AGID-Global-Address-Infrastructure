import { createHash, randomUUID } from 'node:crypto';

import type { Carrier, SqlPool } from './veygritShipStore';

export const LABEL_FORMATS = ['pdf', 'zpl'] as const;
export type ManagedLabelFormat = typeof LABEL_FORMATS[number];
export type LabelObjectStoreProvider = 'aws-s3' | 'gcp-cloud-storage' | 'azure-blob' | 'external';
export type LabelAccessAction = 'download_url_issued' | 'print' | 'reprint';

export const LABEL_PRIVACY_POLICY = Object.freeze({
  classification: 'restricted_pii',
  logsAllowed: false,
  analyticsAllowed: false,
  publicSitesStorageAllowed: false,
  signedUrlMaximumSeconds: 300,
  defaultSignedUrlSeconds: 60,
} as const);

export type LabelActorContext = {
  merchantRef: string;
  actorRef: string;
  actorType: 'merchant_user' | 'api_key' | 'system';
};

export type LabelObjectDescriptor = {
  objectKey: string;
  objectVersionRef?: string;
  format: ManagedLabelFormat;
  status: 'active' | 'void_pending' | 'voided' | 'void_failed' | 'superseded';
};

export interface PrivateLabelObjectStorage {
  readonly provider: LabelObjectStoreProvider;
  putRestrictedObject(input: {
    objectKey: string;
    body: Uint8Array;
    contentType: 'application/pdf' | 'application/vnd.zebra-zpl';
    sha256: string;
    metadata: { privacy: 'restricted_pii'; analytics: 'forbidden'; logs: 'forbidden' };
  }): Promise<{ objectVersionRef?: string }>;
  createSignedDownloadUrl(input: {
    objectKey: string;
    objectVersionRef?: string;
    expiresInSeconds: number;
    contentType: 'application/pdf' | 'application/vnd.zebra-zpl';
    contentDisposition: string;
  }): Promise<string>;
}

export interface CarrierLabelVoider {
  voidLabel(input: { labelRef: string; idempotencyRef: string }): Promise<{ ok: true } | { ok: false; errorCode: string }>;
}

export interface LabelMetadataStore {
  saveLabel(input: {
    labelRef: string;
    shipmentRef: string;
    packageRef?: string;
    merchantRef: string;
    carrier: Carrier;
    trackingNumber: string;
    format: ManagedLabelFormat;
    objectStoreProvider: LabelObjectStoreProvider;
    objectKey: string;
    objectVersionRef?: string;
    artifactSha256: string;
    artifactSizeBytes: number;
    retentionUntil?: string;
  }): Promise<void>;
  getDownloadDescriptor(input: { labelRef: string; merchantRef: string }): Promise<LabelObjectDescriptor>;
  recordAccess(input: {
    eventRef: string;
    labelRef: string;
    merchantRef: string;
    actorRef: string;
    action: LabelAccessAction;
    signedUrlTtlSeconds: number;
  }): Promise<void>;
  requestVoid(input: { eventRef: string; labelRef: string; merchantRef: string; actorRef: string }): Promise<void>;
  finishVoid(input: {
    eventRef: string;
    labelRef: string;
    merchantRef: string;
    actorRef: string;
    outcome: 'voided' | 'void_failed';
    failureCode?: string;
  }): Promise<void>;
}

export type ManagedLabelSummary = {
  labelRef: string;
  shipmentRef: string;
  packageRef?: string;
  format: ManagedLabelFormat;
  status: 'active';
};

export type SignedLabelDownload = {
  labelRef: string;
  format: ManagedLabelFormat;
  purpose: LabelAccessAction;
  downloadUrl: string;
  expiresAt: string;
};

function required(value: string, name: string, max = 500): string {
  const normalized = value.normalize('NFKC').trim();
  if (!normalized || normalized.length > max) throw new TypeError(`${name} is invalid.`);
  return normalized;
}

function safeRef(value: string, name: string, max = 100): string {
  const normalized = required(value, name, max);
  if (!/^[A-Za-z0-9_-]+$/.test(normalized)) throw new TypeError(`${name} is invalid.`);
  return normalized;
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function contentType(format: ManagedLabelFormat): 'application/pdf' | 'application/vnd.zebra-zpl' {
  return format === 'pdf' ? 'application/pdf' : 'application/vnd.zebra-zpl';
}

function iso(value: string, name: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError(`${name} is invalid.`);
  return date.toISOString();
}

function errorCode(value: string): string {
  const normalized = value.normalize('NFKC').trim().replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 100);
  return normalized || 'carrier_void_failed';
}

export class PostgresLabelMetadataStore implements LabelMetadataStore {
  constructor(private readonly pool: SqlPool) {}

  async saveLabel(input: {
    labelRef: string;
    shipmentRef: string;
    packageRef?: string;
    merchantRef: string;
    carrier: Carrier;
    trackingNumber: string;
    format: ManagedLabelFormat;
    objectStoreProvider: LabelObjectStoreProvider;
    objectKey: string;
    objectVersionRef?: string;
    artifactSha256: string;
    artifactSizeBytes: number;
    retentionUntil?: string;
  }): Promise<void> {
    const result = await this.pool.query(
      `WITH owner AS (
         SELECT s.id AS shipment_id,m.id AS merchant_id
         FROM veygrit_ship_shipment s JOIN veygrit_ship_merchant m ON m.id=s.merchant_id
         WHERE s.shipment_ref=$2 AND m.merchant_ref=$3 AND m.status='active'
       ), inserted AS (
         INSERT INTO veygrit_ship_label
           (label_ref,shipment_id,package_id,carrier,carrier_tracking_number,format,artifact_key,
            artifact_sha256,artifact_size_bytes,object_store_provider,object_version_ref,
            privacy_classification,analytics_export_allowed,status,retention_until)
         SELECT $1,o.shipment_id,p.id,$5,$6,$7,$8,$9,$10,$11,$12,'restricted_pii',false,'active',$13
         FROM owner o LEFT JOIN veygrit_ship_package p ON p.shipment_id=o.shipment_id AND p.package_ref=$4
         WHERE ($4::text IS NULL OR p.id IS NOT NULL)
         ON CONFLICT (label_ref) DO NOTHING RETURNING shipment_id
       )
       UPDATE veygrit_ship_shipment s SET status='created',carrier=$5,label_outcome='confirmed',
         next_tracking_poll_at=now(),next_carrier_reconcile_at=now()
       FROM inserted i WHERE s.id=i.shipment_id RETURNING s.shipment_ref`,
      [
        safeRef(input.labelRef, 'labelRef'), safeRef(input.shipmentRef, 'shipmentRef'), safeRef(input.merchantRef, 'merchantRef'),
        input.packageRef ? safeRef(input.packageRef, 'packageRef') : null, input.carrier,
        required(input.trackingNumber, 'trackingNumber', 100), input.format, required(input.objectKey, 'objectKey'),
        input.artifactSha256, input.artifactSizeBytes, input.objectStoreProvider,
        input.objectVersionRef ? required(input.objectVersionRef, 'objectVersionRef') : null,
        input.retentionUntil ? iso(input.retentionUntil, 'retentionUntil') : null,
      ],
    );
    if (!result.rows.length) throw new Error('Merchant shipment/package was not found or labelRef already exists.');
  }

  async getDownloadDescriptor(input: { labelRef: string; merchantRef: string }): Promise<LabelObjectDescriptor> {
    const result = await this.pool.query<{
      artifact_key: string;
      object_version_ref: string | null;
      format: ManagedLabelFormat;
      status: LabelObjectDescriptor['status'];
    }>(
      `SELECT l.artifact_key,l.object_version_ref,l.format,l.status
       FROM veygrit_ship_label l
       JOIN veygrit_ship_shipment s ON s.id=l.shipment_id
       JOIN veygrit_ship_merchant m ON m.id=s.merchant_id
       WHERE l.label_ref=$1 AND m.merchant_ref=$2 AND m.status='active'`,
      [safeRef(input.labelRef, 'labelRef'), safeRef(input.merchantRef, 'merchantRef')],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Label was not found.');
    return {
      objectKey: row.artifact_key,
      ...(row.object_version_ref ? { objectVersionRef: row.object_version_ref } : {}),
      format: row.format,
      status: row.status,
    };
  }

  async recordAccess(input: {
    eventRef: string;
    labelRef: string;
    merchantRef: string;
    actorRef: string;
    action: LabelAccessAction;
    signedUrlTtlSeconds: number;
  }): Promise<void> {
    const result = await this.pool.query(
      `WITH target AS (
         SELECT l.id,m.id AS merchant_id FROM veygrit_ship_label l
         JOIN veygrit_ship_shipment s ON s.id=l.shipment_id
         JOIN veygrit_ship_merchant m ON m.id=s.merchant_id
         WHERE l.label_ref=$1 AND m.merchant_ref=$2 AND l.status='active'
       ), updated AS (
         UPDATE veygrit_ship_label l SET
           download_count=download_count+1,last_downloaded_at=now(),
           print_count=print_count+CASE WHEN $5 IN ('print','reprint') THEN 1 ELSE 0 END,
           reprint_count=reprint_count+CASE WHEN $5='reprint' THEN 1 ELSE 0 END,
           last_printed_at=CASE WHEN $5 IN ('print','reprint') THEN now() ELSE last_printed_at END
         FROM target t WHERE l.id=t.id RETURNING l.id,t.merchant_id
       ), event AS (
         INSERT INTO veygrit_ship_label_access_event
           (event_ref,merchant_id,label_id,actor_ref,action,signed_url_ttl_seconds,outcome)
         SELECT $3,u.merchant_id,u.id,$4,$5,$6,'success' FROM updated u RETURNING id
       ) SELECT id FROM event`,
      [
        safeRef(input.labelRef, 'labelRef'), safeRef(input.merchantRef, 'merchantRef'), safeRef(input.eventRef, 'eventRef'),
        safeRef(input.actorRef, 'actorRef', 200), input.action, input.signedUrlTtlSeconds,
      ],
    );
    if (!result.rows.length) throw new Error('Active label was not found.');
  }

  async requestVoid(input: { eventRef: string; labelRef: string; merchantRef: string; actorRef: string }): Promise<void> {
    const result = await this.pool.query(
      `WITH target AS (
         SELECT l.id,m.id AS merchant_id FROM veygrit_ship_label l
         JOIN veygrit_ship_shipment s ON s.id=l.shipment_id
         JOIN veygrit_ship_merchant m ON m.id=s.merchant_id
         WHERE l.label_ref=$1 AND m.merchant_ref=$2 AND l.status IN ('active','void_failed')
       ), updated AS (
         UPDATE veygrit_ship_label l SET status='void_pending',void_requested_at=now(),void_failure_code=NULL
         FROM target t WHERE l.id=t.id RETURNING l.id,t.merchant_id
       ), event AS (
         INSERT INTO veygrit_ship_label_access_event
           (event_ref,merchant_id,label_id,actor_ref,action,outcome)
         SELECT $3,u.merchant_id,u.id,$4,'void_requested','success' FROM updated u RETURNING id
       ) SELECT id FROM event`,
      [safeRef(input.labelRef, 'labelRef'), safeRef(input.merchantRef, 'merchantRef'), safeRef(input.eventRef, 'eventRef'), safeRef(input.actorRef, 'actorRef', 200)],
    );
    if (!result.rows.length) throw new Error('Voidable label was not found.');
  }

  async finishVoid(input: {
    eventRef: string;
    labelRef: string;
    merchantRef: string;
    actorRef: string;
    outcome: 'voided' | 'void_failed';
    failureCode?: string;
  }): Promise<void> {
    const failure = input.outcome === 'void_failed' ? errorCode(input.failureCode ?? '') : null;
    const result = await this.pool.query(
      `WITH target AS (
         SELECT l.id,m.id AS merchant_id FROM veygrit_ship_label l
         JOIN veygrit_ship_shipment s ON s.id=l.shipment_id
         JOIN veygrit_ship_merchant m ON m.id=s.merchant_id
         WHERE l.label_ref=$1 AND m.merchant_ref=$2 AND l.status='void_pending'
       ), updated AS (
         UPDATE veygrit_ship_label l SET status=$5,
           voided_at=CASE WHEN $5='voided' THEN now() ELSE NULL END,void_failure_code=$6
         FROM target t WHERE l.id=t.id RETURNING l.id,t.merchant_id
       ), event AS (
         INSERT INTO veygrit_ship_label_access_event
           (event_ref,merchant_id,label_id,actor_ref,action,outcome,failure_code)
         SELECT $3,u.merchant_id,u.id,$4,
           CASE WHEN $5='voided' THEN 'void_succeeded' ELSE 'void_failed' END,
           CASE WHEN $5='voided' THEN 'success' ELSE 'failure' END,$6 FROM updated u RETURNING id
       ) SELECT id FROM event`,
      [
        safeRef(input.labelRef, 'labelRef'), safeRef(input.merchantRef, 'merchantRef'), safeRef(input.eventRef, 'eventRef'),
        safeRef(input.actorRef, 'actorRef', 200), input.outcome, failure,
      ],
    );
    if (!result.rows.length) throw new Error('Pending Void label was not found.');
  }
}

export class LabelManagementService {
  constructor(
    private readonly storage: PrivateLabelObjectStorage,
    private readonly store: LabelMetadataStore,
    private readonly options: { now?: () => number; signedUrlSeconds?: number } = {},
  ) {}

  async storeLabel(input: {
    actor: LabelActorContext;
    labelRef: string;
    shipmentRef: string;
    packageRef?: string;
    carrier: Carrier;
    trackingNumber: string;
    format: ManagedLabelFormat;
    bytes: Uint8Array;
    retentionUntil?: string;
  }): Promise<ManagedLabelSummary> {
    if (!LABEL_FORMATS.includes(input.format)) throw new TypeError('Only PDF and ZPL labels are supported.');
    if (input.bytes.byteLength < 1 || input.bytes.byteLength > 20 * 1024 * 1024) throw new TypeError('Label size is invalid.');
    const labelRef = safeRef(input.labelRef, 'labelRef');
    const shipmentRef = safeRef(input.shipmentRef, 'shipmentRef');
    const packageRef = input.packageRef ? safeRef(input.packageRef, 'packageRef') : undefined;
    const objectKey = `restricted-labels/${randomUUID().replace(/-/g, '')}.${input.format}`;
    const buffer = Buffer.from(input.bytes);
    const digest = sha256(buffer);
    try {
      const stored = await this.storage.putRestrictedObject({
        objectKey,
        body: buffer,
        contentType: contentType(input.format),
        sha256: digest,
        metadata: { privacy: 'restricted_pii', analytics: 'forbidden', logs: 'forbidden' },
      });
      await this.store.saveLabel({
        labelRef, shipmentRef, ...(packageRef ? { packageRef } : {}), merchantRef: safeRef(input.actor.merchantRef, 'merchantRef'),
        carrier: input.carrier, trackingNumber: required(input.trackingNumber, 'trackingNumber', 100), format: input.format,
        objectStoreProvider: this.storage.provider, objectKey,
        ...(stored.objectVersionRef ? { objectVersionRef: stored.objectVersionRef } : {}),
        artifactSha256: digest, artifactSizeBytes: buffer.byteLength,
        ...(input.retentionUntil ? { retentionUntil: iso(input.retentionUntil, 'retentionUntil') } : {}),
      });
      return { labelRef, shipmentRef, ...(packageRef ? { packageRef } : {}), format: input.format, status: 'active' };
    } finally {
      buffer.fill(0);
    }
  }

  async createDownload(input: {
    actor: LabelActorContext;
    labelRef: string;
    purpose?: LabelAccessAction;
    expiresInSeconds?: number;
  }): Promise<SignedLabelDownload> {
    const purpose = input.purpose ?? 'download_url_issued';
    const labelRef = safeRef(input.labelRef, 'labelRef');
    const descriptor = await this.store.getDownloadDescriptor({ labelRef, merchantRef: safeRef(input.actor.merchantRef, 'merchantRef') });
    if (descriptor.status !== 'active') throw new Error('Only active labels can be downloaded or printed.');
    const ttl = Math.max(1, Math.min(
      LABEL_PRIVACY_POLICY.signedUrlMaximumSeconds,
      Math.trunc(input.expiresInSeconds ?? this.options.signedUrlSeconds ?? LABEL_PRIVACY_POLICY.defaultSignedUrlSeconds),
    ));
    const now = (this.options.now ?? Date.now)();
    const url = await this.storage.createSignedDownloadUrl({
      objectKey: descriptor.objectKey,
      ...(descriptor.objectVersionRef ? { objectVersionRef: descriptor.objectVersionRef } : {}),
      expiresInSeconds: ttl,
      contentType: contentType(descriptor.format),
      contentDisposition: `attachment; filename="label.${descriptor.format}"`,
    });
    if (!url.startsWith('https://')) throw new Error('Object Storage returned an invalid signed URL.');
    await this.store.recordAccess({
      eventRef: `label_access_${randomUUID().replace(/-/g, '')}`, labelRef,
      merchantRef: input.actor.merchantRef, actorRef: input.actor.actorRef, action: purpose, signedUrlTtlSeconds: ttl,
    });
    return { labelRef, format: descriptor.format, purpose, downloadUrl: url, expiresAt: new Date(now + ttl * 1000).toISOString() };
  }

  createReprint(input: { actor: LabelActorContext; labelRef: string; expiresInSeconds?: number }): Promise<SignedLabelDownload> {
    return this.createDownload({ ...input, purpose: 'reprint' });
  }

  async voidLabel(input: { actor: LabelActorContext; labelRef: string; voider: CarrierLabelVoider }): Promise<'voided' | 'void_failed'> {
    const labelRef = safeRef(input.labelRef, 'labelRef');
    const rootRef = randomUUID().replace(/-/g, '');
    await this.store.requestVoid({
      eventRef: `label_void_request_${rootRef}`, labelRef,
      merchantRef: input.actor.merchantRef, actorRef: input.actor.actorRef,
    });
    let result: Awaited<ReturnType<CarrierLabelVoider['voidLabel']>>;
    try {
      result = await input.voider.voidLabel({ labelRef, idempotencyRef: `label_void_${rootRef}` });
    } catch {
      result = { ok: false, errorCode: 'carrier_void_unavailable' };
    }
    await this.store.finishVoid({
      eventRef: `label_void_result_${rootRef}`, labelRef,
      merchantRef: input.actor.merchantRef, actorRef: input.actor.actorRef,
      outcome: result.ok ? 'voided' : 'void_failed',
      ...('errorCode' in result ? { failureCode: errorCode(result.errorCode) } : {}),
    });
    return result.ok ? 'voided' : 'void_failed';
  }
}
