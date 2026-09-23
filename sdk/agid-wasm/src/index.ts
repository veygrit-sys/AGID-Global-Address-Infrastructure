export type AgidWasmExports = {
  agid_get_quantized_face(lat: number, lon: number): number;
  agid_get_quantized_qx(lat: number, lon: number): number;
  agid_get_quantized_qy(lat: number, lon: number): number;
  agid_get_lat(face: number, qx: number, qy: number): number;
  agid_get_lon(face: number, qx: number, qy: number): number;
};

export async function loadAgidWasm(wasmUrl: string | URL): Promise<AgidWasmExports> {
  const response = await fetch(wasmUrl);
  const bytes = await response.arrayBuffer();
  const instance = await WebAssembly.instantiate(bytes, {});
  return instance.instance.exports as unknown as AgidWasmExports;
}

export type AgidResult = {
  id: string;
  lat: number;
  lon: number;
  face?: number;
};

export type AgidBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export function encode(_lat: number, _lon: number): AgidResult {
  throw new Error("wire this package to the AGID WASM reference implementation");
}

export function decode(_id: string): AgidResult | null {
  return null;
}

export function cellBounds(_id: string): AgidBounds {
  throw new Error("wire this package to the AGID WASM reference implementation");
}
