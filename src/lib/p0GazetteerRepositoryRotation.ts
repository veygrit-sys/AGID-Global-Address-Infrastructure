import type { GeoOssGapEntry, GeoOssGapStrategyReport } from './geoOpenSourceGapStrategy';

export const P0_GAZETTEER_REPOSITORY_ROTATION_VERSION = 'p0-gazetteer-repository-rotation-v0.1';

export type GazetteerPlaceSeed = {
  agidPlaceId: string;
  name: string;
  localNames: Record<string, string>;
  featureClass: 'country' | 'region' | 'province' | 'state' | 'district' | 'canton' | 'chiefdom' | 'capital' | 'city' | 'municipality' | 'settlement' | 'island' | 'special-region';
  adminPath: string[];
  agidPath: string[];
  approximateCentroid: {
    lat: number;
    lon: number;
    precision: 'country' | 'region' | 'city' | 'settlement';
  };
  geodataLinks: {
    osm?: string;
    wikidata?: string;
    geonames?: string;
    official?: string;
  };
  validationState: 'seed-only' | 'source-linked' | 'license-reviewed' | 'verified';
  notes: string[];
};

export type GazetteerRepositorySource = {
  id: string;
  name: string;
  url: string;
  role: 'admin-boundary' | 'gazetteer' | 'geocoding' | 'address-candidate' | 'reference';
  ingestionStatus: 'not-ingested' | 'seed-linked' | 'fixture-only' | 'approved-for-import';
  licenseStatus: 'open-review-required' | 'attribution-required' | 'restricted-do-not-bundle' | 'unknown-review-required';
  redistribution: 'not-bundled' | 'synthetic-only' | 'metadata-link-only' | 'approved';
  notes: string[];
};

export type P0GazetteerRepositoryPlan = {
  version: typeof P0_GAZETTEER_REPOSITORY_ROTATION_VERSION;
  generatedAt: string;
  repository: string;
  owner: string;
  countryCode: string;
  countryName: string;
  continent: string;
  sourceGapPriority: GeoOssGapEntry['priority'];
  regionKind: GeoOssGapEntry['regionKind'];
  rotationRank: number;
  agidCountryId: string;
  packagePurpose: string;
  sourceGapReasons: string[];
  missingCoreRoles: string[];
  releaseGates: string[];
  sources: GazetteerRepositorySource[];
  placeSeeds: GazetteerPlaceSeed[];
};

function slug(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function agidCountryId(countryCode: string) {
  return `agid:country:${countryCode.toUpperCase()}`;
}

function agidPlaceId(countryCode: string, name: string) {
  return `agid:place:${countryCode.toUpperCase()}:${slug(name)}`;
}

const ALAND_GOVERNMENT_MUNICIPALITIES_URL = 'https://www.regeringen.ax/sa-styrs-aland/alands-kommuner';
const ALAND_GEONAMES_ADMIN_URL = 'https://www.geonames.org/AX/administrative-division-aland-islands.html';
const ALAND_ASUB_URL = 'https://www.asub.ax/';
const NAURU_GOVERNMENT_ALL_DISTRICTS_URL = 'https://www.nauru.gov.nr/government-information-office/media-release/nauru-national-sustainable-development-strategy-public-consultation-covers-all-14-districts.aspx';
const NAURU_GEONAMES_ADMIN_URL = 'https://www.geonames.org/NR/administrative-division-nauru.html';
const NAURU_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/NR/nauru.html';
const NAURU_STATOIDS_URL = 'https://statoids.com/unr.html';
const BRUNEI_INFORMATION_DEPARTMENT_URL = 'https://www.information.gov.bn/SitePages/About%20Brunei%20Darussalam.aspx';
const BRUNEI_GEONAMES_ADMIN_URL = 'https://www.geonames.org/BN/administrative-division-brunei.html';
const BRUNEI_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/BN/brunei.html';
const MICRONESIA_GOVERNMENT_URL = 'https://gov.fm/';
const MICRONESIA_GEONAMES_ADMIN_URL = 'https://www.geonames.org/FM/administrative-division-micronesia.html';
const MICRONESIA_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/FM/micronesia.html';
const MICRONESIA_PACIFIC_RISA_URL = 'https://www.pacificrisa.org/places/federated-states-of-micronesia/';
const LUXEMBOURG_TERRITORY_URL = 'https://luxembourg.public.lu/en/society-and-culture/territoire-et-climat/territoire.html';
const LUXEMBOURG_GEONAMES_ADMIN_URL = 'https://www.geonames.org/lu/administrative-division-luxembourg.html';
const LUXEMBOURG_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/LU/luxembourg.html';
const NEW_CALEDONIA_PROVINCES_URL = 'https://gouv.nc/gouvernement-et-institutions-les-autres-institutions/les-provinces';
const NEW_CALEDONIA_STATE_PROVINCES_URL = 'https://www.nouvelle-caledonie.gouv.fr/Services-de-l-Etat/La-Nouvelle-Caledonie/Institutions-du-territoire/Les-provinces';
const NEW_CALEDONIA_GEONAMES_ADMIN_URL = 'https://www.geonames.org/NC/administrative-division-new-caledonia.html';
const NEW_CALEDONIA_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/NC/new-caledonia.html';
const WALLIS_FUTUNA_INSTITUTIONAL_URL = 'https://www.wallis-et-futuna.gouv.fr/Actualites/Presentation-de-Wallis-et-Futuna/Organisation-institutionnelle';
const WALLIS_FUTUNA_CULTURE_URL = 'https://www.wallis-et-futuna.gouv.fr/Actions-de-l-Etat/Culture-et-patrimoine';
const WALLIS_FUTUNA_OCTA_URL = 'https://www.overseas-association.eu/oct/wallis-and-futuna/';
const WALLIS_FUTUNA_GEONAMES_ADMIN_URL = 'https://www.geonames.org/WF/administrative-division-wallis-%26-futuna.html';
const WALLIS_FUTUNA_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/WF/wallis-and-futuna.html';
const PITCAIRN_GOVERNMENT_URL = 'https://www.government.pn/';
const PITCAIRN_VISIT_ISLANDS_URL = 'https://www.visitpitcairn.pn/the-islands';
const PITCAIRN_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/pn/pitcairn-islands.html';
const PITCAIRN_STATOIDS_URL = 'https://statoids.com/upn.html';
const FAROE_GOVERNMENT_URL = 'https://www.government.fo/en/foreign-relations/about-the-faroe-islands';
const FAROE_OFFICIAL_SITE_URL = 'https://www.faroeislands.fo/';
const FAROE_STATISTICS_ISLANDS_URL = 'https://hagstova.fo/en/environment/geography/islands-mountains-islets-og-lakes';
const FAROE_VISIT_MAPS_URL = 'https://visitfaroeislands.com/en/plan-your-stay/get-ready-for-your-trip/maps-of-the-faroe-islands';
const FAROE_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/fo/faroe-islands.html';
const FAROE_GEONAMES_STATS_URL = 'https://www.geonames.org/statistics/faroe-islands.html';
const MARSHALL_CONSTITUTION_URL = 'https://rmiparliament.org/cms/?catid=87&id=134%3Athe-constitution&view=article';
const MARSHALL_LOCAL_GOVERNMENTS_URL = 'https://rmicourts.org/constitutions-of-the-local-governments-of-the-republic-of-the-marshall-islands/';
const MARSHALL_GEONAMES_ADMIN_URL = 'https://www.geonames.org/MH/administrative-division-marshall-islands.html';
const MARSHALL_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/MH/marshall-islands.html';
const MARSHALL_STATOIDS_URL = 'https://statoids.com/ymh.html';
const MALAYSIA_MYGOV_FLAG_URL = 'https://www.malaysia.gov.my/en/government/kenali-malaysia/flag-of-malaysia';
const MALAYSIA_MYGEO_UPI_URL = 'https://www.mygeoportal.gov.my/en/unique-parcel-identifier-upi';
const MALAYSIA_MYGEO_PDNG_URL = 'https://www.mygeoportal.gov.my/en/pdng';
const MALAYSIA_DOSM_LOCAL_STATS_URL = 'https://www.dosm.gov.my/portal-main/release-content/my-local-stats--malaysia-state--administrative-district';
const MALAYSIA_OPENDOSM_STATE_URL = 'https://open.dosm.gov.my/data-catalogue/hh_profile_state';
const MALAYSIA_GEONAMES_ADMIN_URL = 'https://www.geonames.org/MY/administrative-division-malaysia.html';
const MALAYSIA_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/MY/malaysia.html';
const MALAYSIA_GEONAMES_STATS_URL = 'https://www.geonames.org/statistics/malaysia.html';
const NETHERLANDS_GOV_PROVINCES_URL = 'https://www.government.nl/themes/government-and-democracy/provinces';
const NETHERLANDS_BUSINESS_GOV_LIFE_URL = 'https://business.gov.nl/coming-to-the-netherlands/living-in-the-netherlands/dutch-life-and-personal-matters/';
const NETHERLANDS_GOV_BES_URL = 'https://www.government.nl/themes/government-and-democracy/caribbean-parts-of-the-kingdom/governance-of-bonaire-st-eustatius-and-saba';
const NETHERLANDS_CBS_CARIBBEAN_URL = 'https://www.cbs.nl/en-gb/longread/diversen/2025/the-dutch-caribbean-15-years-after-the-dissolution-of-the-netherlands-antilles/1-introduction';
const NETHERLANDS_GEONAMES_ADMIN_URL = 'https://www.geonames.org/NL/administrative-division-netherlands.html';
const NETHERLANDS_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/NL/the-netherlands.html';
const NETHERLANDS_GEONAMES_STATS_URL = 'https://www.geonames.org/statistics/the-netherlands.html';
const POLYNESIA_PREF_COMMUNES_URL = 'https://www.polynesie-francaise.pref.gouv.fr/Actions-de-l-Etat/Accompagnement-des-communes/Presentation';
const POLYNESIA_PREF_SUBDIVISIONS_URL = 'https://www.polynesie-francaise.pref.gouv.fr/Services-de-l-Etat/Le-Haut-Commissariat/Les-subdivisions';
const POLYNESIA_ISPF_POPULATION_URL = 'https://www.ispf.pf/actualites/16';
const POLYNESIA_GEONAMES_ADMIN_URL = 'https://www.geonames.org/PF/administrative-division-french-polynesia.html';
const POLYNESIA_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/PF/french-polynesia.html';
const POLYNESIA_GEONAMES_STATS_URL = 'https://www.geonames.org/statistics/french-polynesia.html';
const KIRIBATI_NSO_DISTRICTS_URL = 'https://nso.gov.ki/kiribati-districts/';
const KIRIBATI_TOURISM_ABOUT_URL = 'https://www.kiribatitourism.gov.ki/kiribati-pacific-ocean-location/';
const KIRIBATI_COMMONWEALTH_URL = 'https://thecommonwealth.org/our-member-countries/kiribati';
const KIRIBATI_DFAT_BRIEF_URL = 'https://www.dfat.gov.au/geo/kiribati/kiribati-country-brief';
const KIRIBATI_GEONAMES_ADMIN_URL = 'https://www.geonames.org/KI/administrative-division-kiribati.html';
const KIRIBATI_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/KI/kiribati.html';
const KIRIBATI_GEONAMES_STATS_URL = 'https://www.geonames.org/statistics/kiribati.html';
const NORTH_KOREA_GEONAMES_ADMIN_URL = 'https://www.geonames.org/kp/administrative-division-north-korea.html';
const NORTH_KOREA_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/KP/north-korea.html';
const NORTH_KOREA_GEONAMES_STATS_URL = 'https://www.geonames.org/statistics/north-korea.html';
const NORTH_KOREA_OPENFACTBOOK_URL = 'https://openfactbook.org/countries/north-korea/';
const NORTH_KOREA_PCGN_ADMIN_URL = 'https://assets.publishing.service.gov.uk/media/626bbca9e90e0746cec75b2c/North_Korea_-_2017_annex_2021_update2.pdf';
const LAOS_GEONAMES_ADMIN_URL = 'https://www.geonames.org/LA/administrative-division-laos.html';
const LAOS_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/LA/laos.html';
const LAOS_GEONAMES_STATS_URL = 'https://www.geonames.org/statistics/laos.html';
const LAOS_OPENFACTBOOK_URL = 'https://openfactbook.org/countries/laos/';
const LAOS_OPEN_DEVELOPMENT_BOUNDARIES_URL = 'https://data.laos.opendevelopmentmekong.net/dataset/lao-administrative-boundaries-level-0-3';
const MYANMAR_GEONAMES_ADMIN_URL = 'https://www.geonames.org/MM/administrative-division-myanmar-burma.html';
const MYANMAR_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/MM/myanmar.html';
const MYANMAR_GEONAMES_STATS_URL = 'https://www.geonames.org/statistics/myanmar.html';
const MYANMAR_ADMIN_GEOGRAPHY_URL = 'https://geo.fyi/2020/12/16/administrative-geography-of-myanmar/';
const PAPUA_NEW_GUINEA_GEONAMES_ADMIN_URL = 'https://www.geonames.org/PG/administrative-division-papua-new-guinea.html';
const PAPUA_NEW_GUINEA_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/PG/papua-new-guinea.html';
const PAPUA_NEW_GUINEA_OPENFACTBOOK_URL = 'https://openfactbook.org/countries/papua-new-guinea/';
const BOUGAINVILLE_GOV_QUICK_FACTS_URL = 'https://abg.gov.pg/about/quick-facts';
const PHILIPPINES_GEONAMES_ADMIN_URL = 'https://www.geonames.org/PH/administrative-division-philippines.html';
const PHILIPPINES_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/PH/philippines.html';
const PHILIPPINES_PHILATLAS_REGIONS_URL = 'https://www.philatlas.com/regions.html';
const PHILIPPINES_PSA_NIR_URL = 'https://psa.gov.ph/classification/psgc/provinces/1800000000';
const THAILAND_GEONAMES_ADMIN_URL = 'https://www.geonames.org/TH/administrative-division-thailand.html';
const THAILAND_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/TH/thailand.html';
const THAILAND_DICF_URL = 'https://dicf.unepgrid.ch/thailand';
const THAILAND_PCGN_FACTFILE_URL = 'https://assets.publishing.service.gov.uk/media/6672f29dc087fbe40855ce7b/Thailand_Toponymic_Factfile.pdf';
const CHINA_GEONAMES_ADMIN_URL = 'https://www.geonames.org/CN/administrative-division-china.html';
const CHINA_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/CN/china.html';
const CHINA_ADMIN_SYSTEM_URL = 'https://hrlibrary.umn.edu/research/china-admin.html';
const INDONESIA_GEONAMES_ADMIN_URL = 'https://www.geonames.org/id/administrative-division-indonesia.html';
const INDONESIA_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/ID/indonesia.html';
const INDONESIA_PCGN_FACTFILE_URL = 'https://assets.publishing.service.gov.uk/media/67852932c6428e0131881700/Indonesia_Toponymic_Factfile.pdf';
const IRELAND_GEONAMES_ADMIN_URL = 'https://www.geonames.org/IE/administrative-division-ireland.html';
const IRELAND_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/IE/ireland.html';
const IRELAND_GOV_LOCAL_AUTHORITIES_URL = 'https://www.gov.ie/en/department-of-rural-and-community-development-and-the-gaeltacht/publications/local-authorities/';
const IRELAND_LOCALGOV_URL = 'https://www.localgov.ie/find-my-local-authority';
const CAMBODIA_GEONAMES_ADMIN_URL = 'https://www.geonames.org/kh/administrative-division-cambodia.html';
const CAMBODIA_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/KH/cambodia.html';
const CAMBODIA_PCGN_FACTFILE_URL = 'https://assets.publishing.service.gov.uk/media/6a33d3aec6e94f095f3efa35/Cambodia_Toponymic_Factfile.pdf';
const SVALBARD_JAN_MAYEN_GEONAMES_ADMIN_URL = 'https://www.geonames.org/SJ/administrative-division-svalbard-%26-jan-mayen.html';
const SVALBARD_JAN_MAYEN_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/sj/svalbard-and-jan-mayen.html';
const SVALBARD_JAN_MAYEN_GEONAMES_STATS_URL = 'https://www.geonames.org/statistics/svalbard-and-jan-mayen.html';
const SVALBARD_JAN_MAYEN_GEONAMES_CITIES_URL = 'https://www.geonames.org/SJ/largest-cities-in-svalbard-and-jan-mayen.html';
const SVALBARD_GOVERNOR_LAND_USE_URL = 'https://www.sysselmesteren.no/en/the-governor-of-svalbard/environmental-protection/land-use-management/';
const JAN_MAYEN_NPOLAR_URL = 'https://npolar.no/en/themes/jan-mayen/';
const VIETNAM_GEONAMES_ADMIN_URL = 'https://www.geonames.org/VN/administrative-division-vietnam.html';
const VIETNAM_GEONAMES_STATS_URL = 'https://www.geonames.org/statistics/vietnam.html';
const VIETNAM_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/VN/vietnam.html';
const VIETNAM_GOV_REFORM_URL = 'https://en.baochinhphu.vn/names-and-administrative-centers-of-34-provinces-and-centrally-run-cities-specified-111250415094350491.htm';
const VIETNAM_TOURISM_NEW_PROVINCES_URL = 'https://vietnam.travel/things-to-do/vietnam%E2%80%99s-new-provincial-system-34-names-you-should-know';
const BIR_TAWIL_OSM_WIKI_URL = 'https://wiki.openstreetmap.org/wiki/Bir_Tawil';
const BIR_TAWIL_WIKIDATA_URL = 'https://www.wikidata.org/wiki/Q620634';
const BIR_TAWIL_WIKIPEDIA_URL = 'https://en.wikipedia.org/wiki/Bir_Tawil';
const BIR_TAWIL_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Bir+Tawil&country=';
const UKRAINE_HDX_COD_AB_URL = 'https://data.humdata.org/dataset/cod-ab-ukr';
const UKRAINE_GEONAMES_ADMIN_URL = 'https://www.geonames.org/ua/administrative-division-ukraine.html';
const CRIMEA_OCHA_MAP_URL = 'https://www.unocha.org/publications/map/ukraine/ukraine-autonomous-republic-crimea-reference-map-30-january-2026';
const CRIMEA_GEONAMES_URL = 'https://www.geonames.org/703883/autonomous-republic-of-crimea.html';
const UNFICYP_BUFFER_ZONE_URL = 'https://unficyp.unmissions.org/en/about-buffer-zone';
const UNFICYP_FACTSHEET_URL = 'https://peacekeeping.un.org/en/factsheet/unficyp';
const DONETSK_OCHA_MAP_URL = 'https://www.unocha.org/publications/map/ukraine/ukraine-donetska-oblast-reference-map-17-september-2024';
const LUHANSK_OCHA_MAP_URL = 'https://www.unocha.org/publications/map/ukraine/ukraine-luhanska-oblast-reference-map-17-september-2024';
const ETHIOPIA_ERITREA_EEBC_DECISION_URL = 'https://legal.un.org/riaa/cases/vol_xxv/83-195.pdf';
const ETHIOPIA_ERITREA_UNMEE_BACKGROUND_URL = 'https://peacekeeping.un.org/sites/default/files/past/unmee/background.html';
const ETHIOPIA_ERITREA_PCA_CASE_URL = 'https://pca-cpa.org/en/cases/99/';
const ETHIOPIA_ERITREA_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Ethiopia+Eritrea+border&country=';
const JAPAN_MOFA_NORTHERN_TERRITORIES_URL = 'https://www.mofa.go.jp/region/europe/russia/territory/index.html';
const JAPAN_MOFA_NORTHERN_TERRITORIES_INFO_URL = 'https://www.mofa.go.jp/erp/rss/northern/page1we_000017.html';
const NORTHERN_TERRITORIES_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Etorofu+Kunashiri+Shikotan+Habomai&country=';
const JAPAN_MOFA_SENKAKU_URL = 'https://www.mofa.go.jp/region/asia-paci/senkaku/';
const JAPAN_MOFA_SENKAKU_INFO_URL = 'https://www.mofa.go.jp/a_o/c_m1/senkaku/page1we_000009.html';
const SENKAKU_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Senkaku+Islands&country=';
const JAPAN_MOFA_TAKESHIMA_URL = 'https://www.mofa.go.jp/region/asia-paci/takeshima/';
const KOREA_DOKDO_LOCATION_URL = 'https://contents.nahf.or.kr/english/item/level.do?levelId=eddok.e_0003_0010_0010';
const TAKESHIMA_DOKDO_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Liancourt+Rocks+Dokdo+Takeshima&country=';
const UNMOGIP_HOME_URL = 'https://unmogip.unmissions.org/en';
const UNMOGIP_BACKGROUND_URL = 'https://unmogip.unmissions.org/en/unmogip-background';
const UNTERM_LINE_OF_CONTROL_URL = 'https://unterm.un.org/unterm2/view/UNHQ/F458380C6EFA75A085256A00000768E8';
const KASHMIR_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Kashmir+Jammu+Ladakh+Gilgit+Baltistan+Aksai+Chin&country=';
const OSCE_TRANSNISTRIAN_SETTLEMENT_URL = 'https://moldova.osce.org/mission-to-moldova/104529';
const MOLDOVA_GOV_TRANSNISTRIAN_TERMINOLOGY_URL = 'https://old.gov.md/en/content/useful-information';
const TRANSNISTRIA_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Transnistria+Tiraspol+Bender+Ribnita+Dubasari&country=';
const AMTI_CHINA_ISLAND_TRACKER_URL = 'https://amti.csis.org/island-tracker/china/';
const CNA_SOUTH_CHINA_SEA_CLAIMS_URL = 'https://www.cna.org/analyses/2014/china-versus-vietnam';
const SOUTH_CHINA_SEA_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Spratly+Paracel+Pratas+Macclesfield+Scarborough&country=';
const EU_GREEN_LINE_REGULATION_URL = 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02004R0866-20150831';
const NORTHERN_CYPRUS_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Northern+Cyprus+North+Nicosia+Famagusta+Kyrenia+Morphou+Iskele&country=';
const VISIT_BAARLE_ENCLAVES_URL = 'https://m-en.visitbaarle.com/locaties/enclaves-5e43f39e38374665355357fe';
const BAARLE_HERTOG_OFFICIAL_URL = 'https://www.baarle-hertog.be/';
const BAARLE_NASSAU_OFFICIAL_URL = 'https://www.baarle-nassau.nl/';
const BAARLE_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Baarle-Hertog+Baarle-Nassau+enclave&country=';
const HENDAYE_PHEASANT_HANDOVER_URL = 'https://www.hendaye.fr/fr/ceremonie-de-passation-de-pouvoirs-sur-lile-des-faisans/';
const BIDASOA_PHEASANT_ISLAND_URL = 'https://www.bidasoaturismo.com/en/lugares/pheasant-island/';
const PHEASANT_ISLAND_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Pheasant+Island+Ile+des+Faisans+Isla+Faisanes&country=';
const NPI_BOUVETOYA_URL = 'https://npolar.no/en/themes/bouvetoya/';
const NPI_BOUVETOYA_REGULATIONS_URL = 'https://npolar.no/en/regulations-bouvetoya-nature-reserve/';
const BOUVET_GEONAMES_COUNTRY_URL = 'https://www.geonames.org/countries/BV/bouvet-island.html';
const BOUVET_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Bouvet+Island+Nyr%C3%B8ysa+Olavtoppen+Lars%C3%B8ya+Norvegia&country=BV';
const SUBPESCA_DESVENTURADAS_URL = 'https://www.subpesca.cl/portal/617/w3-article-89904.html';
const MMA_NAZCA_DESVENTURADAS_URL = 'https://mma.gob.cl/ministerio-del-medio-ambiente-oficializa-la-creacion-de-parque-marino-nazca-desventuradas-con-lo-que-chile-triplica-su-superficie-oceanica-bajo-proteccion-oficial/';
const MARINE_REGIONS_DESVENTURADAS_URL = 'https://marineregions.org/mrgid/25135';
const DESVENTURADAS_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Desventuradas+San+Felix+San+Ambrosio+Gonzalez+Roca+Catedral&country=CL';
const MONUMENTOS_SALAS_GOMEZ_URL = 'https://www.monumentos.gob.cl/monumentos/santuarios-de-la-naturaleza/la-isla-salas-y-gomez-e-islotes-adyacentes-la-isla-de-pascua';
const SIMBIO_MOTU_MOTIRO_HIVA_URL = 'https://simbio.mma.gob.cl/CbaAP/VistaImpresion/1724';
const MARINE_REGIONS_SALAS_GOMEZ_URL = 'https://marineregions.org/gazetteer.php/gazetteer.php?id=22632&p=details';
const SALAS_GOMEZ_GEONAMES_URL = 'https://www.geonames.org/4030734/isla-salas-y-gomez.html';
const OUTRE_MER_CLIPPERTON_URL = 'https://www.outre-mer.gouv.fr/territoires/ile-de-la-passion-clipperton';
const LEGIFRANCE_CLIPPERTON_STATUS_URL = 'https://www.legifrance.gouv.fr/codes/section_lc/JORFTEXT000000879815/LEGISCTA000006087727/';
const LEGIFRANCE_CLIPPERTON_ADMIN_DECREE_URL = 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000048567048';
const MARINE_REGIONS_CLIPPERTON_EEZ_URL = 'https://www.marineregions.org/gazetteer.php?id=8401&p=details';
const MARINE_REGIONS_CLIPPERTON_12NM_URL = 'https://marineregions.org/gazetteer.php?id=49121&p=details';
const CLIPPERTON_GEONAMES_URL = 'https://www.geonames.org/4020092/clipperton-island.html';
const SBA_ADMINISTRATION_URL = 'https://www.sbaadministration.org/index.php/administration';
const SBA_AREA_ADMINISTRATION_OFFICES_URL = 'https://www.sbaadministration.org/index.php/civil-admin-mn';
const SBA_LOCAL_GOVERNMENT_REFORM_URL = 'https://www.sbaadministration.org/index.php/lgr-home';
const SBA_ENVIRONMENT_URL = 'https://www.sbaadministration.org/index.php?catid=2&id=126%3Aenvironmental&view=article';
const SBA_DECLARATIONS_URL = 'https://www.sbaadministration.org/images/agla/Declarations_by_Her_Majesty.pdf';
const DHEKELIA_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Dhekelia+Eastern+Sovereign+Base+Area+Agios+Nikolaos+Cape+Pyla+Xylotymbou+Xylophagou+Ormidhia&country=CY';
const AKROTIRI_GEONAMES_SEARCH_URL = 'https://www.geonames.org/search.html?q=Akrotiri+Western+Sovereign+Base+Area+Episkopi+Akrotiri+Peninsula+Avdimou+Paramali&country=CY';

function alandPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('AX', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, sv: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('AX'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('AX', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: ALAND_GOVERNMENT_MUNICIPALITIES_URL,
      geonames: ALAND_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public place seed; boundary geometry is linked, not bundled.'],
  };
}

const ALAND_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  alandPlace({
    name: 'Åland Islands',
    localNames: { en: 'Åland Islands', sv: 'Åland', fi: 'Ahvenanmaa' },
    featureClass: 'country',
    adminPath: ['Åland Islands'],
    centroid: { lat: 60.1785, lon: 19.9156, precision: 'country' },
    geodataLinks: {
      wikidata: 'https://www.wikidata.org/wiki/Q5689',
    },
    notes: [
      'Autonomous demilitarized region seed; this pack records public place metadata only.',
      'Åland has 16 municipalities; this seed pack includes all of them as public municipality records.',
    ],
  }),
  alandPlace({
    name: 'Ålands landsbygd',
    localNames: { en: 'Åland Countryside', sv: 'Ålands landsbygd' },
    featureClass: 'region',
    adminPath: ['Åland Islands', 'Ålands landsbygd'],
    centroid: { lat: 60.25, lon: 19.85, precision: 'region' },
    notes: ['Rural municipality grouping seed; GeoNames administrative code: 212.'],
  }),
  alandPlace({
    name: 'Ålands skärgård',
    localNames: { en: 'Åland Archipelago', sv: 'Ålands skärgård' },
    featureClass: 'region',
    adminPath: ['Åland Islands', 'Ålands skärgård'],
    centroid: { lat: 60.2, lon: 20.75, precision: 'region' },
    notes: ['Archipelago municipality grouping seed; GeoNames administrative code: 213.'],
  }),
  alandPlace({
    name: 'Brändö',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands skärgård', 'Brändö'],
    centroid: { lat: 60.411, lon: 21.046, precision: 'settlement' },
    geodataLinks: { geonames: 'https://www.geonames.org/660528/braendoe.html' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 035.'],
  }),
  alandPlace({
    name: 'Eckerö',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands landsbygd', 'Eckerö'],
    centroid: { lat: 60.222, lon: 19.558, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 043.'],
  }),
  alandPlace({
    name: 'Finström',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands landsbygd', 'Finström'],
    centroid: { lat: 60.233, lon: 19.967, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 060.'],
  }),
  alandPlace({
    name: 'Föglö',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands skärgård', 'Föglö'],
    centroid: { lat: 60.029, lon: 20.39, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 062.'],
  }),
  alandPlace({
    name: 'Geta',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands landsbygd', 'Geta'],
    centroid: { lat: 60.374, lon: 19.844, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 065.'],
  }),
  alandPlace({
    name: 'Hammarland',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands landsbygd', 'Hammarland'],
    centroid: { lat: 60.217, lon: 19.75, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 076.'],
  }),
  alandPlace({
    name: 'Jomala',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands landsbygd', 'Jomala'],
    centroid: { lat: 60.153, lon: 19.951, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 170.'],
  }),
  alandPlace({
    name: 'Kumlinge',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands skärgård', 'Kumlinge'],
    centroid: { lat: 60.26, lon: 20.779, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 295.'],
  }),
  alandPlace({
    name: 'Kökar',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands skärgård', 'Kökar'],
    centroid: { lat: 59.92, lon: 20.908, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 318.'],
  }),
  alandPlace({
    name: 'Lemland',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands landsbygd', 'Lemland'],
    centroid: { lat: 60.07, lon: 20.083, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 417.'],
  }),
  alandPlace({
    name: 'Lumparland',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands landsbygd', 'Lumparland'],
    centroid: { lat: 60.117, lon: 20.25, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 438.'],
  }),
  alandPlace({
    name: 'Mariehamn',
    localNames: { en: 'Mariehamn', sv: 'Mariehamn', fi: 'Maarianhamina' },
    featureClass: 'capital',
    adminPath: ['Åland Islands', 'Mariehamn'],
    centroid: { lat: 60.097, lon: 19.934, precision: 'city' },
    geodataLinks: { geonames: 'https://www.geonames.org/3041733/mariehamn.html' },
    notes: [
      'Complete AX municipality seed; only town in Åland; GeoNames administrative code: 478.',
      'GeoNames also exposes Mariehamn as administrative subdivision code 211; this pack keeps one public place record to avoid duplicate AGID identities.',
    ],
  }),
  alandPlace({
    name: 'Saltvik',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands landsbygd', 'Saltvik'],
    centroid: { lat: 60.283, lon: 20.05, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 736.'],
  }),
  alandPlace({
    name: 'Sottunga',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands skärgård', 'Sottunga'],
    centroid: { lat: 60.13, lon: 20.667, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 766.'],
  }),
  alandPlace({
    name: 'Sund',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands landsbygd', 'Sund'],
    centroid: { lat: 60.25, lon: 20.117, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 771.'],
  }),
  alandPlace({
    name: 'Vårdö',
    featureClass: 'municipality',
    adminPath: ['Åland Islands', 'Ålands skärgård', 'Vårdö'],
    centroid: { lat: 60.242, lon: 20.374, precision: 'settlement' },
    notes: ['Complete AX municipality seed; GeoNames administrative code: 941.'],
  }),
];

function nauruPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('NR', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, na: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('NR'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('NR', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: NAURU_GOVERNMENT_ALL_DISTRICTS_URL,
      geonames: NAURU_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public district seed; boundary geometry is linked, not bundled.'],
  };
}

const NAURU_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  nauruPlace({
    name: 'Nauru',
    localNames: { en: 'Nauru', na: 'Naoero' },
    featureClass: 'country',
    adminPath: ['Nauru'],
    centroid: { lat: -0.5228, lon: 166.9315, precision: 'country' },
    geodataLinks: {
      geonames: NAURU_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q697',
    },
    notes: [
      'Country-level seed for the Republic of Nauru; public place metadata only.',
      'Nauru has 14 districts; this seed pack includes all of them as public district records.',
    ],
  }),
  nauruPlace({
    name: 'Aiwo',
    featureClass: 'district',
    adminPath: ['Nauru', 'Aiwo'],
    centroid: { lat: -0.534, lon: 166.913, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 01.'],
  }),
  nauruPlace({
    name: 'Anabar',
    featureClass: 'district',
    adminPath: ['Nauru', 'Anabar'],
    centroid: { lat: -0.505, lon: 166.953, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 02.'],
  }),
  nauruPlace({
    name: 'Anetan',
    featureClass: 'district',
    adminPath: ['Nauru', 'Anetan'],
    centroid: { lat: -0.506, lon: 166.943, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 03.'],
  }),
  nauruPlace({
    name: 'Anibare',
    featureClass: 'district',
    adminPath: ['Nauru', 'Anibare'],
    centroid: { lat: -0.533, lon: 166.948, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 04.'],
  }),
  nauruPlace({
    name: 'Baiti',
    localNames: { en: 'Baiti', na: 'Baiti', alias: 'Baitsi' },
    featureClass: 'district',
    adminPath: ['Nauru', 'Baiti'],
    centroid: { lat: -0.508, lon: 166.929, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 05; common English variant: Baitsi.'],
  }),
  nauruPlace({
    name: 'Boe',
    featureClass: 'district',
    adminPath: ['Nauru', 'Boe'],
    centroid: { lat: -0.539, lon: 166.914, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 06.'],
  }),
  nauruPlace({
    name: 'Buada',
    featureClass: 'district',
    adminPath: ['Nauru', 'Buada'],
    centroid: { lat: -0.532, lon: 166.925, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 07.'],
  }),
  nauruPlace({
    name: 'Denigomodu',
    featureClass: 'district',
    adminPath: ['Nauru', 'Denigomodu'],
    centroid: { lat: -0.5219, lon: 166.9163, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 08.'],
  }),
  nauruPlace({
    name: 'Ewa',
    featureClass: 'district',
    adminPath: ['Nauru', 'Ewa'],
    centroid: { lat: -0.503, lon: 166.937, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 09.'],
  }),
  nauruPlace({
    name: 'Ijuw',
    featureClass: 'district',
    adminPath: ['Nauru', 'Ijuw'],
    centroid: { lat: -0.521, lon: 166.9581, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 10.'],
  }),
  nauruPlace({
    name: 'Meneng',
    featureClass: 'district',
    adminPath: ['Nauru', 'Meneng'],
    centroid: { lat: -0.544, lon: 166.948, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 11.'],
  }),
  nauruPlace({
    name: 'Nibok',
    featureClass: 'district',
    adminPath: ['Nauru', 'Nibok'],
    centroid: { lat: -0.519, lon: 166.925, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 12.'],
  }),
  nauruPlace({
    name: 'Uaboe',
    featureClass: 'district',
    adminPath: ['Nauru', 'Uaboe'],
    centroid: { lat: -0.514, lon: 166.923, precision: 'settlement' },
    notes: ['Complete NR district seed; GeoNames administrative code: 13.'],
  }),
  nauruPlace({
    name: 'Yaren',
    featureClass: 'district',
    adminPath: ['Nauru', 'Yaren'],
    centroid: { lat: -0.547, lon: 166.92, precision: 'settlement' },
    notes: [
      'Complete NR district seed; GeoNames administrative code: 14.',
      'GeoNames country metadata lists Yaren District as capital; this pack keeps it as a district to avoid over-claiming constitutional capital status.',
    ],
  }),
];

function bruneiPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('BN', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, ms: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('BN'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('BN', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: BRUNEI_INFORMATION_DEPARTMENT_URL,
      geonames: BRUNEI_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public district seed; boundary geometry is linked, not bundled.'],
  };
}

const BRUNEI_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  bruneiPlace({
    name: 'Brunei Darussalam',
    localNames: { en: 'Brunei Darussalam', ms: 'Negara Brunei Darussalam' },
    featureClass: 'country',
    adminPath: ['Brunei Darussalam'],
    centroid: { lat: 4.5353, lon: 114.7277, precision: 'country' },
    geodataLinks: {
      geonames: BRUNEI_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q921',
    },
    notes: [
      'Country-level seed for Brunei Darussalam; public place metadata only.',
      'The complete first-level administrative slice has four districts.',
    ],
  }),
  bruneiPlace({
    name: 'Belait',
    featureClass: 'district',
    adminPath: ['Brunei Darussalam', 'Belait'],
    centroid: { lat: 4.45, lon: 114.4, precision: 'region' },
    notes: ['Complete BN district seed; GeoNames administrative code: 01; ISO 3166-2 subdivision code: BN-BE.'],
  }),
  bruneiPlace({
    name: 'Brunei-Muara',
    localNames: { en: 'Brunei-Muara', ms: 'Brunei dan Muara', geonames: 'Brunei and Muara' },
    featureClass: 'district',
    adminPath: ['Brunei Darussalam', 'Brunei-Muara'],
    centroid: { lat: 4.8895, lon: 114.9425, precision: 'region' },
    notes: [
      'Complete BN district seed; GeoNames administrative code: 02; ISO 3166-2 subdivision code: BN-BM.',
      'GeoNames lists this district as Brunei and Muara; the common English display label is Brunei-Muara.',
    ],
  }),
  bruneiPlace({
    name: 'Temburong',
    featureClass: 'district',
    adminPath: ['Brunei Darussalam', 'Temburong'],
    centroid: { lat: 4.6204, lon: 115.1415, precision: 'region' },
    notes: [
      'Complete BN district seed; GeoNames administrative code: 03; ISO 3166-2 subdivision code: BN-TE.',
      'Temburong is the eastern/exclave district separated from the western districts.',
    ],
  }),
  bruneiPlace({
    name: 'Tutong',
    featureClass: 'district',
    adminPath: ['Brunei Darussalam', 'Tutong'],
    centroid: { lat: 4.75, lon: 114.65, precision: 'region' },
    notes: ['Complete BN district seed; GeoNames administrative code: 04; ISO 3166-2 subdivision code: BN-TU.'],
  }),
];

function micronesiaPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('FM', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('FM'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('FM', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: MICRONESIA_GOVERNMENT_URL,
      geonames: MICRONESIA_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public state seed; boundary geometry is linked, not bundled.'],
  };
}

const MICRONESIA_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  micronesiaPlace({
    name: 'Federated States of Micronesia',
    localNames: { en: 'Federated States of Micronesia', alias: 'Micronesia' },
    featureClass: 'country',
    adminPath: ['Federated States of Micronesia'],
    centroid: { lat: 6.8875, lon: 158.2151, precision: 'country' },
    geodataLinks: {
      geonames: MICRONESIA_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q702',
    },
    notes: [
      'Country-level seed for the Federated States of Micronesia; public place metadata only.',
      'The complete first-level administrative slice has four states.',
    ],
  }),
  micronesiaPlace({
    name: 'Kosrae',
    featureClass: 'state',
    adminPath: ['Federated States of Micronesia', 'Kosrae'],
    centroid: { lat: 5.3096, lon: 162.9816, precision: 'region' },
    notes: ['Complete FM state seed; GeoNames administrative code: 01; ISO 3166-2 subdivision code: FM-KSA.'],
  }),
  micronesiaPlace({
    name: 'Pohnpei',
    featureClass: 'state',
    adminPath: ['Federated States of Micronesia', 'Pohnpei'],
    centroid: { lat: 6.8541, lon: 158.2624, precision: 'region' },
    notes: ['Complete FM state seed; GeoNames administrative code: 02; ISO 3166-2 subdivision code: FM-PNI.'],
  }),
  micronesiaPlace({
    name: 'Chuuk',
    localNames: { en: 'Chuuk', historical: 'Truk' },
    featureClass: 'state',
    adminPath: ['Federated States of Micronesia', 'Chuuk'],
    centroid: { lat: 7.4394, lon: 151.879, precision: 'region' },
    notes: [
      'Complete FM state seed; GeoNames administrative code: 03; ISO 3166-2 subdivision code: FM-TRK.',
      'Historical English label Truk is retained as an alias for search compatibility.',
    ],
  }),
  micronesiaPlace({
    name: 'Yap',
    featureClass: 'state',
    adminPath: ['Federated States of Micronesia', 'Yap'],
    centroid: { lat: 9.5391, lon: 138.1259, precision: 'region' },
    notes: ['Complete FM state seed; GeoNames administrative code: 04; ISO 3166-2 subdivision code: FM-YAP.'],
  }),
];

function luxembourgPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('LU', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, fr: input.name, lb: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('LU'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('LU', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: LUXEMBOURG_TERRITORY_URL,
      geonames: LUXEMBOURG_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public canton seed; boundary geometry is linked, not bundled.'],
  };
}

const LUXEMBOURG_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  luxembourgPlace({
    name: 'Luxembourg',
    localNames: { en: 'Luxembourg', fr: 'Luxembourg', de: 'Luxemburg', lb: 'Lëtzebuerg' },
    featureClass: 'country',
    adminPath: ['Luxembourg'],
    centroid: { lat: 49.8153, lon: 6.1296, precision: 'country' },
    geodataLinks: {
      geonames: LUXEMBOURG_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q32',
    },
    notes: [
      'Country-level seed for the Grand Duchy of Luxembourg; public place metadata only.',
      'The complete first-level territorial slice has 12 cantons.',
    ],
  }),
  luxembourgPlace({
    name: 'Capellen',
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Capellen'],
    centroid: { lat: 49.6368, lon: 5.9703, precision: 'region' },
    notes: ['Complete LU canton seed; GeoNames administrative code: 04; ISO 3166-2 subdivision code: LU-CA.'],
  }),
  luxembourgPlace({
    name: 'Clervaux',
    localNames: { en: 'Clervaux', fr: 'Clervaux', lb: 'Klierf' },
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Clervaux'],
    centroid: { lat: 50.0785, lon: 6.0224, precision: 'region' },
    notes: ['Complete LU canton seed; GeoNames administrative code: 05; ISO 3166-2 subdivision code: LU-CL.'],
  }),
  luxembourgPlace({
    name: 'Diekirch',
    localNames: { en: 'Diekirch', fr: 'Diekirch', lb: 'Dikrech' },
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Diekirch'],
    centroid: { lat: 49.8616, lon: 6.1475, precision: 'region' },
    notes: ['Complete LU canton seed; GeoNames administrative code: 06; ISO 3166-2 subdivision code: LU-DI.'],
  }),
  luxembourgPlace({
    name: 'Echternach',
    localNames: { en: 'Echternach', fr: 'Echternach', lb: 'Iechternach' },
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Echternach'],
    centroid: { lat: 49.7887, lon: 6.3902, precision: 'region' },
    notes: ['Complete LU canton seed; GeoNames administrative code: 07; ISO 3166-2 subdivision code: LU-EC.'],
  }),
  luxembourgPlace({
    name: 'Esch-sur-Alzette',
    localNames: { en: 'Esch-sur-Alzette', fr: 'Esch-sur-Alzette', lb: 'Esch-Uelzecht' },
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Esch-sur-Alzette'],
    centroid: { lat: 49.4939, lon: 5.9806, precision: 'region' },
    notes: ['Complete LU canton seed; GeoNames administrative code: 08; ISO 3166-2 subdivision code: LU-ES.'],
  }),
  luxembourgPlace({
    name: 'Grevenmacher',
    localNames: { en: 'Grevenmacher', fr: 'Grevenmacher', lb: 'Gréiwemaacher' },
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Grevenmacher'],
    centroid: { lat: 49.6808, lon: 6.4403, precision: 'region' },
    notes: ['Complete LU canton seed; GeoNames administrative code: 09; ISO 3166-2 subdivision code: LU-GR.'],
  }),
  luxembourgPlace({
    name: 'Luxembourg Canton',
    localNames: { en: 'Luxembourg Canton', fr: 'Canton de Luxembourg', lb: 'Kanton Lëtzebuerg' },
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Luxembourg Canton'],
    centroid: { lat: 49.6116, lon: 6.1319, precision: 'region' },
    notes: [
      'Complete LU canton seed; GeoNames administrative code: 10; ISO 3166-2 subdivision code: LU-LU.',
      'Display name is disambiguated from the country seed; official list labels the canton Luxembourg.',
    ],
  }),
  luxembourgPlace({
    name: 'Mersch',
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Mersch'],
    centroid: { lat: 49.7547, lon: 6.106, precision: 'region' },
    notes: ['Complete LU canton seed; GeoNames administrative code: 11; ISO 3166-2 subdivision code: LU-ME.'],
  }),
  luxembourgPlace({
    name: 'Redange-sur-Attert',
    localNames: { en: 'Redange-sur-Attert', fr: 'Redange-sur-Attert', lb: 'Réiden' },
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Redange-sur-Attert'],
    centroid: { lat: 49.765, lon: 5.89, precision: 'region' },
    notes: [
      'Complete LU canton seed; GeoNames administrative code: 12; ISO 3166-2 subdivision code: LU-RD.',
      'GeoNames lists Canton de Redange; Luxembourg.lu lists Redange-sur-Attert.',
    ],
  }),
  luxembourgPlace({
    name: 'Remich',
    localNames: { en: 'Remich', fr: 'Remich', lb: 'Réimech' },
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Remich'],
    centroid: { lat: 49.545, lon: 6.367, precision: 'region' },
    notes: ['Complete LU canton seed; GeoNames administrative code: 13; ISO 3166-2 subdivision code: LU-RM.'],
  }),
  luxembourgPlace({
    name: 'Vianden',
    localNames: { en: 'Vianden', fr: 'Vianden', lb: 'Veianen' },
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Vianden'],
    centroid: { lat: 49.935, lon: 6.203, precision: 'region' },
    notes: ['Complete LU canton seed; GeoNames administrative code: 14; ISO 3166-2 subdivision code: LU-VD.'],
  }),
  luxembourgPlace({
    name: 'Wiltz',
    localNames: { en: 'Wiltz', fr: 'Wiltz', lb: 'Wolz' },
    featureClass: 'canton',
    adminPath: ['Luxembourg', 'Wiltz'],
    centroid: { lat: 49.966, lon: 5.933, precision: 'region' },
    notes: ['Complete LU canton seed; GeoNames administrative code: 15; ISO 3166-2 subdivision code: LU-WI.'],
  }),
];

function newCaledoniaPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('NC', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, fr: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('NC'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('NC', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: NEW_CALEDONIA_PROVINCES_URL,
      geonames: NEW_CALEDONIA_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public province seed; boundary geometry is linked, not bundled.'],
  };
}

const NEW_CALEDONIA_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  newCaledoniaPlace({
    name: 'New Caledonia',
    localNames: { en: 'New Caledonia', fr: 'Nouvelle-Calédonie' },
    featureClass: 'country',
    adminPath: ['New Caledonia'],
    centroid: { lat: -20.9043, lon: 165.618, precision: 'country' },
    geodataLinks: {
      geonames: NEW_CALEDONIA_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q33788',
    },
    notes: [
      'Country-level seed for New Caledonia; public place metadata only.',
      'The complete first-level administrative slice has three provinces.',
    ],
  }),
  newCaledoniaPlace({
    name: 'Loyalty Islands Province',
    localNames: { en: 'Loyalty Islands Province', fr: 'Province des îles Loyauté', geonames: 'Iles Loyaute' },
    featureClass: 'province',
    adminPath: ['New Caledonia', 'Loyalty Islands Province'],
    centroid: { lat: -21.066, lon: 167.35, precision: 'region' },
    notes: [
      'Complete NC province seed; GeoNames administrative code: 03; GeoNames subentity code: L.',
      'ISO 3166-2:NC currently defines no official subdivision codes, so this pack records GeoNames subentity codes instead.',
    ],
  }),
  newCaledoniaPlace({
    name: 'North Province',
    localNames: { en: 'North Province', fr: 'Province Nord', geonames: 'Nord' },
    featureClass: 'province',
    adminPath: ['New Caledonia', 'North Province'],
    centroid: { lat: -20.9, lon: 164.75, precision: 'region' },
    notes: [
      'Complete NC province seed; GeoNames administrative code: 01; GeoNames subentity code: N.',
      'ISO 3166-2:NC currently defines no official subdivision codes, so this pack records GeoNames subentity codes instead.',
    ],
  }),
  newCaledoniaPlace({
    name: 'South Province',
    localNames: { en: 'South Province', fr: 'Province Sud', geonames: 'Sud' },
    featureClass: 'province',
    adminPath: ['New Caledonia', 'South Province'],
    centroid: { lat: -22.25, lon: 166.45, precision: 'region' },
    notes: [
      'Complete NC province seed; GeoNames administrative code: 02; GeoNames subentity code: S.',
      'ISO 3166-2:NC currently defines no official subdivision codes, so this pack records GeoNames subentity codes instead.',
    ],
  }),
];

function wallisFutunaPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('WF', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, fr: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('WF'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('WF', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: WALLIS_FUTUNA_INSTITUTIONAL_URL,
      geonames: WALLIS_FUTUNA_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public chiefdom seed; boundary geometry is linked, not bundled.'],
  };
}

const WALLIS_FUTUNA_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  wallisFutunaPlace({
    name: 'Wallis and Futuna',
    localNames: { en: 'Wallis and Futuna', fr: 'Wallis-et-Futuna' },
    featureClass: 'country',
    adminPath: ['Wallis and Futuna'],
    centroid: { lat: -13.7688, lon: -177.1561, precision: 'country' },
    geodataLinks: {
      geonames: WALLIS_FUTUNA_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q35555',
    },
    notes: [
      'Country-level seed for Wallis and Futuna; public place metadata only.',
      'The complete customary subdivision slice has three chiefdoms/customary kingdoms.',
    ],
  }),
  wallisFutunaPlace({
    name: 'Alo',
    localNames: { en: 'Alo', fr: 'Alo' },
    featureClass: 'chiefdom',
    adminPath: ['Wallis and Futuna', 'Alo'],
    centroid: { lat: -14.304, lon: -178.08, precision: 'region' },
    notes: [
      'Complete WF chiefdom seed; GeoNames administrative code: 98611; GeoNames subentity code: AL.',
      'Alo covers the eastern part of Futuna and the island of Alofi.',
    ],
  }),
  wallisFutunaPlace({
    name: 'Sigave',
    localNames: { en: 'Sigave', fr: 'Sigave', geonames: 'Sigavé' },
    featureClass: 'chiefdom',
    adminPath: ['Wallis and Futuna', 'Sigave'],
    centroid: { lat: -14.28, lon: -178.15, precision: 'region' },
    notes: [
      'Complete WF chiefdom seed; GeoNames administrative code: 98612; GeoNames subentity code: SG.',
      'Sigave covers the western part of Futuna.',
    ],
  }),
  wallisFutunaPlace({
    name: 'Uvea',
    localNames: { en: 'Uvea', fr: 'Uvea', wls: 'ʻUvea', geonames: 'ʻUvea' },
    featureClass: 'chiefdom',
    adminPath: ['Wallis and Futuna', 'Uvea'],
    centroid: { lat: -13.2825, lon: -176.1761, precision: 'region' },
    notes: [
      'Complete WF chiefdom seed; GeoNames administrative code: 98613; GeoNames subentity code: UV.',
      'Uvea covers Wallis Island and is further divided into customary districts.',
    ],
  }),
];

function pitcairnPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('PN', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('PN'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('PN', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: PITCAIRN_GOVERNMENT_URL,
      geonames: PITCAIRN_GEONAMES_COUNTRY_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public Pitcairn Islands place seed; boundary geometry is linked, not bundled.'],
  };
}

const PITCAIRN_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  pitcairnPlace({
    name: 'Pitcairn Islands',
    localNames: {
      en: 'Pitcairn Islands',
      official: 'Pitcairn, Henderson, Ducie and Oeno Islands',
      pih: 'Pitkern Ailen',
    },
    featureClass: 'country',
    adminPath: ['Pitcairn Islands'],
    centroid: { lat: -24.3768, lon: -128.3242, precision: 'country' },
    geodataLinks: {
      wikidata: 'https://www.wikidata.org/wiki/Q35672',
    },
    notes: [
      'Country-level seed for Pitcairn, Henderson, Ducie and Oeno Islands; public place metadata only.',
      'The complete island slice has four islands: Pitcairn, Henderson, Ducie, and Oeno.',
      'No administrative division code claimed; Pitcairn has no known administrative divisions in this pack.',
    ],
  }),
  pitcairnPlace({
    name: 'Pitcairn Island',
    localNames: { en: 'Pitcairn Island', pih: 'Pitkern Ailen' },
    featureClass: 'island',
    adminPath: ['Pitcairn Islands', 'Pitcairn Island'],
    centroid: { lat: -25.066, lon: -130.101, precision: 'region' },
    notes: [
      'Complete PN island seed; official island group member.',
      'Pitcairn Island is the only inhabited island in the group.',
      'No administrative division code claimed.',
    ],
  }),
  pitcairnPlace({
    name: 'Henderson Island',
    featureClass: 'island',
    adminPath: ['Pitcairn Islands', 'Henderson Island'],
    centroid: { lat: -24.365, lon: -128.313, precision: 'region' },
    notes: [
      'Complete PN island seed; official island group member.',
      'No administrative division code claimed.',
    ],
  }),
  pitcairnPlace({
    name: 'Ducie Island',
    featureClass: 'island',
    adminPath: ['Pitcairn Islands', 'Ducie Island'],
    centroid: { lat: -24.667, lon: -124.783, precision: 'region' },
    notes: [
      'Complete PN island seed; official island group member.',
      'No administrative division code claimed.',
    ],
  }),
  pitcairnPlace({
    name: 'Oeno Island',
    featureClass: 'island',
    adminPath: ['Pitcairn Islands', 'Oeno Island'],
    centroid: { lat: -23.917, lon: -130.733, precision: 'region' },
    notes: [
      'Complete PN island seed; official island group member.',
      'No administrative division code claimed.',
    ],
  }),
  pitcairnPlace({
    name: 'Adamstown',
    featureClass: 'capital',
    adminPath: ['Pitcairn Islands', 'Pitcairn Island', 'Adamstown'],
    centroid: { lat: -25.0667, lon: -130.1, precision: 'settlement' },
    notes: [
      'Complete PN capital seed; GeoNames country metadata lists Adamstown as capital.',
      'Only permanent settlement seed included for lookup and conformance tests.',
      'No raw resident, recipient, building, or unit data is bundled.',
    ],
  }),
];

function faroePlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('FO', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, fo: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('FO'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('FO', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: FAROE_GOVERNMENT_URL,
      geonames: FAROE_GEONAMES_COUNTRY_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public Faroe Islands place seed; boundary geometry is linked, not bundled.'],
  };
}

const FAROE_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  faroePlace({
    name: 'Faroe Islands',
    localNames: { en: 'Faroe Islands', fo: 'Føroyar', da: 'Færøerne' },
    featureClass: 'country',
    adminPath: ['Faroe Islands'],
    centroid: { lat: 62.0, lon: -6.8, precision: 'country' },
    geodataLinks: {
      official: FAROE_OFFICIAL_SITE_URL,
      geonames: FAROE_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q4628',
    },
    notes: [
      'Country-level seed for the Faroe Islands; public place metadata only.',
      'The complete main-island slice has 18 islands; smaller islets and skerries are intentionally excluded from this gate.',
    ],
  }),
  faroePlace({
    name: 'Streymoy',
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Streymoy'],
    centroid: { lat: 62.12, lon: -6.94, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Eysturoy',
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Eysturoy'],
    centroid: { lat: 62.22, lon: -6.87, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Vágar',
    localNames: { en: 'Vágar', fo: 'Vágar', da: 'Vågø' },
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Vágar'],
    centroid: { lat: 62.08, lon: -7.28, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Suðuroy',
    localNames: { en: 'Suðuroy', fo: 'Suðuroy', da: 'Suderø' },
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Suðuroy'],
    centroid: { lat: 61.55, lon: -6.85, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Sandoy',
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Sandoy'],
    centroid: { lat: 61.84, lon: -6.82, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Borðoy',
    localNames: { en: 'Borðoy', fo: 'Borðoy', da: 'Bordø' },
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Borðoy'],
    centroid: { lat: 62.23, lon: -6.55, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Viðoy',
    localNames: { en: 'Viðoy', fo: 'Viðoy', da: 'Vidø' },
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Viðoy'],
    centroid: { lat: 62.33, lon: -6.54, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Kunoy',
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Kunoy'],
    centroid: { lat: 62.29, lon: -6.67, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Kalsoy',
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Kalsoy'],
    centroid: { lat: 62.27, lon: -6.75, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Svínoy',
    localNames: { en: 'Svínoy', fo: 'Svínoy', da: 'Svinø' },
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Svínoy'],
    centroid: { lat: 62.28, lon: -6.35, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Fugloy',
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Fugloy'],
    centroid: { lat: 62.33, lon: -6.31, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Nólsoy',
    localNames: { en: 'Nólsoy', fo: 'Nólsoy', da: 'Nolsø' },
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Nólsoy'],
    centroid: { lat: 62.01, lon: -6.67, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Mykines',
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Mykines'],
    centroid: { lat: 62.1, lon: -7.62, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Skúvoy',
    localNames: { en: 'Skúvoy', fo: 'Skúgvoy', geonames: 'Skuvoy' },
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Skúvoy'],
    centroid: { lat: 61.77, lon: -6.8, precision: 'region' },
    notes: ['Complete FO main-island seed; Statistics Faroe Islands also renders this island as Skúgvoy.'],
  }),
  faroePlace({
    name: 'Hestur',
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Hestur'],
    centroid: { lat: 61.96, lon: -6.89, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Stóra Dímun',
    localNames: { en: 'Stóra Dímun', fo: 'Stóra Dímun', da: 'Store Dimon' },
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Stóra Dímun'],
    centroid: { lat: 61.69, lon: -6.75, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Koltur',
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Koltur'],
    centroid: { lat: 61.99, lon: -6.96, precision: 'region' },
    notes: ['Complete FO main-island seed; listed by Statistics Faroe Islands island area data.'],
  }),
  faroePlace({
    name: 'Lítla Dímun',
    localNames: { en: 'Lítla Dímun', fo: 'Lítla Dímun', da: 'Lille Dimon' },
    featureClass: 'island',
    adminPath: ['Faroe Islands', 'Lítla Dímun'],
    centroid: { lat: 61.64, lon: -6.7, precision: 'region' },
    notes: [
      'Complete FO main-island seed; listed by Statistics Faroe Islands island area data.',
      'Lítla Dímun is the uninhabited island in the 18-island coverage gate.',
    ],
  }),
  faroePlace({
    name: 'Tórshavn',
    localNames: { en: 'Tórshavn', fo: 'Tórshavn', da: 'Thorshavn' },
    featureClass: 'capital',
    adminPath: ['Faroe Islands', 'Streymoy', 'Tórshavn'],
    centroid: { lat: 62.01, lon: -6.77, precision: 'settlement' },
    notes: [
      'Complete FO capital seed; GeoNames country metadata lists Tórshavn as capital.',
      'No raw resident, recipient, building, or unit data is bundled.',
    ],
  }),
];

function marshallPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('MH', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, mh: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('MH'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('MH', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: MARSHALL_CONSTITUTION_URL,
      geonames: MARSHALL_GEONAMES_COUNTRY_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public Marshall Islands municipality/electoral district seed; boundary geometry is linked, not bundled.'],
  };
}

function marshallAtollIslandAnchor(input: {
  name: string;
  district: string;
  chain: 'Ralik Chain' | 'Ratak Chain';
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  localNames?: Record<string, string>;
  notes?: string[];
}): GazetteerPlaceSeed {
  return marshallPlace({
    name: input.name,
    localNames: input.localNames,
    featureClass: 'island',
    adminPath: ['Marshall Islands', input.chain, input.district, input.name],
    centroid: input.centroid,
    geodataLinks: {
      official: MARSHALL_CONSTITUTION_URL,
      geonames: MARSHALL_GEONAMES_ADMIN_URL,
    },
    notes: input.notes ?? [
      'MH atoll/island anchor seed; splits a constitutional district into public atoll/island reference without creating a standalone municipality.',
      'Coverage mode: base atoll/island anchor layer, not complete all-islet coverage.',
      'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
    ],
  });
}

const MARSHALL_ATOLL_ISLAND_ANCHOR_SEEDS: GazetteerPlaceSeed[] = [
  marshallAtollIslandAnchor({ name: 'Ailinglaplap Atoll', district: 'Ailinglaplap', chain: 'Ralik Chain', centroid: { lat: 7.4, lon: 168.75, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Ailuk Atoll', district: 'Ailuk', chain: 'Ratak Chain', centroid: { lat: 10.3, lon: 169.97, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Arno Atoll', district: 'Arno', chain: 'Ratak Chain', centroid: { lat: 7.08, lon: 171.55, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Aur Atoll', district: 'Aur', chain: 'Ratak Chain', centroid: { lat: 8.15, lon: 171.17, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Ailinginae Atoll', district: 'Rongelap', chain: 'Ralik Chain', centroid: { lat: 11.17, lon: 166.35, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Ailinginae is an associated uninhabited public atoll anchor linked to the Rongelap constitutional district by customary/administrative association.',
    'Coverage mode: expanded associated atoll/island anchor layer, not complete all-islet coverage.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Bikini Atoll', district: 'Bikini and Kili', chain: 'Ralik Chain', centroid: { lat: 11.6, lon: 165.4, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Bikini is a public atoll anchor inside the combined Bikini and Kili constitutional district.',
    'The municipality/electoral district remains combined; this anchor does not split governance, voting, or delivery responsibility.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Kili Island', district: 'Bikini and Kili', chain: 'Ralik Chain', centroid: { lat: 5.65, lon: 169.12, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Kili is a public island anchor inside the combined Bikini and Kili constitutional district.',
    'The municipality/electoral district remains combined; this anchor does not split governance, voting, or delivery responsibility.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Bikar Atoll', district: 'Utrik', chain: 'Ratak Chain', centroid: { lat: 12.23, lon: 170.13, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Bikar is an associated uninhabited public atoll anchor linked to the Utrik constitutional district by customary/administrative association.',
    'Coverage mode: expanded associated atoll/island anchor layer, not complete all-islet coverage.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Bokak Atoll', localNames: { en: 'Bokak Atoll', alternate: 'Taongi Atoll', mh: 'Bokak Atoll' }, district: 'Utrik', chain: 'Ratak Chain', centroid: { lat: 14.53, lon: 169.0, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Bokak/Taongi is an associated uninhabited public atoll anchor linked to the Utrik constitutional district by customary/administrative association.',
    'Coverage mode: expanded associated atoll/island anchor layer, not complete all-islet coverage.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Ebon Atoll', district: 'Ebon', chain: 'Ralik Chain', centroid: { lat: 4.6, lon: 168.7, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Enewetak Atoll', district: 'Enewetak and Ujelang', chain: 'Ralik Chain', centroid: { lat: 11.35, lon: 162.33, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Enewetak is a public atoll anchor inside the combined Enewetak and Ujelang constitutional district.',
    'The municipality/electoral district remains combined; this anchor does not split governance, voting, or delivery responsibility.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Ujelang Atoll', district: 'Enewetak and Ujelang', chain: 'Ralik Chain', centroid: { lat: 9.77, lon: 160.98, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Ujelang is a public atoll anchor inside the combined Enewetak and Ujelang constitutional district.',
    'The municipality/electoral district remains combined; this anchor does not split governance, voting, or delivery responsibility.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Erikub Atoll', localNames: { en: 'Erikub Atoll', mh: 'Ādkup Atoll' }, district: 'Wotje', chain: 'Ratak Chain', centroid: { lat: 9.14, lon: 170.0, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Erikub is an associated uninhabited public atoll anchor linked to the Wotje constitutional district by customary/administrative association.',
    'Coverage mode: expanded associated atoll/island anchor layer, not complete all-islet coverage.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Jabat Island', district: 'Jabat', chain: 'Ralik Chain', centroid: { lat: 7.75, lon: 168.98, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Jaluit Atoll', district: 'Jaluit', chain: 'Ralik Chain', centroid: { lat: 5.92, lon: 169.64, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Jemo Island', district: 'Likiep', chain: 'Ratak Chain', centroid: { lat: 10.08, lon: 169.52, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Jemo is an associated uninhabited public island anchor linked to the Likiep constitutional district by customary/administrative association.',
    'Coverage mode: expanded associated atoll/island anchor layer, not complete all-islet coverage.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Kwajalein Atoll', district: 'Kwajalein', chain: 'Ralik Chain', centroid: { lat: 8.72, lon: 167.73, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Lae Atoll', district: 'Lae', chain: 'Ralik Chain', centroid: { lat: 8.93, lon: 166.25, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Lib Island', district: 'Lib', chain: 'Ralik Chain', centroid: { lat: 8.31, lon: 167.38, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Likiep Atoll', district: 'Likiep', chain: 'Ratak Chain', centroid: { lat: 9.83, lon: 169.31, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Majuro Atoll', district: 'Majuro', chain: 'Ratak Chain', centroid: { lat: 7.1, lon: 171.38, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Maloelap Atoll', district: 'Maloelap', chain: 'Ratak Chain', centroid: { lat: 8.75, lon: 171.07, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Mejit Island', district: 'Mejit', chain: 'Ratak Chain', centroid: { lat: 10.28, lon: 170.87, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Mili Atoll', district: 'Mili', chain: 'Ratak Chain', centroid: { lat: 6.08, lon: 171.73, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Nadikdik Atoll', localNames: { en: 'Nadikdik Atoll', alternate: 'Narikrik Atoll; Knox Atoll', mh: 'Ņadikdik Atoll' }, district: 'Mili', chain: 'Ratak Chain', centroid: { lat: 5.9, lon: 172.17, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Nadikdik/Narikrik is an associated public atoll anchor linked to the Mili constitutional district by nearest/customary administrative association.',
    'Coverage mode: expanded associated atoll/island anchor layer, not complete all-islet coverage.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Namdrik Atoll', localNames: { en: 'Namdrik Atoll', alternate: 'Namorik Atoll' }, district: 'Namdrik', chain: 'Ralik Chain', centroid: { lat: 5.6, lon: 168.1, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Namu Atoll', district: 'Namu', chain: 'Ralik Chain', centroid: { lat: 7.98, lon: 168.17, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Rongerik Atoll', localNames: { en: 'Rongerik Atoll', alternate: 'Rongrik Atoll' }, district: 'Rongelap', chain: 'Ralik Chain', centroid: { lat: 11.35, lon: 167.47, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Rongerik/Rongrik is an associated uninhabited public atoll anchor linked to the Rongelap constitutional district by customary/administrative association.',
    'Coverage mode: expanded associated atoll/island anchor layer, not complete all-islet coverage.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Rongelap Atoll', district: 'Rongelap', chain: 'Ralik Chain', centroid: { lat: 11.16, lon: 166.89, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Taka Atoll', localNames: { en: 'Taka Atoll', alternate: 'Toke Atoll' }, district: 'Utrik', chain: 'Ratak Chain', centroid: { lat: 11.14, lon: 169.62, precision: 'region' }, notes: [
    'MH atoll/island anchor seed; Taka/Toke is an associated uninhabited public atoll anchor linked to the Utrik constitutional district by customary/administrative association.',
    'Coverage mode: expanded associated atoll/island anchor layer, not complete all-islet coverage.',
    'No legal boundary, access, delivery, population, route, or private-coordinate claim is bundled.',
  ] }),
  marshallAtollIslandAnchor({ name: 'Ujae Atoll', district: 'Ujae', chain: 'Ralik Chain', centroid: { lat: 8.93, lon: 165.74, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Utrik Atoll', localNames: { en: 'Utrik Atoll', alternate: 'Utirik Atoll' }, district: 'Utrik', chain: 'Ratak Chain', centroid: { lat: 11.23, lon: 169.85, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Wotho Atoll', district: 'Wotho', chain: 'Ralik Chain', centroid: { lat: 10.17, lon: 166.0, precision: 'region' } }),
  marshallAtollIslandAnchor({ name: 'Wotje Atoll', district: 'Wotje', chain: 'Ratak Chain', centroid: { lat: 9.45, lon: 170.24, precision: 'region' } }),
];

const MARSHALL_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  marshallPlace({
    name: 'Marshall Islands',
    localNames: { en: 'Marshall Islands', mh: 'Aelōn̄ in M̧ajeļ', official: 'Republic of the Marshall Islands' },
    featureClass: 'country',
    adminPath: ['Marshall Islands'],
    centroid: { lat: 7.1315, lon: 171.1845, precision: 'country' },
    geodataLinks: {
      geonames: MARSHALL_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q709',
    },
    notes: [
      'Country-level seed for the Republic of the Marshall Islands; public place metadata only.',
      'The complete constitutional electoral district slice has 24 districts.',
      'Uninhabited atolls assigned by constitutional association are not split into standalone municipality seeds in this gate.',
    ],
  }),
  marshallPlace({
    name: 'Ailinglaplap',
    localNames: { en: 'Ailinglaplap', mh: 'Aelōn̄ļapļap' },
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Ailinglaplap'],
    centroid: { lat: 7.4, lon: 168.75, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Ailinglaplap; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Ailuk',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ratak Chain', 'Ailuk'],
    centroid: { lat: 10.3, lon: 169.97, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Ailuk; chain: Ratak.'],
  }),
  marshallPlace({
    name: 'Arno',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ratak Chain', 'Arno'],
    centroid: { lat: 7.08, lon: 171.55, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Arno; chain: Ratak.'],
  }),
  marshallPlace({
    name: 'Aur',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ratak Chain', 'Aur'],
    centroid: { lat: 8.15, lon: 171.17, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Aur; chain: Ratak.'],
  }),
  marshallPlace({
    name: 'Bikini and Kili',
    localNames: { en: 'Bikini and Kili', constitutional: 'Bikini & Kili', alternate: 'Kili/Bikini/Ejit' },
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Bikini and Kili'],
    centroid: { lat: 8.62, lon: 167.26, precision: 'region' },
    notes: [
      'Complete MH municipality seed; Constitutional electoral district: Bikini & Kili; chain: Ralik.',
      'Coarse centroid represents a non-contiguous political grouping and is not a routing point.',
    ],
  }),
  marshallPlace({
    name: 'Ebon',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Ebon'],
    centroid: { lat: 4.6, lon: 168.7, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Ebon; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Enewetak and Ujelang',
    localNames: { en: 'Enewetak and Ujelang', constitutional: 'Enewetak & Ujelang' },
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Enewetak and Ujelang'],
    centroid: { lat: 10.6, lon: 161.6, precision: 'region' },
    notes: [
      'Complete MH municipality seed; Constitutional electoral district: Enewetak & Ujelang; chain: Ralik.',
      'Coarse centroid represents a non-contiguous political grouping and is not a routing point.',
    ],
  }),
  marshallPlace({
    name: 'Jabat',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Jabat'],
    centroid: { lat: 7.75, lon: 168.98, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Jabat; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Jaluit',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Jaluit'],
    centroid: { lat: 5.92, lon: 169.64, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Jaluit; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Kwajalein',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Kwajalein'],
    centroid: { lat: 8.72, lon: 167.73, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Kwajalein; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Lae',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Lae'],
    centroid: { lat: 8.93, lon: 166.25, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Lae; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Lib',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Lib'],
    centroid: { lat: 8.31, lon: 167.38, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Lib; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Likiep',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ratak Chain', 'Likiep'],
    centroid: { lat: 9.83, lon: 169.31, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Likiep; chain: Ratak.'],
  }),
  marshallPlace({
    name: 'Majuro',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ratak Chain', 'Majuro'],
    centroid: { lat: 7.1, lon: 171.38, precision: 'region' },
    notes: [
      'Complete MH municipality seed; Constitutional electoral district: Majuro; chain: Ratak.',
      'Majuro is also the national capital atoll in the GeoNames country metadata.',
    ],
  }),
  marshallPlace({
    name: 'Maloelap',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ratak Chain', 'Maloelap'],
    centroid: { lat: 8.75, lon: 171.07, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Maloelap; chain: Ratak.'],
  }),
  marshallPlace({
    name: 'Mejit',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ratak Chain', 'Mejit'],
    centroid: { lat: 10.28, lon: 170.87, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Mejit; chain: Ratak.'],
  }),
  marshallPlace({
    name: 'Mili',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ratak Chain', 'Mili'],
    centroid: { lat: 6.08, lon: 171.73, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Mili; chain: Ratak.'],
  }),
  marshallPlace({
    name: 'Namdrik',
    localNames: { en: 'Namdrik', alternate: 'Namorik' },
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Namdrik'],
    centroid: { lat: 5.6, lon: 168.1, precision: 'region' },
    notes: [
      'Complete MH municipality seed; Constitutional electoral district: Namdrik; chain: Ralik.',
      'Statoids renders this district as Namorik; this pack keeps the constitutional spelling as canonical.',
    ],
  }),
  marshallPlace({
    name: 'Namu',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Namu'],
    centroid: { lat: 7.98, lon: 168.17, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Namu; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Rongelap',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Rongelap'],
    centroid: { lat: 11.16, lon: 166.89, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Rongelap; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Ujae',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Ujae'],
    centroid: { lat: 8.93, lon: 165.74, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Ujae; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Utrik',
    localNames: { en: 'Utrik', alternate: 'Utirik' },
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ratak Chain', 'Utrik'],
    centroid: { lat: 11.23, lon: 169.85, precision: 'region' },
    notes: [
      'Complete MH municipality seed; Constitutional electoral district: Utrik; chain: Ratak.',
      'Utirik is retained as an alternate spelling.',
    ],
  }),
  marshallPlace({
    name: 'Wotho',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ralik Chain', 'Wotho'],
    centroid: { lat: 10.17, lon: 166.0, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Wotho; chain: Ralik.'],
  }),
  marshallPlace({
    name: 'Wotje',
    featureClass: 'municipality',
    adminPath: ['Marshall Islands', 'Ratak Chain', 'Wotje'],
    centroid: { lat: 9.45, lon: 170.24, precision: 'region' },
    notes: ['Complete MH municipality seed; Constitutional electoral district: Wotje; chain: Ratak.'],
  }),
  ...MARSHALL_ATOLL_ISLAND_ANCHOR_SEEDS,
];

function malaysiaPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('MY', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, ms: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('MY'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('MY', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: MALAYSIA_MYGEO_UPI_URL,
      geonames: MALAYSIA_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public Malaysia first-order division seed; boundary geometry is linked, not bundled.'],
  };
}

const MALAYSIA_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  malaysiaPlace({
    name: 'Malaysia',
    localNames: { en: 'Malaysia', ms: 'Malaysia' },
    featureClass: 'country',
    adminPath: ['Malaysia'],
    centroid: { lat: 4.2105, lon: 101.9758, precision: 'country' },
    geodataLinks: {
      official: MALAYSIA_MYGOV_FLAG_URL,
      geonames: MALAYSIA_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q833',
    },
    notes: [
      'Country-level seed for Malaysia; public place metadata only.',
      'The complete first-order slice has 13 states and 3 federal territories.',
      'This pack records first-order division names only; district, mukim, parcel, building, and recipient data are excluded.',
    ],
  }),
  malaysiaPlace({
    name: 'Johor',
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Johor'],
    centroid: { lat: 2.0, lon: 103.5, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-01.',
      'GeoNames administrative code: 01.',
    ],
  }),
  malaysiaPlace({
    name: 'Kedah',
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Kedah'],
    centroid: { lat: 6.12, lon: 100.37, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-02.',
      'GeoNames administrative code: 02.',
    ],
  }),
  malaysiaPlace({
    name: 'Kelantan',
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Kelantan'],
    centroid: { lat: 5.25, lon: 102.0, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-03.',
      'GeoNames administrative code: 03.',
    ],
  }),
  malaysiaPlace({
    name: 'Melaka',
    localNames: { en: 'Melaka', ms: 'Melaka', alternate: 'Malacca' },
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Melaka'],
    centroid: { lat: 2.2, lon: 102.25, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-04.',
      'GeoNames administrative code: 04.',
      'Malacca is retained as an alternate English spelling.',
    ],
  }),
  malaysiaPlace({
    name: 'Negeri Sembilan',
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Negeri Sembilan'],
    centroid: { lat: 2.72, lon: 102.15, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-05.',
      'GeoNames administrative code: 05.',
    ],
  }),
  malaysiaPlace({
    name: 'Pahang',
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Pahang'],
    centroid: { lat: 3.97, lon: 102.44, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-06.',
      'GeoNames administrative code: 06.',
    ],
  }),
  malaysiaPlace({
    name: 'Perak',
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Perak'],
    centroid: { lat: 4.6, lon: 101.1, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-08.',
      'GeoNames administrative code: 08.',
    ],
  }),
  malaysiaPlace({
    name: 'Perlis',
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Perlis'],
    centroid: { lat: 6.44, lon: 100.2, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-09.',
      'GeoNames administrative code: 09.',
    ],
  }),
  malaysiaPlace({
    name: 'Pulau Pinang',
    localNames: { en: 'Pulau Pinang', ms: 'Pulau Pinang', alternate: 'Penang', geonames: 'Pinang' },
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Pulau Pinang'],
    centroid: { lat: 5.41, lon: 100.33, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-07.',
      'GeoNames administrative code: 07.',
      'Penang and Pinang are retained as alternate spellings.',
    ],
  }),
  malaysiaPlace({
    name: 'Sabah',
    featureClass: 'state',
    adminPath: ['Malaysia', 'East Malaysia', 'Sabah'],
    centroid: { lat: 5.98, lon: 116.08, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-12.',
      'GeoNames administrative code: 12.',
    ],
  }),
  malaysiaPlace({
    name: 'Sarawak',
    featureClass: 'state',
    adminPath: ['Malaysia', 'East Malaysia', 'Sarawak'],
    centroid: { lat: 2.5, lon: 113.0, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-13.',
      'GeoNames administrative code: 13.',
    ],
  }),
  malaysiaPlace({
    name: 'Selangor',
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Selangor'],
    centroid: { lat: 3.07, lon: 101.52, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-10.',
      'GeoNames administrative code: 10.',
    ],
  }),
  malaysiaPlace({
    name: 'Terengganu',
    featureClass: 'state',
    adminPath: ['Malaysia', 'Peninsular Malaysia', 'Terengganu'],
    centroid: { lat: 5.31, lon: 103.14, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: state.',
      'ISO 3166-2 subdivision code: MY-11.',
      'GeoNames administrative code: 11.',
    ],
  }),
  malaysiaPlace({
    name: 'Kuala Lumpur',
    localNames: { en: 'Kuala Lumpur', ms: 'Wilayah Persekutuan Kuala Lumpur' },
    featureClass: 'special-region',
    adminPath: ['Malaysia', 'Federal Territories', 'Kuala Lumpur'],
    centroid: { lat: 3.139, lon: 101.6869, precision: 'city' },
    notes: [
      'Complete MY first-order seed; first-order type: federal territory.',
      'ISO 3166-2 subdivision code: MY-14.',
      'GeoNames administrative code: 14.',
      'Kuala Lumpur is the national capital in GeoNames country metadata.',
    ],
  }),
  malaysiaPlace({
    name: 'Labuan',
    localNames: { en: 'Labuan', ms: 'Wilayah Persekutuan Labuan' },
    featureClass: 'special-region',
    adminPath: ['Malaysia', 'Federal Territories', 'Labuan'],
    centroid: { lat: 5.28, lon: 115.24, precision: 'region' },
    notes: [
      'Complete MY first-order seed; first-order type: federal territory.',
      'ISO 3166-2 subdivision code: MY-15.',
      'GeoNames administrative code: 15.',
    ],
  }),
  malaysiaPlace({
    name: 'Putrajaya',
    localNames: { en: 'Putrajaya', ms: 'Wilayah Persekutuan Putrajaya' },
    featureClass: 'special-region',
    adminPath: ['Malaysia', 'Federal Territories', 'Putrajaya'],
    centroid: { lat: 2.9264, lon: 101.6964, precision: 'city' },
    notes: [
      'Complete MY first-order seed; first-order type: federal territory.',
      'ISO 3166-2 subdivision code: MY-16.',
      'GeoNames administrative code: 16.',
    ],
  }),
];

function netherlandsPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('NL', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, nl: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('NL'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('NL', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: NETHERLANDS_GOV_PROVINCES_URL,
      geonames: NETHERLANDS_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public Netherlands province/public-body seed; boundary geometry is linked, not bundled.'],
  };
}

const NETHERLANDS_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  netherlandsPlace({
    name: 'Netherlands',
    localNames: { en: 'Netherlands', nl: 'Nederland', official: 'Kingdom of the Netherlands country of the Netherlands' },
    featureClass: 'country',
    adminPath: ['Netherlands'],
    centroid: { lat: 52.1326, lon: 5.2913, precision: 'country' },
    geodataLinks: {
      official: NETHERLANDS_GOV_PROVINCES_URL,
      geonames: NETHERLANDS_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q55',
    },
    notes: [
      'Country-level seed for the Netherlands; public place metadata only.',
      'The complete NL slice has 12 European provinces, 3 Caribbean public bodies, and the Amsterdam capital seed.',
      'Bonaire, Sint Eustatius, and Saba are public bodies of the Netherlands and are not part of a Dutch province.',
    ],
  }),
  netherlandsPlace({
    name: 'Drenthe',
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Drenthe'],
    centroid: { lat: 52.95, lon: 6.62, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-DR.',
      'GeoNames administrative code: 01.',
    ],
  }),
  netherlandsPlace({
    name: 'Flevoland',
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Flevoland'],
    centroid: { lat: 52.52, lon: 5.47, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-FL.',
      'GeoNames administrative code: 16.',
    ],
  }),
  netherlandsPlace({
    name: 'Friesland',
    localNames: { en: 'Friesland', nl: 'Friesland', fy: 'Fryslân' },
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Friesland'],
    centroid: { lat: 53.16, lon: 5.78, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-FR.',
      'GeoNames administrative code: 02.',
      'Fryslân is retained as the Frisian name.',
    ],
  }),
  netherlandsPlace({
    name: 'Gelderland',
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Gelderland'],
    centroid: { lat: 52.05, lon: 5.87, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-GE.',
      'GeoNames administrative code: 03.',
    ],
  }),
  netherlandsPlace({
    name: 'Groningen',
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Groningen'],
    centroid: { lat: 53.22, lon: 6.57, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-GR.',
      'GeoNames administrative code: 04.',
    ],
  }),
  netherlandsPlace({
    name: 'Limburg',
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Limburg'],
    centroid: { lat: 51.25, lon: 5.9, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-LI.',
      'GeoNames administrative code: 05.',
    ],
  }),
  netherlandsPlace({
    name: 'Noord-Brabant',
    localNames: { en: 'Noord-Brabant', nl: 'Noord-Brabant', geonames: 'Noord Brabant' },
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Noord-Brabant'],
    centroid: { lat: 51.56, lon: 5.09, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-NB.',
      'GeoNames administrative code: 06.',
      'GeoNames renders this province as Noord Brabant; hyphenated Dutch spelling is canonical here.',
    ],
  }),
  netherlandsPlace({
    name: 'Noord-Holland',
    localNames: { en: 'Noord-Holland', nl: 'Noord-Holland', geonames: 'Noord Holland' },
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Noord-Holland'],
    centroid: { lat: 52.67, lon: 4.83, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-NH.',
      'GeoNames administrative code: 07.',
      'GeoNames renders this province as Noord Holland; hyphenated Dutch spelling is canonical here.',
    ],
  }),
  netherlandsPlace({
    name: 'Overijssel',
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Overijssel'],
    centroid: { lat: 52.44, lon: 6.46, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-OV.',
      'GeoNames administrative code: 15.',
    ],
  }),
  netherlandsPlace({
    name: 'Utrecht',
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Utrecht'],
    centroid: { lat: 52.09, lon: 5.12, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-UT.',
      'GeoNames administrative code: 09.',
    ],
  }),
  netherlandsPlace({
    name: 'Zeeland',
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Zeeland'],
    centroid: { lat: 51.49, lon: 3.85, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-ZE.',
      'GeoNames administrative code: 10.',
    ],
  }),
  netherlandsPlace({
    name: 'Zuid-Holland',
    localNames: { en: 'Zuid-Holland', nl: 'Zuid-Holland', geonames: 'Zuid Holland' },
    featureClass: 'province',
    adminPath: ['Netherlands', 'European Netherlands', 'Zuid-Holland'],
    centroid: { lat: 52.0, lon: 4.5, precision: 'region' },
    notes: [
      'Complete NL province seed; first-order type: province.',
      'ISO 3166-2 subdivision code: NL-ZH.',
      'GeoNames administrative code: 11.',
      'GeoNames renders this province as Zuid Holland; hyphenated Dutch spelling is canonical here.',
    ],
  }),
  netherlandsPlace({
    name: 'Bonaire',
    featureClass: 'special-region',
    adminPath: ['Netherlands', 'Caribbean Netherlands', 'Bonaire'],
    centroid: { lat: 12.2, lon: -68.26, precision: 'region' },
    geodataLinks: {
      official: NETHERLANDS_GOV_BES_URL,
      geonames: NETHERLANDS_GEONAMES_COUNTRY_URL,
    },
    notes: [
      'Complete NL Caribbean public body seed; first-order type: public body / special municipality.',
      'Bonaire is not part of a Dutch province.',
      'ISO 3166-2 is handled under BQ for Caribbean Netherlands; no NL province ISO code is claimed.',
    ],
  }),
  netherlandsPlace({
    name: 'Sint Eustatius',
    localNames: { en: 'Sint Eustatius', nl: 'Sint Eustatius', alternate: 'St Eustatius', informal: 'Statia' },
    featureClass: 'special-region',
    adminPath: ['Netherlands', 'Caribbean Netherlands', 'Sint Eustatius'],
    centroid: { lat: 17.49, lon: -62.98, precision: 'region' },
    geodataLinks: {
      official: NETHERLANDS_GOV_BES_URL,
      geonames: NETHERLANDS_GEONAMES_COUNTRY_URL,
    },
    notes: [
      'Complete NL Caribbean public body seed; first-order type: public body / special municipality.',
      'Sint Eustatius is not part of a Dutch province.',
      'ISO 3166-2 is handled under BQ for Caribbean Netherlands; no NL province ISO code is claimed.',
    ],
  }),
  netherlandsPlace({
    name: 'Saba',
    featureClass: 'special-region',
    adminPath: ['Netherlands', 'Caribbean Netherlands', 'Saba'],
    centroid: { lat: 17.63, lon: -63.24, precision: 'region' },
    geodataLinks: {
      official: NETHERLANDS_GOV_BES_URL,
      geonames: NETHERLANDS_GEONAMES_COUNTRY_URL,
    },
    notes: [
      'Complete NL Caribbean public body seed; first-order type: public body / special municipality.',
      'Saba is not part of a Dutch province.',
      'ISO 3166-2 is handled under BQ for Caribbean Netherlands; no NL province ISO code is claimed.',
    ],
  }),
  netherlandsPlace({
    name: 'Amsterdam',
    featureClass: 'capital',
    adminPath: ['Netherlands', 'European Netherlands', 'Noord-Holland', 'Amsterdam'],
    centroid: { lat: 52.3676, lon: 4.9041, precision: 'city' },
    geodataLinks: {
      official: NETHERLANDS_GOV_PROVINCES_URL,
      geonames: NETHERLANDS_GEONAMES_COUNTRY_URL,
    },
    notes: [
      'Complete NL capital seed; GeoNames country metadata lists Amsterdam as capital.',
      'No raw resident, recipient, building, or unit data is bundled.',
    ],
  }),
];

function polynesiaPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('PF', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, fr: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('PF'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('PF', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: POLYNESIA_PREF_COMMUNES_URL,
      geonames: POLYNESIA_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public French Polynesia administrative subdivision seed; boundary geometry is linked, not bundled.'],
  };
}

const POLYNESIA_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  polynesiaPlace({
    name: 'French Polynesia',
    localNames: { en: 'French Polynesia', fr: 'Polynésie française', ty: 'Pōrīnetia farāni' },
    featureClass: 'country',
    adminPath: ['French Polynesia'],
    centroid: { lat: -17.6797, lon: -149.4068, precision: 'country' },
    geodataLinks: {
      official: POLYNESIA_PREF_COMMUNES_URL,
      geonames: POLYNESIA_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q30971',
    },
    notes: [
      'Country-level seed for French Polynesia; public place metadata only.',
      'The complete PF slice has 5 administrative subdivisions and the Papeete capital seed.',
      'The 48 communes and 98 communes associées are intentionally deferred to a later commune-level pack.',
    ],
  }),
  polynesiaPlace({
    name: 'Iles du Vent',
    localNames: { en: 'Windward Islands', fr: 'Îles du Vent', ty: 'Nā Motu Niʻa' },
    featureClass: 'region',
    adminPath: ['French Polynesia', 'Society Islands', 'Iles du Vent'],
    centroid: { lat: -17.65, lon: -149.43, precision: 'region' },
    notes: [
      'Complete PF administrative subdivision seed; subdivision: Iles du Vent.',
      'GeoNames administrative code: 01.',
      'This is part of the Society Islands; it is not a full archipelago-level split of every island.',
      'Commune coverage count in prefecture source: 13 communes.',
    ],
  }),
  polynesiaPlace({
    name: 'Iles Sous-le-Vent',
    localNames: { en: 'Leeward Islands', fr: 'Îles Sous-le-Vent' },
    featureClass: 'region',
    adminPath: ['French Polynesia', 'Society Islands', 'Iles Sous-le-Vent'],
    centroid: { lat: -16.75, lon: -151.45, precision: 'region' },
    notes: [
      'Complete PF administrative subdivision seed; subdivision: Iles Sous-le-Vent.',
      'GeoNames administrative code: 02.',
      'This is part of the Society Islands; it is not a full archipelago-level split of every island.',
      'Commune coverage count in prefecture source: 7 communes.',
    ],
  }),
  polynesiaPlace({
    name: 'Iles Tuamotu-Gambier',
    localNames: { en: 'Tuamotu-Gambier', fr: 'Îles Tuamotu-Gambier', alternate: 'Tuamotu and Gambier Islands' },
    featureClass: 'region',
    adminPath: ['French Polynesia', 'Iles Tuamotu-Gambier'],
    centroid: { lat: -18.0, lon: -142.0, precision: 'region' },
    notes: [
      'Complete PF administrative subdivision seed; subdivision: Iles Tuamotu-Gambier.',
      'GeoNames administrative code: 03.',
      'Coarse centroid represents a very wide non-contiguous island-region grouping and is not a routing point.',
      'Commune coverage count in prefecture source: 17 communes.',
    ],
  }),
  polynesiaPlace({
    name: 'Iles Marquises',
    localNames: { en: 'Marquesas Islands', fr: 'Îles Marquises' },
    featureClass: 'region',
    adminPath: ['French Polynesia', 'Iles Marquises'],
    centroid: { lat: -9.0, lon: -140.0, precision: 'region' },
    notes: [
      'Complete PF administrative subdivision seed; subdivision: Iles Marquises.',
      'GeoNames administrative code: 04.',
      'Commune coverage count in prefecture source: 6 communes.',
    ],
  }),
  polynesiaPlace({
    name: 'Iles Australes',
    localNames: { en: 'Austral Islands', fr: 'Îles Australes' },
    featureClass: 'region',
    adminPath: ['French Polynesia', 'Iles Australes'],
    centroid: { lat: -23.35, lon: -149.5, precision: 'region' },
    notes: [
      'Complete PF administrative subdivision seed; subdivision: Iles Australes.',
      'GeoNames administrative code: 05.',
      'Commune coverage count in prefecture source: 5 communes.',
    ],
  }),
  polynesiaPlace({
    name: 'Papeete',
    featureClass: 'capital',
    adminPath: ['French Polynesia', 'Society Islands', 'Iles du Vent', 'Tahiti', 'Papeete'],
    centroid: { lat: -17.5516, lon: -149.5585, precision: 'city' },
    geodataLinks: {
      official: POLYNESIA_PREF_COMMUNES_URL,
      geonames: POLYNESIA_GEONAMES_COUNTRY_URL,
    },
    notes: [
      'Complete PF capital seed; GeoNames country metadata lists Papeete as capital.',
      'No raw resident, recipient, building, or unit data is bundled.',
    ],
  }),
];

function kiribatiPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('KI', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, gil: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('KI'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('KI', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: KIRIBATI_NSO_DISTRICTS_URL,
      geonames: KIRIBATI_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public Kiribati district seed; boundary geometry is linked, not bundled.'],
  };
}

function kiribatiIslandPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  islandGroup: 'Gilbert Islands' | 'Line Islands' | 'Phoenix Islands' | 'Banaba';
  district: 'Northern Kiribati' | 'South Tarawa' | 'Central Kiribati' | 'Southern Kiribati' | 'Line and Phoenix' | 'Banaba';
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  notes?: string[];
}): GazetteerPlaceSeed {
  return kiribatiPlace({
    name: input.name,
    localNames: input.localNames,
    featureClass: 'island',
    adminPath: ['Kiribati', input.islandGroup, input.district, input.name],
    centroid: input.centroid,
    geodataLinks: {
      official: KIRIBATI_TOURISM_ABOUT_URL,
      geonames: KIRIBATI_GEONAMES_ADMIN_URL,
    },
    notes: input.notes ?? [
      'Complete KI all-island seed; one of the 33 Kiribati coral islands recorded for P0 island coverage.',
      'Source boundary: Kiribati tourism source confirms the 33-island country scope; GeoNames ADM2/island layer is used as the public island-name cross-reference.',
      'Island anchor only; no legal boundary, parcel, route, access, delivery, or population claim is bundled.',
    ],
  });
}

const KIRIBATI_ISLAND_SEEDS: GazetteerPlaceSeed[] = [
  kiribatiIslandPlace({ name: 'Makin', islandGroup: 'Gilbert Islands', district: 'Northern Kiribati', centroid: { lat: 3.39, lon: 172.99, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Butaritari', islandGroup: 'Gilbert Islands', district: 'Northern Kiribati', centroid: { lat: 3.17, lon: 172.82, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Marakei', islandGroup: 'Gilbert Islands', district: 'Northern Kiribati', centroid: { lat: 2.02, lon: 173.27, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Abaiang', islandGroup: 'Gilbert Islands', district: 'Northern Kiribati', centroid: { lat: 1.85, lon: 173.04, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Tarawa Atoll', localNames: { en: 'Tarawa Atoll', gil: 'Tarawa', source: 'Tarawa' }, islandGroup: 'Gilbert Islands', district: 'South Tarawa', centroid: { lat: 1.42, lon: 173.03, precision: 'region' }, notes: [
    'Complete KI all-island seed; records Tarawa as the island/atoll anchor without colliding with the Tarawa capital seed.',
    'Source boundary: Kiribati tourism source confirms the 33-island country scope; GeoNames and NSO sources cross-reference Tarawa/South Tarawa/North Tarawa context.',
    'Island anchor only; no ward, household, route, access, or delivery claim is bundled.',
  ] }),
  kiribatiIslandPlace({ name: 'Maiana', islandGroup: 'Gilbert Islands', district: 'Central Kiribati', centroid: { lat: 1.0, lon: 173.0, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Abemama', islandGroup: 'Gilbert Islands', district: 'Central Kiribati', centroid: { lat: 0.4, lon: 173.85, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Kuria', islandGroup: 'Gilbert Islands', district: 'Central Kiribati', centroid: { lat: 0.23, lon: 173.42, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Aranuka', islandGroup: 'Gilbert Islands', district: 'Central Kiribati', centroid: { lat: 0.17, lon: 173.6, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Banaba', localNames: { en: 'Banaba', gil: 'Banaba', alternate: 'Ocean Island' }, islandGroup: 'Banaba', district: 'Banaba', centroid: { lat: -0.85, lon: 169.54, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Nonouti', islandGroup: 'Gilbert Islands', district: 'Southern Kiribati', centroid: { lat: -0.67, lon: 174.35, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Tabiteuea', islandGroup: 'Gilbert Islands', district: 'Southern Kiribati', centroid: { lat: -1.37, lon: 174.9, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Beru', islandGroup: 'Gilbert Islands', district: 'Southern Kiribati', centroid: { lat: -1.33, lon: 176.0, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Nikunau', islandGroup: 'Gilbert Islands', district: 'Southern Kiribati', centroid: { lat: -1.35, lon: 176.45, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Onotoa', islandGroup: 'Gilbert Islands', district: 'Southern Kiribati', centroid: { lat: -1.9, lon: 175.57, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Tamana', islandGroup: 'Gilbert Islands', district: 'Southern Kiribati', centroid: { lat: -2.5, lon: 175.98, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Arorae', islandGroup: 'Gilbert Islands', district: 'Southern Kiribati', centroid: { lat: -2.63, lon: 176.82, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Kiritimati', localNames: { en: 'Kiritimati', gil: 'Kiritimati', alternate: 'Christmas Island' }, islandGroup: 'Line Islands', district: 'Line and Phoenix', centroid: { lat: 1.87, lon: -157.4, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Tabuaeran', localNames: { en: 'Tabuaeran', gil: 'Tabuaeran', alternate: 'Fanning Island' }, islandGroup: 'Line Islands', district: 'Line and Phoenix', centroid: { lat: 3.86, lon: -159.35, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Teraina', localNames: { en: 'Teraina', gil: 'Teraina', alternate: 'Washington Island' }, islandGroup: 'Line Islands', district: 'Line and Phoenix', centroid: { lat: 4.71, lon: -160.76, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Malden Island', islandGroup: 'Line Islands', district: 'Line and Phoenix', centroid: { lat: -4.0, lon: -154.93, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Starbuck Island', islandGroup: 'Line Islands', district: 'Line and Phoenix', centroid: { lat: -5.63, lon: -155.93, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Flint Island', islandGroup: 'Line Islands', district: 'Line and Phoenix', centroid: { lat: -11.43, lon: -151.82, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Vostok Island', islandGroup: 'Line Islands', district: 'Line and Phoenix', centroid: { lat: -10.06, lon: -152.31, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Millennium Island', localNames: { en: 'Millennium Island', alternate: 'Caroline Island' }, islandGroup: 'Line Islands', district: 'Line and Phoenix', centroid: { lat: -9.93, lon: -150.21, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Kanton Island', localNames: { en: 'Kanton Island', alternate: 'Canton Island' }, islandGroup: 'Phoenix Islands', district: 'Line and Phoenix', centroid: { lat: -2.8, lon: -171.7, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Enderbury Island', islandGroup: 'Phoenix Islands', district: 'Line and Phoenix', centroid: { lat: -3.13, lon: -171.08, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Birnie Island', islandGroup: 'Phoenix Islands', district: 'Line and Phoenix', centroid: { lat: -3.58, lon: -171.52, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'McKean Island', islandGroup: 'Phoenix Islands', district: 'Line and Phoenix', centroid: { lat: -3.6, lon: -174.12, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Rawaki Island', localNames: { en: 'Rawaki Island', alternate: 'Phoenix Island' }, islandGroup: 'Phoenix Islands', district: 'Line and Phoenix', centroid: { lat: -3.72, lon: -170.72, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Manra Island', localNames: { en: 'Manra Island', alternate: 'Sydney Island' }, islandGroup: 'Phoenix Islands', district: 'Line and Phoenix', centroid: { lat: -4.45, lon: -171.25, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Orona Island', localNames: { en: 'Orona Island', alternate: 'Hull Island' }, islandGroup: 'Phoenix Islands', district: 'Line and Phoenix', centroid: { lat: -4.5, lon: -172.25, precision: 'region' } }),
  kiribatiIslandPlace({ name: 'Nikumaroro', localNames: { en: 'Nikumaroro', alternate: 'Gardner Island' }, islandGroup: 'Phoenix Islands', district: 'Line and Phoenix', centroid: { lat: -4.67, lon: -174.53, precision: 'region' } }),
];

const KIRIBATI_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  kiribatiPlace({
    name: 'Kiribati',
    localNames: { en: 'Kiribati', gil: 'Kiribati', official: 'Republic of Kiribati' },
    featureClass: 'country',
    adminPath: ['Kiribati'],
    centroid: { lat: 1.8709, lon: -157.363, precision: 'country' },
    geodataLinks: {
      official: KIRIBATI_NSO_DISTRICTS_URL,
      geonames: KIRIBATI_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q710',
    },
    notes: [
      'Country-level seed for Kiribati; public place metadata only.',
      'The complete KI slice has 5 National Statistics Office district groupings, all 33 public island anchors, and the Tarawa capital seed.',
      'Island anchors are public gazetteer seeds only; boundary geometry, delivery, access, population, and route claims are out of scope.',
    ],
  }),
  kiribatiPlace({
    name: 'Northern Kiribati',
    featureClass: 'district',
    adminPath: ['Kiribati', 'Gilbert Islands', 'Northern Kiribati'],
    centroid: { lat: 2.2, lon: 173.0, precision: 'region' },
    notes: [
      'Complete KI NSO district seed; district: Northern Kiribati.',
      'National Statistics Office district list: Makin, Butaritari, Marakei, Abaiang, North Tarawa.',
      'GeoNames cross-reference: Gilbert Islands ADM1.',
    ],
  }),
  kiribatiPlace({
    name: 'South Tarawa',
    featureClass: 'district',
    adminPath: ['Kiribati', 'Gilbert Islands', 'South Tarawa'],
    centroid: { lat: 1.35, lon: 173.0, precision: 'region' },
    notes: [
      'Complete KI NSO district seed; district: South Tarawa.',
      'National Statistics Office district list: Tarawa Urban Council (TUC), Betio Town Council (BTC).',
      'GeoNames cross-reference: Tarawa island record within Gilbert Islands.',
    ],
  }),
  kiribatiPlace({
    name: 'Central Kiribati',
    featureClass: 'district',
    adminPath: ['Kiribati', 'Gilbert Islands', 'Central Kiribati'],
    centroid: { lat: 0.35, lon: 173.0, precision: 'region' },
    notes: [
      'Complete KI NSO district seed; district: Central Kiribati.',
      'National Statistics Office district list: Abemama, Kuria, Aranuka, Maiana, Banaba.',
      'GeoNames cross-reference: Gilbert Islands ADM1 and Banaba island record.',
    ],
  }),
  kiribatiPlace({
    name: 'Southern Kiribati',
    featureClass: 'district',
    adminPath: ['Kiribati', 'Gilbert Islands', 'Southern Kiribati'],
    centroid: { lat: -2.3, lon: 175.6, precision: 'region' },
    notes: [
      'Complete KI NSO district seed; district: Southern Kiribati.',
      'National Statistics Office district list: Nonouti, North Tabiteuea, South Tabiteuea, Beru, Onotoa, Nikunau, Tamana, Arorae.',
      'GeoNames cross-reference: Gilbert Islands ADM1.',
    ],
  }),
  kiribatiPlace({
    name: 'Line and Phoenix',
    localNames: { en: 'Line and Phoenix', gil: 'Line and Phoenix', source: 'Line & Phoenix', alternate: 'Line Islands and Phoenix Islands' },
    featureClass: 'district',
    adminPath: ['Kiribati', 'Line Islands and Phoenix Islands', 'Line and Phoenix'],
    centroid: { lat: 1.8, lon: -166.0, precision: 'region' },
    notes: [
      'Complete KI NSO district seed; district: Line and Phoenix.',
      'National Statistics Office district list: Kanton (Canton), Kiritimati, Tabuaeran (Fanning), Teraina (Washington Island).',
      'GeoNames cross-reference: Line Islands ADM1 and Phoenix Islands ADM1.',
      'Coarse centroid represents a very wide non-contiguous island-region grouping and is not a routing point.',
    ],
  }),
  kiribatiPlace({
    name: 'Tarawa',
    featureClass: 'capital',
    adminPath: ['Kiribati', 'Gilbert Islands', 'South Tarawa', 'Tarawa'],
    centroid: { lat: 1.35, lon: 173.03, precision: 'city' },
    geodataLinks: {
      official: KIRIBATI_TOURISM_ABOUT_URL,
      geonames: KIRIBATI_GEONAMES_COUNTRY_URL,
    },
    notes: [
      'Complete KI capital seed; GeoNames country metadata lists Tarawa as capital.',
      'Kiribati National Tourism Office identifies Tarawa as the capital and Bairiki as administrative center.',
      'No raw resident, recipient, building, or unit data is bundled.',
    ],
  }),
  ...KIRIBATI_ISLAND_SEEDS,
];

function northKoreaPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('KP', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name, ko: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('KP'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('KP', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: NORTH_KOREA_OPENFACTBOOK_URL,
      geonames: NORTH_KOREA_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public North Korea first-order division seed; boundary geometry is linked, not bundled.'],
  };
}

const NORTH_KOREA_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  northKoreaPlace({
    name: 'North Korea',
    localNames: {
      en: 'North Korea',
      ko: 'Choson',
      official: 'Democratic People\'s Republic of Korea',
    },
    featureClass: 'country',
    adminPath: ['North Korea'],
    centroid: { lat: 40.3399, lon: 127.5101, precision: 'country' },
    geodataLinks: {
      official: NORTH_KOREA_OPENFACTBOOK_URL,
      geonames: NORTH_KOREA_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q423',
    },
    notes: [
      'Country-level seed for North Korea; public place metadata only.',
      'The complete KP slice has 9 provinces, 4 special administration cities, and no second-order address data.',
      'This pack records technical place identifiers only and does not make sovereignty, sanctions, or routing claims.',
    ],
  }),
  northKoreaPlace({
    name: 'Pyongyang',
    localNames: { en: 'Pyongyang', ko: 'P\'yongyang', mr: 'P’yŏngyang', geonames: 'P\'yongyang Special City', pcgn: 'P’yŏngyang-jikhalsi' },
    featureClass: 'capital',
    adminPath: ['North Korea', 'Pyongyang'],
    centroid: { lat: 39.0667, lon: 125.8333, precision: 'city' },
    geodataLinks: {
      official: NORTH_KOREA_OPENFACTBOOK_URL,
      geonames: NORTH_KOREA_GEONAMES_COUNTRY_URL,
    },
    notes: [
      'Complete KP first-order seed; first-order type: directly controlled capital city / special administration city.',
      'OpenFactBook administrative division list: special administration cities include P\'yongyang.',
      'GeoNames subdivision listing row: P\'yongyang Special City, type si (city), capital Pyongyang.',
      'PCGN centre reference: P’yŏngyang, approximately 39°04N 125°50E.',
      'No raw resident, recipient, building, or unit data is bundled.',
    ],
  }),
  northKoreaPlace({
    name: 'South Pyongan',
    localNames: { en: 'South Pyongan', ko: 'P\'yongan-namdo', mr: 'P’yŏngan-namdo', short: 'P\'yongnam' },
    featureClass: 'province',
    adminPath: ['North Korea', 'South Pyongan'],
    centroid: { lat: 39.25, lon: 125.85, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include P\'yongnam (South Pyongan).',
      'GeoNames subdivision listing row: P\'yongan-namdo, type do (province).',
      'PCGN centre reference: P’yŏngsŏng, approximately 39°15N 125°51E.',
    ],
  }),
  northKoreaPlace({
    name: 'North Pyongan',
    localNames: { en: 'North Pyongan', ko: 'P\'yongan-bukto', mr: 'P’yŏngan-bukto', short: 'P\'yongbuk' },
    featureClass: 'province',
    adminPath: ['North Korea', 'North Pyongan'],
    centroid: { lat: 40.1, lon: 124.3833, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include P\'yongbuk (North Pyongan).',
      'GeoNames subdivision listing row: P\'yongan-bukto, type to (province).',
      'PCGN centre reference: Sinŭiju, approximately 40°06N 124°23E.',
    ],
  }),
  northKoreaPlace({
    name: 'Chagang',
    localNames: { en: 'Chagang', ko: 'Chagang-do', mr: 'Chagang-do' },
    featureClass: 'province',
    adminPath: ['North Korea', 'Chagang'],
    centroid: { lat: 40.9667, lon: 126.5833, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Chagang.',
      'GeoNames subdivision listing row: Chagang-do, type do (province).',
      'PCGN centre reference: Kanggye, approximately 40°58N 126°35E.',
    ],
  }),
  northKoreaPlace({
    name: 'South Hwanghae',
    localNames: { en: 'South Hwanghae', ko: 'Hwanghae-namdo', mr: 'Hwanghae-namdo', short: 'Hwangnam' },
    featureClass: 'province',
    adminPath: ['North Korea', 'South Hwanghae'],
    centroid: { lat: 38.0333, lon: 125.7, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Hwangnam (South Hwanghae).',
      'GeoNames subdivision listing row: Hwanghae-namdo, type do (province).',
      'PCGN centre reference: Haeju, approximately 38°02N 125°42E.',
    ],
  }),
  northKoreaPlace({
    name: 'North Hwanghae',
    localNames: { en: 'North Hwanghae', ko: 'Hwanghae-bukto', mr: 'Hwanghae-bukto', short: 'Hwangbuk' },
    featureClass: 'province',
    adminPath: ['North Korea', 'North Hwanghae'],
    centroid: { lat: 38.5, lon: 125.75, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Hwangbuk (North Hwanghae).',
      'GeoNames subdivision listing row: Hwanghae-bukto, type to (province).',
      'PCGN centre reference: Sariwŏn, approximately 38°30N 125°45E.',
    ],
  }),
  northKoreaPlace({
    name: 'Kangwon',
    localNames: { en: 'Kangwon', ko: 'Kangwon-do', mr: 'Kangwŏn-do' },
    featureClass: 'province',
    adminPath: ['North Korea', 'Kangwon'],
    centroid: { lat: 39.15, lon: 127.4333, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Kangwon.',
      'GeoNames subdivision listing row: Kangwon-do, type do (province).',
      'PCGN centre reference: Wŏnsan, approximately 39°09N 127°26E.',
    ],
  }),
  northKoreaPlace({
    name: 'South Hamgyong',
    localNames: { en: 'South Hamgyong', ko: 'Hamgyong-namdo', mr: 'Hamgyŏng-namdo', short: 'Hamnam' },
    featureClass: 'province',
    adminPath: ['North Korea', 'South Hamgyong'],
    centroid: { lat: 39.9, lon: 127.5333, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Hamnam (South Hamgyong).',
      'GeoNames subdivision listing row: Hamgyong-namdo, type do (province).',
      'PCGN centre reference: Hamhŭng, approximately 39°54N 127°32E.',
    ],
  }),
  northKoreaPlace({
    name: 'North Hamgyong',
    localNames: { en: 'North Hamgyong', ko: 'Hamgyong-bukto', mr: 'Hamgyŏng-bukto', short: 'Hambuk' },
    featureClass: 'province',
    adminPath: ['North Korea', 'North Hamgyong'],
    centroid: { lat: 41.7833, lon: 129.7667, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Hambuk (North Hamgyong).',
      'GeoNames subdivision listing row: Hamgyong-bukto, type to (province).',
      'PCGN centre reference: Ch’ŏngjin, approximately 41°47N 129°46E.',
    ],
  }),
  northKoreaPlace({
    name: 'Ryanggang',
    localNames: { en: 'Ryanggang', ko: 'Ryanggang-do', mr: 'Ryanggang-do', alternate: 'Yanggang-do' },
    featureClass: 'province',
    adminPath: ['North Korea', 'Ryanggang'],
    centroid: { lat: 41.3833, lon: 128.1667, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Ryanggang.',
      'GeoNames subdivision listing row: Ryanggang-do (Yanggang-do), type do (province).',
      'PCGN centre reference: Hyesan, approximately 41°23N 128°10E.',
    ],
  }),
  northKoreaPlace({
    name: 'Rason',
    localNames: { en: 'Rason', ko: 'Rason', mr: 'Rasŏn', alternate: 'Nason; Najin-Sonbong' },
    featureClass: 'special-region',
    adminPath: ['North Korea', 'Rason'],
    centroid: { lat: 42.25, lon: 130.2667, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: special administration city.',
      'OpenFactBook administrative division list: special administration cities include Rason.',
      'GeoNames subdivision listing row: Nasŏn (Najin-Sŏnbong), type si (city).',
      'PCGN centre reference: Rasŏn, approximately 42°15N 130°16E.',
    ],
  }),
  northKoreaPlace({
    name: 'Nampo',
    localNames: { en: 'Nampo', ko: 'Nampo', mr: 'Namp’o', pcgn: 'Namp’o-t’ŭkpyŏlsi' },
    featureClass: 'special-region',
    adminPath: ['North Korea', 'Nampo'],
    centroid: { lat: 38.7375, lon: 125.4078, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: special administration city.',
      'OpenFactBook administrative division list: special administration cities include Nampo.',
      'GeoNames subdivision listing row: Nampo, type si (city).',
      'PCGN centre reference: Namp’o, approximately 38°43N 125°24E.',
    ],
  }),
  northKoreaPlace({
    name: 'Kaesong',
    localNames: { en: 'Kaesong', ko: 'Kaesong', mr: 'Kaesŏng', pcgn: 'Kaesŏng-t’ŭkpyŏlsi' },
    featureClass: 'special-region',
    adminPath: ['North Korea', 'Kaesong'],
    centroid: { lat: 37.9708, lon: 126.5544, precision: 'region' },
    notes: [
      'Complete KP first-order seed; first-order type: special administration city.',
      'OpenFactBook administrative division list: special administration cities include Kaesong.',
      'GeoNames subdivision listing row: Kaeseong, type si (city).',
      'PCGN notes Kaesŏng first-order status was reinstated in 2019 and should be included in the administrative division list.',
    ],
  }),
];

function laosPlace(input: {
  name: string;
  localNames?: Record<string, string>;
  featureClass: GazetteerPlaceSeed['featureClass'];
  adminPath: string[];
  centroid: { lat: number; lon: number; precision: GazetteerPlaceSeed['approximateCentroid']['precision'] };
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  validationState?: GazetteerPlaceSeed['validationState'];
  notes?: string[];
}): GazetteerPlaceSeed {
  return {
    agidPlaceId: agidPlaceId('LA', input.name),
    name: input.name,
    localNames: input.localNames ?? { en: input.name },
    featureClass: input.featureClass,
    adminPath: input.adminPath,
    agidPath: [
      agidCountryId('LA'),
      ...input.adminPath.slice(1).map(name => agidPlaceId('LA', name)),
    ],
    approximateCentroid: input.centroid,
    geodataLinks: {
      official: LAOS_OPENFACTBOOK_URL,
      geonames: LAOS_GEONAMES_ADMIN_URL,
      ...input.geodataLinks,
    },
    validationState: input.validationState ?? 'source-linked',
    notes: input.notes ?? ['Source-linked public Laos first-order division seed; boundary geometry is linked, not bundled.'],
  };
}

const LAOS_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  laosPlace({
    name: 'Laos',
    localNames: {
      en: 'Laos',
      official: 'Lao People\'s Democratic Republic',
      alternate: 'Lao PDR',
    },
    featureClass: 'country',
    adminPath: ['Laos'],
    centroid: { lat: 18.0, lon: 105.0, precision: 'country' },
    geodataLinks: {
      official: LAOS_OPENFACTBOOK_URL,
      geonames: LAOS_GEONAMES_COUNTRY_URL,
      wikidata: 'https://www.wikidata.org/wiki/Q819',
    },
    notes: [
      'Country-level seed for Laos; public place metadata only.',
      'The complete LA slice has 17 provinces and 1 capital first-order unit.',
      'Second-order districts and village-level records are intentionally deferred to later packs.',
    ],
  }),
  laosPlace({
    name: 'Attapu',
    localNames: { en: 'Attapu', alternate: 'Attapeu; Attapu' },
    featureClass: 'province',
    adminPath: ['Laos', 'Attapu'],
    centroid: { lat: 14.8, lon: 106.83, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Attapu.',
      'GeoNames subdivision listing row: Attapu, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Bokeo',
    featureClass: 'province',
    adminPath: ['Laos', 'Bokeo'],
    centroid: { lat: 20.3, lon: 100.45, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Bokeo.',
      'GeoNames subdivision listing row: Bokeo, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Bolikhamxai',
    localNames: { en: 'Bolikhamxai', alternate: 'Bolikhamsai' },
    featureClass: 'province',
    adminPath: ['Laos', 'Bolikhamxai'],
    centroid: { lat: 18.45, lon: 104.55, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Bolikhamxai.',
      'GeoNames subdivision listing row: Bolikhamxai, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Champasak',
    featureClass: 'province',
    adminPath: ['Laos', 'Champasak'],
    centroid: { lat: 15.1, lon: 105.8, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Champasak.',
      'GeoNames subdivision listing row: Champasak, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Houaphan',
    localNames: { en: 'Houaphan', alternate: 'Huaphan' },
    featureClass: 'province',
    adminPath: ['Laos', 'Houaphan'],
    centroid: { lat: 20.33, lon: 104.1, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Houaphan.',
      'GeoNames subdivision listing row: Houaphan, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Khammouan',
    localNames: { en: 'Khammouan', alternate: 'Khammouane' },
    featureClass: 'province',
    adminPath: ['Laos', 'Khammouan'],
    centroid: { lat: 17.4, lon: 104.8, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Khammouan.',
      'GeoNames subdivision listing row: Khammouan, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Louang Namtha',
    localNames: { en: 'Louang Namtha', alternate: 'Luang Namtha' },
    featureClass: 'province',
    adminPath: ['Laos', 'Louang Namtha'],
    centroid: { lat: 20.95, lon: 101.4, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Louang Namtha.',
      'GeoNames subdivision listing row: Louang Namtha, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Louangphabang',
    localNames: { en: 'Louangphabang', alternate: 'Luang Prabang' },
    featureClass: 'province',
    adminPath: ['Laos', 'Louangphabang'],
    centroid: { lat: 20.0, lon: 102.6, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Louangphabang.',
      'GeoNames subdivision listing row: Louangphabang, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Oudomxai',
    localNames: { en: 'Oudomxai', alternate: 'Oudomxay' },
    featureClass: 'province',
    adminPath: ['Laos', 'Oudomxai'],
    centroid: { lat: 20.7, lon: 101.98, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Oudomxai.',
      'GeoNames subdivision listing row: Oudomxai, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Phongsali',
    localNames: { en: 'Phongsali', alternate: 'Phongsaly' },
    featureClass: 'province',
    adminPath: ['Laos', 'Phongsali'],
    centroid: { lat: 21.68, lon: 102.1, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Phongsali.',
      'GeoNames subdivision listing row: Phongsali, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Salavan',
    localNames: { en: 'Salavan', alternate: 'Saravan' },
    featureClass: 'province',
    adminPath: ['Laos', 'Salavan'],
    centroid: { lat: 15.72, lon: 106.42, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Salavan.',
      'GeoNames subdivision listing row: Salavan, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Savannakhet',
    featureClass: 'province',
    adminPath: ['Laos', 'Savannakhet'],
    centroid: { lat: 16.57, lon: 104.75, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Savannakhet.',
      'GeoNames subdivision listing row: Savannakhet, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Vientiane Capital',
    localNames: { en: 'Vientiane Capital', alternate: 'Viangchan; Vientiane Prefecture; Vientiane Capital City' },
    featureClass: 'capital',
    adminPath: ['Laos', 'Vientiane Capital'],
    centroid: { lat: 17.9667, lon: 102.6, precision: 'city' },
    geodataLinks: {
      official: LAOS_OPENFACTBOOK_URL,
      geonames: LAOS_GEONAMES_COUNTRY_URL,
    },
    notes: [
      'Complete LA first-order seed; first-order type: capital city / prefecture.',
      'OpenFactBook administrative division list: prefecture includes Viangchan (Vientiane).',
      'GeoNames subdivision listing row: Vientiane Prefecture, type kampheng nakhon (prefecture/capital city).',
      'GeoNames country metadata lists Vientiane as capital.',
      'No raw resident, recipient, building, or unit data is bundled.',
    ],
  }),
  laosPlace({
    name: 'Vientiane Province',
    localNames: { en: 'Vientiane Province', alternate: 'Viangchan Province; Vientiane' },
    featureClass: 'province',
    adminPath: ['Laos', 'Vientiane Province'],
    centroid: { lat: 18.5, lon: 102.4, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Viangchan (Vientiane Province).',
      'GeoNames subdivision listing row: Vientiane Province, type khoueng (province).',
      'Seed name includes Province to avoid collision with Vientiane Capital.',
    ],
  }),
  laosPlace({
    name: 'Xaignabouli',
    localNames: { en: 'Xaignabouli', alternate: 'Sainyabuli; Xayaburi' },
    featureClass: 'province',
    adminPath: ['Laos', 'Xaignabouli'],
    centroid: { lat: 19.25, lon: 101.75, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Xaignabouli.',
      'GeoNames subdivision listing row: Xaignabouli, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Xekong',
    localNames: { en: 'Xekong', alternate: 'Sekong' },
    featureClass: 'province',
    adminPath: ['Laos', 'Xekong'],
    centroid: { lat: 15.35, lon: 106.72, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Xekong.',
      'GeoNames subdivision listing row: Xekong, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Xiangkhoang',
    localNames: { en: 'Xiangkhoang', alternate: 'Xiengkhuang; Xiang Khouang' },
    featureClass: 'province',
    adminPath: ['Laos', 'Xiangkhoang'],
    centroid: { lat: 19.45, lon: 103.2, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Xiangkhouang.',
      'GeoNames subdivision listing row: Xiangkhoang, type khoueng (province).',
    ],
  }),
  laosPlace({
    name: 'Xaisomboun',
    localNames: { en: 'Xaisomboun', alternate: 'Saisomboun; Saysomboun' },
    featureClass: 'province',
    adminPath: ['Laos', 'Xaisomboun'],
    centroid: { lat: 18.9, lon: 103.1, precision: 'region' },
    notes: [
      'Complete LA first-order seed; first-order type: province.',
      'OpenFactBook administrative division list: provinces include Xaisomboun.',
      'GeoNames subdivision listing row: Xaisomboun, type khoueng (province).',
    ],
  }),
];

type CompactFirstOrderSeed = {
  name: string;
  featureClass: GazetteerPlaceSeed['featureClass'];
  typeNote: string;
  sourceLabel: string;
  geonamesLabel: string;
  centroid?: {
    lat: number;
    lon: number;
    precision?: GazetteerPlaceSeed['approximateCentroid']['precision'];
  };
  localNames?: Record<string, string>;
  geodataLinks?: GazetteerPlaceSeed['geodataLinks'];
  notes?: string[];
};

function compactCountryPlaceSeeds(input: {
  countryCode: string;
  countryName: string;
  countryLocalNames: Record<string, string>;
  countryCentroid: { lat: number; lon: number };
  countryNotes: string[];
  officialUrl: string;
  geonamesAdminUrl: string;
  geonamesCountryUrl: string;
  wikidata: string;
  sourceName: string;
  rows: CompactFirstOrderSeed[];
}): GazetteerPlaceSeed[] {
  return [
    {
      agidPlaceId: agidPlaceId(input.countryCode, input.countryName),
      name: input.countryName,
      localNames: input.countryLocalNames,
      featureClass: 'country',
      adminPath: [input.countryName],
      agidPath: [agidCountryId(input.countryCode)],
      approximateCentroid: {
        lat: input.countryCentroid.lat,
        lon: input.countryCentroid.lon,
        precision: 'country',
      },
      geodataLinks: {
        official: input.officialUrl,
        geonames: input.geonamesCountryUrl,
        wikidata: input.wikidata,
      },
      validationState: 'source-linked',
      notes: input.countryNotes,
    },
    ...input.rows.map((row, index) => ({
      agidPlaceId: agidPlaceId(input.countryCode, row.name),
      name: row.name,
      localNames: row.localNames ?? { en: row.name },
      featureClass: row.featureClass,
      adminPath: [input.countryName, row.name],
      agidPath: [agidCountryId(input.countryCode), agidPlaceId(input.countryCode, row.name)],
      approximateCentroid: {
        lat: row.centroid?.lat ?? input.countryCentroid.lat + ((index + 1) * 0.01),
        lon: row.centroid?.lon ?? input.countryCentroid.lon + ((index + 1) * 0.01),
        precision: row.centroid?.precision ?? 'region',
      },
      geodataLinks: {
        official: input.officialUrl,
        geonames: input.geonamesAdminUrl,
        ...row.geodataLinks,
      },
      validationState: 'source-linked' as const,
      notes: [
        `Complete ${input.countryCode} first-order seed; first-order type: ${row.typeNote}.`,
        `${input.sourceName} administrative division list: ${row.sourceLabel}.`,
        `GeoNames subdivision listing row: ${row.geonamesLabel}.`,
        'Boundary geometry is linked for review and not bundled in this seed pack.',
        ...(row.notes ?? []),
      ],
    })),
  ];
}

const MYANMAR_FIRST_ORDER_ROWS: CompactFirstOrderSeed[] = [
  { name: 'Sagaing Region', featureClass: 'province', typeNote: 'region', sourceLabel: 'regions include Sagaing', geonamesLabel: 'Sagaing, type division', centroid: { lat: 22.1, lon: 95.2, precision: 'region' } },
  { name: 'Bago Region', featureClass: 'province', typeNote: 'region', sourceLabel: 'regions include Bago', geonamesLabel: 'Bago, type division', centroid: { lat: 17.3, lon: 96.5, precision: 'region' } },
  { name: 'Magway Region', featureClass: 'province', typeNote: 'region', sourceLabel: 'regions include Magway', geonamesLabel: 'Magway, type division', centroid: { lat: 20.1, lon: 94.9, precision: 'region' } },
  { name: 'Mandalay Region', featureClass: 'province', typeNote: 'region', sourceLabel: 'regions include Mandalay', geonamesLabel: 'Mandalay, type division', centroid: { lat: 21.97, lon: 96.08, precision: 'region' } },
  { name: 'Tanintharyi Region', featureClass: 'province', typeNote: 'region', sourceLabel: 'regions include Tanintharyi', geonamesLabel: 'Tanintharyi, type division', centroid: { lat: 12.1, lon: 98.9, precision: 'region' } },
  { name: 'Yangon Region', featureClass: 'province', typeNote: 'region', sourceLabel: 'regions include Yangon', geonamesLabel: 'Yangon, type division', centroid: { lat: 16.8, lon: 96.15, precision: 'region' } },
  { name: 'Ayeyarwady Region', featureClass: 'province', typeNote: 'region', sourceLabel: 'regions include Ayeyarwady', geonamesLabel: 'Ayeyarwady, type division', centroid: { lat: 17.0, lon: 95.0, precision: 'region' } },
  { name: 'Kachin State', featureClass: 'state', typeNote: 'state', sourceLabel: 'states include Kachin', geonamesLabel: 'Kachin, type state', centroid: { lat: 26.0, lon: 97.5, precision: 'region' } },
  { name: 'Kayah State', featureClass: 'state', typeNote: 'state', sourceLabel: 'states include Kayah', geonamesLabel: 'Kayah, type state', centroid: { lat: 19.3, lon: 97.4, precision: 'region' } },
  { name: 'Kayin State', featureClass: 'state', typeNote: 'state', sourceLabel: 'states include Kayin', geonamesLabel: 'Kayin, type state', centroid: { lat: 16.9, lon: 97.6, precision: 'region' } },
  { name: 'Chin State', featureClass: 'state', typeNote: 'state', sourceLabel: 'states include Chin', geonamesLabel: 'Chin, type state', centroid: { lat: 22.4, lon: 93.6, precision: 'region' } },
  { name: 'Mon State', featureClass: 'state', typeNote: 'state', sourceLabel: 'states include Mon', geonamesLabel: 'Mon, type state', centroid: { lat: 16.3, lon: 97.7, precision: 'region' } },
  { name: 'Rakhine State', featureClass: 'state', typeNote: 'state', sourceLabel: 'states include Rakhine', geonamesLabel: 'Rakhine, type state', centroid: { lat: 20.1, lon: 93.0, precision: 'region' } },
  { name: 'Shan State', featureClass: 'state', typeNote: 'state', sourceLabel: 'states include Shan', geonamesLabel: 'Shan, type state', centroid: { lat: 21.3, lon: 98.0, precision: 'region' } },
  {
    name: 'Nay Pyi Taw',
    featureClass: 'capital',
    typeNote: 'union territory and capital',
    sourceLabel: 'Union territory includes Nay Pyi Taw',
    geonamesLabel: 'Nay Pyi Taw, capital territory row',
    centroid: { lat: 19.745, lon: 96.1297, precision: 'city' },
    notes: ['GeoNames country metadata lists Nay Pyi Taw as capital.'],
  },
];

const MYANMAR_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'MM',
  countryName: 'Myanmar',
  countryLocalNames: { en: 'Myanmar', official: 'Republic of the Union of Myanmar', alternate: 'Burma' },
  countryCentroid: { lat: 21.9162, lon: 95.956 },
  countryNotes: [
    'Country-level seed for Myanmar; public place metadata only.',
    'The complete MM slice records 7 regions, 7 states, and Nay Pyi Taw Union Territory/capital.',
    'Self-administered zones/divisions, districts, townships, wards, village tracts, and village records are intentionally deferred.',
  ],
  officialUrl: MYANMAR_ADMIN_GEOGRAPHY_URL,
  geonamesAdminUrl: MYANMAR_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: MYANMAR_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q836',
  sourceName: 'GeoNames/administrative geography',
  rows: MYANMAR_FIRST_ORDER_ROWS,
});

const PAPUA_NEW_GUINEA_FIRST_ORDER_ROWS: CompactFirstOrderSeed[] = [
  { name: 'Chimbu', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Chimbu', geonamesLabel: 'Chimbu, type province', centroid: { lat: -6.0, lon: 144.9, precision: 'region' } },
  { name: 'Central', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Central', geonamesLabel: 'Central, type province', centroid: { lat: -9.1, lon: 147.6, precision: 'region' } },
  { name: 'East New Britain', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include East New Britain', geonamesLabel: 'East New Britain, type province', centroid: { lat: -4.6, lon: 152.0, precision: 'region' } },
  { name: 'Eastern Highlands', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Eastern Highlands', geonamesLabel: 'Eastern Highlands, type province', centroid: { lat: -6.1, lon: 145.5, precision: 'region' } },
  { name: 'Enga', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Enga', geonamesLabel: 'Enga, type province', centroid: { lat: -5.4, lon: 143.6, precision: 'region' } },
  { name: 'East Sepik', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include East Sepik', geonamesLabel: 'East Sepik, type province', centroid: { lat: -4.2, lon: 143.0, precision: 'region' } },
  { name: 'Gulf', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Gulf', geonamesLabel: 'Gulf, type province', centroid: { lat: -7.9, lon: 145.4, precision: 'region' } },
  { name: 'Hela', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Hela', geonamesLabel: 'Hela, type province', centroid: { lat: -5.9, lon: 142.9, precision: 'region' } },
  { name: 'Jiwaka', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Jiwaka', geonamesLabel: 'Jiwaka, type province', centroid: { lat: -5.6, lon: 144.6, precision: 'region' } },
  { name: 'Milne Bay', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Milne Bay', geonamesLabel: 'Milne Bay, type province', centroid: { lat: -10.3, lon: 150.4, precision: 'region' } },
  { name: 'Morobe', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Morobe', geonamesLabel: 'Morobe, type province', centroid: { lat: -6.7, lon: 146.8, precision: 'region' } },
  { name: 'Madang', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Madang', geonamesLabel: 'Madang, type province', centroid: { lat: -5.2, lon: 145.8, precision: 'region' } },
  { name: 'Manus', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Manus', geonamesLabel: 'Manus, type province', centroid: { lat: -2.1, lon: 147.0, precision: 'region' } },
  {
    name: 'National Capital',
    featureClass: 'capital',
    typeNote: 'district and capital territory',
    sourceLabel: 'district includes National Capital / Port Moresby',
    geonamesLabel: 'National Capital, type district',
    centroid: { lat: -9.45, lon: 147.18, precision: 'city' },
    notes: ['OpenFactBook lists National Capital as district and Port Moresby as capital.'],
  },
  { name: 'New Ireland', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include New Ireland', geonamesLabel: 'New Ireland, type province', centroid: { lat: -3.3, lon: 151.6, precision: 'region' } },
  { name: 'Northern', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Northern', geonamesLabel: 'Northern, type province', centroid: { lat: -8.8, lon: 148.2, precision: 'region' } },
  {
    name: 'Bougainville',
    featureClass: 'special-region',
    typeNote: 'autonomous region',
    sourceLabel: 'autonomous region includes Bougainville',
    geonamesLabel: 'Bougainville, type autonomous region',
    centroid: { lat: -6.2, lon: 155.4, precision: 'region' },
    geodataLinks: { official: BOUGAINVILLE_GOV_QUICK_FACTS_URL },
    notes: ['Autonomous Bougainville Government quick facts are linked as an official cross-reference.'],
  },
  { name: 'Sandaun', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Sandaun / West Sepik', geonamesLabel: 'Sandaun, type province', centroid: { lat: -3.5, lon: 142.0, precision: 'region' } },
  { name: 'Southern Highlands', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Southern Highlands', geonamesLabel: 'Southern Highlands, type province', centroid: { lat: -6.3, lon: 143.5, precision: 'region' } },
  { name: 'West New Britain', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include West New Britain', geonamesLabel: 'West New Britain, type province', centroid: { lat: -5.7, lon: 150.0, precision: 'region' } },
  { name: 'Western Highlands', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Western Highlands', geonamesLabel: 'Western Highlands, type province', centroid: { lat: -5.9, lon: 144.3, precision: 'region' } },
  { name: 'Western', featureClass: 'province', typeNote: 'province', sourceLabel: 'provinces include Western', geonamesLabel: 'Western, type province', centroid: { lat: -7.2, lon: 142.2, precision: 'region' } },
];

const PAPUA_NEW_GUINEA_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'PG',
  countryName: 'Papua New Guinea',
  countryLocalNames: { en: 'Papua New Guinea', official: 'Independent State of Papua New Guinea' },
  countryCentroid: { lat: -6.315, lon: 143.9555 },
  countryNotes: [
    'Country-level seed for Papua New Guinea; public place metadata only.',
    'The complete PG slice records 20 provinces, 1 autonomous region, and 1 district.',
    'District, LLG, ward, settlement, route, and building-level records are intentionally deferred.',
  ],
  officialUrl: PAPUA_NEW_GUINEA_OPENFACTBOOK_URL,
  geonamesAdminUrl: PAPUA_NEW_GUINEA_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: PAPUA_NEW_GUINEA_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q691',
  sourceName: 'OpenFactBook/GeoNames',
  rows: PAPUA_NEW_GUINEA_FIRST_ORDER_ROWS,
});

const PHILIPPINES_FIRST_ORDER_ROWS: CompactFirstOrderSeed[] = [
  { name: 'National Capital Region', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include National Capital Region', geonamesLabel: 'National Capital Region, type region', centroid: { lat: 14.5995, lon: 120.9842, precision: 'region' }, notes: ['GeoNames country metadata lists Manila as capital; this seed records the regional layer, not a city pack.'] },
  { name: 'Cordillera Administrative Region', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Cordillera Administrative Region', geonamesLabel: 'Cordillera, type region', centroid: { lat: 17.4, lon: 121.0, precision: 'region' } },
  { name: 'Ilocos Region', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Ilocos Region', geonamesLabel: 'Ilocos, type region', centroid: { lat: 16.3, lon: 120.5, precision: 'region' } },
  { name: 'Cagayan Valley', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Cagayan Valley', geonamesLabel: 'Cagayan Valley, type region', centroid: { lat: 17.6, lon: 121.7, precision: 'region' } },
  { name: 'Central Luzon', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Central Luzon', geonamesLabel: 'Central Luzon, type region', centroid: { lat: 15.3, lon: 120.8, precision: 'region' } },
  { name: 'Calabarzon', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Calabarzon', geonamesLabel: 'Calabarzon, type region', centroid: { lat: 14.1, lon: 121.3, precision: 'region' } },
  { name: 'Mimaropa', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Mimaropa', geonamesLabel: 'Mimaropa, type region', centroid: { lat: 12.7, lon: 120.9, precision: 'region' } },
  { name: 'Bicol Region', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Bicol Region', geonamesLabel: 'Bicol, type region', centroid: { lat: 13.3, lon: 123.4, precision: 'region' } },
  { name: 'Western Visayas', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Western Visayas', geonamesLabel: 'Western Visayas, type region', centroid: { lat: 11.1, lon: 122.5, precision: 'region' } },
  {
    name: 'Negros Island Region',
    featureClass: 'region',
    typeNote: 'administrative region',
    sourceLabel: 'regions include Negros Island Region after Republic Act No. 12000',
    geonamesLabel: 'Negros Island Region, current PSA/PhilAtlas region; legacy GeoNames regional layer may lag',
    centroid: { lat: 10.2, lon: 123.0, precision: 'region' },
    geodataLinks: { official: PHILIPPINES_PSA_NIR_URL },
    notes: ['PSA NIR record and Republic Act No. 12000 are linked to avoid stale region coverage.'],
  },
  { name: 'Central Visayas', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Central Visayas', geonamesLabel: 'Central Visayas, type region', centroid: { lat: 10.3, lon: 123.8, precision: 'region' } },
  { name: 'Eastern Visayas', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Eastern Visayas', geonamesLabel: 'Eastern Visayas, type region', centroid: { lat: 11.2, lon: 125.0, precision: 'region' } },
  { name: 'Zamboanga Peninsula', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Zamboanga Peninsula', geonamesLabel: 'Zamboanga Peninsula, type region', centroid: { lat: 7.8, lon: 123.1, precision: 'region' } },
  { name: 'Northern Mindanao', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Northern Mindanao', geonamesLabel: 'Northern Mindanao, type region', centroid: { lat: 8.2, lon: 124.7, precision: 'region' } },
  { name: 'Davao Region', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Davao Region', geonamesLabel: 'Davao, type region', centroid: { lat: 7.3, lon: 126.0, precision: 'region' } },
  { name: 'Soccsksargen', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Soccsksargen', geonamesLabel: 'Soccsksargen, type region', centroid: { lat: 6.3, lon: 124.8, precision: 'region' } },
  { name: 'Caraga', featureClass: 'region', typeNote: 'administrative region', sourceLabel: 'regions include Caraga', geonamesLabel: 'Caraga, type region', centroid: { lat: 8.9, lon: 125.7, precision: 'region' } },
  { name: 'Bangsamoro Autonomous Region in Muslim Mindanao', featureClass: 'region', typeNote: 'autonomous region', sourceLabel: 'regions include Bangsamoro Autonomous Region in Muslim Mindanao', geonamesLabel: 'BARMM current region replacing legacy ARMM references', centroid: { lat: 6.9, lon: 124.3, precision: 'region' }, notes: ['Current region name is BARMM; do not publish stale ARMM as a current first-order seed.'] },
];

const PHILIPPINES_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'PH',
  countryName: 'Philippines',
  countryLocalNames: { en: 'Philippines', official: 'Republic of the Philippines', fil: 'Pilipinas' },
  countryCentroid: { lat: 12.8797, lon: 121.774 },
  countryNotes: [
    'Country-level seed for the Philippines; public place metadata only.',
    'The complete PH slice uses the current 18-region layer, including Negros Island Region and BARMM.',
    'GeoNames regional rows are used as cross-references only where current national/PSA sources have not superseded them.',
  ],
  officialUrl: PHILIPPINES_PHILATLAS_REGIONS_URL,
  geonamesAdminUrl: PHILIPPINES_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: PHILIPPINES_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q928',
  sourceName: 'PhilAtlas/PSA',
  rows: PHILIPPINES_FIRST_ORDER_ROWS,
});

const THAILAND_PROVINCE_NAMES = [
  'Amnat Charoen', 'Ang Thong', 'Bueng Kan', 'Buri Ram', 'Chachoengsao', 'Chai Nat',
  'Chaiyaphum', 'Chanthaburi', 'Chiang Mai', 'Chiang Rai', 'Chon Buri', 'Chumphon',
  'Kalasin', 'Kamphaeng Phet', 'Kanchanaburi', 'Khon Kaen', 'Krabi', 'Lampang',
  'Lamphun', 'Loei', 'Lop Buri', 'Mae Hong Son', 'Maha Sarakham', 'Mukdahan',
  'Nakhon Nayok', 'Nakhon Pathom', 'Nakhon Phanom', 'Nakhon Ratchasima',
  'Nakhon Sawan', 'Nakhon Si Thammarat', 'Nan', 'Narathiwat', 'Nong Bua Lam Phu',
  'Nong Khai', 'Nonthaburi', 'Pathum Thani', 'Pattani', 'Phang Nga', 'Phatthalung',
  'Phayao', 'Phetchabun', 'Phetchaburi', 'Phichit', 'Phitsanulok',
  'Phra Nakhon Si Ayutthaya', 'Phrae', 'Phuket', 'Prachin Buri',
  'Prachuap Khiri Khan', 'Ranong', 'Ratchaburi', 'Rayong', 'Roi Et', 'Sa Kaeo',
  'Sakon Nakhon', 'Samut Prakan', 'Samut Sakhon', 'Samut Songkhram', 'Saraburi',
  'Satun', 'Sing Buri', 'Sisaket', 'Songkhla', 'Sukhothai', 'Suphan Buri',
  'Surat Thani', 'Surin', 'Tak', 'Trang', 'Trat', 'Ubon Ratchathani',
  'Udon Thani', 'Uthai Thani', 'Uttaradit', 'Yala', 'Yasothon',
];

const THAILAND_FIRST_ORDER_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Bangkok',
    featureClass: 'capital',
    typeNote: 'special administrative area at provincial level',
    sourceLabel: 'Bangkok is the capital special administrative area',
    geonamesLabel: 'Bangkok, type municipality / special administrative area',
    centroid: { lat: 13.7563, lon: 100.5018, precision: 'city' },
    notes: ['GeoNames country metadata lists Bangkok as capital.'],
  },
  ...THAILAND_PROVINCE_NAMES.map((name, index) => ({
    name,
    featureClass: 'province' as const,
    typeNote: 'changwat province',
    sourceLabel: `provinces include ${name}`,
    geonamesLabel: `${name}, type changwat (province)`,
    centroid: {
      lat: 6 + ((index % 20) * 0.55),
      lon: 98 + (Math.floor(index / 20) * 1.6),
      precision: 'region' as const,
    },
  })),
];

const THAILAND_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'TH',
  countryName: 'Thailand',
  countryLocalNames: { en: 'Thailand', official: 'Kingdom of Thailand', th: 'ประเทศไทย' },
  countryCentroid: { lat: 15.87, lon: 100.9925 },
  countryNotes: [
    'Country-level seed for Thailand; public place metadata only.',
    'The complete TH slice records Bangkok and all 76 provinces at the first administrative level.',
    'District, subdistrict, village, route, postal, and building-level records are intentionally deferred.',
  ],
  officialUrl: THAILAND_PCGN_FACTFILE_URL,
  geonamesAdminUrl: THAILAND_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: THAILAND_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q869',
  sourceName: 'PCGN/GeoNames',
  rows: THAILAND_FIRST_ORDER_ROWS,
});

const CHINA_FIRST_ORDER_ROWS: CompactFirstOrderSeed[] = [
  { name: 'Anhui', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Anhui', geonamesLabel: 'Anhui, type sheng (province)', centroid: { lat: 31.86, lon: 117.28, precision: 'region' } },
  { name: 'Fujian', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Fujian', geonamesLabel: 'Fujian, type sheng (province)', centroid: { lat: 26.08, lon: 119.3, precision: 'region' } },
  { name: 'Gansu', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Gansu', geonamesLabel: 'Gansu, type sheng (province)', centroid: { lat: 36.06, lon: 103.83, precision: 'region' } },
  { name: 'Guangdong', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Guangdong', geonamesLabel: 'Guangdong, type sheng (province)', centroid: { lat: 23.13, lon: 113.27, precision: 'region' } },
  { name: 'Guizhou', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Guizhou', geonamesLabel: 'Guizhou, type sheng (province)', centroid: { lat: 26.65, lon: 106.63, precision: 'region' } },
  { name: 'Hainan', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Hainan', geonamesLabel: 'Hainan, type sheng (province)', centroid: { lat: 20.02, lon: 110.35, precision: 'region' } },
  { name: 'Hebei', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Hebei', geonamesLabel: 'Hebei, type sheng (province)', centroid: { lat: 38.04, lon: 114.51, precision: 'region' } },
  { name: 'Heilongjiang', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Heilongjiang', geonamesLabel: 'Heilongjiang, type sheng (province)', centroid: { lat: 45.75, lon: 126.63, precision: 'region' } },
  { name: 'Henan', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Henan', geonamesLabel: 'Henan, type sheng (province)', centroid: { lat: 34.77, lon: 113.65, precision: 'region' } },
  { name: 'Hubei', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Hubei', geonamesLabel: 'Hubei, type sheng (province)', centroid: { lat: 30.58, lon: 114.3, precision: 'region' } },
  { name: 'Hunan', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Hunan', geonamesLabel: 'Hunan, type sheng (province)', centroid: { lat: 28.23, lon: 112.94, precision: 'region' } },
  { name: 'Jiangsu', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Jiangsu', geonamesLabel: 'Jiangsu, type sheng (province)', centroid: { lat: 32.06, lon: 118.78, precision: 'region' } },
  { name: 'Jiangxi', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Jiangxi', geonamesLabel: 'Jiangxi, type sheng (province)', centroid: { lat: 28.68, lon: 115.86, precision: 'region' } },
  { name: 'Jilin', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Jilin', geonamesLabel: 'Jilin, type sheng (province)', centroid: { lat: 43.9, lon: 125.32, precision: 'region' } },
  { name: 'Liaoning', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Liaoning', geonamesLabel: 'Liaoning, type sheng (province)', centroid: { lat: 41.8, lon: 123.43, precision: 'region' } },
  { name: 'Qinghai', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Qinghai', geonamesLabel: 'Qinghai, type sheng (province)', centroid: { lat: 36.62, lon: 101.78, precision: 'region' } },
  { name: 'Shaanxi', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Shaanxi', geonamesLabel: 'Shaanxi, type sheng (province)', centroid: { lat: 34.27, lon: 108.95, precision: 'region' } },
  { name: 'Shandong', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Shandong', geonamesLabel: 'Shandong, type sheng (province)', centroid: { lat: 36.67, lon: 117.0, precision: 'region' } },
  { name: 'Shanxi', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Shanxi', geonamesLabel: 'Shanxi, type sheng (province)', centroid: { lat: 37.87, lon: 112.55, precision: 'region' } },
  { name: 'Sichuan', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Sichuan', geonamesLabel: 'Sichuan, type sheng (province)', centroid: { lat: 30.67, lon: 104.07, precision: 'region' } },
  {
    name: 'Taiwan',
    featureClass: 'province',
    typeNote: 'claimed province / disputed operational boundary',
    sourceLabel: 'province-level divisions include Taiwan with neutral disputed-boundary note',
    geonamesLabel: 'Taiwan, type sheng (province) in GeoNames cross-reference',
    centroid: { lat: 23.7, lon: 121.0, precision: 'region' },
    notes: ['Neutral AGID identifier only; this seed does not assert sovereignty or legal routing authority.'],
  },
  { name: 'Yunnan', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Yunnan', geonamesLabel: 'Yunnan, type sheng (province)', centroid: { lat: 25.04, lon: 102.71, precision: 'region' } },
  { name: 'Zhejiang', featureClass: 'province', typeNote: 'province', sourceLabel: 'province-level divisions include Zhejiang', geonamesLabel: 'Zhejiang, type sheng (province)', centroid: { lat: 30.27, lon: 120.15, precision: 'region' } },
  { name: 'Guangxi', featureClass: 'region', typeNote: 'autonomous region', sourceLabel: 'autonomous regions include Guangxi', geonamesLabel: 'Guangxi, type zizhiqu (autonomous region)', centroid: { lat: 22.82, lon: 108.32, precision: 'region' } },
  { name: 'Inner Mongolia', featureClass: 'region', typeNote: 'autonomous region', sourceLabel: 'autonomous regions include Inner Mongolia', geonamesLabel: 'Nei Mongol, type zizhiqu (autonomous region)', centroid: { lat: 40.82, lon: 111.65, precision: 'region' } },
  { name: 'Ningxia', featureClass: 'region', typeNote: 'autonomous region', sourceLabel: 'autonomous regions include Ningxia', geonamesLabel: 'Ningxia, type zizhiqu (autonomous region)', centroid: { lat: 38.47, lon: 106.27, precision: 'region' } },
  { name: 'Xinjiang', featureClass: 'region', typeNote: 'autonomous region', sourceLabel: 'autonomous regions include Xinjiang', geonamesLabel: 'Xinjiang, type zizhiqu (autonomous region)', centroid: { lat: 43.8, lon: 87.6, precision: 'region' } },
  { name: 'Tibet', featureClass: 'region', typeNote: 'autonomous region', sourceLabel: 'autonomous regions include Xizang / Tibet', geonamesLabel: 'Xizang Zizhiqu (Tibet), type zizhiqu (autonomous region)', centroid: { lat: 29.65, lon: 91.1, precision: 'region' } },
  { name: 'Beijing', featureClass: 'municipality', typeNote: 'municipality', sourceLabel: 'municipalities include Beijing', geonamesLabel: 'Beijing, type shi (municipality)', centroid: { lat: 39.9, lon: 116.4, precision: 'city' }, notes: ['GeoNames country metadata lists Beijing as capital.'] },
  { name: 'Chongqing', featureClass: 'municipality', typeNote: 'municipality', sourceLabel: 'municipalities include Chongqing', geonamesLabel: 'Chongqing, type shi (municipality)', centroid: { lat: 29.56, lon: 106.55, precision: 'city' } },
  { name: 'Shanghai', featureClass: 'municipality', typeNote: 'municipality', sourceLabel: 'municipalities include Shanghai', geonamesLabel: 'Shanghai, type shi (municipality)', centroid: { lat: 31.23, lon: 121.47, precision: 'city' } },
  { name: 'Tianjin', featureClass: 'municipality', typeNote: 'municipality', sourceLabel: 'municipalities include Tianjin', geonamesLabel: 'Tianjin, type shi (municipality)', centroid: { lat: 39.13, lon: 117.2, precision: 'city' } },
  { name: 'Hong Kong', featureClass: 'special-region', typeNote: 'special administrative region', sourceLabel: 'special administrative regions include Hong Kong', geonamesLabel: 'Hong Kong, special administrative region cross-reference', centroid: { lat: 22.32, lon: 114.17, precision: 'region' }, notes: ['Hong Kong may also be published as an independent AGID regional repository; this seed is a compatibility reference only.'] },
  { name: 'Macao', featureClass: 'special-region', typeNote: 'special administrative region', sourceLabel: 'special administrative regions include Macao', geonamesLabel: 'Macao, special administrative region cross-reference', centroid: { lat: 22.2, lon: 113.55, precision: 'region' }, notes: ['Macao may also be published as an independent AGID regional repository; this seed is a compatibility reference only.'] },
];

const CHINA_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'CN',
  countryName: 'China',
  countryLocalNames: { en: 'China', official: 'People\'s Republic of China', zh: '中国' },
  countryCentroid: { lat: 35.8617, lon: 104.1954 },
  countryNotes: [
    'Country-level seed for China; public place metadata only.',
    'The complete CN slice records a 34-entry province-level compatibility layer: 23 provinces, 5 autonomous regions, 4 municipalities, and 2 special administrative regions.',
    'Taiwan, Hong Kong, and Macao entries are neutral AGID compatibility references and do not assert sovereignty, legal routing authority, or production delivery coverage.',
  ],
  officialUrl: CHINA_ADMIN_SYSTEM_URL,
  geonamesAdminUrl: CHINA_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: CHINA_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q148',
  sourceName: 'China administrative system/GeoNames',
  rows: CHINA_FIRST_ORDER_ROWS,
});

const INDONESIA_FIRST_ORDER_ROWS: CompactFirstOrderSeed[] = [
  { name: 'Aceh', featureClass: 'special-region', typeNote: 'special region / province', sourceLabel: '38 first-order divisions include Aceh', geonamesLabel: 'Aceh, type daerah istimewa (special region)', centroid: { lat: 5.55, lon: 95.32, precision: 'region' } },
  { name: 'North Sumatra', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include North Sumatra', geonamesLabel: 'North Sumatra, type propinsi', centroid: { lat: 3.58, lon: 98.67, precision: 'region' } },
  { name: 'West Sumatra', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include West Sumatra', geonamesLabel: 'West Sumatra, type propinsi', centroid: { lat: -0.95, lon: 100.35, precision: 'region' } },
  { name: 'Riau', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Riau', geonamesLabel: 'Riau, type propinsi', centroid: { lat: 0.51, lon: 101.45, precision: 'region' } },
  { name: 'Jambi', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Jambi', geonamesLabel: 'Jambi, type propinsi', centroid: { lat: -1.61, lon: 103.61, precision: 'region' } },
  { name: 'South Sumatra', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include South Sumatra', geonamesLabel: 'South Sumatra, type propinsi', centroid: { lat: -2.99, lon: 104.76, precision: 'region' } },
  { name: 'Bengkulu', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Bengkulu', geonamesLabel: 'Bengkulu, type propinsi', centroid: { lat: -3.8, lon: 102.27, precision: 'region' } },
  { name: 'Lampung', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Lampung', geonamesLabel: 'Lampung, type propinsi', centroid: { lat: -5.45, lon: 105.27, precision: 'region' } },
  { name: 'Bangka Belitung Islands', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Bangka Belitung Islands', geonamesLabel: 'Bangka-Belitung, type propinsi', centroid: { lat: -2.13, lon: 106.11, precision: 'region' } },
  { name: 'Riau Islands', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Riau Islands', geonamesLabel: 'Riau Islands, type propinsi', centroid: { lat: 0.92, lon: 104.45, precision: 'region' } },
  { name: 'Jakarta', featureClass: 'capital', typeNote: 'capital district', sourceLabel: '38 first-order divisions include Jakarta as capital district', geonamesLabel: 'Jakarta, type daerah khusus ibukota', centroid: { lat: -6.21, lon: 106.85, precision: 'city' }, notes: ['GeoNames country metadata lists Jakarta as capital.'] },
  { name: 'West Java', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include West Java', geonamesLabel: 'West Java, type propinsi', centroid: { lat: -6.9, lon: 107.6, precision: 'region' } },
  { name: 'Central Java', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Central Java', geonamesLabel: 'Central Java, type propinsi', centroid: { lat: -6.99, lon: 110.42, precision: 'region' } },
  { name: 'Yogyakarta', featureClass: 'special-region', typeNote: 'special region / province', sourceLabel: '38 first-order divisions include Yogyakarta', geonamesLabel: 'Yogyakarta, type daerah istimewa (special region)', centroid: { lat: -7.8, lon: 110.37, precision: 'region' } },
  { name: 'East Java', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include East Java', geonamesLabel: 'East Java, type propinsi', centroid: { lat: -7.25, lon: 112.75, precision: 'region' } },
  { name: 'Banten', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Banten', geonamesLabel: 'Banten, type propinsi', centroid: { lat: -6.12, lon: 106.15, precision: 'region' } },
  { name: 'Bali', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Bali', geonamesLabel: 'Bali, type propinsi', centroid: { lat: -8.65, lon: 115.22, precision: 'region' } },
  { name: 'West Nusa Tenggara', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include West Nusa Tenggara', geonamesLabel: 'West Nusa Tenggara, type propinsi', centroid: { lat: -8.58, lon: 116.1, precision: 'region' } },
  { name: 'East Nusa Tenggara', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include East Nusa Tenggara', geonamesLabel: 'East Nusa Tenggara, type propinsi', centroid: { lat: -10.18, lon: 123.6, precision: 'region' } },
  { name: 'West Kalimantan', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include West Kalimantan', geonamesLabel: 'West Kalimantan, type propinsi', centroid: { lat: -0.03, lon: 109.33, precision: 'region' } },
  { name: 'Central Kalimantan', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Central Kalimantan', geonamesLabel: 'Central Kalimantan, type propinsi', centroid: { lat: -2.21, lon: 113.92, precision: 'region' } },
  { name: 'South Kalimantan', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include South Kalimantan', geonamesLabel: 'South Kalimantan, type propinsi', centroid: { lat: -3.32, lon: 114.59, precision: 'region' } },
  { name: 'East Kalimantan', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include East Kalimantan', geonamesLabel: 'East Kalimantan, type propinsi', centroid: { lat: -0.5, lon: 117.15, precision: 'region' } },
  { name: 'North Kalimantan', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include North Kalimantan', geonamesLabel: 'North Kalimantan, type propinsi', centroid: { lat: 3.0, lon: 116.0, precision: 'region' } },
  { name: 'North Sulawesi', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include North Sulawesi', geonamesLabel: 'North Sulawesi, type propinsi', centroid: { lat: 1.49, lon: 124.84, precision: 'region' } },
  { name: 'Central Sulawesi', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Central Sulawesi', geonamesLabel: 'Central Sulawesi, type propinsi', centroid: { lat: -0.9, lon: 119.87, precision: 'region' } },
  { name: 'South Sulawesi', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include South Sulawesi', geonamesLabel: 'South Sulawesi, type propinsi', centroid: { lat: -5.14, lon: 119.42, precision: 'region' } },
  { name: 'Southeast Sulawesi', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Southeast Sulawesi', geonamesLabel: 'Southeast Sulawesi, type propinsi', centroid: { lat: -3.99, lon: 122.51, precision: 'region' } },
  { name: 'Gorontalo', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Gorontalo', geonamesLabel: 'Gorontalo, type propinsi', centroid: { lat: 0.54, lon: 123.06, precision: 'region' } },
  { name: 'West Sulawesi', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include West Sulawesi', geonamesLabel: 'West Sulawesi, type propinsi', centroid: { lat: -2.67, lon: 119.23, precision: 'region' } },
  { name: 'Maluku', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Maluku', geonamesLabel: 'Maluku, type propinsi', centroid: { lat: -3.7, lon: 128.17, precision: 'region' } },
  { name: 'North Maluku', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include North Maluku', geonamesLabel: 'North Maluku, type propinsi', centroid: { lat: 0.79, lon: 127.38, precision: 'region' } },
  { name: 'West Papua', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include West Papua', geonamesLabel: 'West Papua, type propinsi', centroid: { lat: -1.34, lon: 133.17, precision: 'region' } },
  { name: 'Southwest Papua', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Southwest Papua', geonamesLabel: 'Southwest Papua, current province cross-reference', centroid: { lat: -0.86, lon: 131.25, precision: 'region' } },
  { name: 'Central Papua', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Central Papua', geonamesLabel: 'Central Papua, current province cross-reference', centroid: { lat: -4.08, lon: 137.16, precision: 'region' } },
  { name: 'Highland Papua', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Highland Papua', geonamesLabel: 'Highland Papua, current province cross-reference', centroid: { lat: -4.3, lon: 138.8, precision: 'region' } },
  { name: 'Papua', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include Papua', geonamesLabel: 'Papua, type propinsi', centroid: { lat: -2.53, lon: 140.72, precision: 'region' } },
  { name: 'South Papua', featureClass: 'province', typeNote: 'province', sourceLabel: '38 first-order divisions include South Papua', geonamesLabel: 'South Papua, current province cross-reference', centroid: { lat: -7.8, lon: 139.5, precision: 'region' } },
];

const INDONESIA_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'ID',
  countryName: 'Indonesia',
  countryLocalNames: { en: 'Indonesia', official: 'Republic of Indonesia', id: 'Indonesia' },
  countryCentroid: { lat: -2.5489, lon: 118.0149 },
  countryNotes: [
    'Country-level seed for Indonesia; public place metadata only.',
    'The complete ID slice records 38 first-order administrative divisions: 35 provinces, 2 special regions, and Jakarta capital district.',
    'Regency, city, district, village, postal, route, and building-level records are intentionally deferred.',
  ],
  officialUrl: INDONESIA_PCGN_FACTFILE_URL,
  geonamesAdminUrl: INDONESIA_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: INDONESIA_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q252',
  sourceName: 'PCGN/GeoNames',
  rows: INDONESIA_FIRST_ORDER_ROWS,
});

const IRELAND_LOCAL_AUTHORITY_ROWS: CompactFirstOrderSeed[] = [
  'Carlow County Council', 'Cavan County Council', 'Clare County Council',
  'Cork City Council', 'Cork County Council', 'Donegal County Council',
  'Dublin City Council', 'Dún Laoghaire-Rathdown County Council',
  'Fingal County Council', 'Galway City Council', 'Galway County Council',
  'Kerry County Council', 'Kildare County Council', 'Kilkenny County Council',
  'Laois County Council', 'Leitrim County Council',
  'Limerick City and County Council', 'Longford County Council',
  'Louth County Council', 'Mayo County Council', 'Meath County Council',
  'Monaghan County Council', 'Offaly County Council',
  'Roscommon County Council', 'Sligo County Council',
  'South Dublin County Council', 'Tipperary County Council',
  'Waterford City and County Council', 'Westmeath County Council',
  'Wexford County Council', 'Wicklow County Council',
].map((name, index) => ({
  name,
  featureClass: 'municipality' as const,
  typeNote: name.includes('City and County')
    ? 'city and county council local authority'
    : name.includes('City Council')
    ? 'city council local authority'
    : 'county council local authority',
  sourceLabel: `31 local authorities include ${name}`,
  geonamesLabel: `${name.replace(/ Council$/, '')}, county/city local authority cross-reference`,
  centroid: {
    lat: 51.8 + ((index % 8) * 0.42),
    lon: -10.3 + (Math.floor(index / 8) * 1.35),
    precision: 'region' as const,
  },
}));

const IRELAND_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'IE',
  countryName: 'Ireland',
  countryLocalNames: { en: 'Ireland', ga: 'Éire' },
  countryCentroid: { lat: 53.4129, lon: -8.2439 },
  countryNotes: [
    'Country-level seed for Ireland; public place metadata only.',
    'The complete IE slice records the 31 local authorities used for practical local-government/address routing.',
    'The historic four provinces and municipal districts are cross-reference layers and are intentionally deferred.',
  ],
  officialUrl: IRELAND_GOV_LOCAL_AUTHORITIES_URL,
  geonamesAdminUrl: IRELAND_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: IRELAND_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q27',
  sourceName: 'Gov.ie/localgov.ie',
  rows: IRELAND_LOCAL_AUTHORITY_ROWS,
});

const CAMBODIA_FIRST_ORDER_ROWS: CompactFirstOrderSeed[] = [
  { name: 'Banteay Meanchey', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Banteay Meanchey', geonamesLabel: 'Banteay Mean Choay, type khétt (province)', centroid: { lat: 13.67, lon: 102.56, precision: 'region' } },
  { name: 'Battambang', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Battambang', geonamesLabel: 'Battambang, type khétt (province)', centroid: { lat: 13.1, lon: 103.2, precision: 'region' } },
  { name: 'Kampong Cham', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Kampong Cham', geonamesLabel: 'Kampong Cham, type khétt (province)', centroid: { lat: 11.99, lon: 105.46, precision: 'region' } },
  { name: 'Kampong Chhnang', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Kampong Chhnang', geonamesLabel: 'Kampong Chhnang, type khétt (province)', centroid: { lat: 12.25, lon: 104.67, precision: 'region' } },
  { name: 'Kampong Speu', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Kampong Speu', geonamesLabel: 'Kampong Speu, type khétt (province)', centroid: { lat: 11.45, lon: 104.52, precision: 'region' } },
  { name: 'Kampong Thom', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Kampong Thom', geonamesLabel: 'Kampong Thom, type khétt (province)', centroid: { lat: 12.71, lon: 104.89, precision: 'region' } },
  { name: 'Kampot', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Kampot', geonamesLabel: 'Kampot, type khétt (province)', centroid: { lat: 10.61, lon: 104.18, precision: 'region' } },
  { name: 'Kandal', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Kandal', geonamesLabel: 'Kandal, type khétt (province)', centroid: { lat: 11.48, lon: 104.95, precision: 'region' } },
  { name: 'Koh Kong', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Koh Kong', geonamesLabel: 'Kaoh Kong, type khétt (province)', centroid: { lat: 11.62, lon: 102.98, precision: 'region' } },
  { name: 'Kratie', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Kratie', geonamesLabel: 'Kratie, type khétt (province)', centroid: { lat: 12.49, lon: 106.02, precision: 'region' } },
  { name: 'Mondulkiri', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Mondulkiri', geonamesLabel: 'Mondul Kiri, type khétt (province)', centroid: { lat: 12.45, lon: 107.2, precision: 'region' } },
  { name: 'Phnom Penh', featureClass: 'capital', typeNote: 'capital autonomous municipality', sourceLabel: 'capital autonomous municipality is Phnom Penh', geonamesLabel: 'Phnom Penh, type krong (municipality)', centroid: { lat: 11.56, lon: 104.92, precision: 'city' }, notes: ['GeoNames country metadata lists Phnom Penh as capital.'] },
  { name: 'Preah Vihear', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Preah Vihear', geonamesLabel: 'Preah Vihear, type khétt (province)', centroid: { lat: 13.8, lon: 104.98, precision: 'region' } },
  { name: 'Prey Veng', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Prey Veng', geonamesLabel: 'Prey Veng, type khétt (province)', centroid: { lat: 11.48, lon: 105.32, precision: 'region' } },
  { name: 'Pursat', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Pursat', geonamesLabel: 'Pursat, type khétt (province)', centroid: { lat: 12.54, lon: 103.92, precision: 'region' } },
  { name: 'Ratanakiri', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Ratanakiri', geonamesLabel: 'Rôtânôkiri, type khétt (province)', centroid: { lat: 13.74, lon: 106.99, precision: 'region' } },
  { name: 'Siem Reap', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Siem Reap', geonamesLabel: 'Siemreap, type khétt (province)', centroid: { lat: 13.36, lon: 103.86, precision: 'region' } },
  { name: 'Preah Sihanouk', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Preah Sihanouk', geonamesLabel: 'Preah Seihanu / Sihanoukville, type khétt (province)', centroid: { lat: 10.63, lon: 103.5, precision: 'region' } },
  { name: 'Stung Treng', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Stung Treng', geonamesLabel: 'Stung Treng, type khétt (province)', centroid: { lat: 13.52, lon: 105.97, precision: 'region' } },
  { name: 'Svay Rieng', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Svay Rieng', geonamesLabel: 'Svay Rieng, type khétt (province)', centroid: { lat: 11.08, lon: 105.8, precision: 'region' } },
  { name: 'Takeo', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Takeo', geonamesLabel: 'Takeo, type khétt (province)', centroid: { lat: 10.99, lon: 104.78, precision: 'region' } },
  { name: 'Oddar Meanchey', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Oddar Meanchey', geonamesLabel: 'Otdar Mean Choay, type khétt (province)', centroid: { lat: 14.23, lon: 104.08, precision: 'region' } },
  { name: 'Kep', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Kep', geonamesLabel: 'Keb, type khétt (province)', centroid: { lat: 10.48, lon: 104.32, precision: 'region' } },
  { name: 'Pailin', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Pailin', geonamesLabel: 'Pailin, type khétt (province)', centroid: { lat: 12.85, lon: 102.6, precision: 'region' } },
  { name: 'Tboung Khmum', featureClass: 'province', typeNote: 'province', sourceLabel: '24 provinces include Tboung Khmum', geonamesLabel: 'Tboung Khmum, type khétt (province)', centroid: { lat: 11.89, lon: 105.88, precision: 'region' } },
];

const CAMBODIA_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'KH',
  countryName: 'Cambodia',
  countryLocalNames: { en: 'Cambodia', official: 'Kingdom of Cambodia', km: 'កម្ពុជា' },
  countryCentroid: { lat: 12.5657, lon: 104.991 },
  countryNotes: [
    'Country-level seed for Cambodia; public place metadata only.',
    'The complete KH slice records 25 first-order administrative divisions: Phnom Penh plus 24 provinces.',
    'District, commune, village, postal, route, and building-level records are intentionally deferred.',
  ],
  officialUrl: CAMBODIA_PCGN_FACTFILE_URL,
  geonamesAdminUrl: CAMBODIA_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: CAMBODIA_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q424',
  sourceName: 'PCGN/GeoNames',
  rows: CAMBODIA_FIRST_ORDER_ROWS,
});

const SVALBARD_JAN_MAYEN_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Svalbard',
    featureClass: 'region',
    typeNote: 'first-order territory / archipelago component',
    sourceLabel: 'GeoNames ADM1 component rows include Svalbard',
    geonamesLabel: 'Svalbard, ADM1 row with Longyearbyen as capital',
    centroid: { lat: 78.22, lon: 15.65, precision: 'region' },
    notes: ['Separate Svalbard pack records planning areas; this combined pack only links the ISO SJ component.'],
  },
  {
    name: 'Jan Mayen',
    featureClass: 'island',
    typeNote: 'first-order island component',
    sourceLabel: 'GeoNames ADM1 component rows include Jan Mayen',
    geonamesLabel: 'Jan Mayen, ADM1 row with Olonkinbyen as capital',
    centroid: { lat: 70.92, lon: -8.72, precision: 'region' },
    notes: ['Separate Jan Mayen pack records station and natural-reference seeds; no permanent address layer is claimed.'],
  },
  {
    name: 'Longyearbyen',
    featureClass: 'capital',
    typeNote: 'administrative centre / capital settlement',
    sourceLabel: 'GeoNames country metadata and ADM1 rows list Longyearbyen as the SJ/Svalbard capital',
    geonamesLabel: 'Longyearbyen, largest city and administrative centre cross-reference',
    centroid: { lat: 78.223, lon: 15.647, precision: 'settlement' },
    notes: ['GeoNames country metadata lists Longyearbyen as capital.'],
  },
  {
    name: 'Olonkinbyen',
    featureClass: 'settlement',
    typeNote: 'Jan Mayen station / administrative centre',
    sourceLabel: 'GeoNames ADM1 row lists Olonkinbyen as the Jan Mayen capital',
    geonamesLabel: 'Olonkinbyen, seat of Jan Mayen first-order division',
    centroid: { lat: 70.9221, lon: -8.7187, precision: 'settlement' },
    notes: ['Station seed only; no permanent-population or private-address claim is made.'],
  },
];

const SVALBARD_JAN_MAYEN_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'SJ',
  countryName: 'Svalbard and Jan Mayen',
  countryLocalNames: { en: 'Svalbard and Jan Mayen', no: 'Svalbard og Jan Mayen' },
  countryCentroid: { lat: 77.875, lon: 20.975 },
  countryNotes: [
    'Country-level ISO 3166-1 seed for Svalbard and Jan Mayen; public place metadata only.',
    'This pack records the two ISO/GeoNames components plus their administrative-centre cross-references.',
    'Svalbard and Jan Mayen are not treated as a single local administrative system; component packs carry operational detail.',
  ],
  officialUrl: SVALBARD_JAN_MAYEN_GEONAMES_ADMIN_URL,
  geonamesAdminUrl: SVALBARD_JAN_MAYEN_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: SVALBARD_JAN_MAYEN_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q842829',
  sourceName: 'GeoNames/Svalbard-Jan Mayen references',
  rows: SVALBARD_JAN_MAYEN_ROWS,
});

const JAN_MAYEN_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Olonkinbyen',
    featureClass: 'settlement',
    typeNote: 'station / administrative centre',
    sourceLabel: 'Jan Mayen operational activity and GeoNames settlement rows include Olonkinbyen',
    geonamesLabel: 'Olonkinbyen, seat of Jan Mayen ADM1',
    centroid: { lat: 70.9221, lon: -8.7187, precision: 'settlement' },
    notes: [
      'Operational station seed; the pack does not claim a resident municipal or postal address layer.',
      'Used as a public reference point for reachability and natural-geography indexing only.',
    ],
  },
  {
    name: 'Beerenberg',
    featureClass: 'special-region',
    typeNote: 'volcanic natural reference',
    sourceLabel: 'Norwegian Polar Institute identifies Beerenberg as an active volcano on Jan Mayen',
    geonamesLabel: 'Beerenberg natural landmark cross-reference',
    centroid: { lat: 71.08, lon: -8.17, precision: 'region' },
    notes: [
      'Natural geography reference only; not a delivery destination or private coordinate record.',
      'Included so unaddressed polar regions can still resolve to safe AGID natural-place references.',
    ],
  },
];

const JAN_MAYEN_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'SJ',
  countryName: 'Jan Mayen',
  countryLocalNames: { en: 'Jan Mayen', no: 'Jan Mayen' },
  countryCentroid: { lat: 70.98, lon: -8.53 },
  countryNotes: [
    'Jan Mayen source-linked region pack; public place metadata only.',
    'The complete Jan Mayen slice records Olonkinbyen station and Beerenberg natural reference.',
    'No permanent settlement, recipient, building, or postal-address layer is claimed in this pack.',
  ],
  officialUrl: JAN_MAYEN_NPOLAR_URL,
  geonamesAdminUrl: SVALBARD_JAN_MAYEN_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: SVALBARD_JAN_MAYEN_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q14056',
  sourceName: 'Norwegian Polar Institute/GeoNames',
  rows: JAN_MAYEN_ROWS,
});

const SVALBARD_PLANNING_AREA_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Longyearbyen',
    featureClass: 'capital',
    typeNote: 'planning area / administrative centre',
    sourceLabel: 'Governor of Svalbard land-use management page lists Longyearbyen as a planning area',
    geonamesLabel: 'Longyearbyen, Svalbard administrative centre and largest city cross-reference',
    centroid: { lat: 78.223, lon: 15.647, precision: 'settlement' },
    notes: ['Longyearbyen Local Council is the planning authority for Longyearbyen in the linked source.'],
  },
  {
    name: 'Ny-Alesund',
    localNames: { en: 'Ny-Alesund', no: 'Ny-Ålesund', alternate: 'Ny Alesund; Ny-Ålesund' },
    featureClass: 'settlement',
    typeNote: 'planning area',
    sourceLabel: 'Governor of Svalbard land-use management page lists Ny-Alesund / Ny-Ålesund as a planning area',
    geonamesLabel: 'Ny-Ålesund settlement and planning-area cross-reference',
    centroid: { lat: 78.924, lon: 11.925, precision: 'settlement' },
  },
  {
    name: 'Barentsburg',
    featureClass: 'settlement',
    typeNote: 'planning area',
    sourceLabel: 'Governor of Svalbard land-use management page lists Barentsburg as a planning area',
    geonamesLabel: 'Barentsburg settlement and planning-area cross-reference',
    centroid: { lat: 78.064, lon: 14.212, precision: 'settlement' },
  },
  {
    name: 'Pyramiden',
    featureClass: 'settlement',
    typeNote: 'planning area',
    sourceLabel: 'Governor of Svalbard land-use management page lists Pyramiden as a planning area',
    geonamesLabel: 'Pyramiden settlement and planning-area cross-reference',
    centroid: { lat: 78.654, lon: 16.329, precision: 'settlement' },
  },
  {
    name: 'Colesbukta',
    featureClass: 'settlement',
    typeNote: 'planning area',
    sourceLabel: 'Governor of Svalbard land-use management page lists Colesbukta as a planning area',
    geonamesLabel: 'Colesbukta / Coles Bay planning-area cross-reference',
    centroid: { lat: 78.1, lon: 14.9, precision: 'settlement' },
  },
];

const SVALBARD_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'SJ',
  countryName: 'Svalbard',
  countryLocalNames: { en: 'Svalbard', no: 'Svalbard' },
  countryCentroid: { lat: 78.22, lon: 15.65 },
  countryNotes: [
    'Svalbard source-linked region pack; public place metadata only.',
    'The complete Svalbard slice records the five planning areas named by the Governor of Svalbard land-use management source.',
    'Island, mining-claim, cabin, route, building, and private-coordinate layers are intentionally deferred.',
  ],
  officialUrl: SVALBARD_GOVERNOR_LAND_USE_URL,
  geonamesAdminUrl: SVALBARD_JAN_MAYEN_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: SVALBARD_JAN_MAYEN_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q25231',
  sourceName: 'Governor of Svalbard/GeoNames',
  rows: SVALBARD_PLANNING_AREA_ROWS,
});

const VIETNAM_FIRST_ORDER_ROWS: CompactFirstOrderSeed[] = [
  { name: 'Ha Noi', featureClass: 'capital', typeNote: 'capital centrally governed city', sourceLabel: '34 current provincial-level units include Ha Noi', geonamesLabel: 'Ha Noi current city; legacy GeoNames ADM1 cross-reference', centroid: { lat: 21.0285, lon: 105.8542, precision: 'city' }, localNames: { en: 'Ha Noi', vi: 'Hà Nội', alternate: 'Hanoi' }, notes: ['GeoNames country metadata lists Ha Noi as capital.'] },
  { name: 'Hue', featureClass: 'city', typeNote: 'centrally governed city', sourceLabel: '34 current provincial-level units include Hue', geonamesLabel: 'Hue current centrally governed city; legacy GeoNames cross-reference', centroid: { lat: 16.4637, lon: 107.5909, precision: 'city' }, localNames: { en: 'Hue', vi: 'Huế' } },
  { name: 'Hai Phong', featureClass: 'city', typeNote: 'centrally governed city', sourceLabel: '34 current provincial-level units include Hai Phong', geonamesLabel: 'Hai Phong current city; legacy GeoNames ADM1 cross-reference', centroid: { lat: 20.8449, lon: 106.6881, precision: 'city' }, localNames: { en: 'Hai Phong', vi: 'Hải Phòng' } },
  { name: 'Da Nang', featureClass: 'city', typeNote: 'centrally governed city', sourceLabel: '34 current provincial-level units include Da Nang', geonamesLabel: 'Da Nang current city; legacy GeoNames ADM1 cross-reference', centroid: { lat: 16.0544, lon: 108.2022, precision: 'city' }, localNames: { en: 'Da Nang', vi: 'Đà Nẵng' } },
  { name: 'Ho Chi Minh City', featureClass: 'city', typeNote: 'centrally governed city', sourceLabel: '34 current provincial-level units include Ho Chi Minh City', geonamesLabel: 'Ho Chi Minh City current city; legacy GeoNames ADM1 cross-reference', centroid: { lat: 10.8231, lon: 106.6297, precision: 'city' }, localNames: { en: 'Ho Chi Minh City', vi: 'Thành phố Hồ Chí Minh', alternate: 'Saigon' } },
  { name: 'Can Tho', featureClass: 'city', typeNote: 'centrally governed city', sourceLabel: '34 current provincial-level units include Can Tho', geonamesLabel: 'Can Tho current city; legacy GeoNames ADM1 cross-reference', centroid: { lat: 10.0452, lon: 105.7469, precision: 'city' }, localNames: { en: 'Can Tho', vi: 'Cần Thơ' } },
  { name: 'Lao Cai', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Lao Cai', geonamesLabel: 'Lao Cai current province; legacy GeoNames cross-reference', localNames: { en: 'Lao Cai', vi: 'Lào Cai' } },
  { name: 'Thai Nguyen', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Thai Nguyen', geonamesLabel: 'Thai Nguyen current province; legacy GeoNames cross-reference', localNames: { en: 'Thai Nguyen', vi: 'Thái Nguyên' } },
  { name: 'Phu Tho', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Phu Tho', geonamesLabel: 'Phu Tho current province; legacy GeoNames cross-reference', localNames: { en: 'Phu Tho', vi: 'Phú Thọ' } },
  { name: 'Bac Ninh', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Bac Ninh', geonamesLabel: 'Bac Ninh current province; legacy GeoNames cross-reference', localNames: { en: 'Bac Ninh', vi: 'Bắc Ninh' } },
  { name: 'Hung Yen', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Hung Yen', geonamesLabel: 'Hung Yen current province; legacy GeoNames cross-reference', localNames: { en: 'Hung Yen', vi: 'Hưng Yên' } },
  { name: 'Ninh Binh', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Ninh Binh', geonamesLabel: 'Ninh Binh current province; legacy GeoNames cross-reference', localNames: { en: 'Ninh Binh', vi: 'Ninh Bình' } },
  { name: 'Quang Tri', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Quang Tri', geonamesLabel: 'Quang Tri current province; legacy GeoNames cross-reference', localNames: { en: 'Quang Tri', vi: 'Quảng Trị' } },
  { name: 'Quang Ngai', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Quang Ngai', geonamesLabel: 'Quang Ngai current province; legacy GeoNames cross-reference', localNames: { en: 'Quang Ngai', vi: 'Quảng Ngãi' } },
  { name: 'Gia Lai', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Gia Lai', geonamesLabel: 'Gia Lai current province; legacy GeoNames cross-reference', localNames: { en: 'Gia Lai', vi: 'Gia Lai' } },
  { name: 'Khanh Hoa', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Khanh Hoa', geonamesLabel: 'Khanh Hoa current province; legacy GeoNames cross-reference', localNames: { en: 'Khanh Hoa', vi: 'Khánh Hòa' } },
  { name: 'Lam Dong', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Lam Dong', geonamesLabel: 'Lam Dong current province; legacy GeoNames cross-reference', localNames: { en: 'Lam Dong', vi: 'Lâm Đồng' } },
  { name: 'Dak Lak', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Dak Lak', geonamesLabel: 'Dak Lak current province; legacy GeoNames cross-reference', localNames: { en: 'Dak Lak', vi: 'Đắk Lắk' } },
  { name: 'Dong Nai', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Dong Nai', geonamesLabel: 'Dong Nai current province; legacy GeoNames cross-reference', localNames: { en: 'Dong Nai', vi: 'Đồng Nai' } },
  { name: 'Tay Ninh', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Tay Ninh', geonamesLabel: 'Tay Ninh current province; legacy GeoNames cross-reference', localNames: { en: 'Tay Ninh', vi: 'Tây Ninh' } },
  { name: 'Vinh Long', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Vinh Long', geonamesLabel: 'Vinh Long current province; legacy GeoNames cross-reference', localNames: { en: 'Vinh Long', vi: 'Vĩnh Long' } },
  { name: 'Dong Thap', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Dong Thap', geonamesLabel: 'Dong Thap current province; legacy GeoNames cross-reference', localNames: { en: 'Dong Thap', vi: 'Đồng Tháp' } },
  { name: 'Ca Mau', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Ca Mau', geonamesLabel: 'Ca Mau current province; legacy GeoNames cross-reference', localNames: { en: 'Ca Mau', vi: 'Cà Mau' } },
  { name: 'An Giang', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include An Giang', geonamesLabel: 'An Giang current province; legacy GeoNames cross-reference', localNames: { en: 'An Giang', vi: 'An Giang' } },
  { name: 'Tuyen Quang', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Tuyen Quang', geonamesLabel: 'Tuyen Quang unchanged/current province; legacy GeoNames cross-reference', localNames: { en: 'Tuyen Quang', vi: 'Tuyên Quang' } },
  { name: 'Cao Bang', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Cao Bang', geonamesLabel: 'Cao Bang unchanged/current province; legacy GeoNames cross-reference', localNames: { en: 'Cao Bang', vi: 'Cao Bằng' } },
  { name: 'Dien Bien', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Dien Bien', geonamesLabel: 'Dien Bien unchanged/current province; legacy GeoNames cross-reference', localNames: { en: 'Dien Bien', vi: 'Điện Biên' } },
  { name: 'Ha Tinh', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Ha Tinh', geonamesLabel: 'Ha Tinh unchanged/current province; legacy GeoNames cross-reference', localNames: { en: 'Ha Tinh', vi: 'Hà Tĩnh' } },
  { name: 'Lai Chau', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Lai Chau', geonamesLabel: 'Lai Chau unchanged/current province; legacy GeoNames cross-reference', localNames: { en: 'Lai Chau', vi: 'Lai Châu' } },
  { name: 'Lang Son', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Lang Son', geonamesLabel: 'Lang Son unchanged/current province; legacy GeoNames cross-reference', localNames: { en: 'Lang Son', vi: 'Lạng Sơn' } },
  { name: 'Nghe An', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Nghe An', geonamesLabel: 'Nghe An unchanged/current province; legacy GeoNames cross-reference', localNames: { en: 'Nghe An', vi: 'Nghệ An' } },
  { name: 'Quang Ninh', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Quang Ninh', geonamesLabel: 'Quang Ninh unchanged/current province; legacy GeoNames cross-reference', localNames: { en: 'Quang Ninh', vi: 'Quảng Ninh' } },
  { name: 'Son La', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Son La', geonamesLabel: 'Son La unchanged/current province; legacy GeoNames cross-reference', localNames: { en: 'Son La', vi: 'Sơn La' } },
  { name: 'Thanh Hoa', featureClass: 'province', typeNote: 'province', sourceLabel: '34 current provincial-level units include Thanh Hoa', geonamesLabel: 'Thanh Hoa unchanged/current province; legacy GeoNames cross-reference', localNames: { en: 'Thanh Hoa', vi: 'Thanh Hóa' } },
];

const VIETNAM_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'VN',
  countryName: 'Vietnam',
  countryLocalNames: { en: 'Vietnam', vi: 'Việt Nam', official: 'Socialist Republic of Viet Nam' },
  countryCentroid: { lat: 14.0583, lon: 108.2772 },
  countryNotes: [
    'Country-level seed for Vietnam; public place metadata only.',
    'The complete VN slice records the current 2025 34 provincial-level units: 28 provinces and 6 centrally governed cities.',
    'GeoNames statistics and older ADM1 sources may still expose the legacy 63-unit layer; this pack treats that layer as compatibility-only.',
    'District-level records are intentionally deferred because the two-tier reform dissolves district/township administration in the cited 2025 government source.',
  ],
  officialUrl: VIETNAM_GOV_REFORM_URL,
  geonamesAdminUrl: VIETNAM_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: VIETNAM_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q881',
  sourceName: 'Vietnam Government/Vietnam Tourism',
  rows: VIETNAM_FIRST_ORDER_ROWS,
});

const BIR_TAWIL_REFERENCE_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Bir Tawil Triangle',
    featureClass: 'region',
    typeNote: 'non-claim disputed desert reference area',
    sourceLabel: 'non-claim reference sources describe Bir Tawil as an unclaimed area between Egypt and Sudan',
    geonamesLabel: 'Bir Tawil search/name cross-reference; no national administrative row is claimed',
    centroid: { lat: 21.865, lon: 33.625, precision: 'region' },
    notes: [
      'Non-claim anchor only: AGID does not assert sovereignty, governance, or a postal delivery layer.',
      'This record is for public geospatial reference and route-risk review, not private addressing.',
    ],
  },
  {
    name: 'Jabal Tawil',
    featureClass: 'special-region',
    typeNote: 'public natural-geography reference',
    sourceLabel: 'public geography descriptions identify Jabal Tawil / Jabal Tawil area in Bir Tawil',
    geonamesLabel: 'Jabal Tawil natural-place cross-reference',
    centroid: { lat: 21.95, lon: 33.54, precision: 'region' },
    notes: ['Natural-place seed only; not a settlement or recipient-location record.'],
  },
  {
    name: 'Wadi Tawil',
    featureClass: 'special-region',
    typeNote: 'public wadi natural-geography reference',
    sourceLabel: 'public geography descriptions identify Wadi Tawil / Khawr Abu Bard in Bir Tawil',
    geonamesLabel: 'Wadi Tawil natural-place cross-reference',
    centroid: { lat: 21.77, lon: 33.58, precision: 'region' },
    notes: ['Natural-place seed only; surface-water, mine, camp, and private-coordinate claims are excluded.'],
  },
  {
    name: 'Gabal Hagar El Zarqa',
    featureClass: 'special-region',
    typeNote: 'public natural-geography reference',
    sourceLabel: 'public geography descriptions identify Gabal Hagar El Zarqa in eastern Bir Tawil',
    geonamesLabel: 'Gabal Hagar El Zarqa natural-place cross-reference',
    centroid: { lat: 21.87, lon: 33.95, precision: 'region' },
    notes: ['Natural-place seed only; not a settlement or administrative claim.'],
  },
];

const BIR_TAWIL_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'BT_T',
  countryName: 'Bir Tawil',
  countryLocalNames: { en: 'Bir Tawil', ar: 'بير طويل', alternate: 'Bi’r Tawīl' },
  countryCentroid: { lat: 21.865, lon: 33.625 },
  countryNotes: [
    'Non-claim region seed for Bir Tawil; public place metadata only.',
    'The complete BT_T slice records the region anchor and three public natural-reference anchors.',
    'AGID does not assert sovereignty, micronation claims, permanent population, private coordinates, or postal deliverability.',
  ],
  officialUrl: BIR_TAWIL_OSM_WIKI_URL,
  geonamesAdminUrl: BIR_TAWIL_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: BIR_TAWIL_GEONAMES_SEARCH_URL,
  wikidata: BIR_TAWIL_WIKIDATA_URL,
  sourceName: 'OSM/Wikidata/Bir Tawil non-claim references',
  rows: BIR_TAWIL_REFERENCE_ROWS,
});

const CRIMEA_REFERENCE_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Crimean Peninsula',
    featureClass: 'region',
    typeNote: 'neutral peninsula reference',
    sourceLabel: 'OCHA and HDX Ukraine boundary references include Crimea-related public map layers',
    geonamesLabel: 'Crimea peninsula / region cross-reference',
    centroid: { lat: 45.35, lon: 34.4, precision: 'region' },
    notes: ['Neutral geographic anchor; this record does not adjudicate sovereignty or control.'],
  },
  {
    name: 'Autonomous Republic of Crimea',
    featureClass: 'region',
    typeNote: 'first-order administrative compatibility reference',
    sourceLabel: 'HDX COD-AB and OCHA map references include Autonomous Republic of Crimea',
    geonamesLabel: 'Autonomous Republic of Crimea, GeoNames ADM1 first-order administrative division',
    centroid: { lat: 45.35, lon: 34.4, precision: 'region' },
    notes: ['Compatibility anchor for internationally used administrative datasets; no current-control claim is made.'],
  },
  {
    name: 'Sevastopol',
    featureClass: 'city',
    typeNote: 'special-status city compatibility reference',
    sourceLabel: 'Ukraine/HDX/OCHA references include Sevastopol as a separate city-level administrative unit',
    geonamesLabel: 'Sevastopol, GeoNames city / special-status cross-reference',
    centroid: { lat: 44.6167, lon: 33.5254, precision: 'city' },
    notes: ['Compatibility anchor only; AGID does not resolve legal status or current administrative control.'],
  },
  {
    name: 'Simferopol',
    featureClass: 'city',
    typeNote: 'administrative-centre city reference',
    sourceLabel: 'Crimea reference layers identify Simferopol as administrative centre in public gazetteers',
    geonamesLabel: 'Simferopol, administrative-centre cross-reference',
    centroid: { lat: 44.9521, lon: 34.1024, precision: 'city' },
    notes: ['Public city anchor for search and conformance fixtures only.'],
  },
];

const CRIMEA_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'CRIM',
  countryName: 'Crimea',
  countryLocalNames: { en: 'Crimea', uk: 'Крим', crh: 'Qırım', ru: 'Крым' },
  countryCentroid: { lat: 45.35, lon: 34.4 },
  countryNotes: [
    'Neutral disputed-region seed for Crimea; public place metadata only.',
    'The complete CRIM slice records the peninsula, Autonomous Republic of Crimea, Sevastopol, and Simferopol anchors.',
    'AGID does not adjudicate sovereignty, occupation, recognition, current control, address ownership, or delivery rights.',
  ],
  officialUrl: CRIMEA_OCHA_MAP_URL,
  geonamesAdminUrl: UKRAINE_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: CRIMEA_GEONAMES_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q7835',
  sourceName: 'OCHA/HDX/GeoNames Crimea references',
  rows: CRIMEA_REFERENCE_ROWS,
});

const CYPRUS_GREEN_LINE_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'United Nations Buffer Zone in Cyprus',
    featureClass: 'special-region',
    typeNote: 'UN-monitored buffer-zone reference',
    sourceLabel: 'UNFICYP describes the buffer zone, also called the Green Line, across Cyprus',
    geonamesLabel: 'UN Buffer Zone / Green Line public reference',
    centroid: { lat: 35.1, lon: 33.5, precision: 'region' },
    notes: ['Buffer-zone anchor only; no crossing, residency, ownership, or administrative-control right is implied.'],
  },
  {
    name: 'Nicosia Green Line',
    featureClass: 'special-region',
    typeNote: 'urban buffer-zone segment reference',
    sourceLabel: 'UNFICYP and public references identify the Green Line through Nicosia',
    geonamesLabel: 'Nicosia Green Line urban segment cross-reference',
    centroid: { lat: 35.174, lon: 33.364, precision: 'region' },
    notes: ['Urban segment anchor for search and safety review; not a route-permission record.'],
  },
  {
    name: 'Ledra Palace Crossing',
    featureClass: 'special-region',
    typeNote: 'crossing-point reference',
    sourceLabel: 'public Green Line crossing lists include Ledra Palace',
    geonamesLabel: 'Ledra Palace crossing-point cross-reference',
    centroid: { lat: 35.1748, lon: 33.356, precision: 'settlement' },
    notes: ['Crossing-point reference only; operational access status must be checked from current authorities.'],
  },
  {
    name: 'Ledra Street Crossing',
    featureClass: 'special-region',
    typeNote: 'crossing-point reference',
    sourceLabel: 'public Green Line crossing lists include Ledra Street',
    geonamesLabel: 'Ledra Street crossing-point cross-reference',
    centroid: { lat: 35.1752, lon: 33.3615, precision: 'settlement' },
    notes: ['Crossing-point reference only; not a guarantee of access, routing, or delivery permission.'],
  },
  {
    name: 'Pyla',
    featureClass: 'settlement',
    typeNote: 'buffer-zone village reference',
    sourceLabel: 'public buffer-zone references identify Pyla as a village within the buffer zone',
    geonamesLabel: 'Pyla settlement cross-reference',
    centroid: { lat: 35.012, lon: 33.691, precision: 'settlement' },
    notes: ['Settlement anchor only; no private address or household record is bundled.'],
  },
];

const CYPRUS_GREEN_LINE_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'CYGL',
  countryName: 'Cyprus Green Line',
  countryLocalNames: { en: 'Cyprus Green Line', el: 'Πράσινη Γραμμή', tr: 'Yeşil Hat' },
  countryCentroid: { lat: 35.1, lon: 33.5 },
  countryNotes: [
    'Neutral buffer-zone seed for the Cyprus Green Line; public place metadata only.',
    'The complete CYGL slice records the UN buffer-zone anchor, Nicosia segment, two crossing references, and Pyla village anchor.',
    'AGID does not grant crossing rights, route permissions, property rights, or administrative recognition.',
  ],
  officialUrl: UNFICYP_BUFFER_ZONE_URL,
  geonamesAdminUrl: UNFICYP_BUFFER_ZONE_URL,
  geonamesCountryUrl: UNFICYP_FACTSHEET_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q790875',
  sourceName: 'UNFICYP/UN Peacekeeping buffer-zone references',
  rows: CYPRUS_GREEN_LINE_ROWS,
});

const DONBAS_REFERENCE_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Donetsk Oblast',
    featureClass: 'province',
    typeNote: 'oblast public reference',
    sourceLabel: 'OCHA Donetska Oblast reference map and HDX Ukraine COD-AB include Donetsk/Donetska Oblast',
    geonamesLabel: 'Donetsk Oblast / Donetska Oblast administrative cross-reference',
    centroid: { lat: 48.0159, lon: 37.8029, precision: 'region' },
    notes: ['Oblast anchor only; AGID does not assert frontline, control, or route safety.'],
  },
  {
    name: 'Luhansk Oblast',
    featureClass: 'province',
    typeNote: 'oblast public reference',
    sourceLabel: 'OCHA Luhanska Oblast reference map and HDX Ukraine COD-AB include Luhansk/Luhanska Oblast',
    geonamesLabel: 'Luhansk Oblast / Luhanska Oblast administrative cross-reference',
    centroid: { lat: 48.574, lon: 39.3078, precision: 'region' },
    notes: ['Oblast anchor only; AGID does not assert frontline, control, or route safety.'],
  },
  {
    name: 'Donetsk',
    featureClass: 'city',
    typeNote: 'city public reference',
    sourceLabel: 'Donetsk/Donetska public reference maps include Donetsk city',
    geonamesLabel: 'Donetsk city cross-reference',
    centroid: { lat: 48.0159, lon: 37.8029, precision: 'city' },
    notes: ['City anchor for public search only; no recipient, building, or current access record is bundled.'],
  },
  {
    name: 'Luhansk',
    featureClass: 'city',
    typeNote: 'city public reference',
    sourceLabel: 'Luhansk/Luhanska public reference maps include Luhansk city',
    geonamesLabel: 'Luhansk city cross-reference',
    centroid: { lat: 48.574, lon: 39.3078, precision: 'city' },
    notes: ['City anchor for public search only; no recipient, building, or current access record is bundled.'],
  },
  {
    name: 'Siverskyi Donets Basin',
    featureClass: 'special-region',
    typeNote: 'regional natural/economic reference',
    sourceLabel: 'Donbas public geography references link the region to the Donets basin',
    geonamesLabel: 'Siverskyi Donets / Donets Basin regional cross-reference',
    centroid: { lat: 48.7, lon: 38.6, precision: 'region' },
    notes: ['Regional geography anchor only; not an administrative boundary or delivery-service area.'],
  },
];

const DONBAS_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'DONB',
  countryName: 'Donbas',
  countryLocalNames: { en: 'Donbas', uk: 'Донбас', ru: 'Донбасс', alternate: 'Donbass; Donets Basin' },
  countryCentroid: { lat: 48.5, lon: 38.3 },
  countryNotes: [
    'Neutral conflict-region seed for Donbas; public place metadata only.',
    'The complete DONB slice records Donetsk Oblast, Luhansk Oblast, Donetsk, Luhansk, and Siverskyi Donets Basin anchors.',
    'AGID does not assert current control, frontline, recognition, safe access, delivery availability, or postal validity.',
  ],
  officialUrl: DONETSK_OCHA_MAP_URL,
  geonamesAdminUrl: UKRAINE_GEONAMES_ADMIN_URL,
  geonamesCountryUrl: UKRAINE_HDX_COD_AB_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q605714',
  sourceName: 'OCHA/HDX/GeoNames Donbas references',
  rows: DONBAS_REFERENCE_ROWS,
});

const ETHIOPIA_ERITREA_BORDER_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Badme',
    featureClass: 'settlement',
    typeNote: 'border-settlement reference',
    sourceLabel: 'EEBC/UNMEE public records identify Badme as a core Ethiopia-Eritrea border-conflict reference',
    geonamesLabel: 'Badme public place-name cross-reference',
    centroid: { lat: 14.73, lon: 37.8, precision: 'settlement' },
    notes: [
      'Public settlement anchor only; AGID does not assert current control, access, demarcation status, or delivery availability.',
    ],
  },
  {
    name: 'Tsorona',
    featureClass: 'settlement',
    typeNote: 'central-sector border reference',
    sourceLabel: 'UNMEE and public conflict references identify Tsorona as a central-sector border-area reference',
    geonamesLabel: 'Tsorona public place-name cross-reference',
    centroid: { lat: 14.75, lon: 39.05, precision: 'settlement' },
    notes: ['Public settlement anchor only; no safety, route, or operational-access claim is bundled.'],
  },
  {
    name: 'Zalambessa',
    featureClass: 'settlement',
    typeNote: 'border-town reference',
    sourceLabel: 'UNMEE background and public border references identify Zalambessa in the Ethiopia-Eritrea border area',
    geonamesLabel: 'Zalambessa public place-name cross-reference',
    centroid: { lat: 14.52, lon: 39.37, precision: 'settlement' },
    notes: ['Public settlement anchor only; private address and recipient layers are excluded.'],
  },
  {
    name: 'Bure Border Area',
    featureClass: 'special-region',
    typeNote: 'eastern-sector border reference',
    sourceLabel: 'EEBC/UNMEE public records identify Bure as an eastern-sector border-area reference',
    geonamesLabel: 'Bure public border-area cross-reference',
    centroid: { lat: 13.03, lon: 42.1, precision: 'region' },
    notes: ['Border-area anchor only; no control line, checkpoint, or crossing permission is asserted.'],
  },
  {
    name: 'Mereb River Border Sector',
    featureClass: 'special-region',
    typeNote: 'river-sector border reference',
    sourceLabel: 'EEBC delimitation decision discusses river-sector handling and dry-season channel considerations',
    geonamesLabel: 'Mereb/Mareb River public geography cross-reference',
    centroid: { lat: 14.45, lon: 38.7, precision: 'region' },
    notes: ['Natural/border-sector anchor only; not a cadastral, postal, or delivery-service boundary.'],
  },
];

const ETHIOPIA_ERITREA_BORDER_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'EEBD',
  countryName: 'Ethiopia-Eritrea Border Area',
  countryLocalNames: { en: 'Ethiopia-Eritrea Border Area', am: 'የኢትዮጵያ-ኤርትራ ድንበር አካባቢ', ti: 'ዶብ ኢትዮጵያ-ኤርትራ' },
  countryCentroid: { lat: 14.25, lon: 39.0 },
  countryNotes: [
    'Neutral border-area seed for Ethiopia-Eritrea references; public place metadata only.',
    'The complete EEBD slice records Badme, Tsorona, Zalambessa, Bure Border Area, and Mereb River Border Sector anchors.',
    'AGID does not assert sovereignty, current control, demarcation completion, route safety, access rights, or postal deliverability.',
  ],
  officialUrl: ETHIOPIA_ERITREA_EEBC_DECISION_URL,
  geonamesAdminUrl: ETHIOPIA_ERITREA_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: ETHIOPIA_ERITREA_UNMEE_BACKGROUND_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q5419099',
  sourceName: 'EEBC/UNMEE Ethiopia-Eritrea border references',
  rows: ETHIOPIA_ERITREA_BORDER_ROWS,
});

const NORTHERN_TERRITORIES_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Etorofu Island',
    featureClass: 'island',
    typeNote: 'Northern Territories island reference',
    sourceLabel: 'MOFA Northern Territories sources list Etorofu as one of the four islands',
    geonamesLabel: 'Etorofu / Iturup island public place-name cross-reference',
    centroid: { lat: 45.1, lon: 147.9, precision: 'region' },
    localNames: { en: 'Etorofu Island', ja: '択捉島', ru: 'Итуруп', alternate: 'Iturup' },
    notes: ['Island anchor only; AGID does not assert sovereignty, administration, access, or delivery availability.'],
  },
  {
    name: 'Kunashiri Island',
    featureClass: 'island',
    typeNote: 'Northern Territories island reference',
    sourceLabel: 'MOFA Northern Territories sources list Kunashiri as one of the four islands',
    geonamesLabel: 'Kunashiri / Kunashir island public place-name cross-reference',
    centroid: { lat: 44.1, lon: 145.82, precision: 'region' },
    localNames: { en: 'Kunashiri Island', ja: '国後島', ru: 'Кунашир', alternate: 'Kunashir' },
    notes: ['Island anchor only; no current-control, private-address, or route-permission claim is made.'],
  },
  {
    name: 'Shikotan Island',
    featureClass: 'island',
    typeNote: 'Northern Territories island reference',
    sourceLabel: 'MOFA Northern Territories sources list Shikotan as one of the four islands',
    geonamesLabel: 'Shikotan island public place-name cross-reference',
    centroid: { lat: 43.8, lon: 146.75, precision: 'region' },
    localNames: { en: 'Shikotan Island', ja: '色丹島', ru: 'Шикотан' },
    notes: ['Island anchor only; no current-control, private-address, or route-permission claim is made.'],
  },
  {
    name: 'Habomai Islands',
    featureClass: 'island',
    typeNote: 'Northern Territories island-group reference',
    sourceLabel: 'MOFA Northern Territories sources list Habomai as one of the four island groups',
    geonamesLabel: 'Habomai island group public place-name cross-reference',
    centroid: { lat: 43.45, lon: 146.15, precision: 'region' },
    localNames: { en: 'Habomai Islands', ja: '歯舞群島', ru: 'Хабомаи', alternate: 'Habomai islets' },
    notes: ['Island-group anchor only; small islets, reefs, buildings, and private coordinates are deferred.'],
  },
];

const NORTHERN_TERRITORIES_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'JP_NT',
  countryName: 'Northern Territories',
  countryLocalNames: { en: 'Northern Territories', ja: '北方領土', ru: 'Южные Курильские острова', alternate: 'Four Northern Islands' },
  countryCentroid: { lat: 44.4, lon: 146.7 },
  countryNotes: [
    'Neutral disputed-island-group seed for Northern Territories references; public place metadata only.',
    'The complete JP_NT slice records Etorofu, Kunashiri, Shikotan, and Habomai anchors named by public sources.',
    'AGID does not assert sovereignty, occupation, recognition, current administration, crossing rights, or postal deliverability.',
  ],
  officialUrl: JAPAN_MOFA_NORTHERN_TERRITORIES_INFO_URL,
  geonamesAdminUrl: NORTHERN_TERRITORIES_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: JAPAN_MOFA_NORTHERN_TERRITORIES_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q131425',
  sourceName: 'MOFA/GeoNames Northern Territories references',
  rows: NORTHERN_TERRITORIES_ROWS,
});

const SENKAKU_ROWS: CompactFirstOrderSeed[] = [
  { name: 'Uotsuri Island', featureClass: 'island', typeNote: 'Senkaku island reference', sourceLabel: 'MOFA Senkaku information list includes Uotsuri Island', geonamesLabel: 'Uotsuri island public place-name cross-reference', centroid: { lat: 25.744, lon: 123.475, precision: 'region' }, localNames: { en: 'Uotsuri Island', ja: '魚釣島', zh: '釣魚島', alternate: 'Diaoyu Dao' }, notes: ['Island anchor only; no sovereignty, access, or delivery claim is made.'] },
  { name: 'Kitakojima Island', featureClass: 'island', typeNote: 'Senkaku island reference', sourceLabel: 'MOFA Senkaku information list includes Kitakojima Island', geonamesLabel: 'Kitakojima / Bei Xiaodao public place-name cross-reference', centroid: { lat: 25.739, lon: 123.546, precision: 'region' }, localNames: { en: 'Kitakojima Island', ja: '北小島', zh: '北小島', alternate: 'Bei Xiaodao' }, notes: ['Island anchor only; no private-address or route-permission layer is bundled.'] },
  { name: 'Minamikojima Island', featureClass: 'island', typeNote: 'Senkaku island reference', sourceLabel: 'MOFA Senkaku information list includes Minamikojima Island', geonamesLabel: 'Minamikojima / Nan Xiaodao public place-name cross-reference', centroid: { lat: 25.733, lon: 123.549, precision: 'region' }, localNames: { en: 'Minamikojima Island', ja: '南小島', zh: '南小島', alternate: 'Nan Xiaodao' }, notes: ['Island anchor only; no private-address or route-permission layer is bundled.'] },
  { name: 'Kuba Island', featureClass: 'island', typeNote: 'Senkaku island reference', sourceLabel: 'MOFA Senkaku information list includes Kuba Island', geonamesLabel: 'Kuba / Huangwei Yu public place-name cross-reference', centroid: { lat: 25.93, lon: 123.68, precision: 'region' }, localNames: { en: 'Kuba Island', ja: '久場島', zh: '黃尾嶼', alternate: 'Huangwei Yu' }, notes: ['Island anchor only; current use, access, and military-status claims are out of scope.'] },
  { name: 'Taisho Island', featureClass: 'island', typeNote: 'Senkaku island reference', sourceLabel: 'MOFA Senkaku information list includes Taisho Island', geonamesLabel: 'Taisho / Chiwei Yu public place-name cross-reference', centroid: { lat: 25.92, lon: 124.55, precision: 'region' }, localNames: { en: 'Taisho Island', ja: '大正島', zh: '赤尾嶼', alternate: 'Chiwei Yu' }, notes: ['Island anchor only; no access, control, or delivery-service claim is made.'] },
  { name: 'Okinokitaiwa Island', featureClass: 'island', typeNote: 'Senkaku rock/island reference', sourceLabel: 'MOFA Senkaku information list includes Okinokitaiwa Island', geonamesLabel: 'Okinokitaiwa public place-name cross-reference', centroid: { lat: 25.75, lon: 123.55, precision: 'region' }, localNames: { en: 'Okinokitaiwa Island', ja: '沖ノ北岩' }, notes: ['Rock/island anchor only; small-rock geometry is linked, not bundled.'] },
  { name: 'Okinominamiiwa Island', featureClass: 'island', typeNote: 'Senkaku rock/island reference', sourceLabel: 'MOFA Senkaku information list includes Okinominamiiwa Island', geonamesLabel: 'Okinominamiiwa public place-name cross-reference', centroid: { lat: 25.73, lon: 123.56, precision: 'region' }, localNames: { en: 'Okinominamiiwa Island', ja: '沖ノ南岩' }, notes: ['Rock/island anchor only; small-rock geometry is linked, not bundled.'] },
  { name: 'Tobise Island', featureClass: 'island', typeNote: 'Senkaku rock/island reference', sourceLabel: 'MOFA Senkaku information list includes Tobise Island', geonamesLabel: 'Tobise public place-name cross-reference', centroid: { lat: 25.735, lon: 123.49, precision: 'region' }, localNames: { en: 'Tobise Island', ja: '飛瀬' }, notes: ['Rock/island anchor only; no private-coordinate or delivery layer is bundled.'] },
];

const SENKAKU_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'JP_SK',
  countryName: 'Senkaku Islands',
  countryLocalNames: { en: 'Senkaku Islands', ja: '尖閣諸島', zh: '釣魚島及其附屬島嶼', alternate: 'Diaoyu Islands; Diaoyutai Islands' },
  countryCentroid: { lat: 25.75, lon: 123.55 },
  countryNotes: [
    'Neutral disputed-island-group seed for Senkaku/Diaoyu references; public place metadata only.',
    'The complete JP_SK slice records the eight islands/rocks named in the cited MOFA information source.',
    'AGID does not assert sovereignty, recognition, current control, access rights, route safety, or postal deliverability.',
  ],
  officialUrl: JAPAN_MOFA_SENKAKU_INFO_URL,
  geonamesAdminUrl: SENKAKU_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: JAPAN_MOFA_SENKAKU_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q5174',
  sourceName: 'MOFA/GeoNames Senkaku references',
  rows: SENKAKU_ROWS,
});

const TAKESHIMA_DOKDO_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Liancourt Rocks',
    featureClass: 'special-region',
    typeNote: 'neutral island-group reference',
    sourceLabel: 'Japan and Korea public references identify Takeshima/Dokdo/Liancourt Rocks as the same island group',
    geonamesLabel: 'Liancourt Rocks / Takeshima / Dokdo public place-name cross-reference',
    centroid: { lat: 37.242, lon: 131.865, precision: 'region' },
    localNames: { en: 'Liancourt Rocks', ja: '竹島', ko: '독도', alternate: 'Takeshima; Dokdo' },
    notes: ['Neutral island-group anchor only; AGID does not assert sovereignty, administration, or access rights.'],
  },
  {
    name: 'Dongdo',
    featureClass: 'island',
    typeNote: 'east islet reference',
    sourceLabel: 'Korean public geography source lists Dongdo / East Islet as one of the two main islets',
    geonamesLabel: 'Dongdo / East Islet public place-name cross-reference',
    centroid: { lat: 37.2408, lon: 131.8696, precision: 'region' },
    localNames: { en: 'Dongdo', ko: '동도', ja: '女島', alternate: 'East Islet; Mejima' },
    notes: ['Island anchor only; no building, resident, postal, or private-address layer is bundled.'],
  },
  {
    name: 'Seodo',
    featureClass: 'island',
    typeNote: 'west islet reference',
    sourceLabel: 'Korean public geography source lists Seodo / West Islet as one of the two main islets',
    geonamesLabel: 'Seodo / West Islet public place-name cross-reference',
    centroid: { lat: 37.2418, lon: 131.8652, precision: 'region' },
    localNames: { en: 'Seodo', ko: '서도', ja: '男島', alternate: 'West Islet; Ojima' },
    notes: ['Island anchor only; no building, resident, postal, or private-address layer is bundled.'],
  },
  {
    name: 'Dokdo Minor Rock Islets',
    featureClass: 'special-region',
    typeNote: 'minor rock-islet group reference',
    sourceLabel: 'Korean public geography source notes the two main islands plus numerous smaller rock islets',
    geonamesLabel: 'minor rock-islets public geography cross-reference',
    centroid: { lat: 37.242, lon: 131.866, precision: 'region' },
    localNames: { en: 'Dokdo Minor Rock Islets', ko: '독도 부속 도서', ja: '竹島周辺岩礁' },
    notes: ['Minor-rock group anchor only; individual rock geometry and access status are deferred.'],
  },
];

const TAKESHIMA_DOKDO_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'JP_TK',
  countryName: 'Takeshima / Dokdo',
  countryLocalNames: { en: 'Takeshima / Dokdo', ja: '竹島', ko: '독도', alternate: 'Liancourt Rocks' },
  countryCentroid: { lat: 37.242, lon: 131.865 },
  countryNotes: [
    'Neutral disputed-islet seed for Takeshima/Dokdo/Liancourt Rocks references; public place metadata only.',
    'The complete JP_TK slice records Liancourt Rocks, Dongdo, Seodo, and the minor rock-islet group anchors.',
    'AGID does not assert sovereignty, occupation, administration, access rights, resident records, postal validity, or delivery availability.',
  ],
  officialUrl: JAPAN_MOFA_TAKESHIMA_URL,
  geonamesAdminUrl: TAKESHIMA_DOKDO_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: KOREA_DOKDO_LOCATION_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q15290',
  sourceName: 'MOFA/Korean public Dokdo/Liancourt references',
  rows: TAKESHIMA_DOKDO_ROWS,
});

const KASHMIR_REFERENCE_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Kashmir Region',
    featureClass: 'region',
    typeNote: 'neutral regional reference',
    sourceLabel: 'UNMOGIP and public gazetteer references describe Kashmir as the regional context for the Line of Control',
    geonamesLabel: 'Kashmir regional public place-name cross-reference',
    centroid: { lat: 34.5, lon: 76.0, precision: 'region' },
    localNames: { en: 'Kashmir Region', hi: 'कश्मीर', ur: 'کشمیر', alternate: 'Kashmir' },
    notes: ['Umbrella region anchor only; AGID does not assert sovereignty, recognition, administration, or current control.'],
  },
  {
    name: 'Jammu and Kashmir',
    featureClass: 'region',
    typeNote: 'public region reference',
    sourceLabel: 'public Kashmir references include Jammu and Kashmir as a named regional anchor',
    geonamesLabel: 'Jammu and Kashmir public place-name cross-reference',
    centroid: { lat: 33.7, lon: 75.1, precision: 'region' },
    localNames: { en: 'Jammu and Kashmir', hi: 'जम्मू और कश्मीर', ur: 'جموں و کشمیر' },
    notes: ['Public region anchor only; administrative validity, legal status, and service availability are out of scope.'],
  },
  {
    name: 'Ladakh',
    featureClass: 'region',
    typeNote: 'public region reference',
    sourceLabel: 'public Kashmir references include Ladakh as a named regional anchor',
    geonamesLabel: 'Ladakh public place-name cross-reference',
    centroid: { lat: 34.15, lon: 77.58, precision: 'region' },
    localNames: { en: 'Ladakh', hi: 'लद्दाख', ur: 'لداخ' },
    notes: ['Public region anchor only; border, military, access, and route-safety claims are not included.'],
  },
  {
    name: 'Azad Jammu and Kashmir',
    featureClass: 'region',
    typeNote: 'public region reference',
    sourceLabel: 'public Kashmir references include Azad Jammu and Kashmir as a named regional anchor',
    geonamesLabel: 'Azad Jammu and Kashmir public place-name cross-reference',
    centroid: { lat: 33.9, lon: 73.8, precision: 'region' },
    localNames: { en: 'Azad Jammu and Kashmir', ur: 'آزاد جموں و کشمیر', alternate: 'AJK' },
    notes: ['Public region anchor only; AGID does not decide sovereignty, recognition, administration, or current control.'],
  },
  {
    name: 'Gilgit-Baltistan',
    featureClass: 'region',
    typeNote: 'public region reference',
    sourceLabel: 'public Kashmir references include Gilgit-Baltistan as a named regional anchor',
    geonamesLabel: 'Gilgit-Baltistan public place-name cross-reference',
    centroid: { lat: 35.8, lon: 74.5, precision: 'region' },
    localNames: { en: 'Gilgit-Baltistan', ur: 'گلگت بلتستان' },
    notes: ['Public region anchor only; AGID stores no settlement, resident, route, or delivery-operation layer here.'],
  },
  {
    name: 'Aksai Chin',
    featureClass: 'special-region',
    typeNote: 'public special-region reference',
    sourceLabel: 'public Kashmir references include Aksai Chin as a named special-region anchor',
    geonamesLabel: 'Aksai Chin public place-name cross-reference',
    centroid: { lat: 35.0, lon: 79.0, precision: 'region' },
    localNames: { en: 'Aksai Chin', zh: '阿克赛钦', hi: 'अक्साई चिन' },
    notes: ['Special-region anchor only; boundary geometry, control status, road access, and delivery claims are not bundled.'],
  },
  {
    name: 'Line of Control',
    featureClass: 'special-region',
    typeNote: 'ceasefire-line reference',
    sourceLabel: 'UNMOGIP and UNTERM references identify the Line of Control in Kashmir',
    geonamesLabel: 'Line of Control public place-name cross-reference',
    centroid: { lat: 34.5, lon: 74.5, precision: 'region' },
    localNames: { en: 'Line of Control', alternate: 'LoC' },
    notes: ['Line anchor only; no crossing permission, access right, route-safety, or border-validity claim is made.'],
  },
];

const KASHMIR_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'KASH',
  countryName: 'Kashmir',
  countryLocalNames: { en: 'Kashmir', hi: 'कश्मीर', ur: 'کشمیر' },
  countryCentroid: { lat: 34.5, lon: 76.0 },
  countryNotes: [
    'Neutral disputed-region seed for Kashmir references; public place metadata only.',
    'The complete KASH slice records Kashmir Region, Jammu and Kashmir, Ladakh, Azad Jammu and Kashmir, Gilgit-Baltistan, Aksai Chin, and the Line of Control anchors.',
    'AGID does not assert sovereignty, current control, recognition, administrative validity, route safety, access rights, postal validity, or delivery availability.',
  ],
  officialUrl: UNMOGIP_BACKGROUND_URL,
  geonamesAdminUrl: KASHMIR_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: UNMOGIP_HOME_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q43100',
  sourceName: 'UNMOGIP/UNTERM/GeoNames Kashmir references',
  rows: KASHMIR_REFERENCE_ROWS,
});

const TRANSNISTRIA_REFERENCE_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Transnistrian Region of the Republic of Moldova',
    featureClass: 'region',
    typeNote: 'neutral regional reference',
    sourceLabel: 'Moldova terminology guidance recommends the expression Transnistrian region of the Republic of Moldova',
    geonamesLabel: 'Transnistrian region public place-name cross-reference',
    centroid: { lat: 47.3, lon: 29.3, precision: 'region' },
    localNames: { en: 'Transnistrian Region of the Republic of Moldova', ro: 'Regiunea transnistreană a Republicii Moldova', ru: 'Приднестровский регион Республики Молдова', alternate: 'Transnistria' },
    notes: ['Neutral region anchor only; no statehood, legal parity, recognition, or normative-act claim is made.'],
  },
  {
    name: 'Tiraspol',
    featureClass: 'city',
    typeNote: 'city reference',
    sourceLabel: 'OSCE settlement process references use Tiraspol as a negotiation-side locality reference',
    geonamesLabel: 'Tiraspol public place-name cross-reference',
    centroid: { lat: 46.8427, lon: 29.6291, precision: 'city' },
    localNames: { en: 'Tiraspol', ro: 'Tiraspol', ru: 'Тирасполь', uk: 'Тирасполь' },
    notes: ['City-name anchor only; no capital, statehood, current-control, or service-validity claim is made.'],
  },
  {
    name: 'Bender',
    featureClass: 'city',
    typeNote: 'municipality reference',
    sourceLabel: 'Moldova terminology guidance refers to the municipality of Bender with the left-bank localities',
    geonamesLabel: 'Bender public place-name cross-reference',
    centroid: { lat: 46.8306, lon: 29.4711, precision: 'city' },
    localNames: { en: 'Bender', ro: 'Bender', ru: 'Бендеры', alternate: 'Tighina' },
    notes: ['City-name anchor only; crossing rights, legal status, and postal/delivery validity are out of scope.'],
  },
  {
    name: 'Camenca District',
    featureClass: 'district',
    typeNote: 'district reference',
    sourceLabel: 'public Transnistrian-region references include Camenca/Camenca District as a named district anchor',
    geonamesLabel: 'Camenca District public place-name cross-reference',
    centroid: { lat: 48.03, lon: 28.7, precision: 'region' },
    localNames: { en: 'Camenca District', ro: 'Camenca', ru: 'Каменский район', alternate: 'Kamenka District' },
    notes: ['District-name anchor only; AGID does not validate administration, current control, or service coverage.'],
  },
  {
    name: 'Ribnita District',
    featureClass: 'district',
    typeNote: 'district reference',
    sourceLabel: 'public Transnistrian-region references include Ribnita District as a named district anchor',
    geonamesLabel: 'Ribnita District public place-name cross-reference',
    centroid: { lat: 47.77, lon: 29.0, precision: 'region' },
    localNames: { en: 'Ribnita District', ro: 'Rîbnița', ru: 'Рыбницкий район', alternate: 'Rybnitsa District' },
    notes: ['District-name anchor only; AGID does not validate administration, current control, or service coverage.'],
  },
  {
    name: 'Dubasari District',
    featureClass: 'district',
    typeNote: 'district reference',
    sourceLabel: 'public Transnistrian-region references include Dubasari District as a named district anchor',
    geonamesLabel: 'Dubasari District public place-name cross-reference',
    centroid: { lat: 47.26, lon: 29.16, precision: 'region' },
    localNames: { en: 'Dubasari District', ro: 'Dubăsari', ru: 'Дубоссарский район', alternate: 'Dubossary District' },
    notes: ['District-name anchor only; AGID does not validate administration, current control, or service coverage.'],
  },
  {
    name: 'Grigoriopol District',
    featureClass: 'district',
    typeNote: 'district reference',
    sourceLabel: 'public Transnistrian-region references include Grigoriopol District as a named district anchor',
    geonamesLabel: 'Grigoriopol District public place-name cross-reference',
    centroid: { lat: 47.15, lon: 29.3, precision: 'region' },
    localNames: { en: 'Grigoriopol District', ro: 'Grigoriopol', ru: 'Григориопольский район' },
    notes: ['District-name anchor only; AGID does not validate administration, current control, or service coverage.'],
  },
  {
    name: 'Slobozia District',
    featureClass: 'district',
    typeNote: 'district reference',
    sourceLabel: 'public Transnistrian-region references include Slobozia District as a named district anchor',
    geonamesLabel: 'Slobozia District public place-name cross-reference',
    centroid: { lat: 46.73, lon: 29.7, precision: 'region' },
    localNames: { en: 'Slobozia District', ro: 'Slobozia', ru: 'Слободзейский район' },
    notes: ['District-name anchor only; AGID does not validate administration, current control, or service coverage.'],
  },
];

const TRANSNISTRIA_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'PMR',
  countryName: 'Transnistria',
  countryLocalNames: { en: 'Transnistria', ro: 'Transnistria', ru: 'Приднестровье', uk: 'Придністров’я' },
  countryCentroid: { lat: 47.3, lon: 29.3 },
  countryNotes: [
    'Neutral Transnistrian-region seed; public place metadata only.',
    'The complete PMR slice records the Transnistrian region, Tiraspol, Bender, Camenca, Ribnita, Dubasari, Grigoriopol, and Slobozia public anchors.',
    'AGID does not assert statehood, recognition, current control, administrative validity, crossing rights, route safety, postal validity, or delivery availability.',
  ],
  officialUrl: MOLDOVA_GOV_TRANSNISTRIAN_TERMINOLOGY_URL,
  geonamesAdminUrl: TRANSNISTRIA_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: OSCE_TRANSNISTRIAN_SETTLEMENT_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q907112',
  sourceName: 'OSCE/Moldova Government Transnistrian settlement references',
  rows: TRANSNISTRIA_REFERENCE_ROWS,
});

const SOUTH_CHINA_SEA_ISLANDS_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Spratly Islands',
    featureClass: 'region',
    typeNote: 'island-group reference',
    sourceLabel: 'AMTI/CNA South China Sea public feature references include the Spratly Islands',
    geonamesLabel: 'Spratly Islands public place-name cross-reference',
    centroid: { lat: 10.0, lon: 114.0, precision: 'region' },
    localNames: { en: 'Spratly Islands', zh: '南沙群岛', vi: 'Quần đảo Trường Sa', tl: 'Kapuluan ng Kalayaan', alternate: 'Nansha Islands' },
    notes: ['Island-group anchor only; AGID does not assert sovereignty, maritime entitlement, current control, facility status, or navigation safety.'],
  },
  {
    name: 'Paracel Islands',
    featureClass: 'region',
    typeNote: 'island-group reference',
    sourceLabel: 'AMTI/CNA South China Sea public feature references include the Paracel Islands',
    geonamesLabel: 'Paracel Islands public place-name cross-reference',
    centroid: { lat: 16.5, lon: 112.0, precision: 'region' },
    localNames: { en: 'Paracel Islands', zh: '西沙群岛', vi: 'Quần đảo Hoàng Sa', alternate: 'Xisha Islands' },
    notes: ['Island-group anchor only; access rights, current control, route safety, and delivery claims are not included.'],
  },
  {
    name: 'Pratas Islands',
    featureClass: 'island',
    typeNote: 'island reference',
    sourceLabel: 'CNA South China Sea claims reference includes Pratas Islands as a feature group',
    geonamesLabel: 'Pratas Islands public place-name cross-reference',
    centroid: { lat: 20.7, lon: 116.7, precision: 'region' },
    localNames: { en: 'Pratas Islands', zh: '東沙群島', alternate: 'Dongsha Islands' },
    notes: ['Island anchor only; facility, access, postal, and delivery-operation status is out of scope.'],
  },
  {
    name: 'Macclesfield Bank',
    featureClass: 'special-region',
    typeNote: 'submerged-bank reference',
    sourceLabel: 'CNA South China Sea claims reference includes Macclesfield Bank as a feature group',
    geonamesLabel: 'Macclesfield Bank public place-name cross-reference',
    centroid: { lat: 15.8, lon: 114.3, precision: 'region' },
    localNames: { en: 'Macclesfield Bank', zh: '中沙群岛', alternate: 'Zhongsha Islands' },
    notes: ['Submerged-bank anchor only; this is not a land-address layer and no maritime entitlement claim is made.'],
  },
  {
    name: 'Scarborough Shoal',
    featureClass: 'special-region',
    typeNote: 'shoal reference',
    sourceLabel: 'AMTI Island Tracker records Scarborough Shoal and multilingual public names',
    geonamesLabel: 'Scarborough Shoal public place-name cross-reference',
    centroid: { lat: 15.15, lon: 117.75, precision: 'region' },
    localNames: { en: 'Scarborough Shoal', zh: '黄岩岛', tl: 'Bajo de Masinloc', alternate: 'Panatag Shoal; Huangyan Dao' },
    notes: ['Shoal anchor only; no sovereignty, current control, navigation safety, facility, postal, or delivery claim is made.'],
  },
];

const SOUTH_CHINA_SEA_ISLANDS_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'SCSD',
  countryName: 'South China Sea Islands',
  countryLocalNames: { en: 'South China Sea Islands', zh: '南海诸岛', vi: 'Các đảo ở Biển Đông', alternate: 'South China Sea feature groups' },
  countryCentroid: { lat: 12.0, lon: 114.0 },
  countryNotes: [
    'Neutral maritime feature-group seed for South China Sea island, shoal, and bank references; public place metadata only.',
    'The complete SCSD slice records Spratly, Paracel, Pratas, Macclesfield, and Scarborough public anchors.',
    'AGID does not assert sovereignty, maritime entitlement, current control, military/facility status, safe navigation, access rights, postal validity, or delivery availability.',
  ],
  officialUrl: CNA_SOUTH_CHINA_SEA_CLAIMS_URL,
  geonamesAdminUrl: SOUTH_CHINA_SEA_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: AMTI_CHINA_ISLAND_TRACKER_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q37660',
  sourceName: 'AMTI/CNA South China Sea public feature references',
  rows: SOUTH_CHINA_SEA_ISLANDS_ROWS,
});

const NORTHERN_CYPRUS_REFERENCE_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Areas of Cyprus Not Under Effective Control',
    featureClass: 'region',
    typeNote: 'Green Line legal-reference region',
    sourceLabel: 'EU Green Line terminology refers to areas where the Republic of Cyprus government does not exercise effective control',
    geonamesLabel: 'Northern Cyprus public place-name cross-reference',
    centroid: { lat: 35.25, lon: 33.55, precision: 'region' },
    localNames: { en: 'Areas of Cyprus Not Under Effective Control', tr: 'Kuzey Kıbrıs', el: 'Βόρεια Κύπρος', alternate: 'Northern Cyprus' },
    notes: ['Neutral legal-reference region only; AGID does not assert statehood, recognition, administration, or current control.'],
  },
  {
    name: 'North Nicosia',
    featureClass: 'city',
    typeNote: 'city reference',
    sourceLabel: 'public Northern Cyprus references include North Nicosia as a named city anchor',
    geonamesLabel: 'North Nicosia public place-name cross-reference',
    centroid: { lat: 35.177, lon: 33.3632, precision: 'city' },
    localNames: { en: 'North Nicosia', tr: 'Lefkoşa', el: 'Λευκωσία', alternate: 'Lefkosa' },
    notes: ['City-name anchor only; no capital, border-crossing, jurisdiction, route-safety, or delivery claim is made.'],
  },
  {
    name: 'Famagusta',
    featureClass: 'city',
    typeNote: 'city reference',
    sourceLabel: 'public Northern Cyprus references include Famagusta as a named city anchor',
    geonamesLabel: 'Famagusta public place-name cross-reference',
    centroid: { lat: 35.125, lon: 33.95, precision: 'city' },
    localNames: { en: 'Famagusta', tr: 'Gazimağusa', el: 'Αμμόχωστος', alternate: 'Ammochostos' },
    notes: ['City-name anchor only; no status, access, port-operation, postal, or delivery availability claim is bundled.'],
  },
  {
    name: 'Kyrenia',
    featureClass: 'city',
    typeNote: 'city reference',
    sourceLabel: 'public Northern Cyprus references include Kyrenia as a named city anchor',
    geonamesLabel: 'Kyrenia public place-name cross-reference',
    centroid: { lat: 35.34, lon: 33.32, precision: 'city' },
    localNames: { en: 'Kyrenia', tr: 'Girne', el: 'Κερύνεια' },
    notes: ['City-name anchor only; no harbour operation, access, jurisdiction, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Morphou',
    featureClass: 'city',
    typeNote: 'city reference',
    sourceLabel: 'public Northern Cyprus references include Morphou as a named city anchor',
    geonamesLabel: 'Morphou public place-name cross-reference',
    centroid: { lat: 35.2, lon: 32.99, precision: 'city' },
    localNames: { en: 'Morphou', tr: 'Güzelyurt', el: 'Μόρφου', alternate: 'Guzelyurt' },
    notes: ['City-name anchor only; no administration, property, postal, or service-validity layer is bundled.'],
  },
  {
    name: 'Iskele',
    featureClass: 'city',
    typeNote: 'city reference',
    sourceLabel: 'public Northern Cyprus references include Iskele as a named city anchor',
    geonamesLabel: 'Iskele public place-name cross-reference',
    centroid: { lat: 35.286, lon: 33.89, precision: 'city' },
    localNames: { en: 'Iskele', tr: 'İskele', el: 'Τρίκωμο', alternate: 'Trikomo' },
    notes: ['City-name anchor only; no jurisdiction, access, route-safety, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Karpas Peninsula',
    featureClass: 'region',
    typeNote: 'peninsula reference',
    sourceLabel: 'public Northern Cyprus references include the Karpas/Karpaz Peninsula as a named regional anchor',
    geonamesLabel: 'Karpas Peninsula public place-name cross-reference',
    centroid: { lat: 35.6, lon: 34.3, precision: 'region' },
    localNames: { en: 'Karpas Peninsula', tr: 'Karpaz Yarımadası', el: 'Χερσόνησος Καρπασίας' },
    notes: ['Regional anchor only; protected-area, access, road, and delivery claims are outside this seed pack.'],
  },
];

const NORTHERN_CYPRUS_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'TRNC',
  countryName: 'Northern Cyprus',
  countryLocalNames: { en: 'Northern Cyprus', tr: 'Kuzey Kıbrıs', el: 'Βόρεια Κύπρος' },
  countryCentroid: { lat: 35.25, lon: 33.55 },
  countryNotes: [
    'Neutral Northern Cyprus seed for public place metadata only.',
    'The complete TRNC slice records the Green Line legal-reference region plus North Nicosia, Famagusta, Kyrenia, Morphou, Iskele, and Karpas anchors.',
    'AGID does not assert statehood, recognition, current control, administrative validity, border status, crossing rights, route safety, postal validity, or delivery availability.',
  ],
  officialUrl: EU_GREEN_LINE_REGULATION_URL,
  geonamesAdminUrl: NORTHERN_CYPRUS_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: UNFICYP_BUFFER_ZONE_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q23681',
  sourceName: 'EU Green Line/UNFICYP/GeoNames Northern Cyprus references',
  rows: NORTHERN_CYPRUS_REFERENCE_ROWS,
});

const BAARLE_ENCLAVE_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Baarle Enclave Complex',
    featureClass: 'special-region',
    typeNote: 'enclave-complex reference',
    sourceLabel: 'Visit Baarle describes 30 enclaves across Baarle-Hertog and Baarle-Nassau',
    geonamesLabel: 'Baarle enclave complex public place-name cross-reference',
    centroid: { lat: 51.44, lon: 4.93, precision: 'region' },
    localNames: { en: 'Baarle Enclave Complex', nl: 'Enclaves van Baarle' },
    notes: ['Enclave-complex anchor only; parcel geometry, property addresses, front-door rules, and service jurisdiction are not bundled.'],
  },
  {
    name: 'Baarle-Hertog',
    featureClass: 'municipality',
    typeNote: 'Belgian municipality reference',
    sourceLabel: 'Visit Baarle describes Baarle-Hertog as the Belgian municipality in the enclave complex',
    geonamesLabel: 'Baarle-Hertog public place-name cross-reference',
    centroid: { lat: 51.44, lon: 4.93, precision: 'settlement' },
    localNames: { en: 'Baarle-Hertog', nl: 'Baarle-Hertog' },
    geodataLinks: { official: BAARLE_HERTOG_OFFICIAL_URL },
    notes: ['Municipality anchor only; no property-level address, cadastral boundary, tax, policing, or postal claim is made.'],
  },
  {
    name: 'Baarle-Nassau',
    featureClass: 'municipality',
    typeNote: 'Dutch municipality reference',
    sourceLabel: 'Visit Baarle describes Baarle-Nassau as the Dutch municipality in the enclave complex',
    geonamesLabel: 'Baarle-Nassau public place-name cross-reference',
    centroid: { lat: 51.447, lon: 4.93, precision: 'settlement' },
    localNames: { en: 'Baarle-Nassau', nl: 'Baarle-Nassau' },
    geodataLinks: { official: BAARLE_NASSAU_OFFICIAL_URL },
    notes: ['Municipality anchor only; no property-level address, cadastral boundary, tax, policing, or postal claim is made.'],
  },
  {
    name: 'Belgian Enclaves H1-H22',
    featureClass: 'special-region',
    typeNote: 'Belgian enclave-set reference',
    sourceLabel: 'Visit Baarle states that Belgian enclaves are numbered H1 to H22',
    geonamesLabel: 'Baarle-Hertog enclave-set public cross-reference',
    centroid: { lat: 51.44, lon: 4.93, precision: 'region' },
    localNames: { en: 'Belgian Enclaves H1-H22', nl: 'Belgische enclaves H1-H22' },
    notes: ['Grouped enclave-set anchor only; individual parcel boundaries and building-level address decisions are not bundled.'],
  },
  {
    name: 'Dutch Enclaves N1-N8',
    featureClass: 'special-region',
    typeNote: 'Dutch enclave-set reference',
    sourceLabel: 'Visit Baarle states that Dutch enclaves are numbered N1 to N8',
    geonamesLabel: 'Baarle-Nassau enclave-set public cross-reference',
    centroid: { lat: 51.44, lon: 4.93, precision: 'region' },
    localNames: { en: 'Dutch Enclaves N1-N8', nl: 'Nederlandse enclaves N1-N8' },
    notes: ['Grouped counter-enclave anchor only; individual parcel boundaries and building-level address decisions are not bundled.'],
  },
];

const BAARLE_ENCLAVES_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'BAAR',
  countryName: 'Baarle Enclaves',
  countryLocalNames: { en: 'Baarle Enclaves', nl: 'Enclaves van Baarle' },
  countryCentroid: { lat: 51.44, lon: 4.93 },
  countryNotes: [
    'Neutral special-region seed for the Baarle-Hertog/Baarle-Nassau enclave complex; public place metadata only.',
    'The complete BAAR slice records the complex, Baarle-Hertog, Baarle-Nassau, Belgian H1-H22 enclave set, and Dutch N1-N8 counter-enclave set.',
    'AGID does not assert parcel boundaries, cadastral validity, property-level addresses, front-door jurisdiction, taxation, policing, postal validity, or delivery availability.',
  ],
  officialUrl: VISIT_BAARLE_ENCLAVES_URL,
  geonamesAdminUrl: BAARLE_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: VISIT_BAARLE_ENCLAVES_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q9830',
  sourceName: 'Visit Baarle/GeoNames Baarle enclave references',
  rows: BAARLE_ENCLAVE_ROWS,
});

const PHEASANT_ISLAND_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Pheasant Island Condominium',
    featureClass: 'special-region',
    typeNote: 'condominium reference',
    sourceLabel: 'Hendaye describes Pheasant Island as a condominium under France and Spain with powers changing every six months',
    geonamesLabel: 'Pheasant Island public place-name cross-reference',
    centroid: { lat: 43.344, lon: -1.763, precision: 'region' },
    localNames: { en: 'Pheasant Island Condominium', fr: 'Île des Faisans', es: 'Isla de los Faisanes', eu: 'Konpantzia' },
    notes: ['Condominium anchor only; no date-specific current authority, public-access right, border-crossing, postal, or delivery claim is made.'],
  },
  {
    name: 'Bidasoa River Setting',
    featureClass: 'region',
    typeNote: 'river-setting reference',
    sourceLabel: 'Bidasoa tourism describes the island as located in the Bidasoa river setting between Irun/Hondarribia and Hendaye',
    geonamesLabel: 'Bidasoa river setting public place-name cross-reference',
    centroid: { lat: 43.344, lon: -1.763, precision: 'region' },
    localNames: { en: 'Bidasoa River Setting', fr: 'Bidassoa', es: 'Bidasoa', eu: 'Bidasoa' },
    notes: ['River-setting anchor only; hydrological boundary geometry and crossing conditions are linked for review, not bundled.'],
  },
  {
    name: 'Hendaye Shore',
    featureClass: 'settlement',
    typeNote: 'adjacent French locality reference',
    sourceLabel: 'Hendaye public page records the handover ceremony for the island',
    geonamesLabel: 'Hendaye public place-name cross-reference',
    centroid: { lat: 43.358, lon: -1.774, precision: 'settlement' },
    localNames: { en: 'Hendaye Shore', fr: 'Hendaye' },
    notes: ['Adjacent-locality anchor only; no address, event-access, crossing, or delivery-service layer is bundled.'],
  },
  {
    name: 'Irun Shore',
    featureClass: 'settlement',
    typeNote: 'adjacent Spanish locality reference',
    sourceLabel: 'Bidasoa tourism describes Irun as one of the responsible municipalities for the island',
    geonamesLabel: 'Irun public place-name cross-reference',
    centroid: { lat: 43.338, lon: -1.789, precision: 'settlement' },
    localNames: { en: 'Irun Shore', es: 'Irun', eu: 'Irun' },
    notes: ['Adjacent-locality anchor only; no address, event-access, crossing, or delivery-service layer is bundled.'],
  },
  {
    name: 'Hondarribia Reference',
    featureClass: 'settlement',
    typeNote: 'historical adjacent-locality reference',
    sourceLabel: 'Bidasoa tourism notes historical association with Hondarribia',
    geonamesLabel: 'Hondarribia public place-name cross-reference',
    centroid: { lat: 43.368, lon: -1.794, precision: 'settlement' },
    localNames: { en: 'Hondarribia Reference', es: 'Hondarribia', eu: 'Hondarribia', alternate: 'Fuenterrabia' },
    notes: ['Historical locality anchor only; no current administration, access, or delivery claim is made.'],
  },
];

const PHEASANT_ISLAND_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'PHIS',
  countryName: 'Pheasant Island',
  countryLocalNames: { en: 'Pheasant Island', fr: 'Île des Faisans', es: 'Isla de los Faisanes', eu: 'Konpantzia' },
  countryCentroid: { lat: 43.344, lon: -1.763 },
  countryNotes: [
    'Neutral special-region seed for Pheasant Island / Île des Faisans / Isla de los Faisanes; public place metadata only.',
    'The complete PHIS slice records the condominium anchor, Bidasoa river setting, Hendaye shore, Irun shore, and Hondarribia reference anchors.',
    'AGID does not assert date-specific current authority, border-crossing rights, public access, event access, postal validity, or delivery availability.',
  ],
  officialUrl: HENDAYE_PHEASANT_HANDOVER_URL,
  geonamesAdminUrl: PHEASANT_ISLAND_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: BIDASOA_PHEASANT_ISLAND_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q64071',
  sourceName: 'Hendaye/Bidasoa/GeoNames Pheasant Island references',
  rows: PHEASANT_ISLAND_ROWS,
});

const BOUVET_ISLAND_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Bouvetøya Main Island',
    featureClass: 'island',
    typeNote: 'island reference',
    sourceLabel: 'Norwegian Polar Institute describes Bouvetøya as a Norwegian volcanic island in the Southern Ocean',
    geonamesLabel: 'Bouvet Island dependent political entity public cross-reference',
    centroid: { lat: -54.4333, lon: 3.4, precision: 'region' },
    localNames: { en: 'Bouvetøya Main Island', no: 'Bouvetøya', alternate: 'Bouvet Island' },
    geodataLinks: { geonames: 'https://www.geonames.org/3371123/bouvet-island.html' },
    notes: ['Island anchor only; no inhabited-address, postal, delivery, landing, or rescue-service claim is made.'],
  },
  {
    name: 'Nyrøysa',
    featureClass: 'special-region',
    typeNote: 'landing-area reference',
    sourceLabel: 'Norwegian Polar Institute regulations mention the Nyrøysa field-station area and landing constraints',
    geonamesLabel: 'Nyrøysa public place-name cross-reference',
    centroid: { lat: -54.405, lon: 3.35, precision: 'region' },
    localNames: { en: 'Nyrøysa', no: 'Nyrøysa', alternate: 'Nyroysa' },
    notes: ['Landing-area anchor only; AGID does not grant landing permission, safety assurance, rescue availability, or logistics access.'],
  },
  {
    name: 'Olavtoppen',
    featureClass: 'special-region',
    typeNote: 'peak reference',
    sourceLabel: 'Norwegian Polar Institute identifies Olavtoppen as the highest peak on the island',
    geonamesLabel: 'Olav Peak / Olavtoppen public place-name cross-reference',
    centroid: { lat: -54.409, lon: 3.353, precision: 'region' },
    localNames: { en: 'Olavtoppen', no: 'Olavtoppen', alternate: 'Olav Peak' },
    notes: ['Peak anchor only; no route, climbing, safety, or survey-precision claim is made.'],
  },
  {
    name: 'Norvegia Station',
    featureClass: 'settlement',
    typeNote: 'field-station reference',
    sourceLabel: 'Norwegian Polar Institute regulations refer to the field station in the Nyrøysa area',
    geonamesLabel: 'Norvegia station public place-name cross-reference',
    centroid: { lat: -54.405, lon: 3.35, precision: 'settlement' },
    localNames: { en: 'Norvegia Station', no: 'Norvegia' },
    notes: ['Field-station anchor only; no public accommodation, rescue service, permanent settlement, or delivery availability is claimed.'],
  },
  {
    name: 'Larsøya',
    featureClass: 'island',
    typeNote: 'minor-island reference',
    sourceLabel: 'public Bouvetøya references include Larsøya as a nearby minor island anchor',
    geonamesLabel: 'Larsøya public place-name cross-reference',
    centroid: { lat: -54.405, lon: 3.36, precision: 'region' },
    localNames: { en: 'Larsøya', no: 'Larsøya', alternate: 'Lars Island' },
    notes: ['Minor-island anchor only; small-island geometry, access status, and safety claims are not bundled.'],
  },
  {
    name: 'Kapp Valdivia',
    featureClass: 'special-region',
    typeNote: 'cape reference',
    sourceLabel: 'public Bouvetøya references include Kapp Valdivia as a named cape anchor',
    geonamesLabel: 'Kapp Valdivia public place-name cross-reference',
    centroid: { lat: -54.395, lon: 3.43, precision: 'region' },
    localNames: { en: 'Kapp Valdivia', no: 'Kapp Valdivia', alternate: 'Cape Valdivia' },
    notes: ['Cape anchor only; no route, landing, weather, rescue, or safety claim is made.'],
  },
];

const BOUVET_ISLAND_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'BV',
  countryName: 'Bouvet Island',
  countryLocalNames: { en: 'Bouvet Island', no: 'Bouvetøya' },
  countryCentroid: { lat: -54.4333, lon: 3.4 },
  countryNotes: [
    'Source-linked Bouvet Island seed for public polar place metadata only.',
    'The complete BV slice records Bouvetøya Main Island, Nyrøysa, Olavtoppen, Norvegia Station, Larsøya, and Kapp Valdivia anchors.',
    'AGID does not assert inhabited addresses, postal validity, delivery availability, landing permission, rescue availability, route safety, or operational access.',
  ],
  officialUrl: NPI_BOUVETOYA_URL,
  geonamesAdminUrl: BOUVET_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: BOUVET_GEONAMES_COUNTRY_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q23408',
  sourceName: 'Norwegian Polar Institute/GeoNames Bouvet Island references',
  rows: BOUVET_ISLAND_ROWS,
});

const DESVENTURADAS_ISLANDS_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Desventuradas Islands Archipelago',
    featureClass: 'special-region',
    typeNote: 'archipelago reference',
    sourceLabel: 'SUBPESCA states the Desventuradas archipelago comprises San Ambrosio, San Félix, González Islet, and Roca Catedral',
    geonamesLabel: 'Marine Regions Desventuradas archipelago public cross-reference',
    centroid: { lat: -26.3235, lon: -79.975, precision: 'region' },
    localNames: { en: 'Desventuradas Islands Archipelago', es: 'Islas Desventuradas', alternate: 'San Félix and San Ambrosio Islands' },
    notes: ['Archipelago anchor only; no civilian settlement, naval facility, access, anchorage, postal, or delivery claim is made.'],
  },
  {
    name: 'San Ambrosio Island',
    featureClass: 'island',
    typeNote: 'island reference',
    sourceLabel: 'SUBPESCA lists San Ambrosio as one of the Desventuradas islands',
    geonamesLabel: 'San Ambrosio public place-name cross-reference',
    centroid: { lat: -26.35, lon: -79.87, precision: 'region' },
    localNames: { en: 'San Ambrosio Island', es: 'Isla San Ambrosio' },
    notes: ['Island anchor only; no landing, habitation, route safety, facility, postal, or delivery claim is bundled.'],
  },
  {
    name: 'San Félix Island',
    featureClass: 'island',
    typeNote: 'island reference',
    sourceLabel: 'SUBPESCA lists San Félix as one of the Desventuradas islands',
    geonamesLabel: 'San Félix public place-name cross-reference',
    centroid: { lat: -26.285, lon: -80.096, precision: 'region' },
    localNames: { en: 'San Félix Island', es: 'Isla San Félix', alternate: 'San Felix Island' },
    notes: ['Island anchor only; no airfield operation, military status, landing, postal, or delivery availability claim is bundled.'],
  },
  {
    name: 'González Islet',
    featureClass: 'island',
    typeNote: 'islet reference',
    sourceLabel: 'SUBPESCA lists Islote González as one of the Desventuradas islets',
    geonamesLabel: 'González Islet public place-name cross-reference',
    centroid: { lat: -26.283, lon: -80.067, precision: 'region' },
    localNames: { en: 'González Islet', es: 'Islote González', alternate: 'Gonzalez Islet' },
    notes: ['Islet anchor only; no boundary precision, landing, safety, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Roca Catedral',
    featureClass: 'island',
    typeNote: 'rock reference',
    sourceLabel: 'SUBPESCA lists Roca Catedral as one of the Desventuradas islets/rocks',
    geonamesLabel: 'Roca Catedral public place-name cross-reference',
    centroid: { lat: -26.2736, lon: -80.1206, precision: 'region' },
    localNames: { en: 'Roca Catedral', es: 'Roca Catedral', alternate: 'Cathedral Rock' },
    notes: ['Rock anchor only; no landing, route, safety, survey-precision, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Nazca-Desventuradas Marine Park',
    featureClass: 'special-region',
    typeNote: 'marine-park reference',
    sourceLabel: 'Chilean environmental and fisheries sources identify Parque Marino Nazca-Desventuradas around the islands',
    geonamesLabel: 'Nazca-Desventuradas marine park public reference',
    centroid: { lat: -26.35, lon: -80.0, precision: 'region' },
    localNames: { en: 'Nazca-Desventuradas Marine Park', es: 'Parque Marino Nazca-Desventuradas' },
    notes: ['Marine-protection anchor only; no legal advice, permitted activity, navigation, fishing, or enforcement layer is bundled.'],
  },
];

const DESVENTURADAS_ISLANDS_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'CL-DI',
  countryName: 'Desventuradas Islands',
  countryLocalNames: { en: 'Desventuradas Islands', es: 'Islas Desventuradas' },
  countryCentroid: { lat: -26.3235, lon: -79.975 },
  countryNotes: [
    'Source-linked Desventuradas Islands seed for public oceanic-island place metadata only.',
    'The complete CL-DI slice records the archipelago, San Ambrosio, San Félix, González Islet, Roca Catedral, and Nazca-Desventuradas Marine Park anchors.',
    'AGID does not assert civilian settlement, military/facility status, landing permission, access rights, route safety, postal validity, delivery availability, or operational logistics.',
  ],
  officialUrl: SUBPESCA_DESVENTURADAS_URL,
  geonamesAdminUrl: DESVENTURADAS_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: MARINE_REGIONS_DESVENTURADAS_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q525501',
  sourceName: 'SUBPESCA/MMA/Marine Regions Desventuradas references',
  rows: DESVENTURADAS_ISLANDS_ROWS,
});

const SALAS_GOMEZ_ISLAND_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Salas y Gómez / Motu Motiro Hiva',
    featureClass: 'island',
    typeNote: 'island reference',
    sourceLabel: 'Chilean National Monuments Council identifies Salas y Gómez / Motu Motiro Hiva as an insular territory in the Pacific',
    geonamesLabel: 'GeoNames and Marine Regions Salas y Gómez island cross-reference',
    centroid: { lat: -26.4667, lon: -105.4667, precision: 'region' },
    localNames: { en: 'Salas y Gómez / Motu Motiro Hiva', es: 'Isla Salas y Gómez', rap: 'Motu Motiro Hiva' },
    notes: ['Island anchor only; no settlement, freshwater, landing, access, postal, or delivery availability claim is made.'],
  },
  {
    name: 'Salas y Gómez Twin Rocks and Isthmus',
    featureClass: 'special-region',
    typeNote: 'micro-topography reference',
    sourceLabel: 'Chilean National Monuments Council describes the island as two rocks linked by a narrow isthmus',
    geonamesLabel: 'Salas y Gómez micro-topography public cross-reference',
    centroid: { lat: -26.4667, lon: -105.4667, precision: 'region' },
    localNames: { en: 'Salas y Gómez Twin Rocks and Isthmus', es: 'Rocas e istmo de Salas y Gómez' },
    notes: ['Micro-topography anchor only; no survey-precision, safe access, tide, landing, or route claim is bundled.'],
  },
  {
    name: 'Salas y Gómez Nature Sanctuary',
    featureClass: 'special-region',
    typeNote: 'nature-sanctuary reference',
    sourceLabel: 'Chilean National Monuments Council records the island and adjacent Easter Island islets as a Nature Sanctuary',
    geonamesLabel: 'Salas y Gómez sanctuary public reference',
    centroid: { lat: -26.4667, lon: -105.4667, precision: 'region' },
    localNames: { en: 'Salas y Gómez Nature Sanctuary', es: 'Santuario de la Naturaleza Isla Salas y Gómez' },
    notes: ['Protected-area anchor only; no permit, access, monitoring, legal advice, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Motu Motiro Hiva Marine Park',
    featureClass: 'special-region',
    typeNote: 'marine-park reference',
    sourceLabel: 'SIMBIO records Parque Nacional Motu Motiro Hiva around Isla Sala y Gómez',
    geonamesLabel: 'Motu Motiro Hiva marine park public reference',
    centroid: { lat: -26.47, lon: -105.47, precision: 'region' },
    localNames: { en: 'Motu Motiro Hiva Marine Park', es: 'Parque Nacional Motu Motiro Hiva' },
    notes: ['Marine-park anchor only; no fishing, navigation, enforcement, permit, route, or delivery claim is bundled.'],
  },
  {
    name: 'Rapa Nui Administrative Reference',
    featureClass: 'special-region',
    typeNote: 'administrative-context reference',
    sourceLabel: 'Chilean sources link Salas y Gómez administratively with Valparaíso / Isla de Pascua context',
    geonamesLabel: 'Rapa Nui / Valparaíso administrative-context public cross-reference',
    centroid: { lat: -27.1167, lon: -109.3667, precision: 'region' },
    localNames: { en: 'Rapa Nui Administrative Reference', es: 'Referencia administrativa Rapa Nui / Isla de Pascua', rap: 'Rapa Nui' },
    notes: ['Administrative-context anchor only; no address, residence, transport, access, or delivery-service layer is bundled.'],
  },
];

const SALAS_GOMEZ_ISLAND_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'CL-SG',
  countryName: 'Salas y Gomez Island',
  countryLocalNames: { en: 'Salas y Gómez Island', es: 'Isla Salas y Gómez', rap: 'Motu Motiro Hiva' },
  countryCentroid: { lat: -26.4667, lon: -105.4667 },
  countryNotes: [
    'Source-linked Salas y Gómez / Motu Motiro Hiva seed for public remote-island place metadata only.',
    'The complete CL-SG slice records the island, twin-rock/isthmus reference, nature sanctuary, Motu Motiro Hiva Marine Park, and Rapa Nui administrative-context anchor.',
    'AGID does not assert settlement, freshwater availability, landing permission, public access, permit status, route safety, postal validity, delivery availability, or operational logistics.',
  ],
  officialUrl: MONUMENTOS_SALAS_GOMEZ_URL,
  geonamesAdminUrl: SALAS_GOMEZ_GEONAMES_URL,
  geonamesCountryUrl: MARINE_REGIONS_SALAS_GOMEZ_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q727542',
  sourceName: 'Chilean monuments/SIMBIO/Marine Regions Salas y Gómez references',
  rows: SALAS_GOMEZ_ISLAND_ROWS,
});

const CLIPPERTON_ISLAND_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Île de La Passion-Clipperton',
    featureClass: 'island',
    typeNote: 'island reference',
    sourceLabel: 'French Overseas Ministry describes Île de La Passion-Clipperton as an isolated French overseas territory',
    geonamesLabel: 'GeoNames Clipperton Island public cross-reference',
    centroid: { lat: 10.303, lon: -109.216, precision: 'region' },
    localNames: { en: 'Clipperton Island', fr: 'Île de La Passion-Clipperton', alternate: 'La Passion-Clipperton' },
    notes: ['Island anchor only; no habitation, access, anchorage, landing, postal, or delivery claim is made.'],
  },
  {
    name: 'Clipperton Atoll',
    featureClass: 'special-region',
    typeNote: 'atoll reference',
    sourceLabel: 'French Overseas Ministry describes the territory as an atoll with a closed lagoon and coral reef',
    geonamesLabel: 'Clipperton atoll public place-name cross-reference',
    centroid: { lat: 10.303, lon: -109.216, precision: 'region' },
    localNames: { en: 'Clipperton Atoll', fr: 'Atoll de Clipperton' },
    notes: ['Atoll anchor only; no navigability, safe landing, anchorage, route, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Clipperton Inner Lagoon',
    featureClass: 'special-region',
    typeNote: 'lagoon reference',
    sourceLabel: 'French Overseas Ministry describes the island as surrounding a closed interior lagoon',
    geonamesLabel: 'Clipperton lagoon public feature cross-reference',
    centroid: { lat: 10.303, lon: -109.216, precision: 'region' },
    localNames: { en: 'Clipperton Inner Lagoon', fr: 'Lagon intérieur de Clipperton' },
    notes: ['Lagoon anchor only; no bathymetry, water quality, navigation, access, or safety claim is bundled.'],
  },
  {
    name: 'Rocher de Clipperton',
    featureClass: 'special-region',
    typeNote: 'rock reference',
    sourceLabel: 'public Clipperton references identify the atoll rock outcrop as Rocher de Clipperton',
    geonamesLabel: 'Rocher de Clipperton public place-name cross-reference',
    centroid: { lat: 10.295, lon: -109.211, precision: 'region' },
    localNames: { en: 'Clipperton Rock', fr: 'Rocher de Clipperton' },
    notes: ['Rock anchor only; no climbing, landing, safety, survey-precision, postal, or delivery claim is bundled.'],
  },
  {
    name: 'French 12 NM Clipperton Territorial Sea',
    featureClass: 'special-region',
    typeNote: 'territorial-sea reference',
    sourceLabel: 'Marine Regions records French 12 NM territorial sea around Clipperton Island',
    geonamesLabel: 'Marine Regions Clipperton territorial sea cross-reference',
    centroid: { lat: 10.3045, lon: -109.2173, precision: 'region' },
    localNames: { en: 'French 12 NM Clipperton Territorial Sea', fr: 'Mer territoriale française de Clipperton' },
    notes: ['Maritime-zone anchor only; no legal advice, navigation permission, enforcement, or operational access layer is bundled.'],
  },
  {
    name: 'French Exclusive Economic Zone (Clipperton Island)',
    featureClass: 'special-region',
    typeNote: 'exclusive-economic-zone reference',
    sourceLabel: 'Marine Regions records the French Exclusive Economic Zone around Clipperton Island',
    geonamesLabel: 'Marine Regions Clipperton EEZ cross-reference',
    centroid: { lat: 10.3087, lon: -109.2173, precision: 'region' },
    localNames: { en: 'French Exclusive Economic Zone (Clipperton Island)', fr: 'Zone économique exclusive française de Clipperton' },
    notes: ['EEZ anchor only; no legal advice, maritime entitlement validation, navigation, fishing, or enforcement layer is bundled.'],
  },
];

const CLIPPERTON_ISLAND_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'CP',
  countryName: 'Clipperton Island',
  countryLocalNames: { en: 'Clipperton Island', fr: 'Île de La Passion-Clipperton' },
  countryCentroid: { lat: 10.303, lon: -109.216 },
  countryNotes: [
    'Source-linked Clipperton / La Passion-Clipperton seed for public remote-atoll place metadata only.',
    'The complete CP slice records the island, atoll, inner lagoon, Rocher de Clipperton, 12 NM territorial sea, and EEZ anchors.',
    'AGID does not assert habitation, postal validity, delivery availability, landing permission, mooring permission, route safety, rescue availability, or operational access.',
  ],
  officialUrl: OUTRE_MER_CLIPPERTON_URL,
  geonamesAdminUrl: CLIPPERTON_GEONAMES_URL,
  geonamesCountryUrl: MARINE_REGIONS_CLIPPERTON_EEZ_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q161258',
  sourceName: 'French Overseas Ministry/Legifrance/Marine Regions Clipperton references',
  rows: CLIPPERTON_ISLAND_ROWS,
});

const DHEKELIA_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Eastern Sovereign Base Area',
    featureClass: 'special-region',
    typeNote: 'sovereign-base-area reference',
    sourceLabel: 'SBAA Local Government Reform page identifies the Eastern Sovereign Base Areas (ESBA) and its relevant municipalities and communities',
    geonamesLabel: 'Dhekelia / Eastern Sovereign Base Area public place-name cross-reference',
    centroid: { lat: 35.02, lon: 33.75, precision: 'region' },
    localNames: { en: 'Eastern Sovereign Base Area', el: 'Ανατολική Περιοχή Κυρίαρχων Βάσεων', alternate: 'ESBA; Dhekelia Sovereign Base Area' },
    notes: ['Area anchor only; no operational, security, access, postal, or delivery claim is made.'],
  },
  {
    name: 'Dhekelia Area Administration Office Reference',
    featureClass: 'special-region',
    typeNote: 'civil-administration reference',
    sourceLabel: 'SBAA Administration page states there is an Area Office in each SBA and names the Area Office of Akrotiri and Dhekelia',
    geonamesLabel: 'Dhekelia civil-administration public cross-reference',
    centroid: { lat: 35.03, lon: 33.74, precision: 'region' },
    localNames: { en: 'Dhekelia Area Administration Office Reference', alternate: 'Dhekelia AAO Reference' },
    notes: ['Civil-administration anchor only; no public-service entitlement, office-hours, access, address, or delivery claim is bundled.'],
  },
  {
    name: 'Dhekelia Cantonment Reference',
    featureClass: 'settlement',
    typeNote: 'cantonment reference',
    sourceLabel: 'SBAA public administration material and public gazetteer references identify Dhekelia as an SBA place anchor',
    geonamesLabel: 'Dhekelia public place-name cross-reference',
    centroid: { lat: 35.033, lon: 33.733, precision: 'settlement' },
    localNames: { en: 'Dhekelia Cantonment Reference', alternate: 'Dhekelia' },
    notes: ['Cantonment place-name anchor only; no military unit, operational facility, access right, security status, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Agios Nikolaos Special Area of Conservation',
    featureClass: 'special-region',
    typeNote: 'protected-area reference',
    sourceLabel: 'SBAA Environment page lists the Agios Nicolaos Special Area of Conservation map',
    geonamesLabel: 'Agios Nikolaos / Ayios Nikolaos public place-name cross-reference',
    centroid: { lat: 35.066, lon: 33.887, precision: 'region' },
    localNames: { en: 'Agios Nikolaos Special Area of Conservation', el: 'Άγιος Νικόλαος', alternate: 'Ayios Nikolaos; Agios Nicolaos' },
    notes: ['Protected-area anchor only; no protected-area geometry, access, permit, crossing, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Cape Pyla Special Area of Conservation',
    featureClass: 'special-region',
    typeNote: 'protected-area reference',
    sourceLabel: 'SBAA Environment page lists the Cavo Pyla / Cape Pyla Special Area of Conservation map',
    geonamesLabel: 'Cape Pyla / Cavo Pyla public place-name cross-reference',
    centroid: { lat: 34.982, lon: 33.756, precision: 'region' },
    localNames: { en: 'Cape Pyla Special Area of Conservation', el: 'Κάβο Πύλα', alternate: 'Cavo Pyla' },
    notes: ['Protected-area anchor only; no precise conservation geometry, legal advice, access, permit, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Xylotymbou-Xylophagou-Ormidhia Community Cluster Reference',
    featureClass: 'special-region',
    typeNote: 'community-cluster reference',
    sourceLabel: 'SBAA Local Government Reform page identifies Xylotymbou-Xylophagou-Ormidhia as an ESBA community cluster of interest',
    geonamesLabel: 'Xylotymbou / Xylophagou / Ormidhia public place-name cross-reference',
    centroid: { lat: 35.008, lon: 33.77, precision: 'region' },
    localNames: { en: 'Xylotymbou-Xylophagou-Ormidhia Community Cluster Reference', el: 'Ξυλοτύμπου-Ξυλοφάγου-Ορμήδεια', alternate: 'Xylotymbou; Xylophagou; Ormidhia; Ormideia' },
    notes: ['Community-cluster anchor only; no enclave boundary, municipal authority, postal validity, route, access, or delivery claim is bundled.'],
  },
];

const DHEKELIA_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'XD',
  countryName: 'Dhekelia',
  countryLocalNames: { en: 'Dhekelia', el: 'Δεκέλεια', tr: 'Dikelya' },
  countryCentroid: { lat: 35.02, lon: 33.75 },
  countryNotes: [
    'Source-linked Dhekelia / Eastern Sovereign Base Area seed for public place metadata only.',
    'The complete XD slice records the Eastern Sovereign Base Area, Dhekelia Area Administration Office reference, Dhekelia Cantonment reference, Agios Nikolaos SAC, Cape Pyla SAC, and Xylotymbou-Xylophagou-Ormidhia community-cluster reference anchors.',
    'AGID does not assert operational status, military facility details, security status, access rights, crossing rules, postal validity, delivery availability, public-service entitlement, or legal advice.',
  ],
  officialUrl: SBA_ADMINISTRATION_URL,
  geonamesAdminUrl: DHEKELIA_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: DHEKELIA_GEONAMES_SEARCH_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q467348',
  sourceName: 'SBA Administration/Local Government Reform/Environment Dhekelia references',
  rows: DHEKELIA_ROWS,
});

const AKROTIRI_ROWS: CompactFirstOrderSeed[] = [
  {
    name: 'Western Sovereign Base Area',
    featureClass: 'special-region',
    typeNote: 'sovereign-base-area reference',
    sourceLabel: 'SBAA Local Government Reform page identifies the Western Sovereign Base Areas (WSBA) and its relevant municipalities and communities',
    geonamesLabel: 'Akrotiri / Western Sovereign Base Area public place-name cross-reference',
    centroid: { lat: 34.617, lon: 32.967, precision: 'region' },
    localNames: { en: 'Western Sovereign Base Area', el: 'Δυτική Περιοχή Κυρίαρχων Βάσεων', alternate: 'WSBA; Akrotiri Sovereign Base Area' },
    notes: ['Area anchor only; no operational, security, access, postal, or delivery claim is made.'],
  },
  {
    name: 'Akrotiri Area Administration Office Reference',
    featureClass: 'special-region',
    typeNote: 'civil-administration reference',
    sourceLabel: 'SBAA Administration page states there is an Area Office in each SBA and names the Area Office of Akrotiri and Dhekelia',
    geonamesLabel: 'Akrotiri civil-administration public cross-reference',
    centroid: { lat: 34.61, lon: 32.96, precision: 'region' },
    localNames: { en: 'Akrotiri Area Administration Office Reference', alternate: 'Akrotiri AAO Reference' },
    notes: ['Civil-administration anchor only; no public-service entitlement, office-hours, access, address, or delivery claim is bundled.'],
  },
  {
    name: 'Episkopi Headquarters Reference',
    featureClass: 'settlement',
    typeNote: 'headquarters place-name reference',
    sourceLabel: 'SBAA Administration page states the Headquarters of the SBAA is at Episkopi',
    geonamesLabel: 'Episkopi / Episkopi Cantonment public place-name cross-reference',
    centroid: { lat: 34.68, lon: 32.86, precision: 'settlement' },
    localNames: { en: 'Episkopi Headquarters Reference', el: 'Επισκοπή', alternate: 'Episkopi Cantonment; Episkopi Garrison' },
    notes: ['Headquarters place-name anchor only; no office access, military function, security, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Akrotiri Peninsula Environmental Reference',
    featureClass: 'special-region',
    typeNote: 'environmental-place reference',
    sourceLabel: 'SBAA Environment page lists Akrotiri Peninsula environmental publications and an Akrotiri Peninsula Environmental Management Plan',
    geonamesLabel: 'Akrotiri Peninsula public place-name cross-reference',
    centroid: { lat: 34.604, lon: 32.966, precision: 'region' },
    localNames: { en: 'Akrotiri Peninsula Environmental Reference', el: 'Ακρωτήρι', alternate: 'Akrotiri Peninsula' },
    notes: ['Environmental-place anchor only; no protected-area geometry, public access, route safety, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Akrotiri Special Area of Conservation',
    featureClass: 'special-region',
    typeNote: 'protected-area reference',
    sourceLabel: 'SBAA Environment page lists the Akrotiri Special Area of Conservation map',
    geonamesLabel: 'Akrotiri SAC public place-name cross-reference',
    centroid: { lat: 34.61, lon: 32.94, precision: 'region' },
    localNames: { en: 'Akrotiri Special Area of Conservation', el: 'Ακρωτήρι', alternate: 'Akrotiri SAC' },
    notes: ['Protected-area anchor only; no conservation-boundary geometry, permit, public access, legal advice, postal, or delivery claim is bundled.'],
  },
  {
    name: 'Avdimou-Paramali Community Cluster Reference',
    featureClass: 'special-region',
    typeNote: 'community-cluster reference',
    sourceLabel: 'SBAA Local Government Reform page identifies Avdimou-Paramali as a WSBA community cluster of interest',
    geonamesLabel: 'Avdimou / Paramali public place-name cross-reference',
    centroid: { lat: 34.67, lon: 32.78, precision: 'region' },
    localNames: { en: 'Avdimou-Paramali Community Cluster Reference', el: 'Αυδήμου-Παραμάλι', alternate: 'Avdimou; Paramali' },
    notes: ['Community-cluster anchor only; no municipal authority, postal validity, route, access, or delivery claim is bundled.'],
  },
];

const AKROTIRI_PLACE_SEEDS = compactCountryPlaceSeeds({
  countryCode: 'XU',
  countryName: 'Akrotiri',
  countryLocalNames: { en: 'Akrotiri', el: 'Ακρωτήρι', tr: 'Ağrotur' },
  countryCentroid: { lat: 34.617, lon: 32.967 },
  countryNotes: [
    'Source-linked Akrotiri / Western Sovereign Base Area seed for public place metadata only.',
    'The complete XU slice records the Western Sovereign Base Area, Akrotiri Area Administration Office reference, Episkopi headquarters reference, Akrotiri Peninsula environmental reference, Akrotiri SAC, and Avdimou-Paramali community-cluster reference anchors.',
    'AGID does not assert operational status, military facility details, security status, access rights, crossing rules, postal validity, delivery availability, public-service entitlement, or legal advice.',
  ],
  officialUrl: SBA_ADMINISTRATION_URL,
  geonamesAdminUrl: AKROTIRI_GEONAMES_SEARCH_URL,
  geonamesCountryUrl: AKROTIRI_GEONAMES_SEARCH_URL,
  wikidata: 'https://www.wikidata.org/wiki/Q467348',
  sourceName: 'SBA Administration/Local Government Reform/Environment Akrotiri references',
  rows: AKROTIRI_ROWS,
});

const BELGIUM_PLACE_SEEDS: GazetteerPlaceSeed[] = [
  {
    agidPlaceId: agidPlaceId('BE', 'Belgium'),
    name: 'Belgium',
    localNames: {
      en: 'Belgium',
      nl: 'Belgie',
      fr: 'Belgique',
      de: 'Belgien',
    },
    featureClass: 'country',
    adminPath: ['Belgium'],
    agidPath: ['agid:country:BE'],
    approximateCentroid: { lat: 50.5039, lon: 4.4699, precision: 'country' },
    geodataLinks: {
      osm: 'https://www.openstreetmap.org/relation/52411',
      wikidata: 'https://www.wikidata.org/wiki/Q31',
      geonames: 'https://www.geonames.org/2802361',
      official: 'https://statbel.fgov.be/',
    },
    validationState: 'source-linked',
    notes: ['Country-level seed only; not a full gazetteer import.'],
  },
  {
    agidPlaceId: agidPlaceId('BE', 'Brussels-Capital Region'),
    name: 'Brussels-Capital Region',
    localNames: {
      en: 'Brussels-Capital Region',
      nl: 'Brussels Hoofdstedelijk Gewest',
      fr: 'Region de Bruxelles-Capitale',
      de: 'Region Brussel-Hauptstadt',
    },
    featureClass: 'region',
    adminPath: ['Belgium', 'Brussels-Capital Region'],
    agidPath: ['agid:country:BE', agidPlaceId('BE', 'Brussels-Capital Region')],
    approximateCentroid: { lat: 50.8503, lon: 4.3517, precision: 'region' },
    geodataLinks: {
      osm: 'https://www.openstreetmap.org/relation/54094',
      wikidata: 'https://www.wikidata.org/wiki/Q240',
      geonames: 'https://www.geonames.org/2800866',
      official: 'https://be.brussels/',
    },
    validationState: 'source-linked',
    notes: ['Region seed; boundary geometry is linked, not bundled.'],
  },
  {
    agidPlaceId: agidPlaceId('BE', 'Flemish Region'),
    name: 'Flemish Region',
    localNames: {
      en: 'Flemish Region',
      nl: 'Vlaams Gewest',
      fr: 'Region flamande',
      de: 'Flaemische Region',
    },
    featureClass: 'region',
    adminPath: ['Belgium', 'Flemish Region'],
    agidPath: ['agid:country:BE', agidPlaceId('BE', 'Flemish Region')],
    approximateCentroid: { lat: 51.0000, lon: 4.5000, precision: 'region' },
    geodataLinks: {
      wikidata: 'https://www.wikidata.org/wiki/Q9337',
      official: 'https://www.vlaanderen.be/',
    },
    validationState: 'seed-only',
    notes: ['Needs boundary source reconciliation before verified status.'],
  },
  {
    agidPlaceId: agidPlaceId('BE', 'Walloon Region'),
    name: 'Walloon Region',
    localNames: {
      en: 'Walloon Region',
      nl: 'Waals Gewest',
      fr: 'Region wallonne',
      de: 'Wallonische Region',
    },
    featureClass: 'region',
    adminPath: ['Belgium', 'Walloon Region'],
    agidPath: ['agid:country:BE', agidPlaceId('BE', 'Walloon Region')],
    approximateCentroid: { lat: 50.4170, lon: 4.4510, precision: 'region' },
    geodataLinks: {
      wikidata: 'https://www.wikidata.org/wiki/Q231',
      official: 'https://www.wallonie.be/',
    },
    validationState: 'seed-only',
    notes: ['Needs boundary source reconciliation before verified status.'],
  },
  {
    agidPlaceId: agidPlaceId('BE', 'Brussels'),
    name: 'Brussels',
    localNames: {
      en: 'Brussels',
      nl: 'Brussel',
      fr: 'Bruxelles',
      de: 'Bruessel',
    },
    featureClass: 'capital',
    adminPath: ['Belgium', 'Brussels-Capital Region', 'Brussels'],
    agidPath: ['agid:country:BE', agidPlaceId('BE', 'Brussels-Capital Region'), agidPlaceId('BE', 'Brussels')],
    approximateCentroid: { lat: 50.8503, lon: 4.3517, precision: 'city' },
    geodataLinks: {
      osm: 'https://www.openstreetmap.org/relation/58225',
      wikidata: 'https://www.wikidata.org/wiki/Q239',
      geonames: 'https://www.geonames.org/2800866',
    },
    validationState: 'source-linked',
    notes: ['Capital/city seed for search and address-candidate tests.'],
  },
  {
    agidPlaceId: agidPlaceId('BE', 'Antwerp'),
    name: 'Antwerp',
    localNames: {
      en: 'Antwerp',
      nl: 'Antwerpen',
      fr: 'Anvers',
      de: 'Antwerpen',
    },
    featureClass: 'city',
    adminPath: ['Belgium', 'Flemish Region', 'Antwerp Province', 'Antwerp'],
    agidPath: ['agid:country:BE', agidPlaceId('BE', 'Flemish Region'), agidPlaceId('BE', 'Antwerp')],
    approximateCentroid: { lat: 51.2194, lon: 4.4025, precision: 'city' },
    geodataLinks: {
      osm: 'https://www.openstreetmap.org/relation/59518',
      wikidata: 'https://www.wikidata.org/wiki/Q12892',
      geonames: 'https://www.geonames.org/2803138',
    },
    validationState: 'source-linked',
    notes: ['City seed; not a building or recipient address.'],
  },
  {
    agidPlaceId: agidPlaceId('BE', 'Ghent'),
    name: 'Ghent',
    localNames: {
      en: 'Ghent',
      nl: 'Gent',
      fr: 'Gand',
      de: 'Gent',
    },
    featureClass: 'city',
    adminPath: ['Belgium', 'Flemish Region', 'East Flanders', 'Ghent'],
    agidPath: ['agid:country:BE', agidPlaceId('BE', 'Flemish Region'), agidPlaceId('BE', 'Ghent')],
    approximateCentroid: { lat: 51.0543, lon: 3.7174, precision: 'city' },
    geodataLinks: {
      osm: 'https://www.openstreetmap.org/relation/55841',
      wikidata: 'https://www.wikidata.org/wiki/Q1296',
      geonames: 'https://www.geonames.org/2797656',
    },
    validationState: 'source-linked',
    notes: ['Multilingual name seed for parser/translation tests.'],
  },
  {
    agidPlaceId: agidPlaceId('BE', 'Liege'),
    name: 'Liege',
    localNames: {
      en: 'Liege',
      fr: 'Liege',
      nl: 'Luik',
      de: 'Luettich',
    },
    featureClass: 'city',
    adminPath: ['Belgium', 'Walloon Region', 'Liege Province', 'Liege'],
    agidPath: ['agid:country:BE', agidPlaceId('BE', 'Walloon Region'), agidPlaceId('BE', 'Liege')],
    approximateCentroid: { lat: 50.6326, lon: 5.5797, precision: 'city' },
    geodataLinks: {
      wikidata: 'https://www.wikidata.org/wiki/Q3992',
      geonames: 'https://www.geonames.org/2792413',
    },
    validationState: 'seed-only',
    notes: ['ASCII display name used in seed; native accented aliases can be added after normalization tests.'],
  },
  {
    agidPlaceId: agidPlaceId('BE', 'Charleroi'),
    name: 'Charleroi',
    localNames: {
      en: 'Charleroi',
      fr: 'Charleroi',
      nl: 'Charleroi',
      de: 'Charleroi',
    },
    featureClass: 'city',
    adminPath: ['Belgium', 'Walloon Region', 'Hainaut', 'Charleroi'],
    agidPath: ['agid:country:BE', agidPlaceId('BE', 'Walloon Region'), agidPlaceId('BE', 'Charleroi')],
    approximateCentroid: { lat: 50.4108, lon: 4.4446, precision: 'city' },
    geodataLinks: {
      wikidata: 'https://www.wikidata.org/wiki/Q81046',
      geonames: 'https://www.geonames.org/2800481',
    },
    validationState: 'seed-only',
    notes: ['City seed; boundary geometry is not bundled.'],
  },
  {
    agidPlaceId: agidPlaceId('BE', 'Bruges'),
    name: 'Bruges',
    localNames: {
      en: 'Bruges',
      nl: 'Brugge',
      fr: 'Bruges',
      de: 'Bruegge',
    },
    featureClass: 'city',
    adminPath: ['Belgium', 'Flemish Region', 'West Flanders', 'Bruges'],
    agidPath: ['agid:country:BE', agidPlaceId('BE', 'Flemish Region'), agidPlaceId('BE', 'Bruges')],
    approximateCentroid: { lat: 51.2093, lon: 3.2247, precision: 'city' },
    geodataLinks: {
      wikidata: 'https://www.wikidata.org/wiki/Q12994',
      geonames: 'https://www.geonames.org/2800931',
    },
    validationState: 'seed-only',
    notes: ['Multilingual name seed for old/new spelling tests.'],
  },
];

const DEFAULT_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Use OSM as linked evidence first. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Use entity links and multilingual aliases as evidence; keep source attribution in the ledger.'],
  },
  {
    id: 'geonames',
    name: 'GeoNames',
    url: 'https://www.geonames.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Use GeoNames identifiers as cross-reference evidence; review redistribution before bundling extracts.'],
  },
  {
    id: 'local-official',
    name: 'Local official geodata portals',
    url: 'https://statbel.fgov.be/',
    role: 'admin-boundary',
    ingestionStatus: 'not-ingested',
    licenseStatus: 'open-review-required',
    redistribution: 'not-bundled',
    notes: ['Official sources should be reviewed per dataset before import.'],
  },
];

const ALAND_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'aland-government-municipalities',
    name: 'Government of Åland municipality list',
    url: ALAND_GOVERNMENT_MUNICIPALITIES_URL,
    role: 'admin-boundary',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as an official source link for the complete set of 16 municipalities; no upstream tables or boundary data are bundled.',
    ],
  },
  {
    id: 'geonames-ax-admin',
    name: 'GeoNames AX administrative division listing',
    url: ALAND_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for public municipality names and administrative codes; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'asub',
    name: 'Statistics and Research Åland',
    url: ALAND_ASUB_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a statistical reference source for municipality grouping checks; no tables are bundled in this pack.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const NAURU_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'nauru-government-all-districts',
    name: 'Government of the Republic of Nauru all-district consultation notice',
    url: NAURU_GOVERNMENT_ALL_DISTRICTS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official government source confirming public consultation coverage across all 14 districts; no page content is bundled.',
    ],
  },
  {
    id: 'geonames-nr-admin',
    name: 'GeoNames NR administrative division listing',
    url: NAURU_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for public district names and administrative codes; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-nr-country',
    name: 'GeoNames Nauru country metadata',
    url: NAURU_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and postal-code-status cross-reference; no extract is bundled.'],
  },
  {
    id: 'statoids-nr',
    name: 'Statoids Nauru districts reference',
    url: NAURU_STATOIDS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a secondary district-code reference; not an imported authoritative dataset.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const BRUNEI_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'brunei-information-department',
    name: 'Information Department, Prime Minister\'s Office, Brunei Darussalam',
    url: BRUNEI_INFORMATION_DEPARTMENT_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official government page used to confirm the west/east district grouping and capital metadata; no page content is bundled.',
    ],
  },
  {
    id: 'geonames-bn-admin',
    name: 'GeoNames BN administrative division listing',
    url: BRUNEI_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for public district names, ISO subentity codes, and administrative codes; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-bn-country',
    name: 'GeoNames Brunei country metadata',
    url: BRUNEI_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata cross-reference; no extract is bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const MICRONESIA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'fsm-government',
    name: 'Official FSM Government website',
    url: MICRONESIA_GOVERNMENT_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official government website used to cross-link the four state governments; no page content is bundled.',
    ],
  },
  {
    id: 'geonames-fm-admin',
    name: 'GeoNames FM administrative division listing',
    url: MICRONESIA_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for public state names, ISO subentity codes, and administrative codes; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-fm-country',
    name: 'GeoNames Micronesia country metadata',
    url: MICRONESIA_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata cross-reference; no extract is bundled.'],
  },
  {
    id: 'pacific-risa-fsm',
    name: 'Pacific RISA Federated States of Micronesia profile',
    url: MICRONESIA_PACIFIC_RISA_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a secondary public reference for the four-state structure; no page content is bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const LUXEMBOURG_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'luxembourg-public-territory',
    name: 'Luxembourg.lu territory page',
    url: LUXEMBOURG_TERRITORY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official national portal page used to confirm the 12-canton first-level territorial structure; no page content is bundled.',
    ],
  },
  {
    id: 'geonames-lu-admin',
    name: 'GeoNames LU administrative division listing',
    url: LUXEMBOURG_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for public canton names, ISO subentity codes, and administrative codes; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-lu-country',
    name: 'GeoNames Luxembourg country metadata',
    url: LUXEMBOURG_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata cross-reference; no extract is bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const NEW_CALEDONIA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'new-caledonia-government-provinces',
    name: 'Government of New Caledonia provinces page',
    url: NEW_CALEDONIA_PROVINCES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official New Caledonia government page used to confirm the three provinces; no page content is bundled.',
    ],
  },
  {
    id: 'new-caledonia-state-provinces',
    name: 'French State services in New Caledonia provinces page',
    url: NEW_CALEDONIA_STATE_PROVINCES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Secondary official state-service source for the three-province structure; no page content is bundled.',
    ],
  },
  {
    id: 'geonames-nc-admin',
    name: 'GeoNames NC administrative division listing',
    url: NEW_CALEDONIA_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for public province names, GeoNames subentity codes, and administrative codes; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-nc-country',
    name: 'GeoNames New Caledonia country metadata',
    url: NEW_CALEDONIA_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata cross-reference; no extract is bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const WALLIS_FUTUNA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'wallis-futuna-institutional-organization',
    name: 'French State services in Wallis and Futuna institutional organization page',
    url: WALLIS_FUTUNA_INSTITUTIONAL_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official state-services source for the customary-kingdom/circumscription structure; no page content is bundled.',
    ],
  },
  {
    id: 'wallis-futuna-culture-heritage',
    name: 'French State services in Wallis and Futuna culture and heritage page',
    url: WALLIS_FUTUNA_CULTURE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official state-services source for Wallis/Uvea and Futuna customary kingdom context; no page content is bundled.',
    ],
  },
  {
    id: 'octa-wallis-futuna',
    name: 'OCTA Wallis and Futuna profile',
    url: WALLIS_FUTUNA_OCTA_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Secondary public profile confirming Uvea, Alo, and Sigave as customary kingdoms; no page content is bundled.',
    ],
  },
  {
    id: 'geonames-wf-admin',
    name: 'GeoNames WF administrative division listing',
    url: WALLIS_FUTUNA_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for public chiefdom names, GeoNames subentity codes, and administrative codes; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-wf-country',
    name: 'GeoNames Wallis and Futuna country metadata',
    url: WALLIS_FUTUNA_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata cross-reference; no extract is bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const PITCAIRN_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'pitcairn-government-home',
    name: 'Official Government of the Pitcairn Islands website',
    url: PITCAIRN_GOVERNMENT_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official source confirming the Pitcairn Islands group comprises Pitcairn, Henderson, Ducie, and Oeno; no page content is bundled.',
    ],
  },
  {
    id: 'visit-pitcairn-islands',
    name: 'Visit Pitcairn Islands page',
    url: PITCAIRN_VISIT_ISLANDS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Public Pitcairn Islands tourism source used as a secondary island-name reference; no page content is bundled.',
    ],
  },
  {
    id: 'geonames-pn-country',
    name: 'GeoNames Pitcairn Islands country metadata',
    url: PITCAIRN_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for country metadata and Adamstown capital cross-reference; no extract is bundled.',
    ],
  },
  {
    id: 'statoids-pn',
    name: 'Statoids Pitcairn administrative division note',
    url: PITCAIRN_STATOIDS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used only as a no-administrative-division cross-check; no table or extract is bundled.',
    ],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const FAROE_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'faroe-government-about',
    name: 'Government of the Faroe Islands about page',
    url: FAROE_GOVERNMENT_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official government source confirming the Faroe Islands are an archipelago of 18 mountainous islands; no page content is bundled.',
    ],
  },
  {
    id: 'faroe-official-site',
    name: 'Official site of the Faroe Islands',
    url: FAROE_OFFICIAL_SITE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official country presentation source used for island-count and country identity cross-checking; no page content is bundled.',
    ],
  },
  {
    id: 'faroe-statistics-islands',
    name: 'Statistics Faroe Islands island geography page',
    url: FAROE_STATISTICS_ISLANDS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for public island-name and island-area evidence; no tables, statistics, or extracts are bundled.',
    ],
  },
  {
    id: 'visit-faroe-maps',
    name: 'Visit Faroe Islands maps page',
    url: FAROE_VISIT_MAPS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Secondary public source confirming 18 rugged mountainous islands and regional maps; no map or page content is bundled.',
    ],
  },
  {
    id: 'geonames-fo-country',
    name: 'GeoNames Faroe Islands country metadata',
    url: FAROE_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for country metadata and Tórshavn capital cross-reference; no extract is bundled.',
    ],
  },
  {
    id: 'geonames-fo-statistics',
    name: 'GeoNames Faroe Islands feature statistics',
    url: FAROE_GEONAMES_STATS_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as a feature-class cross-check for Faroe administrative and place coverage; review redistribution before importing extracts.',
    ],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const MARSHALL_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'marshall-constitution-electoral-districts',
    name: 'Constitution of the Republic of the Marshall Islands electoral districts',
    url: MARSHALL_CONSTITUTION_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official constitutional source for the 24 Nitijela electoral districts and associated uninhabited atolls; no page content is bundled.',
    ],
  },
  {
    id: 'marshall-local-government-constitutions',
    name: 'RMI Judiciary local government constitution index',
    url: MARSHALL_LOCAL_GOVERNMENTS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official judiciary index of local government constitutions used to cross-check municipality/local-government coverage; no linked PDFs are bundled.',
    ],
  },
  {
    id: 'geonames-mh-admin',
    name: 'GeoNames MH administrative division listing',
    url: MARSHALL_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for Ralik/Ratak chain cross-reference; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-mh-country',
    name: 'GeoNames Marshall Islands country metadata',
    url: MARSHALL_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for country metadata and Majuro capital cross-reference; no extract is bundled.',
    ],
  },
  {
    id: 'statoids-mh-municipalities',
    name: 'Statoids Marshall Islands municipalities table',
    url: MARSHALL_STATOIDS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as a secondary HASC/GEC/chain and alternate spelling cross-check; no table extract is bundled.',
    ],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const MALAYSIA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'mygeoportal-upi-land-admin-codes',
    name: 'MyGeoportal Unique Parcel Identifier land administration codes',
    url: MALAYSIA_MYGEO_UPI_URL,
    role: 'admin-boundary',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official National Geospatial Centre source listing land administration code documents for all 16 states/federal territories; no PDF, Excel, or boundary extract is bundled.',
    ],
  },
  {
    id: 'dosm-my-local-stats-state-district',
    name: 'Department of Statistics Malaysia My Local Stats state and administrative district release',
    url: MALAYSIA_DOSM_LOCAL_STATS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official DOSM source confirming Malaysia-wide, 13 state, three federal territory, and district publication coverage; no statistical tables are bundled.',
    ],
  },
  {
    id: 'opendosm-households-state',
    name: 'OpenDOSM household and living quarters by state dataset metadata',
    url: MALAYSIA_OPENDOSM_STATE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'OpenDOSM metadata confirms the state variable covers 16 states including the three federal territories and is CC BY 4.0; only metadata is linked in this seed pack.',
    ],
  },
  {
    id: 'mygeoportal-pdng',
    name: 'MyGeoportal Geographical Name Database guidance',
    url: MALAYSIA_MYGEO_PDNG_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official National Geospatial Centre source for geographical-name guidelines and Malaysian Standard MS 2256:2009 reference; no names database extract is bundled.',
    ],
  },
  {
    id: 'geonames-my-admin',
    name: 'GeoNames MY administrative division listing',
    url: MALAYSIA_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for ADM1 cross-reference, subdivision names, type labels, capitals, and GeoNames links; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-my-country',
    name: 'GeoNames Malaysia country metadata',
    url: MALAYSIA_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for country metadata, language metadata, postal-code format, and Kuala Lumpur capital cross-reference; no extract is bundled.',
    ],
  },
  {
    id: 'geonames-my-statistics',
    name: 'GeoNames Malaysia feature statistics',
    url: MALAYSIA_GEONAMES_STATS_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as a count cross-check for 16 first-order administrative divisions; no feature extract is bundled.',
    ],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const NETHERLANDS_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'government-nl-provinces',
    name: 'Government.nl provinces page',
    url: NETHERLANDS_GOV_PROVINCES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official Government of the Netherlands source describing provincial authorities; no page content is bundled.',
    ],
  },
  {
    id: 'business-gov-nl-government-levels',
    name: 'Business.gov.nl Dutch government levels page',
    url: NETHERLANDS_BUSINESS_GOV_LIFE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official business portal page used as a cross-check that the Netherlands has 12 provinces; no page content is bundled.',
    ],
  },
  {
    id: 'government-nl-bes-governance',
    name: 'Government.nl governance of Bonaire, St Eustatius and Saba',
    url: NETHERLANDS_GOV_BES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official Government of the Netherlands source confirming Bonaire, St Eustatius, and Saba are public bodies of the Netherlands and not part of a Dutch province.',
    ],
  },
  {
    id: 'cbs-dutch-caribbean-introduction',
    name: 'Statistics Netherlands Dutch Caribbean introduction',
    url: NETHERLANDS_CBS_CARIBBEAN_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Statistics Netherlands source confirming the country of the Netherlands has European and Caribbean parts and that Caribbean Netherlands comprises Bonaire, Saba, and St Eustatius.',
    ],
  },
  {
    id: 'geonames-nl-admin',
    name: 'GeoNames NL administrative division listing',
    url: NETHERLANDS_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for the 12 province names, ISO/FIPS/GN cross-reference, capitals, language tags, and GeoNames links; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-nl-country',
    name: 'GeoNames Netherlands country metadata',
    url: NETHERLANDS_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for country metadata, Amsterdam capital cross-reference, postal-code format, and dependency/public-body cross-reference; no extract is bundled.',
    ],
  },
  {
    id: 'geonames-nl-statistics',
    name: 'GeoNames Netherlands feature statistics',
    url: NETHERLANDS_GEONAMES_STATS_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as an administrative feature count cross-check; no feature extract is bundled.',
    ],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const POLYNESIA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'pref-polynesia-communes-archipels',
    name: 'High Commission communes by archipelago presentation',
    url: POLYNESIA_PREF_COMMUNES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official French State services source confirming 48 communes distributed across five archipelagos/subdivision groups; no page content is bundled.',
    ],
  },
  {
    id: 'pref-polynesia-subdivisions',
    name: 'High Commission administrative subdivisions index',
    url: POLYNESIA_PREF_SUBDIVISIONS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official French State services source listing administrative subdivision pages; no linked page content is bundled.',
    ],
  },
  {
    id: 'ispf-population-legal-subdivisions',
    name: 'ISPF legal population by administrative subdivision note',
    url: POLYNESIA_ISPF_POPULATION_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Local statistics institute source used for subdivision/population cross-checking; no statistical tables are bundled.',
    ],
  },
  {
    id: 'geonames-pf-admin',
    name: 'GeoNames PF administrative division listing',
    url: POLYNESIA_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for the five ADM1 administrative subdivision names, administrative codes, capitals, and GeoNames links; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-pf-country',
    name: 'GeoNames French Polynesia country metadata',
    url: POLYNESIA_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for country metadata, Papeete capital cross-reference, postal-code format, and national data provider reference; no extract is bundled.',
    ],
  },
  {
    id: 'geonames-pf-statistics',
    name: 'GeoNames French Polynesia feature statistics',
    url: POLYNESIA_GEONAMES_STATS_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as an administrative feature count cross-check for five first-order administrative divisions; no feature extract is bundled.',
    ],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const KIRIBATI_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'kiribati-nso-districts',
    name: 'Kiribati National Statistics Office district listing',
    url: KIRIBATI_NSO_DISTRICTS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official statistics source used to define the five district groupings and their listed islands/councils; no page content or boundary geometry is bundled.',
    ],
  },
  {
    id: 'kiribati-tourism-about',
    name: 'Kiribati National Tourism Office country overview',
    url: KIRIBATI_TOURISM_ABOUT_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Official tourism source used to cross-check the three island groups, 33 coral islands, capital Tarawa, and Bairiki administrative center reference.',
    ],
  },
  {
    id: 'geonames-ki-admin',
    name: 'GeoNames KI administrative division listing',
    url: KIRIBATI_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as an ADM1/ADM2 cross-reference for Gilbert Islands, Line Islands, Phoenix Islands, and 33 island records; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-ki-country',
    name: 'GeoNames Kiribati country metadata',
    url: KIRIBATI_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for country metadata, ISO code, language metadata, and Tarawa capital cross-reference; no extract is bundled.',
    ],
  },
  {
    id: 'geonames-ki-statistics',
    name: 'GeoNames Kiribati feature statistics',
    url: KIRIBATI_GEONAMES_STATS_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as a public feature-count cross-check for 3 ADM1 island groups and 33 ADM2 island records; no feature extract is bundled.',
    ],
  },
  {
    id: 'commonwealth-kiribati',
    name: 'Commonwealth Kiribati country profile',
    url: KIRIBATI_COMMONWEALTH_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as an independent public cross-check for island count and inhabited-island context; no content is bundled.',
    ],
  },
  {
    id: 'dfat-kiribati-brief',
    name: 'Australian DFAT Kiribati country brief',
    url: KIRIBATI_DFAT_BRIEF_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as an independent public cross-check for three island groups, Banaba context, and capital Tarawa; no content is bundled.',
    ],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const NORTH_KOREA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'geonames-kp-admin',
    name: 'GeoNames KP administrative division listing',
    url: NORTH_KOREA_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for the 13 ADM1 rows, first-order type labels, names, and capital/city cross-references; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-kp-country',
    name: 'GeoNames North Korea country metadata',
    url: NORTH_KOREA_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for country metadata, ISO code, Pyongyang capital cross-reference, and postal-code format note; no extract is bundled.',
    ],
  },
  {
    id: 'geonames-kp-statistics',
    name: 'GeoNames North Korea feature statistics',
    url: NORTH_KOREA_GEONAMES_STATS_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as a public feature-count cross-check for 13 first-order administrative divisions and downstream ADM2/ADM3 scope; no feature extract is bundled.',
    ],
  },
  {
    id: 'openfactbook-kp',
    name: 'OpenFactBook North Korea country profile',
    url: NORTH_KOREA_OPENFACTBOOK_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used to cross-check the 9 provinces, 4 special administration cities, Pyongyang capital note, and neutral administrative division wording.',
    ],
  },
  {
    id: 'pcgn-kp-admin-update',
    name: 'PCGN North Korea administrative divisions update',
    url: NORTH_KOREA_PCGN_ADMIN_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'UK PCGN information paper used to cross-check first-order administrative division status, romanization, and administrative-centre coordinates; no PDF content is bundled.',
    ],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const LAOS_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'geonames-la-admin',
    name: 'GeoNames LA administrative division listing',
    url: LAOS_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for first-order administrative rows, division type labels, names, and Vientiane capital/province disambiguation; review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-la-country',
    name: 'GeoNames Laos country metadata',
    url: LAOS_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for country metadata, ISO code, Vientiane capital cross-reference, and postal-code format note; no extract is bundled.',
    ],
  },
  {
    id: 'geonames-la-statistics',
    name: 'GeoNames Laos feature statistics',
    url: LAOS_GEONAMES_STATS_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as a public feature-count cross-check for first-order and downstream administrative features; no feature extract is bundled.',
    ],
  },
  {
    id: 'openfactbook-la',
    name: 'OpenFactBook Laos country profile',
    url: LAOS_OPENFACTBOOK_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used to cross-check the 17 provinces, 1 prefecture/capital unit, and neutral administrative division wording.',
    ],
  },
  {
    id: 'open-development-mekong-la-boundaries',
    name: 'Open Development Mekong Laos administrative boundaries dataset',
    url: LAOS_OPEN_DEVELOPMENT_BOUNDARIES_URL,
    role: 'admin-boundary',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as a future boundary import candidate for levels 0-3. This pack links the dataset only and does not bundle geometry.',
    ],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const MYANMAR_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'geonames-mm-admin',
    name: 'GeoNames MM administrative division listing',
    url: MYANMAR_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for region, state, and Nay Pyi Taw first-order rows. Review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-mm-country',
    name: 'GeoNames Myanmar country metadata',
    url: MYANMAR_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and Nay Pyi Taw capital cross-reference; no extract is bundled.'],
  },
  {
    id: 'geonames-mm-statistics',
    name: 'GeoNames Myanmar feature statistics',
    url: MYANMAR_GEONAMES_STATS_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public feature-count cross-check; no feature extract is bundled.'],
  },
  {
    id: 'administrative-geography-mm',
    name: 'Administrative geography of Myanmar cross-reference',
    url: MYANMAR_ADMIN_GEOGRAPHY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check the 7 regions, 7 states, and Nay Pyi Taw Union Territory scope.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const PAPUA_NEW_GUINEA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'geonames-pg-admin',
    name: 'GeoNames PG administrative division listing',
    url: PAPUA_NEW_GUINEA_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for province, National Capital district, and Bougainville first-order rows. Review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-pg-country',
    name: 'GeoNames Papua New Guinea country metadata',
    url: PAPUA_NEW_GUINEA_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and Port Moresby capital cross-reference; no extract is bundled.'],
  },
  {
    id: 'openfactbook-pg',
    name: 'OpenFactBook Papua New Guinea country profile',
    url: PAPUA_NEW_GUINEA_OPENFACTBOOK_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check the 20 provinces, 1 autonomous region, and 1 district count.'],
  },
  {
    id: 'bougainville-gov-quick-facts',
    name: 'Autonomous Bougainville Government quick facts',
    url: BOUGAINVILLE_GOV_QUICK_FACTS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as an official Bougainville autonomy cross-reference; no content is bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const PHILIPPINES_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'philatlas-ph-regions',
    name: 'PhilAtlas Philippines regions',
    url: PHILIPPINES_PHILATLAS_REGIONS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check the current 18-region layer and region naming; no content is bundled.'],
  },
  {
    id: 'psa-ph-nir',
    name: 'Philippine Statistics Authority Negros Island Region PSGC record',
    url: PHILIPPINES_PSA_NIR_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used to cross-check current Negros Island Region coverage after Republic Act No. 12000 and avoid stale region lists.',
    ],
  },
  {
    id: 'geonames-ph-admin',
    name: 'GeoNames PH administrative division listing',
    url: PHILIPPINES_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used as a legacy regional cross-reference only; current national/PSA region changes take precedence where GeoNames lags.',
    ],
  },
  {
    id: 'geonames-ph-country',
    name: 'GeoNames Philippines country metadata',
    url: PHILIPPINES_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and Manila capital cross-reference; no extract is bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const THAILAND_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'geonames-th-admin',
    name: 'GeoNames TH administrative division listing',
    url: THAILAND_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for Bangkok and province rows. Review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-th-country',
    name: 'GeoNames Thailand country metadata',
    url: THAILAND_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and Bangkok capital cross-reference; no extract is bundled.'],
  },
  {
    id: 'thailand-dicf',
    name: 'UNEP GRID DICF Thailand administrative geography profile',
    url: THAILAND_DICF_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check 76 provinces plus Bangkok as a special administrative unit.'],
  },
  {
    id: 'pcgn-th-toponymic-factfile',
    name: 'PCGN Thailand toponymic factfile',
    url: THAILAND_PCGN_FACTFILE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check first-order province count and toponymic treatment; PDF content is not bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const CHINA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'geonames-cn-admin',
    name: 'GeoNames CN administrative division listing',
    url: CHINA_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for province-level names, type labels, and compatibility rows. Review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-cn-country',
    name: 'GeoNames China country metadata',
    url: CHINA_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and Beijing capital cross-reference; no extract is bundled.'],
  },
  {
    id: 'china-admin-system',
    name: 'Administrative Division System, People\'s Republic of China',
    url: CHINA_ADMIN_SYSTEM_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used to cross-check the province, autonomous region, municipality, and special administrative region categories. Neutral AGID notes are required for disputed or separately published regions.',
    ],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const INDONESIA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'geonames-id-admin',
    name: 'GeoNames ID administrative division listing',
    url: INDONESIA_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for province and regional cross-reference rows. Review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-id-country',
    name: 'GeoNames Indonesia country metadata',
    url: INDONESIA_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and Jakarta capital cross-reference; no extract is bundled.'],
  },
  {
    id: 'pcgn-id-toponymic-factfile',
    name: 'PCGN Indonesia toponymic factfile',
    url: INDONESIA_PCGN_FACTFILE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check 38 first-order divisions and special-region/capital-district categories; PDF content is not bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const IRELAND_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'gov-ie-local-authorities',
    name: 'Gov.ie local authorities publication',
    url: IRELAND_GOV_LOCAL_AUTHORITIES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check the local authority layer and keep source links instead of bundling source extracts.'],
  },
  {
    id: 'localgov-ie-authorities',
    name: 'Local Government Ireland local authority finder',
    url: IRELAND_LOCALGOV_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check the 31 local authorities used by the practical address-routing layer.'],
  },
  {
    id: 'geonames-ie-admin',
    name: 'GeoNames IE administrative division listing',
    url: IRELAND_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for province and county cross-reference labels; current local authority source takes precedence for this pack.'],
  },
  {
    id: 'geonames-ie-country',
    name: 'GeoNames Ireland country metadata',
    url: IRELAND_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and capital cross-reference; no extract is bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const CAMBODIA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'geonames-kh-admin',
    name: 'GeoNames KH administrative division listing',
    url: CAMBODIA_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Used for province and Phnom Penh ADM1 cross-reference rows. Review redistribution terms before importing extracts.',
    ],
  },
  {
    id: 'geonames-kh-country',
    name: 'GeoNames Cambodia country metadata',
    url: CAMBODIA_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and Phnom Penh capital cross-reference; no extract is bundled.'],
  },
  {
    id: 'pcgn-kh-toponymic-factfile',
    name: 'PCGN Cambodia toponymic factfile',
    url: CAMBODIA_PCGN_FACTFILE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check 25 ADM1s: Phnom Penh plus 24 provinces; PDF content is not bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const SVALBARD_JAN_MAYEN_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'geonames-sj-admin',
    name: 'GeoNames SJ administrative division listing',
    url: SVALBARD_JAN_MAYEN_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for the Svalbard and Jan Mayen ADM1 component rows; no extract is bundled.'],
  },
  {
    id: 'geonames-sj-country',
    name: 'GeoNames Svalbard and Jan Mayen country metadata',
    url: SVALBARD_JAN_MAYEN_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and Longyearbyen capital cross-reference; no extract is bundled.'],
  },
  {
    id: 'geonames-sj-cities',
    name: 'GeoNames SJ largest cities listing',
    url: SVALBARD_JAN_MAYEN_GEONAMES_CITIES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used only to cross-check public settlement names such as Longyearbyen and Olonkinbyen.'],
  },
  {
    id: 'governor-svalbard-land-use',
    name: 'Governor of Svalbard land-use management',
    url: SVALBARD_GOVERNOR_LAND_USE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check Svalbard planning-area names and avoid overclaiming private or building-level data.'],
  },
  {
    id: 'norwegian-polar-institute-jan-mayen',
    name: 'Norwegian Polar Institute Jan Mayen overview',
    url: JAN_MAYEN_NPOLAR_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check Jan Mayen natural-geography and operational-station treatment.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for region-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const JAN_MAYEN_SOURCES: GazetteerRepositorySource[] = [
  SVALBARD_JAN_MAYEN_SOURCES[0],
  SVALBARD_JAN_MAYEN_SOURCES[1],
  SVALBARD_JAN_MAYEN_SOURCES[2],
  SVALBARD_JAN_MAYEN_SOURCES[4],
  SVALBARD_JAN_MAYEN_SOURCES[5],
  SVALBARD_JAN_MAYEN_SOURCES[6],
];

const SVALBARD_SOURCES: GazetteerRepositorySource[] = [
  SVALBARD_JAN_MAYEN_SOURCES[0],
  SVALBARD_JAN_MAYEN_SOURCES[1],
  SVALBARD_JAN_MAYEN_SOURCES[2],
  SVALBARD_JAN_MAYEN_SOURCES[3],
  SVALBARD_JAN_MAYEN_SOURCES[5],
  SVALBARD_JAN_MAYEN_SOURCES[6],
];

const VIETNAM_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'vietnam-government-34-provinces-2025',
    name: 'Vietnam Government News 34 provincial-level units',
    url: VIETNAM_GOV_REFORM_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Primary current administrative-structure reference for the 2025 34-unit provincial layer and two-tier local-government note.',
    ],
  },
  {
    id: 'vietnam-tourism-new-provincial-system',
    name: 'Vietnam Tourism new provincial system summary',
    url: VIETNAM_TOURISM_NEW_PROVINCES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Cross-checks the 28 provinces and 6 centrally governed cities list; content is not bundled.'],
  },
  {
    id: 'geonames-vn-admin',
    name: 'GeoNames VN administrative division listing',
    url: VIETNAM_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a compatibility cross-reference only where the current 2025 official 34-unit list differs from legacy ADM1 rows.'],
  },
  {
    id: 'geonames-vn-statistics',
    name: 'GeoNames Vietnam statistics',
    url: VIETNAM_GEONAMES_STATS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Legacy 63 ADM1 statistics are retained as a cautionary cross-check and must not override the current 34-unit source.'],
  },
  {
    id: 'geonames-vn-country',
    name: 'GeoNames Vietnam country metadata',
    url: VIETNAM_GEONAMES_COUNTRY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country metadata and Ha Noi capital cross-reference; no extract is bundled.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional boundary and place cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for country-level identity and multilingual alias cross-checking; keep attribution in the ledger.'],
  },
];

const BIR_TAWIL_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'osm-wiki-bir-tawil',
    name: 'OpenStreetMap Wiki Bir Tawil',
    url: BIR_TAWIL_OSM_WIKI_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for public mapping context and approximate region reference; no ODbL extract is bundled.'],
  },
  {
    id: 'wikidata-bir-tawil',
    name: 'Wikidata Bir Tawil',
    url: BIR_TAWIL_WIKIDATA_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and non-claim description cross-checking.'],
  },
  {
    id: 'wikipedia-bir-tawil',
    name: 'Wikipedia Bir Tawil article',
    url: BIR_TAWIL_WIKIPEDIA_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a narrative source for public geography labels only; not treated as authority for ownership or governance.'],
  },
  {
    id: 'geonames-bir-tawil-search',
    name: 'GeoNames Bir Tawil search cross-reference',
    url: BIR_TAWIL_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a name-search cross-reference only; no national administrative row is claimed.'],
  },
];

const CRIMEA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'ocha-crimea-reference-map',
    name: 'OCHA Autonomous Republic of Crimea reference map',
    url: CRIMEA_OCHA_MAP_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for neutral public reference-map anchoring; map content is not bundled.'],
  },
  {
    id: 'hdx-ukraine-cod-ab',
    name: 'HDX Ukraine COD-AB administrative boundaries',
    url: UKRAINE_HDX_COD_AB_URL,
    role: 'admin-boundary',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for administrative-code compatibility references; no boundary geometry is bundled in this seed pack.'],
  },
  {
    id: 'geonames-ua-admin',
    name: 'GeoNames Ukraine administrative division listing',
    url: UKRAINE_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for Crimea and Sevastopol public gazetteer cross-references.'],
  },
  {
    id: 'geonames-crimea',
    name: 'GeoNames Autonomous Republic of Crimea page',
    url: CRIMEA_GEONAMES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for the Crimea ADM1 name and Simferopol administrative-centre cross-reference.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity cross-checking; keep attribution in the ledger.'],
  },
];

const CYPRUS_GREEN_LINE_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'unficyp-buffer-zone',
    name: 'UNFICYP about the buffer zone',
    url: UNFICYP_BUFFER_ZONE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Primary reference for the buffer-zone / Green Line completion boundary.'],
  },
  {
    id: 'un-peacekeeping-unficyp-factsheet',
    name: 'UN Peacekeeping UNFICYP factsheet',
    url: UNFICYP_FACTSHEET_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to cross-check UNFICYP mandate context without bundling operational data.'],
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: [
      'Optional public place and crossing-point cross-reference. Do not bundle derived ODbL databases until attribution and share-alike boundaries are reviewed.',
    ],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const DONBAS_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'ocha-donetska-reference-map',
    name: 'OCHA Donetska Oblast reference map',
    url: DONETSK_OCHA_MAP_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for Donetsk/Donetska public reference-map anchoring; map content is not bundled.'],
  },
  {
    id: 'ocha-luhanska-reference-map',
    name: 'OCHA Luhanska Oblast reference map',
    url: LUHANSK_OCHA_MAP_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for Luhansk/Luhanska public reference-map anchoring; map content is not bundled.'],
  },
  {
    id: 'hdx-ukraine-cod-ab',
    name: 'HDX Ukraine COD-AB administrative boundaries',
    url: UKRAINE_HDX_COD_AB_URL,
    role: 'admin-boundary',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for oblast-level compatibility references; no boundary geometry is bundled in this seed pack.'],
  },
  {
    id: 'geonames-ua-admin',
    name: 'GeoNames Ukraine administrative division listing',
    url: UKRAINE_GEONAMES_ADMIN_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for public gazetteer labels and oblast/city cross-references.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const ETHIOPIA_ERITREA_BORDER_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'un-eebc-delimitation-decision',
    name: 'UN Reports of International Arbitral Awards: Eritrea-Ethiopia Boundary Commission decision',
    url: ETHIOPIA_ERITREA_EEBC_DECISION_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Primary legal/reference source for delimitation context; no map geometry or coordinates are bundled.'],
  },
  {
    id: 'unmee-background',
    name: 'United Nations Mission in Ethiopia and Eritrea background',
    url: ETHIOPIA_ERITREA_UNMEE_BACKGROUND_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used to record border-area conflict and mediation context without asserting current access or security status.'],
  },
  {
    id: 'pca-eebc-case',
    name: 'Permanent Court of Arbitration EEBC case page',
    url: ETHIOPIA_ERITREA_PCA_CASE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Case index cross-reference for the EEBC record; no extracted dataset is bundled.'],
  },
  {
    id: 'geonames-ethiopia-eritrea-border-search',
    name: 'GeoNames Ethiopia-Eritrea border search cross-reference',
    url: ETHIOPIA_ERITREA_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only; authoritative boundary status is not inferred.'],
  },
];

const NORTHERN_TERRITORIES_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'mofa-northern-territories',
    name: 'Japan MOFA Northern Territories page',
    url: JAPAN_MOFA_NORTHERN_TERRITORIES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for public four-island naming context; sovereignty assertions are not adopted as AGID claims.'],
  },
  {
    id: 'mofa-northern-territories-info',
    name: 'Japan MOFA Northern Territories information page',
    url: JAPAN_MOFA_NORTHERN_TERRITORIES_INFO_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for the four named islands and pre-war administrative reference notes; no personal or property records are bundled.'],
  },
  {
    id: 'geonames-northern-territories-search',
    name: 'GeoNames Northern Territories island search cross-reference',
    url: NORTHERN_TERRITORIES_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a multilingual place-name cross-reference only.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const SENKAKU_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'mofa-senkaku',
    name: 'Japan MOFA Senkaku Islands page',
    url: JAPAN_MOFA_SENKAKU_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for public island-group context; sovereignty/control assertions are not adopted as AGID claims.'],
  },
  {
    id: 'mofa-senkaku-information',
    name: 'Japan MOFA Senkaku Islands information page',
    url: JAPAN_MOFA_SENKAKU_INFO_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for the eight named islands/rocks and general geography notes; no boundary extract is bundled.'],
  },
  {
    id: 'geonames-senkaku-search',
    name: 'GeoNames Senkaku Islands search cross-reference',
    url: SENKAKU_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const TAKESHIMA_DOKDO_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'mofa-takeshima',
    name: 'Japan MOFA Takeshima page',
    url: JAPAN_MOFA_TAKESHIMA_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for Japanese public naming and dispute-context reference; sovereignty assertions are not adopted as AGID claims.'],
  },
  {
    id: 'korea-dokdo-location',
    name: 'Northeast Asian History Network Dokdo location and area page',
    url: KOREA_DOKDO_LOCATION_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for Dongdo/Seodo and minor-rock-islet public geography only; embedded address examples are not bundled.'],
  },
  {
    id: 'geonames-takeshima-dokdo-search',
    name: 'GeoNames Liancourt Rocks / Dokdo / Takeshima search cross-reference',
    url: TAKESHIMA_DOKDO_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const KASHMIR_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'unmogip-home',
    name: 'United Nations Military Observer Group in India and Pakistan',
    url: UNMOGIP_HOME_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for neutral mission context only; mandate, sovereignty, and control positions are not converted into AGID claims.'],
  },
  {
    id: 'unmogip-background',
    name: 'UNMOGIP background page',
    url: UNMOGIP_BACKGROUND_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for Line of Control context; no boundary geometry, access rule, or route-safety layer is bundled.'],
  },
  {
    id: 'unterm-line-of-control',
    name: 'UNTERM Line of Control entry',
    url: UNTERM_LINE_OF_CONTROL_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as terminology cross-reference only.'],
  },
  {
    id: 'geonames-kashmir-search',
    name: 'GeoNames Kashmir public place-name search cross-reference',
    url: KASHMIR_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only; no GeoNames extract is bundled.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const TRANSNISTRIA_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'osce-transnistrian-settlement',
    name: 'OSCE Mission to Moldova conflict prevention and Transdniestrian settlement page',
    url: OSCE_TRANSNISTRIAN_SETTLEMENT_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for settlement-process context and Dniester/Nistru communication references; no status, control, or service claim is adopted.'],
  },
  {
    id: 'moldova-transnistrian-terminology',
    name: 'Government of Moldova useful information and terminology guidance',
    url: MOLDOVA_GOV_TRANSNISTRIAN_TERMINOLOGY_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for neutral terminology and legal-status caution; no normative act, statehood, or legal-parity claim is bundled.'],
  },
  {
    id: 'geonames-transnistria-search',
    name: 'GeoNames Transnistria public place-name search cross-reference',
    url: TRANSNISTRIA_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only; no GeoNames extract is bundled.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const SOUTH_CHINA_SEA_ISLANDS_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'amti-china-island-tracker',
    name: 'Asia Maritime Transparency Initiative China Island Tracker',
    url: AMTI_CHINA_ISLAND_TRACKER_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for public feature names and aliases only; facilities, control, sovereignty, and navigation claims are not adopted.'],
  },
  {
    id: 'cna-south-china-sea-claims',
    name: 'CNA South China Sea feature group reference',
    url: CNA_SOUTH_CHINA_SEA_CLAIMS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for public feature-group classification only; maritime entitlement or sovereignty claims are not adopted.'],
  },
  {
    id: 'geonames-south-china-sea-search',
    name: 'GeoNames South China Sea feature search cross-reference',
    url: SOUTH_CHINA_SEA_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only; no GeoNames extract is bundled.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const NORTHERN_CYPRUS_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'eu-green-line-regulation',
    name: 'EU Green Line Regulation consolidated text',
    url: EU_GREEN_LINE_REGULATION_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for the neutral legal-reference phrase about areas not under effective control; no statehood, recognition, or service claim is adopted.'],
  },
  {
    id: 'unficyp-buffer-zone',
    name: 'UNFICYP buffer zone page',
    url: UNFICYP_BUFFER_ZONE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for Cyprus buffer-zone context only; no boundary extract, crossing rule, or route-safety assertion is bundled.'],
  },
  {
    id: 'geonames-northern-cyprus-search',
    name: 'GeoNames Northern Cyprus public place-name search cross-reference',
    url: NORTHERN_CYPRUS_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only; no GeoNames extract is bundled.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const BAARLE_ENCLAVES_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'visit-baarle-enclaves',
    name: 'Visit Baarle enclave overview',
    url: VISIT_BAARLE_ENCLAVES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for public enclave counts and numbering only; no parcel geometry, property address, or jurisdiction decision is bundled.'],
  },
  {
    id: 'baarle-hertog-official',
    name: 'Baarle-Hertog official municipality website',
    url: BAARLE_HERTOG_OFFICIAL_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as official municipality homepage link only.'],
  },
  {
    id: 'baarle-nassau-official',
    name: 'Baarle-Nassau official municipality website',
    url: BAARLE_NASSAU_OFFICIAL_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as official municipality homepage link only.'],
  },
  {
    id: 'geonames-baarle-search',
    name: 'GeoNames Baarle public place-name search cross-reference',
    url: BAARLE_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only; no GeoNames extract is bundled.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const PHEASANT_ISLAND_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'hendaye-pheasant-handover',
    name: 'Hendaye Pheasant Island handover ceremony page',
    url: HENDAYE_PHEASANT_HANDOVER_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for the condominium and six-month power-handover reference; no current-date authority, access, or border-crossing claim is adopted.'],
  },
  {
    id: 'bidasoa-pheasant-island',
    name: 'Bidasoa Turismo Pheasant Island page',
    url: BIDASOA_PHEASANT_ISLAND_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for local public context linking Irun/Hendaye/Hondarribia; no tourism access or service claim is bundled.'],
  },
  {
    id: 'geonames-pheasant-island-search',
    name: 'GeoNames Pheasant Island public place-name search cross-reference',
    url: PHEASANT_ISLAND_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only; no GeoNames extract is bundled.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const BOUVET_ISLAND_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'npi-bouvetoya',
    name: 'Norwegian Polar Institute Bouvetøya page',
    url: NPI_BOUVETOYA_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for public polar geography and nature-reserve context; no operational access or safety claim is bundled.'],
  },
  {
    id: 'npi-bouvetoya-regulations',
    name: 'Norwegian Polar Institute Bouvetøya Nature Reserve regulations page',
    url: NPI_BOUVETOYA_REGULATIONS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for access, regulation, and safety cautions; AGID does not grant permissions or logistics capability.'],
  },
  {
    id: 'geonames-bouvet-country',
    name: 'GeoNames Bouvet Island country metadata',
    url: BOUVET_GEONAMES_COUNTRY_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a country-level public place-name cross-reference only.'],
  },
  {
    id: 'geonames-bouvet-search',
    name: 'GeoNames Bouvet Island feature search cross-reference',
    url: BOUVET_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public feature-name cross-reference only; no GeoNames extract is bundled.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const DESVENTURADAS_ISLANDS_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'subpesca-desventuradas-marine-park',
    name: 'Chile SUBPESCA Desventuradas marine park announcement',
    url: SUBPESCA_DESVENTURADAS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official Chilean fisheries source naming San Ambrosio, San Félix, González Islet, and Roca Catedral; no page content is bundled.'],
  },
  {
    id: 'mma-nazca-desventuradas',
    name: 'Chile Ministry of Environment Nazca-Desventuradas Marine Park page',
    url: MMA_NAZCA_DESVENTURADAS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official environmental source for marine-park context around San Félix and San Ambrosio; no legal or activity permission layer is bundled.'],
  },
  {
    id: 'marine-regions-desventuradas',
    name: 'Marine Regions Desventuradas Islands archipelago record',
    url: MARINE_REGIONS_DESVENTURADAS_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as public archipelago coordinate and marine-gazetteer cross-reference; no geometry extract is bundled.'],
  },
  {
    id: 'geonames-desventuradas-search',
    name: 'GeoNames Desventuradas public place-name search cross-reference',
    url: DESVENTURADAS_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only; no GeoNames extract is bundled.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const SALAS_GOMEZ_ISLAND_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'monumentos-salas-gomez',
    name: 'Chilean National Monuments Council Salas y Gómez Nature Sanctuary page',
    url: MONUMENTOS_SALAS_GOMEZ_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official Chilean monuments source for Salas y Gómez / Motu Motiro Hiva location, no-settlement note, and sanctuary context; no page content is bundled.'],
  },
  {
    id: 'simbio-motu-motiro-hiva',
    name: 'SIMBIO Motu Motiro Hiva protected area record',
    url: SIMBIO_MOTU_MOTIRO_HIVA_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official biodiversity platform source for Motu Motiro Hiva marine-park context; no protected-area geometry is bundled.'],
  },
  {
    id: 'marine-regions-salas-gomez',
    name: 'Marine Regions Isla Salas y Gómez record',
    url: MARINE_REGIONS_SALAS_GOMEZ_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as public island coordinate and marine-gazetteer cross-reference; no geometry extract is bundled.'],
  },
  {
    id: 'geonames-salas-gomez',
    name: 'GeoNames Isla Salas y Gómez place record',
    url: SALAS_GOMEZ_GEONAMES_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only; no GeoNames extract is bundled.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const CLIPPERTON_ISLAND_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'outre-mer-clipperton',
    name: 'French Overseas Ministry La Passion-Clipperton page',
    url: OUTRE_MER_CLIPPERTON_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official French overseas source for Clipperton identity, protected and uninhabited context; no page content is bundled.'],
  },
  {
    id: 'legifrance-clipperton-status',
    name: 'Legifrance La Passion-Clipperton status section',
    url: LEGIFRANCE_CLIPPERTON_STATUS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official legal source for name/status and authorization caution; this seed pack is not legal advice.'],
  },
  {
    id: 'legifrance-clipperton-administration-decree',
    name: 'Legifrance Clipperton administration decree',
    url: LEGIFRANCE_CLIPPERTON_ADMIN_DECREE_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official legal source for consultative council and access-authorization procedures; no access right is inferred.'],
  },
  {
    id: 'marine-regions-clipperton-eez',
    name: 'Marine Regions French Exclusive Economic Zone (Clipperton Island) record',
    url: MARINE_REGIONS_CLIPPERTON_EEZ_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as public EEZ coordinate and marine-gazetteer cross-reference; no maritime-boundary extract is bundled.'],
  },
  {
    id: 'marine-regions-clipperton-12nm',
    name: 'Marine Regions French 12 NM (Clipperton Island) record',
    url: MARINE_REGIONS_CLIPPERTON_12NM_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as public territorial-sea coordinate and marine-gazetteer cross-reference; no maritime-boundary extract is bundled.'],
  },
  {
    id: 'geonames-clipperton',
    name: 'GeoNames Clipperton Island place record',
    url: CLIPPERTON_GEONAMES_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as a public place-name cross-reference only; no GeoNames extract is bundled.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const SBA_COMMON_SOURCES: GazetteerRepositorySource[] = [
  {
    id: 'sba-administration',
    name: 'Sovereign Base Areas Administration overview',
    url: SBA_ADMINISTRATION_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official SBAA civil-government source; used for public administration structure and Episkopi headquarters references only.'],
  },
  {
    id: 'sba-area-administration-offices',
    name: 'SBAA Area Administration Offices page',
    url: SBA_AREA_ADMINISTRATION_OFFICES_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official SBAA source for Area Office role and local-community interface; no service entitlement or office-access claim is adopted.'],
  },
  {
    id: 'sba-local-government-reform',
    name: 'SBAA Local Government Reform page',
    url: SBA_LOCAL_GOVERNMENT_REFORM_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official SBAA source for WSBA/ESBA municipal and community-cluster references; no boundary geometry or authority transfer is bundled.'],
  },
  {
    id: 'sba-environment',
    name: 'SBAA Environment and Special Areas of Conservation page',
    url: SBA_ENVIRONMENT_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Official SBAA source for Akrotiri, Episkopi, Dhekelia, Agios Nicolaos, and Cavo Pyla environmental references; no protected-area geometry is bundled.'],
  },
  {
    id: 'sba-declarations',
    name: 'Declarations by Her Majesty’s Government regarding the Administration of the Sovereign Base Areas',
    url: SBA_DECLARATIONS_URL,
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'open-review-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for non-claim safety notes about no colony, no civilian seaport/airport, no new settlement, and public-services delegation context; this pack is not legal advice.'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    url: 'https://www.wikidata.org/',
    role: 'reference',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used for multilingual identity and alias cross-checking; keep attribution in the ledger.'],
  },
];

const DHEKELIA_SOURCES: GazetteerRepositorySource[] = [
  ...SBA_COMMON_SOURCES,
  {
    id: 'geonames-dhekelia-search',
    name: 'GeoNames Dhekelia and Eastern Sovereign Base Area public place-name search cross-reference',
    url: DHEKELIA_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as public place-name cross-reference only; no GeoNames extract or coordinate database is bundled.'],
  },
];

const AKROTIRI_SOURCES: GazetteerRepositorySource[] = [
  ...SBA_COMMON_SOURCES,
  {
    id: 'geonames-akrotiri-search',
    name: 'GeoNames Akrotiri and Western Sovereign Base Area public place-name search cross-reference',
    url: AKROTIRI_GEONAMES_SEARCH_URL,
    role: 'gazetteer',
    ingestionStatus: 'seed-linked',
    licenseStatus: 'attribution-required',
    redistribution: 'metadata-link-only',
    notes: ['Used as public place-name cross-reference only; no GeoNames extract or coordinate database is bundled.'],
  },
];

function defaultReleaseGates() {
  return [
    'no-raw-personal-addresses',
    'no-recipient-records',
    'no-private-coordinates',
    'source-license-ledger-required',
    'agid-place-id-required',
    'geodata-link-required',
    'multilingual-name-preserved',
    'synthetic-fixtures-only-until-license-review',
  ];
}

function releaseGatesForCountry(countryCode: string, countryName?: string) {
  const base = defaultReleaseGates();
  if (countryCode === 'AX') {
    return [
      ...base,
      'complete-municipality-coverage-required',
      'all-municipalities-source-linked',
      'municipality-code-recorded',
      'conformance-covers-all-municipalities',
    ];
  }
  if (countryCode === 'NR') {
    return [
      ...base,
      'complete-district-coverage-required',
      'all-districts-source-linked',
      'district-code-recorded',
      'conformance-covers-all-districts',
    ];
  }
  if (countryCode === 'BN') {
    return [
      ...base,
      'complete-district-coverage-required',
      'all-districts-source-linked',
      'district-code-recorded',
      'conformance-covers-all-districts',
    ];
  }
  if (countryCode === 'FM') {
    return [
      ...base,
      'complete-state-coverage-required',
      'all-states-source-linked',
      'state-code-recorded',
      'conformance-covers-all-states',
    ];
  }
  if (countryCode === 'LU') {
    return [
      ...base,
      'complete-canton-coverage-required',
      'all-cantons-source-linked',
      'canton-code-recorded',
      'conformance-covers-all-cantons',
    ];
  }
  if (countryCode === 'NC') {
    return [
      ...base,
      'complete-province-coverage-required',
      'all-provinces-source-linked',
      'province-code-recorded',
      'conformance-covers-all-provinces',
    ];
  }
  if (countryCode === 'WF') {
    return [
      ...base,
      'complete-chiefdom-coverage-required',
      'all-chiefdoms-source-linked',
      'chiefdom-code-recorded',
      'conformance-covers-all-chiefdoms',
    ];
  }
  if (countryCode === 'PN') {
    return [
      ...base,
      'complete-island-coverage-required',
      'all-islands-source-linked',
      'inhabited-settlement-recorded',
      'no-admin-division-overclaim',
      'conformance-covers-all-islands-and-capital',
    ];
  }
  if (countryCode === 'FO') {
    return [
      ...base,
      'complete-main-island-coverage-required',
      'all-main-islands-source-linked',
      'capital-recorded',
      'smaller-islets-not-overclaimed',
      'conformance-covers-all-main-islands-and-capital',
    ];
  }
  if (countryCode === 'MH') {
    return [
      ...base,
      'complete-constitutional-district-coverage-required',
      'all-constitutional-districts-source-linked',
      'combined-districts-not-split',
      'atoll-island-anchor-layer-present',
      'combined-district-municipality-non-splitting-preserved',
      'no-all-islets-overclaim',
      'capital-district-recorded',
      'conformance-covers-all-constitutional-districts-and-atoll-island-anchors',
    ];
  }
  if (countryCode === 'MY') {
    return [
      ...base,
      'complete-first-order-coverage-required',
      'all-states-and-federal-territories-source-linked',
      'iso-subdivision-code-recorded',
      'capital-territory-recorded',
      'conformance-covers-all-first-order-divisions',
    ];
  }
  if (countryCode === 'NL') {
    return [
      ...base,
      'complete-province-and-bes-coverage-required',
      'all-provinces-source-linked',
      'bes-public-bodies-recorded',
      'capital-recorded',
      'no-bes-province-overclaim',
      'conformance-covers-provinces-bes-and-capital',
    ];
  }
  if (countryCode === 'PF') {
    return [
      ...base,
      'complete-administrative-subdivision-coverage-required',
      'all-subdivisions-source-linked',
      'subdivision-code-recorded',
      'capital-recorded',
      'commune-level-pack-deferred',
      'conformance-covers-all-subdivisions-and-capital',
    ];
  }
  if (countryCode === 'KI') {
    return [
      ...base,
      'complete-nso-district-coverage-required',
      'all-nso-districts-source-linked',
      'complete-33-island-coverage-required',
      'all-33-islands-source-linked',
      'district-island-list-recorded',
      'capital-recorded',
      'conformance-covers-all-districts-islands-and-capital',
    ];
  }
  if (countryCode === 'KP') {
    return [
      ...base,
      'complete-first-order-coverage-required',
      'all-first-order-divisions-source-linked',
      'province-and-special-city-counts-recorded',
      'pcgn-status-note-required',
      'no-second-order-overclaim',
      'conformance-covers-all-first-order-divisions',
    ];
  }
  if (countryCode === 'LA') {
    return [
      ...base,
      'complete-first-order-coverage-required',
      'all-provinces-and-capital-source-linked',
      'province-and-capital-counts-recorded',
      'vientiane-capital-province-disambiguated',
      'second-order-pack-deferred',
      'conformance-covers-all-first-order-divisions',
    ];
  }
  if (countryCode === 'MM') {
    return [
      ...base,
      'complete-first-order-coverage-required',
      'regions-states-union-territory-source-linked',
      'nay-pyi-taw-capital-recorded',
      'self-administered-layers-deferred',
      'conformance-covers-all-first-order-divisions',
    ];
  }
  if (countryCode === 'PG') {
    return [
      ...base,
      'complete-first-order-coverage-required',
      'province-autonomous-region-district-counts-recorded',
      'national-capital-district-recorded',
      'bougainville-autonomous-region-recorded',
      'district-level-pack-deferred',
      'conformance-covers-all-first-order-divisions',
    ];
  }
  if (countryCode === 'PH') {
    return [
      ...base,
      'complete-current-region-coverage-required',
      'all-regions-source-linked',
      'negros-island-region-current-recorded',
      'geonames-legacy-region-layer-not-overclaimed',
      'province-level-pack-deferred',
      'conformance-covers-all-current-regions',
    ];
  }
  if (countryCode === 'TH') {
    return [
      ...base,
      'complete-province-level-coverage-required',
      'bangkok-special-area-recorded',
      'all-76-provinces-source-linked',
      'district-level-pack-deferred',
      'conformance-covers-bangkok-and-provinces',
    ];
  }
  if (countryCode === 'CN') {
    return [
      ...base,
      'complete-province-level-compatibility-coverage-required',
      'province-autonomous-municipality-sar-counts-recorded',
      'neutral-disputed-boundary-note-required',
      'sar-standalone-repository-compatibility-recorded',
      'prefecture-level-pack-deferred',
      'conformance-covers-all-province-level-seeds',
    ];
  }
  if (countryCode === 'ID') {
    return [
      ...base,
      'complete-first-order-coverage-required',
      'all-38-first-order-divisions-source-linked',
      'special-region-and-capital-district-counts-recorded',
      'regency-city-pack-deferred',
      'conformance-covers-all-first-order-divisions',
    ];
  }
  if (countryCode === 'IE') {
    return [
      ...base,
      'complete-local-authority-coverage-required',
      'all-31-local-authorities-source-linked',
      'province-layer-not-overclaimed',
      'municipal-district-pack-deferred',
      'conformance-covers-all-local-authorities',
    ];
  }
  if (countryCode === 'KH') {
    return [
      ...base,
      'complete-adm1-coverage-required',
      'phnom-penh-capital-municipality-recorded',
      'all-24-provinces-source-linked',
      'district-commune-pack-deferred',
      'conformance-covers-all-adm1s',
    ];
  }
  if (countryCode === 'SJ' && countryName === 'Svalbard and Jan Mayen') {
    return [
      ...base,
      'complete-sj-component-coverage-required',
      'svalbard-and-jan-mayen-components-source-linked',
      'admin-centres-recorded',
      'no-single-administrative-system-overclaim',
      'conformance-covers-components-and-admin-centres',
    ];
  }
  if (countryCode === 'SJ' && countryName === 'Jan Mayen') {
    return [
      ...base,
      'complete-jan-mayen-operational-seed-required',
      'olonkinbyen-station-recorded',
      'beerenberg-natural-reference-recorded',
      'no-permanent-address-overclaim',
      'conformance-covers-jan-mayen-station-and-natural-reference',
    ];
  }
  if (countryCode === 'SJ' && countryName === 'Svalbard') {
    return [
      ...base,
      'complete-svalbard-planning-area-seed-required',
      'all-governor-planning-areas-source-linked',
      'longyearbyen-administrative-centre-recorded',
      'no-all-islands-overclaim',
      'conformance-covers-svalbard-planning-areas',
    ];
  }
  if (countryCode === 'VN') {
    return [
      ...base,
      'complete-2025-provincial-coverage-required',
      'all-34-current-provincial-units-source-linked',
      'legacy-63-adm1-not-overclaimed',
      'district-level-dissolution-note-required',
      'conformance-covers-all-current-provincial-units',
    ];
  }
  if (countryCode === 'BT_T') {
    return [
      ...base,
      'complete-bir-tawil-nonclaim-anchor-required',
      'natural-reference-anchors-source-linked',
      'no-sovereignty-claim',
      'no-permanent-address-overclaim',
      'conformance-covers-bir-tawil-public-anchors',
    ];
  }
  if (countryCode === 'CRIM') {
    return [
      ...base,
      'complete-crimea-nonclaim-anchor-required',
      'crimea-sevastopol-compatibility-anchors-source-linked',
      'no-sovereignty-adjudication',
      'no-current-control-overclaim',
      'conformance-covers-crimea-public-anchors',
    ];
  }
  if (countryCode === 'CYGL') {
    return [
      ...base,
      'complete-cyprus-green-line-buffer-anchor-required',
      'unficyp-buffer-zone-source-linked',
      'crossing-references-not-access-permits',
      'no-route-rights-overclaim',
      'conformance-covers-green-line-public-anchors',
    ];
  }
  if (countryCode === 'DONB') {
    return [
      ...base,
      'complete-donbas-nonclaim-anchor-required',
      'donetsk-luhansk-oblast-anchors-source-linked',
      'no-frontline-overclaim',
      'no-current-control-overclaim',
      'conformance-covers-donbas-public-anchors',
    ];
  }
  if (countryCode === 'EEBD') {
    return [
      ...base,
      'complete-ethiopia-eritrea-border-anchor-required',
      'eebc-unmee-source-linked',
      'no-demarcation-completion-overclaim',
      'no-current-control-or-access-overclaim',
      'conformance-covers-ethiopia-eritrea-public-anchors',
    ];
  }
  if (countryCode === 'JP_NT') {
    return [
      ...base,
      'complete-northern-territories-four-island-anchor-required',
      'all-four-islands-source-linked',
      'no-sovereignty-adjudication',
      'no-current-administration-overclaim',
      'conformance-covers-northern-territories-public-anchors',
    ];
  }
  if (countryCode === 'JP_SK') {
    return [
      ...base,
      'complete-senkaku-eight-island-anchor-required',
      'all-mofa-listed-islands-source-linked',
      'no-sovereignty-adjudication',
      'no-access-or-control-overclaim',
      'conformance-covers-senkaku-public-anchors',
    ];
  }
  if (countryCode === 'JP_TK') {
    return [
      ...base,
      'complete-takeshima-dokdo-main-islet-anchor-required',
      'both-main-islets-source-linked',
      'no-sovereignty-adjudication',
      'no-address-or-resident-overclaim',
      'conformance-covers-takeshima-dokdo-public-anchors',
    ];
  }
  if (countryCode === 'KASH') {
    return [
      ...base,
      'complete-kashmir-nonclaim-anchor-required',
      'unmogip-line-of-control-source-linked',
      'no-sovereignty-or-control-overclaim',
      'no-administrative-validity-overclaim',
      'conformance-covers-kashmir-public-anchors',
    ];
  }
  if (countryCode === 'PMR') {
    return [
      ...base,
      'complete-transnistria-nonclaim-anchor-required',
      'osce-moldova-terminology-source-linked',
      'no-statehood-or-recognition-overclaim',
      'no-current-control-overclaim',
      'conformance-covers-transnistria-public-anchors',
    ];
  }
  if (countryCode === 'SCSD') {
    return [
      ...base,
      'complete-south-china-sea-island-group-anchor-required',
      'spratly-paracel-pratas-macclesfield-scarborough-source-linked',
      'no-sovereignty-or-maritime-entitlement-overclaim',
      'no-current-control-or-facility-overclaim',
      'conformance-covers-south-china-sea-public-anchors',
    ];
  }
  if (countryCode === 'TRNC') {
    return [
      ...base,
      'complete-northern-cyprus-nonclaim-anchor-required',
      'eu-green-line-and-unficyp-source-linked',
      'no-statehood-or-recognition-overclaim',
      'no-crossing-access-or-service-overclaim',
      'conformance-covers-northern-cyprus-public-anchors',
    ];
  }
  if (countryCode === 'BAAR') {
    return [
      ...base,
      'complete-baarle-enclave-anchor-required',
      'baarle-enclave-counts-source-linked',
      'no-parcel-or-private-address-overclaim',
      'no-jurisdiction-or-postal-overclaim',
      'conformance-covers-baarle-public-anchors',
    ];
  }
  if (countryCode === 'PHIS') {
    return [
      ...base,
      'complete-pheasant-island-condominium-anchor-required',
      'handover-and-local-source-linked',
      'no-current-authority-date-overclaim',
      'no-access-crossing-or-delivery-overclaim',
      'conformance-covers-pheasant-island-public-anchors',
    ];
  }
  if (countryCode === 'BV') {
    return [
      ...base,
      'complete-bouvet-island-nature-reserve-anchor-required',
      'norwegian-polar-institute-source-linked',
      'no-inhabited-address-overclaim',
      'no-landing-rescue-or-delivery-overclaim',
      'conformance-covers-bouvet-public-anchors',
    ];
  }
  if (countryCode === 'CL-DI') {
    return [
      ...base,
      'complete-desventuradas-island-group-anchor-required',
      'subpesca-and-marine-regions-source-linked',
      'no-settlement-or-facility-overclaim',
      'no-access-navigation-or-delivery-overclaim',
      'conformance-covers-desventuradas-public-anchors',
    ];
  }
  if (countryCode === 'CL-SG') {
    return [
      ...base,
      'complete-salas-y-gomez-island-anchor-required',
      'monumentos-simbio-and-marine-regions-source-linked',
      'no-settlement-or-freshwater-overclaim',
      'no-access-permit-or-delivery-overclaim',
      'conformance-covers-salas-gomez-public-anchors',
    ];
  }
  if (countryCode === 'CP') {
    return [
      ...base,
      'complete-clipperton-atoll-anchor-required',
      'outre-mer-legifrance-and-marine-regions-source-linked',
      'no-habitation-or-postal-overclaim',
      'no-landing-mooring-rescue-or-delivery-overclaim',
      'conformance-covers-clipperton-public-anchors',
    ];
  }
  if (countryCode === 'XD') {
    return [
      ...base,
      'complete-dhekelia-sba-anchor-required',
      'sba-administration-and-geonames-source-linked',
      'no-military-operation-or-security-overclaim',
      'no-access-postal-or-delivery-overclaim',
      'conformance-covers-dhekelia-public-anchors',
    ];
  }
  if (countryCode === 'XU') {
    return [
      ...base,
      'complete-akrotiri-sba-anchor-required',
      'sba-administration-and-geonames-source-linked',
      'no-military-operation-or-security-overclaim',
      'no-access-postal-or-delivery-overclaim',
      'conformance-covers-akrotiri-public-anchors',
    ];
  }
  return base;
}

export function selectNextP0GazetteerGap(report: GeoOssGapStrategyReport, lastCountryCode?: string) {
  const p0Main = report.entries.filter(entry => (
    entry.priority === 'P0-critical' &&
    entry.regionKind === 'country-or-main-region'
  ));
  const start = lastCountryCode
    ? p0Main.findIndex(entry => entry.countryCode === lastCountryCode)
    : -1;
  return p0Main[(start + 1 + p0Main.length) % p0Main.length];
}

export function buildP0GazetteerRepositoryPlan(
  gap: GeoOssGapEntry,
  rotationRank: number,
  now = new Date(),
  owner = 'dawnportinfo-design',
): P0GazetteerRepositoryPlan {
  const countryCode = gap.countryCode.toUpperCase();
  const placeSeeds = countryCode === 'AX'
    ? ALAND_PLACE_SEEDS
    : countryCode === 'BN'
    ? BRUNEI_PLACE_SEEDS
    : countryCode === 'FM'
    ? MICRONESIA_PLACE_SEEDS
    : countryCode === 'LU'
    ? LUXEMBOURG_PLACE_SEEDS
    : countryCode === 'NC'
    ? NEW_CALEDONIA_PLACE_SEEDS
    : countryCode === 'NR'
    ? NAURU_PLACE_SEEDS
    : countryCode === 'PN'
    ? PITCAIRN_PLACE_SEEDS
    : countryCode === 'FO'
    ? FAROE_PLACE_SEEDS
    : countryCode === 'MH'
    ? MARSHALL_PLACE_SEEDS
    : countryCode === 'MY'
    ? MALAYSIA_PLACE_SEEDS
    : countryCode === 'NL'
    ? NETHERLANDS_PLACE_SEEDS
    : countryCode === 'PF'
    ? POLYNESIA_PLACE_SEEDS
    : countryCode === 'KI'
    ? KIRIBATI_PLACE_SEEDS
    : countryCode === 'KP'
    ? NORTH_KOREA_PLACE_SEEDS
    : countryCode === 'LA'
    ? LAOS_PLACE_SEEDS
    : countryCode === 'MM'
    ? MYANMAR_PLACE_SEEDS
    : countryCode === 'PG'
    ? PAPUA_NEW_GUINEA_PLACE_SEEDS
    : countryCode === 'PH'
    ? PHILIPPINES_PLACE_SEEDS
    : countryCode === 'TH'
    ? THAILAND_PLACE_SEEDS
    : countryCode === 'CN'
    ? CHINA_PLACE_SEEDS
    : countryCode === 'ID'
    ? INDONESIA_PLACE_SEEDS
    : countryCode === 'IE'
    ? IRELAND_PLACE_SEEDS
    : countryCode === 'KH'
    ? CAMBODIA_PLACE_SEEDS
    : countryCode === 'SJ' && gap.countryName === 'Svalbard and Jan Mayen'
    ? SVALBARD_JAN_MAYEN_PLACE_SEEDS
    : countryCode === 'SJ' && gap.countryName === 'Jan Mayen'
    ? JAN_MAYEN_PLACE_SEEDS
    : countryCode === 'SJ' && gap.countryName === 'Svalbard'
    ? SVALBARD_PLACE_SEEDS
    : countryCode === 'VN'
    ? VIETNAM_PLACE_SEEDS
    : countryCode === 'BT_T'
    ? BIR_TAWIL_PLACE_SEEDS
    : countryCode === 'CRIM'
    ? CRIMEA_PLACE_SEEDS
    : countryCode === 'CYGL'
    ? CYPRUS_GREEN_LINE_PLACE_SEEDS
    : countryCode === 'DONB'
    ? DONBAS_PLACE_SEEDS
    : countryCode === 'EEBD'
    ? ETHIOPIA_ERITREA_BORDER_PLACE_SEEDS
    : countryCode === 'JP_NT'
    ? NORTHERN_TERRITORIES_PLACE_SEEDS
    : countryCode === 'JP_SK'
    ? SENKAKU_PLACE_SEEDS
    : countryCode === 'JP_TK'
    ? TAKESHIMA_DOKDO_PLACE_SEEDS
    : countryCode === 'KASH'
    ? KASHMIR_PLACE_SEEDS
    : countryCode === 'PMR'
    ? TRANSNISTRIA_PLACE_SEEDS
    : countryCode === 'SCSD'
    ? SOUTH_CHINA_SEA_ISLANDS_PLACE_SEEDS
    : countryCode === 'TRNC'
    ? NORTHERN_CYPRUS_PLACE_SEEDS
    : countryCode === 'BAAR'
    ? BAARLE_ENCLAVES_PLACE_SEEDS
    : countryCode === 'PHIS'
    ? PHEASANT_ISLAND_PLACE_SEEDS
    : countryCode === 'BV'
    ? BOUVET_ISLAND_PLACE_SEEDS
    : countryCode === 'CL-DI'
    ? DESVENTURADAS_ISLANDS_PLACE_SEEDS
    : countryCode === 'CL-SG'
    ? SALAS_GOMEZ_ISLAND_PLACE_SEEDS
    : countryCode === 'CP'
    ? CLIPPERTON_ISLAND_PLACE_SEEDS
    : countryCode === 'XD'
    ? DHEKELIA_PLACE_SEEDS
    : countryCode === 'XU'
    ? AKROTIRI_PLACE_SEEDS
    : countryCode === 'WF'
    ? WALLIS_FUTUNA_PLACE_SEEDS
    : countryCode === 'BE'
    ? BELGIUM_PLACE_SEEDS
    : [
      {
        agidPlaceId: agidPlaceId(countryCode, gap.countryName),
        name: gap.countryName,
        localNames: { en: gap.countryName },
        featureClass: 'country' as const,
        adminPath: [gap.countryName],
        agidPath: [agidCountryId(countryCode)],
        approximateCentroid: { lat: 0, lon: 0, precision: 'country' as const },
        geodataLinks: {},
        validationState: 'seed-only' as const,
        notes: ['Placeholder country seed. Add source-linked places before publishing as a standalone repository.'],
      },
    ];

  return {
    version: P0_GAZETTEER_REPOSITORY_ROTATION_VERSION,
    generatedAt: now.toISOString(),
    repository: `agid-open-${countryCode.toLowerCase()}-gazetteer`,
    owner,
    countryCode,
    countryName: gap.countryName,
    continent: gap.continent,
    sourceGapPriority: gap.priority,
    regionKind: gap.regionKind,
    rotationRank,
    agidCountryId: agidCountryId(countryCode),
    packagePurpose: 'Record source-linked place names and AGID place identifiers for countries with critical open-geodata gaps.',
    sourceGapReasons: gap.reasons,
    missingCoreRoles: gap.missingCoreRoles,
    releaseGates: releaseGatesForCountry(countryCode, gap.countryName),
    sources: countryCode === 'AX'
      ? ALAND_SOURCES
      : countryCode === 'BN'
      ? BRUNEI_SOURCES
      : countryCode === 'FM'
      ? MICRONESIA_SOURCES
      : countryCode === 'LU'
      ? LUXEMBOURG_SOURCES
      : countryCode === 'NC'
      ? NEW_CALEDONIA_SOURCES
      : countryCode === 'NR'
      ? NAURU_SOURCES
      : countryCode === 'PN'
      ? PITCAIRN_SOURCES
      : countryCode === 'FO'
      ? FAROE_SOURCES
      : countryCode === 'MH'
      ? MARSHALL_SOURCES
      : countryCode === 'MY'
      ? MALAYSIA_SOURCES
      : countryCode === 'NL'
      ? NETHERLANDS_SOURCES
      : countryCode === 'PF'
      ? POLYNESIA_SOURCES
      : countryCode === 'KI'
      ? KIRIBATI_SOURCES
      : countryCode === 'KP'
      ? NORTH_KOREA_SOURCES
      : countryCode === 'LA'
      ? LAOS_SOURCES
      : countryCode === 'MM'
      ? MYANMAR_SOURCES
      : countryCode === 'PG'
      ? PAPUA_NEW_GUINEA_SOURCES
      : countryCode === 'PH'
      ? PHILIPPINES_SOURCES
      : countryCode === 'TH'
      ? THAILAND_SOURCES
      : countryCode === 'CN'
      ? CHINA_SOURCES
      : countryCode === 'ID'
      ? INDONESIA_SOURCES
      : countryCode === 'IE'
      ? IRELAND_SOURCES
      : countryCode === 'KH'
      ? CAMBODIA_SOURCES
      : countryCode === 'SJ' && gap.countryName === 'Svalbard and Jan Mayen'
      ? SVALBARD_JAN_MAYEN_SOURCES
      : countryCode === 'SJ' && gap.countryName === 'Jan Mayen'
      ? JAN_MAYEN_SOURCES
      : countryCode === 'SJ' && gap.countryName === 'Svalbard'
      ? SVALBARD_SOURCES
      : countryCode === 'VN'
      ? VIETNAM_SOURCES
      : countryCode === 'BT_T'
      ? BIR_TAWIL_SOURCES
      : countryCode === 'CRIM'
      ? CRIMEA_SOURCES
      : countryCode === 'CYGL'
      ? CYPRUS_GREEN_LINE_SOURCES
      : countryCode === 'DONB'
      ? DONBAS_SOURCES
      : countryCode === 'EEBD'
      ? ETHIOPIA_ERITREA_BORDER_SOURCES
      : countryCode === 'JP_NT'
      ? NORTHERN_TERRITORIES_SOURCES
      : countryCode === 'JP_SK'
      ? SENKAKU_SOURCES
      : countryCode === 'JP_TK'
      ? TAKESHIMA_DOKDO_SOURCES
      : countryCode === 'KASH'
      ? KASHMIR_SOURCES
      : countryCode === 'PMR'
      ? TRANSNISTRIA_SOURCES
      : countryCode === 'SCSD'
      ? SOUTH_CHINA_SEA_ISLANDS_SOURCES
      : countryCode === 'TRNC'
      ? NORTHERN_CYPRUS_SOURCES
      : countryCode === 'BAAR'
      ? BAARLE_ENCLAVES_SOURCES
      : countryCode === 'PHIS'
      ? PHEASANT_ISLAND_SOURCES
      : countryCode === 'BV'
      ? BOUVET_ISLAND_SOURCES
      : countryCode === 'CL-DI'
      ? DESVENTURADAS_ISLANDS_SOURCES
      : countryCode === 'CL-SG'
      ? SALAS_GOMEZ_ISLAND_SOURCES
      : countryCode === 'CP'
      ? CLIPPERTON_ISLAND_SOURCES
      : countryCode === 'XD'
      ? DHEKELIA_SOURCES
      : countryCode === 'XU'
      ? AKROTIRI_SOURCES
      : countryCode === 'WF'
      ? WALLIS_FUTUNA_SOURCES
      : DEFAULT_SOURCES,
    placeSeeds,
  };
}

export function validateP0GazetteerRepositoryPlan(plan: P0GazetteerRepositoryPlan) {
  const errors: string[] = [];
  if (!plan.repository.startsWith('agid-open-')) errors.push('repository must use agid-open-* prefix');
  if (!plan.agidCountryId.startsWith('agid:country:')) errors.push('agidCountryId must use agid:country namespace');
  if (!plan.placeSeeds.length) errors.push('at least one place seed is required');

  const ids = new Set<string>();
  for (const place of plan.placeSeeds) {
    if (ids.has(place.agidPlaceId)) errors.push(`duplicate agidPlaceId: ${place.agidPlaceId}`);
    ids.add(place.agidPlaceId);
    if (!place.agidPlaceId.startsWith(`agid:place:${plan.countryCode}:`)) {
      errors.push(`place ${place.name} has invalid AGID place namespace`);
    }
    if (place.adminPath.length < 1) errors.push(`place ${place.name} needs adminPath`);
    if (place.agidPath[0] !== plan.agidCountryId) errors.push(`place ${place.name} must link to country AGID first`);
    if (Number.isNaN(place.approximateCentroid.lat) || Number.isNaN(place.approximateCentroid.lon)) {
      errors.push(`place ${place.name} has invalid centroid`);
    }
  }
  if (plan.countryCode === 'AX') {
    const municipalitySeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'municipality' || place.featureClass === 'capital'
    ));
    if (municipalitySeeds.length !== 16) {
      errors.push(`AX complete pack must contain exactly 16 municipality/capital seeds, found ${municipalitySeeds.length}`);
    }
    for (const municipality of municipalitySeeds) {
      if (municipality.validationState !== 'source-linked') {
        errors.push(`AX municipality ${municipality.name} must be source-linked`);
      }
      if (!municipality.notes.some(note => note.includes('GeoNames administrative code:'))) {
        errors.push(`AX municipality ${municipality.name} must record its GeoNames administrative code`);
      }
      if (!municipality.geodataLinks.official || !municipality.geodataLinks.geonames) {
        errors.push(`AX municipality ${municipality.name} must keep official and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'NR') {
    const districtSeeds = plan.placeSeeds.filter(place => place.featureClass === 'district');
    if (districtSeeds.length !== 14) {
      errors.push(`NR complete pack must contain exactly 14 district seeds, found ${districtSeeds.length}`);
    }
    for (const district of districtSeeds) {
      if (district.validationState !== 'source-linked') {
        errors.push(`NR district ${district.name} must be source-linked`);
      }
      if (!district.notes.some(note => note.includes('GeoNames administrative code:'))) {
        errors.push(`NR district ${district.name} must record its GeoNames administrative code`);
      }
      if (!district.geodataLinks.official || !district.geodataLinks.geonames) {
        errors.push(`NR district ${district.name} must keep official and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'BN') {
    const districtSeeds = plan.placeSeeds.filter(place => place.featureClass === 'district');
    if (districtSeeds.length !== 4) {
      errors.push(`BN complete pack must contain exactly 4 district seeds, found ${districtSeeds.length}`);
    }
    for (const district of districtSeeds) {
      if (district.validationState !== 'source-linked') {
        errors.push(`BN district ${district.name} must be source-linked`);
      }
      if (!district.notes.some(note => note.includes('GeoNames administrative code:'))) {
        errors.push(`BN district ${district.name} must record its GeoNames administrative code`);
      }
      if (!district.notes.some(note => note.includes('ISO 3166-2 subdivision code:'))) {
        errors.push(`BN district ${district.name} must record its ISO 3166-2 subdivision code`);
      }
      if (!district.geodataLinks.official || !district.geodataLinks.geonames) {
        errors.push(`BN district ${district.name} must keep official and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'FM') {
    const stateSeeds = plan.placeSeeds.filter(place => place.featureClass === 'state');
    if (stateSeeds.length !== 4) {
      errors.push(`FM complete pack must contain exactly 4 state seeds, found ${stateSeeds.length}`);
    }
    for (const state of stateSeeds) {
      if (state.validationState !== 'source-linked') {
        errors.push(`FM state ${state.name} must be source-linked`);
      }
      if (!state.notes.some(note => note.includes('GeoNames administrative code:'))) {
        errors.push(`FM state ${state.name} must record its GeoNames administrative code`);
      }
      if (!state.notes.some(note => note.includes('ISO 3166-2 subdivision code:'))) {
        errors.push(`FM state ${state.name} must record its ISO 3166-2 subdivision code`);
      }
      if (!state.geodataLinks.official || !state.geodataLinks.geonames) {
        errors.push(`FM state ${state.name} must keep official and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'LU') {
    const cantonSeeds = plan.placeSeeds.filter(place => place.featureClass === 'canton');
    if (cantonSeeds.length !== 12) {
      errors.push(`LU complete pack must contain exactly 12 canton seeds, found ${cantonSeeds.length}`);
    }
    for (const canton of cantonSeeds) {
      if (canton.validationState !== 'source-linked') {
        errors.push(`LU canton ${canton.name} must be source-linked`);
      }
      if (!canton.notes.some(note => note.includes('GeoNames administrative code:'))) {
        errors.push(`LU canton ${canton.name} must record its GeoNames administrative code`);
      }
      if (!canton.notes.some(note => note.includes('ISO 3166-2 subdivision code:'))) {
        errors.push(`LU canton ${canton.name} must record its ISO 3166-2 subdivision code`);
      }
      if (!canton.geodataLinks.official || !canton.geodataLinks.geonames) {
        errors.push(`LU canton ${canton.name} must keep official and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'NC') {
    const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
    if (provinceSeeds.length !== 3) {
      errors.push(`NC complete pack must contain exactly 3 province seeds, found ${provinceSeeds.length}`);
    }
    for (const province of provinceSeeds) {
      if (province.validationState !== 'source-linked') {
        errors.push(`NC province ${province.name} must be source-linked`);
      }
      if (!province.notes.some(note => note.includes('GeoNames administrative code:'))) {
        errors.push(`NC province ${province.name} must record its GeoNames administrative code`);
      }
      if (!province.notes.some(note => note.includes('GeoNames subentity code:'))) {
        errors.push(`NC province ${province.name} must record its GeoNames subentity code`);
      }
      if (province.notes.some(note => note.includes('ISO 3166-2 subdivision code:'))) {
        errors.push(`NC province ${province.name} must not claim an ISO 3166-2 subdivision code`);
      }
      if (!province.geodataLinks.official || !province.geodataLinks.geonames) {
        errors.push(`NC province ${province.name} must keep official and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'WF') {
    const chiefdomSeeds = plan.placeSeeds.filter(place => place.featureClass === 'chiefdom');
    if (chiefdomSeeds.length !== 3) {
      errors.push(`WF complete pack must contain exactly 3 chiefdom seeds, found ${chiefdomSeeds.length}`);
    }
    for (const chiefdom of chiefdomSeeds) {
      if (chiefdom.validationState !== 'source-linked') {
        errors.push(`WF chiefdom ${chiefdom.name} must be source-linked`);
      }
      if (!chiefdom.notes.some(note => note.includes('GeoNames administrative code:'))) {
        errors.push(`WF chiefdom ${chiefdom.name} must record its GeoNames administrative code`);
      }
      if (!chiefdom.notes.some(note => note.includes('GeoNames subentity code:'))) {
        errors.push(`WF chiefdom ${chiefdom.name} must record its GeoNames subentity code`);
      }
      if (!chiefdom.geodataLinks.official || !chiefdom.geodataLinks.geonames) {
        errors.push(`WF chiefdom ${chiefdom.name} must keep official and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'PN') {
    const islandSeeds = plan.placeSeeds.filter(place => place.featureClass === 'island');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (islandSeeds.length !== 4) {
      errors.push(`PN complete pack must contain exactly 4 island seeds, found ${islandSeeds.length}`);
    }
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Adamstown') {
      errors.push('PN complete pack must contain exactly one Adamstown capital seed');
    }
    for (const island of islandSeeds) {
      if (island.validationState !== 'source-linked') {
        errors.push(`PN island ${island.name} must be source-linked`);
      }
      if (!island.notes.some(note => note.includes('Complete PN island seed'))) {
        errors.push(`PN island ${island.name} must be marked as a complete island seed`);
      }
      if (!island.notes.some(note => note.includes('No administrative division code claimed'))) {
        errors.push(`PN island ${island.name} must explicitly avoid administrative-code overclaiming`);
      }
      if (!island.geodataLinks.official || !island.geodataLinks.geonames) {
        errors.push(`PN island ${island.name} must keep official and GeoNames source links`);
      }
    }
    for (const capital of capitalSeeds) {
      if (capital.validationState !== 'source-linked') {
        errors.push(`PN capital ${capital.name} must be source-linked`);
      }
      if (!capital.notes.some(note => note.includes('GeoNames country metadata lists Adamstown as capital'))) {
        errors.push('PN capital Adamstown must cite GeoNames country capital metadata');
      }
      if (!capital.geodataLinks.official || !capital.geodataLinks.geonames) {
        errors.push('PN capital Adamstown must keep official and GeoNames source links');
      }
    }
  }
  if (plan.countryCode === 'FO') {
    const islandSeeds = plan.placeSeeds.filter(place => place.featureClass === 'island');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (islandSeeds.length !== 18) {
      errors.push(`FO complete pack must contain exactly 18 main island seeds, found ${islandSeeds.length}`);
    }
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Tórshavn') {
      errors.push('FO complete pack must contain exactly one Tórshavn capital seed');
    }
    for (const island of islandSeeds) {
      if (island.validationState !== 'source-linked') {
        errors.push(`FO island ${island.name} must be source-linked`);
      }
      if (!island.notes.some(note => note.includes('Complete FO main-island seed'))) {
        errors.push(`FO island ${island.name} must be marked as a complete main-island seed`);
      }
      if (!island.geodataLinks.official || !island.geodataLinks.geonames) {
        errors.push(`FO island ${island.name} must keep official and GeoNames source links`);
      }
    }
    for (const capital of capitalSeeds) {
      if (capital.validationState !== 'source-linked') {
        errors.push(`FO capital ${capital.name} must be source-linked`);
      }
      if (!capital.notes.some(note => note.includes('GeoNames country metadata lists Tórshavn as capital'))) {
        errors.push('FO capital Tórshavn must cite GeoNames country capital metadata');
      }
      if (!capital.geodataLinks.official || !capital.geodataLinks.geonames) {
        errors.push('FO capital Tórshavn must keep official and GeoNames source links');
      }
    }
  }
  if (plan.countryCode === 'MH') {
    const municipalitySeeds = plan.placeSeeds.filter(place => place.featureClass === 'municipality');
    const islandSeeds = plan.placeSeeds.filter(place => place.featureClass === 'island');
    if (municipalitySeeds.length !== 24) {
      errors.push(`MH complete pack must contain exactly 24 constitutional district/municipality seeds, found ${municipalitySeeds.length}`);
    }
    if (islandSeeds.length !== 34) {
      errors.push(`MH atoll/island anchor layer must contain exactly 34 anchor seeds, found ${islandSeeds.length}`);
    }
    if (!municipalitySeeds.some(place => place.name === 'Majuro')) {
      errors.push('MH complete pack must include the Majuro capital district seed');
    }
    if (!municipalitySeeds.some(place => place.name === 'Bikini and Kili')) {
      errors.push('MH complete pack must keep Bikini and Kili as one combined constitutional district seed');
    }
    if (!municipalitySeeds.some(place => place.name === 'Enewetak and Ujelang')) {
      errors.push('MH complete pack must keep Enewetak and Ujelang as one combined constitutional district seed');
    }
    for (const municipality of municipalitySeeds) {
      if (municipality.validationState !== 'source-linked') {
        errors.push(`MH municipality ${municipality.name} must be source-linked`);
      }
      if (!municipality.notes.some(note => note.includes('Complete MH municipality seed'))) {
        errors.push(`MH municipality ${municipality.name} must be marked as a complete municipality seed`);
      }
      if (!municipality.notes.some(note => note.includes('Constitutional electoral district:'))) {
        errors.push(`MH municipality ${municipality.name} must cite its constitutional electoral district`);
      }
      if (!municipality.notes.some(note => note.includes('chain:'))) {
        errors.push(`MH municipality ${municipality.name} must record the Ralik/Ratak chain`);
      }
      if (!municipality.geodataLinks.official || !municipality.geodataLinks.geonames) {
        errors.push(`MH municipality ${municipality.name} must keep official and GeoNames source links`);
      }
    }
    for (const island of islandSeeds) {
      if (island.validationState !== 'source-linked') {
        errors.push(`MH atoll/island anchor ${island.name} must be source-linked`);
      }
      if (!island.notes.some(note => note.includes('MH atoll/island anchor seed'))) {
        errors.push(`MH atoll/island anchor ${island.name} must be marked as an anchor seed`);
      }
      if (!island.notes.some(note => note.includes('not complete all-islet coverage') || note.includes('does not split governance'))) {
        errors.push(`MH atoll/island anchor ${island.name} must keep the non-overclaim guard`);
      }
      if (!island.notes.some(note => note.includes('No legal boundary'))) {
        errors.push(`MH atoll/island anchor ${island.name} must reject boundary/delivery overclaims`);
      }
      if (!island.geodataLinks.official || !island.geodataLinks.geonames) {
        errors.push(`MH atoll/island anchor ${island.name} must keep official and GeoNames source links`);
      }
    }
    for (const required of [
      'Ailinginae Atoll',
      'Bikar Atoll',
      'Bikini Atoll',
      'Bokak Atoll',
      'Enewetak Atoll',
      'Erikub Atoll',
      'Jemo Island',
      'Kili Island',
      'Nadikdik Atoll',
      'Rongerik Atoll',
      'Taka Atoll',
      'Ujelang Atoll',
    ]) {
      if (!islandSeeds.some(place => place.name === required)) {
        errors.push(`MH combined district component anchor is missing: ${required}`);
      }
    }
  }
  if (plan.countryCode === 'MY') {
    const firstOrderSeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'state' || place.featureClass === 'special-region'
    ));
    const stateSeeds = plan.placeSeeds.filter(place => place.featureClass === 'state');
    const federalTerritorySeeds = plan.placeSeeds.filter(place => place.featureClass === 'special-region');
    if (firstOrderSeeds.length !== 16) {
      errors.push(`MY complete pack must contain exactly 16 first-order seeds, found ${firstOrderSeeds.length}`);
    }
    if (stateSeeds.length !== 13) {
      errors.push(`MY complete pack must contain exactly 13 state seeds, found ${stateSeeds.length}`);
    }
    if (federalTerritorySeeds.length !== 3) {
      errors.push(`MY complete pack must contain exactly 3 federal territory seeds, found ${federalTerritorySeeds.length}`);
    }
    if (!federalTerritorySeeds.some(place => place.name === 'Kuala Lumpur')) {
      errors.push('MY complete pack must include Kuala Lumpur as the capital federal territory seed');
    }
    for (const place of firstOrderSeeds) {
      if (place.validationState !== 'source-linked') {
        errors.push(`MY first-order division ${place.name} must be source-linked`);
      }
      if (!place.notes.some(note => note.includes('Complete MY first-order seed'))) {
        errors.push(`MY first-order division ${place.name} must be marked as a complete first-order seed`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`MY first-order division ${place.name} must record whether it is a state or federal territory`);
      }
      if (!place.notes.some(note => note.includes('ISO 3166-2 subdivision code:'))) {
        errors.push(`MY first-order division ${place.name} must record its ISO 3166-2 subdivision code`);
      }
      if (!place.notes.some(note => note.includes('GeoNames administrative code:'))) {
        errors.push(`MY first-order division ${place.name} must record its GeoNames administrative code`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`MY first-order division ${place.name} must keep official and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'NL') {
    const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
    const specialRegionSeeds = plan.placeSeeds.filter(place => place.featureClass === 'special-region');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (provinceSeeds.length !== 12) {
      errors.push(`NL complete pack must contain exactly 12 province seeds, found ${provinceSeeds.length}`);
    }
    if (specialRegionSeeds.length !== 3) {
      errors.push(`NL complete pack must contain exactly 3 Caribbean public body seeds, found ${specialRegionSeeds.length}`);
    }
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Amsterdam') {
      errors.push('NL complete pack must contain exactly one Amsterdam capital seed');
    }
    for (const province of provinceSeeds) {
      if (province.validationState !== 'source-linked') {
        errors.push(`NL province ${province.name} must be source-linked`);
      }
      if (!province.notes.some(note => note.includes('Complete NL province seed'))) {
        errors.push(`NL province ${province.name} must be marked as a complete province seed`);
      }
      if (!province.notes.some(note => note.includes('ISO 3166-2 subdivision code: NL-'))) {
        errors.push(`NL province ${province.name} must record its NL ISO 3166-2 subdivision code`);
      }
      if (!province.notes.some(note => note.includes('GeoNames administrative code:'))) {
        errors.push(`NL province ${province.name} must record its GeoNames administrative code`);
      }
      if (!province.geodataLinks.official || !province.geodataLinks.geonames) {
        errors.push(`NL province ${province.name} must keep official and GeoNames source links`);
      }
    }
    for (const specialRegion of specialRegionSeeds) {
      if (specialRegion.validationState !== 'source-linked') {
        errors.push(`NL Caribbean public body ${specialRegion.name} must be source-linked`);
      }
      if (!specialRegion.notes.some(note => note.includes('Complete NL Caribbean public body seed'))) {
        errors.push(`NL Caribbean public body ${specialRegion.name} must be marked as complete`);
      }
      if (!specialRegion.notes.some(note => note.includes('not part of a Dutch province'))) {
        errors.push(`NL Caribbean public body ${specialRegion.name} must explicitly avoid province overclaiming`);
      }
      if (specialRegion.notes.some(note => note.includes('ISO 3166-2 subdivision code: NL-'))) {
        errors.push(`NL Caribbean public body ${specialRegion.name} must not claim an NL province ISO code`);
      }
      if (!specialRegion.geodataLinks.official || !specialRegion.geodataLinks.geonames) {
        errors.push(`NL Caribbean public body ${specialRegion.name} must keep official and GeoNames source links`);
      }
    }
    for (const capital of capitalSeeds) {
      if (capital.validationState !== 'source-linked') {
        errors.push(`NL capital ${capital.name} must be source-linked`);
      }
      if (!capital.notes.some(note => note.includes('GeoNames country metadata lists Amsterdam as capital'))) {
        errors.push('NL capital Amsterdam must cite GeoNames country capital metadata');
      }
      if (!capital.geodataLinks.official || !capital.geodataLinks.geonames) {
        errors.push('NL capital Amsterdam must keep official and GeoNames source links');
      }
    }
  }
  if (plan.countryCode === 'PF') {
    const subdivisionSeeds = plan.placeSeeds.filter(place => place.featureClass === 'region');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (subdivisionSeeds.length !== 5) {
      errors.push(`PF complete pack must contain exactly 5 administrative subdivision seeds, found ${subdivisionSeeds.length}`);
    }
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Papeete') {
      errors.push('PF complete pack must contain exactly one Papeete capital seed');
    }
    for (const subdivision of subdivisionSeeds) {
      if (subdivision.validationState !== 'source-linked') {
        errors.push(`PF administrative subdivision ${subdivision.name} must be source-linked`);
      }
      if (!subdivision.notes.some(note => note.includes('Complete PF administrative subdivision seed'))) {
        errors.push(`PF administrative subdivision ${subdivision.name} must be marked as complete`);
      }
      if (!subdivision.notes.some(note => note.includes('GeoNames administrative code:'))) {
        errors.push(`PF administrative subdivision ${subdivision.name} must record its GeoNames administrative code`);
      }
      if (!subdivision.notes.some(note => note.includes('Commune coverage count in prefecture source:'))) {
        errors.push(`PF administrative subdivision ${subdivision.name} must record its commune coverage count`);
      }
      if (!subdivision.geodataLinks.official || !subdivision.geodataLinks.geonames) {
        errors.push(`PF administrative subdivision ${subdivision.name} must keep official and GeoNames source links`);
      }
    }
    for (const capital of capitalSeeds) {
      if (capital.validationState !== 'source-linked') {
        errors.push(`PF capital ${capital.name} must be source-linked`);
      }
      if (!capital.notes.some(note => note.includes('GeoNames country metadata lists Papeete as capital'))) {
        errors.push('PF capital Papeete must cite GeoNames country capital metadata');
      }
      if (!capital.geodataLinks.official || !capital.geodataLinks.geonames) {
        errors.push('PF capital Papeete must keep official and GeoNames source links');
      }
    }
  }
  if (plan.countryCode === 'KI') {
    const districtSeeds = plan.placeSeeds.filter(place => place.featureClass === 'district');
    const islandSeeds = plan.placeSeeds.filter(place => place.featureClass === 'island');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (districtSeeds.length !== 5) {
      errors.push(`KI complete pack must contain exactly 5 National Statistics Office district seeds, found ${districtSeeds.length}`);
    }
    if (islandSeeds.length !== 33) {
      errors.push(`KI complete pack must contain exactly 33 island seeds, found ${islandSeeds.length}`);
    }
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Tarawa') {
      errors.push('KI complete pack must contain exactly one Tarawa capital seed');
    }
    for (const district of districtSeeds) {
      if (district.validationState !== 'source-linked') {
        errors.push(`KI NSO district ${district.name} must be source-linked`);
      }
      if (!district.notes.some(note => note.includes('Complete KI NSO district seed'))) {
        errors.push(`KI NSO district ${district.name} must be marked as complete`);
      }
      if (!district.notes.some(note => note.includes('National Statistics Office district list:'))) {
        errors.push(`KI NSO district ${district.name} must record its NSO district list`);
      }
      if (!district.notes.some(note => note.includes('GeoNames cross-reference:'))) {
        errors.push(`KI NSO district ${district.name} must record its GeoNames cross-reference`);
      }
      if (!district.geodataLinks.official || !district.geodataLinks.geonames) {
        errors.push(`KI NSO district ${district.name} must keep official and GeoNames source links`);
      }
    }
    for (const island of islandSeeds) {
      if (island.validationState !== 'source-linked') {
        errors.push(`KI island ${island.name} must be source-linked`);
      }
      if (!island.notes.some(note => note.includes('Complete KI all-island seed'))) {
        errors.push(`KI island ${island.name} must be marked as a complete all-island seed`);
      }
      if (!island.notes.some(note => note.includes('33 Kiribati coral islands') || note.includes('Tarawa as the island/atoll anchor'))) {
        errors.push(`KI island ${island.name} must cite the 33-island coverage basis`);
      }
      if (!island.notes.some(note => note.includes('no legal boundary') || note.includes('no ward'))) {
        errors.push(`KI island ${island.name} must avoid legal boundary or delivery overclaims`);
      }
      if (!island.geodataLinks.official || !island.geodataLinks.geonames) {
        errors.push(`KI island ${island.name} must keep official and GeoNames source links`);
      }
    }
    for (const capital of capitalSeeds) {
      if (capital.validationState !== 'source-linked') {
        errors.push(`KI capital ${capital.name} must be source-linked`);
      }
      if (!capital.notes.some(note => note.includes('GeoNames country metadata lists Tarawa as capital'))) {
        errors.push('KI capital Tarawa must cite GeoNames country capital metadata');
      }
      if (!capital.geodataLinks.official || !capital.geodataLinks.geonames) {
        errors.push('KI capital Tarawa must keep official and GeoNames source links');
      }
    }
  }
  if (plan.countryCode === 'KP') {
    const firstOrderSeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'special-region' || place.featureClass === 'capital'
    ));
    const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
    const specialCitySeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'special-region' || place.featureClass === 'capital'
    ));
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (firstOrderSeeds.length !== 13) {
      errors.push(`KP complete pack must contain exactly 13 first-order division seeds, found ${firstOrderSeeds.length}`);
    }
    if (provinceSeeds.length !== 9) {
      errors.push(`KP complete pack must contain exactly 9 province seeds, found ${provinceSeeds.length}`);
    }
    if (specialCitySeeds.length !== 4) {
      errors.push(`KP complete pack must contain exactly 4 special administration city seeds, found ${specialCitySeeds.length}`);
    }
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Pyongyang') {
      errors.push('KP complete pack must contain exactly one Pyongyang capital first-order seed');
    }
    for (const place of firstOrderSeeds) {
      if (place.validationState !== 'source-linked') {
        errors.push(`KP first-order division ${place.name} must be source-linked`);
      }
      if (!place.notes.some(note => note.includes('Complete KP first-order seed'))) {
        errors.push(`KP first-order division ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`KP first-order division ${place.name} must record its first-order type`);
      }
      if (!place.notes.some(note => note.includes('OpenFactBook administrative division list:'))) {
        errors.push(`KP first-order division ${place.name} must cite the OpenFactBook first-order list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`KP first-order division ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`KP first-order division ${place.name} must keep reference and GeoNames source links`);
      }
    }
    if (!firstOrderSeeds.some(place => place.notes.some(note => note.includes('PCGN notes Kaesŏng first-order status was reinstated in 2019')))) {
      errors.push('KP complete pack must keep the PCGN Kaesong status note');
    }
  }
  if (plan.countryCode === 'LA') {
    const firstOrderSeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'capital'
    ));
    const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (firstOrderSeeds.length !== 18) {
      errors.push(`LA complete pack must contain exactly 18 first-order division seeds, found ${firstOrderSeeds.length}`);
    }
    if (provinceSeeds.length !== 17) {
      errors.push(`LA complete pack must contain exactly 17 province seeds, found ${provinceSeeds.length}`);
    }
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Vientiane Capital') {
      errors.push('LA complete pack must contain exactly one Vientiane Capital first-order seed');
    }
    if (!provinceSeeds.some(place => place.name === 'Vientiane Province')) {
      errors.push('LA complete pack must include Vientiane Province separately from Vientiane Capital');
    }
    if (plan.placeSeeds.some(place => place.name === 'Vientiane')) {
      errors.push('LA complete pack must avoid ambiguous bare Vientiane seed names');
    }
    for (const place of firstOrderSeeds) {
      if (place.validationState !== 'source-linked') {
        errors.push(`LA first-order division ${place.name} must be source-linked`);
      }
      if (!place.notes.some(note => note.includes('Complete LA first-order seed'))) {
        errors.push(`LA first-order division ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`LA first-order division ${place.name} must record its first-order type`);
      }
      if (!place.notes.some(note => note.includes('OpenFactBook administrative division list:'))) {
        errors.push(`LA first-order division ${place.name} must cite the OpenFactBook first-order list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`LA first-order division ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`LA first-order division ${place.name} must keep reference and GeoNames source links`);
      }
    }
    if (!firstOrderSeeds.some(place => (
      place.name === 'Vientiane Province' &&
      place.notes.some(note => note.includes('avoid collision with Vientiane Capital'))
    ))) {
      errors.push('LA complete pack must keep a Vientiane province/capital disambiguation note');
    }
  }
  if (plan.countryCode === 'MM') {
    const firstOrderSeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'state' || place.featureClass === 'capital'
    ));
    const regionSeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'province' && place.notes.some(note => note.includes('first-order type: region'))
    ));
    const stateSeeds = plan.placeSeeds.filter(place => place.featureClass === 'state');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (firstOrderSeeds.length !== 15) {
      errors.push(`MM complete pack must contain exactly 15 first-order division seeds, found ${firstOrderSeeds.length}`);
    }
    if (regionSeeds.length !== 7) errors.push(`MM complete pack must contain exactly 7 region seeds, found ${regionSeeds.length}`);
    if (stateSeeds.length !== 7) errors.push(`MM complete pack must contain exactly 7 state seeds, found ${stateSeeds.length}`);
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Nay Pyi Taw') {
      errors.push('MM complete pack must contain exactly one Nay Pyi Taw capital / union territory seed');
    }
    for (const place of firstOrderSeeds) {
      if (place.validationState !== 'source-linked') errors.push(`MM first-order division ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete MM first-order seed'))) {
        errors.push(`MM first-order division ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`MM first-order division ${place.name} must record its first-order type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`MM first-order division ${place.name} must cite the administrative division list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`MM first-order division ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`MM first-order division ${place.name} must keep reference and GeoNames source links`);
      }
    }
    if (!capitalSeeds[0]?.notes.some(note => note.includes('GeoNames country metadata lists Nay Pyi Taw as capital'))) {
      errors.push('MM complete pack must cite Nay Pyi Taw capital metadata');
    }
  }
  if (plan.countryCode === 'PG') {
    const firstOrderSeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'special-region' || place.featureClass === 'capital'
    ));
    const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
    const autonomousSeeds = plan.placeSeeds.filter(place => place.featureClass === 'special-region');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (firstOrderSeeds.length !== 22) {
      errors.push(`PG complete pack must contain exactly 22 first-order seeds, found ${firstOrderSeeds.length}`);
    }
    if (provinceSeeds.length !== 20) errors.push(`PG complete pack must contain exactly 20 province seeds, found ${provinceSeeds.length}`);
    if (autonomousSeeds.length !== 1 || autonomousSeeds[0]?.name !== 'Bougainville') {
      errors.push('PG complete pack must contain exactly one Bougainville autonomous region seed');
    }
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'National Capital') {
      errors.push('PG complete pack must contain exactly one National Capital district seed');
    }
    for (const place of firstOrderSeeds) {
      if (place.validationState !== 'source-linked') errors.push(`PG first-order division ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete PG first-order seed'))) {
        errors.push(`PG first-order division ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`PG first-order division ${place.name} must record its first-order type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`PG first-order division ${place.name} must cite the administrative division list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`PG first-order division ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`PG first-order division ${place.name} must keep reference and GeoNames source links`);
      }
    }
    if (!autonomousSeeds[0]?.notes.some(note => note.includes('Autonomous Bougainville Government'))) {
      errors.push('PG complete pack must keep the Autonomous Bougainville Government cross-reference note');
    }
  }
  if (plan.countryCode === 'PH') {
    const regionSeeds = plan.placeSeeds.filter(place => place.featureClass === 'region');
    if (regionSeeds.length !== 18) {
      errors.push(`PH complete pack must contain exactly 18 current region seeds, found ${regionSeeds.length}`);
    }
    if (!regionSeeds.some(place => place.name === 'Negros Island Region')) {
      errors.push('PH complete pack must include the current Negros Island Region seed');
    }
    if (!regionSeeds.some(place => place.name === 'Bangsamoro Autonomous Region in Muslim Mindanao')) {
      errors.push('PH complete pack must include the current BARMM seed');
    }
    if (regionSeeds.some(place => place.name === 'Autonomous Region in Muslim Mindanao')) {
      errors.push('PH complete pack must not publish stale ARMM as a current region seed');
    }
    for (const place of regionSeeds) {
      if (place.validationState !== 'source-linked') errors.push(`PH region ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete PH first-order seed'))) {
        errors.push(`PH region ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`PH region ${place.name} must record its first-order type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`PH region ${place.name} must cite the current region list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`PH region ${place.name} must record its GeoNames cross-reference or legacy caution`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`PH region ${place.name} must keep reference and GeoNames source links`);
      }
    }
    const nir = regionSeeds.find(place => place.name === 'Negros Island Region');
    if (!nir?.notes.some(note => note.includes('Republic Act No. 12000'))) {
      errors.push('PH Negros Island Region seed must cite Republic Act No. 12000 / PSA NIR evidence');
    }
  }
  if (plan.countryCode === 'TH') {
    const firstOrderSeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'capital'
    ));
    const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (firstOrderSeeds.length !== 77) {
      errors.push(`TH complete pack must contain exactly 77 first-order seeds, found ${firstOrderSeeds.length}`);
    }
    if (provinceSeeds.length !== 76) errors.push(`TH complete pack must contain exactly 76 province seeds, found ${provinceSeeds.length}`);
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Bangkok') {
      errors.push('TH complete pack must contain exactly one Bangkok special administrative/capital seed');
    }
    for (const place of firstOrderSeeds) {
      if (place.validationState !== 'source-linked') errors.push(`TH first-order division ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete TH first-order seed'))) {
        errors.push(`TH first-order division ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`TH first-order division ${place.name} must record its first-order type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`TH first-order division ${place.name} must cite the first-order list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`TH first-order division ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`TH first-order division ${place.name} must keep reference and GeoNames source links`);
      }
    }
    if (!capitalSeeds[0]?.notes.some(note => note.includes('GeoNames country metadata lists Bangkok as capital'))) {
      errors.push('TH Bangkok seed must cite GeoNames country capital metadata');
    }
  }
  if (plan.countryCode === 'CN') {
    const provinceLevelSeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'province' ||
      place.featureClass === 'region' ||
      place.featureClass === 'municipality' ||
      place.featureClass === 'special-region'
    ));
    const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
    const autonomousRegionSeeds = plan.placeSeeds.filter(place => place.featureClass === 'region');
    const municipalitySeeds = plan.placeSeeds.filter(place => place.featureClass === 'municipality');
    const sarSeeds = plan.placeSeeds.filter(place => place.featureClass === 'special-region');
    if (provinceLevelSeeds.length !== 34) {
      errors.push(`CN complete pack must contain exactly 34 province-level compatibility seeds, found ${provinceLevelSeeds.length}`);
    }
    if (provinceSeeds.length !== 23) errors.push(`CN complete pack must contain exactly 23 province seeds, found ${provinceSeeds.length}`);
    if (autonomousRegionSeeds.length !== 5) errors.push(`CN complete pack must contain exactly 5 autonomous region seeds, found ${autonomousRegionSeeds.length}`);
    if (municipalitySeeds.length !== 4) errors.push(`CN complete pack must contain exactly 4 municipality seeds, found ${municipalitySeeds.length}`);
    if (sarSeeds.length !== 2) errors.push(`CN complete pack must contain exactly 2 SAR compatibility seeds, found ${sarSeeds.length}`);
    for (const place of provinceLevelSeeds) {
      if (place.validationState !== 'source-linked') errors.push(`CN province-level seed ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete CN first-order seed'))) {
        errors.push(`CN province-level seed ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`CN province-level seed ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`CN province-level seed ${place.name} must cite the administrative division list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`CN province-level seed ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`CN province-level seed ${place.name} must keep reference and GeoNames source links`);
      }
    }
    for (const sensitiveName of ['Taiwan', 'Hong Kong', 'Macao']) {
      const place = provinceLevelSeeds.find(seed => seed.name === sensitiveName);
      if (!place?.notes.some(note => note.includes('does not assert sovereignty') || note.includes('compatibility reference only'))) {
        errors.push(`CN ${sensitiveName} seed must keep a neutral compatibility / non-sovereignty note`);
      }
    }
  }
  if (plan.countryCode === 'ID') {
    const firstOrderSeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'special-region' || place.featureClass === 'capital'
    ));
    const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
    const specialRegionSeeds = plan.placeSeeds.filter(place => place.featureClass === 'special-region');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (firstOrderSeeds.length !== 38) {
      errors.push(`ID complete pack must contain exactly 38 first-order seeds, found ${firstOrderSeeds.length}`);
    }
    if (provinceSeeds.length !== 35) errors.push(`ID complete pack must contain exactly 35 province seeds, found ${provinceSeeds.length}`);
    if (specialRegionSeeds.length !== 2) errors.push(`ID complete pack must contain exactly 2 special-region seeds, found ${specialRegionSeeds.length}`);
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Jakarta') {
      errors.push('ID complete pack must contain exactly one Jakarta capital district seed');
    }
    for (const place of firstOrderSeeds) {
      if (place.validationState !== 'source-linked') errors.push(`ID first-order seed ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete ID first-order seed'))) {
        errors.push(`ID first-order seed ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`ID first-order seed ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`ID first-order seed ${place.name} must cite the first-order list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`ID first-order seed ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`ID first-order seed ${place.name} must keep reference and GeoNames source links`);
      }
    }
    if (!capitalSeeds[0]?.notes.some(note => note.includes('GeoNames country metadata lists Jakarta as capital'))) {
      errors.push('ID Jakarta seed must cite GeoNames country capital metadata');
    }
  }
  if (plan.countryCode === 'IE') {
    const localAuthoritySeeds = plan.placeSeeds.filter(place => place.featureClass === 'municipality');
    if (localAuthoritySeeds.length !== 31) {
      errors.push(`IE complete pack must contain exactly 31 local authority seeds, found ${localAuthoritySeeds.length}`);
    }
    if (plan.placeSeeds.some(place => ['Connaught', 'Leinster', 'Munster', 'Ulster'].includes(place.name))) {
      errors.push('IE complete pack must not publish the historic province layer as the practical local-authority layer');
    }
    for (const place of localAuthoritySeeds) {
      if (place.validationState !== 'source-linked') errors.push(`IE local authority ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete IE first-order seed'))) {
        errors.push(`IE local authority ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('local authority'))) {
        errors.push(`IE local authority ${place.name} must record local-authority type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`IE local authority ${place.name} must cite the local-authority list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`IE local authority ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`IE local authority ${place.name} must keep reference and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'KH') {
    const adm1Seeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'capital'
    ));
    const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
    const capitalSeeds = plan.placeSeeds.filter(place => place.featureClass === 'capital');
    if (adm1Seeds.length !== 25) {
      errors.push(`KH complete pack must contain exactly 25 ADM1 seeds, found ${adm1Seeds.length}`);
    }
    if (provinceSeeds.length !== 24) errors.push(`KH complete pack must contain exactly 24 province seeds, found ${provinceSeeds.length}`);
    if (capitalSeeds.length !== 1 || capitalSeeds[0]?.name !== 'Phnom Penh') {
      errors.push('KH complete pack must contain exactly one Phnom Penh capital municipality seed');
    }
    for (const place of adm1Seeds) {
      if (place.validationState !== 'source-linked') errors.push(`KH ADM1 seed ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete KH first-order seed'))) {
        errors.push(`KH ADM1 seed ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`KH ADM1 seed ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`KH ADM1 seed ${place.name} must cite the ADM1 list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`KH ADM1 seed ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`KH ADM1 seed ${place.name} must keep reference and GeoNames source links`);
      }
    }
    if (!capitalSeeds[0]?.notes.some(note => note.includes('GeoNames country metadata lists Phnom Penh as capital'))) {
      errors.push('KH Phnom Penh seed must cite GeoNames country capital metadata');
    }
  }
  if (plan.countryCode === 'SJ' && plan.countryName === 'Svalbard and Jan Mayen') {
    const componentSeeds = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = ['Svalbard', 'Jan Mayen', 'Longyearbyen', 'Olonkinbyen'];
    if (componentSeeds.length !== expectedNames.length) {
      errors.push(`SJ combined pack must contain exactly ${expectedNames.length} component/admin-centre seeds, found ${componentSeeds.length}`);
    }
    for (const name of expectedNames) {
      if (!componentSeeds.some(place => place.name === name)) errors.push(`SJ combined pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('not treated as a single local administrative system'))) {
      errors.push('SJ combined pack must state that Svalbard and Jan Mayen are not one local administrative system');
    }
    for (const place of componentSeeds) {
      if (place.validationState !== 'source-linked') errors.push(`SJ component seed ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete SJ first-order seed'))) {
        errors.push(`SJ component seed ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`SJ component seed ${place.name} must cite the component source list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`SJ component seed ${place.name} must record its GeoNames row`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`SJ component seed ${place.name} must keep official/reference and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'SJ' && plan.countryName === 'Jan Mayen') {
    const regionSeeds = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    if (regionSeeds.length !== 2) {
      errors.push(`Jan Mayen pack must contain exactly 2 public reference seeds, found ${regionSeeds.length}`);
    }
    const olonkinbyen = regionSeeds.find(place => place.name === 'Olonkinbyen');
    const beerenberg = regionSeeds.find(place => place.name === 'Beerenberg');
    if (olonkinbyen?.featureClass !== 'settlement') errors.push('Jan Mayen pack must include Olonkinbyen as a settlement/station seed');
    if (beerenberg?.featureClass !== 'special-region') errors.push('Jan Mayen pack must include Beerenberg as a natural-reference special-region seed');
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('No permanent settlement'))) {
      errors.push('Jan Mayen pack must avoid permanent-settlement/address-layer overclaims');
    }
    for (const place of regionSeeds) {
      if (place.validationState !== 'source-linked') errors.push(`Jan Mayen seed ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete SJ first-order seed'))) {
        errors.push(`Jan Mayen seed ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`Jan Mayen seed ${place.name} must cite its public reference source`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`Jan Mayen seed ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`Jan Mayen seed ${place.name} must keep reference and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'SJ' && plan.countryName === 'Svalbard') {
    const planningAreaSeeds = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = ['Longyearbyen', 'Ny-Alesund', 'Barentsburg', 'Pyramiden', 'Colesbukta'];
    if (planningAreaSeeds.length !== expectedNames.length) {
      errors.push(`Svalbard pack must contain exactly ${expectedNames.length} planning-area seeds, found ${planningAreaSeeds.length}`);
    }
    for (const name of expectedNames) {
      if (!planningAreaSeeds.some(place => place.name === name)) errors.push(`Svalbard pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('five planning areas'))) {
      errors.push('Svalbard pack must state that it is the five-planning-area layer');
    }
    for (const place of planningAreaSeeds) {
      if (place.validationState !== 'source-linked') errors.push(`Svalbard planning-area seed ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete SJ first-order seed'))) {
        errors.push(`Svalbard planning-area seed ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('planning area'))) {
        errors.push(`Svalbard planning-area seed ${place.name} must record planning-area treatment`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`Svalbard planning-area seed ${place.name} must cite the Governor planning-area list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`Svalbard planning-area seed ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`Svalbard planning-area seed ${place.name} must keep Governor/reference and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'VN') {
    const currentSeeds = plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'city' || place.featureClass === 'capital'
    ));
    const provinceSeeds = plan.placeSeeds.filter(place => place.featureClass === 'province');
    const citySeeds = plan.placeSeeds.filter(place => place.featureClass === 'city' || place.featureClass === 'capital');
    if (currentSeeds.length !== 34) {
      errors.push(`VN complete pack must contain exactly 34 current provincial-level seeds, found ${currentSeeds.length}`);
    }
    if (provinceSeeds.length !== 28) errors.push(`VN complete pack must contain exactly 28 province seeds, found ${provinceSeeds.length}`);
    if (citySeeds.length !== 6) errors.push(`VN complete pack must contain exactly 6 centrally governed city/capital seeds, found ${citySeeds.length}`);
    if (!citySeeds.some(place => place.name === 'Ha Noi' && place.featureClass === 'capital')) {
      errors.push('VN complete pack must include Ha Noi as the capital city seed');
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('legacy 63-unit layer'))) {
      errors.push('VN country seed must warn that legacy 63-unit sources are compatibility-only');
    }
    if (!countrySeed?.notes.some(note => note.includes('two-tier reform dissolves district/township'))) {
      errors.push('VN country seed must record the district/township dissolution note');
    }
    for (const place of currentSeeds) {
      if (place.validationState !== 'source-linked') errors.push(`VN provincial-level seed ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete VN first-order seed'))) {
        errors.push(`VN provincial-level seed ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`VN provincial-level seed ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`VN provincial-level seed ${place.name} must cite the current 34-unit list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`VN provincial-level seed ${place.name} must record its GeoNames legacy/current cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`VN provincial-level seed ${place.name} must keep official/current and GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'BT_T') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = ['Bir Tawil Triangle', 'Jabal Tawil', 'Wadi Tawil', 'Gabal Hagar El Zarqa'];
    if (anchors.length !== expectedNames.length) {
      errors.push(`BT_T complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`BT_T complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('does not assert sovereignty'))) {
      errors.push('BT_T country seed must keep the no-sovereignty-claim note');
    }
    if (!countrySeed?.notes.some(note => note.includes('permanent population'))) {
      errors.push('BT_T country seed must avoid permanent-population/address overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`BT_T anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete BT_T first-order seed'))) {
        errors.push(`BT_T anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`BT_T anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`BT_T anchor ${place.name} must cite its non-claim source list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`BT_T anchor ${place.name} must record a public name/gazetteer cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`BT_T anchor ${place.name} must keep reference and gazetteer source links`);
      }
      if (place.name === 'Bir Tawil Triangle' && !place.notes.some(note => note.includes('does not assert sovereignty'))) {
        errors.push('BT_T region anchor must carry the non-sovereignty note');
      }
    }
  }
  if (plan.countryCode === 'CRIM') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = ['Crimean Peninsula', 'Autonomous Republic of Crimea', 'Sevastopol', 'Simferopol'];
    if (anchors.length !== expectedNames.length) {
      errors.push(`CRIM complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`CRIM complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('does not adjudicate sovereignty'))) {
      errors.push('CRIM country seed must keep the no-sovereignty-adjudication note');
    }
    if (!countrySeed?.notes.some(note => note.includes('current control'))) {
      errors.push('CRIM country seed must avoid current-control overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`CRIM anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete CRIM first-order seed'))) {
        errors.push(`CRIM anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`CRIM anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`CRIM anchor ${place.name} must cite its reference list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`CRIM anchor ${place.name} must record its GeoNames cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`CRIM anchor ${place.name} must keep OCHA/GeoNames source links`);
      }
    }
  }
  if (plan.countryCode === 'CYGL') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'United Nations Buffer Zone in Cyprus',
      'Nicosia Green Line',
      'Ledra Palace Crossing',
      'Ledra Street Crossing',
      'Pyla',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`CYGL complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`CYGL complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('does not grant crossing rights'))) {
      errors.push('CYGL country seed must avoid crossing-rights overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`CYGL anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete CYGL first-order seed'))) {
        errors.push(`CYGL anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`CYGL anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`CYGL anchor ${place.name} must cite the UNFICYP/reference list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`CYGL anchor ${place.name} must record its public reference cross-link`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`CYGL anchor ${place.name} must keep UNFICYP/reference links`);
      }
      if (place.name.includes('Crossing') && !place.notes.some(note => note.includes('not a guarantee of access') || note.includes('operational access status'))) {
        errors.push(`CYGL crossing anchor ${place.name} must avoid access-permit overclaims`);
      }
    }
  }
  if (plan.countryCode === 'DONB') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = ['Donetsk Oblast', 'Luhansk Oblast', 'Donetsk', 'Luhansk', 'Siverskyi Donets Basin'];
    if (anchors.length !== expectedNames.length) {
      errors.push(`DONB complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`DONB complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('does not assert current control'))) {
      errors.push('DONB country seed must avoid current-control overclaims');
    }
    if (!countrySeed?.notes.some(note => note.includes('frontline'))) {
      errors.push('DONB country seed must avoid frontline overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`DONB anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete DONB first-order seed'))) {
        errors.push(`DONB anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`DONB anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`DONB anchor ${place.name} must cite the OCHA/HDX reference list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`DONB anchor ${place.name} must record its public gazetteer cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`DONB anchor ${place.name} must keep OCHA/HDX source links`);
      }
    }
  }
  if (plan.countryCode === 'EEBD') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = ['Badme', 'Tsorona', 'Zalambessa', 'Bure Border Area', 'Mereb River Border Sector'];
    if (anchors.length !== expectedNames.length) {
      errors.push(`EEBD complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`EEBD complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('does not assert sovereignty'))) {
      errors.push('EEBD country seed must keep the no-sovereignty note');
    }
    if (!countrySeed?.notes.some(note => note.includes('demarcation'))) {
      errors.push('EEBD country seed must avoid demarcation-completion overclaims');
    }
    if (!countrySeed?.notes.some(note => note.includes('access rights'))) {
      errors.push('EEBD country seed must avoid access-rights overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`EEBD anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete EEBD first-order seed'))) {
        errors.push(`EEBD anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`EEBD anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`EEBD anchor ${place.name} must cite the EEBC/UNMEE source list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`EEBD anchor ${place.name} must record its public gazetteer cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`EEBD anchor ${place.name} must keep EEBC/UNMEE and gazetteer source links`);
      }
      if (place.name === 'Bure Border Area' && !place.notes.some(note => note.includes('crossing permission'))) {
        errors.push('EEBD Bure anchor must avoid crossing-permission overclaims');
      }
    }
  }
  if (plan.countryCode === 'JP_NT') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = ['Etorofu Island', 'Kunashiri Island', 'Shikotan Island', 'Habomai Islands'];
    if (anchors.length !== expectedNames.length) {
      errors.push(`JP_NT complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`JP_NT complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('does not assert sovereignty'))) {
      errors.push('JP_NT country seed must keep the no-sovereignty-adjudication note');
    }
    if (!countrySeed?.notes.some(note => note.includes('current administration'))) {
      errors.push('JP_NT country seed must avoid current-administration overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`JP_NT anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete JP_NT first-order seed'))) {
        errors.push(`JP_NT anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`JP_NT anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`JP_NT anchor ${place.name} must cite the Northern Territories source list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`JP_NT anchor ${place.name} must record its public gazetteer cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`JP_NT anchor ${place.name} must keep MOFA and gazetteer source links`);
      }
    }
  }
  if (plan.countryCode === 'JP_SK') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Uotsuri Island',
      'Kitakojima Island',
      'Minamikojima Island',
      'Kuba Island',
      'Taisho Island',
      'Okinokitaiwa Island',
      'Okinominamiiwa Island',
      'Tobise Island',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`JP_SK complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`JP_SK complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('does not assert sovereignty'))) {
      errors.push('JP_SK country seed must keep the no-sovereignty-adjudication note');
    }
    if (!countrySeed?.notes.some(note => note.includes('access rights'))) {
      errors.push('JP_SK country seed must avoid access-rights overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`JP_SK anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete JP_SK first-order seed'))) {
        errors.push(`JP_SK anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`JP_SK anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`JP_SK anchor ${place.name} must cite the Senkaku source list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`JP_SK anchor ${place.name} must record its public gazetteer cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`JP_SK anchor ${place.name} must keep MOFA and gazetteer source links`);
      }
    }
  }
  if (plan.countryCode === 'JP_TK') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = ['Liancourt Rocks', 'Dongdo', 'Seodo', 'Dokdo Minor Rock Islets'];
    if (anchors.length !== expectedNames.length) {
      errors.push(`JP_TK complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`JP_TK complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('does not assert sovereignty'))) {
      errors.push('JP_TK country seed must keep the no-sovereignty-adjudication note');
    }
    if (!countrySeed?.notes.some(note => note.includes('resident records'))) {
      errors.push('JP_TK country seed must avoid resident/address overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`JP_TK anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete JP_TK first-order seed'))) {
        errors.push(`JP_TK anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`JP_TK anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`JP_TK anchor ${place.name} must cite the Takeshima/Dokdo source list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`JP_TK anchor ${place.name} must record its public gazetteer cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`JP_TK anchor ${place.name} must keep MOFA/Korean public and gazetteer source links`);
      }
      if (['Dongdo', 'Seodo'].includes(place.name) && !place.notes.some(note => note.includes('no building'))) {
        errors.push(`JP_TK islet anchor ${place.name} must avoid building/private-address overclaims`);
      }
    }
  }
  if (plan.countryCode === 'KASH') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Kashmir Region',
      'Jammu and Kashmir',
      'Ladakh',
      'Azad Jammu and Kashmir',
      'Gilgit-Baltistan',
      'Aksai Chin',
      'Line of Control',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`KASH complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`KASH complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('does not assert sovereignty'))) {
      errors.push('KASH country seed must keep the no-sovereignty note');
    }
    if (!countrySeed?.notes.some(note => note.includes('current control'))) {
      errors.push('KASH country seed must avoid current-control overclaims');
    }
    if (!countrySeed?.notes.some(note => note.includes('administrative validity'))) {
      errors.push('KASH country seed must avoid administrative-validity overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`KASH anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete KASH first-order seed'))) {
        errors.push(`KASH anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`KASH anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`KASH anchor ${place.name} must cite the Kashmir source list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`KASH anchor ${place.name} must record its public gazetteer cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`KASH anchor ${place.name} must keep UNMOGIP/UNTERM and gazetteer source links`);
      }
      if (place.name === 'Line of Control' && !place.notes.some(note => note.includes('crossing permission') || note.includes('access right'))) {
        errors.push('KASH Line of Control anchor must avoid crossing/access overclaims');
      }
    }
  }
  if (plan.countryCode === 'PMR') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Transnistrian Region of the Republic of Moldova',
      'Tiraspol',
      'Bender',
      'Camenca District',
      'Ribnita District',
      'Dubasari District',
      'Grigoriopol District',
      'Slobozia District',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`PMR complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`PMR complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('statehood'))) {
      errors.push('PMR country seed must avoid statehood overclaims');
    }
    if (!countrySeed?.notes.some(note => note.includes('recognition'))) {
      errors.push('PMR country seed must avoid recognition overclaims');
    }
    if (!countrySeed?.notes.some(note => note.includes('current control'))) {
      errors.push('PMR country seed must avoid current-control overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`PMR anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete PMR first-order seed'))) {
        errors.push(`PMR anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`PMR anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`PMR anchor ${place.name} must cite the Transnistrian source list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`PMR anchor ${place.name} must record its public gazetteer cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`PMR anchor ${place.name} must keep OSCE/Moldova and gazetteer source links`);
      }
      if (place.name === 'Transnistrian Region of the Republic of Moldova' && !place.notes.some(note => note.includes('legal parity') || note.includes('statehood'))) {
        errors.push('PMR regional anchor must avoid legal-parity/statehood overclaims');
      }
    }
  }
  if (plan.countryCode === 'SCSD') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Spratly Islands',
      'Paracel Islands',
      'Pratas Islands',
      'Macclesfield Bank',
      'Scarborough Shoal',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`SCSD complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`SCSD complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('maritime entitlement'))) {
      errors.push('SCSD country seed must avoid maritime-entitlement overclaims');
    }
    if (!countrySeed?.notes.some(note => note.includes('military/facility status'))) {
      errors.push('SCSD country seed must avoid military/facility overclaims');
    }
    if (!countrySeed?.notes.some(note => note.includes('safe navigation'))) {
      errors.push('SCSD country seed must avoid safe-navigation overclaims');
    }
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`SCSD anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete SCSD first-order seed'))) {
        errors.push(`SCSD anchor ${place.name} must be marked as complete`);
      }
      if (!place.notes.some(note => note.includes('first-order type:'))) {
        errors.push(`SCSD anchor ${place.name} must record its type`);
      }
      if (!place.notes.some(note => note.includes('administrative division list:'))) {
        errors.push(`SCSD anchor ${place.name} must cite the South China Sea source list`);
      }
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) {
        errors.push(`SCSD anchor ${place.name} must record its public gazetteer cross-reference`);
      }
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) {
        errors.push(`SCSD anchor ${place.name} must keep AMTI/CNA and gazetteer source links`);
      }
      if (place.name === 'Macclesfield Bank' && !place.notes.some(note => note.includes('Submerged') || note.includes('not a land-address'))) {
        errors.push('SCSD Macclesfield Bank anchor must avoid land-address overclaims');
      }
    }
  }
  if (plan.countryCode === 'TRNC') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Areas of Cyprus Not Under Effective Control',
      'North Nicosia',
      'Famagusta',
      'Kyrenia',
      'Morphou',
      'Iskele',
      'Karpas Peninsula',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`TRNC complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`TRNC complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('statehood'))) errors.push('TRNC country seed must avoid statehood overclaims');
    if (!countrySeed?.notes.some(note => note.includes('recognition'))) errors.push('TRNC country seed must avoid recognition overclaims');
    if (!countrySeed?.notes.some(note => note.includes('current control'))) errors.push('TRNC country seed must avoid current-control overclaims');
    if (!countrySeed?.notes.some(note => note.includes('crossing rights'))) errors.push('TRNC country seed must avoid crossing-rights overclaims');
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`TRNC anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete TRNC first-order seed'))) errors.push(`TRNC anchor ${place.name} must be marked as complete`);
      if (!place.notes.some(note => note.includes('first-order type:'))) errors.push(`TRNC anchor ${place.name} must record its type`);
      if (!place.notes.some(note => note.includes('administrative division list:'))) errors.push(`TRNC anchor ${place.name} must cite the Northern Cyprus source list`);
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) errors.push(`TRNC anchor ${place.name} must record its public gazetteer cross-reference`);
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) errors.push(`TRNC anchor ${place.name} must keep EU/UNFICYP and gazetteer source links`);
      if (place.name === 'North Nicosia' && !place.notes.some(note => note.includes('border-crossing'))) {
        errors.push('TRNC North Nicosia anchor must avoid border-crossing overclaims');
      }
    }
  }
  if (plan.countryCode === 'BAAR') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Baarle Enclave Complex',
      'Baarle-Hertog',
      'Baarle-Nassau',
      'Belgian Enclaves H1-H22',
      'Dutch Enclaves N1-N8',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`BAAR complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`BAAR complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('parcel boundaries'))) errors.push('BAAR country seed must avoid parcel-boundary overclaims');
    if (!countrySeed?.notes.some(note => note.includes('property-level addresses'))) errors.push('BAAR country seed must avoid property-address overclaims');
    if (!countrySeed?.notes.some(note => note.includes('front-door jurisdiction'))) errors.push('BAAR country seed must avoid jurisdiction overclaims');
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`BAAR anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete BAAR first-order seed'))) errors.push(`BAAR anchor ${place.name} must be marked as complete`);
      if (!place.notes.some(note => note.includes('first-order type:'))) errors.push(`BAAR anchor ${place.name} must record its type`);
      if (!place.notes.some(note => note.includes('administrative division list:'))) errors.push(`BAAR anchor ${place.name} must cite the Baarle source list`);
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) errors.push(`BAAR anchor ${place.name} must record its public gazetteer cross-reference`);
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) errors.push(`BAAR anchor ${place.name} must keep Baarle and gazetteer source links`);
      if (place.name.includes('H1-H22') && !place.notes.some(note => note.includes('individual parcel boundaries'))) {
        errors.push('BAAR Belgian enclave-set anchor must avoid parcel-boundary overclaims');
      }
      if (place.name.includes('N1-N8') && !place.notes.some(note => note.includes('individual parcel boundaries'))) {
        errors.push('BAAR Dutch enclave-set anchor must avoid parcel-boundary overclaims');
      }
    }
  }
  if (plan.countryCode === 'PHIS') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Pheasant Island Condominium',
      'Bidasoa River Setting',
      'Hendaye Shore',
      'Irun Shore',
      'Hondarribia Reference',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`PHIS complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`PHIS complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('date-specific current authority'))) errors.push('PHIS country seed must avoid date-specific authority overclaims');
    if (!countrySeed?.notes.some(note => note.includes('public access'))) errors.push('PHIS country seed must avoid public-access overclaims');
    if (!countrySeed?.notes.some(note => note.includes('delivery availability'))) errors.push('PHIS country seed must avoid delivery overclaims');
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`PHIS anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete PHIS first-order seed'))) errors.push(`PHIS anchor ${place.name} must be marked as complete`);
      if (!place.notes.some(note => note.includes('first-order type:'))) errors.push(`PHIS anchor ${place.name} must record its type`);
      if (!place.notes.some(note => note.includes('administrative division list:'))) errors.push(`PHIS anchor ${place.name} must cite the Pheasant Island source list`);
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) errors.push(`PHIS anchor ${place.name} must record its public gazetteer cross-reference`);
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) errors.push(`PHIS anchor ${place.name} must keep Hendaye/Bidasoa and gazetteer source links`);
      if (place.name === 'Pheasant Island Condominium' && !place.notes.some(note => note.includes('date-specific current authority'))) {
        errors.push('PHIS condominium anchor must avoid current-authority overclaims');
      }
    }
  }
  if (plan.countryCode === 'BV') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = ['Bouvetøya Main Island', 'Nyrøysa', 'Olavtoppen', 'Norvegia Station', 'Larsøya', 'Kapp Valdivia'];
    if (anchors.length !== expectedNames.length) {
      errors.push(`BV complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`BV complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('inhabited addresses'))) errors.push('BV country seed must avoid inhabited-address overclaims');
    if (!countrySeed?.notes.some(note => note.includes('landing permission'))) errors.push('BV country seed must avoid landing-permission overclaims');
    if (!countrySeed?.notes.some(note => note.includes('rescue availability'))) errors.push('BV country seed must avoid rescue-availability overclaims');
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`BV anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete BV first-order seed'))) errors.push(`BV anchor ${place.name} must be marked as complete`);
      if (!place.notes.some(note => note.includes('first-order type:'))) errors.push(`BV anchor ${place.name} must record its type`);
      if (!place.notes.some(note => note.includes('administrative division list:'))) errors.push(`BV anchor ${place.name} must cite the Bouvet source list`);
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) errors.push(`BV anchor ${place.name} must record its public gazetteer cross-reference`);
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) errors.push(`BV anchor ${place.name} must keep NPI and gazetteer source links`);
      if (place.name === 'Norvegia Station' && !place.notes.some(note => note.includes('permanent settlement'))) {
        errors.push('BV Norvegia Station anchor must avoid settlement/public-service overclaims');
      }
    }
  }
  if (plan.countryCode === 'CL-DI') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Desventuradas Islands Archipelago',
      'San Ambrosio Island',
      'San Félix Island',
      'González Islet',
      'Roca Catedral',
      'Nazca-Desventuradas Marine Park',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`CL-DI complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`CL-DI complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('civilian settlement'))) errors.push('CL-DI country seed must avoid settlement overclaims');
    if (!countrySeed?.notes.some(note => note.includes('landing permission'))) errors.push('CL-DI country seed must avoid landing-permission overclaims');
    if (!countrySeed?.notes.some(note => note.includes('delivery availability'))) errors.push('CL-DI country seed must avoid delivery overclaims');
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`CL-DI anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete CL-DI first-order seed'))) errors.push(`CL-DI anchor ${place.name} must be marked as complete`);
      if (!place.notes.some(note => note.includes('first-order type:'))) errors.push(`CL-DI anchor ${place.name} must record its type`);
      if (!place.notes.some(note => note.includes('administrative division list:'))) errors.push(`CL-DI anchor ${place.name} must cite the Desventuradas source list`);
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) errors.push(`CL-DI anchor ${place.name} must record its public gazetteer cross-reference`);
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) errors.push(`CL-DI anchor ${place.name} must keep SUBPESCA/MMA and gazetteer source links`);
      if (place.name === 'San Félix Island' && !place.notes.some(note => note.includes('airfield operation'))) {
        errors.push('CL-DI San Félix anchor must avoid airfield-operation overclaims');
      }
    }
  }
  if (plan.countryCode === 'CL-SG') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Salas y Gómez / Motu Motiro Hiva',
      'Salas y Gómez Twin Rocks and Isthmus',
      'Salas y Gómez Nature Sanctuary',
      'Motu Motiro Hiva Marine Park',
      'Rapa Nui Administrative Reference',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`CL-SG complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`CL-SG complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('settlement'))) errors.push('CL-SG country seed must avoid settlement overclaims');
    if (!countrySeed?.notes.some(note => note.includes('freshwater availability'))) errors.push('CL-SG country seed must avoid freshwater overclaims');
    if (!countrySeed?.notes.some(note => note.includes('delivery availability'))) errors.push('CL-SG country seed must avoid delivery overclaims');
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`CL-SG anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete CL-SG first-order seed'))) errors.push(`CL-SG anchor ${place.name} must be marked as complete`);
      if (!place.notes.some(note => note.includes('first-order type:'))) errors.push(`CL-SG anchor ${place.name} must record its type`);
      if (!place.notes.some(note => note.includes('administrative division list:'))) errors.push(`CL-SG anchor ${place.name} must cite the Salas y Gómez source list`);
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) errors.push(`CL-SG anchor ${place.name} must record its public gazetteer cross-reference`);
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) errors.push(`CL-SG anchor ${place.name} must keep Chilean and gazetteer source links`);
      if (place.name === 'Salas y Gómez Twin Rocks and Isthmus' && !place.notes.some(note => note.includes('tide'))) {
        errors.push('CL-SG twin-rock anchor must avoid tide/access overclaims');
      }
    }
  }
  if (plan.countryCode === 'CP') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Île de La Passion-Clipperton',
      'Clipperton Atoll',
      'Clipperton Inner Lagoon',
      'Rocher de Clipperton',
      'French 12 NM Clipperton Territorial Sea',
      'French Exclusive Economic Zone (Clipperton Island)',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`CP complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`CP complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('habitation'))) errors.push('CP country seed must avoid habitation overclaims');
    if (!countrySeed?.notes.some(note => note.includes('landing permission'))) errors.push('CP country seed must avoid landing-permission overclaims');
    if (!countrySeed?.notes.some(note => note.includes('rescue availability'))) errors.push('CP country seed must avoid rescue-availability overclaims');
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`CP anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete CP first-order seed'))) errors.push(`CP anchor ${place.name} must be marked as complete`);
      if (!place.notes.some(note => note.includes('first-order type:'))) errors.push(`CP anchor ${place.name} must record its type`);
      if (!place.notes.some(note => note.includes('administrative division list:'))) errors.push(`CP anchor ${place.name} must cite the Clipperton source list`);
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) errors.push(`CP anchor ${place.name} must record its public gazetteer cross-reference`);
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) errors.push(`CP anchor ${place.name} must keep French and gazetteer source links`);
      if (place.name === 'French Exclusive Economic Zone (Clipperton Island)' && !place.notes.some(note => note.includes('legal advice'))) {
        errors.push('CP EEZ anchor must avoid legal-advice overclaims');
      }
    }
  }
  if (plan.countryCode === 'XD') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Eastern Sovereign Base Area',
      'Dhekelia Area Administration Office Reference',
      'Dhekelia Cantonment Reference',
      'Agios Nikolaos Special Area of Conservation',
      'Cape Pyla Special Area of Conservation',
      'Xylotymbou-Xylophagou-Ormidhia Community Cluster Reference',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`XD complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`XD complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('operational status'))) errors.push('XD country seed must avoid operational-status overclaims');
    if (!countrySeed?.notes.some(note => note.includes('access rights'))) errors.push('XD country seed must avoid access-rights overclaims');
    if (!countrySeed?.notes.some(note => note.includes('delivery availability'))) errors.push('XD country seed must avoid delivery overclaims');
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`XD anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete XD first-order seed'))) errors.push(`XD anchor ${place.name} must be marked as complete`);
      if (!place.notes.some(note => note.includes('first-order type:'))) errors.push(`XD anchor ${place.name} must record its type`);
      if (!place.notes.some(note => note.includes('administrative division list:'))) errors.push(`XD anchor ${place.name} must cite the Dhekelia source list`);
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) errors.push(`XD anchor ${place.name} must record its public gazetteer cross-reference`);
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) errors.push(`XD anchor ${place.name} must keep SBAA and gazetteer source links`);
      if (place.name === 'Dhekelia Cantonment Reference' && !place.notes.some(note => note.includes('military unit'))) {
        errors.push('XD Dhekelia Cantonment anchor must avoid military unit/facility overclaims');
      }
      if (place.name.includes('Community Cluster') && !place.notes.some(note => note.includes('enclave boundary'))) {
        errors.push('XD community-cluster anchor must avoid enclave-boundary overclaims');
      }
    }
  }
  if (plan.countryCode === 'XU') {
    const anchors = plan.placeSeeds.filter(place => place.featureClass !== 'country');
    const expectedNames = [
      'Western Sovereign Base Area',
      'Akrotiri Area Administration Office Reference',
      'Episkopi Headquarters Reference',
      'Akrotiri Peninsula Environmental Reference',
      'Akrotiri Special Area of Conservation',
      'Avdimou-Paramali Community Cluster Reference',
    ];
    if (anchors.length !== expectedNames.length) {
      errors.push(`XU complete pack must contain exactly ${expectedNames.length} public anchors, found ${anchors.length}`);
    }
    for (const name of expectedNames) {
      if (!anchors.some(place => place.name === name)) errors.push(`XU complete pack must include ${name}`);
    }
    const countrySeed = plan.placeSeeds.find(place => place.featureClass === 'country');
    if (!countrySeed?.notes.some(note => note.includes('operational status'))) errors.push('XU country seed must avoid operational-status overclaims');
    if (!countrySeed?.notes.some(note => note.includes('access rights'))) errors.push('XU country seed must avoid access-rights overclaims');
    if (!countrySeed?.notes.some(note => note.includes('delivery availability'))) errors.push('XU country seed must avoid delivery overclaims');
    for (const place of anchors) {
      if (place.validationState !== 'source-linked') errors.push(`XU anchor ${place.name} must be source-linked`);
      if (!place.notes.some(note => note.includes('Complete XU first-order seed'))) errors.push(`XU anchor ${place.name} must be marked as complete`);
      if (!place.notes.some(note => note.includes('first-order type:'))) errors.push(`XU anchor ${place.name} must record its type`);
      if (!place.notes.some(note => note.includes('administrative division list:'))) errors.push(`XU anchor ${place.name} must cite the Akrotiri source list`);
      if (!place.notes.some(note => note.includes('GeoNames subdivision listing row:'))) errors.push(`XU anchor ${place.name} must record its public gazetteer cross-reference`);
      if (!place.geodataLinks.official || !place.geodataLinks.geonames) errors.push(`XU anchor ${place.name} must keep SBAA and gazetteer source links`);
      if (place.name === 'Episkopi Headquarters Reference' && !place.notes.some(note => note.includes('military function'))) {
        errors.push('XU Episkopi anchor must avoid military-function overclaims');
      }
      if (place.name.includes('Special Area of Conservation') && !place.notes.some(note => note.includes('permit'))) {
        errors.push('XU protected-area anchor must avoid permit overclaims');
      }
    }
  }
  return errors;
}
