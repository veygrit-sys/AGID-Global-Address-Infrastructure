export const POS_RUNTIME_POLICY_VERSION = 'agid-pos-runtime-policy-v1';

export type PosRuntimeTask =
  | 'browser-qr-nfc-ui'
  | 'api-orchestration'
  | 'payload-redaction'
  | 'deterministic-predicate-evaluation'
  | 'formal-zk-proof-generation';

export type PosRuntimeBackend =
  | 'typescript-react'
  | 'typescript-express'
  | 'typescript-policy-core'
  | 'rust-wasm'
  | 'rust-native'
  | 'zk-circuit';

export type PosRuntimeRecommendation = {
  task: PosRuntimeTask;
  rewriteFromTypeScript: boolean;
  preferredBackends: PosRuntimeBackend[];
  reason: string;
};

export type PosRuntimePolicy = {
  version: typeof POS_RUNTIME_POLICY_VERSION;
  rule: string;
  recommendations: PosRuntimeRecommendation[];
};

const POS_RUNTIME_RECOMMENDATIONS: PosRuntimeRecommendation[] = [
  {
    task: 'browser-qr-nfc-ui',
    rewriteFromTypeScript: false,
    preferredBackends: ['typescript-react'],
    reason: 'QR camera, Web NFC, browser permissions, and React state are JavaScript platform features; TypeScript keeps the UI closest to the runtime.',
  },
  {
    task: 'api-orchestration',
    rewriteFromTypeScript: false,
    preferredBackends: ['typescript-express'],
    reason: 'The POS API mostly validates JSON, applies policy, and returns HTTP responses; moving it out of TypeScript would add IPC without improving safety.',
  },
  {
    task: 'payload-redaction',
    rewriteFromTypeScript: false,
    preferredBackends: ['typescript-policy-core', 'rust-native'],
    reason: 'Current redaction is schema and policy logic; keep it in TypeScript until persisted high-volume receipts require a native service.',
  },
  {
    task: 'deterministic-predicate-evaluation',
    rewriteFromTypeScript: true,
    preferredBackends: ['rust-wasm', 'rust-native'],
    reason: 'Region checks, quality thresholds, and hidden witness predicates benefit from deterministic numeric code shared by browser and server.',
  },
  {
    task: 'formal-zk-proof-generation',
    rewriteFromTypeScript: true,
    preferredBackends: ['zk-circuit', 'rust-native'],
    reason: 'Real ZK proof generation should live in circuits or a Rust/ZKVM backend; TypeScript should only assemble requests and verify public envelopes.',
  },
];

export function getPosRuntimePolicy(): PosRuntimePolicy {
  return {
    version: POS_RUNTIME_POLICY_VERSION,
    rule: 'Keep POS UI and API orchestration in TypeScript; move deterministic predicates and cryptographic proof work to Rust/WASM or formal ZK circuits.',
    recommendations: POS_RUNTIME_RECOMMENDATIONS,
  };
}

export function getPosRuntimeRecommendation(task: PosRuntimeTask): PosRuntimeRecommendation {
  return POS_RUNTIME_RECOMMENDATIONS.find((item) => item.task === task) ?? POS_RUNTIME_RECOMMENDATIONS[0];
}
