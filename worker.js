// ============================================================================
// Worker entry point
// ============================================================================
// This project began as Cloudflare Pages, where functions/api/*.js were picked
// up automatically by file-based routing. On Workers there is no such magic:
// one Worker owns every request, so this module does the routing that Pages
// used to do for us.
//
// The handlers themselves are UNCHANGED. Each one only ever destructured
// `{ request, env }` out of the Pages context, so the small context object
// built below is a faithful stand-in rather than a rewrite.
// ============================================================================

import * as chat from "./functions/api/chat.js";
import * as contact from "./functions/api/contact.js";
import * as health from "./functions/api/health.js";
import * as market from "./functions/api/market.js";
import * as news from "./functions/api/news.js";

const ROUTES = {
  "/api/chat": chat,
  "/api/contact": contact,
  "/api/health": health,
  "/api/market": market,
  "/api/news": news,
};

// Pages dispatches to onRequest<Method> and falls back to a catch-all
// onRequest. HEAD maps to the GET handler so uptime checks against
// /api/health keep working the way they did on Pages.
function pickHandler(mod, method) {
  const byMethod = {
    GET: mod.onRequestGet,
    HEAD: mod.onRequestGet,
    POST: mod.onRequestPost,
    PUT: mod.onRequestPut,
    PATCH: mod.onRequestPatch,
    DELETE: mod.onRequestDelete,
    OPTIONS: mod.onRequestOptions,
  };
  return byMethod[method] || mod.onRequest;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Pages treated /api/health and /api/health/ as the same route.
    const path = url.pathname.length > 1
      ? url.pathname.replace(/\/+$/, "")
      : url.pathname;

    const mod = ROUTES[path];
    if (mod) {
      const handler = pickHandler(mod, request.method);
      if (!handler) {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { "Content-Type": "text/plain" },
        });
      }
      return handler({
        request,
        env,
        params: {},
        data: {},
        waitUntil: ctx.waitUntil.bind(ctx),
        // Pages' context.next() fell through to the static assets.
        next: () => env.ASSETS.fetch(request),
      });
    }

    // Everything else is the built SPA. Exact asset matches are served by the
    // assets layer before this Worker is ever invoked, so a request arriving
    // here is either genuinely missing or a client-side route — hand back
    // index.html and let the app decide what to render.
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;

    return env.ASSETS.fetch(new Request(new URL("/index.html", url.origin), {
      method: "GET",
      headers: request.headers,
    }));
  },
};
