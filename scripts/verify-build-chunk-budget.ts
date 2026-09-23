import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

type ChunkBudgetException = {
  pattern: RegExp;
  maxBytes: number;
  reason: string;
};

type BuildAsset = {
  name: string;
  path: string;
  bytes: number;
  mtimeMs: number;
};

type BudgetRule = {
  label: string;
  pattern: RegExp;
  maxBytes: number;
};

const distDir = join(process.cwd(), 'dist');
const defaultJsMaxBytes = 500 * 1024;
const maxAssetAgeMinutesEnv = process.env.AGID_BUILD_BUDGET_MAX_AGE_MINUTES;
const maxAssetAgeMinutes = maxAssetAgeMinutesEnv ? Number(maxAssetAgeMinutesEnv) : undefined;
const budgetRules: BudgetRule[] = [
  {
    label: 'CSS bundle',
    pattern: /\.css$/,
    maxBytes: 300 * 1024,
  },
  {
    label: 'raster image',
    pattern: /\.(png|jpe?g|webp|avif)$/i,
    maxBytes: 850 * 1024,
  },
];
const exceptions: ChunkBudgetException[] = [
  {
    pattern: /^vendor-maplibre-.*\.js$/,
    maxBytes: 1_200_000,
    reason: 'MapLibre GL is the retained open-source map runtime and is split from app code.',
  },
];

const formatKb = (bytes: number) => `${(bytes / 1024).toFixed(1)}KB`;

if (
  maxAssetAgeMinutes !== undefined &&
  (!Number.isFinite(maxAssetAgeMinutes) || maxAssetAgeMinutes < 0)
) {
  console.error('AGID_BUILD_BUDGET_MAX_AGE_MINUTES must be a non-negative number when set.');
  process.exit(1);
}

if (!existsSync(distDir)) {
  console.error('Build output was not found. Run `npm run build` before this check.');
  process.exit(1);
}

const collectFiles = (directory: string, prefix = ''): BuildAsset[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      return collectFiles(path, relativePath);
    }

    const stats = statSync(path);

    return [
      {
        name: entry.name,
        path: relativePath,
        bytes: stats.size,
        mtimeMs: stats.mtimeMs,
      },
    ];
  });

const assets = collectFiles(distDir);
const newestAsset = assets.reduce<BuildAsset | undefined>(
  (newest, asset) => (!newest || asset.mtimeMs > newest.mtimeMs ? asset : newest),
  undefined,
);
const jsChunks = assets
  .filter((asset) => asset.path.startsWith('assets/') && asset.name.endsWith('.js'))
  .sort((a, b) => b.bytes - a.bytes);

const jsFailures = jsChunks.flatMap((chunk) => {
  const exception = exceptions.find((item) => item.pattern.test(chunk.name));
  const maxBytes = exception?.maxBytes ?? defaultJsMaxBytes;

  if (chunk.bytes <= maxBytes) {
    return [];
  }

  return [
    {
      ...chunk,
      maxBytes,
      reason: exception?.reason ?? 'No explicit chunk-budget exception is registered.',
    },
  ];
});

const assetFailures = assets.flatMap((asset) => {
  const rule = budgetRules.find((item) => item.pattern.test(asset.name));

  if (!rule || asset.bytes <= rule.maxBytes) {
    return [];
  }

  return [
    {
      ...asset,
      maxBytes: rule.maxBytes,
      reason: `${rule.label} exceeds the local build budget.`,
    },
  ];
});

const failures = [...jsFailures, ...assetFailures];

if (failures.length > 0) {
  console.error('Build asset budget failed:');
  for (const failure of failures) {
    console.error(
      `- ${failure.path}: ${formatKb(failure.bytes)} exceeds ${formatKb(failure.maxBytes)}. ${failure.reason}`,
    );
  }
  process.exit(1);
}

const topAssets = assets
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 8)
  .map((asset) => `${asset.path} ${formatKb(asset.bytes)}`);
const newestAssetAgeMinutes = newestAsset ? Math.max(0, Math.round((Date.now() - newestAsset.mtimeMs) / 60_000)) : 0;
if (
  newestAsset &&
  maxAssetAgeMinutes !== undefined &&
  newestAssetAgeMinutes > maxAssetAgeMinutes
) {
  console.error(
    `Build output is stale: newest asset ${newestAsset.path} is ${newestAssetAgeMinutes}m old, exceeding AGID_BUILD_BUDGET_MAX_AGE_MINUTES=${maxAssetAgeMinutes}. Run \`npm run build\` before this check.`,
  );
  process.exit(1);
}
const newestAssetSummary = newestAsset
  ? `${newestAsset.path} ${new Date(newestAsset.mtimeMs).toISOString()} age=${newestAssetAgeMinutes}m`
  : 'none';
const maxAgeSummary = maxAssetAgeMinutes === undefined ? 'disabled' : `${maxAssetAgeMinutes}m`;
console.log(
  `Build asset budget passed. Newest asset: ${newestAssetSummary}. Max asset age: ${maxAgeSummary}. Top assets: ${topAssets.join(', ')}`,
);
