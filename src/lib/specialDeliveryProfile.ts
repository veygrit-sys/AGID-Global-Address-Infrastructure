export const SPECIAL_DELIVERY_PROFILE_VERSION = 'agid-special-delivery-profile-v1';

export const SPECIAL_DELIVERY_DESTINATION_KINDS = [
  'standard',
  'hotel',
  'airport',
  'golf-course',
  'ski-resort',
] as const;

export const SPECIAL_DELIVERY_PARCEL_KINDS = [
  'standard-parcel',
  'golf-bag',
  'ski-equipment',
  'luggage',
  'oversized-sports-equipment',
] as const;

export const SPECIAL_DELIVERY_HANDOFF_POINTS = [
  'recipient-direct',
  'front-desk',
  'bell-desk',
  'concierge',
  'loading-dock',
  'airport-counter',
  'airport-cargo',
  'clubhouse',
  'pro-shop',
  'bag-drop',
  'ski-lodge',
  'rental-counter',
  'locker',
  'other',
] as const;

export type SpecialDeliveryDestinationKind = typeof SPECIAL_DELIVERY_DESTINATION_KINDS[number];
export type SpecialDeliveryParcelKind = typeof SPECIAL_DELIVERY_PARCEL_KINDS[number];
export type SpecialDeliveryHandoffPoint = typeof SPECIAL_DELIVERY_HANDOFF_POINTS[number];

export type SpecialDeliveryProfileInput = {
  destinationKind?: unknown;
  parcelKind?: unknown;
  handoffPoint?: unknown;
  placeLabel?: unknown;
};

export type SpecialDeliveryProfile = {
  modelVersion: typeof SPECIAL_DELIVERY_PROFILE_VERSION;
  destinationKind: SpecialDeliveryDestinationKind;
  parcelKind: SpecialDeliveryParcelKind;
  handoffPoint?: SpecialDeliveryHandoffPoint;
  handoffOptions: SpecialDeliveryHandoffPoint[];
  requiredSkills: string[];
  recommendedVehicleModes: string[];
  minimumServiceMinutes: number;
  recipientProofRequired: boolean;
  counterAcceptanceRequired: boolean;
  specialHandlingCodes: string[];
  warnings: string[];
};

