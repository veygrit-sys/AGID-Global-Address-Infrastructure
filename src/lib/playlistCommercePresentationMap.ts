import {
  buildPlaylistCommerceSdkContract,
  createPlaylistCommerceSdkTestClient,
} from './playlistCommerceSdk';
import {
  buildPlaylistCommerceSpec,
  summarizePlaylistCommerceSpec,
} from './playlistCommerceSpec';

export type PlaylistCommerceAudience = 'investor' | 'merchant' | 'developer' | 'operator';

export type PlaylistCommercePresentationCoverage = {
  diagramSection: string;
  audience: PlaylistCommerceAudience;
  widgetEvidence: string[];
  executableEvidence: unknown[];
  nonClaimBoundary: string;
};

const spec = buildPlaylistCommerceSpec();
const summary = summarizePlaylistCommerceSpec(spec);
const sdkContract = buildPlaylistCommerceSdkContract();
const testClient = createPlaylistCommerceSdkTestClient();
const checkout = testClient.startCheckout('self_delivery');
const vectors = testClient.buildTestVectors();

export const playlistCommercePresentationMap: PlaylistCommercePresentationCoverage[] = [
  {
    diagramSection: 'Service Relationship Diagram',
    audience: 'investor',
    widgetEvidence: ['Read by role', 'Investor view', 'Capabilities'],
    executableEvidence: [`${summary.capabilityCount} executable capabilities`, 'capability graph'],
    nonClaimBoundary: 'Do not claim a standalone world-first playlist service.',
  },
  {
    diagramSection: 'Service Architecture Diagram',
    audience: 'operator',
    widgetEvidence: ['Flow', 'Wallet', 'Carrier', 'Webhook'],
    executableEvidence: ['checkout orchestrator fixture', 'signed merchant webhook fixtures'],
    nonClaimBoundary: 'Do not claim payment, carrier, or marketplace ownership.',
  },
  {
    diagramSection: 'User Flow Diagram',
    audience: 'merchant',
    widgetEvidence: ['Playlist to no-address checkout', 'Checkout', 'Merchant visibility'],
    executableEvidence: [checkout.response.orderAlias, checkout.response.carrierHandoffRef],
    nonClaimBoundary: 'Do not expose or imply merchant-visible raw address data.',
  },
  {
    diagramSection: 'EC Integration Diagram',
    audience: 'merchant',
    widgetEvidence: ['Merchant view', 'No-address checkout response', 'Aggregate merchant analytics'],
    executableEvidence: vectors.webhooks.map(vector => vector.payload.topic),
    nonClaimBoundary: 'Do not claim merchants must replace their existing EC stack.',
  },
  {
    diagramSection: 'SDK And API Composition Diagram',
    audience: 'developer',
    widgetEvidence: ['Developer view', 'Developer method surface', 'Public SDK quickstart'],
    executableEvidence: sdkContract.methods.map(method => method.id),
    nonClaimBoundary: 'Do not accept private address, witness, or key material in public SDK methods.',
  },
  {
    diagramSection: 'Data Flow Diagram',
    audience: 'operator',
    widgetEvidence: ['Privacy boundary', 'Contract JSON', 'blocked:', 'raw_address'],
    executableEvidence: checkout.response.hiddenFromMerchant,
    nonClaimBoundary: 'Do not persist private address, proof witness, biometric, or private-key material.',
  },
  {
    diagramSection: 'System Architecture Diagram',
    audience: 'operator',
    widgetEvidence: ['Webhook', 'Contract JSON', 'checkout fixture valid'],
    executableEvidence: [
      checkout.response.status,
      checkout.response.orderAlias,
      ...vectors.webhooks.map(vector => vector.payload.eventId),
    ],
    nonClaimBoundary: 'Do not imply production traffic, payment processing, or carrier API execution in the demo.',
  },
  {
    diagramSection: 'Permission And Authentication Diagram',
    audience: 'developer',
    widgetEvidence: ['no raw address SDK', 'consentEnvelopeRef', 'Privacy boundary'],
    executableEvidence: [
      checkout.response.consentEnvelopeRef,
      checkout.response.subjectAlias,
      ...checkout.response.hiddenFromMerchant,
    ],
    nonClaimBoundary: 'Do not expose passkeys, witnesses, private keys, biometrics, or raw address payloads.',
  },
  {
    diagramSection: 'Merchant Value Diagram',
    audience: 'merchant',
    widgetEvidence: ['Merchant view', 'Aggregate merchant analytics', 'No-address checkout response'],
    executableEvidence: [
      `${summary.apiSurfaceCount} API surfaces`,
      ...vectors.webhooks.map(vector => vector.payload.topic),
    ],
    nonClaimBoundary: 'Do not promise conversion lift, revenue growth, or merchant analytics beyond aggregate demo signals.',
  },
  {
    diagramSection: 'Developer Integration Diagram',
    audience: 'developer',
    widgetEvidence: ['Developer method surface', 'Public SDK quickstart', 'webhook verification'],
    executableEvidence: sdkContract.methods.map(method => method.id),
    nonClaimBoundary: 'Do not require production API keys, live payments, or raw address payloads for local test vectors.',
  },
  {
    diagramSection: 'Novelty Positioning Diagram',
    audience: 'investor',
    widgetEvidence: ['Read by role', 'Investor view', 'Merchant view', 'Developer view'],
    executableEvidence: spec.nonClaims,
    nonClaimBoundary: 'Do not use unsupported world-first claims before prior-art, patent, and market review.',
  },
  {
    diagramSection: 'Slide Order Recommendation',
    audience: 'operator',
    widgetEvidence: ['Read by role', 'Investor view', 'Merchant view', 'Developer view'],
    executableEvidence: [
      `${summary.capabilityCount} executable capabilities`,
      `${summary.apiSurfaceCount} API surfaces`,
      `${sdkContract.methods.length} public SDK methods`,
    ],
    nonClaimBoundary: 'Do not reuse one audience narrative for investors, merchants, and developers without checking evidence.',
  },
] as const;

export function findMissingPresentationCoverage(
  diagramMarkdown: string,
  widgetSource: string,
  coverage = playlistCommercePresentationMap,
) {
  return coverage.flatMap(item => {
    const missing = [
      ...(!diagramMarkdown.includes(item.diagramSection) ? [`diagram:${item.diagramSection}`] : []),
      ...item.widgetEvidence.filter(evidence => !widgetSource.includes(evidence)).map(evidence => `widget:${evidence}`),
    ];

    return missing.map(reason => ({
      diagramSection: item.diagramSection,
      audience: item.audience,
      reason,
    }));
  });
}

function escapeMarkdownCell(value: string) {
  return value.replace(/\|/g, '\\|');
}

function formatEvidence(value: unknown) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') return value.id;
  return String(value);
}

export function renderPlaylistCommerceCoverageTable(
  coverage = playlistCommercePresentationMap,
) {
  const header = '| Diagram | Primary reader | Widget evidence | Executable evidence | Non-claim boundary |';
  const separator = '| --- | --- | --- | --- | --- |';
  const rows = coverage.map(item => [
    item.diagramSection,
    item.audience,
    item.widgetEvidence.join(', '),
    item.executableEvidence.map(formatEvidence).join(', '),
    item.nonClaimBoundary,
  ].map(escapeMarkdownCell).join(' | '));

  return [header, separator, ...rows.map(row => `| ${row} |`)].join('\n');
}
