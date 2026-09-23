import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assessDroneOsAircraft,
  buildDroneOsAuditReceipt,
  buildDroneOsFleetSnapshot,
  buildDroneOsMission,
  summarizeDroneOsMission,
} from './droneOs';

const CLEAR_ASSESSMENT = {
  score: 88,
  label: 'Low risk' as const,
  confidence: 0.9,
  elevationMeters: 18,
  windSpeedMs: 4,
  waterRisk: 'Low',
  warnings: [],
  strengths: ['Wind is within a favorable planning range'],
  sources: ['Open-Meteo'],
};

const READY_AIRCRAFT = {
  aircraftId: 'UAV-READY',
  model: 'field-quad',
  firmwareVersion: '2026.6',
  batteryPercent: 82,
  batteryCycleCount: 40,
  maxRangeMeters: 9000,
  maxPayloadGrams: 1200,
  payloadGrams: 300,
  gnssSatellites: 18,
  horizontalAccuracyM: 1.8,
  telemetryLink: 'online',
  controlLink: 'online',
  remoteIdBroadcasting: true,
  sensors: ['gnss', 'barometer', 'camera'],
  homePoint: { lat: 35.681236, lon: 139.767125 },
  currentPoint: { lat: 35.681236, lon: 139.767125 },
};

test('releases a healthy aircraft and clear corridor to field check only', () => {
  const mission = buildDroneOsMission({
    missionId: 'mission-clear',
    purpose: 'site-survey',
    aircraft: READY_AIRCRAFT,
    origin: { lat: 35.681236, lon: 139.767125 },
    target: { lat: 35.682839, lon: 139.759455, label: 'survey target' },
    landingAssessment: CLEAR_ASSESSMENT,
    navigationPoint: {
      altitudeAglM: 30,
      altitudeMslM: 48,
      safety: 'clear',
      confidence: 0.9,
      warnings: [],
      sources: ['osm-overpass'],
      candidates: [],
    },
    weather: {
      windSpeedMs: 4,
      gustSpeedMs: 6,
      precipitationMmH: 0,
      visibilityMeters: 5000,
    },
    corridorReport: {
      status: 'field-check',
      minScore: 80,
      worstLabel: 'Caution',
      worstSample: null,
      confidence: 0.85,
      summary: 'Corridor is ready for field check.',
      warnings: [],
      samples: [],
    },
    requestedFlightMode: 'assisted',
    createdAt: '2026-06-18T00:00:00.000Z',
  });

  assert.equal(mission.decision, 'release-to-field-check');
  assert.equal(mission.aircraft.status, 'ready');
  assert.equal(mission.failsafe.primaryAction, 'continue-monitoring');
  assert.equal(mission.privacy.autopilotCommandsEmitted, false);
  assert.ok(mission.checklist.some(item => item.includes('not as an autopilot command')));
  assert.ok(mission.auditCommitment.startsWith('drone.os.mission:'));
});

test('blocks a mission when aircraft, weather, and corridor contain hard blockers', () => {
  const mission = buildDroneOsMission({
    missionId: 'mission-blocked',
    aircraft: {
      ...READY_AIRCRAFT,
      aircraftId: 'UAV-BLOCKED',
      batteryPercent: 12,
      remoteIdBroadcasting: false,
      gnssSatellites: 4,
    },
    origin: { lat: 35, lon: 139 },
    target: { lat: 35.1, lon: 139.1 },
    landingAssessment: { ...CLEAR_ASSESSMENT, label: 'Avoid', score: 20, warnings: ['Strong wind for small drone operations'] },
    navigationPoint: {
      altitudeAglM: 30,
      altitudeMslM: 40,
      safety: 'restricted',
      confidence: 0.9,
      warnings: ['Airport feature nearby'],
      sources: ['osm:aeroway'],
      candidates: [],
    },
    weather: {
      windSpeedMs: 16,
      gustSpeedMs: 22,
      precipitationMmH: 3,
      visibilityMeters: 300,
    },
    corridorReport: {
      status: 'avoid',
      minScore: 15,
      worstLabel: 'Avoid',
      worstSample: null,
      confidence: 0.9,
      summary: 'Do not use this corridor.',
      warnings: ['Restricted aeroway nearby'],
      samples: [],
    },
  });

  assert.equal(mission.decision, 'block-mission');
  assert.equal(mission.aircraft.status, 'blocked');
  assert.equal(mission.failsafe.primaryAction, 'abort-before-launch');
  assert.ok(mission.decisionReasons.includes('battery-below-reserve'));
  assert.ok(mission.decisionReasons.includes('remote-id-required'));
  assert.ok(mission.decisionReasons.includes('wind-speed-above-policy'));
  assert.ok(mission.decisionReasons.includes('corridor-avoid'));
});

