import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  COMPATIBILITY_IMPROVEMENT_TRACKS,
  createCompatibilityImprovementLoopSummary,
  createContinuousImprovementLoopPlan,
  createImprovementDeepDivePlan,
  decideImprovementCycle,
  rankImprovementSignals,
  type ImprovementSignal,
} from './continuousImprovementLoop';

const signals: ImprovementSignal[] = [
  {
    id: 'docs-001',
    area: 'docs',
    severity: 'medium',
    confidence: 0.8,
    title: 'Clarify operator guide',
    source: 'manual-review',
  },
  {
    id: 'sec-001',
    area: 'security',
    severity: 'high',
    confidence: 0.7,
    title: 'Tighten public proxy guardrail',
    source: 'security-scan',
  },
  {
    id: 'perf-001',
    area: 'performance',
    severity: 'high',
    confidence: 0.6,
    title: 'Reduce map bundle startup cost',
    source: 'build-warning',
  },
];

test('continuous improvement loop is bounded and ships with production-safe gates', () => {
  const plan = createContinuousImprovementLoopPlan({ maxCycles: 999, includeProductionLoadDryRun: true });

  assert.equal(plan.maxCycles, 12);
  assert.equal(plan.safety.bounded, true);
  assert.equal(plan.safety.productionTrafficRequiresAck, true);
  assert.equal(plan.safety.rawAddressMaterialForbidden, true);
  assert.ok(plan.gates.some(gate => gate.id === 'dependency-audit' && gate.required && gate.requiresExternalNetwork));
  assert.ok(plan.gates.some(gate => gate.id === 'secret-scan' && gate.required));
  assert.ok(plan.gates.some(gate => gate.id === 'typecheck' && gate.required));
  assert.ok(plan.gates.some(gate => gate.id === 'app-shell-compat' && gate.required));
  assert.ok(plan.gates.some(gate => gate.id === 'developer-console-compat' && gate.required));
  assert.ok(plan.gates.some(gate => gate.id === 'oss-boundary-compat' && gate.required && gate.blocksProduction));
  assert.ok(plan.gates.some(gate => gate.id === 'repository-split-allocation' && gate.required && gate.blocksProduction));
  assert.ok(plan.gates.some(gate => gate.id === 'build-chunk-budget' && gate.required && gate.blocksProduction));
  assert.ok(plan.gates.some(gate => gate.id === 'pwa-build-budget' && gate.required && gate.blocksProduction));
  assert.ok(plan.gates.some(gate => gate.id === 'production-load-dry-run' && !gate.required));
});

test('asset budget gates run only after a fresh production build', () => {
  const plan = createContinuousImprovementLoopPlan();
  const gateIds = plan.gates.map(gate => gate.id);
  const buildIndex = gateIds.indexOf('build');
  const chunkBudgetIndex = gateIds.indexOf('build-chunk-budget');
  const pwaBudgetIndex = gateIds.indexOf('pwa-build-budget');

  assert.notEqual(buildIndex, -1);
  assert.notEqual(chunkBudgetIndex, -1);
  assert.notEqual(pwaBudgetIndex, -1);
  assert.ok(buildIndex < chunkBudgetIndex);
  assert.ok(chunkBudgetIndex < pwaBudgetIndex);
});

test('security and privacy signals outrank lower-risk improvements', () => {
  const ranked = rankImprovementSignals(signals);

  assert.equal(ranked[0].id, 'sec-001');
  assert.equal(ranked[1].id, 'perf-001');
  assert.equal(ranked[2].id, 'docs-001');
});

test('cycle selects actionable signals and gives a small-loop action list', () => {
  const plan = createContinuousImprovementLoopPlan();
  const decision = decideImprovementCycle(plan, signals, 1);

  assert.equal(decision.status, 'continue');
  assert.equal(decision.selectedSignals[0].id, 'sec-001');
  assert.match(decision.nextActions.join('\n'), /smallest scoped change/);
  assert.equal(decision.skippedSignals.length, 0);
});

