import {
  getTopographicFormatDefinition,
  longitudeSpanDegrees,
  type TopographicBounds,
  type TopographicDataset,
  type TopographicExportFormat,
  type TopographicExportPlan,
  type TopographicFeature,
  type TopographicGeometry,
  type TopographicLayerId,
  type TopographicMesh,
} from './topographicExport';
import {
  createTopographicEnuFrame,
  geodeticToEnuPoint,
  type TopographicEnuFrame,
} from './topographicGeodesy';

export type SerializedTopographicExport = {
  format: TopographicExportFormat;
  fileName: string;
  mediaType: string;
  extension: string;
  data: string | Uint8Array;
  byteLength: number;
  includedLayers: TopographicLayerId[];
  warnings: string[];
};

type LocalPoint = [number, number, number];
type LocalVerticalMode = 'ellipsoidal-height' | 'source-height-local-up';

export const TOPOGRAPHIC_GLTF_Z_UP_TO_Y_UP_MATRIX = [
  1, 0, 0, 0,
  0, 0, -1, 0,
  0, 1, 0, 0,
  0, 0, 0, 1,
] as const;

const textEncoder = new TextEncoder();
const PROHIBITED_PROPERTY_KEY = /recipient|addressee|household|person_name|email|phone|private[_-]?key|proof[_-]?secret|credential|address[_-]?line|query[_-]?log/i;

const LAYER_STYLES: Record<string, { stroke: string; fill: string; width: number }> = {
  buildings: { stroke: '#111827', fill: '#cbd5e1', width: 1.4 },
  'building-roofs-lod2': { stroke: '#7c2d12', fill: '#fdba74', width: 1.2 },
  'cadastral-parcels': { stroke: '#9333ea', fill: 'none', width: 0.8 },
  roads: { stroke: '#f97316', fill: 'none', width: 2.5 },
  railways: { stroke: '#334155', fill: 'none', width: 1.5 },
  waterways: { stroke: '#0284c7', fill: 'none', width: 2 },
  'building-shadows': { stroke: '#64748b', fill: '#94a3b8', width: 0.5 },
  'trees-green-spaces': { stroke: '#15803d', fill: '#4ade80', width: 1 },
  'trees-hedges': { stroke: '#166534', fill: 'none', width: 2 },
  'contour-lines': { stroke: '#92400e', fill: 'none', width: 0.8 },
};

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapePdf(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function safeFileStem(value: string) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return normalized || 'agid-topography';
}

function featureCoordinates(geometry: TopographicGeometry): Array<[number, number, number?]> {
  if (geometry.type === 'Point') return [geometry.coordinates];
  if (geometry.type === 'LineString') return geometry.coordinates;
  return geometry.coordinates[0] ?? [];
}

function longitudeRatio(longitude: number, bounds: TopographicBounds) {
  const span = longitudeSpanDegrees(bounds);
  let delta = longitude - bounds.west;
  if (delta < 0) delta += 360;
  return delta / span;
}

function toCanvasPoint(
  coordinate: [number, number, number?],
  bounds: TopographicBounds,
  width: number,
  height: number,
): [number, number] {
  return [
    longitudeRatio(coordinate[0], bounds) * width,
    height - ((coordinate[1] - bounds.south) / (bounds.north - bounds.south)) * height,
  ];
}

function toLocalPoint(
  coordinate: [number, number, number?],
  frame: TopographicEnuFrame,
  verticalMode: LocalVerticalMode,
): LocalPoint {
  const height = coordinate[2] ?? 0;
  const local = geodeticToEnuPoint(
    coordinate[0],
    coordinate[1],
    verticalMode === 'ellipsoidal-height' ? height : 0,
    frame,
  );
  if (verticalMode === 'source-height-local-up') local[2] += height;
  return local;
}

function localVerticalMode(plan: TopographicExportPlan): LocalVerticalMode {
  const verticalDatums = plan.selectedSources.flatMap(source => {
    const value = source.snapshotEvidence?.verticalDatum.trim().toUpperCase();
    return value ? [value] : [];
  });
  return verticalDatums.length > 0
    && verticalDatums.every(value => (
      value === 'EPSG:4979'
      || value === 'WGS 84 ELLIPSOIDAL HEIGHT (EPSG:4979)'
    ))
    ? 'ellipsoidal-height'
    : 'source-height-local-up';
}

