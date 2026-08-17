import type {
  AddressSourceKind,
  CountryFusionAdapter,
  SourcePlanEntry,
} from "../lib/addressFusionEngine";

type SourceStatus = SourcePlanEntry["status"];

interface CountrySpec {
  code: string;
  name: string;
  languages: readonly string[];
  postcode?: RegExp;
  radius?: number;
  sources: {
    address: string;
    addressStatus: SourceStatus;
    postal: string;
    postalStatus: SourceStatus;
    geography: string;
    geographyStatus: SourceStatus;
    cadastre: string;
    cadastreStatus: SourceStatus;
    statistics: string;
    statisticsStatus: SourceStatus;
    notes?: string;
  };
}

const KINDS: readonly AddressSourceKind[] = [
  "official_address",
  "postal",
  "building",
  "road",
  "cadastre",
  "administrative",
  "coordinates",
  "statistics",
  "osm",
];

function sourceId(country: string, kind: AddressSourceKind): string {
  return `${country.toLowerCase()}-${kind.replaceAll("_", "-")}`;
}

function buildSourcePlan(spec: CountrySpec): SourcePlanEntry[] {
  const sourceFor: Record<
    AddressSourceKind,
    { label: string; status: SourceStatus; priority: number }
  > = {
    official_address: {
      label: spec.sources.address,
      status: spec.sources.addressStatus,
      priority: 100,
    },
    postal: {
      label: spec.sources.postal,
      status: spec.sources.postalStatus,
      priority: 94,
    },
    building: {
      label: spec.sources.geography,
      status: spec.sources.geographyStatus,
      priority: 82,
    },
    road: {
      label: spec.sources.geography,
      status: spec.sources.geographyStatus,
      priority: 78,
    },
    cadastre: {
      label: spec.sources.cadastre,
      status: spec.sources.cadastreStatus,
      priority: 90,
    },
    administrative: {
      label: spec.sources.geography,
      status: spec.sources.geographyStatus,
      priority: 86,
    },
    coordinates: {
      label: spec.sources.geography,
      status: spec.sources.geographyStatus,
      priority: 76,
    },
    statistics: {
      label: spec.sources.statistics,
      status: spec.sources.statisticsStatus,
      priority: 62,
    },
    osm: {
      label: "OpenStreetMap regional extract",
      status: "attribution",
      priority: 60,
    },
  };

  return KINDS.map((kind) => ({
    id: sourceId(spec.code, kind),
    label: sourceFor[kind].label,
    kind,
    status: sourceFor[kind].status,
    priority: sourceFor[kind].priority,
    notes: spec.sources.notes,
  }));
}

/**
 * Connector catalog for the first 25 AGID fusion countries.
 *
 * This is a source-selection plan, not a redistribution claim. A connector must
 * pass source-specific licence, access and freshness checks before ingestion.
 */
