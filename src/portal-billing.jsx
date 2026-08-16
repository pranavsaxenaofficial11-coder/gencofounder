// ============================================================================
// src/portal-billing.jsx — what the AI actually costs, and who spent it
// ============================================================================
// Every AI call in the app appends a row to orgs/{orgId}/usage with the token
// counts the provider reported. This module reads that ledger back.
//
// Two deliberate choices worth knowing:
//
//   Costs are recomputed at read time from the current rate card, not frozen
//   at write time. So when the founder corrects a price, the whole history
//   re-prices — which is what someone wants when they ask "what would this
//   have cost us at our real rate?"
//
//   Rows whose token counts came from an estimate rather than the provider
//   are counted and labelled. A number that is a guess says so.
//
// Role split: a Founder or Admin sees the whole workspace; a Team Member sees
// only their own spend. That is enforced in firestore.rules, not just here.
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  CreditCard, Coins, Cpu, Activity, AlertTriangle, Save, Pencil, X, Loader2,
  TrendingUp, Info,
} from "lucide-react";
import { onUsage, onRates, saveRates } from "./org.js";
import {
  DEFAULT_RATES, estimateCostUsd, monthKeyOf, byMember, byModel, byMonth,
  money, compactNum, rateFor,
} from "./usage.js";
import { ui } from "./portal-ui.js";
import { useOrg, WorkspaceGate, WorkspaceLine } from "./portal-org.jsx";

const monthLabel = (key) => {
  const [y, m] = String(key || "").split("-");
  if (!y || !m) return key || "";
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
};

