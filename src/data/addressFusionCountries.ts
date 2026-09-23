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
  {
    code: "ID", name: "Indonesia", languages: ["id", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "BIG/BPS and local government address references", addressStatus: "research-required",
      postal: "Pos Indonesia postcode directory", postalStatus: "research-required",
      geography: "BIG national geospatial infrastructure and local GIS", geographyStatus: "research-required",
      cadastre: "ATR/BPN authorised land and parcel services", cadastreStatus: "restricted",
      statistics: "BPS census, village and administrative codes", statisticsStatus: "attribution",
      notes: "Preserve province/regency/district/village hierarchy and separate RT/RW community identifiers from postal facts.",
    },
  },
  {
    code: "PH", name: "Philippines", languages: ["fil", "en"], postcode: /^\d{4}$/,
    sources: {
      address: "LGU address registers and PSA/PSGC locality references", addressStatus: "research-required",
      postal: "PHLPost ZIP code directory", postalStatus: "research-required",
      geography: "NAMRIA, Geoportal Philippines and LGU GIS", geographyStatus: "research-required",
      cadastre: "Land Management Bureau and authorised local parcel services", cadastreStatus: "restricted",
      statistics: "PSA census and PSGC administrative hierarchy", statisticsStatus: "attribution",
      notes: "Barangay, subdivision, sitio/purok and building/unit fields must remain distinct.",
    },
  },
  {
    code: "VN", name: "Vietnam", languages: ["vi", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Provincial/municipal address and place references", addressStatus: "research-required",
      postal: "Vietnam Post national postcode directory", postalStatus: "research-required",
      geography: "National and provincial geospatial portals", geographyStatus: "research-required",
      cadastre: "Authorised land-administration and cadastral services", cadastreStatus: "restricted",
      statistics: "General Statistics Office administrative and census codes", statisticsStatus: "research-required",
      notes: "Track administrative-unit reforms and validity dates instead of overwriting historical names.",
    },
  },
  {
    code: "BD", name: "Bangladesh", languages: ["bn", "en"], postcode: /^\d{4}$/,
    sources: {
      address: "City corporation, municipality and national locality references", addressStatus: "research-required",
      postal: "Bangladesh Post postcode directory", postalStatus: "research-required",
      geography: "Survey of Bangladesh and national geospatial services", geographyStatus: "research-required",
      cadastre: "DLRS and authorised mouza/parcel records", cadastreStatus: "restricted",
      statistics: "Bangladesh Bureau of Statistics census geography", statisticsStatus: "research-required",
      notes: "Support holding, ward, mouza, village and road identifiers without inferring house numbers.",
    },
  },
  {
    code: "PK", name: "Pakistan", languages: ["ur", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Provincial and municipal address/location references", addressStatus: "research-required",
      postal: "Pakistan Post postcode directory", postalStatus: "research-required",
      geography: "Survey of Pakistan and provincial GIS portals", geographyStatus: "research-required",
      cadastre: "Provincial land-record authorities and authorised parcel systems", cadastreStatus: "restricted",
      statistics: "Pakistan Bureau of Statistics census geography", statisticsStatus: "research-required",
      notes: "Separate sector/block, village/mauza and landmark directions from verified street addressing.",
    },
  },
  {
    code: "LK", name: "Sri Lanka", languages: ["si", "ta", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Local authority and national place/address references", addressStatus: "research-required",
      postal: "Sri Lanka Post postcode directory", postalStatus: "research-required",
      geography: "Survey Department of Sri Lanka geospatial services", geographyStatus: "research-required",
      cadastre: "Survey/cadastral and authorised land-registry sources", cadastreStatus: "restricted",
      statistics: "Department of Census and Statistics geography", statisticsStatus: "research-required",
      notes: "Retain Sinhala, Tamil and English names as linked language variants, not replacements.",
    },
  },
  {
    code: "NP", name: "Nepal", languages: ["ne", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal, ward and national locality references", addressStatus: "research-required",
      postal: "Nepal Postal Services postcode directory", postalStatus: "research-required",
      geography: "Survey Department and national geospatial infrastructure", geographyStatus: "research-required",
      cadastre: "Survey/land-management authorised cadastral records", cadastreStatus: "restricted",
      statistics: "National Statistics Office census and ward geography", statisticsStatus: "research-required",
      notes: "Municipality, ward, tole and landmark components require separate confidence scores.",
    },
  },
  {
    code: "BT", name: "Bhutan", languages: ["dz", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Thromde, gewog and national locality/address references", addressStatus: "research-required",
      postal: "Bhutan Post postcode directory", postalStatus: "research-required",
      geography: "National Land Commission geospatial services", geographyStatus: "research-required",
      cadastre: "National Land Commission authorised cadastral records", cadastreStatus: "restricted",
      statistics: "National Statistics Bureau census geography", statisticsStatus: "research-required",
      notes: "Preserve dzongkhag, gewog and chiwog hierarchy and avoid inventing urban street numbers.",
    },
  },
  {
    code: "MN", name: "Mongolia", languages: ["mn", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal and national address/location references", addressStatus: "research-required",
      postal: "Mongol Post postcode directory", postalStatus: "research-required",
      geography: "ALAMGAC and national geospatial services", geographyStatus: "research-required",
      cadastre: "ALAMGAC authorised cadastral records", cadastreStatus: "restricted",
      statistics: "National Statistics Office census geography", statisticsStatus: "research-required",
      notes: "Support aimag/capital, soum/district, bag/khoroo and apartment entrance conventions.",
    },
  },
  {
    code: "KZ", name: "Kazakhstan", languages: ["kk", "ru", "en"], postcode: /^(?:\d{6}|[A-Z]\d{2}[A-Z]\d[A-Z]\d)$/i,
    sources: {
      address: "State address register and municipal address references", addressStatus: "restricted",
      postal: "Kazpost legacy and alphanumeric postcode references", postalStatus: "research-required",
      geography: "National geospatial and regional open-data services", geographyStatus: "research-required",
      cadastre: "Authorised state land-cadastre services", cadastreStatus: "restricted",
      statistics: "Bureau of National Statistics administrative geography", statisticsStatus: "research-required",
      notes: "Accept legacy six-digit and newer alphanumeric postcode forms with explicit format provenance.",
    },
  },
  {
    code: "UZ", name: "Uzbekistan", languages: ["uz-Latn", "uz-Cyrl", "ru", "en"], postcode: /^\d{6}$/,
    sources: {
      address: "National and municipal address references", addressStatus: "research-required",
      postal: "Uzbekiston Pochtasi postcode directory", postalStatus: "research-required",
      geography: "Cadastre Agency and national geospatial portals", geographyStatus: "research-required",
      cadastre: "Cadastre Agency authorised property and parcel records", cadastreStatus: "restricted",
      statistics: "Statistics Agency administrative and census geography", statisticsStatus: "research-required",
      notes: "Link Latin, Cyrillic and Russian variants while retaining the submitted script.",
    },
  },
  {
    code: "AM", name: "Armenia", languages: ["hy", "en", "ru"], postcode: /^\d{4}$/,
    sources: {
      address: "Cadastre Committee and municipal address references", addressStatus: "research-required",
      postal: "HayPost postcode directory", postalStatus: "research-required",
      geography: "Cadastre Committee and national geospatial services", geographyStatus: "research-required",
      cadastre: "Cadastre Committee authorised parcel/property records", cadastreStatus: "restricted",
      statistics: "Statistical Committee census geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "AZ", name: "Azerbaijan", languages: ["az", "en", "ru"], postcode: /^AZ\s?\d{4}$/i,
    sources: {
      address: "State and municipal address registers", addressStatus: "research-required",
      postal: "Azerpost postcode directory", postalStatus: "research-required",
      geography: "State geospatial and municipal services", geographyStatus: "research-required",
      cadastre: "Authorised State Service property/cadastral records", cadastreStatus: "restricted",
      statistics: "State Statistical Committee administrative geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "JO", name: "Jordan", languages: ["ar", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal and national building/street references", addressStatus: "research-required",
      postal: "Jordan Post postcode and PO Box references", postalStatus: "research-required",
      geography: "Royal Jordanian Geographic Centre and municipal GIS", geographyStatus: "research-required",
      cadastre: "Department of Lands and Survey authorised records", cadastreStatus: "restricted",
      statistics: "Department of Statistics census geography", statisticsStatus: "research-required",
      notes: "PO Box and landmark-led delivery must remain separate from physical-premise verification.",
    },
  },
  {
    code: "KW", name: "Kuwait", languages: ["ar", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "PACI building, block, street and unit references", addressStatus: "restricted",
      postal: "Ministry postal-code and PO Box references", postalStatus: "research-required",
      geography: "Kuwait Municipality and authorised national GIS", geographyStatus: "restricted",
      cadastre: "Kuwait Municipality/Justice authorised parcel records", cadastreStatus: "restricted",
      statistics: "PACI administrative and population statistics", statisticsStatus: "research-required",
      notes: "Civil Information Number data is not required and must never be ingested into the open address layer.",
    },
  },
  {
    code: "BN", name: "Brunei", languages: ["ms", "en"], postcode: /^[A-Z]{2}\d{4}$/i,
    sources: {
      address: "Survey Department and district/local address references", addressStatus: "research-required",
      postal: "Brunei Postal Services postcode directory", postalStatus: "research-required",
      geography: "Survey Department national geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised Land Department parcel records", cadastreStatus: "restricted",
      statistics: "Department of Economic Planning and Statistics geography", statisticsStatus: "research-required",
      notes: "Preserve kampong, mukim and district hierarchy with bilingual delivery rendering.",
    },
  },
  {
    code: "MA", name: "Morocco", languages: ["ar", "fr", "zgh", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "Barid Al-Maghrib postcode directory", postalStatus: "research-required",
      geography: "ANCFCC and national/municipal geospatial services", geographyStatus: "research-required",
      cadastre: "ANCFCC authorised cadastral and property records", cadastreStatus: "restricted",
      statistics: "HCP census and administrative geography", statisticsStatus: "research-required",
      notes: "Arabic, Tamazight and French names are parallel representations with source-specific confidence.",
    },
  },
  {
    code: "TN", name: "Tunisia", languages: ["ar", "fr", "en"], postcode: /^\d{4}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "La Poste Tunisienne postcode directory", postalStatus: "research-required",
      geography: "National mapping and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land/cadastral administration records", cadastreStatus: "restricted",
      statistics: "INS census and administrative geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "EG", name: "Egypt", languages: ["ar", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Governorate, municipal and national address references", addressStatus: "research-required",
      postal: "Egypt Post postcode directory", postalStatus: "research-required",
      geography: "Egyptian Survey Authority and national geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised surveying and real-estate registration records", cadastreStatus: "restricted",
      statistics: "CAPMAS census and administrative geography", statisticsStatus: "research-required",
      notes: "Informal-area, landmark and building-name evidence must be retained without fabricated street numbers.",
    },
  },
  {
    code: "KE", name: "Kenya", languages: ["sw", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "County address registers and national locality references", addressStatus: "research-required",
      postal: "Postal Corporation of Kenya postcode/PO Box reference", postalStatus: "research-required",
      geography: "Survey of Kenya, counties and national open-data GIS", geographyStatus: "research-required",
      cadastre: "ArdhiSasa and authorised land-registry/parcel services", cadastreStatus: "restricted",
      statistics: "KNBS census and sub-location geography", statisticsStatus: "research-required",
      notes: "PO Box, physical premise, estate, village and landmark addresses require separate delivery modes.",
    },
  },
  {
    code: "GH", name: "Ghana", languages: ["en"], postcode: /^[A-Z]{2}-?\d{3,4}-?\d{4}$/i,
    sources: {
      address: "GhanaPost GPS-compatible digital address references", addressStatus: "restricted",
      postal: "Ghana Post postcode/digital-address reference", postalStatus: "restricted",
      geography: "Lands Commission, Survey and Mapping Division and local GIS", geographyStatus: "research-required",
      cadastre: "Lands Commission authorised title and parcel records", cadastreStatus: "restricted",
      statistics: "Ghana Statistical Service census geography", statisticsStatus: "research-required",
      notes: "Digital addresses and conventional street addresses are linked identifiers, not interchangeable text.",
    },
  },
  {
    code: "RW", name: "Rwanda", languages: ["rw", "en", "fr"], 
    sources: {
      address: "City/district street and village address references", addressStatus: "research-required",
      postal: "Iposita postal and PO Box delivery references", postalStatus: "research-required",
      geography: "Rwanda Land Management and Use Authority geospatial services", geographyStatus: "research-required",
      cadastre: "National Land Authority authorised parcel records", cadastreStatus: "restricted",
      statistics: "NISR census and administrative geography", statisticsStatus: "research-required",
      notes: "Do not fabricate postcodes where structured administrative and geospatial addressing is used.",
    },
  },
  {
    code: "NA", name: "Namibia", languages: ["en", "af", "de"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal address registers and national locality references", addressStatus: "research-required",
      postal: "NamPost postcode and PO Box reference", postalStatus: "research-required",
      geography: "Directorate of Survey and Mapping and municipal GIS", geographyStatus: "research-required",
      cadastre: "Authorised deeds, survey and parcel records", cadastreStatus: "restricted",
      statistics: "Namibia Statistics Agency census geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "BW", name: "Botswana", languages: ["en", "tn"], 
    sources: {
      address: "Council and national settlement/address references", addressStatus: "research-required",
      postal: "BotswanaPost PO Box and delivery references", postalStatus: "research-required",
      geography: "Department of Surveys and Mapping geospatial services", geographyStatus: "research-required",
      cadastre: "Department of Lands authorised cadastral records", cadastreStatus: "restricted",
      statistics: "Statistics Botswana census geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; plot, ward, village and PO Box components remain explicit.",
    },
  },
  {
    code: "ZM", name: "Zambia", languages: ["en"], postcode: /^\d{5}$/,
    sources: {
      address: "Council and national locality/address references", addressStatus: "research-required",
      postal: "ZamPost postcode and PO Box reference", postalStatus: "research-required",
      geography: "Survey Department and national geospatial services", geographyStatus: "research-required",
      cadastre: "Ministry of Lands authorised parcel/cadastral records", cadastreStatus: "restricted",
      statistics: "ZamStats census and administrative geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "ZW", name: "Zimbabwe", languages: ["en", "sn", "nd"], 
    sources: {
      address: "Local authority and national locality/address references", addressStatus: "research-required",
      postal: "ZimPost delivery and PO Box references", postalStatus: "research-required",
      geography: "Surveyor-General and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised deeds and cadastral survey records", cadastreStatus: "restricted",
      statistics: "ZIMSTAT census geography", statisticsStatus: "research-required",
      notes: "Do not invent postcodes; stand/lot, suburb, township and PO Box models remain distinct.",
    },
  },
  {
    code: "TZ", name: "Tanzania", languages: ["sw", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "National physical address and local-government references", addressStatus: "research-required",
      postal: "Tanzania Posts postcode/NAPA references", postalStatus: "research-required",
      geography: "Ministry of Lands and local-government geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land-registration and parcel records", cadastreStatus: "restricted",
      statistics: "National Bureau of Statistics census geography", statisticsStatus: "research-required",
      notes: "NAPA identifiers, conventional text and coordinates should be linked with independent provenance.",
    },
  },
  {
    code: "UG", name: "Uganda", languages: ["en", "sw"], 
    sources: {
      address: "KCCA, local-government and national address references", addressStatus: "research-required",
      postal: "Posta Uganda delivery and PO Box references", postalStatus: "research-required",
      geography: "Department of Surveys and Mapping and local GIS", geographyStatus: "research-required",
      cadastre: "Uganda Land Information System authorised records", cadastreStatus: "restricted",
      statistics: "UBOS census and administrative geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; division/parish/village, plot and landmark evidence remain explicit.",
    },
  },
  {
    code: "SN", name: "Senegal", languages: ["fr", "wo", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "La Poste Sénégal postcode and delivery reference", postalStatus: "research-required",
      geography: "ANAT, DTGC and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "DGID/DTGC authorised cadastral references", cadastreStatus: "restricted",
      statistics: "ANSD census and administrative geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "CV", name: "Cabo Verde", languages: ["pt", "kea", "en"], postcode: /^\d{4}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "Correios de Cabo Verde postcode and delivery reference", postalStatus: "research-required",
      geography: "INGT and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised national/municipal cadastral records", cadastreStatus: "restricted",
      statistics: "INE Cabo Verde census geography", statisticsStatus: "research-required",
      notes: "Island, municipality, parish, locality and street components require island-aware clustering.",
    },
  },
  {
    code: "PE", name: "Peru", languages: ["es-PE", "qu", "ay", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal address/nomenclature and national locality references", addressStatus: "research-required",
      postal: "MTC national postcode reference", postalStatus: "research-required",
      geography: "IGN Peru, GeoPerú and municipal open GIS", geographyStatus: "research-required",
      cadastre: "COFOPRI, SUNARP and municipal authorised cadastral records", cadastreStatus: "restricted",
      statistics: "INEI census and UBIGEO geography", statisticsStatus: "attribution",
      notes: "Native-language locality names and kilometre-route addresses need source-linked parallel forms.",
    },
  },
  {
    code: "EC", name: "Ecuador", languages: ["es-EC", "qu", "en"], postcode: /^\d{6}$/,
    sources: {
      address: "Municipal cadastre/address and national locality references", addressStatus: "research-required",
      postal: "National postal-code reference", postalStatus: "research-required",
      geography: "IGM Ecuador and national/municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Municipal cadastre and authorised property records", cadastreStatus: "restricted",
      statistics: "INEC census and DPA geography", statisticsStatus: "attribution",
    },
  },
  {
    code: "PY", name: "Paraguay", languages: ["es-PY", "gn", "en"], postcode: /^\d{4}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "DINACOPA postcode and delivery reference", postalStatus: "research-required",
      geography: "DISERGEMIL and national/municipal geospatial services", geographyStatus: "research-required",
      cadastre: "National Cadastre Service and municipal authorised records", cadastreStatus: "restricted",
      statistics: "INE Paraguay census geography", statisticsStatus: "research-required",
      notes: "Spanish and Guaraní names are retained as linked official/local variants.",
    },
  },
  {
    code: "DO", name: "Dominican Republic", languages: ["es-DO", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "INPOSDOM postcode and delivery reference", postalStatus: "research-required",
      geography: "National Geographic Institute and municipal GIS", geographyStatus: "research-required",
      cadastre: "National Cadastre and authorised parcel/property records", cadastreStatus: "restricted",
      statistics: "ONE census and administrative geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "JM", name: "Jamaica", languages: ["en"], 
    sources: {
      address: "Municipal, parish and national locality/address references", addressStatus: "research-required",
      postal: "Jamaica Post delivery-zone and PO Box references", postalStatus: "research-required",
      geography: "National Land Agency geospatial services", geographyStatus: "research-required",
      cadastre: "National Land Agency authorised cadastral/title records", cadastreStatus: "restricted",
      statistics: "STATIN census and enumeration geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; parish, community, postal agency and PO Box are explicit fields.",
    },
  },
  {
    code: "TT", name: "Trinidad and Tobago", languages: ["en"], postcode: /^\d{6}$/,
    sources: {
      address: "Municipal and national address/locality references", addressStatus: "research-required",
      postal: "TTPost six-digit postal-code and delivery reference", postalStatus: "research-required",
      geography: "Land and Surveys Division and national geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land-registry and cadastral survey records", cadastreStatus: "restricted",
      statistics: "Central Statistical Office census geography", statisticsStatus: "research-required",
      notes: "Treat Trinidad and Tobago island geography and legacy delivery zones as versioned evidence.",
    },
  },
  {
    code: "DZ", name: "Algeria", languages: ["ar", "fr", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "Algérie Poste postcode directory", postalStatus: "research-required",
      geography: "INCT and national/municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised national cadastral and land records", cadastreStatus: "restricted",
      statistics: "ONS census and administrative geography", statisticsStatus: "research-required",
      notes: "Arabic and French locality/street names remain linked source variants.",
    },
  },
  {
    code: "LY", name: "Libya", languages: ["ar", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "Libya Post postcode and PO Box references", postalStatus: "research-required",
      geography: "Survey of Libya and municipal geospatial references", geographyStatus: "research-required",
      cadastre: "Authorised land-registry and cadastral records", cadastreStatus: "restricted",
      statistics: "Bureau of Statistics and Census geography", statisticsStatus: "research-required",
      notes: "Source dates, conflict impacts and territorial authority must be versioned.",
    },
  },
  {
    code: "ET", name: "Ethiopia", languages: ["am", "om", "en"], postcode: /^\d{4}$/,
    sources: {
      address: "City administration and national locality references", addressStatus: "research-required",
      postal: "Ethiopost postcode and PO Box references", postalStatus: "research-required",
      geography: "Ethiopian Geospatial Institute and regional GIS", geographyStatus: "research-required",
      cadastre: "Federal/regional authorised urban and rural land records", cadastreStatus: "restricted",
      statistics: "Ethiopian Statistics Service census geography", statisticsStatus: "research-required",
      notes: "Region, zone, woreda, kebele, building and landmark evidence must be scored separately.",
    },
  },
  {
    code: "MZ", name: "Mozambique", languages: ["pt", "en"], postcode: /^\d{4}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "Correios de Moçambique postcode/PO Box references", postalStatus: "research-required",
      geography: "CENACARTA and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land and DUAT-related spatial records", cadastreStatus: "restricted",
      statistics: "INE Mozambique census geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "MG", name: "Madagascar", languages: ["mg", "fr", "en"], postcode: /^\d{3}$/,
    sources: {
      address: "Commune and national locality/address references", addressStatus: "research-required",
      postal: "Paositra Malagasy postcode reference", postalStatus: "research-required",
      geography: "FTM national mapping and local GIS", geographyStatus: "research-required",
      cadastre: "Authorised land and cadastral administration records", cadastreStatus: "restricted",
      statistics: "INSTAT Madagascar census geography", statisticsStatus: "research-required",
      notes: "Fokontany and commune hierarchy is required before road/building confidence can rise.",
    },
  },
  {
    code: "MW", name: "Malawi", languages: ["en", "ny"], postcode: /^\d{6}$/,
    sources: {
      address: "Council and national locality/address references", addressStatus: "research-required",
      postal: "Malawi Posts postcode and PO Box references", postalStatus: "research-required",
      geography: "Surveys Department and council geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land-registry and cadastral records", cadastreStatus: "restricted",
      statistics: "National Statistical Office census geography", statisticsStatus: "research-required",
      notes: "Postcode format support remains provisional until an authoritative release is connected.",
    },
  },
  {
    code: "AO", name: "Angola", languages: ["pt", "en"],
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "Correios de Angola delivery and PO Box references", postalStatus: "research-required",
      geography: "IGCA and provincial/municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land and cadastral administration records", cadastreStatus: "restricted",
      statistics: "INE Angola census geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; administrative, road, landmark and coordinates drive confidence.",
    },
  },
  {
    code: "CM", name: "Cameroon", languages: ["fr", "en"], 
    sources: {
      address: "Council and national locality/address references", addressStatus: "research-required",
      postal: "CAMPOST delivery and PO Box references", postalStatus: "research-required",
      geography: "INC Cameroon and council geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised domains/cadastre and land records", cadastreStatus: "restricted",
      statistics: "BUCREP census and administrative geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; bilingual locality and street variants remain linked.",
    },
  },
  {
    code: "CI", name: "Côte d’Ivoire", languages: ["fr", "en"],
    sources: {
      address: "District/commune and national locality references", addressStatus: "research-required",
      postal: "La Poste de Côte d’Ivoire delivery/PO Box references", postalStatus: "research-required",
      geography: "CNTIG and local-government geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised cadastre and land-administration records", cadastreStatus: "restricted",
      statistics: "INS Côte d’Ivoire census geography", statisticsStatus: "research-required",
      notes: "Postal boxes and physical premises are separate targets; no postcode is invented.",
    },
  },
  {
    code: "BJ", name: "Benin", languages: ["fr", "en"],
    sources: {
      address: "Commune and national locality/address references", addressStatus: "research-required",
      postal: "La Poste du Bénin delivery/PO Box references", postalStatus: "research-required",
      geography: "IGN Bénin and commune geospatial services", geographyStatus: "research-required",
      cadastre: "ANDF and authorised land/cadastral records", cadastreStatus: "restricted",
      statistics: "INStaD census and administrative geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; arrondissement, village/quartier and coordinates are primary.",
    },
  },
  {
    code: "TG", name: "Togo", languages: ["fr", "en"],
    sources: {
      address: "Commune and national locality/address references", addressStatus: "research-required",
      postal: "La Poste du Togo delivery/PO Box references", postalStatus: "research-required",
      geography: "National mapping and commune geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land/cadastral administration records", cadastreStatus: "restricted",
      statistics: "INSEED census and administrative geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; locality and building coordinates are confidence inputs.",
    },
  },
  {
    code: "GA", name: "Gabon", languages: ["fr", "en"],
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "La Poste SA delivery/PO Box references", postalStatus: "research-required",
      geography: "INC Gabon and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised cadastre and land-registry records", cadastreStatus: "restricted",
      statistics: "DGSEE census and administrative geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed.",
    },
  },
  {
    code: "CG", name: "Republic of the Congo", languages: ["fr", "ln", "en"],
    sources: {
      address: "Commune/district and national locality references", addressStatus: "research-required",
      postal: "SOPECO delivery and PO Box references", postalStatus: "research-required",
      geography: "National mapping and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land/cadastral administration records", cadastreStatus: "restricted",
      statistics: "INS Congo census geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; Congo-Brazzaville identity must remain distinct from CD.",
    },
  },
  {
    code: "CD", name: "Democratic Republic of the Congo", languages: ["fr", "ln", "sw", "kg", "lu", "en"],
    sources: {
      address: "City/territory and national locality references", addressStatus: "research-required",
      postal: "SCPT delivery and PO Box references", postalStatus: "research-required",
      geography: "National geographic institute and provincial/municipal GIS", geographyStatus: "research-required",
      cadastre: "Authorised land/cadastral administration records", cadastreStatus: "restricted",
      statistics: "INS DRC census and administrative geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; multilingual and conflict-affected source versions are retained.",
    },
  },
  {
    code: "LS", name: "Lesotho", languages: ["st", "en"], postcode: /^\d{3}$/,
    sources: {
      address: "Council and national locality/address references", addressStatus: "research-required",
      postal: "Lesotho Post postcode and PO Box references", postalStatus: "research-required",
      geography: "Lands, Surveys and Physical Planning geospatial services", geographyStatus: "research-required",
      cadastre: "Land Administration Authority authorised records", cadastreStatus: "restricted",
      statistics: "Bureau of Statistics census geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "SZ", name: "Eswatini", languages: ["ss", "en"], postcode: /^[A-Z]\d{3}$/i,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "Eswatini Posts postcode and PO Box references", postalStatus: "research-required",
      geography: "Surveyor General and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised deeds and cadastral survey records", cadastreStatus: "restricted",
      statistics: "Central Statistical Office census geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "DJ", name: "Djibouti", languages: ["fr", "ar", "so", "aa", "en"],
    sources: {
      address: "Commune and national locality/address references", addressStatus: "research-required",
      postal: "La Poste de Djibouti delivery/PO Box references", postalStatus: "research-required",
      geography: "DATUH and national/commune geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land/cadastral administration records", cadastreStatus: "restricted",
      statistics: "INSD census and administrative geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; multilingual locality evidence is preserved.",
    },
  },
  {
    code: "MR", name: "Mauritania", languages: ["ar", "fr", "en"],
    sources: {
      address: "Commune and national locality/address references", addressStatus: "research-required",
      postal: "Mauripost delivery and PO Box references", postalStatus: "research-required",
      geography: "National mapping and commune geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land/cadastral administration records", cadastreStatus: "restricted",
      statistics: "ANSADE census and administrative geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed.",
    },
  },
  {
    code: "GM", name: "The Gambia", languages: ["en"],
    sources: {
      address: "Council and national locality/address references", addressStatus: "research-required",
      postal: "GAMPOST delivery and PO Box references", postalStatus: "research-required",
      geography: "Department of Lands and Surveys geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land and cadastral survey records", cadastreStatus: "restricted",
      statistics: "Gambia Bureau of Statistics census geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed.",
    },
  },
  {
    code: "GN", name: "Guinea", languages: ["fr", "en"],
    sources: {
      address: "Commune and national locality/address references", addressStatus: "research-required",
      postal: "Guinean postal delivery and PO Box references", postalStatus: "research-required",
      geography: "National geographic institute and commune GIS", geographyStatus: "research-required",
      cadastre: "Authorised land/cadastral administration records", cadastreStatus: "restricted",
      statistics: "INS Guinea census geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed.",
    },
  },
  {
    code: "SL", name: "Sierra Leone", languages: ["en"],
    sources: {
      address: "Council and national locality/address references", addressStatus: "research-required",
      postal: "SALPOST delivery and PO Box references", postalStatus: "research-required",
      geography: "Surveys and Lands Division and council GIS", geographyStatus: "research-required",
      cadastre: "Authorised land-registry and cadastral records", cadastreStatus: "restricted",
      statistics: "Statistics Sierra Leone census geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed.",
    },
  },
  {
    code: "LR", name: "Liberia", languages: ["en"],
    sources: {
      address: "City/county and national locality/address references", addressStatus: "research-required",
      postal: "Ministry postal delivery and PO Box references", postalStatus: "research-required",
      geography: "Liberia Land Authority and national geospatial services", geographyStatus: "research-required",
      cadastre: "Liberia Land Authority authorised parcel records", cadastreStatus: "restricted",
      statistics: "LISGIS census and administrative geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed.",
    },
  },
  {
    code: "SD", name: "Sudan", languages: ["ar", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "State/municipal and national locality references", addressStatus: "research-required",
      postal: "Sudan Post postcode and PO Box references", postalStatus: "research-required",
      geography: "Sudan Survey Authority and state geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land/cadastral administration records", cadastreStatus: "restricted",
      statistics: "Central Bureau of Statistics administrative geography", statisticsStatus: "research-required",
      notes: "Conflict, displacement and administrative-change dates are mandatory provenance.",
    },
  },
  {
    code: "KG", name: "Kyrgyzstan", languages: ["ky", "ru", "en"], postcode: /^\d{6}$/,
    sources: {
      address: "State and municipal address-register references", addressStatus: "research-required",
      postal: "Kyrgyz Post postcode directory", postalStatus: "research-required",
      geography: "State cartography/cadastre and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised state land-cadastre records", cadastreStatus: "restricted",
      statistics: "National Statistical Committee census geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "TJ", name: "Tajikistan", languages: ["tg", "ru", "en"], postcode: /^\d{6}$/,
    sources: {
      address: "State and municipal locality/address references", addressStatus: "research-required",
      postal: "Tajik Post postcode directory", postalStatus: "research-required",
      geography: "State land-management/geodesy and municipal GIS", geographyStatus: "research-required",
      cadastre: "Authorised state land/cadastral records", cadastreStatus: "restricted",
      statistics: "Agency on Statistics census geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "LA", name: "Laos", languages: ["lo", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "District/village and national locality/address references", addressStatus: "research-required",
      postal: "Lao Post postcode directory", postalStatus: "research-required",
      geography: "National Geographic Department and provincial GIS", geographyStatus: "research-required",
      cadastre: "Authorised land-management and cadastral records", cadastreStatus: "restricted",
      statistics: "Lao Statistics Bureau census geography", statisticsStatus: "research-required",
      notes: "Province, district, village, road and building levels remain separately scored.",
    },
  },
  {
    code: "KH", name: "Cambodia", languages: ["km", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Commune/sangkat and municipal address references", addressStatus: "research-required",
      postal: "Cambodia Post postcode directory", postalStatus: "research-required",
      geography: "MLMUPC and national/municipal geospatial services", geographyStatus: "research-required",
      cadastre: "MLMUPC authorised cadastral and parcel records", cadastreStatus: "restricted",
      statistics: "National Institute of Statistics census geography", statisticsStatus: "research-required",
      notes: "Phum, khum/sangkat, district/khan and province hierarchy is validated before roads.",
    },
  },
  {
    code: "TL", name: "Timor-Leste", languages: ["tet", "pt", "en"],
    sources: {
      address: "Municipality, administrative-post and suco references", addressStatus: "research-required",
      postal: "Correios de Timor-Leste delivery/PO Box references", postalStatus: "research-required",
      geography: "DNTPSC and national/municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised national land/cadastral records", cadastreStatus: "restricted",
      statistics: "Statistics Timor-Leste census geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; suco/aldeia hierarchy and coordinates drive confidence.",
    },
  },
  {
    code: "IQ", name: "Iraq", languages: ["ar", "ku", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Governorate/municipal and national address references", addressStatus: "research-required",
      postal: "Iraqi Post postcode and PO Box references", postalStatus: "research-required",
      geography: "National and governorate geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land-registration and cadastral records", cadastreStatus: "restricted",
      statistics: "CSO/KRSO census and administrative geography", statisticsStatus: "research-required",
      notes: "Federal and Kurdistan Region authorities and validity dates remain explicit provenance.",
    },
  },
  {
    code: "LB", name: "Lebanon", languages: ["ar", "fr", "en"], postcode: /^\d{4}(?:\s?\d{4})?$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "LibanPost postcode and delivery reference", postalStatus: "research-required",
      geography: "CNRS-L and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Directorate of Geographic Affairs/cadastre authorised records", cadastreStatus: "restricted",
      statistics: "Central Administration of Statistics geography", statisticsStatus: "research-required",
      notes: "Four- and eight-digit postal forms retain format provenance.",
    },
  },
  {
    code: "IR", name: "Iran", languages: ["fa", "en"], postcode: /^\d{5}-?\d{5}$/,
    sources: {
      address: "National address/location system and municipal references", addressStatus: "restricted",
      postal: "National Post Company ten-digit postcode reference", postalStatus: "restricted",
      geography: "National Cartographic Center and municipal geospatial services", geographyStatus: "restricted",
      cadastre: "Authorised national land/cadastral records", cadastreStatus: "restricted",
      statistics: "Statistical Centre of Iran administrative geography", statisticsStatus: "research-required",
      notes: "Security, sanctions, access and cross-border data rules require review before any connector is enabled.",
    },
  },
  {
    code: "PS", name: "Palestine", languages: ["ar", "en"],
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "Palestine Post postcode/delivery references", postalStatus: "research-required",
      geography: "Ministry of Local Government and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Palestinian Land Authority authorised records", cadastreStatus: "restricted",
      statistics: "PCBS census and administrative geography", statisticsStatus: "research-required",
      notes: "Postal-code syntax is not asserted until an authoritative machine-readable release is connected.",
    },
  },
  {
    code: "BO", name: "Bolivia", languages: ["es-BO", "qu", "ay", "gn", "en"],
    sources: {
      address: "Municipal address/nomenclature and national locality references", addressStatus: "research-required",
      postal: "Postal operator delivery and PO Box references", postalStatus: "research-required",
      geography: "IGM Bolivia and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "INRA and municipal authorised cadastral records", cadastreStatus: "restricted",
      statistics: "INE Bolivia census and administrative geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; zone, OTB/community, road and coordinates are explicit.",
    },
  },
  {
    code: "GT", name: "Guatemala", languages: ["es-GT", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "Guatemala postal-code and delivery reference", postalStatus: "research-required",
      geography: "IGN Guatemala and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Registro de Información Catastral authorised records", cadastreStatus: "restricted",
      statistics: "INE Guatemala census geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "SV", name: "El Salvador", languages: ["es-SV", "en"], postcode: /^\d{4}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "Correos de El Salvador postcode/delivery reference", postalStatus: "research-required",
      geography: "CNR national geospatial and municipal services", geographyStatus: "research-required",
      cadastre: "CNR authorised cadastral/property records", cadastreStatus: "restricted",
      statistics: "ONEC census and administrative geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "HN", name: "Honduras", languages: ["es-HN", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal and national locality/address references", addressStatus: "research-required",
      postal: "HONDUCOR postcode/delivery reference", postalStatus: "research-required",
      geography: "Instituto de la Propiedad and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Instituto de la Propiedad authorised cadastral records", cadastreStatus: "restricted",
      statistics: "INE Honduras census geography", statisticsStatus: "research-required",
    },
  },
  {
    code: "NI", name: "Nicaragua", languages: ["es-NI", "en"], postcode: /^\d{5}$/,
    sources: {
      address: "Municipal direction-based and national locality references", addressStatus: "research-required",
      postal: "Correos de Nicaragua postcode/delivery reference", postalStatus: "research-required",
      geography: "INETER and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "INETER/municipal authorised cadastral records", cadastreStatus: "restricted",
      statistics: "INIDE census and administrative geography", statisticsStatus: "research-required",
      notes: "Landmark-relative directions are structured observations and must not be converted into invented street numbers.",
    },
  },
  {
    code: "GY", name: "Guyana", languages: ["en"],
    sources: {
      address: "Municipal/NDC and national locality/address references", addressStatus: "research-required",
      postal: "Guyana Post delivery and PO Box references", postalStatus: "research-required",
      geography: "Guyana Lands and Surveys Commission geospatial services", geographyStatus: "research-required",
      cadastre: "GLSC and authorised deeds/parcel records", cadastreStatus: "restricted",
      statistics: "Bureau of Statistics census geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; region, neighbourhood, lot and coordinates are explicit.",
    },
  },
  {
    code: "SR", name: "Suriname", languages: ["nl", "en"],
    sources: {
      address: "District/resort and national locality/address references", addressStatus: "research-required",
      postal: "SURPOST delivery and PO Box references", postalStatus: "research-required",
      geography: "MI-GLIS and district geospatial services", geographyStatus: "research-required",
      cadastre: "MI-GLIS authorised land/cadastral records", cadastreStatus: "restricted",
      statistics: "General Bureau of Statistics census geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed.",
    },
  },
  {
    code: "FJ", name: "Fiji", languages: ["en", "fj", "hif"],
    sources: {
      address: "Municipal, island and national locality/address references", addressStatus: "research-required",
      postal: "Post Fiji delivery and PO Box references", postalStatus: "research-required",
      geography: "Department of Lands and municipal geospatial services", geographyStatus: "research-required",
      cadastre: "Authorised land and cadastral survey records", cadastreStatus: "restricted",
      statistics: "Fiji Bureau of Statistics census geography", statisticsStatus: "research-required",
      notes: "No nationwide postcode is assumed; island-aware locality, settlement and coordinates drive confidence.",
    },
  },
  {
    code: "PG", name: "Papua New Guinea", languages: ["en", "tpi", "ho"], postcode: /^\d{3}$/,
    sources: {
      address: "Provincial, district and national locality/address references", addressStatus: "research-required",
      postal: "Post PNG postcode and PO Box references", postalStatus: "research-required",
      geography: "National Mapping Bureau and provincial geospatial services", geographyStatus: "research-required",
      cadastre: "Department of Lands authorised parcel/cadastral records", cadastreStatus: "restricted",
      statistics: "National Statistical Office census geography", statisticsStatus: "research-required",
      notes: "Province, district, LLG, ward, village and PO Box components are independently validated.",
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
