// Vercel Edge wrapper — reuses the Cloudflare Pages Function unchanged.
export const config = { runtime: "edge" };
import { onRequestGet, onRequestOptions } from "../functions/api/market.js";

export default async function handler(req) {
  if (req.method === "OPTIONS") return onRequestOptions();
  return onRequestGet({ request: req, env: process.env });
}
