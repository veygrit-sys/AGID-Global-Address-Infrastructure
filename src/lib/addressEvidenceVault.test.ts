import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_EVIDENCE_VAULT_VERSION,
  buildAddressEvidenceVaultFlow,
  buildAddressEvidenceVaultPresentation,
  buildAddressEvidenceVaultRecord,
  redactAddressEvidenceVaultRecord,
  reviewAddressEvidenceRedaction,
  validateAddressEvidenceVaultRecord,
} from './addressEvidenceVault';

const createdAt = '2026-06-17T00:00:00.000Z';

test('builds an encrypted local vault record with editable draft and redacted public projection', () => {
  const record = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'utility-bill.pdf',
      mimeType: 'application/pdf',
      text: [
        'Recipient: Jane Example',
        '123 Market Street',
        'San Francisco, CA 94105',
        'Phone +1 415 555 0100',
      ].join('\n'),
      sizeBytes: 84_000,
      encryptedBlobRef: 'local-vault://blob/abc',
      ciphertextCommitment: 'cipher_existing_commitment',
      sourceKind: 'utility-bill',
    },
    purpose: 'delivery',
    createdAt,
  });

  assert.equal(record.version, ADDRESS_EVIDENCE_VAULT_VERSION);
  assert.equal(record.status, 'ready');
  assert.equal(record.sourceKind, 'utility-bill');
  assert.equal(record.storageMode, 'local-encrypted');
  assert.equal(record.processingMode, 'local-only');
  assert.equal(record.file.originalFileNameStored, false);
  assert.equal(record.file.rawDocumentStored, false);
  assert.equal(record.extraction.extractedTextStored, false);
  assert.equal(record.extraction.localEditDraftStorage, 'transient-device-memory');
  assert.equal(record.extraction.localEditDraft?.street, '123 Market Street');
  assert.ok(record.requiredControls.includes('encrypted-storage-required'));
  assert.ok(record.requiredControls.includes('public-projection-redacted'));

  const publicProjection = redactAddressEvidenceVaultRecord(record);
  const publicJson = JSON.stringify(publicProjection);
  assert.doesNotMatch(publicJson, /Jane Example|123 Market Street|415 555 0100/i);
  assert.match(publicProjection.redactedCandidates[0].valueCommitment, /^val_[a-f0-9]{32}$/);
  assert.equal(validateAddressEvidenceVaultRecord(record).ok, true);
});

test('image evidence without a text layer stays local and asks for an OCR worker', () => {
  const record = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'address-photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1_200_000,
      encryptedBlobRef: 'local-vault://blob/photo',
    },
    createdAt,
  });

  assert.equal(record.status, 'needs-ocr');
  assert.equal(record.processingMode, 'local-ocr-required');
  assert.ok(record.requiredControls.includes('local-ocr-worker-required'));
  assert.ok(record.warnings.includes('address-evidence-local-ocr-engine-required-before-autofill'));
  assert.equal(validateAddressEvidenceVaultRecord(record).ok, true);
});

test('blocks external processing unless explicit consent is present', () => {
  const blocked = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'label.pdf',
      mimeType: 'application/pdf',
      text: 'Ship to\n123 Market Street\n94105',
      encryptedBlobRef: 'local-vault://blob/label',
    },
    allowExternalProcessing: true,
    createdAt,
  });

  assert.equal(blocked.status, 'rejected');
  assert.equal(blocked.processingMode, 'external-adapter-blocked');
  assert.ok(blocked.errors.includes('address-evidence-external-processing-requires-explicit-consent'));
  assert.equal(validateAddressEvidenceVaultRecord(blocked).ok, false);

  const allowed = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'label.pdf',
      mimeType: 'application/pdf',
      text: 'Ship to\n123 Market Street\n94105',
      encryptedBlobRef: 'local-vault://blob/label',
    },
    allowExternalProcessing: true,
    explicitExternalProcessingConsent: true,
    consentReceiptRef: 'consent:ocr-adapter:1',
    storageMode: 'external-adapter-encrypted',
    createdAt,
  });

  assert.equal(allowed.status, 'ready');
  assert.equal(allowed.processingMode, 'external-adapter-consented');
  assert.equal(allowed.consent.externalProcessingAllowed, true);
  assert.match(allowed.consent.consentReceiptCommitment ?? '', /^consent_[a-f0-9]{32}$/);
  assert.equal(validateAddressEvidenceVaultRecord(allowed).ok, true);
});

