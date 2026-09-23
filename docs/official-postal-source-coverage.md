# Official Postal Source Coverage

Generated: 2026-07-26T15:10:24.935Z

Verdict: **all AGID country/region address-format profiles have a postal source status, but country-specific official postal evidence is still incomplete.**

This report checks local AGID address-format profiles and registered postal/open-source metadata. It does not prove that every real postal code in the world exists in the repository, and it does not run live API probes unless `verify-postal-sources --live` is executed separately.

## Summary

- Address-format profiles checked: 283
- Missing official source status: 0
- Profiles using global official fallback: 62
- Profiles missing country-specific official evidence: 62

## By Status

| Status | Count |
| --- | --- |
| authoritative | 36 |
| official | 215 |
| official-derived | 0 |
| open-reference | 0 |
| community | 0 |
| needs-official-source | 0 |
| no-normal-postcode | 32 |

## By Continent

| Continent | Count |
| --- | --- |
| africa | 64 |
| americas | 65 |
| asia | 55 |
| europe | 70 |
| oceania | 24 |
| antarctica | 4 |
| special | 1 |

## Missing Official Source Status

- None

## Profiles Using Global Official Fallback

- africa: `EH`, `SLND`, `ER`, `LS`, `SZ`, `GW`
- americas: `BZ`, `GT`, `HN`, `NI`, `PA`, `SV`, `CL-EA`, `CL-JF`, `FK`, `PE`, `PY`, `UY`, `VE`
- asia: `AZ`, `GE`, `KG`, `TJ`, `TM`, `CN`, `KP`, `MN`, `IQ`, `IR`, `JO`, `AF`, `KH`, `LA`, `MM`
- europe: `CRIM`, `DONB`, `PMR`, `TRNC`, `BG`, `BY`, `MD`, `MK`, `RO`, `RU`, `UA`, `AX`, `IS`, `LT`, `LV`, `XD`, `XU`, `AD`, `AL`, `BA`, `CY`, `GR`, `ME`, `RS`, `SM`, `VA`, `XK`, `MC`
- oceania: None
- antarctica: None
- special: `EH`

## Missing Country-Specific Official Evidence

- africa: `EH`, `SLND`, `ER`, `LS`, `SZ`, `GW`
- americas: `BZ`, `GT`, `HN`, `NI`, `PA`, `SV`, `CL-EA`, `CL-JF`, `FK`, `PE`, `PY`, `UY`, `VE`
- asia: `AZ`, `GE`, `KG`, `TJ`, `TM`, `CN`, `KP`, `MN`, `IQ`, `IR`, `JO`, `AF`, `KH`, `LA`, `MM`
- europe: `CRIM`, `DONB`, `PMR`, `TRNC`, `BG`, `BY`, `MD`, `MK`, `RO`, `RU`, `UA`, `AX`, `IS`, `LT`, `LV`, `XD`, `XU`, `AD`, `AL`, `BA`, `CY`, `GR`, `ME`, `RS`, `SM`, `VA`, `XK`, `MC`
- oceania: None
- antarctica: None
- special: `EH`

## Safe Interpretation

- `authoritative` and `official` mean the profile is linked to strong source evidence in the local metadata.
- `no-normal-postcode` means ordinary postcode proof should not be required; AGID/geospatial/postal-equivalent checks are safer.
- Global fallback evidence is useful for baseline validation, but it is not a substitute for a national postal operator, official government postcode API, or official bulk postcode dataset.
- This report is a source/readiness audit, not a complete postal-code database audit.

## Next Gates

- Add country-specific official postal operator or government source for each fallback country.
- Add source version, update cadence, and license metadata for every postal source.
- Run live probes only in a controlled network job, because some official APIs are credentialed, rate-limited, or block automated probes.
- Separate format validation, existence validation, address-to-postcode matching, postal-equivalent fallback, and carrier-deliverability checks.
