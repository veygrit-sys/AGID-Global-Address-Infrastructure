import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildCallCertifiedEvidenceExport,
  createCallCertifiedSession,
  summarizeCallCertifiedControls,
} from './callCertified';

const baseInput = {
  callId: 'call-credit-card-001',
  purpose: 'contract-confirmation',
  createdAt: '2026-06-17T10:00:00.000Z',
  caller: {
    role: 'organization-agent',
    veyId: 'vey:user:company-agent-123',
    displayAlias: 'Card support agent',
    authenticated: true,
    kycLevel: 2,
    credentialCommitment: 'cred:agent',
    organizationId: 'org:issuer-bank',
  },
  recipient: {
    role: 'recipient',
    veyId: 'vey:user:customer-456',
    displayAlias: 'Customer alias',
    authenticated: true,
    kycLevel: 2,
    credentialCommitment: 'cred:customer',
    addressCommitment: 'addr:customer-home',
  },
  contract: {
    contractId: 'contract:credit-card-789',
    contractCommitment: 'contract:commitment:789',
    contractType: 'credit-card',
    valid: true,
    effectiveAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2027-01-01T00:00:00.000Z',
    addressCommitment: 'addr:customer-home',
  },
  compliance: {
    recordingRequired: true,
    consentRequired: true,
    dataRetention: '7years',
    jurisdiction: 'JP',
    encryptedRecordingRequired: true,
  },
  consent: {
    callerConsent: true,
    recipientConsent: true,
    recordingConsent: true,
    consentedAt: '2026-06-17T09:59:50.000Z',
    consentReceiptCommitment: 'consent:call:001',
  },
  provider: {
    family: 'twilio-voice-like',
    providerCallId: 'twilio-call-alias',
    sipCallId: 'sip-call-private-id',
  },
  evidence: [
    {
      event: 'identity-verified',
      at: '2026-06-17T09:59:00.000Z',
      actorRole: 'system',
      safeSummary: 'Both VeyID identities verified.',
      commitment: 'ev:identity',
      signed: true,
    },
    {
      event: 'contract-bound',
      at: '2026-06-17T09:59:10.000Z',
      actorRole: 'system',
      safeSummary: 'Contract commitment bound.',
      commitment: 'ev:contract',
      signed: true,
    },
  ],
} as const;

test('creates a certified-ready call when identity, contract, consent, and recording controls pass', () => {
  const session = createCallCertifiedSession(baseInput);

  assert.equal(session.status, 'certified-ready');
  assert.equal(session.certificationLevel, 'contract-certified');
  assert.equal(session.purpose, 'contract-confirmation');
  assert.ok(session.requiredControls.includes('both-party-identity-verification'));
  assert.ok(session.requiredControls.includes('recording-consent'));
  assert.equal(session.privacy.rawPhoneStored, false);
  assert.equal(session.privacy.rawContractStored, false);
  assert.match(session.proofHash, /^[a-f0-9]{64}$/);
});

test('requires identity when either party is not authenticated or KYC is too low', () => {
  const session = createCallCertifiedSession({
    ...baseInput,
    minKycLevel: 2,
    recipient: {
      ...baseInput.recipient,
      authenticated: false,
      kycLevel: 1,
    },
  });

  assert.equal(session.status, 'requires-identity');
  assert.equal(summarizeCallCertifiedControls(session).badge, 'Not Certified');
});

test('requires consent when recording is required but recording consent is missing', () => {
  const session = createCallCertifiedSession({
    ...baseInput,
    consent: {
      ...baseInput.consent,
      recordingConsent: false,
    },
  });

  assert.equal(session.status, 'requires-consent');
  assert.match(summarizeCallCertifiedControls(session).operatorMessage, /Capture caller/u);
});

test('rejects private raw phone, email, contract, transcript, or recording URL material', () => {
  const session = createCallCertifiedSession({
    ...baseInput,
    caller: {
      ...baseInput.caller,
      phone: '+81-90-1234-5678',
    },
    contract: {
      ...baseInput.contract,
      rawContract: 'full private contract text',
    },
    evidence: [
      {
        event: 'important-statement-marked',
        rawTranscript: 'customer said private address and phone',
        recordingUrl: 'https://recordings.example/private.wav',
        phoneNumber: '+1 555 555 1212',
      },
    ],
  });

  assert.equal(session.status, 'rejected');
  assert.ok(session.errors.includes('call-certified-input-contains-private-material'));
  assert.equal(session.privacy.rawTranscriptStored, false);
  assert.equal(session.privacy.rawRecordingUrlStored, false);
});

test('marks completed evidence-certified calls only when signed end evidence exists', () => {
  const session = createCallCertifiedSession({
    ...baseInput,
    startedAt: '2026-06-17T10:01:00.000Z',
    endedAt: '2026-06-17T10:08:00.000Z',
    evidence: [
      ...baseInput.evidence,
      {
        event: 'recording-consent-captured',
        at: '2026-06-17T10:00:30.000Z',
        actorRole: 'operator',
        safeSummary: 'Recording consent captured.',
        commitment: 'ev:recording-consent',
        signed: true,
      },
      {
        event: 'call-ended',
        at: '2026-06-17T10:08:00.000Z',
        actorRole: 'system',
        safeSummary: 'Call ended normally.',
        commitment: 'ev:ended',
        signed: true,
      },
    ],
  });

  assert.equal(session.status, 'completed');
  assert.equal(session.certificationLevel, 'evidence-certified');
});

test('evidence export is redacted and warns before completion', () => {
  const session = createCallCertifiedSession(baseInput);
  const exportPlan = buildCallCertifiedEvidenceExport(session, '2026-06-17T10:10:00.000Z');

  assert.equal(exportPlan.status, 'certified-ready');
  assert.equal(exportPlan.includesRecordingEnvelope, true);
  assert.equal(exportPlan.privacy.rawRecordingUrlStored, false);
  assert.ok(exportPlan.pdfSections.includes('evidence-timeline'));
  assert.ok(exportPlan.jsonFields.includes('proofHash'));
  assert.ok(exportPlan.warnings.includes('call-certified-export-before-call-completion'));
});
