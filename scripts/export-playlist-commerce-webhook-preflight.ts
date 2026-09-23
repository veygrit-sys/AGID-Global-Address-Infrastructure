import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runPlaylistCommerceWebhookPreflight } from '../src/lib/playlistCommerceWebhookServer';

export const PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_FIXTURE_PATH = join(
  'docs',
  'specs',
  'fixtures',
  'playlist-commerce-webhook-preflight-v0.1.json',
);

export const PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_HISTORY_FIXTURE_PATH = join(
  'docs',
  'specs',
  'fixtures',
  'playlist-commerce-webhook-preflight-history-v0.1.json',
);

export const PLAYLIST_COMMERCE_WEBHOOK_EVIDENCE_FIXTURE_PATH = join(
  'docs',
  'specs',
  'fixtures',
  'playlist-commerce-webhook-evidence-v0.1.json',
);

const DEFAULT_GENERATED_AT = '2026-07-01T00:00:30.000Z';
const DEFAULT_HISTORY_TIMESTAMPS = [
  '2026-07-01T00:00:30.000Z',
  '2026-07-01T00:02:30.000Z',
  '2026-07-01T00:04:30.000Z',
] as const;

export type PlaylistCommerceWebhookPreflightArtifact = {
  artifact: 'playlist-commerce-webhook-preflight-fixture';
  version: 'v0.1';
  generatedAt: string;
  source: {
    helper: 'runPlaylistCommerceWebhookPreflight';
    safeCommand: 'npm run verify:playlist-commerce';
    localOnly: true;
  };
  report: ReturnType<typeof runPlaylistCommerceWebhookPreflight>;
  verification: {
    expectedAcceptedStatus: 202;
    expectedReplayStatus: 401;
    requiredChecks: string[];
  };
  privacyBoundary: {
    forbiddenMaterial: string[];
    nonClaims: string[];
  };
};

export type PlaylistCommerceWebhookPreflightHistoryRun = {
  runId: string;
  evidenceRef: string;
  generatedAt: string;
  routeId: string;
  eventId: string;
  topic: string;
  passed: boolean;
  acceptedStatus: number;
  replayStatus: number;
  replayBlocked: boolean;
  checkStatuses: Record<string, 'pass' | 'fail'>;
};

export type PlaylistCommerceWebhookPreflightHistoryArtifact = {
  artifact: 'playlist-commerce-webhook-preflight-history-fixture';
  version: 'v0.1';
  generatedAt: string;
  source: {
    helper: 'runPlaylistCommerceWebhookPreflight';
    safeCommand: 'npm run verify:playlist-commerce';
    localOnly: true;
  };
  summary: {
    totalRuns: number;
    passedRuns: number;
    replayBlockedRuns: number;
    latestRunId: string;
    latestEvidenceRef: string;
    latestPassed: boolean;
  };
  operatorAction: {
    exportCommand: 'npm run export:playlist-commerce-webhook-preflight';
    checkCommand: 'npm run verify:playlist-commerce';
    latestEvidenceRef: string;
    nextSafeStep: 'rerun-local-preflight-before-live-webhook-enable';
  };
  runs: PlaylistCommerceWebhookPreflightHistoryRun[];
  privacyBoundary: {
    forbiddenMaterial: string[];
    nonClaims: string[];
  };
};

export type PlaylistCommerceWebhookEvidenceRecord = {
  evidenceRef: string;
  vaultRecordRef: string;
  kind: 'playlist-commerce-webhook-preflight';
  runId: string;
  routeId: string;
  eventRef: string;
  topic: string;
  capturedAt: string;
  status: 'accepted-and-replay-blocked';
  publicProjection: {
    passed: boolean;
    acceptedStatus: number;
    replayStatus: number;
    replayBlocked: boolean;
    checkIds: string[];
    checkStatuses: Record<string, 'pass' | 'fail'>;
  };
  commitments: {
    requestCommitmentRef: string;
    responseCommitmentRef: string;
    checkCommitmentRef: string;
  };
  privacyBoundary: {
    localOnly: true;
    rawPayloadStored: false;
    signatureStored: false;
    secretMaterialStored: false;
    rawAddressStored: false;
    proofWitnessStored: false;
    recipientContactStored: false;
  };
  retention: {
    mode: 'fixture-regenerate-only';
    ttlHours: 24;
  };
  nonClaims: string[];
};

