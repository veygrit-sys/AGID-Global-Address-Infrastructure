export type AgidDesignRouteKey =
  | 'map'
  | 'dashboard'
  | 'pos'
  | 'field'
  | 'hotel'
  | 'opera'
  | 'settings'
  | 'portal'
  | 'developer'
  | 'address-login'
  | 'merchant-console'
  | 'playlist-commerce'
  | 'veygrit'
  | 'element'
  | 'evidence'
  | 'research'
  | 'postal-zones'
  | 'machine'
  | 'locker'
  | 'ops'
  | 'open-source';

export type AgidActionBarPolicy = 'hidden' | 'compact-current-location' | 'field-workflow';

export type AgidHeroRoleCta = 'user' | 'developer' | 'researcher';

export const AGID_HERO_ROLE_CTAS: readonly AgidHeroRoleCta[] = ['user', 'developer', 'researcher'];

export const AGID_DESIGN_LIMITS = {
  maxHeroPrimaryActions: 3,
  maxHeroEntryCards: 3,
  maxUppercaseLabelsPerSection: 1,
  badgeUse: 'Only quality, trust, security, or release state badges should remain visible.',
  fullPageScrollShells: ['agid-page-scroll', 'agid-fixed-page-scroll', 'agid-viewport-shell'],
} as const;

export const AGID_HERO_FIRST_VIEWPORT_CONTRACT = {
  requiredElements: ['h1', 'one-sentence-definition', 'role-ctas', 'three-entry-cards'],
  roleCtas: AGID_HERO_ROLE_CTAS,
  moveBelowFirstViewport: [
    'download-setup',
    'sdk-install-panel',
    'github-resource-grid',
    'spec-conformance-links',
    'local-first-longform',
    'research-detail',
    'workspace-lanes',
  ],
  disallowedAboveFold: [
    'next-action-bar',
    'sync-queue',
    'audit-log',
    'release-gate-table',
    'developer-install-command',
    'dense-badge-row',
  ],
} as const;

export const AGID_FIRST_VIEWPORT_PERFORMANCE_CONTRACT = {
  maxPrimaryBitmapAssets: 1,
  preferStaticPreviewOverLiveMap: true,
  disallowedFirstViewportWork: [
    'live-map-instance',
    'pmtiles-or-vector-tile-load',
    'country-pack-download',
    'postal-index-download',
    'webgl-scene',
    'qr-camera-session',
    'external-network-request',
  ],
  allowedEvidence: [
    'static-hero-image',
    'release-build-assets-gate',
    'app-shell-source-test',
    'no-raw-address-gate',
  ],
} as const;

export const AGID_WORKFLOW_ACTION_VISIBILITY_CONTRACT = {
  homeCompactActions: ['current-location'],
  oneTapEntryActions: ['qr-scan', 'address-registration'],
  fieldWorkflowActions: ['primary-decision', 'sync-queue', 'undo-last-action', 'receipt-status'],
  qualityStates: ['verified', 'partial', 'manual-required'],
  keepOutOfSharedChrome: [
    'personal-contact',
    'private-address-text',
    'qr-payload',
    'private-key-material',
    'proof-witness-material',
  ],
} as const;

export const AGID_ROUTE_ACTION_BAR_POLICY: Record<AgidDesignRouteKey, AgidActionBarPolicy> = {
  map: 'compact-current-location',
  dashboard: 'field-workflow',
  pos: 'compact-current-location',
  field: 'field-workflow',
  hotel: 'field-workflow',
  opera: 'field-workflow',
  settings: 'field-workflow',
  portal: 'compact-current-location',
  developer: 'hidden',
  'address-login': 'hidden',
  'merchant-console': 'hidden',
  'playlist-commerce': 'hidden',
  veygrit: 'hidden',
  element: 'field-workflow',
  evidence: 'field-workflow',
  research: 'hidden',
  'postal-zones': 'compact-current-location',
  machine: 'field-workflow',
  locker: 'field-workflow',
  ops: 'field-workflow',
  'open-source': 'hidden',
};

export function actionBarPolicyForRoute(route: AgidDesignRouteKey): AgidActionBarPolicy {
  return AGID_ROUTE_ACTION_BAR_POLICY[route];
}

export function shouldShowAgidFieldActionBar(route: AgidDesignRouteKey): boolean {
  return actionBarPolicyForRoute(route) !== 'hidden';
}
