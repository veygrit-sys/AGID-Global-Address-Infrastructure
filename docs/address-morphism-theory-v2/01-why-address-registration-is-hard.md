# 1. Why Address Registration Is Hard

Compatibility note: this chapter preserves current chapters 1, 2, 6, and 25.
It introduces the repeated-registration problem, address/reference/identifier
separation, unresolved output, and the main limitation language. It does not
replace the detailed models for candidate generation, equivalence classes, PID
issuance, or verification; those are preserved in later v2 chapters.

## 1.1 The Ordinary Failure

People repeatedly type the same address.

They type it when they buy something online. They type it when they register for
a service. They type it when they book a hotel, send a gift, receive a document,
open an account, request a repair, visit a hospital, or fill in a government
form. The same person, the same home, the same office, and the same delivery
point are written again and again.

At first glance this looks like a user-interface problem. Forms are long.
Autocompletion is weak. Country-specific address formats are inconsistent.
International shipping pages ask for fields that do not exist in some countries.
Users abbreviate, mistranslate, omit, or reorder address elements.

But the repeated typing is only a symptom. The deeper problem is that most
information systems do not know what an address is.

They treat an address as a string to be stored, a coordinate to be geocoded, a
postal code to be checked, or a form template to be validated. Each treatment is
useful, but none of them defines the referent. A string can change without the
place changing. A coordinate can be precise while still pointing to the wrong
entrance, floor, room, parcel locker, or delivery handoff point. A postal code
can group many different entities. A form can accept text that looks valid while
failing to identify the intended target.

The ordinary failure is therefore this:

> Address systems often record address expressions, but they do not compute
> address references.

Address Morphism Theory (AMT) begins from that failure.

## 1.2 The Three Things That Are Often Confused

AMT separates three objects that are often collapsed into one:

1. map location;
2. address expression;
3. persistent identifier.

A map location answers a spatial question: where is something under a coordinate
system, map layer, or geometric model?

An address expression answers a communicative question: how does a person,
institution, carrier, or system refer to a target in a context?

A persistent identifier answers an identity question: which referent should
remain recognizable across spelling changes, language changes, administrative
changes, evidence updates, and system integrations?

These three objects are related, but they are not interchangeable.

A coordinate is not necessarily an address. It may point to the center of a
building rather than the delivery entrance. It may ignore vertical structure. It
may fail in a dense market, campus, port, informal settlement, disaster shelter,
or multi-tenant building.

An address expression is not necessarily an identifier. It may be ambiguous,
obsolete, misspelled, translated, incomplete, politically disputed, or shared by
multiple entities.

An identifier is not necessarily public raw address content. It may be a
commitment, a PID, an alias, a proof scope, or a carrier-specific token. It must
not automatically expose what a user meant to protect.

AMT is the theory of moving between these layers without pretending they are the
same thing.

```text
surface expression
  -> candidate generation
  -> evidence-backed referent class
  -> safe resolution or abstention
  -> persistent or purpose-scoped identifier
```

The arrow matters. The arrow is not a formatting function. It is a controlled
morphism from expression to referent under evidence, purpose, and risk.

## 1.3 Why Normalization Is Not Enough

Address normalization changes one expression into a more standard expression.

For example, it may rewrite abbreviations, reorder fields, convert scripts,
standardize country names, or correct common spelling variants. This is
necessary. Without normalization, candidate generation becomes noisy and
expensive.

However, normalization alone does not decide identity.

Two normalized strings can still refer to different entities. One normalized
string can still refer to many entities. A perfectly normalized expression can
still be outdated. A postal-format-valid address can still be unsuitable for a
specific purpose such as high-value delivery, legal notice, hotel handoff,
drone delivery, or emergency dispatch.

AMT therefore treats normalization as an early morphism, not as the final
answer.

Let \(S\) be the set of surface expressions and \(N_t\) the normalized address
space at time \(t\). A normalizer is a partial map:

