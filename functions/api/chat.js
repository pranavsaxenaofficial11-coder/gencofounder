// ============================================================================
// /api/chat — Cloudflare Pages Function
// ============================================================================
// Proxies AI chat requests for VITE_AI_MODE=nvidia builds. Auto-detects the
// provider from whichever key is configured, so any one of these works:
//   NVIDIA_API_KEY  (nvapi-…)  → NVIDIA NIM serverless (build.nvidia.com)
//   AI_API_KEY      (sk-or-…)  → OpenRouter
//   AI_API_KEY      (sk-ant-…) → Anthropic native
// Optional: RECAPTCHA_SECRET_KEY (soft verify), AI_MODEL / NVIDIA_MODEL
// (server-side model override). Set these in .dev.vars locally and in
// Cloudflare Dashboard → Pages → Settings → Environment Variables in prod.
// Responses are normalized to Anthropic shape: { content: [{type:"text",text}] }
// ============================================================================

export async function onRequestPost(context) {
  const { request, env } = context;

  const origin = request.headers.get("Origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-recaptcha-token",
  };

  const nvidiaKey = env.NVIDIA_API_KEY || "";
  const genericKey = env.OPENROUTER_API_KEY || env.AI_API_KEY || env.ANTHROPIC_API_KEY || "";
  if (!nvidiaKey && !genericKey) {
    return Response.json(
      { error: "No AI key configured. Set NVIDIA_API_KEY (or AI_API_KEY) in the Worker's environment variables (Cloudflare dashboard > your Worker > Settings > Variables), or in .dev.vars for local wrangler dev." },
      { status: 500, headers: corsHeaders }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400, headers: corsHeaders });
  }

  const { messages, system, model, max_tokens, recaptchaToken } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages array is required." }, { status: 400, headers: corsHeaders });
  }

  // --- reCAPTCHA v3 (verify only if a token is present; never hard-block) ---
  const recaptchaSecret = env.RECAPTCHA_SECRET_KEY;
  const token = recaptchaToken || request.headers.get("x-recaptcha-token");
  if (recaptchaSecret && token) {
    try {
      const verify = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(recaptchaSecret)}&response=${encodeURIComponent(token)}`,
      });
      const result = await verify.json();
      if (result.success === false && result.score != null && result.score < 0.3) {
        return Response.json({ error: "reCAPTCHA verification failed." }, { status: 403, headers: corsHeaders });
      }
    } catch {
      // fail open — don't block real users if Google is slow
    }
  }

  const maxTokens = Math.min(max_tokens || 1024, 2048);
  const oaiMessages = [];
  if (system) oaiMessages.push({ role: "system", content: system });
  oaiMessages.push(...messages);

  try {
    // ---- Provider 1: NVIDIA NIM (OpenAI-compatible) ----
    if (nvidiaKey) {
      const nimModel = model || env.NVIDIA_MODEL || env.AI_MODEL || "z-ai/glm-5.2";
      const resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nvidiaKey}`,
        },
        body: JSON.stringify({ model: nimModel, max_tokens: maxTokens, messages: oaiMessages }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error("NVIDIA NIM error:", resp.status, errText);
        return Response.json(
          { error: "Upstream API error", status: resp.status, detail: errText.slice(0, 500) },
          { status: 502, headers: corsHeaders }
        );
      }
      const d = await resp.json();
      return Response.json(
        {
          content: [{ type: "text", text: d.choices?.[0]?.message?.content || "" }],
          model: d.model,
          usage: d.usage,
        },
        { headers: corsHeaders }
      );
    }

    // ---- Provider 2: OpenRouter (sk-or-…) ----
    const isOpenRouter = genericKey.startsWith("sk-or-") || (!genericKey.startsWith("sk-ant-") && genericKey.startsWith("sk-"));
    if (isOpenRouter) {
      // Frontend sends an NVIDIA-catalog model id; don't forward it blindly.
      // Free slugs rotate, so try a chain and use the first that answers.
      // Instruct models first — free reasoning models leak chain-of-thought
      // into content, which the chat UI would display verbatim.
      const candidates = [
        env.AI_MODEL,
        "google/gemma-4-31b-it:free",
        "google/gemma-4-26b-a4b-it:free",
        "openai/gpt-oss-20b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
      ].filter(Boolean);

      let lastStatus = 502, lastDetail = "";
      for (const orModel of candidates) {
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${genericKey}`,
            "HTTP-Referer": env.ALLOWED_ORIGIN || "https://gencopilot.pages.dev",
            "X-Title": "GenCopilot",
          },
          body: JSON.stringify({ model: orModel, max_tokens: maxTokens, messages: oaiMessages }),
        });
        if (resp.ok) {
          const d = await resp.json();
          let text = d.choices?.[0]?.message?.content || "";
          // Reasoning models sometimes inline their thinking — keep only the answer.
          const thinkEnd = text.lastIndexOf("</think>");
          if (thinkEnd !== -1) text = text.slice(thinkEnd + 8).trim();
          if (!text) { lastStatus = 502; lastDetail = "empty completion from " + orModel; continue; }
          return Response.json(
            {
              content: [{ type: "text", text }],
              model: d.model,
              usage: d.usage,
            },
            { headers: corsHeaders }
          );
        }
        lastStatus = resp.status;
        lastDetail = (await resp.text()).slice(0, 500);
        console.error("OpenRouter error for", orModel, ":", resp.status, lastDetail);
      }
      return Response.json(
        { error: "Upstream API error", status: lastStatus, detail: lastDetail },
        { status: 502, headers: corsHeaders }
      );
    }

    // ---- Provider 3: Anthropic native (sk-ant-…) ----
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": genericKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.AI_MODEL || "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system: system || undefined,
        messages,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Anthropic error:", resp.status, errText);
      return Response.json(
        { error: "Upstream API error", status: resp.status },
        { status: resp.status, headers: corsHeaders }
      );
    }
    const data = await resp.json();
    return Response.json(data, { headers: corsHeaders });

  } catch (err) {
    console.error("Chat function error:", err);
    return Response.json(
      { error: "Failed to reach AI provider.", detail: String(err?.message || err) },
      { status: 502, headers: corsHeaders }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-recaptcha-token",
      "Access-Control-Max-Age": "86400",
    },
  });
}
