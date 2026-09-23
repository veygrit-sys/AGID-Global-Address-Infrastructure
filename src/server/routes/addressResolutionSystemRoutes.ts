import type { Express } from 'express';

import {
  createInMemoryAgidRegistryApiStore,
  type AgidRegistryApiStoreAdapter,
} from '../../lib/agidRegistryApi';
import {
  getAddressResolutionSystemCapabilities,
  resolveAddressSystem,
  type AddressResolutionMode,
} from '../../lib/addressResolutionSystem';
import {
  createInMemoryAddressResolutionLedgerStore,
  type AddressResolutionLedgerStoreAdapter,
} from '../addressResolutionLedgerStore';
import { sendAgidResult } from '../agidResult';
import { objectBody, objectOrUndefined } from '../requestParsing';

export type AddressResolutionSystemRouteOptions = {
  registryStore?: Pick<AgidRegistryApiStoreAdapter, 'verify'>;
  ledgerStore?: AddressResolutionLedgerStoreAdapter;
};

const MODES = new Set<AddressResolutionMode>([
  'local-only',
  'server-registry',
  'address-dns',
  'zk-proof',
  'ethereum-registry',
  'hybrid',
]);

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function modeFrom(value: unknown): AddressResolutionMode {
  const mode = clean(value) as AddressResolutionMode;
  return MODES.has(mode) ? mode : 'local-only';
}

function publicPayloadFromBody(body: Record<string, unknown>) {
  const explicitPayload = objectOrUndefined(body.payload);
  if (explicitPayload) return explicitPayload;

  return Object.fromEntries(Object.entries({
    ownerName: body.ownerName,
    zone: body.zone,
    issuerId: body.issuerId,
    credentialCommitment: body.credentialCommitment,
    addressReferenceCommitment: body.addressReferenceCommitment,
    aoidCommitment: body.aoidCommitment,
    agidCommitment: body.agidCommitment,
    freshnessRoot: body.freshnessRoot,
    revocationRoot: body.revocationRoot,
    evidenceRoot: body.evidenceRoot,
    nullifierHash: body.nullifierHash,
    scope: body.scope,
    address: body.address,
    addressText: body.addressText,
    postalCode: body.postalCode,
    countryCode: body.countryCode,
    agid: body.agid,
    recipient: body.recipient,
  }).filter(([, value]) => value !== undefined));
}

function statusCodeFor(result: Awaited<ReturnType<typeof resolveAddressSystem>>) {
  return result.internetProtocols.httpStatus.code;
}

