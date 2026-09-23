import AMTCore

/-!
Formal extensions for Address Morphism Theory (AMT) paper claims.

`AMTCore.lean` contains the core resolver, candidate, PID, equivalence,
entropy, and relativity checks.  This file formalizes additional paper-level
claims that were previously described in prose or diagrams:

* append-only address lineage;
* renaming invariance for reference classes;
* address-as-compression impossibility;
* monotone reputation under positive evidence;
* GIS validation certificates as a bridge from empirical checks to Lean;
* ZK proof-bundle compatibility as a policy gate;
* context-specific no-free-lunch checks.

Lean does not prove empirical GIS facts here.  Instead, GIS software produces a
certificate with counts and budgets, and Lean proves which conclusions are valid
if that certificate is accepted.
-/

universe u v

namespace AMT

/-! ## Address lineage and conservation -/

/-- A minimal address-lineage graph.  Nodes are historical address states or
addressable entities, and edges are accepted lineage transitions. -/
structure LineageGraph (Node : Type u) where
  nodePresent : Node -> Prop
  edgePresent : Node -> Node -> Prop

/-- Append-only extension: later lineage evidence may add nodes and edges, but
must not delete earlier accepted nodes or transitions. -/
def LineageExtends {Node : Type u}
    (old new : LineageGraph Node) : Prop :=
  (forall node, old.nodePresent node -> new.nodePresent node) /\
  (forall source target,
    old.edgePresent source target -> new.edgePresent source target)

/-- An append-only lineage update preserves every old node. -/
theorem append_only_lineage_preserves_node
    {Node : Type u}
    {old new : LineageGraph Node}
    (hExtends : LineageExtends old new)
    {node : Node}
    (present : old.nodePresent node) :
    new.nodePresent node := by
  exact hExtends.left node present

/-- An append-only lineage update preserves every old transition edge. -/
theorem append_only_lineage_preserves_edge
    {Node : Type u}
    {old new : LineageGraph Node}
    (hExtends : LineageExtends old new)
    {source target : Node}
    (edge : old.edgePresent source target) :
    new.edgePresent source target := by
  exact hExtends.right source target edge

/-- A trace represented as a finite list of accepted lineage edges. -/
def LineageEdgeTrace {Node : Type u}
    (graph : LineageGraph Node)
    (edges : List (Node × Node)) : Prop :=
  forall edge, edge ∈ edges -> graph.edgePresent edge.fst edge.snd

/-- Append-only lineage preserves finite historical traces. -/
theorem append_only_lineage_preserves_trace
    {Node : Type u}
    {old new : LineageGraph Node}
    {edges : List (Node × Node)}
    (hExtends : LineageExtends old new)
    (trace : LineageEdgeTrace old edges) :
    LineageEdgeTrace new edges := by
  intro edge member
  exact hExtends.right edge.fst edge.snd (trace edge member)

/-! ## Renaming invariance and equivalence-class stability -/

/-- A textual rename preserves the reference when it changes notation but not
the referenced entity. -/
def ReferencePreservingRename {Address Entity : Type u}
    (ref : Address -> Entity)
    (rename : Address -> Address) : Prop :=
  forall address, ref (rename address) = ref address

/-- A reference-preserving rename keeps the renamed expression equivalent to
the original expression. -/
theorem equivalence_class_invariant_under_renaming
    {Address Entity : Type u}
    (ref : Address -> Entity)
    (rename : Address -> Address)
    (preserves : ReferencePreservingRename ref rename)
    (address : Address) :
    RefEquivalent ref (rename address) address := by
  unfold RefEquivalent
  exact preserves address

/-- Reference-preserving renames also preserve the whole reference class. -/
theorem renamed_address_has_same_reference_class
    {Address Entity : Type u}
    (ref : Address -> Entity)
    (rename : Address -> Address)
    (preserves : ReferencePreservingRename ref rename)
    (address : Address) :
    SameReferenceClass ref (rename address) address := by
  exact same_reference_yields_same_reference_class
    (equivalence_class_invariant_under_renaming ref rename preserves address)

