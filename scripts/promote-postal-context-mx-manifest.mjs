import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const path = resolve('data/postal_country_packs/mx/postal-context/repository-manifest.json');
const manifest = JSON.parse(readFileSync(path, 'utf8'));
manifest.repository.maturity = 'M2_experimental';
manifest.release_scope = {
  metadata_only: false,
  contains_raw_source_data: false,
  contains_real_addresses: false,
  contains_personal_data: false,
  contains_production_geometry: true,
  fixtures_are_synthetic: false,
  publication_claim: 'latest-official-sepomex-2025-national-postcode-polygons-as-derived-display-geometry',
};
const m2 = {
  id: 'M2_latest_official_sepomex_2025_national_postcode_polygons_derived_display',
  definition: 'The latest nationally published SEPOMEX geographic release supplies 35,898 distinct five-digit postal Polygon features across all 32 state SHP resources under CC BY 4.0. Exact resource metadata, bytes and digests are pinned; a reproducible EPSG:4326 display transform applies explicit validity repair, a base 100 metre simplification and a bounded final display simplification with conservative 250 metre declared accuracy, restoring the 228 collapsed small areas from transformed source surfaces only. The real API/app normalizes, searches, fits, clears and re-searches with translucent derived geometry and visible provenance; it makes no address, building, parcel, person, delivery-current or territorial claim.',
};
manifest.promotion.current_stage = m2.id;
manifest.promotion.stages = [
  { id: 'M0_inventory', definition: 'Source roles, rights and blockers are inventoried.' },
  { id: 'M1_metadata', definition: 'Mexico-specific contracts and provenance are reviewable.' },
  m2,
  { id: 'M3_candidate', definition: 'A source refresh and independent review pass without authority or topology drift.' },
  { id: 'M4_stable', definition: 'Two source refreshes pass with monitored rollback.' },
];
writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(m2.id);
