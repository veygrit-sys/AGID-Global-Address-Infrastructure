# Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
from agid import cell_bounds, decode, encode

PARITY_VECTORS = [
  {
    "name": "Tokyo Station",
    "lat": 35.681236,
    "lon": 139.767125,
    "expected": {
      "id": "JP05AV8TJGHD",
      "prefix": "JP",
      "hash": "05AV8TJGHD",
      "face": 1,
      "qx": 111082,
      "qy": 2056297,
      "decoded": {
        "lat": 35.68121961131576,
        "lon": 139.76712226867676
      },
      "cellBounds": {
        "minLat": 35.68121961131576,
        "maxLat": 35.68127755465351,
        "minLon": 139.76712226867676,
        "maxLon": 139.767165184021
      }
    }
  },
  {
    "name": "Null Island",
    "lat": 0,
    "lon": 0,
    "expected": {
      "id": "3B0200000000",
      "prefix": "3B",
      "hash": "0200000000",
      "face": 0,
      "qx": 1048576,
      "qy": 1048576,
      "decoded": {
        "lat": 0,
        "lon": 0
      },
      "cellBounds": {
        "minLat": 0,
        "maxLat": 0.00004291534423828125,
        "minLon": 0,
        "maxLon": 0.00004291534423828125
      }
    }
  },
  {
    "name": "New York City",
    "lat": 40.7128,
    "lon": -74.006,
    "expected": {
      "id": "US0ECWVG02V9",
      "prefix": "US",
      "hash": "0ECWVG02V9",
      "face": 3,
      "qx": 1421263,
      "qy": 2023382,
      "decoded": {
        "lat": 40.712787854519725,
        "lon": -74.00600910186768
      },
      "cellBounds": {
        "minLat": 40.71278177280159,
        "maxLat": 40.712830550646764,
        "minLon": -74.00600910186768,
        "maxLon": -74.00596618652344
      }
    }
  }
]
EPS = 0.000001

def close(actual, expected):
    assert abs(actual - expected) < EPS

def test_encode_decode_cellBounds_match_spec():
    for vector in PARITY_VECTORS:
        assert encode(vector["lat"], vector["lon"])["id"] == vector["expected"]["id"]
        decoded = decode(vector["expected"]["id"])
        close(decoded["lat"], vector["expected"]["decoded"]["lat"])
        close(decoded["lon"], vector["expected"]["decoded"]["lon"])
        bounds = cell_bounds(vector["expected"]["id"])
        close(bounds["minLat"], vector["expected"]["cellBounds"]["minLat"])
        close(bounds["maxLat"], vector["expected"]["cellBounds"]["maxLat"])
        close(bounds["minLon"], vector["expected"]["cellBounds"]["minLon"])
        close(bounds["maxLon"], vector["expected"]["cellBounds"]["maxLon"])
