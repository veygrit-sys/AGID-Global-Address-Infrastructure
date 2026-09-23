// Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
using Xunit;

namespace Agid.Tests;

public sealed class AgidParityTests
{
    [Fact]
    public void EncodeDecodeCellBoundsMatchSpec()
    {
        var encoded = Agid.Encode(35.681236, 139.767125);
        Assert.Equal("JP05AV8TJGHD", encoded.Id);
        var decoded = Agid.Decode("JP05AV8TJGHD");
        Assert.NotNull(decoded);
        Assert.Equal(35.68121961131576, decoded!.Lat, 6);
        Assert.Equal(139.76712226867676, decoded.Lon, 6);
        var bounds = Agid.CellBounds("JP05AV8TJGHD");
        Assert.Equal(35.68121961131576, bounds.MinLat, 6);
        Assert.Equal(35.68127755465351, bounds.MaxLat, 6);
        Assert.Equal(139.76712226867676, bounds.MinLon, 6);
        Assert.Equal(139.767165184021, bounds.MaxLon, 6);
    }
}