test('holds high-risk missions even when base signals are not blocked', () => {
  const mission = buildDroneOsMission({
    missionId: 'mission-high-risk',
    aircraft: READY_AIRCRAFT,
    origin: { lat: 35, lon: 139 },
    target: { lat: 35.001, lon: 139.001 },
    landingAssessment: {
      ...CLEAR_ASSESSMENT,
      label: 'Caution',
      score: 70,
      warnings: ['Urban or industrial land cover may limit safe landing space'],
    },
    policy: {
      highRiskMode: true,
    },
    weather: {
      windSpeedMs: 5,
      gustSpeedMs: 8,
      precipitationMmH: 0,
      visibilityMeters: 4000,
    },
  });

  assert.equal(mission.decision, 'hold-for-review');
  assert.equal(mission.policy.allowSupervisedAutonomy, false);
  assert.equal(mission.policy.maxDistanceMeters, 1500);
  assert.ok(mission.checklist.some(item => item.includes('shortened retention')));
});

test('fleet snapshot selects the strongest available aircraft for a mission', () => {
  const snapshot = buildDroneOsFleetSnapshot({
    generatedAt: '2026-06-18T00:00:00.000Z',
    aircraft: [
      { ...READY_AIRCRAFT, aircraftId: 'UAV-LOW', batteryPercent: 40, maxRangeMeters: 9000 },
      { ...READY_AIRCRAFT, aircraftId: 'UAV-STRONG', batteryPercent: 91, maxRangeMeters: 12000 },
      { ...READY_AIRCRAFT, aircraftId: 'UAV-BAD', batteryPercent: 10, maxRangeMeters: 12000 },
    ],
    mission: {
      origin: { lat: 35, lon: 139 },
      target: { lat: 35.01, lon: 139.01 },
    },
  });

  assert.equal(snapshot.readiness, 'ready');
  assert.equal(snapshot.selectedAircraftId, 'UAV-STRONG');
  assert.ok(snapshot.blockers.includes('battery-below-reserve'));
});

test('audit receipts keep raw coordinates out of the public receipt', () => {
  const mission = buildDroneOsMission({
    missionId: 'mission-receipt',
    aircraft: READY_AIRCRAFT,
    origin: { lat: 35.681236, lon: 139.767125 },
    target: { lat: 35.682839, lon: 139.759455 },
    landingAssessment: CLEAR_ASSESSMENT,
    weather: {
      windSpeedMs: 4,
      gustSpeedMs: 5,
      precipitationMmH: 0,
      visibilityMeters: 5000,
    },
    createdAt: '2026-06-18T00:00:00.000Z',
  });
  const receipt = buildDroneOsAuditReceipt(mission, '2026-06-18T00:10:00.000Z');
  const summary = summarizeDroneOsMission(mission);

  assert.equal(receipt.rawCoordinatesIncluded, false);
  assert.equal(JSON.stringify(receipt).includes('139.759455'), false);
  assert.ok(receipt.targetCommitment.startsWith('drone.os.target:'));
  assert.equal(summary.rawAutopilotCommands, false);
});

test('aircraft assessment reports degraded links as review rather than ready', () => {
  const aircraft = assessDroneOsAircraft({
    ...READY_AIRCRAFT,
    aircraftId: 'UAV-LINK',
    telemetryLink: 'degraded',
    controlLink: 'online',
  });

  assert.equal(aircraft.status, 'attention');
  assert.ok(aircraft.warnings.includes('command-or-telemetry-link-degraded'));
  assert.equal(aircraft.blockers.length, 0);
});
