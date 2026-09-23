import { parseAddressQrIntake } from '../addressQrIntake';
import { isValidAGIDFormat, normalizeAGIDInput } from '../agidSecurity';
import { parseShippingLabelQrPayload } from '../shippingLabelQr';

export type PosDestinationQrKind =
  | 'registered-address'
  | 'shipping-label'
  | 'hotel-checkin'
  | 'public-agid'
  | 'unsupported'
  | 'empty';

export type PosDestinationQrStatus =
  | 'ready'
  | 'needs-review'
  | 'expired'
  | 'unsupported'
  | 'empty';

export type PosDestinationQrDeliveryEligibility =
  | 'can-accept'
  | 'needs-review'
  | 'reject';

export type PosDestinationQrSummary = {
  kind: PosDestinationQrKind;
  status: PosDestinationQrStatus;
  title: string;
  safeDestination: string;
  primaryReference: string;
  alias: string;
  receiptHint: string;
  deliveryEligibility: PosDestinationQrDeliveryEligibility;
  source: 'registered-address-qr' | 'shipping-label-qr' | 'hotel-checkin-qr' | 'public-agid' | 'unknown';
  nextAction:
    | 'accept_at_pos'
    | 'review_before_acceptance'
    | 'scan_guest_address_qr'
    | 'manual_entry'
    | 'reject_or_refresh';
  evidence: string[];
  warnings: string[];
  privacy: {
    rawAddressDisplayed: false;
    recipientDisplayed: false;
    rawPayloadDisplayed: false;
    preciseCoordinateDisplayed: false;
  };
};

const POS_DESTINATION_QR_PRIVACY = {
  rawAddressDisplayed: false,
  recipientDisplayed: false,
  rawPayloadDisplayed: false,
  preciseCoordinateDisplayed: false,
} as const;

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function compact(values: Array<string | undefined>) {
  return values.map(value => cleanText(value)).filter(Boolean);
}

function shortTail(value: unknown, size = 8) {
  const cleaned = cleanText(value);
  return cleaned.length > size ? cleaned.slice(-size) : cleaned;
}

function isExpired(expiresAt: string, now: string) {
  const end = Date.parse(expiresAt);
  const current = Date.parse(now);
  return Number.isFinite(end) && Number.isFinite(current) && end <= current;
}

function deliveryEligibility(status: PosDestinationQrStatus): PosDestinationQrDeliveryEligibility {
  if (status === 'ready') return 'can-accept';
  if (status === 'expired' || status === 'unsupported') return 'reject';
  return 'needs-review';
}

function unsupportedSummary(warnings: string[] = ['destination-qr-unsupported-format']): PosDestinationQrSummary {
  const status: PosDestinationQrStatus = 'unsupported';
  return {
    kind: 'unsupported',
    status,
    title: 'Unsupported destination QR',
    safeDestination: 'Manual address review required',
    primaryReference: 'unknown',
    alias: 'unknown',
    receiptHint: 'receipt-not-issued',
    deliveryEligibility: deliveryEligibility(status),
    source: 'unknown',
    nextAction: 'manual_entry',
    evidence: [],
    warnings,
    privacy: POS_DESTINATION_QR_PRIVACY,
  };
}

