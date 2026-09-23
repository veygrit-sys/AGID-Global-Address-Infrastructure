import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  createContinuousImprovementLoopPlan,
  createImprovementDeepDivePlan,
  decideImprovementCycle,
  type ImprovementGate,
  type ImprovementSignal,
} from '../src/lib/continuousImprovementLoop';
import { createAddressCommunicationImprovementSignals } from '../src/lib/address/addressCommunicationEngineering';

function argValue(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function hasArg(name: string) {
  return process.argv.includes(name);
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function npmCli() {
  if (process.env.npm_execpath) return process.env.npm_execpath;
  const globalNpm = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
  if (process.platform === 'win32') return globalNpm;
  return 'npm';
}

function gateCommand(gate: ImprovementGate) {
  const [, , script] = gate.command;
  if (gate.command[0] === 'npm' && gate.command[1] === 'run' && script) {
    const cli = npmCli();
    return process.platform === 'win32'
      ? { command: process.execPath, args: [cli, 'run', script] }
      : { command: cli, args: ['run', script] };
  }
  return { command: gate.command[0], args: gate.command.slice(1) };
}

function runGate(gate: ImprovementGate) {
  const { command, args } = gateCommand(gate);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) throw result.error;
  return {
    id: gate.id,
    status: result.status ?? 1,
    required: gate.required,
    blocksProduction: gate.blocksProduction,
  };
}

function gateSkipReason(gate: ImprovementGate, plan: ReturnType<typeof createContinuousImprovementLoopPlan>) {
  if (gate.requiresExternalNetwork && !plan.allowed.externalNetwork) return 'external-network-needs-explicit-approval';
  if (gate.requiresProductionTraffic && !plan.allowed.productionTraffic) return 'production-traffic-needs-explicit-ack';
  if (gate.requiresDestructiveChange && !plan.allowed.destructiveChange) return 'destructive-change-needs-explicit-approval';
  return '';
}

function loadSignals(): ImprovementSignal[] {
  const signalPath = argValue('--signals');
  if (!signalPath) {
    return [
      {
        id: 'security-gate-review',
        area: 'security',
        severity: 'high',
        confidence: 0.8,
        title: 'Keep security and no-raw-address gates green after each change',
        source: 'continuous-loop-default',
      },
      {
        id: 'build-warning-review',
        area: 'performance',
        severity: 'medium',
        confidence: 0.7,
        title: 'Review production build warnings and chunk growth',
        source: 'continuous-loop-default',
        compatibilityRisk: 'low',
      },
      {
        id: 'address-quality-fixture-review',
        area: 'address-quality',
        severity: 'medium',
        confidence: 0.7,
        title: 'Add or update one safe public fixture for address rendering quality',
        source: 'continuous-loop-default',
        compatibilityRisk: 'low',
      },
      {
        id: 'hero-section-clarity-review',
        area: 'hero',
        severity: 'medium',
        confidence: 0.75,
        title: 'Keep the hero clear while preserving Try App, Docs, SDK, and GitHub routes',
        source: 'continuous-loop-default',
        compatibilityRisk: 'low',
      },
      {
        id: 'tutorial-coverage-review',
        area: 'tutorial',
        severity: 'medium',
        confidence: 0.72,
        title: 'Keep hands-on tutorials runnable with redacted fixtures and recovery steps',
        source: 'continuous-loop-default',
        compatibilityRisk: 'low',
      },
      {
        id: 'app-ux-compatibility-review',
        area: 'app-ux',
        severity: 'medium',
        confidence: 0.72,
        title: 'Improve app usability without removing existing routes or shared primitives',
        source: 'continuous-loop-default',
        compatibilityRisk: 'low',
      },
      {
        id: 'repository-split-allocation-review',
        area: 'maintainability',
        severity: 'medium',
        confidence: 0.78,
        title: 'Keep global repository split allocation staged instead of creating every logical child repository at once',
        source: 'repository-split-allocation-audit',
        compatibilityRisk: 'low',
      },
      {
        id: 'agid-main-repo-cleanliness-review',
        area: 'maintainability',
        severity: 'medium',
        confidence: 0.82,
        title: 'Keep the AGID main workspace clean by bucketing docs, avoiding new src/lib root files, and externalizing heavy data',
        source: 'repo-cleanliness-policy',
        compatibilityRisk: 'low',
      },
      ...createAddressCommunicationImprovementSignals(3),
    ];
  }
  const absolutePath = path.resolve(signalPath);
  return JSON.parse(readFileSync(absolutePath, 'utf8')) as ImprovementSignal[];
}

function safeLedgerText(value: unknown) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\b(?:recipient|phone|email|witness|privateKey|privateAddress|rawAddress|apiKey|token|secret)\b/gi, 'redacted-field')
    .replace(/\bprivate key\b/gi, 'redacted-field')
    .replace(/\braw address\b/gi, 'redacted-field')
    .slice(0, 240);
}

