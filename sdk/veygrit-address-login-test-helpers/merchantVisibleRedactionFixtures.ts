import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type MerchantVisibleRedactionDisplayField =
  | 'pairwiseSubjectAlias'
  | 'guestCheckoutAlias'
  | 'walletConsentRef'
  | 'addressCredentialRef'
  | 'carrierHandoffRef';

export type MerchantVisibleRedactionRequiredNextAction =
  | 'create-guest-order-from-refs'
  | 'request-address-wallet-consent';

export type MerchantVisibleRedactionRefs = Partial<Record<MerchantVisibleRedactionDisplayField, string>>;

export type MerchantVisibleRedactionDisplayContractFixture = {
  sourceFixture?: string;
  sdkPackage: '@veygrit/address-login-react';
  sdkHelper: 'createMerchantVisibleRedactionDisplayModel';
  example: string;
  boundaryGateId: 'merchant-visible-redaction';
  displayFields: readonly MerchantVisibleRedactionDisplayField[];
  displayRefsByField: MerchantVisibleRedactionRefs;
  requiredNextAction: MerchantVisibleRedactionRequiredNextAction;
  blockedClassCount: number;
  nonClaimCount: number;
  renderedMaterialPolicy: {
    copyBlockedMaterialNames: boolean;
    copyNonClaimText: boolean;
    showCountsOnly: boolean;
  };
};

export type MerchantVisibleRedactionBoundaryFixture = {
  id: 'merchant-visible-redaction';
  safeEvidenceRefs: readonly MerchantVisibleRedactionDisplayField[];
  requiredBlockedMaterial: readonly string[];
  nonClaims: readonly string[];
};

export type MerchantVisibleRedactionAffordanceFixture = {
  boundaryGateId: 'merchant-visible-redaction';
  displayFields: readonly MerchantVisibleRedactionDisplayField[];
  displayRefs: readonly string[];
  blockedMaterial: readonly string[];
  requiredNextAction: MerchantVisibleRedactionRequiredNextAction;
  nonClaims: readonly string[];
};

export type MerchantVisibleRedactionAdapterFixture = {
  boundaryGate: MerchantVisibleRedactionBoundaryFixture;
  displayContract: MerchantVisibleRedactionDisplayContractFixture;
  affordance: MerchantVisibleRedactionAffordanceFixture;
  refs: MerchantVisibleRedactionRefs;
  displayRefs: string[];
};

type VeyIdCoreFixture = {
  privacyBoundaryGate: MerchantVisibleRedactionBoundaryFixture;
  merchantVisibleRedactionDisplayContract: MerchantVisibleRedactionDisplayContractFixture;
};

type HostedAddressLoginFixture = {
  merchantVisibleRedactionDisplayContract: MerchantVisibleRedactionDisplayContractFixture;
};

function readWorkspaceFixture(path: string): string {
  const fixturePath = [
    path,
    join('..', '..', path),
  ].find(candidate => existsSync(candidate));
  assert.ok(fixturePath, `${path} is required`);
  return readFileSync(fixturePath, 'utf8');
}

export function displayRefsFromMerchantVisibleRedactionContract(
  contract: MerchantVisibleRedactionDisplayContractFixture,
): string[] {
  return contract.displayFields.map(field => {
    const ref = contract.displayRefsByField[field];
    if (!ref) {
      assert.fail(`${field} display ref is required`);
    }
    return ref;
  });
}

export function loadVeyIdCoreMerchantVisibleRedactionFixture(): VeyIdCoreFixture {
  return JSON.parse(readWorkspaceFixture('docs/specs/fixtures/veygrit-id-core-v0.1.json')) as VeyIdCoreFixture;
}

export function loadHostedAddressLoginMerchantVisibleRedactionDisplayContract(): MerchantVisibleRedactionDisplayContractFixture {
  const fixture = JSON.parse(
    readWorkspaceFixture('docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json'),
  ) as HostedAddressLoginFixture;
  return fixture.merchantVisibleRedactionDisplayContract;
}

export function createVeyIdCoreMerchantVisibleRedactionAdapterFixture(): MerchantVisibleRedactionAdapterFixture {
  const fixture = loadVeyIdCoreMerchantVisibleRedactionFixture();
  const displayContract = fixture.merchantVisibleRedactionDisplayContract;
  const displayRefs = displayRefsFromMerchantVisibleRedactionContract(displayContract);

  return {
    boundaryGate: fixture.privacyBoundaryGate,
    displayContract,
    affordance: {
      boundaryGateId: displayContract.boundaryGateId,
      displayFields: displayContract.displayFields,
      displayRefs,
      blockedMaterial: fixture.privacyBoundaryGate.requiredBlockedMaterial,
      requiredNextAction: displayContract.requiredNextAction,
      nonClaims: fixture.privacyBoundaryGate.nonClaims,
    },
    refs: displayContract.displayRefsByField,
    displayRefs,
  };
}