function selectedDatasetParts(dataset: TopographicDataset, plan: TopographicExportPlan) {
  const selectedLayers = new Set(plan.request.layerIds);
  const features = dataset.features.filter(feature => selectedLayers.has(feature.layerId));
  const meshes = dataset.meshes.filter(mesh => selectedLayers.has(mesh.layerId));
  const rasters = dataset.rasters.filter(raster => selectedLayers.has(raster.layerId));
  return { features, meshes, rasters };
}

function verifySerializationInput(dataset: TopographicDataset, plan: TopographicExportPlan) {
  if (plan.status !== 'ready') throw new Error('topographic-export-plan-blocked');
  if (plan.request.dataMode === 'synthetic' && !dataset.synthetic) {
    throw new Error('synthetic-plan-requires-synthetic-dataset');
  }
  if (plan.request.dataMode === 'source-backed' && dataset.synthetic) {
    throw new Error('source-backed-plan-rejects-synthetic-dataset');
  }
  const areaMismatch = Math.abs(
    longitudeSpanDegrees(dataset.bounds) - longitudeSpanDegrees(plan.request.bounds),
  ) > 1e-9;
  if (
    areaMismatch
    || Math.abs(dataset.bounds.south - plan.request.bounds.south) > 1e-9
    || Math.abs(dataset.bounds.north - plan.request.bounds.north) > 1e-9
    || Math.abs(dataset.bounds.west - plan.request.bounds.west) > 1e-9
    || Math.abs(dataset.bounds.east - plan.request.bounds.east) > 1e-9
  ) {
    throw new Error('dataset-bounds-do-not-match-plan');
  }
  const selectedSourceIds = new Set(plan.selectedSources.map(source => source.sourceId));
  const parts = selectedDatasetParts(dataset, plan);
  const unexpectedSource = [
    ...parts.features.map(feature => feature.sourceId),
    ...parts.meshes.map(mesh => mesh.sourceId),
    ...parts.rasters.map(raster => raster.sourceId),
  ].find(sourceId => !selectedSourceIds.has(sourceId));
  if (unexpectedSource) throw new Error(`dataset-source-not-in-plan:${unexpectedSource}`);

  for (const feature of parts.features) {
    const prohibitedKey = Object.keys(feature.properties).find(key => PROHIBITED_PROPERTY_KEY.test(key));
    if (prohibitedKey) throw new Error(`prohibited-topographic-property:${prohibitedKey}`);
  }
}

function serializeGeoJson(dataset: TopographicDataset, features: TopographicFeature[]) {
  return JSON.stringify({
    type: 'FeatureCollection',
    name: dataset.title,
    bbox: [dataset.bounds.west, dataset.bounds.south, dataset.bounds.east, dataset.bounds.north],
    agid_export: {
      dataset_id: dataset.datasetId,
      crs: dataset.crs,
      generated_at: dataset.generatedAt,
      synthetic: dataset.synthetic,
    },
    features: features.map(feature => ({
      type: 'Feature',
      id: feature.id,
      geometry: feature.geometry,
      properties: {
        ...feature.properties,
        agid_layer: feature.layerId,
        source_id: feature.sourceId,
      },
    })),
  }, null, 2);
}

function serializeSvg(dataset: TopographicDataset, features: TopographicFeature[]) {
  const width = 1_200;
  const height = 800;
  const elements = features.map(feature => {
    const style = LAYER_STYLES[feature.layerId] ?? { stroke: '#111827', fill: 'none', width: 1 };
    const coordinates = featureCoordinates(feature.geometry);
    const projected = coordinates.map(point => toCanvasPoint(point, dataset.bounds, width, height));
    const common = `data-id="${escapeXml(feature.id)}" data-layer="${feature.layerId}" stroke="${style.stroke}" fill="${style.fill}" stroke-width="${style.width}" vector-effect="non-scaling-stroke"`;
    if (feature.geometry.type === 'Point') {
      const [x, y] = projected[0];
      return `<circle ${common} cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="5"/>`;
    }
    const points = projected.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ');
    if (feature.geometry.type === 'Polygon') return `<polygon ${common} points="${points}"/>`;
    return `<polyline ${common} points="${points}"/>`;
  }).join('\n  ');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `  <title>${escapeXml(dataset.title)}</title>`,
    `  <desc>AGID topographic export; synthetic=${dataset.synthetic}; CRS=${escapeXml(dataset.crs)}</desc>`,
    '  <rect width="100%" height="100%" fill="#f8fafc"/>',
    `  ${elements}`,
    '</svg>',
  ].join('\n');
}

