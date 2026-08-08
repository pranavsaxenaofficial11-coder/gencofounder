// Vercel Edge wrapper — reuses the Cloudflare Pages Function unchanged.
export const config = { runtime: "edge" };
import { onRequestGet } from "../functions/api/health.js";

export default async function handler(req) {
  return onRequestGet({ request: req, env: process.env });
}
