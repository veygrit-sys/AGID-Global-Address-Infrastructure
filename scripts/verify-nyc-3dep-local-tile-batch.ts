import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  verifyNyc3depLocalTileBatchPackage,
} from '../src/lib/topographicNyc3depBatchPackageVerifier';

export const NYC_3DEP_LOCAL_TILE_BATCH_VERIFY_CLI_VERSION =
  'agid-nyc-3dep-local-tile-batch-verify-cli-v0.1';

function requiredArgument(flag: string) {
  const inline = process.argv.find(value => value.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`${flag} is required.`);
  return value;
}

async function main() {
  const verified = await verifyNyc3depLocalTileBatchPackage(
    requiredArgument('--output-dir'),
  );
  console.log(JSON.stringify({
    cliVersion: NYC_3DEP_LOCAL_TILE_BATCH_VERIFY_CLI_VERSION,
    outputDirectory: basename(resolve(verified.outputDirectory)),
    planSha256: verified.planSha256,
    receiptSha256: verified.receiptSha256,
    tileCount: verified.tileCount,
    parent: verified.parent,
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  void main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
