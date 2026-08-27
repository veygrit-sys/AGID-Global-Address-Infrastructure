import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Manifest = {
  repository: { name: string; country_code: string; maturity: string };
  release_scope: Record<string, boolean>;
  postal_system: Record<string, string>;
  promotion: { current_stage: string; hard_blockers: string[] };
};
type Profile = {
  artifact_scope: string;
  sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>;
  artifact_partitions: Array<{ id: string }>;
  postal_assignment_promotion_gate: { failure_mode: string };
  postal_geometry_promotion_gate: { failure_mode: string };
  building_resolution_gate: { failure_mode: string };
  public_hosting_gate: { failure_mode: string };
};
type Fixtures = {
  country_code: string;
  synthetic: boolean;
  promotion_eligible: boolean;
  fixture_policy: Record<string, boolean | string>;
  fixtures: Array<{ expected: { must_not_assert: string[] } }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/lr/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Liberia seed separates format, authority, assignment, geometry, administration, addresses, buildings, land, privacy, hosting and AGID', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-lr');
  assert.equal(manifest.repository.country_code, 'LR');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_upstream_rows, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNN');
  assert.match(manifest.postal_system.format_rule, /UPU Liberia.*August 2017.*four digits.*left.*locality.*street.*P\.O\. Box/i);
  assert.match(manifest.postal_system.authority_rule, /Ministry.*postal authority.*mandate.*services.*office.*not.*assignment register.*geometry/i);
  assert.match(manifest.postal_system.assignment_rule, /ministry-authorized.*four-digit.*locality.*post-office.*delivery type.*edition.*valid-time.*insufficient/i);
  assert.match(manifest.postal_system.geometry_rule, /no reviewed official source.*boundary coordinates.*default geometry is none.*office.*census.*parcel.*Voronoi.*AGID.*never.*official/i);
  assert.match(manifest.postal_system.administrative_rule, /LISGIS 2022.*administrative context.*artifact.*CRS.*not.*postal/i);
  assert.match(manifest.postal_system.address_rule, /routing context.*street.*house number.*P\.O\. Box.*recipient.*telephone.*separate.*not reusable/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared civic-address point.*explicit stable address-to-building.*census-structure.*parcel.*insufficient/i);
  assert.match(manifest.postal_system.land_rule, /Liberia Land Authority.*controlled.*parcel.*deed.*neither postcode.*building.*holder/i);
  assert.match(manifest.postal_system.privacy_rule, /service charter.*privacy.*confidentiality.*2026 draft.*exclude.*telephone.*query/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*rights-cleared.*non-personal.*controlled/i);
  assert.match(manifest.postal_system.agid_rule, /independent spatial index.*not a ministry.*postal polygon.*building.*delivery/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.length >= 10);
});

test('Liberia source profile gates postal, project, administration, land, privacy and ODbL evidence independently', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('upu-liberia-addressing-2017')?.assignment_authority ?? '', /semantics.*examples.only/i);
  assert.match(sources.get('mopt-liberia-postal-services')?.assignment_authority ?? '', /official.*without.public-assignment-register/i);
  assert.match(sources.get('mopt-liberia-service-charter-2025')?.geometry_authority ?? '', /office.*not-catchment/i);
  assert.equal(sources.get('mopt-liberia-digital-postal-address-contract-2022')?.redistribution_class, 'R5_private_restricted');
  assert.match(sources.get('lisgis-liberia-census-2022-geography')?.geometry_authority ?? '', /statistical.*not-postal/i);
  assert.equal(sources.get('lla-liberia-land-administration')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('liberia-data-governance-policy-2026-draft')?.assignment_authority, 'none');
  assert.equal(sources.get('osm-liberia')?.redistribution_class, 'R6_odbl_separate_partition');
  for (const id of ['four-digit-assignment-observations', 'operator-office-and-service-context', 'digital-address-project-controlled', 'versioned-admin-context', 'civic-address-and-building', 'land-census-and-personal-restricted', 'derived-or-virtual-candidates', 'community-odbl', 'synthetic-conformance']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id), id);
  assert.match(profile.postal_assignment_promotion_gate.failure_mode, /upu-example.*office.*contract-listing.*third-party/i);
  assert.match(profile.postal_geometry_promotion_gate.failure_mode, /no-canonical-geometry/i);
  assert.match(profile.building_resolution_gate.failure_mode, /stop-at-locality-or-post-office/i);
  assert.match(profile.public_hosting_gate.failure_mode, /cloudflare.*hugging-face/i);
});

test('Liberia fixtures are synthetic and cannot promote assignments, polygons, addresses or buildings', () => {
  const fixtures = readJson<Fixtures>('fixtures/liberia-synthetic.json');
  assert.equal(fixtures.country_code, 'LR');
  assert.equal(fixtures.synthetic, true);
  assert.equal(fixtures.promotion_eligible, false);
  assert.equal(fixtures.fixture_policy.contains_real_addresses, false);
  assert.equal(fixtures.fixture_policy.contains_upstream_rows, false);
  assert.equal(fixtures.fixture_policy.contains_personal_data, false);
  assert.equal(fixtures.fixture_policy.synthetic_postcode_value, '9999');
  assert.equal(fixtures.fixture_policy.values_are_assignment_evidence, false);
  assert.equal(fixtures.fixture_policy.collision_requires_replacement_before_promotion, true);
  const prohibited = new Set(fixtures.fixtures.flatMap(fixture => fixture.expected.must_not_assert));
  for (const claim of ['current_ministry_assignment', 'official_postcode_polygon', 'deliverability', 'real_address', 'real_building', 'postal_containment_building_link', 'recipient_or_phone', 'owner_or_land_holder']) assert.ok(prohibited.has(claim), claim);
});