test('compatibility improvement summary covers design, features, hero, tutorial, and app UX', () => {
  const plan = createContinuousImprovementLoopPlan();
  const decision = decideImprovementCycle(plan, [
    {
      id: 'hero-001',
      area: 'hero',
      severity: 'medium',
      confidence: 0.8,
      title: 'Improve hero clarity',
      source: 'design-review',
      compatibilityRisk: 'low',
    },
  ]);
  const summary = createCompatibilityImprovementLoopSummary(plan, decision);

  assert.equal(summary.headline, 'Compatibility-first improvement loop');
  assert.deepEqual(
    COMPATIBILITY_IMPROVEMENT_TRACKS.map(track => track.id),
    ['design', 'features', 'hero', 'tutorial', 'app'],
  );
  assert.ok(summary.gateIds.includes('app-shell-compat'));
  assert.ok(summary.gateIds.includes('developer-console-compat'));
  assert.ok(summary.gateIds.includes('oss-boundary-compat'));
  assert.ok(summary.gateIds.includes('repository-split-allocation'));
  assert.ok(summary.gateIds.includes('build-chunk-budget'));
  assert.ok(summary.gateIds.includes('pwa-build-budget'));
  assert.ok(summary.releaseRule.includes('no-raw-address'));
  assert.ok(summary.releaseRule.includes('verify:release-build-assets'));
  assert.ok(summary.releaseRule.includes('OSS boundary compatibility'));
  assert.ok(summary.tracks.some(track => track.label === 'Tutorials' && track.compatibilityRule.includes('rawAddressReturned:false')));
  assert.ok(summary.tracks.some(track => track.label === 'Hero section' && track.routeRefs.includes('/open-source')));
});

test('deep dive plan turns security work into a release gate sweep with evidence requirements', () => {
  const plan = createContinuousImprovementLoopPlan();
  const decision = decideImprovementCycle(plan, signals, 1);
  const deepDive = createImprovementDeepDivePlan(plan, decision);

  assert.equal(deepDive.mode, 'release-gate-sweep');
  assert.equal(deepDive.primaryArea, 'security');
  assert.ok(deepDive.recommendedChecks.includes('verify:mandatory-security'));
  assert.ok(deepDive.recommendedChecks.includes('verify:no-raw-address'));
  assert.ok(deepDive.recommendedChecks.includes('verify:no-raw-address-kit'));
  assert.ok(deepDive.recommendedChecks.includes('verify:preaudit-secrets'));
  assert.ok(deepDive.recommendedChecks.includes('verify:release-build-assets'));
  assert.ok(deepDive.recommendedChecks.includes('verify:developer-console'));
  assert.ok(!deepDive.recommendedChecks.includes('build'));
  assert.ok(!deepDive.recommendedChecks.includes('verify:build-chunk-budget'));
  assert.ok(!deepDive.recommendedChecks.includes('verify:pwa'));
  assert.ok(deepDive.gateIds.includes('mandatory-security'));
  assert.ok(deepDive.gateIds.includes('no-raw-address'));
  assert.ok(deepDive.gateIds.includes('secret-scan'));
  assert.ok(deepDive.gateIds.includes('build'));
  assert.ok(deepDive.gateIds.includes('build-chunk-budget'));
  assert.ok(deepDive.gateIds.includes('pwa-build-budget'));
  assert.match(deepDive.nextArtifact, /ledger/);
  assert.ok(deepDive.evidenceToRecord.some(item => item.includes('release-gate')));
  assert.ok(deepDive.residualRiskQuestions.some(question => question.includes('raw address')));
});

