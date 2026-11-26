import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assessPackPoint, type PackHit } from './national-island-supplement';

function main(args: string[]) {
  if (args.length !== 3 && !(args.length === 5 && args[3] === '--python')) {
    throw new Error('Usage: node --import tsx scripts/query-island-pack.ts PACK LAT LON [--python PYTHON]');
  }
  const [pack, latitude, longitude] = args;
  const lat = Number(latitude), lon = Number(longitude);
  if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || Math.abs(lat) > 90
    || !Number.isFinite(lon) || Math.abs(lon) > 180) throw new Error('Invalid latitude or longitude');
  const reader = fileURLToPath(new URL('./island-evidence-pack.py', import.meta.url));
  const output = spawnSync(args[4] ?? 'python3', [reader, 'query', '--with-coverage', '--', pack, String(lat), String(lon)],
    { encoding: 'utf8', windowsHide: true });
  if (output.error) throw output.error;
  if (output.status !== 0) throw new Error(output.stderr.trim() || 'Unable to read island evidence');
  const { hit: raw, mappedInlandWater, pinnedSourceEdition } = JSON.parse(output.stdout) as {
    hit: PackHit | null; mappedInlandWater: boolean; pinnedSourceEdition: boolean;
  };
  const island = assessPackPoint(lat, lon, raw, mappedInlandWater, pinnedSourceEdition);
  // Raw worldview fields stay internal. Emit the same territorial policy as the map.
  console.log(JSON.stringify({
    island: island ?? null,
    ...(island && raw && {
      physicalIslandId: raw.islandId,
      physicalKind: raw.kind,
      physicalSource: raw.kind === 'shoreline-island' ? 'fieldmaps-usgs-lsib' : 'gshhg-full',
      physicalVersion: raw.kind === 'shoreline-island' ? '2025-07-29' : '2.3.7',
    }),
    deliveryRegion: null,
  }));
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
