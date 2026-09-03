import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[]; target_stage: string; stages: Array<{ id: string; definition: string }>; data_completion_verified: boolean } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postcode_value: string; cip_value: string; coordinates_are_upstream_observations: boolean; identifiers_are_assignment_evidence: boolean; synthetic_values_not_checked_against_live_operator: boolean; collision_requires_replacement_before_promotion: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };
type Review = { result: string; m2DefinitionId: string; sourceInspection: { exactBodiesByteAndSha256Bound: number; officialReferenceBytes: number }; postalAuthorityFindings: { currentPostalSystemConfirmed: boolean; currentCanonicalFormat: string; completeCurrentAssignmentDenominatorAvailable: boolean }; identifierBoundary: { contactPageUniqueExtendedValues: number; cipRowsAccessed: number; registrationOrAuthenticationAttempted: boolean; identifiersMergedOrDigitsInferred: boolean }; geometryQuality: { officialPostalPolygonOrMultiPolygonRecords: number; derivedPostalPolygonOrMultiPolygonRecords: number; virtualPostalPolygonOrMultiPolygonRecords: number; productionEligibleRecords: number }; countryM2Achieved: boolean };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/cv/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Cabo Verde seed separates postcode, extended identifier, CIP, derived surfaces, buildings, rights, and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-cv');
  assert.equal(manifest.repository.country_code, 'CV');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNN');
  assert.match(manifest.postal_system.postcode_rule, /Correios.*UPU August 2026.*four-digit.*current assignment.*pinned/i);
  assert.match(manifest.postal_system.identifier_split_rule, /NNNN-NNN.*CIP.*georeference.*separate.*no digits.*inferred/i);
  assert.match(manifest.postal_system.geometry_rule, /No rights-cleared nationwide.*Island.*CIP.*cadastre.*not official postcode polygons.*derived non-canonical/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*explicit CIP-to-address-to-building.*cadastral.*candidates only/i);
  assert.match(manifest.postal_system.licence_rule, /all-rights-reserved.*UPU.*IDE-CV.*ArcGIS.*ODbL/i);
  assert.match(manifest.postal_system.privacy_rule, /CIP identifies.*person or company.*georeference.*purpose limitation.*access control/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*rights-cleared.*digests.*Private CIP/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.target_stage, 'M2_current_correios_assignment_and_postal_area_visualization');
  assert.equal(manifest.promotion.data_completion_verified, false);
  assert.match(manifest.promotion.stages.find(stage => stage.id === manifest.promotion.target_stage)?.definition ?? '', /complete finite current denominator.*NNNN-NNN.*authenticated CIP.*Polygon\/MultiPolygon.*real CV API\/app/i);
  for (const blocker of ['nnnn-nnn-contact-value-conflated-with-four-digit-postcode-or-cip-without-operator-schema', 'cip-derived-guessed-or-published-without-purpose-and-authority', 'island-municipality-parish-zone-neighbourhood-cadastre-or-cip-point-presented-as-official-postcode-polygon', 'postcode-cip-address-text-coordinate-containment-overlap-or-proximity-presented-as-exact-building-link']) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Cabo Verde M2 source review is digest-bound and remains fail closed', () => {
  const review = readJson<Review>('m2-source-review.json');
  assert.equal(review.result, 'blocked');
  assert.equal(review.m2DefinitionId, 'M2_current_correios_assignment_and_postal_area_visualization');
  assert.equal(review.sourceInspection.exactBodiesByteAndSha256Bound, 8);
  assert.equal(review.sourceInspection.officialReferenceBytes, 1_429_576);
  assert.equal(review.postalAuthorityFindings.currentPostalSystemConfirmed, true);
  assert.equal(review.postalAuthorityFindings.currentCanonicalFormat, '9999');
  assert.equal(review.postalAuthorityFindings.completeCurrentAssignmentDenominatorAvailable, false);
  assert.equal(review.identifierBoundary.contactPageUniqueExtendedValues, 32);
  assert.equal(review.identifierBoundary.cipRowsAccessed, 0);
  assert.equal(review.identifierBoundary.registrationOrAuthenticationAttempted, false);
  assert.equal(review.identifierBoundary.identifiersMergedOrDigitsInferred, false);
  assert.equal(review.geometryQuality.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(review.geometryQuality.derivedPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(review.geometryQuality.virtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(review.geometryQuality.productionEligibleRecords, 0);
  assert.equal(review.countryM2Achieved, false);
});

test('Cabo Verde source profile keeps operator, CIP, UPU, INGT, cadastre, and community evidence separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('correios-cabo-verde')?.assignment_authority, 'official_postal_operator_observation');
  assert.equal(sources.get('correios-cabo-verde-contact-identifiers')?.assignment_authority, 'official_operator_contact_identifier_observation');
  assert.equal(sources.get('correios-cabo-verde-cip')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('upu-cabo-verde-postcode-length-2026')?.assignment_authority, 'current_length_context_only');
  assert.match(sources.get('ingt-cabo-verde-admin-feature-service')?.geometry_authority ?? '', /administrative_or_toponymic_context_only/i);
  assert.match(sources.get('ingt-cabo-verde-cadastre')?.geometry_authority ?? '', /none_until_exact_rights_cleared/i);
  assert.equal(sources.get('osm-cabo-verde')?.redistribution_class, 'R2_odbl_separate_partition');
  for (const partition of ['typed-four-digit-postcode', 'operator-extended-contact-identifier', 'private-cip', 'official-postal-surface', 'derived-postal-review-surface', 'administrative-and-toponymic-context', 'address-cadastre-and-building', 'community-odbl', 'private-and-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Cabo Verde fixtures use synthetic postcode and CIP values with no upstream rows', () => {
  const pack = readJson<Fixtures>('fixtures/cabo-verde-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'CV');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.equal(pack.fixture_policy.postcode_value, '0999');
  assert.equal(pack.fixture_policy.cip_value, 'CV-CIP-SYN-0999');
  assert.ok(postcodes.every(code => /^\d{4}$/.test(code)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('cv-syn-')));
  for (const claim of ['four-digit-postcode-is-official-polygon', 'derived-surface-is-official-cabo-verde-postcode-polygon', 'postcode-or-cip-syntax-identifies-exact-building', 'recipient-owner-title-account-or-query-data']) assert.ok(prohibited.has(claim));
});
