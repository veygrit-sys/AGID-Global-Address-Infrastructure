import { buildVeygritAppModel } from './veygritApp';

export const VEYGRIT_TRANSITION_MAP_VERSION = 'veygrit-transition-map-v0.1';

export type VeygritTransitionNodeKind = 'screen' | 'section' | 'merchant-console-anchor';

export type VeygritTransitionNode = {
  id: string;
  label: string;
  routeRef: string;
  kind: VeygritTransitionNodeKind;
};

export type VeygritTransitionEdgeKind = 'side_menu' | 'store_submenu' | 'primary_button' | 'safe_qr_action';

export type VeygritTransitionEdge = {
  id: string;
  label: string;
  from: string;
  to: string;
  kind: VeygritTransitionEdgeKind;
  loginRequiredBeforeAction: boolean;
  walletConsentRequiredBeforeAddressReuse: boolean;
  merchantVisibleOnlyRefs: boolean;
};

export type VeygritTransitionMap = {
  version: typeof VEYGRIT_TRANSITION_MAP_VERSION;
  entryNodeId: 'home';
  nodes: VeygritTransitionNode[];
  edges: VeygritTransitionEdge[];
  blockedTransitions: string[];
  nonClaims: string[];
};

export type VeygritTransitionMapValidation = {
  ok: boolean;
  errors: string[];
};

