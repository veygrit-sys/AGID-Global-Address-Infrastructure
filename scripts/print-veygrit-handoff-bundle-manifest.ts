import {
  buildVeygritHandoffBundleCoverageSummary,
  buildVeygritHandoffBundleManifest,
  validateVeygritHandoffBundleManifest,
} from '../src/lib/veygritHandoffBundleManifest';

const npmCompactFlag = process.env.npm_config_compact;
const compact = process.argv.includes('--compact') || npmCompactFlag === 'true' || npmCompactFlag === '';
const manifest = buildVeygritHandoffBundleManifest();
const coverage = buildVeygritHandoffBundleCoverageSummary(manifest);
const validation = validateVeygritHandoffBundleManifest(manifest);

if (!validation.ok) {
  console.error(JSON.stringify({
    status: 'blocked',
    reporter: 'print-veygrit-handoff-bundle-manifest',
    findings: validation.errors,
    coverage,
    remoteMutationAllowedThisTurn: false,
  }));
  process.exit(1);
}

const payload = {
  status: 'pass',
  reporter: 'print-veygrit-handoff-bundle-manifest',
  manifest,
  coverage,
  archiveCreated: false,
  remoteMutationAllowedThisTurn: false,
};

console.log(JSON.stringify(payload, null, compact ? 0 : 2));
