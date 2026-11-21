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

/** The backend's date filter params (`dateFilter`, `customStart`, `customEnd`) for the chosen period. */
function appendPeriodParams(params: URLSearchParams, period: string, customStart: string, customEnd: string) {
    params.append("dateFilter", period);
    if (period === "custom") {
        if (customStart) params.append("customStart", customStart);
        if (customEnd) params.append("customEnd", customEnd);
    }
}

/**
 * Turns GET /admin/financial/refunds into the flat rows the refund table shows:
 * cancelled appointments that still hold a paid advance ("Pending Approval") and
 * refunds already processed ("Refunded").
 */
function buildRefundRows(data: any): any[] {
    const idOf = (v: any) => (v && typeof v === "object" ? String(v._id ?? "") : String(v ?? ""));
    const pending = (data?.pendingRefundCandidates || []).map((a: any) => ({
        appointmentId: idOf(a._id),
        tokenNumber: a.tokenNumber ?? null,
        patientName: a.patientName || a.patient?.name || "Patient",
        patientPhone: a.patientPhone || a.patient?.phone || "",
        hospitalName: a.hospital?.name || a.hospitalName || "",
        consultationFee: Number(a.consultationFee ?? a.doctor?.fee ?? 0),
        advancePaid: Number(a.advancePaid ?? 0),
        refundAmount: 0,
        cancellationReason: a.cancellationReason || a.notes || "",
        cancellationDate: a.updatedAt || a.createdAt,
        refundStatus: "Pending Approval",
    }));
    const done = (data?.refunds || []).map((r: any) => {
        const appt = r.appointmentId && typeof r.appointmentId === "object" ? r.appointmentId : null;
        return {
            appointmentId: idOf(r.appointmentId) || String(r._id ?? ""),
            tokenNumber: appt?.tokenNumber ?? null,
            patientName: appt?.patientName || "Patient",
            patientPhone: appt?.patientPhone || "",
            hospitalName: r.hospitalId?.name || "",
            consultationFee: Number(appt?.consultationFee ?? 0),
            advancePaid: Number(r.amount ?? 0),
            refundAmount: Number(r.amount ?? 0),
            cancellationReason: r.reason || "",
            cancellationDate: r.processedAt || r.createdAt,
            refundStatus: "Refunded",
        };
    });
    // Rows from the old flat shape (if the backend ever sends it) pass through unchanged.
    const flat = (data?.refunds || []).every((r: any) => typeof r?.appointmentId === "string" && r?.refundStatus)
        ? data.refunds
        : null;
    return flat ?? [...pending, ...done];
}

