export const ADOBE_SERVICE_INTEGRATION_MODEL_VERSION = 'adobe-service-integration-v1';

export type AdobeServiceFamily =
  | 'acrobat-services'
  | 'electronic-signature'
  | 'commerce'
  | 'content-management'
  | 'experience-platform'
  | 'creative-tools'
  | 'asset-library';

export type AdobeServiceId =
  | 'adobe-pdf-services-api'
  | 'adobe-pdf-extract-api'
  | 'adobe-pdf-embed-api'
  | 'acrobat-sign-api'
  | 'adobe-commerce-api'
  | 'adobe-experience-manager-api'
  | 'adobe-experience-platform-api'
  | 'adobe-express-embed-sdk'
  | 'creative-cloud-libraries-api';

export type AdobeIntegrationPurpose =
  | 'pdf-generate-shipping-label'
  | 'pdf-redact-address-evidence'
  | 'pdf-extract-address-import'
  | 'pdf-embed-redacted-viewer'
  | 'consent-envelope-signature'
  | 'delegated-pickup-signature'
  | 'commerce-checkout-address-element'
  | 'commerce-order-handoff'
  | 'commerce-return-label'
  | 'aem-address-document-portal'
  | 'aem-redacted-evidence-content'
  | 'experience-event-forwarding'
  | 'experience-audit-analytics'
  | 'express-label-design'
  | 'express-pos-notice-design'
  | 'creative-brand-assets';

export type AdobeConnectorCapability =
  | 'pdf-create'
  | 'pdf-export'
  | 'pdf-ocr'
  | 'pdf-extract'
  | 'pdf-viewer'
  | 'esignature'
  | 'webhook'
  | 'commerce-rest'
  | 'commerce-graphql'
  | 'checkout'
  | 'order-management'
  | 'content-fragment'
  | 'asset-management'
  | 'forms'
  | 'event-ingestion'
  | 'data-governance'
  | 'embedded-editor'
  | 'brand-assets';

export type AdobePayloadClass =
  | 'none'
  | 'event-metadata'
  | 'address-commitment'
  | 'commerce-order-alias'
  | 'redacted-address-summary'
  | 'redacted-pdf'
  | 'encrypted-evidence-envelope'
  | 'shipping-label-pdf'
  | 'pdf-document'
  | 'document-image-or-pdf'
  | 'signature-agreement'
  | 'creative-asset';

export type AdobePrivacyMode =
  | 'commitment-or-alias-only'
  | 'redacted-document-only'
  | 'encrypted-envelope-only'
  | 'ephemeral-document-processing-required'
  | 'signature-workflow-required'
  | 'client-viewer-only'
  | 'public-brand-asset-only';

export type AdobeRecommendedRuntime =
  | 'server-side'
  | 'server-side-or-worker'
  | 'browser-client-allowed'
  | 'dashboard-admin-only';

export type AdobeServiceProfile = {
  id: AdobeServiceId;
  label: string;
  family: AdobeServiceFamily;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  capabilities: AdobeConnectorCapability[];
  purposes: AdobeIntegrationPurpose[];
  defaultPrivacyMode: AdobePrivacyMode;
  recommendedRuntime: AdobeRecommendedRuntime;
  requiresAdobeDeveloperCredential: boolean;
  recommendedScopes: string[];
  docs: string[];
  recommendedUse: string[];
  caveats: string[];
};

export type AdobeIntegrationPlanInput = {
  serviceId: AdobeServiceId | string;
  purpose: AdobeIntegrationPurpose | string;
  payloadClass?: AdobePayloadClass | string;
  ownerConsent?: boolean;
  encryptedAtRest?: boolean;
  encryptedInTransit?: boolean;
  serverSideOnly?: boolean;
  highRiskMode?: boolean;
  requestedScopes?: unknown;
  redacted?: boolean;
};

export type AdobeIntegrationPlan = {
  modelVersion: string;
  service: AdobeServiceProfile | null;
  purpose: string;
  payloadClass: AdobePayloadClass;
  allowed: boolean;
  requiredEnvVars: string[];
  requiredControls: string[];
  recommendedScopes: string[];
  dataFlow: {
    sendsRawAddressDocumentToAdobe: boolean;
    sendsRawAddressTextToAdobe: boolean;
    storesRawAddressInAdobe: boolean;
    clientSecretAllowedInBrowser: false;
    serverSideOnlyRequired: boolean;
    highRiskModeCompatible: boolean;
  };
  errors: string[];
  warnings: string[];
};

