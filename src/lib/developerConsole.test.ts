import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEVELOPER_CONSOLE_MODEL_VERSION,
  buildDeveloperConsole,
  validateDeveloperConsolePayloadIsSafe,
} from './developerConsole';

test('Developer Console builds API key refs, webhook logs, SDKs, CLI guide, OpenAPI summary, vectors, conformance, launch, and reference sections', () => {
  const consoleModel = buildDeveloperConsole({ generatedAt: '2026-06-20T00:00:00.000Z' });

  assert.equal(consoleModel.modelVersion, DEVELOPER_CONSOLE_MODEL_VERSION);
  assert.equal(consoleModel.accepted, true);
  assert.ok(consoleModel.apiKeys.length >= 2);
  assert.ok(consoleModel.webhooks.length >= 2);
  assert.ok(consoleModel.webhookLogs.length >= 3);
  assert.ok(consoleModel.sdkSnippets.some(snippet => snippet.language === 'typescript'));
  assert.ok(consoleModel.sdkSnippets.some(snippet => snippet.language === 'swift'));
  assert.ok(consoleModel.sdkSnippets.some(snippet => snippet.language === 'kotlin'));
  assert.ok(consoleModel.sdkSnippets.some(snippet => snippet.language === 'cpp'));
  assert.ok(consoleModel.sdkSnippets.some(snippet => snippet.language === 'dotnet'));
  for (const target of ['spec', 'wasm', 'r', 'julia', 'elixir', 'lua', 'zig', 'nim']) {
    assert.ok(consoleModel.sdkSnippets.some(snippet => snippet.language === target), `missing ${target}`);
  }
  assert.ok(consoleModel.sdkSnippets.length >= 21);
  assert.ok(consoleModel.cliCommands.some(command => command.purpose === 'conformance'));
  assert.ok(consoleModel.openApi.pathCount > 10);
  assert.ok(consoleModel.openApi.tagCount > 5);
  assert.ok(consoleModel.testVectors.some(vector => vector.surface === 'no-raw-address'));
  assert.ok(consoleModel.conformanceResults.some(result => result.suiteId === 'agid-resolver-conformance'));
  assert.ok(consoleModel.launchChecks.length > 0);
  assert.ok(consoleModel.apiErrorExamples.some(error => error.statusCode === 429 && error.retryable));
  assert.ok(consoleModel.featureCategories.some(category => category.label === 'Secure QR'));
  assert.ok(consoleModel.selfHostingOptions.some(option => option.mode === 'self-hosted'));
  assert.ok(consoleModel.communityLinks.some(link => link.label === 'Address Morphism Theory'));
  assert.ok(consoleModel.geoExamples.some(example => example.label === 'AGID Grid'));
  assert.equal(consoleModel.totals.communityLinks, consoleModel.communityLinks.length);
  assert.equal(consoleModel.totals.geoExamples, consoleModel.geoExamples.length);
  assert.ok(consoleModel.developerRoot.startsWith('DCR-'));
});

test('Developer Console safe export contains references and fingerprints, never key material or address bodies', () => {
  const consoleModel = buildDeveloperConsole({
    generatedAt: '2026-06-20T00:00:00.000Z',
    apiKeys: [{
      keyId: 'DKEY-STAGING-01',
      environment: 'staging',
      scopes: ['resolver:read', 'webhook:subscribe'],
      fingerprint: 'fp:dev_fedcba0987654321',
      status: 'active',
    }],
    webhooks: [{
      endpointId: 'DWEB-STAGING-01',
      environment: 'staging',
      urlRef: 'https://example.dev/events#ref',
      topics: ['address_intent.verified', 'handoff.completed'],
      signingKeyRef: 'signing-key-ref-only',
    }],
    webhookLogs: [{
      deliveryId: 'DLOG-STAGING-01',
      endpointId: 'DWEB-STAGING-01',
      topic: 'handoff.completed',
      status: 'delivered',
      eventRef: 'evt:handoff-completed:test',
      payloadFingerprint: 'payload:dev_safe_ref',
      signatureVerified: true,
    }],
    cliCommands: [{
      commandId: 'DCLI-CONFORMANCE-01',
      label: 'Run conformance',
      command: 'npm run verify:agid-resolver-conformance',
      purpose: 'conformance',
      status: 'ready',
    }],
    conformanceResults: [{
      suiteId: 'agid-resolver-conformance',
      label: 'AGID Resolver Conformance Tests',
      status: 'pass',
      command: 'npm run verify:agid-resolver-conformance',
      passed: 12,
      failed: 0,
      evidenceRef: 'reports/conformance/agid-resolver/latest.json',
    }],
  });

  const exported = JSON.stringify(consoleModel.safeExport);
  assert.match(exported, /DKEY-STAGING-01/);
  assert.match(exported, /signing-key-ref-only/);
  assert.match(exported, /DLOG-STAGING-01/);
  assert.match(exported, /DCLI-CONFORMANCE-01/);
  assert.match(exported, /agid-resolver-conformance/);
  assert.match(exported, /invalid_commitment_payload/);
  assert.match(exported, /secure-qr/);
  assert.match(exported, /self-hosted/);
  assert.match(exported, /address-morphism-theory/);
  assert.match(exported, /agid-grid/);
  assert.equal(consoleModel.totals.webhookLogEvents, 1);
  assert.equal(consoleModel.totals.conformanceSuites, 1);
  assert.doesNotMatch(exported, /sk_live|plaintext|recipientSecret|123456/);
  assert.equal(consoleModel.safeExport.privacy.keyMaterialAccepted, false);
  assert.equal(consoleModel.safeExport.privacy.rawAddressAccepted, false);
  assert.equal(consoleModel.safeExport.privacy.rawAgidAccepted, false);
  assert.equal(consoleModel.safeExport.privacy.rawAoidAccepted, false);
});

test('Developer Console rejects private material in developer payloads', () => {
  const safety = validateDeveloperConsolePayloadIsSafe({
    apiKey: 'sk_live_private_value',
    rawAddress: 'hidden private body',
    nested: { proofCode: '123456' },
  });

  assert.equal(safety.safe, false);
  assert.deepEqual(safety.forbiddenPaths.sort(), ['apiKey', 'nested.proofCode', 'rawAddress'].sort());

  const consoleModel = buildDeveloperConsole({
    apiKey: 'sk_live_private_value',
  } as never);

  assert.equal(consoleModel.accepted, false);
  assert.ok(consoleModel.errors.some(error => error.includes('private-material-not-accepted:apiKey')));
});