test('high-risk mode blocks external adapters even when consent exists', () => {
  const record = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'aid-document.pdf',
      mimeType: 'application/pdf',
      text: 'Recipient\nSafe Person\n123 Market Street\n94105',
      encryptedBlobRef: 'local-vault://blob/aid',
    },
    highRiskMode: true,
    allowExternalProcessing: true,
    explicitExternalProcessingConsent: true,
    createdAt,
  });

  assert.equal(record.status, 'rejected');
  assert.equal(record.consent.externalProcessingAllowed, false);
  assert.ok(record.errors.includes('address-evidence-high-risk-mode-blocks-external-processing'));
  assert.ok(record.requiredControls.includes('high-risk-no-external-processing'));
  assert.equal(validateAddressEvidenceVaultRecord(record).ok, false);
});

test('AI learning requires explicit opt-in and never becomes implicit', () => {
  const rejected = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'feedback.txt',
      mimeType: 'text/plain',
      text: '123 Market Street\n94105',
      encryptedBlobRef: 'local-vault://blob/feedback',
    },
    requestAiLearning: true,
    createdAt,
  });

  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.consent.aiLearningMode, 'disabled');
  assert.ok(rejected.errors.includes('address-evidence-ai-learning-requires-explicit-consent'));

  const allowed = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'feedback.txt',
      mimeType: 'text/plain',
      text: '123 Market Street\n94105',
      encryptedBlobRef: 'local-vault://blob/feedback',
    },
    requestAiLearning: true,
    explicitAiLearningConsent: true,
    consentReceiptRef: 'consent:learning:local',
    createdAt,
  });

  assert.equal(allowed.status, 'ready');
  assert.equal(allowed.consent.aiLearningMode, 'explicit-opt-in-only');
  assert.ok(allowed.requiredControls.includes('ai-learning-consent-receipt-required'));
  assert.equal(validateAddressEvidenceVaultRecord(allowed).ok, true);
});

test('rejects metadata that tries to smuggle raw address or contact material', () => {
  const record = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'statement.pdf',
      mimeType: 'application/pdf',
      text: '123 Market Street\n94105',
      encryptedBlobRef: 'local-vault://blob/statement',
    },
    metadata: {
      rawAddress: '123 Market Street',
      phone: '+1 415 555 0100',
    },
    createdAt,
  });

  assert.equal(record.status, 'rejected');
  assert.ok(record.errors.includes('address-evidence-metadata-contains-private-material'));
  assert.match(record.metadataCommitment ?? '', /^meta_[a-f0-9]{32}$/);
  assert.doesNotMatch(JSON.stringify(record.publicProjection), /123 Market Street|415 555 0100/i);
});

