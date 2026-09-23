import { buildVeygritAppModel } from './veygritApp';

export const VEYGRIT_SITES_APP_SHELL_VERSION = 'veygrit-sites-app-shell-v0.1';

export type VeygritSitesAppShellContract = {
  version: typeof VEYGRIT_SITES_APP_SHELL_VERSION;
  mainNavLabels: string[];
  homeSectionLabels: string[];
  storeSectionLabels: string[];
  requiredSourceMarkers: string[];
  requiredCssClasses: string[];
  forbiddenSourcePatterns: RegExp[];
};

export function buildVeygritSitesAppShellContract(): VeygritSitesAppShellContract {
  const model = buildVeygritAppModel();
  const store = model.navigation.find(item => item.id === 'store');

  return {
    version: VEYGRIT_SITES_APP_SHELL_VERSION,
    mainNavLabels: model.navigation.map(item => item.label),
    homeSectionLabels: ['My Address', 'Spare Address', 'QR', 'Recent Deliveries', 'Recent Stores'],
    storeSectionLabels: store?.children?.map(child => child.label) ?? [],
    requiredSourceMarkers: [
      "active === 'Store'",
      "setActive('Store')",
      'StoreView',
      'commerce-entry-panel',
      'veygritTransitionButtons',
    ],
    requiredCssClasses: [
      '.store-subnav',
      '.store-tabs',
      '.store-tab',
      '.store-hub-panel',
      '.genre-grid',
    ],
    forbiddenSourcePatterns: [
      /providerAccessToken|providerRefreshToken|proofWitness|privateKey|proofSecret/i,
      /sk_live_|ghp_[A-Za-z0-9_]+|github_pat_/i,
    ],
  };
}
