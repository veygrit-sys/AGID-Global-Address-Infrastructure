export type DevServerEnv = {
  AGID_HMR_PORT?: string;
  DISABLE_HMR?: string;
  VITE_HMR_PORT?: string;
};

export type ViteHmrConfig = false | {
  clientPort: number;
  port: number;
};

export function parseDevServerPort(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 65535 ? parsed : undefined;
}

export function defaultHmrPort(appPort: number) {
  const offsetPort = appPort + 10000;
  if (offsetPort <= 65535) return offsetPort;
  const adjacentPort = appPort - 1;
  if (adjacentPort > 0 && adjacentPort <= 65535) return adjacentPort;
  return 24679;
}

export function resolveViteHmrConfig(appPort: number, env: DevServerEnv = process.env): ViteHmrConfig {
  if (env.DISABLE_HMR === 'true') return false;
  const port = parseDevServerPort(env.AGID_HMR_PORT ?? env.VITE_HMR_PORT) ?? defaultHmrPort(appPort);
  return { port, clientPort: port };
}
