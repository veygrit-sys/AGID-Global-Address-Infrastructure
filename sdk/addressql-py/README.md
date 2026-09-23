# AddressQL Python SDK v0.4

Local-first Python SDK for AddressQL research notebooks, source-pack checks, and
benchmark corpus preparation.

```python
from addressql import postal_validate, delivery_available

postal_validate("1000001", "JP")
delivery_available("HK", "", "synthetic_carrier")
```

This package uses synthetic fixtures only and does not call production APIs.
