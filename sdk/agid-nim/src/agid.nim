const
  base32Alphabet* = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
  prefixLength* = 2
  hashLength* = 10
  totalLength* = 12

type
  AgidResult* = object
    id*: string
    lat*: float
    lon*: float
    face*: int

  AgidBounds* = object
    minLat*: float
    maxLat*: float
    minLon*: float
    maxLon*: float

proc encode*(lat: float, lon: float): AgidResult =
  raise newException(CatchableError, "wire this package to the AGID reference implementation")

proc decode*(id: string): AgidResult =
  raise newException(CatchableError, "not implemented")

proc cellBounds*(id: string): AgidBounds =
  raise newException(CatchableError, "wire this package to the AGID reference implementation")
