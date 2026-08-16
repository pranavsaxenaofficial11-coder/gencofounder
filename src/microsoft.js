// ============================================================================
// src/microsoft.js — Microsoft 365 sign-in (Entra ID) + Graph mail client
// ============================================================================
// The Business Email module talks to a real Microsoft 365 mailbox through
// Microsoft Graph. Auth is the browser-native flow for single-page apps:
// authorization code + PKCE via MSAL. That flow needs NO client secret, which
// matters here — this app ships as a static bundle, so any secret placed in it
// would be public.
//
// Setup lives in MICROSOFT_SETUP.md. The two values it produces:
//   VITE_MS_CLIENT_ID   — the Entra app registration's Application (client) ID
//   VITE_MS_TENANT_ID   — "organizations" (any work/school account, the
//                         default) or a specific tenant ID to lock sign-in to
//                         one organization.
// Both are public by design: a client ID is an identifier, not a credential.
//
// Scope is deliberately one person's own mailbox. Nothing here reads anyone
// else's mail, so no tenant administrator has to consent on behalf of the
// organization — each user consents for themselves at first sign-in.
//
// Everything below fails soft. A missing package or missing client ID surfaces
// as a typed error the UI turns into a setup card, never a blank page.
// ============================================================================

const CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID || "";
const TENANT_ID = import.meta.env.VITE_MS_TENANT_ID || "organizations";
const GRAPH = "https://graph.microsoft.com/v1.0";

// The smallest set that lets someone read, organise, and send their own mail.
// Mail.ReadWrite supersedes Mail.Read and is what flag / move / delete /
// mark-as-read need, so Mail.Read is not requested separately.
export const SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "User.Read",
  "Mail.ReadWrite",
  "Mail.Send",
];

export function isConfigured() {
  return Boolean(CLIENT_ID);
}

// ---------------------------------------------------------------- errors ---
// One error shape, so the UI can branch on `code` instead of matching strings.
export class MsError extends Error {
  constructor(code, message, detail) {
    super(message);
    this.name = "MsError";
    this.code = code;       // not-configured | sdk-missing | needs-consent |
                            // popup-blocked | cancelled | forbidden |
                            // no-account | graph
    this.detail = detail ?? null;
  }
}

// ------------------------------------------------------------------ msal ---
let _msalPromise = null;

// MSAL is loaded on demand: it is a sizeable dependency and most sessions never
// open the mail module. The import is wrapped because a missing package must
// read as "run npm i", not as a module-resolution crash at app boot.
async function loadMsal() {
  try {
    return await import("@azure/msal-browser");
  } catch (e) {
    throw new MsError(
      "sdk-missing",
      "The Microsoft sign-in library isn't installed. Run: npm i @azure/msal-browser",
      e?.message || String(e)
    );
  }
}

async function getMsal() {
  if (!CLIENT_ID) {
    throw new MsError(
      "not-configured",
      "VITE_MS_CLIENT_ID isn't set, so the app doesn't know which Microsoft app registration to sign in against."
    );
  }
  if (_msalPromise) return _msalPromise;

  _msalPromise = (async () => {
    const msal = await loadMsal();
    const app = new msal.PublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
        // Must match a Single-page application redirect URI on the registration.
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
      },
      cache: {
        // localStorage, not MSAL's sessionStorage default: a founder who
        // reloads the dashboard should still be connected to their mailbox.
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
      },
    });
    // Required from msal-browser v3 onward — every other call throws without it.
    await app.initialize();
    // Harmless when we only ever use popups; needed if a popup-blocked browser
    // ever falls back to a redirect.
    await app.handleRedirectPromise().catch(() => {});
    const existing = app.getAllAccounts();
    if (existing.length && !app.getActiveAccount()) app.setActiveAccount(existing[0]);
    return app;
  })();

  try {
    return await _msalPromise;
  } catch (e) {
    _msalPromise = null; // let the next attempt retry rather than cache the failure
    throw e;
  }
}

