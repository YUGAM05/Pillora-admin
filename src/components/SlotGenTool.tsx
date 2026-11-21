"use client";

import { useState } from "react";
import api from "@/lib/api";
import { XCircle, Calendar, Clock, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface SlotGenToolProps {
    doctor: any;
    hospitalId?: string; // Optional, if provided, uses admin route
    onClose: () => void;
}

export default function SlotGenTool({ doctor, hospitalId, onClose }: SlotGenToolProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "17:00",
        duration: "15"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // If hospitalId is provided, we use the admin route
            const endpoint = hospitalId ? "/admin/slots/generate" : "/hospital/dashboard/slots/generate";
            const payload = {
                doctorId: doctor._id,
                hospitalId: hospitalId || doctor.hospital,
                ...formData
            };

            await api.post(endpoint, payload);
            alert("Slots generated successfully!");
            onClose();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to generate slots");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Activity className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-blue-700">Generating for</p>
                    <p className="truncate font-semibold leading-tight text-slate-900">Dr. {doctor.name}</p>
                </div>
            </div>

            <div>
                <label htmlFor="slotgen-date" className="ui-label flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Select date
                </label>
                <input
                    id="slotgen-date"
                    required
                    type="date"
                    value={formData.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="ui-input"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="slotgen-start" className="ui-label flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> Start
                    </label>
                    <input
                        id="slotgen-start"
                        required
                        type="time"
                        value={formData.startTime}
                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                        className="ui-input"
                    />
                </div>
                <div>
                    <label htmlFor="slotgen-end" className="ui-label flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> End
                    </label>
                    <input
                        id="slotgen-end"
                        required
                        type="time"
                        value={formData.endTime}
                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                        className="ui-input"
                    />
                </div>
            </div>

            <div>
                <label className="ui-label">Consultation duration</label>
                <div className="grid grid-cols-4 gap-2" role="group" aria-label="Consultation duration">
                    {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                        <button
                            key={mins}
                            type="button"
                            onClick={() => setFormData({...formData, duration: mins.toString()})}
                            aria-pressed={formData.duration === mins.toString()}
                            className={`flex min-h-[44px] items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                                formData.duration === mins.toString()
                                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                            }`}
                        >
                            {mins} min
                        </button>
                    ))}
                </div>
            </div>

            <button
                disabled={loading}
                className="ui-btn-dark min-h-[48px] w-full"
            >
                {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                    <>Deploy smart slots</>
                )}
            </button>
        </form>
    );
}
