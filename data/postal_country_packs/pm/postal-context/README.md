# PM Postal Context

This country pack publishes the one current Saint Pierre and Miquelon
postcode `97500` through the shared AGID Postal Context runtime.

The La Poste dictionary supplies the official postcode-to-commune ID
crosswalk. The displayed MultiPolygon is the coordinate-preserving
concatenation of the current geo.api.gouv.fr administrative contours for
INSEE `97501` and `97502`; it is `derived`, not an official postal boundary.

The lookup exposes stable postal, commune, evidence-assertion and release
IDs. It does not publish or infer addresses, buildings, parcels,
deliverability, recipients, customers or land rights.

Rebuild from exact out-of-Git receipts:

```powershell
node scripts/build-postal-context-pm-m2.mjs .m2-sources-pm data/postal_country_packs/pm/postal-context/m2 reports/postal-context-m2/pm-current-single-postcode-2026-09-01.json
```

With the isolated application running and the PM descriptor enabled, repeat
the browser path and evidence capture with:

```powershell
node scripts/verify-postal-context-pm-browser.mjs http://127.0.0.1:3010 reports/postal-context-m2
```

The verifier uses a deterministic PM geocoder-result fixture because the
public Nominatim proxy returned no `97500` hit at evidence time. It never
intercepts the Postal Context API, geometry, MapLibre rendering, or fit path.