const ADOBE_DOCS = {
  pdfServices: 'https://developer.adobe.com/document-services/docs/overview/pdf-services-api/',
  pdfServicesOverview: 'https://developer.adobe.com/document-services/docs/overview/',
  pdfExtract: 'https://developer.adobe.com/document-services/docs/overview/pdf-extract-api/',
  pdfEmbed: 'https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/',
  acrobatSign: 'https://opensource.adobe.com/acrobat-sign/developer_guide/index.html',
  commerceRest: 'https://developer.adobe.com/commerce/webapi/rest/',
  commerceWebApi: 'https://developer.adobe.com/commerce/webapi/',
  aemApis: 'https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/aem-apis/overview',
  aemDeveloperApis: 'https://developer.adobe.com/experience-cloud/experience-manager-apis/',
  experiencePlatform: 'https://developer.adobe.com/experience-platform-apis/',
  expressEmbed: 'https://developer.adobe.com/express/embed-sdk/docs/v4/',
  creativeLibraries: 'https://developer.adobe.com/creative-cloud-libraries/',
};

const ADOBE_SERVICE_PROFILES: AdobeServiceProfile[] = [
  {
    id: 'adobe-pdf-services-api',
    label: 'Adobe PDF Services API',
    family: 'acrobat-services',
    requiredEnvVars: ['ADOBE_PDF_SERVICES_CLIENT_ID'],
    optionalEnvVars: ['ADOBE_PDF_SERVICES_CLIENT_SECRET', 'ADOBE_PDF_SERVICES_ORGANIZATION_ID'],
    capabilities: ['pdf-create', 'pdf-export', 'pdf-ocr'],
    purposes: ['pdf-generate-shipping-label', 'pdf-redact-address-evidence'],
    defaultPrivacyMode: 'redacted-document-only',
    recommendedRuntime: 'server-side',
    requiresAdobeDeveloperCredential: true,
    recommendedScopes: [],
    docs: [ADOBE_DOCS.pdfServices, ADOBE_DOCS.pdfServicesOverview],
    recommendedUse: [
      'generate shipping-label PDFs from redacted or alias-based label data',
      'produce redacted evidence PDFs for review and audit workflows',
    ],
    caveats: [
      'Do not send unredacted AOID bodies or recipient proof codes.',
      'Prefer local PDF generation when high-risk mode is enabled.',
    ],
  },
  {
    id: 'adobe-pdf-extract-api',
    label: 'Adobe PDF Extract API',
    family: 'acrobat-services',
    requiredEnvVars: ['ADOBE_PDF_SERVICES_CLIENT_ID'],
    optionalEnvVars: ['ADOBE_PDF_SERVICES_CLIENT_SECRET'],
    capabilities: ['pdf-extract', 'pdf-ocr'],
    purposes: ['pdf-extract-address-import'],
    defaultPrivacyMode: 'ephemeral-document-processing-required',
    recommendedRuntime: 'server-side',
    requiresAdobeDeveloperCredential: true,
    recommendedScopes: [],
    docs: [ADOBE_DOCS.pdfExtract, ADOBE_DOCS.pdfServicesOverview],
    recommendedUse: [
      'optional cloud OCR/extraction for uploaded address-bearing PDFs',
      'extract address candidates for later user editing and redaction',
    ],
    caveats: [
      'Source PDFs may contain highly sensitive names, phone numbers, IDs, and addresses.',
      'Use explicit consent, TLS, encrypted temporary storage, and retention limits.',
    ],
  },
  {
    id: 'adobe-pdf-embed-api',
    label: 'Adobe PDF Embed API',
    family: 'acrobat-services',
    requiredEnvVars: ['ADOBE_PDF_EMBED_CLIENT_ID'],
    optionalEnvVars: [],
    capabilities: ['pdf-viewer'],
    purposes: ['pdf-embed-redacted-viewer'],
    defaultPrivacyMode: 'client-viewer-only',
    recommendedRuntime: 'browser-client-allowed',
    requiresAdobeDeveloperCredential: true,
    recommendedScopes: [],
    docs: [ADOBE_DOCS.pdfEmbed],
    recommendedUse: [
      'embed redacted PDF review views in the dashboard',
      'let operators inspect address evidence without exposing source files publicly',
    ],
    caveats: [
      'Only embed redacted PDFs or locally authorized object URLs by default.',
      'Do not expose long-lived public evidence URLs.',
    ],
  },
  {
    id: 'acrobat-sign-api',
    label: 'Adobe Acrobat Sign API',
    family: 'electronic-signature',
    requiredEnvVars: ['ADOBE_SIGN_CLIENT_ID'],
    optionalEnvVars: ['ADOBE_SIGN_CLIENT_SECRET', 'ADOBE_SIGN_WEBHOOK_SECRET'],
    capabilities: ['esignature', 'webhook'],
    purposes: ['consent-envelope-signature', 'delegated-pickup-signature'],
    defaultPrivacyMode: 'signature-workflow-required',
    recommendedRuntime: 'server-side',
    requiresAdobeDeveloperCredential: true,
    recommendedScopes: ['agreement_send', 'agreement_read'],
    docs: [ADOBE_DOCS.acrobatSign],
    recommendedUse: [
      'signed consent for address disclosure, delegated pickup, or aid receipt',
      'webhook status updates for signed consent envelopes',
    ],
    caveats: [
      'Agreement documents may become durable legal records; avoid raw address content unless legally required.',
      'Use purpose, expiry, revocation handle, and redacted summaries in agreements.',
    ],
  },
  {
    id: 'adobe-commerce-api',
    label: 'Adobe Commerce / Magento Open Source Web API',
    family: 'commerce',
    requiredEnvVars: ['ADOBE_COMMERCE_BASE_URL'],
    optionalEnvVars: ['ADOBE_COMMERCE_ACCESS_TOKEN'],
    capabilities: ['commerce-rest', 'commerce-graphql', 'checkout', 'order-management'],
    purposes: ['commerce-checkout-address-element', 'commerce-order-handoff', 'commerce-return-label'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresAdobeDeveloperCredential: false,
    recommendedScopes: [],
    docs: [ADOBE_DOCS.commerceRest, ADOBE_DOCS.commerceWebApi],
    recommendedUse: [
      'embed AGID Address Element in Adobe Commerce checkout',
      'store order handoff aliases and label commitments',
      'support return labels without exposing AOID internals',
    ],
    caveats: [
      'Commerce platforms often expect shipping addresses; AGID should prefer AGID-S or carrier-specific disclosure.',
      'Never store AOID private records in order custom attributes.',
    ],
  },
  {
    id: 'adobe-experience-manager-api',
    label: 'Adobe Experience Manager APIs',
    family: 'content-management',
    requiredEnvVars: ['AEM_BASE_URL'],
    optionalEnvVars: ['AEM_CLIENT_ID', 'AEM_CLIENT_SECRET'],
    capabilities: ['content-fragment', 'asset-management', 'forms'],
    purposes: ['aem-address-document-portal', 'aem-redacted-evidence-content'],
    defaultPrivacyMode: 'redacted-document-only',
    recommendedRuntime: 'server-side',
    requiresAdobeDeveloperCredential: true,
    recommendedScopes: [],
    docs: [ADOBE_DOCS.aemApis, ADOBE_DOCS.aemDeveloperApis],
    recommendedUse: [
      'publish redacted help, forms, or evidence portal content',
      'host content fragments for address verification guidance',
    ],
    caveats: [
      'AEM content should not become a personal-address repository.',
      'Separate public content from private evidence vault storage.',
    ],
  },
  {
    id: 'adobe-experience-platform-api',
    label: 'Adobe Experience Platform APIs',
    family: 'experience-platform',
    requiredEnvVars: ['ADOBE_EXPERIENCE_PLATFORM_ORG_ID', 'ADOBE_EXPERIENCE_PLATFORM_CLIENT_ID'],
    optionalEnvVars: ['ADOBE_EXPERIENCE_PLATFORM_CLIENT_SECRET', 'ADOBE_EXPERIENCE_PLATFORM_SANDBOX'],
    capabilities: ['event-ingestion', 'data-governance'],
    purposes: ['experience-event-forwarding', 'experience-audit-analytics'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresAdobeDeveloperCredential: true,
    recommendedScopes: [],
    docs: [ADOBE_DOCS.experiencePlatform],
    recommendedUse: [
      'send privacy-safe product analytics events',
      'monitor address checkout funnel without raw address payloads',
    ],
    caveats: [
      'Do not send raw addresses, AOIDs, proof witnesses, phone numbers, or exact coordinates as marketing identities.',
      'Use data governance labels and coarse, aggregated event attributes.',
    ],
  },
  {
    id: 'adobe-express-embed-sdk',
    label: 'Adobe Express Embed SDK',
    family: 'creative-tools',
    requiredEnvVars: ['ADOBE_EXPRESS_CLIENT_ID'],
    optionalEnvVars: [],
    capabilities: ['embedded-editor'],
    purposes: ['express-label-design', 'express-pos-notice-design'],
    defaultPrivacyMode: 'public-brand-asset-only',
    recommendedRuntime: 'browser-client-allowed',
    requiresAdobeDeveloperCredential: true,
    recommendedScopes: [],
    docs: [ADOBE_DOCS.expressEmbed],
    recommendedUse: [
      'design POS notices, QR instruction cards, and public label templates',
      'avoid embedding recipient details in creative templates',
    ],
    caveats: [
      'Use placeholders for AGID/AOID data and fill sensitive fields outside Adobe Express.',
    ],
  },
  {
    id: 'creative-cloud-libraries-api',
    label: 'Creative Cloud Libraries API',
    family: 'asset-library',
    requiredEnvVars: ['ADOBE_CC_LIBRARIES_CLIENT_ID'],
    optionalEnvVars: ['ADOBE_CC_LIBRARIES_CLIENT_SECRET'],
    capabilities: ['brand-assets'],
    purposes: ['creative-brand-assets'],
    defaultPrivacyMode: 'public-brand-asset-only',
    recommendedRuntime: 'server-side',
    requiresAdobeDeveloperCredential: true,
    recommendedScopes: [],
    docs: [ADOBE_DOCS.creativeLibraries],
    recommendedUse: [
      'import approved brand colors, logos, and styles for operator-facing documents',
    ],
    caveats: [
      'Adobe currently notes that new Creative Cloud Libraries integrations are not being accepted.',
      'Use only for existing integrations or keep as a future adapter candidate.',
    ],
  },
];

const VALID_SERVICE_IDS = new Set(ADOBE_SERVICE_PROFILES.map(profile => profile.id));
const VALID_PURPOSES = new Set<AdobeIntegrationPurpose>([
  'pdf-generate-shipping-label',
  'pdf-redact-address-evidence',
  'pdf-extract-address-import',
  'pdf-embed-redacted-viewer',
  'consent-envelope-signature',
  'delegated-pickup-signature',
  'commerce-checkout-address-element',
  'commerce-order-handoff',
  'commerce-return-label',
  'aem-address-document-portal',
  'aem-redacted-evidence-content',
  'experience-event-forwarding',
  'experience-audit-analytics',
  'express-label-design',
  'express-pos-notice-design',
  'creative-brand-assets',
]);
const VALID_PAYLOAD_CLASSES = new Set<AdobePayloadClass>([
  'none',
  'event-metadata',
  'address-commitment',
  'commerce-order-alias',
  'redacted-address-summary',
  'redacted-pdf',
  'encrypted-evidence-envelope',
  'shipping-label-pdf',
  'pdf-document',
  'document-image-or-pdf',
  'signature-agreement',
  'creative-asset',
]);

function cleanText(value: unknown, maxLength = 180) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function cleanIdentifier(value: unknown) {
  return cleanText(value, 120).toLowerCase();
}

function normalizePayloadClass(value: unknown): AdobePayloadClass {
  const cleaned = cleanIdentifier(value || 'none') as AdobePayloadClass;
  return VALID_PAYLOAD_CLASSES.has(cleaned) ? cleaned : 'none';
}

function normalizeRequestedScopes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map(item => cleanText(item, 120))
    .filter(Boolean)
    .filter(item => /^[A-Za-z0-9_./:-]+$/.test(item)))]
    .sort();
}

