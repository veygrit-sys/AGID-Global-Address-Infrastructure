import bounds from '../../scripts/data/europe-complex-borders/windows.json';
import bavaria from '../data/europe-border-surveys/jungholz-bavaria.json';
import bev from '../data/europe-border-surveys/jungholz-bev.json';
import bih from '../data/europe-border-surveys/medjurecje-bih.json';
import serbia from '../data/europe-border-surveys/medjurecje-srb.json';
import physical from '../data/europe-border-surveys/physical.json';
import cadgis from '../data/europe-border-surveys/vennbahn-cadgis.json';
import nrw from '../data/europe-border-surveys/vennbahn-nrw.json';
import { classifyMapPolygon, indexMapPolygon, overlapsWrappedMapBounds } from './indexedMapPolygon';
import { unpackMapRing } from './packedMapRing';
import type { ReviewedShorelineMatch } from './reviewedShorelines';
import type { TerritorialExclaveFeature, TerritorialExclaveMatch } from './territorialExclaves';

interface PackedShape { bbox: number[]; rings: string[]; site?: string }
interface PhysicalShape extends PackedShape { kind: string; level: number; source?: string }

function prepare<T extends PackedShape>(feature: T) {
  let rings: number[][][] | undefined;
  const polygon = { bbox: feature.bbox, get rings() { return rings ??= feature.rings.map(r => unpackMapRing(r, 1e7)); } };
  return { ...feature, polygon, indexed: indexMapPolygon(polygon) };
}
function partition(inside: string, outside: string, shapes: PackedShape[]) {
  return { inside, outside, shapes: shapes.map(prepare) };
}

const terrain = {
  source: 'gshhg-full', version: '2.3.7', attribution: 'GSHHG © Paul Wessel and Walter H. F. Smith.',
  evidenceUrl: 'https://www.soest.hawaii.edu/pwessel/gshhg/',
};
const waterCover = {
  evidenceUrl: 'https://esa-worldcover.org/en/data-access',
  source: 'esa-worldcover-water', version: '2021 v200',
  attribution: '© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021), processed by ESA WorldCover consortium (CC BY 4.0).',
};
const nrwHydro = {
  evidenceUrl: 'https://www.wfs.nrw.de/geobasis/wfs_nw_inspire-gewaesser-physisch_atkis-basis-dlm?SERVICE=WFS&REQUEST=GetCapabilities',
  source: 'nrw-atkis-physical-waters', version: 'INSPIRE ATKIS Basis-DLM, 2026-11-26', attribution: 'Land NRW, Geobasis NRW, ATKIS Basis-DLM.',
};
function surfaceSource(id?: string) {
  if (id === 'worldcover') return waterCover;
  if (id === 'nrw-hydro') return nrwHydro;
  return terrain;
}

