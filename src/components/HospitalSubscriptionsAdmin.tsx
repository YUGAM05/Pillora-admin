"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CreditCard, 
    Calendar, 
    Clock, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    Search, 
    Filter, 
    RotateCcw, 
    Receipt, 
    Plus, 
    FileText, 
    ChevronRight, 
    Info, 
    ShieldCheck, 
    AlertCircle, 
    IndianRupee, 
    Building2,
    History,
    Edit3,
    ArrowUpRight,
    Loader2,
    CalendarCheck,
    CalendarX,
    Eye
} from "lucide-react";

interface IHospitalSub {
    _id: string;
    name: string;
    city: string;
    contactNumber?: string;
    joiningDate?: string;
    subscriptionDurationDays: number;
    paymentStatus: 'Pending' | 'Paid';
    subscriptionStatus: 'Active' | 'Pending Payment' | 'Expiring Soon' | 'Expired';
    lastPaymentDate?: string;
    subscriptionStartDate?: string;
    subscriptionExpiryDate?: string;
    daysRemaining: number;
    lastPaymentAmount?: number;
    lastPaymentMethod?: string;
    lastPaymentReference?: string;
    adminNotes?: string;
}

interface ISubscriptionSummary {
    totalHospitals: number;
    activeSubscriptions: number;
    pendingPayments: number;
    expiringWithin5Days: number;
    expiredSubscriptions: number;
    paymentsReceivedThisMonth: number;
}

interface IPaymentRecord {
    _id: string;
    hospitalId: string;
    paymentDate: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    previousExpiryDate?: string;
    newStartDate: string;
    newExpiryDate: string;
    renewalType: string;
    adminNotes?: string;
    recordedBy?: string;
    createdAt: string;
}