function serializeDxf(
  dataset: TopographicDataset,
  features: TopographicFeature[],
  meshes: TopographicMesh[],
  verticalMode: LocalVerticalMode,
) {
  const lines = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1027', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES'];
  const frame = createTopographicEnuFrame(
    dataset.bounds.west,
    dataset.bounds.south,
  );
  for (const feature of features) {
    const points = featureCoordinates(feature.geometry).map(point => toLocalPoint(point, frame, verticalMode));
    const layer = feature.layerId.toUpperCase().replaceAll('-', '_').slice(0, 31);
    if (feature.geometry.type === 'Point') {
      const [x, y, z] = points[0];
      lines.push('0', 'POINT', '8', layer, '10', `${x}`, '20', `${y}`, '30', `${z}`);
      continue;
    }
    lines.push('0', 'POLYLINE', '8', layer, '66', '1', '70', feature.geometry.type === 'Polygon' ? '9' : '8');
    for (const [x, y, z] of points) {
      lines.push('0', 'VERTEX', '8', layer, '10', `${x}`, '20', `${y}`, '30', `${z}`);
    }
    lines.push('0', 'SEQEND', '8', layer);
  }
  for (const mesh of meshes) {
    const vertices = mesh.vertices.map(point => toLocalPoint(point, frame, verticalMode));
    const layer = mesh.layerId.toUpperCase().replaceAll('-', '_').slice(0, 31);
    for (const triangle of mesh.triangles) {
      const points = triangle.map(index => vertices[index]);
      lines.push('0', '3DFACE', '8', layer);
      [...points, points[2]].forEach(([x, y, z], index) => {
        lines.push(`${10 + index}`, `${x}`, `${20 + index}`, `${y}`, `${30 + index}`, `${z}`);
      });
    }
  }
  lines.push('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\n');
}

function pdfPathForFeature(feature: TopographicFeature, bounds: TopographicBounds) {
  const width = 760;
  const height = 500;
  const points = featureCoordinates(feature.geometry).map(point => toCanvasPoint(point, bounds, width, height));
  if (feature.geometry.type === 'Point') {
    const [x, y] = points[0];
    return `${(x - 2).toFixed(2)} ${(y - 2).toFixed(2)} 4 4 re B`;
  }
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  const body = [`${first[0].toFixed(2)} ${first[1].toFixed(2)} m`];
  for (const [x, y] of rest) body.push(`${x.toFixed(2)} ${y.toFixed(2)} l`);
  body.push(feature.geometry.type === 'Polygon' ? 'h B' : 'S');
  return body.join('\n');
}

function buildPdf(objects: string[]) {
  const header = '%PDF-1.4\n%AGID\n';
  let body = '';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(textEncoder.encode(header + body).byteLength);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = textEncoder.encode(header + body).byteLength;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `),
  ].join('\n');
  return `${header}${body}${xref}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
}

function serializePdf(dataset: TopographicDataset, features: TopographicFeature[]) {
  const commands = [
    'q',
    '1 0 0 1 26 110 cm',
    '0.25 w',
    '0.15 0.23 0.34 RG',
    '0.88 0.91 0.95 rg',
    ...features.map(feature => pdfPathForFeature(feature, dataset.bounds)),
    'Q',
    'BT /F1 14 Tf 28 800 Td',
    `(${escapePdf(dataset.title)}) Tj`,
    '0 -20 Td /F1 8 Tf',
    `(CRS ${escapePdf(dataset.crs)} | synthetic ${dataset.synthetic ? 'true' : 'false'}) Tj`,
    'ET',
  ].join('\n');
  const streamLength = textEncoder.encode(commands).byteLength;
  return buildPdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 820 840] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${streamLength} >>\nstream\n${commands}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]);
}

