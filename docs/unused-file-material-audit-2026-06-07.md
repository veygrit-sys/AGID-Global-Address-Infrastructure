# Unused File and Material Audit

Date: 2026-06-07

Scope: full workspace traversal excluding only `.git` and `node_modules`. The app was launched at `http://127.0.0.1:3000/`, and the production build was verified separately with `npm run build`.

This report does not delete files. It separates high-confidence generated cleanup from medium-confidence archives and code review candidates.

## Summary

- Total scanned files: 2242
- Total scanned size: 123.2 MB
- Static reachable files from app/server/package entries: 340
- High-confidence generated cleanup candidates: 412
- Generated/intermediate review candidates: 6
- Postal archive cache candidates: 1
- Document archive candidates: 88
- Code review candidates: 368

## App And Build Verification

- App URL: `http://127.0.0.1:3000/`
- Launch result: HTTP 200, title `AGID • Absolute Grid Identity`
- Launch screenshot: `output/pdf/agid-app-launch-audit.png`
- Build result: production build succeeded.
- Build warning to consider: `src/services/GeocodingService.ts` imports `AsiaOceaniaService.ts` and `EastAsiaService.ts` both statically and dynamically, preventing dynamic chunk separation.
- Build warning to consider: `assets/main-*.js` is approximately 4.55 MB raw / 1.54 MB gzip, so code/data splitting should be improved before heavy cleanup.

## Largest Top-Level Areas

| Area | Files | Size |
|---|---:|---:|
| `data` | 24 | 59.8 MB |
| `outputs` | 167 | 27.0 MB |
| `src` | 1248 | 11.5 MB |
| `output` | 10 | 10.7 MB |
| `dist` | 333 | 5.99 MB |
| `docs` | 198 | 3.14 MB |
| `test-results` | 9 | 2.14 MB |
| `(root)` | 42 | 1013.2 KB |
| `sdk` | 143 | 670.9 KB |
| `formal` | 5 | 551.9 KB |
| `scripts` | 34 | 282.0 KB |
| `artifacts` | 2 | 199.9 KB |
| `public` | 5 | 109.6 KB |
| `reports` | 1 | 99.7 KB |
| `db` | 7 | 21.7 KB |
| `native` | 3 | 13.0 KB |
| `contracts` | 4 | 10.6 KB |
| `circuits` | 2 | 1.88 KB |
| `.github` | 3 | 1.28 KB |
| `app` | 2 | 653 B |

## Largest Files

| File | Size |
|---|---:|
| `data/postal_codes/JP.txt` | 11.8 MB |
| `data/postal_codes/MX.txt` | 11.5 MB |
| `data/postal_codes/IN.txt` | 11.2 MB |
| `data/postal_codes/SG.txt` | 5.59 MB |
| `output/pdf/address-morphism-theory-ja.pdf` | 4.60 MB |
| `data/postal_codes/FR.txt` | 4.24 MB |
| `data/postal_codes/ES.txt` | 3.09 MB |
| `output/pdf/address-morphism-theory-en.pdf` | 3.07 MB |
| `data/postal_codes/KR.txt` | 2.69 MB |
| `data/postal_codes/TR.txt` | 2.21 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/redacted-receipt.png` | 2.15 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/field-ready-kit.png` | 2.14 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/key-rotation-station.png` | 2.13 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/offline-sync-tray.png` | 2.07 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/nfc-tap-zone.png` | 2.03 MB |
| `data/postal_codes/ID.txt` | 1.94 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/package-line-throughput.png` | 1.94 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/handoff-counter.png` | 1.91 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/decision-light-band.png` | 1.87 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/operator-sidebar.png` | 1.87 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/security-posture-console.png` | 1.81 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/blocked-state-visibility.png` | 1.79 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/scan-desk-discipline.png` | 1.74 MB |
| `test-results/official-postal-source-coverage.json` | 1.58 MB |
| `outputs/moodboards/agid-aoid-pos-terminal/generated/contact-sheet.png` | 1.48 MB |

## High-Confidence Cleanup Candidates

These are reproducible or temporary artifacts. They are the safest cleanup class, but deletion should still be done after one final user approval.

