// ============================================================================
// src/portal-ui.js — shared primitives, borrowed rather than duplicated
// ============================================================================
// App.jsx is a deliberately single-file UI and owns the design primitives
// (Card, Btn, Badge, ModuleShell, the toast context, …). The portal modules
// live in their own files so App.jsx doesn't grow by another thousand lines,
// but they must look identical to everything around them.
//
// Rather than re-declare those primitives — which would drift the moment the
// design changes — App.jsx hands them over once at import time and the modules
// read them back here. One registration, no prop plumbing through the module
// tree, and exactly one definition of each primitive in the codebase.
// ============================================================================

let UI = null;

/** Called once from App.jsx, at module scope. */
export function registerPortalUI(parts) {
  UI = parts;
}

export function ui() {
  if (!UI) {
    throw new Error(
      "portal-ui: registerPortalUI() was never called. App.jsx must register " +
        "the shared primitives before a portal module renders."
    );
  }
  return UI;
}

// ------------------------------------------------------------- formatting ---

/** "3m ago" / "Tue 14:02" / "12 Mar" — mail lists need all three registers. */
export function relTime(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";

  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + "h ago";

  const days = Math.round(hours / 24);
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });
  if (d.getFullYear() === new Date().getFullYear())
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function fullTime(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

/** "Ada Lovelace <ada@x.com>" → "Ada Lovelace", falling back to the address. */
export function personName(recipient) {
  const ea = recipient?.emailAddress || recipient || {};
  return ea.name || ea.address || "Unknown";
}

export function personAddress(recipient) {
  const ea = recipient?.emailAddress || recipient || {};
  return ea.address || "";
}

export function joinNames(list, max = 3) {
  const names = (list || []).map(personName);
  if (!names.length) return "";
  if (names.length <= max) return names.join(", ");
  return names.slice(0, max).join(", ") + ` +${names.length - max}`;
}

/** Bytes → "14 KB". Attachment sizes only; no need for exact binary units. */
export function fileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return Math.round(n / 1024) + " KB";
  return (n / (1024 * 1024)).toFixed(1) + " MB";
}
