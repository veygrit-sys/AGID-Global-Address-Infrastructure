export const TRADE_COMPLIANCE_DATA_PLAN_VERSION = 'trade-compliance-data-plan-v1';

export type TradeComplianceSourceId =
  | 'wto-tariff-data'
  | 'un-comtrade-api'
  | 'world-bank-wits'
  | 'datasets-harmonized-system'
  | 'opencorporates-api'
  | 'imo-gisis'
  | 'frankfurter-self-host'
  | 'frankfurter-api'
  | 'exchangerate-host';

export type TradeComplianceDomain =
  | 'tariff'
  | 'hs-code'
  | 'trade-statistics'
  | 'customs-party-check'
  | 'shipping'
  | 'currency';

export type TradeComplianceAdoptionPhase =
  | 'adopt-now-static'
  | 'adopt-now-api'
  | 'self-host-or-cache'
  | 'operator-import-only'
  | 'adopt-after-key-or-terms-review'
  | 'optional-reference'
  | 'avoid-as-primary';

export type TradeComplianceRuntimeAccess =
  | 'static-bundle'
  | 'self-hosted-service'
  | 'operator-import'
  | 'public-live-api'
  | 'key-gated-api'
  | 'manual-reference';

export type TradeComplianceSource = {
  id: TradeComplianceSourceId;
  label: string;
  domains: TradeComplianceDomain[];
  phase: TradeComplianceAdoptionPhase;
  official: boolean;
  liveApi: boolean;
  cacheRecommended: boolean;
  runtimeAccess: TradeComplianceRuntimeAccess;
  licenseOrTermsCheck: 'low' | 'medium' | 'high';
  useFor: string[];
  doNotUseFor: string[];
  integrationPattern: string;
  notes: string[];
};

export type TradeCompliancePlan = {
  version: typeof TRADE_COMPLIANCE_DATA_PLAN_VERSION;
  rule: string;
  sources: TradeComplianceSource[];
};

