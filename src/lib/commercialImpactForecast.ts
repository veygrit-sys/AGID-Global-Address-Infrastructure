import {
  COMMERCIAL_FEATURE_AREAS,
  type CommercialFeatureArea,
  type ServiceOfferingId,
} from './openCoreProductStrategy';

export const COMMERCIAL_IMPACT_FORECAST_VERSION = 'agid-commercial-impact-forecast-v1';

export type ForecastHorizon = '12-month' | '24-month' | '36-month';
export type RevenuePriority = 'primary' | 'secondary' | 'optionality';
export type ReadinessStage = 'design' | 'prototype' | 'pilot-ready' | 'commercial-ready';

export type RevenueBand = {
  lowUsd: number;
  baseUsd: number;
  highUsd: number;
  assumption: string;
};

export type CommercialForecastLine = {
  commercialFeatureId: CommercialFeatureArea['id'];
  label: string;
  serviceIds: ServiceOfferingId[];
  priority: RevenuePriority;
  readiness: ReadinessStage;
  impactScore: number;
  plausiblePricing: string[];
  customerSegments: string[];
  impact: string[];
  constraints: string[];
  guardrails: string[];
  revenue: Record<ForecastHorizon, RevenueBand>;
};

export type CommercialImpactScenario = {
  horizon: ForecastHorizon;
  label: string;
  lowArrUsd: number;
  baseArrUsd: number;
  highArrUsd: number;
  interpretation: string;
};

export type CommercialImpactForecast = {
  version: typeof COMMERCIAL_IMPACT_FORECAST_VERSION;
  conclusion: string;
  philosophy: string;
  assumptions: string[];
  forecastLines: CommercialForecastLine[];
  scenarios: CommercialImpactScenario[];
  topRevenueDrivers: string[];
  impactClaims: string[];
  doNotDoForRevenue: string[];
};

