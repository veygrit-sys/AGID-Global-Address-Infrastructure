import {
  createVeyIdGuestCheckoutHandoff,
  type VeyIdGuestCheckoutHandoffResult,
} from '../../../../src/server';

type VeyIdGuestCheckoutHandoffRequestBody = {
  clientId: string;
  pairwiseSubjectAlias: string;
  walletConsentRef: string;
  addressCredentialRef: string;
  accessTokenRef: string;
  orderRef?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as VeyIdGuestCheckoutHandoffRequestBody;
    const result = await createVeyIdGuestCheckoutHandoff<VeyIdGuestCheckoutHandoffResult>(
      {
        clientId: body.clientId,
        pairwiseSubjectAlias: body.pairwiseSubjectAlias,
        walletConsentRef: body.walletConsentRef,
        addressCredentialRef: body.addressCredentialRef,
        accessTokenRef: body.accessTokenRef,
        orderRef: body.orderRef,
      },
      {
        serverAccessToken: requiredEnv('VEYGRIT_SERVER_ACCESS_TOKEN'),
        transport: async ({ url, headers, payload }) => {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error('Vey ID guest checkout handoff failed.');
          }
          return await response.json() as VeyIdGuestCheckoutHandoffResult;
        },
      },
    );

    return Response.json({
      mode: result.mode,
      status: result.status,
      nextAction: result.nextAction,
      guestCheckoutAlias: result.guestCheckoutAlias,
      walletConsentRef: result.walletConsentRef,
      addressCredentialRef: result.addressCredentialRef,
      carrierHandoffRef: result.carrierHandoffRef,
      merchantAccountCreationRequired: result.merchantAccountCreationRequired,
      ecPasswordRequired: result.ecPasswordRequired,
      walletLoginRequired: result.walletLoginRequired,
    });
  } catch {
    return Response.json(
      {
        mode: 'ec-guest-checkout',
        status: 'blocked',
        nextAction: 'repair-token-exchange',
        errorCode: 'guest_checkout_handoff_failed',
      },
      { status: 502 },
    );
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}
