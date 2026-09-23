import {
  ADDRESS_DOCUMENT_READING_VERSION,
  readAddressDocument,
  type AddressDocumentCandidate,
  type AddressDocumentFieldKey,
  type AddressDocumentKind,
  type AddressDocumentReadInput,
  type AddressDocumentReadResult,
} from './addressDocumentReading';
import { sha256Hex } from './sha256';

export const ADDRESS_EVIDENCE_VAULT_VERSION = 'agid-address-evidence-vault-v1';

export const ADDRESS_EVIDENCE_SOURCE_KINDS = [
  'photo',
  'pdf',
  'id-document',
  'utility-bill',
  'shipping-label',
  'lease',
  'government-letter',
  'text',
  'other',
] as const;

export const ADDRESS_EVIDENCE_STORAGE_MODES = [
  'local-encrypted',
  'self-hosted-encrypted',
  'managed-encrypted',
  'external-adapter-encrypted',
] as const;

export const ADDRESS_EVIDENCE_PROCESSING_MODES = [
  'local-only',
  'local-ocr-required',
  'external-adapter-blocked',
  'external-adapter-consented',
] as const;

export const ADDRESS_EVIDENCE_VAULT_STATUSES = ['ready', 'needs-review', 'needs-ocr', 'rejected'] as const;

export type AddressEvidenceSourceKind = typeof ADDRESS_EVIDENCE_SOURCE_KINDS[number];
export type AddressEvidenceStorageMode = typeof ADDRESS_EVIDENCE_STORAGE_MODES[number];
export type AddressEvidenceProcessingMode = typeof ADDRESS_EVIDENCE_PROCESSING_MODES[number];
export type AddressEvidenceVaultStatus = typeof ADDRESS_EVIDENCE_VAULT_STATUSES[number];

export type AddressEvidenceVaultDocumentInput = AddressDocumentReadInput & {
  sizeBytes?: number;
  contentHash?: string;
  encryptedBlobRef?: string;
  ciphertextCommitment?: string;
  sourceKind?: AddressEvidenceSourceKind | string;
};

export type AddressEvidenceVaultInput = {
  document: AddressEvidenceVaultDocumentInput;
  documentResult?: AddressDocumentReadResult;
  storageMode?: AddressEvidenceStorageMode | string;
  allowExternalProcessing?: boolean;
  explicitExternalProcessingConsent?: boolean;
  requestAiLearning?: boolean;
  explicitAiLearningConsent?: boolean;
  includeLocalEditDraft?: boolean;
  highRiskMode?: boolean;
  purpose?: string;
  vaultScope?: string;
  createdAt?: string;
  expiresAt?: string;
  consentReceiptRef?: string;
  metadata?: unknown;
};

export type AddressEvidenceRedactedCandidate = {
  field: AddressDocumentFieldKey;
  confidence: number;
  source: AddressDocumentCandidate['source'];
  evidenceCommitment: string;
  valueCommitment: string;
  redactedPreview: string;
  disclosure: 'commitment-only' | 'coarse-preview';
};

export type AddressEvidenceVaultFileDescriptor = {
  fileNameCommitment: string;
  mimeType: string;
  sizeBucket: string;
  contentCommitment: string;
  encryptedBlobRef?: string;
  ciphertextCommitment: string;
  originalFileNameStored: false;
  rawDocumentStored: false;
};

export type AddressEvidenceVaultExtraction = {
  documentReadingVersion: typeof ADDRESS_DOCUMENT_READING_VERSION;
  documentStatus: AddressDocumentReadResult['status'];
  confidence: number;
  candidateCount: number;
  fieldsDetected: AddressDocumentFieldKey[];
  redactedCandidates: AddressEvidenceRedactedCandidate[];
  localEditDraft?: Partial<Record<AddressDocumentFieldKey, string>>;
  localEditDraftStorage: 'transient-device-memory' | 'not-included';
  extractedTextStored: false;
  rawCandidateValuesStoredInPublicRecord: false;
};

export type AddressEvidenceVaultConsent = {
  externalProcessingAllowed: boolean;
  explicitExternalProcessingConsent: boolean;
  aiLearningRequested: boolean;
  explicitAiLearningConsent: boolean;
  aiLearningMode: 'disabled' | 'explicit-opt-in-only';
  consentReceiptCommitment?: string;
};

