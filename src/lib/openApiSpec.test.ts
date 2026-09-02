import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_V1_BASE_PATH } from './apiVersion';
import { AGID_POLKADOT_COMMITMENT_ALGORITHM, AGID_POLKADOT_INTEGRATION_MODEL_VERSION } from './polkadotIntegration';
import { CLOUD_DB_INTEGRATION_MODEL_VERSION } from './cloudDbIntegration';
import { AGID_OPENAPI_SPEC } from './openApiSpec';
import { PRIVATE_DEPLOYMENT_MODEL_VERSION } from './privateDeployment';

test('OpenAPI spec exposes AGID v1 as the official server path', () => {
  assert.equal(AGID_OPENAPI_SPEC.openapi, '3.1.0');
  assert.equal(AGID_OPENAPI_SPEC.servers[0].url, API_V1_BASE_PATH);
  assert.equal(AGID_OPENAPI_SPEC.info.version, '1.0.0');
  assert.equal(AGID_OPENAPI_SPEC['x-agid-api'].version, 'v1');
});

test('OpenAPI paths stay relative to /api/v1 and cover core integration surfaces', () => {
  const paths = Object.keys(AGID_OPENAPI_SPEC.paths);
  assert.ok(paths.length >= 30);
  assert.ok(paths.every(path => path.startsWith('/')));
  assert.ok(paths.every(path => !path.startsWith('/api/')));

  for (const requiredPath of [
    '/openapi.json',
    '/mcp',
    '/health',
    '/communication/health',
    '/integrations/oracle-opera/health',
    '/integrations/oracle-opera/address',
    '/cloud-db/connectors',
    '/cloud-db/compatibility',
    '/cloud-db/plan',
    '/cloud-db/sync-job',
    '/address-intents/capabilities',
    '/address-intents',
    '/address-intents/recent',
    '/address-intents/{intentId}',
    '/address-intents/{intentId}/update',
    '/address-element/capabilities',
    '/address-element/session',
    '/address-radar/rules',
    '/address-radar/evaluate',
    '/address-operations/capabilities',
    '/address-identity/verify',
    '/address-webhooks/event',
    '/address-disputes/case',
    '/address-tax-customs/context',
    '/address-dashboard/snapshot',
    '/address-connect/capabilities',
    '/address-connect/registry',
    '/address-connect/discover',
    '/address-connect/operations/requirements',
    '/address-connect/operations/report',
    '/address-scale/capabilities',
    '/address-scale/topology',
    '/address-terminal/capabilities',
    '/address-terminal/fleet',
    '/pos/external/capabilities',
    '/pos/external/import',
    '/pos/external/request',
    '/pos/external/handoff-complete',
    '/pos/external/sale-link',
    '/pos/external/pickup-ready',
    '/pos/external/receipt-export',
    '/pos/external/customer-note',
    '/pos/external/refund-release',
    '/drone-delivery-evidence/capabilities',
    '/drone-delivery-evidence/report',
    '/warehouse-locker-simulator/capabilities',
    '/warehouse-locker-simulator/run',
    '/address-launch-center/checklist',
    '/address-launch-center/evaluate',
    '/cross-border/auxiliary/sources',
    '/cross-border/auxiliary/context',
    '/shopping-agent/cross-border/context',
    '/hybrid/quality',
    '/address/parse',
    '/address/verify',
    '/address/verify/capabilities',
    '/address/standard-library/capabilities',
    '/address/standard-library/resolve',
    '/credential-issuers/trust-registry/snapshot',
    '/credential-issuers/trust-registry/evaluate',
    '/credential-issuers/trust-registry/verify-credential',
    '/zk/proof-bundles/register',
    '/zk/proof-bundles/{bundleId}/verify',
    '/zk/proof-bundles/{bundleId}/revoke',
    '/zk/proof-bundles/stats',
    '/zk/managed-proof-server/capabilities',
    '/zk/managed-proof-server/jobs',
    '/private-deployments/capabilities',
    '/private-deployments/plan',
    '/revocation-freshness/anchor',
    '/revocation-freshness/verify',
    '/polkadot/stages',
    '/polkadot/commitment',
    '/polkadot/anchor',
    '/polkadot/commitments/{commitmentId}',
    '/polkadot/commitments/{commitmentId}/finality',
    '/amn/resolve',
    '/amn/registry/{envelopeId}/verify',
    '/amn/registry/stats',
    '/postal-code/nearest',
    '/postal/capabilities',
    '/postal/research',
    '/postal/research/{country}',
    '/postal/releases/{country}',
    '/postal/resolve',
    '/postal/intersects',
    '/postal/{country}/{postalCode}',
    '/nominatim/reverse',
    '/overpass',
    '/osrm/route',
    '/terrain/{z}/{x}/{y}.png',
  ]) {
    assert.ok(requiredPath in AGID_OPENAPI_SPEC.paths, `${requiredPath} is documented`);
  }
});