export type CommercialImpactForecastValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const COMMERCIAL_FORECAST_LINES: CommercialForecastLine[] = [
  {
    commercialFeatureId: 'hosted-registry-api',
    label: 'Hosted Registry API',
    serviceIds: ['hosted-registry-api'],
    priority: 'primary',
    readiness: 'pilot-ready',
    impactScore: 86,
    plausiblePricing: [
      'free self-hosted registry',
      'USD 99-999/month per organization for hosted registry operations',
      'USD 0.001-0.01 per high-volume revocation/nullifier/freshness check above included usage',
    ],
    customerSegments: ['delivery platforms', 'marketplaces', 'NGOs', 'municipal pilots', 'issuer networks'],
    impact: [
      'Makes revocation, freshness, nullifier, and issuer status operational across organizations.',
      'Reduces duplicate-use and stale-credential risk without storing raw addresses.',
    ],
    constraints: [
      'Trust depends on uptime, abuse control, and clear no-raw-address guarantees.',
      'Revenue starts only after at least one real issuer or POS network uses it.',
    ],
    guardrails: [
      'Self-hosting remains fully supported.',
      'Store commitments, roots, nullifiers, statuses, and issuer metadata only.',
    ],
    revenue: {
      '12-month': {
        lowUsd: 0,
        baseUsd: 25000,
        highUsd: 120000,
        assumption: '1-5 small pilot organizations using hosted registry checks.',
      },
      '24-month': {
        lowUsd: 80000,
        baseUsd: 350000,
        highUsd: 1200000,
        assumption: '10-30 organizations with real revocation/nullifier traffic.',
      },
      '36-month': {
        lowUsd: 250000,
        baseUsd: 1200000,
        highUsd: 4000000,
        assumption: 'Regional issuer/carrier adoption plus volume-based hosted checks.',
      },
    },
  },
  {
    commercialFeatureId: 'enterprise-dashboard',
    label: 'Enterprise Dashboard',
    serviceIds: ['address-console-dashboard'],
    priority: 'primary',
    readiness: 'prototype',
    impactScore: 78,
    plausiblePricing: [
      'free self-hosted dashboard',
      'USD 199-2,000/month per organization for hosted dashboard, RBAC, API keys, webhook logs, and SLA views',
    ],
    customerSegments: ['retail chains', 'carriers', 'NGOs', 'municipal operations', 'warehouse operators'],
    impact: [
      'Turns AGID from a developer project into an operator-manageable platform.',
      'Centralizes redacted audit, webhook, issuer, terminal, and review operations.',
    ],
    constraints: [
      'Needs strong role design and evidence that logs cannot reconstruct private addresses.',
      'Dashboard alone is not valuable until POS/registry flows are active.',
    ],
    guardrails: [
      'Redacted logs by default.',
      'Raw evidence escalation requires scope, role, and audit reason.',
    ],
    revenue: {
      '12-month': {
        lowUsd: 0,
        baseUsd: 20000,
        highUsd: 100000,
        assumption: 'A few design partners pay for hosted admin convenience.',
      },
      '24-month': {
        lowUsd: 60000,
        baseUsd: 300000,
        highUsd: 1200000,
        assumption: '15-50 organizations use dashboard and webhook operations.',
      },
      '36-month': {
        lowUsd: 250000,
        baseUsd: 1200000,
        highUsd: 4000000,
        assumption: 'Enterprise dashboard becomes the control plane for registry, POS, review, and audit.',
      },
    },
  },
  {
    commercialFeatureId: 'advanced-pos-management',
    label: 'Advanced POS Management',
    serviceIds: ['agid-pos-terminal'],
    priority: 'primary',
    readiness: 'prototype',
    impactScore: 84,
    plausiblePricing: [
      'free local POS reference app',
      'USD 10-50/month per managed terminal',
      'USD 50-500/month per site for sync, device policy, staff permissions, and diagnostics',
    ],
    customerSegments: ['pickup counters', 'parcel shops', 'PUDO networks', 'humanitarian field teams', 'warehouse shipping desks'],
    impact: [
      'Directly improves scan-to-decision speed and delivery handoff assurance.',
      'Creates the most visible commercial product surface.',
    ],
    constraints: [
      'Hardware support, offline behavior, staff UX, and device signing must be mature.',
      'Requires field pilots before serious fleet revenue.',
    ],
    guardrails: [
      'Basic local scan, decrypt, receipt, and offline queue stay free.',
      'Device telemetry excludes raw addresses and AGID-S payloads.',
    ],
    revenue: {
      '12-month': {
        lowUsd: 0,
        baseUsd: 15000,
        highUsd: 75000,
        assumption: '10-100 managed terminals in pilots.',
      },
      '24-month': {
        lowUsd: 100000,
        baseUsd: 300000,
        highUsd: 1500000,
        assumption: '300-1,500 managed terminals plus site-level operations.',
      },
      '36-month': {
        lowUsd: 500000,
        baseUsd: 1800000,
        highUsd: 7000000,
        assumption: '2,000-8,000 terminals or one sizeable chain/carrier deployment.',
      },
    },
  },
  {
    commercialFeatureId: 'advanced-review-console',
    label: 'Advanced Review Console',
    serviceIds: ['address-review-console'],
    priority: 'secondary',
    readiness: 'design',
    impactScore: 72,
    plausiblePricing: [
      'free self-hosted case model and reason codes',
      'USD 49-199/month per reviewer seat',
      'USD 0.10-2.00 per managed review case depending on evidence and SLA',
    ],
    customerSegments: ['address validation teams', 'NGOs', 'carriers', 'marketplaces', 'public-sector help desks'],
    impact: [
      'Prevents false automation confidence by routing ambiguous address cases to human review.',
      'Creates audit trails for rejection, correction, dispute, and PID merge/split decisions.',
    ],
    constraints: [
      'Human review can become expensive and privacy-sensitive.',
      'Needs redaction-first evidence workflow before paid review is safe.',
    ],
    guardrails: [
      'Reason-code schema stays open.',
      'Raw evidence access requires explicit scope and audit reason.',
    ],
    revenue: {
      '12-month': {
        lowUsd: 0,
        baseUsd: 10000,
        highUsd: 50000,
        assumption: 'Low-volume managed review for early pilots.',
      },
      '24-month': {
        lowUsd: 50000,
        baseUsd: 180000,
        highUsd: 700000,
        assumption: 'Review seats and case fees for commercial validation workflows.',
      },
      '36-month': {
        lowUsd: 150000,
        baseUsd: 700000,
        highUsd: 2500000,
        assumption: 'Multiple operators use review queues for disputes, failed deliveries, and high-value handoffs.',
      },
    },
  },
  {
    commercialFeatureId: 'managed-zk',
    label: 'Managed ZK Proof Service',
    serviceIds: ['managed-zk-proof-service'],
    priority: 'optionality',
    readiness: 'design',
    impactScore: 64,
    plausiblePricing: [
      'free circuits and self-host prover path',
      'USD 0.02-1.00 per proof depending on circuit cost and SLA',
      'USD 500-5,000/month for managed proof queue and verifier support',
    ],
    customerSegments: ['high-risk NGOs', 'privacy-preserving identity issuers', 'public-sector pilots', 'Web3 infrastructure teams'],
    impact: [
      'Enables private eligibility and ownership predicates without exposing addresses.',
      'Differentiates AGID where public audit and privacy both matter.',
    ],
    constraints: [
      'Not a near-term revenue core until circuits are audited and witness handling is proven.',
      'Proving costs may fall, lowering per-proof pricing power.',
    ],
    guardrails: [
      'Witnesses and private inputs are never logged.',
      'ZK remains optional and never becomes required for basic address operation.',
    ],
    revenue: {
      '12-month': {
        lowUsd: 0,
        baseUsd: 5000,
        highUsd: 40000,
        assumption: 'Mostly grants or prototype payments for one minimal circuit.',
      },
      '24-month': {
        lowUsd: 20000,
        baseUsd: 120000,
        highUsd: 600000,
        assumption: 'A few privacy-sensitive pilots pay for managed prover operations.',
      },
      '36-month': {
        lowUsd: 100000,
        baseUsd: 600000,
        highUsd: 2500000,
        assumption: 'Audited circuits and repeat proof workloads exist.',
      },
    },
  },
  {
    commercialFeatureId: 'managed-evidence-vault',
    label: 'Managed Evidence Vault',
    serviceIds: ['address-evidence-vault'],
    priority: 'secondary',
    readiness: 'prototype',
    impactScore: 77,
    plausiblePricing: [
      'free local encrypted evidence envelope',
      'USD 99-1,000/month per organization for encrypted retention and OCR workflows',
      'USD 0.01-0.20 per document for OCR/redaction compute plus storage pass-through',
    ],
    customerSegments: ['public-sector programs', 'NGOs', 'marketplaces', 'carriers', 'regulated merchants'],
    impact: [
      'Connects uploaded photos/PDFs to address verification without forcing external OCR by default.',
      'Supports legal hold, retention, redaction, and audit exports when organizations need them.',
    ],
    constraints: [
      'High privacy and compliance burden.',
      'Can become dangerous if raw documents are centralized too early.',
    ],
    guardrails: [
      'Local and encrypted by default.',
      'External OCR and managed sync require explicit consent and redaction policy.',
    ],
    revenue: {
      '12-month': {
        lowUsd: 0,
        baseUsd: 10000,
        highUsd: 60000,
        assumption: 'Small managed evidence pilots for documents and waybills.',
      },
      '24-month': {
        lowUsd: 50000,
        baseUsd: 220000,
        highUsd: 900000,
        assumption: 'Document retention and OCR workflows for review-heavy customers.',
      },
      '36-month': {
        lowUsd: 200000,
        baseUsd: 900000,
        highUsd: 3500000,
        assumption: 'Evidence vault becomes tied to review console, disputes, and compliance exports.',
      },
    },
  },
  {
    commercialFeatureId: 'advanced-review-console',
    label: 'Address Radar / Signal',
    serviceIds: ['address-radar-signal'],
    priority: 'secondary',
    readiness: 'prototype',
    impactScore: 80,
    plausiblePricing: [
      'free OSS rule model and reason codes',
      'USD 100-2,000/month per organization for managed risk rules',
      'USD 0.001-0.02 per high-volume risk decision above included usage',
    ],
    customerSegments: ['high-value merchants', 'marketplaces', 'carriers', 'parcel locker operators', 'NGO distribution programs'],
    impact: [
      'Reduces QR copy abuse, duplicate registration, suspicious handoff, and low-quality address acceptance.',
      'Provides explainable operator decisions rather than opaque fraud scoring.',
    ],
    constraints: [
      'Must avoid discriminatory or opaque address risk scoring.',
      'Needs meaningful event volume before models outperform rules.',
    ],
    guardrails: [
      'Basic safety rules remain open.',
      'Risk output uses explainable reason codes and redacted events.',
    ],
    revenue: {
      '12-month': {
        lowUsd: 0,
        baseUsd: 5000,
        highUsd: 40000,
        assumption: 'Rule tuning for early handoff and registry customers.',
      },
      '24-month': {
        lowUsd: 40000,
        baseUsd: 180000,
        highUsd: 800000,
        assumption: 'Managed risk policies for merchants and carriers.',
      },
      '36-month': {
        lowUsd: 200000,
        baseUsd: 1000000,
        highUsd: 4000000,
        assumption: 'Risk decisions become bundled with hosted registry and POS fleet workflows.',
      },
    },
  },
  {
    commercialFeatureId: 'private-deployment',
    label: 'Private Deployment',
    serviceIds: [
      'agid-resolver-service',
      'address-validation-service',
      'agid-pos-terminal',
      'hosted-registry-api',
      'address-console-dashboard',
    ],
    priority: 'primary',
    readiness: 'pilot-ready',
    impactScore: 88,
    plausiblePricing: [
      'USD 10,000-75,000 pilot deployment',
      'USD 75,000-250,000 enterprise/public-sector deployment',
      '15-25% annual support and hardening retainer',
    ],
    customerSegments: ['municipalities', 'NGOs', 'large carriers', 'warehouse networks', 'retail chains'],
    impact: [
      'Converts AGID into real operational infrastructure for high-risk or regulated environments.',
      'Can fund OSS maintenance without closing the standard.',
    ],
    constraints: [
      'Sales cycles are slow and require deployment/security documentation.',
      'Each deployment can become custom work unless product boundaries are strict.',
    ],
    guardrails: [
      'Public standard remains independently usable.',
      'Private deployments do not create proprietary address truth silos.',
    ],
    revenue: {
      '12-month': {
        lowUsd: 20000,
        baseUsd: 60000,
        highUsd: 250000,
        assumption: '1-3 paid pilots or implementation retainers.',
      },
      '24-month': {
        lowUsd: 200000,
        baseUsd: 600000,
        highUsd: 2500000,
        assumption: '3-10 private deployments with some recurring support.',
      },
      '36-month': {
        lowUsd: 500000,
        baseUsd: 1800000,
        highUsd: 7000000,
        assumption: 'Repeatable private deployment package for public sector, carriers, or NGO networks.',
      },
    },
  },
  {
    commercialFeatureId: 'commercial-support',
    label: 'Commercial Support',
    serviceIds: [
      'agid-resolver-service',
      'address-validation-service',
      'agid-address-element',
      'agid-pos-terminal',
      'address-portal',
    ],
    priority: 'secondary',
    readiness: 'pilot-ready',
    impactScore: 74,
    plausiblePricing: [
      'USD 2,000-10,000/month support retainer',
      'USD 5,000-50,000 implementation package',
      'custom training, audit-readiness, and integration support',
    ],
    customerSegments: ['developers', 'retailers', 'carriers', 'NGOs', 'public-sector integrators'],
    impact: [
      'Creates revenue without paywalling the protocol.',
      'Improves adoption quality through implementation guidance and audits.',
    ],
    constraints: [
      'Consulting revenue does not scale as cleanly as SaaS.',
      'Can distract from productization if every integration is custom.',
    ],
    guardrails: [
      'Support is optional and public docs remain sufficient for independent adoption.',
      'No customer-specific fork should break standard compatibility.',
    ],
    revenue: {
      '12-month': {
        lowUsd: 10000,
        baseUsd: 30000,
        highUsd: 150000,
        assumption: 'Small support retainers around OSS pilots.',
      },
      '24-month': {
        lowUsd: 100000,
        baseUsd: 300000,
        highUsd: 1200000,
        assumption: 'Several support contracts and integration packages.',
      },
      '36-month': {
        lowUsd: 250000,
        baseUsd: 900000,
        highUsd: 3000000,
        assumption: 'Support attaches to private deployments and enterprise dashboard customers.',
      },
    },
  },
  {
    commercialFeatureId: 'hosted-registry-api',
    label: 'Payment / Settlement / Carrier Label Service',
    serviceIds: ['payment-settlement-carrier-label-service'],
    priority: 'optionality',
    readiness: 'design',
    impactScore: 70,
    plausiblePricing: [
      'free waybill QR and payment intent schema',
      'external payment/carrier fees passed through',
      'USD 0.01-0.05 per label/receipt/handoff operation when managed',
      '0.1-0.5% platform fee on escrowed delivery payment only where lawful and useful',
    ],
    customerSegments: ['small merchants', 'parcel shops', 'cross-border sellers', 'carriers', 'marketplaces'],
    impact: [
      'Connects address proof, waybill QR, recipient proof, and delivery payment into one handoff flow.',
      'Can become high-volume if carrier integrations mature.',
    ],
    constraints: [
      'Thin margins and external pass-through costs.',
      'Payment regulations and carrier certification can slow commercialization.',
    ],
    guardrails: [
      'Waybill QR schema and local payment states remain free.',
      'Never require crypto/Ethereum for ordinary prepaid or collect-on-delivery flows.',
    ],
    revenue: {
      '12-month': {
        lowUsd: 0,
        baseUsd: 5000,
        highUsd: 50000,
        assumption: 'Prototype label/handoff operations only.',
      },
      '24-month': {
        lowUsd: 30000,
        baseUsd: 150000,
        highUsd: 900000,
        assumption: 'A few carriers or merchants use managed waybill/handoff receipts.',
      },
      '36-month': {
        lowUsd: 150000,
        baseUsd: 800000,
        highUsd: 5000000,
        assumption: 'High-volume label/handoff flow with pass-through fees and modest platform margin.',
      },
    },
  },
];

