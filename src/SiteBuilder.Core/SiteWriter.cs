using System.IO.Compression;
using System.Text;
using System.Text.Json;
namespace SiteBuilder.Core;

/// <summary>Файл сайта: текст (UTF-8) или двоичные данные в base64.</summary>
public record SiteFile(string Path, byte[] Data);

public static class SiteWriter
{
    /// <summary>Разбор объекта {"путь":{"text":"…"}|{"b64":"…"}} из редактора; пути проверяются.</summary>
    public static List<SiteFile> Parse(JsonElement files)
    {
        var list = new List<SiteFile>();
        foreach (var p in files.EnumerateObject())
        {
            var path = SafePath(p.Name);
            byte[] data = p.Value.TryGetProperty("b64", out var b) ? Convert.FromBase64String(b.GetString() ?? "")
                : Encoding.UTF8.GetBytes(p.Value.TryGetProperty("text", out var t) ? t.GetString() ?? "" : "");
            list.Add(new SiteFile(path, data));
        }
        if (!list.Any(f => f.Path == "index.html")) throw new InvalidDataException("В сайте нет index.html");
        return list;
    }

    /// <summary>Относительный путь без "..", дисков, абсолютных путей и запрещённых символов Windows.</summary>
    public static string SafePath(string p)
    {
        if (string.IsNullOrWhiteSpace(p)) throw new InvalidDataException("Пустое имя файла");
        var parts = p.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (p.StartsWith("/") || p.StartsWith("\\") || p.Contains(':') || parts.Length == 0) throw new InvalidDataException("Недопустимый путь: " + p);
        var bad = new[] { '<', '>', '"', '|', '?', '*' };
        foreach (var s in parts)
        {
            if (s == "." || s == ".." || s.IndexOfAny(bad) >= 0 || s.Any(char.IsControl) || s.EndsWith(".") || s.EndsWith(" "))
                throw new InvalidDataException("Недопустимый путь: " + p);
            var stem = s.Split('.')[0].ToUpperInvariant();
            if (new[] { "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "LPT1", "LPT2" }.Contains(stem)) throw new InvalidDataException("Зарезервированное имя: " + s);
        }
        return string.Join('/', parts);
    }

    /// <summary>Записывает сайт в папку. Если cleanOld — удаляет файлы прошлого экспорта (по манифесту), чужие файлы не трогает.</summary>
    public static int WriteFolder(IEnumerable<SiteFile> files, string dir, bool cleanOld = true)
    {
        var root = Path.GetFullPath(dir); Directory.CreateDirectory(root);
        var manifest = Path.Combine(root, ".sitebuilder-files");
        var list = files.ToList();
        if (cleanOld && File.Exists(manifest))
            foreach (var old in File.ReadAllLines(manifest))
            {
                if (list.Any(f => f.Path == old)) continue;
                try { var fp = Full(root, SafePath(old)); if (File.Exists(fp)) File.Delete(fp); } catch { }
            }
        foreach (var f in list)
        {
            var fp = Full(root, f.Path);
            Directory.CreateDirectory(Path.GetDirectoryName(fp)!);
            File.WriteAllBytes(fp, f.Data);
        }
        File.WriteAllLines(manifest, list.Select(f => f.Path));
        try { File.SetAttributes(manifest, FileAttributes.Hidden); } catch { }
        return list.Count;
    }

    static string Full(string root, string rel)
    {
        var fp = Path.GetFullPath(Path.Combine(root, rel.Replace('/', Path.DirectorySeparatorChar)));
        if (!fp.StartsWith(root.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("Путь вне папки сайта: " + rel);
        return fp;
    }

    public static void WriteZip(IEnumerable<SiteFile> files, string zipPath)
    {
        var tmp = zipPath + ".tmp";
        using (var fs = File.Create(tmp))
        using (var z = new ZipArchive(fs, ZipArchiveMode.Create))
            foreach (var f in files)
            {
                var e = z.CreateEntry(f.Path, CompressionLevel.Optimal);
                using var s = e.Open(); s.Write(f.Data);
            }
        File.Move(tmp, zipPath, true);
    }
}
