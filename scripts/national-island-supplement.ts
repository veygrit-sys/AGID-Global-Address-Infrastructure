import { matchNationalIslandPoint } from './national-island-point-evidence';
import sourceData from '../src/data/nationalIslandSupplement.json';
import { needsIslandPolicyReview } from '../src/lib/disputedIslands';
import { isJapaneseIslandReviewArea } from '../src/lib/japaneseIslandView';
import { pointTerritorialTopology } from '../src/lib/territorialTopology';
import { matchUsCanadaShoreline } from '../src/lib/usCanadaShorelines';
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
  const shore = matchUsCanadaShoreline(lat, lon);
  if (shore) {
    // A measured border across a surveyed island resolves each side separately.
    // A single old pack feature can cover both, or omit the island altogether.
    if (primary?.claimantCodes || shore.surveyedIslandOwnership) return primary;
    // An independently surveyed lake island can fill a GSHHG omission. The
    // quantized copy of GSHHG alone cannot overrule that pack's exact lake.
    if (mappedInlandWater && !shore.surveyedLakeIsland) return undefined;
    if (shore.surface === 'water' || shore.surface === 'unknown' || shore.landform === 'mainland') return undefined;
    const reviewed = shore.island;
    if (!reviewed && shore.surface === 'boundary') return undefined;
    if (raw && (raw.disputed || raw.relation === 'boundary' || raw.codes.length > 1
      || (shore.codes.length > 0 && raw.codes.some(code => !shore.codes.includes(code))))) {
      const evidence = reviewed ?? raw;
      return { status: 'unresolved', countryCodes: [], source: evidence.source, version: evidence.version,
        attribution: reviewed?.attribution, evidenceUrls: reviewed?.evidenceUrls,
        relation: raw.relation === 'boundary' ? 'boundary' : shore.relation };
    }
    if (shore.surface === 'boundary' || shore.ownershipReview || shore.codes.length > 0) return reviewed;
    // With no jurisdiction in the bundled extract, the exact, pinned pack may
    // supply it for this physical island at this point only.
    if (pinnedSourceEdition && raw?.codes.length === 1 && ['CA', 'US'].includes(raw.codes[0])) {
      return { status: 'mapped', countryCodes: [...raw.codes], sovereignCodes: [...(raw.sovereignCodes ?? [])],
        relation: 'inside', source: raw.source, version: raw.version };
    }
    return reviewed;
  }
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

export function packPointResult(lat: number, lon: number, packHit: PackHit | null,
  mappedInlandWater: boolean, pinnedSourceEdition: boolean) {
  const island = assessPackPoint(lat, lon, packHit, mappedInlandWater, pinnedSourceEdition);
  const surveyed = matchUsCanadaShoreline(lat, lon)?.surveyedIslandOwnership;
  // The independent lake survey supplies its own physical geometry, including water.
  const raw = surveyed ? null : packHit;
  const topology = island || surveyed || !mappedInlandWater
    ? pointTerritorialTopology(lat, lon, island, island && raw ? raw.islandId : undefined) : undefined;
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