const COUNTRY_SPECS: readonly CountrySpec[] = [
  {
    code: "BR",
    name: "Brazil",
    languages: ["pt-BR", "en"],
    postcode: /^\d{5}-?\d{3}$/,
    sources: {
      address: "IBGE/INDE address references and municipal address registers",
      addressStatus: "research-required",
      postal: "Correios CEP products or an authorised CEP provider",
      postalStatus: "restricted",
      geography: "IBGE geographies, INDE and municipal open GIS",
      geographyStatus: "attribution",
      cadastre: "Municipal cadastre and INCRA-linked parcel sources",
      cadastreStatus: "research-required",
      statistics: "IBGE census and territorial statistics",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "MX",
    name: "Mexico",
    languages: ["es-MX", "en"],
    postcode: /^\d{5}$/,
    sources: {
      address: "INEGI locality, road and establishment references",
      addressStatus: "attribution",
      postal: "Correos de México postal-code directory",
      postalStatus: "research-required",
      geography: "INEGI Marco Geoestadístico, road network and DENUE",
      geographyStatus: "attribution",
      cadastre: "State/municipal cadastre and RAN-compatible references",
      cadastreStatus: "research-required",
      statistics: "INEGI census and AGEB statistics",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "AR",
    name: "Argentina",
    languages: ["es-AR", "en"],
    postcode: /^[A-Z]?\d{4}[A-Z]{0,3}$/i,
    sources: {
      address: "Provincial and municipal address registers through IDERA",
      addressStatus: "research-required",
      postal: "Correo Argentino CPA reference",
      postalStatus: "research-required",
      geography: "IGN Argentina and IDERA geospatial services",
      geographyStatus: "attribution",
      cadastre: "Provincial cadastral agencies",
      cadastreStatus: "research-required",
      statistics: "INDEC census and geographic codes",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "CO",
    name: "Colombia",
    languages: ["es-CO", "en"],
    postcode: /^\d{6}$/,
    sources: {
      address: "Municipal open address and nomenclature datasets",
      addressStatus: "research-required",
      postal: "4-72 national postal-code reference",
      postalStatus: "research-required",
      geography: "IGAC and national open-data geographies",
      geographyStatus: "attribution",
      cadastre: "IGAC multipurpose cadastre and local cadastral managers",
      cadastreStatus: "research-required",
      statistics: "DANE census and DIVIPOLA",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "CR",
    name: "Costa Rica",
    languages: ["es-CR", "en"],
    postcode: /^\d{5}$/,
    sources: {
      address: "SNIT and municipal address references",
      addressStatus: "research-required",
      postal: "Correos de Costa Rica postal directory",
      postalStatus: "research-required",
      geography: "SNIT national geospatial layers",
      geographyStatus: "attribution",
      cadastre: "Registro Nacional cadastral services",
      cadastreStatus: "research-required",
      statistics: "INEC census geography",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "PA",
    name: "Panama",
    languages: ["es-PA", "en"],
    sources: {
      address: "Municipal and national place/address references",
      addressStatus: "research-required",
      postal: "Correos Panamá delivery and postal-zone references",
      postalStatus: "research-required",
      geography: "Instituto Geográfico Nacional Tommy Guardia",
      geographyStatus: "research-required",
      cadastre: "ANATI and municipal cadastral references",
      cadastreStatus: "research-required",
      statistics: "INEC Panama census geography",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "TR",
    name: "Türkiye",
    languages: ["tr", "en"],
    postcode: /^\d{5}$/,
    sources: {
      address: "MAKS/NVI national address system",
      addressStatus: "restricted",
      postal: "PTT postal-code reference",
      postalStatus: "research-required",
      geography: "National and municipal geospatial services",
      geographyStatus: "research-required",
      cadastre: "TKGM cadastral and parcel services",
      cadastreStatus: "restricted",
      statistics: "TurkStat administrative and census statistics",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "GE",
    name: "Georgia",
    languages: ["ka", "en"],
    postcode: /^\d{4}$/,
    sources: {
      address: "NAPR address and property references",
      addressStatus: "research-required",
      postal: "Georgian Post postal-code directory",
      postalStatus: "research-required",
      geography: "National geospatial and municipal open services",
      geographyStatus: "research-required",
      cadastre: "NAPR cadastral register",
      cadastreStatus: "restricted",
      statistics: "GeoStat census and administrative codes",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "RS",
    name: "Serbia",
    languages: ["sr-Cyrl", "sr-Latn", "en"],
    postcode: /^\d{5}$/,
    sources: {
      address: "RGZ address register",
      addressStatus: "research-required",
      postal: "Post of Serbia postal and PAK references",
      postalStatus: "research-required",
      geography: "RGZ national geospatial services",
      geographyStatus: "research-required",
      cadastre: "RGZ real-estate cadastre",
      cadastreStatus: "restricted",
      statistics: "Statistical Office of the Republic of Serbia",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "ME",
    name: "Montenegro",
    languages: ["cnr", "sr-Latn", "en"],
    postcode: /^8\d{4}$/,
    sources: {
      address: "Local address registers and Real Estate Administration",
      addressStatus: "research-required",
      postal: "Pošta Crne Gore postal-code reference",
      postalStatus: "research-required",
      geography: "National geospatial portal and municipal GIS",
      geographyStatus: "research-required",
      cadastre: "Real Estate Administration cadastre",
      cadastreStatus: "restricted",
      statistics: "MONSTAT census geography",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "MK",
    name: "North Macedonia",
    languages: ["mk", "sq", "en"],
    postcode: /^\d{4}$/,
    sources: {
      address: "Agency for Real Estate Cadastre address references",
      addressStatus: "research-required",
      postal: "Post of North Macedonia postal reference",
      postalStatus: "research-required",
      geography: "National spatial-data infrastructure",
      geographyStatus: "research-required",
      cadastre: "Agency for Real Estate Cadastre",
      cadastreStatus: "restricted",
      statistics: "State Statistical Office census geography",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "MD",
    name: "Moldova",
    languages: ["ro", "ru", "en"],
    postcode: /^MD-?\d{4}$/i,
    sources: {
      address: "ASP and local address references",
      addressStatus: "research-required",
      postal: "Poșta Moldovei postal-code directory",
      postalStatus: "research-required",
      geography: "Moldova national geoportal",
      geographyStatus: "attribution",
      cadastre: "ASP real-estate cadastre",
      cadastreStatus: "restricted",
      statistics: "National Bureau of Statistics",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "UA",
    name: "Ukraine",
    languages: ["uk", "en"],
    postcode: /^\d{5}$/,
    sources: {
      address: "National and municipal address registers",
      addressStatus: "research-required",
      postal: "Ukrposhta postal-code directory",
      postalStatus: "research-required",
      geography: "Ukraine NSDI and local open geodata",
      geographyStatus: "research-required",
      cadastre: "StateGeoCadastre parcel services",
      cadastreStatus: "restricted",
      statistics: "State Statistics Service administrative geography",
      statisticsStatus: "attribution",
      notes: "Conflict-affected records require freshness and territorial-status review.",
    },
  },
  {
    code: "AL",
    name: "Albania",
    languages: ["sq", "en"],
    postcode: /^\d{4}$/,
    sources: {
      address: "Municipal address registers",
      addressStatus: "research-required",
      postal: "Posta Shqiptare postal-code directory",
      postalStatus: "research-required",
      geography: "ASIG national geoportal",
      geographyStatus: "attribution",
      cadastre: "State Cadastre Agency",
      cadastreStatus: "restricted",
      statistics: "INSTAT census geography",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "BA",
    name: "Bosnia and Herzegovina",
    languages: ["bs", "hr", "sr-Cyrl", "sr-Latn", "en"],
    postcode: /^\d{5}$/,
    sources: {
      address: "Entity and municipal address registers",
      addressStatus: "research-required",
      postal: "BH postal operators' postal-code references",
      postalStatus: "research-required",
      geography: "Entity geodetic administrations",
      geographyStatus: "research-required",
      cadastre: "Entity land-registration and cadastral agencies",
      cadastreStatus: "restricted",
      statistics: "Agency for Statistics of Bosnia and Herzegovina",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    languages: ["ar", "en"],
    postcode: /^\d{5}$/,
    sources: {
      address: "SPL National Address",
      addressStatus: "restricted",
      postal: "SPL postal and delivery references",
      postalStatus: "restricted",
      geography: "GEOSA national geospatial services",
      geographyStatus: "research-required",
      cadastre: "Authorised municipal and real-estate records",
      cadastreStatus: "restricted",
      statistics: "GASTAT census and administrative statistics",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "QA",
    name: "Qatar",
    languages: ["ar", "en"],
    sources: {
      address: "Municipality zone/street/building addressing",
      addressStatus: "research-required",
      postal: "Qatar Post delivery and PO Box references",
      postalStatus: "restricted",
      geography: "Ministry and municipal GIS services",
      geographyStatus: "research-required",
      cadastre: "Authorised cadastral and property services",
      cadastreStatus: "restricted",
      statistics: "Planning and Statistics Authority",
      statisticsStatus: "attribution",
      notes: "Do not fabricate postcodes; domestic delivery commonly uses zone/street/building and PO Box identifiers.",
    },
  },
  {
    code: "BH",
    name: "Bahrain",
    languages: ["ar", "en"],
    sources: {
      address: "Government block/road/building addressing",
      addressStatus: "research-required",
      postal: "Bahrain Post delivery and PO Box references",
      postalStatus: "restricted",
      geography: "SLRB and national geospatial services",
      geographyStatus: "research-required",
      cadastre: "SLRB cadastral and property records",
      cadastreStatus: "restricted",
      statistics: "Information & eGovernment Authority statistics",
      statisticsStatus: "attribution",
      notes: "Treat block, road and building numbers as primary domestic identifiers.",
    },
  },
  {
    code: "OM",
    name: "Oman",
    languages: ["ar", "en"],
    postcode: /^\d{3}$/,
    sources: {
      address: "Municipal address and building references",
      addressStatus: "research-required",
      postal: "Oman Post postal-code and PO Box references",
      postalStatus: "research-required",
      geography: "National Survey Authority geospatial services",
      geographyStatus: "research-required",
      cadastre: "Ministry and municipal cadastral records",
      cadastreStatus: "restricted",
      statistics: "NCSI census and administrative statistics",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "MY",
    name: "Malaysia",
    languages: ["ms", "en", "zh-Hans", "ta"],
    postcode: /^\d{5}$/,
    sources: {
      address: "State and municipal address registers",
      addressStatus: "research-required",
      postal: "Pos Malaysia postcode reference",
      postalStatus: "research-required",
      geography: "JUPEM and PLANMalaysia geospatial services",
      geographyStatus: "research-required",
      cadastre: "State land offices and JUPEM cadastral references",
      cadastreStatus: "restricted",
      statistics: "DOSM census and administrative statistics",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "TH",
    name: "Thailand",
    languages: ["th", "en"],
    postcode: /^\d{5}$/,
    sources: {
      address: "DOPA and local administrative address references",
      addressStatus: "restricted",
      postal: "Thailand Post postcode and delivery reference",
      postalStatus: "research-required",
      geography: "GISTDA and national/municipal geospatial services",
      geographyStatus: "research-required",
      cadastre: "Department of Lands cadastral records",
      cadastreStatus: "restricted",
      statistics: "National Statistical Office census geography",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "CN",
    name: "China",
    languages: ["zh-Hans", "en"],
    postcode: /^\d{6}$/,
    sources: {
      address: "Authorised national and municipal address references",
      addressStatus: "restricted",
      postal: "China Post postcode reference",
      postalStatus: "restricted",
      geography: "Authorised MNR and municipal geospatial services",
      geographyStatus: "restricted",
      cadastre: "Authorised natural-resources and property records",
      cadastreStatus: "restricted",
      statistics: "National Bureau of Statistics administrative codes",
      statisticsStatus: "research-required",
      notes: "Observe PRC surveying, map, coordinate-system, security and cross-border data rules before ingestion or export.",
    },
  },
  {
    code: "IN",
    name: "India",
    languages: ["hi", "en"],
    postcode: /^\d{6}$/,
    sources: {
      address: "State, municipal and Digital Address/DIGIPIN-compatible references",
      addressStatus: "research-required",
      postal: "India Post PIN directory",
      postalStatus: "research-required",
      geography: "Survey of India, NSDI and state geospatial services",
      geographyStatus: "research-required",
      cadastre: "State land-record and cadastral systems",
      cadastreStatus: "restricted",
      statistics: "Census of India administrative and settlement geography",
      statisticsStatus: "research-required",
    },
  },
  {
    code: "ZA",
    name: "South Africa",
    languages: ["en", "af", "zu", "xh"],
    postcode: /^\d{4}$/,
    sources: {
      address: "Municipal address registers and national address initiatives",
      addressStatus: "research-required",
      postal: "South African Post Office postcode reference",
      postalStatus: "research-required",
      geography: "National Geo-spatial Information and municipal GIS",
      geographyStatus: "research-required",
      cadastre: "Chief Surveyor-General cadastral records",
      cadastreStatus: "restricted",
      statistics: "Stats SA census geography",
      statisticsStatus: "attribution",
    },
  },
  {
    code: "MU",
    name: "Mauritius",
    languages: ["en", "fr", "mfe"],
    postcode: /^\d{5}$/,
    sources: {
      address: "Municipal and national address references",
      addressStatus: "research-required",
      postal: "Mauritius Post postcode and delivery reference",
      postalStatus: "research-required",
      geography: "Ministry of Housing and Lands geospatial services",
      geographyStatus: "research-required",
      cadastre: "Authorised land and cadastral records",
      cadastreStatus: "restricted",
      statistics: "Statistics Mauritius census geography",
      statisticsStatus: "attribution",
    },
  },
];

export const ADDRESS_FUSION_COUNTRIES: readonly CountryFusionAdapter[] =
  COUNTRY_SPECS.map((spec) => ({
    countryCode: spec.code,
    countryName: spec.name,
    languages: spec.languages,
    postcodePattern: spec.postcode,
    clusterRadiusMeters: spec.radius ?? 35,
    sourcePlan: buildSourcePlan(spec),
  }));

const COUNTRY_BY_CODE = new Map(
  ADDRESS_FUSION_COUNTRIES.map((adapter) => [adapter.countryCode, adapter]),
);

export function getAddressFusionCountry(
  countryCode: string,
): CountryFusionAdapter | undefined {
  return COUNTRY_BY_CODE.get(countryCode.toUpperCase());
}

export function assertCompleteCountrySourcePlans(): void {
  for (const adapter of ADDRESS_FUSION_COUNTRIES) {
    const kinds = new Set(adapter.sourcePlan.map((source) => source.kind));
    const missing = KINDS.filter((kind) => !kinds.has(kind));
    if (missing.length) {
      throw new Error(
        `${adapter.countryCode} is missing source layers: ${missing.join(", ")}`,
      );
    }
  }
}
