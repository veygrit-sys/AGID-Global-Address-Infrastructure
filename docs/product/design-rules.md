# AGID Design Rules

AGID screens should stay usable for field work, development, and research without turning every page into an operations console.

## Common Action Bar

- Show the common action bar only on working surfaces.
- Hide it on reading or developer surfaces: OSS home, Research, and Developer Console.
- The map home keeps only the compact current-location action visible.
- Do not show raw address, recipient, phone, private key, proof witness, or QR payload text in common chrome.
- One-tap QR scan and address registration belong in app entry points, not in the map-home compact chrome.
- Field workflow screens should keep the primary decision, sync queue, undo, receipt status, and quality state visible without exposing private address text.

## Hero First Viewport

- The OSS hero first viewport contains only:
  - H1
  - one-sentence definition
  - three role CTAs
  - three primary product cards
- Role CTAs are user, developer, and researcher.
- GitHub, SDK download, spec, conformance, local-first notes, and research detail belong below the first viewport or in the header.
- The first viewport must not include the common next-action bar, sync queue, audit log, release-gate table, SDK install panel, developer command block, or dense badge row.
- If a hero needs more trust or developer detail, move it to a lower section with a clear heading instead of adding another row above the fold.
- The first viewport should use at most one primary bitmap preview. Prefer a static map/grid preview over a live map instance.
- Do not start vector tile loading, country-pack downloads, postal index downloads, WebGL scenes, QR camera sessions, or external network requests in the first viewport.

## Density

- Keep primary CTAs to three or fewer.
- Keep primary hero cards to three or fewer.
- Use at most one small label per section.
- Avoid decorative badges. Use pills only for trust, quality, security, release, or verification state.
- Prefer readable sections over nested card stacks.

## Language

- `/open-source` uses its own EN/JA toggle and the whole page copy must follow it.
- Address language tabs, app language, and country selection remain separate concepts.
- Avoid mixed Japanese/English labels unless the label is a product or protocol name.

## Scroll Shells

- Full page surfaces must use one of the shared scroll shells:
  - `agid-page-scroll`
  - `agid-fixed-page-scroll`
  - `agid-viewport-shell`
- Map overlays should not create a hidden second page scroll.