test('OpenAPI components include shared AGID result and error schemas', () => {
  assert.ok('AgidResultBase' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ErrorResponse' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('McpJsonRpcRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('McpJsonRpcResponse' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('OracleOperaIntegrationHealth' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('OracleOperaAddressSyncRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('OracleOperaAddressSyncResult' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultOracleOperaIntegrationHealth' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultOracleOperaAddressSyncResult' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('CloudDbConnectorProfile' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PostalContextReleaseSelector' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PostalContextResolveRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PostalContextRuntimeRelease' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PostalContextPublicResolution' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPostalContextResolution' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPostalContextCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPostalContextResearchCatalog' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPostalContextResearchCountry' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('DatabaseAdapterCompatibilityRecord' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('CloudDbConnectorPlanRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('CloudDbConnectorPlan' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('CloudDbSyncJobRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('CloudDbSyncJob' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultCloudDbConnectors' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultDatabaseAdapterCompatibility' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultCloudDbConnectorPlan' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultCloudDbSyncJob' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressIntentRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressIntentUpdateRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressIntent' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressIntent' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressIntentCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultRecentAddressIntents' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressElementSessionRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressElementSession' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressElementCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressElementCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressElementSession' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressRadarEvaluationRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressRadarEvaluation' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressRadarRules' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressRadarRules' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressRadarEvaluation' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressOperationsCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressIdentityVerificationRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressIdentityVerification' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressWebhookEventRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressWebhookEvent' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressDisputeCaseRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressDisputeCase' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressTaxCustomsContextRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressTaxCustomsContext' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressDashboardSnapshotRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressDashboardSnapshot' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressOperationsCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressIdentityVerification' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressWebhookEvent' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressDisputeCase' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressTaxCustomsContext' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressDashboardSnapshot' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressConnectRegistryRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressConnectRegistry' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressConnectDiscoverRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressConnectDiscovery' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressConnectOperationsReportRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressConnectOperationsReport' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressConnectOperationalRequirements' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressConnectCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressConnectCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressConnectRegistry' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressConnectDiscovery' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressConnectOperationalRequirements' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressConnectOperationsReport' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressScaleTopologyRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressScaleTopologyPlan' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressScaleCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressScaleCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressScaleTopologyPlan' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressTerminalFleetRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressTerminalFleet' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressTerminalCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressTerminalCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressTerminalFleet' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ExternalPosManifest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ExternalPosOperationRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ExternalPosCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ExternalPosNormalizedResult' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ExternalPosRun' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ExternalPosImport' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultExternalPosCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultExternalPosImport' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultExternalPosRun' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressLaunchCenterEvaluationRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressLaunchCenterChecklistItem' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressLaunchCenterChecklist' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressLaunchCenterEvaluationItem' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressLaunchCenterEvaluation' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressLaunchCenterChecklist' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressLaunchCenterEvaluation' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('HybridQualityRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressParseRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressStandardLibraryResolveRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressStandardLibraryResolution' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AddressVerifyRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressVerification' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAddressVerificationCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('CredentialIssuerTrustRegistrySnapshotRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('CredentialIssuerTrustEvaluateRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('CredentialIssuerTrustVerifyCredentialRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultCredentialIssuerTrustRegistrySnapshot' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultCredentialIssuerTrustEvaluation' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultCredentialIssuerTrustVerification' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ZkProofBundleRegisterRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ZkProofBundleVerifyRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ZkProofBundleRevokeRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultZkProofBundleRegistration' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultZkProofBundleVerification' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultZkProofBundleStats' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ManagedZkProofJobRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ManagedZkProofJob' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('ManagedZkProofServerCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultManagedZkProofServerCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultManagedZkProofJob' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PrivateDeploymentPlanRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PrivateDeploymentComponent' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PrivateDeploymentPlan' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PrivateDeploymentCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPrivateDeploymentCapabilities' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPrivateDeploymentPlan' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('RevocationFreshnessAnchorRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('RevocationFreshnessVerifyRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultRevocationFreshnessAnchor' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultRevocationFreshnessVerification' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PolkadotCommitmentRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PolkadotAnchorRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('PolkadotFinalityRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPolkadotStages' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPolkadotCommitment' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPolkadotAnchor' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPolkadotCommitmentRecord' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultPolkadotFinality' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AmnResolutionRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AmnResolutionEnvelope' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AmnRegistryVerificationRequest' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAmnResolution' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAmnEnvelopeVerification' in AGID_OPENAPI_SPEC.components.schemas);
  assert.ok('AgidResultAmnRegistryStats' in AGID_OPENAPI_SPEC.components.schemas);
});

test('Postal Context OpenAPI responses do not advertise uncalibrated confidence', () => {
  for (const schemaName of [
    'AgidResultPostalContextResolution',
    'AgidResultPostalContextCapabilities',
    'AgidResultPostalContextCountryStatus',
    'AgidResultPostalContextLookup',
    'AgidResultPostalContextIntersection',
  ] as const) {
    const schema = AGID_OPENAPI_SPEC.components.schemas[schemaName];
    assert.equal('confidence' in schema.properties, false, `${schemaName} has no confidence field`);
    assert.equal(
      (schema.required as readonly string[]).includes('confidence'),
      false,
      `${schemaName} does not require confidence`,
    );
  }
});

test('OpenAPI documents credential issuer trust endpoints without private issuer or address secrets', () => {
  const snapshot = AGID_OPENAPI_SPEC.paths['/credential-issuers/trust-registry/snapshot'].post;
  const evaluate = AGID_OPENAPI_SPEC.paths['/credential-issuers/trust-registry/evaluate'].post;
  const verify = AGID_OPENAPI_SPEC.paths['/credential-issuers/trust-registry/verify-credential'].post;
  const credentialIssuerTrust = AGID_OPENAPI_SPEC['x-agid-credential-issuer-trust'];

  assert.equal(snapshot.tags[0], 'Credentials');
  assert.equal(evaluate.tags[0], 'Credentials');
  assert.equal(verify.tags[0], 'Credentials');
  assert.match(snapshot.summary, /issuer trust/i);
  assert.match(evaluate.summary, /issuer trust/i);
  assert.match(verify.description, /server-managed issuer keys/i);
  assert.equal(credentialIssuerTrust.secretMaterialAcceptedByPublicApi, false);

  const publicContract = JSON.stringify({
    paths: [
      AGID_OPENAPI_SPEC.paths['/credential-issuers/trust-registry/snapshot'],
      AGID_OPENAPI_SPEC.paths['/credential-issuers/trust-registry/evaluate'],
      AGID_OPENAPI_SPEC.paths['/credential-issuers/trust-registry/verify-credential'],
    ],
    schemas: [
      AGID_OPENAPI_SPEC.components.schemas.CredentialIssuerTrustRegistrySnapshotRequest,
      AGID_OPENAPI_SPEC.components.schemas.CredentialIssuerTrustEvaluateRequest,
      AGID_OPENAPI_SPEC.components.schemas.CredentialIssuerTrustVerifyCredentialRequest,
    ],
  });
  assert.doesNotMatch(publicContract, /issuerSecret|issuerSecretsById|privateSalt|addressText|phone|email|plaintext-address/i);
});

test('OpenAPI documents proof bundle, freshness, and Polkadot APIs as public commitment surfaces', () => {
  const bundleRegister = AGID_OPENAPI_SPEC.paths['/zk/proof-bundles/register'].post;
  const managedCapabilities = AGID_OPENAPI_SPEC.paths['/zk/managed-proof-server/capabilities'].get;
  const managedJob = AGID_OPENAPI_SPEC.paths['/zk/managed-proof-server/jobs'].post;
  const freshnessAnchor = AGID_OPENAPI_SPEC.paths['/revocation-freshness/anchor'].post;
  const polkadotCommitment = AGID_OPENAPI_SPEC.paths['/polkadot/commitment'].post;
  const proofAndAnchor = AGID_OPENAPI_SPEC['x-agid-proof-and-anchor-api'];
  const managedZk = AGID_OPENAPI_SPEC['x-agid-managed-zk-proof-server'];

  assert.equal(bundleRegister.tags[0], 'ZK Proofs');
  assert.equal(managedCapabilities.tags[0], 'ZK Proofs');
  assert.equal(managedJob.tags[0], 'ZK Proofs');
  assert.equal(freshnessAnchor.tags[0], 'Credentials');
  assert.equal(polkadotCommitment.tags[0], 'Polkadot');
  assert.equal(proofAndAnchor.publicProofMaterialOnly, true);
  assert.equal(proofAndAnchor.privateAddressMaterialAccepted, false);
  assert.equal(managedZk.privateMaterialAccepted, false);
  assert.equal(managedZk.serverHeldWitnessAllowed, false);
  assert.equal(managedZk.recommendedWitnessMode, 'client-side-witness');
  assert.ok(managedZk.backends.includes('circom-snarkjs'));

  const publicContract = JSON.stringify({
    paths: [
      AGID_OPENAPI_SPEC.paths['/zk/proof-bundles/register'],
      AGID_OPENAPI_SPEC.paths['/zk/proof-bundles/{bundleId}/verify'],
      AGID_OPENAPI_SPEC.paths['/zk/proof-bundles/{bundleId}/revoke'],
      AGID_OPENAPI_SPEC.paths['/zk/managed-proof-server/capabilities'],
      AGID_OPENAPI_SPEC.paths['/zk/managed-proof-server/jobs'],
      AGID_OPENAPI_SPEC.paths['/revocation-freshness/anchor'],
      AGID_OPENAPI_SPEC.paths['/revocation-freshness/verify'],
      AGID_OPENAPI_SPEC.paths['/polkadot/commitment'],
      AGID_OPENAPI_SPEC.paths['/polkadot/anchor'],
    ],
    requestSchemas: [
      AGID_OPENAPI_SPEC.components.schemas.ZkProofBundleRegisterRequest,
      AGID_OPENAPI_SPEC.components.schemas.ZkProofBundleVerifyRequest,
      AGID_OPENAPI_SPEC.components.schemas.ZkProofBundleRevokeRequest,
      AGID_OPENAPI_SPEC.components.schemas.ManagedZkProofJobRequest,
      AGID_OPENAPI_SPEC.components.schemas.RevocationFreshnessAnchorRequest,
      AGID_OPENAPI_SPEC.components.schemas.RevocationFreshnessVerifyRequest,
      AGID_OPENAPI_SPEC.components.schemas.PolkadotCommitmentRequest,
      AGID_OPENAPI_SPEC.components.schemas.PolkadotAnchorRequest,
    ],
  });
  assert.doesNotMatch(publicContract, /issuerSecret|privateSalt|addressText|phone|email|plaintext-address|privateProofSalt/i);
});

test('OpenAPI documents private deployments for public-sector, NGO, and carrier infrastructure', () => {
  const capabilities = AGID_OPENAPI_SPEC.paths['/private-deployments/capabilities'].get;
  const plan = AGID_OPENAPI_SPEC.paths['/private-deployments/plan'].post;
  const extension = AGID_OPENAPI_SPEC['x-agid-private-deployment'];

  assert.equal(capabilities.tags[0], 'Private Deployments');
  assert.equal(plan.tags[0], 'Private Deployments');
  assert.equal(extension.modelVersion, PRIVATE_DEPLOYMENT_MODEL_VERSION);
  assert.ok(extension.sectors.includes('municipality'));
  assert.ok(extension.sectors.includes('ngo'));
  assert.ok(extension.sectors.includes('carrier'));
  assert.ok(extension.networkModes.includes('offline-first'));
  assert.ok(extension.componentIds.includes('managed-zk-proof-worker'));
  assert.ok(extension.componentIds.includes('address-terminal-fleet'));
  assert.equal(extension.privateMaterialAccepted, false);
  assert.equal(extension.rawAddressStorage, false);
  assert.equal(extension.rawAgidStorage, false);
  assert.equal(extension.rawAoidStorage, false);
  assert.equal(extension.rawWitnessStorage, false);
  assert.equal(extension.serverHeldWitnessAllowed, false);
  assert.ok(extension.requiredControls.includes('domain-separated-commitments-and-nullifiers'));
  assert.ok(extension.forbiddenPublicPayloads.includes('raw-witness'));

  const publicRequestContract = JSON.stringify({
    paths: [
      AGID_OPENAPI_SPEC.paths['/private-deployments/capabilities'],
      AGID_OPENAPI_SPEC.paths['/private-deployments/plan'],
    ],
    schemas: [
      AGID_OPENAPI_SPEC.components.schemas.PrivateDeploymentPlanRequest,
      AGID_OPENAPI_SPEC.components.schemas.PrivateDeploymentCapabilities,
    ],
  });
  assert.doesNotMatch(publicRequestContract, /recipientName|phoneNumber|unitNumber|proofCode|addressText|plaintextAddress|rawApiKey|privateKey|holderSecret/i);
});

test('OpenAPI documents AMN as a public envelope and commitment surface', () => {
  const amnResolve = AGID_OPENAPI_SPEC.paths['/amn/resolve'].post;
  const amnVerify = AGID_OPENAPI_SPEC.paths['/amn/registry/{envelopeId}/verify'].post;
  const amnStats = AGID_OPENAPI_SPEC.paths['/amn/registry/stats'].get;
  const amn = AGID_OPENAPI_SPEC['x-agid-amn'];

  assert.equal(amnResolve.tags[0], 'AMN');
  assert.equal(amnVerify.tags[0], 'AMN');
  assert.equal(amnStats.tags[0], 'AMN');
  assert.match(amnResolve.summary, /resolution envelope/i);
  assert.equal(amn.privateAddressMaterialAccepted, false);
  assert.equal(amn.chainSurface, 'commitments-policy-hashes-evidence-roots-proof-bundle-ids-only');

  const publicContract = JSON.stringify({
    paths: [
      AGID_OPENAPI_SPEC.paths['/amn/resolve'],
      AGID_OPENAPI_SPEC.paths['/amn/registry/{envelopeId}/verify'],
      AGID_OPENAPI_SPEC.paths['/amn/registry/stats'],
    ],
    requestSchemas: [
      AGID_OPENAPI_SPEC.components.schemas.AmnResolutionRequest,
      AGID_OPENAPI_SPEC.components.schemas.AmnRegistryVerificationRequest,
    ],
    extension: amn,
  });
  assert.doesNotMatch(publicContract, /issuerSecret|privateSalt|addressText|phone|email|recipient|plaintext-address|raw-aoid|raw-candidates/i);
});

test('OpenAPI documents the AGID MCP endpoint as a public-only tool surface', () => {
  const mcp = AGID_OPENAPI_SPEC.paths['/mcp'].post;
  const mcpExtension = AGID_OPENAPI_SPEC['x-agid-mcp'];

  assert.equal(mcp.tags[0], 'MCP');
  assert.match(mcp.summary, /Model Context Protocol/i);
  assert.equal(mcpExtension.enabled, true);
  assert.equal(mcpExtension.endpoint, `${API_V1_BASE_PATH}/mcp`);
  assert.equal(mcpExtension.transport, 'streamable-http-json-rpc');
  assert.equal(mcpExtension.privateMaterialAccepted, false);
  assert.ok(mcpExtension.supportedMethods.includes('tools/list'));
  assert.ok(mcpExtension.supportedTools.includes('agid.zk.proof_bundle.register'));
  assert.ok(mcpExtension.supportedTools.includes('agid.revocation_freshness.verify'));

  const publicContract = JSON.stringify({
    path: AGID_OPENAPI_SPEC.paths['/mcp'],
    schemas: [
      AGID_OPENAPI_SPEC.components.schemas.McpJsonRpcRequest,
      AGID_OPENAPI_SPEC.components.schemas.McpJsonRpcResponse,
    ],
    extension: mcpExtension,
  });
  assert.doesNotMatch(publicContract, /issuerSecret|privateSalt|addressText|phone|email|recipient|plaintext-address/i);
});

test('OpenAPI extension foregrounds the independent AGID standard artifacts', () => {
  const standard = AGID_OPENAPI_SPEC['x-agid-standard'];

  assert.equal(standard.specName, 'agid-spec');
  assert.equal(standard.canonicalSpec, 'sdk/agid-spec/agid-spec.json');
  assert.equal(standard.parityVectors, 'sdk/agid-spec/test-vectors.json');
  assert.deepEqual(standard.sdkParityRequired, ['encode', 'decode', 'cellBounds']);
  assert.equal(standard.openApiContract, `${API_V1_BASE_PATH}/openapi.json`);
  assert.equal(standard.licensePolicy, 'LICENSE_POLICY.md');
  assert.equal(standard.dataLicensePolicy, 'DATA_LICENSES.md');
  assert.equal(standard.dataLicenseDetails, 'docs/data-licenses.md');
  assert.equal(standard.securityPolicy, 'docs/agid-security.md');
  assert.equal(standard.softwareLicense, 'MIT');
});

test('OpenAPI extension exposes AGID public-layer security controls', () => {
  const security = AGID_OPENAPI_SPEC['x-agid-security'];

  assert.equal(security.profile, 'agid-public-security-v1');
  assert.equal(security.confidentiality, 'public-by-design-no-personal-data');
  assert.ok(security.integrityControls.includes('strict-agid-format'));
  assert.ok(security.integrityControls.includes('45-bit-packed-value-limit'));
  assert.ok(security.openSourceReleaseControls.includes('signed-release-artifacts-or-published-checksums'));
  assert.ok(security.publicAgidForbiddenFields.includes('recipient'));
});

test('OpenAPI extension keeps AGID public-address/map-feature aware and AOID private for integrators', () => {
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].agid.layer, 'public-location-address-building-map-feature');
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].agid.includesPublicAddress, true);
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].agid.includesPublicBuilding, true);
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].agid.includesPublicMapFeature, true);
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].agid.excludesPrivateUnitRecipient, true);
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].agid.includesPersonalData, false);
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].aoid.layer, 'private-address');
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].aoid.includesPrivateUnitRecipient, true);
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].aoid.includesPersonalData, true);
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].aoid.defaultStorage, 'device-local');
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].aoid.publicSurface, 'reference-handle-plus-linked-agid');
  assert.deepEqual(AGID_OPENAPI_SPEC['x-agid-identity'].aoid.cloudSyncRequires, [
    'explicit-owner-consent',
    'owner-device-encryption',
    'owner-and-device-key-ids',
    'opaque-ciphertext-payload',
  ]);
  assert.equal(AGID_OPENAPI_SPEC['x-agid-identity'].aoid.plainCloudSyncAllowed, false);
});