\[
\nu_t : S \rightharpoonup N_t
\]

The output of \(\nu_t\) is still not a resolved entity. It is a cleaned input to
candidate generation.

This distinction is central. A system that confuses normalization with
resolution will produce confident-looking wrong answers.

## 1.3A The Four Roles Of An Address

The current AMT paper defines at least four roles for an address:

1. **reference:** it points to an addressable entity;
2. **compression:** it compresses local knowledge into a portable expression;
3. **communication:** it lets humans, machines, carriers, institutions, and
   communities coordinate;
4. **history:** it carries lineage across renaming, subdivision, merger,
   relocation, and deprecation.

These roles must remain separate.

A short label may be good compression but weak evidence. A coordinate may be
good geometry but weak communication. A postal code may be useful routing
metadata but insufficient for registration. A historical name may preserve
social continuity while failing a current legal-address check.

This is why AMT treats address registration as a reference problem under
context, purpose, evidence policy, and risk boundary.

## 1.4 Why Coordinates Are Not Enough

Coordinates are powerful. They allow measurement, routing, indexing, spatial
search, and visualization. AMT uses coordinates wherever they help.

But a coordinate is not a complete address reference.

There are at least five failures:

1. **Vertical ambiguity.** A latitude and longitude may not identify a floor,
   suite, room, entrance, locker, or underground unit.
2. **Functional ambiguity.** The best map point may differ from the delivery
   point, legal parcel, customer entrance, loading bay, or emergency access
   point.
3. **Social ambiguity.** A locally meaningful place name may not have a stable
   coordinate record in official data.
4. **Temporal ambiguity.** Construction, renaming, relocation, disasters, and
   administrative changes alter the relation between expression and referent.
5. **Privacy risk.** More precise coordinates can expose more than the service
   needs to know.

Coordinates are evidence. They are not the full theory.

AMT uses geometry inside a larger referent model:

\[
\text{referent} =
\text{geometry}
+ \text{administrative structure}
+ \text{access relation}
+ \text{source evidence}
+ \text{history}
+ \text{purpose}
\]

This model lets a system say "this is enough for map display" while also saying
"this is not enough for private delivery" or "this is enough for country-level
proof but not enough for room-level disclosure."

## 1.5 Why Postal Codes Are Not Enough

Postal codes are one of the most successful address abstractions. They compress
regions, help sorting, support delivery operations, and reduce input burden.

But postal codes are not universal, not equally precise, and not designed to
serve every address identity problem.

Some countries or territories do not use postal codes in the ordinary sense.
Some use codes that are too coarse for precise delivery. Some codes are carrier
specific, route specific, administrative, legacy, or weakly maintained. Some
regions require landmarks, POI references, islands, ferry routes, informal
settlements, or local handoff customs.

AMT therefore treats postal codes as one possible compression layer.

Postal code information may support candidate generation and quality scoring,
but AMT must still work when postal codes are absent, weak, disputed, or
insufficient.

This is why AMT can connect to postal-code generation theory without becoming
only a postal-code theory.

## 1.6 Address As A Computable Reference

The core claim of AMT is simple:

> An address should be modeled as a computable, evidence-backed,
> purpose-relative reference to an entity.

This definition has five parts.

**Computable** means the theory must produce finite candidate sets, explicit
state transitions, deterministic refusal states, and testable outputs.

**Evidence-backed** means a resolution cannot be justified merely because a
string looks familiar. It must point to sources, observations, records,
community evidence, carrier evidence, or other admissible evidence.

**Purpose-relative** means that the same input can be enough for one purpose and
not enough for another. A city-level marketing region, a tax record, a hotel
check-in, a high-value delivery, and a privacy-preserving proof do not require
the same disclosure or certainty.

**Reference** means the output should point to the intended object, not merely
to a formatted expression.

