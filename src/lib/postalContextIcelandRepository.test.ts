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
    observed_release?: { digest: string; feature_count: number; retrieved_at: string };
    prohibited_claims: string[];
  }>;
  artifact_partitions: Array<{ id: string }>;
};

type RepositoryManifest = {
  repository: { name: string; country_code: string; maturity: string };
  release_scope: Record<string, boolean | string>;
  postal_system: Record<string, string>;
  promotion: { current_stage: string; stages: Array<{ id: string; definition: string }>; hard_blockers: string[] };
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
  };
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/is/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Iceland repository promotes only the current postcode-area runtime and no address or building rows', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-is');
  assert.equal(manifest.repository.country_code, 'IS');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.metadata_only, false);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.release_scope.publication_claim, 'current-byggdastofnun-postnumer-area-runtime');
  assert.equal(manifest.postal_system.full_code_name, 'póstnúmer');
  assert.equal(manifest.postal_system.full_code_format, 'NNN');
  assert.match(manifest.postal_system.m2_geometry_rule, /Byggðastofnun.*WFS.*Polygon.*MultiPolygon.*repair.*derived/i);
  assert.match(manifest.postal_system.address_rule, /coordinate type/i);
  assert.match(manifest.postal_system.building_rule, /proximity.*exact/i);
  assert.equal(manifest.promotion.current_stage, 'M2_current_byggdastofnun_postnumer_visualization');
  assert.ok(manifest.promotion.stages.some(stage =>
    stage.id === 'M2_current_byggdastofnun_postnumer_visualization'
    && /search.*API.*map.*translucent/i.test(stage.definition)));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
  assert.ok(manifest.promotion.hard_blockers.includes('is50v-building-proximity-presented-as-exact-link'));
});

test('Iceland source policy bundles only the rights-reviewed Byggðastofnun runtime evidence', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const posturinn = sources.get('posturinn-iceland-postcodes');
  const postcodeAreas = sources.get('byggdastofnun-iceland-postcode-register');
  const addresses = sources.get('hms-iceland-address-register');
  const buildings = sources.get('natt-is50v-buildings');
  const statistics = sources.get('statistics-iceland-geography');

  assert.equal(profile.artifact_scope, 'current-byggdastofnun-postnumer-area-runtime');
  assert.equal(postcodeAreas?.bundled_here, true);
  assert.equal(postcodeAreas?.assignment_authority, 'official_postcode_regulator');
  assert.equal(postcodeAreas?.geometry_authority, 'official_postcode_register_geometry');
  assert.equal(postcodeAreas?.redistribution_class, 'R1_public_sector_reuse');
  assert.equal(postcodeAreas?.observed_release?.feature_count, 175);
  assert.equal(postcodeAreas?.observed_release?.digest, 'sha256:5a5fb67232ce16d6023204dd45b4004930db0858e9788b78ae97a0d601d2f76a');
  assert.match(postcodeAreas?.observed_release?.retrieved_at ?? '', /^2026-08-30T12:20:57/u);
  assert.equal(posturinn?.bundled_here, false);
  assert.ok(posturinn?.prohibited_claims.includes('postcode-polygon-authority'));
  assert.equal(addresses?.bundled_here, false);
  assert.ok(addresses?.prohibited_claims.includes('exact-building-footprint-from-address-point'));
  assert.equal(buildings?.bundled_here, false);
  assert.ok(buildings?.prohibited_claims.includes('exact-address-link-from-proximity'));
  assert.equal(statistics?.bundled_here, false);
  assert.ok(statistics?.prohibited_claims.includes('postcode-boundary'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'byggdastofnun-postcode-geometry'));
});

test('Iceland fixtures remain synthetic and never become M2 evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/iceland-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'IS');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '00');
  assert.ok(postcodes.every(code => /^00[0-4]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('is-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('exact-address-link-from-proximity'));
  assert.ok(prohibited.has('facility-is-residence'));
  assert.ok(prohibited.has('recipient-or-occupant'));
  assert.ok(prohibited.has('deliverability'));
});
