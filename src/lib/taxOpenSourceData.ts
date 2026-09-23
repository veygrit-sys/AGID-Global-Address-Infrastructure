export const TAX_OPEN_SOURCE_DATA_VERSION = 'tax-open-source-data-v1';

export type TaxOpenSourceSourceId =
  | 'vatnode-eu-vat-rates-data'
  | 'node-sales-tax'
  | 'open-sales-tax'
  | 'commerceguys-tax'
  | 'benbucksch-eu-vat-rates'
  | 'taxfoundation-worldwide-corporate-tax-rates';

export type TaxOpenSourceDomain =
  | 'vat'
  | 'gst'
  | 'sales-tax'
  | 'digital-services-tax'
  | 'invoice-tax'
  | 'landed-cost-tax'
  | 'research-reference';

export type TaxOpenSourcePhase =
  | 'adopt-now-static'
  | 'self-host-or-cache'
  | 'operator-import-only'
  | 'optional-reference'
  | 'avoid-as-primary';

export type TaxOpenSourceRuntimeAccess =
  | 'static-bundle'
  | 'self-hosted-library'
  | 'operator-import'
  | 'manual-reference';

export type TaxOpenSourceLicenseRisk =
  | 'low'
  | 'medium'
  | 'high';

export type TaxOpenSourceSource = {
  id: TaxOpenSourceSourceId;
  label: string;
  provider: string;
  domains: TaxOpenSourceDomain[];
  phase: TaxOpenSourcePhase;
  openSource: boolean;
  official: boolean;
  license: string;
  licenseRisk: TaxOpenSourceLicenseRisk;
  runtimeAccess: TaxOpenSourceRuntimeAccess;
  liveApi: false;
  requiresKey: false;
  selfHostable: boolean;
  sourceUrl: string;
  useFor: string[];
  doNotUseFor: string[];
  integrationPattern: string;
  privacyBoundary: string;
  notes: string[];
};

export type TaxEvidenceRateType =
  | 'vat'
  | 'gst'
  | 'sales-tax'
  | 'customs-duty'
  | 'local-tax'
  | 'digital-services-tax';

export type TaxEvidenceConfidence =
  | 'official'
  | 'open-source'
  | 'operator-import'
  | 'manual';

export type TaxEvidenceRate = {
  sourceId: TaxOpenSourceSourceId | 'official-operator-import' | 'manual-operator-entry';
  countryCode: string;
  jurisdiction?: string;
  taxType: TaxEvidenceRateType;
  rate: number;
  category?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  confidence: TaxEvidenceConfidence;
  evidenceUrl?: string;
  retrievedAt?: string;
  notes?: string[];
};

export type TaxEstimateInput = {
  destinationCountry: string;
  originCountry?: string;
  taxableAmount: number;
  currency: string;
  category?: string;
  taxEvidence?: TaxEvidenceRate[];
  now?: string;
};

export type TaxEstimateLine = {
  sourceId: TaxEvidenceRate['sourceId'];
  countryCode: string;
  jurisdiction?: string;
  taxType: TaxEvidenceRateType;
  rate: number;
  amount: number;
  confidence: TaxEvidenceConfidence;
  evidenceUrl?: string;
};

export type TaxEstimateResult = {
  version: typeof TAX_OPEN_SOURCE_DATA_VERSION;
  status: 'estimated' | 'needs-evidence' | 'needs-manual-review';
  confidence: 'high' | 'medium' | 'low';
  destinationCountry: string;
  originCountry?: string;
  taxableAmount: number;
  currency: string;
  taxAmount: number;
  totalAmount: number;
  lines: TaxEstimateLine[];
  warnings: string[];
  manualReviewReasons: string[];
  privacyBoundary: string;
  rule: string;
};

