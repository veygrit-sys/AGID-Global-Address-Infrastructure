import {
  createDroneDeliveryEvidenceReceipt,
  listDroneDeliveryEvidenceApiCapabilities,
  type DroneDeliveryEvidenceOutcome,
  type DroneDeliveryEvidenceReceipt,
} from './droneDeliveryEvidenceApi';
import type { OpsScenario } from './opsScenario';
import { stableId } from './redactedWorkflowCore';

export type DroneOpsFieldDecision = 'safe-handoff' | 'hold-for-review' | 'cannot-reach';
export type DroneOpsConstraintKind = 'height' | 'precision' | 'landing-ban' | 'wind' | 'obstacle';
export type DroneOpsConstraintStatus = 'pass' | 'review' | 'blocked';

export type DroneOpsConstraint = {
  constraintId: string;
  kind: DroneOpsConstraintKind;
  label: string;
  value: string;
  status: DroneOpsConstraintStatus;
  publicRef: string;
};

export function droneOutcomeFor(scenario: OpsScenario): DroneDeliveryEvidenceOutcome {
  if (scenario === 'normal') return 'completed';
  if (scenario === 'offline') return 'held-for-review';
  return 'cannot-reach';
}

export function droneFieldDecisionFor(scenario: OpsScenario): DroneOpsFieldDecision {
  if (scenario === 'normal') return 'safe-handoff';
  if (scenario === 'offline') return 'hold-for-review';
  return 'cannot-reach';
}

function constraintRef(scenario: OpsScenario, kind: DroneOpsConstraintKind) {
  return stableId('DRONE-CONSTRAINT', { scenario, kind }, { length: 10 });
}

export function buildDroneOpsConstraintSet(scenario: OpsScenario): DroneOpsConstraint[] {
  const blocked = scenario === 'blocked';
  const offline = scenario === 'offline';
  const items: Array<Omit<DroneOpsConstraint, 'constraintId' | 'publicRef'>> = [
    {
      kind: 'height',
      label: 'height limit as constraint',
      value: blocked ? 'handoff height unsafe' : 'handoff height within policy',
      status: blocked ? 'blocked' : 'pass',
    },
    {
      kind: 'precision',
      label: '10cm precision unit as constraint',
      value: offline ? '10cm unit requires review' : '10cm unit accepted',
      status: offline ? 'review' : 'pass',
    },
    {
      kind: 'landing-ban',
      label: 'landing ban / no-landing zone',
      value: blocked ? 'landing prohibited' : 'no active landing ban',
      status: blocked ? 'blocked' : 'pass',
    },
    {
      kind: 'wind',
      label: 'wind condition',
      value: offline ? 'wind review required' : blocked ? 'wind and route fallback required' : 'wind within operating window',
      status: offline ? 'review' : blocked ? 'review' : 'pass',
    },
    {
      kind: 'obstacle',
      label: 'obstacle clearance',
      value: blocked ? 'obstacle blocks safe handoff' : offline ? 'obstacle data stale' : 'obstacle clearance ok',
      status: blocked ? 'blocked' : offline ? 'review' : 'pass',
    },
  ];

  return items.map(item => ({
    ...item,
    constraintId: constraintRef(scenario, item.kind),
    publicRef: constraintRef(scenario, item.kind),
  }));
}

export function createDroneOpsReceipt(
  scenario: OpsScenario,
  generatedAt: string,
): DroneDeliveryEvidenceReceipt {
  const blocked = scenario === 'blocked';
  const offline = scenario === 'offline';
  const outcome = droneOutcomeFor(scenario);
  return createDroneDeliveryEvidenceReceipt({
    deliveryId: `ops-delivery-${scenario}`,
    operatorRef: 'operator:ops-drone-team',
    missionRef: `mission:ops:${scenario}`,
    accessGrantRef: 'grant:ops-restricted',
    signedReceiptRef: `signed-ops-drone-${scenario}`,
    outcome,
    problemKind: blocked
      ? 'drone-landing-impossible'
      : offline
        ? 'weather-temporary'
        : 'other',
    reporterType: 'drone-operator',
    reporterTrusted: true,
    highRiskMode: scenario !== 'normal',
    coarseAgid: 'AGC-OPS-COARSE-77',
    countryCode: 'JP',
    regionCode: 'JP-13-OPS',
    evidence: [
      { kind: 'device-attestation', signed: true },
      { kind: 'sensor-reading', signed: true },
      ...(blocked ? [{ kind: 'signed-drone-telemetry' as const, signed: true, containsPreciseTelemetry: true }] : []),
    ],
    now: generatedAt,
  });
}

export function listDroneOpsCapabilities() {
  return listDroneDeliveryEvidenceApiCapabilities();
}