function meshGeometry(
  dataset: TopographicDataset,
  features: TopographicFeature[],
  meshes: TopographicMesh[],
  verticalMode: LocalVerticalMode,
) {
  const frame = createTopographicEnuFrame(
    dataset.bounds.west,
    dataset.bounds.south,
  );
  const vertices: LocalPoint[] = [];
  const triangles: Array<[number, number, number]> = [];
  const lines: Array<[number, number]> = [];
  const points: number[] = [];

  for (const mesh of meshes) {
    const offset = vertices.length;
    vertices.push(...mesh.vertices.map(point => toLocalPoint(point, frame, verticalMode)));
    triangles.push(...mesh.triangles.map(([a, b, c]) => [a + offset, b + offset, c + offset] as [number, number, number]));
  }

  for (const feature of features) {
    const coordinates = featureCoordinates(feature.geometry);
    const offset = vertices.length;
    vertices.push(...coordinates.map(point => toLocalPoint(point, frame, verticalMode)));
    if (feature.geometry.type === 'Point') {
      points.push(offset);
    } else if (feature.geometry.type === 'LineString') {
      for (let index = 1; index < coordinates.length; index += 1) {
        lines.push([offset + index - 1, offset + index]);
      }
    } else {
      const uniqueCount = coordinates.length > 2
        && coordinates[0][0] === coordinates.at(-1)?.[0]
        && coordinates[0][1] === coordinates.at(-1)?.[1]
        ? coordinates.length - 1
        : coordinates.length;
      for (let index = 1; index < uniqueCount - 1; index += 1) {
        triangles.push([offset, offset + index, offset + index + 1]);
      }
    }
  }
  return { vertices, triangles, lines, points };
}

function serializeObj(
  dataset: TopographicDataset,
  features: TopographicFeature[],
  meshes: TopographicMesh[],
  verticalMode: LocalVerticalMode,
) {
  const geometry = meshGeometry(dataset, features, meshes, verticalMode);
  const lines = [
    `# ${dataset.title}`,
    `# CRS ${dataset.crs}; synthetic=${dataset.synthetic}`,
    'o AGID_Topographic_Export',
    ...geometry.vertices.map(([x, y, z]) => `v ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)}`),
    ...geometry.points.map(index => `p ${index + 1}`),
    ...geometry.lines.map(([a, b]) => `l ${a + 1} ${b + 1}`),
    ...geometry.triangles.map(([a, b, c]) => `f ${a + 1} ${b + 1} ${c + 1}`),
  ];
  return lines.join('\n');
}

function triangleNormal(a: LocalPoint, b: LocalPoint, c: LocalPoint): LocalPoint {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz) || 1;
  return [nx / length, ny / length, nz / length];
}

function serializeStl(
  dataset: TopographicDataset,
  features: TopographicFeature[],
  meshes: TopographicMesh[],
  verticalMode: LocalVerticalMode,
) {
  const geometry = meshGeometry(dataset, features, meshes, verticalMode);
  if (geometry.triangles.length === 0) throw new Error('stl-requires-triangle-geometry');
  const facets = geometry.triangles.map(([aIndex, bIndex, cIndex]) => {
    const a = geometry.vertices[aIndex];
    const b = geometry.vertices[bIndex];
    const c = geometry.vertices[cIndex];
    const normal = triangleNormal(a, b, c);
    return [
      `  facet normal ${normal.join(' ')}`,
      '    outer loop',
      `      vertex ${a.join(' ')}`,
      `      vertex ${b.join(' ')}`,
      `      vertex ${c.join(' ')}`,
      '    endloop',
      '  endfacet',
    ].join('\n');
  }).join('\n');
  return `solid AGID_Topographic_Export\n${facets}\nendsolid AGID_Topographic_Export\n`;
}

function bytesToBase64(bytes: Uint8Array) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const c = index + 2 < bytes.length ? bytes[index + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    output += alphabet[(triple >>> 18) & 63];
    output += alphabet[(triple >>> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(triple >>> 6) & 63] : '=';
    output += index + 2 < bytes.length ? alphabet[triple & 63] : '=';
  }
  return output;
}

function align4(value: number) {
  return (value + 3) & ~3;
}

