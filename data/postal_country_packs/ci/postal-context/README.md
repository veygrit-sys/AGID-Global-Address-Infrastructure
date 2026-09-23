# Côte d'Ivoire Postal Context contract

This metadata-only contract records primary evidence that CI currently does not require postal codes. It contains no raw UPU or ARTCI bodies, real customer addresses, people or production geometry.

The country quality gate rejects arbitrary digits, UPU two-digit office codes (`06`, `17`), the `104` home-delivery indicator, BP delivery objects, post offices, routes, administrative areas, points, buffers, generated cells, AGID cells, neighbouring-country assignments and model output as CI postcodes or postal surfaces. OpenStreetMap may provide separately attributed place, address, building or administrative context. Hugging Face/libpostal may be evaluated for parsing only; neither is postal authority.

The real application may show a source-qualified Abidjan result and an independent CI AGID ID. It must keep the postal API unsupported and show no postal overlay. A future competent-authority assignment register, compatible rights and exact Polygon/MultiPolygon release are required before M2.
