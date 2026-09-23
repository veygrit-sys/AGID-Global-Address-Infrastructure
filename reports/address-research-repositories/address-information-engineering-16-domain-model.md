# Address Information Engineering: 16-Domain Model

Address Information Engineering studies addresses as information infrastructure
that connects people, places, institutions, logistics, and time. It does not
equate an address expression with a person, a place, a legal fact, or a
delivery guarantee.

## Repository Topology

The local repository family is organized as four groups of four domains:

| Group | Domains |
| --- | --- |
| Address foundations | address ontology, address morphism theory, address formal languages, address semantics |
| Spatial and structural | address spatial information, address topology, address temporal information, address identity |
| Computing | address data systems, address algorithms, address probabilistic inference, address systems and networking |
| Societal implementation | address security and privacy, address quality and validation, address standards and governance, address UX and social implementation |

The first six domains are the initial research spine: address ontology, address
morphism theory, address formal languages, address spatial information, address
data systems, and address security and privacy.

## Boundaries

Each domain starter is local-only. It contains publication metadata and quality
gates, not a raw-address corpus, recipient identities, carrier credentials,
proof witnesses, private keys, production payloads, or a claim of universal
address resolution. A starter becomes a remote repository only after the staged
creation policy and repository creation preflight have both passed.

## Relation To Address Morphism Theory

Address Morphism Theory is one domain in this model and remains the central
theory that connects the other domains. Its existing local publication profile
at `address-morphism-theory/` is reused rather than duplicated under `domains/`.
