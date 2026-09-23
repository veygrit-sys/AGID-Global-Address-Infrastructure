import { readFile } from 'node:fs/promises';

const critical = [
  '@aws-sdk/client-s3',
  '@aws-sdk/client-secrets-manager',
  '@aws-sdk/s3-request-presigner',
  '@azure/identity',
  '@azure/keyvault-secrets',
  '@azure/storage-blob',
  '@google-cloud/secret-manager',
  '@google-cloud/storage',
  'express',
  'pg',
] as const;

const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as {
  dependencies?: Record<string, string>;
  overrides?: Record<string, string>;
};
const lock = JSON.parse(await readFile('package-lock.json', 'utf8')) as {
  lockfileVersion?: number;
  packages?: Record<string, { version?: string }>;
};

const failures: string[] = [];
for (const name of critical) {
  const version = packageJson.dependencies?.[name];
  if (!version) failures.push(`${name}: missing from dependencies`);
  else if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) failures.push(`${name}: must be an exact version, found ${version}`);
  const locked = lock.packages?.[`node_modules/${name}`]?.version;
  if (version && locked !== version) failures.push(`${name}: lockfile=${locked ?? 'missing'}, package.json=${version}`);
}
if (packageJson.overrides?.uuid !== '11.1.1') failures.push('uuid override must be exactly 11.1.1');
if (lock.lockfileVersion !== 3) failures.push(`package-lock.json must use lockfileVersion 3, found ${lock.lockfileVersion ?? 'missing'}`);

if (failures.length) {
  console.error(`Veygrit -ship dependency lock failed:\n${failures.map(value => `- ${value}`).join('\n')}`);
  process.exit(1);
}
console.log(`Veygrit -ship dependency lock passed (${critical.length} critical dependencies, npm ci lockfile).`);
