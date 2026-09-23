import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { sourceCompletenessSummaryInvariantFailures } from '../src/lib/sourceCompletenessGate';

const tsxCli = join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
const reportScript = join(process.cwd(), 'scripts', 'report-source-completeness-gates.ts');

function runReport(cwd: string, args: string[] = []) {
  return execFileSync(process.execPath, [tsxCli, reportScript, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function makeTempOpenGeoWorkspace() {
  const root = mkdtempSync(join(tmpdir(), 'agid-source-completeness-'));
  const repo = join(root, 'data', 'open_geo_repositories', 'agid-open-drift-gazetteer');
  mkdirSync(join(repo, 'data'), { recursive: true });
  writeJson(join(repo, 'sources.json'), [
    { id: 'osm', name: 'OpenStreetMap', role: 'cross-reference' },
  ]);
  writeJson(join(repo, 'quality-gates.json'), [
    { id: 'source-license-ledger-required' },
  ]);
  writeJson(join(repo, 'data', 'place-seed.json'), [
    {
      agidPlaceId: 'agid:place:DRIFT:port',
      name: 'Synthetic Test Port',
      featureClass: 'poi',
      geodataLinks: { osm: 'https://osm.example.test/node/1' },
    },
  ]);
  return root;
}

test('source completeness report check mode ignores generated timestamps', () => {
  const output = runReport(process.cwd(), ['--check']);
  const result = JSON.parse(output);

  assert.equal(result.status, 'fresh');
  assert.deepEqual(result.ignoredFields, ['generatedAt']);
  assert.match(result.markdownReportPath, /docs[\\/]source-completeness-gates\.md$/);
  assert.match(result.jsonReportPath, /test-results[\\/]source-completeness-gates\.json$/);
});

test('source completeness report exposes scoped layer claim assertions', () => {
  runReport(process.cwd(), ['--check']);

  const jsonReport = JSON.parse(readFileSync(join(process.cwd(), 'test-results', 'source-completeness-gates.json'), 'utf8'));
  const markdownReport = readFileSync(join(process.cwd(), 'docs', 'source-completeness-gates.md'), 'utf8');
  const scopedLayerChecks = new Map(
    jsonReport.claimBoundary.scopedLayerClaimChecks.map((check: { dimension: string }) => [check.dimension, check]),
  );
  const poiCheck = scopedLayerChecks.get('poi') as {
    assertion: string;
    passingRepositories: number;
    blockedGlobalClaimRepositories: number;
    globalClaimAllowedRepositories: number;
    scopeLeakRepositories: string[];
  } | undefined;
  const naturalFeatureCheck = scopedLayerChecks.get('natural-features') as typeof poiCheck;

  assert.equal(jsonReport.claimBoundary.layerPassingScopeInvariant, true);
  assert.equal(poiCheck?.assertion, 'layer-passing-remains-scoped-unless-all-required-layers-pass');
  assert.equal(poiCheck?.globalClaimAllowedRepositories, 0);
  assert.equal(poiCheck?.scopeLeakRepositories.length, 0);
  assert.equal(poiCheck?.blockedGlobalClaimRepositories, poiCheck?.passingRepositories);
  assert.equal(naturalFeatureCheck?.assertion, 'layer-passing-remains-scoped-unless-all-required-layers-pass');
  assert.equal(naturalFeatureCheck?.globalClaimAllowedRepositories, 0);
  assert.equal(naturalFeatureCheck?.scopeLeakRepositories.length, 0);
  assert.equal(naturalFeatureCheck?.blockedGlobalClaimRepositories, naturalFeatureCheck?.passingRepositories);
  assert.match(markdownReport, /## Scoped Layer Claim Checks/);
  assert.match(markdownReport, /\| poi \|/);
  assert.match(markdownReport, /\| natural-features \|/);
});

test('source completeness report invariant helper fails on scoped layer leaks', () => {
  const failures = sourceCompletenessSummaryInvariantFailures({
    claimBoundary: {
      layerPassingScopeInvariant: false,
      scopedLayerClaimChecks: [
        {
          dimension: 'poi',
          passingRepositories: 1,
          blockedGlobalClaimRepositories: 0,
          globalClaimAllowedRepositories: 1,
          scopeLeakRepositories: ['agid-open-synthetic-leaky-poi-report'],
          sampleScopedRepositories: [],
          sampleGlobalClaimAllowedRepositories: ['agid-open-synthetic-leaky-poi-report'],
          assertion: 'layer-passing-global-claim-leak-detected',
        },
        {
          dimension: 'natural-features',
          passingRepositories: 0,
          blockedGlobalClaimRepositories: 0,
          globalClaimAllowedRepositories: 0,
          scopeLeakRepositories: [],
          sampleScopedRepositories: [],
          sampleGlobalClaimAllowedRepositories: [],
          assertion: 'layer-passing-remains-scoped-unless-all-required-layers-pass',
        },
      ],
    },
  });

  assert.deepEqual(failures, [
    'Scoped layer claim invariant failed for poi:agid-open-synthetic-leaky-poi-report.',
  ]);
});

test('source completeness report check mode fails on claim-boundary Markdown drift', t => {
  const root = makeTempOpenGeoWorkspace();
  t.after(() => {
    assert.ok(root.startsWith(tmpdir()));
    rmSync(root, { recursive: true, force: true });
  });
  runReport(root);

  const docPath = join(root, 'docs', 'source-completeness-gates.md');
  const original = readFileSync(docPath, 'utf8');
  writeFileSync(
    docPath,
    original.replace('global-all-place-name-claim-blocked', 'global-all-place-name-claim-allowed'),
    'utf8',
  );

  assert.throws(() => runReport(root, ['--check']), error => {
    const stderr = String((error as { stderr?: Buffer | string }).stderr ?? '');
    const failure = JSON.parse(stderr);

    assert.equal(failure.status, 'stale');
    assert.equal(failure.jsonSemanticChecked, true);
    assert.deepEqual(failure.ignoredFields, ['generatedAt']);
    assert.ok(failure.failures.some((message: string) => /Stale Markdown report/.test(message)));
    return true;
  });
});
