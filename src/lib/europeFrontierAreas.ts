import data from '../data/europe-frontiers/local-areas.json';
import sources from '../data/europe-frontiers/sources.json';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';
import { unpackMapRing } from './packedMapRing';

interface Area {
  name: string; codes: string[]; source: keyof typeof sources; bbox: number[]; rings: string[];
  coverage?: number[]; borderCodes?: string[];
}
const areas = (data as Area[]).map(area => {
  let decoded: number[][][] | undefined;
  return { ...area, indexed: indexMapPolygon({
    bbox: area.bbox,
    get rings() { return decoded ??= area.rings.map(r => unpackMapRing(r, 1e7)); },
  }) };
});

export function frontierAreaAt(lon: number, lat: number, footprint?: number[]) {
  for (const area of areas) {
    const cover = area.coverage ?? area.bbox;
    if (lon<cover[0] || lat<cover[1] || lon>cover[2] || lat>cover[3]) continue;
    const relation = classifyMapPolygon(lon,lat,area.indexed);
    if (relation === 'outside') continue;
    const codes = relation === 'boundary' && area.borderCodes ? area.borderCodes : area.codes;
    return {...sources[area.source], codes: [...codes], relation, name: area.name,
      joint: area.source === 'condominium',
      coversFootprint: !footprint || footprint.every((v,i) => i<2 ? v>=cover[i] : v<=cover[i])};
  }
}
