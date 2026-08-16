// ============================================================================
// src/usage.js — what every AI call costs, and whose bill it lands on
// ============================================================================
// The Billing module is only as honest as this file. Two rules shape it:
//
//   1. Token counts come from the provider whenever the provider reports them.
//      functions/api/chat.js already returns `usage` from NVIDIA NIM and
//      OpenRouter, and Anthropic's native shape passes through untouched.
//      Those are real numbers. Only when a provider reports nothing do we fall
//      back to a character-based estimate — and that row is flagged
//      `estimated`, so the UI can label it rather than quietly present a guess
//      as a fact.
//
//   2. Prices are the founder's to set. The defaults below are a starting
//      point, not an authority: list prices move, contracts differ, and free
//      tiers cost nothing. The rate card is editable in the Billing module and
//      stored per workspace, so what the dashboard shows is what the founder
//      says they actually pay.
// ============================================================================

import { addUsage } from "./org.js";

// USD per 1,000,000 tokens. `unknown: true` means "we have no basis for a price
// here" — the UI badges those rows instead of showing a confident $0.00.
export const DEFAULT_RATES = {
  // --- Anthropic, published first-party list prices -----------------------
  "claude-fable-5":    { in: 10, out: 50 },
  "claude-opus-5":     { in: 5,  out: 25 },
  "claude-opus-4-8":   { in: 5,  out: 25 },
  "claude-opus-4-7":   { in: 5,  out: 25 },
  "claude-opus-4-6":   { in: 5,  out: 25 },
  // Sonnet 5 is on introductory pricing ($2/$10) through 2026-08-31, after
  // which it reverts to $3/$15. Update this row on 2026-09-01.
  "claude-sonnet-5":   { in: 2,  out: 10, note: "intro pricing through 2026-08-31" },
  "claude-sonnet-4-6": { in: 3,  out: 15 },
  "claude-haiku-4-5":  { in: 1,  out: 5 },

  // --- What this app actually calls by default ----------------------------
  // Zero because they cost this workspace nothing today, not because they are
  // free in general. Put real numbers here if that changes.
  "z-ai/glm-5.2": { in: 0, out: 0, unknown: true, note: "NVIDIA NIM — set your rate" },
  "gpt-5.4-nano": { in: 0, out: 0, note: "Puter — billed to the end user, not the workspace" },
};

// OpenRouter's free slugs all end in ":free" and genuinely cost nothing.
const isFreeSlug = (model) => typeof model === "string" && model.endsWith(":free");

