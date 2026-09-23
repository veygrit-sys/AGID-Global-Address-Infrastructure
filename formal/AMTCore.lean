/-!
Core formal checks for Address Morphism Theory (AMT).

This file intentionally uses only Lean core features.  It verifies the parts
of AMT that can be stated without empirical GIS or implementation assumptions.
-/

universe u v

namespace AMT

/-- A resolver is correct for an entity when resolving that entity's observation
returns the entity itself. -/
def CorrectFor {Observation Entity : Type u}
    (observe : Entity -> Observation)
    (resolve : Observation -> Entity)
    (entity : Entity) : Prop :=
  resolve (observe entity) = entity

/--
No condition-free perfect address resolver can exist when two distinct entities
produce the same observable address/input.

This is the formal version of the AMT limitation: if ambiguity exists in the
world, a total resolver that always emits exactly one entity cannot be correct
for both entities.  Therefore `unresolved` or `ambiguous` outcomes are not just
engineering conveniences; they are logically necessary.
-/
theorem no_condition_free_perfect_resolver
    {Observation Entity : Type u}
    (observe : Entity -> Observation)
    (resolve : Observation -> Entity)
    {a b : Entity}
    (same_observation : observe a = observe b)
    (distinct_entities : a = b -> False) :
    (CorrectFor observe resolve a /\ CorrectFor observe resolve b) -> False := by
  intro both_correct
  have resolve_a : resolve (observe a) = a := both_correct.left
  have resolve_b : resolve (observe b) = b := both_correct.right
  have resolve_a_as_b : resolve (observe a) = b := by
    rw [same_observation]
    exact resolve_b
  have a_eq_b : a = b := Eq.trans (Eq.symm resolve_a) resolve_a_as_b
  exact distinct_entities a_eq_b

/-- Candidate generation is complete for an observation model when every real
entity appears among the candidates generated from its own observation. -/
def CandidateComplete {Observation Entity : Type u}
    (observe : Entity -> Observation)
    (candidates : Observation -> List Entity) : Prop :=
  forall entity, entity ∈ candidates (observe entity)

/-- A resolver is candidate-sound when every resolved output was present in the
candidate list for the same observation. -/
def CandidateSound {Observation Entity : Type u}
    (candidates : Observation -> List Entity)
    (resolve : Observation -> Entity) : Prop :=
  forall observation, resolve observation ∈ candidates observation

/-- Candidate soundness gives membership in the generated candidate set. -/
theorem candidate_soundness_yields_membership
    {Observation Entity : Type u}
    {candidates : Observation -> List Entity}
    {resolve : Observation -> Entity}
    (sound : CandidateSound candidates resolve)
    (observation : Observation) :
    resolve observation ∈ candidates observation := by
  exact sound observation

/-- A resolver may return an entity, or safely abstain as ambiguous, unresolved, or rejected. -/
inductive ResolutionOutcome (Entity : Type u) where
  | resolved : Entity -> ResolutionOutcome Entity
  | ambiguous : ResolutionOutcome Entity
  | unresolved : ResolutionOutcome Entity
  | rejected : ResolutionOutcome Entity

/-- Predicate that an outcome resolves to a given entity. -/
def ResolvesEntity {Entity : Type u} (entity : Entity) : ResolutionOutcome Entity -> Prop
  | ResolutionOutcome.resolved output => output = entity
  | ResolutionOutcome.ambiguous => False
  | ResolutionOutcome.unresolved => False
  | ResolutionOutcome.rejected => False

/-- Predicate that an outcome abstains from emitting an entity. -/
def Abstains {Entity : Type u} : ResolutionOutcome Entity -> Prop
  | ResolutionOutcome.resolved _ => False
  | ResolutionOutcome.ambiguous => True
  | ResolutionOutcome.unresolved => True
  | ResolutionOutcome.rejected => True

/-- Predicate that an outcome emits an entity different from the truth. -/
def EmitsFalseEntity {Entity : Type u} (truth : Entity) : ResolutionOutcome Entity -> Prop
  | ResolutionOutcome.resolved output => output = truth -> False
  | ResolutionOutcome.ambiguous => False
  | ResolutionOutcome.unresolved => False
  | ResolutionOutcome.rejected => False

theorem ambiguous_resolves_no_entity {Entity : Type u} (entity : Entity) :
    ¬ ResolvesEntity entity (ResolutionOutcome.ambiguous : ResolutionOutcome Entity) := by
  intro resolved
  exact resolved