function sumRevenue(horizon: ForecastHorizon, key: keyof RevenueBand): number {
  return COMMERCIAL_FORECAST_LINES.reduce((total, line) => total + Number(line.revenue[horizon][key]), 0);
}

export function getCommercialImpactScenarios(): CommercialImpactScenario[] {
  return [
    {
      horizon: '12-month',
      label: 'Pilot revenue',
      lowArrUsd: sumRevenue('12-month', 'lowUsd'),
      baseArrUsd: sumRevenue('12-month', 'baseUsd'),
      highArrUsd: sumRevenue('12-month', 'highUsd'),
      interpretation: 'Commercial revenue is mostly pilots, support, and one or two private deployments. Product-market fit is still unproven.',
    },
    {
      horizon: '24-month',
      label: 'Early B2B revenue',
      lowArrUsd: sumRevenue('24-month', 'lowUsd'),
      baseArrUsd: sumRevenue('24-month', 'baseUsd'),
      highArrUsd: sumRevenue('24-month', 'highUsd'),
      interpretation: 'Hosted registry, dashboard, POS fleet, and private deployments can become a real early-stage B2B business if pilots convert.',
    },
    {
      horizon: '36-month',
      label: 'Focused vertical scale',
      lowArrUsd: sumRevenue('36-month', 'lowUsd'),
      baseArrUsd: sumRevenue('36-month', 'baseUsd'),
      highArrUsd: sumRevenue('36-month', 'highUsd'),
      interpretation: 'Revenue is meaningful only if AGID wins a narrow vertical such as parcel shops, NGO field logistics, or marketplace address proof.',
    },
  ];
}