| File | Size | Confidence | Reason |
|---|---:|---|---|
| `test-results/official-postal-source-coverage.json` | 1.58 MB | high | Playwright/test artifact; reproducible by rerunning tests. |
| `dist/assets/vendor-language-opencc-Cf4OmlUd.js` | 1.07 MB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/vendor-maplibre-B8Vsyup-.js` | 1.00 MB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/App-Br2Z9pT8.js` | 788.7 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/PosTerminalPanel-DfzcY4nQ.js` | 402.8 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/vendor-qr-scanner-DXUPVkB1.js` | 366.4 KB | high | Vite build output; reproducible by npm run build. |
| `test-results/gis-validation/agid-boundary-validation.geojson` | 311.7 KB | high | Playwright/test artifact; reproducible by rerunning tests. |
| `dist/assets/vendor-language-pinyin-jsHMj9PS.js` | 295.1 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/vendor-react-XTG6k7GU.js` | 189.4 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/AddressRegistration-CE51c_xX.js` | 180.9 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/main-D1GY8oJP.css` | 166.9 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/vendor-misc-DUjBTFJo.js` | 156.6 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/languageSettings-CeURT9f_.js` | 120.2 KB | high | Vite build output; reproducible by npm run build. |
| `test-results/address-coverage-policy.json` | 119.0 KB | high | Playwright/test artifact; reproducible by rerunning tests. |
| `test-results/gis-validation/agid-boundary-validation.gdal.geojson` | 117.7 KB | high | Playwright/test artifact; reproducible by rerunning tests. |
| `dist/assets/vendor-language-detect-D09BXMfz.js` | 105.8 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/vendor-storage-1UdTP0pc.js` | 94.1 KB | high | Vite build output; reproducible by npm run build. |
| `dist/agid-logo.png` | 74.6 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/SettingsPanel-CAqcp7KO.js` | 67.7 KB | high | Vite build output; reproducible by npm run build. |
| `agid-dev.log` | 56.2 KB | high | Runtime log file. |
| `.codex-vite.err.log` | 56.2 KB | high | Runtime log file. |
| `.codex-vite.out.log` | 49.2 KB | high | Runtime log file. |
| `dist/assets/vendor-icons-DhLeZPJG.js` | 47.9 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/apiEndpoints-BGaezKrM.js` | 40.9 KB | high | Vite build output; reproducible by npm run build. |
| `test-results/gis-validation/gis-validation-report.json` | 29.8 KB | high | Playwright/test artifact; reproducible by rerunning tests. |
| `dist/assets/vendor-search-CKKXGazh.js` | 29.0 KB | high | Vite build output; reproducible by npm run build. |
| `scripts/__pycache__/build_english_paper_pdf.cpython-312.pyc` | 26.9 KB | high | Python bytecode cache. |
| `dist/agid-logo.jpg` | 21.6 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/AddressPortalScreen-D37F2puu.js` | 20.4 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/AddressDashboardScreen-BKxWPPGj.js` | 19.6 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/PostalCodeLab-DKx2U_nS.js` | 16.6 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/vendor-qr-display-D6VpEgjk.js` | 16.3 KB | high | Vite build output; reproducible by npm run build. |
| `dist/sw.js` | 15.9 KB | high | Vite build output; reproducible by npm run build. |
| `dist/workbox-9c191d2f.js` | 14.8 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/vendor-pmtiles-Dl7HeMrX.js` | 13.6 KB | high | Vite build output; reproducible by npm run build. |
| `dist/wasm/agid_core.wasm` | 12.5 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/RegistryViews-BqvcuS_3.js` | 12.4 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/SavedLocations-D3tcc2E8.js` | 11.4 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/GeoArchitectPanel-DhSsgk_E.js` | 8.03 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/embed-FEVdW8mE.js` | 6.80 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/main-Di8tcLwx.js` | 6.16 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/openSourceAddressResolutionStrategy-CbtPXB14.js` | 5.93 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/ES-UcZ_Aquf.js` | 5.48 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/PosAppScreen-DYBpUK2t.js` | 5.34 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/gridWorker-SmS8hwZt.js` | 5.04 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/CH-CEnaifq-.js` | 5.00 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/BA-LaqVCKhi.js` | 4.76 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/BE-Cy-pdcBH.js` | 4.69 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/LU-bQz5jh39.js` | 4.61 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/IN-D-Xd--ZH.js` | 4.25 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/ZA-BDcvjOWo.js` | 3.87 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/CN-oilA6V_y.js` | 3.78 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/EastAsiaService-CJhmxLmW.js` | 3.69 KB | high | Vite build output; reproducible by npm run build. |
| `.codex-pos-dev.log` | 3.58 KB | high | Runtime log file. |
| `dist/assets/MY-BzkuzJZk.js` | 3.54 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/FI-DXOfh4xC.js` | 3.52 KB | high | Vite build output; reproducible by npm run build. |
| `dev-server.out.log` | 3.42 KB | high | Runtime log file. |
| `dist/assets/QualityReportModal-T7bvsRkp.js` | 3.21 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/CA-CesKWCaC.js` | 3.20 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/CY-BhEPrzCq.js` | 3.16 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/MX-BUc8ShjZ.js` | 3.15 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/CL-vF2B9OVy.js` | 3.12 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/ResourcesSideMenu-BhC9EIfr.js` | 3.09 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/CO-D4JNVLfH.js` | 3.09 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/BR-CJwG6gnd.js` | 3.01 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/PH-K10NfMTK.js` | 2.95 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/embed-DdakJxzH.css` | 2.91 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/SG-C-LCB7Jr.js` | 2.89 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/SJ-D4MMw4s1.js` | 2.85 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/AR-COL50kiC.js` | 2.85 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/CR-BXg6YEOj.js` | 2.85 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/PR-BOScVqGI.js` | 2.83 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/EC-jO60M-16.js` | 2.83 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/UY-DR6ZldK_.js` | 2.82 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/TH-C2tDbcGk.js` | 2.80 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/GT-Dr2y78RX.js` | 2.80 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/DO-CmUKaGMc.js` | 2.79 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/NI-DLKwE75j.js` | 2.79 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/PE-CQhOMoyL.js` | 2.79 KB | high | Vite build output; reproducible by npm run build. |
| `dist/assets/NP-C27fzlvD.js` | 2.79 KB | high | Vite build output; reproducible by npm run build. |
| ... | ... | ... | 332 more entries omitted in the Markdown summary; see JSON report for the full list. |

