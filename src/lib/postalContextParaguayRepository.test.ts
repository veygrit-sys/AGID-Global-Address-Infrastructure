import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const manifest = JSON.parse(readFileSync(
  resolve('data/postal_country_packs/py/postal-context/repository-manifest.json'),
  'utf8',
));

test('Paraguay repository manifest keeps detailed official identities and derived postal areas separate', () => {
  assert.equal(manifest.repository.name, 'agid-postal-py');
  assert.equal(manifest.repository.country_code, 'PY');
  assert.equal(manifest.repository.maturity, 'M2_national_derived_visualization');
  assert.equal(manifest.promotion.current_stage, 'M2_national_derived_visualization');
  assert.equal(manifest.promotion.stages[0]?.id, 'M2_current_national_dinacopa_postal_zone_derived_area_visualization');
  assert.equal(manifest.release_scope.metadata_only, false);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.postal_system.code_format, 'NNNNNN');
  assert.match(manifest.postal_system.assignment_rule, /department.*district.*barrio.*2,887/i);
  assert.match(manifest.postal_system.geometry_rule, /DINACOPA.*EPSG:32721.*derived MultiPolygon/i);
  assert.match(manifest.postal_system.identity_rule, /cod_bar.*BARLOC.*never treated as globally unique/i);
  assert.match(manifest.postal_system.postal_object_rule, /Point.*route.*P\.O\. box.*invented/i);
  assert.match(manifest.postal_system.agid_rule, /independent spatial and identity layer.*does not relabel/i);
  assert.match(manifest.postal_system.licence_rule, /Decree 4064.*Law 5282\/2014.*Reuse cites/i);
  assert.match(manifest.postal_system.privacy_rule, /no recipient.*customer.*address.*building.*parcel.*ownership/i);
  for (const blocker of [
    'six-digit-syntax-presented-as-assignment-without-dinacopa-row',
    'source-cod-bar-collapsed-as-globally-unique-across-postal-codes',
    'administrative-point-route-po-box-organization-buffer-model-or-agid-cell-presented-as-postal-area',
    'simplified-derived-display-presented-as-unsimplified-official-boundary',
    'address-building-recipient-customer-parcel-or-land-right-inferred-from-postal-area',
    'raw-source-dump-committed-to-agid',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker), blocker);
});
