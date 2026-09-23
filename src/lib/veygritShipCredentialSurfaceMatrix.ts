export const VEYGRIT_SHIP_CREDENTIAL_SURFACE_MATRIX_VERSION = 'veygrit-ship-credential-surface-matrix-v0.1' as const;

export type VeygritShipCredentialSurfaceId =
  | 'guest-public'
  | 'merchant-control-plane'
  | 'internal-carrier-runtime';

export type VeygritShipCredentialSurface = {
  id: VeygritShipCredentialSurfaceId;
  audience: string;
  examples: string[];
  credentialInput: 'none' | 'private-merchant-admin-mfa-only' | 'server-runtime-only';
  publicCredentialVisibility: 'none' | 'masked-status-only';
  persistedCredentialMaterial: 'never';
  persistedCredentialReference: 'none' | 'merchant-row-secret-reference-only';
  allowedCredentialReferenceFormats: string[];
  verificationCommands: string[];
  nonClaims: string[];
};

export const VEYGRIT_SHIP_CREDENTIAL_SURFACES: VeygritShipCredentialSurface[] = [
  {
    id: 'guest-public',
    audience: 'Anonymous Guest sessions and public Sites/Sandbox route readers',
    examples: [
      'GET /v1/guest/access-policy',
      'POST /v1/guest/sessions',
      'GET /v1/guest/session',
      'POST /v1/guest/shipment-drafts',
    ],
    credentialInput: 'none',
    publicCredentialVisibility: 'none',
    persistedCredentialMaterial: 'never',
    persistedCredentialReference: 'none',
    allowedCredentialReferenceFormats: [],
    verificationCommands: [
      'npm run verify:veygrit-ship-guest-access',
    ],
    nonClaims: [
      'Guest sessions do not create, store, return, or promote carrier credential references.',
      'Guest route success is not proof of Merchant account ownership, carrier account approval, live labels, or production carrier traffic.',
    ],
  },
  {
    id: 'merchant-control-plane',
    audience: 'Authenticated Merchant administrators in the private backend control plane',
    examples: [
      'CarrierSecretManagementService.writeCredentials',
      'PostgresVeygritShipStore.upsertCarrierConnection',
    ],
    credentialInput: 'private-merchant-admin-mfa-only',
    publicCredentialVisibility: 'masked-status-only',
    persistedCredentialMaterial: 'never',
    persistedCredentialReference: 'merchant-row-secret-reference-only',
    allowedCredentialReferenceFormats: [
      'secretref_*',
      'arn:aws:secretsmanager:*',
      'vault://*',
      'https://*.vault.azure.net/secrets/*',
      'projects/*/secrets/*/versions/*',
    ],
    verificationCommands: [
      'npm run verify:veygrit-ship-secret-management',
      'npm run verify:veygrit-ship-store',
    ],
    nonClaims: [
      'A stored carrier connection reference is not proof of carrier approval, valid live credentials, or label purchase authority.',
      'Masked status output is not a credential export surface.',
    ],
  },
  {
    id: 'internal-carrier-runtime',
    audience: 'Server-side carrier adapters, workers, and operator-only runtime jobs',
    examples: [
      'UPS/DHL internal carrier routes',
      'Veygrit Ship workers',
      'Label and tracking reconciliation jobs',
    ],
    credentialInput: 'server-runtime-only',
    publicCredentialVisibility: 'none',
    persistedCredentialMaterial: 'never',
    persistedCredentialReference: 'merchant-row-secret-reference-only',
    allowedCredentialReferenceFormats: [
      'secretref_*',
      'arn:aws:secretsmanager:*',
      'vault://*',
      'https://*.vault.azure.net/secrets/*',
      'projects/*/secrets/*/versions/*',
    ],
    verificationCommands: [
      'npm run verify:ups-live-connector',
      'npm run verify:dhl-live-connectors',
      'npm run verify:veygrit-ship-label-management',
      'npm run verify:veygrit-ship-workers',
    ],
    nonClaims: [
      'Internal adapter availability is not a public credential visibility grant.',
      'OSS capability metadata is not production carrier credential evidence or a live carrier contract.',
    ],
  },
];

export function renderVeygritShipCredentialSurfaceMatrixMarkdown(): string {
  const rows = VEYGRIT_SHIP_CREDENTIAL_SURFACES.map(surface => [
    surface.id,
    surface.audience,
    surface.credentialInput,
    surface.publicCredentialVisibility,
    surface.persistedCredentialReference,
    surface.verificationCommands.join('<br>'),
  ]);

  return [
    '# Veygrit Ship Credential Surface Matrix',
    '',
    `Version: \`${VEYGRIT_SHIP_CREDENTIAL_SURFACE_MATRIX_VERSION}\``,
    '',
    '| Surface | Audience | Credential input | Public visibility | Persisted reference | Verification |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map(row => `| ${row.join(' | ')} |`),
    '',
    '## Allowed Reference Formats',
    '',
    ...VEYGRIT_SHIP_CREDENTIAL_SURFACES
      .filter(surface => surface.allowedCredentialReferenceFormats.length > 0)
      .map(surface => `- \`${surface.id}\`: ${surface.allowedCredentialReferenceFormats.map(format => `\`${format}\``).join(', ')}`),
    '',
    '## Non-Claims',
    '',
    ...VEYGRIT_SHIP_CREDENTIAL_SURFACES.flatMap(surface => [
      `### ${surface.id}`,
      '',
      ...surface.nonClaims.map(nonClaim => `- ${nonClaim}`),
      '',
    ]).map(line => line.trimEnd()),
  ].join('\n').trimEnd() + '\n';
}
