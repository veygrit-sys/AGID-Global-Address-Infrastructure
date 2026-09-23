import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiEndpoints } from './apiEndpoints';

test('builds country admin endpoints with normalized country codes', () => {
  assert.equal(apiEndpoints.countryStats(' jp '), '/api/v1/country-stats?cc=JP');
  assert.equal(apiEndpoints.countryCities('vn'), '/api/v1/country-cities?cc=VN');
  assert.equal(apiEndpoints.countryBoundary('br'), '/api/v1/country-boundary?cc=BR');
  assert.equal(apiEndpoints.addressVerify(), '/api/v1/address/verify');
  assert.equal(apiEndpoints.addressVerifyCapabilities(), '/api/v1/address/verify/capabilities');
  assert.equal(apiEndpoints.addressStandardLibraryResolve(), '/api/v1/address/standard-library/resolve');
  assert.equal(apiEndpoints.addressExternalValidatorsCapabilities(), '/api/v1/address/external-validators/capabilities');
  assert.equal(apiEndpoints.addressExternalValidatorImport(), '/api/v1/address/external-validators/import');
  assert.equal(apiEndpoints.addressVerifyWithExternalValidators(), '/api/v1/address/verify/external');
  assert.equal(apiEndpoints.addressIntentCapabilities(), '/api/v1/address-intents/capabilities');
  assert.equal(apiEndpoints.addressIntents(), '/api/v1/address-intents');
  assert.equal(apiEndpoints.addressIntent(' AIT-ABC123 '), '/api/v1/address-intents/AIT-ABC123');
  assert.equal(apiEndpoints.addressIntentUpdate(' AIT-ABC123 '), '/api/v1/address-intents/AIT-ABC123/update');
  assert.equal(apiEndpoints.addressIntentRecent(), '/api/v1/address-intents/recent');
  assert.equal(apiEndpoints.addressElementCapabilities(), '/api/v1/address-element/capabilities');
  assert.equal(apiEndpoints.addressElementSession(), '/api/v1/address-element/session');
  assert.equal(apiEndpoints.addressRadarRules(), '/api/v1/address-radar/rules');
  assert.equal(apiEndpoints.addressRadarEvaluate(), '/api/v1/address-radar/evaluate');
  assert.equal(apiEndpoints.addressSignalChecks(), '/api/v1/address-signal/checks');
  assert.equal(apiEndpoints.addressSignalEvaluate(), '/api/v1/address-signal/evaluate');
  assert.equal(apiEndpoints.addressOperationsCapabilities(), '/api/v1/address-operations/capabilities');
  assert.equal(apiEndpoints.addressQualityFeedback(), '/api/v1/address-quality/feedback');
  assert.equal(apiEndpoints.addressQualityFeedbackCapabilities(), '/api/v1/address-quality/feedback/capabilities');
  assert.equal(apiEndpoints.addressIdentityVerify(), '/api/v1/address-identity/verify');
  assert.equal(apiEndpoints.addressWebhookEvent(), '/api/v1/address-webhooks/event');
  assert.equal(apiEndpoints.addressDisputeCase(), '/api/v1/address-disputes/case');
  assert.equal(apiEndpoints.addressTaxCustomsContext(), '/api/v1/address-tax-customs/context');
  assert.equal(apiEndpoints.addressDashboardSnapshot(), '/api/v1/address-dashboard/snapshot');
  assert.equal(apiEndpoints.addressConnectCapabilities(), '/api/v1/address-connect/capabilities');
  assert.equal(apiEndpoints.addressConnectRegistry(), '/api/v1/address-connect/registry');
  assert.equal(apiEndpoints.addressConnectDiscover(), '/api/v1/address-connect/discover');
  assert.equal(apiEndpoints.addressConnectOperationsRequirements(), '/api/v1/address-connect/operations/requirements');
  assert.equal(apiEndpoints.addressConnectOperationsReport(), '/api/v1/address-connect/operations/report');
  assert.equal(apiEndpoints.addressScaleCapabilities(), '/api/v1/address-scale/capabilities');
  assert.equal(apiEndpoints.addressScaleTopology(), '/api/v1/address-scale/topology');
  assert.equal(apiEndpoints.addressTerminalCapabilities(), '/api/v1/address-terminal/capabilities');
  assert.equal(apiEndpoints.addressTerminalFleet(), '/api/v1/address-terminal/fleet');
  assert.equal(apiEndpoints.droneDeliveryEvidenceCapabilities(), '/api/v1/drone-delivery-evidence/capabilities');
  assert.equal(apiEndpoints.droneDeliveryEvidenceReport(), '/api/v1/drone-delivery-evidence/report');
  assert.equal(apiEndpoints.warehouseLockerSimulatorCapabilities(), '/api/v1/warehouse-locker-simulator/capabilities');
  assert.equal(apiEndpoints.warehouseLockerSimulatorRun(), '/api/v1/warehouse-locker-simulator/run');
  assert.equal(apiEndpoints.addressLaunchCenterChecklist(), '/api/v1/address-launch-center/checklist');
  assert.equal(apiEndpoints.addressLaunchCenterEvaluate(), '/api/v1/address-launch-center/evaluate');
  assert.equal(
    apiEndpoints.addressStandardLibraryCapabilities({
      countryCode: ' jp ',
      hasPostcode: true,
      hasCoordinates: true,
      sourceLanguage: 'ja',
      targetLanguage: 'en',
      needsNaturalGeographyContext: true,
      sparseOrRemoteArea: true,
    }),
    '/api/v1/address/standard-library/capabilities?cc=JP&hasPostcode=1&hasCoordinates=1&sourceLanguage=ja&targetLanguage=en&natural=1&remote=1',
  );
});