theorem unresolved_resolves_no_entity {Entity : Type u} (entity : Entity) :
    ¬ ResolvesEntity entity (ResolutionOutcome.unresolved : ResolutionOutcome Entity) := by
  intro resolved
  exact resolved

theorem rejected_resolves_no_entity {Entity : Type u} (entity : Entity) :
    ¬ ResolvesEntity entity (ResolutionOutcome.rejected : ResolutionOutcome Entity) := by
  intro resolved
  exact resolved

theorem ambiguous_emits_no_false_entity {Entity : Type u} (truth : Entity) :
    ¬ EmitsFalseEntity truth (ResolutionOutcome.ambiguous : ResolutionOutcome Entity) := by
  intro emitted
  exact emitted

theorem unresolved_emits_no_false_entity {Entity : Type u} (truth : Entity) :
    ¬ EmitsFalseEntity truth (ResolutionOutcome.unresolved : ResolutionOutcome Entity) := by
  intro emitted
  exact emitted

theorem rejected_emits_no_false_entity {Entity : Type u} (truth : Entity) :
    ¬ EmitsFalseEntity truth (ResolutionOutcome.rejected : ResolutionOutcome Entity) := by
  intro emitted
  exact emitted

/-- Outcome soundness: any emitted entity must come from the candidate set. -/
def OutcomeCandidateSound {Observation Entity : Type u}
    (candidates : Observation -> List Entity)
    (resolve : Observation -> ResolutionOutcome Entity) : Prop :=
  forall observation entity,
    resolve observation = ResolutionOutcome.resolved entity ->
      entity ∈ candidates observation

theorem outcome_candidate_soundness_yields_membership
    {Observation Entity : Type u}
    {candidates : Observation -> List Entity}
    {resolve : Observation -> ResolutionOutcome Entity}
    (sound : OutcomeCandidateSound candidates resolve)
    (observation : Observation)
    (entity : Entity)
    (resolved : resolve observation = ResolutionOutcome.resolved entity) :
    entity ∈ candidates observation := by
  exact sound observation entity resolved

/-- A minimal deterministic selector for a finite candidate list. -/
def chooseFirstCandidate {Entity : Type u} (candidates : List Entity) : Option Entity :=
  match candidates with
  | [] => none
  | first :: _ => some first

theorem chooseFirstCandidate_some_is_member
    {Entity : Type u}
    {candidates : List Entity}
    {entity : Entity}
    (chosen : chooseFirstCandidate candidates = some entity) :
    entity ∈ candidates := by
  cases candidates with
  | nil =>
      simp [chooseFirstCandidate] at chosen
  | cons first rest =>
      simp [chooseFirstCandidate] at chosen
      simpa using (Or.inl chosen.symm : entity = first ∨ entity ∈ rest)

theorem chooseFirstCandidate_nonempty_exists
    {Entity : Type u}
    {first : Entity}
    {rest : List Entity} :
    chooseFirstCandidate (first :: rest) = some first := by
  simp [chooseFirstCandidate]

/-- Lower energy is better. Selection is admissible only below a threshold and
with a sufficient gap to the second-best candidate. -/
def ScoreSelectable
    (bestEnergy secondEnergy threshold margin : Nat) : Prop :=
  bestEnergy <= threshold /\ bestEnergy + margin <= secondEnergy

theorem score_selection_requires_threshold
    {bestEnergy secondEnergy threshold margin : Nat}
    (tooHigh : threshold < bestEnergy) :
    ¬ ScoreSelectable bestEnergy secondEnergy threshold margin := by
  intro selectable
  exact Nat.not_lt_of_ge selectable.left tooHigh

theorem tied_evidence_prevents_score_selection
    {bestEnergy secondEnergy threshold margin : Nat}
    (tooClose : secondEnergy < bestEnergy + margin) :
    ¬ ScoreSelectable bestEnergy secondEnergy threshold margin := by
  intro selectable
  exact Nat.not_lt_of_ge selectable.right tooClose

theorem score_selection_conditions_are_recoverable
    {bestEnergy secondEnergy threshold margin : Nat}
    (selectable : ScoreSelectable bestEnergy secondEnergy threshold margin) :
    bestEnergy <= threshold /\ bestEnergy + margin <= secondEnergy := by
  exact selectable

