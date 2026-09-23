import type { SourceBoundaryEntry } from './sourceBoundary';

export const COMMERCIAL_SOURCE_BOUNDARY_ENTRIES: SourceBoundaryEntry[] = [
  {
    id: 'hosted-registry-managed-service',
    label: 'Hosted Registry API managed operations',
    boundary: 'commercial',
    license: 'Commercial',
    currentPaths: [
      'src/lib/agidRegistryApi.ts',
      'src/lib/agidRegistryApiClient.ts',
      'src/server/**',
      'server.ts',
      'docs/hosted-registry-api.md',
    ],
    recommendedPaths: [
      'services/commercial/hosted-registry/**',
      'apps/commercial/registry-ops/**',
    ],
    compatibility: {
      stableImport: 'src/lib/agidRegistryApi.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: false,
      notes: [
        'OpenAPI schemas and self-host fixtures stay OSS; hosted uptime, abuse control, and operations are commercial.',
        'Keep client compatibility while extracting server-side operations.',
      ],
    },
    ossFallback: [
      'packages/oss/registry-schema/**',
      'self-hosted issuer/revocation/freshness/nullifier registry',
    ],
    commercialDependsOn: [
      'agid-aoid-public-standards',
      'privacy-security-release-gates',
    ],
    guardrails: [
      'Registry stores commitments, roots, nullifiers, status, and issuer metadata only.',
      'Raw address and AGID-S payloads are not registry records.',
    ],
  },
  {
    id: 'enterprise-console-dashboard',
    label: 'Enterprise Console, Dashboard, API keys, webhooks, and SLA operations',
    boundary: 'commercial',
    license: 'Commercial',
    currentPaths: [
      'src/components/AddressDashboardScreen.tsx',
      'src/components/DeveloperConsoleScreen.tsx',
      'src/lib/developerConsole.ts',
      'src/lib/addressLaunchCenter.ts',
      'src/lib/settingsPolicyCenter.ts',
      'docs/address-platform-blueprint.md',
    ],
    recommendedPaths: [
      'apps/commercial/address-console/**',
      'services/commercial/developer-platform/**',
    ],
    compatibility: {
      stableImport: 'src/lib/developerConsole.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: false,
      notes: [
        'A minimal self-host dashboard can stay OSS; multi-tenant API keys, SLA, and retention move commercial.',
        'Developer-facing OpenAPI and test vectors remain public.',
      ],
    },
    ossFallback: [
      'apps/oss/developer-console-reference/**',
      'OpenAPI viewer',
      'redacted local event viewer',
    ],
    commercialDependsOn: [
      'developer-docs-research-and-test-vectors',
      'privacy-security-release-gates',
    ],
    guardrails: [
      'Dashboard logs are redacted by default.',
      'Raw evidence escalation requires role, scope, and audit reason.',
    ],
  },
  {
    id: 'advanced-pos-terminal-management',
    label: 'Advanced POS terminal fleet, staff permissions, and certified device support',
    boundary: 'commercial',
    license: 'Commercial',
    currentPaths: [
      'src/lib/addressTerminal.ts',
      'src/lib/posOperationalControls.ts',
      'src/lib/posUiHardening.ts',
      'docs/address-connect-terminal.md',
      'docs/pos-ui-hardening-ja.md',
    ],
    recommendedPaths: [
      'apps/commercial/terminal-fleet/**',
      'services/commercial/device-health/**',
    ],
    compatibility: {
      stableImport: 'src/lib/addressTerminal.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: false,
      notes: [
        'Basic POS remains OSS; remote fleet operations and certified hardware profiles can be commercial.',
        'Device diagnostics must remain compatible with local terminal events.',
      ],
    },
    ossFallback: [
      'apps/oss/pos-terminal/**',
      'local scanner/printer/cash-drawer/measurement diagnostics',
    ],
    commercialDependsOn: [
      'basic-pos-terminal',
      'privacy-security-release-gates',
    ],
    guardrails: [
      'Device telemetry excludes raw address and AGID-S payloads.',
      'Field operation must continue in offline/local mode.',
    ],
  },
  {
    id: 'advanced-review-radar-signal',
    label: 'Advanced Review Console, Address Radar, and risk operations',
    boundary: 'commercial',
    license: 'Commercial',
    currentPaths: [
      'src/lib/addressRadar.ts',
      'src/lib/addressSignal.ts',
      'src/lib/addressOperations.ts',
      'src/lib/addressVerificationBenchmark.ts',
      'docs/address-element-radar.md',
      'docs/address-operations.md',
    ],
    recommendedPaths: [
      'apps/commercial/review-console/**',
      'services/commercial/address-radar/**',
    ],
    compatibility: {
      stableImport: 'src/lib/addressRadar.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: false,
      notes: [
        'Basic rules and reason-code schema stay OSS; tuned review operations and case SLA can be commercial.',
        'Address Radar must remain explainable even when hosted.',
      ],
    },
    ossFallback: [
      'packages/oss/risk-rules/**',
      'local needs-review/reject/pass reason codes',
    ],
    commercialDependsOn: [
      'local-resolver-address-display',
      'privacy-security-release-gates',
    ],
    guardrails: [
      'Risk results use explainable reason codes.',
      'Risk features are redacted before dashboards and webhooks.',
    ],
  },
  {
    id: 'managed-evidence-vault',
    label: 'Managed Evidence Vault, OCR operations, legal hold, and retention',
    boundary: 'commercial',
    license: 'Commercial',
    currentPaths: [
      'src/components/EvidenceVaultScreen.tsx',
      'src/lib/addressEvidenceVault.ts',
      'src/lib/addressDocumentReading.ts',
      'src/lib/addressEvidence.ts',
      'docs/address-evidence-vault.md',
    ],
    recommendedPaths: [
      'apps/commercial/evidence-vault/**',
      'services/commercial/evidence-retention/**',
    ],
    compatibility: {
      stableImport: 'src/lib/addressEvidenceVault.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: false,
      notes: [
        'Local evidence envelope and editable OCR candidates stay OSS.',
        'Managed storage, legal hold, and OCR compute can be commercial.',
      ],
    },
    ossFallback: [
      'packages/oss/evidence-envelope/**',
      'local OCR candidate editing',
      'local redaction workflow',
    ],
    commercialDependsOn: [
      'privacy-security-release-gates',
      'address-portal-user-control',
    ],
    guardrails: [
      'Evidence is encrypted and redacted before managed sync.',
      'External OCR must be opt-in and auditable.',
    ],
  },
  {
    id: 'managed-zk-proof-generation',
    label: 'Managed ZK proof generation, proof queue, and prover infrastructure',
    boundary: 'commercial',
    license: 'Commercial',
    currentPaths: [
      'src/lib/managedZkProofServer.ts',
      'docs/managed-zk-proof-generation-server.md',
    ],
    recommendedPaths: [
      'services/commercial/managed-zk-proof/**',
      'apps/commercial/zk-ops/**',
    ],
    compatibility: {
      stableImport: 'src/lib/managedZkProofServer.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: false,
      notes: [
        'Managed proving is an operations layer over public circuits.',
        'Self-host prover instructions must remain available.',
      ],
    },
    ossFallback: [
      'packages/oss/zk-address-predicates/**',
      'self-host prover path',
      'verifier fixtures',
    ],
    commercialDependsOn: [
      'zk-baseline-open-proof-relations',
      'privacy-security-release-gates',
    ],
    guardrails: [
      'Witnesses and private inputs are never logged.',
      'Public signals must pass leakage checks before deployment.',
    ],
  },
  {
    id: 'private-deployment-and-support',
    label: 'Private deployments for municipalities, NGOs, carriers, and enterprises',
    boundary: 'commercial',
    license: 'Commercial',
    currentPaths: [
      'src/lib/privateDeployment.ts',
      'docs/private-deployment-for-public-sector-and-carriers.md',
    ],
    recommendedPaths: [
      'enterprise/private-deployments/**',
      'services/commercial/support/**',
    ],
    compatibility: {
      stableImport: 'src/lib/privateDeployment.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: false,
      notes: [
        'Implementation support can be commercial without closing the standard.',
        'High-risk public-sector deployments must keep local-first and no-raw-address defaults.',
      ],
    },
    ossFallback: [
      'docs/oss/deployment-guides/**',
      'self-host reference stack',
    ],
    commercialDependsOn: [
      'agid-aoid-public-standards',
      'local-resolver-address-display',
      'basic-pos-terminal',
      'privacy-security-release-gates',
    ],
    guardrails: [
      'Do not claim legal compliance automatically.',
      'Private deployments must preserve export, deletion, and revocation rights.',
    ],
  },
  {
    id: 'payment-settlement-carrier-label-managed',
    label: 'Payment, settlement, escrow, waybill, and carrier label operations',
    boundary: 'commercial',
    license: 'Commercial',
    currentPaths: [
      'src/lib/posEthereumPayment.ts',
      'src/lib/carrierLabelIntent.ts',
      'src/lib/shippingLabelQr.ts',
      'src/lib/veyFinance.ts',
      'docs/pos-ethereum-payment-gate.md',
      'docs/vey-finance-trade-execution-robot-ja.md',
    ],
    recommendedPaths: [
      'services/commercial/payment-settlement/**',
      'services/commercial/carrier-labels/**',
      'apps/commercial/finance-ops/**',
    ],
    compatibility: {
      stableImport: 'src/lib/carrierLabelIntent.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: false,
      notes: [
        'Waybill QR schema and local receipt state stay OSS.',
        'Escrow, settlement, customs remittance, and carrier API operations can be commercial or regulated modules.',
      ],
    },
    ossFallback: [
      'packages/oss/waybill-qr/**',
      'local payment status records',
      'manual carrier label workflow',
    ],
    commercialDependsOn: [
      'basic-pos-terminal',
      'developer-docs-research-and-test-vectors',
    ],
    guardrails: [
      'Payment records use aliases, commitments, and receipt hashes.',
      'Do not put raw addresses or private customs evidence into public payment events.',
    ],
  },
];

