import { distanceMeters } from './poiDeliverabilityGraph';

export type DeliveryFraudSignalKind =
  | 'gps-spoofing'
  | 'impossible-speed'
  | 'request-burst'
  | 'signature-mismatch'
  | 'device-credential-mismatch'
  | 'zk-proof-replay'
  | 'credential-invalid'
  | 'proof-scope-mismatch'
  | 'location-policy-mismatch'
  | 'stale-evidence';

export type DeliveryFraudDecision = 'allow' | 'allow-with-controls' | 'manual-review' | 'block';

export type DeliveryFraudLocationSample = {
  sampleId: string;
  observedAt: string;
  agidCellId?: string;
  lat?: number;
  lon?: number;
  accuracyMeters?: number;
  provider?: 'gps' | 'network' | 'wifi-rtt' | 'ble' | 'manual' | 'carrier-scan';
  mockLocationDetected?: boolean;
  deviceAttested?: boolean;
  sensorFusionConsistent?: boolean;
};

export type DeliveryFraudRequestEvent = {
  eventId: string;
  observedAt: string;
  deviceId: string;
  sessionId: string;
  ipBucket?: string;
  userAgentBucket?: string;
  signatureVerified?: boolean;
  signedDeviceId?: string;
  credentialDeviceId?: string;
  proofChallengeHash?: string;
  expectedChallengeHash?: string;
  proofScope?: string;
  expectedScope?: string;
  nullifier?: string;
};

export type DeliveryFraudCredentialState = {
  credentialId: string;
  issuerTrusted: boolean;
  revoked?: boolean;
  expired?: boolean;
  freshnessSeconds?: number;
  deviceBound?: boolean;
};

export type DeliveryFraudProofState = {
  proofId: string;
  zkReady: boolean;
  verified: boolean;
  expired?: boolean;
  replayDetected?: boolean;
  nullifierUsedBefore?: boolean;
  scopeMatches?: boolean;
  challengeMatches?: boolean;
};

export type DeliveryFraudPolicy = {
  maxSpeedMetersPerSecond: number;
  maxRequestsPerMinutePerDevice: number;
  maxRequestsPerMinutePerSession: number;
  maxCredentialFreshnessSeconds: number;
  blockScore: number;
  manualReviewScore: number;
  allowWithControlsScore: number;
  requireDeviceAttestationForGps: boolean;
};

export type DeliveryFraudFinding = {
  kind: DeliveryFraudSignalKind;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  reason: string;
  evidenceRefs: string[];
};

export type DeliveryFraudAssessment = {
  decision: DeliveryFraudDecision;
  riskScore: number;
  findings: DeliveryFraudFinding[];
  requiredControls: string[];
  safeSummary: string[];
  privacy: {
    rawAddressUsed: false;
    preciseLocationPublic: false;
    privateKeyMaterialUsed: false;
    proofWitnessUsed: false;
  };
};

