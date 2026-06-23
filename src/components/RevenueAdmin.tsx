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
    ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RevenueAdmin() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSubTab, setActiveSubTab] = useState<"weekly" | "payments">("weekly");
    const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

    const fetchRevenue = useCallback(async () => {
        try {
            const token = getToken();
            const res = await api.get("/admin/revenue", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setData(res.data);
            } else {
                setError(res.data.message || "Failed to load revenue analytics.");
            }
        } catch (err: any) {
            setError("Failed to fetch revenue analytics data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRevenue();
    }, [fetchRevenue]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'refund_initiated': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'refunded': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'failed': return 'bg-gray-50 text-gray-400 border-gray-100';
            default: return 'bg-blue-50 text-blue-600 border-blue-100';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Retrieving Financial Ledger...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-24 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <p className="text-rose-600 font-bold text-lg mb-2">{error}</p>
                <button onClick={fetchRevenue} className="mt-2 text-blue-600 font-bold hover:underline transition-all">Try Reconnecting</button>
            </div>
        );
    }

    const { totalCollected = 0, breakdown = {}, weeklySummary = [], recentPayments = [] } = data || {};

    return (
        <div className="space-y-10 font-sans">
            {/* Explanatory Policy Banner */}
            <div className="bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent p-6 rounded-3xl border border-blue-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                        <Info className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-base">Advance Booking Fee & Commission Rules</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">
                            Pillora collects a 20% advance payment for doctor consultations. 
                            Hospitals on their <strong>3-month free trial</strong> receive 100% of this fee. 
                            Post-trial, hospitals receive 80% and Pillora retains a 20% platform commission. 
                            Settlements are paid out weekly on Friday at 5:00 PM IST.
                        </p>
                    </div>
                </div>
            </div>

            {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Collected</span>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-950 font-jakarta tracking-tight">{formatCurrency(totalCollected)}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-2">All-time booking fees processed</p>
                </div>

                <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Payout Pool</span>
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-950 font-jakarta tracking-tight">{formatCurrency(breakdown.activeHospitalShare || 0)}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-2">Hospital share (trial + post-trial split)</p>
                </div>

                <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Platform Commissions</span>
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <Percent className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-950 font-jakarta tracking-tight">
                        {formatCurrency((breakdown.activePilloraCommission || 0) + (breakdown.retained || 0))}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-2">Commissions + retained user cancels</p>
                </div>

                <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Refunded</span>
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-950 font-jakarta tracking-tight">{formatCurrency(breakdown.refunded || 0)}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-2">Due to hospital slot cancellations</p>
                </div>
            </div>

            {/* Sub-Tab Navigation */}
            <div className="flex flex-col space-y-6">
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 max-w-fit">
                    <button
                        onClick={() => setActiveSubTab("weekly")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            activeSubTab === "weekly"
                            ? 'bg-white text-blue-600 shadow-md border border-slate-100'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Weekly Payouts
                        <span className="ml-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                            {weeklySummary.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveSubTab("payments")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            activeSubTab === "payments"
                            ? 'bg-white text-blue-600 shadow-md border border-slate-100'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Transaction Log
                        <span className="ml-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                            {recentPayments.length}
                        </span>
                    </button>
                </div>

                {/* Sub-Tab Contents */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-blue-900/5">
                    {activeSubTab === "weekly" ? (
                        <div>
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 font-jakarta">Weekly Settlement Schedules</h3>
                                    <p className="text-slate-400 text-sm font-medium mt-1">Friday payout batches mapped by processing cutoffs</p>
                                </div>
                            </div>

                            {weeklySummary.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">
                                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h4 className="text-base font-bold text-slate-800">No payout cycles scheduled yet</h4>
                                    <p className="text-slate-500 text-xs font-medium">As payments are verified, weekly settlements will be organized here.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                                <th className="py-4 px-6">Payout Date (Friday 5 PM)</th>
                                                <th className="py-4 px-6">Bookings Count</th>
                                                <th className="py-4 px-6">Total Collected</th>
                                                <th className="py-4 px-6">Hospital Share</th>
                                                <th className="py-4 px-6">Pillora Commission</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {weeklySummary.map((item: any) => (
                                                <tr key={item._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all font-semibold text-slate-800 text-sm">
                                                    <td className="py-5 px-6 font-bold text-slate-900">
                                                        {new Date(item._id).toLocaleDateString('en-IN', {
                                                            weekday: 'short',
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="py-5 px-6 text-slate-500 font-bold">
                                                        {item.count} {item.count === 1 ? 'booking' : 'bookings'}
                                                    </td>
                                                    <td className="py-5 px-6 font-bold text-slate-900">
                                                        {formatCurrency(item.totalAmount)}
                                                    </td>
                                                    <td className="py-5 px-6 text-indigo-600 font-bold">
                                                        {formatCurrency(item.payoutAmount)}
                                                    </td>
                                                    <td className="py-5 px-6 text-emerald-600 font-bold">
                                                        {formatCurrency(item.commissionAmount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 font-jakarta">Real-time Transaction Ledger</h3>
                                    <p className="text-slate-400 text-sm font-medium mt-1">Audit logs of verified and completed advance fees</p>
                                </div>
                            </div>

                            {recentPayments.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">
                                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h4 className="text-base font-bold text-slate-800">No transactions recorded yet</h4>
                                    <p className="text-slate-500 text-xs font-medium font-sans">Payment logs will automatically appear once user checkouts are initiated.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentPayments.map((payment: any) => (
                                        <div
                                            key={payment._id}
                                            className="bg-[#FDFDFF] border border-slate-50 rounded-2xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden"
                                        >
                                            <div
                                                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                                                onClick={() => setExpandedPaymentId(expandedPaymentId === payment._id ? null : payment._id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                        <DollarSign className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-bold text-slate-950 text-base">{payment.hospitalId?.name || "Unknown Hospital"}</h4>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(payment.status)}`}>
                                                                {payment.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3.5 h-3.5 text-slate-300" />
                                                                {payment.userId?.name || "Deleted User"}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{payment.userId?.email || ""}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Advance Fee Paid</p>
                                                        <p className="text-base font-extrabold text-slate-950">{formatCurrency(payment.advanceFee)}</p>
                                                    </div>
                                                    <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
                                                    <button className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                                                        {expandedPaymentId === payment._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {expandedPaymentId === payment._id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-slate-100/60 bg-slate-50/20 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-700 font-semibold"
                                                    >
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Razorpay Info</p>
                                                            <p className="text-xs text-slate-800 font-bold mt-1">Order ID: <span className="text-slate-500 font-medium select-all">{payment.razorpayOrderId}</span></p>
                                                            <p className="text-xs text-slate-800 font-bold">Payment ID: <span className="text-slate-500 font-medium select-all">{payment.razorpayPaymentId || "N/A"}</span></p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pricing Breakdown</p>
                                                            <p className="text-xs text-slate-800 font-bold mt-1">Consultation Fee: <span className="text-slate-500 font-medium">{formatCurrency(payment.consultationFee)}</span></p>
                                                            <p className="text-xs text-slate-800 font-bold">Advance booking (20%): <span className="text-slate-500 font-medium">{formatCurrency(payment.advanceFee)}</span></p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</p>
                                                            <p className="text-xs text-slate-800 font-bold mt-1">Created On: <span className="text-slate-500 font-medium">{new Date(payment.createdAt).toLocaleString('en-IN')}</span></p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
