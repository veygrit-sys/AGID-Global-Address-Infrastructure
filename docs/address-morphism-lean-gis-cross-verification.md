# Address Morphism Theory: Lean and GIS Cross-Verification

This note records the additional verification performed for paper concepts that
were present in prose, diagrams, or hypotheses but were not yet separated into
Lean-checkable models.

## Scope

The verification deliberately separates three layers:

1. **Lean-proved structural claims**: theorems that follow from stated
   definitions, without empirical assumptions.
2. **GIS-measured facts**: geometry/source checks produced by GIS validation
   software and project datasets.
3. **Lean-GIS bridge claims**: Lean theorems over a generated certificate that
   imports the GIS result as bounded evidence, without pretending Lean has
   inspected every geometry directly.

## Newly Formalized Concepts

| Paper concept | Lean artifact | Result |
| --- | --- | --- |
| Address conservation / lineage preservation | `LineageGraph`, `LineageExtends`, `append_only_lineage_preserves_node`, `append_only_lineage_preserves_edge`, `append_only_lineage_preserves_trace` | Proven in Lean |
| Equivalence-class stability under renaming | `ReferencePreservingRename`, `equivalence_class_invariant_under_renaming`, `renamed_address_has_same_reference_class` | Proven in Lean |
| Address as compression | `noninjective_compression_no_perfect_decoder` | Proven in Lean |
| Reputation monotonicity under positive evidence | `ReputationEvidenceScore`, `positive_evidence_monotone_reputation` | Proven in Lean |
| GIS evidence acceptance | `GisValidationCertificate`, `GisCertificateAccepted`, `accepted_gis_certificate_has_no_errors` | Proven in Lean conditional on certificate fields |
| Unknown/rejected source handling | `SourceValidation`, `unknown_source_prevents_verified_claim`, `rejected_source_prevents_verified_claim` | Proven in Lean |
| ZK proof bundle compatibility | `ProofBundlePolicy`, `ProofBundleAccepted`, proof-bundle requirement theorems | Proven in Lean at policy-gate level |
| Address No Free Lunch / context dependence | `OptimalInContext`, `UniversallyOptimalForTwoContexts`, `strictly_better_context_blocks_universal_optimum` | Proven in Lean |

These additions live in:

- `formal/AMTPaperExtensions.lean`

## Lean-GIS Bridge

The empirical GIS validation report is converted into a Lean certificate by:

- `scripts/export-gis-lean-certificate.ts`

The generated Lean file is:

- `formal/GeneratedGisCertificate.lean`

The generated certificate records:

- feature count;
- GIS error count;
- GIS warning count;
- warning/error budgets;
- registered open-source count;
- minimum feature/source floors;
- whether geometry and source-registry checks were run.

Lean then proves:

- the GIS certificate is accepted under the declared budget;
- the accepted certificate has zero GIS errors;
- feature/source floors are met;
- warning budget is met.

Current generated values:

| Metric | Value |
| --- | ---: |
| Features | 351 |
| GIS errors | 0 |
| GIS warnings | 149 |
| Registered sources | 408 |
| Minimum features | 351 |
| Minimum registered sources | 408 |
| Max errors | 0 |
| Max warnings | 149 |

This does **not** mean Lean directly proves that every polygon or coordinate is
true.  It means GIS checks produced a report within the accepted budget, and
Lean verifies the logical consequences of accepting that report.

## Commands

The integrated command is:

```powershell
npm run verify:gis:lean
```

It performs:

1. compile `formal/AMTCore.lean`;
2. compile `formal/AMTPaperExtensions.lean`;
3. export `formal/GeneratedGisCertificate.lean`;
4. check the generated Lean certificate.

Additional checks run:

```powershell
npm run verify:gis:budget
npm run lint
```

## Verified Boundary

The following are now mechanically checked:

- a lossy address compression cannot have a perfect decoder;
- a reference-preserving rename cannot change the reference class;
- append-only lineage preserves prior nodes, edges, and finite traces;
- positive evidence cannot lower the simplified positive-evidence reputation
  component;
- unknown/rejected GIS sources cannot be silently treated as verified;
- accepted proof bundles must satisfy domain separation and private-material
  non-exposure gates;
- a resolver that is strictly worse in one context cannot be universally
  optimal;
- current GIS report counts satisfy the declared zero-error budget and minimum
  coverage floors.

The following still require empirical datasets, experiments, or stronger
implementation witnesses:

- whether the dataset contains every named island, river, lake, desert, ruin,
  or bridge in the world;
- whether delivery success data is calibrated enough to support production
  reputation scores;
- whether a real ZK circuit proves each address predicate efficiently;
- whether source licenses and official APIs remain valid over time;
- whether all administrative split/merge cases are represented in real lineage
  graphs.

## Paper Implication

The paper can safely state the new results as conditional formal theorems:

- **Address Conservation** is valid for append-only lineage graphs.
- **Address Compression** is formally lossy when the compression map is
  non-injective.
- **Equivalence-Class Stability** is valid under reference-preserving renames.
- **No Free Lunch** is valid when one resolver is strictly worse in a context.
- **GIS Certification** is valid as a certificate bridge, not as a direct Lean
  proof of all geography.

The wording should avoid unconditional global claims such as "all natural
features are covered" unless a separate empirical coverage certificate is
provided for that feature class.
