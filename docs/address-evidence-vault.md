# Address Evidence Vault

Address Evidence Vault is the AGID/AOID evidence layer for photos, PDFs, ID documents, utility bills, shipping labels, and other address-bearing files.

It follows a Cloudinary-like asset lifecycle idea: ingest, transform/extract, redact, store, and audit. The implementation does not depend on Cloudinary. Cloudinary is only a product reference for media management, transformations, OCR extraction, and redaction workflows.

## Goals

- Read address candidates from uploaded files without sending them outside the device by default.
- Keep raw files, extracted text, and candidate values out of public records.
- Store evidence as encrypted blobs plus commitments.
- Provide a local editable draft for the address registration screen.
- Publish only redacted evidence projections for audit, review, or future ZK/credential flows.
- Require explicit consent for AI learning or external OCR/adapters.

## Processing Model

```text
photo / PDF / ID / utility bill
        |
        v
local text layer or local OCR
        |
        v
candidate extraction
        |
        +--> local edit draft
        |
        +--> commitment-only public projection
        |
        v
encrypted blob storage
```

The default mode is `local-only`. If an image or PDF needs OCR and no local OCR worker is configured, the record becomes `needs-ocr` and adds `local-ocr-worker-required`.

External processing is blocked unless `explicitExternalProcessingConsent` is true. In high-risk mode, external processing is blocked even if consent exists.

## Data Boundaries

| Layer | May contain raw address? | Persistence |
| --- | --- | --- |
| Raw file | Yes | Encrypted blob only |
| Extracted text | Yes | Do not persist as public record |
| Local edit draft | Yes | Transient device memory |
| Public projection | No | Safe to share/audit |
| AI learning data | Only with explicit consent | Prefer local or federated opt-in |

Public projections contain:

- `vaultId`
- evidence commitment
- source kind
- media kind
- processing status
- detected field names
- redacted previews
- candidate value commitments
- required controls

They do not contain:

- raw document bytes
- original file name
- extracted text
- full address
- recipient name
- phone or email
- AGID/AOID plaintext

## Required Controls

Every vault record must carry:

- `encrypted-storage-required`
- `no-default-external-send`
- `public-projection-redacted`
- `raw-document-not-in-public-record`
- `ai-learning-explicit-consent`
- `audit-commitment-record`

High-risk records also require:

- `high-risk-no-external-processing`
- `short-retention-recommended`
- `recipient-safety-review`

## Recommended Integrations

Initial implementation:

- `src/lib/addressDocumentReading.ts` for local text-layer and heuristic extraction.
- `src/lib/addressEvidenceVault.ts` for secure vault wrapping.

Later additions:

- local OCR worker for images and scanned PDFs
- encrypted IndexedDB storage
- Evidence Vault upload UI in address registration
- review queue for low-confidence candidates
- local-only feedback model for address extraction quality
- ZK predicate input builder from public commitments

## Safety Rules

1. Do not upload evidence to external OCR by default.
2. Do not store proof documents unencrypted.
3. Do not place raw addresses in metadata.
4. Do not use evidence for AI learning without explicit opt-in.
5. Do not publish AGID/AOID plaintext in an evidence projection.
6. Do not allow external processing in high-risk contexts such as DV safety, refugee aid, shelters, or disaster evacuation.
