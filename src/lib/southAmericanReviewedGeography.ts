import north from '../data/southAmericaNorthReviewed.json';
import andes from '../data/southAmericaAndesReviewed.json';
import south from '../data/southAmericaSouthReviewed.json';
import offshore from '../data/southAmericaOffshoreReviewed.json';
import { createSurveyRegion, type SurveyWindow } from './surveyRegion';

export const southAmerica = createSurveyRegion([
  ...north.windows, ...andes.windows, ...south.windows, ...offshore.windows,
] as SurveyWindow[]);
