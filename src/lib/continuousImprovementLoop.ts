export const CONTINUOUS_IMPROVEMENT_LOOP_VERSION = 'continuous-improvement-loop-v1';

export type ImprovementArea =
  | 'security'
  | 'privacy'
  | 'reliability'
  | 'performance'
  | 'design'
  | 'features'
  | 'hero'
  | 'tutorial'
  | 'app-ux'
  | 'address-quality'
  | 'pwa'
  | 'docs'
  | 'maintainability';

export type ImprovementSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type CompatibilityRisk = 'none' | 'low' | 'medium' | 'high';
export type ImprovementDepthMode = 'focused-depth' | 'balanced-breadth' | 'release-gate-sweep';

export type ImprovementSignal = {
  id: string;
  area: ImprovementArea;
  severity: ImprovementSeverity;
  confidence: number;
  title: string;
  source: string;
  licenseProfile?: 'oss' | 'commercial-private';
  compatibilityRisk?: CompatibilityRisk;
  requiresProductionTraffic?: boolean;
  requiresExternalNetwork?: boolean;
  requiresDestructiveChange?: boolean;
  containsPrivateAddressMaterial?: boolean;
};

export type ImprovementGate = {
  id: string;
  command: string[];
  required: boolean;
  blocksProduction: boolean;
  description: string;
  requiresExternalNetwork?: boolean;
  requiresProductionTraffic?: boolean;
  requiresDestructiveChange?: boolean;
};

export type ContinuousImprovementLoopInput = {
  maxCycles?: number;
  cadence?: 'manual' | 'hourly' | 'daily';
  includeProductionLoadDryRun?: boolean;
  allowProductionTraffic?: boolean;
  allowExternalNetwork?: boolean;
  allowDestructiveChange?: boolean;
};

export type ContinuousImprovementLoopPlan = {
  version: typeof CONTINUOUS_IMPROVEMENT_LOOP_VERSION;
  maxCycles: number;
  cadence: 'manual' | 'hourly' | 'daily';
  gates: ImprovementGate[];
  safety: {
    bounded: true;
    productionTrafficRequiresAck: true;
    destructiveChangesRequireExplicitApproval: true;
    rawAddressMaterialForbidden: true;
    responseBodiesNotStored: true;
  };
  allowed: {
    productionTraffic: boolean;
    externalNetwork: boolean;
    destructiveChange: boolean;
  };
};

export type ImprovementCycleDecision = {
  cycle: number;
  status: 'continue' | 'stop' | 'needs-approval';
  stopReason?: string;
  selectedSignals: ImprovementSignal[];
  skippedSignals: { id: string; reason: string }[];
  nextActions: string[];
};

export type CompatibilityImprovementTrack = {
  id: 'design' | 'features' | 'hero' | 'tutorial' | 'app';
  area: ImprovementArea;
  label: string;
  goal: string;
  compatibilityRule: string;
  verifyWith: string[];
  routeRefs: string[];
};

export type CompatibilityImprovementLoopSummary = {
  version: typeof CONTINUOUS_IMPROVEMENT_LOOP_VERSION;
  headline: string;
  focus: string;
  tracks: CompatibilityImprovementTrack[];
  gateIds: string[];
  nextAction: string;
  releaseRule: string;
};

export type ImprovementDeepDivePlan = {
  version: typeof CONTINUOUS_IMPROVEMENT_LOOP_VERSION;
  mode: ImprovementDepthMode;
  primaryArea: ImprovementArea | 'none';
  depthGoal: string;
  breadthGoal: string;
  selectedSignalIds: string[];
  gateIds: string[];
  recommendedChecks: string[];
  evidenceToRecord: string[];
  residualRiskQuestions: string[];
  nextArtifact: string;
};

const SEVERITY_SCORE: Record<ImprovementSeverity, number> = {
  critical: 500,
  high: 400,
  medium: 300,
  low: 200,
  info: 100,
};

