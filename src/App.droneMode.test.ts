import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');
const searchSidebarSource = readFileSync(join(here, 'components', 'SearchSidebar.tsx'), 'utf8');

test('app keeps drone planning logic available without exposing frontend drone mode', () => {
  assert.match(appSource, /fetchDroneLandingAssessment/);
  assert.match(appSource, /resolveDroneNavigationPoint/);
  assert.match(appSource, /const \[isDroneMode, setIsDroneMode\]/);
  assert.doesNotMatch(appSource, /<DronePlanningPanel/);
  assert.doesNotMatch(appSource, /title="Drone Mode"/);
  assert.doesNotMatch(appSource, /aria-label="Drone Mode"/);
});

test('app keeps Phase 2 mission planning internal only', () => {
  assert.match(appSource, /buildDroneMissionPlan/);
  assert.match(appSource, /const droneMissionOrigin = useMemo/);
  assert.match(appSource, /const droneMissionPlan = useMemo/);
  assert.doesNotMatch(appSource, /missionPlan=\{droneMissionPlan\}/);
});

test('app wires Phase 3 drone mission QR saving', () => {
  assert.match(appSource, /buildDroneMissionRecord/);
  assert.match(appSource, /buildDroneMissionQrPayload/);
  assert.match(appSource, /buildSavedQrFromDroneMission/);
  assert.match(appSource, /parseDroneMissionQrPayload/);
  assert.match(appSource, /await import\('\.\/lib\/droneMissionPackage'\)/);
  assert.doesNotMatch(appSource, /from '\.\/lib\/droneMissionPackage'/);
  assert.match(appSource, /const saveDroneMissionPlan = React\.useCallback\(async/);
  assert.doesNotMatch(appSource, /onSavePlan=\{saveDroneMissionPlan\}/);
  assert.match(appSource, /Mission QR Imported/);
});

test('app keeps Phase 4 corridor checking internal only', () => {
  assert.match(appSource, /fetchDroneCorridorReport/);
  assert.match(appSource, /const \[droneCorridorReport, setDroneCorridorReport\]/);
  assert.match(appSource, /const checkDroneCorridor = React\.useCallback/);
  assert.doesNotMatch(appSource, /corridorReport=\{droneCorridorReport\}/);
  assert.doesNotMatch(appSource, /onCheckCorridor=\{checkDroneCorridor\}/);
});

test('frontend does not expose drone terrain controls or autopilot control', () => {
  assert.doesNotMatch(appSource, /3D Terrain/);
  assert.doesNotMatch(searchSidebarSource, /setRoutingMode\('drone'\)/);
  assert.doesNotMatch(searchSidebarSource, /t\('drone'\)/);
  assert.doesNotMatch(searchSidebarSource, /drone_point_resolved/);
  assert.doesNotMatch(appSource, /MAVSDK|MAVLink|autopilot/i);
});
