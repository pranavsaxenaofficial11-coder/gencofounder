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

  // Deliver by email via Resend. Without RESEND_API_KEY this is skipped and
  // the request still succeeds — the client has already written the message to
  // Firestore, so nothing is lost; you just read it in the console instead of
  // your inbox. See CONTACT_SETUP.md to turn mail on.
  const resendKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO || "gencopilotfounder@gmail.com";
  // Resend only accepts a verified sender. onboarding@resend.dev works out of
  // the box but can ONLY deliver to the address that owns the Resend account.
  const from = env.CONTACT_FROM || "GenCopilot <onboarding@resend.dev>";

  let delivered = false;
  if (resendKey) {
    try {
      const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email,
          subject: `New contact form message from ${name}`,
          html:
            `<h2 style="margin:0 0 16px;font-family:system-ui,sans-serif">New message from the GenCopilot site</h2>` +
            `<p style="font-family:system-ui,sans-serif;margin:0 0 6px"><b>Name:</b> ${esc(name)}</p>` +
            `<p style="font-family:system-ui,sans-serif;margin:0 0 6px"><b>Email:</b> ${esc(email)}</p>` +
            `<p style="font-family:system-ui,sans-serif;margin:16px 0 6px"><b>Message:</b></p>` +
            `<p style="font-family:system-ui,sans-serif;white-space:pre-wrap;line-height:1.6">${esc(message)}</p>`,
        }),
      });
      if (r.ok) {
        delivered = true;
      } else {
        console.error("[contact] Resend rejected the send:", r.status, await r.text());
      }
    } catch (e) {
      console.error("[contact] Resend request failed:", e?.message || e);
    }
  } else {
    console.warn("[contact] RESEND_API_KEY not set — email skipped, message logged only.");
  }

  return Response.json(
    { ok: true, delivered, message: "Message received — we'll be in touch." },
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
