import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Manifest = {
  repository: { name: string; country_code: string; maturity: string };
  release_scope: Record<string, boolean | string>;
  postal_system: Record<string, string>;
  promotion: { current_stage: string; stages: Array<{ id: string; definition: string }>; hard_blockers: string[] };
};

type Profile = {
  country_code: string;
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

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/ru/postal-context');
const readJson = <T>(name: string): T => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Russia seed preserves six-digit assignment semantics and fails closed on non-area proxies', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  const m2 = manifest.promotion.stages.find(stage => stage.id === 'M2_current_russia_postcode_assignment_and_area_visualization');

  assert.deepEqual(manifest.repository, { name: 'agid-postal-ru', country_code: 'RU', maturity: 'M1_metadata' });
  assert.deepEqual(manifest.release_scope, {
    metadata_only: true,
    contains_raw_source_data: false,
    contains_real_addresses: false,
    contains_personal_data: false,
    contains_production_geometry: false,
    fixtures_are_synthetic: false,
    publication_claim: 'metadata-only-contract-seed',
  });
  assert.equal(manifest.postal_system.full_code_format, 'NNNNNN');
  assert.match(manifest.postal_system.assignment_rule, /unique number.*post office.*address.*does not establish.*perimeter/i);
  assert.match(manifest.postal_system.office_reference_rule, /61,358.*2026-08-25.*not Polygon\/MultiPolygon/i);
  assert.match(manifest.postal_system.api_rule, /no advertised coordinates or Polygon\/MultiPolygon.*not address membership/i);
  assert.match(manifest.postal_system.address_rule, /FIAS\/GAR.*open official address register.*does not convert.*Russian Post.*perimeter/i);
  assert.match(manifest.postal_system.postal_surface_rule, /complete current rights-cleared address-to-postcode assignment.*administrative boundaries.*buffers.*Voronoi/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.match(m2?.definition ?? '', /real RU API\/app.*translucent fill.*clear outline.*official\/derived\/virtual.*non-area/i);
  for (const blocker of [
    'post-office-reference-or-point-presented-as-postcode-polygon',
    'tariff-api-dictionary-presented-as-address-membership-or-area',
    'fias-address-or-map-point-presented-as-postcode-polygon',
    'buffer-hull-voronoi-raster-or-synthetic-area-promoted',
    'postcode-stored-as-number',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Russia source profile separates postal operator, FIAS address and legal authorities', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const directory = sources.get('russian-post-reference-index-directory');
  const lookup = sources.get('russian-post-index-address-lookup');
  const tariff = sources.get('russian-post-tariff-postoffice-api');
  const fias = sources.get('fns-fias-gar-address-register');
  const law = sources.get('federal-law-443-fz-fias');

  assert.equal(profile.country_code, 'RU');
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(directory?.assignment_authority, 'official_postal_operator_office_directory');
  assert.equal(directory?.geometry_authority, 'none_advertised');
  assert.ok(directory?.prohibited_claims.includes('post-office-is-postcode-polygon'));
  assert.equal(lookup?.geometry_authority, 'office_map_or_point_reference_only');
  assert.ok(lookup?.prohibited_claims.includes('public-query-authorizes-national-scraping'));
  assert.equal(tariff?.assignment_authority, 'official_postal_operator_api_dictionary');
  assert.ok(tariff?.prohibited_claims.includes('tariff-response-is-postcode-area'));
  assert.equal(fias?.redistribution_class, 'R2_fias_open_address');
  assert.equal(fias?.geometry_authority, 'address_object_or_map_location_not_postal_area');
  assert.ok(fias?.prohibited_claims.includes('fias-postcode-attribute-is-official-postal-polygon'));
  assert.equal(law?.assignment_authority, 'legal_framework_only');
  assert.ok(law?.prohibited_claims.includes('open-address-law-is-russian-post-geometry-license'));
  for (const id of ['postal-office-and-index', 'operator-query-and-api', 'official-open-address', 'postal-surface', 'building-and-cadastral-context', 'administration-and-territory', 'private-and-restricted', 'synthetic-conformance']) {
    assert.ok(profile.artifact_partitions.some(partition => partition.id === id));
  }
});