test('builds a verifier proof envelope without disclosing source documents or verifier-side storage rights', () => {
  const record = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'utility-bill.pdf',
      mimeType: 'application/pdf',
      text: [
        'Recipient: Jane Example',
        '123 Market Street',
        'San Francisco, CA 94105',
      ].join('\n'),
      sizeBytes: 84_000,
      encryptedBlobRef: 'local-vault://blob/abc',
    },
    purpose: 'identity',
    createdAt,
  });

  const presentation = buildAddressEvidenceVaultPresentation({
    record,
    claim: 'holder-controls-evidence',
    audienceRef: 'verifier:store-session-ref',
    verifierChallengeRef: 'challenge:short-lived-ref',
    holderCredentialRef: 'credential-ref:aoid-holder-local',
    passkeyAssertionRef: 'passkey-ref:device-local-assertion',
    createdAt,
  });

  assert.equal(presentation.status, 'ready');
  assert.equal(presentation.proofEnvelope.documentDisclosed, false);
  assert.equal(presentation.proofEnvelope.extractedTextDisclosed, false);
  assert.equal(presentation.proofEnvelope.rawAddressDisclosed, false);
  assert.equal(presentation.proofEnvelope.rawContactDisclosed, false);
  assert.equal(presentation.proofEnvelope.verifierServerStorageAllowed, false);
  assert.equal(presentation.proofEnvelope.verifierReceivesCommitmentsOnly, true);
  assert.match(presentation.presentationId, /^presentation_[a-f0-9]{32}$/);
  assert.match(presentation.verifierChallengeCommitment, /^challenge_[a-f0-9]{32}$/);

  const json = JSON.stringify(presentation);
  assert.doesNotMatch(json, /Jane Example|123 Market Street|San Francisco/i);
});

test('reviews redaction and builds a local OCR to verifier proof flow without sharing documents', () => {
  const record = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'utility-bill.pdf',
      mimeType: 'application/pdf',
      text: [
        'Recipient: Jane Example',
        '123 Market Street',
        'San Francisco, CA 94105',
      ].join('\n'),
      encryptedBlobRef: 'local-vault://blob/abc',
    },
    purpose: 'identity',
    createdAt,
  });
  const presentation = buildAddressEvidenceVaultPresentation({
    record,
    claim: 'holder-controls-evidence',
    audienceRef: 'verifier:counterparty-session-ref',
    verifierChallengeRef: 'challenge:short-lived-ref',
    holderCredentialRef: 'credential-ref:aoid-holder-local',
    createdAt,
  });

  const review = reviewAddressEvidenceRedaction(record, createdAt);
  const flow = buildAddressEvidenceVaultFlow(record, presentation, review);
  const serialized = JSON.stringify({ review, flow, presentation });

  assert.equal(review.status, 'passed');
  assert.equal(review.proofReady, true);
  assert.equal(review.documentSharedWithVerifier, false);
  assert.equal(review.extractedTextSharedWithVerifier, false);
  assert.equal(review.verifierReceivesCommitmentsOnly, true);
  assert.equal(review.serverStorageAllowed, false);
  assert.deepEqual(flow.map(step => step.id), ['local-ocr', 'redaction-review', 'holder-binding', 'verifier-proof']);
  assert.ok(flow.every(step => step.status === 'complete'));
  assert.doesNotMatch(serialized, /Jane Example|123 Market Street|San Francisco/i);
});

test('flow asks for local OCR before strong proof when image text is unavailable', () => {
  const record = buildAddressEvidenceVaultRecord({
    document: {
      fileName: 'address-photo.jpg',
      mimeType: 'image/jpeg',
      encryptedBlobRef: 'local-vault://blob/photo',
    },
    purpose: 'identity',
    createdAt,
  });
  const presentation = buildAddressEvidenceVaultPresentation({
    record,
    claim: 'holder-controls-evidence',
    audienceRef: 'verifier:counterparty-session-ref',
    verifierChallengeRef: 'challenge:short-lived-ref',
    createdAt,
  });

  const review = reviewAddressEvidenceRedaction(record, createdAt);
  const flow = buildAddressEvidenceVaultFlow(record, presentation, review);

  assert.equal(review.status, 'needs-review');
  assert.equal(review.proofReady, false);
  assert.equal(flow.find(step => step.id === 'local-ocr')?.status, 'attention');
  assert.equal(flow.find(step => step.id === 'verifier-proof')?.status, 'attention');
  assert.ok(flow.find(step => step.id === 'local-ocr')?.nextAction.includes('local OCR'));
});
