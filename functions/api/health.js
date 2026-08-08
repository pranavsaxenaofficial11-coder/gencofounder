export async function onRequestGet(context) {
  const { env } = context;
  const nvidiaKey = env.NVIDIA_API_KEY || "";
  return Response.json({
    status: "ok",
    provider: nvidiaKey ? "nvidia-nim" : "puter",
    hasKey: !!nvidiaKey,
    hasRecaptcha: !!env.RECAPTCHA_SECRET_KEY,
    runtime: "cloudflare-pages-functions",
    timestamp: new Date().toISOString(),
  });
}
