import type { SqlPool } from '../shipping/veygritShipStore';
import { PostgresVeygritIdStore } from './postgresVeygritIdStore';
import { createEd25519IdTokenSigner, VeygritIdService } from './veygritIdService';

export type VeygritIdSecretResolver = { get(secretRef: string): Promise<string> };
export type VeygritIdRuntimeConfig = {
  databaseUrl: string;
  issuer: string;
  signingKeyId: string;
  signingPrivateKeySecretRef: string;
  pairwiseSubjectSecretRef: string;
  providerSubjectPepperRef: string;
};

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

export async function createVeygritIdRuntime(config: VeygritIdRuntimeConfig, secrets: VeygritIdSecretResolver) {
  if (!config.databaseUrl || !config.issuer || !config.signingKeyId) throw new TypeError('incomplete_veygrit_id_runtime_config');
  const [{ Pool }, signingPrivateKey, pairwiseSubjectSecret, providerSubjectPepper] = await Promise.all([
    dynamicImport('pg'),
    secrets.get(config.signingPrivateKeySecretRef),
    secrets.get(config.pairwiseSubjectSecretRef),
    secrets.get(config.providerSubjectPepperRef),
  ]);
  const pool = new Pool({ connectionString: config.databaseUrl, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined }) as SqlPool;
  const store = new PostgresVeygritIdStore(pool);
  const signer = createEd25519IdTokenSigner(signingPrivateKey, config.signingKeyId);
  return {
    service: new VeygritIdService(store, { issuer: config.issuer, signer, pairwiseSubjectSecret, providerSubjectPepper }),
    close: () => store.close(),
  };
}

export async function createVeygritIdRuntimeFromEnv(secrets?: VeygritIdSecretResolver) {
  const databaseUrl = process.env.VEYGRIT_ID_DATABASE_URL;
  const issuer = process.env.VEYGRIT_ID_ISSUER;
  const signingKeyId = process.env.VEYGRIT_ID_SIGNING_KEY_ID;
  const signingPrivateKeySecretRef = process.env.VEYGRIT_ID_SIGNING_PRIVATE_KEY_SECRET_REF;
  const pairwiseSubjectSecretRef = process.env.VEYGRIT_ID_PAIRWISE_SECRET_REF;
  const providerSubjectPepperRef = process.env.VEYGRIT_ID_PROVIDER_PEPPER_REF;
  if (!databaseUrl || !issuer || !signingKeyId || !signingPrivateKeySecretRef || !pairwiseSubjectSecretRef || !providerSubjectPepperRef || !secrets) return undefined;
  return createVeygritIdRuntime({ databaseUrl, issuer, signingKeyId, signingPrivateKeySecretRef, pairwiseSubjectSecretRef, providerSubjectPepperRef }, secrets);
}
