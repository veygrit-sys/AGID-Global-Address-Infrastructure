import { mkdirSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyPidCollisionBudget } from '../src/lib/pidCollisionRisk';

function numberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const raw = process.argv.find(arg => arg.startsWith(prefix));
  if (!raw) return fallback;
  const value = Number(raw.slice(prefix.length));
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number.`);
  return value;
}

const report = verifyPidCollisionBudget({
  hashBits: numberArg('hash-bits', 128),
  maxIssued: numberArg('max-issued', 1_000_000_000_000),
  maxCollisionRisk: numberArg('max-risk', 1e-12),
});

const outDir = join(process.cwd(), 'test-results');
mkdirSync(outDir, { recursive: true });
const reportPath = join(outDir, 'pid-collision-risk.json');
writeFileSync(reportPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  ...report,
}, null, 2)}\n`);

console.log(`[PID] Hash bits: ${report.hashBits}`);
console.log(`[PID] Max issued: ${report.maxIssued}`);
console.log(`[PID] Birthday upper bound: ${report.birthdayUpperBound}`);
console.log(`[PID] Required bits: ${report.requiredBits}`);
console.log(`[PID] Safety margin bits: ${report.safetyMarginBits}`);
console.log(`[PID] Budget: ${report.pass ? 'pass' : 'fail'}`);
console.log(`[PID] Report: ${reportPath}`);

if (!report.pass) {
  process.exitCode = 1;
}