function recentSignalLedgerEntries(limit = 16) {
  const ledgerPath = path.resolve('reports', 'continuous-improvement-ledger.jsonl');
  if (!existsSync(ledgerPath)) return [];
  return readFileSync(ledgerPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit)
    .flatMap(line => {
      try {
        const entry = JSON.parse(line) as {
          selectedSignalId?: string;
          gatesExecuted?: boolean;
          gateSummary?: { failed?: number; requiredFailed?: number };
          gateEvidence?: { passed?: boolean }[];
        };
        const failed = (entry.gateSummary?.failed ?? 0) + (entry.gateSummary?.requiredFailed ?? 0);
        return entry.selectedSignalId
          ? [{
            selectedSignalId: entry.selectedSignalId,
            succeeded: (entry.gatesExecuted && failed === 0) || entry.gateEvidence?.some(gate => gate.passed),
          }]
          : [];
      } catch {
        return [];
      }
    });
}

function diversifyRecentlyEvidencedSignals(signals: ImprovementSignal[]) {
  const recentEntries = recentSignalLedgerEntries();
  const recentIds = recentEntries.map(entry => entry.selectedSignalId);
  const successfulIds = new Set(
    recentEntries.filter(entry => entry.succeeded).map(entry => entry.selectedSignalId),
  );
  const repeatedIds = new Set(
    recentIds.filter((id, index) => recentIds.indexOf(id) !== index && successfulIds.has(id)),
  );
  if (repeatedIds.size === 0) return signals;
  return signals.map(signal => {
    if (!repeatedIds.has(signal.id) || signal.severity === 'critical') return signal;
    return {
      ...signal,
      severity: 'low' as const,
      confidence: Math.min(signal.confidence, 0.25),
      source: `${signal.source}:recently-evidenced`,
    };
  });
}

function writeImprovementLedger(report: {
  generatedAt: string;
  status: string;
  executeGates: boolean;
  decision: ReturnType<typeof decideImprovementCycle>;
  deepDive: ReturnType<typeof createImprovementDeepDivePlan>;
  gateSummary: Record<string, number>;
  reportNextActions: string[];
}) {
  const ledgerPath = path.resolve('reports', 'continuous-improvement-ledger.jsonl');
  mkdirSync(path.dirname(ledgerPath), { recursive: true });
  const selected = report.decision.selectedSignals[0];
  const entry = {
    generatedAt: report.generatedAt,
    status: report.status,
    improvementRequired: true,
    improvementKind: report.status === 'continue' ? 'scoped-change-or-evidence' : 'smallest-next-fix-record',
    focus: selected?.area ?? 'gate',
    selectedSignalId: selected?.id ?? null,
    selectedSignalTitle: selected ? safeLedgerText(selected.title) : null,
    nextAction: safeLedgerText(report.reportNextActions[0] ?? 'Review the next safe local signal.'),
    deepDiveMode: report.deepDive.mode,
    recommendedChecks: report.deepDive.recommendedChecks.map(safeLedgerText),
    nextArtifact: safeLedgerText(report.deepDive.nextArtifact),
    residualRiskQuestions: report.deepDive.residualRiskQuestions.map(safeLedgerText),
    gatesExecuted: report.executeGates,
    gateSummary: report.gateSummary,
  };
  appendFileSync(ledgerPath, `${JSON.stringify(entry)}\n`, 'utf8');
  return ledgerPath;
}