test('builds encoded search and routing endpoints', () => {
  assert.equal(
    apiEndpoints.osmSearch({ q: 'São Paulo, Brazil', limit: 1, polygonGeojson: true, acceptLanguage: 'pt,en,local' }),
    '/api/v1/osm-search?q=S%C3%A3o+Paulo%2C+Brazil&limit=1&polygon_geojson=1&accept_language=pt%2Cen%2Clocal',
  );
  assert.equal(
    apiEndpoints.photonSearch('Tokyo Station', 3, 35.6812, 139.7671),
    '/api/v1/photon?q=Tokyo+Station&limit=3&lat=35.6812&lon=139.7671',
  );
  assert.equal(
    apiEndpoints.osrmRoute({ lng: 139.7, lat: 35.6 }, { lng: 139.8, lat: 35.7 }, 'driving'),
    '/api/v1/osrm/route?start=139.7%2C35.6&end=139.8%2C35.7&profile=driving',
  );
});

test('omits optional reverse geocode parameters when absent', () => {
  assert.equal(
    apiEndpoints.nominatimReverse({ lat: 35.6812, lon: 139.7671 }),
    '/api/v1/nominatim/reverse?lat=35.6812&lon=139.7671&zoom=18&addressdetails=1',
  );
});

test('builds credential issuer trust registry endpoints', () => {
  assert.equal(
    apiEndpoints.credentialIssuerTrustRegistrySnapshot({
      registryId: ' agid-credential-issuer-trust ',
      registryVersion: '2026.06',
    }),
    '/api/v1/credential-issuers/trust-registry/snapshot?registry_id=agid-credential-issuer-trust&registry_version=2026.06',
  );
  assert.equal(
    apiEndpoints.credentialIssuerTrustRegistrySnapshot(),
    '/api/v1/credential-issuers/trust-registry/snapshot',
  );
  assert.equal(
    apiEndpoints.credentialIssuerTrustEvaluate(),
    '/api/v1/credential-issuers/trust-registry/evaluate',
  );
  assert.equal(
    apiEndpoints.credentialIssuerTrustVerifyCredential(),
    '/api/v1/credential-issuers/trust-registry/verify-credential',
  );
});

