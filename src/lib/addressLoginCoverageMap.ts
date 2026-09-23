import {
  ADDRESS_LOGIN_ENDPOINTS,
  ADDRESS_LOGIN_MERCHANT_FEATURES,
  ADDRESS_LOGIN_REQUIREMENTS,
  ADDRESS_LOGIN_USER_EXPERIENCE_STEPS,
  buildAddressLoginMerchantIntegration,
  requiredClaimsForAddressLogin,
} from './addressLoginSpec';

export type AddressLoginCoverageArea =
  | 'requirements'
  | 'endpoint-catalog'
  | 'user-experience'
  | 'merchant-control-plane'
  | 'country-form-capability'
  | 'safe-callback'
  | 'webhook-events'
  | 'developer-adoption'
  | 'release-gates';

export type AddressLoginCoverageItem = {
  area: AddressLoginCoverageArea;
  screenEvidence: string[];
  executableEvidence: unknown[];
  privacyBoundary: string;
};

const defaultClaims = requiredClaimsForAddressLogin('shipping', 'standard', 'carrier_decryptable');
const integration = buildAddressLoginMerchantIntegration({
  purpose: 'shipping',
  disclosureMode: 'carrier_decryptable',
  riskLevel: 'standard',
  requestedClaims: defaultClaims,
  countryHints: ['JP'],
  displayLanguageMode: 'native_and_english',
  carrierId: 'carrier_demo',
});

export const addressLoginCoverageMap: AddressLoginCoverageItem[] = [
  {
    area: 'requirements',
    screenEvidence: ['Address Login', 'no raw address callback', 'request valid'],
    executableEvidence: ADDRESS_LOGIN_REQUIREMENTS.map(requirement => requirement.id),
    privacyBoundary: 'Do not turn requirements into raw-address collection or merchant-visible address storage.',
  },
  {
    area: 'endpoint-catalog',
    screenEvidence: ['Hosted button and callback', 'SDK', 'Safe callback preview'],
    executableEvidence: ADDRESS_LOGIN_ENDPOINTS.map(endpoint => `${endpoint.method} ${endpoint.path}`),
    privacyBoundary: 'Do not mark public Address Login endpoints as raw-address accepting.',
  },
  {
    area: 'user-experience',
    screenEvidence: ['Wallet consent flow', 'Merchant sees', 'Carrier sees'],
    executableEvidence: ADDRESS_LOGIN_USER_EXPERIENCE_STEPS.map(step => step.id),
    privacyBoundary: 'Do not show full address text, private witnesses, or long-lived decrypt tokens in user or merchant screens.',
  },
  {
    area: 'merchant-control-plane',
    screenEvidence: ['Merchant-side control plane', 'policy', 'operations'],
    executableEvidence: ADDRESS_LOGIN_MERCHANT_FEATURES.map(feature => feature.id),
    privacyBoundary: 'Do not make merchant setup controls bypass consent, revocation, or carrier-only boundaries.',
  },
  {
    area: 'country-form-capability',
    screenEvidence: ['Country form capability', 'Native + English', '母国語と英語の併用に対応'],
    executableEvidence: integration.request.countryHints ?? [],
    privacyBoundary: 'Do not force a postal-code field or claim verified country coverage when only fallback form support exists.',
  },
  {
    area: 'safe-callback',
    screenEvidence: ['Safe callback preview', 'safeCallbackPreview'],
    executableEvidence: Object.keys(integration.safeCallbackPreview.publicClaims),
    privacyBoundary: 'Do not include raw address, recipient phone, proof witness, or private key material in callbacks.',
  },
  {
    area: 'webhook-events',
    screenEvidence: ['Webhook payloads are redacted', 'webhookEvents', 'Webhook'],
    executableEvidence: integration.webhookEvents,
    privacyBoundary: 'Do not emit address lines, phone numbers, proof witnesses, or decrypt tokens in webhooks.',
  },
  {
    area: 'developer-adoption',
    screenEvidence: ['Google / Apple sign-up', 'EC-ready Vey ID', '@veygrit/address-login-react', 'VeyIdSignInButton'],
    executableEvidence: ['hosted-redirect', 'drop-in-react', 'headless-hooks', 'nextjs-server-helper', 'local-sandbox-mock'],
    privacyBoundary: 'Do not imply Vey ID accepts non-Google/Apple account creation or that publishable keys authorize carrier decryption.',
  },
  {
    area: 'release-gates',
    screenEvidence: ['Gates', 'Required gates', 'requiredDashboardGates'],
    executableEvidence: integration.requiredDashboardGates,
    privacyBoundary: 'Do not release Address Login without no-raw-address callback validation and synthetic test vectors.',
  },
] as const;

export function findMissingAddressLoginCoverage(screenSource: string, coverage = addressLoginCoverageMap) {
  return coverage.flatMap(item => item.screenEvidence
    .filter(evidence => !screenSource.includes(evidence))
    .map(evidence => ({ area: item.area, reason: `screen:${evidence}` })));
}
