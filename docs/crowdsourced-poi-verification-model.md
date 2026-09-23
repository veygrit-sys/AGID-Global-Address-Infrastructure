# Crowdsourced POI Verification Model

AGID can improve weak-address regions by letting public users, carriers,
municipalities, NGOs, hotels, and merchants submit privacy-safe evidence about
public POIs.

The goal is not to publish raw photos or exact user traces. The goal is to
convert safe evidence into:

- `sourceConfidence`
- `community-verified`
- `manual-review-required`

## Evidence Classes

Allowed evidence must be reduced before publication:

- redacted photo hash or safe reference
- coarse location distance to AGID cell
- delivery arrival-history aggregate
- signed operator confirmation
- public-record link
- map edit reference
- delivery-success aggregate
- negative report

Rejected evidence:

- raw photo
- EXIF metadata
- precise coordinates
- raw personal address
- recipient record
- private delivery note

## Scoring

Each submission is scored from reporter class, evidence kind, freshness, signed
status, redaction status, arrival success ratio, and contradictions.

```text
score =
  reporterWeight
+ evidenceWeight
+ signedBoost
+ redactionBoost
+ aggregateSuccessBoost
- contradictionPenalty
```

Then independent reporters and evidence diversity add a corroboration boost.

## Decision

```text
community-verified
  if confidence >= threshold
  and independent reporters >= minimum
  and evidence kinds >= minimum
  and negative evidence ratio is low

source-confidence
  if confidence is useful but not enough for community verification

manual-review-required
  if evidence is thin, contradictory, stale, or risky

rejected
  if evidence contains raw photo, EXIF, precise coordinates, raw address, or personal data
```

## POI Graph Integration

The output can update a POI node's `trustScore` and source references without
exposing private evidence:

```text
safe submissions
  -> sourceConfidence
  -> community status
  -> POI trustScore update
  -> POI graph deliverability
```

## Implementation

Reference code:

- `src/lib/crowdsourcedPoiVerification.ts`
- `src/lib/crowdsourcedPoiVerification.test.ts`

Related model:

- `docs/poi-graph-deliverability-model.md`
