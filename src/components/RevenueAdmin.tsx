"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import { 
    DollarSign, 
    TrendingUp, 
    RotateCcw, 
    Building2, 
    User, 
    Calendar, 
    Loader2, 
    Info, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    ArrowUpRight, 
    Percent, 
    ChevronDown, 
    ChevronUp,
    Search,
    Filter,
    ArrowLeft,
    Copy,
    Eye,
    EyeOff,
    Check,
    Clock,
    FileSpreadsheet,
    FileText,
    Activity,
    PlusCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RevenueAdmin() {
    // Tab Navigation: 'dashboard' | 'history' | 'analytics'
    const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "analytics">("dashboard");
    const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState<string>("month");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");

    // Data States
    const [dashboardData, setDashboardData] = useState<any[]>([]);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [hospitalDetails, setHospitalDetails] = useState<any>(null);

    // Bank details reveal state
    const [revealedBank, setRevealedBank] = useState<boolean>(false);
    const [decryptedBank, setDecryptedBank] = useState<any>(null);
    const [revealedAccountNum, setRevealedAccountNum] = useState<boolean>(false);

    // Manual Payout Modal state
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferMethod, setTransferMethod] = useState<"NEFT" | "RTGS" | "IMPS" | "UPI">("NEFT");
    const [utrNumber, setUtrNumber] = useState("");
    const [transferNotes, setTransferNotes] = useState("");
    const [selectedPaymentsForPayout, setSelectedPaymentsForPayout] = useState<string[]>([]);

    // Loading & Error States
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // CSV/Excel/PDF Export State
    const [exportSuccessMsg, setExportSuccessMsg] = useState("");

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // 1. Fetch Admin dashboard data
    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = getToken();
            const res = await api.get("/settlements/admin/dashboard", {
                params: {
                    dateFilter,
                    customStart: dateFilter === 'custom' ? customStart : undefined,
                    customEnd: dateFilter === 'custom' ? customEnd : undefined,
                    searchQuery: searchQuery || undefined
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setDashboardData(res.data.dashboardData || []);
            } else {
                setError(res.data.message || "Failed to load settlements dashboard.");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch settlements dashboard.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [dateFilter, customStart, customEnd, searchQuery]);

    // 2. Fetch specific Hospital Payout details
    const fetchHospitalDetails = useCallback(async (hospId: string) => {
        setDetailsLoading(true);
        try {
            const token = getToken();
            const res = await api.get(`/settlements/admin/hospital/${hospId}`, {
                params: { dateFilter, customStart, customEnd },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setHospitalDetails(res.data);
                // Select all payments that are Ready for Settlement by default
                const ready = res.data.transactionTable
                    .filter((t: any) => t.settlementStatus === 'Ready for Settlement')
                    .map((t: any) => t.paymentId);
                setSelectedPaymentsForPayout(ready);
                setRevealedBank(false);
                setDecryptedBank(null);
                setRevealedAccountNum(false);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to load hospital details.");
            console.error(err);
        } finally {
            setDetailsLoading(false);
        }
    }, [dateFilter, customStart, customEnd]);

    // 3. Reveal Bank Details Securely
    const revealBankDetails = async (hospId: string) => {
        if (revealedBank) {
            setRevealedBank(false);
            return;
        }
        try {
            const token = getToken();
            const res = await api.get(`/settlements/admin/hospital/${hospId}/bank-details`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setDecryptedBank(res.data.bankDetails);
                setRevealedBank(true);
            } else {
                alert("Failed to decrypt bank details securely.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Authorization failed.");
        }
    };

    // 4. Fetch Settlements History
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await api.get("/settlements/admin/history", {
                params: {
                    dateFilter,
                    customStart,
                    customEnd,
                    searchQuery
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setHistoryData(res.data.settlements || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [dateFilter, customStart, customEnd, searchQuery]);

    // 5. Fetch Analytics
    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await api.get("/settlements/admin/analytics", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setAnalyticsData(res.data.analytics);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load initial tab data
    useEffect(() => {
        if (selectedHospitalId) {
            fetchHospitalDetails(selectedHospitalId);
        } else if (activeTab === "dashboard") {
            fetchDashboard();
        } else if (activeTab === "history") {
            fetchHistory();
        } else if (activeTab === "analytics") {
            fetchAnalytics();
        }
    }, [activeTab, dateFilter, searchQuery, selectedHospitalId, fetchDashboard, fetchHistory, fetchAnalytics, fetchHospitalDetails]);

    // Initiate Transfer Payout
    const handleInitiatePayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHospitalId || selectedPaymentsForPayout.length === 0 || !utrNumber.trim()) {
            alert("Please select transactions and enter a valid UTR number.");
            return;
        }

        if (!window.confirm("Confirm manual payout initiation? This locks transactions and generates a visual timeline.")) {
            return;
        }

        setActionSubmitting(true);
        try {
            const token = getToken();
            const res = await api.post("/settlements/admin/transfer", {
                hospitalId: selectedHospitalId,
                transferMethod,
                utrNumber: utrNumber.trim(),
                notes: transferNotes,
                paymentIds: selectedPaymentsForPayout
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert(`Settlement created successfully! ID: ${res.data.settlement.settlementId}`);
                setIsTransferModalOpen(false);
                setUtrNumber("");
                setTransferNotes("");
                fetchHospitalDetails(selectedHospitalId);
            } else {
                alert(res.data.message || "Failed to create settlement.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to submit payout.");
            console.error(err);
        } finally {
            setActionSubmitting(false);
        }
    };

    // Save Bank Credentials
    const [bankForm, setBankForm] = useState({
        accountHolderName: "",
        bankName: "",
        branchName: "",
        accountNumber: "",
        ifscCode: "",
        upiId: ""
    });
    const [isEditingBank, setIsEditingBank] = useState(false);

    const handleSaveBankDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHospitalId) return;

        setActionSubmitting(true);
        try {
            const token = getToken();
            const res = await api.put(`/settlements/admin/hospital/${selectedHospitalId}/bank-details`, bankForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert("Bank Details updated and securely encrypted in database.");
                setIsEditingBank(false);
                fetchHospitalDetails(selectedHospitalId);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to update bank credentials.");
        } finally {
            setActionSubmitting(false);
        }
    };

    // Export history report to CSV/Excel formats client-side
    const handleExport = (format: "csv" | "excel") => {
        if (historyData.length === 0) {
            alert("No settlement history data to export.");
            return;
        }

        const headers = ["Settlement ID", "Hospital Name", "Date", "Gross Collection", "Razorpay Charges", "GST", "Net Payout", "Method", "UTR Number", "Status"];
        const rows = historyData.map(s => [
            s.settlementId,
            s.hospitalId?.name || "N/A",
            new Date(s.createdAt).toLocaleDateString(),
            s.grossCollection,
            s.razorpayCharges,
            s.gstCharges,
            s.netAmount,
            s.transferMethod,
            s.utrNumber,
            s.status
        ]);

        let content = "";
        if (format === "csv") {
            content = [headers.join(","), ...rows.map(r => r.map(val => `"${val}"`).join(","))].join("\n");
            const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Settlement_History_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Excel/HTML table format fallback
            let html = "<table border='1'><thead><tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr></thead><tbody>";
            rows.forEach(r => {
                html += "<tr>" + r.map(val => `<td>${val}</td>`).join("") + "</tr>";
            });
            html += "</tbody></table>";
            const blob = new Blob([html], { type: "application/vnd.ms-excel" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Settlement_History_${new Date().toISOString().slice(0,10)}.xls`);
            link.click();
        }
        setExportSuccessMsg(`Successfully exported history as ${format.toUpperCase()}`);
        setTimeout(() => setExportSuccessMsg(""), 3500);
    };

    const getTimelineIcon = (status: string) => {
        switch (status) {
            case 'Settlement Completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'Awaiting Hospital Confirmation': return <Clock className="w-5 h-5 text-amber-500" />;
            case 'Under Review': return <AlertCircle className="w-5 h-5 text-rose-500" />;
            case 'Failed': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Clock className="w-5 h-5 text-blue-500" />;
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'Settlement Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Ready for Settlement': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Awaiting Hospital Confirmation': return 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse';
            case 'Under Review': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'Failed': return 'bg-red-50 text-red-700 border-red-100';
            case 'On Hold': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header / Tabs */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <button
                        onClick={() => { setSelectedHospitalId(null); setActiveTab("dashboard"); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === "dashboard" && !selectedHospitalId
                            ? 'bg-white text-blue-600 shadow-md border border-slate-100'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => { setSelectedHospitalId(null); setActiveTab("history"); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === "history" && !selectedHospitalId
                            ? 'bg-white text-blue-600 shadow-md border border-slate-100'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        History Log
                    </button>
                    <button
                        onClick={() => { setSelectedHospitalId(null); setActiveTab("analytics"); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === "analytics" && !selectedHospitalId
                            ? 'bg-white text-blue-600 shadow-md border border-slate-100'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Analytics
                    </button>
                </div>

                {/* Filters */}
                {!selectedHospitalId && (
                    <div className="flex flex-wrap items-center gap-3.5 w-full xl:w-auto">
                        {/* Search */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-blue-200 transition-all w-full md:w-64">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder:text-slate-400 w-full"
                            />
                        </div>

                        {/* Date Filter selector */}
                        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-100 px-3 py-2">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {/* Custom Date Inputs */}
                        {dateFilter === "custom" && (
                            <div className="flex items-center gap-2 animate-fadeIn">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                                />
                                <span className="text-xs text-slate-400 font-bold">to</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ERROR ALERTS */}
            {error && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-800 animate-slideUp">
                    <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Action Required</p>
                        <p className="text-xs mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {/* MAIN ROUTER RENDER */}
            <AnimatePresence mode="wait">
                {/* A. DETAIL SUB-PAGE VIEW */}
                {selectedHospitalId && hospitalDetails ? (
                    <motion.div
                        key="hospital-details"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-10"
                    >
                        {/* Go Back button */}
                        <button
                            onClick={() => { setSelectedHospitalId(null); fetchDashboard(); }}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </button>

                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase tracking-wider rounded-xl">
                                    Hospital Ledger
                                </span>
                                <h2 className="text-3xl font-extrabold tracking-tight font-jakarta mt-2">{hospitalDetails.hospitalName}</h2>
                            </div>

                            {/* Payout initiate button */}
                            <button
                                onClick={() => {
                                    if (selectedPaymentsForPayout.length === 0) {
                                        alert("No transactions are currently selected for transfer.");
                                        return;
                                    }
                                    setIsTransferModalOpen(true);
                                }}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2.5 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                <PlusCircle className="w-4.5 h-4.5" /> Transfer Payment ({selectedPaymentsForPayout.length} Selected)
                            </button>
                        </div>

                        {/* Summary metrics cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Bookings</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-2">{hospitalDetails.dailySummary?.totalBookings}</h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-1">Processed appointments</p>
                            </div>
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gross Online Advance</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(hospitalDetails.dailySummary?.grossCollection)}</h3>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold">
                                    <span className="text-emerald-600 flex items-center">✓ {hospitalDetails.dailySummary?.successfulPayments} Success</span>
                                    <span>•</span>
                                    <span className="text-rose-500">{hospitalDetails.dailySummary?.failedPayments} Failed</span>
                                </div>
                            </div>
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Razorpay Charges + GST</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-2">
                                    {formatCurrency((hospitalDetails.dailySummary?.razorpayCharges || 0) + (hospitalDetails.dailySummary?.gst || 0))}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-1">2% gateway fee + 18% GST</p>
                            </div>
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5 bg-gradient-to-br from-indigo-50/20 to-blue-50/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Settlement Amount</p>
                                <h3 className="text-3xl font-black text-indigo-700 mt-2">{formatCurrency(hospitalDetails.dailySummary?.netSettlementAmount)}</h3>
                                <p className="text-[10px] text-indigo-500 font-semibold mt-1">Eligible Date: {hospitalDetails.dailySummary?.settlementEligibleDate}</p>
                            </div>
                        </div>

                        {/* Hospital Secure Bank Credentials */}
                        <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-900/5 space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-950">Secure Bank Credentials</h3>
                                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Encrypted records for IMPS/NEFT transfers</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => revealBankDetails(selectedHospitalId)}
                                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                                    >
                                        {revealedBank ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        {revealedBank ? "Mask Credentials" : "Reveal Credentials"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (decryptedBank) {
                                                setBankForm(decryptedBank);
                                            } else {
                                                setBankForm({
                                                    accountHolderName: "",
                                                    bankName: "",
                                                    branchName: "",
                                                    accountNumber: "",
                                                    ifscCode: "",
                                                    upiId: ""
                                                });
                                            }
                                            setIsEditingBank(!isEditingBank);
                                        }}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                                    >
                                        {isEditingBank ? "Close Form" : "Edit Credentials"}
                                    </button>
                                </div>
                            </div>

                            {/* Editing bank credentials form */}
                            {isEditingBank ? (
                                <form onSubmit={handleSaveBankDetails} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideDown">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Account Holder Name</label>
                                        <input required type="text" value={bankForm.accountHolderName} onChange={e => setBankForm({...bankForm, accountHolderName: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</label>
                                        <input required type="text" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Name</label>
                                        <input required type="text" value={bankForm.branchName} onChange={e => setBankForm({...bankForm, branchName: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Account Number</label>
                                        <input required type="text" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">IFSC Code</label>
                                        <input required type="text" value={bankForm.ifscCode} onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">UPI ID (Optional)</label>
                                        <input type="text" value={bankForm.upiId} onChange={e => setBankForm({...bankForm, upiId: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none text-xs" />
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                                        <button disabled={actionSubmitting} className="px-8 py-3.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 shadow-md">
                                            {actionSubmitting ? "Encrypting..." : "Encrypt & Save"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Account Holder</p>
                                            <p className="font-bold text-slate-800 text-sm mt-1">
                                                {revealedBank && decryptedBank ? decryptedBank.accountHolderName : "••••••••••••"}
                                            </p>
                                        </div>
                                        {revealedBank && decryptedBank && (
                                            <button onClick={() => handleCopy(decryptedBank.accountHolderName, 'holder')} className="text-slate-400 hover:text-blue-600 p-1">
                                                {copiedField === 'holder' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Account Number</p>
                                            <p className="font-bold text-slate-800 text-sm mt-1">
                                                {revealedBank && decryptedBank 
                                                    ? (revealedAccountNum ? decryptedBank.accountNumber : "••••••••" + decryptedBank.accountNumber.slice(-4)) 
                                                    : "••••••••••••"
                                                }
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {revealedBank && decryptedBank && (
                                                <>
                                                    <button onClick={() => setRevealedAccountNum(!revealedAccountNum)} className="text-slate-400 hover:text-slate-600">
                                                        {revealedAccountNum ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => handleCopy(decryptedBank.accountNumber, 'num')} className="text-slate-400 hover:text-blue-600 p-1">
                                                        {copiedField === 'num' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Bank Name</p>
                                            <p className="font-bold text-slate-800 text-sm mt-1">
                                                {revealedBank && decryptedBank ? decryptedBank.bankName : "••••••••••••"}
                                            </p>
                                        </div>
                                        {revealedBank && decryptedBank && (
                                            <button onClick={() => handleCopy(decryptedBank.bankName, 'bank')} className="text-slate-400 hover:text-blue-600 p-1">
                                                {copiedField === 'bank' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">IFSC Code</p>
                                            <p className="font-bold text-slate-800 text-sm mt-1 text-indigo-600">
                                                {revealedBank && decryptedBank ? decryptedBank.ifscCode : "••••••••••••"}
                                            </p>
                                        </div>
                                        {revealedBank && decryptedBank && (
                                            <button onClick={() => handleCopy(decryptedBank.ifscCode, 'ifsc')} className="text-slate-400 hover:text-blue-600 p-1">
                                                {copiedField === 'ifsc' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Branch</p>
                                            <p className="font-bold text-slate-800 text-sm mt-1">
                                                {revealedBank && decryptedBank ? decryptedBank.branchName : "••••••••••••"}
                                            </p>
                                        </div>
                                        {revealedBank && decryptedBank && (
                                            <button onClick={() => handleCopy(decryptedBank.branchName, 'branch')} className="text-slate-400 hover:text-blue-600 p-1">
                                                {copiedField === 'branch' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">UPI ID</p>
                                            <p className="font-bold text-slate-800 text-sm mt-1">
                                                {revealedBank && decryptedBank ? (decryptedBank.upiId || "—") : "••••••••••••"}
                                            </p>
                                        </div>
                                        {revealedBank && decryptedBank && decryptedBank.upiId && (
                                            <button onClick={() => handleCopy(decryptedBank.upiId, 'upi')} className="text-slate-400 hover:text-blue-600 p-1">
                                                {copiedField === 'upi' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Settlements History for this hospital */}
                        {hospitalDetails.settlements?.length > 0 && (
                            <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-900/5 space-y-6">
                                <h3 className="text-lg font-bold text-slate-950">Visual Settlement Timeline</h3>
                                <div className="space-y-8 pl-4 border-l-2 border-slate-100 py-2">
                                    {hospitalDetails.settlements[0].timeline.map((step: any, idx: number) => (
                                        <div key={idx} className="relative flex gap-6 items-start animate-fadeIn">
                                            {/* dot */}
                                            <div className="absolute -left-[27px] top-0.5 bg-white p-1 rounded-full border-2 border-blue-600 z-10 shadow-sm">
                                                {getTimelineIcon(step.status)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{step.status}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{new Date(step.timestamp).toLocaleString()}</p>
                                                {step.note && <p className="text-xs text-slate-500 font-medium italic mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{step.note}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transactions table */}
                        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-900/5 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-950">Pending & Settled Transactions</h3>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">Select eligible transaction rows to add to manual NEFT transfer</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="py-4 px-6 text-center w-12">
                                                <input 
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            const eligible = hospitalDetails.transactionTable
                                                                .filter((t: any) => t.settlementStatus === 'Ready for Settlement')
                                                                .map((t: any) => t.paymentId);
                                                            setSelectedPaymentsForPayout(eligible);
                                                        } else {
                                                            setSelectedPaymentsForPayout([]);
                                                        }
                                                    }}
                                                    checked={selectedPaymentsForPayout.length > 0 && selectedPaymentsForPayout.length === hospitalDetails.transactionTable.filter((t: any) => t.settlementStatus === 'Ready for Settlement').length}
                                                />
                                            </th>
                                            <th className="py-4 px-6">Booking Details</th>
                                            <th className="py-4 px-6 text-right">Consultation Fee</th>
                                            <th className="py-4 px-6 text-right">Advance (20%)</th>
                                            <th className="py-4 px-6 text-right">Razorpay Fee</th>
                                            <th className="py-4 px-6 text-right">GST (18%)</th>
                                            <th className="py-4 px-6 text-right">Net Share</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hospitalDetails.transactionTable.map((t: any) => {
                                            const isSelectable = t.settlementStatus === 'Ready for Settlement';
                                            return (
                                                <tr key={t.paymentId} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-all font-semibold text-slate-800 text-xs ${!isSelectable ? 'opacity-80' : ''}`}>
                                                    <td className="py-5 px-6 text-center">
                                                        <input
                                                            type="checkbox"
                                                            disabled={!isSelectable}
                                                            checked={selectedPaymentsForPayout.includes(t.paymentId)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedPaymentsForPayout([...selectedPaymentsForPayout, t.paymentId]);
                                                                } else {
                                                                    setSelectedPaymentsForPayout(selectedPaymentsForPayout.filter(id => id !== t.paymentId));
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-5 px-6">
                                                        <div>
                                                            <p className="font-bold text-slate-900">Patient: {t.patientName}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium mt-1">Appt: {t.appointmentDate} • ID: {t.bookingId}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-6 text-right font-bold text-slate-500">{formatCurrency(t.consultationFee)}</td>
                                                    <td className="py-5 px-6 text-right font-bold text-slate-900">{formatCurrency(t.advancePaid)}</td>
                                                    <td className="py-5 px-6 text-right text-rose-500 font-semibold">{formatCurrency(t.razorpayFee)}</td>
                                                    <td className="py-5 px-6 text-right text-rose-500 font-semibold">{formatCurrency(t.gst)}</td>
                                                    <td className="py-5 px-6 text-right font-black text-indigo-600">{formatCurrency(t.netAmount)}</td>
                                                    <td className="py-5 px-6 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusBadgeClass(t.settlementStatus)}`}>
                                                            {t.settlementStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {hospitalDetails.transactionTable.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center text-slate-400 font-bold italic">
                                                    No transaction logs generated for this hospital yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : activeTab === "dashboard" ? (
                    // B. HOSPITAL LISTINGS DASHBOARD
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-900/5 space-y-6"
                    >
                        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 font-jakarta">Hospital Settlement Portfolios</h3>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">Tracking collections and transfer cycles</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="py-4 px-6">Hospital</th>
                                        <th className="py-4 px-6 text-center">Today&apos;s Bookings</th>
                                        <th className="py-4 px-6 text-right">Collected (20%)</th>
                                        <th className="py-4 px-6 text-right">Gateway Fees</th>
                                        <th className="py-4 px-6 text-right">Net Received</th>
                                        <th className="py-4 px-6 text-right">Pending Transfer</th>
                                        <th className="py-4 px-6 text-center">Eligible Date</th>
                                        <th className="py-4 px-6 text-center">Active Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.map((row) => (
                                        <tr 
                                            key={row.hospitalId} 
                                            onClick={() => {
                                                setSelectedHospitalId(row.hospitalId);
                                                fetchHospitalDetails(row.hospitalId);
                                            }}
                                            className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-all font-semibold text-slate-800 text-xs hover:shadow-sm"
                                        >
                                            <td className="py-5 px-6 font-bold text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                                                    {row.hospitalName.charAt(0)}
                                                </div>
                                                {row.hospitalName}
                                            </td>
                                            <td className="py-5 px-6 text-center font-bold text-slate-500">{row.todayBookings}</td>
                                            <td className="py-5 px-6 text-right font-bold text-slate-900">{formatCurrency(row.totalOnlineAdvanceCollected)}</td>
                                            <td className="py-5 px-6 text-right text-rose-500">{formatCurrency(row.razorpayProcessingCharges + row.gstOnRazorpayCharges)}</td>
                                            <td className="py-5 px-6 text-right text-slate-800 font-bold">{formatCurrency(row.netAmountReceived)}</td>
                                            <td className="py-5 px-6 text-right font-black text-indigo-600">{formatCurrency(row.pendingSettlementAmount)}</td>
                                            <td className="py-5 px-6 text-center text-slate-400 font-bold">{row.settlementEligibleDate}</td>
                                            <td className="py-5 px-6 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusBadgeClass(row.currentSettlementStatus)}`}>
                                                    {row.currentSettlementStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {dashboardData.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-slate-400 font-bold italic">
                                                No hospitals found matching filter/search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : activeTab === "history" ? (
                    // C. PERMANENT SETTLEMENT HISTORY
                    <motion.div
                        key="history"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-900/5 space-y-6"
                    >
                        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 font-jakarta">Permanent Settlement History</h3>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">Audited batches transferred to hospitals</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleExport("csv")}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-rose-500" /> Export CSV
                                </button>
                                <button
                                    onClick={() => handleExport("excel")}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                >
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Excel
                                </button>
                            </div>
                        </div>

                        {exportSuccessMsg && (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn">
                                {exportSuccessMsg}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="py-4 px-6">Settlement ID</th>
                                        <th className="py-4 px-6">Hospital</th>
                                        <th className="py-4 px-6 text-center">Transfer Date</th>
                                        <th className="py-4 px-6 text-right">Gross Collected</th>
                                        <th className="py-4 px-6 text-right">Fees + GST</th>
                                        <th className="py-4 px-6 text-right">Net Payout</th>
                                        <th className="py-4 px-6 text-center">Method</th>
                                        <th className="py-4 px-6">UTR Number</th>
                                        <th className="py-4 px-6 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyData.map((s) => (
                                        <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all font-semibold text-slate-800 text-xs">
                                            <td className="py-5 px-6 font-mono font-bold text-blue-600">{s.settlementId}</td>
                                            <td className="py-5 px-6 font-bold text-slate-900">{s.hospitalId?.name || "N/A"}</td>
                                            <td className="py-5 px-6 text-center text-slate-500">{new Date(s.transferDate || s.createdAt).toLocaleDateString()}</td>
                                            <td className="py-5 px-6 text-right">{formatCurrency(s.grossCollection)}</td>
                                            <td className="py-5 px-6 text-right text-rose-500">{formatCurrency(s.razorpayCharges + s.gstCharges)}</td>
                                            <td className="py-5 px-6 text-right font-black text-indigo-600">{formatCurrency(s.netAmount)}</td>
                                            <td className="py-5 px-6 text-center font-bold text-slate-500">{s.transferMethod}</td>
                                            <td className="py-5 px-6 font-mono font-medium select-all text-slate-600">{s.utrNumber}</td>
                                            <td className="py-5 px-6 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusBadgeClass(s.status)}`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {historyData.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-slate-400 font-bold italic">
                                                No settlement history found matching filter/search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    // D. ANALYTICS CHARTS VIEW
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8 animate-fadeIn"
                    >
                        {/* Analytics Top Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Settled Amount</p>
                                <h3 className="text-3xl font-black text-emerald-600 mt-2">{formatCurrency(analyticsData?.totalSettledAmount)}</h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-1">Paid out successfully to hospitals</p>
                            </div>
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Settlements Pool</p>
                                <h3 className="text-3xl font-black text-indigo-600 mt-2">{formatCurrency(analyticsData?.pendingSettlementAmount)}</h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-1">Locked waiting for transfer</p>
                            </div>
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Razorpay + GST Charges</p>
                                <h3 className="text-3xl font-black text-rose-500 mt-2">{formatCurrency(analyticsData?.totalRazorpayCharges)}</h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-1">Gateway processing overheads</p>
                            </div>
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payout Success Rate</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-2">{analyticsData?.settlementSuccessRate?.toFixed(1)}%</h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-1">Avg timing: {analyticsData?.averageSettlementTimeHours} hrs</p>
                            </div>
                        </div>

                        {/* Interactive Custom CSS Payout Volumes Graph */}
                        <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-900/5 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-950">Monthly Settlement Volume</h3>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">Comparing gross online advance fees with net payouts settled</p>
                            </div>

                            {/* Chart representation in clean CSS */}
                            <div className="h-64 flex items-end gap-10 border-b border-slate-200 pb-4 pt-10 px-6">
                                {analyticsData?.monthlySettlements?.map((s: any, idx: number) => {
                                    const col = analyticsData.monthlyCollections.find((c: any) => c.month === s.month) || { amount: 0 };
                                    const maxAmount = Math.max(...analyticsData.monthlyCollections.map((c: any) => c.amount), 1);
                                    
                                    const netHeight = (s.amount / maxAmount) * 100;
                                    const grossHeight = (col.amount / maxAmount) * 100;

                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                            <div className="w-full flex justify-center items-end gap-1.5 h-full relative">
                                                {/* Tooltip */}
                                                <div className="absolute -top-12 bg-slate-900 text-white text-[9px] font-black p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl z-20 w-32 text-center">
                                                    <p className="text-slate-400">Gross: {formatCurrency(col.amount)}</p>
                                                    <p className="text-emerald-400 mt-0.5">Net: {formatCurrency(s.amount)}</p>
                                                </div>

                                                {/* Bar - gross */}
                                                <div 
                                                    style={{ height: `${grossHeight}%` }} 
                                                    className="w-4 bg-indigo-200/60 rounded-t-md hover:bg-indigo-300 transition-colors"
                                                />
                                                {/* Bar - net */}
                                                <div 
                                                    style={{ height: `${netHeight}%` }} 
                                                    className="w-4 bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">{s.month}</span>
                                        </div>
                                    )}
                                )}
                                {(!analyticsData?.monthlySettlements || analyticsData.monthlySettlements.length === 0) && (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold italic text-xs">
                                        No monthly settlement cycles registered yet.
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-6 justify-center text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 bg-indigo-200/60 rounded" />
                                    <span>Gross Collected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 bg-emerald-500 rounded" />
                                    <span>Net Paid Payouts</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MANUAL TRANSFER PAYMENT MODAL */}
            <AnimatePresence>
                {isTransferModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col relative"
                        >
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Transfer Settlement Payment</h3>
                            <p className="text-xs text-slate-400 font-semibold mb-6">Enter transfer reference codes to initiate manual payouts</p>

                            <form onSubmit={handleInitiatePayout} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Transfer Method</label>
                                    <select
                                        value={transferMethod}
                                        onChange={(e) => setTransferMethod(e.target.value as any)}
                                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none text-xs"
                                    >
                                        <option value="NEFT">NEFT (National Electronic Funds Transfer)</option>
                                        <option value="IMPS">IMPS (Immediate Payment Service)</option>
                                        <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                                        <option value="UPI">UPI (Unified Payments Interface)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">UTR / Reference Number</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. UTR182736192837162"
                                        value={utrNumber}
                                        onChange={(e) => setUtrNumber(e.target.value)}
                                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Notes / Transaction Summary</label>
                                    <textarea
                                        placeholder="NEFT payout for pending advance bookings fee cutoff..."
                                        value={transferNotes}
                                        onChange={(e) => setTransferNotes(e.target.value)}
                                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none text-xs h-20 resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsTransferModalOpen(false)}
                                        className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionSubmitting}
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {actionSubmitting ? "Initiating Payout..." : "Transfer Payment"}
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
