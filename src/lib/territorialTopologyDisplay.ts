import type { AgidGeographicAssessment } from './geographicAssessment';

type Topology = NonNullable<AgidGeographicAssessment['territorialTopology']>;
type Administration = NonNullable<Topology['administration']>;

const administrativeTypes: Record<Administration['kind'], [string, string]> = {
  enclave: ['Enclave', '他国に囲まれた飛び地'],
  'point-connected': ['Territory joined to its mainland at one point', '本土と一点で接する地域'],
  'counter-enclave': ['Counter-enclave', '二重飛び地'],
  'coastal-exclave': ['Coastal exclave', '沿岸の飛び地'],
  exclave: ['Exclave', '飛び地'],
  'enclaved-state': ['Enclaved sovereign state', '他国に囲まれた独立国'],
};

/** Keep the physical landform, the mapped territory and its neighbours distinguishable. */
export function territorialTopologyRows(
  topology: Topology, japanese: boolean, formatRegions: (codes: string[]) => string,
  island?: AgidGeographicAssessment['island'],
): [string, string][] {
  const rows: [string, string][] = [];
  const candidate = topology.status !== 'inside';
  if (topology.landform !== 'unknown') {
    const label = japanese ? (candidate ? '地形の候補' : '地形') : (candidate ? 'Possible landform' : 'Landform');
    const value = topology.landform === 'island' ? (japanese ? '島' : 'Island') : (japanese ? '大陸の陸地' : 'Continental land');
    rows.push([label, value]);
  } else if (topology.administration) {
    rows.push([japanese ? '地形' : 'Landform', japanese ? '島・大陸の別は未確定' : 'Island or continental land undetermined']);
  }
  const area = topology.administration;
  if (area) {
    const label = japanese ? (candidate ? '行政上の区分の候補' : '行政上の区分')
      : (candidate ? 'Possible territorial classification' : 'Territorial classification');
    rows.push([label, [japanese ? area.nameJa : area.name, administrativeTypes[area.kind][japanese ? 1 : 0]].join(' · ')]);
    const countryLabel = japanese ? (candidate ? 'この候補地の所属国・地域' : 'この地点の所属国・地域')
      : (candidate ? 'Country or territory of this candidate area' : 'Country or territory at this location');
    const islandIdentifiesOwner = island?.status === 'mapped' && island.countryCodes.length === 1 && island.countryCodes[0] === area.code;
    if (candidate || !islandIdentifiesOwner) rows.push([countryLabel, formatRegions([area.code])]);
    if (area.neighboringCodes.length) {
      rows.push([japanese ? '周囲・隣接する国・地域' : 'Surrounding or neighbouring countries and territories', formatRegions(area.neighboringCodes)]);
    }
  }
  if (topology.sharedIslandCountryCodes && topology.sharedIslandCountryCodes.length > 1) {
    let label = japanese ? (candidate ? '候補となる島に領域を持つ国・地域' : 'この島に領域を持つ国・地域')
      : (candidate ? 'Countries or territories sharing the candidate island' : 'Countries or territories sharing this island');
    if (topology.sharedIslandBasis === 'hydrographic-record') {
      label = japanese ? '水系図に記録された島全体の国・地域' : 'Countries or territories on the island recorded in hydrographic maps';
    }
    rows.push([label, formatRegions(topology.sharedIslandCountryCodes)]);
  }
  return rows;
}