test('builds ZK proof bundle, freshness anchor, and Polkadot endpoints', () => {
  assert.equal(apiEndpoints.mcp(), '/api/v1/mcp');
  assert.equal(apiEndpoints.zkProofBundleRegister(), '/api/v1/zk/proof-bundles/register');
  assert.equal(apiEndpoints.zkProofBundleVerify('ZKB-ABC123'), '/api/v1/zk/proof-bundles/ZKB-ABC123/verify');
  assert.equal(apiEndpoints.zkProofBundleRevoke('ZKB-ABC123'), '/api/v1/zk/proof-bundles/ZKB-ABC123/revoke');
  assert.equal(apiEndpoints.zkProofBundleStats(), '/api/v1/zk/proof-bundles/stats');
  assert.equal(apiEndpoints.zkMode2Capabilities(), '/api/v1/zk/mode2/capabilities');
  assert.equal(
    apiEndpoints.zkMode2PrivateAddressPredicateVerify(),
    '/api/v1/zk/mode2/private-address-predicate/verify',
  );
  assert.equal(apiEndpoints.zkMode2ProofBundleVerify(), '/api/v1/zk/mode2/proof-bundle/verify');
  assert.equal(apiEndpoints.managedZkProofServerCapabilities(), '/api/v1/zk/managed-proof-server/capabilities');
  assert.equal(apiEndpoints.managedZkProofServerJobs(), '/api/v1/zk/managed-proof-server/jobs');
  assert.equal(apiEndpoints.privateDeploymentCapabilities(), '/api/v1/private-deployments/capabilities');
  assert.equal(apiEndpoints.privateDeploymentPlan(), '/api/v1/private-deployments/plan');
  assert.equal(apiEndpoints.ethereumMode3Capabilities(), '/api/v1/ethereum/mode3/capabilities');
  assert.equal(apiEndpoints.ethereumMode3Registry(), '/api/v1/ethereum/mode3/registry');
  assert.equal(apiEndpoints.ethereumMode3IssuerRegister(), '/api/v1/ethereum/mode3/issuer/register');
  assert.equal(apiEndpoints.ethereumMode3RevocationAnchor(), '/api/v1/ethereum/mode3/revocation/anchor');
  assert.equal(apiEndpoints.ethereumMode3NullifierMarkUsed(), '/api/v1/ethereum/mode3/nullifier/mark-used');
  assert.equal(apiEndpoints.ethereumMode3PaymentRecord(), '/api/v1/ethereum/mode3/payment/record');
  assert.equal(apiEndpoints.zkEthereumMode4Capabilities(), '/api/v1/zk-ethereum/mode4/capabilities');
  assert.equal(apiEndpoints.zkEthereumMode4Registry(), '/api/v1/zk-ethereum/mode4/registry');
  assert.equal(
    apiEndpoints.zkEthereumMode4PrivateAddressPredicateVerifyAndRecord(),
    '/api/v1/zk-ethereum/mode4/private-address-predicate/verify-and-record',
  );
  assert.equal(apiEndpoints.revocationFreshnessAnchor(), '/api/v1/revocation-freshness/anchor');
  assert.equal(apiEndpoints.revocationFreshnessVerify(), '/api/v1/revocation-freshness/verify');
  assert.equal(apiEndpoints.polkadotStages(), '/api/v1/polkadot/stages');
  assert.equal(apiEndpoints.polkadotCommitment(), '/api/v1/polkadot/commitment');
  assert.equal(apiEndpoints.polkadotAnchor(), '/api/v1/polkadot/anchor');
  assert.equal(apiEndpoints.polkadotQuery('POLKA-ABC123'), '/api/v1/polkadot/commitments/POLKA-ABC123');
  assert.equal(apiEndpoints.polkadotFinality('POLKA-ABC123'), '/api/v1/polkadot/commitments/POLKA-ABC123/finality');
});

test('builds AMN resolution envelope and registry endpoints', () => {
  assert.equal(apiEndpoints.amnResolve(), '/api/v1/amn/resolve');
  assert.equal(apiEndpoints.amnRegistryVerify(' AMN-ABC123 '), '/api/v1/amn/registry/AMN-ABC123/verify');
  assert.equal(apiEndpoints.amnRegistryStats(), '/api/v1/amn/registry/stats');
});

