import footprint from '../data/islandBorderReview.json';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';
import type { AgidIslandAssessment } from './islandPolicy';

export const chelemSurveySource = 'inegi-cayo-chelem+gshhg';
export const chelemReviewSource = 'cayo-chelem-shoreline-disagreement';
const version = 'INEGI TIM v2.1 (2018); GSHHG 2.3.7; NE 5.1.2; FieldMaps 2025-07-29';
const attribution = 'Fuente: INEGI, Conjunto de datos del Territorio Insular Mexicano v2.1 (2018), elemento 848. '
  + 'GSHHG: Paul Wessel and Walter H. F. Smith. Natural Earth and FieldMaps USGS/LSIB.';
const evidenceUrls = [
  'https://www.inegi.org.mx/app/biblioteca/ficha.html?upc=889463039839',
  'https://snieg.inegi.org.mx/Documentos/IIN/Acuerdo_14_III_2022/catal_insular_terri_mexicano.pdf',
  'https://www.soest.hawaii.edu/pwessel/gshhg/',
  'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-details/',
  'https://fieldmaps.io/data/adm0/',
];
const pieces = [
  ...footprint.mapped.map(p => ({ ...p, source: chelemSurveySource })),
  ...footprint.review.map(p => ({ ...p, source: chelemReviewSource })),
].map(p => ({ ...p, indexed: indexMapPolygon(p), version, attribution }));
const extent = [
  Math.min(...pieces.map(p => p.bbox[0])), Math.min(...pieces.map(p => p.bbox[1])),
  Math.max(...pieces.map(p => p.bbox[2])), Math.max(...pieces.map(p => p.bbox[3])),
];

export function matchIslandBorderReview(lat: number, lon: number): AgidIslandAssessment | undefined {
  if (lon < extent[0] || lat < extent[1] || lon > extent[2] || lat > extent[3]) return;
  for (const p of pieces) {
    const relation = classifyMapPolygon(lon, lat, p.indexed);
    if (relation === 'outside') continue;
    const mapped = p.source === chelemSurveySource;
    return {
      status: mapped ? 'mapped' : 'unresolved', countryCodes: mapped ? ['MX'] : [],
      ...(mapped && { sovereignCodes: ['MX'], territory: 'Cayo Chelem', territoryJa: 'チェレム島' }),
      source: p.source, version, attribution, relation, evidenceUrls: [...evidenceUrls],
    };
  }
}

// This compares the identity of a whole Natural Earth map feature returned by
// the spatial index. It is never used for point containment.
export function isReviewedNaturalEarthIsland(bbox: number[], codes?: string[]) {
  return codes?.length === 1 && codes[0] === 'BZ'
    && footprint.naturalEarthComponentBbox.every((value, i) => value === bbox[i]);
}

export function* queryIslandBorderReviewPolygons([w, s, e, n]: number[]) {
  if (e < extent[0] || w > extent[2] || n < extent[1] || s > extent[3]) return;
  for (const p of pieces) {
    if (p.bbox[0] <= e && p.bbox[2] >= w && p.bbox[1] <= n && p.bbox[3] >= s) yield p;
  }
}