export function buildPosDestinationQrSummary(
  payload: string,
  now = new Date().toISOString(),
): PosDestinationQrSummary {
  const text = cleanText(payload);
  if (!text) {
    const status: PosDestinationQrStatus = 'empty';
    return {
      kind: 'empty',
      status,
      title: 'No destination QR',
      safeDestination: 'Scan or paste a registered address, shipping label, hotel check-in, or public AGID QR.',
      primaryReference: 'none',
      alias: 'none',
      receiptHint: 'receipt-not-issued',
      deliveryEligibility: deliveryEligibility(status),
      source: 'unknown',
      nextAction: 'manual_entry',
      evidence: [],
      warnings: [],
      privacy: POS_DESTINATION_QR_PRIVACY,
    };
  }

  const shippingLabel = parseShippingLabelQrPayload(text);
  if (shippingLabel) {
    const expired = isExpired(shippingLabel.expiresAt, now);
    const referenceTail = shortTail(shippingLabel.address.referenceCommitment);
    const safeParts = compact([
      shippingLabel.address.kind,
      shippingLabel.address.country,
      shippingLabel.address.city,
      shippingLabel.address.postcode,
      referenceTail ? `ref:${referenceTail}` : undefined,
    ]);
    const needsReview = shippingLabel.addressAccuracy.decision !== 'accept' || shippingLabel.riskLevel === 'high';
    const warnings = compact([
      expired ? 'shipping-label-expired' : undefined,
      needsReview ? 'shipping-label-address-or-risk-review-required' : undefined,
      shippingLabel.recipientProof.method === 'presence-only' ? 'recipient-proof-presence-only' : undefined,
    ]);

    const status: PosDestinationQrStatus = expired ? 'expired' : needsReview ? 'needs-review' : 'ready';
    const primaryReference = shippingLabel.waybillId;

    return {
      kind: 'shipping-label',
      status,
      title: 'Shipping label destination QR',
      safeDestination: safeParts.join(' / ') || 'Shipping label address reference',
      primaryReference,
      alias: primaryReference,
      receiptHint: 'receipt-pending',
      deliveryEligibility: deliveryEligibility(status),
      source: 'shipping-label-qr',
      nextAction: expired ? 'reject_or_refresh' : needsReview ? 'review_before_acceptance' : 'accept_at_pos',
      evidence: compact([
        `waybill:${shippingLabel.waybillId}`,
        shippingLabel.waybillCommitment ? `waybill-commitment:${shortTail(shippingLabel.waybillCommitment)}` : undefined,
        shippingLabel.address.referenceCommitment ? `address-ref:${shortTail(shippingLabel.address.referenceCommitment)}` : undefined,
        `nullifier:${shortTail(shippingLabel.nullifier.value)}`,
      ]),
      warnings,
      privacy: POS_DESTINATION_QR_PRIVACY,
    };
  }

  const addressIntake = parseAddressQrIntake(text, now);
  if (addressIntake.kind === 'registered-address') {
    const recordRef = addressIntake.record.agid || addressIntake.record.id;
    const status: PosDestinationQrStatus = addressIntake.status === 'ready' ? 'ready' : 'needs-review';
    const primaryReference = `${addressIntake.record.type}:${shortTail(recordRef)}`;
    const safeParts = compact([
      addressIntake.formPatch.country,
      addressIntake.formPatch.state,
      addressIntake.formPatch.city,
      addressIntake.formPatch.postcode,
    ]);

    return {
      kind: 'registered-address',
      status,
      title: addressIntake.record.type === 'AOID' ? 'AOID destination QR' : 'Registered address destination QR',
      safeDestination: safeParts.join(' / ') || `${addressIntake.record.type} destination reference`,
      primaryReference,
      alias: primaryReference,
      receiptHint: 'receipt-pending',
      deliveryEligibility: deliveryEligibility(status),
      source: 'registered-address-qr',
      nextAction: addressIntake.status === 'ready' ? 'accept_at_pos' : 'review_before_acceptance',
      evidence: compact([
        `record:${shortTail(addressIntake.record.id)}`,
        addressIntake.record.agid ? `agid:${shortTail(addressIntake.record.agid)}` : undefined,
        addressIntake.record.quality?.confidenceBand ? `quality:${addressIntake.record.quality.confidenceBand}` : undefined,
      ]),
      warnings: addressIntake.warnings,
      privacy: POS_DESTINATION_QR_PRIVACY,
    };
  }

  if (addressIntake.kind === 'hotel-checkin') {
    const status = addressIntake.status === 'expired'
      ? 'expired'
      : addressIntake.status === 'requires_review'
        ? 'needs-review'
        : 'ready';
    const safeParts = compact([
      addressIntake.session.hotel.countryCode,
      addressIntake.session.hotel.city,
      addressIntake.session.hotel.hotelAlias,
    ]);

    const primaryReference = addressIntake.session.safeCheckInRef;

    return {
      kind: 'hotel-checkin',
      status,
      title: 'Hotel delivery destination QR',
      safeDestination: safeParts.join(' / ') || 'Hotel check-in destination reference',
      primaryReference,
      alias: primaryReference,
      receiptHint: 'receipt-pending',
      deliveryEligibility: deliveryEligibility(status),
      source: 'hotel-checkin-qr',
      nextAction: addressIntake.nextAction === 'scan_guest_address_qr'
        ? 'scan_guest_address_qr'
        : status === 'expired'
          ? 'reject_or_refresh'
          : 'review_before_acceptance',
      evidence: [
        `check-in:${shortTail(addressIntake.session.safeCheckInRef)}`,
        `scopes:${addressIntake.session.requestedScopes.join('+')}`,
      ],
      warnings: addressIntake.warnings,
      privacy: POS_DESTINATION_QR_PRIVACY,
    };
  }

  const agid = normalizeAGIDInput(text);
  if (agid && isValidAGIDFormat(agid)) {
    const status: PosDestinationQrStatus = 'ready';
    const primaryReference = `AGID:${shortTail(agid)}`;
    return {
      kind: 'public-agid',
      status,
      title: 'Public AGID destination',
      safeDestination: `AGID reference ${shortTail(agid)}`,
      primaryReference,
      alias: primaryReference,
      receiptHint: 'receipt-pending',
      deliveryEligibility: deliveryEligibility(status),
      source: 'public-agid',
      nextAction: 'accept_at_pos',
      evidence: [`agid:${shortTail(agid)}`],
      warnings: [],
      privacy: POS_DESTINATION_QR_PRIVACY,
    };
  }

  return unsupportedSummary(addressIntake.warnings);
}
