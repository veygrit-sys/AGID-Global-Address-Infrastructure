import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AGID_RETIRED_CONSUMER_SURFACE_IDS,
  APP_NAVIGATION_MODEL_VERSION,
  classifyAppSurfaceDiscoverability,
  detectHiddenAppFeatures,
  getAgidAppSurfaces,
  getAppSurfaceCopy,
  getAppSurfaces,
  getHeroWorkspaceSurfaceGroups,
  getPrimaryAppSurfaces,
  getSecondaryAppSurfaceGroups,
  getSideMenuPrimaryAppSurfaces,
  getSideMenuSecondaryAppSurfaceGroups,
  getSideMenuStoreAppSurfaces,
  groupAppSurfaces,
  isAppSurfaceActive,
  isStandaloneAppSurface,
  normalizeAppNavigationLanguage,
  validateAppNavigation,
} from './appNavigation';

test('app navigation model validates integrated shell routes and app groups', () => {
  const result = validateAppNavigation();

  assert.equal(APP_NAVIGATION_MODEL_VERSION, 'agid-integrated-app-navigation-v2');
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);

  const groups = groupAppSurfaces();
  assert.deepEqual(groups.map(group => group.group.id), ['core', 'operations', 'admin', 'developer', 'labs']);
  assert.ok(groups.every(group => group.surfaces.length > 0));

  const primary = getPrimaryAppSurfaces();
  assert.deepEqual(primary.map(surface => surface.id), [
    'map-workspace',
    'friends',
    'address-portal',
    'pos-terminal',
    'address-dashboard',
    'research-design-hub',
  ]);

  const secondaryGroups = getSecondaryAppSurfaceGroups();
  assert.ok(secondaryGroups.some(group => group.group.id === 'labs'));
  assert.equal(
    secondaryGroups.some(group => group.surfaces.some(surface => surface.menuTier === 'primary')),
    false,
  );

  const agidSurfaces = getAgidAppSurfaces();
  const sideMenuPrimary = getSideMenuPrimaryAppSurfaces(agidSurfaces);
  assert.deepEqual(sideMenuPrimary.map(surface => surface.id), ['map-workspace']);
  for (const retiredId of AGID_RETIRED_CONSUMER_SURFACE_IDS) {
    assert.equal(agidSurfaces.some(surface => surface.id === retiredId), false, retiredId);
  }

  const sideMenuStore = getSideMenuStoreAppSurfaces(agidSurfaces);
  assert.deepEqual(sideMenuStore, []);

  const sideMenuSecondaryGroups = getSideMenuSecondaryAppSurfaceGroups();
  assert.deepEqual(sideMenuSecondaryGroups.map(group => group.group.id), ['core', 'developer']);
  assert.equal(
    sideMenuSecondaryGroups.some(group => ['operations', 'admin', 'labs'].includes(group.group.id)),
    false,
  );

  const heroWorkspaceGroups = getHeroWorkspaceSurfaceGroups();
  assert.deepEqual(heroWorkspaceGroups.map(group => group.group.id), ['operations', 'admin', 'labs']);
});