test('OpenAPI extension separates AGID and AOID communication surfaces', () => {
  const communication = AGID_OPENAPI_SPEC['x-agid-communication'];

  assert.equal(communication.agid.defaultMode, 'public-or-local');
  assert.equal(communication.governanceModel, 'agid-aoid-governance-v1');
  assert.equal(communication.registrationAuditRequired, true);
  assert.equal(communication.aoidCloudSyncRequiresEncryptedEnvelope, true);
  assert.equal(communication.agid.sdkSurface, 'offline-encode-decode-cell-bounds');
  assert.ok(communication.agid.allowedNetworkPayloads.includes('public-address-label'));
  assert.ok(communication.agid.allowedNetworkPayloads.includes('public-map-feature-name'));
  assert.ok(communication.agid.forbiddenNetworkPayloads.includes('recipient'));

  assert.equal(communication.aoid.defaultMode, 'local-first-private');
  assert.equal(communication.aoid.apiSurface, 'reference-handle-plus-linked-agid-only');
  assert.equal(communication.aoid.syncSurface, 'owner-consented-owner-device-encrypted-envelope-only');
  assert.ok(communication.aoid.allowedNetworkPayloads.includes('opaque-encrypted-payload'));
  assert.ok(communication.aoid.forbiddenNetworkPayloads.includes('plaintext-phone'));
  assert.match(communication.aoid.cachePolicy, /no plaintext server persistence/);
});

