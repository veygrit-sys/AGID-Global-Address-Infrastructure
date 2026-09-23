export const CISCO_INSPIRED_NETWORK_ASSURANCE_VERSION = 'agid-cisco-inspired-network-assurance-v1';

export const CISCO_INSPIRED_NETWORK_CAPABILITIES = [
  'zero-trust-access',
  'device-posture',
  'secure-connect',
  'edge-resolver',
  'network-assurance',
  'segmentation',
  'dns-security',
  'incident-response',
  'observability',
] as const;

export type CiscoInspiredNetworkCapability = typeof CISCO_INSPIRED_NETWORK_CAPABILITIES[number];
export type CiscoInspiredNetworkMode =
  | 'local-only'
  | 'server-registry'
  | 'edge-resolver'
  | 'enterprise-managed';
export type CiscoInspiredNetworkPosture = 'ready' | 'monitor' | 'restricted' | 'blocked';
export type CiscoInspiredCheckState = 'pass' | 'warn' | 'fail';
export type CiscoInspiredCheckCategory =
  | 'zero-trust'
  | 'device-posture'
  | 'secure-connect'
  | 'edge-resolver'
  | 'network-assurance'
  | 'segmentation'
  | 'dns-security'
  | 'incident-response'
  | 'privacy';

export type CiscoInspiredNetworkAssuranceInput = {
  mode?: CiscoInspiredNetworkMode | string;
  terminalId?: string;
  siteId?: string;
  operatorRole?: string;
  highRiskMode?: boolean;
  now?: string;
  network?: {
    online?: boolean;
    latencyMs?: number;
    packetLossPercent?: number;
    jitterMs?: number;
    dnsSecure?: boolean;
    tlsVersion?: string;
    vpnOrSecureTunnel?: boolean;
    captivePortalDetected?: boolean;
    proxyInspectionDetected?: boolean;
  };
  device?: {
    attested?: boolean;
    managed?: boolean;
    osPatchAgeDays?: number;
    keyAgeHours?: number;
    jailbreakOrRootDetected?: boolean;
    clockSkewSeconds?: number;
  };
  resolver?: {
    endpointCount?: number;
    signedRouteAds?: boolean;
    staleRouteAds?: boolean;
    fallbackAvailable?: boolean;
    anycastHealthy?: boolean;
  };
  identity?: {
    staffRoleVerified?: boolean;
    mfaPresent?: boolean;
    scopeBound?: boolean;
    apiKeyScoped?: boolean;
  };
  privacy?: {
    rawAddressInTelemetry?: boolean;
    rawAgidInTelemetry?: boolean;
    rawAoidInTelemetry?: boolean;
    preciseLocationTelemetry?: boolean;
  };
  incident?: {
    recentFailedProofs?: number;
    suspiciousLookupRate?: boolean;
    malwareSignal?: boolean;
    policyViolationCount?: number;
  };
};

export type CiscoInspiredNetworkCheck = {
  id: string;
  category: CiscoInspiredCheckCategory;
  label: string;
  state: CiscoInspiredCheckState;
  detail: string;
  action: string;
  deduction: number;
};

export type CiscoInspiredNetworkAssurance = {
  version: typeof CISCO_INSPIRED_NETWORK_ASSURANCE_VERSION;
  generatedAt: string;
  terminalId: string;
  siteId: string;
  operatorRole: string;
  mode: CiscoInspiredNetworkMode;
  highRiskMode: boolean;
  posture: CiscoInspiredNetworkPosture;
  score: number;
  capabilities: CiscoInspiredNetworkCapability[];
  checks: CiscoInspiredNetworkCheck[];
  requiredControls: string[];
  nextActions: string[];
  warnings: string[];
  errors: string[];
  publicProjection: {
    terminalId: string;
    siteId: string;
    mode: CiscoInspiredNetworkMode;
    posture: CiscoInspiredNetworkPosture;
    score: number;
    failingChecks: number;
    warningChecks: number;
    telemetryClass: 'metadata-only';
  };
  privacy: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    rawIpStored: false;
    rawDeviceFingerprintStored: false;
    telemetryClass: 'metadata-only';
    highRiskMode: boolean;
  };
};

export type CiscoInspiredNetworkValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

function clean(value: unknown, fallback: string, maxLength = 80) {
  const text = String(value ?? '').normalize('NFKC').trim();
  if (!text) return fallback;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function normalizeMode(value: unknown): CiscoInspiredNetworkMode {
  if (
    value === 'local-only'
    || value === 'server-registry'
    || value === 'edge-resolver'
    || value === 'enterprise-managed'
  ) {
    return value;
  }
  return 'server-registry';
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isLocalMode(mode: CiscoInspiredNetworkMode) {
  return mode === 'local-only';
}

function addCheck(
  checks: CiscoInspiredNetworkCheck[],
  check: Omit<CiscoInspiredNetworkCheck, 'deduction'> & { deduction?: number },
) {
  const deduction = check.deduction ?? (check.state === 'fail' ? 25 : check.state === 'warn' ? 8 : 0);
  checks.push({ ...check, deduction });
}

function pushUnique(target: string[], value: string) {
  if (!target.includes(value)) target.push(value);
}

function buildPosture(score: number, checks: CiscoInspiredNetworkCheck[], highRiskMode: boolean): CiscoInspiredNetworkPosture {
  const failCount = checks.filter((check) => check.state === 'fail').length;
  const warnCount = checks.filter((check) => check.state === 'warn').length;
  if (failCount > 0) return 'blocked';
  if (score < 70) return 'restricted';
  if (highRiskMode && warnCount > 0) return 'restricted';
  if (warnCount >= 3) return 'restricted';
  if (warnCount > 0 || score < 90) return 'monitor';
  return 'ready';
}

function actionFromChecks(checks: CiscoInspiredNetworkCheck[], posture: CiscoInspiredNetworkPosture) {
  const nextActions: string[] = [];
  if (posture === 'blocked') pushUnique(nextActions, 'stop-handoff-and-escalate-network-posture');
  for (const check of checks) {
    if (check.state !== 'pass') pushUnique(nextActions, check.action);
  }
  if (nextActions.length === 0) nextActions.push('continue-pos-operations');
  return nextActions;
}

export function listCiscoInspiredCapabilities() {
  return [...CISCO_INSPIRED_NETWORK_CAPABILITIES];
}

export function buildCiscoInspiredNetworkAssurance(input: CiscoInspiredNetworkAssuranceInput = {}): CiscoInspiredNetworkAssurance {
  const mode = normalizeMode(input.mode);
  const highRiskMode = Boolean(input.highRiskMode);
  const generatedAt = clean(input.now, new Date().toISOString(), 48);
  const terminalId = clean(input.terminalId, 'POS-LOCAL');
  const siteId = clean(input.siteId, 'local-site');
  const operatorRole = clean(input.operatorRole, 'operator');
  const network = input.network ?? {};
  const device = input.device ?? {};
  const resolver = input.resolver ?? {};
  const identity = input.identity ?? {};
  const privacy = input.privacy ?? {};
  const incident = input.incident ?? {};
  const checks: CiscoInspiredNetworkCheck[] = [];
  const requiredControls: string[] = [
    'metadata-only-telemetry',
    'scope-bound-access',
    'local-offline-fallback',
  ];

  const online = network.online !== false;
  const fallbackAvailable = resolver.fallbackAvailable !== false;
  addCheck(checks, {
    id: 'network-online-or-fallback',
    category: 'network-assurance',
    label: 'Network reachability',
    state: online ? 'pass' : fallbackAvailable ? 'warn' : 'fail',
    detail: online
      ? 'POS can reach the active resolver or registry path.'
      : fallbackAvailable
        ? 'Network is offline, but local fallback can continue with deferred sync.'
        : 'Network is offline and no local fallback path is configured.',
    action: online ? 'continue-pos-operations' : fallbackAvailable ? 'use-local-fallback-and-sync-later' : 'restore-network-or-enable-local-fallback',
    deduction: online ? 0 : fallbackAvailable ? 6 : 28,
  });

  const latencyMs = finiteNumber(network.latencyMs, isLocalMode(mode) ? 0 : 120);
  addCheck(checks, {
    id: 'latency-budget',
    category: 'network-assurance',
    label: 'Latency budget',
    state: latencyMs <= 250 ? 'pass' : latencyMs <= 800 ? 'warn' : 'fail',
    detail: `Observed latency budget is ${Math.round(latencyMs)}ms.`,
    action: latencyMs <= 250 ? 'continue-pos-operations' : 'route-to-closer-edge-or-local-cache',
    deduction: latencyMs <= 250 ? 0 : latencyMs <= 800 ? 7 : 18,
  });

  const packetLoss = finiteNumber(network.packetLossPercent, 0);
  addCheck(checks, {
    id: 'packet-loss-budget',
    category: 'network-assurance',
    label: 'Packet loss',
    state: packetLoss <= 1 ? 'pass' : packetLoss <= 5 ? 'warn' : 'fail',
    detail: `Packet loss estimate is ${packetLoss.toFixed(1)}%.`,
    action: packetLoss <= 1 ? 'continue-pos-operations' : 'prefer-offline-queue-and-retry-sync',
    deduction: packetLoss <= 1 ? 0 : packetLoss <= 5 ? 7 : 18,
  });

  const jitterMs = finiteNumber(network.jitterMs, 20);
  addCheck(checks, {
    id: 'jitter-budget',
    category: 'network-assurance',
    label: 'Jitter',
    state: jitterMs <= 80 ? 'pass' : jitterMs <= 180 ? 'warn' : 'fail',
    detail: `Jitter estimate is ${Math.round(jitterMs)}ms.`,
    action: jitterMs <= 80 ? 'continue-pos-operations' : 'defer-noncritical-registry-sync',
    deduction: jitterMs <= 80 ? 0 : jitterMs <= 180 ? 5 : 14,
  });

  const tlsVersion = clean(network.tlsVersion, isLocalMode(mode) ? 'local-only' : 'unknown', 40);
  const tlsOk = isLocalMode(mode)
    || tlsVersion.toLowerCase().includes('local-dev')
    || tlsVersion.includes('1.3')
    || tlsVersion.includes('1.2');
  const tlsStrong = isLocalMode(mode) || tlsVersion.toLowerCase().includes('local-dev') || tlsVersion.includes('1.3');
  addCheck(checks, {
    id: 'encrypted-transport',
    category: 'secure-connect',
    label: 'Encrypted transport',
    state: tlsOk ? tlsStrong ? 'pass' : 'warn' : 'fail',
    detail: tlsOk ? `Transport reports ${tlsVersion}.` : 'Registry or resolver transport is not encrypted.',
    action: tlsOk ? tlsStrong ? 'continue-pos-operations' : 'prefer-tls-1-3-edge-endpoint' : 'require-tls-for-registry-and-resolver',
    deduction: tlsOk ? tlsStrong ? 0 : 5 : 25,
  });

  const dnsSecure = network.dnsSecure !== false || isLocalMode(mode);
  addCheck(checks, {
    id: 'dns-security',
    category: 'dns-security',
    label: 'Signed resolver discovery',
    state: dnsSecure ? 'pass' : highRiskMode ? 'fail' : 'warn',
    detail: dnsSecure
      ? 'Resolver discovery is treated as signed, pinned, or local.'
      : 'Resolver discovery lacks DNSSEC/RPKI-style assurance.',
    action: dnsSecure ? 'continue-pos-operations' : 'pin-resolver-or-enable-signed-zone-discovery',
    deduction: dnsSecure ? 0 : highRiskMode ? 22 : 7,
  });

  const secureTunnel = network.vpnOrSecureTunnel !== false || isLocalMode(mode);
  addCheck(checks, {
    id: 'secure-connect-overlay',
    category: 'secure-connect',
    label: 'Secure connect overlay',
    state: secureTunnel ? 'pass' : highRiskMode ? 'fail' : 'warn',
    detail: secureTunnel
      ? 'Traffic can use a secure tunnel, local-only path, or pinned HTTPS endpoint.'
      : 'High-risk POS traffic is not behind a secure tunnel or pinned endpoint.',
    action: secureTunnel ? 'continue-pos-operations' : 'enable-secure-tunnel-or-local-only-mode',
    deduction: secureTunnel ? 0 : highRiskMode ? 20 : 6,
  });

  addCheck(checks, {
    id: 'captive-portal',
    category: 'secure-connect',
    label: 'Captive portal',
    state: network.captivePortalDetected ? highRiskMode ? 'fail' : 'warn' : 'pass',
    detail: network.captivePortalDetected
      ? 'Captive portal behavior was detected on the POS network.'
      : 'No captive portal behavior was reported.',
    action: network.captivePortalDetected ? 'move-terminal-to-managed-network' : 'continue-pos-operations',
    deduction: network.captivePortalDetected ? highRiskMode ? 18 : 6 : 0,
  });

  addCheck(checks, {
    id: 'proxy-inspection',
    category: 'secure-connect',
    label: 'Proxy inspection',
    state: network.proxyInspectionDetected ? highRiskMode ? 'fail' : 'warn' : 'pass',
    detail: network.proxyInspectionDetected
      ? 'TLS inspection or proxy rewriting was detected or declared.'
      : 'No proxy inspection signal was declared.',
    action: network.proxyInspectionDetected ? 'disable-address-telemetry-through-inspected-proxy' : 'continue-pos-operations',
    deduction: network.proxyInspectionDetected ? highRiskMode ? 20 : 7 : 0,
  });

  addCheck(checks, {
    id: 'device-root-jailbreak',
    category: 'device-posture',
    label: 'Compromised runtime',
    state: device.jailbreakOrRootDetected ? 'fail' : 'pass',
    detail: device.jailbreakOrRootDetected
      ? 'Device reports root, jailbreak, or compromised runtime signal.'
      : 'No root or jailbreak signal is declared.',
    action: device.jailbreakOrRootDetected ? 'remove-terminal-from-service' : 'continue-pos-operations',
    deduction: device.jailbreakOrRootDetected ? 35 : 0,
  });

  const attested = Boolean(device.attested);
  const managed = Boolean(device.managed);
  const deviceState: CiscoInspiredCheckState = attested || managed ? 'pass' : highRiskMode ? 'warn' : 'warn';
  addCheck(checks, {
    id: 'device-attestation',
    category: 'device-posture',
    label: 'Device posture',
    state: deviceState,
    detail: attested || managed
      ? 'Device is attested or enterprise-managed.'
      : 'Browser-only terminal has no hardware or MDM attestation signal.',
    action: attested || managed ? 'continue-pos-operations' : 'pair-managed-terminal-or-require-supervisor',
    deduction: attested || managed ? 0 : highRiskMode ? 10 : 5,
  });

  const patchAgeDays = finiteNumber(device.osPatchAgeDays, 0);
  addCheck(checks, {
    id: 'device-patch-age',
    category: 'device-posture',
    label: 'Patch age',
    state: patchAgeDays <= 45 ? 'pass' : patchAgeDays <= 90 ? 'warn' : 'fail',
    detail: patchAgeDays ? `OS patch age is approximately ${Math.round(patchAgeDays)} days.` : 'OS patch age is not declared; local browser mode treats it as unknown.',
    action: patchAgeDays <= 45 ? 'continue-pos-operations' : 'update-pos-terminal-before-high-risk-work',
    deduction: patchAgeDays <= 45 ? 0 : patchAgeDays <= 90 ? 6 : 20,
  });

  const keyAgeHours = finiteNumber(device.keyAgeHours, 0);
  addCheck(checks, {
    id: 'device-key-age',
    category: 'device-posture',
    label: 'Terminal key freshness',
    state: keyAgeHours <= 720 ? 'pass' : keyAgeHours <= 2160 ? 'warn' : 'fail',
    detail: keyAgeHours ? `Active terminal key age is about ${Math.round(keyAgeHours)} hours.` : 'No stale terminal key age was reported.',
    action: keyAgeHours <= 720 ? 'continue-pos-operations' : 'rotate-pos-terminal-keys',
    deduction: keyAgeHours <= 720 ? 0 : keyAgeHours <= 2160 ? 8 : 22,
  });

  const clockSkew = Math.abs(finiteNumber(device.clockSkewSeconds, 0));
  addCheck(checks, {
    id: 'clock-skew',
    category: 'device-posture',
    label: 'Clock skew',
    state: clockSkew <= 180 ? 'pass' : clockSkew <= 900 ? 'warn' : 'fail',
    detail: `Clock skew estimate is ${Math.round(clockSkew)} seconds.`,
    action: clockSkew <= 180 ? 'continue-pos-operations' : 'sync-terminal-clock-before-receipts',
    deduction: clockSkew <= 180 ? 0 : clockSkew <= 900 ? 8 : 22,
  });

  const endpointCount = Math.max(0, Math.floor(finiteNumber(resolver.endpointCount, isLocalMode(mode) ? 0 : 1)));
  addCheck(checks, {
    id: 'resolver-endpoints',
    category: 'edge-resolver',
    label: 'Resolver endpoints',
    state: endpointCount > 0 || isLocalMode(mode) || fallbackAvailable ? 'pass' : 'fail',
    detail: endpointCount > 0
      ? `${endpointCount} resolver endpoint(s) are configured.`
      : isLocalMode(mode)
        ? 'Local-only mode does not require remote resolver endpoints.'
        : fallbackAvailable
          ? 'No remote resolver endpoint, but local fallback is available.'
          : 'No resolver endpoint or fallback path is available.',
    action: endpointCount > 0 || isLocalMode(mode) ? 'continue-pos-operations' : 'configure-resolver-endpoint-or-local-fallback',
    deduction: endpointCount > 0 || isLocalMode(mode) || fallbackAvailable ? 0 : 24,
  });

  const signedRouteAds = resolver.signedRouteAds !== false || isLocalMode(mode);
  addCheck(checks, {
    id: 'signed-route-advertisements',
    category: 'edge-resolver',
    label: 'Signed route advertisements',
    state: signedRouteAds ? 'pass' : highRiskMode ? 'fail' : 'warn',
    detail: signedRouteAds
      ? 'Resolver route advertisements are signed, pinned, or local.'
      : 'Resolver route advertisements are not signed.',
    action: signedRouteAds ? 'continue-pos-operations' : 'require-signed-address-route-ads',
    deduction: signedRouteAds ? 0 : highRiskMode ? 22 : 8,
  });

  addCheck(checks, {
    id: 'resolver-freshness',
    category: 'edge-resolver',
    label: 'Resolver freshness',
    state: resolver.staleRouteAds ? highRiskMode ? 'fail' : 'warn' : 'pass',
    detail: resolver.staleRouteAds
      ? 'Resolver route advertisements or registry roots are stale.'
      : 'Resolver route advertisements are fresh.',
    action: resolver.staleRouteAds ? 'refresh-registry-root-and-route-ads' : 'continue-pos-operations',
    deduction: resolver.staleRouteAds ? highRiskMode ? 20 : 8 : 0,
  });

  addCheck(checks, {
    id: 'edge-health',
    category: 'edge-resolver',
    label: 'Edge health',
    state: resolver.anycastHealthy === false ? 'warn' : 'pass',
    detail: resolver.anycastHealthy === false
      ? 'Nearest resolver or anycast-style edge is degraded.'
      : 'Edge resolver health is acceptable.',
    action: resolver.anycastHealthy === false ? 'use-secondary-resolver-or-local-cache' : 'continue-pos-operations',
    deduction: resolver.anycastHealthy === false ? 6 : 0,
  });

  addCheck(checks, {
    id: 'staff-role-verified',
    category: 'zero-trust',
    label: 'Staff role verification',
    state: identity.staffRoleVerified ? 'pass' : highRiskMode ? 'fail' : 'warn',
    detail: identity.staffRoleVerified
      ? 'Operator role is present for access decisions.'
      : 'Operator role is missing or not verified.',
    action: identity.staffRoleVerified ? 'continue-pos-operations' : 'require-staff-sign-in-before-sensitive-workflow',
    deduction: identity.staffRoleVerified ? 0 : highRiskMode ? 22 : 7,
  });

  addCheck(checks, {
    id: 'mfa-for-sensitive-actions',
    category: 'zero-trust',
    label: 'MFA for sensitive actions',
    state: identity.mfaPresent || !highRiskMode ? 'pass' : 'warn',
    detail: identity.mfaPresent
      ? 'MFA or equivalent supervisor factor is present.'
      : highRiskMode
        ? 'High-risk mode should require MFA or supervisor approval.'
        : 'MFA is optional for this workflow.',
    action: identity.mfaPresent || !highRiskMode ? 'continue-pos-operations' : 'require-mfa-or-supervisor-approval',
    deduction: identity.mfaPresent || !highRiskMode ? 0 : 10,
  });

  const scopeBound = identity.scopeBound !== false;
  const apiKeyScoped = identity.apiKeyScoped !== false;
  addCheck(checks, {
    id: 'scope-bound-access',
    category: 'segmentation',
    label: 'Scope-bound access',
    state: scopeBound && apiKeyScoped ? 'pass' : 'fail',
    detail: scopeBound && apiKeyScoped
      ? 'Access is separated by purpose scope and API/client context.'
      : 'A request can cross purpose boundaries or use an unscoped API key.',
    action: scopeBound && apiKeyScoped ? 'continue-pos-operations' : 'enforce-domain-separated-scopes',
    deduction: scopeBound && apiKeyScoped ? 0 : 30,
  });

  const rawTelemetry = Boolean(privacy.rawAddressInTelemetry || privacy.rawAgidInTelemetry || privacy.rawAoidInTelemetry);
  addCheck(checks, {
    id: 'metadata-only-telemetry',
    category: 'privacy',
    label: 'Metadata-only telemetry',
    state: rawTelemetry ? 'fail' : 'pass',
    detail: rawTelemetry
      ? 'Telemetry would expose raw address, AGID, or AOID data.'
      : 'Telemetry excludes raw address, AGID, and AOID values.',
    action: rawTelemetry ? 'redact-telemetry-before-export' : 'continue-pos-operations',
    deduction: rawTelemetry ? 35 : 0,
  });

  addCheck(checks, {
    id: 'coarse-location-telemetry',
    category: 'privacy',
    label: 'Coarse location telemetry',
    state: privacy.preciseLocationTelemetry ? highRiskMode ? 'fail' : 'warn' : 'pass',
    detail: privacy.preciseLocationTelemetry
      ? 'Precise location telemetry is enabled.'
      : 'Telemetry uses coarse location, aliases, or no location data.',
    action: privacy.preciseLocationTelemetry ? 'downgrade-telemetry-to-coarse-location' : 'continue-pos-operations',
    deduction: privacy.preciseLocationTelemetry ? highRiskMode ? 24 : 8 : 0,
  });

  const failedProofs = Math.max(0, Math.floor(finiteNumber(incident.recentFailedProofs, 0)));
  addCheck(checks, {
    id: 'failed-proof-spike',
    category: 'incident-response',
    label: 'Failed proof spike',
    state: failedProofs <= 10 ? 'pass' : failedProofs <= 50 ? 'warn' : 'fail',
    detail: `${failedProofs} recent failed proof or receipt attempts were declared.`,
    action: failedProofs <= 10 ? 'continue-pos-operations' : 'open-incident-review-case',
    deduction: failedProofs <= 10 ? 0 : failedProofs <= 50 ? 8 : 24,
  });

  addCheck(checks, {
    id: 'lookup-abuse-signal',
    category: 'incident-response',
    label: 'Lookup abuse signal',
    state: incident.suspiciousLookupRate ? 'warn' : 'pass',
    detail: incident.suspiciousLookupRate
      ? 'Suspicious lookup or scan rate was detected.'
      : 'No suspicious lookup rate was declared.',
    action: incident.suspiciousLookupRate ? 'rate-limit-and-review-address-lookup-pattern' : 'continue-pos-operations',
    deduction: incident.suspiciousLookupRate ? 8 : 0,
  });

  addCheck(checks, {
    id: 'malware-signal',
    category: 'incident-response',
    label: 'Malware signal',
    state: incident.malwareSignal ? 'fail' : 'pass',
    detail: incident.malwareSignal
      ? 'A malware or endpoint compromise signal was declared.'
      : 'No malware signal was declared.',
    action: incident.malwareSignal ? 'isolate-terminal-and-revoke-keys' : 'continue-pos-operations',
    deduction: incident.malwareSignal ? 35 : 0,
  });

  const policyViolations = Math.max(0, Math.floor(finiteNumber(incident.policyViolationCount, 0)));
  addCheck(checks, {
    id: 'policy-violations',
    category: 'incident-response',
    label: 'Policy violations',
    state: policyViolations === 0 ? 'pass' : highRiskMode ? 'fail' : 'warn',
    detail: `${policyViolations} policy violation(s) were declared for the current operating window.`,
    action: policyViolations === 0 ? 'continue-pos-operations' : 'review-policy-violations-before-handoff',
    deduction: policyViolations === 0 ? 0 : highRiskMode ? 25 : 9,
  });

  const rawScore = 100 - checks.reduce((total, check) => total + check.deduction, 0);
  const score = clamp(Math.round(rawScore), 0, 100);
  const posture = buildPosture(score, checks, highRiskMode);
  const warnings = checks.filter((check) => check.state === 'warn').map((check) => check.id);
  const errors = checks.filter((check) => check.state === 'fail').map((check) => check.id);
  const nextActions = actionFromChecks(checks, posture);

  if (mode !== 'local-only') {
    pushUnique(requiredControls, 'signed-resolver-discovery');
    pushUnique(requiredControls, 'registry-freshness-monitoring');
  }
  if (mode === 'edge-resolver' || mode === 'enterprise-managed') {
    pushUnique(requiredControls, 'edge-health-monitoring');
    pushUnique(requiredControls, 'route-advertisement-signing');
  }
  if (mode === 'enterprise-managed') {
    pushUnique(requiredControls, 'staff-sso-or-mfa');
    pushUnique(requiredControls, 'managed-device-posture');
  }
  if (highRiskMode) {
    pushUnique(requiredControls, 'coarse-location-only');
    pushUnique(requiredControls, 'supervisor-review-for-warnings');
  }

  return {
    version: CISCO_INSPIRED_NETWORK_ASSURANCE_VERSION,
    generatedAt,
    terminalId,
    siteId,
    operatorRole,
    mode,
    highRiskMode,
    posture,
    score,
    capabilities: listCiscoInspiredCapabilities(),
    checks,
    requiredControls,
    nextActions,
    warnings,
    errors,
    publicProjection: {
      terminalId,
      siteId,
      mode,
      posture,
      score,
      failingChecks: errors.length,
      warningChecks: warnings.length,
      telemetryClass: 'metadata-only',
    },
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawIpStored: false,
      rawDeviceFingerprintStored: false,
      telemetryClass: 'metadata-only',
      highRiskMode,
    },
  };
}

export function validateCiscoInspiredNetworkAssurance(
  report: CiscoInspiredNetworkAssurance,
): CiscoInspiredNetworkValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (report.version !== CISCO_INSPIRED_NETWORK_ASSURANCE_VERSION) {
    errors.push('unsupported-network-assurance-version');
  }
  if (
    report.privacy.rawAddressStored
    || report.privacy.rawAgidStored
    || report.privacy.rawAoidStored
    || report.privacy.rawIpStored
    || report.privacy.rawDeviceFingerprintStored
  ) {
    errors.push('raw-sensitive-network-telemetry-enabled');
  }
  if (report.publicProjection.telemetryClass !== 'metadata-only') {
    errors.push('public-projection-telemetry-class-must-be-metadata-only');
  }
  if (report.errors.length > 0 || report.checks.some((check) => check.state === 'fail')) {
    errors.push('network-assurance-has-failing-checks');
  }
  if (report.warnings.length > 0) {
    warnings.push('network-assurance-has-warning-checks');
  }
  if (report.highRiskMode && report.posture !== 'ready' && report.posture !== 'blocked') {
    warnings.push('high-risk-mode-requires-supervisor-review');
  }
  return { ok: errors.length === 0, errors, warnings };
}