test('standalone app surfaces stay separable from same-shell actions', () => {
  const surfaces = getAppSurfaces();
  const byId = Object.fromEntries(surfaces.map(surface => [surface.id, surface]));

  assert.equal(byId['open-source-home'].route, '/open-source');
  assert.equal(byId['open-source-home'].status, 'ready');
  assert.equal(byId['map-workspace'].deployment, 'same-shell');
  assert.equal(byId['map-workspace'].copy.en.label, 'Home');
  assert.equal(byId['map-workspace'].copy.ja.label, 'ホーム');
  assert.match(byId['map-workspace'].copy.en.description, /Addresses, active delivery, travel passes/);
  assert.equal(byId['veygrit-wallet'].route, '/veygrit');
  assert.equal(byId['veygrit-wallet'].status, 'ready');
  assert.equal(byId['veygrit-wallet'].group, 'core');
  assert.equal(byId['veygrit-wallet'].menuTier, 'secondary');
  assert.equal(byId['veygrit-wallet'].licenseProfile, 'commercial-private');
  assert.equal(byId['veygrit-wallet'].copy.en.label, 'Veygrit Address Wallet');
  assert.match(byId['veygrit-wallet'].copy.en.description, /Google\/Apple-only account creation/);
  assert.equal(isAppSurfaceActive(byId['veygrit-wallet'], { pathname: '/veygrit', hash: '' } as Location), true);
  assert.equal(byId['address-registration'].action, 'open-address-registration');
  assert.equal(byId['address-registration'].menuTier, 'secondary');
  assert.equal(byId['friends'].route, '/portal#friends');
  assert.equal(byId['friends'].copy.en.label, 'Friends');
  assert.equal(byId['friends'].copy.ja.label, '友達');
  assert.match(byId['friends'].copy.en.description, /family, friends, aliases/);
  assert.equal(isAppSurfaceActive(byId['friends'], { pathname: '/portal', hash: '#friends' } as Location), true);
  assert.equal(isAppSurfaceActive(byId['address-portal'], { pathname: '/portal', hash: '#friends' } as Location), false);
  assert.equal(isAppSurfaceActive(byId['address-portal'], { pathname: '/portal', hash: '' } as Location), true);
  assert.equal(byId['pos-terminal'].route, '/pos');
  assert.equal(byId['hotel-checkin'].route, '/hotel');
  assert.equal(byId['oracle-opera-hotel-address'].route, '/opera');
  assert.equal(byId['oracle-opera-hotel-address'].status, 'ready');
  assert.equal(byId['address-portal'].route, '/portal');
  assert.equal(byId['address-portal'].copy.en.label, 'My Page');
  assert.equal(byId['address-portal'].copy.ja.label, 'マイページ');
  assert.match(byId['address-portal'].copy.en.description, /credentials, permissions, consent/);
  assert.equal(byId['store-topics'].route, '/playlist-commerce#topics');
  assert.equal(byId['store-topics'].copy.en.label, 'Topics');
  assert.equal(byId['store-discover'].route, '/playlist-commerce#discover');
  assert.match(byId['store-discover'].copy.en.description, /fixed 32/);
  assert.equal(byId['store-my-stores'].route, '/playlist-commerce#my-stores');
  assert.match(byId['store-my-stores'].copy.en.description, /revoke wallet-linked store access/);
  assert.equal(isAppSurfaceActive(byId['store-topics'], { pathname: '/playlist-commerce', hash: '#topics' } as Location), true);
  assert.equal(isAppSurfaceActive(byId['store-topics'], { pathname: '/playlist-commerce', hash: '#discover' } as Location), false);
  assert.match(byId['settings-policy'].copy.en.description, /devices, passkeys, revocation/);
  assert.equal(byId['address-dashboard'].route, '/dashboard');
  assert.equal(byId['machine-comms'].route, '/machine');
  assert.equal(byId['developer-console'].route, '/developer');
  assert.equal(byId['address-login'].route, '/address-login');
  assert.equal(byId['address-login'].status, 'ready');
  assert.equal(byId['address-login'].licenseProfile, undefined);
  assert.equal(byId['merchant-console'].route, '/merchant-console');
  assert.equal(byId['merchant-console'].status, 'ready');
  assert.equal(byId['merchant-console'].licenseProfile, 'commercial-private');
  assert.match(byId['merchant-console'].copy.en.description, /callback validator/);
  assert.equal(byId['playlist-commerce'].route, '/playlist-commerce');
  assert.equal(byId['playlist-commerce'].status, 'ready');
  assert.equal(byId['playlist-commerce'].licenseProfile, 'commercial-private');
  assert.match(byId['playlist-commerce'].copy.en.description, /Commercial\/private/);
  assert.equal(byId['agid-address-element'].route, '/element');
  assert.equal(byId['agid-address-element'].action, 'navigate');
  assert.equal(byId['agid-address-element'].status, 'ready');
  assert.equal(byId['evidence-vault'].route, '/evidence');
  assert.equal(byId['research-design-hub'].route, '/research');
  assert.equal(byId['research-design-hub'].menuTier, 'primary');
  assert.equal(byId['postal-zone-designer'].route, '/postal-zones');
  assert.equal(byId['open-locker-pudo-simulator'].route, '/locker');
  assert.equal(byId['drone-locker-ops'].route, '/ops');
  assert.equal(isStandaloneAppSurface(byId['open-source-home']), true);
  assert.equal(isStandaloneAppSurface(byId['veygrit-wallet']), true);
  assert.equal(isStandaloneAppSurface(byId['pos-terminal']), true);
  assert.equal(isStandaloneAppSurface(byId['hotel-checkin']), true);
  assert.equal(isStandaloneAppSurface(byId['oracle-opera-hotel-address']), true);
  assert.equal(isStandaloneAppSurface(byId['address-portal']), true);
  assert.equal(isStandaloneAppSurface(byId['machine-comms']), true);
  assert.equal(isStandaloneAppSurface(byId['developer-console']), true);
  assert.equal(isStandaloneAppSurface(byId['address-login']), true);
  assert.equal(isStandaloneAppSurface(byId['merchant-console']), true);
  assert.equal(isStandaloneAppSurface(byId['agid-address-element']), true);
  assert.equal(isStandaloneAppSurface(byId['evidence-vault']), true);
  assert.equal(isStandaloneAppSurface(byId['research-design-hub']), true);
  assert.equal(isStandaloneAppSurface(byId['postal-zone-designer']), true);
  assert.equal(isStandaloneAppSurface(byId['open-locker-pudo-simulator']), true);
  assert.equal(isStandaloneAppSurface(byId['drone-locker-ops']), true);
  assert.equal(isStandaloneAppSurface(byId['map-workspace']), false);
});

