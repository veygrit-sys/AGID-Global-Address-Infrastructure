export type PostalForgePreparationClass = 'no-postal-code' | 'weak-postal-code';

export type PostalForgePreparationMode =
  | 'agid-primary-postal-zone-design'
  | 'agid-supplemental-postal-zone-design';

export type PostalForgePreparationTarget = {
  code: string;
  name: string;
  region: string;
  repository: string;
  preparationClass: PostalForgePreparationClass;
  mode: PostalForgePreparationMode;
  lat: number;
  lng: number;
  population: number;
  areaKm2: number;
  municipalityCount: number;
  terrain: 'mixed' | 'archipelago' | 'mountain' | 'desert';
  postalPattern?: string;
  postalSamples?: string[];
  sourceStrategy: string;
  designPriority: 'pilot' | 'candidate' | 'humanitarian-review';
  defaultWorkflow: 'agid-geo-verified' | 'postal-format-and-candidates' | 'agid-manual-required';
  requiredEvidence: string[];
  safetyGates: string[];
};

const noPostal = (
  code: string,
  name: string,
  region: string,
  lat: number,
  lng: number,
  population: number,
  areaKm2: number,
  municipalityCount: number,
  terrain: PostalForgePreparationTarget['terrain'],
  sourceStrategy: string,
): PostalForgePreparationTarget => ({
  code,
  name,
  region,
  repository: `agid-country-${code.toLowerCase()}`,
  preparationClass: 'no-postal-code',
  mode: 'agid-primary-postal-zone-design',
  lat,
  lng,
  population,
  areaKm2,
  municipalityCount,
  terrain,
  sourceStrategy,
  designPriority: terrain === 'archipelago' ? 'pilot' : 'candidate',
  defaultWorkflow: 'agid-geo-verified',
  requiredEvidence: [
    'country-or-territory-repository',
    'breadcrumb-admin-hierarchy',
    'open-geo-boundary-pack',
    'delivery-or-settlement-candidate-pack',
  ],
  safetyGates: [
    'no-raw-personal-address',
    'not-an-official-postal-code-until-authorized',
    'source-license-recorded',
    'human-review-before-publication',
  ],
});

const weakPostal = (
  code: string,
  name: string,
  region: string,
  lat: number,
  lng: number,
  population: number,
  areaKm2: number,
  municipalityCount: number,
  terrain: PostalForgePreparationTarget['terrain'],
  postalPattern: string,
  postalSamples: string[],
  sourceStrategy: string,
): PostalForgePreparationTarget => ({
  code,
  name,
  region,
  repository: `agid-country-${code.toLowerCase()}`,
  preparationClass: 'weak-postal-code',
  mode: 'agid-supplemental-postal-zone-design',
  lat,
  lng,
  population,
  areaKm2,
  municipalityCount,
  terrain,
  postalPattern,
  postalSamples,
  sourceStrategy,
  designPriority: 'candidate',
  defaultWorkflow: 'postal-format-and-candidates',
  requiredEvidence: [
    'country-or-territory-repository',
    'official-or-operator-postal-format',
    'breadcrumb-admin-hierarchy',
    'manual-delivery-confirmation-path',
  ],
  safetyGates: [
    'preserve-existing-postal-code',
    'candidate-display-not-autofill-only',
    'no-raw-personal-address',
    'manual-review-before-replacement-claim',
  ],
});

