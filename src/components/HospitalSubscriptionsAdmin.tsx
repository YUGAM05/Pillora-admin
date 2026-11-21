"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import AdminUsageModal from "@/components/AdminUsageModal";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Gauge,
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
    Eye,
    X
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
    // Usage, add-on packs and AI number for one hospital (AdminUsageModal)
    const [usageHospital, setUsageHospital] = useState<{ _id: string; name?: string } | null>(null);
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
                const raw = res.data;
                setSummary({
                    totalHospitals: raw.totalHospitals ?? raw.totalRegisteredHospitals ?? 0,
                    activeSubscriptions: raw.activeSubscriptions ?? 0,
                    pendingPayments: raw.pendingPayments ?? 0,
                    expiringWithin5Days: raw.expiringWithin5Days ?? 0,
                    expiredSubscriptions: raw.expiredSubscriptions ?? 0,
                    paymentsReceivedThisMonth: raw.paymentsReceivedThisMonth ?? raw.paymentsThisMonth?.totalAmount ?? 0,
                });
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
        const list = Array.isArray(hospitals) ? [...hospitals] : [];
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
            return list.sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));
        }
        if (sortBy === "name_asc") {
            return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "—";
            return d.toLocaleDateString("en-IN", {
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
                    <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </span>
                );
            case "Expiring Soon":
                return (
                    <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Expiring Soon
                    </span>
                );
            case "Expired":
                return (
                    <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">
                        <CalendarX className="h-3.5 w-3.5" /> Expired
                    </span>
                );
            case "Pending Payment":
            default:
                return (
                    <span className="ui-badge border-slate-200 bg-slate-100 text-slate-600">
                        <Clock className="h-3.5 w-3.5" /> Pending Payment
                    </span>
                );
        }
    };

    const getDaysRemainingBadge = (days: number, status: string) => {
        if (status === 'Pending Payment') {
            return (
                <span className="ui-badge border-slate-200 bg-slate-50 text-slate-500">
                    No active cycle
                </span>
            );
        }
        if (days <= 0 || status === 'Expired') {
            return (
                <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">
                    Expired (0 days)
                </span>
            );
        }
        if (days <= 5) {
            return (
                <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">
                    {days} {days === 1 ? 'day' : 'days'} left
                </span>
            );
        }
        return (
            <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                {days} days left
            </span>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        role="status"
                        aria-live="polite"
                        className="fixed left-4 right-4 top-4 z-[100] flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg sm:left-auto sm:right-6 sm:top-6 sm:max-w-md"
                    >
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Title Section */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="ui-title">
                        Hospital subscriptions & 30-day cycles
                    </h2>
                    <p className="ui-subtitle">
                        Automated 30-day billing enforcement. Hospitals require an active subscription to generate and publish appointment slots.
                    </p>
                </div>
                <button
                    onClick={() => {
                        fetchSummary();
                        fetchHospitals();
                    }}
                    className="ui-btn-secondary w-full shrink-0 sm:w-auto"
                >
                    <RotateCcw className="h-4 w-4" /> Refresh statuses
                </button>
            </div>

            {/* Section 7 Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                    <div className="ui-card p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-[13px] font-medium leading-snug text-slate-500">Total hospitals</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="h-5 w-5" /></span>
                        </div>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{summary.totalHospitals ?? 0}</p>
                        <p className="mt-1 text-xs leading-snug text-slate-500">Registered in network</p>
                    </div>

                    <div className="ui-card p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-[13px] font-medium leading-snug text-slate-500">Active</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></span>
                        </div>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{summary.activeSubscriptions ?? 0}</p>
                        <p className="mt-1 text-xs leading-snug text-slate-500">Slots enabled</p>
                    </div>

                    <div className="ui-card p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-[13px] font-medium leading-snug text-slate-500">Pending pay</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></span>
                        </div>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{summary.pendingPayments ?? 0}</p>
                        <p className="mt-1 text-xs leading-snug text-slate-500">Awaiting confirmation</p>
                    </div>

                    <div className="ui-card p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-[13px] font-medium leading-snug text-slate-500">Expiring &le; 5 days</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><AlertTriangle className="h-5 w-5" /></span>
                        </div>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{summary.expiringWithin5Days ?? 0}</p>
                        <p className="mt-1 text-xs leading-snug text-slate-500">Needs renewal soon</p>
                    </div>

                    <div className="ui-card p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-[13px] font-medium leading-snug text-slate-500">Expired</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><CalendarX className="h-5 w-5" /></span>
                        </div>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{summary.expiredSubscriptions ?? 0}</p>
                        <p className="mt-1 text-xs leading-snug text-slate-500">Slot gen blocked</p>
                    </div>

                    <div className="ui-card p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-[13px] font-medium leading-snug text-slate-500">Paid this month</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><IndianRupee className="h-5 w-5" /></span>
                        </div>
                        <p className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">₹{(Number(summary.paymentsReceivedThisMonth) || 0).toLocaleString('en-IN')}</p>
                        <p className="mt-1 text-xs leading-snug text-slate-500">Current cycle revenue</p>
                    </div>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="ui-card p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search hospital or city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search hospital or city"
                            className="ui-input pl-10"
                        />
                    </div>

                    {/* Subscription Status Filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label="Filter by subscription status"
                            className="ui-input"
                        >
                            <option value="all">All subscription statuses</option>
                            <option value="Active">Active only</option>
                            <option value="Expiring Soon">Expiring Soon (within 5 days)</option>
                            <option value="Pending Payment">Pending Payment only</option>
                            <option value="Expired">Expired only</option>
                        </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            aria-label="Filter by payment status"
                            className="ui-input"
                        >
                            <option value="all">All payment statuses</option>
                            <option value="Paid">Paid only</option>
                            <option value="Pending">Pending only</option>
                        </select>
                    </div>

                    {/* Sort By */}
                    <div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            aria-label="Sort hospitals"
                            className="ui-input"
                        >
                            <option value="expiry_asc">Sort: expiry date (soonest first)</option>
                            <option value="expiry_desc">Sort: expiry date (furthest first)</option>
                            <option value="days_asc">Sort: days remaining (low to high)</option>
                            <option value="name_asc">Sort: hospital name (A to Z)</option>
                            <option value="joining_desc">Sort: joining date (newest first)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                    <XCircle className="h-5 w-5 shrink-0" /> {error}
                </div>
            )}

            {/* Hospital Subscriptions Table */}
            <div className="ui-card overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16">
                        <Loader2 className="mb-3 h-7 w-7 animate-spin text-blue-600" />
                        <p className="text-sm text-slate-500">Loading subscription records...</p>
                    </div>
                ) : sortedHospitals.length === 0 ? (
                    <div className="ui-empty m-4 sm:m-5">
                        <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        <h4 className="font-medium text-slate-700">No hospitals found</h4>
                        <p className="mt-1">Try adjusting your filters or search keywords.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left">
                            <thead className="border-b border-slate-100 bg-slate-50/80">
                                <tr>
                                    <th className="ui-th pl-5 sm:pl-6">Hospital details</th>
                                    <th className="ui-th">Joining date</th>
                                    <th className="ui-th">Last payment</th>
                                    <th className="ui-th">Cycle period</th>
                                    <th className="ui-th text-center">Remaining</th>
                                    <th className="ui-th text-center">Status</th>
                                    <th className="ui-th pr-5 text-right sm:pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedHospitals.map((h) => (
                                    <tr key={h._id} className="transition-colors hover:bg-slate-50/60">
                                        <td className="ui-td pl-5 sm:pl-6">
                                            <div className="font-semibold text-slate-900">{h.name}</div>
                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                                                <span>{h.city}</span>
                                                {h.contactNumber && <span>• {h.contactNumber}</span>}
                                            </div>
                                        </td>
                                        <td className="ui-td whitespace-nowrap">
                                            <div className="font-medium text-slate-900">{formatDate(h.joiningDate)}</div>
                                            <div className="text-xs text-slate-500">Onboarded</div>
                                        </td>
                                        <td className="ui-td whitespace-nowrap">
                                            <div className="font-medium text-slate-900">
                                                {formatDate(h.lastPaymentDate)}
                                            </div>
                                            {h.lastPaymentAmount ? (
                                                <div className="text-xs font-medium text-emerald-600">
                                                    ₹{(Number(h.lastPaymentAmount) || 0).toLocaleString('en-IN')} via {h.lastPaymentMethod || 'UPI'}
                                                </div>
                                            ) : (
                                                <div className="text-xs font-medium text-amber-600">No payment on file</div>
                                            )}
                                        </td>
                                        <td className="ui-td whitespace-nowrap">
                                            {h.subscriptionStartDate && h.subscriptionExpiryDate ? (
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {formatDate(h.subscriptionStartDate)} – {formatDate(h.subscriptionExpiryDate)}
                                                    </div>
                                                    <div className="text-xs text-slate-500">30 calendar days</div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">Not yet started</span>
                                            )}
                                        </td>
                                        <td className="ui-td whitespace-nowrap text-center">
                                            {getDaysRemainingBadge(h.daysRemaining, h.subscriptionStatus)}
                                        </td>
                                        <td className="ui-td whitespace-nowrap text-center">
                                            {getStatusBadge(h.subscriptionStatus)}
                                        </td>
                                        <td className="ui-td whitespace-nowrap pr-5 text-right sm:pr-6">
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleOpenPaymentModal(h)}
                                                    className="ui-btn-primary ui-btn-sm min-h-[40px] md:min-h-[32px]"
                                                    title="Record payment and activate or renew subscription"
                                                >
                                                    <CreditCard className="h-3.5 w-3.5" />
                                                    {h.subscriptionStatus === 'Active' ? 'Renew 30 days' : 'Record payment'}
                                                </button>

                                                <button
                                                    onClick={() => handleOpenHistoryModal(h)}
                                                    className="ui-btn-secondary ui-btn-sm h-10 w-10 px-0 text-slate-500 hover:text-slate-900 md:h-8 md:w-8"
                                                    title="View all past payment transactions"
                                                    aria-label="View payment history"
                                                >
                                                    <History className="h-4 w-4" />
                                                </button>

                                                <button
                                                    onClick={() => setUsageHospital({ _id: h._id, name: h.name })}
                                                    className="ui-btn-secondary ui-btn-sm h-10 w-10 px-0 text-violet-600 hover:text-violet-700 md:h-8 md:w-8"
                                                    title="Usage, add-on packs and AI receptionist number"
                                                    aria-label="Usage, add-on packs and AI receptionist number"
                                                >
                                                    <Gauge className="h-4 w-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleOpenEditModal(h)}
                                                    className="ui-btn-secondary ui-btn-sm h-10 w-10 px-0 text-slate-500 hover:text-slate-900 md:h-8 md:w-8"
                                                    title="Edit subscription dates and notes"
                                                    aria-label="Edit subscription dates and notes"
                                                >
                                                    <Edit3 className="h-4 w-4" />
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
                    <div className="ui-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="record-payment-title"
                            className="ui-dialog sm:max-w-xl"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                                <div className="min-w-0">
                                    <h3 id="record-payment-title" className="text-lg font-semibold leading-tight text-slate-900">
                                        Record payment & renew subscription
                                    </h3>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        Hospital: <strong className="font-medium text-slate-800">{paymentModalHospital.name}</strong> ({paymentModalHospital.city})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setPaymentModalHospital(null)}
                                    aria-label="Close"
                                    className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 space-y-5 overflow-y-auto px-5 pt-5 sm:px-6">
                            {/* Live Renewal Preview Box */}
                            {previewRenewal && (
                                <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                    <div className="flex items-start justify-between gap-3 text-sm font-semibold text-blue-900">
                                        <span>Renewal policy: {previewRenewal.type}</span>
                                        <Clock className="h-4 w-4 shrink-0 text-blue-600" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
                                        <div>
                                            <span className="text-xs font-medium text-slate-500">Start date:</span>
                                            <p className="mt-0.5 font-semibold text-slate-900">{previewRenewal.startDate}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-slate-500">New expiry date (30 days):</span>
                                            <p className="mt-0.5 font-semibold text-blue-700">{previewRenewal.newExpiry}</p>
                                        </div>
                                    </div>
                                    <p className="flex items-start gap-2 border-t border-blue-100 pt-2.5 text-xs leading-relaxed text-slate-600">
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                                        <span>{previewRenewal.note}</span>
                                    </p>
                                </div>
                            )}

                            {/* Payment Input Form */}
                            <form onSubmit={handleRecordPayment} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="min-w-0">
                                        <label htmlFor="record-payment-date" className="ui-label">Payment received date *</label>
                                        <input
                                            id="record-payment-date"
                                            type="date"
                                            required
                                            value={paymentForm.paymentDate}
                                            onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                                            className="ui-input"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label htmlFor="record-payment-amount" className="ui-label">Payment amount (₹) *</label>
                                        <input
                                            id="record-payment-amount"
                                            type="number"
                                            required
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                            placeholder="5000"
                                            className="ui-input"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="min-w-0">
                                        <label htmlFor="record-payment-method" className="ui-label">Payment method *</label>
                                        <select
                                            id="record-payment-method"
                                            value={paymentForm.paymentMethod}
                                            onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                            className="ui-input"
                                        >
                                            <option value="UPI">UPI / QR</option>
                                            <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Credit / Debit Card</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="min-w-0">
                                        <label htmlFor="record-payment-reference" className="ui-label">Transaction ref / UTR</label>
                                        <input
                                            id="record-payment-reference"
                                            type="text"
                                            value={paymentForm.transactionReference}
                                            onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionReference: e.target.value }))}
                                            placeholder="e.g. UTR847291038"
                                            className="ui-input"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="record-payment-notes" className="ui-label">Admin remarks / notes</label>
                                    <textarea
                                        id="record-payment-notes"
                                        rows={2}
                                        value={paymentForm.adminNotes}
                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                                        placeholder="Optional payment confirmation notes..."
                                        className="ui-input min-h-[96px] resize-none"
                                    />
                                </div>

                                <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:-mx-6 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentModalHospital(null)}
                                        className="ui-btn-secondary w-full sm:w-auto"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingPayment}
                                        className="ui-btn-primary w-full sm:w-auto"
                                    >
                                        {submittingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                        Confirm & activate subscription
                                    </button>
                                </div>
                            </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 2: PAYMENT HISTORY */}
            <AnimatePresence>
                {historyModalHospital && (
                    <div className="ui-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="payment-history-title"
                            className="ui-dialog sm:max-w-3xl"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                                <div className="min-w-0">
                                    <h3 id="payment-history-title" className="flex items-center gap-2 text-lg font-semibold leading-tight text-slate-900">
                                        <History className="h-5 w-5 shrink-0 text-blue-600" />
                                        Payment history & audit trail
                                    </h3>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        All historical transactions for <strong className="font-medium text-slate-800">{historyModalHospital.name}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setHistoryModalHospital(null)}
                                    aria-label="Close"
                                    className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                            {loadingHistory ? (
                                <div className="py-12 text-center">
                                    <Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin text-blue-600" />
                                    <p className="text-sm text-slate-500">Fetching transactions...</p>
                                </div>
                            ) : paymentHistory.length === 0 ? (
                                <div className="ui-empty">
                                    <Receipt className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                    <h4 className="font-medium text-slate-700">No payment records yet</h4>
                                    <p className="mt-1">
                                        This hospital has not recorded any payments yet. Subscription remains in Pending status.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full min-w-[650px] text-left">
                                        <thead className="border-b border-slate-100 bg-slate-50/80">
                                            <tr>
                                                <th className="ui-th">Date</th>
                                                <th className="ui-th">Amount</th>
                                                <th className="ui-th">Method / ref</th>
                                                <th className="ui-th">Cycle granted</th>
                                                <th className="ui-th">Type</th>
                                                <th className="ui-th">Admin notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paymentHistory.map((rec) => (
                                                <tr key={rec._id} className="hover:bg-slate-50/60">
                                                    <td className="ui-td whitespace-nowrap font-medium text-slate-900">
                                                        {formatDate(rec.paymentDate)}
                                                    </td>
                                                    <td className="ui-td whitespace-nowrap font-semibold text-emerald-600">
                                                        ₹{(Number(rec.amount) || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="ui-td">
                                                        <div className="font-medium text-slate-800">{rec.paymentMethod}</div>
                                                        {rec.transactionReference && (
                                                            <div className="font-mono text-xs text-slate-500">{rec.transactionReference}</div>
                                                        )}
                                                    </td>
                                                    <td className="ui-td whitespace-nowrap">
                                                        <div className="font-medium text-slate-800">
                                                            {formatDate(rec.newStartDate)} – {formatDate(rec.newExpiryDate)}
                                                        </div>
                                                        <div className="text-xs text-slate-500">30 days</div>
                                                    </td>
                                                    <td className="ui-td whitespace-nowrap">
                                                        <span className={`ui-badge ${
                                                            rec.renewalType === 'EXTENSION'
                                                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        }`}>
                                                            {rec.renewalType}
                                                        </span>
                                                    </td>
                                                    <td className="ui-td max-w-[200px] truncate text-slate-500" title={rec.adminNotes}>
                                                        {rec.adminNotes || "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            </div>

                            <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-4 sm:px-6">
                                <button
                                    onClick={() => setHistoryModalHospital(null)}
                                    className="ui-btn-secondary w-full sm:w-auto"
                                >
                                    Close history
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 3: EDIT SUBSCRIPTION DATES & DETAILS */}
            <AnimatePresence>
                {editModalHospital && (
                    <div className="ui-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="edit-subscription-title"
                            className="ui-dialog sm:max-w-lg"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                                <div className="min-w-0">
                                    <h3 id="edit-subscription-title" className="text-lg font-semibold leading-tight text-slate-900">
                                        Edit subscription details
                                    </h3>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        Hospital: <strong className="font-medium text-slate-800">{editModalHospital.name}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditModalHospital(null)}
                                    aria-label="Close"
                                    className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 pt-5 sm:px-6">
                            <form onSubmit={handleUpdateDetails} className="space-y-4">
                                <div>
                                    <label htmlFor="edit-sub-joining-date" className="ui-label">Hospital joining date</label>
                                    <input
                                        id="edit-sub-joining-date"
                                        type="date"
                                        required
                                        value={editForm.joiningDate}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                                        className="ui-input"
                                    />
                                    <p className="ui-hint">Official onboarding date</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="min-w-0">
                                        <label htmlFor="edit-sub-start-date" className="ui-label">Start date</label>
                                        <input
                                            id="edit-sub-start-date"
                                            type="date"
                                            value={editForm.subscriptionStartDate}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, subscriptionStartDate: e.target.value }))}
                                            className="ui-input"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label htmlFor="edit-sub-expiry-date" className="ui-label">Expiry date</label>
                                        <input
                                            id="edit-sub-expiry-date"
                                            type="date"
                                            value={editForm.subscriptionExpiryDate}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, subscriptionExpiryDate: e.target.value }))}
                                            className="ui-input"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="edit-sub-notes" className="ui-label">Admin notes</label>
                                    <textarea
                                        id="edit-sub-notes"
                                        rows={3}
                                        value={editForm.adminNotes}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                                        placeholder="Internal notes regarding this hospital's account..."
                                        className="ui-input min-h-[96px] resize-none"
                                    />
                                </div>

                                <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:-mx-6 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditModalHospital(null)}
                                        className="ui-btn-secondary w-full sm:w-auto"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingEdit}
                                        className="ui-btn-dark w-full sm:w-auto"
                                    >
                                        {submittingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                        Save changes
                                    </button>
                                </div>
                            </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {usageHospital && <AdminUsageModal hospital={usageHospital} onClose={() => setUsageHospital(null)} />}
        </div>
    );
}