/-! ## Address compression -/

/--
If a compression function maps two distinct raw entities to the same code, then
there is no perfect decoder that recovers every raw entity from only that code.

This is the formal version of the paper's "address is information compression"
claim.  Postal codes, Plus Codes, AGID prefixes, ordinary address strings, and
other compact representations can be useful, but lossy compression cannot be
declared a condition-free identity resolver.
-/
theorem noninjective_compression_no_perfect_decoder
    {Raw : Type u}
    {Code : Type v}
    (compress : Raw -> Code)
    {left right : Raw}
    (same_code : compress left = compress right)
    (distinct : left = right -> False) :
    ¬ (exists decode : Code -> Raw,
      forall value : Raw, decode (compress value) = value) := by
  intro decoder_exists
  rcases decoder_exists with ⟨decode, perfect⟩
  have left_decoded : decode (compress left) = left := perfect left
  have right_decoded : decode (compress right) = right := perfect right
  have same_decoded :
      decode (compress left) = decode (compress right) := by
    rw [same_code]
  have left_eq_right : left = right :=
    Eq.trans (Eq.symm left_decoded)
      (Eq.trans same_decoded right_decoded)
  exact distinct left_eq_right

/-! ## Reputation and positive evidence -/

/-- A deliberately small monotone reputation numerator.  Production systems may
use log-likelihood ratios, Bayesian updates, or calibrated scores, but any
"positive evidence" component should be monotone in successful observations when
all other evidence is fixed. -/
def ReputationEvidenceScore
    (prior successWeight successCount : Nat) : Nat :=
  prior + successWeight * successCount

/-- Adding positive evidence cannot lower the positive-evidence component of
the reputation score. -/
theorem positive_evidence_monotone_reputation
    (prior successWeight successCount additionalSuccesses : Nat) :
    ReputationEvidenceScore prior successWeight successCount <=
      ReputationEvidenceScore prior successWeight
        (successCount + additionalSuccesses) := by
  unfold ReputationEvidenceScore
  exact Nat.add_le_add_left
    (Nat.mul_le_mul_left successWeight
      (Nat.le_add_right successCount additionalSuccesses))
    prior

/-! ## GIS certificate bridge -/

/-- A compact certificate exported by empirical GIS validation. -/
structure GisValidationCertificate where
  featureCount : Nat
  errorCount : Nat
  warningCount : Nat
  maxErrors : Nat
  maxWarnings : Nat
  registeredSourceCount : Nat
  minFeatureCount : Nat
  minRegisteredSourceCount : Nat
  geometryChecked : Prop
  sourceRegistryChecked : Prop

/-- Acceptance conditions for a GIS certificate. -/
structure GisCertificateAccepted
    (certificate : GisValidationCertificate) : Prop where
  geometryChecked : certificate.geometryChecked
  sourceRegistryChecked : certificate.sourceRegistryChecked
  errorWithinBudget : certificate.errorCount <= certificate.maxErrors
  warningWithinBudget : certificate.warningCount <= certificate.maxWarnings
  zeroErrorBudget : certificate.maxErrors = 0
  enoughFeatures : certificate.minFeatureCount <= certificate.featureCount
  enoughSources :
    certificate.minRegisteredSourceCount <= certificate.registeredSourceCount

/-- If the accepted GIS certificate has a zero-error budget, it has no errors. -/
theorem accepted_gis_certificate_has_no_errors
    {certificate : GisValidationCertificate}
    (accepted : GisCertificateAccepted certificate) :
    certificate.errorCount = 0 := by
  have errorWithinBudget : certificate.errorCount <= certificate.maxErrors :=
    accepted.errorWithinBudget
  have no_error_budget : certificate.errorCount <= 0 := by
    rw [accepted.zeroErrorBudget] at errorWithinBudget
    exact errorWithinBudget
  exact Nat.eq_zero_of_le_zero no_error_budget

