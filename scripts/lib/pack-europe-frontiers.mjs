/** Package original, multipart line geometry. Quantization is one ten-millionth of a degree. */
const scale = 1e7;

function encodeLine(points) {
  const bytes = [];
  const previous = [0, 0];
  for (const point of points) {
    for (let axis = 0; axis < 2; axis++) {
      const delta = point[axis] - previous[axis];
      let value = delta < 0 ? -2 * delta - 1 : 2 * delta;
      while (value >= 128) {
        bytes.push(128 + value % 128);
        value = Math.floor(value / 128);
      }
      bytes.push(value);
      previous[axis] = point[axis];
    }
  }
  const buffer = Uint8Array.from(bytes);
  return typeof buffer.toBase64 === 'function' ? buffer.toBase64() : Buffer.from(buffer).toString('base64');
}

export function packFrontiers(features, expectedPairs) {
  const catalog = [];
  const records = [];
  const seen = new Set();
  const pairs = new Set();
  for (const {paths, ...feature} of features) {
    if (seen.has(feature.id)) throw new Error('Duplicate source key ' + feature.id);
    seen.add(feature.id);
    if (!paths.length) throw new Error('No geometry for ' + feature.id);
    const id = catalog.length;
    let vertices = 0;
    for (const [partIndex, path] of paths.entries()) {
      if (path.length < 2) throw new Error('Invalid part of ' + feature.id);
      let lastX = path[0][0];
      const points = path.map(([x, y]) => {
        if (![x,y].every(Number.isFinite) || Math.abs(y) > 90) throw new Error('Bad coordinates');
        const longitude = x + 360 * Math.round((lastX - x) / 360);
        lastX = longitude;
        return [Math.round(longitude * scale), Math.round(y * scale)];
      });
      vertices += points.length;
      for (let start = 0; start < points.length - 1; start += 96) {
        const part = points.slice(start, start + 97);
        const x = part.map(p => p[0]), y = part.map(p => p[1]);
        const box = [Math.min(...x), Math.min(...y), Math.max(...x), Math.max(...y)];
        records.push([id, box, encodeLine(part), partIndex, start]);
      }
    }
    catalog.push({...feature, parts: paths.length, vertices});
    if (feature.codes.length === 2 && !['marine','water-line'].includes(feature.kind)) pairs.add(feature.codes.join('-'));
  }
  for (const pair of expectedPairs) if (!pairs.has(pair)) throw new Error('Missing neighbour pair ' + pair);
  const tileX = box => Math.floor((((box[0] + box[2]) / (2 * scale) + 180) % 360 + 360) % 360 / 2);
  const tileY = box => Math.floor((box[1] + box[3]) / (4 * scale));
  records.sort((a,b) => tileY(a[1]) - tileY(b[1]) || tileX(a[1]) - tileX(b[1]));
  const pages = [[]], index = {};
  let bytes = 0;
  for (const row of records) {
    const size = row[2].length + 100;
    if (bytes && bytes + size > 200000) { pages.push([]); bytes = 0; }
    const pageId = pages.length - 1;
    pages[pageId].push(row);
    bytes += size;
    const [w,s,e,n] = row[1].map(v => Math.floor(v / (2 * scale)));
    for (let y = s; y <= n; y++) for (let x = w; x <= e; x++) {
      const key = (y + 45) * 180 + ((x + 90) % 180 + 180) % 180;
      const list = index[key] ??= [];
      if (list.at(-1) !== pageId) list.push(pageId);
    }
  }
  const jsonRows = rows => '[\n' + rows.map(r => JSON.stringify(r)).join(',\n') + '\n]\n';
  const files = {'catalog.json': jsonRows(catalog), 'index.json': JSON.stringify(index) + '\n'};
  pages.forEach((rows,id) => { files['lines-' + id + '.json'] = jsonRows(rows); });
  return files;
}
