import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAddressConnectRegistry,
  discoverAddressConnectEndpoints,
  listAddressConnectCapabilities,
} from './addressConnect';

test('Address Connect builds organization-only issuer and carrier registry metadata', () => {
  const registry = buildAddressConnectRegistry({
    registryId: 'test-connect',
    participants: [
      {
        participantId: 'jp-post-like-carrier',
        displayName: 'JP Carrier',
        roles: ['carrier'],
        countryCodes: ['jp'],
        trustLevel: 'verified-provider',
        endpointRefs: [
          {
            endpointId: 'carrier-jp-endpoint',
            kind: 'carrier',
            publicBaseUrl: 'https://carrier.example.test/agid',
            capabilities: ['delivery-handoff', 'waybill-status'],
            countryCodes: ['JP'],
          },
        ],
        apiKeyRefs: [
          {
            keyId: 'carrier-server-key',
            fingerprint: 'f'.repeat(32),
            scopes: ['endpoint:discover', 'terminal:read'],
          },
        ],
      },
      {
        participantId: 'issuer-city',
        displayName: 'City issuer',
        roles: ['issuer', 'municipality'],
        countryCodes: ['JP'],
        trustLevel: 'official',
        publicKeyCommitments: ['issuer-pubkey-commitment'],
        endpointRefs: [
          {
            kind: 'issuer',
            publicBaseUrl: 'https://issuer.example.test',
            capabilities: ['address-credential'],
          },
        ],
      },
    ],
  });

  assert.equal(registry.accepted, true);
  assert.equal(registry.counts.participants, 2);
  assert.equal(registry.counts.carriers, 1);
  assert.equal(registry.counts.issuers, 1);
  assert.equal(registry.privacy.personalAddressStorage, false);
  assert.equal(registry.privacy.rawApiKeyStorage, false);
  assert.match(registry.registryRoot, /^[0-9a-f]{64}$/);

  const discovery = discoverAddressConnectEndpoints(registry, {
    role: 'carrier',
    endpointKind: 'carrier',
    countryCode: 'jp',
    capability: 'delivery-handoff',
  });
  assert.equal(discovery.matchedEndpointCount, 1);
  assert.equal(discovery.matches[0].participantId, 'jp-post-like-carrier');
  assert.equal(discovery.matches[0].endpoint.endpointId, 'carrier-jp-endpoint');
});

test('Address Connect rejects raw address and API key material', () => {
  const registry = buildAddressConnectRegistry({
    participants: [
      {
        displayName: 'Unsafe carrier',
        roles: ['carrier'],
        addressText: '1-2-3 private street',
        apiKey: 'sk_live_not_allowed',
        endpoints: [{ kind: 'carrier', publicBaseUrl: 'https://carrier.example.test' }],
      },
    ],
  });

  assert.equal(registry.accepted, false);
  assert.equal(registry.participants.length, 0);
  assert.equal(registry.rejectedParticipants.length, 1);
  assert.ok(registry.rejectedParticipants[0].errors.some(error => error.includes('addressText')));
  assert.ok(registry.rejectedParticipants[0].errors.some(error => error.includes('apiKey')));
});

test('Address Connect capabilities expose scopes and privacy boundary', () => {
  const capabilities = listAddressConnectCapabilities();

  assert.ok(capabilities.roles.includes('issuer'));
  assert.ok(capabilities.roles.includes('carrier'));
  assert.ok(capabilities.endpointKinds.includes('revocation'));
  assert.ok(capabilities.scopes.includes('webhook:subscribe'));
  assert.equal(capabilities.supports.webhookOperations, true);
  assert.equal(capabilities.supports.slaMonitoring, true);
  assert.equal(capabilities.supports.logRetentionPolicy, true);
  assert.equal(capabilities.privacy.organizationsOnly, true);
  assert.equal(capabilities.privacy.personalAddressStorage, false);
});
