import type { Express } from 'express';

import {
  buildMachineCommunicationDemo,
  buildMachineCommunicationEnvelope,
  listMachineCommunicationCapabilities,
  negotiateMachineCommunication,
  type MachineCapability,
  type MachineCommunicationEnvelope,
} from '../../lib/machineAgidAoidComms';
import { sendAgidResult } from '../agidResult';
import { arrayOrUndefined, objectBody, objectOrUndefined } from '../requestParsing';

function machineEnvelopeFromBody(body: Record<string, unknown>): MachineCommunicationEnvelope | undefined {
  const candidate = objectOrUndefined(body.envelope) ?? objectOrUndefined(body.request);
  return candidate as MachineCommunicationEnvelope | undefined;
}

export function registerMachineAgidAoidRoutes(app: Express) {
  app.get('/api/machine/agid-aoid/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listMachineCommunicationCapabilities(),
      confidence: 1,
      sources: ['agid-aoid-machine-comms'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/machine/agid-aoid/demo', (req, res) => {
    const demo = buildMachineCommunicationDemo(typeof req.query.now === 'string' ? req.query.now : undefined);
    sendAgidResult(req, res, {
      ok: true,
      data: demo,
      confidence: 1,
      sources: ['agid-aoid-machine-comms'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/machine/agid-aoid/envelope', (req, res) => {
    const body = objectBody(req.body);
    try {
      const envelope = buildMachineCommunicationEnvelope({
        from: objectOrUndefined(body.from) ?? {},
        to: objectOrUndefined(body.to) ?? {},
        purpose: body.purpose as any,
        operation: body.operation as any,
        mode: body.mode as any,
        domain: body.domain as string | undefined,
        requestedCapabilities: arrayOrUndefined(body.requestedCapabilities) as MachineCapability[] | undefined,
        conversationId: body.conversationId as string | undefined,
        sequence: typeof body.sequence === 'number' ? body.sequence : undefined,
        createdAt: body.createdAt as string | undefined,
        ttlSeconds: typeof body.ttlSeconds === 'number' ? body.ttlSeconds : undefined,
        publicPayload: body.publicPayload ?? body.payload,
      });

      sendAgidResult(req, res, {
        ok: true,
        data: envelope,
        confidence: 1,
        sources: ['agid-aoid-machine-comms'],
        warnings: envelope.warnings,
        cache: 'none',
      });
    } catch (error) {
      sendAgidResult(req, res, {
        ok: false,
        error: error instanceof Error
          ? error.message.replace(/: .+$/, '')
          : 'Machine envelope could not be created',
        confidence: 0,
        sources: ['agid-aoid-machine-comms'],
        warnings: ['machine-envelope-input-redacted-from-error-response'],
        cache: 'none',
      }, 400);
    }
  });

  app.post('/api/machine/agid-aoid/handshake', (req, res) => {
    const body = objectBody(req.body);
    const envelope = machineEnvelopeFromBody(body);
    if (!envelope) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing machine communication envelope',
        sources: ['agid-aoid-machine-comms'],
        warnings: ['request or envelope is required'],
        cache: 'none',
      }, 400);
    }

    const handshake = negotiateMachineCommunication({
      request: envelope,
      receiverCapabilities: arrayOrUndefined(body.receiverCapabilities) as MachineCapability[] | undefined,
      now: body.now as string | undefined,
    });
    const status = handshake.decision === 'accept'
      ? 200
      : handshake.decision === 'review'
        ? 202
        : 409;

    return sendAgidResult(req, res, {
      ok: handshake.decision !== 'reject',
      data: handshake,
      error: handshake.decision === 'reject'
        ? handshake.errors[0] ?? 'Machine communication handshake rejected'
        : undefined,
      confidence: handshake.decision === 'accept' ? 1 : handshake.decision === 'review' ? 0.6 : 0.15,
      sources: ['agid-aoid-machine-comms'],
      warnings: handshake.warnings,
      cache: 'none',
    }, status);
  });
}