function clean(value: unknown, maxLength = 120) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function token(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[／/_,.\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function hasAny(text: string, patterns: readonly string[]) {
  return patterns.some(pattern => text.includes(pattern));
}

export function normalizeSpecialDeliveryDestinationKind(
  value: unknown,
  placeLabel?: unknown,
): SpecialDeliveryDestinationKind {
  const explicit = token(value);
  const label = `${token(placeLabel)} ${clean(placeLabel).toLowerCase()}`;
  const candidate = explicit || label;

  if (candidate === 'hotel' || hasAny(candidate, ['hotel', 'ryokan', 'inn', 'front-desk', 'bell-desk', 'ホテル', '旅館'])) {
    return 'hotel';
  }
  if (candidate === 'airport' || hasAny(candidate, ['airport', 'air-cargo', 'terminal', '空港', '航空貨物'])) {
    return 'airport';
  }
  if (candidate === 'golf-course' || hasAny(candidate, ['golf-course', 'golf-club', 'clubhouse', 'pro-shop', 'bag-drop', 'ゴルフ'])) {
    return 'golf-course';
  }
  if (candidate === 'ski-resort' || hasAny(candidate, ['ski-resort', 'ski-area', 'ski-lodge', 'snow-resort', 'スキー', 'ゲレンデ'])) {
    return 'ski-resort';
  }
  return 'standard';
}

export function normalizeSpecialDeliveryParcelKind(
  value: unknown,
  placeLabel?: unknown,
): SpecialDeliveryParcelKind {
  const explicit = token(value);
  const label = `${token(placeLabel)} ${clean(placeLabel).toLowerCase()}`;
  const candidate = explicit || label;

  if (candidate === 'golf-bag' || hasAny(candidate, ['golf-bag', 'golf-club', 'golf-clubs', 'ゴルフバッグ', 'ゴルフクラブ'])) {
    return 'golf-bag';
  }
  if (candidate === 'ski-equipment' || hasAny(candidate, ['ski-equipment', 'ski-board', 'snowboard', 'ski-bag', 'スキー板', 'スノーボード'])) {
    return 'ski-equipment';
  }
  if (candidate === 'luggage' || hasAny(candidate, ['luggage', 'baggage', 'suitcase', '手荷物', '荷物', 'スーツケース'])) {
    return 'luggage';
  }
  if (candidate === 'oversized-sports-equipment' || hasAny(candidate, ['oversized-sports', 'sports-equipment', 'oversize', 'large-sports'])) {
    return 'oversized-sports-equipment';
  }
  return 'standard-parcel';
}

export function normalizeSpecialDeliveryHandoffPoint(value: unknown): SpecialDeliveryHandoffPoint | undefined {
  const normalized = token(value);
  if (!normalized) return undefined;
  if ((SPECIAL_DELIVERY_HANDOFF_POINTS as readonly string[]).includes(normalized)) {
    return normalized as SpecialDeliveryHandoffPoint;
  }
  if (['front', 'reception', 'reception-desk', 'frontdesk', 'フロント', '受付'].includes(normalized)) return 'front-desk';
  if (['bell', 'bellhop', 'bell-desk', 'ベルデスク'].includes(normalized)) return 'bell-desk';
  if (['airport', 'airport-terminal', 'counter', '空港カウンター'].includes(normalized)) return 'airport-counter';
  if (['cargo', 'air-cargo', 'freight', '貨物'].includes(normalized)) return 'airport-cargo';
  if (['golf', 'golf-clubhouse', 'club-house', 'クラブハウス'].includes(normalized)) return 'clubhouse';
  if (['proshop', 'pro-shop', 'ショップ'].includes(normalized)) return 'pro-shop';
  if (['bagdrop', 'bag-drop', 'バッグドロップ'].includes(normalized)) return 'bag-drop';
  if (['ski', 'ski-lodge', 'lodge', 'ロッジ'].includes(normalized)) return 'ski-lodge';
  if (['rental', 'rental-counter', 'レンタル'].includes(normalized)) return 'rental-counter';
  return 'other';
}

function destinationDefaults(kind: SpecialDeliveryDestinationKind) {
  switch (kind) {
    case 'hotel':
      return {
        handoffOptions: ['front-desk', 'bell-desk', 'concierge', 'loading-dock'] as SpecialDeliveryHandoffPoint[],
        requiredSkills: ['hotel-front-desk', 'nfc-pos-handoff'],
        recommendedVehicleModes: ['van', 'car'],
        minimumServiceMinutes: 10,
        recipientProofRequired: true,
        counterAcceptanceRequired: true,
        codes: ['hotel-front-desk-or-bell-desk-handoff', 'booking-reference-commitment-recommended'],
      };
    case 'airport':
      return {
        handoffOptions: ['airport-counter', 'airport-cargo', 'locker'] as SpecialDeliveryHandoffPoint[],
        requiredSkills: ['airport-counter', 'high-value'],
        recommendedVehicleModes: ['van', 'truck'],
        minimumServiceMinutes: 18,
        recipientProofRequired: true,
        counterAcceptanceRequired: true,
        codes: ['airport-security-id-check-required', 'terminal-or-cargo-counter-required', 'unattended-airport-delivery-blocked'],
      };
    case 'golf-course':
      return {
        handoffOptions: ['clubhouse', 'pro-shop', 'bag-drop', 'loading-dock'] as SpecialDeliveryHandoffPoint[],
        requiredSkills: ['golf-bag-handling'],
        recommendedVehicleModes: ['van', 'truck'],
        minimumServiceMinutes: 12,
        recipientProofRequired: true,
        counterAcceptanceRequired: true,
        codes: ['clubhouse-pro-shop-or-bag-drop-handoff', 'bag-tag-or-tee-time-reference-commitment-recommended'],
      };
    case 'ski-resort':
      return {
        handoffOptions: ['ski-lodge', 'rental-counter', 'front-desk', 'loading-dock'] as SpecialDeliveryHandoffPoint[],
        requiredSkills: ['ski-equipment-handling', 'snow-route'],
        recommendedVehicleModes: ['van', 'truck'],
        minimumServiceMinutes: 16,
        recipientProofRequired: true,
        counterAcceptanceRequired: true,
        codes: ['snow-weather-access-check-required', 'lodge-or-rental-counter-handoff', 'seasonal-road-status-required'],
      };
    default:
      return {
        handoffOptions: ['recipient-direct', 'locker', 'loading-dock'] as SpecialDeliveryHandoffPoint[],
        requiredSkills: [] as string[],
        recommendedVehicleModes: [] as string[],
        minimumServiceMinutes: 6,
        recipientProofRequired: false,
        counterAcceptanceRequired: false,
        codes: [] as string[],
      };
  }
}

function parcelDefaults(kind: SpecialDeliveryParcelKind) {
  switch (kind) {
    case 'golf-bag':
      return {
        requiredSkills: ['golf-bag-handling', 'heavy-item'],
        minimumServiceMinutes: 12,
        recipientProofRequired: true,
        codes: ['golf-bag-long-item-handling', 'golf-bag-tag-commitment-recommended'],
      };
    case 'ski-equipment':
      return {
        requiredSkills: ['ski-equipment-handling', 'heavy-item'],
        minimumServiceMinutes: 14,
        recipientProofRequired: true,
        codes: ['ski-equipment-long-item-handling', 'edge-protection-and-snow-weather-check'],
      };
    case 'luggage':
      return {
        requiredSkills: ['high-value'],
        minimumServiceMinutes: 10,
        recipientProofRequired: true,
        codes: ['luggage-claim-reference-commitment-recommended'],
      };
    case 'oversized-sports-equipment':
      return {
        requiredSkills: ['heavy-item'],
        minimumServiceMinutes: 14,
        recipientProofRequired: true,
        codes: ['oversized-sports-equipment-handling'],
      };
    default:
      return {
        requiredSkills: [] as string[],
        minimumServiceMinutes: 6,
        recipientProofRequired: false,
        codes: [] as string[],
      };
  }
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export function buildSpecialDeliveryProfile(input: SpecialDeliveryProfileInput = {}): SpecialDeliveryProfile {
  const destinationKind = normalizeSpecialDeliveryDestinationKind(input.destinationKind, input.placeLabel);
  const parcelKind = normalizeSpecialDeliveryParcelKind(input.parcelKind, input.placeLabel);
  const handoffPoint = normalizeSpecialDeliveryHandoffPoint(input.handoffPoint);
  const destination = destinationDefaults(destinationKind);
  const parcel = parcelDefaults(parcelKind);
  const handoffOptions = unique([
    ...(handoffPoint ? [handoffPoint] : []),
    ...destination.handoffOptions,
  ]);

  return {
    modelVersion: SPECIAL_DELIVERY_PROFILE_VERSION,
    destinationKind,
    parcelKind,
    ...(handoffPoint ? { handoffPoint } : {}),
    handoffOptions,
    requiredSkills: unique([...destination.requiredSkills, ...parcel.requiredSkills]),
    recommendedVehicleModes: unique(destination.recommendedVehicleModes),
    minimumServiceMinutes: Math.max(destination.minimumServiceMinutes, parcel.minimumServiceMinutes),
    recipientProofRequired: destination.recipientProofRequired || parcel.recipientProofRequired,
    counterAcceptanceRequired: destination.counterAcceptanceRequired,
    specialHandlingCodes: unique([...destination.codes, ...parcel.codes]),
    warnings: unique([
      ...(handoffPoint && !destination.handoffOptions.includes(handoffPoint) && destinationKind !== 'standard'
        ? [`handoff-point-review:${handoffPoint}`]
        : []),
      ...(destinationKind !== 'standard' ? ['special-destination-handoff-required'] : []),
      ...(parcelKind !== 'standard-parcel' ? ['special-parcel-handling-required'] : []),
    ]),
  };
}
