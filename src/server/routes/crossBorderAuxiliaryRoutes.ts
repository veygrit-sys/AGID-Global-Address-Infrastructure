import type { Express } from 'express';

import {
  buildCrossBorderAuxiliaryContext,
  getCrossBorderAuxiliaryDataLayer,
  getCrossBorderAuxiliarySourcesByDomain,
  getCrossBorderAuxiliarySourcesByPhase,
  getRecommendedFreeCrossBorderSources,
  type CrossBorderAdoptionPhase,
  type CrossBorderDomain,
  type CrossBorderOperationMode,
  type CrossBorderUseCase,
  type ProductRiskFlag,
} from '../../lib/crossBorderAuxiliaryData';
import { sendAgidResult } from '../agidResult';
import { arrayOrUndefined, objectBody, objectOrUndefined, type JsonRecord } from '../requestParsing';

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function useCaseFrom(value: unknown): CrossBorderUseCase {
  return value === 'pos-checkout'
    || value === 'shopping-agent'
    || value === 'humanitarian-handoff'
    || value === 'cross-border-shipping'
    ? value
    : 'cross-border-shipping';
}

function modeFrom(value: unknown): CrossBorderOperationMode | undefined {
  return value === 'mode-0-local-only'
    || value === 'mode-1-server-registry'
    || value === 'mode-2-zk-only'
    || value === 'mode-3-ethereum-registry-only'
    || value === 'mode-4-full-zk-ethereum'
    ? value
    : undefined;
}

function bodyToRiskFlags(value: unknown): ProductRiskFlag[] | undefined {
  const flags = arrayOrUndefined<ProductRiskFlag>(value);
  return flags?.filter((flag) => (
    flag === 'battery'
    || flag === 'hazmat'
    || flag === 'medicine'
    || flag === 'cosmetics'
    || flag === 'food'
    || flag === 'plant-animal'
    || flag === 'controlled-dual-use'
    || flag === 'high-value'
    || flag === 'age-restricted'
  ));
}

function contextInputFromBody(body: JsonRecord) {
  const product = objectOrUndefined(body.product) as JsonRecord | undefined;
  const address = objectOrUndefined(body.address) as JsonRecord | undefined;
  const party = objectOrUndefined(body.party) as JsonRecord | undefined;

  return {
    useCase: useCaseFrom(body.useCase),
    originCountry: String(body.originCountry ?? body.origin ?? ''),
    destinationCountry: String(body.destinationCountry ?? body.destination ?? ''),
    mode: modeFrom(body.mode),
    product: {
      hsCode: optionalString(product?.hsCode ?? body.hsCode),
      barcode: optionalString(product?.barcode ?? body.barcode),
      category: optionalString(product?.category ?? body.category),
      declaredValue: optionalNumber(product?.declaredValue ?? body.declaredValue),
      currency: optionalString(product?.currency ?? body.currency),
      riskFlags: bodyToRiskFlags(product?.riskFlags ?? body.riskFlags),
    },
    address: {
      hasRecipientAddress: address?.hasRecipientAddress === true || body.hasRecipientAddress === true,
      hasPostalCode: address?.hasPostalCode === true || body.hasPostalCode === true,
      hasAgid: address?.hasAgid === true || body.hasAgid === true,
      hasAoidCredential: address?.hasAoidCredential === true || body.hasAoidCredential === true,
    },
    party: {
      hasBusinessVatNumber: party?.hasBusinessVatNumber === true || body.hasBusinessVatNumber === true,
      hasImporterName: party?.hasImporterName === true || body.hasImporterName === true,
      hasExporterName: party?.hasExporterName === true || body.hasExporterName === true,
    },
  };
}

function optionalPhase(value: unknown): CrossBorderAdoptionPhase | undefined {
  return value === 'adopt-now-static'
    || value === 'adopt-now-api'
    || value === 'self-host-or-cache'
    || value === 'operator-import-only'
    || value === 'adopt-after-key-or-terms-review'
    || value === 'optional-reference'
    || value === 'avoid-as-primary'
    ? value
    : undefined;
}

function optionalDomain(value: unknown): CrossBorderDomain | undefined {
  return value === 'address-validation'
    || value === 'postal-standard'
    || value === 'geocoding'
    || value === 'tariff'
    || value === 'hs-code'
    || value === 'trade-statistics'
    || value === 'customs-measures'
    || value === 'vat-tax'
    || value === 'currency'
    || value === 'product-barcode'
    || value === 'business-identity'
    || value === 'route-risk'
    || value === 'carrier-availability'
    || value === 'restriction-screening'
    || value === 'semantic-standard'
    ? value
    : undefined;
}

export function registerCrossBorderAuxiliaryRoutes(app: Express) {
  app.get('/api/cross-border/auxiliary/sources', (req, res) => {
    const domain = optionalDomain(req.query.domain);
    const phase = optionalPhase(req.query.phase);
    const freeOnly = req.query.freeOnly === '1' || req.query.freeOnly === 'true';
    const layer = getCrossBorderAuxiliaryDataLayer();
    const sources = domain
      ? getCrossBorderAuxiliarySourcesByDomain(domain)
      : phase
        ? getCrossBorderAuxiliarySourcesByPhase(phase)
        : freeOnly
          ? getRecommendedFreeCrossBorderSources()
          : layer.sources;

    sendAgidResult(req, res, {
      ok: true,
      data: {
        version: layer.version,
        rule: layer.rule,
        filters: { domain, phase, freeOnly },
        sources,
      },
      confidence: 1,
      sources: ['agid-cross-border-auxiliary-data'],
      warnings: ['sources-are-decision-support-not-customs-clearance'],
      cache: 'hit',
    });
  });

  app.post('/api/cross-border/auxiliary/context', (req, res) => {
    const decision = buildCrossBorderAuxiliaryContext(contextInputFromBody(objectBody(req.body)));

    sendAgidResult(req, res, {
      ok: decision.status === 'ready-for-estimate',
      data: decision,
      error: decision.status === 'ready-for-estimate'
        ? undefined
        : decision.manualReviewReasons[0] ?? 'Cross-border auxiliary context requires review',
      confidence: decision.confidence === 'high' ? 0.9 : decision.confidence === 'medium' ? 0.6 : 0.25,
      sources: ['agid-cross-border-auxiliary-data'],
      warnings: decision.warnings,
      cache: 'none',
    }, decision.status === 'insufficient-data' ? 400 : 200);
  });

  app.post('/api/shopping-agent/cross-border/context', (req, res) => {
    const body = objectBody(req.body);
    const decision = buildCrossBorderAuxiliaryContext({
      ...contextInputFromBody(body),
      useCase: 'shopping-agent',
    });

    sendAgidResult(req, res, {
      ok: decision.status === 'ready-for-estimate',
      data: decision,
      error: decision.status === 'ready-for-estimate'
        ? undefined
        : decision.manualReviewReasons[0] ?? 'Shopping-agent cross-border context requires review',
      confidence: decision.confidence === 'high' ? 0.9 : decision.confidence === 'medium' ? 0.6 : 0.25,
      sources: ['agid-cross-border-auxiliary-data', 'agid-shopping-agent'],
      warnings: decision.warnings,
      cache: 'none',
    }, decision.status === 'insufficient-data' ? 400 : 200);
  });
}
