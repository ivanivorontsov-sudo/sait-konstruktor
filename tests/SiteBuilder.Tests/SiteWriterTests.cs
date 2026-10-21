using System.IO.Compression;
using System.Text;
using System.Text.Json;
using SiteBuilder.Core;
using Xunit;

public class SiteWriterTests
{
    static JsonElement J(string s) => JsonDocument.Parse(s).RootElement;
    const string Files = """{"index.html":{"text":"<h1>Привет</h1>"},"css/theme.css":{"text":"body{}"},"assets/a.png":{"b64":"iVBORw0KGgo="}}""";
    static string Tmp() { var d = Path.Combine(Path.GetTempPath(), "sbt-" + Guid.NewGuid().ToString("N")); Directory.CreateDirectory(d); return d; }

    [Fact] public void ParsesTextAndBinary()
    {
        var l = SiteWriter.Parse(J(Files));
        Assert.Equal(3, l.Count);
        Assert.Equal("<h1>Привет</h1>", Encoding.UTF8.GetString(l.First(f => f.Path == "index.html").Data));
        Assert.Equal(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }, l.First(f => f.Path == "assets/a.png").Data);
    }
    [Theory]
    [InlineData("../evil.html")] [InlineData("/etc/passwd")] [InlineData("C:/x.html")] [InlineData("a/../../b")] [InlineData("con.html")] [InlineData("a?.html")] [InlineData("")]
    public void RejectsUnsafePaths(string p) => Assert.Throws<InvalidDataException>(() => SiteWriter.SafePath(p));
    [Fact] public void NormalizesBackslashes() => Assert.Equal("css/a.css", SiteWriter.SafePath("css\\a.css"));
    [Fact] public void RequiresIndex() => Assert.Throws<InvalidDataException>(() => SiteWriter.Parse(J("""{"a.html":{"text":"x"}}""")));
    [Fact] public void WritesFolderUtf8WithoutBom()
    {
        var d = Tmp(); var n = SiteWriter.WriteFolder(SiteWriter.Parse(J(Files)), d);
        Assert.Equal(3, n);
        var bytes = File.ReadAllBytes(Path.Combine(d, "index.html"));
        Assert.NotEqual(0xEF, bytes[0]);
        Assert.Equal("<h1>Привет</h1>", Encoding.UTF8.GetString(bytes));
        Assert.True(File.Exists(Path.Combine(d, "css", "theme.css")));
        Assert.Equal(8, new FileInfo(Path.Combine(d, "assets", "a.png")).Length);
    }
    [Fact] public void ReExportRemovesOnlyOwnStaleFiles()
    {
        var d = Tmp();
        SiteWriter.WriteFolder(SiteWriter.Parse(J("""{"index.html":{"text":"1"},"old.html":{"text":"o"}}""")), d);
        File.WriteAllText(Path.Combine(d, "user-file.txt"), "мой файл");
        SiteWriter.WriteFolder(SiteWriter.Parse(J("""{"index.html":{"text":"2"}}""")), d);
        Assert.False(File.Exists(Path.Combine(d, "old.html")));
        Assert.True(File.Exists(Path.Combine(d, "user-file.txt")));
        Assert.Equal("2", File.ReadAllText(Path.Combine(d, "index.html")));
    }
    [Fact] public void WritesZipWithForwardSlashes()
    {
        var z = Path.Combine(Tmp(), "site.zip");
        SiteWriter.WriteZip(SiteWriter.Parse(J(Files)), z);
        using var a = ZipFile.OpenRead(z);
        Assert.Equal(new[] { "assets/a.png", "css/theme.css", "index.html" }, a.Entries.Select(e => e.FullName).OrderBy(x => x));
        using var r = new StreamReader(a.GetEntry("index.html")!.Open());
        Assert.Equal("<h1>Привет</h1>", r.ReadToEnd());
    }
    [Fact] public void ZipOverwritesExisting()
    {
        var z = Path.Combine(Tmp(), "s.zip"); File.WriteAllText(z, "garbage");
        SiteWriter.WriteZip(SiteWriter.Parse(J(Files)), z);
        using var a = ZipFile.OpenRead(z); Assert.Equal(3, a.Entries.Count);
    }
}
