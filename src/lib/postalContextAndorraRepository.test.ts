import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type SourceProfile = {
  artifact_scope: string;
  sources: Array<{
    source_id: string;
    assignment_authority: string;
    geometry_authority: string;
    redistribution_class: string;
    bundled_here: boolean;
    prohibited_claims: string[];
  }>;
  artifact_partitions: Array<{ id: string }>;
};

type RepositoryManifest = {
  repository: { name: string; country_code: string; maturity: string };
  release_scope: {
    metadata_only: boolean;
    contains_raw_source_data: boolean;
    contains_real_addresses: boolean;
    contains_personal_data: boolean;
    contains_production_geometry: boolean;
    fixtures_are_synthetic: boolean;
    publication_claim: string;
  };
  postal_system: {
    full_code_name: string;
    full_code_format: string;
    full_code_default_geometry: string;
    assignment_rule: string;
    perimeter_rule: string;
    address_rule: string;
    building_rule: string;
    territory_rule: string;
  };
  promotion: { current_stage: string; hard_blockers: string[] };
};

type SyntheticFixturePack = {
  country_code: string;
  synthetic: boolean;
  promotion_eligible: boolean;
  fixture_policy: {
    contains_real_addresses: boolean;
    contains_upstream_rows: boolean;
    contains_personal_data: boolean;
    postal_prefix: string;
    coordinates_are_geographic: boolean;
    postcodes_are_assignment_evidence: boolean;
  };
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/ad/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Andorra seed separates parish-coded assignment, postal surfaces, addresses, and buildings', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-ad');
  assert.equal(manifest.repository.country_code, 'AD');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.deepEqual(manifest.release_scope, {
    metadata_only: true,
    contains_raw_source_data: false,
    contains_real_addresses: false,
    contains_personal_data: false,
    contains_production_geometry: false,
    fixtures_are_synthetic: true,
    publication_claim: 'contract-seed-only',
  });
  assert.equal(manifest.postal_system.full_code_name, 'Postal code');
  assert.equal(manifest.postal_system.full_code_format, 'ADNNN');
  assert.match(manifest.postal_system.full_code_default_geometry, /parish_coded.*licensed_or_derived_surface/);
  assert.match(manifest.postal_system.assignment_rule, /Correos.*UPU syntax.*not establish/i);
  assert.match(manifest.postal_system.perimeter_rule, /parish component.*not.*official full-code polygon.*expressly cover Andorra/i);
  assert.match(manifest.postal_system.address_rule, /Urban Guide.*interactive.*not establish bulk/i);
  assert.match(manifest.postal_system.building_rule, /authoritative address\/building identifier.*proximity.*candidates/i);
  assert.match(manifest.postal_system.territory_rule, /postal assignment.*sovereignty.*pinned boundary authority/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('parish-code-presented-as-full-postcode-polygon'));
  assert.ok(manifest.promotion.hard_blockers.includes('correos-spain-polygon-scope-assumed-to-cover-andorra'));
  assert.ok(manifest.promotion.hard_blockers.includes('topographic-building-presented-as-exact-address-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('border-feature-auto-assigned-to-ad'));
  assert.ok(manifest.promotion.hard_blockers.includes('ad-prefix-dropped-from-canonical-code'));
});

test('Andorra source policy separates postal, address, building, and parish authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postal = sources.get('correos-andorra-postcodes');
  const upu = sources.get('upu-andorra-addressing');
  const address = sources.get('andorra-urban-address-guide');
  const building = sources.get('andorra-topographic-buildings');
  const cartography = sources.get('andorra-cartografia');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postal?.assignment_authority, 'official_postal_operator');
  assert.equal(postal?.geometry_authority, 'contract_and_product_scope_specific');
  assert.ok(postal?.prohibited_claims.includes('spain-polygon-scope-implies-andorra'));
  assert.equal(upu?.geometry_authority, 'none');
  assert.ok(upu?.prohibited_claims.includes('format-proves-current-allocation'));
  assert.equal(address?.assignment_authority, 'official_government_address_reference');
  assert.ok(address?.prohibited_claims.includes('address-point-is-building-footprint'));
  assert.equal(building?.geometry_authority, 'official_topographic_building_geometry');
  assert.ok(building?.prohibited_claims.includes('nearest-building-is-exact-address-link'));
  assert.equal(cartography?.redistribution_class, 'R2_rights_cleared_open_service');
  assert.ok(cartography?.prohibited_claims.includes('portal-implies-one-license'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'postal-surface'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'parish-and-country'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'private-and-sensitive'));
});

test('Andorra fixtures use synthetic AD00x strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/andorra-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'AD');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, 'AD0');
  assert.ok(postcodes.every(code => /^AD00[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('ad-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-postcode-polygon'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('parish-code-is-full-code-polygon'));
  assert.ok(prohibited.has('border-feature-auto-assigned-to-ad'));
  assert.ok(prohibited.has('postal-evidence-proves-sovereignty'));
});
