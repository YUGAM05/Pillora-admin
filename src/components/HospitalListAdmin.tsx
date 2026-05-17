"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import { 
    Building2, 
    MapPin, 
    Phone, 
    IndianRupee, 
    Clock, 
    Trash2, 
    Edit3, 
    Loader2, 
    Star, 
    CreditCard, 
    User, 
    MoreVertical,
    ChevronDown,
    ChevronUp,
    ImageIcon,
    Stethoscope,
    Calendar,
    ExternalLink,
    Mail,
    PlusCircle,
    XCircle,
    Lock,
    Eye,
    EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCallback } from "react";
import SlotGenTool from "./SlotGenTool";

export default function HospitalListAdmin() {
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedDoctors, setExpandedDoctors] = useState<any[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [showSlotGen, setShowSlotGen] = useState<any>(null);
    const [showAddDoctor, setShowAddDoctor] = useState<string | null>(null); // hospitalId
    const [newDoctor, setNewDoctor] = useState({ name: "", specialization: "", fee: 200 });
    const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

    const fetchHospitals = useCallback(async () => {
        try {
            const res = await api.get("/hospitals");
            setHospitals(res.data);
        } catch (err: any) {
            setError("Failed to fetch hospitals");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHospitals();
    }, [fetchHospitals]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
        
        try {
            const token = getToken();
            await api.delete(`/hospitals/${id}`);

            setHospitals(prev => prev.filter(h => h._id !== id));
        } catch (err) {
            alert("Failed to delete hospital");
        }
    };

    const toggleExpand = async (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setExpandedDoctors([]);
            return;
        }
        
        setExpandedId(id);
        setDocsLoading(true);
        try {
            const res = await api.get(`/admin/hospitals/${id}/doctors`);
            setExpandedDoctors(res.data);
        } catch (err) {
            console.error("Failed to fetch doctors", err);
        } finally {
            setDocsLoading(false);
        }
    };

    const handleAddDoctor = async (hospitalId: string) => {
        try {
            await api.post(`/admin/hospitals/${hospitalId}/doctors`, {
                name: newDoctor.name,
                specialty: newDoctor.specialization,
                fee: newDoctor.fee
            });
            alert("Doctor added successfully!");
            setShowAddDoctor(null);
            setNewDoctor({ name: "", specialization: "", fee: 200 });
            // Refresh doctors for this hospital
            const res = await api.get(`/admin/hospitals/${hospitalId}/doctors`);
            setExpandedDoctors(res.data);
        } catch (err) {
            alert("Failed to add doctor");
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] italic">Accessing Facility Database...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {hospitals.length === 0 ? (
                <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                    <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Directory Empty</h4>
                    <p className="text-slate-500 mt-2 font-medium">No medical facilities have been registered yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence>
                        {hospitals.map((hospital) => (
                            <motion.div
                                key={hospital._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`group bg-white border rounded-[2.5rem] transition-all duration-500 overflow-hidden ${
                                    expandedId === hospital._id 
                                    ? 'border-blue-200 shadow-2xl shadow-blue-900/10' 
                                    : 'border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5'
                                }`}
                            >
                                {/* Header Section */}
                                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                            {hospital.image ? (
                                                <Image src={hospital.image} alt={hospital.name} fill className="object-cover" unoptimized />
                                            ) : (
                                                <Building2 className="w-10 h-10 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-slate-900 text-xl tracking-tight leading-tight">{hospital.name}</h4>
                                                {hospital.plan && (
                                                    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-widest ${
                                                        hospital.plan === 'Enterprise' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        hospital.plan === 'Premium' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                        {hospital.plan}
                                                    </div>
                                                )}
                                                {hospital.rating && (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black border border-amber-100">
                                                        <Star className="w-3 h-3 fill-amber-600" /> {hospital.rating}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> {hospital.city}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> ₹{hospital.consultationFee} Fee
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                                    <User className="w-3.5 h-3.5 text-indigo-500" /> {hospital.doctors?.length || 0} Doctors
                                                </div>
                                                <div className="flex gap-2 ml-2">
                                                    {hospital.is_featured && (
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-indigo-100">Top Results</span>
                                                    )}
                                                    {hospital.has_govt_schemes && (
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-emerald-100">Govt Schemes</span>
                                                    )}
                                                    {hospital.is_spotlight && (
                                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-amber-100">Spotlight</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleDelete(hospital._id, hospital.name)}
                                            className="p-4 bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all group/del"
                                        >
                                            <Trash2 className="w-5 h-5 group-hover/del:rotate-12 transition-transform" />
                                        </button>
                                        <button 
                                            onClick={() => toggleExpand(hospital._id)}
                                            className={`p-4 rounded-2xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
                                                expandedId === hospital._id 
                                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' 
                                                : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                                            }`}
                                        >
                                            {expandedId === hospital._id ? 'Close' : 'Details'}
                                            {expandedId === hospital._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {expandedId === hospital._id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: "circOut" }}
                                            className="border-t border-slate-50 bg-slate-50/30"
                                        >
                                            <div className="p-8 md:p-12 space-y-12">
                                                {/* Top Grid: Info & Description */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                                    <div className="space-y-8">
                                                        <div>
                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Official Bio</h5>
                                                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm leading-relaxed text-slate-600 italic">
                                                                {hospital.description || "No description provided for this facility."}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Emergency Contact</p>
                                                                <a href={`tel:${hospital.ambulanceContact}`} className="flex items-center gap-3 text-lg font-black text-rose-600 hover:underline">
                                                                    <Phone className="w-5 h-5" /> {hospital.ambulanceContact || "N/A"}
                                                                </a>
                                                            </div>
                                                            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Management</p>
                                                                <p className="font-black text-slate-900 uppercase tracking-tighter text-lg">{hospital.management_type || "SELF"}</p>
                                                            </div>
                                                        </div>

                                                        {/* Administrative Credentials Card */}
                                                        <div className="p-6 bg-slate-900 text-white rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
                                                            <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-blue-600/20 blur-2xl group-hover:scale-110 transition-transform duration-500" />
                                                            <div className="flex items-center gap-2 text-blue-400 font-bold mb-4 uppercase tracking-widest text-[10px]">
                                                                <Lock className="w-4 h-4" /> Administrative Access
                                                            </div>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Hospital Email / Login ID</label>
                                                                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl font-mono text-xs break-all mt-1">
                                                                        <span>{hospital.user?.email || "N/A"}</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Access Password</label>
                                                                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl font-mono text-xs tracking-wider mt-1">
                                                                        <span>{showPasswords[hospital._id] ? (hospital.tempPassword || "Saved Securely (Encrypted)") : "••••••••"}</span>
                                                                        <button 
                                                                            onClick={() => setShowPasswords(prev => ({ ...prev, [hospital._id]: !prev[hospital._id] }))}
                                                                            className="ml-2 text-slate-400 hover:text-white transition-colors"
                                                                            type="button"
                                                                        >
                                                                            {showPasswords[hospital._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Zoho Mail Button */}
                                                        {hospital.user?.email && (
                                                            <a 
                                                                href={`https://mail.zoho.com/zm/#mail/compose?to=${hospital.user.email}&subject=Regarding Hospital: ${hospital.name}&body=Hello ${hospital.name} Team,%0D%0A%0D%0AWe are contacting you regarding your hospital's profile on Pillora...`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 mt-4 group"
                                                            >
                                                                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" /> Contact via Zoho Mail
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div className="space-y-8">
                                                        <div>
                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Facility Features</h5>
                                                            <div className="flex flex-wrap gap-3">
                                                                {hospital.isOpen24Hours && (
                                                                    <div className="px-5 py-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                                        <Clock className="w-4 h-4" /> 24/7 Operations
                                                                    </div>
                                                                )}
                                                                {hospital.isOnlinePaymentAvailable && (
                                                                    <div className="px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                                        <CreditCard className="w-4 h-4" /> Digital Pay
                                                                    </div>
                                                                )}
                                                                {hospital.phoneNumbers?.map((ph: string, idx: number) => (
                                                                    <div key={idx} className="px-5 py-3 bg-white text-slate-700 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                                        <Phone className="w-4 h-4 text-slate-400" /> {ph}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Location Mapping</h5>
                                                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
                                                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                                                    <MapPin className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900 leading-relaxed">{hospital.address}</p>
                                                                    <p className="text-[10px] font-black text-blue-600 uppercase mt-2 tracking-widest">{hospital.city}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Doctor Directory */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Internal Medical Board</h5>
                                                        <button 
                                                            onClick={() => setShowAddDoctor(hospital._id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                                        >
                                                            <PlusCircle className="w-4 h-4" /> Recruit Doctor
                                                        </button>
                                                    </div>

                                                    {showAddDoctor === hospital._id && (
                                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-8 bg-white rounded-[2rem] border-2 border-blue-100 shadow-xl shadow-blue-900/5">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Doctor Name</label>
                                                                    <input type="text" placeholder="Dr. Jane Smith" value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
                                                                    <input type="text" placeholder="Cardiologist" value={newDoctor.specialization} onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Fee</label>
                                                                    <input type="number" value={newDoctor.fee} onChange={e => setNewDoctor({...newDoctor, fee: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <button onClick={() => handleAddDoctor(hospital._id)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100">Confirm Appointment</button>
                                                                <button onClick={() => setShowAddDoctor(null)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Cancel</button>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {docsLoading ? (
                                                            <div className="col-span-full py-12 flex flex-col items-center justify-center">
                                                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving Board Members...</p>
                                                            </div>
                                                        ) : expandedDoctors && expandedDoctors.length > 0 ? (
                                                            expandedDoctors.map((doc: any, i: number) => (
                                                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group/doc hover:border-blue-200 transition-all">
                                                                    <div className="flex items-center gap-4 mb-4">
                                                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 group-hover/doc:bg-blue-600 group-hover/doc:text-white transition-all duration-300">
                                                                            <Stethoscope className="w-6 h-6" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-black text-slate-900 leading-none">{doc.name}</p>
                                                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{doc.specialty || doc.specialization}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-black text-emerald-600">₹{doc.fee || hospital.consultationFee}</span>
                                                                            {hospital.management_type === 'PILLORA' && (
                                                                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">Pillora Managed</span>
                                                                            )}
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => setShowSlotGen({ ...doc, hospital: hospital._id })}
                                                                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                                                                        >
                                                                            Manage Slots
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="col-span-full py-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic">No doctor data available</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Visual Assets */}
                                                {hospital.images && hospital.images.length > 0 && (
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Facility Gallery</h5>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                            {hospital.images.map((img: string, i: number) => (
                                                                <div key={i} className="aspect-square relative rounded-2xl overflow-hidden border border-slate-100 hover:scale-105 transition-transform duration-500 shadow-sm">
                                                                    <Image src={img} alt={`${hospital.name} gallery ${i}`} fill className="object-cover" unoptimized />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Slot Gen Modal for Admin */}
            {showSlotGen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative">
                        <button onClick={() => setShowSlotGen(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><XCircle className="w-6 h-6" /></button>
                        <h3 className="text-2xl font-black mb-8">System Slot Generator</h3>
                        <SlotGenTool 
                            doctor={showSlotGen} 
                            hospitalId={showSlotGen.hospital} 
                            onClose={() => { setShowSlotGen(null); fetchHospitals(); }} 
                        />
                    </motion.div>
                </div>
            )}
        </div>
    );
}
