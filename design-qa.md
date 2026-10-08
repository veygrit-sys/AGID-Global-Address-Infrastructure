# Open Source hero design QA

## Target and implementation

- Selected reference: `C:/Users/kitau/.codex/generated_images/01a0cbbe-c1d7-76d3-bab3-23484e1a202d/exec-fcc73f46-f0ae-4f77-9cc4-57f4d3498ba7.png`
- Implemented route: `http://127.0.0.1:4319/open-source`
- Desktop capture: `C:/Users/kitau/Documents/Codex/2026-09-23/a/outputs/open-source-grid-hero-desktop.jpg`
- Mobile capture: `C:/Users/kitau/Documents/Codex/2026-09-23/a/outputs/open-source-grid-hero-mobile-located.jpg`
- Desktop viewport: 1440 × 1100
- Mobile viewport: 390 × 844, touch enabled
- State: English, Grid on; mobile current-location state also checked with a mocked Tokyo coordinate

## Comparison passes

### Pass 1 — failed

The navigation, full-width map frame, and dark information band matched the selected composition, but MapLibre's `.maplibregl-map { position: relative }` rule overrode the absolute positioning utility on the container. The container height became 0 px and the canvas fell back to 300 px, leaving the hero map visually empty.

Fix: made the map container explicitly `height: 100%` and `width: 100%`, then kept the section as the sizing boundary. Resource-level map errors no longer replace an otherwise usable vector map with the fallback panel.

### Pass 2 — passed

- Layout: existing navigation is unchanged; the map fills the page width and is followed by the information band. There is no hero copy beside or above the map.
- Typography: the information band keeps the target's clear three-part hierarchy and collapses to a readable single-column mobile stack.
- Color: white navigation, light vector map, blue interaction state, and deep navy information band follow the selected direction.
- Image fidelity: the illustrative reference map is implemented as a live, non-photographic OpenFreeMap vector map with the actual AGID grid rather than a static image or CSS illustration.
- Controls: zoom, current location, and Grid visibility use one compact vertical control group. Grid state changes through `aria-pressed`.
- Responsiveness: 390 px mobile has no horizontal overflow (`scrollWidth === clientWidth`); the map remains 487.5 px high and controls remain 40 × 40 px.
- Accessibility: the map section and controls have localized labels, Grid updates use an `aria-live` status, and controls retain keyboard focus behavior.
- Content: the hero copy describes repository-backed functionality and keeps Repository and Research links below the map.

## Functional evidence

- Target component tests: 7 passed, 0 failed.
- TypeScript: `tsc --noEmit` passed.
- Production build: Vite output generated successfully in `dist/`.
- Browser: live vector map rendered at 1432 × 746 px inside a 1440 px desktop viewport.
- Grid control: `aria-pressed` changed `true → false → true`.
- Current location: geolocation permission and a mocked coordinate moved and redrew the mobile map successfully.

## Known external response

OpenFreeMap currently returns 404 for one optional `Noto Sans Italic` glyph range used by some local road labels. The base vector map, AGID grid, controls, and layout still render; this is a third-party font-tile response rather than an application route or asset failure.

## Final result

passed
