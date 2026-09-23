// Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
package org.agid;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class AgidParityTest {
  @Test
  void encodeDecodeCellBoundsMatchSpec() {
    AgidResult encoded = Agid.encode(35.681236, 139.767125);
    assertEquals("JP05AV8TJGHD", encoded.id());
    AgidResult decoded = Agid.decode("JP05AV8TJGHD");
    assertNotNull(decoded);
    assertEquals(35.68121961131576, decoded.lat(), 0.000001);
    assertEquals(139.76712226867676, decoded.lon(), 0.000001);
    AgidBounds bounds = Agid.cellBounds("JP05AV8TJGHD");
    assertEquals(35.68121961131576, bounds.minLat(), 0.000001);
    assertEquals(35.68127755465351, bounds.maxLat(), 0.000001);
    assertEquals(139.76712226867676, bounds.minLon(), 0.000001);
    assertEquals(139.767165184021, bounds.maxLon(), 0.000001);
  }
}
