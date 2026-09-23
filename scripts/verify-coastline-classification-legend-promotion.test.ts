import assert from 'node:assert/strict';
import {
  createHash,
  generateKeyPairSync,
  sign,
} from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  createCoastlineClassificationLegendReceipt,
  TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
} from '../src/lib/topographicCoastlineClassificationSemantics';
import { AGID_SYNTHETIC_TOPO_SOURCE, type TopographicSourceRecord } from '../src/lib/topographicExport';
import {
  buildCoastlineLegendPromotionPayload,
  hashCoastlineLegendPromotion,
  type CoastlineLegendPromotionPayload,
} from '../src/lib/topographicCoastlineLegendPromotion';
import {
  TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_LEDGER_VERSION,
} from '../src/lib/topographicCoastlineLegendPromotionWorkflow';
import {
  verifyCoastlineClassificationLegendPromotionFiles,
} from './verify-coastline-classification-legend-promotion';

const now = '2026-07-28T00:00:00.000Z';

function sha256(bytes: Uint8Array) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
}

async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'agid-coastline-promotion-cli-'));
  const sourcePath = join(directory, 'source.json');
  const receiptPath = join(directory, 'receipt.json');
  const ledgerPath = join(directory, 'promotion-ledger.json');
  const trustStorePath = join(directory, 'trust-store.json');
  const statePath = join(directory, 'state', 'promotion-state.json');
  const classificationBytes = Uint8Array.from([1, 2, 3, 4]);
  const retainedLegendBytes = new TextEncoder().encode(
    'separately-retained-public-legend-not-copied-to-report',
  );
  const sourceRecord: TopographicSourceRecord = {
    ...AGID_SYNTHETIC_TOPO_SOURCE,
    sourceId: 'synthetic-coastline-promotion-cli-source',
    version: 'synthetic-coastline-promotion-cli-v1',
    layerIds: ['waterways'],
    snapshotEvidence: {
      contentSha256: sha256(classificationBytes),
      adapterVersion: 'synthetic-coastline-promotion-cli-test-v1',
      verifiedAt: now,
      horizontalCrs: 'EPSG:4326',
      verticalDatum: 'not-applicable: coastline classification',
    },
  };
  const receipt = await createCoastlineClassificationLegendReceipt({
    sourceRecord,
    classificationGeoTiff: classificationBytes.buffer,
    legendBytes: retainedLegendBytes,
    classificationSemantics: {
      schemaVersion: TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
      bandIndex: 0,
      legend: {
        url: 'https://example.test/public-coastline-legend-v1',
        version: 'synthetic-public-legend-v1',
        publishedAt: '2026-07-01T00:00:00.000Z',
        sha256: sha256(retainedLegendBytes),
      },
      classes: [
        { value: 0, meaning: 'ocean' },
        { value: 1, meaning: 'breakline' },
        { value: 2, meaning: 'land' },
      ],
    },
    validatedAt: now,
  });
  const reviewers = ['reviewer-a', 'reviewer-b'].map((reviewerId, index) => ({
    reviewerId,
    keyId: `independent-${index + 1}`,
    ...generateKeyPairSync('ed25519'),
  }));
  const payload: CoastlineLegendPromotionPayload = {
    version: 'agid-coastline-legend-promotion-payload-v1',
    promotionId: 'synthetic-coastline-legend-cli-v1',
    sequence: 1,
    previousPromotionDigest: null,
    source: receipt.receipt.source,
    legendReceiptSha256: receipt.receiptSha256,
    createdAt: now,
    validFrom: now,
    validUntil: '2026-08-01T00:00:00.000Z',
    minimumSignatures: 2,
  };
  const canonical = buildCoastlineLegendPromotionPayload(payload);
  const signatures = reviewers.map(reviewer => ({
    keyId: reviewer.keyId,
    reviewerId: reviewer.reviewerId,
    signature: sign(null, Buffer.from(canonical, 'utf8'), reviewer.privateKey)
      .toString('base64'),
  }));
  const ledger = {
    version: TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_LEDGER_VERSION,
    payload,
    signatures,
    promotionDigest: hashCoastlineLegendPromotion(payload, signatures),
  };
  writeFileSync(sourcePath, `${JSON.stringify(sourceRecord, null, 2)}\n`);
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
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
  return {
    directory,
    sourcePath,
    receiptPath,
    ledgerPath,
    trustStorePath,
    statePath,
    ledger,
  };
}

test('promotion CLI advances one hash-bound state and emits a metadata-only report', async () => {
  const files = await fixture();
  try {
    const result = await verifyCoastlineClassificationLegendPromotionFiles({
      sourceRecordPath: files.sourcePath,
      receiptPath: files.receiptPath,
      ledgerPath: files.ledgerPath,
      trustStorePath: files.trustStorePath,
      statePath: files.statePath,
      outputPath: join(files.directory, 'reports', 'promotion.json'),
      now,
    });
    const state = JSON.parse(readFileSync(files.statePath, 'utf8')) as {
      lastSequence: number;
      lastPromotionDigest: string;
      lastReceiptSha256: string;
    };
    const report = readFileSync(result.outputPath, 'utf8');

    assert.equal(result.stateAdvanced, true);
    assert.equal(state.lastSequence, 1);
    assert.equal(state.lastPromotionDigest, files.ledger.promotionDigest);
    assert.equal(state.lastReceiptSha256, files.ledger.payload.legendReceiptSha256);
    assert.doesNotMatch(report, /separately-retained-public-legend-not-copied-to-report/);
    assert.doesNotMatch(report, /BEGIN PRIVATE KEY/);

    const retry = await verifyCoastlineClassificationLegendPromotionFiles({
      sourceRecordPath: files.sourcePath,
      receiptPath: files.receiptPath,
      ledgerPath: files.ledgerPath,
      trustStorePath: files.trustStorePath,
      statePath: files.statePath,
      outputPath: join(files.directory, 'reports', 'promotion-retry.json'),
      now,
    });
    assert.equal(retry.stateAdvanced, false);
  } finally {
    rmSync(files.directory, { recursive: true, force: true });
  }
});

test('promotion CLI fails closed while an existing state lock is present', async () => {
  const files = await fixture();
  try {
    mkdirSync(join(files.directory, 'state'), { recursive: true });
    writeFileSync(`${files.statePath}.lock`, 'held');
    await assert.rejects(
      () => verifyCoastlineClassificationLegendPromotionFiles({
        sourceRecordPath: files.sourcePath,
        receiptPath: files.receiptPath,
        ledgerPath: files.ledgerPath,
        trustStorePath: files.trustStorePath,
        statePath: files.statePath,
        outputPath: join(files.directory, 'promotion.json'),
        now,
      }),
      /state is locked/,
    );
    assert.equal(readFileSync(`${files.statePath}.lock`, 'utf8'), 'held');
  } finally {
    rmSync(files.directory, { recursive: true, force: true });
  }
});
