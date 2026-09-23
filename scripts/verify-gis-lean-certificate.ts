import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter,resolve } from 'node:path';

const ROOT = process.cwd();
const FORMAL_DIR = resolve(ROOT, 'formal');
const LEAN_BIN = (() => {
  const elanLean = resolve(homedir(), '.elan', 'bin', process.platform === 'win32' ? 'lean.exe' : 'lean');
  if (existsSync(elanLean)) return elanLean;
  return 'lean';
})();

function run(command: string, args: string[], extraEnv: NodeJS.ProcessEnv = {}) {
  console.log(`[GIS Lean] ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

async function main() {
  const leanPath = [FORMAL_DIR, process.env.LEAN_PATH].filter(Boolean).join(delimiter);

  run(LEAN_BIN, ['-o', 'formal/AMTCore.olean', 'formal/AMTCore.lean']);
  run(LEAN_BIN, ['-o', 'formal/AMTPaperExtensions.olean', 'formal/AMTPaperExtensions.lean'], {
    LEAN_PATH: leanPath,
  });
  await import('./export-gis-lean-certificate.ts');
  run(LEAN_BIN, ['formal/GeneratedGisCertificate.lean'], {
    LEAN_PATH: leanPath,
  });
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