/-- PID uniqueness is a theorem only for an injective PID assignment.  A bounded
hash-based DPID implementation needs collision analysis instead of this theorem. -/
theorem injective_pid_has_no_collision
    {Entity : Type u}
    {PID : Type v}
    (pidOf : Entity -> PID)
    (pid_injective : Function.Injective pidOf)
    {a b : Entity}
    (same_pid : pidOf a = pidOf b) :
    a = b := by
  exact pid_injective same_pid

/-- If two different entities are known, an injective PID assignment cannot give
them the same PID. -/
theorem distinct_entities_have_distinct_injective_pids
    {Entity : Type u}
    {PID : Type v}
    (pidOf : Entity -> PID)
    (pid_injective : Function.Injective pidOf)
    {a b : Entity}
    (distinct_entities : a = b -> False) :
    pidOf a = pidOf b -> False := by
  intro same_pid
  exact distinct_entities (injective_pid_has_no_collision pidOf pid_injective same_pid)

/--
Certified gated resolution bundles the operational checks needed before AMT is
allowed to emit a PID-bearing entity:

* the selected entity is one of the generated candidates;
* the score gate passes threshold and margin checks;
* hidden or internal quality is high enough;
* freshness is inside its allowed window;
* bounded risk stays inside the configured budget.

The model is intentionally conditional.  It does not prove that the chosen
entity is globally true; it proves that emission is impossible unless the
declared safety gates are all satisfied.
-/
def IssueAdmissible {Entity : Type u}
    (candidates : List Entity)
    (entity : Entity)
    (bestEnergy secondEnergy energyThreshold margin : Nat)
    (qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat) :
    Prop :=
  entity ∈ candidates /\
  ScoreSelectable bestEnergy secondEnergy energyThreshold margin /\
  qualityThreshold <= qualityScore /\
  freshnessAge <= freshnessLimit /\
  riskScore <= riskLimit

/-- Emit only when the certified gate is admissible; otherwise abstain. -/
def issueIfAdmissible {Entity : Type u}
    (candidates : List Entity)
    (entity : Entity)
    (bestEnergy secondEnergy energyThreshold margin : Nat)
    (qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat)
    [Decidable (IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit)] :
    ResolutionOutcome Entity :=
  if IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit then
    ResolutionOutcome.resolved entity
  else
    ResolutionOutcome.unresolved

/-- If the certified gate emits, the full admissibility certificate is present. -/
theorem issue_if_admissible_requires_conditions
    {Entity : Type u}
    {candidates : List Entity}
    {entity output : Entity}
    {bestEnergy secondEnergy energyThreshold margin : Nat}
    {qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat}
    [Decidable (IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit)]
    (emitted : issueIfAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit =
        ResolutionOutcome.resolved output) :
    IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit /\
    output = entity := by
  unfold issueIfAdmissible at emitted
  by_cases h : IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit
  · simp [h] at emitted
    exact And.intro h emitted.symm
  · simp [h] at emitted

/-- Certified gated emission is candidate-contained. -/
theorem issue_if_admissible_emits_candidate
    {Entity : Type u}
    {candidates : List Entity}
    {entity output : Entity}
    {bestEnergy secondEnergy energyThreshold margin : Nat}
    {qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat}
    [Decidable (IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit)]
    (emitted : issueIfAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit =
        ResolutionOutcome.resolved output) :
    output ∈ candidates := by
  have recovered := issue_if_admissible_requires_conditions emitted
  rw [recovered.right]
  exact recovered.left.left

/-- If the gate is not admissible, the resolver abstains. -/
theorem issue_if_not_admissible_abstains
    {Entity : Type u}
    {candidates : List Entity}
    {entity : Entity}
    {bestEnergy secondEnergy energyThreshold margin : Nat}
    {qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat}
    [Decidable (IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit)]
    (not_admissible : ¬ IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit) :
    issueIfAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit =
        ResolutionOutcome.unresolved := by
  unfold issueIfAdmissible
  simp [not_admissible]

/-- A missing candidate prevents certified emission. -/
theorem missing_candidate_prevents_issue
    {Entity : Type u}
    {candidates : List Entity}
    {entity : Entity}
    {bestEnergy secondEnergy energyThreshold margin : Nat}
    {qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat}
    (missing : entity ∈ candidates -> False) :
    ¬ IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit := by
  intro admissible
  exact missing admissible.left

