import React, { useState } from 'react';

import {
  GuestCheckoutButton,
  VeygritProvider,
  createGuestCheckoutHandoffHttpTransport,
  type VeyIdGuestCheckoutHandoffBlockedResult,
  type VeyIdGuestCheckoutHandoffInput,
  type VeyIdGuestCheckoutHandoffResult,
} from '../../src/index';

export type CheckoutGuestCheckoutProps = VeyIdGuestCheckoutHandoffInput & {
  publishableKey: string;
  handoffEndpoint?: string;
};

export function CheckoutGuestCheckout(props: CheckoutGuestCheckoutProps) {
  return (
    <VeygritProvider publishableKey={props.publishableKey}>
      <CheckoutGuestCheckoutInner {...props} />
    </VeygritProvider>
  );
}

function CheckoutGuestCheckoutInner({
  publishableKey: _publishableKey,
  handoffEndpoint = '/api/veygrit/guest-checkout/handoff',
  ...input
}: CheckoutGuestCheckoutProps) {
  const [lastHandoff, setLastHandoff] = useState<VeyIdGuestCheckoutHandoffResult | null>(null);
  const [blockedHandoff, setBlockedHandoff] = useState<VeyIdGuestCheckoutHandoffBlockedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <section data-veygrit-guest-checkout="checkout">
      <GuestCheckoutButton
        input={input}
        transport={createGuestCheckoutHandoffHttpTransport({ endpoint: handoffEndpoint })}
        onGuestCheckoutReady={result => {
          setErrorMessage('');
          setBlockedHandoff(null);
          setLastHandoff(result);
        }}
        onGuestCheckoutBlocked={result => {
          setErrorMessage('');
          setLastHandoff(null);
          setBlockedHandoff(result);
        }}
        onGuestCheckoutError={error => {
          setLastHandoff(null);
          setBlockedHandoff(null);
          setErrorMessage(error.message);
        }}
      />
      <output aria-live="polite">
        {lastHandoff
          ? `Guest checkout ready: ${lastHandoff.guestCheckoutAlias}`
          : blockedHandoff
            ? `Guest checkout blocked: ${blockedHandoff.nextAction}`
            : errorMessage}
      </output>
    </section>
  );
}