test('locker/PUDO and drone operations are ready routes, not roadmap placeholders', () => {
  const surfaces = getAppSurfaces(['admin', 'operator']);
  const locker = surfaces.find(surface => surface.id === 'open-locker-pudo-simulator');
  const ops = surfaces.find(surface => surface.id === 'drone-locker-ops');

  assert.ok(locker);
  assert.equal(locker.status, 'ready');
  assert.equal(locker.action, 'navigate');
  assert.equal(locker.deployment, 'standalone-route');
  assert.equal(locker.menuTier, 'secondary');

  assert.ok(ops);
  assert.equal(ops.status, 'ready');
  assert.equal(ops.action, 'navigate');
  assert.equal(ops.deployment, 'standalone-route');
  assert.equal(ops.menuTier, 'secondary');
});

test('app switcher copy supports Japanese and English without changing surface ids', () => {
  const pos = getAppSurfaces().find(surface => surface.id === 'pos-terminal');
  assert.ok(pos);

  assert.equal(normalizeAppNavigationLanguage('ja-JP'), 'ja');
  assert.equal(normalizeAppNavigationLanguage('en-US'), 'en');
  assert.equal(getAppSurfaceCopy(pos, 'ja-JP').shortLabel, 'POS');
  assert.equal(getAppSurfaceCopy(pos, 'en-US').label, 'AGID POS Terminal');
  assert.deepEqual(groupAppSurfaces().map(group => group.group.copy.ja.label), ['個人', '現場', '運用', '開発', '研究/設計']);
  assert.deepEqual(groupAppSurfaces().map(group => group.group.copy.en.label), ['Personal', 'Field', 'Operations', 'Development', 'Research / Design']);
});

test('hidden feature detection separates deep links from intentionally secondary workspace apps', () => {
  const audit = detectHiddenAppFeatures();
  const ids = audit.findings.map(finding => finding.surfaceId);
  const byId = Object.fromEntries(audit.findings.map(finding => [finding.surfaceId, finding]));
  const surfacesById = Object.fromEntries(getAppSurfaces().map(surface => [surface.id, surface]));

  assert.equal(audit.totalSurfaces, getAppSurfaces().length);
  assert.equal(audit.hiddenCount, audit.findings.length);
  assert.ok(audit.workspaceSecondary >= 7);
  assert.ok(audit.deepLinkModules >= 1);

  for (const expected of [
    'hotel-checkin',
    'oracle-opera-hotel-address',
    'field-handoff',
    'machine-comms',
    'evidence-vault',
    'postal-zone-designer',
    'open-locker-pudo-simulator',
    'drone-locker-ops',
  ]) {
    assert.ok(ids.includes(expected as typeof audit.findings[number]['surfaceId']), expected);
    assert.equal(byId[expected]?.discoverability, 'workspace-secondary');
    assert.match(byId[expected]?.recommendedAction ?? '', /All Apps launcher|hero lane/);
  }

  assert.equal(byId['address-review-console']?.discoverability, 'deep-link-module');
  assert.equal(byId['address-review-console']?.severity, 'high');
  assert.match(byId['address-review-console']?.recommendedAction ?? '', /dashboard tab/);

  assert.equal(classifyAppSurfaceDiscoverability(surfacesById['map-workspace']), 'primary-side-menu');
  assert.equal(classifyAppSurfaceDiscoverability(surfacesById['address-registration']), 'same-shell-action');
  assert.equal(classifyAppSurfaceDiscoverability(surfacesById['pos-terminal']), 'hero-lane');
  assert.equal(classifyAppSurfaceDiscoverability(surfacesById['developer-console']), 'secondary-side-menu');
  assert.equal(classifyAppSurfaceDiscoverability(surfacesById['merchant-console']), 'secondary-side-menu');

  assert.equal(ids.includes('map-workspace'), false);
  assert.equal(ids.includes('address-portal'), false);
  assert.equal(ids.includes('developer-console'), false);
  assert.equal(ids.includes('merchant-console'), false);
});