/-- Over-threshold energy prevents certified emission. -/
theorem high_energy_prevents_issue
    {Entity : Type u}
    {candidates : List Entity}
    {entity : Entity}
    {bestEnergy secondEnergy energyThreshold margin : Nat}
    {qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat}
    (tooHigh : energyThreshold < bestEnergy) :
    ¬ IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit := by
  intro admissible
  exact (score_selection_requires_threshold tooHigh) admissible.right.left

/-- Insufficient separation from the second candidate prevents certified emission. -/
theorem low_margin_prevents_issue
    {Entity : Type u}
    {candidates : List Entity}
    {entity : Entity}
    {bestEnergy secondEnergy energyThreshold margin : Nat}
    {qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat}
    (tooClose : secondEnergy < bestEnergy + margin) :
    ¬ IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit := by
  intro admissible
  exact (tied_evidence_prevents_score_selection tooClose) admissible.right.left

/-- A hidden/internal quality score below the public threshold prevents emission. -/
theorem low_quality_prevents_issue
    {Entity : Type u}
    {candidates : List Entity}
    {entity : Entity}
    {bestEnergy secondEnergy energyThreshold margin : Nat}
    {qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat}
    (tooLow : qualityScore < qualityThreshold) :
    ¬ IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit := by
  intro admissible
  exact Nat.not_lt_of_ge admissible.right.right.left tooLow

/-- A stale credential or evidence window prevents certified emission. -/
theorem stale_freshness_prevents_issue
    {Entity : Type u}
    {candidates : List Entity}
    {entity : Entity}
    {bestEnergy secondEnergy energyThreshold margin : Nat}
    {qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat}
    (stale : freshnessLimit < freshnessAge) :
    ¬ IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit := by
  intro admissible
  exact Nat.not_lt_of_ge admissible.right.right.right.left stale

/-- Risk above the configured budget prevents certified emission. -/
theorem high_risk_prevents_issue
    {Entity : Type u}
    {candidates : List Entity}
    {entity : Entity}
    {bestEnergy secondEnergy energyThreshold margin : Nat}
    {qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit : Nat}
    (tooRisky : riskLimit < riskScore) :
    ¬ IssueAdmissible candidates entity
      bestEnergy secondEnergy energyThreshold margin
      qualityScore qualityThreshold freshnessAge freshnessLimit riskScore riskLimit := by
  intro admissible
  exact Nat.not_lt_of_ge admissible.right.right.right.right tooRisky

/--
If a real entity is missing from the candidate set generated from its own
observation, candidate completeness is false.

This is the formal version of the natural-geography and sparse-source warning:
no resolver can claim complete coverage for rivers, islands, deserts, ruins, or
other named features unless the candidate generator actually includes those
entities.
-/
theorem missing_entity_refutes_candidate_completeness
    {Observation Entity : Type u}
    {observe : Entity -> Observation}
    {candidates : Observation -> List Entity}
    {entity : Entity}
    (missing : entity ∈ candidates (observe entity) -> False) :
    ¬ CandidateComplete observe candidates := by
  intro complete
  exact missing (complete entity)

/-- Symmetry predicate for a structural dissimilarity function. -/
def SymmetricDissimilarity {Entity : Type u}
    (distance : Entity -> Entity -> Nat) : Prop :=
  forall left right, distance left right = distance right left

/--
A directed or source-dependent dissimilarity cannot be treated as a symmetric
metric when at least one ordered pair has different costs in each direction.
-/
theorem asymmetric_dissimilarity_not_symmetric
    {Entity : Type u}
    (distance : Entity -> Entity -> Nat)
    {left right : Entity}
    (asymmetric : distance left right = distance right left -> False) :
    ¬ SymmetricDissimilarity distance := by
  intro symmetric
  exact asymmetric (symmetric left right)

/--
If normalization collapses two distinct entities to the same normalized
observation, no resolver over normalized observations can be correct for both.

