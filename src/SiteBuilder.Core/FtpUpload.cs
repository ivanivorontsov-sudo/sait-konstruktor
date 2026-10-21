using System.Net;
namespace SiteBuilder.Core;

/// <summary>Простая загрузка сайта на хостинг по FTP/FTPS (создаёт папки, перезаписывает файлы).</summary>
public static class FtpUpload
{
    public static async Task<int> Upload(IEnumerable<SiteFile> files, string host, int port, string user, string pass, string remoteDir, bool ssl, IProgress<string> log = null)
    {
        host = host.Trim().Replace("ftp://", "").TrimEnd('/');
        var baseUri = $"ftp://{host}:{port}/{(remoteDir ?? "").Trim('/')}";
        var cred = new NetworkCredential(user, pass);
        var made = new HashSet<string>();
        int n = 0;
        foreach (var f in files)
        {
            var parts = f.Path.Split('/');
            var dir = baseUri;
            for (int i = 0; i < parts.Length - 1; i++)
            {
                dir += "/" + Uri.EscapeDataString(parts[i]);
                if (made.Add(dir)) try { using var _ = (FtpWebResponse)await Req(dir, WebRequestMethods.Ftp.MakeDirectory, cred, ssl).GetResponseAsync(); } catch (WebException) { }
            }
            if (made.Add(baseUri) && !string.IsNullOrEmpty(remoteDir?.Trim('/'))) { }
            var r = Req(baseUri + "/" + string.Join('/', parts.Select(Uri.EscapeDataString)), WebRequestMethods.Ftp.UploadFile, cred, ssl);
            r.ContentLength = f.Data.Length;
            using (var s = await r.GetRequestStreamAsync()) await s.WriteAsync(f.Data);
            using (var resp = (FtpWebResponse)await r.GetResponseAsync()) { }
            n++; log?.Report(f.Path);
        }
        return n;
    }
    static FtpWebRequest Req(string uri, string method, NetworkCredential c, bool ssl)
    {
        var r = (FtpWebRequest)WebRequest.Create(uri);
        r.Method = method; r.Credentials = c; r.EnableSsl = ssl; r.UsePassive = true; r.UseBinary = true; r.KeepAlive = true; r.Timeout = 30000;
        return r;
    }
}