/-- Source-validation status used to keep unknown/open-source gaps explicit. -/
inductive SourceValidation where
  | accepted : SourceValidation
  | unknown : SourceValidation
  | rejected : SourceValidation

/-- Only accepted source validation is usable for a verified GIS claim. -/
def SourceVerified : SourceValidation -> Prop
  | SourceValidation.accepted => True
  | SourceValidation.unknown => False
  | SourceValidation.rejected => False

/-- Unknown source status cannot be silently promoted into a verified source. -/
theorem unknown_source_prevents_verified_claim :
    ¬ SourceVerified SourceValidation.unknown := by
  intro verified
  exact verified

/-- Rejected source status cannot be silently promoted into a verified source. -/
theorem rejected_source_prevents_verified_claim :
    ¬ SourceVerified SourceValidation.rejected := by
  intro verified
  exact verified

/-! ## ZK proof-bundle compatibility -/

/-- Abstract compatibility policy for combining address-related ZK proofs. -/
structure ProofBundlePolicy where
  domainSeparated : Prop
  sameStatementScope : Prop
  noNullifierReplay : Prop
  freshRoot : Prop
  revocationRootAccepted : Prop
  issuerTrusted : Prop
  publicClaimCoarseEnough : Prop
  noPrivateMaterialExposed : Prop

/-- A proof bundle is accepted only when all compatibility gates pass. -/
structure ProofBundleAccepted (policy : ProofBundlePolicy) : Prop where
  domainSeparated : policy.domainSeparated
  sameStatementScope : policy.sameStatementScope
  noNullifierReplay : policy.noNullifierReplay
  freshRoot : policy.freshRoot
  revocationRootAccepted : policy.revocationRootAccepted
  issuerTrusted : policy.issuerTrusted
  publicClaimCoarseEnough : policy.publicClaimCoarseEnough
  noPrivateMaterialExposed : policy.noPrivateMaterialExposed

/-- Accepted proof bundles cannot expose private material by policy. -/
theorem accepted_proof_bundle_exposes_no_private_material
    {policy : ProofBundlePolicy}
    (accepted : ProofBundleAccepted policy) :
    policy.noPrivateMaterialExposed := by
  exact accepted.noPrivateMaterialExposed

/-- Accepted proof bundles require domain separation, preventing accidental
cross-purpose proof reuse. -/
theorem accepted_proof_bundle_requires_domain_separation
    {policy : ProofBundlePolicy}
    (accepted : ProofBundleAccepted policy) :
    policy.domainSeparated := by
  exact accepted.domainSeparated

/-! ## Context no-free-lunch model -/

/-- A resolver is optimal in a context when no alternative has lower cost. -/
def OptimalInContext {Context Resolver : Type u}
    (cost : Context -> Resolver -> Nat)
    (context : Context)
    (resolver : Resolver) : Prop :=
  forall other : Resolver, cost context resolver <= cost context other

/-- Universal optimality across two contexts. -/
def UniversallyOptimalForTwoContexts {Context Resolver : Type u}
    (cost : Context -> Resolver -> Nat)
    (firstContext secondContext : Context)
    (resolver : Resolver) : Prop :=
  OptimalInContext cost firstContext resolver /\
  OptimalInContext cost secondContext resolver

/-- If another resolver is strictly better in one context, the worse resolver
cannot be universally optimal. -/
theorem strictly_better_context_blocks_universal_optimum
    {Context Resolver : Type u}
    (cost : Context -> Resolver -> Nat)
    {firstContext secondContext : Context}
    {better worse : Resolver}
    (strictly_better : cost firstContext better < cost firstContext worse) :
    ¬ UniversallyOptimalForTwoContexts
      cost firstContext secondContext worse := by
  intro universal
  have worse_is_optimal_in_first :
      OptimalInContext cost firstContext worse := universal.left
  exact Nat.not_lt_of_ge (worse_is_optimal_in_first better) strictly_better

end AMT
