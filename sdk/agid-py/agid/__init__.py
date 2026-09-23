BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
AGID_PREFIX_LENGTH = 2
AGID_HASH_LENGTH = 10
AGID_TOTAL_LENGTH = 12

def encode(lat: float, lon: float):
    raise NotImplementedError("wire this package to the AGID reference implementation")

def decode(agid: str):
    return None

def cell_bounds(agid: str):
    raise NotImplementedError("wire this package to the AGID reference implementation")