**Entity** means AMT must handle more than ordinary buildings. It must handle
homes, offices, rooms, lockers, ports, islands, roads, cultural sites, natural
features, temporary shelters, and eventually digital or cross-domain referents
when the theory can define their reachability.

## 1.7 The Minimal AMT Pipeline

AMT can be introduced through the following pipeline:

\[
s \in S
\quad \xrightarrow{\Gamma_t}
\quad C_t(s,u)
\quad \xrightarrow{D_t,\delta}
\quad C_t(s,u)/{\sim_{\delta,t}}
\quad \xrightarrow{E_t,L_u}
\quad r \text{ or } \bot
\quad \xrightarrow{\pi}
\quad p
\]

where:

- \(s\) is a surface address expression;
- \(u\) is a purpose;
- \(\Gamma_t\) generates a finite candidate set at time \(t\);
- \(D_t\) is a structural distance;
- \(\delta\) is a clustering threshold;
- \(\sim_{\delta,t}\) forms referent-equivalence classes;
- \(E_t\) is an energy or score function;
- \(L_u\) is a purpose-relative loss function;
- \(r\) is a resolved referent;
- \(\bot\) is an abstention or unresolved state;
- \(\pi\) issues a persistent or purpose-scoped identifier \(p\) only when safe.

The refusal state \(\bot\) is not a failure of the theory. It is a safety
feature. A good address system must be able to say:

- not enough evidence;
- too many plausible candidates;
- source conflict;
- missing or incompatible source license;
- outdated referent;
- purpose requires stronger proof;
- private detail cannot be exposed;
- manual review required.

Without refusal, address systems silently turn uncertainty into false
precision.

## 1.8 What AMT Is Not

AMT is not a claim that every address in the world can already be resolved.

AMT is not a replacement for official address authorities, postal operators,
maps, GIS, carriers, municipalities, or local knowledge.

AMT is not a promise that machine learning can infer the correct referent from
weak evidence.

AMT is not a cryptographic proof system by itself. Zero-knowledge proofs can
prove predicates over AMT-compatible envelopes, but they do not repair bad
candidate generation or incorrect source evidence.

AMT is not a surveillance architecture. Public identifiers and proof layers
must be designed to reduce disclosure, not to expose private location details.

AMT is not a claim of final political neutrality. It can record disputed,
policy-dependent, or source-relative states, but it must not pretend to settle
sovereignty or jurisdictional disputes.

AMT is not a claim of audited cryptographic security. Cryptographic envelopes,
ZK predicates, signatures, commitments, and key-management protocols require
their own circuit, implementation, and external security review.

AMT is not a guarantee of universal delivery success. A referent can be well
modeled while a carrier still refuses delivery, lacks access, faces a temporary
closure, or requires additional local instructions.

Real deployments still require local source validation, governance review,
security review, and empirical benchmarks.

These non-claims are not defensive footnotes. They are part of the theory.
Address resolution becomes trustworthy only when its limits are explicit.

## 1.9 Front-Half Reinforcement: The Registration Bottleneck Is A Reference Bottleneck

The central weakness of an introductory chapter is that the problem can look
like a product complaint: forms are annoying, users retype addresses, checkout
flows are slow. AMT must make a stronger claim. Repeated address entry is not
only a UX problem. It is evidence that services exchange address expressions
without sharing a computable referent model.

Let a service \(i\) store an address record as

\[
a_i=(s_i, f_i, q_i, h_i)
\]

where \(s_i\) is a surface expression, \(f_i\) is the service-specific form
schema, \(q_i\) is a local quality state, and \(h_i\) is local history. Two
services may store records for the same real-world referent while sharing no
safe morphism:

\[
a_i \not\cong a_j
\quad\text{even if}\quad
\operatorname{ref}(a_i)=\operatorname{ref}(a_j)
\]

This is the address registration bottleneck. The bottleneck is not that users
cannot type. The bottleneck is that systems cannot safely reuse the meaning of
what was typed.