function routeToNodeId(routeRef: string) {
  if (routeRef === '/veygrit#home') return 'home';
  if (routeRef === '/veygrit#friends') return 'friends';
  if (routeRef === '/veygrit#store') return 'store';
  if (routeRef === '/veygrit#topics') return 'topics';
  if (routeRef === '/veygrit#discover') return 'discover';
  if (routeRef === '/veygrit#my-stores') return 'my-stores';
  if (routeRef === '/veygrit#my-page') return 'my-page';
  if (routeRef === '/merchant-console#vey-id') return 'merchant-console-vey-id';
  if (routeRef === '/merchant-console#delivery-gateway') return 'merchant-console-delivery-gateway';
  return routeRef.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

export function buildVeygritTransitionMap(): VeygritTransitionMap {
  const model = buildVeygritAppModel();
  const nodesById = new Map<string, VeygritTransitionNode>();

  for (const item of model.navigation) {
    nodesById.set(item.id, {
      id: item.id,
      label: item.label,
      routeRef: item.routeRef,
      kind: 'screen',
    });
    for (const child of item.children ?? []) {
      nodesById.set(child.id, {
        id: child.id,
        label: child.label,
        routeRef: child.routeRef,
        kind: 'section',
      });
    }
  }

  for (const integration of model.integrations) {
    const nodeId = routeToNodeId(integration.decisionRouteRef);
    if (!nodesById.has(nodeId)) {
      nodesById.set(nodeId, {
        id: nodeId,
        label: integration.label,
        routeRef: integration.decisionRouteRef,
        kind: 'merchant-console-anchor',
      });
    }
  }

  const sideMenuEdges: VeygritTransitionEdge[] = model.navigation.map(item => ({
    id: `side-menu-${item.id}`,
    label: item.label,
    from: 'home',
    to: item.id,
    kind: 'side_menu',
    loginRequiredBeforeAction: false,
    walletConsentRequiredBeforeAddressReuse: false,
    merchantVisibleOnlyRefs: true,
  }));

  const storeEdges: VeygritTransitionEdge[] =
    model.navigation
      .find(item => item.id === 'store')
      ?.children?.map(child => ({
        id: `store-submenu-${child.id}`,
        label: child.label,
        from: 'store',
        to: child.id,
        kind: 'store_submenu' as const,
        loginRequiredBeforeAction: false,
        walletConsentRequiredBeforeAddressReuse: false,
        merchantVisibleOnlyRefs: true,
      })) ?? [];

  const buttonEdges: VeygritTransitionEdge[] = model.integrations.map(integration => ({
    id: `integration-button-${integration.id}`,
    label: integration.primaryActionLabel,
    from: 'commerce-entry-points',
    to: routeToNodeId(integration.decisionRouteRef),
    kind: 'primary_button',
    loginRequiredBeforeAction: integration.loginRequiredBeforeCheckout,
    walletConsentRequiredBeforeAddressReuse: integration.addressWalletReuse,
    merchantVisibleOnlyRefs: !integration.merchantSeesRawAddress,
  }));

  const qrEdges: VeygritTransitionEdge[] = model.home.qr.map(qr => ({
    id: `qr-${qr.id}`,
    label: qr.label,
    from: 'home',
    to: qr.id,
    kind: 'safe_qr_action',
    loginRequiredBeforeAction: qr.id === 'ec-login',
    walletConsentRequiredBeforeAddressReuse: qr.id !== 'store-counter',
    merchantVisibleOnlyRefs: true,
  }));

  return {
    version: VEYGRIT_TRANSITION_MAP_VERSION,
    entryNodeId: 'home',
    nodes: [
      ...nodesById.values(),
      { id: 'commerce-entry-points', label: 'Commerce entry points', routeRef: '/veygrit#commerce', kind: 'section' },
      ...model.home.qr.map(qr => ({ id: qr.id, label: qr.label, routeRef: `/veygrit#qr-${qr.id}`, kind: 'section' as const })),
    ],
    edges: [...sideMenuEdges, ...storeEdges, ...buttonEdges, ...qrEdges],
    blockedTransitions: [
      'playlist_commerce_to_ec_social_login_without_user_action',
      'qr_address_share_to_raw_address_export',
      'friend_selection_to_friend_address_view',
      'guest_checkout_to_saved_address_without_wallet_consent',
      'merchant_console_to_production_deploy_without_explicit_approval',
    ],
    nonClaims: [
      'The transition map is a local product specification, not a production router.',
      'A route edge does not authorize address reuse without Wallet consent.',
      'Merchant console anchors are implementation targets, not permission to send production traffic.',
    ],
  };
}

export function validateVeygritTransitionMap(map = buildVeygritTransitionMap()): VeygritTransitionMapValidation {
  const errors: string[] = [];
  const nodeIds = new Set(map.nodes.map(node => node.id));
  const edgeIds = new Set<string>();

  if (map.entryNodeId !== 'home') errors.push(`unexpected-entry:${map.entryNodeId}`);
  for (const node of map.nodes) {
    if (!node.routeRef.startsWith('/veygrit') && !node.routeRef.startsWith('/merchant-console')) {
      errors.push(`unexpected-route:${node.id}:${node.routeRef}`);
    }
  }

  for (const edge of map.edges) {
    if (edgeIds.has(edge.id)) errors.push(`duplicate-edge:${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.from)) errors.push(`missing-from-node:${edge.id}:${edge.from}`);
    if (!nodeIds.has(edge.to)) errors.push(`missing-to-node:${edge.id}:${edge.to}`);
    if (!edge.merchantVisibleOnlyRefs) errors.push(`merchant-visible-material-risk:${edge.id}`);
  }

  const edgeById = new Map(map.edges.map(edge => [edge.id, edge]));
  if (edgeById.get('integration-button-playlist_commerce')?.to !== 'store') {
    errors.push('playlist-commerce-button-must-open-store');
  }
  if (edgeById.get('integration-button-playlist_commerce')?.loginRequiredBeforeAction) {
    errors.push('playlist-commerce-button-must-not-require-login-before-shopping');
  }
  if (edgeById.get('integration-button-ec_social_login')?.to !== 'merchant-console-vey-id') {
    errors.push('ec-social-login-button-must-open-vey-id-console');
  }
  if (!edgeById.get('integration-button-ec_social_login')?.loginRequiredBeforeAction) {
    errors.push('ec-social-login-button-must-require-login-before-checkout');
  }
  if (edgeById.get('integration-button-delivery_gateway')?.to !== 'merchant-console-delivery-gateway') {
    errors.push('delivery-gateway-button-must-open-delivery-console');
  }

  for (const blocked of [
    'playlist_commerce_to_ec_social_login_without_user_action',
    'qr_address_share_to_raw_address_export',
    'guest_checkout_to_saved_address_without_wallet_consent',
  ]) {
    if (!map.blockedTransitions.includes(blocked)) errors.push(`missing-blocked-transition:${blocked}`);
  }

  const serialized = JSON.stringify(map);
  for (const forbidden of ['addressText', 'recipientPhone', 'providerAccessToken', 'proofWitness', 'privateKey']) {
    if (serialized.includes(forbidden)) errors.push(`forbidden-sensitive-key:${forbidden}`);
  }

  return { ok: errors.length === 0, errors };
}