export function registerAddressResolutionSystemRoutes(
  app: Express,
  options: AddressResolutionSystemRouteOptions = {},
) {
  const registryStore = options.registryStore ?? createInMemoryAgidRegistryApiStore();
  const ledgerStore = options.ledgerStore ?? createInMemoryAddressResolutionLedgerStore();

  app.get('/api/address-resolution/capabilities', (req, res) => {
    return sendAgidResult(req, res, {
      ok: true,
      data: getAddressResolutionSystemCapabilities(),
      confidence: 1,
      sources: ['address-resolution-system'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-resolution/resolve', async (req, res) => {
    const body = objectBody(req.body);
    const result = await resolveAddressSystem({
      payload: publicPayloadFromBody(body),
      address: objectOrUndefined(body.address),
      addressText: clean(body.addressText),
      countryCode: clean(body.countryCode),
      targetCountries: Array.isArray(body.targetCountries) ? body.targetCountries.map(clean).filter(Boolean) : undefined,
      postalCode: clean(body.postalCode),
      postalEvidence: Array.isArray(body.postalEvidence) ? body.postalEvidence as any : undefined,
      referenceRecords: Array.isArray(body.referenceRecords) ? body.referenceRecords as any : undefined,
      agid: clean(body.agid),
      lat: typeof body.lat === 'number' ? body.lat : undefined,
      lon: typeof body.lon === 'number' ? body.lon : undefined,
      language: clean(body.language),
      acceptLanguage: clean(body.acceptLanguage) || clean(req.header('accept-language')),
      availableLanguages: Array.isArray(body.availableLanguages) ? body.availableLanguages.map(clean).filter(Boolean) : undefined,
      mode: modeFrom(body.mode),
      domain: clean(body.domain),
      salt: clean(body.salt),
      now: clean(body.now),
      highRiskMode: Boolean(body.highRiskMode),
      allowPublicAgid: Boolean(body.allowPublicAgid),
      registryStore,
      quorum: typeof body.quorum === 'number' ? body.quorum : undefined,
      minTrustScore: typeof body.minTrustScore === 'number' ? body.minTrustScore : undefined,
      timeoutMs: typeof body.timeoutMs === 'number' ? body.timeoutMs : undefined,
      minResolvedConfidence: typeof body.minResolvedConfidence === 'number' ? body.minResolvedConfidence : undefined,
      zone: clean(body.zone),
      ownerName: clean(body.ownerName),
      issuerId: clean(body.issuerId),
      credentialCommitment: clean(body.credentialCommitment),
      addressReferenceCommitment: clean(body.addressReferenceCommitment),
      aoidCommitment: clean(body.aoidCommitment),
      agidCommitment: clean(body.agidCommitment),
      freshnessRoot: clean(body.freshnessRoot),
      revocationRoot: clean(body.revocationRoot),
      evidenceRoot: clean(body.evidenceRoot),
      nullifierHash: clean(body.nullifierHash),
      scope: clean(body.scope),
      requireAnchoredFreshnessRoot: Boolean(body.requireAnchoredFreshnessRoot),
      includePrivateLocal: body.includePrivateLocal !== false,
      routeAdvertisements: Array.isArray(body.routeAdvertisements) ? body.routeAdvertisements as any : undefined,
      requireVerifiedRouteSignatures: Boolean(body.requireVerifiedRouteSignatures),
      issuerAuthEnvelope: objectOrUndefined(body.issuerAuthEnvelope) as any,
      issuerAuthPolicy: objectOrUndefined(body.issuerAuthPolicy) as any,
      requireVerifiedIssuerSignature: Boolean(body.requireVerifiedIssuerSignature),
      serviceRecords: Array.isArray(body.serviceRecords) ? body.serviceRecords as any : undefined,
      requireVerifiedServiceRecordSignatures: Boolean(body.requireVerifiedServiceRecordSignatures),
      revocationStatuses: Array.isArray(body.revocationStatuses) ? body.revocationStatuses as any : undefined,
      requireVerifiedRevocationSignatures: Boolean(body.requireVerifiedRevocationSignatures),
      consentGrant: objectOrUndefined(body.consentGrant) as any,
      requiredConsentScopes: Array.isArray(body.requiredConsentScopes) ? body.requiredConsentScopes.map(clean).filter(Boolean) as any : undefined,
      requireVerifiedConsentSignature: Boolean(body.requireVerifiedConsentSignature),
      cachePolicy: objectOrUndefined(body.cachePolicy) as any,
      edgeRoutingContext: objectOrUndefined(body.edgeRoutingContext) as any,
      localDiscoveryRecords: Array.isArray(body.localDiscoveryRecords) ? body.localDiscoveryRecords as any : undefined,
    });
    const ok = result.decision !== 'reject';
    const ledgerWarnings: string[] = [];
    let ledger;

    try {
      ledger = await ledgerStore.recordResolution(result, {
        nullifierHash: clean(body.nullifierHash),
        nullifierScope: clean(body.scope) || clean(body.domain) || result.domain,
        nullifierUsage: clean(body.nullifierUsage) || 'address-resolution',
        nullifierExpiresAt: clean(body.nullifierExpiresAt),
      });
    } catch (error) {
      ledgerWarnings.push('address-resolution-ledger-write-failed');
      console.warn('[address-resolution-ledger] write failed:', error);
    }

    return sendAgidResult(req, res, {
      ok,
      data: {
        ...result,
        ...(ledger ? { ledger } : {}),
      },
      error: ok ? undefined : result.errors[0] || result.status,
      confidence: result.confidence,
      sources: Array.from(new Set([...result.sources, 'address-resolution-ledger'])),
      warnings: Array.from(new Set([...result.warnings, ...ledgerWarnings])),
      cache: 'none',
    }, statusCodeFor(result));
  });

  app.get('/api/address-resolution/ledger/status', async (req, res) => {
    const stats = await ledgerStore.stats();
    return sendAgidResult(req, res, {
      ok: true,
      data: stats,
      confidence: 1,
      sources: ['address-resolution-ledger'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/address-resolution/ledger/recent', async (req, res) => {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const recent = await ledgerStore.recent(limit);
    return sendAgidResult(req, res, {
      ok: true,
      data: {
        entries: recent,
        count: recent.length,
      },
      confidence: 1,
      sources: ['address-resolution-ledger'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/address-resolution/ledger/streams/:streamId/events', async (req, res) => {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const events = await ledgerStore.getEventStream(req.params.streamId, limit);
    return sendAgidResult(req, res, {
      ok: true,
      data: {
        streamId: req.params.streamId,
        events,
        count: events.length,
      },
      confidence: 1,
      sources: ['address-resolution-ledger', 'address-temporal-ledger'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/address-resolution/ledger/streams/:streamId/snapshot', async (req, res) => {
    const at = typeof req.query.at === 'string' ? req.query.at : undefined;
    const snapshot = await ledgerStore.getSnapshot(req.params.streamId, at);
    if (!snapshot) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'address-temporal-ledger-snapshot-not-found',
        sources: ['address-resolution-ledger', 'address-temporal-ledger'],
        warnings: [],
        cache: 'none',
      }, 404);
    }

    return sendAgidResult(req, res, {
      ok: true,
      data: snapshot,
      confidence: 1,
      sources: ['address-resolution-ledger', 'address-temporal-ledger'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/address-resolution/ledger/:resolutionId', async (req, res) => {
    const entry = await ledgerStore.getResolution(req.params.resolutionId);
    if (!entry) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'address-resolution-ledger-entry-not-found',
        sources: ['address-resolution-ledger'],
        warnings: [],
        cache: 'none',
      }, 404);
    }

    return sendAgidResult(req, res, {
      ok: true,
      data: entry,
      confidence: 1,
      sources: ['address-resolution-ledger'],
      warnings: [],
      cache: 'none',
    });
  });
}
