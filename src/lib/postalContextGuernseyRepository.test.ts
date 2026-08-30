import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const manifest = readJson('data/postal_country_packs/gg/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/gg/postal-context/source-profile.json');
const review = readJson('reports/postal-context-m2/gg-source-review-2026-08-30.json');

test('Guernsey metadata defines a full-code area criterion without production data', () => {
  assert.equal(manifest.repository.name, 'agid-postal-gg');
  assert.equal(manifest.repository.country_code, 'GG');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.contains_land_or_cadastre_records, false);
  assert.equal(manifest.postal_system.full_code_regex, '^GY(?:[1-9]|10) [0-9][A-Z]{2}$');

  const m2 = manifest.promotion.stages.find((stage: { id: string }) =>
    stage.id === 'M2_current_guernsey_postcode_area_visualization');
  assert.deepEqual(m2, profile.m2_definition);
  assert.match(m2.definition, /Bailiwick-wide Guernsey Post assignment denominator/i);
  assert.match(m2.definition, /ONSPD rows or coordinate placeholders.*paid centroids.*cadastral parcels.*base-map tiles.*synthetic fixtures.*invented non-area surfaces/i);
});

test('Guernsey source profile separates assignment, point, address, tile and parcel authority', () => {
  type SourceProfile = {
    source_id: string;
    assignment_authority?: string;
    geometry_authority?: string;
    prohibited_claims?: string[];
  };
  const sources = new Map<string, SourceProfile>(
    profile.sources.map((source: SourceProfile) => [source.source_id, source]),
  );
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every((source: { bundled_here: boolean }) => source.bundled_here === false));

  assert.equal(sources.get('guernsey-post-address-and-postcode-finder')?.assignment_authority, 'official_postal_operator_interactive');
  assert.equal(sources.get('guernsey-post-address-and-postcode-finder')?.geometry_authority, 'none');
  assert.equal(sources.get('ons-postcode-directory-may-2026')?.geometry_authority, 'none_for_channel_islands');
  assert.equal(sources.get('digimap-channel-islands-postcode-centroids')?.geometry_authority, 'licensed_centroid_point_only');
  assert.equal(sources.get('digimap-corporate-address-file')?.geometry_authority, 'licensed_address_point_only');
  assert.equal(sources.get('digimap-public-mapping-guernsey')?.geometry_authority, 'tiled_base_map_only');
  assert.equal(sources.get('digimap-states-of-guernsey-land-parcels')?.geometry_authority, 'cadastral_or_land_parcel_not_postal');
  assert.match(sources.get('digimap-states-of-guernsey-land-parcels')?.prohibited_claims?.join(' ') ?? '', /parcel-is-postcode-boundary/i);
});

test('May 2026 GY counts reconcile while all eligible area counts remain zero', () => {
  const counts = review.onspdMay2026.gyCounts;
  assert.equal(counts.all, 3384);
  assert.equal(counts.all, counts.live + counts.terminated);
  assert.equal(counts.live, counts.liveSmallUser + counts.liveLargeUser);
  assert.equal(review.onspdMay2026.channelIslandsGeometry.positionalQualityIndicator, 9);
  assert.equal(review.onspdMay2026.channelIslandsGeometry.gridReferencesAvailable, 0);
  assert.equal(review.onspdMay2026.channelIslandsGeometry.geographicCoordinatesAvailable, 0);
  assert.equal(review.onspdMay2026.sampleEvidence.recordsWithGeometry, 0);
  assert.equal(review.onspdMay2026.sampleEvidence.recordsWithPqi9, 5);
  assert.equal(review.geometry.officialPostalPolygonRecords, 0);
  assert.equal(review.geometry.rightsClearedDerivedPostalPolygonRecords, 0);
  assert.equal(review.geometry.productionEligibleRecords, 0);
  assert.equal(review.geometry.inventedNonAreaSurfaces, 0);
});

test('Guernsey review records truthful blocked application and no gated operation', () => {
  assert.equal(review.sharedAppAreaPathVerified, true);
  assert.equal(review.realGgRuntimeVerified, false);
  assert.equal(review.realGgApiVerified, false);
  assert.equal(review.realGgAppAreaVisualizationVerified, false);
  assert.equal(review.countryM2Achieved, false);
  assert.equal(review.rights.authenticatedRequests, 0);
  assert.equal(review.rights.paidOperations, 0);
  assert.equal(review.rights.contractAcceptances, 0);
  assert.equal(review.rights.apiKeysRequestedOrUsed, 0);
  assert.equal(review.sourceCapability.digimapLandParcels.featureRowsQueried, 0);
  assert.equal(review.sourceCapability.digimapLandParcels.parcelOrLandRowsCommitted, 0);
});