export const POSTAL_FORGE_NO_POSTAL_PREPARATION_COUNTRIES: PostalForgePreparationTarget[] = [
  noPostal('HK', 'Hong Kong', 'Asia', 22.3193, 114.1694, 7_500_000, 1_106, 18, 'mixed', 'Use district, estate/building, street, entrance, OSM/official open geo, and AGID delivery cells.'),
  noPostal('MO', 'Macao', 'Asia', 22.1987, 113.5439, 700_000, 33, 8, 'mixed', 'Use parish/district, street/building, landmark, and compact AGID delivery cells.'),
  noPostal('AE', 'United Arab Emirates', 'Asia', 23.4241, 53.8478, 9_500_000, 83_600, 7, 'desert', 'Supplement national addressing and PO box/building systems with AGID delivery cells.'),
  noPostal('QA', 'Qatar', 'Asia', 25.3548, 51.1839, 2_700_000, 11_581, 8, 'desert', 'Use municipality, zone, street, building number, and AGID delivery cells.'),
  noPostal('BH', 'Bahrain', 'Asia', 26.0667, 50.5577, 1_500_000, 786, 8, 'mixed', 'Use governorate, block, road, building, and AGID delivery cells without inventing official postcodes.'),
  noPostal('LC', 'Saint Lucia', 'Americas', 13.9094, -60.9789, 180_000, 617, 11, 'archipelago', 'Use district/community, road, landmark, and island-aware AGID cells.'),
  noPostal('JM', 'Jamaica', 'Americas', 18.1096, -77.2975, 2_800_000, 10_991, 14, 'archipelago', 'Use parish, community, road, landmark, and AGID cells; keep any local zone metadata supplemental.'),
  noPostal('DM', 'Dominica', 'Americas', 15.415, -61.371, 72_000, 751, 10, 'archipelago', 'Use parish, village, road/landmark, and mountain-island delivery evidence.'),
  noPostal('KI', 'Kiribati', 'Oceania', 1.8709, -157.363, 130_000, 811, 23, 'archipelago', 'Use island, council, settlement, and atoll-aware AGID cells.'),
  noPostal('NR', 'Nauru', 'Oceania', -0.5228, 166.9315, 13_000, 21, 14, 'archipelago', 'Use district, road/landmark, and compact whole-island AGID cells.'),
  noPostal('TV', 'Tuvalu', 'Oceania', -7.1095, 177.6493, 11_000, 26, 9, 'archipelago', 'Use island, village, and atoll-aware AGID cells.'),
  noPostal('SB', 'Solomon Islands', 'Oceania', -9.6457, 160.1562, 740_000, 28_896, 10, 'archipelago', 'Use province, island, settlement, and boat/shore handoff evidence.'),
  noPostal('VU', 'Vanuatu', 'Oceania', -15.3767, 166.9592, 335_000, 12_189, 6, 'archipelago', 'Use province, island, area council, settlement, and shore/road handoff evidence.'),
  noPostal('WS', 'Samoa', 'Oceania', -13.759, -172.1046, 225_000, 2_842, 11, 'archipelago', 'Use district, village, road/landmark, and island-aware AGID cells.'),
  noPostal('TO', 'Tonga', 'Oceania', -21.179, -175.1982, 107_000, 747, 5, 'archipelago', 'Use island group, district, village, and AGID delivery cells.'),
];