function isRawDocumentPayload(payloadClass: AdobePayloadClass) {
  return payloadClass === 'pdf-document'
    || payloadClass === 'document-image-or-pdf'
    || payloadClass === 'signature-agreement'
    || payloadClass === 'shipping-label-pdf';
}

function isRedactedOrEncryptedPayload(payloadClass: AdobePayloadClass) {
  return payloadClass === 'redacted-pdf'
    || payloadClass === 'encrypted-evidence-envelope'
    || payloadClass === 'redacted-address-summary'
    || payloadClass === 'address-commitment'
    || payloadClass === 'commerce-order-alias'
    || payloadClass === 'event-metadata'
    || payloadClass === 'creative-asset'
    || payloadClass === 'none';
}

function profileAllowsRawDocument(profile: AdobeServiceProfile) {
  return profile.defaultPrivacyMode === 'ephemeral-document-processing-required'
    || profile.defaultPrivacyMode === 'signature-workflow-required'
    || profile.defaultPrivacyMode === 'redacted-document-only';
}

function rawPayloadRequiresDocumentProcessor(payloadClass: AdobePayloadClass) {
  return payloadClass === 'pdf-document' || payloadClass === 'document-image-or-pdf';
}

export function listAdobeServiceProfiles(): AdobeServiceProfile[] {
  return ADOBE_SERVICE_PROFILES.map(profile => ({
    ...profile,
    requiredEnvVars: [...profile.requiredEnvVars],
    optionalEnvVars: [...profile.optionalEnvVars],
    capabilities: [...profile.capabilities],
    purposes: [...profile.purposes],
    recommendedScopes: [...profile.recommendedScopes],
    docs: [...profile.docs],
    recommendedUse: [...profile.recommendedUse],
    caveats: [...profile.caveats],
  }));
}

