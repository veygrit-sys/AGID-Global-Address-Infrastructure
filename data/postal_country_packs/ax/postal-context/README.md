# `agid-postal-ax` contract seed

Status: `M1 metadata / current assignment and statistical-area evidence verified; publication and real app path missing`

Posti PCF `20260829` contains 37 current `22xxx` Åland records: 33 normal
and four P.O.-box records. Statistics Finland Paavo `pno_2026` contains 32
valid postcode Polygon/MultiPolygon features. The 32 feature codes exactly
match 32 PCF normal records. The five remaining codes (four P.O. boxes and
the `22110` postal terminal) receive no invented area.

Paavo areas are official-derived statistical postal-code areas generalized
from building address postcodes. They are not Åland Post delivery perimeters.
The coastline-clipped `pno_2026` variant is selected; the sea-extended variant
is not silently substituted.

M2 still requires an approved immutable transformed artifact and verification
through the actual AX loader, API and application. Search must fit the real
area and render translucent fill plus a clear outline with geometry authority,
source, basis date and confidence. Non-area codes must explain why no polygon
exists. House numbers and buildings require separate permitted relations.

Raw PCF, HTML, XML, PDF and GeoJSON bodies remain outside Git.
