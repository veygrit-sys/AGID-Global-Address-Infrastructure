export const CROSS_BORDER_AUXILIARY_DATA_VERSION = 'cross-border-auxiliary-data-v1';

export type CrossBorderUseCase =
  | 'cross-border-shipping'
  | 'pos-checkout'
  | 'shopping-agent'
  | 'humanitarian-handoff';

export type CrossBorderDomain =
  | 'address-validation'
  | 'postal-standard'
  | 'geocoding'
  | 'tariff'
  | 'hs-code'
  | 'trade-statistics'
  | 'customs-measures'
  | 'vat-tax'
  | 'currency'
  | 'product-barcode'
  | 'business-identity'
  | 'route-risk'
  | 'carrier-availability'
  | 'restriction-screening'
  | 'semantic-standard';

export type CrossBorderAdoptionPhase =
  | 'adopt-now-static'
  | 'adopt-now-api'
  | 'self-host-or-cache'
  | 'operator-import-only'
  | 'adopt-after-key-or-terms-review'
  | 'optional-reference'
  | 'avoid-as-primary';

export type CrossBorderFreeAccess =
  | 'yes'
  | 'limited'
  | 'registration'
  | 'terms-review'
  | 'no';

export type CrossBorderSourceId =
  | 'gs1-digital-link-standard'
  | 'gs1-epcis-standard'
  | 'upu-s10-standard'
  | 'libpostal-self-host'
  | 'pelias-self-host'
  | 'openaddresses-dataset'
  | 'datasets-harmonized-system'
  | 'wto-tariff-data'
  | 'world-bank-wits'
  | 'un-comtrade-api'
  | 'frankfurter-self-host'
  | 'frankfurter-api'
  | 'ecb-data-api'
  | 'uk-trade-tariff-api'
  | 'usitc-hts-rest-api'
  | 'eu-taric'
  | 'ec-vies'
  | 'ec-vat-rates'
  | 'vatnode-eu-vat-rates-data'
  | 'node-sales-tax'
  | 'open-sales-tax'
  | 'commerceguys-tax'
  | 'open-food-facts-api'
  | 'osm-nominatim-self-host'
  | 'overpass-api'
  | 'upu-s42-addressing'
  | 'usps-addresses-api'
  | 'japan-post-postal-csv-posuto'
  | 'un-cefact-ccl'
  | 'barcodeapi-server'
  | 'gs1-verified-by-gs1'
  | 'what3words-api'
  | 'opencorporates-api';

export type CrossBorderDataPolicy =
  | 'fully-free-local-first'
  | 'public-free-api-allowed';

export type CrossBorderAuxiliarySource = {
  id: CrossBorderSourceId;
  label: string;
  provider: string;
  domains: CrossBorderDomain[];
  phase: CrossBorderAdoptionPhase;
  official: boolean;
  openSource: boolean;
  liveApi: boolean;
  freeAccess: CrossBorderFreeAccess;
  requiresKey: boolean;
  selfHostable: boolean;
  cacheRecommended: boolean;
  sourceUrl: string;
  useFor: string[];
  doNotUseFor: string[];
  integrationPattern: string;
  privacyBoundary: string;
  notes: string[];
};

export type ProductRiskFlag =
  | 'battery'
  | 'hazmat'
  | 'medicine'
  | 'cosmetics'
  | 'food'
  | 'plant-animal'
  | 'controlled-dual-use'
  | 'high-value'
  | 'age-restricted';

export type CrossBorderOperationMode =
  | 'mode-0-local-only'
  | 'mode-1-server-registry'
  | 'mode-2-zk-only'
  | 'mode-3-ethereum-registry-only'
  | 'mode-4-full-zk-ethereum';

export type CrossBorderAuxiliaryContextInput = {
  useCase: CrossBorderUseCase;
  originCountry: string;
  destinationCountry: string;
  product?: {
    hsCode?: string;
    barcode?: string;
    category?: string;
    declaredValue?: number;
    currency?: string;
    riskFlags?: ProductRiskFlag[];
  };
  address?: {
    hasRecipientAddress?: boolean;
    hasPostalCode?: boolean;
    hasAgid?: boolean;
    hasAoidCredential?: boolean;
  };
  party?: {
    hasBusinessVatNumber?: boolean;
    hasImporterName?: boolean;
    hasExporterName?: boolean;
  };
  mode?: CrossBorderOperationMode;
  dataPolicy?: CrossBorderDataPolicy;
};

export type CrossBorderAuxiliaryDecision = {
  version: typeof CROSS_BORDER_AUXILIARY_DATA_VERSION;
  useCase: CrossBorderUseCase;
  corridor: {
    originCountry: string;
    destinationCountry: string;
    crossBorder: boolean;
    involvesEu: boolean;
    involvesUnitedKingdom: boolean;
    involvesUnitedStates: boolean;
    involvesJapan: boolean;
  };
  status: 'ready-for-estimate' | 'needs-manual-review' | 'insufficient-data';
  confidence: 'high' | 'medium' | 'low';
  requiredDomains: CrossBorderDomain[];
  recommendedSourceIds: CrossBorderSourceId[];
  manualReviewReasons: string[];
  warnings: string[];
  modeRecommendation: CrossBorderOperationMode;
  dataPolicy: CrossBorderDataPolicy;
  excludedSourceIds: CrossBorderSourceId[];
  cachePolicy: string;
  privacyBoundary: string;
};

export type CrossBorderAuxiliaryDataLayer = {
  version: typeof CROSS_BORDER_AUXILIARY_DATA_VERSION;
  rule: string;
  sources: CrossBorderAuxiliarySource[];
};

const EU_COUNTRIES = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
]);