export function BillingModule({ module, user, company }) {
  const {
    ModuleShell, Card, Btn, Badge, MiniInput, SpotlightCard, AnimatedContent,
    CountUp, useTheme, companyLineFrom,
  } = ui();
  const { notify } = useTheme();

  const orgState = useOrg(user, company);
  const { orgId, org, members } = orgState;

  const canSeeAll = user?.role === "Founder" || user?.role === "Admin";

  const [rows, setRows] = useState(null);
  const [rates, setRates] = useState({});
  const [month, setMonth] = useState(monthKeyOf());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) return undefined;
    return onUsage(orgId, { scopeUid: canSeeAll ? undefined : user?.uid }, setRows);
  }, [orgId, canSeeAll, user?.uid]);

  useEffect(() => {
    if (!orgId) return undefined;
    return onRates(orgId, (r) => setRates(r || {}));
  }, [orgId]);

  // Re-price the whole ledger against the current rate card.
  const priced = useMemo(
    () =>
      (rows || []).map((r) => ({
        ...r,
        costUsd: estimateCostUsd(r.model, r.promptTokens, r.completionTokens, rates),
      })),
    [rows, rates]
  );

  const months = useMemo(() => {
    const set = new Set(priced.map((r) => r.monthKey).filter(Boolean));
    set.add(monthKeyOf());
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [priced]);

  const monthRows = useMemo(() => priced.filter((r) => r.monthKey === month), [priced, month]);

  const totals = useMemo(() => {
    const costUsd = monthRows.reduce((n, r) => n + (r.costUsd || 0), 0);
    const tokens = monthRows.reduce((n, r) => n + (r.totalTokens || 0), 0);
    const estimated = monthRows.filter((r) => r.estimated).length;
    return { costUsd, tokens, calls: monthRows.length, estimated };
  }, [monthRows]);

  const perMember = useMemo(() => byMember(monthRows), [monthRows]);
  const perModel = useMemo(() => byModel(monthRows), [monthRows]);
  const trend = useMemo(
    () => byMonth(priced).map((m) => ({ ...m, label: monthLabel(m.monthKey) })),
    [priced]
  );

  const memberById = useMemo(() => {
    const map = new Map();
    for (const m of members || []) if (m.uid) map.set(m.uid, m);
    return map;
  }, [members]);

  // Every model that appears in the ledger, plus the shipped defaults, so the
  // founder can price something before it has ever been called.
  const rateKeys = useMemo(() => {
    const set = new Set([...Object.keys(DEFAULT_RATES), ...Object.keys(rates || {})]);
    for (const r of priced) if (r.model) set.add(r.model);
    return [...set].sort();
  }, [rates, priced]);

  function startEditing() {
    const seed = {};
    for (const k of rateKeys) {
      const r = rateFor(k, rates);
      seed[k] = { in: r.in || 0, out: r.out || 0 };
    }
    setDraft(seed);
    setEditing(true);
  }

  async function persistRates() {
    setSaving(true);
    try {
      const clean = {};
      for (const [k, v] of Object.entries(draft)) {
        const i = Number(v.in) || 0;
        const o = Number(v.out) || 0;
        clean[k] = { in: i, out: o };
      }
      await saveRates(orgId, clean);
      setEditing(false);
      notify({ tone: "success", title: "Rate card saved", body: "Past spend has been re-priced." });
    } catch (e) {
      notify({ tone: "error", title: "Couldn't save rates", body: e?.message || String(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <WorkspaceGate state={orgState} user={user}>
        <>
          <WorkspaceLine org={org} members={members} />

          {!canSeeAll && (
            <div className="flex items-start gap-2 text-xs text-slate-400 mb-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
              <Info size={14} className="mt-0.5 shrink-0 text-violet-500" />
              <span>
                This is your own AI usage. Workspace-wide spend is visible to founders and admins.
              </span>
            </div>
          )}

          {/* month picker */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Billing month
            </span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label="Billing month"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-bold focus:border-violet-500 focus:outline-none"
            >
              {months.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
            {totals.estimated > 0 && (
              <Badge tone="amber">
                {totals.estimated} of {totals.calls} estimated
              </Badge>
            )}
          </div>

          {/* headline numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Spend", node: money(totals.costUsd), icon: Coins },
              { label: "AI calls", to: totals.calls, icon: Activity },
              { label: "Tokens", node: compactNum(totals.tokens), icon: Cpu },
              { label: canSeeAll ? "People billing" : "Your calls", to: canSeeAll ? perMember.length : totals.calls, icon: CreditCard },
            ].map((k, i) => (
              <AnimatedContent key={k.label} distance={30} duration={0.5} ease="power3.out" threshold={0.05} delay={i * 0.07}>
                <SpotlightCard
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 h-full"
                  spotlightColor="rgba(124, 58, 237, 0.14)"
                >
                  <div className="flex items-center gap-2 text-slate-400">
                    <k.icon size={15} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">{k.label}</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                    {k.node !== undefined ? k.node : <CountUp to={k.to} duration={1.2} />}
                  </div>
                </SpotlightCard>
              </AnimatedContent>
            ))}
          </div>

          {rows === null ? (
            <Card className="p-10 text-center text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin mx-auto mb-3 text-violet-500" />
              Loading your usage…
            </Card>
          ) : priced.length === 0 ? (
            <Card className="p-10 text-center">
              <span className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-3">
                <CreditCard size={22} />
              </span>
              <div className="text-sm font-bold text-slate-700">No AI usage recorded yet</div>
              <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Every call to the AI co-founder is logged here with its token count and cost.
                Ask the copilot something and this page fills in.
              </div>
            </Card>
          ) : (
            <div className="space-y-5">
              {/* trend */}
              {trend.length > 1 && (
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={15} className="text-violet-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">Spend by month</h3>
                  </div>
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <AreaChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                        <defs>
                          <linearGradient id="billFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--fg-muted)" }} tickLine={false} axisLine={false} width={56}
                          tickFormatter={(v) => "$" + Number(v).toFixed(2)} />
                        <Tooltip
                          formatter={(v) => [money(v), "Spend"]}
                          contentStyle={{ borderRadius: 12, fontSize: 12 }}
                        />
                        <Area type="monotone" dataKey="costUsd" stroke="var(--brand)" strokeWidth={2} fill="url(#billFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* per person */}
              <Card className="p-5">
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                  {canSeeAll ? "Spend by person" : "Your spend"}
                </h3>
                <p className="text-xs text-slate-400 mb-4">{monthLabel(month)}</p>

                {perMember.length === 0 ? (
                  <div className="text-sm text-slate-400 py-6 text-center">
                    Nothing billed in {monthLabel(month)}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {perMember.map((m) => {
                      const rec = memberById.get(m.uid);
                      const budget = Number(rec?.monthlyBudgetUsd) || 0;
                      const pct = budget > 0 ? Math.min(100, (m.costUsd / budget) * 100) : 0;
                      const over = budget > 0 && m.costUsd > budget;
                      return (
                        <div key={m.uid || m.name} className="rounded-xl border border-gray-200 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 truncate">
                              {rec?.name || m.name || "Unknown"}
                            </span>
                            {rec?.role && <Badge tone={rec.role === "Founder" ? "blue" : rec.role === "Admin" ? "amber" : "emerald"}>{rec.role}</Badge>}
                            {m.estimatedCalls > 0 && <Badge tone="amber">{m.estimatedCalls} estimated</Badge>}
                            {over && <Badge tone="red">over budget</Badge>}
                            <span className="ml-auto text-sm font-extrabold text-slate-900">
                              {money(m.costUsd)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {m.calls} {m.calls === 1 ? "call" : "calls"} ·{" "}
                            {compactNum(m.promptTokens)} in / {compactNum(m.completionTokens)} out
                            {budget > 0 && <> · budget {money(budget)}</>}
                          </div>
                          {budget > 0 && (
                            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden mt-2">
                              <div
                                className={"h-full rounded-full transition-all " + (over ? "bg-red-500" : "bg-violet-500")}
                                style={{ width: Math.max(2, pct) + "%" }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* per model */}
              <Card className="p-5">
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">Spend by model</h3>
                <p className="text-xs text-slate-400 mb-4">{monthLabel(month)}</p>
                {perModel.length === 0 ? (
                  <div className="text-sm text-slate-400 py-6 text-center">Nothing billed this month.</div>
                ) : (
                  <div className="overflow-x-auto scroll-thin">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 text-left">
                          <th className="pb-2 pr-3">Model</th>
                          <th className="pb-2 pr-3 text-right">Calls</th>
                          <th className="pb-2 pr-3 text-right">Tokens</th>
                          <th className="pb-2 text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perModel.map((m) => {
                          const r = rateFor(m.model, rates);
                          return (
                            <tr key={m.model} className="border-t border-gray-200">
                              <td className="py-2 pr-3">
                                <span className="font-semibold text-slate-700 break-all">{m.model}</span>
                                {r.unknown && (
                                  <Badge tone="amber" className="ml-2">rate not set</Badge>
                                )}
                              </td>
                              <td className="py-2 pr-3 text-right text-slate-500">{m.calls}</td>
                              <td className="py-2 pr-3 text-right text-slate-500">{compactNum(m.totalTokens)}</td>
                              <td className="py-2 text-right font-extrabold text-slate-900">{money(m.costUsd)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* rate card */}
          {canSeeAll && (
            <Card className="p-5 mt-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-extrabold text-slate-900 flex-1">Rate card</h3>
                {editing ? (
                  <>
                    <Btn variant="primary" className="px-3 py-1.5 text-xs" onClick={persistRates} disabled={saving}>
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                    </Btn>
                    <Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setEditing(false)} disabled={saving}>
                      <X size={13} /> Cancel
                    </Btn>
                  </>
                ) : (
                  <Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={startEditing}>
                    <Pencil size={13} /> Edit rates
                  </Btn>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-4">
                USD per million tokens. These are the prices your bill is calculated from — set them to
                what you actually pay. Editing them re-prices every past month.
              </p>

              <div className="overflow-x-auto scroll-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 text-left">
                      <th className="pb-2 pr-3">Model</th>
                      <th className="pb-2 pr-3 text-right">Input $/M</th>
                      <th className="pb-2 text-right">Output $/M</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateKeys.map((k) => {
                      const r = rateFor(k, rates);
                      return (
                        <tr key={k} className="border-t border-gray-200">
                          <td className="py-2 pr-3">
                            <span className="font-semibold text-slate-700 break-all">{k}</span>
                            {r.note && <div className="text-[10px] text-slate-400">{r.note}</div>}
                          </td>
                          <td className="py-2 pr-3 text-right">
                            {editing ? (
                              <MiniInput
                                type="number"
                                step="0.01"
                                min="0"
                                value={draft[k]?.in ?? 0}
                                onChange={(e) => setDraft((d) => ({ ...d, [k]: { ...d[k], in: e.target.value } }))}
                                aria-label={"Input rate for " + k}
                                className="w-24 text-right"
                              />
                            ) : (
                              <span className="text-slate-500">${Number(r.in || 0).toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-2 text-right">
                            {editing ? (
                              <MiniInput
                                type="number"
                                step="0.01"
                                min="0"
                                value={draft[k]?.out ?? 0}
                                onChange={(e) => setDraft((d) => ({ ...d, [k]: { ...d[k], out: e.target.value } }))}
                                aria-label={"Output rate for " + k}
                                className="w-24 text-right"
                              />
                            ) : (
                              <span className="text-slate-500">${Number(r.out || 0).toFixed(2)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totals.estimated > 0 && (
                <div className="flex items-start gap-2 text-[11px] text-slate-400 mt-4">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                  <span>
                    {totals.estimated} call{totals.estimated === 1 ? "" : "s"} this month had no token
                    count from the provider, so the tokens were estimated from message length. Those
                    rows are approximate.
                  </span>
                </div>
              )}
            </Card>
          )}
        </>
      </WorkspaceGate>
    </ModuleShell>
  );
}
