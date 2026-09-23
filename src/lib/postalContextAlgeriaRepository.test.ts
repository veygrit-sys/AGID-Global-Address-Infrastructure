import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean; prohibited_claims: string[] }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_value: string; coordinates_are_upstream_observations: boolean; postcodes_are_assignment_evidence: boolean; synthetic_values_not_checked_against_live_operator: boolean; collision_requires_replacement_before_promotion: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };
type M2Review = { result: string; postalAuthorityFindings: { currentPostalSystemConfirmed: boolean; currentCanonicalFormat: string; completeCurrentAssignmentDenominatorAvailable: boolean; currentCompleteAssignmentsValidated: number }; rightsAndAccessFindings: { compatibleAgidRightsEstablished: boolean; providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted: boolean }; geometryQuality: { officialPostalPolygonOrMultiPolygonRecords: number; derivedPostalPolygonOrMultiPolygonRecords: number; virtualPostalPolygonOrMultiPolygonRecords: number; productionEligibleRecords: number }; applicationEvidence: { actualAppStarted: boolean; appHttpStatus: number; realDzPostalApiStatus: number; realDzPostalAreaVisualized: boolean; manualVisualInspection: boolean }; countryM2Achieved: boolean };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/dz/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Algeria seed separates postal objects, official and derived geometry, addresses, buildings, licensing, and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-dz');
  assert.equal(manifest.repository.country_code, 'DZ');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.match(manifest.postal_system.assignment_rule, /Algérie Poste.*wilaya.*five-digit.*postal establishment.*mobile.*pinned.*Syntax.*does not.*nationwide assignment/i);
  assert.match(manifest.postal_system.historical_semantics_rule, /July 2002.*delivery-area.*wilaya.*historical.*not.*current allocation.*polygon/i);
  assert.match(manifest.postal_system.geometry_rule, /No rights-cleared nationwide.*mobile postal establishment.*not a polygon by syntax.*Voronoi.*derived non-canonical/i);
  assert.match(manifest.postal_system.address_rule, /2019.*six-line.*five-digit postcode.*commune.*not a reusable address row/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*stable explicit relation.*crosswalk.*candidates only/i);
  assert.match(manifest.postal_system.licence_rule, /Public directory.*government authorship.*not bulk.*redistribution.*INCT commercial.*ODbL/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*rights-cleared.*pin.*digests.*Restricted/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['postal-establishment-mobile-office-point-route-po-box-or-organization-presented-as-postal-polygon', 'commune-daira-wilaya-inct-or-cadastral-geometry-presented-as-official-postal-polygon', 'postcode-address-text-coordinate-containment-overlap-or-proximity-presented-as-exact-building-link', 'timeout-empty-or-blocked-response-treated-as-no-assignment']) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Algeria source profile keeps operator, historical, legal, address, administration, commercial GIS, and community evidence separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('algerie-poste')?.assignment_authority, 'official_postal_establishment_observation');
  assert.equal(sources.get('algerie-poste')?.geometry_authority, 'none');
  assert.equal(sources.get('algerie-poste-mobile-offices')?.assignment_authority, 'official_mobile_postal_object_observation');
  assert.equal(sources.get('upu-algeria-addressing-2002')?.assignment_authority, 'dated_postal_system_semantics_only');
  assert.equal(sources.get('upu-algeria-postcode-format-2026')?.assignment_authority, 'current_system_and_format_only');
  assert.equal(sources.get('algeria-postal-addressing-regulation-2019')?.assignment_authority, 'none_legal_framework_only');
  assert.match(sources.get('algeria-national-address-referential')?.geometry_authority ?? '', /none_until_exact_rights_cleared/i);
  assert.match(sources.get('inct-algeria-digital-geodata')?.geometry_authority ?? '', /official_product_geometry_only/i);
  assert.equal(sources.get('osm-algeria')?.redistribution_class, 'R2_odbl_separate_partition');
  for (const partition of ['typed-five-digit-postal-object', 'official-postal-surface', 'derived-postal-review-surface', 'administrative-context', 'physical-address-and-building', 'commercial-topographic-context', 'community-odbl', 'private-and-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Algeria M2 review remains blocked when real postal assignments, rights and surfaces are absent', () => {
  const review = readJson<M2Review>('m2-source-review.json');
  assert.equal(review.result, 'blocked');
  assert.equal(review.postalAuthorityFindings.currentPostalSystemConfirmed, true);
  assert.equal(review.postalAuthorityFindings.currentCanonicalFormat, '99999');
  assert.equal(review.postalAuthorityFindings.completeCurrentAssignmentDenominatorAvailable, false);
  assert.equal(review.postalAuthorityFindings.currentCompleteAssignmentsValidated, 0);
  assert.equal(review.rightsAndAccessFindings.compatibleAgidRightsEstablished, false);
  assert.equal(review.rightsAndAccessFindings.providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted, false);
  assert.equal(review.geometryQuality.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(review.geometryQuality.derivedPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(review.geometryQuality.virtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(review.geometryQuality.productionEligibleRecords, 0);
  assert.equal(review.applicationEvidence.actualAppStarted, true);
  assert.equal(review.applicationEvidence.appHttpStatus, 200);
  assert.equal(review.applicationEvidence.realDzPostalApiStatus, 503);
  assert.equal(review.applicationEvidence.realDzPostalAreaVisualized, false);
  assert.equal(review.applicationEvidence.manualVisualInspection, false);
  assert.equal(review.countryM2Achieved, false);
});

test('Algeria fixtures use a synthetic five-digit string and no upstream rows', () => {
  const pack = readJson<Fixtures>('fixtures/algeria-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'DZ');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.equal(pack.fixture_policy.postal_value, '09999');
  assert.ok(postcodes.every(code => /^\d{5}$/.test(code)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('dz-syn-')));
  for (const claim of ['postal-object-is-official-polygon', 'derived-surface-is-official-algerian-postal-polygon', 'postcode-identifies-exact-building', 'recipient-owner-title-or-query-data']) assert.ok(prohibited.has(claim));
});
