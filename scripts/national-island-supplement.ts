import { matchRegionalCoast } from '../src/lib/pearlRiverDelta';
import { matchNationalIslandPoint } from './national-island-point-evidence';
import sourceData from '../src/data/nationalIslandSupplement.json';
import { needsIslandPolicyReview } from '../src/lib/disputedIslands';
import { isJapaneseIslandReviewArea } from '../src/lib/japaneseIslandView';
import { applyIslandPolicyToEvidence, matchBundledIsland, type AgidIslandAssessment, type IslandEvidence } from '../src/lib/islandPolicy';

export type PackHit = IslandEvidence & {
  islandId: string;
  kind: 'lake-island' | 'ocean-island' | 'shoreline-island';
};

const byPhysicalId = new Map<string, (typeof sourceData.sources)[number]>(sourceData.sources.flatMap(source =>
  source.gshhgIds.map(id => [`gshhg:${id}`, source] as const)));

export function assessPackPoint(lat: number, lon: number, raw: PackHit | null,
  mappedInlandWater: boolean, pinnedSourceEdition: boolean): AgidIslandAssessment | undefined {
  const coast = matchRegionalCoast(lat, lon);
  if (coast?.requiresAgreement) return mappedInlandWater ? undefined : matchBundledIsland(lat, lon, coast);
  const primary = applyIslandPolicyToEvidence(lat, lon, raw ?? undefined);
  if (!raw) return primary ?? (mappedInlandWater ? undefined : matchBundledIsland(lat, lon));
  if (mappedInlandWater || raw.disputed || raw.codes.length || primary?.status !== 'unresolved') return primary;

  const bundled = matchBundledIsland(lat, lon);
  if (bundled) return bundled;
  if (!pinnedSourceEdition || raw.relation !== 'inside' || raw.sovereignCodes?.length
    || raw.kind === 'shoreline-island' || raw.source !== 'gshhg-full+fieldmaps-usgs-lsib'
    || raw.version !== '2.3.7+2025-07-29' || isJapaneseIslandReviewArea(lat, lon)
    || needsIslandPolicyReview(lat, lon)) return primary;

  const proof = byPhysicalId.get(raw.islandId)
    ?? matchNationalIslandPoint(lat, lon, raw.islandId, sourceData.physicalVersion);
  if (!proof) return primary;
  const mapped = applyIslandPolicyToEvidence(lat, lon, {
    codes: [proof.code], sovereignCodes: [proof.sovereignCode], relation: 'inside',
    source: proof.source, version: proof.version,
  });
  if (mapped?.status !== 'mapped' || mapped.source !== proof.source) return mapped;
  return { ...mapped, evidenceUrls: [proof.sourcePage], attribution: proof.attribution };
}
