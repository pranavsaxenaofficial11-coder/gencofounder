// ============================================================================
// /api/contact — Cloudflare Pages Function
// ============================================================================

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-recaptcha-token",
  };

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400, headers: corsHeaders });
  }

  const { name, email, message, recaptchaToken } = body;
  if (!name || !email || !message) {
    return Response.json({ error: "name, email, and message required." }, { status: 400, headers: corsHeaders });
  }

  // reCAPTCHA check
  const secret = env.RECAPTCHA_SECRET_KEY;
  if (secret) {
    const token = recaptchaToken || request.headers.get("x-recaptcha-token");
    if (!token) {
      return Response.json({ error: "reCAPTCHA token required." }, { status: 400, headers: corsHeaders });
    }
    try {
      const v = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
      });
      const r = await v.json();
      if (!r.success || (r.score != null && r.score < 0.5)) {
        return Response.json({ error: "reCAPTCHA failed." }, { status: 403, headers: corsHeaders });
      }
    } catch { /* fail open */ }
  }

  // Log it (visible in wrangler tail / Cloudflare dashboard logs)
  console.log("📬 Contact:", { name, email, message: message.slice(0, 120) });

  // TODO: Wire to an email service when ready:
  // await fetch("https://api.resend.com/emails", { ... })

  return Response.json(
    { ok: true, message: "Message received — we'll be in touch." },
    { headers: corsHeaders }
  );
}

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