export type PlaylistCommerceWebhookEvidenceArtifact = {
  artifact: 'playlist-commerce-webhook-evidence-fixture';
  version: 'v0.1';
  generatedAt: string;
  source: {
    historyFixture: typeof PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_HISTORY_FIXTURE_PATH;
    safeCommand: 'npm run verify:playlist-commerce';
    localOnly: true;
    managedServiceBoundary: 'fixture-only-not-hosted-evidence-vault';
  };
  summary: {
    totalRecords: number;
    latestEvidenceRef: string;
    linkedHistoryRuns: number;
    allRecordsRedacted: boolean;
  };
  records: PlaylistCommerceWebhookEvidenceRecord[];
  forbiddenMaterial: string[];
  nonClaims: string[];
};

export function buildPlaylistCommerceWebhookPreflightArtifact(
  generatedAt = DEFAULT_GENERATED_AT,
): PlaylistCommerceWebhookPreflightArtifact {
  const report = runPlaylistCommerceWebhookPreflight(generatedAt);
  return {
    artifact: 'playlist-commerce-webhook-preflight-fixture',
    version: 'v0.1',
    generatedAt,
    source: {
      helper: 'runPlaylistCommerceWebhookPreflight',
      safeCommand: 'npm run verify:playlist-commerce',
      localOnly: true,
    },
    report,
    verification: {
      expectedAcceptedStatus: 202,
      expectedReplayStatus: 401,
      requiredChecks: report.checks.map(check => check.id),
    },
    privacyBoundary: {
      forbiddenMaterial: [...report.blockedMaterial],
      nonClaims: [...report.nonClaims],
    },
  };
}

export function buildPlaylistCommerceWebhookPreflightHistoryArtifact(
  generatedAt = DEFAULT_GENERATED_AT,
): PlaylistCommerceWebhookPreflightHistoryArtifact {
  const runs = DEFAULT_HISTORY_TIMESTAMPS.map((timestamp, index): PlaylistCommerceWebhookPreflightHistoryRun => {
    const report = runPlaylistCommerceWebhookPreflight(timestamp);
    return {
      runId: `pc_webhook_preflight_run_${String(index + 1).padStart(3, '0')}`,
      evidenceRef: `pc_webhook_preflight_evidence_${String(index + 1).padStart(3, '0')}`,
      generatedAt: timestamp,
      routeId: report.routeId,
      eventId: report.eventId,
      topic: report.topic,
      passed: report.passed,
      acceptedStatus: report.responseSummary.acceptedStatus,
      replayStatus: report.responseSummary.replayStatus,
      replayBlocked: report.responseSummary.replayStatus === 401 && report.responseSummary.replayErrors.includes('duplicate-event-id'),
      checkStatuses: Object.fromEntries(report.checks.map(check => [check.id, check.status])),
    };
  });
  const latestRun = runs.at(-1);
  const boundaryReport = runPlaylistCommerceWebhookPreflight(generatedAt);

  return {
    artifact: 'playlist-commerce-webhook-preflight-history-fixture',
    version: 'v0.1',
    generatedAt,
    source: {
      helper: 'runPlaylistCommerceWebhookPreflight',
      safeCommand: 'npm run verify:playlist-commerce',
      localOnly: true,
    },
    summary: {
      totalRuns: runs.length,
      passedRuns: runs.filter(run => run.passed).length,
      replayBlockedRuns: runs.filter(run => run.replayBlocked).length,
      latestRunId: latestRun?.runId ?? '',
      latestEvidenceRef: latestRun?.evidenceRef ?? '',
      latestPassed: latestRun?.passed ?? false,
    },
    operatorAction: {
      exportCommand: 'npm run export:playlist-commerce-webhook-preflight',
      checkCommand: 'npm run verify:playlist-commerce',
      latestEvidenceRef: latestRun?.evidenceRef ?? '',
      nextSafeStep: 'rerun-local-preflight-before-live-webhook-enable',
    },
    runs,
    privacyBoundary: {
      forbiddenMaterial: [...boundaryReport.blockedMaterial],
      nonClaims: [...boundaryReport.nonClaims],
    },
  };
}