const RESTRICTED_RISK_FLAGS: ProductRiskFlag[] = [
  'battery',
  'hazmat',
  'medicine',
  'cosmetics',
  'food',
  'plant-animal',
  'controlled-dual-use',
  'age-restricted',
];

function normalizeCountryCode(countryCode: string) {
  return countryCode.trim().toUpperCase();
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function hasAnyRiskFlag(riskFlags: ProductRiskFlag[] | undefined, candidates: ProductRiskFlag[]) {
  return Boolean(riskFlags?.some((flag) => candidates.includes(flag)));
}

function getSource(id: CrossBorderSourceId) {
  const source = CROSS_BORDER_AUXILIARY_SOURCES.find((candidate) => candidate.id === id);
  if (!source) {
    throw new Error(`Unknown cross-border auxiliary source: ${id}`);
  }
  return source;
}

export function isFullyFreeCrossBorderSource(source: CrossBorderAuxiliarySource): boolean {
  return (
    source.freeAccess === 'yes'
    && !source.requiresKey
    && (
      source.phase === 'adopt-now-static'
      || source.phase === 'self-host-or-cache'
      || source.phase === 'operator-import-only'
    )
    && (!source.liveApi || source.selfHostable || source.phase === 'operator-import-only')
  );
}

export const CROSS_BORDER_AUXILIARY_SOURCES: CrossBorderAuxiliarySource[] = [
  {
    id: 'gs1-digital-link-standard',
    label: 'GS1 Digital Link URI syntax',
    provider: 'GS1',
    domains: ['product-barcode', 'semantic-standard'],
    phase: 'adopt-now-static',
    official: true,
    openSource: false,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: false,
    sourceUrl: 'https://ref.gs1.org/standards/digital-link/uri-syntax/',
    useFor: [
      'parse GS1 Digital Link QR/NFC payloads',
      'extract GTIN, SSCC, lot, serial, expiry, and GLN keys',
      'link product or logistics identifiers to POS handoff records',
    ],
    doNotUseFor: [
      'issuing official GS1 identifiers',
      'product master-data verification without an authorized data source',
    ],
    integrationPattern: 'Implement a local parser and validator for the URI syntax; keep network resolution disabled by default.',
    privacyBoundary: 'Read identifiers from scanned payloads locally; do not send buyer, address, AGID, or AOID data to GS1 services.',
    notes: [
      'This is a standard-compatibility layer, not a dependency on GS1 SaaS.',
      'Use authorized GS1 identifiers when present, but do not mint them from AGID.',
    ],
  },
  {
    id: 'gs1-epcis-standard',
    label: 'GS1 EPCIS 2.0 event model',
    provider: 'GS1',
    domains: ['semantic-standard', 'route-risk', 'carrier-availability'],
    phase: 'adopt-now-static',
    official: true,
    openSource: false,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: false,
    sourceUrl: 'https://ref.gs1.org/standards/epcis/',
    useFor: [
      'model local shipping, carrier scan, recipient proof, and handoff-complete events',
      'export audit events in an EPCIS-compatible shape',
      'separate event semantics from private AGID/AOID payloads',
    ],
    doNotUseFor: [
      'public traceability publication by default',
      'storing raw recipient address or AOID inside EPCIS events',
    ],
    integrationPattern: 'Store local event records and expose an EPCIS-compatible export adapter; no external EPCIS server is required.',
    privacyBoundary: 'Use commitments or short-lived references in events; private address data stays local or encrypted.',
    notes: [
      'Good fit for POS audit trails because the event vocabulary is mature.',
      'Keep export optional so high-risk flows can avoid persistent trace history.',
    ],
  },
  {
    id: 'upu-s10-standard',
    label: 'UPU S10 postal item identifier',
    provider: 'Universal Postal Union',
    domains: ['postal-standard', 'semantic-standard'],
    phase: 'adopt-now-static',
    official: true,
    openSource: false,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: false,
    sourceUrl: 'https://www.upu.int/UPU/media/upu/files/postalSolutions/programmesAndServices/standards/S10-12.pdf',
    useFor: [
      'validate international postal item identifier format and check digit',
      'recognize UPU-style tracking numbers in POS scans',
      'link carrier tracking alias to local waybill records',
    ],
    doNotUseFor: [
      'issuing postal item identifiers without postal authority allocation',
      'claiming carrier acceptance from syntax alone',
    ],
    integrationPattern: 'Implement local syntax and check-digit validation; store only the carrier alias or commitment when privacy mode is active.',
    privacyBoundary: 'The tracking identifier can be sensitive; avoid public logs and keep domain-separated receipts.',
    notes: [
      'This is safe as a local validator because no external service call is needed.',
      'Carrier status still requires carrier-side evidence or manual scan receipt.',
    ],
  },
  {
    id: 'libpostal-self-host',
    label: 'libpostal local parser',
    provider: 'Openvenues / libpostal project',
    domains: ['address-validation', 'geocoding'],
    phase: 'self-host-or-cache',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://github.com/openvenues/libpostal',
    useFor: [
      'local address parsing and normalization',
      'multilingual component extraction before geocoder lookup',
      'operator-visible address repair hints',
    ],
    doNotUseFor: [
      'postal deliverability guarantee by itself',
      'browser-side dependency on large model files',
    ],
    integrationPattern: 'Run as a local/native service or server-side worker; cache normalized components and never call a hosted parser.',
    privacyBoundary: 'Raw address text is parsed inside the deployment boundary and is not sent to third-party APIs.',
    notes: [
      'Critical for fully free address quality because it avoids commercial parser APIs.',
    ],
  },
  {
    id: 'pelias-self-host',
    label: 'Pelias self-host geocoder',
    provider: 'Pelias project',
    domains: ['address-validation', 'geocoding'],
    phase: 'self-host-or-cache',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://github.com/pelias/pelias',
    useFor: [
      'self-hosted address search and autocomplete',
      'OpenAddresses/OSM-backed geocoding',
      'country and language aware address candidate generation',
    ],
    doNotUseFor: [
      'outsourcing private address queries to a hosted provider',
      'official postal validation without source evidence',
    ],
    integrationPattern: 'Deploy Pelias with local OpenAddresses, OSM, and optional public-domain gazetteers; query it through an internal adapter.',
    privacyBoundary: 'Queries remain inside the self-hosted deployment or local network.',
    notes: [
      'This is the strongest fully free replacement for paid geocoding APIs.',
    ],
  },
  {
    id: 'openaddresses-dataset',
    label: 'OpenAddresses data bundles',
    provider: 'OpenAddresses community and source providers',
    domains: ['address-validation', 'geocoding'],
    phase: 'adopt-now-static',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://openaddresses.io/',
    useFor: [
      'offline address-point evidence where available',
      'Pelias import source',
      'address-display quality scoring by country and region',
    ],
    doNotUseFor: [
      'assuming global coverage',
      'ignoring per-source attribution or license metadata',
    ],
    integrationPattern: 'Download source bundles into versioned local data packs with attribution, checksum, and coverage metadata.',
    privacyBoundary: 'Lookup is local; no customer address needs to leave the system.',
    notes: [
      'Coverage is uneven, so combine with OSM, postal patterns, and local correction feedback.',
    ],
  },
  {
    id: 'datasets-harmonized-system',
    label: 'datasets/harmonized-system',
    provider: 'Open Knowledge Foundation / UN Comtrade-derived dataset',
    domains: ['hs-code'],
    phase: 'adopt-now-static',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://github.com/datasets/harmonized-system',
    useFor: [
      'offline HS heading lookup',
      'shopping-agent category hints',
      'POS declaration prefill',
    ],
    doNotUseFor: [
      'final legal customs classification',
      'country-specific duty calculation without official tariff data',
    ],
    integrationPattern: 'Bundle as a versioned static lookup table with checksum and source-date metadata.',
    privacyBoundary: 'No customer address, AGID, AOID, or shipment identifier is sent to the source.',
    notes: [
      'Good low-latency first layer for product classification assistance.',
      'Output must remain advisory because HS classification can require legal or carrier review.',
    ],
  },
  {
    id: 'wto-tariff-data',
    label: 'WTO Tariff and Trade Data',
    provider: 'World Trade Organization',
    domains: ['tariff', 'trade-statistics'],
    phase: 'adopt-now-static',
    official: true,
    openSource: false,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://ttd.wto.org/en',
    useFor: [
      'official tariff evidence snapshots',
      'country/product tariff reference packs',
      'offline corridor evidence',
    ],
    doNotUseFor: [
      'real-time landed-cost guarantee',
      'raw address or AOID storage',
    ],
    integrationPattern: 'Mirror selected official snapshots server-side; retain reporter, year, source URL, and retrieval date.',
    privacyBoundary: 'Use aggregated public trade data only; never submit customer-level shipment details.',
    notes: [
      'Useful as a provenance-rich evidence source for tariff reasoning.',
      'Not a replacement for customs broker or carrier acceptance rules.',
    ],
  },
  {
    id: 'world-bank-wits',
    label: 'World Bank WITS API',
    provider: 'World Bank',
    domains: ['tariff', 'trade-statistics'],
    phase: 'optional-reference',
    official: true,
    openSource: false,
    liveApi: true,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://wits.worldbank.org/witsapiintro.aspx?lang=en',
    useFor: [
      'tariff/trade metadata refresh',
      'country/product data availability checks',
      'batch enrichment of cached evidence',
    ],
    doNotUseFor: [
      'blocking a POS checkout when the API is unavailable',
      'browser-side per-scan calls with customer details',
    ],
    integrationPattern: 'Do not use in the default fully-free path; allow operator-imported snapshots only after terms are reviewed.',
    privacyBoundary: 'Only generic country/product parameters should leave the system.',
    notes: [
      'Good API layer for cached enrichment.',
      'Treat values as evidence, not as the sole compliance decision.',
    ],
  },
  {
    id: 'un-comtrade-api',
    label: 'UN Comtrade API',
    provider: 'United Nations',
    domains: ['trade-statistics', 'hs-code'],
    phase: 'adopt-after-key-or-terms-review',
    official: true,
    openSource: false,
    liveApi: true,
    freeAccess: 'limited',
    requiresKey: true,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://comtrade.un.org/',
    useFor: [
      'HS-code trade-flow analytics',
      'route and market context for shopping agents',
      'batch analytics, not scan-time clearance',
    ],
    doNotUseFor: [
      'tariff rate calculation',
      'private recipient lookup',
      'high-volume live POS dependency before quota review',
    ],
    integrationPattern: 'Use a backend connector with quota controls, API-token support, and coarse cache windows.',
    privacyBoundary: 'Use product/country aggregates only; do not send address, AGID, AOID, or buyer identity.',
    notes: [
      'Valuable for analytics and product context.',
      'Not necessary for the low-latency POS critical path.',
    ],
  },
  {
    id: 'frankfurter-self-host',
    label: 'Frankfurter self-host / local FX cache',
    provider: 'Frankfurter open-source project / reference-rate data import',
    domains: ['currency'],
    phase: 'self-host-or-cache',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://frankfurter.dev/',
    useFor: [
      'fully-free POS currency display',
      'local landed-cost estimate conversion',
      'offline shopping-agent price normalization after rate import',
    ],
    doNotUseFor: [
      'final payment settlement rate',
      'tax filing exchange rate without jurisdiction review',
    ],
    integrationPattern: 'Run Frankfurter-compatible code locally or import reference-rate snapshots into an internal FX table; no public API is called at scan time.',
    privacyBoundary: 'Currency conversion uses only currency pair/date; no shipment or address data leaves the deployment.',
    notes: [
      'This replaces a public free API dependency with a fully free self-host/local-cache path.',
    ],
  },
  {
    id: 'frankfurter-api',
    label: 'Frankfurter API',
    provider: 'Frankfurter',
    domains: ['currency'],
    phase: 'optional-reference',
    official: false,
    openSource: true,
    liveApi: true,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://frankfurter.dev/',
    useFor: [
      'POS currency display',
      'shopping-agent price normalization',
      'landed-cost estimate conversion',
    ],
    doNotUseFor: [
      'final payment settlement rate',
      'tax filing exchange rate without jurisdiction review',
    ],
    integrationPattern: 'Keep only as an optional public endpoint for development; production should use frankfurter-self-host.',
    privacyBoundary: 'Send only currency pair/date; no shipment or address data.',
    notes: [
      'Best first FX source because it is open-source, keyless, and cache-friendly.',
      'Rates are reference rates; payment processors may differ.',
    ],
  },
  {
    id: 'ecb-data-api',
    label: 'ECB Data API',
    provider: 'European Central Bank',
    domains: ['currency'],
    phase: 'optional-reference',
    official: true,
    openSource: false,
    liveApi: true,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://data.ecb.europa.eu/help/api/data',
    useFor: [
      'official euro-area reference-rate evidence',
      'audit trail for EU-facing calculations',
    ],
    doNotUseFor: [
      'non-EUR complete global FX coverage',
    ],
    integrationPattern: 'Use as an optional official reference connector behind the same FX adapter.',
    privacyBoundary: 'No customer data required; query only reference series/date information.',
    notes: [
      'Useful when an EU official source is preferable to a broader open-source API.',
    ],
  },
  {
    id: 'uk-trade-tariff-api',
    label: 'GOV.UK Trade Tariff API',
    provider: 'HMRC / GOV.UK',
    domains: ['tariff', 'hs-code', 'customs-measures', 'vat-tax'],
    phase: 'adopt-now-api',
    official: true,
    openSource: false,
    liveApi: true,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://www.api.gov.uk/hmrc/gov-uk-trade-tariff-api/',
    useFor: [
      'GB/UK commodity-code lookup',
      'UK import/export measures',
      'UK duty and VAT evidence for estimates',
    ],
    doNotUseFor: [
      'non-UK customs decisions',
      'carrier acceptance rules',
      'address or AOID submission',
    ],
    integrationPattern: 'Use backend cache keyed by commodity code, direction, country, and measure date.',
    privacyBoundary: 'Submit commodity/country/date only; never submit recipient or AOID data.',
    notes: [
      'Strong official API for UK corridors.',
      'Still needs manual review for restricted goods and uncertain product classification.',
    ],
  },
  {
    id: 'usitc-hts-rest-api',
    label: 'USITC HTS Search / REST service',
    provider: 'United States International Trade Commission',
    domains: ['tariff', 'hs-code', 'customs-measures'],
    phase: 'adopt-now-api',
    official: true,
    openSource: false,
    liveApi: true,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://hts.usitc.gov/',
    useFor: [
      'US HTS lookup',
      'US import tariff evidence',
      'US-bound landed-cost estimate support',
    ],
    doNotUseFor: [
      'export-control screening',
      'carrier prohibited-item decision',
      'raw private shipment storage',
    ],
    integrationPattern: 'Use backend adapter and cache HTS lookups by code, revision, and retrieval date.',
    privacyBoundary: 'Submit product code/search terms only; avoid customer-level identifiers.',
    notes: [
      'Useful for US-bound flows.',
      'Does not replace CBP, broker, carrier, or export-control review.',
    ],
  },
  {
    id: 'eu-taric',
    label: 'EU TARIC',
    provider: 'European Commission',
    domains: ['tariff', 'hs-code', 'customs-measures'],
    phase: 'adopt-now-static',
    official: true,
    openSource: false,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://taxation-customs.ec.europa.eu/customs/common-customs-tariff-cct/tariff-classification-goods/eu-customs-tariff-taric_en',
    useFor: [
      'EU customs tariff and measure evidence',
      'EU commodity-code reference snapshots',
    ],
    doNotUseFor: [
      'member-state domestic VAT finalization',
      'recipient identity or address processing',
    ],
    integrationPattern: 'Use official TARIC reference downloads or links as versioned evidence; keep retrieval date and measure validity.',
    privacyBoundary: 'Use only public commodity/measure data.',
    notes: [
      'Good EU evidence layer for import/export measures.',
      'Member-state VAT and local rules still need separate handling.',
    ],
  },
  {
    id: 'ec-vies',
    label: 'VIES VAT number validation',
    provider: 'European Commission',
    domains: ['vat-tax', 'business-identity'],
    phase: 'adopt-after-key-or-terms-review',
    official: true,
    openSource: false,
    liveApi: true,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: false,
    cacheRecommended: false,
    sourceUrl: 'https://ec.europa.eu/taxation_customs/vies/',
    useFor: [
      'EU VAT number validation',
      'B2B checkout confidence signal',
    ],
    doNotUseFor: [
      'personal identity proof',
      'address verification',
      'automatic fraud denial without operator review',
    ],
    integrationPattern: 'Call server-side only when a VAT number is provided; store minimal result and timestamp.',
    privacyBoundary: 'Submit VAT number only when necessary; do not attach full AOID/address payloads.',
    notes: [
      'Useful for B2B flows.',
      'Availability and national registry responses can vary, so keep retry and manual review states.',
    ],
  },
  {
    id: 'ec-vat-rates',
    label: 'European Commission VAT rates',
    provider: 'European Commission',
    domains: ['vat-tax'],
    phase: 'adopt-now-static',
    official: true,
    openSource: false,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/vat-rates_en',
    useFor: [
      'EU VAT rate reference',
      'shopping-agent estimate explanation',
    ],
    doNotUseFor: [
      'final invoice tax calculation without seller/jurisdiction rules',
    ],
    integrationPattern: 'Cache official rate tables or references by country, category, and effective date.',
    privacyBoundary: 'Use public tax tables only.',
    notes: [
      'Good explanatory reference for EU-facing tax estimates.',
    ],
  },
  {
    id: 'vatnode-eu-vat-rates-data',
    label: 'vatnode/eu-vat-rates-data',
    provider: 'vatnode community',
    domains: ['vat-tax'],
    phase: 'adopt-now-static',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://github.com/vatnode/eu-vat-rates-data',
    useFor: [
      'versioned EU and nearby European VAT-rate evidence',
      'offline POS tax estimate support',
      'shopping-agent landed-cost estimate hints',
    ],
    doNotUseFor: [
      'final legal invoice tax without seller nexus and product classification review',
      'automatic VAT exemption decision',
      'raw address, AGID, AOID, or recipient submission',
    ],
    integrationPattern: 'Import as a static evidence pack with commit hash, retrieval date, country, rate type, and category metadata.',
    privacyBoundary: 'Use only country, category, value, and currency. Private address identifiers stay outside the tax data source.',
    notes: [
      'Good OSS default for a fully-free EU VAT estimate path.',
      'Keep official EC VAT references beside it for audit context.',
    ],
  },
  {
    id: 'node-sales-tax',
    label: 'node-sales-tax / sales-tax',
    provider: 'node-sales-tax community',
    domains: ['vat-tax'],
    phase: 'self-host-or-cache',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
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
    integrationPattern: 'Keep behind a local adapter; disable optional online VAT checks by default and prefer source-versioned evidence.',
    privacyBoundary: 'Run locally with product/country inputs only; do not send buyer address, AGID, AOID, or recipient identity.',
    notes: [
      'Useful as an OSS calculation adapter, but rate freshness still needs source audit.',
    ],
  },
  {
    id: 'open-sales-tax',
    label: 'open-sales-tax',
    provider: 'open-sales-tax community',
    domains: ['vat-tax'],
    phase: 'self-host-or-cache',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://github.com/ejosterberg/open-sales-tax',
    useFor: [
      'US sales-tax estimate research',
      'self-hosted US jurisdiction and rate pipeline experiments',
      'manual-review hints for US-bound or US-domestic POS flows',
    ],
    doNotUseFor: [
      'complete US sales-tax compliance guarantee',
      'ZIP-only tax finalization',
      'replacement for official state/local tax authority checks',
    ],
    integrationPattern: 'Use as an optional self-hosted adapter with dataset date, boundary version, and confidence metadata.',
    privacyBoundary: 'Use coarse destination jurisdiction or local address evidence; do not submit raw AOID or recipient data.',
    notes: [
      'US sales tax is boundary-heavy, so output should remain estimate/manual-review unless strong jurisdiction evidence exists.',
    ],
  },
  {
    id: 'commerceguys-tax',
    label: 'commerceguys/tax',
    provider: 'Commerce Guys community',
    domains: ['vat-tax'],
    phase: 'optional-reference',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://github.com/commerceguys/tax',
    useFor: [
      'cross-language tax model reference',
      'invoice-tax rule design comparison',
      'adapter contract design',
    ],
    doNotUseFor: [
      'direct TypeScript runtime dependency without adapter tests',
      'final AGID POS tax engine by itself',
    ],
    integrationPattern: 'Use as design reference or optional service adapter; keep AGID runtime contracts source-agnostic.',
    privacyBoundary: 'Do not pass customer address or AOID outside the deployment boundary.',
    notes: [
      'Good modeling reference, but not part of the default critical path.',
    ],
  },
  {
    id: 'open-food-facts-api',
    label: 'Open Food Facts self-host/data export',
    provider: 'Open Food Facts',
    domains: ['product-barcode', 'restriction-screening'],
    phase: 'self-host-or-cache',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://openfoodfacts.github.io/openfoodfacts-server/api/',
    useFor: [
      'barcode product facts',
      'food/allergen/category hints',
      'shopping-agent product enrichment',
    ],
    doNotUseFor: [
      'customs clearance',
      'universal barcode product database',
      'carrier restricted-goods final decision',
    ],
    integrationPattern: 'Use local data export or self-hosted Open Food Facts server; lookup by barcode with cache and source freshness.',
    privacyBoundary: 'Submit barcode only; do not include buyer, address, AGID, or AOID data.',
    notes: [
      'Useful when the product is food or packaged consumer goods.',
      'Coverage is community-driven and should not be treated as complete.',
    ],
  },
  {
    id: 'osm-nominatim-self-host',
    label: 'Nominatim / OpenStreetMap geocoding',
    provider: 'OpenStreetMap community',
    domains: ['address-validation', 'geocoding'],
    phase: 'self-host-or-cache',
    official: false,
    openSource: true,
    liveApi: true,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://nominatim.org/release-docs/latest/api/Overview/',
    useFor: [
      'address candidate generation',
      'reverse-geocode display improvement',
      'AGID/AOID address context',
    ],
    doNotUseFor: [
      'high-volume production calls to the public OSM endpoint',
      'official postal validation by itself',
    ],
    integrationPattern: 'Self-host or use a server-side cache/proxy with rate limits and attribution.',
    privacyBoundary: 'Minimize raw address retention; prefer coordinate/cell cache and avoid AOID submission.',
    notes: [
      'Excellent open address/geocoding base, but public endpoint usage policies make self-hosting/caching important.',
    ],
  },
  {
    id: 'overpass-api',
    label: 'Overpass API',
    provider: 'OpenStreetMap community',
    domains: ['geocoding', 'route-risk', 'carrier-availability'],
    phase: 'self-host-or-cache',
    official: false,
    openSource: true,
    liveApi: true,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://dev.overpass-api.de/overpass-doc/en/',
    useFor: [
      'nearby pickup point and POI evidence',
      'road/water/bridge/natural-feature context',
      'manual route-risk investigation',
    ],
    doNotUseFor: [
      'per-scan public endpoint dependency',
      'customs or legal import decision',
    ],
    integrationPattern: 'Use for cached OSM feature enrichment; batch and bound queries by AGID cell or bounding box.',
    privacyBoundary: 'Query coarse cells/bounding boxes when possible; do not submit personal identifiers.',
    notes: [
      'Good companion to AGID natural-feature and address-display improvements.',
    ],
  },
  {
    id: 'upu-s42-addressing',
    label: 'UPU S42 addressing standard',
    provider: 'Universal Postal Union',
    domains: ['postal-standard', 'address-validation', 'semantic-standard'],
    phase: 'optional-reference',
    official: true,
    openSource: false,
    liveApi: false,
    freeAccess: 'terms-review',
    requiresKey: false,
    selfHostable: false,
    cacheRecommended: false,
    sourceUrl: 'https://www.upu.int/en/postal-solutions/programmes-services/addressing-solutions',
    useFor: [
      'address-component schema design',
      'country-specific rendering vocabulary',
      'postal-quality model alignment',
    ],
    doNotUseFor: [
      'live validation without a licensed/available dataset',
      'AGID or AOID disclosure',
    ],
    integrationPattern: 'Use as a standard reference for schema and documentation; review access terms before bundling datasets.',
    privacyBoundary: 'No live personal data submission is needed for the schema reference.',
    notes: [
      'Important for professional postal interoperability, but not a free universal address-validation API.',
    ],
  },
  {
    id: 'usps-addresses-api',
    label: 'USPS Addresses API',
    provider: 'United States Postal Service',
    domains: ['address-validation', 'postal-standard'],
    phase: 'adopt-after-key-or-terms-review',
    official: true,
    openSource: false,
    liveApi: true,
    freeAccess: 'registration',
    requiresKey: true,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://developers.usps.com/apis',
    useFor: [
      'US address standardization',
      'US ZIP/address quality checks',
    ],
    doNotUseFor: [
      'non-US addresses',
      'unregistered production use',
      'AOID history storage',
    ],
    integrationPattern: 'Use only behind a server connector after USPS developer account, quotas, and terms are documented.',
    privacyBoundary: 'Submit only the address fields necessary for validation and avoid persistent raw-address logs.',
    notes: [
      'Useful for US domestic quality, but it is not a keyless open-source dependency.',
    ],
  },
  {
    id: 'japan-post-postal-csv-posuto',
    label: 'Japan Post postal-code CSV via posuto',
    provider: 'Japan Post data / posuto OSS wrapper',
    domains: ['address-validation', 'postal-standard'],
    phase: 'adopt-now-static',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: true,
    sourceUrl: 'https://github.com/polm/posuto',
    useFor: [
      'Japan postal-code to address assist',
      'offline Japanese address rendering support',
      'JP origin/destination prefill',
    ],
    doNotUseFor: [
      'final delivery guarantee',
      'building/unit-level verification',
    ],
    integrationPattern: 'Bundle static postal-code data with update scripts and source-date metadata.',
    privacyBoundary: 'No private address needs to leave the device for postal-code lookup.',
    notes: [
      'Practical low-cost improvement for Japanese POS and shipping flows.',
    ],
  },
  {
    id: 'un-cefact-ccl',
    label: 'UN/CEFACT Core Components Library',
    provider: 'UNECE / UN/CEFACT',
    domains: ['semantic-standard'],
    phase: 'optional-reference',
    official: true,
    openSource: false,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: false,
    cacheRecommended: false,
    sourceUrl: 'https://unece.org/trade/uncefact/unccl',
    useFor: [
      'Buy-Ship-Pay semantic alignment',
      'invoice/shipping/customs schema vocabulary',
      'shopping-agent interoperability documentation',
    ],
    doNotUseFor: [
      'live compliance lookup',
      'address verification',
    ],
    integrationPattern: 'Use as a schema reference for exported JSON/API contracts and paper documentation.',
    privacyBoundary: 'Schema-only source; no runtime customer data required.',
    notes: [
      'Useful to keep AGID/AOID shipment records compatible with trade-document semantics.',
    ],
  },
  {
    id: 'barcodeapi-server',
    label: 'BarcodeAPI server',
    provider: 'BarcodeAPI.org',
    domains: ['product-barcode'],
    phase: 'optional-reference',
    official: false,
    openSource: true,
    liveApi: false,
    freeAccess: 'yes',
    requiresKey: false,
    selfHostable: true,
    cacheRecommended: false,
    sourceUrl: 'https://github.com/BarcodeAPI/server',
    useFor: [
      'self-hosted barcode image generation',
      'POS label or receipt QR/barcode utilities',
    ],
    doNotUseFor: [
      'product identity lookup',
      'customs or tariff classification',
    ],
    integrationPattern: 'Keep as an optional self-hosted utility for rendering, not product intelligence.',
    privacyBoundary: 'Do not encode private address or AOID values into printed barcodes unless purpose and expiry are explicit.',
    notes: [
      'This solves barcode rendering, not barcode data authority.',
    ],
  },
  {
    id: 'gs1-verified-by-gs1',
    label: 'Verified by GS1',
    provider: 'GS1',
    domains: ['product-barcode', 'business-identity'],
    phase: 'adopt-after-key-or-terms-review',
    official: true,
    openSource: false,
    liveApi: true,
    freeAccess: 'terms-review',
    requiresKey: true,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://www.gs1.org/services/verified-by-gs1',
    useFor: [
      'GTIN/licensee confidence signal after access terms are approved',
      'manual review support for high-value retail goods',
    ],
    doNotUseFor: [
      'default free/open POS dependency',
      'address verification',
      'customs clearance by itself',
    ],
    integrationPattern: 'Keep behind an optional provider adapter; enable only for deployments with GS1 access.',
    privacyBoundary: 'Submit GTIN/license identifiers only; do not attach buyer address or AOID.',
    notes: [
      'Potentially valuable, but not a no-registration open source layer.',
    ],
  },
  {
    id: 'what3words-api',
    label: 'what3words API',
    provider: 'what3words',
    domains: ['geocoding'],
    phase: 'avoid-as-primary',
    official: false,
    openSource: false,
    liveApi: true,
    freeAccess: 'registration',
    requiresKey: true,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://developer.what3words.com/public-api/docs',
    useFor: [
      'optional import of a user-provided what3words address',
    ],
    doNotUseFor: [
      'core AGID encoding',
      'open-source-only deployments',
      'primary address or delivery validation',
    ],
    integrationPattern: 'Treat as an optional adapter only; never make it required for AGID/AOID operation.',
    privacyBoundary: 'Avoid submitting sensitive AGID/AOID context to proprietary geocoding providers.',
    notes: [
      'Proprietary and key-based, so it should not be a default dependency.',
    ],
  },
  {
    id: 'opencorporates-api',
    label: 'OpenCorporates API',
    provider: 'OpenCorporates',
    domains: ['business-identity'],
    phase: 'adopt-after-key-or-terms-review',
    official: false,
    openSource: false,
    liveApi: true,
    freeAccess: 'limited',
    requiresKey: true,
    selfHostable: false,
    cacheRecommended: true,
    sourceUrl: 'https://api.opencorporates.com/documentation/API-Reference',
    useFor: [
      'importer/exporter organization enrichment',
      'manual review evidence for business shipments',
    ],
    doNotUseFor: [
      'automatic denial',
      'personal identity proof',
      'high-volume default POS flow',
    ],
    integrationPattern: 'Optional server-side enrichment connector with rate limits and human-review output.',
    privacyBoundary: 'Submit organization identifiers only; do not attach private address payloads.',
    notes: [
      'Useful for B2B review, but not a free core path.',
    ],
  },
];

export function getCrossBorderAuxiliaryDataLayer(): CrossBorderAuxiliaryDataLayer {
  return {
    version: CROSS_BORDER_AUXILIARY_DATA_VERSION,
    rule: 'Use fully free local, self-hosted, static, or operator-imported sources as cached decision support; never depend on free-tier SaaS/API quotas, and never auto-clear legal customs, carrier restrictions, or private address disclosure from auxiliary data alone.',
    sources: CROSS_BORDER_AUXILIARY_SOURCES,
  };
}

export function getCrossBorderAuxiliarySourcesByDomain(domain: CrossBorderDomain): CrossBorderAuxiliarySource[] {
  return CROSS_BORDER_AUXILIARY_SOURCES.filter((source) => source.domains.includes(domain));
}

export function getCrossBorderAuxiliarySourcesByPhase(phase: CrossBorderAdoptionPhase): CrossBorderAuxiliarySource[] {
  return CROSS_BORDER_AUXILIARY_SOURCES.filter((source) => source.phase === phase);
}

export function getRecommendedFreeCrossBorderSources(): CrossBorderAuxiliarySource[] {
  return getRecommendedFullyFreeCrossBorderSources();
}

export function getRecommendedFullyFreeCrossBorderSources(): CrossBorderAuxiliarySource[] {
  return CROSS_BORDER_AUXILIARY_SOURCES.filter((source) => (
    isFullyFreeCrossBorderSource(source)
  ));
}

export function buildCrossBorderAuxiliaryContext(
  input: CrossBorderAuxiliaryContextInput,
): CrossBorderAuxiliaryDecision {
  const originCountry = normalizeCountryCode(input.originCountry);
  const destinationCountry = normalizeCountryCode(input.destinationCountry);
  const product = input.product ?? {};
  const address = input.address ?? {};
  const party = input.party ?? {};
  const riskFlags = product.riskFlags ?? [];
  const involvesEu = EU_COUNTRIES.has(originCountry) || EU_COUNTRIES.has(destinationCountry);
  const involvesUnitedKingdom = ['GB', 'UK'].includes(originCountry) || ['GB', 'UK'].includes(destinationCountry);
  const involvesUnitedStates = originCountry === 'US' || destinationCountry === 'US';
  const involvesJapan = originCountry === 'JP' || destinationCountry === 'JP';
  const crossBorder = originCountry !== destinationCountry;
  const dataPolicy = input.dataPolicy ?? 'fully-free-local-first';

  const requiredDomains: CrossBorderDomain[] = [
    'address-validation',
    'postal-standard',
    'hs-code',
    'tariff',
    'customs-measures',
    'currency',
    'semantic-standard',
  ];
  const recommendedSourceIds: CrossBorderSourceId[] = [
    'gs1-digital-link-standard',
    'gs1-epcis-standard',
    'upu-s10-standard',
    'libpostal-self-host',
    'pelias-self-host',
    'openaddresses-dataset',
    'datasets-harmonized-system',
    'wto-tariff-data',
    'frankfurter-self-host',
    'osm-nominatim-self-host',
    'un-cefact-ccl',
  ];
  const manualReviewReasons: string[] = [];
  const warnings: string[] = [
    'auxiliary-data-is-not-a-customs-clearance-decision',
    'do-not-send-raw-address-agid-or-aoid-to-third-party-data-sources',
  ];

  if (!crossBorder) {
    warnings.push('same-country-flow-can-use-domestic-address-validation-before-cross-border-compliance');
  }
  if (input.useCase === 'shopping-agent' || product.barcode) {
    requiredDomains.push('product-barcode');
    recommendedSourceIds.push('open-food-facts-api');
  }
  if (input.useCase === 'pos-checkout') {
    recommendedSourceIds.push('barcodeapi-server');
  }
  if (input.useCase === 'pos-checkout' || input.useCase === 'shopping-agent' || crossBorder) {
    requiredDomains.push('vat-tax');
    recommendedSourceIds.push('node-sales-tax');
  }
  if (involvesUnitedKingdom) {
    requiredDomains.push('vat-tax');
    recommendedSourceIds.push('uk-trade-tariff-api');
  }
  if (involvesUnitedStates) {
    recommendedSourceIds.push('usitc-hts-rest-api', 'open-sales-tax');
    if (address.hasRecipientAddress || address.hasPostalCode) {
      recommendedSourceIds.push('usps-addresses-api');
    }
  }
  if (involvesEu) {
    requiredDomains.push('vat-tax');
    recommendedSourceIds.push('eu-taric', 'ec-vat-rates', 'vatnode-eu-vat-rates-data');
    if (party.hasBusinessVatNumber) {
      recommendedSourceIds.push('ec-vies');
    }
  }
  if (involvesJapan) {
    recommendedSourceIds.push('japan-post-postal-csv-posuto');
  }
  if (party.hasImporterName || party.hasExporterName) {
    requiredDomains.push('business-identity');
    recommendedSourceIds.push('opencorporates-api');
  }
  if (address.hasAgid) {
    recommendedSourceIds.push('overpass-api');
  }

  if (!product.hsCode) {
    manualReviewReasons.push('hs-code-missing');
  }
  if (!product.category && !product.barcode && !product.hsCode) {
    manualReviewReasons.push('product-classification-evidence-missing');
  }
  if (typeof product.declaredValue !== 'number' || !Number.isFinite(product.declaredValue) || product.declaredValue <= 0) {
    manualReviewReasons.push('declared-value-missing-or-invalid');
  }
  if (!product.currency) {
    manualReviewReasons.push('currency-missing');
  }
  if (!address.hasRecipientAddress && !address.hasAgid && !address.hasAoidCredential) {
    manualReviewReasons.push('destination-address-or-private-address-proof-missing');
  }
  if (hasAnyRiskFlag(riskFlags, RESTRICTED_RISK_FLAGS)) {
    requiredDomains.push('restriction-screening');
    manualReviewReasons.push('restricted-or-sensitive-goods-manual-review');
  }
  if (riskFlags.includes('high-value')) {
    recommendedSourceIds.push('gs1-verified-by-gs1');
    manualReviewReasons.push('high-value-goods-identity-review');
  }
  if (riskFlags.includes('controlled-dual-use')) {
    manualReviewReasons.push('export-control-screening-required');
  }
  if (riskFlags.includes('food') && !product.barcode) {
    warnings.push('food-shipment-without-barcode-needs-extra-product-evidence');
  }

  const uniqueSourceIds = unique(recommendedSourceIds);
  const filteredSourceIds = dataPolicy === 'fully-free-local-first'
    ? uniqueSourceIds.filter((id) => isFullyFreeCrossBorderSource(getSource(id)))
    : uniqueSourceIds;
  const excludedSourceIds = dataPolicy === 'fully-free-local-first'
    ? uniqueSourceIds.filter((id) => !isFullyFreeCrossBorderSource(getSource(id)))
    : [];
  if (excludedSourceIds.length > 0) {
    warnings.push('free-tier-registration-or-public-live-api-sources-excluded-by-fully-free-policy');
  }
  const status: CrossBorderAuxiliaryDecision['status'] = manualReviewReasons.some((reason) => (
    reason === 'hs-code-missing'
    || reason === 'declared-value-missing-or-invalid'
    || reason === 'currency-missing'
    || reason === 'destination-address-or-private-address-proof-missing'
  ))
    ? 'insufficient-data'
    : manualReviewReasons.length > 0
      ? 'needs-manual-review'
      : 'ready-for-estimate';

  const confidence: CrossBorderAuxiliaryDecision['confidence'] = status === 'ready-for-estimate'
    ? 'high'
    : status === 'needs-manual-review'
      ? 'medium'
      : 'low';

  const modeRecommendation = input.mode ?? (status === 'ready-for-estimate'
    ? 'mode-1-server-registry'
    : 'mode-0-local-only');

  return {
    version: CROSS_BORDER_AUXILIARY_DATA_VERSION,
    useCase: input.useCase,
    corridor: {
      originCountry,
      destinationCountry,
      crossBorder,
      involvesEu,
      involvesUnitedKingdom,
      involvesUnitedStates,
      involvesJapan,
    },
    status,
    confidence,
    requiredDomains: unique(requiredDomains),
    recommendedSourceIds: filteredSourceIds,
    manualReviewReasons: unique(manualReviewReasons),
    warnings: unique(warnings),
    modeRecommendation,
    dataPolicy,
    excludedSourceIds,
    cachePolicy: 'cache static/official/self-hosted evidence by source version, checksum, country, commodity code, date, and provider; do not cache raw private addresses by default',
    privacyBoundary: 'The auxiliary layer may use country, commodity code, barcode, value, and currency locally; under the fully-free policy it must not submit raw address, AGID, AOID, recipient name, phone number, or shipment identifiers to third-party live APIs.',
  };
}

export function getCrossBorderAuxiliarySourcesForDecision(
  decision: CrossBorderAuxiliaryDecision,
): CrossBorderAuxiliarySource[] {
  return decision.recommendedSourceIds.map(getSource);
}
