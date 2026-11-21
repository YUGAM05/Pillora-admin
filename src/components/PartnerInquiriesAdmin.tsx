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
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'reviewed': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'contacted': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="mb-3 h-7 w-7 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">Retrieving partnership proposals...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center py-12 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><XCircle className="h-6 w-6" /></span>
                <p className="text-sm font-medium text-rose-600">{error}</p>
                <button onClick={fetchInquiries} className="ui-btn-secondary mt-4">Try again</button>
            </div>
        );
    }

    const filteredInquiries = inquiries.filter(inq => filter === "all" || inq.status === filter);

    return (
        <div className="space-y-5">
            {/* Status Tabs */}
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                {[
                    { id: 'all', label: 'All proposals', icon: Handshake },
                    { id: 'pending', label: 'Pending', icon: Clock },
                    { id: 'reviewed', label: 'Reviewed', icon: CheckCircle2 },
                    { id: 'contacted', label: 'Contacted', icon: Phone },
                    { id: 'rejected', label: 'Rejected', icon: XCircle },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        aria-pressed={filter === tab.id}
                        className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition ${
                            filter === tab.id
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        }`}
                    >
                        <tab.icon className={`h-4 w-4 ${filter === tab.id ? 'text-white' : 'text-slate-400'}`} />
                        {tab.label}
                        {inquiries.filter(i => tab.id === 'all' || i.status === tab.id).length > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                                filter === tab.id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {inquiries.filter(i => tab.id === 'all' || i.status === tab.id).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filteredInquiries.length === 0 ? (
                <div className="ui-empty">
                    <Handshake className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <h4 className="text-sm font-semibold text-slate-700">No proposals yet</h4>
                    <p className="mt-1">New partnership applications will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    <AnimatePresence mode="popLayout">
                        {filteredInquiries.map((inquiry) => (
                            <motion.div
                                key={inquiry._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300"
                            >
                                {/* Main Header Bar */}
                                <div
                                    className="flex cursor-pointer flex-col justify-between gap-3 p-4 transition-colors hover:bg-slate-50/60 sm:p-5 md:flex-row md:items-center"
                                    onClick={() => toggleExpand(inquiry._id)}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${inquiry.type === 'hospital' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {inquiry.type === 'hospital' ? <Building2 className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-base font-semibold leading-tight text-slate-900">{inquiry.organizationName}</h4>
                                                <span className={`ui-badge capitalize ${getStatusColor(inquiry.status)}`}>
                                                    {inquiry.status}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                                                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {inquiry.city}, {inquiry.area}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="flex items-center gap-1">
                                                    {inquiry.type === 'hospital' ? 'Healthcare partner' : 'NGO / blood bank'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
                                        <div className="text-left md:text-right">
                                            <p className="text-xs font-medium text-slate-500">Received on</p>
                                            <p className="text-sm font-medium text-slate-700">{new Date(inquiry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div className="mx-1 hidden h-10 w-px bg-slate-200 md:block" />
                                        <button aria-expanded={expandedId === inquiry._id} aria-label="Toggle details" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900">
                                            {expandedId === inquiry._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                                            className="overflow-hidden border-t border-slate-100 bg-slate-50/60"
                                        >
                                            <div className="grid grid-cols-1 gap-5 p-4 sm:p-5 lg:grid-cols-3 lg:gap-6">
                                                {/* Column 1: Contact Info */}
                                                <div className="space-y-5">
                                                    <div>
                                                        <h5 className="mb-2 text-xs font-medium text-slate-500">Primary contact</h5>
                                                        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                                                            <div>
                                                                <p className="text-xs font-medium text-slate-500">Name & role</p>
                                                                <p className="mt-0.5 font-semibold text-slate-900">{inquiry.contactPersonName}</p>
                                                                <p className="text-sm text-slate-600">{inquiry.designation}</p>
                                                            </div>
                                                            <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
                                                                <a href={`tel:${inquiry.phoneNumber}`} className="flex min-h-[40px] items-center gap-2 break-all text-sm font-medium text-slate-700 transition-colors hover:text-blue-600">
                                                                    <Phone className="h-4 w-4 shrink-0 text-emerald-600" /> {inquiry.phoneNumber}
                                                                </a>
                                                                <a href={`mailto:${inquiry.email}`} className="flex min-h-[40px] items-center gap-2 break-all text-sm font-medium text-slate-700 transition-colors hover:text-blue-600">
                                                                    <Mail className="h-4 w-4 shrink-0 text-blue-600" /> {inquiry.email}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {inquiry.interestedPlan && (
                                                        <div>
                                                            <h5 className="mb-2 text-xs font-medium text-slate-500">Interested plan</h5>
                                                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                                <p className="text-xs font-medium text-blue-700">Selected program</p>
                                                                <p className="mt-0.5 text-base font-semibold text-blue-900">{inquiry.interestedPlan}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Column 2: Facility Details */}
                                                <div className="space-y-5">
                                                    <div>
                                                        <h5 className="mb-2 text-xs font-medium text-slate-500">Facility details</h5>
                                                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                                                            {inquiry.type === 'hospital' ? (
                                                                <>
                                                                    <div>
                                                                        <p className="mb-1.5 text-xs font-medium text-slate-500">Specializations</p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {inquiry.specializations?.map((s: string) => (
                                                                                <span key={s} className="ui-badge border-blue-200 bg-blue-50 text-blue-700">{s}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <p className="text-xs font-medium text-slate-500">Doctors</p>
                                                                            <p className="mt-0.5 font-semibold text-slate-900">{inquiry.doctorCount || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-medium text-slate-500">Facility type</p>
                                                                            <p className="mt-0.5 font-semibold text-slate-900">{inquiry.facilityType || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div>
                                                                        <p className="mb-1.5 text-xs font-medium text-slate-500">Blood groups coverage</p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {inquiry.bloodGroups?.map((g: string) => (
                                                                                <span key={g} className="ui-badge border-rose-200 bg-rose-50 text-rose-700">{g}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <p className="text-xs font-medium text-slate-500">Donor count</p>
                                                                            <p className="mt-0.5 font-semibold text-slate-900">{inquiry.donorCount || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-medium text-slate-500">Digitized?</p>
                                                                            <p className="mt-0.5 font-semibold text-slate-900">{inquiry.isDigitized}</p>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                            <div className="border-t border-slate-100 pt-3">
                                                                <p className="mb-1 text-xs font-medium text-slate-500">Official address</p>
                                                                <p className="text-sm leading-relaxed text-slate-700">{inquiry.address}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 3: Message & Actions */}
                                                <div className="space-y-5">
                                                    <div>
                                                        <h5 className="mb-2 text-xs font-medium text-slate-500">Message from partner</h5>
                                                        <div className="min-h-[96px] rounded-xl border border-slate-200 bg-white p-4">
                                                            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">
                                                                {inquiry.message || "No additional message provided."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h5 className="mb-2 text-xs font-medium text-slate-500">Review management</h5>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                onClick={() => handleStatusUpdate(inquiry._id, 'reviewed')}
                                                                aria-pressed={inquiry.status === 'reviewed'}
                                                                className={`ui-btn whitespace-normal border px-3 text-center leading-snug ${inquiry.status === 'reviewed' ? 'border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700' : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'}`}
                                                            >
                                                                Mark reviewed
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(inquiry._id, 'contacted')}
                                                                aria-pressed={inquiry.status === 'contacted'}
                                                                className={`ui-btn whitespace-normal border px-3 text-center leading-snug ${inquiry.status === 'contacted' ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700' : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'}`}
                                                            >
                                                                Mark contacted
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(inquiry._id, 'rejected')}
                                                                aria-pressed={inquiry.status === 'rejected'}
                                                                className={`ui-btn whitespace-normal border px-3 text-center leading-snug ${inquiry.status === 'rejected' ? 'border-rose-600 bg-rose-600 text-white shadow-sm hover:bg-rose-700' : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50'}`}
                                                            >
                                                                Reject application
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(inquiry._id, 'pending')}
                                                                aria-pressed={inquiry.status === 'pending'}
                                                                className={`ui-btn whitespace-normal border px-3 text-center leading-snug ${inquiry.status === 'pending' ? 'border-amber-500 bg-amber-500 text-white shadow-sm hover:bg-amber-600' : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'}`}
                                                            >
                                                                Keep pending
                                                            </button>
                                                            <a 
                                                                href={`https://mail.zoho.com/zm/#mail/compose?to=${inquiry.email}&subject=Pillora Partnership Proposal - ${inquiry.organizationName}&body=Dear ${inquiry.contactPersonName},%0D%0A%0D%0AThank you for your interest in partnering with Pillora. We have reviewed your proposal for ${inquiry.organizationName}...`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ui-btn-primary col-span-2 mt-1"
                                                            >
                                                                <Mail className="h-4 w-4" />
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
