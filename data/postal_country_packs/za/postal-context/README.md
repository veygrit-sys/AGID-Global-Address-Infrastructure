# South Africa Postal Context seed

This directory is the metadata-only seed for the `agid-postal-za` country repository.

South Africa uses four-digit postcodes, but their meaning depends on the delivery type. A physical-address code identifies a delivery locality; rural, PO Box and Private Bag codes identify a delivery post office. The South African Post Office publishes downloadable domestic-code Excel and text artifacts, while its website terms limit ordinary copying to personal, non-commercial use. No SAPO rows are bundled here and production ingestion therefore requires an exact file digest, capture time, delivery-type interpretation and written reuse authority suitable for the intended deployment.

Postal assignments, post-office points, official or derived postal surfaces, municipal and statistical boundaries, civic-address points, cadastral parcels, building features, private holders and AGID cells remain separate evidence layers. A parcel, office point, locality, ward, nearest feature or model surface never becomes a canonical postcode polygon or exact address-linked building without explicit authority.

The included fixtures are synthetic conformance data only. They contain no current SAPO rows, real addresses, production geometry, holders, recipients, residents, owners, correspondence or query history and cannot satisfy a production promotion gate.
