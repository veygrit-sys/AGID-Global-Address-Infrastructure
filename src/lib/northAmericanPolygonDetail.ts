import lakes from '../data/naLakesPolygonDetail.json';
import mexico from '../data/naMexicoPolygonDetail.json';
import estuaries from '../data/naEstuaryPolygonDetail.json';
import antilles from '../data/caribbeanAntillesPolygonDetail.json';
import caribbean from '../data/caribbeanPolygonDetail.json';
import { createSurveyRegion, type SurveyWindow } from './surveyRegion';

export const northAmericanPolygonDetail = createSurveyRegion([
  ...lakes.windows, ...mexico.windows, ...estuaries.windows, ...caribbean.windows, ...antilles.windows,
] as SurveyWindow[]);
