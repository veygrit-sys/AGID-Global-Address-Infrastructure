# Uruguay postal polygon visual and application check

Date: 2026-09-02

Country: UY / Uruguay

Sample: ordinary postal code `11000`, official `cp_id` 1

## Outcome

The fixed August 2023 Correo Uruguayo polygon can be transformed, structurally validated, ID-linked, fit and deterministically drawn with a translucent fill and clear outline. The real isolated AGID application did not start because `tsx`/`node_modules` are unavailable. The in-app Browser process exited before navigation. Local image inspection also failed on the Windows path. Therefore this report does not claim real-app or human visual verification.

The deterministic fallback rendered the committed Polygon at 1440×900, performed render, fit-status, clear, re-search, no-match and re-search actions, and verified:

- fill opacity `0.24` and outline width `4px`;
- 185,787 blue fill pixels and 15,391 dark boundary pixels;
- visible postal context ID `postal-uy-correo-2023-11000`;
- visible source `cp_id 1` and geometry ID `correo-uy-postal-2023-11000`;
- visible AGID reference node and cell `UY0FZ5D9368V`;
- explicit warning that the AGID cell is an interior reference only, not area coverage, an address or a building.

Evidence: `uy-deterministic-visual-2026-09-02.png` and `uy-deterministic-visual-2026-09-02.txt` in this report directory.

## Polygon quality

The official KML and SHP/DBF each contain 121 records. All 121 five-digit codes and all 121 `cp_id` values match exactly. KML and SHP bounds agree in WGS84. Source geometry contains 121 Polygon parts, 122 rings and 251,684 positions. Code `15400` contains one four-position zero-area interior ring. The reproducible transform removes only those four positions, leaves every coordinate value unchanged, and emits 121 closed non-zero-area rings / 251,680 positions. No missing surface is generated.

The output is tied to August 2023 validity. The official catalog calls the publication frequency single and exposes no primary evidence in this run proving that the release is the complete current 2026 assignment/supersession state. It remains non-promotable.

## Authority boundary

Ordinary five-digit postal areas, official `cp_id`, geometry IDs, country assertions and derived AGID reference IDs are public. Correo's detailed ten-digit CPA structure and data are reserved by the reviewed decision and are not published. Postal geometry is not an address-building relation. No address, building, parcel, recipient, customer, person or land-right record is included.
