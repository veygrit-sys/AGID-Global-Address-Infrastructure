package org.agid;

public final class Agid {
  public static final String BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  public static final int PREFIX_LENGTH = 2;
  public static final int HASH_LENGTH = 10;
  public static final int TOTAL_LENGTH = 12;

  private Agid() {}

  public static AgidResult encode(double lat, double lon) {
    throw new UnsupportedOperationException("wire this package to the AGID reference implementation");
  }

  public static AgidResult decode(String id) {
    return null;
  }

  public static AgidBounds cellBounds(String id) {
    throw new UnsupportedOperationException("wire this package to the AGID reference implementation");
  }
}