test('OpenAPI documents Cloud/DB integrations as adapter contracts before provider dispatch', () => {
  const connectors = AGID_OPENAPI_SPEC.paths['/cloud-db/connectors'].get;
  const compatibility = AGID_OPENAPI_SPEC.paths['/cloud-db/compatibility'].get;
  const plan = AGID_OPENAPI_SPEC.paths['/cloud-db/plan'].post;
  const syncJob = AGID_OPENAPI_SPEC.paths['/cloud-db/sync-job'].post;
  const cloudDb = AGID_OPENAPI_SPEC['x-agid-cloud-db'];

  assert.equal(connectors.tags[0], 'Cloud/DB');
  assert.equal(compatibility.tags[0], 'Cloud/DB');
  assert.equal(plan.tags[0], 'Cloud/DB');
  assert.equal(syncJob.tags[0], 'Cloud/DB');
  assert.equal(cloudDb.modelVersion, CLOUD_DB_INTEGRATION_MODEL_VERSION);
  assert.ok(cloudDb.runtimeLedgerAdapters.includes('mongodb'));
  assert.ok(cloudDb.plannedRuntimeAdapters.includes('mysql'));
  assert.ok(cloudDb.plannedRuntimeAdapters.includes('oracle-autonomous-database'));
  assert.ok(cloudDb.plannedRuntimeAdapters.includes('alibaba-cloud-rds'));
  assert.ok(cloudDb.plannedRuntimeAdapters.includes('tencent-cloud-tdsql'));
  assert.ok(cloudDb.postgresCompatibleRuntimeAdapters.includes('aws-rds-postgres'));
  assert.ok(cloudDb.connectorPlanOnlyAdapters.includes('bigquery'));
  assert.ok(cloudDb.connectorPlanOnlyAdapters.includes('oracle-netsuite'));
  assert.ok(cloudDb.connectorPlanOnlyAdapters.includes('dingtalk-webhook'));
  assert.ok(cloudDb.connectorPlanOnlyAdapters.includes('oracle-blockchain-platform'));
  assert.ok(cloudDb.connectorPlanOnlyAdapters.includes('opensearch'));
  assert.ok(cloudDb.objectStorageExportAdapters.includes('oci-object-storage'));
  assert.ok(cloudDb.objectStorageExportAdapters.includes('alibaba-cloud-oss'));
  assert.ok(cloudDb.objectStorageExportAdapters.includes('tencent-cloud-cos'));
  assert.equal(cloudDb.adapterBoundary, 'plan-before-sdk-dispatch');
  assert.equal(cloudDb.plaintextAoidStorageAllowed, false);
  assert.equal(cloudDb.networkRequestBuiltByPlanningEndpoints, false);
  assert.ok(cloudDb.supportedProviderFamilies.includes('relational-db'));
  assert.ok(cloudDb.supportedProviderFamilies.includes('analytics-warehouse'));
  assert.ok(cloudDb.supportedProviderFamilies.includes('search-index'));
  assert.ok(cloudDb.supportedProviderFamilies.includes('vector-db'));
  assert.ok(cloudDb.supportedProviderExamples.includes('supabase'));
  assert.ok(cloudDb.supportedProviderExamples.includes('oci-object-storage'));
  assert.ok(cloudDb.supportedProviderExamples.includes('alibaba-cloud-oss'));
  assert.ok(cloudDb.supportedProviderExamples.includes('tencent-cloud-cos'));
  assert.ok(cloudDb.supportedProviderExamples.includes('snowflake'));
  assert.ok(cloudDb.supportedProviderExamples.includes('qdrant'));
  assert.ok(cloudDb.supportedProviderExamples.includes('oracle-netsuite'));
  assert.ok(cloudDb.supportedProviderExamples.includes('dingtalk-webhook'));
  assert.ok(cloudDb.supportedProviderExamples.includes('oracle-blockchain-platform'));
  assert.ok(cloudDb.requiredAoidControls.includes('owner-device-encrypted-envelope'));
  assert.ok(cloudDb.requiredAoidControls.includes('no-server-plaintext-aoid-decryption'));
  assert.deepEqual(cloudDb.endpointOrder, [
    '/cloud-db/connectors',
    '/cloud-db/compatibility',
    '/cloud-db/plan',
    '/cloud-db/sync-job',
  ]);

  const publicContract = JSON.stringify({
    paths: [
      AGID_OPENAPI_SPEC.paths['/cloud-db/connectors'],
      AGID_OPENAPI_SPEC.paths['/cloud-db/compatibility'],
      AGID_OPENAPI_SPEC.paths['/cloud-db/plan'],
      AGID_OPENAPI_SPEC.paths['/cloud-db/sync-job'],
    ],
    schemas: [
      AGID_OPENAPI_SPEC.components.schemas.DatabaseAdapterCompatibilityRecord,
      AGID_OPENAPI_SPEC.components.schemas.CloudDbConnectorPlanRequest,
      AGID_OPENAPI_SPEC.components.schemas.CloudDbSyncJobRequest,
      AGID_OPENAPI_SPEC.components.schemas.CloudDbSyncJob,
    ],
  });
  assert.doesNotMatch(publicContract, /recipient|phone|unit-or-room|delivery-instruction|privateSalt|issuerSecret/i);
});

