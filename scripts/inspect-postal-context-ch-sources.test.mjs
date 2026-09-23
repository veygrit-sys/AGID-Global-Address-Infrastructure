import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  validateCommittedArtifacts,
  validateSwitzerlandM2Report,
} from './inspect-postal-context-ch-sources.mjs';

const report = JSON.parse(readFileSync(new URL('../reports/postal-context-m2/ch-source-review-2026-08-29.json', import.meta.url), 'utf8'));

test('CH source review reaches M2 only with current rights-cleared real geometry and app evidence', () => {
  assert.deepEqual(validateSwitzerlandM2Report(report), {
    countryCode: 'CH',
    features: 3177,
    positions: 679832,
    countryM2Achieved: true,
  });
});

test('CH graph, geometry and descriptor are immutable and digest-bound', () => {
  const descriptor = validateCommittedArtifacts(report);
  assert.equal(descriptor.graphManifestDigest, 'sha256:5776d54191b69080f24f529292ab21d3af7ecff4d7a7c5fd598bc20c4c63bef5');
  assert.equal(descriptor.artifacts.find(item => item.role === 'geometry')?.recordCounts.positions, 679832);
});
