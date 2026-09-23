# AMT v2 Address Communication Semantics

Status: companion model for Chapter 11

Executable model:

- `src/lib/addressMorphismV2CommunicationSemantics.ts`
- `src/lib/addressMorphismV2CommunicationSemantics.test.ts`

## 1. Purpose

Address Morphism Theory should not stop at resolving a referent.  A resolved
referent must be usable in communication without forcing every party to receive
the raw address.

The central claim is:

```text
Address communication is not raw address broadcast.
It is the exchange of purpose-scoped, evidence-backed, least-disclosure
address facts.
```

This turns an address into a message object that can be verified, acknowledged,
expired, revoked, audited, and refused.

## 2. Address Communication Object

An Address Communication Object, abbreviated ACO, is:

\[
\operatorname{ACO}
=
(
\operatorname{envelope},
\operatorname{claimSet},
\operatorname{purpose},
\operatorname{audience},
\operatorname{payloadType},
\operatorname{disclosureLevel},
\operatorname{proofBundle},
\operatorname{nonce},
\operatorname{expiry},
\operatorname{revocationRef},
\operatorname{auditRef},
\operatorname{replyPolicy}
)
\]

The ACO is not a raw address.  It is a controlled communication wrapper around
an AMT Envelope.

The ACO answers five questions:

| question | example |
| --- | --- |
| What is being claimed? | within delivery zone, not revoked, quality verified |
| Who may read it? | merchant, carrier, hotel, locker, auditor |
| How much is disclosed? | proof-only, country, region, carrier-decryptable |
| How is it verified? | signature, ZK-ready proof, selective disclosure, carrier encryption |
| What happens after receipt? | semantic ACK, rejection, expiry, revocation, audit |

## 3. Payload Types

AMT communication should distinguish payload types explicitly.

```text
proof
commitment
encrypted-address
carrier-token
delivery-session
audit-event
revocation-update
successor-pointer
capability-offer
semantic-ack
```

The important point is that payload type and disclosure level are different.
For example, a carrier-token may be carrier-decryptable, while a merchant proof
should remain proof-only.

## 4. Disclosure Lattice

Disclosure is ordered:

\[
\operatorname{none}
\le
\operatorname{proofOnly}
\le
\operatorname{country}
\le
\operatorname{region}
\le
\operatorname{postalEquivalent}
\le
\operatorname{encryptedAddress}
\le
\operatorname{carrierDecryptable}
\le
\operatorname{rawAddress}
\]

An ACO is policy-compatible only if:

\[
\operatorname{Disclosure}(m)
\le
\operatorname{DisclosureLimit}(\Pi)
\]

and

\[
\operatorname{Disclosure}(m)
\le
\operatorname{DisclosureCapability}(receiver).
\]

This is a lattice-style model: the system should choose the smallest disclosure
that satisfies the receiver's legitimate task.

## 5. ValidComm Predicate

The main validity predicate is:

\[
\operatorname{ValidComm}(m,s,r,c,t)=1
\]

where:

- \(m\) is the ACO;
- \(s\) is the sender;
- \(r\) is the receiver;
- \(c\) is the channel or receiver capability;
- \(t\) is time.

The predicate expands to:

\[
\begin{aligned}
\operatorname{ValidComm}(m,s,r,c,t)=1
\iff&
\operatorname{StateOK}(m.\operatorname{envelope}) \\
&\land \operatorname{PolicyOK}(m.\operatorname{purpose},m.\operatorname{audience}) \\
&\land \operatorname{ClaimsOK}(m.\operatorname{claimSet},\Pi) \\
&\land \operatorname{Disclosure}(m)\le \operatorname{DisclosureLimit}(\Pi) \\
&\land \operatorname{Leak}(m)\le \lambda_{\Pi} \\
&\land \operatorname{Fresh}(m.\operatorname{nonce},m.\operatorname{expiry},t) \\
&\land \operatorname{NotRevoked}(m.\operatorname{revocationRef},t) \\
&\land \operatorname{VerifyProofOrSignature}(m)=1 \\
&\land \operatorname{NoPrivateLeak}(m)=1.
\end{aligned}
\]

This makes communication refusal a first-class result.  If the predicate fails,
the receiver should return a semantic ACK explaining the safe failure state.

## 6. Semantic ACK

Plain network delivery is not enough.  A message can be received but not parsed,
parsed but not accepted, accepted but not deliverable, or deliverable but not
identity-verified.

AMT therefore defines semantic ACK states:

