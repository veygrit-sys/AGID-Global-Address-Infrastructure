# Jamaica Postal Context M2 review

## Technical summary - postcode data creation is out of scope and M2 remains blocked

The Universal Postal Union's September 2025 Universal DataBase lists Jamaica among countries which do not require postal codes. Its May 2021 Jamaica addressing sheet explicitly says that Jamaica has no postcode system and separately describes Kingston one- and two-digit sector codes beside town names. Current Jamaica Post pages still show address forms such as `Kingston 2`, `Kingston 4` and `Kingston 14`, but publish no national postcode assignment table. JM is therefore excluded from postcode-data creation and remains `blocked`/M2-unmet. No island, parish, Kingston sector, locality, office, route, Point, buffer, AGID cell or synthetic JM code was promoted.

## Evidence and address metadata

Seven exact Jamaica Post and UPU bodies totaling 1,076,160 bytes were fixed outside Git with retrieval time and SHA-256. They establish the current operator and office network, the Kingston sector address convention, the no-postcode statement, the September 2025 no-postcode list, and the rights boundary. The JM address-format JSON, YAML and generated Americas hierarchy now use `None`, null regex/API/rule and no postcode template token or field. This correction prevents false postcode prompts; it does not satisfy M2.

The country-specific target is `M2_current_jamaica_post_postcode_assignment_and_area_visualization`. A future M2 would require a current complete Jamaica Post or competent-authority release of assignments, aliases, validity intervals, exceptions and non-area objects; compatible AGID processing, storage, derivation, redistribution and public-serving rights; immutable artifacts; and valid Polygon/MultiPolygon geometry for each drawable code with authority, class, source, date, CRS, topology, method and confidence. Kingston sectors cannot substitute for that release.

## Reproducibility and rights

The offline inspector accepts only the seven expected filenames, byte sizes and SHA-256 values. It verifies Jamaica Post page markers, PDF signatures and page counts, the May 2021 Jamaica statement, physical page 4 of the September 2025 no-postcode list, and UPU copyright/database restrictions. Missing, renamed, additional or changed bodies and page/marker drift fail closed. Raw bodies stay outside Git.

Jamaica Post pages state All Rights Reserved; UPU material restricts reproduction, transmission and database use. Web access supplies reference evidence, not a licence for a postal dataset. No provider contact, registration, authentication, terms acceptance, contract, payment, protected-data access, publication or deployment was attempted.

## Application verification

The actual isolated app started at `http://127.0.0.1:3014/` and returned HTTP 200. A real unmocked `GET /api/v1/postal/JM/10?geometry=geojson` returned 404 with `Postal Context country is not supported`, so no JM production descriptor or area artifact is enabled. The in-app Browser was attempted first but failed before navigation because its Windows sandbox could not apply deny-read ACLs. A deterministic Playwright fallback then ran against the real app; only place search was controlled, the postal API was not mocked, two map canvases were present, and no postal-area notice or metadata was rendered. The controlled place result did not materialize, so a successful JM browser E2E or visual postcode-area path is not claimed.

Poppler rendered the one-page Jamaica sheet and the no-postcode page to non-empty PNGs. The local image-view helper failed with Windows error 206 even through a short path, so visual PDF display was not completed; exact bytes, page counts, extracted markers, dimensions and render SHA-256 values were verified.

## Draft pack boundary and limitations

The existing `data/postal_country_packs/jm` pack remains `draft`: 48 localities, 12 boundaries, 225 planning cells and three test vectors are synthetic planning/conformance material, not Jamaica Post assignments or areas. Postal Code → Polygon → Address Context separation remains intact; civic addresses and buildings require independent, rights-cleared identity and relationship evidence.

- Current absence is time-dependent and must be rechecked after the pending-country sweep.
- Kingston sectors are useful address context but are not national postcode identifiers or postal geometry.
- Shared geometry/UI tests prove only fail-closed capability; they do not promote a missing JM data artifact.
- The real JM API is unsupported and no translucent postal Polygon/MultiPolygon was displayed.

## Recommended next step

Keep JM blocked and continue to `KN` (Saint Kitts and Nevis). Re-check no earlier than `2026-09-08T09:20:23.139Z`, or sooner only if Jamaica Post or UPU announces a postcode system and publishes a rights-cleared fixed assignment and postal-area artifact. Any contact, agreement, paid access, new public destination or deployment requires explicit approval.
