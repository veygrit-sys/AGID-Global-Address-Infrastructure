import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'FieldHandoffAppScreen.tsx'), 'utf8');

test('Field Handoff keeps Scan -> Decision -> Handoff -> Report as the primary field flow', () => {
  assert.match(source, /StepTile step=\{1\} title=\{t\('scan'\)\}/);
  assert.match(source, /StepTile step=\{2\} title=\{t\('decision'\)\}/);
  assert.match(source, /StepTile step=\{3\} title=\{t\('handoff'\)\}/);
  assert.match(source, /StepTile step=\{4\} title=\{t\('report'\)\}/);
  assert.match(source, /flowTitle/);
  assert.match(source, /flowBody/);
});

test('Field Handoff persists only redacted local receipts for offline operation', () => {
  assert.match(source, /FIELD_HANDOFF_RECEIPTS_STORAGE_KEY/);
  assert.match(source, /readStoredReceipts/);
  assert.match(source, /isStoredFieldHandoffReceipt/);
  assert.match(source, /localStorage\.setItem\(FIELD_HANDOFF_RECEIPTS_STORAGE_KEY, JSON\.stringify\(receipts\)\)/);
  assert.match(source, /rawPayloadStored === false/);
  assert.match(source, /rawAddressStored === false/);
  assert.match(source, /rawAgidStored === false/);
  assert.match(source, /rawAoidStored === false/);
  assert.match(source, /proofSecretStored === false/);
});

test('Field Handoff exposes signed receipt evidence and reachability status without raw address display', () => {
  assert.match(source, /latestReceipt\.signature\.receiptFingerprint/);
  assert.match(source, /latestReceipt\.signature\.signatureId/);
  assert.match(source, /latestReceipt\.signature\.terminalSignature/);
  assert.match(source, /latestReceipt\.offlineQueueRef/);
  assert.match(source, /latestReceipt\.offlineEvidence\?\.evidenceId/);
  assert.match(source, /latestReceipt\.recipientProofEvidence\.evidenceId/);
  assert.match(source, /latestReceipt\.reachabilityEvidence\.evidenceId/);
  assert.match(source, /latestReceipt\.syncState/);
  assert.match(source, /latestReceipt\?\.reachabilityReason/);
  assert.match(source, /Evidence package/);
  assert.match(source, /証跡パッケージ/);
  assert.match(source, /Terminal signature/);
  assert.match(source, /端末署名/);
  assert.match(source, /Cannot reach/);
  assert.match(source, /到達不可/);
  assert.match(source, /署名receipt/);
});

test('Field Handoff gives couriers large one-tap delivery outcome buttons', () => {
  assert.match(source, /CourierActionButton/);
  assert.match(source, /courierActionsTitle/);
  assert.match(source, /arrived/);
  assert.match(source, /delivered/);
  assert.match(source, /absent/);
  assert.match(source, /cannotReachDriver/);
  assert.match(source, /handoffNotAllowed/);
  assert.match(source, /handleCourierAction/);
  assert.match(source, /oneTapCannotReachReport/);
  assert.match(source, /createFieldReachabilityReport/);
});

test('Field Handoff exposes offline receipt queue and photo memo privacy guard', () => {
  assert.match(source, /receipt\.syncState === 'queued'/);
  assert.match(source, /AttachmentPrivacyGuard/);
  assert.match(source, /detectFieldAttachmentPrivacyWarnings/);
  assert.match(source, /photoEvidenceRef/);
  assert.match(source, /fieldMemo/);
  assert.match(source, /attachmentPrivacyWarn/);
  assert.match(source, /redacted evidence ref/);
});

test('Field mission command prioritizes latest receipt state and safe references', () => {
  assert.match(source, /FieldMissionCommand/);
  assert.match(source, /missionControl/);
  assert.match(source, /oneHandMode/);
  assert.match(source, /latestReceipt\?\.status \?\? task\.status/);
  assert.match(source, /primaryActionForTask\(missionStatus\)/);
  assert.match(source, /noRawAddressDefault/);
  assert.match(source, /AGID\/AOID/);
  assert.match(source, /alias/);
  assert.match(source, /commitment/);
  assert.match(source, /receipt/);
});

test('Field payload preview redacts raw QR payload and proof secret material', () => {
  assert.match(source, /buildSafePayloadPreview/);
  assert.match(source, /proofMethodLabel/);
  assert.match(source, /redacted-local-qr-nfc/);
  assert.match(source, /rawPayloadDisplayed: false/);
  assert.match(source, /rawAddressDisplayed: false/);
  assert.match(source, /proofSecretDisplayed: false/);
  assert.match(source, /readOnly/);
  assert.match(source, /React\.useState\(''\)/);
  assert.doesNotMatch(source, /setRecipientSecret\('recipient-secret'\)/);
  assert.match(source, /Commitment proof/);
});