AMT therefore distinguishes three layers:

| layer | object | failure if confused |
| --- | --- | --- |
| expression layer | strings, forms, language variants | normalization is mistaken for identity |
| reference layer | candidates, referents, evidence, purpose | ambiguous addresses are forced into false precision |
| use layer | delivery, proof, audit, payment-like transaction | services over-collect raw address data |

The first research claim is:

\[
\operatorname{AddressRegistrationProblem}
\neq
\operatorname{FormInputProblem}
\]

and more precisely:

\[
\operatorname{AddressRegistrationProblem}
=
\operatorname{ReferenceReuseProblem}
+\operatorname{PurposeSafetyProblem}
+\operatorname{DisclosureBoundaryProblem}
\]

This chapter therefore introduces a testable reader contract:

1. A theory of addresses must explain when reuse is safe.
2. It must explain when reuse must be refused.
3. It must explain what information is sufficient for a purpose.
4. It must avoid converting every address use into raw address disclosure.
5. It must preserve the difference between expression, referent, identifier,
   and proof.

The practical consequence is severe. A better form component can reduce typing
time, but cannot by itself answer whether a previous address record can safely
be reused for a new purpose, by a new actor, in a new jurisdiction, under a new
privacy policy. That answer requires AMT's later candidate, distance,
resolution, history, and protocol layers.

This reinforcement prevents the introductory thesis from being too small.
AMT is not proposed as a checkout optimization. It is proposed as a theory for
turning address references into safe, computable, purpose-scoped communication
objects.

## 1.10 Why This Matters

If address references become computable, several things change.

Users do not need to retype raw addresses into every service. They can authorize
purpose-specific claims: deliverable, inside a region, verified enough,
fresh enough, not revoked, or carrier-decryptable.

Developers do not need to hard-code every country's address logic into a form.
They can use country models, candidate generation, validation fixtures, and
purpose-specific policies.

Carriers can receive what they need for delivery without giving merchants a
permanent copy of the full address.

Researchers can compare address systems using explicit assumptions, not just
anecdotes about which format "works."

Open-source communities can improve one country's evidence and rules without
breaking the global theory.

The long-term goal is not merely better address formatting. The goal is to make
addresses usable as safe, computable communication objects.

## 1.11 Chapter Summary

This chapter established the starting point:

- repeated address entry is a symptom of missing address identity theory;
- maps, address expressions, and identifiers must be separated;
- normalization, coordinates, and postal codes are necessary but insufficient;
- AMT defines addresses as computable, evidence-backed, purpose-relative
  references to entities;
- safe abstention is part of correctness;
- privacy and non-claims are part of the architecture.

The next chapter reviews prior systems and shows why AMT should be positioned
as a missing referent layer rather than as another formatter, geocoder, postal
code system, or identity protocol.

## 1.12 Preservation Checklist

This chapter carries forward the following current-paper claims:

- repeated address entry is not merely an input-form problem;
- address systems usually store expressions rather than compute references;
- maps, address expressions, and identifiers must be separated;
- addresses have reference, compression, communication, and history roles;
- context, purpose, evidence policy, and risk boundary are part of registration;
- normalization, coordinates, and postal codes are useful but insufficient;
- unresolved output is a safety feature;
- AMT must preserve non-claims and source-limit language.

This chapter introduces, but does not fully prove, the following models:

- surface expression set \(S\);
- purpose \(u\);
- candidate generation \(\Gamma_t\);
- structural distance \(D_t\);
- threshold \(\delta\);
- equivalence class formation \(\sim_{\delta,t}\);
- energy or score function \(E_t\);
- purpose-relative loss \(L_u\);
- resolved referent \(r\);
- bottom or abstention state \(\bot\);
- PID issuance map \(\pi\).

The full formal treatment is reserved for chapters 4 through 9 and the theorem
registry appendix, so the introductory chapter does not accidentally collapse
the whole theory into a simplified pipeline.
