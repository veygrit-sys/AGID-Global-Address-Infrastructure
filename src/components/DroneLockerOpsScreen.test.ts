import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'DroneLockerOpsScreen.tsx'), 'utf8');

test('Drone / Locker Ops screen wires reachability evidence and local locker simulation', () => {
  assert.match(source, /createDroneOpsReceipt/);
  assert.match(source, /buildLockerOpsSimulation/);
  assert.match(source, /buildLockerOpsQrNfcOperations/);
  assert.match(source, /listDroneOpsCapabilities/);
  assert.match(source, /listLockerOpsCapabilities/);
  assert.match(source, /apiEndpoints\.droneDeliveryEvidenceReport/);
  assert.match(source, /apiEndpoints\.warehouseLockerSimulatorRun/);
  assert.doesNotMatch(source, /createDroneDeliveryEvidenceReceipt/);
  assert.doesNotMatch(source, /buildWarehouseLockerLocalSimulation/);
});

test('Drone / Locker Ops screen exposes MQTT, HTTP, Modbus, and operations states', () => {
  assert.match(source, /MQTT|mqtt/);
  assert.match(source, /HTTP|http/);
  assert.match(source, /Modbus|modbus/);
  assert.match(source, /offlineQueue/);
  assert.match(source, /recentFrames/);
  assert.match(source, /lockerSnapshot/);
  assert.match(source, /qrNfcOperations/);
  assert.match(source, /receiptCommitment/);
});

test('Drone / Locker Ops screen keeps the product boundary away from flight control', () => {
  assert.match(source, /This is not a drone autopilot/);
  assert.match(source, /Reachability API only/);
  assert.doesNotMatch(source, /sendFlightCommand/);
  assert.doesNotMatch(source, /armMotors/);
  assert.doesNotMatch(source, /setWaypoint/);
});

test('Drone / Locker Ops screen documents privacy guards for the operator UI', () => {
  assert.match(source, /No raw address/);
  assert.match(source, /No raw AGID\/AOID/);
  assert.match(source, /No precise telemetry/);
  assert.match(source, /No device secrets/);
  assert.doesNotMatch(source, /recipientName\s*:/);
  assert.doesNotMatch(source, /phoneNumber\s*:/);
  assert.doesNotMatch(source, /privateKey\s*:/);
});

test('Drone / Locker Ops screen exposes a field-first command center', () => {
  assert.match(source, /Ops command center/);
  assert.match(source, /Priority action/);
  assert.match(source, /Field checklist/);
  assert.match(source, /DecisionTriad/);
  assert.match(source, /ConstraintPanel/);
  assert.match(source, /safe handoff/);
  assert.match(source, /hold for review/);
  assert.match(source, /cannot reach/);
  assert.match(source, /制約条件/);
  assert.match(source, /10cm単位/);
  assert.match(source, /着陸禁止/);
  assert.match(source, /障害物/);
  assert.match(source, /handoffReady/);
  assert.match(source, /acceptedAccessCount/);
  assert.match(source, /releaseHandoff/);
  assert.match(source, /createCannotReach/);
  assert.match(source, /syncWhenOnline/);
  assert.match(source, /OpsActionRow/);
});

test('Drone / Locker Ops screen separates drone and locker workspaces', () => {
  assert.match(source, /OpsWorkspaceSwitch/);
  assert.match(source, /LockerDecisionTriad/);
  assert.match(source, /activeWorkspace/);
  assert.match(source, /data-ops-workspace-panel="drone"/);
  assert.match(source, /data-ops-workspace-panel="locker"/);
  assert.match(source, /activeWorkspace === 'drone'/);
  assert.match(source, /activeWorkspace === 'locker'/);
  assert.match(source, /画面を分ける/);
  assert.match(source, /Drone Ops/);
  assert.match(source, /Locker Ops/);
  assert.match(source, /lockerCommandCenter/);
  assert.match(source, /droneApiCatalog/);
  assert.match(source, /lockerApiCatalog/);
});
