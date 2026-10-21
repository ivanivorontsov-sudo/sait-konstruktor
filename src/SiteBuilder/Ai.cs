using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
namespace SiteBuilder;

/// <summary>API-модели: GigaChat (Сбер), DeepSeek, YandexGPT, любой OpenAI-совместимый. Настройки приходят из редактора.</summary>
static class Ai
{
    const string Sys = "Ты — веб-дизайнер и редактор сайта в конструкторе. Отвечай строго в запрошенном JSON-формате, по-русски, без выдуманных фактов.";
    static readonly HttpClient Plain = new() { Timeout = TimeSpan.FromSeconds(180) };
    static HttpClient _giga; static bool _gigaTrust; static string _tok; static DateTime _exp; static string _keyUsed;
    static string S(JsonElement s, string k, string d = "") => s.ValueKind == JsonValueKind.Object && s.TryGetProperty(k, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : d;
    static bool B(JsonElement s, string k) => s.ValueKind == JsonValueKind.Object && s.TryGetProperty(k, out var v) && v.ValueKind == JsonValueKind.True;

    public static Task<string> Ask(string provider, JsonElement s, string prompt) => provider switch
    {
        "api-gigachat" => Giga(s, prompt),
        "api-deepseek" => OpenAi("https://api.deepseek.com", S(s, "dsKey"), S(s, "dsModel", "deepseek-chat"), prompt, "DeepSeek"),
        "api-yandex" => Yandex(s, prompt),
        _ => OpenAi(S(s, "oaBase", "https://api.openai.com/v1"), S(s, "oaKey"), S(s, "oaModel", "gpt-4o-mini"), prompt, "OpenAI-совместимого API", true),
    };
    static JsonArray Msgs(string prompt, string key = "content") => new() { new JsonObject { ["role"] = "system", [key] = Sys }, new JsonObject { ["role"] = "user", [key] = prompt } };
    static async Task<JsonNode> Post(HttpClient c, string url, JsonNode body, Action<HttpRequestHeaders> hdr)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, url) { Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json") };
        hdr(req.Headers);
        using var r = await c.SendAsync(req); var t = await r.Content.ReadAsStringAsync();
        if (!r.IsSuccessStatusCode) throw new Exception($"HTTP {(int)r.StatusCode}: {(t.Length > 300 ? t[..300] : t)}");
        return JsonNode.Parse(t);
    }
    static async Task<string> OpenAi(string baseUrl, string key, string model, string prompt, string name, bool keyOptional = false)
    {
        if (string.IsNullOrWhiteSpace(key) && !keyOptional) throw new Exception($"Не задан API-ключ {name} (ИИ → Настройки).");
        var url = baseUrl.TrimEnd('/'); if (!url.EndsWith("/chat/completions")) url += "/chat/completions";
        var j = await Post(Plain, url, new JsonObject { ["model"] = model, ["messages"] = Msgs(prompt), ["temperature"] = 0.4 }, h => { if (!string.IsNullOrWhiteSpace(key)) h.Authorization = new("Bearer", key.Trim()); });
        return j?["choices"]?[0]?["message"]?["content"]?.GetValue<string>() ?? "";
    }
    static async Task<string> Giga(JsonElement s, string prompt)
    {
        var key = S(s, "gigaKey"); if (string.IsNullOrWhiteSpace(key)) throw new Exception("Не задан Authorization key GigaChat (developers.sber.ru → GigaChat API). Вставьте его в ИИ → Настройки.");
        var trust = B(s, "gigaTrust");
        if (_giga == null || _gigaTrust != trust) { var h = new HttpClientHandler(); if (trust) h.ServerCertificateCustomValidationCallback = (_, _, _, _) => true; _giga = new HttpClient(h) { Timeout = TimeSpan.FromSeconds(180) }; _gigaTrust = trust; _tok = null; }
        try
        {
            if (_tok == null || DateTime.UtcNow > _exp || _keyUsed != key)
            {
                using var req = new HttpRequestMessage(HttpMethod.Post, "https://ngw.devices.sberbank.ru:9443/api/v2/oauth") { Content = new FormUrlEncodedContent(new Dictionary<string, string> { ["scope"] = S(s, "gigaScope", "GIGACHAT_API_PERS") }) };
                req.Headers.Authorization = new("Basic", key.Trim().Replace("Basic ", "")); req.Headers.Add("RqUID", Guid.NewGuid().ToString()); req.Headers.Accept.ParseAdd("application/json");
                using var r = await _giga.SendAsync(req); var t = await r.Content.ReadAsStringAsync();
                if (!r.IsSuccessStatusCode) throw new Exception($"Авторизация GigaChat: HTTP {(int)r.StatusCode}: {t}");
                _tok = JsonNode.Parse(t)!["access_token"]!.GetValue<string>(); _exp = DateTime.UtcNow.AddMinutes(25); _keyUsed = key;
            }
            var j = await Post(_giga, "https://gigachat.devices.sberbank.ru/api/v1/chat/completions", new JsonObject { ["model"] = S(s, "gigaModel", "GigaChat"), ["messages"] = Msgs(prompt), ["temperature"] = 0.4 }, h => h.Authorization = new("Bearer", _tok));
            return j?["choices"]?[0]?["message"]?["content"]?.GetValue<string>() ?? "";
        }
        catch (HttpRequestException e) when (e.InnerException is System.Security.Authentication.AuthenticationException || e.Message.Contains("SSL"))
        { throw new Exception("Ошибка сертификата GigaChat. Установите корневой сертификат НУЦ Минцифры (gosuslugi.ru/crt) или включите «Не проверять сертификат»."); }
    }
    static async Task<string> Yandex(JsonElement s, string prompt)
    {
        var key = S(s, "yaKey"); var folder = S(s, "yaFolder");
        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(folder)) throw new Exception("Для YandexGPT нужны API-ключ сервисного аккаунта и ID каталога Yandex Cloud.");
        var body = new JsonObject { ["modelUri"] = $"gpt://{folder.Trim()}/{S(s, "yaModel", "yandexgpt-lite/latest").Trim()}", ["completionOptions"] = new JsonObject { ["stream"] = false, ["temperature"] = 0.4, ["maxTokens"] = "8000" }, ["messages"] = Msgs(prompt, "text") };
        var j = await Post(Plain, "https://llm.api.cloud.yandex.net/foundationModels/v1/completion", body, h => { h.Authorization = new("Api-Key", key.Trim()); h.Add("x-folder-id", folder.Trim()); });
        return j?["result"]?["alternatives"]?[0]?["message"]?["text"]?.GetValue<string>() ?? "";
    }
}