## Generated Or Intermediate Review Candidates

These may be useful as visual evidence or editing intermediates. Keep them if you want an audit trail; otherwise archive or regenerate on demand.

| File | Size | Confidence | Reason |
|---|---:|---|---|
| `output/pdf/address-morphism-theory-ja.pdf` | 4.60 MB | medium | Older/generated PDF; keep only if it is a chosen deliverable or comparison baseline. |
| `output/pdf/address-morphism-theory-en.pdf` | 3.07 MB | medium | Older/generated PDF; keep only if it is a chosen deliverable or comparison baseline. |
| `output/pdf/address-morphism-theory-full-paper-en-v3.pdf` | 367.3 KB | medium | Older/generated PDF; keep only if it is a chosen deliverable or comparison baseline. |
| `output/pdf/address-morphism-theory-paper.pdf` | 228.9 KB | medium | Older/generated PDF; keep only if it is a chosen deliverable or comparison baseline. |
| `output/pdf/zk-address-predicate-paper-en-v1.pdf` | 215.3 KB | medium | Older/generated PDF; keep only if it is a chosen deliverable or comparison baseline. |
| `output/pdf/agid-aoid-application-paper-en-v1.pdf` | 182.5 KB | medium | Older/generated PDF; keep only if it is a chosen deliverable or comparison baseline. |

## Postal Archive Cache Candidates

These are compressed postal-code source archives. Prefer keeping normalized/extracted data and a source manifest; archive the zips unless they are required for provenance or offline reprocessing.

| File | Size | Confidence | Reason |
|---|---:|---|---|
| `data/postal_codes/FR.zip` | 633.0 KB | medium | Archive appears to have extracted text/CSV/JSON sibling data. |

## Document Archive Candidates

These are not app runtime inputs. They are evidence, drafts, verification notes, and addenda. They should usually be moved under an archive folder rather than deleted.