export type AddressEvidenceVaultPrivacy = {
  storesEncryptedOnly: true;
  publicRecordContainsRawDocument: false;
  publicRecordContainsRawAddress: false;
  publicRecordContainsRawContact: false;
  publicRecordContainsRawAgidOrAoid: false;
  aiLearningRequiresExplicitConsent: true;
  externalSendDefault: 'blocked';
  externalAdapterPolicy: 'optional-explicit-consent-only';
};

export type AddressEvidenceVaultPublicProjection = {
  version: typeof ADDRESS_EVIDENCE_VAULT_VERSION;
  vaultId: string;
  status: AddressEvidenceVaultStatus;
  sourceKind: AddressEvidenceSourceKind;
  mediaKind: AddressDocumentKind;
  storageMode: AddressEvidenceStorageMode;
  processingMode: AddressEvidenceProcessingMode;
  purpose: string;
  createdAt: string;
  expiresAt?: string;
  evidenceCommitment: string;
  fieldsDetected: AddressDocumentFieldKey[];
  redactedCandidates: AddressEvidenceRedactedCandidate[];
  requiredControls: string[];
  privacy: AddressEvidenceVaultPrivacy;
  warnings: string[];
  errors: string[];
};

export type AddressEvidenceVaultRecord = {
  version: typeof ADDRESS_EVIDENCE_VAULT_VERSION;
  vaultId: string;
  status: AddressEvidenceVaultStatus;
  sourceKind: AddressEvidenceSourceKind;
  mediaKind: AddressDocumentKind;
  storageMode: AddressEvidenceStorageMode;
  processingMode: AddressEvidenceProcessingMode;
  purpose: string;
  highRiskMode: boolean;
  createdAt: string;
  expiresAt?: string;
  file: AddressEvidenceVaultFileDescriptor;
  extraction: AddressEvidenceVaultExtraction;
  consent: AddressEvidenceVaultConsent;
  metadataCommitment?: string;
  requiredControls: string[];
  privacy: AddressEvidenceVaultPrivacy;
  warnings: string[];
  errors: string[];
  publicProjection: AddressEvidenceVaultPublicProjection;
};

export type AddressEvidenceVaultValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export type AddressEvidenceRedactionReview = {
  status: 'passed' | 'needs-review' | 'blocked';
  proofReady: boolean;
  checkedAt: string;
  hiddenFields: AddressDocumentFieldKey[];
  commitmentCount: number;
  coarsePreviewCount: number;
  documentSharedWithVerifier: false;
  extractedTextSharedWithVerifier: false;
  verifierReceivesCommitmentsOnly: true;
  serverStorageAllowed: false;
  summary: string[];
  warnings: string[];
  errors: string[];
};

export type AddressEvidenceVaultFlowStepId =
  | 'local-ocr'
  | 'redaction-review'
  | 'holder-binding'
  | 'verifier-proof';

export type AddressEvidenceVaultFlowStep = {
  id: AddressEvidenceVaultFlowStepId;
  label: string;
  status: 'complete' | 'attention' | 'blocked';
  evidenceRefs: string[];
  nextAction: string;
};

export const ADDRESS_EVIDENCE_PRESENTATION_CLAIMS = [
  'holder-controls-evidence',
  'address-evidence-present',
  'residence-evidence-present',
  'recipient-matches-evidence',
] as const;

export type AddressEvidencePresentationClaim = typeof ADDRESS_EVIDENCE_PRESENTATION_CLAIMS[number];

export type AddressEvidencePresentationInput = {
  record: AddressEvidenceVaultRecord;
  claim?: AddressEvidencePresentationClaim | string;
  audienceRef?: string;
  verifierChallengeRef?: string;
  holderCredentialRef?: string;
  passkeyAssertionRef?: string;
  createdAt?: string;
  expiresAt?: string;
};

