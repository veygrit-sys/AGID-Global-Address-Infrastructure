import { existsSync,mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';

type GisWarningBudget = {
  version: number;
  maxErrors: number;
  maxWarnings: number;
  minFeatures: number;
  minRegisteredSources: number;
  issueBudgets: Record<string, number>;
};

type GisIssue = {
  severity: 'error' | 'warning';
  issue: string;
};

type GisValidationReport = {
  summary: {
    features: number;
    errors: number;
    warnings: number;
  };
  openSourceRegistry: {
    registeredSources: number;
  };
  issues: GisIssue[];
};

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const budgetPath = join(ROOT, 'src', 'data', 'gisWarningBudget.json');
const reportPath = join(ROOT, 'test-results', 'gis-validation', 'gis-validation-report.json');
const outPath = join(ROOT, 'test-results', 'gis-validation', 'gis-warning-budget-report.json');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

async function refreshGisReport() {
  if (args.has('--no-refresh') && existsSync(reportPath)) return;

  const previousExitCode = process.exitCode;
  await import('./verify-gis-data.ts');
  if (process.exitCode && process.exitCode !== previousExitCode) {
    throw new Error('Base GIS validation failed before the warning budget could be checked.');
  }
}

function countByIssue(issues: GisIssue[]) {
  return issues
    .filter(issue => issue.severity === 'warning')
    .reduce<Record<string, number>>((counts, issue) => {
      counts[issue.issue] = (counts[issue.issue] ?? 0) + 1;
      return counts;
    }, {});
}

async function main() {
  await refreshGisReport();

  const budget = readJson<GisWarningBudget>(budgetPath);
  const report = readJson<GisValidationReport>(reportPath);
  const issueCounts = countByIssue(report.issues);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (report.summary.errors > budget.maxErrors) {
    errors.push(`errors ${report.summary.errors} exceed budget ${budget.maxErrors}`);
  }
  if (report.summary.warnings > budget.maxWarnings) {
    errors.push(`warnings ${report.summary.warnings} exceed budget ${budget.maxWarnings}`);
  }
  if (report.summary.features < budget.minFeatures) {
    errors.push(`features ${report.summary.features} below minimum ${budget.minFeatures}`);
  }
  if (report.openSourceRegistry.registeredSources < budget.minRegisteredSources) {
    errors.push(`registered sources ${report.openSourceRegistry.registeredSources} below minimum ${budget.minRegisteredSources}`);
  }

  Object.entries(issueCounts).forEach(([issue, count]) => {
    const max = budget.issueBudgets[issue];
    if (max === undefined) {
      errors.push(`new warning issue type without budget: ${issue}=${count}`);
    } else if (count > max) {
      errors.push(`${issue} warnings ${count} exceed budget ${max}`);
    } else if (count < max) {
      warnings.push(`${issue} warnings improved from budget ${max} to ${count}; consider lowering the budget`);
    }
  });

  Object.entries(budget.issueBudgets).forEach(([issue, max]) => {
    if ((issueCounts[issue] ?? 0) === 0 && max > 0) {
      warnings.push(`${issue} warnings are now zero; consider lowering the budget`);
    }
  });

  mkdirSync(join(ROOT, 'test-results', 'gis-validation'), { recursive: true });
  const budgetReport = {
    generatedAt: new Date().toISOString(),
    budgetVersion: budget.version,
    pass: errors.length === 0,
    summary: report.summary,
    registeredSources: report.openSourceRegistry.registeredSources,
    issueCounts,
    budget,
    warnings,
    errors,
  };
  writeFileSync(outPath, `${JSON.stringify(budgetReport, null, 2)}\n`);

  console.log(`[GIS budget] Features: ${report.summary.features}`);
  console.log(`[GIS budget] Errors: ${report.summary.errors}/${budget.maxErrors}`);
  console.log(`[GIS budget] Warnings: ${report.summary.warnings}/${budget.maxWarnings}`);
  console.log(`[GIS budget] Registered sources: ${report.openSourceRegistry.registeredSources}/${budget.minRegisteredSources}`);
  console.log(`[GIS budget] Result: ${budgetReport.pass ? 'pass' : 'fail'}`);
  console.log(`[GIS budget] Report: ${outPath}`);

  if (errors.length) {
    errors.forEach(error => console.error(`[GIS budget] ${error}`));
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
