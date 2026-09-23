import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractExpressRouteDefinitions, findDuplicateExpressRoutes } from './routeAudit';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '../../..');

function routeFiles() {
  const routeDir = path.join(root, 'src/server/routes');
  const routeModules = readdirSync(routeDir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => path.join(routeDir, file));

  return [
    path.join(root, 'server.ts'),
    ...routeModules,
  ];
}

test('server route definitions do not register duplicate method/path pairs', () => {
  const routes = routeFiles().flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    return extractExpressRouteDefinitions(source, path.relative(root, file));
  });

  const duplicates = findDuplicateExpressRoutes(routes);

  assert.deepEqual(
    duplicates.map(({ key, first, duplicate }) => ({
      key,
      first: first.file,
      duplicate: duplicate.file,
    })),
    [],
  );
});
