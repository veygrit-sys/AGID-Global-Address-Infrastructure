import usAtlanticIslands from '../data/usAtlanticIslandsReviewed.json';
import usPacificIslands from '../data/usPacificIslandsReviewed.json';
import usPacificTerritories from '../data/usPacificTerritoriesReviewed.json';
import caribbeanTerritorialIslands from '../data/caribbeanTerritorialIslandsReviewed.json';
import lesserAntillesIslands from '../data/lesserAntillesIslandsReviewed.json';
import greaterAntillesIslands from '../data/greaterAntillesIslandsReviewed.json';
import { createSurveyRegion, type SurveyWindow } from './surveyRegion';

export const caribbeanUsIslands = createSurveyRegion([
  ...usAtlanticIslands.windows, ...usPacificIslands.windows, ...usPacificTerritories.windows,
  ...caribbeanTerritorialIslands.windows, ...lesserAntillesIslands.windows, ...greaterAntillesIslands.windows,
] as SurveyWindow[]);
