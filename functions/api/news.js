// ============================================================================
// /api/news — Cloudflare Pages Function
// ============================================================================
// Live news with a three-tier provider chain — ALWAYS returns something:
//   1. NEWS_API_KEY  → NewsData.io  (200 credits/day free)
//   2. GNEWS_API_KEY → GNews        (100 req/day free)
//   3. No keys       → public RSS   (TechCrunch + The Guardian Tech + ET Markets)
// ============================================================================

function rssParse(xml, source) {
  const items = [];
  const blocks = xml.split(/<item[\s>]/).slice(1, 8);
  for (const b of blocks) {
    const pick = (tag) => {
      const m = b.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "i"));
      if (!m) return "";
      return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim();
    };
    const title = pick("title");
    const link = pick("link") || (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || "";
    if (!title) continue;
    items.push({
      title,
      description: pick("description").slice(0, 180),
      link,
      source,
      image: (b.match(/<media:content[^>]*url="([^"]+)"/i) || b.match(/<enclosure[^>]*url="([^"]+)"/i) || [])[1] || null,
      pubDate: pick("pubDate"),
    });
  }
  return items;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "startup OR SaaS OR venture capital").slice(0, 100);

  // ---- Tier 1: NewsData.io ----
  if (env.NEWS_API_KEY) {
    try {
      const apiUrl = new URL("https://newsdata.io/api/1/latest");
      apiUrl.searchParams.set("apikey", env.NEWS_API_KEY);
      apiUrl.searchParams.set("q", q);
      apiUrl.searchParams.set("language", "en");
      apiUrl.searchParams.set("category", "technology,business");
      apiUrl.searchParams.set("size", "10");
      const resp = await fetch(apiUrl.toString());
      if (resp.ok) {
        const data = await resp.json();
        const articles = (data.results || []).map((a) => ({
          title: a.title, description: a.description, link: a.link,
          source: a.source_id || a.source_name, image: a.image_url || null, pubDate: a.pubDate,
        }));
        if (articles.length) return Response.json({ articles, provider: "newsdata" }, { headers: corsHeaders });
      }
    } catch {}
  }

  // ---- Tier 2: GNews ----
  if (env.GNEWS_API_KEY) {
    try {
      const gUrl = "https://gnews.io/api/v4/search?q=" + encodeURIComponent(q) + "&lang=en&max=10&apikey=" + env.GNEWS_API_KEY;
      const resp = await fetch(gUrl);
      if (resp.ok) {
        const data = await resp.json();
        const articles = (data.articles || []).map((a) => ({
          title: a.title, description: a.description, link: a.url,
          source: a.source?.name, image: a.image || null, pubDate: a.publishedAt,
        }));
        if (articles.length) return Response.json({ articles, provider: "gnews" }, { headers: corsHeaders });
      }
    } catch {}
  }

  // ---- Tier 3: keyless RSS fallback ----
  const feeds = [
    ["https://rss.app/feeds/t0OACOhXK7aZClCj.xml", "Curated"],
    ["https://techcrunch.com/feed/", "TechCrunch"],
    ["https://www.theguardian.com/uk/technology/rss", "The Guardian"],
    ["https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", "Economic Times"],
  ];
  const all = [];
  await Promise.all(feeds.map(async ([feedUrl, name]) => {
    try {
      const r = await fetch(feedUrl, { headers: { "User-Agent": "GenCopilot/1.0" } });
      if (r.ok) all.push(...rssParse(await r.text(), name));
    } catch {}
  }));
  // interleave sources
  all.sort(() => 0.5 - Math.random());
  return Response.json(
    { articles: all.slice(0, 9), provider: "rss" },
    { headers: { ...corsHeaders, "Cache-Control": "public, max-age=600" } }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Max-Age": "86400" },
  });
}
