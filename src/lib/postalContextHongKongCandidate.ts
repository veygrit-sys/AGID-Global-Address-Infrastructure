import { createHash } from 'node:crypto';
import { encodeAGID, decodeAGID } from './agid';

// Experimental Node-side intake, not a live service or a published country pack.
// A source field may be displayed as a candidate; it does not prove delivery.
type ObjectValue = Record<string, unknown>;
export type HongKongAlsReceipt = {
  url: string;
  observedAt: string;
  responseDigest: string;
  termsUrl: 'https://data.gov.hk/en/terms-and-conditions';
  termsDigest: string;
};
export const hongKongDigest = (value: Uint8Array | string) =>
  `sha256:${createHash('sha256').update(value).digest('hex')}`;
const SHA = /^sha256:[a-f0-9]{64}$/;
const object = (v: unknown): v is ObjectValue => !!v && typeof v === 'object' && !Array.isArray(v);
function shape(v: unknown, allowed: string[]): ObjectValue {
  if (!object(v) || Object.keys(v).some(k => !allowed.includes(k))) throw new Error('hk-unreviewed-object-shape');
  return v;
}
function text(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || v.length > 512 || !v.trim() || /[\x00-\x1f\x7f<>]/.test(v)) throw new Error('hk-invalid-text');
  return v; // Preserve source spacing, script and number suffixes; do not translate.
}
function decimal(v: unknown): number | null {
  const s = text(v);
  if (s === null) return null;
  if (!/^-?\d+(?:\.\d+)?$/.test(s) || !Number.isFinite(Number(s))) throw new Error('hk-invalid-coordinate');
  return Number(s);
}
export function parseHongKongGeoAddress(value: unknown) {
  if (typeof value !== 'string' || !/^\d{10}[PT]\d{8}$/.test(value)) throw new Error('hk-invalid-geoaddress');
  const day = `${value.slice(11, 15)}-${value.slice(15, 17)}-${value.slice(17)}`;
  const parsed = new Date(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== day) throw new Error('hk-invalid-geoaddress-date');
  return { value, namespace: 'hk_geoaddress' as const, kind: value[10] === 'P' ? 'podium' as const : 'tower' as const,
    recordCreatedOn: day, creationDateIsValidity: false as const };
}
function way(value: unknown, kind: 'Street' | 'Village') {
  if (value === undefined || value === null) return null;
  const v = shape(value, [kind + 'Name', 'LocationName', 'BuildingNoFrom', 'BuildingNoTo']);
  const from = text(v.BuildingNoFrom), to = text(v.BuildingNoTo);
  if (to !== null && from === null) throw new Error('hk-number-end-without-start');
  return { name: text(v[kind + 'Name']), locationName: text(v.LocationName), numberFrom: from, numberTo: to,
    numberSemantics: to && to !== from ? 'source-endpoints-not-enumerated' as const : 'source-single-or-missing' as const };
}
function language(value: unknown, prefix: 'Eng' | 'Chi') {
  if (value === undefined || value === null) return null;
  if (object(value) && `${prefix}3dAddress` in value) throw new Error('hk-floor-unit-outside-reviewed-scope');
  const v = shape(value, ['BuildingName', 'Region', prefix + 'District', prefix + 'Street', prefix + 'Village', prefix + 'Block', prefix + 'Estate']);
  const block = v[prefix + 'Block'] == null ? null : shape(v[prefix + 'Block'], ['BlockDescriptor', 'BlockNo', 'BlockDescriptorPrecedenceIndicator']);
  const estate = v[prefix + 'Estate'] == null ? null : shape(v[prefix + 'Estate'], ['EstateName', prefix + 'Phase']);
  const phase = estate?.[prefix + 'Phase'] == null ? null : shape(estate[prefix + 'Phase'], ['PhaseName', 'PhaseNo']);
  const district = v[prefix + 'District'] == null ? null : shape(v[prefix + 'District'], ['DcDistrict']);
  return { buildingName: text(v.BuildingName), region: text(v.Region), district: district && text(district.DcDistrict),
    street: way(v[prefix + 'Street'], 'Street'), village: way(v[prefix + 'Village'], 'Village'),
    block: block && { descriptor: text(block.BlockDescriptor), number: text(block.BlockNo), orderIndicator: text(block.BlockDescriptorPrecedenceIndicator) },
    estate: estate && { name: text(estate.EstateName), phaseName: phase && text(phase.PhaseName), phaseNumber: phase && text(phase.PhaseNo) } };
}
function location(value: unknown) {
  if (value === undefined || value === null) return { point: null, grid: null };
  const v = shape(value, ['Latitude', 'Longitude', 'Easting', 'Northing']);
  const lat = decimal(v.Latitude), lon = decimal(v.Longitude), e = decimal(v.Easting), n = decimal(v.Northing);
  if ((lat === null) !== (lon === null) || (e === null) !== (n === null)) throw new Error('hk-incomplete-coordinate-pair');
  if (lat !== null && lon !== null && (lat < -90 || lat > 90 || lon < -180 || lon > 180)) throw new Error('hk-coordinate-out-of-range');
  // Broad sanity box, not a political boundary, accuracy guarantee or coverage mask.
  if (lat !== null && lon !== null && (lat < 22 || lat > 23 || lon < 113.5 || lon > 115)) throw new Error('hk-coordinate-outside-review-sanity-box');
  return { point: lat === null || lon === null ? null : { type: 'Point' as const, coordinates: [lon, lat] as [number, number], crs: 'EPSG:4326' as const },
    grid: e === null || n === null ? null : { easting: e, northing: n, crs: 'HK1980 Grid' as const } };
}

