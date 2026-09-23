import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'EvidenceVaultScreen.tsx'), 'utf8');

test('Evidence Vault exposes local upload, text-layer/OCR draft, redaction review, and proof envelope flow', () => {
  assert.match(source, /buildAddressEvidenceVaultRecord/);
  assert.match(source, /buildAddressEvidenceVaultPresentation/);
  assert.match(source, /buildAddressEvidenceVaultFlow/);
  assert.match(source, /reviewAddressEvidenceRedaction/);
  assert.match(source, /redactAddressEvidenceVaultRecord/);
  assert.match(source, /extractPrintableTextFromBinary/);
  assert.match(source, /type="file"/);
  assert.match(source, /textarea/);
  assert.match(source, /proofEnvelope/);
  assert.match(source, /redactedProjection/);
  assert.match(source, /vaultFlow/);
  assert.match(source, /redactionReview/);
});

test('Evidence Vault keeps source evidence local and blocks verifier-side storage by design', () => {
  assert.match(source, /local-vault:\/\/session/);
  assert.match(source, /allowExternalProcessing: false/);
  assert.match(source, /requestAiLearning: false/);
  assert.match(source, /highRiskMode/);
  assert.match(source, /verifierServerStorageAllowed/);
  assert.match(source, /verifierReceivesCommitmentsOnly/);
  assert.match(source, /documentSharedWithVerifier/);
  assert.match(source, /extractedTextSharedWithVerifier/);
  assert.match(source, /資料は開示しない/);
});

test('Evidence Vault owns its own scroll container because the map shell locks body scroll', () => {
  assert.match(source, /<main className="agid-page-scroll bg-\[#f6f8fb\] text-slate-950">/);
  assert.doesNotMatch(source, /<main className="min-h-screen bg-\[#f6f8fb\] text-slate-950">/);
});

test('Evidence Vault source avoids persisted raw private field names', () => {
  assert.doesNotMatch(source, /rawAddress\s*:/);
  assert.doesNotMatch(source, /rawAgid\s*:/);
  assert.doesNotMatch(source, /rawAoid\s*:/);
  assert.doesNotMatch(source, /proofCode\s*:/);
  assert.doesNotMatch(source, /phoneNumber\s*:/);
  assert.doesNotMatch(source, /recipientSecret\s*:/);
});