function serializeGltf(
  dataset: TopographicDataset,
  features: TopographicFeature[],
  meshes: TopographicMesh[],
  verticalMode: LocalVerticalMode,
) {
  const geometry = meshGeometry(dataset, features, meshes, verticalMode);
  if (geometry.vertices.length === 0) throw new Error('gltf-requires-geometry');

  const positionBytes = new Uint8Array(new Float32Array(geometry.vertices.flat()).buffer);
  const triangleBytes = new Uint8Array(new Uint32Array(geometry.triangles.flat()).buffer);
  const lineBytes = new Uint8Array(new Uint32Array(geometry.lines.flat()).buffer);
  const pointBytes = new Uint8Array(new Uint32Array(geometry.points).buffer);
  const chunks = [positionBytes, triangleBytes, lineBytes, pointBytes];
  const offsets: number[] = [];
  let totalLength = 0;
  for (const chunk of chunks) {
    offsets.push(totalLength);
    totalLength = align4(totalLength + chunk.byteLength);
  }
  const binary = new Uint8Array(totalLength);
  chunks.forEach((chunk, index) => binary.set(chunk, offsets[index]));

  const mins = [0, 1, 2].map(axis => Math.min(...geometry.vertices.map(point => point[axis])));
  const maxs = [0, 1, 2].map(axis => Math.max(...geometry.vertices.map(point => point[axis])));
  const bufferViews: Array<Record<string, number>> = [{
    buffer: 0,
    byteOffset: offsets[0],
    byteLength: positionBytes.byteLength,
    target: 34962,
  }];
  const accessors: Array<Record<string, unknown>> = [{
    bufferView: 0,
    componentType: 5126,
    count: geometry.vertices.length,
    type: 'VEC3',
    min: mins,
    max: maxs,
  }];
  const primitives: Array<Record<string, unknown>> = [];

  const addIndexPrimitive = (bytes: Uint8Array, offset: number, count: number, mode: number) => {
    if (count === 0) return;
    const viewIndex = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, target: 34963 });
    const accessorIndex = accessors.length;
    accessors.push({
      bufferView: viewIndex,
      componentType: 5125,
      count,
      type: 'SCALAR',
    });
    primitives.push({ attributes: { POSITION: 0 }, indices: accessorIndex, mode });
  };

  addIndexPrimitive(triangleBytes, offsets[1], geometry.triangles.length * 3, 4);
  addIndexPrimitive(lineBytes, offsets[2], geometry.lines.length * 2, 1);
  addIndexPrimitive(pointBytes, offsets[3], geometry.points.length, 0);

  return JSON.stringify({
    asset: {
      version: '2.0',
      generator: 'AGID topographic export',
      extras: {
        datasetId: dataset.datasetId,
        crs: dataset.crs,
        synthetic: dataset.synthetic,
        localFrame: 'WGS84-ECEF-to-ENU',
        sourceAxes: 'longitude-latitude-ellipsoidal-height',
        meshAxes: 'x-east-y-north-z-up',
        gltfAxes: 'x-east-y-up-z-south',
        verticalMode,
        origin: {
          longitudeDegrees: dataset.bounds.west,
          latitudeDegrees: dataset.bounds.south,
          ellipsoidalHeightMeters: 0,
        },
      },
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{
      mesh: 0,
      matrix: [...TOPOGRAPHIC_GLTF_Z_UP_TO_Y_UP_MATRIX],
      name: 'AGID Topographic Export',
    }],
    meshes: [{ primitives }],
    buffers: [{
      byteLength: binary.byteLength,
      uri: `data:application/octet-stream;base64,${bytesToBase64(binary)}`,
    }],
    bufferViews,
    accessors,
  }, null, 2);
}