const AREA_PRIORITY: Record<ImprovementArea, number> = {
  security: 80,
  privacy: 75,
  reliability: 60,
  performance: 50,
  features: 48,
  'app-ux': 47,
  hero: 46,
  'address-quality': 45,
  tutorial: 44,
  design: 42,
  pwa: 35,
  maintainability: 30,
  docs: 20,
};

const COMPATIBILITY_RISK_PENALTY: Record<CompatibilityRisk, number> = {
  none: 0,
  low: 10,
  medium: 40,
  high: 140,
};

const AREA_RECOMMENDED_CHECKS: Record<ImprovementArea, string[]> = {
  security: ['verify:mandatory-security', 'verify:no-raw-address', 'verify:no-raw-address-kit', 'verify:preaudit-secrets'],
  privacy: ['verify:no-raw-address', 'verify:no-raw-address-kit', 'verify:mandatory-security', 'verify:privacy-threat-templates'],
  reliability: ['verify:app-shell', 'verify:developer-console', 'build'],
  performance: ['verify:release-build-assets', 'verify:app-shell'],
  design: ['verify:app-shell', 'verify:developer-console', 'build'],
  features: ['verify:developer-console', 'verify:app-shell', 'verify:agid-resolver-conformance'],
  hero: ['verify:app-shell', 'verify:oss-compatibility', 'verify:release-build-assets'],
  tutorial: ['verify:developer-console', 'verify:no-raw-address-kit', 'verify:agid-resolver-conformance'],
  'app-ux': ['verify:app-shell', 'verify:mandatory-security', 'build'],
  'address-quality': ['verify:address-registration', 'verify:agid-resolver-conformance', 'verify:postal-country-pack'],
  pwa: ['verify:release-build-assets', 'verify:app-shell'],
  docs: ['verify:oss-compatibility', 'verify:developer-console', 'lint'],
  maintainability: ['verify:repository-split-allocation', 'lint', 'build'],
};

const AGGREGATE_CHECK_GATE_IDS: Record<string, string[]> = {
  'verify:release-build-assets': ['build', 'build-chunk-budget', 'pwa-build-budget'],
};

const AGGREGATE_CHECK_COMPONENTS: Record<string, string[]> = {
  'verify:release-build-assets': ['build', 'verify:build-chunk-budget', 'verify:pwa'],
};

const AREA_EVIDENCE: Record<ImprovementArea, string[]> = {
  security: ['release-gate result', 'redacted risk note', 'blocked/allowed reason'],
  privacy: ['no-raw-address result', 'redaction sample', 'data-minimization note'],
  reliability: ['failing state', 'fixed state', 'regression test'],
  performance: ['bundle/build signal', 'before-after budget note', 'slow path owner'],
  design: ['desktop/mobile screenshot note', 'source test contract', 'spacing or hierarchy rule'],
  features: ['surface coverage row', 'API/SDK contract', 'compatibility proof'],
  hero: ['first-viewport contract', 'CTA route check', 'language copy coverage'],
  tutorial: ['runnable command', 'expected redacted response', 'failure recovery step'],
  'app-ux': ['one-tap path check', 'operator role note', 'undo/sync visibility'],
  'address-quality': ['public fixture id', 'normalization confidence', 'country rule impact'],
  pwa: ['installability result', 'offline behavior note', 'cache boundary'],
  docs: ['reader task', 'source link or spec anchor', 'stale copy removed'],
  maintainability: ['owner boundary', 'split/merge rationale', 'test command'],
};