const executeGates = hasArg('--execute-gates');
const skipLedger = hasArg('--no-ledger');
const includeProductionLoadDryRun = hasArg('--include-production-load-dry-run');
const plan = createContinuousImprovementLoopPlan({
  maxCycles: parseNumber(argValue('--max-cycles') ?? process.env.AGID_IMPROVEMENT_MAX_CYCLES),
  cadence: (argValue('--cadence') as any) || 'manual',
  includeProductionLoadDryRun,
  allowProductionTraffic: process.env.AGID_IMPROVEMENT_ALLOW_PRODUCTION_TRAFFIC === 'true',
  allowExternalNetwork: process.env.AGID_IMPROVEMENT_ALLOW_EXTERNAL_NETWORK === 'true',
  allowDestructiveChange: process.env.AGID_IMPROVEMENT_ALLOW_DESTRUCTIVE_CHANGE === 'true',
});

const signals = diversifyRecentlyEvidencedSignals(loadSignals());
const decision = decideImprovementCycle(plan, signals, parseNumber(argValue('--cycle')) ?? 1);
const deepDive = createImprovementDeepDivePlan(plan, decision);
const gateResults = executeGates
  ? plan.gates.map(gate => {
    const skippedReason = gateSkipReason(gate, plan);
    if (skippedReason) {
      return {
        id: gate.id,
        status: 'skipped',
        required: gate.required,
        blocksProduction: gate.blocksProduction,
        skippedReason,
      };
    }
    return runGate(gate);
  })
  : [];
const requiredGateNeedsApproval = gateResults.some(result => result.required && result.status === 'skipped');
const requiredGateFailed = gateResults.some(result => result.required && result.status !== 0 && result.status !== 'skipped');
const reportStatus = requiredGateFailed
  ? 'blocked-by-gate'
  : requiredGateNeedsApproval
    ? 'needs-approval'
    : decision.status;
const gateSummary = {
  total: gateResults.length,
  passed: gateResults.filter(result => result.status === 0).length,
  skippedForApproval: gateResults.filter(result => result.status === 'skipped').length,
  failed: gateResults.filter(result => result.status !== 0 && result.status !== 'skipped').length,
  requiredSkippedForApproval: gateResults.filter(result => result.required && result.status === 'skipped').length,
  requiredFailed: gateResults.filter(result => result.required && result.status !== 0 && result.status !== 'skipped').length,
};
const reportNextActions = requiredGateFailed
  ? gateResults
    .filter(result => result.required && result.status !== 0 && result.status !== 'skipped')
    .map(result => `Fix required gate: ${result.id}`)
  : requiredGateNeedsApproval
    ? gateResults
      .filter(result => result.required && result.status === 'skipped')
      .map(result => `Get explicit approval for ${result.id}: ${'skippedReason' in result ? result.skippedReason : 'approval-required'}`)
    : decision.nextActions;

const report = {
  generatedAt: new Date().toISOString(),
  executeGates,
  plan,
  decision,
  deepDive,
  gateResults,
  gateSummary,
  reportNextActions,
  status: reportStatus,
};

const improvementLedgerPath = skipLedger ? undefined : writeImprovementLedger(report);
const outputReport = {
  ...report,
  improvementRequired: true,
  improvementLedgerPath,
};

console.log(JSON.stringify(outputReport, null, 2));

if (requiredGateFailed || requiredGateNeedsApproval || decision.status === 'needs-approval') {
  process.exit(2);
}