This is the formal caution behind multilingual and script-insensitive search:
language conversion can improve recall, but it cannot be an unconditional
identity theorem when information is lost.
-/
theorem normalization_collision_prevents_perfect_resolution
    {Expression Normal Entity : Type u}
    (observe : Entity -> Expression)
    (normalize : Expression -> Normal)
    (resolve : Normal -> Entity)
    {left right : Entity}
    (same_normalized_observation :
      normalize (observe left) = normalize (observe right))
    (distinct_entities : left = right -> False) :
    (resolve (normalize (observe left)) = left /\
      resolve (normalize (observe right)) = right) -> False := by
  intro both_correct
  have resolve_left : resolve (normalize (observe left)) = left := both_correct.left
  have resolve_right : resolve (normalize (observe right)) = right := both_correct.right
  have resolve_left_as_right : resolve (normalize (observe left)) = right := by
    rw [same_normalized_observation]
    exact resolve_right
  have left_eq_right : left = right :=
    Eq.trans (Eq.symm resolve_left) resolve_left_as_right
  exact distinct_entities left_eq_right

/--
Two vertical referents with the same ground projection cannot both be recovered
by a resolver that sees only the ground projection.

This formally supports the vertical reference layer: floors, units, entrances,
lockers, and rooms cannot be safely discarded when they distinguish entities.
-/
theorem projection_collision_prevents_vertical_resolution
    {Ground VerticalEntity : Type u}
    (project : VerticalEntity -> Ground)
    (resolveGround : Ground -> VerticalEntity)
    {left right : VerticalEntity}
    (same_ground : project left = project right)
    (distinct_entities : left = right -> False) :
    (CorrectFor project resolveGround left /\
      CorrectFor project resolveGround right) -> False := by
  exact no_condition_free_perfect_resolver
    project resolveGround same_ground distinct_entities

/-- A functional time transition cannot represent one-to-many split history. -/
def RepresentsSplit {Past Future : Type u}
    (transition : Past -> Future)
    (source : Past)
    (first second : Future) : Prop :=
  transition source = first /\
  transition source = second /\
  (first = second -> False)

/--
If a historical event splits one entity into two distinct future entities, the
transition cannot be represented as a plain function from old entities to new
entities. AMT therefore needs a relation, multivalued map, or outcome-valued
transition for split and merge cases.
-/
theorem functional_transition_cannot_represent_split
    {Past Future : Type u}
    (transition : Past -> Future)
    (source : Past)
    (first second : Future) :
    ¬ RepresentsSplit transition source first second := by
  intro split
  have first_eq_second : first = second :=
    Eq.trans (Eq.symm split.left) split.right.left
  exact split.right.right first_eq_second

/--
If two distinct entities have the same observation, any PID minted as a pure
function of that observation collides for those entities.

This is the formal warning against direct string-to-PID issuance. PID issuance
must occur after candidate, evidence, and admissibility gates, or use an
injective entity-level assignment with collision-risk analysis for bounded
hashes.
-/
theorem observation_based_pid_collides_on_same_observation
    {Observation Entity PID : Type u}
    (observe : Entity -> Observation)
    (pidFromObservation : Observation -> PID)
    {left right : Entity}
    (same_observation : observe left = observe right) :
    pidFromObservation (observe left) =
      pidFromObservation (observe right) := by
  rw [same_observation]

/--
If a public proof reveals only a predicate value, then two private values with
the same predicate value cannot be distinguished from the public proof alone.

This is the minimal privacy model behind ZK address predicates. It is useful
only when the public claim is intentionally coarser than the private address.
-/
theorem predicate_proof_collision_hides_private_value
    {Private PublicClaim : Type u}
    (publicClaimOf : Private -> PublicClaim)
    {left right : Private}
    (same_public_claim : publicClaimOf left = publicClaimOf right)
    (distinct_private_values : left = right -> False) :
    (forall x y, publicClaimOf x = publicClaimOf y -> x = y) -> False := by
  intro public_injective
  exact distinct_private_values (public_injective left right same_public_claim)

/--
If the public predicate or public claim is injective over the private domain,
then the public value is fine-grained enough to identify the private value.

This is the formal warning for ZK Address Proof design: zero-knowledge machinery
does not automatically create privacy if the revealed predicate is too narrow
or uniquely identifying.
-/
theorem injective_public_claim_identifies_private_value
    {Private PublicClaim : Type u}
    (publicClaimOf : Private -> PublicClaim)
    {left right : Private}
    (public_injective : forall x y, publicClaimOf x = publicClaimOf y -> x = y)
    (same_public_claim : publicClaimOf left = publicClaimOf right) :
    left = right := by
  exact public_injective left right same_public_claim

/-- A private address credential covers the attributes required by a purpose. -/
def CoversRequiredAttributes {Attribute : Type u}
    (hasAttribute requiredAttribute : Attribute -> Prop) : Prop :=
  forall attr, requiredAttribute attr -> hasAttribute attr

