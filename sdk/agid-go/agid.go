package agid

const Base32Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const PrefixLength = 2
const HashLength = 10
const TotalLength = 12

type Result struct {
	ID   string
	Lat  float64
	Lon  float64
	Face int
}

type Bounds struct {
	MinLat float64
	MaxLat float64
	MinLon float64
	MaxLon float64
}

func Encode(lat float64, lon float64) (Result, error) {
	return Result{}, ErrNotImplemented
}

func Decode(id string) (Result, error) {
	return Result{}, ErrNotImplemented
}

func CellBounds(id string) (Bounds, error) {
	return Bounds{}, ErrNotImplemented
}
