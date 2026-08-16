// ============================================================================
// src/portal-org.jsx — resolving which workspace the signed-in person is in
// ============================================================================
// Both the Team and Billing modules need the same three things: the workspace
// id, its document, and its member list. And both need the same answer to
// "what if this person isn't in a workspace yet?" — which differs by role:
//
//   Founder / Admin → their workspace is created on first visit, silently.
//   Team Member     → they need an invite code from their founder.
//
// That shared shape lives here so the two modules don't each grow their own
// slightly different version of it.
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { KeyRound, Loader2, Building2, AlertTriangle } from "lucide-react";
import { ensureOrg, getMyOrgId, onOrg, onMembers, joinOrgByCode } from "./org.js";
import { setUsageContext } from "./usage.js";
import { ui } from "./portal-ui.js";

/**
 * @returns { orgId, org, members, loading, error, isOwner, refresh }
 *          orgId === undefined while resolving, null when there is none.
 */
export function useOrg(user, company) {
  const [orgId, setOrgId] = useState(undefined);
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  const uid = user?.uid || null;
  const canOwn = user?.role === "Founder" || user?.role === "Admin";
  const companyName = company?.name || null;

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!uid) {
      setOrgId(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        let id = await getMyOrgId(uid);
        // A founder shouldn't have to press a button to get a workspace — it
        // is just the container their team lives in. ensureOrg is idempotent.
        if (!id && canOwn) id = await ensureOrg(user, companyName);
        if (alive) {
          setOrgId(id || null);
          setError(null);
          // The ledger needs the workspace id the moment it exists — a
          // founder's first visit is what creates it, and calls made before
          // that would otherwise go unbilled.
          setUsageContext({
            uid,
            name: user?.name || user?.email || "Unknown",
            orgId: id || null,
          });
        }
      } catch (e) {
        if (alive) {
          setError(e);
          setOrgId(null);
        }
      }
    })();
    return () => { alive = false; };
  }, [uid, canOwn, companyName, nonce, user]);

  useEffect(() => {
    if (!orgId) {
      setOrg(null);
      setMembers(orgId === null ? [] : null);
      return;
    }
    const offOrg = onOrg(orgId, setOrg);
    const offMembers = onMembers(orgId, setMembers);
    return () => { offOrg(); offMembers(); };
  }, [orgId]);

  return {
    orgId: orgId || null,
    org,
    members,
    loading: orgId === undefined || (Boolean(orgId) && members === null),
    error,
    isOwner: Boolean(orgId && user?.uid && org?.ownerUid === user.uid),
    refresh,
  };
}

/**
 * What a Team Member sees before they've joined anything: a box for the code
 * their founder gave them.
 */
export function JoinWorkspaceCard({ user, onJoined }) {
  const { Card, Btn, MiniInput, useTheme } = ui();
  const { notify } = useTheme();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function join() {
    const clean = code.trim();
    if (!clean) return setErr("Enter the code your founder gave you.");
    setBusy(true);
    setErr("");
    try {
      const { orgName } = await joinOrgByCode(user, clean);
      notify({ tone: "success", title: "You're in", body: "Joined " + (orgName || "the workspace") + "." });
      onJoined?.();
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-10 text-center max-w-lg mx-auto">
      <span className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-4">
        <KeyRound size={26} />
      </span>
      <div className="text-lg font-extrabold text-slate-900">Join your team's workspace</div>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
        Your founder has an invite code in their Team &amp; Access page. Enter it here to join —
        after that your tasks and your own AI spend show up in this portal.
      </p>
      <div className="flex gap-2 mt-6 max-w-xs mx-auto">
        <MiniInput
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); if (err) setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && join()}
          placeholder="ABC123"
          aria-label="Invite code"
          className="flex-1 text-center tracking-[0.3em] font-extrabold uppercase"
          maxLength={12}
        />
        <Btn variant="primary" onClick={join} disabled={busy || !code.trim()}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : "Join"}
        </Btn>
      </div>
      {err && (
        <div className="text-sm font-semibold text-red-600 flex items-center justify-center gap-1.5 mt-3" role="alert">
          <AlertTriangle size={14} /> {err}
        </div>
      )}
    </Card>
  );
}

/** Spinner / error / join-prompt, or the module's own content once resolved. */
export function WorkspaceGate({ state, user, children }) {
  const { Card } = ui();

  if (state.error) {
    return (
      <Card className="p-10 text-center max-w-lg mx-auto">
        <span className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={26} />
        </span>
        <div className="text-lg font-extrabold text-slate-900">Couldn't load your workspace</div>
        <p className="text-sm text-slate-500 mt-2">{state.error.message || String(state.error)}</p>
        <p className="text-[11px] text-slate-400 mt-3">
          If this just started after a deploy, check that the updated firestore.rules are published.
        </p>
      </Card>
    );
  }

  if (!state.orgId && state.loading) {
    return (
      <Card className="p-10 text-center text-sm text-slate-400">
        <Loader2 size={18} className="animate-spin mx-auto mb-3 text-violet-500" />
        Loading your workspace…
      </Card>
    );
  }

  if (!state.orgId) {
    return <JoinWorkspaceCard user={user} onJoined={state.refresh} />;
  }

  return children;
}

/** Little "Acme · 4 people" line the modules put under their title. */
export function WorkspaceLine({ org, members }) {
  const { Badge } = ui();
  if (!org) return null;
  const n = (members || []).length;
  return (
    <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
      <Building2 size={13} />
      <span className="font-semibold text-slate-600">{org.name}</span>
      <Badge tone="slate">{n} {n === 1 ? "person" : "people"}</Badge>
    </div>
  );
}