export const DEFAULT_DELIVERY_FRAUD_POLICY: DeliveryFraudPolicy = {
  maxSpeedMetersPerSecond: 70,
  maxRequestsPerMinutePerDevice: 30,
  maxRequestsPerMinutePerSession: 12,
  maxCredentialFreshnessSeconds: 30 * 24 * 60 * 60,
  blockScore: 90,
  manualReviewScore: 55,
  allowWithControlsScore: 28,
  requireDeviceAttestationForGps: true,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function parseTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function minutesBetween(a: string, b: string) {
  const at = parseTime(a);
  const bt = parseTime(b);
  if (at === null || bt === null) return null;
  return Math.abs(bt - at) / 60_000;
}

function secondsBetween(a: string, b: string) {
  const at = parseTime(a);
  const bt = parseTime(b);
  if (at === null || bt === null) return null;
  return Math.abs(bt - at) / 1_000;
}

function isFiniteLocation(sample: DeliveryFraudLocationSample) {
  return Number.isFinite(sample.lat) && Number.isFinite(sample.lon);
}

function finding(
  kind: DeliveryFraudSignalKind,
  severity: DeliveryFraudFinding['severity'],
  score: number,
  reason: string,
  evidenceRefs: string[],
): DeliveryFraudFinding {
  return { kind, severity, score, reason, evidenceRefs };
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function requestRates(events: DeliveryFraudRequestEvent[], now: Date) {
  const active = events.filter(event => {
    const minutes = minutesBetween(event.observedAt, now.toISOString());
    return minutes !== null && minutes <= 1;
  });
  const byDevice = new Map<string, number>();
  const bySession = new Map<string, number>();
  for (const event of active) {
    byDevice.set(event.deviceId, (byDevice.get(event.deviceId) ?? 0) + 1);
    bySession.set(event.sessionId, (bySession.get(event.sessionId) ?? 0) + 1);
  }
  return { byDevice, bySession };
}

function gpsSpoofingFindings(
  samples: DeliveryFraudLocationSample[],
  policy: DeliveryFraudPolicy,
) {
  const findings: DeliveryFraudFinding[] = [];
  for (const sample of samples) {
    if (sample.mockLocationDetected) {
      findings.push(finding(
        'gps-spoofing',
        'critical',
        45,
        'mock-location-detected',
        [sample.sampleId],
      ));
    }
    if (sample.provider === 'gps' && policy.requireDeviceAttestationForGps && sample.deviceAttested === false) {
      findings.push(finding(
        'gps-spoofing',
        'high',
        25,
        'gps-sample-without-device-attestation',
        [sample.sampleId],
      ));
    }
    if (sample.sensorFusionConsistent === false) {
      findings.push(finding(
        'gps-spoofing',
        'high',
        30,
        'sensor-fusion-contradicts-location',
        [sample.sampleId],
      ));
    }
    if ((sample.accuracyMeters ?? 0) > 5_000) {
      findings.push(finding(
        'location-policy-mismatch',
        'medium',
        12,
        'location-accuracy-too-coarse-for-proof-policy',
        [sample.sampleId],
      ));
    }
  }
  return findings;
}

function impossibleSpeedFindings(
  samples: DeliveryFraudLocationSample[],
  policy: DeliveryFraudPolicy,
) {
  const sorted = samples
    .filter(isFiniteLocation)
    .sort((a, b) => String(a.observedAt).localeCompare(String(b.observedAt)));
  const findings: DeliveryFraudFinding[] = [];

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const seconds = secondsBetween(previous.observedAt, current.observedAt);
    if (!seconds || seconds <= 0) continue;
    const meters = distanceMeters(
      { lat: previous.lat!, lon: previous.lon! },
      { lat: current.lat!, lon: current.lon! },
    );
    const speed = meters / seconds;
    if (speed > policy.maxSpeedMetersPerSecond) {
      findings.push(finding(
        'impossible-speed',
        speed > policy.maxSpeedMetersPerSecond * 3 ? 'critical' : 'high',
        speed > policy.maxSpeedMetersPerSecond * 3 ? 50 : 35,
        `impossible-travel-speed:${Math.round(speed)}mps`,
        [previous.sampleId, current.sampleId],
      ));
    }
  }

  return findings;
}

function requestBurstFindings(
  events: DeliveryFraudRequestEvent[],
  policy: DeliveryFraudPolicy,
  now: Date,
) {
  const findings: DeliveryFraudFinding[] = [];
  const { byDevice, bySession } = requestRates(events, now);
  for (const [deviceId, count] of byDevice) {
    if (count > policy.maxRequestsPerMinutePerDevice) {
      findings.push(finding(
        'request-burst',
        count > policy.maxRequestsPerMinutePerDevice * 3 ? 'critical' : 'high',
        count > policy.maxRequestsPerMinutePerDevice * 3 ? 45 : 28,
        `device-request-burst:${count}/min`,
        [`device:${deviceId}`],
      ));
    }
  }
  for (const [sessionId, count] of bySession) {
    if (count > policy.maxRequestsPerMinutePerSession) {
      findings.push(finding(
        'request-burst',
        count > policy.maxRequestsPerMinutePerSession * 3 ? 'critical' : 'medium',
        count > policy.maxRequestsPerMinutePerSession * 3 ? 35 : 18,
        `session-request-burst:${count}/min`,
        [`session:${sessionId}`],
      ));
    }
  }
  return findings;
}

function requestIntegrityFindings(events: DeliveryFraudRequestEvent[]) {
  const findings: DeliveryFraudFinding[] = [];
  for (const event of events) {
    if (event.signatureVerified === false) {
      findings.push(finding(
        'signature-mismatch',
        'critical',
        55,
        'request-signature-invalid',
        [event.eventId],
      ));
    }
    if (event.signedDeviceId && event.deviceId && event.signedDeviceId !== event.deviceId) {
      findings.push(finding(
        'signature-mismatch',
        'high',
        35,
        'signed-device-id-does-not-match-request-device',
        [event.eventId],
      ));
    }
    if (event.credentialDeviceId && event.deviceId && event.credentialDeviceId !== event.deviceId) {
      findings.push(finding(
        'device-credential-mismatch',
        'high',
        38,
        'credential-bound-device-does-not-match-request-device',
        [event.eventId],
      ));
    }
    if (event.proofChallengeHash && event.expectedChallengeHash && event.proofChallengeHash !== event.expectedChallengeHash) {
      findings.push(finding(
        'proof-scope-mismatch',
        'high',
        36,
        'proof-challenge-hash-mismatch',
        [event.eventId],
      ));
    }
    if (event.proofScope && event.expectedScope && event.proofScope !== event.expectedScope) {
      findings.push(finding(
        'proof-scope-mismatch',
        'high',
        34,
        'proof-scope-mismatch',
        [event.eventId],
      ));
    }
  }
  return findings;
}

function credentialFindings(
  credentials: DeliveryFraudCredentialState[],
  policy: DeliveryFraudPolicy,
) {
  const findings: DeliveryFraudFinding[] = [];
  for (const credential of credentials) {
    if (!credential.issuerTrusted) {
      findings.push(finding(
        'credential-invalid',
        'critical',
        50,
        'credential-issuer-not-trusted',
        [credential.credentialId],
      ));
    }
    if (credential.revoked) {
      findings.push(finding(
        'credential-invalid',
        'critical',
        60,
        'credential-revoked',
        [credential.credentialId],
      ));
    }
    if (credential.expired) {
      findings.push(finding(
        'credential-invalid',
        'high',
        40,
        'credential-expired',
        [credential.credentialId],
      ));
    }
    if (credential.deviceBound === false) {
      findings.push(finding(
        'device-credential-mismatch',
        'medium',
        18,
        'credential-not-device-bound',
        [credential.credentialId],
      ));
    }
    if ((credential.freshnessSeconds ?? 0) > policy.maxCredentialFreshnessSeconds) {
      findings.push(finding(
        'stale-evidence',
        'medium',
        20,
        'credential-freshness-too-old',
        [credential.credentialId],
      ));
    }
  }
  return findings;
}

function proofFindings(proofs: DeliveryFraudProofState[]) {
  const findings: DeliveryFraudFinding[] = [];
  for (const proof of proofs) {
    if (!proof.zkReady || !proof.verified) {
      findings.push(finding(
        'proof-scope-mismatch',
        'high',
        35,
        'zk-proof-not-ready-or-not-verified',
        [proof.proofId],
      ));
    }
    if (proof.expired) {
      findings.push(finding(
        'stale-evidence',
        'medium',
        20,
        'zk-proof-expired',
        [proof.proofId],
      ));
    }
    if (proof.replayDetected || proof.nullifierUsedBefore) {
      findings.push(finding(
        'zk-proof-replay',
        'critical',
        65,
        'zk-proof-nullifier-replay-detected',
        [proof.proofId],
      ));
    }
    if (proof.scopeMatches === false) {
      findings.push(finding(
        'proof-scope-mismatch',
        'high',
        34,
        'zk-proof-scope-mismatch',
        [proof.proofId],
      ));
    }
    if (proof.challengeMatches === false) {
      findings.push(finding(
        'proof-scope-mismatch',
        'high',
        36,
        'zk-proof-challenge-mismatch',
        [proof.proofId],
      ));
    }
  }
  return findings;
}

function decisionFor(score: number, findings: DeliveryFraudFinding[], policy: DeliveryFraudPolicy): DeliveryFraudDecision {
  if (findings.some(item => item.severity === 'critical' && (
    item.kind === 'credential-invalid' ||
    item.kind === 'zk-proof-replay' ||
    item.kind === 'signature-mismatch'
  ))) return 'block';
  if (score >= policy.blockScore) return 'block';
  if (score >= policy.manualReviewScore) return 'manual-review';
  if (score >= policy.allowWithControlsScore) return 'allow-with-controls';
  return 'allow';
}

function controlsFor(findings: DeliveryFraudFinding[], decision: DeliveryFraudDecision) {
  const controls: string[] = [];
  const kinds = new Set(findings.map(finding => finding.kind));
  if (kinds.has('gps-spoofing') || kinds.has('impossible-speed')) controls.push('require-live-device-attestation');
  if (kinds.has('request-burst')) controls.push('rate-limit-device-and-session');
  if (kinds.has('signature-mismatch') || kinds.has('device-credential-mismatch')) controls.push('require-device-rebind-or-passkey-step-up');
  if (kinds.has('zk-proof-replay')) controls.push('reject-nullifier-and-rotate-session');
  if (kinds.has('credential-invalid')) controls.push('check-revocation-and-reissue-credential');
  if (kinds.has('proof-scope-mismatch')) controls.push('regenerate-purpose-bound-proof');
  if (kinds.has('location-policy-mismatch')) controls.push('downgrade-to-coarse-cell-or-manual-review');
  if (kinds.has('stale-evidence')) controls.push('refresh-credential-proof');
  if (decision === 'manual-review') controls.push('queue-risk-review');
  if (decision === 'block') controls.push('block-delivery-approval');
  return unique(controls);
}

export function assessDeliveryFraudRisk(input: {
  locationSamples?: DeliveryFraudLocationSample[];
  requestEvents?: DeliveryFraudRequestEvent[];
  credentials?: DeliveryFraudCredentialState[];
  proofs?: DeliveryFraudProofState[];
  policy?: DeliveryFraudPolicy;
  now?: Date;
}): DeliveryFraudAssessment {
  const policy = input.policy ?? DEFAULT_DELIVERY_FRAUD_POLICY;
  const now = input.now ?? new Date();
  const locationSamples = input.locationSamples ?? [];
  const requestEvents = input.requestEvents ?? [];
  const credentials = input.credentials ?? [];
  const proofs = input.proofs ?? [];

  const findings = [
    ...gpsSpoofingFindings(locationSamples, policy),
    ...impossibleSpeedFindings(locationSamples, policy),
    ...requestBurstFindings(requestEvents, policy, now),
    ...requestIntegrityFindings(requestEvents),
    ...credentialFindings(credentials, policy),
    ...proofFindings(proofs),
  ];
  const riskScore = clamp(findings.reduce((sum, item) => sum + item.score, 0));
  const decision = decisionFor(riskScore, findings, policy);

  return {
    decision,
    riskScore,
    findings,
    requiredControls: controlsFor(findings, decision),
    safeSummary: [
      `findings:${findings.length}`,
      `risk:${riskScore}`,
      `decision:${decision}`,
      ...unique(findings.map(item => item.kind)).map(kind => `signal:${kind}`),
    ],
    privacy: {
      rawAddressUsed: false,
      preciseLocationPublic: false,
      privateKeyMaterialUsed: false,
      proofWitnessUsed: false,
    },
  };
}
