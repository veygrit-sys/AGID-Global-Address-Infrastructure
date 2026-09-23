import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  PLAYLIST_COMMERCE_WEBHOOK_EVIDENCE_FIXTURE_PATH,
  PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_HISTORY_FIXTURE_PATH,
  PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_FIXTURE_PATH,
  buildPlaylistCommerceWebhookEvidenceArtifact,
  buildPlaylistCommerceWebhookPreflightArtifact,
  buildPlaylistCommerceWebhookPreflightHistoryArtifact,
  checkPlaylistCommerceWebhookPreflightArtifact,
  serializePlaylistCommerceWebhookEvidenceArtifact,
  serializePlaylistCommerceWebhookPreflightArtifact,
  serializePlaylistCommerceWebhookPreflightHistoryArtifact,
  validatePlaylistCommerceWebhookEvidenceArtifact,
  validatePlaylistCommerceWebhookPreflightArtifact,
  validatePlaylistCommerceWebhookPreflightHistoryArtifact,
} from './export-playlist-commerce-webhook-preflight';

test('Playlist Commerce webhook preflight fixture is deterministic and in sync', () => {
  const expected = serializePlaylistCommerceWebhookPreflightArtifact();
  const fixturePath = join(process.cwd(), PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_FIXTURE_PATH);
  const actual = readFileSync(fixturePath, 'utf8');
  const check = checkPlaylistCommerceWebhookPreflightArtifact();

  assert.equal(actual, expected);
  assert.equal(check.ok, true);
  assert.deepEqual(check.errors, []);
});

test('Playlist Commerce webhook preflight history fixture is deterministic and in sync', () => {
  const expected = serializePlaylistCommerceWebhookPreflightHistoryArtifact();
  const fixturePath = join(process.cwd(), PLAYLIST_COMMERCE_WEBHOOK_PREFLIGHT_HISTORY_FIXTURE_PATH);
  const actual = readFileSync(fixturePath, 'utf8');
  const check = checkPlaylistCommerceWebhookPreflightArtifact();

  assert.equal(actual, expected);
  assert.equal(check.ok, true);
  assert.deepEqual(check.errors, []);
});

test('Playlist Commerce webhook evidence fixture is deterministic and in sync', () => {
  const expected = serializePlaylistCommerceWebhookEvidenceArtifact();
  const fixturePath = join(process.cwd(), PLAYLIST_COMMERCE_WEBHOOK_EVIDENCE_FIXTURE_PATH);
  const actual = readFileSync(fixturePath, 'utf8');
  const check = checkPlaylistCommerceWebhookPreflightArtifact();

  assert.equal(actual, expected);
  assert.equal(check.ok, true);
  assert.deepEqual(check.errors, []);
});

test('Playlist Commerce webhook preflight fixture stays local-only and redacted', () => {
  const artifact = buildPlaylistCommerceWebhookPreflightArtifact();
  const errors = validatePlaylistCommerceWebhookPreflightArtifact(artifact);
  const text = JSON.stringify(artifact);

  assert.deepEqual(errors, []);
  assert.equal(artifact.source.localOnly, true);
  assert.equal(artifact.source.safeCommand, 'npm run verify:playlist-commerce');
  assert.equal(artifact.report.passed, true);
  assert.equal(artifact.report.responseSummary.acceptedStatus, 202);
  assert.equal(artifact.report.responseSummary.replayStatus, 401);
  assert.ok(artifact.report.responseSummary.replayErrors.includes('duplicate-event-id'));
  assert.ok(artifact.verification.requiredChecks.includes('redacted-response'));
  assert.ok(artifact.verification.requiredChecks.includes('activation-private-material-blocked'));
  assert.equal(artifact.report.activationBlockNegativeCase.id, 'provider-token-raw-carrier-payload-negative');
  assert.equal(artifact.report.activationBlockNegativeCase.actualStatus, 401);
  assert.ok(artifact.report.activationBlockNegativeCase.errors.includes('forbidden-field:$.providerIdToken'));
  assert.ok(artifact.report.activationBlockNegativeCase.errors.includes('forbidden-field:$.rawCarrierPayload'));
  assert.ok(artifact.privacyBoundary.forbiddenMaterial.includes('production_webhook_secret'));
  assert.ok(artifact.privacyBoundary.forbiddenMaterial.includes('provider_token'));
  assert.ok(artifact.privacyBoundary.forbiddenMaterial.includes('raw_carrier_payload'));
  assert.ok(artifact.privacyBoundary.nonClaims.includes('not-production-delivery-attempt'));
  assert.ok(artifact.privacyBoundary.nonClaims.includes('not-provider-token-intake'));
  assert.ok(artifact.privacyBoundary.nonClaims.includes('not-raw-carrier-payload-intake'));

  assert.doesNotMatch(text, /playlist-commerce-synthetic-ping-secret/);
  assert.doesNotMatch(text, /blocked-synthetic-marker/);
  assert.doesNotMatch(text, /x-playlist-signature/);
  assert.doesNotMatch(text, /order_alias_pc_synthetic_ping_001|wallet_subject_alias_pc_ping/);
});

