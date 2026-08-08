// Vercel Edge wrapper — reuses the Cloudflare Pages Function unchanged.
export const config = { runtime: "edge" };
import { onRequestPost, onRequestOptions } from "../functions/api/contact.js";

export default async function handler(req) {
  if (req.method === "OPTIONS") return onRequestOptions();
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  return onRequestPost({ request: req, env: process.env });
}
