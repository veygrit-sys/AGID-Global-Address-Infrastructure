import type { Express } from 'express';

import {
  buildAddressConnectRegistry,
  discoverAddressConnectEndpoints,
  listAddressConnectCapabilities,
  type AddressConnectDiscoverQuery,
  type AddressConnectRegistryInput,
} from '../../lib/addressConnect';
import {
  buildAddressConnectOperationsReport,
  listAddressConnectOperationalRequirements,
  type AddressConnectOperationsInput,
} from '../../lib/addressConnectOperations';
import {
  buildAddressScaleTopologyPlan,
  listAddressScaleArchitectureCapabilities,
  type AddressScaleTopologyInput,
} from '../../lib/addressScaleArchitecture';
import {
  evaluateAddressLaunchCenter,
  listAddressLaunchCenterChecklist,
  type AddressLaunchCenterInput,
} from '../../lib/addressLaunchCenter';
import {
  buildAddressDashboardSnapshot,
  buildAddressDisputeCase,
  buildAddressIdentityVerification,
  buildAddressTaxCustomsContext,
  buildAddressWebhookEvent,
  listAddressOperationsCapabilities,
  type AddressDashboardSnapshotInput,
  type AddressDisputeCaseInput,
  type AddressIdentityVerificationInput,
  type AddressTaxCustomsContextInput,
  type AddressWebhookEventInput,
} from '../../lib/addressOperations';
import {
  buildAddressTerminalFleetSnapshot,
  listAddressTerminalCapabilities,
  type AddressTerminalFleetInput,
} from '../../lib/addressTerminal';
import { sendAgidResult } from '../agidResult';
import { objectBody } from '../requestParsing';

