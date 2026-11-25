#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tsxPackage = join(root, 'node_modules', 'tsx', 'package.json');
const entry = join(root, 'scripts', 'agid-cli.ts');

if (!existsSync(tsxPackage)) {
  console.error('AGID CLI requires project dependencies. Run npm install before using bin/agid.mjs.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--import', 'tsx', entry, ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
