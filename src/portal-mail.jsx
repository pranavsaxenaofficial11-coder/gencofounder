// ============================================================================
// src/portal-mail.jsx — Business Email, backed by a real Microsoft 365 mailbox
// ============================================================================
// Folder rail → message list → reading pane, with compose, search, reply,
// forward, flag, archive, delete, and attachment download. Everything here
// goes through src/microsoft.js; there is no mock data and no local mailbox.
//
// Message bodies are the one genuinely dangerous thing in this file: they are
// arbitrary HTML written by whoever sent the mail. They render inside an
// iframe with an empty `sandbox` attribute — no scripts, no same-origin, no
// forms — and a Content-Security-Policy that blocks remote loads until the
// reader asks for images. dangerouslySetInnerHTML is never used.
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Mail, Inbox, Send, Search, RefreshCw, Paperclip, Reply, ReplyAll, Forward,
  Trash2, Archive, Star, X, Plus, Loader2, AlertTriangle, ExternalLink,
  ShieldCheck, ImageOff, ChevronLeft, LogOut, Download,
} from "lucide-react";
import * as ms from "./microsoft.js";
import {
  ui, relTime, fullTime, personName, personAddress, joinNames, fileSize,
} from "./portal-ui.js";
import { getUsageContext } from "./usage.js";
import { setMemberMailbox } from "./org.js";

// --------------------------------------------------------------- body view ---