| File | Size | Confidence | Reason |
|---|---:|---|---|
| `docs/address-morphism-theory-paper-draft.md` | 116.2 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/unused-file-material-audit-2026-06-07.md` | 76.0 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-appendix-h-mathematical-catalog.md` | 53.1 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/address-morphism-theory-paper-professional-draft.md` | 50.5 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/address-morphism-theory-ja-v1-chapters-7-12.md` | 43.8 KB | review | Split manuscript segment; archive if master manuscript already supersedes it. |
| `docs/address-morphism-theory-ja-v1-chapters-1-6.md` | 42.0 KB | review | Split manuscript segment; archive if master manuscript already supersedes it. |
| `docs/address-morphism-theory-paper-professional-draft-ja.md` | 41.7 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/address-morphism-theory-ja-v1-chapters-13-18.md` | 36.9 KB | review | Split manuscript segment; archive if master manuscript already supersedes it. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapters-02-26-verification-bundles.md` | 30.3 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/address-morphism-theory-ja-v1-chapters-19-26.md` | 29.4 KB | review | Split manuscript segment; archive if master manuscript already supersedes it. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-08-verification.md` | 23.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/zk-address-proofs-and-address-morphism-theory-paper-draft.md` | 22.6 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/maintainability-refactor-audit.md` | 20.6 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-18-verification.md` | 20.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-09-verification.md` | 19.8 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-07-verification.md` | 19.1 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-16-verification.md` | 18.4 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-22-verification.md` | 18.3 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/agid-aoid-application-paper-draft.md` | 18.1 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-17-verification.md` | 18.1 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-24-verification.md` | 18.1 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-06-verification.md` | 17.9 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-08-edit-addendum.md` | 17.8 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-20-verification.md` | 17.2 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-21-verification.md` | 16.8 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-appendix-e-f-g-expanded.md` | 16.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-23-verification.md` | 16.4 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-19-verification.md` | 16.4 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-04-verification.md` | 16.3 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-15-verification.md` | 16.2 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-09-edit-addendum.md` | 15.9 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-05-verification.md` | 15.8 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-23-edit-addendum.md` | 15.8 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-13-verification.md` | 15.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-16-edit-addendum.md` | 15.3 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-11-verification.md` | 15.0 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-12-verification.md` | 14.7 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-14-verification.md` | 14.6 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-17-edit-addendum.md` | 14.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-15-edit-addendum.md` | 14.3 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-20-edit-addendum.md` | 14.2 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/address-morphism-theory-hypotheses-verification-matrix.md` | 14.1 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-07-edit-addendum.md` | 14.1 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-25-verification.md` | 14.1 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/address-morphism-verification-boundaries.md` | 13.9 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-11-edit-addendum.md` | 13.8 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-24-edit-addendum.md` | 13.7 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-18-edit-addendum.md` | 13.6 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-22-edit-addendum.md` | 13.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-03-verification.md` | 13.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-06-edit-addendum.md` | 13.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-21-edit-addendum.md` | 13.3 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/executable-unverified-verification-report-2026-06-07.md` | 13.1 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-13-edit-addendum.md` | 12.9 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-19-edit-addendum.md` | 12.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-10-verification.md` | 12.3 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-26-verification.md` | 12.3 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-12-edit-addendum.md` | 12.1 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-10-edit-addendum.md` | 11.6 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-04-edit-addendum.md` | 11.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-25-edit-addendum.md` | 11.5 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-cross-chapter-evidence-map.md` | 11.3 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-14-edit-addendum.md` | 11.2 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-05-edit-addendum.md` | 11.0 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/address-morphism-paper-expression-audit.md` | 10.7 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/address-morphism-expectation-verification-report.md` | 10.4 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-01-verification.md` | 10.3 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-appendix-a-b-edit-addendum.md` | 10.2 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/zk-address-theorem-evaluation.md` | 10.2 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-02-verification.md` | 10.1 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/address-entropy-evaluation.md` | 10.1 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-03-edit-addendum.md` | 9.92 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/code-writing-scan.md` | 9.90 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-appendix-a-b-verification.md` | 9.88 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/refactor-candidate-scan.md` | 9.51 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/address-relativity-principle-evaluation.md` | 9.04 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-appendix-c-d-verification.md` | 8.90 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-26-edit-addendum.md` | 8.71 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/address-morphism-paper-model-diagram-gap-audit.md` | 8.38 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-appendix-c-d-edit-addendum.md` | 8.26 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/address-equivalence-class-stability-evaluation.md` | 8.09 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-01-edit-addendum.md` | 7.69 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/chapter-verification/address-morphism-theory-ja-v1-chapter-02-edit-addendum.md` | 7.35 KB | review | Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs. |
| `docs/address-reference-conservation-law-evaluation.md` | 6.78 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/address-morphism-lean-gis-cross-verification.md` | 5.45 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/address-reference-impossibility-theorem-evaluation.md` | 5.38 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/address-verification-competitor-comparison.md` | 4.87 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |
| `docs/privacy-leakage-role-verification-ja.md` | 3.61 KB | review | Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input. |

## Code Review Candidates

These need human review before deletion. Static graph analysis cannot fully see variable dynamic imports, generated imports, CLI-only scripts, or intentionally manual scripts.

| File | Size | Confidence | Reason |
|---|---:|---|---|
| `src/data/address_formats/addressFormatRulesJson.test.ts` | 62.7 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/openApiSpec.test.ts` | 44.6 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressRegistrationAutomation.test.ts` | 44.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/microsoftServiceIntegration.ts` | 41.6 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/operations.ts` | 40.4 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/cloudServiceExpansion.ts` | 38.6 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/googleServiceIntegration.ts` | 38.6 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/governance.ts` | 38.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/languageTabs.test.ts` | 36.9 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/server/routes/coreRoutes.test.ts` | 36.7 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/multiCloudCompatibility.ts` | 36.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/lockerSystemOs.ts` | 35.8 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressConsentEnvelope.ts` | 34.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressAccessAuth.ts` | 34.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/deliveryOperationsIntelligence.ts` | 32.7 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/awsServiceIntegration.ts` | 32.0 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/consentPurposeScopeProof.ts` | 29.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/table.ts` | 27.9 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressEnglish.test.ts` | 26.5 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/callCertified.ts` | 25.7 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/deliveryReachabilityReport.ts` | 25.7 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/regionMembershipProof.ts` | 24.9 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/pidLifecycleProof.ts` | 24.7 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/securityPrivacyDesign.ts` | 24.7 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/droneOs.ts` | 24.6 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressOfflineSyncCrdt.ts` | 24.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/posAcceptance.test.ts` | 23.9 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/coscoInspiredOceanControlTower.ts` | 23.7 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `scripts/benchmark-agid-aoid-performance.tsx` | 23.6 KB | review | Script is not exposed through package.json and has little repository reference evidence. |
| `src/lib/addressPlatformBlueprint.ts` | 23.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/adobeServiceIntegration.ts` | 22.9 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressNotification.ts` | 22.5 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressSearchFederation.ts` | 22.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/qualityThresholdProof.ts` | 21.4 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/anonymousRateLimitProof.ts` | 21.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressEvidenceVault.ts` | 20.8 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `scripts/audit-unused-files.cjs` | 20.3 KB | review | Script is not exposed through package.json and has little repository reference evidence. |
| `src/lib/agidEuropeStress.test.ts` | 20.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressInternetProtocols.test.ts` | 20.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/spatialAddressIndex.ts` | 20.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/aoidOwnershipProof.ts` | 20.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/components/DronePlanningPanel.tsx` | 20.0 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidAsiaStress.test.ts` | 19.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/privacyLeakageRoleVerification.ts` | 19.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidAddressIntelligenceEngine.ts` | 19.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidAfricaStress.test.ts` | 19.0 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressMapQualityLayer.ts` | 18.7 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/pidIssuanceAudit.ts` | 18.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidLocalResolver.ts` | 18.0 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `scripts/build_english_paper_pdf.py` | 17.7 KB | review | Script is not exposed through package.json and has little repository reference evidence. |
| `src/lib/agidOceaniaStress.test.ts` | 16.9 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/mapFeatureAddress.test.ts` | 16.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/executableExpectations.ts` | 16.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/posOperationalControls.test.ts` | 15.8 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/shippingLabelQr.test.ts` | 15.3 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressRegistrationState.test.ts` | 14.6 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/transportModeRequirements.ts` | 14.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressVerificationBenchmark.ts` | 14.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `scripts/build_address_morphism_bilingual_pdfs.py` | 14.0 KB | review | Script is not exposed through package.json and has little repository reference evidence. |
| `src/components/AgidAddressElement.tsx` | 13.9 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidZkAddressProofs.test.ts` | 13.9 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `scripts/build_address_morphism_full_pdfs.cjs` | 13.8 KB | review | Script is not exposed through package.json and has little repository reference evidence. |
| `src/lib/agidPolarStress.test.ts` | 13.5 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidLatinAmericaCaribbeanStress.test.ts` | 13.3 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidIndianOceanStress.test.ts` | 13.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressTabQuality.test.ts` | 12.8 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressResolutionSystem.test.ts` | 12.7 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/server/routes/addressConnectTerminalRoutes.test.ts` | 12.6 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidNorthAmericaStress.test.ts` | 12.5 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressDuplicateNullifier.ts` | 12.4 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `scripts/build_address_morphism_pdf.py` | 12.4 KB | review | Script is not exposed through package.json and has little repository reference evidence. |
| `src/lib/agidInlandCoastalSeaStress.test.ts` | 12.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidPacificStress.test.ts` | 12.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/microsoftServiceIntegration.test.ts` | 12.2 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressLanguageSpheres.ts` | 12.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidTerritoryAutonomousStress.test.ts` | 12.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/data/spaceAgencyOpenGeoSources.ts` | 12.0 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidAtlanticStress.test.ts` | 11.9 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/naturalAddress.test.ts` | 11.9 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/server/routes/posTerminalRoutes.test.ts` | 11.8 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/apiEndpoints.test.ts` | 11.6 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/privacyLeakageRoleVerification.test.ts` | 11.5 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/cloudDbIntegration.test.ts` | 11.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/carrierLabelIntent.test.ts` | 10.6 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/gridGeometry.test.ts` | 10.5 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/regionMembershipProof.test.ts` | 10.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/agidZkAddressProofs.ts` | 10.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/zkProofCompatibility.test.ts` | 10.1 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/pidLifecycleProof.test.ts` | 10.0 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressCredential.test.ts` | 9.80 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/aoid/records.ts` | 9.69 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/anonymousRateLimitProof.test.ts` | 9.46 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressMorphism.test.ts` | 9.39 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressRadar.test.ts` | 9.32 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/privateAddressPredicateProof.test.ts` | 9.29 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/server/routes/fullZkEthereumModeRoutes.test.ts` | 9.12 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/aoid.test.ts` | 8.99 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressConsentEnvelope.test.ts` | 8.96 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressVerificationEngine.test.ts` | 8.92 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/consentPurposeScopeProof.test.ts` | 8.73 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressCredentialFreshnessProof.test.ts` | 8.72 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/credentialIssuerTrustRegistry.test.ts` | 8.61 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/aoidOwnershipProof.test.ts` | 8.54 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/server/routes/ethereumRegistryOnlyModeRoutes.test.ts` | 8.35 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressTranslationRouteCore.test.ts` | 8.33 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/awsServiceIntegration.test.ts` | 8.31 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressDuplicateNullifier.test.ts` | 8.21 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/governance.test.ts` | 8.02 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressAccessAuth.test.ts` | 7.92 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/lockerSystemOs.test.ts` | 7.92 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/operations.test.ts` | 7.91 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/App.gridUi.test.ts` | 7.67 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/pidIssuanceAudit.test.ts` | 7.64 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/languageSettings.test.ts` | 7.64 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/zkProofBundleRegistry.test.ts` | 7.55 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/deliveryOperationsIntelligence.test.ts` | 7.48 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/coscoInspiredOceanControlTower.test.ts` | 7.44 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/googleServiceIntegration.test.ts` | 7.33 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/federatedResolver.test.ts` | 7.25 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| `src/lib/addressMapQualityLayer.test.ts` | 7.22 KB | review | Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal. |
| ... | ... | ... | 248 more entries omitted in the Markdown summary; see JSON report for the full list. |

## Keep List

Do not remove these classes during the first cleanup pass:

- `src/**` files reached by the static app/server graph.
- `public/agid-logo.png`, `public/agid-logo.jpg`, and `public/pwa-icon.svg`, because PWA config references them.
- `data/address_formats/**`, `data/countries/**`, `data/gis/**`, and normalized postal text/JSON datasets unless a manifest proves they are superseded.
- Final manuscript PDFs: `output/pdf/address-morphism-theory-full-ja.pdf` and `output/pdf/address-morphism-theory-full-en.pdf`.
- Chapter verification notes until the final paper has absorbed their claims and citations.
- SDK output directories if the package is intended to publish SDKs.

## Recommended Cleanup Sequence

1. Delete or archive high-confidence generated artifacts: `dist/**`, `tmp/**`, `*.pyc`, and runtime logs.
2. Move document evidence into `docs/archive/2026-06-verification/` instead of deleting it.
3. Keep final PDFs and remove only paired HTML/PNG previews after the PDF is visually accepted.
4. Replace postal ZIP caches with a source manifest once extracted/normalized data is verified.
5. Fix the duplicated static/dynamic service imports and rerun `npm run build`.
6. Review the code candidates manually, then remove only after build and app smoke tests still pass.

## Method Notes

The static graph starts from `index.html`, `embed.html`, `server.ts`, `vite.config.ts`, and scripts declared in `package.json`. It follows static imports, dynamic imports with literal strings, re-exports, and `new URL(..., import.meta.url)`. It intentionally does not treat heuristic misses as automatic deletion authority.
