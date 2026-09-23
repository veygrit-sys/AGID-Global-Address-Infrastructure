# PR Postal Context

This pack exposes 132 Puerto Rico 2020 Census ZIP Code Tabulation Areas
(ZCTAs) through the shared Postal Context API and map UI.

ZCTAs are derived statistical display contexts approximating USPS ZIP service
areas; they are not official USPS postal, delivery, legal, survey or cadastral
boundaries, and not every valid ZIP has a ZCTA. Each result exposes stable
postal, geometry, assertion, country and release IDs plus 2020 population,
housing, land-area and water-area attributes in its label.

No USPS licensed row, address, building, parcel, deliverability, recipient,
customer or land-right record is published. Rebuild from fixed out-of-Git
receipts:

```powershell
node scripts/build-postal-context-pr-m2.mjs .m2-sources-pr data/postal_country_packs/pr/postal-context/m2 reports/postal-context-m2/pr-current-zcta-2026-09-02.json
```
