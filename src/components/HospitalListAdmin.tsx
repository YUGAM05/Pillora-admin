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

// Plan codes stored on hospitals -> the names hospitals see.
const PLAN_LABEL: Record<string, string> = { Standard: 'Clinic', Premium: 'Hospital', Enterprise: 'Enterprise' };

export default function HospitalListAdmin({ onEdit }: { onEdit: (hospital: any) => void }) {
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
            // /admin/hospitals includes the linked login account (user.email); the public
            // /hospitals list does not. Fall back to it only if the admin route fails.
            const res = await api.get("/admin/hospitals").catch(() => api.get("/hospitals"));
            setHospitals(Array.isArray(res.data) ? res.data : (res.data?.hospitals || []));
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
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="mb-3 h-7 w-7 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">Accessing facility database...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {hospitals.length === 0 ? (
                <div className="ui-empty">
                    <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <h4 className="font-medium text-slate-700">Directory empty</h4>
                    <p className="mt-1">No medical facilities have been registered yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <AnimatePresence>
                        {hospitals.map((hospital) => (
                            <motion.div
                                key={hospital._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`overflow-hidden rounded-xl border bg-white transition-colors ${
                                    expandedId === hospital._id
                                    ? 'border-blue-200'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {/* Header Section */}
                                <div className="relative flex flex-col justify-between gap-4 p-4 sm:p-5 md:flex-row md:items-center">
                                    <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 sm:h-16 sm:w-16">
                                            {hospital.image ? (
                                                <Image src={hospital.image} alt={hospital.name} fill className="object-cover" unoptimized />
                                            ) : (
                                                <Building2 className="h-7 w-7 text-blue-600" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-base font-semibold leading-tight tracking-tight text-slate-900 sm:text-lg">{hospital.name}</h4>
                                                {hospital.plan && (
                                                    <div className={`ui-badge ${
                                                        hospital.plan === 'Enterprise' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                                        hospital.plan === 'Premium' ? 'border-violet-200 bg-violet-50 text-violet-700' :
                                                        'border-blue-200 bg-blue-50 text-blue-700'
                                                    }`}>
                                                        {PLAN_LABEL[hospital.plan] ?? hospital.plan}
                                                    </div>
                                                )}
                                                {Number(hospital.rating) > 0 && (
                                                    <div className="ui-badge border-amber-200 bg-amber-50 text-amber-700">
                                                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {hospital.rating}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                    <MapPin className="h-4 w-4 text-slate-400" /> {hospital.city}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                    <IndianRupee className="h-4 w-4 text-slate-400" /> ₹{hospital.consultationFee} fee
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                    <User className="h-4 w-4 text-slate-400" /> {hospital.doctors?.length || 0} doctors
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {hospital.is_featured && (
                                                        <span className="ui-badge border-indigo-200 bg-indigo-50 text-indigo-700">Top results</span>
                                                    )}
                                                    {hospital.has_govt_schemes && (
                                                        <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">Govt schemes</span>
                                                    )}
                                                    {hospital.is_spotlight && (
                                                        <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">Spotlight</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                         <button
                                             onClick={() => onEdit(hospital)}
                                             className="ui-btn-secondary w-10 px-0 text-slate-500 hover:text-blue-600"
                                             title="Edit hospital details"
                                             aria-label="Edit hospital details"
                                         >
                                             <Edit3 className="h-4 w-4" />
                                         </button>
                                         <button
                                             onClick={() => handleDelete(hospital._id, hospital.name)}
                                             className="ui-btn-secondary w-10 px-0 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                             title="Delete hospital"
                                             aria-label="Delete hospital"
                                         >
                                             <Trash2 className="h-4 w-4" />
                                         </button>
                                        <button
                                            onClick={() => toggleExpand(hospital._id)}
                                            aria-expanded={expandedId === hospital._id}
                                            className={`flex-1 md:flex-none ${
                                                expandedId === hospital._id
                                                ? 'ui-btn border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                : 'ui-btn-secondary'
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
                                            className="border-t border-slate-100 bg-slate-50/60"
                                        >
                                            <div className="space-y-6 p-4 sm:p-5 md:p-6">
                                                {/* Top Grid: Info & Description */}
                                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h5 className="mb-2 text-sm font-semibold text-slate-900">Official bio</h5>
                                                            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600">
                                                                {hospital.description || "No description provided for this facility."}
                                                            </div>
                                                        </div>

                                                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                                                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3">
                                                                <p className="text-xs font-medium text-slate-500">Emergency contact</p>
                                                                <a href={`tel:${hospital.ambulanceContact}`} className="flex items-center gap-2 text-sm font-semibold text-rose-600 hover:underline">
                                                                    <Phone className="h-4 w-4 shrink-0" /> {hospital.ambulanceContact || "N/A"}
                                                                </a>
                                                            </div>
                                                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3">
                                                                <p className="text-xs font-medium text-slate-500">Hospital phone no</p>
                                                                <a href={`tel:${hospital.contactNumber}`} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                                                                    <Phone className="h-4 w-4 shrink-0" /> {hospital.contactNumber || "N/A"}
                                                                </a>
                                                            </div>
                                                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3">
                                                                <p className="text-xs font-medium text-slate-500">Management</p>
                                                                <p className="text-sm font-semibold text-slate-900">{hospital.management_type || "SELF"}</p>
                                                            </div>
                                                        </div>

                                                        {/* Administrative Credentials Card */}
                                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                                <Lock className="h-4 w-4 text-slate-400" /> Administrative access
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="text-xs font-medium text-slate-500">Hospital email / login ID</label>
                                                                    <div className="mt-1 flex min-h-[42px] items-center justify-between break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900">
                                                                        <span>{hospital.user?.email || "N/A"}</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-medium text-slate-500">Access password</label>
                                                                    <div className="mt-1 flex min-h-[42px] items-center justify-between rounded-lg border border-slate-200 bg-slate-50 py-0.5 pl-3 pr-0.5 font-mono text-xs tracking-wider text-slate-900">
                                                                        <span className="break-all">{showPasswords[hospital._id] ? (hospital.tempPassword || "Saved Securely (Encrypted)") : "••••••••"}</span>
                                                                        <button
                                                                            onClick={() => setShowPasswords(prev => ({ ...prev, [hospital._id]: !prev[hospital._id] }))}
                                                                            className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
                                                                            type="button"
                                                                            aria-label={showPasswords[hospital._id] ? "Hide password" : "Show password"}
                                                                        >
                                                                            {showPasswords[hospital._id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                                                                className="ui-btn-primary w-full"
                                                            >
                                                                <Mail className="h-4 w-4" /> Contact via Zoho Mail
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <h5 className="mb-2 text-sm font-semibold text-slate-900">Facility features</h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {hospital.isOpen24Hours && (
                                                                    <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                                                                        <Clock className="h-4 w-4" /> 24/7 operations
                                                                    </div>
                                                                )}
                                                                {hospital.isOnlinePaymentAvailable && (
                                                                    <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                                                                        <CreditCard className="h-4 w-4" /> Digital pay
                                                                    </div>
                                                                )}
                                                                {hospital.contactNumber && (
                                                                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
                                                                        <Phone className="h-4 w-4 text-blue-600" /> {hospital.contactNumber} (primary)
                                                                    </div>
                                                                )}
                                                                {hospital.phoneNumbers?.map((ph: string, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
                                                                        <Phone className="h-4 w-4 text-slate-400" /> {ph}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h5 className="mb-2 text-sm font-semibold text-slate-900">Location mapping</h5>
                                                            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                                    <MapPin className="h-4 w-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium leading-relaxed text-slate-900">{hospital.address}</p>
                                                                    <p className="mt-0.5 text-xs font-medium text-blue-600">{hospital.city}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Doctor Directory */}
                                                <div>
                                                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <h5 className="text-sm font-semibold text-slate-900">Internal medical board</h5>
                                                        <button
                                                            onClick={() => setShowAddDoctor(hospital._id)}
                                                            className="ui-btn-dark w-full sm:w-auto"
                                                        >
                                                            <PlusCircle className="h-4 w-4" /> Recruit doctor
                                                        </button>
                                                    </div>

                                                    {showAddDoctor === hospital._id && (
                                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-xl border border-blue-200 bg-white p-4 sm:p-5">
                                                            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                                                                <div>
                                                                    <label htmlFor="new-doctor-name" className="ui-label">Doctor name</label>
                                                                    <input id="new-doctor-name" type="text" placeholder="Dr. Jane Smith" value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} className="ui-input" />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="new-doctor-specialization" className="ui-label">Specialization</label>
                                                                    <input id="new-doctor-specialization" type="text" placeholder="Cardiologist" value={newDoctor.specialization} onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})} className="ui-input" />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="new-doctor-fee" className="ui-label">Consultation fee</label>
                                                                    <input id="new-doctor-fee" type="number" value={newDoctor.fee} onChange={e => setNewDoctor({...newDoctor, fee: Number(e.target.value)})} className="ui-input" />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
                                                                <button onClick={() => handleAddDoctor(hospital._id)} className="ui-btn-primary w-full sm:w-auto">Confirm appointment</button>
                                                                <button onClick={() => setShowAddDoctor(null)} className="ui-btn-secondary w-full sm:w-auto">Cancel</button>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                        {docsLoading ? (
                                                            <div className="col-span-full flex flex-col items-center justify-center py-10">
                                                                <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-600" />
                                                                <p className="text-sm text-slate-500">Retrieving board members...</p>
                                                            </div>
                                                        ) : expandedDoctors && expandedDoctors.length > 0 ? (
                                                            expandedDoctors.map((doc: any, i: number) => (
                                                                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                                            <Stethoscope className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate font-semibold leading-tight text-slate-900">{doc.name}</p>
                                                                            <p className="mt-0.5 truncate text-sm text-slate-500">{doc.specialty || doc.specialization}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-semibold text-emerald-600">₹{doc.fee || hospital.consultationFee}</span>
                                                                            {hospital.management_type === 'PILLORA' && (
                                                                                <span className="text-xs font-medium text-blue-600">Pillora managed</span>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => setShowSlotGen({ ...doc, hospital: hospital._id })}
                                                                            className="ui-btn-soft ui-btn-sm min-h-[40px]"
                                                                        >
                                                                            Manage slots
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="ui-empty col-span-full py-8">
                                                                <p>No doctor data available</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Visual Assets */}
                                                {hospital.images && hospital.images.length > 0 && (
                                                    <div>
                                                        <h5 className="mb-3 text-sm font-semibold text-slate-900">Facility gallery</h5>
                                                        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
                                                            {hospital.images.map((img: string, i: number) => (
                                                                <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 backdrop-blur-[2px] sm:items-center sm:p-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} role="dialog" aria-modal="true" aria-label="System slot generator" className="ui-dialog relative sm:max-w-lg">
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                            <h3 className="text-lg font-semibold leading-tight text-slate-900">System slot generator</h3>
                            <button onClick={() => setShowSlotGen(null)} className="-mr-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><XCircle className="h-5 w-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                        <SlotGenTool
                            doctor={showSlotGen}
                            hospitalId={showSlotGen.hospital}
                            onClose={() => { setShowSlotGen(null); fetchHospitals(); }}
                        />
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
