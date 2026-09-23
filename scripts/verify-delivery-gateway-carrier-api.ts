import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

type Gate = {
  name: string;
  args: string[];
};

const tsxCliPath = join('node_modules', 'tsx', 'dist', 'cli.mjs');
const gates: Gate[] = [
  {
    name: 'delivery-gateway-carrier-api-tests',
    args: ['--test', 'src/lib/deliveryGatewayCarrierApi.test.ts'],
  },
  {
    name: 'skipship-idempotency-openapi-negative-tests',
    args: ['--test', 'scripts/verify-skipship-idempotency-openapi.test.ts'],
  },
  {
    name: 'skipship-idempotency-openapi',
    args: ['scripts/verify-skipship-idempotency-openapi.ts'],
  },
];

if (!existsSync(tsxCliPath)) {
  console.error(`[verify-delivery-gateway-carrier-api] status=fail`);
  console.error(`missing-tsx-cli:${tsxCliPath}`);
  process.exit(1);
}

let failed = false;

for (const gate of gates) {
  console.log(`[verify-delivery-gateway-carrier-api] running=${gate.name}`);
  const result = spawnSync(process.execPath, [tsxCliPath, ...gate.args], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  if (result.status !== 0 || result.error) {
    failed = true;
    const message = result.error instanceof Error ? result.error.message : `exit=${String(result.status)}`;
    console.error(`[verify-delivery-gateway-carrier-api] gate=${gate.name} status=fail ${message}`);
    break;
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log('[verify-delivery-gateway-carrier-api] status=pass');
}
