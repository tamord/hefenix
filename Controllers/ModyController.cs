using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace hef1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ModyController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public ModyController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        // GET: api/<ModyController>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value3", "value4" };
        }

        // GET api/<ModyController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<ModyController>
        [HttpPost]
        public void Post([FromBody] string value)
        {
        }

        // PUT api/<ModyController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<ModyController>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }

        // GET api/<ModyController>/search?query=KEYWORD
        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<IActionResult> SearchRepositories([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("Query parameter 'query' is required.");
            }

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.UserAgent.Clear();
            httpClient.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("hef1-app", "1.0"));
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

            var requestUrl = $"https://api.github.com/search/repositories?q={Uri.EscapeDataString(query)}";

            using var response = await httpClient.GetAsync(requestUrl);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, content);
            }

            return Content(content, "application/json");
        }

        private const string BookmarksSessionKey = "bookmarks";

        private List<JsonElement> GetBookmarksFromSession()
        {
            var json = HttpContext.Session.GetString(BookmarksSessionKey);
            if (string.IsNullOrEmpty(json))
            {
                return new List<JsonElement>();
            }
            try
            {
                return JsonSerializer.Deserialize<List<JsonElement>>(json) ?? new List<JsonElement>();
            }
            catch
            {
                return new List<JsonElement>();
            }
        }

        private void SaveBookmarksToSession(List<JsonElement> bookmarks)
        {
            var json = JsonSerializer.Serialize(bookmarks);
            HttpContext.Session.SetString(BookmarksSessionKey, json);
        }

        // GET api/<ModyController>/bookmarks
        [Authorize]
        [HttpGet("bookmarks")]
        public IActionResult GetBookmarks()
        {
            var bookmarks = GetBookmarksFromSession();
            return Ok(bookmarks);
        }

        // POST api/<ModyController>/bookmarks
        [Authorize]
        [HttpPost("bookmarks")]
        public IActionResult AddBookmark([FromBody] JsonElement repo)
        {
            // Expect the full GitHub repo object; use its id for uniqueness
            if (!repo.TryGetProperty("id", out var idProp) || idProp.ValueKind != JsonValueKind.Number)
            {
                return BadRequest("Repository object must include numeric 'id'.");
            }

            var id = idProp.GetInt64();
            var bookmarks = GetBookmarksFromSession();

            // Remove any existing with same id then add
            bookmarks.RemoveAll(b => b.TryGetProperty("id", out var bid) && bid.ValueKind == JsonValueKind.Number && bid.GetInt64() == id);
            bookmarks.Add(repo);
            SaveBookmarksToSession(bookmarks);
            return Ok(new { success = true });
        }

        // DELETE api/<ModyController>/bookmarks/{id}
        [Authorize]
        public IActionResult RemoveBookmark(long id)
        {
            var bookmarks = GetBookmarksFromSession();
            var removed = bookmarks.RemoveAll(b => b.TryGetProperty("id", out var bid) && bid.ValueKind == JsonValueKind.Number && bid.GetInt64() == id);
            SaveBookmarksToSession(bookmarks);
            return Ok(new { success = true, removed });
        }
    }
}
