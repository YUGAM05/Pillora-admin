"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import { 
    Building2, 
    Handshake, 
    MapPin, 
    Phone, 
    Mail, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    XCircle, 
    Loader2, 
    ChevronDown, 
    ChevronUp,
    MoreVertical,
    Activity,
    Database,
    Zap,
    Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PartnerInquiriesAdmin() {
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");

    const fetchInquiries = useCallback(async () => {
        try {
            const token = getToken();
            const res = await api.get("/partners/all", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInquiries(res.data.data);
        } catch (err: any) {
            setError("Failed to fetch partner inquiries");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            const token = getToken();
            await api.patch(`/partners/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInquiries(prev => prev.map(inq => inq._id === id ? { ...inq, status } : inq));
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'reviewed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'contacted': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Retrieving Partnership Proposals...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center">
                <p className="text-rose-500 font-bold">{error}</p>
                <button onClick={fetchInquiries} className="mt-4 text-primary font-bold underline">Try Again</button>
            </div>
        );
    }

    const filteredInquiries = inquiries.filter(inq => filter === "all" || inq.status === filter);

    return (
        <div className="space-y-8">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                {[
                    { id: 'all', label: 'All Proposals', icon: Database },
                    { id: 'pending', label: 'Pending', icon: Clock },
                    { id: 'reviewed', label: 'Reviewed', icon: Zap },
                    { id: 'contacted', label: 'Contacted', icon: Activity },
                    { id: 'rejected', label: 'Rejected', icon: XCircle },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            filter === tab.id 
                            ? 'bg-white text-blue-600 shadow-lg shadow-blue-900/5' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {inquiries.filter(i => tab.id === 'all' || i.status === tab.id).length > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[9px] ${
                                filter === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'
                            }`}>
                                {inquiries.filter(i => tab.id === 'all' || i.status === tab.id).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filteredInquiries.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <Handshake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-gray-800">No proposals yet</h4>
                    <p className="text-gray-500 font-medium">New partnership applications will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredInquiries.map((inquiry) => (
                            <motion.div
                                key={inquiry._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden"
                            >
                                {/* Main Header Bar */}
                                <div 
                                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                    onClick={() => toggleExpand(inquiry._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${inquiry.type === 'hospital' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {inquiry.type === 'hospital' ? <Building2 className="w-7 h-7" /> : <Heart className="w-7 h-7" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-gray-900 text-lg leading-tight">{inquiry.organizationName}</h4>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(inquiry.status)}`}>
                                                    {inquiry.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium">
                                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {inquiry.city}, {inquiry.area}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="flex items-center gap-1 uppercase text-xs tracking-tighter">
                                                    {inquiry.type === 'hospital' ? 'Healthcare Partner' : 'NGO / Blood Bank'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden md:block">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Received On</p>
                                            <p className="text-xs font-bold text-gray-700">{new Date(inquiry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div className="h-10 w-[1px] bg-gray-100 mx-2 hidden md:block" />
                                        <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-primary transition-colors">
                                            {expandedId === inquiry._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {expandedId === inquiry._id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-50 bg-slate-50/30"
                                        >
                                            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                                                {/* Column 1: Contact Info */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Primary Contact</h5>
                                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-400 uppercase">Name & Role</p>
                                                                <p className="font-black text-gray-900">{inquiry.contactPersonName}</p>
                                                                <p className="text-xs font-bold text-primary uppercase">{inquiry.designation}</p>
                                                            </div>
                                                            <div className="pt-3 border-t border-gray-50 flex flex-col gap-2">
                                                                <a href={`tel:${inquiry.phoneNumber}`} className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-primary transition-colors">
                                                                    <Phone className="w-4 h-4 text-emerald-500" /> {inquiry.phoneNumber}
                                                                </a>
                                                                <a href={`mailto:${inquiry.email}`} className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-primary transition-colors">
                                                                    <Mail className="w-4 h-4 text-blue-500" /> {inquiry.email}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {inquiry.interestedPlan && (
                                                        <div>
                                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Interested Plan</h5>
                                                            <div className="bg-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-200 text-white">
                                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Selected Program</p>
                                                                <p className="text-lg font-black">{inquiry.interestedPlan}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Column 2: Facility Details */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Facility Details</h5>
                                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                                            {inquiry.type === 'hospital' ? (
                                                                <>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Specializations</p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {inquiry.specializations?.map((s: string) => (
                                                                                <span key={s} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">{s}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                                                        <div>
                                                                            <p className="text-xs font-bold text-gray-400 uppercase">Doctors</p>
                                                                            <p className="font-black text-gray-900">{inquiry.doctorCount || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-gray-400 uppercase">Facility Type</p>
                                                                            <p className="font-black text-gray-900">{inquiry.facilityType || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Blood Groups Coverage</p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {inquiry.bloodGroups?.map((g: string) => (
                                                                                <span key={g} className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold">{g}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                                                        <div>
                                                                            <p className="text-xs font-bold text-gray-400 uppercase">Donor Count</p>
                                                                            <p className="font-black text-gray-900">{inquiry.donorCount || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-gray-400 uppercase">Digitized?</p>
                                                                            <p className="font-black text-emerald-600">{inquiry.isDigitized}</p>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                            <div className="pt-3 border-t border-gray-50">
                                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Official Address</p>
                                                                <p className="text-sm font-medium text-gray-700 leading-relaxed italic">{inquiry.address}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 3: Message & Actions */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Message from Partner</h5>
                                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[120px]">
                                                            <p className="text-sm text-gray-600 leading-relaxed italic">
                                                                {inquiry.message || "No additional message provided."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Review Management</h5>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <button 
                                                                onClick={() => handleStatusUpdate(inquiry._id, 'reviewed')}
                                                                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inquiry.status === 'reviewed' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'}`}
                                                            >
                                                                Mark Reviewed
                                                            </button>
                                                            <button 
                                                                onClick={() => handleStatusUpdate(inquiry._id, 'contacted')}
                                                                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inquiry.status === 'contacted' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50'}`}
                                                            >
                                                                Mark Contacted
                                                            </button>
                                                            <button 
                                                                onClick={() => handleStatusUpdate(inquiry._id, 'rejected')}
                                                                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inquiry.status === 'rejected' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50'}`}
                                                            >
                                                                Reject Application
                                                            </button>
                                                            <button 
                                                                onClick={() => handleStatusUpdate(inquiry._id, 'pending')}
                                                                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inquiry.status === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white text-amber-600 border border-amber-100 hover:bg-amber-50'}`}
                                                            >
                                                                Keep Pending
                                                            </button>
                                                            <a 
                                                                href={`https://mail.zoho.com/zm/#mail/compose?to=${inquiry.email}&subject=Pillora Partnership Proposal - ${inquiry.organizationName}&body=Dear ${inquiry.contactPersonName},%0D%0A%0D%0AThank you for your interest in partnering with Pillora. We have reviewed your proposal for ${inquiry.organizationName}...`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="col-span-2 flex items-center justify-center gap-2 px-4 py-4 bg-[#0067ff] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0052cc] transition-all shadow-xl shadow-blue-100 mt-2"
                                                            >
                                                                <Mail className="w-4 h-4" />
                                                                Send via Zoho Mail
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
