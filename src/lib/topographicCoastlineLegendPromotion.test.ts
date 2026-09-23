import assert from 'node:assert/strict';
import {
  createHash,
  generateKeyPairSync,
  sign,
} from 'node:crypto';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  AGID_SYNTHETIC_TOPO_SOURCE,
  type TopographicSourceRecord,
} from './topographicExport';
import {
  createCoastlineClassificationLegendReceipt,
  TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
} from './topographicCoastlineClassificationSemantics';
import {
  buildCoastlineLegendPromotionPayload,
  verifyCoastlineLegendPromotion,
  type CoastlineLegendPromotionPayload,
  type CoastlineLegendPromotionSignature,
} from './topographicCoastlineLegendPromotion';

const now = '2026-07-28T00:00:00.000Z';

function sha256(bytes: Uint8Array) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
}

async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'agid-coastline-promotion-'));
  const classificationGeoTiff = Uint8Array.from([1, 2, 3, 4]);
  const legendBytes = new TextEncoder().encode(
    '{"version":"synthetic-public-legend-v1"}',
  );
  const sourceRecord: TopographicSourceRecord = {
    ...AGID_SYNTHETIC_TOPO_SOURCE,
    sourceId: 'synthetic-coastline-promotion-source',
    version: 'synthetic-coastline-promotion-v1',
    layerIds: ['waterways'],
    snapshotEvidence: {
      contentSha256: sha256(classificationGeoTiff),
      adapterVersion: 'synthetic-coastline-promotion-test-v1',
      verifiedAt: now,
      horizontalCrs: 'EPSG:4326',
      verticalDatum: 'not-applicable: coastline classification',
    },
  };
  const created = await createCoastlineClassificationLegendReceipt({
    sourceRecord,
    classificationGeoTiff: classificationGeoTiff.buffer,
    legendBytes,
    classificationSemantics: {
      schemaVersion: TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
      bandIndex: 0,
      legend: {
        url: 'https://example.test/public-coastline-legend-v1',
        version: 'synthetic-public-legend-v1',
        publishedAt: '2026-07-01T00:00:00.000Z',
        sha256: sha256(legendBytes),
      },
      classes: [
        { value: 0, meaning: 'ocean' },
        { value: 1, meaning: 'breakline' },
        { value: 2, meaning: 'land' },
      ],
    },
    validatedAt: now,
  });
  const reviewers = ['reviewer-a', 'reviewer-b'].map((reviewerId, index) => {
    const keys = generateKeyPairSync('ed25519');
    return {
      reviewerId,
      keyId: `independent-${index + 1}`,
      ...keys,
    };
  });
  const trustStorePath = join(directory, 'reviewer-policy.json');
  writeFileSync(trustStorePath, `${JSON.stringify({
    version: 'addressql-trust-store-v2',
    policy: { minimumSignatures: 2 },
    keys: Object.fromEntries(reviewers.map(reviewer => [reviewer.keyId, {
      reviewerId: reviewer.reviewerId,
      publicKey: reviewer.publicKey.export({ type: 'spki', format: 'pem' }),
      status: 'active',
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z',
      addedAt: '2026-01-01T00:00:00.000Z',
    }])),
  }, null, 2)}\n`);
  const payload: CoastlineLegendPromotionPayload = {
    version: 'agid-coastline-legend-promotion-payload-v1',
    promotionId: 'synthetic-coastline-legend-v1',
    sequence: 1,
    previousPromotionDigest: null,
    source: created.receipt.source,
    legendReceiptSha256: created.receiptSha256,
    createdAt: now,
    validFrom: now,
    validUntil: '2026-08-01T00:00:00.000Z',
    minimumSignatures: 2,
  };
  return {
    directory,
    sourceRecord,
    receipt: created.receipt,
    payload,
    trustStorePath,
    reviewers,
  };
}

