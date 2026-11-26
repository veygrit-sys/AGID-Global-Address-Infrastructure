import australasia from '../data/oceaniaAustralasiaPolygonDetail.json';
import islandLakes from '../data/oceaniaIslandLakesPolygonDetail.json';
import melanesia from '../data/oceaniaMelanesiaPolygonDetail.json';
import micronesia from '../data/oceaniaMicronesiaPolygonDetail.json';
import polynesia from '../data/oceaniaPolynesiaPolygonDetail.json';
import { createSurveyRegion, type SurveyWindow } from './surveyRegion';

export const oceaniaPolygonDetail = createSurveyRegion([
  ...australasia.windows, ...melanesia.windows, ...micronesia.windows, ...polynesia.windows, ...islandLakes.windows,
] as SurveyWindow[]);
