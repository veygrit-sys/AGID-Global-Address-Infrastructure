import { buildVeygritAppModel } from './veygritApp';
import { buildVeygritTransitionMap } from './veygritTransitionMap';

export const VEYGRIT_SITES_TRANSITION_BUTTONS_VERSION = 'veygrit-sites-transition-buttons-v0.1';

export type VeygritSitesTransitionButton = {
  id: string;
  label: string;
  href: string;
  eyebrow: 'Playlist Commerce' | 'EC Social Login' | 'Delivery Gateway';
  description: string;
  icon: 'store' | 'key' | 'truck';
};

export type VeygritSitesTransitionButtonsValidation = {
  ok: boolean;
  errors: string[];
};

function escapeJsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function buildVeygritSitesTransitionButtons(): VeygritSitesTransitionButton[] {
  const model = buildVeygritAppModel();
  const map = buildVeygritTransitionMap();
  const integrationsById = new Map(model.integrations.map(integration => [integration.id, integration]));
  const nodesById = new Map(map.nodes.map(node => [node.id, node]));

  return map.edges
    .filter(edge => edge.kind === 'primary_button')
    .map(edge => {
      const id = edge.id.replace(/^integration-button-/, '');
      const destination = nodesById.get(edge.to);
      const integration = integrationsById.get(id as 'playlist_commerce' | 'ec_social_login' | 'delivery_gateway');
      if (!destination || !integration) {
        throw new Error(`missing-sites-transition-button-contract:${edge.id}`);
      }

      return {
        id,
        label: edge.label,
        href: destination.routeRef,
        eyebrow: integration.label,
        description: integration.commerceEntryDescription,
        icon: integration.commerceEntryIcon,
      };
    });
}

export function validateVeygritSitesTransitionButtons(
  buttons = buildVeygritSitesTransitionButtons(),
): VeygritSitesTransitionButtonsValidation {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const button of buttons) {
    if (!/^[a-z][a-z0-9_]+$/.test(button.id)) errors.push(`invalid-button-id:${button.id}`);
    if (ids.has(button.id)) errors.push(`duplicate-button-id:${button.id}`);
    ids.add(button.id);
    if (!button.href.startsWith('/veygrit') && !button.href.startsWith('/merchant-console')) {
      errors.push(`unexpected-button-href:${button.id}`);
    }
    if (!['store', 'key', 'truck'].includes(button.icon)) {
      errors.push(`unexpected-button-icon:${button.id}`);
    }
    const serialized = JSON.stringify(button);
    if (/rawAddress|recipientPhone|providerAccessToken|proofWitness|privateKey|proofSecret|sk_live_|ghp_/i.test(serialized)) {
      errors.push(`sensitive-button-material:${button.id}`);
    }
  }

  for (const requiredId of ['playlist_commerce', 'ec_social_login', 'delivery_gateway']) {
    if (!ids.has(requiredId)) errors.push(`missing-button:${requiredId}`);
  }

  return { ok: errors.length === 0, errors };
}

export function renderVeygritSitesTransitionButtonsModule(
  buttons = buildVeygritSitesTransitionButtons(),
): string {
  const validation = validateVeygritSitesTransitionButtons(buttons);
  if (!validation.ok) {
    throw new Error(`invalid-veygrit-sites-transition-buttons:${validation.errors.join(',')}`);
  }

  return [
    '// Generated from AGID src/lib/veygritSitesTransitionButtons.ts.',
    '// Run `npm run sync:veygrit-sites-transition-buttons` from AGID to refresh.',
    '',
    'export const veygritTransitionButtons = [',
    ...buttons.flatMap(button => [
      '  {',
      `    id: '${escapeJsString(button.id)}',`,
      `    label: '${escapeJsString(button.label)}',`,
      `    href: '${escapeJsString(button.href)}',`,
      `    eyebrow: '${escapeJsString(button.eyebrow)}',`,
      `    description: '${escapeJsString(button.description)}',`,
      `    icon: '${escapeJsString(button.icon)}',`,
      '  },',
    ]),
    '];',
    '',
  ].join('\n');
}
