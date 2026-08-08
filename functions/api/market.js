// ============================================================================
// /api/market — Cloudflare Pages Function
// ============================================================================
// Live financial data. Works with ZERO API keys out of the box:
//   • FX rates    → frankfurter.app   (free, no key)
//   • Crypto      → CoinGecko public  (free, no key)
// Optional (set in Cloudflare env for stock quotes):
//   • FINNHUB_KEY → finnhub.io quotes for symbols (?symbols=AAPL,MSFT)
// ============================================================================

export async function onRequestGet(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  const url = new URL(request.url);
  const base = (url.searchParams.get("base") || "USD").toUpperCase();
  const symbols = (url.searchParams.get("symbols") || "").toUpperCase().split(",").filter(Boolean).slice(0, 6);

  const out = { fx: null, crypto: null, stocks: null, asOf: new Date().toISOString() };

  // --- FX (keyless) ---
  try {
    const r = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=INR,EUR,GBP,JPY`);
    if (r.ok) {
      const d = await r.json();
      out.fx = { base: d.base, date: d.date, rates: d.rates };
    }
  } catch {}

  // --- Crypto (keyless; COINGECKO_KEY raises rate limits if set) ---
  try {
    let cgUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true";
    if (env.COINGECKO_KEY) cgUrl += "&x_cg_demo_api_key=" + encodeURIComponent(env.COINGECKO_KEY);
    const r = await fetch(cgUrl, {
      headers: { "Accept": "application/json" },
    });
    if (r.ok) {
      const d = await r.json();
      out.crypto = [
        { symbol: "BTC", price: d.bitcoin?.usd, change24h: d.bitcoin?.usd_24h_change },
        { symbol: "ETH", price: d.ethereum?.usd, change24h: d.ethereum?.usd_24h_change },
        { symbol: "SOL", price: d.solana?.usd, change24h: d.solana?.usd_24h_change },
      ].filter((c) => c.price != null);
    }
  } catch {}

  // --- Stocks (optional: FMP_KEY from financialmodelingprep.com, or FINNHUB_KEY) ---
  const symbolList = symbols.length ? symbols : ["AAPL", "MSFT", "NVDA"];
  const fmp = env.FMP_KEY;
  const finnhub = env.FINNHUB_KEY;

  if (fmp) {
    try {
      const r = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbolList.join(",")}?apikey=${fmp}`);
      if (r.ok) {
        const arr = await r.json();
        if (Array.isArray(arr) && arr.length) {
          out.stocks = arr.map((q) => ({ symbol: q.symbol, price: q.price, changePct: q.changesPercentage }));
        }
      }
    } catch {}
  }

  if (!out.stocks && finnhub && symbols.length) {
    try {
      const quotes = await Promise.all(symbols.map(async (sym) => {
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${finnhub}`);
        if (!r.ok) return null;
        const q = await r.json();
        if (!q.c) return null;
        return { symbol: sym, price: q.c, changePct: q.dp };
      }));
      out.stocks = quotes.filter(Boolean);
    } catch {}
  }

  return Response.json(out, { headers: { ...corsHeaders, "Cache-Control": "public, max-age=120" } });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Max-Age": "86400" },
  });
}