export type TaxOpenSourceDataPlan = {
  version: typeof TAX_OPEN_SOURCE_DATA_VERSION;
  rule: string;
  sources: TaxOpenSourceSource[];
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function normalizeCountryCode(value: unknown) {
  return clean(value).toUpperCase();
}

function normalizeCurrency(value: unknown) {
  return clean(value).toUpperCase();
}

function parseDate(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function categoryMatches(evidenceCategory: string | undefined, requestedCategory: string | undefined) {
  if (!evidenceCategory || !requestedCategory) return true;
  return clean(evidenceCategory).toLowerCase() === clean(requestedCategory).toLowerCase();
}

function rateIsActive(evidence: TaxEvidenceRate, now: Date) {
  const from = parseDate(evidence.effectiveFrom);
  const to = parseDate(evidence.effectiveTo);
  if (from && from.getTime() > now.getTime()) return false;
  if (to && to.getTime() <= now.getTime()) return false;
  return true;
}

function sourceConfidenceRank(value: TaxEvidenceConfidence) {
  if (value === 'official') return 4;
  if (value === 'operator-import') return 3;
  if (value === 'open-source') return 2;
  return 1;
}

function evidenceDeduplicationKey(evidence: TaxEvidenceRate) {
  return [
    evidence.taxType,
    normalizeCountryCode(evidence.countryCode),
    clean(evidence.jurisdiction).toLowerCase(),
    clean(evidence.category).toLowerCase(),
  ].join('|');
}

export const TAX_OPEN_SOURCE_SOURCES: TaxOpenSourceSource[] = [
  {
    id: 'vatnode-eu-vat-rates-data',
    label: 'vatnode/eu-vat-rates-data',
    provider: 'vatnode community',
    domains: ['vat', 'invoice-tax', 'landed-cost-tax'],
    phase: 'adopt-now-static',
    openSource: true,
    official: false,
    license: 'MIT',
    licenseRisk: 'low',
    runtimeAccess: 'static-bundle',
    liveApi: false,
    requiresKey: false,
    selfHostable: true,
    sourceUrl: 'https://github.com/vatnode/eu-vat-rates-data',
    useFor: [
      'static EU and nearby European VAT rate reference',
      'POS and shopping-agent tax estimate evidence',
      'offline VAT-rate cache with source-version metadata',
    ],
    doNotUseFor: [
      'final legal invoice tax without seller nexus and product classification review',
      'automatic VAT exemption decision',
      'personal address or AOID submission',
    ],
    integrationPattern: 'Import as a versioned static data pack; retain commit hash, retrieval date, country, rate type, and category.',
    privacyBoundary: 'Use only country, category, and amount. Do not send buyer address, AGID, AOID, or recipient identity.',
    notes: [
      'Good default open-source VAT dataset for European estimates.',
      'Treat as evidence, not a tax authority ruling.',
    ],
  },
  {
    id: 'node-sales-tax',
    label: 'node-sales-tax / sales-tax',
    provider: 'node-sales-tax community',
    domains: ['vat', 'gst', 'sales-tax', 'digital-services-tax', 'invoice-tax'],
    phase: 'self-host-or-cache',
    openSource: true,
    official: false,
    license: 'MIT',
    licenseRisk: 'low',
    runtimeAccess: 'self-hosted-library',
    liveApi: false,
    requiresKey: false,
    selfHostable: true,
    sourceUrl: 'https://github.com/valeriansaliou/node-sales-tax',
    useFor: [
      'offline international VAT/GST/sales-tax estimate fallback',
      'developer-side tax-rate sanity checks',
      'shopping-agent price estimate explanation',
    ],
    doNotUseFor: [
      'audited tax filing',
      'jurisdiction-specific sales-tax boundary resolution',
      'automatic tax-exempt handling',
    ],
    integrationPattern: 'Keep behind an adapter; prefer source-versioned static evidence when available and never call optional online VAT checks by default.',
    privacyBoundary: 'Run locally with product/country inputs only. Disable any optional online validation path unless separately reviewed.',
    notes: [
      'Useful as an OSS calculation adapter, but source freshness must be audited before production use.',
    ],
  },
  {
    id: 'open-sales-tax',
    label: 'open-sales-tax',
    provider: 'open-sales-tax community',
    domains: ['sales-tax', 'invoice-tax'],
    phase: 'self-host-or-cache',
    openSource: true,
    official: false,
    license: 'Apache-2.0',
    licenseRisk: 'low',
    runtimeAccess: 'self-hosted-library',
    liveApi: false,
    requiresKey: false,
    selfHostable: true,
    sourceUrl: 'https://github.com/ejosterberg/open-sales-tax',
    useFor: [
      'US sales-tax estimate research',
      'self-hosted US jurisdiction and rate pipeline experiments',
      'POS manual-review hints for US-bound or US-domestic flows',
    ],
    doNotUseFor: [
      'complete US sales-tax compliance guarantee',
      'ZIP-only tax finalization',
      'replacement for official state/local tax authority checks',
    ],
    integrationPattern: 'Use as an optional self-hosted adapter. Store source state, dataset date, boundary version, and confidence.',
    privacyBoundary: 'Use coarse destination jurisdiction or local-only address evidence; do not send raw AOID or recipient data to outside services.',
    notes: [
      'US sales tax is boundary-heavy and cannot be safely solved from ZIP alone.',
      'Keep POS output in estimate/manual-review states unless strong jurisdiction evidence is supplied.',
    ],
  },
  {
    id: 'commerceguys-tax',
    label: 'commerceguys/tax',
    provider: 'Commerce Guys community',
    domains: ['vat', 'gst', 'sales-tax', 'invoice-tax'],
    phase: 'optional-reference',
    openSource: true,
    official: false,
    license: 'MIT',
    licenseRisk: 'low',
    runtimeAccess: 'self-hosted-library',
    liveApi: false,
    requiresKey: false,
    selfHostable: true,
    sourceUrl: 'https://github.com/commerceguys/tax',
    useFor: [
      'cross-language reference implementation',
      'rate-table modeling ideas',
      'invoice-tax rule design comparison',
    ],
    doNotUseFor: [
      'direct TypeScript runtime dependency',
      'final AGID POS tax engine without adapter tests',
    ],
    integrationPattern: 'Use as a design reference or optional service adapter; keep the TypeScript contract stable.',
    privacyBoundary: 'Do not pass customer address/AOID outside the deployment boundary.',
    notes: [
      'Useful for professional tax model structure even if the AGID app remains TypeScript-first.',
    ],
  },
  {
    id: 'benbucksch-eu-vat-rates',
    label: 'benbucksch/eu-vat-rates',
    provider: 'benbucksch community',
    domains: ['vat', 'digital-services-tax'],
    phase: 'optional-reference',
    openSource: true,
    official: false,
    license: 'MIT',
    licenseRisk: 'low',
    runtimeAccess: 'static-bundle',
    liveApi: false,
    requiresKey: false,
    selfHostable: true,
    sourceUrl: 'https://github.com/benbucksch/eu-vat-rates',
    useFor: [
      'simple EU VAT JSON reference',
      'developer fixture generation',
    ],
    doNotUseFor: [
      'only VAT source when better source-versioned evidence is available',
      'country-specific invoicing without seller/product rules',
    ],
    integrationPattern: 'Keep as a secondary fixture/reference source; prefer vatnode for broader Europe coverage.',
    privacyBoundary: 'Static public rate data only.',
    notes: [
      'Small and easy to inspect, useful as a fallback fixture source.',
    ],
  },
  {
    id: 'taxfoundation-worldwide-corporate-tax-rates',
    label: 'Tax Foundation worldwide corporate tax rates',
    provider: 'Tax Foundation',
    domains: ['research-reference'],
    phase: 'optional-reference',
    openSource: true,
    official: false,
    license: 'CC-BY or source-specific open-data terms',
    licenseRisk: 'medium',
    runtimeAccess: 'manual-reference',
    liveApi: false,
    requiresKey: false,
    selfHostable: true,
    sourceUrl: 'https://github.com/TaxFoundation/worldwide-corporate-tax-rates',
    useFor: [
      'research appendix',
      'business-context analytics',
    ],
    doNotUseFor: [
      'POS VAT/GST/sales-tax calculation',
      'consumer landed-cost estimate',
    ],
    integrationPattern: 'Keep separate from checkout tax. Use only for research reports after attribution review.',
    privacyBoundary: 'Aggregate public research data only.',
    notes: [
      'Corporate tax rates are not checkout taxes; keep this source out of POS calculation paths.',
    ],
  },
];

export function getTaxOpenSourceDataPlan(): TaxOpenSourceDataPlan {
  return {
    version: TAX_OPEN_SOURCE_DATA_VERSION,
    rule: 'Use open-source tax libraries and static/operator-imported rate evidence for estimates only; never turn AGID/AOID/POS tax output into a final tax filing, legal customs ruling, or exemption decision without jurisdiction-specific review.',
    sources: TAX_OPEN_SOURCE_SOURCES,
  };
}

export function getTaxOpenSourceSourcesByDomain(domain: TaxOpenSourceDomain): TaxOpenSourceSource[] {
  return TAX_OPEN_SOURCE_SOURCES.filter((source) => source.domains.includes(domain));
}

export function getTaxOpenSourceSourcesByPhase(phase: TaxOpenSourcePhase): TaxOpenSourceSource[] {
  return TAX_OPEN_SOURCE_SOURCES.filter((source) => source.phase === phase);
}

export function getRecommendedTaxOpenSourceSources(): TaxOpenSourceSource[] {
  return TAX_OPEN_SOURCE_SOURCES.filter((source) => (
    source.openSource
    && source.licenseRisk !== 'high'
    && (source.phase === 'adopt-now-static' || source.phase === 'self-host-or-cache')
  ));
}

export function estimateTaxFromOpenEvidence(input: TaxEstimateInput): TaxEstimateResult {
  const now = parseDate(input.now) ?? new Date();
  const destinationCountry = normalizeCountryCode(input.destinationCountry);
  const originCountry = normalizeCountryCode(input.originCountry);
  const currency = normalizeCurrency(input.currency);
  const taxableAmount = typeof input.taxableAmount === 'number' && Number.isFinite(input.taxableAmount)
    ? input.taxableAmount
    : Number.NaN;
  const warnings: string[] = [
    'tax-output-is-an-estimate-not-a-final-filing-or-customs-ruling',
    'do-not-submit-raw-address-agid-aoid-or-recipient-data-to-tax-sources',
  ];
  const manualReviewReasons: string[] = [];

  if (!destinationCountry) manualReviewReasons.push('destination-country-missing');
  if (!currency) manualReviewReasons.push('currency-missing');
  if (!Number.isFinite(taxableAmount) || taxableAmount <= 0) manualReviewReasons.push('taxable-amount-missing-or-invalid');

  const activeEvidence = (input.taxEvidence || [])
    .filter((evidence) => normalizeCountryCode(evidence.countryCode) === destinationCountry)
    .filter((evidence) => categoryMatches(evidence.category, input.category))
    .filter((evidence) => rateIsActive(evidence, now))
    .filter((evidence) => Number.isFinite(evidence.rate) && evidence.rate >= 0 && evidence.rate <= 1)
    .sort((left, right) => sourceConfidenceRank(right.confidence) - sourceConfidenceRank(left.confidence));

  if (activeEvidence.length === 0) {
    manualReviewReasons.push('tax-rate-evidence-missing');
  }

  const lines: TaxEstimateLine[] = [];
  if (manualReviewReasons.length === 0) {
    const seenEvidenceKeys = new Set<string>();
    const selectedEvidence = activeEvidence
      .filter((evidence) => {
        const key = evidenceDeduplicationKey(evidence);
        if (seenEvidenceKeys.has(key)) return false;
        seenEvidenceKeys.add(key);
        return true;
      })
      .slice(0, 6);
    for (const evidence of selectedEvidence) {
      lines.push({
        sourceId: evidence.sourceId,
        countryCode: normalizeCountryCode(evidence.countryCode),
        jurisdiction: clean(evidence.jurisdiction) || undefined,
        taxType: evidence.taxType,
        rate: Math.round(evidence.rate * 100000) / 100000,
        amount: roundMoney(taxableAmount * evidence.rate),
        confidence: evidence.confidence,
        evidenceUrl: clean(evidence.evidenceUrl) || undefined,
      });
    }
  }

  const taxAmount = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
  const totalAmount = roundMoney((Number.isFinite(taxableAmount) ? taxableAmount : 0) + taxAmount);
  const confidence: TaxEstimateResult['confidence'] = lines.some((line) => line.confidence === 'official' || line.confidence === 'operator-import')
    ? 'high'
    : lines.length > 0
      ? 'medium'
      : 'low';
  const status: TaxEstimateResult['status'] = manualReviewReasons.length > 0
    ? manualReviewReasons.includes('tax-rate-evidence-missing')
      ? 'needs-evidence'
      : 'needs-manual-review'
    : 'estimated';

  if (lines.some((line) => line.taxType === 'sales-tax')) {
    warnings.push('sales-tax-often-requires-boundary-level-jurisdiction-evidence-not-zip-only');
  }
  if (lines.some((line) => line.taxType === 'customs-duty')) {
    warnings.push('customs-duty-estimates-require-hs-classification-and-import-measure-review');
  }

  return {
    version: TAX_OPEN_SOURCE_DATA_VERSION,
    status,
    confidence,
    destinationCountry,
    originCountry: originCountry || undefined,
    taxableAmount: Number.isFinite(taxableAmount) ? roundMoney(taxableAmount) : 0,
    currency,
    taxAmount,
    totalAmount,
    lines,
    warnings: unique(warnings),
    manualReviewReasons: unique(manualReviewReasons),
    privacyBoundary: 'The tax layer may use country, jurisdiction, category, value, currency, and source-versioned tax-rate evidence. It must not send or store raw address, AGID, AOID, recipient name, phone, or private delivery instructions.',
    rule: getTaxOpenSourceDataPlan().rule,
  };
}
