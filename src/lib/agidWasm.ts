interface AgidWasmExports {
  agid_get_quantized_face(lat: number, lon: number): number;
  agid_get_quantized_qx(lat: number, lon: number): number;
  agid_get_quantized_qy(lat: number, lon: number): number;
  agid_encode_hilbert_hi(qx: number, qy: number): number;
  agid_encode_hilbert_lo(qx: number, qy: number): number;
  agid_decode_hilbert_x(hi: number, lo: number): number;
  agid_decode_hilbert_y(hi: number, lo: number): number;
  agid_get_lat(face: number, qx: number, qy: number): number;
  agid_get_lon(face: number, qx: number, qy: number): number;
  agid_zkp_quality_threshold_satisfied?(scorePercent: number, thresholdPercent: number): number;
  agid_zkp_point_in_bbox?(
    lat: number,
    lon: number,
    north: number,
    south: number,
    west: number,
    east: number
  ): number;
  agid_zkp_point_in_circle?(
    lat: number,
    lon: number,
    centerLat: number,
    centerLon: number,
    radiusMeters: number
  ): number;
}

let wasmCore: AgidWasmExports | null = null;
let isLoading = false;

function hasAllExports(obj: Partial<AgidWasmExports>): obj is AgidWasmExports {
  return !!(
    obj.agid_get_quantized_face &&
    obj.agid_get_quantized_qx &&
    obj.agid_get_quantized_qy &&
    obj.agid_encode_hilbert_hi &&
    obj.agid_encode_hilbert_lo &&
    obj.agid_decode_hilbert_x &&
    obj.agid_decode_hilbert_y &&
    obj.agid_get_lat &&
    obj.agid_get_lon
  );
}

async function initAgidWasm() {
  if (isLoading || wasmCore) return;
  if (typeof window === 'undefined' || typeof WebAssembly === 'undefined') return;

  isLoading = true;
  try {
    const response = await fetch('/wasm/agid_core.wasm', { cache: 'force-cache' });
    if (!response.ok) return;
    const bytes = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, {});
    const exportsObj = instance.exports as Partial<AgidWasmExports>;
    if (hasAllExports(exportsObj)) {
      wasmCore = exportsObj;
    }
  } catch (error) {
    console.warn('[AGID] Failed to load Rust WASM core, fallback to TypeScript core.', error);
  } finally {
    isLoading = false;
  }
}

void initAgidWasm();

export function getAgidWasmCore(): AgidWasmExports | null {
  return wasmCore;
}

export function combineWasmU32Pair(hi: number, lo: number): bigint {
  return (BigInt(hi >>> 0) << 32n) | BigInt(lo >>> 0);
}
