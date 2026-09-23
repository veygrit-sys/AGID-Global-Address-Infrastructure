// Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
package org.agid

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class AgidParityTest {
    @Test
    fun encodeDecodeCellBoundsMatchSpec() {
        val encoded = encode(35.681236, 139.767125)
        assertEquals("JP05AV8TJGHD", encoded.id)
        val decoded = assertNotNull(decode("JP05AV8TJGHD"))
        assertEquals(35.68121961131576, decoded.lat, 0.000001)
        assertEquals(139.76712226867676, decoded.lon, 0.000001)
        val bounds = cellBounds("JP05AV8TJGHD")
        assertEquals(35.68121961131576, bounds.minLat, 0.000001)
        assertEquals(35.68127755465351, bounds.maxLat, 0.000001)
        assertEquals(139.76712226867676, bounds.minLon, 0.000001)
        assertEquals(139.767165184021, bounds.maxLon, 0.000001)
    }
}
