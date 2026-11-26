import { chelemReviewSource, chelemSurveySource } from './islandBorderDisagreement';
import type { AgidGeographicAssessment } from './geographicAssessment';

type Island = NonNullable<AgidGeographicAssessment['island']>;

const japanIslandNames: Record<string, [string, string]> = {
  'northern-territories': ['Northern Territories', '北方領土'],
  takeshima: ['Takeshima', '竹島'],
  senkaku: ['Senkaku Islands', '尖閣諸島'],
};

const japaneseRemoteIslandNames: Record<string, string> = {
  okinotorishima: 'Okinotorishima',
  minamitorishima: 'Minamitorishima',
  nishinoshima: 'Nishinoshima',
};

export function isNamedJapaneseRemoteIsland(island?: Island) {
  return !!island?.territory && Object.hasOwn(japaneseRemoteIslandNames, island.territory)
    && island.source === 'mlit-n03-tokyo-remote-islands';
}

export function islandDisplayName(island: Island, japanese: boolean) {
  const name = island.territory;
  if (island.status === 'japan-position' && name && japanIslandNames[name]) {
    return japanIslandNames[name][japanese ? 1 : 0];
  }
  if (name && isNamedJapaneseRemoteIsland(island)) {
    return japanese ? island.territoryJa : japaneseRemoteIslandNames[name];
  }
  return (japanese && island.territoryJa) || name;
}

/** The same distinction between map units, claims, and administration is shown on the map and in the CLI. */
export function islandDisplayRows(
  island: Island,
  japanese: boolean,
  formatRegions: (codes: string[]) => string,
  footprintCandidates: string[] = [],
): [string, string][] {
  const rows: [string, string][] = [];
  const name = islandDisplayName(island, japanese);
  if (name) rows.push([japanese ? '島・地域' : 'Island or territory', name]);
  if (island.status === 'japan-position') {
    rows.push([japanese ? '日本政府の領土見解に基づく表示' : 'Under the Japanese government’s territorial position', formatRegions(['JP'])]);
  } else if (island.status === 'mapped') {
    const label = island.administrationKind === 'condominium'
      ? (japanese ? '共同管理国' : 'Joint administration')
      : (japanese ? '地図上の国・地域' : 'Mapped country or territory');
    rows.push([label, formatRegions(island.countryCodes)]);
    if (footprintCandidates.some(code => !island.countryCodes.includes(code))) {
      rows.push([japanese ? '位置の誤差範囲にある国・地域の候補' : 'Possible regions across the location footprint', formatRegions(footprintCandidates)]);
    }
    const sovereign = island.sovereignCodes;
    if (sovereign?.length && (sovereign.length !== island.countryCodes.length || sovereign.some(code => !island.countryCodes.includes(code)))) {
      rows.push([japanese ? '地図資料上の主権国' : 'Sovereign state in map source', formatRegions(sovereign)]);
    }
  } else {
    if (island.source === chelemReviewSource) {
      rows.push([japanese ? '海岸線・国境資料' : 'Shoreline and border sources',
        japanese ? '資料が一致しないため要確認' : 'Sources disagree at this location']);
      return rows;
    }
    if (island.source === chelemSurveySource) {
      rows.push([japanese ? '中心点の島の地図上の国・地域' : 'Mapped country of the island at the center', formatRegions(['MX'])]);
      rows.push([japanese ? '位置の誤差範囲' : 'Location footprint', japanese ? '要確認' : 'Confirm the location']);
      return rows;
    }
    if (isNamedJapaneseRemoteIsland(island) && island.status === 'unresolved') {
      rows.push([japanese ? '中心点の島の地図上の国・地域' : 'Mapped country of the island at the center', formatRegions(['JP'])]);
      rows.push([japanese ? '位置の誤差範囲' : 'Location footprint', japanese ? '要確認' : 'Confirm the location']);
      return rows;
    }
    if (island.status === 'unresolved' && footprintCandidates.length > 1 && !island.claimantCodes?.length) {
      rows.push([japanese ? '位置の誤差範囲にある国・地域の候補' : 'Possible regions across the location footprint', formatRegions(footprintCandidates)]);
      return rows;
    }
    rows.push([
      japanese ? '領有権' : 'Sovereignty',
      island.status === 'disputed'
        ? (japanese ? '主張が競合' : 'Competing claims')
        : (japanese ? '要確認' : 'Undetermined'),
    ]);
    if (island.claimantCodes?.length) {
      const scope = island.claimScope === 'island-group';
      rows.push([
        japanese ? (scope ? '島群の全部または一部を主張する国・地域' : '領有権を主張する国・地域')
          : (scope ? 'Claimants to all or part of the island group' : 'Claimant states or territories'),
        formatRegions(island.claimantCodes),
      ]);
    }
    if (island.administeringCode) {
      rows.push([japanese ? '資料上の施政国・地域' : 'Administration in source', formatRegions([island.administeringCode])]);
    }
  }
  return rows;
}