/** Badge colours for a payment's status in the master ledger. */
function txStatusTone(status?: string) {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "paid" || s === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (s === "pending" || s === "created" || s === "processing") return "border-amber-200 bg-amber-50 text-amber-700";
    if (s === "refunded") return "border-slate-200 bg-slate-100 text-slate-600";
    return "border-rose-200 bg-rose-50 text-rose-700";
}

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
            appendPeriodParams(params, period, customStartDate, customEndDate);
            const res = await api.get(`/admin/financial/overview?${params.toString()}`);
            if (res.data?.success) {
                // The backend sends `summary`; map its field names to the ones the cards read.
                const s = res.data.summary || res.data.cards || {};
                setOverallData({
                    totalConsultationFees: s.totalConsultationFees,
                    grossOnlineAdvances: s.grossOnlineAdvances ?? s.totalOnlineAdvances,
                    netPayableToHospitals: s.netPayableToHospitals ?? s.totalNetPayableToHospitals,
                    totalCashAtClinics: s.totalCashAtClinics ?? s.totalCashCollectedAtHospitals,
                    totalOnlineAtClinics: s.totalOnlineAtClinics ?? s.totalOnlineCollectedAtHospitals,
                    totalGatewayCharges: s.totalGatewayCharges,
                    totalPendingSettlements: s.totalPendingSettlements ?? s.totalPendingHospitalSettlements,
                    totalCompletedSettlements: s.totalCompletedSettlements ?? s.totalCompletedHospitalSettlements,
                });
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
            appendPeriodParams(params, period, customStartDate, customEndDate);
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
                // Backend reads transferMethod/utrNumber; old names kept for older API deployments
                transferMethod: payoutMethod,
                utrNumber: payoutUtr.trim(),
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
        appendPeriodParams(params, period, customStartDate, customEndDate);
        if (txnSearch.trim()) params.append("search", txnSearch.trim());
        if (txnTypeFilter !== "all") params.append("paymentType", txnTypeFilter);
        if (txnSourceFilter !== "all") params.append("paymentSource", txnSourceFilter);
        if (txnMethodFilter !== "all") params.append("paymentMethod", txnMethodFilter);
        if (txnStatusFilter !== "all") params.append("status", txnStatusFilter);
        if (txnHospFilter !== "all") params.append("hospitalId", txnHospFilter);

        if (isExport) {
            // The backend has no CSV mode: fetch every matching row as JSON and build the CSV here.
            params.append("page", "1");
            params.append("limit", "5000");
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
                        totalRecords: res.data.pagination.totalRecords ?? res.data.pagination.total ?? 0
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
            const res = await api.get(`/admin/financial/transactions?${query}`);
            const rows: any[] = res.data?.transactions || [];
            const columns = ["transactionId", "createdAt", "hospitalName", "patientName", "tokenNumber", "amount", "paymentType", "paymentSource", "paymentMethod", "gatewayCharges", "gatewayTaxes", "netPayable", "status", "settlementStatus", "razorpayPaymentId", "razorpayOrderId", "notes"];
            const cell = (v: any) => {
                const s = v === null || v === undefined ? "" : String(v);
                return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            };
            const csv = [columns.join(","), ...rows.map((r) => columns.map((c) => cell(r[c])).join(","))].join("\n");
            const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
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
                setRefunds(buildRefundRows(res.data));
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
                amount: refundAmountInput,
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
            showToast(err.response?.data?.message || err.response?.data?.error || "Failed to process refund", "error");
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
                <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Settlement Completed
                </span>
            );
        }
        if (s === "awaiting hospital confirmation") {
            return (
                <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">
                    <Clock className="h-3 w-3" /> Awaiting Hospital Confirmation
                </span>
            );
        }
        if (s === "under review") {
            return (
                <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">
                    <AlertTriangle className="h-3 w-3" /> Under Review
                </span>
            );
        }
        if (s === "processing" || s === "payment initiated") {
            return (
                <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">
                    <RefreshCw className="h-3 w-3" /> Processing
                </span>
            );
        }
        if (s === "pending" || s === "ready for settlement" || s === "waiting for razorpay settlement") {
            return (
                <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">
                    <Clock className="h-3 w-3" /> Pending
                </span>
            );
        }
        if (s === "failed") {
            return <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">Failed</span>;
        }
        if (s === "reversed") {
            return <span className="ui-badge border-violet-200 bg-violet-50 text-violet-700">Reversed</span>;
        }
        return <span className="ui-badge border-slate-200 bg-slate-100 text-slate-600">{status || "Pending"}</span>;
    };

    return (
        <div className="space-y-6">
            {/* Toast Feedback */}
            {toast && (
                <div role="status" className={`fixed bottom-4 left-4 right-4 z-[9999] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg sm:bottom-6 sm:left-auto sm:right-6 ${
                    toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                }`}>
                    {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Top Header & Subsection Navigation */}
            <section className="ui-card p-4 sm:p-5" aria-labelledby="fin-heading">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                        <h2 id="fin-heading" className="ui-title">Financial management</h2>
                        <p className="ui-subtitle">
                            Central administration for hospital settlements, gateway deductions, appointment transactions ledger, and refunds.
                        </p>
                    </div>

                    {/* Date Filter Bar */}
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-500">
                            <Calendar className="h-4 w-4" /> Period:
                        </span>
                        <div className="no-scrollbar -mx-4 min-w-0 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                            <div className="ui-segmented">
                        {[
                            { label: "Today", value: "today" },
                            { label: "Yesterday", value: "yesterday" },
                            { label: "This week", value: "this_week" },
                            { label: "This month", value: "this_month" },
                            { label: "Last month", value: "last_month" },
                            { label: "Custom", value: "custom" }
                        ].map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setPeriod(t.value)}
                                aria-pressed={period === t.value}
                                className={`ui-segment shrink-0 whitespace-nowrap ${
                                    period === t.value ? "ui-segment-active" : ""
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Date Inputs if custom period */}
                {period === "custom" && (
                    <div className="-mx-4 mt-4 flex flex-col gap-3 border-t border-slate-100 px-4 pt-4 sm:-mx-5 sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
                        <span className="shrink-0 text-sm font-medium text-slate-500">Custom range:</span>
                        <div className="flex min-w-0 items-center gap-2">
                        <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            aria-label="Custom range start date"
                            className="ui-input min-w-0 flex-1 sm:w-44 sm:flex-none"
                        />
                        <span className="text-sm text-slate-500">to</span>
                        <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            aria-label="Custom range end date"
                            className="ui-input min-w-0 flex-1 sm:w-44 sm:flex-none"
                        />
                        </div>
                        <button
                            onClick={() => {
                                if (activeSection === "overall") fetchOverall();
                                if (activeSection === "hospital_reports") fetchHospitalReport();
                                if (activeSection === "transactions") fetchTransactions();
                            }}
                            className="ui-btn-primary w-full sm:w-auto"
                        >
                            Apply filter
                        </button>
                    </div>
                )}

                {/* 5 Subsections Nav Bar */}
                <div role="tablist" aria-label="Financial management sections" className="no-scrollbar -mx-4 mt-4 flex gap-1.5 overflow-x-auto border-t border-slate-100 px-4 pt-4 sm:-mx-5 sm:px-5">
                    {[
                        { id: "overall", label: "1. Overall dashboard", icon: Layers },
                        { id: "hospital_reports", label: "2. Hospitals & settlements", icon: Building2 },
                        { id: "settlements", label: "3. Settlement ledger", icon: Wallet },
                        { id: "transactions", label: "4. Master ledger", icon: FileText },
                        { id: "refunds", label: "5. Refund management", icon: RotateCcw }
                    ].map((sec) => {
                        const Icon = sec.icon;
                        const isCurrent = activeSection === sec.id;
                        return (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(sec.id as any)}
                                role="tab"
                                aria-selected={isCurrent}
                                className={`flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition ${
                                    isCurrent
                                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                }`}
                            >
                                <Icon className={`h-4 w-4 shrink-0 ${isCurrent ? "text-white" : "text-slate-400"}`} />
                                <span>{sec.label}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ========================================================================= */}
            {/* SUBSECTION 1: OVERALL FINANCIAL DASHBOARD */}
            {/* ========================================================================= */}
            {activeSection === "overall" && (
                <div className="space-y-6">
                    {/* The 8 Aggregate KPI Cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                        {/* 1. Total Consultation Fees */}
                        <div className="ui-card flex flex-col p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <span className="ui-badge border-slate-200 bg-slate-50 text-slate-600">Card 1 • All facilities</span>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                    <Layers className="h-5 w-5" />
                                </span>
                            </div>
                            <div className="mt-2">
                                <h4 className="text-[13px] font-medium leading-snug text-slate-500">Total consultation fees</h4>
                                <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
                                    {loadingOverall ? "..." : fmt(overallData?.totalConsultationFees)}
                                </div>
                                <span className="mt-1 block text-xs leading-snug text-slate-500">Gross booked appointment value</span>
                            </div>
                        </div>

                        {/* 2. Total Online Advances via Pillora */}
                        <div className="ui-card flex flex-col p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">Card 2 • 20% online</span>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <CreditCard className="h-5 w-5" />
                                </span>
                            </div>
                            <div className="mt-2">
                                <h4 className="text-[13px] font-medium leading-snug text-slate-500">Total online advances</h4>
                                <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
                                    {loadingOverall ? "..." : fmt(overallData?.grossOnlineAdvances)}
                                </div>
                                <span className="mt-1 block text-xs leading-snug text-slate-500">Patient advance paid on Pillora.in</span>
                            </div>
                        </div>

                        {/* 3. Total Net Payable to Hospitals */}
                        <div className="ui-card flex flex-col p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <span className="ui-badge border-indigo-200 bg-indigo-50 text-indigo-700">Card 3 • Net payable</span>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <Wallet className="h-5 w-5" />
                                </span>
                            </div>
                            <div className="mt-2">
                                <h4 className="text-[13px] font-medium leading-snug text-slate-500">Total net payable to hospitals</h4>
                                <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
                                    {loadingOverall ? "..." : fmt(overallData?.netPayableToHospitals)}
                                </div>
                                <span className="mt-1 block text-xs leading-snug text-slate-500">Advances minus gateway deductions</span>
                            </div>
                        </div>

                        {/* 4. Total Collected at Clinics – Cash */}
                        <div className="ui-card flex flex-col p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">Card 4 • Physical cash</span>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Banknote className="h-5 w-5" />
                                </span>
                            </div>
                            <div className="mt-2">
                                <h4 className="text-[13px] font-medium leading-snug text-slate-500">Collected at clinics – cash</h4>
                                <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
                                    {loadingOverall ? "..." : fmt(overallData?.totalCashAtClinics)}
                                </div>
                                <span className="mt-1 block text-xs leading-snug text-slate-500">Physical currency collected at clinic</span>
                            </div>
                        </div>

                        {/* 5. Total Collected at Clinics – Online */}
                        <div className="ui-card flex flex-col p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <span className="ui-badge border-teal-200 bg-teal-50 text-teal-700">Card 5 • Clinic online</span>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                    <ArrowUpRight className="h-5 w-5" />
                                </span>
                            </div>
                            <div className="mt-2">
                                <h4 className="text-[13px] font-medium leading-snug text-slate-500">Collected at clinics – online</h4>
                                <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
                                    {loadingOverall ? "..." : fmt(overallData?.totalOnlineAtClinics)}
                                </div>
                                <span className="mt-1 block text-xs leading-snug text-slate-500">Direct UPI / Card at clinic counter</span>
                            </div>
                        </div>

                        {/* 6. Total Gateway Charges & Taxes */}
                        <div className="ui-card flex flex-col p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <span className="ui-badge border-slate-200 bg-slate-50 text-slate-600">Card 6 • Gateway deductions</span>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                    <IndianRupee className="h-5 w-5" />
                                </span>
                            </div>
                            <div className="mt-2">
                                <h4 className="text-[13px] font-medium leading-snug text-slate-500">Gateway charges & taxes</h4>
                                <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
                                    {loadingOverall ? "..." : fmt(overallData?.totalGatewayCharges)}
                                </div>
                                <span className="mt-1 block text-xs leading-snug text-slate-500">2% fee + 18% GST (2.36%)</span>
                            </div>
                        </div>

                        {/* 7. Total Pending Settlements */}
                        <div className="ui-card flex flex-col p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">Card 7 • Owed to hospitals</span>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <Clock className="h-5 w-5" />
                                </span>
                            </div>
                            <div className="mt-2">
                                <h4 className="text-[13px] font-medium leading-snug text-slate-500">Total pending settlements</h4>
                                <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
                                    {loadingOverall ? "..." : fmt(overallData?.totalPendingSettlements)}
                                </div>
                                <span className="mt-1 block text-xs leading-snug text-slate-500">Due for NEFT/RTGS payout</span>
                            </div>
                        </div>

                        {/* 8. Total Completed Settlements */}
                        <div className="ui-card flex flex-col p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">Card 8 • Payouts dispatched</span>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </span>
                            </div>
                            <div className="mt-2">
                                <h4 className="text-[13px] font-medium leading-snug text-slate-500">Completed settlements</h4>
                                <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
                                    {loadingOverall ? "..." : fmt(overallData?.totalCompletedSettlements)}
                                </div>
                                <span className="mt-1 block text-xs leading-snug text-slate-500">Successfully transferred to hospitals</span>
                            </div>
                        </div>
                    </div>

                    {/* Pillora Business Model Reminder Banner */}
                    <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:gap-4 sm:p-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                            <Info className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h5 className="font-semibold text-slate-900">Pillora business model policy</h5>
                            <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                Pillora operates on fixed hospital subscriptions and does <strong className="font-semibold text-slate-900">NOT</strong> earn commission from doctor consultation fees.
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
                <div className="space-y-6">
                    {/* 1. Hospitals Selection & Quick Search Bar */}
                    <div className="ui-card space-y-4 p-4 sm:p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div className="min-w-0">
                                <h3 className="ui-title">Select hospital / clinic</h3>
                                <p className="ui-subtitle">
                                    Click on any hospital to manage bank details, view online advances, calculate date-range settlements, and disburse payouts.
                                </p>
                            </div>
                            <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
                                <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search hospital..."
                                        value={hospSearchTerm}
                                        onChange={(e) => setHospSearchTerm(e.target.value)}
                                        aria-label="Search hospitals"
                                        className="ui-input pl-10"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        fetchHospitalReport();
                                        calculateSettlementForRange();
                                    }}
                                    disabled={loadingHospitalReport}
                                    className="ui-btn-secondary h-11 w-11 shrink-0 px-0"
                                    title="Refresh report"
                                    aria-label="Refresh report"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loadingHospitalReport ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                        </div>

                        {/* Hospital Cards Selector */}
                        <div className="custom-scrollbar grid max-h-64 grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {hospitalsList
                                .filter((h) => !hospSearchTerm.trim() || h.name?.toLowerCase().includes(hospSearchTerm.toLowerCase()) || h.city?.toLowerCase().includes(hospSearchTerm.toLowerCase()))
                                .map((h) => {
                                    const isSelected = selectedHospitalId === h._id;
                                    const hasBank = Boolean(h.bankDetails?.accountNumber);
                                    return (
                                        <button
                                            key={h._id}
                                            onClick={() => setSelectedHospitalId(h._id)}
                                            aria-pressed={isSelected}
                                            className={`relative flex min-h-[72px] flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                                                isSelected
                                                    ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 truncate text-sm font-semibold text-slate-900">{h.name}</div>
                                                {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                                            </div>
                                            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                                                <span className="truncate text-slate-500">
                                                    {h.city || "Facility"}
                                                </span>
                                                <span className={`ui-badge ${
                                                    hasBank ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                                                }`}>
                                                    {hasBank ? "Bank added" : "No bank"}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                        </div>
                    </div>

                    {hospitalReport && (
                        <div className="space-y-6">
                            {/* 2. Hospital Bank Account Details Card (Admin Editable) */}
                            <div className="ui-card space-y-5 p-4 sm:p-6">
                                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[13px] font-medium text-blue-600">
                                                Hospital bank account management
                                            </div>
                                            <h3 className="ui-title mt-0.5">{hospitalReport.hospital?.name}</h3>
                                            <p className="ui-subtitle">
                                                {hospitalReport.hospital?.address} • Phone: {hospitalReport.hospital?.phone || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingBank(!isEditingBank)}
                                        className={`${isEditingBank ? "ui-btn-soft" : "ui-btn-secondary"} ui-btn-sm shrink-0 self-start`}
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        <span>{isEditingBank ? "Close form" : "Edit bank account"}</span>
                                    </button>
                                </div>

                                {/* Bank Form (Always visible or toggleable) */}
                                <form onSubmit={handleSaveBankDetails} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="ui-label">
                                                Account beneficiary / holder name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Ami Clinic Healthcare Pvt Ltd"
                                                value={bankForm.accountHolderName}
                                                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                                                className="ui-input"
                                            />
                                        </div>

                                        <div>
                                            <label className="ui-label">
                                                Bank name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. HDFC Bank, SBI, ICICI"
                                                value={bankForm.bankName}
                                                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                                className="ui-input"
                                            />
                                        </div>

                                        <div>
                                            <label className="ui-label">
                                                Account number <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 50200012345678"
                                                value={bankForm.accountNumber}
                                                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                                                className="ui-input font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label className="ui-label">
                                                IFSC code <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. HDFC0001234"
                                                value={bankForm.ifscCode}
                                                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                                                className="ui-input font-mono uppercase"
                                            />
                                        </div>

                                        <div>
                                            <label className="ui-label">
                                                Branch name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Navrangpura Branch"
                                                value={bankForm.branchName}
                                                onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                                                className="ui-input"
                                            />
                                        </div>

                                        <div>
                                            <label className="ui-label">
                                                Hospital UPI ID (optional)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. hospital@okaxis"
                                                value={bankForm.upiId}
                                                onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                                                className="ui-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="text-sm text-slate-500">
                                            {bankForm.accountNumber ? (
                                                <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                                                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Bank account configured for settlements
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 font-medium text-amber-700">
                                                    <AlertTriangle className="h-4 w-4 shrink-0" /> Please enter bank details to enable payouts
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={savingBankDetails}
                                            className="ui-btn-dark w-full sm:w-auto"
                                        >
                                            {savingBankDetails ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            <span>Save bank account details</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* 3. Hospital Financial Overview Cards (Focusing on Online Advance & 2.36% Deductions) */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                                <div className="ui-card p-4 sm:p-5">
                                    <div className="mb-1 flex items-start justify-between gap-3 text-blue-600">
                                        <span className="text-[13px] font-medium leading-snug text-slate-500">Online advance via Pillora</span>
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50"><Wallet className="h-5 w-5" /></span>
                                    </div>
                                    <p className="break-words text-2xl font-bold tracking-tight text-slate-900">{fmt(hospitalReport.financialSummary?.grossOnlineAdvances)}</p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs leading-snug text-slate-500">
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                        <span>{hospitalReport.financialSummary?.onlineAdvanceCount || 0} patient advances collected (20% fee)</span>
                                    </p>
                                </div>

                                <div className="ui-card p-4 sm:p-5">
                                    <div className="mb-1 flex items-start justify-between gap-3 text-rose-600">
                                        <span className="text-[13px] font-medium leading-snug text-slate-500">Gateway charges (2.36%)</span>
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50"><CreditCard className="h-5 w-5" /></span>
                                    </div>
                                    <p className="break-words text-2xl font-bold tracking-tight text-slate-900">{fmt(hospitalReport.financialSummary?.gatewayCharges)}</p>
                                    <p className="mt-1 text-xs leading-snug text-slate-500">
                                        2% Razorpay + 18% GST deducted per advance
                                    </p>
                                </div>

                                <div className={`ui-card p-4 sm:p-5 ${
                                    (hospitalReport.financialSummary?.pendingSettlement || 0) > 0
                                        ? "border-amber-200"
                                        : (hospitalReport.financialSummary?.awaitingConfirmation || 0) > 0
                                            ? "border-blue-200"
                                            : "border-emerald-200"
                                }`}>
                                    <div className={`mb-1 flex items-start justify-between gap-3 ${
                                        (hospitalReport.financialSummary?.pendingSettlement || 0) > 0
                                            ? "text-amber-600"
                                            : (hospitalReport.financialSummary?.awaitingConfirmation || 0) > 0
                                                ? "text-blue-600"
                                                : "text-emerald-600"
                                    }`}>
                                        <span className="text-[13px] font-medium leading-snug text-slate-500">Net amount Pillora has to pay</span>
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50"><IndianRupee className="h-5 w-5" /></span>
                                    </div>
                                    <p className={`break-words text-2xl font-bold tracking-tight ${
                                        (hospitalReport.financialSummary?.pendingSettlement || 0) > 0
                                            ? "text-amber-700"
                                            : (hospitalReport.financialSummary?.awaitingConfirmation || 0) > 0
                                                ? "text-blue-700"
                                                : "text-emerald-700"
                                    }`}>
                                        {fmt(hospitalReport.financialSummary?.pendingSettlement || 0)}
                                    </p>
                                    <div className="mt-1 text-xs font-medium leading-snug">
                                        {(hospitalReport.financialSummary?.pendingSettlement || 0) > 0 ? (
                                            <span className="flex items-center gap-1.5 text-amber-700">
                                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                                <span>Unsettled patient advances pending payout</span>
                                            </span>
                                        ) : (hospitalReport.financialSummary?.awaitingConfirmation || 0) > 0 ? (
                                            <span className="flex items-center gap-1.5 text-blue-700">
                                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                                <span>{fmt(hospitalReport.financialSummary?.awaitingConfirmation)} sent • awaiting hospital confirmation</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-emerald-700">
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                                <span>All dues settled • ₹0.00 pending to pay</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="ui-card p-4 sm:p-5">
                                    <div className="mb-1 flex items-start justify-between gap-3 text-emerald-600">
                                        <span className="text-[13px] font-medium leading-snug text-slate-500">Total successfully settled</span>
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50"><CheckCircle2 className="h-5 w-5" /></span>
                                    </div>
                                    <p className="break-words text-2xl font-bold tracking-tight text-slate-900">
                                        {fmt(hospitalReport.financialSummary?.alreadySettled || 0)}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs leading-snug text-slate-500">
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                        <span>Transferred & confirmed by hospital</span>
                                    </p>
                                </div>
                            </div>

                            {/* Over-Collection Reconciliation Note */}
                            {Boolean(hospitalReport.financialSummary?.patientOverCollection && hospitalReport.financialSummary?.patientOverCollection > 0) && (
                                <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-2.5">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                        <span>
                                            <strong className="font-semibold">Reconciliation adjustment:</strong> Patient over-collection of <strong className="font-semibold">{fmt(hospitalReport.financialSummary?.patientOverCollection)}</strong> recorded at facility (Total collections: {fmt(hospitalReport.financialSummary?.totalPatientCollections)} vs Total fees: {fmt(hospitalReport.financialSummary?.totalConsultationFees)}).
                                        </span>
                                    </div>
                                    <span className="shrink-0 font-mono font-bold text-amber-800">
                                        +{fmt(hospitalReport.financialSummary?.patientOverCollection)}
                                    </span>
                                </div>
                            )}

                            {/* 4. Date Range Settlement Calculator ("From Date to To Date -> Total Net ₹X") */}
                            <div className="ui-card space-y-5 p-4 sm:p-6">
                                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end">
                                    <div className="min-w-0">
                                        <div className="ui-badge mb-2 border-indigo-200 bg-indigo-50 text-indigo-700">
                                            Settlement range calculation
                                        </div>
                                        <h3 className="ui-title">Calculate payout for custom date range</h3>
                                        <p className="ui-subtitle">
                                            Select &quot;From date&quot; to &quot;To date&quot; to determine the total net amount (₹X) Pillora has to pay to this hospital.
                                        </p>
                                    </div>

                                    {/* Quick Date Presets */}
                                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                                        {[
                                            {
                                                label: "Today",
                                                getDates: () => {
                                                    const today = new Date().toISOString().split("T")[0];
                                                    return { start: today, end: today };
                                                }
                                            },
                                            {
                                                label: "This week",
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
                                                label: "This month",
                                                getDates: () => {
                                                    const now = new Date();
                                                    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
                                                    const end = new Date().toISOString().split("T")[0];
                                                    return { start, end };
                                                }
                                            },
                                            {
                                                label: "All time",
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
                                                className="ui-btn-secondary ui-btn-sm"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Inputs Bar */}
                                <div className="grid grid-cols-1 items-end gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                                    <div>
                                        <label htmlFor="fin-calc-start" className="ui-label">
                                            From date (start)
                                        </label>
                                        <input
                                            type="date"
                                            id="fin-calc-start"
                                            value={calcStartDate}
                                            onChange={(e) => setCalcStartDate(e.target.value)}
                                            className="ui-input"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="fin-calc-end" className="ui-label">
                                            To date (end)
                                        </label>
                                        <input
                                            type="date"
                                            id="fin-calc-end"
                                            value={calcEndDate}
                                            onChange={(e) => setCalcEndDate(e.target.value)}
                                            className="ui-input"
                                        />
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => calculateSettlementForRange(calcStartDate, calcEndDate)}
                                            disabled={loadingCalculation}
                                            className="ui-btn-primary min-h-[44px] w-full"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${loadingCalculation ? "animate-spin" : ""}`} />
                                            <span>Calculate settlement (₹X)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Calculation Results Display */}
                                {rangeCalculation && (
                                    <div className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5">
                                        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end">
                                            <div className="min-w-0">
                                                <span className="text-xs font-medium text-slate-500">
                                                    Period: {fmtDate(rangeCalculation.dateRange?.startDate)} to {fmtDate(rangeCalculation.dateRange?.endDate)}
                                                </span>
                                                <h4 className="mt-0.5 text-base font-semibold text-slate-900">Calculated hospital settlement amount</h4>
                                            </div>
                                            <div className="sm:text-right">
                                                <span className="block text-xs font-medium text-slate-500">Total amount to pay (₹X):</span>
                                                <span className="break-words text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
                                                    {fmt(rangeCalculation.calculation?.netPayable)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                                                <span className="block text-xs font-medium text-slate-500">Online advances</span>
                                                <span className="mt-1 block text-lg font-semibold text-slate-900">
                                                    {rangeCalculation.calculation?.advanceCount || 0} bookings
                                                </span>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                                                <span className="block text-xs font-medium text-slate-500">Gross advances</span>
                                                <span className="mt-1 block break-words text-lg font-semibold text-slate-900">
                                                    {fmt(rangeCalculation.calculation?.grossOnlineAdvances)}
                                                </span>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                                                <span className="block text-xs font-medium text-slate-500">Gateway (2.36%)</span>
                                                <span className="mt-1 block break-words text-lg font-semibold text-rose-600">
                                                    - {fmt(rangeCalculation.calculation?.gatewayCharges)}
                                                </span>
                                            </div>
                                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 sm:p-4">
                                                <span className="block text-xs font-medium text-emerald-700">Net payable (₹X)</span>
                                                <span className="mt-1 block break-words text-lg font-semibold text-emerald-700">
                                                    {fmt(rangeCalculation.calculation?.netPayable)}
                                                </span>
                                            </div>
                                        </div>

                                        {rangeCalculation.calculation?.advanceCount === 0 && (
                                            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                                                <div>
                                                    <span className="block font-semibold text-emerald-900">No pending advances in selected range:</span>
                                                    <span>All online advance bookings within this date range have already been settled and confirmed by the hospital, or no online advances occurred.</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 5. Transfer Money & Send Settlement Request Section */}
                            <div className="ui-card space-y-5 p-4 sm:p-6">
                                <div className="border-b border-slate-100 pb-5">
                                    <div className="ui-badge mb-2 border-emerald-200 bg-emerald-50 text-emerald-700">
                                        <Send className="h-3 w-3" /> Step: Disburse payout & request confirmation
                                    </div>
                                    <h3 className="ui-title">Transfer & send settlement request to hospital</h3>
                                    <p className="ui-subtitle">
                                        After transferring the amount to the hospital&apos;s bank account via NEFT/RTGS/IMPS/UPI, enter the transfer details below and send the request.
                                        The hospital will receive this request in their dashboard (<strong className="font-semibold text-slate-700">pillorahospital.in</strong>) and confirm receipt (&quot;Yes, I have received the money from Pillora&quot;).
                                        <strong className="font-semibold text-slate-700"> The settlement will only be considered completed after approval from the hospital.</strong>
                                    </p>
                                </div>

                                <form onSubmit={handleSendSettlementRequest} className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div>
                                            <label htmlFor="fin-req-amount" className="ui-label">
                                                Settlement amount (₹) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min={1}
                                                step="0.01"
                                                id="fin-req-amount"
                                                value={reqAmount}
                                                onChange={(e) => setReqAmount(Number(e.target.value))}
                                                className="ui-input font-semibold"
                                            />
                                            <span className="ui-hint block">
                                                Pre-filled from range calculation (₹X)
                                            </span>
                                        </div>

                                        <div>
                                            <label htmlFor="fin-req-method" className="ui-label">
                                                Transfer method <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                id="fin-req-method"
                                                value={reqMethod}
                                                onChange={(e) => setReqMethod(e.target.value)}
                                                className="ui-input"
                                            >
                                                <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                                                <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                                                <option value="IMPS">IMPS (Immediate Payment Service)</option>
                                                <option value="UPI">UPI (Unified Payments Interface)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="fin-req-utr" className="ui-label">
                                                UTR / bank ref number <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. UTR123456789"
                                                id="fin-req-utr"
                                                value={reqUtr}
                                                onChange={(e) => setReqUtr(e.target.value)}
                                                className="ui-input font-mono"
                                            />
                                            <span className="ui-hint block">
                                                Bank transfer confirmation number
                                            </span>
                                        </div>

                                        <div>
                                            <label htmlFor="fin-req-notes" className="ui-label">
                                                Notes / remarks
                                            </label>
                                            <input
                                                type="text"
                                                id="fin-req-notes"
                                                placeholder="e.g. Payout for 01-08 Nov"
                                                value={reqNotes}
                                                onChange={(e) => setReqNotes(e.target.value)}
                                                className="ui-input"
                                            />
                                            <span className="ui-hint block">
                                                Optional remarks for hospital
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                        <div>
                                            <span className="block font-semibold text-amber-900">Hospital approval required:</span>
                                            <span>
                                                Clicking below creates a settlement with status <strong className="font-semibold">&quot;Awaiting Hospital Confirmation&quot;</strong>.
                                                The hospital must verify their bank account and click &quot;Confirm Received&quot; in their dashboard. Once confirmed, the settlement status automatically transitions to &quot;Settlement Completed&quot;.
                                            </span>
                                        </div>
                                    </div>

                                    {reqAmount <= 0 && (
                                        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                                            <div>
                                                <span className="block font-semibold text-emerald-900">No pending settlement to send:</span>
                                                <span>All eligible patient advances for this hospital have already been settled or none are due for the selected date range.</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end border-t border-slate-100 pt-4">
                                        <button
                                            type="submit"
                                            disabled={sendingRequest || reqAmount <= 0 || !reqUtr.trim()}
                                            className="ui-btn-success w-full whitespace-normal py-2.5 sm:w-auto"
                                        >
                                            {sendingRequest ? <RefreshCw className="h-4 w-4 shrink-0 animate-spin" /> : <Send className="h-4 w-4 shrink-0" />}
                                            <span>Send settlement request to hospital (₹{reqAmount})</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* 6. Hospital Settlement Requests & History Table */}
                            <div className="ui-card overflow-hidden">
                                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                                    <div>
                                        <h4 className="ui-title">Hospital settlement requests & status</h4>
                                        <p className="ui-subtitle">
                                            Permanent record of all settlement requests sent to this hospital and their verification status.
                                        </p>
                                    </div>
                                    <button
                                        onClick={fetchHospitalReport}
                                        className="ui-btn-secondary ui-btn-sm shrink-0 self-start sm:self-auto"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        <span>Refresh status</span>
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="border-b border-slate-100 bg-slate-50/80">
                                            <tr>
                                                <th className="ui-th">Settlement ID</th>
                                                <th className="ui-th">Period range</th>
                                                <th className="ui-th text-center">Advances</th>
                                                <th className="ui-th text-right">Gross (₹)</th>
                                                <th className="ui-th text-right">Deductions (2.36%)</th>
                                                <th className="ui-th text-right">Net transferred (₹)</th>
                                                <th className="ui-th">Transfer & UTR</th>
                                                <th className="ui-th">Request date</th>
                                                <th className="ui-th text-center">Settlement status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {hospitalReport.settlementHistory && hospitalReport.settlementHistory.length > 0 ? (
                                                hospitalReport.settlementHistory.map((s: any) => (
                                                    <tr key={s._id} className="transition-colors hover:bg-slate-50/60">
                                                        <td className="ui-td whitespace-nowrap font-mono text-xs font-semibold text-blue-600">
                                                            {s.settlementId}
                                                        </td>
                                                        <td className="ui-td whitespace-nowrap text-slate-700">
                                                            {s.startDate && s.endDate ? (
                                                                <span>{fmtDate(s.startDate)} - {fmtDate(s.endDate)}</span>
                                                            ) : (
                                                                <span className="text-slate-500">N/A</span>
                                                            )}
                                                        </td>
                                                        <td className="ui-td text-center font-medium text-slate-900">
                                                            {s.advanceCount || s.paymentIds?.length || 0}
                                                        </td>
                                                        <td className="ui-td text-right font-medium text-slate-700 whitespace-nowrap">
                                                            {fmt(s.grossCollection)}
                                                        </td>
                                                        <td className="ui-td text-right text-rose-600 font-medium whitespace-nowrap">
                                                            - {fmt((s.razorpayCharges || 0) + (s.gstCharges || 0))}
                                                        </td>
                                                        <td className="ui-td text-right font-semibold text-emerald-600 whitespace-nowrap">
                                                            {fmt(s.netAmount)}
                                                        </td>
                                                        <td className="ui-td">
                                                            <div className="font-medium text-slate-900">{s.transferMethod || "NEFT"}</div>
                                                            <div className="font-mono text-xs text-slate-500">{s.utrNumber || "N/A"}</div>
                                                        </td>
                                                        <td className="ui-td whitespace-nowrap text-slate-500">
                                                            {fmtDate(s.transferDate || s.createdAt)}
                                                        </td>
                                                        <td className="ui-td text-center whitespace-nowrap">
                                                            {getSettlementBadge(s.status)}
                                                            {s.confirmationDate && (
                                                                <div className="mt-1 text-xs text-emerald-700">
                                                                    Confirmed: {fmtDate(s.confirmationDate)}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={9} className="ui-td py-12 text-slate-500 sm:text-center">
                                                        No settlement requests sent to this hospital yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 7. Appointments Breakdown Table */}
                            <div className="ui-card overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                                    <div className="min-w-0">
                                        <h4 className="ui-title">Hospital appointment bookings ({hospitalReport.appointments?.length || 0})</h4>
                                        <p className="ui-subtitle">Patient advances, consultation fees, and balances for this hospital.</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="border-b border-slate-100 bg-slate-50/80">
                                            <tr>
                                                <th className="ui-th">Token / ID</th>
                                                <th className="ui-th">Patient</th>
                                                <th className="ui-th">Doctor</th>
                                                <th className="ui-th text-right">Consultation fee</th>
                                                <th className="ui-th text-right">Advance paid (20%)</th>
                                                <th className="ui-th text-right">Balance due (80%)</th>
                                                <th className="ui-th text-right">Balance collected</th>
                                                <th className="ui-th">Payment status</th>
                                                <th className="ui-th">Settlement</th>
                                                <th className="ui-th">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {hospitalReport.appointments?.map((app: any) => (
                                                <tr key={app.appointmentId} className="transition-colors hover:bg-slate-50/60">
                                                    <td className="ui-td whitespace-nowrap font-mono text-xs font-semibold text-slate-900">
                                                        {app.tokenNumber ? `#${app.tokenNumber}` : app.appointmentId.slice(-6).toUpperCase()}
                                                    </td>
                                                    <td className="ui-td font-medium text-slate-900">{app.patientName}</td>
                                                    <td className="ui-td text-slate-700">{app.doctorName}</td>
                                                    <td className="ui-td text-right font-medium text-slate-900 whitespace-nowrap">₹{app.consultationFee}</td>
                                                    <td className="ui-td text-right font-medium text-blue-600 whitespace-nowrap">₹{app.advancePaid}</td>
                                                    <td className="ui-td text-right font-medium text-rose-600 whitespace-nowrap">₹{app.balanceDue}</td>
                                                    <td className="ui-td text-right font-medium text-emerald-600 whitespace-nowrap">₹{app.balancePaid}</td>
                                                    <td className="ui-td capitalize font-medium text-slate-700">{app.paymentStatus}</td>
                                                    <td className="ui-td">{getSettlementBadge(app.settlementStatus)}</td>
                                                    <td className="ui-td whitespace-nowrap text-slate-500">{fmtDate(app.appointmentDate)}</td>
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
                    <div className="ui-card overflow-hidden">
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                            <div className="min-w-0">
                                <h3 className="ui-title">Hospital settlement ledger</h3>
                                <p className="ui-subtitle">
                                    Gross online advances, 2.36% gateway charges, net payable, and outstanding payout tracking.
                                </p>
                            </div>
                            <button
                                onClick={fetchSettlements}
                                disabled={loadingSettlements}
                                className="ui-btn-secondary ui-btn-sm shrink-0 self-start sm:self-auto"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loadingSettlements ? "animate-spin" : ""}`} />
                                <span>Refresh</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-100 bg-slate-50/80">
                                    <tr>
                                        <th className="ui-th">Hospital name</th>
                                        <th className="ui-th">Bank account details</th>
                                        <th className="ui-th text-right">Gross advances</th>
                                        <th className="ui-th text-right">Gateway deductions</th>
                                        <th className="ui-th text-right">Net payable</th>
                                        <th className="ui-th text-right">Already settled</th>
                                        <th className="ui-th text-right">Pending payout</th>
                                        <th className="ui-th">Status</th>
                                        <th className="ui-th text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingSettlements ? (
                                        <tr>
                                            <td colSpan={9} className="ui-td py-12 text-slate-500 sm:text-center">Loading settlements...</td>
                                        </tr>
                                    ) : settlements.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="ui-td py-12 text-slate-500 sm:text-center">No hospital settlement records found.</td>
                                        </tr>
                                    ) : (
                                        settlements.map((s) => {
                                            const hasPendingPayout = s.pendingSettlement > 0;
                                            return (
                                                <tr key={s.hospitalId} className="transition-colors hover:bg-slate-50/60">
                                                    <td className="ui-td font-medium text-slate-900">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedHospitalId(s.hospitalId);
                                                                setActiveSection("hospital_reports");
                                                            }}
                                                            className="group text-left"
                                                        >
                                                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                                                                <span>{s.hospitalName}</span>
                                                                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                                                            </div>
                                                            <div className="text-xs text-slate-500">{s.phone}</div>
                                                        </button>
                                                    </td>
                                                    <td className="ui-td">
                                                        {s.bankDetails?.accountNumber ? (
                                                            <div className="whitespace-nowrap font-mono text-xs text-slate-700">
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
                                                                className="inline-flex min-h-[32px] items-center whitespace-nowrap text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                                                            >
                                                                + Add bank account
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="ui-td text-right font-medium text-slate-900 whitespace-nowrap">{fmt(s.totalGrossAdvances || s.grossOnlineAdvances)}</td>
                                                    <td className="ui-td text-right text-rose-600 font-medium whitespace-nowrap">- {fmt(s.gatewayCharges)}</td>
                                                    <td className="ui-td text-right font-semibold text-slate-900 whitespace-nowrap">{fmt(s.netPayable)}</td>
                                                    <td className="ui-td text-right font-medium text-emerald-600 whitespace-nowrap">{fmt(s.alreadySettled)}</td>
                                                    <td className="ui-td text-right whitespace-nowrap">
                                                        {hasPendingPayout ? (
                                                            <span className="rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                                                                {fmt(s.pendingSettlement)}
                                                            </span>
                                                        ) : (
                                                            <span className="font-medium text-emerald-600">₹0.00</span>
                                                        )}
                                                    </td>
                                                    <td className="ui-td whitespace-nowrap">
                                                        {getSettlementBadge(s.settlementStatus)}
                                                    </td>
                                                    <td className="ui-td text-center whitespace-nowrap">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedHospitalId(s.hospitalId);
                                                                setActiveSection("hospital_reports");
                                                            }}
                                                            className="ui-btn-primary ui-btn-sm"
                                                        >
                                                            <Wallet className="h-3.5 w-3.5" />
                                                            <span>Manage & settle</span>
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
                        <div className="ui-overlay">
                            <div role="dialog" aria-modal="true" aria-labelledby="fin-payout-title" className="ui-dialog sm:max-w-lg">
                                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                                    <div className="min-w-0">
                                        <h3 id="fin-payout-title" className="text-lg font-semibold leading-tight text-slate-900">Record settlement payout</h3>
                                        <p className="mt-0.5 truncate text-sm text-slate-500">Hospital: {payoutModalHosp.hospitalName}</p>
                                    </div>
                                    <button onClick={() => setPayoutModalHosp(null)} aria-label="Close" className="-mr-2 shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">Bank account:</span>
                                        <span className="text-right font-mono font-medium text-slate-900">{payoutModalHosp.bankDetails?.accountNumber || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">IFSC & bank:</span>
                                        <span className="text-right font-medium text-slate-900">{payoutModalHosp.bankDetails?.ifscCode || "N/A"} ({payoutModalHosp.bankDetails?.bankName || "Bank"})</span>
                                    </div>
                                    <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 font-medium text-amber-700">
                                        <span>Outstanding net settlement:</span>
                                        <span className="font-semibold text-amber-700">{fmt(payoutModalHosp.pendingSettlement)}</span>
                                    </div>
                                </div>

                                <form onSubmit={handleRecordPayoutSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="fin-payout-amount" className="ui-label">
                                            Transfer amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            step="0.01"
                                            id="fin-payout-amount"
                                            value={payoutAmount}
                                            onChange={(e) => setPayoutAmount(Number(e.target.value))}
                                            className="ui-input font-semibold"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="fin-payout-method" className="ui-label">
                                                Transfer method
                                            </label>
                                            <select
                                                id="fin-payout-method"
                                                value={payoutMethod}
                                                onChange={(e) => setPayoutMethod(e.target.value)}
                                                className="ui-input"
                                            >
                                                <option value="NEFT">NEFT</option>
                                                <option value="RTGS">RTGS</option>
                                                <option value="IMPS">IMPS</option>
                                                <option value="UPI">UPI</option>
                                                <option value="Other">Other bank transfer</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="fin-payout-utr" className="ui-label">
                                                UTR / ref number <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. UTR123456789"
                                                id="fin-payout-utr"
                                                value={payoutUtr}
                                                onChange={(e) => setPayoutUtr(e.target.value)}
                                                className="ui-input font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="fin-payout-notes" className="ui-label">
                                            Notes / remarks
                                        </label>
                                        <input
                                            type="text"
                                            id="fin-payout-notes"
                                            placeholder="Optional remarks"
                                            value={payoutNotes}
                                            onChange={(e) => setPayoutNotes(e.target.value)}
                                            className="ui-input"
                                        />
                                    </div>

                                    <div className="sticky -bottom-5 -mx-5 -mb-5 mt-2 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
                                        <button
                                            type="button"
                                            onClick={() => setPayoutModalHosp(null)}
                                            className="ui-btn-secondary w-full sm:w-auto"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={payoutSubmitting}
                                            className="ui-btn-primary w-full sm:w-auto"
                                        >
                                            {payoutSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            <span>Confirm settlement payout</span>
                                        </button>
                                    </div>
                                </form>
                                </div>
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
                    <div className="ui-card overflow-hidden">
                        {/* Table Header & Master Filters */}
                        <div className="space-y-4 border-b border-slate-100 p-5 sm:p-6">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div className="min-w-0">
                                    <h3 className="ui-title">Master financial transaction ledger</h3>
                                    <p className="ui-subtitle">
                                        Immutable record of all patient advances, clinic cash/online collections, refunds, and settlements.
                                    </p>
                                </div>
                                <button
                                    onClick={handleExportTxnCSV}
                                    disabled={exportingTxn}
                                    className="ui-btn-success w-full shrink-0 sm:w-auto"
                                >
                                    <Download className="h-4 w-4" />
                                    <span>{exportingTxn ? "Exporting..." : "Export CSV"}</span>
                                </button>
                            </div>

                            {/* Filters Bar */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search txn ID, Rzp ID, patient..."
                                        value={txnSearch}
                                        onChange={(e) => {
                                            setTxnSearch(e.target.value);
                                            setTxnPage(1);
                                        }}
                                        aria-label="Search transactions"
                                        className="ui-input pl-10"
                                    />
                                </div>

                                <select
                                    value={txnTypeFilter}
                                    onChange={(e) => {
                                        setTxnTypeFilter(e.target.value);
                                        setTxnPage(1);
                                    }}
                                    aria-label="Filter by type"
                                    className="ui-input"
                                >
                                    <option value="all">All types</option>
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
                                    aria-label="Filter by source"
                                    className="ui-input"
                                >
                                    <option value="all">All sources</option>
                                    <option value="pillora_online">Pillora online</option>
                                    <option value="clinic_collection">Clinic collection</option>
                                </select>

                                <select
                                    value={txnMethodFilter}
                                    onChange={(e) => {
                                        setTxnMethodFilter(e.target.value);
                                        setTxnPage(1);
                                    }}
                                    aria-label="Filter by method"
                                    className="ui-input"
                                >
                                    <option value="all">All methods</option>
                                    <option value="razorpay">Razorpay</option>
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">Card</option>
                                    <option value="other_online">Other online</option>
                                </select>

                                <select
                                    value={txnStatusFilter}
                                    onChange={(e) => {
                                        setTxnStatusFilter(e.target.value);
                                        setTxnPage(1);
                                    }}
                                    aria-label="Filter by status"
                                    className="ui-input"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="completed">Completed / captured</option>
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
                                    aria-label="Filter by hospital"
                                    className="ui-input"
                                >
                                    <option value="all">All hospitals</option>
                                    {hospitalsList.map((h) => (
                                        <option key={h._id} value={h._id}>{h.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Master Ledger Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-100 bg-slate-50/80">
                                    <tr>
                                        <th className="ui-th">Txn ID / Razorpay ID</th>
                                        <th className="ui-th">Hospital</th>
                                        <th className="ui-th">Patient info</th>
                                        <th className="ui-th text-right">Amount</th>
                                        <th className="ui-th">Type</th>
                                        <th className="ui-th">Source & method</th>
                                        <th className="ui-th text-right">Gateway deductions</th>
                                        <th className="ui-th">Status</th>
                                        <th className="ui-th">Settlement</th>
                                        <th className="ui-th">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingTxns ? (
                                        <tr>
                                            <td colSpan={10} className="ui-td py-12 text-slate-500 sm:text-center">Loading master ledger...</td>
                                        </tr>
                                    ) : transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="ui-td py-12 text-slate-500 sm:text-center">No transactions found matching filters.</td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx) => (
                                            <tr key={tx._id} className="transition-colors hover:bg-slate-50/60">
                                                <td className="ui-td whitespace-nowrap font-mono text-xs font-semibold text-slate-900">
                                                    <div>{tx.transactionId}</div>
                                                    {tx.razorpayPaymentId && (
                                                        <div className="font-normal text-slate-500">{tx.razorpayPaymentId}</div>
                                                    )}
                                                </td>
                                                <td className="ui-td font-medium text-slate-900">{tx.hospitalName}</td>
                                                <td className="ui-td">
                                                    <div className="font-medium text-slate-900">{tx.patientName}</div>
                                                    <div className="text-xs text-slate-500">{tx.patientPhone}</div>
                                                </td>
                                                <td className="ui-td text-right font-semibold text-slate-900 whitespace-nowrap">
                                                    ₹{tx.amount}
                                                </td>
                                                <td className="ui-td capitalize font-medium text-slate-700">{tx.paymentType}</td>
                                                <td className="ui-td">
                                                    <span className="font-medium capitalize text-slate-700">{tx.paymentMethod}</span>
                                                    <div className="text-xs text-slate-500 capitalize">{tx.paymentSource?.replace("_", " ")}</div>
                                                </td>
                                                <td className="ui-td text-right text-slate-500 whitespace-nowrap">
                                                    {tx.gatewayCharges > 0 ? `₹${tx.gatewayCharges}` : "—"}
                                                </td>
                                                <td className="ui-td">
                                                    <span className={`ui-badge capitalize ${txStatusTone(tx.status)}`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="ui-td">{getSettlementBadge(tx.settlementStatus)}</td>
                                                <td className="ui-td text-slate-500 whitespace-nowrap">{fmtDateTime(tx.createdAt)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <span>Showing {transactions.length} of {txnPagination.totalRecords} records</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                                    disabled={txnPage <= 1}
                                    aria-label="Previous page"
                                    className="ui-btn-secondary h-10 w-10 px-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="font-medium text-slate-700">Page {txnPage} of {txnPagination.totalPages}</span>
                                <button
                                    onClick={() => setTxnPage((p) => Math.min(txnPagination.totalPages, p + 1))}
                                    disabled={txnPage >= txnPagination.totalPages}
                                    aria-label="Next page"
                                    className="ui-btn-secondary h-10 w-10 px-0"
                                >
                                    <ChevronRight className="h-4 w-4" />
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
                    <div className="ui-card overflow-hidden">
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                            <div className="min-w-0">
                                <h3 className="ui-title">Cancelled appointments & refund requests</h3>
                                <p className="ui-subtitle">
                                    Cancelled appointments with paid online advances requiring refund processing.
                                </p>
                            </div>
                            <button
                                onClick={fetchRefunds}
                                disabled={loadingRefunds}
                                className="ui-btn-secondary ui-btn-sm shrink-0 self-start sm:self-auto"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loadingRefunds ? "animate-spin" : ""}`} />
                                <span>Refresh</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-100 bg-slate-50/80">
                                    <tr>
                                        <th className="ui-th">Appt ID</th>
                                        <th className="ui-th">Patient</th>
                                        <th className="ui-th">Hospital</th>
                                        <th className="ui-th text-right">Fee</th>
                                        <th className="ui-th text-right">Advance paid</th>
                                        <th className="ui-th text-right">Refund amount</th>
                                        <th className="ui-th">Reason</th>
                                        <th className="ui-th">Refund status</th>
                                        <th className="ui-th">Cancellation date</th>
                                        <th className="ui-th text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingRefunds ? (
                                        <tr>
                                            <td colSpan={10} className="ui-td py-12 text-slate-500 sm:text-center">Loading refund queue...</td>
                                        </tr>
                                    ) : refunds.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="ui-td py-12 text-slate-500 sm:text-center">No pending refund requests found.</td>
                                        </tr>
                                    ) : (
                                        refunds.map((r) => {
                                            const isRefundPending = r.refundStatus === "Pending Approval";
                                            return (
                                                <tr key={r.appointmentId} className="transition-colors hover:bg-slate-50/60">
                                                    <td className="ui-td whitespace-nowrap font-mono text-xs font-semibold text-slate-900">
                                                        {r.appointmentId.slice(-6).toUpperCase()}
                                                    </td>
                                                    <td className="ui-td">
                                                        <div className="font-medium text-slate-900">{r.patientName}</div>
                                                        <div className="text-xs text-slate-500">{r.patientPhone}</div>
                                                    </td>
                                                    <td className="ui-td font-medium text-slate-900">{r.hospitalName}</td>
                                                    <td className="ui-td text-right font-medium text-slate-900 whitespace-nowrap">₹{r.consultationFee}</td>
                                                    <td className="ui-td text-right font-semibold text-blue-600 whitespace-nowrap">₹{r.advancePaid}</td>
                                                    <td className="ui-td text-right font-semibold text-rose-600 whitespace-nowrap">₹{r.refundAmount}</td>
                                                    <td className="ui-td text-slate-600 max-w-xs truncate">{r.cancellationReason || "Patient cancelled"}</td>
                                                    <td className="ui-td">
                                                        <span className={`ui-badge ${
                                                            r.refundStatus === "Refunded"
                                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                                : r.refundStatus === "Pending Approval"
                                                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                                                : "border-slate-200 bg-slate-100 text-slate-600"
                                                        }`}>
                                                            {r.refundStatus}
                                                        </span>
                                                    </td>
                                                    <td className="ui-td whitespace-nowrap text-slate-500">{fmtDate(r.cancellationDate)}</td>
                                                    <td className="ui-td text-center">
                                                        {isRefundPending && (
                                                            <button
                                                                onClick={() => {
                                                                    setRefundModalAppt(r);
                                                                    setRefundAmountInput(r.refundAmount || r.advancePaid);
                                                                    setRefundReasonInput(r.cancellationReason || "Appointment cancelled");
                                                                    setRefundManualNotes("");
                                                                }}
                                                                className="ui-btn-danger ui-btn-sm"
                                                            >
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                                <span>Process refund</span>
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
                        <div className="ui-overlay">
                            <div role="dialog" aria-modal="true" aria-labelledby="fin-refund-title" className="ui-dialog sm:max-w-lg">
                                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                                    <div className="min-w-0">
                                        <h3 id="fin-refund-title" className="text-lg font-semibold leading-tight text-slate-900">Process patient refund</h3>
                                        <p className="mt-0.5 truncate text-sm text-slate-500">Appointment: {refundModalAppt.appointmentId}</p>
                                    </div>
                                    <button onClick={() => setRefundModalAppt(null)} aria-label="Close" className="-mr-2 shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">Patient:</span>
                                        <span className="text-right font-medium text-slate-900">{refundModalAppt.patientName} ({refundModalAppt.patientPhone})</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">Hospital:</span>
                                        <span className="text-right font-medium text-slate-900">{refundModalAppt.hospitalName}</span>
                                    </div>
                                    <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 font-semibold text-blue-700">
                                        <span>Advance Paid via Pillora:</span>
                                        <span>₹{refundModalAppt.advancePaid}</span>
                                    </div>
                                </div>

                                <form onSubmit={handleProcessRefundSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="fin-refund-amount" className="ui-label">
                                            Refund amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            max={refundModalAppt.advancePaid}
                                            step="0.01"
                                            id="fin-refund-amount"
                                            value={refundAmountInput}
                                            onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                                            className="ui-input font-semibold"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="fin-refund-reason" className="ui-label">
                                            Refund reason
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            id="fin-refund-reason"
                                            value={refundReasonInput}
                                            onChange={(e) => setRefundReasonInput(e.target.value)}
                                            className="ui-input"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="fin-refund-notes" className="ui-label">
                                            Internal admin notes (optional)
                                        </label>
                                        <input
                                            type="text"
                                            id="fin-refund-notes"
                                            placeholder="Transaction ref, bank acknowledgement..."
                                            value={refundManualNotes}
                                            onChange={(e) => setRefundManualNotes(e.target.value)}
                                            className="ui-input"
                                        />
                                    </div>

                                    <div className="sticky -bottom-5 -mx-5 -mb-5 mt-2 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
                                        <button
                                            type="button"
                                            onClick={() => setRefundModalAppt(null)}
                                            className="ui-btn-secondary w-full sm:w-auto"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={refundSubmitting}
                                            className="ui-btn-danger w-full sm:w-auto"
                                        >
                                            {refundSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                            <span>Confirm & process refund</span>
                                        </button>
                                    </div>
                                </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
