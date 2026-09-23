import type { Express, Request, Response } from 'express';

import {
  buildAddressElementSession,
  listAddressElementCapabilities,
  type AddressElementInput,
} from '../../lib/addressElement';
import {
  evaluateAddressRadar,
  listAddressRadarRules,
  type AddressRadarInput,
} from '../../lib/addressRadar';
import {
  evaluateAddressSignal,
  listAddressSignalChecks,
  type AddressSignalInput,
} from '../../lib/addressSignal';
import { sendAgidResult } from '../agidResult';
import { objectBody } from '../requestParsing';

const PRIVATE_PUBLIC_API_KEYS = new Set([
  'rawAddress',
  'addressText',
  'plaintextAddress',
  'recipient',
  'recipientName',
  'phone',
  'phoneNumber',
  'unit',
  'room',
  'proofCode',
  'recipientSecret',
  'privateKey',
  'secret',
  'rawAgid',
  'rawAoid',
]);

function privateMaterialPaths(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => privateMaterialPaths(item, `${prefix}[${index}]`));
  }

  const paths: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (key === 'fields' || key === 'feedback') {
      paths.push(path);
      continue;
    }
    if (PRIVATE_PUBLIC_API_KEYS.has(key)) paths.push(path);
    if ((key === 'agid' || key === 'aoid') && typeof nested === 'string' && nested.trim()) paths.push(path);
    paths.push(...privateMaterialPaths(nested, path));
  }
  return paths;
}

function rejectPrivateMaterial(req: Request, res: Response, body: unknown) {
  const privatePaths = privateMaterialPaths(body);
  if (privatePaths.length === 0) return false;

  sendAgidResult(req, res, {
    ok: false,
    data: {
      rejectedPrivateFieldCount: privatePaths.length,
      acceptedPublicSurface: 'fieldPresence-safeFingerprint-evidence-only',
      rawFieldValuesAccepted: false,
    },
    error: 'Address Element/Radar/Signal public APIs do not accept raw address, raw AGID/AOID, recipient, phone, unit, or correction text fields',
    sources: ['agid-address-element', 'agid-address-radar', 'agid-address-signal'],
    warnings: ['use-client-side-address-element-for-raw-field-entry'],
    cache: 'none',
  }, 400);
  return true;
}

export function registerAddressElementRadarRoutes(app: Express) {
  app.get('/api/address-element/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listAddressElementCapabilities(),
      confidence: 1,
      sources: ['agid-address-element'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-element/session', (req, res) => {
    const body = objectBody(req.body);
    if (rejectPrivateMaterial(req, res, body)) return;

    const session = buildAddressElementSession(body as AddressElementInput);
    sendAgidResult(req, res, {
      ok: session.status !== 'blocked',
      data: session,
      error: session.status === 'blocked' ? 'Address Element session is blocked by high-risk or quality policy' : undefined,
      confidence: session.status === 'blocked' ? 0.2 : session.quality.score,
      sources: ['agid-address-element'],
      warnings: session.warnings,
      cache: 'none',
    }, session.status === 'blocked' ? 409 : 200);
  });

  app.get('/api/address-radar/rules', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listAddressRadarRules(),
      confidence: 1,
      sources: ['agid-address-radar'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-radar/evaluate', (req, res) => {
    const body = objectBody(req.body);
    if (rejectPrivateMaterial(req, res, body)) return;

    const evaluation = evaluateAddressRadar(body as AddressRadarInput);
    sendAgidResult(req, res, {
      ok: evaluation.decision !== 'block',
      data: evaluation,
      error: evaluation.decision === 'block' ? 'Address Radar blocked this address workflow event' : undefined,
      confidence: evaluation.decision === 'allow' ? 1 : evaluation.decision === 'review' ? 0.6 : 0.2,
      sources: ['agid-address-radar'],
      warnings: evaluation.warnings,
      cache: 'none',
    }, evaluation.decision === 'block' ? 409 : 200);
  });

  app.get('/api/address-signal/checks', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listAddressSignalChecks(),
      confidence: 1,
      sources: ['agid-address-signal'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-signal/evaluate', (req, res) => {
    const body = objectBody(req.body);
    if (rejectPrivateMaterial(req, res, body)) return;

    const evaluation = evaluateAddressSignal(body as AddressSignalInput);
    sendAgidResult(req, res, {
      ok: evaluation.outcome !== 'reject',
      data: evaluation,
      error: evaluation.outcome === 'reject' ? 'Address Signal rejected this pre-delivery handoff' : undefined,
      confidence: evaluation.outcome === 'proceed' ? 1 : evaluation.outcome === 'challenge' ? 0.75 : evaluation.outcome === 'review' ? 0.6 : 0.2,
      sources: ['agid-address-signal', 'agid-address-radar'],
      warnings: evaluation.radar.warnings,
      cache: 'none',
    }, evaluation.outcome === 'reject' ? 409 : 200);
  });
}