test('deep dive plan keeps bundle budget checks in performance loops', () => {
  const plan = createContinuousImprovementLoopPlan();
  const decision = decideImprovementCycle(plan, [
    {
      id: 'perf-002',
      area: 'performance',
      severity: 'high',
      confidence: 0.85,
      title: 'Keep map runtime bundle inside the explicit budget',
      source: 'build-warning',
      compatibilityRisk: 'low',
    },
  ]);
  const deepDive = createImprovementDeepDivePlan(plan, decision);

  assert.equal(deepDive.primaryArea, 'performance');
  assert.ok(deepDive.recommendedChecks.includes('verify:release-build-assets'));
  assert.ok(!deepDive.recommendedChecks.includes('build'));
  assert.ok(!deepDive.recommendedChecks.includes('verify:build-chunk-budget'));
  assert.ok(!deepDive.recommendedChecks.includes('verify:pwa'));
  assert.ok(deepDive.gateIds.includes('build'));
  assert.ok(deepDive.gateIds.includes('build-chunk-budget'));
  assert.ok(deepDive.gateIds.includes('pwa-build-budget'));
});

test('deep dive plan can narrow address quality while broadening to resolver and postal checks', () => {
  const plan = createContinuousImprovementLoopPlan();
  const decision = decideImprovementCycle(plan, [
    {
      id: 'address-quality-001',
      area: 'address-quality',
      severity: 'high',
      confidence: 0.82,
      title: 'Improve weak-postal-country fallback evidence',
      source: 'quality-review',
      compatibilityRisk: 'low',
    },
    {
      id: 'tutorial-001',
      area: 'tutorial',
      severity: 'medium',
      confidence: 0.72,
      title: 'Keep the tutorial aligned with the fallback',
      source: 'quality-review',
      compatibilityRisk: 'low',
    },
  ]);
  const deepDive = createImprovementDeepDivePlan(plan, decision);

  assert.equal(deepDive.mode, 'focused-depth');
  assert.equal(deepDive.primaryArea, 'address-quality');
  assert.ok(deepDive.recommendedChecks.includes('verify:address-registration'));
  assert.ok(deepDive.recommendedChecks.includes('verify:agid-resolver-conformance'));
  assert.ok(deepDive.recommendedChecks.includes('verify:postal-country-pack'));
  assert.ok(deepDive.recommendedChecks.includes('verify:developer-console'));
  assert.match(deepDive.depthGoal, /address-quality/);
  assert.match(deepDive.breadthGoal, /tutorial/);
  assert.ok(deepDive.evidenceToRecord.some(item => item.includes('normalization confidence')));
});

test('cycle stops when max cycles are reached', () => {
  const plan = createContinuousImprovementLoopPlan({ maxCycles: 1 });
  const decision = decideImprovementCycle(plan, signals, 2);

  assert.equal(decision.status, 'stop');
  assert.equal(decision.stopReason, 'max-cycles-reached');
});

test('production, external, destructive, and private-address signals need approval', () => {
  const plan = createContinuousImprovementLoopPlan();
  const decision = decideImprovementCycle(plan, [
    {
      id: 'prod-load',
      area: 'performance',
      severity: 'high',
      confidence: 0.9,
      title: 'Run production traffic',
      source: 'operator',
      requiresProductionTraffic: true,
    },
    {
      id: 'private-fixture',
      area: 'privacy',
      severity: 'critical',
      confidence: 1,
      title: 'Replay raw address fixture',
      source: 'bad-test',
      containsPrivateAddressMaterial: true,
    },
    {
      id: 'delete-data',
      area: 'maintainability',
      severity: 'medium',
      confidence: 0.7,
      title: 'Remove generated datasets',
      source: 'cleanup',
      requiresDestructiveChange: true,
    },
    {
      id: 'live-api',
      area: 'address-quality',
      severity: 'medium',
      confidence: 0.8,
      title: 'Call live postal APIs',
      source: 'data-quality',
      requiresExternalNetwork: true,
    },
  ]);

  assert.equal(decision.status, 'needs-approval');
  assert.deepEqual(
    decision.skippedSignals.map(signal => signal.reason).sort(),
    [
      'destructive-change-needs-explicit-approval',
      'external-network-needs-explicit-approval',
      'private-address-material-is-forbidden',
      'production-traffic-needs-explicit-ack',
    ].sort(),
  );
});