export type AddressEvidenceVaultPresentation = {
  version: `${typeof ADDRESS_EVIDENCE_VAULT_VERSION}-presentation-v1`;
  presentationId: string;
  claim: AddressEvidencePresentationClaim;
  vaultId: string;
  status: 'ready' | 'needs-review' | 'blocked';
  audienceRef: string;
  verifierChallengeCommitment: string;
  holderBindingRefs: {
    holderCredentialRef?: string;
    passkeyAssertionRef?: string;
    evidenceCommitment: string;
  };
  disclosedFields: Array<{
    field: AddressDocumentFieldKey;
    evidenceCommitment: string;
    valueCommitment: string;
    disclosure: AddressEvidenceRedactedCandidate['disclosure'];
  }>;
  proofEnvelope: {
    documentDisclosed: false;
    extractedTextDisclosed: false;
    rawAddressDisclosed: false;
    rawContactDisclosed: false;
    verifierServerStorageAllowed: false;
    verifierReceivesCommitmentsOnly: true;
  };
  createdAt: string;
  expiresAt: string;
  warnings: string[];
  errors: string[];
};

const DEFAULT_CREATED_AT = '2026-06-17T00:00:00.000Z';
const PRIVATE_METADATA_KEY_RE = /(raw.*address|address.*raw|recipient|phone|email|contact|latitude|longitude|lat|lng|agid|aoid|room|floor|passport|driver.?license|id.?number)/i;
const PRIVATE_VALUE_RE = /(\bAGID[-_A-Z0-9]*\b|\bAOID[-_A-Z0-9]*\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{7,}\d|\b-?\d{1,2}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,})/i;
const PUBLIC_PRIVATE_VALUE_RE = /(\bAGID[-_A-Z0-9]*\b|\bAOID[-_A-Z0-9]*\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+\d[\d\s().-]{7,}\d|\b-?\d{1,2}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,})/i;

