import { chelemReviewSource } from './islandBorderDisagreement';
import { matchGlobalLandform } from './globalIslands';
import { isJapaneseIslandReviewArea } from './japaneseIslandView';
import type { AgidIslandAssessment } from './islandPolicy';
import { matchTerritorialExclave, type TerritorialExclaveMatch } from './territorialExclaves';

export interface TerritorialTopology {
  landform: 'mainland' | 'island' | 'unknown';
  status: 'inside' | 'boundary' | 'uncertain';
  administration?: TerritorialExclaveMatch;
  sharedIslandCountryCodes?: string[];
  physicalSource?: { source: string; version: string; attribution?: string };
}

/** Physical geography and a territory's position relative to its parent state are independent. */
export function pointTerritorialTopology(
  lat: number, lon: number, island: AgidIslandAssessment | undefined, physicalIslandId?: string,
): TerritorialTopology | undefined {
  // A raw island ID can still be audited when a national shoreline and the global
  // source disagree about the ground beneath the pin. Both lookup modes abstain.
  if (island?.source === chelemReviewSource) return { landform: 'unknown', status: 'uncertain' };
  // In reviewed Japanese waters, a coarser global shoreline cannot restore discarded land.
  if (!island && isJapaneseIslandReviewArea(lat, lon)) return undefined;
  let administration = matchTerritorialExclave(lat, lon);
  const physical = matchGlobalLandform(lat, lon);
  // A generalized mainland shore can cover neighboring islets. A proven physical
  // island cannot inherit a classification that covers only a mainland component.
  if (administration?.physicalDomain === 'mainland' && (island || physicalIslandId || physical?.kind === 'island')) {
    administration = undefined;
  } else if (administration?.physicalDomain === 'island' && physicalIslandId
      && physicalIslandId !== `gshhg:${administration.gshhgPhysicalId}`) {
    administration = undefined;
  }
  if (!physical && !island && !administration) return undefined;
  const lakeIsland = administration?.physicalIslandSource;
  const landform = island || lakeIsland ? 'island' : physical?.kind ?? 'unknown';
  const physicalEvidence = island ?? lakeIsland ?? physical;
  const shared = physical?.kind === 'island' && (!island || island.status === 'mapped')
    ? physical.sharedIslandCountryCodes : undefined;
  const boundary = administration?.relation === 'boundary' || island?.relation === 'boundary'
    || (physical?.kind === landform && physical.relation === 'boundary');
  return {
    landform,
    status: boundary ? 'boundary' : 'inside',
    ...(administration && { administration }),
    ...(shared && shared.length > 1 && { sharedIslandCountryCodes: [...shared] }),
    ...(physicalEvidence && { physicalSource: {
      source: physicalEvidence.source, version: physicalEvidence.version,
      ...(physicalEvidence.attribution && { attribution: physicalEvidence.attribution }),
    } }),
  };
}