function normalizeAuthError(e) {
  if (e instanceof MsError) return e;
  const code = e?.errorCode || "";
  if (code === "user_cancelled" || code === "access_denied")
    return new MsError("cancelled", "Sign-in was cancelled.");
  if (code === "popup_window_error" || code === "empty_window_error")
    return new MsError(
      "popup-blocked",
      "The sign-in popup was blocked. Allow popups for this site, then try again."
    );
  if (["consent_required", "interaction_required", "login_required"].includes(code))
    return new MsError("needs-consent", "Microsoft needs you to approve this access.", code);
  return new MsError("graph", e?.errorMessage || e?.message || String(e), code || null);
}

// --------------------------------------------------------------- account ---

/** The connected Microsoft account, or null. Never throws. */
export async function currentAccount() {
  if (!CLIENT_ID) return null;
  try {
    const app = await getMsal();
    return app.getActiveAccount() || app.getAllAccounts()[0] || null;
  } catch {
    return null;
  }
}

/** Interactive sign-in. Returns the account. */
export async function connect() {
  const app = await getMsal();
  try {
    const result = await app.loginPopup({ scopes: SCOPES, prompt: "select_account" });
    if (result?.account) app.setActiveAccount(result.account);
    return result.account;
  } catch (e) {
    throw normalizeAuthError(e);
  }
}

/** Disconnect. Clears this app's local token cache only. */
export async function disconnect() {
  try {
    const app = await getMsal();
    const account = app.getActiveAccount() || app.getAllAccounts()[0];
    app.setActiveAccount(null);
    if (account) {
      // clearCache drops the tokens without bouncing the user through a
      // Microsoft sign-out page, which would take them out of the dashboard.
      await app.clearCache({ account }).catch(() => {});
    }
  } catch {
    /* already disconnected, or MSAL never loaded */
  }
}

/**
 * A Graph access token. Silent when a cached or refresh token covers it; falls
 * back to a popup only when Microsoft says interaction is genuinely required
 * (first consent, expired refresh, revoked grant).
 */
export async function getToken() {
  const app = await getMsal();
  const account = app.getActiveAccount() || app.getAllAccounts()[0];
  if (!account) throw new MsError("no-account", "No Microsoft account is connected yet.");

  try {
    const r = await app.acquireTokenSilent({ scopes: SCOPES, account });
    return r.accessToken;
  } catch (e) {
    const msal = await loadMsal();
    const interactionNeeded =
      e instanceof msal.InteractionRequiredAuthError ||
      ["consent_required", "interaction_required", "login_required"].includes(e?.errorCode);
    if (!interactionNeeded) throw normalizeAuthError(e);
    try {
      const r = await app.acquireTokenPopup({ scopes: SCOPES, account });
      return r.accessToken;
    } catch (e2) {
      throw normalizeAuthError(e2);
    }
  }
}

// ----------------------------------------------------------------- graph ---

/**
 * One call to Microsoft Graph.
 * @param path  Graph path beginning with "/", e.g. "/me/messages"
 * @param opts  { method, body, headers }
 */