function serializeIfc(
  dataset: TopographicDataset,
  features: TopographicFeature[],
  meshes: TopographicMesh[],
  verticalMode: LocalVerticalMode,
) {
  const geometry = meshGeometry(dataset, features, meshes, verticalMode);
  if (geometry.triangles.length === 0) throw new Error('ifc-requires-triangle-geometry');
  const points = geometry.vertices
    .map(([x, y, z]) => `(${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)})`)
    .join(',');
  const triangles = geometry.triangles
    .map(([a, b, c]) => `(${a + 1},${b + 1},${c + 1})`)
    .join(',');
  const timestamp = dataset.generatedAt.replace(/\.\d{3}Z$/, '');
  return [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_DESCRIPTION(('ViewDefinition [ReferenceView_V1.2]'),'2;1');",
    `FILE_NAME('${safeFileStem(dataset.title)}','${timestamp}',('AGID'),('AGID'),'AGID topographic export','AGID','');`,
    "FILE_SCHEMA(('IFC4'));",
    'ENDSEC;',
    'DATA;',
    "#1=IFCPERSON($,$,'AGID',$,$,$,$,$);",
    "#2=IFCORGANIZATION($,'AGID',$,$,$);",
    '#3=IFCPERSONANDORGANIZATION(#1,#2,$);',
    "#4=IFCAPPLICATION(#2,'0.1','AGID topographic export','AGID_TOPO');",
    '#5=IFCOWNERHISTORY(#3,#4,$,.ADDED.,$,$,$,0);',
    '#6=IFCCARTESIANPOINT((0.,0.,0.));',
    '#7=IFCDIRECTION((0.,0.,1.));',
    '#8=IFCDIRECTION((1.,0.,0.));',
    '#9=IFCAXIS2PLACEMENT3D(#6,#7,#8);',
    "#10=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-5,#9,$);",
    "#11=IFCPROJECT('2uYAGIDTOPOGRAPHY000001',#5,'AGID Topographic Export',$,$,$,$,(#10),$);",
    `#12=IFCCARTESIANPOINTLIST3D((${points}));`,
    `#13=IFCTRIANGULATEDFACESET(#12,$,.T.,(${triangles}),$);`,
    "#14=IFCSHAPEREPRESENTATION(#10,'Body','Tessellation',(#13));",
    '#15=IFCPRODUCTDEFINITIONSHAPE($,$,(#14));',
    "#16=IFCBUILDINGELEMENTPROXY('2uYAGIDTOPOGRAPHY000002',#5,'AGID Topographic Mesh',$,$,$,#15,$,$);",
    'ENDSEC;',
    'END-ISO-10303-21;',
  ].join('\n');
}

function serializeRawText(
  dataset: TopographicDataset,
  features: TopographicFeature[],
  meshes: TopographicMesh[],
) {
  const lines = [
    `# ${dataset.title}`,
    `dataset_id=${dataset.datasetId}`,
    `crs=${dataset.crs}`,
    `generated_at=${dataset.generatedAt}`,
    `synthetic=${dataset.synthetic}`,
    `bounds=${dataset.bounds.west},${dataset.bounds.south},${dataset.bounds.east},${dataset.bounds.north}`,
  ];
  for (const feature of features) {
    lines.push([
      'FEATURE',
      feature.id,
      feature.layerId,
      feature.geometry.type,
      JSON.stringify(feature.geometry.coordinates),
      JSON.stringify(feature.properties),
      feature.sourceId,
    ].join('\t'));
  }
  for (const mesh of meshes) {
    lines.push([
      'MESH',
      mesh.id,
      mesh.layerId,
      JSON.stringify(mesh.vertices),
      JSON.stringify(mesh.triangles),
      mesh.sourceId,
    ].join('\t'));
  }
  return lines.join('\n');
}

function writeTiffEntry(
  view: DataView,
  offset: number,
  tag: number,
  type: number,
  count: number,
  value: number,
) {
  view.setUint16(offset, tag, true);
  view.setUint16(offset + 2, type, true);
  view.setUint32(offset + 4, count, true);
  if (type === 3 && count === 1) {
    view.setUint16(offset + 8, value, true);
    view.setUint16(offset + 10, 0, true);
  } else {
    view.setUint32(offset + 8, value, true);
  }
}

