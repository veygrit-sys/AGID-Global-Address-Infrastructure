import type {
  TopographicExportPlan,
  TopographicSourceRecord,
} from './topographicExport';
import {
  AGID_SYNTHETIC_TOPO_SOURCE,
  buildTopographicExportPlan,
} from './topographicExport';
import {
  COASTAL_SURFACE_BREAKLINE,
  COASTAL_SURFACE_LAND,
  COASTAL_SURFACE_OCEAN,
  createCoastalGridLattice,
  hashCoastalGridLattice,
  reconcileCoastalElevationGrids,
  type CoastalSeamResult,
} from './topographicCoastalSeam';
import {
  TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION,
  type CoastlineLegendPromotionEvidence,
} from './topographicCoastlineLegendPromotionContract';
import { vectorizeNormalizedElevationGrid } from './topographicElevationVectorizer';
import { serializeTopographicExport } from './topographicExportSerializers';

export const TOPOGRAPHIC_COASTAL_MANIFEST_VERSION =
  'agid-topographic-coastal-manifest-v0.1';
export const TOPOGRAPHIC_COASTAL_MANIFEST_MEDIA_TYPE =
  'application/vnd.agid.topographic-coastal-manifest+json';
export const TOPOGRAPHIC_COASTAL_EVIDENCE_VERSION =
  'agid-topographic-coastal-evidence-v0.1';
export const TOPOGRAPHIC_COASTAL_EVIDENCE_MEDIA_TYPE =
  'application/vnd.agid.topographic-coastal-evidence+json';

export type SerializedCoastalSeamManifest = {
  mediaType: typeof TOPOGRAPHIC_COASTAL_MANIFEST_MEDIA_TYPE;
  extension: '.coastal-manifest.json';
  data: string;
  byteLength: number;
  contentSha256: `sha256:${string}`;
};

export type SerializedCoastalTerrainGltfBundle = {
  model: {
    mediaType: 'model/gltf+json';
    extension: '.gltf';
    data: string;
    byteLength: number;
    contentSha256: `sha256:${string}`;
  };
  manifest: SerializedCoastalSeamManifest;
};

export type SerializedCoastalTerrainEvidenceSidecar = {
  mediaType: typeof TOPOGRAPHIC_COASTAL_EVIDENCE_MEDIA_TYPE;
  extension: '.coastal-evidence.json';
  data: string;
  byteLength: number;
  contentSha256: `sha256:${string}`;
};

export type SerializedCoastalTerrainGltfEvidenceBundle =
  SerializedCoastalTerrainGltfBundle & {
    evidenceSidecar: SerializedCoastalTerrainEvidenceSidecar;
  };

export type SyntheticCoastalTerrainBundleRequest = {
  bounds: CoastalSeamResult['grid']['bounds'];
  countryCode?: string;
  generatedAt: string;
};

type CoastalSourceRole = 'land' | 'bathymetry' | 'coastline';

type PublishedCoastlineLegendPromotion = {
  schemaVersion: typeof TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION;
  status: 'approved';
  receiptSha256: `sha256:${string}`;
  promotionDigest: `sha256:${string}`;
  sequence: number;
  verifiedSignatureCount: number;
  minimumSignatures: number;
};

function requireSha256(field: string, value: string) {
  if (!/^sha256:[a-f0-9]{64}$/i.test(value)) {
    throw new Error(`${field} must be a SHA-256 digest.`);
  }
}