function evidenceCommitmentRef(prefix: string, value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${prefix}_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function buildPlaylistCommerceWebhookEvidenceArtifact(
  generatedAt = DEFAULT_GENERATED_AT,
): PlaylistCommerceWebhookEvidenceArtifact {
  const history = buildPlaylistCommerceWebhookPreflightHistoryArtifact(generatedAt);
  const records = history.runs.map((run): PlaylistCommerceWebhookEvidenceRecord => {
    const checkIds = Object.keys(run.checkStatuses).sort();
    return {
      evidenceRef: run.evidenceRef,
      vaultRecordRef: `ev_vault_${run.evidenceRef}`,
      kind: 'playlist-commerce-webhook-preflight',
      runId: run.runId,
      routeId: run.routeId,
      eventRef: `event_ref:${run.eventId}`,
      topic: run.topic,
      capturedAt: run.generatedAt,
      status: 'accepted-and-replay-blocked',
      publicProjection: {
        passed: run.passed,
        acceptedStatus: run.acceptedStatus,
        replayStatus: run.replayStatus,
        replayBlocked: run.replayBlocked,
        checkIds,
        checkStatuses: run.checkStatuses,
      },
      commitments: {
        requestCommitmentRef: evidenceCommitmentRef('pc_req', { runId: run.runId, routeId: run.routeId, topic: run.topic }),
        responseCommitmentRef: evidenceCommitmentRef('pc_res', {
          acceptedStatus: run.acceptedStatus,
          replayStatus: run.replayStatus,
          replayBlocked: run.replayBlocked,
        }),
        checkCommitmentRef: evidenceCommitmentRef('pc_chk', run.checkStatuses),
      },
      privacyBoundary: {
        localOnly: true,
        rawPayloadStored: false,
        signatureStored: false,
        secretMaterialStored: false,
        rawAddressStored: false,
        proofWitnessStored: false,
        recipientContactStored: false,
      },
      retention: {
        mode: 'fixture-regenerate-only',
        ttlHours: 24,
      },
      nonClaims: [...history.privacyBoundary.nonClaims],
    };
  });

  return {
    artifact: 'playlist-commerce-webhook-evidence-fixture',
    version: 'v0.1',
    generatedAt,
    source: {
      historyFixture: PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_HISTORY_FIXTURE_PATH,
      safeCommand: 'npm run verify:playlist-commerce',
      localOnly: true,
      managedServiceBoundary: 'fixture-only-not-hosted-evidence-vault',
    },
    summary: {
      totalRecords: records.length,
      latestEvidenceRef: history.summary.latestEvidenceRef,
      linkedHistoryRuns: history.runs.length,
      allRecordsRedacted: records.every(record => (
        record.privacyBoundary.localOnly &&
        !record.privacyBoundary.rawPayloadStored &&
        !record.privacyBoundary.signatureStored &&
        !record.privacyBoundary.secretMaterialStored &&
        !record.privacyBoundary.rawAddressStored &&
        !record.privacyBoundary.proofWitnessStored &&
        !record.privacyBoundary.recipientContactStored
      )),
    },
    records,
    forbiddenMaterial: [...history.privacyBoundary.forbiddenMaterial],
    nonClaims: [...history.privacyBoundary.nonClaims],
  };
}

export function serializePlaylistCommerceWebhookPreflightArtifact(
  artifact = buildPlaylistCommerceWebhookPreflightArtifact(),
): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

export function serializePlaylistCommerceWebhookPreflightHistoryArtifact(
  artifact = buildPlaylistCommerceWebhookPreflightHistoryArtifact(),
): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

export function serializePlaylistCommerceWebhookEvidenceArtifact(
  artifact = buildPlaylistCommerceWebhookEvidenceArtifact(),
): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

export function validatePlaylistCommerceWebhookPreflightArtifact(
  artifact: PlaylistCommerceWebhookPreflightArtifact,
): string[] {
  const errors: string[] = [];
  const text = JSON.stringify(artifact);

  if (artifact.artifact !== 'playlist-commerce-webhook-preflight-fixture') errors.push('invalid-artifact-name');
  if (artifact.version !== 'v0.1') errors.push('invalid-artifact-version');
  if (!artifact.source.localOnly || artifact.report.localOnly !== true) errors.push('not-local-only');
  if (artifact.source.safeCommand !== 'npm run verify:playlist-commerce') errors.push('unsafe-command');
  if (!artifact.report.passed) errors.push('preflight-not-passed');
  if (artifact.report.responseSummary.acceptedStatus !== 202) errors.push('accepted-status-mismatch');
  if (artifact.report.responseSummary.replayStatus !== 401) errors.push('replay-status-mismatch');
  if (!artifact.report.responseSummary.replayErrors.includes('duplicate-event-id')) errors.push('missing-replay-error');
  if (!artifact.verification.requiredChecks.includes('redacted-response')) errors.push('missing-redaction-check');
  if (!artifact.verification.requiredChecks.includes('activation-private-material-blocked')) {
    errors.push('missing-activation-block-check');
  }
  if (artifact.report.activationBlockNegativeCase.id !== 'provider-token-raw-carrier-payload-negative') {
    errors.push('activation-block-case-id-mismatch');
  }
  if (artifact.report.activationBlockNegativeCase.actualStatus !== 401) {
    errors.push('activation-block-status-mismatch');
  }
  if (!artifact.report.activationBlockNegativeCase.errors.includes('forbidden-field:$.providerIdToken')) {
    errors.push('activation-block-provider-token-missing');
  }
  if (!artifact.report.activationBlockNegativeCase.errors.includes('forbidden-field:$.rawCarrierPayload')) {
    errors.push('activation-block-carrier-payload-missing');
  }
  if (!artifact.privacyBoundary.forbiddenMaterial.includes('production_webhook_secret')) {
    errors.push('missing-production-secret-boundary');
  }
  if (!artifact.privacyBoundary.forbiddenMaterial.includes('provider_token')) {
    errors.push('missing-provider-token-boundary');
  }
  if (!artifact.privacyBoundary.forbiddenMaterial.includes('raw_carrier_payload')) {
    errors.push('missing-raw-carrier-payload-boundary');
  }
  if (!artifact.privacyBoundary.nonClaims.includes('not-production-delivery-attempt')) {
    errors.push('missing-delivery-non-claim');
  }
  if (!artifact.privacyBoundary.nonClaims.includes('not-provider-token-intake')) {
    errors.push('missing-provider-token-non-claim');
  }
  if (!artifact.privacyBoundary.nonClaims.includes('not-raw-carrier-payload-intake')) {
    errors.push('missing-raw-carrier-payload-non-claim');
  }
  if (/playlist-commerce-synthetic-ping-secret/.test(text)) errors.push('synthetic-secret-leaked');
  if (/blocked-synthetic-marker/.test(text)) errors.push('activation-block-marker-leaked');
  if (/x-playlist-signature/.test(text)) errors.push('signature-header-leaked');
  if (/order_alias_pc_synthetic_ping_001|wallet_subject_alias_pc_ping/.test(text)) {
    errors.push('alias-payload-leaked');
  }

  return errors;
}

export function validatePlaylistCommerceWebhookEvidenceArtifact(
  artifact: PlaylistCommerceWebhookEvidenceArtifact,
): string[] {
  const errors: string[] = [];
  const history = buildPlaylistCommerceWebhookPreflightHistoryArtifact(artifact.generatedAt);
  const text = JSON.stringify(artifact);

  if (artifact.artifact !== 'playlist-commerce-webhook-evidence-fixture') errors.push('invalid-evidence-artifact-name');
  if (artifact.version !== 'v0.1') errors.push('invalid-evidence-artifact-version');
  if (!artifact.source.localOnly) errors.push('evidence-not-local-only');
  if (artifact.source.safeCommand !== 'npm run verify:playlist-commerce') errors.push('evidence-unsafe-command');
  if (artifact.source.managedServiceBoundary !== 'fixture-only-not-hosted-evidence-vault') {
    errors.push('evidence-managed-boundary-missing');
  }
  if (artifact.summary.totalRecords !== artifact.records.length) errors.push('evidence-total-mismatch');
  if (artifact.summary.linkedHistoryRuns !== history.runs.length) errors.push('evidence-history-link-count-mismatch');
  if (artifact.summary.latestEvidenceRef !== history.summary.latestEvidenceRef) errors.push('evidence-latest-ref-mismatch');
  if (!artifact.summary.allRecordsRedacted) errors.push('evidence-records-not-redacted');
  if (!artifact.records.every(record => history.runs.some(run => run.evidenceRef === record.evidenceRef))) {
    errors.push('evidence-record-without-history-run');
  }
  if (!artifact.records.every(record => record.kind === 'playlist-commerce-webhook-preflight')) {
    errors.push('evidence-kind-mismatch');
  }
  if (!artifact.records.every(record => record.status === 'accepted-and-replay-blocked')) {
    errors.push('evidence-status-mismatch');
  }
  if (!artifact.records.every(record => record.publicProjection.acceptedStatus === 202)) {
    errors.push('evidence-accepted-status-mismatch');
  }
  if (!artifact.records.every(record => record.publicProjection.replayStatus === 401 && record.publicProjection.replayBlocked)) {
    errors.push('evidence-replay-not-blocked');
  }
  if (!artifact.records.every(record => record.publicProjection.checkStatuses['redacted-response'] === 'pass')) {
    errors.push('evidence-redaction-check-missing');
  }
  if (!artifact.records.every(record => record.publicProjection.checkStatuses['activation-private-material-blocked'] === 'pass')) {
    errors.push('evidence-activation-block-check-missing');
  }
  if (!artifact.records.every(record => (
    /^pc_req_[a-f0-9]{8}$/.test(record.commitments.requestCommitmentRef) &&
    /^pc_res_[a-f0-9]{8}$/.test(record.commitments.responseCommitmentRef) &&
    /^pc_chk_[a-f0-9]{8}$/.test(record.commitments.checkCommitmentRef)
  ))) {
    errors.push('evidence-commitment-ref-invalid');
  }
  if (!artifact.records.every(record => (
    record.privacyBoundary.localOnly &&
    !record.privacyBoundary.rawPayloadStored &&
    !record.privacyBoundary.signatureStored &&
    !record.privacyBoundary.secretMaterialStored &&
    !record.privacyBoundary.rawAddressStored &&
    !record.privacyBoundary.proofWitnessStored &&
    !record.privacyBoundary.recipientContactStored
  ))) {
    errors.push('evidence-privacy-boundary-invalid');
  }
  if (!artifact.forbiddenMaterial.includes('production_webhook_secret')) {
    errors.push('evidence-missing-production-secret-boundary');
  }
  if (!artifact.forbiddenMaterial.includes('provider_token')) {
    errors.push('evidence-missing-provider-token-boundary');
  }
  if (!artifact.forbiddenMaterial.includes('raw_carrier_payload')) {
    errors.push('evidence-missing-raw-carrier-payload-boundary');
  }
  if (!artifact.nonClaims.includes('not-production-delivery-attempt')) {
    errors.push('evidence-missing-delivery-non-claim');
  }
  if (!artifact.nonClaims.includes('not-provider-token-intake')) {
    errors.push('evidence-missing-provider-token-non-claim');
  }
  if (!artifact.nonClaims.includes('not-raw-carrier-payload-intake')) {
    errors.push('evidence-missing-raw-carrier-payload-non-claim');
  }
  if (/playlist-commerce-synthetic-ping-secret/.test(text)) errors.push('evidence-synthetic-secret-leaked');
  if (/blocked-synthetic-marker/.test(text)) errors.push('evidence-activation-block-marker-leaked');
  if (/x-playlist-signature/.test(text)) errors.push('evidence-signature-header-leaked');
  if (/order_alias_pc_synthetic_ping_001|wallet_subject_alias_pc_ping/.test(text)) {
    errors.push('evidence-alias-payload-leaked');
  }

  return errors;
}

export function validatePlaylistCommerceWebhookPreflightHistoryArtifact(
  artifact: PlaylistCommerceWebhookPreflightHistoryArtifact,
): string[] {
  const errors: string[] = [];
  const text = JSON.stringify(artifact);

  if (artifact.artifact !== 'playlist-commerce-webhook-preflight-history-fixture') errors.push('invalid-history-artifact-name');
  if (artifact.version !== 'v0.1') errors.push('invalid-history-artifact-version');
  if (!artifact.source.localOnly) errors.push('history-not-local-only');
  if (artifact.source.safeCommand !== 'npm run verify:playlist-commerce') errors.push('history-unsafe-command');
  if (artifact.runs.length < 2) errors.push('history-too-short');
  if (artifact.summary.totalRuns !== artifact.runs.length) errors.push('history-total-mismatch');
  if (artifact.summary.passedRuns !== artifact.runs.filter(run => run.passed).length) errors.push('history-passed-mismatch');
  if (artifact.summary.replayBlockedRuns !== artifact.runs.filter(run => run.replayBlocked).length) {
    errors.push('history-replay-mismatch');
  }
  if (artifact.summary.latestEvidenceRef !== artifact.operatorAction.latestEvidenceRef) {
    errors.push('history-latest-evidence-ref-mismatch');
  }
  if (!artifact.runs.every(run => /^pc_webhook_preflight_evidence_\d{3}$/.test(run.evidenceRef))) {
    errors.push('history-invalid-evidence-ref');
  }
  if (artifact.operatorAction.exportCommand !== 'npm run export:playlist-commerce-webhook-preflight') {
    errors.push('history-invalid-export-command');
  }
  if (artifact.operatorAction.checkCommand !== 'npm run verify:playlist-commerce') {
    errors.push('history-invalid-check-command');
  }
  if (artifact.operatorAction.nextSafeStep !== 'rerun-local-preflight-before-live-webhook-enable') {
    errors.push('history-invalid-next-safe-step');
  }
  if (!artifact.runs.every(run => run.acceptedStatus === 202)) errors.push('history-accepted-status-mismatch');
  if (!artifact.runs.every(run => run.replayStatus === 401 && run.replayBlocked)) errors.push('history-replay-not-blocked');
  if (!artifact.runs.every(run => run.checkStatuses['redacted-response'] === 'pass')) errors.push('history-redaction-check-missing');
  if (!artifact.runs.every(run => run.checkStatuses['activation-private-material-blocked'] === 'pass')) {
    errors.push('history-activation-block-check-missing');
  }
  if (!artifact.privacyBoundary.forbiddenMaterial.includes('production_webhook_secret')) {
    errors.push('history-missing-production-secret-boundary');
  }
  if (!artifact.privacyBoundary.forbiddenMaterial.includes('provider_token')) {
    errors.push('history-missing-provider-token-boundary');
  }
  if (!artifact.privacyBoundary.forbiddenMaterial.includes('raw_carrier_payload')) {
    errors.push('history-missing-raw-carrier-payload-boundary');
  }
  if (!artifact.privacyBoundary.nonClaims.includes('not-production-delivery-attempt')) {
    errors.push('history-missing-delivery-non-claim');
  }
  if (!artifact.privacyBoundary.nonClaims.includes('not-provider-token-intake')) {
    errors.push('history-missing-provider-token-non-claim');
  }
  if (!artifact.privacyBoundary.nonClaims.includes('not-raw-carrier-payload-intake')) {
    errors.push('history-missing-raw-carrier-payload-non-claim');
  }
  if (/playlist-commerce-synthetic-ping-secret/.test(text)) errors.push('history-synthetic-secret-leaked');
  if (/blocked-synthetic-marker/.test(text)) errors.push('history-activation-block-marker-leaked');
  if (/x-playlist-signature/.test(text)) errors.push('history-signature-header-leaked');
  if (/order_alias_pc_synthetic_ping_001|wallet_subject_alias_pc_ping/.test(text)) {
    errors.push('history-alias-payload-leaked');
  }

  return errors;
}

export function writePlaylistCommerceWebhookPreflightArtifact(root = process.cwd()) {
  const artifact = buildPlaylistCommerceWebhookPreflightArtifact();
  const errors = validatePlaylistCommerceWebhookPreflightArtifact(artifact);
  if (errors.length) throw new Error(`Playlist Commerce webhook preflight artifact invalid: ${errors.join(', ')}`);

  const historyArtifact = buildPlaylistCommerceWebhookPreflightHistoryArtifact();
  const historyErrors = validatePlaylistCommerceWebhookPreflightHistoryArtifact(historyArtifact);
  if (historyErrors.length) {
    throw new Error(`Playlist Commerce webhook preflight history artifact invalid: ${historyErrors.join(', ')}`);
  }
  const evidenceArtifact = buildPlaylistCommerceWebhookEvidenceArtifact();
  const evidenceErrors = validatePlaylistCommerceWebhookEvidenceArtifact(evidenceArtifact);
  if (evidenceErrors.length) {
    throw new Error(`Playlist Commerce webhook evidence artifact invalid: ${evidenceErrors.join(', ')}`);
  }

  const outputPath = join(root, PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_FIXTURE_PATH);
  const historyOutputPath = join(root, PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_HISTORY_FIXTURE_PATH);
  const evidenceOutputPath = join(root, PLAYLIST_COMMERCE_WEBHOOK_EVIDENCE_FIXTURE_PATH);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serializePlaylistCommerceWebhookPreflightArtifact(artifact), 'utf8');
  writeFileSync(historyOutputPath, serializePlaylistCommerceWebhookPreflightHistoryArtifact(historyArtifact), 'utf8');
  writeFileSync(evidenceOutputPath, serializePlaylistCommerceWebhookEvidenceArtifact(evidenceArtifact), 'utf8');
  return outputPath;
}