const AREA_RESIDUAL_RISK_QUESTIONS: Record<ImprovementArea, string[]> = {
  security: ['Could this expose raw address, recipient, witness, key, token, or connector error material?'],
  privacy: ['Can the same workflow finish with alias, commitment, receipt, or scoped proof instead of raw address text?'],
  reliability: ['Which user-visible path still fails if the gate is skipped or offline?'],
  performance: ['Does the change increase first-load code, map layers, or repeated geodata work?'],
  design: ['Does the screen still work at mobile height without hidden primary actions?'],
  features: ['Did any route, hash link, SDK name, OpenAPI operation id, or exported shape change?'],
  hero: ['Can a new visitor understand AGID in five seconds without reading lower sections?'],
  tutorial: ['Can a developer run the sample without private fixtures or production traffic?'],
  'app-ux': ['Is the next action visible without burying QR, current location, sync, undo, or registration?'],
  'address-quality': ['Is the confidence source clear when postal data is weak or unavailable?'],
  pwa: ['Does offline or low-bandwidth mode keep the minimum AGID/QR path usable?'],
  docs: ['Can maintainers see the current rule, not only historical discussion?'],
  maintainability: ['Is the change in the right domain folder instead of adding more src/lib root weight?'],
};

export const COMPATIBILITY_IMPROVEMENT_TRACKS: CompatibilityImprovementTrack[] = [
  {
    id: 'design',
    area: 'design',
    label: 'Design system',
    goal: 'Tighten spacing, typography, responsive height, and hierarchy without changing routes or data contracts.',
    compatibilityRule: 'Only restyle existing surfaces unless a source test names the new UI contract.',
    verifyWith: ['lint', 'build', 'verify:app-shell'],
    routeRefs: ['/open-source', '/developer', '/dashboard'],
  },
  {
    id: 'features',
    area: 'features',
    label: 'Feature coverage',
    goal: 'Expose existing functions through clearer entry points before adding new behavior.',
    compatibilityRule: 'Preserve current URLs, hashes, SDK names, OpenAPI operation ids, and safe export shape.',
    verifyWith: ['verify:developer-console', 'verify:app-shell'],
    routeRefs: ['/developer#features', '/developer#sdk', '/developer#deploy'],
  },
  {
    id: 'hero',
    area: 'hero',
    label: 'Hero section',
    goal: 'Keep the first viewport instantly understandable while connecting app, docs, SDK, GitHub, and research.',
    compatibilityRule: 'Keep Try App, Read Docs, Download SDK, GitHub, and core hero copy stable.',
    verifyWith: ['verify:app-shell', 'build'],
    routeRefs: ['/open-source'],
  },
  {
    id: 'tutorial',
    area: 'tutorial',
    label: 'Tutorials',
    goal: 'Make hands-on paths runnable with redacted fixtures, expected responses, and failure recovery.',
    compatibilityRule: 'Tutorial examples must use alias, commitment, receipt, scope, and rawAddressReturned:false.',
    verifyWith: ['verify:developer-console', 'verify:no-raw-address-kit'],
    routeRefs: ['/developer#tutorial', '/developer#vectors'],
  },
  {
    id: 'app',
    area: 'app-ux',
    label: 'App UX',
    goal: 'Improve map, registration, POS, dashboard, portal, and field flows in small reversible slices.',
    compatibilityRule: 'Do not remove existing app surfaces; simplify or add affordances behind stable routes.',
    verifyWith: ['verify:app-shell', 'verify:mandatory-security', 'build'],
    routeRefs: ['/', '/portal', '/pos', '/dashboard'],
  },
];

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(numeric)));
}

function confidenceScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value * 100)));
}

function signalScore(signal: ImprovementSignal) {
  const compatibilityPenalty = COMPATIBILITY_RISK_PENALTY[signal.compatibilityRisk ?? 'low'];
  return SEVERITY_SCORE[signal.severity] + AREA_PRIORITY[signal.area] + confidenceScore(signal.confidence) - compatibilityPenalty;
}

