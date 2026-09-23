# Veygrit -ship label management

## Boundary

PDF and ZPL labels are classified as `restricted_pii`. Label bytes are stored only in a private, encrypted Object Storage bucket/container. PostgreSQL contains metadata and an opaque object key, not label bytes. The public Sites build and Guest API have no label storage, download-signing, reprint, or Void endpoint.

The supported private adapters are:

- AWS S3 with SSE-KMS when a KMS key is configured, otherwise SSE-S3;
- Google Cloud Storage with CRC32C validation and optional CMEK;
- Azure Blob Storage using platform encryption and Microsoft Entra user-delegation SAS;
- an injected external private-storage implementation.

Buckets and containers must block public access. Workload identity is preferred over static cloud keys.

## Shipment and package relation

- A Shipment-scope label has `package_id IS NULL`; only one active or Void-pending Shipment label is allowed.
- A Package-scope label belongs to exactly one Package; only one active or Void-pending label is allowed per Package.
- The database trigger rejects mixing an active Shipment-scope label with active Package-scope labels for the same Shipment.
- Multi-piece shipments therefore use one Package label per parcel.

## Signed downloads and reprints

Every download, print, and reprint creates a new signed URL. The application default is 60 seconds and the hard maximum is 300 seconds. The URL is returned once and is never stored in PostgreSQL, Audit Events, logs, or analytics.

The redacted access ledger stores only the label reference, Merchant/actor references, action, TTL, outcome, and timestamp. Reprint and print counters are updated atomically with the access event.

## Void lifecycle

```text
active -> void_pending -> voided
                       -> void_failed -> void_pending (explicit retry)
```

The carrier Void call runs outside a database transaction. Short conditional updates record request and terminal outcome. Failed carrier responses are reduced to a safe error code; response bodies are discarded.

Void does not immediately delete the label object. Retention and legal/audit policy determine when a private worker removes a voided or superseded object.

## PII controls

- Label content, address, recipient name, phone, tracking number, Object key, and signed URL are forbidden in logs and analytics.
- Object metadata contains only `restricted_pii`, `analytics=forbidden`, `logs=forbidden`, and the SHA-256 digest.
- Object keys are random and contain no Merchant, Shipment, Package, tracking, or recipient identifiers.
- `veygrit_ship_guest` is explicitly denied label and label-access-ledger privileges.
- The access ledger is append-only.

## Runtime configuration

```env
VEYGRIT_SHIP_LABEL_OBJECT_PROVIDER=aws-s3

VEYGRIT_SHIP_LABEL_S3_BUCKET=
VEYGRIT_SHIP_LABEL_S3_KMS_KEY_ID=

VEYGRIT_SHIP_LABEL_GCS_BUCKET=
VEYGRIT_SHIP_LABEL_GCS_KMS_KEY_NAME=

VEYGRIT_SHIP_LABEL_AZURE_ACCOUNT_URL=
VEYGRIT_SHIP_LABEL_AZURE_CONTAINER=
```

Primary references:

- AWS S3 presigned URLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html
- Google Cloud Storage signed URLs: https://docs.cloud.google.com/storage/docs/access-control/signed-urls
- Azure SAS expiration policy: https://learn.microsoft.com/en-us/azure/storage/common/sas-expiration-policy

