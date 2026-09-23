# Address Morphism Theory: Problem Definition and Proof Appendix Insert

Status: English companion insert for the Japanese AMT v1 master manuscript.
Purpose: keep the newly added Japanese problem-definition and proof-appendix material portable to the international English paper.

## 1. Problem Definition

AMT does not merely solve the task "convert an address string into a coordinate." Its core problem is stricter:

> Given an address expression, a time, a context, a source bundle, a history state, and a policy, determine what may be safely referenced, or determine why no persistent identifier should be issued.

Let \(S_t\) be the set of surface address expressions at time \(t\), \(X_t\) the set of addressable entities, \(C_t\) the set of contexts, \(\Sigma_t\) the source bundle, \(H_t\) the lineage graph, and \(P_t\) the active policy. The AMT resolver is not a total map

\[
S_t\to X_t.
\]

It is a context- and evidence-bound partial map

\[
F_{\chi,t}:S_t\times\Sigma_t\times H_t\times P_t
\rightharpoonup
\operatorname{Res}_{\chi,t}(X_t).
\]

The output type is a disjoint union:

\[
\operatorname{Res}_{\chi,t}(X_t)
=
\operatorname{Resolved}(X_t)
\sqcup
\operatorname{Ambiguous}(\mathcal P_{\mathrm{fin}}(X_t))
\sqcup
\operatorname{Unresolved}(\mathrm{Reason})
\sqcup
\operatorname{Rejected}(\mathrm{Reason}).
\]

Thus AMT is a theory of safe conditional reference, not a theory of always returning one entity.

## 2. Explanatory Pipeline

The reader-facing pipeline should be shown as both prose and a typed transformation chain:

```text
surface expression u
  -> parse pi_t(u)
  -> multilingual, temporal, and neighborhood expansion epsilon_t
  -> candidate generation Gamma_t(u)
  -> structural comparison D_t
  -> clustering Pi_delta,t
  -> context-aware evaluation E_chi,t
  -> resolved / ambiguous / unresolved / rejected
  -> PID issuance gate
  -> lineage graph H_{t+1}
```

This prevents the reader from mistaking AMT for a geocoding UI or a coordinate-code proposal.

## 3. Prose-to-Math Mapping

| Prose concept | Mathematical model | Meaning |
| --- | --- | --- |
| Address input | \(u\in S_t\) | Surface expression entered or displayed by a user or system |
| Referent | \(x\in X_t\) | Building, unit, road, bridge, mountain, lake, heritage site, social base, etc. |
| Context | \(\chi\in C_t\) | Delivery, administration, emergency response, cadastral use, tourism, aid |
| Candidate generation | \(\Gamma_t:S_t\to\mathcal P_{\mathrm{fin}}(X_t)\) | Produces a finite candidate set |
| Ambiguity | \(|\Gamma_t(u)|>1\), or multiple surviving clusters | Evidence is insufficient for unique resolution |
| Candidate omission | \(x^\ast\notin\Gamma_t(u)\) | The true entity is absent from the search set |
| Normalization variation | \(n_t(u_1)=n_t(u_2)\), or same cluster | Expression variants collapse into a common representation |
| 2D coordinate loss | non-injective \(p:X_t^{3D}\to X_t^{2D}\) | Floor, unit, basement, bridge-above/bridge-below may be lost |
| Lineage | \(H_t=(V_t,E_t)\) | Rename, split, merge, retirement, inheritance, administrative change |
| Quality gate | \(Q_{\chi,t}(u,\Gamma,H,\Sigma)\ge\theta_\chi\) | Internal threshold required before PID issuance |
| PID issuance | \(\operatorname{IssuePID}(r,e,p)\) | Decides issuance from resolution state, evidence, and policy |

## 4. Proof Appendix Candidates

These claims are suitable for a proof appendix because they depend on maps, sets, relations, and disjoint output types rather than on the completeness of world data.

### Lemma H.1 Non-Injective Observation Has No Perfect Inverse

If \(O_t:X_t\to Y_t\) is non-injective, then there exist \(x_1\ne x_2\) such that \(O_t(x_1)=O_t(x_2)\). No function \(F:Y_t\to X_t\) can satisfy \(F(O_t(x))=x\) for all \(x\in X_t\).

Proof: If such \(F\) existed, then \(F(O_t(x_1))=x_1\) and \(F(O_t(x_2))=x_2\). Since \(O_t(x_1)=O_t(x_2)\), function extensionality gives \(x_1=x_2\), contradiction.

### Lemma H.2 Candidate Omission Is Irrecoverable

If a resolver may only resolve to members of \(\Gamma_t(u)\), and the true entity \(x^\ast\notin\Gamma_t(u)\), then the resolver cannot return \(\operatorname{Resolved}(x^\ast)\).

### Lemma H.3 Projection Loss Is Irrecoverable

If \(p:X_t^{3D}\to X_t^{2D}\) is non-injective, then no resolver using only \(p(x)\) can recover every three-dimensional addressable entity. This is a direct instance of Lemma H.1.

### Proposition H.4 Non-Emission Gate Soundness

Let

\[
\operatorname{IssuePID}:\operatorname{Res}_{\chi,t}(X_t)\times Evidence_t\times Policy_t
\to PID\sqcup NonIssue.
\]

If issuance implies \(r=\operatorname{Resolved}(x)\) and admissibility, then no PID is issued for \(\operatorname{Ambiguous}\), \(\operatorname{Unresolved}\), or \(\operatorname{Rejected}\) states.

### Proposition H.5 Context-Independent Optimality Fails Under Disjoint Optima

If

\[
\operatorname{Opt}_{\chi_1,t}(u)\cap\operatorname{Opt}_{\chi_2,t}(u)=\varnothing,
\]

then no single output \(x\in\Gamma_t(u)\) is optimal for both contexts.

### Lemma H.6 Split and Merge Require Relations

If a lineage event contains \(R(a,b_1)\) and \(R(a,b_2)\) with \(b_1\ne b_2\), then it cannot be represented completely by a single-valued successor function \(f\) satisfying \(R(a,b)\iff f(a)=b\).

### Proposition H.7 Audit Envelope Procedural Sufficiency

If a PID issuance predicate depends only on the committed input, context, source bundle, candidate set, clusters, decision, quality score, policy version, history delta, and timestamp contained in an audit envelope, then the procedure can be rechecked under the same policy and sources. This does not prove world truth; it proves procedural auditability.

### Lemma H.8 Normalization-Candidate Consistency

If \(n_t:S_t\to\bar S_t\) and

\[
\Gamma_t(u)\subseteq\bar\Gamma_t(n_t(u))
\]

for all \(u\), then normalization does not discard candidates already generated before normalization.

## 5. Validation Boundary

Formal proof can establish structural impossibility and gate soundness. GIS, postal datasets, source registries, delivery history, implementation tests, and security reviews are still required for empirical claims. The paper should state this boundary explicitly wherever it moves from formal reasoning to real-world coverage.
