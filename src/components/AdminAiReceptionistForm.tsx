"use client";

// Admin: one hospital's AI receptionist settings (the same settings the hospital
// edits in its dashboard under Settings > AI receptionist). Filled in during
// onboarding, or on the demo hospital before a sales visit.
// API: GET/PUT /admin/hospitals/:id/ai-receptionist

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Bot, Loader2 } from "lucide-react";

type Lang = "gu" | "hi";
type Form = { spokenNameGu: string; spokenNameHi: string; firstLanguage: Lang; info: string };

const GUJARATI = /[઀-૿]/;
const DEVANAGARI = /[ऀ-ॿ]/;

const pick = (s: any): Form => ({
    spokenNameGu: s?.spokenNameGu || "",
    spokenNameHi: s?.spokenNameHi || "",
    firstLanguage: s?.firstLanguage === "hi" ? "hi" : "gu",
    info: s?.info || "",
});

// Same words as the voice server's greeting (voice-agent server/agent.js, greetingFor).
const greeting = (lang: Lang, name: string) =>
    lang === "gu"
        ? `નમસ્તે, ${name} માં આપનું સ્વાગત છે. હું તમારી એપોઈન્ટમેન્ટ બુક કરવામાં મદદ કરીશ. તમારે કયા ડૉક્ટરને બતાવવું છે?`
        : `नमस्ते, ${name} में आपका स्वागत है. मैं आपकी अपॉइंटमेंट बुक करने में मदद करूँगी. आपको किस डॉक्टर को दिखाना है?`;

export default function AdminAiReceptionistForm({ hospitalId }: { hospitalId: string }) {
    const [data, setData] = useState<any>(null);
    const [form, setForm] = useState<Form | null>(null);
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await api.get(`/admin/hospitals/${hospitalId}/ai-receptionist`);
            setData(res.data);
            setForm(pick(res.data.settings));
            setError("");
        } catch (e: any) {
            setError(e.response?.data?.message || "Could not load the AI receptionist settings");
        }
    }, [hospitalId]);

    useEffect(() => {
        load();
    }, [load]);

    const nameMax = data?.limits?.nameMax ?? 60;
    const infoMax = data?.limits?.infoMax ?? 1000;
    const problem = useMemo(() => {
        if (!form) return "";
        if (DEVANAGARI.test(form.spokenNameGu)) return "The Gujarati name must use Gujarati script or English letters.";
        if (GUJARATI.test(form.spokenNameHi)) return "The Hindi name must use Hindi script or English letters.";
        if (form.spokenNameGu.trim().length > nameMax || form.spokenNameHi.trim().length > nameMax) return `Keep names under ${nameMax} characters.`;
        if (form.info.trim().length > infoMax) return `The information must be ${infoMax} characters or less.`;
        return "";
    }, [form, nameMax, infoMax]);
    const dirty = !!form && !!data && JSON.stringify(form) !== JSON.stringify(pick(data.settings));
    const set = (patch: Partial<Form>) => {
        setForm((f) => (f ? { ...f, ...patch } : f));
        setMsg("");
    };

    const save = async () => {
        if (!form || problem) return;
        setSaving(true);
        setMsg("");
        try {
            const res = await api.put(`/admin/hospitals/${hospitalId}/ai-receptionist`, form);
            setData(res.data);
            setForm(pick(res.data.settings));
            setMsg("✅ Saved. The AI uses this from the next call.");
        } catch (e: any) {
            setMsg(e.response?.data?.message || "Could not save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Bot className="h-4 w-4 text-slate-400" /> AI receptionist settings
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">The hospital can also change these in its dashboard (Settings › AI receptionist).</p>

            {error && <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{error}</p>}
            {!form && !error && (
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </p>
            )}

            {form && data && (
                <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                            <label htmlFor="adm-ai-gu" className="ui-label">Name in Gujarati</label>
                            <input id="adm-ai-gu" lang="gu" value={form.spokenNameGu} onChange={(e) => set({ spokenNameGu: e.target.value })} placeholder={data.hospitalName} className="ui-input" />
                        </div>
                        <div>
                            <label htmlFor="adm-ai-hi" className="ui-label">Name in Hindi</label>
                            <input id="adm-ai-hi" lang="hi" value={form.spokenNameHi} onChange={(e) => set({ spokenNameHi: e.target.value })} placeholder={data.hospitalName} className="ui-input" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span id="adm-ai-lang" className="text-[13px] font-medium text-slate-700">Greets callers in</span>
                        <div className="ui-segmented" role="radiogroup" aria-labelledby="adm-ai-lang">
                            {(["gu", "hi"] as Lang[]).map((l) => (
                                <button
                                    key={l}
                                    type="button"
                                    role="radio"
                                    aria-checked={form.firstLanguage === l}
                                    onClick={() => set({ firstLanguage: l })}
                                    className={`ui-segment min-w-[88px] ${form.firstLanguage === l ? "ui-segment-active" : ""}`}
                                >
                                    {l === "gu" ? "Gujarati" : "Hindi"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p lang={form.firstLanguage} className="rounded-lg bg-blue-50/60 p-3 text-xs leading-relaxed text-slate-700">
                        <span className="font-medium text-blue-700">Callers hear: </span>
                        “{greeting(form.firstLanguage, (form.firstLanguage === "gu" ? form.spokenNameGu : form.spokenNameHi).trim() || data.hospitalName)}”
                    </p>

                    <div>
                        <div className="flex items-end justify-between gap-3">
                            <label htmlFor="adm-ai-info" className="ui-label">Information for the AI</label>
                            <span className={`mb-1.5 text-xs tabular-nums ${form.info.trim().length > infoMax ? "font-semibold text-rose-600" : "text-slate-400"}`}>
                                {form.info.trim().length} / {infoMax}
                            </span>
                        </div>
                        <textarea
                            id="adm-ai-info"
                            rows={6}
                            value={form.info}
                            onChange={(e) => set({ info: e.target.value })}
                            placeholder="Address and landmark, OPD timings and holidays, fees, services, Ayushman/insurance, reception number for reports and bills."
                            className="ui-input min-h-[140px] resize-y leading-relaxed"
                        />
                    </div>

                    {problem && <p className="text-xs font-medium text-rose-600">{problem}</p>}
                    {msg && <p role="status" className="text-sm font-medium text-blue-800">{msg}</p>}

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs text-slate-400">
                            {data.settings?.updatedAt
                                ? `Last changed ${new Date(data.settings.updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`
                                : "Not set yet (uses the hospital name)"}
                        </span>
                        <button onClick={save} disabled={!dirty || saving || !!problem} className="ui-btn-primary min-h-[44px]">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
