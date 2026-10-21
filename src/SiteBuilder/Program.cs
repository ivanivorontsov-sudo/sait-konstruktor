using System.Reflection;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using SiteBuilder.Core;
namespace SiteBuilder;

static class Program
{
    [STAThread] static void Main(string[] args) { ApplicationConfiguration.Initialize(); Application.Run(new MainForm(args.FirstOrDefault())); }
}

class MainForm : Form
{
    readonly WebView2 web = new() { Dock = DockStyle.Fill };
    readonly WebView2 ai = new() { Dock = DockStyle.Fill };
    readonly SplitContainer split = new() { Dock = DockStyle.Fill, Panel2Collapsed = true, SplitterWidth = 6 };
    static readonly Dictionary<string, string> Sites = new()
    {
        ["deepseek"] = "https://chat.deepseek.com/", ["gigachat"] = "https://giga.chat/", ["qwen"] = "https://chat.qwen.ai/",
        ["claude"] = "https://claude.ai/new", ["grok"] = "https://grok.com/"
    };
    readonly string dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SiteBuilder");
    readonly string openArg; string aiSite = ""; string lastExportDir;
    CoreWebView2 cw;

    public MainForm(string open)
    {
        openArg = open;
        Text = "СайтКонструктор — визуальный конструктор сайтов"; Width = 1440; Height = 900; StartPosition = FormStartPosition.CenterScreen; WindowState = FormWindowState.Maximized;
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        split.Panel1.Controls.Add(web); split.Panel2.Controls.Add(ai); Controls.Add(split);
        Load += async (_, _) => await Init();
    }