export function getCommercialImpactForecast(): CommercialImpactForecast {
  return {
    version: COMMERCIAL_IMPACT_FORECAST_VERSION,
    conclusion: 'The commercial opportunity is real but should be treated as an operations-and-trust business, not a data resale or token business. The realistic base case is roughly USD 185k ARR at 12 months, USD 2.7M ARR at 24 months, and USD 10.9M ARR at 36 months if pilots convert into hosted registry, POS fleet, dashboard, review, and private deployment contracts.',
    philosophy: 'Revenue should come from unavoidable managed operations, SLA, review labor, retention, proof compute, carrier/payment pass-through, and deployment support while keeping the standards, local resolver, Address Element, basic POS, Portal, and security controls free.',
    assumptions: [
      'No revenue is assumed from selling raw address data.',
      'Mode 0 Local Only remains fully usable.',
      'Paid features have a self-hosted or local fallback wherever the protocol can support it.',
      'Revenue forecasts assume real pilots, not only documentation.',
      'All figures are annual recurring or recurring-equivalent USD estimates, not guaranteed outcomes.',
      'High case requires at least one carrier, retailer, NGO, public-sector, or marketplace partner.',
    ],
    forecastLines: COMMERCIAL_FORECAST_LINES.map(line => ({
      ...line,
      serviceIds: [...line.serviceIds],
      plausiblePricing: [...line.plausiblePricing],
      customerSegments: [...line.customerSegments],
      impact: [...line.impact],
      constraints: [...line.constraints],
      guardrails: [...line.guardrails],
      revenue: {
        '12-month': { ...line.revenue['12-month'] },
        '24-month': { ...line.revenue['24-month'] },
        '36-month': { ...line.revenue['36-month'] },
      },
    })),
    scenarios: getCommercialImpactScenarios(),
    topRevenueDrivers: [
      'Private Deployment',
      'Advanced POS Management',
      'Hosted Registry API',
      'Enterprise Dashboard',
      'Address Radar / Signal',
    ],
    impactClaims: [
      'Reduce failed or risky handoffs by combining address quality, carrier acceptance, recipient proof, and receipt evidence.',
      'Give high-risk users a way to use address infrastructure without publishing precise location data.',
      'Give merchants and field teams a self-hostable fallback instead of forcing a central address database.',
      'Create a reusable trust layer for issuer, revocation, nullifier, and freshness status across organizations.',
    ],
    doNotDoForRevenue: [
      'Do not sell raw addresses or recipient identity graphs.',
      'Do not make high-risk privacy controls paid.',
      'Do not require Ethereum, ZK, or a hosted registry for basic delivery/POS operation.',
      'Do not claim legal residence or address truth without issuer evidence and jurisdictional review.',
      'Do not turn the project into a token-first fundraising story.',
    ],
  };
}

