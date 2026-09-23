import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  CoastlineClassificationLegendReceipt,
} from '../src/lib/topographicCoastlineClassificationSemantics';
import {
  hashCoastlineClassificationLegendReceipt,
} from '../src/lib/topographicCoastlineClassificationSemantics';
import type { TopographicSourceRecord } from '../src/lib/topographicExport';
import {
  verifyAndAdvanceCoastlineLegendPromotion,
  type CoastlineLegendPromotionLedger,
} from '../src/lib/topographicCoastlineLegendPromotionWorkflow';

export const COASTLINE_LEGEND_PROMOTION_CLI_VERSION =
  'agid-coastline-legend-promotion-cli-v1';

const MAX_JSON_BYTES = 1_048_576;

function readBoundedJson<T>(path: string, label: string) {
  const absolutePath = resolve(path);
  const stats = statSync(absolutePath);
  if (!stats.isFile() || stats.size <= 0 || stats.size > MAX_JSON_BYTES) {
    throw new Error(`${label} must be a bounded regular JSON file`);
  }
  const value = JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must contain a JSON object`);
  }
  return { path: absolutePath, value: value as T };
}

function assertNewOutputPath(outputPath: string, inputPaths: readonly string[]) {
  const absolutePath = resolve(outputPath);
  if (inputPaths.includes(absolutePath) || existsSync(absolutePath)) {
    throw new Error('promotion output must be a new path distinct from every input');
  }
  return absolutePath;
}

export async function verifyCoastlineClassificationLegendPromotionFiles(input: {
  sourceRecordPath: string;
  receiptPath: string;
  ledgerPath: string;
  trustStorePath: string;
  statePath: string;
  outputPath: string;
  now: string;
}) {
  const source = readBoundedJson<TopographicSourceRecord>(
    input.sourceRecordPath,
    'source record',
  );
  const receiptFile = readBoundedJson<{
    receipt: CoastlineClassificationLegendReceipt;
    receiptSha256: `sha256:${string}`;
  }>(input.receiptPath, 'coastline legend receipt');
  const ledger = readBoundedJson<CoastlineLegendPromotionLedger>(
    input.ledgerPath,
    'coastline promotion ledger',
  );
  const receiptSha256 = await hashCoastlineClassificationLegendReceipt(
    receiptFile.value.receipt,
  );
  if (receiptSha256 !== receiptFile.value.receiptSha256) {
    throw new Error('coastline legend receipt file digest mismatch');
  }
  const outputPath = assertNewOutputPath(input.outputPath, [
    source.path,
    receiptFile.path,
    ledger.path,
    resolve(input.trustStorePath),
    resolve(input.statePath),
  ]);
  const result = await verifyAndAdvanceCoastlineLegendPromotion({
    sourceRecord: source.value,
    receipt: receiptFile.value.receipt,
    ledger: ledger.value,
    trustStorePath: input.trustStorePath,
    statePath: input.statePath,
    now: input.now,
  });
  const report = {
    cliVersion: COASTLINE_LEGEND_PROMOTION_CLI_VERSION,
    status: result.status,
    promotionId: ledger.value.payload.promotionId,
    promotionDigest: result.promotionDigest,
    receiptSha256: result.receiptSha256,
    sequence: result.sequence,
    verifiedSignatureCount: result.verifiedSignatureCount,
    minimumSignatures: result.minimumSignatures,
    statePath: result.statePath,
    stateAdvanced: result.stateAdvanced,
    rollbackProtected: result.rollbackProtected,
    privacy: result.privacy,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
  return { ...report, outputPath };
}

function requiredArgument(name: string) {
  const inline = process.argv.find(value => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const result = await verifyCoastlineClassificationLegendPromotionFiles({
    sourceRecordPath: requiredArgument('--source-record'),
    receiptPath: requiredArgument('--receipt'),
    ledgerPath: requiredArgument('--ledger'),
    trustStorePath: requiredArgument('--trust-store'),
    statePath: requiredArgument('--state'),
    outputPath: requiredArgument('--output'),
    now: requiredArgument('--now'),
  });
  console.log(JSON.stringify(result, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  void main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
