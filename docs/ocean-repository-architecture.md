# AGID Ocean Repository Architecture

AGID should not keep every ocean, sea, bay, gulf, and strait in one giant repository. Marine geography changes slowly, but names, boundaries, adjacent countries, islands, EEZ relationships, and shipping-use contexts vary by sea area. A layered repository design is easier to review and maintain.

## Repository Hierarchy

```text
agid-ocean
  agid-pacific
  agid-atlantic
  agid-indian
  agid-arctic
  agid-southern
```

Each ocean repository owns sea-area child repositories such as:

```text
agid-pacific-philippine-sea
agid-pacific-east-china-sea
agid-pacific-south-china-sea
agid-pacific-sea-of-japan
agid-pacific-bering-sea
agid-pacific-coral-sea
agid-pacific-tasman-sea

agid-atlantic-caribbean-sea
agid-atlantic-gulf-of-mexico
agid-atlantic-north-sea
agid-atlantic-baltic-sea
agid-atlantic-mediterranean-sea
```

The generated placement currently creates 5 ocean repositories and about 160 sea-area repositories from the existing AGID sea dataset.

## Data Stored Per Sea Area

Each sea-area repository can store:

- AGID
- multilingual sea-area names
- latitude/longitude boundary or bbox
- adjacent sea areas
- adjacent countries and islands
- optional EEZ relationship notes
- strait, bay, gulf, inlet, and port connections
- source metadata and confidence

This is enough for address morphism to support:

```text
address -> port -> sea area -> ocean
```

It also supports non-postal fallback references such as:

```text
sea name + bounded latitude/longitude region
```

## Mountains, Deserts, Rivers, And Lakes

Mountains, deserts, rivers, and lakes should not become independent repositories by default. They should live in country or region natural-feature packs with:

- name
- feature type
- bbox or centroid
- source
- confidence

This avoids thousands of tiny repositories while still allowing named natural features to be searchable and address-like when no civic or postal address exists.