test('OpenAPI documents AddressIntent as a public workflow state machine', () => {
  const capabilities = AGID_OPENAPI_SPEC.paths['/address-intents/capabilities'].get;
  const createIntent = AGID_OPENAPI_SPEC.paths['/address-intents'].post;
  const getIntent = AGID_OPENAPI_SPEC.paths['/address-intents/{intentId}'].get;
  const updateIntent = AGID_OPENAPI_SPEC.paths['/address-intents/{intentId}/update'].post;
  const addressIntent = AGID_OPENAPI_SPEC['x-agid-address-intent'];

  assert.equal(capabilities.tags[0], 'Address Intents');
  assert.equal(createIntent.tags[0], 'Address Intents');
  assert.equal(getIntent.tags[0], 'Address Intents');
  assert.equal(updateIntent.tags[0], 'Address Intents');
  assert.ok(addressIntent.statuses.includes('requires_input'));
  assert.ok(addressIntent.purposes.includes('customs'));
  assert.ok(addressIntent.modes.includes('full'));
  assert.equal(addressIntent.publicEvidenceOnly, true);
  assert.equal(addressIntent.privateMaterialAccepted, false);
  assert.ok(addressIntent.privacyBoundary.includes('do-not-store-plaintext-address'));
  assert.ok(addressIntent.adapterBoundary.includes('sqlite-postgres-redis-or-mongodb'));

  const publicContract = JSON.stringify({
    paths: [
      AGID_OPENAPI_SPEC.paths['/address-intents/capabilities'],
      AGID_OPENAPI_SPEC.paths['/address-intents'],
      AGID_OPENAPI_SPEC.paths['/address-intents/{intentId}'],
      AGID_OPENAPI_SPEC.paths['/address-intents/{intentId}/update'],
    ],
    schemas: [
      AGID_OPENAPI_SPEC.components.schemas.AddressIntentRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressIntentUpdateRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressIntent,
      AGID_OPENAPI_SPEC.components.schemas.AddressIntentCapabilities,
    ],
  });
  assert.doesNotMatch(publicContract, /addressText|rawAddress|recipientName|phoneNumber|unitNumber|privateAddressHistory/i);
});

test('OpenAPI documents Address Element and Address Radar as safe public surfaces', () => {
  const elementCapabilities = AGID_OPENAPI_SPEC.paths['/address-element/capabilities'].get;
  const elementSession = AGID_OPENAPI_SPEC.paths['/address-element/session'].post;
  const radarRules = AGID_OPENAPI_SPEC.paths['/address-radar/rules'].get;
  const radarEvaluate = AGID_OPENAPI_SPEC.paths['/address-radar/evaluate'].post;
  const extension = AGID_OPENAPI_SPEC['x-agid-address-element-radar'];

  assert.equal(elementCapabilities.tags[0], 'Address Element');
  assert.equal(elementSession.tags[0], 'Address Element');
  assert.equal(radarRules.tags[0], 'Address Radar');
  assert.equal(radarEvaluate.tags[0], 'Address Radar');
  assert.equal(extension.publicApiRawFieldValuesAccepted, false);
  assert.equal(extension.localComponentMayHoldRawFields, true);
  assert.ok(extension.highRiskModeControls.includes('recipient-live-challenge'));
  assert.ok(extension.endpointOrder.includes('/address-radar/evaluate'));

  assert.ok(extension.forbiddenPublicPayloads.includes('raw-aoid'));

  const publicRequestContract = JSON.stringify({
    schemas: [
      AGID_OPENAPI_SPEC.components.schemas.AddressElementSessionRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressRadarEvaluationRequest,
    ],
  });
  assert.doesNotMatch(publicRequestContract, /recipientName|phoneNumber|unitNumber|proofCode|rawAddress|addressText|plaintextAddress/i);
});

