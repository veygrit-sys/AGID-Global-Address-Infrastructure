import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ADDRESSQL_PRACTICAL_API_LIMITS,
  buildAddressQlApiErrorResponse,
  createAddressQlPracticalApi,
  type AddressQlPracticalApiOptions,
  type AddressQlPracticalApiResponse,
} from '../src/lib/addressQlPracticalApi';
import {
  loadAddressQlRuntimeConfig,
  type LoadedAddressQlRuntimeConfig,
} from '../src/lib/addressQlRuntimeConfig';
import { loadAddressQlQuorumApprovedRuntimeConfig } from '../src/lib/addressQlRuntimeReleaseLedger';
import {
  loadAddressQlDeliveryPointVerifier,
  type AddressQlDeliveryPointVerifier,
} from '../src/lib/addressQlDeliveryPointDecision';

function writeResponse(
  response: ServerResponse,
  output: AddressQlPracticalApiResponse,
) {
  response.writeHead(output.statusCode, output.headers);
  response.end(JSON.stringify(output.body));
}

function headerMap(request: IncomingMessage): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(request.headers)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
}

export function createAddressQlHttpServer(
  root = process.cwd(),
  options: AddressQlPracticalApiOptions = {},
) {
  const api = createAddressQlPracticalApi(root, options);
  const server = createServer((request, response) => {
    const method = String(request.method || 'GET').toUpperCase();
    const path = request.url || '/';
    const contentLength = Number(request.headers['content-length'] || 0);

    if (
      Number.isFinite(contentLength)
      && contentLength > ADDRESSQL_PRACTICAL_API_LIMITS.maxBodyBytes
    ) {
      writeResponse(response, buildAddressQlApiErrorResponse(
        413,
        'body_too_large',
        'Request body exceeds the API byte limit.',
      ));
      request.resume();
      return;
    }

    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      writeResponse(response, api.handle({
        method,
        path,
        headers: headerMap(request),
        bodyBytes: 0,
      }));
      return;
    }

    const contentType = String(request.headers['content-type'] || '').toLowerCase();
    if (!contentType.startsWith('application/json')) {
      writeResponse(response, buildAddressQlApiErrorResponse(
        415,
        'unsupported_media_type',
        'POST requests require application/json.',
      ));
      request.resume();
      return;
    }

    const chunks: Buffer[] = [];
    let bytes = 0;
    let tooLarge = false;

    request.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > ADDRESSQL_PRACTICAL_API_LIMITS.maxBodyBytes) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      if (tooLarge) {
        writeResponse(response, buildAddressQlApiErrorResponse(
          413,
          'body_too_large',
          'Request body exceeds the API byte limit.',
        ));
        return;
      }

      let body: unknown;
      try {
        body = bytes ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
      } catch {
        writeResponse(response, buildAddressQlApiErrorResponse(
          400,
          'invalid_json',
          'Request body must contain valid JSON.',
        ));
        return;
      }

      writeResponse(response, api.handle({
        method,
        path,
        headers: headerMap(request),
        body,
        bodyBytes: bytes,
      }));
    });

    request.on('error', () => {
      if (!response.headersSent) {
        writeResponse(response, buildAddressQlApiErrorResponse(
          400,
          'request_stream_error',
          'Request stream could not be read.',
        ));
      }
    });
  });

  server.requestTimeout = 10_000;
  server.headersTimeout = 5_000;
  server.keepAliveTimeout = 5_000;
  server.maxRequestsPerSocket = 100;
  server.maxConnections = 100;
  server.on('clientError', (_error, socket) => {
    if (socket.writable) {
      socket.end(
        'HTTP/1.1 400 Bad Request\r\n'
        + 'Content-Type: application/json\r\n'
        + 'Connection: close\r\n\r\n'
        + '{"error":{"code":"bad_request"}}',
      );
    }
  });

  return server;
}

