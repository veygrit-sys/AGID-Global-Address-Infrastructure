import type { AgidGeographicAssessment } from './geographicAssessment';

type Island = NonNullable<AgidGeographicAssessment['island']>;

const japanIslandNames: Record<string, [string, string]> = {
  'northern-territories': ['Northern Territories', '北方領土'],
  takeshima: ['Takeshima', '竹島'],
  senkaku: ['Senkaku Islands', '尖閣諸島'],
};

export function islandDisplayName(island: Island, japanese: boolean) {
  const name = island.territory;
  if (island.status === 'japan-position' && name && japanIslandNames[name]) {
    return japanIslandNames[name][japanese ? 1 : 0];
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
    rows.push([japanese ? '地図上の国・地域' : 'Mapped country or territory', formatRegions(island.countryCodes)]);
    if (footprintCandidates.some(code => !island.countryCodes.includes(code))) {
      rows.push([japanese ? '位置の誤差範囲にある国・地域の候補' : 'Possible regions across the location footprint', formatRegions(footprintCandidates)]);
    }
    const sovereign = island.sovereignCodes;
    if (sovereign?.length && (sovereign.length !== island.countryCodes.length || sovereign.some(code => !island.countryCodes.includes(code)))) {
      rows.push([japanese ? '地図資料上の主権国' : 'Sovereign state in map source', formatRegions(sovereign)]);
    }
  } else {
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
