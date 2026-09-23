import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type SourceProfile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean; prohibited_claims: string[] }>; artifact_partitions: Array<{ id: string }> };
type RepositoryManifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type SyntheticFixturePack = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; pak_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string; pak?: string }; evidence: Array<{ assignment_authority: string; geometry_authority: string }>; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/me/postal-context');
function readJson<T>(name: string): T { return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T; }

test('Montenegro seed separates five-digit assignment, PAK, address, building, cadastre, administration, and privacy', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-me');
  assert.equal(manifest.repository.country_code, 'ME');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.equal(manifest.postal_system.pak_format, 'NNNNNN');
  assert.match(manifest.postal_system.assignment_rule, /Pošta Crne Gore.*five-digit.*text.*office point.*does not establish.*perimeter.*deliverability/i);
  assert.match(manifest.postal_system.pak_rule, /six-digit PAK.*part of a street.*route.*not the five-digit.*polygon.*building.*resident/i);
  assert.match(manifest.postal_system.geometry_rule, /No nationwide.*Pošta Crne Gore-authored.*UZN address membership.*derived.*office points.*Voronoi.*never.*official/i);
  assert.match(manifest.postal_system.address_rule, /UZN Address Register.*house numbers.*cadastral.*coverage.*address point.*not a building footprint.*person/i);
  assert.match(manifest.postal_system.building_rule, /exact rights-cleared UZN building.*source-defined.*common authoritative.*crosswalk.*proximity.*candidates/i);
  assert.match(manifest.postal_system.cadastral_rule, /controlled.*fee.*owner.*rightsholder.*resident.*title.*value.*tax/i);
  assert.match(manifest.postal_system.administration_rule, /UZN.*MONSTAT.*municipality.*settlement.*statistical.*do not create postcode.*building.*territorial/i);
  assert.match(manifest.postal_system.licence_rule, /Public viewing.*paid receipt.*does not imply.*redistribution.*allowed public fields.*derivative rights/i);
  assert.match(manifest.postal_system.crs_rule, /source CRS.*WGS84.*reviewed versioned transform.*EPSG:4326/i);
  assert.match(manifest.postal_system.territory_rule, /Montenegro only.*not a sovereignty determination.*cannot fill/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['postcode-or-post-office-row-presented-as-polygon', 'pak-presented-as-five-digit-postcode-or-universal-polygon', 'address-point-house-number-or-parcel-presented-as-building-footprint', 'geoportal-view-paid-receipt-or-statutory-access-presented-as-redistribution-right', 'owner-rightsholder-resident-occupant-personal-id-title-encumbrance-value-income-or-tax-data-published', 'postcode-or-pak-stored-as-number']) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Montenegro source policy keeps postal, PAK, UZN, MONSTAT, and controlled property evidence separate', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('posta-crne-gore-postcode-office-directory')?.assignment_authority, 'official_postal_operator');
  assert.equal(sources.get('posta-crne-gore-postcode-office-directory')?.geometry_authority, 'office_point_or_address_only');
  assert.ok(sources.get('posta-crne-gore-postcode-office-directory')?.prohibited_claims.includes('post-office-point-is-postcode-polygon'));
  assert.equal(sources.get('posta-crne-gore-pak-addressing')?.geometry_authority, 'route_or_address_range_not_polygon');
  assert.ok(sources.get('posta-crne-gore-pak-addressing')?.prohibited_claims.includes('pak-is-five-digit-postcode'));
  assert.equal(sources.get('uzn-montenegro-address-register')?.geometry_authority, 'official_address_point_or_record_when_supplied');
  assert.ok(sources.get('uzn-montenegro-address-register')?.prohibited_claims.includes('address-point-is-building-footprint'));
  assert.equal(sources.get('uzn-montenegro-real-estate-cadastre')?.redistribution_class, 'R4_validation_only');
  assert.ok(sources.get('uzn-montenegro-real-estate-cadastre')?.prohibited_claims.includes('nearest-or-containing-building-is-exact-link'));
  assert.equal(sources.get('uzn-montenegro-geoportal')?.geometry_authority, 'viewer_reference_only');
  assert.ok(sources.get('uzn-montenegro-spatial-unit-record')?.prohibited_claims.includes('coverage-determines-sovereignty'));
  assert.equal(sources.get('monstat-montenegro-spatial-register')?.geometry_authority, 'statistical_or_administrative_context_only');
  for (const partition of ['five-digit-postal-assignment', 'six-digit-pak-routing', 'official-address-register', 'building-and-cadastral-validation', 'geospatial-viewer-reference', 'administrative-and-spatial-units', 'derived-postal-surface', 'private-and-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Montenegro fixtures use synthetic five-digit postcode and six-digit PAK strings only', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/montenegro-synthetic.json');
  const postcodes = pack.fixtures.map(fixture => fixture.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const paks = pack.fixtures.map(fixture => fixture.synthetic_address.pak).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));
  assert.equal(pack.country_code, 'ME');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000');
  assert.equal(pack.fixture_policy.pak_prefix, '00000');
  assert.ok(postcodes.every(code => /^0000[0-3]$/.test(code)));
  assert.ok(paks.every(pak => /^00000[1-3]$/.test(pak)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('me-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence => ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority) && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  for (const claim of ['official-posta-crne-gore-polygon', 'pak-is-five-digit-postcode', 'address-point-is-building-footprint', 'nearest-building-is-exact-link', 'owner-rightsholder-resident-title-encumbrance-value-or-tax']) assert.ok(prohibited.has(claim));
});