export const DUAL_CONTRACT_SOURCE_BOUNDARY_ENTRIES: SourceBoundaryEntry[] = [
  {
    id: 'veygrit-id-address-login',
    label: 'Veygrit ID address social-login protocol and hosted identity service',
    boundary: 'dual-contract',
    license: 'Apache-2.0',
    currentPaths: [
      'src/lib/veygritId.ts',
      'docs/veygrit-id-address-social-login-ja.md',
    ],
    recommendedPaths: [
      'packages/oss/veygrit-id-protocol/**',
      'apps/commercial/veygrit-id-hosted/**',
    ],
    compatibility: {
      stableImport: 'src/lib/veygritId.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: true,
      notes: [
        'Protocol, scope model, consent screen contract, and SDK stay OSS.',
        'Hosted IdP, partner KYB review, API key operations, and abuse operations can be commercial.',
      ],
    },
    ossFallback: [
      'self-hostable authorization server contract',
      'local consent and connected-site portal',
    ],
    commercialDependsOn: [
      'address-portal-user-control',
      'privacy-security-release-gates',
    ],
    guardrails: [
      'Only reviewed organizations should get production client credentials.',
      'Never disclose address, passport-name fields, or phone without explicit scoped consent.',
    ],
  },
  {
    id: 'postal-zone-designer-governance',
    label: 'Postal Zone Designer mathematical model, GIS drafting, and official governance workflow',
    boundary: 'dual-contract',
    license: 'Apache-2.0',
    currentPaths: [
      'src/components/PostalZoneDesignerScreen.tsx',
      'src/lib/postalZoneDesigner.ts',
      'src/lib/agidPostalCodeEngine.ts',
      'docs/agid-postal-code-design-engine-ja.md',
    ],
    recommendedPaths: [
      'apps/oss/postal-zone-designer/**',
      'services/commercial/postal-governance-workflow/**',
    ],
    compatibility: {
      stableImport: 'src/lib/postalZoneDesigner.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: true,
      notes: [
        'Mathematical model, local GIS drafting, and conformance checks stay OSS.',
        'Official approval workflow, municipality collaboration, and managed GIS review can be commercial services.',
      ],
    },
    ossFallback: [
      'local postal-zone simulation',
      'draft/pilot/export without official managed approval',
    ],
    commercialDependsOn: [
      'local-resolver-address-display',
      'developer-docs-research-and-test-vectors',
    ],
    guardrails: [
      'Generated AGID postal zones must not claim official status without authority approval.',
      'Use privacy and minimum-anonymity constraints for public zone codes.',
    ],
  },
  {
    id: 'operations-workspace-trading-models',
    label: 'Operations, Workspace, Trading, and Finance domain models',
    boundary: 'dual-contract',
    license: 'Apache-2.0',
    currentPaths: [
      'src/lib/operations.ts',
      'src/lib/veyWorkspace.ts',
      'src/lib/veyTrading.ts',
      'src/lib/veyFinance.ts',
      'docs/operations.md',
      'docs/vey-workspace-b2b-operations-hub-ja.md',
      'docs/vey-trading-electronic-trading-company-ja.md',
      'docs/vey-finance-trade-execution-robot-ja.md',
    ],
    recommendedPaths: [
      'packages/oss/domain-models/**',
      'apps/commercial/operations-suite/**',
      'services/commercial/trade-finance/**',
    ],
    compatibility: {
      stableImport: 'src/lib/veyFinance.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: true,
      notes: [
        'State machines, receipt schemas, and simulation models can be OSS.',
        'Regulated execution, payments, tax remittance, escrow, and managed WMS/TMS operations belong in commercial or regulated deployments.',
      ],
    },
    ossFallback: [
      'simulation-only finance/trading/workspace state models',
      'local WMS/TMS reference flows',
    ],
    commercialDependsOn: [
      'payment-settlement-carrier-label-managed',
      'privacy-security-release-gates',
    ],
    guardrails: [
      'Do not present simulation modules as regulated financial services.',
      'Keep payment, tax, customs, and escrow adapters isolated from OSS core imports.',
    ],
  },
  {
    id: 'drone-locker-ops-simulator-and-fleet',
    label: 'Drone and locker reachability simulator plus future fleet operations',
    boundary: 'dual-contract',
    license: 'Apache-2.0',
    currentPaths: [
      'src/components/DroneLockerOpsScreen.tsx',
      'src/components/OpenLockerPudoSimulatorScreen.tsx',
      'src/lib/droneDeliveryEvidenceApi.ts',
      'src/lib/lockerSystemOs.ts',
      'src/lib/openLockerPudoSimulator.ts',
      'src/lib/warehouseLockerLocalSimulator.ts',
      'docs/drone-delivery-evidence-api.md',
      'docs/locker-system-os.md',
      'docs/smart-locker-os-research-ja.md',
    ],
    recommendedPaths: [
      'apps/oss/drone-locker-simulator/**',
      'apps/oss/open-locker-pudo-simulator/**',
      'services/commercial/fleet-ops/**',
    ],
    compatibility: {
      stableImport: 'src/lib/droneDeliveryEvidenceApi.ts',
      keepCurrentPath: true,
      requiresShim: true,
      publicApiMustRemain: true,
      notes: [
      'Local MQTT/HTTP/Modbus simulation and reachability evidence API stay OSS.',
      'Open Locker/PUDO Simulator stays local-first and can be split into an OSS reference app.',
      'Real fleet orchestration, hardware certification, and multi-site SLA operations can be commercial.',
      ],
    },
    ossFallback: [
      'local MQTT/HTTP/Modbus simulator',
      'reachability and delivery evidence API reference implementation',
    ],
    commercialDependsOn: [
      'basic-pos-terminal',
      'advanced-pos-terminal-management',
    ],
    guardrails: [
      'Drone OS scope should stay limited to delivery evidence and reachability unless safety certification exists.',
      'Locker events must avoid raw address in telemetry.',
    ],
  },
];
