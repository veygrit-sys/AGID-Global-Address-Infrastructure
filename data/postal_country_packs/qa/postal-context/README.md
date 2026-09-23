# Qatar Postal Context contract

M1 metadata only; **M2 is not complete**. No external repository, data release,
production geometry, personal information or live QA pack is created here.

Qatar Post's Inwani/Anwani address consists of zone, street and building
identifiers. PO boxes are a separate delivery mode. Keep `postal_code=null`
and official postal geometry `none`; never substitute a zone, PO box or `00000`.

The country-specific M2 criterion in `repository-manifest.json` requires a
current, complete-for-declared-coverage, permitted official address artifact,
explicit relations, georeferencing, reproducible checks, approved immutable
publication and a real QA AGID loader/API verification.

`m2-source-review.json` pins exact public-reference responses and acquisition
failures. `source-profile.json` separates source authority, data grain and rights.
The [review](../../../../docs/postal-context-qatar-m2.md) explains the evidence
and unblock conditions. Synthetic tests and aggregate road counts are not M2.

Do not publish raw sources in AGID Git. Keep temporary acquisitions outside
tracked files; no extra fees, account creation or new public destination is
authorized by this contract.
