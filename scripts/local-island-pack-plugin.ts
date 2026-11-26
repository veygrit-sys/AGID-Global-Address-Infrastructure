import { execFile } from 'node:child_process';
import { statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Plugin } from 'vite';

const run = promisify(execFile);
const route = '/api/local/island-pack';
const maxBody = 256;
type Request = IncomingMessage & { body?: unknown };
type Lookup = (pack: string, lat: number, lon: number) => Promise<unknown>;

function localRequest(req: Request) {
  const peer = req.socket.remoteAddress;
  if (!['127.0.0.1', '::ffff:127.0.0.1', '::1'].includes(peer ?? '')) return false;
  const host = req.headers.host;
  if (!host || !/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) return false;
  if (req.headers.forwarded || req.headers['x-forwarded-for'] || req.headers['x-forwarded-host']) return false;
  const origin = req.headers.origin;
  return !origin || origin === `http://${host}` || origin === `https://${host}`;
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readPin(req: Request) {
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') return;
  if (Number(req.headers['content-length']) > maxBody) return;
  let body = req.body;
  if (body === undefined) {
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > maxBody) return;
      chunks.push(bytes);
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return;
  if (Object.keys(body).some(k => !['kind', 'lat', 'lon'].includes(k))) return;
  const { kind, lat, lon } = body as Record<string, unknown>;
  if (kind === 'pin' && typeof lat === 'number' && Number.isFinite(lat) && Math.abs(lat) <= 90
    && typeof lon === 'number' && Number.isFinite(lon) && Math.abs(lon) <= 180) return { lat, lon };
}

/** Serves only configured local Vite sessions. The ordinary web bundle has no pack dependency. */
export function localIslandPackMiddleware(pack: string | undefined, lookup: Lookup) {
  let pending = 0;
  return async (req: Request, res: ServerResponse, next: () => void) => {
    if (req.url?.split('?')[0] !== route) return next();
    if (!localRequest(req) || req.url !== route) return send(res, 404, { enabled: false });
    let enabled = false;
    if (pack) {
      try { enabled = statSync(pack).isFile(); } catch { /* optional pack is unavailable */ }
    }
    if (req.method === 'GET') return send(res, 200, { enabled });
    if (!enabled || !pack) return send(res, 404, { enabled: false });
    if (req.method !== 'POST') return send(res, 405, { error: 'POST required' });
    let pin: {lat: number; lon: number} | undefined;
    try { pin = await readPin(req); } catch { /* rejected below */ }
    if (!pin) return send(res, 400, { error: 'A single manual pin is required' });
    if (pending >= 2) return send(res, 429, { error: 'Lookup busy' });
    pending++;
    try {
      const result = await lookup(pack, pin.lat, pin.lon);
      return send(res, 200, result);
    } catch {
      return send(res, 503, { error: 'Local pack lookup unavailable' });
    } finally {
      pending--;
    }
  };
}

export function localIslandPackPlugin(pack?: string, python?: string): Plugin {
  return {
    name: 'agid-local-island-pack',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root;
      const lookup: Lookup = async (source, lat, lon) => {
        const args = ['--import', 'tsx', path.join(root, 'scripts/query-island-pack.ts'), source, String(lat), String(lon)];
        if (python) args.push('--python', python);
        const { stdout } = await run(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 65536 });
        return JSON.parse(stdout);
      };
      server.middlewares.use(localIslandPackMiddleware(pack && path.resolve(root, pack), lookup));
    },
  };
}