/** "2026-08" — the bucket a usage row is billed into. */
export function monthKeyOf(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

/**
 * The rate for a model id, tolerating the drift between what we ask for and
 * what a provider says it served (version suffixes, vendor prefixes). Longest
 * match wins, so "claude-opus-4-8" beats a looser "claude-opus".
 */
export function rateFor(model, rates) {
  if (!model) return { in: 0, out: 0, unknown: true };
  const table = { ...DEFAULT_RATES, ...(rates || {}) };
  if (table[model]) return table[model];
  if (isFreeSlug(model)) return { in: 0, out: 0 };

  const norm = String(model).toLowerCase();
  let bestKey = null;
  for (const key of Object.keys(table)) {
    const k = key.toLowerCase();
    if ((norm.includes(k) || k.includes(norm)) && (!bestKey || k.length > bestKey.length)) {
      bestKey = key;
    }
  }
  return bestKey ? table[bestKey] : { in: 0, out: 0, unknown: true };
}

/** Roughly four characters to a token — only used when a provider reports none. */
export function approxTokens(text) {
  if (!text) return 0;
  return Math.max(1, Math.round(String(text).length / 4));
}

export function estimateCostUsd(model, inTok, outTok, rates) {
  const r = rateFor(model, rates);
  return ((inTok || 0) * (r.in || 0) + (outTok || 0) * (r.out || 0)) / 1_000_000;
}

/**
 * Providers disagree on field names: NVIDIA NIM and OpenRouter are
 * OpenAI-shaped (prompt_tokens/completion_tokens), Anthropic native uses
 * input_tokens/output_tokens. Normalize both, and report whether the numbers
 * were actually there.
 */
export function normalizeUsage(usage) {
  if (!usage || typeof usage !== "object") return { inTok: 0, outTok: 0, reported: false };
  const inTok = usage.prompt_tokens ?? usage.input_tokens ?? 0;
  const outTok = usage.completion_tokens ?? usage.output_tokens ?? 0;
  return { inTok, outTok, reported: Boolean(inTok || outTok) };
}

// --------------------------------------------------------------- context ---
// askClaude/askAI are plain functions outside the React tree, so the identity
// to bill sits in module scope and is refreshed by App whenever auth or
// workspace membership changes. This mirrors how AI_MODE and friends already
// work in App.jsx.
let CTX = { uid: null, name: null, orgId: null };

export function setUsageContext(next) {
  CTX = { uid: null, name: null, orgId: null, ...(next || {}) };
}

export function getUsageContext() {
  return CTX;
}

/**
 * Record one AI call against the workspace ledger. Best-effort by design: a
 * failed write must never break the conversation the user is having. Returns
 * the row it wrote, or null when there was nowhere to write it.
 */
export async function recordAiUsage({
  module: moduleId,
  model,
  provider,
  usage,
  promptText,
  completionText,
  rates,
} = {}) {
  const { uid, name, orgId } = CTX;
  if (!uid || !orgId) return null; // signed out, or not in a workspace yet

  const { inTok, outTok, reported } = normalizeUsage(usage);
  const promptTokens = reported ? inTok : approxTokens(promptText);
  const completionTokens = reported ? outTok : approxTokens(completionText);

  const row = {
    uid,
    name: name || "Unknown",
    module: moduleId || "copilot",
    provider: provider || "unknown",
    model: model || "unknown",
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    costUsd: estimateCostUsd(model, promptTokens, completionTokens, rates),
    estimated: !reported,
    monthKey: monthKeyOf(),
  };

  try {
    await addUsage(orgId, row);
    return row;
  } catch (e) {
    console.warn("[usage] not recorded:", e?.message || e);
    return null;
  }
}

// ----------------------------------------------------------- aggregation ---

/** Group rows by member: spend, calls, tokens, and how many were estimates. */
export function byMember(rows = []) {
  const map = new Map();
  for (const r of rows) {
    const key = r.uid || r.name || "unknown";
    const cur = map.get(key) || {
      uid: r.uid, name: r.name, calls: 0, costUsd: 0,
      promptTokens: 0, completionTokens: 0, estimatedCalls: 0,
    };
    cur.calls += 1;
    cur.costUsd += r.costUsd || 0;
    cur.promptTokens += r.promptTokens || 0;
    cur.completionTokens += r.completionTokens || 0;
    if (r.estimated) cur.estimatedCalls += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.costUsd - a.costUsd);
}

/** Group by model — "what is actually costing us money". */
export function byModel(rows = []) {
  const map = new Map();
  for (const r of rows) {
    const key = r.model || "unknown";
    const cur = map.get(key) || { model: key, calls: 0, costUsd: 0, totalTokens: 0 };
    cur.calls += 1;
    cur.costUsd += r.costUsd || 0;
    cur.totalTokens += r.totalTokens || 0;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.costUsd - a.costUsd);
}

/** Chronological month buckets, oldest first — the shape Recharts wants. */
export function byMonth(rows = []) {
  const map = new Map();
  for (const r of rows) {
    const key = r.monthKey || monthKeyOf();
    const cur = map.get(key) || { monthKey: key, costUsd: 0, calls: 0, totalTokens: 0 };
    cur.costUsd += r.costUsd || 0;
    cur.calls += 1;
    cur.totalTokens += r.totalTokens || 0;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

/** Money formatter — sub-cent spend should not all collapse to "$0.00". */
export function money(n) {
  const v = Number(n) || 0;
  if (v === 0) return "$0.00";
  if (v < 0.01) return "<$0.01";
  if (v < 1000) return "$" + v.toFixed(2);
  return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/** "12.4k" / "1.2M" — token counts get large fast. */
export function compactNum(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "k";
  return String(v);
}