export function getAdobeServiceProfile(id: AdobeServiceId | string): AdobeServiceProfile | null {
  const cleaned = cleanIdentifier(id);
  const profile = ADOBE_SERVICE_PROFILES.find(item => item.id === cleaned);
  if (!profile) return null;
  return listAdobeServiceProfiles().find(item => item.id === profile.id) ?? null;
}

export function buildAdobeIntegrationPlan(input: AdobeIntegrationPlanInput): AdobeIntegrationPlan {
  const serviceId = cleanIdentifier(input.serviceId);
  const service = getAdobeServiceProfile(serviceId);
  const purpose = cleanIdentifier(input.purpose) as AdobeIntegrationPurpose;
  const payloadClass = normalizePayloadClass(input.payloadClass);
  const ownerConsent = input.ownerConsent === true;
  const encryptedAtRest = input.encryptedAtRest === true;
  const encryptedInTransit = input.encryptedInTransit === true;
  const serverSideOnly = input.serverSideOnly === true;
  const highRiskMode = input.highRiskMode === true;
  const redacted = input.redacted === true || payloadClass === 'redacted-pdf' || payloadClass === 'redacted-address-summary';
  const requestedScopes = normalizeRequestedScopes(input.requestedScopes);
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredControls: string[] = [
    'no-adobe-client-secret-in-browser',
    'no-raw-address-in-analytics-or-telemetry',
    'domain-separated-document-aliases-and-commitments',
  ];

  if (!VALID_SERVICE_IDS.has(serviceId as AdobeServiceId) || !service) {
    errors.push('unknown-adobe-service');
  }
  if (!VALID_PURPOSES.has(purpose)) {
    errors.push('unknown-adobe-purpose');
  }
  if (service && !service.purposes.includes(purpose)) {
    errors.push('service-purpose-not-supported');
  }

  if (service?.requiresAdobeDeveloperCredential) {
    requiredControls.push('adobe-developer-console-credential');
  }
  if (service?.recommendedRuntime === 'server-side' || service?.recommendedRuntime === 'dashboard-admin-only') {
    requiredControls.push('server-side-adobe-token-exchange');
  }
  if (service?.defaultPrivacyMode === 'commitment-or-alias-only') {
    requiredControls.push('send-only-commitments-order-aliases-or-redacted-summaries');
  }
  if (service?.defaultPrivacyMode === 'redacted-document-only') {
    requiredControls.push('redact-before-adobe-document-processing');
  }
  if (service?.defaultPrivacyMode === 'encrypted-envelope-only') {
    requiredControls.push('owner-device-encryption-before-upload');
  }
  if (service?.defaultPrivacyMode === 'ephemeral-document-processing-required') {
    requiredControls.push('explicit-consent-for-cloud-document-processing');
    requiredControls.push('temporary-document-retention-policy');
  }
  if (service?.defaultPrivacyMode === 'signature-workflow-required') {
    requiredControls.push('purpose-scoped-signature-envelope');
    requiredControls.push('signed-agreement-retention-policy');
  }
  if (service?.defaultPrivacyMode === 'public-brand-asset-only') {
    requiredControls.push('no-recipient-or-private-address-in-creative-assets');
  }

  if (isRawDocumentPayload(payloadClass)) {
    if (!service || !profileAllowsRawDocument(service)) {
      errors.push('raw-document-payload-not-allowed-for-service');
    }
    if (!ownerConsent) errors.push('owner-consent-required-for-adobe-document-processing');
    if (!encryptedInTransit) errors.push('encrypted-in-transit-required-for-adobe-document-processing');
    if (!serverSideOnly && service?.recommendedRuntime !== 'browser-client-allowed') {
      errors.push('server-side-proxy-required-for-adobe-document-processing');
    }
    if (!encryptedAtRest && payloadClass !== 'shipping-label-pdf') {
      errors.push('encrypted-at-rest-required-for-adobe-document-processing');
    }
  }

  if (payloadClass === 'encrypted-evidence-envelope') {
    if (!ownerConsent) errors.push('owner-consent-required-for-encrypted-evidence');
    if (!encryptedAtRest) errors.push('encrypted-at-rest-required-for-encrypted-evidence');
    if (!encryptedInTransit) errors.push('encrypted-in-transit-required-for-encrypted-evidence');
  }

  if (rawPayloadRequiresDocumentProcessor(payloadClass)
    && service?.id !== 'adobe-pdf-extract-api'
    && service?.id !== 'adobe-pdf-services-api') {
    errors.push('raw-pdf-or-image-requires-pdf-services-or-extract-api');
  }

  if (payloadClass === 'signature-agreement' && service?.id !== 'acrobat-sign-api') {
    errors.push('signature-agreement-requires-acrobat-sign-api');
  }

  if (payloadClass === 'creative-asset'
    && service?.id !== 'adobe-express-embed-sdk'
    && service?.id !== 'creative-cloud-libraries-api') {
    errors.push('creative-asset-requires-express-or-creative-cloud-libraries');
  }

  if (payloadClass === 'commerce-order-alias' && service?.id !== 'adobe-commerce-api') {
    warnings.push('commerce-order-alias-is-most-useful-with-adobe-commerce-api');
  }

  if (service?.id === 'creative-cloud-libraries-api') {
    warnings.push('creative-cloud-libraries-new-integrations-may-not-be-accepted-by-adobe');
  }

  if (highRiskMode) {
    requiredControls.push('high-risk-mode-prefers-local-document-processing');
    if (isRawDocumentPayload(payloadClass)) {
      warnings.push('high-risk-mode-prefers-local-pdf-ocr-redaction-or-agid-s-over-adobe-cloud-processing');
    }
  }

  if (service?.defaultPrivacyMode === 'redacted-document-only' && !redacted && payloadClass !== 'encrypted-evidence-envelope') {
    warnings.push('redaction-recommended-before-adobe-document-workflow');
  }

  const recommendedScopes = service
    ? [...new Set([...service.recommendedScopes, ...requestedScopes])].sort()
    : requestedScopes;
  if (recommendedScopes.some(scope => /account|admin|agreement_read/i.test(scope))) {
    warnings.push('broad-adobe-scope-requires-admin-review-and-retention-policy');
  }

  const sendsRawAddressDocumentToAdobe = Boolean(service && isRawDocumentPayload(payloadClass) && profileAllowsRawDocument(service));
  const sendsRawAddressTextToAdobe = payloadClass === 'signature-agreement' || payloadClass === 'shipping-label-pdf';
  const storesRawAddressInAdobe = false;
  const serverSideOnlyRequired = Boolean(service && (
    service.recommendedRuntime === 'server-side'
    || service.recommendedRuntime === 'dashboard-admin-only'
    || (isRawDocumentPayload(payloadClass) && service.recommendedRuntime !== 'browser-client-allowed')
  ));

  return {
    modelVersion: ADOBE_SERVICE_INTEGRATION_MODEL_VERSION,
    service,
    purpose,
    payloadClass,
    allowed: errors.length === 0,
    requiredEnvVars: service ? [...service.requiredEnvVars] : [],
    requiredControls: [...new Set(requiredControls)].sort(),
    recommendedScopes,
    dataFlow: {
      sendsRawAddressDocumentToAdobe,
      sendsRawAddressTextToAdobe,
      storesRawAddressInAdobe,
      clientSecretAllowedInBrowser: false,
      serverSideOnlyRequired,
      highRiskModeCompatible: !highRiskMode || !isRawDocumentPayload(payloadClass),
    },
    errors,
    warnings,
  };
}
