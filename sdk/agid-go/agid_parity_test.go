// Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
package agid

import (
	"math"
	"testing"
)

type parityVector struct {
	name string
	lat float64
	lon float64
	id string
	decodedLat float64
	decodedLon float64
	minLat float64
	maxLat float64
	minLon float64
	maxLon float64
}

var PARITY_VECTORS = []parityVector{
	{"Tokyo Station", 35.681236, 139.767125, "JP05AV8TJGHD", 35.68121961131576, 139.76712226867676, 35.68121961131576, 35.68127755465351, 139.76712226867676, 139.767165184021},
	{"Null Island", 0, 0, "3B0200000000", 0, 0, 0, 0.00004291534423828125, 0, 0.00004291534423828125},
	{"New York City", 40.7128, -74.006, "US0ECWVG02V9", 40.712787854519725, -74.00600910186768, 40.71278177280159, 40.712830550646764, -74.00600910186768, -74.00596618652344},
}

func close(t *testing.T, actual float64, expected float64) {
	if math.Abs(actual-expected) >= 0.000001 {
		t.Fatalf("expected %f, got %f", expected, actual)
	}
}

func TestEncodeDecodeCellBoundsParity(t *testing.T) {
	for _, v := range PARITY_VECTORS {
		encoded, err := Encode(v.lat, v.lon)
		if err != nil { t.Fatal(err) }
		if encoded.ID != v.id { t.Fatalf("%s encode mismatch: %s", v.name, encoded.ID) }
		decoded, err := Decode(v.id)
		if err != nil { t.Fatal(err) }
		close(t, decoded.Lat, v.decodedLat)
		close(t, decoded.Lon, v.decodedLon)
		bounds, err := CellBounds(v.id)
		if err != nil { t.Fatal(err) }
		close(t, bounds.MinLat, v.minLat)
		close(t, bounds.MaxLat, v.maxLat)
		close(t, bounds.MinLon, v.minLon)
		close(t, bounds.MaxLon, v.maxLon)
	}
}
