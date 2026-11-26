import arctic from '../data/canadaArcticReviewed.json';
import atlantic from '../data/canadaAtlanticReviewed.json';
import freshwater from '../data/canadaFreshwaterReviewed.json';
import hudson from '../data/canadaHudsonReviewed.json';
import pacific from '../data/canadaPacificReviewed.json';
import { createSurveyRegion, type SurveyWindow } from './surveyRegion';

export const canadianIslands = createSurveyRegion([
  ...arctic.windows, ...atlantic.windows, ...freshwater.windows, ...hudson.windows, ...pacific.windows,
] as SurveyWindow[]);