export function checkPlaylistCommerceWebhookPreflightArtifact(root = process.cwd()) {
  const outputPath = join(root, PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_FIXTURE_PATH);
  if (!existsSync(outputPath)) {
    return {
      ok: false,
      outputPath,
      errors: ['fixture-missing'],
    };
  }

  const expected = serializePlaylistCommerceWebhookPreflightArtifact();
  const actual = readFileSync(outputPath, 'utf8');
  if (actual !== expected) {
    return {
      ok: false,
      outputPath,
      errors: ['fixture-out-of-sync'],
    };
  }

  const parsed = JSON.parse(actual) as PlaylistCommerceWebhookPreflightArtifact;
  const errors = validatePlaylistCommerceWebhookPreflightArtifact(parsed);
  const historyOutputPath = join(root, PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_HISTORY_FIXTURE_PATH);
  if (!existsSync(historyOutputPath)) {
    return {
      ok: false,
      outputPath: historyOutputPath,
      errors: ['history-fixture-missing'],
    };
  }

  const expectedHistory = serializePlaylistCommerceWebhookPreflightHistoryArtifact();
  const actualHistory = readFileSync(historyOutputPath, 'utf8');
  if (actualHistory !== expectedHistory) {
    return {
      ok: false,
      outputPath: historyOutputPath,
      errors: ['history-fixture-out-of-sync'],
    };
  }

  const parsedHistory = JSON.parse(actualHistory) as PlaylistCommerceWebhookPreflightHistoryArtifact;
  errors.push(...validatePlaylistCommerceWebhookPreflightHistoryArtifact(parsedHistory));
  const evidenceOutputPath = join(root, PLAYLIST_COMMERCE_WEBHOOK_EVIDENCE_FIXTURE_PATH);
  if (!existsSync(evidenceOutputPath)) {
    return {
      ok: false,
      outputPath: evidenceOutputPath,
      errors: ['evidence-fixture-missing'],
    };
  }

  const expectedEvidence = serializePlaylistCommerceWebhookEvidenceArtifact();
  const actualEvidence = readFileSync(evidenceOutputPath, 'utf8');
  if (actualEvidence !== expectedEvidence) {
    return {
      ok: false,
      outputPath: evidenceOutputPath,
      errors: ['evidence-fixture-out-of-sync'],
    };
  }

  const parsedEvidence = JSON.parse(actualEvidence) as PlaylistCommerceWebhookEvidenceArtifact;
  errors.push(...validatePlaylistCommerceWebhookEvidenceArtifact(parsedEvidence));
  return {
    ok: errors.length === 0,
    outputPath,
    errors,
  };
}

function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--check')) {
    const result = checkPlaylistCommerceWebhookPreflightArtifact();
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    return;
  }

  const outputPath = writePlaylistCommerceWebhookPreflightArtifact();
  console.log(JSON.stringify({
    status: 'ok',
    outputPath,
    historyOutputPath: join(process.cwd(), PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_HISTORY_FIXTURE_PATH),
    evidenceOutputPath: join(process.cwd(), PLAYLIST_COMMERCE_WEBHOOK_EVIDENCE_FIXTURE_PATH),
    safeCommand: 'npm run verify:playlist-commerce',
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main();
}
