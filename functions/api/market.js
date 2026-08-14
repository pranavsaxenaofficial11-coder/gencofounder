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
    } else {
      // Usually 429: the keyless tier rate-limits hard. Without this line the
      // response is just `crypto: null` and the cause is invisible.
      console.error("[market] CoinGecko HTTP " + r.status + (env.COINGECKO_KEY ? " (with key)" : " (keyless)"));
    }
  } catch (e) {
    console.error("[market] CoinGecko failed:", e?.message || e);
  }

  // --- Stocks (optional: FMP_KEY from financialmodelingprep.com, or FINNHUB_KEY) ---
  const symbolList = symbols.length ? symbols : ["AAPL", "MSFT", "NVDA"];
  const fmp = env.FMP_KEY;
  const finnhub = env.FINNHUB_KEY;

  if (fmp) {
    try {
      // One request per symbol, deliberately. FMP retired /api/v3/quote on
      // 2025-08-31 (it now returns a "Legacy Endpoint" error), and on the
      // replacement /stable/quote a comma-separated symbol list is a premium
      // feature that 402s on the free tier. Note the field rename too:
      // /stable returns changePercentage, legacy returned changesPercentage.
      const quotes = await Promise.all(symbolList.map(async (sym) => {
        const r = await fetch(`https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(sym)}&apikey=${fmp}`);
        if (!r.ok) return null;
        const arr = await r.json();
        const q = Array.isArray(arr) ? arr[0] : null;
        if (!q || q.price == null) return null;
        return { symbol: q.symbol || sym, price: q.price, changePct: q.changePercentage };
      }));
      const rows = quotes.filter(Boolean);
      if (rows.length) out.stocks = rows;
    } catch (e) {
      console.error("[market] FMP quotes failed:", e?.message || e);
    }
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