export function parseHongKongAlsCandidates(bytes: Uint8Array, receipt: HongKongAlsReceipt, maxRows = 10) {
  if (bytes.byteLength === 0 || bytes.byteLength > 2 * 1024 * 1024 || !Number.isInteger(maxRows) || maxRows < 1 || maxRows > 200) throw new Error('hk-response-limit');
  const u = new URL(receipt.url);
  if (u.protocol !== 'https:' || u.hostname !== 'www.als.gov.hk' || u.port || u.username || u.password || !['/lookup', '/galookup'].includes(u.pathname)
    || receipt.termsUrl !== 'https://data.gov.hk/en/terms-and-conditions' || !SHA.test(receipt.termsDigest)
    || !SHA.test(receipt.responseDigest) || hongKongDigest(bytes) !== receipt.responseDigest
    || !/^\d{4}-\d{2}-\d{2}T/.test(receipt.observedAt) || !Number.isFinite(Date.parse(receipt.observedAt))) throw new Error('hk-invalid-receipt');
  let raw: unknown;
  try { raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw new Error('hk-invalid-json'); }
  const data = shape(raw, ['RequestAddress', 'SuggestedAddress']);
  const request = shape(data.RequestAddress, ['AddressLine']);
  if (!Array.isArray(request.AddressLine) || request.AddressLine.some(v => typeof v !== 'string') || request.AddressLine.length > 8) throw new Error('hk-request-echo-shape');
  if (!Array.isArray(data.SuggestedAddress) || data.SuggestedAddress.length > maxRows) throw new Error('hk-row-limit-or-shape');
  const seen = new Map<string, number>();
  const candidates = data.SuggestedAddress.map((item: unknown, index: number) => {
    const row = shape(item, ['Address', 'ValidationInformation']);
    const address = shape(row.Address, ['PremisesAddress']);
    const p = shape(address.PremisesAddress, ['GeoAddress', 'EngPremisesAddress', 'ChiPremisesAddress', 'GeospatialInformation']);
    const en = language(p.EngPremisesAddress, 'Eng'), zhHant = language(p.ChiPremisesAddress, 'Chi');
    if (!en && !zhHant) throw new Error('hk-missing-address-language');
    const ga = parseHongKongGeoAddress(p.GeoAddress);
    if (ga.recordCreatedOn > receipt.observedAt.slice(0, 10)) throw new Error('hk-future-record-creation');
    const validation = row.ValidationInformation == null ? null : shape(row.ValidationInformation, ['Score']);
    const score = validation?.Score ?? null;
    if (score !== null && (typeof score !== 'number' || !Number.isFinite(score))) throw new Error('hk-invalid-rank-score');
    const geo = location(p.GeospatialInformation);
    const tuple = JSON.stringify([ga.value, en, zhHant, geo]);
    seen.set(tuple, (seen.get(tuple) ?? 0) + 1);
    return { schemaVersion: 'hk-als-context-candidate/v1' as const, countryCode: 'HK' as const, status: 'candidate' as const,
      postal: { status: 'not_used' as const, code: null, geometryType: 'none' as const },
      geoAddress: ga, address: { en, zhHant }, location: geo,
      fieldEvidence: { relation: 'direct_source_fields' as const, sourcePointer: `/SuggestedAddress/${index}/Address/PremisesAddress`,
        buildingNameIsFootprintIdentity: false, streetNumbersExpanded: false },
      source: { url: receipt.url, observedAt: receipt.observedAt, responseDigest: receipt.responseDigest,
        termsUrl: receipt.termsUrl, termsDigest: receipt.termsDigest, sourceId: 'hk-als' as const,
        recordPointer: `/SuggestedAddress/${index}`, sourceEdition: null, validFrom: null, validTo: null },
      ranking: { score, purpose: 'source-ordering-only' as const, confidence: null },
      assertions: { postalAssignment: false, postalPolygon: false, exactBuildingFootprint: false, entrance: false, unit: false, deliverability: false } };
  });
  return { candidates, summary: { observedRows: candidates.length, distinctGeoAddresses: new Set(candidates.map(c => c.geoAddress.value)).size,
    repeatedGeoAddressRows: candidates.length - new Set(candidates.map(c => c.geoAddress.value)).size,
    excessDuplicateRows: [...seen.values()].reduce((n, v) => n + v - 1, 0),
    missingEnglishRows: candidates.filter(c => !c.address.en).length, missingChineseRows: candidates.filter(c => !c.address.zhHant).length,
    missingPointRows: candidates.filter(c => !c.location.point).length,
    bilingualBuildingNameRows: candidates.filter(c => c.address.en?.buildingName && c.address.zhHant?.buildingName).length,
    numberEndpointRows: candidates.filter(c => [c.address.en?.street, c.address.en?.village, c.address.zhHant?.street, c.address.zhHant?.village].some(w => w?.numberFrom)).length,
    rangeRows: candidates.filter(c => [c.address.en?.street, c.address.en?.village, c.address.zhHant?.street, c.address.zhHant?.village].some(w => w?.numberSemantics === 'source-endpoints-not-enumerated')).length,
    scoredRows: candidates.filter(c => c.ranking.score !== null).length,
    postalCodesInferred: 0, postalPolygonsCreated: 0, recordsDeduplicated: 0, floorUnitRecords: 0 } };
}

export function linkHongKongCandidateCell(candidate: ReturnType<typeof parseHongKongAlsCandidates>['candidates'][number]) {
  const point = candidate.location.point;
  if (!point) return null;
  const [lon, lat] = point.coordinates, encoded = encodeAGID(lat, lon), decoded = decodeAGID(encoded.id);
  if (!decoded || decoded.face !== encoded.face || decoded.qx !== encoded.qx || decoded.qy !== encoded.qy) throw new Error('hk-agid-cell-roundtrip');
  return { agidCellId: encoded.id, sourceCountryCode: candidate.countryCode, encodedPrefix: encoded.prefix,
    relation: 'coordinate-cell-only' as const, postalAssignment: false, buildingIdentity: false, countryIdentityOverridden: false };
}
