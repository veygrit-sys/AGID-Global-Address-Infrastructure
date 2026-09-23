export const VEYGRIT_SITES_REF_FIXTURES_VERSION = 'veygrit-sites-ref-fixtures-v0.1';

export type VeygritSitesRefFixtureKind = 'address' | 'phone' | 'recipient' | 'asset';

export type VeygritSitesRefFixture = {
  exportName: string;
  kind: VeygritSitesRefFixtureKind;
  refId: string;
  usedBy: string[];
  inlineScreenLiteralAllowed: false;
  rawMaterialClass: 'blocked-by-policy';
};

export type VeygritSitesRefFixtureValidation = {
  ok: boolean;
  errors: string[];
};

function escapeJsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const REF_ID_PATTERNS: Record<VeygritSitesRefFixtureKind, RegExp> = {
  address: /^addr_ref_[a-z0-9_]+$/,
  phone: /^phone_ref_[a-z0-9_]+$/,
  recipient: /^recipient_ref_[a-z0-9_]+$/,
  asset: /^[a-z0-9-]+-ref\.(?:png|svg)$/,
};

export function buildVeygritSitesRefFixtures(): VeygritSitesRefFixture[] {
  return [
    {
      exportName: 'ADDRESS_REF_HOME_PRIMARY_DISPLAY',
      kind: 'address',
      refId: 'addr_ref_home_primary_display',
      usedBy: ['home-primary-addresses', 'recent-deliveries'],
      inlineScreenLiteralAllowed: false,
      rawMaterialClass: 'blocked-by-policy',
    },
    {
      exportName: 'PHONE_REF_WALLET_PRIMARY',
      kind: 'phone',
      refId: 'phone_ref_wallet_primary',
      usedBy: ['home-primary-addresses', 'delivery-history'],
      inlineScreenLiteralAllowed: false,
      rawMaterialClass: 'blocked-by-policy',
    },
    {
      exportName: 'RECIPIENT_REF_CHECKOUT_FORM',
      kind: 'recipient',
      refId: 'recipient_ref_checkout_form',
      usedBy: ['demo-ec-checkout', 'delivery-gateway-handoff'],
      inlineScreenLiteralAllowed: false,
      rawMaterialClass: 'blocked-by-policy',
    },
    {
      exportName: 'PROFILE_QR_REF_FILENAME',
      kind: 'asset',
      refId: 'profile-qr-ref.png',
      usedBy: ['profile-qr-download'],
      inlineScreenLiteralAllowed: false,
      rawMaterialClass: 'blocked-by-policy',
    },
  ];
}

export function validateVeygritSitesRefFixtures(
  fixtures = buildVeygritSitesRefFixtures(),
): VeygritSitesRefFixtureValidation {
  const errors: string[] = [];
  const exportNames = new Set<string>();
  const refIds = new Set<string>();

  for (const fixture of fixtures) {
    if (!/^[A-Z][A-Z0-9_]+$/.test(fixture.exportName)) {
      errors.push(`invalid-export-name:${fixture.exportName}`);
    }
    if (exportNames.has(fixture.exportName)) {
      errors.push(`duplicate-export-name:${fixture.exportName}`);
    }
    exportNames.add(fixture.exportName);

    if (refIds.has(fixture.refId)) {
      errors.push(`duplicate-ref-id:${fixture.exportName}`);
    }
    refIds.add(fixture.refId);

    if (!REF_ID_PATTERNS[fixture.kind].test(fixture.refId)) {
      errors.push(`invalid-ref-shape:${fixture.exportName}`);
    }
    if (/(?:raw|secret|token|private|credential)/i.test(fixture.refId)) {
      errors.push(`unsafe-ref-word:${fixture.exportName}`);
    }
    if (fixture.inlineScreenLiteralAllowed) {
      errors.push(`inline-screen-literal-allowed:${fixture.exportName}`);
    }
    if (fixture.rawMaterialClass !== 'blocked-by-policy') {
      errors.push(`unexpected-raw-material-class:${fixture.exportName}`);
    }
    if (fixture.usedBy.length === 0) {
      errors.push(`missing-usage:${fixture.exportName}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function renderVeygritSitesRefFixturesModule(
  fixtures = buildVeygritSitesRefFixtures(),
): string {
  const validation = validateVeygritSitesRefFixtures(fixtures);
  if (!validation.ok) {
    throw new Error(`invalid-veygrit-sites-ref-fixtures:${validation.errors.join(',')}`);
  }

  return [
    '// Generated from AGID src/lib/veygritSitesRefFixtures.ts.',
    '// Run `npm run sync:veygrit-sites-ref-fixtures` from AGID to refresh.',
    '',
    ...fixtures.map(fixture => `export const ${fixture.exportName} = '${escapeJsString(fixture.refId)}';`),
    '',
  ].join('\n');
}