const surveys = [
  {
    id: 'vennbahn', bbox: bounds.vennbahn, surface: physical.vennbahn,
    source: 'vennbahn-cadgis-nrw', version: 'Belgian CadGIS 2026; Geobasis NRW DVG1 2025-11-12',
    attribution: 'FPS Finance / GAPD, Belgian CadGIS (CC BY 4.0). Land NRW, Geobasis NRW.',
    evidenceUrls: ['https://finances.belgium.be/fr/experts-partenaires/donnees-ouvertes-patrimoine/jeux-donnees/unites-administratives',
      'https://www.opengeodata.nrw.de/produkte/geobasis/vkg/dvg/dvg1/',
      'https://geonames.nga.mil/geonames/GNSSearch/GNSDocs/policies/Belgium_Country_Policy_webversion_Latest.pdf'],
    partitions: [partition('DE', 'BE', nrw), partition('BE', 'DE', cadgis)],
    sites: [
      ['muensterbildchen', 'Münsterbildchen', 'ミュンスタービルトヒェン'],
      ['roetgener-wald', 'Roetgener Wald', 'レートゲナー・ヴァルト'],
      ['rueckschlag', 'Rückschlag', 'リュックシュラーク'],
      ['muetzenich', 'Mützenich', 'ミュッツェニヒ'],
      ['ruitzhof', 'Ruitzhof', 'ルイツホーフ'],
    ],
  }, {
    id: 'jungholz', bbox: bounds.jungholz, surface: physical.jungholz,
    source: 'jungholz-bev-bavaria', version: 'BEV VGD 2026-04-01, GIS-Grid 2021; Bavarian ALKIS 2026-10-31',
    attribution: '© BEV 2026 (CC BY 4.0). Datenquelle: Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0).',
    evidenceUrls: ['https://doi.org/10.48677/2d7b8f24-deb9-42eb-82f2-c7c1c7ff7075',
      'https://www.ldbv.bayern.de/produkte/liegenschaftsinformationen/verwalt_grenzen.html',
      'https://tirolatlas.uibk.ac.at/wsgi/places/show?id=170818&lang=de'],
    partitions: [partition('AT', 'DE', bev), partition('DE', 'AT', bavaria)],
    sites: [['jungholz', 'Jungholz', 'ユングホルツ']],
  }, {
    id: 'medjurecje', bbox: bounds.medjurecje, surface: physical.medjurecje,
    source: 'medjurecje-geoboundaries', version: 'geoBoundaries BIH-ADM0-45210373 (2013), SRB-ADM0-94879208 (2017)',
    attribution: 'geoBoundaries. Bosnia outline: Wikimedia Commons (public domain). Serbian ring: © OpenStreetMap contributors / Wambacher (ODbL 1.0).',
    evidenceUrls: ['https://www.geoboundaries.org/api/current/gbOpen/BIH/ADM0/', 'https://www.geoboundaries.org/api/current/gbOpen/SRB/ADM0/',
      'https://www.openstreetmap.org/copyright', 'https://doiserbia.nb.rs/Article.aspx?id=0350-75990757325C'],
    // Both are closed boundaries of the same enclave: its detached Bosnian
    // polygon in one edition and the hole in the Serbian country in the other.
    partitions: [partition('BA', 'RS', serbia), partition('BA', 'RS', bih)],
    sites: [['medjurecje', 'Međurečje (Sastavci)', 'メジュレチェ（サスタヴツィ）']],
  },
].map(s => ({ ...s, surface: (s.surface as PhysicalShape[]).map(prepare) }));
type Survey = typeof surveys[number];

export const europeanBorderWindows = surveys.map(({ id, bbox }) => ({ id, bbox }));
export const isEuropeanBorderSource = (id: string) => surveys.some(s => s.source === id);

function metadata({ source, version, attribution, evidenceUrls }: Survey) {
  return { source, version, attribution, evidenceUrls: [...evidenceUrls] };
}

export const europeanBorderTerritories: TerritorialExclaveFeature[] = surveys.flatMap(s => s.sites.map(([id, name, nameJa]) => ({
  ...metadata(s), id, name, nameJa, kind: id === 'jungholz' ? 'point-connected' as const : 'enclave' as const,
  code: s.partitions[0].inside, neighboringCodes: [s.partitions[0].outside], physicalDomain: 'mainland' as const,
})));
const territories = new Map(europeanBorderTerritories.map(t => [t.id, t]));

function contains(bbox: number[], lat: number, lon: number) {
  return bbox[0] <= lon && bbox[1] <= lat && lon <= bbox[2] && lat <= bbox[3];
}
// Each partition covers a verified two-country window. The surrounding country
// is only inferred inside this window; the expanded polygon clip lies beyond it.
function administration(survey: Survey, lat: number, lon: number) {
  const codes = new Set<string>();
  const votes = new Set<string>();
  let site: string | undefined;
  let onLine = false;
  for (const { inside, outside, shapes } of survey.partitions) {
    let interior = false, boundary = false;
    for (const shape of shapes) {
      const hit = classifyMapPolygon(lon, lat, shape.indexed);
      if (hit === 'outside') continue;
      interior ||= hit === 'inside';
      boundary ||= hit === 'boundary';
      site ??= shape.site;
    }
    const vote = interior || boundary ? inside : outside;
    codes.add(vote);
    if (!interior && boundary) { codes.add(outside); onLine = true; }
    else votes.add(vote);
  }
  return { codes: [...codes].sort(), site, disagreement: votes.size > 1, relation: onLine || codes.size > 1 ? 'boundary' as const : 'inside' as const };
}

