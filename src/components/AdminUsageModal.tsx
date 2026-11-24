"use client";

// Admin: one hospital's plan usage, add-on packs (grant one, e.g. after an
// offline UPI / bank payment), the AI receptionist phone number and its settings.
// API: GET /admin/hospitals/:id/usage, POST /admin/hospitals/:id/packs,
//      PUT /admin/hospitals/:id/voice-number, GET/PUT /admin/hospitals/:id/ai-receptionist

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { X, MessageCircle, PhoneCall, Package, Loader2, Phone } from "lucide-react";
import AdminAiReceptionistForm from "@/components/AdminAiReceptionistForm";

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
        <div className="ui-overlay" role="dialog" aria-modal="true" aria-label="Usage, packs and AI number">
            <div className="ui-dialog sm:max-w-2xl">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold leading-tight text-slate-900">{usage?.hospital?.name || hospital.name || "Hospital"}</h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            {usage ? `${usage.plan.label} plan · ₹${fmt(usage.plan.priceMonthly)}/month · ${usage.plan.doctorsUsed}/${usage.plan.maxDoctors ?? "∞"} doctors · ${monthIN(usage.month)}` : "Loading…"}
                        </p>
                    </div>
                    <button onClick={onClose} className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
                {msg && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-800">{msg}</p>}
                {!usage && !error && <p className="flex items-center gap-2 py-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}

                {usage && (
                    <>
                        {/* This month */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="flex items-center gap-2.5 text-[13px] font-medium text-slate-500"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><MessageCircle className="h-4 w-4" /></span> WhatsApp this month</p>
                                <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{fmt(usage.whatsapp.planUsed)} <span className="text-base font-medium text-slate-400">/ {fmt(usage.whatsapp.planLimit)}</span></p>
                                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                    Packs left {fmt(usage.whatsapp.packRemaining)} · grace {fmt(usage.whatsapp.graceUsed)} · not sent {fmt(usage.whatsapp.skipped)}
                                </p>
                                <p className="text-xs leading-relaxed text-slate-500">
                                    30 days: {fmt((usage.whatsapp.delivery30d.delivered ?? 0) + (usage.whatsapp.delivery30d.read ?? 0))} delivered, {fmt((usage.whatsapp.delivery30d.failed ?? 0) + (usage.whatsapp.delivery30d.send_error ?? 0))} failed
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="flex items-center gap-2.5 text-[13px] font-medium text-slate-500"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><PhoneCall className="h-4 w-4" /></span> AI minutes this month</p>
                                <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{fmt(usage.ai.planUsedMinutes)} <span className="text-base font-medium text-slate-400">/ {fmt(usage.ai.planMinutes)} min</span></p>
                                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                    {fmt(usage.ai.calls)} calls · packs left {fmt(usage.ai.packRemainingMinutes)} min · over {fmt(usage.ai.overageMinutes)} min
                                </p>
                            </div>
                        </div>

                        {/* Packs */}
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Package className="h-4 w-4 text-slate-400" /> Add-on packs</p>
                            {usage.packs.length === 0 ? (
                                <p className="mt-2 text-sm text-slate-500">None yet.</p>
                            ) : (
                                <ul className="mt-2 divide-y divide-slate-100 text-sm">
                                    {usage.packs.map((p: any) => (
                                        <li key={p.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                            <span className="font-medium text-slate-800">{p.label} <span className="text-xs font-normal text-slate-400">({p.source}{p.status === "pending" ? ", payment pending" : ""})</span></span>
                                            <span className={p.status === "pending" ? "text-amber-700" : "text-slate-500"}>
                                                {p.status === "pending" ? "not paid yet" : `${fmt(p.remaining)}${p.kind === "ai_minutes" ? " min" : ""} left${p.expiresAt ? ` · until ${dateIN(p.expiresAt)}` : ""}`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-3">
                                <select value={packCode} onChange={(e) => setPackCode(e.target.value)} aria-label="Pack to add" className="ui-input sm:col-span-3">
                                    {usage.catalog.map((c: any) => (
                                        <option key={c.code} value={c.code}>{c.label} (₹{fmt(c.price)} + GST)</option>
                                    ))}
                                </select>
                                <input value={pricePaid} onChange={(e) => setPricePaid(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder="Amount paid ₹ (0 = free)" aria-label="Amount paid in rupees (0 = free)" className="ui-input" />
                                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (e.g. UPI ref)" aria-label="Note" className="ui-input" />
                                <button onClick={grant} disabled={busy} className="ui-btn-primary min-h-[44px]">
                                    Add pack
                                </button>
                            </div>
                        </div>

                        {/* AI receptionist number */}
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Phone className="h-4 w-4 text-slate-400" /> AI receptionist number</p>
                            {usage.voiceNumbers?.length ? (
                                <ul className="mt-3 space-y-2 text-sm">
                                    {usage.voiceNumbers.map((v: any) => (
                                        <li key={v.number} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                            <span className="font-mono font-semibold text-slate-900">+{v.number} <span className={`ui-badge ml-1 font-sans ${v.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{v.enabled ? "Live" : "Paused"}</span></span>
                                            <span className="flex gap-2">
                                                <button onClick={() => saveNumber(v.number, { enabled: !v.enabled })} disabled={busy} className="ui-btn-secondary ui-btn-sm min-h-[40px] flex-1 sm:min-h-[32px] sm:flex-none">{v.enabled ? "Pause" : "Resume"}</button>
                                                <button onClick={() => confirm(`Unlink +${v.number} from this hospital?`) && saveNumber(v.number, { unlink: true })} disabled={busy} className="ui-btn ui-btn-sm min-h-[40px] flex-1 border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 sm:min-h-[32px] sm:flex-none">Unlink</button>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2 text-sm text-slate-500">No number linked. Buy one in Plivo, point it at the Pillora AI application, then link it here.</p>
                            )}
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+91 22 6985 7389" aria-label="Phone number to link" className="ui-input sm:flex-1" />
                                <button onClick={() => saveNumber(number, { enabled: true })} disabled={busy || !number.trim()} className="ui-btn-dark min-h-[44px] w-full shrink-0 sm:w-auto">
                                    Link number
                                </button>
                            </div>
                        </div>

                        {/* AI receptionist settings: spoken name, greeting language, information */}
                        <AdminAiReceptionistForm hospitalId={hospital._id} />
                    </>
                )}
                </div>
            </div>
        </div>
    );
}
