export const TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION =
  'agid-topographic-coastline-legend-promotion-evidence-v1';

/**
 * Approved promotion evidence consumed by browser-side export gates. Signature
 * verification remains in the Node-only promotion module.
 */
export type CoastlineLegendPromotionEvidence = {
  schemaVersion: typeof TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION;
  status: 'approved';
  sourceId: string;
  sourceVersion: string;
  classificationGeoTiffSha256: `sha256:${string}`;
  receiptSha256: `sha256:${string}`;
  promotionDigest: `sha256:${string}`;
  sequence: number;
  verifiedSignatureCount: number;
  minimumSignatures: number;
};
