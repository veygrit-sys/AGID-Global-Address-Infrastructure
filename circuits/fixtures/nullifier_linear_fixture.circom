pragma circom 2.1.6;

/*
  Test fixture only.

  This circuit proves repository wiring for Circom/snarkjs and public/private
  signal separation. It is not a production nullifier construction.
*/
template AgidNullifierLinearFixture() {
  signal input holderSecret;
  signal input scopeSecret;
  signal input scopeHash;
  signal input nullifierHash;
  signal output valid;

  signal computed;
  computed <== holderSecret + scopeSecret + scopeHash;
  computed === nullifierHash;
  valid <== 1;
}

component main { public [scopeHash, nullifierHash] } = AgidNullifierLinearFixture();