export function matchEuropeanBorderAdministration(lat: number, lon: number) {
  const s = surveys.find(w => contains(w.bbox, lat, lon));
  if (!s) return;
  const { codes, relation, site, disagreement } = administration(s, lat, lon);
  return { ...metadata(s), codes, relation, site, disagreement };
}

function surfaceAt(s: Survey, lat: number, lon: number) {
  let selected: { kind: string; level: number; edge: boolean; source?: string } | undefined;
  for (const p of s.surface) {
    if (selected && p.level < selected.level) continue;
    const hit = classifyMapPolygon(lon, lat, p.indexed);
    if (hit === 'outside') continue;
    const edge: boolean = hit === 'boundary' && (p.level !== selected?.level || selected.edge);
    selected = { kind: p.kind, level: p.level, source: p.source, edge };
  }
  return selected;
}

export function matchEuropeanBorderTerritory(lat: number, lon: number): TerritorialExclaveMatch | undefined {
  const s = surveys.find(w => contains(w.bbox, lat, lon));
  if (!s || surfaceAt(s, lat, lon)?.kind !== 'mainland') return;
  const hit = administration(s, lat, lon);
  const feature = hit.site && territories.get(hit.site);
  if (feature) return { ...feature, relation: hit.relation, boundaryCodes: hit.codes };
}

export function matchEuropeanBorderShoreline(lat: number, lon: number): ReviewedShorelineMatch | undefined {
  const s = surveys.find(w => contains(w.bbox, lat, lon));
  if (!s) return;
  const physicalHit = surfaceAt(s, lat, lon);
  const source = surfaceSource(physicalHit?.source);
  const common = { ...metadata(s), attribution: s.attribution + ' ' + source.attribution,
    evidenceUrls: [...s.evidenceUrls, source.evidenceUrl], physicalSource: source };
  // Only the outer edge of the raster margin can adjoin mapped dry land.
  // The edge of its eroded water core still has an uncertain pixel on the other side.
  if (!physicalHit || (physicalHit.kind === 'water-margin' && !physicalHit.edge)
      || (physicalHit.source === 'worldcover' && physicalHit.kind === 'inland-water' && physicalHit.edge)) {
    return { ...common, relation: 'inside', surface: 'unknown', ownershipReview: true, codes: [] };
  }
  if (physicalHit.kind === 'inland-water' && !physicalHit.edge) {
    return { ...common, relation: 'inside', surface: 'water', waterKind: 'inland', ownershipReview: false, codes: [] };
  }
  const admin = administration(s, lat, lon);
  const relation = physicalHit.edge ? 'boundary' : admin.relation;
  return { ...common, codes: admin.codes, relation, surface: physicalHit.edge ? 'boundary' : 'land',
    ...((physicalHit.kind === 'mainland' || physicalHit.kind === 'island') && { landform: physicalHit.kind }),
    ownershipReview: relation === 'boundary', ...(admin.disagreement && { administrativeSourceDisagreement: true }) };
}

export function* queryEuropeanBorderPolygons(disk: number[]) {
  for (const s of surveys) {
    if (!overlapsWrappedMapBounds(s.bbox, disk)) continue;
    for (const p of s.surface) if (overlapsWrappedMapBounds(p.bbox, disk)) {
      yield { ...surfaceSource(p.source), bbox: p.bbox, kind: 'physical' as const, codes: [] as string[], get rings() { return p.polygon.rings; } };
    }
    for (const side of s.partitions) for (const p of side.shapes) if (overlapsWrappedMapBounds(p.bbox, disk)) {
      yield { ...metadata(s), bbox: p.bbox, kind: 'admin' as const, codes: [side.inside, side.outside], get rings() { return p.polygon.rings; } };
    }
  }
}

export function* queryEuropeanBorderTerritories(disk: number[]) {
  for (const s of surveys) {
    if (!overlapsWrappedMapBounds(s.bbox, disk)) continue;
    // The first partition supplies the named components. The second edition
    // is evaluated around the full footprint by queryEuropeanBorderPolygons.
    for (const p of s.partitions[0].shapes) {
      const feature = p.site && territories.get(p.site);
      if (!feature || !overlapsWrappedMapBounds(p.bbox, disk)) continue;
      yield { ...metadata(s), feature, codes: [feature.code], bbox: p.bbox, get rings() { return p.polygon.rings; } };
    }
  }
}