/--
If a required attribute is missing, a purpose-scoped address proof cannot pass
the attribute-coverage gate.

This is the formal shape behind `Req(p) subset Attr(q)`: a proof may disclose
only the required attributes, but those required attributes still have to be
present in the hidden address credential.
-/
theorem missing_required_attribute_prevents_attribute_gate
    {Attribute : Type u}
    {hasAttribute requiredAttribute : Attribute -> Prop}
    {attr : Attribute}
    (required : requiredAttribute attr)
    (missing : hasAttribute attr -> False) :
    ¬ CoversRequiredAttributes hasAttribute requiredAttribute := by
  intro covers
  exact missing (covers attr required)

/--
Reference-defined equivalence for address expressions.

This is the formal core of address equivalence-class stability: two address
expressions are equivalent exactly when the reference map sends them to the same
entity.  The implementation must still prove that its cluster evidence is
allowed to approximate this relation.
-/
def RefEquivalent {Address Entity : Type u}
    (ref : Address -> Entity)
    (left right : Address) : Prop :=
  ref left = ref right

theorem ref_equivalent_is_reflexive
    {Address Entity : Type u}
    (ref : Address -> Entity)
    (address : Address) :
    RefEquivalent ref address address := by
  rfl

theorem ref_equivalent_is_symmetric
    {Address Entity : Type u}
    {ref : Address -> Entity}
    {left right : Address}
    (same_reference : RefEquivalent ref left right) :
    RefEquivalent ref right left := by
  unfold RefEquivalent at *
  exact Eq.symm same_reference

theorem ref_equivalent_is_transitive
    {Address Entity : Type u}
    {ref : Address -> Entity}
    {first second third : Address}
    (first_second : RefEquivalent ref first second)
    (second_third : RefEquivalent ref second third) :
    RefEquivalent ref first third := by
  unfold RefEquivalent at *
  exact Eq.trans first_second second_third

/-- Two observations known to reference the same entity are equivalent. -/
theorem same_entity_observations_are_ref_equivalent
    {Address Entity : Type u}
    {ref : Address -> Entity}
    {left right : Address}
    {entity : Entity}
    (left_refs_entity : ref left = entity)
    (right_refs_entity : ref right = entity) :
    RefEquivalent ref left right := by
  unfold RefEquivalent
  exact Eq.trans left_refs_entity (Eq.symm right_refs_entity)

/--
Extensional equality of reference classes.  It avoids committing to a concrete
set or quotient implementation while preserving the theorem the paper needs:
the class of `left` and the class of `right` have exactly the same members.
-/
def SameReferenceClass {Address Entity : Type u}
    (ref : Address -> Entity)
    (left right : Address) : Prop :=
  forall candidate,
    RefEquivalent ref candidate left <-> RefEquivalent ref candidate right

theorem same_reference_yields_same_reference_class
    {Address Entity : Type u}
    {ref : Address -> Entity}
    {left right : Address}
    (same_reference : RefEquivalent ref left right) :
    SameReferenceClass ref left right := by
  intro candidate
  constructor
  · intro candidate_left
    unfold RefEquivalent at *
    exact Eq.trans candidate_left same_reference
  · intro candidate_right
    unfold RefEquivalent at *
    exact Eq.trans candidate_right (Eq.symm same_reference)

/--
If a PID is defined over the reference class rather than over the raw address
string, equivalent address expressions receive the same PID.
-/
theorem class_pid_invariant_under_ref_equivalence
    {Address Entity : Type u}
    {PID : Type v}
    (ref : Address -> Entity)
    (pidOfReferenceClass : Entity -> PID)
    {left right : Address}
    (same_reference : RefEquivalent ref left right) :
    pidOfReferenceClass (ref left) =
      pidOfReferenceClass (ref right) := by
  unfold RefEquivalent at same_reference
  rw [same_reference]

/--
A conflict gate can safely prevent equivalence formation.  This captures the
paper's operational rule that country, administrative hierarchy, coordinates,
building ID, unit number, or delivery-history conflicts must block merging.
-/
theorem conflict_gate_prevents_ref_equivalence
    {Address Entity : Type u}
    (ref : Address -> Entity)
    (conflict : Address -> Address -> Prop)
    {left right : Address}
    (conflict_precludes_same_reference :
      conflict left right -> RefEquivalent ref left right -> False)
    (has_conflict : conflict left right) :
    ¬ RefEquivalent ref left right := by
  intro same_reference
  exact conflict_precludes_same_reference has_conflict same_reference