export function createContinuousImprovementLoopPlan(
  input: ContinuousImprovementLoopInput = {},
): ContinuousImprovementLoopPlan {
  const gates: ImprovementGate[] = [
    {
      id: 'dependency-audit',
      command: ['npm', 'run', 'verify:dependency-audit'],
      required: true,
      blocksProduction: true,
      requiresExternalNetwork: true,
      description: 'Moderate-or-higher dependency advisories must be resolved before the loop continues. This gate runs npm audit and requires explicit external-network approval.',
    },
    {
      id: 'secret-scan',
      command: ['npm', 'run', 'verify:preaudit-secrets'],
      required: true,
      blocksProduction: true,
      description: 'External-audit secret scan must pass before any improvement is considered releasable.',
    },
    {
      id: 'typecheck',
      command: ['npm', 'run', 'lint'],
      required: true,
      blocksProduction: true,
      description: 'TypeScript typecheck must pass before claiming an improvement cycle is healthy.',
    },
    {
      id: 'app-shell-compat',
      command: ['npm', 'run', 'verify:app-shell'],
      required: true,
      blocksProduction: true,
      description: 'App shell, navigation, privacy mode, and always-visible action compatibility must hold.',
    },
    {
      id: 'developer-console-compat',
      command: ['npm', 'run', 'verify:developer-console'],
      required: true,
      blocksProduction: true,
      description: 'Developer Console tutorials, feature matrix, deep links, and safe samples must remain compatible.',
    },
    {
      id: 'oss-boundary-compat',
      command: ['npm', 'run', 'verify:oss-compatibility'],
      required: true,
      blocksProduction: true,
      description: 'Open-source/commercial source boundaries and independent research repository links must remain compatible.',
    },
    {
      id: 'repository-split-allocation',
      command: ['npm', 'run', 'verify:repository-split-allocation'],
      required: true,
      blocksProduction: true,
      description: 'Country, territory, polar, and ocean repository placement must stay staged and compatible with AGID reconstruction.',
    },
    {
      id: 'build',
      command: ['npm', 'run', 'build'],
      required: true,
      blocksProduction: true,
      description: 'Production build must still compile.',
    },
    {
      id: 'build-chunk-budget',
      command: ['npm', 'run', 'verify:build-chunk-budget'],
      required: true,
      blocksProduction: true,
      description:
        'Built assets must stay inside explicit local chunk budgets; known heavy map/runtime chunks need declared exceptions.',
    },
    {
      id: 'pwa-build-budget',
      command: ['npm', 'run', 'verify:pwa'],
      required: true,
      blocksProduction: true,
      description: 'PWA installability, service worker registration, and browser bundle size budgets must stay within the local release gate.',
    },
    {
      id: 'mandatory-security',
      command: ['npm', 'run', 'verify:mandatory-security'],
      required: true,
      blocksProduction: true,
      description: 'Mandatory privacy/security release gates must pass.',
    },
    {
      id: 'no-raw-address',
      command: ['npm', 'run', 'verify:no-raw-address'],
      required: true,
      blocksProduction: true,
      description: 'Raw address leakage checks must pass.',
    },
  ];

  if (input.includeProductionLoadDryRun) {
    gates.push({
      id: 'production-load-dry-run',
      command: ['npm', 'run', 'loadtest:prod:dry-run'],
      required: false,
      blocksProduction: true,
      description: 'Production load-test plan must validate in dry-run mode before any traffic is allowed.',
    });
  }

  return {
    version: CONTINUOUS_IMPROVEMENT_LOOP_VERSION,
    maxCycles: boundedInteger(input.maxCycles, 3, 1, 12),
    cadence: input.cadence ?? 'manual',
    gates,
    safety: {
      bounded: true,
      productionTrafficRequiresAck: true,
      destructiveChangesRequireExplicitApproval: true,
      rawAddressMaterialForbidden: true,
      responseBodiesNotStored: true,
    },
    allowed: {
      productionTraffic: input.allowProductionTraffic === true,
      externalNetwork: input.allowExternalNetwork === true,
      destructiveChange: input.allowDestructiveChange === true,
    },
  };
}

