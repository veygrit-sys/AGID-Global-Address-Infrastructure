import type { Express, Request } from 'express';

import {
  POS_ACCEPTANCE_MODEL_VERSION,
  createPosAcceptanceReceipt,
  type PosAcceptanceChannel,
  type PosAcceptanceReceipt,
} from '../../lib/posAcceptance';
import {
  POS_OFFLINE_USAGE_LEDGER_VERSION,
  POS_OFFLINE_USAGE_SYNC_ACTION,
  buildPosOfflineUsageSyncEvent,
  normalizePosOfflineUsageSyncItem,
  type PosOfflineUsageSyncEvent,
} from '../../lib/posOfflineUsageLedger';
import {
  AGID_SECURE_POS_MODEL_VERSION,
} from '../../lib/agidSecurePos';
import { getPosRuntimePolicy } from '../../lib/posRuntimePolicy';
import { requestIdFor, sendAgidResult } from '../agidResult';
import { arrayOrUndefined, objectBody } from '../requestParsing';
import { createConfiguredPosAgidSecureRegistryStore } from '../posAgidSecureRegistryAdapters';
import {
  type PosAgidSecureDeferredSyncItem,
  type PosAgidSecureRegistryStoreAdapter,
} from '../posAgidSecureRegistryStore';
import {
  requireConfiguredAdminToken,
  verifyTerminalBodySignature,
} from '../routeSecurity';

const RECENT_RECEIPT_LIMIT = 50;
const AGID_S_JTI_PATTERN = /^[0-9A-Z]{16,64}$/;

function readChannel(value: unknown): PosAcceptanceChannel {
  return value === 'qr' || value === 'nfc' || value === 'manual'
    ? value
    : 'manual';
}

function readNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function cleanRegistryText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readNowMs(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return Date.now();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function configuredPosAdminToken(value: string | undefined) {
  return value?.trim() || process.env.AGID_POS_ADMIN_TOKEN?.trim() || '';
}

function adminTokenConfigured(token: string) {
  return Boolean(token);
}

function hasAdminToken(req: Request, expectedToken: string) {
  return requireConfiguredAdminToken(req, {
    expectedToken,
    headerName: 'X-AGID-POS-Admin-Token',
    missingError: 'POS registry admin token is not configured.',
    invalidError: 'Invalid POS registry admin token',
    missingWarning: 'set AGID_POS_ADMIN_TOKEN before enabling POS registry admin operations',
  });
}

function isRegistrySyncItem(value: unknown): value is PosAgidSecureDeferredSyncItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const action = (value as Partial<PosAgidSecureDeferredSyncItem>).action;
  return action === 'mark-used' || action === 'revoke-token' || action === 'revoke-key';
}

function containsAdminRegistryAction(items: PosAgidSecureDeferredSyncItem[]) {
  return items.some(item => item.action === 'revoke-token' || item.action === 'revoke-key');
}

function usedShippingLabelNullifiers(receipts: PosAcceptanceReceipt[]) {
  return receipts
    .filter(receipt => Boolean(
      receipt.accepted
      && receipt.shippingLabel?.scanRole === 'recipient'
      && receipt.shippingLabel.recipientControlVerified
      && receipt.shippingLabel.nullifier,
    ))
    .map(receipt => receipt.shippingLabel?.nullifier)
    .filter((value): value is string => Boolean(value));
}

function combinedUsedShippingLabelNullifiers(
  receipts: PosAcceptanceReceipt[],
  syncedOfflineNullifiers: Iterable<string>,
) {
  return Array.from(new Set([
    ...usedShippingLabelNullifiers(receipts),
    ...Array.from(syncedOfflineNullifiers),
  ].filter(Boolean)));
}

function readIsoNow(value: unknown) {
  return new Date(readNowMs(value)).toISOString();
}

