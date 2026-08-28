# AE M2 source and namespace review — 2026-08-28

**Outcome: M1_metadata / blocked; M2 is not achieved.** No current source-data
snapshot, real-record transformation, postal polygon or public data artifact
was obtained. Source documentation and engineering tests are not M2 data.

## Official evidence and limits

- [Emirates Post FAQ](https://www.emiratespost.ae/faq): web-text inspection found
  branch-specific PO Box allocation. The direct reproducible probe returned
  HTTP 403; no response is claimed as a successful dataset acquisition.
- [Abu Dhabi DMT Onwani](https://pages.dmt.gov.ae/en/onwani): the current page
  lists postal code alongside civic address components. Keep this municipal
  namespace separate from postal-operator boxes and Dubai entrance locators.
- [DMT terms](https://www.dmt.gov.ae/en/Terms-and-Conditions): the retrieved
  privacy notice does not establish dataset-specific derivative/publication
  permission. No agreement or authenticated map service was entered.
- [Dubai Municipality Makani](https://www.dm.gov.ae/open-data2/open-data-for-makani/):
  conditional reuse includes attribution, data-sale and alteration restrictions.
  We have not cleared a transformed AGID data release. Neither a location
  identifier nor its point establishes an official postal area or building name.
- [UPU AE guide](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/areEn.pdf):
  extracted text identifies edition 09/2014. It is historical addressing
  guidance, not a current record export; it cannot negate Onwani's current
  postal-code component. Image review was unavailable on this host.

The [machine-readable review](../reports/postal-context-m2/ae-reference-review-2026-08-28.json)
records observation times, exact response hashes, redirects, HTTP and content
checks. Four references passed content checks. The legacy Makani manual URL
returned the municipality homepage (HTTP 200, HTML), not a PDF; Dubai Pulse's
entrances catalog failed to connect. These are observed access results, not a
claim that no licensed dataset exists. Website modification headers are not
dataset editions. No raw document or data dump is committed.

Document hashes identify responses seen on this date. Their source bodies were
not retained or published, so they cannot stand in for the immutable source and
licence snapshots required for M2. A successful page check is not data-rights,
record-coverage or runtime verification.

## Implemented safety boundary

The [AE contract](../data/postal_country_packs/ae/postal-context/repository-manifest.json)
defines three scoped namespaces and a new, explicit AE-specific M2 criterion.
AGID's catalog now keeps Makani and the other AE reference pages out of eligible
postal-validation sources. Dubai/Abu Dhabi references are subnational, and the
AE format no longer describes every identifier as `None/PO Box`. It still has
no generic postcode regex or enabled country-only Postal Context runtime.

This changes metadata/source trust, not address UI fields or an API deployment.
The tests protect namespace separation, source authority, historical evidence,
reference-only status, and failed-document handling. There is no claim of real
AE runtime or building-level validation.

## Engineering verification

The [engineering report](../reports/postal-context-m2/ae-checks-2026-08-28.json)
records 138 focused/source-format tests, 23 M2 ledger tests, 159 shared runtime
tests and 308 tests in other direct source-catalog consumers, all passing.
TypeScript checking passed. This validates the code/contract only, not AE data.
The exact historical UPU document URL first reproduced a false strong-source
classification; exact ID/URL/name precedence corrected it and the consumer
regression suite remained green.

## Conditions to resume

1. Identify a current, bounded dataset and its exact jurisdiction, namespace,
   edition, assignment authority and source-record identifiers.
2. Establish acquisition, retention, transformation and redistribution rights
   for that product; retain the exact terms with timestamp and SHA-256.
3. Implement reproducible exception handling and namespace-aware AGID loading;
   verify real rows and direct source links for each civic/building field.
4. Obtain explicit approval for any new public data destination, publish pinned
   artifacts, check their remote hashes and replay before M2 promotion.

Next read-only source/rights review: **2026-09-04**, after all pending countries
have been visited. That date does not authorize authentication, contractual
acceptance, source republication, a new repository or production deployment.
Next rollout country is **AF (Afghanistan)**. Japan's separate approval hold is
unchanged.
