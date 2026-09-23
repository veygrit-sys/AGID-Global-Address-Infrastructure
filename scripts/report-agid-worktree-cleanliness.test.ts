import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT,
  createReport,
  parseEntries,
} from './report-agid-worktree-cleanliness';

test('AGID main repository cleanliness contract captures source, docs, data, and privacy boundaries', () => {
  assert.equal(AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT.schema, 'agid-main-repository-cleanliness-contract-v1');
  assert.equal(AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT.forbiddenNewSourceRoot, 'src/lib');
  assert.ok(AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT.sourceRootsForNewCode.includes('src/address'));
  assert.ok(AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT.sourceRootsForNewCode.includes('src/integrations'));
  assert.deepEqual(
    AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT.documentBuckets,
    ['docs/specs', 'docs/research', 'docs/product', 'docs/ops', 'docs/archive'],
  );
  assert.ok(AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT.heavyDataPolicy.forbiddenMainBundleExtensions.includes('.zip'));
  assert.equal(AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT.privacyBoundary.rawPersonalAddress, false);
  assert.equal(AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT.privacyBoundary.privateKeys, false);
});

test('cleanliness report classifies src/lib root additions, direct docs, root files, and heavy data', () => {
  const entries = parseEntries([
    '?? src/lib/newPublicFixture.ts',
    '?? src/address/addressQualityPublicFixtures.ts',
    '?? docs/address-morphism-new-note.md',
    '?? data/postal_codes/JP.zip',
    '?? scratchpad.md',
  ]);
  const report = createReport(entries);

  assert.equal(report.policyContract.forbiddenNewSourceRoot, 'src/lib');
  assert.equal(report.totalChangedEntries, 5);
  assert.equal(report.cleanupClassCounts['avoid-new-src-lib-root'], 1);
  assert.equal(report.cleanupClassCounts['bucket-docs'], 1);
  assert.equal(report.cleanupClassCounts['externalize-heavy-data'], 1);
  assert.equal(report.cleanupClassCounts['move-out-of-root'], 1);

  const byId = new Map(report.findings.map(finding => [finding.id, finding]));
  assert.equal(byId.get('new-src-lib-root')?.severity, 'high');
  assert.match(byId.get('direct-doc-bucketing')?.examples[0] || '', /docs\/research/);
  assert.equal(byId.get('heavy-data-externalization')?.severity, 'medium');
  assert.equal(byId.get('root-needs-triage')?.count, 1);
});