test('Playlist Commerce webhook evidence fixture links history refs to redacted vault records', () => {
  const history = buildPlaylistCommerceWebhookPreflightHistoryArtifact();
  const artifact = buildPlaylistCommerceWebhookEvidenceArtifact();
  const errors = validatePlaylistCommerceWebhookEvidenceArtifact(artifact);
  const text = JSON.stringify(artifact);

  assert.deepEqual(errors, []);
  assert.equal(artifact.source.localOnly, true);
  assert.equal(artifact.source.safeCommand, 'npm run verify:playlist-commerce');
  assert.equal(artifact.source.managedServiceBoundary, 'fixture-only-not-hosted-evidence-vault');
  assert.equal(artifact.summary.totalRecords, history.runs.length);
  assert.equal(artifact.summary.linkedHistoryRuns, history.runs.length);
  assert.equal(artifact.summary.latestEvidenceRef, history.summary.latestEvidenceRef);
  assert.equal(artifact.summary.allRecordsRedacted, true);
  assert.deepEqual(
    artifact.records.map(record => record.evidenceRef),
    history.runs.map(run => run.evidenceRef),
  );
  assert.ok(artifact.records.every(record => record.kind === 'playlist-commerce-webhook-preflight'));
  assert.ok(artifact.records.every(record => record.status === 'accepted-and-replay-blocked'));
  assert.ok(artifact.records.every(record => record.publicProjection.acceptedStatus === 202));
  assert.ok(artifact.records.every(record => record.publicProjection.replayStatus === 401));
  assert.ok(artifact.records.every(record => record.publicProjection.replayBlocked));
  assert.ok(artifact.records.every(record => record.publicProjection.checkStatuses['activation-private-material-blocked'] === 'pass'));
  assert.ok(artifact.records.every(record => record.publicProjection.checkStatuses['redacted-response'] === 'pass'));
  assert.ok(artifact.records.every(record => /^pc_req_[a-f0-9]{8}$/.test(record.commitments.requestCommitmentRef)));
  assert.ok(artifact.records.every(record => /^pc_res_[a-f0-9]{8}$/.test(record.commitments.responseCommitmentRef)));
  assert.ok(artifact.records.every(record => /^pc_chk_[a-f0-9]{8}$/.test(record.commitments.checkCommitmentRef)));
  assert.ok(artifact.records.every(record => record.privacyBoundary.rawPayloadStored === false));
  assert.ok(artifact.records.every(record => record.privacyBoundary.signatureStored === false));
  assert.ok(artifact.records.every(record => record.privacyBoundary.secretMaterialStored === false));
  assert.ok(artifact.records.every(record => record.privacyBoundary.rawAddressStored === false));
  assert.ok(artifact.records.every(record => record.privacyBoundary.proofWitnessStored === false));
  assert.ok(artifact.records.every(record => record.privacyBoundary.recipientContactStored === false));

  assert.doesNotMatch(text, /playlist-commerce-synthetic-ping-secret/);
  assert.doesNotMatch(text, /blocked-synthetic-marker/);
  assert.doesNotMatch(text, /x-playlist-signature/);
  assert.doesNotMatch(text, /order_alias_pc_synthetic_ping_001|wallet_subject_alias_pc_ping/);
});

test('Playlist Commerce webhook preflight history summarizes redacted local runs', () => {
  const artifact = buildPlaylistCommerceWebhookPreflightHistoryArtifact();
  const errors = validatePlaylistCommerceWebhookPreflightHistoryArtifact(artifact);
  const text = JSON.stringify(artifact);

  assert.deepEqual(errors, []);
  assert.equal(artifact.source.localOnly, true);
  assert.equal(artifact.source.safeCommand, 'npm run verify:playlist-commerce');
  assert.equal(artifact.summary.totalRuns, artifact.runs.length);
  assert.equal(artifact.summary.passedRuns, artifact.runs.length);
  assert.equal(artifact.summary.replayBlockedRuns, artifact.runs.length);
  assert.equal(artifact.summary.latestPassed, true);
  assert.ok(artifact.summary.latestRunId.endsWith('003'));
  assert.equal(artifact.summary.latestEvidenceRef, 'pc_webhook_preflight_evidence_003');
  assert.equal(artifact.operatorAction.exportCommand, 'npm run export:playlist-commerce-webhook-preflight');
  assert.equal(artifact.operatorAction.checkCommand, 'npm run verify:playlist-commerce');
  assert.equal(artifact.operatorAction.latestEvidenceRef, artifact.summary.latestEvidenceRef);
  assert.equal(artifact.operatorAction.nextSafeStep, 'rerun-local-preflight-before-live-webhook-enable');
  assert.ok(artifact.runs.every(run => /^pc_webhook_preflight_evidence_\d{3}$/.test(run.evidenceRef)));
  assert.ok(artifact.runs.every(run => run.acceptedStatus === 202));
  assert.ok(artifact.runs.every(run => run.replayStatus === 401));
  assert.ok(artifact.runs.every(run => run.replayBlocked));
  assert.ok(artifact.runs.every(run => run.checkStatuses['activation-private-material-blocked'] === 'pass'));
  assert.ok(artifact.runs.every(run => run.checkStatuses['redacted-response'] === 'pass'));
  assert.ok(artifact.privacyBoundary.forbiddenMaterial.includes('production_webhook_secret'));
  assert.ok(artifact.privacyBoundary.forbiddenMaterial.includes('provider_token'));
  assert.ok(artifact.privacyBoundary.forbiddenMaterial.includes('raw_carrier_payload'));
  assert.ok(artifact.privacyBoundary.nonClaims.includes('not-production-delivery-attempt'));
  assert.ok(artifact.privacyBoundary.nonClaims.includes('not-provider-token-intake'));
  assert.ok(artifact.privacyBoundary.nonClaims.includes('not-raw-carrier-payload-intake'));

  assert.doesNotMatch(text, /playlist-commerce-synthetic-ping-secret/);
  assert.doesNotMatch(text, /blocked-synthetic-marker/);
  assert.doesNotMatch(text, /x-playlist-signature/);
  assert.doesNotMatch(text, /order_alias_pc_synthetic_ping_001|wallet_subject_alias_pc_ping/);
});