export async function graph(path, opts = {}) {
  const { method = "GET", body, headers = {} } = opts;
  const token = await getToken();

  const res = await fetch(GRAPH + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error?.message || "";
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 403)
      throw new MsError(
        "forbidden",
        detail || "Microsoft refused this request. Your account may not have mail access.",
        403
      );
    throw new MsError("graph", detail || `Microsoft Graph returned ${res.status}.`, res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ------------------------------------------------------------------ mail ---

const LIST_SELECT = [
  "id", "subject", "bodyPreview", "from", "toRecipients", "ccRecipients",
  "receivedDateTime", "sentDateTime", "isRead", "isDraft", "hasAttachments",
  "importance", "flag", "conversationId", "webLink",
].join(",");

/** Mail folders, with the well-known ones in a familiar order. */
export async function listFolders() {
  const d = await graph(
    "/me/mailFolders?$top=60&$select=id,displayName,unreadItemCount,totalItemCount,wellKnownName"
  );
  const order = ["inbox", "drafts", "sentitems", "archive", "junkemail", "deleteditems"];
  const rank = (f) => {
    const i = order.indexOf((f.wellKnownName || "").toLowerCase());
    return i === -1 ? order.length : i;
  };
  return (d.value || []).sort(
    (a, b) => rank(a) - rank(b) || (a.displayName || "").localeCompare(b.displayName || "")
  );
}

/**
 * Messages in a folder, or a search across the whole mailbox.
 *
 * Graph rejects $search combined with $orderby, so search results come back in
 * relevance order and span every folder rather than the selected one. That is
 * Graph's behaviour rather than a shortcut here, and the UI says so.
 */
export async function listMessages({ folderId, search, top = 25, skip = 0 } = {}) {
  let path;
  if (search && search.trim()) {
    const q = encodeURIComponent(`"${search.trim().replace(/"/g, "")}"`);
    path = `/me/messages?$search=${q}&$top=${top}&$select=${LIST_SELECT}`;
  } else {
    const where = folderId ? `/me/mailFolders/${folderId}/messages` : "/me/messages";
    path = `${where}?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc&$select=${LIST_SELECT}`;
  }
  const d = await graph(path);
  return { items: d.value || [], hasMore: Boolean(d["@odata.nextLink"]) };
}

/** One message, including its HTML body. */
export async function getMessage(id) {
  return graph(`/me/messages/${id}`, {
    headers: { Prefer: 'outlook.body-content-type="html"' },
  });
}

export async function listAttachments(id) {
  const d = await graph(
    `/me/messages/${id}/attachments?$select=id,name,contentType,size,isInline`
  );
  return d.value || [];
}

/** An attachment's bytes as a blob URL the browser can open or save. */
export async function attachmentBlobUrl(messageId, attachmentId) {
  const a = await graph(`/me/messages/${messageId}/attachments/${attachmentId}`);
  if (!a?.contentBytes) throw new MsError("graph", "That attachment has no downloadable content.");
  const bytes = Uint8Array.from(atob(a.contentBytes), (c) => c.charCodeAt(0));
  return URL.createObjectURL(
    new Blob([bytes], { type: a.contentType || "application/octet-stream" })
  );
}

const addrList = (s) =>
  String(s || "")
    .split(/[,;]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((address) => ({ emailAddress: { address } }));

/** Send a new message. `to`/`cc` accept comma- or semicolon-separated addresses. */
export async function sendMail({ to, cc, subject, body } = {}) {
  const recipients = addrList(to);
  if (!recipients.length) throw new MsError("graph", "Add at least one recipient.");
  await graph("/me/sendMail", {
    method: "POST",
    body: {
      message: {
        subject: subject || "(no subject)",
        body: { contentType: "Text", content: body || "" },
        toRecipients: recipients,
        ccRecipients: addrList(cc),
      },
      saveToSentItems: true,
    },
  });
}

/** Reply to a message. `all` replies to everyone on the thread. */
export async function replyMail({ id, comment, all = false } = {}) {
  await graph(`/me/messages/${id}/${all ? "replyAll" : "reply"}`, {
    method: "POST",
    body: { comment: comment || "" },
  });
}

export async function forwardMail({ id, to, comment } = {}) {
  const recipients = addrList(to);
  if (!recipients.length) throw new MsError("graph", "Add at least one recipient.");
  await graph(`/me/messages/${id}/forward`, {
    method: "POST",
    body: { comment: comment || "", toRecipients: recipients },
  });
}

export async function setRead(id, isRead) {
  await graph(`/me/messages/${id}`, { method: "PATCH", body: { isRead } });
}

export async function setFlag(id, flagged) {
  await graph(`/me/messages/${id}`, {
    method: "PATCH",
    body: { flag: { flagStatus: flagged ? "flagged" : "notFlagged" } },
  });
}

/** Move to a folder id, or a well-known name such as "deleteditems"/"archive". */
export async function moveMessage(id, destinationId) {
  return graph(`/me/messages/${id}/move`, {
    method: "POST",
    body: { destinationId },
  });
}

export async function deleteMessage(id) {
  await moveMessage(id, "deleteditems");
}

/** The signed-in user's Microsoft profile. */
export async function me() {
  return graph(
    "/me?$select=id,displayName,mail,userPrincipalName,jobTitle,officeLocation,mobilePhone"
  );
}