/--
An intentionally simple bit-capacity model for address entropy arguments.

`2^bits` is not a Shannon entropy calculation.  It is the finite code-space
capacity that any fixed-length AGID, PID prefix, postal bucket, or virtual
postcode must respect before it can uniquely name `entityCount` possibilities.
-/
def BitCapacity (bits : Nat) : Nat :=
  2 ^ bits

def CapacityCovers (entityCount bits : Nat) : Prop :=
  entityCount <= BitCapacity bits

/--
If the code space has fewer values than the number of entities to distinguish,
then a fixed-length code of that size cannot be declared capacity-sufficient.

This is the finite lower-bound form behind the address entropy statement:
`bits(id) >= log2(entityCount)` is a capacity requirement, while actual address
resolution still needs evidence, candidate coverage, and collision handling.
-/
theorem insufficient_bit_capacity_prevents_capacity_cover
    {entityCount bits : Nat}
    (tooSmall : BitCapacity bits < entityCount) :
    ¬ CapacityCovers entityCount bits := by
  intro covers
  exact Nat.not_lt_of_ge covers tooSmall

/--
Candidate-count residual uncertainty proxy.

This does not replace Shannon entropy, but it captures the operational rule:
more than one still-admissible candidate means residual uncertainty remains.
-/
def CandidateResidualZero (candidateCount : Nat) : Prop :=
  candidateCount <= 1

theorem multiple_candidates_prevent_zero_residual
    {candidateCount : Nat}
    (multiple : 1 < candidateCount) :
    ¬ CandidateResidualZero candidateCount := by
  intro zero
  exact Nat.not_lt_of_ge zero multiple

/--
When the residual candidate proxy is not zero, AMT should abstain unless another
certified gate supplies enough separating evidence.  This theorem formalizes
the proxy-only case and aligns it with `ambiguous`.
-/
theorem proxy_residual_forces_ambiguous_abstention
    {candidateCount : Nat}
    (multiple : 1 < candidateCount) :
    ¬ CandidateResidualZero candidateCount /\
      Abstains (ResolutionOutcome.ambiguous : ResolutionOutcome (Fin candidateCount)) := by
  constructor
  · exact multiple_candidates_prevent_zero_residual multiple
  · exact True.intro

/--
An address renderer is absolute for two contexts when a single address value is
declared to match the optimal rendering in both contexts.

The model is intentionally tiny: it does not define real-world costs.  It only
captures the theorem shape needed for the Address Relativity Principle.
-/
def AbsoluteForTwoContexts {Address : Type u}
    (absolute firstOptimal secondOptimal : Address) : Prop :=
  absolute = firstOptimal /\ absolute = secondOptimal

/--
If two contexts require different optimal address renderings, no single
absolute address can be optimal for both.

This is the formal core of Address Relativity.  Delivery, emergency response,
registration, drone landing, and ZK disclosure may share the same reference
class or PID, but when their certified optimal renderings conflict, the paper
must not claim one condition-free address string is globally best.
-/
theorem conflicting_context_optima_prevent_absolute_address
    {Address : Type u}
    {absolute deliveryOptimal emergencyOptimal : Address}
    (different_optima : deliveryOptimal = emergencyOptimal -> False) :
    ¬ AbsoluteForTwoContexts absolute deliveryOptimal emergencyOptimal := by
  intro both
  have same_optima : deliveryOptimal = emergencyOptimal :=
    Eq.trans (Eq.symm both.left) both.right
  exact different_optima same_optima

/--
Purpose-specific rendering is not automatically a reference change.  If two
rendered addresses are produced from the same reference class, their PID can
remain invariant even when their visible strings differ.
-/
theorem relative_rendering_preserves_class_pid
    {Class Address PID : Type u}
    {firstRender secondRender : Class -> Address}
    (pidOfClass : Class -> PID)
    (referenceClass : Class)
    {firstAddress secondAddress : Address}
    (_first_rendered : firstRender referenceClass = firstAddress)
    (_second_rendered : secondRender referenceClass = secondAddress) :
    pidOfClass referenceClass = pidOfClass referenceClass := by
  rfl

end AMT
