export const HEXASHIP_BRAND_TRANSITION_VERSION = 'hexaship-brand-transition-v0.1';

export type HexashipBrandTransitionPhase = {
  id: 'brand-decision' | 'dual-name-contracts' | 'sdk-alias' | 'docs-migration' | 'package-migration';
  title: string;
  action: string;
  verification: string[];
  nonBreaking: boolean;
};

export type HexashipBrandTransition = {
  version: typeof HEXASHIP_BRAND_TRANSITION_VERSION;
  primaryBrand: 'Hexaship';
  legacyBrand: 'Skipship';
  packageNameTarget: '@hexaship/js';
  packageNameLegacy: '@skipship/js';
  tagline: string;
  namingPolicy: {
    publicProductName: 'Hexaship';
    codeAliasPolicy: 'keep-skipship-exports-until-v1';
    headerPolicy: 'keep-skipship-headers-until-openapi-v1';
    routePolicy: 'do-not-change-v1-routes-during-brand-migration';
  };
  phases: HexashipBrandTransitionPhase[];
  blockedMoves: string[];
  nonClaims: string[];
};

export const HEXASHIP_BRAND_TRANSITION_PHASES: HexashipBrandTransitionPhase[] = [
  {
    id: 'brand-decision',
    title: 'Brand decision memo',
    action: 'Adopt Hexaship as the product and company-facing brand while treating Skipship as the legacy developer alias.',
    verification: ['verify:skipship-strategy'],
    nonBreaking: true,
  },
  {
    id: 'dual-name-contracts',
    title: 'Dual-name contract window',
    action: 'Document Hexaship names beside existing Skipship OpenAPI operation IDs, headers, routes, and fixtures.',
    verification: ['verify:delivery-gateway-carrier-api', 'verify:skipship-idempotency-openapi'],
    nonBreaking: true,
  },
  {
    id: 'sdk-alias',
    title: 'SDK alias package',
    action: 'Introduce @hexaship/js as an alias package that re-exports the existing @skipship/js client before renaming symbols.',
    verification: ['verify:hexaship-js', 'verify:skipship-js'],
    nonBreaking: true,
  },
  {
    id: 'docs-migration',
    title: 'Docs migration',
    action: 'Update product docs to lead with Hexaship and include Skipship legacy references for search and compatibility.',
    verification: ['verify:skipship-strategy'],
    nonBreaking: true,
  },
  {
    id: 'package-migration',
    title: 'Package migration',
    action: 'After SDK alias adoption, rename public examples from skipship.* to hexaship.* while retaining deprecated Skipship exports.',
    verification: ['verify:skipship-js', 'verify:delivery-gateway-carrier-api'],
    nonBreaking: false,
  },
];

export function buildHexashipBrandTransition(): HexashipBrandTransition {
  return {
    version: HEXASHIP_BRAND_TRANSITION_VERSION,
    primaryBrand: 'Hexaship',
    legacyBrand: 'Skipship',
    packageNameTarget: '@hexaship/js',
    packageNameLegacy: '@skipship/js',
    tagline: 'One API, ID, and wallet layer for carrier-agnostic shipping infrastructure.',
    namingPolicy: {
      publicProductName: 'Hexaship',
      codeAliasPolicy: 'keep-skipship-exports-until-v1',
      headerPolicy: 'keep-skipship-headers-until-openapi-v1',
      routePolicy: 'do-not-change-v1-routes-during-brand-migration',
    },
    phases: HEXASHIP_BRAND_TRANSITION_PHASES,
    blockedMoves: [
      'Do not rename HTTP headers such as skipship-idempotency-key before OpenAPI v1 compatibility is published.',
      'Do not delete @skipship/js exports while Merchant Console, sandbox routes, or fixtures still import them.',
      'Do not claim trademark clearance, global availability, or carrier partnership coverage from the name change alone.',
      'Do not move production credentials, raw addresses, recipient contacts, proof witnesses, or carrier secrets into migration fixtures.',
    ],
    nonClaims: [
      'Hexaship is a brand transition plan, not a trademark clearance result.',
      'Hexaship naming does not imply carrier partnerships or global delivery coverage.',
      'Legacy Skipship APIs remain compatibility surfaces until explicit v1 migration gates pass.',
    ],
  };
}

export function validateHexashipBrandTransition(plan = buildHexashipBrandTransition()): string[] {
  const errors: string[] = [];
  const phaseIds = new Set(plan.phases.map(phase => phase.id));

  for (const required of ['brand-decision', 'dual-name-contracts', 'sdk-alias', 'docs-migration', 'package-migration'] as const) {
    if (!phaseIds.has(required)) errors.push(`missing phase: ${required}`);
  }
  if (plan.primaryBrand !== 'Hexaship') errors.push('primary brand must be Hexaship');
  if (plan.legacyBrand !== 'Skipship') errors.push('legacy brand must be Skipship');
  if (plan.packageNameTarget !== '@hexaship/js') errors.push('target package must be @hexaship/js');
  if (plan.namingPolicy.headerPolicy !== 'keep-skipship-headers-until-openapi-v1') errors.push('headers must stay compatible');
  if (plan.namingPolicy.routePolicy !== 'do-not-change-v1-routes-during-brand-migration') errors.push('routes must stay compatible');
  if (!plan.phases.slice(0, 4).every(phase => phase.nonBreaking)) errors.push('early migration phases must be non-breaking');
  if (!plan.blockedMoves.some(move => /HTTP headers/i.test(move))) errors.push('missing header migration blocker');
  if (!plan.nonClaims.some(nonClaim => /trademark clearance/i.test(nonClaim))) errors.push('missing trademark non-claim');
  if (!plan.nonClaims.some(nonClaim => /carrier partnerships/i.test(nonClaim))) errors.push('missing carrier partnership non-claim');

  return errors;
}