test('OpenAPI documents Address Connect and Address Terminal as organization and device surfaces only', () => {
  const connectCapabilities = AGID_OPENAPI_SPEC.paths['/address-connect/capabilities'].get;
  const connectRegistry = AGID_OPENAPI_SPEC.paths['/address-connect/registry'].post;
  const connectDiscover = AGID_OPENAPI_SPEC.paths['/address-connect/discover'].post;
  const connectRequirements = AGID_OPENAPI_SPEC.paths['/address-connect/operations/requirements'].get;
  const connectOperations = AGID_OPENAPI_SPEC.paths['/address-connect/operations/report'].post;
  const terminalCapabilities = AGID_OPENAPI_SPEC.paths['/address-terminal/capabilities'].get;
  const terminalFleet = AGID_OPENAPI_SPEC.paths['/address-terminal/fleet'].post;
  const extension = AGID_OPENAPI_SPEC['x-agid-address-connect-terminal'];

  assert.equal(connectCapabilities.tags[0], 'Address Connect');
  assert.equal(connectRegistry.tags[0], 'Address Connect');
  assert.equal(connectDiscover.tags[0], 'Address Connect');
  assert.equal(connectRequirements.tags[0], 'Address Connect');
  assert.equal(connectOperations.tags[0], 'Address Connect');
  assert.equal(terminalCapabilities.tags[0], 'Address Terminal');
  assert.equal(terminalFleet.tags[0], 'Address Terminal');
  assert.equal(extension.organizationMetadataOnly, true);
  assert.equal(extension.personalAddressStorageAllowed, false);
  assert.equal(extension.rawCredentialOrApiSecretAccepted, false);
  assert.equal(extension.terminalRawPayloadStorage, false);
  assert.ok(extension.endpointOrder.includes('/address-terminal/fleet'));
  assert.ok(extension.endpointOrder.includes('/address-connect/operations/report'));
  assert.ok(extension.addressConnectRoles.includes('carrier'));
  assert.ok(extension.addressConnectCriticalWebhookTopics.includes('qr.used'));
  assert.equal(extension.webhookOperations.rawPayloadRetentionDays, 0);
  assert.ok(extension.addressTerminalScreens.includes('offline-queue'));

  const publicContract = JSON.stringify({
    paths: [
      AGID_OPENAPI_SPEC.paths['/address-connect/capabilities'],
      AGID_OPENAPI_SPEC.paths['/address-connect/registry'],
      AGID_OPENAPI_SPEC.paths['/address-connect/discover'],
      AGID_OPENAPI_SPEC.paths['/address-connect/operations/requirements'],
      AGID_OPENAPI_SPEC.paths['/address-connect/operations/report'],
      AGID_OPENAPI_SPEC.paths['/address-terminal/capabilities'],
      AGID_OPENAPI_SPEC.paths['/address-terminal/fleet'],
    ],
    schemas: [
      AGID_OPENAPI_SPEC.components.schemas.AddressConnectRegistryRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressConnectDiscoverRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressConnectOperationsReportRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressTerminalFleetRequest,
    ],
    extension,
  });
  assert.doesNotMatch(publicContract, /recipientName|phoneNumber|unitNumber|proofCode|rawAddress|addressText|plaintextAddress|rawApiKey|privateKey/i);
});

test('OpenAPI documents Address Launch Center as a production-readiness gate', () => {
  const checklist = AGID_OPENAPI_SPEC.paths['/address-launch-center/checklist'].get;
  const evaluate = AGID_OPENAPI_SPEC.paths['/address-launch-center/evaluate'].post;
  const extension = AGID_OPENAPI_SPEC['x-agid-address-launch-center'];

  assert.equal(checklist.tags[0], 'Address Launch Center');
  assert.equal(evaluate.tags[0], 'Address Launch Center');
  assert.ok(extension.endpointOrder.includes('/address-launch-center/evaluate'));
  assert.ok(extension.requiredProductionGates.includes('webhook-signature-verification'));
  assert.ok(extension.requiredProductionGates.includes('revocation-freshness-registry'));
  assert.ok(extension.requiredProductionGates.includes('duplicate-aoid-prevention'));
  assert.ok(extension.requiredProductionGates.includes('high-risk-mode'));
  assert.equal(extension.privateMaterialAccepted, false);
  assert.equal(extension.rawAddressAccepted, false);
  assert.equal(extension.rawAgidAccepted, false);
  assert.equal(extension.rawAoidAccepted, false);
  assert.equal(extension.launchEvidenceOnly, true);

  const publicContract = JSON.stringify({
    paths: [
      AGID_OPENAPI_SPEC.paths['/address-launch-center/checklist'],
      AGID_OPENAPI_SPEC.paths['/address-launch-center/evaluate'],
    ],
    schemas: [
      AGID_OPENAPI_SPEC.components.schemas.AddressLaunchCenterEvaluationRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressLaunchCenterEvaluation,
    ],
    extension,
  });
  assert.doesNotMatch(publicContract, /"(recipientName|phoneNumber|unitNumber|rawAddress|addressText|plaintextAddress|rawApiKey|privateKey)"\s*:/i);
});

test('OpenAPI documents Address Operations as identity, webhook, dispute, tax, and dashboard surfaces', () => {
  const capabilities = AGID_OPENAPI_SPEC.paths['/address-operations/capabilities'].get;
  const identity = AGID_OPENAPI_SPEC.paths['/address-identity/verify'].post;
  const webhooks = AGID_OPENAPI_SPEC.paths['/address-webhooks/event'].post;
  const disputes = AGID_OPENAPI_SPEC.paths['/address-disputes/case'].post;
  const taxCustoms = AGID_OPENAPI_SPEC.paths['/address-tax-customs/context'].post;
  const dashboard = AGID_OPENAPI_SPEC.paths['/address-dashboard/snapshot'].post;
  const extension = AGID_OPENAPI_SPEC['x-agid-address-operations'];

  assert.equal(capabilities.tags[0], 'Address Operations');
  assert.equal(identity.tags[0], 'Address Operations');
  assert.equal(webhooks.tags[0], 'Address Operations');
  assert.equal(disputes.tags[0], 'Address Operations');
  assert.equal(taxCustoms.tags[0], 'Address Operations');
  assert.equal(dashboard.tags[0], 'Address Operations');
  assert.ok(extension.identityClaims.includes('delivery-eligibility'));
  assert.ok(extension.webhookTopics.includes('address_intent.verified'));
  assert.ok(extension.webhookTopics.includes('qr.used'));
  assert.ok(extension.disputeTypes.includes('pid-merge-split'));
  assert.ok(extension.dashboardSections.includes('api-keys'));
  assert.ok(extension.dashboardSections.includes('link-events'));
  assert.ok(extension.dashboardSections.includes('qr-usage'));
  assert.equal(extension.publicApiRawAddressAccepted, false);
  assert.equal(extension.publicApiRawAoidAccepted, false);
  assert.equal(extension.publicApiPasskeySecretAccepted, false);
  assert.equal(extension.taxCustomsDataPolicy, 'fully-free-local-first');

  const publicContract = JSON.stringify({
    paths: [
      AGID_OPENAPI_SPEC.paths['/address-identity/verify'],
      AGID_OPENAPI_SPEC.paths['/address-webhooks/event'],
      AGID_OPENAPI_SPEC.paths['/address-disputes/case'],
      AGID_OPENAPI_SPEC.paths['/address-tax-customs/context'],
      AGID_OPENAPI_SPEC.paths['/address-dashboard/snapshot'],
    ],
    schemas: [
      AGID_OPENAPI_SPEC.components.schemas.AddressIdentityVerificationRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressWebhookEventRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressDisputeCaseRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressTaxCustomsContextRequest,
      AGID_OPENAPI_SPEC.components.schemas.AddressDashboardSnapshotRequest,
    ],
  });
  assert.doesNotMatch(publicContract, /recipientName|phoneNumber|unitNumber|proofCode|passkeySecret|rawAddress|addressText|plaintextAddress|rawApiKey|privateKey/i);
});

