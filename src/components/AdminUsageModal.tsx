"use client";

// Admin: one hospital's plan usage, add-on packs (grant one, e.g. after an
// offline UPI / bank payment) and the AI receptionist phone number.
// API: GET /admin/hospitals/:id/usage, POST /admin/hospitals/:id/packs,
//      PUT /admin/hospitals/:id/voice-number

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { X, MessageCircle, PhoneCall, Package, Loader2, Phone } from "lucide-react";

const fmt = (n: number) => (n ?? 0).toLocaleString("en-IN");
const dateIN = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
// "2026-11" -> "Nov 2026"
const monthIN = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

export default function AdminUsageModal({ hospital, onClose }: { hospital: { _id: string; name?: string }; onClose: () => void }) {
    const [usage, setUsage] = useState<any>(null);
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);
    const [packCode, setPackCode] = useState("wa-1000");
    const [pricePaid, setPricePaid] = useState("");
    const [note, setNote] = useState("");
    const [number, setNumber] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await api.get(`/admin/hospitals/${hospital._id}/usage`);
            setUsage(res.data);
            setError("");
        } catch (e: any) {
            setError(e.response?.data?.message || "Could not load usage");
        }
    }, [hospital._id]);

    useEffect(() => {
        load();
    }, [load]);

    const grant = async () => {
        setBusy(true);
        setMsg("");
        try {
            await api.post(`/admin/hospitals/${hospital._id}/packs`, {
                packCode,
                price: pricePaid ? Number(pricePaid) : 0,
                note: note || (pricePaid ? "Offline payment" : "Free / goodwill"),
            });
            setMsg("✅ Pack added. It's active now and valid for 6 months.");
            setPricePaid("");
            setNote("");
            await load();
        } catch (e: any) {
            setMsg(e.response?.data?.message || "Could not add the pack");
        } finally {
            setBusy(false);
        }
    };

    const saveNumber = async (num: string, opts: { enabled?: boolean; unlink?: boolean }) => {
        setBusy(true);
        setMsg("");
        try {
            await api.put(`/admin/hospitals/${hospital._id}/voice-number`, { number: num, ...opts });
            setMsg(opts.unlink ? "Number unlinked." : opts.enabled === false ? "AI calling paused for this number." : "✅ AI number saved.");
            setNumber("");
            await load();
        } catch (e: any) {
            setMsg(e.response?.data?.message || "Could not save the number");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Usage, packs and AI number">
            <div className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">{usage?.hospital?.name || hospital.name || "Hospital"}</h3>
                        <p className="text-sm text-slate-500">
                            {usage ? `${usage.plan.label} plan · ₹${fmt(usage.plan.priceMonthly)}/month · ${usage.plan.doctorsUsed}/${usage.plan.maxDoctors ?? "∞"} doctors · ${monthIN(usage.month)}` : "Loading…"}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                {msg && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">{msg}</p>}
                {!usage && !error && <p className="mt-6 flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</p>}

                {usage && (
                    <>
                        {/* This month */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-slate-100 p-4">
                                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><MessageCircle className="w-4 h-4 text-green-600" /> WhatsApp this month</p>
                                <p className="mt-1 text-xl font-black">{fmt(usage.whatsapp.planUsed)} <span className="text-sm text-slate-400">/ {fmt(usage.whatsapp.planLimit)}</span></p>
                                <p className="text-xs text-slate-500">
                                    Packs left {fmt(usage.whatsapp.packRemaining)} · grace {fmt(usage.whatsapp.graceUsed)} · not sent {fmt(usage.whatsapp.skipped)}
                                </p>
                                <p className="text-xs text-slate-500">
                                    30 days: {fmt((usage.whatsapp.delivery30d.delivered ?? 0) + (usage.whatsapp.delivery30d.read ?? 0))} delivered, {fmt((usage.whatsapp.delivery30d.failed ?? 0) + (usage.whatsapp.delivery30d.send_error ?? 0))} failed
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 p-4">
                                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><PhoneCall className="w-4 h-4 text-violet-600" /> AI minutes this month</p>
                                <p className="mt-1 text-xl font-black">{fmt(usage.ai.planUsedMinutes)} <span className="text-sm text-slate-400">/ {fmt(usage.ai.planMinutes)} min</span></p>
                                <p className="text-xs text-slate-500">
                                    {fmt(usage.ai.calls)} calls · packs left {fmt(usage.ai.packRemainingMinutes)} min · over {fmt(usage.ai.overageMinutes)} min
                                </p>
                            </div>
                        </div>

                        {/* Packs */}
                        <div className="mt-5 rounded-2xl border border-slate-100 p-4">
                            <p className="flex items-center gap-1.5 text-sm font-black text-slate-900"><Package className="w-4 h-4" /> Add-on packs</p>
                            {usage.packs.length === 0 ? (
                                <p className="mt-2 text-sm text-slate-500">None yet.</p>
                            ) : (
                                <ul className="mt-2 divide-y divide-slate-50 text-sm">
                                    {usage.packs.map((p: any) => (
                                        <li key={p.id} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 py-2">
                                            <span className="font-semibold">{p.label} <span className="text-xs font-normal text-slate-400">({p.source}{p.status === "pending" ? ", payment pending" : ""})</span></span>
                                            <span className="text-slate-600">
                                                {p.status === "pending" ? "not paid yet" : `${fmt(p.remaining)}${p.kind === "ai_minutes" ? " min" : ""} left${p.expiresAt ? ` · until ${dateIN(p.expiresAt)}` : ""}`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <select value={packCode} onChange={(e) => setPackCode(e.target.value)} className="sm:col-span-3 rounded-xl border border-slate-200 p-2.5 text-sm">
                                    {usage.catalog.map((c: any) => (
                                        <option key={c.code} value={c.code}>{c.label} (₹{fmt(c.price)} + GST)</option>
                                    ))}
                                </select>
                                <input value={pricePaid} onChange={(e) => setPricePaid(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder="Amount paid ₹ (0 = free)" className="rounded-xl border border-slate-200 p-2.5 text-sm" />
                                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (e.g. UPI ref)" className="rounded-xl border border-slate-200 p-2.5 text-sm" />
                                <button onClick={grant} disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                                    Add pack
                                </button>
                            </div>
                        </div>

                        {/* AI receptionist number */}
                        <div className="mt-5 rounded-2xl border border-slate-100 p-4">
                            <p className="flex items-center gap-1.5 text-sm font-black text-slate-900"><Phone className="w-4 h-4" /> AI receptionist number</p>
                            {usage.voiceNumbers?.length ? (
                                <ul className="mt-2 space-y-2 text-sm">
                                    {usage.voiceNumbers.map((v: any) => (
                                        <li key={v.number} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <span className="font-mono font-semibold">+{v.number} <span className={`ml-1 text-xs font-sans ${v.enabled ? "text-green-700" : "text-amber-700"}`}>{v.enabled ? "live" : "paused"}</span></span>
                                            <span className="flex gap-2">
                                                <button onClick={() => saveNumber(v.number, { enabled: !v.enabled })} disabled={busy} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold hover:bg-slate-200">{v.enabled ? "Pause" : "Resume"}</button>
                                                <button onClick={() => confirm(`Unlink +${v.number} from this hospital?`) && saveNumber(v.number, { unlink: true })} disabled={busy} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">Unlink</button>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2 text-sm text-slate-500">No number linked. Buy one in Plivo, point it at the Pillora AI application, then link it here.</p>
                            )}
                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+91 22 6985 7389" className="flex-1 rounded-xl border border-slate-200 p-2.5 text-sm" />
                                <button onClick={() => saveNumber(number, { enabled: true })} disabled={busy || !number.trim()} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
                                    Link number
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
