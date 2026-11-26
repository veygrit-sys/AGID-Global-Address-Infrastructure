import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { applyIslandPolicyToEvidence, matchBundledIsland, type IslandEvidence } from '../src/lib/islandPolicy';

type PackHit = IslandEvidence & { islandId: string; kind: 'lake-island' | 'ocean-island' | 'shoreline-island' };

function main(args: string[]) {
  if (args.length !== 3 && !(args.length === 5 && args[3] === '--python')) {
    throw new Error('Usage: node --import tsx scripts/query-island-pack.ts PACK LAT LON [--python PYTHON]');
  }
  const [pack, latitude, longitude] = args;
  const lat = Number(latitude), lon = Number(longitude);
  if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || Math.abs(lat) > 90
    || !Number.isFinite(lon) || Math.abs(lon) > 180) throw new Error('Invalid latitude or longitude');
  const reader = fileURLToPath(new URL('./island-evidence-pack.py', import.meta.url));
  const output = spawnSync(args[4] ?? 'python3', [reader, 'query', '--', pack, String(lat), String(lon)],
    { encoding: 'utf8', windowsHide: true });
  if (output.error) throw output.error;
  if (output.status !== 0) throw new Error(output.stderr.trim() || 'Unable to read island evidence');
  const raw = JSON.parse(output.stdout) as PackHit | null;
  let island = applyIslandPolicyToEvidence(lat, lon, raw ?? undefined);
  // Some positives at 180° fall inside source cut gaps in the ADM0 layer.
  // Keep the independently sourced bundled classification in such cases.
  if (raw && !raw.codes.length && !raw.disputed && island?.status === 'unresolved') {
    island = matchBundledIsland(lat, lon) ?? island;
  }
  // Raw worldview fields stay internal. Emit the same territorial policy as the map.
  console.log(JSON.stringify({
    island: island ?? null,
    ...(island && raw && { physicalIslandId: raw.islandId, physicalKind: raw.kind }),
    deliveryRegion: null,
  }));
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
