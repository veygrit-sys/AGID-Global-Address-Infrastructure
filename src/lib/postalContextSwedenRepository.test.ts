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
const seedRoot = resolve(root, 'data/postal_country_packs/se/postal-context');
const readJson = <T>(name: string): T => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Sweden seed preserves five-digit assignment and endpoint semantics and fails closed on proxies', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  const m2 = manifest.promotion.stages.find(stage => stage.id === 'M2_current_sweden_five_digit_assignment_and_area_visualization');

  assert.deepEqual(manifest.repository, { name: 'agid-postal-se', country_code: 'SE', maturity: 'M1_metadata' });
  assert.deepEqual(manifest.release_scope, {
    metadata_only: true,
    contains_raw_source_data: false,
    contains_real_addresses: false,
    contains_personal_data: false,
    contains_production_geometry: false,
    fixtures_are_synthetic: false,
    publication_claim: 'metadata-only-contract-seed',
  });
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.equal(manifest.postal_system.display_format, 'NNN NN');
  assert.match(manifest.postal_system.assignment_rule, /PTS.*PostNord.*valid municipal addresses.*does not establish.*perimeter/i);
  assert.match(manifest.postal_system.purpose_rule, /only to route mail.*need not follow.*municipalities or counties/i);
  assert.match(manifest.postal_system.commercial_surface_rule, /five-digit Swedish postcode surfaces.*organization.*prohibiting resale and sublicensing/i);
  assert.match(manifest.postal_system.address_rule, /Lantmäteriet.*entrance Point.*does not create.*Polygon\/MultiPolygon/i);
  assert.match(manifest.postal_system.postal_surface_rule, /complete current rights-cleared address-to-postcode assignment.*municipal.*buffers.*Voronoi/i);
  assert.match(manifest.postal_system.endpoint_rule, /P\.O\.-box.*large-customer.*non-area.*never assigned a geographic perimeter/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.match(m2?.definition ?? '', /real SE API\/app.*NNN NN.*translucent fill.*clear outline.*official\/derived\/virtual.*large-customer.*non-area/i);
  for (const blocker of [
    'commercial-product-listing-presented-as-delivered-authorized-artifact',
    'organization-only-license-presented-as-public-serving-right',
    'address-point-presented-as-postcode-polygon',
    'endpoint-or-large-customer-code-presented-as-geographic-area',
    'buffer-hull-voronoi-raster-or-synthetic-area-promoted',
    'postcode-stored-as-number',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Sweden source profile separates postal, commercial surface, address-point and rights authorities', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const pts = sources.get('pts-postcode-system-governance');
  const lookup = sources.get('postnord-postcode-address-lookup');
  const surface = sources.get('postnummerservice-five-digit-postcode-surfaces');
  const purchaseTerms = sources.get('postnummerservice-purchase-terms');
  const address = sources.get('lantmateriet-address-download-inspire');
  const addressTerms = sources.get('lantmateriet-valuable-personal-data-terms');

  assert.equal(profile.country_code, 'SE');
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(pts?.assignment_authority, 'postal_regulator_and_governance');
  assert.equal(pts?.geometry_authority, 'none');
  assert.ok(pts?.prohibited_claims.includes('municipality-is-postcode-area'));
  assert.equal(lookup?.geometry_authority, 'none_established');
  assert.ok(lookup?.prohibited_claims.includes('public-query-authorizes-national-scraping'));
  assert.equal(surface?.redistribution_class, 'R3_commercial_organization_only');
  assert.equal(surface?.geometry_authority, 'commercial_postcode_surface_product_advertised_not_inspected');
  assert.ok(surface?.prohibited_claims.includes('product-listing-is-delivered-artifact'));
  assert.equal(purchaseTerms?.assignment_authority, 'rights_contract_only');
  assert.ok(purchaseTerms?.prohibited_claims.includes('internal-use-is-public-serving-right'));
  assert.equal(address?.assignment_authority, 'official_address_register_with_postnord_attribute');
  assert.equal(address?.geometry_authority, 'address_entrance_point_not_postal_area');
  assert.ok(address?.prohibited_claims.includes('address-point-is-postcode-polygon'));
  assert.equal(addressTerms?.redistribution_class, 'R2_ccby_address_with_approved_purpose');
  assert.ok(addressTerms?.prohibited_claims.includes('ccby-is-unconditional-access'));
  for (const id of ['postal-governance-and-assignment', 'commercial-postcode-surface', 'official-address-point', 'postal-surface', 'endpoint-and-non-area', 'building-and-parcel-context', 'administration-and-territory', 'private-and-restricted', 'synthetic-conformance']) {
    assert.ok(profile.artifact_partitions.some(partition => partition.id === id));
  }
});
