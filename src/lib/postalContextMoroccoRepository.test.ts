import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean; prohibited_claims: string[] }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; evidence: Array<{ assignment_authority: string; geometry_authority: string }>; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/ma/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Morocco seed separates typed assignments, derived sectors, buildings, licensing, territory, and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-ma');
  assert.equal(manifest.repository.country_code, 'MA');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.match(manifest.postal_system.assignment_rule, /first digit.*routeing zone.*first two digits.*province.*sector.*agency.*large-volume.*text.*does not.*polygon/i);
  assert.match(manifest.postal_system.type_rule, /0, 1, 7 or 8.*home-delivery.*2, 3, 4, 5 or 6.*agencies.*P\.O\. box.*9.*large-volume.*non-area/i);
  assert.match(manifest.postal_system.geometry_rule, /official rights-cleared.*home-delivery sector.*derived non-canonical.*Office coordinates.*Voronoi.*never.*official/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*source-defined stable relation.*crosswalk.*candidates only/i);
  assert.match(manifest.postal_system.licence_rule, /ODbL-derived.*exact listed dataset.*Search access.*public viewing.*never.*redistribution/i);
  assert.match(manifest.postal_system.crs_rule, /source CRS.*Merchich.*Lambert.*never relabelled WGS84.*reviewed transform/i);
  assert.match(manifest.postal_system.territory_rule, /ISO code MA.*MA and EH.*distinct.*sovereignty/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'agency-centre-po-box-or-large-volume-recipient-code-presented-as-home-delivery-polygon',
    'directory-row-office-point-administrative-boundary-or-model-output-presented-as-official-postal-polygon',
    'search-download-viewer-government-authorship-or-paid-access-presented-as-redistribution-right',
    'ma-and-eh-source-coverage-silently-merged-or-used-as-sovereignty-claim',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Morocco source profile keeps postal semantics, operator records, open data, legal terms, and cartography separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('upu-morocco-postcode-manual')?.assignment_authority, 'official_postal_system_semantics_only');
  assert.equal(sources.get('upu-morocco-postcode-manual')?.geometry_authority, 'none');
  assert.match(sources.get('poste-maroc-codepostal')?.assignment_authority ?? '', /official_postal_record/i);
  assert.equal(sources.get('poste-maroc-codepostal')?.redistribution_class, 'R4_validation_only');
  assert.match(sources.get('morocco-open-data-postal')?.assignment_authority ?? '', /official_open_dataset/i);
  assert.equal(sources.get('morocco-open-data-postal')?.redistribution_class, 'R2_source_specific_reuse');
  assert.equal(sources.get('morocco-open-data-license')?.assignment_authority, 'none_legal_framework_only');
  assert.match(sources.get('ancfcc-morocco-cartography')?.geometry_authority ?? '', /official_product_geometry_only/i);
  for (const partition of ['typed-five-digit-assignment', 'official-home-delivery-sector-surface', 'derived-home-delivery-sector-surface', 'agency-centre-and-po-box', 'large-volume-recipient', 'physical-address-and-building', 'administrative-cadastral-and-cartographic-context', 'territory-and-private-restricted']) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Morocco fixtures use synthetic five-digit strings and no upstream rows', () => {
  const pack = readJson<Fixtures>('fixtures/morocco-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'MA');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '00000');
  assert.ok(postcodes.every(code => /^\d{5}$/.test(code)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('ma-syn-')));
  for (const claim of ['home-delivery-sector-is-official-polygon', 'agency-or-po-box-code-is-area', 'large-volume-recipient-code-is-area', 'derived-sector-is-official-postal-polygon', 'sector-code-identifies-exact-building', 'recipient-owner-title-or-query-data']) assert.ok(prohibited.has(claim));
});
