export const PRIVACY_HUMAN_RIGHTS_PRINCIPLES_VERSION = 'privacy-human-rights-principles-v1';

export type PrivacyHumanRightsPrincipleId =
  | 'ethereum-optional'
  | 'local-first'
  | 'no-raw-address-by-default'
  | 'human-rights-safety';

export type PrivacyHumanRightsPrinciple = {
  id: PrivacyHumanRightsPrincipleId;
  label: string;
  shortStatement: string;
  requirement: string;
  mustNot: string[];
  implementationSignals: string[];
};

export type PrivacyHumanRightsPositioning = {
  version: typeof PRIVACY_HUMAN_RIGHTS_PRINCIPLES_VERSION;
  headline: string;
  oneSentence: string;
  defaultMode: 'local-first';
  ethereumRequirement: 'optional';
  rawAddressDefault: 'forbidden-outside-local-or-encrypted-private-storage';
  principles: PrivacyHumanRightsPrinciple[];
  releaseReadinessChecks: string[];
};

export const PRIVACY_HUMAN_RIGHTS_PRINCIPLES: PrivacyHumanRightsPrinciple[] = [
  {
    id: 'ethereum-optional',
    label: 'Ethereum optional',
    shortStatement: 'AGID/AOID must work without wallets, gas, public ledgers, or crypto payments.',
    requirement:
      'Ethereum, L2 registries, and token/payment flows are optional verification or settlement layers. They must never be required for local address generation, local validation, QR/NFC intake, AGID-S decryption, user revocation, export, deletion, or high-risk safety workflows.',
    mustNot: [
      'Do not market AGID/AOID as token-first infrastructure.',
      'Do not publish raw address, AGID-S, AOID, precise coordinates, or delivery history on chain.',
      'Do not make a wallet or gas payment a prerequisite for basic access, revocation, deletion, or local safety.',
    ],
    implementationSignals: [
      'Mode 0 Local Only and Mode 1 Server Registry stay available without Ethereum.',
      'On-chain records, when used, are limited to issuer metadata, commitments, roots, nullifiers, verifier status, and payments.',
      'Web3 SDKs sit behind explicit adapters and cannot change the privacy boundary.',
    ],
  },
  {
    id: 'local-first',
    label: 'Local-first',
    shortStatement: 'The safe baseline is offline-capable local resolution, local proof preparation, and user-controlled disclosure.',
    requirement:
      'AGID generation, AGID decode, address display, language tabs, postal assistance, QR/NFC intake, AGID-S local decryption, and basic POS receipts must run locally whenever feasible. Network services are opt-in evidence, sync, registry, or settlement layers.',
    mustNot: [
      'Do not require a central tracking server for basic address display or POS handoff decisions.',
      'Do not send uploaded evidence, OCR drafts, raw address candidates, or private AOID bodies to external services by default.',
      'Do not treat loss of network access as loss of user agency in disaster, field, or high-risk workflows.',
    ],
    implementationSignals: [
      'Local resolver and Address Element are first-class OSS surfaces.',
      'Offline queue and deferred sync preserve field operation without immediate registry access.',
      'External address data, cloud sync, and managed services remain explicit opt-in paths.',
    ],
  },
  {
    id: 'no-raw-address-by-default',
    label: 'No raw address by default',
    shortStatement: 'Public payloads, logs, reports, examples, and registries store commitments, aliases, roots, and redacted evidence, not raw addresses.',
    requirement:
      'Raw addresses, AOID plaintext, recipient names, phone numbers, unit details, proof codes, AGID-S plaintext/ciphertext from real deployments, and precise coordinates must stay local, encrypted, or redacted unless a user explicitly grants a scoped disclosure.',
    mustNot: [
      'Do not place raw address material in public API responses, public QR payloads, audit exports, Address DNS, Ethereum, examples, or release documents.',
      'Do not use AOID as a global public tracking identifier.',
      'Do not persist proof witnesses, recipient secrets, or raw proof codes in logs.',
    ],
    implementationSignals: [
      'Run no-raw-address and mandatory security release gates before release.',
      'Use short-term aliases, domain-separated nullifiers, and commitments for operational references.',
      'Keep audit logs redacted with a recorded redaction policy version.',
    ],
  },
  {
    id: 'human-rights-safety',
    label: 'Human-rights safety',
    shortStatement: 'The system is designed to reduce address exposure for people under surveillance, displacement, abuse, or disaster risk.',
    requirement:
      'High-risk workflows must prefer coarse disclosure, AGID-S, short expiries, immediate revocation/used-state marking, no address-history retention, and clear consent. Users must be able to understand, refuse, revoke, export, and delete address permissions.',
    mustNot: [
      'Do not design high-risk safety, deletion, revocation, or local decryption as paid-only features.',
      'Do not expose precise AGID, raw address, phone, recipient name, or proof code in domestic-violence, refugee, humanitarian, or censorship-risk contexts.',
      'Do not make address evidence collection a surveillance feed or undisclosed AI training pipeline.',
    ],
    implementationSignals: [
      'High-risk mode hides precise address material and disables address-history retention.',
      'Address Portal exposes consent, scope, revocation, deletion, and export controls.',
      'Feedback and OCR learning require explicit consent and redaction-first handling.',
    ],
  },
];

export function getPrivacyHumanRightsPositioning(): PrivacyHumanRightsPositioning {
  return {
    version: PRIVACY_HUMAN_RIGHTS_PRINCIPLES_VERSION,
    headline: 'Privacy-preserving address infrastructure for human rights, logistics, and local-first operation.',
    oneSentence:
      'AGID/AOID is local-first, Ethereum-optional, and no-raw-address-by-default: it lets people resolve, prove, and hand off address-derived facts without turning raw addresses into a public or centralized tracking layer.',
    defaultMode: 'local-first',
    ethereumRequirement: 'optional',
    rawAddressDefault: 'forbidden-outside-local-or-encrypted-private-storage',
    principles: PRIVACY_HUMAN_RIGHTS_PRINCIPLES,
    releaseReadinessChecks: [
      'npm run verify:no-raw-address',
      'npm run verify:mandatory-security',
      'npm run verify:external-audit',
      'npm run verify:preaudit-secrets',
      'npm run lint',
    ],
  };
}

export function validatePrivacyHumanRightsPositioning(
  positioning: PrivacyHumanRightsPositioning = getPrivacyHumanRightsPositioning(),
) {
  const errors: string[] = [];
  const principleIds = new Set(positioning.principles.map(principle => principle.id));

  if (positioning.ethereumRequirement !== 'optional') errors.push('ethereum-must-remain-optional');
  if (positioning.defaultMode !== 'local-first') errors.push('default-mode-must-be-local-first');
  if (positioning.rawAddressDefault !== 'forbidden-outside-local-or-encrypted-private-storage') {
    errors.push('raw-address-default-must-be-forbidden');
  }

  for (const required of ['ethereum-optional', 'local-first', 'no-raw-address-by-default', 'human-rights-safety'] as const) {
    if (!principleIds.has(required)) errors.push(`missing-principle:${required}`);
  }

  for (const principle of positioning.principles) {
    if (!principle.shortStatement.trim()) errors.push(`missing-short-statement:${principle.id}`);
    if (!principle.requirement.trim()) errors.push(`missing-requirement:${principle.id}`);
    if (principle.mustNot.length === 0) errors.push(`missing-must-not:${principle.id}`);
    if (principle.implementationSignals.length === 0) errors.push(`missing-implementation-signals:${principle.id}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