const escapeHtml = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function buildSrcDoc(message, showImages) {
  const isHtml = (message?.body?.contentType || "").toLowerCase() === "html";
  const raw = message?.body?.content ?? message?.bodyPreview ?? "";

  // Belt and braces. `sandbox=""` already stops scripts from running at all;
  // this additionally stops the page from phoning home — the tracking pixel in
  // a marketing email does not fire until the reader opts in.
  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    `img-src ${showImages ? "https: data:" : "'none'"}`,
    "font-src data:",
  ].join("; ");

  const inner = isHtml ? raw : `<pre>${escapeHtml(raw)}</pre>`;

  // Mail HTML almost universally assumes a light background, so the reading
  // surface stays light regardless of the dashboard theme — same as Outlook.
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<style>
  html,body{margin:0;padding:16px;background:#fff;color:#18181b;
    font:14px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    word-break:break-word;overflow-wrap:anywhere}
  img{max-width:100%;height:auto}
  a{color:#6d28d9}
  pre{white-space:pre-wrap;font:inherit;margin:0}
  table{max-width:100%!important}
  blockquote{margin:8px 0;padding-left:12px;border-left:3px solid #e4e4e7;color:#52525b}
</style></head><body>${inner}</body></html>`;
}

function BodyFrame({ message, showImages }) {
  const srcDoc = useMemo(() => buildSrcDoc(message, showImages), [message, showImages]);
  return (
    <iframe
      title={"Message: " + (message?.subject || "(no subject)")}
      sandbox=""
      srcDoc={srcDoc}
      className="w-full h-[52vh] min-h-[300px] rounded-xl border border-gray-200 bg-white"
    />
  );
}

// ------------------------------------------------------------- setup card ---

function SetupCard({ Card, Btn, error, onRetry, onConnect, busy }) {
  const code = error?.code;

  const copy = {
    "not-configured": {
      title: "Connect your Microsoft app registration",
      body: "This portal signs in to Microsoft 365 with an app registration you own. Follow MICROSOFT_SETUP.md, then put the Application (client) ID in .env.local as VITE_MS_CLIENT_ID and restart the dev server.",
    },
    "sdk-missing": {
      title: "One package to install",
      body: "The Microsoft sign-in library isn't installed yet. Run npm i @azure/msal-browser in the project folder, then restart the dev server.",
    },
    "popup-blocked": {
      title: "The sign-in popup was blocked",
      body: "Your browser blocked the Microsoft sign-in window. Allow popups for this site and try again.",
    },
    cancelled: {
      title: "Sign-in was cancelled",
      body: "No harm done — nothing was connected. Try again when you're ready.",
    },
    "needs-consent": {
      title: "Microsoft needs your approval",
      body: "Approve the permission prompt to let this portal read and send mail on your behalf.",
    },
    forbidden: {
      title: "Microsoft refused the request",
      body: error?.message || "Your account may not have a mailbox, or an administrator has restricted access.",
    },
  }[code] || {
    title: "Couldn't reach your mailbox",
    body: error?.message || "Something went wrong talking to Microsoft.",
  };

  return (
    <Card className="p-10 text-center max-w-xl mx-auto">
      <span className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={26} />
      </span>
      <div className="text-lg font-extrabold text-slate-900">{copy.title}</div>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{copy.body}</p>
      {error?.detail ? (
        <p className="text-[11px] text-slate-400 mt-3 font-mono break-all">{String(error.detail)}</p>
      ) : null}
      <div className="flex items-center justify-center gap-2 mt-6">
        {onConnect && code !== "not-configured" && code !== "sdk-missing" && (
          <Btn variant="primary" onClick={onConnect} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Try again
          </Btn>
        )}
        {onRetry && <Btn variant="ghost" onClick={onRetry}>Reload</Btn>}
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------- module ---

export function MailModule({ module, user, company }) {
  const { ModuleShell, Card, Btn, Badge, MiniInput, useTheme, companyLineFrom } = ui();
  const { notify } = useTheme();

  const [account, setAccount] = useState(undefined); // undefined = still checking
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState(null);
  const [messages, setMessages] = useState(null);    // null = loading
  const [selected, setSelected] = useState(null);
  const [searchBox, setSearchBox] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);               // manual refresh
  const [showImages, setShowImages] = useState(false);
  const [compose, setCompose] = useState(null);      // { mode, to, cc, subject, body, id }

  const configured = ms.isConfigured();

  // Is a Microsoft account already connected from a previous visit?
  useEffect(() => {
    let alive = true;
    (async () => {
      const acc = await ms.currentAccount();
      if (alive) setAccount(acc);
    })();
    return () => { alive = false; };
  }, []);

  // Folders
  useEffect(() => {
    if (!account) return;
    let alive = true;
    (async () => {
      try {
        const f = await ms.listFolders();
        if (!alive) return;
        setFolders(f);
        setFolderId((cur) =>
          cur || f.find((x) => (x.wellKnownName || "").toLowerCase() === "inbox")?.id || f[0]?.id || null
        );
      } catch (e) {
        if (alive) setErr(e);
      }
    })();
    return () => { alive = false; };
  }, [account, tick]);

  // Message list. Search ignores the folder — Graph's $search spans the
  // mailbox and can't be combined with a sort, which the UI states outright.
  useEffect(() => {
    if (!account) return;
    if (!folderId && !activeSearch) return;
    let alive = true;
    setMessages(null);
    setErr(null);
    (async () => {
      try {
        const { items } = await ms.listMessages({
          folderId: activeSearch ? undefined : folderId,
          search: activeSearch || undefined,
        });
        if (!alive) return;
        setMessages(items);
      } catch (e) {
        if (!alive) return;
        setErr(e);
        setMessages([]);
      }
    })();
    return () => { alive = false; };
  }, [account, folderId, activeSearch, tick]);

  const activeFolder = folders.find((f) => f.id === folderId) || null;

  async function handleConnect() {
    setBusy(true);
    setErr(null);
    try {
      const acc = await ms.connect();
      setAccount(acc);
      // Let the Team view show who has a mailbox wired up. Best-effort.
      const { orgId, uid } = getUsageContext();
      if (orgId && uid) setMemberMailbox(orgId, uid, acc?.username || null).catch(() => {});
      notify({ tone: "success", title: "Microsoft connected", body: acc?.username || "" });
    } catch (e) {
      setErr(e);
      if (e?.code === "cancelled") notify({ tone: "info", title: "Sign-in cancelled" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    await ms.disconnect();
    setAccount(null);
    setFolders([]);
    setFolderId(null);
    setMessages(null);
    setSelected(null);
    const { orgId, uid } = getUsageContext();
    if (orgId && uid) setMemberMailbox(orgId, uid, null).catch(() => {});
    notify({ tone: "info", title: "Microsoft disconnected", body: "Your mail is no longer loaded in the portal." });
  }

  async function openMessage(m) {
    setSelected({ ...m, __loading: true });
    setShowImages(false);
    try {
      const full = await ms.getMessage(m.id);
      const attachments = full.hasAttachments
        ? await ms.listAttachments(m.id).catch(() => [])
        : [];
      setSelected({ ...full, attachments });
      if (!m.isRead) {
        ms.setRead(m.id, true).catch(() => {});
        setMessages((prev) => (prev || []).map((x) => (x.id === m.id ? { ...x, isRead: true } : x)));
      }
    } catch (e) {
      setSelected(null);
      notify({ tone: "error", title: "Couldn't open that message", body: e?.message || String(e) });
    }
  }

  // Drop a message from the list without a full refetch — moving and deleting
  // both remove it from the current folder.
  function dropFromList(id) {
    setMessages((prev) => (prev || []).filter((x) => x.id !== id));
    setSelected((cur) => (cur?.id === id ? null : cur));
  }

  async function act(label, fn, { removes = false, id } = {}) {
    setBusy(true);
    try {
      await fn();
      if (removes && id) dropFromList(id);
      notify({ tone: "success", title: label });
    } catch (e) {
      notify({ tone: "error", title: label + " failed", body: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function sendCompose() {
    const c = compose;
    if (!c) return;
    setBusy(true);
    try {
      if (c.mode === "reply" || c.mode === "replyAll") {
        await ms.replyMail({ id: c.id, comment: c.body, all: c.mode === "replyAll" });
      } else if (c.mode === "forward") {
        await ms.forwardMail({ id: c.id, to: c.to, comment: c.body });
      } else {
        await ms.sendMail({ to: c.to, cc: c.cc, subject: c.subject, body: c.body });
      }
      setCompose(null);
      notify({ tone: "success", title: "Sent", body: "Saved to your Sent Items." });
    } catch (e) {
      notify({ tone: "error", title: "Couldn't send", body: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function downloadAttachment(att) {
    try {
      const url = await ms.attachmentBlobUrl(selected.id, att.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.name || "attachment";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoke on the next tick — immediate revocation races the download.
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      notify({ tone: "error", title: "Couldn't download", body: e?.message || String(e) });
    }
  }

  const shell = (children) => (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      {children}
    </ModuleShell>
  );

  // ---- states before a mailbox is available -------------------------------

  if (!configured) {
    return shell(<SetupCard Card={Card} Btn={Btn} error={{ code: "not-configured" }} />);
  }

  if (account === undefined) {
    return shell(
      <Card className="p-10 text-center text-sm text-slate-400">
        <Loader2 size={18} className="animate-spin mx-auto mb-3 text-violet-500" />
        Checking your Microsoft connection…
      </Card>
    );
  }

  if (!account) {
    return shell(
      <>
        {err && err.code !== "cancelled" ? (
          <div className="mb-4">
            <SetupCard Card={Card} Btn={Btn} error={err} onConnect={handleConnect} busy={busy} />
          </div>
        ) : null}
        <Card className="p-10 text-center max-w-xl mx-auto">
          <span className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-4">
            <Mail size={26} />
          </span>
          <div className="text-lg font-extrabold text-slate-900">Connect your work email</div>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
            Sign in with your Microsoft 365 account to read and send mail without leaving the portal.
            You'll be asked to approve access to your own mailbox — nobody else's.
          </p>
          <Btn variant="primary" className="mt-6" onClick={handleConnect} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
            Connect Microsoft account
          </Btn>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-4">
            <ShieldCheck size={13} /> Read &amp; send your own mail · no admin approval needed
          </div>
        </Card>
      </>
    );
  }

  // ---- connected ----------------------------------------------------------

  const unreadTotal = folders.reduce((n, f) => n + (f.unreadItemCount || 0), 0);

  return shell(
    <>
      {/* account bar */}
      <Card className="p-3 mb-4 flex flex-wrap items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
          <Mail size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-slate-900 truncate">
            {account.name || account.username}
          </div>
          <div className="text-[11px] text-slate-400 truncate">{account.username}</div>
        </div>
        {unreadTotal > 0 && <Badge tone="blue">{unreadTotal} unread</Badge>}
        <Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setTick((t) => t + 1)}>
          <RefreshCw size={13} /> Refresh
        </Btn>
        <Btn
          variant="primary"
          className="px-3 py-1.5 text-xs"
          onClick={() => setCompose({ mode: "new", to: "", cc: "", subject: "", body: "" })}
        >
          <Plus size={13} /> Compose
        </Btn>
        <button
          onClick={handleDisconnect}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
          aria-label="Disconnect Microsoft account"
          title="Disconnect"
        >
          <LogOut size={15} />
        </button>
      </Card>

      <div className="grid lg:grid-cols-[190px_minmax(0,1fr)] gap-4">
        {/* folder rail */}
        <Card className="p-2 h-fit lg:sticky lg:top-4">
          <div className="flex lg:flex-col gap-1 overflow-x-auto scroll-thin">
            {folders.map((f) => {
              const isActive = !activeSearch && f.id === folderId;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setActiveSearch("");
                    setSearchBox("");
                    setFolderId(f.id);
                    setSelected(null);
                  }}
                  className={
                    "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition text-left whitespace-nowrap " +
                    (isActive
                      ? "bg-violet-50 text-violet-700 border border-violet-100"
                      : "text-slate-600 hover:bg-gray-100 border border-transparent")
                  }
                >
                  <span className="flex-1 truncate">{f.displayName}</span>
                  {f.unreadItemCount > 0 && (
                    <span className="text-[10px] font-extrabold rounded-full bg-violet-100 text-violet-700 px-1.5 py-0.5">
                      {f.unreadItemCount}
                    </span>
                  )}
                </button>
              );
            })}
            {!folders.length && (
              <div className="p-3 text-xs text-slate-400">Loading folders…</div>
            )}
          </div>
        </Card>

        {/* list + reading pane */}
        <div className="min-w-0">
          {/* search */}
          <form
            className="flex gap-2 mb-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSelected(null);
              setActiveSearch(searchBox.trim());
            }}
          >
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <MiniInput
                value={searchBox}
                onChange={(e) => setSearchBox(e.target.value)}
                placeholder="Search all mail…"
                aria-label="Search mail"
                className="w-full pl-9"
              />
            </div>
            <Btn variant="ghost" className="px-4 py-2 text-sm" type="submit">Search</Btn>
            {activeSearch && (
              <Btn
                variant="ghost"
                className="px-3 py-2 text-sm"
                type="button"
                onClick={() => { setActiveSearch(""); setSearchBox(""); }}
              >
                <X size={14} /> Clear
              </Btn>
            )}
          </form>

          {activeSearch && (
            <div className="text-[11px] text-slate-400 mb-2">
              Results for “{activeSearch}” across every folder, ordered by relevance —
              Microsoft Graph can't sort search results by date.
            </div>
          )}

          {err ? (
            <SetupCard Card={Card} Btn={Btn} error={err} onConnect={handleConnect} busy={busy} />
          ) : selected ? (
            <ReadingPane
              Card={Card}
              Btn={Btn}
              Badge={Badge}
              message={selected}
              showImages={showImages}
              setShowImages={setShowImages}
              busy={busy}
              onBack={() => setSelected(null)}
              onReply={(all) =>
                setCompose({ mode: all ? "replyAll" : "reply", id: selected.id, body: "", subject: selected.subject })
              }
              onForward={() =>
                setCompose({ mode: "forward", id: selected.id, to: "", body: "", subject: selected.subject })
              }
              onFlag={() =>
                act(
                  (selected.flag?.flagStatus === "flagged" ? "Unflagged" : "Flagged"),
                  async () => {
                    const next = selected.flag?.flagStatus !== "flagged";
                    await ms.setFlag(selected.id, next);
                    setSelected((c) => ({ ...c, flag: { flagStatus: next ? "flagged" : "notFlagged" } }));
                  }
                )
              }
              onArchive={() =>
                act("Archived", () => ms.moveMessage(selected.id, "archive"), { removes: true, id: selected.id })
              }
              onDelete={() =>
                act("Moved to Deleted Items", () => ms.deleteMessage(selected.id), { removes: true, id: selected.id })
              }
              onDownload={downloadAttachment}
            />
          ) : messages === null ? (
            <Card className="p-10 text-center text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin mx-auto mb-3 text-violet-500" />
              Loading {activeSearch ? "results" : activeFolder?.displayName || "mail"}…
            </Card>
          ) : messages.length === 0 ? (
            <Card className="p-10 text-center">
              <span className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-3">
                <Inbox size={22} />
              </span>
              <div className="text-sm font-bold text-slate-700">
                {activeSearch ? "Nothing matched that search" : "Nothing here"}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {activeSearch ? "Try a different word or phrase." : "This folder is empty."}
              </div>
            </Card>
          ) : (
            <Card className="divide-y divide-gray-200 overflow-hidden">
              {messages.map((m) => (
                <button
                  key={m.id}
                  onClick={() => openMessage(m)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex gap-3 items-start"
                >
                  <span
                    className={
                      "mt-1.5 w-2 h-2 rounded-full shrink-0 " +
                      (m.isRead ? "bg-transparent" : "bg-violet-500")
                    }
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={
                          "truncate text-sm " +
                          (m.isRead ? "text-slate-600 font-medium" : "text-slate-900 font-extrabold")
                        }
                      >
                        {personName(m.from) || "(unknown sender)"}
                      </span>
                      {m.hasAttachments && <Paperclip size={12} className="text-slate-400 shrink-0" />}
                      {m.flag?.flagStatus === "flagged" && (
                        <Star size={12} className="text-amber-500 shrink-0" fill="currentColor" />
                      )}
                      <span className="ml-auto text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                        {relTime(m.receivedDateTime || m.sentDateTime)}
                      </span>
                    </span>
                    <span
                      className={
                        "block truncate text-sm mt-0.5 " +
                        (m.isRead ? "text-slate-500" : "text-slate-800 font-semibold")
                      }
                    >
                      {m.subject || "(no subject)"}
                    </span>
                    <span className="block truncate text-[11px] text-slate-400 mt-0.5">
                      {m.bodyPreview}
                    </span>
                  </span>
                </button>
              ))}
            </Card>
          )}
        </div>
      </div>

      {compose && (
        <ComposeModal
          Card={Card}
          Btn={Btn}
          MiniInput={MiniInput}
          value={compose}
          onChange={setCompose}
          onClose={() => setCompose(null)}
          onSend={sendCompose}
          busy={busy}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------- reading pane ---

function ReadingPane({
  Card, Btn, Badge, message, showImages, setShowImages, busy,
  onBack, onReply, onForward, onFlag, onArchive, onDelete, onDownload,
}) {
  if (message.__loading) {
    return (
      <Card className="p-10 text-center text-sm text-slate-400">
        <Loader2 size={18} className="animate-spin mx-auto mb-3 text-violet-500" />
        Opening…
      </Card>
    );
  }

  const flagged = message.flag?.flagStatus === "flagged";

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={onBack}>
          <ChevronLeft size={13} /> Back
        </Btn>
        <div className="flex-1" />
        <Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => onReply(false)} disabled={busy}>
          <Reply size={13} /> Reply
        </Btn>
        <Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => onReply(true)} disabled={busy}>
          <ReplyAll size={13} /> Reply all
        </Btn>
        <Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={onForward} disabled={busy}>
          <Forward size={13} /> Forward
        </Btn>
        <button
          onClick={onFlag}
          disabled={busy}
          className={"p-1.5 rounded-lg transition " + (flagged ? "text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50")}
          aria-label={flagged ? "Remove flag" : "Flag message"}
          title={flagged ? "Remove flag" : "Flag"}
        >
          <Star size={15} fill={flagged ? "currentColor" : "none"} />
        </button>
        <button
          onClick={onArchive}
          disabled={busy}
          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition"
          aria-label="Archive message"
          title="Archive"
        >
          <Archive size={15} />
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
          aria-label="Delete message"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
        {message.subject || "(no subject)"}
      </h2>

      <div className="mt-2 text-xs text-slate-500 space-y-0.5">
        <div>
          <span className="font-bold text-slate-700">{personName(message.from)}</span>{" "}
          <span className="text-slate-400">&lt;{personAddress(message.from)}&gt;</span>
        </div>
        {message.toRecipients?.length > 0 && (
          <div className="text-slate-400">To: {joinNames(message.toRecipients)}</div>
        )}
        {message.ccRecipients?.length > 0 && (
          <div className="text-slate-400">Cc: {joinNames(message.ccRecipients)}</div>
        )}
        <div className="text-slate-400">{fullTime(message.receivedDateTime || message.sentDateTime)}</div>
      </div>

      {message.attachments?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.attachments
            .filter((a) => !a.isInline)
            .map((a) => (
              <button
                key={a.id}
                onClick={() => onDownload(a)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full bg-violet-50 text-violet-700 px-2.5 py-1 hover:bg-violet-100 transition max-w-[260px]"
                title={"Download " + a.name}
              >
                <Download size={12} className="shrink-0" />
                <span className="truncate">{a.name}</span>
                <span className="text-violet-400 shrink-0">{fileSize(a.size)}</span>
              </button>
            ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {!showImages && (
          <button
            onClick={() => setShowImages(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 hover:bg-amber-100 transition"
          >
            <ImageOff size={12} /> Images blocked — show them
          </button>
        )}
        {message.webLink && (
          <a
            href={message.webLink}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-violet-600 transition"
          >
            <ExternalLink size={12} /> Open in Outlook
          </a>
        )}
      </div>

      <div className="mt-3">
        <BodyFrame message={message} showImages={showImages} />
      </div>
    </Card>
  );
}

// --------------------------------------------------------------- composer ---

function ComposeModal({ Card, Btn, MiniInput, value, onChange, onClose, onSend, busy }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const isReply = value.mode === "reply" || value.mode === "replyAll";
  const isForward = value.mode === "forward";

  const heading =
    value.mode === "replyAll" ? "Reply to everyone"
      : value.mode === "reply" ? "Reply"
      : isForward ? "Forward"
      : "New message";

  const canSend = isReply ? Boolean(value.body?.trim()) : Boolean(value.to?.trim());

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto scroll-thin rounded-b-none sm:rounded-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 sticky top-0 bg-inherit">
          <Send size={15} className="text-violet-600" />
          <div className="font-extrabold text-sm text-slate-900 flex-1">{heading}</div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {isReply ? (
            <div className="text-xs text-slate-400">
              Replying to “{value.subject || "(no subject)"}” — Outlook keeps the original thread and
              recipients.
            </div>
          ) : (
            <>
              <MiniInput
                value={value.to || ""}
                onChange={(e) => set({ to: e.target.value })}
                placeholder="To — separate addresses with commas"
                aria-label="To"
                type="text"
                className="w-full"
                autoFocus
              />
              {!isForward && (
                <>
                  <MiniInput
                    value={value.cc || ""}
                    onChange={(e) => set({ cc: e.target.value })}
                    placeholder="Cc (optional)"
                    aria-label="Cc"
                    className="w-full"
                  />
                  <MiniInput
                    value={value.subject || ""}
                    onChange={(e) => set({ subject: e.target.value })}
                    placeholder="Subject"
                    aria-label="Subject"
                    className="w-full"
                  />
                </>
              )}
              {isForward && (
                <div className="text-xs text-slate-400">
                  Forwarding “{value.subject || "(no subject)"}” with its attachments.
                </div>
              )}
            </>
          )}

          <textarea
            value={value.body || ""}
            onChange={(e) => set({ body: e.target.value })}
            placeholder={isReply || isForward ? "Add a note…" : "Write your message…"}
            aria-label="Message body"
            rows={10}
            autoFocus={isReply}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none resize-y"
          />
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200">
          <Btn variant="primary" onClick={onSend} disabled={busy || !canSend}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send
          </Btn>
          <Btn variant="ghost" onClick={onClose} disabled={busy}>Cancel</Btn>
          <span className="ml-auto text-[11px] text-slate-400">Sent from your Microsoft 365 account</span>
        </div>
      </Card>
    </div>
  );
}