function serializeGeoTiff(dataset: TopographicDataset, raster: TopographicDataset['rasters'][number]) {
  if (raster.pixels.length !== raster.width * raster.height) {
    throw new Error('geotiff-raster-size-mismatch');
  }

  const entryCount = 13;
  const ifdOffset = 8;
  const ifdSize = 2 + entryCount * 12 + 4;
  const scaleOffset = ifdOffset + ifdSize;
  const tiepointOffset = scaleOffset + 24;
  const geoKeyOffset = tiepointOffset + 48;
  const pixelOffset = geoKeyOffset + 32;
  const output = new Uint8Array(pixelOffset + raster.pixels.length);
  const view = new DataView(output.buffer);

  output[0] = 0x49;
  output[1] = 0x49;
  view.setUint16(2, 42, true);
  view.setUint32(4, ifdOffset, true);
  view.setUint16(ifdOffset, entryCount, true);

  const entries: Array<[number, number, number, number]> = [
    [256, 4, 1, raster.width],
    [257, 4, 1, raster.height],
    [258, 3, 1, 8],
    [259, 3, 1, 1],
    [262, 3, 1, 1],
    [273, 4, 1, pixelOffset],
    [277, 3, 1, 1],
    [278, 4, 1, raster.height],
    [279, 4, 1, raster.pixels.length],
    [284, 3, 1, 1],
    [33550, 12, 3, scaleOffset],
    [33922, 12, 6, tiepointOffset],
    [34735, 3, 16, geoKeyOffset],
  ];
  entries.forEach((entry, index) => writeTiffEntry(view, ifdOffset + 2 + index * 12, ...entry));
  view.setUint32(ifdOffset + 2 + entryCount * 12, 0, true);

  const xScale = longitudeSpanDegrees(raster.bounds) / raster.width;
  const yScale = (raster.bounds.north - raster.bounds.south) / raster.height;
  [xScale, yScale, 0].forEach((value, index) => view.setFloat64(scaleOffset + index * 8, value, true));
  [0, 0, 0, raster.bounds.west, raster.bounds.north, 0]
    .forEach((value, index) => view.setFloat64(tiepointOffset + index * 8, value, true));

  const geoKeys = [
    1, 1, 0, 3,
    1024, 0, 1, 2,
    1025, 0, 1, 1,
    2048, 0, 1, 4326,
  ];
  geoKeys.forEach((value, index) => view.setUint16(geoKeyOffset + index * 2, value, true));
  output.set(raster.pixels, pixelOffset);
  void dataset;
  return output;
}

function byteLength(data: string | Uint8Array) {
  return typeof data === 'string' ? textEncoder.encode(data).byteLength : data.byteLength;
}

export function serializeTopographicExport(
  dataset: TopographicDataset,
  plan: TopographicExportPlan,
): SerializedTopographicExport {
  verifySerializationInput(dataset, plan);
  const definition = getTopographicFormatDefinition(plan.request.format);
  if (!definition) throw new Error(`unsupported-topographic-format:${plan.request.format}`);
  const { features, meshes, rasters } = selectedDatasetParts(dataset, plan);
  const verticalMode = localVerticalMode(plan);
  let data: string | Uint8Array;
  const warnings: string[] = [];

  switch (plan.request.format) {
    case 'geojson':
      data = serializeGeoJson(dataset, features);
      break;
    case 'svg':
      data = serializeSvg(dataset, features);
      break;
    case 'dxf':
      data = serializeDxf(dataset, features, meshes, verticalMode);
      break;
    case 'pdf':
      data = serializePdf(dataset, features);
      break;
    case 'obj':
      data = serializeObj(dataset, features, meshes, verticalMode);
      break;
    case 'stl':
      data = serializeStl(dataset, features, meshes, verticalMode);
      break;
    case 'gltf':
      data = serializeGltf(dataset, features, meshes, verticalMode);
      break;
    case 'ifc':
      data = serializeIfc(dataset, features, meshes, verticalMode);
      break;
    case 'txt':
      data = serializeRawText(dataset, features, meshes);
      break;
    case 'tiff': {
      const raster = rasters[0];
      if (!raster) throw new Error('tiff-requires-selected-raster');
      data = serializeGeoTiff(dataset, raster);
      warnings.push('GeoTIFF v0.1 uses WGS84 ModelPixelScale and ModelTiepoint tags; verify target-CAD CRS interpretation.');
      break;
    }
    default:
      throw new Error(`unsupported-topographic-format:${String(plan.request.format)}`);
  }

  if (definition.fidelity === 'geometry-only') {
    warnings.push(`${definition.label} exports geometry and source identity; renderer-specific symbology is not preserved.`);
  }
  if (dataset.synthetic) {
    warnings.push('Synthetic fixture only; output is not a real-world terrain, cadastral, or delivery product.');
  }

  return {
    format: plan.request.format,
    fileName: `${safeFileStem(dataset.datasetId)}.${definition.extension}`,
    mediaType: definition.mediaType,
    extension: definition.extension,
    data,
    byteLength: byteLength(data),
    includedLayers: [...new Set([
      ...features.map(feature => feature.layerId),
      ...meshes.map(mesh => mesh.layerId),
      ...rasters.map(raster => raster.layerId),
    ])],
    warnings,
  };
}