export const TRADE_COMPLIANCE_SOURCES: TradeComplianceSource[] = [
  {
    id: 'datasets-harmonized-system',
    label: 'datasets/harmonized-system',
    domains: ['hs-code'],
    phase: 'adopt-now-static',
    official: false,
    liveApi: false,
    cacheRecommended: true,
    runtimeAccess: 'static-bundle',
    licenseOrTermsCheck: 'low',
    useFor: [
      'offline HS code lookup',
      'product classification UI assist',
      'POS customs declaration prefill',
      'shopping-agent product category hints',
    ],
    doNotUseFor: [
      'final customs ruling',
      'country-specific tariff amount calculation',
    ],
    integrationPattern: 'Import as a versioned static dataset with source version, license, and checksum metadata.',
    notes: [
      'Good first dataset because it is small enough for static lookup and avoids live API latency.',
      'Treat HS suggestions as assistive because legal classification may require expert review.',
    ],
  },
  {
    id: 'wto-tariff-data',
    label: 'WTO Tariff and Trade Data',
    domains: ['tariff', 'trade-statistics'],
    phase: 'adopt-now-static',
    official: true,
    liveApi: false,
    cacheRecommended: true,
    runtimeAccess: 'operator-import',
    licenseOrTermsCheck: 'medium',
    useFor: [
      'official tariff reference snapshots',
      'country/product tariff evidence packs',
      'offline tariff tables for supported corridors',
    ],
    doNotUseFor: [
      'real-time landed-cost guarantee',
      'private recipient or AOID storage',
    ],
    integrationPattern: 'Mirror selected CSV/XLS/XML snapshots into data packs; store source date, reporter, product code, and retrieval URL.',
    notes: [
      'Best as a curated evidence source rather than a per-scan live dependency.',
      'Use it to explain tariff basis, not to promise final payable customs duty.',
    ],
  },
  {
    id: 'world-bank-wits',
    label: 'World Bank WITS API',
    domains: ['tariff', 'trade-statistics'],
    phase: 'optional-reference',
    official: true,
    liveApi: true,
    cacheRecommended: true,
    runtimeAccess: 'public-live-api',
    licenseOrTermsCheck: 'medium',
    useFor: [
      'operator-reviewed tariff and trade metadata import',
      'country/product data availability checks outside the POS critical path',
      'offline evidence enrichment after terms review',
    ],
    doNotUseFor: [
      'default fully-free POS dependency',
      'blocking POS checkout when the API is unavailable',
      'raw address or AOID submission',
    ],
    integrationPattern: 'Exclude from the default fully-free path; allow operator-imported snapshots only after access terms and redistribution rules are reviewed.',
    notes: [
      'Useful reference source, but a live public API is still an operational dependency.',
      'Keep results as advisory compliance evidence.',
    ],
  },
  {
    id: 'un-comtrade-api',
    label: 'UN Comtrade API',
    domains: ['trade-statistics', 'hs-code'],
    phase: 'adopt-after-key-or-terms-review',
    official: true,
    liveApi: true,
    cacheRecommended: true,
    runtimeAccess: 'key-gated-api',
    licenseOrTermsCheck: 'high',
    useFor: [
      'HS-code trade flow statistics',
      'market route analysis',
      'shopping-agent import/export context',
    ],
    doNotUseFor: [
      'tariff rate calculation',
      'customs clearance decision',
      'per-user live lookup without quota protection',
    ],
    integrationPattern: 'Use a backend connector with API-token support, quota controls, and daily/monthly cache windows.',
    notes: [
      'Powerful, but more suitable for statistics and analytics than immediate POS clearance.',
      'Add only after API account, quota, and redistribution rules are documented.',
    ],
  },
  {
    id: 'opencorporates-api',
    label: 'OpenCorporates API',
    domains: ['customs-party-check'],
    phase: 'adopt-after-key-or-terms-review',
    official: false,
    liveApi: true,
    cacheRecommended: true,
    runtimeAccess: 'key-gated-api',
    licenseOrTermsCheck: 'high',
    useFor: [
      'exporter/importer organization lookup',
      'business identity enrichment',
      'manual review queue evidence',
    ],
    doNotUseFor: [
      'automatic denial of service',
      'identity proof without local official documents',
      'high-volume lookups on a free quota',
    ],
    integrationPattern: 'Use as an optional server-side enrichment connector with strict rate limiting and a human-review result state.',
    notes: [
      'Rate limits and commercial terms make it unsuitable as a default free core dependency.',
      'Company identity varies by jurisdiction, so unresolved/manual-review states are required.',
    ],
  },
  {
    id: 'imo-gisis',
    label: 'IMO GISIS',
    domains: ['shipping'],
    phase: 'optional-reference',
    official: true,
    liveApi: false,
    cacheRecommended: false,
    runtimeAccess: 'manual-reference',
    licenseOrTermsCheck: 'high',
    useFor: [
      'manual maritime reference',
      'ship/company particulars lookup by IMO number',
      'shipping compliance evidence link',
    ],
    doNotUseFor: [
      'automated scraping',
      'default POS flow',
      'private shipment tracking',
    ],
    integrationPattern: 'Link out or keep operator-entered IMO references; do not automate until access terms allow it.',
    notes: [
      'Public area is useful, but automated API-style ingestion is not the first choice.',
      'Prefer carrier-provided shipment APIs for operational tracking later.',
    ],
  },
  {
    id: 'frankfurter-self-host',
    label: 'Frankfurter self-host / local FX cache',
    domains: ['currency'],
    phase: 'self-host-or-cache',
    official: false,
    liveApi: false,
    cacheRecommended: true,
    runtimeAccess: 'self-hosted-service',
    licenseOrTermsCheck: 'low',
    useFor: [
      'fully-free POS currency display',
      'landed-cost estimate currency conversion from local cache',
      'shopping-agent price normalization without third-party live calls',
    ],
    doNotUseFor: [
      'final card settlement rate',
      'tax authority exchange-rate filing without jurisdiction review',
    ],
    integrationPattern: 'Run Frankfurter-compatible code locally or import reference-rate snapshots into an internal FX table; do not depend on public API quota.',
    notes: [
      'This is the default fully-free currency path.',
      'Rates are reference data; payment processors may settle at different rates.',
    ],
  },
  {
    id: 'frankfurter-api',
    label: 'Frankfurter API',
    domains: ['currency'],
    phase: 'optional-reference',
    official: false,
    liveApi: true,
    cacheRecommended: true,
    runtimeAccess: 'public-live-api',
    licenseOrTermsCheck: 'low',
    useFor: [
      'POS currency display',
      'landed-cost estimate currency conversion',
      'shopping-agent price normalization',
    ],
    doNotUseFor: [
      'final card settlement rate',
      'tax authority exchange-rate filing without jurisdiction review',
    ],
    integrationPattern: 'Keep as a development/reference connector only; production fully-free deployments should use frankfurter-self-host.',
    notes: [
      'Best initial currency source because it is open-source and does not require an API key.',
      'Rates are reference data; payment processors may settle at different rates.',
    ],
  },
  {
    id: 'exchangerate-host',
    label: 'exchangerate.host',
    domains: ['currency'],
    phase: 'avoid-as-primary',
    official: false,
    liveApi: true,
    cacheRecommended: true,
    runtimeAccess: 'public-live-api',
    licenseOrTermsCheck: 'medium',
    useFor: [
      'fallback exchange-rate connector after current access terms are verified',
    ],
    doNotUseFor: [
      'primary no-key currency dependency',
      'hard-coded browser calls without rate-limit handling',
    ],
    integrationPattern: 'Keep as a pluggable fallback provider behind the same currency adapter contract.',
    notes: [
      'Do not assume the service is permanently keyless or unlimited.',
      'Use Frankfurter first unless exchangerate.host terms are confirmed for the deployment.',
    ],
  },
];

export function getTradeComplianceDataPlan(): TradeCompliancePlan {
  return {
    version: TRADE_COMPLIANCE_DATA_PLAN_VERSION,
    rule: 'Use static, self-hosted, or operator-imported evidence by default; do not depend on free-tier SaaS/API quotas, and never turn trade data into an automatic legal customs decision.',
    sources: TRADE_COMPLIANCE_SOURCES,
  };
}

export function getTradeComplianceSourcesByPhase(phase: TradeComplianceAdoptionPhase): TradeComplianceSource[] {
  return TRADE_COMPLIANCE_SOURCES.filter((source) => source.phase === phase);
}

export function getTradeComplianceSourcesByDomain(domain: TradeComplianceDomain): TradeComplianceSource[] {
  return TRADE_COMPLIANCE_SOURCES.filter((source) => source.domains.includes(domain));
}

export function getRecommendedInitialTradeComplianceSources(): TradeComplianceSource[] {
  return getRecommendedFullyFreeTradeComplianceSources();
}

export function getRecommendedFullyFreeTradeComplianceSources(): TradeComplianceSource[] {
  return TRADE_COMPLIANCE_SOURCES.filter((source) => (
    source.phase === 'adopt-now-static'
    || source.phase === 'self-host-or-cache'
    || source.phase === 'operator-import-only'
  ));
}