test('OpenAPI documents cross-border auxiliary data as decision support only', () => {
  const sources = AGID_OPENAPI_SPEC.paths['/cross-border/auxiliary/sources'].get;
  const context = AGID_OPENAPI_SPEC.paths['/cross-border/auxiliary/context'].post;
  const shoppingAgent = AGID_OPENAPI_SPEC.paths['/shopping-agent/cross-border/context'].post;
  const auxiliary = AGID_OPENAPI_SPEC['x-agid-cross-border-auxiliary-data'];

  assert.equal(sources.tags[0], 'Cross-Border');
  assert.equal(context.tags[0], 'Cross-Border');
  assert.equal(shoppingAgent.tags[0], 'Cross-Border');
  assert.equal(auxiliary.decisionBoundary, 'decision-support-not-customs-clearance');
  assert.ok(auxiliary.allowedInputClasses.includes('hs-code'));
  assert.ok(auxiliary.allowedInputClasses.includes('barcode'));
  assert.ok(auxiliary.forbiddenInputClasses.includes('plaintext-address'));
  assert.ok(auxiliary.forbiddenInputClasses.includes('raw-aoid'));

  const publicContract = JSON.stringify({
    paths: [
      AGID_OPENAPI_SPEC.paths['/cross-border/auxiliary/sources'],
      AGID_OPENAPI_SPEC.paths['/cross-border/auxiliary/context'],
      AGID_OPENAPI_SPEC.paths['/shopping-agent/cross-border/context'],
    ],
    extension: auxiliary,
  });
  assert.doesNotMatch(publicContract, /recipientName|phoneNumber|unitNumber|plaintextAddress|privateAddressHistory/i);
});

test('OpenAPI extension documents AGID/AOID audit privacy guarantees', () => {
  const audit = AGID_OPENAPI_SPEC['x-agid-audit'];
  const health = AGID_OPENAPI_SPEC.components.schemas.CommunicationHealth;

  assert.equal(audit.modelVersion, 'agid-aoid-governance-v1');
  assert.equal(audit.rawPrivatePayloadStorage, 'forbidden');
  assert.ok(audit.requiredEvents.includes('sync'));
  assert.ok(audit.registeredSurfaces.includes('encrypted-sync'));
  assert.ok(audit.eventFields.includes('payloadFingerprint'));
  assert.ok('registrationAudit' in health.properties);
  assert.ok('aoidEncryptedSync' in health.properties);
  assert.ok('governanceModel' in health.properties);
});

test('OpenAPI extension exposes the ordered Polkadot integration plan without private payloads', () => {
  const polkadot = AGID_OPENAPI_SPEC['x-agid-polkadot'];

  assert.equal(polkadot.modelVersion, AGID_POLKADOT_INTEGRATION_MODEL_VERSION);
  assert.equal(polkadot.commitmentAlgorithm, AGID_POLKADOT_COMMITMENT_ALGORITHM);
  assert.equal(polkadot.firstStage, 'chain-commitment');
  assert.equal(polkadot.finalStage, 'address-dao');
  assert.deepEqual(polkadot.stageOrder, [
    'chain-commitment',
    'zk-address-proof',
    'zk-delivery',
    'address-credential',
    'credential-marketplace',
    'aoid-ownership',
    'aoid-inheritance',
    'address-reputation',
    'humanitarian-identity',
    'disaster-address',
    'address-lineage',
    'aoid-history-proof',
    'address-dao',
  ]);
  assert.equal(polkadot.onChainRule, 'commitments-policy-hashes-nullifiers-revocation-roots-only');
  assert.ok(polkadot.forbiddenOnChainPayloads.includes('plaintext-address'));
  assert.ok(polkadot.forbiddenOnChainPayloads.includes('raw-aoid'));
});

test('OpenAPI exposes place search language as separate from app and address languages', () => {
  const searchLanguage = AGID_OPENAPI_SPEC['x-agid-search-language'];
  assert.equal(searchLanguage.layer, 'place-search-only');
  assert.deepEqual(searchLanguage.independentFrom, ['app-language', 'address-language']);
  assert.equal(searchLanguage.providerHintParameter, 'accept_language');
  assert.ok(searchLanguage.appliesTo.includes('/osm-search'));

  const osmSearch = AGID_OPENAPI_SPEC.paths['/osm-search'].get;
  const acceptLanguage = osmSearch.parameters.find((parameter: any) => parameter.name === 'accept_language') as any;
  assert.match(acceptLanguage.description, /Search-only/);
});

