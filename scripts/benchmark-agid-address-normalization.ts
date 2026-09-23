import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runAgidAddressNormalizationBenchmark,
} from '../src/lib/agidAddressNormalizationBenchmark';

export function runAgidAddressNormalizationBenchmarkCli(
  argv = process.argv.slice(2),
) {
  const report = runAgidAddressNormalizationBenchmark();
  console.log(JSON.stringify(report, null, 2));
  if (argv.includes('--check') && !report.passed) return 1;
  return 0;
}

if (
  process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  process.exitCode = runAgidAddressNormalizationBenchmarkCli();
}
