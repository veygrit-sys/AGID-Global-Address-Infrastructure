import { issuanceLongitude } from './agidProjection';
import { matchGlobalIsland } from './globalIslands';
import { matchMinorIsland } from './minorIslands';
import { isJapaneseIslandReviewArea, matchJapaneseIslandView } from './japaneseIslandView';
import { matchDisputedIsland, matchRevisedIslandRegion, needsIslandPolicyReview } from './disputedIslands';

export interface IslandEvidence {
  codes: string[];
  sovereignCodes?: string[];
  relation: 'inside' | 'boundary';
  source: string;
  version: string;
  disputed?: boolean;
}

export interface AgidIslandAssessment {
  status: 'mapped' | 'japan-position' | 'disputed' | 'unresolved';
  countryCodes: string[];
  sovereignCodes?: string[];
  claimantCodes?: string[];
  administeringCode?: string | null;
  territory?: string;
  territoryJa?: string;
  claimScope?: 'feature' | 'island-group';
  evidenceUrls?: string[];
  source: string;
  version: string;
  attribution?: string;
  relation: 'inside' | 'boundary';
}

const japanGroups = {
  'northern-territories': { name: '北方領土', url: 'https://www.mofa.go.jp/mofaj/area/hoppo/hoppo.html' },
  takeshima: { name: '竹島', url: 'https://www.mofa.go.jp/mofaj/area/takeshima/' },
  senkaku: { name: '尖閣諸島', url: 'https://www.mofa.go.jp/mofaj/area/senkaku/' },
} as const;

/** Apply the product's display policy to a positive land feature, including one from an optional offline pack. */
export function applyIslandPolicyToEvidence(lat: number, lon: number, evidence?: IslandEvidence): AgidIslandAssessment | undefined {
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon)) throw new RangeError('Invalid location');
  lon = issuanceLongitude(lat, lon);
  const japan = matchJapaneseIslandView(lat, lon);
  if (japan) {
    const group = japanGroups[japan.group];
    return {
      status: 'japan-position', countryCodes: ['JP'], sovereignCodes: ['JP'], territory: japan.group,
      territoryJa: group.name, evidenceUrls: [group.url], source: japan.source, version: japan.version,
      attribution: japan.attribution, relation: japan.relation,
    };
  }
  // Within the three reviewed archipelagoes Japan's shoreline outranks generalized
  // depictions from other editions. A gap or open water carries no island assignment.
  if (isJapaneseIslandReviewArea(lat, lon)) return undefined;
  const revised = matchRevisedIslandRegion(lat, lon);
  if (revised) return {
    status: 'mapped', countryCodes: [revised.code], sovereignCodes: [revised.code], relation: revised.relation,
    source: revised.source, version: revised.version, evidenceUrls: revised.evidenceUrls,
  };
  const dispute = matchDisputedIsland(lat, lon);
  if (dispute) return {
    status: dispute.status === 'disputed' ? 'disputed' : 'unresolved', countryCodes: [],
    claimantCodes: dispute.claimantCodes, administeringCode: dispute.administeringCode,
    territory: dispute.territory, territoryJa: dispute.territoryJa, claimScope: dispute.claimScope,
    evidenceUrls: dispute.evidenceUrls, relation: dispute.relation, source: dispute.source, version: dispute.version,
  };
  if (!evidence) return undefined;
  if (evidence.disputed || !evidence.codes.length || needsIslandPolicyReview(lat, lon)) return {
    status: 'unresolved', countryCodes: [], relation: evidence.relation, source: evidence.source, version: evidence.version,
  };
  return {
    status: 'mapped', countryCodes: [...evidence.codes],
    ...(evidence.sovereignCodes?.length && { sovereignCodes: [...evidence.sovereignCodes] }),
    source: evidence.source, version: evidence.version, relation: evidence.relation,
  };
}

export function matchBundledIsland(lat: number, lon: number): AgidIslandAssessment | undefined {
  const evidence = matchGlobalIsland(lat, lon) ?? matchMinorIsland(lat, lon);
  return applyIslandPolicyToEvidence(lat, lon, evidence);
}

export function copyIslandAssessment(value: AgidIslandAssessment): AgidIslandAssessment {
  return {
    ...value, countryCodes: [...value.countryCodes],
    ...(value.sovereignCodes && { sovereignCodes: [...value.sovereignCodes] }),
    ...(value.claimantCodes && { claimantCodes: [...value.claimantCodes] }),
    ...(value.evidenceUrls && { evidenceUrls: [...value.evidenceUrls] }),
  };
}