test('OpenAPI pins strict Postal Context DTOs to the public runtime and service contract', () => {
  const schemas = AGID_OPENAPI_SPEC.components.schemas as Record<string, any>;
  const paths = AGID_OPENAPI_SPEC.paths as Record<string, any>;
  const expectedResponseRefs = {
    '/postal/capabilities': '#/components/schemas/AgidResultPostalContextCapabilities',
    '/postal/research': '#/components/schemas/AgidResultPostalContextResearchCatalog',
    '/postal/research/{country}': '#/components/schemas/AgidResultPostalContextResearchCountry',
    '/postal/releases/{country}': '#/components/schemas/AgidResultPostalContextCountryStatus',
    '/postal/resolve': '#/components/schemas/AgidResultPostalContextResolution',
    '/postal/intersects': '#/components/schemas/AgidResultPostalContextIntersection',
    '/postal/{country}/{postalCode}': '#/components/schemas/AgidResultPostalContextLookup',
  } as const;
  for (const [path, expectedRef] of Object.entries(expectedResponseRefs)) {
    const operation = paths[path].get ?? paths[path].post;
    assert.equal(operation.responses['200'].content['application/json'].schema.$ref, expectedRef);
  }

  const requiredSchemas = [
    'PostalContextTimeRange',
    'PostalContextPublicAssertionId',
    'PostalContextAmbiguity',
    'PostalContextCapabilities',
    'PostalContextPublicComponent',
    'PostalContextPublicResolutionComponent',
    'PostalContextPublicResolutionCandidate',
    'PostalContextPostalEvidence',
    'PostalContextAddressPointEvidence',
    'PostalContextAgidReference',
    'PostalContextPosition',
    'PostalContextLinearRing',
    'PostalContextPolygonCoordinates',
    'PostalContextPointGeometry',
    'PostalContextPolygonGeometry',
    'PostalContextMultiPolygonGeometry',
    'PostalContextGeoJsonGeometry',
    'PostalContextPostalGeometrySource',
    'PostalContextPostalGeometryResult',
    'PostalContextPostalLookupAlternative',
    'PostalContextPostalLookup',
    'PostalContextBbox',
    'PostalContextIntersection',
    'PostalContextRuntimeAttestation',
    'PostalContextRuntimeStatus',
    'PostalContextCountryStatus',
    'PostalContextCapabilitiesResponse',
    'PostalContextResearchAvailability',
    'PostalContextResearchCountry',
    'PostalContextResearchCatalog',
    'PostalContextRuntimeRelease',
    'PostalContextPublicResolution',
    'AgidResultPostalContextCapabilities',
    'AgidResultPostalContextResearchCatalog',
    'AgidResultPostalContextResearchCountry',
    'AgidResultPostalContextCountryStatus',
    'AgidResultPostalContextResolution',
    'AgidResultPostalContextIntersection',
    'AgidResultPostalContextLookup',
  ];
  requiredSchemas.forEach(name => assert.ok(name in schemas, `${name} is documented`));

  const strictObjectSchemas = [
    'PostalContextTimeRange',
    'PostalContextCapabilities',
    'PostalContextPublicComponent',
    'PostalContextPublicResolutionComponent',
    'PostalContextPublicResolutionCandidate',
    'PostalContextPostalEvidence',
    'PostalContextAddressPointEvidence',
    'PostalContextAgidReference',
    'PostalContextPointGeometry',
    'PostalContextPolygonGeometry',
    'PostalContextMultiPolygonGeometry',
    'PostalContextPostalGeometrySource',
    'PostalContextPostalGeometryResult',
    'PostalContextPostalLookupAlternative',
    'PostalContextPostalLookup',
    'PostalContextIntersection',
    'PostalContextRuntimeAttestation',
    'PostalContextRuntimeStatus',
    'PostalContextCountryStatus',
    'PostalContextCapabilitiesResponse',
    'PostalContextResearchAvailability',
    'PostalContextResearchCountry',
    'PostalContextResearchCatalog',
    'PostalContextRuntimeRelease',
    'PostalContextPublicResolution',
    'AgidResultPostalContextCapabilities',
    'AgidResultPostalContextResearchCatalog',
    'AgidResultPostalContextResearchCountry',
    'AgidResultPostalContextCountryStatus',
    'AgidResultPostalContextResolution',
    'AgidResultPostalContextIntersection',
    'AgidResultPostalContextLookup',
  ];
  strictObjectSchemas.forEach(name => assert.equal(
    schemas[name].additionalProperties,
    false,
    `${name} rejects undeclared fields`,
  ));

  assert.equal(
    schemas.PostalContextPublicResolution.properties.selected.$ref,
    '#/components/schemas/PostalContextPublicResolutionCandidate',
  );
  assert.equal(
    schemas.PostalContextPublicResolutionCandidate.properties.components.items.$ref,
    '#/components/schemas/PostalContextPublicResolutionComponent',
  );
  assert.equal(
    schemas.PostalContextPostalLookup.properties.alternatives.items.$ref,
    '#/components/schemas/PostalContextPostalLookupAlternative',
  );
  assert.equal(schemas.PostalContextPublicAssertionId.pattern, '^(?!runtime:).+');
  assert.equal('nodeId' in schemas.PostalContextPublicResolutionComponent.properties, false);
  assert.equal('pathId' in schemas.PostalContextPublicResolutionCandidate.properties, false);
  assert.ok(schemas.PostalContextPostalLookup.required.includes('normalizedPostalCode'));
  assert.ok(
    schemas.PostalContextPublicResolutionComponent.properties.featureKind.enum.includes('query_point'),
  );
  assert.equal(schemas.PostalContextPostalLookup.properties.postalFeatures.maxItems, 64);
  assert.equal(schemas.PostalContextPostalLookup.properties.contexts.maxItems, 256);
  assert.equal(schemas.PostalContextPostalLookup.properties.assertionIds.maxItems, 2048);
  assert.equal(schemas.PostalContextPostalLookup.properties.alternatives.maxItems, 32);
  assert.equal(schemas.PostalContextPostalLookupAlternative.properties.contexts.maxItems, 256);
  assert.equal(schemas.PostalContextPostalLookupAlternative.properties.assertionIds.maxItems, 2048);
  assert.equal(schemas.PostalContextPostalLookup.properties.geometries.maxItems, 16);
  assert.equal(schemas.PostalContextIntersection.properties.matches.maxItems, 16);

  const intersectionLimit = paths['/postal/intersects'].get.parameters.find(
    (parameter: any) => parameter.name === 'limit',
  );
  assert.equal(intersectionLimit.schema.maximum, 16);
  assert.equal(intersectionLimit.schema.default, 16);
  const lookupGeometry = paths['/postal/{country}/{postalCode}'].get.parameters.find(
    (parameter: any) => parameter.name === 'geometry',
  );
  assert.deepEqual(lookupGeometry.schema.enum, ['geojson', 'none']);
  assert.equal(lookupGeometry.schema.default, 'none');
  assert.match(
    lookupGeometry.description,
    /only when explicitly set to geojson/i,
  );

  const resolvePublicContract = JSON.stringify([
    schemas.PostalContextPublicResolution,
    schemas.PostalContextPublicResolutionCandidate,
    schemas.PostalContextPublicResolutionComponent,
    schemas.PostalContextPostalEvidence,
    schemas.PostalContextAddressPointEvidence,
  ]);
  assert.doesNotMatch(
    resolvePublicContract,
    /nodeId|pathId|rootAddressRecordId|geometryFeatureId|distanceMeters|matchRadiusMeters|latitude|longitude|coordinates|recipient|phone|unitNumber/i,
  );

  const lookupPublicContract = JSON.stringify([
    schemas.PostalContextPublicComponent,
    schemas.PostalContextPostalGeometryResult,
    schemas.PostalContextPostalLookupAlternative,
    schemas.PostalContextPostalLookup,
    schemas.PostalContextIntersection,
  ]);
  assert.doesNotMatch(
    lookupPublicContract,
    /nodeId|pathId|rootAddressRecordId|geometryFeatureId|distanceMeters|matchRadiusMeters|recipient|phone|unitNumber/i,
  );
});
