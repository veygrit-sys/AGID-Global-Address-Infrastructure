import usMexico from '../data/usMexicoReviewed.json';
import northern from '../data/northernCentralAmericaReviewed.json';
import southern from '../data/southernCentralAmericaReviewed.json';
import { createSurveyRegion, type SurveyWindow } from './surveyRegion';

export const {
  windows: mesoamericanWindows, match: matchMesoamericanGeography, query: queryMesoamericanPolygons,
} = createSurveyRegion([...usMexico.windows, ...northern.windows, ...southern.windows] as SurveyWindow[]);