test('builds POS QR and NFC acceptance endpoints', () => {
  assert.equal(apiEndpoints.posCapabilities(), '/api/v1/pos/capabilities');
  assert.equal(apiEndpoints.posAcceptance(), '/api/v1/pos/acceptance');
  assert.equal(apiEndpoints.posAcceptanceRecent(), '/api/v1/pos/acceptance/recent');
  assert.equal(apiEndpoints.posExternalCapabilities(), '/api/v1/pos/external/capabilities');
  assert.equal(apiEndpoints.posExternalImport(), '/api/v1/pos/external/import');
  assert.equal(apiEndpoints.posExternalRequest(), '/api/v1/pos/external/request');
  assert.equal(apiEndpoints.posExternalSaleLink(), '/api/v1/pos/external/sale-link');
  assert.equal(apiEndpoints.posExternalPickupReady(), '/api/v1/pos/external/pickup-ready');
  assert.equal(apiEndpoints.posExternalHandoffComplete(), '/api/v1/pos/external/handoff-complete');
  assert.equal(apiEndpoints.posExternalReceiptExport(), '/api/v1/pos/external/receipt-export');
  assert.equal(apiEndpoints.posExternalCustomerNote(), '/api/v1/pos/external/customer-note');
  assert.equal(apiEndpoints.posExternalRefundRelease(), '/api/v1/pos/external/refund-release');
  assert.equal(apiEndpoints.posAgidSecureRegistry(), '/api/v1/pos/agid-s/registry');
  assert.equal(apiEndpoints.posAgidSecureRegistryVerify(), '/api/v1/pos/agid-s/registry/verify');
  assert.equal(apiEndpoints.posAgidSecureMarkUsed(), '/api/v1/pos/agid-s/registry/mark-used');
  assert.equal(apiEndpoints.posAgidSecureRevokeToken(), '/api/v1/pos/agid-s/registry/revoke-token');
  assert.equal(apiEndpoints.posAgidSecureRevokeKey(), '/api/v1/pos/agid-s/registry/revoke-key');
  assert.equal(apiEndpoints.posAgidSecureAudit(), '/api/v1/pos/agid-s/registry/audit');
  assert.equal(apiEndpoints.posAgidSecureSyncOffline(), '/api/v1/pos/agid-s/registry/sync-offline');
});

test('builds cross-border POS and shopping-agent auxiliary endpoints', () => {
  assert.equal(apiEndpoints.crossBorderAuxiliarySources(), '/api/v1/cross-border/auxiliary/sources');
  assert.equal(apiEndpoints.crossBorderAuxiliaryContext(), '/api/v1/cross-border/auxiliary/context');
  assert.equal(apiEndpoints.shoppingAgentCrossBorderContext(), '/api/v1/shopping-agent/cross-border/context');
  assert.equal(apiEndpoints.deliveryExternalCapabilities(), '/api/v1/delivery/external/capabilities');
  assert.equal(apiEndpoints.deliveryExternalImport(), '/api/v1/delivery/external/import');
  assert.equal(apiEndpoints.deliveryExternalRequest(), '/api/v1/delivery/external/request');
  assert.equal(apiEndpoints.deliveryExternalQuote(), '/api/v1/delivery/external/quote');
  assert.equal(apiEndpoints.deliveryExternalCreateShipment(), '/api/v1/delivery/external/create-shipment');
  assert.equal(apiEndpoints.deliveryExternalCreateLabel(), '/api/v1/delivery/external/create-label');
  assert.equal(apiEndpoints.deliveryExternalTrack(), '/api/v1/delivery/external/track');
  assert.equal(apiEndpoints.deliveryExternalCancel(), '/api/v1/delivery/external/cancel');
  assert.equal(apiEndpoints.deliveryExternalPickup(), '/api/v1/delivery/external/pickup');
  assert.equal(apiEndpoints.deliveryExternalCarrierAcceptance(), '/api/v1/delivery/external/carrier-acceptance');
  assert.equal(apiEndpoints.deliveryExternalDeliveryProof(), '/api/v1/delivery/external/delivery-proof');
});

test('builds cloud and database connector endpoints', () => {
  assert.equal(apiEndpoints.cloudDbConnectors(), '/api/v1/cloud-db/connectors');
  assert.equal(apiEndpoints.cloudDbCompatibility(), '/api/v1/cloud-db/compatibility');
  assert.equal(apiEndpoints.cloudDbPlan(), '/api/v1/cloud-db/plan');
  assert.equal(apiEndpoints.cloudDbSyncJob(), '/api/v1/cloud-db/sync-job');
});
