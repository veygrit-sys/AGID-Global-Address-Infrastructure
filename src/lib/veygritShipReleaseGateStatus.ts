export type VeygritShipReleaseGateStatusEntry = {
  gate: string;
  command: string;
  boundary: string;
  nonClaim: string;
};

export type VeygritShipReleaseGateStatus = {
  version: 'veygrit-ship-release-gate-status-v0.1';
  source: 'docs/ops/veygrit-ship-release-gate-index.md';
  exposure: 'public-safe-no-identifiers';
  reviewState: 'local-gate-inventory';
  gateCount: number;
  gates: VeygritShipReleaseGateStatusEntry[];
  nonClaims: string[];
  remoteActionsAuthorized: false;
  productionTraffic: false;
};

const gates: VeygritShipReleaseGateStatusEntry[] = [
  {
    gate: 'verify:veygrit-ship-credential-surfaces',
    command: 'npm run verify:veygrit-ship-credential-surfaces',
    boundary: 'Guest, Merchant, and internal credential-surface separation',
    nonClaim: 'Passing does not prove live carrier credentials, carrier approval, label purchase authority, or production traffic.',
  },
  {
    gate: 'verify:veygrit-ship-sdk-readmes',
    command: 'npm run verify:veygrit-ship-sdk-readmes',
    boundary: 'Public SDK README credential-boundary handoff',
    nonClaim: 'Passing does not authorize browser carrier credential handling or public credential input.',
  },
  {
    gate: 'verify:veygrit-ship-sdk-packages',
    command: 'npm run verify:veygrit-ship-sdk-packages',
    boundary: 'JS and PHP package metadata readiness',
    nonClaim: 'Passing does not publish packages, validate registry behavior, or prove live carrier availability.',
  },
  {
    gate: 'verify:veygrit-ship-sdk-build-hygiene',
    command: 'npm run verify:veygrit-ship-sdk-build-hygiene',
    boundary: 'JS SDK local typecheck, build, and generated-output scan',
    nonClaim: 'Passing does not prove npm archive contents, registry provenance, or production runtime security.',
  },
  {
    gate: 'verify:veygrit-ship-sdk-package-archives',
    command: 'npm run verify:veygrit-ship-sdk-package-archives',
    boundary: 'JS dry-run package archive and PHP composer metadata',
    nonClaim: 'Passing does not create package archives, publish packages, or prove Packagist/npm registry readiness.',
  },
  {
    gate: 'verify:veygrit-ship-sdk-release-checklist',
    command: 'npm run verify:veygrit-ship-sdk-release-checklist',
    boundary: 'Public no-publish SDK release checklist',
    nonClaim: 'Passing does not authorize registry publication, hosted deployment, remote mutation, or production carrier traffic.',
  },
  {
    gate: 'verify:veygrit-ship-release-gate-index',
    command: 'npm run verify:veygrit-ship-release-gate-index',
    boundary: 'Operations gate inventory and command wiring',
    nonClaim: 'Passing does not add new operational evidence beyond index completeness.',
  },
  {
    gate: 'verify:veygrit-ship-release-gate-status',
    command: 'npm run verify:veygrit-ship-release-gate-status',
    boundary: 'Public-safe release gate status fixture and Guest route exposure',
    nonClaim: 'Passing does not certify live release state, deployment health, public uptime, or production carrier traffic readiness.',
  },
  {
    gate: 'verify:veygrit-ship-observability',
    command: 'npm run verify:veygrit-ship-observability',
    boundary: 'Logs, metrics, alerts, and bounded request identifiers',
    nonClaim: 'Passing does not prove production monitoring coverage, pager readiness, or live carrier SLOs.',
  },
  {
    gate: 'verify:veygrit-ship-backup-restore',
    command: 'npm run verify:veygrit-ship-backup-restore',
    boundary: 'Non-production backup and restore command safety',
    nonClaim: 'Passing does not authorize production restores or prove disaster recovery objectives.',
  },
  {
    gate: 'verify:preaudit-secrets',
    command: 'npm run verify:preaudit-secrets',
    boundary: 'Repository pre-audit secret scan',
    nonClaim: 'Passing does not prove secret absence in every future file, external system, or private runtime.',
  },
  {
    gate: 'verify:veygrit-ship-dependency-lock',
    command: 'npm run verify:veygrit-ship-dependency-lock',
    boundary: 'Critical dependency lockfile policy',
    nonClaim: 'Passing does not prove all transitive dependencies are safe or production-approved.',
  },
  {
    gate: 'verify:dependency-audit',
    command: 'npm run verify:dependency-audit',
    boundary: 'npm dependency vulnerability audit',
    nonClaim: 'Passing does not prove non-npm dependencies, cloud services, or carrier integrations are risk-free.',
  },
];

const nonClaims = [
  'This status summary is not production release approval.',
  'This status summary includes no tenant, request, raw address, recipient, credential, witness, private-key, proof-secret, package archive, or production carrier identifiers.',
  'Passing listed gates does not prove live carrier approval, registry publication readiness, cloud IAM, production credential rotation, hosted deployment safety, public uptime, or production carrier traffic readiness.',
];

export function getVeygritShipReleaseGateStatus(): VeygritShipReleaseGateStatus {
  return {
    version: 'veygrit-ship-release-gate-status-v0.1',
    source: 'docs/ops/veygrit-ship-release-gate-index.md',
    exposure: 'public-safe-no-identifiers',
    reviewState: 'local-gate-inventory',
    gateCount: gates.length,
    gates: gates.map(entry => ({ ...entry })),
    nonClaims: [...nonClaims],
    remoteActionsAuthorized: false,
    productionTraffic: false,
  };
}