test('high compatibility risk changes are skipped until design review', () => {
  const plan = createContinuousImprovementLoopPlan();
  const decision = decideImprovementCycle(plan, [
    {
      id: 'route-breaking-redesign',
      area: 'design',
      severity: 'high',
      confidence: 0.9,
      title: 'Replace public routes and hero CTAs',
      source: 'design-review',
      compatibilityRisk: 'high',
    },
  ]);

  assert.equal(decision.status, 'needs-approval');
  assert.deepEqual(decision.skippedSignals, [
    { id: 'route-breaking-redesign', reason: 'high-compatibility-risk-needs-design-review' },
  ]);
});

test('commercial-private product signals are excluded from the OSS improvement loop', () => {
  const plan = createContinuousImprovementLoopPlan();
  const decision = decideImprovementCycle(plan, [
    {
      id: 'playlist-commerce-commercial-roadmap',
      area: 'features',
      severity: 'critical',
      confidence: 1,
      title: 'Expand Playlist Commerce checkout and marketplace features',
      source: 'commercial-product-roadmap',
      licenseProfile: 'commercial-private',
    },
    {
      id: 'address-login-oss-fixture',
      area: 'privacy',
      severity: 'medium',
      confidence: 0.8,
      title: 'Add a redacted Address Login fixture',
      source: 'oss-address-login',
      licenseProfile: 'oss',
    },
  ]);

  assert.equal(decision.status, 'continue');
  assert.deepEqual(decision.selectedSignals.map(signal => signal.id), ['address-login-oss-fixture']);
  assert.deepEqual(decision.skippedSignals, [
    { id: 'playlist-commerce-commercial-roadmap', reason: 'commercial-private-signal-excluded-from-oss-loop' },
  ]);
});

test('gate runner reports approval-required skips separately from failed gates', () => {
  const source = readFileSync(new URL('../../scripts/continuous-improvement-loop.ts', import.meta.url), 'utf8');

  assert.match(source, /requiredGateNeedsApproval/);
  assert.match(source, /result\.status !== 0 && result\.status !== 'skipped'/);
  assert.match(source, /requiredGateNeedsApproval\s*\?\s*'needs-approval'/);
  assert.match(source, /requiredGateFailed \|\| requiredGateNeedsApproval/);
  assert.match(source, /gateSummary/);
  assert.match(source, /skippedForApproval/);
  assert.match(source, /requiredSkippedForApproval/);
  assert.match(source, /requiredFailed/);
  assert.match(source, /reportNextActions/);
  assert.match(source, /Get explicit approval for/);
  assert.match(source, /Fix required gate/);
});

test('runner writes an improvement ledger so each loop leaves a concrete improvement artifact', () => {
  const source = readFileSync(new URL('../../scripts/continuous-improvement-loop.ts', import.meta.url), 'utf8');

  assert.match(source, /writeImprovementLedger/);
  assert.match(source, /continuous-improvement-ledger\.jsonl/);
  assert.match(source, /improvementRequired:\s*true/);
  assert.match(source, /smallest-next-fix-record/);
  assert.match(source, /--no-ledger/);
  assert.match(source, /safeLedgerText/);
  assert.match(source, /createImprovementDeepDivePlan/);
  assert.match(source, /deepDiveMode/);
  assert.match(source, /recommendedChecks/);
  assert.match(source, /nextArtifact/);
});

test('runner keeps address communication engineering in the default improvement loop', () => {
  const source = readFileSync(new URL('../../scripts/continuous-improvement-loop.ts', import.meta.url), 'utf8');

  assert.match(source, /createAddressCommunicationImprovementSignals/);
  assert.match(source, /addressCommunicationEngineering/);
  assert.match(source, /\.\.\.createAddressCommunicationImprovementSignals\(3\)/);
});

test('runner keeps repository split allocation in the default improvement loop', () => {
  const source = readFileSync(new URL('../../scripts/continuous-improvement-loop.ts', import.meta.url), 'utf8');

  assert.match(source, /repository-split-allocation-review/);
  assert.match(source, /repository-split-allocation-audit/);
  assert.match(source, /logical child repository/);
});
