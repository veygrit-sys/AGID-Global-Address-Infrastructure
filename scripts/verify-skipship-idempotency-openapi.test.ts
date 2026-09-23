import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

function runVerifierWithMutatedOpenApi(mutator: (openapi: string) => string) {
  const root = mkdtempSync(join(tmpdir(), 'skipship-idempotency-openapi-'));
  const openapiPath = join(root, 'delivery-gateway-carrier-api.openapi.yaml');
  const openapi = mutator(readFileSync('docs/specs/delivery-gateway-carrier-api.openapi.yaml', 'utf8'));

  writeFileSync(openapiPath, openapi, 'utf8');

  const result = spawnSync(process.execPath, [
    'node_modules/tsx/dist/cli.mjs',
    'scripts/verify-skipship-idempotency-openapi.ts',
    '--openapi',
    openapiPath,
    '--json',
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout) as { status: string; errors: string[] };
}

test('Skipship idempotency OpenAPI verifier rejects shipment examples without wallet country-form refs', () => {
  const payload = runVerifierWithMutatedOpenApi(openapi => openapi
    .replaceAll('addressFormVersion: wallet_country_form_ref_synthetic_001', 'addressFormVersion: form_ref_missing_prefix_001'));

  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('address-form-version-example-prefix-missing:/v1/shipments'));
  assert.ok(payload.errors.includes('address-form-version-example-prefix-missing:/v1/hexaship/mvp-v0.1/shipments'));
  assert.doesNotMatch(JSON.stringify(payload), /rawAddress|carrierApiKey|proofWitness|privateKey|proofSecret/);
});

test('Skipship idempotency OpenAPI verifier rejects missing shipment replay response header', () => {
  const replayedHeaderBlock = [
    '            skipship-idempotency-replayed:',
    "              $ref: '#/components/headers/SkipshipIdempotencyReplayed'",
    '          content:',
  ].join('\n');
  const payload = runVerifierWithMutatedOpenApi(openapi => {
    const shipmentPathMarker = '  /v1/shipments:\n';
    const [beforeShipment, afterShipment] = openapi.split(shipmentPathMarker);
    assert.ok(beforeShipment);
    assert.ok(afterShipment?.includes(replayedHeaderBlock));
    return `${beforeShipment}${shipmentPathMarker}${afterShipment.replace(replayedHeaderBlock, '          content:')}`;
  });

  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('missing-idempotency-replayed-response-header:/v1/shipments'));
});

test('Skipship idempotency OpenAPI verifier rejects missing tracking webhook blocked material', () => {
  const payload = runVerifierWithMutatedOpenApi(openapi => {
    const blockedMaterialLine = [
      '          - proof_witness',
      '          - raw_tracking_payload',
      '      parameters:',
    ].join('\n');
    assert.ok(openapi.includes(blockedMaterialLine));
    return openapi.replace(blockedMaterialLine, [
      '          - proof_witness',
      '      parameters:',
    ].join('\n'));
  });

  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('tracking-webhook-event-idempotency-blocked-material-missing:raw_tracking_payload'));
});

test('Skipship idempotency OpenAPI verifier rejects tracking webhook TTL drift from runtime store default', () => {
  const payload = runVerifierWithMutatedOpenApi(openapi => {
    const ttlLine = '        minimumStoreTtlDays: 30';
    assert.ok(openapi.includes(ttlLine));
    return openapi.replace(ttlLine, '        minimumStoreTtlDays: 29');
  });

  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('tracking-webhook-store-ttl-mismatch'));
});

test('Skipship idempotency OpenAPI verifier rejects missing internal carrier handoff evidence', () => {
  const extensionBlock = [
    '      x-agid-internal-evidence:',
    '        evidenceId: carrier-only-handoff-ref-v0.1',
    '        sourceContract: src/lib/deliveryGatewayCarrierApi.ts#buildCarrierOnlyHandoffRefEvidence',
    '        visibility: carrier-adapter-only',
    '        publicSchemaFieldAllowed: false',
    "        safeRefPattern: '^carrier_handoff_[0-9a-f]{24}$'",
    '        localOnly: true',
    '        productionTraffic: false',
    '        prerequisiteRefs:',
    '          - addressAliasRef',
    '          - walletConsentRef',
    '          - carrierCapabilityRef',
    '          - allocationRef',
    '          - labelRef',
    '        merchantVisibleRefFields:',
    '          - allocationRef',
    '          - labelRef',
    '          - trackingReceiptRef',
    '          - deliveryProofRef',
    '        forbiddenPublicSchemaFields:',
    '          - carrierHandoffRef',
    '          - rawAddress',
    '          - recipientPhone',
    '          - carrierApiKey',
    '          - proofWitness',
    '          - privateKey',
    '          - proofSecret',
    '          - rawCarrierPayload',
    '        nonClaims:',
    '          - not-public-api-field',
    '          - not-merchant-visible-receipt',
    '          - not-raw-address-material',
    '          - not-production-carrier-traffic',
    '          - not-real-label-purchase',
  ].join('\n');
  const payload = runVerifierWithMutatedOpenApi(openapi => {
    assert.ok(openapi.includes(extensionBlock));
    return openapi.replace(extensionBlock, '');
  });

  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('missing-carrier-handoff-internal-evidence'));
});

test('Skipship idempotency OpenAPI verifier rejects carrier handoff refs in public schemas', () => {
  const schemaAnchor = [
    '    SandboxCarrierSmokeSummary:',
    '      type: object',
    '      additionalProperties: false',
    '      required:',
    '        - fixtureId',
    '        - localOnly',
    '        - productionTraffic',
    '        - rawAddressFixtures',
    '        - merchantVisible',
    '      properties:',
  ].join('\n');
  const payload = runVerifierWithMutatedOpenApi(openapi => {
    assert.ok(openapi.includes(schemaAnchor));
    return openapi.replace(schemaAnchor, [
      schemaAnchor,
      '        carrierHandoffRef:',
      '          type: string',
      '          description: Internal carrier handoff ref should not be public.',
    ].join('\n'));
  });

  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('carrier-handoff-public-schema-field-present'));
});
