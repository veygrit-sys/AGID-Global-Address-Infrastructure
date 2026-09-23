import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildSpecialDeliveryProfile,
  normalizeSpecialDeliveryDestinationKind,
  normalizeSpecialDeliveryParcelKind,
} from './specialDeliveryProfile';

test('detects hotel, airport, golf course, and ski resort destinations from labels', () => {
  assert.equal(normalizeSpecialDeliveryDestinationKind(undefined, 'Hotel front desk'), 'hotel');
  assert.equal(normalizeSpecialDeliveryDestinationKind(undefined, 'Narita Airport Terminal 1'), 'airport');
  assert.equal(normalizeSpecialDeliveryDestinationKind(undefined, 'Kawana Golf Course clubhouse'), 'golf-course');
  assert.equal(normalizeSpecialDeliveryDestinationKind(undefined, 'Niseko ski resort lodge'), 'ski-resort');
  assert.equal(normalizeSpecialDeliveryDestinationKind(undefined, 'ホテル フロント'), 'hotel');
  assert.equal(normalizeSpecialDeliveryDestinationKind(undefined, '空港カウンター'), 'airport');
  assert.equal(normalizeSpecialDeliveryDestinationKind(undefined, 'ゴルフ場 バッグドロップ'), 'golf-course');
  assert.equal(normalizeSpecialDeliveryDestinationKind(undefined, 'スキー場 レンタル'), 'ski-resort');
});

test('detects sports and luggage parcel classes', () => {
  assert.equal(normalizeSpecialDeliveryParcelKind('golf clubs'), 'golf-bag');
  assert.equal(normalizeSpecialDeliveryParcelKind('snowboard'), 'ski-equipment');
  assert.equal(normalizeSpecialDeliveryParcelKind('baggage'), 'luggage');
  assert.equal(normalizeSpecialDeliveryParcelKind('ゴルフバッグ'), 'golf-bag');
  assert.equal(normalizeSpecialDeliveryParcelKind('スキー板'), 'ski-equipment');
});

test('builds special delivery profiles with counter handoff and privacy-safe codes', () => {
  const hotel = buildSpecialDeliveryProfile({
    destinationKind: 'hotel',
    parcelKind: 'luggage',
    handoffPoint: 'front desk',
  });

  assert.equal(hotel.destinationKind, 'hotel');
  assert.equal(hotel.parcelKind, 'luggage');
  assert.equal(hotel.handoffPoint, 'front-desk');
  assert.ok(hotel.requiredSkills.includes('hotel-front-desk'));
  assert.ok(hotel.requiredSkills.includes('high-value'));
  assert.equal(hotel.recipientProofRequired, true);
  assert.equal(hotel.counterAcceptanceRequired, true);
  assert.ok(hotel.specialHandlingCodes.includes('hotel-front-desk-or-bell-desk-handoff'));

  const ski = buildSpecialDeliveryProfile({
    destinationKind: 'ski-resort',
    parcelKind: 'ski-equipment',
    handoffPoint: 'rental counter',
  });
  assert.ok(ski.requiredSkills.includes('ski-equipment-handling'));
  assert.ok(ski.requiredSkills.includes('snow-route'));
  assert.ok(ski.specialHandlingCodes.includes('seasonal-road-status-required'));

  const golf = buildSpecialDeliveryProfile({
    destinationKind: 'golf-course',
    parcelKind: 'golf-bag',
    handoffPoint: 'bag drop',
  });
  assert.ok(golf.requiredSkills.includes('golf-bag-handling'));
  assert.ok(golf.requiredSkills.includes('heavy-item'));
  assert.ok(golf.handoffOptions.includes('bag-drop'));
});