```text
received
parsed
referent_accepted
deliverable
proof_verified
rejected
expired
revoked
manual_review_required
disclosure_denied
policy_mismatch
```

The ACK is not a proof of residence, ownership, or sovereignty.  It only states
what the receiver safely accepted for a declared purpose.

Examples:

| ACO result | semantic ACK | meaning |
| --- | --- | --- |
| merchant proof passes | proof_verified | the requested predicate was verified |
| carrier token passes | deliverable | carrier can execute scoped delivery |
| ambiguous envelope | manual_review_required | do not issue false precision |
| raw address requested by merchant | disclosure_denied | request exceeds disclosure policy |
| expired message | expired | nonce/expiry window failed |
| revoked message | revoked | revocation state blocks use |

## 7. Capability Negotiation

Before sending an ACO, the sender and receiver should negotiate capability:

\[
\operatorname{Negotiate}(\Pi,receiver)
=
(
\operatorname{payloadTypes},
\operatorname{maxMutualDisclosure},
\operatorname{proofTypes},
\operatorname{ackStates},
\operatorname{blockers}
)
\]

This prevents a sender from issuing a carrier-decryptable token to a merchant or
a ZK-ready proof to a receiver that cannot verify it.

## 8. Communication Preservation Theorem

**Theorem.** If \(\operatorname{ValidComm}(m,s,r,c,t)=1\), then the receiver can
verify the address facts in \(m.\operatorname{claimSet}\) for the declared
purpose, while unauthorized private address material is not disclosed by \(m\).

Proof sketch:

1. `PolicyOK` binds purpose and audience.
2. `ClaimsOK` ensures the message claims are within the allowed claim set.
3. The disclosure lattice enforces the maximum disclosure bound.
4. `Leak(m) <= lambda` bounds public signal leakage.
5. `NoPrivateLeak(m)` excludes raw address, recipient, witness, private key,
   proof secret, private unit, and precise-coordinate material.
6. `VerifyProofOrSignature` gives authenticity for the message content.

Therefore the receiver can use the permitted facts without receiving private
address material outside the policy.

## 9. Revocation Safety Theorem

**Theorem.** If an ACO has a revoked revocation reference, then the same
Envelope cannot produce a valid communication message under a policy requiring
revocation checking.

\[
\operatorname{Revoked}(m.\operatorname{revocationRef})
\Rightarrow
\operatorname{ValidComm}(m,s,r,c,t)=0
\]

This is what prevents old credentials, old QR sessions, old carrier tokens, or
old proof bundles from remaining usable after revocation.

## 10. ACK Non-Equivalence Theorem

**Theorem.** A semantic ACK does not imply a stronger claim than the state it
names.

\[
\operatorname{Ack}(m)=\operatorname{deliverable}
\centernot\Rightarrow
\operatorname{ResidenceVerified}(m)
\]

\[
\operatorname{Ack}(m)=\operatorname{proof\_verified}
\centernot\Rightarrow
\operatorname{RawAddressKnown}(receiver)
\]

This prevents delivery, identity, proof, and address disclosure from collapsing
into one unsafe concept.

## 11. Failure Taxonomy

The executable model records the following failure families:

| failure | safe ACK |
| --- | --- |
| expired nonce or expiry | expired |
| revoked reference | revoked |
| ambiguous envelope | manual_review_required |
| raw/private material present | disclosure_denied |
| purpose or audience mismatch | policy_mismatch |
| unsupported payload | rejected |
| unsupported proof type | rejected |
| missing audit or revocation reference | rejected |

Failure is not merely an exception.  It is a communication result.

## 12. Relation To Chapter 11

Chapter 11 defines AMT Envelope, proof boundary, audit, governance, abuse
controls, and protocol states.  This document adds the missing communication
semantics:

```text
AMT Envelope
  -> Address Communication Object
  -> receiver capability negotiation
  -> ValidComm
  -> semantic ACK
  -> audit / revocation / retry / manual review
```

This is the layer that makes an address usable like a communication object
without turning it into raw-address broadcast.

## 13. Non-Claims

This model does not claim:

- that all receivers can verify all proof types;
- that semantic ACK proves residence, ownership, sovereignty, or legal status;
- that deliverability is identity verification;
- that encrypted carrier delivery is merchant disclosure;
- that auditability permits private address reconstruction;
- that a valid communication message repairs bad AMT resolution;
- that raw address is never needed in the world, only that it is not the default
  communication object.