    async Task Init()
    {
        try
        {
            Directory.CreateDirectory(dataDir);
            var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(dataDir, "webview"),
                new CoreWebView2EnvironmentOptions("--disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows"));
            await web.EnsureCoreWebView2Async(env); await ai.EnsureCoreWebView2Async(env);
        }
        catch (Exception ex)
        {
            MessageBox.Show("Не найден компонент Microsoft Edge WebView2 Runtime.\nУстановите его: https://go.microsoft.com/fwlink/p/?LinkId=2124703\n\n" + ex.Message, "СайтКонструктор");
            Close(); return;
        }
        cw = web.CoreWebView2;
        cw.Settings.AreDevToolsEnabled = true; cw.Settings.IsStatusBarEnabled = false;
        cw.AddWebResourceRequestedFilter("https://app.local/*", CoreWebView2WebResourceContext.All);
        cw.WebResourceRequested += (s, e) =>
        {
            var name = Uri.UnescapeDataString(new Uri(e.Request.Uri).AbsolutePath.TrimStart('/')); if (name == "") name = "index.html";
            var asm = Assembly.GetExecutingAssembly();
            var st = asm.GetManifestResourceStream("web/" + name) ?? asm.GetManifestResourceStream("web/" + name.Replace('/', '\\'));
            if (st == null) { e.Response = cw.Environment.CreateWebResourceResponse(null, 404, "Not found", ""); return; }
            var ext = Path.GetExtension(name).ToLowerInvariant();
            var mime = ext switch { ".js" => "text/javascript", ".css" => "text/css", ".json" => "application/json", ".png" => "image/png", ".svg" => "image/svg+xml", ".ico" => "image/x-icon", _ => "text/html" };
            e.Response = cw.Environment.CreateWebResourceResponse(st, 200, "OK", "Content-Type: " + mime + "; charset=utf-8");
        };
        cw.NewWindowRequested += (s, e) => { e.Handled = true; OpenUrl(e.Uri); };
        cw.NavigationStarting += (s, e) => { if (!e.Uri.StartsWith("https://app.local") && !e.Uri.StartsWith("about:") && !e.Uri.StartsWith("data:")) { e.Cancel = true; OpenUrl(e.Uri); } };
        cw.WebMessageReceived += async (s, e) =>
        {
            JsonElement r; try { r = JsonDocument.Parse(e.WebMessageAsJson).RootElement; } catch { return; }
            var cmd = Str(r, "cmd"); var id = Str(r, "id");
            try { await Handle(cmd, id, r); }
            catch (Exception ex) { Reply(id, new { ok = false, error = ex.Message }); }
        };
        ai.CoreWebView2.NewWindowRequested += (s, e) => { e.Handled = true; ai.CoreWebView2.Navigate(e.Uri); };
        FormClosing += (s, e) => { try { cw.ExecuteScriptAsync("autosave()"); } catch { } };
        cw.Navigate("https://app.local/index.html");
    }

    static string Str(JsonElement r, string k) => r.TryGetProperty(k, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;
    void Reply(string id, object data)
    {
        var d = JsonSerializer.SerializeToElement(data);
        var dict = new Dictionary<string, object> { ["type"] = "hostReply", ["id"] = id };
        foreach (var p in d.EnumerateObject()) dict[p.Name] = p.Value;
        cw.PostWebMessageAsJson(JsonSerializer.Serialize(dict));
    }
    void Post(object o) { try { cw?.PostWebMessageAsJson(JsonSerializer.Serialize(o)); } catch { } }
    void Log(string t) => Post(new { type = "aiLog", t = DateTime.Now.ToString("HH:mm:ss") + " " + t });

    async Task Handle(string cmd, string id, JsonElement r)
    {
        switch (cmd)
        {
            case "ready":
                if (!string.IsNullOrEmpty(openArg) && File.Exists(openArg))
                    await cw.ExecuteScriptAsync("loadProject(" + File.ReadAllText(openArg) + ");S.file=" + JsonSerializer.Serialize(openArg) + ";toast('Открыт проект')");
                Reply(id, new { ok = true }); break;
            case "saveProject":
            {
                var path = Str(r, "path");
                if (string.IsNullOrEmpty(path))
                {
                    using var d = new SaveFileDialog { FileName = Str(r, "name"), Filter = "Проект СайтКонструктора|*.sitebuilder.json|JSON|*.json", DefaultExt = "json" };
                    if (d.ShowDialog(this) != DialogResult.OK) { Reply(id, new { ok = false }); return; }
                    path = d.FileName;
                }
                File.WriteAllText(path, Str(r, "json")); Reply(id, new { ok = true, path }); break;
            }
            case "openProject":
            {
                using var d = new OpenFileDialog { Filter = "Проект СайтКонструктора|*.sitebuilder.json;*.json" };
                if (d.ShowDialog(this) != DialogResult.OK) { Reply(id, new { ok = false }); return; }
                Reply(id, new { ok = true, path = d.FileName, json = File.ReadAllText(d.FileName) }); break;
            }
            case "exportFolder":
            {
                var files = SiteWriter.Parse(r.GetProperty("files"));
                using var d = new FolderBrowserDialog { Description = "Папка для сайта (её содержимое загружается на хостинг)", UseDescriptionForTitle = true, ShowNewFolderButton = true, SelectedPath = lastExportDir ?? Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) };
                if (d.ShowDialog(this) != DialogResult.OK) { Reply(id, new { ok = false }); return; }
                var dir = d.SelectedPath;
                if (Directory.EnumerateFileSystemEntries(dir).Any() && !File.Exists(Path.Combine(dir, ".sitebuilder-files")))
                {
                    var sub = Path.Combine(dir, Str(r, "name") ?? "site");
                    if (MessageBox.Show(this, "Папка не пустая. Создать в ней подпапку «" + Path.GetFileName(sub) + "»?\n\n«Нет» — записать прямо в выбранную папку.", "Экспорт", MessageBoxButtons.YesNo) == DialogResult.Yes) dir = sub;
                }
                var n = SiteWriter.WriteFolder(files, dir); lastExportDir = d.SelectedPath;
                Reply(id, new { ok = true, path = dir, count = n });
                try { System.Diagnostics.Process.Start("explorer.exe", "\"" + dir + "\""); } catch { }
                break;
            }
            case "exportZip":
            {
                var files = SiteWriter.Parse(r.GetProperty("files"));
                using var d = new SaveFileDialog { FileName = Str(r, "name"), Filter = "ZIP-архив|*.zip", DefaultExt = "zip" };
                if (d.ShowDialog(this) != DialogResult.OK) { Reply(id, new { ok = false }); return; }
                SiteWriter.WriteZip(files, d.FileName); Reply(id, new { ok = true, path = d.FileName }); break;
            }
            case "preview":
            {
                var dir = Path.Combine(Path.GetTempPath(), "SiteBuilderPreview");
                SiteWriter.WriteFolder(SiteWriter.Parse(r.GetProperty("files")), dir);
                OpenUrl(new Uri(Path.Combine(dir, "index.html")).AbsoluteUri); Reply(id, new { ok = true }); break;
            }
            case "ftp":
            {
                var files = SiteWriter.Parse(r.GetProperty("files"));
                var n = await FtpUpload.Upload(files, Str(r, "h"), r.GetProperty("p").GetInt32(), Str(r, "u"), Str(r, "pass"), Str(r, "d"), r.GetProperty("s").GetBoolean());
                Reply(id, new { ok = true, count = n }); break;
            }
            case "aiToggle": { var p = Str(r, "provider"); SetPanel(split.Panel2Collapsed); if (!split.Panel2Collapsed && Sites.TryGetValue(p ?? "", out var u) && aiSite != p) { aiSite = p; ai.CoreWebView2.Navigate(u); } break; }
            case "aiShow": { var p = Str(r, "provider"); SetPanel(true); if (Sites.TryGetValue(p ?? "", out var u) && aiSite != p) { aiSite = p; ai.CoreWebView2.Navigate(u); } break; }
            case "aiHide": SetPanel(false); break;
            case "aiCancel": cts?.Cancel(); break;
            case "aiAsk":
            {
                var p = Str(r, "provider"); var prompt = Str(r, "prompt"); string reply;
                try { reply = p.StartsWith("api-") ? await Ai.Ask(p, r.GetProperty("settings"), prompt) : await AskWeb(p, prompt); }
                catch (OperationCanceledException) { reply = "[ИИ] Запрос отменён"; }
                catch (Exception ex) { reply = "[Ошибка ИИ] " + ex.Message; Log("Ошибка: " + ex.Message); }
                Post(new { type = "aiReply", id, reply }); break;
            }
            case "aiGrab":
            {
                string reply; try { reply = await Grab(); } catch (Exception ex) { reply = "[ИИ] Не удалось забрать ответ: " + ex.Message; }
                Post(new { type = "aiReply", id, reply }); break;
            }
        }
    }

    void SetPanel(bool open)
    {
        split.Panel2Collapsed = !open;
        if (open) try { split.SplitterDistance = Math.Max(400, (int)(split.Width * 0.6)); } catch { }
    }

    // Веб-чат: вставить промпт, отправить, дождаться окончания генерации, забрать последний ответ (capture.js из ПрокурорПлюс)
    CancellationTokenSource cts; static string captureJs;
    async Task<string> Js(string expr)
    {
        captureJs ??= new StreamReader(Assembly.GetExecutingAssembly().GetManifestResourceStream("web/capture.js")!).ReadToEnd();
        await ai.CoreWebView2.ExecuteScriptAsync(captureJs);
        return await ai.CoreWebView2.ExecuteScriptAsync(expr);
    }
    static string JStr(string json) { try { return JsonSerializer.Deserialize<string>(json) ?? ""; } catch { return json; } }
    async Task<string> Grab() { var g = JStr(await Js("window.__pp.grab()")); using var d = JsonDocument.Parse(g); return d.RootElement.GetProperty("text").GetString(); }
    async Task<string> AskWeb(string p, string prompt)
    {
        if (!Sites.ContainsKey(p ?? "")) throw new Exception("Неизвестный веб-чат: " + p);
        cts?.Cancel(); cts = new CancellationTokenSource(); var ct = cts.Token;
        if (aiSite != p) { SetPanel(true); aiSite = p; Log("Открываю " + Sites[p]); ai.CoreWebView2.Navigate(Sites[p]); await Task.Delay(7000, ct); }
        for (int i = 0; i < 15 && JStr(await ai.CoreWebView2.ExecuteScriptAsync("document.readyState")) != "complete"; i++) await Task.Delay(1000, ct);
        Log("Сайт: " + ai.CoreWebView2.Source);
        Log("Подготовка: " + JStr(await Js("window.__pp.mark(" + JsonSerializer.Serialize(prompt) + ")")));
        var res = JStr(await Js("window.__pp.send(" + JsonSerializer.Serialize(prompt) + ")")); Log("Отправка: " + res);
        if (res == "noinput") { SetPanel(true); return "[ИИ] Не найдено поле ввода. Войдите в аккаунт в окне чата справа и повторите."; }
        await Task.Delay(2000, ct);
        if (JStr(await Js("String(window.__pp.pending())")) == "true") { Log("Текст остался в поле — нажимаю кнопку: " + JStr(await Js("window.__pp.clickLast()"))); await Task.Delay(1500, ct); }
        string last = ""; int stable = 0;
        for (int i = 0; i < 300; i++)
        {
            await Task.Delay(1000, ct);
            using var d = JsonDocument.Parse(JStr(await Js("window.__pp.poll()")));
            var t = d.RootElement.GetProperty("text").GetString() ?? ""; var busy = d.RootElement.GetProperty("busy").GetBoolean();
            if (t.Length > 0 && t == last) stable++; else stable = 0;
            if (i % 5 == 0) Log($"Опрос {i}с: символов {t.Length}, генерация {(busy ? "идёт" : "нет")}, метод {d.RootElement.GetProperty("method").GetString()}");
            last = t;
            if (t.Length > 0 && ((!busy && stable >= 3) || stable >= 12)) { Log("Ответ получен (" + t.Length + " симв.)"); return t; }
        }
        return last.Length > 0 ? last : "[ИИ] Ответ не получен за 5 минут. Нажмите «Забрать ответ из чата» или вставьте вручную.";
    }
    static void OpenUrl(string u)
    {
        if (u.StartsWith("https://") || u.StartsWith("http://") || u.StartsWith("file:///"))
            try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(u) { UseShellExecute = true }); } catch { }
    }
}
