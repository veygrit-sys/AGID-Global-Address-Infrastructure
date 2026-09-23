import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'OpenLockerPudoSimulatorScreen.tsx'), 'utf8');

test('Open Locker/PUDO screen wires the open simulator and language settings', () => {
  assert.match(source, /buildOpenLockerPudoSimulation/);
  assert.match(source, /listOpenLockerPudoSimulatorCapabilities/);
  assert.match(source, /OPEN_LOCKER_PUDO_SCENARIOS/);
  assert.match(source, /APP_LANGUAGE_STORAGE_KEY/);
  assert.match(source, /Open Locker\/PUDO Simulator/);
});

test('Open Locker/PUDO screen exposes scan, decision, proof, sync, and protocol views', () => {
  assert.match(source, /OneScreenHandoffPanel/);
  assert.match(source, /QR\/NFC読取 → ロッカー選択 → 開錠可否 → receipt/);
  assert.match(source, /simulation\.fieldFlow\.map/);
  assert.match(source, /QR\/NFC|QR \/ NFC/);
  assert.match(source, /MQTT \/ HTTP \/ Modbus/);
  assert.match(source, /PUDO \/ locker pickup points/);
  assert.match(source, /PickupPointCards/);
  assert.match(source, /siteAlias/);
  assert.match(source, /addressHidden/);
  assert.match(source, /offlineQueue/);
  assert.match(source, /operatorActions/);
  assert.match(source, /eventLog/);
  assert.match(source, /timeline/);
  assert.match(source, /print-receipt|print/);
});

test('Open Locker/PUDO screen centers locker status and PUDO alias conditions', () => {
  assert.match(source, /WorkspaceSwitch/);
  assert.match(source, /LockerConsolePanel/);
  assert.match(source, /PudoCounterDeskPanel/);
  assert.match(source, /data-locker-pudo-workspace="locker-console"/);
  assert.match(source, /data-locker-pudo-workspace="pudo-counter"/);
  assert.match(source, /activeWorkspace === 'locker'/);
  assert.match(source, /LockerStatusBoard/);
  assert.match(source, /空き/);
  assert.match(source, /予約/);
  assert.match(source, /故障/);
  assert.match(source, /オフライン/);
  assert.match(source, /要回収/);
  assert.match(source, /aliasと受取条件/);
  assert.match(source, /simulation\.pudoSafeIntake\.recipientAlias/);
  assert.match(source, /simulation\.pudoSafeIntake\.pickupConditions/);
  assert.match(source, /PUDO受付|PUDO Counter|PUDO Counter/);
  assert.match(source, /実住所ではなく/);
});

test('Open Locker/PUDO screen documents strict privacy boundaries', () => {
  assert.match(source, /No raw address/);
  assert.match(source, /No raw AGID\/AOID/);
  assert.match(source, /No QR\/NFC payloads/);
  assert.match(source, /PINやQR payloadを保存しません/);
  assert.match(source, /simulation\.pudoSafeIntake\.pinStored/);
  assert.match(source, /simulation\.pudoSafeIntake\.qrPayloadStored/);
  assert.match(source, /No device secrets/);
  assert.doesNotMatch(source, /recipientName\s*:/);
  assert.doesNotMatch(source, /phoneNumber\s*:/);
  assert.doesNotMatch(source, /privateKey\s*:/);
});
