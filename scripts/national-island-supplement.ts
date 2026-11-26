import { matchNationalIslandPoint } from './national-island-point-evidence';
import sourceData from '../src/data/nationalIslandSupplement.json';
import { needsIslandPolicyReview } from '../src/lib/disputedIslands';
import { isJapaneseIslandReviewArea } from '../src/lib/japaneseIslandView';
import { pointTerritorialTopology } from '../src/lib/territorialTopology';
import { applyIslandPolicyToEvidence, matchBundledIsland, type AgidIslandAssessment, type IslandEvidence } from '../src/lib/islandPolicy';

export type PackHit = IslandEvidence & {
  islandId: string;
  kind: 'lake-island' | 'ocean-island' | 'shoreline-island';
};

const byPhysicalId = new Map<string, (typeof sourceData.sources)[number]>(sourceData.sources.flatMap(source =>
  source.gshhgIds.map(id => [`gshhg:${id}`, source] as const)));

export function assessPackPoint(lat: number, lon: number, raw: PackHit | null,
  mappedInlandWater: boolean, pinnedSourceEdition: boolean): AgidIslandAssessment | undefined {
  const primary = applyIslandPolicyToEvidence(lat, lon, raw ?? undefined);
  if (mappedInlandWater && primary?.status !== 'japan-position'
    && primary?.source !== 'mlit-n03-tokyo-remote-islands') return undefined;
  if (!raw) return primary ?? matchBundledIsland(lat, lon);
  if (raw.disputed || raw.codes.length || primary?.status !== 'unresolved') return primary;

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

// Pinned GSHHG landmass IDs. A FieldMaps-coded interior in every listed
// jurisdiction was verified on the SAME physical ID (full-pack controls).
const sharedOceanIslands = new Map<string, string[]>([
  ['gshhg:8', ['ID', 'PG']],        // New Guinea
  ['gshhg:9', ['BN', 'ID', 'MY']],  // Borneo
  ['gshhg:26', ['GB', 'IE']],       // Ireland
  ['gshhg:29', ['DO', 'HT']],       // Hispaniola
  ['gshhg:35', ['AR', 'CL']],       // Isla Grande de Tierra del Fuego
  ['gshhg:51', ['ID', 'TL']],       // Timor
  ['gshhg:564', ['ID', 'MY']],      // Sebatik
  ['gshhg:1592', ['MF', 'SX']],     // Saint Martin
]);

export function packPointResult(lat: number, lon: number, raw: PackHit | null,
  mappedInlandWater: boolean, pinnedSourceEdition: boolean) {
  const island = assessPackPoint(lat, lon, raw, mappedInlandWater, pinnedSourceEdition);
  const topology = island || !mappedInlandWater ? pointTerritorialTopology(lat, lon, island, island && raw ? raw.islandId : undefined) : undefined;
  const physical = island && raw ? {
    physicalIslandId: raw.islandId,
    physicalKind: raw.kind,
    physicalSource: raw.kind === 'shoreline-island' ? 'fieldmaps-usgs-lsib' : 'gshhg-full',
    physicalVersion: raw.kind === 'shoreline-island' ? '2025-07-29' : '2.3.7',
  } : undefined;
  if (raw && topology?.administration && (!pinnedSourceEdition || raw.disputed
    || (raw.codes.length > 0 && !raw.codes.includes(topology.administration.code)))) {
    delete topology.administration;
  }
  if (physical && topology) {
    topology.physicalSource = { source: physical.physicalSource, version: physical.physicalVersion };
    // An offshore islet can overlap an older, more generalized depiction of
    // the neighbouring island. Its GSHHG identity decides the group.
    const sharing = pinnedSourceEdition && raw?.kind === 'ocean-island' && island?.status === 'mapped'
      ? sharedOceanIslands.get(raw.islandId) : undefined;
    if (sharing) topology.sharedIslandCountryCodes = [...sharing];
    else delete topology.sharedIslandCountryCodes;
  }
  return { island: island ?? null, territorialTopology: topology ?? null, ...physical, deliveryRegion: null };
}
