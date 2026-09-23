# Mozambique Postal Context seed

This directory is the metadata-only seed for a future `agid-postal-mz` country repository.

It implements the current eight-digit `NNNNN-NNN` CEP contract from Decreto n.º 74/2024 and keeps it separate from the superseded 2019 six-digit CEP, the historical four-digit Correios directory, administrative geometry, addresses, buildings, cadastre, personal data and AGID cells.

No upstream rows, current assignments, production geometry, real addresses or personal data are bundled. The fixtures are synthetic conformance material and cannot satisfy a production promotion gate.

Production ingestion must pin the exact INCM decree/table edition and digest, retain all eight digits and validity, reconcile the current CORRE universal-operator context, and independently prove any administrative crosswalk or address-to-building relation.