export const POSTAL_FORGE_WEAK_POSTAL_PREPARATION_COUNTRIES: PostalForgePreparationTarget[] = [
  weakPostal('IE', 'Ireland', 'Europe', 53.4129, -8.2439, 5_300_000, 70_273, 31, 'mixed', '^[A-Z0-9]{3}\\s?[A-Z0-9]{4}$', ['D02 X285'], 'Treat existing code as authoritative when present; use AGID only for supplemental routing and missing-code workflows.'),
  weakPostal('KE', 'Kenya', 'Africa', -0.0236, 37.9062, 55_000_000, 580_367, 47, 'mixed', '^\\d{5}$', ['00100'], 'Use postal format, county/sub-county candidates, road evidence, and manual delivery confirmation.'),
  weakPostal('TZ', 'Tanzania', 'Africa', -6.369, 34.8888, 67_000_000, 945_087, 31, 'mixed', '^\\d{5}$', ['11101'], 'Use region/district candidates and keep postal code as a hint, not a strict delivery guarantee.'),
  weakPostal('NG', 'Nigeria', 'Africa', 9.082, 8.6753, 224_000_000, 923_768, 774, 'mixed', '^\\d{6}$', ['100001'], 'Use postal format checks, state/LGA candidates, and local delivery confirmation.'),
  weakPostal('ET', 'Ethiopia', 'Africa', 9.145, 40.4897, 126_000_000, 1_104_300, 1_000, 'mountain', '^\\d{4}$', ['1000'], 'Use region/woreda/kebele hierarchy and AGID cells for last-mile evidence.'),
  weakPostal('UG', 'Uganda', 'Africa', 1.3733, 32.2903, 49_000_000, 241_038, 170, 'mixed', '^\\d{5}$', ['10101'], 'Use district/local council candidates and AGID as supplemental locality evidence.'),
  weakPostal('GH', 'Ghana', 'Africa', 5.6037, -0.187, 34_000_000, 238_533, 261, 'mixed', '^[A-Z]{2}-\\d{3}-\\d{4}$', ['GA-123-4567'], 'Use Ghana-style digital address hints plus admin and delivery confirmation.'),
  weakPostal('AO', 'Angola', 'Africa', -11.2027, 17.8739, 37_000_000, 1_246_700, 164, 'mixed', '^\\d{4}$', ['1000'], 'Use province/municipality/commune hierarchy and manual delivery candidates where postal metadata is sparse.'),
  weakPostal('CD', 'DR Congo', 'Africa', -4.0383, 21.7587, 102_000_000, 2_344_858, 145, 'mixed', '^\\d{7}$', ['1004131', '3202011'], 'SCPT and UPU define seven digits. Province, territory, city, humanitarian context and AGID cells remain independent identifiers and cannot validate or replace the postcode.'),
  weakPostal('PG', 'Papua New Guinea', 'Oceania', -6.315, 143.9555, 10_500_000, 462_840, 22, 'mountain', '^\\d{3}$', ['111'], 'Use province/district/LLG hierarchy, island/highland constraints, and manual delivery confirmation.'),
  weakPostal('NP', 'Nepal', 'Asia', 28.3949, 84.124, 31_000_000, 147_516, 753, 'mountain', '^\\d{5}$', ['44600'], 'Use mountain routing, municipality/ward hierarchy, and AGID delivery cells as supplemental evidence.'),
  weakPostal('KH', 'Cambodia', 'Asia', 12.5657, 104.991, 17_000_000, 181_035, 200, 'mixed', '^\\d{5}$', ['12000'], 'Use province/district/commune candidates and do not override local manual input.'),
  weakPostal('LA', 'Laos', 'Asia', 19.8563, 102.4955, 7_600_000, 236_800, 150, 'mountain', '^\\d{5}$', ['01000'], 'Use province/district/village hierarchy with AGID and route evidence outside major cities.'),
];

export const POSTAL_FORGE_PREPARATION_TARGETS: PostalForgePreparationTarget[] = [
  ...POSTAL_FORGE_NO_POSTAL_PREPARATION_COUNTRIES,
  ...POSTAL_FORGE_WEAK_POSTAL_PREPARATION_COUNTRIES,
].sort((left, right) => left.code.localeCompare(right.code));

export function listPostalForgePreparationTargets(classHint?: PostalForgePreparationClass) {
  return POSTAL_FORGE_PREPARATION_TARGETS.filter(target => !classHint || target.preparationClass === classHint);
}

export function findPostalForgePreparationTarget(countryCode: string) {
  const normalized = countryCode.trim().toUpperCase();
  return POSTAL_FORGE_PREPARATION_TARGETS.find(target => target.code === normalized) || null;
}

export function summarizePostalForgePreparationTargets() {
  const noPostal = listPostalForgePreparationTargets('no-postal-code');
  const weakPostal = listPostalForgePreparationTargets('weak-postal-code');
  return {
    total: POSTAL_FORGE_PREPARATION_TARGETS.length,
    noPostalCode: noPostal.length,
    weakPostalCode: weakPostal.length,
    primaryAgidPostal: noPostal.length,
    supplementalAgidPostal: weakPostal.length,
    remainingToPromote: POSTAL_FORGE_PREPARATION_TARGETS.filter(target => (
      target.safetyGates.includes('human-review-before-publication')
      || target.safetyGates.includes('manual-review-before-replacement-claim')
    )).length,
  };
}