export default function HospitalSubscriptionsAdmin() {
    const [hospitals, setHospitals] = useState<IHospitalSub[]>([]);
    const [summary, setSummary] = useState<ISubscriptionSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("expiry_asc");

    // Modal States
    const [paymentModalHospital, setPaymentModalHospital] = useState<IHospitalSub | null>(null);
    const [historyModalHospital, setHistoryModalHospital] = useState<IHospitalSub | null>(null);
    const [editModalHospital, setEditModalHospital] = useState<IHospitalSub | null>(null);

    // Payment Form State
    const [paymentForm, setPaymentForm] = useState({
        paymentDate: new Date().toISOString().split('T')[0],
        amount: "5000",
        paymentMethod: "UPI",
        transactionReference: "",
        adminNotes: "",
    });
    const [submittingPayment, setSubmittingPayment] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        joiningDate: "",
        subscriptionStartDate: "",
        subscriptionExpiryDate: "",
        adminNotes: "",
    });
    const [submittingEdit, setSubmittingEdit] = useState(false);

    // History Records State
    const [paymentHistory, setPaymentHistory] = useState<IPaymentRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const fetchSummary = useCallback(async () => {
        try {
            const res = await api.get("/admin/subscriptions/summary");
            if (res.data) {
                setSummary(res.data);
            }
        } catch (err: any) {
            console.error("Failed to fetch subscription summary, will compute from hospitals if needed", err);
        }
    }, []);

    const fetchHospitals = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params: any = {};
            if (search.trim()) params.search = search.trim();
            if (statusFilter !== "all") params.status = statusFilter;
            if (paymentFilter !== "all") params.paymentStatus = paymentFilter;

            const res = await api.get("/admin/subscriptions", { params });
            const list = Array.isArray(res.data) 
                ? res.data 
                : (Array.isArray(res.data?.hospitals) ? res.data.hospitals : []);
            setHospitals(list);
        } catch (err: any) {
            console.warn("Direct /admin/subscriptions endpoint returned error, trying fallback to /hospitals", err);
            try {
                // Resilient fallback to /hospitals so admin panel never shows blank/error during transitions
                const fallbackRes = await api.get("/hospitals");
                const rawList = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
                const now = new Date();
                
                const mapped: IHospitalSub[] = rawList.map((h: any) => {
                    const pStatus = (h.paymentStatus === 'Paid' ? 'Paid' : 'Pending') as 'Paid' | 'Pending';
                    const jDate = h.joiningDate || h.createdAt;
                    const sExpiry = h.subscriptionExpiryDate ? new Date(h.subscriptionExpiryDate) : null;
                    let sStatus: 'Active' | 'Pending Payment' | 'Expiring Soon' | 'Expired' = 'Pending Payment';
                    let daysRem = 0;

                    if (pStatus === 'Pending' || !sExpiry) {
                        sStatus = 'Pending Payment';
                        daysRem = 0;
                    } else {
                        daysRem = Math.ceil((sExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        if (daysRem <= 0) {
                            sStatus = 'Expired';
                            daysRem = 0;
                        } else if (daysRem <= 5) {
                            sStatus = 'Expiring Soon';
                        } else {
                            sStatus = 'Active';
                        }
                    }

                    return {
                        _id: h._id,
                        name: h.name,
                        city: h.city || '',
                        contactNumber: h.contactNumber,
                        joiningDate: jDate,
                        subscriptionDurationDays: h.subscriptionDurationDays || 30,
                        paymentStatus: pStatus,
                        subscriptionStatus: sStatus,
                        lastPaymentDate: h.lastPaymentDate,
                        subscriptionStartDate: h.subscriptionStartDate,
                        subscriptionExpiryDate: h.subscriptionExpiryDate,
                        daysRemaining: daysRem,
                        lastPaymentAmount: h.lastPaymentAmount,
                        lastPaymentMethod: h.lastPaymentMethod,
                        lastPaymentReference: h.lastPaymentReference,
                        adminNotes: h.adminNotes || '',
                    };
                });

                // Apply search and filter on fallback data if needed
                let filtered = mapped;
                if (search.trim()) {
                    const term = search.trim().toLowerCase();
                    filtered = filtered.filter(h => h.name.toLowerCase().includes(term) || h.city.toLowerCase().includes(term));
                }
                if (statusFilter !== "all") {
                    filtered = filtered.filter(h => h.subscriptionStatus.toLowerCase() === statusFilter.toLowerCase());
                }
                if (paymentFilter !== "all") {
                    filtered = filtered.filter(h => h.paymentStatus.toLowerCase() === paymentFilter.toLowerCase());
                }

                setHospitals(filtered);

                // Populate summary if summary endpoint had failed
                setSummary(prev => prev || {
                    totalHospitals: mapped.length,
                    activeSubscriptions: mapped.filter(m => m.subscriptionStatus === 'Active').length,
                    pendingPayments: mapped.filter(m => m.paymentStatus === 'Pending').length,
                    expiringWithin5Days: mapped.filter(m => m.subscriptionStatus === 'Expiring Soon').length,
                    expiredSubscriptions: mapped.filter(m => m.subscriptionStatus === 'Expired').length,
                    paymentsReceivedThisMonth: 0
                });
            } catch (fallbackErr: any) {
                console.error("Both subscription endpoint and hospitals fallback failed", fallbackErr);
                setError(err.response?.data?.message || "Failed to load hospital subscriptions. Please check backend connection.");
            }
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, paymentFilter]);

    useEffect(() => {
        fetchSummary();
        fetchHospitals();
    }, [fetchSummary, fetchHospitals]);

    // Handle Sorting
    const sortedHospitals = useMemo(() => {
        const list = [...hospitals];
        if (sortBy === "expiry_asc") {
            return list.sort((a, b) => {
                if (!a.subscriptionExpiryDate) return 1;
                if (!b.subscriptionExpiryDate) return -1;
                return new Date(a.subscriptionExpiryDate).getTime() - new Date(b.subscriptionExpiryDate).getTime();
            });
        }
        if (sortBy === "expiry_desc") {
            return list.sort((a, b) => {
                if (!a.subscriptionExpiryDate) return 1;
                if (!b.subscriptionExpiryDate) return -1;
                return new Date(b.subscriptionExpiryDate).getTime() - new Date(a.subscriptionExpiryDate).getTime();
            });
        }
        if (sortBy === "days_asc") {
            return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
        }
        if (sortBy === "name_asc") {
            return list.sort((a, b) => a.name.localeCompare(b.name));
        }
        if (sortBy === "joining_desc") {
            return list.sort((a, b) => {
                const dateA = a.joiningDate ? new Date(a.joiningDate).getTime() : 0;
                const dateB = b.joiningDate ? new Date(b.joiningDate).getTime() : 0;
                return dateB - dateA;
            });
        }
        return list;
    }, [hospitals, sortBy]);

    // Open Payment Modal
    const handleOpenPaymentModal = (hospital: IHospitalSub) => {
        setPaymentModalHospital(hospital);
        setPaymentForm({
            paymentDate: new Date().toISOString().split('T')[0],
            amount: hospital.lastPaymentAmount ? String(hospital.lastPaymentAmount) : "5000",
            paymentMethod: hospital.lastPaymentMethod || "UPI",
            transactionReference: "",
            adminNotes: "",
        });
    };

    // Open History Modal
    const handleOpenHistoryModal = async (hospital: IHospitalSub) => {
        setHistoryModalHospital(hospital);
        setLoadingHistory(true);
        try {
            const res = await api.get(`/admin/hospitals/${hospital._id}/payments`);
            setPaymentHistory(res.data.payments || []);
        } catch (err: any) {
            console.error("Failed to fetch payment history", err);
            showToast("Failed to load payment history records");
        } finally {
            setLoadingHistory(false);
        }
    };

    // Open Edit Modal
    const handleOpenEditModal = (hospital: IHospitalSub) => {
        setEditModalHospital(hospital);
        setEditForm({
            joiningDate: hospital.joiningDate ? new Date(hospital.joiningDate).toISOString().split('T')[0] : "",
            subscriptionStartDate: hospital.subscriptionStartDate ? new Date(hospital.subscriptionStartDate).toISOString().split('T')[0] : "",
            subscriptionExpiryDate: hospital.subscriptionExpiryDate ? new Date(hospital.subscriptionExpiryDate).toISOString().split('T')[0] : "",
            adminNotes: hospital.adminNotes || "",
        });
    };

    // Calculate preview for Payment Modal
    const previewRenewal = useMemo(() => {
        if (!paymentModalHospital) return null;
        const pDate = new Date(paymentForm.paymentDate);
        if (isNaN(pDate.getTime())) return null;

        const currentExpiry = paymentModalHospital.subscriptionExpiryDate 
            ? new Date(paymentModalHospital.subscriptionExpiryDate) 
            : null;

        const isCurrentlyActive = currentExpiry && currentExpiry > new Date();

        if (isCurrentlyActive && currentExpiry) {
            // Case B: Extend from existing expiry
            const newExpiry = new Date(currentExpiry);
            newExpiry.setDate(newExpiry.getDate() + 30);
            return {
                type: "Extension (Preserves remaining days)",
                startDate: paymentModalHospital.subscriptionStartDate ? new Date(paymentModalHospital.subscriptionStartDate).toLocaleDateString() : pDate.toLocaleDateString(),
                newExpiry: newExpiry.toLocaleDateString(),
                note: `Adds 30 calendar days to current expiry date (${currentExpiry.toLocaleDateString()})`
            };
        } else {
            // Case A or C: Fresh 30-day cycle
            const newExpiry = new Date(pDate);
            newExpiry.setDate(newExpiry.getDate() + 30);
            return {
                type: currentExpiry ? "Renewal after Expiry" : "Initial Activation",
                startDate: pDate.toLocaleDateString(),
                newExpiry: newExpiry.toLocaleDateString(),
                note: `Starts a brand new 30-day cycle from payment date (${pDate.toLocaleDateString()})`
            };
        }
    }, [paymentModalHospital, paymentForm.paymentDate]);

    // Submit Payment Record
    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentModalHospital) return;

        setSubmittingPayment(true);
        try {
            const payload = {
                paymentDate: paymentForm.paymentDate,
                amount: Number(paymentForm.amount) || 0,
                paymentMethod: paymentForm.paymentMethod,
                transactionReference: paymentForm.transactionReference,
                adminNotes: paymentForm.adminNotes,
            };

            const res = await api.post(`/admin/hospitals/${paymentModalHospital._id}/payments`, payload);
            showToast(`✅ Payment confirmed! 30-Day subscription activated for ${paymentModalHospital.name}.`);
            setPaymentModalHospital(null);
            fetchSummary();
            fetchHospitals();
        } catch (err: any) {
            console.error("Payment recording failed", err);
            alert(err.response?.data?.message || "Failed to record payment");
        } finally {
            setSubmittingPayment(false);
        }
    };

    // Submit Edit Details
    const handleUpdateDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModalHospital) return;

        setSubmittingEdit(true);
        try {
            const payload = {
                joiningDate: editForm.joiningDate,
                subscriptionStartDate: editForm.subscriptionStartDate || undefined,
                subscriptionExpiryDate: editForm.subscriptionExpiryDate || undefined,
                adminNotes: editForm.adminNotes,
            };

            await api.put(`/admin/hospitals/${editModalHospital._id}/subscription`, payload);
            showToast(`✅ Hospital subscription details updated for ${editModalHospital.name}.`);
            setEditModalHospital(null);
            fetchSummary();
            fetchHospitals();
        } catch (err: any) {
            console.error("Subscription update failed", err);
            alert(err.response?.data?.message || "Failed to update hospital details");
        } finally {
            setSubmittingEdit(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        } catch {
            return "—";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Active":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                    </span>
                );
            case "Expiring Soon":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Expiring Soon
                    </span>
                );
            case "Expired":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-black uppercase tracking-wider">
                        <CalendarX className="w-3.5 h-3.5 text-rose-600" /> Expired
                    </span>
                );
            case "Pending Payment":
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-black uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> Pending Payment
                    </span>
                );
        }
    };

    const getDaysRemainingBadge = (days: number, status: string) => {
        if (status === 'Pending Payment') {
            return (
                <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                    No Active Cycle
                </span>
            );
        }
        if (days <= 0 || status === 'Expired') {
            return (
                <span className="inline-flex items-center px-2.5 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-extrabold">
                    Expired (0 days)
                </span>
            );
        }
        if (days <= 5) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-extrabold animate-pulse">
                    {days} {days === 1 ? 'day' : 'days'} left
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-extrabold">
                {days} days left
            </span>
        );
    };

    return (
        <div className="space-y-10">
            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-8 right-8 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 font-medium text-sm"
                    >
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-jakarta">
                        Hospital Subscriptions & 30-Day Payment Cycles
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Automated 30-day billing enforcement. Hospitals require an active subscription to generate and publish appointment slots.
                    </p>
                </div>
                <button
                    onClick={() => {
                        fetchSummary();
                        fetchHospitals();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all self-start md:self-auto"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Refresh Statuses
                </button>
            </div>

            {/* Section 7 Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Total Hospitals</span>
                            <Building2 className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-2xl font-black text-slate-900">{summary.totalHospitals}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Registered in network</p>
                    </div>

                    <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-emerald-600">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-black text-emerald-700">{summary.activeSubscriptions}</p>
                        <p className="text-[10px] text-emerald-600 font-medium">Slots enabled</p>
                    </div>

                    <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-amber-600">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Pay</span>
                            <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-2xl font-black text-amber-700">{summary.pendingPayments}</p>
                        <p className="text-[10px] text-amber-600 font-medium">Awaiting confirmation</p>
                    </div>

                    <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-orange-600">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Expiring &le; 5 Days</span>
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                        </div>
                        <p className="text-2xl font-black text-orange-700">{summary.expiringWithin5Days}</p>
                        <p className="text-[10px] text-orange-600 font-medium">Needs renewal soon</p>
                    </div>

                    <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-rose-600">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Expired</span>
                            <CalendarX className="w-4 h-4 text-rose-500" />
                        </div>
                        <p className="text-2xl font-black text-rose-700">{summary.expiredSubscriptions}</p>
                        <p className="text-[10px] text-rose-600 font-medium">Slot gen blocked</p>
                    </div>

                    <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-indigo-600">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Paid This Month</span>
                            <IndianRupee className="w-4 h-4 text-indigo-500" />
                        </div>
                        <p className="text-2xl font-black text-indigo-700">₹{summary.paymentsReceivedThisMonth.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-indigo-600 font-medium">Current cycle revenue</p>
                    </div>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative md:col-span-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search hospital or city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:bg-white text-slate-900 transition-all"
                        />
                    </div>

                    {/* Subscription Status Filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 text-slate-800"
                        >
                            <option value="all">All Subscription Statuses</option>
                            <option value="Active">Active Only</option>
                            <option value="Expiring Soon">Expiring Soon (Within 5 Days)</option>
                            <option value="Pending Payment">Pending Payment Only</option>
                            <option value="Expired">Expired Only</option>
                        </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 text-slate-800"
                        >
                            <option value="all">All Payment Statuses</option>
                            <option value="Paid">Paid Only</option>
                            <option value="Pending">Pending Only</option>
                        </select>
                    </div>

                    {/* Sort By */}
                    <div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 text-slate-800"
                        >
                            <option value="expiry_asc">Sort: Expiry Date (Soonest first)</option>
                            <option value="expiry_desc">Sort: Expiry Date (Furthest first)</option>
                            <option value="days_asc">Sort: Days Remaining (Low to High)</option>
                            <option value="name_asc">Sort: Hospital Name (A to Z)</option>
                            <option value="joining_desc">Sort: Joining Date (Newest first)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-bold flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> {error}
                </div>
            )}

            {/* Hospital Subscriptions Table */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                        <p className="text-sm font-bold text-slate-400">Loading subscription records...</p>
                    </div>
                ) : sortedHospitals.length === 0 ? (
                    <div className="p-16 text-center">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-slate-700">No Hospitals Found</h4>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                                <tr>
                                    <th className="py-4 px-6">Hospital Details</th>
                                    <th className="py-4 px-4">Joining Date</th>
                                    <th className="py-4 px-4">Last Payment</th>
                                    <th className="py-4 px-4">Cycle Period</th>
                                    <th className="py-4 px-4 text-center">Remaining</th>
                                    <th className="py-4 px-4 text-center">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                                {sortedHospitals.map((h) => (
                                    <tr key={h._id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-slate-900 text-base">{h.name}</div>
                                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                                <span>{h.city}</span>
                                                {h.contactNumber && <span>• {h.contactNumber}</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="text-xs font-bold text-slate-700">{formatDate(h.joiningDate)}</div>
                                            <div className="text-[10px] text-slate-400">Onboarded</div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="text-xs font-bold text-slate-900">
                                                {formatDate(h.lastPaymentDate)}
                                            </div>
                                            {h.lastPaymentAmount ? (
                                                <div className="text-[11px] text-emerald-600 font-bold">
                                                    ₹{h.lastPaymentAmount.toLocaleString('en-IN')} via {h.lastPaymentMethod || 'UPI'}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-amber-600 font-semibold">No payment on file</div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            {h.subscriptionStartDate && h.subscriptionExpiryDate ? (
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800">
                                                        {formatDate(h.subscriptionStartDate)} – {formatDate(h.subscriptionExpiryDate)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">30 Calendar Days</div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Not yet started</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-center whitespace-nowrap">
                                            {getDaysRemainingBadge(h.daysRemaining, h.subscriptionStatus)}
                                        </td>
                                        <td className="py-4 px-4 text-center whitespace-nowrap">
                                            {getStatusBadge(h.subscriptionStatus)}
                                        </td>
                                        <td className="py-4 px-6 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenPaymentModal(h)}
                                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                                                    title="Record payment and activate or renew subscription"
                                                >
                                                    <CreditCard className="w-3.5 h-3.5" />
                                                    {h.subscriptionStatus === 'Active' ? 'Renew 30 Days' : 'Record Payment'}
                                                </button>

                                                <button
                                                    onClick={() => handleOpenHistoryModal(h)}
                                                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                                                    title="View all past payment transactions"
                                                >
                                                    <History className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleOpenEditModal(h)}
                                                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                                                    title="Edit subscription dates and notes"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL 1: RECORD PAYMENT / RENEW */}
            <AnimatePresence>
                {paymentModalHospital && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 relative border border-slate-100 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 font-jakarta">
                                        Record Payment & Renew Subscription
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Hospital: <strong className="text-slate-800">{paymentModalHospital.name}</strong> ({paymentModalHospital.city})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setPaymentModalHospital(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Live Renewal Preview Box */}
                            {previewRenewal && (
                                <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/80 border border-indigo-100 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between text-xs font-black uppercase text-indigo-700 tracking-wider">
                                        <span>Renewal Policy: {previewRenewal.type}</span>
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                                        <div>
                                            <span className="text-slate-400 font-semibold">Start Date:</span>
                                            <p className="font-bold text-slate-800">{previewRenewal.startDate}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 font-semibold">New Expiry Date (30 Days):</span>
                                            <p className="font-bold text-indigo-600">{previewRenewal.newExpiry}</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-indigo-100/60">
                                        ℹ️ {previewRenewal.note}
                                    </p>
                                </div>
                            )}

                            {/* Payment Input Form */}
                            <form onSubmit={handleRecordPayment} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase">Payment Received Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={paymentForm.paymentDate}
                                            onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase">Payment Amount (₹) *</label>
                                        <input
                                            type="number"
                                            required
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                            placeholder="5000"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase">Payment Method *</label>
                                        <select
                                            value={paymentForm.paymentMethod}
                                            onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                                        >
                                            <option value="UPI">UPI / QR</option>
                                            <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Credit / Debit Card</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase">Transaction Ref / UTR</label>
                                        <input
                                            type="text"
                                            value={paymentForm.transactionReference}
                                            onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionReference: e.target.value }))}
                                            placeholder="e.g. UTR847291038"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Admin Remarks / Notes</label>
                                    <textarea
                                        rows={2}
                                        value={paymentForm.adminNotes}
                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                                        placeholder="Optional payment confirmation notes..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-blue-500 resize-none"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentModalHospital(null)}
                                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingPayment}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Confirm & Activate Subscription
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 2: PAYMENT HISTORY */}
            <AnimatePresence>
                {historyModalHospital && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 relative border border-slate-100 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 font-jakarta flex items-center gap-2">
                                        <History className="w-5 h-5 text-blue-600" />
                                        Payment History & Audit Trail
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        All historical transactions for <strong className="text-slate-800">{historyModalHospital.name}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setHistoryModalHospital(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            {loadingHistory ? (
                                <div className="p-12 text-center">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-slate-400 font-semibold">Fetching transactions...</p>
                                </div>
                            ) : paymentHistory.length === 0 ? (
                                <div className="p-12 text-center bg-slate-50 rounded-2xl">
                                    <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <h4 className="text-sm font-bold text-slate-700">No Payment Records Yet</h4>
                                    <p className="text-xs text-slate-400 mt-1">
                                        This hospital has not recorded any payments yet. Subscription remains in Pending status.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                            <tr>
                                                <th className="py-3 px-3">Date</th>
                                                <th className="py-3 px-3">Amount</th>
                                                <th className="py-3 px-3">Method / Ref</th>
                                                <th className="py-3 px-3">Cycle Granted</th>
                                                <th className="py-3 px-3">Type</th>
                                                <th className="py-3 px-3">Admin Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {paymentHistory.map((rec) => (
                                                <tr key={rec._id} className="hover:bg-slate-50/50">
                                                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">
                                                        {formatDate(rec.paymentDate)}
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap font-black text-emerald-600">
                                                        ₹{rec.amount.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <div className="font-semibold text-slate-800">{rec.paymentMethod}</div>
                                                        {rec.transactionReference && (
                                                            <div className="text-[10px] font-mono text-slate-400">{rec.transactionReference}</div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <div className="font-semibold text-slate-800">
                                                            {formatDate(rec.newStartDate)} – {formatDate(rec.newExpiryDate)}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">30 Days</div>
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            rec.renewalType === 'EXTENSION'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                            {rec.renewalType}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate" title={rec.adminNotes}>
                                                        {rec.adminNotes || "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end border-t border-slate-100">
                                <button
                                    onClick={() => setHistoryModalHospital(null)}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                                >
                                    Close History
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 3: EDIT SUBSCRIPTION DATES & DETAILS */}
            <AnimatePresence>
                {editModalHospital && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 relative border border-slate-100"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 font-jakarta">
                                        Edit Subscription Details
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Hospital: <strong className="text-slate-800">{editModalHospital.name}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditModalHospital(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateDetails} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Hospital Joining Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={editForm.joiningDate}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                                    />
                                    <p className="text-[10px] text-slate-400">Official onboarding date</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase">Start Date</label>
                                        <input
                                            type="date"
                                            value={editForm.subscriptionStartDate}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, subscriptionStartDate: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase">Expiry Date</label>
                                        <input
                                            type="date"
                                            value={editForm.subscriptionExpiryDate}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, subscriptionExpiryDate: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Admin Notes</label>
                                    <textarea
                                        rows={3}
                                        value={editForm.adminNotes}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                                        placeholder="Internal notes regarding this hospital's account..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-blue-500 resize-none"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setEditModalHospital(null)}
                                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingEdit}
                                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {submittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