function parsePort(value: string | undefined): number {
  const port = Number(value || 8787);
  return Number.isInteger(port) && port >= 0 && port <= 65535 ? port : 8787;
}

function enabledFlag(value: string | undefined) {
  return value === '1' || value?.toLowerCase() === 'true';
}

export function loadAddressQlRuntimeEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): LoadedAddressQlRuntimeConfig | null {
  const configPath = environment.ADDRESSQL_RUNTIME_CONFIG;
  if (!configPath) return null;
  const releaseLedgerPath = environment.ADDRESSQL_RELEASE_LEDGER;
  const releaseStatePath = environment.ADDRESSQL_RELEASE_STATE;
  if (Boolean(releaseLedgerPath) !== Boolean(releaseStatePath)) {
    throw new Error(
      'ADDRESSQL_RELEASE_LEDGER and ADDRESSQL_RELEASE_STATE must be configured together',
    );
  }
  if (releaseLedgerPath && !environment.ADDRESSQL_TRUST_STORE) {
    throw new Error('quorum release loading requires ADDRESSQL_TRUST_STORE');
  }
  if (releaseLedgerPath && releaseStatePath) {
    return loadAddressQlQuorumApprovedRuntimeConfig({
      configPath: resolvePath(cwd, configPath),
      ledgerPath: resolvePath(cwd, releaseLedgerPath),
      trustStorePath: resolvePath(cwd, environment.ADDRESSQL_TRUST_STORE!),
      statePath: resolvePath(cwd, releaseStatePath),
    });
  }
  return loadAddressQlRuntimeConfig({
    configPath: resolvePath(cwd, configPath),
    ...(environment.ADDRESSQL_TRUST_STORE
      ? {
        trustStorePath: resolvePath(
          cwd,
          environment.ADDRESSQL_TRUST_STORE,
        ),
      }
      : {}),
    allowConformanceAdapters: enabledFlag(
      environment.ADDRESSQL_ALLOW_CONFORMANCE,
    ),
  });
}

export function loadAddressQlDeliveryPointEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): AddressQlDeliveryPointVerifier | null {
  const trustStorePath = environment.ADDRESSQL_L5_CARRIER_TRUST_STORE;
  return trustStorePath
    ? loadAddressQlDeliveryPointVerifier(resolvePath(cwd, trustStorePath))
    : null;
}

function resolvePath(cwd: string, path: string) {
  return resolve(cwd, path);
}

export function runAddressQlHttpServer() {
  const host = process.env.ADDRESSQL_API_HOST || '127.0.0.1';
  const port = parsePort(process.env.ADDRESSQL_API_PORT);
  const loadedRuntime = loadAddressQlRuntimeEnvironment();
  const deliveryPointVerifier = loadAddressQlDeliveryPointEnvironment();
  const server = createAddressQlHttpServer(process.cwd(), {
    ...(loadedRuntime
      ? {
      runtimeAdapters: loadedRuntime.runtimeAdapters,
      ...loadedRuntime.registryOptions,
      }
      : {}),
    ...(deliveryPointVerifier ? { deliveryPointVerifier } : {}),
  });
  server.listen(port, host, () => {
    const address = server.address();
    const selectedPort = typeof address === 'object' && address ? address.port : port;
    console.log(`AddressQL practical API listening on http://${host}:${selectedPort}`);
    console.log('Request bodies are processed ephemerally and are not logged by this adapter.');
    if (loadedRuntime) {
      console.log(
        `Loaded ${loadedRuntime.diagnostics.adapterCount} verified runtime adapter(s)`
        + ` for ${loadedRuntime.diagnostics.countryCodes.join(', ')}.`,
      );
    }
    if (deliveryPointVerifier) {
      console.log(
        `Loaded ${deliveryPointVerifier.trustedCarrierCount} trusted L5 carrier(s)`
        + ` for ${deliveryPointVerifier.countryCodes.join(', ')}.`,
      );
    }
  });
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runAddressQlHttpServer();
}