export function rankImprovementSignals(signals: ImprovementSignal[]) {
  return [...signals].sort((left, right) => {
    const scoreDiff = signalScore(right) - signalScore(left);
    if (scoreDiff !== 0) return scoreDiff;
    return left.id.localeCompare(right.id);
  });
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function modeForDecision(decision: ImprovementCycleDecision): ImprovementDepthMode {
  const first = decision.selectedSignals[0];
  if (!first) return 'balanced-breadth';
  if (first.area === 'security' || first.area === 'privacy') return 'release-gate-sweep';
  if (first.severity === 'critical' || first.severity === 'high') return 'focused-depth';
  return 'balanced-breadth';
}

function checksForAreas(areas: ImprovementArea[]) {
  return uniqueStrings(areas.flatMap(area => AREA_RECOMMENDED_CHECKS[area] ?? []));
}

function gateIdsForChecks(plan: ContinuousImprovementLoopPlan, checks: string[]) {
  const directGateIds = plan.gates
    .filter(gate => checks.some(check => gate.command.join(' ').includes(check)))
    .map(gate => gate.id);
  const aggregateGateIds = checks.flatMap(check => AGGREGATE_CHECK_GATE_IDS[check] ?? []);
  return uniqueStrings([...directGateIds, ...aggregateGateIds]);
}

function collapseAggregateCheckComponents(checks: string[]) {
  const coveredComponents = new Set(checks.flatMap(check => AGGREGATE_CHECK_COMPONENTS[check] ?? []));
  return checks.filter(check => !coveredComponents.has(check));
}

export function createImprovementDeepDivePlan(
  plan: ContinuousImprovementLoopPlan,
  decision: ImprovementCycleDecision,
): ImprovementDeepDivePlan {
  const selectedSignals = decision.selectedSignals;
  const primarySignal = selectedSignals[0];
  const primaryArea = primarySignal?.area ?? 'none';
  const mode = modeForDecision(decision);
  const adjacentAreas = selectedSignals
    .slice(1, 4)
    .map(signal => signal.area)
    .filter(area => area !== primaryArea);
  const areas = primarySignal
    ? (uniqueStrings([primarySignal.area, ...adjacentAreas]) as ImprovementArea[])
    : [];
  const releaseChecks = mode === 'release-gate-sweep'
    ? ['verify:mandatory-security', 'verify:no-raw-address', 'verify:no-raw-address-kit', 'verify:preaudit-secrets']
    : [];
  const recommendedChecks = collapseAggregateCheckComponents(
    uniqueStrings([...releaseChecks, ...checksForAreas(areas)]),
  ).slice(0, 8);
  const evidenceAreas: ImprovementArea[] = primarySignal
    ? (uniqueStrings([primarySignal.area, ...adjacentAreas]) as ImprovementArea[])
    : ['security'];

  return {
    version: CONTINUOUS_IMPROVEMENT_LOOP_VERSION,
    mode,
    primaryArea,
    depthGoal: primarySignal
      ? `Close or evidence the top ${primarySignal.area} signal before taking a broader refactor.`
      : 'Keep gates running and wait for a concrete signal before changing code.',
    breadthGoal: areas.length > 1
      ? `After the narrow fix, verify adjacent ${areas.slice(1).join(', ')} surfaces so the loop does not overfit one screen.`
      : 'After the narrow fix, run one app-shell or developer-console compatibility check before stopping.',
    selectedSignalIds: selectedSignals.map(signal => signal.id),
    gateIds: uniqueStrings(gateIdsForChecks(plan, recommendedChecks)),
    recommendedChecks,
    evidenceToRecord: uniqueStrings(evidenceAreas.flatMap(area => AREA_EVIDENCE[area])).slice(0, 8),
    residualRiskQuestions: uniqueStrings(evidenceAreas.flatMap(area => AREA_RESIDUAL_RISK_QUESTIONS[area])).slice(0, 6),
    nextArtifact: mode === 'release-gate-sweep'
      ? 'Append a redacted gate-evidence entry to reports/continuous-improvement-ledger.jsonl.'
      : 'Add one focused source test, fixture, or design-rule note that proves the selected signal improved.',
  };
}

function skipReason(signal: ImprovementSignal, plan: ContinuousImprovementLoopPlan) {
  if (signal.licenseProfile === 'commercial-private') return 'commercial-private-signal-excluded-from-oss-loop';
  if (signal.containsPrivateAddressMaterial) return 'private-address-material-is-forbidden';
  if (signal.compatibilityRisk === 'high') return 'high-compatibility-risk-needs-design-review';
  if (signal.requiresProductionTraffic && !plan.allowed.productionTraffic) return 'production-traffic-needs-explicit-ack';
  if (signal.requiresExternalNetwork && !plan.allowed.externalNetwork) return 'external-network-needs-explicit-approval';
  if (signal.requiresDestructiveChange && !plan.allowed.destructiveChange) return 'destructive-change-needs-explicit-approval';
  return '';
}

export function createCompatibilityImprovementLoopSummary(
  plan: ContinuousImprovementLoopPlan,
  decision: ImprovementCycleDecision,
): CompatibilityImprovementLoopSummary {
  const focus = decision.selectedSignals[0]?.area ?? 'security';
  const nextAction = decision.nextActions[0] ?? 'Keep compatibility gates green and wait for the next safe signal.';

  return {
    version: CONTINUOUS_IMPROVEMENT_LOOP_VERSION,
    headline: 'Compatibility-first improvement loop',
    focus,
    tracks: COMPATIBILITY_IMPROVEMENT_TRACKS,
    gateIds: plan.gates.filter(gate => gate.required).map(gate => gate.id),
    nextAction,
    releaseRule:
      'Ship only after source tests, no-raw-address checks, OSS boundary compatibility, app shell compatibility, Developer Console compatibility, lint, and verify:release-build-assets pass.',
  };
}

export function decideImprovementCycle(
  plan: ContinuousImprovementLoopPlan,
  signals: ImprovementSignal[],
  cycle = 1,
): ImprovementCycleDecision {
  if (cycle > plan.maxCycles) {
    return {
      cycle,
      status: 'stop',
      stopReason: 'max-cycles-reached',
      selectedSignals: [],
      skippedSignals: [],
      nextActions: ['Record the final state and wait for a new signal.'],
    };
  }

  const ranked = rankImprovementSignals(signals);
  const selectedSignals: ImprovementSignal[] = [];
  const skippedSignals: { id: string; reason: string }[] = [];
  for (const signal of ranked) {
    const reason = skipReason(signal, plan);
    if (reason) {
      skippedSignals.push({ id: signal.id, reason });
      continue;
    }
    if (selectedSignals.length < 5) selectedSignals.push(signal);
  }

  if (selectedSignals.length === 0 && skippedSignals.length > 0) {
    return {
      cycle,
      status: 'needs-approval',
      stopReason: 'all-remaining-signals-need-approval',
      selectedSignals,
      skippedSignals,
      nextActions: ['Ask for explicit approval or reduce the scope to local-only checks.'],
    };
  }

  if (selectedSignals.length === 0) {
    return {
      cycle,
      status: 'stop',
      stopReason: 'no-actionable-signals',
      selectedSignals,
      skippedSignals,
      nextActions: ['Keep the scheduled checks active and wait for new evidence.'],
    };
  }

  const first = selectedSignals[0];
  return {
    cycle,
    status: 'continue',
    selectedSignals,
    skippedSignals,
    nextActions: [
      `Start with ${first.area}: ${first.title}`,
      'Make the smallest scoped change that can close the signal.',
      'Run all required gates after the change.',
      'Record evidence, residual risk, and the next signal.',
    ],
  };
}
