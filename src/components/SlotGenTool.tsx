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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50/50 p-4 rounded-2xl flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                    <Activity className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Generating for</p>
                    <p className="font-bold text-slate-900 leading-tight">Dr. {doctor.name}</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Select Date
                </label>
                <input 
                    required 
                    type="date" 
                    value={formData.date} 
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Start
                    </label>
                    <input 
                        required 
                        type="time" 
                        value={formData.startTime} 
                        onChange={e => setFormData({...formData, startTime: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" /> End
                    </label>
                    <input 
                        required 
                        type="time" 
                        value={formData.endTime} 
                        onChange={e => setFormData({...formData, endTime: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultation Duration</label>
                <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                        <button
                            key={mins}
                            type="button"
                            onClick={() => setFormData({...formData, duration: mins.toString()})}
                            className={`py-3 rounded-xl text-xs font-black transition-all border ${
                                formData.duration === mins.toString()
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-600'
                            }`}
                        >
                            {mins} Min
                        </button>
                    ))}
                </div>
            </div>

            <button 
                disabled={loading} 
                className="w-full py-5 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl shadow-slate-200 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
                {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                ) : (
                    <>Deploy Smart Slots</>
                )}
            </button>
        </form>
    );
}
