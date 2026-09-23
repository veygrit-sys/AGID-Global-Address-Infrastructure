import React, { useMemo, useState } from 'react';

import {
  VeygritProvider,
  useFriendDelivery,
  type FriendDeliveryRequestResult,
} from '../../src/index';

export type CheckoutFriend = {
  alias: string;
  displayName: string;
};

export type CheckoutFriendDeliveryProps = {
  publishableKey: string;
  purchaserSubjectAlias: string;
  cartRef: string;
  friends: CheckoutFriend[];
  requestEndpoint?: string;
};

export function CheckoutFriendDelivery(props: CheckoutFriendDeliveryProps) {
  return (
    <VeygritProvider publishableKey={props.publishableKey}>
      <CheckoutFriendDeliveryInner {...props} />
    </VeygritProvider>
  );
}

function CheckoutFriendDeliveryInner({
  purchaserSubjectAlias,
  cartRef,
  friends,
  requestEndpoint = '/api/veygrit/friend-delivery/request',
}: CheckoutFriendDeliveryProps) {
  const [selectedFriendAlias, setSelectedFriendAlias] = useState(friends[0]?.alias ?? '');
  const [lastRequest, setLastRequest] = useState<FriendDeliveryRequestResult | null>(null);
  const selectedFriend = useMemo(
    () => friends.find(friend => friend.alias === selectedFriendAlias),
    [friends, selectedFriendAlias],
  );

  const friendDelivery = useFriendDelivery({
    requestTransport: async ({ payload }) => {
      const response = await fetch(requestEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Friend Delivery request failed.');
      }
      return await response.json() as FriendDeliveryRequestResult;
    },
  });

  async function requestDelivery() {
    if (!selectedFriend) return;
    const result = await friendDelivery.requestFriendDelivery({
      purchaserSubjectAlias,
      friendAlias: selectedFriend.alias,
      cartRef,
    });
    setLastRequest(result);
  }

  return (
    <section data-veygrit-friend-delivery="checkout">
      <label>
        Send to Address Wallet friend
        <select
          value={selectedFriendAlias}
          onChange={event => setSelectedFriendAlias(event.currentTarget.value)}
        >
          {friends.map(friend => (
            <option key={friend.alias} value={friend.alias}>
              {friend.displayName}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={!selectedFriend || friendDelivery.isLoading}
        onClick={requestDelivery}
      >
        {friendDelivery.isLoading ? 'Requesting approval...' : 'Request delivery approval'}
      </button>
      <output aria-live="polite">
        {lastRequest
          ? `Approval requested: ${lastRequest.friendDeliveryRequestRef}`
          : friendDelivery.error?.message ?? ''}
      </output>
    </section>
  );
}
