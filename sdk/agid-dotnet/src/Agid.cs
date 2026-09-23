namespace Agid;

public static class Agid
{
    public const string Base32Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    public const int PrefixLength = 2;
    public const int HashLength = 10;
    public const int TotalLength = 12;

    public static AgidResult Encode(double lat, double lon)
    {
        throw new NotImplementedException("wire this package to the AGID reference implementation");
    }

    public static AgidResult? Decode(string id)
    {
        return null;
    }

    public static AgidBounds CellBounds(string id)
    {
        throw new NotImplementedException("wire this package to the AGID reference implementation");
    }
}

public sealed record AgidResult(string Id, double Lat, double Lon, int? Face);
public sealed record AgidBounds(double MinLat, double MaxLat, double MinLon, double MaxLon);
