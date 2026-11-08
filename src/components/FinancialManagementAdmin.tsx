"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import { 
    IndianRupee, 
    Calendar, 
    Search, 
    Download, 
    RefreshCw, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Building2, 
    Wallet, 
    CreditCard, 
    Banknote, 
    ArrowUpRight, 
    RotateCcw, 
    Check, 
    X, 
    ChevronLeft, 
    ChevronRight, 
    FileText, 
    Eye, 
    HelpCircle, 
    Layers, 
    TrendingUp, 
    ShieldCheck, 
    AlertTriangle,
    Info,
    Send,
    Edit3,
    Save
} from "lucide-react";

export default function FinancialManagementAdmin() {
    // 5 Subsections: 'overall' | 'hospital_reports' | 'settlements' | 'transactions' | 'refunds'
    const [activeSection, setActiveSection] = useState<"overall" | "hospital_reports" | "settlements" | "transactions" | "refunds">("overall");

    // Global Date Filter
    const [period, setPeriod] = useState<string>("this_month");
    const [customStartDate, setCustomStartDate] = useState<string>("");
    const [customEndDate, setCustomEndDate] = useState<string>("");

    // Toast Notification
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Helper currency formatter
    const fmt = (val: number | undefined | null) => {
        const num = Number(val) || 0;
        return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Helper date formatter
    const fmtDate = (dStr: string | undefined | null) => {
        if (!dStr) return "N/A";
        try {
            return new Date(dStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
            return "N/A";
        }
    };

    const fmtDateTime = (dStr: string | undefined | null) => {
        if (!dStr) return "N/A";
        try {
            const d = new Date(dStr);
            return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
        } catch {
            return "N/A";
        }
    };

    // =========================================================================
    // SUBSECTION 1: OVERALL DASHBOARD DATA
    // =========================================================================
    const [overallData, setOverallData] = useState<any>(null);
    const [loadingOverall, setLoadingOverall] = useState(true);

    const fetchOverall = useCallback(async () => {
        setLoadingOverall(true);
        try {
            const params = new URLSearchParams();
            params.append("period", period);
            if (period === "custom") {
                if (customStartDate) params.append("startDate", customStartDate);
                if (customEndDate) params.append("endDate", customEndDate);
            }
            const res = await api.get(`/admin/financial/overview?${params.toString()}`);
            if (res.data?.success) {
                setOverallData(res.data.cards);
            }
        } catch (err) {
            console.error("Failed to fetch overall dashboard:", err);
            showToast("Failed to load overall financial metrics", "error");
        } finally {
            setLoadingOverall(false);
        }
    }, [period, customStartDate, customEndDate]);

    // =========================================================================
    // SUBSECTION 2: HOSPITAL-WISE FINANCIAL REPORTS
    // =========================================================================
    const [hospitalsList, setHospitalsList] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
    const [hospitalReport, setHospitalReport] = useState<any>(null);
    const [loadingHospitalReport, setLoadingHospitalReport] = useState(false);

    // Fetch list of hospitals for selector
    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const res = await api.get("/admin/hospitals");
                const list = res.data?.hospitals || res.data || [];
                setHospitalsList(list);
                if (list.length > 0 && !selectedHospitalId) {
                    setSelectedHospitalId(list[0]._id);
                }
            } catch (err) {
                console.error("Failed to load hospitals list", err);
            }
        };
        fetchHospitals();
    }, [selectedHospitalId]);

    const fetchHospitalReport = useCallback(async () => {
        if (!selectedHospitalId) return;
        setLoadingHospitalReport(true);
        try {
            const params = new URLSearchParams();
            params.append("period", period);
            if (period === "custom") {
                if (customStartDate) params.append("startDate", customStartDate);
                if (customEndDate) params.append("endDate", customEndDate);
            }
            const res = await api.get(`/admin/financial/hospital/${selectedHospitalId}?${params.toString()}`);
            if (res.data?.success) {
                setHospitalReport(res.data);
            }
        } catch (err) {
            console.error("Failed to load hospital report:", err);
            showToast("Failed to load hospital financial report", "error");
        } finally {
            setLoadingHospitalReport(false);
        }
    }, [selectedHospitalId, period, customStartDate, customEndDate]);

    // Hospital Bank Details Form State
    const [bankForm, setBankForm] = useState({
        accountHolderName: "",
        bankName: "",
        branchName: "",
        accountNumber: "",
        ifscCode: "",
        upiId: ""
    });
    const [savingBankDetails, setSavingBankDetails] = useState(false);
    const [isEditingBank, setIsEditingBank] = useState(false);

    // Date Range Settlement Calculator State
    const [calcStartDate, setCalcStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(1); // 1st of current month
        return d.toISOString().split("T")[0];
    });
    const [calcEndDate, setCalcEndDate] = useState<string>(() => {
        return new Date().toISOString().split("T")[0];
    });
    const [rangeCalculation, setRangeCalculation] = useState<any>(null);
    const [loadingCalculation, setLoadingCalculation] = useState(false);

    // Send Settlement Request State
    const [reqAmount, setReqAmount] = useState<number>(0);
    const [reqMethod, setReqMethod] = useState<string>("NEFT");
    const [reqUtr, setReqUtr] = useState<string>("");
    const [reqNotes, setReqNotes] = useState<string>("");
    const [sendingRequest, setSendingRequest] = useState<boolean>(false);
    const [hospSearchTerm, setHospSearchTerm] = useState<string>("");

    // Sync bank form whenever hospitalReport loads
    useEffect(() => {
        if (hospitalReport?.hospital?.bankDetails) {
            setBankForm({
                accountHolderName: hospitalReport.hospital.bankDetails.accountHolderName || "",
                bankName: hospitalReport.hospital.bankDetails.bankName || "",
                branchName: hospitalReport.hospital.bankDetails.branchName || "",
                accountNumber: hospitalReport.hospital.bankDetails.accountNumber || "",
                ifscCode: hospitalReport.hospital.bankDetails.ifscCode || "",
                upiId: hospitalReport.hospital.bankDetails.upiId || ""
            });
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
    }, [hospitalReport]);

    // Calculate settlement in custom date range
    const calculateSettlementForRange = useCallback(async (start?: string, end?: string) => {
        if (!selectedHospitalId) return;
        const sDate = start || calcStartDate;
        const eDate = end || calcEndDate;
        setLoadingCalculation(true);
        try {
            const res = await api.get(`/admin/financial/hospital/${selectedHospitalId}/settlement-calculate?startDate=${sDate}&endDate=${eDate}`);
            if (res.data?.success) {
                setRangeCalculation(res.data);
                if (res.data.calculation?.netPayable !== undefined) {
                    setReqAmount(res.data.calculation.netPayable);
                }
            }
        } catch (err) {
            console.error("Calculation error:", err);
        } finally {
            setLoadingCalculation(false);
        }
    }, [selectedHospitalId, calcStartDate, calcEndDate]);

    useEffect(() => {
        if (selectedHospitalId) {
            calculateSettlementForRange(calcStartDate, calcEndDate);
        }
    }, [selectedHospitalId, calcStartDate, calcEndDate, calculateSettlementForRange]);

    // Save Bank Details Handler
    const handleSaveBankDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHospitalId) return;
        if (!bankForm.accountNumber.trim() || !bankForm.ifscCode.trim()) {
            showToast("Account Number and IFSC code are mandatory", "error");
            return;
        }

        setSavingBankDetails(true);
        try {
            const res = await api.put(`/admin/financial/hospital/${selectedHospitalId}/bank-details`, bankForm);
            if (res.data?.success) {
                showToast("Hospital bank account details saved successfully!", "success");
                setIsEditingBank(false);
                fetchHospitalReport();
            } else {
                showToast(res.data?.message || "Failed to save bank details", "error");
            }
        } catch (err: any) {
            console.error("Error saving bank details:", err);
            showToast(err.response?.data?.error || err.response?.data?.message || "Failed to save bank details", "error");
        } finally {
            setSavingBankDetails(false);
        }
    };

    // Send Settlement Request to Hospital Handler
    const handleSendSettlementRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHospitalId) return;
        if (!reqUtr.trim()) {
            showToast("UTR / Reference number is mandatory", "error");
            return;
        }
        if (reqAmount <= 0) {
            showToast("Settlement amount must be greater than ₹0", "error");
            return;
        }

        setSendingRequest(true);
        try {
            const res = await api.post(`/admin/financial/hospital/${selectedHospitalId}/send-settlement-request`, {
                startDate: calcStartDate,
                endDate: calcEndDate,
                amount: reqAmount,
                transferMethod: reqMethod,
                utrNumber: reqUtr.trim(),
                notes: reqNotes.trim()
            });

            if (res.data?.success) {
                showToast(`Settlement request of ₹${reqAmount} sent to hospital! Status is 'Awaiting Hospital Confirmation'`, "success");
                setReqUtr("");
                setReqNotes("");
                fetchHospitalReport();
                calculateSettlementForRange();
                fetchSettlements();
            } else {
                showToast(res.data?.message || "Failed to send settlement request", "error");
            }
        } catch (err: any) {
            console.error("Send settlement request error:", err);
            showToast(err.response?.data?.error || err.response?.data?.message || "Failed to send settlement request", "error");
        } finally {
            setSendingRequest(false);
        }
    };

    // =========================================================================
    // SUBSECTION 3: SETTLEMENT MANAGEMENT
    // =========================================================================
    const [settlements, setSettlements] = useState<any[]>([]);
    const [loadingSettlements, setLoadingSettlements] = useState(false);
    const [payoutModalHosp, setPayoutModalHosp] = useState<any | null>(null);
    const [payoutAmount, setPayoutAmount] = useState<number>(0);
    const [payoutMethod, setPayoutMethod] = useState<string>("NEFT");
    const [payoutUtr, setPayoutUtr] = useState<string>("");
    const [payoutNotes, setPayoutNotes] = useState<string>("");
    const [payoutSubmitting, setPayoutSubmitting] = useState(false);

    const fetchSettlements = useCallback(async () => {
        setLoadingSettlements(true);
        try {
            const res = await api.get("/admin/financial/settlements");
            if (res.data?.success) {
                setSettlements(res.data.settlements || []);
            }
        } catch (err) {
            console.error("Failed to load settlements:", err);
            showToast("Failed to load settlements", "error");
        } finally {
            setLoadingSettlements(false);
        }
    }, []);

    const handleRecordPayoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payoutModalHosp) return;
        if (!payoutUtr.trim()) {
            showToast("UTR / Reference number is mandatory", "error");
            return;
        }
        if (payoutAmount <= 0) {
            showToast("Payout amount must be greater than 0", "error");
            return;
        }

        setPayoutSubmitting(true);
        try {
            const res = await api.post("/admin/financial/settlements/payout", {
                hospitalId: payoutModalHosp.hospitalId,
                amount: payoutAmount,
                paymentMethod: payoutMethod,
                utrReference: payoutUtr.trim(),
                notes: payoutNotes.trim()
            });

            if (res.data?.success) {
                showToast(`Payout of ₹${payoutAmount} recorded successfully!`, "success");
                setPayoutModalHosp(null);
                fetchSettlements();
                fetchOverall();
            } else {
                showToast(res.data?.message || "Failed to record payout", "error");
            }
        } catch (err: any) {
            console.error("Error submitting payout:", err);
            showToast(err.response?.data?.message || "Failed to record payout", "error");
        } finally {
            setPayoutSubmitting(false);
        }
    };

    // =========================================================================
    // SUBSECTION 4: TRANSACTION MANAGEMENT (MASTER LEDGER)
    // =========================================================================
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTxns, setLoadingTxns] = useState(false);
    const [txnSearch, setTxnSearch] = useState("");
    const [txnTypeFilter, setTxnTypeFilter] = useState("all");
    const [txnSourceFilter, setTxnSourceFilter] = useState("all");
    const [txnMethodFilter, setTxnMethodFilter] = useState("all");
    const [txnStatusFilter, setTxnStatusFilter] = useState("all");
    const [txnHospFilter, setTxnHospFilter] = useState("all");
    const [txnPage, setTxnPage] = useState(1);
    const [txnLimit, setTxnLimit] = useState(15);
    const [txnPagination, setTxnPagination] = useState({ totalPages: 1, totalRecords: 0 });
    const [exportingTxn, setExportingTxn] = useState(false);

    const getTxnParams = useCallback((isExport: boolean = false) => {
        const params = new URLSearchParams();
        params.append("period", period);
        if (period === "custom") {
            if (customStartDate) params.append("startDate", customStartDate);
            if (customEndDate) params.append("endDate", customEndDate);
        }
        if (txnSearch.trim()) params.append("search", txnSearch.trim());
        if (txnTypeFilter !== "all") params.append("paymentType", txnTypeFilter);
        if (txnSourceFilter !== "all") params.append("paymentSource", txnSourceFilter);
        if (txnMethodFilter !== "all") params.append("paymentMethod", txnMethodFilter);
        if (txnStatusFilter !== "all") params.append("status", txnStatusFilter);
        if (txnHospFilter !== "all") params.append("hospitalId", txnHospFilter);

        if (isExport) {
            params.append("export", "csv");
        } else {
            params.append("page", txnPage.toString());
            params.append("limit", txnLimit.toString());
        }
        return params.toString();
    }, [period, customStartDate, customEndDate, txnSearch, txnTypeFilter, txnSourceFilter, txnMethodFilter, txnStatusFilter, txnHospFilter, txnPage, txnLimit]);

    const fetchTransactions = useCallback(async () => {
        setLoadingTxns(true);
        try {
            const query = getTxnParams(false);
            const res = await api.get(`/admin/financial/transactions?${query}`);
            if (res.data?.success) {
                setTransactions(res.data.transactions || []);
                if (res.data.pagination) {
                    setTxnPagination({
                        totalPages: res.data.pagination.totalPages || 1,
                        totalRecords: res.data.pagination.totalRecords || 0
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch transactions:", err);
            showToast("Failed to load master ledger transactions", "error");
        } finally {
            setLoadingTxns(false);
        }
    }, [getTxnParams]);

    const handleExportTxnCSV = async () => {
        setExportingTxn(true);
        try {
            const query = getTxnParams(true);
            const res = await api.get(`/admin/financial/transactions?${query}`, {
                responseType: "blob"
            });
            const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `pillora-transactions-master-${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast("Master ledger CSV downloaded!", "success");
        } catch (err) {
            console.error("CSV Export error:", err);
            showToast("Failed to download CSV export", "error");
        } finally {
            setExportingTxn(false);
        }
    };

    // =========================================================================
    // SUBSECTION 5: REFUND MANAGEMENT
    // =========================================================================
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loadingRefunds, setLoadingRefunds] = useState(false);
    const [refundModalAppt, setRefundModalAppt] = useState<any | null>(null);
    const [refundAmountInput, setRefundAmountInput] = useState<number>(0);
    const [refundReasonInput, setRefundReasonInput] = useState<string>("");
    const [refundManualNotes, setRefundManualNotes] = useState<string>("");
    const [refundSubmitting, setRefundSubmitting] = useState(false);

    const fetchRefunds = useCallback(async () => {
        setLoadingRefunds(true);
        try {
            const res = await api.get("/admin/financial/refunds");
            if (res.data?.success) {
                setRefunds(res.data.refunds || []);
            }
        } catch (err) {
            console.error("Failed to load refunds:", err);
            showToast("Failed to load refund records", "error");
        } finally {
            setLoadingRefunds(false);
        }
    }, []);

    const handleProcessRefundSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!refundModalAppt) return;
        if (refundAmountInput <= 0) {
            showToast("Refund amount must be greater than 0", "error");
            return;
        }

        setRefundSubmitting(true);
        try {
            const res = await api.post("/admin/financial/refunds/process", {
                appointmentId: refundModalAppt.appointmentId,
                refundAmount: refundAmountInput,
                reason: refundReasonInput.trim() || refundModalAppt.cancellationReason || "Appointment cancellation",
                manualNotes: refundManualNotes.trim()
            });

            if (res.data?.success) {
                showToast(`Refund of ₹${refundAmountInput} processed successfully!`, "success");
                setRefundModalAppt(null);
                fetchRefunds();
                fetchOverall();
                fetchSettlements();
            } else {
                showToast(res.data?.message || "Failed to process refund", "error");
            }
        } catch (err: any) {
            console.error("Refund error:", err);
            showToast(err.response?.data?.message || "Failed to process refund", "error");
        } finally {
            setRefundSubmitting(false);
        }
    };

    // Initial load based on section
    useEffect(() => {
        if (activeSection === "overall") fetchOverall();
        if (activeSection === "hospital_reports") fetchHospitalReport();
        if (activeSection === "settlements") fetchSettlements();
        if (activeSection === "transactions") fetchTransactions();
        if (activeSection === "refunds") fetchRefunds();
    }, [activeSection, fetchOverall, fetchHospitalReport, fetchSettlements, fetchTransactions, fetchRefunds]);

    // Status badge style helper
    const getSettlementBadge = (status: string) => {
        const s = (status || "").toLowerCase();
        if (s === "settlement completed" || s === "settled") {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Settlement Completed
                </span>
            );
        }
        if (s === "awaiting hospital confirmation") {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    <Clock className="w-3 h-3 text-amber-600" /> Awaiting Hospital Confirmation
                </span>
            );
        }
        if (s === "under review") {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    <AlertTriangle className="w-3 h-3 text-rose-600" /> Under Review
                </span>
            );
        }
        if (s === "processing" || s === "payment initiated") {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <RefreshCw className="w-3 h-3 text-blue-600" /> Processing
                </span>
            );
        }
        if (s === "pending" || s === "ready for settlement" || s === "waiting for razorpay settlement") {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-500" /> Pending
                </span>
            );
        }
        if (s === "failed") {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Failed</span>;
        }
        if (s === "reversed") {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Reversed</span>;
        }
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{status || "Pending"}</span>;
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Toast Feedback */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold transition-all transform animate-bounce ${
                    toast.type === "success" ? "bg-emerald-900 text-emerald-100 border-emerald-700" : "bg-rose-900 text-rose-100 border-rose-700"
                }`}>
                    {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Top Header & Subsection Navigation */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                            <ShieldCheck className="w-3.5 h-3.5" /> Pillora Financial Control
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Financial Management</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                            Central administration for hospital settlements, gateway deductions, appointment transactions ledger, and refunds.
                        </p>
                    </div>

                    {/* Date Filter Bar */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Period:
                        </span>
                        {[
                            { label: "Today", value: "today" },
                            { label: "Yesterday", value: "yesterday" },
                            { label: "This Week", value: "this_week" },
                            { label: "This Month", value: "this_month" },
                            { label: "Last Month", value: "last_month" },
                            { label: "Custom", value: "custom" }
                        ].map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setPeriod(t.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    period === t.value ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Date Inputs if custom period */}
                {period === "custom" && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500 font-bold">Custom Range:</span>
                        <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                        />
                        <button
                            onClick={() => {
                                if (activeSection === "overall") fetchOverall();
                                if (activeSection === "hospital_reports") fetchHospitalReport();
                                if (activeSection === "transactions") fetchTransactions();
                            }}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                        >
                            Apply Filter
                        </button>
                    </div>
                )}

                {/* 5 Subsections Nav Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
                    {[
                        { id: "overall", label: "1. Overall Dashboard", icon: Layers },
                        { id: "hospital_reports", label: "2. Hospitals & Settlements", icon: Building2 },
                        { id: "settlements", label: "3. Settlement Ledger", icon: Wallet },
                        { id: "transactions", label: "4. Master Ledger", icon: FileText },
                        { id: "refunds", label: "5. Refund Management", icon: RotateCcw }
                    ].map((sec) => {
                        const Icon = sec.icon;
                        const isCurrent = activeSection === sec.id;
                        return (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(sec.id as any)}
                                className={`py-3 px-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                    isCurrent
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="truncate">{sec.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SUBSECTION 1: OVERALL FINANCIAL DASHBOARD */}
            {/* ========================================================================= */}
            {activeSection === "overall" && (
                <div className="space-y-6">
                    {/* The 8 Aggregate KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {/* 1. Total Consultation Fees */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Card 1 • All Facilities</span>
                            <div className="mt-3">
                                <h4 className="text-xs font-bold text-slate-500">Total Consultation Fees</h4>
                                <div className="text-2xl font-black text-slate-900 mt-1">
                                    {loadingOverall ? "..." : fmt(overallData?.totalConsultationFees)}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">Gross booked appointment value</span>
                            </div>
                        </div>

                        {/* 2. Total Online Advances via Pillora */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Card 2 • 20% Online</span>
                            <div className="mt-3">
                                <h4 className="text-xs font-bold text-slate-500">Total Online Advances</h4>
                                <div className="text-2xl font-black text-blue-600 mt-1">
                                    {loadingOverall ? "..." : fmt(overallData?.grossOnlineAdvances)}
                                </div>
                                <span className="text-[10px] text-blue-600/80 mt-1 block">Patient advance paid on Pillora.in</span>
                            </div>
                        </div>

                        {/* 3. Total Net Payable to Hospitals */}
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-900/20 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Card 3 • Net Payable</span>
                            <div className="mt-3">
                                <h4 className="text-xs font-bold text-indigo-200">Total Net Payable to Hospitals</h4>
                                <div className="text-2xl font-black text-white mt-1">
                                    {loadingOverall ? "..." : fmt(overallData?.netPayableToHospitals)}
                                </div>
                                <span className="text-[10px] text-indigo-300 mt-1 block">Advances minus gateway deductions</span>
                            </div>
                        </div>

                        {/* 4. Total Collected at Clinics – Cash */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Card 4 • Physical Cash</span>
                            <div className="mt-3">
                                <h4 className="text-xs font-bold text-slate-500">Collected at Clinics – Cash</h4>
                                <div className="text-2xl font-black text-emerald-600 mt-1">
                                    {loadingOverall ? "..." : fmt(overallData?.totalCashAtClinics)}
                                </div>
                                <span className="text-[10px] text-emerald-600/80 mt-1 block">Physical currency collected at clinic</span>
                            </div>
                        </div>

                        {/* 5. Total Collected at Clinics – Online */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">Card 5 • Clinic Online</span>
                            <div className="mt-3">
                                <h4 className="text-xs font-bold text-slate-500">Collected at Clinics – Online</h4>
                                <div className="text-2xl font-black text-teal-600 mt-1">
                                    {loadingOverall ? "..." : fmt(overallData?.totalOnlineAtClinics)}
                                </div>
                                <span className="text-[10px] text-teal-600/80 mt-1 block">Direct UPI / Card at clinic counter</span>
                            </div>
                        </div>

                        {/* 6. Total Gateway Charges & Taxes */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Card 6 • Gateway Deductions</span>
                            <div className="mt-3">
                                <h4 className="text-xs font-bold text-slate-500">Gateway Charges & Taxes</h4>
                                <div className="text-2xl font-black text-slate-700 mt-1">
                                    {loadingOverall ? "..." : fmt(overallData?.totalGatewayCharges)}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">2% fee + 18% GST (2.36%)</span>
                            </div>
                        </div>

                        {/* 7. Total Pending Settlements */}
                        <div className="bg-white p-6 rounded-3xl border border-amber-200 bg-amber-50/20 shadow-xl shadow-amber-900/5 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Card 7 • Owed to Hospitals</span>
                            <div className="mt-3">
                                <h4 className="text-xs font-bold text-amber-700">Total Pending Settlements</h4>
                                <div className="text-2xl font-black text-amber-600 mt-1">
                                    {loadingOverall ? "..." : fmt(overallData?.totalPendingSettlements)}
                                </div>
                                <span className="text-[10px] text-amber-600/80 mt-1 block">Due for NEFT/RTGS payout</span>
                            </div>
                        </div>

                        {/* 8. Total Completed Settlements */}
                        <div className="bg-white p-6 rounded-3xl border border-emerald-200 bg-emerald-50/20 shadow-xl shadow-emerald-900/5 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Card 8 • Payouts Dispatched</span>
                            <div className="mt-3">
                                <h4 className="text-xs font-bold text-emerald-700">Completed Settlements</h4>
                                <div className="text-2xl font-black text-emerald-600 mt-1">
                                    {loadingOverall ? "..." : fmt(overallData?.totalCompletedSettlements)}
                                </div>
                                <span className="text-[10px] text-emerald-600/80 mt-1 block">Successfully transferred to hospitals</span>
                            </div>
                        </div>
                    </div>

                    {/* Pillora Business Model Reminder Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 flex items-start gap-4 text-xs">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h5 className="font-black text-blue-900 text-sm">Pillora Business Model Policy</h5>
                            <p className="text-blue-800 leading-relaxed">
                                Pillora operates on fixed hospital subscriptions and does <strong>NOT</strong> earn commission from doctor consultation fees.
                                The 20% online advance collected from patients belongs entirely to the respective hospital (minus 2.36% third-party gateway processing fees & taxes).
                                The remaining 80% consultation balance is collected directly by hospital staff at the facility.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUBSECTION 2: HOSPITALS & SETTLEMENTS */}
            {/* ========================================================================= */}
            {activeSection === "hospital_reports" && (
                <div className="space-y-8">
                    {/* 1. Hospitals Selection & Quick Search Bar */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Select Hospital / Clinic</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Click on any hospital to manage bank details, view online advances, calculate date-range settlements, and disburse payouts.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search hospital..."
                                        value={hospSearchTerm}
                                        onChange={(e) => setHospSearchTerm(e.target.value)}
                                        className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        fetchHospitalReport();
                                        calculateSettlementForRange();
                                    }}
                                    disabled={loadingHospitalReport}
                                    className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all disabled:opacity-50"
                                    title="Refresh Report"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingHospitalReport ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                        </div>

                        {/* Hospital Cards Selector */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                            {hospitalsList
                                .filter((h) => !hospSearchTerm.trim() || h.name?.toLowerCase().includes(hospSearchTerm.toLowerCase()) || h.city?.toLowerCase().includes(hospSearchTerm.toLowerCase()))
                                .map((h) => {
                                    const isSelected = selectedHospitalId === h._id;
                                    const hasBank = Boolean(h.bankDetails?.accountNumber);
                                    return (
                                        <button
                                            key={h._id}
                                            onClick={() => setSelectedHospitalId(h._id)}
                                            className={`p-3.5 rounded-2xl text-left border transition-all relative flex flex-col justify-between ${
                                                isSelected
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25 ring-2 ring-blue-600/40"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="font-extrabold text-xs truncate max-w-[180px]">{h.name}</div>
                                                {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] mt-2 font-medium">
                                                <span className={isSelected ? "text-blue-100" : "text-slate-500"}>
                                                    {h.city || "Facility"}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full font-bold ${
                                                    isSelected 
                                                        ? (hasBank ? "bg-blue-500 text-white" : "bg-blue-700 text-blue-200") 
                                                        : (hasBank ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200")
                                                }`}>
                                                    {hasBank ? "Bank Added" : "No Bank"}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                        </div>
                    </div>

                    {hospitalReport && (
                        <div className="space-y-8">
                            {/* 2. Hospital Bank Account Details Card (Admin Editable) */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/25">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider mb-1">
                                                Hospital Bank Account Management
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900">{hospitalReport.hospital?.name}</h3>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {hospitalReport.hospital?.address} • Phone: {hospitalReport.hospital?.phone || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingBank(!isEditingBank)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto ${
                                            isEditingBank
                                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                        }`}
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>{isEditingBank ? "Close Form" : "Edit Bank Account"}</span>
                                    </button>
                                </div>

                                {/* Bank Form (Always visible or toggleable) */}
                                <form onSubmit={handleSaveBankDetails} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Account Beneficiary / Holder Name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Ami Clinic Healthcare Pvt Ltd"
                                                value={bankForm.accountHolderName}
                                                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Bank Name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. HDFC Bank, SBI, ICICI"
                                                value={bankForm.bankName}
                                                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Account Number <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 50200012345678"
                                                value={bankForm.accountNumber}
                                                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                IFSC Code <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. HDFC0001234"
                                                value={bankForm.ifscCode}
                                                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Branch Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Navrangpura Branch"
                                                value={bankForm.branchName}
                                                onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Hospital UPI ID (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. hospital@okaxis"
                                                value={bankForm.upiId}
                                                onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="text-xs text-slate-500">
                                            {bankForm.accountNumber ? (
                                                <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" /> Bank account configured for settlements
                                                </span>
                                            ) : (
                                                <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                                                    <AlertTriangle className="w-4 h-4" /> Please enter bank details to enable payouts
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={savingBankDetails}
                                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {savingBankDetails ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            <span>Save Bank Account Details</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* 3. Hospital Financial Overview Cards (Focusing on Online Advance & 2.36% Deductions) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-3xl border border-blue-100 bg-blue-50/20 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between text-blue-600 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider">Online Advance via Pillora</span>
                                        <Wallet className="w-4 h-4" />
                                    </div>
                                    <p className="text-2xl font-black text-blue-700">{fmt(hospitalReport.financialSummary?.grossOnlineAdvances)}</p>
                                    <p className="text-[11px] text-blue-600/80 font-bold mt-1.5 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                        <span>{hospitalReport.financialSummary?.onlineAdvanceCount || 0} patient advances collected (20% fee)</span>
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-rose-100 bg-rose-50/20 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between text-rose-600 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider">Gateway Charges (2.36%)</span>
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <p className="text-2xl font-black text-rose-700">{fmt(hospitalReport.financialSummary?.gatewayCharges)}</p>
                                    <p className="text-[11px] text-rose-600/80 font-medium mt-1.5">
                                        2% Razorpay + 18% GST deducted per advance
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-indigo-100 bg-indigo-50/20 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between text-indigo-600 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider">Net Amount Pillora Has to Pay</span>
                                        <IndianRupee className="w-4 h-4" />
                                    </div>
                                    <p className="text-2xl font-black text-indigo-700">{fmt(hospitalReport.financialSummary?.netPayable)}</p>
                                    <p className="text-[11px] text-indigo-600/80 font-semibold mt-1.5">
                                        Gross Advances minus 2.36% Gateway Charges
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-amber-200 bg-amber-50/30 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between text-amber-700 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider">Pending Settlement Payout</span>
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <p className="text-2xl font-black text-amber-700">{fmt(hospitalReport.financialSummary?.pendingSettlement)}</p>
                                    <p className="text-[11px] text-amber-600/80 font-medium mt-1.5">
                                        Already Settled: <span className="font-bold text-emerald-700">{fmt(hospitalReport.financialSummary?.alreadySettled)}</span>
                                    </p>
                                </div>
                            </div>

                            {/* 4. Date Range Settlement Calculator ("From Date to To Date -> Total Net ₹X") */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider mb-1">
                                            Settlement Range Calculation
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">Calculate Payout for Custom Date Range</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            Select &quot;From Date&quot; to &quot;To Date&quot; to determine the total net amount (₹X) Pillora has to pay to this hospital.
                                        </p>
                                    </div>

                                    {/* Quick Date Presets */}
                                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                                        {[
                                            {
                                                label: "Today",
                                                getDates: () => {
                                                    const today = new Date().toISOString().split("T")[0];
                                                    return { start: today, end: today };
                                                }
                                            },
                                            {
                                                label: "This Week",
                                                getDates: () => {
                                                    const now = new Date();
                                                    const day = now.getDay();
                                                    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                                                    const start = new Date(now.setDate(diff)).toISOString().split("T")[0];
                                                    const end = new Date().toISOString().split("T")[0];
                                                    return { start, end };
                                                }
                                            },
                                            {
                                                label: "This Month",
                                                getDates: () => {
                                                    const now = new Date();
                                                    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
                                                    const end = new Date().toISOString().split("T")[0];
                                                    return { start, end };
                                                }
                                            },
                                            {
                                                label: "All Time",
                                                getDates: () => {
                                                    return { start: "2024-01-01", end: new Date().toISOString().split("T")[0] };
                                                }
                                            }
                                        ].map((preset) => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() => {
                                                    const { start, end } = preset.getDates();
                                                    setCalcStartDate(start);
                                                    setCalcEndDate(end);
                                                    calculateSettlementForRange(start, end);
                                                }}
                                                className="px-3 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-200/80 transition-all"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Inputs Bar */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                            From Date (Start)
                                        </label>
                                        <input
                                            type="date"
                                            value={calcStartDate}
                                            onChange={(e) => setCalcStartDate(e.target.value)}
                                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                            To Date (End)
                                        </label>
                                        <input
                                            type="date"
                                            value={calcEndDate}
                                            onChange={(e) => setCalcEndDate(e.target.value)}
                                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => calculateSettlementForRange(calcStartDate, calcEndDate)}
                                            disabled={loadingCalculation}
                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${loadingCalculation ? "animate-spin" : ""}`} />
                                            <span>Calculate Settlement (₹X)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Calculation Results Display */}
                                {rangeCalculation && (
                                    <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-700/60 pb-5">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                                                    Period: {fmtDate(rangeCalculation.dateRange?.startDate)} to {fmtDate(rangeCalculation.dateRange?.endDate)}
                                                </span>
                                                <h4 className="text-xl font-black mt-1">Calculated Hospital Settlement Amount</h4>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-indigo-300 font-semibold block">Total Amount to Pay (₹X):</span>
                                                <span className="text-3xl font-black text-emerald-400">
                                                    {fmt(rangeCalculation.calculation?.netPayable)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10">
                                                <span className="text-indigo-200 block text-[10px] font-bold uppercase">Online Advances</span>
                                                <span className="text-lg font-black text-white mt-1 block">
                                                    {rangeCalculation.calculation?.advanceCount || 0} bookings
                                                </span>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10">
                                                <span className="text-indigo-200 block text-[10px] font-bold uppercase">Gross Advances</span>
                                                <span className="text-lg font-black text-white mt-1 block">
                                                    {fmt(rangeCalculation.calculation?.grossOnlineAdvances)}
                                                </span>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10">
                                                <span className="text-rose-300 block text-[10px] font-bold uppercase">Gateway (2.36%)</span>
                                                <span className="text-lg font-black text-rose-300 mt-1 block">
                                                    - {fmt(rangeCalculation.calculation?.gatewayCharges)}
                                                </span>
                                            </div>
                                            <div className="bg-emerald-500/20 backdrop-blur p-4 rounded-2xl border border-emerald-400/30">
                                                <span className="text-emerald-300 block text-[10px] font-bold uppercase">Net Payable (₹X)</span>
                                                <span className="text-lg font-black text-emerald-300 mt-1 block">
                                                    {fmt(rangeCalculation.calculation?.netPayable)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 5. Transfer Money & Send Settlement Request Section */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                                <div className="border-b border-slate-100 pb-5">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-1">
                                        <Send className="w-3 h-3" /> Step: Disburse Payout & Request Confirmation
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Transfer & Send Settlement Request to Hospital</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                        After transferring the amount to the hospital&apos;s bank account via NEFT/RTGS/IMPS/UPI, enter the transfer details below and send the request.
                                        The hospital will receive this request in their dashboard (<strong>pillorahospital.in</strong>) and confirm receipt (&quot;Yes, I have received the money from Pillora&quot;).
                                        <strong> The settlement will only be considered completed after approval from the hospital.</strong>
                                    </p>
                                </div>

                                <form onSubmit={handleSendSettlementRequest} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Settlement Amount (₹) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min={1}
                                                step="0.01"
                                                value={reqAmount}
                                                onChange={(e) => setReqAmount(Number(e.target.value))}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                Pre-filled from range calculation (₹X)
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Transfer Method <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={reqMethod}
                                                onChange={(e) => setReqMethod(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                                                <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                                                <option value="IMPS">IMPS (Immediate Payment Service)</option>
                                                <option value="UPI">UPI (Unified Payments Interface)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                UTR / Bank Ref Number <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. UTR123456789"
                                                value={reqUtr}
                                                onChange={(e) => setReqUtr(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                Bank transfer confirmation number
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Notes / Remarks
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Payout for 01-08 Nov"
                                                value={reqNotes}
                                                onChange={(e) => setReqNotes(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                Optional remarks for hospital
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-800">
                                        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold block">Hospital Approval Required:</span>
                                            <span>
                                                Clicking below creates a settlement with status <strong>&quot;Awaiting Hospital Confirmation&quot;</strong>.
                                                The hospital must verify their bank account and click &quot;Confirm Received&quot; in their dashboard. Once confirmed, the settlement status automatically transitions to &quot;Settlement Completed&quot;.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={sendingRequest || reqAmount <= 0 || !reqUtr.trim()}
                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {sendingRequest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            <span>Send Settlement Request to Hospital (₹{reqAmount})</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* 6. Hospital Settlement Requests & History Table */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-black text-slate-900 text-lg">Hospital Settlement Requests & Status</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Permanent record of all settlement requests sent to this hospital and their verification status.
                                        </p>
                                    </div>
                                    <button
                                        onClick={fetchHospitalReport}
                                        className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 self-start sm:self-auto"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>Refresh Status</span>
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                            <tr>
                                                <th className="py-3.5 px-4">Settlement ID</th>
                                                <th className="py-3.5 px-4">Period Range</th>
                                                <th className="py-3.5 px-4 text-center">Advances</th>
                                                <th className="py-3.5 px-4 text-right">Gross (₹)</th>
                                                <th className="py-3.5 px-4 text-right">Deductions (2.36%)</th>
                                                <th className="py-3.5 px-4 text-right">Net Transferred (₹)</th>
                                                <th className="py-3.5 px-4">Transfer & UTR</th>
                                                <th className="py-3.5 px-4">Request Date</th>
                                                <th className="py-3.5 px-4 text-center">Settlement Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {hospitalReport.settlementHistory && hospitalReport.settlementHistory.length > 0 ? (
                                                hospitalReport.settlementHistory.map((s: any) => (
                                                    <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                                                            {s.settlementId}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-700 font-semibold">
                                                            {s.startDate && s.endDate ? (
                                                                <span>{fmtDate(s.startDate)} - {fmtDate(s.endDate)}</span>
                                                            ) : (
                                                                <span className="text-slate-400">N/A</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                                            {s.advanceCount || s.paymentIds?.length || 0}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                                                            {fmt(s.grossCollection)}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right text-rose-500 font-bold">
                                                            - {fmt((s.razorpayCharges || 0) + (s.gstCharges || 0))}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm">
                                                            {fmt(s.netAmount)}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="font-bold text-slate-800">{s.transferMethod || "NEFT"}</div>
                                                            <div className="font-mono text-[11px] text-slate-500">{s.utrNumber || "N/A"}</div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-500">
                                                            {fmtDate(s.transferDate || s.createdAt)}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                            {getSettlementBadge(s.status)}
                                                            {s.confirmationDate && (
                                                                <div className="text-[10px] text-emerald-700 mt-0.5">
                                                                    Confirmed: {fmtDate(s.confirmationDate)}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={9} className="py-10 text-center text-slate-400 font-semibold italic">
                                                        No settlement requests sent to this hospital yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 7. Appointments Breakdown Table */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-black text-slate-900">Hospital Appointment Bookings ({hospitalReport.appointments?.length || 0})</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Patient advances, consultation fees, and balances for this hospital.</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                            <tr>
                                                <th className="py-3 px-4">Token / ID</th>
                                                <th className="py-3 px-4">Patient</th>
                                                <th className="py-3 px-4">Doctor</th>
                                                <th className="py-3 px-4 text-right">Consultation Fee</th>
                                                <th className="py-3 px-4 text-right">Advance Paid (20%)</th>
                                                <th className="py-3 px-4 text-right">Balance Due (80%)</th>
                                                <th className="py-3 px-4 text-right">Balance Collected</th>
                                                <th className="py-3 px-4">Payment Status</th>
                                                <th className="py-3 px-4">Settlement</th>
                                                <th className="py-3 px-4">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {hospitalReport.appointments?.map((app: any) => (
                                                <tr key={app.appointmentId} className="hover:bg-slate-50">
                                                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                                        {app.tokenNumber ? `#${app.tokenNumber}` : app.appointmentId.slice(-6).toUpperCase()}
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-900">{app.patientName}</td>
                                                    <td className="py-3 px-4 text-slate-700">{app.doctorName}</td>
                                                    <td className="py-3 px-4 text-right font-bold">₹{app.consultationFee}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-blue-600">₹{app.advancePaid}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-rose-600">₹{app.balanceDue}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{app.balancePaid}</td>
                                                    <td className="py-3 px-4 capitalize font-semibold">{app.paymentStatus}</td>
                                                    <td className="py-3 px-4">{getSettlementBadge(app.settlementStatus)}</td>
                                                    <td className="py-3 px-4 text-slate-400">{fmtDate(app.appointmentDate)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUBSECTION 3: SETTLEMENT MANAGEMENT */}
            {/* ========================================================================= */}
            {activeSection === "settlements" && (
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Hospital Settlement Ledger</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Gross online advances, 2.36% gateway charges, net payable, and outstanding payout tracking.
                                </p>
                            </div>
                            <button
                                onClick={fetchSettlements}
                                disabled={loadingSettlements}
                                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-2"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loadingSettlements ? "animate-spin" : ""}`} />
                                <span>Refresh</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="py-3.5 px-4">Hospital Name</th>
                                        <th className="py-3.5 px-4">Bank Account Details</th>
                                        <th className="py-3.5 px-4 text-right">Gross Advances</th>
                                        <th className="py-3.5 px-4 text-right">Gateway Deductions</th>
                                        <th className="py-3.5 px-4 text-right">Net Payable</th>
                                        <th className="py-3.5 px-4 text-right">Already Settled</th>
                                        <th className="py-3.5 px-4 text-right">Pending Payout</th>
                                        <th className="py-3.5 px-4">Status</th>
                                        <th className="py-3.5 px-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {loadingSettlements ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-slate-400">Loading settlements...</td>
                                        </tr>
                                    ) : settlements.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-slate-400">No hospital settlement records found.</td>
                                        </tr>
                                    ) : (
                                        settlements.map((s) => {
                                            const hasPendingPayout = s.pendingSettlement > 0;
                                            return (
                                                <tr key={s.hospitalId} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-3.5 px-4 font-bold text-slate-900">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedHospitalId(s.hospitalId);
                                                                setActiveSection("hospital_reports");
                                                            }}
                                                            className="text-left group hover:text-blue-600 transition-colors"
                                                        >
                                                            <div className="font-extrabold group-hover:underline flex items-center gap-1.5">
                                                                <span>{s.hospitalName}</span>
                                                                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                                                            </div>
                                                            <div className="text-[10px] font-normal text-slate-400">{s.phone}</div>
                                                        </button>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        {s.bankDetails?.accountNumber ? (
                                                            <div className="font-mono text-[11px] text-slate-700">
                                                                <div>{s.bankDetails.accountHolderName}</div>
                                                                <div>{s.bankDetails.accountNumber} • {s.bankDetails.ifscCode}</div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedHospitalId(s.hospitalId);
                                                                    setActiveSection("hospital_reports");
                                                                    setIsEditingBank(true);
                                                                }}
                                                                className="text-[10px] text-amber-600 font-bold hover:underline"
                                                            >
                                                                + Add Bank Account
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-bold text-blue-600">{fmt(s.totalGrossAdvances || s.grossOnlineAdvances)}</td>
                                                    <td className="py-3.5 px-4 text-right text-rose-500 font-medium">- {fmt(s.gatewayCharges)}</td>
                                                    <td className="py-3.5 px-4 text-right font-black text-indigo-700">{fmt(s.netPayable)}</td>
                                                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{fmt(s.alreadySettled)}</td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        {hasPendingPayout ? (
                                                            <span className="font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                                                                {fmt(s.pendingSettlement)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-600 font-bold">₹0.00</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {getSettlementBadge(s.settlementStatus)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedHospitalId(s.hospitalId);
                                                                setActiveSection("hospital_reports");
                                                            }}
                                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-md shadow-blue-600/10 flex items-center gap-1.5 transition-all mx-auto"
                                                        >
                                                            <Wallet className="w-3.5 h-3.5" />
                                                            <span>Manage & Settle</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Record Payout Modal */}
                    {payoutModalHosp && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Record Settlement Payout</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Hospital: {payoutModalHosp.hospitalName}</p>
                                    </div>
                                    <button onClick={() => setPayoutModalHosp(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Bank Account:</span>
                                        <span className="font-mono font-bold text-slate-900">{payoutModalHosp.bankDetails?.accountNumber || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">IFSC & Bank:</span>
                                        <span className="font-bold text-slate-900">{payoutModalHosp.bankDetails?.ifscCode || "N/A"} ({payoutModalHosp.bankDetails?.bankName || "Bank"})</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-200 pt-2 text-amber-700 font-bold">
                                        <span>Outstanding Net Settlement:</span>
                                        <span className="text-sm font-black text-amber-600">{fmt(payoutModalHosp.pendingSettlement)}</span>
                                    </div>
                                </div>

                                <form onSubmit={handleRecordPayoutSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                            Transfer Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            step="0.01"
                                            value={payoutAmount}
                                            onChange={(e) => setPayoutAmount(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                                Transfer Method
                                            </label>
                                            <select
                                                value={payoutMethod}
                                                onChange={(e) => setPayoutMethod(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="NEFT">NEFT</option>
                                                <option value="RTGS">RTGS</option>
                                                <option value="IMPS">IMPS</option>
                                                <option value="UPI">UPI</option>
                                                <option value="Other">Other Bank Transfer</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                                UTR / Ref Number <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. UTR123456789"
                                                value={payoutUtr}
                                                onChange={(e) => setPayoutUtr(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                            Notes / Remarks
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Optional remarks"
                                            value={payoutNotes}
                                            onChange={(e) => setPayoutNotes(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                                        />
                                    </div>

                                    <div className="pt-3 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPayoutModalHosp(null)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={payoutSubmitting}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                        >
                                            {payoutSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                            <span>Confirm Settlement Payout</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUBSECTION 4: TRANSACTION MANAGEMENT (MASTER LEDGER) */}
            {/* ========================================================================= */}
            {activeSection === "transactions" && (
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 space-y-4">
                        {/* Table Header & Master Filters */}
                        <div className="p-6 sm:p-8 border-b border-slate-100 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Master Financial Transaction Ledger</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Immutable record of all patient advances, clinic cash/online collections, refunds, and settlements.
                                    </p>
                                </div>
                                <button
                                    onClick={handleExportTxnCSV}
                                    disabled={exportingTxn}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/10"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{exportingTxn ? "Exporting..." : "Export CSV"}</span>
                                </button>
                            </div>

                            {/* Filters Bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search Txn ID, Rzp ID, Patient..."
                                        value={txnSearch}
                                        onChange={(e) => {
                                            setTxnSearch(e.target.value);
                                            setTxnPage(1);
                                        }}
                                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <select
                                    value={txnTypeFilter}
                                    onChange={(e) => {
                                        setTxnTypeFilter(e.target.value);
                                        setTxnPage(1);
                                    }}
                                    className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                >
                                    <option value="all">All Types</option>
                                    <option value="advance">Advance</option>
                                    <option value="balance">Balance</option>
                                    <option value="full">Full</option>
                                    <option value="refund">Refund</option>
                                </select>

                                <select
                                    value={txnSourceFilter}
                                    onChange={(e) => {
                                        setTxnSourceFilter(e.target.value);
                                        setTxnPage(1);
                                    }}
                                    className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                >
                                    <option value="all">All Sources</option>
                                    <option value="pillora_online">Pillora Online</option>
                                    <option value="clinic_collection">Clinic Collection</option>
                                </select>

                                <select
                                    value={txnMethodFilter}
                                    onChange={(e) => {
                                        setTxnMethodFilter(e.target.value);
                                        setTxnPage(1);
                                    }}
                                    className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                >
                                    <option value="all">All Methods</option>
                                    <option value="razorpay">Razorpay</option>
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">Card</option>
                                    <option value="other_online">Other Online</option>
                                </select>

                                <select
                                    value={txnStatusFilter}
                                    onChange={(e) => {
                                        setTxnStatusFilter(e.target.value);
                                        setTxnPage(1);
                                    }}
                                    className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="completed">Completed / Captured</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>

                                <select
                                    value={txnHospFilter}
                                    onChange={(e) => {
                                        setTxnHospFilter(e.target.value);
                                        setTxnPage(1);
                                    }}
                                    className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                >
                                    <option value="all">All Hospitals</option>
                                    {hospitalsList.map((h) => (
                                        <option key={h._id} value={h._id}>{h.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Master Ledger Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 px-4">Txn ID / Razorpay ID</th>
                                        <th className="py-3 px-4">Hospital</th>
                                        <th className="py-3 px-4">Patient Info</th>
                                        <th className="py-3 px-4 text-right">Amount</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4">Source & Method</th>
                                        <th className="py-3 px-4 text-right">Gateway Deductions</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Settlement</th>
                                        <th className="py-3 px-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {loadingTxns ? (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-slate-400">Loading master ledger...</td>
                                        </tr>
                                    ) : transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-slate-400">No transactions found matching filters.</td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx) => (
                                            <tr key={tx._id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                                    <div>{tx.transactionId}</div>
                                                    {tx.razorpayPaymentId && (
                                                        <div className="text-[10px] font-normal text-slate-400">{tx.razorpayPaymentId}</div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-800">{tx.hospitalName}</td>
                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-slate-900">{tx.patientName}</div>
                                                    <div className="text-[10px] text-slate-400">{tx.patientPhone}</div>
                                                </td>
                                                <td className="py-3 px-4 text-right font-black text-slate-900">
                                                    ₹{tx.amount}
                                                </td>
                                                <td className="py-3 px-4 capitalize font-bold text-slate-700">{tx.paymentType}</td>
                                                <td className="py-3 px-4">
                                                    <span className="capitalize font-semibold text-slate-700">{tx.paymentMethod}</span>
                                                    <div className="text-[10px] text-slate-400 capitalize">{tx.paymentSource?.replace("_", " ")}</div>
                                                </td>
                                                <td className="py-3 px-4 text-right text-slate-500 font-semibold">
                                                    {tx.gatewayCharges > 0 ? `₹${tx.gatewayCharges}` : "—"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">{getSettlementBadge(tx.settlementStatus)}</td>
                                                <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{fmtDateTime(tx.createdAt)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                            <span>Showing {transactions.length} of {txnPagination.totalRecords} records</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                                    disabled={txnPage <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span>Page {txnPage} of {txnPagination.totalPages}</span>
                                <button
                                    onClick={() => setTxnPage((p) => Math.min(txnPagination.totalPages, p + 1))}
                                    disabled={txnPage >= txnPagination.totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUBSECTION 5: REFUND MANAGEMENT */}
            {/* ========================================================================= */}
            {activeSection === "refunds" && (
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Cancelled Appointments & Refund Requests</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Cancelled appointments with paid online advances requiring refund processing.
                                </p>
                            </div>
                            <button
                                onClick={fetchRefunds}
                                disabled={loadingRefunds}
                                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-2"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loadingRefunds ? "animate-spin" : ""}`} />
                                <span>Refresh</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 px-4">Appt ID</th>
                                        <th className="py-3 px-4">Patient</th>
                                        <th className="py-3 px-4">Hospital</th>
                                        <th className="py-3 px-4 text-right">Fee</th>
                                        <th className="py-3 px-4 text-right">Advance Paid</th>
                                        <th className="py-3 px-4 text-right">Refund Amount</th>
                                        <th className="py-3 px-4">Reason</th>
                                        <th className="py-3 px-4">Refund Status</th>
                                        <th className="py-3 px-4">Cancellation Date</th>
                                        <th className="py-3 px-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {loadingRefunds ? (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-slate-400">Loading refund queue...</td>
                                        </tr>
                                    ) : refunds.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-slate-400">No pending refund requests found.</td>
                                        </tr>
                                    ) : (
                                        refunds.map((r) => {
                                            const isRefundPending = r.refundStatus === "Pending Approval";
                                            return (
                                                <tr key={r.appointmentId} className="hover:bg-slate-50">
                                                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                                        {r.appointmentId.slice(-6).toUpperCase()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-slate-900">{r.patientName}</div>
                                                        <div className="text-[10px] text-slate-400">{r.patientPhone}</div>
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-800">{r.hospitalName}</td>
                                                    <td className="py-3 px-4 text-right font-bold">₹{r.consultationFee}</td>
                                                    <td className="py-3 px-4 text-right font-black text-blue-600">₹{r.advancePaid}</td>
                                                    <td className="py-3 px-4 text-right font-black text-rose-600">₹{r.refundAmount}</td>
                                                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{r.cancellationReason || "Patient cancelled"}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            r.refundStatus === "Refunded"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : r.refundStatus === "Pending Approval"
                                                                ? "bg-amber-100 text-amber-800"
                                                                : "bg-slate-100 text-slate-600"
                                                        }`}>
                                                            {r.refundStatus}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-400">{fmtDate(r.cancellationDate)}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        {isRefundPending && (
                                                            <button
                                                                onClick={() => {
                                                                    setRefundModalAppt(r);
                                                                    setRefundAmountInput(r.refundAmount || r.advancePaid);
                                                                    setRefundReasonInput(r.cancellationReason || "Appointment cancelled");
                                                                    setRefundManualNotes("");
                                                                }}
                                                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/10 flex items-center gap-1.5 transition-all"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                                <span>Process Refund</span>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Process Refund Modal */}
                    {refundModalAppt && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Process Patient Refund</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Appointment: {refundModalAppt.appointmentId}</p>
                                    </div>
                                    <button onClick={() => setRefundModalAppt(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                                    <div className="flex justify-between font-bold">
                                        <span className="text-slate-500">Patient:</span>
                                        <span className="text-slate-900">{refundModalAppt.patientName} ({refundModalAppt.patientPhone})</span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span className="text-slate-500">Hospital:</span>
                                        <span className="text-slate-900">{refundModalAppt.hospitalName}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-blue-700">
                                        <span>Advance Paid via Pillora:</span>
                                        <span>₹{refundModalAppt.advancePaid}</span>
                                    </div>
                                </div>

                                <form onSubmit={handleProcessRefundSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                            Refund Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            max={refundModalAppt.advancePaid}
                                            step="0.01"
                                            value={refundAmountInput}
                                            onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                            Refund Reason
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={refundReasonInput}
                                            onChange={(e) => setRefundReasonInput(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                            Internal Admin Notes (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Transaction ref, bank acknowledgement..."
                                            value={refundManualNotes}
                                            onChange={(e) => setRefundManualNotes(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                                        />
                                    </div>

                                    <div className="pt-3 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setRefundModalAppt(null)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={refundSubmitting}
                                            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/20 flex items-center gap-2"
                                        >
                                            {refundSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                            <span>Confirm & Process Refund</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
