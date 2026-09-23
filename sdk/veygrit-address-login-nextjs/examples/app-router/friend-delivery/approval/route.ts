import {
  approveFriendDelivery,
  type FriendDeliveryApprovalResult,
} from '../../../../src/server';

type FriendDeliveryApprovalBody = {
  friendDeliveryRequestRef: string;
  approvalRef: string;
  selectedAddressRef: string;
  consentEnvelopeRef: string;
};

export async function POST(request: Request): Promise<Response> {
  const body = await request.json() as FriendDeliveryApprovalBody;
  const result = await approveFriendDelivery<FriendDeliveryApprovalResult>(
    {
      friendDeliveryRequestRef: body.friendDeliveryRequestRef,
      approvalRef: body.approvalRef,
      selectedAddressRef: body.selectedAddressRef,
      consentEnvelopeRef: body.consentEnvelopeRef,
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
          throw new Error('Friend Delivery approval failed.');
        }
        return await response.json() as FriendDeliveryApprovalResult;
      },
    },
  );

  return Response.json(result);
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}
