import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { build } from './build-postal-context-pr-m2.mjs';

const digest = path => 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');

test('PR builder deterministically reproduces the committed graph, geometry and descriptor', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'agid-pr-m2-'));
  try {
    const output = join(temporary, 'm2');
    const report = build({ sourceDirectory: resolve('.m2-sources-pr'), outputDirectory: output });
    assert.equal(report.scope.publishedPostalCodes.length, 132);
    assert.equal(report.geometry.positions, 168582);
    assert.equal(report.policy.uspsLicensedRowsPublished, 0);
    for (const name of ['graph.json', 'geometry.json', 'descriptor.json']) {
      assert.equal(
        digest(join(output, name)),
        digest(resolve('data/postal_country_packs/pr/postal-context/m2', name)),
        name,
      );
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
