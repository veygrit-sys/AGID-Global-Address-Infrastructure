
import { RegionalLandmark } from './WestAsiaService';

export interface NatureContext {
  mountains: RegionalLandmark[];
  beaches: RegionalLandmark[];
  ports: RegionalLandmark[];
  seas: RegionalLandmark[];
  rivers?: RegionalLandmark[];
  waterfalls?: RegionalLandmark[];
  islands?: RegionalLandmark[];
  lakes?: RegionalLandmark[];
  deserts: RegionalLandmark[];
  drylands?: RegionalLandmark[];
  grasslands?: RegionalLandmark[];
  forests?: RegionalLandmark[];
  wetlands?: RegionalLandmark[];
  glaciers?: RegionalLandmark[];
  naturalAreas?: RegionalLandmark[];
  landCover?: string;
}

/**
 * Nature Service
 * Fetches environmental and geographical features using Overpass API and other open sources.
 */
export async function fetchNatureContext(lat: number, lon: number): Promise<NatureContext> {
  const results: NatureContext = {
    mountains: [],
    beaches: [],
    ports: [],
    seas: [],
    rivers: [],
    waterfalls: [],
    islands: [],
    lakes: [],
    deserts: [],
    drylands: [],
    grasslands: [],
    forests: [],
    wetlands: [],
    glaciers: [],
    naturalAreas: []
  };

  try {
    // We use a combined Overpass query for efficiency
    const query = `
      [out:json][timeout:30];
      (
        node["natural"="peak"](around:8000,${lat},${lon});
        node["natural"="beach"](around:5000,${lat},${lon});
        way["natural"="beach"](around:5000,${lat},${lon});
        node["harbour"="yes"](around:8000,${lat},${lon});
        way["harbour"="yes"](around:8000,${lat},${lon});
        node["industrial"="port"](around:8000,${lat},${lon});
        way["industrial"="port"](around:8000,${lat},${lon});
        node["place"~"sea|ocean"](around:20000,${lat},${lon});
        node["place"~"island|islet|archipelago|atoll|cay|key|cayo|caye"]["name"](around:50000,${lat},${lon});
        way["place"~"island|islet|archipelago|atoll|cay|key|cayo|caye"]["name"](around:50000,${lat},${lon});
        relation["place"~"island|islet|archipelago|atoll|cay|key|cayo|caye"]["name"](around:50000,${lat},${lon});
        node["natural"~"island|islet|archipelago|atoll|cay|key"]["name"](around:50000,${lat},${lon});
        way["natural"~"island|islet|archipelago|atoll|cay|key"]["name"](around:50000,${lat},${lon});
        relation["natural"~"island|islet|archipelago|atoll|cay|key"]["name"](around:50000,${lat},${lon});
        node["water"~"lake|salt_lake|saline_lake|reservoir|lagoon|oxbow|pond|basin"]["name"](around:20000,${lat},${lon});
        way["water"~"lake|salt_lake|saline_lake|reservoir|lagoon|oxbow|pond|basin"]["name"](around:20000,${lat},${lon});
        relation["water"~"lake|salt_lake|saline_lake|reservoir|lagoon|oxbow|pond|basin"]["name"](around:20000,${lat},${lon});
        node["natural"="water"]["water"~"lake|salt_lake|saline_lake|reservoir|lagoon|oxbow|pond|basin"]["name"](around:20000,${lat},${lon});
        way["natural"="water"]["water"~"lake|salt_lake|saline_lake|reservoir|lagoon|oxbow|pond|basin"]["name"](around:20000,${lat},${lon});
        relation["natural"="water"]["water"~"lake|salt_lake|saline_lake|reservoir|lagoon|oxbow|pond|basin"]["name"](around:20000,${lat},${lon});
        node["water"~"river|stream|canal"]["name"](around:20000,${lat},${lon});
        way["water"~"river|stream|canal"]["name"](around:20000,${lat},${lon});
        relation["water"~"river|stream|canal"]["name"](around:20000,${lat},${lon});
        node["natural"="water"]["water"~"river|stream|canal"]["name"](around:20000,${lat},${lon});
        way["natural"="water"]["water"~"river|stream|canal"]["name"](around:20000,${lat},${lon});
        relation["natural"="water"]["water"~"river|stream|canal"]["name"](around:20000,${lat},${lon});
        node["waterway"~"river|stream|canal|brook|creek|wadi"]["name"](around:20000,${lat},${lon});
        way["waterway"~"river|stream|canal|brook|creek|wadi"]["name"](around:20000,${lat},${lon});
        relation["waterway"~"river|stream|canal|brook|creek|wadi"]["name"](around:20000,${lat},${lon});
        node["waterway"="waterfall"]["name"](around:12000,${lat},${lon});
        way["waterway"="waterfall"]["name"](around:12000,${lat},${lon});
        relation["waterway"="waterfall"]["name"](around:12000,${lat},${lon});
        node["natural"="waterfall"]["name"](around:12000,${lat},${lon});
        way["natural"="waterfall"]["name"](around:12000,${lat},${lon});
        relation["natural"="waterfall"]["name"](around:12000,${lat},${lon});
        node["natural"="desert"](around:20000,${lat},${lon});
        way["natural"="desert"](around:20000,${lat},${lon});
        node["natural"~"dune|sand|bare_rock|scree|shingle|mudflat|fell|tundra|scrub|heath|wilderness|wasteland|moor|moorland|salt_lake|saline_lake|grassland|wetland|marsh|swamp|bog|fen|reedbed|mangrove|glacier|ice_field|icefield|ice_cap|ice_sheet|snowfield|wood"]["name"](around:20000,${lat},${lon});
        way["natural"~"dune|sand|bare_rock|scree|shingle|mudflat|fell|tundra|scrub|heath|wilderness|wasteland|moor|moorland|salt_lake|saline_lake|grassland|wetland|marsh|swamp|bog|fen|reedbed|mangrove|glacier|ice_field|icefield|ice_cap|ice_sheet|snowfield|wood"]["name"](around:20000,${lat},${lon});
        relation["natural"~"dune|sand|bare_rock|scree|shingle|mudflat|fell|tundra|scrub|heath|wilderness|wasteland|moor|moorland|salt_lake|saline_lake|grassland|wetland|marsh|swamp|bog|fen|reedbed|mangrove|glacier|ice_field|icefield|ice_cap|ice_sheet|snowfield|wood"]["name"](around:20000,${lat},${lon});
        way["landuse"~"grass|meadow|forest|scrub|shrubland|wilderness|wasteland|moor|moorland|salt_flat|salt_lake|dryland"]["name"](around:20000,${lat},${lon});
        relation["landuse"~"grass|meadow|forest|scrub|shrubland|wilderness|wasteland|moor|moorland|salt_flat|salt_lake|dryland"]["name"](around:20000,${lat},${lon});
        way["landcover"~"grassland|grass|meadow|forest|wood|desert|sand|scrub|shrubland|bare_rock|scree|shingle|tundra|wilderness|wasteland|moor|moorland|salt_flat|salt_lake|dryland|ice|snow|snowfield"]["name"](around:20000,${lat},${lon});
        relation["landcover"~"grassland|grass|meadow|forest|wood|desert|sand|scrub|shrubland|bare_rock|scree|shingle|tundra|wilderness|wasteland|moor|moorland|salt_flat|salt_lake|dryland|ice|snow|snowfield"]["name"](around:20000,${lat},${lon});
        node["landuse"="harbour"](around:8000,${lat},${lon});
        way["landuse"="harbour"](around:8000,${lat},${lon});
      );
      out body center qt;
    `;

    // Standardized Overpass fetch with long timeout and retry
    const fetchWithRetry = async (url: string, queryBody: string, retries = 2): Promise<Response> => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          body: queryBody,
          headers: { 'Content-Type': 'text/plain' },
          signal: AbortSignal.timeout(90000)
        });
        if (!response.ok && response.status >= 500 && retries > 0) throw new Error('Retry');
        return response;
      } catch (e) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000 * (3 - retries)));
          return fetchWithRetry(url, queryBody, retries - 1);
        }
        throw e;
      }
    };

    const res = await fetchWithRetry('/api/overpass', query);

    if (res.ok) {
      const data = await res.json();
      data.elements.forEach((el: any) => {
        const natural = el.tags.natural;
        const place = el.tags.place;
        const water = el.tags.water;
        const waterway = el.tags.waterway;
        const landcover = el.tags.landcover;
        const landuse = el.tags.landuse;
        const glacierType = el.tags['glacier:type'];
        const salt = String(el.tags.salt || '').toLowerCase();
        const waterType = water === 'lake' && ['yes', 'true', '1', 'salt', 'saline', 'brackish'].includes(salt)
          ? 'salt_lake'
          : water;
        const cover = natural || landcover || landuse || glacierType;
        const landmark: RegionalLandmark = {
          name: el.tags.name || el.tags['name:en'] || "Unnamed Feature",
          type: waterway || waterType || natural || glacierType || landcover || landuse || el.tags.harbour || el.tags.industrial || place || "Feature",
          distance: 0 // We could calculate this if needed
        };
        const islandType = el.tags['island:type'];
        const islandValue = place || natural || islandType;

        if (natural === 'peak') results.mountains.push(landmark);
        else if (natural === 'beach') results.beaches.push(landmark);
        else if (el.tags.harbour === 'yes' || el.tags.industrial === 'port') results.ports.push(landmark);
        else if (place === 'sea' || place === 'ocean') results.seas.push(landmark);
        else if (waterway === 'waterfall' || natural === 'waterfall') results.waterfalls?.push(landmark);
        else if (['river', 'stream', 'canal', 'brook', 'creek', 'wadi'].includes(waterway) || ['river', 'stream', 'canal'].includes(waterType)) results.rivers?.push(landmark);
        else if (['island', 'islands', 'isle', 'islet', 'islets', 'archipelago', 'atoll', 'cay', 'cays', 'cayo', 'caye', 'key', 'keys'].includes(islandValue)) results.islands?.push(landmark);
        else if (['lake', 'salt_lake', 'saline_lake', 'reservoir', 'lagoon', 'oxbow', 'pond', 'basin'].includes(waterType)) results.lakes?.push(landmark);
        else if (natural === 'desert' || cover === 'desert') results.deserts.push(landmark);
        else if (['dune', 'sand', 'bare_rock', 'scree', 'shingle', 'mudflat', 'fell', 'tundra', 'scrub', 'shrubland', 'wilderness', 'wasteland', 'moor', 'moorland', 'salt_flat', 'salt_lake', 'saline_lake', 'dryland'].includes(cover)) {
          results.drylands?.push(landmark);
        } else if (['grassland', 'grass', 'meadow', 'heath'].includes(cover)) {
          results.grasslands?.push(landmark);
        } else if (['forest', 'wood'].includes(cover)) {
          results.forests?.push(landmark);
        } else if (['wetland', 'marsh', 'swamp', 'bog', 'fen', 'reedbed', 'mangrove'].includes(cover)) {
          results.wetlands?.push(landmark);
        } else if (['glacier', 'ice_shelf', 'ice_field', 'icefield', 'ice_cap', 'ice_sheet', 'snowfield', 'firn', 'ice', 'snow'].includes(cover)) {
          results.glaciers?.push(landmark);
        } else if (el.tags.name) {
          results.naturalAreas?.push(landmark);
        }
      });
    }
  } catch (e) {
    console.error('Nature Context Error:', e);
  }

  // Remove redundant geological risk fetch from within NatureService
  // This is now handled centrally in GeocodingService to prevent overloading the server
  return results;
}
