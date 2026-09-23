import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';

import { runAddressQlPostalOperationsMonitor } from './monitor-addressql-postal-operations';

const FIXTURE = 'docs/specs/fixtures/addressql-postal-operations-input-v1.json';

function directory(context: TestContext) {
  const output = mkdtempSync(join(tmpdir(), 'addressql-postal-operations-'));
  context.after(() => rmSync(output, { recursive: true, force: true }));
  return output;
}

test('monitor CLI writes an atomic country operations report', context => {
  const outputDirectory = directory(context);
  const output = join(outputDirectory, 'report.json');
  const result = runAddressQlPostalOperationsMonitor([
    '--input',
    FIXTURE,
    '--output',
    output,
    '--now',
    '2026-07-27T00:00:00Z',
  ]);
  const report = JSON.parse(readFileSync(output, 'utf8')) as {
    countries: Array<{ countryCode: string; action: string }>;
    privacy: { containsCorrectionContent: boolean };
  };

  assert.equal(result, 0);
  assert.deepEqual(report.countries, [{
    countryCode: 'JP',
    currentLevel: null,
    recommendedLevel: 'L2',
    highestOperationalLevel: 'L2',
    highestPromotionEligibleLevel: 'L2',
    action: 'promotion_candidate',
    sourceIds: ['jp-synthetic-postal-source'],
    reasons: [],
  }]);
  assert.equal(report.privacy.containsCorrectionContent, false);
});

test('monitor CLI fail-on-action exits nonzero for expired adapters', context => {
  const outputDirectory = directory(context);
  const input = JSON.parse(readFileSync(FIXTURE, 'utf8')) as {
    currentCountryLevels: Record<string, string | null>;
    sources: Array<{ validUntil: string }>;
  };
  input.currentCountryLevels.JP = 'L2';
  input.sources[0].validUntil = '2026-07-26T00:00:00Z';
  const inputPath = join(outputDirectory, 'expired.json');
  writeFileSync(inputPath, JSON.stringify(input));

  const result = runAddressQlPostalOperationsMonitor([
    '--input',
    inputPath,
    '--now',
    '2026-07-27T00:00:00Z',
    '--fail-on-action',
  ]);

  assert.equal(result, 1);
});
