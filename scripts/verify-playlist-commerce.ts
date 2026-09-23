import { spawnSync } from 'node:child_process';

const testFiles = [
  'src/lib/playlistCommerceSpec.test.ts',
  'src/lib/playlistCommerceDiagrams.test.ts',
  'src/lib/playlistCommercePresentationMap.test.ts',
  'src/lib/playlistCommerceWebhook.test.ts',
  'src/lib/playlistCommerceWebhookServer.test.ts',
  'src/lib/playlistCommerceCheckout.test.ts',
  'src/lib/playlistCommerceSdk.test.ts',
  'src/components/PlaylistCommerceWidgetScreen.test.ts',
  'scripts/export-playlist-commerce-webhook-preflight.test.ts',
  'scripts/verify-playlist-commerce-webhook-evidence.test.ts',
  'scripts/sync-playlist-commerce-coverage-table.test.ts',
];

function run(args: string[]) {
  const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['scripts/sync-playlist-commerce-coverage-table.ts']);
run(['scripts/export-playlist-commerce-webhook-preflight.ts', '--check']);
run(['scripts/verify-playlist-commerce-webhook-evidence.ts']);
run(['--test', ...testFiles]);