export function registerAddressConnectTerminalRoutes(app: Express) {
  app.get('/api/address-operations/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listAddressOperationsCapabilities(),
      confidence: 1,
      sources: ['agid-address-operations'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-identity/verify', (req, res) => {
    const verification = buildAddressIdentityVerification(objectBody(req.body) as AddressIdentityVerificationInput);
    sendAgidResult(req, res, {
      ok: verification.verified,
      data: verification,
      error: verification.accepted
        ? verification.verified
          ? undefined
          : 'Address Identity verification requires review or more public evidence references'
        : 'Address Identity verification rejected private address, raw AOID/AGID, passkey secret, or proof code material',
      confidence: verification.verified ? 1 : verification.accepted ? 0.55 : 0.1,
      sources: ['agid-address-identity'],
      warnings: verification.warnings,
      cache: 'none',
    }, verification.verified ? 200 : verification.accepted ? 409 : 400);
  });

  app.post('/api/address-webhooks/event', (req, res) => {
    const event = buildAddressWebhookEvent(objectBody(req.body) as AddressWebhookEventInput);
    sendAgidResult(req, res, {
      ok: event.accepted,
      data: event,
      error: event.accepted
        ? undefined
        : 'Address Webhook event rejected unsupported topic or private address material',
      confidence: event.accepted ? 1 : 0.2,
      sources: ['agid-address-webhooks'],
      warnings: event.warnings,
      cache: 'none',
    }, event.accepted ? 200 : 400);
  });

  app.post('/api/address-disputes/case', (req, res) => {
    const dispute = buildAddressDisputeCase(objectBody(req.body) as AddressDisputeCaseInput);
    sendAgidResult(req, res, {
      ok: dispute.accepted,
      data: dispute,
      error: dispute.accepted
        ? undefined
        : 'Address Dispute case rejected unsupported type, missing public evidence refs, or private address material',
      confidence: dispute.accepted ? 0.85 : 0.2,
      sources: ['agid-address-disputes'],
      warnings: dispute.warnings,
      cache: 'none',
    }, dispute.accepted ? 200 : 400);
  });

  app.post('/api/address-tax-customs/context', (req, res) => {
    const context = buildAddressTaxCustomsContext(objectBody(req.body) as AddressTaxCustomsContextInput);
    sendAgidResult(req, res, {
      ok: context.accepted && context.status !== 'rejected' && context.status !== 'insufficient-data',
      data: context,
      error: context.accepted
        ? context.status === 'insufficient-data'
          ? 'Address Tax / Customs context needs HS code, declared value, currency, or private address proof flags'
          : undefined
        : 'Address Tax / Customs context rejected private address material or invalid countries',
      confidence: context.status === 'ready-for-estimate' ? 1 : context.status === 'needs-manual-review' ? 0.7 : 0.3,
      sources: ['agid-address-tax-customs'],
      warnings: context.warnings,
      cache: 'none',
    }, !context.accepted ? 400 : context.status === 'insufficient-data' ? 422 : 200);
  });

  app.post('/api/address-dashboard/snapshot', (req, res) => {
    const snapshot = buildAddressDashboardSnapshot(objectBody(req.body) as AddressDashboardSnapshotInput);
    sendAgidResult(req, res, {
      ok: snapshot.accepted && snapshot.overallStatus !== 'blocked',
      data: snapshot,
      error: snapshot.accepted
        ? snapshot.overallStatus === 'blocked'
          ? 'Address Dashboard snapshot has blocked operational sections'
          : undefined
        : 'Address Dashboard snapshot rejected private address material',
      confidence: snapshot.overallStatus === 'ready' ? 1 : snapshot.overallStatus === 'attention' ? 0.75 : 0.3,
      sources: ['agid-address-dashboard'],
      warnings: snapshot.warnings,
      cache: 'none',
    }, snapshot.accepted ? snapshot.overallStatus === 'blocked' ? 409 : 200 : 400);
  });

  app.get('/api/address-connect/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listAddressConnectCapabilities(),
      confidence: 1,
      sources: ['agid-address-connect'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-connect/registry', (req, res) => {
    const registry = buildAddressConnectRegistry(objectBody(req.body) as AddressConnectRegistryInput);
    sendAgidResult(req, res, {
      ok: registry.accepted,
      data: registry,
      error: registry.accepted
        ? undefined
        : 'Address Connect registry rejected private address, raw AGID/AOID, API key, or secret material',
      confidence: registry.accepted ? 1 : 0.2,
      sources: ['agid-address-connect'],
      warnings: registry.warnings,
      cache: 'none',
    }, registry.accepted ? 200 : 400);
  });

  app.post('/api/address-connect/discover', (req, res) => {
    const body = objectBody(req.body);
    const registryInput = body.registry ?? body;
    const query = objectBody(body.query) as AddressConnectDiscoverQuery;
    const registry = buildAddressConnectRegistry(registryInput as AddressConnectRegistryInput);

    if (!registry.accepted) {
      return sendAgidResult(req, res, {
        ok: false,
        data: registry,
        error: 'Address Connect discovery rejected private address, raw AGID/AOID, API key, or secret material',
        confidence: 0.2,
        sources: ['agid-address-connect'],
        warnings: registry.warnings,
        cache: 'none',
      }, 400);
    }

    const discovery = discoverAddressConnectEndpoints(registry, query);
    return sendAgidResult(req, res, {
      ok: true,
      data: discovery,
      confidence: discovery.matchedEndpointCount > 0 ? 1 : 0.5,
      sources: ['agid-address-connect'],
      warnings: discovery.warnings,
      cache: 'none',
    });
  });

  app.get('/api/address-connect/operations/requirements', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listAddressConnectOperationalRequirements(),
      confidence: 1,
      sources: ['agid-address-connect-operations'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-connect/operations/report', (req, res) => {
    const report = buildAddressConnectOperationsReport(objectBody(req.body) as AddressConnectOperationsInput);
    sendAgidResult(req, res, {
      ok: report.accepted && report.status !== 'blocked',
      data: report,
      error: report.accepted
        ? report.status === 'blocked'
          ? 'Address Connect operations are blocked by webhook, SLA, monitoring, or log-retention controls'
          : undefined
        : 'Address Connect operations rejected private address material or unsafe log-retention policy',
      confidence: report.status === 'ready' ? 1 : report.status === 'attention' ? 0.75 : 0.25,
      sources: ['agid-address-connect-operations'],
      warnings: report.warnings,
      cache: 'none',
    }, report.accepted ? report.status === 'blocked' ? 409 : 200 : 400);
  });

  app.get('/api/address-scale/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listAddressScaleArchitectureCapabilities(),
      confidence: 1,
      sources: ['agid-address-scale-architecture'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-scale/topology', (req, res) => {
    const plan = buildAddressScaleTopologyPlan(objectBody(req.body) as AddressScaleTopologyInput);
    sendAgidResult(req, res, {
      ok: plan.accepted && plan.status !== 'blocked',
      data: plan,
      error: plan.accepted
        ? plan.status === 'blocked'
          ? 'Address Scale topology is blocked by incompatible cache, ledger, or privacy requirements'
          : undefined
        : 'Address Scale topology rejected private address, raw AGID/AOID, proof code, API key, token, or secret material',
      confidence: plan.status === 'ready' ? 1 : plan.status === 'attention' ? 0.75 : 0.25,
      sources: ['agid-address-scale-architecture'],
      warnings: plan.warnings,
      cache: 'none',
    }, plan.accepted ? plan.status === 'blocked' ? 409 : 200 : 400);
  });

  app.get('/api/address-terminal/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listAddressTerminalCapabilities(),
      confidence: 1,
      sources: ['agid-address-terminal'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-terminal/fleet', (req, res) => {
    const fleet = buildAddressTerminalFleetSnapshot(objectBody(req.body) as AddressTerminalFleetInput);
    sendAgidResult(req, res, {
      ok: fleet.totals.blocked === 0,
      data: fleet,
      error: fleet.totals.blocked > 0 ? 'Address Terminal fleet has blocked devices or sync conflicts' : undefined,
      confidence: fleet.totals.blocked > 0 ? 0.4 : fleet.totals.attention > 0 ? 0.7 : 1,
      sources: ['agid-address-terminal'],
      warnings: fleet.warnings,
      cache: 'none',
    }, fleet.totals.blocked > 0 ? 409 : 200);
  });

  app.get('/api/address-launch-center/checklist', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listAddressLaunchCenterChecklist(),
      confidence: 1,
      sources: ['agid-address-launch-center'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-launch-center/evaluate', (req, res) => {
    const evaluation = evaluateAddressLaunchCenter(objectBody(req.body) as AddressLaunchCenterInput);
    sendAgidResult(req, res, {
      ok: evaluation.accepted && evaluation.status !== 'blocked',
      data: evaluation,
      error: evaluation.accepted
        ? evaluation.status === 'blocked'
          ? 'Address Launch Center production readiness is blocked by required gates'
          : undefined
        : 'Address Launch Center rejected private address, raw AGID/AOID, proof code, API key, token, or secret material',
      confidence: evaluation.status === 'ready' ? 1 : evaluation.status === 'attention' ? 0.75 : 0.25,
      sources: ['agid-address-launch-center'],
      warnings: evaluation.warnings,
      cache: 'none',
    }, evaluation.accepted ? evaluation.status === 'blocked' ? 409 : 200 : 400);
  });
}
