// ============================================================================
// src/portal-team.jsx — Team & Access: the roster the founder administers
// ============================================================================
// This replaces the earlier roster that lived at companies/{uid}/team. That
// one was private to the founder by construction, which meant a teammate could
// never see their own record and the founder could never see a teammate's
// spend. The roster now lives in the shared workspace (see src/org.js), and a
// one-click import is offered for anyone already on the old list.
//
// Tasks are unchanged: they still live at companies/{founderUid}/tasks, which
// is what the Delegate & Tasks module reads.
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Users, ShieldCheck, ListChecks, Check, Plus, X, AlertTriangle, KeyRound,
  Copy, RefreshCw, Mail, Pencil, Save, Coins, UserPlus, Loader2, Download,
} from "lucide-react";
import {
  addInvitedMember, updateMember, removeMember, rotateJoinCode, onUsage,
  onRates, MEMBER_ROLES,
} from "./org.js";
import { estimateCostUsd, monthKeyOf, money } from "./usage.js";
import { ui } from "./portal-ui.js";
import { useOrg, WorkspaceGate, WorkspaceLine } from "./portal-org.jsx";

const ROLE_TONE = { Founder: "blue", Admin: "amber", "Team Member": "emerald" };

// Only a founder or admin may change roles, edit records, or remove people.
// This is the UI half of the guard; firestore.rules is the half that matters.
const canManage = (user) => user?.role === "Founder" || user?.role === "Admin";