function clean(value: unknown) {
  return String(value ?? '').replace(/\u0000/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeTimestamp(value: unknown, fallback = DEFAULT_CREATED_AT) {
  const text = clean(value) || fallback;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function normalizePurpose(value: unknown) {
  const purpose = clean(value).toLowerCase().replace(/[^a-z0-9:-]+/g, '-').replace(/^-+|-+$/g, '');
  return purpose || 'address-evidence';
}

function normalizeSourceKind(value: unknown, mediaKind: AddressDocumentKind, fileName = ''): AddressEvidenceSourceKind {
  const source = clean(value).toLowerCase();
  if ((ADDRESS_EVIDENCE_SOURCE_KINDS as readonly string[]).includes(source)) return source as AddressEvidenceSourceKind;

  const name = fileName.toLowerCase();
  if (name.includes('utility') || name.includes('bill') || name.includes('invoice') || name.includes('公共料金')) {
    return 'utility-bill';
  }
  if (name.includes('label') || name.includes('waybill') || name.includes('送り状')) return 'shipping-label';
  if (name.includes('lease') || name.includes('rent')) return 'lease';
  if (name.includes('passport') || name.includes('license') || name.includes('id')) return 'id-document';
  if (mediaKind === 'pdf') return 'pdf';
  if (mediaKind === 'image') return 'photo';
  if (mediaKind === 'text') return 'text';
  return 'other';
}

function normalizeStorageMode(value: unknown): AddressEvidenceStorageMode {
  const mode = clean(value).toLowerCase();
  if ((ADDRESS_EVIDENCE_STORAGE_MODES as readonly string[]).includes(mode)) return mode as AddressEvidenceStorageMode;
  return 'local-encrypted';
}

function normalizePresentationClaim(value: unknown): AddressEvidencePresentationClaim {
  const claim = clean(value);
  if ((ADDRESS_EVIDENCE_PRESENTATION_CLAIMS as readonly string[]).includes(claim)) {
    return claim as AddressEvidencePresentationClaim;
  }
  return 'holder-controls-evidence';
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;

  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(',')}}`;
}

function hasPrivateMetadata(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return PRIVATE_VALUE_RE.test(value);
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasPrivateMetadata);

  return Object.entries(value as Record<string, unknown>).some(([key, entry]) => (
    PRIVATE_METADATA_KEY_RE.test(key) || hasPrivateMetadata(entry)
  ));
}

function sizeBucket(sizeBytes?: number) {
  if (!Number.isFinite(sizeBytes)) return 'unknown';
  const size = Number(sizeBytes);
  if (size <= 100 * 1024) return '<=100kb';
  if (size <= 1024 * 1024) return '<=1mb';
  if (size <= 10 * 1024 * 1024) return '<=10mb';
  return '>10mb';
}

function compactHash(value: unknown, prefix: string) {
  return `${prefix}_${sha256Hex(stableJson(value)).slice(0, 32)}`;
}

function redactedPreview(candidate: AddressDocumentCandidate, highRiskMode: boolean) {
  const value = clean(candidate.value);
  if (!value) return `${candidate.field}:empty`;
  if (candidate.field === 'country') return `country:${value.toUpperCase().slice(0, 2)}`;
  if (candidate.field === 'postcode') {
    const tail = value.replace(/\s+/g, '').slice(-3);
    return `postcode:*${tail || 'present'}`;
  }
  if (candidate.field === 'city' || candidate.field === 'state') {
    if (highRiskMode) return `${candidate.field}:present`;
    return `${candidate.field}:${value.slice(0, 2)}...`;
  }
  return `${candidate.field}:present`;
}

function redactedCandidates(
  candidates: readonly AddressDocumentCandidate[],
  scope: string,
  highRiskMode: boolean,
): AddressEvidenceRedactedCandidate[] {
  return candidates.map(candidate => ({
    field: candidate.field,
    confidence: candidate.confidence,
    source: candidate.source,
    evidenceCommitment: compactHash({ scope, evidence: candidate.evidence, source: candidate.source }, 'evd'),
    valueCommitment: compactHash({ scope, field: candidate.field, value: candidate.value }, 'val'),
    redactedPreview: redactedPreview(candidate, highRiskMode),
    disclosure: candidate.field === 'country' || (candidate.field === 'postcode' && !highRiskMode)
      ? 'coarse-preview'
      : 'commitment-only',
  }));
}

function fieldsDetected(candidates: readonly AddressDocumentCandidate[]) {
  return Array.from(new Set(candidates.map(candidate => candidate.field))).sort();
}

function processingModeFor(
  result: AddressDocumentReadResult,
  allowExternalProcessing: boolean,
  explicitExternalProcessingConsent: boolean,
): AddressEvidenceProcessingMode {
  if (allowExternalProcessing && explicitExternalProcessingConsent) return 'external-adapter-consented';
  if (allowExternalProcessing) return 'external-adapter-blocked';
  if (result.status === 'needs-ocr-engine') return 'local-ocr-required';
  return 'local-only';
}

function statusFor(result: AddressDocumentReadResult, errors: readonly string[]): AddressEvidenceVaultStatus {
  if (errors.length) return 'rejected';
  if (result.status === 'needs-ocr-engine') return 'needs-ocr';
  if (result.status === 'ready') return 'ready';
  return 'needs-review';
}

function controlsFor(input: {
  recordStatus: AddressEvidenceVaultStatus;
  processingMode: AddressEvidenceProcessingMode;
  includeLocalDraft: boolean;
  highRiskMode: boolean;
  aiLearningRequested: boolean;
}) {
  const controls = [
    'encrypted-storage-required',
    'no-default-external-send',
    'public-projection-redacted',
    'raw-document-not-in-public-record',
    'ai-learning-explicit-consent',
    'audit-commitment-record',
  ];

  if (input.includeLocalDraft) controls.push('edit-draft-transient-local-only');
  if (input.recordStatus === 'needs-ocr') controls.push('local-ocr-worker-required');
  if (input.processingMode === 'external-adapter-consented') controls.push('external-adapter-explicit-consent');
  if (input.aiLearningRequested) controls.push('ai-learning-consent-receipt-required');
  if (input.highRiskMode) {
    controls.push('high-risk-no-external-processing');
    controls.push('short-retention-recommended');
    controls.push('recipient-safety-review');
  }

  return Array.from(new Set(controls));
}

function buildPrivacy(): AddressEvidenceVaultPrivacy {
  return {
    storesEncryptedOnly: true,
    publicRecordContainsRawDocument: false,
    publicRecordContainsRawAddress: false,
    publicRecordContainsRawContact: false,
    publicRecordContainsRawAgidOrAoid: false,
    aiLearningRequiresExplicitConsent: true,
    externalSendDefault: 'blocked',
    externalAdapterPolicy: 'optional-explicit-consent-only',
  };
}

export function buildAddressEvidenceVaultRecord(input: AddressEvidenceVaultInput): AddressEvidenceVaultRecord {
  const createdAt = clean(input.createdAt) || DEFAULT_CREATED_AT;
  const documentResult = input.documentResult ?? readAddressDocument(input.document);
  const purpose = normalizePurpose(input.purpose);
  const vaultScope = normalizePurpose(input.vaultScope || purpose);
  const sourceKind = normalizeSourceKind(input.document.sourceKind, documentResult.kind, input.document.fileName);
  const storageMode = normalizeStorageMode(input.storageMode);
  const allowExternalProcessing = Boolean(input.allowExternalProcessing);
  const explicitExternalProcessingConsent = Boolean(input.explicitExternalProcessingConsent);
  const aiLearningRequested = Boolean(input.requestAiLearning);
  const explicitAiLearningConsent = Boolean(input.explicitAiLearningConsent);
  const highRiskMode = Boolean(input.highRiskMode);
  const includeLocalDraft = input.includeLocalEditDraft !== false;
  const warnings = [...documentResult.warnings];
  const errors: string[] = [];

  if (allowExternalProcessing && !explicitExternalProcessingConsent) {
    errors.push('address-evidence-external-processing-requires-explicit-consent');
  }
  if (highRiskMode && allowExternalProcessing) {
    errors.push('address-evidence-high-risk-mode-blocks-external-processing');
  }
  if (aiLearningRequested && !explicitAiLearningConsent) {
    errors.push('address-evidence-ai-learning-requires-explicit-consent');
  }
  if (hasPrivateMetadata(input.metadata)) {
    errors.push('address-evidence-metadata-contains-private-material');
  }
  if (storageMode !== 'local-encrypted') {
    warnings.push('address-evidence-non-local-storage-requires-key-management-review');
  }
  if (!input.document.encryptedBlobRef && !input.document.ciphertextCommitment) {
    warnings.push('address-evidence-encrypted-blob-reference-missing');
  }
  if (documentResult.status === 'needs-ocr-engine') {
    warnings.push('address-evidence-local-ocr-engine-required-before-autofill');
  }

  const processingMode = processingModeFor(documentResult, allowExternalProcessing, explicitExternalProcessingConsent);
  const status = statusFor(documentResult, errors);
  const evidenceCommitment = compactHash(
    {
      contentHash: input.document.contentHash,
      extractedText: documentResult.extractedText,
      candidates: documentResult.candidates,
      createdAt,
      purpose,
      vaultScope,
    },
    'evidence',
  );
  const vaultId = compactHash(
    {
      version: ADDRESS_EVIDENCE_VAULT_VERSION,
      evidenceCommitment,
      fileName: input.document.fileName,
      mimeType: input.document.mimeType,
      createdAt,
    },
    'vault',
  );
  const redacted = redactedCandidates(documentResult.candidates, vaultScope, highRiskMode);
  const detectedFields = fieldsDetected(documentResult.candidates);
  const privacy = buildPrivacy();
  const consentReceiptCommitment = input.consentReceiptRef
    ? compactHash({ consentReceiptRef: input.consentReceiptRef, purpose, createdAt }, 'consent')
    : undefined;
  const metadataCommitment = input.metadata === undefined ? undefined : compactHash(input.metadata, 'meta');
  const requiredControls = controlsFor({
    recordStatus: status,
    processingMode,
    includeLocalDraft,
    highRiskMode,
    aiLearningRequested,
  });

  const publicProjection: AddressEvidenceVaultPublicProjection = {
    version: ADDRESS_EVIDENCE_VAULT_VERSION,
    vaultId,
    status,
    sourceKind,
    mediaKind: documentResult.kind,
    storageMode,
    processingMode,
    purpose,
    createdAt,
    expiresAt: clean(input.expiresAt) || undefined,
    evidenceCommitment,
    fieldsDetected: detectedFields,
    redactedCandidates: redacted,
    requiredControls,
    privacy,
    warnings,
    errors,
  };

  return {
    version: ADDRESS_EVIDENCE_VAULT_VERSION,
    vaultId,
    status,
    sourceKind,
    mediaKind: documentResult.kind,
    storageMode,
    processingMode,
    purpose,
    highRiskMode,
    createdAt,
    expiresAt: clean(input.expiresAt) || undefined,
    file: {
      fileNameCommitment: compactHash(input.document.fileName || 'unnamed', 'file'),
      mimeType: clean(input.document.mimeType || 'application/octet-stream').toLowerCase(),
      sizeBucket: sizeBucket(input.document.sizeBytes),
      contentCommitment: input.document.contentHash
        ? compactHash({ contentHash: input.document.contentHash }, 'content')
        : compactHash({ extractedText: documentResult.extractedText, fileName: input.document.fileName }, 'content'),
      encryptedBlobRef: clean(input.document.encryptedBlobRef) || undefined,
      ciphertextCommitment: clean(input.document.ciphertextCommitment)
        || compactHash({ evidenceCommitment, encryptedBlobRef: input.document.encryptedBlobRef }, 'cipher'),
      originalFileNameStored: false,
      rawDocumentStored: false,
    },
    extraction: {
      documentReadingVersion: ADDRESS_DOCUMENT_READING_VERSION,
      documentStatus: documentResult.status,
      confidence: documentResult.confidence,
      candidateCount: documentResult.candidates.length,
      fieldsDetected: detectedFields,
      redactedCandidates: redacted,
      localEditDraft: includeLocalDraft ? documentResult.patch : undefined,
      localEditDraftStorage: includeLocalDraft ? 'transient-device-memory' : 'not-included',
      extractedTextStored: false,
      rawCandidateValuesStoredInPublicRecord: false,
    },
    consent: {
      externalProcessingAllowed: allowExternalProcessing && explicitExternalProcessingConsent && !highRiskMode,
      explicitExternalProcessingConsent,
      aiLearningRequested,
      explicitAiLearningConsent,
      aiLearningMode: aiLearningRequested && explicitAiLearningConsent ? 'explicit-opt-in-only' : 'disabled',
      consentReceiptCommitment,
    },
    metadataCommitment,
    requiredControls,
    privacy,
    warnings,
    errors,
    publicProjection,
  };
}

export function redactAddressEvidenceVaultRecord(
  record: AddressEvidenceVaultRecord,
): AddressEvidenceVaultPublicProjection {
  return {
    ...record.publicProjection,
    redactedCandidates: record.publicProjection.redactedCandidates.map(candidate => ({ ...candidate })),
    fieldsDetected: [...record.publicProjection.fieldsDetected],
    requiredControls: [...record.publicProjection.requiredControls],
    warnings: [...record.publicProjection.warnings],
    errors: [...record.publicProjection.errors],
  };
}

export function validateAddressEvidenceVaultRecord(record: AddressEvidenceVaultRecord): AddressEvidenceVaultValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (record.version !== ADDRESS_EVIDENCE_VAULT_VERSION) errors.push('address-evidence-vault-version-mismatch');
  if (record.extraction.extractedTextStored !== false) errors.push('address-evidence-extracted-text-must-not-be-persisted');
  if (record.file.rawDocumentStored !== false) errors.push('address-evidence-raw-document-must-not-be-persisted');
  if (record.file.originalFileNameStored !== false) errors.push('address-evidence-original-file-name-must-not-be-persisted');
  if (!record.requiredControls.includes('encrypted-storage-required')) errors.push('address-evidence-encrypted-storage-control-missing');
  if (!record.requiredControls.includes('public-projection-redacted')) errors.push('address-evidence-redaction-control-missing');
  if (record.consent.aiLearningRequested && !record.consent.explicitAiLearningConsent) {
    errors.push('address-evidence-ai-learning-consent-invalid');
  }
  if (record.processingMode === 'external-adapter-consented' && !record.consent.explicitExternalProcessingConsent) {
    errors.push('address-evidence-external-consent-invalid');
  }
  if (record.highRiskMode && record.consent.externalProcessingAllowed) {
    errors.push('address-evidence-high-risk-external-processing-invalid');
  }

  const publicFreeText = [
    record.publicProjection.purpose,
    ...record.publicProjection.redactedCandidates.map(candidate => candidate.redactedPreview),
    ...record.publicProjection.warnings,
    ...record.publicProjection.errors,
  ].join('\n');
  if (PUBLIC_PRIVATE_VALUE_RE.test(publicFreeText)) {
    errors.push('address-evidence-public-projection-contains-private-token');
  }

  const longPreview = record.publicProjection.redactedCandidates.find(candidate => candidate.redactedPreview.length > 32);
  if (longPreview) warnings.push('address-evidence-redacted-preview-too-long');

  if (record.status === 'needs-ocr' && !record.requiredControls.includes('local-ocr-worker-required')) {
    errors.push('address-evidence-ocr-control-missing');
  }

  return {
    ok: errors.length === 0 && record.status !== 'rejected',
    errors,
    warnings,
  };
}

export function reviewAddressEvidenceRedaction(
  record: AddressEvidenceVaultRecord,
  checkedAt = DEFAULT_CREATED_AT,
): AddressEvidenceRedactionReview {
  const validation = validateAddressEvidenceVaultRecord(record);
  const errors = [...validation.errors];
  const warnings = [...validation.warnings, ...record.warnings];

  if (record.status === 'rejected') errors.push('address-evidence-record-rejected');
  if (record.status === 'needs-ocr') warnings.push('address-evidence-local-ocr-required-before-proof');
  if (record.extraction.redactedCandidates.length === 0) warnings.push('address-evidence-no-redacted-candidates-to-review');
  if (record.publicProjection.privacy.publicRecordContainsRawDocument !== false) {
    errors.push('address-evidence-public-record-raw-document-not-blocked');
  }
  if (record.publicProjection.privacy.publicRecordContainsRawAddress !== false) {
    errors.push('address-evidence-public-record-raw-address-not-blocked');
  }

  const hiddenFields = Array.from(new Set(record.extraction.redactedCandidates
    .filter(candidate => candidate.disclosure === 'commitment-only')
    .map(candidate => candidate.field)))
    .sort();
  const coarsePreviewCount = record.extraction.redactedCandidates
    .filter(candidate => candidate.disclosure === 'coarse-preview').length;
  const commitmentCount = record.extraction.redactedCandidates.length;
  const status: AddressEvidenceRedactionReview['status'] = errors.length > 0
    ? 'blocked'
    : record.status === 'ready'
      ? 'passed'
      : 'needs-review';

  return {
    status,
    proofReady: status === 'passed',
    checkedAt: normalizeTimestamp(checkedAt),
    hiddenFields,
    commitmentCount,
    coarsePreviewCount,
    documentSharedWithVerifier: false,
    extractedTextSharedWithVerifier: false,
    verifierReceivesCommitmentsOnly: true,
    serverStorageAllowed: false,
    summary: [
      'source-document-stays-local',
      'raw-text-not-disclosed',
      'candidate-values-commitment-only',
      'verifier-receives-proof-envelope-only',
    ],
    warnings: Array.from(new Set(warnings)),
    errors: Array.from(new Set(errors)),
  };
}

function stepStatus(condition: boolean, attention: boolean): AddressEvidenceVaultFlowStep['status'] {
  if (condition) return 'complete';
  return attention ? 'attention' : 'blocked';
}

export function buildAddressEvidenceVaultFlow(
  record: AddressEvidenceVaultRecord,
  presentation: AddressEvidenceVaultPresentation,
  review = reviewAddressEvidenceRedaction(record),
): AddressEvidenceVaultFlowStep[] {
  const hasLocalTextOrNotNeeded = record.status !== 'needs-ocr';
  const holderBound = Boolean(presentation.holderBindingRefs.holderCredentialRef || presentation.holderBindingRefs.passkeyAssertionRef);
  const proofReady = presentation.status === 'ready'
    && review.proofReady
    && presentation.proofEnvelope.documentDisclosed === false
    && presentation.proofEnvelope.verifierServerStorageAllowed === false;

  return [
    {
      id: 'local-ocr',
      label: 'Local OCR / text layer',
      status: stepStatus(hasLocalTextOrNotNeeded, record.status === 'needs-ocr'),
      evidenceRefs: [
        record.extraction.documentReadingVersion,
        record.extraction.documentStatus,
        record.processingMode,
      ],
      nextAction: hasLocalTextOrNotNeeded
        ? 'Review extracted field candidates locally.'
        : 'Run a local OCR worker or paste a local text layer before proving.',
    },
    {
      id: 'redaction-review',
      label: 'Redaction review',
      status: review.status === 'passed' ? 'complete' : review.status === 'needs-review' ? 'attention' : 'blocked',
      evidenceRefs: [
        `commitments:${review.commitmentCount}`,
        `hidden-fields:${review.hiddenFields.length}`,
        `coarse-preview:${review.coarsePreviewCount}`,
      ],
      nextAction: review.status === 'passed'
        ? 'Generate a verifier proof envelope.'
        : 'Confirm redaction before sharing any proof.',
    },
    {
      id: 'holder-binding',
      label: 'Holder binding',
      status: stepStatus(holderBound, true),
      evidenceRefs: [
        presentation.holderBindingRefs.holderCredentialRef ?? 'credential-ref-missing',
        presentation.holderBindingRefs.passkeyAssertionRef ?? 'passkey-ref-missing',
      ],
      nextAction: holderBound
        ? 'Bind proof to verifier challenge and audience.'
        : 'Add an AOID credential or passkey assertion reference.',
    },
    {
      id: 'verifier-proof',
      label: 'Proof to verifier',
      status: proofReady ? 'complete' : presentation.status === 'blocked' ? 'blocked' : 'attention',
      evidenceRefs: [
        presentation.presentationId,
        presentation.verifierChallengeCommitment,
        `commitments-only:${String(presentation.proofEnvelope.verifierReceivesCommitmentsOnly)}`,
      ],
      nextAction: proofReady
        ? 'Share only the proof envelope; do not send the source document.'
        : 'Resolve OCR, redaction, or holder-binding warnings before handoff.',
    },
  ];
}

export function buildAddressEvidenceVaultPresentation(
  input: AddressEvidencePresentationInput,
): AddressEvidenceVaultPresentation {
  const record = input.record;
  const createdAt = clean(input.createdAt) || DEFAULT_CREATED_AT;
  const expiresAt = clean(input.expiresAt) || new Date(new Date(createdAt).getTime() + 10 * 60 * 1000).toISOString();
  const claim = normalizePresentationClaim(input.claim);
  const audienceRef = clean(input.audienceRef) || 'verifier:local-session';
  const verifierChallengeRef = clean(input.verifierChallengeRef) || 'challenge:local-session';
  const warnings: string[] = [];
  const errors: string[] = [];

  if (record.status === 'rejected') errors.push('address-evidence-record-rejected');
  if (record.status === 'needs-ocr') warnings.push('address-evidence-presentation-needs-local-ocr-before-strong-proof');
  if (!input.holderCredentialRef && !input.passkeyAssertionRef) {
    warnings.push('address-evidence-holder-binding-ref-recommended');
  }

  const validation = validateAddressEvidenceVaultRecord(record);
  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

  const verifierChallengeCommitment = compactHash(
    { verifierChallengeRef, audienceRef, createdAt, claim },
    'challenge',
  );
  const disclosedFields = record.extraction.redactedCandidates.map(candidate => ({
    field: candidate.field,
    evidenceCommitment: candidate.evidenceCommitment,
    valueCommitment: candidate.valueCommitment,
    disclosure: candidate.disclosure,
  }));
  const presentationId = compactHash(
    {
      vaultId: record.vaultId,
      claim,
      audienceRef,
      verifierChallengeCommitment,
      holderCredentialRef: input.holderCredentialRef,
      passkeyAssertionRef: input.passkeyAssertionRef,
      expiresAt,
    },
    'presentation',
  );

  return {
    version: `${ADDRESS_EVIDENCE_VAULT_VERSION}-presentation-v1`,
    presentationId,
    claim,
    vaultId: record.vaultId,
    status: errors.length > 0 ? 'blocked' : record.status === 'ready' ? 'ready' : 'needs-review',
    audienceRef,
    verifierChallengeCommitment,
    holderBindingRefs: {
      holderCredentialRef: clean(input.holderCredentialRef) || undefined,
      passkeyAssertionRef: clean(input.passkeyAssertionRef) || undefined,
      evidenceCommitment: record.publicProjection.evidenceCommitment,
    },
    disclosedFields,
    proofEnvelope: {
      documentDisclosed: false,
      extractedTextDisclosed: false,
      rawAddressDisclosed: false,
      rawContactDisclosed: false,
      verifierServerStorageAllowed: false,
      verifierReceivesCommitmentsOnly: true,
    },
    createdAt,
    expiresAt,
    warnings: Array.from(new Set(warnings)),
    errors: Array.from(new Set(errors)),
  };
}