function signatures(
  payload: CoastlineLegendPromotionPayload,
  reviewers: Array<{
    reviewerId: string;
    keyId: string;
    privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'];
  }>,
): CoastlineLegendPromotionSignature[] {
  const canonical = buildCoastlineLegendPromotionPayload(payload);
  return reviewers.map(reviewer => ({
    keyId: reviewer.keyId,
    reviewerId: reviewer.reviewerId,
    signature: sign(null, Buffer.from(canonical, 'utf8'), reviewer.privateKey)
      .toString('base64'),
  }));
}

test('two independent active Ed25519 reviewers promote one bound coastline legend receipt', async () => {
  const files = await fixture();
  try {
    const approvals = signatures(files.payload, files.reviewers);
    const result = await verifyCoastlineLegendPromotion({
      sourceRecord: files.sourceRecord,
      receipt: files.receipt,
      payload: files.payload,
      signatures: approvals,
      trustStorePath: files.trustStorePath,
      now,
    });

    assert.equal(result.status, 'approved');
    assert.equal(result.verifiedSignatureCount, 2);
    assert.equal(result.minimumSignatures, 2);
    assert.equal(result.rollbackProtected, true);
    assert.equal(result.sourceRecord.snapshotEvidence?.relatedArtifactSha256?.includes(
      files.payload.legendReceiptSha256,
    ), true);
    assert.deepEqual(result.nextState.lastSequence, 1);
  } finally {
    rmSync(files.directory, { recursive: true, force: true });
  }
});

test('promotion rejects a non-independent reviewer quorum before activation', async () => {
  const files = await fixture();
  try {
    const approvals = signatures(files.payload, files.reviewers).map(item => ({
      ...item,
      reviewerId: 'reviewer-a',
    }));
    await assert.rejects(
      () => verifyCoastlineLegendPromotion({
        sourceRecord: files.sourceRecord,
        receipt: files.receipt,
        payload: files.payload,
        signatures: approvals,
        trustStorePath: files.trustStorePath,
        now,
      }),
      /requires independent reviewers/,
    );
  } finally {
    rmSync(files.directory, { recursive: true, force: true });
  }
});

test('promotion rejects revoked keys and a rollback against stored state', async () => {
  const files = await fixture();
  try {
    const approvals = signatures(files.payload, files.reviewers);
    const policy = JSON.parse(
      await import('node:fs/promises').then(fs => fs.readFile(files.trustStorePath, 'utf8')),
    ) as { keys: Record<string, Record<string, unknown>> };
    policy.keys['independent-2'] = {
      ...policy.keys['independent-2'],
      status: 'revoked',
      revokedAt: '2026-07-20T00:00:00.000Z',
      revocationReason: 'test revocation',
    };
    writeFileSync(files.trustStorePath, `${JSON.stringify(policy, null, 2)}\n`);
    await assert.rejects(
      () => verifyCoastlineLegendPromotion({
        sourceRecord: files.sourceRecord,
        receipt: files.receipt,
        payload: files.payload,
        signatures: approvals,
        trustStorePath: files.trustStorePath,
        now,
      }),
      /is not active/,
    );

    policy.keys['independent-2'] = {
      ...policy.keys['independent-2'],
      status: 'active',
      revokedAt: undefined,
      revocationReason: undefined,
    };
    writeFileSync(files.trustStorePath, `${JSON.stringify(policy, null, 2)}\n`);
    const first = await verifyCoastlineLegendPromotion({
      sourceRecord: files.sourceRecord,
      receipt: files.receipt,
      payload: files.payload,
      signatures: approvals,
      trustStorePath: files.trustStorePath,
      now,
    });
    const conflictingPayload = {
      ...files.payload,
      promotionId: 'synthetic-coastline-legend-conflict',
    };
    await assert.rejects(
      () => verifyCoastlineLegendPromotion({
        sourceRecord: files.sourceRecord,
        receipt: files.receipt,
        payload: conflictingPayload,
        signatures: signatures(conflictingPayload, files.reviewers),
        trustStorePath: files.trustStorePath,
        now,
        previousState: first.nextState,
      }),
      /sequence conflicts with stored state/,
    );
  } finally {
    rmSync(files.directory, { recursive: true, force: true });
  }
});