function requireHttpsUrl(field: string, value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${field} must be a valid HTTPS URL.`);
  }
  if (url.protocol !== 'https:') {
    throw new Error(`${field} must be a valid HTTPS URL.`);
  }
}

function requireReadySource(
  role: CoastalSourceRole,
  gate: TopographicExportPlan,
  expected: {
    sourceId: string;
    version: string;
    termsUrl: string;
    correctionUrl: string;
    snapshotSha256: `sha256:${string}`;
  },
) {
  if (gate.status !== 'ready') {
    throw new Error(`${role} source gate must be ready before serialization.`);
  }
  if (gate.selectedSources.length !== 1) {
    throw new Error(`${role} source gate must select exactly one source.`);
  }
  const source = gate.selectedSources[0];
  if (
    source.sourceId !== expected.sourceId ||
    source.version !== expected.version
  ) {
    throw new Error(`${role} source identity does not match seam provenance.`);
  }
  if (
    source.termsUrl !== expected.termsUrl ||
    source.correctionUrl !== expected.correctionUrl
  ) {
    throw new Error(`${role} source rights evidence does not match provenance.`);
  }
  requireHttpsUrl(`${role} source URL`, source.sourceUrl);
  requireHttpsUrl(`${role} terms URL`, source.termsUrl);
  requireHttpsUrl(`${role} correction URL`, source.correctionUrl);
  if (source.reuseStatus !== 'approved') {
    throw new Error(`${role} source reuse must be approved.`);
  }
  if (
    !source.snapshotEvidence ||
    source.snapshotEvidence.contentSha256.toLowerCase() !==
      expected.snapshotSha256.toLowerCase()
  ) {
    throw new Error(`${role} structured snapshot evidence does not match provenance.`);
  }
  return source;
}

function publicSourceRecord(
  role: CoastalSourceRole,
  source: TopographicSourceRecord,
  snapshotSha256: `sha256:${string}`,
) {
  return {
    role,
    sourceId: source.sourceId,
    publisher: source.publisher,
    product: source.product,
    sourceUrl: source.sourceUrl,
    termsUrl: source.termsUrl,
    licenseId: source.licenseId,
    version: source.version,
    publishedAt: source.publishedAt,
    retrievedAt: source.retrievedAt,
    freshUntil: source.freshUntil ?? null,
    attribution: source.attribution,
    correctionUrl: source.correctionUrl,
    coverage: source.coverage,
    layerIds: [...source.layerIds],
    allowedFormats: [...source.allowedFormats],
    reuseStatus: source.reuseStatus,
    syntheticOnly: source.syntheticOnly === true,
    snapshotSha256,
    adapterVersion: source.snapshotEvidence?.adapterVersion ?? null,
    verifiedAt: source.snapshotEvidence?.verifiedAt ?? null,
    horizontalCrs: source.snapshotEvidence?.horizontalCrs ?? null,
    verticalDatum: source.snapshotEvidence?.verticalDatum ?? null,
  };
}

function sourceBindsRelatedArtifactDigest(
  source: TopographicSourceRecord,
  digest: `sha256:${string}`,
) {
  return (
    source.snapshotEvidence?.relatedArtifactSha256?.some(
      value => value.toLowerCase() === digest.toLowerCase(),
    ) === true
  );
}

function publishCoastlineLegendPromotion(
  source: TopographicSourceRecord,
  snapshotSha256: `sha256:${string}`,
  promotion: CoastlineLegendPromotionEvidence | null,
): PublishedCoastlineLegendPromotion | null {
  if (source.syntheticOnly === true) {
    if (promotion !== null) {
      throw new Error(
        'Synthetic coastline output must not publish independent legend promotion evidence.',
      );
    }
    return null;
  }
  if (!promotion) {
    throw new Error(
      'Source-backed coastline output requires independent legend promotion evidence.',
    );
  }
  if (
    promotion.schemaVersion
      !== TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION
    || promotion.status !== 'approved'
    || promotion.sourceId !== source.sourceId
    || promotion.sourceVersion !== source.version
    || promotion.classificationGeoTiffSha256.toLowerCase()
      !== snapshotSha256.toLowerCase()
  ) {
    throw new Error(
      'Coastline legend promotion evidence does not match the source-backed output.',
    );
  }
  requireSha256('coastline legend receipt', promotion.receiptSha256);
  requireSha256('coastline legend promotion', promotion.promotionDigest);
  if (
    !Number.isSafeInteger(promotion.sequence)
    || promotion.sequence < 1
    || !Number.isSafeInteger(promotion.minimumSignatures)
    || promotion.minimumSignatures < 2
    || !Number.isSafeInteger(promotion.verifiedSignatureCount)
    || promotion.verifiedSignatureCount < promotion.minimumSignatures
  ) {
    throw new Error('Coastline legend promotion quorum evidence is invalid.');
  }
  if (
    !sourceBindsRelatedArtifactDigest(source, promotion.receiptSha256)
    || !sourceBindsRelatedArtifactDigest(source, promotion.promotionDigest)
  ) {
    throw new Error(
      'Coastline source must bind receipt and promotion digests as related evidence.',
    );
  }
  return {
    schemaVersion: promotion.schemaVersion,
    status: promotion.status,
    receiptSha256: promotion.receiptSha256,
    promotionDigest: promotion.promotionDigest,
    sequence: promotion.sequence,
    verifiedSignatureCount: promotion.verifiedSignatureCount,
    minimumSignatures: promotion.minimumSignatures,
  };
}

async function sha256(bytes: Uint8Array) {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    Uint8Array.from(bytes).buffer,
  );
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

export async function serializeCoastalSeamManifest(
  result: CoastalSeamResult,
): Promise<SerializedCoastalSeamManifest> {
  const { provenance, grid, metrics } = result;
  if (result.seamVersion.trim() === '') {
    throw new Error('Coastal seam version is required.');
  }
  if (
    grid.horizontalCrs !== 'EPSG:4326' ||
    grid.verticalDatum !== provenance.targetVerticalDatum
  ) {
    throw new Error('Coastal grid reference systems do not match provenance.');
  }
  if (
    grid.sourceIds.land !== provenance.landSourceId ||
    grid.sourceIds.bathymetry !== provenance.bathymetrySourceId ||
    grid.sourceIds.coastline !== provenance.coastlineSourceId
  ) {
    throw new Error('Coastal grid source IDs do not match provenance.');
  }
  const expectedCellCount = grid.width * grid.height;
  if (
    grid.elevationsMeters.length !== expectedCellCount ||
    metrics.gridCellCount !== expectedCellCount ||
    metrics.landCellCount +
      metrics.oceanCellCount +
      metrics.breaklineCellCount !==
      expectedCellCount
  ) {
    throw new Error('Coastal grid and seam metrics have inconsistent cell counts.');
  }

  requireSha256('land snapshot', provenance.landSnapshotSha256);
  requireSha256('bathymetry snapshot', provenance.bathymetrySnapshotSha256);
  requireSha256('coastline snapshot', provenance.coastlineSnapshotSha256);
  requireSha256('coastline classification', provenance.classificationSha256);
  requireSha256('coastline coordinate lattice', provenance.coordinateLatticeSha256);
  if (
    provenance.sourceTermsUrls.length !== 3 ||
    provenance.sourceCorrectionUrls.length !== 3
  ) {
    throw new Error('Coastal provenance must contain three source evidence URLs.');
  }

  const evidence = [
    {
      role: 'land' as const,
      gate: result.sourceGates.land,
      sourceId: provenance.landSourceId,
      version: provenance.landSourceVersion,
      snapshotSha256: provenance.landSnapshotSha256,
      termsUrl: provenance.sourceTermsUrls[0],
      correctionUrl: provenance.sourceCorrectionUrls[0],
    },
    {
      role: 'bathymetry' as const,
      gate: result.sourceGates.bathymetry,
      sourceId: provenance.bathymetrySourceId,
      version: provenance.bathymetrySourceVersion,
      snapshotSha256: provenance.bathymetrySnapshotSha256,
      termsUrl: provenance.sourceTermsUrls[1],
      correctionUrl: provenance.sourceCorrectionUrls[1],
    },
    {
      role: 'coastline' as const,
      gate: result.sourceGates.coastline,
      sourceId: provenance.coastlineSourceId,
      version: provenance.coastlineSourceVersion,
      snapshotSha256: provenance.coastlineSnapshotSha256,
      termsUrl: provenance.sourceTermsUrls[2],
      correctionUrl: provenance.sourceCorrectionUrls[2],
    },
  ];
  const sources = evidence.map(item => {
    const source = requireReadySource(item.role, item.gate, item);
    return publicSourceRecord(item.role, source, item.snapshotSha256);
  });
  const coastlineSource = result.sourceGates.coastline.selectedSources[0];
  if (
    !sourceBindsRelatedArtifactDigest(
      coastlineSource,
      provenance.coordinateLatticeSha256,
    )
  ) {
    throw new Error(
      'Coastline source must bind the coordinate lattice digest as related evidence.',
    );
  }
  const coastlineLegendPromotion = publishCoastlineLegendPromotion(
    coastlineSource,
    provenance.coastlineSnapshotSha256,
    provenance.coastlineLegendPromotion,
  );

  const manifest = {
    manifestVersion: TOPOGRAPHIC_COASTAL_MANIFEST_VERSION,
    seamVersion: result.seamVersion,
    generatedAt: grid.generatedAt,
    grid: {
      gridId: grid.gridId,
      title: grid.title,
      bounds: grid.bounds,
      width: grid.width,
      height: grid.height,
      rowOrder: grid.rowOrder,
      horizontalCrs: grid.horizontalCrs,
      verticalDatum: grid.verticalDatum,
      countryCode: grid.countryCode ?? null,
      coordinateModel: grid.coordinateModel ?? 'rectilinear-axes',
    },
    sources,
    coastlineEvidence: {
      classificationSha256: provenance.classificationSha256,
      coordinateLatticeSha256: provenance.coordinateLatticeSha256,
      coordinateLatticeBinding: 'coastline-related-artifact',
      adapterVersion: provenance.coastlineAdapterVersion,
      shorelineEpoch: provenance.shorelineEpoch,
      legendPromotion: coastlineLegendPromotion,
    },
    metrics: {
      gridCellCount: metrics.gridCellCount,
      landCellCount: metrics.landCellCount,
      oceanCellCount: metrics.oceanCellCount,
      breaklineCellCount: metrics.breaklineCellCount,
      maximumLandBreaklineAdjustmentMeters:
        metrics.maximumLandBreaklineAdjustmentMeters,
      maximumBathymetryBreaklineAdjustmentMeters:
        metrics.maximumBathymetryBreaklineAdjustmentMeters,
    },
    nonClaims: [
      'This manifest is evidence metadata, not an independent signature.',
      'The reconciled surface is non-navigational.',
      'Terrain context does not prove an address, entrance, or delivery point.',
    ],
  };
  const data = `${JSON.stringify(manifest, null, 2)}\n`;
  const bytes = new TextEncoder().encode(data);
  return {
    mediaType: TOPOGRAPHIC_COASTAL_MANIFEST_MEDIA_TYPE,
    extension: '.coastal-manifest.json',
    data,
    byteLength: bytes.byteLength,
    contentSha256: await sha256(bytes),
  };
}

export async function serializeCoastalTerrainGltfBundle(
  result: CoastalSeamResult,
): Promise<SerializedCoastalTerrainGltfBundle> {
  const manifest = await serializeCoastalSeamManifest(result);
  const sources = [
    result.sourceGates.land.selectedSources[0],
    result.sourceGates.bathymetry.selectedSources[0],
    result.sourceGates.coastline.selectedSources[0],
  ];
  const syntheticModes = new Set(
    sources.map(source => source.syntheticOnly === true),
  );
  if (syntheticModes.size !== 1) {
    throw new Error(
      'Coastal glTF export cannot mix synthetic and source-backed evidence.',
    );
  }

  const landSource = sources[0];
  const vectorized = vectorizeNormalizedElevationGrid(
    {
      ...result.grid,
      sourceRecord: landSource,
    },
    {
      contourIntervalMeters: 1,
      includeContours: false,
      meshLodStrides: [1],
    },
  );
  const plan = buildTopographicExportPlan({
    bounds: result.grid.bounds,
    countryCode: result.grid.countryCode,
    crs: result.grid.horizontalCrs,
    format: 'gltf',
    layerIds: ['terrain-mesh'],
    sourceRecords: [landSource],
    dataMode: landSource.syntheticOnly ? 'synthetic' : 'source-backed',
    now: result.grid.generatedAt,
  });
  if (plan.status !== 'ready') {
    throw new Error('Coastal glTF export plan must be ready.');
  }

  const serialized = serializeTopographicExport(vectorized.dataset, plan);
  const gltf = JSON.parse(String(serialized.data)) as {
    asset: {
      version: string;
      extras?: Record<string, unknown>;
    };
  };
  gltf.asset.extras = {
    ...(gltf.asset.extras ?? {}),
    agidCoastalEvidence: {
      manifestVersion: TOPOGRAPHIC_COASTAL_MANIFEST_VERSION,
      manifestSha256: manifest.contentSha256,
      seamVersion: result.seamVersion,
      sourceIds: {
        land: result.provenance.landSourceId,
        bathymetry: result.provenance.bathymetrySourceId,
        coastline: result.provenance.coastlineSourceId,
      },
      horizontalCrs: result.grid.horizontalCrs,
      verticalDatum: result.grid.verticalDatum,
    },
  };
  const data = `${JSON.stringify(gltf, null, 2)}\n`;
  const bytes = new TextEncoder().encode(data);
  return {
    model: {
      mediaType: 'model/gltf+json',
      extension: '.gltf',
      data,
      byteLength: bytes.byteLength,
      contentSha256: await sha256(bytes),
    },
    manifest,
  };
}

export async function serializeCoastalTerrainGltfEvidenceBundle(
  result: CoastalSeamResult,
): Promise<SerializedCoastalTerrainGltfEvidenceBundle> {
  const bundle = await serializeCoastalTerrainGltfBundle(result);
  const sources = [
    result.sourceGates.land.selectedSources[0],
    result.sourceGates.bathymetry.selectedSources[0],
    result.sourceGates.coastline.selectedSources[0],
  ];
  const coordinateLatticeSha256 = await hashCoastalGridLattice(
    createCoastalGridLattice({
      ...result.grid,
      sourceRecord: sources[0],
    }),
  );
  if (
    coordinateLatticeSha256.toLowerCase() !==
    result.provenance.coordinateLatticeSha256.toLowerCase()
  ) {
    throw new Error(
      'Coastal evidence sidecar coordinate lattice does not match seam provenance.',
    );
  }
  if (
    !sourceBindsRelatedArtifactDigest(
      sources[2],
      result.provenance.coordinateLatticeSha256,
    )
  ) {
    throw new Error(
      'Coastal evidence sidecar requires the coastline source to bind the coordinate lattice digest.',
    );
  }
  const coastlineLegendPromotion = publishCoastlineLegendPromotion(
    sources[2],
    result.provenance.coastlineSnapshotSha256,
    result.provenance.coastlineLegendPromotion,
  );

  const sourceSnapshots = [
    {
      role: 'land' as const,
      source: sources[0],
      snapshotSha256: result.provenance.landSnapshotSha256,
    },
    {
      role: 'bathymetry' as const,
      source: sources[1],
      snapshotSha256: result.provenance.bathymetrySnapshotSha256,
    },
    {
      role: 'coastline' as const,
      source: sources[2],
      snapshotSha256: result.provenance.coastlineSnapshotSha256,
    },
  ].map(({ role, source, snapshotSha256 }) => ({
    role,
    sourceId: source.sourceId,
    version: source.version,
    licenseId: source.licenseId,
    reuseStatus: source.reuseStatus,
    syntheticOnly: source.syntheticOnly === true,
    snapshotSha256,
  }));

  const sidecar = {
    evidenceVersion: TOPOGRAPHIC_COASTAL_EVIDENCE_VERSION,
    provenanceModel: {
      profile: 'W3C-PROV-DM-inspired-minimal',
      conformance: 'not-a-W3C-PROV-serialization',
    },
    activity: {
      id: `agid:coastal-seam:${result.seamVersion}`,
      type: 'coastal-surface-reconciliation',
      generatedAt: result.grid.generatedAt,
      software: {
        seamVersion: result.seamVersion,
        manifestVersion: TOPOGRAPHIC_COASTAL_MANIFEST_VERSION,
      },
    },
    entities: {
      output: {
        id: 'artifact:gltf',
        mediaType: bundle.model.mediaType,
        contentSha256: bundle.model.contentSha256,
        byteLength: bundle.model.byteLength,
      },
      manifest: {
        id: 'artifact:coastal-manifest',
        mediaType: bundle.manifest.mediaType,
        contentSha256: bundle.manifest.contentSha256,
        byteLength: bundle.manifest.byteLength,
      },
      sourceSnapshots,
    },
    derivation: {
      outputArtifactId: 'artifact:gltf',
      usedArtifactId: 'artifact:coastal-manifest',
      usedSourceRoles: sourceSnapshots.map(source => source.role),
      coordinateLatticeSha256,
      coordinateModel: result.grid.coordinateModel ?? 'rectilinear-axes',
      classificationSha256: result.provenance.classificationSha256,
      coastlineLegendPromotion,
    },
    sourceGateStatus: {
      land: result.sourceGates.land.status,
      bathymetry: result.sourceGates.bathymetry.status,
      coastline: result.sourceGates.coastline.status,
    },
    nonClaims: [
      'The sidecar is verifiable evidence metadata, not an independent signature.',
      'The sidecar contains no raw elevation arrays, coordinate lattice, private delivery data, AOID material, or credentials.',
      'The reconciled surface is non-navigational and does not establish delivery suitability.',
    ],
  };
  const data = `${JSON.stringify(sidecar, null, 2)}\n`;
  const bytes = new TextEncoder().encode(data);
  return {
    ...bundle,
    evidenceSidecar: {
      mediaType: TOPOGRAPHIC_COASTAL_EVIDENCE_MEDIA_TYPE,
      extension: '.coastal-evidence.json',
      data,
      byteLength: bytes.byteLength,
      contentSha256: await sha256(bytes),
    },
  };
}

export async function createSyntheticCoastalTerrainGltfBundle(
  request: SyntheticCoastalTerrainBundleRequest,
) {
  const landElevations = [5, 1, 0, 6, 0.5, 0, 7, 1.5, 0];
  const bathymetryElevations = [0, -1, -5, 0, -0.5, -6, 0, -1.5, -7];
  const classes = Uint8Array.from([
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
  ]);
  const encoder = new TextEncoder();
  const landDigest = await sha256(
    encoder.encode(JSON.stringify(landElevations)),
  );
  const bathymetryDigest = await sha256(
    encoder.encode(JSON.stringify(bathymetryElevations)),
  );
  const coastlineDigest = await sha256(classes);
  const source = (
    sourceId: string,
    product: string,
    digest: `sha256:${string}`,
    layerIds: TopographicSourceRecord['layerIds'],
    relatedArtifactSha256: `sha256:${string}`[] = [],
  ): TopographicSourceRecord => ({
    ...AGID_SYNTHETIC_TOPO_SOURCE,
    sourceId,
    product,
    layerIds,
    snapshotEvidence: {
      contentSha256: digest,
      adapterVersion: 'agid-synthetic-coastal-adapter-v0.1',
      verifiedAt: request.generatedAt,
      horizontalCrs: 'EPSG:4326',
      verticalDatum: layerIds.includes('terrain-mesh')
        ? 'synthetic-mean-sea-level'
        : 'not-applicable: coastline classification',
      ...(relatedArtifactSha256.length === 0
        ? {}
        : { relatedArtifactSha256 }),
    },
    notes: [
      ...(AGID_SYNTHETIC_TOPO_SOURCE.notes ?? []),
      `Snapshot digest: ${digest}.`,
    ],
  });
  const landSource = source(
    'agid-synthetic-coastal-land-v0.1',
    'AGID synthetic coastal land grid',
    landDigest,
    ['terrain-mesh'],
  );
  const bathymetrySource = source(
    'agid-synthetic-coastal-bathymetry-v0.1',
    'AGID synthetic coastal bathymetry grid',
    bathymetryDigest,
    ['terrain-mesh'],
  );
  const grid = (
    gridId: string,
    title: string,
    elevationsMeters: number[],
    sourceRecord: TopographicSourceRecord,
  ) => ({
    gridId,
    title,
    bounds: request.bounds,
    width: 3,
    height: 3,
    elevationsMeters,
    rowOrder: 'north-to-south' as const,
    horizontalCrs: 'EPSG:4326' as const,
    verticalDatum: 'synthetic-mean-sea-level',
    sourceRecord,
    generatedAt: request.generatedAt,
    countryCode: request.countryCode,
  });
  const landGrid = grid(
    'agid-synthetic-coastal-land',
    'Synthetic coastal land',
    landElevations,
    landSource,
  );
  const bathymetryGrid = grid(
    'agid-synthetic-coastal-bathymetry',
    'Synthetic coastal bathymetry',
    bathymetryElevations,
    bathymetrySource,
  );
  const coordinateLattice = createCoastalGridLattice(landGrid);
  const coordinateLatticeSha256 = await hashCoastalGridLattice(
    coordinateLattice,
  );
  const coastlineSource = source(
    'agid-synthetic-coastal-breakline-v0.1',
    'AGID synthetic coastline breakline',
    coastlineDigest,
    ['waterways'],
    [coordinateLatticeSha256],
  );
  const seam = await reconcileCoastalElevationGrids({
    land: {
      grid: landGrid,
      sourceSnapshotSha256: landDigest,
    },
    bathymetry: {
      grid: bathymetryGrid,
      sourceSnapshotSha256: bathymetryDigest,
    },
    coastline: {
      maskId: 'agid-synthetic-coastline-mask',
      width: 3,
      height: 3,
      bounds: request.bounds,
      rowOrder: 'north-to-south',
      horizontalCrs: 'EPSG:4326',
      coordinateLattice,
      expectedCoordinateLatticeSha256: coordinateLatticeSha256,
      classes,
      sourceRecord: coastlineSource,
      sourceSnapshotSha256: coastlineDigest,
      expectedClassificationSha256: coastlineDigest,
      adapterVersion: 'agid-synthetic-coastline-adapter-v0.1',
      shorelineEpoch: request.generatedAt,
    },
    targetVerticalDatum: 'synthetic-mean-sea-level',
    generatedAt: request.generatedAt,
    maximumAdjustmentMeters: 2,
  });
  return serializeCoastalTerrainGltfBundle(seam);
}