export function TeamModule({ module, user, company, setActive }) {
  const {
    ModuleShell, Card, Btn, Badge, MiniInput, Avatar, SpotlightCard,
    AnimatedContent, CountUp, useTheme, companyLineFrom, useSub, EMAIL_RE,
  } = ui();
  const { notify } = useTheme();

  const orgState = useOrg(user, company);
  const { orgId, org, members } = orgState;
  const manage = canManage(user);

  // Tasks stay where they always were.
  const [tasks, taskApi] = useSub(user?.uid, "tasks");
  // The pre-workspace roster, kept only so it can be imported once.
  const [legacy] = useSub(manage ? user?.uid : null, "team");

  const [usageRows, setUsageRows] = useState([]);
  // The same rate card Billing prices against — otherwise the spend shown here
  // and the spend shown there would disagree for the same person.
  const [rates, setRates] = useState({});
  const [form, setForm] = useState({ name: "", email: "", role: "Team Member", title: "" });
  const [formErr, setFormErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orgId || !manage) return undefined;
    return onUsage(orgId, {}, setUsageRows);
  }, [orgId, manage]);

  useEffect(() => {
    if (!orgId || !manage) return undefined;
    return onRates(orgId, (r) => setRates(r || {}));
  }, [orgId, manage]);

  const thisMonth = monthKeyOf();
  const spendByUid = useMemo(() => {
    const map = new Map();
    for (const r of usageRows) {
      if (r.monthKey !== thisMonth || !r.uid) continue;
      const cost = estimateCostUsd(r.model, r.promptTokens, r.completionTokens, rates);
      map.set(r.uid, (map.get(r.uid) || 0) + cost);
    }
    return map;
  }, [usageRows, thisMonth, rates]);

  // Someone the founder invited by email who has since signed in shows up
  // twice — once as the placeholder, once as the real account. Fold the
  // placeholder away rather than showing a confusing duplicate.
  const { roster, resolvedInvites } = useMemo(() => {
    const all = members || [];
    const joinedEmails = new Set(
      all.filter((m) => m.uid).map((m) => (m.email || "").toLowerCase()).filter(Boolean)
    );
    const resolved = all.filter(
      (m) => !m.uid && m.email && joinedEmails.has(m.email.toLowerCase())
    );
    const resolvedIds = new Set(resolved.map((m) => m.id));
    return { roster: all.filter((m) => !resolvedIds.has(m.id)), resolvedInvites: resolved };
  }, [members]);

  const taskCount = (m) =>
    (tasks || []).filter((t) => t.assigneeName === m.name && (t.status || "todo") !== "done").length;
  const doneCount = (m) =>
    (tasks || []).filter((t) => t.assigneeName === m.name && t.status === "done").length;

  async function addTeammate() {
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) return setFormErr("Add a name.");
    if (!EMAIL_RE.test(email)) return setFormErr("That email doesn't look right.");
    if (roster.some((m) => (m.email || "").toLowerCase() === email.toLowerCase()))
      return setFormErr("Someone with that email is already on the team.");
    setFormErr("");
    setBusy(true);
    try {
      await addInvitedMember(orgId, { ...form, name, email });
      notify({
        tone: "success",
        title: name + " added",
        body: "Share the invite code below so they can join with " + email + ".",
      });
      setForm({ name: "", email: "", role: "Team Member", title: "" });
    } catch (e) {
      notify({ tone: "error", title: "Couldn't add them", body: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function patch(m, data, label) {
    try {
      await updateMember(orgId, m.id, data);
      if (label) notify({ tone: "info", title: label });
      return true;
    } catch (e) {
      notify({ tone: "error", title: "Update failed", body: e?.message || String(e) });
      return false;
    }
  }

  async function remove(m) {
    try {
      await removeMember(orgId, m.id);
      notify({ tone: "info", title: (m.name || "They") + " removed from the team" });
    } catch (e) {
      notify({ tone: "error", title: "Couldn't remove", body: e?.message || String(e) });
    }
  }

  async function assignTask(m) {
    const t = taskTitle.trim();
    if (!t) return;
    const ok = await taskApi.add({
      title: t, status: "todo", ai: false,
      assigneeName: m.name, assigneeEmail: m.email || null,
    });
    if (!ok) return;
    notify({
      tone: "success",
      title: "Task assigned",
      body: `“${t}” → ${m.name}`,
      actionLabel: "Open tasks",
      onAction: () => setActive("tasks"),
    });
    setTaskTitle("");
    setAssigningId(null);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(org?.joinCode || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify({ tone: "info", title: "Copy the code manually", body: org?.joinCode || "" });
    }
  }

  async function newCode() {
    setBusy(true);
    try {
      const code = await rotateJoinCode(orgId, {
        orgName: org?.name,
        ownerUid: org?.ownerUid,
        oldCode: org?.joinCode,
      });
      notify({ tone: "success", title: "New invite code", body: code + " — the old one no longer works." });
    } catch (e) {
      notify({ tone: "error", title: "Couldn't rotate the code", body: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function importLegacy() {
    const existing = new Set(roster.map((m) => (m.email || "").toLowerCase()).filter(Boolean));
    const pending = (legacy || []).filter(
      (m) => m.email && !existing.has(m.email.toLowerCase())
    );
    if (!pending.length) return;
    setBusy(true);
    try {
      for (const m of pending) {
        await addInvitedMember(orgId, {
          name: m.name, email: m.email, role: m.role || "Team Member", title: m.title || null,
        });
      }
      notify({
        tone: "success",
        title: `Imported ${pending.length} ${pending.length === 1 ? "person" : "people"}`,
        body: "Share your invite code so they can link their accounts.",
      });
    } catch (e) {
      notify({ tone: "error", title: "Import stopped", body: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function cleanUpInvites() {
    setBusy(true);
    try {
      for (const m of resolvedInvites) await removeMember(orgId, m.id);
      notify({ tone: "info", title: "Tidied up", body: `${resolvedInvites.length} resolved invite(s) removed.` });
    } finally {
      setBusy(false);
    }
  }

  const importable = manage
    ? (legacy || []).filter((m) => {
        const e = (m.email || "").toLowerCase();
        return e && !roster.some((r) => (r.email || "").toLowerCase() === e);
      })
    : [];

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <WorkspaceGate state={orgState} user={user}>
        <>
          <WorkspaceLine org={org} members={members} />

          {/* headline counts */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: "People", to: roster.length, icon: Users },
              { label: "Admins", to: roster.filter((m) => m.role === "Founder" || m.role === "Admin").length, icon: ShieldCheck },
              { label: "Open tasks", to: (tasks || []).filter((t) => t.assigneeName && (t.status || "todo") !== "done").length, icon: ListChecks },
              { label: "Completed", to: (tasks || []).filter((t) => t.assigneeName && t.status === "done").length, icon: Check },
            ].map((k, i) => (
              <AnimatedContent key={k.label} distance={30} duration={0.5} ease="power3.out" threshold={0.05} delay={i * 0.07}>
                <SpotlightCard className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 h-full" spotlightColor="rgba(124, 58, 237, 0.14)">
                  <div className="flex items-center gap-2 text-slate-400">
                    <k.icon size={15} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">{k.label}</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                    <CountUp to={k.to} duration={1.2} />
                  </div>
                </SpotlightCard>
              </AnimatedContent>
            ))}
          </div>

          {/* invite code */}
          {manage && org?.joinCode && (
            <Card className="p-4 mb-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                  <KeyRound size={17} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900">Invite code</div>
                  <div className="text-[11px] text-slate-400">
                    Teammates enter this to join your workspace. Anyone with the code can join, so
                    rotate it if it gets out.
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <code className="text-lg font-extrabold tracking-[0.25em] text-violet-700 bg-violet-50 rounded-lg px-3 py-1.5">
                    {org.joinCode}
                  </code>
                  <Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={copyCode}>
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
                  </Btn>
                  <Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={newCode} disabled={busy}>
                    <RefreshCw size={13} /> New code
                  </Btn>
                </div>
              </div>
            </Card>
          )}

          {/* one-time import from the old roster */}
          {manage && importable.length > 0 && (
            <Card className="p-4 mb-5 flex flex-wrap items-center gap-3">
              <Download size={16} className="text-violet-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold text-slate-900">
                  {importable.length} {importable.length === 1 ? "person" : "people"} on your old roster
                </div>
                <div className="text-[11px] text-slate-400">
                  Bring them into the shared workspace so you can track their tasks and AI spend.
                </div>
              </div>
              <Btn variant="primary" className="px-3 py-1.5 text-xs" onClick={importLegacy} disabled={busy}>
                {busy ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} Import
              </Btn>
            </Card>
          )}

          {manage && resolvedInvites.length > 0 && (
            <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-2">
              {resolvedInvites.length} invite{resolvedInvites.length === 1 ? " has" : "s have"} been
              taken up and hidden.
              <button onClick={cleanUpInvites} className="underline hover:text-violet-600" disabled={busy}>
                Remove {resolvedInvites.length === 1 ? "it" : "them"}
              </button>
            </div>
          )}

          {/* add a teammate */}
          {manage && (
            <Card className="p-4 mb-5">
              <div className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <Plus size={15} className="text-violet-600" /> Add a teammate
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <MiniInput
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); if (formErr) setFormErr(""); }}
                  placeholder="Full name" aria-label="Teammate name"
                />
                <MiniInput
                  value={form.email} type="email"
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); if (formErr) setFormErr(""); }}
                  placeholder="name@company.com" aria-label="Teammate email"
                />
                <MiniInput
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Title (optional)" aria-label="Teammate title"
                />
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  aria-label="Teammate role"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                >
                  {MEMBER_ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <Btn
                  variant="primary" className="py-2 text-sm" onClick={addTeammate}
                  disabled={busy || !form.name.trim() || !form.email.trim()}
                >
                  <Plus size={14} /> Add
                </Btn>
              </div>
              {formErr && (
                <div className="text-sm font-semibold text-red-600 flex items-center gap-1.5 mt-2.5" role="alert">
                  <AlertTriangle size={14} /> {formErr}
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-2.5">
                Adding someone records them here and lets you assign work. They get full access by
                signing up and entering your invite code.
              </p>
            </Card>
          )}

          {/* roster */}
          {members === null ? (
            <Card className="p-8 text-center text-sm text-slate-400">Loading your team…</Card>
          ) : (
            <div className="space-y-3">
              {roster.map((m, i) => {
                const spend = spendByUid.get(m.uid) || 0;
                const isSelf = m.uid && m.uid === user?.uid;
                const isEditing = editingId === m.id;
                return (
                  <AnimatedContent key={m.id} distance={24} duration={0.45} ease="power3.out" threshold={0.05} delay={Math.min(i, 6) * 0.05}>
                    <Card className="p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Avatar name={m.name} size={42} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 truncate">{m.name || "Unnamed"}</span>
                            {isSelf && <Badge tone="blue">You</Badge>}
                            {!m.uid && <Badge tone="amber">Invited</Badge>}
                            {m.mailUpn && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500" title={"Mailbox: " + m.mailUpn}>
                                <Mail size={12} /> mailbox linked
                              </span>
                            )}
                          </div>
                          <a
                            href={m.email ? "mailto:" + m.email : undefined}
                            className="text-xs text-slate-500 hover:text-violet-700 transition truncate block"
                          >
                            {m.email || "—"}
                          </a>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
                            {m.title && <span>{m.title}</span>}
                            {m.dept && <span>· {m.dept}</span>}
                            {m.phone && <span>· {m.phone}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {manage && (
                            <span className="text-[11px] text-slate-400 whitespace-nowrap" title="AI spend this month">
                              <Coins size={11} className="inline mb-0.5" />{" "}
                              <span className="font-bold text-slate-600">{money(spend)}</span>
                              {m.monthlyBudgetUsd > 0 && (
                                <span className={spend > m.monthlyBudgetUsd ? "text-red-500" : ""}>
                                  {" "}/ {money(m.monthlyBudgetUsd)}
                                </span>
                              )}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">
                            <span className="font-bold text-slate-600">{taskCount(m)}</span> open · {doneCount(m)} done
                          </span>

                          {manage && !isSelf ? (
                            <select
                              value={m.role || "Team Member"}
                              onChange={(e) => patch(m, { role: e.target.value }, `${m.name} is now ${e.target.value}`)}
                              aria-label={"Role for " + m.name}
                              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold focus:border-violet-500 focus:outline-none"
                            >
                              {MEMBER_ROLES.map((r) => <option key={r}>{r}</option>)}
                            </select>
                          ) : (
                            <Badge tone={ROLE_TONE[m.role] || "blue"}>{m.role}</Badge>
                          )}

                          {manage && (
                            <Btn
                              variant="ghost" className="px-3 py-1.5 text-xs"
                              onClick={() => { setEditingId(isEditing ? null : m.id); setAssigningId(null); }}
                            >
                              <Pencil size={13} /> {isEditing ? "Close" : "Details"}
                            </Btn>
                          )}
                          {manage && (
                            <Btn
                              variant="ghost" className="px-3 py-1.5 text-xs"
                              onClick={() => { setAssigningId(assigningId === m.id ? null : m.id); setTaskTitle(""); setEditingId(null); }}
                            >
                              <ListChecks size={13} /> Assign
                            </Btn>
                          )}
                          {manage && !isSelf && (
                            <button
                              onClick={() => remove(m)}
                              aria-label={"Remove " + m.name}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <MemberEditor
                          MiniInput={MiniInput}
                          Btn={Btn}
                          member={m}
                          onSave={async (data) => {
                            if (await patch(m, data, "Saved " + (data.name || m.name))) setEditingId(null);
                          }}
                          onCancel={() => setEditingId(null)}
                        />
                      )}

                      {assigningId === m.id && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2 anim-fadeUp">
                          <MiniInput
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && assignTask(m)}
                            placeholder={"What should " + (m.name || "they").split(" ")[0] + " work on?"}
                            aria-label={"Task for " + m.name}
                            className="flex-1 min-w-[220px]"
                            autoFocus
                          />
                          <Btn variant="primary" className="px-4 py-2 text-sm" onClick={() => assignTask(m)} disabled={!taskTitle.trim()}>
                            Assign
                          </Btn>
                          <Btn variant="ghost" className="px-3 py-2 text-sm" onClick={() => setAssigningId(null)}>Cancel</Btn>
                        </div>
                      )}

                      {taskCount(m) > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-1.5">
                          {(tasks || [])
                            .filter((t) => t.assigneeName === m.name && (t.status || "todo") !== "done")
                            .slice(0, 4)
                            .map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setActive("tasks")}
                                className="text-[11px] font-semibold rounded-full bg-violet-50 text-violet-700 px-2.5 py-1 hover:bg-violet-100 transition max-w-[240px] truncate"
                                title={t.title}
                              >
                                {t.title}
                              </button>
                            ))}
                          {taskCount(m) > 4 && (
                            <span className="text-[11px] text-slate-400 self-center">+{taskCount(m) - 4} more</span>
                          )}
                        </div>
                      )}
                    </Card>
                  </AnimatedContent>
                );
              })}

              {roster.length <= 1 && (
                <Card className="p-8 text-center">
                  <span className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-3">
                    <Users size={22} />
                  </span>
                  <div className="text-sm font-bold text-slate-700">It's just you so far</div>
                  <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {manage
                      ? "Add your co-founders and teammates above, then share the invite code so they can sign in."
                      : "Your founder hasn't added anyone else yet."}
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      </WorkspaceGate>
    </ModuleShell>
  );
}

// ---------------------------------------------------------- member editor ---

function MemberEditor({ MiniInput, Btn, member, onSave, onCancel }) {
  const [d, setD] = useState({
    name: member.name || "",
    email: member.email || "",
    title: member.title || "",
    dept: member.dept || "",
    phone: member.phone || "",
    startedAt: member.startedAt || "",
    monthlyBudgetUsd: member.monthlyBudgetUsd || 0,
  });
  const [saving, setSaving] = useState(false);
  const set = (patch) => setD({ ...d, ...patch });

  const fields = [
    { key: "name", label: "Full name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "title", label: "Job title", type: "text" },
    { key: "dept", label: "Department", type: "text" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "startedAt", label: "Start date", type: "date" },
    { key: "monthlyBudgetUsd", label: "Monthly AI budget (USD)", type: "number" },
  ];

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 anim-fadeUp">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              {f.label}
            </span>
            <MiniInput
              type={f.type}
              min={f.type === "number" ? "0" : undefined}
              step={f.type === "number" ? "1" : undefined}
              value={d[f.key] ?? ""}
              onChange={(e) => set({ [f.key]: e.target.value })}
              aria-label={f.label + " for " + (member.name || "member")}
              className="w-full mt-1"
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Btn
          variant="primary"
          className="px-4 py-2 text-sm"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave({
              name: d.name.trim(),
              email: (d.email || "").trim().toLowerCase() || null,
              title: d.title.trim() || null,
              dept: d.dept.trim() || null,
              phone: d.phone.trim() || null,
              startedAt: d.startedAt || null,
              monthlyBudgetUsd: Number(d.monthlyBudgetUsd) || 0,
            });
            setSaving(false);
          }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
        </Btn>
        <Btn variant="ghost" className="px-3 py-2 text-sm" onClick={onCancel} disabled={saving}>Cancel</Btn>
      </div>
    </div>
  );
}
