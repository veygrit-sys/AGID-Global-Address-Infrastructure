import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seed = resolve(root, 'data/postal_country_packs/dj/postal-context');
const json = (name: string) => JSON.parse(readFileSync(resolve(seed, name), 'utf8'));

test('Djibouti manifest defines a country-specific fail-closed M2 gate', () => {
  const manifest = json('repository-manifest.json');
  assert.equal(manifest.repository.country_code, 'DJ');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNNN');
  assert.match(manifest.postal_system.postcode_rule, /05\/2020.*ten.*August 2026.*not a proven complete/i);
  assert.match(manifest.postal_system.geometry_rule, /No rights-cleared.*administrative.*Voronoi.*model.*AGID.*not postal/i);
  assert.match(manifest.postal_system.building_rule, /independent rights-cleared.*explicit address-to-building.*candidates only/i);
  assert.match(manifest.postal_system.hosting_rule, /Hugging Face.*parsing.*topology.*cannot create/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
  assert.match(manifest.promotion.stages.find((stage: { id: string }) => stage.id === manifest.promotion.target_stage)?.definition ?? '', /complete finite current denominator.*Polygon\/MultiPolygon.*real DJ API\/app/i);
});

test('Djibouti review binds exact evidence and records zero promotable polygon records', () => {
  const review = json('m2-source-review.json');
  assert.equal(review.sourceInspection.exactBodiesByteAndSha256Bound, 9);
  assert.equal(review.sourceInspection.receipts.length, 9);
  assert.equal(review.postalAuthorityFindings.publicReferenceRows.length, 10);
  assert.equal(review.postalAuthorityFindings.completeCurrentAssignmentDenominatorAvailable, false);
  assert.equal(review.rightsAndAccessFindings.publicAfricaSampleContainsDjibouti, false);
  assert.equal(review.rightsAndAccessFindings.providerContactRegistrationAuthenticationContractTermsOrPaymentAttempted, false);
  assert.equal(review.geometryQuality.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(review.geometryQuality.productionEligibleRecords, 0);
  assert.equal(review.addressAndAgidBoundary.exactBuildingRequiresIndependentExplicitRelation, true);
  assert.equal(review.countryM2Achieved, false);
});

test('Djibouti profile separates public, contractual, administration and ODbL partitions', () => {
  const profile = json('source-profile.json');
  type Source = { source_id: string; redistribution_class: string; geometry_authority: string; bundled_here: boolean };
  const sources = new Map<string, Source>(profile.sources.map((source: Source) => [source.source_id, source]));
  assert.equal(sources.get('upu-postcode-database-licensing-2026').redistribution_class, 'R4_contract_required');
  assert.equal(sources.get('djibouti-decentralisation-cartography').geometry_authority, 'administrative_context_only');
  assert.equal(sources.get('osm-djibouti').redistribution_class, 'R2_odbl_separate_partition');
  assert.ok(profile.sources.every((source: { bundled_here: boolean }) => source.bundled_here === false));
});
