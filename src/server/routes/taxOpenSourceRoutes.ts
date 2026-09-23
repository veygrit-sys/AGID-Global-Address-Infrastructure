import type { Express } from 'express';

import {
  estimateTaxFromOpenEvidence,
  getRecommendedTaxOpenSourceSources,
  getTaxOpenSourceDataPlan,
  getTaxOpenSourceSourcesByDomain,
  getTaxOpenSourceSourcesByPhase,
  type TaxEvidenceRate,
  type TaxOpenSourceDomain,
  type TaxOpenSourcePhase,
} from '../../lib/taxOpenSourceData';
import { sendAgidResult } from '../agidResult';
import { arrayOrUndefined, objectBody } from '../requestParsing';

const TAX_DOMAINS = new Set<TaxOpenSourceDomain>([
  'vat',
  'gst',
  'sales-tax',
  'digital-services-tax',
  'invoice-tax',
  'landed-cost-tax',
  'research-reference',
]);

const TAX_PHASES = new Set<TaxOpenSourcePhase>([
  'adopt-now-static',
  'self-host-or-cache',
  'operator-import-only',
  'optional-reference',
  'avoid-as-primary',
]);

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function optionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = clean(value);
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalDomain(value: unknown): TaxOpenSourceDomain | undefined {
  const domain = clean(value) as TaxOpenSourceDomain;
  return TAX_DOMAINS.has(domain) ? domain : undefined;
}

function optionalPhase(value: unknown): TaxOpenSourcePhase | undefined {
  const phase = clean(value) as TaxOpenSourcePhase;
  return TAX_PHASES.has(phase) ? phase : undefined;
}

function taxEvidenceFrom(value: unknown): TaxEvidenceRate[] {
  return (arrayOrUndefined<TaxEvidenceRate>(value) ?? [])
    .filter((item) => item && typeof item === 'object')
    .map((item) => item as TaxEvidenceRate);
}

export function registerTaxOpenSourceRoutes(app: Express) {
  app.get('/api/tax/open-source/sources', (req, res) => {
    const domain = optionalDomain(req.query.domain);
    const phase = optionalPhase(req.query.phase);
    const recommendedOnly = req.query.recommended === '1' || req.query.recommended === 'true';
    const plan = getTaxOpenSourceDataPlan();
    const sources = domain
      ? getTaxOpenSourceSourcesByDomain(domain)
      : phase
        ? getTaxOpenSourceSourcesByPhase(phase)
        : recommendedOnly
          ? getRecommendedTaxOpenSourceSources()
          : plan.sources;

    sendAgidResult(req, res, {
      ok: true,
      data: {
        version: plan.version,
        rule: plan.rule,
        filters: { domain, phase, recommendedOnly },
        sources,
      },
      confidence: 1,
      sources: ['agid-tax-open-source-data'],
      warnings: ['tax-sources-are-estimate-support-not-final-tax-advice'],
      cache: 'hit',
    });
  });

  app.post('/api/tax/open-source/estimate', (req, res) => {
    const body = objectBody(req.body);
    const estimate = estimateTaxFromOpenEvidence({
      destinationCountry: clean(body.destinationCountry ?? body.destination),
      originCountry: clean(body.originCountry ?? body.origin),
      taxableAmount: optionalNumber(body.taxableAmount ?? body.amount ?? body.declaredValue) ?? Number.NaN,
      currency: clean(body.currency),
      category: clean(body.category) || undefined,
      taxEvidence: taxEvidenceFrom(body.taxEvidence ?? body.evidence),
      now: clean(body.now) || undefined,
    });
    const ok = estimate.status === 'estimated';
    const status = estimate.status === 'needs-manual-review'
      ? 400
      : estimate.status === 'needs-evidence'
        ? 422
        : 200;

    sendAgidResult(req, res, {
      ok,
      data: estimate,
      error: ok ? undefined : estimate.manualReviewReasons[0] ?? 'Tax estimate requires evidence',
      confidence: estimate.confidence === 'high' ? 0.9 : estimate.confidence === 'medium' ? 0.65 : 0.25,
      sources: ['agid-tax-open-source-data'],
      warnings: estimate.warnings,
      cache: 'none',
    }, status);
  });
}
