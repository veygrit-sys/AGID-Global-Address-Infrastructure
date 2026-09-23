import { apiV1Path } from './apiVersion';

type Coordinate = {
  lat: number;
  lon: number;
};

type ReverseGeocodeParams = Coordinate & {
  zoom?: number;
  addressdetails?: 0 | 1;
  lang?: string;
  countryCode?: string;
};

type OsmSearchParams = {
  q: string;
  limit?: number;
  polygonGeojson?: boolean;
  viewbox?: string;
  bounded?: boolean;
  acceptLanguage?: string;
};

type AddressStandardLibraryCapabilitiesParams = {
  countryCode?: string;
  hasPostcode?: boolean;
  hasCoordinates?: boolean;
  sourceLanguage?: string;
  targetLanguage?: string;
  needsNaturalGeographyContext?: boolean;
  sparseOrRemoteArea?: boolean;
};

type CredentialIssuerTrustRegistrySnapshotParams = {
  registryId?: string;
  registryVersion?: string;
};

function cleanCountryCode(countryCode: string) {
  return countryCode.trim().toUpperCase();
}

function cleanOptionalText(value: string | undefined) {
  return value?.trim();
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value.trim());
}

function withParams(path: string, params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export const apiEndpoints = {
  countryStats(countryCode: string) {
    return withParams(apiV1Path('/country-stats'), { cc: cleanCountryCode(countryCode) });
  },

  countryCities(countryCode: string) {
    return withParams(apiV1Path('/country-cities'), { cc: cleanCountryCode(countryCode) });
  },

  countryBoundary(countryCode: string) {
    return withParams(apiV1Path('/country-boundary'), { cc: cleanCountryCode(countryCode) });
  },

  dataQualityReport() {
    return apiV1Path('/data-quality/report');
  },

  addressVerify() {
    return apiV1Path('/address/verify');
  },

  addressVerifyCapabilities() {
    return apiV1Path('/address/verify/capabilities');
  },

  addressStandardLibraryCapabilities(params: AddressStandardLibraryCapabilitiesParams = {}) {
    return withParams(apiV1Path('/address/standard-library/capabilities'), {
      cc: params.countryCode ? cleanCountryCode(params.countryCode) : undefined,
      hasPostcode: params.hasPostcode ? 1 : undefined,
      hasCoordinates: params.hasCoordinates ? 1 : undefined,
      sourceLanguage: cleanOptionalText(params.sourceLanguage),
      targetLanguage: cleanOptionalText(params.targetLanguage),
      natural: params.needsNaturalGeographyContext ? 1 : undefined,
      remote: params.sparseOrRemoteArea ? 1 : undefined,
    });
  },

  addressStandardLibraryResolve() {
    return apiV1Path('/address/standard-library/resolve');
  },

  addressExternalValidatorsCapabilities() {
    return apiV1Path('/address/external-validators/capabilities');
  },

  addressExternalValidatorImport() {
    return apiV1Path('/address/external-validators/import');
  },

  addressVerifyWithExternalValidators() {
    return apiV1Path('/address/verify/external');
  },

  addressIntentCapabilities() {
    return apiV1Path('/address-intents/capabilities');
  },

  addressIntents() {
    return apiV1Path('/address-intents');
  },

  addressIntent(intentId: string) {
    return apiV1Path(`/address-intents/${encodePathSegment(intentId)}`);
  },

  addressIntentUpdate(intentId: string) {
    return apiV1Path(`/address-intents/${encodePathSegment(intentId)}/update`);
  },

  addressIntentRecent() {
    return apiV1Path('/address-intents/recent');
  },

  addressElementCapabilities() {
    return apiV1Path('/address-element/capabilities');
  },

  addressElementSession() {
    return apiV1Path('/address-element/session');
  },

  addressRadarRules() {
    return apiV1Path('/address-radar/rules');
  },

  addressRadarEvaluate() {
    return apiV1Path('/address-radar/evaluate');
  },

  addressSignalChecks() {
    return apiV1Path('/address-signal/checks');
  },

  addressSignalEvaluate() {
    return apiV1Path('/address-signal/evaluate');
  },

  addressOperationsCapabilities() {
    return apiV1Path('/address-operations/capabilities');
  },

  addressQualityFeedback() {
    return apiV1Path('/address-quality/feedback');
  },

  addressQualityFeedbackCapabilities() {
    return apiV1Path('/address-quality/feedback/capabilities');
  },

  addressIdentityVerify() {
    return apiV1Path('/address-identity/verify');
  },

  addressWebhookEvent() {
    return apiV1Path('/address-webhooks/event');
  },

  addressDisputeCase() {
    return apiV1Path('/address-disputes/case');
  },

  addressTaxCustomsContext() {
    return apiV1Path('/address-tax-customs/context');
  },

  addressDashboardSnapshot() {
    return apiV1Path('/address-dashboard/snapshot');
  },

  addressConnectCapabilities() {
    return apiV1Path('/address-connect/capabilities');
  },

  addressConnectRegistry() {
    return apiV1Path('/address-connect/registry');
  },

  addressConnectDiscover() {
    return apiV1Path('/address-connect/discover');
  },

  addressConnectOperationsRequirements() {
    return apiV1Path('/address-connect/operations/requirements');
  },

  addressConnectOperationsReport() {
    return apiV1Path('/address-connect/operations/report');
  },

  addressScaleCapabilities() {
    return apiV1Path('/address-scale/capabilities');
  },

  addressScaleTopology() {
    return apiV1Path('/address-scale/topology');
  },

  addressTerminalCapabilities() {
    return apiV1Path('/address-terminal/capabilities');
  },

  addressTerminalFleet() {
    return apiV1Path('/address-terminal/fleet');
  },

  droneDeliveryEvidenceCapabilities() {
    return apiV1Path('/drone-delivery-evidence/capabilities');
  },

  droneDeliveryEvidenceReport() {
    return apiV1Path('/drone-delivery-evidence/report');
  },

  warehouseLockerSimulatorCapabilities() {
    return apiV1Path('/warehouse-locker-simulator/capabilities');
  },

  warehouseLockerSimulatorRun() {
    return apiV1Path('/warehouse-locker-simulator/run');
  },

  addressLaunchCenterChecklist() {
    return apiV1Path('/address-launch-center/checklist');
  },

  addressLaunchCenterEvaluate() {
    return apiV1Path('/address-launch-center/evaluate');
  },

  mcp() {
    return apiV1Path('/mcp');
  },

  credentialIssuerTrustRegistrySnapshot(params: CredentialIssuerTrustRegistrySnapshotParams = {}) {
    return withParams(apiV1Path('/credential-issuers/trust-registry/snapshot'), {
      registry_id: cleanOptionalText(params.registryId),
      registry_version: cleanOptionalText(params.registryVersion),
    });
  },

  credentialIssuerTrustEvaluate() {
    return apiV1Path('/credential-issuers/trust-registry/evaluate');
  },

  credentialIssuerTrustVerifyCredential() {
    return apiV1Path('/credential-issuers/trust-registry/verify-credential');
  },

  zkProofBundleRegister() {
    return apiV1Path('/zk/proof-bundles/register');
  },

  zkProofBundleVerify(bundleId: string) {
    return apiV1Path(`/zk/proof-bundles/${encodePathSegment(bundleId)}/verify`);
  },

  zkProofBundleRevoke(bundleId: string) {
    return apiV1Path(`/zk/proof-bundles/${encodePathSegment(bundleId)}/revoke`);
  },

  zkProofBundleStats() {
    return apiV1Path('/zk/proof-bundles/stats');
  },

  zkMode2Capabilities() {
    return apiV1Path('/zk/mode2/capabilities');
  },

  zkMode2PrivateAddressPredicateVerify() {
    return apiV1Path('/zk/mode2/private-address-predicate/verify');
  },

  zkMode2ProofBundleVerify() {
    return apiV1Path('/zk/mode2/proof-bundle/verify');
  },

  managedZkProofServerCapabilities() {
    return apiV1Path('/zk/managed-proof-server/capabilities');
  },

  managedZkProofServerJobs() {
    return apiV1Path('/zk/managed-proof-server/jobs');
  },

  privateDeploymentCapabilities() {
    return apiV1Path('/private-deployments/capabilities');
  },

  privateDeploymentPlan() {
    return apiV1Path('/private-deployments/plan');
  },

  ethereumMode3Capabilities() {
    return apiV1Path('/ethereum/mode3/capabilities');
  },

  ethereumMode3Registry() {
    return apiV1Path('/ethereum/mode3/registry');
  },

  ethereumMode3IssuerRegister() {
    return apiV1Path('/ethereum/mode3/issuer/register');
  },

  ethereumMode3RevocationAnchor() {
    return apiV1Path('/ethereum/mode3/revocation/anchor');
  },

  ethereumMode3NullifierMarkUsed() {
    return apiV1Path('/ethereum/mode3/nullifier/mark-used');
  },

  ethereumMode3PaymentRecord() {
    return apiV1Path('/ethereum/mode3/payment/record');
  },

  zkEthereumMode4Capabilities() {
    return apiV1Path('/zk-ethereum/mode4/capabilities');
  },

  zkEthereumMode4Registry() {
    return apiV1Path('/zk-ethereum/mode4/registry');
  },

  zkEthereumMode4PrivateAddressPredicateVerifyAndRecord() {
    return apiV1Path('/zk-ethereum/mode4/private-address-predicate/verify-and-record');
  },

  revocationFreshnessAnchor() {
    return apiV1Path('/revocation-freshness/anchor');
  },

  revocationFreshnessVerify() {
    return apiV1Path('/revocation-freshness/verify');
  },

  polkadotStages() {
    return apiV1Path('/polkadot/stages');
  },

  polkadotCommitment() {
    return apiV1Path('/polkadot/commitment');
  },

  polkadotAnchor() {
    return apiV1Path('/polkadot/anchor');
  },

  polkadotQuery(commitmentId: string) {
    return apiV1Path(`/polkadot/commitments/${encodePathSegment(commitmentId)}`);
  },

  polkadotFinality(commitmentId: string) {
    return apiV1Path(`/polkadot/commitments/${encodePathSegment(commitmentId)}/finality`);
  },

  amnResolve() {
    return apiV1Path('/amn/resolve');
  },

  amnRegistryVerify(envelopeId: string) {
    return apiV1Path(`/amn/registry/${encodePathSegment(envelopeId)}/verify`);
  },

  amnRegistryStats() {
    return apiV1Path('/amn/registry/stats');
  },

  posCapabilities() {
    return apiV1Path('/pos/capabilities');
  },

  posAcceptance() {
    return apiV1Path('/pos/acceptance');
  },

  posAcceptanceRecent() {
    return apiV1Path('/pos/acceptance/recent');
  },

  posExternalCapabilities() {
    return apiV1Path('/pos/external/capabilities');
  },

  posExternalImport() {
    return apiV1Path('/pos/external/import');
  },

  posExternalRequest() {
    return apiV1Path('/pos/external/request');
  },

  posExternalSaleLink() {
    return apiV1Path('/pos/external/sale-link');
  },

  posExternalPickupReady() {
    return apiV1Path('/pos/external/pickup-ready');
  },

  posExternalHandoffComplete() {
    return apiV1Path('/pos/external/handoff-complete');
  },

  posExternalReceiptExport() {
    return apiV1Path('/pos/external/receipt-export');
  },

  posExternalCustomerNote() {
    return apiV1Path('/pos/external/customer-note');
  },

  posExternalRefundRelease() {
    return apiV1Path('/pos/external/refund-release');
  },

  posAgidSecureRegistry() {
    return apiV1Path('/pos/agid-s/registry');
  },

  posAgidSecureRegistryVerify() {
    return apiV1Path('/pos/agid-s/registry/verify');
  },

  posAgidSecureMarkUsed() {
    return apiV1Path('/pos/agid-s/registry/mark-used');
  },

  posAgidSecureRevokeToken() {
    return apiV1Path('/pos/agid-s/registry/revoke-token');
  },

  posAgidSecureRevokeKey() {
    return apiV1Path('/pos/agid-s/registry/revoke-key');
  },

  posAgidSecureAudit() {
    return apiV1Path('/pos/agid-s/registry/audit');
  },

  posAgidSecureSyncOffline() {
    return apiV1Path('/pos/agid-s/registry/sync-offline');
  },

  crossBorderAuxiliarySources() {
    return apiV1Path('/cross-border/auxiliary/sources');
  },

  crossBorderAuxiliaryContext() {
    return apiV1Path('/cross-border/auxiliary/context');
  },

  shoppingAgentCrossBorderContext() {
    return apiV1Path('/shopping-agent/cross-border/context');
  },

  deliveryExternalCapabilities() {
    return apiV1Path('/delivery/external/capabilities');
  },

  deliveryExternalImport() {
    return apiV1Path('/delivery/external/import');
  },

  deliveryExternalRequest() {
    return apiV1Path('/delivery/external/request');
  },

  deliveryExternalQuote() {
    return apiV1Path('/delivery/external/quote');
  },

  deliveryExternalCreateShipment() {
    return apiV1Path('/delivery/external/create-shipment');
  },

  deliveryExternalCreateLabel() {
    return apiV1Path('/delivery/external/create-label');
  },

  deliveryExternalTrack() {
    return apiV1Path('/delivery/external/track');
  },

  deliveryExternalCancel() {
    return apiV1Path('/delivery/external/cancel');
  },

  deliveryExternalPickup() {
    return apiV1Path('/delivery/external/pickup');
  },

  deliveryExternalCarrierAcceptance() {
    return apiV1Path('/delivery/external/carrier-acceptance');
  },

  deliveryExternalDeliveryProof() {
    return apiV1Path('/delivery/external/delivery-proof');
  },

  cloudDbConnectors() {
    return apiV1Path('/cloud-db/connectors');
  },

  cloudDbCompatibility() {
    return apiV1Path('/cloud-db/compatibility');
  },

  cloudDbPlan() {
    return apiV1Path('/cloud-db/plan');
  },

  cloudDbSyncJob() {
    return apiV1Path('/cloud-db/sync-job');
  },

  osmSearch({ q, limit, polygonGeojson, viewbox, bounded, acceptLanguage }: OsmSearchParams) {
    return withParams(apiV1Path('/osm-search'), {
      q,
      limit,
      polygon_geojson: polygonGeojson ? 1 : undefined,
      viewbox,
      bounded: bounded ? 1 : undefined,
      accept_language: acceptLanguage,
    });
  },

  photonSearch(query: string, limit = 5, lat?: number, lon?: number) {
    return withParams(apiV1Path('/photon'), { q: query, limit, lat, lon });
  },

  osrmRoute(start: { lng: number; lat: number }, end: { lng: number; lat: number }, profile: string) {
    return withParams(apiV1Path('/osrm/route'), {
      start: `${start.lng},${start.lat}`,
      end: `${end.lng},${end.lat}`,
      profile,
    });
  },

  nominatimReverse({ lat, lon, zoom = 18, addressdetails = 1, lang, countryCode }: ReverseGeocodeParams) {
    return withParams(apiV1Path('/nominatim/reverse'), {
      lat,
      lon,
      zoom,
      addressdetails,
      lang,
      cc: countryCode ? cleanCountryCode(countryCode) : undefined,
    });
  },

  osmReverse({ lat, lon, zoom = 18, addressdetails = 1, lang, countryCode }: ReverseGeocodeParams) {
    return withParams(apiV1Path('/osm-reverse'), {
      lat,
      lon,
      zoom,
      addressdetails,
      lang,
      cc: countryCode ? cleanCountryCode(countryCode) : undefined,
    });
  },

  overpass() {
    return apiV1Path('/overpass');
  },

  terrainTile() {
    return apiV1Path('/terrain/{z}/{x}/{y}.png');
  },
};
