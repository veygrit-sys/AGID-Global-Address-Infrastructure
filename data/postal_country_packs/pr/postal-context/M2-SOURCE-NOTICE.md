# PR M2 source notice

Observed on 2026-09-02. Raw receipts are excluded from Git and accepted only
at the SHA-256 values hard-coded by the reproducible builder.

## Postal-system evidence and rights boundary

USPS Publication 28 (October 2024) documents Puerto Rico address structure,
including the urbanization line and the literal `PR` state abbreviation.
PostalPro's current Area/District ZIP receipt identifies the 006–009 prefix
range, but its July 2026 license restricts copying, modification and
distribution. It is retained only as out-of-Git review evidence; zero USPS
licensed rows or derivative geometry are published.

## Derived display geometry

The committed geometry is the coordinate-preserving public-use 2020 Census ZCTA layer
returned from current TIGERweb layer 1. The U.S. Census Bureau describes a
ZCTA as an approximate areal representation of USPS ZIP service areas and
states that not all valid ZIP Codes have a ZCTA. Census attribution is retained;
the cited Census policy assigns conclusions drawn from this reuse to AGID.

- fixed GeoJSON SHA-256: `0438e99e895e732299d76ba85c2d7a0727a22ffa79f5ea886d1317ba13c20d31`
- layer metadata SHA-256: `49a543f4dab89a79318cea1362edfc8fbb855527060a23c82d0f230c6ecf7655`
- ZCTA guidance SHA-256: `77c4e4fe231f15c90bab31efcc745dd4427c5f33f31b279978d6ba814443b9a6`
- Census citation/rights SHA-256: `49545cc525bf00a275b482069134a08f866cbe29f5800b44d3f2567c63bbc46f`

All 132 features, 142 polygon parts, 152 closed rings and 168,582 positions
pass Turf, JSTS and shared topology validation without coordinate changes.
The displayed scope is therefore complete for the fixed 2020 Census ZCTA
query, but it does not claim a complete current USPS assignment denominator.