export function registerPosTerminalRoutes(
  app: Express,
  options: {
    registryStore?: PosAgidSecureRegistryStoreAdapter;
    adminToken?: string;
    terminalSigningSecret?: string;
  } = {},
) {
  const recentReceipts: PosAcceptanceReceipt[] = [];
  const syncedOfflineShippingLabelNullifiers = new Set<string>();
  const offlineUsageSyncAuditEvents: PosOfflineUsageSyncEvent[] = [];
  const registryStore = options.registryStore ?? createConfiguredPosAgidSecureRegistryStore();
  const adminToken = configuredPosAdminToken(options.adminToken);
  const terminalSigningSecret = options.terminalSigningSecret
    ?? process.env.AGID_POS_TERMINAL_SIGNING_SECRET?.trim()
    ?? process.env.AGID_TERMINAL_SIGNING_SECRET?.trim()
    ?? '';
  const markUsedReplayCache = new Set<string>();

  app.get('/api/pos/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: {
        modelVersion: POS_ACCEPTANCE_MODEL_VERSION,
        supportedChannels: ['qr', 'nfc', 'manual'],
        supportedPayloads: ['agid:address:*', 'agid:waybill:*', 'agid:nfc:*', 'AGIDS1-*', 'direct-public-AGID'],
        rawPayloadStorage: false,
        receiptLimit: RECENT_RECEIPT_LIMIT,
        agidSecure: {
          modelVersion: AGID_SECURE_POS_MODEL_VERSION,
          decryptsOnTerminalOnly: true,
          registryChecks: ['revocation', 'used-status', 'freshness'],
          sharedGroupKeysAllowed: false,
          keyRotationSupported: true,
          persistentRegistrySupported: true,
          deferredSyncSupported: true,
          adminTokenConfigured: adminTokenConfigured(adminToken),
        },
        offlineUsageLedger: {
          modelVersion: POS_OFFLINE_USAGE_LEDGER_VERSION,
          localUsedLedgerSupported: true,
          deferredServerSyncSupported: true,
          syncEndpoint: '/api/pos/offline-usage/sync',
          conflictDisposition: 'audit-required',
          rawPayloadStorage: false,
          rawAddressStorage: false,
          rawAgidStorage: false,
          rawWaybillIdStorage: false,
          rawProofStorage: false,
        },
        browserNfcRequires: [
          'secure-context',
          'Web NFC capable browser',
          'user permission',
        ],
        runtimePolicy: getPosRuntimePolicy(),
      },
      confidence: 1,
      sources: ['agid-pos-terminal'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/pos/acceptance/recent', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: {
        modelVersion: POS_ACCEPTANCE_MODEL_VERSION,
        receipts: recentReceipts,
      },
      confidence: 1,
      sources: ['agid-pos-terminal'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/pos/agid-s/registry', async (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: await registryStore.publicStatus(),
      confidence: 1,
      sources: ['agid-pos-agid-s-file-registry'],
      warnings: adminTokenConfigured(adminToken) ? [] : ['admin-token-not-configured-for-revocation-management'],
      cache: 'none',
    });
  });

  app.get('/api/pos/agid-s/registry/audit', async (req, res) => {
    const limit = readNumber(req.query.limit) ?? 25;
    sendAgidResult(req, res, {
      ok: true,
      data: {
        events: await registryStore.recentAudit(limit),
        registry: await registryStore.publicStatus(),
      },
      confidence: 1,
      sources: ['agid-pos-agid-s-file-registry'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/pos/agid-s/registry/verify', async (req, res) => {
    const body = objectBody(req.body);
    const requestId = requestIdFor(req);
    const keyId = cleanRegistryText(body.keyId);
    const jti = cleanRegistryText(body.jti).toUpperCase();
    const exp = readNumber(body.exp);
    const nowMs = readNowMs(body.now);

    if (!keyId || !jti || !AGID_S_JTI_PATTERN.test(jti)) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing or invalid AGID-S keyId/jti',
        sources: ['agid-pos-agid-s-used-status-registry'],
        warnings: ['keyId and jti are required; decrypted AGID and address are not accepted by this endpoint'],
        cache: 'none',
        requestId,
      }, 400);
    }

    const decision = await registryStore.verify({
      keyId,
      jti,
      exp,
      now: nowMs,
    });

    sendAgidResult(req, res, {
      ok: decision.valid,
      data: {
        decision,
        registry: await registryStore.publicStatus(nowMs),
      },
      error: decision.valid ? undefined : decision.errors[0] ?? 'AGID-S registry rejected the token',
      confidence: decision.valid ? 1 : 0.2,
      sources: ['agid-pos-agid-s-file-registry'],
      warnings: decision.warnings,
      cache: 'none',
      requestId,
    }, decision.valid ? 200 : 409);
  });

  app.post('/api/pos/agid-s/registry/mark-used', async (req, res) => {
    const body = objectBody(req.body);
    const requestId = requestIdFor(req);
    const keyId = cleanRegistryText(body.keyId);
    const jti = cleanRegistryText(body.jti).toUpperCase();
    const nowMs = readNowMs(body.now);

    if (!keyId || !jti || !AGID_S_JTI_PATTERN.test(jti)) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing or invalid AGID-S keyId/jti',
        sources: ['agid-pos-agid-s-file-registry'],
        warnings: ['Only keyId, jti, terminalId, and timestamps are accepted; no address payload is stored'],
        cache: 'none',
        requestId,
      }, 400);
    }

    const terminalAuth = verifyTerminalBodySignature(body, {
      expectedSecret: terminalSigningSecret,
      replayCache: markUsedReplayCache,
      operation: 'pos:agid-s:mark-used',
      payload: {
        keyId,
        jti,
      },
      missingSecretError: 'POS terminal signing secret is not configured.',
    });
    if (terminalAuth.ok === false) {
      return sendAgidResult(req, res, {
        ok: false,
        error: terminalAuth.error,
        sources: ['agid-pos-agid-s-file-registry'],
        warnings: terminalAuth.warnings,
        cache: 'none',
        requestId,
      }, terminalAuth.statusCode);
    }

    const result = await registryStore.markUsed({
      keyId,
      jti,
      terminalId: terminalAuth.terminalId,
      operatorId: cleanRegistryText(body.operatorId) || undefined,
      requestId,
      now: nowMs,
    });

    if (!result.ok) {
      return sendAgidResult(req, res, {
        ok: false,
        data: {
          decision: result.decision,
          event: result.event,
          registry: result.registry,
        },
        error: result.event.errors[0] ?? 'AGID-S token cannot be marked used',
        sources: ['agid-pos-agid-s-file-registry'],
        warnings: result.decision?.warnings ?? [],
        cache: 'none',
        requestId,
      }, 409);
    }

    sendAgidResult(req, res, {
      ok: true,
      data: {
        status: 'used',
        jtiTail: jti.slice(-8),
        keyId,
        terminalId: terminalAuth.terminalId,
        event: result.event,
        registry: result.registry,
      },
      confidence: 1,
      sources: ['agid-pos-agid-s-file-registry'],
      warnings: terminalAuth.warnings,
      cache: 'none',
      requestId,
    });
  });

  app.post('/api/pos/agid-s/registry/revoke-token', async (req, res) => {
    const body = objectBody(req.body);
    const requestId = requestIdFor(req);
    const auth = hasAdminToken(req, adminToken);
    if (auth.ok === false) {
      return sendAgidResult(req, res, {
        ok: false,
        error: auth.error,
        sources: ['agid-pos-agid-s-file-registry'],
        warnings: auth.warnings,
        cache: 'none',
        requestId,
      }, auth.statusCode);
    }

    const result = await registryStore.revokeToken({
      jti: cleanRegistryText(body.jti).toUpperCase(),
      terminalId: cleanRegistryText(body.terminalId) || undefined,
      operatorId: cleanRegistryText(body.operatorId) || undefined,
      reason: cleanRegistryText(body.reason) || undefined,
      requestId,
      now: readNowMs(body.now),
    });

    sendAgidResult(req, res, {
      ok: result.ok,
      data: result,
      error: result.ok ? undefined : result.event.errors[0] ?? 'AGID-S token revocation failed',
      confidence: result.ok ? 1 : 0.2,
      sources: ['agid-pos-agid-s-file-registry'],
      warnings: auth.warnings,
      cache: 'none',
      requestId,
    }, result.ok ? 200 : 400);
  });

  app.post('/api/pos/agid-s/registry/revoke-key', async (req, res) => {
    const body = objectBody(req.body);
    const requestId = requestIdFor(req);
    const auth = hasAdminToken(req, adminToken);
    if (auth.ok === false) {
      return sendAgidResult(req, res, {
        ok: false,
        error: auth.error,
        sources: ['agid-pos-agid-s-file-registry'],
        warnings: auth.warnings,
        cache: 'none',
        requestId,
      }, auth.statusCode);
    }

    const result = await registryStore.revokeKey({
      keyId: cleanRegistryText(body.keyId),
      terminalId: cleanRegistryText(body.terminalId) || undefined,
      operatorId: cleanRegistryText(body.operatorId) || undefined,
      reason: cleanRegistryText(body.reason) || undefined,
      requestId,
      now: readNowMs(body.now),
    });

    sendAgidResult(req, res, {
      ok: result.ok,
      data: result,
      error: result.ok ? undefined : result.event.errors[0] ?? 'AGID-S key revocation failed',
      confidence: result.ok ? 1 : 0.2,
      sources: ['agid-pos-agid-s-file-registry'],
      warnings: auth.warnings,
      cache: 'none',
      requestId,
    }, result.ok ? 200 : 400);
  });

  app.post('/api/pos/agid-s/registry/sync-offline', async (req, res) => {
    const body = objectBody(req.body);
    const requestId = requestIdFor(req);
    const items = arrayOrUndefined<PosAgidSecureDeferredSyncItem>(body.items)
      ?? arrayOrUndefined<PosAgidSecureDeferredSyncItem>(body.events)
      ?? [];

    if (items.length === 0) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Offline sync requires at least one registry item',
        sources: ['agid-pos-agid-s-file-registry'],
        warnings: ['items must contain mark-used, revoke-token, or revoke-key events without address payloads'],
        cache: 'none',
        requestId,
      }, 400);
    }
    if (!items.every(isRegistrySyncItem)) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Offline sync contains an unsupported registry action',
        sources: ['agid-pos-agid-s-file-registry'],
        warnings: ['items must be registry event objects with action mark-used, revoke-token, or revoke-key'],
        cache: 'none',
        requestId,
      }, 400);
    }
    const auth = containsAdminRegistryAction(items) ? hasAdminToken(req, adminToken) : { ok: true as const, warnings: [] };
    if (auth.ok === false) {
      return sendAgidResult(req, res, {
        ok: false,
        error: auth.error,
        sources: ['agid-pos-agid-s-file-registry'],
        warnings: auth.warnings,
        cache: 'none',
        requestId,
      }, auth.statusCode);
    }

    const result = await registryStore.applyDeferredSync({
      items,
      terminalId: cleanRegistryText(body.terminalId) || undefined,
      operatorId: cleanRegistryText(body.operatorId) || undefined,
      requestId,
      now: readNowMs(body.now),
    });

    sendAgidResult(req, res, {
      ok: result.rejected === 0,
      data: result,
      error: result.rejected > 0 ? 'Offline sync contained rejected registry events' : undefined,
      confidence: result.rejected === 0 ? 1 : 0.5,
      sources: ['agid-pos-agid-s-file-registry'],
      warnings: result.conflicts > 0 ? ['offline-sync-conflicts-detected'] : [],
      cache: 'none',
      requestId,
    }, result.rejected === 0 ? 200 : 409);
  });

  app.post('/api/pos/offline-usage/sync', (req, res) => {
    const body = objectBody(req.body);
    const requestId = requestIdFor(req);
    const rawItems = arrayOrUndefined<unknown>(body.items)
      ?? arrayOrUndefined<unknown>(body.events)
      ?? [];

    if (rawItems.length === 0) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Offline usage sync requires at least one used-nullifier item',
        sources: ['agid-pos-offline-usage-ledger'],
        warnings: ['items must contain metadata-only shipping-label nullifier usage records'],
        cache: 'none',
        requestId,
      }, 400);
    }

    const now = readIsoNow(body.now);
    const knownNullifiers = new Set(combinedUsedShippingLabelNullifiers(
      recentReceipts,
      syncedOfflineShippingLabelNullifiers,
    ));
    const events: PosOfflineUsageSyncEvent[] = [];
    let accepted = 0;
    let rejected = 0;
    let conflicts = 0;

    rawItems.slice(0, 200).forEach((rawItem, index) => {
      const item = normalizePosOfflineUsageSyncItem(rawItem);
      if (!item) {
        rejected += 1;
        events.push({
          eventId: `POUSE-${requestId}-${index}`,
          action: POS_OFFLINE_USAGE_SYNC_ACTION,
          createdAt: now,
          nullifier: '',
          nullifierTail: '',
          outcome: 'rejected',
          errors: ['offline-usage-sync-item-invalid'],
          auditRequired: true,
        });
        return;
      }

      if (knownNullifiers.has(item.nullifier)) {
        conflicts += 1;
        events.push(buildPosOfflineUsageSyncEvent({
          item,
          outcome: 'conflict',
          errors: ['shipping-label-nullifier-already-used'],
          now,
        }));
        return;
      }

      accepted += 1;
      knownNullifiers.add(item.nullifier);
      syncedOfflineShippingLabelNullifiers.add(item.nullifier);
      events.push(buildPosOfflineUsageSyncEvent({
        item,
        outcome: 'accepted',
        now,
      }));
    });

    if (rawItems.length > 200) {
      rejected += rawItems.length - 200;
      events.push({
        eventId: `POUSE-${requestId}-truncated`,
        action: POS_OFFLINE_USAGE_SYNC_ACTION,
        createdAt: now,
        nullifier: '',
        nullifierTail: '',
        outcome: 'rejected',
        errors: ['offline-usage-sync-limit-exceeded'],
        auditRequired: true,
      });
    }

    offlineUsageSyncAuditEvents.unshift(...events);
    if (offlineUsageSyncAuditEvents.length > 500) {
      offlineUsageSyncAuditEvents.length = 500;
    }

    const auditRequired = conflicts + rejected;
    return sendAgidResult(req, res, {
      ok: auditRequired === 0,
      data: {
        modelVersion: POS_OFFLINE_USAGE_LEDGER_VERSION,
        accepted,
        rejected,
        conflicts,
        auditRequired,
        events,
        usedCount: syncedOfflineShippingLabelNullifiers.size,
        conflictDisposition: 'audit-required',
        rawPayloadStorage: false,
        rawAddressStorage: false,
        rawAgidStorage: false,
        rawWaybillIdStorage: false,
        rawProofStorage: false,
      },
      error: auditRequired > 0 ? 'Offline usage sync contains conflicts requiring audit' : undefined,
      confidence: auditRequired > 0 ? 0.55 : 1,
      sources: ['agid-pos-offline-usage-ledger'],
      warnings: auditRequired > 0 ? ['offline-usage-conflicts-require-audit'] : [],
      cache: 'none',
      requestId,
    }, auditRequired > 0 ? 409 : 200);
  });

  app.post('/api/pos/acceptance', (req, res) => {
    const body = objectBody(req.body);
    const requestId = requestIdFor(req);
    const payload = typeof body.payload === 'string'
      ? body.payload
      : typeof body.text === 'string'
        ? body.text
        : '';
    const receipt = createPosAcceptanceReceipt({
      payload,
      channel: readChannel(body.channel),
      scanRole: body.scanRole === 'recipient' ? 'recipient' : body.scanRole === 'carrier' ? 'carrier' : undefined,
      recipientProofCode: typeof body.recipientProofCode === 'string' ? body.recipientProofCode : undefined,
      recipientProofSecret: typeof body.recipientProofSecret === 'string' ? body.recipientProofSecret : undefined,
      recipientProofMethod: body.recipientProofMethod === 'passkey-webauthn'
        || body.recipientProofMethod === 'aoid-credential'
        || body.recipientProofMethod === 'nfc-card'
        || body.recipientProofMethod === 'presence-only'
        || body.recipientProofMethod === 'recipient-secret-commitment'
        ? body.recipientProofMethod
        : undefined,
      terminalId: typeof body.terminalId === 'string' ? body.terminalId : undefined,
      operatorId: typeof body.operatorId === 'string' ? body.operatorId : undefined,
      storePosId: typeof body.storePosId === 'string' ? body.storePosId : undefined,
      carrierTerminalId: typeof body.carrierTerminalId === 'string' ? body.carrierTerminalId : undefined,
      carrierTerminalSignature: typeof body.carrierTerminalSignature === 'string' ? body.carrierTerminalSignature : undefined,
      carrierTerminalSignedAt: typeof body.carrierTerminalSignedAt === 'string' ? body.carrierTerminalSignedAt : undefined,
      carrierLocation: body.carrierLocation && typeof body.carrierLocation === 'object' && !Array.isArray(body.carrierLocation)
        ? body.carrierLocation as { latitude?: number; longitude?: number; lat?: number; lon?: number; lng?: number; accuracyMeters?: number; label?: string }
        : undefined,
      carrierLocationLat: readNumber(body.carrierLocationLat),
      carrierLocationLon: readNumber(body.carrierLocationLon),
      carrierLocationAccuracyMeters: readNumber(body.carrierLocationAccuracyMeters),
      carrierLocationLabel: typeof body.carrierLocationLabel === 'string' ? body.carrierLocationLabel : undefined,
      purpose: typeof body.purpose === 'string' ? body.purpose : undefined,
      amount: readNumber(body.amount),
      currency: typeof body.currency === 'string' ? body.currency : undefined,
      paymentKind: typeof body.paymentKind === 'string' ? body.paymentKind : undefined,
      settlementMode: typeof body.settlementMode === 'string' ? body.settlementMode : undefined,
      paymentId: typeof body.paymentId === 'string' ? body.paymentId : undefined,
      escrowId: typeof body.escrowId === 'string' ? body.escrowId : undefined,
      payerCommitment: typeof body.payerCommitment === 'string' ? body.payerCommitment : undefined,
      payeeCommitment: typeof body.payeeCommitment === 'string' ? body.payeeCommitment : undefined,
      paymentStatus: typeof body.paymentStatus === 'string' ? body.paymentStatus : undefined,
      tokenSymbol: typeof body.tokenSymbol === 'string' ? body.tokenSymbol : undefined,
      tokenContract: typeof body.tokenContract === 'string' ? body.tokenContract : undefined,
      paymentNetworkId: typeof body.paymentNetworkId === 'string' ? body.paymentNetworkId : undefined,
      paymentContractAddress: typeof body.paymentContractAddress === 'string' ? body.paymentContractAddress : undefined,
      observedPaymentTxHash: typeof body.observedPaymentTxHash === 'string' ? body.observedPaymentTxHash : undefined,
      releaseAfterHandoff: typeof body.releaseAfterHandoff === 'boolean' ? body.releaseAfterHandoff : undefined,
      highRiskPaymentMode: typeof body.highRiskPaymentMode === 'boolean' ? body.highRiskPaymentMode : undefined,
      recipientChallenge: typeof body.recipientChallenge === 'string' ? body.recipientChallenge : undefined,
      recipientChallengeSignature: typeof body.recipientChallengeSignature === 'string' ? body.recipientChallengeSignature : undefined,
      recipientChallengeAlgorithm: typeof body.recipientChallengeAlgorithm === 'string' ? body.recipientChallengeAlgorithm : undefined,
      recipientChallengePublicKeyHint: typeof body.recipientChallengePublicKeyHint === 'string' ? body.recipientChallengePublicKeyHint : undefined,
    }, {
      now: typeof body.now === 'string' ? body.now : undefined,
      requestId,
      usedShippingLabelNullifiers: combinedUsedShippingLabelNullifiers(
        recentReceipts,
        syncedOfflineShippingLabelNullifiers,
      ),
    });

    recentReceipts.unshift(receipt);
    if (recentReceipts.length > RECENT_RECEIPT_LIMIT) {
      recentReceipts.length = RECENT_RECEIPT_LIMIT;
    }

    sendAgidResult(req, res, {
      ok: receipt.accepted,
      data: receipt,
      error: receipt.accepted ? undefined : receipt.errors[0] ?? 'POS acceptance failed',
      confidence: receipt.accepted ? 0.92 : 0.1,
      sources: ['agid-pos-terminal', 'registered-address-qr', 'shipping-label-qr'],
      warnings: receipt.warnings,
      cache: 'none',
      requestId,
    }, receipt.accepted ? 200 : 400);
  });
}