export function validateCommercialImpactForecast(
  forecast = getCommercialImpactForecast(),
): CommercialImpactForecastValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const commercialFeatureIds = new Set(COMMERCIAL_FEATURE_AREAS.map(area => area.id));
  const lineFeatureIds = new Set<string>();

  for (const line of forecast.forecastLines) {
    if (!commercialFeatureIds.has(line.commercialFeatureId)) {
      errors.push(`unknown-commercial-feature:${line.commercialFeatureId}`);
    }
    lineFeatureIds.add(line.commercialFeatureId);
    if (line.impactScore < 0 || line.impactScore > 100) errors.push(`invalid-impact-score:${line.label}`);
    if (!line.serviceIds.length) errors.push(`missing-service-link:${line.label}`);
    if (!line.guardrails.length) errors.push(`missing-guardrails:${line.label}`);
    for (const horizon of ['12-month', '24-month', '36-month'] as const) {
      const band = line.revenue[horizon];
      if (band.lowUsd > band.baseUsd || band.baseUsd > band.highUsd) {
        errors.push(`invalid-revenue-band:${line.label}:${horizon}`);
      }
      if (!band.assumption.trim()) errors.push(`missing-revenue-assumption:${line.label}:${horizon}`);
    }
  }

  for (const featureId of commercialFeatureIds) {
    if (!lineFeatureIds.has(featureId)) errors.push(`missing-commercial-feature-forecast:${featureId}`);
  }

  for (const scenario of forecast.scenarios) {
    if (scenario.lowArrUsd > scenario.baseArrUsd || scenario.baseArrUsd > scenario.highArrUsd) {
      errors.push(`invalid-scenario-band:${scenario.horizon}`);
    }
  }

  const byHorizon = new Map(forecast.scenarios.map(scenario => [scenario.horizon, scenario]));
  if ((byHorizon.get('12-month')?.baseArrUsd ?? 0) >= (byHorizon.get('24-month')?.baseArrUsd ?? 0)) {
    warnings.push('12-month-base-not-below-24-month-base');
  }
  if ((byHorizon.get('24-month')?.baseArrUsd ?? 0) >= (byHorizon.get('36-month')?.baseArrUsd ?? 0)) {
    warnings.push('24-month-base-not-below-36-month-base');
  }

  const forbiddenText = forecast.doNotDoForRevenue.join(' ').toLowerCase();
  for (const phrase of ['sell raw addresses', 'high-risk privacy controls paid', 'token-first']) {
    if (!forbiddenText.includes(phrase)) errors.push(`missing-revenue-guardrail:${phrase}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
