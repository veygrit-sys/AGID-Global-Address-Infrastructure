import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildCiscoInspiredNetworkAssurance,
  CISCO_INSPIRED_NETWORK_ASSURANCE_VERSION,
  validateCiscoInspiredNetworkAssurance,
} from './ciscoInspiredNetworkAssurance';

test('builds a ready local-only POS network posture without sensitive telemetry', () => {
  const report = buildCiscoInspiredNetworkAssurance({
    mode: 'local-only',
    terminalId: 'POS-001',
    siteId: 'store-tokyo-01',
    operatorRole: 'pickup-operator',
    network: {
      online: true,
      latencyMs: 12,
      packetLossPercent: 0,
      jitterMs: 4,
      dnsSecure: true,
      tlsVersion: 'local-dev',
      vpnOrSecureTunnel: true,
    },
    device: {
      attested: true,
      managed: true,
      osPatchAgeDays: 7,
      keyAgeHours: 24,
      clockSkewSeconds: 2,
    },
    resolver: {
      fallbackAvailable: true,
      signedRouteAds: true,
      staleRouteAds: false,
      anycastHealthy: true,
    },
    identity: {
      staffRoleVerified: true,
      mfaPresent: true,
      scopeBound: true,
      apiKeyScoped: true,
    },
  });

  assert.equal(report.version, CISCO_INSPIRED_NETWORK_ASSURANCE_VERSION);
  assert.equal(report.posture, 'ready');
  assert.equal(report.privacy.rawAddressStored, false);
  assert.equal(report.privacy.rawAgidStored, false);
  assert.equal(report.privacy.rawAoidStored, false);
  assert.equal(report.publicProjection.telemetryClass, 'metadata-only');
  assert.equal(validateCiscoInspiredNetworkAssurance(report).ok, true);
});

test('blocks high-risk workflows when raw address or AGID telemetry is enabled', () => {
  const report = buildCiscoInspiredNetworkAssurance({
    mode: 'enterprise-managed',
    highRiskMode: true,
    terminalId: 'POS-HIGH-RISK',
    network: {
      online: true,
      latencyMs: 80,
      packetLossPercent: 0,
      jitterMs: 10,
      dnsSecure: true,
      tlsVersion: 'TLS1.3',
      vpnOrSecureTunnel: true,
    },
    device: {
      attested: true,
      managed: true,
      osPatchAgeDays: 3,
      keyAgeHours: 4,
      clockSkewSeconds: 0,
    },
    resolver: {
      endpointCount: 2,
      signedRouteAds: true,
      staleRouteAds: false,
      anycastHealthy: true,
    },
    identity: {
      staffRoleVerified: true,
      mfaPresent: true,
      scopeBound: true,
      apiKeyScoped: true,
    },
    privacy: {
      rawAddressInTelemetry: true,
      rawAgidInTelemetry: true,
    },
  });

  assert.equal(report.posture, 'blocked');
  assert.ok(report.errors.includes('metadata-only-telemetry'));
  const validation = validateCiscoInspiredNetworkAssurance(report);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.includes('network-assurance-has-failing-checks'));
});

test('restricts stale unsigned edge resolver operations and recommends remediation', () => {
  const report = buildCiscoInspiredNetworkAssurance({
    mode: 'edge-resolver',
    terminalId: 'POS-EDGE-001',
    network: {
      online: true,
      latencyMs: 640,
      packetLossPercent: 3.5,
      jitterMs: 140,
      dnsSecure: false,
      tlsVersion: 'TLS1.2',
      vpnOrSecureTunnel: true,
    },
    device: {
      attested: true,
      managed: false,
      osPatchAgeDays: 50,
      keyAgeHours: 900,
      clockSkewSeconds: 220,
    },
    resolver: {
      endpointCount: 1,
      signedRouteAds: false,
      staleRouteAds: true,
      fallbackAvailable: true,
      anycastHealthy: false,
    },
    identity: {
      staffRoleVerified: true,
      scopeBound: true,
      apiKeyScoped: true,
    },
  });

  assert.equal(report.posture, 'restricted');
  assert.ok(report.score < 90);
  assert.ok(report.warnings.includes('signed-route-advertisements'));
  assert.ok(report.warnings.includes('resolver-freshness'));
  assert.ok(report.nextActions.includes('require-signed-address-route-ads'));
  assert.ok(report.requiredControls.includes('route-advertisement-signing'));
});

test('blocks compromised terminals and scope violations before POS handoff', () => {
  const report = buildCiscoInspiredNetworkAssurance({
    mode: 'server-registry',
    terminalId: 'POS-COMPROMISED',
    network: {
      online: true,
      latencyMs: 90,
      packetLossPercent: 0,
      jitterMs: 20,
      dnsSecure: true,
      tlsVersion: 'TLS1.3',
      vpnOrSecureTunnel: true,
    },
    device: {
      jailbreakOrRootDetected: true,
      keyAgeHours: 100,
      osPatchAgeDays: 5,
    },
    resolver: {
      endpointCount: 1,
      signedRouteAds: true,
      staleRouteAds: false,
      fallbackAvailable: true,
    },
    identity: {
      staffRoleVerified: true,
      scopeBound: false,
      apiKeyScoped: false,
    },
    incident: {
      malwareSignal: true,
    },
  });

  assert.equal(report.posture, 'blocked');
  assert.ok(report.errors.includes('device-root-jailbreak'));
  assert.ok(report.errors.includes('scope-bound-access'));
  assert.ok(report.errors.includes('malware-signal'));
  assert.ok(report.nextActions.includes('stop-handoff-and-escalate-network-posture'));
});
